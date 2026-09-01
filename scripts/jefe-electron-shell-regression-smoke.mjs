import assert from 'node:assert/strict'
import path from 'node:path'
import net from 'node:net'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const electron = createRequire(import.meta.url)('electron')
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const evidence = 'C:\\Users\\letas\\Desktop\\jefe-shells-post-web-v1-review'
await fs.mkdir(evidence, { recursive: true })
const port = await new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const value = server.address().port; server.close(() => resolve(value)) }) })
const child = spawn(electron, [repo, '--headless', '--disable-gpu', '--no-sandbox', `--remote-debugging-port=${port}`], { cwd: repo, stdio: 'ignore', windowsHide: true })
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function findTarget() { for (let attempt = 0; attempt < 60; attempt += 1) { try { const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json()); const page = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl); if (page) return page } catch {} await wait(250) } throw new Error('Electron no publicó target CDP.') }
const page = await findTarget(); const socket = new WebSocket(page.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0; const pending = new Map(); socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const resolve = pending.get(message.id); if (resolve) { pending.delete(message.id); resolve(message.result) } })
const command = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })) }); const evaluate = (expression) => command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
try {
  await wait(3000)
  const result = (await evaluate(`(async () => { const bridge = window.jefeProjectBridge; const projects = await bridge?.listProjects?.(); const projectsNav = [...document.querySelectorAll('button')].find((item) => item.innerText.trim() === 'Proyectos'); projectsNav?.click(); await new Promise((resolve) => setTimeout(resolve, 800)); const projectButton = [...document.querySelectorAll('button')].find((item) => item.innerText.toLowerCase().includes('vetnova')); if (projectButton) projectButton.click(); await new Promise((resolve) => setTimeout(resolve, 1200)); return { title: document.title, preload: typeof bridge === 'object', projects: projects?.ok === true, workspace: document.body.innerText.includes('Preview real'), projectId: document.body.innerText.includes('VetNova'), auxiliaryWebBlocks: document.querySelectorAll('.jefe-human-status, .jefe-assets-control').length, memoryLabel: document.body.innerText.includes('Memoria/QA'), rawPreviewCode: document.body.innerText.includes('preview_ready'), rawApprovalCode: document.body.innerText.includes('pending_review') } })()`)).result.value
  assert.equal(result.title, 'JEFE | Orquestador de IA Local'); assert.equal(result.preload, true); assert.equal(result.projects, true); assert.equal(result.workspace, true); assert.equal(result.projectId, true); assert.equal(result.auxiliaryWebBlocks, 0); assert.equal(result.memoryLabel, false); assert.equal(result.rawPreviewCode, false); assert.equal(result.rawApprovalCode, false); await evaluate('window.scrollTo(0, 0)'); await wait(300); const top = await command('Page.captureScreenshot', { format: 'png', fromSurface: true }); await fs.writeFile(path.join(evidence, 'electron-workspace-top.png'), Buffer.from(top.data, 'base64')); await evaluate('window.scrollTo(0, document.body.scrollHeight)'); await wait(300); const bottom = await command('Page.captureScreenshot', { format: 'png', fromSurface: true }); await fs.writeFile(path.join(evidence, 'electron-workspace-bottom.png'), Buffer.from(bottom.data, 'base64')); console.log(JSON.stringify({ ok: true, result, evidence }))
} finally { try { socket.send(JSON.stringify({ id: ++id, method: 'Browser.close' })) } catch {} await wait(800); try { socket.close() } catch {}; child.kill() }
