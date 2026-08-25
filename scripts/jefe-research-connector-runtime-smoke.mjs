import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { CONNECTORS, TRANSITIONS, connector, attempt, delivery, completeDelivery, transition } = require('../electron/jefe-research-connector-contract.cjs')
const { createConnectorPersistence } = require('../electron/jefe-research-connector-persistence.cjs')
const { createConnectorRuntime } = require('../electron/jefe-research-connector-runtime.cjs')
const { createStructuredAnalysisConnector } = require('../electron/jefe-research-structured-analysis-connector.cjs')
const { candidate: evidenceCandidate, reference: evidenceReference } = require('../electron/jefe-research-evidence-contract.cjs')
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')
const { createDiscoveryPersistence } = require('../electron/jefe-discovery-persistence.cjs')
const { createSupervisedDiscovery } = require('../electron/jefe-discovery-orchestrator.cjs')
const { createAgentContextService } = require('../electron/jefe-agent-context-service.cjs')
const { createSupervisedResearchPersistence } = require('../electron/jefe-supervised-research-persistence.cjs')
const { createEvidenceCasePersistence } = require('../electron/jefe-supervised-research-evidence-case-persistence.cjs')
const { createSupervisedResearch } = require('../electron/jefe-supervised-research-orchestrator.cjs')
const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-connector-'))
const now = '2026-08-24T00:00:00.000Z'
const raw = { researchSessionId: 'research-session-alpha', researchRequestId: 'research-alpha', discoveryId: 'discovery-alpha', projectId: 'project-alpha', providerType: 'manual_reference', operation: 'reference' }
const names = ['connector canonico','connector desconocido','caller sin adapter','caller sin capacidades','connector deshabilitado','no configurado','red no conectada','operacion incompatible','version determinista','vista sanitizada','preparacion durable','identidad cruzada','replay compatible','replay incompatible','transicion valida','transicion invalida','receipt requerido','partial honesto','fallo transitorio','fallo permanente','reserva unica','consumo unico','exceso bloqueado','concurrencia','timeout','cancelacion','respuesta tardia','retry transitorio','permanente sin retry','circuit breaker','reapertura durable','identidad conservada','bytes canonicos','lectura pura','running interrumpido','corrupcion aislada','indice reconstruible','concurrencia A B','fallo A aislado','half open durable','manual sin red','manual reference only','adapter inyectado','receipt invalido','receipt al gate','corroboracion','evidencia a memoria','contradiccion humana','contenido sin autoridad','errores sanitizados','reconcile idempotente','matriz negativa','alias fisico de root comparte coordinacion','reconcile exacto conserva preflight bajo locks']
const checks = new Map()
const deferred = () => { let resolve; let reject; const promise = new Promise((done, fail) => { resolve = done; reject = fail }); return { promise, resolve, reject } }
const receipt = () => ({ state: 'not_executed' })
const rawFor = (projectId, discoveryId) => ({ ...raw, projectId, discoveryId })
const byte = (base, id) => fs.promises.readFile(path.join(base, `${id}.json`), 'utf8')
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex')
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (!value || typeof value !== 'object') return value; return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out }, {}) }
const canonical = (value) => JSON.stringify(stable(value))
async function rejectsCode(run, expected) { await assert.rejects(run, (error) => { if (expected instanceof RegExp) assert.match(error?.code || '', expected); else assert.equal(error?.code, expected); return true }) }
function connectorCandidate({ seed = 'candidate', host = 'candidate-source', claim = 'Claim controlado compartido', excerpt = 'Contenido controlado', ...extra } = {}) {
  return { status: 'received', url: `https://${host}.test/source`, mimeType: 'text/plain', bytes: 24, contentHash: digest(seed), excerpt, claim, ...extra }
}
function contributionFor(request, { seed = 'contribution', host = 'contribution-source', claim = 'Claim controlado compartido', status = 'received', ...extra } = {}) {
  const rawReceipt = { researchRequestId: request.researchRequestId, providerType: request.providerType, operation: request.providerType === 'manual_reference' ? 'reference' : 'search', status }
  if (status === 'received' || status === 'partial') Object.assign(rawReceipt, { url: `https://${host}.test/source`, mimeType: 'text/plain', bytes: 24, contentHash: digest(seed), excerpt: 'Contenido controlado', ...extra })
  return { researchRequestId: request.researchRequestId, rawReceipt, claim }
}
function inputFrom(research, researchRequestId, overrides = {}) {
  const context = research.getContributionContext(researchRequestId)
  return { researchSessionId: context.researchSessionId, researchRequestId: context.researchRequestId, discoveryId: context.discoveryId, projectId: context.projectId, providerType: context.providerType, operation: context.providerType === 'manual_reference' ? 'reference' : 'search', ...overrides }
}
function bridgeFor(research, counters = { contexts: 0, receives: 0 }) {
  return Object.freeze({
    getContributionContext(researchRequestId) { counters.contexts += 1; return research.getContributionContext(researchRequestId) },
    getConnectorInput(researchRequestId) { return research.getConnectorInput(researchRequestId) },
    async receiveContribution(input) { counters.receives += 1; return research.receiveContribution(input) },
  })
}
async function treeText(base) {
  if (!await fs.promises.stat(base).then(() => true, () => false)) return ''
  const chunks = []
  async function visit(current) {
    for (const entry of await fs.promises.readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(target)
      else chunks.push(await fs.promises.readFile(target, 'utf8').catch(() => ''))
    }
  }
  await visit(base)
  return chunks.join('\n')
}
async function integratedHarness(scenarioId, providerType = 'metasearch') {
  const slug = scenarioId.toLowerCase().replace(/[^a-z0-9-]/gu, '-').slice(0, 48)
  const base = await fs.promises.mkdtemp(path.join(os.tmpdir(), `jefe-integrated-${slug}-`)); const identity = { projectId: `project-${slug}`, runId: `run-${slug}`, versionId: `version-${slug}` }; const memory = createContextMemory({ root: path.join(base, 'context'), allowedRoots: [base], clock: () => now });
  for (const [id, type] of [['objective','objective'],['requirement','requirement'],['constraint','constraint'],['validation','validation']]) await memory.append({ entryId: `${scenarioId}-${id}`, scope: 'version', identity, type, summary: id, actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: now, references: [], relations: [], metadata: {} });
  const snapshot = await memory.getSnapshot(); const context = createAgentContextService({ readMemory: async () => ({ snapshot, syncStatus: { status: 'synced' } }) }); const discovery = createSupervisedDiscovery({ persistence: createDiscoveryPersistence({ root: path.join(base, 'intakes') }), memory, contextService: context, clock: () => now });
  const created = await discovery.createIntake({ objective: 'Investigacion controlada', expectedOutcome: 'Referencia supervisada', audience: 'Equipo', problem: 'Validar referencia', scope: 'Investigacion', constraints: ['Sin red'], questions: ['Que referencia respalda el claim'], assumptions: ['Fuente externa no verificada'], risks: ['Corroboracion pendiente'], priority: 'normal', responsible: 'lean', projectType: 'commercial_site', platform: 'web', identity });
  const researchPersistence = createSupervisedResearchPersistence({ root: path.join(base, 'research') }); const evidenceCaseRoot = path.join(base, 'evidence-cases'); const researchMemory = { calls: [], async append(input) { this.calls.push(JSON.parse(JSON.stringify(input))); return memory.append(input) } }; const trusted = { networkEnabled: false, providers: { manual_reference: { state: 'available' }, structured_analysis: { state: 'available' }, metasearch: { state: 'not_connected' } } }; const createResearch = () => createSupervisedResearch({ memory: researchMemory, persistence: createSupervisedResearchPersistence({ root: path.join(base, 'research') }), evidenceCasePersistence: createEvidenceCasePersistence({ root: evidenceCaseRoot }), clock: () => now, trusted }); const research = createResearch(); const planned = await research.plan({ intake: created.intake, packages: created.packages, providerType, budget: { maxQueries: 2, maxSources: 4 }, references: ['https://example.test/source'] });
  return { base, memory, researchMemory, created, research, createResearch, researchPersistence, evidenceCaseRoot, evidenceCasePersistence: createEvidenceCasePersistence({ root: evidenceCaseRoot }), planned, connectorRoot: path.join(base, 'connectors') }
}

