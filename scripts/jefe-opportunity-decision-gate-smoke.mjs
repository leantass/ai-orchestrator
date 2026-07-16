import assert from 'node:assert/strict'
import { JEFE_HERMES_ADAPTER_IDENTITY, scoreJefeHermesEvidenceQuality } from '../src/factory/adapters/jefe-hermes/index.ts'
import { evaluateJefeOpportunityDecision, parseJefeOpportunityDecisionResult, serializeJefeOpportunityDecisionResult, summarizeJefeOpportunityDecisionResult, validateJefeOpportunityDecisionInput, validateJefeOpportunityDecisionResult } from '../src/factory/jefe-decision/index.ts'
import { createMarketOpportunityV1, createRadarSignalV1, evaluateMarketOpportunity } from '../src/factory/radar/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const signal = createRadarSignalV1({ id: 'signal-1', type: 'repeated_problem', source: 'manual', title: 'Recurring workflow issue', summary: 'Teams repeat expensive manual work.', capturedAt: at, strength: 'strong', tags: ['workflow'], confidence: 0.9, risks: [], notes: [] })
const opportunity = createMarketOpportunityV1({ id: 'opportunity-1', title: 'Workflow assistant', description: 'Independent workflow product.', problem: 'Teams repeat costly manual tasks.', audience: 'Small operational teams', category: 'productivity', status: 'scored', signals: [signal], proposedSolution: 'Focused independent application.', monetizationHypothesis: 'Team subscription.', demandHypothesis: 'Recurring usage.', competitorHypothesis: 'Generic competitors need comparison.', buildComplexity: 2, operationalCost: 2, legalSensitivity: 0, urgency: 5, frequency: 5, willingnessToPay: 5, differentiationPotential: 5, viralPotential: 3, reusableLearningPotential: 5, evidence: [], assumptions: ['Teams can onboard without consulting services.'], openQuestions: ['Which price converts?'], risks: [], createdAt: at })
const radarEvaluation = evaluateMarketOpportunity({ opportunity, evaluatedAt: at })
const evidence = (id, kind, sourceName, overrides = {}) => ({ evidenceId: id, kind, sourceType: 'manual_input', sourceName, title: `${kind} evidence`, summary: 'Bounded cited evidence.', capturedAt: at, url: `https://example.test/${id}`, stance: 'supporting', confidence: 0.9, freshness: 'current', sourceQuality: 'high', relevance: 'high', riskFlags: [], notes: [], ...overrides })
const evidenceItems = [evidence('e1', 'demand', 'source-a'), evidence('e2', 'pricing', 'source-b'), evidence('e3', 'monetization', 'source-c')]
const coverage = ['demand', 'pricing', 'monetization']
const scoring = scoreJefeHermesEvidenceQuality(evidenceItems, coverage, coverage)
const hermesReport = { ...JEFE_HERMES_ADAPTER_IDENTITY, reportId: 'report-1', requestId: 'request-1', opportunityId: opportunity.id, createdAt: at, status: 'completed', executiveSummary: 'Evidence supports JEFE review.', demandFindings: [{ summary: 'Recurring demand.', strength: 'high', sourceEvidenceIds: ['e1'] }], competitorFindings: [], pricingFindings: [{ model: 'subscription', priceDescription: 'Comparable pricing.', confidence: 0.8, sourceEvidenceIds: ['e2'] }], reviewFindings: [], trendFindings: [], monetizationFindings: [{ model: 'subscription', viability: 'high', rationale: 'Recurring value.', sourceEvidenceIds: ['e3'] }], riskFindings: [], evidence: evidenceItems, confidence: scoring.confidence, contradictions: [], openQuestions: [], recommendedDecisionForJefe: 'convert_to_factory_brief', limitations: ['Contract-only evidence.'], requiredCoverage: coverage, satisfiedCoverage: coverage, costEstimate: '0' }
const input = { opportunity, radarEvaluation, hermesReport, createdAt: at, decidedBy: 'JEFE' }

