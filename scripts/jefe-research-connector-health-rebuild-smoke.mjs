import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { canonical } = require('../electron/jefe-context-package-contract.cjs')
const { attempt, completeDelivery, delivery } = require('../electron/jefe-research-connector-contract.cjs')
const { createConnectorPersistence } = require('../electron/jefe-research-connector-persistence.cjs')
const { createConnectorRuntime } = require('../electron/jefe-research-connector-runtime.cjs')
const { receipt: providerReceipt } = require('../electron/jefe-research-contract.cjs')
const { budget } = require('../electron/jefe-research-provider-policy.cjs')
const { createStructuredAnalysisConnector, structuredAnalysisCandidate } = require('../electron/jefe-research-structured-analysis-connector.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-connector-health-rebuild-'))
const baseTime = Date.parse('2026-08-25T06:00:00.000Z')
const healthFields = ['schemaVersion', 'connectorId', 'state', 'failureCount', 'openedAt', 'halfOpenEligibleAt', 'probeAttemptId', 'lastTransitionAt']
const statusFields = ['schemaVersion', 'providerType', 'connectorId', 'catalogState', 'connectionState', 'circuitState', 'operationalState', 'networkEnabled', 'realConnector', 'fixture']
const names = [
  'getConnectorHealth sync compatible',
  'APIs async disponibles',
  'status operativo cerrado y congelado',
  'catalogo siete de siete honesto',
  'connection states separados',
  'connector real y fixture distinguidos',
  'red deshabilitada para todos',
  'rebuild vacio durable',
  'rebuild repetido byte idempotente',
  'rebuild global cubre siete connectors',
  'scan usa todos los attempts sin truncar',
  'fallos bajo umbral permanecen closed',
  'umbral abre circuito',
  'cooldown deriva timestamp exacto',
  'restart reproduce health',
  'status proyecta circuit open',
  'probe fisico in flight sostiene half open',
  'delivery pendiente prueba exito fisico y cierra probe',
  'retry de delivery es neutral y no reejecuta provider',
  'probe permanente reabre circuito',
  'crash terminal fisico antes de health se reconstruye',
  'health corrupto se informa sin mutar',
  'save ordinario no reemplaza corrupcion',
  'rebuild derivado reemplaza corrupcion',
  'attempt corrupto se preserva y aisla',
  'rebuild concurrente converge en mismos bytes',
  'aislamiento A B por authority root',
  'rebuild y status no ejecutan capacidades',
  'inspect detecta drift sin mutar',
  'lock causal se comparte entre instancias equivalentes',
  'not executed real reabre probe sin contar fallo',
  'solo exito fisico cierra probe',
  'replay neutral y rebuild conservan bytes exactos',
  'lineage y causalidad temporal invalidas degradan fuente sin materializar health',
]
const checks = new Map()

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function stamp(offsetMs) {
  return new Date(baseTime + offsetMs).toISOString()
}

function operationFor(providerType) {
  return providerType === 'manual_reference' ? 'reference' : 'analyze'
}

function rawAttempt(seed, providerType = 'manual_reference', projectId = null) {
  const hash = digest(seed)
  return {
    researchSessionId: `research-session-${hash.slice(0, 16)}`,
    researchRequestId: `research-${hash.slice(0, 32)}`,
    discoveryId: `discovery-${hash.slice(16, 32)}`,
    projectId: projectId || `project-${hash.slice(0, 16)}`,
    providerType,
    operation: operationFor(providerType),
  }
}

function runtimeFor(store, options = {}) {
  return createConnectorRuntime({
    persistence: store,
    clock: options.clock || (() => stamp(900000)),
    trustedPolicy: { maxTransientFailures: 2, circuitCooldownMs: 1000, ...(options.policy || {}) },
    trustedAdapters: options.adapters || {},
  })
}

async function createAttemptState(store, { seed, providerType = 'manual_reference', projectId, state = 'prepared', errorCode, createdAt = stamp(0), updatedAt = createdAt, maxTransientFailures = 2, circuitCooldownMs = 1000 }) {
  const preparedValue = attempt(rawAttempt(seed, providerType, projectId), createdAt)
  const prepared = (await store.createReservedAttempt(preparedValue, { maxReservationsPerProject: 1000, reservationCost: 0 })).record
  if (state === 'prepared') return prepared
  const claim = await store.claimExecution(prepared.connectorAttemptId, { expectedRevision: prepared.revision, now: createdAt, maxTransientFailures, circuitCooldownMs })
  assert.equal(claim.allowed, true)
  const running = claim.record
  if (state === 'running') return running
  let outcome
  let patch = { updatedAt }
  if (state === 'succeeded') {
    outcome = 'not_executed'
    patch = { ...patch, receipt: { status: 'not_executed', classification: 'UNTRUSTED_EXTERNAL_CONTENT' } }
  } else if (state === 'timed_out' || (state === 'failed_transient' && ['ADAPTER_FAILURE', 'INTERRUPTED'].includes(errorCode))) {
    outcome = 'counted_failure'
    patch = { ...patch, errorCode }
  } else {
    outcome = 'uncounted_failure'
    patch = { ...patch, errorCode }
  }
  return (await store.completeCircuitObservation(running.connectorAttemptId, { expectedStates: ['running'], expectedRevision: running.revision, nextState: state, patch, outcome, now: updatedAt, maxTransientFailures, circuitCooldownMs })).record
}

function structuredMaterial(seed) {
  const hash = digest(seed)
  const researchRequestId = `research-${hash.slice(0, 32)}`
  const connectorBudget = budget({ maxQueries: 2, maxSources: 2, maxBytesPerReceipt: 4096, maxTotalBytes: 8192, maxDepth: 1, maxDurationMs: 1000, maxRedirects: 1, maxAttempts: 2, maxCorroborations: 2 })
  const input = {
    schemaVersion: 'jefe-research-connector-input/v1',
    researchRequestId,
    providerType: 'structured_analysis',
    objective: `Analizar health local ${hash.slice(0, 8)}`,
    questions: [`Que corroboracion falta ${hash.slice(8, 16)}`],
    budget: connectorBudget,
    needsCorroboration: true,
  }
  const context = {
    researchSessionId: `research-session-${hash.slice(0, 16)}`,
    researchRequestId,
    researchPlanId: `research-plan-${digest(`${seed}:plan`).slice(0, 32)}`,
    evidenceCaseId: `evidence-case-${digest(`${seed}:case`).slice(0, 32)}`,
    discoveryId: `discovery-${hash.slice(16, 32)}`,
    projectId: `project-${hash.slice(0, 16)}`,
    providerType: 'structured_analysis',
  }
  return { input, context, connectorBudget }
}

