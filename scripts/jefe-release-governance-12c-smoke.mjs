import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const governance = require('../electron/jefe-release-governance.cjs')
const release = require('../electron/jefe-release-contract.cjs')

const root = path.join(process.cwd(), '.codex-temp', 'escalon-12c')
const headA = '5cd946865f2bb8e6f08cbfcdc45b5618a43b2af5'
const headB = '6b091ad49c517b08f8227e29cd0c1182e6cc3b20'
const snapshotSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const now = '2026-09-29T12:00:00.000Z'
const snapshotInput = (overrides = {}) => ({
  projectId: 'project-a', versionId: 'version-v2', e2eFlowId: 'e2e-flow-project-a-v2',
  qaEvidence: { evidenceId: 'qa-v2', status: 'passed', eligibleForPromotion: true },
  humanApproval: { approvalId: 'approval-v2', state: 'approved', snapshotSha256: snapshotSha },
  delivery: { deliveryId: 'delivery-v2', manifestSha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
  releaseRequest: { requestId: 'release-request-v2', state: 'prepared' },
  repository: { repoIdentity: 'leantass/ai-orchestrator', branch: 'feature/continue-orchestrator', headSha: headA },
  branch: 'feature/continue-orchestrator', commit: headA,
  ciEvidence: { provider: 'github-actions', workflow: 'CI', status: 'passed', commitSha: headA },
  incidents: [], blockers: [], sourceRefs: ['qa:qa-v2', 'approval:approval-v2', 'delivery:delivery-v2', 'release:release-request-v2'], createdAt: now, ...overrides
})
const snapshot = (overrides = {}) => governance.createGovernanceSnapshot(snapshotInput(overrides))
function rejects(fn, code) { assert.throws(fn, (error) => { assert.equal(error.code, code); return true }) }

async function main() {
  await fs.rm(root, { recursive: true, force: true })
  const base = snapshot()
  const store = governance.createGovernanceStore({ root })
  assert.equal((await store.saveSnapshot(base)).idempotent, false)
  assert.equal(governance.evaluateRelease({ snapshot: base }).decision, 'candidate_ready')
  const releaseDecision = governance.createReleaseDecision({ snapshot: base, decision: 'approved', actor: 'human-release-owner', reason: 'controlled 12C acceptance', createdAt: now })
  assert.equal(releaseDecision.decision, 'approved')
  const view = governance.createGovernanceView({ snapshot: base, releaseDecision })
  assert.equal(view.releaseState, 'approved')
  assert.equal(view.releaseReadiness, 'blocked')
  assert.equal(view.deployNow, false)

  for (const field of ['qaEvidence', 'humanApproval', 'delivery']) {
    const result = governance.evaluateRelease({ snapshot: snapshot({ [field]: null }) })
    assert.equal(result.decision, 'not_ready')
    assert.ok(result.blockers.includes(`${field}_required`))
  }
  rejects(() => governance.assertSnapshotFresh(base, snapshotInput({ commit: headB, repository: { repoIdentity: 'leantass/ai-orchestrator', branch: 'feature/continue-orchestrator', headSha: headB }, ciEvidence: { provider: 'github-actions', workflow: 'CI', status: 'passed', commitSha: headB } })), 'STALE_GOVERNANCE_SNAPSHOT')
  rejects(() => governance.assertDecisionFresh(releaseDecision, snapshot({ versionId: 'version-v3', e2eFlowId: 'e2e-flow-project-a-v3' })), 'STALE_GOVERNANCE_DECISION')
  rejects(() => governance.validateGovernanceSnapshot({ ...base, blockers: ['tampered'], fingerprint: base.fingerprint }), 'GOVERNANCE_SNAPSHOT_INVALID')
  rejects(() => governance.validateReleaseDecision({ ...releaseDecision, reason: 'tampered' }), 'GOVERNANCE_DECISION_INVALID')

  const remoteAuth = release.createRemoteActionAuthorization({ request: { schemaVersion: release.RELEASE_REQUEST_SCHEMA, requestId: 'release-request-v2', idempotencyKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', identity: { projectId: 'project-a', versionId: 'version-v2', snapshotSha256: snapshotSha, approvalId: 'approval-v2', approvalSnapshotSha256: snapshotSha }, delivery: { deliveryId: 'delivery-v2', deliveryManifestSha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }, repository: { repoIdentity: 'leantass/ai-orchestrator', expectedBranch: 'feature/continue-orchestrator', expectedHeadSha: headA }, quality: { overallStatus: 'PASS', eligibleForPromotion: true }, policy: { requestedAction: 'prepare_release' }, status: 'prepared' }, action: 'release_tag', authorized: true, authorizationId: 'authorization-release-tag', actor: 'human-release-owner', reason: '12C boundary' })
  const lifecycleStates = ['active', 'consumed', 'expired', 'revoked', 'superseded']
  for (const state of lifecycleStates) assert.equal(governance.createAuthorizationLifecycle({ authorizationId: `authorization-${state}`, requestId: 'release-request-v2', decisionId: releaseDecision.decisionId, snapshotId: base.snapshotId, scope: ['release_tag'], state, createdAt: now }).state, state)
  rejects(() => release.validateRemoteActionAuthorization(remoteAuth, { requestId: 'release-request-v2', action: 'deploy' }), 'REMOTE_ACTION_MISMATCH')
  rejects(() => release.validateRemoteActionAuthorization(remoteAuth, { requestId: 'release-request-project-b', action: 'release_tag' }), 'REMOTE_ACTION_REQUEST_MISMATCH')
  const consumed = governance.transitionAuthorizationLifecycle(governance.createAuthorizationLifecycle({ authorizationId: 'authorization-replay', requestId: 'release-request-v2', decisionId: releaseDecision.decisionId, snapshotId: base.snapshotId, scope: ['release_tag'], createdAt: now }), 'consumed', now)
  rejects(() => governance.transitionAuthorizationLifecycle(consumed, 'active', now), 'AUTHORIZATION_LIFECYCLE_TERMINAL')
  rejects(() => governance.createProductionDecision({ snapshot: base, releaseDecision: { ...releaseDecision, decision: 'candidate_ready' }, decision: 'blocked', actor: 'system', reason: 'no release approval', createdAt: now }), 'PRODUCTION_RELEASE_APPROVAL_REQUIRED')
  const production = governance.createProductionDecision({ snapshot: base, releaseDecision, decision: 'blocked', actor: 'system-governance', reason: 'deploy not connected', createdAt: now })
  assert.equal(production.decision, 'blocked')
  assert.equal(governance.evaluateProduction({ snapshot: base, releaseDecision }).productionReady, false)

  assert.equal(governance.evaluateRelease({ snapshot: snapshot({ ciEvidence: { provider: 'github-actions', workflow: 'CI', status: 'failed', commitSha: headA } }) }).decision, 'blocked')
  assert.ok(governance.evaluateRelease({ snapshot: snapshot({ ciEvidence: { provider: 'local', workflow: 'CI', status: 'passed', commitSha: headA } }) }).blockers.includes('REMOTE_CI_REQUIRED'))
  assert.deepEqual(governance.createCiPolicy({ workflow: 'CI', mandatoryChecks: ['quality'] }).mandatoryChecks, ['quality'])
  for (const environment of ['local', 'staging', 'production']) assert.equal(governance.createEnvironmentPolicy({ environment }).deploy, 'not_connected')
  assert.equal(governance.createDeployGovernance().execution, 'not_connected')
  assert.equal(/token|password|api[_-]?key|bearer/iu.test(JSON.stringify({ base, releaseDecision, production, remoteAuth })), false)
  console.log('PASS jefe-release-governance-12c-smoke: controlled candidate, decisions, authorization boundaries, stale detection, CI policy and deploy boundary')
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
