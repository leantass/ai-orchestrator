import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { canonical } = require('../electron/jefe-context-package-contract.cjs')
const { budget } = require('../electron/jefe-research-provider-policy.cjs')
const { TYPES, listProviders } = require('../electron/jefe-research-provider-registry.cjs')
const { CONNECTORS, connector } = require('../electron/jefe-research-connector-contract.cjs')
const { createConnectorPersistence } = require('../electron/jefe-research-connector-persistence.cjs')
const { createConnectorRuntime } = require('../electron/jefe-research-connector-runtime.cjs')
const {
  validateConnectorInput,
  structuredAnalysisCandidate,
  createStructuredAnalysisConnector,
} = require('../electron/jefe-research-structured-analysis-connector.cjs')
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')
const { createDiscoveryPersistence } = require('../electron/jefe-discovery-persistence.cjs')
const { createSupervisedDiscovery } = require('../electron/jefe-discovery-orchestrator.cjs')
const { createAgentContextService } = require('../electron/jefe-agent-context-service.cjs')
const { createSupervisedResearchPersistence } = require('../electron/jefe-supervised-research-persistence.cjs')
const { createEvidenceCasePersistence } = require('../electron/jefe-supervised-research-evidence-case-persistence.cjs')
const { createSupervisedResearch } = require('../electron/jefe-supervised-research-orchestrator.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-structured-connector-'))
const now = '2026-08-25T00:00:00.000Z'
const names = [
  'catalogo siete de siete congelado',
  'estados honestos',
  'input cerrado y congelado',
  'input durable rehidratado',
  'descriptor productivo exacto',
  'candidate deterministico',
  'hash bytes y JSON exactos',
  'presupuesto minimo acotado',
  'input hostil rechazado',
  'candidate sin autoridad ni red',
  'runtime partial durable',
  'receipt controlled adapter',
  'corroboracion pendiente sin MEMORIA',
  'replay sin reejecucion',
  'reapertura idempotente',
  'descriptor forjado rechazado',
  'output productivo adulterado rechazado',
  'manual reference no ejecutada',
  'providers externos nunca ejecutados',
  'concurrencia mismo intento',
  'aislamiento A B',
  'corrupcion aislada',
  'matriz negativa de capacidades',
  'fixture distinguida del connector productivo',
]
const checks = new Map()

