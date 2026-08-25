import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { canonical } = require('../electron/jefe-context-package-contract.cjs')
const { CONNECTORS, connector } = require('../electron/jefe-research-connector-contract.cjs')
const { validateIntake } = require('../electron/jefe-discovery-contract.cjs')
const { createDiscoveryPersistence } = require('../electron/jefe-discovery-persistence.cjs')
const { createSupervisedResearchPersistence } = require('../electron/jefe-supervised-research-persistence.cjs')
const { createEvidenceCasePersistence } = require('../electron/jefe-supervised-research-evidence-case-persistence.cjs')
const { createSupervisedResearch } = require('../electron/jefe-supervised-research-orchestrator.cjs')
const { createConnectorPersistence } = require('../electron/jefe-research-connector-persistence.cjs')
const { createConnectorRuntime } = require('../electron/jefe-research-connector-runtime.cjs')
const {
  createExecutionFlow,
  transitionExecutionFlow,
} = require('../electron/jefe-supervised-research-execution-contract.cjs')
const { createSupervisedResearchExecutionPersistence } = require('../electron/jefe-supervised-research-execution-persistence.cjs')
const { createSupervisedResearchExecution, routingFingerprint } = require('../electron/jefe-supervised-research-execution-orchestrator.cjs')
const {
  BATCH_MAX,
  DIAGNOSIS_SCHEMA,
  STATUS_SCHEMA,
  PLAN_SCHEMA,
  EXECUTION_SCHEMA,
  createSupervisedResearchRecovery,
} = require('../electron/jefe-supervised-research-recovery.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-supervised-recovery-'))
const now = '2026-08-25T12:00:00.000Z'
const PREPARATION_FLOW_STATES_FOR_SMOKE = new Set(['prepare_context', 'prepare_research', 'prepare_attempts'])
const tests = []
let sequence = 0

function test(name, run) {
  tests.push({ name, run })
}

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function recordFingerprint(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function id(prefix, value) {
  return `${prefix}-${digest(value).slice(0, 32)}`
}

function initialConnectorAttemptId(record) {
  const seed = Object.fromEntries(['schemaVersion', 'researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType', 'operation', 'connectorId'].map((field) => [field, record[field]]))
  return `connector-attempt-${recordFingerprint(seed).slice(0, 32)}`
}

function retryConnectorAttemptId(record) {
  const seed = Object.fromEntries(['rootAttemptId', 'retryOfAttemptId', 'attemptNumber', 'projectId', 'researchSessionId', 'researchRequestId', 'discoveryId', 'connectorId'].map((field) => [field, record[field]]))
  return `connector-attempt-${recordFingerprint(seed).slice(0, 32)}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function project(value) {
  return `project-${digest(value).slice(0, 12)}`
}

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

function controlledGate() {
  const releases = []
  const observers = []
  let entries = 0
  function notify() {
    for (const observer of [...observers]) if (entries >= observer.count) {
      observers.splice(observers.indexOf(observer), 1)
      observer.resolve()
    }
  }
  return {
    get entries() { return entries },
    async enter() {
      entries += 1
      const release = deferred()
      releases.push(release)
      notify()
      await release.promise
    },
    waitForEntries(count) {
      if (entries >= count) return Promise.resolve()
      const ready = deferred()
      observers.push({ count, resolve: ready.resolve })
      return ready.promise
    },
    releaseOne() {
      const release = releases.shift()
      assert.ok(release)
      release.resolve()
    },
    releaseAll() {
      while (releases.length > 0) releases.shift().resolve()
    },
  }
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

const indexSpecifications = Object.freeze({
  discovery: { fileName: 'discovery-index.json', idsField: 'intakeIds' },
  research: { fileName: 'research-session-index.json', idsField: 'sessionIds' },
  evidenceCases: { fileName: 'evidence-case-index.json', idsField: 'evidenceCaseIds' },
  connectorAttempts: { fileName: 'attempt-index.json', idsField: 'attemptIds' },
  executionFlows: { fileName: 'research-execution-index.json', idsField: 'executionFlowIds' },
})

function indexValue(store, detail) {
  if (store === 'discovery') return {
    schemaVersion: 'jefe-supervised-discovery-index/v1',
    intakeIds: detail.records.map((item) => item.intakeId).sort(),
    projectAssociations: detail.records.filter((item) => item.identity?.projectId).map((item) => ({ intakeId: item.intakeId, projectId: item.identity.projectId })).sort((left, right) => left.intakeId.localeCompare(right.intakeId)),
    corruptions: clone(detail.corruptions),
    rebuiltAt: null,
  }
  if (store === 'research') return {
    schemaVersion: 'jefe-supervised-research-session-index/v1',
    sessionIds: detail.records.map((item) => item.researchSessionId).sort(),
    requestAssociations: detail.records.map((item) => ({ projectId: item.projectId, researchRequestId: item.researchRequestId, researchSessionId: item.researchSessionId })).sort((left, right) => left.researchRequestId.localeCompare(right.researchRequestId)),
    corruptions: clone(detail.corruptions),
    rebuiltAt: null,
  }
  if (store === 'evidenceCases') return {
    schemaVersion: 'jefe-supervised-research-evidence-case-index/v1',
    evidenceCaseIds: detail.records.map((item) => item.evidenceCaseId).sort(),
    projectAssociations: detail.records.map((item) => ({ evidenceCaseId: item.evidenceCaseId, projectId: item.projectId })).sort((left, right) => left.evidenceCaseId.localeCompare(right.evidenceCaseId)),
    requestAssociations: detail.records.flatMap((item) => item.requests.map((request) => ({ evidenceCaseId: item.evidenceCaseId, researchRequestId: request.researchRequestId }))).sort((left, right) => left.researchRequestId.localeCompare(right.researchRequestId)),
    corruptions: clone(detail.corruptions),
    rebuiltAt: null,
  }
  if (store === 'connectorAttempts') return {
    schemaVersion: 'jefe-research-connector-index/v1',
    attemptIds: detail.records.map((item) => item.connectorAttemptId).sort(),
    corruptions: clone(detail.corruptions),
    rebuiltAt: null,
  }
  return {
    schemaVersion: 'jefe-supervised-research-execution-index/v1',
    executionFlowIds: detail.records.map((item) => item.executionFlowId).sort(),
    projectAssociations: detail.records.map((item) => ({ executionFlowId: item.executionFlowId, projectId: item.identity.projectId })).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId)),
    intakeAssociations: detail.records.map((item) => ({ executionFlowId: item.executionFlowId, intakeId: item.intakeId })).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId)),
    corruptions: clone(detail.corruptions),
    rebuiltAt: null,
  }
}

function emptyState() {
  return {
    discovery: { records: [], corruptions: [] },
    research: { records: [], corruptions: [] },
    evidenceCases: { records: [], corruptions: [] },
    connectorAttempts: { records: [], corruptions: [] },
    executionFlows: { records: [], corruptions: [] },
  }
}

function storeRecord(store, safeProject, token = store) {
  const identity = { projectId: safeProject, runId: `run-${digest(`${safeProject}:${token}:run`).slice(0, 12)}`, versionId: `version-${digest(`${safeProject}:${token}:version`).slice(0, 12)}` }
  const intakeId = id('intake', token)
  const discoveryId = `discovery-${intakeId.slice(7)}`
  const researchRequestId = id('research', token)
  const evidenceCaseId = id('evidence-case', token)
  const researchPlanId = id('research-plan', token)
  if (store === 'discovery') return { intakeId, identity }
  if (store === 'research') return { researchSessionId: id('research-session', token), researchRequestId, researchPlanId, evidenceCaseId: null, identity, intakeId, discoveryId, projectId: safeProject, packageId: id('context-package', token), handoffId: id('agent-handoff', token), providerType: 'structured_analysis', request: null }
  if (store === 'evidenceCases') return { evidenceCaseId, researchPlanId, identity, intakeId, discoveryId, projectId: safeProject, revision: 0, state: 'needs_corroboration', pendingOperations: [], memory: { status: 'not_applicable', entryId: null }, requests: [] }
  if (store === 'connectorAttempts') {
    const record = { schemaVersion: 'jefe-research-connector-attempt/v1', researchSessionId: id('research-session', token), researchRequestId, discoveryId, projectId: safeProject, providerType: 'structured_analysis', operation: 'analyze', connectorId: CONNECTORS.structured_analysis.connectorId, revision: 0, state: 'prepared' }
    return { ...record, connectorAttemptId: initialConnectorAttemptId(record) }
  }
  return { executionFlowId: id('research-execution', token), revision: 0, intakeId, identity, state: 'ready_for_execution', pendingOperations: [], attemptRefs: [], requestRefs: [], packageRefs: {}, researchPlanId: null, evidenceCaseId: null, lastErrorCode: null, createdAt: now }
}

function addAttemptGraph(repository, safeProject, token, patch = {}) {
  const intake = storeRecord('discovery', safeProject, token)
  const session = storeRecord('research', safeProject, token)
  const attempt = { ...storeRecord('connectorAttempts', safeProject, token), ...patch }
  repository.discovery.records.push(intake)
  repository.research.records.push(session)
  repository.connectorAttempts.records.push(attempt)
  return { intake, session, attempt }
}

function addEvidenceCase(repository, safeProject, token, patch = {}) {
  const intake = storeRecord('discovery', safeProject, token)
  const evidenceCase = { ...storeRecord('evidenceCases', safeProject, token), ...patch }
  repository.discovery.records.push(intake)
  repository.evidenceCases.records.push(evidenceCase)
  return { intake, evidenceCase }
}

function addLinkedAttemptGraph(repository, safeProject, token, attemptPatch = {}) {
  const intake = storeRecord('discovery', safeProject, token)
  const evidenceCase = storeRecord('evidenceCases', safeProject, token)
  const sessionBase = storeRecord('research', safeProject, token)
  const request = {
    researchRequestId: sessionBase.researchRequestId,
    identity: clone(sessionBase.identity),
    role: 'radar',
    packageId: sessionBase.packageId,
    handoffId: sessionBase.handoffId,
    providerType: sessionBase.providerType,
  }
  const session = { ...sessionBase, evidenceCaseId: evidenceCase.evidenceCaseId, researchPlanId: evidenceCase.researchPlanId, request: clone(request) }
  evidenceCase.requests = [request]
  const attempt = { ...storeRecord('connectorAttempts', safeProject, token), ...attemptPatch }
  repository.discovery.records.push(intake)
  repository.research.records.push(session)
  repository.evidenceCases.records.push(evidenceCase)
  repository.connectorAttempts.records.push(attempt)
  return { intake, evidenceCase, session, attempt }
}

function healthSnapshot(connectorId, state = 'closed') {
  if (state === 'closed') return { schemaVersion: 'jefe-research-connector-health/v1', connectorId, state, failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: null }
  return { schemaVersion: 'jefe-research-connector-health/v1', connectorId, state, failureCount: 1, openedAt: now, halfOpenEligibleAt: now, probeAttemptId: state === 'half_open' ? id('connector-attempt', `${connectorId}:probe`) : null, lastTransitionAt: now }
}

async function fakeHarness(name, options = {}) {
  const base = options.base || path.join(root, `fake-${String(++sequence).padStart(3, '0')}-${name}`)
  const state = options.state || emptyState()
  const tracker = options.tracker || { active: 0, maximum: 0 }
  const calls = { reads: 0, rebuilds: [], reconcileAttempts: 0, reconcileResearch: 0, reconcileFlows: 0, rebuildHealth: 0, adapters: 0, providers: 0, human: 0 }
  const roots = {}
  const stores = {}
  for (const store of Object.keys(indexSpecifications)) {
    roots[store] = options.sharedAuthorityRoot || path.join(base, store)
    await fs.promises.mkdir(roots[store], { recursive: true })
    stores[store] = {
      authorityRoot: path.resolve(roots[store]),
      async rebuildIndex() {
        calls.rebuilds.push(store)
        if (options.failIndex === store) {
          const error = new Error(`secret-${store}`)
          error.code = 'INDEX_REBUILD_FAILED'
          throw error
        }
        const value = indexValue(store, state[store])
        const target = path.join(roots[store], indexSpecifications[store].fileName)
        let prior = null
        try { prior = JSON.parse(await fs.promises.readFile(target, 'utf8')) } catch {}
        if (canonical(prior) === canonical(value)) return { index: clone(value), idempotent: true, recovered: false }
        await fs.promises.writeFile(target, `${canonical(value)}\n`, 'utf8')
        return { index: clone(value), idempotent: false, recovered: prior !== null }
      },
    }
  }
  stores.discovery.listAllDetailed = async () => { calls.reads += 1; return clone(state.discovery) }
  stores.research.listDetailed = async () => { calls.reads += 1; return clone(state.research) }
  stores.evidenceCases.listDetailed = async () => { calls.reads += 1; return clone(state.evidenceCases) }
  stores.connectorAttempts.listAllDetailed = async () => { calls.reads += 1; return clone(state.connectorAttempts) }
  stores.executionFlows.listDetailed = async () => { calls.reads += 1; return clone(state.executionFlows) }

  const providerTypes = Object.keys(CONNECTORS).sort()
  const health = new Map(providerTypes.map((providerType) => [providerType, {
    sourceIntegrity: options.healthSourceIntegrity || 'complete',
    drift: (options.healthSourceIntegrity || 'complete') === 'partial' ? 'unknown' : options.healthDrift || 'none',
    materializedState: ['missing', 'corrupt'].includes(options.healthDrift) ? null : options.healthDrift === 'mismatch' ? 'open' : 'closed',
  }]))
  const runtime = {
    async reconcileAttempts({ projectId, limit, candidates: suppliedCandidates }) {
      calls.reconcileAttempts += 1
      tracker.active += 1
      tracker.maximum = Math.max(tracker.maximum, tracker.active)
      try {
        if (options.gate) await options.gate.enter()
        if (options.onReconcileAttempts) await options.onReconcileAttempts({ state, suppliedCandidates: clone(suppliedCandidates || []) })
        const candidates = suppliedCandidates === undefined
          ? state.connectorAttempts.records.filter((item) => item.projectId === projectId && ['running', 'contributing'].includes(item.state)).sort((left, right) => left.connectorAttemptId.localeCompare(right.connectorAttemptId)).slice(0, limit).map((item) => ({ connectorAttemptId: item.connectorAttemptId, revision: item.revision, state: item.state, deliveryId: item.delivery?.deliveryId || null }))
          : suppliedCandidates
        const selected = []
        const results = []
        let failures = 0
        for (const candidate of candidates) {
          const item = state.connectorAttempts.records.find((record) => record.connectorAttemptId === candidate.connectorAttemptId)
          if (!item || item.projectId !== projectId || item.revision !== candidate.revision || item.state !== candidate.state || (item.delivery?.deliveryId || null) !== candidate.deliveryId) {
            results.push({ connectorAttemptId: candidate.connectorAttemptId, status: 'stale', state: item?.state || null, revision: item?.revision ?? null, deliveryId: item?.delivery?.deliveryId || null })
            continue
          }
          if (options.failConnectorAttemptId === candidate.connectorAttemptId) {
            failures += 1
            results.push({ connectorAttemptId: candidate.connectorAttemptId, status: 'failed', state: item.state, revision: item.revision, deliveryId: item.delivery?.deliveryId || null })
            continue
          }
          selected.push(item)
          item.state = 'failed_transient'
          item.revision += 1
          item.errorCode = 'INTERRUPTED'
          results.push({ connectorAttemptId: candidate.connectorAttemptId, status: 'reconciled', state: item.state, revision: item.revision, deliveryId: item.delivery?.deliveryId || null })
        }
        return { items: selected.map(clone), remaining: failures, results }
      } finally {
        tracker.active -= 1
      }
    },
    async inspectConnectorHealth() {
      return {
        items: providerTypes.map((providerType) => {
          const current = health.get(providerType)
          const definition = connector(providerType)
          return {
            providerType,
            connectorId: definition.connectorId,
            sourceIntegrity: current.sourceIntegrity,
            drift: current.drift,
            materializedHealth: current.materializedState ? healthSnapshot(definition.connectorId, current.materializedState) : null,
            derivedHealth: current.sourceIntegrity === 'complete' ? healthSnapshot(definition.connectorId) : null,
            attemptsConsidered: state.connectorAttempts.records.filter((item) => item.connectorId === definition.connectorId).length,
            observedAttemptCount: 0,
            corruptionCount: state.connectorAttempts.corruptions.length,
          }
        }),
        corruptionCount: state.connectorAttempts.corruptions.length,
      }
    },
    async rebuildAllConnectorHealth() {
      calls.rebuildHealth += 1
      for (const current of health.values()) if (current.sourceIntegrity === 'complete') { current.drift = 'none'; current.materializedState = 'closed' }
      return {
        items: providerTypes.map((providerType) => {
          const definition = connector(providerType)
          const current = health.get(providerType)
          const attemptsConsidered = state.connectorAttempts.records.filter((item) => item.connectorId === definition.connectorId).length
          return { providerType, connectorId: definition.connectorId, health: current.sourceIntegrity === 'complete' ? healthSnapshot(definition.connectorId) : null, attemptsConsidered, observedAttemptCount: 0, sourceIntegrity: current.sourceIntegrity, materialized: current.sourceIntegrity === 'complete', idempotent: options.healthDrift !== 'missing', replacedCorrupt: options.healthDrift === 'corrupt', corruptionCount: state.connectorAttempts.corruptions.length }
        }),
        corruptionCount: state.connectorAttempts.corruptions.length,
      }
    },
    async getConnectorOperationalStatus(providerType) {
      const definition = connector(providerType)
      const current = health.get(providerType)
      const healthUnknown = current.sourceIntegrity !== 'complete' || current.drift !== 'none'
      const connectionState = providerType === 'manual_reference' ? 'reference_only' : definition.status === 'ready' ? 'not_connected' : definition.status
      return {
        schemaVersion: 'jefe-research-connector-operational-status/v1',
        providerType,
        connectorId: definition.connectorId,
        catalogState: definition.status,
        connectionState,
        circuitState: definition.status !== 'ready' ? 'not_applicable' : healthUnknown ? current.drift === 'corrupt' && current.sourceIntegrity === 'complete' ? 'corrupt' : 'unknown' : 'closed',
        operationalState: definition.status !== 'ready' ? connectionState : healthUnknown ? 'health_unknown' : connectionState,
        networkEnabled: false,
        realConnector: false,
        fixture: false,
      }
    },
  }
  const research = {
    async reconcilePendingResearch(safeProject, limit, suppliedCandidates) {
      calls.reconcileResearch += 1
      if (options.failResearch) {
        const error = new Error('secret research failure')
        error.code = options.failResearchCode || 'RESEARCH_RECONCILE_FAILED'
        throw error
      }
      const candidates = suppliedCandidates === undefined
        ? state.evidenceCases.records.filter((item) => item.projectId === safeProject && (item.state === 'preparing' || item.pendingOperations.length > 0)).slice(0, limit)
        : suppliedCandidates.map((candidate) => {
          const item = state.evidenceCases.records.find((record) => record.evidenceCaseId === candidate.evidenceCaseId)
          if (!item || item.projectId !== safeProject || item.revision !== candidate.revision || item.state !== candidate.state || recordFingerprint(item) !== candidate.fingerprint) {
            const error = new Error('stale research candidate')
            error.code = 'STALE_RECONCILE_CANDIDATE'
            throw error
          }
          return item
        })
      for (const item of candidates) {
        item.state = item.state === 'preparing' ? 'needs_corroboration' : item.state
        item.pendingOperations = item.pendingOperations.filter((operation) => operation !== 'memory_append')
        if (item.memory?.status === 'pending') item.memory.status = 'appended'
        item.revision += 1
      }
      return candidates.map(clone)
    },
  }
  const executionFlow = {
    async reconcileFlows({ projectId, limit, candidates: suppliedCandidates }) {
      calls.reconcileFlows += 1
      if (options.flowAdaptersExecuted) return { items: [], remaining: 0, corruptionCount: 0, adaptersExecuted: options.flowAdaptersExecuted }
      const actionable = new Set(['prepare_context', 'prepare_research', 'prepare_attempts', 'explicit_execution', 'resume_delivery', 'sync_state'])
      const attemptsById = new Map(state.connectorAttempts.records.map((item) => [item.connectorAttemptId, item]))
      const deliveryBoundary = (flow) => {
        if (flow.state !== 'resume_delivery') return false
        const reference = flow.attemptRefs.at(-1)
        const attempt = reference ? attemptsById.get(reference.connectorAttemptId) : null
        return attempt?.delivery?.state === 'pending' && ['prepared', 'failed_transient', 'running', 'contributing'].includes(attempt.state)
      }
      const candidates = suppliedCandidates === undefined
        ? state.executionFlows.records.filter((item) => item.identity.projectId === projectId && actionable.has(item.state) && !deliveryBoundary(item)).slice(0, limit)
        : suppliedCandidates.map((candidate) => {
          const item = state.executionFlows.records.find((record) => record.executionFlowId === candidate.executionFlowId)
          if (!item || item.identity.projectId !== projectId || item.revision !== candidate.revision || item.state !== candidate.state || recordFingerprint(item) !== candidate.fingerprint) {
            const error = new Error('stale execution candidate')
            error.code = 'STALE_RECONCILE_CANDIDATE'
            throw error
          }
          return item
        })
      for (const item of candidates) {
        if (item.state === 'resume_delivery') continue
        item.state = 'blocked'
        item.pendingOperations = []
        item.lastErrorCode = 'CORRUPT_DEPENDENCY'
        item.revision += 1
      }
      return { items: candidates.map(clone), remaining: 0, corruptionCount: state.executionFlows.corruptions.length, adaptersExecuted: 0 }
    },
  }
  const dependencies = {
    discoveryPersistence: stores.discovery,
    researchPersistence: stores.research,
    evidenceCasePersistence: stores.evidenceCases,
    connectorPersistence: stores.connectorAttempts,
    connectorRuntime: runtime,
    research,
    executionPersistence: stores.executionFlows,
    executionFlow,
  }
  const recovery = createSupervisedResearchRecovery(dependencies)
  async function materializeIndexes() {
    for (const store of Object.keys(indexSpecifications)) await stores[store].rebuildIndex()
    calls.rebuilds.length = 0
  }
  return { base, state, stores, roots, runtime, research, executionFlow, dependencies, recovery, calls, tracker, health, materializeIndexes }
}

async function treeSnapshot(base) {
  const output = {}
  async function visit(current) {
    for (const entry of await fs.promises.readdir(current, { withFileTypes: true }).catch(() => [])) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(target)
      else output[path.relative(base, target)] = await fs.promises.readFile(target, 'utf8')
    }
  }
  await visit(base)
  return output
}

function noOpResearch() {
  return Object.freeze({ async reconcilePendingResearch() { return [] } })
}

function noOpExecutionFlow() {
  return Object.freeze({ async reconcileFlows() { return { items: [], remaining: 0, corruptionCount: 0, adaptersExecuted: 0 } } })
}

async function realShell(name, options = {}) {
  const base = path.join(root, `real-${String(++sequence).padStart(3, '0')}-${name}`)
  await fs.promises.mkdir(base, { recursive: true })
  const discoveryPersistence = createDiscoveryPersistence({ root: path.join(base, 'discovery') })
  const researchPersistence = createSupervisedResearchPersistence({ root: path.join(base, 'research') })
  const evidenceCasePersistence = createEvidenceCasePersistence({ root: path.join(base, 'evidence-cases') })
  const connectorPersistence = createConnectorPersistence({ root: path.join(base, 'connectors') })
  const executionPersistence = createSupervisedResearchExecutionPersistence({ root: path.join(base, 'execution-flows') })
  const adapterCounter = { calls: 0 }
  const connectorRuntime = createConnectorRuntime({
    persistence: connectorPersistence,
    clock: () => now,
    trustedAdapters: options.trustedAdapters || {
      'manual-reference-local': () => {
        adapterCounter.calls += 1
        return { state: 'not_executed' }
      },
    },
  })
  const research = options.research || noOpResearch()
  const executionFlow = options.executionFlow || noOpExecutionFlow()
  const dependencies = { discoveryPersistence, researchPersistence, evidenceCasePersistence, connectorPersistence, connectorRuntime, research, executionPersistence, executionFlow }
  return { base, ...dependencies, adapterCounter, recovery: createSupervisedResearchRecovery(dependencies) }
}

function packageReference(agent, token) {
  return {
    agent,
    packageId: id('context-package', `${token}:${agent}:package`),
    handoffId: id('agent-handoff', `${token}:${agent}:handoff`),
    consumerStatus: 'not_connected',
  }
}

function researchPlanInput(token) {
  const identity = { projectId: project(token), runId: `run-${digest(token).slice(0, 12)}`, versionId: `version-${digest(token).slice(12, 24)}` }
  return {
    intake: validateIntake({
      objective: `Investigar evidencia controlada ${token}`,
      expectedOutcome: `Resultado controlado ${token}`,
      audience: 'Equipo de investigacion',
      problem: 'Validar evidencia durable',
      scope: 'Investigacion supervisada',
      constraints: ['Sin ejecucion externa implicita'],
      questions: [`Que evidencia responde ${token}`],
      assumptions: ['La fuente requiere corroboracion'],
      risks: ['Evidencia insuficiente'],
      priority: 'normal',
      responsible: 'lean',
      projectType: 'commercial_site',
      platform: 'web',
      identity,
    }, now),
    packages: ['radar', 'scout', 'hermes'].map((agent) => packageReference(agent, token)),
    providerType: 'metasearch',
    budget: { maxQueries: 2, maxSources: 4 },
    references: ['https://reference.test/source'],
  }
}

async function seedRealResearch(shell, token) {
  const research = createSupervisedResearch({
    memory: null,
    persistence: shell.researchPersistence,
    evidenceCasePersistence: shell.evidenceCasePersistence,
    clock: () => now,
    trusted: { networkEnabled: false, providers: { manual_reference: { state: 'available' }, metasearch: { state: 'not_connected' } } },
  })
  const input = researchPlanInput(token)
  await shell.discoveryPersistence.save(input.intake)
  const planned = await research.plan(input)
  return { input, planned, research }
}

function contribution(request, token, claim = 'Claim controlado compartido') {
  return {
    researchRequestId: request.researchRequestId,
    rawReceipt: {
      researchRequestId: request.researchRequestId,
      providerType: request.providerType,
      operation: request.providerType === 'manual_reference' ? 'reference' : 'search',
      status: 'received',
      url: `https://${digest(token).slice(0, 12)}.test/source`,
      mimeType: 'text/plain',
      bytes: 24,
      contentHash: digest(`content:${token}`),
      excerpt: 'Observacion controlada',
    },
    claim,
  }
}

