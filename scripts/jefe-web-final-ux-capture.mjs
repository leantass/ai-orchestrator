import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const output = 'C:\\Users\\letas\\Desktop\\jefe-web-final-ux-review'
const root = path.join(output, '.chrome-profile')
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
await fs.mkdir(output, { recursive: true })
const port = 17681
const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${root}`, `--remote-debugging-port=${port}`, 'http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'], { stdio: 'ignore', windowsHide: true })
let socket
try {
  let page
  for (let attempt = 0; attempt < 60 && !page; attempt += 1) { try { page = (await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())).find((item) => item.type === 'page' && item.webSocketDebuggerUrl) } catch {} if (!page) await wait(200) }
  assert.ok(page)
  socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const resolve = pending.get(message.id); if (resolve) { pending.delete(message.id); resolve(message.result) } })
  const command = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })) })
  const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
  const navigate = async (url) => { await command('Page.navigate', { url }); await wait(1000) }
  const capture = async (name, width, height) => { await command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); await wait(400); const data = await evaluate(`(() => ({ text: document.body.innerText, horizontal: document.documentElement.scrollWidth - document.documentElement.clientWidth, vertical: document.documentElement.scrollHeight - document.documentElement.clientHeight, tabs: [...document.querySelectorAll('.jefe-workspace-tabs button')].map((button) => button.innerText), filePicker: Boolean(document.querySelector('.jefe-file-picker')), memory: document.body.innerText.includes('MEMORIA / QA'), nativeFileWidth: document.querySelector('input[type=file]')?.getBoundingClientRect().width ?? -1 }))()`); const screenshot = await command('Page.captureScreenshot', { format: 'png', fromSurface: true }); await fs.writeFile(path.join(output, `${name}.png`), Buffer.from(screenshot.data, 'base64')); return { name, width, height, ...data } }
  const click = async (label) => { const found = await evaluate(`(() => { const button = [...document.querySelectorAll('.jefe-workspace-tabs button')].find((item) => (item.textContent || '').trim() === ${JSON.stringify(label)}); if (!button) return false; button.click(); return true })()`); assert.equal(found, true, `tab ${label}`); await wait(400) }
  const report = []
  await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); report.push(await capture('01-workspace-resumen', 1440, 900)); assert.match(report.at(-1).text, /MEMORIA \/ QA/u); assert.equal(report.at(-1).horizontal, 0)
  await click('Materiales'); report.push(await capture('02-workspace-materiales', 1440, 900)); assert.equal(report.at(-1).filePicker, true); assert.equal(report.at(-1).nativeFileWidth, 1); assert.match(report.at(-1).text, /Archivos del proyecto/u)
  await click('Resumen'); report.push(await capture('03-workspace-memoria-qa', 1440, 900)); assert.equal(report.at(-1).memory, true)
  await navigate('http://127.0.0.1:17580/projects/vetnova-barrio/versions/version-v0006'); await click('Materiales'); report.push(await capture('04-mobile-materiales', 390, 844)); assert.equal(report.at(-1).filePicker, true); assert.equal(report.at(-1).horizontal, 0); assert.ok(report.at(-1).vertical > 0)
  await fs.writeFile(path.join(output, 'web-final-ux-report.json'), JSON.stringify({ ok: true, projectId: 'vetnova-barrio', versionId: 'version-v0006', immutable: true, captures: report }, null, 2))
  console.log(JSON.stringify({ ok: true, output, captures: report.map(({ name, width, height, horizontal, vertical, filePicker, memory }) => ({ name, width, height, horizontal, vertical, filePicker, memory })) }))
} finally { try { socket?.send(JSON.stringify({ id: 999999, method: 'Browser.close' })) } catch {} await wait(500); try { socket?.close() } catch {}; child.kill() }
