const crypto = require('crypto')
const { physicalRootKey } = require('./jefe-physical-root.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { budget: validateBudget } = require('./jefe-research-provider-policy.cjs')
const {
  ERROR_CODES,
  ROLES,
  TERMINAL_STATES,
  createExecutionFlow,
  deriveExecutionFlowId,
  executionFlowView,
} = require('./jefe-supervised-research-execution-contract.cjs')

const INTAKE_ID = /^intake-[a-f0-9]{32}$/u
const FLOW_ID = /^research-execution-[a-f0-9]{32}$/u
const SAFE_ID = /^[a-z][a-z0-9-]{2,80}$/u
const PACKAGE_ID = /^context-package-[a-f0-9]{32}$/u
const HANDOFF_ID = /^agent-handoff-[a-f0-9]{32}$/u
const RESEARCH_PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const EVIDENCE_CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const RESEARCH_REQUEST_ID = /^research-[a-f0-9]{32}$/u
const ATTEMPT_ID = /^connector-attempt-[a-f0-9]{32}$/u
const RECOVERY_FINGERPRINT = /^[a-f0-9]{64}$/u
const EXECUTION_ROLE = 'scout'
const CONSUMER_STATUSES = new Set(['not_connected', 'registered_internal'])
const TARGETED_RECOVERY_STATES = new Set(['explicit_execution', 'resume_delivery', 'sync_state'])
const flowLocks = new Map()

class SupervisedResearchExecutionError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'SupervisedResearchExecutionError'
    this.code = code
  }
}

function fail(code, message) {
  throw new SupervisedResearchExecutionError(code, message)
}

function plainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value))
}

function exactInput(value, fields, code = 'INVALID_EXECUTION_REQUEST') {
  if (!plainObject(value) || canonical(Object.keys(value).sort()) !== canonical([...fields].sort())) fail(code, 'Solicitud de ejecucion supervisada invalida.')
  return value
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const item of Object.values(value)) deepFreeze(item)
  return Object.freeze(value)
}

