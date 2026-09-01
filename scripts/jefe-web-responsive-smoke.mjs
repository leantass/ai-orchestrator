import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-web-responsive-'))
const cases = [[1440, 900], [768, 1024], [390, 844]]
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const freePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)) }) })

async function runCase(width, height) {
  const port = await freePort()
  const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-popup-blocking', `--user-data-dir=${path.join(root, String(width))}`, `--remote-debugging-port=${port}`, '--window-size=1440,900', 'http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'], { stdio: 'ignore', windowsHide: true })
  let socket
  try {
    let page
    for (let attempt = 0; attempt < 50 && !page; attempt += 1) { try { page = (await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())).find((item) => item.type === 'page' && item.webSocketDebuggerUrl) } catch {} if (!page) await wait(200) }
    assert.ok(page, `CDP ausente en ${width}x${height}`)
    socket = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
    let id = 0; const pending = new Map()
    socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const resolve = pending.get(message.id); if (resolve) { pending.delete(message.id); resolve(message.result) } })
    const command = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })) })
    await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); for (let attempt = 0; attempt < 30; attempt += 1) { const loaded = (await command('Runtime.evaluate', { expression: "document.body.innerText.includes('VetNova')", returnByValue: true })).result.value; if (loaded) break; await wait(300) }
    const data = (await command('Runtime.evaluate', { expression: `(() => ({ width: innerWidth, height: innerHeight, title: document.title, text: document.body.innerText, horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth, tabs: [...document.querySelectorAll('.jefe-workspace-tabs button')].map((button) => button.innerText), controls: document.querySelectorAll('button,input,textarea,select,a').length }))()`, returnByValue: true })).result.value
    assert.equal(data.width, width); assert.equal(data.height, height); assert.equal(data.title, 'JEFE | Orquestador de IA Local'); assert.match(data.text, /VetNova/u); assert.match(data.text, /version-v0006/u); assert.match(data.text, /Rechazado/u); assert.doesNotMatch(data.text, /Pendiente de revisiÃ³n/u); assert.doesNotMatch(data.text, /Revisar y aprobar/u); assert.equal(data.horizontal, 0); assert.deepEqual(data.tabs, ['Resumen', 'Construir', 'Materiales', 'Versiones y entrega']); assert.ok(data.controls >= 8)
    return data
  } finally {
    try { if (socket) socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })) } catch {}
    await wait(500); try { socket?.close() } catch {}; child.kill()
  }
}

try { const results = {}; for (const [width, height] of cases) results[`${width}x${height}`] = await runCase(width, height); console.log(JSON.stringify({ ok: true, cases: results })) } finally { await fs.rm(root, { recursive: true, force: true }).catch(() => {}) }