checks.set(1, async () => {
  const definition = connector('manual_reference'); assert.equal(definition.status, 'ready'); assert.equal(Object.isFrozen(definition.supportedOperations), true); assert.equal(Object.isFrozen(CONNECTORS.manual_reference.supportedOperations), true); assert.equal(Object.isFrozen(TRANSITIONS.succeeded), true)
  assert.throws(() => definition.supportedOperations.push('deploy'), TypeError); assert.throws(() => CONNECTORS.manual_reference.supportedOperations.push('deploy'), TypeError); assert.throws(() => TRANSITIONS.succeeded.push('running'), TypeError); assert.throws(() => attempt({ ...raw, operation: 'deploy' }, now), (error) => error.code === 'INVALID_OPERATION')
})
checks.set(2, async () => assert.throws(() => connector('unknown'), (error) => error.code === 'UNKNOWN_CONNECTOR'))
checks.set(3, async () => assert.throws(() => attempt({ ...raw, adapter: () => {} }, now), (error) => error.code === 'INVALID_CONNECTOR_ATTEMPT'))
checks.set(4, async () => { assert.throws(() => attempt({ ...raw, capabilities: ['network', 'deploy'] }, now), (error) => error.code === 'INVALID_CONNECTOR_ATTEMPT'); assert.deepEqual(connector('manual_reference').capabilities, ['reference_only']) })
checks.set(5, async () => { const record = attempt({ ...raw, providerType: 'automated_browser', operation: 'browse' }, now); assert.equal(connector('automated_browser').status, 'disabled'); assert.equal(record.state, 'policy_blocked'); assert.equal(record.connectorId, 'automated-browser-disabled') })
checks.set(6, async () => { const record = attempt({ ...raw, providerType: 'local_model', operation: 'analyze' }, now); assert.equal(connector('local_model').status, 'not_configured'); assert.equal(record.state, 'not_connected'); assert.equal(record.connectorId, 'local-model-not-configured') })
checks.set(7, async () => { const base = path.join(root, 'network-not-connected'); let adapters = 0; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedAdapters: { 'metasearch-not-connected': () => { adapters += 1; return receipt() } } }); const prepared = await runtime.prepareConnectorAttempt({ ...raw, providerType: 'metasearch', operation: 'search' }); assert.equal(prepared.record.state, 'not_connected'); assert.equal((await runtime.executePreparedAttempt(prepared.record.connectorAttemptId)).state, 'not_connected'); assert.equal(adapters, 0); assert.equal(runtime.getConnectorHealth('metasearch').networkEnabled, false) })
checks.set(8, async () => assert.throws(() => attempt({ ...raw, providerType: 'metasearch', operation: 'reference' }, now), (error) => error.code === 'INVALID_OPERATION'))
checks.set(9, async () => { const first = connector('manual_reference'); const second = connector('manual_reference'); assert.equal(first.connectorVersion, 'v1'); assert.deepEqual(first, second); assert.equal(Object.isFrozen(first), true) })
checks.set(10, async () => { const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: path.join(root, 'view') }), clock: () => now }); assert.deepEqual(Object.keys(runtime.getConnectorHealth('manual_reference')).sort(), ['connectorId','networkEnabled','state']) })
checks.set(11, async () => { const base = path.join(root, 'prepare'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now }); const saved = await runtime.prepareConnectorAttempt(raw); assert.equal(saved.record.state, 'prepared'); assert.equal(saved.record.revision, 0) })
checks.set(12, async () => { const harness = await integratedHarness('crossed-identity'); try { const counters = { contexts: 0, receives: 0 }; const bridge = bridgeFor(harness.research, counters); const request = harness.planned.radar; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch: bridge, trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: 'crossed-identity', host: 'crossed-identity' }) }) } }); const forged = inputFrom(harness.research, request.researchRequestId, { projectId: 'project-crossed-forged' }); let blocked = false; try { const prepared = await runtime.prepareConnectorAttempt(forged); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const saved = await createConnectorPersistence({ root: harness.connectorRoot }).read(prepared.record.connectorAttemptId); blocked = result.state === 'failed_permanent' && /^INVALID_.*CORRELATION$/u.test(saved.errorCode) } catch (error) { blocked = /^INVALID_.*CORRELATION$/u.test(error.code || '') } assert.equal(blocked, true); assert.equal(counters.receives, 0); assert.equal(harness.researchMemory.calls.length, 0) } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) } })
checks.set(13, async () => { const base = path.join(root, 'replay'); let stamp = now; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => stamp }); const one = await runtime.prepareConnectorAttempt(raw); stamp = '2026-08-25T00:00:00.000Z'; const two = await runtime.prepareConnectorAttempt(raw); assert.equal(two.idempotent, true); assert.equal(one.record.connectorAttemptId, two.record.connectorAttemptId); assert.equal(two.record.createdAt, now) })
checks.set(14, async () => { const base = path.join(root, 'incompatible'); const store = createConnectorPersistence({ root: base }); const value = attempt(raw, now); const policy = { maxReservationsPerProject: 8, reservationCost: 1 }; const saved = await store.createReservedAttempt(value, policy); await assert.rejects(() => store.createReservedAttempt({ ...value, researchRequestId: 'research-forged' }, policy), (error) => error.code === 'INCOMPATIBLE_REPLAY'); assert.equal((await store.read(saved.record.connectorAttemptId)).researchRequestId, value.researchRequestId) })
checks.set(15, async () => { const prepared = attempt(raw, now); const running = transition(prepared, 'running', { updatedAt: now }); assert.equal(running.state, 'running'); assert.equal(running.connectorAttemptId, prepared.connectorAttemptId) })
checks.set(16, async () => { const prepared = attempt(raw, now); assert.throws(() => transition(prepared, 'succeeded', { receipt: { status: 'not_executed' } }), (error) => error.code === 'INVALID_TRANSITION'); assert.throws(() => transition(prepared, 'running', { state: 'succeeded', receipt: { status: 'not_executed' } }), (error) => error.code === 'INVALID_TRANSITION'); const running = transition(prepared, 'running'); const succeeded = transition(running, 'succeeded', { receipt: { status: 'not_executed' } }); assert.throws(() => transition(succeeded, 'running'), (error) => error.code === 'INVALID_TRANSITION') })
checks.set(17, async () => { const running = transition(attempt(raw, now), 'running'); assert.throws(() => transition(running, 'succeeded'), (error) => error.code === 'RECEIPT_REQUIRED'); assert.throws(() => transition(running, 'partial'), (error) => error.code === 'RECEIPT_REQUIRED') })
checks.set(18, async () => { const running = transition(attempt(raw, now), 'running'); const partial = transition(running, 'partial', { receipt: { status: 'partial', classification: 'UNTRUSTED_EXTERNAL_CONTENT' } }); assert.equal(partial.state, 'partial'); assert.equal(partial.receipt.status, 'partial'); assert.notEqual(partial.state, 'succeeded') })
checks.set(19, async () => { const base = path.join(root, 'transient-failure'); const secret = 'transient-secret-must-not-persist'; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedAdapters: { 'manual-reference-local': () => { throw new Error(secret) } } }); const prepared = await runtime.prepareConnectorAttempt(rawFor('transient-project', 'discovery-transient')); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const savedBytes = await byte(base, prepared.record.connectorAttemptId); assert.equal(result.state, 'failed_transient'); assert.equal(JSON.parse(savedBytes).errorCode, 'ADAPTER_FAILURE'); assert.equal(savedBytes.includes(secret), false) })
checks.set(20, async () => { const base = path.join(root, 'permanent-failure'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedAdapters: { 'manual-reference-local': () => ({ state: 'failed_permanent' }) } }); const prepared = await runtime.prepareConnectorAttempt(rawFor('permanent-case-project', 'discovery-permanent-case')); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const savedBytes = await byte(base, prepared.record.connectorAttemptId); assert.equal(result.state, 'failed_permanent'); assert.equal(JSON.parse(savedBytes).errorCode, 'ADAPTER_PERMANENT_FAILURE'); assert.equal(Object.hasOwn(JSON.parse(savedBytes), 'reason'), false) })
checks.set(21, async () => { const base = path.join(root, 'reserve'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now }); const prepared = await runtime.prepareConnectorAttempt(raw); const before = await byte(base, prepared.record.connectorAttemptId); await runtime.prepareConnectorAttempt(raw); assert.equal(await byte(base, prepared.record.connectorAttemptId), before) })
checks.set(22, async () => { const base = path.join(root, 'consume'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now }); const prepared = await runtime.prepareConnectorAttempt(raw); await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const saved = await createConnectorPersistence({ root: base }).read(prepared.record.connectorAttemptId); assert.equal(saved.budgetReservation.consumed, saved.budgetReservation.reserved) })
checks.set(23, async () => { const base = path.join(root, 'blocked'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedPolicy: { maxReservationsPerProject: 0 } }); const saved = await runtime.prepareConnectorAttempt(raw); assert.equal(saved.record.errorCode, 'BUDGET_EXHAUSTED') })

