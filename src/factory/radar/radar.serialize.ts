import type { MarketOpportunity, RadarEvaluationResult, RadarEvaluationSummary } from './radar.types.ts'

export const serializeRadarEvaluationResult = (result: RadarEvaluationResult): string => JSON.stringify(result, null, 2)
export const parseRadarEvaluationResult = (json: string): unknown => JSON.parse(json) as unknown
export const serializeMarketOpportunity = (opportunity: MarketOpportunity): string => JSON.stringify(opportunity, null, 2)
export const parseMarketOpportunity = (json: string): unknown => JSON.parse(json) as unknown

export function summarizeRadarEvaluationResult(result: RadarEvaluationResult): RadarEvaluationSummary {
  return {
    opportunityId: result.opportunityId, title: result.title, score: result.score.total, decision: result.decision.type,
    topReasons: result.reasons.slice(0, 3),
    risks: result.risks.slice(0, 5).map((risk) => ({ type: risk.type, severity: risk.severity, description: risk.description.slice(0, 160) })),
    recommendedNextStep: result.recommendedNextStep,
  }
}
