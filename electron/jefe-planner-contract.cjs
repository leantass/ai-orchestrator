const crypto = require('crypto')
const { canonical } = require('./jefe-context-package-contract.cjs')

const SCHEMA_VERSION = 'jefe-planner-contract/v1'
const REQUEST_ID = /^planner-request-[a-f0-9]{32}$/u
const PLAN_ID = /^planner-plan-[a-f0-9]{32}$/u
const INTAKE_ID = /^intake-[a-f0-9]{32}$/u
const RESEARCH_PLAN_ID = /^research-plan-[a-f0-9]{32}$/u
const EVIDENCE_CASE_ID = /^evidence-case-[a-f0-9]{32}$/u
const EXECUTION_FLOW_ID = /^research-execution-[a-f0-9]{32}$/u
const PACKAGE_ID = /^context-package-[a-f0-9]{32}$/u
const CHECKSUM = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[a-z][a-z0-9-]{2,80}$/u
const TEXT_MAX = 1000
const LIST_ITEM_MAX = 240
const LIST_MAX = 24
const STEP_IDS = Object.freeze(['review_scope', 'resolve_dependencies', 'prepare_execution_contract'])
const EVIDENCE_STATES = Object.freeze(['accepted_for_context', 'needs_corroboration', 'requires_human'])
const PACKAGE_DISPOSITIONS = Object.freeze(['ready', 'restricted', 'blocked'])
const PLAN_STATES = Object.freeze(['blocked_return_to_discovery', 'ready_for_contract_gate'])
const SENSITIVE = /password|access.?token|refresh.?token|api.?key|secret|cookie|authorization|bearer|credential/iu
const ABSOLUTE_PATH = /(?:^[A-Za-z]:[\\/]|^\\\\|(?:^|\s)\/(?!\/))/u

class PlannerContractError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'PlannerContractError'
    this.code = code
  }
}

