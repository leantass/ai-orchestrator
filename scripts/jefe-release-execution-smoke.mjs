import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createReleaseRequest, createRemoteActionAuthorization, hashDeliveryManifest } from '../electron/jefe-release-contract.cjs'
import { createReleasePersistence } from '../electron/jefe-release-persistence.cjs'
import { createReleaseOrchestrator } from '../electron/jefe-release-orchestrator.cjs'
import { createGitAdapter } from '../electron/jefe-release-git-adapter.cjs'
import { createFakeRemoteAdapter, createNotConnectedRemoteAdapter } from '../electron/jefe-release-remote-adapter.cjs'
import { createReleaseExecutor } from '../electron/jefe-release-executor.cjs'

const run = promisify(execFile)
const root = path.resolve('.codex-temp', 'escalon-8c')
const work = path.join(root, 'working-repo')
const bare = path.join(root, 'bare-remote.git')
await fs.rm(root, { recursive: true, force: true }); await fs.mkdir(work, { recursive: true })
async function git(cwd, args) { return (await run('git', args, { cwd, shell: false, windowsHide: true })).stdout.trim() }
await git(work, ['init', '-b', 'release-test']); await git(work, ['config', 'user.name', '8C Smoke']); await git(work, ['config', 'user.email', '8c-smoke@invalid.example'])
await fs.writeFile(path.join(work, 'README.md'), 'baseline\n'); await git(work, ['add', '--', 'README.md']); await git(work, ['commit', '-m', 'baseline'])
await git(root, ['init', '--bare', bare]); await git(work, ['remote', 'add', 'origin', bare]); await git(work, ['push', 'origin', 'release-test'])
const gitAdapter = createGitAdapter({ repoRoot: work }); const initial = await gitAdapter.readRepository()
await fs.writeFile(path.join(work, 'release.txt'), 'approved delivery\n')
const bodyHash = (await import('node:crypto')).createHash('sha256').update('approved delivery\n').digest('hex')
const manifest = { schemaVersion: 'jefe-local-delivery/v1', deliveryId: 'delivery-8c', projectId: 'project-a', versionId: 'version-v8c', preparedAt: '2026-09-28T00:00:00.000Z', files: [{ relativePath: 'release.txt', sha256: bodyHash }] }
const delivery = { projectId: 'project-a', versionId: 'version-v8c', manifest, manifestSha256: hashDeliveryManifest(manifest), artifactHashes: { 'release.txt': bodyHash } }
const evidence = { project: { projectId: 'project-a' }, version: { versionId: 'version-v8c', snapshotSha256: 'a'.repeat(64) }, approval: { approvalId: 'approval-8c', versionId: 'version-v8c', snapshotSha256: 'a'.repeat(64), state: 'approved', decision: 'approved' }, sourceVersion: { immutable: true }, quality: { overallStatus: 'PASS', eligibleForPromotion: true, evidenceId: 'quality-8c' }, repository: { repoIdentity: initial.repoIdentity, expectedBranch: initial.branch, expectedHeadSha: initial.headSha }, delivery }
const requestSeed = createReleaseRequest({ evidence, requestedAction: 'prepare_git_commit' })
const persistence = createReleasePersistence({ root })
const orchestrator = createReleaseOrchestrator({ root, persistence, readDelivery: async () => delivery, readRepository: async () => { const value = await gitAdapter.readRepository(); return { repoIdentity: value.repoIdentity, branch: value.branch, headSha: value.headSha } } })
const request = (await orchestrator.createRequest({ evidence, requestedAction: 'prepare_git_commit' })).request
assert.equal(request.requestId, requestSeed.requestId)
const auth = createRemoteActionAuthorization({ request, action: 'git_commit', authorized: true, authorizationId: 'auth-git-commit-8c', actor: 'smoke', reason: 'explicit local test' })
await orchestrator.persistAuthorization(request.requestId, auth)
const intent = await orchestrator.enqueueAction(request.requestId, 'git_commit', auth.authorizationId)
const executor = createReleaseExecutor({ root, persistence, gitAdapter, readDelivery: async () => delivery })
const concurrent = await Promise.all([executor.execute(intent.outbox.outboxId), executor.execute(intent.outbox.outboxId)])
assert.equal(new Set(concurrent.map((item) => item.receipt.receiptId)).size, 1)
assert.equal((await executor.readReceipt(intent.outbox.outboxId)).status, 'succeeded')
const committed = await gitAdapter.readRepository(); assert.notEqual(committed.headSha, initial.headSha)
assert.equal((await git(work, ['rev-list', '--count', 'HEAD'])), '2')
assert.equal((await executor.execute(intent.outbox.outboxId)).idempotent, true)
await assert.rejects(() => orchestrator.enqueueAction(request.requestId, 'git_push', null), /action authorization/u)
const wrongAuth = createRemoteActionAuthorization({ request, action: 'trigger_ci', authorized: true, authorizationId: 'auth-wrong-8c', actor: 'smoke', reason: 'negative test' })
await orchestrator.persistAuthorization(request.requestId, wrongAuth); await assert.rejects(() => orchestrator.enqueueAction(request.requestId, 'git_push', wrongAuth.authorizationId), /does not match/u)

