import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  createSupervisedResearch,
  deriveEvidenceCaseId,
  deriveResearchPlanId,
} = require('../electron/jefe-supervised-research-orchestrator.cjs')
const { createSupervisedResearchPersistence } = require('../electron/jefe-supervised-research-persistence.cjs')
const { createEvidenceCasePersistence } = require('../electron/jefe-supervised-research-evidence-case-persistence.cjs')
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')

const tests = []
let environmentSequence = 0

function test(name, run) {
  tests.push({ name, run })
}

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function copy(value) {
  return JSON.parse(JSON.stringify(value))
}

async function rejectsCode(run, code) {
  await assert.rejects(run, (error) => {
    assert.equal(error?.code, code)
    return true
  })
}

function planInput(token) {
  return {
    intake: {
      state: 'ready_for_discovery',
      identity: { versionId: `version-${token}`, projectId: `project-${token}` },
      intakeId: `intake-${token}`,
      objective: `Investigar evidencia controlada ${token}`,
      questions: [`Que evidencia responde ${token}`],
      expectedOutcome: `Resultado controlado ${token}`,
    },
    packages: [
      { agent: 'radar', packageId: `context-package-radar-${token}` },
      { agent: 'scout', packageId: `context-package-scout-${token}` },
      { agent: 'hermes', packageId: `context-package-hermes-${token}` },
    ],
    providerType: 'metasearch',
    budget: { maxQueries: 2, maxSources: 4 },
    references: ['https://reference.test/source'],
  }
}

function rawReceipt(requestRecord, {
  seed = 'receipt-one',
  host = 'source-one',
  status = 'received',
  operation = requestRecord.providerType === 'manual_reference' ? 'reference' : 'search',
  excerpt = 'Observacion controlada',
} = {}) {
  const raw = {
    researchRequestId: requestRecord.researchRequestId,
    providerType: requestRecord.providerType,
    operation,
    status,
  }
  if (status === 'received' || status === 'partial') {
    Object.assign(raw, {
      url: `https://${host}.test/source`,
      mimeType: 'text/plain',
      bytes: 24,
      contentHash: digest(seed),
      excerpt,
    })
  }
  return raw
}

function contribution(requestRecord, options = {}) {
  return {
    researchRequestId: requestRecord.researchRequestId,
    rawReceipt: rawReceipt(requestRecord, options),
    claim: options.claim || 'Claim controlado compartido',
  }
}

async function createEnvironment() {
  const sequence = ++environmentSequence
  const token = `case-${String(sequence).padStart(3, '0')}`
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-evidence-case-smoke-'))
  const requestRoot = path.join(root, 'request-sessions')
  const evidenceCaseRoot = path.join(root, 'evidence-cases')
  const memoryRoot = path.join(root, 'memory')
  const time = { value: '2026-08-25T00:00:00.000Z' }
  const memoryStore = createContextMemory({ root: memoryRoot, allowedRoots: [root], clock: () => time.value })
  const memory = {
    calls: [],
    failuresRemaining: 0,
    async append(input) {
      this.calls.push(copy(input))
      if (this.failuresRemaining > 0) {
        this.failuresRemaining -= 1
        const error = new Error('Fallo de MEMORIA inyectado.')
        error.code = 'INJECTED_MEMORY_FAILURE'
        throw error
      }
      return memoryStore.append(input)
    },
  }
  const trusted = {
    networkEnabled: false,
    providers: {
      manual_reference: { state: 'available' },
      metasearch: { state: 'not_connected' },
    },
  }
  const requestStore = (options = {}) => createSupervisedResearchPersistence({ root: requestRoot, ...options })
  const evidenceCaseStore = (options = {}) => createEvidenceCasePersistence({ root: evidenceCaseRoot, ...options })
  const service = (options = {}) => createSupervisedResearch({
    memory: Object.hasOwn(options, 'memory') ? options.memory : memory,
    persistence: options.persistence || requestStore(),
    evidenceCasePersistence: options.evidenceCasePersistence || evidenceCaseStore(),
    clock: () => time.value,
    trusted,
  })
  return {
    token,
    root,
    requestRoot,
    evidenceCaseRoot,
    time,
    memory,
    memoryStore,
    requestStore,
    evidenceCaseStore,
    service,
    async close() {
      await fs.promises.rm(root, { recursive: true, force: true })
    },
  }
}

