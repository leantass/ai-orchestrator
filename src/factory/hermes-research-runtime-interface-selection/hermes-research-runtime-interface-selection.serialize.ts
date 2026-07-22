import type { FactoryHermesResearchRuntimeInterfaceSelectionResult, FactoryHermesResearchRuntimeInterfaceSelectionSummary } from './hermes-research-runtime-interface-selection.types.ts'

export function serializeFactoryHermesResearchRuntimeInterfaceSelectionResult(result: FactoryHermesResearchRuntimeInterfaceSelectionResult): string {
  return JSON.stringify(result, null, 2)
}
export function parseFactoryHermesResearchRuntimeInterfaceSelectionResult(json: string): FactoryHermesResearchRuntimeInterfaceSelectionResult {
  return JSON.parse(json) as FactoryHermesResearchRuntimeInterfaceSelectionResult
}
export function summarizeFactoryHermesResearchRuntimeInterfaceSelectionResult(result: FactoryHermesResearchRuntimeInterfaceSelectionResult): FactoryHermesResearchRuntimeInterfaceSelectionSummary {
  return { interfaceSelectionId: result.interfaceSelectionId, selectedCandidateId: result.selectedCandidateId, commandName: result.selectedInterface?.commandName, pythonEntrypoint: result.selectedInterface?.pythonEntrypoint, status: result.status, decision: result.decision, canProceedToResearchRuntimeBoundary: result.canProceedToResearchRuntimeBoundary, canExecuteHermes: false, approvedNextGate: result.selectedHermesResearchRuntimeInterfaceEnvelope?.approvedNextGate, nextStep: result.recommendedNextStep }
}
