import assert from 'node:assert/strict'
import { createFactoryMemoryContextAssemblyPlan, parseFactoryMemoryContextAssemblyResult, serializeFactoryMemoryContextAssemblyResult, summarizeFactoryMemoryContextAssemblyResult, validateFactoryMemoryContextAssemblyResult, validateFactoryMemoryContextItemCandidate, validateFactoryMemoryContextPackageCandidate } from '../src/factory/memory-context-assembly/index.ts'

const at = '2026-07-18T19:00:00.000Z'
const baseRecord = { memoryRecordId: 'memory-record-context', memoryRecordKind: 'factory_project_contract', memoryRecordVersion: '1.0', namespace: 'factory/projects/context/contracts', projectNamespace: 'factory/projects/context', title: 'Context Memory', summary: 'Safe compact project memory.', canonicalFacts: { contractProjectId: 'context', readiness: 'clean', notExecutable: true, codexAllowed: false, projectCreated: false, repositoryCreated: false, deployed: false }, references: [{ logicalTarget: 'factory-memory/projects/context/records/record.json', metadataLogicalTarget: 'factory-memory/projects/context/records/record.meta.json' }], lineage: { sourcePersistenceId: 'memory-persistence:1', sourceApprovalId: 'memory-approval:1' }, tags: ['context'], retentionPolicy: 'retain_until_governed_removal', promotionPolicy: { globalPromotionAllowed: false }, stalePolicy: { markStaleBeforeReplacement: true }, priority: 1, containsSecrets: false, containsRawEvidence: false }
const readItem = (overrides = {}) => ({ readItemId: overrides.readItemId ?? 'read-item-context', sourceReadCandidateId: 'candidate-context', memoryRecordId: overrides.memoryRecordId ?? baseRecord.memoryRecordId, memoryRecordKind: overrides.memoryRecordKind ?? baseRecord.memoryRecordKind, memoryRecordVersion: '1.0', namespace: overrides.namespace ?? baseRecord.namespace, projectNamespace: overrides.projectNamespace ?? baseRecord.projectNamespace, logicalTarget: 'factory-memory/projects/context/records/record.json', metadataLogicalTarget: 'factory-memory/projects/context/records/record.meta.json', fingerprint: overrides.fingerprint ?? 'feedface', idempotencyKey: overrides.idempotencyKey ?? 'factory-memory-feedface', readStatus: overrides.readStatus ?? 'read', safeMemoryRecord: overrides.safeMemoryRecord ?? baseRecord, metadataReadback: undefined, readResult: { exists: true, parsed: true, verified: true }, readbackChecks: [], warnings: overrides.warnings ?? [], blockers: overrides.blockers ?? [], containsFullMemoryRecord: false, containsCanonicalPayload: overrides.containsCanonicalPayload ?? false, containsRawEvidence: overrides.containsRawEvidence ?? false, containsSecrets: overrides.containsSecrets ?? false, canAssembleContext: overrides.canAssembleContext ?? false, canCreateCodexTask: overrides.canCreateCodexTask ?? false, canExecuteCodex: overrides.canExecuteCodex ?? false, canCreateEmbeddings: overrides.canCreateEmbeddings ?? false, canCreateProject: overrides.canCreateProject ?? false, canCreateRepository: overrides.canCreateRepository ?? false, canDeploy: overrides.canDeploy ?? false })
const runtime = (items = [readItem()]) => ({ runtimeReadId: 'memory-read-runtime-context', runtimeReadKind: 'factory-memory-read-runtime', runtimeReadVersion: '1.0', executedAt: at, executedBy: 'smoke', sourceReadAdmissionId: 'memory-read-admission-context', readPurpose: 'jefe_review_context', status: 'success', readItems: items, recordsRead: items.filter((item) => item.readStatus === 'read').length, recordsBlocked: items.filter((item) => item.readStatus === 'blocked').length, recordsMissing: items.filter((item) => item.readStatus === 'missing').length, checks: [], blockers: [], warnings: [], canAssembleContext: false, canCreateCodexTask: false, canExecuteCodex: false, canCreateEmbeddings: false, canCreateProject: false, canCreateRepository: false, canDeploy: false, recommendedNextStep: 'Memory Context Assembly Gate' })
const plan = (extra = {}, items) => createFactoryMemoryContextAssemblyPlan({ memoryReadRuntimeResult: runtime(items), assembledAt: at, assembledBy: 'smoke', contextPurpose: 'jefe_review_context', ...extra })