function digest(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

async function rejectsCode(run, expected) {
  await assert.rejects(run, (error) => {
    assert.equal(error?.code, expected)
    return true
  })
}

function throwsCode(run, expected) {
  assert.throws(run, (error) => {
    assert.equal(error?.code, expected)
    return true
  })
}

function bridgeFor(research, counters = { contexts: 0, inputs: 0, receives: 0 }) {
  return Object.freeze({
    getContributionContext(researchRequestId) {
      counters.contexts += 1
      return research.getContributionContext(researchRequestId)
    },
    getConnectorInput(researchRequestId) {
      counters.inputs += 1
      return research.getConnectorInput(researchRequestId)
    },
    async receiveContribution(input) {
      counters.receives += 1
      return research.receiveContribution(input)
    },
  })
}

async function createEnvironment(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/gu, '-').slice(0, 40)
  const base = path.join(root, slug)
  await fs.promises.mkdir(base, { recursive: true })
  const identity = { projectId: `project-${slug}`, runId: `run-${slug}`, versionId: `version-${slug}` }
  const memory = createContextMemory({ root: path.join(base, 'context'), allowedRoots: [base], clock: () => now })
  for (const [id, type] of [['objective', 'objective'], ['requirement', 'requirement'], ['constraint', 'constraint'], ['validation', 'validation']]) {
    await memory.append({ entryId: `${slug}-${id}`, scope: 'version', identity, type, summary: id, actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: now, references: [], relations: [], metadata: {} })
  }
  const snapshot = await memory.getSnapshot()
  const contextService = createAgentContextService({ readMemory: async () => ({ snapshot, syncStatus: { status: 'synced' } }) })
  const discovery = createSupervisedDiscovery({ persistence: createDiscoveryPersistence({ root: path.join(base, 'intakes') }), memory, contextService, clock: () => now })
  const created = await discovery.createIntake({
    objective: `Validar evidencia local ${slug}`,
    expectedOutcome: 'Distinguir analisis local de evidencia externa',
    audience: 'Equipo',
    problem: 'Identificar preguntas pendientes',
    scope: 'Investigacion supervisada',
    constraints: ['Sin red'],
    questions: ['Que evidencia independiente falta'],
    assumptions: ['El analisis local no verifica fuentes'],
    risks: ['Corroboracion pendiente'],
    priority: 'normal',
    responsible: 'lean',
    projectType: 'commercial_site',
    platform: 'web',
    identity,
  })
  const researchRoot = path.join(base, 'research')
  const evidenceCaseRoot = path.join(base, 'evidence-cases')
  const connectorRoot = path.join(base, 'connectors')
  const researchMemory = {
    calls: [],
    async append(input) {
      this.calls.push(JSON.parse(JSON.stringify(input)))
      return memory.append(input)
    },
  }
  const trusted = {
    networkEnabled: false,
    providers: {
      manual_reference: { state: 'available' },
      structured_analysis: { state: 'available' },
      metasearch: { state: 'not_connected' },
      automated_browser: { state: 'disabled' },
      crawler: { state: 'not_connected' },
      local_model: { state: 'not_configured' },
      corroboration: { state: 'restricted' },
    },
  }
  const createResearch = () => createSupervisedResearch({
    memory: researchMemory,
    persistence: createSupervisedResearchPersistence({ root: researchRoot }),
    evidenceCasePersistence: createEvidenceCasePersistence({ root: evidenceCaseRoot }),
    clock: () => now,
    trusted,
  })
  const research = createResearch()
  const planned = await research.plan({ intake: created.intake, packages: created.packages, providerType: 'structured_analysis', budget: { maxQueries: 2, maxSources: 4 } })
  return { base, identity, memory, researchMemory, researchRoot, evidenceCaseRoot, connectorRoot, createResearch, research, planned }
}

async function connectorAttemptInput(research, request) {
  const context = await research.getContributionContext(request.researchRequestId)
  return {
    researchSessionId: context.researchSessionId,
    researchRequestId: context.researchRequestId,
    discoveryId: context.discoveryId,
    projectId: context.projectId,
    providerType: context.providerType,
    operation: context.providerType === 'structured_analysis' ? 'analyze' : 'reference',
  }
}

function runtimeFor(environment, { research = environment.research, adapter = createStructuredAnalysisConnector(), counters = { contexts: 0, inputs: 0, receives: 0 }, connectorRoot = environment.connectorRoot } = {}) {
  const persistence = createConnectorPersistence({ root: connectorRoot })
  const runtime = createConnectorRuntime({
    persistence,
    clock: () => now,
    trustedAdapters: { 'structured-analysis-local': adapter },
    trustedResearch: bridgeFor(research, counters),
  })
  return { runtime, persistence, counters }
}

let primaryPromise
let primaryExecutionPromise
async function primary() {
  primaryPromise ||= createEnvironment('primary')
  return primaryPromise
}

async function primaryExecution() {
  if (!primaryExecutionPromise) {
    primaryExecutionPromise = (async () => {
      const environment = await primary()
      const integration = runtimeFor(environment)
      const prepared = await integration.runtime.prepareConnectorAttempt(await connectorAttemptInput(environment.research, environment.planned.scout))
      const result = await integration.runtime.executePreparedAttempt(prepared.record.connectorAttemptId)
      return { environment, ...integration, prepared, result }
    })()
  }
  return primaryExecutionPromise
}

checks.set(1, async () => {
  assert.equal(Object.keys(CONNECTORS).length, 7)
  assert.equal(listProviders().length, 7)
  assert.deepEqual(Object.keys(CONNECTORS).sort(), Object.keys(TYPES).sort())
  assert.equal(Object.isFrozen(CONNECTORS), true)
  assert.equal(Object.isFrozen(TYPES), true)
  for (const provider of Object.keys(TYPES)) {
    assert.equal(Object.isFrozen(TYPES[provider]), true)
    assert.equal(Object.isFrozen(TYPES[provider].capabilities), true)
    assert.equal(Object.isFrozen(CONNECTORS[provider].supportedOperations), true)
  }
})

