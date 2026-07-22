import type { FactoryHermesModelProviderPolicyPlanningResult, FactoryHermesModelProviderPolicyPlanningSummary } from './hermes-model-provider-policy-planning.types.ts'

export function serializeFactoryHermesModelProviderPolicyPlanningResult(result: FactoryHermesModelProviderPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesModelProviderPolicyPlanningResult(json: string): FactoryHermesModelProviderPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesModelProviderPolicyPlanningResult
}

export function summarizeFactoryHermesModelProviderPolicyPlanningResult(result: FactoryHermesModelProviderPolicyPlanningResult): FactoryHermesModelProviderPolicyPlanningSummary {
  return {
    planningId: result.planningId,
    status: result.status,
    decision: result.decision,
    providerCandidateCount: result.providerCandidates.length,
    providerSelectionRequired: result.hermesModelProviderPolicyPlanCandidate?.providerSelection.providerSelectionRequired === true,
    selectedProvider: null,
    canProceedToCredentialsPolicyPlanning: result.canProceedToCredentialsPolicyPlanning,
    canProceedToResearchExecutionApproval: false,
    canCallModelsNow: false,
    nextStep: result.recommendedNextStep,
  }
}
