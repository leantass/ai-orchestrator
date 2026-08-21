const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { createContextMemory } = require('./jefe-context-persistence.cjs')

const ID = /^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,15}$/u
function safe(value) { return typeof value === 'string' && ID.test(value) ? value : null }
function contextSeed(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.objective !== 'string') return null
  const objective = value.objective.trim().replace(/\s+/gu, ' ')
  return objective && objective.length <= 500 ? { objective, origin: 'lean_semantic_intake' } : null
}
const FAILURE_CODES = Object.freeze({
  INVALID_ARTIFACT: { summary: 'La restauracion local no pudo completar sus artefactos validados.', nextResponsible: 'lean' },
})

function createContextIntegration({ root, persistence, lifecycle, memory = null }) {
  const store = memory || createContextMemory({ root: path.join(root, '.jefe-context'), allowedRoots: [root] })
  const outboxPath = path.join(root, '.jefe-context-outbox.json')
  const locks = new Set()
  let outboxTail = Promise.resolve()
  async function readOutbox() {
    try {
      const value = JSON.parse(await fs.promises.readFile(outboxPath, 'utf8'))
      return Array.isArray(value.jobs) ? value : { jobs: [], corruption: { code: 'OUTBOX_INVALID' } }
    } catch (error) {
      return error.code === 'ENOENT' ? { jobs: [] } : { jobs: [], corruption: { code: 'OUTBOX_CORRUPT' } }
    }
  }
  async function writeOutbox(value) {
    const stage = `${outboxPath}.${process.pid}.${Date.now()}.stage`
    await fs.promises.writeFile(stage, `${JSON.stringify(value)}\n`, 'utf8')
    await fs.promises.rename(stage, outboxPath)
  }
  async function setJob(projectId, status, error = null, seed = null) {
    const previous = outboxTail
    let release
    outboxTail = new Promise((resolve) => { release = resolve })
    await previous
    try {
      const box = await readOutbox()
      if (box.corruption) {
        const failure = new Error('La outbox requiere reconciliación controlada.')
        failure.code = box.corruption.code
        throw failure
      }
      const jobs = box.jobs.filter((job) => job.projectId !== projectId)
      if (status !== 'synced') jobs.push({ projectId, status, error: error && error.code === 'ENTRY_ID_COLLISION' ? 'ENTRY_ID_COLLISION' : error ? 'CONTEXT_SYNC_PENDING' : null, seed: contextSeed(seed) })
      const next = { schemaVersion: 'jefe-context-outbox/v1', jobs: jobs.sort((a, b) => a.projectId.localeCompare(b.projectId)) }
      if (JSON.stringify(box) !== JSON.stringify(next)) await writeOutbox(next)
    } finally { release() }
  }
  const append = async (entry) => store.append(entry).catch((error) => ({ error }))
  const base = (entryId, project, type, summary, extra = {}) => ({ entryId, scope: 'project', identity: { projectId: project.projectId }, type, summary, actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: project.timestamps.createdAt || new Date().toISOString(), ...extra })
  async function reconcile(projectId, rawSeed = null) {
    if (!safe(projectId)) throw new Error('projectId inválido.')
    const project = await persistence.getProject(projectId)
    if (!project) return { status: 'failed', added: 0, present: 0, pending: 0, corrupt: 0, notDerivable: 1 }
    const seed = contextSeed(rawSeed)
    const known = new Map((await store.getSnapshot()).history.map((entry) => [entry.entryId, entry]))
    const references = [...(project.inputAssets?.files || []).map((file) => ({ kind: 'asset', value: file.safeName })), ...(project.inputAssets?.urlReferences || []).map((value) => ({ kind: 'url', value }))]
    const objectiveId = `context-${projectId}-objective`
    const objective = known.get(objectiveId) || base(objectiveId, project, 'objective', seed ? seed.objective : project.brief || project.brandSpec.name || projectId, seed ? { actor: 'lean', authority: 'human_decision', provenance: seed.origin } : { actor: 'jefe', authority: 'agent_inference', provenance: 'manifest_value_without_durable_provenance' })
    const entries = [objective, base(`context-${projectId}-${project.activeVersionId}-result`, project, 'result', 'Versión física materializada.', { scope: 'version', identity: { projectId, runId: project.runId, versionId: project.activeVersionId }, references: [{ kind: 'physical_manifest', value: `${project.activeVersionId}/manifest.json` }] }), ...(references.length ? [base(`context-${projectId}-references`, project, 'evidence', 'Input Assets declarados como referencias.', { references })] : [])]
    for (const event of await lifecycle.history(projectId)) {
      const map = { change_requested: ['requirement', 'Pedido de cambio registrado.'], version_created: ['result', 'Nueva versión física creada.'], version_approval_changed: ['decision', event.approved ? 'Aprobación local explícita.' : 'Aprobación local retirada.'], version_restored: ['correction', 'Versión restaurada como nueva versión.'], local_delivery_prepared: ['result', 'Entrega local preparada.'], version_creation_failed: ['failure', 'Fallo relevante de lifecycle.'] }
      if (!map[event.type]) continue
      const [type, summary] = map[event.type]
      const actor = event.type === 'version_approval_changed' ? 'lean' : 'system'
      const authority = event.type === 'version_approval_changed' ? 'human_decision' : 'technical_result'
      const provenance = event.type === 'version_approval_changed' ? 'local_human_approval' : 'physical_manifest_or_ledger'
      const versionId = event.versionId || project.activeVersionId
      const eventRecord = await persistence.getVersionRecord(projectId, versionId)
      const eventProject = eventRecord ? eventRecord.project : project
      const metadata = { nextResponsible: event.type === 'version_approval_changed' && event.approved ? 'jefe' : 'lean', sourceEventId: event.eventId }
      const references = []
      if (event.type === 'version_restored') metadata.sourceVersionId = event.sourceVersionId
      if (event.type === 'local_delivery_prepared') {
        metadata.deliveryId = event.deliveryId
        references.push({ kind: 'delivery_manifest', value: `deliveries/${event.deliveryId}/delivery-manifest.json` }, { kind: 'ledger_event', value: event.eventId })
      }
      if (event.type === 'version_restored') entries.push(base(`context-${projectId}-${event.eventId}-decision`, eventProject, 'decision', 'Restauracion local registrada.', { scope: 'version', identity: { projectId, runId: eventProject.runId, versionId }, actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: event.occurredAt, metadata: { ...metadata, restoration: true } }))
      entries.push(base(`context-${projectId}-${event.eventId}`, eventProject, type, summary, { scope: 'version', identity: { projectId, runId: eventProject.runId, versionId }, actor, authority, provenance, timestamp: event.occurredAt, metadata, references }))
    }
    if (locks.has(projectId)) return { status: 'pending', added: 0, present: 0, pending: 1, corrupt: 0, notDerivable: 0 }
    locks.add(projectId)
    try {
      let added = 0; let present = 0; let pending = 0; let failure = null
      for (const entry of entries) {
        const outcome = await append(entry)
        if (outcome.error) { pending += 1; failure = outcome.error } else if (outcome.idempotent) present += 1; else added += 1
      }
      const status = pending ? (failure && failure.code === 'ENTRY_ID_COLLISION' ? 'failed' : 'pending') : 'synced'
      await setJob(projectId, status, failure, seed)
      return { status, added, present, pending, corrupt: 0, notDerivable: 0 }
    } finally { locks.delete(projectId) }
  }
  async function retry(projectId) {
    const box = await readOutbox()
    const job = box.jobs.find((item) => item.projectId === projectId)
    return reconcile(projectId, job && job.seed)
  }
  async function recordLifecycleFailure({ projectId, operation, versionId, error }) {
    const policy = operation === 'restore' && error && FAILURE_CODES[error.code]
    if (!policy || !safe(projectId) || !safe(versionId)) return { status: 'ignored', added: 0, present: 0, pending: 0 }
    const record = await persistence.getVersionRecord(projectId, versionId)
    if (!record) return { status: 'ignored', added: 0, present: 0, pending: 0 }
    const errorCode = error.code
    const digest = crypto.createHash('sha256').update(`${projectId}:${operation}:${versionId}:${errorCode}`).digest('hex').slice(0, 32)
    const entry = base(`context-failure-${digest}`, record.project, 'failure', policy.summary, {
      scope: 'version',
      identity: { projectId, runId: record.project.runId, versionId },
      actor: 'system',
      authority: 'technical_result',
      provenance: 'physical_lifecycle_failure',
      timestamp: new Date().toISOString(),
      metadata: { errorCode, operation, nextResponsible: policy.nextResponsible },
    })
    const outcome = await append(entry)
    if (outcome.error) return { status: 'pending', added: 0, present: 0, pending: 1 }
    return { status: 'synced', added: outcome.idempotent ? 0 : 1, present: outcome.idempotent ? 1 : 0, pending: 0 }
  }
  async function snapshot(identity) {
    if (!identity || !safe(identity.projectId)) throw new Error('Identidad semántica inválida.')
    const value = await store.getSnapshot()
    return { ...value, history: value.history.filter((entry) => entry.scope === 'orchestrator' || entry.identity.projectId === identity.projectId) }
  }
  function timelineError(code, message) { const error = new Error(message); error.code = code; throw error }
  function encodeCursor(projectId, offset) { return Buffer.from(JSON.stringify({ schemaVersion: 'jefe-context-timeline/v1', projectId, offset }), 'utf8').toString('base64url') }
  function decodeCursor(value, projectId) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,240}$/u.test(value)) timelineError('INVALID_TIMELINE_CURSOR', 'El cursor de timeline no es valido.')
    let cursor
    try { cursor = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) } catch { timelineError('INVALID_TIMELINE_CURSOR', 'El cursor de timeline no es valido.') }
    if (!cursor || typeof cursor !== 'object' || Array.isArray(cursor) || cursor.schemaVersion !== 'jefe-context-timeline/v1' || cursor.projectId !== projectId || !Number.isSafeInteger(cursor.offset) || cursor.offset < 0) timelineError('INVALID_TIMELINE_CURSOR', 'El cursor de timeline no es valido.')
    return cursor.offset
  }
  async function timeline(identity, options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options) || Object.hasOwn(options, 'offset')) timelineError('INVALID_TIMELINE_CURSOR', 'El cursor de timeline no es valido.')
    const limit = options.limit === undefined ? 20 : options.limit
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) timelineError('INVALID_TIMELINE_LIMIT', 'El limite de timeline debe ser un entero entre 1 y 50.')
    if (options.cursor !== undefined && options.cursor !== null && typeof options.cursor !== 'string') timelineError('INVALID_TIMELINE_CURSOR', 'El cursor de timeline no es valido.')
    if (!identity || !safe(identity.projectId)) throw new Error('Identidad semantica invalida.')
    const offset = options.cursor ? decodeCursor(options.cursor, identity.projectId) : 0
    const value = await snapshot(identity)
    const ordered = value.history.slice().sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.entryId.localeCompare(left.entryId))
    const entries = ordered.slice(offset, offset + limit)
    const nextOffset = offset + entries.length
    return { entries, limit, order: 'timestamp_desc_entry_id_desc', nextCursor: nextOffset < ordered.length ? encodeCursor(identity.projectId, nextOffset) : null }
  }
  async function syncStatus(identity) {
    if (!identity || !safe(identity.projectId)) throw new Error('Identidad semántica inválida.')
    const box = await readOutbox()
    if (box.corruption) return { projectId: identity.projectId, status: 'failed', error: box.corruption.code }
    return box.jobs.find((item) => item.projectId === identity.projectId) || { projectId: identity.projectId, status: 'synced', error: null }
  }
  return { reconcile, retry, recordLifecycleFailure, syncStatus, snapshot, timeline, memory: store }
}

module.exports = { createContextIntegration }