async function researchRecoveryScenario(name, { contradiction = false } = {}) {
  const base = path.join(root, `research-${String(++sequence).padStart(3, '0')}-${name}`)
  await fs.promises.mkdir(base, { recursive: true })
  const researchRoot = path.join(base, 'research')
  const evidenceRoot = path.join(base, 'evidence-cases')
  const memoryCalls = []
  const trusted = { networkEnabled: false, providers: { manual_reference: { state: 'available' }, metasearch: { state: 'not_connected' } } }
  const disconnected = createSupervisedResearch({
    memory: null,
    persistence: createSupervisedResearchPersistence({ root: researchRoot }),
    evidenceCasePersistence: createEvidenceCasePersistence({ root: evidenceRoot }),
    clock: () => now,
    trusted,
  })
  const input = researchPlanInput(`${name}-${digest(name).slice(0, 6)}`)
  const planned = await disconnected.plan(input)
  await disconnected.receiveContribution(contribution(planned.radar, `${name}:radar`, contradiction ? 'Respuesta A' : 'Claim controlado compartido'))
  await disconnected.receiveContribution(contribution(planned.scout, `${name}:scout`, contradiction ? 'Respuesta B' : 'Claim controlado compartido'))
  const connected = createSupervisedResearch({
    memory: { async append(value) { memoryCalls.push(clone(value)); return { idempotent: false } } },
    persistence: createSupervisedResearchPersistence({ root: researchRoot }),
    evidenceCasePersistence: createEvidenceCasePersistence({ root: evidenceRoot }),
    clock: () => now,
    trusted,
  })
  const discoveryPersistence = createDiscoveryPersistence({ root: path.join(base, 'discovery') })
  await discoveryPersistence.save(input.intake)
  const researchPersistence = createSupervisedResearchPersistence({ root: researchRoot })
  const evidenceCasePersistence = createEvidenceCasePersistence({ root: evidenceRoot })
  const connectorPersistence = createConnectorPersistence({ root: path.join(base, 'connectors') })
  const connectorRuntime = createConnectorRuntime({ persistence: connectorPersistence, clock: () => now })
  const executionPersistence = createSupervisedResearchExecutionPersistence({ root: path.join(base, 'execution-flows') })
  const dependencies = { discoveryPersistence, researchPersistence, evidenceCasePersistence, connectorPersistence, connectorRuntime, research: connected, executionPersistence, executionFlow: noOpExecutionFlow() }
  return { base, input, planned, memoryCalls, connected, ...dependencies, recovery: createSupervisedResearchRecovery(dependencies) }
}

const routeInput = Object.freeze({ providerType: 'structured_analysis', operation: 'analyze', budget: Object.freeze({ maxQueries: 2, maxSources: 4 }) })
const route = Object.freeze({ schemaVersion: 'jefe-supervised-research-routing/v1', executionRole: 'scout', providerType: 'structured_analysis', operation: 'analyze', budget: Object.freeze({ maxQueries: 2, maxSources: 4, maxBytesPerReceipt: 262144, maxTotalBytes: 1048576, maxDepth: 1, maxDurationMs: 15000, maxRedirects: 2, maxAttempts: 2, maxCorroborations: 2 }), references: Object.freeze([]) })
const routeHash = routingFingerprint(route)

function executionReadyRecord(safeProject, token, explicit = false) {
  const identity = { projectId: safeProject, runId: `run-${digest(token).slice(0, 12)}`, versionId: `version-${digest(token).slice(12, 24)}` }
  const intakeId = id('intake', token)
  const packageRefs = Object.fromEntries(['radar', 'scout', 'hermes'].map((role) => [role, { packageId: id('context-package', `${token}:${role}:package`), handoffId: id('agent-handoff', `${token}:${role}:handoff`), consumerStatus: 'not_connected' }]))
  const requestRefs = ['radar', 'scout', 'hermes'].map((role) => ({ role, researchRequestId: id('research', `${token}:${role}`) }))
  const attemptRequestId = requestRefs.find((item) => item.role === 'scout').researchRequestId
  const attemptSeed = { schemaVersion: 'jefe-research-connector-attempt/v1', researchSessionId: `research-session-${digest(attemptRequestId).slice(0, 32)}`, researchRequestId: attemptRequestId, discoveryId: `discovery-${intakeId.slice(7)}`, projectId: safeProject, providerType: 'structured_analysis', operation: 'analyze', connectorId: CONNECTORS.structured_analysis.connectorId }
  const attemptRefs = [{ researchRequestId: attemptRequestId, connectorAttemptId: initialConnectorAttemptId(attemptSeed) }]
  let record = createExecutionFlow({ identity, intakeId, routingFingerprint: routeHash }, now)
  record = transitionExecutionFlow(record, 'prepare_research', { packageRefs, pendingOperations: ['prepare_research'] }, now)
  record = transitionExecutionFlow(record, 'prepare_attempts', { researchPlanId: id('research-plan', token), evidenceCaseId: id('evidence-case', token), requestRefs, pendingOperations: ['prepare_attempts'] }, now)
  record = transitionExecutionFlow(record, 'ready_for_execution', { attemptRefs, pendingOperations: [] }, now)
  if (explicit) record = transitionExecutionFlow(record, 'explicit_execution', { pendingOperations: ['explicit_execution'] }, now)
  return record
}

