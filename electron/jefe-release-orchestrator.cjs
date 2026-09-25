const { createReleaseRequest, validateCiEvidence, validateRemoteActionAuthorization, validateDeliveryIntegrity } = require('./jefe-release-contract.cjs')
const { FLOW_SCHEMA, OUTBOX_SCHEMA, FLOW_STATES, createReleasePersistence, digest, canonical, validateFlow } = require('./jefe-release-persistence.cjs')

const TRANSITIONS = Object.freeze({
  prepared: ['preflight_passed', 'waiting_authorization', 'stale', 'blocked'],
  preflight_passed: ['completed_local', 'ready_for_execution', 'waiting_authorization', 'outbox_pending', 'stale', 'blocked'],
  waiting_authorization: ['outbox_pending', 'stale', 'blocked'],
  ready_for_execution: ['outbox_pending', 'stale', 'blocked'],
  outbox_pending: [],
  completed_local: [],
  stale: [],
  blocked: [],
  executing: ['evidence_pending', 'completed', 'failed'],
  evidence_pending: ['completed', 'failed'],
  completed: [],
  failed: []
})
class ReleaseOrchestrationError extends Error { constructor(code, message, details = {}) { super(message); this.name = 'ReleaseOrchestrationError'; this.code = code; this.details = details } }
function fail(code, message, details = {}) { throw new ReleaseOrchestrationError(code, message, details) }
function nowIso(clock) { return clock() }
function identityFromRequest(request) { return { projectId: request.identity.projectId, versionId: request.identity.versionId, snapshotSha256: request.identity.snapshotSha256, approvalId: request.identity.approvalId, approvalSnapshotSha256: request.identity.approvalSnapshotSha256 } }
function flowFromRequest(request, now) { return { schemaVersion: FLOW_SCHEMA, releaseFlowId: `release-flow-${digest({ requestId: request.requestId }).slice(0, 24)}`, requestId: request.requestId, identity: identityFromRequest(request), requestedAction: request.policy.requestedAction, state: 'prepared', revision: 0, repositoryBaseline: request.repository, deliveryBinding: request.delivery ? { ...request.delivery } : null, authorizationRefs: [], outboxRefs: [], createdAt: now, updatedAt: now } }
function requireDelivery(request, flow) { if (!flow.deliveryBinding) fail('DELIVERY_REQUIRED', 'This release flow requires a valid delivery.') }
function sameRepo(a, b) { return a.repoIdentity === b.repoIdentity && a.expectedBranch === b.expectedBranch && a.expectedHeadSha === b.expectedHeadSha }

