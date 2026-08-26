import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import persistence from '../electron/orchestrator-canonical-execution-persistence.cjs'
import serviceModule from '../electron/orchestrator-canonical-execution-service.cjs'
import memoryModule from '../electron/jefe-context-persistence.cjs'
import planner from '../electron/jefe-planner-contract.cjs'
const { derivePlannerPlanId } = planner
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canonical-execution-5c-')); try {
  const repo = { repositoryId: 'repo-smoke', rootKey: 'allowlisted-root', branch: 'main', head: 'a'.repeat(40), clean: true, sourceWorktree: false, worktreeId: 'worktree-smoke', allowlisted: true }
  const plan = { schemaVersion: 'jefe-planner-contract/v1', plannerPlanId: 'planner-plan-' + 'a'.repeat(32), planningRequestId: 'planner-request-' + 'b'.repeat(32), identity: { projectId: 'project-smoke', runId: 'run-smoke', versionId: 'version-smoke' }, sourceRefs: { intakeId: 'intake-' + 'c'.repeat(32), researchPlanId: 'research-plan-' + 'd'.repeat(32), evidenceCaseId: 'evidence-case-' + 'e'.repeat(32), executionFlowId: 'research-execution-' + 'f'.repeat(32) }, packageRef: { packageId: 'context-package-' + '1'.repeat(32), checksum: '2'.repeat(64), disposition: 'ready' }, objective: 'Controlar ejecucion', scope: ['revision local'], dependencies: [], risks: [], constraints: [], steps: [{ stepId: 'review_scope', order: 1, status: 'planned', dependsOn: [] }, { stepId: 'resolve_dependencies', order: 2, status: 'planned', dependsOn: ['review_scope'] }, { stepId: 'prepare_execution_contract', order: 3, status: 'planned', dependsOn: ['resolve_dependencies'] }], gate: { contractStatus: 'closed', evidenceState: 'accepted_for_context', packageDisposition: 'ready', executionPermitted: false, nextCheckpoint: 'contract_gate' }, state: 'ready_for_contract_gate', revision: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
  plan.plannerPlanId = derivePlannerPlanId(plan.planningRequestId); const executionPersistence = persistence.createExecutionPersistence({ root }); const memory = memoryModule.createContextMemory({ root: path.join(root, 'memory'), allowedRoots: [root] }); const service = serviceModule.createCanonicalExecutionService({ persistence: executionPersistence, repositories: [repo], memory, clock: () => '2026-01-01T00:00:01.000Z' });
  const record = await service.request({ plannerPlan: plan, repositoryId: repo.repositoryId, actionId: 'codex.inspect', args: { targetPaths: ['src/app.ts'] } }); assert.equal(record.state, 'requested') // 1 planner gate
  const waiting = await service.dispatch(record.executionId); assert.equal(waiting.state, 'waiting_for_authority') // 2 no forged authority
  const resultReady = await executionPersistence.transition(record.executionId, waiting.revision, 'running'); const completed = await service.completeTechnicalResult(record.executionId, { summary: 'Adaptador externo no conectado; no hubo ejecucion.', outcome: 'not_verified' }); assert.equal(completed.state, 'completed_unverified') // 3 technical result
  const appended = await service.appendToMemory(record.executionId); assert.equal(appended.technicalOnly, true); assert.equal((await memory.getSnapshot()).results.length, 1) // 4 memory after persist
  await assert.rejects(() => service.completeTechnicalResult(record.executionId, { summary: 'x', stdout: 'raw' }), (error) => error.code === 'UNSAFE_RESULT') // 5 sanitization
  assert.equal(resultReady.state, 'running')
  console.log('PASS orchestrator-canonical-execution-5c-smoke: casos 1-5')
} finally { await fs.rm(root, { recursive: true, force: true }) }
