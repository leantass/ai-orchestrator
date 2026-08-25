import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { canonical } = require('../electron/jefe-context-package-contract.cjs')
const { attempt, delivery, validateDelivery } = require('../electron/jefe-research-connector-contract.cjs')
const { createConnectorPersistence } = require('../electron/jefe-research-connector-persistence.cjs')
const { createConnectorRuntime } = require('../electron/jefe-research-connector-runtime.cjs')
const { receipt: providerReceipt } = require('../electron/jefe-research-contract.cjs')
const { budget } = require('../electron/jefe-research-provider-policy.cjs')
const { createStructuredAnalysisConnector, structuredAnalysisCandidate } = require('../electron/jefe-research-structured-analysis-connector.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-connector-delivery-'))
const now = '2026-08-25T03:00:00.000Z'
const deliveryFields = [
  'schemaVersion',
  'deliveryId',
  'sourceAttemptId',
  'researchSessionId',
  'researchRequestId',
  'researchPlanId',
  'evidenceCaseId',
  'discoveryId',
  'projectId',
  'connectorId',
  'providerType',
  'operation',
  'budget',
  'rawReceipt',
  'claim',
  'expectedReceiptId',
  'state',
  'createdAt',
  'deliveredAt',
  'receiptId',
]
const names = [
  'delivery cerrado y deterministico',
  'receipt esperado estable',
  'correlacion fisica exacta',
  'payload durable seguro',
  'matriz hostil rechazada',
  'persistencia antes de receive',
  'rechazo transitorio conserva pending',
  'rechazo no fabrica receipt ni research',
  'retry explicito copia delivery',
  'retry de delivery reserva cero',
  'retry concurrente crea un descendiente',
  'restart entrega sin adapter',
  'execute concurrente entrega una vez',
  'partial terminal conserva auditoria',
  'replay y reapertura idempotentes',
  'crash posterior al commit conserva outbox',
  'reconcile de crash nunca entrega ni ejecuta',
  'retry posterior a crash es idempotente',
  'status expone solo estado cerrado',
  'orphan reconcile no autoejecuta',
  'adulteracion y corrupcion aisladas',
  'concurrencia y aislamiento A B',
  'compatibilidad manual fixture y externos',
  'traps de capacidades en recovery',
]
const checks = new Map()

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function throwsCode(run, code) {
  assert.throws(run, (error) => {
    assert.equal(error?.code, code)
    return true
  })
}

async function rejectsCode(run, code) {
  await assert.rejects(run, (error) => {
    assert.equal(error?.code, code)
    return true
  })
}