async function failureScenario(name, { failures = 2, threshold = 2, providerType = 'manual_reference' } = {}) {
  const store = createConnectorPersistence({ root: path.join(root, name) })
  for (let index = 0; index < failures; index += 1) {
    await createAttemptState(store, { seed: `${name}-${index}`, providerType, projectId: `project-${name}`, state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(index * 100), updatedAt: stamp(index * 100 + 10), maxTransientFailures: threshold, circuitCooldownMs: 1000 })
  }
  const runtime = runtimeFor(store, { policy: { maxTransientFailures: threshold, circuitCooldownMs: 1000 } })
  const rebuilt = await runtime.rebuildConnectorHealth(providerType)
  return { store, runtime, rebuilt }
}

let emptyPromise
async function emptyScenario() {
  emptyPromise ||= (async () => {
    const storeRoot = path.join(root, 'empty')
    const store = createConnectorPersistence({ root: storeRoot })
    const runtime = runtimeFor(store)
    const first = await runtime.rebuildConnectorHealth('manual_reference')
    const target = path.join(storeRoot, 'health-manual-reference-local.json')
    const bytes = await fs.promises.readFile(target, 'utf8')
    return { storeRoot, store, runtime, first, target, bytes }
  })()
  return emptyPromise
}

let openPromise
async function openScenario() {
  openPromise ||= failureScenario('open', { failures: 2, threshold: 2 })
  return openPromise
}

let halfOpenPromise
async function halfOpenScenario() {
  halfOpenPromise ||= (async () => {
    const store = createConnectorPersistence({ root: path.join(root, 'half-open-delivery') })
    await createAttemptState(store, { seed: 'half-open-provider-failure', providerType: 'structured_analysis', projectId: 'project-half-open-failure', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10), maxTransientFailures: 1, circuitCooldownMs: 1000 })
    const preparedValue = attempt(rawAttempt('half-open-probe', 'structured_analysis', 'project-half-open-probe'), stamp(1100))
    const prepared = (await store.createReservedAttempt(preparedValue, { maxReservationsPerProject: 1000, reservationCost: 0 })).record
    const probe = await store.claimExecution(prepared.connectorAttemptId, { expectedRevision: prepared.revision, now: stamp(1100), maxTransientFailures: 1, circuitCooldownMs: 1000 })
    assert.equal(probe.allowed, true)
    const runtime = runtimeFor(store, { adapters: { 'structured-analysis-local': createStructuredAnalysisConnector() }, policy: { maxTransientFailures: 1, circuitCooldownMs: 1000 } })
    const rebuilt = await runtime.rebuildConnectorHealth('structured_analysis')
    return { store, runtime, probe: probe.record, rebuilt }
  })()
  return halfOpenPromise
}

let deliveryProbePromise
async function deliveryProbeScenario() {
  deliveryProbePromise ||= (async () => {
    const store = createConnectorPersistence({ root: path.join(root, 'delivery-probe-runtime') })
    const initial = structuredMaterial('delivery-probe-initial')
    const probe = structuredMaterial('delivery-probe-attempt')
    const materials = new Map([[initial.context.researchRequestId, initial], [probe.context.researchRequestId, probe]])
    const counters = { failingAdapter: 0, productAdapter: 0, receives: 0 }
    let current = stamp(0)
    const bridge = Object.freeze({
      getContributionContext(researchRequestId) { return { ...materials.get(researchRequestId).context } },
      getConnectorInput(researchRequestId) { return JSON.parse(canonical(materials.get(researchRequestId).input)) },
      receiveContribution(value) {
        counters.receives += 1
        if (counters.receives === 1) throw new Error('controlled delivery failure')
        const material = materials.get(value.researchRequestId)
        const receipt = providerReceipt(value.rawReceipt, { researchRequestId: value.researchRequestId, providerType: 'structured_analysis', budget: material.connectorBudget }, current)
        const evidence = {
          evidenceId: `evidence-${digest(canonical({ request: value.researchRequestId, receipt: receipt.receiptId, claim: value.claim })).slice(0, 32)}`,
          state: 'needs_corroboration',
          nextResponsible: 'scout',
          claim: value.claim,
          classification: 'UNTRUSTED_EXTERNAL_CONTENT',
          corroborationCount: 0,
          contradictionCount: 0,
        }
        return {
          receipt,
          state: 'needs_corroboration',
          researchPlanId: material.context.researchPlanId,
          evidenceCaseId: material.context.evidenceCaseId,
          evidence,
          memory: { status: 'not_applicable', entryId: null },
        }
      },
    })
    const failingAdapter = Object.freeze({ kind: 'controlled_local', execute() { counters.failingAdapter += 1; throw new Error('controlled provider failure') } })
    const failingRuntime = createConnectorRuntime({ persistence: store, clock: () => current, trustedPolicy: { maxTransientFailures: 1, circuitCooldownMs: 1000 }, trustedAdapters: { 'structured-analysis-local': failingAdapter }, trustedResearch: bridge })
    const firstPrepared = await failingRuntime.prepareConnectorAttempt({ researchSessionId: initial.context.researchSessionId, researchRequestId: initial.context.researchRequestId, discoveryId: initial.context.discoveryId, projectId: initial.context.projectId, providerType: 'structured_analysis', operation: 'analyze' })
    assert.equal((await failingRuntime.executePreparedAttempt(firstPrepared.record.connectorAttemptId)).state, 'failed_transient')
    const opened = await store.readHealth('structured-analysis-local')
    current = opened.halfOpenEligibleAt
    const product = createStructuredAnalysisConnector()
    const countedProduct = Object.freeze({ kind: 'controlled_local', async execute(value) { counters.productAdapter += 1; return product.execute(value) } })
    const runtime = createConnectorRuntime({ persistence: store, clock: () => current, trustedPolicy: { maxTransientFailures: 1, circuitCooldownMs: 1000 }, trustedAdapters: { 'structured-analysis-local': countedProduct }, trustedResearch: bridge })
    const probePrepared = await runtime.prepareConnectorAttempt({ researchSessionId: probe.context.researchSessionId, researchRequestId: probe.context.researchRequestId, discoveryId: probe.context.discoveryId, projectId: probe.context.projectId, providerType: 'structured_analysis', operation: 'analyze' })
    const probeResult = await runtime.executePreparedAttempt(probePrepared.record.connectorAttemptId)
    const failedProbe = await store.read(probePrepared.record.connectorAttemptId)
    const healthAfterFailure = await store.readHealth('structured-analysis-local')
    const healthTarget = path.join(store.authorityRoot, 'health-structured-analysis-local.json')
    const healthBytesAfterFailure = await fs.promises.readFile(healthTarget, 'utf8')
    current = new Date(Date.parse(current) + 100).toISOString()
    const retried = await runtime.retryAttempt(failedProbe.connectorAttemptId)
    const retryResult = await runtime.executePreparedAttempt(retried.attempt)
    const healthAfterRetry = await store.readHealth('structured-analysis-local')
    const healthBytesAfterRetry = await fs.promises.readFile(healthTarget, 'utf8')
    const bytesBeforeRebuild = healthBytesAfterRetry
    const rebuilt = await runtime.rebuildConnectorHealth('structured_analysis')
    const bytesAfterRebuild = await fs.promises.readFile(path.join(store.authorityRoot, 'health-structured-analysis-local.json'), 'utf8')
    return { store, runtime, counters, probeResult, failedProbe, healthAfterFailure, healthBytesAfterFailure, retried, retryResult, healthAfterRetry, healthBytesAfterRetry, rebuilt, bytesBeforeRebuild, bytesAfterRebuild }
  })()
  return deliveryProbePromise
}

