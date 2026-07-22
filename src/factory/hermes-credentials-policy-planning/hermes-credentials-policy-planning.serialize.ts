import type { FactoryHermesCredentialsPolicyPlanningResult, FactoryHermesCredentialsPolicyPlanningSummary } from './hermes-credentials-policy-planning.types.ts'

export function serializeFactoryHermesCredentialsPolicyPlanningResult(result: FactoryHermesCredentialsPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesCredentialsPolicyPlanningResult(json: string): FactoryHermesCredentialsPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesCredentialsPolicyPlanningResult
}

export function summarizeFactoryHermesCredentialsPolicyPlanningResult(result: FactoryHermesCredentialsPolicyPlanningResult): FactoryHermesCredentialsPolicyPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, credentialReferenceCount: result.credentialReferences.length, credentialValuesRead: false, canProceedToNetworkPolicyPlanning: result.canProceedToNetworkPolicyPlanning, canProceedToResearchExecutionApproval: false, canUseCredentialsNow: false, nextStep: result.recommendedNextStep }
}