async function withEnvironment(run) {
  const environment = await createEnvironment()
  try {
    return await run(environment)
  } finally {
    await environment.close()
  }
}

async function prepare(environment, suffix = 'main', service = environment.service()) {
  const input = planInput(`${environment.token}-${suffix}`)
  const planned = await service.plan(input)
  return { input, planned, service }
}

async function acceptCase(environment, suffix = 'accepted') {
  const prepared = await prepare(environment, suffix)
  const firstInput = contribution(prepared.planned.radar, { seed: `${suffix}-one`, host: `${suffix}-one` })
  const secondInput = contribution(prepared.planned.scout, { seed: `${suffix}-two`, host: `${suffix}-two` })
  const first = await prepared.service.receiveContribution(firstInput)
  const second = await prepared.service.receiveContribution(secondInput)
  return { ...prepared, firstInput, secondInput, first, second }
}

async function leavePreparing(environment, suffix = 'preparing') {
  const input = planInput(`${environment.token}-${suffix}`)
  const service = environment.service({ persistence: environment.requestStore({ failureInjection: 'before_rename' }) })
  await rejectsCode(() => service.plan(input), 'INJECTED_FAILURE')
  const topic = {
    projectId: input.intake.identity.projectId,
    discoveryId: `discovery-${input.intake.intakeId.slice(7)}`,
    intakeId: input.intake.intakeId,
    objective: input.intake.objective,
    questions: input.intake.questions,
  }
  const researchPlanId = deriveResearchPlanId(topic)
  const evidenceCaseId = deriveEvidenceCaseId({ researchPlanId })
  const record = await environment.evidenceCaseStore().read(evidenceCaseId)
  return { input, service, researchPlanId, evidenceCaseId, record }
}

test('researchPlanId es determinista ante distinto orden de claves', async () => {
  const one = { projectId: 'project-alpha', discoveryId: 'discovery-alpha', intakeId: 'intake-alpha', objective: 'Objetivo', questions: ['Pregunta'] }
  const two = { questions: ['Pregunta'], objective: 'Objetivo', intakeId: 'intake-alpha', discoveryId: 'discovery-alpha', projectId: 'project-alpha' }
  assert.equal(deriveResearchPlanId(one), deriveResearchPlanId(two))
  assert.match(deriveResearchPlanId(one), /^research-plan-[a-f0-9]{32}$/u)
})

test('evidenceCaseId es determinista y deriva del plan compartido', async () => {
  const researchPlanId = deriveResearchPlanId({ projectId: 'project-beta', discoveryId: 'discovery-beta', intakeId: 'intake-beta', objective: 'Objetivo', questions: ['Pregunta'] })
  const one = deriveEvidenceCaseId({ researchPlanId })
  const two = deriveEvidenceCaseId({ researchPlanId })
  assert.equal(one, two)
  assert.match(one, /^evidence-case-[a-f0-9]{32}$/u)
})

test('plan materializa el caso durable de preparing a ready', () => withEnvironment(async (environment) => {
  const { planned } = await prepare(environment)
  const record = await environment.evidenceCaseStore().read(planned.evidenceCaseId)
  assert.equal(planned.caseState, 'ready')
  assert.equal(record.state, 'ready')
  assert.deepEqual(record.pendingOperations, [])
}))