function environment(name, options = {}) {
  const seed = digest(name)
  const providerType = options.providerType || 'structured_analysis'
  const operation = providerType === 'manual_reference' ? 'reference' : 'analyze'
  const researchRequestId = `research-${seed.slice(0, 32)}`
  const context = {
    researchSessionId: `research-session-${seed.slice(0, 16)}`,
    researchRequestId,
    researchPlanId: `research-plan-${digest(`${name}:plan`).slice(0, 32)}`,
    evidenceCaseId: `evidence-case-${digest(`${name}:case`).slice(0, 32)}`,
    discoveryId: `discovery-${seed.slice(0, 16)}`,
    projectId: `project-${seed.slice(0, 16)}`,
    providerType,
  }
  const connectorBudget = budget({ maxQueries: 2, maxSources: 4, maxBytesPerReceipt: 4096, maxTotalBytes: 8192, maxDepth: 1, maxDurationMs: 1000, maxRedirects: 1, maxAttempts: 2, maxCorroborations: 2 })
  const input = {
    schemaVersion: 'jefe-research-connector-input/v1',
    researchRequestId,
    providerType,
    objective: `Analizar estructura local ${seed.slice(0, 8)}`,
    questions: [`Que corroboracion independiente falta ${seed.slice(8, 16)}`],
    budget: connectorBudget,
    needsCorroboration: true,
  }
  const storeRoot = options.storeRoot || path.join(root, name)
  const persistence = createConnectorPersistence({ root: storeRoot })
  const behavior = options.behavior || {}
  const counters = { contexts: 0, inputs: 0, receives: 0, commits: 0 }
  const committed = new Map()
  const bridge = Object.freeze({
    getContributionContext(id) {
      counters.contexts += 1
      assert.equal(id, researchRequestId)
      return clone(context)
    },
    getConnectorInput(id) {
      counters.inputs += 1
      assert.equal(id, researchRequestId)
      return clone(input)
    },
    async receiveContribution(value) {
      counters.receives += 1
      counters.lastPayload = clone(value)
      if (behavior.onReceive) await behavior.onReceive(value, counters.receives)
      if (behavior.rejectBeforeCommit && counters.receives === 1) throw new Error('controlled transient rejection')
      const receipt = providerReceipt(value.rawReceipt, { researchRequestId, providerType, budget: connectorBudget }, now)
      let result = committed.get(receipt.receiptId)
      if (!result) {
        result = {
          receipt,
          state: 'needs_corroboration',
          researchPlanId: context.researchPlanId,
          evidenceCaseId: context.evidenceCaseId,
          evidence: null,
          memory: { status: 'not_applicable', entryId: null },
        }
        committed.set(receipt.receiptId, result)
        counters.commits += 1
      }
      if (behavior.throwAfterCommit && counters.receives === 1) throw new Error('controlled post-commit crash')
      return clone(result)
    },
  })
  const attemptInput = {
    researchSessionId: context.researchSessionId,
    researchRequestId,
    discoveryId: context.discoveryId,
    projectId: context.projectId,
    providerType,
    operation,
  }
  return { name, context, input, attemptInput, persistence, storeRoot, bridge, counters, behavior, committed }
}

function countedProduct(counter) {
  const product = createStructuredAnalysisConnector()
  return Object.freeze({
    kind: 'controlled_local',
    async execute(value) {
      counter.calls += 1
      return product.execute(value)
    },
  })
}

function runtimeFor(env, options = {}) {
  return createConnectorRuntime({
    persistence: options.persistence || env.persistence,
    clock: () => now,
    trustedAdapters: options.adapters || {},
    trustedResearch: options.bridge || env.bridge,
    ...(options.policy ? { trustedPolicy: options.policy } : {}),
  })
}

function rawReceiptFor(env, method = 'controlled_adapter') {
  const candidate = structuredAnalysisCandidate(env.input)
  return {
    researchRequestId: env.context.researchRequestId,
    providerType: env.context.providerType,
    operation: env.attemptInput.operation,
    status: candidate.status,
    mimeType: candidate.mimeType,
    bytes: candidate.bytes,
    contentHash: candidate.contentHash,
    excerpt: candidate.excerpt,
    method,
    redirects: [...candidate.redirects],
    codes: [...candidate.codes],
    consumed: { ...candidate.consumed },
  }
}

function directDelivery(env) {
  const record = attempt(env.attemptInput, now)
  return delivery({ record, context: env.context, rawReceipt: rawReceiptFor(env), claim: env.input.objective, budget: env.input.budget, now })
}

async function persistPending(env) {
  const runtime = runtimeFor(env)
  const prepared = await runtime.prepareConnectorAttempt(env.attemptInput)
  const running = (await env.persistence.transitionAttempt(prepared.record.connectorAttemptId, (prior) => ({ ...prior, state: 'running', updatedAt: now }))).record
  const outbox = delivery({ record: running, context: env.context, rawReceipt: rawReceiptFor(env), claim: env.input.objective, budget: env.input.budget, now })
  return (await env.persistence.transitionAttempt(running.connectorAttemptId, (prior) => ({ ...prior, state: 'contributing', delivery: outbox, updatedAt: now }))).record
}

