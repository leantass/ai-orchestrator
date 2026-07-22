import assert from 'node:assert/strict'
import { createFactoryMemoryContextAssemblyPlan } from '../src/factory/memory-context-assembly/index.ts'
import { evaluateFactoryMemoryContextApproval } from '../src/factory/memory-context-approval/index.ts'
import { evaluateFactoryCodexTaskContractCandidate, parseFactoryCodexTaskContractCandidateResult, serializeFactoryCodexTaskContractCandidateResult, summarizeFactoryCodexTaskContractCandidateResult, validateFactoryCodexTaskContractCandidate, validateFactoryCodexTaskContractCandidateResult, validateFactoryCodexTaskIntent } from '../src/factory/codex-task-contract-candidate/index.ts'

const at = '2026-07-18T21:00:00.000Z'
const readItem = { readItemId: 'read-item-task-candidate', sourceReadCandidateId: 'candidate', memoryRecordId: 'memory-task-candidate', memoryRecordKind: 'factory_project_contract', memoryRecordVersion: '1.0', namespace: 'factory/projects/task/contracts', projectNamespace: 'factory/projects/task', logicalTarget: 'factory-memory/projects/task/record.json', metadataLogicalTarget: 'factory-memory/projects/task/record.meta.json', fingerprint: 'abc123', idempotencyKey: 'factory-memory-abc123', readStatus: 'read', safeMemoryRecord: { title: 'Task context', summary: 'Safe context.', canonicalFacts: { readiness: 'clean' }, references: [], lineage: {}, retentionPolicy: 'retain', containsSecrets: false, containsRawEvidence: false }, readResult: { exists: true, parsed: true, verified: true }, readbackChecks: [], warnings: [], blockers: [], containsFullMemoryRecord: false, containsCanonicalPayload: false, containsRawEvidence: false, containsSecrets: false, canAssembleContext: false, canCreateCodexTask: false, canExecuteCodex: false, canCreateEmbeddings: false, canCreateProject: false, canCreateRepository: false, canDeploy: false }
const runtime = { runtimeReadId: 'runtime-task-candidate', runtimeReadKind: 'factory-memory-read-runtime', runtimeReadVersion: '1.0', executedAt: at, executedBy: 'smoke', sourceReadAdmissionId: 'read-admission-task', readPurpose: 'jefe_review_context', status: 'success', readItems: [readItem], recordsRead: 1, recordsBlocked: 0, recordsMissing: 0, checks: [], blockers: [], warnings: [], canAssembleContext: false, canCreateCodexTask: false, canExecuteCodex: false, canCreateEmbeddings: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, recommendedNextStep: 'Memory Context Assembly Gate' }
const assembly = createFactoryMemoryContextAssemblyPlan({ memoryReadRuntimeResult: runtime, assembledAt: at, assembledBy: 'smoke', contextPurpose: 'jefe_review_context' })
const approval = evaluateFactoryMemoryContextApproval({ memoryContextAssemblyResult: assembly, reviewedAt: at, reviewedBy: 'Lean', humanApprovalRef: 'human:context' })
const intent = (overrides = {}) => ({ taskIntentId: 'task-intent-1', taskKind: 'analysis_only', title: 'Analyze approved context', objective: 'Produce a governed analysis plan candidate.', nonGoals: ['Do not execute Codex.', 'Do not modify files.'], acceptanceCriteria: [{ criterionId: 'criterion-1', description: 'Candidate contains clear findings.' }], constraints: ['read-only candidate'], allowedSurfaces: ['approved_context_envelope', 'read_only_analysis'], forbiddenActions: ['assemble_final_codex_prompt', 'create_executable_codex_task', 'execute_codex', 'modify_files', 'run_commands', 'access_secrets', 'external_network_calls', 'create_project', 'create_repository', 'deploy', 'publish', 'call_model'], proposedValidationPlan: { validationPlanId: 'validation-plan-1', proposedChecks: ['review candidate'], proposedCommands: ['npm run typecheck'], requiredEvidence: ['manual review'], stopOnFailure: true, commandsExecuted: false, futureRunnerRequired: true }, evidenceRequirements: [{ evidenceRequirementId: 'evidence-1', description: 'Report validation status.' }], responseRequirements: [{ responseRequirementId: 'response-1', description: 'RESULTADO GENERAL' }, { responseRequirementId: 'response-2', description: 'ARCHIVOS MODIFICADOS' }], stopConditions: [{ stopConditionId: 'stop-1', description: 'Stop on failed validation.' }], riskLevel: 'low', requestedBy: 'Lean', requestedAt: at, ...overrides })
const run = (extra = {}) => evaluateFactoryCodexTaskContractCandidate({ memoryContextApprovalResult: approval, taskIntent: intent(), createdAt: at, createdBy: 'smoke', ...extra })
const result = run()
assert.equal(result.decision, 'approve_codex_task_contract_candidate') // 1
assert.equal(validateFactoryCodexTaskContractCandidate(result.contractCandidate).ok, true) // 2
assert.equal(validateFactoryCodexTaskContractCandidateResult(result).ok, true) // 3
assert.equal(result.decision, 'approve_codex_task_contract_candidate') // 4
assert.equal(result.status, 'codex_task_contract_candidate_ready') // 5
assert.equal(result.contractCandidate.promptAssemblyStatus, 'not_generated') // 6
assert.equal(result.contractCandidate.codexTaskStatus, 'not_created') // 7
assert.equal(result.contractCandidate.codexExecutionStatus, 'not_allowed') // 8
assert.equal(result.contractCandidate.fileMutationStatus, 'not_allowed') // 9
assert.equal(result.contractCandidate.commandExecutionStatus, 'not_allowed') // 10
assert.equal(result.contractCandidate.externalNetworkStatus, 'not_allowed') // 11
assert.equal(result.contractCandidate.secretsAccessStatus, 'not_allowed') // 12
assert.equal(result.contractCandidate.canAssembleCodexPrompt, false) // 13
assert.equal(result.contractCandidate.canCreateExecutableCodexTask, false) // 14
assert.equal(result.contractCandidate.canExecuteCodex, false) // 15
assert.equal(result.contractCandidate.canModifyFiles, false) // 16
assert.equal(result.contractCandidate.canRunCommands, false) // 17
assert.equal(result.contractCandidate.canAccessSecrets, false) // 18
assert.equal(result.contractCandidate.canCreateProject, false) // 19
assert.equal(result.contractCandidate.canCreateRepository, false) // 20
assert.equal(result.contractCandidate.canDeploy, false) // 21
assert.equal(evaluateFactoryCodexTaskContractCandidate({ taskIntent: intent(), createdAt: at, createdBy: 'smoke' }).decision, 'blocked') // 22
assert.equal(run({ memoryContextApprovalResult: { ...approval, decision: 'human_review_required', status: 'human_review_required' } }).decision, 'reject_task_intent') // 23
assert.equal(run({ memoryContextApprovalResult: { ...approval, approvedContextEnvelope: undefined } }).decision, 'blocked') // 24
assert.equal(evaluateFactoryCodexTaskContractCandidate({ memoryContextApprovalResult: approval, createdAt: at, createdBy: 'smoke' }).decision, 'blocked') // 25
assert.equal(run({ taskIntent: intent({ objective: '' }) }).decision, 'request_task_contract_changes') // 26
assert.equal(run({ taskIntent: intent({ nonGoals: [] }) }).decision, 'request_task_contract_changes') // 27
assert.equal(run({ taskIntent: intent({ acceptanceCriteria: [] }) }).decision, 'request_task_contract_changes') // 28
assert.equal(run({ taskIntent: intent({ riskLevel: 'high' }) }).decision, 'human_review_required') // 29
assert.equal(run({ taskIntent: intent({ taskKind: 'code_change_candidate' }) }).decision, 'human_review_required') // 30
assert.equal(run({ taskIntent: intent({ allowedSurfaces: ['execute_codex'] }) }).decision, 'blocked') // 31
assert.equal(run({ taskIntent: intent({ constraints: ['allow run_commands'] }) }).decision, 'blocked') // 32
assert.equal(run({ taskIntent: intent({ constraints: ['allow access_secrets'] }) }).decision, 'blocked') // 33
assert.equal(run({ taskIntent: intent({ constraints: ['allow deploy'] }) }).decision, 'blocked') // 34
assert.equal(result.contractCandidate.validationPlan.commandsExecuted, false) // 35
assert.ok(result.contractCandidate.responseRequirements.length >= 2) // 36
assert.ok(result.contractCandidate.forbiddenActions.includes('execute_codex') && result.contractCandidate.forbiddenActions.includes('modify_files') && result.contractCandidate.forbiddenActions.includes('run_commands') && result.contractCandidate.forbiddenActions.includes('access_secrets')) // 37
assert.equal(parseFactoryCodexTaskContractCandidateResult(serializeFactoryCodexTaskContractCandidateResult(result)).candidateGateId, result.candidateGateId) // 38
const summary = summarizeFactoryCodexTaskContractCandidateResult(result); assert.equal(JSON.stringify(summary).includes('packageCandidate'), false) // 39
assert.equal(JSON.stringify(summary).includes('final prompt'), false) // 40
assert.ok(/Codex Task Contract Approval Gate/u.test(result.recommendedNextStep) && !/execute Codex directly/iu.test(result.recommendedNextStep)) // 41
assert.equal(Object.keys(result).includes('filesystem'), false) // 42
assert.equal(Object.keys(result).includes('modelCall'), false) // 43
assert.equal(result.contractCandidate.validationPlan.commandsExecuted, false) // 44
assert.equal(result.contractCandidate.canCreateExecutableCodexTask, false) // 45
assert.equal(validateFactoryCodexTaskIntent(intent()).ok, true)
console.log(JSON.stringify({ ok: true, checks: 45, candidateGateKind: result.candidateGateKind, decision: result.decision, status: result.status, promptAssemblyStatus: result.contractCandidate.promptAssemblyStatus, codexTaskStatus: result.contractCandidate.codexTaskStatus, canExecuteCodex: result.canExecuteCodex }, null, 2))

