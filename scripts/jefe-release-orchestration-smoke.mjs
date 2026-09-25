import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createReleaseRequest, createRemoteActionAuthorization, createCiEvidence, hashDeliveryManifest } from '../electron/jefe-release-contract.cjs'
import { createReleasePersistence } from '../electron/jefe-release-persistence.cjs'
import { createReleaseOrchestrator } from '../electron/jefe-release-orchestrator.cjs'

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex')
const root = path.resolve('.codex-temp', 'release-orchestration-smoke')
await fs.rm(root, { recursive: true, force: true })
const head = digest('head-v1')
const repository = { repoIdentity: 'ai-orchestrator', expectedBranch: 'feature/continue-orchestrator', expectedHeadSha: head }
const base = { project: { projectId: 'project-a' }, version: { versionId: 'version-v1', snapshotSha256: digest('snapshot-a') }, approval: { approvalId: 'approval-v1', versionId: 'version-v1', snapshotSha256: digest('snapshot-a'), state: 'approved', decision: 'approved' }, quality: { overallStatus: 'PASS', eligibleForPromotion: true, evidenceId: 'quality-v1' }, sourceVersion: { immutable: true }, repository }
const bodyHash = digest('artifact-a')
const manifest = { schemaVersion: 'jefe-local-delivery/v1', deliveryId: 'delivery-v1', projectId: 'project-a', versionId: 'version-v1', preparedAt: '2026-09-25T00:00:00.000Z', files: [{ relativePath: 'app/index.html', sha256: bodyHash }] }
const delivery = { projectId: 'project-a', versionId: 'version-v1', manifest, manifestSha256: hashDeliveryManifest(manifest), artifactHashes: { 'app/index.html': bodyHash } }
const evidenceWithoutDelivery = { ...base }
const evidenceWithDelivery = { ...base, delivery }
const persistence = createReleasePersistence({ root })
let prepared = false
const orchestrator = createReleaseOrchestrator({ root, persistence, prepareDelivery: async () => { prepared = true; return delivery }, readDelivery: async () => (prepared ? delivery : null), readRepository: async () => ({ repoIdentity: repository.repoIdentity, branch: repository.expectedBranch, headSha: repository.expectedHeadSha }) })

const localRequest = (await orchestrator.createRequest({ evidence: evidenceWithoutDelivery, requestedAction: 'prepare_local_delivery' })).request
const localReplay = (await orchestrator.createRequest({ evidence: evidenceWithoutDelivery, requestedAction: 'prepare_local_delivery' }))
assert.equal(localReplay.idempotent, true)
await assert.rejects(() => persistence.saveRequest({ ...localRequest, repository: { ...localRequest.repository, expectedBranch: 'main' } }), (error) => error.code === 'RELEASE_REQUEST_COLLISION')
const localResult = await orchestrator.prepareLocalDelivery(localRequest.requestId)
assert.equal(localResult.flow.state, 'completed_local')
assert.equal(prepared, true)
assert.equal((await orchestrator.prepareLocalDelivery(localRequest.requestId)).idempotent, true)

const ciRequest = (await orchestrator.createRequest({ evidence: evidenceWithDelivery, requestedAction: 'request_ci' })).request
const waiting = await orchestrator.requestCi(ciRequest.requestId)
assert.equal(waiting.flow.state, 'waiting_authorization')
const triggerAuth = createRemoteActionAuthorization({ request: ciRequest, action: 'trigger_ci', authorized: true, authorizationId: 'auth-trigger-a', actor: 'test-operator', reason: 'isolated contract test' })
await orchestrator.persistAuthorization(ciRequest.requestId, triggerAuth)
const ciOutbox = await orchestrator.requestCi(ciRequest.requestId, triggerAuth.authorizationId)
assert.equal(ciOutbox.flow.state, 'outbox_pending')
assert.equal(ciOutbox.outbox.action, 'trigger_ci')
assert.equal((await orchestrator.requestCi(ciRequest.requestId, triggerAuth.authorizationId)).idempotent, true)
const wrongAuth = createRemoteActionAuthorization({ request: ciRequest, action: 'release_tag', authorized: true, authorizationId: 'auth-wrong-a', actor: 'test-operator', reason: 'wrong action test' })
await orchestrator.persistAuthorization(ciRequest.requestId, wrongAuth)
await assert.rejects(() => orchestrator.requestCi(ciRequest.requestId, wrongAuth.authorizationId), (error) => error.code === 'REMOTE_ACTION_MISMATCH')