let transientPromise
async function transientScenario() {
  transientPromise ||= (async () => {
    const behavior = { rejectBeforeCommit: true }
    const env = environment('transient-rejection', { behavior })
    const adapterCounter = { calls: 0 }
    let persistedDuringReceive
    behavior.onReceive = async () => { persistedDuringReceive = await env.persistence.read(prepared.record.connectorAttemptId) }
    const runtime = runtimeFor(env, { adapters: { 'structured-analysis-local': countedProduct(adapterCounter) } })
    const prepared = await runtime.prepareConnectorAttempt(env.attemptInput)
    const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId)
    const failed = await env.persistence.read(prepared.record.connectorAttemptId)
    return { env, runtime, prepared, result, failed, persistedDuringReceive, adapterCounter }
  })()
  return transientPromise
}

let recoveredPromise
async function recoveredScenario() {
  recoveredPromise ||= (async () => {
    const scenario = await transientScenario()
    scenario.env.behavior.rejectBeforeCommit = false
    const adapterCounter = { calls: 0 }
    const adapterTrap = Object.freeze({ kind: 'controlled_local', execute() { adapterCounter.calls += 1; throw new Error('adapter must not run') } })
    const reopenedPersistence = createConnectorPersistence({ root: scenario.env.storeRoot })
    const runtime = runtimeFor(scenario.env, { persistence: reopenedPersistence, adapters: { 'structured-analysis-local': adapterTrap } })
    const retries = await Promise.all(Array.from({ length: 6 }, () => runtime.retryAttempt(scenario.failed.connectorAttemptId)))
    const retryId = retries[0].attempt
    const prepared = await reopenedPersistence.read(retryId)
    const executions = await Promise.all([runtime.executePreparedAttempt(retryId), runtime.executePreparedAttempt(retryId)])
    const terminal = await reopenedPersistence.read(retryId)
    return { ...scenario, runtime, reopenedPersistence, adapterCounter, retries, retryId, prepared, executions, terminal }
  })()
  return recoveredPromise
}

let crashPromise
async function crashScenario() {
  crashPromise ||= (async () => {
    const env = environment('terminal-cas-crash')
    const adapterCounter = { calls: 0 }
    let crashTerminal = true
    const base = env.persistence
    const crashingPersistence = {
      authorityRoot: base.authorityRoot,
      createReservedAttempt: (...args) => base.createReservedAttempt(...args),
      updateHealth: (...args) => base.updateHealth(...args),
      readHealth: (...args) => base.readHealth(...args),
      read: (...args) => base.read(...args),
      listAllAttempts: (...args) => base.listAllAttempts(...args),
      transitionAttempt(id, spec) {
        if (crashTerminal && spec && ['succeeded', 'partial'].includes(spec.nextState)) {
          crashTerminal = false
          throw new Error('controlled crash before terminal CAS')
        }
        return base.transitionAttempt(id, spec)
      },
    }
    const runtime = runtimeFor(env, { persistence: crashingPersistence, adapters: { 'structured-analysis-local': countedProduct(adapterCounter) } })
    const prepared = await runtime.prepareConnectorAttempt(env.attemptInput)
    await assert.rejects(() => runtime.executePreparedAttempt(prepared.record.connectorAttemptId), /controlled crash/u)
    const interrupted = await base.read(prepared.record.connectorAttemptId)
    return { env, base, adapterCounter, prepared, interrupted }
  })()
  return crashPromise
}

let crashRecoveredPromise
async function crashRecoveredScenario() {
  crashRecoveredPromise ||= (async () => {
    const scenario = await crashScenario()
    const adapterCounter = { calls: 0 }
    const adapterTrap = Object.freeze({ kind: 'controlled_local', execute() { adapterCounter.calls += 1; throw new Error('adapter must not run') } })
    const runtime = runtimeFor(scenario.env, { persistence: createConnectorPersistence({ root: scenario.env.storeRoot }), adapters: { 'structured-analysis-local': adapterTrap } })
    const reconciled = await runtime.reconcileAttempts({ projectId: scenario.env.context.projectId })
    const failed = await scenario.base.read(scenario.prepared.record.connectorAttemptId)
    const retried = await runtime.retryAttempt(failed.connectorAttemptId)
    const executed = await runtime.executePreparedAttempt(retried.attempt)
    const terminal = await scenario.base.read(retried.attempt)
    return { ...scenario, runtime, adapterCounter, reconciled, failed, retried, executed, terminal }
  })()
  return crashRecoveredPromise
}

