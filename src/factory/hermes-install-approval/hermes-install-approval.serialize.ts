import type {
  FactoryHermesInstallApprovalResult,
  FactoryHermesInstallApprovalSummary,
} from './hermes-install-approval.types.ts';

export function serializeFactoryHermesInstallApprovalResult(result: FactoryHermesInstallApprovalResult): string {
  return JSON.stringify(result, null, 2);
}

export function parseFactoryHermesInstallApprovalResult(json: string): FactoryHermesInstallApprovalResult {
  return JSON.parse(json) as FactoryHermesInstallApprovalResult;
}

export function summarizeFactoryHermesInstallApprovalResult(
  result: FactoryHermesInstallApprovalResult,
): FactoryHermesInstallApprovalSummary {
  return {
    approvalId: result.approvalId,
    auditedHead: result.auditedHead,
    remoteHead: result.remoteHead,
    headsMatch: result.headsMatch,
    decision: result.decision,
    status: result.status,
    receiptPresent: Boolean(result.approvalReceipt),
    envelopePresent: Boolean(result.approvedInstallEnvelope),
    installStatus: result.approvedInstallEnvelope?.installStatus,
    executionStatus: result.approvedInstallEnvelope?.executionStatus,
    credentialsStatus: result.approvedInstallEnvelope?.credentialsStatus,
    canInstallHermesNow: false,
    canExecuteHermes: false,
    nextStep: result.recommendedNextStep,
  };
}