checks.set(2, async () => {
  assert.deepEqual(Object.fromEntries(Object.keys(CONNECTORS).sort().map((provider) => [provider, connector(provider).status])), {
    automated_browser: 'disabled',
    corroboration: 'restricted',
    crawler: 'not_connected',
    local_model: 'not_configured',
    manual_reference: 'ready',
    metasearch: 'not_connected',
    structured_analysis: 'ready',
  })
  assert.equal(connector('structured_analysis').networkRequirement, false)
  assert.equal(connector('structured_analysis').credentialRequirement, false)
  assert.deepEqual(connector('manual_reference').capabilities, ['reference_only'])
})

checks.set(3, async () => {
  const environment = await primary()
  const input = await environment.research.getConnectorInput(environment.planned.scout.researchRequestId)
  assert.deepEqual(Object.keys(input).sort(), ['budget', 'needsCorroboration', 'objective', 'providerType', 'questions', 'researchRequestId', 'schemaVersion'])
  assert.equal(input.schemaVersion, 'jefe-research-connector-input/v1')
  assert.equal(input.providerType, 'structured_analysis')
  assert.equal(Object.isFrozen(input), true)
  assert.equal(Object.isFrozen(input.questions), true)
  assert.equal(Object.isFrozen(input.budget), true)
  assert.equal(Object.hasOwn(input, 'authority'), false)
  assert.equal(Object.hasOwn(input, 'references'), false)
  assert.deepEqual(validateConnectorInput(input), input)
})

checks.set(4, async () => {
  const environment = await primary()
  const original = await environment.research.getConnectorInput(environment.planned.scout.researchRequestId)
  const fresh = environment.createResearch()
  const reopened = await fresh.getConnectorInput(environment.planned.scout.researchRequestId)
  assert.equal(canonical(reopened), canonical(original))
  assert.equal(Object.isFrozen(reopened), true)
  assert.equal(Object.isFrozen(reopened.questions), true)
})

checks.set(5, async () => {
  const descriptor = createStructuredAnalysisConnector()
  assert.deepEqual(Object.keys(descriptor).sort(), ['execute', 'kind'])
  assert.equal(descriptor.kind, 'controlled_local')
  assert.equal(typeof descriptor.execute, 'function')
  assert.equal(Object.isFrozen(descriptor), true)
  assert.equal(Object.isFrozen(descriptor.execute), true)
  throwsCode(() => createStructuredAnalysisConnector({ getConnectorInput() {} }), 'INVALID_STRUCTURED_ANALYSIS_CONNECTOR')
})

checks.set(6, async () => {
  const environment = await primary()
  const input = await environment.research.getConnectorInput(environment.planned.scout.researchRequestId)
  const first = structuredAnalysisCandidate(input)
  const second = structuredAnalysisCandidate(JSON.parse(JSON.stringify(input)))
  assert.equal(canonical(first), canonical(second))
  assert.equal(first.status, 'partial')
  assert.equal(first.claim, input.objective)
})

checks.set(7, async () => {
  const environment = await primary()
  const candidate = structuredAnalysisCandidate(await environment.research.getConnectorInput(environment.planned.scout.researchRequestId))
  assert.doesNotThrow(() => JSON.parse(candidate.excerpt))
  assert.equal(candidate.bytes, Buffer.byteLength(candidate.excerpt, 'utf8'))
  assert.equal(candidate.contentHash, digest(candidate.excerpt))
  assert.deepEqual(candidate.codes, ['PARTIAL_RESULT'])
})

checks.set(8, async () => {
  const environment = await primary()
  const input = await environment.research.getConnectorInput(environment.planned.scout.researchRequestId)
  const tiny = structuredAnalysisCandidate({ ...input, budget: budget({ maxBytesPerReceipt: 1, maxTotalBytes: 1 }) })
  assert.equal(tiny.bytes, 1)
  assert.equal(tiny.consumed.bytes, 1)
  assert.equal(tiny.excerpt, '0')
  assert.equal(JSON.parse(tiny.excerpt), 0)
})