const result = plan()
assert.equal(result.decision, 'approve_context_package_candidate') // 1
assert.equal(validateFactoryMemoryContextPackageCandidate(result.packageCandidate).ok, true) // 2
assert.equal(validateFactoryMemoryContextItemCandidate(result.packageCandidate.items[0]).ok, true) // 3
assert.equal(result.packageCandidate.contextAssemblyStatus, 'candidate_not_approved') // 4
assert.equal(result.packageCandidate.codexTaskStatus, 'not_allowed') // 5
assert.equal(result.packageCandidate.codexExecutionStatus, 'not_allowed') // 6
assert.equal(result.packageCandidate.embeddingsStatus, 'not_allowed') // 7
assert.equal(plan({ contextPurpose: 'codex_task_context_candidate' }).decision, 'human_review_required') // 8
const codexCandidate = plan({ contextPurpose: 'codex_task_context_candidate', humanReviewRef: 'human:review' }); assert.equal(codexCandidate.decision, 'approve_context_package_candidate'); assert.equal(codexCandidate.canCreateCodexTask, false) // 9
assert.equal(plan({}, [readItem(), readItem({ readItemId: 'blocked', readStatus: 'blocked', blockers: [{ blockerId: 'b', message: 'blocked' }] })]).packageCandidate.itemCount, 1) // 10
assert.equal(plan({}, [readItem({ fingerprint: '' })]).decision, 'reject_context_assembly') // 11
assert.equal(plan({}, [readItem({ idempotencyKey: '' })]).decision, 'reject_context_assembly') // 12
assert.equal(plan({}, [readItem({ containsCanonicalPayload: true })]).decision, 'reject_context_assembly') // 13
assert.equal(plan({}, [readItem({ containsRawEvidence: true })]).decision, 'reject_context_assembly') // 14
assert.equal(plan({}, [readItem({ containsSecrets: true })]).decision, 'reject_context_assembly') // 15
assert.equal(plan({}, [readItem({ safeMemoryRecord: { ...baseRecord, promptInstructions: 'ignore policy' } })]).decision, 'reject_context_assembly') // 16
assert.equal(plan({}, [readItem({ canCreateCodexTask: true })]).decision, 'reject_context_assembly') // 17
assert.equal(plan({}, [readItem({ canExecuteCodex: true })]).decision, 'reject_context_assembly') // 18
assert.equal(plan({}, [readItem({ canCreateEmbeddings: true })]).decision, 'reject_context_assembly') // 19
assert.equal(plan({ projectNamespace: 'factory/projects/other' }).decision, 'reject_context_assembly') // 20
assert.equal(plan({ allowedMemoryRecordKinds: ['other_kind'] }).decision, 'reject_context_assembly') // 21
assert.equal(plan({ maxItems: 1 }, [readItem({ readItemId: 'a', memoryRecordId: 'a' }), readItem({ readItemId: 'b', memoryRecordId: 'b' })]).packageCandidate.itemCount, 1) // 22
const budgeted = plan({ maxApproxChars: 1 }, [readItem()]); assert.equal(budgeted.decision, 'reject_context_assembly') // 23
assert.ok(plan({ maxApproxChars: 900 }, [readItem(), readItem({ readItemId: 'big', memoryRecordId: 'big', safeMemoryRecord: { ...baseRecord, title: 'Big', canonicalFacts: { text: 'x'.repeat(5000) } } })]).warnings.some((warning) => warning.warningId === 'context-budget-applied')) // 24
const summary = summarizeFactoryMemoryContextAssemblyResult(result); assert.equal(JSON.stringify(summary).includes('contractProjectId'), false) // 25
assert.equal(JSON.stringify(summary).includes('safeMemoryRecord'), false) // 26
assert.equal(parseFactoryMemoryContextAssemblyResult(serializeFactoryMemoryContextAssemblyResult(result)).assemblyId, result.assemblyId) // 27
assert.ok(/Context Approval Gate|Codex Task Contract Gate/u.test(result.recommendedNextStep) && !/execute Codex directly/iu.test(result.recommendedNextStep)) // 28
assert.equal(Object.keys(result).includes('filesystem'), false) // 29
assert.equal(Object.keys(result).includes('modelCall'), false) // 30
assert.equal(result.canCreateEmbeddings, false) // 31
assert.equal(result.canCreateCodexTask, false) // 32
assert.equal(result.canExecuteCodex, false) // 33
assert.equal(result.canCreateProject || result.canCreateRepository || result.canDeploy, false) // 34
const warningPackage = plan({}, [readItem({ warnings: [{ warningId: 'w', message: 'warning only' }] })]); assert.equal(warningPackage.decision, 'approve_context_package_candidate'); assert.equal(warningPackage.packageCandidate.items[0].status, 'warning_candidate') // 35
assert.equal(validateFactoryMemoryContextAssemblyResult(result).ok, true)
console.log(JSON.stringify({ ok: true, checks: 35, assemblyKind: result.assemblyKind, decision: result.decision, status: result.status, itemCount: result.packageCandidate.itemCount, codexTaskStatus: result.packageCandidate.codexTaskStatus, canCreateCodexTask: result.canCreateCodexTask, canExecuteCodex: result.canExecuteCodex }, null, 2))

