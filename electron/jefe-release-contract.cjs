const crypto = require('node:crypto')

const RELEASE_REQUEST_SCHEMA = 'jefe-release-request/v1'
const CI_EVIDENCE_SCHEMA = 'jefe-ci-evidence/v1'
const REMOTE_AUTH_SCHEMA = 'jefe-remote-action-authorization/v1'
const RELEASE_ACTIONS = Object.freeze(['prepare_local_delivery', 'prepare_git_commit', 'request_ci', 'prepare_release'])
const REMOTE_ACTIONS = Object.freeze(['git_push', 'create_pr', 'merge', 'release_tag', 'deploy'])
const CI_STATUSES = Object.freeze(['pending', 'passed', 'failed', 'cancelled', 'unavailable'])

class ReleaseContractError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'ReleaseContractError'; this.code = code; this.details = details }
}

function fail(code, message, details = {}) { throw new ReleaseContractError(code, message, details) }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (!value || typeof value !== 'object') return value; return Object.keys(value).sort().reduce((out, key) => { out[key] = stable(value[key]); return out }, {}) }
function canonicalJson(value) { return JSON.stringify(stable(value)) }
function sha256(value) { return crypto.createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex') }
function text(value, field, max = 300, required = true) { if (typeof value !== 'string') { if (!required && (value === null || value === undefined)) return null; fail('INVALID_RELEASE_FIELD', `${field} must be text.`) }; const result = value.trim().replace(/\s+/gu, ' '); if (!result && required) fail('INVALID_RELEASE_FIELD', `${field} is required.`); if (result.length > max) fail('INVALID_RELEASE_FIELD', `${field} is too long.`); return result || null }
function safeSha(value, field) { const result = text(value, field, 64); if (!/^[a-f0-9]{64}$/iu.test(result)) fail('INVALID_SHA256', `${field} must be a SHA-256 digest.`); return result.toLowerCase() }
function safeId(value, field) { const result = text(value, field, 180); if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+){0,30}$/u.test(result)) fail('INVALID_RELEASE_ID', `${field} is invalid.`); return result }
function sanitizeRemoteUrl(value) {
  if (value === null || value === undefined || value === '') return null
  let parsed
  try { parsed = new URL(String(value)) } catch { return '[redacted-invalid-remote]' }
  if (!['https:', 'http:', 'ssh:'].includes(parsed.protocol)) return '[redacted-remote]'
  parsed.username = ''; parsed.password = ''; parsed.search = ''; parsed.hash = ''
  return parsed.toString()
}
function assertNoCallerOverrides(value, field) { if (!value || typeof value !== 'object') return; for (const forbidden of ['path', 'filesystemPath', 'deliveryPath', 'branch', 'head', 'commitSha', 'token', 'apiKey']) if (Object.hasOwn(value, forbidden)) fail('UNTRUSTED_RELEASE_INPUT', `${field}.${forbidden} cannot be supplied by the caller.`) }

function normalizeDeliveryManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') fail('DELIVERY_MANIFEST_REQUIRED', 'A delivery manifest is required.')
  const files = Array.isArray(manifest.files) ? manifest.files : []
  if (!files.length) fail('DELIVERY_MANIFEST_INVALID', 'A delivery manifest must contain files.')
  const normalizedFiles = files.map((file) => {
    const relativePath = text(file?.relativePath, 'delivery.files.relativePath', 500)
    if (relativePath.startsWith('/') || relativePath.includes('..') || relativePath.includes('\\')) fail('DELIVERY_MANIFEST_INVALID', 'Delivery paths must be safe relative paths.')
    return { relativePath, sha256: safeSha(file?.sha256, 'delivery.files.sha256') }
  }).sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const ids = new Set()
  for (const file of normalizedFiles) { if (ids.has(file.relativePath)) fail('DELIVERY_MANIFEST_INVALID', 'Delivery files must be unique.'); ids.add(file.relativePath) }
  return { schemaVersion: 'jefe-local-delivery/v1', deliveryId: safeId(manifest.deliveryId, 'deliveryId'), projectId: safeId(manifest.projectId, 'projectId'), versionId: safeId(manifest.versionId, 'versionId'), preparedAt: text(manifest.preparedAt, 'preparedAt', 80), files: normalizedFiles }
}

