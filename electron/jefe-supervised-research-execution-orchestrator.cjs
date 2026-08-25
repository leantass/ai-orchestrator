const crypto = require('crypto')
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
const SAFE_ID = /^[a-z][a-z0-9_-]{2,80}$/u
const PACKAGE_ID = /^context-package-[a-f0-9]{32}$/u
const HANDOFF_ID = /^agent-handoff-[a-f0-9]{32}$/u
const RESEARCH_PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const EVIDENCE_CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const RESEARCH_REQUEST_ID = /^research-[a-f0-9]{32}$/u
const ATTEMPT_ID = /^connector-attempt-[a-f0-9]{32}$/u
const EXECUTION_ROLE = 'scout'
const CONSUMER_STATUSES = new Set(['not_connected', 'registered_internal'])
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
  const researchMethods = ['plan', 'getContributionContext', 'reopenEvidenceCase', 'retryEvidenceCase']
  const runtimeMethods = ['prepareConnectorAttempt', 'executePreparedAttempt', 'cancelAttempt', 'retryAttempt', 'reconcileAttempts', 'getAttemptStatus', 'getConnectorHealth']
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
  const lockKey = (executionFlowId) => `${persistence.authorityRoot}:${executionFlowId}`

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

  async function blocked(record, code) {
    if (terminal.has(record.state)) return record
    const safeCode = knownFlowErrors.has(code) ? code : 'CORRUPT_DEPENDENCY'
    try { return await cas(record, 'blocked', { pendingOperations: [], lastErrorCode: safeCode }) } catch (error) {
      if (error.code !== 'STALE_EXECUTION_FLOW') throw error
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

  async function prepareContext(flow) {
    let result
    try { result = await discovery.prepareResearchContext(flow.intakeId) } catch { fail('CONTEXT_PREPARATION_FAILED', 'No se pudo preparar contexto de discovery.') }
    let prepared
    try { prepared = validateDiscoveryContext(result, flow) } catch {
      return blocked(flow, 'CORRUPT_DEPENDENCY')
    }
    return cas(flow, 'prepare_research', {
      packageRefs: prepared.packageRefs,
      pendingOperations: ['prepare_research'],
      lastErrorCode: null,
    })
  }

  async function prepareResearch(flow) {
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
      return blocked(flow, 'CORRUPT_DEPENDENCY')
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

  async function prepareAttempts(flow) {
    const result = flow.attemptRefs.length ? await prepareRetryAttempt(flow) : await prepareInitialAttempt(flow)
    if (result.blocked) return blocked(flow, result.blocked)
    const record = result.record
    if (!plainObject(record) || typeof record.connectorAttemptId !== 'string' || !ATTEMPT_ID.test(record.connectorAttemptId) || record.projectId !== flow.identity.projectId || record.providerType !== routing.providerType || record.operation !== routing.operation) return blocked(flow, 'CORRUPT_DEPENDENCY')
    if (record.state === 'not_connected') return blocked(flow, 'CONNECTOR_NOT_CONNECTED')
    if (record.state === 'policy_blocked') return blocked(flow, record.errorCode === 'BUDGET_EXHAUSTED' || record.errorCode === 'CIRCUIT_OPEN' ? record.errorCode : 'CONNECTOR_POLICY_BLOCKED')
    if (record.state !== 'prepared') return blocked(flow, 'CORRUPT_DEPENDENCY')
    const attemptRefs = flow.attemptRefs.some((item) => item.connectorAttemptId === record.connectorAttemptId)
      ? flow.attemptRefs
      : [...flow.attemptRefs, { researchRequestId: requestForRole(flow, EXECUTION_ROLE).researchRequestId, connectorAttemptId: record.connectorAttemptId }]
    return cas(flow, 'ready_for_execution', {
      attemptRefs,
      pendingOperations: [],
      lastErrorCode: null,
    })
  }

  async function resumePreparation(executionFlowId) {
    for (let step = 0; step < 8; step += 1) {
      const flow = await requireFlow(executionFlowId)
      try {
        if (flow.state === 'prepare_context') await prepareContext(flow)
        else if (flow.state === 'prepare_research') await prepareResearch(flow)
        else if (flow.state === 'prepare_attempts') await prepareAttempts(flow)
        else return flow
      } catch (error) {
        if (error.code !== 'STALE_EXECUTION_FLOW') throw error
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

  async function synchronize(flow, retryLocal = false) {
    let current = flow
    if (current.state !== 'sync_state') return current
    let caseView
    try {
      caseView = retryLocal ? await research.retryEvidenceCase(current.evidenceCaseId) : await research.reopenEvidenceCase(current.evidenceCaseId)
    } catch { fail('SYNC_FAILED', 'No se pudo sincronizar el caso de evidencia.') }
    if (!plainObject(caseView) || caseView.researchPlanId !== current.researchPlanId || caseView.evidenceCaseId !== current.evidenceCaseId || caseView.projectId !== current.identity.projectId || canonical(caseView.identity) !== canonical(current.identity)) return blocked(current, 'CORRUPT_DEPENDENCY')
    if (caseView.state === 'requires_human') return cas(current, 'requires_human', { pendingOperations: [], lastErrorCode: null })
    if (caseView.state === 'needs_corroboration') return cas(current, 'needs_corroboration', { pendingOperations: [], lastErrorCode: null })
    if (caseView.state === 'completed_with_evidence' || (caseView.state === 'accepted_for_context' && caseView.memory?.status === 'appended' && (!Array.isArray(caseView.pendingOperations) || caseView.pendingOperations.length === 0))) return cas(current, 'completed_with_evidence', { pendingOperations: [], lastErrorCode: null })
    if (caseView.state === 'accepted_for_context') return current
    return blocked(current, 'CORRUPT_DEPENDENCY')
  }

  async function settleExecution(flow, result) {
    if (!plainObject(result) || typeof result.state !== 'string') return blocked(flow, 'CORRUPT_DEPENDENCY')
    if (['succeeded', 'partial'].includes(result.state)) {
      const syncing = await cas(flow, 'sync_state', { pendingOperations: ['sync_state'], lastErrorCode: null })
      return synchronize(syncing, false)
    }
    if (result.state === 'failed_transient' && result.deliveryState === 'pending') return cas(flow, 'resume_delivery', { pendingOperations: ['resume_delivery'], lastErrorCode: 'DELIVERY_PENDING' })
    if (result.state === 'failed_transient') return cas(flow, 'ready_for_execution', { pendingOperations: [], lastErrorCode: executionError(result, 'ADAPTER_FAILURE') })
    if (result.state === 'policy_blocked') return blocked(flow, executionError(result, 'CONNECTOR_POLICY_BLOCKED'))
    if (result.state === 'not_connected') return blocked(flow, 'CONNECTOR_NOT_CONNECTED')
    if (result.state === 'timed_out') return blocked(flow, 'EXECUTION_TIMEOUT')
    if (result.state === 'cancelled') return blocked(flow, 'CANCELLED')
    if (result.state === 'failed_permanent') return blocked(flow, executionError(result, 'ADAPTER_PERMANENT_FAILURE'))
    return blocked(flow, 'EXECUTION_FAILED')
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

  async function reconcileOne(flow) {
    if (terminal.has(flow.state) || flow.state === 'ready_for_execution') return flow
    if (['prepare_context', 'prepare_research', 'prepare_attempts'].includes(flow.state)) return resumePreparation(flow.executionFlowId)
    if (flow.state === 'sync_state') return synchronize(flow, true)
    if (!['explicit_execution', 'resume_delivery'].includes(flow.state)) return flow
    const attempt = lastAttempt(flow)
    const status = await connectorRuntime.getAttemptStatus(attempt.connectorAttemptId)
    if (!status) return blocked(flow, 'CORRUPT_DEPENDENCY')
    if (status.state === 'prepared' && flow.state === 'resume_delivery' && status.deliveryState === 'pending') return flow
    if (status.state === 'prepared') return cas(flow, 'ready_for_execution', { pendingOperations: [], lastErrorCode: 'INTERRUPTED' })
    if (['succeeded', 'partial'].includes(status.state)) {
      const syncing = await cas(flow, 'sync_state', { pendingOperations: ['sync_state'], lastErrorCode: null })
      return synchronize(syncing, true)
    }
    if (status.state === 'failed_transient' && status.deliveryState === 'pending') return flow.state === 'resume_delivery' ? flow : cas(flow, 'resume_delivery', { pendingOperations: ['resume_delivery'], lastErrorCode: 'DELIVERY_PENDING' })
    if (status.state === 'failed_transient') return cas(flow, 'ready_for_execution', { pendingOperations: [], lastErrorCode: 'INTERRUPTED' })
    if (['running', 'contributing'].includes(status.state)) return flow
    return settleExecution(flow, status)
  }

  async function reconcileFlows(input) {
    exactInput(input, ['projectId', 'limit'])
    if (typeof input.projectId !== 'string' || !SAFE_ID.test(input.projectId) || !Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 50) fail('INVALID_RECONCILE_REQUEST', 'Reconciliacion invalida.')
    await connectorRuntime.reconcileAttempts({ projectId: input.projectId, limit: input.limit })
    const detail = await persistence.listDetailed(input.projectId)
    const candidates = detail.records.filter((item) => !terminal.has(item.state)).sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.executionFlowId.localeCompare(right.executionFlowId))
    const selected = candidates.slice(0, input.limit)
    const items = []
    for (const item of selected) {
      const result = await exclusive(lockKey(item.executionFlowId), async () => reconcileOne(await requireFlow(item.executionFlowId)))
      items.push(executionFlowView(result))
    }
    return deepFreeze({ items, remaining: Math.max(0, candidates.length - selected.length), corruptionCount: detail.corruptions.length, adaptersExecuted: 0 })
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
