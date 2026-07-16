import { RADAR_SENSITIVE_CATEGORIES, RADAR_VERSION } from './radar.defaults.ts'
import type { MarketOpportunity, OpportunityScoreBreakdown, RadarDecision, RadarEvaluationInput, RadarEvaluationResult, RadarSignalStrength } from './radar.types.ts'

const STRENGTH_POINTS: Record<RadarSignalStrength, number> = { weak: 1, moderate: 2.5, strong: 4, critical: 5 }
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const scaled = (value: number, maximum: number) => (value / 5) * maximum

function evidenceState(opportunity: MarketOpportunity) {
  const evidence = [...opportunity.evidence, ...opportunity.signals.flatMap((signal) => signal.evidence ?? [])]
  const supporting = evidence.filter((item) => item.stance === 'supports' && item.confidence >= 0.6)
  const contradicting = evidence.filter((item) => item.stance === 'contradicts' && item.confidence >= 0.6)
  return {
    sufficient: opportunity.signals.length >= 2 && supporting.length >= 2,
    contradictory: contradicting.length >= 2 || (supporting.length > 0 && contradicting.length > 0 && contradicting.length >= supporting.length),
  }
}

function includesExtremeCompetition(value: string): boolean {
  return /extreme|extrema|saturated|saturado|dominant|dominante|commodity/iu.test(value)
}

function scoreBreakdown(opportunity: MarketOpportunity): OpportunityScoreBreakdown {
  const signalAverage = opportunity.signals.length === 0 ? 0 : opportunity.signals.reduce((sum, signal) => sum + STRENGTH_POINTS[signal.strength] * signal.confidence, 0) / opportunity.signals.length
  const demandRating = clamp((opportunity.urgency + opportunity.frequency + signalAverage) / 3, 0, 5)
  const positive = {
    demand: scaled(demandRating, 15), urgency: scaled(opportunity.urgency, 10), frequency: scaled(opportunity.frequency, 10),
    willingnessToPay: scaled(opportunity.willingnessToPay, 15), monetizationClarity: opportunity.monetizationHypothesis.trim() ? scaled(Math.max(1, opportunity.willingnessToPay), 10) : 0,
    buildEase: scaled(5 - opportunity.buildComplexity, 10), differentiation: scaled(opportunity.differentiationPotential, 10),
    viralPotential: scaled(opportunity.viralPotential, 5), reusableLearning: scaled(opportunity.reusableLearningPotential, 5), signalQuality: scaled(signalAverage, 10),
  }
  const penalties = {
    competitionPenalty: includesExtremeCompetition(opportunity.competitorHypothesis) ? 10 : 0,
    operationalCostPenalty: scaled(opportunity.operationalCost, 10),
    legalSensitivityPenalty: scaled(opportunity.legalSensitivity, 15),
  }
  const rawTotal = Object.values(positive).reduce((sum, value) => sum + value, 0) - Object.values(penalties).reduce((sum, value) => sum + value, 0)
  return { ...positive, ...penalties, rawTotal: Math.round(rawTotal * 100) / 100 }
}

function decide(opportunity: MarketOpportunity, total: number, evidenceSufficient: boolean, contradictoryEvidence: boolean): RadarDecision {
  const criticalRisk = opportunity.risks.some((risk) => risk.severity === 'critical')
  const sensitive = RADAR_SENSITIVE_CATEGORIES.includes(opportunity.category as typeof RADAR_SENSITIVE_CATEGORIES[number])
  if (criticalRisk || opportunity.legalSensitivity >= 5) return { type: 'needs_human_review', reasons: ['Critical legal or sensitive risk requires human judgment.'], recommendedNextStep: 'Obtain human risk review before research or brief creation.', humanApprovalRequired: true }
  if (contradictoryEvidence) return { type: sensitive ? 'needs_human_review' : 'research_with_hermes', reasons: ['Strong contradictory evidence must be resolved.'], recommendedNextStep: sensitive ? 'Obtain human review and define a safe research scope.' : 'Ask Hermes to reconcile contradictory evidence in read-only mode.', humanApprovalRequired: sensitive }
  if (total >= 70) return evidenceSufficient
    ? { type: 'draft_factory_brief', reasons: ['High score and sufficient supporting evidence.'], recommendedNextStep: 'Draft a FactoryProject brief for JEFE review.', humanApprovalRequired: false }
    : { type: 'research_with_hermes', reasons: ['High score but evidence is insufficient.'], recommendedNextStep: 'Request bounded read-only research from Hermes.', humanApprovalRequired: false }
  if (total >= 40) return evidenceSufficient
    ? { type: 'hold', reasons: ['Medium score does not justify a brief yet.'], recommendedNextStep: 'Hold and wait for stronger signals or changed economics.', humanApprovalRequired: false }
    : { type: 'research_with_hermes', reasons: ['Medium score needs stronger evidence.'], recommendedNextStep: 'Request bounded read-only research from Hermes.', humanApprovalRequired: false }
  return { type: 'reject', reasons: ['Low opportunity score.'], recommendedNextStep: 'Reject or archive; reconsider only with materially new evidence.', humanApprovalRequired: false }
}

export function evaluateMarketOpportunity(input: RadarEvaluationInput): RadarEvaluationResult {
  const opportunity = JSON.parse(JSON.stringify(input.opportunity)) as MarketOpportunity
  const breakdown = scoreBreakdown(opportunity)
  const total = Math.round(clamp(breakdown.rawTotal, 0, 100))
  const state = evidenceState(opportunity)
  const decision = decide(opportunity, total, state.sufficient, state.contradictory)
  const warnings: string[] = []
  if (!state.sufficient) warnings.push('Evidence is insufficient for direct brief conversion.')
  if (state.contradictory) warnings.push('Strong contradictory signals require investigation.')
  if (!opportunity.monetizationHypothesis.trim()) warnings.push('Monetization hypothesis is missing.')
  if (RADAR_SENSITIVE_CATEGORIES.includes(opportunity.category as typeof RADAR_SENSITIVE_CATEGORIES[number])) warnings.push('Sensitive category requires enhanced legal, privacy and human review.')
  return { radarVersion: RADAR_VERSION, opportunityId: opportunity.id, title: opportunity.title, evaluatedAt: input.evaluatedAt, score: { total, breakdown }, decision, reasons: [...decision.reasons], warnings, risks: opportunity.risks.map((risk) => ({ ...risk })), evidenceSufficient: state.sufficient, contradictoryEvidence: state.contradictory, recommendedNextStep: decision.recommendedNextStep }
}
