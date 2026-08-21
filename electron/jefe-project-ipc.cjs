const fs = require('fs')
const path = require('path')
const { createFirstVersionFromRun } = require('./jefe-project-creation.cjs')
const { createProjectPersistence } = require('./jefe-project-persistence.cjs')
const { createProjectLifecycle } = require('./jefe-project-lifecycle.cjs')
const { resolvePreview } = require('./jefe-project-preview.cjs')
const { createContextIntegration } = require('./jefe-context-integration.cjs')
const registry = require('./jefe-project-registry.cjs')

const CHANNELS = Object.freeze({ create: 'jefe-projects:create-first-version', list: 'jefe-projects:list', get: 'jefe-projects:get', versions: 'jefe-projects:list-versions', snapshot: 'jefe-projects:workspace-snapshot', open: 'jefe-projects:open', copy: 'jefe-projects:copy-location', capabilities: 'jefe-projects:capabilities', createVersion: 'jefe-projects:create-version', approveVersion: 'jefe-projects:approve-version', history: 'jefe-projects:history', compare: 'jefe-projects:compare', restore: 'jefe-projects:restore', prepareDelivery: 'jefe-projects:prepare-local-delivery', preview: 'jefe-projects:preview', contextSnapshot: 'jefe-context:snapshot', contextTimeline: 'jefe-context:timeline', contextStatus: 'jefe-context:status', contextReconcile: 'jefe-context:reconcile' })
function safeError(error) { return { ok: false, error: { code: error && error.code ? error.code : 'IPC_FAILED', message: error instanceof Error ? error.message : 'La operacion no pudo completarse.' } } }
function id(value, field) { if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u.test(value)) { const error = new Error(`${field} invalido.`); error.code = 'INVALID_ID'; throw error } return value }
function noPathPayload(payload) { if (!payload || typeof payload !== 'object' || ['path', 'filePath', 'destinationRoot', 'rootPath', 'manifestPath', 'ledgerPath', 'outboxPath', 'snapshotPath'].some((field) => Object.hasOwn(payload, field))) { const error = new Error('El payload no admite paths arbitrarios.'); error.code = 'INVALID_PAYLOAD'; throw error } }
function noContextIdentityPayload(payload) { if (Object.hasOwn(payload, 'runId') || Object.hasOwn(payload, 'versionId')) { const error = new Error('El contexto usa solo projectId semantico.'); error.code = 'INVALID_PAYLOAD'; throw error } }
function contextSeed(payload) { if (!payload || typeof payload.brief !== 'string') return null; const objective = payload.brief.trim().replace(/\s+/gu, ' '); return objective && objective.length <= 500 ? { objective, origin: 'lean_semantic_intake' } : null }
function registerCanonicalProjectIpc({ ipcMain, root, shell, clipboard, contextMemory = null, createFirstVersion = createFirstVersionFromRun }) {
  const persistence = createProjectPersistence({ root })
  const lifecycle = createProjectLifecycle({ root, persistence })
  const context = createContextIntegration({ root, persistence, lifecycle, memory: contextMemory })
  const locks = new Set()
  const registered = ipcMain[Symbol.for('jefe.canonicalProjectChannels')] || new Set()
  ipcMain[Symbol.for('jefe.canonicalProjectChannels')] = registered
  function handle(channel, handler) { if (registered.has(channel)) return; registered.add(channel); ipcMain.handle(channel, async (_event, payload = {}) => { try { return await handler(payload) } catch (error) { return safeError(error) } }) }
  handle(CHANNELS.create, async (payload) => { noPathPayload(payload); const key = `${payload.projectId}:${payload.versionId}`; if (locks.has(key)) { const error = new Error('La version ya esta siendo creada.'); error.code = 'VERSION_LOCKED'; throw error } locks.add(key); try { const result = await createFirstVersion({ ...payload, destinationRoot: root, allowedRoots: [root] }); if (!result.ok) return result; await persistence.registerManifest(result.artifacts.manifestPath); await lifecycle.ensureCreated(result.project); return { ...result, contextSync: await context.reconcile(result.project.projectId, contextSeed(payload)) } } finally { locks.delete(key) } })
  for (const [channel, action] of [[CHANNELS.createVersion, 'createVersion'], [CHANNELS.approveVersion, 'approval'], [CHANNELS.restore, 'restore'], [CHANNELS.prepareDelivery, 'prepareDelivery']]) {
    handle(channel, async (payload) => {
      noPathPayload(payload)
      const projectId = id(payload.projectId, 'projectId')
      const versionId = action === 'restore' ? id(payload.sourceVersionId, 'sourceVersionId') : action === 'approval' || action === 'prepareDelivery' ? id(payload.versionId, 'versionId') : null
      try {
        let result
        if (action === 'createVersion') result = await lifecycle.createVersion({ projectId, changeRequest: payload.changeRequest, options: payload.options || {} })
        else if (action === 'approval') result = await lifecycle.approval(projectId, versionId, payload.approved, payload.observation)
        else if (action === 'restore') result = await lifecycle.restore(projectId, versionId)
        else result = await lifecycle.prepareDelivery(projectId, versionId)
        return { ...result, contextSync: result.ok ? await context.reconcile(projectId) : { status: 'pending' } }
      } catch (error) {
        const contextSync = action === 'restore' ? await context.recordLifecycleFailure({ projectId, operation: action, versionId, error }) : { status: 'ignored' }
        return { ...safeError(error), contextSync }
      }
    })
  }
  handle(CHANNELS.list, async () => ({ ok: true, projects: await persistence.listProjects() }))
  handle(CHANNELS.get, async (payload) => ({ ok: true, project: await persistence.getProject(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.versions, async (payload) => ({ ok: true, versions: await persistence.listVersions(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.snapshot, async (payload) => ({ ok: true, snapshot: await lifecycle.snapshot(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.capabilities, async () => ({ ok: true, capabilities: registry.CAPABILITY_MATRIX }))
  handle(CHANNELS.history, async (payload) => ({ ok: true, events: await lifecycle.history(id(payload.projectId, 'projectId')) }))
  handle(CHANNELS.compare, async (payload) => { noPathPayload(payload); const comparison = await lifecycle.compare(id(payload.projectId, 'projectId'), id(payload.leftVersionId, 'leftVersionId'), id(payload.rightVersionId, 'rightVersionId')); return { ok: true, comparison } })
  handle(CHANNELS.contextSnapshot, async (payload) => { noPathPayload(payload); noContextIdentityPayload(payload); return { ok: true, snapshot: await context.snapshot({ projectId: id(payload.projectId, 'projectId') }) } })
  handle(CHANNELS.contextTimeline, async (payload) => { noPathPayload(payload); noContextIdentityPayload(payload); return { ok: true, timeline: await context.timeline({ projectId: id(payload.projectId, 'projectId') }, { limit: payload.limit, cursor: payload.cursor, ...(Object.hasOwn(payload, 'offset') ? { offset: payload.offset } : {}) }) } })
  handle(CHANNELS.contextStatus, async (payload) => { noPathPayload(payload); noContextIdentityPayload(payload); return { ok: true, context: await context.syncStatus({ projectId: id(payload.projectId, 'projectId') } ) } })
  handle(CHANNELS.contextReconcile, async (payload) => { noPathPayload(payload); noContextIdentityPayload(payload); return { ok: true, context: await context.retry(id(payload.projectId, 'projectId')) } })
  handle(CHANNELS.preview, async (payload) => { noPathPayload(payload); const projectId = id(payload.projectId, 'projectId'); const project = await persistence.getProject(projectId); const versionId = id(payload.versionId || project?.activeVersionId, 'versionId'); const preview = await resolvePreview({ persistence, projectId, versionId, resource: payload.resource || 'app/index.html' }); return { ok: true, preview: { projectId, versionId, resource: preview.resource, mimeType: preview.mimeType, url: preview.url, mode: 'external_only' } } })
  async function resolveTarget(payload) { noPathPayload(payload); const projectId = id(payload.projectId, 'projectId'); if (payload.target === 'preview') { const project = await persistence.getProject(projectId); const versionId = id(payload.versionId || project?.activeVersionId, 'versionId'); return (await resolvePreview({ persistence, projectId, versionId, resource: 'app/index.html' })).filePath } if (payload.target === 'delivery') return lifecycle.resolveDeliveryTarget(projectId, payload.versionId || null); const error = new Error('El destino solicitado no es valido.'); error.code = 'TARGET_UNAVAILABLE'; throw error }
  handle(CHANNELS.open, async (payload) => { const target = await resolveTarget(payload); const failure = await shell.openPath(target); return failure ? { ok: false, error: { code: 'OPEN_FAILED', message: 'No se pudo abrir el destino validado.' } } : { ok: true } })
  handle(CHANNELS.copy, async (payload) => { const target = await resolveTarget(payload); if (!fs.existsSync(target)) { const error = new Error('El destino solicitado no esta disponible.'); error.code = 'TARGET_UNAVAILABLE'; throw error } clipboard.writeText(path.resolve(target)); return { ok: true } })
  return { channels: CHANNELS, persistence, lifecycle, context, registered }
}
module.exports = { CHANNELS, registerCanonicalProjectIpc }
