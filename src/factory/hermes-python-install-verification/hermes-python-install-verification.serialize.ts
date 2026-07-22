import type { FactoryHermesPythonInstallVerificationResult, FactoryHermesPythonInstallVerificationSummary } from './hermes-python-install-verification.types.ts'

export function serializeFactoryHermesPythonInstallVerificationResult(result: FactoryHermesPythonInstallVerificationResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesPythonInstallVerificationResult(json: string): FactoryHermesPythonInstallVerificationResult {
  return JSON.parse(json) as FactoryHermesPythonInstallVerificationResult
}

export function summarizeFactoryHermesPythonInstallVerificationResult(result: FactoryHermesPythonInstallVerificationResult): FactoryHermesPythonInstallVerificationSummary {
  return { pythonInstallVerificationId: result.pythonInstallVerificationId, toolId: 'hermes_agent', auditedHead: result.auditedHead, pythonEnvRootRef: result.pythonEnvRootRef, manifestStatus: result.manifestStatus, installResultStatus: result.installResultStatus, pythonEnvStatus: result.pythonEnvStatus, pyvenvCfgStatus: result.pyvenvCfgStatus, pythonExecutableStatus: result.pythonExecutableStatus, sitePackagesStatus: result.sitePackagesStatus, uvVerificationStatus: result.uvVerificationStatus, pythonInstallStatus: result.pythonInstallStatus, pipStatus: 'not_executed', pythonDirectStatus: 'not_executed', setupPyStatus: 'not_executed', hermesExecutionStatus: 'not_allowed', canProceedToJefeReview: result.canProceedToJefeReview, canExecuteHermes: false, nextStep: result.recommendedNextStep }
}
