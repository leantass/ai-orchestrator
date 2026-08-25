const crypto = require('crypto')
const { CONNECTORS, attempt, connector, delivery: createDelivery, completeDelivery, view } = require('./jefe-research-connector-contract.cjs')
const { execute: coordinate, cancel: cancelCoordinated, isExecuting: isCoordinated } = require('./jefe-research-connector-coordinator.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')
const { structuredAnalysisCandidate } = require('./jefe-research-structured-analysis-connector.cjs')
const { budget: providerBudget } = require('./jefe-research-provider-policy.cjs')

const defaultScheduler = Object.freeze({ setTimeout: global.setTimeout, clearTimeout: global.clearTimeout })
const POLICY_FIELDS = Object.freeze(['maxReservationsPerProject', 'reservationCost', 'maxConcurrency', 'executionTimeoutMs', 'maxTransientFailures', 'circuitCooldownMs', 'maxAttempts'])
const CANDIDATE_FIELDS = Object.freeze(['status', 'url', 'mimeType', 'bytes', 'contentHash', 'excerpt', 'redirects', 'codes', 'consumed', 'claim'])
const CONTEXT_FIELDS = Object.freeze(['researchSessionId', 'researchRequestId', 'researchPlanId', 'evidenceCaseId', 'discoveryId', 'projectId', 'providerType'])
const CONNECTOR_INPUT_FIELDS = Object.freeze(['schemaVersion', 'researchRequestId', 'providerType', 'objective', 'questions', 'budget', 'needsCorroboration'])
const RESEARCH_BRIDGE_FIELDS = Object.freeze(['getContributionContext', 'getConnectorInput', 'receiveContribution'])

class ConnectorRuntimeError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new ConnectorRuntimeError(code, message)
}

function timeOf(clock) {
  return typeof clock === 'function' ? clock() : clock.now()
}

function inactive(record) {
  return {
    state: record.state,
    idempotent: true,
    referenceOnly: record.receipt?.status === 'not_executed',
    classification: record.receipt?.classification,
    ...(record.errorCode ? { errorCode: record.errorCode } : {}),
  }
}

function trustedAdapter(value) {
  if (typeof value === 'function') return true
  return Boolean(value && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)) && Object.keys(value).length === 2 && value.kind === 'controlled_local' && Object.hasOwn(value, 'execute') && typeof value.execute === 'function')
}

