import type { FactoryHermesTimeoutKillSwitchPolicyPlanningResult, FactoryHermesTimeoutKillSwitchPolicyPlanningSummary } from './hermes-timeout-kill-switch-policy-planning.types.ts'

export function serializeFactoryHermesTimeoutKillSwitchPolicyPlanningResult(result: FactoryHermesTimeoutKillSwitchPolicyPlanningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesTimeoutKillSwitchPolicyPlanningResult(json: string): FactoryHermesTimeoutKillSwitchPolicyPlanningResult {
  return JSON.parse(json) as FactoryHermesTimeoutKillSwitchPolicyPlanningResult
}

export function summarizeFactoryHermesTimeoutKillSwitchPolicyPlanningResult(result: FactoryHermesTimeoutKillSwitchPolicyPlanningResult): FactoryHermesTimeoutKillSwitchPolicyPlanningSummary {
  const processTimeout = result.timeoutPolicyRules.find((rule) => rule.ruleId === 'process_timeout')
  return {
    planningId: result.planningId,
    status: result.status,
    decision: result.decision,
    commandTimeoutMsDefault: processTimeout?.commandTimeoutMsDefault,
    commandTimeoutMsMax: processTimeout?.commandTimeoutMsMax,
    killSwitchCount: result.killSwitchPolicyRules.length,
    autoRetryAllowed: false,
    canProceedToFilesystemMutationPolicyPlanning: result.canProceedToFilesystemMutationPolicyPlanning,
    canProceedToResearchExecutionApproval: false,
    canRunResearchNow: false,
    nextStep: result.recommendedNextStep,
  }
}
