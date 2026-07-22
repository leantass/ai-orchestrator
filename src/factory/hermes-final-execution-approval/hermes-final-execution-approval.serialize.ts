import type { FactoryHermesFinalExecutionApprovalResult, FactoryHermesFinalExecutionApprovalSummary } from './hermes-final-execution-approval.types.ts'

export function serializeFactoryHermesFinalExecutionApprovalResult(result: FactoryHermesFinalExecutionApprovalResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesFinalExecutionApprovalResult(json: string): FactoryHermesFinalExecutionApprovalResult {
  return JSON.parse(json) as FactoryHermesFinalExecutionApprovalResult
}

export function summarizeFactoryHermesFinalExecutionApprovalResult(result: FactoryHermesFinalExecutionApprovalResult): FactoryHermesFinalExecutionApprovalSummary {
  return { finalApprovalId: result.finalApprovalId, status: result.status, decision: result.decision, finalExecutionApprovalStatus: result.finalExecutionApprovalStatus, canProceedToResearchRuntimeAdapterApproval: result.canProceedToResearchRuntimeAdapterApproval, canProceedToResearchRuntimeAdapter: false, canRunResearchNow: false, nextStep: result.recommendedNextStep }
}
