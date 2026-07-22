import type { FactoryHermesRuntimeSelectionPlanningResult, FactoryHermesRuntimeSelectionPlanningSummary } from './hermes-runtime-selection-planning.types.ts'

export function serializeFactoryHermesRuntimeSelectionPlanningResult(result: FactoryHermesRuntimeSelectionPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesRuntimeSelectionPlanningResult(json: string): FactoryHermesRuntimeSelectionPlanningResult {
  return JSON.parse(json) as FactoryHermesRuntimeSelectionPlanningResult
}

export function summarizeFactoryHermesRuntimeSelectionPlanningResult(result: FactoryHermesRuntimeSelectionPlanningResult): FactoryHermesRuntimeSelectionPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, decisionPackItemCount: result.leanRuntimeSelectionDecisionPack.decisions.length, allSelectionsResolvedNow: false, canProceedToRuntimeSelectionDecision: result.canProceedToRuntimeSelectionDecision, canProceedToResearchExecutionApprovalRetry: false, canRunResearchNow: false, nextStep: result.recommendedNextStep }
}