function addExecutionDependencies(repository, flow) {
  const discovery = { intakeId: flow.intakeId, identity: clone(flow.identity) }
  const requests = flow.requestRefs.map((reference) => {
    const packageRef = flow.packageRefs[reference.role]
    return { researchRequestId: reference.researchRequestId, identity: clone(flow.identity), role: reference.role, packageId: packageRef.packageId, handoffId: packageRef.handoffId, providerType: 'structured_analysis' }
  })
  const evidenceCase = {
    ...storeRecord('evidenceCases', flow.identity.projectId, flow.executionFlowId),
    evidenceCaseId: flow.evidenceCaseId,
    researchPlanId: flow.researchPlanId,
    identity: clone(flow.identity),
    intakeId: flow.intakeId,
    discoveryId: `discovery-${flow.intakeId.slice(7)}`,
    requests: clone(requests),
  }
  const sessions = requests.map((request) => ({
    ...storeRecord('research', flow.identity.projectId, request.researchRequestId),
    researchSessionId: `research-session-${digest(request.researchRequestId).slice(0, 32)}`,
    researchRequestId: request.researchRequestId,
    researchPlanId: flow.researchPlanId,
    evidenceCaseId: flow.evidenceCaseId,
    identity: clone(flow.identity),
    intakeId: flow.intakeId,
    discoveryId: evidenceCase.discoveryId,
    packageId: request.packageId,
    handoffId: request.handoffId,
    providerType: request.providerType,
    request: clone(request),
  }))
  const attemptReference = flow.attemptRefs.at(-1)
  const attemptSession = sessions.find((item) => item.researchRequestId === attemptReference.researchRequestId)
  const attempt = {
    ...storeRecord('connectorAttempts', flow.identity.projectId, flow.executionFlowId),
    connectorAttemptId: attemptReference.connectorAttemptId,
    researchSessionId: attemptSession.researchSessionId,
    researchRequestId: attemptSession.researchRequestId,
    discoveryId: evidenceCase.discoveryId,
  }
  repository.discovery.records.push(discovery)
  repository.research.records.push(...sessions)
  repository.evidenceCases.records.push(evidenceCase)
  repository.connectorAttempts.records.push(attempt)
}

async function persistExecutionRecord(persistence, finalRecord) {
  let current = createExecutionFlow({ identity: finalRecord.identity, intakeId: finalRecord.intakeId, routingFingerprint: finalRecord.routingFingerprint }, finalRecord.createdAt)
  await persistence.create(current)
  const advance = async (nextState, patch) => {
    current = (await persistence.compareAndSet(current.executionFlowId, { expectedStates: [current.state], expectedRevision: current.revision, nextState, patch, updatedAt: now })).record
  }
  await advance('prepare_research', { packageRefs: finalRecord.packageRefs, pendingOperations: ['prepare_research'] })
  await advance('prepare_attempts', { researchPlanId: finalRecord.researchPlanId, evidenceCaseId: finalRecord.evidenceCaseId, requestRefs: finalRecord.requestRefs, pendingOperations: ['prepare_attempts'] })
  await advance('ready_for_execution', { attemptRefs: finalRecord.attemptRefs, pendingOperations: [] })
  if (finalRecord.state === 'explicit_execution') await advance('explicit_execution', { pendingOperations: ['explicit_execution'] })
  return current
}

function executionDependencyStubs(runtime) {
  return {
    discovery: { async reopen() { throw new Error('not used') }, async prepareResearchContext() { throw new Error('not used') } },
    research: {
      async plan() { throw new Error('not used') },
      getContributionContext() { throw new Error('not used') },
      async reopenEvidenceCase() { throw new Error('not used') },
      async retryEvidenceCase() { throw new Error('not used') },
      async withExactEvidenceCaseSnapshots(projectId, snapshots, work) {
        return work(snapshots.map((snapshot) => ({ evidenceCaseId: snapshot.evidenceCaseId, view: null })))
      },
    },
    runtime,
  }
}

test('exports versionados y batch maximo cerrado', async () => {
  assert.equal(BATCH_MAX, 50)
  assert.equal(DIAGNOSIS_SCHEMA, 'jefe-supervised-research-recovery-diagnosis/v1')
  assert.equal(STATUS_SCHEMA, 'jefe-supervised-research-recovery-status/v1')
  assert.equal(PLAN_SCHEMA, 'jefe-supervised-research-recovery-plan/v1')
  assert.equal(EXECUTION_SCHEMA, 'jefe-supervised-research-recovery-execution/v1')
})

test('constructor exige las ocho dependencias exactas', async () => {
  throwsCode(() => createSupervisedResearchRecovery({}), 'INVALID_RECOVERY_OPTIONS')
  const harness = await fakeHarness('constructor-extra')
  throwsCode(() => createSupervisedResearchRecovery({ ...harness.dependencies, authority: 'forged' }), 'INVALID_RECOVERY_OPTIONS')
})

test('constructor rechaza metodo publico faltante', async () => {
  const harness = await fakeHarness('constructor-method')
  const connectorRuntime = { ...harness.runtime }
  delete connectorRuntime.inspectConnectorHealth
  throwsCode(() => createSupervisedResearchRecovery({ ...harness.dependencies, connectorRuntime }), 'INVALID_RECOVERY_DEPENDENCY')
})

test('constructor exige authority roots absolutos', async () => {
  const harness = await fakeHarness('constructor-root')
  const discoveryPersistence = { ...harness.stores.discovery, authorityRoot: 'relative-root' }
  throwsCode(() => createSupervisedResearchRecovery({ ...harness.dependencies, discoveryPersistence }), 'INVALID_RECOVERY_DEPENDENCY')
})

test('API publica exacta y profundamente congelada', async () => {
  const { recovery } = await fakeHarness('api')
  assert.deepEqual(Object.keys(recovery).sort(), ['diagnoseRecovery', 'executeRecovery', 'getRecoveryStatus', 'planRecovery'])
  assert.equal(Object.isFrozen(recovery), true)
})

test('diagnostico rechaza claves laterales', async () => {
  const { recovery } = await fakeHarness('diagnose-closed')
  await rejectsCode(() => recovery.diagnoseRecovery({ projectId: 'project-valid', provider: 'forged' }), 'INVALID_RECOVERY_REQUEST')
})

test('status rechaza input incompleto', async () => {
  const { recovery } = await fakeHarness('status-closed')
  await rejectsCode(() => recovery.getRecoveryStatus({}), 'INVALID_RECOVERY_REQUEST')
})

test('plan rechaza claves laterales', async () => {
  const { recovery } = await fakeHarness('plan-closed')
  await rejectsCode(() => recovery.planRecovery({ projectId: 'project-valid', limit: 5, execute: true }), 'INVALID_RECOVERY_REQUEST')
})

test('executeRecovery exige exclusivamente plan', async () => {
  const harness = await fakeHarness('execute-closed')
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  await rejectsCode(() => harness.recovery.executeRecovery({ plan, force: true }), 'INVALID_RECOVERY_REQUEST')
})

test('projectId sigue la autoridad canonica sin underscore', async () => {
  const { recovery } = await fakeHarness('project-id')
  await rejectsCode(() => recovery.diagnoseRecovery({ projectId: 'project_invalid' }), 'INVALID_PROJECT_ID')
  assert.equal((await recovery.diagnoseRecovery({ projectId: 'project-valid' })).projectId, 'project-valid')
})

test('limite cero se rechaza', async () => {
  const { recovery } = await fakeHarness('limit-zero')
  await rejectsCode(() => recovery.planRecovery({ projectId: 'project-valid', limit: 0 }), 'INVALID_RECOVERY_LIMIT')
})

test('limite superior a cincuenta se rechaza', async () => {
  const { recovery } = await fakeHarness('limit-high')
  await rejectsCode(() => recovery.planRecovery({ projectId: 'project-valid', limit: 51 }), 'INVALID_RECOVERY_LIMIT')
})

test('limite cincuenta se conserva en todos los lotes', async () => {
  const { recovery } = await fakeHarness('limit-max')
  const plan = await recovery.planRecovery({ projectId: 'project-valid', limit: 50 })
  assert.equal(plan.batchLimit, 50)
  assert.deepEqual(plan.operations.filter((item) => item.mode === 'bounded_batch').map((item) => item.limit), [50, 50, 50])
})

test('diagnostico status y plan son read only sobre bytes', async () => {
  const harness = await fakeHarness('read-only')
  await harness.materializeIndexes()
  const before = await treeSnapshot(harness.base)
  await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  await harness.recovery.getRecoveryStatus({ projectId: 'project-valid' })
  await harness.recovery.planRecovery({ projectId: 'project-valid' })
  assert.deepEqual(await treeSnapshot(harness.base), before)
  assert.deepEqual({ attempts: harness.calls.reconcileAttempts, research: harness.calls.reconcileResearch, flows: harness.calls.reconcileFlows, health: harness.calls.rebuildHealth }, { attempts: 0, research: 0, flows: 0, health: 0 })
})

test('diagnostico de snapshot estable es determinista', async () => {
  const harness = await fakeHarness('diagnosis-deterministic')
  await harness.materializeIndexes()
  const first = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  const second = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.deepEqual(second, first)
  assert.match(first.snapshotFingerprint, /^[a-f0-9]{64}$/u)
})

test('diagnostico descarta torn read real entre caso y sesiones', async () => {
  const shell = await realShell('stable-snapshot-torn-read')
  const seeded = await seedRealResearch(shell, `stable-snapshot-${digest(shell.base).slice(0, 6)}`)
  const evidenceCaptured = deferred()
  const releaseResearch = deferred()
  let researchReads = 0
  let evidenceReads = 0
  const researchPersistence = {
    authorityRoot: shell.researchPersistence.authorityRoot,
    rebuildIndex: (...args) => shell.researchPersistence.rebuildIndex(...args),
    async listDetailed(...args) {
      researchReads += 1
      if (researchReads === 1) {
        await evidenceCaptured.promise
        await releaseResearch.promise
      }
      return shell.researchPersistence.listDetailed(...args)
    },
  }
  const evidenceCasePersistence = {
    authorityRoot: shell.evidenceCasePersistence.authorityRoot,
    rebuildIndex: (...args) => shell.evidenceCasePersistence.rebuildIndex(...args),
    async listDetailed(...args) {
      evidenceReads += 1
      const value = await shell.evidenceCasePersistence.listDetailed(...args)
      if (evidenceReads === 1) evidenceCaptured.resolve()
      return value
    },
  }
  const recovery = createSupervisedResearchRecovery({
    discoveryPersistence: shell.discoveryPersistence,
    researchPersistence,
    evidenceCasePersistence,
    connectorPersistence: shell.connectorPersistence,
    connectorRuntime: shell.connectorRuntime,
    research: seeded.research,
    executionPersistence: shell.executionPersistence,
    executionFlow: noOpExecutionFlow(),
  })
  const diagnosisPromise = recovery.diagnoseRecovery({ projectId: seeded.input.intake.identity.projectId })
  await evidenceCaptured.promise
  await seeded.research.receiveContribution(contribution(seeded.planned.radar, 'stable-snapshot-contribution'))
  const afterContribution = await treeSnapshot(shell.base)
  releaseResearch.resolve()
  const diagnosis = await diagnosisPromise
  const fresh = await recovery.diagnoseRecovery({ projectId: seeded.input.intake.identity.projectId })
  assert.deepEqual(diagnosis, fresh)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RESEARCH_SESSION_PROJECTION_CONFLICT'), false)
  assert.equal(diagnosis.boundaries.recoveryBlocked.some((item) => item.recordId === seeded.planned.evidenceCaseId), false)
  assert.deepEqual(await treeSnapshot(shell.base), afterContribution)
  assert.equal(shell.adapterCounter.calls, 0)
})

test('mismatch transitorio de status y health se reintenta antes de validar', async () => {
  const harness = await fakeHarness('stable-status-health')
  await harness.materializeIndexes()
  const before = await treeSnapshot(harness.base)
  const original = harness.runtime.getConnectorOperationalStatus.bind(harness.runtime)
  let structuredReads = 0
  harness.runtime.getConnectorOperationalStatus = async (providerType) => {
    const value = await original(providerType)
    if (providerType !== 'structured_analysis' || ++structuredReads !== 1) return value
    return { ...value, circuitState: 'unknown', operationalState: 'health_unknown' }
  }
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.equal(diagnosis.connectors.find((item) => item.providerType === 'structured_analysis').circuitState, 'closed')
  assert.equal(structuredReads, 3)
  assert.equal(harness.calls.reads, 15)
  assert.deepEqual(await treeSnapshot(harness.base), before)
})

test('snapshot perpetuamente inestable falla acotado y sin findings ni efectos', async () => {
  const harness = await fakeHarness('unstable-snapshot')
  harness.state.discovery.records.push(storeRecord('discovery', 'project-valid', 'unstable-snapshot'))
  await harness.materializeIndexes()
  const before = await treeSnapshot(harness.base)
  const original = harness.stores.discovery.listAllDetailed.bind(harness.stores.discovery)
  let collections = 0
  harness.stores.discovery.listAllDetailed = async () => {
    collections += 1
    harness.state.discovery.records[0].identity.runId = `run-${digest(`snapshot-churn-${collections}`).slice(0, 12)}`
    return original()
  }
  await rejectsCode(() => harness.recovery.diagnoseRecovery({ projectId: 'project-valid' }), 'RECOVERY_SNAPSHOT_UNSTABLE')
  assert.equal(collections, 3)
  assert.equal(harness.calls.reads, 15)
  assert.deepEqual(await treeSnapshot(harness.base), before)
  assert.deepEqual({ attempts: harness.calls.reconcileAttempts, research: harness.calls.reconcileResearch, flows: harness.calls.reconcileFlows, health: harness.calls.rebuildHealth }, { attempts: 0, research: 0, flows: 0, health: 0 })
  assert.equal(harness.calls.providers, 0)
  assert.equal(harness.calls.adapters, 0)
})