test('replay de plan desde una instancia nueva conserva IDs y requests', () => withEnvironment(async (environment) => {
  const first = await prepare(environment, 'replay')
  environment.time.value = '2026-08-25T00:05:00.000Z'
  const secondService = environment.service()
  const second = await secondService.plan(first.input)
  assert.equal(second.researchPlanId, first.planned.researchPlanId)
  assert.equal(second.evidenceCaseId, first.planned.evidenceCaseId)
  assert.deepEqual([second.radar.researchRequestId, second.scout.researchRequestId, second.hermes.researchRequestId], [first.planned.radar.researchRequestId, first.planned.scout.researchRequestId, first.planned.hermes.researchRequestId])
}))

test('las tres sesiones por request comparten researchPlanId y evidenceCaseId', () => withEnvironment(async (environment) => {
  const { input, planned } = await prepare(environment, 'shared')
  const sessions = await environment.requestStore().list(input.intake.identity.projectId)
  assert.equal(sessions.length, 3)
  assert.equal(sessions.every((item) => item.researchPlanId === planned.researchPlanId), true)
  assert.equal(sessions.every((item) => item.evidenceCaseId === planned.evidenceCaseId), true)
}))

test('el caso asocia y localiza las tres requests independientes', () => withEnvironment(async (environment) => {
  const { planned } = await prepare(environment, 'association')
  const store = environment.evidenceCaseStore()
  const record = await store.read(planned.evidenceCaseId)
  const requestIds = [planned.radar, planned.scout, planned.hermes].map((item) => item.researchRequestId).sort()
  assert.deepEqual(record.requests.map((item) => item.researchRequestId).sort(), requestIds)
  assert.deepEqual(record.preparedRequestIds, requestIds)
  for (const requestId of requestIds) assert.equal((await store.findByRequestId(requestId)).evidenceCaseId, planned.evidenceCaseId)
}))

test('fallo parcial de preparación deja preparing durable y recuperable', () => withEnvironment(async (environment) => {
  const partial = await leavePreparing(environment)
  assert.equal(partial.record.state, 'preparing')
  assert.equal(partial.record.pendingOperations.includes('complete_plan'), true)
  assert.equal(partial.record.preparedRequestIds.length, 0)
  assert.equal(partial.record.lastErrorCode, 'INJECTED_FAILURE')
}))

test('un caso preparing rechaza contribuciones antes de quedar ready', () => withEnvironment(async (environment) => {
  const partial = await leavePreparing(environment, 'not-ready')
  const requestRecord = partial.record.requests[0]
  await rejectsCode(() => partial.service.receiveContribution(contribution(requestRecord)), 'EVIDENCE_CASE_NOT_READY')
  assert.equal((await environment.evidenceCaseStore().read(partial.evidenceCaseId)).receipts.length, 0)
}))

test('replan saludable completa preparing sin duplicar asociaciones', () => withEnvironment(async (environment) => {
  const partial = await leavePreparing(environment, 'resume')
  const recovered = await environment.service().plan(partial.input)
  const record = await environment.evidenceCaseStore().read(partial.evidenceCaseId)
  assert.equal(recovered.caseState, 'ready')
  assert.equal(record.state, 'ready')
  assert.equal(record.requests.length, 3)
  assert.equal(record.preparedRequestIds.length, 3)
  assert.equal(new Set(record.preparedRequestIds).size, 3)
}))

test('receiveContribution rechaza claves superiores no allowlisted', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'closed-extra')
  await rejectsCode(() => service.receiveContribution({ ...contribution(planned.radar), corroborations: [] }), 'INVALID_CONTRIBUTION')
  assert.equal((await environment.evidenceCaseStore().read(planned.evidenceCaseId)).receipts.length, 0)
}))

test('receiveContribution rechaza claim ausente', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'closed-missing')
  const input = contribution(planned.radar)
  delete input.claim
  await rejectsCode(() => service.receiveContribution(input), 'INVALID_CONTRIBUTION')
}))

