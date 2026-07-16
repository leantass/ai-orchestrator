import assert from 'node:assert/strict'
import { createFactoryBriefDraftV1 } from '../src/factory/brief-draft/index.ts'
import { validateFactoryProjectContractV1 } from '../src/factory/project-contract/index.ts'
import { evaluateFactoryProjectContractCompatibility, parseFactoryProjectContractCompatibilityResult, serializeFactoryProjectContractCompatibilityResult, summarizeFactoryProjectContractCompatibilityResult, validateFactoryProjectContractCompatibilityInput, validateFactoryProjectContractCompatibilityResult } from '../src/factory/project-contract-compatibility/index.ts'
import { createFactoryProjectContractCandidateV1 } from '../src/factory/project-contract-candidate/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const signal = { opportunityId: 'opportunity-1', title: 'Workflow assistant', problem: 'Teams repeat costly work.', audience: 'Small teams', proposedSolution: 'Independent workflow app.', monetizationHypothesis: 'Subscription.', evidenceSummary: { radarEvidenceSufficient: true, hermesReportPresent: true, hermesReportStatus: 'completed', evidenceItems: 4, distinctSources: 3, confidence: 0.9, requiredCoverage: ['demand'], satisfiedCoverage: ['demand'], missingCoverage: [], contradictions: 0 }, risks: [], assumptions: [], openQuestions: [], requiredAcceptanceCriteriaDraft: ['Complete the core workflow.', 'Remain independent from JEFE.'], nextStep: 'draft_factory_brief' }
const draft = createFactoryBriefDraftV1({ signal, decisionId: 'decision-1', createdAt: at, createdBy: 'JEFE', sourceContext: { radarScore: 82, hermesConfidence: 0.9, evidenceRefs: ['e1'] } })
const candidate = createFactoryProjectContractCandidateV1({ draft, createdAt: at, createdBy: 'JEFE', humanReviewRef: 'human-review-1', repositoryOwner: 'factory-owner' })
const input = { candidate, createdAt: at, checkedBy: 'JEFE', humanApprovalRef: 'human-review-1' }
const result = evaluateFactoryProjectContractCompatibility(input)
assert.equal(result.status, 'compatible')
assert.ok(result.contractDraft)
assert.equal(validateFactoryProjectContractV1(result.contractDraft).ok, true)
const noDate = structuredClone(input); delete noDate.createdAt; assert.equal(validateFactoryProjectContractCompatibilityInput(noDate).ok, false)
const noChecker = structuredClone(input); delete noChecker.checkedBy; assert.equal(validateFactoryProjectContractCompatibilityInput(noChecker).ok, false)
const unapprovedCandidate = createFactoryProjectContractCandidateV1({ draft, createdAt: at, createdBy: 'JEFE', repositoryOwner: 'factory-owner' }); const unapproved = evaluateFactoryProjectContractCompatibility({ candidate: unapprovedCandidate, createdAt: at, checkedBy: 'JEFE' }); assert.notEqual(unapproved.status, 'compatible')
const notReadyCandidate = structuredClone(candidate); notReadyCandidate.readiness.status = 'not_ready'; assert.notEqual(evaluateFactoryProjectContractCompatibility({ ...input, candidate: notReadyCandidate }).status, 'compatible')
const noRepo = structuredClone(candidate); noRepo.repository.repositoryRequired = false; assert.notEqual(evaluateFactoryProjectContractCompatibility({ ...input, candidate: noRepo }).status, 'compatible')
const dependent = structuredClone(candidate); dependent.independencePolicy.mustNotDependOnJefeRuntime = false; assert.notEqual(evaluateFactoryProjectContractCompatibility({ ...input, candidate: dependent }).status, 'compatible')
const envValue = structuredClone(candidate); envValue.environmentVariables[0].value = 'forbidden'; assert.notEqual(evaluateFactoryProjectContractCompatibility({ ...input, candidate: envValue }).status, 'compatible')
assert.equal(result.canExecuteCodex, false)
assert.equal(result.canCreateProject, false)
assert.equal(result.canCreateRepository, false)
assert.equal(result.canDeploy, false)
assert.equal(result.contractDraft.independence.runtimeDependsOnJefe, false)
assert.equal(result.contractDraft.independence.mustUseOwnRepository && result.contractDraft.independence.mustHaveOwnRoot, true)
assert.equal(result.contractDraft.lineage.opportunityId, candidate.lineage.opportunityId)
assert.ok(result.contractDraft.environmentVariables.every((item) => !Object.prototype.hasOwnProperty.call(item, 'value')))
assert.ok(unapproved.blockers.length > 0)
const parsed = parseFactoryProjectContractCompatibilityResult(serializeFactoryProjectContractCompatibilityResult(result)); assert.equal(validateFactoryProjectContractCompatibilityResult(parsed).ok, true)
const summaryText = JSON.stringify(summarizeFactoryProjectContractCompatibilityResult(result)); assert.equal(summaryText.includes('environmentVariables'), false)
assert.equal(result.canCreateProject, false)
assert.equal(result.canCreateRepository, false)
assert.equal(result.canExecuteCodex, false)
assert.ok(/review|approval/iu.test(result.recommendedNextStep))

console.log(JSON.stringify({ ok: true, checks: 25, compatibilityKind: result.compatibilityKind, status: result.status, contractValidation: result.contractValidation.ok, canCreateFactoryProjectContract: result.canCreateFactoryProjectContract, canExecuteCodex: result.canExecuteCodex, canCreateProject: result.canCreateProject, canCreateRepository: result.canCreateRepository, canDeploy: result.canDeploy }, null, 2))