function hashDeliveryManifest(manifest) { return sha256(normalizeDeliveryManifest(manifest)) }
function validateDeliveryIntegrity({ manifest, manifestSha256: expectedManifestSha256, artifactHashes } = {}) {
  const normalized = normalizeDeliveryManifest(manifest)
  const actualManifestSha256 = hashDeliveryManifest(normalized)
  if (expectedManifestSha256 && safeSha(expectedManifestSha256, 'deliveryManifestSha256') !== actualManifestSha256) fail('DELIVERY_INTEGRITY_MISMATCH', 'The delivery manifest hash does not match the durable manifest.')
  if (!artifactHashes || typeof artifactHashes !== 'object') fail('DELIVERY_ARTIFACT_HASHES_REQUIRED', 'Artifact hashes are required for delivery integrity.')
  for (const file of normalized.files) if (safeSha(artifactHashes[file.relativePath], `artifactHashes.${file.relativePath}`) !== file.sha256) fail('DELIVERY_INTEGRITY_MISMATCH', 'A delivered artifact no longer matches its manifest.', { relativePath: file.relativePath })
  return { pass: true, deliveryManifestSha256: actualManifestSha256, fileCount: normalized.files.length }
}

function normalizeRepository(repository) {
  if (!repository || typeof repository !== 'object') fail('REPOSITORY_EVIDENCE_REQUIRED', 'Repository evidence is required.')
  assertNoCallerOverrides(repository, 'repository')
  return { repoIdentity: text(repository.repoIdentity, 'repository.repoIdentity', 200), expectedBranch: text(repository.expectedBranch, 'repository.expectedBranch', 200), expectedHeadSha: safeSha(repository.expectedHeadSha, 'repository.expectedHeadSha'), remoteUrl: sanitizeRemoteUrl(repository.remoteUrl) }
}
function requireQualityPass(quality) {
  if (!quality || quality.overallStatus !== 'PASS' || quality.eligibleForPromotion !== true) fail('QUALITY_EVIDENCE_REQUIRED', 'Quality evidence must be PASS and eligible for promotion.')
  return { overallStatus: 'PASS', eligibleForPromotion: true, evidenceId: quality.evidenceId ? text(quality.evidenceId, 'quality.evidenceId', 180) : null }
}
function normalizeEvidence(evidence) {
  if (!evidence || typeof evidence !== 'object') fail('DURABLE_EVIDENCE_REQUIRED', 'Durable release evidence is required.')
  assertNoCallerOverrides(evidence, 'evidence')
  const projectId = safeId(evidence.project?.projectId, 'project.projectId')
  const versionId = safeId(evidence.version?.versionId, 'version.versionId')
  if (safeId(evidence.approval?.versionId, 'approval.versionId') !== versionId) fail('APPROVAL_VERSION_MISMATCH', 'Approval and version identities must match.')
  const snapshotSha256 = safeSha(evidence.version.snapshotSha256, 'version.snapshotSha256')
  if (safeSha(evidence.approval.snapshotSha256, 'approval.snapshotSha256') !== snapshotSha256) fail('APPROVAL_SNAPSHOT_MISMATCH', 'Approval snapshot does not match the version snapshot.')
  if (evidence.approval.state !== 'approved' || evidence.approval.decision !== 'approved') fail('APPROVAL_REQUIRED', 'The exact version must have a durable approved gate.')
  if (evidence.sourceVersion?.immutable !== true) fail('SOURCE_VERSION_MUTABLE', 'The source version must remain immutable.')
  const delivery = evidence.delivery
  if (!delivery || delivery.projectId !== projectId || delivery.versionId !== versionId) fail('DELIVERY_VERSION_MISMATCH', 'Delivery must bind to the exact approved version.')
  const deliveryIntegrity = validateDeliveryIntegrity(delivery)
  return { projectId, versionId, snapshotSha256, approvalId: safeId(evidence.approval.approvalId, 'approval.approvalId'), approvalSnapshotSha256: snapshotSha256, quality: requireQualityPass(evidence.quality), delivery: { deliveryId: safeId(delivery.manifest.deliveryId, 'delivery.deliveryId'), deliveryManifestSha256: deliveryIntegrity.deliveryManifestSha256, fileCount: deliveryIntegrity.fileCount }, repository: normalizeRepository(evidence.repository), deliveryIntegrity }
}