// Case 24: every deferred is selected solely by the internal canonical attempt id.
checks.set(24, async () => {
  const base = path.join(root, 'coordinator'); const pending = new Map(); const invocations = new Map(); const active = new Set(); const started = new Map(); let maximum = 0
  const adapter = ({ connectorAttemptId }) => { const gate = pending.get(connectorAttemptId); assert.ok(gate); invocations.set(connectorAttemptId, (invocations.get(connectorAttemptId) || 0) + 1); active.add(connectorAttemptId); maximum = Math.max(maximum, active.size); started.get(connectorAttemptId).resolve(); return gate.promise.finally(() => active.delete(connectorAttemptId)) }
  const make = (baseRoot) => createConnectorRuntime({ persistence: createConnectorPersistence({ root: baseRoot }), clock: () => now, trustedPolicy: { maxConcurrency: 2 }, trustedAdapters: { 'manual-reference-local': adapter } })
  const first = make(base); const second = make(base); const prepared = new Map()
  for (const key of ['a','b','c','d','e','f']) { const saved = await first.prepareConnectorAttempt(rawFor('coordinator-project', `discovery-coordinator-${key}`)); prepared.set(key, saved.record); pending.set(saved.record.connectorAttemptId, deferred()); started.set(saved.record.connectorAttemptId, deferred()) }
  const id = (key) => prepared.get(key).connectorAttemptId
  const a = first.executePreparedAttempt(id('a')); const b = first.executePreparedAttempt(id('b')); await Promise.all([started.get(id('a')).promise, started.get(id('b')).promise]); assert.equal(maximum, 2)
  const c = first.executePreparedAttempt(id('c')); const replayA = first.executePreparedAttempt(id('a')); assert.equal(invocations.get(id('c')) || 0, 0); assert.equal(invocations.get(id('a')), 1)
  pending.get(id('a')).resolve(receipt()); await started.get(id('c')).promise; pending.get(id('b')).reject(new Error('controlled')); await Promise.all([a, b, replayA])
  const d = first.executePreparedAttempt(id('d')); await started.get(id('d')).promise; const e = first.executePreparedAttempt(id('e')); assert.equal(invocations.get(id('e')) || 0, 0); await first.cancelAttempt(id('e')); pending.get(id('c')).resolve(receipt()); pending.get(id('d')).resolve(receipt()); await Promise.all([c, d, e]); assert.equal((await first.getAttemptStatus(id('e'))).state, 'cancelled')
  const f = second.executePreparedAttempt(id('f')); await started.get(id('f')).promise; pending.get(id('f')).resolve(receipt()); await f; assert.equal(maximum, 2); assert.equal(active.size, 0)
  const isolated = make(path.join(root, 'coordinator-isolated')); const other = await isolated.prepareConnectorAttempt(rawFor('coordinator-isolated-project', 'discovery-coordinator-isolated')); pending.set(other.record.connectorAttemptId, deferred()); started.set(other.record.connectorAttemptId, deferred()); const isolatedRun = isolated.executePreparedAttempt(other.record.connectorAttemptId); await started.get(other.record.connectorAttemptId).promise; pending.get(other.record.connectorAttemptId).resolve(receipt()); await isolatedRun
  assert.equal((await createConnectorPersistence({ root: base }).read(id('d'))).state, 'succeeded')
})
checks.set(25, async () => { const base = path.join(root, 'timeout'); const gate = deferred(); const started = deferred(); const timers = []; const scheduler = { setTimeout(fn) { const timer = { fn, enabled: true }; timers.push(timer); return timer }, clearTimeout(timer) { timer.enabled = false } }; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedPolicy: { executionTimeoutMs: 1 }, trustedScheduler: scheduler, trustedAdapters: { 'manual-reference-local': () => { started.resolve(); return gate.promise } } }); const item = await runtime.prepareConnectorAttempt(rawFor('timeout-project', 'discovery-timeout')); const execution = runtime.executePreparedAttempt(item.record.connectorAttemptId); await started.promise; timers[0].fn(); assert.equal((await execution).state, 'timed_out'); const before = await byte(base, item.record.connectorAttemptId); gate.resolve(receipt()); await Promise.resolve(); assert.equal(await byte(base, item.record.connectorAttemptId), before) })
checks.set(26, async () => { const base = path.join(root, 'prepared-cancel'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now }); const item = await runtime.prepareConnectorAttempt(rawFor('prepared-cancel-project', 'discovery-prepared-cancel')); assert.equal((await runtime.cancelAttempt(item.record.connectorAttemptId)).state, 'cancelled'); assert.equal((await runtime.executePreparedAttempt(item.record.connectorAttemptId)).state, 'cancelled') })
checks.set(27, async () => {
  const base = path.join(root, 'stale'); const gate = deferred(); const started = deferred(); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedAdapters: { 'manual-reference-local': () => { started.resolve(); return gate.promise } } }); const item = await runtime.prepareConnectorAttempt(rawFor('stale-project', 'discovery-stale')); const execution = runtime.executePreparedAttempt(item.record.connectorAttemptId); await started.promise; await runtime.cancelAttempt(item.record.connectorAttemptId); const before = await byte(base, item.record.connectorAttemptId); await execution; gate.resolve(receipt()); await Promise.resolve(); assert.equal(await byte(base, item.record.connectorAttemptId), before); assert.equal((await runtime.getAttemptStatus(item.record.connectorAttemptId)).state, 'cancelled')
  const harness = await integratedHarness('cancel-contribution-linearized')
  try {
    const request = harness.planned.radar; const receiveStarted = deferred(); const releaseReceive = deferred(); const bridge = Object.freeze({ getContributionContext: (id) => harness.research.getContributionContext(id), getConnectorInput: (id) => harness.research.getConnectorInput(id), async receiveContribution(input) { receiveStarted.resolve(); await releaseReceive.promise; return harness.research.receiveContribution(input) } }); const integrated = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch: bridge, trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: 'cancel-linearized', host: 'cancel-linearized' }) }) } }); const prepared = await integrated.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); const pending = integrated.executePreparedAttempt(prepared.record.connectorAttemptId); await receiveStarted.promise; assert.deepEqual(await integrated.reconcileAttempts({ projectId: request.projectId }), { items: [], remaining: 0 }); assert.equal((await integrated.getAttemptStatus(prepared.record.connectorAttemptId)).state, 'contributing'); assert.equal((await integrated.cancelAttempt(prepared.record.connectorAttemptId)).state, 'contributing'); releaseReceive.resolve(); assert.equal((await pending).state, 'succeeded'); assert.equal((await integrated.getAttemptStatus(prepared.record.connectorAttemptId)).state, 'succeeded')
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})
checks.set(28, async () => {
  const base = path.join(root, 'retry'); const store = createConnectorPersistence({ root: base }); let calls = 0; const runtime = createConnectorRuntime({ persistence: store, clock: () => now, trustedAdapters: { 'manual-reference-local': () => { calls += 1; if (calls === 1) throw new Error('controlled'); return receipt() } } }); const item = await runtime.prepareConnectorAttempt(rawFor('retry-project', 'discovery-retry')); await runtime.executePreparedAttempt(item.record.connectorAttemptId); const originalBytes = await byte(base, item.record.connectorAttemptId); const retry = await runtime.retryAttempt(item.record.connectorAttemptId); const replay = await runtime.retryAttempt(item.record.connectorAttemptId); const reservedChild = await store.read(retry.attempt); assert.deepEqual(reservedChild.budgetReservation, { reserved: 1, consumed: 0 }); assert.equal(retry.state, 'prepared'); assert.equal(retry.attempt, replay.attempt); assert.notEqual(retry.attempt, item.record.connectorAttemptId); assert.equal(await byte(base, item.record.connectorAttemptId), originalBytes); assert.equal((await runtime.executePreparedAttempt(retry.attempt)).state, 'not_executed'); const child = await store.read(retry.attempt); assert.equal(child.retryOfAttemptId, item.record.connectorAttemptId); assert.equal(child.rootAttemptId, item.record.connectorAttemptId); assert.deepEqual(child.budgetReservation, { reserved: 1, consumed: 1 })
  const limitedBase = path.join(root, 'retry-limit'); const limited = createConnectorRuntime({ persistence: createConnectorPersistence({ root: limitedBase }), clock: () => now, trustedPolicy: { maxAttempts: 2 }, trustedAdapters: { 'manual-reference-local': () => { throw new Error('controlled') } } }); const original = await limited.prepareConnectorAttempt(rawFor('retry-limit-project', 'discovery-retry-limit')); await limited.executePreparedAttempt(original.record.connectorAttemptId); const second = await limited.retryAttempt(original.record.connectorAttemptId); await limited.executePreparedAttempt(second.attempt); await rejectsCode(() => limited.retryAttempt(second.attempt), 'RETRY_LIMIT_REACHED')
})
checks.set(29, async () => { const base = path.join(root, 'permanent'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedAdapters: { 'manual-reference-local': () => ({ state: 'failed_permanent' }) } }); const item = await runtime.prepareConnectorAttempt(rawFor('permanent-project', 'discovery-permanent')); assert.equal((await runtime.executePreparedAttempt(item.record.connectorAttemptId)).state, 'failed_permanent'); assert.equal((await runtime.retryAttempt(item.record.connectorAttemptId)).state, 'failed_permanent') })
checks.set(30, async () => {
  const base = path.join(root, 'circuit'); const firstStarted = deferred(); const firstGate = deferred(); let calls = 0; let stamp = now; const store = createConnectorPersistence({ root: base }); const runtime = createConnectorRuntime({ persistence: store, clock: () => stamp, trustedPolicy: { maxTransientFailures: 1, maxConcurrency: 1, circuitCooldownMs: 1 }, trustedAdapters: { 'manual-reference-local': () => { calls += 1; if (calls === 1) { firstStarted.resolve(); return firstGate.promise } return receipt() } } }); const first = await runtime.prepareConnectorAttempt(rawFor('circuit-project', 'discovery-circuit-a')); const queued = await runtime.prepareConnectorAttempt(rawFor('circuit-project', 'discovery-circuit-b')); const firstExecution = runtime.executePreparedAttempt(first.record.connectorAttemptId); await firstStarted.promise; const queuedExecution = runtime.executePreparedAttempt(queued.record.connectorAttemptId); firstGate.reject(new Error('controlled')); assert.equal((await firstExecution).state, 'failed_transient'); const queuedResult = await queuedExecution; assert.equal(queuedResult.state, 'failed_transient'); assert.equal(queuedResult.errorCode, 'CIRCUIT_OPEN'); assert.equal(calls, 1); assert.equal((await runtime.getAttemptStatus(queued.record.connectorAttemptId)).state, 'failed_transient'); const blocked = await runtime.prepareConnectorAttempt(rawFor('circuit-project', 'discovery-circuit-c')); assert.equal(blocked.record.errorCode, 'CIRCUIT_OPEN'); stamp = (await store.readHealth('manual-reference-local')).halfOpenEligibleAt; const recovered = await runtime.retryAttempt(blocked.record.connectorAttemptId); assert.equal(recovered.state, 'prepared'); assert.equal((await runtime.executePreparedAttempt(recovered.attempt)).state, 'not_executed'); assert.equal((await store.read(recovered.attempt)).circuitObservation.outcome, 'not_executed'); assert.equal((await store.readHealth('manual-reference-local')).state, 'open')
})
checks.set(31, async () => { const base = path.join(root, 'reopen'); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now }); const item = await runtime.prepareConnectorAttempt(rawFor('reopen-project', 'discovery-reopen')); await runtime.executePreparedAttempt(item.record.connectorAttemptId); assert.equal((await createConnectorPersistence({ root: base }).read(item.record.connectorAttemptId)).state, 'succeeded') })
checks.set(32, async () => { const base = path.join(root, 'identity-preserved'); const store = createConnectorPersistence({ root: base }); const runtime = createConnectorRuntime({ persistence: store, clock: () => now, trustedAdapters: { 'manual-reference-local': () => { throw new Error('controlled') } } }); const prepared = await runtime.prepareConnectorAttempt(rawFor('identity-project', 'discovery-identity')); await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const retry = await runtime.retryAttempt(prepared.record.connectorAttemptId); const child = await store.read(retry.attempt); for (const key of ['researchSessionId','researchRequestId','discoveryId','projectId','providerType','operation','connectorId']) assert.equal(child[key], prepared.record[key]); assert.equal(child.rootAttemptId, prepared.record.connectorAttemptId); assert.equal(child.retryOfAttemptId, prepared.record.connectorAttemptId); assert.equal(child.attemptNumber, 2) })
checks.set(33, async () => { const base = path.join(root, 'canonical-bytes'); const store = createConnectorPersistence({ root: base }); const value = attempt(rawFor('canonical-project', 'discovery-canonical'), now); const policy = { maxReservationsPerProject: 8, reservationCost: 1 }; const saved = await store.createReservedAttempt(value, policy); const before = await byte(base, saved.record.connectorAttemptId); assert.equal(before, `${canonical(JSON.parse(before))}\n`); assert.equal((await store.createReservedAttempt(Object.fromEntries(Object.entries(value).reverse()), policy)).idempotent, true); assert.equal(await byte(base, saved.record.connectorAttemptId), before); await rejectsCode(() => store.createReservedAttempt({ ...attempt(rawFor('undefined-field-project', 'discovery-undefined-field'), now), authority: undefined }, policy), 'INVALID_ATTEMPT'); const mutable = attempt(rawFor('snapshot-project-a', 'discovery-snapshot-a'), now); const expectedId = mutable.connectorAttemptId; const pending = store.createReservedAttempt(mutable, policy); Object.assign(mutable, attempt(rawFor('snapshot-project-b', 'discovery-snapshot-b'), now)); const snapshotted = await pending; assert.equal(snapshotted.record.connectorAttemptId, expectedId); assert.equal(snapshotted.record.projectId, 'snapshot-project-a'); assert.equal((await store.read(expectedId)).projectId, 'snapshot-project-a'); assert.equal(await store.read(mutable.connectorAttemptId), null) })
checks.set(34, async () => { const base = path.join(root, 'pure-read'); const store = createConnectorPersistence({ root: base }); const runtime = createConnectorRuntime({ persistence: store, clock: () => now }); const prepared = await runtime.prepareConnectorAttempt(rawFor('pure-read-project', 'discovery-pure-read')); const before = await byte(base, prepared.record.connectorAttemptId); const namesBefore = (await fs.promises.readdir(base)).sort(); assert.equal((await store.read(prepared.record.connectorAttemptId)).connectorAttemptId, prepared.record.connectorAttemptId); assert.equal((await store.listAttempts('pure-read-project')).length, 1); assert.equal((await runtime.getAttemptStatus(prepared.record.connectorAttemptId)).state, 'prepared'); assert.equal(await byte(base, prepared.record.connectorAttemptId), before); assert.deepEqual((await fs.promises.readdir(base)).sort(), namesBefore) })
checks.set(35, async () => { const base = path.join(root, 'recovery'); const store = createConnectorPersistence({ root: base }); const runtime = createConnectorRuntime({ persistence: store, clock: () => now }); const item = await runtime.prepareConnectorAttempt(rawFor('recovery-project', 'discovery-recovery')); await store.claimExecution(item.record.connectorAttemptId, { expectedRevision: item.record.revision, now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 }); assert.equal((await runtime.reconcileAttempts({ projectId: 'recovery-project' })).items[0].state, 'failed_transient') })
checks.set(38, async () => { const base = path.join(root, 'stage-concurrency'); const one = createConnectorPersistence({ root: base }); const two = createConnectorPersistence({ root: base }); const policy = { maxReservationsPerProject: 8, reservationCost: 1 }; const original = Date.now; Date.now = () => 1; try { const [a, b] = await Promise.all([one.createReservedAttempt(attempt(rawFor('stage-a', 'discovery-stage-a'), now), policy), two.createReservedAttempt(attempt(rawFor('stage-b', 'discovery-stage-b'), now), policy)]); assert.ok(await createConnectorPersistence({ root: base }).read(a.record.connectorAttemptId)); assert.ok(await createConnectorPersistence({ root: base }).read(b.record.connectorAttemptId)); assert.equal((await fs.promises.readdir(base)).some((name) => name.endsWith('.stage')), false) } finally { Date.now = original } })
checks.set(36, async () => { const base = path.join(root, 'corruption'); const store = createConnectorPersistence({ root: base }); const runtime = createConnectorRuntime({ persistence: store, clock: () => now }); const a = await runtime.prepareConnectorAttempt(rawFor('corrupt-a', 'discovery-corrupt-a')); const b = await runtime.prepareConnectorAttempt(rawFor('corrupt-b', 'discovery-corrupt-b')); const c = await runtime.prepareConnectorAttempt(rawFor('corrupt-c', 'discovery-corrupt-c')); const target = path.join(base, `${c.record.connectorAttemptId}.json`); await fs.promises.writeFile(target, '{not-json'); const corruptBytes = await fs.promises.readFile(target, 'utf8'); await assert.rejects(() => store.read(c.record.connectorAttemptId), (error) => error.code === 'CORRUPT_ATTEMPT' && !error.message.includes(base)); const detail = await store.listDetailed(undefined); assert.deepEqual(detail.records.map((item) => item.connectorAttemptId).sort(), [a.record.connectorAttemptId, b.record.connectorAttemptId].sort()); assert.deepEqual(detail.corruptions, [{ connectorAttemptId: c.record.connectorAttemptId, code: 'CORRUPT_ATTEMPT' }]); await assert.rejects(() => runtime.retryAttempt(c.record.connectorAttemptId), (error) => error.code === 'CORRUPT_ATTEMPT'); const preparedBytes = await byte(base, b.record.connectorAttemptId); await assert.rejects(() => runtime.executePreparedAttempt(b.record.connectorAttemptId), (error) => error.code === 'HEALTH_SOURCE_INCOMPLETE'); assert.equal(await byte(base, b.record.connectorAttemptId), preparedBytes); assert.equal(await fs.promises.readFile(target, 'utf8'), corruptBytes); assert.equal((await createConnectorPersistence({ root: base }).read(a.record.connectorAttemptId)).state, 'prepared') })
checks.set(37, async () => { const base = path.join(root, 'rebuild-index'); const store = createConnectorPersistence({ root: base }); const runtime = createConnectorRuntime({ persistence: store, clock: () => now, trustedAdapters: { 'manual-reference-local': () => { throw new Error('controlled') } } }); const origin = await runtime.prepareConnectorAttempt(rawFor('index-project', 'discovery-index-origin')); await runtime.executePreparedAttempt(origin.record.connectorAttemptId); const retry = await runtime.retryAttempt(origin.record.connectorAttemptId); const corrupt = await runtime.prepareConnectorAttempt(rawFor('index-corrupt', 'discovery-index-corrupt')); await fs.promises.writeFile(path.join(base, `${corrupt.record.connectorAttemptId}.json`), 'bad'); const sourceBytes = await byte(base, origin.record.connectorAttemptId); const first = await store.rebuildIndex(); const indexPath = path.join(base, 'attempt-index.json'); const indexBytes = await fs.promises.readFile(indexPath, 'utf8'); const second = await store.rebuildIndex(); assert.equal(second.idempotent, true); assert.equal(await fs.promises.readFile(indexPath, 'utf8'), indexBytes); assert.equal(await byte(base, origin.record.connectorAttemptId), sourceBytes); assert.deepEqual(first.index.attemptIds, [origin.record.connectorAttemptId, retry.attempt].sort()); assert.equal(first.index.corruptions[0].code, 'CORRUPT_ATTEMPT') })
checks.set(39, async () => { const base = path.join(root, 'isolation'); const store = createConnectorPersistence({ root: base }); const failing = createConnectorRuntime({ persistence: store, clock: () => now, trustedAdapters: { 'manual-reference-local': () => ({ state: 'failed_permanent' }) } }); const safe = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now }); const a = await failing.prepareConnectorAttempt(rawFor('isolation-a', 'discovery-isolation-a')); await failing.executePreparedAttempt(a.record.connectorAttemptId); const b = await safe.prepareConnectorAttempt(rawFor('isolation-b', 'discovery-isolation-b')); await safe.executePreparedAttempt(b.record.connectorAttemptId); assert.equal((await store.read(a.record.connectorAttemptId)).state, 'failed_permanent'); assert.equal((await store.read(b.record.connectorAttemptId)).receipt.status, 'not_executed'); assert.equal((await safe.reconcileAttempts({ projectId: 'isolation-a' })).items.length, 0); assert.equal((await createConnectorPersistence({ root: base }).read(b.record.connectorAttemptId)).projectId, 'isolation-b') })
checks.set(40, async () => {
  const base = path.join(root, 'half-open'); let stamp = now; let calls = 0; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => stamp, trustedPolicy: { maxTransientFailures: 1, circuitCooldownMs: 1 }, trustedAdapters: { 'manual-reference-local': () => { calls += 1; if (calls === 1) throw new Error('controlled'); return receipt() } } }); const first = await runtime.prepareConnectorAttempt(rawFor('half-open-project', 'discovery-half-open-a')); await runtime.executePreparedAttempt(first.record.connectorAttemptId); const opened = await createConnectorPersistence({ root: base }).readHealth('manual-reference-local'); assert.equal(opened.state, 'open'); const blocked = await runtime.prepareConnectorAttempt(rawFor('half-open-project', 'discovery-half-open-b')); assert.equal(blocked.record.errorCode, 'CIRCUIT_OPEN'); stamp = opened.halfOpenEligibleAt; const probe = await runtime.prepareConnectorAttempt(rawFor('half-open-project', 'discovery-half-open-c')); assert.equal((await runtime.executePreparedAttempt(probe.record.connectorAttemptId)).state, 'not_executed'); const reopened = await createConnectorPersistence({ root: base }).readHealth('manual-reference-local'); assert.deepEqual({ state: reopened.state, failureCount: reopened.failureCount, probeAttemptId: reopened.probeAttemptId }, { state: 'open', failureCount: 1, probeAttemptId: null })
  const permanentBase = path.join(root, 'half-open-permanent'); let permanentStamp = now; let permanentCalls = 0; const permanentRuntime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: permanentBase }), clock: () => permanentStamp, trustedPolicy: { maxTransientFailures: 1, circuitCooldownMs: 1 }, trustedAdapters: { 'manual-reference-local': () => { permanentCalls += 1; if (permanentCalls === 1) throw new Error('controlled'); return { state: 'failed_permanent' } } } }); const permanentFirst = await permanentRuntime.prepareConnectorAttempt(rawFor('half-open-permanent-project', 'discovery-half-open-permanent-a')); await permanentRuntime.executePreparedAttempt(permanentFirst.record.connectorAttemptId); const permanentOpened = await createConnectorPersistence({ root: permanentBase }).readHealth('manual-reference-local'); permanentStamp = permanentOpened.halfOpenEligibleAt; const permanentProbe = await permanentRuntime.prepareConnectorAttempt(rawFor('half-open-permanent-project', 'discovery-half-open-permanent-b')); assert.equal((await permanentRuntime.executePreparedAttempt(permanentProbe.record.connectorAttemptId)).state, 'failed_permanent'); assert.equal((await createConnectorPersistence({ root: permanentBase }).readHealth('manual-reference-local')).state, 'open')
  const cancelBase = path.join(root, 'half-open-cancel'); let cancelStamp = now; let cancelCalls = 0; const cancelStarted = deferred(); const cancelGate = deferred(); const cancelRuntime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: cancelBase }), clock: () => cancelStamp, trustedPolicy: { maxTransientFailures: 1, circuitCooldownMs: 1 }, trustedAdapters: { 'manual-reference-local': () => { cancelCalls += 1; if (cancelCalls === 1) throw new Error('controlled'); cancelStarted.resolve(); return cancelGate.promise } } }); const cancelFirst = await cancelRuntime.prepareConnectorAttempt(rawFor('half-open-cancel-project', 'discovery-half-open-cancel-a')); await cancelRuntime.executePreparedAttempt(cancelFirst.record.connectorAttemptId); const cancelOpened = await createConnectorPersistence({ root: cancelBase }).readHealth('manual-reference-local'); cancelStamp = cancelOpened.halfOpenEligibleAt; const cancelProbe = await cancelRuntime.prepareConnectorAttempt(rawFor('half-open-cancel-project', 'discovery-half-open-cancel-b')); const cancelExecution = cancelRuntime.executePreparedAttempt(cancelProbe.record.connectorAttemptId); await cancelStarted.promise; assert.equal((await cancelRuntime.cancelAttempt(cancelProbe.record.connectorAttemptId)).state, 'cancelled'); assert.equal((await cancelExecution).state, 'cancelled'); assert.equal((await createConnectorPersistence({ root: cancelBase }).readHealth('manual-reference-local')).state, 'open'); cancelGate.resolve(receipt())

  const offsetBase = path.join(root, 'half-open-offset')
  const offsetStore = createConnectorPersistence({ root: offsetBase })
  await offsetStore.saveHealth({ schemaVersion: 'jefe-research-connector-health/v1', connectorId: 'manual-reference-local', state: 'open', failureCount: 1, openedAt: '2026-08-25T13:00:00.000Z', halfOpenEligibleAt: '2026-08-25T13:01:00.000Z', probeAttemptId: null, lastTransitionAt: '2026-08-25T13:00:00.000Z' })
  const fallbackPersistence = { ...offsetStore, claimExecution: null, completeCircuitObservation: null, rebuildDerivedHealth: null }
  let offsetCalls = 0
  const offsetRuntime = createConnectorRuntime({ persistence: fallbackPersistence, clock: () => '2026-08-25T10:02:00.000-03:00', trustedPolicy: { maxTransientFailures: 1, circuitCooldownMs: 60000 }, trustedAdapters: { 'manual-reference-local': () => { offsetCalls += 1; return receipt() } } })
  const offsetPrepared = await offsetRuntime.prepareConnectorAttempt(rawFor('half-open-offset-project', 'discovery-half-open-offset'))
  assert.equal(offsetPrepared.record.state, 'prepared')
  await rejectsCode(() => offsetRuntime.executePreparedAttempt(offsetPrepared.record.connectorAttemptId), 'HEALTH_SOURCE_INCOMPLETE')
  assert.equal(offsetCalls, 0)
})
checks.set(41, async () => { const harness = await integratedHarness('manual'); try { const request = harness.planned.radar; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now }); const prepared = await runtime.prepareConnectorAttempt({ researchSessionId: 'research-session-manual', researchRequestId: request.researchRequestId, discoveryId: request.discoveryId, projectId: request.projectId, providerType: 'manual_reference', operation: 'reference' }); const first = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const before = await byte(harness.connectorRoot, prepared.record.connectorAttemptId); const second = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); assert.equal(first.state, 'not_executed'); assert.equal(first.referenceOnly, true); assert.equal(first.classification, 'UNTRUSTED_EXTERNAL_CONTENT'); assert.equal(second.idempotent, true); assert.equal(await byte(harness.connectorRoot, prepared.record.connectorAttemptId), before); assert.equal((await harness.memory.getSnapshot()).history.filter((entry) => entry.type === 'evidence').length, 0); assert.ok(await harness.researchPersistence.list(request.projectId)) } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) } })
checks.set(42, async () => { const harness = await integratedHarness('manual-limit'); try { const request = harness.planned.radar; const session = (await harness.researchPersistence.list(request.projectId)).find((item) => item.researchRequestId === request.researchRequestId); assert.equal(session.receipts.length, 0); assert.equal(session.status, request.state); assert.equal((await harness.memory.getSnapshot()).history.filter((entry) => entry.type === 'evidence').length, 0); assert.equal(request.providerType, 'manual_reference') } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) } })
checks.set(43, async () => {
  const harness = await integratedHarness('candidate-bridge')
  try {
    const request = harness.planned.radar; const counters = { contexts: 0, receives: 0 }; const trustedResearch = bridgeFor(harness.research, counters); let adapters = 0
    assert.deepEqual(Object.keys(trustedResearch).sort(), ['getConnectorInput', 'getContributionContext', 'receiveContribution'])
    const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch, trustedAdapters: { 'manual-reference-local': () => { adapters += 1; return { candidate: connectorCandidate({ seed: 'candidate-bridge', host: 'candidate-bridge' }) } } } })
    const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const saved = await createConnectorPersistence({ root: harness.connectorRoot }).read(prepared.record.connectorAttemptId)
    assert.equal(result.state, 'succeeded'); assert.equal(result.research.state, 'needs_corroboration'); assert.equal(adapters, 1); assert.equal(counters.receives, 1); assert.ok(counters.contexts >= 1); assert.match(saved.research.receiptId, /^receipt-/u); assert.equal(Object.hasOwn(saved, 'candidate'), false)
    await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); assert.equal(adapters, 1); assert.equal(counters.receives, 1)
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})

