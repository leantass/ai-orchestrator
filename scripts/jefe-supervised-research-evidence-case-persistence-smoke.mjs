import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { canonical } = require('../electron/jefe-context-package-contract.cjs')
const { receipt: providerReceipt } = require('../electron/jefe-research-contract.cjs')
const { candidate } = require('../electron/jefe-research-evidence-contract.cjs')
const { evaluate } = require('../electron/jefe-research-evidence-gate.cjs')
const { createSupervisedResearchPersistence } = require('../electron/jefe-supervised-research-persistence.cjs')
const { createEvidenceCasePersistence } = require('../electron/jefe-supervised-research-evidence-case-persistence.cjs')
const { createSupervisedResearch } = require('../electron/jefe-supervised-research-orchestrator.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-evidence-authority-'))
const names = [
  'initial preparing canonico reabre congelado',
  'schema cerrado rechaza campo lateral',
  'identidad fisica exacta rechaza adulteracion',
  'plan y case ids se reconstruyen',
  'request cerrado rechaza campo lateral',
  'request id deterministico se reconstruye',
  'roles radar scout hermes son unicos',
  'package y handoff son unicos por rol',
  'request preserva identity plan y case',
  'requests comparten budget references y corroboracion',
  'prepared request ids son subset y completos tras preparing',
  'receipt se reconstruye con contrato canonico',
  'budget agregado de receipt pertenece al request',
  'receipt no puede cruzarse entre requests',
  'contribution correlaciona request y receipt',
  'claim durable usa texto seguro',
  'evidence decision se deriva del gate real',
  'branches de contradiccion se reconstruyen',
  'memory solo acompana accepted o aceptacion previa',
  'pending y last error son allowlisted',
  'next responsible corresponde al estado',
  'identidad superior es inmutable',
  'receipts son append only byte exacto',
  'contributions son append only byte exacto',
  'estado y memory solo avanzan',
  'CAS stale y locks globales serializan instancias',
  'scan listAll y findByRequest no truncan en cien',
  'corrupcion indice atomicidad y aislamiento A B se preservan',
]
const checks = new Map()
let sequence = 0
let clockTick = 0

function clock() {
  const value = new Date(Date.parse('2026-08-25T08:00:00.000Z') + clockTick).toISOString()
  clockTick += 1
  return value
}

function digest(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex')
}

function clone(value) {
  return JSON.parse(canonical(value))
}

function packageRef(agent, token) {
  return {
    agent,
    packageId: `context-package-${digest(`package:${token}:${agent}`).slice(0, 32)}`,
    handoffId: `agent-handoff-${digest(`handoff:${token}:${agent}`).slice(0, 32)}`,
    consumerStatus: 'not_connected',
  }
}

function inputFor(token) {
  return {
    intake: {
      state: 'ready_for_discovery',
      identity: { projectId: `project-${token}`, runId: `run-${token}`, versionId: `version-${token}` },
      intakeId: `intake-${token}`,
      objective: `Investigar evidencia durable ${token}`,
      questions: [`Que evidencia corresponde a ${token}`],
      expectedOutcome: `Resultado durable ${token}`,
    },
    packages: ['radar', 'scout', 'hermes'].map((agent) => packageRef(agent, token)),
    providerType: 'metasearch',
    budget: { maxQueries: 2, maxSources: 4 },
    references: ['https://reference.test/source'],
  }
}

function trustedProviders() {
  return { networkEnabled: false, providers: { manual_reference: { state: 'available' }, metasearch: { state: 'not_connected' } } }
}