checks.set(1, async () => {
  const env = environment('contract-shape')
  const first = directDelivery(env)
  const second = directDelivery(env)
  assert.deepEqual(Object.keys(first).sort(), [...deliveryFields].sort())
  assert.equal(canonical(first), canonical(second))
  assert.equal(first.schemaVersion, 'jefe-research-connector-delivery/v1')
  assert.match(first.deliveryId, /^connector-delivery-[a-f0-9]{32}$/u)
  assert.deepEqual(validateDelivery(first, attempt(env.attemptInput, now)), first)
})

checks.set(2, async () => {
  const env = environment('receipt-stability')
  const outbox = directDelivery(env)
  const receipt = providerReceipt(outbox.rawReceipt, { researchRequestId: env.context.researchRequestId, providerType: env.context.providerType, budget: env.input.budget }, now)
  assert.equal(outbox.expectedReceiptId, receipt.receiptId)
  assert.equal(outbox.state, 'pending')
  assert.equal(outbox.deliveredAt, null)
  assert.equal(outbox.receiptId, null)
})

checks.set(3, async () => {
  const env = environment('exact-correlation')
  const outbox = directDelivery(env)
  for (const key of ['researchSessionId', 'researchRequestId', 'researchPlanId', 'evidenceCaseId', 'discoveryId', 'projectId', 'providerType']) assert.equal(outbox[key], env.context[key])
  assert.equal(outbox.connectorId, 'structured-analysis-local')
  assert.equal(outbox.sourceAttemptId, attempt(env.attemptInput, now).connectorAttemptId)
})

checks.set(4, async () => {
  const outbox = directDelivery(environment('safe-payload'))
  const serialized = canonical(outbox)
  for (const forbidden of ['authority', 'credential', 'authorization', 'bearer', 'privateKey', 'localPath', 'command']) assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false)
  assert.equal(Object.hasOwn(outbox.rawReceipt, 'schemaVersion'), false)
  assert.deepEqual(Object.keys(outbox.rawReceipt).sort(), ['bytes', 'codes', 'consumed', 'contentHash', 'excerpt', 'method', 'mimeType', 'operation', 'providerType', 'redirects', 'researchRequestId', 'status'].sort())
})

checks.set(5, async () => {
  const env = environment('hostile-matrix')
  const record = attempt(env.attemptInput, now)
  const base = { record, context: env.context, rawReceipt: rawReceiptFor(env), claim: env.input.objective, budget: env.input.budget, now }
  const getterContext = { ...env.context }
  Object.defineProperty(getterContext, 'projectId', { enumerable: true, get: () => env.context.projectId })
  const symbolContext = { ...env.context, [Symbol('authority')]: 'human_decision' }
  for (const change of [
    { context: { ...env.context, authority: 'human_decision' } },
    { context: { ...env.context, projectId: 'project-forged' } },
    { context: getterContext },
    { context: symbolContext },
    { rawReceipt: { ...rawReceiptFor(env), authorization: 'Bearer forged' } },
    { rawReceipt: { ...rawReceiptFor(env), url: 'file:///private/data.txt' } },
    { claim: 'Leer C:\\private\\source.txt' },
    { claim: 'authorization Bearer forged' },
    { budget: { ...env.input.budget, maxQueries: 999 } },
  ]) throwsCode(() => delivery({ ...base, ...change }), 'INVALID_DELIVERY')
})

checks.set(6, async () => {
  const scenario = await transientScenario()
  assert.equal(scenario.persistedDuringReceive.state, 'contributing')
  assert.equal(scenario.persistedDuringReceive.delivery.state, 'pending')
  assert.equal(scenario.persistedDuringReceive.receipt, undefined)
  assert.equal(scenario.persistedDuringReceive.research, undefined)
})