checks.set(44, async () => {
  const harness = await integratedHarness('invalid-candidate')
  try {
    const request = harness.planned.radar; const counters = { contexts: 0, receives: 0 }; let adapters = 0
    const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => { adapters += 1; return { candidate: { projectId: 'forged-project' } } } } })
    const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const saved = await createConnectorPersistence({ root: harness.connectorRoot }).read(prepared.record.connectorAttemptId); const before = await byte(harness.connectorRoot, prepared.record.connectorAttemptId)
    assert.deepEqual({ state: result.state, errorCode: saved.errorCode, receipt: Object.hasOwn(saved, 'receipt'), research: Object.hasOwn(saved, 'research'), consumed: saved.budgetReservation.consumed }, { state: 'failed_permanent', errorCode: 'INVALID_CONNECTOR_CANDIDATE', receipt: false, research: false, consumed: saved.budgetReservation.reserved })
    assert.equal(adapters, 1); assert.equal(counters.receives, 0); assert.equal((await runtime.retryAttempt(prepared.record.connectorAttemptId)).state, 'failed_permanent'); await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); assert.equal(adapters, 1); assert.equal(await byte(harness.connectorRoot, prepared.record.connectorAttemptId), before)
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})

checks.set(45, async () => {
  const harness = await integratedHarness('durable-gate')
  try {
    const request = harness.planned.radar; const counters = { contexts: 0, receives: 0 }; let adapters = 0
    const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => { adapters += 1; return { candidate: connectorCandidate({ seed: 'durable-gate', host: 'durable-gate', claim: 'Claim durable' }) } } } })
    const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const attemptBytes = await byte(harness.connectorRoot, prepared.record.connectorAttemptId); const session = (await harness.researchPersistence.list(request.projectId)).find((item) => item.researchRequestId === request.researchRequestId); const evidenceCase = await harness.evidenceCasePersistence.read(harness.planned.evidenceCaseId)
    assert.equal(session.receipts.length, 1); assert.equal(session.evidenceDecisions.length, 1); assert.equal(evidenceCase.receipts.length, 1); assert.equal(evidenceCase.contributions.length, 1); assert.equal(evidenceCase.state, 'needs_corroboration'); assert.equal(adapters, 1); assert.equal(counters.receives, 1)
    await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); assert.equal(await byte(harness.connectorRoot, prepared.record.connectorAttemptId), attemptBytes); assert.equal(adapters, 1); assert.equal(counters.receives, 1); const reopened = await createConnectorPersistence({ root: harness.connectorRoot }).read(prepared.record.connectorAttemptId); assert.equal(reopened.research.receiptId, session.receipts[0].receiptId); const restartedResearch = harness.createResearch(); const hydratedContext = await restartedResearch.getContributionContext(request.researchRequestId); assert.equal(hydratedContext.evidenceCaseId, harness.planned.evidenceCaseId); assert.equal(hydratedContext.researchPlanId, harness.planned.researchPlanId)
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})