test('diagnostico sanitiza claim URL y payload laterales', async () => {
  const harness = await fakeHarness('sanitized')
  const secret = 'SECRET-CLAIM-https://secret.test/token'
  harness.state.evidenceCases.records.push({ ...storeRecord('evidenceCases', 'project-valid', 'secret'), claim: secret, rawPayload: secret })
  await harness.materializeIndexes()
  const serialized = canonical(await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' }))
  assert.equal(serialized.includes(secret), false)
  assert.equal(serialized.includes('secret.test'), false)
})

test('conteos y pendientes quedan aislados por proyecto', async () => {
  const harness = await fakeHarness('project-counts')
  const physicalIntake = storeRecord('discovery', 'project-alpha', 'physical-mismatch')
  const physicalFlow = storeRecord('executionFlows', 'project-alpha', 'physical-mismatch')
  physicalFlow.identity = { ...physicalFlow.identity, runId: 'run-adulterado', versionId: 'version-adulterada' }
  harness.state.discovery.records.push(physicalIntake)
  harness.state.executionFlows.records.push(physicalFlow)
  const attemptAlpha = addAttemptGraph(harness.state, 'project-alpha', 'alpha', { state: 'running' }).attempt
  const attemptBeta = addAttemptGraph(harness.state, 'project-beta', 'beta', { state: 'running' }).attempt
  await harness.materializeIndexes()
  const alpha = await harness.recovery.diagnoseRecovery({ projectId: 'project-alpha' })
  const beta = await harness.recovery.diagnoseRecovery({ projectId: 'project-beta' })
  assert.deepEqual(alpha.pending.connectorAttempts.map((item) => item.connectorAttemptId), [attemptAlpha.connectorAttemptId])
  assert.deepEqual(beta.pending.connectorAttempts.map((item) => item.connectorAttemptId), [attemptBeta.connectorAttemptId])
  assert.equal(alpha.integrityIssues.some((item) => item.code === 'PHYSICAL_IDENTITY_MISMATCH' && item.recordId === physicalFlow.executionFlowId && item.relatedId === physicalIntake.intakeId), true)
  assert.equal(canonical(alpha.integrityIssues).includes('run-adulterado'), false)

  const cross = await fakeHarness('cross-project-reference-target')
  const intakeA = storeRecord('discovery', 'project-alpha', 'cross-chain')
  const caseB = { ...storeRecord('evidenceCases', 'project-beta', 'cross-chain'), intakeId: intakeA.intakeId, discoveryId: `discovery-${intakeA.intakeId.slice(7)}` }
  const sessionB = { ...storeRecord('research', 'project-beta', 'cross-chain'), intakeId: intakeA.intakeId, discoveryId: caseB.discoveryId, evidenceCaseId: caseB.evidenceCaseId, researchPlanId: caseB.researchPlanId }
  const attemptB = { ...storeRecord('connectorAttempts', 'project-beta', 'cross-chain'), researchSessionId: sessionB.researchSessionId, researchRequestId: sessionB.researchRequestId, discoveryId: sessionB.discoveryId }
  cross.state.discovery.records.push(intakeA)
  cross.state.research.records.push(sessionB)
  cross.state.evidenceCases.records.push(caseB)
  cross.state.connectorAttempts.records.push(attemptB)
  await cross.materializeIndexes()
  const [crossA, crossB] = await Promise.all([
    cross.recovery.diagnoseRecovery({ projectId: 'project-alpha' }),
    cross.recovery.diagnoseRecovery({ projectId: 'project-beta' }),
  ])
  for (const diagnosis of [crossA, crossB]) {
    for (const recordId of [sessionB.researchSessionId, caseB.evidenceCaseId, attemptB.connectorAttemptId]) assert.equal(diagnosis.integrityIssues.some((item) => item.recordId === recordId && ['PHYSICAL_IDENTITY_MISMATCH', 'PROJECT_REFERENCE_MISMATCH'].includes(item.code)), true)
  }
  assert.equal(crossA.pending.researchCases.length + crossA.pending.connectorAttempts.length + crossA.pending.executionFlows.length, 0)
  assert.equal(crossB.pending.researchCases.length + crossB.pending.connectorAttempts.length + crossB.pending.executionFlows.length, 0)

  const split = await fakeHarness('split-session-reference-target')
  const splitA = addAttemptGraph(split.state, 'project-alpha', 'split-session-a')
  const splitB = addAttemptGraph(split.state, 'project-beta', 'split-session-b', { state: 'running' })
  splitB.attempt.researchSessionId = splitA.session.researchSessionId
  const splitDiscoveryB = addAttemptGraph(split.state, 'project-beta', 'split-discovery-b', { state: 'running' })
  splitDiscoveryB.attempt.discoveryId = splitA.session.discoveryId
  const splitCaseA = addEvidenceCase(split.state, 'project-alpha', 'split-delivery-case-a')
  const splitDeliveryB = addAttemptGraph(split.state, 'project-beta', 'split-delivery-b', { state: 'running' })
  splitDeliveryB.attempt.delivery = {
    deliveryId: id('connector-delivery', 'split-delivery-b'),
    researchSessionId: splitDeliveryB.session.researchSessionId,
    researchRequestId: splitDeliveryB.session.researchRequestId,
    researchPlanId: splitDeliveryB.session.researchPlanId,
    evidenceCaseId: splitCaseA.evidenceCase.evidenceCaseId,
    discoveryId: splitDeliveryB.session.discoveryId,
    projectId: splitDeliveryB.session.projectId,
    providerType: splitDeliveryB.session.providerType,
    connectorId: splitDeliveryB.attempt.connectorId,
    operation: splitDeliveryB.attempt.operation,
  }
  const splitSessionIdentityB = addAttemptGraph(split.state, 'project-beta', 'split-session-identity-b')
  splitSessionIdentityB.session.identity = clone(splitA.session.identity)
  const splitCaseIdentityB = addEvidenceCase(split.state, 'project-beta', 'split-case-identity-b')
  splitCaseIdentityB.evidenceCase.identity = clone(splitA.session.identity)
  const splitSessionDiscoveryB = addAttemptGraph(split.state, 'project-beta', 'split-session-discovery-b', { state: 'running' })
  splitSessionDiscoveryB.session.discoveryId = splitA.session.discoveryId
  const lineageA = addAttemptGraph(split.state, 'project-alpha', 'split-lineage-a', { state: 'failed_transient', errorCode: 'INTERRUPTED' })
  const lineageB = addAttemptGraph(split.state, 'project-beta', 'split-lineage-b', { state: 'running' })
  Object.assign(lineageB.attempt, { rootAttemptId: lineageA.attempt.connectorAttemptId, retryOfAttemptId: lineageA.attempt.connectorAttemptId, attemptNumber: 2 })
  lineageB.attempt.connectorAttemptId = retryConnectorAttemptId(lineageB.attempt)
  const forgedInitial = addAttemptGraph(split.state, 'project-beta', 'forged-initial-id', { state: 'running' })
  forgedInitial.attempt.connectorAttemptId = id('connector-attempt', 'forged-initial-id')
  await split.materializeIndexes()
  const splitBefore = await treeSnapshot(split.base)
  const [splitDiagnosisA, splitDiagnosisB] = await Promise.all([
    split.recovery.diagnoseRecovery({ projectId: 'project-alpha' }),
    split.recovery.diagnoseRecovery({ projectId: 'project-beta' }),
  ])
  for (const diagnosis of [splitDiagnosisA, splitDiagnosisB]) {
    assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RESEARCH_SESSION_REFERENCE_MISMATCH' && item.recordId === splitB.attempt.connectorAttemptId), true)
    assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'DISCOVERY_REFERENCE_MISMATCH' && item.recordId === splitDiscoveryB.attempt.connectorAttemptId), true)
    assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_CASE_REFERENCE_MISMATCH' && item.recordId === splitDeliveryB.attempt.connectorAttemptId), true)
    assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'PHYSICAL_IDENTITY_MISMATCH' && item.recordId === splitSessionIdentityB.session.researchSessionId), true)
    assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'PHYSICAL_IDENTITY_MISMATCH' && item.recordId === splitCaseIdentityB.evidenceCase.evidenceCaseId), true)
    assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'DISCOVERY_REFERENCE_MISMATCH' && item.recordId === splitSessionDiscoveryB.session.researchSessionId), true)
    assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'PROJECT_REFERENCE_MISMATCH' && item.recordId === lineageB.attempt.connectorAttemptId && item.relatedId === lineageA.attempt.connectorAttemptId), true)
    for (const recordId of [splitB.attempt.connectorAttemptId, splitDiscoveryB.attempt.connectorAttemptId, splitDeliveryB.attempt.connectorAttemptId, splitSessionDiscoveryB.attempt.connectorAttemptId, lineageB.attempt.connectorAttemptId]) assert.equal(diagnosis.boundaries.recoveryBlocked.some((item) => item.kind === 'connector_attempt' && item.recordId === recordId), true)
    assert.equal(diagnosis.pending.connectorAttempts.length, 0)
  }
  assert.equal(splitDiagnosisB.integrityIssues.some((item) => item.code === 'CONNECTOR_REFERENCE_MISMATCH' && item.recordId === forgedInitial.attempt.connectorAttemptId), true)
  assert.equal(splitDiagnosisB.boundaries.recoveryBlocked.some((item) => item.recordId === forgedInitial.attempt.connectorAttemptId), true)
  assert.deepEqual(await treeSnapshot(split.base), splitBefore)
})

test('corrupcion de los cinco stores nunca se oculta', async () => {
  const harness = await fakeHarness('five-corruptions')
  harness.state.discovery.corruptions.push({ intakeId: id('intake', 'corrupt-discovery'), code: 'CORRUPT_INTAKE' })
  harness.state.research.corruptions.push({ researchSessionId: id('research-session', 'corrupt-research'), code: 'CORRUPT_SESSION' })
  harness.state.evidenceCases.corruptions.push({ evidenceCaseId: id('evidence-case', 'corrupt-evidence'), code: 'CORRUPT_EVIDENCE_CASE' })
  harness.state.connectorAttempts.corruptions.push({ connectorAttemptId: id('connector-attempt', 'corrupt-connector'), code: 'CORRUPT_ATTEMPT' })
  harness.state.executionFlows.corruptions.push({ executionFlowId: id('research-execution', 'corrupt-flow'), code: 'CORRUPT_EXECUTION_FLOW' })
  await harness.materializeIndexes()
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.equal(diagnosis.corruptions.length, 5)
  assert.deepEqual([...new Set(diagnosis.corruptions.map((item) => item.store))].sort(), ['connectorAttempts', 'discovery', 'evidenceCases', 'executionFlows', 'research'])
  assert.equal(diagnosis.boundaries.recoveryBlocked.length, 5)
  assert.equal(diagnosis.boundaries.recoveryBlocked.every((item) => canonical(Object.keys(item).sort()) === canonical(['blockers', 'kind', 'recordId']) && item.blockers.every((blocker) => canonical(Object.keys(blocker).sort()) === canonical(['code', 'kind', 'recordId', 'relatedId']))), true)
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  assert.equal(plan.operations.slice(0, 3).every((item) => item.candidateCount === 0), true)
  const result = await harness.recovery.executeRecovery({ plan })
  assert.equal(result.state, 'completed_with_findings')
  assert.equal(result.finalStatus.recoveryCandidates, 0)
})

test('indices missing fuerzan recovery required', async () => {
  const harness = await fakeHarness('missing-derived')
  const status = await harness.recovery.getRecoveryStatus({ projectId: 'project-valid' })
  assert.equal(status.schemaVersion, STATUS_SCHEMA)
  assert.equal(status.state, 'recovery_required')
  assert.equal(status.indexRepairs, 5)
  assert.equal(status.recoveryGate.blockers.includes('DERIVED_INDEX_REPAIR_REQUIRED'), true)
})

test('frontera humana tiene precedencia sobre ejecucion explicita', async () => {
  const harness = await fakeHarness('human-precedence')
  const intake = storeRecord('discovery', 'project-valid', 'boundary')
  harness.state.discovery.records.push(intake)
  harness.state.evidenceCases.records.push({ ...storeRecord('evidenceCases', 'project-valid', 'boundary'), state: 'requires_human', contradictionStatus: 'preserved' })
  harness.state.executionFlows.records.push({ ...storeRecord('executionFlows', 'project-valid', 'boundary'), intakeId: intake.intakeId })
  await harness.materializeIndexes()
  const status = await harness.recovery.getRecoveryStatus({ projectId: 'project-valid' })
  assert.equal(status.humanBoundaries, 1)
  assert.equal(status.explicitBoundaries, 1)
  assert.equal(status.state, 'human_action_required')
})

test('plan estable es determinista sin reloj', async () => {
  const harness = await fakeHarness('plan-deterministic')
  await harness.materializeIndexes()
  const first = await harness.recovery.planRecovery({ projectId: 'project-valid', limit: 7 })
  const second = await harness.recovery.planRecovery({ projectId: 'project-valid', limit: 7 })
  assert.deepEqual(second, first)
})

test('plan id queda ligado al contenido completo', async () => {
  const harness = await fakeHarness('plan-content')
  await harness.materializeIndexes()
  const small = await harness.recovery.planRecovery({ projectId: 'project-valid', limit: 4 })
  const large = await harness.recovery.planRecovery({ projectId: 'project-valid', limit: 5 })
  assert.match(small.recoveryPlanId, /^research-recovery-[a-f0-9]{32}$/u)
  assert.notEqual(small.recoveryPlanId, large.recoveryPlanId)
  assert.equal(Object.isFrozen(small.operations[0]), true)
})

test('plan contiene nueve operaciones en orden seguro exacto', async () => {
  const { recovery } = await fakeHarness('operation-order')
  const plan = await recovery.planRecovery({ projectId: 'project-valid' })
  assert.deepEqual(plan.operations.map((item) => item.type), [
    'reconcile_connector_attempts',
    'reconcile_pending_research',
    'reconcile_execution_flows',
    'rebuild_discovery_index',
    'rebuild_research_index',
    'rebuild_evidence_case_index',
    'rebuild_connector_index',
    'rebuild_execution_index',
    'rebuild_connector_health',
  ])
  assert.deepEqual(plan.operations.map((item) => item.sequence), [1, 2, 3, 4, 5, 6, 7, 8, 9])
})

test('plan distingue alcance proyecto de authority root', async () => {
  const { recovery } = await fakeHarness('operation-scopes')
  const plan = await recovery.planRecovery({ projectId: 'project-valid' })
  assert.deepEqual(plan.operations.slice(0, 3).map((item) => item.scope), ['project', 'project', 'project'])
  assert.equal(plan.operations.slice(3).every((item) => item.scope === 'authority_root'), true)
})

test('batch custom nunca se aplica a rebuild global', async () => {
  const { recovery } = await fakeHarness('batch-global')
  const plan = await recovery.planRecovery({ projectId: 'project-valid', limit: 11 })
  assert.equal(plan.operations.slice(0, 3).every((item) => item.limit === 11), true)
  assert.equal(plan.operations.slice(3).every((item) => item.limit === null), true)
})

test('plan declara retencion conservadora y cero autoridad', async () => {
  const { recovery } = await fakeHarness('retention')
  const plan = await recovery.planRecovery({ projectId: 'project-valid' })
  assert.deepEqual(plan.safety, { adaptersAllowed: false, providersAllowed: false, humanResolutionAllowed: false, deletionsAllowed: false, corruptionsPreserved: true })
})

test('plan no contiene timestamps ni instrucciones ejecutables', async () => {
  const { recovery } = await fakeHarness('no-timestamps')
  const serialized = canonical(await recovery.planRecovery({ projectId: 'project-valid' }))
  assert.equal(/createdAt|updatedAt|plannedAt|executeNext|executePreparedAttempt/u.test(serialized), false)
})

test('ninguna mutacion ocurre antes de executeRecovery explicito', async () => {
  const harness = await fakeHarness('explicit-only')
  await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  await harness.recovery.getRecoveryStatus({ projectId: 'project-valid' })
  await harness.recovery.planRecovery({ projectId: 'project-valid' })
  assert.deepEqual({ attempts: harness.calls.reconcileAttempts, research: harness.calls.reconcileResearch, flows: harness.calls.reconcileFlows, indexes: harness.calls.rebuilds.length, health: harness.calls.rebuildHealth }, { attempts: 0, research: 0, flows: 0, indexes: 0, health: 0 })
})

test('plan estructuralmente invalido se rechaza', async () => {
  const harness = await fakeHarness('invalid-plan')
  const { recovery } = harness
  await rejectsCode(() => recovery.executeRecovery({ plan: {} }), 'INVALID_RECOVERY_PLAN')
  await harness.materializeIndexes()
  const tampered = clone(await recovery.planRecovery({ projectId: 'project-valid' }))
  tampered.operations[0].type = 'execute_provider'
  await rejectsCode(() => recovery.executeRecovery({ plan: tampered }), 'INVALID_RECOVERY_PLAN')
  assert.equal(harness.calls.providers, 0)
  assert.equal(harness.calls.adapters, 0)
})

test('candidato nuevo posterior al snapshot no es absorbido por allowlist vacia', async () => {
  let injected = null
  const harness = await fakeHarness('post-snapshot-candidate', {
    onReconcileAttempts({ state, suppliedCandidates }) {
      assert.deepEqual(suppliedCandidates, [])
      injected = addEvidenceCase(state, 'project-valid', 'late-memory', { state: 'accepted_for_context', pendingOperations: ['memory_append'], memory: { status: 'pending', entryId: id('research-evidence', 'late-memory') } }).evidenceCase
    },
  })
  await harness.materializeIndexes()
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  assert.equal(plan.operations.find((item) => item.type === 'reconcile_pending_research').candidateCount, 0)
  const rebuildsBefore = harness.calls.rebuilds.length
  const result = await harness.recovery.executeRecovery({ plan })
  assert.equal(injected.memory.status, 'pending')
  assert.deepEqual(injected.pendingOperations, ['memory_append'])
  assert.equal(result.finalStatus.recoveryCandidates, 1)
  assert.equal(result.finalStatus.indexRepairs, 2)
  assert.equal(harness.calls.rebuilds.length, rebuildsBefore)
  assert.deepEqual(result.operations.find((item) => item.type === 'rebuild_evidence_case_index'), { sequence: 6, type: 'rebuild_evidence_case_index', status: 'completed', processed: 0, remaining: 0, idempotent: true, recovered: 0, corruptionCount: 0, adaptersExecuted: 0, errorCode: null })
})

test('candidato planificado que cambia revision aborta stale antes de mutarlo', async () => {
  let pending
  const harness = await fakeHarness('candidate-revision-stale', {
    onReconcileAttempts({ state }) {
      const current = state.evidenceCases.records.find((item) => item.evidenceCaseId === pending.evidenceCaseId)
      current.revision += 1
    },
  })
  pending = addEvidenceCase(harness.state, 'project-valid', 'planned-memory', { state: 'accepted_for_context', pendingOperations: ['memory_append'], memory: { status: 'pending', entryId: id('research-evidence', 'planned-memory') } }).evidenceCase
  await harness.materializeIndexes()
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  assert.equal(plan.operations.find((item) => item.type === 'reconcile_pending_research').candidateCount, 1)
  await rejectsCode(() => harness.recovery.executeRecovery({ plan }), 'STALE_RECOVERY_PLAN')
  assert.equal(pending.memory.status, 'pending')
  assert.deepEqual(pending.pendingOperations, ['memory_append'])
})

