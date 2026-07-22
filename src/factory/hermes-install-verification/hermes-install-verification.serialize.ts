import type { FactoryHermesInstallVerificationResult, FactoryHermesInstallVerificationSummary } from './hermes-install-verification.types.ts';

export function serializeFactoryHermesInstallVerificationResult(result: FactoryHermesInstallVerificationResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesInstallVerificationResult(json: string): FactoryHermesInstallVerificationResult { return JSON.parse(json) as FactoryHermesInstallVerificationResult }
export function summarizeFactoryHermesInstallVerificationResult(result: FactoryHermesInstallVerificationResult): FactoryHermesInstallVerificationSummary {
  return { verificationId: result.verificationId, auditedHead: result.auditedHead, installRoot: result.installRoot, status: result.status, decision: result.decision, nodeInstallVerified: result.nodeInstallVerified, pythonInstallStatus: result.pythonInstallStatus, hermesExecutionVerifiedAsNotRun: result.hermesExecutionVerifiedAsNotRun, scriptsVerifiedAsNotRun: result.scriptsVerifiedAsNotRun, canExecuteHermes: false, nextStep: result.recommendedNextStep };
}
