import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createContextIntegration } = require('../electron/jefe-context-integration.cjs')
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')
const { registerCanonicalProjectIpc, CHANNELS } = require('../electron/jefe-project-ipc.cjs')
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-context-lifecycle-'))
const project = (projectId) => ({ projectId, runId: 'run-alpha', activeVersionId: 'version-alpha', brandSpec: { name: projectId }, timestamps: { createdAt: '2026-08-21T00:00:00.000Z' } })
const persistence = { getProject: async (projectId) => project(projectId) }
const lifecycle = { history: async () => [] }
let failed = true
const entries = new Map()
const memory = { append: async (entry) => { if (failed) { const error = new Error('disk unavailable'); error.code = 'WRITE_FAILED'; throw error }; if (entries.has(entry.entryId)) return { entry, idempotent: true }; entries.set(entry.entryId, entry); return { entry, idempotent: false } }, getSnapshot: async () => ({ history: [...entries.values()] }) }
const request = { projectId: 'context-project', runId: 'context-run', versionId: 'context-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Objetivo Lean', brief: 'Objetivo explícito sanitizado', brandSpec: { name: 'Objetivo Lean' }, inputAssets: { files: [{ safeName: 'logo.png', kind: 'logo', sizeBytes: 12 }], urlReferences: ['https://example.test/reference'] } }

async function withFixedClock(iso, action) { const RealDate = globalThis.Date; class FixedDate extends RealDate { constructor(...args) { super(...(args.length ? args : [iso])) } static now() { return new RealDate(iso).valueOf() } }; globalThis.Date = FixedDate; try { return await action() } finally { globalThis.Date = RealDate } }
async function textOrNull(filePath) { try { return await fs.promises.readFile(filePath, 'utf8') } catch (error) { if (error.code === 'ENOENT') return null; throw error } }
async function readOnlyAudit({ handlers, root, projectId }) {
  const projectRoot = path.join(root, projectId)
  const manifests = {}
  for (const item of await fs.promises.readdir(projectRoot, { withFileTypes: true })) if (item.isDirectory()) {
    const manifestPath = path.join(projectRoot, item.name, 'manifest.json')
    const manifest = await textOrNull(manifestPath)
    if (manifest !== null) manifests[item.name] = manifest
  }
  const context = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId })
  const status = await handlers.get(CHANNELS.contextStatus)(null, { projectId })
  return {
    contextEvents: context.snapshot.history.map((entry) => ({ entryId: entry.entryId, scope: entry.scope, identity: entry.identity })),
    contextSnapshot: await textOrNull(path.join(root, '.jefe-context', 'snapshot.json')),
    contextIndex: await textOrNull(path.join(root, '.jefe-context', 'index.json')),
    ledger: await textOrNull(path.join(projectRoot, '.jefe-project-events.json')),
    manifests,
    projectIndex: await textOrNull(path.join(root, '.jefe-project-index.json')),
    outbox: await textOrNull(path.join(root, '.jefe-context-outbox.json')),
    syncStatus: status.context,
  }
}
function loadPreloadWithMocks() {
  const Module = require('node:module')
  const preloadPath = require.resolve('../electron/preload.cjs')
  const exposed = new Map()
  const invocations = []
  const electron = {
    contextBridge: { exposeInMainWorld: (name, value) => exposed.set(name, value) },
    ipcRenderer: {
      invoke: (...args) => { invocations.push(args); return Promise.resolve({ ok: true }) },
      on: () => {},
      removeListener: () => {},
    },
  }
  const originalLoad = Module._load
  delete require.cache[preloadPath]
  Module._load = function (request, parent, isMain) { return request === 'electron' ? electron : originalLoad.call(this, request, parent, isMain) }
  try { require(preloadPath) } finally { Module._load = originalLoad; delete require.cache[preloadPath] }
  return { exposed, invocations }
}