function fail(code, message) { throw new PlannerContractError(code, message) }
function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function clone(value) { return JSON.parse(canonical(value)) }
function plainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value)) }
function deepFreeze(value) { if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value; for (const child of Object.values(value)) deepFreeze(child); return Object.freeze(value) }
function exactKeys(value, keys, code) { if (!plainObject(value) || canonical(Object.keys(value).sort()) !== canonical([...keys].sort())) fail(code, 'Contrato de planner con campos inválidos.') }
function timestamp(value) { if (typeof value !== 'string' || Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) fail('INVALID_PLANNER_TIMESTAMP', 'Timestamp de planner inválido.'); return value }
function safeText(value, code = 'INVALID_PLANNER_TEXT', max = TEXT_MAX) { if (typeof value !== 'string' || value.length < 1 || value.length > max || SENSITIVE.test(value) || ABSOLUTE_PATH.test(value) || /\u0000/u.test(value)) fail(code, 'Texto de planner inválido o sensible.'); return value.trim() }
function safeList(value, code) { if (!Array.isArray(value) || value.length > LIST_MAX || new Set(value).size !== value.length) fail(code, 'Lista de planner inválida.'); return value.map((item) => safeText(item, code, LIST_ITEM_MAX)).sort((left, right) => left.localeCompare(right)) }
function identity(value) { exactKeys(value, ['projectId', 'runId', 'versionId'], 'INVALID_PLANNER_IDENTITY'); const clean = {}; for (const key of ['projectId', 'runId', 'versionId']) { if (typeof value[key] !== 'string' || !SAFE_ID.test(value[key])) fail('INVALID_PLANNER_IDENTITY', 'Identidad física inválida.'); clean[key] = value[key] }; return clean }
function packageRef(value) { exactKeys(value, ['packageId', 'checksum', 'disposition'], 'INVALID_PLANNER_PACKAGE_REF'); if (typeof value.packageId !== 'string' || !PACKAGE_ID.test(value.packageId) || typeof value.checksum !== 'string' || !CHECKSUM.test(value.checksum) || !PACKAGE_DISPOSITIONS.includes(value.disposition)) fail('INVALID_PLANNER_PACKAGE_REF', 'Referencia de paquete inválida.'); return { packageId: value.packageId, checksum: value.checksum, disposition: value.disposition } }
function sourceRefs(value) {
  exactKeys(value, ['intakeId', 'researchPlanId', 'evidenceCaseId', 'executionFlowId'], 'INVALID_PLANNER_SOURCE_REFS')
  if (!INTAKE_ID.test(value.intakeId) || !RESEARCH_PLAN_ID.test(value.researchPlanId) || !EVIDENCE_CASE_ID.test(value.evidenceCaseId) || !EXECUTION_FLOW_ID.test(value.executionFlowId)) fail('INVALID_PLANNER_SOURCE_REFS', 'Referencias de discovery/investigación inválidas.')
  return { intakeId: value.intakeId, researchPlanId: value.researchPlanId, evidenceCaseId: value.evidenceCaseId, executionFlowId: value.executionFlowId }
}
function requestSeed(value) { return { identity: value.identity, sourceRefs: value.sourceRefs, packageRef: value.packageRef, evidenceState: value.evidenceState, objective: value.objective, scope: value.scope, dependencies: value.dependencies, risks: value.risks, constraints: value.constraints } }
function derivePlanningRequestId(value) { exactKeys(value, ['identity', 'sourceRefs', 'packageRef', 'evidenceState', 'objective', 'scope', 'dependencies', 'risks', 'constraints'], 'INVALID_PLANNER_REQUEST_SEED'); const normalized = normalizePlanningInput(value); return `planner-request-${digest(requestSeed(normalized)).slice(0, 32)}` }
function normalizePlanningInput(value) {
  exactKeys(value, ['identity', 'sourceRefs', 'packageRef', 'evidenceState', 'objective', 'scope', 'dependencies', 'risks', 'constraints'], 'INVALID_PLANNER_INPUT')
  if (!EVIDENCE_STATES.includes(value.evidenceState)) fail('INVALID_PLANNER_EVIDENCE_STATE', 'Estado de evidencia inválido.')
  return { identity: identity(value.identity), sourceRefs: sourceRefs(value.sourceRefs), packageRef: packageRef(value.packageRef), evidenceState: value.evidenceState, objective: safeText(value.objective), scope: safeList(value.scope, 'INVALID_PLANNER_SCOPE'), dependencies: safeList(value.dependencies, 'INVALID_PLANNER_DEPENDENCIES'), risks: safeList(value.risks, 'INVALID_PLANNER_RISKS'), constraints: safeList(value.constraints, 'INVALID_PLANNER_CONSTRAINTS') }
}
function createPlanningRequest(value, now) {
  const normalized = normalizePlanningInput({ identity: value.identity, sourceRefs: value.sourceRefs, packageRef: value.packageRef, evidenceState: value.evidenceState, objective: value.objective, scope: value.scope, dependencies: value.dependencies, risks: value.risks, constraints: value.constraints })
  return deepFreeze({ schemaVersion: SCHEMA_VERSION, planningRequestId: derivePlanningRequestId(normalized), ...normalized, createdAt: timestamp(now) })
}
function validatePlanningRequest(value) {
  exactKeys(value, ['schemaVersion', 'planningRequestId', 'identity', 'sourceRefs', 'packageRef', 'evidenceState', 'objective', 'scope', 'dependencies', 'risks', 'constraints', 'createdAt'], 'INVALID_PLANNER_REQUEST')
  if (value.schemaVersion !== SCHEMA_VERSION || typeof value.planningRequestId !== 'string' || !REQUEST_ID.test(value.planningRequestId)) fail('INVALID_PLANNER_REQUEST', 'Solicitud de planner inválida.')
  const normalized = normalizePlanningInput({ identity: value.identity, sourceRefs: value.sourceRefs, packageRef: value.packageRef, evidenceState: value.evidenceState, objective: value.objective, scope: value.scope, dependencies: value.dependencies, risks: value.risks, constraints: value.constraints })
  if (value.planningRequestId !== derivePlanningRequestId(normalized)) fail('INVALID_PLANNER_REQUEST_ID', 'Identificador de solicitud inválido.')
  return deepFreeze({ schemaVersion: SCHEMA_VERSION, planningRequestId: value.planningRequestId, ...normalized, createdAt: timestamp(value.createdAt) })
}
function derivePlannerPlanId(planningRequestId) { if (typeof planningRequestId !== 'string' || !REQUEST_ID.test(planningRequestId)) fail('INVALID_PLANNER_REQUEST_ID', 'Solicitud de planner inválida.'); return `planner-plan-${digest({ planningRequestId }).slice(0, 32)}` }
function buildGate(request) {
  const evidenceAccepted = request.evidenceState === 'accepted_for_context'
  const packageReady = request.packageRef.disposition === 'ready'
  return deepFreeze({ contractStatus: evidenceAccepted && packageReady ? 'closed' : 'blocked', evidenceState: request.evidenceState, packageDisposition: request.packageRef.disposition, executionPermitted: false, nextCheckpoint: evidenceAccepted && packageReady ? 'contract_gate' : 'discovery' })
}
function planSteps(request) { return STEP_IDS.map((stepId, order) => ({ stepId, order: order + 1, status: 'planned', dependsOn: order === 0 ? [] : [STEP_IDS[order - 1]] })) }
function createPlannerPlan(requestValue, now) {
  const request = validatePlanningRequest(requestValue)
  const gate = buildGate(request)
  return validatePlannerPlan({ schemaVersion: SCHEMA_VERSION, plannerPlanId: derivePlannerPlanId(request.planningRequestId), planningRequestId: request.planningRequestId, identity: request.identity, sourceRefs: request.sourceRefs, packageRef: request.packageRef, objective: request.objective, scope: request.scope, dependencies: request.dependencies, risks: request.risks, constraints: request.constraints, steps: planSteps(request), gate, state: gate.contractStatus === 'closed' ? 'ready_for_contract_gate' : 'blocked_return_to_discovery', revision: 0, createdAt: timestamp(now), updatedAt: now })
}
function steps(value) {
  if (!Array.isArray(value) || value.length !== STEP_IDS.length) fail('INVALID_PLANNER_STEPS', 'Pasos de plan inválidos.')
  const clean = value.map((item) => { exactKeys(item, ['stepId', 'order', 'status', 'dependsOn'], 'INVALID_PLANNER_STEPS'); if (!STEP_IDS.includes(item.stepId) || item.order !== STEP_IDS.indexOf(item.stepId) + 1 || item.status !== 'planned' || !Array.isArray(item.dependsOn) || canonical(item.dependsOn) !== canonical(item.order === 1 ? [] : [STEP_IDS[item.order - 2]])) fail('INVALID_PLANNER_STEPS', 'Pasos de plan inválidos.'); return { stepId: item.stepId, order: item.order, status: item.status, dependsOn: [...item.dependsOn] } })
  if (canonical(clean.map((item) => item.stepId)) !== canonical(STEP_IDS)) fail('INVALID_PLANNER_STEPS', 'Pasos de plan inválidos.')
  return clean
}
function gate(value) {
  exactKeys(value, ['contractStatus', 'evidenceState', 'packageDisposition', 'executionPermitted', 'nextCheckpoint'], 'INVALID_PLANNER_GATE')
  if (!['closed', 'blocked'].includes(value.contractStatus) || !EVIDENCE_STATES.includes(value.evidenceState) || !PACKAGE_DISPOSITIONS.includes(value.packageDisposition) || value.executionPermitted !== false || !['contract_gate', 'discovery'].includes(value.nextCheckpoint)) fail('INVALID_PLANNER_GATE', 'Gate de plan inválido.')
  const closed = value.evidenceState === 'accepted_for_context' && value.packageDisposition === 'ready'
  if ((closed && (value.contractStatus !== 'closed' || value.nextCheckpoint !== 'contract_gate')) || (!closed && (value.contractStatus !== 'blocked' || value.nextCheckpoint !== 'discovery'))) fail('INVALID_PLANNER_GATE', 'Gate de plan inválido.')
  return { contractStatus: value.contractStatus, evidenceState: value.evidenceState, packageDisposition: value.packageDisposition, executionPermitted: false, nextCheckpoint: value.nextCheckpoint }
}
function validatePlannerPlan(value) {
  exactKeys(value, ['schemaVersion', 'plannerPlanId', 'planningRequestId', 'identity', 'sourceRefs', 'packageRef', 'objective', 'scope', 'dependencies', 'risks', 'constraints', 'steps', 'gate', 'state', 'revision', 'createdAt', 'updatedAt'], 'INVALID_PLANNER_PLAN')
  if (value.schemaVersion !== SCHEMA_VERSION || typeof value.plannerPlanId !== 'string' || !PLAN_ID.test(value.plannerPlanId) || typeof value.planningRequestId !== 'string' || !REQUEST_ID.test(value.planningRequestId) || value.plannerPlanId !== derivePlannerPlanId(value.planningRequestId) || !PLAN_STATES.includes(value.state) || !Number.isSafeInteger(value.revision) || value.revision < 0) fail('INVALID_PLANNER_PLAN', 'Plan de planner inválido.')
  const source = sourceRefs(value.sourceRefs); const pack = packageRef(value.packageRef); const cleanGate = gate(value.gate); const createdAt = timestamp(value.createdAt); const updatedAt = timestamp(value.updatedAt)
  if (Date.parse(updatedAt) < Date.parse(createdAt)) fail('INVALID_PLANNER_TIMESTAMP', 'Timestamp de plan inválido.')
  const expectedState = cleanGate.contractStatus === 'closed' ? 'ready_for_contract_gate' : 'blocked_return_to_discovery'
  if (value.state !== expectedState) fail('INVALID_PLANNER_STATE', 'Estado de plan no coincide con su gate.')
  return deepFreeze({ schemaVersion: SCHEMA_VERSION, plannerPlanId: value.plannerPlanId, planningRequestId: value.planningRequestId, identity: identity(value.identity), sourceRefs: source, packageRef: pack, objective: safeText(value.objective), scope: safeList(value.scope, 'INVALID_PLANNER_SCOPE'), dependencies: safeList(value.dependencies, 'INVALID_PLANNER_DEPENDENCIES'), risks: safeList(value.risks, 'INVALID_PLANNER_RISKS'), constraints: safeList(value.constraints, 'INVALID_PLANNER_CONSTRAINTS'), steps: steps(value.steps), gate: cleanGate, state: value.state, revision: value.revision, createdAt, updatedAt })
}
function plannerPlanView(value) { const plan = validatePlannerPlan(value); return deepFreeze({ plannerPlanId: plan.plannerPlanId, planningRequestId: plan.planningRequestId, projectId: plan.identity.projectId, state: plan.state, contractStatus: plan.gate.contractStatus, executionPermitted: false, nextCheckpoint: plan.gate.nextCheckpoint, revision: plan.revision, updatedAt: plan.updatedAt }) }

module.exports = { SCHEMA_VERSION, REQUEST_ID, PLAN_ID, STEP_IDS, EVIDENCE_STATES, PACKAGE_DISPOSITIONS, PLAN_STATES, PlannerContractError, derivePlanningRequestId, derivePlannerPlanId, normalizePlanningInput, createPlanningRequest, validatePlanningRequest, createPlannerPlan, validatePlannerPlan, plannerPlanView }
