import assert from 'node:assert/strict'
import { createFactoryMemoryAdmissionPlan } from '../src/factory/memory-admission/index.ts'
import { evaluateFactoryMemoryWriteApproval, parseFactoryMemoryWriteApprovalResult, serializeFactoryMemoryWriteApprovalResult, summarizeFactoryMemoryWriteApprovalResult, validateFactoryMemoryWriteApprovalInput, validateFactoryMemoryWriteApprovalResult } from '../src/factory/memory-write-approval/index.ts'

const at = '2026-07-17T14:00:00.000Z'
const entry = (overrides = {}) => ({ registryEntryId: 'registry-entry-approval', contractProjectId: 'project-approval', projectSlug: 'approved-memory', targetPath: 'factory-project-contracts/approved-memory/factory-project-contract.v1.json', metadataPath: 'factory-project-contracts/approved-memory/factory-project-contract.v1.meta.json', expectedFingerprint: 'feed1234', recalculatedFingerprint: 'feed1234', expectedIdempotencyKey: 'factory-contract-cafe5678', recalculatedIdempotencyKey: 'factory-contract-cafe5678', contractExists: true, metadataExists: true, metadataMatchesContract: true, fingerprintMatches: true, idempotencyMatches: true, flagsSafe: true, pathContained: true, status: 'clean', checks: [], findings: [], canUseForMemory: true, canUseForCodexTask: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, ...overrides })
const report = (entries) => ({ integrityKind: 'factory-contract-registry-integrity', integrityVersion: '1.0', generatedAt: at, checkedBy: 'JEFE', storageRoot: '.codex-temp/smoke', registryIndexRef: 'registry-index:approval-smoke', status: 'clean', entries, summary: { totalEntries: entries.length, statusCounts: { clean: entries.length }, severityCounts: {}, criticalFindings: 0, cleanEntries: entries.length, blockedEntries: 0, canUseForMemory: entries.length, canUseForCodexTask: 0, recommendedNextStep: 'MEMORIA review' }, findings: [], blockers: [], warnings: [], recommendedNextStep: 'MEMORIA review' })
const admission = createFactoryMemoryAdmissionPlan({ integrityReport: report([entry()]), createdAt: at, createdBy: 'JEFE' })
const input = { admissionResult: admission, createdAt: at, reviewedBy: 'Lean', reviewerRole: 'owner', humanApprovalRef: 'human-memory-approval' }
const approved = evaluateFactoryMemoryWriteApproval(input)
assert.equal(approved.decision, 'approve_project_memory_for_persistence_candidate') // 1
assert.ok(approved.approvalReceipt) // 2
assert.ok(approved.approvedMemoryEnvelope) // 3
assert.equal(approved.approvedMemoryEnvelope.memoryPersistenceStatus, 'not_persisted') // 4
assert.equal(approved.approvedMemoryEnvelope.codexTaskStatus, 'not_allowed') // 5
assert.equal(approved.approvedMemoryEnvelope.globalPromotionStatus, 'not_allowed') // 6
assert.equal(evaluateFactoryMemoryWriteApproval({ ...input, humanApprovalRef: undefined }).decision, 'human_review_required') // 7
const criticalAdmission = structuredClone(admission); criticalAdmission.blockers.push({ blockerId: 'critical', message: 'Critical blocker.' }); assert.equal(evaluateFactoryMemoryWriteApproval({ ...input, admissionResult: criticalAdmission }).decision, 'block_memory_write') // 8
const emptyAdmission = structuredClone(admission); emptyAdmission.recordDrafts = []; assert.equal(evaluateFactoryMemoryWriteApproval({ ...input, admissionResult: emptyAdmission }).decision, 'request_memory_changes') // 9
const unsafeDecision = (patch) => { const unsafeAdmission = structuredClone(admission); unsafeAdmission.recordDrafts[0] = { ...unsafeAdmission.recordDrafts[0], ...patch }; return evaluateFactoryMemoryWriteApproval({ ...input, admissionResult: unsafeAdmission }).decision }
assert.equal(unsafeDecision({ containsSecrets: true }), 'block_memory_write') // 10
assert.equal(unsafeDecision({ containsRawEvidence: true }), 'block_memory_write') // 11
assert.equal(unsafeDecision({ globalPromotionAllowed: true }), 'block_memory_write') // 12
assert.equal(unsafeDecision({ codexTaskAllowed: true }), 'block_memory_write') // 13
assert.equal(unsafeDecision({ projectCreationAllowed: true }), 'block_memory_write') // 14
assert.equal(unsafeDecision({ repositoryCreationAllowed: true }), 'block_memory_write') // 15
assert.equal(unsafeDecision({ deployAllowed: true }), 'block_memory_write') // 16
const contradictionAdmission = structuredClone(admission); contradictionAdmission.decisions[0].decision = 'possible_contradiction'; assert.equal(evaluateFactoryMemoryWriteApproval({ ...input, admissionResult: contradictionAdmission }).decision, 'request_memory_changes') // 17
assert.equal(approved.canWriteMemoryRuntime, false) // 18
assert.equal(approved.canCreateCodexTask, false) // 19
assert.equal(approved.canExecuteCodex, false) // 20
assert.equal(approved.canCreateProject, false) // 21
assert.equal(approved.canCreateRepository, false) // 22
assert.equal(approved.canDeploy, false) // 23
assert.ok(['write_memory_runtime', 'create_codex_task', 'execute_codex'].every((action) => approved.approvalReceipt.notAuthorizedActions.includes(action))) // 24
assert.equal(approved.approvedMemoryEnvelope.memoryPersistenceStatus === 'not_persisted' && approved.canWriteMemoryRuntime === false, true) // 25
assert.ok(approved.approvalReceipt.notAuthorizedActions.includes('create_embeddings')) // 26
assert.equal(parseFactoryMemoryWriteApprovalResult(serializeFactoryMemoryWriteApprovalResult(approved)).approvalId, approved.approvalId) // 27
const summaryText = JSON.stringify(summarizeFactoryMemoryWriteApprovalResult(approved)); assert.equal(summaryText.includes('recordDrafts') || summaryText.includes('canonicalFacts'), false) // 28
assert.ok(/Memory Persistence Gate/iu.test(approved.recommendedNextStep) && !/execute Codex directly/iu.test(approved.recommendedNextStep)); assert.equal(validateFactoryMemoryWriteApprovalInput(input).ok, true); assert.equal(validateFactoryMemoryWriteApprovalResult(approved).ok, true) // 29

console.log(JSON.stringify({ ok: true, checks: 29, approvalKind: approved.approvalKind, decision: approved.decision, status: approved.status, approvedRecords: approved.approvedRecordDrafts.length, persistenceStatus: approved.approvedMemoryEnvelope.memoryPersistenceStatus, codexTaskStatus: approved.approvedMemoryEnvelope.codexTaskStatus, canWriteMemoryRuntime: approved.canWriteMemoryRuntime }, null, 2))
