import type { FactoryHermesPromptPolicyPlanningResult, FactoryHermesPromptPolicyPlanningSummary } from './hermes-prompt-policy-planning.types.ts'

export function serializeFactoryHermesPromptPolicyPlanningResult(result: FactoryHermesPromptPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesPromptPolicyPlanningResult(json: string): FactoryHermesPromptPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesPromptPolicyPlanningResult
}

export function summarizeFactoryHermesPromptPolicyPlanningResult(result: FactoryHermesPromptPolicyPlanningResult): FactoryHermesPromptPolicyPlanningSummary {
  return {
    planningId: result.planningId,
    status: result.status,
    decision: result.decision,
    promptCandidateHash: result.hermesPromptPolicyPlanCandidate?.promptCandidate.sha256,
    promptMaxChars: result.hermesPromptPolicyPlanCandidate?.promptCandidate.maxChars,
    canProceedToModelProviderPolicyPlanning: result.canProceedToModelProviderPolicyPlanning,
    canProceedToResearchExecutionApproval: false,
    canPassPromptNow: false,
    nextStep: result.recommendedNextStep,
  }
}