function validateReleaseRequest(request) {
  if (!request || request.schemaVersion !== RELEASE_REQUEST_SCHEMA) fail('RELEASE_REQUEST_INVALID', 'Unsupported release request schema.')
  if (!RELEASE_ACTIONS.includes(request.policy?.requestedAction)) fail('RELEASE_ACTION_INVALID', 'The requested release action is not allowed.')
  if (!request.identity?.projectId || !request.identity?.versionId || !request.identity?.snapshotSha256 || !request.identity?.approvalId || request.identity?.snapshotSha256 !== request.identity?.approvalSnapshotSha256) fail('RELEASE_REQUEST_INVALID', 'Release identity is incomplete or inconsistent.')
  if (!request.delivery?.deliveryId || !request.delivery?.deliveryManifestSha256) fail('RELEASE_REQUEST_INVALID', 'Delivery identity is incomplete.')
  if (!request.repository?.repoIdentity || !request.repository?.expectedBranch || !request.repository?.expectedHeadSha) fail('RELEASE_REQUEST_INVALID', 'Repository binding is incomplete.')
  return request
}
function createReleaseRequest({ evidence, requestedAction } = {}) {
  if (!RELEASE_ACTIONS.includes(requestedAction)) fail('RELEASE_ACTION_INVALID', 'The requested release action is not allowed.')
  const durable = normalizeEvidence(evidence)
  if (requestedAction === 'prepare_release') {
    if (!evidence.ci) fail('REMOTE_CI_REQUIRED', 'prepare_release requires remote CI evidence.')
    const ci = validateCiEvidence(evidence.ci)
    if (ci.status !== 'passed' || ci.commitSha !== durable.repository.expectedHeadSha) fail('REMOTE_CI_REQUIRED', 'prepare_release requires passed remote CI for the bound HEAD.')
    if (evidence.releaseAuthorization?.authorized !== true) fail('RELEASE_AUTHORIZATION_REQUIRED', 'prepare_release requires explicit release authorization.')
  }
  const identity = { projectId: durable.projectId, versionId: durable.versionId, snapshotSha256: durable.snapshotSha256, approvalId: durable.approvalId, approvalSnapshotSha256: durable.approvalSnapshotSha256 }
  const repository = durable.repository
  const delivery = durable.delivery
  const idempotencyKey = sha256({ identity, delivery, repository, requestedAction })
  const request = { schemaVersion: RELEASE_REQUEST_SCHEMA, requestId: `release-request-${idempotencyKey.slice(0, 24)}`, idempotencyKey, identity, delivery, repository, quality: durable.quality, policy: { requestedAction, prohibitedActions: ['push_main', 'merge', 'deploy', 'git_push', 'create_pr', 'release_tag'] }, status: 'prepared' }
  return validateReleaseRequest(request)
}
function assertRepositoryBaseline(request, current) {
  const actual = normalizeRepository({ repoIdentity: current.repoIdentity, expectedBranch: current.branch, expectedHeadSha: current.headSha, remoteUrl: current.remoteUrl })
  if (actual.repoIdentity !== request.repository.repoIdentity || actual.expectedBranch !== request.repository.expectedBranch || actual.expectedHeadSha !== request.repository.expectedHeadSha) fail('REPOSITORY_BASELINE_CHANGED', 'The repository baseline changed after release preparation.')
  return { pass: true }
}
function createCiEvidence({ provider, workflow, repository, commitSha, status, startedAt, completedAt, checks = [], evidenceSource } = {}) {
  if (!CI_STATUSES.includes(status)) fail('CI_EVIDENCE_INVALID', 'Unsupported CI evidence status.')
  const result = { schemaVersion: CI_EVIDENCE_SCHEMA, provider: text(provider, 'provider', 120), workflow: text(workflow, 'workflow', 200), repository: text(repository, 'repository', 240), commitSha: safeSha(commitSha, 'commitSha'), status, startedAt: text(startedAt, 'startedAt', 80), completedAt: completedAt ? text(completedAt, 'completedAt', 80) : null, checks: Array.isArray(checks) ? checks.map((check) => ({ name: text(check?.name, 'checks.name', 160), status: text(check?.status, 'checks.status', 40) })) : [], evidenceSource: text(evidenceSource, 'evidenceSource', 300) }
  if (status === 'passed' && !/^github-actions$/iu.test(result.provider)) fail('REMOTE_CI_EVIDENCE_REQUIRED', 'Only verified remote CI evidence may be marked passed.')
  return result
}
function validateCiEvidence(evidence) { if (!evidence || evidence.schemaVersion !== CI_EVIDENCE_SCHEMA || !CI_STATUSES.includes(evidence.status)) fail('CI_EVIDENCE_INVALID', 'CI evidence is invalid.'); return evidence }
function createRemoteActionAuthorization({ request, action, authorized = false, actor, reason, authorizationId } = {}) {
  validateReleaseRequest(request)
  if (!REMOTE_ACTIONS.includes(action)) fail('REMOTE_ACTION_INVALID', 'Remote action is not recognized.')
  if (authorized !== true) fail('REMOTE_ACTION_AUTHORIZATION_REQUIRED', 'Remote action requires explicit authorization.')
  return { schemaVersion: REMOTE_AUTH_SCHEMA, authorizationId: safeId(authorizationId, 'authorizationId'), requestId: request.requestId, action, authorized: true, actor: text(actor, 'actor', 160), reason: text(reason, 'reason', 500), createdAt: new Date().toISOString() }
}

module.exports = { RELEASE_REQUEST_SCHEMA, CI_EVIDENCE_SCHEMA, REMOTE_AUTH_SCHEMA, RELEASE_ACTIONS, REMOTE_ACTIONS, CI_STATUSES, ReleaseContractError, hashDeliveryManifest, validateDeliveryIntegrity, createReleaseRequest, validateReleaseRequest, assertRepositoryBaseline, createCiEvidence, validateCiEvidence, createRemoteActionAuthorization, sanitizeRemoteUrl }
