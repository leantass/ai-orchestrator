const { fingerprint, canonical } = require('./jefe-e2e-flow-contract.cjs')

const SCHEMA = 'jefe-e2e-routing-policy/v1'
const POLICY_VERSION = 'commercial-site-v1'
const ROUTE_KEYS = Object.freeze(['context', 'discovery', 'research', 'evidence', 'planning', 'execution', 'qa', 'preview', 'human_gate', 'delivery', 'release', 'observability', 'memory'])
class E2ERoutingError extends Error { constructor(code, message) { super(message); this.name = 'E2ERoutingError'; this.code = code } }
function fail(code, message) { throw new E2ERoutingError(code, message) }
function cleanText(value) { return typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : '' }
function routeCommercialRequest(input, { requireResearch = false, now = new Date().toISOString() } = {}) {
  if (!input || typeof input !== 'object') fail('INVALID_ROUTING_INPUT', 'La solicitud comercial es invalida.')
  const identity = { projectId: input.projectId, runId: input.runId, versionId: input.versionId }
  const normalized = { projectId: identity.projectId, runId: identity.runId, versionId: identity.versionId, projectType: input.projectType || 'agency_site', platform: input.platform || 'web', generationProfile: input.generationProfile || 'commercial_site', brief: cleanText(input.brief), objective: cleanText(input.objective || input.brief), audience: cleanText(input.audience), proposition: cleanText(input.proposition), primaryCta: cleanText(input.primaryCta), references: Array.isArray(input.inputAssets?.urlReferences) ? input.inputAssets.urlReferences : [] }
  const inputFingerprint = fingerprint(normalized)
  const sufficient = Boolean(normalized.brief && normalized.objective)
  const research = requireResearch ? { required: true, mode: 'trusted', reasonCode: 'EXTERNAL_FACT_REQUIRED' } : { required: false, mode: 'none', reasonCode: normalized.references.length ? 'REFERENCE_AS_INPUT' : 'FIRST_PARTY_INPUT_SUFFICIENT' }
  const routes = { context: { required: true, mode: 'trusted', reasonCode: 'COMMERCIAL_REQUEST_CONTEXT' }, discovery: { required: true, mode: 'trusted', reasonCode: 'DISCOVERY_ALWAYS_REAL' }, research, evidence: { required: false, mode: research.mode, reasonCode: research.reasonCode }, planning: { required: true, mode: 'commercial_product_planning', reasonCode: 'GREENFIELD_COMMERCIAL_MATERIALIZATION' }, execution: { required: true, mode: 'local_materialization', reasonCode: 'DETERMINISTIC_ARTIFACT_GENERATION' }, qa: { required: true, mode: 'semantic_artifact_quality', reasonCode: 'PUBLISHABLE_ARTIFACT_REQUIRES_QUALITY' }, preview: { required: true, mode: 'trusted', reasonCode: 'QUALITY_BEFORE_PREVIEW' }, human_gate: { required: true, mode: 'trusted', reasonCode: 'EXPLICIT_HUMAN_DECISION' }, delivery: { required: false, mode: 'trusted', reasonCode: 'EXPLICIT_USER_ACTION' }, release: { required: false, mode: 'local_release_boundary', reasonCode: 'EXPLICIT_RELEASE_REQUEST_AND_REMOTE_AUTHORIZATION' }, observability: { required: true, mode: 'operational_read_model', reasonCode: 'FLOW_OPERATIONAL_STATE' }, memory: { required: false, mode: 'milestone_memory', reasonCode: 'MILESTONE_POLICY' } }
  const routesWithState = Object.fromEntries(ROUTE_KEYS.map((key) => [key, routes[key]]))
  const routeDecisionId = `route-${fingerprint({ schema: SCHEMA, policyVersion: POLICY_VERSION, identity, inputFingerprint, routes: routesWithState }).slice(0, 32)}`
  return Object.freeze({ schemaVersion: SCHEMA, routeDecisionId, policyVersion: POLICY_VERSION, flowKind: input.flowKind || 'initial_project', identity, inputFingerprint, routes: routesWithState, inputSufficient: sufficient, canonicalInput: canonical(normalized) })
}
module.exports = { SCHEMA, POLICY_VERSION, ROUTE_KEYS, E2ERoutingError, routeCommercialRequest }