try {
  const first = createContextIntegration({ root, persistence, lifecycle, memory })
  const pending = await first.reconcile('project-a')
  assert.equal(pending.status, 'pending', '32 pending tras fallo transitorio')
  assert.equal((await first.syncStatus({ projectId: 'project-a' })).status, 'pending', '33 proyecto físico no se falsea')
  failed = false
  const recovered = createContextIntegration({ root, persistence, lifecycle, memory })
  assert.equal((await recovered.reconcile('project-a')).status, 'synced', '34/35 nueva instancia reintenta')
  const before = entries.size
  await recovered.retry('project-a')
  assert.equal(entries.size, before, '36 reintento idempotente')
  await Promise.all([recovered.reconcile('project-a'), recovered.reconcile('project-b')])
  assert.equal((await recovered.syncStatus({ projectId: 'project-a' })).status, 'synced', '40 A sobrevive')
  assert.equal((await recovered.syncStatus({ projectId: 'project-b' })).status, 'synced', '40 B sobrevive')
  await fs.promises.writeFile(path.join(root, '.jefe-context-outbox.json'), '{bad', 'utf8')
  assert.equal((await recovered.syncStatus({ projectId: 'project-a' })).status, 'failed', '42 outbox corrupta no es synced')

  const failureRoot = await fs.promises.mkdtemp(path.join(root, 'failure-'))
  const failureHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => failureHandlers.set(name, handler) }, root: failureRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} }, createFirstVersion: (payload) => createFirstVersionFromRun({ ...payload, testFailureInjection: { afterWrites: 2 } }) })
  const physicalFailure = await failureHandlers.get(CHANNELS.create)(null, { projectId: 'failed-project', runId: 'failed-run', versionId: 'failed-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Fallido', brief: 'Nunca debe llegar a memoria', brandSpec: { name: 'Fallido' } })
  assert.equal(physicalFailure.ok, false, '2 la dependencia de materialización falla')
  assert.notEqual(physicalFailure.contextSync?.status, 'synced', '2 no devuelve sincronización contextual exitosa')
  assert.equal(fs.existsSync(path.join(failureRoot, 'failed-project', 'failed-version', 'manifest.json')), false, '2 no hay manifest exitoso')
  assert.equal(fs.existsSync(path.join(failureRoot, 'failed-project')), false, '2 no hay proyecto ni versión válidos')
  assert.equal(fs.existsSync(path.join(failureRoot, '.jefe-context-outbox.json')), false, '2 no queda outbox de éxito')
  assert.equal((await failureHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'failed-project' })).snapshot.history.length, 0, '2 no hay evento ni resultado contextual anticipado')
  assert.equal(fs.existsSync(path.join(failureRoot, '.jefe-staging', 'failed-project-failed-version')), false, '2 no queda staging propio')

  const seedRoot = await fs.promises.mkdtemp(path.join(root, 'seed-'))
  const seedHandlers = new Map()
  let seedWriteFails = true
  const seedEntries = new Map()
  const seedMemory = { append: async (entry) => { if (seedWriteFails) { const error = new Error('context pending'); error.code = 'WRITE_FAILED'; throw error }; if (seedEntries.has(entry.entryId)) return { entry, idempotent: true }; seedEntries.set(entry.entryId, entry); return { entry, idempotent: false } }, getSnapshot: async () => ({ history: [...seedEntries.values()] }) }
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => seedHandlers.set(name, handler) }, root: seedRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} }, contextMemory: seedMemory })
  const seeded = await seedHandlers.get(CHANNELS.create)(null, { ...request, projectId: 'seed-project', runId: 'seed-run', versionId: 'seed-version', actor: 'system', authority: 'technical_result', provenance: 'renderer-forged' })
  assert.equal(seeded.ok, true, '3 éxito físico anterior al contexto')
  assert.equal(seeded.contextSync.status, 'pending', '3 seed mínimo pendiente tras éxito')
  assert.equal(fs.existsSync(seeded.artifacts.manifestPath), true, '3 manifest físico existe antes del evento')
  const pendingSeed = JSON.parse(await fs.promises.readFile(path.join(seedRoot, '.jefe-context-outbox.json'), 'utf8')).jobs[0].seed
  assert.deepEqual(pendingSeed, { objective: 'Objetivo explícito sanitizado', origin: 'lean_semantic_intake' }, '3 outbox conserva sólo el seed sanitizado')
  assert.equal(JSON.stringify(pendingSeed).includes('renderer-forged'), false, '3 renderer no eleva actor, autoridad ni procedencia')
  seedWriteFails = false
  assert.equal((await seedHandlers.get(CHANNELS.contextReconcile)(null, { projectId: 'seed-project' })).context.status, 'synced', '3 reintento usa el seed de outbox')
  const seededObjective = (await seedHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'seed-project' })).snapshot.history.find((entry) => entry.entryId === 'context-seed-project-objective')
  assert.equal(seededObjective.summary, 'Objetivo explícito sanitizado', '3 texto conservado')
  assert.equal(seededObjective.actor, 'lean', '3 actor asignado por acción semántica')
  assert.equal(seededObjective.authority, 'human_decision', '3 autoridad humana explícita')
  assert.equal(seededObjective.provenance, 'lean_semantic_intake', '3 procedencia humana')

  const ipcRoot = await fs.promises.mkdtemp(path.join(root, 'ipc-'))
  const handlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => handlers.set(name, handler) }, root: ipcRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  const created = await handlers.get(CHANNELS.create)(null, request)
  assert.equal(created.ok, true, '1 creación física exitosa')
  assert.equal(created.contextSync.status, 'synced', '1 contexto posterior sincronizado')
  assert.equal(fs.existsSync(created.artifacts.manifestPath), true, '1 manifest físico existe')
  const snapshot = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })
  const physicalVersion = snapshot.snapshot.history.find((item) => item.scope === 'version')
  assert.deepEqual(physicalVersion.identity, { projectId: 'context-project', runId: 'context-run', versionId: 'context-version' }, '5 identidad de primera versión')
  const refs = snapshot.snapshot.history.find((item) => item.entryId === 'context-context-project-references')
  assert.deepEqual(refs.references, [{ kind: 'asset', value: 'logo.png' }, { kind: 'url', value: 'https://example.test/reference' }], '6/7 assets y URL sólo como referencias')
  const approvalTime = '2026-08-21T12:00:00.000Z'
  const approvalBefore = await handlers.get(CHANNELS.history)(null, { projectId: 'context-project' })
  const approved = await withFixedClock(approvalTime, () => handlers.get(CHANNELS.approveVersion)(null, { projectId: 'context-project', versionId: 'context-version', approved: true, actor: 'system', authority: 'human_decision', visualValidated: true, technicalValidation: 'passed' }))
  assert.equal(approved.ok, true, '10 aprobación canónica exitosa')
  assert.equal(approved.event.versionId, 'context-version', '10 versión exacta aprobada')
  assert.equal(approved.event.occurredAt, approvalTime, '10 timestamp controlado')
  const approvalHistory = await handlers.get(CHANNELS.history)(null, { projectId: 'context-project' })
  assert.equal(approvalHistory.events.length, approvalBefore.events.length + 1, '10 aprobación escrita una vez en ledger')
  const approvalLedger = approvalHistory.events.at(-1)
  assert.equal(approvalLedger.type, 'version_approval_changed', '10 evento físico de aprobación')
  assert.equal(Object.hasOwn(approvalLedger, 'visualValidated'), false, '10 renderer no agrega validación visual')
  assert.equal(Object.hasOwn(approvalLedger, 'technicalValidation'), false, '10 renderer no agrega validación técnica')
  assert.equal(approvalLedger.actor, 'local_user', '10 actor físico fijado por lifecycle')
  const approvedSnapshot = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })
  const decision = approvedSnapshot.snapshot.history.find((entry) => entry.entryId === `context-context-project-${approvalLedger.eventId}`)
  assert.equal(decision.type, 'decision', '10 decisión contextual posterior al ledger')
  assert.equal(decision.actor, 'lean', '10 actor humano contextual')
  assert.equal(decision.authority, 'human_decision', '10 autoridad humana explícita')
  assert.equal(decision.provenance, 'local_human_approval', '10 procedencia semántica de aprobación')
  assert.deepEqual(decision.identity, { projectId: 'context-project', runId: 'context-run', versionId: 'context-version' }, '10 identidad contextual exacta')
  assert.deepEqual(decision.references, [], '11 aprobación no declara evidencia visual')
  assert.equal(decision.metadata.nextResponsible, 'jefe', '11 metadata limitada a responsable siguiente')
  assert.equal(decision.metadata.sourceEventId, approvalLedger.eventId, '11 metadata enlaza sólo el ledger físico')
  const forbiddenClaims = /visual|screenshot|responsive|accessib|qa|certif|publish|deploy|entrega/iu
  assert.equal(forbiddenClaims.test(JSON.stringify(decision)), false, '11 decisión no declara QA visual, entrega ni publicación')
  const decisionCount = approvedSnapshot.snapshot.history.filter((entry) => entry.entryId === decision.entryId).length
  const approvalRetry = await handlers.get(CHANNELS.contextReconcile)(null, { projectId: 'context-project' })
  assert.equal(approvalRetry.context.status, 'synced', '10 reintento contextual idempotente')
  const secondApprovalSnapshot = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })
  assert.equal(secondApprovalSnapshot.snapshot.history.filter((entry) => entry.entryId === decision.entryId).length, decisionCount, '10 segunda lectura no duplica decisión')
  assert.equal(secondApprovalSnapshot.snapshot.history.some((entry) => entry.type === 'validation'), false, '12 lifecycle no fabrica validación técnica')
  assert.equal(approvalHistory.events.some((event) => /validation|smoke/iu.test(event.type)), false, '12 ledger no persiste smoke ni validación derivable')
  const changed = await handlers.get(CHANNELS.createVersion)(null, { projectId: 'context-project', changeRequest: 'Ajustar mensaje principal' })
  assert.equal(changed.ok, true, '8 nueva versión física')
  const afterChange = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })
  assert.equal(afterChange.snapshot.history.some((item) => item.type === 'requirement'), true, '9 pedido de cambio contextual')
  assert.equal(afterChange.snapshot.history.some((item) => item.type === 'result' && item.scope === 'version'), true, '8 resultado técnico contextual')
  const sourceManifestPath = created.artifacts.manifestPath
  const sourceManifest = await fs.promises.readFile(sourceManifestPath, 'utf8')
  const restoreTime = '2026-08-21T13:00:00.000Z'
  const restored = await withFixedClock(restoreTime, () => handlers.get(CHANNELS.restore)(null, { projectId: 'context-project', sourceVersionId: 'context-version', actor: 'renderer-forged', authority: 'human_decision', originVersionId: 'version-v9999' }))
  assert.equal(restored.ok, true, '13 restauracion IPC exitosa')
  assert.notEqual(restored.versionId, 'context-version', '13 crea una version nueva')
  assert.equal(await fs.promises.readFile(sourceManifestPath, 'utf8'), sourceManifest, '13 conserva intacto el manifest de origen')
  const restoredManifestPath = path.join(ipcRoot, 'context-project', restored.versionId, 'manifest.json')
  const restoredManifest = JSON.parse(await fs.promises.readFile(restoredManifestPath, 'utf8'))
  assert.equal(restoredManifest.contract.changeOrigin.reference, 'restore-context-version', '13 manifest fisico identifica origen real')
  assert.equal(restoredManifest.contract.activeVersionId, restored.versionId, '13 manifest identifica nueva version')
  const afterRestoreLedger = await handlers.get(CHANNELS.history)(null, { projectId: 'context-project' })
  const restoreLedger = afterRestoreLedger.events.at(-1)
  assert.deepEqual({ type: restoreLedger.type, versionId: restoreLedger.versionId, sourceVersionId: restoreLedger.sourceVersionId, occurredAt: restoreLedger.occurredAt }, { type: 'version_restored', versionId: restored.versionId, sourceVersionId: 'context-version', occurredAt: restoreTime }, '13 ledger conserva la restauracion real')
  const afterRestore = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })
  const restorationDecision = afterRestore.snapshot.history.find((entry) => entry.entryId === `context-context-project-${restoreLedger.eventId}-decision`)
  const restorationCorrection = afterRestore.snapshot.history.find((entry) => entry.entryId === `context-context-project-${restoreLedger.eventId}`)
  assert.equal(restorationDecision.type, 'decision', '13 memoria registra decision posterior')
  assert.equal(restorationCorrection.type, 'correction', '13 memoria registra correccion aplicada')
  assert.deepEqual(restorationCorrection.identity, { projectId: 'context-project', runId: restored.project.runId, versionId: restored.versionId }, '13 identidad completa sale del manifest restaurado')
  assert.equal(restorationCorrection.metadata.sourceVersionId, 'context-version', '13 memoria conserva version origen resuelta')
  assert.equal(restorationCorrection.actor, 'system', '13 renderer no forja actor')
  assert.equal(restorationCorrection.authority, 'technical_result', '13 renderer no forja autoridad')
  const restorationCount = afterRestore.snapshot.history.filter((entry) => entry.entryId === restorationCorrection.entryId).length
  await handlers.get(CHANNELS.contextReconcile)(null, { projectId: 'context-project' })
  assert.equal((await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })).snapshot.history.filter((entry) => entry.entryId === restorationCorrection.entryId).length, restorationCount, '13 reintento no duplica restauracion')

  const deniedDelivery = await handlers.get(CHANNELS.prepareDelivery)(null, { projectId: 'context-project', versionId: changed.versionId })
  assert.equal(deniedDelivery.ok, false, '14 entrega sin aprobacion rechazada')
  assert.equal((await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })).snapshot.history.some((entry) => entry.metadata.sourceEventId && entry.identity.versionId === changed.versionId && entry.summary === 'Entrega local preparada.'), false, '14 fallo previo al manifest no fabrica exito contextual')
  const deliveryApprovalTime = '2026-08-21T14:00:00.000Z'
  const deliveryApproval = await withFixedClock(deliveryApprovalTime, () => handlers.get(CHANNELS.approveVersion)(null, { projectId: 'context-project', versionId: restored.versionId, approved: true }))
  assert.equal(deliveryApproval.ok, true, '14 aprobacion fisica anterior a entrega')
  const deliveryTime = '2026-08-21T15:00:00.000Z'
  const delivered = await withFixedClock(deliveryTime, () => handlers.get(CHANNELS.prepareDelivery)(null, { projectId: 'context-project', versionId: restored.versionId, deployed: true, publishedUrl: 'https://example.invalid', production: true }))
  assert.equal(delivered.ok, true, '14 entrega local real')
  assert.equal(delivered.delivery.deliveredAt, deliveryTime, '14 timestamp de entrega controlado')
  const deliveryManifestPath = path.join(ipcRoot, 'context-project', 'deliveries', delivered.delivery.deliveryId, 'delivery-manifest.json')
  const deliveryManifest = JSON.parse(await fs.promises.readFile(deliveryManifestPath, 'utf8'))
  assert.deepEqual({ projectId: deliveryManifest.projectId, versionId: deliveryManifest.versionId, preparedAt: deliveryManifest.preparedAt }, { projectId: 'context-project', versionId: restored.versionId, preparedAt: deliveryTime }, '14 manifest de entrega fisico exacto')
  const deliveryLedger = await handlers.get(CHANNELS.history)(null, { projectId: 'context-project' })
  const deliveryEvent = deliveryLedger.events.at(-1)
  assert.equal(deliveryLedger.events.findIndex((event) => event.eventId === deliveryApproval.event.eventId) < deliveryLedger.events.findIndex((event) => event.eventId === deliveryEvent.eventId), true, '14 aprobacion precede ledger de entrega')
  assert.deepEqual({ type: deliveryEvent.type, versionId: deliveryEvent.versionId, deliveryId: deliveryEvent.deliveryId }, { type: 'local_delivery_prepared', versionId: restored.versionId, deliveryId: delivered.delivery.deliveryId }, '14 ledger posterior al manifest contiene entrega local')
  const deliveredContext = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })
  const deliveryContext = deliveredContext.snapshot.history.find((entry) => entry.entryId === `context-context-project-${deliveryEvent.eventId}`)
  assert.equal(deliveryContext.type, 'result', '14 evento contextual generado tras ledger')
  assert.deepEqual(deliveryContext.identity, { projectId: 'context-project', runId: restored.project.runId, versionId: restored.versionId }, '14 entrega conserva proyecto y version exactos')
  assert.deepEqual(deliveryContext.references, [{ kind: 'delivery_manifest', value: `deliveries/${delivered.delivery.deliveryId}/delivery-manifest.json` }, { kind: 'ledger_event', value: deliveryEvent.eventId }], '14 contexto solo referencia manifest y evento')
  const localDeliveryText = JSON.stringify({ manifest: deliveryManifest, ledger: deliveryEvent, context: deliveryContext, delivery: delivered.delivery })
  assert.equal(/deploy|publish|production|hosting|https?:\/\/|domain|remote|ci_complete/iu.test(localDeliveryText), false, '15 entrega local no declara deploy ni publicacion')
  const deliveryCount = deliveredContext.snapshot.history.filter((entry) => entry.entryId === deliveryContext.entryId).length
  await handlers.get(CHANNELS.contextReconcile)(null, { projectId: 'context-project' })
  assert.equal((await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project' })).snapshot.history.filter((entry) => entry.entryId === deliveryContext.entryId).length, deliveryCount, '14 reintento no duplica entrega')

  const failureLifecycleRoot = await fs.promises.mkdtemp(path.join(root, 'lifecycle-failure-'))
  const failureLifecycleHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => failureLifecycleHandlers.set(name, handler) }, root: failureLifecycleRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  const failureProject = await failureLifecycleHandlers.get(CHANNELS.create)(null, { ...request, projectId: 'failure-project', runId: 'failure-run', versionId: 'failure-version' })
  assert.equal(failureProject.ok, true, '16 proyecto e identidad validos')
  await fs.promises.rm(path.join(failureLifecycleRoot, 'failure-project', 'failure-version', 'app', 'index.html'))
  const failureTime = '2026-08-21T16:00:00.000Z'
  const failedRestore = await withFixedClock(failureTime, () => failureLifecycleHandlers.get(CHANNELS.restore)(null, { projectId: 'failure-project', sourceVersionId: 'failure-version' }))
  assert.equal(failedRestore.ok, false, '16 fallo real tras iniciar restauracion')
  assert.equal(failedRestore.error.code, 'INVALID_ARTIFACT', '16 codigo de fallo allowlisted')
  assert.equal(fs.existsSync(path.join(failureLifecycleRoot, 'failure-project', 'version-v0002', 'manifest.json')), false, '16 no crea manifest valido incompleto')
  const failureLedger = await failureLifecycleHandlers.get(CHANNELS.history)(null, { projectId: 'failure-project' })
  assert.equal(failureLedger.events.some((event) => event.type === 'version_restored'), false, '16 no registra exito de restauracion')
  const failureContext = await failureLifecycleHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'failure-project' })
  const failureEntry = failureContext.snapshot.history.find((entry) => entry.type === 'failure')
  assert.equal(failureEntry.timestamp, failureTime, '16 timestamp de fallo controlado')
  assert.deepEqual(failureEntry.identity, { projectId: 'failure-project', runId: 'failure-run', versionId: 'failure-version' }, '16 fallo relacionado a version real')
  assert.deepEqual(failureEntry.metadata, { errorCode: 'INVALID_ARTIFACT', nextResponsible: 'lean', operation: 'restore' }, '16 fallo contiene operacion, codigo y responsable')
  assert.equal(/stack|token|cookie|header|[a-z]:[\\/]|command|payload|secret/iu.test(JSON.stringify(failureEntry)), false, '16 memoria sanitiza fallo sin detalles sensibles')
  const failureCount = failureContext.snapshot.history.filter((entry) => entry.entryId === failureEntry.entryId).length
  await failureLifecycleHandlers.get(CHANNELS.restore)(null, { projectId: 'failure-project', sourceVersionId: 'failure-version' })
  assert.equal((await failureLifecycleHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'failure-project' })).snapshot.history.filter((entry) => entry.entryId === failureEntry.entryId).length, failureCount, '16 reintento idempotente de fallo')
  const defaultResult = await handlers.get(CHANNELS.create)(null, { projectId: 'default-project', runId: 'default-run', versionId: 'default-version', projectType: 'agency_site', platform: 'web', projectName: 'Default JEFE' })
  assert.equal(defaultResult.ok, true, '4 el contrato completa generationProfile por default')
  assert.equal(defaultResult.project.generationProfile, 'factory_typed', '4 default real presente en resultado físico')
  const defaultObjective = (await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'default-project' })).snapshot.history.find((entry) => entry.entryId === 'context-default-project-objective')
  assert.equal(defaultObjective.actor, 'jefe', '4 default no se atribuye a Lean')
  assert.equal(defaultObjective.authority, 'agent_inference', '4 autoridad de inferencia')
  assert.equal(defaultObjective.provenance, 'manifest_value_without_durable_provenance', '4 procedencia explícita no derivable')
  assert.notEqual(defaultObjective.authority, 'human_decision', '4 nunca decisión humana falsa')
  const previewAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  const preview = await handlers.get(CHANNELS.preview)(null, { projectId: 'context-project', versionId: restored.versionId, resource: 'app/index.html' })
  assert.equal(preview.ok, true, '18 preview semantico permitido')
  assert.deepEqual(preview.preview, { projectId: 'context-project', versionId: restored.versionId, resource: 'app/index.html', mimeType: 'text/html; charset=utf-8', url: `jefe-preview://context-project/${restored.versionId}/app/index.html`, mode: 'external_only' }, '18 preview devuelve solo recurso permitido')
  for (const payload of [{ projectId: 'context-project', versionId: restored.versionId, resource: 'file:///outside.html' }, { projectId: 'context-project', versionId: restored.versionId, resource: '../app/index.html' }, { projectId: 'context-project', versionId: restored.versionId, path: 'C:\\outside.html' }]) assert.equal((await handlers.get(CHANNELS.preview)(null, payload)).ok, false, '18 preview rechaza path, file y traversal')
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), previewAudit, '18 preview no altera memoria ni persistencia')

  const compareAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  const comparison = await handlers.get(CHANNELS.compare)(null, { projectId: 'context-project', leftVersionId: 'context-version', rightVersionId: restored.versionId })
  assert.equal(comparison.ok, true, '19 comparacion A/B semantica')
  assert.deepEqual(Object.keys(comparison.comparison).sort(), ['artifacts', 'comparedAt', 'left', 'ok', 'right'], '19 comparacion limitada a metadatos y hashes')
  assert.equal(Object.hasOwn(comparison.comparison, 'visualDiff'), false, '19 comparacion no crea diff visual')
  assert.equal(/equivalen.*estetic|visual.?equivalen/iu.test(JSON.stringify(comparison.comparison)), false, '19 comparacion no afirma equivalencia estetica')
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), compareAudit, '19 comparacion no altera memoria ni persistencia')

  const snapshotAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  const semanticSnapshot = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project', actor: 'renderer-forged', authority: 'human_decision', objective: 'nuevo default' })
  assert.equal(semanticSnapshot.ok, true, '20 snapshot por canal canonico')
  assert.deepEqual(semanticSnapshot.snapshot.history.map((entry) => ({ entryId: entry.entryId, scope: entry.scope, identity: entry.identity })), snapshotAudit.contextEvents, '20 snapshot deriva solo de eventos persistidos')
  assert.equal(semanticSnapshot.snapshot.history.every((entry) => entry.scope === 'orchestrator' || entry.identity.projectId === 'context-project'), true, '20 snapshot respeta identidad solicitada')
  assert.equal(JSON.stringify(semanticSnapshot.snapshot).includes('renderer-forged'), false, '20 lectura no incorpora autoridad del renderer')
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), snapshotAudit, '20 snapshot no altera memoria ni persistencia')

  const timelineAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  const limitedTimeline = await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'context-project', limit: 3 })
  assert.equal(limitedTimeline.ok, true, '21 timeline limitado')
  assert.equal(limitedTimeline.timeline.entries.length <= 3, true, '21 timeline respeta limite')
  assert.equal(limitedTimeline.timeline.order, 'timestamp_desc_entry_id_desc', '21 timeline declara orden determinista')
  assert.equal(limitedTimeline.timeline.entries.every((entry) => entry.scope === 'orchestrator' || entry.identity.projectId === 'context-project'), true, '21 timeline respeta scope e identidad')
  assert.deepEqual(Object.keys(limitedTimeline.timeline).sort(), ['entries', 'limit', 'nextCursor', 'order'], '21 timeline no expone almacenamiento generico')
  for (let index = 1; index < limitedTimeline.timeline.entries.length; index += 1) { const previous = limitedTimeline.timeline.entries[index - 1]; const current = limitedTimeline.timeline.entries[index]; assert.equal(previous.timestamp > current.timestamp || previous.timestamp === current.timestamp && previous.entryId >= current.entryId, true, '21 timeline ordenado en forma determinista') }
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), timelineAudit, '21 timeline no altera memoria ni persistencia')

  const paginationAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  const pageOne = await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'context-project', limit: 2 })
  const pageOneRepeat = await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'context-project', limit: 2 })
  assert.deepEqual(pageOneRepeat.timeline, pageOne.timeline, '22 misma fuente devuelve primera pagina identica')
  const pagedEntries = []
  let cursor = null
  let pages = 0
  do { const page = await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'context-project', limit: 2, ...(cursor ? { cursor } : {}) }); assert.equal(page.ok, true, '22 pagina valida'); pagedEntries.push(...page.timeline.entries); cursor = page.timeline.nextCursor; pages += 1 } while (cursor)
  const allEntries = (await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'context-project', limit: 50 })).timeline.entries
  assert.equal(pages >= 2, true, '22 recorre al menos dos paginas reales')
  assert.equal(new Set(pagedEntries.map((entry) => entry.entryId)).size, pagedEntries.length, '22 paginas sin duplicados')
  assert.deepEqual(pagedEntries.map((entry) => entry.entryId), allEntries.map((entry) => entry.entryId), '22 paginas sin omisiones')
  assert.equal(typeof pageOne.timeline.nextCursor, 'string', '22 cursor opaco emitido')
  assert.equal(/[/\\]|\.\./u.test(pageOne.timeline.nextCursor), false, '22 cursor no es path ni offset libre')
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), paginationAudit, '22 paginacion no altera memoria ni persistencia')

  const invalidTimelineAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  const foreignCursor = (await failureLifecycleHandlers.get(CHANNELS.contextTimeline)(null, { projectId: 'failure-project', limit: 1 })).timeline.nextCursor
  for (const payload of [{ projectId: 'context-project', limit: 0 }, { projectId: 'context-project', limit: -1 }, { projectId: 'context-project', limit: 51 }, { projectId: 'context-project', limit: 1.5 }, { projectId: 'context-project', limit: '2' }, { projectId: 'context-project', limit: 2, cursor: '../../bad' }, { projectId: 'context-project', limit: 2, cursor: foreignCursor }, { projectId: 'context-project', limit: 2, offset: 0 }]) { const rejected = await handlers.get(CHANNELS.contextTimeline)(null, payload); assert.equal(rejected.ok, false, '23 limite o cursor invalido rechazado'); assert.equal(/stack|token|cookie|header|[a-z]:[\\/]|payload|secret/iu.test(JSON.stringify(rejected)), false, '23 rechazo sanitizado') }
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), invalidTimelineAudit, '23 rechazos no alteran memoria ni persistencia')
  assert.equal((await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'context-project', limit: 2 })).ok, true, '23 consulta valida sobrevive rechazos')
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), invalidTimelineAudit, '23 lectura valida posterior sigue siendo pura')

  const contextChannels = [...handlers.keys()].filter((channel) => channel.startsWith('jefe-context:')).sort()
  assert.deepEqual(contextChannels, [CHANNELS.contextReconcile, CHANNELS.contextSnapshot, CHANNELS.contextStatus, CHANNELS.contextTimeline].sort(), '24 handlers contextuales reales y cerrados')
  for (const channel of ['jefe-context:append', 'jefe-context:write-event', 'jefe-context:read-file', 'jefe-context:list-directory', 'jefe-context:execute', 'jefe-context:root', 'jefe-context:outbox']) assert.equal(handlers.has(channel), false, '24 canal contextual no allowlisted ausente')

  const forgedAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  const forged = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project', eventType: 'failure', actor: 'renderer-forged', authority: 'human_decision', provenance: 'renderer-forged', entryId: 'renderer-entry', event: { type: 'decision', summary: 'append directo' }, content: 'append directo' })
  assert.equal(forged.ok, true, '25 campos forjados son ignorados por lectura semantica')
  assert.equal(JSON.stringify(forged.snapshot).includes('renderer-forged'), false, '25 renderer no eleva autoridad contextual')
  assert.equal(handlers.has('jefe-context:append'), false, '25 append directo no puede invocarse')
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), forgedAudit, '25 intento forjado no altera fuentes fisicas')

  const physicalPayloadAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' })
  for (const payload of [{ rootPath: 'C:\\outside' }, { manifestPath: 'C:\\outside\\manifest.json' }, { ledgerPath: '../ledger' }, { outboxPath: 'file:///outside' }, { snapshotPath: '../../snapshot.json' }, { path: 'file:///outside' }]) { const rejected = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'context-project', ...payload }); assert.equal(rejected.ok, false, '26 path fisico rechazado') }
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'context-project' }), physicalPayloadAudit, '26 paths recibidos no se leen ni escriben')

  const isolationA = await handlers.get(CHANNELS.create)(null, { ...request, projectId: 'isolation-a', runId: 'isolation-a-run', versionId: 'isolation-a-version', projectName: 'A aislado', brief: 'Contexto exclusivo A', brandSpec: { name: 'A aislado' } })
  const isolationB = await handlers.get(CHANNELS.create)(null, { ...request, projectId: 'isolation-b', runId: 'isolation-b-run', versionId: 'isolation-b-version', projectName: 'B aislado', brief: 'Contexto exclusivo B', brandSpec: { name: 'B aislado' } })
  assert.equal(isolationA.contextSync.status, 'synced', '31 operacion fisica A devuelve synced durable')
  assert.equal(isolationB.contextSync.status, 'synced', '27 proyecto B aislado sincroniza')
  const [snapshotA, snapshotB, timelineA, timelineB] = await Promise.all([handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'isolation-a' }), handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'isolation-b' }), handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'isolation-a', limit: 2 }), handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'isolation-b', limit: 2 })])
  assert.equal(snapshotA.snapshot.history.every((entry) => entry.identity.projectId === 'isolation-a'), true, '27 snapshot A no contiene B')
  assert.equal(snapshotB.snapshot.history.every((entry) => entry.identity.projectId === 'isolation-b'), true, '27 snapshot B no contiene A')
  assert.equal(timelineA.timeline.entries.every((entry) => entry.identity.projectId === 'isolation-a'), true, '27 timeline A no contiene B')
  assert.equal(timelineB.timeline.entries.every((entry) => entry.identity.projectId === 'isolation-b'), true, '27 timeline B no contiene A')
  const cursorA = timelineA.timeline.nextCursor
  assert.equal((await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'isolation-b', limit: 2, cursor: cursorA })).ok, false, '27 cursor A no funciona en B')
  const isolationBAudit = await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'isolation-b' })
  assert.equal((await handlers.get(CHANNELS.contextReconcile)(null, { projectId: 'isolation-a' })).context.status, 'synced', '27 reintento A controlado')
  assert.deepEqual(await readOnlyAudit({ handlers, root: ipcRoot, projectId: 'isolation-b' }), isolationBAudit, '27 reintento A no altera contexto, estado ni outbox de B')
  const mixedIdentity = await handlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'isolation-a', runId: 'isolation-b-run', versionId: 'isolation-b-version' })
  assert.equal(mixedIdentity.ok, false, '27 identidad fisica mezclada rechazada')

  const preload = loadPreloadWithMocks()
  const projectBridge = preload.exposed.get('jefeProjectBridge')
  const allowedProjectMethods = ['approveVersion', 'capabilities', 'compareVersions', 'copyDeliveryLocation', 'copyPreviewLocation', 'createFirstVersion', 'createVersion', 'getContextSnapshot', 'getContextSyncStatus', 'getContextTimeline', 'getPreview', 'getProject', 'getWorkspaceSnapshot', 'history', 'listProjects', 'listVersions', 'openDelivery', 'openPreview', 'prepareLocalDelivery', 'reconcileContext', 'restoreVersion', 'selectInputAssets']
  assert.deepEqual(Object.keys(projectBridge).sort(), allowedProjectMethods, '28 jefeProjectBridge expone solo metodos allowlisted')
  for (const name of ['ipcRenderer', 'send', 'on', 'once', 'removeListener', 'invoke', 'filesystem', 'shell', 'clipboard', 'rootPath']) assert.equal(Object.hasOwn(projectBridge, name), false, '28 bridge no expone primitiva peligrosa')
  await projectBridge.getContextSnapshot('isolation-a')
  await projectBridge.getContextTimeline('isolation-a', 2, 'opaque-cursor')
  await projectBridge.getContextSyncStatus('isolation-a')
  await projectBridge.reconcileContext('isolation-a')
  assert.deepEqual(preload.invocations.slice(-4), [['jefe-context:snapshot', { projectId: 'isolation-a' }], ['jefe-context:timeline', { projectId: 'isolation-a', limit: 2, cursor: 'opaque-cursor' }], ['jefe-context:status', { projectId: 'isolation-a' }], ['jefe-context:reconcile', { projectId: 'isolation-a' }]], '28 preload invoca canales contextuales exactos')
  for (const name of ['appendContext', 'appendEvent', 'writeMemory', 'saveContext', 'readContextFile', 'listContextFiles', 'openContextPath', 'getContextRoot', 'rawInvoke']) assert.equal(Object.hasOwn(projectBridge, name), false, '29 bridge no expone memoria generica')
  assert.deepEqual(Object.keys(preload.exposed.get('jefeInputAssetsBridge')).sort(), ['selectInputAssets'], '29 input bridge no duplica acceso contextual')

  const mainSource = await fs.promises.readFile(new URL('../electron/main.cjs', import.meta.url), 'utf8')
  assert.equal((mainSource.match(/registerCanonicalProjectIpc\s*\(/gu) || []).length, 1, '30 main registra una sola frontera IPC canonica')
  assert.equal(/registerCanonicalProjectIpc\s*\(\s*\{\s*ipcMain\s*,\s*root:\s*path\.join\(app\.getPath\('userData'\),\s*'jefe-canonical-projects'\)\s*,\s*shell\s*,\s*clipboard:\s*electronModule\.clipboard\s*,?\s*\}\s*\)/u.test(mainSource), true, '30 main inyecta root canonico y dependencias controladas')
  assert.equal((mainSource.match(/jefe-context:/gu) || []).length, 0, '30 main no registra segunda familia contextual')

  const syncedStatus = await handlers.get(CHANNELS.contextStatus)(null, { projectId: 'isolation-a' })
  const outbox = JSON.parse(await fs.promises.readFile(path.join(ipcRoot, '.jefe-context-outbox.json'), 'utf8'))
  assert.equal(syncedStatus.context.status, 'synced', '31 syncStatus durable coincide con respuesta')
  assert.equal(outbox.jobs.some((job) => job.projectId === 'isolation-a'), false, '31 outbox no conserva trabajo pendiente')
  const reopenedHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => reopenedHandlers.set(name, handler) }, root: ipcRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  assert.equal((await reopenedHandlers.get(CHANNELS.contextStatus)(null, { projectId: 'isolation-a' })).context.status, 'synced', '31 nueva instancia conserva estado synced')

  const recoveryRoot = await fs.promises.mkdtemp(path.join(root, 'recovery-'))
  const recoveryStore = createContextMemory({ root: path.join(recoveryRoot, '.jefe-context'), allowedRoots: [recoveryRoot] })
  const recoveryProjectId = 'recovery-project'
  const recoveryVersionId = 'recovery-version'
  const recoveryResultId = `context-${recoveryProjectId}-${recoveryVersionId}-result`
  const interruptedMemory = {
    append: async (entry) => {
      if (entry.entryId === recoveryResultId) { const error = new Error('controlled context interruption'); error.code = 'WRITE_FAILED'; throw error }
      return recoveryStore.append(entry)
    },
    getSnapshot: () => recoveryStore.getSnapshot(),
  }
  const interruptedHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => interruptedHandlers.set(name, handler) }, root: recoveryRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} }, contextMemory: interruptedMemory })
  const recoveryPhysical = await interruptedHandlers.get(CHANNELS.create)(null, { projectId: recoveryProjectId, runId: 'recovery-run', versionId: recoveryVersionId, projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Recuperacion tecnica', brandSpec: { name: 'Recuperacion tecnica' } })
  assert.equal(recoveryPhysical.ok, true, '37 operacion fisica materializada')
  assert.equal(recoveryPhysical.contextSync.status, 'pending', '37 interrupcion real deja contexto pendiente')
  assert.equal(fs.existsSync(recoveryPhysical.artifacts.manifestPath), true, '37 manifest fisico sobrevive interrupcion')
  assert.equal((await recoveryStore.getSnapshot()).history.some((entry) => entry.entryId === recoveryResultId), false, '37 evento tecnico falta sin borrar historia valida')
  const recoveryOutboxPending = JSON.parse(await fs.promises.readFile(path.join(recoveryRoot, '.jefe-context-outbox.json'), 'utf8'))
  assert.equal(recoveryOutboxPending.jobs.find((job) => job.projectId === recoveryProjectId).status, 'pending', '37 outbox conserva trabajo pendiente')
  const recoveryHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => recoveryHandlers.set(name, handler) }, root: recoveryRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  const recoveredContext = await recoveryHandlers.get(CHANNELS.contextReconcile)(null, { projectId: recoveryProjectId })
  assert.deepEqual({ status: recoveredContext.context.status, added: recoveredContext.context.added, pending: recoveredContext.context.pending }, { status: 'synced', added: 1, pending: 0 }, '37 reconciliacion recupera solo resultado tecnico faltante')
  const recoveredSnapshot = await recoveryHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: recoveryProjectId })
  const recoveredResult = recoveredSnapshot.snapshot.history.find((entry) => entry.entryId === recoveryResultId)
  assert.deepEqual(recoveredResult.identity, { projectId: recoveryProjectId, runId: 'recovery-run', versionId: recoveryVersionId }, '37 resultado recuperado conserva identidad fisica')
  assert.deepEqual(recoveredResult.references, [{ kind: 'physical_manifest', value: `${recoveryVersionId}/manifest.json` }], '37 resultado enlaza manifest permitido')
  assert.deepEqual({ actor: recoveredResult.actor, authority: recoveredResult.authority, provenance: recoveredResult.provenance }, { actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger' }, '37 derivacion tecnica no se atribuye a Lean')
  assert.equal(/approval|visual|qa|deploy|entrega/iu.test(JSON.stringify(recoveredResult)), false, '37 resultado no inventa aprobacion ni entrega')
  assert.equal((await recoveryHandlers.get(CHANNELS.contextStatus)(null, { projectId: recoveryProjectId })).context.status, 'synced', '37 pendiente limpiado')
  const recoveryAudit = await readOnlyAudit({ handlers: recoveryHandlers, root: recoveryRoot, projectId: recoveryProjectId })
  await recoveryHandlers.get(CHANNELS.contextReconcile)(null, { projectId: recoveryProjectId })
  assert.deepEqual(await readOnlyAudit({ handlers: recoveryHandlers, root: recoveryRoot, projectId: recoveryProjectId }), recoveryAudit, '37 segunda reconciliacion idempotente sin reescrituras')
  const reopenedRecoveryHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => reopenedRecoveryHandlers.set(name, handler) }, root: recoveryRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  assert.equal((await reopenedRecoveryHandlers.get(CHANNELS.contextStatus)(null, { projectId: recoveryProjectId })).context.status, 'synced', '37 reapertura conserva sincronizacion')
  const forgedRecovery = await recoveryHandlers.get(CHANNELS.contextReconcile)(null, { projectId: recoveryProjectId, approvedBy: 'lean', actor: 'lean', authority: 'human_decision', humanDecision: true, visualValidated: true, accepted: true })
  assert.equal(forgedRecovery.context.status, 'synced', '38 payload forjado no eleva reconciliacion')
  const recoveryAfterForged = await recoveryHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: recoveryProjectId })
  const recoveryTimeline = await recoveryHandlers.get(CHANNELS.contextTimeline)(null, { projectId: recoveryProjectId, limit: 20 })
  const recoveryLedger = await recoveryHandlers.get(CHANNELS.history)(null, { projectId: recoveryProjectId })
  assert.equal(recoveryAfterForged.snapshot.history.some((entry) => entry.actor === 'lean' || entry.authority === 'human_decision' || entry.provenance === 'local_human_approval'), false, '38 reconciliacion no inventa autoridad humana')
  assert.equal(recoveryTimeline.timeline.entries.some((entry) => entry.actor === 'lean' || entry.authority === 'human_decision' || entry.provenance === 'local_human_approval'), false, '38 timeline confirma ausencia de autoridad humana')
  assert.equal(recoveryLedger.events.some((event) => event.type === 'version_approval_changed'), false, '38 ledger no inventa aprobacion')
  assert.equal(recoveryAfterForged.snapshot.history.some((entry) => entry.type === 'validation' || /visual|commercial|approval|delivery|deploy/iu.test(`${entry.summary} ${entry.detail || ''}`)), false, '38 fuentes no inventan aceptaciones ni validaciones')

  const collisionRoot = await fs.promises.mkdtemp(path.join(root, 'collision-'))
  const collisionStore = createContextMemory({ root: path.join(collisionRoot, '.jefe-context'), allowedRoots: [collisionRoot] })
  const collisionProjectId = 'collision-project'
  const collisionVersionId = 'collision-version'
  const collisionResultId = `context-${collisionProjectId}-${collisionVersionId}-result`
  const collisionInterruptedMemory = {
    append: async (entry) => {
      if (entry.entryId === collisionResultId) { const error = new Error('controlled context interruption'); error.code = 'WRITE_FAILED'; throw error }
      return collisionStore.append(entry)
    },
    getSnapshot: () => collisionStore.getSnapshot(),
  }
  const collisionInterruptedHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => collisionInterruptedHandlers.set(name, handler) }, root: collisionRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} }, contextMemory: collisionInterruptedMemory })
  const collisionPhysical = await collisionInterruptedHandlers.get(CHANNELS.create)(null, { projectId: collisionProjectId, runId: 'collision-run', versionId: collisionVersionId, projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Colision tecnica', brandSpec: { name: 'Colision tecnica' } })
  assert.equal(collisionPhysical.contextSync.status, 'pending', '39 fuente fisica valida queda pendiente antes de colision')
  await collisionStore.append({ entryId: collisionResultId, scope: 'version', identity: { projectId: collisionProjectId, runId: 'collision-run', versionId: collisionVersionId }, type: 'result', summary: 'Resultado tecnico incompatible preexistente.', actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: '2026-08-21T17:00:00.000Z', references: [], relations: [], metadata: {} })
  const collisionManifestBefore = await fs.promises.readFile(collisionPhysical.artifacts.manifestPath, 'utf8')
  const collisionLedgerBefore = await fs.promises.readFile(path.join(collisionRoot, collisionProjectId, '.jefe-project-events.json'), 'utf8')
  const collisionHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => collisionHandlers.set(name, handler) }, root: collisionRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  const collisionReconcile = await collisionHandlers.get(CHANNELS.contextReconcile)(null, { projectId: collisionProjectId })
  assert.equal(collisionReconcile.context.status, 'failed', '39 colision incompatible queda failed')
  const collisionSnapshot = await collisionHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: collisionProjectId })
  assert.equal(collisionSnapshot.snapshot.history.filter((entry) => entry.entryId === collisionResultId).length, 1, '39 colision no duplica evento')
  assert.equal(collisionSnapshot.snapshot.history.find((entry) => entry.entryId === collisionResultId).summary, 'Resultado tecnico incompatible preexistente.', '39 colision no sobrescribe historia previa')
  assert.equal(await fs.promises.readFile(collisionPhysical.artifacts.manifestPath, 'utf8'), collisionManifestBefore, '39 colision conserva proyecto fisico')
  assert.equal(await fs.promises.readFile(path.join(collisionRoot, collisionProjectId, '.jefe-project-events.json'), 'utf8'), collisionLedgerBefore, '39 colision conserva ledger fisico')
  const collisionStatus = await collisionHandlers.get(CHANNELS.contextStatus)(null, { projectId: collisionProjectId })
  assert.deepEqual({ status: collisionStatus.context.status, error: collisionStatus.context.error }, { status: 'failed', error: 'ENTRY_ID_COLLISION' }, '39 estado durable usa codigo allowlisted')
  const collisionOutbox = JSON.parse(await fs.promises.readFile(path.join(collisionRoot, '.jefe-context-outbox.json'), 'utf8'))
  assert.equal(collisionOutbox.jobs.find((job) => job.projectId === collisionProjectId).error, 'ENTRY_ID_COLLISION', '39 outbox valida conserva codigo estructurado')
  assert.equal(/stack|token|cookie|header|[a-z]:[\\/]|secret|incompatible preexistente/iu.test(JSON.stringify(collisionOutbox)), false, '39 outbox no filtra detalles sensibles ni contenido de colision')
  const reopenedCollisionHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => reopenedCollisionHandlers.set(name, handler) }, root: collisionRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  assert.equal((await reopenedCollisionHandlers.get(CHANNELS.contextStatus)(null, { projectId: collisionProjectId })).context.status, 'failed', '39 reapertura conserva failed')
  assert.equal((await reopenedCollisionHandlers.get(CHANNELS.contextReconcile)(null, { projectId: collisionProjectId })).context.status, 'failed', '39 reintento no falsea synced')
  assert.equal((await reopenedCollisionHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: collisionProjectId })).snapshot.history.filter((entry) => entry.entryId === collisionResultId).length, 1, '39 reintento conserva una sola historia')
  assert.equal(collisionSnapshot.snapshot.history.some((entry) => entry.actor === 'lean' || entry.authority === 'human_decision'), false, '39 no toma partido entre autoridades humanas')

  const collisionB = await collisionHandlers.get(CHANNELS.create)(null, { projectId: 'collision-b', runId: 'collision-b-run', versionId: 'collision-b-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'B posterior', brandSpec: { name: 'B posterior' } })
  assert.equal(collisionB.contextSync.status, 'synced', '41 B sincroniza despues de fallo A sin reiniciar')
  const collisionBSnapshot = await collisionHandlers.get(CHANNELS.contextSnapshot)(null, { projectId: 'collision-b' })
  const collisionBTimeline = await collisionHandlers.get(CHANNELS.contextTimeline)(null, { projectId: 'collision-b', limit: 20 })
  assert.equal(collisionBSnapshot.snapshot.history.every((entry) => entry.identity.projectId === 'collision-b'), true, '41 snapshot B aislado de A')
  assert.equal(collisionBTimeline.timeline.entries.every((entry) => entry.identity.projectId === 'collision-b'), true, '41 timeline B aislado de A')
  assert.equal((await collisionHandlers.get(CHANNELS.contextReconcile)(null, { projectId: 'collision-b' })).context.status, 'synced', '41 reconciliacion B sigue operativa')
  const collisionBVersion = await collisionHandlers.get(CHANNELS.createVersion)(null, { projectId: 'collision-b', changeRequest: 'Cambio posterior a fallo A' })
  assert.equal(collisionBVersion.contextSync.status, 'synced', '41 operacion posterior B no queda bloqueada')
  assert.equal((await collisionHandlers.get(CHANNELS.contextStatus)(null, { projectId: collisionProjectId })).context.status, 'failed', '41 A conserva estado real failed')
  assert.equal((await collisionHandlers.get(CHANNELS.contextStatus)(null, { projectId: 'collision-b' })).context.status, 'synced', '41 estado se calcula por proyecto')
  const collisionOutboxAfterB = JSON.parse(await fs.promises.readFile(path.join(collisionRoot, '.jefe-context-outbox.json'), 'utf8'))
  assert.deepEqual(collisionOutboxAfterB.jobs.map((job) => ({ projectId: job.projectId, status: job.status, error: job.error })), [{ projectId: collisionProjectId, status: 'failed', error: 'ENTRY_ID_COLLISION' }], '41 outbox conserva A y no pierde B')
  const reopenedIndependentHandlers = new Map()
  registerCanonicalProjectIpc({ ipcMain: { handle: (name, handler) => reopenedIndependentHandlers.set(name, handler) }, root: collisionRoot, shell: { openPath: async () => '' }, clipboard: { writeText: () => {} } })
  assert.deepEqual({ a: (await reopenedIndependentHandlers.get(CHANNELS.contextStatus)(null, { projectId: collisionProjectId })).context.status, b: (await reopenedIndependentHandlers.get(CHANNELS.contextStatus)(null, { projectId: 'collision-b' })).context.status }, { a: 'failed', b: 'synced' }, '41 nueva instancia conserva independencia A/B')

  const bad = await handlers.get(CHANNELS.create)(null, { projectId: 'x', versionId: 'y', path: 'C:\\bad' })
  assert.equal(bad.ok, false, '17 formulario/payload inválido rechazado')
  assert.equal((await handlers.get(CHANNELS.contextTimeline)(null, { projectId: 'context-project' })).ok, true, '17 lectura válida sin contaminación')
  console.log('STATUS=ESCALON_2B_SMOKE_COMPLETE_PENDING_FINAL_VALIDATION')
  console.log('CHECKS=42/42')
  console.log('CASOS_PASS=1-42')
} finally {
  await fs.promises.rm(root, { recursive: true, force: true })
}
