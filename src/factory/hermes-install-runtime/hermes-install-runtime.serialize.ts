import type { FactoryHermesInstallRuntimeResult, FactoryHermesInstallRuntimeSummary } from './hermes-install-runtime.types.ts';

export function serializeFactoryHermesInstallRuntimeResult(result: FactoryHermesInstallRuntimeResult): string {
  return JSON.stringify(result, null, 2);
}

export function parseFactoryHermesInstallRuntimeResult(json: string): FactoryHermesInstallRuntimeResult {
  return JSON.parse(json) as FactoryHermesInstallRuntimeResult;
}

export function summarizeFactoryHermesInstallRuntimeResult(result: FactoryHermesInstallRuntimeResult): FactoryHermesInstallRuntimeSummary {
  return {
    installRuntimeId: result.installRuntimeId,
    auditedHead: result.auditedHead,
    installRoot: result.installRoot,
    nodeInstallStatus: result.nodeInstallStatus,
    pythonInstallStatus: result.pythonInstallStatus,
    dependenciesInstalled: result.manifest?.dependenciesInstalled ?? false,
    scriptsExecuted: false,
    hermesExecutionStatus: 'not_allowed',
    canExecuteHermes: false,
    nextStep: result.recommendedNextStep,
  };
}
