import type { FactoryHermesOutputContractPolicyPlanningResult, FactoryHermesOutputContractPolicyPlanningSummary } from './hermes-output-contract-policy-planning.types.ts'

export function serializeFactoryHermesOutputContractPolicyPlanningResult(result: FactoryHermesOutputContractPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesOutputContractPolicyPlanningResult(json: string): FactoryHermesOutputContractPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesOutputContractPolicyPlanningResult
}

export function summarizeFactoryHermesOutputContractPolicyPlanningResult(result: FactoryHermesOutputContractPolicyPlanningResult): FactoryHermesOutputContractPolicyPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, outputSurfaceCandidateCount: result.outputSurfaceCandidates.length, selectedOutputContractPolicy: result.selectedOutputContractPolicy, findingsAllowedNow: false, canProceedToResultIngestionContractPlanning: result.canProceedToResultIngestionContractPlanning, canProceedToResearchExecutionApproval: false, canUseFindings: false, nextStep: result.recommendedNextStep }
}
