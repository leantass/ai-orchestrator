import assert from 'node:assert/strict'
import { createFactoryMemoryContextAssemblyPlan } from '../src/factory/memory-context-assembly/index.ts'
import { evaluateFactoryMemoryContextApproval, parseFactoryMemoryContextApprovalResult, serializeFactoryMemoryContextApprovalResult, summarizeFactoryMemoryContextApprovalResult, validateFactoryMemoryContextApprovalInput, validateFactoryMemoryContextApprovalResult } from '../src/factory/memory-context-approval/index.ts'

const at = '2026-07-18T20:00:00.000Z'
const record = { memoryRecordId: 'memory-record-context-approval', memoryRecordKind: 'factory_project_contract', memoryRecordVersion: '1.0', namespace: 'factory/projects/context-approval/contracts', projectNamespace: 'factory/projects/context-approval', title: 'Approval Context', summary: 'Safe package.', canonicalFacts: { readiness: 'clean', codexAllowed: false }, references: [{ logicalTarget: 'factory-memory/projects/context-approval/record.json' }], lineage: { sourcePersistenceId: 'persistence:1' }, retentionPolicy: 'retain_until_governed_removal', priority: 1, containsSecrets: false, containsRawEvidence: false }
const readItem = (overrides = {}) => ({ readItemId: overrides.readItemId ?? 'read-item-approval', sourceReadCandidateId: 'candidate-approval', memoryRecordId: 'memory-record-context-approval', memoryRecordKind: 'factory_project_contract', memoryRecordVersion: '1.0', namespace: record.namespace, projectNamespace: record.projectNamespace, logicalTarget: 'factory-memory/projects/context-approval/record.json', metadataLogicalTarget: 'factory-memory/projects/context-approval/record.meta.json', fingerprint: 'abc12345', idempotencyKey: 'factory-memory-abc12345', readStatus: 'read', safeMemoryRecord: record, metadataReadback: undefined, readResult: { exists: true, parsed: true, verified: true }, readbackChecks: [], warnings: [], blockers: [], containsFullMemoryRecord: false, containsCanonicalPayload: false, containsRawEvidence: false, containsSecrets: false, canAssembleContext: false, canCreateCodexTask: false, canExecuteCodex: false, canCreateEmbeddings: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, ...overrides })
const runtime = (items = [readItem()]) => ({ runtimeReadId: 'runtime-context-approval', runtimeReadKind: 'factory-memory-read-runtime', runtimeReadVersion: '1.0', executedAt: at, executedBy: 'smoke', sourceReadAdmissionId: 'read-admission-context-approval', readPurpose: 'jefe_review_context', status: 'success', readItems: items, recordsRead: 1, recordsBlocked: 0, recordsMissing: 0, checks: [], blockers: [], warnings: [], canAssembleContext: false, canCreateCodexTask: false, canExecuteCodex: false, canCreateEmbeddings: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, recommendedNextStep: 'Memory Context Assembly Gate' })
const assembly = (extra = {}, items) => ({ ...createFactoryMemoryContextAssemblyPlan({ memoryReadRuntimeResult: runtime(items), assembledAt: at, assembledBy: 'smoke', contextPurpose: 'jefe_review_context', humanReviewRef: 'human:assembly' }), ...extra })
const approve = (extra = {}) => evaluateFactoryMemoryContextApproval({ memoryContextAssemblyResult: assembly(), reviewedAt: at, reviewedBy: 'Lean', humanApprovalRef: 'human:context-approval', ...extra })

