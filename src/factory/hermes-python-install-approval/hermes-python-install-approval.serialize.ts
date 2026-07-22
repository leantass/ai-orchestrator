import type {
  FactoryHermesPythonInstallApprovalResult,
  FactoryHermesPythonInstallApprovalSummary,
} from './hermes-python-install-approval.types.ts';

export function serializeFactoryHermesPythonInstallApprovalResult(
  result: FactoryHermesPythonInstallApprovalResult,
): string {
  return JSON.stringify(result, null, 2);
}

export function parseFactoryHermesPythonInstallApprovalResult(json: string): FactoryHermesPythonInstallApprovalResult {
  return JSON.parse(json) as FactoryHermesPythonInstallApprovalResult;
}

export function summarizeFactoryHermesPythonInstallApprovalResult(
  result: FactoryHermesPythonInstallApprovalResult,
): FactoryHermesPythonInstallApprovalSummary {
  return {
    approvalId: result.approvalId,
    auditedHead: result.auditedHead,
    managerDecision: result.managerDecision,
    pythonInstallMethodScope: result.approvedPythonInstallEnvelope?.pythonInstallMethodScope,
    decision: result.decision,
    status: result.status,
    receiptPresent: Boolean(result.approvalReceipt),
    envelopePresent: Boolean(result.approvedPythonInstallEnvelope),
    pythonInstallStatus: result.approvedPythonInstallEnvelope?.pythonInstallStatus,
    venvStatus: result.approvedPythonInstallEnvelope?.venvStatus,
    uvStatus: result.approvedPythonInstallEnvelope?.uvStatus,
    pipStatus: result.approvedPythonInstallEnvelope?.pipStatus,
    setupPyStatus: result.approvedPythonInstallEnvelope?.setupPyStatus,
    canInstallPythonNow: false,
    canExecuteHermes: false,
    nextStep: result.recommendedNextStep,
  };
}
