import assert from 'node:assert/strict'
import { createFactoryBriefDraftV1 } from '../src/factory/brief-draft/index.ts'
import { createFactoryProjectContractCandidateSlug, createFactoryProjectContractCandidateV1, parseFactoryProjectContractCandidate, serializeFactoryProjectContractCandidate, summarizeFactoryProjectContractCandidate, validateFactoryProjectContractCandidate, validateFactoryProjectContractCandidateInput } from '../src/factory/project-contract-candidate/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const signal = { opportunityId: 'opportunity-1', title: 'Ágil  Workflow -- Assistant', problem: 'Teams repeat costly work.', audience: 'Small operational teams', proposedSolution: 'Independent workflow app.', monetizationHypothesis: 'Team subscription.', evidenceSummary: { radarEvidenceSufficient: true, hermesReportPresent: true, hermesReportStatus: 'completed', evidenceItems: 4, distinctSources: 3, confidence: 0.9, requiredCoverage: ['demand'], satisfiedCoverage: ['demand'], missingCoverage: [], contradictions: 0 }, risks: [], assumptions: [], openQuestions: ['Which price converts?'], requiredAcceptanceCriteriaDraft: ['Users complete the main workflow.', 'Product runs independently from JEFE.'], nextStep: 'draft_factory_brief' }
const draft = createFactoryBriefDraftV1({ signal, decisionId: 'jefe-decision-1', createdAt: at, createdBy: 'JEFE', sourceContext: { radarScore: 82, hermesConfidence: 0.9, evidenceRefs: ['e1'] } })
const input = { draft, createdAt: at, createdBy: 'JEFE', repositoryOwner: 'factory-owner' }
const candidate = createFactoryProjectContractCandidateV1(input)
assert.equal(candidate.candidateKind, 'factory-project-contract-candidate')
assert.equal(validateFactoryProjectContractCandidate(candidate).ok, true)
const noCreator = structuredClone(input); delete noCreator.createdBy; assert.equal(validateFactoryProjectContractCandidateInput(noCreator).ok, false)
const noBriefId = structuredClone(input); noBriefId.draft.briefDraftId = ''; assert.equal(validateFactoryProjectContractCandidateInput(noBriefId).ok, false)
const noOpportunity = structuredClone(input); noOpportunity.draft.opportunityId = ''; assert.equal(validateFactoryProjectContractCandidateInput(noOpportunity).ok, false)
const noTitle = structuredClone(input); noTitle.draft.title = ''; assert.equal(validateFactoryProjectContractCandidateInput(noTitle).ok, false)
assert.equal(candidate.identity.slugSuggestion, 'agil-workflow-assistant')
assert.equal(createFactoryProjectContractCandidateSlug('--- !!! ---'), 'factory-project-candidate')
assert.equal(candidate.repository.repositoryRequired, true)
assert.equal(candidate.independencePolicy.mustHaveOwnRoot, true)
assert.equal(candidate.independencePolicy.mustNotDependOnJefeRuntime, true)
assert.equal(candidate.independencePolicy.mustNotImportJefeModules, true)
assert.ok(candidate.environmentVariables.every((item) => !Object.prototype.hasOwnProperty.call(item, 'value')))
const envWithValue = structuredClone(candidate); envWithValue.environmentVariables[0].value = 'production-secret'; assert.equal(validateFactoryProjectContractCandidate(envWithValue).ok, false)
assert.equal(candidate.executionPolicy.codexExecutionAllowed, false)
assert.equal(candidate.executionPolicy.projectCreationAllowed, false)
assert.equal(candidate.executionPolicy.repositoryCreationAllowed, false)
assert.equal(candidate.executionPolicy.deployAllowed, false)
assert.equal(candidate.readiness.status, 'needs_human_review')
const approved = createFactoryProjectContractCandidateV1({ ...input, humanReviewRef: 'human-review-1' }); assert.equal(approved.readiness.status, 'ready_for_contract_draft')
assert.equal('factoryProjectContract' in approved, false)
assert.equal(approved.executionPolicy.projectCreationAllowed, false)
const parsed = parseFactoryProjectContractCandidate(serializeFactoryProjectContractCandidate(approved)); assert.equal(validateFactoryProjectContractCandidate(parsed).ok, true)
const raw = 'RAW-EVIDENCE-MUST-NOT-LEAK-'.repeat(100); const rawCandidate = structuredClone(approved); rawCandidate.rawEvidence = raw; assert.equal(JSON.stringify(summarizeFactoryProjectContractCandidate(rawCandidate)).includes(raw), false)
assert.ok(/contract/iu.test(approved.recommendedNextStep))

console.log(JSON.stringify({ ok: true, checks: 25, candidateKind: approved.candidateKind, slug: approved.identity.slugSuggestion, readinessWithoutApproval: candidate.readiness.status, readinessWithApproval: approved.readiness.status, repositoryRequired: approved.repository.repositoryRequired, codexExecutionAllowed: approved.executionPolicy.codexExecutionAllowed }, null, 2))
