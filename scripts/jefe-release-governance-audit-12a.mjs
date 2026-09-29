import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const contract = require('../electron/jefe-release-contract.cjs')
const { createReleasePersistence } = require('../electron/jefe-release-persistence.cjs')
const { createReleaseOrchestrator } = require('../electron/jefe-release-orchestrator.cjs')

const root = path.join(process.cwd(), '.codex-temp', 'escalon-12a')
const head = '5cd946865f2bb8e6f08cbfcdc45b5618a43b2af5'
const repository = 'leantass/ai-orchestrator'
const now = '2026-09-29T12:00:00.000Z'
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex')
const results = {}
const findings = []

async function cleanRoot() {
  await fs.rm(root, { recursive: true, force: true })
  await fs.mkdir(root, { recursive: true })
}

function expectReject(label, fn, code) {
  return Promise.resolve().then(fn).then(() => { throw new Error(`${label} unexpectedly passed`) }, (error) => {
    if (code) assert.equal(error.code, code, `${label} returned an unexpected error`)
    return error
  })
}

function delivery(projectId = 'project-a', versionId = 'version-v2') {
  const contentHash = sha256(`${projectId}/${versionId}/artifact`)
  return {
    manifest: { deliveryId: `delivery-${projectId}-${versionId}`, projectId, versionId, preparedAt: now, files: [{ relativePath: 'dist/index.html', sha256: contentHash }] },
    artifactHashes: { 'dist/index.html': contentHash }
  }
}

function evidence({ projectId = 'project-a', versionId = 'version-v2', withDelivery = true, quality = 'PASS', repositoryEvidence = true } = {}) {
  const snapshot = sha256(`${projectId}/${versionId}/snapshot`)
  return {
    project: { projectId },
    version: { versionId, snapshotSha256: snapshot },
    sourceVersion: { immutable: true },
    approval: { approvalId: `approval-${projectId}-${versionId}`, versionId, snapshotSha256: snapshot, state: 'approved', decision: 'approved' },
    quality: { overallStatus: quality, eligibleForPromotion: quality === 'PASS', evidenceId: `qa-${versionId}` },
    delivery: withDelivery ? { projectId, versionId, ...delivery(projectId, versionId) } : undefined,
    repository: repositoryEvidence ? { repoIdentity: repository, expectedBranch: 'feature/continue-orchestrator', expectedHeadSha: head, remoteUrl: 'https://github.com/leantass/ai-orchestrator.git' } : undefined
  }
}