checks.set(9, async () => {
  const environment = await primary()
  const input = await environment.research.getConnectorInput(environment.planned.scout.researchRequestId)
  throwsCode(() => validateConnectorInput({ ...input, authority: 'human_decision' }), 'INVALID_STRUCTURED_ANALYSIS_INPUT')
  throwsCode(() => validateConnectorInput({ ...input, objective: 'Consultar https://source.test/a' }), 'INVALID_STRUCTURED_ANALYSIS_INPUT')
  throwsCode(() => validateConnectorInput({ ...input, objective: 'Leer C:/private/source.txt' }), 'INVALID_STRUCTURED_ANALYSIS_INPUT')
  throwsCode(() => validateConnectorInput({ ...input, providerType: 'metasearch' }), 'INVALID_STRUCTURED_ANALYSIS_INPUT')
})

checks.set(10, async () => {
  const environment = await primary()
  const input = await environment.research.getConnectorInput(environment.planned.scout.researchRequestId)
  const candidate = structuredAnalysisCandidate(input)
  for (const forbidden of ['url', 'authority', 'actor', 'path', 'providerType', 'method']) assert.equal(Object.hasOwn(candidate, forbidden), false)
  assert.deepEqual(candidate.redirects, [])
  assert.equal(candidate.consumed.queries, 0)
  assert.equal(candidate.consumed.sources, 0)
  assert.ok(candidate.consumed.bytes <= input.budget.maxTotalBytes)
  assert.equal(Object.isFrozen(candidate), true)
  assert.equal(Object.isFrozen(candidate.consumed), true)
})

checks.set(11, async () => {
  const execution = await primaryExecution()
  const saved = await execution.persistence.read(execution.prepared.record.connectorAttemptId)
  assert.equal(execution.result.state, 'partial')
  assert.equal(saved.state, 'partial')
  assert.equal(saved.receipt.status, 'partial')
  assert.equal(saved.research.state, 'needs_corroboration')
})

checks.set(12, async () => {
  const execution = await primaryExecution()
  const store = createEvidenceCasePersistence({ root: execution.environment.evidenceCaseRoot })
  const evidenceCase = await store.read(execution.environment.planned.evidenceCaseId)
  assert.equal(evidenceCase.receipts.length, 1)
  assert.equal(evidenceCase.receipts[0].method, 'controlled_adapter')
  assert.equal(evidenceCase.receipts[0].url, undefined)
})

checks.set(13, async () => {
  const execution = await primaryExecution()
  const evidenceCase = await createEvidenceCasePersistence({ root: execution.environment.evidenceCaseRoot }).read(execution.environment.planned.evidenceCaseId)
  assert.equal(execution.result.research.state, 'needs_corroboration')
  assert.equal(evidenceCase.state, 'needs_corroboration')
  assert.equal(evidenceCase.memory.status, 'not_applicable')
  assert.equal(execution.environment.researchMemory.calls.length, 0)
  assert.equal((await execution.environment.memory.getSnapshot()).history.filter((entry) => entry.type === 'evidence').length, 0)
})

checks.set(14, async () => {
  const execution = await primaryExecution()
  const target = path.join(execution.environment.connectorRoot, `${execution.prepared.record.connectorAttemptId}.json`)
  const before = await fs.promises.readFile(target, 'utf8')
  const receives = execution.counters.receives
  const replay = await execution.runtime.executePreparedAttempt(execution.prepared.record.connectorAttemptId)
  assert.equal(replay.state, 'partial')
  assert.equal(replay.idempotent, true)
  assert.equal(execution.counters.receives, receives)
  assert.equal(await fs.promises.readFile(target, 'utf8'), before)
})