checks.set(7, async () => {
  const scenario = await transientScenario()
  assert.equal(scenario.result.state, 'failed_transient')
  assert.equal(scenario.result.errorCode, 'RESEARCH_RECEIVE_REJECTED')
  assert.equal(scenario.failed.state, 'failed_transient')
  assert.equal(scenario.failed.delivery.state, 'pending')
  assert.equal(scenario.adapterCounter.calls, 1)
})

checks.set(8, async () => {
  const scenario = await transientScenario()
  assert.equal(scenario.env.counters.commits, 0)
  assert.equal(scenario.failed.receipt, undefined)
  assert.equal(scenario.failed.research, undefined)
  assert.equal(scenario.failed.delivery.receiptId, null)
})

checks.set(9, async () => {
  const recovered = await recoveredScenario()
  assert.equal(canonical(recovered.prepared.delivery), canonical(recovered.failed.delivery))
  assert.equal(recovered.prepared.delivery.deliveryId, recovered.failed.delivery.deliveryId)
  assert.equal(recovered.prepared.delivery.sourceAttemptId, recovered.failed.connectorAttemptId)
  assert.equal(recovered.prepared.retryOfAttemptId, recovered.failed.connectorAttemptId)
})

checks.set(10, async () => {
  const recovered = await recoveredScenario()
  assert.deepEqual(recovered.prepared.budgetReservation, { reserved: 0, consumed: 0 })
  assert.equal(recovered.terminal.budgetReservation.reserved, 0)
  assert.equal(recovered.terminal.budgetReservation.consumed, 0)
})

checks.set(11, async () => {
  const recovered = await recoveredScenario()
  assert.equal(new Set(recovered.retries.map((item) => item.attempt)).size, 1)
  assert.equal(recovered.retries.filter((item) => item.idempotent === false).length, 1)
  assert.equal((await recovered.reopenedPersistence.listAllAttempts(recovered.env.context.projectId)).length, 2)
})

checks.set(12, async () => {
  const recovered = await recoveredScenario()
  assert.equal(recovered.adapterCounter.calls, 0)
  assert.deepEqual(recovered.executions.map((item) => item.state), ['partial', 'partial'])
  assert.equal(recovered.env.counters.receives, 2)
})

checks.set(13, async () => {
  const recovered = await recoveredScenario()
  assert.equal(recovered.env.counters.commits, 1)
  assert.equal(recovered.terminal.state, 'partial')
  const replay = await Promise.all([recovered.runtime.executePreparedAttempt(recovered.retryId), recovered.runtime.executePreparedAttempt(recovered.retryId)])
  assert.deepEqual(replay.map((item) => item.state), ['partial', 'partial'])
  assert.equal(recovered.env.counters.receives, 2)
})

checks.set(14, async () => {
  const recovered = await recoveredScenario()
  assert.equal(recovered.terminal.receipt.status, 'partial')
  assert.equal(recovered.terminal.research.state, 'needs_corroboration')
  assert.equal(recovered.terminal.delivery.state, 'delivered')
  assert.equal(recovered.terminal.delivery.receiptId, recovered.terminal.receipt.receiptId)
  assert.equal(recovered.terminal.delivery.expectedReceiptId, recovered.terminal.receipt.receiptId)
})

checks.set(15, async () => {
  const recovered = await recoveredScenario()
  const before = await fs.promises.readFile(path.join(recovered.env.storeRoot, `${recovered.retryId}.json`), 'utf8')
  const reopened = createConnectorPersistence({ root: recovered.env.storeRoot })
  assert.equal(canonical(await reopened.read(recovered.retryId)), canonical(recovered.terminal))
  const retryReplay = await recovered.runtime.retryAttempt(recovered.failed.connectorAttemptId)
  assert.equal(retryReplay.attempt, recovered.retryId)
  assert.equal(retryReplay.idempotent, true)
  assert.equal(await fs.promises.readFile(path.join(recovered.env.storeRoot, `${recovered.retryId}.json`), 'utf8'), before)
})

