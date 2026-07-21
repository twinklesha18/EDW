import assert from 'node:assert/strict'
const debugPort = process.argv[2] || '9224', orderNumber = process.argv[3]
assert.match(orderNumber || '', /^EDW-\d{4}-\d{6}$/, 'Fixture order number is required')
const targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json())
const target = targets.find((entry) => entry.type === 'page'); assert.ok(target, 'Chrome debug page was not found')
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let commandId = 0, currentRoute = 'login'; const pending = new Map(), exceptions = []
socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); if (message.id && pending.has(message.id)) { const operation = pending.get(message.id); pending.delete(message.id); if (message.error) operation.reject(new Error(message.error.message)); else operation.resolve(message.result) } if (message.method === 'Runtime.exceptionThrown') exceptions.push(`${currentRoute}: ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`) })
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++commandId; pending.set(id, { resolve, reject }); socket.send(JSON.stringify({ id, method, params })) })
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
await send('Runtime.enable'); await send('Page.enable'); await send('Page.navigate', { url: 'http://localhost:5173' }); await wait(800)
const login = await send('Runtime.evaluate', { expression: `fetch('http://localhost:5000/api/auth/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'phase5-browser-customer@example.com',password:'BrowserSecure1',rememberMe:false})}).then(r=>r.json())`, awaitPromise: true, returnByValue: true })
assert.equal(login.result.value.success, true, 'Browser customer login failed')
const routes = [
  ['checkout', 'Complete Your Order'], ['profile/orders', 'My Orders'], [`orders/${orderNumber}`, orderNumber],
  [`order/${orderNumber}`, orderNumber], ['track-order', 'Track Your Order'], ['order-failed', 'Payment Not Completed'], ['order-success', 'Thank You for Your Order'],
]
for (const [route, expected] of routes) {
  currentRoute = route; await send('Page.navigate', { url: `http://localhost:5173/${route}` })
  let page
  for (let attempt = 0; attempt < 30; attempt += 1) { await wait(300); page = await send('Runtime.evaluate', { expression: `({text:document.body.innerText,root:document.getElementById('root')?.childElementCount||0})`, returnByValue: true }); if (page.result.value.text.includes(expected)) break }
  assert.ok(page.result.value.root > 0, `${route} rendered an empty root`); assert.ok(page.result.value.text.includes(expected), `${route} did not render ${expected}`)
}
assert.deepEqual(exceptions, [], `Browser exceptions: ${exceptions.join('; ')}`)
await send('Browser.close').catch(() => {}); socket.close()
console.log(`Phase 5 browser smoke test passed for ${routes.length} checkout and order routes with no runtime exceptions.`)
