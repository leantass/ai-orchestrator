import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../../electron/jefe-project-persistence.cjs')
const { createPreviewApprovalService } = require('../../electron/jefe-preview-approval.cjs')
const { createJefeWebServer } = require('../../electron/jefe-web-server.cjs')
const { closePreviewServers } = require('../../electron/jefe-preview-http-server.cjs')

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

export async function createJefeWebSmokeHarness({ distRoot }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-web-isolated-'))
  const projectId = 'web-smoke-project'
  const runId = 'web-smoke-run'
  const versionId = 'version-web-smoke'
  let server
  try {
    const created = await createFirstVersionFromRun({
      destinationRoot: root,
      allowedRoots: [root],
      projectId,
      runId,
      versionId,
      projectType: 'agency_site',
      platform: 'web',
      generationProfile: 'commercial_site',
      creativeDirection: 'editorial',
      projectName: 'Proyecto Smoke Web',
      brief: 'Sitio comercial sintético para validar el workspace web.',
      businessType: 'estudio digital',
      audience: 'equipos que necesitan una web clara',
      proposition: 'Una experiencia web autónoma y verificable.',
      primaryCta: 'Conversar sobre el proyecto',
      brandSpec: { name: 'Proyecto Smoke Web' },
    })
    if (!created.ok) throw new Error(`No se pudo crear el fixture sintético: ${created.error?.message || 'error desconocido'}`)
    const persistence = createProjectPersistence({ root })
    await persistence.registerManifest(created.artifacts.manifestPath)
    const preview = createPreviewApprovalService({ root, reviewerIdentity: 'web-smoke' })
    const previewRecord = await preview.request({ projectId, runId, versionId, resourceId: 'app-index' })
    server = createJefeWebServer({ root, distRoot, port: 0 })
    await server.start()
    return {
      root,
      projectId,
      runId,
      versionId,
      previewRequestId: previewRecord.previewRequestId,
      baseUrl: server.url,
      workspaceUrl: `${server.url}/projects/${projectId}/versions/${versionId}`,
      async close() {
        await server.close()
        await closePreviewServers()
        await fs.rm(root, { recursive: true, force: true })
      },
    }
  } catch (error) {
    if (server) await server.close().catch(() => {})
    await closePreviewServers().catch(() => {})
    await fs.rm(root, { recursive: true, force: true }).catch(() => {})
    throw error
  }
}

export async function launchIsolatedChrome(url, label) {
  const profile = await fs.mkdtemp(path.join(os.tmpdir(), `jefe-web-chrome-${label}-`))
  const remotePortServer = await import('node:net').then(({ default: net }) => new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => { const port = probe.address().port; probe.close(() => resolve(port)) })
  }))
  const child = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--disable-popup-blocking', `--user-data-dir=${profile}`, `--remote-debugging-port=${remotePortServer}`, '--window-size=1440,900', url], { stdio: 'ignore', windowsHide: true })
  const pages = async () => fetch(`http://127.0.0.1:${remotePortServer}/json/list`).then((response) => response.json())
  const pageFor = async (predicate) => { for (let attempt = 0; attempt < 80; attempt += 1) { try { const page = (await pages()).find(predicate); if (page?.webSocketDebuggerUrl) return page } catch {} await wait(100) } throw new Error('CDP page unavailable') }
  return {
    child,
    profile,
    async pageFor(predicate) { return pageFor(predicate) },
    async close() { child.kill(); await wait(300); await fs.rm(profile, { recursive: true, force: true }).catch(() => {}) },
  }
}

export async function connectCdp(page) {
  const socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  let id = 0
  const pending = new Map()
  socket.addEventListener('message', (event) => { const message = JSON.parse(event.data); const resolve = pending.get(message.id); if (resolve) { pending.delete(message.id); resolve(message.result) } })
  const command = (method, params = {}) => new Promise((resolve) => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })) })
  const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value
  return { socket, command, evaluate, close() { socket.close() } }
}

export { wait }