let neutralProbePromise
async function neutralProbeScenario() {
  neutralProbePromise ||= (async () => {
    const storeRoot = path.join(root, 'neutral-probe-runtime')
    const store = createConnectorPersistence({ root: storeRoot })
    let current = stamp(0)
    let adapterCalls = 0
    const failing = runtimeFor(store, {
      clock: () => current,
      adapters: { 'manual-reference-local': () => { adapterCalls += 1; throw new Error('controlled provider failure') } },
      policy: { maxTransientFailures: 1, circuitCooldownMs: 1000 },
    })
    const first = await failing.prepareConnectorAttempt(rawAttempt('neutral-probe-failure'))
    assert.equal((await failing.executePreparedAttempt(first.record.connectorAttemptId)).state, 'failed_transient')
    const opened = await store.readHealth('manual-reference-local')
    current = opened.halfOpenEligibleAt
    const withoutAdapter = runtimeFor(store, { clock: () => current, policy: { maxTransientFailures: 1, circuitCooldownMs: 1000 } })
    const prepared = await withoutAdapter.prepareConnectorAttempt(rawAttempt('neutral-probe-not-executed'))
    const result = await withoutAdapter.executePreparedAttempt(prepared.record.connectorAttemptId)
    const saved = await store.read(prepared.record.connectorAttemptId)
    const health = await store.readHealth('manual-reference-local')
    const attemptBytes = await fs.promises.readFile(path.join(storeRoot, `${prepared.record.connectorAttemptId}.json`), 'utf8')
    const healthTarget = path.join(storeRoot, 'health-manual-reference-local.json')
    const healthBytes = await fs.promises.readFile(healthTarget, 'utf8')
    const replay = await withoutAdapter.executePreparedAttempt(prepared.record.connectorAttemptId)
    const rebuilt = await withoutAdapter.rebuildConnectorHealth('manual_reference')
    return { store, withoutAdapter, adapterCalls, opened, prepared, result, saved, health, attemptBytes, healthTarget, healthBytes, replay, rebuilt }
  })()
  return neutralProbePromise
}

let corruptHealthPromise
async function corruptHealthScenario() {
  corruptHealthPromise ||= (async () => {
    const storeRoot = path.join(root, 'corrupt-health')
    const store = createConnectorPersistence({ root: storeRoot })
    await createAttemptState(store, { seed: 'corrupt-health-attempt', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10) })
    await fs.promises.mkdir(storeRoot, { recursive: true })
    const target = path.join(storeRoot, 'health-manual-reference-local.json')
    const corruptBytes = '{"forged":"health"}\n'
    await fs.promises.writeFile(target, corruptBytes, 'utf8')
    const runtime = runtimeFor(store, { adapters: { 'manual-reference-local': () => ({ state: 'not_executed' }) }, policy: { maxTransientFailures: 1 } })
    return { storeRoot, store, target, corruptBytes, runtime }
  })()
  return corruptHealthPromise
}

checks.set(1, async () => {
  const runtime = runtimeFor(createConnectorPersistence({ root: path.join(root, 'sync-view') }))
  assert.deepEqual(runtime.getConnectorHealth('structured_analysis'), { connectorId: 'structured-analysis-local', state: 'ready', networkEnabled: false })
  assert.deepEqual(Object.keys(runtime.getConnectorHealth('manual_reference')).sort(), ['connectorId', 'networkEnabled', 'state'])
})

checks.set(2, async () => {
  const runtime = runtimeFor(createConnectorPersistence({ root: path.join(root, 'api-surface') }))
  assert.equal(typeof runtime.rebuildConnectorHealth, 'function')
  assert.equal(typeof runtime.rebuildAllConnectorHealth, 'function')
  assert.equal(typeof runtime.inspectConnectorHealth, 'function')
  assert.equal(typeof runtime.getConnectorOperationalStatus, 'function')
})

checks.set(3, async () => {
  const runtime = runtimeFor(createConnectorPersistence({ root: path.join(root, 'status-shape') }), { adapters: { 'structured-analysis-local': createStructuredAnalysisConnector() } })
  const status = await runtime.getConnectorOperationalStatus('structured_analysis')
  assert.deepEqual(Object.keys(status).sort(), [...statusFields].sort())
  assert.equal(status.schemaVersion, 'jefe-research-connector-operational-status/v1')
  assert.equal(Object.isFrozen(status), true)
})

checks.set(4, async () => {
  const runtime = runtimeFor(createConnectorPersistence({ root: path.join(root, 'catalog') }), { adapters: { 'structured-analysis-local': createStructuredAnalysisConnector() } })
  const providers = ['manual_reference', 'metasearch', 'automated_browser', 'crawler', 'local_model', 'structured_analysis', 'corroboration']
  const statuses = Object.fromEntries(await Promise.all(providers.map(async (provider) => [provider, (await runtime.getConnectorOperationalStatus(provider)).catalogState])))
  assert.deepEqual(statuses, { manual_reference: 'ready', metasearch: 'not_connected', automated_browser: 'disabled', crawler: 'not_connected', local_model: 'not_configured', structured_analysis: 'ready', corroboration: 'restricted' })
})

