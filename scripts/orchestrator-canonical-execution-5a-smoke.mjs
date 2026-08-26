import assert from 'node:assert/strict'
import contract from '../electron/orchestrator-canonical-execution-contract.cjs'
import planner from '../electron/jefe-planner-contract.cjs'
const { ACTIONS, createExecutionContract, deriveExecutionId } = contract
const { derivePlannerPlanId } = planner
const plan = { schemaVersion: 'jefe-planner-contract/v1', plannerPlanId: 'planner-plan-' + 'a'.repeat(32), planningRequestId: 'planner-request-' + 'b'.repeat(32), identity: { projectId: 'project-smoke', runId: 'run-smoke', versionId: 'version-smoke' }, sourceRefs: { intakeId: 'intake-' + 'c'.repeat(32), researchPlanId: 'research-plan-' + 'd'.repeat(32), evidenceCaseId: 'evidence-case-' + 'e'.repeat(32), executionFlowId: 'research-execution-' + 'f'.repeat(32) }, packageRef: { packageId: 'context-package-' + '1'.repeat(32), checksum: '2'.repeat(64), disposition: 'ready' }, objective: 'Preparar ejecucion controlada', scope: ['revision local'], dependencies: [], risks: [], constraints: [], steps: [{ stepId: 'review_scope', order: 1, status: 'planned', dependsOn: [] }, { stepId: 'resolve_dependencies', order: 2, status: 'planned', dependsOn: ['review_scope'] }, { stepId: 'prepare_execution_contract', order: 3, status: 'planned', dependsOn: ['resolve_dependencies'] }], gate: { contractStatus: 'closed', evidenceState: 'accepted_for_context', packageDisposition: 'ready', executionPermitted: false, nextCheckpoint: 'contract_gate' }, state: 'ready_for_contract_gate', revision: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
plan.plannerPlanId = derivePlannerPlanId(plan.planningRequestId)
const repository = { repositoryId: 'repo-smoke', rootKey: 'allowlisted-root', branch: 'integration/orquestador-canonical-v1', head: 'a'.repeat(40), clean: true, sourceWorktree: false, worktreeId: 'worktree-smoke', allowlisted: true }
const base = { plannerPlan: plan, repository, actionId: 'codex.inspect', args: { targetPaths: ['src/app.ts'] }, now: '2026-01-01T00:00:00.000Z' }
assert.equal(Object.hasOwn(ACTIONS, 'codex.inspect'), true) // 1 catalogo cerrado
const created = createExecutionContract(base)
assert.match(created.executionId, /^execution-[a-f0-9]{32}$/u) // 2 correlacion
assert.equal(created.baseline.fingerprint.length, 64) // 3 baseline
assert.equal(created.permission.executionApproved, false) // 4 permiso derivado
assert.equal(created.state, 'requested') // 5 planner cerrado
assert.throws(() => createExecutionContract({ ...base, actionId: 'shell', args: {} }), (error) => error.code === 'COMMAND_NOT_ALLOWLISTED') // 6 comando
assert.throws(() => createExecutionContract({ ...base, args: { targetPaths: ['../../secret'] } }), (error) => error.code === 'UNSAFE_PATH') // 7 traversal
assert.throws(() => createExecutionContract({ ...base, args: { targetPaths: ['C:/secret'] } }), (error) => error.code === 'UNSAFE_PATH') // 8 root externo
assert.throws(() => createExecutionContract({ ...base, repository: { ...repository, clean: false } }), (error) => error.code === 'REPOSITORY_POLICY_BLOCKED') // 9 worktree sucio
assert.throws(() => createExecutionContract({ ...base, repository: { ...repository, sourceWorktree: true } }), (error) => error.code === 'REPOSITORY_POLICY_BLOCKED') // 10 fuente protegida
assert.throws(() => createExecutionContract({ ...base, args: { targetPaths: ['src/app.ts', 'x'.repeat(241)] } }), (error) => error.code === 'UNSAFE_PATH') // 11 limite de path
assert.equal(deriveExecutionId({ a: 1 }), deriveExecutionId({ a: 1 })) // 12 id determinista
console.log('PASS orchestrator-canonical-execution-5a-smoke: casos 1-12')