test('receiveContribution rechaza una request inexistente', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'unknown-request')
  const input = contribution(planned.radar)
  input.researchRequestId = `research-${'f'.repeat(32)}`
  input.rawReceipt.researchRequestId = input.researchRequestId
  await rejectsCode(() => service.receiveContribution(input), 'REQUEST_NOT_FOUND')
}))

test('receipt se valida contra researchRequestId canónico', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'request-correlation')
  const input = contribution(planned.radar)
  input.rawReceipt.researchRequestId = `research-${'e'.repeat(32)}`
  await rejectsCode(() => service.receiveContribution(input), 'INVALID_RECEIPT_CORRELATION')
  assert.equal((await environment.evidenceCaseStore().read(planned.evidenceCaseId)).receipts.length, 0)
}))

test('receipt se valida contra providerType de su request', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'provider-correlation')
  const input = contribution(planned.radar)
  input.rawReceipt.providerType = 'crawler'
  await rejectsCode(() => service.receiveContribution(input), 'INVALID_RECEIPT_CORRELATION')
  assert.equal((await environment.evidenceCaseStore().read(planned.evidenceCaseId)).receipts.length, 0)
}))

test('receipt no exitoso queda durable sin convertirse en evidencia', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'failed-receipt')
  const result = await service.receiveContribution(contribution(planned.radar, { status: 'failed' }))
  const record = await environment.evidenceCaseStore().read(planned.evidenceCaseId)
  assert.equal(result.state, 'evidence_pending')
  assert.equal(record.receipts.length, 1)
  assert.equal(record.evidenceDecisions.length, 0)
  assert.equal(environment.memory.calls.length, 0)
}))

test('primera evidencia válida queda needs_corroboration y no toca MEMORIA', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'needs')
  const result = await service.receiveContribution(contribution(planned.radar))
  const reopened = await service.reopenEvidenceCase(planned.evidenceCaseId)
  assert.equal(result.state, 'needs_corroboration')
  assert.equal(reopened.state, 'needs_corroboration')
  assert.equal(reopened.receiptsReceived, 1)
  assert.equal(environment.memory.calls.length, 0)
}))

test('receive legado ignora corroboración del caller y usa sólo receipts persistidos', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'legacy-untrusted')
  const fake = { evidenceId: 'evidence-forged', providerType: 'crawler', source: 'https://forged.test/a', contentHash: digest('forged'), claim: 'Claim controlado compartido', polarity: 'supports' }
  const result = await service.receive({ ...contribution(planned.radar), corroborations: [fake] })
  const record = await environment.evidenceCaseStore().read(planned.evidenceCaseId)
  assert.equal(result.state, 'needs_corroboration')
  assert.equal(record.receipts.length, 1)
  assert.equal(record.contributions.length, 1)
  assert.equal(environment.memory.calls.length, 0)
}))

test('dos receipts del mismo provider no corroboran aunque host y hash difieran', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'same-provider')
  await service.receiveContribution(contribution(planned.radar, { seed: 'same-provider-one', host: 'same-provider-one' }))
  const result = await service.receiveContribution(contribution(planned.radar, { seed: 'same-provider-two', host: 'same-provider-two' }))
  assert.equal(result.state, 'needs_corroboration')
  assert.equal(environment.memory.calls.length, 0)
}))

test('providers distintos con el mismo host no corroboran', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'same-host')
  await service.receiveContribution(contribution(planned.radar, { seed: 'same-host-one', host: 'shared-host' }))
  const result = await service.receiveContribution(contribution(planned.scout, { seed: 'same-host-two', host: 'shared-host' }))
  assert.equal(result.state, 'needs_corroboration')
  assert.equal(environment.memory.calls.length, 0)
}))

test('provider y host distintos con el mismo hash no corroboran', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'same-hash')
  await service.receiveContribution(contribution(planned.radar, { seed: 'shared-hash', host: 'hash-host-one' }))
  const result = await service.receiveContribution(contribution(planned.scout, { seed: 'shared-hash', host: 'hash-host-two' }))
  assert.equal(result.state, 'needs_corroboration')
  assert.equal(environment.memory.calls.length, 0)
}))

