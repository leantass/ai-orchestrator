import assert from 'node:assert/strict'
import { createFactoryMemoryAdmissionPlan } from '../src/factory/memory-admission/index.ts'
import { createFactoryMemoryPersistencePlan, isValidFactoryMemoryLogicalTarget, parseFactoryMemoryPersistenceResult, serializeFactoryMemoryPersistenceResult, summarizeFactoryMemoryPersistenceResult, validateFactoryMemoryPersistenceInput, validateFactoryMemoryPersistenceResult, validateFactoryMemoryRecordPersistencePlan } from '../src/factory/memory-persistence/index.ts'
import { evaluateFactoryMemoryWriteApproval } from '../src/factory/memory-write-approval/index.ts'
const at = '2026-07-17T16:00:00.000Z'
const entry = { registryEntryId: 'registry-persistence', contractProjectId: 'memory-project', projectSlug: 'memory-project', targetPath: 'factory-project-contracts/memory-project/factory-project-contract.v1.json', metadataPath: 'factory-project-contracts/memory-project/factory-project-contract.v1.meta.json', expectedFingerprint: 'aaaabbbb', recalculatedFingerprint: 'aaaabbbb', expectedIdempotencyKey: 'factory-contract-ccccdddd', recalculatedIdempotencyKey: 'factory-contract-ccccdddd', contractExists: true, metadataExists: true, metadataMatchesContract: true, fingerprintMatches: true, idempotencyMatches: true, flagsSafe: true, pathContained: true, status: 'clean', checks: [], findings: [], canUseForMemory: true, canUseForCodexTask: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false }
const integrity = { integrityKind: 'factory-contract-registry-integrity', integrityVersion: '1.0', generatedAt: at, checkedBy: 'JEFE', storageRoot: '.codex-temp/smoke', registryIndexRef: 'registry-index:persistence', status: 'clean', entries: [entry], summary: { totalEntries: 1, statusCounts: { clean: 1 }, severityCounts: {}, criticalFindings: 0, cleanEntries: 1, blockedEntries: 0, canUseForMemory: 1, canUseForCodexTask: 0, recommendedNextStep: 'MEMORIA review' }, findings: [], blockers: [], warnings: [], recommendedNextStep: 'MEMORIA review' }
const admission = createFactoryMemoryAdmissionPlan({ integrityReport: integrity, createdAt: at, createdBy: 'JEFE' }); const approval = evaluateFactoryMemoryWriteApproval({ admissionResult: admission, createdAt: at, reviewedBy: 'Lean', humanApprovalRef: 'memory-human-approval' }); const input = { memoryWriteApprovalResult: approval, createdAt: at, plannedBy: 'JEFE' }; const plan = createFactoryMemoryPersistencePlan(input); const again = createFactoryMemoryPersistencePlan(input); const recordPlan = plan.recordPlans[0]
assert.equal(plan.decision, 'approve_memory_persistence_plan') // 1
assert.equal(plan.status, 'ready_for_memory_runtime_persistence') // 2
assert.ok(plan.manifest) // 3
assert.equal(plan.recordPlans.length, 1) // 4
assert.ok(recordPlan.canonicalPayload) // 5
assert.ok(recordPlan.fingerprint.value) // 6
assert.ok(recordPlan.idempotencyKey) // 7
assert.equal(recordPlan.fingerprint.value, again.recordPlans[0].fingerprint.value) // 8
assert.equal(recordPlan.idempotencyKey, again.recordPlans[0].idempotencyKey) // 9
assert.ok(recordPlan.target.logicalTarget.startsWith('factory-memory/projects/')) // 10
assert.equal(isValidFactoryMemoryLogicalTarget('/factory-memory/projects/x/a.json'), false) // 11
assert.equal(isValidFactoryMemoryLogicalTarget('factory-memory/projects/x/../a.json'), false) // 12
assert.equal(recordPlan.atomicWritePlan.notExecuted, true) // 13
assert.equal(recordPlan.rollbackPlan.notExecuted, true) // 14
assert.equal(recordPlan.atomicWritePlan.memoryWritePerformed, false) // 15
assert.equal(plan.canWriteMemoryRuntime, false) // 16
assert.equal(plan.canCreateEmbeddings, false) // 17
assert.equal(plan.canCreateCodexTask, false) // 18
assert.equal(plan.canExecuteCodex, false) // 19
assert.equal(plan.canCreateProject, false) // 20
assert.equal(plan.canCreateRepository, false) // 21
assert.equal(plan.canDeploy, false) // 22
const notApproved = structuredClone(approval); notApproved.status = 'awaiting_human_review'; notApproved.decision = 'human_review_required'; assert.notEqual(createFactoryMemoryPersistencePlan({ ...input, memoryWriteApprovalResult: notApproved }).status, 'ready_for_memory_runtime_persistence') // 23
const noEnvelope = structuredClone(approval); delete noEnvelope.approvedMemoryEnvelope; assert.equal(createFactoryMemoryPersistencePlan({ ...input, memoryWriteApprovalResult: noEnvelope }).status, 'blocked') // 24
const unsafe = (patch) => { const changed = structuredClone(approval); changed.approvedMemoryEnvelope.recordDrafts[0] = { ...changed.approvedMemoryEnvelope.recordDrafts[0], ...patch }; return createFactoryMemoryPersistencePlan({ ...input, memoryWriteApprovalResult: changed }).status }
assert.equal(unsafe({ containsSecrets: true }), 'blocked') // 25
assert.equal(unsafe({ containsRawEvidence: true }), 'blocked') // 26
assert.equal(unsafe({ globalPromotionAllowed: true }), 'blocked') // 27
assert.equal(unsafe({ codexTaskAllowed: true }), 'blocked') // 28
assert.equal(unsafe({ deployAllowed: true }), 'blocked') // 29
assert.equal(parseFactoryMemoryPersistenceResult(serializeFactoryMemoryPersistenceResult(plan)).persistenceId, plan.persistenceId) // 30
const summaryText = JSON.stringify(summarizeFactoryMemoryPersistenceResult(plan)); assert.equal(summaryText.includes('canonicalPayload') || summaryText.includes('recordDrafts'), false) // 31
assert.ok(/Memory Runtime Adapter/iu.test(plan.recommendedNextStep) && !/execute Codex directly/iu.test(plan.recommendedNextStep)) // 32
assert.equal(plan.canWriteMemoryRuntime, false); assert.equal(validateFactoryMemoryPersistenceInput(input).ok, true); assert.equal(validateFactoryMemoryRecordPersistencePlan(recordPlan).ok, true); assert.equal(validateFactoryMemoryPersistenceResult(plan).ok, true) // 33
console.log(JSON.stringify({ ok: true, checks: 33, persistenceKind: plan.persistenceKind, status: plan.status, records: plan.recordPlans.length, fingerprint: recordPlan.fingerprint.value, idempotencyKey: recordPlan.idempotencyKey, target: recordPlan.target.logicalTarget, memoryWritePerformed: recordPlan.atomicWritePlan.memoryWritePerformed, canCreateEmbeddings: plan.canCreateEmbeddings }, null, 2))
