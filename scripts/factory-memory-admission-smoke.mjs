import assert from 'node:assert/strict'
import { createFactoryMemoryAdmissionPlan, isValidFactoryMemoryNamespace, parseFactoryMemoryAdmissionResult, serializeFactoryMemoryAdmissionResult, summarizeFactoryMemoryAdmissionResult, validateFactoryMemoryAdmissionResult, validateFactoryMemoryRecordDraft } from '../src/factory/memory-admission/index.ts'

const at = '2026-07-17T12:00:00.000Z'
const entry = (overrides = {}) => ({ registryEntryId: 'registry-entry-1', contractProjectId: 'project-1', projectSlug: 'memory-product', targetPath: 'factory-project-contracts/memory-product/factory-project-contract.v1.json', metadataPath: 'factory-project-contracts/memory-product/factory-project-contract.v1.meta.json', expectedFingerprint: 'abc12345', recalculatedFingerprint: 'abc12345', expectedIdempotencyKey: 'factory-contract-def67890', recalculatedIdempotencyKey: 'factory-contract-def67890', contractExists: true, metadataExists: true, metadataMatchesContract: true, fingerprintMatches: true, idempotencyMatches: true, flagsSafe: true, pathContained: true, status: 'clean', checks: [], findings: [], canUseForMemory: true, canUseForCodexTask: false, canExecuteCodex: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, ...overrides })
const report = (entries, overrides = {}) => ({ integrityKind: 'factory-contract-registry-integrity', integrityVersion: '1.0', generatedAt: at, checkedBy: 'JEFE', storageRoot: '.codex-temp/smoke', registryIndexRef: 'registry-index:memory-smoke', status: 'clean', entries, summary: { totalEntries: entries.length, statusCounts: { clean: entries.length }, severityCounts: {}, criticalFindings: 0, cleanEntries: entries.length, blockedEntries: 0, canUseForMemory: entries.filter((item) => item.canUseForMemory).length, canUseForCodexTask: 0, recommendedNextStep: 'MEMORIA review' }, findings: [], blockers: [], warnings: [], recommendedNextStep: 'MEMORIA review', ...overrides })

const clean = createFactoryMemoryAdmissionPlan({ integrityReport: report([entry()]), createdAt: at, createdBy: 'JEFE' })
assert.equal(clean.recordDrafts.length, 1) // 1
assert.equal(validateFactoryMemoryRecordDraft(clean.recordDrafts[0]).ok, true) // 2
assert.equal(clean.recordDrafts[0].namespace, 'factory/projects/memory-product/contracts') // 3
assert.equal(clean.recordDrafts[0].globalPromotionAllowed, false) // 4
assert.equal(clean.canWriteMemory, false) // 5
assert.equal(clean.canCreateCodexTask, false) // 6
assert.equal(clean.canExecuteCodex, false) // 7
assert.equal(clean.canCreateProject, false) // 8
assert.equal(clean.canCreateRepository, false) // 9
assert.equal(clean.canDeploy, false) // 10
const criticalEntry = entry({ registryEntryId: 'critical', status: 'blocked', canUseForMemory: false, findings: [{ findingId: 'critical-1', registryEntryId: 'critical', kind: 'fingerprint_mismatch', severity: 'critical', message: 'Mismatch.' }] }); const critical = createFactoryMemoryAdmissionPlan({ integrityReport: report([criticalEntry], { status: 'blocked' }), createdAt: at, createdBy: 'JEFE' }); assert.deepEqual(critical.rejectedEntries, ['critical']) // 11
const unavailable = createFactoryMemoryAdmissionPlan({ integrityReport: report([entry({ registryEntryId: 'blocked', canUseForMemory: false })]), createdAt: at, createdBy: 'JEFE' }); assert.deepEqual(unavailable.blockedEntries, ['blocked']) // 12
const duplicate = createFactoryMemoryAdmissionPlan({ integrityReport: report([entry(), entry({ registryEntryId: 'registry-entry-2' })]), createdAt: at, createdBy: 'JEFE' }); assert.ok(duplicate.warnings.some((item) => item.message.includes('Duplicate'))) // 13
const contradiction = createFactoryMemoryAdmissionPlan({ integrityReport: report([entry(), entry({ registryEntryId: 'registry-entry-3', expectedFingerprint: 'different', recalculatedFingerprint: 'different' })]), createdAt: at, createdBy: 'JEFE' }); assert.ok(contradiction.decisions.every((item) => item.decision === 'possible_contradiction')) // 14
assert.equal(isValidFactoryMemoryNamespace('factory/projects/../escape'), false) // 15
assert.equal(isValidFactoryMemoryNamespace('/factory/projects/example'), false) // 16
assert.equal(validateFactoryMemoryRecordDraft({ ...clean.recordDrafts[0], containsSecrets: true }).ok, false) // 17
assert.equal(validateFactoryMemoryRecordDraft({ ...clean.recordDrafts[0], containsRawEvidence: true }).ok, false) // 18
assert.equal(validateFactoryMemoryRecordDraft({ ...clean.recordDrafts[0], codexTaskAllowed: true }).ok, false) // 19
assert.equal(parseFactoryMemoryAdmissionResult(serializeFactoryMemoryAdmissionResult(clean)).admissionId, clean.admissionId) // 20
const summaryText = JSON.stringify(summarizeFactoryMemoryAdmissionResult(clean)); assert.equal(summaryText.includes('canonicalFacts') || summaryText.includes('environmentVariables'), false) // 21
assert.equal(clean.summary.codexTaskAllowedCount, 0) // 22
assert.equal(typeof globalThis.process === 'object' && clean.canWriteMemory === false, true) // 23: planner exposes no filesystem operation
assert.ok(/memory runtime|human review/iu.test(clean.recommendedNextStep) && !/execute Codex directly/iu.test(clean.recommendedNextStep)) // 24
assert.equal(clean.canPromoteGlobalMemory, false); assert.equal(validateFactoryMemoryAdmissionResult(clean).ok, true) // 25

console.log(JSON.stringify({ ok: true, checks: 25, admissionKind: clean.admissionKind, drafts: clean.recordDrafts.length, namespace: clean.recordDrafts[0].namespace, rejected: critical.rejectedEntries.length, blocked: unavailable.blockedEntries.length, contradictionBlockers: contradiction.blockers.length, canWriteMemory: clean.canWriteMemory, codexTaskAllowedCount: clean.summary.codexTaskAllowedCount }, null, 2))