await fs.writeFile(path.join(work, 'unexpected.txt'), 'outside allowlist\n')
const dirtyEvidence = { ...evidence, project: { projectId: 'project-b' }, version: { versionId: 'version-dirty', snapshotSha256: 'b'.repeat(64) }, approval: { ...evidence.approval, approvalId: 'approval-dirty', versionId: 'version-dirty', snapshotSha256: 'b'.repeat(64) }, repository: { ...evidence.repository, expectedHeadSha: committed.headSha }, delivery: { ...delivery, projectId: 'project-b', versionId: 'version-dirty', manifest: { ...manifest, deliveryId: 'delivery-dirty', projectId: 'project-b', versionId: 'version-dirty' } } }
dirtyEvidence.delivery.manifestSha256 = hashDeliveryManifest(dirtyEvidence.delivery.manifest)
const dirtyRequest = (await orchestrator.createRequest({ evidence: dirtyEvidence, requestedAction: 'prepare_git_commit' })).request
const dirtyAuth = createRemoteActionAuthorization({ request: dirtyRequest, action: 'git_commit', authorized: true, authorizationId: 'auth-dirty-8c', actor: 'smoke', reason: 'dirty allowlist test' })
await orchestrator.persistAuthorization(dirtyRequest.requestId, dirtyAuth); const dirtyIntent = await orchestrator.enqueueAction(dirtyRequest.requestId, 'git_commit', dirtyAuth.authorizationId)
await assert.rejects(() => executor.execute(dirtyIntent.outbox.outboxId), /outside the delivery allowlist/u); await fs.rm(path.join(work, 'unexpected.txt'), { force: true })

const crashFile = 'crash-before.txt'; await fs.writeFile(path.join(work, crashFile), 'retryable\n'); const crashHash = (await import('node:crypto')).createHash('sha256').update('retryable\n').digest('hex')
const crashManifest = { ...manifest, deliveryId: 'delivery-crash-before', projectId: 'project-b', versionId: 'version-crash-before', files: [{ relativePath: crashFile, sha256: crashHash }] }
const crashDelivery = { projectId: 'project-b', versionId: 'version-crash-before', manifest: crashManifest, manifestSha256: hashDeliveryManifest(crashManifest), artifactHashes: { [crashFile]: crashHash } }
const crashEvidence = { ...dirtyEvidence, version: { versionId: 'version-crash-before', snapshotSha256: 'c'.repeat(64) }, approval: { ...dirtyEvidence.approval, approvalId: 'approval-crash-before', versionId: 'version-crash-before', snapshotSha256: 'c'.repeat(64) }, delivery: crashDelivery }
const crashRequest = (await orchestrator.createRequest({ evidence: crashEvidence, requestedAction: 'prepare_git_commit' })).request; const crashAuth = createRemoteActionAuthorization({ request: crashRequest, action: 'git_commit', authorized: true, authorizationId: 'auth-crash-before-8c', actor: 'smoke', reason: 'crash boundary' })
await orchestrator.persistAuthorization(crashRequest.requestId, crashAuth); const crashIntent = await orchestrator.enqueueAction(crashRequest.requestId, 'git_commit', crashAuth.authorizationId)
const crashBeforeExecutor = createReleaseExecutor({ root, persistence, gitAdapter, readDelivery: async (projectId, versionId) => projectId === 'project-b' && versionId === 'version-crash-before' ? crashDelivery : delivery, beforeExecute: async () => { throw Object.assign(new Error('simulated crash before execution'), { code: 'SIMULATED_CRASH_BEFORE_EXECUTION' }) } })
await assert.rejects(() => crashBeforeExecutor.execute(crashIntent.outbox.outboxId), /simulated crash/u)
const retryExecutor = createReleaseExecutor({ root, persistence, gitAdapter, readDelivery: async (projectId, versionId) => projectId !== 'project-b' ? delivery : versionId === 'version-crash-before' ? crashDelivery : versionId === 'version-crash-after' ? crashAfterDelivery : delivery }); assert.equal((await retryExecutor.execute(crashIntent.outbox.outboxId)).receipt.status, 'succeeded')