function createConnectorRuntime(options = {}) {
  const optionFields = ['persistence', 'clock', 'trustedAdapters', 'trustedPolicy', 'trustedScheduler', 'trustedResearch']
  if (!options || typeof options !== 'object' || Array.isArray(options) || Object.keys(options).some((key) => !optionFields.includes(key))) fail('INVALID_RUNTIME_OPTIONS', 'Runtime invalido.')
  const { persistence, clock = () => new Date().toISOString(), trustedAdapters = {}, trustedPolicy = {}, trustedScheduler = defaultScheduler, trustedResearch = null } = options
  const persistenceMethods = ['createReservedAttempt', 'transitionAttempt', 'updateHealth', 'readHealth', 'read', 'listAllAttempts']
  if (!persistence || persistenceMethods.some((key) => typeof persistence[key] !== 'function') || typeof persistence.authorityRoot !== 'string') fail('INVALID_DEPENDENCY', 'Persistencia invalida.')
  if (!trustedPolicy || typeof trustedPolicy !== 'object' || Array.isArray(trustedPolicy) || Object.keys(trustedPolicy).some((key) => !POLICY_FIELDS.includes(key))) fail('INVALID_POLICY', 'Politica invalida.')
  const knownAdapterIds = new Set(Object.values(CONNECTORS).map((item) => item.connectorId))
  if (!trustedAdapters || typeof trustedAdapters !== 'object' || Array.isArray(trustedAdapters) || Object.entries(trustedAdapters).some(([key, item]) => !knownAdapterIds.has(key) || !trustedAdapter(item) || (typeof item === 'object' && key !== 'structured-analysis-local'))) fail('INVALID_ADAPTERS', 'Adapters invalidos.')
  if (!trustedScheduler || typeof trustedScheduler.setTimeout !== 'function' || typeof trustedScheduler.clearTimeout !== 'function') fail('INVALID_SCHEDULER', 'Scheduler invalido.')
  if (trustedResearch !== null && (!trustedResearch || typeof trustedResearch !== 'object' || Array.isArray(trustedResearch) || ![Object.prototype, null].includes(Object.getPrototypeOf(trustedResearch)) || Object.keys(trustedResearch).length !== RESEARCH_BRIDGE_FIELDS.length || Object.keys(trustedResearch).some((key) => !RESEARCH_BRIDGE_FIELDS.includes(key)) || RESEARCH_BRIDGE_FIELDS.some((key) => !Object.hasOwn(trustedResearch, key) || typeof trustedResearch[key] !== 'function'))) fail('INVALID_RESEARCH_BRIDGE', 'Integracion de investigacion invalida.')
  const policy = {
    maxReservationsPerProject: 8,
    reservationCost: 1,
    maxConcurrency: 1,
    executionTimeoutMs: 30000,
    maxTransientFailures: Number.MAX_SAFE_INTEGER,
    circuitCooldownMs: 60000,
    maxAttempts: 2,
    ...trustedPolicy,
  }
  if (!Number.isSafeInteger(policy.maxReservationsPerProject) || policy.maxReservationsPerProject < 0 || policy.maxReservationsPerProject > 1000 || !Number.isSafeInteger(policy.reservationCost) || policy.reservationCost < 0 || policy.reservationCost > 1000 || !Number.isSafeInteger(policy.maxConcurrency) || policy.maxConcurrency < 1 || policy.maxConcurrency > 8 || !Number.isSafeInteger(policy.executionTimeoutMs) || policy.executionTimeoutMs < 1 || policy.executionTimeoutMs > 300000 || !Number.isSafeInteger(policy.maxTransientFailures) || policy.maxTransientFailures < 1 || !Number.isSafeInteger(policy.circuitCooldownMs) || policy.circuitCooldownMs < 1 || policy.circuitCooldownMs > 3600000 || !Number.isSafeInteger(policy.maxAttempts) || policy.maxAttempts < 1 || policy.maxAttempts > 10) fail('INVALID_POLICY', 'Politica invalida.')

  const conditional = async (record, nextState, patch) => persistence.transitionAttempt(record.connectorAttemptId, { expectedStates: [record.state], expectedRevision: record.revision, nextState, patch })
  const halfOpenAt = () => new Date(new Date(timeOf(clock)).getTime() + policy.circuitCooldownMs).toISOString()

  function researchAvailable() {
    return trustedResearch && RESEARCH_BRIDGE_FIELDS.every((key) => typeof trustedResearch[key] === 'function')
  }

  async function contributionContext(researchRequestId) {
    if (!researchAvailable()) fail('RESEARCH_INTEGRATION_UNAVAILABLE', 'Integracion de investigacion no disponible.')
    let context
    try { context = await trustedResearch.getContributionContext(researchRequestId) } catch { fail('INVALID_RESEARCH_CORRELATION', 'Correlacion de investigacion invalida.') }
    if (!context || typeof context !== 'object' || Array.isArray(context) || Object.keys(context).some((key) => !CONTEXT_FIELDS.includes(key)) || CONTEXT_FIELDS.some((key) => typeof context[key] !== 'string')) fail('INVALID_RESEARCH_CORRELATION', 'Correlacion de investigacion invalida.')
    return context
  }

  function assertContext(input, context) {
    for (const key of ['researchSessionId', 'researchRequestId', 'discoveryId', 'projectId', 'providerType']) if (input[key] !== context[key]) fail('INVALID_RESEARCH_CORRELATION', 'Correlacion de investigacion invalida.')
  }

  async function connectorInput(record) {
    if (!researchAvailable()) fail('RESEARCH_INTEGRATION_UNAVAILABLE', 'Integracion de investigacion no disponible.')
    let input
    try { input = await trustedResearch.getConnectorInput(record.researchRequestId) } catch { fail('INVALID_RESEARCH_CORRELATION', 'Correlacion de investigacion invalida.') }
    if (!input || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input)) || Object.keys(input).length !== CONNECTOR_INPUT_FIELDS.length || Object.keys(input).some((key) => !CONNECTOR_INPUT_FIELDS.includes(key)) || CONNECTOR_INPUT_FIELDS.some((key) => !Object.hasOwn(input, key))) fail('INVALID_RESEARCH_CORRELATION', 'Correlacion de investigacion invalida.')
    if (input.schemaVersion !== 'jefe-research-connector-input/v1' || input.researchRequestId !== record.researchRequestId || input.providerType !== record.providerType || typeof input.objective !== 'string' || !Array.isArray(input.questions) || !input.budget || typeof input.budget !== 'object' || Array.isArray(input.budget) || typeof input.needsCorroboration !== 'boolean') fail('INVALID_RESEARCH_CORRELATION', 'Correlacion de investigacion invalida.')
    return JSON.parse(canonical(input))
  }

  async function adaptCandidate(record, candidateValue, adapterKind, trustedInput = null) {
    if (!candidateValue || typeof candidateValue !== 'object' || Array.isArray(candidateValue) || ![Object.prototype, null].includes(Object.getPrototypeOf(candidateValue)) || Object.keys(candidateValue).some((key) => !CANDIDATE_FIELDS.includes(key) || candidateValue[key] === undefined)) fail('INVALID_CONNECTOR_CANDIDATE', 'Candidate invalido.')
    if (!Object.hasOwn(candidateValue, 'status') || !Object.hasOwn(candidateValue, 'claim') || !['received', 'partial'].includes(candidateValue.status) || typeof candidateValue.claim !== 'string') fail('INVALID_CONNECTOR_CANDIDATE', 'Candidate invalido.')
    const snapshot = {}
    for (const key of Object.keys(candidateValue)) {
      if (key === 'redirects' || key === 'codes') snapshot[key] = Array.isArray(candidateValue[key]) ? [...candidateValue[key]] : candidateValue[key]
      else if (key === 'consumed') snapshot[key] = candidateValue[key] && typeof candidateValue[key] === 'object' && !Array.isArray(candidateValue[key]) ? { ...candidateValue[key] } : candidateValue[key]
      else snapshot[key] = candidateValue[key]
    }
    const context = await contributionContext(record.researchRequestId)
    assertContext(record, context)
    const deliveryBudget = trustedInput?.budget || providerBudget()
    const rawReceipt = {
      researchRequestId: context.researchRequestId,
      providerType: context.providerType,
      operation: record.operation,
      status: snapshot.status,
      method: adapterKind === 'controlled_local' ? 'controlled_adapter' : 'injected_controlled_adapter',
    }
    for (const key of ['url', 'mimeType', 'bytes', 'contentHash', 'excerpt', 'redirects', 'codes', 'consumed']) if (snapshot[key] !== undefined) rawReceipt[key] = snapshot[key]
    const delivery = createDelivery({ record, context, rawReceipt, claim: snapshot.claim, budget: deliveryBudget, now: timeOf(clock) })
    return { context, rawReceipt: delivery.rawReceipt, claim: delivery.claim, delivery }
  }

  async function recordFailure(record, countFailure = true) {
    await persistence.updateHealth(record.connectorId, (health) => {
      if (health.state === 'half_open' && health.probeAttemptId !== record.connectorAttemptId) return health
      if (!countFailure && health.state !== 'half_open') return health
      const failureCount = health.failureCount + (countFailure ? 1 : 0)
      const opened = health.state === 'half_open' || failureCount >= policy.maxTransientFailures
      return {
        ...health,
        failureCount,
        state: opened ? 'open' : health.state,
        openedAt: opened ? timeOf(clock) : health.openedAt,
        halfOpenEligibleAt: opened ? halfOpenAt() : health.halfOpenEligibleAt,
        probeAttemptId: null,
        lastTransitionAt: timeOf(clock),
      }
    })
  }

  async function recordSuccess(record) {
    await persistence.updateHealth(record.connectorId, (health) => {
      if (health.state === 'open' || (health.state === 'half_open' && health.probeAttemptId !== record.connectorAttemptId)) return health
      if (health.state === 'closed' && health.failureCount === 0) return health
      return { ...health, state: 'closed', failureCount: 0, openedAt: null, halfOpenEligibleAt: null, probeAttemptId: null, lastTransitionAt: timeOf(clock) }
    })
  }

  async function prepareConnectorAttempt(input) {
    if (researchAvailable()) {
      const context = await contributionContext(input?.researchRequestId)
      assertContext(input, context)
    }
    let record = attempt(input, timeOf(clock))
    if (record.state === 'prepared') {
      const health = await persistence.readHealth(record.connectorId)
      if (health.state === 'open' && timeOf(clock) < health.halfOpenEligibleAt) record = { ...record, state: 'policy_blocked', errorCode: 'CIRCUIT_OPEN' }
    }
    return persistence.createReservedAttempt(record, { maxReservationsPerProject: policy.maxReservationsPerProject, reservationCost: policy.reservationCost })
  }

  async function terminalFromStale(id) {
    const current = await persistence.read(id)
    return current ? inactive(current) : { state: 'not_found' }
  }

  async function failRunning(record, errorCode, transient = false, countFailure = transient) {
    try {
      const saved = await conditional(record, transient ? 'failed_transient' : 'failed_permanent', {
        errorCode,
        budgetReservation: { ...record.budgetReservation, consumed: record.budgetReservation.reserved },
        updatedAt: timeOf(clock),
      })
      await recordFailure(record, countFailure)
      return inactive(saved.record)
    } catch (error) {
      if (error.code === 'STALE_TRANSITION') return terminalFromStale(record.connectorAttemptId)
      throw error
    }
  }

  async function timeoutRunning(record) {
    try {
      const saved = await conditional(record, 'timed_out', {
        errorCode: 'EXECUTION_TIMEOUT',
        budgetReservation: { ...record.budgetReservation, consumed: record.budgetReservation.reserved },
        updatedAt: timeOf(clock),
      })
      await recordFailure(record)
      return inactive(saved.record)
    } catch (error) {
      if (error.code === 'STALE_TRANSITION') return terminalFromStale(record.connectorAttemptId)
      throw error
    }
  }

  async function claimCircuitProbe(record) {
    let allowed = true
    await persistence.updateHealth(record.connectorId, (health) => {
      if (health.state === 'open') {
        if (timeOf(clock) < health.halfOpenEligibleAt) {
          allowed = false
          return health
        }
        return { ...health, state: 'half_open', probeAttemptId: record.connectorAttemptId, lastTransitionAt: timeOf(clock) }
      }
      if (health.state === 'half_open' && health.probeAttemptId !== record.connectorAttemptId) allowed = false
      return health
    })
    return allowed
  }

  async function executePreparedAttempt(id) {
    const initial = await persistence.read(id)
    if (!initial) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    if (initial.state !== 'prepared') return inactive(initial)
    const definition = connector(initial.providerType)
    if (definition.status !== 'ready') return inactive(initial)
    return coordinate({
      root: persistence.authorityRoot,
      connectorId: initial.connectorId,
      maxConcurrency: policy.maxConcurrency,
      attemptId: id,
      task: async ({ cancelled }) => {
        const current = await persistence.read(id)
        if (!current || current.state !== 'prepared') return current ? inactive(current) : { state: 'not_found' }
        let running
        try { running = (await conditional(current, 'running', { updatedAt: timeOf(clock) })).record } catch (error) { if (error.code === 'STALE_TRANSITION') return terminalFromStale(id); throw error }
        let contributionRecord = running
        if (!running.delivery) {
          const probeAllowed = await claimCircuitProbe(running)
          const claimed = await persistence.read(id)
          if (!claimed || claimed.state !== 'running' || claimed.revision !== running.revision) {
            if (probeAllowed) await recordFailure(running, false)
            return claimed ? inactive(claimed) : { state: 'not_found' }
          }
          if (!probeAllowed) {
            try { return inactive((await conditional(running, 'failed_transient', { errorCode: 'CIRCUIT_OPEN', updatedAt: timeOf(clock) })).record) } catch (error) { if (error.code === 'STALE_TRANSITION') return terminalFromStale(id); throw error }
          }
          const adapter = trustedAdapters[running.connectorId]
          const adapterKind = adapter && typeof adapter === 'object' ? adapter.kind : 'injected_fixture'
          let adapterInput = Object.freeze({ connectorAttemptId: running.connectorAttemptId, connectorId: running.connectorId })
          if (adapterKind === 'controlled_local') {
            let input
            try { input = await connectorInput(running) } catch { return failRunning(running, 'INVALID_RESEARCH_CORRELATION') }
            adapterInput = Object.freeze({
              connectorAttemptId: running.connectorAttemptId,
              connectorId: running.connectorId,
              researchRequestId: running.researchRequestId,
              providerType: running.providerType,
              operation: running.operation,
              input,
            })
          }
          const adapterPromise = Promise.resolve().then(() => adapter ? (adapterKind === 'controlled_local' ? adapter.execute(adapterInput) : adapter(adapterInput)) : { state: 'not_executed' })
          adapterPromise.catch(() => {})
          let timer
          const timeout = new Promise((resolve) => { timer = trustedScheduler.setTimeout(() => resolve({ kind: 'timeout' }), policy.executionTimeoutMs) })
          const outcome = await Promise.race([adapterPromise.then((value) => ({ kind: 'result', value }), () => ({ kind: 'failure' })), cancelled, timeout])
          trustedScheduler.clearTimeout(timer)
          if (outcome.kind === 'cancelled') return terminalFromStale(id)
          if (outcome.kind === 'timeout') return timeoutRunning(running)
          if (outcome.kind === 'failure') return failRunning(running, 'ADAPTER_FAILURE', true)

          const adapterResult = outcome.value
          if (!adapterResult || typeof adapterResult !== 'object' || Array.isArray(adapterResult)) return failRunning(running, 'UNTRUSTED_ADAPTER_OUTPUT')
          const resultKeys = Object.keys(adapterResult)
          if (resultKeys.length === 1 && adapterResult.state === 'failed_permanent') return failRunning(running, 'ADAPTER_PERMANENT_FAILURE')
          if (resultKeys.length === 1 && adapterResult.state === 'not_executed') {
            const connectorReceipt = { status: 'not_executed', classification: 'UNTRUSTED_EXTERNAL_CONTENT' }
            try {
              const saved = await conditional(running, 'succeeded', { receipt: connectorReceipt, budgetReservation: { ...running.budgetReservation, consumed: running.budgetReservation.reserved }, updatedAt: timeOf(clock) })
              await recordSuccess(running)
              return { state: 'not_executed', classification: connectorReceipt.classification, referenceOnly: true, attempt: saved.record.connectorAttemptId }
            } catch (error) {
              if (error.code === 'STALE_TRANSITION') return terminalFromStale(id)
              throw error
            }
          }
          if (resultKeys.length !== 1 || !Object.hasOwn(adapterResult, 'candidate')) return failRunning(running, 'UNTRUSTED_ADAPTER_OUTPUT')
          if (adapterKind === 'controlled_local') {
            let expected
            try { expected = structuredAnalysisCandidate(adapterInput.input) } catch { return failRunning(running, 'INVALID_CONNECTOR_CANDIDATE') }
            if (canonical(adapterResult.candidate) !== canonical(expected)) return failRunning(running, 'INVALID_CONNECTOR_CANDIDATE')
          }

          let adapted
          try {
            adapted = await adaptCandidate(running, adapterResult.candidate, adapterKind, adapterInput.input || null)
            contributionRecord = (await conditional(running, 'contributing', { delivery: adapted.delivery, updatedAt: timeOf(clock) })).record
          } catch (error) {
            if (error.code === 'STALE_TRANSITION') return terminalFromStale(id)
            if (error.code === 'INVALID_RESEARCH_CORRELATION' || error.code === 'RESEARCH_INTEGRATION_UNAVAILABLE') return failRunning(running, 'INVALID_RESEARCH_CORRELATION')
            return failRunning(running, 'INVALID_CONNECTOR_CANDIDATE')
          }
        } else {
          try { contributionRecord = (await conditional(running, 'contributing', { updatedAt: timeOf(clock) })).record } catch (error) { if (error.code === 'STALE_TRANSITION') return terminalFromStale(id); throw error }
        }

        const durableDelivery = contributionRecord.delivery
        let researchResult
        try {
          researchResult = await trustedResearch.receiveContribution({ researchRequestId: durableDelivery.researchRequestId, rawReceipt: durableDelivery.rawReceipt, claim: durableDelivery.claim })
        } catch (error) {
          const candidateCodes = new Set(['INVALID_CONTRIBUTION', 'INVALID_RECEIPT', 'INVALID_RECEIPT_CORRELATION', 'INVALID_TEXT', 'INVALID_URL', 'INVALID_EVIDENCE', 'INVALID_EVIDENCE_CORRELATION', 'INCOMPATIBLE_RECEIPT_REPLAY', 'INCOMPATIBLE_CONTRIBUTION_REPLAY', 'BUDGET_EXHAUSTED'])
          if (candidateCodes.has(error.code)) return failRunning(contributionRecord, error.code === 'INVALID_CONTRIBUTION' || error.code === 'INVALID_TEXT' || error.code === 'INVALID_EVIDENCE' ? 'INVALID_CONNECTOR_CANDIDATE' : 'INVALID_PROVIDER_RECEIPT', false, false)
          return failRunning(contributionRecord, 'RESEARCH_RECEIVE_REJECTED', true, false)
        }

        const canonicalReceipt = researchResult?.receipt
        const connectorReceipt = canonicalReceipt && canonicalReceipt.receiptId === durableDelivery.expectedReceiptId && canonicalReceipt.researchRequestId === durableDelivery.researchRequestId && canonicalReceipt.providerType === durableDelivery.providerType && canonicalReceipt.operation === durableDelivery.operation && canonicalReceipt.status === durableDelivery.rawReceipt.status && canonicalReceipt.classification === 'UNTRUSTED_EXTERNAL_CONTENT'
          ? { status: canonicalReceipt.status, classification: canonicalReceipt.classification, receiptId: canonicalReceipt.receiptId }
          : null
        const evidenceId = researchResult?.evidence?.evidenceId || null
        if (!connectorReceipt || researchResult?.evidenceCaseId !== durableDelivery.evidenceCaseId || researchResult?.researchPlanId !== durableDelivery.researchPlanId || !['evidence_pending', 'needs_corroboration', 'accepted_for_context', 'requires_human', 'completed_with_evidence'].includes(researchResult?.state) || (evidenceId !== null && !/^evidence-[a-f0-9]{32}$/u.test(evidenceId))) return failRunning(contributionRecord, 'RESEARCH_RECEIVE_REJECTED', true, false)
        const research = {
          researchRequestId: running.researchRequestId,
          receiptId: connectorReceipt.receiptId,
          state: researchResult.state,
          evidenceId,
          evidenceCaseId: researchResult.evidenceCaseId,
          researchPlanId: researchResult.researchPlanId,
        }
        try {
          const terminalState = connectorReceipt.status === 'partial' ? 'partial' : 'succeeded'
          const delivered = completeDelivery(durableDelivery, connectorReceipt.receiptId, timeOf(clock))
          const saved = await conditional(contributionRecord, terminalState, { delivery: delivered, receipt: connectorReceipt, research, budgetReservation: { ...contributionRecord.budgetReservation, consumed: contributionRecord.budgetReservation.reserved }, updatedAt: timeOf(clock) })
          await recordSuccess(saved.record)
          return {
            state: terminalState,
            classification: connectorReceipt.classification,
            referenceOnly: false,
            attempt: saved.record.connectorAttemptId,
            research: {
              state: researchResult.state,
              researchPlanId: researchResult.researchPlanId,
              evidenceCaseId: researchResult.evidenceCaseId,
              evidence: researchResult.evidence,
              memory: researchResult.memory,
            },
          }
        } catch (error) {
          if (error.code === 'STALE_TRANSITION') return terminalFromStale(id)
          throw error
        }
      },
    })
  }

  async function cancelAttempt(id) {
    const record = await persistence.read(id)
    if (!record) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    if (record.state === 'cancelled' || !['prepared', 'running'].includes(record.state)) return inactive(record)
    try {
      const saved = await conditional(record, 'cancelled', { errorCode: 'CANCELLED', updatedAt: timeOf(clock) })
      cancelCoordinated({ root: persistence.authorityRoot, connectorId: record.connectorId, attemptId: id })
      await recordFailure(record, false)
      return inactive(saved.record)
    } catch (error) {
      if (error.code === 'STALE_TRANSITION') return terminalFromStale(id)
      throw error
    }
  }

  async function retryAttempt(id) {
    const record = await persistence.read(id)
    if (!record) fail('ATTEMPT_NOT_FOUND', 'Intento inexistente.')
    const circuitBlocked = record.state === 'policy_blocked' && record.errorCode === 'CIRCUIT_OPEN'
    if (record.state !== 'failed_transient' && !circuitBlocked) return inactive(record)
    const health = await persistence.readHealth(record.connectorId)
    if (!record.delivery && (health.state === 'half_open' || (health.state === 'open' && timeOf(clock) < health.halfOpenEligibleAt))) return { ...inactive(record), errorCode: 'CIRCUIT_OPEN' }
    if ((record.attemptNumber || 1) >= policy.maxAttempts) fail('RETRY_LIMIT_REACHED', 'Limite de reintentos alcanzado.')
    const existing = await persistence.listAllAttempts(record.projectId)
    const descendant = existing.find((item) => item.retryOfAttemptId === id)
    if (descendant) return { state: descendant.state, retried: true, attempt: descendant.connectorAttemptId, idempotent: true }
    const rootAttemptId = record.rootAttemptId || record.connectorAttemptId
    const attemptNumber = (record.attemptNumber || 1) + 1
    const seed = { rootAttemptId, retryOfAttemptId: id, attemptNumber, projectId: record.projectId, researchSessionId: record.researchSessionId, researchRequestId: record.researchRequestId, discoveryId: record.discoveryId, connectorId: record.connectorId }
    const connectorAttemptId = `connector-attempt-${crypto.createHash('sha256').update(canonical(seed)).digest('hex').slice(0, 32)}`
    const next = { ...record, connectorAttemptId, rootAttemptId, retryOfAttemptId: id, attemptNumber, state: 'prepared', revision: 0, createdAt: timeOf(clock), budgetReservation: { reserved: 0, consumed: 0 } }
    delete next.errorCode
    delete next.receipt
    delete next.research
    delete next.updatedAt
    const saved = await persistence.createReservedAttempt(next, { maxReservationsPerProject: policy.maxReservationsPerProject, reservationCost: record.delivery ? 0 : policy.reservationCost })
    return { state: saved.record.state, retried: true, attempt: saved.record.connectorAttemptId, idempotent: saved.idempotent }
  }

  async function reconcileAttempts({ projectId, limit = 20 } = {}) {
    if (typeof projectId !== 'string' || !/^[a-z][a-z0-9-]{2,80}$/u.test(projectId) || !Number.isSafeInteger(limit) || limit < 1 || limit > 50) fail('INVALID_RECONCILE', 'Reconciliacion invalida.')
    const allRecords = await persistence.listAllAttempts(projectId)
    for (const connectorId of [...new Set(allRecords.map((record) => record.connectorId))].sort()) {
      const health = await persistence.readHealth(connectorId)
      if (health.state !== 'half_open') continue
      const probe = allRecords.find((record) => record.connectorAttemptId === health.probeAttemptId)
      if (probe && ['succeeded', 'partial'].includes(probe.state)) await recordSuccess(probe)
      else if (probe && ['failed_transient', 'failed_permanent', 'timed_out', 'cancelled', 'policy_blocked', 'not_connected'].includes(probe.state)) await recordFailure(probe, false)
    }
    const records = allRecords.filter((record) => (record.state === 'running' || record.state === 'contributing') && !isCoordinated({ root: persistence.authorityRoot, connectorId: record.connectorId, attemptId: record.connectorAttemptId })).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.connectorAttemptId.localeCompare(b.connectorAttemptId))
    const selected = records.slice(0, limit)
    const items = []
    for (const record of selected) {
      try {
        const saved = (await conditional(record, 'failed_transient', { errorCode: 'INTERRUPTED', budgetReservation: { ...record.budgetReservation, consumed: record.budgetReservation.reserved }, updatedAt: timeOf(clock) })).record
        await recordFailure(saved, !saved.delivery)
        items.push(view(saved))
      } catch (error) { if (error.code !== 'STALE_TRANSITION') throw error }
    }
    return { items, remaining: Math.max(0, records.length - selected.length) }
  }

  async function getAttemptStatus(id) {
    const record = await persistence.read(id)
    return record ? { ...view(record), deliveryState: record.delivery?.state || null } : null
  }

  function getConnectorHealth(providerType) {
    const value = connector(providerType)
    return { connectorId: value.connectorId, state: value.status, networkEnabled: false }
  }

  return { prepareConnectorAttempt, executePreparedAttempt, cancelAttempt, retryAttempt, reconcileAttempts, getAttemptStatus, getConnectorHealth }
}

module.exports = { ConnectorRuntimeError, createConnectorRuntime }