test('replay tras reparar derivados exige plan nuevo', async () => {
  const harness = await fakeHarness('replay-stale')
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  await harness.recovery.executeRecovery({ plan })
  await rejectsCode(() => harness.recovery.executeRecovery({ plan }), 'STALE_RECOVERY_PLAN')
})

test('restart acepta replay idempotente si snapshot sigue fresco', async () => {
  const harness = await fakeHarness('restart-replay')
  await harness.materializeIndexes()
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  const first = await harness.recovery.executeRecovery({ plan })
  const reopened = createSupervisedResearchRecovery(harness.dependencies)
  const second = await reopened.executeRecovery({ plan })
  assert.equal(first.safety.adaptersExecuted, 0)
  assert.equal(second.idempotent, true)
  assert.equal(second.recoveryPlanId, plan.recoveryPlanId)
})

test('lock module global serializa mismo root y proyecto', async () => {
  const gate = controlledGate()
  const harness = await fakeHarness('lock-same-project', { gate })
  await harness.materializeIndexes()
  const aliasBase = `${harness.base}-physical-alias`
  await fs.promises.symlink(harness.base, aliasBase, process.platform === 'win32' ? 'junction' : 'dir')
  const aliasDependency = (dependency) => ({ ...dependency, authorityRoot: path.join(aliasBase, path.relative(harness.base, dependency.authorityRoot)) })
  const aliasDependencies = {
    ...harness.dependencies,
    discoveryPersistence: aliasDependency(harness.dependencies.discoveryPersistence),
    researchPersistence: aliasDependency(harness.dependencies.researchPersistence),
    evidenceCasePersistence: aliasDependency(harness.dependencies.evidenceCasePersistence),
    connectorPersistence: aliasDependency(harness.dependencies.connectorPersistence),
    executionPersistence: aliasDependency(harness.dependencies.executionPersistence),
  }
  const left = createSupervisedResearchRecovery(harness.dependencies)
  const right = createSupervisedResearchRecovery(aliasDependencies)
  const plan = await left.planRecovery({ projectId: 'project-valid' })
  const executions = Promise.all([left.executeRecovery({ plan }), right.executeRecovery({ plan })])
  await gate.waitForEntries(1)
  assert.equal(gate.entries, 1)
  gate.releaseOne()
  await gate.waitForEntries(2)
  gate.releaseOne()
  await executions
  assert.equal(harness.tracker.maximum, 1)
})

test('lock authority root serializa proyectos A y B', async () => {
  const gate = controlledGate()
  const harness = await fakeHarness('lock-ab', { gate })
  await harness.materializeIndexes()
  const planA = await harness.recovery.planRecovery({ projectId: 'project-alpha' })
  const planB = await harness.recovery.planRecovery({ projectId: 'project-beta' })
  const executions = Promise.all([harness.recovery.executeRecovery({ plan: planA }), harness.recovery.executeRecovery({ plan: planB })])
  await gate.waitForEntries(1)
  assert.equal(gate.entries, 1)
  gate.releaseOne()
  await gate.waitForEntries(2)
  gate.releaseOne()
  await executions
  assert.equal(harness.tracker.maximum, 1)
})

test('authority roots repetidos se deduplican sin auto-deadlock', async () => {
  const base = path.join(root, `fake-${String(++sequence).padStart(3, '0')}-shared-authority-root`)
  const harness = await fakeHarness('shared-authority-root', { base, sharedAuthorityRoot: path.join(base, 'shared') })
  await harness.materializeIndexes()
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  const result = await harness.recovery.executeRecovery({ plan })
  assert.equal(result.state, 'completed')
  assert.equal(result.safety.adaptersExecuted, 0)
})

test('roots independientes no comparten lock global', async () => {
  const tracker = { active: 0, maximum: 0 }
  const gate = controlledGate()
  const left = await fakeHarness('lock-root-left', { gate, tracker })
  const right = await fakeHarness('lock-root-right', { gate, tracker })
  await Promise.all([left.materializeIndexes(), right.materializeIndexes()])
  const planLeft = await left.recovery.planRecovery({ projectId: 'project-valid' })
  const planRight = await right.recovery.planRecovery({ projectId: 'project-valid' })
  const executions = Promise.all([left.recovery.executeRecovery({ plan: planLeft }), right.recovery.executeRecovery({ plan: planRight })])
  await gate.waitForEntries(2)
  assert.equal(gate.entries, 2)
  gate.releaseAll()
  await executions
  assert.equal(tracker.maximum, 2)
})

test('recovery A no modifica registros de B', async () => {
  const harness = await fakeHarness('isolation-ab')
  const attemptA = addAttemptGraph(harness.state, 'project-alpha', 'isolation-a', { state: 'running' }).attempt
  const attemptB = addAttemptGraph(harness.state, 'project-beta', 'isolation-b', { state: 'running' }).attempt
  await harness.materializeIndexes()
  const beforeB = canonical(attemptB)
  const plan = await harness.recovery.planRecovery({ projectId: 'project-alpha' })
  await harness.recovery.executeRecovery({ plan })
  assert.equal(attemptA.state, 'failed_transient')
  assert.equal(canonical(attemptB), beforeB)
})

test('fallo de una operacion queda parcial y sanitizado', async () => {
  const harness = await fakeHarness('partial-failure', { failResearch: true })
  addEvidenceCase(harness.state, 'project-valid', 'pending', { state: 'accepted_for_context', pendingOperations: ['memory_append'], memory: { status: 'pending', entryId: id('research-evidence', 'pending') } })
  await harness.materializeIndexes()
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  const result = await harness.recovery.executeRecovery({ plan })
  const operation = result.operations.find((item) => item.type === 'reconcile_pending_research')
  assert.equal(result.state, 'partial')
  assert.equal(operation.status, 'failed')
  assert.equal(operation.errorCode, 'RESEARCH_RECONCILE_FAILED')
  assert.equal(canonical(result).includes('secret research failure'), false)
})

test('declaracion de adapter ejecutado corta fail closed', async () => {
  const harness = await fakeHarness('adapter-violation', { flowAdaptersExecuted: 1 })
  await harness.materializeIndexes()
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  await rejectsCode(() => harness.recovery.executeRecovery({ plan }), 'RECOVERY_SAFETY_VIOLATION')
})

test('inspeccion distingue indice missing', async () => {
  const harness = await fakeHarness('index-missing')
  await harness.materializeIndexes()
  await fs.promises.unlink(path.join(harness.roots.discovery, 'discovery-index.json'))
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.deepEqual(diagnosis.indexes.find((item) => item.store === 'discovery'), { store: 'discovery', scope: 'authority_root', expectedRecordCount: 0, state: 'missing', indexedRecordCount: 0, repairRequired: true })
})

test('inspeccion distingue indice JSON corrupto', async () => {
  const harness = await fakeHarness('index-corrupt')
  await harness.materializeIndexes()
  await fs.promises.writeFile(path.join(harness.roots.research, 'research-session-index.json'), '{broken', 'utf8')
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.equal(diagnosis.indexes.find((item) => item.store === 'research').state, 'corrupt')
})

test('inspeccion rechaza claves laterales en indice', async () => {
  const harness = await fakeHarness('index-lateral')
  await harness.materializeIndexes()
  const target = path.join(harness.roots.connectorAttempts, 'attempt-index.json')
  const value = JSON.parse(await fs.promises.readFile(target, 'utf8'))
  value.authority = 'forged'
  await fs.promises.writeFile(target, JSON.stringify(value), 'utf8')
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.equal(diagnosis.indexes.find((item) => item.store === 'connectorAttempts').state, 'corrupt')
})

test('inspeccion detecta asociaciones adulteradas con IDs intactos', async () => {
  const harness = await fakeHarness('index-association')
  harness.state.discovery.records.push(storeRecord('discovery', 'project-valid', 'association'))
  await harness.materializeIndexes()
  const target = path.join(harness.roots.discovery, 'discovery-index.json')
  const value = JSON.parse(await fs.promises.readFile(target, 'utf8'))
  value.projectAssociations[0].projectId = 'project-forged'
  await fs.promises.writeFile(target, JSON.stringify(value), 'utf8')
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  const inspected = diagnosis.indexes.find((item) => item.store === 'discovery')
  assert.equal(inspected.indexedRecordCount, 1)
  assert.equal(inspected.state, 'drifted')
  assert.equal(inspected.repairRequired, true)
})

test('execute reconstruye los cinco indices y verifica present', async () => {
  const harness = await fakeHarness('five-index-rebuilds')
  const plan = await harness.recovery.planRecovery({ projectId: 'project-valid' })
  const result = await harness.recovery.executeRecovery({ plan })
  const after = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.deepEqual(harness.calls.rebuilds, ['discovery', 'research', 'evidenceCases', 'connectorAttempts', 'executionFlows'])
  assert.equal(after.indexes.every((item) => item.state === 'present' && item.repairRequired === false), true)
  assert.equal(result.operations.filter((item) => item.type.includes('index')).every((item) => item.status === 'completed'), true)
})

test('processed de indice refleja root global y no conteo del proyecto', async () => {
  const harness = await fakeHarness('global-index-count')
  harness.state.discovery.records.push(storeRecord('discovery', 'project-alpha', 'global-a'), storeRecord('discovery', 'project-beta', 'global-b'))
  const plan = await harness.recovery.planRecovery({ projectId: 'project-alpha' })
  assert.equal(plan.operations.find((item) => item.type === 'rebuild_discovery_index').candidateCount, 2)
  const result = await harness.recovery.executeRecovery({ plan })
  assert.equal(result.operations.find((item) => item.type === 'rebuild_discovery_index').processed, 2)
})

test('health missing se diagnostica y reconstruye desde runtime publico', async () => {
  const shell = await realShell('health-missing')
  const before = await shell.recovery.diagnoseRecovery({ projectId: 'project-health' })
  assert.equal(before.connectorHealth.items.some((item) => item.drift === 'missing' && item.repairRequired), true)
  const plan = await shell.recovery.planRecovery({ projectId: 'project-health' })
  const result = await shell.recovery.executeRecovery({ plan })
  assert.equal(result.finalStatus.healthRepairs, 0)
  assert.equal(result.finalStatus.indexRepairs, 0)
  assert.equal((await shell.connectorRuntime.inspectConnectorHealth()).items.every((item) => item.drift === 'none'), true)
  const statusMutations = [
    (value) => ({ ...value, schemaVersion: 'wrong/v1' }),
    (value) => ({ ...value, connectorId: 'connector-adulterado' }),
    (value) => ({ ...value, realConnector: true, fixture: true }),
    (value) => ({ ...value, lateral: true }),
  ]
  for (let index = 0; index < statusMutations.length; index += 1) {
    const trap = await fakeHarness(`status-shape-trap-${index}`)
    await trap.materializeIndexes()
    const original = trap.runtime.getConnectorOperationalStatus.bind(trap.runtime)
    trap.runtime.getConnectorOperationalStatus = async (providerType) => providerType === 'structured_analysis' ? statusMutations[index](await original(providerType)) : original(providerType)
    await rejectsCode(() => trap.recovery.diagnoseRecovery({ projectId: 'project-valid' }), 'INVALID_RECOVERY_DEPENDENCY_RESULT')
  }
})

test('health corrupt se repara y source partial permanece visible', async () => {
  const shell = await realShell('health-corrupt')
  await shell.recovery.executeRecovery({ plan: await shell.recovery.planRecovery({ projectId: 'project-health' }) })
  const healthFile = path.join(shell.connectorPersistence.authorityRoot, 'health-structured-analysis-local.json')
  await fs.promises.writeFile(healthFile, '{broken', 'utf8')
  const corrupt = await shell.recovery.diagnoseRecovery({ projectId: 'project-health' })
  assert.equal(corrupt.connectorHealth.items.find((item) => item.providerType === 'structured_analysis').drift, 'corrupt')
  await shell.recovery.executeRecovery({ plan: await shell.recovery.planRecovery({ projectId: 'project-health' }) })
  assert.equal((await shell.connectorRuntime.inspectConnectorHealth('structured_analysis')).drift, 'none')
  const corruptAttempt = path.join(shell.connectorPersistence.authorityRoot, `${id('connector-attempt', 'partial-source')}.json`)
  await fs.promises.writeFile(corruptAttempt, '{broken', 'utf8')
  const partialPlan = await shell.recovery.planRecovery({ projectId: 'project-health' })
  const partial = await shell.recovery.executeRecovery({ plan: partialPlan })
  assert.ok(partial.finalStatus.healthSourceIncomplete > 0)
  assert.equal(partial.finalStatus.state, 'degraded')
  assert.equal(partial.state, 'completed_with_findings')
  assert.equal(partial.finalStatus.recoveryCandidates, 0)
  assert.equal(partial.finalStatus.healthRepairs, 0)
  assert.equal(await fs.promises.readFile(corruptAttempt, 'utf8'), '{broken')
  const partialReplay = await shell.recovery.executeRecovery({ plan: await shell.recovery.planRecovery({ projectId: 'project-health' }) })
  assert.equal(partialReplay.state, 'completed_with_findings')
  const healthMutations = [
    (item) => ({ ...item, sourceIntegrity: 'partial', drift: 'unknown', derivedHealth: healthSnapshot(item.connectorId) }),
    (item) => ({ ...item, drift: 'none', materializedHealth: healthSnapshot(item.connectorId, 'open'), derivedHealth: healthSnapshot(item.connectorId) }),
    (item) => ({ ...item, connectorId: 'connector-adulterado' }),
  ]
  for (let index = 0; index < healthMutations.length; index += 1) {
    const trap = await fakeHarness(`health-shape-trap-${index}`)
    await trap.materializeIndexes()
    const original = trap.runtime.inspectConnectorHealth.bind(trap.runtime)
    trap.runtime.inspectConnectorHealth = async () => {
      const value = await original()
      value.items[0] = healthMutations[index](value.items[0])
      return value
    }
    await rejectsCode(() => trap.recovery.diagnoseRecovery({ projectId: 'project-valid' }), 'INVALID_RECOVERY_DEPENDENCY_RESULT')
  }
})

test('running interrumpido converge sin llamar adapter', async () => {
  const shell = await realShell('interrupted-running')
  const seeded = await seedRealResearch(shell, 'interrupted-running')
  const context = seeded.research.getContributionContext(seeded.planned.radar.researchRequestId)
  const raw = { researchSessionId: context.researchSessionId, researchRequestId: context.researchRequestId, discoveryId: context.discoveryId, projectId: context.projectId, providerType: context.providerType, operation: 'reference' }
  const prepared = await shell.connectorRuntime.prepareConnectorAttempt(raw)
  await shell.connectorPersistence.claimExecution(prepared.record.connectorAttemptId, { expectedRevision: prepared.record.revision, now, maxTransientFailures: Number.MAX_SAFE_INTEGER, circuitCooldownMs: 60000 })
  const plan = await shell.recovery.planRecovery({ projectId: context.projectId })
  const result = await shell.recovery.executeRecovery({ plan })
  const saved = await shell.connectorPersistence.read(prepared.record.connectorAttemptId)
  assert.equal(saved.state, 'failed_transient')
  assert.equal(saved.errorCode, 'INTERRUPTED')
  assert.equal(shell.adapterCounter.calls, 0)
  assert.equal(result.operations.find((item) => item.type === 'reconcile_connector_attempts').processed, 1)
})