async function environment(label, { memory = null, persistence = true } = {}) {
  const token = `${label}-${String(++sequence).padStart(3, '0')}`.toLowerCase().replace(/[^a-z0-9-]/gu, '-')
  const base = path.join(root, token)
  const caseRoot = path.join(base, 'cases')
  const requestRoot = path.join(base, 'requests')
  await fs.promises.mkdir(base, { recursive: true })
  const store = createEvidenceCasePersistence({ root: caseRoot })
  const service = createSupervisedResearch({
    memory,
    persistence: persistence ? createSupervisedResearchPersistence({ root: requestRoot }) : null,
    evidenceCasePersistence: store,
    clock,
    trusted: trustedProviders(),
  })
  const input = inputFor(token)
  const planned = await service.plan(input)
  const record = await store.read(planned.evidenceCaseId)
  return { token, base, caseRoot, requestRoot, store, service, input, planned, record }
}

function initialFromReady(record) {
  const initial = clone(record)
  initial.state = 'preparing'
  initial.revision = 0
  initial.preparedRequestIds = []
  initial.receipts = []
  initial.contributions = []
  initial.evidenceDecisions = []
  initial.pendingOperations = ['complete_plan']
  initial.memory = { status: 'not_applicable', entryId: null }
  initial.nextResponsible = 'jefe'
  initial.updatedAt = initial.createdAt
  delete initial.lastErrorCode
  delete initial.contradictionStatus
  return initial
}

function requestSeed(request) {
  const seed = clone(request)
  delete seed.researchRequestId
  delete seed.researchPlanId
  delete seed.evidenceCaseId
  return seed
}

function rehashRequest(request) {
  const next = clone(request)
  next.researchRequestId = `research-${digest(requestSeed(next)).slice(0, 32)}`
  return next
}

function rawReceipt(request, seed, { claim = 'Claim durable compartido', consumed = undefined } = {}) {
  return {
    input: {
      researchRequestId: request.researchRequestId,
      rawReceipt: {
        researchRequestId: request.researchRequestId,
        providerType: request.providerType,
        operation: request.providerType === 'manual_reference' ? 'reference' : 'search',
        status: 'received',
        url: `https://${seed}.test/source`,
        mimeType: 'text/plain',
        bytes: 24,
        contentHash: digest(seed),
        excerpt: 'Observacion durable controlada',
        ...(consumed ? { consumed } : {}),
      },
      claim,
    },
  }
}

async function oneContribution(env, suffix = 'one', options = {}) {
  const payload = rawReceipt(env.planned.radar, `${env.token}-${suffix}`, options).input
  await env.service.receiveContribution(payload)
  return { payload, record: await env.store.read(env.planned.evidenceCaseId) }
}

async function acceptedCase(label) {
  const memory = { calls: [], async append(input) { this.calls.push(clone(input)); return clone(input) } }
  const env = await environment(label, { memory })
  await env.service.receiveContribution(rawReceipt(env.planned.radar, `${env.token}-radar`).input)
  await env.service.receiveContribution(rawReceipt(env.planned.scout, `${env.token}-scout`).input)
  return { ...env, memory, record: await env.store.read(env.planned.evidenceCaseId) }
}

async function contradictedCase(label) {
  const env = await environment(label)
  await env.service.receiveContribution(rawReceipt(env.planned.radar, `${env.token}-radar`, { claim: 'La opcion A es valida' }).input)
  await env.service.receiveContribution(rawReceipt(env.planned.scout, `${env.token}-scout`, { claim: 'La opcion B es valida' }).input)
  return { ...env, record: await env.store.read(env.planned.evidenceCaseId) }
}

async function rejectsCode(run, code) {
  await assert.rejects(run, (error) => {
    assert.equal(error?.code, code)
    return true
  })
}

async function rejectedInitial(label, mutate) {
  const env = await environment(`seed-${label}`)
  const initial = initialFromReady(env.record)
  mutate(initial)
  const store = createEvidenceCasePersistence({ root: path.join(root, `reject-${label}-${sequence}`) })
  await rejectsCode(() => store.write(initial), 'INVALID_EVIDENCE_CASE')
  assert.equal((await store.listAll()).length, 0)
}