checks.set(15, async () => {
  const execution = await primaryExecution()
  const fresh = execution.environment.createResearch()
  const counters = { contexts: 0, inputs: 0, receives: 0 }
  const reopened = runtimeFor(execution.environment, { research: fresh, counters })
  const prepared = await reopened.runtime.prepareConnectorAttempt(await connectorAttemptInput(fresh, execution.environment.planned.scout))
  const result = await reopened.runtime.executePreparedAttempt(prepared.record.connectorAttemptId)
  assert.equal(prepared.idempotent, true)
  assert.equal(result.state, 'partial')
  assert.equal(result.idempotent, true)
  assert.equal(counters.receives, 0)
})

checks.set(16, async () => {
  const persistence = createConnectorPersistence({ root: path.join(root, 'forged-descriptor') })
  const forged = { kind: 'controlled_local', execute() {}, authority: 'human_decision' }
  throwsCode(() => createConnectorRuntime({ persistence, trustedAdapters: { 'structured-analysis-local': forged } }), 'INVALID_ADAPTERS')
  throwsCode(() => createConnectorRuntime({ persistence, trustedAdapters: { 'manual-reference-local': createStructuredAnalysisConnector() } }), 'INVALID_ADAPTERS')
})

checks.set(17, async () => {
  const environment = await createEnvironment('tampered-output')
  const product = createStructuredAnalysisConnector()
  const adapter = Object.freeze({
    kind: 'controlled_local',
    async execute(input) {
      const result = await product.execute(input)
      return { candidate: { ...result.candidate, claim: 'Claim adulterado' } }
    },
  })
  const integration = runtimeFor(environment, { adapter })
  const prepared = await integration.runtime.prepareConnectorAttempt(await connectorAttemptInput(environment.research, environment.planned.scout))
  const result = await integration.runtime.executePreparedAttempt(prepared.record.connectorAttemptId)
  const saved = await integration.persistence.read(prepared.record.connectorAttemptId)
  assert.equal(result.state, 'failed_permanent')
  assert.equal(saved.errorCode, 'INVALID_CONNECTOR_CANDIDATE')
  assert.equal(integration.counters.receives, 0)
  assert.equal(environment.researchMemory.calls.length, 0)
})

checks.set(18, async () => {
  const environment = await primary()
  const counters = { contexts: 0, inputs: 0, receives: 0 }
  const base = path.join(environment.base, 'manual-connectors')
  const persistence = createConnectorPersistence({ root: base })
  const runtime = createConnectorRuntime({ persistence, clock: () => now, trustedResearch: bridgeFor(environment.research, counters) })
  const prepared = await runtime.prepareConnectorAttempt(await connectorAttemptInput(environment.research, environment.planned.radar))
  const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId)
  assert.equal(result.state, 'not_executed')
  assert.equal(result.referenceOnly, true)
  assert.equal((await persistence.read(prepared.record.connectorAttemptId)).receipt.status, 'not_executed')
  assert.equal(counters.inputs, 0)
  assert.equal(counters.receives, 0)
})

checks.set(19, async () => {
  const calls = []
  const persistence = createConnectorPersistence({ root: path.join(root, 'external-disabled') })
  const adapters = Object.fromEntries(['metasearch-not-connected', 'automated-browser-disabled', 'crawler-not-connected', 'local-model-not-configured', 'corroboration-gate-owned'].map((id) => [id, () => { calls.push(id); return { state: 'not_executed' } }]))
  const runtime = createConnectorRuntime({ persistence, clock: () => now, trustedAdapters: adapters })
  const matrix = [
    ['metasearch', 'search', 'not_connected'],
    ['automated_browser', 'browse', 'policy_blocked'],
    ['crawler', 'extract', 'not_connected'],
    ['local_model', 'analyze', 'not_connected'],
    ['corroboration', 'corroborate', 'policy_blocked'],
  ]
  for (const [index, [providerType, operation, expected]] of matrix.entries()) {
    const prepared = await runtime.prepareConnectorAttempt({ researchSessionId: `research-session-external-${index}`, researchRequestId: `research-external-${index}`, discoveryId: `discovery-external-${index}`, projectId: 'project-external', providerType, operation })
    assert.equal((await runtime.executePreparedAttempt(prepared.record.connectorAttemptId)).state, expected)
  }
  assert.deepEqual(calls, [])
})

