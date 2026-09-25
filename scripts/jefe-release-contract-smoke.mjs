import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {
  createCiEvidence,
  createReleaseRequest,
  createRemoteActionAuthorization,
  hashDeliveryManifest,
  assertRepositoryBaseline,
  validateDeliveryIntegrity,
} from '../electron/jefe-release-contract.cjs'

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex')
const manifest = { schemaVersion: 'jefe-local-delivery/v1', deliveryId: 'delivery-v1', projectId: 'project-v1', versionId: 'version-v1', preparedAt: '2026-09-25T00:00:00.000Z', files: [{ relativePath: 'app/index.html', sha256: digest('<html>v1</html>') }, { relativePath: 'manifest.json', sha256: digest('{"version":"v1"}') }] }
const manifestSha256 = hashDeliveryManifest(manifest)
const evidence = {
  project: { projectId: 'project-v1' },
  version: { versionId: 'version-v1', snapshotSha256: digest('snapshot-v1') },
  approval: { approvalId: 'approval-v1', versionId: 'version-v1', snapshotSha256: digest('snapshot-v1'), state: 'approved', decision: 'approved' },
  quality: { overallStatus: 'PASS', eligibleForPromotion: true, evidenceId: 'quality-v1' },
  sourceVersion: { immutable: true },
  delivery: { projectId: 'project-v1', versionId: 'version-v1', manifest, manifestSha256, artifactHashes: { 'app/index.html': digest('<html>v1</html>'), 'manifest.json': digest('{"version":"v1"}') } },
  repository: { repoIdentity: 'ai-orchestrator', expectedBranch: 'feature/continue-orchestrator', expectedHeadSha: digest('head-v1'), remoteUrl: 'https://user:secret@example.com/org/repo.git' },
}
const expectCode = (code, fn) => assert.throws(fn, (error) => error?.code === code)

const request = createReleaseRequest({ evidence, requestedAction: 'prepare_local_delivery' })
assert.equal(request.identity.approvalSnapshotSha256, request.identity.snapshotSha256)
assert.equal(request.delivery.deliveryManifestSha256, manifestSha256)
assert.match(request.repository.remoteUrl, /^https:\/\/example\.com/u)
assert.equal(validateDeliveryIntegrity(evidence.delivery).pass, true)

expectCode('APPROVAL_REQUIRED', () => createReleaseRequest({ evidence: { ...evidence, approval: { ...evidence.approval, state: 'rejected', decision: 'rejected' } }, requestedAction: 'prepare_local_delivery' }))
expectCode('APPROVAL_VERSION_MISMATCH', () => createReleaseRequest({ evidence: { ...evidence, approval: { ...evidence.approval, versionId: 'version-v2' } }, requestedAction: 'prepare_local_delivery' }))
expectCode('APPROVAL_SNAPSHOT_MISMATCH', () => createReleaseRequest({ evidence: { ...evidence, approval: { ...evidence.approval, snapshotSha256: digest('other') } }, requestedAction: 'prepare_local_delivery' }))
expectCode('DELIVERY_VERSION_MISMATCH', () => createReleaseRequest({ evidence: { ...evidence, delivery: { ...evidence.delivery, versionId: 'version-v2' } }, requestedAction: 'prepare_local_delivery' }))
expectCode('DELIVERY_INTEGRITY_MISMATCH', () => createReleaseRequest({ evidence: { ...evidence, delivery: { ...evidence.delivery, manifestSha256: digest('corrupt') } }, requestedAction: 'prepare_local_delivery' }))
expectCode('DELIVERY_INTEGRITY_MISMATCH', () => validateDeliveryIntegrity({ ...evidence.delivery, artifactHashes: { ...evidence.delivery.artifactHashes, 'app/index.html': digest('tampered') } }))
expectCode('UNTRUSTED_RELEASE_INPUT', () => createReleaseRequest({ evidence: { ...evidence, repository: { ...evidence.repository, path: 'C:\\secret' } }, requestedAction: 'prepare_local_delivery' }))
expectCode('UNTRUSTED_RELEASE_INPUT', () => createReleaseRequest({ evidence: { ...evidence, repository: { ...evidence.repository, branch: 'main' } }, requestedAction: 'prepare_local_delivery' }))
expectCode('RELEASE_ACTION_INVALID', () => createReleaseRequest({ evidence, requestedAction: 'push_main' }))
expectCode('SOURCE_VERSION_MUTABLE', () => createReleaseRequest({ evidence: { ...evidence, sourceVersion: { immutable: false } }, requestedAction: 'prepare_local_delivery' }))
expectCode('REPOSITORY_BASELINE_CHANGED', () => assertRepositoryBaseline(request, { repoIdentity: 'ai-orchestrator', branch: 'feature/continue-orchestrator', headSha: digest('other') }))
expectCode('REPOSITORY_BASELINE_CHANGED', () => assertRepositoryBaseline(request, { repoIdentity: 'ai-orchestrator', branch: 'main', headSha: digest('head-v1') }))
expectCode('REMOTE_CI_REQUIRED', () => createReleaseRequest({ evidence, requestedAction: 'prepare_release' }))
expectCode('REMOTE_CI_EVIDENCE_REQUIRED', () => createCiEvidence({ provider: 'local', workflow: 'quality', repository: 'ai-orchestrator', commitSha: digest('head-v1'), status: 'passed', startedAt: '2026-09-25T00:00:00.000Z', evidenceSource: 'local' }))
const ci = createCiEvidence({ provider: 'github-actions', workflow: 'quality', repository: 'ai-orchestrator', commitSha: digest('head-v1'), status: 'passed', startedAt: '2026-09-25T00:00:00.000Z', completedAt: '2026-09-25T00:01:00.000Z', evidenceSource: 'github-actions-run' })
const release = createReleaseRequest({ evidence: { ...evidence, ci, releaseAuthorization: { authorized: true } }, requestedAction: 'prepare_release' })
assert.equal(release.policy.requestedAction, 'prepare_release')
const replay = createReleaseRequest({ evidence, requestedAction: 'prepare_local_delivery' })
assert.equal(replay.requestId, request.requestId)
expectCode('REMOTE_ACTION_AUTHORIZATION_REQUIRED', () => createRemoteActionAuthorization({ request, action: 'git_push' }))
expectCode('REMOTE_ACTION_INVALID', () => createRemoteActionAuthorization({ request, action: 'push_main', authorized: true, authorizationId: 'auth-v1', actor: 'operator', reason: 'explicit test' }))
const auth = createRemoteActionAuthorization({ request, action: 'git_push', authorized: true, authorizationId: 'auth-v1', actor: 'operator', reason: 'future explicit gate' })
assert.equal(auth.authorized, true)
console.log('PASS jefe-release-contract-smoke: approval, delivery, repository, CI, remote authorization, idempotency and adversarial policy gates')