checks.set(1, async () => {
  const env = await environment('canonical-initial')
  const initial = initialFromReady(env.record)
  const target = createEvidenceCasePersistence({ root: path.join(root, 'canonical-initial-target') })
  const saved = await target.write(initial)
  const reopened = await target.read(initial.evidenceCaseId)
  assert.equal(saved.idempotent, false)
  assert.deepEqual(reopened, initial)
  assert.equal(Object.isFrozen(reopened), true)
  assert.equal(Object.isFrozen(reopened.identity), true)
})

checks.set(2, () => rejectedInitial('extra-field', (record) => { record.receiptAuthority = 'human_decision' }))

checks.set(3, () => rejectedInitial('physical-identity', (record) => { delete record.identity.runId }))

checks.set(4, () => rejectedInitial('derived-plan', (record) => { record.researchPlanId = `research-plan-${'a'.repeat(32)}` }))

checks.set(5, () => rejectedInitial('request-extra', (record) => { record.requests[0].capability = 'network' }))

checks.set(6, () => rejectedInitial('request-id', (record) => { record.requests[0].researchRequestId = `research-${'b'.repeat(32)}` }))

checks.set(7, () => rejectedInitial('roles', (record) => {
  const hermes = record.requests.find((item) => item.role === 'hermes')
  hermes.role = 'scout'
  hermes.actor = 'scout'
  hermes.researchRequestId = rehashRequest(hermes).researchRequestId
}))

checks.set(8, () => rejectedInitial('package-handoff', (record) => {
  record.requests[2].packageId = record.requests[1].packageId
  record.requests[2].handoffId = record.requests[1].handoffId
  record.requests[2] = rehashRequest(record.requests[2])
}))

checks.set(9, () => rejectedInitial('request-correlation', (record) => { record.requests[1].identity.versionId = 'version-forged' }))

checks.set(10, () => rejectedInitial('common-policy', (record) => {
  record.requests[0].budget.maxQueries = 1
  record.requests[0].references = ['https://different.test/source']
  record.requests[0] = rehashRequest(record.requests[0])
}))

checks.set(11, () => rejectedInitial('prepared-ids', (record) => {
  record.state = 'ready'
  record.pendingOperations = []
}))