test('delivery pendiente queda frontera explicita y no ejecuta provider', async () => {
  const harness = await fakeHarness('delivery-boundary')
  const linked = addLinkedAttemptGraph(harness.state, 'project-delivery', 'delivery', { state: 'contributing' })
  const { attempt, evidenceCase, intake, session } = linked
  attempt.delivery = { state: 'pending', deliveryId: id('connector-delivery', 'delivery'), researchSessionId: session.researchSessionId, researchRequestId: session.researchRequestId, researchPlanId: evidenceCase.researchPlanId, evidenceCaseId: evidenceCase.evidenceCaseId, discoveryId: attempt.discoveryId, projectId: attempt.projectId, providerType: attempt.providerType, connectorId: attempt.connectorId, operation: attempt.operation }
  const flow = { ...storeRecord('executionFlows', 'project-delivery', 'delivery'), intakeId: intake.intakeId, identity: intake.identity, state: 'resume_delivery', pendingOperations: ['resume_delivery'], attemptRefs: [{ researchRequestId: attempt.researchRequestId, connectorAttemptId: attempt.connectorAttemptId }] }
  harness.state.executionFlows.records.push(flow)
  await harness.materializeIndexes()
  const before = await harness.recovery.diagnoseRecovery({ projectId: 'project-delivery' })
  assert.equal(before.pending.connectorAttempts.length, 1)
  assert.equal(before.pending.executionFlows.length, 0)
  assert.equal(before.boundaries.deliveryPending.length, 1)
  const result = await harness.recovery.executeRecovery({ plan: await harness.recovery.planRecovery({ projectId: 'project-delivery' }) })
  assert.equal(attempt.state, 'failed_transient')
  assert.equal(attempt.delivery.state, 'pending')
  assert.equal(flow.state, 'resume_delivery')
  assert.deepEqual(result.safety, { adaptersExecuted: 0, providersExecuted: 0, humanDecisionsApplied: 0, recordsDeleted: 0, corruptionsHidden: 0 })
})

test('terminal entregado exige receipt contribucion y evidencia durables exactos', async () => {
  const harness = await fakeHarness('terminal-evidence-integrity')
  const terminal = (token, { omitReceipt = false, omitDecision = false, forgedEvidence = false, aggregateEvidence = false, aggregateNotExecuted = false, aggregateAfterDelivery = false, receiptAfterDelivery = false, receiptBeforeDeliveryCreation = false, rawMismatch = false, budgetMismatch = false, partialAsSucceeded = false, evidencePending = false, mismatchedResearchState = false, missingUpdatedAt = false } = {}) => {
    const linked = addLinkedAttemptGraph(harness.state, 'project-terminal-integrity', token)
    const receiptId = id('receipt', token)
    const claim = `Claim durable ${token}`
    const afterDelivery = '2026-08-25T12:00:01.000Z'
    const storedReceipt = { schemaVersion: 'jefe-provider-receipt/v1', receiptId, researchRequestId: linked.attempt.researchRequestId, providerType: linked.attempt.providerType, operation: linked.attempt.operation, status: partialAsSucceeded ? 'partial' : 'received', mimeType: 'text/plain', bytes: 32, contentHash: digest(`${token}:own-content`), excerpt: `Contenido durable ${token}`, method: 'controlled_adapter', redirects: [], codes: [], consumed: {}, classification: 'UNTRUSTED_EXTERNAL_CONTENT', receivedAt: receiptAfterDelivery ? afterDelivery : now }
    const budget = { maxQueries: 2, maxSources: 4 }
    linked.evidenceCase.requests[0].budget = clone(budget)
    linked.session.request = clone(linked.evidenceCase.requests[0])
    const aggregateReceiptId = id('receipt', `${token}:aggregate`)
    const aggregateClaim = claim
    const aggregateReceipt = { ...storedReceipt, receiptId: aggregateReceiptId, status: aggregateNotExecuted ? 'not_executed' : storedReceipt.status, contentHash: digest(`${token}:aggregate-content`), excerpt: `Contenido agregado ${token}`, receivedAt: aggregateAfterDelivery ? afterDelivery : now }
    linked.evidenceCase.receipts = omitReceipt ? [] : [storedReceipt, ...(aggregateEvidence ? [aggregateReceipt] : [])]
    linked.evidenceCase.contributions = [{ researchRequestId: linked.attempt.researchRequestId, receiptId, claim }, ...(aggregateEvidence ? [{ researchRequestId: linked.attempt.researchRequestId, receiptId: aggregateReceiptId, claim: aggregateClaim }] : [])]
    linked.attempt.state = 'succeeded'
    linked.attempt.createdAt = now
    const deliveryAt = receiptBeforeDeliveryCreation ? afterDelivery : now
    if (!missingUpdatedAt) linked.attempt.updatedAt = deliveryAt
    linked.attempt.receipt = { status: storedReceipt.status, classification: 'UNTRUSTED_EXTERNAL_CONTENT', receiptId }
    linked.attempt.delivery = { state: 'delivered', deliveryId: id('connector-delivery', token), sourceAttemptId: linked.attempt.connectorAttemptId, researchSessionId: linked.session.researchSessionId, researchRequestId: linked.session.researchRequestId, researchPlanId: linked.evidenceCase.researchPlanId, evidenceCaseId: linked.evidenceCase.evidenceCaseId, discoveryId: linked.attempt.discoveryId, projectId: linked.attempt.projectId, providerType: linked.attempt.providerType, connectorId: linked.attempt.connectorId, operation: linked.attempt.operation, budget, rawReceipt: Object.fromEntries(Object.entries(storedReceipt).filter(([field]) => !['receiptId', 'receivedAt'].includes(field))), claim, createdAt: deliveryAt, deliveredAt: deliveryAt, receiptId }
    delete linked.attempt.delivery.rawReceipt.schemaVersion
    delete linked.attempt.delivery.rawReceipt.classification
    if (rawMismatch) linked.attempt.delivery.rawReceipt = { ...linked.attempt.delivery.rawReceipt, method: 'injected_controlled_adapter' }
    if (budgetMismatch) linked.attempt.delivery.budget = { ...budget, maxSources: 5 }
    const aggregateEvidenceId = `evidence-${recordFingerprint({ request: linked.attempt.researchRequestId, receipt: aggregateReceiptId, claim: aggregateClaim }).slice(0, 32)}`
    const ownEvidenceId = `evidence-${recordFingerprint({ request: linked.attempt.researchRequestId, receipt: receiptId, claim }).slice(0, 32)}`
    const decisionReceipt = aggregateEvidence && !aggregateNotExecuted && aggregateReceiptId.localeCompare(receiptId) < 0 ? aggregateReceipt : storedReceipt
    const decisionClaim = decisionReceipt.receiptId === aggregateReceiptId ? aggregateClaim : claim
    const decisionEvidenceId = decisionReceipt.receiptId === aggregateReceiptId ? aggregateEvidenceId : ownEvidenceId
    linked.evidenceCase.evidenceDecisions = omitDecision ? [] : [{ schemaVersion: 'jefe-research-evidence/v1', evidenceId: decisionEvidenceId, researchRequestId: linked.attempt.researchRequestId, receiptId: decisionReceipt.receiptId, claim: decisionClaim, claimKind: 'claim', source: 'controlled_provider_receipt', providerType: decisionReceipt.providerType, contentHash: decisionReceipt.contentHash, receiptStatus: decisionReceipt.status, actor: 'hermes', authority: 'technical_result', provenance: 'supervised_research_evidence_candidate', timestamp: decisionReceipt.receivedAt, freshness: 'current_at_receipt', state: 'needs_corroboration', classification: 'UNTRUSTED_EXTERNAL_CONTENT', corroborations: [], contradictions: [], limits: {}, nextResponsible: 'scout' }]
    const terminalEvidenceId = forgedEvidence ? id('evidence', `${token}:forged`) : aggregateEvidence && (aggregateNotExecuted || aggregateAfterDelivery) ? aggregateEvidenceId : aggregateEvidence || partialAsSucceeded || evidencePending ? ownEvidenceId : null
    linked.attempt.research = { researchRequestId: linked.attempt.researchRequestId, receiptId, state: evidencePending ? 'evidence_pending' : mismatchedResearchState ? 'requires_human' : 'needs_corroboration', evidenceId: terminalEvidenceId, evidenceCaseId: linked.evidenceCase.evidenceCaseId, researchPlanId: linked.evidenceCase.researchPlanId }
    return linked
  }
  const missingReceipt = terminal('terminal-missing-receipt', { omitReceipt: true })
  const badEvidence = terminal('terminal-forged-evidence', { forgedEvidence: true })
  const healthyAggregate = terminal('terminal-aggregate-evidence', { aggregateEvidence: true })
  const nullEvidence = terminal('terminal-null-evidence')
  const missingDecision = terminal('terminal-missing-decision', { aggregateEvidence: true, omitDecision: true })
  const badRaw = terminal('terminal-raw-mismatch', { rawMismatch: true })
  const badBudget = terminal('terminal-budget-mismatch', { budgetMismatch: true })
  const badNotExecutedEvidence = terminal('terminal-not-executed-evidence', { aggregateEvidence: true, aggregateNotExecuted: true })
  const badPartialState = terminal('terminal-partial-as-success', { partialAsSucceeded: true })
  const badEvidencePending = terminal('terminal-evidence-pending', { evidencePending: true })
  const badResearchState = terminal('terminal-research-state-mismatch', { aggregateEvidence: true, mismatchedResearchState: true })
  const lateOwnReceipt = terminal('terminal-late-own-receipt', { receiptAfterDelivery: true })
  const lateAggregateEvidence = terminal('terminal-late-aggregate-evidence', { aggregateEvidence: true, aggregateAfterDelivery: true })
  const missingTerminalTime = terminal('terminal-missing-updated-at', { missingUpdatedAt: true })
  const earlyOwnReceipt = terminal('terminal-receipt-before-delivery', { receiptBeforeDeliveryCreation: true })
  await harness.materializeIndexes()
  const before = clone(harness.state.connectorAttempts.records)
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-terminal-integrity' })
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RECEIPT_REFERENCE_MISMATCH' && item.recordId === missingReceipt.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_REFERENCE_MISMATCH' && item.recordId === badEvidence.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_REFERENCE_MISMATCH' && item.recordId === nullEvidence.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_REFERENCE_MISMATCH' && item.recordId === missingDecision.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RECEIPT_REFERENCE_MISMATCH' && item.recordId === badRaw.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RECEIPT_REFERENCE_MISMATCH' && item.recordId === badBudget.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_REFERENCE_MISMATCH' && item.recordId === badNotExecutedEvidence.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RECEIPT_REFERENCE_MISMATCH' && item.recordId === badPartialState.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_REFERENCE_MISMATCH' && item.recordId === badEvidencePending.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_REFERENCE_MISMATCH' && item.recordId === badResearchState.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RECEIPT_REFERENCE_MISMATCH' && item.recordId === lateOwnReceipt.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'EVIDENCE_REFERENCE_MISMATCH' && item.recordId === lateAggregateEvidence.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RECEIPT_REFERENCE_MISMATCH' && item.recordId === missingTerminalTime.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RECEIPT_REFERENCE_MISMATCH' && item.recordId === earlyOwnReceipt.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.integrityIssues.some((item) => item.recordId === healthyAggregate.attempt.connectorAttemptId), false)
  for (const linked of [missingReceipt, badEvidence, nullEvidence, missingDecision, badRaw, badBudget, badNotExecutedEvidence, badPartialState, badEvidencePending, badResearchState, lateOwnReceipt, lateAggregateEvidence, missingTerminalTime, earlyOwnReceipt]) assert.equal(diagnosis.boundaries.recoveryBlocked.some((item) => item.kind === 'connector_attempt' && item.recordId === linked.attempt.connectorAttemptId), true)
  assert.equal(diagnosis.boundaries.recoveryBlocked.some((item) => item.recordId === healthyAggregate.attempt.connectorAttemptId), false)
  assert.equal(diagnosis.pending.connectorAttempts.length, 0)
  const result = await harness.recovery.executeRecovery({ plan: await harness.recovery.planRecovery({ projectId: 'project-terminal-integrity' }) })
  assert.deepEqual(harness.state.connectorAttempts.records, before)
  assert.equal(result.operations.find((item) => item.type === 'reconcile_connector_attempts').processed, 0)
  assert.equal(result.state, 'completed_with_findings')
})

test('memory append pendiente converge una sola vez por servicio publico', async () => {
  const scenario = await researchRecoveryScenario('memory-pending')
  const before = await scenario.evidenceCasePersistence.read(scenario.planned.evidenceCaseId)
  assert.equal(before.memory.status, 'pending')
  assert.deepEqual(before.pendingOperations, ['memory_append'])
  const session = (await scenario.researchPersistence.listAll(scenario.input.intake.identity.projectId))[0]
  const sessionFile = path.join(scenario.researchPersistence.authorityRoot, `${session.researchSessionId}.json`)
  const sessionBytes = await fs.promises.readFile(sessionFile, 'utf8')
  await fs.promises.writeFile(sessionFile, `${canonical({ ...session, updatedAt: '2099-08-25T12:00:00.000Z' })}\n`, 'utf8')
  const caseFile = path.join(scenario.evidenceCasePersistence.authorityRoot, `${scenario.planned.evidenceCaseId}.json`)
  const caseBytes = await fs.promises.readFile(caseFile, 'utf8')
  await rejectsCode(() => scenario.connected.retryEvidenceCase(scenario.planned.evidenceCaseId), 'RESEARCH_SESSION_PROJECTION_CONFLICT')
  assert.equal(scenario.memoryCalls.length, 0)
  assert.equal(await fs.promises.readFile(caseFile, 'utf8'), caseBytes)
  await fs.promises.writeFile(sessionFile, sessionBytes, 'utf8')
  const first = await scenario.recovery.executeRecovery({ plan: await scenario.recovery.planRecovery({ projectId: scenario.input.intake.identity.projectId }) })
  const after = await scenario.evidenceCasePersistence.read(scenario.planned.evidenceCaseId)
  assert.equal(after.memory.status, 'appended')
  assert.deepEqual(after.pendingOperations, [])
  assert.equal(scenario.memoryCalls.length, 1)
  assert.deepEqual(scenario.memoryCalls[0].identity, scenario.input.intake.identity)
  await scenario.recovery.executeRecovery({ plan: await scenario.recovery.planRecovery({ projectId: scenario.input.intake.identity.projectId }) })
  assert.equal(scenario.memoryCalls.length, 1)
  assert.equal(first.safety.providersExecuted, 0)
})

test('requires human y contradiccion sobreviven byte a byte', async () => {
  const scenario = await researchRecoveryScenario('human-boundary', { contradiction: true })
  const target = path.join(scenario.evidenceCasePersistence.authorityRoot, `${scenario.planned.evidenceCaseId}.json`)
  const before = await fs.promises.readFile(target, 'utf8')
  const record = JSON.parse(before)
  assert.equal(record.state, 'requires_human')
  assert.equal(record.contradictionStatus, 'preserved')
  const result = await scenario.recovery.executeRecovery({ plan: await scenario.recovery.planRecovery({ projectId: scenario.input.intake.identity.projectId }) })
  assert.equal(await fs.promises.readFile(target, 'utf8'), before)
  assert.equal(result.finalStatus.humanBoundaries, 1)
  assert.equal(result.finalStatus.state, 'human_action_required')
  assert.equal(result.safety.humanDecisionsApplied, 0)
  assert.equal(scenario.memoryCalls.length, 0)
})

