import type { FactoryHermesEntrypointMaterializationRuntimeRetryResult, FactoryHermesEntrypointMaterializationRuntimeRetrySummary } from './hermes-entrypoint-materialization-runtime-retry.types.ts'

export function serializeFactoryHermesEntrypointMaterializationRuntimeRetryResult(result: FactoryHermesEntrypointMaterializationRuntimeRetryResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesEntrypointMaterializationRuntimeRetryResult(json: string): FactoryHermesEntrypointMaterializationRuntimeRetryResult {
  return JSON.parse(json) as FactoryHermesEntrypointMaterializationRuntimeRetryResult
}

export function summarizeFactoryHermesEntrypointMaterializationRuntimeRetryResult(result: FactoryHermesEntrypointMaterializationRuntimeRetryResult): FactoryHermesEntrypointMaterializationRuntimeRetrySummary {
  return {
    retryRunId: result.retryRunId,
    commandName: result.commandName,
    pythonEntrypoint: result.pythonEntrypoint,
    status: result.status,
    decision: result.decision,
    materializationStatus: result.materializationStatus,
    executableStatusAfter: result.executableStatusAfter,
    expectedExecutableRef: result.expectedExecutableRef,
    sourceMutationStatus: result.sourceMutationStatus,
    canProceedToEntrypointMaterializationVerification: result.canProceedToEntrypointMaterializationVerification,
    canRetryResearchAdapterNow: false,
    canExecuteHermesNow: false,
    nextStep: result.recommendedNextStep
  }
}
