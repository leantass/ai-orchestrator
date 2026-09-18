import type { FactoryHermesResearchExecutionApprovalResult, FactoryHermesResearchExecutionApprovalSummary } from './hermes-research-execution-approval.types.ts'

export function serializeFactoryHermesResearchExecutionApprovalResult(result: FactoryHermesResearchExecutionApprovalResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchExecutionApprovalResult(text: string): FactoryHermesResearchExecutionApprovalResult {
  return JSON.parse(text) as FactoryHermesResearchExecutionApprovalResult
}

export function summarizeFactoryHermesResearchExecutionApprovalResult(result: FactoryHermesResearchExecutionApprovalResult): FactoryHermesResearchExecutionApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, canProceedToControlledResearchRuntimePlanning: result.canProceedToControlledResearchRuntimePlanning, canRunResearchNow: result.canRunResearchNow }
}
