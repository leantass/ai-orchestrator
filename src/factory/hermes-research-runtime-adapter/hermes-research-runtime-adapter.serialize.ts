import type { FactoryHermesResearchRuntimeAdapterResult, FactoryHermesResearchRuntimeAdapterSummary } from './hermes-research-runtime-adapter.types.ts'

export function serializeFactoryHermesResearchRuntimeAdapterResult(result: FactoryHermesResearchRuntimeAdapterResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchRuntimeAdapterResult(text: string): FactoryHermesResearchRuntimeAdapterResult {
  return JSON.parse(text) as FactoryHermesResearchRuntimeAdapterResult
}

export function summarizeFactoryHermesResearchRuntimeAdapterResult(result: FactoryHermesResearchRuntimeAdapterResult): FactoryHermesResearchRuntimeAdapterSummary {
  return {
    adapterId: result.adapterId,
    status: result.status,
    decision: result.decision,
    canProceedToResearchExecutionApprovalRetry: result.canProceedToResearchExecutionApprovalRetry,
    canRunResearchNow: result.canRunResearchNow,
  }
}
