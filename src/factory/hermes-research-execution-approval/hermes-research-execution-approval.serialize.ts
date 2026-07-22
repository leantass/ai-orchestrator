import type { FactoryHermesResearchExecutionApprovalResult, FactoryHermesResearchExecutionApprovalSummary } from './hermes-research-execution-approval.types.ts'

export function serializeFactoryHermesResearchExecutionApprovalResult(result: FactoryHermesResearchExecutionApprovalResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesResearchExecutionApprovalResult(json: string): FactoryHermesResearchExecutionApprovalResult {
  return JSON.parse(json) as FactoryHermesResearchExecutionApprovalResult
}

export function summarizeFactoryHermesResearchExecutionApprovalResult(result: FactoryHermesResearchExecutionApprovalResult): FactoryHermesResearchExecutionApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, approvalStatus: result.approvalStatus, missingRuntimeSelectionCount: result.hermesResearchExecutionApprovalDecision.missingRuntimeSelectionCount, runtimeSelectionRequirementCount: result.runtimeSelectionRequirements.length, canProceedToRuntimeSelectionPlanning: result.canProceedToRuntimeSelectionPlanning, canProceedToResearchRuntimeAdapter: false, canRunResearchNow: false, nextStep: result.recommendedNextStep }
}
