import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const childProcess = require('node:child_process')
const http = require('node:http')
const https = require('node:https')
const { canonical } = require('../electron/jefe-context-package-contract.cjs')
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')
const { createAgentContextService } = require('../electron/jefe-agent-context-service.cjs')
const { createDiscoveryPersistence } = require('../electron/jefe-discovery-persistence.cjs')
const { createSupervisedDiscovery } = require('../electron/jefe-discovery-orchestrator.cjs')
const { budget } = require('../electron/jefe-research-provider-policy.cjs')
const { createSupervisedResearchPersistence } = require('../electron/jefe-supervised-research-persistence.cjs')
const { createEvidenceCasePersistence } = require('../electron/jefe-supervised-research-evidence-case-persistence.cjs')
const { createSupervisedResearch } = require('../electron/jefe-supervised-research-orchestrator.cjs')
const { createConnectorPersistence } = require('../electron/jefe-research-connector-persistence.cjs')
const { createConnectorRuntime } = require('../electron/jefe-research-connector-runtime.cjs')
const { createStructuredAnalysisConnector } = require('../electron/jefe-research-structured-analysis-connector.cjs')
const {
  ERROR_CODES,
  createExecutionFlow,
  deriveExecutionFlowId,
  executionFlowView,
  transitionExecutionFlow,
  validateExecutionFlow,
} = require('../electron/jefe-supervised-research-execution-contract.cjs')
const { createSupervisedResearchExecutionPersistence } = require('../electron/jefe-supervised-research-execution-persistence.cjs')
const { createSupervisedResearchExecution, routingFingerprint } = require('../electron/jefe-supervised-research-execution-orchestrator.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-supervised-execution-'))
const baseTime = Date.parse('2026-08-25T12:00:00.000Z')
const routeInput = Object.freeze({ providerType: 'structured_analysis', operation: 'analyze', budget: Object.freeze({ maxQueries: 2, maxSources: 4 }) })
const route = Object.freeze({ schemaVersion: 'jefe-supervised-research-routing/v1', executionRole: 'scout', providerType: 'structured_analysis', operation: 'analyze', budget: Object.freeze(budget(routeInput.budget)), references: Object.freeze([]) })
const routeHash = routingFingerprint(route)
const names = [
  'flow id deterministico por intake y routing',
  'identidad fisica exacta e inmutable',
  'registro cerrado sin campos laterales',
  'estado y pending operation inseparables',
  'grafo de transiciones cerrado',
  'package refs completas por rol e inmutables',
  'plan caso y requests durables append only',
  'attempt refs durables append only',
  'terminales realmente terminales',
  'create durable e idempotent replay',
  'CAS revision y stale rejection',
  'reapertura preserva bytes y contenido',
  'lock global por root y stages unicos',
  'listDetailed y listAll sin truncamiento interno',
  'corrupcion aislada de registros sanos',
  'indice reconstruible aun si estaba corrupto',
  'constructor y routing confiable cerrados',
  'caller no inyecta provider budget adapter ni reference',
  'intake ausente o no listo no crea autoridad',
  'discovery real preserva identidad fisica',
  'radar scout hermes conservan sus propios paquetes',
  'plan real correlaciona identity plan case y discovery',
  'seleccion confiable fija provider operation y budget',
  'prepare persiste sin ejecutar adapter ni generar receipt',
  'attempt preparado sobrevive restart previo a ejecucion',
  'ejecucion explicita usa connector structured local real',
  'partial local termina honestamente needs corroboration',
  'flow no duplica receipt evidencia claim ni MEMORIA',
  'replay terminal no reejecuta adapter ni delivery',
  'restart reabre por executionFlowId sin recomponer autoridad',
  'concurrencia sobre el mismo flow ejecuta una sola vez',
  'aislamiento completo entre proyectos A y B',
  'cancelacion preparada no ejecuta adapter',
  'reconcile recupera y proyecta human sin ejecutar adapter',
  'crash post receipt reanuda delivery sin repetir provider',
  'matriz negativa no usa red shell browser ni autoridad humana falsa',
]
const checks = new Map()
let clockTick = 0

function clock() {
  const value = new Date(baseTime + clockTick).toISOString()
  clockTick += 1
  return value
}

function hex(seed, length = 32) {
  return crypto.createHash('sha256').update(seed).digest('hex').slice(0, length)
}

function durableId(prefix, seed) {
  return `${prefix}-${hex(seed)}`
}

function intakeId(seed) {
  return durableId('intake', seed)
}

function identity(seed) {
  return { projectId: `project-${seed}`, runId: `run-${seed}`, versionId: `version-${seed}` }
}

function packageRefs(seed) {
  return Object.fromEntries(['radar', 'scout', 'hermes'].map((role) => [role, {
    packageId: durableId('context-package', `${seed}:${role}:package`),
    handoffId: durableId('agent-handoff', `${seed}:${role}:handoff`),
    consumerStatus: 'not_connected',
  }]))
}

function researchRefs(seed) {
  return ['radar', 'scout', 'hermes'].map((role) => ({ role, researchRequestId: durableId('research', `${seed}:${role}`) }))
}