const releaseRequest = (await orchestrator.createRequest({ evidence: evidenceWithDelivery, requestedAction: 'prepare_release' })).request
assert.equal((await orchestrator.prepareRelease(releaseRequest.requestId)).flow.state, 'waiting_authorization')
const ci = createCiEvidence({ provider: 'github-actions', workflow: 'quality', repository: 'ai-orchestrator', commitSha: head, status: 'passed', startedAt: '2026-09-25T00:00:00.000Z', completedAt: '2026-09-25T00:01:00.000Z', evidenceSource: 'fixture-only' })
const releaseAuth = createRemoteActionAuthorization({ request: releaseRequest, action: 'release_tag', authorized: true, authorizationId: 'auth-release-a', actor: 'test-operator', reason: 'isolated contract test' })
await orchestrator.persistAuthorization(releaseRequest.requestId, releaseAuth)
const releaseOutbox = await orchestrator.prepareRelease(releaseRequest.requestId, { authorizationId: releaseAuth.authorizationId, ciEvidence: ci })
assert.equal(releaseOutbox.flow.state, 'outbox_pending')
assert.equal(releaseOutbox.outbox.action, 'release_tag')

let drifted = false
const driftOrchestrator = createReleaseOrchestrator({ root, persistence, readRepository: async () => ({ repoIdentity: repository.repoIdentity, branch: drifted ? 'main' : repository.expectedBranch, headSha: repository.expectedHeadSha }) })
const driftRequest = (await driftOrchestrator.createRequest({ evidence: evidenceWithDelivery, requestedAction: 'prepare_git_commit' })).request
drifted = true
assert.equal((await driftOrchestrator.prepareGitCommit(driftRequest.requestId)).flow.state, 'stale')

const casFlow = await persistence.readFlow(localResult.flow.releaseFlowId)
await assert.rejects(() => orchestrator.transition(casFlow, 'completed_local', {}, casFlow.revision - 1), (error) => error.code === 'STALE_RELEASE_FLOW')
const index = await persistence.rebuildIndex()
assert.equal(index.index.requestToFlow[localRequest.requestId], localRequest.requestId ? localResult.flow.releaseFlowId : undefined)
await fs.writeFile(path.join(persistence.authorityRoot, 'indices', 'index.json'), '{bad-index', 'utf8')
assert.equal((await persistence.rebuildIndex()).recovered, true)

const crashRoot = path.resolve('.codex-temp', 'release-orchestration-crash-smoke')
await fs.rm(crashRoot, { recursive: true, force: true })
const crashStore = createReleasePersistence({ root: crashRoot })
const crashOrchestrator = createReleaseOrchestrator({ root: crashRoot, persistence: crashStore, readRepository: async () => ({ repoIdentity: repository.repoIdentity, branch: repository.expectedBranch, headSha: repository.expectedHeadSha }) })
const crashRequest = (await crashOrchestrator.createRequest({ evidence: evidenceWithDelivery, requestedAction: 'request_ci', crashPoint: 'after_request' })).request
assert.equal((await crashOrchestrator.reconcile()).recovered.some((item) => item.type === 'flow'), true)

const corruptFile = path.join(persistence.authorityRoot, 'requests', `${localRequest.requestId}.json`)
await fs.writeFile(corruptFile, '{not-json', 'utf8')
const corruption = await persistence.scan()
assert.equal(corruption.requests.corruptions.some((item) => item.recordId === localRequest.requestId), true)

const otherRoot = path.resolve('.codex-temp', 'release-orchestration-other')
await fs.rm(otherRoot, { recursive: true, force: true })
const other = createReleasePersistence({ root: otherRoot })
assert.equal((await other.scan()).requests.records.length, 0)
assert.equal((await fs.readdir(path.join(root, '.jefe-release', 'outbox'))).length, 2)
console.log('PASS jefe-release-orchestration-smoke: durable requests, flows, CAS, local delivery, auth, outbox, replay, reconciliation, corruption and isolation')
