import assert from 'node:assert/strict'
import { validateJefeHermesResearchRequest } from '../src/factory/adapters/jefe-hermes/index.ts'
import { createMarketOpportunityV1, createRadarSignalV1, evaluateMarketOpportunity } from '../src/factory/radar/index.ts'
import { createRadarToHermesResearchRequest, parseRadarToHermesHandoffResult, serializeRadarToHermesHandoffResult, summarizeRadarToHermesHandoffResult, validateRadarToHermesHandoffInput, validateRadarToHermesHandoffResult } from '../src/factory/handoffs/radar-to-hermes/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const evidence = (id) => ({ evidenceId: id, summary: 'Bounded supporting evidence.', source: 'manual', confidence: 0.8, stance: 'supports', capturedAt: at })
const signal = createRadarSignalV1({ id: 'signal-1', type: 'repeated_problem', source: 'manual', title: 'Repeated problem', summary: 'Teams repeat manual work.', capturedAt: at, strength: 'strong', geography: 'global', language: 'en', evidence: [evidence('e1')], tags: ['workflow'], confidence: 0.85, risks: [], notes: [] })
const opportunity = createMarketOpportunityV1({ id: 'opportunity-1', title: 'Workflow assistant', description: 'Independent workflow product.', problem: 'Teams repeat costly manual tasks.', audience: 'Small operational teams', category: 'productivity', status: 'captured', signals: [signal], proposedSolution: 'Focused independent app.', monetizationHypothesis: 'Subscription per team.', demandHypothesis: 'Recurring use.', competitorHypothesis: 'Generic competitors need comparison.', buildComplexity: 2, operationalCost: 1, legalSensitivity: 0, urgency: 5, frequency: 5, willingnessToPay: 5, differentiationPotential: 5, viralPotential: 3, reusableLearningPotential: 5, evidence: [], assumptions: [], openQuestions: ['Which price will teams pay?', 'Which acquisition channel works?'], risks: [], createdAt: at })
const evaluation = evaluateMarketOpportunity({ opportunity, evaluatedAt: at })
assert.equal(evaluation.decision.type, 'research_with_hermes')
const input = { opportunity, evaluation, evaluationId: 'evaluation-1', createdAt: at, requestedBy: 'JEFE' }
assert.equal(validateRadarToHermesHandoffInput(input).ok, true)
const handoff = createRadarToHermesResearchRequest(input)
assert.equal(handoff.requestCreated, true)
assert.equal(handoff.targetAdapterName, 'JefeHermesAdapter')
assert.equal(handoff.researchRequest.externalToolOrigin, 'external_tool')
assert.equal(handoff.researchRequest.policy.readOnly, true)
assert.equal(handoff.codexAllowed, false)
assert.equal(handoff.directProjectCreationAllowed, false)
assert.equal(validateRadarToHermesHandoffResult(handoff).ok, true)

const blocked = (decision) => createRadarToHermesResearchRequest({ ...input, evaluation: { ...structuredClone(evaluation), decision: { ...structuredClone(evaluation.decision), type: decision } } })
assert.equal(blocked('reject').blockedReason, 'opportunity_rejected_by_radar')
assert.equal(blocked('hold').blockedReason, 'opportunity_on_hold')
assert.equal(blocked('needs_human_review').blockedReason, 'human_review_required_before_research')
const draftBlocked = blocked('draft_factory_brief'); assert.equal(draftBlocked.requestCreated, false); assert.ok(draftBlocked.mappingWarnings.length > 0)

const sensitiveOpportunity = { ...structuredClone(opportunity), category: 'legal_sensitive' }
const sensitive = createRadarToHermesResearchRequest({ ...input, opportunity: sensitiveOpportunity })
assert.equal(sensitive.blockedReason, 'sensitive_category_requires_human_approval')
assert.equal(sensitive.requiredHumanReview, true)

const noAudience = structuredClone(input); delete noAudience.opportunity.audience; assert.equal(validateRadarToHermesHandoffInput(noAudience).ok, false)
const noProblem = structuredClone(input); delete noProblem.opportunity.problem; assert.equal(validateRadarToHermesHandoffInput(noProblem).ok, false)
assert.ok(handoff.questionMappings.some((mapping) => mapping.source === 'open_question' && mapping.targetQuestion === 'pricing'))
assert.ok(handoff.questionMappings.some((mapping) => mapping.source === 'opportunity_hypothesis' && mapping.targetQuestion === 'monetization'))
assert.ok(handoff.questionMappings.some((mapping) => mapping.source === 'opportunity_hypothesis' && mapping.targetQuestion === 'competitors'))
assert.ok(handoff.sourcePolicyMapping.allowedSources.length > 0 && handoff.sourcePolicyMapping.disallowedSources.length > 0)
assert.equal(validateJefeHermesResearchRequest(handoff.researchRequest).ok, true)

const parsed = parseRadarToHermesHandoffResult(serializeRadarToHermesHandoffResult(handoff))
assert.equal(validateRadarToHermesHandoffResult(parsed).ok, true)
const rawEvidence = 'RAW-EVIDENCE-MUST-NOT-LEAK-'.repeat(100)
const summaryInput = structuredClone(handoff); summaryInput.researchRequest.opportunitySummary = rawEvidence
const summary = summarizeRadarToHermesHandoffResult(summaryInput)
assert.equal(JSON.stringify(summary).includes(rawEvidence), false)

console.log(JSON.stringify({ ok: true, checks: 20, handoffKind: handoff.handoffKind, requestCreated: handoff.requestCreated, targetAdapterName: handoff.targetAdapterName, targetExternalToolName: handoff.targetExternalToolName, researchQuestions: handoff.researchRequest.researchQuestions.length, blockedDecisions: ['reject', 'hold', 'needs_human_review', 'draft_factory_brief'] }, null, 2))
