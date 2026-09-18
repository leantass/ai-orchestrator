import type { FactoryHermesResearchRuntimeAdapterApprovalRetryResult, FactoryHermesResearchRuntimeAdapterApprovalRetrySummary } from './hermes-research-runtime-adapter-approval-retry.types.ts'

export function serializeFactoryHermesResearchRuntimeAdapterApprovalRetryResult(result: FactoryHermesResearchRuntimeAdapterApprovalRetryResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchRuntimeAdapterApprovalRetryResult(text: string): FactoryHermesResearchRuntimeAdapterApprovalRetryResult {
  return JSON.parse(text) as FactoryHermesResearchRuntimeAdapterApprovalRetryResult
}

export function summarizeFactoryHermesResearchRuntimeAdapterApprovalRetryResult(result: FactoryHermesResearchRuntimeAdapterApprovalRetryResult): FactoryHermesResearchRuntimeAdapterApprovalRetrySummary {
  return {
    retryId: result.retryId,
    status: result.status,
    decision: result.decision,
    canProceedToResearchRuntimeAdapter: result.canProceedToResearchRuntimeAdapter,
    canRunResearchNow: result.canRunResearchNow,
  }
}
