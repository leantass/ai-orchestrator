import assert from 'node:assert/strict'
import { createFactoryBriefDraftV1, parseFactoryBriefDraft, serializeFactoryBriefDraft, summarizeFactoryBriefDraft, validateFactoryBriefDraft, validateFactoryBriefDraftInput } from '../src/factory/brief-draft/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const signal = { opportunityId: 'opportunity-1', title: 'Workflow assistant', problem: 'Teams repeat expensive manual work.', audience: 'Small operational teams', proposedSolution: 'An independent workflow application.', monetizationHypothesis: 'Team subscription.', evidenceSummary: { radarEvidenceSufficient: true, hermesReportPresent: true, hermesReportStatus: 'completed', evidenceItems: 4, distinctSources: 3, confidence: 0.88, requiredCoverage: ['demand', 'pricing'], satisfiedCoverage: ['demand', 'pricing'], missingCoverage: [], contradictions: 0 }, risks: [{ riskId: 'market-1', severity: 'medium', category: 'market', description: 'Demand still requires launch validation.', source: 'hermes' }], assumptions: ['Teams can onboard without services.'], openQuestions: ['Which price converts?'], requiredAcceptanceCriteriaDraft: ['Users complete the primary workflow independently.', 'The product remains independent from JEFE runtime.'], nextStep: 'draft_factory_brief' }
const input = { signal, decisionId: 'jefe-decision-1', createdAt: at, createdBy: 'JEFE', sourceContext: { radarScore: 82, hermesConfidence: 0.88, evidenceRefs: ['e1', 'e2'], decisionReasons: ['Evidence thresholds passed.'] } }
const draft = createFactoryBriefDraftV1(input)
assert.equal(draft.briefDraftKind, 'factory-brief-draft')
assert.equal(validateFactoryBriefDraft(draft).ok, true)
const noCreator = structuredClone(input); delete noCreator.createdBy; assert.equal(validateFactoryBriefDraftInput(noCreator).ok, false)
const noOpportunity = structuredClone(input); noOpportunity.signal.opportunityId = ''; assert.equal(validateFactoryBriefDraftInput(noOpportunity).ok, false)
const noProblem = structuredClone(input); noProblem.signal.problem = ''; assert.equal(validateFactoryBriefDraftInput(noProblem).ok, false)
const noAudience = structuredClone(input); noAudience.signal.audience = ''; assert.equal(validateFactoryBriefDraftInput(noAudience).ok, false)
const noCriteria = structuredClone(input); noCriteria.signal.requiredAcceptanceCriteriaDraft = []; assert.equal(validateFactoryBriefDraftInput(noCriteria).ok, false)
assert.equal(draft.executionPolicy.codexExecutionAllowed, false)
assert.equal(draft.executionPolicy.projectCreationAllowed, false)
assert.equal(draft.executionPolicy.repositoryCreationAllowed, false)
assert.equal(draft.executionPolicy.deployAllowed, false)
assert.equal(draft.independencePolicy.mustHaveOwnRepository, true)
assert.equal(draft.independencePolicy.mustNotDependOnJefeRuntime, true)
assert.equal(draft.independencePolicy.mustNotImportJefeModules, true)
assert.equal(draft.independencePolicy.requiresFactoryProjectContractBeforeCodex, true)
assert.equal(draft.independencePolicy.requiresHumanApprovalBeforeCodex, true)
const parsed = parseFactoryBriefDraft(serializeFactoryBriefDraft(draft)); assert.equal(validateFactoryBriefDraft(parsed).ok, true)
const raw = 'RAW-EVIDENCE-MUST-NOT-LEAK-'.repeat(100); const rawDraft = structuredClone(draft); rawDraft.evidenceSummary.rawEvidence = raw; assert.equal(JSON.stringify(summarizeFactoryBriefDraft(rawDraft)).includes(raw), false)
assert.ok(/review|contract/iu.test(draft.recommendedNextStep))
assert.equal('factoryProjectContract' in draft, false)

console.log(JSON.stringify({ ok: true, checks: 20, briefDraftKind: draft.briefDraftKind, status: draft.status, readiness: draft.readiness.status, acceptanceCriteria: draft.preliminaryAcceptanceCriteria.length, codexExecutionAllowed: draft.executionPolicy.codexExecutionAllowed, projectCreationAllowed: draft.executionPolicy.projectCreationAllowed }, null, 2))