function attemptRef(requests, seed) {
  return { researchRequestId: requests.find((item) => item.role === 'scout').researchRequestId, connectorAttemptId: durableId('connector-attempt', seed) }
}

function initialRecord(seed = 'contract') {
  return createExecutionFlow({ identity: identity(seed), intakeId: intakeId(seed), routingFingerprint: routeHash }, clock())
}

function preparedRecord(seed = 'contract-prepared') {
  const packages = packageRefs(seed)
  const requests = researchRefs(seed)
  const planId = durableId('research-plan', seed)
  const caseId = durableId('evidence-case', seed)
  let record = initialRecord(seed)
  record = transitionExecutionFlow(record, 'prepare_research', { packageRefs: packages, pendingOperations: ['prepare_research'] }, clock())
  record = transitionExecutionFlow(record, 'prepare_attempts', { researchPlanId: planId, evidenceCaseId: caseId, requestRefs: requests, pendingOperations: ['prepare_attempts'] }, clock())
  record = transitionExecutionFlow(record, 'ready_for_execution', { attemptRefs: [attemptRef(requests, seed)], pendingOperations: [] }, clock())
  return record
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

function providerTrust() {
  return {
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
}

async function createEnvironment(name, options = {}) {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/gu, '-').slice(0, 36)
  const base = path.join(root, slug)
  await fs.promises.mkdir(base, { recursive: true })
  const physicalIdentity = identity(slug)
  const memoryRoot = path.join(base, 'memory')
  const memory = createContextMemory({ root: memoryRoot, allowedRoots: [base], clock })
  for (const [entryId, type] of [['objective', 'objective'], ['requirement', 'requirement'], ['constraint', 'constraint'], ['validation', 'validation']]) {
    await memory.append({
      entryId: `${slug}-${entryId}`,
      scope: 'version',
      identity: physicalIdentity,
      type,
      summary: `${type} local verificable`,
      actor: 'system',
      authority: 'technical_result',
      provenance: 'physical_manifest_or_ledger',
      timestamp: clock(),
      references: [],
      relations: [],
      metadata: {},
    })
  }
  const contextService = createAgentContextService({
    readMemory: async () => ({ snapshot: await memory.getSnapshot(), syncStatus: { status: 'synced' } }),
  })
  const discoveryRoot = path.join(base, 'discovery')
  const discovery = createSupervisedDiscovery({ persistence: createDiscoveryPersistence({ root: discoveryRoot }), memory, contextService, clock })
  const created = await discovery.createIntake({
    objective: `Analizar localmente ${slug}`,
    expectedOutcome: 'Identificar preguntas pendientes y evidencia independiente necesaria',
    audience: 'Equipo tecnico',
    problem: 'Separar analisis local de corroboracion externa',
    scope: 'Investigacion supervisada',
    constraints: ['Sin acceso de red'],
    questions: ['Que evidencia independiente falta'],
    assumptions: ['El analisis local no verifica fuentes externas'],
    risks: ['Corroboracion pendiente'],
    priority: 'normal',
    responsible: 'lean',
    projectType: 'commercial_site',
    platform: 'web',
    identity: physicalIdentity,
  })
  const environment = {
    base,
    physicalIdentity,
    memory,
    discovery,
    discoveryRoot,
    intake: created.intake,
    discoveryPackages: created.packages,
    researchRoot: path.join(base, 'research'),
    evidenceRoot: path.join(base, 'evidence-cases'),
    connectorRoot: path.join(base, 'connectors'),
    flowRoot: path.join(base, 'execution-flows'),
    counters: { adapters: 0, contexts: 0, inputs: 0, receives: 0, evidenceAppends: 0 },
    throwAfterReceiveOnce: options.throwAfterReceiveOnce === true,
    receiveThrown: false,
    extraAdapters: options.extraAdapters || {},
  }
  return environment
}

function createServices(environment, overrides = {}) {
  const researchPersistence = createSupervisedResearchPersistence({ root: environment.researchRoot })
  const evidencePersistence = createEvidenceCasePersistence({ root: environment.evidenceRoot })
  const researchMemory = {
    async append(input) {
      if (input?.type === 'evidence') environment.counters.evidenceAppends += 1
      return environment.memory.append(input)
    },
  }
  const research = createSupervisedResearch({ memory: researchMemory, persistence: researchPersistence, evidenceCasePersistence: evidencePersistence, clock, trusted: providerTrust() })
  const descriptor = createStructuredAnalysisConnector()
  const countedDescriptor = Object.freeze({
    kind: 'controlled_local',
    async execute(input) {
      environment.counters.adapters += 1
      return descriptor.execute(input)
    },
  })
  const bridge = Object.freeze({
    getContributionContext(researchRequestId) {
      environment.counters.contexts += 1
      return research.getContributionContext(researchRequestId)
    },
    getConnectorInput(researchRequestId) {
      environment.counters.inputs += 1
      return research.getConnectorInput(researchRequestId)
    },
    async receiveContribution(input) {
      environment.counters.receives += 1
      const result = await research.receiveContribution(input)
      if (environment.throwAfterReceiveOnce && !environment.receiveThrown) {
        environment.receiveThrown = true
        const error = new Error('controlled post receipt crash')
        error.code = 'CONTROLLED_POST_RECEIPT_CRASH'
        throw error
      }
      return result
    },
  })
  const connectorPersistence = createConnectorPersistence({ root: environment.connectorRoot })
  const connectorRuntime = createConnectorRuntime({
    persistence: connectorPersistence,
    clock,
    trustedAdapters: { 'structured-analysis-local': countedDescriptor, ...environment.extraAdapters },
    trustedPolicy: { maxAttempts: 3 },
    trustedResearch: bridge,
  })
  const flowPersistence = createSupervisedResearchExecutionPersistence({ root: environment.flowRoot })
  const execution = createSupervisedResearchExecution({
    persistence: flowPersistence,
    discovery: environment.discovery,
    research: overrides.research || research,
    connectorRuntime,
    trustedRouting: routeInput,
    clock,
  })
  return { researchPersistence, evidencePersistence, research, connectorPersistence, connectorRuntime, flowPersistence, execution }
}

let primaryPromise
async function primary() {
  if (!primaryPromise) primaryPromise = createEnvironment('primary').then((environment) => ({ environment, services: createServices(environment) }))
  return primaryPromise
}

let primaryPreparedPromise
async function primaryPrepared() {
  if (!primaryPreparedPromise) {
    primaryPreparedPromise = primary().then(async ({ environment, services }) => {
      const flow = await services.execution.prepareFlow({ intakeId: environment.intake.intakeId })
      return { environment, services, flow, record: await services.flowPersistence.read(flow.executionFlowId) }
    })
  }
  return primaryPreparedPromise
}

let primaryExecutedPromise
async function primaryExecuted() {
  if (!primaryExecutedPromise) {
    primaryExecutedPromise = primaryPrepared().then(async (value) => {
      const result = await value.services.execution.executeNext({ executionFlowId: value.flow.executionFlowId })
      return { ...value, result, terminalRecord: await value.services.flowPersistence.read(value.flow.executionFlowId) }
    })
  }
  return primaryExecutedPromise
}

checks.set(1, async () => {
  const idA = deriveExecutionFlowId({ intakeId: intakeId('same'), routingFingerprint: routeHash })
  const idB = deriveExecutionFlowId({ routingFingerprint: routeHash, intakeId: intakeId('same') })
  const other = deriveExecutionFlowId({ intakeId: intakeId('same'), routingFingerprint: 'f'.repeat(64) })
  assert.equal(idA, idB)
  assert.notEqual(idA, other)
  assert.match(idA, /^research-execution-[a-f0-9]{32}$/u)
})

checks.set(2, async () => {
  const record = initialRecord('identity')
  assert.deepEqual(record.identity, identity('identity'))
  assert.equal(Object.isFrozen(record.identity), true)
  throwsCode(() => validateExecutionFlow({ ...record, identity: { projectId: record.identity.projectId, runId: record.identity.runId } }), 'INVALID_EXECUTION_IDENTITY')
  throwsCode(() => transitionExecutionFlow(record, 'prepare_research', { identity: identity('forged') }, clock()), 'INVALID_EXECUTION_TRANSITION')
})

checks.set(3, async () => {
  const record = initialRecord('closed-record')
  throwsCode(() => validateExecutionFlow({ ...record, receipt: { status: 'received' } }), 'INVALID_EXECUTION_FLOW')
  throwsCode(() => validateExecutionFlow({ ...record, authority: 'human_decision' }), 'INVALID_EXECUTION_FLOW')
})

checks.set(4, async () => {
  const record = initialRecord('pending')
  throwsCode(() => validateExecutionFlow({ ...record, pendingOperations: [] }), 'INVALID_PENDING_OPERATIONS')
  const next = transitionExecutionFlow(record, 'prepare_research', { packageRefs: packageRefs('pending'), pendingOperations: ['prepare_research'] }, clock())
  assert.deepEqual(next.pendingOperations, ['prepare_research'])
})

checks.set(5, async () => {
  const record = initialRecord('graph')
  throwsCode(() => transitionExecutionFlow(record, 'explicit_execution', { pendingOperations: ['explicit_execution'] }, clock()), 'INVALID_EXECUTION_TRANSITION')
  assert.equal(ERROR_CODES.includes('CORRUPT_DEPENDENCY'), true)
  assert.equal(ERROR_CODES.includes('arbitrary'), false)
})

checks.set(6, async () => {
  const refs = packageRefs('packages')
  const next = transitionExecutionFlow(initialRecord('packages'), 'prepare_research', { packageRefs: refs, pendingOperations: ['prepare_research'] }, clock())
  assert.deepEqual(Object.keys(next.packageRefs).sort(), ['hermes', 'radar', 'scout'])
  for (const ref of Object.values(next.packageRefs)) assert.deepEqual(Object.keys(ref).sort(), ['consumerStatus', 'handoffId', 'packageId'])
  const changed = structuredClone(refs)
  changed.scout.handoffId = durableId('agent-handoff', 'changed')
  throwsCode(() => transitionExecutionFlow(next, 'blocked', { packageRefs: changed, pendingOperations: [], lastErrorCode: 'CORRUPT_DEPENDENCY' }, clock()), 'IMMUTABLE_PACKAGE_REFS')
})

checks.set(7, async () => {
  const seed = 'requests'
  const refs = researchRefs(seed)
  let record = transitionExecutionFlow(initialRecord(seed), 'prepare_research', { packageRefs: packageRefs(seed), pendingOperations: ['prepare_research'] }, clock())
  record = transitionExecutionFlow(record, 'prepare_attempts', { researchPlanId: durableId('research-plan', seed), evidenceCaseId: durableId('evidence-case', seed), requestRefs: refs, pendingOperations: ['prepare_attempts'] }, clock())
  const forged = structuredClone(refs)
  forged[0].researchRequestId = durableId('research', 'forged-request')
  throwsCode(() => transitionExecutionFlow(record, 'blocked', { requestRefs: forged, pendingOperations: [], lastErrorCode: 'CORRUPT_DEPENDENCY' }, clock()), 'IMMUTABLE_EXECUTION_REF')
  throwsCode(() => validateExecutionFlow({ ...record, evidenceCaseId: null }), 'INVALID_RESEARCH_REFS')
})

checks.set(8, async () => {
  let record = preparedRecord('attempts')
  record = transitionExecutionFlow(record, 'prepare_attempts', { pendingOperations: ['prepare_attempts'] }, clock())
  const second = attemptRef(record.requestRefs, 'attempts-second')
  record = transitionExecutionFlow(record, 'ready_for_execution', { attemptRefs: [...record.attemptRefs, second], pendingOperations: [] }, clock())
  throwsCode(() => transitionExecutionFlow(record, 'explicit_execution', { attemptRefs: [second], pendingOperations: ['explicit_execution'] }, clock()), 'IMMUTABLE_EXECUTION_REF')
})

checks.set(9, async () => {
  const record = transitionExecutionFlow(preparedRecord('terminal'), 'blocked', { pendingOperations: [], lastErrorCode: 'CANCELLED' }, clock())
  throwsCode(() => transitionExecutionFlow(record, 'sync_state', { pendingOperations: ['sync_state'] }, clock()), 'INVALID_EXECUTION_TRANSITION')
  assert.equal(executionFlowView(record).state, 'blocked')
})

checks.set(10, async () => {
  const store = createSupervisedResearchExecutionPersistence({ root: path.join(root, 'persistence-create') })
  const record = initialRecord('persistence-create')
  assert.equal((await store.create(record)).idempotent, false)
  const replay = await store.create(structuredClone(record))
  assert.equal(replay.idempotent, true)
  assert.deepEqual(replay.record, record)
})

checks.set(11, async () => {
  const store = createSupervisedResearchExecutionPersistence({ root: path.join(root, 'persistence-cas') })
  const record = (await store.create(initialRecord('persistence-cas'))).record
  const spec = { expectedStates: ['prepare_context'], expectedRevision: 0, nextState: 'prepare_research', patch: { packageRefs: packageRefs('persistence-cas'), pendingOperations: ['prepare_research'] }, updatedAt: clock() }
  const next = await store.compareAndSet(record.executionFlowId, spec)
  assert.equal(next.record.revision, 1)
  await rejectsCode(() => store.compareAndSet(record.executionFlowId, spec), 'STALE_EXECUTION_FLOW')
})

checks.set(12, async () => {
  const storeRoot = path.join(root, 'persistence-reopen')
  const store = createSupervisedResearchExecutionPersistence({ root: storeRoot })
  const record = initialRecord('persistence-reopen')
  await store.create(record)
  const file = path.join(storeRoot, `${record.executionFlowId}.json`)
  const before = await fs.promises.readFile(file, 'utf8')
  const reopened = await createSupervisedResearchExecutionPersistence({ root: storeRoot }).read(record.executionFlowId)
  assert.deepEqual(reopened, record)
  assert.equal(await fs.promises.readFile(file, 'utf8'), before)
})

checks.set(13, async () => {
  const storeRoot = path.join(root, 'persistence-concurrency')
  const left = createSupervisedResearchExecutionPersistence({ root: storeRoot })
  const right = createSupervisedResearchExecutionPersistence({ root: storeRoot })
  const record = initialRecord('persistence-concurrency')
  const created = await Promise.all([left.create(record), right.create(structuredClone(record))])
  assert.deepEqual(created.map((item) => item.idempotent).sort(), [false, true])
  const spec = { expectedStates: ['prepare_context'], expectedRevision: 0, nextState: 'prepare_research', patch: { packageRefs: packageRefs('persistence-concurrency'), pendingOperations: ['prepare_research'] }, updatedAt: clock() }
  const settled = await Promise.allSettled([left.compareAndSet(record.executionFlowId, spec), right.compareAndSet(record.executionFlowId, spec)])
  assert.equal(settled.filter((item) => item.status === 'fulfilled').length, 1)
  assert.equal(settled.find((item) => item.status === 'rejected').reason.code, 'STALE_EXECUTION_FLOW')
  assert.equal((await fs.promises.readdir(storeRoot)).some((name) => name.endsWith('.stage')), false)
})

checks.set(14, async () => {
  const store = createSupervisedResearchExecutionPersistence({ root: path.join(root, 'persistence-unbounded') })
  for (let index = 0; index < 55; index += 1) await store.create(createExecutionFlow({ identity: identity(`bulk-${index}`), intakeId: intakeId(`bulk-${index}`), routingFingerprint: routeHash }, clock()))
  assert.equal((await store.listAll()).length, 55)
  assert.equal((await store.listDetailed()).records.length, 55)
})

checks.set(15, async () => {
  const storeRoot = path.join(root, 'persistence-corruption')
  const store = createSupervisedResearchExecutionPersistence({ root: storeRoot })
  const good = initialRecord('corruption-good')
  await store.create(good)
  const corruptId = `research-execution-${'a'.repeat(32)}`
  await fs.promises.writeFile(path.join(storeRoot, `${corruptId}.json`), '{not-json', 'utf8')
  const detailed = await store.listDetailed()
  assert.deepEqual(detailed.records.map((item) => item.executionFlowId), [good.executionFlowId])
  assert.deepEqual(detailed.corruptions, [{ executionFlowId: corruptId, code: 'CORRUPT_EXECUTION_FLOW' }])
  assert.deepEqual((await store.listAll()).map((item) => item.executionFlowId), [good.executionFlowId])
})

checks.set(16, async () => {
  const storeRoot = path.join(root, 'persistence-index')
  const store = createSupervisedResearchExecutionPersistence({ root: storeRoot })
  const record = initialRecord('index-good')
  await store.create(record)
  await fs.promises.writeFile(path.join(storeRoot, 'research-execution-index.json'), '{broken', 'utf8')
  const rebuilt = await store.rebuildIndex()
  assert.equal(rebuilt.recovered, true)
  assert.deepEqual(rebuilt.index.executionFlowIds, [record.executionFlowId])
  assert.equal((await store.rebuildIndex()).idempotent, true)
})

checks.set(17, async () => {
  const { environment, services } = await primary()
  throwsCode(() => createSupervisedResearchExecution({ persistence: services.flowPersistence, discovery: environment.discovery, research: services.research, connectorRuntime: services.connectorRuntime, trustedRouting: routeInput, clock, adapter: () => {} }), 'INVALID_EXECUTION_OPTIONS')
  throwsCode(() => createSupervisedResearchExecution({ persistence: services.flowPersistence, discovery: environment.discovery, research: services.research, connectorRuntime: services.connectorRuntime, trustedRouting: { ...routeInput, providerType: 'manual_reference' }, clock }), 'INVALID_TRUSTED_ROUTING')
})

checks.set(18, async () => {
  const { environment, services } = await primary()
  for (const field of ['providerType', 'budget', 'adapter', 'reference']) {
    await rejectsCode(() => services.execution.prepareFlow({ intakeId: environment.intake.intakeId, [field]: field === 'budget' ? {} : 'forged' }), 'INVALID_EXECUTION_REQUEST')
  }
})

checks.set(19, async () => {
  const { services } = await primary()
  await rejectsCode(() => services.execution.prepareFlow({ intakeId: intakeId('missing') }), 'INTAKE_NOT_FOUND')
  const environment = await createEnvironment('not-ready-owner')
  const draft = await environment.discovery.createIntake({ objective: 'Objetivo incompleto', expectedOutcome: 'Resultado pendiente', priority: 'normal', responsible: 'lean' })
  assert.equal(draft.intake.state, 'draft')
  const draftServices = createServices(environment)
  await rejectsCode(() => draftServices.execution.prepareFlow({ intakeId: draft.intake.intakeId }), 'INTAKE_NOT_READY')
  assert.equal((await draftServices.flowPersistence.listAll()).length, 0)
})

checks.set(20, async () => {
  const { environment, services, flow } = await primaryPrepared()
  const record = await services.flowPersistence.read(flow.executionFlowId)
  assert.deepEqual(record.identity, environment.physicalIdentity)
  const context = await environment.discovery.prepareResearchContext(environment.intake.intakeId)
  assert.deepEqual(context.intake.identity, environment.physicalIdentity)
})

checks.set(21, async () => {
  const { environment, record } = await primaryPrepared()
  const discoveryByRole = Object.fromEntries(environment.discoveryPackages.map((item) => [item.agent, item]))
  for (const role of ['radar', 'scout', 'hermes']) {
    assert.equal(record.packageRefs[role].packageId, discoveryByRole[role].packageId)
    assert.equal(record.packageRefs[role].handoffId, discoveryByRole[role].handoffId)
  }
  assert.equal(new Set(Object.values(record.packageRefs).map((item) => item.packageId)).size, 3)
})

checks.set(22, async () => {
  const { environment, services, record } = await primaryPrepared()
  const caseRecord = await services.evidencePersistence.read(record.evidenceCaseId)
  assert.deepEqual(caseRecord.identity, environment.physicalIdentity)
  assert.equal(caseRecord.researchPlanId, record.researchPlanId)
  assert.equal(caseRecord.evidenceCaseId, record.evidenceCaseId)
  assert.equal(new Set(caseRecord.requests.map((item) => item.discoveryId)).size, 1)
  for (const request of caseRecord.requests) {
    assert.deepEqual(request.identity, environment.physicalIdentity)
    assert.equal(request.researchPlanId, record.researchPlanId)
    assert.equal(request.evidenceCaseId, record.evidenceCaseId)
  }
})

checks.set(23, async () => {
  const { services, record } = await primaryPrepared()
  const caseRecord = await services.evidencePersistence.read(record.evidenceCaseId)
  const byRole = Object.fromEntries(caseRecord.requests.map((item) => [item.role, item]))
  assert.equal(byRole.radar.providerType, 'manual_reference')
  assert.equal(byRole.scout.providerType, 'structured_analysis')
  assert.equal(byRole.hermes.providerType, 'structured_analysis')
  assert.deepEqual(byRole.scout.budget, budget(routeInput.budget))
  const attempt = await services.connectorPersistence.read(record.attemptRefs[0].connectorAttemptId)
  assert.equal(attempt.operation, 'analyze')
  assert.equal(attempt.providerType, 'structured_analysis')
})

checks.set(24, async () => {
  const { environment, services, record } = await primaryPrepared()
  const attempt = await services.connectorPersistence.read(record.attemptRefs[0].connectorAttemptId)
  const caseRecord = await services.evidencePersistence.read(record.evidenceCaseId)
  assert.equal(environment.counters.adapters, 0)
  assert.equal(environment.counters.receives, 0)
  assert.equal(Object.hasOwn(attempt, 'receipt'), false)
  assert.equal(Object.hasOwn(attempt, 'delivery'), false)
  assert.equal(caseRecord.receipts.length, 0)
  assert.equal(caseRecord.evidenceDecisions.length, 0)
})

checks.set(25, async () => {
  const { environment, flow, record } = await primaryPrepared()
  const restarted = createServices(environment)
  const reopened = await restarted.execution.reopenFlow({ executionFlowId: flow.executionFlowId })
  const status = await restarted.connectorRuntime.getAttemptStatus(record.attemptRefs[0].connectorAttemptId)
  assert.equal(reopened.state, 'ready_for_execution')
  assert.equal(status.state, 'prepared')
  assert.equal(environment.counters.adapters, 0)
})

checks.set(26, async () => {
  const { environment, services, result, terminalRecord } = await primaryExecuted()
  assert.equal(result.executionDispatched, true)
  assert.equal(environment.counters.adapters, 1)
  assert.equal(environment.counters.receives, 1)
  const attempt = await services.connectorPersistence.read(terminalRecord.attemptRefs[0].connectorAttemptId)
  assert.equal(attempt.state, 'partial')
  assert.equal(attempt.receipt.status, 'partial')
  assert.equal(attempt.receipt.classification, 'UNTRUSTED_EXTERNAL_CONTENT')
})

checks.set(27, async () => {
  const { result, services, terminalRecord } = await primaryExecuted()
  assert.equal(result.state, 'needs_corroboration')
  assert.equal(terminalRecord.state, 'needs_corroboration')
  const caseView = await services.research.reopenEvidenceCase(terminalRecord.evidenceCaseId)
  assert.equal(caseView.state, 'needs_corroboration')
  assert.equal(caseView.nextResponsible, 'scout')
})

checks.set(28, async () => {
  const { environment, services, terminalRecord } = await primaryExecuted()
  const persisted = JSON.parse(await fs.promises.readFile(path.join(environment.flowRoot, `${terminalRecord.executionFlowId}.json`), 'utf8'))
  for (const forbidden of ['receipt', 'receipts', 'evidence', 'claim', 'memory', 'providerType', 'operation', 'budget']) assert.equal(Object.hasOwn(persisted, forbidden), false)
  const caseRecord = await services.evidencePersistence.read(terminalRecord.evidenceCaseId)
  assert.equal(caseRecord.receipts.length, 1)
  assert.equal(caseRecord.evidenceDecisions.length, 1)
  assert.equal(environment.counters.evidenceAppends, 0)
  assert.equal((await environment.memory.getSnapshot()).history.filter((entry) => entry.type === 'evidence').length, 0)
})

checks.set(29, async () => {
  const { environment, services, result } = await primaryExecuted()
  const counts = { adapters: environment.counters.adapters, receives: environment.counters.receives }
  const replay = await services.execution.executeNext({ executionFlowId: result.executionFlowId })
  assert.equal(replay.idempotent, true)
  assert.equal(replay.executionDispatched, false)
  assert.equal(environment.counters.adapters, counts.adapters)
  assert.equal(environment.counters.receives, counts.receives)
})

checks.set(30, async () => {
  const { environment, result, terminalRecord } = await primaryExecuted()
  const restarted = createServices(environment)
  const reopened = await restarted.execution.reopenFlow({ executionFlowId: result.executionFlowId })
  assert.equal(reopened.state, 'needs_corroboration')
  assert.equal(reopened.revision, terminalRecord.revision)
  assert.equal(reopened.researchPlanId, terminalRecord.researchPlanId)
  assert.equal(reopened.evidenceCaseId, terminalRecord.evidenceCaseId)
})

checks.set(31, async () => {
  const environment = await createEnvironment('same-flow-concurrency')
  const services = createServices(environment)
  const flow = await services.execution.prepareFlow({ intakeId: environment.intake.intakeId })
  const results = await Promise.all([services.execution.executeNext({ executionFlowId: flow.executionFlowId }), services.execution.executeNext({ executionFlowId: flow.executionFlowId })])
  assert.equal(environment.counters.adapters, 1)
  assert.equal(environment.counters.receives, 1)
  assert.equal(results.every((item) => item.state === 'needs_corroboration'), true)
})

checks.set(32, async () => {
  const environmentA = await createEnvironment('isolation-a')
  const environmentB = await createEnvironment('isolation-b')
  const servicesA = createServices(environmentA)
  const servicesB = createServices(environmentB)
  const [flowA, flowB] = await Promise.all([servicesA.execution.prepareFlow({ intakeId: environmentA.intake.intakeId }), servicesB.execution.prepareFlow({ intakeId: environmentB.intake.intakeId })])
  await Promise.all([servicesA.execution.executeNext({ executionFlowId: flowA.executionFlowId }), servicesB.execution.executeNext({ executionFlowId: flowB.executionFlowId })])
  assert.notEqual(flowA.executionFlowId, flowB.executionFlowId)
  assert.deepEqual((await servicesA.flowPersistence.listAll(environmentA.physicalIdentity.projectId)).map((item) => item.identity.projectId), [environmentA.physicalIdentity.projectId])
  assert.deepEqual((await servicesB.flowPersistence.listAll(environmentB.physicalIdentity.projectId)).map((item) => item.identity.projectId), [environmentB.physicalIdentity.projectId])
  assert.equal((await servicesA.flowPersistence.listAll(environmentB.physicalIdentity.projectId)).length, 0)
})

checks.set(33, async () => {
  const environment = await createEnvironment('cancel-prepared')
  const services = createServices(environment)
  const flow = await services.execution.prepareFlow({ intakeId: environment.intake.intakeId })
  const cancelled = await services.execution.cancelFlow({ executionFlowId: flow.executionFlowId })
  assert.equal(cancelled.state, 'blocked')
  assert.equal(cancelled.lastErrorCode, 'CANCELLED')
  assert.equal(environment.counters.adapters, 0)
  assert.equal(environment.counters.receives, 0)
})

checks.set(34, async () => {
  const interruptedEnvironment = await createEnvironment('reconcile-interrupted')
  const interrupted = createServices(interruptedEnvironment)
  const flow = await interrupted.execution.prepareFlow({ intakeId: interruptedEnvironment.intake.intakeId })
  const flowRecord = await interrupted.flowPersistence.read(flow.executionFlowId)
  const attempt = await interrupted.connectorPersistence.read(flowRecord.attemptRefs.at(-1).connectorAttemptId)
  await interrupted.connectorPersistence.transitionAttempt(attempt.connectorAttemptId, { expectedStates: ['prepared'], expectedRevision: attempt.revision, nextState: 'running', patch: { updatedAt: clock() } })
  await interrupted.flowPersistence.compareAndSet(flow.executionFlowId, { expectedStates: ['ready_for_execution'], expectedRevision: flowRecord.revision, nextState: 'explicit_execution', patch: { pendingOperations: ['explicit_execution'], lastErrorCode: null }, updatedAt: clock() })
  const reconciled = await interrupted.execution.reconcileFlows({ projectId: interruptedEnvironment.physicalIdentity.projectId, limit: 10 })
  assert.equal(reconciled.adaptersExecuted, 0)
  assert.equal(reconciled.items[0].state, 'ready_for_execution')
  assert.equal(reconciled.items[0].lastErrorCode, 'INTERRUPTED')
  assert.equal(interruptedEnvironment.counters.adapters, 0)

  const humanEnvironment = await createEnvironment('reconcile-human')
  const humanBase = createServices(humanEnvironment)
  const humanFlow = await humanBase.execution.prepareFlow({ intakeId: humanEnvironment.intake.intakeId })
  const humanRecord = await humanBase.flowPersistence.read(humanFlow.executionFlowId)
  await humanBase.flowPersistence.compareAndSet(humanFlow.executionFlowId, { expectedStates: ['ready_for_execution'], expectedRevision: humanRecord.revision, nextState: 'sync_state', patch: { pendingOperations: ['sync_state'], lastErrorCode: null }, updatedAt: clock() })
  const humanResearch = { ...humanBase.research, retryEvidenceCase: async (evidenceCaseId) => ({ researchPlanId: humanRecord.researchPlanId, evidenceCaseId, identity: structuredClone(humanEnvironment.physicalIdentity), projectId: humanEnvironment.physicalIdentity.projectId, state: 'requires_human' }) }
  const projected = createSupervisedResearchExecution({ persistence: humanBase.flowPersistence, discovery: humanEnvironment.discovery, research: humanResearch, connectorRuntime: humanBase.connectorRuntime, trustedRouting: routeInput, clock })
  const humanResult = await projected.reconcileFlows({ projectId: humanEnvironment.physicalIdentity.projectId, limit: 10 })
  assert.equal(humanResult.items[0].state, 'requires_human')
  assert.equal(humanEnvironment.counters.adapters, 0)
})

checks.set(35, async () => {
  const environment = await createEnvironment('delivery-crash-window', { throwAfterReceiveOnce: true })
  const services = createServices(environment)
  const flow = await services.execution.prepareFlow({ intakeId: environment.intake.intakeId })
  const first = await services.execution.executeNext({ executionFlowId: flow.executionFlowId })
  assert.equal(first.state, 'resume_delivery')
  assert.equal(first.lastErrorCode, 'DELIVERY_PENDING')
  assert.equal(environment.counters.adapters, 1)
  const pendingRecord = await services.flowPersistence.read(flow.executionFlowId)
  const pendingAttempt = await services.connectorPersistence.read(pendingRecord.attemptRefs.at(-1).connectorAttemptId)
  assert.equal(pendingAttempt.delivery.state, 'pending')
  assert.equal((await services.evidencePersistence.read(pendingRecord.evidenceCaseId)).receipts.length, 1)
  const restarted = createServices(environment)
  const resumed = await restarted.execution.executeNext({ executionFlowId: flow.executionFlowId })
  assert.equal(resumed.state, 'needs_corroboration')
  assert.equal(environment.counters.adapters, 1)
  assert.equal(environment.counters.receives, 2)
  const finished = await restarted.flowPersistence.read(flow.executionFlowId)
  assert.equal(finished.attemptRefs.length, 2)
  assert.equal((await restarted.evidencePersistence.read(finished.evidenceCaseId)).receipts.length, 1)
  const deliveredAttempt = await restarted.connectorPersistence.read(finished.attemptRefs.at(-1).connectorAttemptId)
  assert.equal(deliveredAttempt.delivery.state, 'delivered')
})

checks.set(36, async () => {
  let forbiddenCalls = 0
  const trap = () => { forbiddenCalls += 1; throw new Error('forbidden capability') }
  const originals = {
    fetch: globalThis.fetch,
    exec: childProcess.exec,
    execFile: childProcess.execFile,
    spawn: childProcess.spawn,
    httpGet: http.get,
    httpRequest: http.request,
    httpsGet: https.get,
    httpsRequest: https.request,
  }
  try {
    globalThis.fetch = trap
    childProcess.exec = trap
    childProcess.execFile = trap
    childProcess.spawn = trap
    http.get = trap
    http.request = trap
    https.get = trap
    https.request = trap
    const environment = await createEnvironment('negative-capabilities', {
      extraAdapters: {
        'automated-browser-disabled': trap,
        'metasearch-not-connected': trap,
        'crawler-not-connected': trap,
      },
    })
    const services = createServices(environment)
    const flow = await services.execution.prepareFlow({ intakeId: environment.intake.intakeId })
    const result = await services.execution.executeNext({ executionFlowId: flow.executionFlowId })
    assert.equal(result.state, 'needs_corroboration')
    assert.equal(services.connectorRuntime.getConnectorHealth('structured_analysis').networkEnabled, false)
    assert.equal(services.connectorRuntime.getConnectorHealth('automated_browser').state, 'disabled')
    assert.equal(forbiddenCalls, 0)
    const recordText = await fs.promises.readFile(path.join(environment.flowRoot, `${flow.executionFlowId}.json`), 'utf8')
    assert.equal(recordText.includes('human_decision'), false)
    assert.equal(recordText.includes('technical_result'), false)
  } finally {
    globalThis.fetch = originals.fetch
    childProcess.exec = originals.exec
    childProcess.execFile = originals.execFile
    childProcess.spawn = originals.spawn
    http.get = originals.httpGet
    http.request = originals.httpRequest
    https.get = originals.httpsGet
    https.request = originals.httpsRequest
  }
})

try {
  assert.equal(names.length, 36)
  assert.equal(checks.size, 36)
  const executed = []
  const total = checks.size
  for (const [number, check] of checks) {
    assert.equal(typeof check, 'function')
    await check()
    executed.push(number)
    console.log(`PASS ${number}/${total} ${names[number - 1]}`)
  }
  assert.deepEqual(executed, Array.from({ length: 36 }, (_, index) => index + 1))
  const executedRange = `${executed[0]}-${executed.at(-1)}`
  console.log(`PASS jefe-supervised-research-execution-smoke: casos ${executedRange}`)
  console.log(`SMOKE_STRUCTURE=${checks.size}/${names.length}`)
  console.log(`BEHAVIORAL_CASES_COMPLETE=${executed.length}/${checks.size}`)
  console.log(`BEHAVIORAL_CASES_REAL=${executedRange}`)
  console.log(`SUPERVISED_EXECUTION_SMOKE=${executed.length}/${checks.size}`)
} finally {
  const resolvedRoot = path.resolve(root)
  const resolvedTemporary = `${path.resolve(os.tmpdir())}${path.sep}`
  if (!resolvedRoot.startsWith(resolvedTemporary)) throw new Error('unsafe temporary cleanup target')
  await fs.promises.rm(resolvedRoot, { recursive: true, force: true })
}
