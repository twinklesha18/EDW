import assert from 'node:assert/strict'
const debugPort = process.argv[2] || '9223'
const targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json())
const target = targets.find((entry) => entry.type === 'page')
assert.ok(target, 'Chrome debug page was not found')
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let commandId = 0, currentRoute = 'login'
const pending = new Map(), exceptions = []
socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const { resolve, reject } = pending.get(message.id); pending.delete(message.id); if (message.error) reject(new Error(message.error.message)); else resolve(message.result) } if (message.method === 'Runtime.exceptionThrown') exceptions.push(`${currentRoute}: ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`) })
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++commandId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })) })
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
await send('Runtime.enable'); await send('Page.enable')
await send('Page.navigate', { url: 'http://localhost:5173' })
await wait(1000)
const login = await send('Runtime.evaluate', { expression: `fetch('http://localhost:5000/api/auth/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'phase4-browser-admin@example.com',password:'BrowserSecure1',rememberMe:false})}).then(r=>r.json())`, awaitPromise: true, returnByValue: true })
assert.equal(login.result.value.success, true, 'Browser admin login failed')
const routes = ['dashboard', 'products', 'products/new', 'categories', 'orders', 'users', 'reviews', 'banners', 'settings']
for (const route of routes) {
  currentRoute = route
  await send('Page.navigate', { url: `http://localhost:5173/admin/${route}` })
  let page
  for (let attempt = 0; attempt < 20; attempt += 1) { await wait(500); page = await send('Runtime.evaluate', { expression: `({text:document.body.innerText,root:document.getElementById('root')?.childElementCount||0})`, returnByValue: true }); if (page.result.value.root > 0 && page.result.value.text.trim().length > 20) break }
  assert.ok(page.result.value.root > 0, `${route} rendered an empty root. ${exceptions.join('; ')}`)
  assert.ok(page.result.value.text.trim().length > 20, `${route} rendered insufficient content. ${exceptions.join('; ')}`)
}
currentRoute = 'admin profile redirect'
await send('Page.navigate', { url: 'http://localhost:5173/profile' })
let redirectedPath = ''
for (let attempt = 0; attempt < 20; attempt += 1) { await wait(250); const location = await send('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true }); redirectedPath = location.result.value; if (redirectedPath === '/admin/dashboard') break }
assert.equal(redirectedPath, '/admin/dashboard', 'Admin must be redirected away from the customer profile')
currentRoute = 'admin logout'
const logout = await send('Runtime.evaluate', { expression: `(()=>{const button=[...document.querySelectorAll('button')].find(item=>item.textContent.trim()==='Logout');if(button){button.click();return true}return false})()`, returnByValue: true })
assert.equal(logout.result.value, true, 'Admin dashboard logout button was not found')
let logoutPath = ''
for (let attempt = 0; attempt < 20; attempt += 1) { await wait(250); const location = await send('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true }); logoutPath = location.result.value; if (logoutPath === '/') break }
assert.equal(logoutPath, '/', 'Admin logout must return to the storefront home page')
assert.deepEqual(exceptions, [], `Browser exceptions: ${exceptions.join('; ')}`)
await send('Browser.close').catch(() => {})
socket.close()
console.log(`Admin browser smoke test passed for ${routes.length} routes, customer-profile redirect, in-dashboard logout, and storefront return with no runtime exceptions.`)
