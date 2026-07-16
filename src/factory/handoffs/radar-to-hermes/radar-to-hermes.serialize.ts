import type { RadarToHermesHandoffResult, RadarToHermesHandoffSummary } from './radar-to-hermes.types.ts'

export const serializeRadarToHermesHandoffResult = (result: RadarToHermesHandoffResult): string => JSON.stringify(result, null, 2)
export const parseRadarToHermesHandoffResult = (json: string): unknown => JSON.parse(json) as unknown
export function summarizeRadarToHermesHandoffResult(result: RadarToHermesHandoffResult): RadarToHermesHandoffSummary {
  return { opportunityId: result.opportunityId, radarDecision: result.radarDecision, radarScore: result.radarScore, targetAdapterName: result.targetAdapterName, requestCreated: result.requestCreated, researchQuestions: result.researchRequest?.researchQuestions.slice(0, 20) ?? [], ...(result.blockedReason ? { blockedReason: result.blockedReason } : {}), warnings: result.mappingWarnings.map((warning) => warning.slice(0, 240)), risks: result.mappingRisks.map((risk) => risk.slice(0, 180)), recommendedNextStep: result.recommendedNextStep.slice(0, 300) }
}