checks.set(16, async () => {
  const scenario = await crashScenario()
  assert.equal(scenario.interrupted.state, 'contributing')
  assert.equal(scenario.interrupted.delivery.state, 'pending')
  assert.equal(scenario.env.counters.receives, 1)
  assert.equal(scenario.env.counters.commits, 1)
  assert.equal(scenario.adapterCounter.calls, 1)
})

checks.set(17, async () => {
  const scenario = await crashRecoveredScenario()
  assert.equal(scenario.reconciled.items.length, 1)
  assert.equal(scenario.reconciled.items[0].state, 'failed_transient')
  assert.equal(scenario.failed.errorCode, 'INTERRUPTED')
  assert.equal(scenario.failed.delivery.state, 'pending')
  assert.equal(scenario.adapterCounter.calls, 0)
})

checks.set(18, async () => {
  const scenario = await crashRecoveredScenario()
  assert.equal(scenario.executed.state, 'partial')
  assert.equal(scenario.terminal.delivery.state, 'delivered')
  assert.equal(scenario.env.counters.receives, 2)
  assert.equal(scenario.env.counters.commits, 1)
  assert.equal(scenario.adapterCounter.calls, 0)
})

checks.set(19, async () => {
  const transient = await transientScenario()
  const recovered = await recoveredScenario()
  const pendingStatus = await transient.runtime.getAttemptStatus(transient.failed.connectorAttemptId)
  const deliveredStatus = await recovered.runtime.getAttemptStatus(recovered.retryId)
  assert.equal(pendingStatus.deliveryState, 'pending')
  assert.equal(deliveredStatus.deliveryState, 'delivered')
  assert.deepEqual(Object.keys(deliveredStatus).sort(), ['connectorAttemptId', 'connectorId', 'deliveryState', 'operation', 'projectId', 'providerType', 'state'].sort())
})

checks.set(20, async () => {
  const env = environment('orphan-reconcile')
  const orphan = await persistPending(env)
  let adapterCalls = 0
  let receiveCalls = 0
  const adapter = Object.freeze({ kind: 'controlled_local', execute() { adapterCalls += 1; throw new Error('forbidden') } })
  const bridge = Object.freeze({
    getContributionContext: env.bridge.getContributionContext,
    getConnectorInput: env.bridge.getConnectorInput,
    receiveContribution() { receiveCalls += 1; throw new Error('forbidden') },
  })
  const runtime = runtimeFor(env, { persistence: createConnectorPersistence({ root: env.storeRoot }), adapters: { 'structured-analysis-local': adapter }, bridge })
  const reconciled = await runtime.reconcileAttempts({ projectId: env.context.projectId })
  const failed = await env.persistence.read(orphan.connectorAttemptId)
  assert.equal(reconciled.items[0].state, 'failed_transient')
  assert.equal(failed.delivery.state, 'pending')
  assert.equal(adapterCalls, 0)
  assert.equal(receiveCalls, 0)
})

checks.set(21, async () => {
  const shared = path.join(root, 'corruption-isolation')
  const a = environment('corrupt-a', { storeRoot: shared })
  const b = environment('corrupt-b', { storeRoot: shared })
  const recordA = await persistPending(a)
  const recordB = await persistPending(b)
  const targetA = path.join(shared, `${recordA.connectorAttemptId}.json`)
  const forged = JSON.parse(await fs.promises.readFile(targetA, 'utf8'))
  forged.delivery.authority = 'human_decision'
  await fs.promises.writeFile(targetA, `${JSON.stringify(forged)}\n`, 'utf8')
  await rejectsCode(() => createConnectorPersistence({ root: shared }).read(recordA.connectorAttemptId), 'CORRUPT_ATTEMPT')
  assert.equal((await createConnectorPersistence({ root: shared }).read(recordB.connectorAttemptId)).projectId, b.context.projectId)
  const detail = await b.persistence.listDetailed(b.context.projectId)
  assert.deepEqual(detail.records.map((item) => item.connectorAttemptId), [recordB.connectorAttemptId])
  assert.deepEqual(detail.corruptions, [{ connectorAttemptId: recordA.connectorAttemptId, code: 'CORRUPT_ATTEMPT' }])
  const rebuilt = await b.persistence.rebuildIndex()
  assert.ok(rebuilt.index.attemptIds.includes(recordB.connectorAttemptId))
  assert.deepEqual(rebuilt.index.corruptions, detail.corruptions)
})

