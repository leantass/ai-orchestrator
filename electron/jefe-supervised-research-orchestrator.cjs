const crypto = require('crypto')
const { request, receipt } = require('./jefe-research-contract.cjs')
const { candidate } = require('./jefe-research-evidence-contract.cjs')
const { evaluate, publicView } = require('./jefe-research-evidence-gate.cjs')
const { canonical } = require('./jefe-context-package-contract.cjs')

const operationLocks = new Map()
let memoryStoreSequence = 0

class SupervisedResearchError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new SupervisedResearchError(code, message)
}

function digest(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex')
}

function clone(value) {
  return JSON.parse(canonical(value))
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  for (const item of Object.values(value)) deepFreeze(item)
  return Object.freeze(value)
}

function exclusive(key, work) {
  const previous = operationLocks.get(key) || Promise.resolve()
  let release
  const tail = new Promise((resolve) => { release = resolve })
  operationLocks.set(key, tail)
  return previous.then(work).finally(() => {
    release()
    if (operationLocks.get(key) === tail) operationLocks.delete(key)
  })
}

function correlationSeed(value) {
  if (!value || typeof value !== 'object') fail('INVALID_RESEARCH_PLAN', 'Plan de investigacion invalido.')
  const seed = {
    projectId: value.projectId,
    discoveryId: value.discoveryId,
    intakeId: value.intakeId,
    objective: value.objective,
    questions: value.questions,
  }
  if (Object.values(seed).slice(0, 4).some((item) => typeof item !== 'string' || !item) || !Array.isArray(seed.questions) || seed.questions.length < 1) fail('INVALID_RESEARCH_PLAN', 'Plan de investigacion invalido.')
  return seed
}

function deriveResearchPlanId(value) {
  return `research-plan-${digest(correlationSeed(value)).slice(0, 32)}`
}

function deriveEvidenceCaseId(value) {
  const researchPlanId = typeof value?.researchPlanId === 'string' ? value.researchPlanId : deriveResearchPlanId(value)
  if (!/^research-plan-[a-f0-9]{32}$/u.test(researchPlanId)) fail('INVALID_EVIDENCE_CASE', 'Caso de evidencia invalido.')
  return `evidence-case-${digest({ researchPlanId, slot: 'primary_evidence' }).slice(0, 32)}`
}

function contributionInput(value) {
  const allowed = ['researchRequestId', 'rawReceipt', 'claim']
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_CONTRIBUTION', 'Contribucion invalida.')
  if (typeof value.researchRequestId !== 'string' || !value.rawReceipt || typeof value.rawReceipt !== 'object' || Array.isArray(value.rawReceipt) || typeof value.claim !== 'string' || !value.claim.trim() || value.claim.length > 500) fail('INVALID_CONTRIBUTION', 'Contribucion invalida.')
  return { researchRequestId: value.researchRequestId, rawReceipt: value.rawReceipt, claim: value.claim.trim() }
}

const AGGREGATE_LIMITS = Object.freeze({ queries: 'maxQueries', sources: 'maxSources', bytes: 'maxTotalBytes', durationMs: 'maxDurationMs', redirects: 'maxRedirects', attempts: 'maxAttempts' })

function assertAggregateBudget(caseRecord, requestRecord, nextReceipt) {
  const receipts = caseRecord.receipts.filter((item) => item.researchRequestId === requestRecord.researchRequestId)
  for (const [field, budgetField] of Object.entries(AGGREGATE_LIMITS)) {
    const total = [...receipts, nextReceipt].reduce((sum, item) => sum + (item.consumed?.[field] || 0), 0)
    if (total > requestRecord.budget[budgetField]) fail('BUDGET_EXHAUSTED', 'Presupuesto de investigacion agotado.')
  }
  const totalBytes = [...receipts, nextReceipt].reduce((sum, item) => sum + (item.bytes || 0), 0)
  if (totalBytes > requestRecord.budget.maxTotalBytes || receipts.length + 1 > requestRecord.budget.maxAttempts) fail('BUDGET_EXHAUSTED', 'Presupuesto de investigacion agotado.')
}

