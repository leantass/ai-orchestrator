import type { FactoryHermesResearchRuntimeApprovalResult, FactoryHermesResearchRuntimeApprovalSummary } from './hermes-research-runtime-approval.types.ts'

export function serializeFactoryHermesResearchRuntimeApprovalResult(result: FactoryHermesResearchRuntimeApprovalResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesResearchRuntimeApprovalResult(json: string): FactoryHermesResearchRuntimeApprovalResult { return JSON.parse(json) as FactoryHermesResearchRuntimeApprovalResult }
export function summarizeFactoryHermesResearchRuntimeApprovalResult(result: FactoryHermesResearchRuntimeApprovalResult): FactoryHermesResearchRuntimeApprovalSummary {
  const e = result.approvedHermesResearchRuntimeAdapterEnvelope
  const commandName = e?.selectedInterface.commandName || result.selectedInterface?.commandName || result.commandName || e?.boundaryContractSummary.commandName
  const pythonEntrypoint = e?.selectedInterface.pythonEntrypoint || result.selectedInterface?.pythonEntrypoint || result.pythonEntrypoint || e?.boundaryContractSummary.pythonEntrypoint
  if (!commandName || !pythonEntrypoint) throw new Error('Cannot summarize Hermes research runtime approval without selected interface identity.')
  return { approvalId: result.approvalId, selectedCandidateId: result.selectedCandidateId, commandName, pythonEntrypoint, status: result.status, decision: result.decision, canProceedToResearchRuntimeAdapter: result.canProceedToResearchRuntimeAdapter, canCreateRuntimeNow: false, canExecuteHermesNow: false, futureRuntimeNetworkAllowed: false, futureRuntimeCredentialsAllowed: false, futureRuntimeModelCallsAllowed: false, approvedNextGate: e?.approvedNextGate, nextStep: result.recommendedNextStep }
}