checks.set(46, async () => {
  const harness = await integratedHarness('corroboration-durable')
  try {
    const request = harness.planned.radar; const counters = { contexts: 0, receives: 0 }
    const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: 'corroboration-one', host: 'corroboration-one' }) }) } })
    const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); const first = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const attemptBefore = await byte(harness.connectorRoot, prepared.record.connectorAttemptId); const caseFile = path.join(harness.evidenceCaseRoot, `${harness.planned.evidenceCaseId}.json`); const caseBefore = await fs.promises.readFile(caseFile, 'utf8')
    assert.equal(first.research.state, 'needs_corroboration'); assert.equal((await harness.evidenceCasePersistence.read(harness.planned.evidenceCaseId)).state, 'needs_corroboration'); assert.equal(harness.researchMemory.calls.length, 0); assert.equal((await harness.memory.getSnapshot()).history.filter((entry) => entry.type === 'evidence').length, 0)
    await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const fresh = harness.createResearch(); const reopened = await fresh.reopen(request.researchRequestId); const retried = await fresh.retryPendingResearch(request.researchRequestId); const reconciled = await fresh.reconcilePendingResearch(request.projectId)
    assert.equal(reopened.state, 'needs_corroboration'); assert.equal(retried.state, 'needs_corroboration'); assert.deepEqual(reconciled, []); assert.equal(harness.researchMemory.calls.length, 0); assert.equal(counters.receives, 1); assert.equal(await byte(harness.connectorRoot, prepared.record.connectorAttemptId), attemptBefore); assert.equal(await fs.promises.readFile(caseFile, 'utf8'), caseBefore)
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})

checks.set(47, async () => {
  const harness = await integratedHarness('accepted-memory-once')
  try {
    const direct = await harness.research.receiveContribution(contributionFor(harness.planned.scout, { seed: 'independent-scout', host: 'independent-scout' })); assert.equal(direct.state, 'needs_corroboration')
    const counters = { contexts: 0, receives: 0 }; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: 'independent-radar', host: 'independent-radar' }) }) } })
    const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, harness.planned.radar.researchRequestId)); const accepted = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const record = await harness.evidenceCasePersistence.read(harness.planned.evidenceCaseId)
    assert.equal(accepted.research.state, 'accepted_for_context'); assert.equal(accepted.research.evidence.state, 'accepted_for_context'); assert.equal(record.state, 'accepted_for_context'); assert.equal(record.receipts.length, 2); assert.equal(record.memory.status, 'appended'); assert.equal(harness.researchMemory.calls.length, 1); assert.equal((await harness.memory.getSnapshot()).history.filter((entry) => entry.type === 'evidence').length, 1)
    await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const fresh = harness.createResearch(); const reopened = await fresh.reopen(harness.planned.radar.researchRequestId); await fresh.retryPendingResearch(harness.planned.radar.researchRequestId); await fresh.reconcilePendingResearch(harness.planned.radar.projectId); assert.equal(reopened.state, 'completed_with_evidence'); assert.equal(harness.researchMemory.calls.length, 1); assert.equal(counters.receives, 1)
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})

checks.set(48, async () => {
  const harness = await integratedHarness('contradiction-preserved')
  try {
    await harness.research.receiveContribution(contributionFor(harness.planned.scout, { seed: 'contradiction-scout', host: 'contradiction-scout', claim: 'La opcion A es valida' }))
    const counters = { contexts: 0, receives: 0 }; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: harness.connectorRoot }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: 'contradiction-radar', host: 'contradiction-radar', claim: 'La opcion B es valida' }) }) } })
    const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, harness.planned.radar.researchRequestId)); const contradicted = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const record = await harness.evidenceCasePersistence.read(harness.planned.evidenceCaseId); const serialized = JSON.stringify(record)
    assert.equal(contradicted.research.state, 'requires_human'); assert.equal(contradicted.research.evidence.contradictionCount, 1); assert.equal(record.state, 'requires_human'); assert.equal(record.contradictionStatus, 'preserved'); assert.equal(record.receipts.length, 2); assert.equal(record.evidenceDecisions[0].branches.length, 2); assert.equal(record.nextResponsible, 'lean'); assert.equal(harness.researchMemory.calls.length, 0); assert.equal(serialized.includes('human_decision'), false)
    const fresh = harness.createResearch(); const reopened = await fresh.reopenEvidenceCase(harness.planned.evidenceCaseId); assert.equal(reopened.state, 'requires_human'); assert.equal(reopened.contradictionStatus, 'preserved')
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})