test('provider, host y hash independientes producen accepted_for_context', () => withEnvironment(async (environment) => {
  const accepted = await acceptCase(environment, 'independent')
  assert.equal(accepted.first.state, 'needs_corroboration')
  assert.equal(accepted.second.state, 'accepted_for_context')
  assert.equal(accepted.second.evidence.state, 'accepted_for_context')
  assert.equal(accepted.second.evidence.corroborationCount, 1)
}))

test('aceptación realiza exactamente un append canónico con trazabilidad del caso', () => withEnvironment(async (environment) => {
  const accepted = await acceptCase(environment, 'memory-once')
  const loaded = await environment.memoryStore.readEvents()
  assert.equal(environment.memory.calls.length, 1)
  assert.equal(loaded.entries.length, 1)
  assert.equal(loaded.entries[0].metadata.researchPlanId, accepted.planned.researchPlanId)
  assert.equal(loaded.entries[0].metadata.evidenceCaseId, accepted.planned.evidenceCaseId)
  assert.equal(loaded.entries[0].metadata.receiptIds.length, 2)
  assert.equal(loaded.entries[0].provenance, 'supervised_research_evidence_case_gate')
}))

test('replay de contribución aceptada es idempotente y no repite append', () => withEnvironment(async (environment) => {
  const accepted = await acceptCase(environment, 'accepted-replay')
  environment.time.value = '2026-08-25T00:10:00.000Z'
  const replay = await accepted.service.receiveContribution(accepted.secondInput)
  assert.equal(replay.idempotent, true)
  assert.equal(replay.state, 'accepted_for_context')
  assert.equal(environment.memory.calls.length, 1)
  assert.equal((await environment.memoryStore.readEvents()).entries.length, 1)
}))

test('tercera corroboración durable no genera un segundo append', () => withEnvironment(async (environment) => {
  const accepted = await acceptCase(environment, 'third-support')
  const third = await accepted.service.receiveContribution(contribution(accepted.planned.hermes, { seed: 'third-support-three', host: 'third-support-three' }))
  assert.equal(third.state, 'accepted_for_context')
  assert.equal(environment.memory.calls.length, 1)
  assert.equal((await environment.evidenceCaseStore().read(accepted.planned.evidenceCaseId)).receipts.length, 3)
}))

test('claims distintos crean contradicción y no eligen ganador ni append', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'contradiction')
  await service.receiveContribution(contribution(planned.radar, { seed: 'contradiction-one', host: 'contradiction-one', claim: 'La opcion A es valida' }))
  const result = await service.receiveContribution(contribution(planned.scout, { seed: 'contradiction-two', host: 'contradiction-two', claim: 'La opcion B es valida' }))
  const record = await environment.evidenceCaseStore().read(planned.evidenceCaseId)
  assert.equal(result.state, 'requires_human')
  assert.equal(result.evidence.contradictionCount, 1)
  assert.equal(record.contradictionStatus, 'preserved')
  assert.equal(record.evidenceDecisions[0].branches.length, 2)
  assert.equal(record.nextResponsible, 'lean')
  assert.equal(environment.memory.calls.length, 0)
}))

test('contradicción sobrevive reapertura desde una instancia nueva', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'contradiction-reopen')
  await service.receiveContribution(contribution(planned.radar, { seed: 'conflict-reopen-one', host: 'conflict-reopen-one', claim: 'Respuesta A' }))
  await service.receiveContribution(contribution(planned.scout, { seed: 'conflict-reopen-two', host: 'conflict-reopen-two', claim: 'Respuesta B' }))
  const fresh = environment.service()
  const reopened = await fresh.reopenEvidenceCase(planned.evidenceCaseId)
  assert.equal(reopened.state, 'requires_human')
  assert.equal(reopened.contradictionStatus, 'preserved')
  assert.equal(reopened.evidence.contradictionCount, 1)
  assert.equal(reopened.nextResponsible, 'lean')
}))