async function run() {
  await cleanRoot()
  const persistence = createReleasePersistence({ root })
  const currentRepository = { repoIdentity: repository, branch: 'feature/continue-orchestrator', headSha: head, remoteUrl: 'https://github.com/leantass/ai-orchestrator.git' }
  const readDelivery = async (projectId, versionId) => delivery(projectId, versionId)
  const prepareDelivery = readDelivery
  const orchestrator = createReleaseOrchestrator({ root, persistence, prepareDelivery, readDelivery, readRepository: async () => currentRepository, clock: () => now })

  await expectReject('approval only', () => contract.createReleaseRequest({ evidence: evidence({ withDelivery: false }), requestedAction: 'prepare_release' }), 'DELIVERY_REQUIRED')
  results.approvalOnlyNotCandidate = true
  await expectReject('quality gate', () => contract.createReleaseRequest({ evidence: evidence({ quality: 'FAIL' }), requestedAction: 'prepare_release' }), 'QUALITY_EVIDENCE_REQUIRED')
  results.qualityGate = true
  await expectReject('missing repository', () => contract.createReleaseRequest({ evidence: evidence({ repositoryEvidence: false }), requestedAction: 'prepare_local_delivery' }), 'REPOSITORY_EVIDENCE_REQUIRED')
  results.repositoryBindingRequired = true

  const request = (await orchestrator.createRequest({ evidence: evidence(), requestedAction: 'prepare_release' })).request
  const local = await orchestrator.prepareLocalDelivery(request.requestId)
  assert.equal(local.flow.state, 'completed_local')
  const waiting = await orchestrator.requestCi(request.requestId)
  assert.equal(waiting.flow.state, 'waiting_authorization')
  results.deliveryAndRemoteCiGate = true

  const auth = contract.createRemoteActionAuthorization({ request, action: 'trigger_ci', authorized: true, authorizationId: 'authorization-trigger-ci', actor: 'audit-operator', reason: '12A audit' })
  await orchestrator.persistAuthorization(request.requestId, auth)
  const queued = await orchestrator.requestCi(request.requestId, auth.authorizationId)
  assert.equal(queued.outbox.action, 'trigger_ci')
  const replay = await orchestrator.requestCi(request.requestId, auth.authorizationId)
  assert.equal(replay.idempotent, true)
  results.authorizationOutboxReplay = true

  const failedCi = contract.createCiEvidence({ provider: 'github-actions', workflow: 'CI', repository, commitSha: head, status: 'failed', startedAt: now, completedAt: now, evidenceSource: 'trusted remote adapter' })
  await expectReject('failed CI release gate', () => orchestrator.prepareRelease(request.requestId, { authorizationId: auth.authorizationId, ciEvidence: failedCi }), 'CI_EVIDENCE_MISMATCH')
  results.failedCiBlocksRelease = true

  const passedCi = contract.createCiEvidence({ provider: 'github-actions', workflow: 'CI', repository, commitSha: head, status: 'passed', startedAt: now, completedAt: now, evidenceSource: 'trusted remote adapter' })
  const releaseAuth = contract.createRemoteActionAuthorization({ request, action: 'release_tag', authorized: true, authorizationId: 'authorization-release-tag', actor: 'audit-operator', reason: '12A negative control' })
  await expectReject('release authorization absent', () => orchestrator.prepareRelease(request.requestId, { authorizationId: 'authorization-missing', ciEvidence: passedCi }), 'REMOTE_ACTION_AUTHORIZATION_REQUIRED')
  await orchestrator.persistAuthorization(request.requestId, releaseAuth)
  const releaseOutbox = await orchestrator.prepareRelease(request.requestId, { authorizationId: releaseAuth.authorizationId, ciEvidence: passedCi })
  assert.equal(releaseOutbox.outbox.action, 'release_tag')
  results.passedCiStillNeedsReleaseAuthorization = true

  await expectReject('wrong CI commit', () => orchestrator.prepareRelease(request.requestId, { authorizationId: releaseAuth.authorizationId, ciEvidence: { ...passedCi, commitSha: '6b091ad49c517b08f8227e29cd0c1182e6cc3b20' } }), 'CI_EVIDENCE_MISMATCH')
  await expectReject('wrong action authorization', () => contract.validateRemoteActionAuthorization(auth, { requestId: request.requestId, action: 'git_push' }), 'REMOTE_ACTION_MISMATCH')
  const projectB = (await orchestrator.createRequest({ evidence: evidence({ projectId: 'project-b', versionId: 'version-b1' }), requestedAction: 'prepare_release' })).request
  await expectReject('cross project authorization', () => contract.validateRemoteActionAuthorization(auth, { requestId: projectB.requestId, action: 'trigger_ci' }), 'REMOTE_ACTION_REQUEST_MISMATCH')
  results.commitAndProjectBinding = true

  const stalePersistence = createReleasePersistence({ root: path.join(root, 'stale') })
  const staleOrchestrator = createReleaseOrchestrator({ root: path.join(root, 'stale'), persistence: stalePersistence, prepareDelivery, readDelivery, readRepository: async () => ({ ...currentRepository, headSha: '6b091ad49c517b08f8227e29cd0c1182e6cc3b20' }), clock: () => now })
  const staleRequest = (await staleOrchestrator.createRequest({ evidence: evidence({ projectId: 'project-stale', versionId: 'version-stale' }), requestedAction: 'prepare_release' })).request
  const stale = await staleOrchestrator.prepareLocalDelivery(staleRequest.requestId)
  assert.equal(stale.flow.state, 'stale')
  results.staleRepositoryBaseline = true

  const authKeys = Object.keys(auth)
  assert.equal(authKeys.includes('expiresAt'), false)
  assert.equal(authKeys.includes('revokedAt'), false)
  assert.equal(authKeys.includes('consumedAt'), false)
  findings.push({ id: 'P1-RELEASE-DECISION', severity: 'P1', status: 'open', summary: 'No durable ReleaseDecision or ProductionDecision contract exists; prepare_release currently produces an action outbox.' })
  findings.push({ id: 'P1-AUTH-LIFECYCLE', severity: 'P1', status: 'open', summary: 'Remote authorization has request/action binding but no explicit expiry, revocation, or consumption policy fields.' })
  findings.push({ id: 'P1-DEPLOY-GOVERNANCE', severity: 'P1', status: 'open', summary: 'Deploy is an allowlisted action, but environment/target and production decision authority are not modeled.' })
  findings.push({ id: 'P2-CHECK-POLICY', severity: 'P2', status: 'open', summary: 'CI evidence validates provider/workflow/commit shape, while mandatory-check completeness remains policy outside the release contract.' })
  findings.push({ id: 'P2-ACTION-NAMING', severity: 'P2', status: 'open', summary: 'git_commit is listed under remote actions although the current adapter separates local commit execution from push.' })
  results.readOnly = true
  results.noRemoteOrProvider = true

  const report = {
    schemaVersion: 'jefe-release-governance-audit/v1', audit: 'ESCALON_12A', repository, baseHead: head,
    currentState: { releaseCandidate: false, releaseReady: false, deployReady: false, productionReady: false, remoteCiQuality: 'FAILING_HISTORICAL_LINT_DEBT', historicalLintErrors: 306 },
    workflow: { file: '.github/workflows/ci.yml', name: 'CI', dispatch: true },
    authorityMatrix: { approval: 'human decision for exact version', qa: 'quality evidence and promotion eligibility', delivery: 'hash-bound local artifact evidence', releaseRequest: 'durable identity and baseline binding', remoteAuthorization: 'action/request binding', ci: 'trusted provider/workflow/commit evidence', releaseDecision: 'NOT_IMPLEMENTED_IN_12A', productionDecision: 'NOT_IMPLEMENTED_IN_12A' },
    results, findings, providerCalls: 0, externalNetworkUsed: false, generatedAt: now
  }
  await fs.writeFile(path.join(root, 'audit-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(`RELEASE_GOVERNANCE_AUDIT_12A=${findings.every((item) => item.status === 'open') ? 'PASS' : 'FAIL'}`)
  console.log(`FINDINGS=${findings.length}`)
  console.log(`EVIDENCE_ROOT=${root}`)
}

run().catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
