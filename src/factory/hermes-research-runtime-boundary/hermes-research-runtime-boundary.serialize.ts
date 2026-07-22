import type { FactoryHermesResearchRuntimeBoundaryResult, FactoryHermesResearchRuntimeBoundarySummary } from './hermes-research-runtime-boundary.types.ts'

export function serializeFactoryHermesResearchRuntimeBoundaryResult(result: FactoryHermesResearchRuntimeBoundaryResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesResearchRuntimeBoundaryResult(json: string): FactoryHermesResearchRuntimeBoundaryResult { return JSON.parse(json) as FactoryHermesResearchRuntimeBoundaryResult }
export function summarizeFactoryHermesResearchRuntimeBoundaryResult(result: FactoryHermesResearchRuntimeBoundaryResult): FactoryHermesResearchRuntimeBoundarySummary {
  const c = result.hermesResearchRuntimeBoundaryContract
  return { boundaryId: result.boundaryId, selectedCandidateId: result.selectedCandidateId, commandName: c?.commandName, status: result.status, decision: result.decision, canProceedToResearchRuntimeApproval: result.canProceedToResearchRuntimeApproval, canCreateRuntimeNow: false, canExecuteHermes: false, networkAllowedNow: false, credentialsAllowedNow: false, modelCallsAllowedNow: false, approvedNextGate: result.researchRuntimeBoundaryReceipt?.approvedNextGate, nextStep: result.recommendedNextStep }
}
