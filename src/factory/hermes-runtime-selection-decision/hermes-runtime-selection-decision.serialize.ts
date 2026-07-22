import type { FactoryHermesRuntimeSelectionDecisionResult, FactoryHermesRuntimeSelectionDecisionSummary } from './hermes-runtime-selection-decision.types.ts'

export function serializeFactoryHermesRuntimeSelectionDecisionResult(result: FactoryHermesRuntimeSelectionDecisionResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryHermesRuntimeSelectionDecisionResult(json: string): FactoryHermesRuntimeSelectionDecisionResult {
  return JSON.parse(json) as FactoryHermesRuntimeSelectionDecisionResult
}

export function summarizeFactoryHermesRuntimeSelectionDecisionResult(result: FactoryHermesRuntimeSelectionDecisionResult): FactoryHermesRuntimeSelectionDecisionSummary {
  return { decisionId: result.decisionId, status: result.status, decision: result.decision, providerId: result.selectedProvider.providerId, modelId: result.selectedModel.modelId, credentialRefName: result.selectedCredentialRef.credentialRefName, selectedHosts: result.selectedNetworkHosts.selectedHosts, selectedToolsetMode: result.selectedToolsetMode.selectedToolsetMode, canProceedToResearchExecutionApprovalRetry: result.canProceedToResearchExecutionApprovalRetry, canRunResearchNow: false, nextStep: result.recommendedNextStep }
}
