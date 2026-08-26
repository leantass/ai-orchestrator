import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import persistence from '../electron/orchestrator-canonical-execution-persistence.cjs'
import contract from '../electron/orchestrator-canonical-execution-contract.cjs'
import planner from '../electron/jefe-planner-contract.cjs'
const { createExecutionPersistence } = persistence; const { createExecutionContract } = contract
const { derivePlannerPlanId } = planner
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canonical-execution-5b-')); try {
  const repository = { repositoryId: 'repo-smoke', rootKey: 'allowlisted-root', branch: 'main', head: 'a'.repeat(40), clean: true, sourceWorktree: false, worktreeId: 'worktree-smoke', allowlisted: true }
  const plan = { schemaVersion: 'jefe-planner-contract/v1', plannerPlanId: 'planner-plan-' + 'a'.repeat(32), planningRequestId: 'planner-request-' + 'b'.repeat(32), identity: { projectId: 'project-smoke', runId: 'run-smoke', versionId: 'version-smoke' }, sourceRefs: { intakeId: 'intake-' + 'c'.repeat(32), researchPlanId: 'research-plan-' + 'd'.repeat(32), evidenceCaseId: 'evidence-case-' + 'e'.repeat(32), executionFlowId: 'research-execution-' + 'f'.repeat(32) }, packageRef: { packageId: 'context-package-' + '1'.repeat(32), checksum: '2'.repeat(64), disposition: 'ready' }, objective: 'Persistir ejecucion', scope: ['revision local'], dependencies: [], risks: [], constraints: [], steps: [{ stepId: 'review_scope', order: 1, status: 'planned', dependsOn: [] }, { stepId: 'resolve_dependencies', order: 2, status: 'planned', dependsOn: ['review_scope'] }, { stepId: 'prepare_execution_contract', order: 3, status: 'planned', dependsOn: ['resolve_dependencies'] }], gate: { contractStatus: 'closed', evidenceState: 'accepted_for_context', packageDisposition: 'ready', executionPermitted: false, nextCheckpoint: 'contract_gate' }, state: 'ready_for_contract_gate', revision: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
  plan.plannerPlanId = derivePlannerPlanId(plan.planningRequestId); const store = createExecutionPersistence({ root }); const record = createExecutionContract({ plannerPlan: plan, repository, actionId: 'codex.inspect', args: { targetPaths: ['src/app.ts'] }, now: '2026-01-01T00:00:00.000Z' });
  assert.equal((await store.create(record)).idempotent, false) // 1 staging atomico
  assert.equal((await store.create(record)).idempotent, true) // 2 replay idempotente
  const prepared = await store.transition(record.executionId, 0, 'prepared'); assert.equal(prepared.revision, 1) // 3 CAS
  await assert.rejects(() => store.transition(record.executionId, 0, 'running'), (error) => error.code === 'STALE_COMPLETION') // 4 stale
  const waiting = await store.transition(record.executionId, 1, 'waiting_for_authority'); assert.equal(waiting.state, 'waiting_for_authority') // 5 authority
  await assert.rejects(() => store.transition(record.executionId, 1, 'running'), (error) => error.code === 'STALE_COMPLETION') // 6 stale preserved
  const cancelled = await store.transition(record.executionId, 2, 'cancel_requested'); assert.equal(cancelled.state, 'cancel_requested') // 7 cancellation
  assert.equal((await store.rebuildIndex()).index.executionIds.length, 1) // 8 rebuildable index
  const interrupted = await store.transition(record.executionId, 3, 'interrupted'); const failed = await store.transition(record.executionId, interrupted.revision, 'failed_transient'); const retried = await store.retry(record.executionId, failed.revision); assert.equal(retried.state, 'requested'); assert.equal(retried.attemptNumber, 2); assert.equal(retried.attemptHistory.length, 1) // 9 retry lineage
  console.log('PASS orchestrator-canonical-execution-5b-smoke: casos 1-9')
} finally { await fs.rm(root, { recursive: true, force: true }) }
