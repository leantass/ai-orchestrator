import type { FactoryHermesFilesystemMutationPolicyPlanningResult, FactoryHermesFilesystemMutationPolicyPlanningSummary } from './hermes-filesystem-mutation-policy-planning.types.ts'

export function serializeFactoryHermesFilesystemMutationPolicyPlanningResult(result: FactoryHermesFilesystemMutationPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesFilesystemMutationPolicyPlanningResult(json: string): FactoryHermesFilesystemMutationPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesFilesystemMutationPolicyPlanningResult
}

export function summarizeFactoryHermesFilesystemMutationPolicyPlanningResult(result: FactoryHermesFilesystemMutationPolicyPlanningResult): FactoryHermesFilesystemMutationPolicyPlanningSummary {
  return {
    planningId: result.planningId,
    status: result.status,
    decision: result.decision,
    filesystemSurfaceCandidateCount: result.filesystemSurfaceCandidates.length,
    futureWritesRestrictedToCodexTemp: true,
    filesystemMutationAllowedNow: false,
    canProceedToResearchExecutionBoundaryPlanning: result.canProceedToResearchExecutionBoundaryPlanning,
    canProceedToResearchExecutionApproval: false,
    canRunResearchNow: false,
    nextStep: result.recommendedNextStep,
  }
}
