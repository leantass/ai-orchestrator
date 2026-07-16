import assert from 'node:assert/strict'
import { createFactoryBriefDraftV1 } from '../src/factory/brief-draft/index.ts'
import { evaluateFactoryProjectContractApproval } from '../src/factory/project-contract-approval/index.ts'
import { createFactoryProjectContractCandidateV1 } from '../src/factory/project-contract-candidate/index.ts'
import { evaluateFactoryProjectContractCompatibility } from '../src/factory/project-contract-compatibility/index.ts'
import { canonicalizeFactoryProjectContractForPersistence, createFactoryProjectContractPersistencePlan, parseFactoryProjectContractPersistenceResult, serializeFactoryProjectContractPersistenceResult, stableStringifyFactoryContractPayload, summarizeFactoryProjectContractPersistenceResult, validateFactoryProjectContractPersistenceInput, validateFactoryProjectContractPersistenceResult } from '../src/factory/project-contract-persistence/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const signal = { opportunityId: 'opportunity-1', title: 'Workflow assistant', problem: 'Teams repeat costly work.', audience: 'Small teams', proposedSolution: 'Independent workflow app.', monetizationHypothesis: 'Subscription.', evidenceSummary: { radarEvidenceSufficient: true, hermesReportPresent: true, hermesReportStatus: 'completed', evidenceItems: 4, distinctSources: 3, confidence: 0.9, requiredCoverage: ['demand'], satisfiedCoverage: ['demand'], missingCoverage: [], contradictions: 0 }, risks: [], assumptions: [], openQuestions: [], requiredAcceptanceCriteriaDraft: ['Complete core workflow.', 'Remain independent from JEFE.'], nextStep: 'draft_factory_brief' }
const draft = createFactoryBriefDraftV1({ signal, decisionId: 'decision-1', createdAt: at, createdBy: 'JEFE', sourceContext: { radarScore: 82, hermesConfidence: 0.9, evidenceRefs: ['e1'] } })
const candidate = createFactoryProjectContractCandidateV1({ draft, createdAt: at, createdBy: 'JEFE', humanReviewRef: 'human-review-1', repositoryOwner: 'factory-owner' })
const compatibilityResult = evaluateFactoryProjectContractCompatibility({ candidate, createdAt: at, checkedBy: 'JEFE', humanApprovalRef: 'human-review-1' })
const approvalResult = evaluateFactoryProjectContractApproval({ compatibilityResult, createdAt: at, reviewedBy: 'Lean', reviewerRole: 'human_reviewer', humanApprovalRef: 'contract-approval-1' })
const input = { approvalResult, createdAt: at, plannedBy: 'JEFE' }
const result = createFactoryProjectContractPersistencePlan(input)
assert.equal(result.status, 'ready_for_runtime_persistence')
assert.ok(result.canonicalPayload)
assert.ok(result.fingerprint)
assert.ok(result.idempotencyKey)
const repeated = createFactoryProjectContractPersistencePlan(input); assert.equal(repeated.fingerprint.value, result.fingerprint.value); assert.equal(repeated.idempotencyKey.value, result.idempotencyKey.value)
assert.equal(stableStringifyFactoryContractPayload({ z: 1, a: 2 }), '{"a":2,"z":1}')
assert.equal(canonicalizeFactoryProjectContractForPersistence({ ...result.canonicalPayload.contract, updatedAt: undefined }).canonicalJson.includes('updatedAt'), false)
assert.equal(/^(?:[a-z]:[\\/]|[\\/])/iu.test(result.target.targetPath), false)
const traversal = createFactoryProjectContractPersistencePlan({ ...input, persistenceRootSuggestion: '../escape' }); assert.equal(traversal.status, 'blocked')
const absolute = createFactoryProjectContractPersistencePlan({ ...input, persistenceRootSuggestion: 'C:\\contracts' }); assert.equal(absolute.status, 'blocked')
assert.equal(result.atomicWritePlan.notExecuted, true)
assert.equal(result.rollbackPlan.notExecuted, true)
const noApproval = structuredClone(input); delete noApproval.approvalResult; assert.equal(validateFactoryProjectContractPersistenceInput(noApproval).ok, false)
const noEnvelope = structuredClone(approvalResult); delete noEnvelope.approvedContractEnvelope; assert.equal(createFactoryProjectContractPersistencePlan({ ...input, approvalResult: noEnvelope }).status, 'blocked')
const invalid = structuredClone(approvalResult); invalid.approvedContractEnvelope.validation.ok = false; assert.equal(createFactoryProjectContractPersistencePlan({ ...input, approvalResult: invalid }).status, 'blocked')
const persisted = structuredClone(approvalResult); persisted.approvedContractEnvelope.persistenceStatus = 'persisted'; assert.equal(createFactoryProjectContractPersistencePlan({ ...input, approvalResult: persisted }).status, 'blocked')
const codex = structuredClone(approvalResult); codex.approvedContractEnvelope.codexStatus = 'allowed'; assert.equal(createFactoryProjectContractPersistencePlan({ ...input, approvalResult: codex }).status, 'blocked')
const runtime = structuredClone(approvalResult); runtime.approvedContractEnvelope.runtimeStatus = 'executable'; assert.equal(createFactoryProjectContractPersistencePlan({ ...input, approvalResult: runtime }).status, 'blocked')
const deploy = structuredClone(approvalResult); deploy.approvedContractEnvelope.deployStatus = 'allowed'; assert.equal(createFactoryProjectContractPersistencePlan({ ...input, approvalResult: deploy }).status, 'blocked')
assert.equal(result.canExecuteCodex, false)
assert.equal(result.canCreateProject, false)
assert.equal(result.canCreateRepository, false)
assert.equal(result.canDeploy, false)
assert.equal(result.filesystemWritePerformed, false)
const parsed = parseFactoryProjectContractPersistenceResult(serializeFactoryProjectContractPersistenceResult(result)); assert.equal(validateFactoryProjectContractPersistenceResult(parsed).ok, true)
const summary = summarizeFactoryProjectContractPersistenceResult(result); assert.equal('canonicalPayload' in summary, false); assert.equal(JSON.stringify(summary).includes('environmentVariables'), false)
assert.ok(/runtime persistence adapter/iu.test(result.recommendedNextStep)); assert.equal(/execute codex directly/iu.test(result.recommendedNextStep), false)

console.log(JSON.stringify({ ok: true, checks: 28, persistenceKind: result.persistenceKind, status: result.status, fingerprint: result.fingerprint.value, idempotencyKey: result.idempotencyKey.value, targetPath: result.target.targetPath, filesystemWritePerformed: result.filesystemWritePerformed }, null, 2))