const result = approve()
assert.equal(result.decision, 'approve_context_package_for_handoff_candidate') // 1
assert.ok(result.approvalReceipt) // 2
assert.ok(result.approvedContextEnvelope) // 3
assert.equal(result.approvedContextEnvelope.contextApprovalStatus, 'approved_candidate') // 4
assert.equal(result.approvedContextEnvelope.codexTaskStatus, 'not_allowed') // 5
assert.equal(result.approvedContextEnvelope.codexExecutionStatus, 'not_allowed') // 6
assert.equal(result.approvedContextEnvelope.embeddingsStatus, 'not_allowed') // 7
assert.equal(evaluateFactoryMemoryContextApproval({ memoryContextAssemblyResult: assembly(), reviewedAt: at, reviewedBy: 'Lean' }).decision, 'human_review_required') // 8
assert.equal(evaluateFactoryMemoryContextApproval({ memoryContextAssemblyResult: assembly({ packageCandidate: undefined }), reviewedAt: at, reviewedBy: 'Lean', humanApprovalRef: 'h' }).decision, 'blocked') // 9
assert.equal(evaluateFactoryMemoryContextApproval({ memoryContextAssemblyResult: assembly({ decision: 'reject_context_assembly', status: 'rejected' }), reviewedAt: at, reviewedBy: 'Lean', humanApprovalRef: 'h' }).decision, 'reject_context_package') // 10
const withPackage = (mutate) => { const base = assembly(); const pkg = structuredClone(base.packageCandidate); mutate(pkg); return evaluateFactoryMemoryContextApproval({ memoryContextAssemblyResult: { ...base, packageCandidate: pkg }, reviewedAt: at, reviewedBy: 'Lean', humanApprovalRef: 'h' }) }
assert.equal(withPackage((pkg) => pkg.blockers.push({ blockerId: 'b', message: 'blocked' })).decision, 'request_context_changes') // 11
assert.equal(withPackage((pkg) => pkg.items[0].blockers.push('blocked')).decision, 'request_context_changes') // 12
assert.equal(withPackage((pkg) => { pkg.items[0].containsFullMemoryRecord = true }).decision, 'blocked') // 13
assert.equal(withPackage((pkg) => { pkg.items[0].containsCanonicalPayload = true }).decision, 'blocked') // 14
assert.equal(withPackage((pkg) => { pkg.items[0].containsRawEvidence = true }).decision, 'blocked') // 15
assert.equal(withPackage((pkg) => { pkg.items[0].containsSecrets = true }).decision, 'blocked') // 16
assert.equal(withPackage((pkg) => { pkg.items[0].containsPromptInstructions = true }).decision, 'blocked') // 17
assert.equal(withPackage((pkg) => { pkg.items[0].canCreateCodexTask = true }).decision, 'blocked') // 18
assert.equal(withPackage((pkg) => { pkg.items[0].canExecuteCodex = true }).decision, 'blocked') // 19
assert.equal(withPackage((pkg) => { pkg.items[0].canCreateEmbeddings = true }).decision, 'blocked') // 20
assert.equal(withPackage((pkg) => { pkg.items[0].canDeploy = true }).decision, 'blocked') // 21
assert.equal(withPackage((pkg) => { pkg.approxChars = pkg.maxApproxChars + 1 }).decision, 'blocked') // 22
assert.ok(result.approvalReceipt.notAuthorizedActions.includes('create_codex_task') && result.approvalReceipt.notAuthorizedActions.includes('execute_codex') && result.approvalReceipt.notAuthorizedActions.includes('call_model') && result.approvalReceipt.notAuthorizedActions.includes('assemble_final_prompt')) // 23
assert.equal(result.canCreateCodexTask, false) // 24
assert.equal(result.canExecuteCodex, false) // 25
assert.equal(result.canCreateEmbeddings, false) // 26
assert.equal(result.canCreateProject, false) // 27
assert.equal(result.canCreateRepository, false) // 28
assert.equal(result.canDeploy, false) // 29
assert.equal(parseFactoryMemoryContextApprovalResult(serializeFactoryMemoryContextApprovalResult(result)).approvalId, result.approvalId) // 30
const summary = summarizeFactoryMemoryContextApprovalResult(result); assert.equal(JSON.stringify(summary).includes('packageCandidate'), false) // 31
assert.equal(JSON.stringify(summary).includes('readiness'), false) // 32
assert.ok(/Codex Task Contract Gate|Context Repair/u.test(result.recommendedNextStep) && !/execute Codex directly/iu.test(result.recommendedNextStep)) // 33
assert.equal(Object.keys(result).includes('filesystem'), false) // 34
assert.equal(Object.keys(result).includes('modelCall'), false) // 35
assert.equal(validateFactoryMemoryContextApprovalInput({ memoryContextAssemblyResult: assembly(), reviewedAt: at, reviewedBy: 'Lean', humanApprovalRef: 'h' }).ok, true)
assert.equal(validateFactoryMemoryContextApprovalResult(result).ok, true)
console.log(JSON.stringify({ ok: true, checks: 35, approvalKind: result.approvalKind, decision: result.decision, status: result.status, receiptPresent: Boolean(result.approvalReceipt), envelopePresent: Boolean(result.approvedContextEnvelope), codexTaskStatus: result.approvedContextEnvelope.codexTaskStatus, canExecuteCodex: result.canExecuteCodex }, null, 2))