const crashAfterFile = 'crash-after.txt'; await fs.writeFile(path.join(work, crashAfterFile), 'ambiguous\n'); const crashAfterHash = (await import('node:crypto')).createHash('sha256').update('ambiguous\n').digest('hex'); const crashAfterManifest = { ...manifest, deliveryId: 'delivery-crash-after', projectId: 'project-b', versionId: 'version-crash-after', files: [{ relativePath: crashAfterFile, sha256: crashAfterHash }] }; const crashAfterDelivery = { projectId: 'project-b', versionId: 'version-crash-after', manifest: crashAfterManifest, manifestSha256: hashDeliveryManifest(crashAfterManifest), artifactHashes: { [crashAfterFile]: crashAfterHash } }
const crashAfterEvidence = { ...crashEvidence, version: { versionId: 'version-crash-after', snapshotSha256: 'd'.repeat(64) }, approval: { ...crashEvidence.approval, approvalId: 'approval-crash-after', versionId: 'version-crash-after', snapshotSha256: 'd'.repeat(64) }, repository: { ...crashEvidence.repository, expectedHeadSha: (await gitAdapter.readRepository()).headSha }, delivery: crashAfterDelivery }; const crashAfterRequest = (await orchestrator.createRequest({ evidence: crashAfterEvidence, requestedAction: 'prepare_git_commit' })).request; const crashAfterAuth = createRemoteActionAuthorization({ request: crashAfterRequest, action: 'git_commit', authorized: true, authorizationId: 'auth-crash-after-8c', actor: 'smoke', reason: 'ambiguous mutation test' }); await orchestrator.persistAuthorization(crashAfterRequest.requestId, crashAfterAuth); const crashAfterIntent = await orchestrator.enqueueAction(crashAfterRequest.requestId, 'git_commit', crashAfterAuth.authorizationId)
const crashAfterExecutor = createReleaseExecutor({ root, persistence, gitAdapter, readDelivery: async (projectId, versionId) => projectId === 'project-b' && versionId === 'version-crash-after' ? crashAfterDelivery : delivery, afterExecute: async () => { throw Object.assign(new Error('simulated crash after Git mutation'), { code: 'SIMULATED_CRASH_AFTER_EXECUTION' }) } }); await assert.rejects(() => crashAfterExecutor.execute(crashAfterIntent.outbox.outboxId), /simulated crash after/u)
const reconciled = await retryExecutor.execute(crashAfterIntent.outbox.outboxId); assert.equal(reconciled.reconciled, true); assert.equal(reconciled.receipt.status, 'succeeded')
const executionHead = (await gitAdapter.readRepository()).headSha

const pushEvidence = { ...evidence, repository: { ...evidence.repository, expectedHeadSha: executionHead } }
const pushRequest = (await orchestrator.createRequest({ evidence: pushEvidence, requestedAction: 'prepare_git_commit' })).request
const pushAuth = createRemoteActionAuthorization({ request: pushRequest, action: 'git_push', authorized: true, authorizationId: 'auth-git-push-8c', actor: 'smoke', reason: 'explicit bare remote test' })
await orchestrator.persistAuthorization(pushRequest.requestId, pushAuth); const pushIntent = await orchestrator.enqueueAction(pushRequest.requestId, 'git_push', pushAuth.authorizationId)
const pushExecutor = createReleaseExecutor({ root, persistence, gitAdapter, readDelivery: async () => delivery })
assert.equal((await pushExecutor.execute(pushIntent.outbox.outboxId)).receipt.status, 'succeeded')
assert.equal((await git(root, ['--git-dir', bare, 'rev-parse', 'refs/heads/release-test'])), executionHead)
await assert.rejects(() => gitAdapter.push({ branch: 'release-test', expectedHeadSha: initial.headSha }), /Remote ref diverged/u)

const tagAuth = createRemoteActionAuthorization({ request: pushRequest, action: 'release_tag', authorized: true, authorizationId: 'auth-release-tag-8c', actor: 'smoke', reason: 'explicit local tag test' })
await orchestrator.persistAuthorization(pushRequest.requestId, tagAuth); const tagIntent = await orchestrator.enqueueAction(pushRequest.requestId, 'release_tag', tagAuth.authorizationId)
const tagResult = await pushExecutor.execute(tagIntent.outbox.outboxId); assert.equal(tagResult.receipt.status, 'succeeded'); assert.equal(await git(work, ['rev-parse', 'release-version-v8c^{}']), executionHead)

