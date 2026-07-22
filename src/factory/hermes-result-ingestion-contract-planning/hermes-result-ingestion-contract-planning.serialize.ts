import type { FactoryHermesResultIngestionContractPlanningResult, FactoryHermesResultIngestionContractPlanningSummary } from './hermes-result-ingestion-contract-planning.types.ts'

export function serializeFactoryHermesResultIngestionContractPlanningResult(result: FactoryHermesResultIngestionContractPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResultIngestionContractPlanningResult(json: string): FactoryHermesResultIngestionContractPlanningResult {
  return JSON.parse(json) as FactoryHermesResultIngestionContractPlanningResult
}

export function summarizeFactoryHermesResultIngestionContractPlanningResult(result: FactoryHermesResultIngestionContractPlanningResult): FactoryHermesResultIngestionContractPlanningSummary {
  return {
    planningId: result.planningId,
    status: result.status,
    decision: result.decision,
    ingestionSurfaceRuleCount: result.ingestionSurfaceRules.length,
    findingCandidateRuleCount: result.findingCandidateRules.length,
    ingestionAllowedNow: false,
    findingsAllowedNow: false,
    canProceedToTimeoutKillSwitchPolicyPlanning: result.canProceedToTimeoutKillSwitchPolicyPlanning,
    canProceedToResearchExecutionApproval: false,
    canUseFindings: false,
    nextStep: result.recommendedNextStep,
  }
}
