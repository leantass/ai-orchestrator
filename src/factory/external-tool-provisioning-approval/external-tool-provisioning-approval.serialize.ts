import type { FactoryExternalToolProvisioningApprovalResult, FactoryExternalToolProvisioningApprovalSummary } from './external-tool-provisioning-approval.types.ts'

export function serializeFactoryExternalToolProvisioningApprovalResult(result: FactoryExternalToolProvisioningApprovalResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryExternalToolProvisioningApprovalResult(json: string): FactoryExternalToolProvisioningApprovalResult {
  return JSON.parse(json) as FactoryExternalToolProvisioningApprovalResult
}

export function summarizeFactoryExternalToolProvisioningApprovalResult(result: FactoryExternalToolProvisioningApprovalResult): FactoryExternalToolProvisioningApprovalSummary {
  return {
    approvalId: result.approvalId,
    toolId: result.toolId,
    targetPlatform: result.targetPlatform,
    approvedMethods: result.approvalReceipt?.approvedProvisioningMethods ?? [],
    status: result.status,
    decision: result.decision,
    installStatus: result.approvedToolProvisioningEnvelope?.installStatus,
    downloadStatus: result.approvedToolProvisioningEnvelope?.downloadStatus,
    executionStatus: result.approvedToolProvisioningEnvelope?.executionStatus,
    canInstallNow: false,
    canExecuteToolNow: false,
    nextStep: result.recommendedNextStep,
  }
}