checks.set(5, async () => {
  const runtime = runtimeFor(createConnectorPersistence({ root: path.join(root, 'connections') }), { adapters: { 'structured-analysis-local': createStructuredAnalysisConnector(), 'metasearch-not-connected': () => ({ state: 'not_executed' }) } })
  assert.equal((await runtime.getConnectorOperationalStatus('structured_analysis')).connectionState, 'connected_local')
  assert.equal((await runtime.getConnectorOperationalStatus('manual_reference')).connectionState, 'reference_only')
  assert.equal((await runtime.getConnectorOperationalStatus('metasearch')).connectionState, 'not_connected')
  assert.equal((await runtime.getConnectorOperationalStatus('automated_browser')).connectionState, 'disabled')
  assert.equal((await runtime.getConnectorOperationalStatus('local_model')).connectionState, 'not_configured')
  assert.equal((await runtime.getConnectorOperationalStatus('corroboration')).connectionState, 'restricted')
})

checks.set(6, async () => {
  const product = runtimeFor(createConnectorPersistence({ root: path.join(root, 'real') }), { adapters: { 'structured-analysis-local': createStructuredAnalysisConnector() } })
  const fixture = runtimeFor(createConnectorPersistence({ root: path.join(root, 'fixture') }), { adapters: { 'structured-analysis-local': () => ({ state: 'not_executed' }) } })
  const realStatus = await product.getConnectorOperationalStatus('structured_analysis')
  const fixtureStatus = await fixture.getConnectorOperationalStatus('structured_analysis')
  assert.deepEqual({ realConnector: realStatus.realConnector, fixture: realStatus.fixture, connectionState: realStatus.connectionState }, { realConnector: true, fixture: false, connectionState: 'connected_local' })
  assert.deepEqual({ realConnector: fixtureStatus.realConnector, fixture: fixtureStatus.fixture, connectionState: fixtureStatus.connectionState }, { realConnector: false, fixture: true, connectionState: 'fixture_only' })
})

checks.set(7, async () => {
  const runtime = runtimeFor(createConnectorPersistence({ root: path.join(root, 'network') }), { adapters: { 'structured-analysis-local': createStructuredAnalysisConnector() } })
  for (const provider of ['manual_reference', 'metasearch', 'automated_browser', 'crawler', 'local_model', 'structured_analysis', 'corroboration']) assert.equal((await runtime.getConnectorOperationalStatus(provider)).networkEnabled, false)
})

checks.set(8, async () => {
  const scenario = await emptyScenario()
  assert.deepEqual(Object.keys(scenario.first.health).sort(), [...healthFields].sort())
  assert.equal(scenario.first.health.state, 'closed')
  assert.equal(scenario.first.attemptsConsidered, 0)
  assert.equal(scenario.first.sourceIntegrity, 'complete')
  assert.equal(scenario.first.materialized, true)
  assert.equal(scenario.first.idempotent, false)
  assert.equal((await fs.promises.stat(scenario.target)).isFile(), true)
})

checks.set(9, async () => {
  const scenario = await emptyScenario()
  const repeated = await scenario.runtime.rebuildConnectorHealth('manual_reference')
  assert.equal(repeated.idempotent, true)
  assert.equal(await fs.promises.readFile(scenario.target, 'utf8'), scenario.bytes)
})

checks.set(10, async () => {
  const storeRoot = path.join(root, 'all-connectors')
  const runtime = runtimeFor(createConnectorPersistence({ root: storeRoot }))
  const rebuilt = await runtime.rebuildAllConnectorHealth()
  assert.equal(rebuilt.items.length, 7)
  assert.deepEqual(rebuilt.items.map((item) => item.providerType), ['automated_browser', 'corroboration', 'crawler', 'local_model', 'manual_reference', 'metasearch', 'structured_analysis'])
  for (const item of rebuilt.items) assert.equal((await fs.promises.stat(path.join(storeRoot, `health-${item.connectorId}.json`))).isFile(), true)
})

checks.set(11, async () => {
  const store = createConnectorPersistence({ root: path.join(root, 'untruncated') })
  const projectId = 'project-untruncated'
  await Promise.all(Array.from({ length: 75 }, (_, index) => createAttemptState(store, { seed: `untruncated-${index}`, projectId })))
  const runtime = runtimeFor(store)
  const rebuilt = await runtime.rebuildConnectorHealth('manual_reference')
  assert.equal(rebuilt.attemptsConsidered, 75)
  assert.equal((await store.listDetailed(projectId)).records.length, 50)
  assert.equal((await store.listAllAttempts(projectId)).length, 75)
})

checks.set(12, async () => {
  const scenario = await failureScenario('below-threshold', { failures: 2, threshold: 3 })
  assert.equal(scenario.rebuilt.health.state, 'closed')
  assert.equal(scenario.rebuilt.health.failureCount, 2)
  assert.equal(scenario.rebuilt.health.openedAt, null)
})

checks.set(13, async () => {
  const scenario = await openScenario()
  assert.equal(scenario.rebuilt.health.state, 'open')
  assert.equal(scenario.rebuilt.health.failureCount, 2)
  assert.equal(scenario.rebuilt.health.openedAt, stamp(110))
})

checks.set(14, async () => {
  const scenario = await openScenario()
  assert.equal(scenario.rebuilt.health.halfOpenEligibleAt, stamp(1110))
  assert.equal(scenario.rebuilt.health.lastTransitionAt, stamp(110))
})

checks.set(15, async () => {
  const scenario = await openScenario()
  const reopened = runtimeFor(createConnectorPersistence({ root: path.join(root, 'open') }), { policy: { maxTransientFailures: 2, circuitCooldownMs: 1000 } })
  const rebuilt = await reopened.rebuildConnectorHealth('manual_reference')
  assert.equal(rebuilt.idempotent, true)
  assert.equal(canonical(rebuilt.health), canonical(scenario.rebuilt.health))
})

checks.set(16, async () => {
  const scenario = await openScenario()
  const status = await scenario.runtime.getConnectorOperationalStatus('manual_reference')
  assert.equal(status.catalogState, 'ready')
  assert.equal(status.connectionState, 'reference_only')
  assert.equal(status.circuitState, 'open')
  assert.equal(status.operationalState, 'circuit_open')
})