checks.set(20, async () => {
  const environment = await createEnvironment('concurrent')
  const integration = runtimeFor(environment)
  const prepared = await integration.runtime.prepareConnectorAttempt(await connectorAttemptInput(environment.research, environment.planned.scout))
  const results = await Promise.all([
    integration.runtime.executePreparedAttempt(prepared.record.connectorAttemptId),
    integration.runtime.executePreparedAttempt(prepared.record.connectorAttemptId),
  ])
  assert.deepEqual(results.map((item) => item.state), ['partial', 'partial'])
  assert.equal(integration.counters.receives, 1)
  assert.equal((await createEvidenceCasePersistence({ root: environment.evidenceCaseRoot }).read(environment.planned.evidenceCaseId)).receipts.length, 1)
})

checks.set(21, async () => {
  const [a, b] = await Promise.all([createEnvironment('isolation-a'), createEnvironment('isolation-b')])
  const one = runtimeFor(a)
  const two = runtimeFor(b)
  const [preparedA, preparedB] = await Promise.all([
    one.runtime.prepareConnectorAttempt(await connectorAttemptInput(a.research, a.planned.scout)),
    two.runtime.prepareConnectorAttempt(await connectorAttemptInput(b.research, b.planned.scout)),
  ])
  const [resultA, resultB] = await Promise.all([one.runtime.executePreparedAttempt(preparedA.record.connectorAttemptId), two.runtime.executePreparedAttempt(preparedB.record.connectorAttemptId)])
  assert.equal(resultA.state, 'partial')
  assert.equal(resultB.state, 'partial')
  assert.notEqual(resultA.attempt, resultB.attempt)
  const [caseA, caseB] = await Promise.all([createEvidenceCasePersistence({ root: a.evidenceCaseRoot }).read(a.planned.evidenceCaseId), createEvidenceCasePersistence({ root: b.evidenceCaseRoot }).read(b.planned.evidenceCaseId)])
  assert.equal(caseA.projectId, a.identity.projectId)
  assert.equal(caseB.projectId, b.identity.projectId)
  assert.notEqual(caseA.receipts[0].receiptId, caseB.receipts[0].receiptId)
})

checks.set(22, async () => {
  const base = path.join(root, 'corruption')
  const persistence = createConnectorPersistence({ root: base })
  const runtime = createConnectorRuntime({ persistence, clock: () => now })
  const prepared = await runtime.prepareConnectorAttempt({ researchSessionId: 'research-session-corruption', researchRequestId: 'research-corruption', discoveryId: 'discovery-corruption', projectId: 'project-corruption', providerType: 'structured_analysis', operation: 'analyze' })
  await fs.promises.writeFile(path.join(base, `${prepared.record.connectorAttemptId}.json`), '{corrupt', 'utf8')
  await rejectsCode(() => persistence.read(prepared.record.connectorAttemptId), 'CORRUPT_ATTEMPT')
  const detail = await persistence.listDetailed('project-corruption')
  assert.deepEqual(detail.records, [])
  assert.deepEqual(detail.corruptions, [{ connectorAttemptId: prepared.record.connectorAttemptId, code: 'CORRUPT_ATTEMPT' }])
})