test('mas de cincuenta ready no bloquean un flow accionable ni ejecutan adapter', async () => {
  const harness = await fakeHarness('ready-starvation')
  const flowPersistence = createSupervisedResearchExecutionPersistence({ root: harness.roots.executionFlows })
  const providerCounter = { calls: 0 }
  const runtime = {
    ...harness.runtime,
    async prepareConnectorAttempt() { providerCounter.calls += 1; throw new Error('forbidden') },
    async executePreparedAttempt() { providerCounter.calls += 1; throw new Error('forbidden') },
    async cancelAttempt() { providerCounter.calls += 1; throw new Error('forbidden') },
    async retryAttempt() { providerCounter.calls += 1; throw new Error('forbidden') },
    async getAttemptStatus() { return null },
    async withExactAttemptSnapshots(projectId, snapshots, work) {
      return work(snapshots.map((snapshot) => ({ connectorAttemptId: snapshot.connectorAttemptId, status: null })))
    },
    getConnectorHealth(providerType) {
      assert.equal(providerType, 'structured_analysis')
      return { connectorId: 'structured-analysis-local', state: 'ready', networkEnabled: false }
    },
  }
  const stubs = executionDependencyStubs(runtime)
  const executionFlow = createSupervisedResearchExecution({ persistence: flowPersistence, discovery: stubs.discovery, research: stubs.research, connectorRuntime: runtime, trustedRouting: routeInput, clock: () => now })
  const safeProject = 'project-starvation'
  const readyIds = []
  for (let index = 0; index < 51; index += 1) {
    const record = executionReadyRecord(safeProject, `ready-${String(index).padStart(2, '0')}`)
    readyIds.push(record.executionFlowId)
    addExecutionDependencies(harness.state, record)
    await persistExecutionRecord(flowPersistence, record)
  }
  const actionable = executionReadyRecord(safeProject, 'actionable', true)
  addExecutionDependencies(harness.state, actionable)
  await persistExecutionRecord(flowPersistence, actionable)
  for (const store of ['discovery', 'research', 'evidenceCases', 'connectorAttempts']) await harness.stores[store].rebuildIndex()
  const dependencies = { ...harness.dependencies, connectorRuntime: runtime, executionPersistence: flowPersistence, executionFlow }
  const recovery = createSupervisedResearchRecovery(dependencies)
  const diagnosis = await recovery.diagnoseRecovery({ projectId: safeProject })
  assert.equal(diagnosis.boundaries.readyForExplicitExecution.length, 51)
  assert.deepEqual(diagnosis.pending.executionFlows.map((item) => item.executionFlowId), [actionable.executionFlowId])
  const result = await recovery.executeRecovery({ plan: await recovery.planRecovery({ projectId: safeProject, limit: 50 }) })
  assert.equal((await flowPersistence.read(actionable.executionFlowId)).state, 'blocked')
  assert.equal((await flowPersistence.listAll(safeProject)).filter((item) => item.state === 'ready_for_execution').length, 51)
  assert.equal(result.operations.find((item) => item.type === 'reconcile_execution_flows').processed, 1)
  assert.equal(providerCounter.calls, 0)
  assert.equal(result.safety.adaptersExecuted, 0)
})

test('snapshot exacto difiere memory tardio y proyecta en planes frescos', async () => {
  const base = path.join(root, `exact-sync-${String(++sequence).padStart(3, '0')}`)
  await fs.promises.mkdir(base, { recursive: true })
  const researchRoot = path.join(base, 'research')
  const evidenceRoot = path.join(base, 'evidence-cases')
  const discoveryPersistence = createDiscoveryPersistence({ root: path.join(base, 'discovery') })
  const researchPersistence = createSupervisedResearchPersistence({ root: researchRoot })
  const evidenceCasePersistence = createEvidenceCasePersistence({ root: evidenceRoot })
  const connectorPersistence = createConnectorPersistence({ root: path.join(base, 'connectors') })
  const executionPersistence = createSupervisedResearchExecutionPersistence({ root: path.join(base, 'execution-flows') })
  let memoryAttempts = 0
  const memoryEntries = []
  const research = createSupervisedResearch({
    memory: {
      async append(value) {
        memoryAttempts += 1
        if (memoryAttempts === 1) {
          const error = new Error('controlled late memory failure')
          error.code = 'INJECTED_MEMORY_FAILURE'
          throw error
        }
        memoryEntries.push(clone(value))
        return { idempotent: false }
      },
    },
    persistence: researchPersistence,
    evidenceCasePersistence,
    clock: () => now,
    trusted: { networkEnabled: false, providers: { manual_reference: { state: 'available' }, metasearch: { state: 'not_connected' } } },
  })
  const input = researchPlanInput(`exact-sync-${digest(base).slice(0, 6)}`)
  await discoveryPersistence.save(input.intake)
  const planned = await research.plan(input)
  await research.receiveContribution(contribution(planned.radar, 'exact-sync-radar'))
  const cleanCase = await evidenceCasePersistence.read(planned.evidenceCaseId)
  assert.equal(cleanCase.state, 'needs_corroboration')
  assert.deepEqual(cleanCase.pendingOperations, [])

  const connectorRuntime = createConnectorRuntime({ persistence: connectorPersistence, clock: () => now })
  const scoutContext = research.getContributionContext(planned.scout.researchRequestId)
  const prepared = await connectorRuntime.prepareConnectorAttempt({
    researchSessionId: scoutContext.researchSessionId,
    researchRequestId: scoutContext.researchRequestId,
    discoveryId: scoutContext.discoveryId,
    projectId: scoutContext.projectId,
    providerType: 'metasearch',
    operation: 'search',
  })
  assert.equal(prepared.record.state, 'not_connected')

  let flow = createExecutionFlow({ identity: input.intake.identity, intakeId: input.intake.intakeId, routingFingerprint: routeHash }, now)
  await executionPersistence.create(flow)
  const advance = async (nextState, patch) => {
    flow = (await executionPersistence.compareAndSet(flow.executionFlowId, { expectedStates: [flow.state], expectedRevision: flow.revision, nextState, patch, updatedAt: now })).record
  }
  const packageRefs = Object.fromEntries(input.packages.map((item) => [item.agent, { packageId: item.packageId, handoffId: item.handoffId, consumerStatus: item.consumerStatus }]))
  const requestRefs = ['radar', 'scout', 'hermes'].map((role) => ({ role, researchRequestId: planned[role].researchRequestId }))
  await advance('prepare_research', { packageRefs, pendingOperations: ['prepare_research'] })
  await advance('prepare_attempts', { researchPlanId: planned.researchPlanId, evidenceCaseId: planned.evidenceCaseId, requestRefs, pendingOperations: ['prepare_attempts'] })
  await advance('ready_for_execution', { attemptRefs: [{ researchRequestId: planned.scout.researchRequestId, connectorAttemptId: prepared.record.connectorAttemptId }], pendingOperations: [] })
  await advance('explicit_execution', { pendingOperations: ['explicit_execution'], lastErrorCode: null })
  await advance('sync_state', { pendingOperations: ['sync_state'], lastErrorCode: null })
  const flowBytesBefore = await fs.promises.readFile(path.join(executionPersistence.authorityRoot, `${flow.executionFlowId}.json`), 'utf8')

  const discovery = { async reopen() { throw new Error('not used') }, async prepareResearchContext() { throw new Error('not used') } }
  const executionFlow = createSupervisedResearchExecution({ persistence: executionPersistence, discovery, research, connectorRuntime, trustedRouting: routeInput, clock: () => now })
  let injected = false
  const recoveryRuntime = {
    ...connectorRuntime,
    async reconcileAttempts(options) {
      if (!injected) {
        injected = true
        await research.receiveContribution(contribution(planned.scout, 'exact-sync-scout'))
      }
      return connectorRuntime.reconcileAttempts(options)
    },
  }
  const recovery = createSupervisedResearchRecovery({ discoveryPersistence, researchPersistence, evidenceCasePersistence, connectorPersistence, connectorRuntime: recoveryRuntime, research, executionPersistence, executionFlow })
  const firstPlan = await recovery.planRecovery({ projectId: input.intake.identity.projectId })
  assert.equal(firstPlan.operations.find((item) => item.type === 'reconcile_pending_research').candidateCount, 0)
  assert.equal(firstPlan.operations.find((item) => item.type === 'reconcile_execution_flows').candidateCount, 1)
  await rejectsCode(() => recovery.executeRecovery({ plan: firstPlan }), 'STALE_RECOVERY_PLAN')
  const lateCase = await evidenceCasePersistence.read(planned.evidenceCaseId)
  assert.equal(lateCase.memory.status, 'pending')
  assert.ok(lateCase.pendingOperations.includes('memory_append'))
  assert.equal(memoryAttempts, 1)
  assert.equal(memoryEntries.length, 0)
  assert.equal(await fs.promises.readFile(path.join(executionPersistence.authorityRoot, `${flow.executionFlowId}.json`), 'utf8'), flowBytesBefore)

  const secondPlan = await recovery.planRecovery({ projectId: input.intake.identity.projectId })
  assert.equal(secondPlan.operations.find((item) => item.type === 'reconcile_pending_research').candidateCount, 1)
  assert.equal(secondPlan.operations.find((item) => item.type === 'reconcile_execution_flows').candidateCount, 0)
  const second = await recovery.executeRecovery({ plan: secondPlan })
  assert.equal(second.state, 'recovery_pending')
  assert.equal(memoryAttempts, 2)
  assert.equal(memoryEntries.length, 1)
  assert.equal((await executionPersistence.read(flow.executionFlowId)).state, 'sync_state')

  const thirdPlan = await recovery.planRecovery({ projectId: input.intake.identity.projectId })
  assert.equal(thirdPlan.operations.find((item) => item.type === 'reconcile_pending_research').candidateCount, 0)
  assert.equal(thirdPlan.operations.find((item) => item.type === 'reconcile_execution_flows').candidateCount, 1)
  const third = await recovery.executeRecovery({ plan: thirdPlan })
  assert.equal((await executionPersistence.read(flow.executionFlowId)).state, 'completed_with_evidence')
  assert.equal(memoryAttempts, 2)
  assert.equal(memoryEntries.length, 1)
  assert.equal(third.safety.adaptersExecuted, 0)
  assert.equal(third.safety.providersExecuted, 0)
})

test('preparacion interrumpida queda boundary explicita y no muta en recovery', async () => {
  const harness = await fakeHarness('preparation-boundary')
  const states = ['prepare_context', 'prepare_research', 'prepare_attempts']
  for (let index = 0; index < 51; index += 1) {
    const state = states[index % states.length]
    const token = `preparation-${index}`
    const intake = storeRecord('discovery', 'project-preparation', token)
    const flow = { ...storeRecord('executionFlows', 'project-preparation', token), intakeId: intake.intakeId, identity: intake.identity, state, pendingOperations: [state] }
    harness.state.discovery.records.push(intake)
    harness.state.executionFlows.records.push(flow)
  }
  const syncIntake = storeRecord('discovery', 'project-preparation', 'sync-after-boundaries')
  const sync = { ...storeRecord('executionFlows', 'project-preparation', 'sync-after-boundaries'), intakeId: syncIntake.intakeId, identity: syncIntake.identity, state: 'sync_state', pendingOperations: ['sync_state'] }
  harness.state.discovery.records.push(syncIntake)
  harness.state.executionFlows.records.push(sync)
  await harness.materializeIndexes()
  const beforePreparation = clone(harness.state.executionFlows.records.filter((item) => PREPARATION_FLOW_STATES_FOR_SMOKE.has(item.state)))
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-preparation' })
  assert.equal(diagnosis.boundaries.preparationPending.length, 51)
  assert.deepEqual([...new Set(diagnosis.boundaries.preparationPending.map((item) => item.state))].sort(), [...states].sort())
  assert.equal(diagnosis.boundaries.preparationPending.every((item) => item.nextAction === 'prepareFlow'), true)
  assert.deepEqual(diagnosis.pending.executionFlows.map((item) => item.executionFlowId), [sync.executionFlowId])
  const plan = await harness.recovery.planRecovery({ projectId: 'project-preparation' })
  assert.equal(plan.operations.find((item) => item.type === 'reconcile_execution_flows').candidateCount, 1)
  const result = await harness.recovery.executeRecovery({ plan })
  assert.deepEqual(harness.state.executionFlows.records.filter((item) => PREPARATION_FLOW_STATES_FOR_SMOKE.has(item.state)), beforePreparation)
  assert.equal(harness.state.executionFlows.records.find((item) => item.executionFlowId === sync.executionFlowId).state, 'blocked')
  assert.equal(result.finalStatus.explicitBoundaries, 51)
  assert.equal(result.state, 'completed_with_boundaries')
  assert.equal(result.safety.adaptersExecuted, 0)
  assert.equal(result.safety.providersExecuted, 0)
})

test('mas de cincuenta dependencias corruptas no postergan candidato sano ni crean loop fantasma', async () => {
  const harness = await fakeHarness('corrupt-dependency-starvation')
  const safeProject = 'project-corrupt-dependency'
  const blockedFlows = []
  for (let index = 0; index < 51; index += 1) {
    const token = `corrupt-dependency-${String(index).padStart(2, '0')}`
    const intake = storeRecord('discovery', safeProject, token)
    const evidenceCaseId = id('evidence-case', token)
    const flow = { ...storeRecord('executionFlows', safeProject, token), intakeId: intake.intakeId, identity: intake.identity, state: 'sync_state', evidenceCaseId, researchPlanId: id('research-plan', token), pendingOperations: ['sync_state'] }
    harness.state.discovery.records.push(intake)
    harness.state.evidenceCases.corruptions.push({ evidenceCaseId, code: 'CORRUPT_EVIDENCE_CASE' })
    harness.state.executionFlows.records.push(flow)
    blockedFlows.push(flow)
  }
  const healthyIntake = storeRecord('discovery', safeProject, 'healthy-after-corruptions')
  const healthy = { ...storeRecord('executionFlows', safeProject, 'healthy-after-corruptions'), intakeId: healthyIntake.intakeId, identity: healthyIntake.identity, state: 'sync_state', pendingOperations: ['sync_state'] }
  harness.state.discovery.records.push(healthyIntake)
  harness.state.executionFlows.records.push(healthy)
  await harness.materializeIndexes()
  const blockedBefore = canonical(blockedFlows)
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: safeProject })
  assert.deepEqual(diagnosis.pending.executionFlows.map((item) => item.executionFlowId), [healthy.executionFlowId])
  assert.equal(diagnosis.boundaries.recoveryBlocked.filter((item) => item.kind === 'execution_flow').length, 51)
  const plan = await harness.recovery.planRecovery({ projectId: safeProject, limit: 50 })
  assert.equal(plan.operations.find((item) => item.type === 'reconcile_execution_flows').candidateCount, 1)
  const result = await harness.recovery.executeRecovery({ plan })
  assert.equal(healthy.state, 'blocked')
  assert.equal(canonical(blockedFlows), blockedBefore)
  assert.equal(result.state, 'completed_with_findings')
  assert.equal(result.finalStatus.recoveryCandidates, 0)
  const replayPlan = await harness.recovery.planRecovery({ projectId: safeProject })
  assert.equal(replayPlan.operations.find((item) => item.type === 'reconcile_execution_flows').candidateCount, 0)
})

test('dependencia foreign queda finding simetrico sin candidato ni mutacion', async () => {
  const harness = await fakeHarness('foreign-dependency')
  const local = addEvidenceCase(harness.state, 'project-alpha', 'local-plan').evidenceCase
  const foreign = addEvidenceCase(harness.state, 'project-beta', 'foreign-case').evidenceCase
  const intake = storeRecord('discovery', 'project-alpha', 'foreign-flow')
  const flow = { ...storeRecord('executionFlows', 'project-alpha', 'foreign-flow'), intakeId: intake.intakeId, identity: intake.identity, state: 'sync_state', evidenceCaseId: foreign.evidenceCaseId, researchPlanId: foreign.researchPlanId, pendingOperations: ['sync_state'] }
  harness.state.discovery.records.push(intake)
  harness.state.executionFlows.records.push(flow)
  const planIntake = storeRecord('discovery', 'project-beta', 'foreign-plan-flow')
  const planFlow = { ...storeRecord('executionFlows', 'project-beta', 'foreign-plan-flow'), intakeId: planIntake.intakeId, identity: planIntake.identity, state: 'sync_state', evidenceCaseId: foreign.evidenceCaseId, researchPlanId: local.researchPlanId, pendingOperations: ['sync_state'] }
  harness.state.discovery.records.push(planIntake)
  harness.state.executionFlows.records.push(planFlow)
  await harness.materializeIndexes()
  const before = canonical(flow)
  const [alpha, beta] = await Promise.all([
    harness.recovery.diagnoseRecovery({ projectId: 'project-alpha' }),
    harness.recovery.diagnoseRecovery({ projectId: 'project-beta' }),
  ])
  assert.equal(alpha.integrityIssues.some((item) => item.recordId === flow.executionFlowId), true)
  assert.equal(beta.integrityIssues.some((item) => item.recordId === flow.executionFlowId), true)
  assert.equal(alpha.integrityIssues.some((item) => item.code === 'RESEARCH_PLAN_REFERENCE_MISMATCH' && item.recordId === planFlow.executionFlowId), true)
  assert.equal(beta.integrityIssues.some((item) => item.code === 'RESEARCH_PLAN_REFERENCE_MISMATCH' && item.recordId === planFlow.executionFlowId), true)
  assert.equal(alpha.pending.executionFlows.length, 0)
  assert.equal(beta.pending.executionFlows.length, 0)
  assert.equal(alpha.boundaries.recoveryBlocked.some((item) => item.recordId === flow.executionFlowId), true)
  assert.equal(alpha.boundaries.recoveryBlocked.some((item) => item.recordId === planFlow.executionFlowId), true)
  assert.equal(beta.boundaries.recoveryBlocked.some((item) => item.recordId === planFlow.executionFlowId), true)
  const plan = await harness.recovery.planRecovery({ projectId: 'project-alpha' })
  assert.equal(plan.operations.find((item) => item.type === 'reconcile_execution_flows').candidateCount, 0)
  const result = await harness.recovery.executeRecovery({ plan })
  assert.equal(canonical(flow), before)
  assert.equal(planFlow.state, 'sync_state')
  assert.equal(result.state, 'completed_with_findings')
})

