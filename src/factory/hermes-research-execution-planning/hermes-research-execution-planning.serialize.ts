import type { FactoryHermesResearchExecutionPlanningResult, FactoryHermesResearchExecutionPlanningSummary } from './hermes-research-execution-planning.types.ts'

export function serializeFactoryHermesResearchExecutionPlanningResult(result: FactoryHermesResearchExecutionPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchExecutionPlanningResult(json: string): FactoryHermesResearchExecutionPlanningResult {
  return JSON.parse(json) as FactoryHermesResearchExecutionPlanningResult
}

export function summarizeFactoryHermesResearchExecutionPlanningResult(result: FactoryHermesResearchExecutionPlanningResult): FactoryHermesResearchExecutionPlanningSummary {
  return {
    planningId: result.planningId,
    toolId: result.toolId,
    commandName: result.commandName,
    status: result.status,
    decision: result.decision,
    methodCandidateCount: result.methodCandidates.length,
    selectedMethodCandidateId: result.selectedMethodCandidate?.candidateId,
    canProceedToResearchExecutionApproval: result.canProceedToResearchExecutionApproval,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    nextStep: result.recommendedNextStep,
  }
}