checks.set(12, async () => {
  const env = await environment('receipt-canonical')
  const { record } = await oneContribution(env)
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.receipts[0].classification = 'VERIFIED'
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(13, async () => {
  const env = await environment('receipt-aggregate')
  const { record } = await oneContribution(env, 'first', { consumed: { queries: 2 } })
  const request = record.requests.find((item) => item.role === 'radar')
  const raw = rawReceipt(request, `${env.token}-second`, { consumed: { queries: 2 } }).input.rawReceipt
  const second = providerReceipt(raw, request, clock())
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.receipts = [...draft.receipts, second].sort((left, right) => left.receiptId.localeCompare(right.receiptId))
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(14, async () => {
  const env = await environment('receipt-cross')
  const { record } = await oneContribution(env)
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.receipts[0].researchRequestId = draft.requests.find((item) => item.role === 'scout').researchRequestId
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(15, async () => {
  const env = await environment('contribution-cross')
  const { record } = await oneContribution(env)
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.contributions[0].researchRequestId = draft.requests.find((item) => item.role === 'scout').researchRequestId
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(16, async () => {
  const env = await environment('unsafe-claim')
  const { record } = await oneContribution(env)
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.contributions[0].claim = 'authorization bearer private value'
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(17, async () => {
  const env = await environment('gate-derived')
  const { record } = await oneContribution(env)
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.state = 'accepted_for_context'
    draft.evidenceDecisions[0].state = 'accepted_for_context'
    draft.evidenceDecisions[0].nextResponsible = 'jefe'
    draft.pendingOperations = ['memory_append']
    draft.nextResponsible = 'jefe'
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(18, async () => {
  const env = await contradictedCase('branches-derived')
  await rejectsCode(() => env.store.update(env.record.evidenceCaseId, (draft) => {
    draft.evidenceDecisions[0].branches[0].claim = 'Ganador inventado'
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(19, async () => {
  const env = await environment('memory-state')
  await rejectsCode(() => env.store.update(env.record.evidenceCaseId, (draft) => {
    draft.memory = { status: 'appended', entryId: `research-evidence-${digest(draft.evidenceCaseId).slice(0, 24)}` }
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(20, async () => {
  const env = await environment('pending-errors')
  await rejectsCode(() => env.store.update(env.record.evidenceCaseId, (draft) => {
    draft.pendingOperations = ['execute_provider']
    draft.lastErrorCode = 'ARBITRARY_ERROR'
    return draft
  }), 'INVALID_EVIDENCE_CASE')
})

checks.set(21, async () => {
  const env = await environment('responsible-state')
  await rejectsCode(() => env.store.update(env.record.evidenceCaseId, (draft) => ({ ...draft, nextResponsible: 'lean' })), 'INVALID_EVIDENCE_CASE')
})

checks.set(22, async () => {
  const env = await environment('immutable-top')
  const before = await fs.promises.readFile(path.join(env.caseRoot, `${env.record.evidenceCaseId}.json`), 'utf8')
  await rejectsCode(() => env.store.update(env.record.evidenceCaseId, (draft) => ({ ...draft, identity: { ...draft.identity, versionId: 'version-forged' } })), 'INCOMPATIBLE_EVIDENCE_CASE')
  assert.equal(await fs.promises.readFile(path.join(env.caseRoot, `${env.record.evidenceCaseId}.json`), 'utf8'), before)
})

checks.set(23, async () => {
  const env = await environment('receipt-append-only')
  const { record } = await oneContribution(env)
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.receipts[0].excerpt = 'Observacion durable modificada'
    return draft
  }), 'INCOMPATIBLE_EVIDENCE_CASE')
})

checks.set(24, async () => {
  const env = await environment('contribution-append-only')
  const { record } = await oneContribution(env)
  const nextClaim = 'Claim durable alternativo'
  await rejectsCode(() => env.store.update(record.evidenceCaseId, (draft) => {
    draft.contributions[0].claim = nextClaim
    const request = draft.requests.find((item) => item.researchRequestId === draft.contributions[0].researchRequestId)
    const receipt = draft.receipts.find((item) => item.receiptId === draft.contributions[0].receiptId)
    const base = candidate({ request, receipt, claim: nextClaim, now: receipt.receivedAt })
    draft.evidenceDecisions = [evaluate({ request, receipt, claim: nextClaim, corroborations: [], now: base.timestamp })]
    return draft
  }), 'INCOMPATIBLE_EVIDENCE_CASE')
})

checks.set(25, async () => {
  const env = await acceptedCase('monotonic-memory')
  await rejectsCode(() => env.store.update(env.record.evidenceCaseId, (draft) => {
    draft.memory.status = 'pending'
    draft.pendingOperations = ['memory_append']
    draft.lastErrorCode = 'MEMORY_APPEND_FAILED'
    draft.updatedAt = clock()
    return draft
  }), 'INCOMPATIBLE_EVIDENCE_CASE')
})

checks.set(26, async () => {
  const env = await environment('global-cas')
  const left = createEvidenceCasePersistence({ root: env.caseRoot })
  const right = createEvidenceCasePersistence({ root: env.caseRoot })
  const prior = await left.read(env.record.evidenceCaseId)
  const nextLeft = { ...clone(prior), revision: prior.revision + 1, updatedAt: clock() }
  const nextRight = { ...clone(prior), revision: prior.revision + 1, updatedAt: clock() }
  const settled = await Promise.allSettled([left.write(nextLeft), right.write(nextRight)])
  assert.equal(settled.filter((item) => item.status === 'fulfilled').length, 1)
  assert.equal(settled.find((item) => item.status === 'rejected').reason.code, 'STALE_EVIDENCE_CASE')
  assert.equal((await fs.promises.readdir(env.caseRoot)).some((name) => name.endsWith('.stage')), false)
})

checks.set(27, async () => {
  const token = `unbounded-${String(++sequence).padStart(3, '0')}`
  const base = path.join(root, token)
  const store = createEvidenceCasePersistence({ root: path.join(base, 'cases') })
  const service = createSupervisedResearch({ evidenceCasePersistence: store, clock, trusted: trustedProviders() })
  const plans = []
  for (let index = 0; index < 105; index += 1) plans.push(await service.plan(inputFor(`${token}-${String(index).padStart(3, '0')}`)))
  const all = await store.listAll()
  assert.equal(all.length, 105)
  assert.equal((await store.listDetailed()).records.length, 105)
  assert.equal((await store.listDetailed(undefined, 7)).records.length, 7)
  const last = plans.at(-1)
  assert.equal((await store.findByRequestId(last.hermes.researchRequestId)).evidenceCaseId, last.evidenceCaseId)
  assert.equal((await store.rebuildIndex()).index.evidenceCaseIds.length, 105)
})

checks.set(28, async () => {
  const a = await environment('isolation-a')
  const b = await environment('isolation-b')
  const corruptId = `evidence-case-${'f'.repeat(32)}`
  await fs.promises.writeFile(path.join(a.caseRoot, `${corruptId}.json`), '{broken', 'utf8')
  await fs.promises.writeFile(path.join(a.caseRoot, 'evidence-case-index.json'), '{broken', 'utf8')
  const detailed = await a.store.listDetailed()
  assert.deepEqual(detailed.records.map((item) => item.evidenceCaseId), [a.record.evidenceCaseId])
  assert.deepEqual(detailed.corruptions, [{ evidenceCaseId: corruptId, code: 'CORRUPT_EVIDENCE_CASE' }])
  const rebuilt = await a.store.rebuildIndex()
  assert.equal(rebuilt.recovered, true)
  assert.deepEqual(rebuilt.index.corruptions, detailed.corruptions)
  assert.equal((await a.store.listAll(b.input.intake.identity.projectId)).length, 0)
  const failing = createEvidenceCasePersistence({ root: a.caseRoot, failureInjection: 'before_rename' })
  const before = await fs.promises.readFile(path.join(a.caseRoot, `${a.record.evidenceCaseId}.json`), 'utf8')
  await rejectsCode(() => failing.update(a.record.evidenceCaseId, (draft) => ({ ...draft, updatedAt: clock() })), 'INJECTED_FAILURE')
  assert.equal(await fs.promises.readFile(path.join(a.caseRoot, `${a.record.evidenceCaseId}.json`), 'utf8'), before)
  assert.equal((await fs.promises.readdir(a.caseRoot)).some((name) => name.endsWith('.stage')), false)
})

try {
  assert.equal(names.length, 28)
  assert.equal(checks.size, 28)
  const executed = []
  for (const [number, check] of checks) {
    await check()
    executed.push(number)
    console.log(`PASS ${number}/${checks.size} ${names[number - 1]}`)
  }
  assert.deepEqual(executed, Array.from({ length: checks.size }, (_, index) => index + 1))
  const range = `${executed[0]}-${executed.at(-1)}`
  console.log(`PASS jefe-supervised-research-evidence-case-persistence-smoke: casos ${range}`)
  console.log(`EVIDENCE_CASE_PERSISTENCE_SMOKE=${executed.length}/${checks.size}`)
  console.log(`BEHAVIORAL_CASES_REAL=${range}`)
} finally {
  const resolvedRoot = path.resolve(root)
  if (!resolvedRoot.startsWith(`${path.resolve(os.tmpdir())}${path.sep}`)) throw new Error('unsafe cleanup target')
  await fs.promises.rm(resolvedRoot, { recursive: true, force: true })
}
