import type { FactoryHermesResearchExecutionApprovalRetryResult, FactoryHermesResearchExecutionApprovalRetrySummary } from './hermes-research-execution-approval-retry.types.ts'

export function serializeFactoryHermesResearchExecutionApprovalRetryResult(result: FactoryHermesResearchExecutionApprovalRetryResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchExecutionApprovalRetryResult(json: string): FactoryHermesResearchExecutionApprovalRetryResult {
  return JSON.parse(json) as FactoryHermesResearchExecutionApprovalRetryResult
}

export function summarizeFactoryHermesResearchExecutionApprovalRetryResult(result: FactoryHermesResearchExecutionApprovalRetryResult): FactoryHermesResearchExecutionApprovalRetrySummary {
  return { approvalRetryId: result.approvalRetryId, status: result.status, decision: result.decision, approvalRetryStatus: result.approvalRetryStatus, runtimeSelectionsValidated: result.runtimeSelectionsValidated, finalExecutionApprovalRequired: result.finalExecutionApprovalRequired, canProceedToFinalExecutionApprovalGate: result.canProceedToFinalExecutionApprovalGate, canProceedToResearchRuntimeAdapter: false, canRunResearchNow: false, nextStep: result.recommendedNextStep }
}
