import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { registerQaSecurityIpc, CHANNELS } = require('../electron/jefe-qa-security-ipc.cjs')
const { createExecutionContract } = require('../electron/orchestrator-canonical-execution-contract.cjs')
const { derivePlannerPlanId } = require('../electron/jefe-planner-contract.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-qa-ipc-'))
const handlers = new Map()
const ipcMain = { handle: (channel, handler) => handlers.set(channel, handler) }
try {
  const created = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'ipc-project', runId: 'ipc-run', versionId: 'ipc-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'IPC QA', brief: 'Validar la superficie QA local.', brandSpec: { name: 'IPC QA' } })
  assert.equal(created.ok, true, JSON.stringify(created.error))
  const api = registerQaSecurityIpc({ ipcMain, projectRoot: root })
  assert.deepEqual(Object.keys(CHANNELS).sort(), ['capabilities', 'correction', 'corrections', 'findings', 'gates', 'recovery', 'request', 'snapshot'].sort())
  const capabilities = await handlers.get(CHANNELS.capabilities)(null, {})
  assert.equal(capabilities.arbitraryPaths, false)
  assert.equal(capabilities.arbitraryCommands, false)
  const planningRequestId = 'planner-request-' + 'b'.repeat(32)
  const plannerPlan = { schemaVersion: 'jefe-planner-contract/v1', plannerPlanId: derivePlannerPlanId(planningRequestId), planningRequestId, identity: { projectId: 'ipc-project', runId: 'ipc-run', versionId: 'ipc-version' }, sourceRefs: { intakeId: 'intake-' + 'c'.repeat(32), researchPlanId: 'research-plan-' + 'd'.repeat(32), evidenceCaseId: 'evidence-case-' + 'e'.repeat(32), executionFlowId: 'research-execution-' + 'f'.repeat(32) }, packageRef: { packageId: 'context-package-' + '1'.repeat(32), checksum: '2'.repeat(64), disposition: 'ready' }, objective: 'Validar IPC QA local', scope: ['revision local'], dependencies: [], risks: [], constraints: [], steps: [{ stepId: 'review_scope', order: 1, status: 'planned', dependsOn: [] }, { stepId: 'resolve_dependencies', order: 2, status: 'planned', dependsOn: ['review_scope'] }, { stepId: 'prepare_execution_contract', order: 3, status: 'planned', dependsOn: ['resolve_dependencies'] }], gate: { contractStatus: 'closed', evidenceState: 'accepted_for_context', packageDisposition: 'ready', executionPermitted: false, nextCheckpoint: 'contract_gate' }, state: 'ready_for_contract_gate', revision: 0, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
  const input = { executionContract: { ...createExecutionContract({ plannerPlan, repository: { repositoryId: 'ipc-repo', rootKey: 'allowlisted-root', branch: 'integration/orquestador-canonical-v1', head: 'a'.repeat(40), clean: true, sourceWorktree: false, worktreeId: 'ipc-worktree', allowlisted: true }, actionId: 'codex.inspect', args: { targetPaths: ['src/App.tsx'] }, now: '2026-08-26T00:00:00.000Z' }), state: 'running' }, evidenceCaseId: null, scope: { paths: ['src/App.tsx'], artifactIds: ['ipc-report'] }, checkIds: ['syntax'], now: '2026-08-26T00:00:00.000Z' }
  const requested = await handlers.get(CHANNELS.request)(null, { input })
  assert.equal(requested.ok, true, JSON.stringify(requested))
  const snapshot = await handlers.get(CHANNELS.snapshot)(null, { projectId: 'ipc-project', qaRunId: requested.run.qaRunId })
  assert.equal(snapshot.ok, true)
  assert.equal(snapshot.snapshot.run.projectId, 'ipc-project')
  assert.equal(snapshot.snapshot.checks.length, 1)
  const isolated = await handlers.get(CHANNELS.snapshot)(null, { projectId: 'other-project', qaRunId: requested.run.qaRunId })
  assert.equal(isolated.ok, false)
  assert.equal(isolated.error.code, 'PROJECT_NOT_FOUND')
  const arbitrary = await handlers.get(CHANNELS.request)(null, { input: { ...input, qaRunId: 'ipc-run-2', workspaceRoot: root } })
  assert.equal(arbitrary.ok, false)
  assert.equal(arbitrary.error.code, 'INVALID_PAYLOAD')
  const findings = await handlers.get(CHANNELS.findings)(null, { projectId: 'ipc-project', qaRunId: requested.run.qaRunId })
  const gates = await handlers.get(CHANNELS.gates)(null, { projectId: 'ipc-project', qaRunId: requested.run.qaRunId })
  const recovery = await handlers.get(CHANNELS.recovery)(null, { projectId: 'ipc-project', qaRunId: requested.run.qaRunId })
  assert.deepEqual(findings.findings, [])
  assert.equal(gates.ok, true)
  assert.equal(recovery.recovery.canExecuteChecks, false)
  console.log('PASS orchestrator-canonical-qa-security-ipc-6-smoke: canales semánticos, aislamiento, payload y lecturas derivadas')
} finally {
  await fs.promises.rm(root, { recursive: true, force: true })
}
