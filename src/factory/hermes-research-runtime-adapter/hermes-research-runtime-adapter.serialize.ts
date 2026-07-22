import type { FactoryHermesResearchRuntimeAdapterResult, FactoryHermesResearchRuntimeAdapterSummary } from './hermes-research-runtime-adapter.types.ts'

export function serializeFactoryHermesResearchRuntimeAdapterResult(result: FactoryHermesResearchRuntimeAdapterResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesResearchRuntimeAdapterResult(json: string): FactoryHermesResearchRuntimeAdapterResult { return JSON.parse(json) as FactoryHermesResearchRuntimeAdapterResult }
export function summarizeFactoryHermesResearchRuntimeAdapterResult(result: FactoryHermesResearchRuntimeAdapterResult): FactoryHermesResearchRuntimeAdapterSummary {
  return { adapterRunId: result.adapterRunId, mode: result.mode, commandName: result.commandName, exitCode: result.exitCode, timedOut: result.timedOut, status: result.status, decision: result.decision, hermesExecutionStatus: result.hermesExecutionStatus, canProceedToResultIngestion: result.canProceedToResultIngestion, canTreatAsResearchResult: false, networkStatus: result.networkStatus, credentialsStatus: result.credentialsStatus, modelCallStatus: result.modelCallStatus, nextStep: result.recommendedNextStep }
}