checks.set(23, async () => {
  const environment = await createEnvironment('negative-capabilities')
  const integration = runtimeFor(environment)
  const http = require('node:http')
  const https = require('node:https')
  const net = require('node:net')
  const dns = require('node:dns')
  const childProcess = require('node:child_process')
  const Module = require('node:module')
  const calls = []
  const restores = []
  const trap = (name) => { calls.push(name); throw new Error(`forbidden capability: ${name}`) }
  const replace = (target, key, name) => {
    if (!target || typeof target[key] !== 'function') return
    const original = target[key]
    target[key] = (...args) => trap(name, ...args)
    restores.push(() => { target[key] = original })
  }
  for (const [target, entries] of [[http, ['request', 'get']], [https, ['request', 'get']], [net, ['connect', 'createConnection']], [dns, ['lookup', 'resolve', 'resolve4', 'resolve6']], [dns.promises, ['lookup', 'resolve', 'resolve4', 'resolve6']], [childProcess, ['exec', 'execFile', 'spawn', 'fork']]]) {
    for (const key of entries) replace(target, key, `${target === childProcess ? 'shell' : 'network'}:${key}`)
  }
  const fetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch')
  Object.defineProperty(globalThis, 'fetch', { configurable: true, writable: true, value: () => trap('fetch') })
  restores.push(() => { if (fetchDescriptor) Object.defineProperty(globalThis, 'fetch', fetchDescriptor); else delete globalThis.fetch })
  const webSocketDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket')
  Object.defineProperty(globalThis, 'WebSocket', { configurable: true, writable: true, value: function ForbiddenWebSocket() { trap('browser:websocket') } })
  restores.push(() => { if (webSocketDescriptor) Object.defineProperty(globalThis, 'WebSocket', webSocketDescriptor); else delete globalThis.WebSocket })
  const originalLoad = Module._load
  Module._load = function guardedLoad(request, ...args) {
    if (['electron', 'playwright', 'puppeteer'].includes(request)) trap(`browser:${request}`)
    return originalLoad.call(this, request, ...args)
  }
  restores.push(() => { Module._load = originalLoad })
  try {
    const prepared = await integration.runtime.prepareConnectorAttempt(await connectorAttemptInput(environment.research, environment.planned.scout))
    const result = await integration.runtime.executePreparedAttempt(prepared.record.connectorAttemptId)
    assert.equal(result.state, 'partial')
    assert.deepEqual(calls, [])
  } finally {
    for (const restore of restores.reverse()) restore()
  }
})

checks.set(24, async () => {
  const environment = await createEnvironment('fixture-method')
  const request = environment.planned.scout
  const input = await environment.research.getConnectorInput(request.researchRequestId)
  const fixture = () => ({ candidate: structuredAnalysisCandidate(input) })
  const counters = { contexts: 0, inputs: 0, receives: 0 }
  const persistence = createConnectorPersistence({ root: environment.connectorRoot })
  const runtime = createConnectorRuntime({ persistence, clock: () => now, trustedAdapters: { 'structured-analysis-local': fixture }, trustedResearch: bridgeFor(environment.research, counters) })
  const prepared = await runtime.prepareConnectorAttempt(await connectorAttemptInput(environment.research, request))
  const result = await runtime.executePreparedAttempt(prepared.record.connectorAttemptId)
  const evidenceCase = await createEvidenceCasePersistence({ root: environment.evidenceCaseRoot }).read(environment.planned.evidenceCaseId)
  assert.equal(result.state, 'partial')
  assert.equal(evidenceCase.receipts[0].method, 'injected_controlled_adapter')
  assert.notEqual(evidenceCase.receipts[0].method, 'controlled_adapter')
  assert.equal(counters.inputs, 0)
  assert.equal(counters.receives, 1)
})

const completed = []
try {
  const expected = Array.from({ length: 24 }, (_, index) => index + 1)
  assert.equal(names.length, expected.length)
  assert.equal(checks.size, expected.length)
  assert.deepEqual([...checks.keys()].sort((a, b) => a - b), expected)
  for (const number of expected) {
    try {
      await checks.get(number)()
      completed.push(number)
    } catch (error) {
      console.error(`FAIL jefe-research-structured-analysis-connector-smoke caso ${number}: ${names[number - 1]}`)
      throw error
    }
  }
  assert.deepEqual(completed, expected)
  console.log(`PASS jefe-research-structured-analysis-connector-smoke: ${completed.length}/${checks.size}`)
  console.log('STRUCTURED_CONNECTOR_SMOKE_STRUCTURE=24/24')
  console.log('STRUCTURED_CONNECTOR_BEHAVIORAL_CASES_COMPLETE=24/24')
  console.log('STRUCTURED_CONNECTOR_BEHAVIORAL_CASES_REAL=1-24')
  console.log('ESCALON_3C_B_SMOKE=24/24_PASS')
} finally {
  await fs.promises.rm(root, { recursive: true, force: true })
}