checks.set(49, async () => {
  const harness = await integratedHarness('forgery-matrix')
  try {
    const request = harness.planned.radar; const forbidden = [
      ['providerType', 'crawler'], ['adapter', 'forged-adapter'], ['connectorId', 'forged-connector'], ['budget', { maxQueries: 999 }], ['timeout', 999999], ['circuitBreaker', 'closed'], ['researchRequestId', 'research-forged'], ['projectId', 'project-forged'], ['authority', 'human_decision'], ['evidenceState', 'accepted_for_context'], ['deploy', true], ['path', 'C:/forged/path'],
    ]
    assert.throws(() => evidenceReference({ request, url: 'file:///private/research.txt', claim: 'Referencia controlada', now }), (error) => error.code === 'INVALID_EVIDENCE'); assert.throws(() => evidenceCandidate({ request, receipt: { researchRequestId: request.researchRequestId, status: 'received' }, claim: 'Claim forjado', now }), (error) => error.code === 'INVALID_EVIDENCE_CORRELATION'); assert.throws(() => createConnectorRuntime({ persistence: createConnectorPersistence({ root: path.join(harness.base, 'expanded-bridge') }), trustedResearch: { ...bridgeFor(harness.research), receive: () => {} } }), (error) => error.code === 'INVALID_RESEARCH_BRIDGE')
    for (const [index, [key, value]] of forbidden.entries()) {
      const counters = { contexts: 0, receives: 0 }; const base = path.join(harness.base, `forbidden-${index}`); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: `forbidden-${index}`, host: `forbidden-${index}`, [key]: value }) }) } }); const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); const saved = await createConnectorPersistence({ root: base }).read(prepared.record.connectorAttemptId); assert.equal(result.state, 'failed_permanent', key); assert.equal(saved.errorCode, 'INVALID_CONNECTOR_CANDIDATE', key); assert.equal(counters.receives, 0, key); if (Object.hasOwn(prepared.record, key)) assert.deepEqual(saved[key], prepared.record[key], key); else assert.equal(Object.hasOwn(saved, key), false, key)
    }
    for (const overrides of [{ projectId: 'project-forged-correlation' }, { discoveryId: 'discovery-forged-correlation' }, { researchSessionId: 'research-session-forged-correlation' }]) {
      const counters = { contexts: 0, receives: 0 }; const base = path.join(harness.base, `cross-${Object.keys(overrides)[0]}`); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: `cross-${Object.keys(overrides)[0]}`, host: `cross-${Object.keys(overrides)[0]}` }) }) } }); await rejectsCode(() => runtime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId, overrides)), 'INVALID_RESEARCH_CORRELATION'); assert.equal(counters.receives, 0)
    }
    const providerCounters = { contexts: 0, receives: 0 }; const providerBase = path.join(harness.base, 'cross-provider'); const providerRuntime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: providerBase }), clock: () => now, trustedResearch: bridgeFor(harness.research, providerCounters), trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: 'cross-provider', host: 'cross-provider' }) }) } }); await rejectsCode(() => providerRuntime.prepareConnectorAttempt(inputFrom(harness.research, harness.planned.scout.researchRequestId, { providerType: 'manual_reference', operation: 'reference' })), 'INVALID_RESEARCH_CORRELATION'); assert.equal(providerCounters.receives, 0)
    await rejectsCode(() => providerRuntime.getAttemptStatus('../../forged-path'), 'INVALID_ATTEMPT_ID')
    const opaqueBase = path.join(harness.base, 'opaque-receipt'); const opaqueRuntime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: opaqueBase }), clock: () => now, trustedAdapters: { 'manual-reference-local': () => ({ receipt: { status: 'received', authority: 'human_decision', path: 'C:/forged' } }) } }); const opaque = await opaqueRuntime.prepareConnectorAttempt(rawFor('opaque-project', 'discovery-opaque')); const opaqueResult = await opaqueRuntime.executePreparedAttempt(opaque.record.connectorAttemptId); const opaqueSaved = await createConnectorPersistence({ root: opaqueBase }).read(opaque.record.connectorAttemptId); assert.equal(opaqueResult.state, 'failed_permanent'); assert.equal(Object.hasOwn(opaqueSaved, 'receipt'), false); assert.equal(JSON.stringify(opaqueSaved).includes('human_decision'), false)
    const crossedResultBase = path.join(harness.base, 'crossed-result'); const crossedBridge = Object.freeze({ getContributionContext: (id) => harness.research.getContributionContext(id), getConnectorInput: (id) => harness.research.getConnectorInput(id), async receiveContribution(input) { const result = await harness.research.receiveContribution(input); return { ...result, researchPlanId: `research-plan-${'f'.repeat(32)}` } } }); const crossedRuntime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: crossedResultBase }), clock: () => now, trustedResearch: crossedBridge, trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: 'crossed-result', host: 'crossed-result' }) }) } }); const crossedPrepared = await crossedRuntime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); assert.equal((await crossedRuntime.executePreparedAttempt(crossedPrepared.record.connectorAttemptId)).state, 'failed_transient'); const crossedSaved = await createConnectorPersistence({ root: crossedResultBase }).read(crossedPrepared.record.connectorAttemptId); assert.equal(crossedSaved.errorCode, 'RESEARCH_RECEIVE_REJECTED'); assert.equal(Object.hasOwn(crossedSaved, 'research'), false)
    assert.equal(harness.researchMemory.calls.length, 0)
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }

  const provenance = await integratedHarness('terminal-provenance', 'structured_analysis')
  try {
    const request = provenance.planned.scout
    const context = provenance.research.getContributionContext(request.researchRequestId)
    const descriptor = createStructuredAnalysisConnector()
    const store = createConnectorPersistence({ root: provenance.connectorRoot })
    const bridge = bridgeFor(provenance.research)
    const runtime = createConnectorRuntime({ persistence: store, clock: () => now, trustedResearch: bridge, trustedAdapters: { 'structured-analysis-local': descriptor } })
    const prepared = await runtime.prepareConnectorAttempt({ researchSessionId: context.researchSessionId, researchRequestId: context.researchRequestId, discoveryId: context.discoveryId, projectId: context.projectId, providerType: context.providerType, operation: 'analyze' })
    assert.equal((await runtime.executePreparedAttempt(prepared.record.connectorAttemptId)).state, 'partial')
    const terminal = await store.read(prepared.record.connectorAttemptId)
    const rebuiltPending = delivery({
      record: terminal,
      context: Object.fromEntries(['researchSessionId', 'researchRequestId', 'researchPlanId', 'evidenceCaseId', 'discoveryId', 'projectId', 'providerType'].map((key) => [key, terminal.delivery[key]])),
      rawReceipt: { ...terminal.delivery.rawReceipt, method: 'injected_controlled_adapter' },
      claim: terminal.delivery.claim,
      budget: terminal.delivery.budget,
      now: terminal.delivery.createdAt,
    })
    const rewritten = { ...terminal, delivery: completeDelivery(rebuiltPending, rebuiltPending.expectedReceiptId, terminal.delivery.deliveredAt) }
    await fs.promises.writeFile(path.join(provenance.connectorRoot, `${terminal.connectorAttemptId}.json`), canonical(rewritten), 'utf8')
    assert.equal((await store.read(terminal.connectorAttemptId)).delivery.rawReceipt.method, 'injected_controlled_adapter')
    const reopened = createConnectorRuntime({ persistence: createConnectorPersistence({ root: provenance.connectorRoot }), clock: () => now, trustedResearch: bridge, trustedAdapters: { 'structured-analysis-local': descriptor } })
    const fingerprint = digest(canonical(rewritten))
    const snapshot = { connectorAttemptId: rewritten.connectorAttemptId, revision: rewritten.revision, state: rewritten.state, deliveryId: rewritten.delivery.deliveryId, deliveryState: rewritten.delivery.state, fingerprint }
    let published = 0
    await rejectsCode(() => reopened.getAttemptStatus(rewritten.connectorAttemptId), 'INVALID_RESEARCH_CORRELATION')
    await rejectsCode(() => reopened.executePreparedAttempt(rewritten.connectorAttemptId), 'INVALID_RESEARCH_CORRELATION')
    await rejectsCode(() => reopened.withExactAttemptSnapshots(rewritten.projectId, [snapshot], () => { published += 1 }), 'INVALID_RESEARCH_CORRELATION')
    assert.equal(published, 0)
  } finally { await fs.promises.rm(provenance.base, { recursive: true, force: true }) }
})

checks.set(50, async () => {
  const harness = await integratedHarness('sanitization')
  try {
    const request = harness.planned.radar; const thrownMarker = 'zeta-secret-stack-command-path'; const thrownBase = path.join(harness.base, 'thrown-secret'); const thrownRuntime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: thrownBase }), clock: () => now, trustedAdapters: { 'manual-reference-local': () => { const error = new Error(`Authorization Bearer ${thrownMarker} C:/private command`); error.stack = `STACK ${thrownMarker}`; throw error } } }); const thrown = await thrownRuntime.prepareConnectorAttempt(rawFor('sanitized-error-project', 'discovery-sanitized-error')); const thrownResult = await thrownRuntime.executePreparedAttempt(thrown.record.connectorAttemptId); assert.equal(thrownResult.state, 'failed_transient'); assert.equal((await treeText(thrownBase)).includes(thrownMarker), false)
    const marker = 'zeta-sensitive-credential'; const codeMarker = 'ZETA_SENSITIVE_CREDENTIAL'; const malicious = [
      { excerpt: `Authorization Bearer ${marker}` },
      { claim: `token ${marker}` },
      { consumed: { authorization: marker, path: `C:/private/${marker}`, command: `run-${marker}` } },
      { url: `https://user:${marker}@source.test/private` },
      { headers: { authorization: marker } },
      { stack: `STACK ${marker}` },
      { path: `C:/private/${marker}` },
      { command: `execute-${marker}` },
      { credentials: { apiKey: marker } },
      { codes: [codeMarker] },
      { consumed: { bytes: Number.MAX_SAFE_INTEGER } },
      { claim: `ＡＰＩ＿ＫＥＹ ${marker}` },
      { claim: 'Referencia (/etc/passwd)' },
      { claim: `Referencia\u200b${marker}` },
      { url: `https://source.test/path?api_key=${marker}` },
      { url: 'https://source.test/path?%61%70%69%5f%6b%65%79=opaque-value' },
    ]
    for (const [index, patch] of malicious.entries()) {
      const counters = { contexts: 0, receives: 0 }; const base = path.join(harness.base, `sensitive-${index}`); const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedResearch: bridgeFor(harness.research, counters), trustedAdapters: { 'manual-reference-local': () => ({ candidate: connectorCandidate({ seed: `sensitive-${index}`, host: `sensitive-${index}`, ...patch }) }) } }); const prepared = await runtime.prepareConnectorAttempt(inputFrom(harness.research, request.researchRequestId)); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); assert.equal(result.state, 'failed_permanent', JSON.stringify(patch)); assert.ok(counters.receives <= 1, JSON.stringify(patch)); const persisted = await treeText(base); assert.equal(persisted.includes(marker), false); assert.equal(persisted.includes(codeMarker), false)
    }
    assert.equal((await treeText(harness.base)).includes(marker), false); assert.equal(harness.researchMemory.calls.length, 0)
  } finally { await fs.promises.rm(harness.base, { recursive: true, force: true }) }
})