const ciAuth = createRemoteActionAuthorization({ request: pushRequest, action: 'trigger_ci', authorized: true, authorizationId: 'auth-trigger-ci-8c', actor: 'smoke', reason: 'explicit fake CI test' })
await orchestrator.persistAuthorization(pushRequest.requestId, ciAuth); const ciIntent = await orchestrator.enqueueAction(pushRequest.requestId, 'trigger_ci', ciAuth.authorizationId)
const fake = createFakeRemoteAdapter({ fetchCiEvidence: async () => ({ provenance: 'trusted-adapter', adapterId: 'fake-ci', provider: 'github-actions', workflow: 'ci.yml', repository: pushRequest.repository.repoIdentity, commitSha: pushRequest.repository.expectedHeadSha, status: 'passed', startedAt: '2026-09-28T00:00:00.000Z', completedAt: '2026-09-28T00:01:00.000Z', checks: [{ name: 'quality:ci', status: 'passed' }] }) })
const ciExecutor = createReleaseExecutor({ root, persistence, gitAdapter, remoteAdapter: fake, readDelivery: async () => delivery })
assert.equal((await ciExecutor.execute(ciIntent.outbox.outboxId)).receipt.status, 'succeeded')
assert.equal((await ciExecutor.ingestCiEvidence({ adapter: fake, expectedRepository: pushRequest.repository.repoIdentity, expectedCommitSha: pushRequest.repository.expectedHeadSha })).status, 'passed')
await assert.rejects(() => ciExecutor.ingestCiEvidence({ adapter: createFakeRemoteAdapter({ fetchCiEvidence: async () => ({ provenance: 'trusted-adapter', adapterId: 'bad-commit', provider: 'github-actions', workflow: 'ci.yml', repository: pushRequest.repository.repoIdentity, commitSha: initial.headSha, status: 'passed', startedAt: '2026-09-28T00:00:00.000Z', checks: [] }) }), expectedRepository: pushRequest.repository.repoIdentity, expectedCommitSha: pushRequest.repository.expectedHeadSha }), /does not match/u)
await assert.rejects(() => ciExecutor.ingestCiEvidence({ adapter: createFakeRemoteAdapter({ fetchCiEvidence: async () => ({ provenance: 'trusted-adapter', adapterId: 'local', provider: 'local', workflow: 'quality:ci', repository: pushRequest.repository.repoIdentity, commitSha: pushRequest.repository.expectedHeadSha, status: 'passed', startedAt: '2026-09-28T00:00:00.000Z', checks: [] }) }), expectedRepository: pushRequest.repository.repoIdentity, expectedCommitSha: pushRequest.repository.expectedHeadSha }), /Only verified remote CI evidence/u)
await assert.rejects(() => ciExecutor.ingestCiEvidence({ adapter: createFakeRemoteAdapter({ fetchCiEvidence: async () => ({ provenance: 'renderer', adapterId: 'bad', provider: 'github-actions', workflow: 'ci.yml', repository: pushRequest.repository.repoIdentity, commitSha: pushRequest.repository.expectedHeadSha, status: 'passed', startedAt: '2026-09-28T00:00:00.000Z', checks: [] }) }), expectedRepository: pushRequest.repository.repoIdentity, expectedCommitSha: pushRequest.repository.expectedHeadSha }), /trusted adapter/u)
const disconnected = createReleaseExecutor({ root, persistence, gitAdapter, remoteAdapter: createNotConnectedRemoteAdapter(), readDelivery: async () => delivery })
const disconnectedAuth = createRemoteActionAuthorization({ request: pushRequest, action: 'trigger_ci', authorized: true, authorizationId: 'auth-trigger-ci-disconnected-8c', actor: 'smoke', reason: 'not connected test' }); await orchestrator.persistAuthorization(pushRequest.requestId, disconnectedAuth); const disconnectedIntent = await orchestrator.enqueueAction(pushRequest.requestId, 'trigger_ci', disconnectedAuth.authorizationId)
const disconnectedResult = await disconnected.execute(disconnectedIntent.outbox.outboxId); assert.equal(disconnectedResult.receipt.status, 'not_connected')
assert.equal((await fs.readFile(path.join(disconnected.receiptsDir, `${ciIntent.outbox.outboxId}.json`), 'utf8')).includes('token'), false)
const isolatedStore = createReleasePersistence({ root: path.join(root, 'project-b-isolated') }); assert.equal(await isolatedStore.readOutbox(intent.outbox.outboxId), null)
console.log('PASS jefe-release-execution-smoke: allowlist, local commit, replay, double dispatch, bare push, auth, divergence, tag, fake CI evidence, not-connected remote and isolation')