checks.set(17, async () => {
  const scenario = await halfOpenScenario()
  assert.equal(scenario.rebuilt.health.state, 'half_open')
  assert.equal(scenario.rebuilt.health.probeAttemptId, scenario.probe.connectorAttemptId)
  assert.equal(scenario.probe.state, 'running')
  assert.equal(scenario.probe.circuitObservation.outcome, null)
  assert.equal((await scenario.runtime.getConnectorOperationalStatus('structured_analysis')).operationalState, 'half_open')
})

checks.set(18, async () => {
  const scenario = await deliveryProbeScenario()
  assert.equal(scenario.probeResult.state, 'failed_transient')
  assert.equal(scenario.failedProbe.delivery.state, 'pending')
  assert.equal(scenario.failedProbe.circuitObservation.outcome, 'success')
  assert.equal(scenario.healthAfterFailure.state, 'closed')
  assert.equal(scenario.healthAfterFailure.failureCount, 0)
})

checks.set(19, async () => {
  const scenario = await deliveryProbeScenario()
  assert.equal(scenario.retryResult.state, 'partial')
  assert.equal(scenario.counters.failingAdapter, 1)
  assert.equal(scenario.counters.productAdapter, 1)
  assert.equal(scenario.counters.receives, 2)
  assert.equal(scenario.healthAfterRetry.state, 'closed')
  assert.equal(scenario.healthBytesAfterRetry, scenario.healthBytesAfterFailure)
  assert.equal(canonical(scenario.rebuilt.health), canonical(scenario.healthAfterRetry))
  assert.equal(scenario.rebuilt.idempotent, true)
  assert.equal(scenario.bytesAfterRebuild, scenario.bytesBeforeRebuild)
})

checks.set(20, async () => {
  const store = createConnectorPersistence({ root: path.join(root, 'permanent-probe') })
  await createAttemptState(store, { seed: 'permanent-open', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10), maxTransientFailures: 1, circuitCooldownMs: 1000 })
  await createAttemptState(store, { seed: 'permanent-probe', state: 'failed_permanent', errorCode: 'ADAPTER_PERMANENT_FAILURE', createdAt: stamp(1100), updatedAt: stamp(1200), maxTransientFailures: 1, circuitCooldownMs: 1000 })
  const rebuilt = await runtimeFor(store, { policy: { maxTransientFailures: 1, circuitCooldownMs: 1000 } }).rebuildConnectorHealth('manual_reference')
  assert.equal(rebuilt.health.state, 'open')
  assert.equal(rebuilt.health.failureCount, 1)
  assert.equal(rebuilt.health.openedAt, stamp(1200))
  assert.equal(rebuilt.health.halfOpenEligibleAt, stamp(2200))
})

checks.set(21, async () => {
  const storeRoot = path.join(root, 'terminal-health-crash')
  const store = createConnectorPersistence({ root: storeRoot })
  await createAttemptState(store, { seed: 'crash-failure', providerType: 'structured_analysis', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10), maxTransientFailures: 1, circuitCooldownMs: 1000 })
  const runtime = runtimeFor(store, { adapters: { 'structured-analysis-local': createStructuredAnalysisConnector() }, policy: { maxTransientFailures: 1, circuitCooldownMs: 1000 } })
  const opened = await runtime.rebuildConnectorHealth('structured_analysis')
  assert.equal(opened.health.state, 'open')
  const material = structuredMaterial('crash-success')
  const preparedValue = attempt({ researchSessionId: material.context.researchSessionId, researchRequestId: material.context.researchRequestId, discoveryId: material.context.discoveryId, projectId: material.context.projectId, providerType: 'structured_analysis', operation: 'analyze' }, stamp(1100))
  const prepared = (await store.createReservedAttempt(preparedValue, { maxReservationsPerProject: 1000, reservationCost: 0 })).record
  const probe = (await store.claimExecution(prepared.connectorAttemptId, { expectedRevision: prepared.revision, now: stamp(1100), maxTransientFailures: 1, circuitCooldownMs: 1000 })).record
  const staleHalfOpen = await store.readHealth('structured-analysis-local')
  const candidate = structuredAnalysisCandidate(material.input)
  const rawReceipt = { researchRequestId: material.context.researchRequestId, providerType: 'structured_analysis', operation: 'analyze', status: candidate.status, mimeType: candidate.mimeType, bytes: candidate.bytes, contentHash: candidate.contentHash, excerpt: candidate.excerpt, method: 'controlled_adapter', redirects: [...candidate.redirects], codes: [...candidate.codes], consumed: { ...candidate.consumed } }
  const outbox = delivery({ record: probe, context: material.context, rawReceipt, claim: material.input.objective, budget: material.connectorBudget, now: stamp(1200) })
  const contributing = (await store.completeCircuitObservation(probe.connectorAttemptId, { expectedStates: ['running'], expectedRevision: probe.revision, nextState: 'contributing', patch: { delivery: outbox, updatedAt: stamp(1200) }, outcome: 'success', now: stamp(1200), maxTransientFailures: 1, circuitCooldownMs: 1000 })).record
  const delivered = completeDelivery(outbox, outbox.expectedReceiptId, stamp(1300))
  const connectorReceipt = { status: 'partial', classification: 'UNTRUSTED_EXTERNAL_CONTENT', receiptId: outbox.expectedReceiptId }
  const evidenceId = `evidence-${digest(canonical({ request: material.context.researchRequestId, receipt: outbox.expectedReceiptId, claim: outbox.claim })).slice(0, 32)}`
  const research = { researchRequestId: material.context.researchRequestId, receiptId: outbox.expectedReceiptId, state: 'needs_corroboration', evidenceId, evidenceCaseId: material.context.evidenceCaseId, researchPlanId: material.context.researchPlanId }
  await store.transitionAttempt(contributing.connectorAttemptId, { expectedStates: ['contributing'], expectedRevision: contributing.revision, nextState: 'partial', patch: { delivery: delivered, receipt: connectorReceipt, research, updatedAt: stamp(1300) } })
  await store.saveHealth(staleHalfOpen)
  assert.equal((await store.readHealth('structured-analysis-local')).state, 'half_open')
  const rebuilt = await runtime.rebuildConnectorHealth('structured_analysis')
  assert.equal(rebuilt.health.state, 'closed')
  assert.equal(rebuilt.health.lastTransitionAt, stamp(1200))
})

