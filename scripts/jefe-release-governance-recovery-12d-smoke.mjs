import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const governance = require('../electron/jefe-release-governance.cjs')
const recovery = require('../electron/jefe-release-governance-recovery.cjs')

const root = path.join(process.cwd(), '.codex-temp', 'escalon-12d-governance')
const headA = '5cd946865f2bb8e6f08cbfcdc45b5618a43b2af5'
const headB = '6b091ad49c517b08f8227e29cd0c1182e6cc3b20'
const snapshotSha = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const now = '2026-09-30T12:00:00.000Z'
const input = (overrides = {}) => ({
  projectId: 'project-a', versionId: 'version-v2', e2eFlowId: 'e2e-flow-project-a-v2',
  qaEvidence: { evidenceId: 'qa-v2', status: 'passed', eligibleForPromotion: true },
  humanApproval: { approvalId: 'approval-v2', state: 'approved', snapshotSha256: snapshotSha },
  delivery: { deliveryId: 'delivery-v2', manifestSha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
  releaseRequest: { requestId: 'release-request-v2', state: 'prepared' },
  repository: { repoIdentity: 'leantass/ai-orchestrator', branch: 'feature/continue-orchestrator', headSha: headA },
  branch: 'feature/continue-orchestrator', commit: headA,
  ciEvidence: { provider: 'github-actions', workflow: 'CI', status: 'failed', commitSha: headA },
  incidents: [], blockers: [], sourceRefs: ['qa:qa-v2', 'approval:approval-v2', 'delivery:delivery-v2', 'release:release-request-v2'], createdAt: now, ...overrides
})
const makeSnapshot = (overrides = {}) => governance.createGovernanceSnapshot(input(overrides))
function rejects(fn, code) { assert.throws(fn, (error) => { assert.equal(error.code, code); return true }) }
function decisionSet(snapshot) {
  const releaseDecision = governance.createReleaseDecision({ snapshot, decision: 'approved', actor: 'human-release-owner', reason: 'historical controlled decision', createdAt: now })
  const productionDecision = governance.createProductionDecision({ snapshot, releaseDecision, decision: 'blocked', actor: 'system-governance', reason: 'production not connected', createdAt: now })
  return { releaseDecision, productionDecision }
}
function lifecycle(snapshot, state = 'active', overrides = {}) { return governance.createAuthorizationLifecycle({ authorizationId: `authorization-${state}-${overrides.suffix || 'a'}`, requestId: 'release-request-v2', decisionId: overrides.decisionId || null, snapshotId: snapshot.snapshotId, projectId: 'project-a', versionId: 'version-v2', environment: 'staging', scope: ['release_tag'], state, createdAt: now, ...overrides }) }

async function main() {
  await fs.rm(root, { recursive: true, force: true })
  const base = makeSnapshot()
  const { releaseDecision, productionDecision } = decisionSet(base)
  const changedQa = makeSnapshot({ qaEvidence: { evidenceId: 'qa-v3', status: 'passed', eligibleForPromotion: true } })
  const changedDelivery = makeSnapshot({ delivery: { deliveryId: 'delivery-v3', manifestSha256: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc' } })
  const changedCommit = makeSnapshot({ commit: headB, repository: { repoIdentity: 'leantass/ai-orchestrator', branch: 'feature/continue-orchestrator', headSha: headB }, ciEvidence: { provider: 'github-actions', workflow: 'CI', status: 'failed', commitSha: headB } })
  for (const current of [changedQa, changedDelivery, changedCommit]) { const diagnosis = recovery.diagnose({ snapshot: current, releaseDecisions: [releaseDecision], now }); assert.ok(diagnosis.incidents.some((item) => item.category === 'stale_release_decision')) }
  const productionStale = recovery.diagnose({ snapshot: changedDelivery, productionDecisions: [productionDecision], now }); assert.ok(productionStale.incidents.some((item) => item.category === 'stale_production_decision'))

  const authStates = ['revoked', 'expired', 'consumed', 'superseded']
  const authDiagnosis = recovery.diagnose({ snapshot: base, authorizations: authStates.map((state, index) => lifecycle(base, state, { suffix: `${index}` })), now })
  assert.equal(authDiagnosis.incidents.filter((item) => item.category.startsWith('authorization_')).length, 4)
  rejects(() => recovery.assertAuthorizationUsable(lifecycle(base, 'revoked', { suffix: 'use' }), { action: 'release_tag', projectId: 'project-a', versionId: 'version-v2', snapshotId: base.snapshotId, environment: 'staging', at: now }), 'AUTHORIZATION_NOT_USABLE')
  rejects(() => recovery.assertAuthorizationUsable(lifecycle(base, 'active', { suffix: 'expired-use', expiresAt: '2026-09-29T12:00:00.000Z' }), { action: 'release_tag', snapshotId: base.snapshotId, at: now }), 'AUTHORIZATION_EXPIRED')
  const consumed = lifecycle(base, 'consumed', { suffix: 'replay' })
  rejects(() => recovery.assertAuthorizationUsable(consumed, { action: 'release_tag', snapshotId: base.snapshotId, at: now }), 'AUTHORIZATION_NOT_USABLE')
  rejects(() => recovery.assertAuthorizationUsable(lifecycle(base, 'active', { suffix: 'project', projectId: 'project-b' }), { action: 'release_tag', projectId: 'project-a', snapshotId: base.snapshotId, at: now }), 'AUTHORIZATION_PROJECT_MISMATCH')
  rejects(() => recovery.assertAuthorizationUsable(lifecycle(base, 'active', { suffix: 'version', versionId: 'version-v1' }), { action: 'release_tag', versionId: 'version-v2', snapshotId: base.snapshotId, at: now }), 'AUTHORIZATION_VERSION_MISMATCH')
  rejects(() => recovery.assertAuthorizationUsable(lifecycle(base, 'active', { suffix: 'action' }), { action: 'deploy', snapshotId: base.snapshotId, at: now }), 'AUTHORIZATION_ACTION_MISMATCH')
  rejects(() => recovery.assertAuthorizationUsable(lifecycle(base, 'active', { suffix: 'environment', environment: 'staging' }), { action: 'release_tag', environment: 'production', snapshotId: base.snapshotId, at: now }), 'AUTHORIZATION_ENVIRONMENT_MISMATCH')

  const tamperedDecision = { ...releaseDecision, reason: 'tampered' }
  const tamperDiagnosis = recovery.diagnose({ snapshot: base, releaseDecisions: [tamperedDecision], authorizations: [{ ...lifecycle(base), state: 'tampered' }], now })
  assert.ok(tamperDiagnosis.incidents.some((item) => item.category === 'corrupt_release_decision'))
  assert.ok(tamperDiagnosis.incidents.some((item) => item.category === 'corrupt_authorization'))
  const missingDiagnosis = recovery.diagnose({ snapshot: makeSnapshot({ qaEvidence: null, delivery: null }), now })
  assert.equal(missingDiagnosis.status, 'blocked')

  const recoveryInstance = recovery.createRecovery({ root, clock: () => now })
  const diagnosis = recovery.diagnose({ snapshot: changedDelivery, releaseDecisions: [releaseDecision], productionDecisions: [productionDecision], authorizations: [lifecycle(base, 'revoked', { suffix: 'durable' })], now })
  const plan = recovery.derivePlan(diagnosis, now)
  const planAgain = recovery.derivePlan(diagnosis, now)
  assert.equal(plan.planId, planAgain.planId)
  const applied = await recoveryInstance.applyPlan(plan, diagnosis)
  assert.equal(applied.journal.status, 'applied')
  const replay = await recoveryInstance.applyPlan(plan, diagnosis)
  assert.equal(replay.idempotent, true)
  const staleDiagnosis = recovery.diagnose({ snapshot: changedCommit, releaseDecisions: [releaseDecision], now })
  await assert.rejects(() => recoveryInstance.applyPlan(plan, staleDiagnosis), (error) => { assert.equal(error.code, 'STALE_GOVERNANCE_RECOVERY_PLAN'); return true })

  const crashRoot = path.join(root, 'crash')
  let injected = false
  const crashing = recovery.createRecovery({ root: crashRoot, clock: () => now, failureInjection: async ({ afterAction }) => { if (afterAction && !injected) { injected = true; return true } return false } })
  const crashPlan = recovery.derivePlan(diagnosis, now)
  await assert.rejects(() => crashing.applyPlan(crashPlan, diagnosis), (error) => error.code === 'INJECTED_RECOVERY_FAILURE')
  const reopened = recovery.createRecovery({ root: crashRoot, clock: () => now })
  const recovered = await reopened.applyPlan(crashPlan, diagnosis)
  assert.equal(recovered.journal.status, 'applied')
  assert.equal((await reopened.applyPlan(crashPlan, diagnosis)).idempotent, true)

  const health = await recoveryInstance.governanceView()
  assert.equal(health.readOnly, true)
  assert.equal(health.releaseReadiness, 'BLOCKED')
  assert.equal(health.productionReady, false)
  assert.equal(health.canary, 'historical_blocked')
  assert.equal(health.deployNow, false)
  assert.equal(health.auditEvents > 0, true)
  assert.equal(/token|password|api[_-]?key|bearer/iu.test(JSON.stringify({ diagnosis, plan, health })), false)
  console.log('PASS jefe-release-governance-recovery-12d-smoke: diagnosis, deterministic plans, stale protection, authorization lifecycle, tamper, crash/restart, replay, health and historical canary closure')
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1 })