checks.set(51, async () => {
  const base = path.join(root, 'bounded-reconcile'); const store = createConnectorPersistence({ root: base }); let adapters = 0; const runtime = createConnectorRuntime({ persistence: store, clock: () => now, trustedAdapters: { 'manual-reference-local': () => { adapters += 1; return receipt() } } }); const records = []
  for (const key of ['a','b','c','d']) records.push((await runtime.prepareConnectorAttempt(rawFor('reconcile-project', `discovery-reconcile-${key}`))).record)
  await store.claimExecution(records[0].connectorAttemptId, { expectedRevision: records[0].revision, now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 }); await store.claimExecution(records[1].connectorAttemptId, { expectedRevision: records[1].revision, now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 }); await runtime.executePreparedAttempt(records[2].connectorAttemptId); const preparedBefore = await byte(base, records[3].connectorAttemptId); const succeededBefore = await byte(base, records[2].connectorAttemptId); const runningIds = [records[0].connectorAttemptId, records[1].connectorAttemptId].sort()
  const first = await runtime.reconcileAttempts({ projectId: 'reconcile-project', limit: 1 }); assert.deepEqual(first.items.map((item) => item.connectorAttemptId), [runningIds[0]]); assert.equal(first.remaining, 1); assert.equal(adapters, 1); assert.equal(await byte(base, records[3].connectorAttemptId), preparedBefore); assert.equal(await byte(base, records[2].connectorAttemptId), succeededBefore)
  const second = await runtime.reconcileAttempts({ projectId: 'reconcile-project', limit: 1 }); const third = await runtime.reconcileAttempts({ projectId: 'reconcile-project', limit: 1 }); assert.deepEqual(second.items.map((item) => item.connectorAttemptId), [runningIds[1]]); assert.equal(second.remaining, 0); assert.deepEqual(third, { items: [], remaining: 0 }); assert.equal(adapters, 1)
  await rejectsCode(() => runtime.reconcileAttempts({ projectId: 'reconcile-project', limit: 0 }), 'INVALID_RECONCILE'); await rejectsCode(() => runtime.reconcileAttempts({ projectId: 'reconcile-project', limit: 51 }), 'INVALID_RECONCILE'); const beforeRead = await byte(base, records[3].connectorAttemptId); await runtime.getAttemptStatus(records[3].connectorAttemptId); assert.equal(await byte(base, records[3].connectorAttemptId), beforeRead)

  const emptyStore = createConnectorPersistence({ root: path.join(root, 'targeted-reconcile-empty') }); const emptyCalls = { read: 0, scan: 0, rebuild: 0 }; const emptyPersistence = { ...emptyStore, read() { emptyCalls.read += 1; throw new Error('forbidden read') }, listAllAttempts() { emptyCalls.scan += 1; throw new Error('forbidden scan') }, rebuildDerivedHealth() { emptyCalls.rebuild += 1; throw new Error('forbidden rebuild') } }; const emptyRuntime = createConnectorRuntime({ persistence: emptyPersistence, clock: () => now }); assert.deepEqual(await emptyRuntime.reconcileAttempts({ projectId: 'targeted-empty-project', limit: 50, candidates: [] }), { items: [], remaining: 0, results: [] }); assert.deepEqual(emptyCalls, { read: 0, scan: 0, rebuild: 0 })

  const targetedStore = createConnectorPersistence({ root: path.join(root, 'targeted-reconcile') }); let targetedAdapters = 0; const targetedRuntime = createConnectorRuntime({ persistence: targetedStore, clock: () => now, trustedAdapters: { 'manual-reference-local': () => { targetedAdapters += 1; return receipt() } } }); const targeted = {}; for (const key of ['a','b','c','e']) targeted[key] = (await targetedRuntime.prepareConnectorAttempt(rawFor('targeted-project', `discovery-targeted-${key}`))).record; for (const key of ['a','b','e']) targeted[key] = (await targetedStore.claimExecution(targeted[key].connectorAttemptId, { expectedRevision: targeted[key].revision, now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 })).record; const descriptor = (record) => ({ connectorAttemptId: record.connectorAttemptId, revision: record.revision, state: record.state, deliveryId: record.delivery?.deliveryId || null }); const candidates = [descriptor(targeted.a), { ...descriptor(targeted.b), revision: targeted.b.revision + 1 }, descriptor(targeted.c), { ...descriptor(targeted.e), deliveryId: `connector-delivery-${'f'.repeat(32)}` }]; targeted.d = (await targetedRuntime.prepareConnectorAttempt(rawFor('targeted-project', 'discovery-targeted-d'))).record; targeted.d = (await targetedStore.claimExecution(targeted.d.connectorAttemptId, { expectedRevision: targeted.d.revision, now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 })).record; const targetedCalls = { scan: 0, rebuild: 0 }; const targetedPersistence = { ...targetedStore, listAllAttempts() { targetedCalls.scan += 1; throw new Error('forbidden scan') }, rebuildDerivedHealth() { targetedCalls.rebuild += 1; throw new Error('forbidden rebuild') } }; const targetedReconciler = createConnectorRuntime({ persistence: targetedPersistence, clock: () => now }); const targetedResult = await targetedReconciler.reconcileAttempts({ projectId: 'targeted-project', limit: 4, candidates }); assert.equal(targetedResult.remaining, 0); assert.deepEqual(targetedResult.items, []); assert.deepEqual(targetedResult.results.map((item) => item.status), ['aborted', 'stale', 'ineligible', 'stale']); for (const result of targetedResult.results) assert.deepEqual(Object.keys(result).sort(), ['connectorAttemptId','deliveryId','revision','state','status'].sort()); for (const key of ['a','b','d','e']) assert.equal((await targetedStore.read(targeted[key].connectorAttemptId)).state, 'running'); assert.equal((await targetedStore.read(targeted.c.connectorAttemptId)).state, 'prepared'); const exactResult = await targetedReconciler.reconcileAttempts({ projectId: 'targeted-project', limit: 1, candidates: [descriptor(targeted.a)] }); assert.deepEqual(exactResult.items.map((item) => item.connectorAttemptId), [targeted.a.connectorAttemptId]); assert.deepEqual(exactResult.results.map((item) => item.status), ['reconciled']); assert.equal((await targetedStore.read(targeted.a.connectorAttemptId)).state, 'failed_transient'); assert.equal((await targetedStore.read(targeted.d.connectorAttemptId)).state, 'running'); assert.deepEqual(targetedCalls, { scan: 0, rebuild: 0 }); assert.equal(targetedAdapters, 0); await rejectsCode(() => targetedRuntime.reconcileAttempts({ projectId: 'targeted-project', limit: 1, candidates: candidates.slice(0, 2) }), 'INVALID_RECONCILE'); await rejectsCode(() => targetedRuntime.reconcileAttempts({ projectId: 'targeted-project', limit: 50, candidates: Array.from({ length: 51 }, () => descriptor(targeted.c)) }), 'INVALID_RECONCILE'); await rejectsCode(() => targetedRuntime.reconcileAttempts({ projectId: 'targeted-project', limit: 4, candidates, providerType: 'manual_reference' }), 'INVALID_RECONCILE')

  const fairBase = path.join(root, 'targeted-reconcile-write-fairness'); const fairStore = createConnectorPersistence({ root: fairBase }); const fairRuntime = createConnectorRuntime({ persistence: fairStore, clock: () => now }); const fair = []
  for (const key of ['a','b']) { let record = (await fairRuntime.prepareConnectorAttempt(rawFor('targeted-fair-project', `discovery-targeted-fair-${key}`))).record; record = (await fairStore.claimExecution(record.connectorAttemptId, { expectedRevision: record.revision, now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 })).record; fair.push(record) }
  const originalRename = fs.promises.rename
  fs.promises.rename = async (source, target) => {
    if (path.resolve(target) === path.resolve(fairBase, `${fair[0].connectorAttemptId}.json`)) { const error = new Error('controlled write failure'); error.code = 'EACCES'; throw error }
    return originalRename(source, target)
  }
  let fairResult
  try { fairResult = await fairRuntime.reconcileAttempts({ projectId: 'targeted-fair-project', limit: 2, candidates: fair.map(descriptor) }) } finally { fs.promises.rename = originalRename }
  assert.deepEqual(fairResult.results.map((item) => item.status), ['failed', 'reconciled'])
  assert.deepEqual(fairResult.items.map((item) => item.connectorAttemptId), [fair[1].connectorAttemptId])
  assert.equal(fairResult.remaining, 1)
  assert.equal((await fairStore.read(fair[0].connectorAttemptId)).state, 'running')
  assert.equal((await fairStore.read(fair[1].connectorAttemptId)).state, 'failed_transient')
  assert.equal((await fairStore.diagnoseDerivedHealth('manual-reference-local', { maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 })).sourceIntegrity, 'complete')
  const fairRetry = await fairRuntime.reconcileAttempts({ projectId: 'targeted-fair-project', limit: 1, candidates: [descriptor(await fairStore.read(fair[0].connectorAttemptId))] })
  assert.deepEqual(fairRetry.results.map((item) => item.status), ['reconciled'])
  assert.equal(fairRetry.remaining, 0)
})

checks.set(52, async () => {
  const http = require('node:http'); const https = require('node:https'); const net = require('node:net'); const dns = require('node:dns'); const childProcess = require('node:child_process'); const Module = require('node:module'); const calls = []; const restores = []
  const trap = (name) => { calls.push(name); throw new Error(`forbidden capability: ${name}`) }
  const replace = (target, key, name) => { if (!target || typeof target[key] !== 'function') return; const original = target[key]; target[key] = (...args) => trap(name, ...args); restores.push(() => { target[key] = original }) }
  for (const [target, entries] of [[http,['request','get']], [https,['request','get']], [net,['connect','createConnection']], [dns,['lookup','resolve','resolve4','resolve6']], [dns.promises,['lookup','resolve','resolve4','resolve6']], [childProcess,['exec','execFile','spawn','fork']]]) for (const key of entries) replace(target, key, `${target === childProcess ? 'shell' : 'network'}:${key}`)
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch'); Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: () => trap('fetch') }); restores.push(() => { if (fetchDescriptor) Object.defineProperty(globalThis, 'fetch', fetchDescriptor); else delete globalThis.fetch })
  const webSocketDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket'); Object.defineProperty(globalThis, 'WebSocket', { configurable: true, writable: true, value: function ForbiddenWebSocket() { trap('browser:websocket') } }); restores.push(() => { if (webSocketDescriptor) Object.defineProperty(globalThis, 'WebSocket', webSocketDescriptor); else delete globalThis.WebSocket })
  const originalLoad = Module._load; Module._load = function guardedLoad(request, ...args) { if (['electron','playwright','puppeteer'].includes(request)) trap(`browser:${request}`); return originalLoad.call(this, request, ...args) }; restores.push(() => { Module._load = originalLoad })
  try {
    const base = path.join(root, 'negative-matrix'); let adapters = 0; const runtime = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedAdapters: { 'automated-browser-disabled': () => { adapters += 1; trap('browser:adapter') }, 'local-model-not-configured': () => { adapters += 1; trap('generation:provider') }, 'metasearch-not-connected': () => { adapters += 1; trap('network:provider') } } })
    const manual = await runtime.prepareConnectorAttempt(rawFor('negative-project', 'discovery-negative-manual')); assert.equal((await runtime.executePreparedAttempt(manual.record.connectorAttemptId)).state, 'not_executed')
    for (const input of [{ ...rawFor('negative-project', 'discovery-negative-browser'), providerType: 'automated_browser', operation: 'browse' }, { ...rawFor('negative-project', 'discovery-negative-model'), providerType: 'local_model', operation: 'analyze' }, { ...rawFor('negative-project', 'discovery-negative-search'), providerType: 'metasearch', operation: 'search' }]) { const prepared = await runtime.prepareConnectorAttempt(input); const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId); assert.ok(['policy_blocked','not_connected'].includes(result.state)); assert.equal(runtime.getConnectorHealth(input.providerType).networkEnabled, false) }
    const sources = await Promise.all(['../electron/jefe-research-connector-contract.cjs','../electron/jefe-research-connector-coordinator.cjs','../electron/jefe-research-connector-persistence.cjs','../electron/jefe-research-connector-runtime.cjs'].map((file) => fs.promises.readFile(new URL(file, import.meta.url), 'utf8'))); const source = sources.join('\n'); assert.doesNotMatch(source, /require\(['"](?:node:)?(?:http|https|net|dns|child_process|electron|playwright|puppeteer)['"]\)|\bfetch\s*\(|\b(?:generate|preview|deploy|publish)\s*\(/u)
    assert.equal(adapters, 0); assert.deepEqual(calls, [])
  } finally { for (const restore of restores.reverse()) restore() }
})