checks.set(22, async () => {
  const scenario = await corruptHealthScenario()
  const before = await fs.promises.readFile(scenario.target, 'utf8')
  const status = await scenario.runtime.getConnectorOperationalStatus('manual_reference')
  assert.equal(status.circuitState, 'corrupt')
  assert.equal(status.operationalState, 'health_unknown')
  assert.equal(await fs.promises.readFile(scenario.target, 'utf8'), before)
})

checks.set(23, async () => {
  const scenario = await corruptHealthScenario()
  await assert.rejects(() => scenario.store.saveHealth({ schemaVersion: 'jefe-research-connector-health/v1', connectorId: 'manual-reference-local', state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null }), (error) => error?.code === 'CORRUPT_HEALTH')
  assert.equal(await fs.promises.readFile(scenario.target, 'utf8'), scenario.corruptBytes)
})

checks.set(24, async () => {
  const scenario = await corruptHealthScenario()
  const rebuilt = await scenario.runtime.rebuildConnectorHealth('manual_reference')
  assert.equal(rebuilt.replacedCorrupt, true)
  assert.equal(rebuilt.idempotent, false)
  assert.equal(rebuilt.health.state, 'open')
  const persisted = await fs.promises.readFile(scenario.target, 'utf8')
  assert.doesNotThrow(() => JSON.parse(persisted))
})

checks.set(25, async () => {
  const storeRoot = path.join(root, 'corrupt-attempt')
  const store = createConnectorPersistence({ root: storeRoot })
  const running = await createAttemptState(store, { seed: 'partial-source-running', state: 'running', createdAt: stamp(0), maxTransientFailures: 1, circuitCooldownMs: 60000 })
  const runningTarget = path.join(storeRoot, `${running.connectorAttemptId}.json`)
  const runningBytes = await fs.promises.readFile(runningTarget, 'utf8')
  const healthy = await createAttemptState(store, { seed: 'healthy-attempt', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(30), updatedAt: stamp(40), maxTransientFailures: 1, circuitCooldownMs: 60000 })
  const runtime = runtimeFor(store, { policy: { maxTransientFailures: 1 } })
  const corruptId = `connector-attempt-${digest('corrupt-attempt-file').slice(0, 32)}`
  const corruptTarget = path.join(storeRoot, `${corruptId}.json`)
  const corruptBytes = '{corrupt-attempt'
  await fs.promises.writeFile(corruptTarget, corruptBytes, 'utf8')
  const stale = { schemaVersion: 'jefe-research-connector-health/v1', connectorId: 'manual-reference-local', state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null }
  await store.saveHealth(stale)
  const healthTarget = path.join(storeRoot, 'health-manual-reference-local.json')
  const staleBytes = await fs.promises.readFile(healthTarget, 'utf8')
  const rebuilt = await runtime.rebuildConnectorHealth('manual_reference')
  assert.equal(rebuilt.attemptsConsidered, 2)
  assert.equal(rebuilt.corruptionCount, 1)
  assert.equal(rebuilt.sourceIntegrity, 'partial')
  assert.equal(rebuilt.materialized, false)
  assert.equal(rebuilt.health, null)
  assert.equal(await fs.promises.readFile(healthTarget, 'utf8'), staleBytes)
  assert.equal((await runtime.getConnectorOperationalStatus('manual_reference')).operationalState, 'health_unknown')
  await assert.rejects(() => runtime.prepareConnectorAttempt(rawAttempt('partial-source-blocked')), (error) => error?.code === 'HEALTH_SOURCE_INCOMPLETE')
  await assert.rejects(() => store.completeCircuitObservation(running.connectorAttemptId, { expectedStates: ['running'], expectedRevision: running.revision, nextState: 'failed_transient', patch: { errorCode: 'INTERRUPTED', budgetReservation: { ...running.budgetReservation, consumed: running.budgetReservation.reserved }, updatedAt: stamp(50) }, outcome: 'counted_failure', now: stamp(50), maxTransientFailures: 1, circuitCooldownMs: 60000 }), (error) => error?.code === 'HEALTH_SOURCE_INCOMPLETE')
  assert.equal(await fs.promises.readFile(runningTarget, 'utf8'), runningBytes)
  assert.equal((await store.read(healthy.connectorAttemptId)).state, 'failed_transient')
  assert.equal(await fs.promises.readFile(corruptTarget, 'utf8'), corruptBytes)
})

checks.set(26, async () => {
  const storeRoot = path.join(root, 'concurrent-rebuild')
  const store = createConnectorPersistence({ root: storeRoot })
  await createAttemptState(store, { seed: 'concurrent-failure', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10) })
  const runtime = runtimeFor(store, { policy: { maxTransientFailures: 1 } })
  await store.saveHealth({ schemaVersion: 'jefe-research-connector-health/v1', connectorId: 'manual-reference-local', state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null })
  const results = await Promise.all(Array.from({ length: 8 }, () => runtime.rebuildConnectorHealth('manual_reference')))
  assert.equal(results.filter((item) => item.idempotent === false).length, 1)
  assert.equal(new Set(results.map((item) => canonical(item.health))).size, 1)
  const target = path.join(storeRoot, 'health-manual-reference-local.json')
  const before = await fs.promises.readFile(target, 'utf8')
  await runtime.rebuildConnectorHealth('manual_reference')
  assert.equal(await fs.promises.readFile(target, 'utf8'), before)
})

checks.set(27, async () => {
  const a = createConnectorPersistence({ root: path.join(root, 'isolation-a') })
  const b = createConnectorPersistence({ root: path.join(root, 'isolation-b') })
  await createAttemptState(a, { seed: 'isolation-a-failure', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10) })
  await createAttemptState(b, { seed: 'isolation-b-success', state: 'succeeded', createdAt: stamp(0), updatedAt: stamp(10) })
  const [healthA, healthB] = await Promise.all([
    runtimeFor(a, { policy: { maxTransientFailures: 1 } }).rebuildConnectorHealth('manual_reference'),
    runtimeFor(b, { policy: { maxTransientFailures: 1 } }).rebuildConnectorHealth('manual_reference'),
  ])
  assert.equal(healthA.health.state, 'open')
  assert.equal(healthB.health.state, 'closed')
  assert.equal(healthA.attemptsConsidered, 1)
  assert.equal(healthB.attemptsConsidered, 1)
})