const withRadarDecision = (type) => evaluateJefeOpportunityDecision({ ...input, radarEvaluation: { ...structuredClone(radarEvaluation), decision: { ...structuredClone(radarEvaluation.decision), type } } })
assert.equal(withRadarDecision('reject').decision, 'reject_opportunity')
assert.equal(withRadarDecision('hold').decision, 'hold_opportunity')
assert.equal(evaluateJefeOpportunityDecision({ ...input, hermesReport: undefined, radarEvaluation: { ...structuredClone(radarEvaluation), decision: { ...structuredClone(radarEvaluation.decision), type: 'research_with_hermes' } } }).decision, 'request_more_research')
const incomplete = structuredClone(hermesReport); incomplete.status = 'needs_more_sources'; incomplete.evidence = [evidenceItems[0]]; assert.equal(evaluateJefeOpportunityDecision({ ...input, hermesReport: incomplete }).decision, 'request_more_research')
const critical = structuredClone(hermesReport); critical.riskFindings = [{ riskId: 'critical', severity: 'critical', category: 'legal', description: 'Critical legal risk.', sourceEvidenceIds: ['e1'] }]; assert.equal(evaluateJefeOpportunityDecision({ ...input, hermesReport: critical }).decision, 'human_review_required')
const contradicted = structuredClone(hermesReport); contradicted.contradictions = ['Conflict one', 'Conflict two']; assert.notEqual(evaluateJefeOpportunityDecision({ ...input, hermesReport: contradicted }).decision, 'approve_brief_draft')
const sensitive = structuredClone(opportunity); sensitive.category = 'legal_sensitive'; assert.equal(evaluateJefeOpportunityDecision({ ...input, opportunity: sensitive }).requiredHumanReview.required, true)
const briefResult = evaluateJefeOpportunityDecision(input); assert.equal(briefResult.decision, 'approve_brief_draft'); assert.ok(briefResult.briefDraftSignal)
assert.equal(briefResult.codexAllowed, false)
const candidate = evaluateJefeOpportunityDecision({ ...input, humanApproval: { approved: true, scope: 'project_candidate', approvedBy: 'Lean', approvedAt: at } }); assert.equal(candidate.decision, 'prepare_factory_project_candidate')
assert.equal(candidate.projectCandidateSignal.repositoryRequired, true)
assert.equal(candidate.projectCandidateSignal.runtimeIndependenceRequired, true)
assert.equal('factoryProjectContract' in candidate, false)
assert.equal(candidate.projectCreationAllowed, false)
const noOpportunity = structuredClone(input); delete noOpportunity.opportunity; assert.equal(validateJefeOpportunityDecisionInput(noOpportunity).ok, false)
const noRadar = structuredClone(input); delete noRadar.radarEvaluation; assert.equal(validateJefeOpportunityDecisionInput(noRadar).ok, false)
const unsafeCodex = structuredClone(briefResult); unsafeCodex.codexAllowed = true; assert.equal(validateJefeOpportunityDecisionResult(unsafeCodex).ok, false)
const unsafeDeploy = structuredClone(briefResult); unsafeDeploy.deployAllowed = true; assert.equal(validateJefeOpportunityDecisionResult(unsafeDeploy).ok, false)
const parsed = parseJefeOpportunityDecisionResult(serializeJefeOpportunityDecisionResult(briefResult)); assert.equal(validateJefeOpportunityDecisionResult(parsed).ok, true)
const raw = 'RAW-EVIDENCE-MUST-NOT-LEAK-'.repeat(100); const rawInput = structuredClone(briefResult); rawInput.briefDraftSignal.evidenceSummary.raw = raw; assert.equal(JSON.stringify(summarizeJefeOpportunityDecisionResult(rawInput)).includes(raw), false)
for (const result of [briefResult, candidate, withRadarDecision('reject'), withRadarDecision('hold')]) assert.ok(result.recommendedNextStep)

console.log(JSON.stringify({ ok: true, checks: 21, gateKind: briefResult.decisionKind, briefDecision: briefResult.decision, candidateDecision: candidate.decision, codexAllowed: briefResult.codexAllowed, projectCreationAllowed: briefResult.projectCreationAllowed, deployAllowed: briefResult.deployAllowed }, null, 2))