checks.set(53, async () => {
  async function proveCoordination(base, alias, token) {
    const firstStarted = deferred(); const secondStarted = deferred(); const firstRelease = deferred(); const secondRelease = deferred()
    let calls = 0; let active = 0; let maxActive = 0
    const adapter = async () => {
      calls += 1; active += 1; maxActive = Math.max(maxActive, active)
      const current = calls
      if (current === 1) { firstStarted.resolve(); await firstRelease.promise } else { secondStarted.resolve(); await secondRelease.promise }
      active -= 1
      return receipt()
    }
    const runtimeA = createConnectorRuntime({ persistence: createConnectorPersistence({ root: base }), clock: () => now, trustedPolicy: { maxConcurrency: 1 }, trustedAdapters: { 'manual-reference-local': adapter } })
    const runtimeB = createConnectorRuntime({ persistence: createConnectorPersistence({ root: alias }), clock: () => now, trustedPolicy: { maxConcurrency: 1 }, trustedAdapters: { 'manual-reference-local': adapter } })
    const first = await runtimeA.prepareConnectorAttempt(rawFor(`project-alias-a-${token}`, `discovery-alias-a-${token}`))
    const second = await runtimeB.prepareConnectorAttempt(rawFor(`project-alias-b-${token}`, `discovery-alias-b-${token}`))
    const firstExecution = runtimeA.executePreparedAttempt(first.record.connectorAttemptId)
    await firstStarted.promise
    assert.deepEqual(await runtimeB.reconcileAttempts({ projectId: `project-alias-a-${token}` }), { items: [], remaining: 0 })
    const secondExecution = runtimeB.executePreparedAttempt(second.record.connectorAttemptId)
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(calls, 1)
    assert.equal(maxActive, 1)
    firstRelease.resolve()
    await firstExecution
    await secondStarted.promise
    assert.equal(maxActive, 1)
    secondRelease.resolve()
    await secondExecution
    assert.equal(calls, 2)
    assert.equal(maxActive, 1)
  }

  if (process.platform === 'win32') {
    const caseBase = path.join(root, 'root-case-alias-coordination')
    await proveCoordination(caseBase, caseBase.toLocaleUpperCase('en-US'), 'case')
  }

  const reservationBase = path.join(root, 'root-physical-reservation')
  const reservationAlias = path.join(root, 'root-physical-reservation-alias')
  await fs.promises.mkdir(reservationBase, { recursive: true })
  await fs.promises.symlink(reservationBase, reservationAlias, process.platform === 'win32' ? 'junction' : 'dir')
  const reservationA = createConnectorPersistence({ root: reservationBase })
  const reservationB = createConnectorPersistence({ root: reservationAlias })
  assert.equal(reservationA.authorityRoot, reservationB.authorityRoot)
  const reservationPolicy = { maxReservationsPerProject: 1, reservationCost: 1 }
  const reservationResults = await Promise.all([
    reservationA.createReservedAttempt(attempt(rawFor('project-physical-budget', 'discovery-physical-budget-a'), now), reservationPolicy),
    reservationB.createReservedAttempt(attempt(rawFor('project-physical-budget', 'discovery-physical-budget-b'), now), reservationPolicy),
  ])
  assert.deepEqual(reservationResults.map((item) => item.record.state).sort(), ['policy_blocked', 'prepared'])
  const reservedRecords = (await reservationA.listAllDetailed()).records
  assert.equal(reservedRecords.length, 2)
  assert.equal(reservedRecords.reduce((total, item) => total + item.budgetReservation.reserved, 0), 1)

  const physicalBase = path.join(root, 'root-physical-coordination')
  const physicalAlias = path.join(root, 'root-physical-coordination-alias')
  await fs.promises.mkdir(physicalBase, { recursive: true })
  await fs.promises.symlink(physicalBase, physicalAlias, process.platform === 'win32' ? 'junction' : 'dir')
  await proveCoordination(physicalBase, physicalAlias, 'physical')
})

checks.set(54, async () => {
  const base = path.join(root, 'targeted-reconcile-lock-window')
  const firstStore = createConnectorPersistence({ root: base })
  const secondStore = createConnectorPersistence({ root: base })
  const runtime = createConnectorRuntime({ persistence: firstStore, clock: () => now })
  const concurrent = createConnectorRuntime({ persistence: secondStore, clock: () => now })
  const firstPrepared = (await runtime.prepareConnectorAttempt(rawFor('targeted-lock-project', 'discovery-targeted-lock-a'))).record
  const secondPrepared = (await runtime.prepareConnectorAttempt(rawFor('targeted-lock-project', 'discovery-targeted-lock-b'))).record
  const circuitOptions = { now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 }
  const first = (await firstStore.claimExecution(firstPrepared.connectorAttemptId, { ...circuitOptions, expectedRevision: firstPrepared.revision })).record
  const second = (await firstStore.claimExecution(secondPrepared.connectorAttemptId, { ...circuitOptions, expectedRevision: secondPrepared.revision })).record
  const descriptor = (record) => ({ connectorAttemptId: record.connectorAttemptId, revision: record.revision, state: record.state, deliveryId: record.delivery?.deliveryId || null })
  const attemptTargets = new Set([first, second].map((record) => path.resolve(base, `${record.connectorAttemptId}.json`)))
  const renameStarted = deferred()
  const releaseRename = deferred()
  const originalRename = fs.promises.rename
  let intercepted = false
  let reconciliation
  try {
    fs.promises.rename = async function guardedRename(source, target) {
      if (!intercepted && attemptTargets.has(path.resolve(target))) {
        intercepted = true
        renameStarted.resolve()
        await releaseRename.promise
      }
      return Reflect.apply(originalRename, this, [source, target])
    }
    reconciliation = runtime.reconcileAttempts({ projectId: 'targeted-lock-project', limit: 2, candidates: [descriptor(first), descriptor(second)] })
    await renameStarted.promise
    let cancellationSettled = false
    const cancellation = concurrent.cancelAttempt(second.connectorAttemptId).then((value) => { cancellationSettled = true; return value })
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(cancellationSettled, false)
    releaseRename.resolve()
    const [result, cancelled] = await Promise.all([reconciliation, cancellation])
    assert.deepEqual(result.results.map((item) => item.status), ['reconciled', 'reconciled'])
    assert.equal(result.items.length, 2)
    assert.equal(cancelled.state, 'failed_transient')
    assert.equal((await firstStore.read(first.connectorAttemptId)).state, 'failed_transient')
    assert.equal((await firstStore.read(second.connectorAttemptId)).state, 'failed_transient')
  } finally {
    releaseRename.resolve()
    fs.promises.rename = originalRename
    if (reconciliation) await reconciliation.catch(() => {})
  }

  const missingRecord = attempt(rawFor('targeted-lock-project', 'discovery-targeted-lock-missing'), now)
  const missingSnapshot = { connectorAttemptId: missingRecord.connectorAttemptId, revision: null, state: null, deliveryId: null, deliveryState: null, fingerprint: null }
  const snapshotEntered = deferred()
  const releaseSnapshot = deferred()
  const heldSnapshot = firstStore.withExactAttemptSnapshots('targeted-lock-project', [missingSnapshot], async (captured) => {
    assert.deepEqual(captured, [{ connectorAttemptId: missingRecord.connectorAttemptId, record: null }])
    snapshotEntered.resolve()
    await releaseSnapshot.promise
  })
  await snapshotEntered.promise
  let creationSettled = false
  const creation = secondStore.createReservedAttempt(missingRecord, { maxReservationsPerProject: 8, reservationCost: 1 }).then((value) => { creationSettled = true; return value })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(creationSettled, false)
  releaseSnapshot.resolve()
  await heldSnapshot
  assert.equal((await creation).record.connectorAttemptId, missingRecord.connectorAttemptId)
  assert.equal(creationSettled, true)

  const lineageBase = path.join(root, 'retry-clock-regression')
  const lineageStore = createConnectorPersistence({ root: lineageBase })
  let lineageClock = '2026-08-25T13:00:00.000Z'
  const lineageRuntime = createConnectorRuntime({ persistence: lineageStore, clock: () => lineageClock, trustedAdapters: { 'manual-reference-local': () => { throw new Error('controlled transient failure') } } })
  const lineagePrepared = await lineageRuntime.prepareConnectorAttempt(rawFor('retry-clock-project', 'discovery-retry-clock'))
  const lineageFailed = await lineageRuntime.executePreparedAttempt(lineagePrepared.record.connectorAttemptId)
  assert.equal(lineageFailed.state, 'failed_transient')
  const lineageBefore = await treeText(lineageBase)
  lineageClock = '2026-08-25T12:59:59.000Z'
  await rejectsCode(() => lineageRuntime.retryAttempt(lineagePrepared.record.connectorAttemptId), 'INVALID_ATTEMPT')
  assert.equal(await treeText(lineageBase), lineageBefore)
  assert.equal((await lineageStore.listAllDetailed()).records.length, 1)
})

const completed = []
try {
  const expected = Array.from({ length: 54 }, (_, index) => index + 1)
  assert.equal(names.length, 54)
  assert.equal(checks.size, 54)
  assert.deepEqual([...checks.keys()].sort((a, b) => a - b), expected)
  for (const number of expected) {
    try { await checks.get(number)(); completed.push(number) } catch (error) { console.error(`FAIL jefe-research-connector-runtime-smoke caso ${number}: ${names[number - 1]}`); throw error }
  }
  assert.deepEqual(completed, expected)
  console.log(`PASS jefe-research-connector-runtime-smoke: casos ${completed.length}/54`)
  console.log('SMOKE_STRUCTURE=54/54')
  console.log('BEHAVIORAL_CASES_COMPLETE=54/54')
  console.log('BEHAVIORAL_CASES_REAL=1-54')
} finally { await fs.promises.rm(root, { recursive: true, force: true }) }
