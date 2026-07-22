import type { FactoryHermesResearchRuntimeAdapterApprovalResult, FactoryHermesResearchRuntimeAdapterApprovalSummary } from './hermes-research-runtime-adapter-approval.types.ts'

export function serializeFactoryHermesResearchRuntimeAdapterApprovalResult(result: FactoryHermesResearchRuntimeAdapterApprovalResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchRuntimeAdapterApprovalResult(json: string): FactoryHermesResearchRuntimeAdapterApprovalResult {
  return JSON.parse(json) as FactoryHermesResearchRuntimeAdapterApprovalResult
}

export function summarizeFactoryHermesResearchRuntimeAdapterApprovalResult(result: FactoryHermesResearchRuntimeAdapterApprovalResult): FactoryHermesResearchRuntimeAdapterApprovalSummary {
  return { adapterApprovalId: result.adapterApprovalId, status: result.status, decision: result.decision, runtimeAdapterApprovalStatus: result.runtimeAdapterApprovalStatus, toolsetDisableSupportStatus: result.toolsetDisableSupportStatus, canProceedToResearchRuntimeAdapter: result.canProceedToResearchRuntimeAdapter, canRunResearchNow: false, nextStep: result.recommendedNextStep }
}