function createMemoryCasePersistence() {
  const values = new Map()
  const authorityRoot = `memory-evidence-cases-${++memoryStoreSequence}`
  const read = async (id) => values.has(id) ? clone(values.get(id)) : null
  const write = async (record) => {
    const prior = values.get(record.evidenceCaseId)
    if (prior && canonical(prior) === canonical(record)) return { record: clone(prior), idempotent: true }
    if (prior) fail('INCOMPATIBLE_EVIDENCE_CASE', 'Caso de evidencia incompatible.')
    values.set(record.evidenceCaseId, clone(record))
    return { record: clone(record), idempotent: false }
  }
  const update = async (id, updater) => {
    const prior = values.get(id)
    if (!prior) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
    const proposed = { ...updater(clone(prior)), revision: prior.revision }
    if (canonical(prior) === canonical(proposed)) return { record: clone(prior), idempotent: true }
    proposed.revision += 1
    values.set(id, clone(proposed))
    return { record: clone(proposed), idempotent: false }
  }
  const list = async (projectId) => [...values.values()].filter((item) => !projectId || item.projectId === projectId).sort((a, b) => a.evidenceCaseId.localeCompare(b.evidenceCaseId)).map(clone)
  const findByRequestId = async (id) => clone([...values.values()].find((item) => item.requests.some((requestRecord) => requestRecord.researchRequestId === id)) || null)
  const rebuildIndex = async () => ({ index: { evidenceCaseIds: [...values.keys()].sort() }, idempotent: true })
  return { authorityRoot, read, write, create: write, update, list, findByRequestId, rebuildIndex }
}

function normalizedClaim(value) {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim().toLocaleLowerCase('es')
}