test('una corroboración posterior no resuelve automáticamente la contradicción', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'conflict-sticky')
  await service.receiveContribution(contribution(planned.radar, { seed: 'sticky-one', host: 'sticky-one', claim: 'Respuesta A' }))
  await service.receiveContribution(contribution(planned.scout, { seed: 'sticky-two', host: 'sticky-two', claim: 'Respuesta B' }))
  const later = await service.receiveContribution(contribution(planned.hermes, { seed: 'sticky-three', host: 'sticky-three', claim: 'Respuesta A' }))
  assert.equal(later.state, 'requires_human')
  assert.equal((await service.reopenEvidenceCase(planned.evidenceCaseId)).contradictionStatus, 'preserved')
  assert.equal(environment.memory.calls.length, 0)
}))

test('replay con otro timestamp conserva el receipt original byte a byte', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'timestamp-replay')
  const input = contribution(planned.radar, { seed: 'timestamp', host: 'timestamp' })
  const first = await service.receiveContribution(input)
  environment.time.value = '2026-08-25T04:00:00.000Z'
  const replay = await service.receiveContribution(input)
  assert.equal(replay.idempotent, true)
  assert.equal(replay.receipt.receivedAt, first.receipt.receivedAt)
  assert.equal((await environment.evidenceCaseStore().read(planned.evidenceCaseId)).receipts.length, 1)
}))

test('replay de receipt alterado se rechaza y preserva bytes durables', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'receipt-collision')
  const input = contribution(planned.radar, { seed: 'receipt-collision', host: 'receipt-collision' })
  await service.receiveContribution(input)
  const file = path.join(environment.evidenceCaseRoot, `${planned.evidenceCaseId}.json`)
  const before = await fs.promises.readFile(file, 'utf8')
  const altered = copy(input)
  altered.rawReceipt.excerpt = 'Contenido incompatible'
  await rejectsCode(() => service.receiveContribution(altered), 'INCOMPATIBLE_RECEIPT_REPLAY')
  assert.equal(await fs.promises.readFile(file, 'utf8'), before)
}))

test('replay de claim alterado se rechaza y preserva la contribución original', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'claim-collision')
  const input = contribution(planned.radar, { seed: 'claim-collision', host: 'claim-collision' })
  await service.receiveContribution(input)
  await rejectsCode(() => service.receiveContribution({ ...input, claim: 'Claim incompatible' }), 'INCOMPATIBLE_CONTRIBUTION_REPLAY')
  const record = await environment.evidenceCaseStore().read(planned.evidenceCaseId)
  assert.equal(record.contributions.length, 1)
  assert.equal(record.contributions[0].claim, input.claim)
}))

test('fallo de MEMORIA deja append pendiente y evidencia durable aceptada', () => withEnvironment(async (environment) => {
  environment.memory.failuresRemaining = 1
  const accepted = await acceptCase(environment, 'memory-pending')
  const record = await environment.evidenceCaseStore().read(accepted.planned.evidenceCaseId)
  assert.equal(accepted.second.state, 'accepted_for_context')
  assert.equal(record.memory.status, 'pending')
  assert.equal(record.pendingOperations.includes('memory_append'), true)
  assert.equal(record.lastErrorCode, 'INJECTED_MEMORY_FAILURE')
  assert.equal((await environment.memoryStore.readEvents()).entries.length, 0)
}))

test('retry reanuda sólo el append pendiente y converge idempotentemente', () => withEnvironment(async (environment) => {
  environment.memory.failuresRemaining = 1
  const accepted = await acceptCase(environment, 'memory-retry')
  const retried = await accepted.service.retryPendingResearch(accepted.planned.radar.researchRequestId)
  const again = await accepted.service.retryPendingResearch(accepted.planned.radar.researchRequestId)
  assert.equal(retried.memory.status, 'appended')
  assert.deepEqual(retried.pendingOperations, [])
  assert.equal(again.memory.status, 'appended')
  assert.equal(environment.memory.calls.length, 2)
  assert.equal((await environment.memoryStore.readEvents()).entries.length, 1)
}))

