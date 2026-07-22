import type { FactoryHermesToolsetsPolicyPlanningResult, FactoryHermesToolsetsPolicyPlanningSummary } from './hermes-toolsets-policy-planning.types.ts'

export function serializeFactoryHermesToolsetsPolicyPlanningResult(result: FactoryHermesToolsetsPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesToolsetsPolicyPlanningResult(json: string): FactoryHermesToolsetsPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesToolsetsPolicyPlanningResult
}

export function summarizeFactoryHermesToolsetsPolicyPlanningResult(result: FactoryHermesToolsetsPolicyPlanningResult): FactoryHermesToolsetsPolicyPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, toolsetCandidateCount: result.toolsetCandidates.length, selectedToolsetPolicy: result.selectedToolsetPolicy, toolsetsAllowedNow: false, canProceedToOutputContractPolicyPlanning: result.canProceedToOutputContractPolicyPlanning, canProceedToResearchExecutionApproval: false, canEnableToolsetsNow: false, nextStep: result.recommendedNextStep }
}
