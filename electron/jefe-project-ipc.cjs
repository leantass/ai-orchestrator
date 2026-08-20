const fs = require('fs')
const path = require('path')
const { createFirstVersionFromRun } = require('./jefe-project-creation.cjs')
const { createProjectPersistence } = require('./jefe-project-persistence.cjs')
const registry = require('./jefe-project-registry.cjs')

const CHANNELS = Object.freeze({ create: 'jefe-projects:create-first-version', list: 'jefe-projects:list', get: 'jefe-projects:get', versions: 'jefe-projects:list-versions', snapshot: 'jefe-projects:workspace-snapshot', open: 'jefe-projects:open', copy: 'jefe-projects:copy-location', capabilities: 'jefe-projects:capabilities' })
function safeError(error) { return { ok: false, error: { code: error && error.code ? error.code : 'IPC_FAILED', message: error instanceof Error ? error.message : 'La operación no pudo completarse.' } } }
function id(value, field) { if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u.test(value)) { const error = new Error(`${field} inválido.`); error.code = 'INVALID_ID'; throw error } return value }
function registerCanonicalProjectIpc({ ipcMain, root, shell, clipboard }) {
  const persistence = createProjectPersistence({ root })
  const locks = new Set()
  const registered = ipcMain[Symbol.for('jefe.canonicalProjectChannels')] || new Set()
  ipcMain[Symbol.for('jefe.canonicalProjectChannels')] = registered
  function handle(channel, handler) { if (registered.has(channel)) return; registered.add(channel); ipcMain.handle(channel, async (_event, payload = {}) => { try { return await handler(payload) } catch (error) { return safeError(error) } }) }
  handle(CHANNELS.create, async (payload) => { if (!payload || typeof payload !== 'object' || Object.hasOwn(payload, 'path')) { const error = new Error('El payload no admite paths arbitrarios.'); error.code = 'INVALID_PAYLOAD'; throw error } const key = `${payload.projectId}:${payload.versionId}`; if (locks.has(key)) { const error = new Error('La versión ya está siendo creada.'); error.code = 'VERSION_LOCKED'; throw error } locks.add(key); try { const result = await createFirstVersionFromRun({ ...payload, destinationRoot: root, allowedRoots: [root] }); if (!result.ok) return result; await persistence.registerManifest(result.artifacts.manifestPath); return result } finally { locks.delete(key) } })
  handle(CHANNELS.list, async () => ({ ok: true, projects: await persistence.listProjects() }))
  handle(CHANNELS.get, async (payload) => ({ ok: true, project: await persistence.getProject(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.versions, async (payload) => ({ ok: true, versions: await persistence.listVersions(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.snapshot, async (payload) => ({ ok: true, snapshot: await persistence.workspaceSnapshot(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.capabilities, async () => ({ ok: true, capabilities: registry.CAPABILITY_MATRIX }))
  async function resolveTarget(payload) { const projectId = id(payload.projectId, 'projectId'); const project = await persistence.getProject(projectId); if (!project) { const error = new Error('Proyecto inexistente.'); error.code = 'PROJECT_NOT_FOUND'; throw error } const target = payload.target === 'preview' ? path.join(project.physicalPaths.projectRoot, 'app', 'index.html') : project.delivery.localPath; if (!target || !fs.existsSync(target)) { const error = new Error('El destino solicitado no está disponible.'); error.code = 'TARGET_UNAVAILABLE'; throw error } return target }
  handle(CHANNELS.open, async (payload) => { const target = await resolveTarget(payload); const failure = await shell.openPath(target); return failure ? { ok: false, error: { code: 'OPEN_FAILED', message: 'No se pudo abrir el destino validado.' } } : { ok: true } })
  handle(CHANNELS.copy, async (payload) => { const target = await resolveTarget(payload); clipboard.writeText(target); return { ok: true } })
  return { channels: CHANNELS, persistence, registered }
}
module.exports = { CHANNELS, registerCanonicalProjectIpc }
