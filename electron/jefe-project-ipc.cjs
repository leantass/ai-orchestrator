const fs = require('fs')
const path = require('path')
const { createFirstVersionFromRun } = require('./jefe-project-creation.cjs')
const { createProjectPersistence } = require('./jefe-project-persistence.cjs')
const { createProjectLifecycle } = require('./jefe-project-lifecycle.cjs')
const { resolvePreview } = require('./jefe-project-preview.cjs')
const registry = require('./jefe-project-registry.cjs')

const CHANNELS = Object.freeze({ create: 'jefe-projects:create-first-version', list: 'jefe-projects:list', get: 'jefe-projects:get', versions: 'jefe-projects:list-versions', snapshot: 'jefe-projects:workspace-snapshot', open: 'jefe-projects:open', copy: 'jefe-projects:copy-location', capabilities: 'jefe-projects:capabilities', createVersion: 'jefe-projects:create-version', approveVersion: 'jefe-projects:approve-version', history: 'jefe-projects:history', compare: 'jefe-projects:compare', restore: 'jefe-projects:restore', prepareDelivery: 'jefe-projects:prepare-local-delivery', preview: 'jefe-projects:preview' })
function safeError(error) { return { ok: false, error: { code: error && error.code ? error.code : 'IPC_FAILED', message: error instanceof Error ? error.message : 'La operación no pudo completarse.' } } }
function id(value, field) { if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u.test(value)) { const error = new Error(`${field} inválido.`); error.code = 'INVALID_ID'; throw error } return value }
function noPathPayload(payload) { if (!payload || typeof payload !== 'object' || Object.hasOwn(payload, 'path') || Object.hasOwn(payload, 'filePath') || Object.hasOwn(payload, 'destinationRoot')) { const error = new Error('El payload no admite paths arbitrarios.'); error.code = 'INVALID_PAYLOAD'; throw error } }
function registerCanonicalProjectIpc({ ipcMain, root, shell, clipboard }) {
  const persistence = createProjectPersistence({ root })
  const lifecycle = createProjectLifecycle({ root, persistence })
  const locks = new Set()
  const registered = ipcMain[Symbol.for('jefe.canonicalProjectChannels')] || new Set()
  ipcMain[Symbol.for('jefe.canonicalProjectChannels')] = registered
  function handle(channel, handler) { if (registered.has(channel)) return; registered.add(channel); ipcMain.handle(channel, async (_event, payload = {}) => { try { return await handler(payload) } catch (error) { return safeError(error) } }) }
  handle(CHANNELS.create, async (payload) => { noPathPayload(payload); const key = `${payload.projectId}:${payload.versionId}`; if (locks.has(key)) { const error = new Error('La versión ya está siendo creada.'); error.code = 'VERSION_LOCKED'; throw error } locks.add(key); try { const result = await createFirstVersionFromRun({ ...payload, destinationRoot: root, allowedRoots: [root] }); if (!result.ok) return result; await persistence.registerManifest(result.artifacts.manifestPath); await lifecycle.ensureCreated(result.project); return result } finally { locks.delete(key) } })
  handle(CHANNELS.list, async () => ({ ok: true, projects: await persistence.listProjects() }))
  handle(CHANNELS.get, async (payload) => ({ ok: true, project: await persistence.getProject(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.versions, async (payload) => ({ ok: true, versions: await persistence.listVersions(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.snapshot, async (payload) => ({ ok: true, snapshot: await lifecycle.snapshot(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.capabilities, async () => ({ ok: true, capabilities: registry.CAPABILITY_MATRIX }))
  handle(CHANNELS.createVersion, async (payload) => { noPathPayload(payload); return lifecycle.createVersion({ projectId: id(payload.projectId, 'projectId'), changeRequest: payload.changeRequest, options: payload.options && typeof payload.options === 'object' ? { visualDirection: payload.options.visualDirection } : {} }) })
  handle(CHANNELS.approveVersion, async (payload) => { noPathPayload(payload); return lifecycle.approval(id(payload.projectId, 'projectId'), id(payload.versionId, 'versionId'), payload.approved, payload.observation) })
  handle(CHANNELS.history, async (payload) => ({ ok: true, events: await lifecycle.history(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.compare, async (payload) => { noPathPayload(payload); const comparison = await lifecycle.compare(id(payload.projectId, 'projectId'), id(payload.leftVersionId, 'leftVersionId'), id(payload.rightVersionId, 'rightVersionId')); return { ok: true, comparison } })
  handle(CHANNELS.restore, async (payload) => { noPathPayload(payload); return lifecycle.restore(id(payload.projectId, 'projectId'), id(payload.sourceVersionId, 'sourceVersionId')) })
  handle(CHANNELS.prepareDelivery, async (payload) => { noPathPayload(payload); return lifecycle.prepareDelivery(id(payload.projectId, 'projectId'), id(payload.versionId, 'versionId')) })
  handle(CHANNELS.preview, async (payload) => { noPathPayload(payload); const projectId = id(payload.projectId, 'projectId'); const project = await persistence.getProject(projectId); const versionId = id(payload.versionId || project?.activeVersionId, 'versionId'); const preview = await resolvePreview({ persistence, projectId, versionId, resource: payload.resource || 'app/index.html' }); return { ok: true, preview: { projectId, versionId, resource: preview.resource, mimeType: preview.mimeType, url: preview.url, mode: 'external_only' } } })
  async function resolveTarget(payload) { noPathPayload(payload); const projectId = id(payload.projectId, 'projectId'); if (payload.target === 'preview') { const project = await persistence.getProject(projectId); const versionId = id(payload.versionId || project?.activeVersionId, 'versionId'); return (await resolvePreview({ persistence, projectId, versionId, resource: 'app/index.html' })).filePath } if (payload.target === 'delivery') return lifecycle.resolveDeliveryTarget(projectId, payload.versionId || null); const error = new Error('El destino solicitado no es válido.'); error.code = 'TARGET_UNAVAILABLE'; throw error }
  handle(CHANNELS.open, async (payload) => { const target = await resolveTarget(payload); const failure = await shell.openPath(target); return failure ? { ok: false, error: { code: 'OPEN_FAILED', message: 'No se pudo abrir el destino validado.' } } : { ok: true } })
  handle(CHANNELS.copy, async (payload) => { const target = await resolveTarget(payload); if (!fs.existsSync(target)) { const error = new Error('El destino solicitado no está disponible.'); error.code = 'TARGET_UNAVAILABLE'; throw error } clipboard.writeText(path.resolve(target)); return { ok: true } })
  return { channels: CHANNELS, persistence, lifecycle, registered }
}
module.exports = { CHANNELS, registerCanonicalProjectIpc }
