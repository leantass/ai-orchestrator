import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const governance = require('../electron/jefe-release-governance.cjs')
const release = require('../electron/jefe-release-contract.cjs')

const root = path.join(process.cwd(), '.codex-temp', 'escalon-12b-governance')
const head = '5cd946865f2bb8e6f08cbfcdc45b5618a43b2af5'
const snapshotSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const now = '2026-09-29T12:00:00.000Z'

function rejects(fn, code) { assert.throws(fn, (error) => { assert.equal(error.code, code); return true }) }
function baseSnapshot(overrides = {}) {
  return governance.createGovernanceSnapshot({
    projectId: 'project-a', versionId: 'version-v2', e2eFlowId: 'e2e-flow-project-a-v2',
    qaEvidence: { evidenceId: 'qa-v2', status: 'passed', eligibleForPromotion: true },
    humanApproval: { approvalId: 'approval-v2', state: 'approved', snapshotSha256: snapshotSha },
    delivery: { deliveryId: 'delivery-v2', manifestSha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
    releaseRequest: { requestId: 'release-request-v2', state: 'prepared' },
    repository: { repoIdentity: 'leantass/ai-orchestrator', branch: 'feature/continue-orchestrator', headSha: head },
    branch: 'feature/continue-orchestrator', commit: head,
    ciEvidence: { provider: 'github-actions', workflow: 'CI', status: 'passed', commitSha: head },
    incidents: [], blockers: [], sourceRefs: ['qa:qa-v2', 'approval:approval-v2', 'delivery:delivery-v2', 'release:release-request-v2'],
    createdAt: now, ...overrides
  })
}

async function main() {
  await fs.rm(root, { recursive: true, force: true })
  const snapshot = baseSnapshot()
  assert.equal(snapshot.schemaVersion, governance.SNAPSHOT_SCHEMA)
  assert.equal(snapshot.fingerprint.length, 64)
  const store = governance.createGovernanceStore({ root })
  assert.equal((await store.saveSnapshot(snapshot)).idempotent, false)
  assert.equal((await store.saveSnapshot(snapshot)).idempotent, true)

  const releaseEvaluation = governance.evaluateRelease({ snapshot })
  assert.equal(releaseEvaluation.decision, 'candidate_ready')
  const releaseDecision = governance.createReleaseDecision({ snapshot, decision: 'approved', actor: 'human-release-owner', reason: 'Exact version evidence reviewed', createdAt: now })
  assert.equal((await store.saveReleaseDecision(releaseDecision)).idempotent, false)

  const productionEvaluation = governance.evaluateProduction({ snapshot, releaseDecision })
  assert.equal(productionEvaluation.decision, 'blocked')
  rejects(() => governance.createProductionDecision({ snapshot, releaseDecision, decision: 'approved', actor: 'human-production-owner', reason: 'missing production evidence', createdAt: now }), 'PRODUCTION_EVIDENCE_REQUIRED')
  const productionDecision = governance.createProductionDecision({ snapshot, releaseDecision, decision: 'blocked', actor: 'system-governance', reason: 'deploy adapter is not connected', createdAt: now })
  assert.equal(productionDecision.decision, 'blocked')
  assert.throws(() => governance.createProductionDecision({ snapshot, releaseDecision: { ...releaseDecision, decision: 'candidate_ready' }, decision: 'blocked', actor: 'system-governance', reason: 'invalid authority', createdAt: now }), (error) => error.code === 'PRODUCTION_RELEASE_APPROVAL_REQUIRED')

  rejects(() => governance.assertSnapshotFresh(snapshot, { ...snapshot, ciEvidence: { ...snapshot.ciEvidence, commitSha: '6b091ad49c517b08f8227e29cd0c1182e6cc3b20' } }), 'STALE_GOVERNANCE_SNAPSHOT')
  rejects(() => governance.assertDecisionFresh(releaseDecision, baseSnapshot({ blockers: ['REMOTE_CI_REQUIRED'] })), 'STALE_GOVERNANCE_DECISION')
  const missingQa = baseSnapshot({ qaEvidence: null })
  assert.equal(governance.evaluateRelease({ snapshot: missingQa }).decision, 'not_ready')
  assert.ok(governance.evaluateRelease({ snapshot: baseSnapshot({ humanApproval: null }) }).blockers.includes('humanApproval_required'))
  assert.ok(governance.evaluateRelease({ snapshot: baseSnapshot({ delivery: null }) }).blockers.includes('delivery_required'))

  rejects(() => release.createCiEvidence({ provider: 'local', workflow: 'CI', repository: 'leantass/ai-orchestrator', commitSha: head, status: 'passed', startedAt: now, evidenceSource: 'local quality command' }), 'REMOTE_CI_EVIDENCE_REQUIRED')
  rejects(() => governance.createReleaseDecision({ snapshot, decision: 'approved', projectId: 'project-b', actor: 'human', reason: 'wrong project', createdAt: now }), 'GOVERNANCE_IDENTITY_MISMATCH')
  rejects(() => governance.createReleaseDecision({ snapshot, decision: 'approved', versionId: 'version-v1', actor: 'human', reason: 'wrong version', createdAt: now }), 'GOVERNANCE_IDENTITY_MISMATCH')

  const lifecycle = governance.createAuthorizationLifecycle({ authorizationId: 'authorization-release', requestId: 'release-request-v2', decisionId: releaseDecision.decisionId, snapshotId: snapshot.snapshotId, scope: ['release_tag'], createdAt: now })
  assert.equal(lifecycle.state, 'active')
  const consumed = governance.transitionAuthorizationLifecycle(lifecycle, 'consumed', now)
  assert.equal(consumed.state, 'consumed')
  assert.throws(() => governance.transitionAuthorizationLifecycle(consumed, 'active', now), (error) => error.code === 'AUTHORIZATION_LIFECYCLE_TERMINAL')
  assert.deepEqual(governance.createCiPolicy({ mandatoryChecks: ['quality', 'quality'] }).mandatoryChecks, ['quality'])
  assert.equal(governance.createEnvironmentPolicy({ environment: 'production' }).deploy, 'not_connected')
  assert.equal(governance.createDeployGovernance().executor, 'not_connected')
  const serialized = JSON.stringify({ snapshot, releaseDecision, productionDecision, lifecycle })
  assert.equal(/token|password|api[_-]?key|bearer/iu.test(serialized), false)
  console.log('PASS jefe-release-governance-12b-smoke: snapshots, decisions, stale protection, lifecycle, CI/environment policy and negative gates')
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
