import assert from 'node:assert/strict'
import { createFactoryBriefDraftV1 } from '../src/factory/brief-draft/index.ts'
import { evaluateFactoryProjectContractApproval, parseFactoryProjectContractApprovalResult, serializeFactoryProjectContractApprovalResult, summarizeFactoryProjectContractApprovalResult, validateFactoryProjectContractApprovalInput, validateFactoryProjectContractApprovalResult } from '../src/factory/project-contract-approval/index.ts'
import { evaluateFactoryProjectContractCompatibility } from '../src/factory/project-contract-compatibility/index.ts'
import { createFactoryProjectContractCandidateV1 } from '../src/factory/project-contract-candidate/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const signal = { opportunityId: 'opportunity-1', title: 'Workflow assistant', problem: 'Teams repeat costly work.', audience: 'Small teams', proposedSolution: 'Independent workflow app.', monetizationHypothesis: 'Subscription.', evidenceSummary: { radarEvidenceSufficient: true, hermesReportPresent: true, hermesReportStatus: 'completed', evidenceItems: 4, distinctSources: 3, confidence: 0.9, requiredCoverage: ['demand'], satisfiedCoverage: ['demand'], missingCoverage: [], contradictions: 0 }, risks: [], assumptions: [], openQuestions: [], requiredAcceptanceCriteriaDraft: ['Complete core workflow.', 'Remain independent from JEFE.'], nextStep: 'draft_factory_brief' }
const draft = createFactoryBriefDraftV1({ signal, decisionId: 'decision-1', createdAt: at, createdBy: 'JEFE', sourceContext: { radarScore: 82, hermesConfidence: 0.9, evidenceRefs: ['e1'] } })
const candidate = createFactoryProjectContractCandidateV1({ draft, createdAt: at, createdBy: 'JEFE', humanReviewRef: 'human-review-1', repositoryOwner: 'factory-owner' })
const compatibilityResult = evaluateFactoryProjectContractCompatibility({ candidate, createdAt: at, checkedBy: 'JEFE', humanApprovalRef: 'human-review-1' })
const input = { compatibilityResult, createdAt: at, reviewedBy: 'Lean', reviewerRole: 'human_reviewer', humanApprovalRef: 'contract-approval-1' }
const result = evaluateFactoryProjectContractApproval(input)
assert.equal(result.decision, 'approve_contract_for_persistence_candidate')
assert.ok(result.approvalReceipt)
assert.ok(result.approvedContractEnvelope)
assert.equal(result.approvedContractEnvelope.persistenceStatus, 'not_persisted')
assert.equal(result.approvedContractEnvelope.codexStatus, 'not_allowed')
assert.equal(result.approvedContractEnvelope.runtimeStatus, 'not_executable')
const noDate = structuredClone(input); delete noDate.createdAt; assert.equal(validateFactoryProjectContractApprovalInput(noDate).ok, false)
const noReviewer = structuredClone(input); delete noReviewer.reviewedBy; assert.equal(validateFactoryProjectContractApprovalInput(noReviewer).ok, false)
const noApproval = evaluateFactoryProjectContractApproval({ ...input, humanApprovalRef: undefined }); assert.equal(noApproval.decision, 'human_review_required')
const incompatible = structuredClone(compatibilityResult); incompatible.status = 'blocked'; incompatible.canCreateFactoryProjectContract = false; incompatible.blockers = [{ blockerId: 'x', category: 'compatibility', message: 'blocked' }]; assert.equal(evaluateFactoryProjectContractApproval({ ...input, compatibilityResult: incompatible }).status, 'blocked')
const noDraft = structuredClone(compatibilityResult); delete noDraft.contractDraft; assert.equal(evaluateFactoryProjectContractApproval({ ...input, compatibilityResult: noDraft }).status, 'blocked')
const badValidation = structuredClone(compatibilityResult); badValidation.contractValidation = { ok: false, errors: ['invalid'], warnings: [] }; assert.equal(evaluateFactoryProjectContractApproval({ ...input, compatibilityResult: badValidation }).decision, 'request_contract_changes')
const priorBlocker = structuredClone(compatibilityResult); priorBlocker.blockers = [{ blockerId: 'prior', category: 'evidence', message: 'Missing evidence.' }]; assert.equal(evaluateFactoryProjectContractApproval({ ...input, compatibilityResult: priorBlocker }).status, 'blocked')
const criticalWarning = structuredClone(compatibilityResult); criticalWarning.warnings.push({ warningId: 'critical', category: 'security', message: 'Critical credential exposure.' }); assert.equal(evaluateFactoryProjectContractApproval({ ...input, compatibilityResult: criticalWarning }).decision, 'request_contract_changes')
assert.equal(result.canExecuteCodex, false)
assert.equal(result.canCreateProject, false)
assert.equal(result.canCreateRepository, false)
assert.equal(result.canDeploy, false)
for (const action of ['execute_codex', 'create_project', 'create_repository', 'deploy']) assert.ok(result.approvalReceipt.notAuthorizedActions.includes(action))
assert.equal(result.canPersistFactoryProjectContract, false)
assert.equal(result.canCreateProject, false)
assert.equal(result.canCreateRepository, false)
const parsed = parseFactoryProjectContractApprovalResult(serializeFactoryProjectContractApprovalResult(result)); assert.equal(validateFactoryProjectContractApprovalResult(parsed).ok, true)
const summary = summarizeFactoryProjectContractApprovalResult(result); assert.equal('contractDraft' in summary, false)
assert.ok(/persistence|review/iu.test(result.recommendedNextStep))

console.log(JSON.stringify({ ok: true, checks: 25, approvalKind: result.approvalKind, decision: result.decision, status: result.status, receiptPresent: Boolean(result.approvalReceipt), envelopePresent: Boolean(result.approvedContractEnvelope), persistenceStatus: result.approvedContractEnvelope.persistenceStatus, codexStatus: result.approvedContractEnvelope.codexStatus }, null, 2))
