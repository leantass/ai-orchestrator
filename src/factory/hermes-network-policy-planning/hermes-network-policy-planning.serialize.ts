import type { FactoryHermesNetworkPolicyPlanningResult, FactoryHermesNetworkPolicyPlanningSummary } from './hermes-network-policy-planning.types.ts'

export function serializeFactoryHermesNetworkPolicyPlanningResult(result: FactoryHermesNetworkPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesNetworkPolicyPlanningResult(json: string): FactoryHermesNetworkPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesNetworkPolicyPlanningResult
}

export function summarizeFactoryHermesNetworkPolicyPlanningResult(result: FactoryHermesNetworkPolicyPlanningResult): FactoryHermesNetworkPolicyPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, networkSurfaceCandidateCount: result.networkSurfaceCandidates.length, providerNetworkCandidateCount: result.providerNetworkCandidates.length, allowedHostsNow: [], wildcardHostsAllowed: false, canProceedToToolsetsPolicyPlanning: result.canProceedToToolsetsPolicyPlanning, canProceedToResearchExecutionApproval: false, canUseNetworkNow: false, nextStep: result.recommendedNextStep }
}