test('reconcile desde instancia nueva recupera pendiente una sola vez', () => withEnvironment(async (environment) => {
  environment.memory.failuresRemaining = 1
  const accepted = await acceptCase(environment, 'memory-reconcile')
  const fresh = environment.service()
  const first = await fresh.reconcilePendingResearch(accepted.input.intake.identity.projectId)
  const second = await fresh.reconcilePendingResearch(accepted.input.intake.identity.projectId)
  assert.equal(first.length, 1)
  assert.equal(first[0].memory.status, 'appended')
  assert.deepEqual(second, [])
  assert.equal(environment.memory.calls.length, 2)
  assert.equal((await environment.memoryStore.readEvents()).entries.length, 1)
}))

test('reopen por request reconstruye estado aceptado desde persistencia', () => withEnvironment(async (environment) => {
  const accepted = await acceptCase(environment, 'cold-reopen')
  const fresh = environment.service()
  const reopened = await fresh.reopen(accepted.planned.radar.researchRequestId)
  assert.equal(reopened.state, 'completed_with_evidence')
  assert.equal(reopened.evidence.state, 'accepted_for_context')
  assert.equal(reopened.researchPlanId, accepted.planned.researchPlanId)
  assert.equal(reopened.evidenceCaseId, accepted.planned.evidenceCaseId)
}))

test('contribuciones concurrentes independientes no pierden receipts', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'concurrent-independent')
  const results = await Promise.all([
    service.receiveContribution(contribution(planned.radar, { seed: 'concurrent-one', host: 'concurrent-one' })),
    service.receiveContribution(contribution(planned.scout, { seed: 'concurrent-two', host: 'concurrent-two' })),
  ])
  const record = await environment.evidenceCaseStore().read(planned.evidenceCaseId)
  assert.equal(record.receipts.length, 2)
  assert.equal(record.contributions.length, 2)
  assert.equal(results.some((item) => item.state === 'accepted_for_context'), true)
  assert.equal(environment.memory.calls.length, 1)
}))

test('replay concurrente del mismo receipt persiste una sola contribución', () => withEnvironment(async (environment) => {
  const { planned, service } = await prepare(environment, 'concurrent-replay')
  const input = contribution(planned.radar, { seed: 'concurrent-replay', host: 'concurrent-replay' })
  const results = await Promise.all([service.receiveContribution(input), service.receiveContribution(input)])
  const record = await environment.evidenceCaseStore().read(planned.evidenceCaseId)
  assert.deepEqual(results.map((item) => item.idempotent).sort(), [false, true])
  assert.equal(record.receipts.length, 1)
  assert.equal(record.contributions.length, 1)
}))

test('casos A/B permanecen aislados por proyecto y request', () => withEnvironment(async (environment) => {
  const service = environment.service()
  const a = await service.plan(planInput(`${environment.token}-isolation-a`))
  const b = await service.plan(planInput(`${environment.token}-isolation-b`))
  await service.receiveContribution(contribution(a.radar, { seed: 'isolation-a', host: 'isolation-a' }))
  const caseA = await environment.evidenceCaseStore().read(a.evidenceCaseId)
  const caseB = await environment.evidenceCaseStore().read(b.evidenceCaseId)
  assert.notEqual(a.evidenceCaseId, b.evidenceCaseId)
  assert.equal(caseA.receipts.length, 1)
  assert.equal(caseB.receipts.length, 0)
  assert.equal(caseB.state, 'ready')
  assert.deepEqual((await environment.evidenceCaseStore().list(`project-${environment.token}-isolation-a`)).map((item) => item.evidenceCaseId), [a.evidenceCaseId])
}))

