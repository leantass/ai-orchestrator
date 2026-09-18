import type { FactoryHermesResearchExecutionApprovalRetryResult, FactoryHermesResearchExecutionApprovalRetrySummary } from './hermes-research-execution-approval-retry.types.ts'

export function serializeFactoryHermesResearchExecutionApprovalRetryResult(result: FactoryHermesResearchExecutionApprovalRetryResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchExecutionApprovalRetryResult(text: string): FactoryHermesResearchExecutionApprovalRetryResult {
  return JSON.parse(text) as FactoryHermesResearchExecutionApprovalRetryResult
}

export function summarizeFactoryHermesResearchExecutionApprovalRetryResult(result: FactoryHermesResearchExecutionApprovalRetryResult): FactoryHermesResearchExecutionApprovalRetrySummary {
  return { retryId: result.retryId, status: result.status, decision: result.decision, canProceedToResearchExecutionApproval: result.canProceedToResearchExecutionApproval, canRunResearchNow: result.canRunResearchNow }
}
