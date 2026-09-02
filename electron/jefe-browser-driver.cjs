const fs = require('node:fs')
const fsp = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const net = require('node:net')
const { spawn } = require('node:child_process')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function executable() {
  return [
    process.env.JEFE_BROWSER_EXECUTABLE,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ].filter(Boolean).find((item) => fs.existsSync(item)) || null
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
  })
}

async function connect(target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })

  let sequence = 0
  const pending = new Map()
  const listeners = new Map()
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    const request = pending.get(message.id)
    if (request) {
      pending.delete(message.id)
      clearTimeout(request.timer)
      if (message.error) request.reject(Object.assign(new Error(message.error.message), { code: message.error.code }))
      else request.resolve(message.result)
    }
    if (message.method) for (const listener of listeners.get(message.method) || []) listener(message.params || {})
  })

  const command = (method, params = {}, timeout = 5000) => new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(Object.assign(new Error(`CDP command timed out: ${method}`), { code: 'CDP_COMMAND_TIMEOUT' }))
    }, timeout)
    pending.set(id, { resolve, reject, timer })
    socket.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value
  const on = (name, handler) => { const current = listeners.get(name) || []; current.push(handler); listeners.set(name, current) }
  const setViewport = async ({ width, height, deviceScaleFactor = 1, mobile = false }) => {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('INVALID_VIEWPORT')
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor, mobile, screenWidth: width, screenHeight: height })
    return getViewportMetrics()
  }
  const getViewportMetrics = async () => ({
    runtime: await evaluate('({innerWidth,innerHeight,clientWidth:document.documentElement.clientWidth,clientHeight:document.documentElement.clientHeight,visualWidth:visualViewport?.width||0,visualHeight:visualViewport?.height||0})'),
    layout: await command('Page.getLayoutMetrics')
  })
  const assertUsableViewport = async () => {
    const metrics = await getViewportMetrics()
    if (!metrics.runtime.innerWidth || !metrics.runtime.innerHeight) throw new Error('VIEWPORT_NOT_INITIALIZED')
    if (!metrics.layout.cssLayoutViewport?.clientWidth || !metrics.layout.cssLayoutViewport?.clientHeight) throw new Error('LAYOUT_VIEWPORT_ZERO')
    if (!metrics.runtime.visualWidth || !metrics.runtime.visualHeight) throw new Error('VISUAL_VIEWPORT_ZERO')
    return metrics
  }
  const goto = async (url) => {
    await command('Page.navigate', { url })
    return waitForFunction("document.readyState==='complete'")
  }
  const waitForFunction = async (expression, timeout = 5000) => {
    for (let elapsed = 0; elapsed < timeout; elapsed += 100) {
      if (await evaluate(expression)) return true
      await delay(100)
    }
    throw new Error('WAIT_FOR_FUNCTION_TIMEOUT')
  }
  const click = async (selector) => {
    await assertUsableViewport()
    const box = await evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e) throw new Error('ELEMENT_NOT_FOUND'); const r=e.getBoundingClientRect(); const s=getComputedStyle(e); return {x:r.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height,visible:r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none',inViewport:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight} })()`)
    if (!box?.visible) throw new Error('ELEMENT_CSS_HIDDEN')
    if (!box.inViewport) throw new Error('ELEMENT_OUTSIDE_VIEWPORT')
    const documentNode = await command('DOM.getDocument', { depth: -1 })
    const node = await command('DOM.querySelector', { nodeId: documentNode.root.nodeId, selector })
    if (!node.nodeId) throw new Error('ELEMENT_NOT_FOUND')
    const model = await command('DOM.getBoxModel', { nodeId: node.nodeId })
    if (!model.model?.border?.length) throw new Error('BOX_MODEL_UNAVAILABLE')
    const target = await evaluate(`(() => { const e=document.elementFromPoint(${box.x},${box.y}); return !!e && (e.matches(${JSON.stringify(selector)}) || !!e.closest(${JSON.stringify(selector)})) })()`)
    if (!target) throw new Error('CLICK_TARGET_MISMATCH')
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: box.x, y: box.y, button: 'none' })
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', clickCount: 1 })
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', clickCount: 1 })
    return { ...box, boxModel: model.model }
  }

  return {
    url: target.url, command, evaluate, on, setViewport, getViewportMetrics, assertUsableViewport, goto, click,
    focus: (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)})?.focus()`),
    type: (selector, value) => evaluate(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); e.focus(); e.value=${JSON.stringify(value)}; e.dispatchEvent(new Event('input',{bubbles:true})); return e.value })()`),
    press: async (key) => { await command('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key }); await command('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key }) },
    waitForFunction, close: () => socket.close()
  }
}

async function launch({ url, headless = true, timeout = 10000 } = {}) {
  const exe = executable()
  if (!exe) throw Object.assign(new Error('BROWSER_EXECUTABLE_NOT_FOUND'), { code: 'BROWSER_EXECUTABLE_NOT_FOUND' })
  const debugPort = await freePort()
  const profile = await fsp.mkdtemp(path.join(os.tmpdir(), 'jefe-browser-driver-'))
  const child = spawn(exe, [`--headless=${headless ? 'new' : 'false'}`, '--window-size=800,600', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-extensions', `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`, ...(url ? [url] : [])], { stdio: 'ignore', windowsHide: true })
  let target
  for (let i = 0; i < timeout / 100 && !target; i += 1) {
    try { target = (await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json())).find((item) => item.type === 'page' && (!url || item.url === url)) } catch {}
    if (!target) await delay(100)
  }
  if (!target) { child.kill(); await fsp.rm(profile, { recursive: true, force: true }); throw new Error('BROWSER_PAGE_TIMEOUT') }
  const contexts = []
  return {
    executable: path.basename(exe), headless,
    async page() { const page = await connect(target); await page.command('Page.enable'); await page.command('Runtime.enable'); await page.command('DOM.enable'); contexts.push(page); return page },
    async close() { contexts.forEach((page) => page.close()); child.kill(); await delay(200); await fsp.rm(profile, { recursive: true, force: true }).catch(() => {}) }
  }
}

module.exports = { launch, executable, delay }