test('corrupción se reporta con error allowlisted sin sobrescribir bytes', () => withEnvironment(async (environment) => {
  const { planned } = await prepare(environment, 'corruption')
  const file = path.join(environment.evidenceCaseRoot, `${planned.evidenceCaseId}.json`)
  await fs.promises.writeFile(file, 'not-json\n', 'utf8')
  const before = await fs.promises.readFile(file, 'utf8')
  const store = environment.evidenceCaseStore()
  await rejectsCode(() => store.read(planned.evidenceCaseId), 'CORRUPT_EVIDENCE_CASE')
  assert.equal(await fs.promises.readFile(file, 'utf8'), before)
  assert.deepEqual((await store.listDetailed()).corruptions, [{ evidenceCaseId: planned.evidenceCaseId, code: 'CORRUPT_EVIDENCE_CASE' }])
}))

test('colisión de evidenceCaseId preserva el caso original', () => withEnvironment(async (environment) => {
  const { planned } = await prepare(environment, 'collision')
  const store = environment.evidenceCaseStore()
  const record = await store.read(planned.evidenceCaseId)
  const file = path.join(environment.evidenceCaseRoot, `${planned.evidenceCaseId}.json`)
  const before = await fs.promises.readFile(file, 'utf8')
  const collidingPlanId = `research-plan-${digest('colliding-plan').slice(0, 32)}`
  await rejectsCode(() => store.write({ ...record, researchPlanId: collidingPlanId, revision: record.revision + 1 }), 'EVIDENCE_CASE_ID_COLLISION')
  assert.equal(await fs.promises.readFile(file, 'utf8'), before)
  assert.equal((await store.read(planned.evidenceCaseId)).researchPlanId, planned.researchPlanId)
}))

test('fallo atómico antes de rename conserva revisión y limpia staging', () => withEnvironment(async (environment) => {
  const { planned } = await prepare(environment, 'atomic-failure')
  const file = path.join(environment.evidenceCaseRoot, `${planned.evidenceCaseId}.json`)
  const before = await fs.promises.readFile(file, 'utf8')
  const failing = environment.evidenceCaseStore({ failureInjection: 'before_rename' })
  await rejectsCode(() => failing.update(planned.evidenceCaseId, (record) => ({ ...record, nextResponsible: 'scout' })), 'INJECTED_FAILURE')
  assert.equal(await fs.promises.readFile(file, 'utf8'), before)
  assert.equal((await fs.promises.readdir(environment.evidenceCaseRoot)).some((name) => name.endsWith('.stage')), false)
}))

test('índice se reconstruye desde casos, asociaciones y replay idempotente', () => withEnvironment(async (environment) => {
  const service = environment.service()
  const a = await service.plan(planInput(`${environment.token}-index-a`))
  const b = await service.plan(planInput(`${environment.token}-index-b`))
  const first = await service.rebuildEvidenceCaseIndex()
  const second = await service.rebuildEvidenceCaseIndex()
  assert.deepEqual(first.index.evidenceCaseIds, [a.evidenceCaseId, b.evidenceCaseId].sort())
  assert.equal(first.index.requestAssociations.length, 6)
  assert.equal(first.idempotent, false)
  assert.equal(second.idempotent, true)
  await fs.promises.rm(path.join(environment.evidenceCaseRoot, 'evidence-case-index.json'))
  const rebuilt = await service.rebuildEvidenceCaseIndex()
  assert.deepEqual(rebuilt.index, first.index)
  assert.equal(rebuilt.idempotent, false)
}))

let passed = 0
for (const [index, item] of tests.entries()) {
  try {
    await item.run()
    passed += 1
  } catch (error) {
    console.error(`FAIL jefe-supervised-research-evidence-case-smoke caso ${index + 1}: ${item.name}`)
    throw error
  }
}

assert.equal(passed, tests.length)
assert.ok(passed >= 28)
console.log(`PASS jefe-supervised-research-evidence-case-smoke: casos 1-${passed}`)
console.log('CORRELATION_SMOKE=PASS')
