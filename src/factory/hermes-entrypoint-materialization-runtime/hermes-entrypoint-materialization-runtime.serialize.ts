import type { FactoryHermesEntrypointMaterializationRuntimeResult, FactoryHermesEntrypointMaterializationRuntimeSummary } from './hermes-entrypoint-materialization-runtime.types.ts'

export function serializeFactoryHermesEntrypointMaterializationRuntimeResult(result: FactoryHermesEntrypointMaterializationRuntimeResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesEntrypointMaterializationRuntimeResult(json: string): FactoryHermesEntrypointMaterializationRuntimeResult { return JSON.parse(json) as FactoryHermesEntrypointMaterializationRuntimeResult }
export function summarizeFactoryHermesEntrypointMaterializationRuntimeResult(result: FactoryHermesEntrypointMaterializationRuntimeResult): FactoryHermesEntrypointMaterializationRuntimeSummary {
  return {
    materializationRunId: result.materializationRunId,
    commandName: result.commandName,
    pythonEntrypoint: result.pythonEntrypoint,
    status: result.status,
    decision: result.decision,
    materializationStatus: result.materializationStatus,
    executableStatusAfter: result.executableStatusAfter,
    expectedExecutableRef: result.expectedExecutableRef,
    canProceedToEntrypointMaterializationVerification: result.canProceedToEntrypointMaterializationVerification,
    canRetryResearchAdapterNow: false,
    canExecuteHermesNow: false,
    nextStep: result.recommendedNextStep,
  }
}
