import type { FactoryHermesWrapperNoToolModeApprovalResult, FactoryHermesWrapperNoToolModeApprovalSummary } from './hermes-wrapper-no-tool-mode-approval.types.ts'

export function serializeFactoryHermesWrapperNoToolModeApprovalResult(result: FactoryHermesWrapperNoToolModeApprovalResult): string {
  return `${JSON.stringify(result, null, 2)}\n`
}

export function parseFactoryHermesWrapperNoToolModeApprovalResult(json: string): FactoryHermesWrapperNoToolModeApprovalResult {
  return JSON.parse(json) as FactoryHermesWrapperNoToolModeApprovalResult
}

export function summarizeFactoryHermesWrapperNoToolModeApprovalResult(result: FactoryHermesWrapperNoToolModeApprovalResult): FactoryHermesWrapperNoToolModeApprovalSummary {
  return {
    approvalId: result.approvalId,
    status: result.status,
    decision: result.decision,
    approvalStatus: result.approvalStatus,
    selectedWrapperStrategy: result.approvedWrapperNoToolModeImplementationPlanningEnvelope?.selectedWrapperStrategy ?? null,
    canProceedToHermesWrapperNoToolModeImplementationPlanning: result.canProceedToHermesWrapperNoToolModeImplementationPlanning,
    canProceedToHermesWrapperNoToolModeImplementation: result.canProceedToHermesWrapperNoToolModeImplementation,
    canProceedToResearchRuntimeAdapter: result.canProceedToResearchRuntimeAdapter,
    canRunResearchNow: result.canRunResearchNow,
    canExecuteHermesNow: result.canExecuteHermesNow,
    canPassPromptNow: result.canPassPromptNow,
    nextStep: result.recommendedNextStep,
  }
}