checks.set(28, async () => {
  const store = createConnectorPersistence({ root: path.join(root, 'capability-traps') })
  await createAttemptState(store, { seed: 'trap-failure', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10) })
  let adapterCalls = 0
  const runtime = runtimeFor(store, { adapters: { 'manual-reference-local': () => { adapterCalls += 1; throw new Error('forbidden adapter') } }, policy: { maxTransientFailures: 1 } })
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
    assert.equal((await runtime.rebuildConnectorHealth('manual_reference')).health.state, 'open')
    assert.equal((await runtime.getConnectorOperationalStatus('manual_reference')).circuitState, 'open')
    assert.equal(adapterCalls, 0)
    assert.deepEqual(calls, [])
  } finally {
    for (const restore of restores.reverse()) restore()
  }
})

checks.set(29, async () => {
  const storeRoot = path.join(root, 'inspect-drift')
  const store = createConnectorPersistence({ root: storeRoot })
  await createAttemptState(store, { seed: 'inspect-drift-failure', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10), maxTransientFailures: 1 })
  await store.saveHealth({ schemaVersion: 'jefe-research-connector-health/v1', connectorId: 'manual-reference-local', state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null })
  const target = path.join(storeRoot, 'health-manual-reference-local.json')
  const before = await fs.promises.readFile(target, 'utf8')
  const runtime = runtimeFor(store, { policy: { maxTransientFailures: 1 } })
  const diagnosis = await runtime.inspectConnectorHealth('manual_reference')
  assert.equal(diagnosis.sourceIntegrity, 'complete')
  assert.equal(diagnosis.drift, 'mismatch')
  assert.equal(diagnosis.materializedHealth.state, 'closed')
  assert.equal(diagnosis.derivedHealth.state, 'open')
  assert.equal((await runtime.getConnectorOperationalStatus('manual_reference')).operationalState, 'health_unknown')
  assert.equal(await fs.promises.readFile(target, 'utf8'), before)
})

checks.set(30, async () => {
  const storeRoot = path.join(root, 'cross-instance-lock')
  const equivalentRoot = process.platform === 'win32' ? storeRoot.toUpperCase() : path.join(storeRoot, '.')
  const firstStore = createConnectorPersistence({ root: storeRoot })
  await createAttemptState(firstStore, { seed: 'cross-instance-open', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10), maxTransientFailures: 1 })
  const secondStore = createConnectorPersistence({ root: equivalentRoot })
  const firstPrepared = (await firstStore.createReservedAttempt(attempt(rawAttempt('cross-instance-probe-a'), stamp(1100)), { maxReservationsPerProject: 1000, reservationCost: 0 })).record
  const secondPrepared = (await secondStore.createReservedAttempt(attempt(rawAttempt('cross-instance-probe-b'), stamp(1100)), { maxReservationsPerProject: 1000, reservationCost: 0 })).record
  const options = { now: stamp(1100), maxTransientFailures: 1, circuitCooldownMs: 1000 }
  const claims = await Promise.all([
    firstStore.claimExecution(firstPrepared.connectorAttemptId, { ...options, expectedRevision: firstPrepared.revision }),
    secondStore.claimExecution(secondPrepared.connectorAttemptId, { ...options, expectedRevision: secondPrepared.revision }),
  ])
  assert.equal(claims.filter((claim) => claim.allowed).length, 1)
  const denied = claims.find((claim) => !claim.allowed).record
  await firstStore.transitionAttempt(denied.connectorAttemptId, { expectedStates: ['running'], expectedRevision: denied.revision, nextState: 'failed_transient', patch: { errorCode: 'CIRCUIT_OPEN', updatedAt: stamp(1100) } })
  const diagnosis = await runtimeFor(firstStore, { policy: { maxTransientFailures: 1 } }).inspectConnectorHealth('manual_reference')
  assert.equal(diagnosis.sourceIntegrity, 'complete')
  assert.equal(diagnosis.derivedHealth.state, 'half_open')
  assert.equal(diagnosis.observedAttemptCount, 2)
})

checks.set(31, async () => {
  const scenario = await neutralProbeScenario()
  assert.equal(scenario.result.state, 'not_executed')
  assert.equal(scenario.saved.circuitObservation.outcome, 'not_executed')
  assert.equal(scenario.health.state, 'open')
  assert.equal(scenario.health.failureCount, scenario.opened.failureCount)
  assert.equal(scenario.health.openedAt, scenario.opened.halfOpenEligibleAt)
  assert.equal(scenario.health.halfOpenEligibleAt, new Date(Date.parse(scenario.opened.halfOpenEligibleAt) + 1000).toISOString())
  assert.equal(scenario.adapterCalls, 1)
})

checks.set(32, async () => {
  const neutral = await neutralProbeScenario()
  const physical = await deliveryProbeScenario()
  assert.equal(neutral.saved.circuitObservation.outcome, 'not_executed')
  assert.equal(neutral.health.state, 'open')
  assert.equal(physical.failedProbe.circuitObservation.outcome, 'success')
  assert.equal(physical.healthAfterFailure.state, 'closed')
})

checks.set(33, async () => {
  const scenario = await neutralProbeScenario()
  assert.equal(scenario.replay.state, 'succeeded')
  assert.equal(scenario.replay.idempotent, true)
  assert.equal(scenario.rebuilt.idempotent, true)
  assert.equal(canonical(scenario.rebuilt.health), canonical(scenario.health))
  assert.equal(await fs.promises.readFile(path.join(scenario.store.authorityRoot, `${scenario.prepared.record.connectorAttemptId}.json`), 'utf8'), scenario.attemptBytes)
  assert.equal(await fs.promises.readFile(scenario.healthTarget, 'utf8'), scenario.healthBytes)
})

