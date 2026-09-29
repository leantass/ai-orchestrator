const crypto = require('node:crypto')

const SCHEMA = 'jefe-e2e-flow/v1'
const FLOW_KINDS = Object.freeze(['initial_project', 'requested_change', 'rejected_correction'])
const STAGES = Object.freeze(['context', 'discovery', 'research', 'evidence', 'planning', 'execution', 'qa', 'preview', 'human_gate', 'delivery', 'release', 'observability', 'memory'])
const REQUIREMENTS = Object.freeze(['always_required', 'conditional', 'optional', 'not_applicable'])
const STATUSES = Object.freeze(['not_started', 'waiting', 'running', 'completed', 'skipped_by_policy', 'blocked', 'failed', 'not_applicable'])
const MODES = Object.freeze(['trusted', 'none', 'commercial_product_planning', 'local_materialization', 'canonical_codex_execution', 'semantic_artifact_quality', 'browser_quality', 'local_release_boundary', 'operational_read_model', 'milestone_memory'])

class E2EFlowContractError extends Error { constructor(code, message) { super(message); this.name = 'E2EFlowContractError'; this.code = code } }
function fail(code, message) { throw new E2EFlowContractError(code, message) }
function canonical(value) { if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`; if (!value || typeof value !== 'object') return JSON.stringify(value); return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}` }
function fingerprint(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex') }
function safeId(value, field) { if (typeof value !== 'string' || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+){1,80}$/u.test(value)) fail('INVALID_IDENTITY', `${field} invalida.`); return value }
function identity(value) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_IDENTITY', 'identity invalida.'); const result = { projectId: safeId(value.projectId, 'projectId'), runId: safeId(value.runId, 'runId'), versionId: safeId(value.versionId, 'versionId') }; return result }
function deterministicFlowId(input) { const clean = { identity: identity(input.identity), flowKind: input.flowKind }; if (!FLOW_KINDS.includes(clean.flowKind)) fail('INVALID_FLOW_KIND', 'flowKind invalido.'); return `e2e-${fingerprint(clean).slice(0, 32)}` }
function stage(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_STAGE', `${name} invalido.`)
  if (value.name !== name || !MODES.includes(value.mode) || !REQUIREMENTS.includes(value.requirement) || !STATUSES.includes(value.status) || typeof value.reasonCode !== 'string' || !Array.isArray(value.inputRefs) || !Array.isArray(value.outputRefs)) fail('INVALID_STAGE', `${name} invalido.`)
  for (const ref of [...value.inputRefs, ...value.outputRefs]) if (typeof ref !== 'string' || !ref) fail('INVALID_STAGE_REF', `${name} contiene una referencia invalida.`)
  return { ...value, inputRefs: [...value.inputRefs], outputRefs: [...value.outputRefs] }
}
function validateFlow(raw) {
  if (!raw || typeof raw !== 'object' || raw.schemaVersion !== SCHEMA || typeof raw.e2eFlowId !== 'string' || deterministicFlowId(raw) !== raw.e2eFlowId || !FLOW_KINDS.includes(raw.flowKind) || !Number.isSafeInteger(raw.revision) || raw.revision < 0 || !['active', 'blocked', 'completed'].includes(raw.state) || !raw.routeDecisionId || !raw.stages || !raw.refs || typeof raw.createdAt !== 'string' || typeof raw.updatedAt !== 'string') fail('INVALID_FLOW', 'E2E flow invalido.')
  const cleanIdentity = identity(raw.identity)
  const cleanStages = {}
  for (const name of STAGES) cleanStages[name] = stage(raw.stages[name], name)
  if (Object.keys(raw.stages).sort().join('|') !== [...STAGES].sort().join('|')) fail('INVALID_FLOW', 'El flow debe declarar todas las etapas.')
  const refs = { ...raw.refs }
  if (raw.flowKind !== 'initial_project') {
    for (const key of ['parentFlowId', 'sourceVersionId', 'correctionId']) if (typeof refs[key] !== 'string' || !refs[key]) fail('LINEAGE_REQUIRED', `${key} es obligatorio para un flow hijo.`)
    if (refs.sourceVersionId === cleanIdentity.versionId) fail('LINEAGE_INVALID', 'Un flow hijo no puede apuntar a su propia version.')
  }
  for (const [key, value] of Object.entries(refs)) if (value !== null && typeof value !== 'string') fail('INVALID_FLOW_REF', `${key} invalido.`)
  const bindings = [['plannerPlanId', 'planning'], ['executionReceiptId', 'execution'], ['qaEvidenceId', 'qa'], ['previewRequestId', 'preview']]
  for (const [refName, stageName] of bindings) if (refs[refName] !== null && cleanStages[stageName].outputRefs.length > 0 && !cleanStages[stageName].outputRefs.includes(refs[refName])) fail('STAGE_REF_MISMATCH', `${refName} no coincide con ${stageName}.`)
  return Object.freeze({ ...raw, identity: cleanIdentity, stages: Object.freeze(cleanStages), refs: Object.freeze(refs) })
}
function createFlow({ identity: rawIdentity, flowKind = 'initial_project', routeDecisionId, inputFingerprint, now, stages, refs = {}, state = 'active' }) {
  const cleanIdentity = identity(rawIdentity); const e2eFlowId = deterministicFlowId({ identity: cleanIdentity, flowKind });
  if (!routeDecisionId || typeof routeDecisionId !== 'string' || !inputFingerprint || !stages) fail('INVALID_FLOW', 'Faltan datos del E2E flow.')
  const flow = { schemaVersion: SCHEMA, e2eFlowId, identity: cleanIdentity, flowKind, routeDecisionId, inputFingerprint, revision: 0, state, stages, refs: { intakeId: null, researchPlanId: null, evidenceCaseId: null, plannerRequestId: null, plannerPlanId: null, plannerGateId: null, executionStageId: null, executionReceiptId: null, qaEvidenceId: null, qaRunId: null, previewRequestId: null, reviewId: null, approvalId: null, deliveryRef: null, releaseRequestId: null, releaseFlowId: null, observabilityCorrelationId: null, parentFlowId: null, sourceVersionId: null, correctionId: null, ...refs }, createdAt: now, updatedAt: now }
  return validateFlow(flow)
}

module.exports = { SCHEMA, FLOW_KINDS, STAGES, REQUIREMENTS, STATUSES, MODES, E2EFlowContractError, canonical, fingerprint, deterministicFlowId, validateFlow, createFlow }
