import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import execution from '../electron/orchestrator-canonical-execution-contract.cjs'
import planner from '../electron/jefe-planner-contract.cjs'
import persistenceModule from '../electron/orchestrator-canonical-qa-security-persistence.cjs'
import serviceModule from '../electron/orchestrator-canonical-qa-security-service.cjs'
import recoveryModule from '../electron/orchestrator-canonical-qa-security-recovery.cjs'
import qa from '../electron/orchestrator-canonical-qa-security-contract.cjs'

const { createExecutionContract } = execution
const { derivePlannerPlanId } = planner
const { createQaSecurityPersistence } = persistenceModule
const { createQaSecurityService } = serviceModule
const { createQaSecurityRecovery } = recoveryModule
const checks = Object.keys(qa.CHECK_CATALOG)
const plan = { schemaVersion: 'jefe-planner-contract/v1', plannerPlanId: 'planner-plan-' + 'a'.repeat(32), planningRequestId: 'planner-request-' + 'b'.repeat(32), identity: { projectId: 'project-qa', runId: 'run-qa', versionId: 'version-qa' }, sourceRefs: { intakeId: 'intake-' + 'c'.repeat(32), researchPlanId: 'research-plan-' + 'd'.repeat(32), evidenceCaseId: 'evidence-case-' + 'e'.repeat(32), executionFlowId: 'research-execution-' + 'f'.repeat(32) }, packageRef: { packageId: 'context-package-' + '1'.repeat(32), checksum: '2'.repeat(64), disposition: 'ready' }, objective: 'Validar QA y seguridad local', scope: ['revision local'], dependencies: [], risks: [], constraints: [], steps: [{ stepId: 'review_scope', order: 1, status: 'planned', dependsOn: [] }, { stepId: 'resolve_dependencies', order: 2, status: 'planned', dependsOn: ['review_scope'] }, { stepId: 'prepare_execution_contract', order: 3, status: 'planned', dependsOn: ['resolve_dependencies'] }], gate: { contractStatus: 'closed', evidenceState: 'accepted_for_context', packageDisposition: 'ready', executionPermitted: false, nextCheckpoint: 'contract_gate' }, state: 'ready_for_contract_gate', revision: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
plan.plannerPlanId = derivePlannerPlanId(plan.planningRequestId)
const repository = { repositoryId: 'repo-qa', rootKey: 'allowlisted-root', branch: 'integration/orquestador-canonical-v1', head: 'a'.repeat(40), clean: true, sourceWorktree: false, worktreeId: 'worktree-qa', allowlisted: true }
const contract = { ...createExecutionContract({ plannerPlan: plan, repository, actionId: 'codex.inspect', args: { targetPaths: ['src/app.ts'] }, now: '2026-01-01T00:00:00.000Z' }), state: 'running' }
const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canonical-qa-security-6-'))
const store = createQaSecurityPersistence({ root, clock: () => '2026-01-01T00:00:01.000Z' })
const service = createQaSecurityService({ persistence: store, clock: () => '2026-01-01T00:00:01.000Z' })
const recovery = createQaSecurityRecovery({ persistence: store })
const input = { executionContract: contract, evidenceCaseId: 'evidence-case-' + 'e'.repeat(32), scope: { paths: ['electron/orchestrator-canonical-qa-security-contract.cjs', 'electron/jefe-planner-contract.cjs', 'src/App.tsx', 'src/index.css'], artifactIds: ['artifact-report'] }, checkIds: checks, now: '2026-01-01T00:00:00.000Z' }
try {
  assert.throws(() => qa.createQaSecurityRun({ ...input, scope: { paths: ['../secret'], artifactIds: [] } }), (error) => error.code === 'UNSAFE_QA_PATH') // 1 6A path policy
  assert.throws(() => qa.createQaSecurityRun({ ...input, checkIds: ['shell'] }), (error) => error.code === 'QA_CHECK_NOT_ALLOWLISTED') // 2 6A catalog
  const [created, replay] = await Promise.all([service.request(input), service.request(input)])
  assert.equal(created.idempotent, false); assert.equal(replay.idempotent, true) // 3-4 6B create/replay/concurrency
  const run = created.record; assert.equal((await store.readChecks(run.qaRunId)).length, checks.length) // 5 durable checks
  await service.prepare(run.qaRunId); await service.start(run.qaRunId) // 6 state transitions
  await assert.rejects(() => store.transition(run.qaRunId, 0, 'evidence_pending'), (error) => error.code === 'STALE_QA_COMPLETION') // 7 run CAS
  for (const checkId of checks) {
    await service.reserveCheck(run.qaRunId, checkId); await service.startCheck(run.qaRunId, checkId)
    const files = checkId === 'accessibility_static' ? ['src/App.tsx'] : checkId === 'responsive_static' ? ['src/index.css'] : ['electron/jefe-planner-contract.cjs']; const result = await service.runLocalCheck(run.qaRunId, checkId, { workspaceRoot: process.cwd(), files }); assert.equal(result.receipt.evidenceClass, 'trusted_local', `${checkId}: ${result.receipt.outcome} ${result.receipt.sanitizedSummary}`); await service.finishCheck(run.qaRunId, checkId, 'passed')
  }
  await service.finishEvidence(run.qaRunId); const gatesPending = await service.deriveGates(run.qaRunId); assert.equal(gatesPending.technical.state, 'passed'); assert.equal(gatesPending.security.state, 'passed'); assert.equal(gatesPending.accessibility.state, 'passed') // 8-10 6C independent gates
  const finished = await service.finalize(run.qaRunId); assert.equal(finished.state, 'passed'); assert.equal(finished.revision, 5); assert.equal((await store.readGates(run.qaRunId)).technical.state, 'passed') // 11 durable overall local gate
  assert.deepEqual(await service.deriveGates(run.qaRunId), await service.deriveGates(run.qaRunId)) // 12 gate deterministic
  const beforeRead = await fs.readFile(path.join(store.paths.runs, `${run.qaRunId}.json`), 'utf8'); await store.read(run.qaRunId); const afterRead = await fs.readFile(path.join(store.paths.runs, `${run.qaRunId}.json`), 'utf8'); assert.equal(afterRead, beforeRead) // 13 read model never rewrites bytes
  const runC = (await service.request({ ...input, scope: { paths: ['src/App.tsx'], artifactIds: ['artifact-c'] }, checkIds: ['syntax', 'eslint_focal'], evidenceCaseId: null })).record; await service.prepare(runC.qaRunId); await service.start(runC.qaRunId); await service.reserveCheck(runC.qaRunId, 'syntax'); await service.startCheck(runC.qaRunId, 'syntax'); await service.reserveCheck(runC.qaRunId, 'eslint_focal'); await assert.rejects(() => service.startCheck(runC.qaRunId, 'eslint_focal'), (error) => error.code === 'QA_CONCURRENCY_LIMIT'); await service.cancelCheck(runC.qaRunId, 'eslint_focal'); await service.cancelCheck(runC.qaRunId, 'syntax') // 14 concurrency 1 and cancellation
  const runB = (await service.request({ ...input, scope: { paths: ['src/App.tsx'], artifactIds: ['artifact-b'] }, evidenceCaseId: null })).record
  await service.prepare(runB.qaRunId); await service.start(runB.qaRunId); await service.reserveCheck(runB.qaRunId, 'path_policy'); await service.startCheck(runB.qaRunId, 'path_policy'); const badPath = await service.record(runB.qaRunId, 'path_policy', service.inspectPath('../outside')); assert.equal(badPath.receipt.evidenceClass, 'rejected'); assert.equal(badPath.findings[0].blocking, true); await service.finishCheck(runB.qaRunId, 'path_policy', 'rejected') // 15 finding rejected
  await assert.rejects(() => service.record(runB.qaRunId, 'path_policy', { findings: [{ ruleId: 'unsafe-path', title: 'Fuera de scope', sanitizedSummary: 'Hallazgo sanitizado.', location: { path: '../outside', line: null } }] }), (error) => error.code === 'UNSAFE_QA_PATH') // 15 finding path cannot escape scope
  await service.reserveCheck(runB.qaRunId, 'command_policy'); await service.startCheck(runB.qaRunId, 'command_policy'); const badCommand = await service.record(runB.qaRunId, 'command_policy', service.inspectCommand('shell')); assert.equal(badCommand.findings[0].severity, 'critical'); await service.finishCheck(runB.qaRunId, 'command_policy', 'rejected') // 15 command control
  await service.reserveCheck(runB.qaRunId, 'secret_scan_local'); await service.startCheck(runB.qaRunId, 'secret_scan_local'); await service.record(runB.qaRunId, 'secret_scan_local', { outcome: 'failed', summary: 'Secret scan local detecto hallazgo.', findings: [{ ruleId: 'secret-pattern', severity: 'critical', title: 'Secreto detectado', sanitizedSummary: 'Hallazgo sanitizado para correccion.', blocking: true, location: { path: 'src/App.tsx', line: 1 } }] }); await service.finishCheck(runB.qaRunId, 'secret_scan_local', 'failed'); await assert.rejects(() => service.retryCheck(runB.qaRunId, 'secret_scan_local'), (error) => error.code === 'QA_CRITICAL_RETRY_REQUIRES_CORRECTION') // 16 critical retry requires correction
  const bState = await store.read(runB.qaRunId); assert.ok((await store.readChecks(runB.qaRunId)).some((item) => item.checkId === 'artifact_scope')); await service.finishEvidence(runB.qaRunId); await service.finalize(runB.qaRunId); await assert.rejects(() => service.openCorrection(runB.qaRunId, ['finding-' + 'f'.repeat(32)], 'execution', 'FORGED_FINDING'), (error) => error.code === 'QA_FINDING_NOT_CORRELATED'); const correction = await service.openCorrection(runB.qaRunId, (await store.readFindings(runB.qaRunId)).map((item) => item.findingId), 'execution', 'SECURITY_BLOCKER'); assert.equal(correction.record.state, 'requested'); assert.equal((await store.read(runB.qaRunId)).state, 'correction_requested') // 17 correction target and correlation
  await service.reserveCheck(runB.qaRunId, 'artifact_scope'); await service.startCheck(runB.qaRunId, 'artifact_scope'); await service.finishCheck(runB.qaRunId, 'artifact_scope', 'timed_out'); const retried = await service.retryCheck(runB.qaRunId, 'artifact_scope'); assert.equal(retried.attemptNumber, 2); const cancelled = await service.cancelCheck(runB.qaRunId, 'artifact_scope'); assert.equal(cancelled.state, 'cancelled'); await assert.rejects(() => store.transitionCheck(runB.qaRunId, 'artifact_scope', 0, 'running'), (error) => error.code === 'STALE_QA_COMPLETION') // 18 timeout/retry/cancel/stale
  const runBFile = path.join(store.paths.runs, `${runB.qaRunId}.json`); const runBBytes = await fs.readFile(runBFile, 'utf8'); assert.equal((await store.read(runB.qaRunId)).qaRunId, runB.qaRunId); assert.equal(await fs.readFile(runBFile, 'utf8'), runBBytes) // 19 read byte stable
  const receiptFiles = await fs.readdir(store.paths.receipts); const corruptFile = path.join(store.paths.receipts, receiptFiles.find((name) => name.startsWith('qa-receipt-'))); const corruptBytes = await fs.readFile(corruptFile, 'utf8'); await fs.writeFile(corruptFile, '{corrupt\n', 'utf8'); const diagnosed = await recovery.diagnose(run.qaRunId); assert.equal(diagnosed.canExecuteChecks, false); assert.ok(diagnosed.corruption.length >= 1); await recovery.rebuild(); await fs.writeFile(corruptFile, corruptBytes) // 20 recovery preserves/isolates corruption
  assert.equal((await store.rebuildIndex()).index.schemaVersion, 'orchestrator-qa-index/v1') // 21 rebuild
  const aReceipts = await store.readReceipts(run.qaRunId); const bReceipts = await store.readReceipts(runB.qaRunId); assert.ok(aReceipts.every((item) => item.qaRunId === run.qaRunId)); assert.ok(bReceipts.every((item) => item.qaRunId === runB.qaRunId)) // 22 A/B isolation
  assert.equal((await store.gates(run.qaRunId)).human_approval.state, 'not_connected') // 23 human gate honest
  assert.equal(service.inspectCommand('git add .').outcome, 'rejected') // 24 deploy/unsafe command rejection path
  console.log('PASS orchestrator-canonical-qa-security-6-smoke: casos 1-24')
} finally { await fs.rm(root, { recursive: true, force: true }) }
