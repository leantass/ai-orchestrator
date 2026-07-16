import type { JefeOpportunityDecisionResult, JefeOpportunityDecisionSummary } from './jefe-decision.types.ts'

export function serializeJefeOpportunityDecisionResult(result: JefeOpportunityDecisionResult): string { return JSON.stringify(result, null, 2) }
export function parseJefeOpportunityDecisionResult(json: string): JefeOpportunityDecisionResult { return JSON.parse(json) as JefeOpportunityDecisionResult }
export function summarizeJefeOpportunityDecisionResult(result: JefeOpportunityDecisionResult): JefeOpportunityDecisionSummary {
  return { opportunityId: result.opportunityId, radarScore: result.radarScore, hermesConfidence: result.hermesConfidence, decision: result.decision,
    topReasons: result.reasons.slice(0, 3).map((item) => item.message.slice(0, 180)), blockers: result.blockers.slice(0, 5),
    risks: result.risks.slice(0, 5).map((risk) => ({ severity: risk.severity, category: risk.category, description: risk.description.slice(0, 180) })),
    requiredHumanReview: result.requiredHumanReview.required, nextStep: result.recommendedNextStep.slice(0, 240),
    hasBriefDraftSignal: Boolean(result.briefDraftSignal), hasProjectCandidateSignal: Boolean(result.projectCandidateSignal) }
}
