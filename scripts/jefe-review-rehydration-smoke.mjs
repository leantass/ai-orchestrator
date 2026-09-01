import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { createPreviewApprovalService, registerPreviewApprovalIpc } = require('../electron/jefe-preview-approval.cjs')
const { createJefeWebServer } = require('../electron/jefe-web-server.cjs')
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-review-rehydration-'))
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const freePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close(() => resolve(port)) }) })
const check = (value, message) => assert.equal(value, true, message)
let webRuntime
let browser
let socket
let passed = false

async function browserCommand(command, method, params = {}) { return new Promise((resolve) => { const requestId = ++command.id; command.pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })) }) }
async function openAndInspect(url) {
  const port = await freePort()
  browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(root, 'chrome'), '--remote-debugging-port=' + port, '--window-size=1440,900', url], { stdio: 'ignore', windowsHide: true })
  let page
  for (let attempt = 0; attempt < 50 && !page; attempt += 1) { try { page = (await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json())).find((item) => item.type === 'page' && item.webSocketDebuggerUrl) } catch {} if (!page) await wait(200) }
  assert.ok(page, 'CDP de Chromium disponible')
  socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  const command = { id: 0, pending: new Map() }
  socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const resolve = command.pending.get(message.id); if (resolve) { command.pending.delete(message.id); resolve(message.result) } })
  const run = (method, params) => browserCommand(command, method, params)
  const evaluate = async (expression) => (await run('Runtime.evaluate', { expression, returnByValue: true })).result.value
  for (let attempt = 0; attempt < 40; attempt += 1) { if (await evaluate("document.body.innerText.includes('Preview rehydration')")) break; await wait(250) }
  const inspect = () => evaluate(`(() => ({ title: document.title, controls: [...document.querySelectorAll('button')].map((button) => button.innerText.trim()), text: document.body.innerText, path: location.pathname }))()`)
  check((await inspect()).text.includes('Aprobar preview'), 'la decisión durable aparece al entrar al workspace')
  await run('Page.navigate', { url: `${webRuntime.url}/projects` }); await wait(400); await run('Page.navigate', { url }); await wait(700)
  check((await inspect()).text.includes('Aprobar preview'), 'la decisión se rehidrata al volver desde Proyectos')
  await run('Page.reload'); await wait(700)
  const afterRefresh = await inspect(); check(afterRefresh.text.includes('Aprobar preview'), 'la decisión se rehidrata después de refresh')
  check(afterRefresh.path.includes('/projects/rehydration-project/versions/rehydration-version'), 'deep-link permanece en el proyecto y versión')
}

try {
  const created = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'rehydration-project', runId: 'rehydration-run', versionId: 'rehydration-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Preview rehydration', brief: 'Fixture aislada para rehidratación.', brandSpec: { name: 'Preview rehydration' } })
  check(created.ok === true, 'fixture creada')
  const persistence = createProjectPersistence({ root }); await persistence.registerManifest(created.artifacts.manifestPath)
  const service = createPreviewApprovalService({ root, reviewerIdentity: 'smoke-human' })
  const input = { projectId: 'rehydration-project', runId: 'rehydration-run', versionId: 'rehydration-version', resourceId: 'app-index' }
  const preview = await service.request(input)
  check((await service.readApproval(input.projectId, preview.previewRequestId)).state === 'pending_review', 'estado inicial pending_review')
  await service.review({ projectId: input.projectId, previewRequestId: preview.previewRequestId, decision: 'viewed' })
  const persisted = await service.readApproval(input.projectId, preview.previewRequestId)
  check(persisted.state === 'reviewed' && persisted.revision === 1, 'reviewed persistido con revision 1')
  check(persisted.snapshotSha256 === preview.versionSnapshot.snapshotSha256, 'snapshot persistido coincide')

  const handlers = new Map(); registerPreviewApprovalIpc({ ipcMain: { handle: (channel, handler) => handlers.set(channel, handler) }, root, reviewerIdentity: 'smoke-human' })
  const ipcRead = await handlers.get('jefe-preview:approval-read')(null, { projectId: input.projectId, previewRequestId: preview.previewRequestId })
  check(ipcRead.ok === true && ipcRead.approval.state === 'reviewed', 'IPC devuelve el estado durable rehidratable')

  webRuntime = createJefeWebServer({ root, distRoot: path.join(repoRoot, 'dist'), port: 0 }); await webRuntime.start()
  await openAndInspect(`${webRuntime.url}/projects/rehydration-project/versions/rehydration-version`)

  const second = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'rehydration-project', runId: 'rehydration-run-two', versionId: 'rehydration-version-two', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Preview rehydration', brief: 'Segunda fixture de control.', brandSpec: { name: 'Preview rehydration' } }); await persistence.registerManifest(second.artifacts.manifestPath)
  const secondPreview = await service.request({ ...input, runId: 'rehydration-run-two', versionId: 'rehydration-version-two' }); const secondApproval = await service.readApproval(input.projectId, secondPreview.previewRequestId)
  check(secondApproval.state === 'pending_review' && secondPreview.previewRequestId !== preview.previewRequestId, 'nueva version exige revisión independiente')
  await fs.appendFile(created.artifacts.manifestPath.replace('manifest.json', 'app/index.html'), '\n<!-- stale fixture -->\n', 'utf8')
  await assert.rejects(() => service.readApproval(input.projectId, preview.previewRequestId), { code: 'PREVIEW_STALE' })
  passed = true
  console.log(JSON.stringify({ ok: true, durableState: 'reviewed', reentry: 'PASS', refresh: 'PASS', deepLink: 'PASS', ipc: 'PASS', newVersionIsolation: 'PASS', staleSnapshot: 'PASS' }))
} finally {
  try { if (socket) socket.send(JSON.stringify({ id: 999999, method: 'Browser.close' })) } catch {}
  await wait(300); try { socket?.close() } catch {}; try { browser?.kill() } catch {}
  if (webRuntime) await Promise.race([webRuntime.close().catch(() => {}), wait(500)])
  await fs.rm(root, { recursive: true, force: true }).catch(() => {})
  if (passed) process.exit(0)
}