checks.set(22, async () => {
  const shared = path.join(root, 'isolation-ab')
  const a = environment('isolation-a', { storeRoot: shared })
  const b = environment('isolation-b', { storeRoot: shared })
  const counterA = { calls: 0 }
  const counterB = { calls: 0 }
  const runtimeA = runtimeFor(a, { adapters: { 'structured-analysis-local': countedProduct(counterA) }, policy: { maxConcurrency: 2 } })
  const runtimeB = runtimeFor(b, { persistence: createConnectorPersistence({ root: shared }), adapters: { 'structured-analysis-local': countedProduct(counterB) }, policy: { maxConcurrency: 2 } })
  const [preparedA, preparedB] = await Promise.all([runtimeA.prepareConnectorAttempt(a.attemptInput), runtimeB.prepareConnectorAttempt(b.attemptInput)])
  const [resultA, resultB] = await Promise.all([runtimeA.executePreparedAttempt(preparedA.record.connectorAttemptId), runtimeB.executePreparedAttempt(preparedB.record.connectorAttemptId)])
  const [savedA, savedB] = await Promise.all([a.persistence.read(preparedA.record.connectorAttemptId), b.persistence.read(preparedB.record.connectorAttemptId)])
  assert.deepEqual([resultA.state, resultB.state], ['partial', 'partial'])
  assert.deepEqual([counterA.calls, counterB.calls], [1, 1])
  assert.notEqual(savedA.delivery.deliveryId, savedB.delivery.deliveryId)
  assert.equal(savedA.delivery.projectId, a.context.projectId)
  assert.equal(savedB.delivery.projectId, b.context.projectId)
})

checks.set(23, async () => {
  const manualStore = createConnectorPersistence({ root: path.join(root, 'manual') })
  const manualRuntime = createConnectorRuntime({ persistence: manualStore, clock: () => now })
  const manual = await manualRuntime.prepareConnectorAttempt({ researchSessionId: 'research-session-manual', researchRequestId: 'research-manual', discoveryId: 'discovery-manual', projectId: 'project-manual', providerType: 'manual_reference', operation: 'reference' })
  assert.equal((await manualRuntime.executePreparedAttempt(manual.record.connectorAttemptId)).state, 'not_executed')
  assert.equal((await manualStore.read(manual.record.connectorAttemptId)).delivery, undefined)
  assert.equal((await manualRuntime.getAttemptStatus(manual.record.connectorAttemptId)).deliveryState, null)

  const fixtureEnv = environment('fixture-method')
  const fixture = () => ({ candidate: structuredAnalysisCandidate(fixtureEnv.input) })
  const fixtureRuntime = runtimeFor(fixtureEnv, { adapters: { 'structured-analysis-local': fixture } })
  const fixturePrepared = await fixtureRuntime.prepareConnectorAttempt(fixtureEnv.attemptInput)
  assert.equal((await fixtureRuntime.executePreparedAttempt(fixturePrepared.record.connectorAttemptId)).state, 'partial')
  assert.equal(fixtureEnv.counters.lastPayload.rawReceipt.method, 'injected_controlled_adapter')
  assert.equal(fixtureEnv.counters.inputs, 0)

  let externalCalls = 0
  const externalRuntime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: path.join(root, 'external') }), clock: () => now, trustedAdapters: { 'metasearch-not-connected': () => { externalCalls += 1; return { state: 'not_executed' } } } })
  const external = await externalRuntime.prepareConnectorAttempt({ researchSessionId: 'research-session-external', researchRequestId: 'research-external', discoveryId: 'discovery-external', projectId: 'project-external', providerType: 'metasearch', operation: 'search' })
  assert.equal((await externalRuntime.executePreparedAttempt(external.record.connectorAttemptId)).state, 'not_connected')
  assert.equal(externalCalls, 0)
})