checks.set(34, async () => {
  const storeRoot = path.join(root, 'invalid-lineage-source')
  const store = createConnectorPersistence({ root: storeRoot })
  const runtime = runtimeFor(store, { policy: { maxTransientFailures: 1, circuitCooldownMs: 1000 } })
  const parent = await createAttemptState(store, { seed: 'invalid-lineage-parent', projectId: 'project-invalid-lineage', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10), maxTransientFailures: 1, circuitCooldownMs: 1000 })
  const child = await runtime.retryAttempt(parent.connectorAttemptId)
  const childTarget = path.join(storeRoot, `${child.attempt}.json`)
  const childRecord = JSON.parse(await fs.promises.readFile(childTarget, 'utf8'))
  childRecord.retryOfAttemptId = `connector-attempt-${'f'.repeat(32)}`
  const retrySeed = Object.fromEntries(['rootAttemptId', 'retryOfAttemptId', 'attemptNumber', 'projectId', 'researchSessionId', 'researchRequestId', 'discoveryId', 'connectorId'].map((field) => [field, childRecord[field]]))
  childRecord.connectorAttemptId = `connector-attempt-${crypto.createHash('sha256').update(canonical(retrySeed)).digest('hex').slice(0, 32)}`
  const forgedTarget = path.join(storeRoot, `${childRecord.connectorAttemptId}.json`)
  await fs.promises.writeFile(forgedTarget, `${canonical(childRecord)}\n`, 'utf8')
  await fs.promises.rm(childTarget)
  await store.saveHealth({ schemaVersion: 'jefe-research-connector-health/v1', connectorId: 'manual-reference-local', state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null })
  const healthTarget = path.join(storeRoot, 'health-manual-reference-local.json')
  const before = await fs.promises.readFile(healthTarget, 'utf8')
  const rebuilt = await runtime.rebuildConnectorHealth('manual_reference')
  assert.equal((await store.listAllDetailed()).corruptions.length, 0)
  assert.equal(rebuilt.sourceIntegrity, 'partial')
  assert.equal(rebuilt.materialized, false)
  assert.equal(rebuilt.health, null)
  assert.equal(await fs.promises.readFile(healthTarget, 'utf8'), before)
  assert.equal((await runtime.getConnectorOperationalStatus('manual_reference')).operationalState, 'health_unknown')

  const unauthorizedRoot = path.join(root, 'unauthorized-circuit-start')
  const unauthorizedStore = createConnectorPersistence({ root: unauthorizedRoot })
  await createAttemptState(unauthorizedStore, { seed: 'unauthorized-open', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(0), updatedAt: stamp(10), maxTransientFailures: 1, circuitCooldownMs: 1000 })
  const unauthorizedPrepared = (await unauthorizedStore.createReservedAttempt(attempt(rawAttempt('unauthorized-prepared'), stamp(20)), { maxReservationsPerProject: 1000, reservationCost: 0 })).record
  const unauthorizedTarget = path.join(unauthorizedRoot, `${unauthorizedPrepared.connectorAttemptId}.json`)
  const unauthorizedBytes = await fs.promises.readFile(unauthorizedTarget, 'utf8')
  const unauthorizedObservation = { schemaVersion: 'jefe-research-connector-circuit-observation/v1', startSequence: 3, startedAt: stamp(20), probeForOpenedAt: null, outcome: null, outcomeSequence: null, outcomeAt: null }
  await assert.rejects(() => unauthorizedStore.transitionAttempt(unauthorizedPrepared.connectorAttemptId, { expectedStates: ['prepared'], expectedRevision: unauthorizedPrepared.revision, nextState: 'running', patch: { circuitObservation: unauthorizedObservation, updatedAt: stamp(20) } }), (error) => error?.code === 'INVALID_TRANSITION_REQUEST')
  assert.equal(await fs.promises.readFile(unauthorizedTarget, 'utf8'), unauthorizedBytes)
  await fs.promises.writeFile(unauthorizedTarget, `${canonical({ ...unauthorizedPrepared, revision: 1, state: 'running', updatedAt: stamp(20), circuitObservation: unauthorizedObservation })}\n`, 'utf8')
  const unauthorizedDiagnosis = await unauthorizedStore.diagnoseDerivedHealth('manual-reference-local', { maxTransientFailures: 1, circuitCooldownMs: 1000 })
  assert.equal(unauthorizedDiagnosis.sourceIntegrity, 'partial')
  assert.equal(unauthorizedDiagnosis.derivedHealth, null)

  const temporalRoot = path.join(root, 'circuit-timestamp-regression')
  const temporalStore = createConnectorPersistence({ root: temporalRoot })
  const temporalPrepared = (await temporalStore.createReservedAttempt(attempt(rawAttempt('temporal-prepared'), stamp(0)), { maxReservationsPerProject: 1000, reservationCost: 0 })).record
  await createAttemptState(temporalStore, { seed: 'temporal-later-event', state: 'failed_transient', errorCode: 'ADAPTER_FAILURE', createdAt: stamp(100), updatedAt: stamp(200), maxTransientFailures: 10, circuitCooldownMs: 1000 })
  const temporalTarget = path.join(temporalRoot, `${temporalPrepared.connectorAttemptId}.json`)
  const temporalBytes = await fs.promises.readFile(temporalTarget, 'utf8')
  await assert.rejects(() => temporalStore.claimExecution(temporalPrepared.connectorAttemptId, { expectedRevision: temporalPrepared.revision, now: stamp(50), maxTransientFailures: 10, circuitCooldownMs: 1000 }), (error) => error?.code === 'INVALID_CIRCUIT_CLAIM')
  assert.equal(await fs.promises.readFile(temporalTarget, 'utf8'), temporalBytes)
  const regressedObservation = { schemaVersion: 'jefe-research-connector-circuit-observation/v1', startSequence: 3, startedAt: stamp(50), probeForOpenedAt: null, outcome: null, outcomeSequence: null, outcomeAt: null }
  await fs.promises.writeFile(temporalTarget, `${canonical({ ...temporalPrepared, revision: 1, state: 'running', updatedAt: stamp(50), circuitObservation: regressedObservation })}\n`, 'utf8')
  const temporalDiagnosis = await temporalStore.diagnoseDerivedHealth('manual-reference-local', { maxTransientFailures: 10, circuitCooldownMs: 1000 })
  assert.equal(temporalDiagnosis.sourceIntegrity, 'partial')
  assert.equal(temporalDiagnosis.derivedHealth, null)
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
      console.error(`FAIL jefe-research-connector-health-rebuild-smoke caso ${number}: ${names[number - 1]}`)
      throw error
    }
  }
  assert.deepEqual(completed, expected)
  console.log(`PASS jefe-research-connector-health-rebuild-smoke: ${completed.length}/${checks.size}`)
  console.log(`CONNECTOR_HEALTH_REBUILD_SMOKE_STRUCTURE=${checks.size}/${checks.size}`)
  console.log(`CONNECTOR_HEALTH_REBUILD_BEHAVIORAL_CASES_COMPLETE=${completed.length}/${checks.size}`)
  console.log(`CONNECTOR_HEALTH_REBUILD_BEHAVIORAL_CASES_REAL=1-${checks.size}`)
  console.log(`ESCALON_3C_D_HEALTH_SMOKE=${completed.length}/${checks.size}_PASS`)
} finally {
  await fs.promises.rm(root, { recursive: true, force: true })
}