function createReleaseOrchestrator({ root, persistence, prepareDelivery, readDelivery, readRepository, clock = () => new Date().toISOString() } = {}) {
  const store = persistence || createReleasePersistence({ root })
  if (typeof prepareDelivery !== 'function') prepareDelivery = async () => fail('DELIVERY_ADAPTER_NOT_CONNECTED', 'The local delivery adapter is not connected.')
  if (typeof readDelivery !== 'function') readDelivery = async () => null
  if (typeof readRepository !== 'function') readRepository = async () => null

  async function createRequest({ evidence, requestedAction, crashPoint = null } = {}) {
    const request = createReleaseRequest({ evidence, requestedAction })
    const saved = await store.saveRequest(request)
    if (crashPoint === 'after_request') return { request: saved.record, idempotent: saved.idempotent, recovered: false }
    const prior = await store.readFlow(flowFromRequest(request, clock()).releaseFlowId)
    if (!prior) await store.saveFlow(flowFromRequest(request, clock()))
    return { request: saved.record, flow: await store.readFlow(flowFromRequest(request, clock()).releaseFlowId), idempotent: saved.idempotent }
  }
  async function transition(flow, nextState, patch = {}, expectedRevision = flow.revision, expectedState = flow.state) {
    if (flow.revision !== expectedRevision) fail('STALE_RELEASE_FLOW', 'Release flow revision is stale.')
    if (flow.state !== expectedState) fail('STALE_RELEASE_FLOW', 'Release flow state is stale.')
    if (!TRANSITIONS[flow.state]?.includes(nextState)) fail('INVALID_RELEASE_FLOW_TRANSITION', `${flow.state} cannot transition to ${nextState}.`)
    const next = { ...flow, ...patch, state: nextState, revision: flow.revision + 1, updatedAt: clock() }
    if (next.releaseFlowId !== flow.releaseFlowId || next.requestId !== flow.requestId || next.requestedAction !== flow.requestedAction || canonical(next.identity) !== canonical(flow.identity)) fail('RELEASE_FLOW_IDENTITY_MUTATION', 'Release flow identity is immutable.')
    await store.saveFlow(validateFlow(next)); return next
  }
  async function current(requestId) { const request = await store.readRequest(requestId); if (!request) fail('RELEASE_REQUEST_NOT_FOUND', 'Release request was not found.'); const flowId = flowFromRequest(request, request.createdAt || clock()).releaseFlowId; const flow = await store.readFlow(flowId); if (!flow) fail('RELEASE_FLOW_NOT_FOUND', 'Release flow was not found.'); return { request, flow } }
  async function preflight(request, flow) {
    const repository = await readRepository(request.identity.projectId)
    if (repository && !sameRepo(request.repository, { repoIdentity: repository.repoIdentity, expectedBranch: repository.branch, expectedHeadSha: repository.headSha })) return transition(flow, 'stale', { failureCode: 'REPOSITORY_BASELINE_CHANGED' })
    return flow
  }
  async function prepareLocalDelivery(requestId) {
    let { request, flow } = await current(requestId); flow = await preflight(request, flow); if (flow.state === 'stale') return { request, flow }
    if (flow.state === 'completed_local' && flow.deliveryBinding) return { request, flow, idempotent: true }
    const existing = await readDelivery(request.identity.projectId, request.identity.versionId)
    let delivery = existing
    if (!delivery) delivery = await prepareDelivery(request.identity.projectId, request.identity.versionId)
    if (!delivery?.manifest || !delivery?.artifactHashes) fail('DELIVERY_EVIDENCE_UNAVAILABLE', 'The delivery adapter did not return verifiable evidence.')
    let integrity
    try { integrity = validateDeliveryIntegrity(delivery) } catch (error) { if (error.code === 'DELIVERY_INTEGRITY_MISMATCH') return { request, flow: await transition(flow, 'blocked', { failureCode: error.code }) }; throw error }
    if (delivery.manifest.projectId !== request.identity.projectId || delivery.manifest.versionId !== request.identity.versionId) fail('DELIVERY_VERSION_MISMATCH', 'Delivery does not bind to the approved version.')
    const binding = { deliveryId: delivery.manifest.deliveryId, deliveryManifestSha256: integrity.deliveryManifestSha256, fileCount: integrity.fileCount }
    flow = await transition(flow, 'preflight_passed', { deliveryBinding: binding })
    flow = await transition(flow, 'completed_local')
    return { request, flow, idempotent: Boolean(existing) }
  }
  async function prepareGitCommit(requestId) {
    let { request, flow } = await current(requestId); flow = await preflight(request, flow); if (flow.state === 'stale') return { request, flow }
    requireDelivery(request, flow); if (flow.state === 'prepared') flow = await transition(flow, 'preflight_passed'); return { request, flow: await transition(flow, 'ready_for_execution') }
  }
  async function persistAuthorization(requestId, authorization) {
    const { request } = await current(requestId); const valid = validateRemoteActionAuthorization(authorization, { requestId, action: authorization.action }); return store.saveAuthorization(valid).then((saved) => ({ ...saved, authorization: saved.record }))
  }
  async function outboxFor(request, flow, action, authorization) {
    const outboxId = `release-outbox-${digest({ requestId: request.requestId, action, authorizationId: authorization.authorizationId }).slice(0, 24)}`
    const item = { schemaVersion: OUTBOX_SCHEMA, outboxId, requestId: request.requestId, releaseFlowId: flow.releaseFlowId, projectId: request.identity.projectId, versionId: request.identity.versionId, action, authorizationId: authorization.authorizationId, repository: request.repository, payloadFingerprint: digest({ requestId: request.requestId, action, authorizationId: authorization.authorizationId, repository: request.repository }), createdAt: clock() }
    const saved = await store.saveOutbox(item); const refs = flow.outboxRefs.includes(outboxId) ? flow.outboxRefs : [...flow.outboxRefs, outboxId]; const authRefs = flow.authorizationRefs.includes(authorization.authorizationId) ? flow.authorizationRefs : [...flow.authorizationRefs, authorization.authorizationId]; const next = flow.state === 'outbox_pending' ? flow : await transition(flow, 'outbox_pending', { outboxRefs: refs, authorizationRefs: authRefs }); return { request, flow: next, outbox: saved.record, idempotent: saved.idempotent }
  }
  async function requestCi(requestId, authorizationId = null) {
    let { request, flow } = await current(requestId); requireDelivery(request, flow); if (flow.state === 'prepared' || flow.state === 'completed_local') flow = await transition(flow, 'preflight_passed')
    if (!authorizationId) return { request, flow: flow.state === 'preflight_passed' ? await transition(flow, 'waiting_authorization') : flow }
    const authorization = await store.readAuthorization(authorizationId); if (!authorization) fail('REMOTE_ACTION_AUTHORIZATION_REQUIRED', 'A durable trigger_ci authorization is required.'); validateRemoteActionAuthorization(authorization, { requestId, action: 'trigger_ci' }); return outboxFor(request, flow, 'trigger_ci', authorization)
  }
  async function prepareRelease(requestId, { authorizationId, ciEvidence } = {}) {
    const { request, flow: initial } = await current(requestId); let flow = initial; requireDelivery(request, flow); if (!ciEvidence) return { request, flow: await transition(flow, 'waiting_authorization') }
    const ci = validateCiEvidence(ciEvidence); if (ci.status !== 'passed' || ci.commitSha !== request.repository.expectedHeadSha) fail('CI_EVIDENCE_MISMATCH', 'Remote CI evidence does not match the bound repository commit.')
    const authorization = await store.readAuthorization(authorizationId); if (!authorization) fail('REMOTE_ACTION_AUTHORIZATION_REQUIRED', 'A durable release authorization is required.'); validateRemoteActionAuthorization(authorization, { requestId, action: 'release_tag' }); return outboxFor(request, flow, 'release_tag', authorization)
  }
  async function reconcile() {
    const detail = await store.scan(); const recovered = []
    for (const request of detail.requests.records) { const expected = flowFromRequest(request, request.createdAt || clock()); if (!detail.flows.records.some((flow) => flow.releaseFlowId === expected.releaseFlowId)) { await store.saveFlow(expected); recovered.push({ type: 'flow', requestId: request.requestId }) } }
    for (const auth of detail.authorizations.records) { const request = await store.readRequest(auth.requestId); if (!request) continue; const flow = await store.readFlow(flowFromRequest(request, request.createdAt || clock()).releaseFlowId); if (flow && auth.action === 'trigger_ci' && flow.requestedAction === 'request_ci' && !flow.outboxRefs.length) { await outboxFor(request, flow, 'trigger_ci', auth); recovered.push({ type: 'outbox', requestId: request.requestId }) } }
    await store.rebuildIndex(); return { recovered, corruptions: detail.requests.corruptions.concat(detail.flows.corruptions, detail.authorizations.corruptions, detail.outbox.corruptions) }
  }
  return Object.freeze({ store, createRequest, prepareLocalDelivery, prepareGitCommit, persistAuthorization, requestCi, prepareRelease, reconcile, transition })
}

module.exports = { TRANSITIONS, ReleaseOrchestrationError, createReleaseOrchestrator }
