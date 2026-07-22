import type { FactoryHermesResearchExecutionBoundaryPlanningResult, FactoryHermesResearchExecutionBoundaryPlanningSummary } from './hermes-research-execution-boundary-planning.types.ts'

export function serializeFactoryHermesResearchExecutionBoundaryPlanningResult(result: FactoryHermesResearchExecutionBoundaryPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchExecutionBoundaryPlanningResult(json: string): FactoryHermesResearchExecutionBoundaryPlanningResult {
  return JSON.parse(json) as FactoryHermesResearchExecutionBoundaryPlanningResult
}

export function summarizeFactoryHermesResearchExecutionBoundaryPlanningResult(result: FactoryHermesResearchExecutionBoundaryPlanningResult): FactoryHermesResearchExecutionBoundaryPlanningSummary {
  return {
    planningId: result.planningId,
    status: result.status,
    decision: result.decision,
    allPoliciesConsolidated: result.hermesResearchExecutionBoundaryPlanCandidate?.allPoliciesConsolidated === true,
    missingRuntimeSelectionCount: result.missingRuntimeSelections.length,
    canProceedToResearchExecutionApproval: result.canProceedToResearchExecutionApproval,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    nextStep: result.recommendedNextStep,
  }
}