function clone(value) {
  return JSON.parse(canonical(value))
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function exclusive(key, work) {
  const previous = flowLocks.get(key) || Promise.resolve()
  let release
  const tail = new Promise((resolve) => { release = resolve })
  flowLocks.set(key, tail)
  return previous.then(work).finally(() => {
    release()
    if (flowLocks.get(key) === tail) flowLocks.delete(key)
  })
}

function exclusiveMany(keys, work, index = 0) {
  if (index >= keys.length) return work()
  return exclusive(keys[index], () => exclusiveMany(keys, work, index + 1))
}

function validateIdentity(value) {
  exactInput(value, ['projectId', 'runId', 'versionId'], 'INVALID_PHYSICAL_IDENTITY')
  const clean = {}
  for (const key of ['projectId', 'runId', 'versionId']) {
    if (typeof value[key] !== 'string' || !SAFE_ID.test(value[key])) fail('INVALID_PHYSICAL_IDENTITY', 'Identidad fisica invalida.')
    clean[key] = value[key]
  }
  return deepFreeze(clean)
}

function validateIntake(value, intakeId, expectedIdentity = null) {
  if (!plainObject(value) || value.intakeId !== intakeId) fail('INVALID_DISCOVERY_CONTEXT', 'Intake durable invalido.')
  if (value.state !== 'ready_for_discovery') fail('INTAKE_NOT_READY', 'El intake no esta listo para investigacion.')
  if (!value.identity) fail('INVALID_DISCOVERY_CONTEXT', 'Intake durable sin identidad fisica.')
  const identity = validateIdentity(value.identity)
  if (expectedIdentity && canonical(identity) !== canonical(expectedIdentity)) fail('INVALID_PHYSICAL_IDENTITY', 'La identidad fisica del intake cambio.')
  return { intake: value, identity }
}

function validatePackages(value) {
  if (!Array.isArray(value) || value.length !== ROLES.length) fail('INVALID_DISCOVERY_CONTEXT', 'Paquetes de discovery invalidos.')
  const refs = {}
  for (const item of value) {
    if (!plainObject(item) || canonical(Object.keys(item).sort()) !== canonical(['agent', 'packageId', 'handoffId', 'consumerStatus'].sort()) || !ROLES.includes(item.agent) || typeof item.packageId !== 'string' || !PACKAGE_ID.test(item.packageId) || typeof item.handoffId !== 'string' || !HANDOFF_ID.test(item.handoffId) || !CONSUMER_STATUSES.has(item.consumerStatus) || Object.hasOwn(refs, item.agent)) fail('INVALID_DISCOVERY_CONTEXT', 'Paquetes de discovery invalidos.')
    refs[item.agent] = { packageId: item.packageId, handoffId: item.handoffId, consumerStatus: item.consumerStatus }
  }
  if (ROLES.some((role) => !Object.hasOwn(refs, role)) || new Set(Object.values(refs).map((item) => item.packageId)).size !== ROLES.length || new Set(Object.values(refs).map((item) => item.handoffId)).size !== ROLES.length) fail('INVALID_DISCOVERY_CONTEXT', 'Faltan paquetes por rol.')
  return deepFreeze(refs)
}

function validateDiscoveryContext(value, flow) {
  if (!plainObject(value) || canonical(Object.keys(value).sort()) !== canonical(['intake', 'packages'].sort()) || !value.intake || !Array.isArray(value.packages)) fail('INVALID_DISCOVERY_CONTEXT', 'Contexto de discovery invalido.')
  const checked = validateIntake(value.intake, flow.intakeId, flow.identity)
  return { intake: checked.intake, packageRefs: validatePackages(value.packages) }
}

function normalizedRouting(value) {
  exactInput(value, ['providerType', 'operation', 'budget'], 'INVALID_TRUSTED_ROUTING')
  if (value.providerType !== 'structured_analysis' || value.operation !== 'analyze') fail('INVALID_TRUSTED_ROUTING', 'Routing confiable invalido.')
  let budget
  try { budget = validateBudget(value.budget) } catch { fail('INVALID_TRUSTED_ROUTING', 'Routing confiable invalido.') }
  return deepFreeze({
    schemaVersion: 'jefe-supervised-research-routing/v1',
    executionRole: EXECUTION_ROLE,
    providerType: value.providerType,
    operation: value.operation,
    budget,
    references: Object.freeze([]),
  })
}

function routingFingerprint(value) {
  return digest(value)
}

function createSupervisedResearchExecution(options = {}) {
  exactInput(options, ['persistence', 'discovery', 'research', 'connectorRuntime', 'trustedRouting', 'clock'], 'INVALID_EXECUTION_OPTIONS')
  const { persistence, discovery, research, connectorRuntime, trustedRouting, clock } = options
  const persistenceMethods = ['create', 'read', 'compareAndSet', 'listDetailed', 'listAll']
  const discoveryMethods = ['reopen', 'prepareResearchContext']
  const researchMethods = ['plan', 'getContributionContext', 'reopenEvidenceCase', 'retryEvidenceCase', 'withExactEvidenceCaseSnapshots']
  const runtimeMethods = ['prepareConnectorAttempt', 'executePreparedAttempt', 'cancelAttempt', 'retryAttempt', 'reconcileAttempts', 'getAttemptStatus', 'withExactAttemptSnapshots', 'getConnectorHealth']
  if (!persistence || typeof persistence.authorityRoot !== 'string' || persistenceMethods.some((key) => typeof persistence[key] !== 'function')) fail('INVALID_DEPENDENCY', 'Persistencia de flow invalida.')
  if (!discovery || discoveryMethods.some((key) => typeof discovery[key] !== 'function')) fail('INVALID_DEPENDENCY', 'Discovery invalido.')
  if (!research || researchMethods.some((key) => typeof research[key] !== 'function')) fail('INVALID_DEPENDENCY', 'Investigacion invalida.')
  if (!connectorRuntime || runtimeMethods.some((key) => typeof connectorRuntime[key] !== 'function')) fail('INVALID_DEPENDENCY', 'Runtime de connectors invalido.')
  if (typeof clock !== 'function') fail('INVALID_DEPENDENCY', 'Clock invalido.')
  const routing = normalizedRouting(trustedRouting)
  const routeFingerprint = routingFingerprint(routing)
  const health = connectorRuntime.getConnectorHealth(routing.providerType)
  if (!plainObject(health) || health.state !== 'ready' || health.networkEnabled !== false || health.connectorId !== 'structured-analysis-local') fail('INVALID_TRUSTED_ROUTING', 'El connector local no esta listo de forma segura.')
  const terminal = new Set(TERMINAL_STATES)
  const knownFlowErrors = new Set(ERROR_CODES)
  const operationAuthorityRoot = physicalRootKey(persistence.authorityRoot)
  const lockKey = (executionFlowId) => `${operationAuthorityRoot}:${executionFlowId}`

  function flowRecoverySnapshot(flow) {
    if (!plainObject(flow) || !FLOW_ID.test(flow.executionFlowId) || !Number.isSafeInteger(flow.revision) || flow.revision < 0 || typeof flow.state !== 'string') fail('INVALID_EXECUTION_FLOW', 'Flow invalido para recovery.')
    return {
      executionFlowId: flow.executionFlowId,
      revision: flow.revision,
      state: flow.state,
      fingerprint: digest(flow),
    }
  }

  function evidenceCaseSnapshot(value) {
    if (!plainObject(value)) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshot de caso de evidencia invalido.')
    exactInput(value, ['evidenceCaseId', 'revision', 'state', 'fingerprint'], 'INVALID_RECONCILE_CANDIDATES')
    if (!EVIDENCE_CASE_ID.test(value.evidenceCaseId)) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshot de caso de evidencia invalido.')
    const missing = value.revision === null && value.state === null && value.fingerprint === null
    const present = Number.isSafeInteger(value.revision) && value.revision >= 0 && typeof value.state === 'string' && RECOVERY_FINGERPRINT.test(value.fingerprint)
    if (!missing && !present) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshot de caso de evidencia invalido.')
    return clone(value)
  }

  function connectorAttemptSnapshot(value) {
    if (!plainObject(value)) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshot de connector attempt invalido.')
    exactInput(value, ['connectorAttemptId', 'revision', 'state', 'deliveryId', 'deliveryState', 'fingerprint'], 'INVALID_RECONCILE_CANDIDATES')
    if (!ATTEMPT_ID.test(value.connectorAttemptId)) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshot de connector attempt invalido.')
    const missing = value.revision === null && value.state === null && value.deliveryId === null && value.deliveryState === null && value.fingerprint === null
    const present = Number.isSafeInteger(value.revision) && value.revision >= 0 && typeof value.state === 'string' && (value.deliveryId === null || /^connector-delivery-[a-f0-9]{32}$/u.test(value.deliveryId)) && (value.deliveryState === null || ['pending', 'delivered'].includes(value.deliveryState)) && RECOVERY_FINGERPRINT.test(value.fingerprint)
    if (!missing && !present) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshot de connector attempt invalido.')
    return clone(value)
  }

  function recoveryCandidates(value, limit) {
    if (!Array.isArray(value) || value.length > limit || value.length > 50) fail('INVALID_RECONCILE_CANDIDATES', 'Candidatos de reconciliacion invalidos.')
    const identifiers = new Set()
    return value.map((candidateRecord) => {
      exactInput(candidateRecord, ['executionFlowId', 'revision', 'state', 'fingerprint', 'evidenceCaseSnapshot', 'connectorAttemptSnapshot'], 'INVALID_RECONCILE_CANDIDATES')
      if (!FLOW_ID.test(candidateRecord.executionFlowId) || !Number.isSafeInteger(candidateRecord.revision) || candidateRecord.revision < 0 || !TARGETED_RECOVERY_STATES.has(candidateRecord.state) || !RECOVERY_FINGERPRINT.test(candidateRecord.fingerprint) || identifiers.has(candidateRecord.executionFlowId) || (candidateRecord.evidenceCaseSnapshot !== null && !plainObject(candidateRecord.evidenceCaseSnapshot)) || (candidateRecord.connectorAttemptSnapshot !== null && !plainObject(candidateRecord.connectorAttemptSnapshot))) fail('INVALID_RECONCILE_CANDIDATES', 'Candidatos de reconciliacion invalidos.')
      identifiers.add(candidateRecord.executionFlowId)
      return {
        ...clone(candidateRecord),
        evidenceCaseSnapshot: candidateRecord.evidenceCaseSnapshot === null ? null : evidenceCaseSnapshot(candidateRecord.evidenceCaseSnapshot),
        connectorAttemptSnapshot: candidateRecord.connectorAttemptSnapshot === null ? null : connectorAttemptSnapshot(candidateRecord.connectorAttemptSnapshot),
      }
    }).sort((left, right) => left.executionFlowId.localeCompare(right.executionFlowId))
  }

  async function requireRecoveryCandidate(candidateRecord, projectId) {
    const current = await persistence.read(candidateRecord.executionFlowId)
    const { evidenceCaseSnapshot: expectedCase, connectorAttemptSnapshot: expectedAttempt, ...expectedFlow } = candidateRecord
    if (!current || current.identity?.projectId !== projectId || canonical(flowRecoverySnapshot(current)) !== canonical(expectedFlow)) fail('STALE_RECONCILE_CANDIDATE', 'El candidato de flow ya no coincide con el snapshot.')
    if ((current.evidenceCaseId === null) !== (expectedCase === null) || (current.evidenceCaseId !== null && current.evidenceCaseId !== expectedCase.evidenceCaseId)) fail('STALE_RECONCILE_CANDIDATE', 'La dependencia de evidencia del flow ya no coincide con el snapshot.')
    const attemptId = current.attemptRefs.at(-1)?.connectorAttemptId || null
    if ((attemptId === null) !== (expectedAttempt === null) || (attemptId !== null && attemptId !== expectedAttempt.connectorAttemptId)) fail('STALE_RECONCILE_CANDIDATE', 'La dependencia de connector del flow ya no coincide con el snapshot.')
    return current
  }

  function time() {
    const value = clock()
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) fail('INVALID_EXECUTION_TIMESTAMP', 'Clock invalido.')
    return value
  }

  function flowResult(record, extra = {}) {
    return deepFreeze({ ...executionFlowView(record), ...extra })
  }

  async function requireFlow(executionFlowId) {
    const current = await persistence.read(executionFlowId)
    if (!current) fail('EXECUTION_FLOW_NOT_FOUND', 'Flujo de ejecucion inexistente.')
    return current
  }

  async function cas(record, nextState, patch) {
    return (await persistence.compareAndSet(record.executionFlowId, {
      expectedStates: [record.state],
      expectedRevision: record.revision,
      nextState,
      patch,
      updatedAt: time(),
    })).record
  }

  async function blocked(record, code, strict = false) {
    if (terminal.has(record.state)) return record
    const safeCode = knownFlowErrors.has(code) ? code : 'CORRUPT_DEPENDENCY'
    try { return await cas(record, 'blocked', { pendingOperations: [], lastErrorCode: safeCode }) } catch (error) {
      if (error.code !== 'STALE_EXECUTION_FLOW' || strict) throw error
      return requireFlow(record.executionFlowId)
    }
  }

  async function reopenIntake(flow) {
    let result
    try { result = await discovery.reopen(flow.intakeId) } catch { fail('INTAKE_NOT_FOUND', 'Intake durable inexistente.') }
    const intake = result?.intake
    return validateIntake(intake, flow.intakeId, flow.identity).intake
  }

  function planPackages(flow) {
    return ROLES.map((agent) => ({ agent, ...clone(flow.packageRefs[agent]) }))
  }

  function validateResearchPlan(value, flow) {
    if (!plainObject(value) || typeof value.researchPlanId !== 'string' || !RESEARCH_PLAN_ID.test(value.researchPlanId) || typeof value.evidenceCaseId !== 'string' || !EVIDENCE_CASE_ID.test(value.evidenceCaseId) || canonical(value.identity) !== canonical(flow.identity)) fail('INVALID_RESEARCH_PLAN', 'Plan de investigacion invalido.')
    const refs = []
    const expectedDiscoveryId = `discovery-${flow.intakeId.slice(7)}`
    for (const role of ROLES) {
      const request = value[role]
      if (!plainObject(request) || request.role !== role || typeof request.researchRequestId !== 'string' || !RESEARCH_REQUEST_ID.test(request.researchRequestId) || request.projectId !== flow.identity.projectId || request.intakeId !== flow.intakeId || request.discoveryId !== expectedDiscoveryId || request.researchPlanId !== value.researchPlanId || request.evidenceCaseId !== value.evidenceCaseId || request.packageId !== flow.packageRefs[role].packageId || request.handoffId !== flow.packageRefs[role].handoffId || canonical(request.identity) !== canonical(flow.identity)) fail('INVALID_RESEARCH_PLAN', 'Request de investigacion no correlacionada.')
      const expectedProvider = role === 'radar' ? 'manual_reference' : routing.providerType
      if (request.providerType !== expectedProvider) fail('INVALID_RESEARCH_PLAN', 'Provider o identidad de request invalido.')
      refs.push({ role, researchRequestId: request.researchRequestId })
    }
    return { researchPlanId: value.researchPlanId, evidenceCaseId: value.evidenceCaseId, requestRefs: refs }
  }

  async function prepareContext(flow, strict = false) {
    let result
    try { result = await discovery.prepareResearchContext(flow.intakeId) } catch { fail('CONTEXT_PREPARATION_FAILED', 'No se pudo preparar contexto de discovery.') }
    let prepared
    try { prepared = validateDiscoveryContext(result, flow) } catch {
      return blocked(flow, 'CORRUPT_DEPENDENCY', strict)
    }
    return cas(flow, 'prepare_research', {
      packageRefs: prepared.packageRefs,
      pendingOperations: ['prepare_research'],
      lastErrorCode: null,
    })
  }

  async function prepareResearch(flow, strict = false) {
    const intake = await reopenIntake(flow)
    let result
    try {
      result = await research.plan({
        intake,
        packages: planPackages(flow),
        providerType: routing.providerType,
        budget: clone(routing.budget),
        references: [],
      })
    } catch { fail('RESEARCH_PREPARATION_FAILED', 'No se pudo preparar investigacion.') }
    let plan
    try { plan = validateResearchPlan(result, flow) } catch {
      return blocked(flow, 'CORRUPT_DEPENDENCY', strict)
    }
    return cas(flow, 'prepare_attempts', {
      researchPlanId: plan.researchPlanId,
      evidenceCaseId: plan.evidenceCaseId,
      requestRefs: plan.requestRefs,
      pendingOperations: ['prepare_attempts'],
      lastErrorCode: null,
    })
  }

  function requestForRole(flow, role) {
    const value = flow.requestRefs.find((item) => item.role === role)
    if (!value) fail('INVALID_RESEARCH_PLAN', 'Request requerida inexistente.')
    return value
  }

  async function prepareInitialAttempt(flow) {
    const requestRef = requestForRole(flow, EXECUTION_ROLE)
    let context
    try { context = await research.getContributionContext(requestRef.researchRequestId) } catch { fail('ATTEMPT_PREPARATION_FAILED', 'No se pudo resolver contexto de connector.') }
    if (!plainObject(context) || context.researchRequestId !== requestRef.researchRequestId || context.researchPlanId !== flow.researchPlanId || context.evidenceCaseId !== flow.evidenceCaseId || context.projectId !== flow.identity.projectId || context.providerType !== routing.providerType || typeof context.researchSessionId !== 'string' || typeof context.discoveryId !== 'string') return { blocked: 'CORRUPT_DEPENDENCY' }
    try {
      return await connectorRuntime.prepareConnectorAttempt({
        researchSessionId: context.researchSessionId,
        researchRequestId: context.researchRequestId,
        discoveryId: context.discoveryId,
        projectId: context.projectId,
        providerType: routing.providerType,
        operation: routing.operation,
      })
    } catch (error) {
      if (['BUDGET_EXHAUSTED', 'CIRCUIT_OPEN'].includes(error.code)) return { blocked: error.code }
      fail('ATTEMPT_PREPARATION_FAILED', 'No se pudo preparar intento de connector.')
    }
  }

  async function prepareRetryAttempt(flow) {
    const prior = flow.attemptRefs.at(-1)
    if (!prior) return { blocked: 'CORRUPT_DEPENDENCY' }
    try {
      const result = await connectorRuntime.retryAttempt(prior.connectorAttemptId)
      if (!result || typeof result.attempt !== 'string' || !ATTEMPT_ID.test(result.attempt)) return { blocked: result?.errorCode === 'CIRCUIT_OPEN' ? 'CIRCUIT_OPEN' : 'CORRUPT_DEPENDENCY' }
      const status = await connectorRuntime.getAttemptStatus(result.attempt)
      return { record: status }
    } catch (error) {
      if (error.code === 'RETRY_LIMIT_REACHED') return { blocked: 'RETRY_LIMIT_REACHED' }
      fail('ATTEMPT_PREPARATION_FAILED', 'No se pudo preparar retry de connector.')
    }
  }

  async function prepareAttempts(flow, strict = false) {
    const result = flow.attemptRefs.length ? await prepareRetryAttempt(flow) : await prepareInitialAttempt(flow)
    if (result.blocked) return blocked(flow, result.blocked, strict)
    const record = result.record
    if (!plainObject(record) || typeof record.connectorAttemptId !== 'string' || !ATTEMPT_ID.test(record.connectorAttemptId) || record.projectId !== flow.identity.projectId || record.providerType !== routing.providerType || record.operation !== routing.operation) return blocked(flow, 'CORRUPT_DEPENDENCY', strict)
    if (record.state === 'not_connected') return blocked(flow, 'CONNECTOR_NOT_CONNECTED', strict)
    if (record.state === 'policy_blocked') return blocked(flow, record.errorCode === 'BUDGET_EXHAUSTED' || record.errorCode === 'CIRCUIT_OPEN' ? record.errorCode : 'CONNECTOR_POLICY_BLOCKED', strict)
    if (record.state !== 'prepared') return blocked(flow, 'CORRUPT_DEPENDENCY', strict)
    const attemptRefs = flow.attemptRefs.some((item) => item.connectorAttemptId === record.connectorAttemptId)
      ? flow.attemptRefs
      : [...flow.attemptRefs, { researchRequestId: requestForRole(flow, EXECUTION_ROLE).researchRequestId, connectorAttemptId: record.connectorAttemptId }]
    return cas(flow, 'ready_for_execution', {
      attemptRefs,
      pendingOperations: [],
      lastErrorCode: null,
    })
  }

  async function resumePreparation(executionFlowId, strict = false, initialFlow = null) {
    for (let step = 0; step < 8; step += 1) {
      const flow = step === 0 && initialFlow ? initialFlow : await requireFlow(executionFlowId)
      try {
        if (flow.state === 'prepare_context') await prepareContext(flow, strict)
        else if (flow.state === 'prepare_research') await prepareResearch(flow, strict)
        else if (flow.state === 'prepare_attempts') await prepareAttempts(flow, strict)
        else return flow
      } catch (error) {
        if (error.code !== 'STALE_EXECUTION_FLOW' || strict) throw error
      }
    }
    fail('STALE_EXECUTION_FLOW', 'El flow no pudo converger.')
  }

  async function prepareFlow(input) {
    exactInput(input, ['intakeId'])
    if (typeof input.intakeId !== 'string' || !INTAKE_ID.test(input.intakeId)) fail('INVALID_EXECUTION_REQUEST', 'Intake invalido.')
    const executionFlowId = deriveExecutionFlowId({ intakeId: input.intakeId, routingFingerprint: routeFingerprint })
    let created = await persistence.read(executionFlowId)
    let idempotent = true
    if (!created) {
      let discoveryResult
      try { discoveryResult = await discovery.reopen(input.intakeId) } catch { fail('INTAKE_NOT_FOUND', 'Intake durable inexistente.') }
      const checked = validateIntake(discoveryResult?.intake, input.intakeId)
      const result = await persistence.create(createExecutionFlow({ identity: checked.identity, intakeId: input.intakeId, routingFingerprint: routeFingerprint }, time()))
      created = result.record
      idempotent = result.idempotent
    }
    return exclusive(lockKey(executionFlowId), async () => flowResult(await resumePreparation(executionFlowId), { idempotent }))
  }

  function lastAttempt(flow) {
    const value = flow.attemptRefs.at(-1)
    if (!value) fail('EXECUTION_NOT_READY', 'No existe un intento preparado.')
    return value
  }

  function executionError(result, fallback) {
    return knownFlowErrors.has(result?.errorCode) ? result.errorCode : fallback
  }

  async function synchronize(flow, retryLocal = false, exactCaseView = undefined, strict = false) {
    let current = flow
    if (current.state !== 'sync_state') return current
    let caseView
    if (arguments.length >= 3) caseView = exactCaseView
    else {
      try {
        caseView = retryLocal ? await research.retryEvidenceCase(current.evidenceCaseId) : await research.reopenEvidenceCase(current.evidenceCaseId)
      } catch { fail('SYNC_FAILED', 'No se pudo sincronizar el caso de evidencia.') }
    }
    if (!plainObject(caseView) || caseView.researchPlanId !== current.researchPlanId || caseView.evidenceCaseId !== current.evidenceCaseId || caseView.projectId !== current.identity.projectId || canonical(caseView.identity) !== canonical(current.identity)) return blocked(current, 'CORRUPT_DEPENDENCY', strict)
    if (caseView.state === 'requires_human') return cas(current, 'requires_human', { pendingOperations: [], lastErrorCode: null })
    if (caseView.state === 'needs_corroboration') return cas(current, 'needs_corroboration', { pendingOperations: [], lastErrorCode: null })
    if (caseView.state === 'completed_with_evidence' || (caseView.state === 'accepted_for_context' && caseView.memory?.status === 'appended' && (!Array.isArray(caseView.pendingOperations) || caseView.pendingOperations.length === 0))) return cas(current, 'completed_with_evidence', { pendingOperations: [], lastErrorCode: null })
    if (caseView.state === 'accepted_for_context') return current
    return blocked(current, 'CORRUPT_DEPENDENCY', strict)
  }

  async function settleExecution(flow, result, strict = false, exactCaseView = undefined) {
    if (!plainObject(result) || typeof result.state !== 'string') return blocked(flow, 'CORRUPT_DEPENDENCY', strict)
    if (['succeeded', 'partial'].includes(result.state)) {
      const syncing = await cas(flow, 'sync_state', { pendingOperations: ['sync_state'], lastErrorCode: null })
      return strict ? synchronize(syncing, false, exactCaseView, true) : synchronize(syncing, false)
    }
    if (result.state === 'failed_transient' && result.deliveryState === 'pending') return cas(flow, 'resume_delivery', { pendingOperations: ['resume_delivery'], lastErrorCode: 'DELIVERY_PENDING' })
    if (result.state === 'failed_transient') return cas(flow, 'ready_for_execution', { pendingOperations: [], lastErrorCode: executionError(result, 'ADAPTER_FAILURE') })
    if (result.state === 'policy_blocked') return blocked(flow, executionError(result, 'CONNECTOR_POLICY_BLOCKED'), strict)
    if (result.state === 'not_connected') return blocked(flow, 'CONNECTOR_NOT_CONNECTED', strict)
    if (result.state === 'timed_out') return blocked(flow, 'EXECUTION_TIMEOUT', strict)
    if (result.state === 'cancelled') return blocked(flow, 'CANCELLED', strict)
    if (result.state === 'failed_permanent') return blocked(flow, executionError(result, 'ADAPTER_PERMANENT_FAILURE'), strict)
    return blocked(flow, 'EXECUTION_FAILED', strict)
  }

  async function executeNext(input) {
    exactInput(input, ['executionFlowId'])
    if (typeof input.executionFlowId !== 'string' || !FLOW_ID.test(input.executionFlowId)) fail('INVALID_EXECUTION_REQUEST', 'Flow invalido.')
    return exclusive(lockKey(input.executionFlowId), async () => {
      let flow = await requireFlow(input.executionFlowId)
      if (terminal.has(flow.state)) return flowResult(flow, { idempotent: true, executionDispatched: false })
      if (flow.state === 'sync_state') return flowResult(await synchronize(flow, false), { idempotent: true, executionDispatched: false })
      if (!['ready_for_execution', 'explicit_execution', 'resume_delivery'].includes(flow.state)) fail('EXECUTION_NOT_READY', 'El flow no esta listo para ejecucion explicita.')
      if (flow.state === 'ready_for_execution') flow = await cas(flow, 'explicit_execution', { pendingOperations: ['explicit_execution'], lastErrorCode: null })
      let attempt = lastAttempt(flow)
      let status = await connectorRuntime.getAttemptStatus(attempt.connectorAttemptId)
      if (!status) return flowResult(await blocked(flow, 'CORRUPT_DEPENDENCY'), { idempotent: false, executionDispatched: false })
      if (flow.state === 'resume_delivery' && status.state === 'failed_transient' && status.deliveryState === 'pending') {
        let retried
        try { retried = await connectorRuntime.retryAttempt(attempt.connectorAttemptId) } catch (error) {
          if (error.code === 'RETRY_LIMIT_REACHED') return flowResult(await blocked(flow, 'RETRY_LIMIT_REACHED'), { idempotent: false, executionDispatched: false })
          fail('ATTEMPT_PREPARATION_FAILED', 'No se pudo preparar la reanudacion de delivery.')
        }
        if (!plainObject(retried) || typeof retried.attempt !== 'string' || !ATTEMPT_ID.test(retried.attempt)) return flowResult(await blocked(flow, 'CORRUPT_DEPENDENCY'), { idempotent: false, executionDispatched: false })
        const resumedStatus = await connectorRuntime.getAttemptStatus(retried.attempt)
        if (!plainObject(resumedStatus) || resumedStatus.state !== 'prepared' || resumedStatus.deliveryState !== 'pending' || resumedStatus.projectId !== flow.identity.projectId || resumedStatus.providerType !== routing.providerType || resumedStatus.operation !== routing.operation) return flowResult(await blocked(flow, 'CORRUPT_DEPENDENCY'), { idempotent: false, executionDispatched: false })
        const requestRef = requestForRole(flow, EXECUTION_ROLE)
        const attemptRefs = flow.attemptRefs.some((item) => item.connectorAttemptId === retried.attempt)
          ? flow.attemptRefs
          : [...flow.attemptRefs, { researchRequestId: requestRef.researchRequestId, connectorAttemptId: retried.attempt }]
        flow = await cas(flow, 'resume_delivery', { attemptRefs, pendingOperations: ['resume_delivery'], lastErrorCode: 'DELIVERY_PENDING' })
        attempt = lastAttempt(flow)
        status = resumedStatus
      }
      if (['succeeded', 'partial', 'failed_transient', 'failed_permanent', 'timed_out', 'cancelled', 'policy_blocked', 'not_connected'].includes(status.state)) return flowResult(await settleExecution(flow, status), { idempotent: true, executionDispatched: false })
      if (flow.state === 'resume_delivery' && status.state === 'prepared' && status.deliveryState !== 'pending') return flowResult(await blocked(flow, 'CORRUPT_DEPENDENCY'), { idempotent: false, executionDispatched: false })
      if (status.state !== 'prepared') return flowResult(flow, { idempotent: true, executionDispatched: false })
      const result = await connectorRuntime.executePreparedAttempt(attempt.connectorAttemptId)
      const settledResult = result?.state === 'failed_transient' ? (await connectorRuntime.getAttemptStatus(attempt.connectorAttemptId) || result) : result
      return flowResult(await settleExecution(flow, settledResult), { idempotent: false, executionDispatched: true })
    })
  }

  async function retryFlow(input) {
    exactInput(input, ['executionFlowId'])
    if (typeof input.executionFlowId !== 'string' || !FLOW_ID.test(input.executionFlowId)) fail('INVALID_EXECUTION_REQUEST', 'Flow invalido.')
    return exclusive(lockKey(input.executionFlowId), async () => {
      let flow = await requireFlow(input.executionFlowId)
      if (terminal.has(flow.state)) return flowResult(flow, { idempotent: true })
      if (flow.state !== 'ready_for_execution' || !flow.lastErrorCode) fail('RETRY_NOT_AVAILABLE', 'El flow no admite retry.')
      flow = await cas(flow, 'prepare_attempts', { pendingOperations: ['prepare_attempts'], lastErrorCode: null })
      return flowResult(await resumePreparation(flow.executionFlowId), { idempotent: false })
    })
  }

  async function cancelFlow(input) {
    exactInput(input, ['executionFlowId'])
    if (typeof input.executionFlowId !== 'string' || !FLOW_ID.test(input.executionFlowId)) fail('INVALID_EXECUTION_REQUEST', 'Flow invalido.')
    const before = await requireFlow(input.executionFlowId)
    if (terminal.has(before.state)) return flowResult(before, { idempotent: true })
    const attempt = lastAttempt(before)
    const cancelled = await connectorRuntime.cancelAttempt(attempt.connectorAttemptId)
    return exclusive(lockKey(input.executionFlowId), async () => {
      const flow = await requireFlow(input.executionFlowId)
      if (terminal.has(flow.state)) return flowResult(flow, { idempotent: true })
      if (cancelled?.state !== 'cancelled') return flowResult(flow, { idempotent: true })
      return flowResult(await blocked(flow, 'CANCELLED'), { idempotent: false })
    })
  }

  async function reopenFlow(input) {
    exactInput(input, ['executionFlowId'])
    if (typeof input.executionFlowId !== 'string' || !FLOW_ID.test(input.executionFlowId)) fail('INVALID_EXECUTION_REQUEST', 'Flow invalido.')
    return flowResult(await requireFlow(input.executionFlowId), { idempotent: true })
  }

  async function reconcileOne(flow, exactCaseView = undefined, exactAttemptStatus = undefined, targeted = false) {
    if (terminal.has(flow.state) || flow.state === 'ready_for_execution') return flow
    if (['prepare_context', 'prepare_research', 'prepare_attempts'].includes(flow.state)) return targeted ? resumePreparation(flow.executionFlowId, true, flow) : resumePreparation(flow.executionFlowId)
    if (flow.state === 'sync_state') return targeted ? synchronize(flow, false, exactCaseView, true) : synchronize(flow, true)
    if (!['explicit_execution', 'resume_delivery'].includes(flow.state)) return flow
    const attempt = lastAttempt(flow)
    const status = targeted ? exactAttemptStatus : await connectorRuntime.getAttemptStatus(attempt.connectorAttemptId)
    if (!status) return blocked(flow, 'CORRUPT_DEPENDENCY', targeted)
    if (status.state === 'prepared' && flow.state === 'resume_delivery' && status.deliveryState === 'pending') return flow
    if (status.state === 'prepared') return cas(flow, 'ready_for_execution', { pendingOperations: [], lastErrorCode: 'INTERRUPTED' })
    if (['succeeded', 'partial'].includes(status.state)) {
      const syncing = await cas(flow, 'sync_state', { pendingOperations: ['sync_state'], lastErrorCode: null })
      return targeted ? synchronize(syncing, false, exactCaseView, true) : synchronize(syncing, true)
    }
    if (status.state === 'failed_transient' && status.deliveryState === 'pending') return flow.state === 'resume_delivery' ? flow : cas(flow, 'resume_delivery', { pendingOperations: ['resume_delivery'], lastErrorCode: 'DELIVERY_PENDING' })
    if (status.state === 'failed_transient') return cas(flow, 'ready_for_execution', { pendingOperations: [], lastErrorCode: 'INTERRUPTED' })
    if (['running', 'contributing'].includes(status.state)) return flow
    return settleExecution(flow, status, targeted, exactCaseView)
  }

  async function isReconcileActionable(flow) {
    if (['prepare_context', 'prepare_research', 'prepare_attempts', 'sync_state'].includes(flow.state)) return true
    if (!['explicit_execution', 'resume_delivery'].includes(flow.state)) return false
    const attempt = lastAttempt(flow)
    const status = await connectorRuntime.getAttemptStatus(attempt.connectorAttemptId)
    if (!status) return true
    if (['running', 'contributing'].includes(status.state)) return false
    if (flow.state === 'resume_delivery' && status.deliveryState === 'pending' && ['prepared', 'failed_transient'].includes(status.state)) return false
    return true
  }

  async function reconcileFlows(input) {
    const hasCandidates = plainObject(input) && Object.hasOwn(input, 'candidates')
    exactInput(input, hasCandidates ? ['projectId', 'limit', 'candidates'] : ['projectId', 'limit'])
    if (typeof input.projectId !== 'string' || !SAFE_ID.test(input.projectId) || !Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 50) fail('INVALID_RECONCILE_REQUEST', 'Reconciliacion invalida.')
    if (hasCandidates) {
      const exactCandidates = recoveryCandidates(input.candidates, input.limit)
      if (exactCandidates.length === 0) return deepFreeze({ items: [], remaining: 0, corruptionCount: 0, adaptersExecuted: 0 })
      const keys = exactCandidates.map((item) => lockKey(item.executionFlowId))
      return exclusiveMany(keys, async () => {
        const flows = []
        for (const item of exactCandidates) flows.push(await requireRecoveryCandidate(item, input.projectId))
        const lockedIndexes = flows.map((_, index) => index)
        const snapshotsById = new Map()
        for (const index of lockedIndexes) {
          const item = exactCandidates[index]
          if (!item.evidenceCaseSnapshot) continue
          const prior = snapshotsById.get(item.evidenceCaseSnapshot.evidenceCaseId)
          if (prior && canonical(prior) !== canonical(item.evidenceCaseSnapshot)) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshots de evidencia incompatibles.')
          snapshotsById.set(item.evidenceCaseSnapshot.evidenceCaseId, item.evidenceCaseSnapshot)
        }
        const attemptSnapshotsById = new Map()
        for (const index of lockedIndexes) {
          const item = exactCandidates[index]
          if (!item.connectorAttemptSnapshot) continue
          const prior = attemptSnapshotsById.get(item.connectorAttemptSnapshot.connectorAttemptId)
          if (prior && canonical(prior) !== canonical(item.connectorAttemptSnapshot)) fail('INVALID_RECONCILE_CANDIDATES', 'Snapshots de connector incompatibles.')
          attemptSnapshotsById.set(item.connectorAttemptSnapshot.connectorAttemptId, item.connectorAttemptSnapshot)
        }
        const items = []
        let failures = 0
        if (lockedIndexes.length > 0) await research.withExactEvidenceCaseSnapshots(input.projectId, [...snapshotsById.values()], async (captured) => {
          const views = new Map(captured.map((item) => [item.evidenceCaseId, item.view]))
          return connectorRuntime.withExactAttemptSnapshots(input.projectId, [...attemptSnapshotsById.values()], async (capturedAttempts) => {
            const statuses = new Map(capturedAttempts.map((item) => [item.connectorAttemptId, item.status]))
            for (const index of lockedIndexes) {
              const caseSnapshot = exactCandidates[index].evidenceCaseSnapshot
              const attemptSnapshot = exactCandidates[index].connectorAttemptSnapshot
              const caseView = caseSnapshot ? views.get(caseSnapshot.evidenceCaseId) : null
              const attemptStatus = attemptSnapshot ? statuses.get(attemptSnapshot.connectorAttemptId) : null
              try {
                items.push(executionFlowView(await reconcileOne(flows[index], caseView, attemptStatus, true)))
              } catch (error) {
                if (typeof error?.code === 'string' && error.code.startsWith('STALE_')) throw error
                failures += 1
              }
            }
          })
        })
        return deepFreeze({ items, remaining: failures, corruptionCount: 0, adaptersExecuted: 0 })
      })
    }
    await connectorRuntime.reconcileAttempts({ projectId: input.projectId, limit: input.limit })
    const detail = await persistence.listDetailed(input.projectId)
    const ordered = [...detail.records].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.executionFlowId.localeCompare(right.executionFlowId))
    const candidates = []
    for (const item of ordered) if (await isReconcileActionable(item)) candidates.push(item)
    const selected = candidates.slice(0, input.limit)
    if (selected.length === 0) return deepFreeze({ items: [], remaining: 0, corruptionCount: detail.corruptions.length, adaptersExecuted: 0 })
    const keys = selected.map((item) => lockKey(item.executionFlowId))
    const exact = await exclusiveMany(keys, async () => {
      const flows = []
      for (const item of selected) {
        const current = await persistence.read(item.executionFlowId)
        if (current && canonical(flowRecoverySnapshot(current)) === canonical(flowRecoverySnapshot(item))) flows.push(current)
      }
      const items = []
      for (const flow of flows) items.push(executionFlowView(await reconcileOne(flow)))
      return { items, adaptersExecuted: 0 }
    })
    return deepFreeze({ ...exact, remaining: Math.max(0, candidates.length - selected.length), corruptionCount: detail.corruptions.length })
  }

  return deepFreeze({
    prepareFlow,
    executeNext,
    retryFlow,
    cancelFlow,
    reopenFlow,
    getFlowStatus: reopenFlow,
    reconcileFlows,
  })
}

module.exports = {
  SupervisedResearchExecutionError,
  createSupervisedResearchExecution,
  routingFingerprint,
}
