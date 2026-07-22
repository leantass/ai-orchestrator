import type { FactoryHermesPythonInstallRuntimeResult, FactoryHermesPythonInstallRuntimeSummary } from './hermes-python-install-runtime.types.ts';

export function serializeFactoryHermesPythonInstallRuntimeResult(result: FactoryHermesPythonInstallRuntimeResult): string {
  return JSON.stringify(result, null, 2);
}

export function parseFactoryHermesPythonInstallRuntimeResult(json: string): FactoryHermesPythonInstallRuntimeResult {
  return JSON.parse(json) as FactoryHermesPythonInstallRuntimeResult;
}

export function summarizeFactoryHermesPythonInstallRuntimeResult(result: FactoryHermesPythonInstallRuntimeResult): FactoryHermesPythonInstallRuntimeSummary {
  return {
    pythonInstallRuntimeId: result.pythonInstallRuntimeId,
    auditedHead: result.auditedHead,
    sourceRootRef: result.sourceRootRef,
    pythonEnvRootRef: result.pythonEnvRootRef,
    managerDecision: result.managerDecision,
    methodScope: result.pythonInstallMethodScope,
    pythonInstallStatus: result.pythonInstallStatus,
    venvStatus: result.venvStatus,
    uvStatus: result.uvStatus,
    pipStatus: result.pipStatus,
    setupPyStatus: result.setupPyStatus,
    hermesExecutionStatus: result.hermesExecutionStatus,
    canExecuteHermes: false,
    nextStep: result.recommendedNextStep,
  };
}
