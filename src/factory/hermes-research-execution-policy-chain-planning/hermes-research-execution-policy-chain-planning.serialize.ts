import type { FactoryHermesResearchExecutionPolicyChainPlanningResult, FactoryHermesResearchExecutionPolicyChainPlanningSummary } from './hermes-research-execution-policy-chain-planning.types.ts'

export function serializeFactoryHermesResearchExecutionPolicyChainPlanningResult(result: FactoryHermesResearchExecutionPolicyChainPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchExecutionPolicyChainPlanningResult(json: string): FactoryHermesResearchExecutionPolicyChainPlanningResult {
  return JSON.parse(json) as FactoryHermesResearchExecutionPolicyChainPlanningResult
}

export function summarizeFactoryHermesResearchExecutionPolicyChainPlanningResult(result: FactoryHermesResearchExecutionPolicyChainPlanningResult): FactoryHermesResearchExecutionPolicyChainPlanningSummary {
  return {
    planningId: result.planningId,
    status: result.status,
    decision: result.decision,
    commandShapeUnderConsideration: result.hermesResearchExecutionPolicyChainPlan?.commandShapeUnderConsideration || result.currentCommandShape,
    requiredPolicyCount: result.requiredPolicies.length,
    proposedGateCount: result.proposedGateSequence.length,
    canProceedToPromptPolicyPlanning: result.canProceedToPromptPolicyPlanning,
    canProceedToResearchExecutionApproval: false,
    canRunResearchNow: false,
    nextStep: result.recommendedNextStep,
  }
}