test('journals de sesiones ausentes siguen siendo proyecciones recuperables', async () => {
  const harness = await fakeHarness('recoverable-session-journals')
  for (const [index, journal] of ['complete_plan', 'sync_request_sessions'].entries()) {
    const token = `recoverable-session-${index}`
    const added = addEvidenceCase(harness.state, 'project-session-journal', token)
    const request = { researchRequestId: id('research', token), identity: clone(added.evidenceCase.identity), role: 'radar', packageId: id('context-package', token), handoffId: id('agent-handoff', token), providerType: 'manual_reference' }
    added.evidenceCase.requests = [request]
    added.evidenceCase.state = journal === 'complete_plan' ? 'preparing' : 'needs_corroboration'
    added.evidenceCase.pendingOperations = [journal]
    added.evidenceCase.lastErrorCode = 'INJECTED_FAILURE'
  }
  await harness.materializeIndexes()
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-session-journal' })
  assert.equal(diagnosis.pending.researchCases.length, 2)
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'MISSING_RESEARCH_SESSION'), false)
  assert.equal(diagnosis.boundaries.recoveryBlocked.some((item) => item.kind === 'evidence_case'), false)
  assert.equal((await harness.recovery.planRecovery({ projectId: 'project-session-journal' })).operations.find((item) => item.type === 'reconcile_pending_research').candidateCount, 2)
})

test('proyeccion fantasma sin journal se diagnostica y repara solo por sync', async () => {
  const shell = await realShell('session-projection-ghost')
  let memoryCalls = 0
  const research = createSupervisedResearch({
    memory: { async append() { memoryCalls += 1; return { idempotent: false } } },
    persistence: shell.researchPersistence,
    evidenceCasePersistence: shell.evidenceCasePersistence,
    clock: () => now,
    trusted: { networkEnabled: false, providers: { manual_reference: { state: 'available' }, metasearch: { state: 'not_connected' } } },
  })
  const input = researchPlanInput(`projection-ghost-${digest(shell.base).slice(0, 6)}`)
  await shell.discoveryPersistence.save(input.intake)
  const planned = await research.plan(input)
  const initialSessions = await shell.researchPersistence.listAll(input.intake.identity.projectId)
  const staleSession = initialSessions.find((item) => item.researchRequestId === planned.radar.researchRequestId)
  const staleFile = path.join(shell.researchPersistence.authorityRoot, `${staleSession.researchSessionId}.json`)
  const staleBytes = await fs.promises.readFile(staleFile, 'utf8')
  await research.receiveContribution(contribution(planned.radar, 'projection-ghost-radar'))
  const cleanCase = await shell.evidenceCasePersistence.read(planned.evidenceCaseId)
  assert.deepEqual(cleanCase.pendingOperations, [])
  await fs.promises.writeFile(staleFile, staleBytes, 'utf8')
  await shell.discoveryPersistence.rebuildIndex()
  await shell.researchPersistence.rebuildIndex()
  await shell.evidenceCasePersistence.rebuildIndex()
  await shell.connectorPersistence.rebuildIndex()
  await shell.executionPersistence.rebuildIndex()
  await shell.connectorRuntime.rebuildAllConnectorHealth()
  const dependencies = { discoveryPersistence: shell.discoveryPersistence, researchPersistence: shell.researchPersistence, evidenceCasePersistence: shell.evidenceCasePersistence, connectorPersistence: shell.connectorPersistence, connectorRuntime: shell.connectorRuntime, research, executionPersistence: shell.executionPersistence, executionFlow: noOpExecutionFlow() }
  const recovery = createSupervisedResearchRecovery(dependencies)
  const diagnosis = await recovery.diagnoseRecovery({ projectId: input.intake.identity.projectId })
  assert.equal(diagnosis.integrityIssues.some((item) => item.code === 'RESEARCH_SESSION_PROJECTION_DRIFT' && item.recordId === planned.evidenceCaseId && item.relatedId === staleSession.researchSessionId), true)
  assert.deepEqual(diagnosis.pending.researchCases.map((item) => item.evidenceCaseId), [planned.evidenceCaseId])
  assert.equal(diagnosis.boundaries.recoveryBlocked.some((item) => item.recordId === planned.evidenceCaseId), false)
  const plan = await recovery.planRecovery({ projectId: input.intake.identity.projectId })
  assert.equal(plan.operations.find((item) => item.type === 'reconcile_pending_research').candidateCount, 1)
  const result = await recovery.executeRecovery({ plan })
  const healed = await shell.researchPersistence.read(staleSession.researchSessionId)
  assert.equal(healed.receipts.length, 1)
  assert.equal(healed.status, 'needs_corroboration')
  assert.deepEqual(healed.pendingOperations, [])
  assert.equal((await recovery.diagnoseRecovery({ projectId: input.intake.identity.projectId })).integrityIssues.some((item) => item.code === 'RESEARCH_SESSION_PROJECTION_DRIFT'), false)
  assert.equal(result.operations.find((item) => item.type === 'reconcile_pending_research').processed, 1)
  assert.equal(memoryCalls, 0)
  assert.equal(shell.adapterCounter.calls, 0)
  assert.equal(result.safety.providersExecuted, 0)
  const futureSession = { ...healed, updatedAt: '2099-08-25T12:00:00.000Z' }
  await fs.promises.writeFile(staleFile, `${canonical(futureSession)}\n`, 'utf8')
  const caseFile = path.join(shell.evidenceCasePersistence.authorityRoot, `${planned.evidenceCaseId}.json`)
  const caseBeforeConflict = await fs.promises.readFile(caseFile, 'utf8')
  const conflict = await recovery.diagnoseRecovery({ projectId: input.intake.identity.projectId })
  assert.equal(conflict.integrityIssues.some((item) => item.code === 'RESEARCH_SESSION_PROJECTION_CONFLICT' && item.recordId === planned.evidenceCaseId), true)
  assert.equal(conflict.pending.researchCases.length, 0)
  assert.equal(conflict.boundaries.recoveryBlocked.some((item) => item.recordId === planned.evidenceCaseId), true)
  await rejectsCode(() => research.retryEvidenceCase(planned.evidenceCaseId), 'RESEARCH_SESSION_PROJECTION_CONFLICT')
  assert.equal(await fs.promises.readFile(caseFile, 'utf8'), caseBeforeConflict)
  const conflictResult = await recovery.executeRecovery({ plan: await recovery.planRecovery({ projectId: input.intake.identity.projectId }) })
  assert.equal(conflictResult.operations.find((item) => item.type === 'reconcile_pending_research').processed, 0)
  assert.equal(await fs.promises.readFile(caseFile, 'utf8'), caseBeforeConflict)
  assert.equal((await shell.researchPersistence.read(staleSession.researchSessionId)).updatedAt, futureSession.updatedAt)
})

test('codigos forjados se reducen a allowlist y corrupcion invalida falla cerrado', async () => {
  const harness = await fakeHarness('forged-error-code', { failResearch: true, failResearchCode: 'TOKEN_ADMIN_SECRET' })
  const pending = addEvidenceCase(harness.state, 'project-valid', 'forged-error', { state: 'accepted_for_context', pendingOperations: ['memory_append'], memory: { status: 'pending', entryId: id('research-evidence', 'forged-error') }, lastErrorCode: 'TOKEN_ADMIN_SECRET' }).evidenceCase
  await harness.materializeIndexes()
  const diagnosis = await harness.recovery.diagnoseRecovery({ projectId: 'project-valid' })
  assert.equal(canonical(diagnosis).includes('TOKEN_ADMIN_SECRET'), false)
  assert.equal(diagnosis.pending.researchCases.find((item) => item.evidenceCaseId === pending.evidenceCaseId).lastErrorCode, 'UNRECOGNIZED_DURABLE_ERROR')
  const result = await harness.recovery.executeRecovery({ plan: await harness.recovery.planRecovery({ projectId: 'project-valid' }) })
  assert.equal(result.operations.find((item) => item.type === 'reconcile_pending_research').errorCode, 'RECOVERY_OPERATION_FAILED')
  assert.equal(canonical(result).includes('TOKEN_ADMIN_SECRET'), false)

  const forgedCode = await fakeHarness('forged-corruption-code')
  forgedCode.state.discovery.corruptions.push({ intakeId: id('intake', 'forged-code'), code: 'TOKEN_ADMIN_SECRET' })
  await rejectsCode(() => forgedCode.recovery.diagnoseRecovery({ projectId: 'project-valid' }), 'INVALID_RECOVERY_DEPENDENCY_RESULT')
  const forgedId = await fakeHarness('forged-corruption-id')
  forgedId.state.discovery.corruptions.push({ intakeId: 'C:/secret/token', code: 'CORRUPT_INTAKE' })
  await rejectsCode(() => forgedId.recovery.diagnoseRecovery({ projectId: 'project-valid' }), 'INVALID_RECOVERY_DEPENDENCY_RESULT')
})

test('caso sano posterior no queda detras de cincuenta errores durables', async () => {
  const harness = await fakeHarness('research-error-starvation')
  const safeProject = 'project-research-fairness'
  for (let index = 0; index < 50; index += 1) {
    const token = `failed-case-${index}`
    const added = addEvidenceCase(harness.state, safeProject, token, { state: 'accepted_for_context', pendingOperations: ['memory_append'], memory: { status: 'pending', entryId: id('research-evidence', token) }, lastErrorCode: 'MEMORY_APPEND_FAILED' })
    added.evidenceCase.evidenceCaseId = `evidence-case-${index.toString(16).padStart(32, '0')}`
  }
  const healthy = addEvidenceCase(harness.state, safeProject, 'healthy-case-after-errors', { state: 'accepted_for_context', pendingOperations: ['memory_append'], memory: { status: 'pending', entryId: id('research-evidence', 'healthy-case-after-errors') } }).evidenceCase
  healthy.evidenceCaseId = `evidence-case-${'f'.repeat(32)}`
  await harness.materializeIndexes()
  const plan = await harness.recovery.planRecovery({ projectId: safeProject, limit: 50 })
  const candidates = plan.operations.find((item) => item.type === 'reconcile_pending_research').candidates
  assert.equal(candidates.length, 50)
  assert.equal(candidates.some((item) => item.evidenceCaseId === healthy.evidenceCaseId), true)
  assert.equal(candidates.filter((item) => item.evidenceCaseId !== healthy.evidenceCaseId).length, 49)
})

test('errores durables rotan entre lotes acotados por progreso persistido', async () => {
  const harness = await fakeHarness('research-error-rotation')
  const safeProject = 'project-research-rotation'
  const cases = []
  for (let index = 0; index < 51; index += 1) {
    const token = `rotating-case-${index}`
    const added = addEvidenceCase(harness.state, safeProject, token, { state: 'accepted_for_context', pendingOperations: ['memory_append'], memory: { status: 'pending', entryId: id('research-evidence', token) }, lastErrorCode: 'MEMORY_APPEND_FAILED' }).evidenceCase
    added.evidenceCaseId = `evidence-case-${index.toString(16).padStart(32, '0')}`
    cases.push(added)
  }
  await harness.materializeIndexes()
  const firstPlan = await harness.recovery.planRecovery({ projectId: safeProject, limit: 50 })
  const firstCandidates = firstPlan.operations.find((item) => item.type === 'reconcile_pending_research').candidates
  assert.equal(firstCandidates.length, 50)
  assert.equal(firstCandidates.some((item) => item.evidenceCaseId === cases[50].evidenceCaseId), false)
  for (const candidate of firstCandidates) {
    const durable = cases.find((item) => item.evidenceCaseId === candidate.evidenceCaseId)
    durable.revision += 1
  }
  const secondPlan = await harness.recovery.planRecovery({ projectId: safeProject, limit: 50 })
  const secondCandidates = secondPlan.operations.find((item) => item.type === 'reconcile_pending_research').candidates
  assert.equal(secondCandidates.length, 50)
  assert.equal(secondCandidates.some((item) => item.evidenceCaseId === cases[50].evidenceCaseId), true)
  assert.equal(secondCandidates.some((item) => item.evidenceCaseId === cases[49].evidenceCaseId), false)
})

test('fallo persistente de connector no impide progreso del candidato cincuenta y uno', async () => {
  const behavior = {}
  const harness = await fakeHarness('connector-write-fairness', behavior)
  const safeProject = 'project-connector-fairness'
  const attempts = []
  for (let index = 0; index < 51; index += 1) attempts.push(addAttemptGraph(harness.state, safeProject, `connector-fair-${index}`, { state: 'running' }).attempt)
  const ordered = [...attempts].sort((left, right) => left.connectorAttemptId.localeCompare(right.connectorAttemptId))
  behavior.failConnectorAttemptId = ordered[0].connectorAttemptId
  await harness.materializeIndexes()

  const firstPlan = await harness.recovery.planRecovery({ projectId: safeProject, limit: 50 })
  const firstCandidates = firstPlan.operations.find((item) => item.type === 'reconcile_connector_attempts').candidates
  assert.equal(firstCandidates.length, 50)
  assert.equal(firstCandidates.some((item) => item.connectorAttemptId === ordered[50].connectorAttemptId), false)
  const first = await harness.recovery.executeRecovery({ plan: firstPlan })
  const firstOperation = first.operations.find((item) => item.type === 'reconcile_connector_attempts')
  assert.deepEqual({ status: firstOperation.status, processed: firstOperation.processed, remaining: firstOperation.remaining, errorCode: firstOperation.errorCode }, { status: 'failed', processed: 49, remaining: 1, errorCode: 'RECOVERY_ITEM_FAILED' })
  assert.equal(first.state, 'partial')

  const secondPlan = await harness.recovery.planRecovery({ projectId: safeProject, limit: 50 })
  const secondCandidates = secondPlan.operations.find((item) => item.type === 'reconcile_connector_attempts').candidates
  assert.deepEqual(secondCandidates.map((item) => item.connectorAttemptId), [ordered[0].connectorAttemptId, ordered[50].connectorAttemptId])
  const second = await harness.recovery.executeRecovery({ plan: secondPlan })
  const secondOperation = second.operations.find((item) => item.type === 'reconcile_connector_attempts')
  assert.deepEqual({ status: secondOperation.status, processed: secondOperation.processed, remaining: secondOperation.remaining }, { status: 'failed', processed: 1, remaining: 1 })
  assert.equal(ordered[50].state, 'failed_transient')
  assert.equal(ordered[0].state, 'running')
})

try {
  assert.equal(tests.length, 67)
  const total = tests.length
  const executed = []
  for (let index = 0; index < tests.length; index += 1) {
    const current = tests[index]
    assert.equal(typeof current.run, 'function')
    await current.run()
    executed.push(index + 1)
    console.log(`PASS ${index + 1}/${total} ${current.name}`)
  }
  assert.deepEqual(executed, Array.from({ length: tests.length }, (_, index) => index + 1))
  console.log(`PASS jefe-supervised-research-recovery-smoke: casos ${executed[0]}-${executed.at(-1)}`)
  console.log(`SMOKE_STRUCTURE=${executed.length}/${tests.length}`)
  console.log(`BEHAVIORAL_CASES_COMPLETE=${executed.length}/${tests.length}`)
  console.log(`BEHAVIORAL_CASES_REAL=${executed[0]}-${executed.at(-1)}`)
  console.log(`SUPERVISED_RECOVERY_SMOKE=${executed.length}/${tests.length}`)
} finally {
  const resolvedRoot = path.resolve(root)
  const resolvedTemporary = `${path.resolve(os.tmpdir())}${path.sep}`
  if (!resolvedRoot.startsWith(resolvedTemporary)) throw new Error('unsafe temporary cleanup target')
  await fs.promises.rm(resolvedRoot, { recursive: true, force: true })
}
