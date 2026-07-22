import assert from 'node:assert/strict'
import { createFactoryMemoryReadAdmissionPlan, parseFactoryMemoryReadAdmissionResult, serializeFactoryMemoryReadAdmissionResult, summarizeFactoryMemoryReadAdmissionResult, validateFactoryMemoryReadAdmissionResult, validateFactoryMemoryReadCandidateDraft } from '../src/factory/memory-read-admission/index.ts'

const at = '2026-07-18T12:00:00.000Z'
const entry = { registryEntryId: 'memory-registry-entry:read-1', memoryRecordId: 'memory-record-read-1', memoryRecordKind: 'factory_project_contract', memoryRecordVersion: '1.0', namespace: 'factory/projects/read-project/contracts', projectNamespace: 'factory/projects/read-project', logicalTarget: 'factory-memory/projects/read-project/records/factory-project-contract/memory-record-read-1.v1.json', metadataLogicalTarget: 'factory-memory/projects/read-project/records/factory-project-contract/memory-record-read-1.v1.meta.json', expectedFingerprint: 'abcdef12', recalculatedFingerprint: 'abcdef12', expectedIdempotencyKey: 'factory-memory-12345678', recalculatedIdempotencyKey: 'factory-memory-12345678', recordExists: true, metadataExists: true, recordMatchesMetadata: true, registryMatchesMetadata: true, registryMatchesRecord: true, fingerprintMatches: true, idempotencyMatches: true, projectIndexContainsRecord: true, flagsSafe: true, pathContained: true, status: 'clean', findings: [], canUseForMemoryRead: true, canUseForCodexTask: false, canCreateEmbeddings: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false }
const report = { integrityKind: 'factory-memory-registry-integrity', integrityVersion: '1.0', generatedAt: at, checkedBy: 'JEFE', storageRoot: '.codex-temp/read', status: 'clean', entries: [entry], projectIndexes: [], registryIndex: { logicalPath: 'factory-memory-registry/index.v1.json', exists: true, parseable: true, entriesExpected: 1, entriesFound: 1, stale: false, status: 'clean', findings: [] }, findings: [], blockers: [], warnings: [], summary: { totalEntries: 1, statusCounts: { clean: 1 }, severityCounts: {}, criticalFindings: 0, cleanEntries: 1, blockedEntries: 0, canUseForMemoryRead: 1, canUseForCodexTask: 0, recommendedNextStep: 'read admission' }, canUseForCodexTask: false, canCreateEmbeddings: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, recommendedNextStep: 'read admission' }
const input = { memoryRegistryIntegrityReport: report, requestedAt: at, requestedBy: 'JEFE', readPurpose: 'jefe_review_context', projectNamespace: entry.projectNamespace }
const result = createFactoryMemoryReadAdmissionPlan(input); const candidate = result.candidates[0]
assert.equal(result.decision, 'approve_memory_read_candidates') // 1
assert.equal(validateFactoryMemoryReadCandidateDraft(candidate).ok, true) // 2
assert.equal(validateFactoryMemoryReadAdmissionResult(result).ok, true) // 3
assert.ok(candidate.minimalFacts.memoryRecordId) // 4
assert.equal(candidate.containsFullMemoryRecord, false) // 5
assert.equal(candidate.containsCanonicalPayload, false) // 6
assert.equal(candidate.containsRawEvidence, false) // 7
assert.equal(candidate.containsSecrets, false) // 8
assert.equal(candidate.canReadMemoryRuntime, false) // 9
assert.equal(candidate.canAssembleContext, false) // 10
assert.equal(candidate.canCreateCodexTask, false) // 11
assert.equal(candidate.canExecuteCodex, false) // 12
assert.equal(candidate.canCreateEmbeddings, false) // 13
assert.equal(candidate.canCreateProject, false) // 14
assert.equal(candidate.canCreateRepository, false) // 15
assert.equal(candidate.canDeploy, false) // 16
const critical = createFactoryMemoryReadAdmissionPlan({ ...input, memoryRegistryIntegrityReport: { ...report, entries: [{ ...entry, status: 'blocked', canUseForMemoryRead: false, findings: [{ findingId: 'critical', kind: 'fingerprint_mismatch', severity: 'critical', message: 'tampered' }] }] } }); assert.equal(critical.rejectedEntries.length, 1) // 17
const denied = createFactoryMemoryReadAdmissionPlan({ ...input, memoryRegistryIntegrityReport: { ...report, entries: [{ ...entry, canUseForMemoryRead: false }] } }); assert.equal(denied.blockedEntries.length, 1) // 18
assert.equal(denied.decision, 'reject_memory_read') // 19
const codexReview = createFactoryMemoryReadAdmissionPlan({ ...input, readPurpose: 'codex_task_preparation_candidate' }); assert.equal(codexReview.decision, 'human_review_required') // 20
const codexCandidate = createFactoryMemoryReadAdmissionPlan({ ...input, readPurpose: 'codex_task_preparation_candidate', humanReviewRef: 'human-1' }); assert.equal(codexCandidate.candidates[0].canCreateCodexTask, false) // 21
const namespaceMismatch = createFactoryMemoryReadAdmissionPlan({ ...input, projectNamespace: 'factory/projects/other' }); assert.equal(namespaceMismatch.blockedEntries.length, 1) // 22
const missingFingerprint = createFactoryMemoryReadAdmissionPlan({ ...input, memoryRegistryIntegrityReport: { ...report, entries: [{ ...entry, expectedFingerprint: '' }] } }); assert.equal(missingFingerprint.blockedEntries.length, 1) // 23
const missingIdempotency = createFactoryMemoryReadAdmissionPlan({ ...input, memoryRegistryIntegrityReport: { ...report, entries: [{ ...entry, expectedIdempotencyKey: '' }] } }); assert.equal(missingIdempotency.blockedEntries.length, 1) // 24
const warningReport = { ...report, status: 'warning', entries: [{ ...entry, status: 'warning', findings: [{ findingId: 'warning', kind: 'unknown_warning', severity: 'warning', message: 'review' }] }] }; const warningResult = createFactoryMemoryReadAdmissionPlan({ ...input, memoryRegistryIntegrityReport: warningReport }); assert.equal(warningResult.candidates[0].status, 'warning_candidate') // 25
assert.equal(parseFactoryMemoryReadAdmissionResult(serializeFactoryMemoryReadAdmissionResult(result)).admissionId, result.admissionId) // 26
const summary = summarizeFactoryMemoryReadAdmissionResult(result); assert.equal(JSON.stringify(summary).includes('minimalFacts'), false) // 27
assert.equal(summary.canCreateCodexTask, false) // 28
assert.ok(/Memory Read Runtime Adapter|Memory Context Assembly Gate/u.test(result.recommendedNextStep) && !/execute Codex directly/iu.test(result.recommendedNextStep)) // 29
assert.equal(Object.keys(import.meta).includes('filesystem'), false) // 30
console.log(JSON.stringify({ ok: true, checks: 30, admissionKind: result.admissionKind, decision: result.decision, status: result.status, candidates: result.candidates.length, warningCandidate: warningResult.candidates[0].status, canCreateCodexTask: result.canCreateCodexTask }, null, 2))