function createSupervisedResearch({ memory = null, persistence = null, evidenceCasePersistence = null, clock = () => new Date().toISOString(), trusted = {} } = {}) {
  const caseStore = evidenceCasePersistence || createMemoryCasePersistence()
  if (!caseStore || typeof caseStore.read !== 'function' || typeof caseStore.write !== 'function' || typeof caseStore.update !== 'function' || typeof caseStore.findByRequestId !== 'function') fail('INVALID_EVIDENCE_CASE_PERSISTENCE', 'Persistencia de casos invalida.')
  const records = new Map()
  const requestCases = new Map()
  const requests = {}
  const operationKey = (evidenceCaseId) => `${caseStore.authorityRoot || 'evidence-case-store'}:${evidenceCaseId}`
  const sessionId = (researchRequestId) => `research-session-${digest(researchRequestId).slice(0, 32)}`

  function registerCase(caseRecord) {
    for (const storedRequest of caseRecord.requests) {
      const requestRecord = deepFreeze(clone(storedRequest))
      requests[requestRecord.researchRequestId] = requestRecord
      requestCases.set(requestRecord.researchRequestId, caseRecord.evidenceCaseId)
      const requestReceipts = caseRecord.receipts.filter((item) => item.researchRequestId === requestRecord.researchRequestId)
      records.set(requestRecord.researchRequestId, {
        request: requestRecord,
        receipts: requestReceipts,
        evidence: caseRecord.evidenceDecisions,
        status: sessionState(caseRecord, requestRecord),
        pending: caseRecord.pendingOperations.length > 0,
        nextResponsible: caseRecord.nextResponsible || 'jefe',
        evidenceCaseId: caseRecord.evidenceCaseId,
        researchPlanId: caseRecord.researchPlanId,
      })
    }
  }

  function sessionState(caseRecord, requestRecord) {
    if (caseRecord.state === 'preparing' || caseRecord.state === 'ready') return requestRecord.state
    if (caseRecord.state === 'accepted_for_context' && caseRecord.memory?.status === 'appended') return 'completed_with_evidence'
    return caseRecord.state
  }

  function sessionRecord(caseRecord, requestRecord) {
    const requestReceipts = caseRecord.receipts.filter((item) => item.researchRequestId === requestRecord.researchRequestId)
    return {
      schemaVersion: 'jefe-supervised-research-session/v1',
      researchSessionId: sessionId(requestRecord.researchRequestId),
      researchRequestId: requestRecord.researchRequestId,
      researchPlanId: caseRecord.researchPlanId,
      evidenceCaseId: caseRecord.evidenceCaseId,
      discoveryId: requestRecord.discoveryId,
      intakeId: requestRecord.intakeId,
      projectId: requestRecord.projectId,
      packageId: requestRecord.packageId,
      handoffId: requestRecord.handoffId,
      providerType: requestRecord.providerType,
      policyFingerprint: digest(requestRecord.budget),
      budget: requestRecord.budget,
      budgetConsumed: requestReceipts.reduce((sum, item) => sum + (item.bytes || 0), 0),
      status: sessionState(caseRecord, requestRecord),
      request: requestRecord,
      receipts: requestReceipts,
      evidenceDecisions: caseRecord.evidenceDecisions,
      pendingOperations: caseRecord.pendingOperations,
      ...(caseRecord.lastErrorCode ? { lastErrorCode: caseRecord.lastErrorCode } : {}),
      nextResponsible: caseRecord.nextResponsible || 'jefe',
      createdAt: requestRecord.createdAt,
      updatedAt: caseRecord.updatedAt,
    }
  }

  async function persistSession(caseRecord, requestRecord) {
    if (!persistence) return { idempotent: true }
    return persistence.write(sessionRecord(caseRecord, requestRecord))
  }

  async function persistAllSessions(caseRecord) {
    for (const requestRecord of caseRecord.requests) await persistSession(caseRecord, requestRecord)
  }

  async function markCaseFailure(evidenceCaseId, error, pendingOperation) {
    try {
      return (await caseStore.update(evidenceCaseId, (current) => {
        const pendingOperations = [...new Set([...current.pendingOperations, pendingOperation])].sort()
        return { ...current, pendingOperations, lastErrorCode: error.code || 'RESEARCH_PERSISTENCE_FAILED', updatedAt: clock() }
      })).record
    } catch {
      return caseStore.read(evidenceCaseId)
    }
  }

  async function completePreparation(evidenceCaseId) {
    let current = await caseStore.read(evidenceCaseId)
    if (!current) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
    if (current.state !== 'preparing') {
      registerCase(current)
      return current
    }
    try {
      for (const requestRecord of current.requests) {
        if (!current.preparedRequestIds.includes(requestRecord.researchRequestId)) {
          await persistSession(current, requestRecord)
          current = (await caseStore.update(evidenceCaseId, (draft) => ({
            ...draft,
            preparedRequestIds: [...new Set([...draft.preparedRequestIds, requestRecord.researchRequestId])].sort(),
            updatedAt: clock(),
          }))).record
        }
      }
      current = (await caseStore.update(evidenceCaseId, (draft) => {
        const next = {
          ...draft,
          state: 'ready',
          pendingOperations: draft.pendingOperations.filter((item) => item !== 'complete_plan'),
          nextResponsible: 'jefe',
          updatedAt: clock(),
        }
        delete next.lastErrorCode
        return next
      })).record
      await persistAllSessions(current)
      registerCase(current)
      return current
    } catch (error) {
      const failed = await markCaseFailure(evidenceCaseId, error, 'complete_plan')
      if (failed) registerCase(failed)
      throw error
    }
  }

  function planResult(caseRecord) {
    const byRole = Object.fromEntries(caseRecord.requests.map((item) => [item.role, requests[item.researchRequestId] || item]))
    const scout = byRole.scout
    return {
      state: scout.state === 'policy_blocked' ? 'policy_blocked' : scout.state === 'not_connected' ? 'not_connected' : 'awaiting_provider',
      caseState: caseRecord.state,
      researchPlanId: caseRecord.researchPlanId,
      evidenceCaseId: caseRecord.evidenceCaseId,
      radar: byRole.radar,
      scout,
      hermes: byRole.hermes,
      nextResponsible: caseRecord.nextResponsible || 'jefe',
    }
  }

  async function plan({ intake, packages, providerType = 'metasearch', budget, references = [] }) {
    if (!intake || intake.state !== 'ready_for_discovery' || !intake.identity?.versionId || !Array.isArray(packages)) fail('INVALID_INTAKE', 'Intake no apto para investigacion.')
    const byAgent = new Map(packages.map((item) => [item.agent, item]))
    if (!byAgent.has('radar') || !byAgent.has('scout') || !byAgent.has('hermes')) fail('MISSING_CONTEXT_PACKAGE', 'Faltan paquetes de contexto.')
    const topic = {
      discoveryId: `discovery-${intake.intakeId.slice(7)}`,
      intakeId: intake.intakeId,
      projectId: intake.identity.projectId,
      objective: intake.objective,
      questions: intake.questions.length ? intake.questions : [intake.expectedOutcome],
    }
    const researchPlanId = deriveResearchPlanId(topic)
    const evidenceCaseId = deriveEvidenceCaseId({ researchPlanId })
    return exclusive(operationKey(evidenceCaseId), async () => {
      let current = await caseStore.read(evidenceCaseId)
      const createdAt = current?.createdAt || clock()
      const common = {
        ...topic,
        packageId: byAgent.get('scout').packageId,
        handoffId: `handoff-${byAgent.get('scout').packageId.slice(-24)}`,
        providerType,
        purpose: 'research',
        budget,
        references,
        needsCorroboration: true,
      }
      const plannedRequests = [
        request({ ...common, role: 'radar', purpose: 'discovery', providerType: 'manual_reference' }, createdAt, trusted),
        request({ ...common, role: 'scout' }, createdAt, trusted),
        request({ ...common, role: 'hermes', packageId: byAgent.get('hermes').packageId, handoffId: `handoff-${byAgent.get('hermes').packageId.slice(-24)}` }, createdAt, trusted),
      ].map((requestRecord) => ({ ...requestRecord, researchPlanId, evidenceCaseId }))
      if (!current) {
        current = (await caseStore.write({
          schemaVersion: 'jefe-supervised-research-evidence-case/v1',
          evidenceCaseId,
          researchPlanId,
          projectId: topic.projectId,
          discoveryId: topic.discoveryId,
          intakeId: topic.intakeId,
          objective: topic.objective,
          questions: topic.questions,
          state: 'preparing',
          revision: 0,
          requests: plannedRequests,
          preparedRequestIds: [],
          receipts: [],
          contributions: [],
          evidenceDecisions: [],
          pendingOperations: ['complete_plan'],
          memory: { status: 'not_applicable', entryId: null },
          nextResponsible: 'jefe',
          createdAt,
          updatedAt: createdAt,
        })).record
      } else {
        const existingIds = current.requests.map((item) => item.researchRequestId).sort()
        const plannedIds = plannedRequests.map((item) => item.researchRequestId).sort()
        if (canonical(existingIds) !== canonical(plannedIds) || current.researchPlanId !== researchPlanId) fail('INCOMPATIBLE_RESEARCH_PLAN', 'Plan de investigacion incompatible.')
      }
      registerCase(current)
      if (current.state === 'preparing') current = await completePreparation(evidenceCaseId)
      else await persistAllSessions(current)
      registerCase(current)
      return planResult(current)
    })
  }

  function evidenceFromContribution(caseRecord, contribution) {
    const requestRecord = caseRecord.requests.find((item) => item.researchRequestId === contribution.researchRequestId)
    const storedReceipt = caseRecord.receipts.find((item) => item.receiptId === contribution.receiptId)
    if (!requestRecord || !storedReceipt || !['received', 'partial'].includes(storedReceipt.status)) return null
    return candidate({ request: requestRecord, receipt: storedReceipt, claim: contribution.claim, now: storedReceipt.receivedAt })
  }

  function aggregate(draft) {
    const evidence = draft.contributions.map((item) => evidenceFromContribution(draft, item)).filter(Boolean).sort((a, b) => a.receiptId.localeCompare(b.receiptId))
    if (!evidence.length) return { ...draft, state: 'evidence_pending', evidenceDecisions: [], pendingOperations: [], nextResponsible: 'scout' }
    const groups = new Map()
    for (const item of evidence) {
      const key = normalizedClaim(item.claim)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(item)
    }
    if (groups.size > 1) {
      const branches = [...groups.values()].map((items) => ({ claim: items[0].claim, evidenceIds: items.map((item) => item.evidenceId).sort() })).sort((a, b) => a.claim.localeCompare(b.claim))
      const base = evidence[0]
      const decision = {
        ...base,
        state: 'requires_human',
        nextResponsible: 'lean',
        corroborations: [],
        contradictions: evidence.slice(1).map((item) => item.evidenceId).sort(),
        branches,
      }
      return { ...draft, state: 'requires_human', evidenceDecisions: [decision], pendingOperations: [], nextResponsible: 'lean', contradictionStatus: 'preserved' }
    }
    const base = evidence[0]
    const corroborations = evidence.slice(1).map((item) => ({ ...item, claim: base.claim, polarity: 'supports' }))
    const decision = evaluate({ request: draft.requests.find((item) => item.researchRequestId === base.researchRequestId), receipt: draft.receipts.find((item) => item.receiptId === base.receiptId), claim: base.claim, corroborations, now: base.timestamp })
    const pendingOperations = decision.state === 'accepted_for_context' && draft.memory?.status !== 'appended' ? ['memory_append'] : []
    const next = { ...draft, state: decision.state, evidenceDecisions: [decision], pendingOperations, nextResponsible: decision.nextResponsible }
    delete next.contradictionStatus
    return next
  }

  async function appendAcceptedMemory(caseRecord) {
    if (caseRecord.state !== 'accepted_for_context' || !caseRecord.pendingOperations.includes('memory_append')) return caseRecord
    if (!memory || typeof memory.append !== 'function') {
      return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => ({ ...draft, memory: { status: 'not_configured', entryId: null }, pendingOperations: draft.pendingOperations.filter((item) => item !== 'memory_append'), updatedAt: clock() }))).record
    }
    const decision = caseRecord.evidenceDecisions[0]
    const entryId = `research-evidence-${digest(caseRecord.evidenceCaseId).slice(0, 24)}`
    const receiptIds = caseRecord.contributions.map((item) => item.receiptId).sort()
    const references = [...new Set(caseRecord.receipts.map((item) => item.url).filter(Boolean))].sort().map((value) => ({ kind: 'url', value }))
    try {
      await memory.append({
        entryId,
        scope: 'version',
        identity: { projectId: caseRecord.projectId, runId: caseRecord.discoveryId, versionId: caseRecord.intakeId },
        type: 'evidence',
        summary: decision.claim,
        actor: decision.actor,
        authority: 'technical_result',
        provenance: 'supervised_research_evidence_case_gate',
        timestamp: decision.timestamp,
        references,
        relations: [],
        metadata: {
          researchPlanId: caseRecord.researchPlanId,
          evidenceCaseId: caseRecord.evidenceCaseId,
          evidenceId: decision.evidenceId,
          receiptIds,
          classification: decision.classification,
          evidenceState: decision.state,
          nextResponsible: decision.nextResponsible,
        },
      })
      return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => {
        const next = { ...draft, memory: { status: 'appended', entryId }, pendingOperations: draft.pendingOperations.filter((item) => item !== 'memory_append'), updatedAt: clock() }
        delete next.lastErrorCode
        return next
      })).record
    } catch (error) {
      return (await caseStore.update(caseRecord.evidenceCaseId, (draft) => ({ ...draft, memory: { status: 'pending', entryId }, pendingOperations: [...new Set([...draft.pendingOperations, 'memory_append'])].sort(), lastErrorCode: error.code || 'MEMORY_APPEND_FAILED', updatedAt: clock() }))).record
    }
  }

  async function resolveCase(researchRequestId) {
    const known = requestCases.get(researchRequestId)
    const found = known ? await caseStore.read(known) : await caseStore.findByRequestId(researchRequestId)
    if (!found) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
    registerCase(found)
    return found
  }

  async function receiveContribution(rawInput) {
    const input = contributionInput(rawInput)
    const located = await resolveCase(input.researchRequestId)
    return exclusive(operationKey(located.evidenceCaseId), async () => {
      let current = await caseStore.read(located.evidenceCaseId)
      if (!current) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
      if (current.state === 'preparing') fail('EVIDENCE_CASE_NOT_READY', 'Caso de evidencia no preparado.')
      const requestRecord = current.requests.find((item) => item.researchRequestId === input.researchRequestId)
      if (!requestRecord) fail('REQUEST_NOT_IN_EVIDENCE_CASE', 'Solicitud no asociada al caso.')
      let got = receipt(input.rawReceipt, requestRecord, clock())
      const existingReceipt = current.receipts.find((item) => item.receiptId === got.receiptId)
      let idempotent = false
      if (existingReceipt) {
        got = receipt(input.rawReceipt, requestRecord, existingReceipt.receivedAt)
        if (canonical(existingReceipt) !== canonical(got)) fail('INCOMPATIBLE_RECEIPT_REPLAY', 'Receipt incompatible.')
        const existingContribution = current.contributions.find((item) => item.receiptId === got.receiptId)
        if (!existingContribution || existingContribution.researchRequestId !== input.researchRequestId || existingContribution.claim !== input.claim) fail('INCOMPATIBLE_CONTRIBUTION_REPLAY', 'Contribucion incompatible.')
        idempotent = true
      } else {
        assertAggregateBudget(current, requestRecord, got)
        current = (await caseStore.update(current.evidenceCaseId, (draft) => {
          const next = {
            ...draft,
            receipts: [...draft.receipts, got].sort((a, b) => a.receiptId.localeCompare(b.receiptId)),
            contributions: [...draft.contributions, { researchRequestId: input.researchRequestId, receiptId: got.receiptId, claim: input.claim }].sort((a, b) => a.receiptId.localeCompare(b.receiptId)),
            updatedAt: clock(),
          }
          const aggregated = aggregate(next)
          delete aggregated.lastErrorCode
          return aggregated
        })).record
      }
      current = await appendAcceptedMemory(await caseStore.read(current.evidenceCaseId))
      try {
        await persistAllSessions(current)
      } catch (error) {
        current = await markCaseFailure(current.evidenceCaseId, error, 'sync_request_sessions')
        registerCase(current)
        throw error
      }
      registerCase(current)
      const decision = current.evidenceDecisions[0] || null
      return {
        state: current.state,
        researchPlanId: current.researchPlanId,
        evidenceCaseId: current.evidenceCaseId,
        receipt: got,
        evidence: decision ? publicView(decision) : null,
        memory: current.memory,
        idempotent,
      }
    })
  }

  async function receive(value) {
    const allowed = ['researchRequestId', 'rawReceipt', 'claim', 'corroborations']
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !allowed.includes(key))) fail('INVALID_CONTRIBUTION', 'Contribucion invalida.')
    return receiveContribution({ researchRequestId: value.researchRequestId, rawReceipt: value.rawReceipt, claim: value.claim })
  }

  async function reopenEvidenceCase(evidenceCaseId) {
    const current = await caseStore.read(evidenceCaseId)
    if (!current) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
    registerCase(current)
    return evidenceCaseView(current)
  }

  function evidenceCaseView(current) {
    const decision = current.evidenceDecisions[0] || null
    return {
      researchPlanId: current.researchPlanId,
      evidenceCaseId: current.evidenceCaseId,
      projectId: current.projectId,
      state: current.state,
      requestIds: current.requests.map((item) => item.researchRequestId).sort(),
      receiptsReceived: current.receipts.length,
      evidence: decision ? publicView(decision) : null,
      contradictionStatus: current.contradictionStatus || null,
      pendingOperations: current.pendingOperations,
      memory: current.memory,
      nextResponsible: current.nextResponsible,
      revision: current.revision,
    }
  }

  async function getResearchStatus(researchRequestId) {
    const current = await resolveCase(researchRequestId)
    const requestRecord = current.requests.find((item) => item.researchRequestId === researchRequestId)
    return { state: sessionState(current, requestRecord), researchRequestId, researchPlanId: current.researchPlanId, evidenceCaseId: current.evidenceCaseId }
  }

  async function retryEvidenceCase(evidenceCaseId) {
    return exclusive(operationKey(evidenceCaseId), async () => {
      let current = await caseStore.read(evidenceCaseId)
      if (!current) fail('EVIDENCE_CASE_NOT_FOUND', 'Caso de evidencia inexistente.')
      if (current.state === 'preparing') current = await completePreparation(evidenceCaseId)
      current = await appendAcceptedMemory(current)
      if (current.pendingOperations.includes('sync_request_sessions')) {
        await persistAllSessions(current)
        current = (await caseStore.update(evidenceCaseId, (draft) => {
          const next = { ...draft, pendingOperations: draft.pendingOperations.filter((item) => item !== 'sync_request_sessions'), updatedAt: clock() }
          delete next.lastErrorCode
          return next
        })).record
      } else await persistAllSessions(current)
      registerCase(current)
      return evidenceCaseView(current)
    })
  }

  async function retryPendingResearch(researchRequestId) {
    const current = await resolveCase(researchRequestId)
    return retryEvidenceCase(current.evidenceCaseId)
  }

  async function reconcilePendingResearch(projectId) {
    const cases = await caseStore.list(projectId)
    const results = []
    for (const current of cases.sort((a, b) => a.evidenceCaseId.localeCompare(b.evidenceCaseId))) {
      if (current.state === 'preparing' || current.pendingOperations.length > 0) results.push(await retryEvidenceCase(current.evidenceCaseId))
    }
    return results
  }

  async function reopen(researchRequestId) {
    const current = await resolveCase(researchRequestId)
    const requestRecord = current.requests.find((item) => item.researchRequestId === researchRequestId)
    const decision = current.evidenceDecisions[0] || null
    return { request: requestRecord, state: sessionState(current, requestRecord), evidence: decision ? publicView(decision) : null, researchPlanId: current.researchPlanId, evidenceCaseId: current.evidenceCaseId }
  }

  function getResearchView(researchRequestId) {
    const record = records.get(researchRequestId)
    if (!record) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
    return {
      state: record.status,
      receiptsReceived: record.receipts.length,
      evidenceAccepted: record.evidence.filter((item) => item.state === 'accepted_for_context').length,
      nextResponsible: record.nextResponsible || 'jefe',
      nextStep: record.pending ? 'Reintentar persistencia de investigacion.' : 'Esperar proveedor o corroboracion.',
      researchPlanId: record.researchPlanId,
      evidenceCaseId: record.evidenceCaseId,
    }
  }

  function contributionContextView(researchRequestId, record) {
    return deepFreeze({
      researchSessionId: sessionId(researchRequestId),
      researchRequestId,
      researchPlanId: record.researchPlanId,
      evidenceCaseId: record.evidenceCaseId,
      discoveryId: record.request.discoveryId,
      projectId: record.request.projectId,
      providerType: record.request.providerType,
    })
  }

  function getContributionContext(researchRequestId) {
    const record = records.get(researchRequestId)
    if (record) return contributionContextView(researchRequestId, record)
    return resolveCase(researchRequestId).then(() => {
      const hydrated = records.get(researchRequestId)
      if (!hydrated) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
      return contributionContextView(researchRequestId, hydrated)
    })
  }

  function connectorInputView(researchRequestId, record) {
    return deepFreeze({
      schemaVersion: 'jefe-research-connector-input/v1',
      researchRequestId,
      providerType: record.request.providerType,
      objective: record.request.objective,
      questions: [...record.request.questions],
      budget: { ...record.request.budget },
      needsCorroboration: record.request.needsCorroboration,
    })
  }

  function getConnectorInput(researchRequestId) {
    const record = records.get(researchRequestId)
    if (record) return connectorInputView(researchRequestId, record)
    return resolveCase(researchRequestId).then(() => {
      const hydrated = records.get(researchRequestId)
      if (!hydrated) fail('REQUEST_NOT_FOUND', 'Solicitud inexistente.')
      return connectorInputView(researchRequestId, hydrated)
    })
  }

  async function rebuildEvidenceCaseIndex() {
    return caseStore.rebuildIndex()
  }

  return {
    plan,
    prepareResearch: plan,
    receive,
    receiveContribution,
    recordProviderReceipt: receive,
    getResearchStatus,
    retryPendingResearch,
    retryEvidenceCase,
    reconcilePendingResearch,
    getResearchView,
    reopen,
    reopenEvidenceCase,
    rebuildEvidenceCaseIndex,
    getContributionContext,
    getConnectorInput,
    requests,
  }
}

module.exports = { SupervisedResearchError, createSupervisedResearch, deriveResearchPlanId, deriveEvidenceCaseId }
