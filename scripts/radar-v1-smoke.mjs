import assert from 'node:assert/strict'

import {
  createMarketOpportunityV1,
  createRadarSignalV1,
  evaluateMarketOpportunity,
  parseMarketOpportunity,
  parseRadarEvaluationResult,
  serializeMarketOpportunity,
  serializeRadarEvaluationResult,
  summarizeRadarEvaluationResult,
  validateMarketOpportunity,
  validateMarketSignal,
  validateRadarEvaluationResult,
} from '../src/factory/radar/index.ts'

const at = '2026-07-15T18:00:00.000Z'
const evidence = (id, stance = 'supports', confidence = 0.85, summary = 'Bounded market evidence') => ({ evidenceId: id, summary, source: 'manual', confidence, stance, capturedAt: at })
const signal = (id, evidenceItems = []) => createRadarSignalV1({ id, type: 'repeated_problem', source: 'manual', title: `Signal ${id}`, summary: 'Repeated universal workflow problem.', capturedAt: at, strength: 'strong', tags: ['workflow'], confidence: 0.85, risks: [], notes: [], evidence: evidenceItems })

const signalOne = signal('signal-1', [evidence('evidence-1')])
const signalTwo = signal('signal-2', [evidence('evidence-2')])
assert.equal(validateMarketSignal(signalOne).ok, true)
const missingSignalId = structuredClone(signalOne); delete missingSignalId.id
assert.equal(validateMarketSignal(missingSignalId).ok, false)

function opportunity(overrides = {}) {
  return createMarketOpportunityV1({
    id: 'opportunity-strong', title: 'Universal workflow assistant', description: 'Independent product for a repeated workflow.', problem: 'Teams repeat costly manual work.', audience: 'Small operational teams', category: 'productivity', status: 'captured', signals: [signalOne, signalTwo], proposedSolution: 'A focused independent application.', monetizationHypothesis: 'Subscription per team.', demandHypothesis: 'Repeated use indicates recurring demand.', competitorHypothesis: 'Alternatives are generic but not extreme.', buildComplexity: 1, operationalCost: 1, legalSensitivity: 0, urgency: 5, frequency: 5, willingnessToPay: 5, differentiationPotential: 5, viralPotential: 4, reusableLearningPotential: 5, evidence: [evidence('direct-1'), evidence('direct-2')], assumptions: ['Users value time saved.'], openQuestions: ['Preferred workflow depth?'], risks: [], createdAt: at,
    ...overrides,
  })
}

const strong = opportunity()
assert.equal(validateMarketOpportunity(strong).ok, true)
const withoutSignals = structuredClone(strong); withoutSignals.signals = []
assert.equal(validateMarketOpportunity(withoutSignals).ok, false)
const weakEvidence = opportunity({ id: 'weak-evidence', evidence: [], signals: [signal('only-signal')] })
assert.ok(validateMarketOpportunity(weakEvidence).warnings.some((warning) => warning.includes('evidence')))

const critical = opportunity({ id: 'critical', category: 'legal_sensitive', legalSensitivity: 5, risks: [{ riskId: 'legal-critical', type: 'legal', severity: 'critical', description: 'Critical legal uncertainty.' }] })
const criticalResult = evaluateMarketOpportunity({ opportunity: critical, evaluatedAt: at })
assert.notEqual(criticalResult.decision.type, 'draft_factory_brief')

const strongResult = evaluateMarketOpportunity({ opportunity: strong, evaluatedAt: at })
assert.equal(strongResult.decision.type, 'draft_factory_brief')
const highWithoutEvidence = opportunity({ id: 'high-no-evidence', evidence: [], signals: [signal('single')] })
assert.equal(evaluateMarketOpportunity({ opportunity: highWithoutEvidence, evaluatedAt: at }).decision.type, 'research_with_hermes')

const weak = opportunity({ id: 'weak', signals: [signal('weak-1')], evidence: [], monetizationHypothesis: '', buildComplexity: 5, operationalCost: 5, urgency: 0, frequency: 0, willingnessToPay: 0, differentiationPotential: 0, viralPotential: 0, reusableLearningPotential: 0, competitorHypothesis: 'Extreme saturated commodity market.' })
assert.equal(evaluateMarketOpportunity({ opportunity: weak, evaluatedAt: at }).decision.type, 'reject')

const serializedResult = serializeRadarEvaluationResult(strongResult)
const parsedResult = parseRadarEvaluationResult(serializedResult)
assert.equal(validateRadarEvaluationResult(parsedResult).ok, true)
const parsedOpportunity = parseMarketOpportunity(serializeMarketOpportunity(strong))
assert.equal(validateMarketOpportunity(parsedOpportunity).ok, true)

const longEvidence = 'RAW-EVIDENCE-DO-NOT-EXPOSE-'.repeat(50)
const withLongEvidence = opportunity({ id: 'long-evidence', evidence: [evidence('long-1', 'supports', 0.9, longEvidence), evidence('long-2')] })
const safeSummary = summarizeRadarEvaluationResult(evaluateMarketOpportunity({ opportunity: withLongEvidence, evaluatedAt: at }))
assert.equal(JSON.stringify(safeSummary).includes(longEvidence), false)
assert.ok(strongResult.score.total >= 0 && strongResult.score.total <= 100)

const contradictory = opportunity({ id: 'contradictory', evidence: [evidence('support', 'supports'), evidence('against-1', 'contradicts'), evidence('against-2', 'contradicts')] })
const contradictoryResult = evaluateMarketOpportunity({ opportunity: contradictory, evaluatedAt: at })
assert.equal(contradictoryResult.contradictoryEvidence, true)
assert.ok(contradictoryResult.warnings.some((warning) => warning.includes('contradictory')))

assert.ok(criticalResult.warnings.some((warning) => warning.includes('Sensitive category')))

console.log(JSON.stringify({ ok: true, checks: 15, radarVersion: strongResult.radarVersion, strongScore: strongResult.score.total, strongDecision: strongResult.decision.type, weakDecision: evaluateMarketOpportunity({ opportunity: weak, evaluatedAt: at }).decision.type, criticalDecision: criticalResult.decision.type }, null, 2))