checks.set(24, async () => {
  const behavior = { rejectBeforeCommit: true }
  const env = environment('capability-traps', { behavior })
  const firstCounter = { calls: 0 }
  const firstRuntime = runtimeFor(env, { adapters: { 'structured-analysis-local': countedProduct(firstCounter) } })
  const prepared = await firstRuntime.prepareConnectorAttempt(env.attemptInput)
  assert.equal((await firstRuntime.executePreparedAttempt(prepared.record.connectorAttemptId)).state, 'failed_transient')
  behavior.rejectBeforeCommit = false
  const trapCounter = { calls: 0 }
  const adapterTrap = Object.freeze({ kind: 'controlled_local', execute() { trapCounter.calls += 1; throw new Error('forbidden adapter') } })
  const runtime = runtimeFor(env, { persistence: createConnectorPersistence({ root: env.storeRoot }), adapters: { 'structured-analysis-local': adapterTrap } })
  const retry = await runtime.retryAttempt(prepared.record.connectorAttemptId)
  const http = require('node:http')
  const https = require('node:https')
  const dns = require('node:dns')
  const childProcess = require('node:child_process')
  const calls = []
  const restores = []
  const replace = (target, key, label) => {
    if (!target || typeof target[key] !== 'function') return
    const original = target[key]
    target[key] = () => { calls.push(label); throw new Error(`forbidden ${label}`) }
    restores.push(() => { target[key] = original })
  }
  for (const [target, keys, label] of [[http, ['request', 'get'], 'network'], [https, ['request', 'get'], 'network'], [dns, ['lookup', 'resolve'], 'dns'], [dns.promises, ['lookup', 'resolve'], 'dns'], [childProcess, ['exec', 'execFile', 'spawn', 'fork'], 'shell']]) for (const key of keys) replace(target, key, `${label}:${key}`)
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch')
  Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: () => { calls.push('fetch'); throw new Error('forbidden fetch') } })
  restores.push(() => { if (fetchDescriptor) Object.defineProperty(globalThis, 'fetch', fetchDescriptor); else delete globalThis.fetch })
  try {
    assert.equal((await runtime.executePreparedAttempt(retry.attempt)).state, 'partial')
    assert.equal(trapCounter.calls, 0)
    assert.deepEqual(calls, [])
  } finally {
    for (const restore of restores.reverse()) restore()
  }
})

const completed = []
try {
  const expected = Array.from({ length: names.length }, (_, index) => index + 1)
  assert.equal(checks.size, names.length)
  assert.deepEqual([...checks.keys()].sort((left, right) => left - right), expected)
  for (const number of expected) {
    try {
      await checks.get(number)()
      completed.push(number)
    } catch (error) {
      console.error(`FAIL jefe-research-connector-delivery-smoke caso ${number}: ${names[number - 1]}`)
      throw error
    }
  }
  assert.deepEqual(completed, expected)
  console.log(`PASS jefe-research-connector-delivery-smoke: ${completed.length}/${checks.size}`)
  console.log(`CONNECTOR_DELIVERY_SMOKE_STRUCTURE=${checks.size}/${checks.size}`)
  console.log(`CONNECTOR_DELIVERY_BEHAVIORAL_CASES_COMPLETE=${completed.length}/${checks.size}`)
  console.log(`CONNECTOR_DELIVERY_BEHAVIORAL_CASES_REAL=1-${checks.size}`)
  console.log(`ESCALON_3C_C_DELIVERY_SMOKE=${completed.length}/${checks.size}_PASS`)
} finally {
  await fs.promises.rm(root, { recursive: true, force: true })
}
