import type { FactoryHermesToolsetDisableVerificationApprovalResult, FactoryHermesToolsetDisableVerificationApprovalSummary } from './hermes-toolset-disable-verification-approval.types.ts'

export function serializeFactoryHermesToolsetDisableVerificationApprovalResult(result: FactoryHermesToolsetDisableVerificationApprovalResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesToolsetDisableVerificationApprovalResult(json: string): FactoryHermesToolsetDisableVerificationApprovalResult {
  return JSON.parse(json) as FactoryHermesToolsetDisableVerificationApprovalResult
}

export function summarizeFactoryHermesToolsetDisableVerificationApprovalResult(result: FactoryHermesToolsetDisableVerificationApprovalResult): FactoryHermesToolsetDisableVerificationApprovalSummary {
  return {
    approvalId: result.approvalId,
    status: result.status,
    decision: result.decision,
    approvalStatus: result.approvalStatus,
    safeProbeShapeProven: result.sourceSafetyAssessment?.safeProbeShapeProven === true,
    canProceedToToolsetDisableVerificationRuntimeAdapter: result.canProceedToToolsetDisableVerificationRuntimeAdapter,
    canProceedToRuntimeSelectionRevisionPlanning: result.canProceedToRuntimeSelectionRevisionPlanning,
    canProceedToResearchRuntimeAdapterApprovalRetry: false,
    canRunResearchNow: false,
    nextStep: result.recommendedNextStep,
  }
}
