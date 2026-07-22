import assert from 'node:assert/strict'

const debugPort = process.argv[2] || '9227'
const targets = await fetch(`http://127.0.0.1:${debugPort}/json`).then((response) => response.json())
const target = targets.find((entry) => entry.type === 'page')
assert.ok(target, 'Chrome debug page was not found')

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  const timeout = setTimeout(() => reject(new Error('Chrome DevTools connection timed out')), 10000)
  socket.addEventListener('open', () => { clearTimeout(timeout); resolve() }, { once: true })
  socket.addEventListener('error', (error) => { clearTimeout(timeout); reject(error) }, { once: true })
})

let commandId = 0
let currentRoute = 'startup'
const pending = new Map()
const exceptions = []

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  }
  if (message.method === 'Runtime.exceptionThrown') {
    exceptions.push(`${currentRoute}: ${message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text}`)
  }
})

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++commandId
  pending.set(id, { resolve, reject })
  socket.send(JSON.stringify({ id, method, params }))
})
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

await send('Runtime.enable')
await send('Page.enable')

const publicRoutes = [
  '/', '/shop', '/categories', '/contact', '/faq',
  '/shipping', '/returns', '/privacy', '/terms', '/cart', '/track-order', '/login',
  '/register', '/forgot-password', '/page-that-does-not-exist',
]
const customerRoutes = ['/custom-orders', '/profile', '/profile/orders', '/profile/custom-orders', '/profile/custom-orders/64ed00000000000000000001', '/profile/addresses', '/profile/settings', '/wishlist', '/checkout']
const adminRoutes = [
  '/admin/dashboard', '/admin/products', '/admin/products/new', '/admin/categories',
  '/admin/orders', '/admin/cancellations', '/admin/custom-orders', '/admin/custom-orders/64ed00000000000000000001', '/admin/users', '/admin/reviews',
  '/admin/banners', '/admin/settings',
]

async function login(email) {
  const result = await send('Runtime.evaluate', {
    expression: `fetch('http://localhost:5000/api/auth/login',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(email)},password:'ResponsiveSecure1',rememberMe:false})}).then(response=>response.json())`,
    awaitPromise: true,
    returnByValue: true,
  })
  assert.equal(result.result.value.success, true, `Login failed for ${email}`)
}

async function logout() {
  await send('Runtime.evaluate', {
    expression: "fetch('http://localhost:5000/api/auth/logout',{method:'POST',credentials:'include'}).then(response=>response.json())",
    awaitPromise: true,
    returnByValue: true,
  })
}

async function visit(route, width) {
  currentRoute = `${route} at ${width}px`
  await send('Page.navigate', { url: `http://localhost:5173${route}` })

  let page
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await wait(250)
    page = await send('Runtime.evaluate', {
      expression: `({
        rootChildren: document.getElementById('root')?.childElementCount || 0,
        textLength: document.body.innerText.trim().length,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        path: window.location.pathname
      })`,
      returnByValue: true,
    })
    if (page.result.value.rootChildren > 0 && page.result.value.textLength > 20) break
  }

  const metrics = page.result.value
  assert.ok(metrics.rootChildren > 0, `${currentRoute} rendered an empty root`)
  assert.ok(metrics.textLength > 20, `${currentRoute} rendered insufficient content`)
  assert.ok(metrics.scrollWidth <= metrics.clientWidth, `${currentRoute} overflows horizontally: ${metrics.scrollWidth}px > ${metrics.clientWidth}px`)
  assert.ok(metrics.bodyScrollWidth <= metrics.clientWidth, `${currentRoute} body overflows horizontally: ${metrics.bodyScrollWidth}px > ${metrics.clientWidth}px`)
  return metrics
}

for (const width of [320, 768]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 600 })

  await logout()
  for (const route of publicRoutes) await visit(route, width)
  const protectedCustomOrder = await visit('/custom-orders', width)
  assert.equal(protectedCustomOrder.path, '/login', 'Logged-out customers must be redirected to login before placing a custom order')

  await send('Page.navigate', { url: 'http://localhost:5173/' })
  await wait(400)
  await login('responsive-customer@edw.test')
  for (const route of customerRoutes) await visit(route, width)

  await logout()
  await login('responsive-admin@edw.test')
  for (const route of adminRoutes) await visit(route, width)
}

assert.deepEqual(exceptions, [], `Browser exceptions: ${exceptions.join('; ')}`)
await send('Browser.close').catch(() => {})
socket.close()
console.log(`Responsive browser smoke test passed for ${publicRoutes.length + customerRoutes.length + adminRoutes.length} routes at 320px and 768px with no horizontal overflow.`)
