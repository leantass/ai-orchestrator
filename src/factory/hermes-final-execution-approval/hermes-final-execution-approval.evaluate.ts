import { DEFAULT_FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_POLICY, FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_KIND, FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_NEXT_STEP, FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_VERSION, FINAL_EXECUTION_APPROVAL_NO_EXECUTION_ACTIONS, FINAL_EXECUTION_APPROVAL_NOT_AUTHORIZED_ACTIONS } from './hermes-final-execution-approval.defaults.ts'
import type { FactoryHermesApprovedRuntimeSelectionSnapshot, FactoryHermesFinalExecutionApprovalInput, FactoryHermesFinalExecutionApprovalResult } from './hermes-final-execution-approval.types.ts'

function validRetry(retry: any): boolean {
  return retry?.status === 'research_execution_approval_retry_blocked'
    && retry?.decision === 'hermes_research_execution_approval_retry_blocked_final_execution_approval_required'
    && retry?.approvalRetryStatus === 'not_approved'
    && retry?.runtimeSelectionsValidated === true
    && retry?.finalExecutionApprovalRequired === true
    && retry?.hermesResearchExecutionApprovalRetryDecision?.finalExecutionApprovalSatisfied === false
    && retry?.canProceedToFinalExecutionApprovalGate === true
    && retry?.canProceedToResearchRuntimeAdapter === false
    && retry?.canRunResearchNow === false
}

function validSelection(selection: any): boolean {
  return selection?.status === 'runtime_selection_decision_recorded'
    && selection?.selectedProvider?.providerId === 'openai'
    && selection?.selectedModel?.modelId === 'gpt-4o-mini'
    && selection?.selectedCredentialRef?.credentialRefName === 'OPENAI_API_KEY'
    && selection?.selectedCredentialRef?.valueRead === false
    && selection?.selectedNetworkHosts?.selectedHosts?.includes('api.openai.com')
    && selection?.selectedNetworkHosts?.dnsResolvedNow === false
    && selection?.selectedNetworkHosts?.endpointsTestedNow === false
    && selection?.selectedToolsetMode?.selectedToolsetMode === 'no_toolsets_text_only'
    && selection?.selectedRunRoot?.selectedRunRoot?.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/')
    && selection?.selectedRunRoot?.runRootCreatedNow === false
    && selection?.selectedFinalApproval?.approvedNow === false
    && selection?.allSelectionsResolvedForApprovalRetry === true
}

function snapshot(selection: any): FactoryHermesApprovedRuntimeSelectionSnapshot {
  return {
    prompt: { promptHash: selection.selectedPrompt?.promptHash, promptRef: 'prompt_candidate_from_prompt_policy', approvedForNextGateOnly: true, promptSentNow: false },
    provider: { providerId: 'openai', approvedForNextGateOnly: true, providerUsedNow: false },
    model: { modelId: 'gpt-4o-mini', exactStringRequired: true, approvedForNextGateOnly: true, modelCalledNow: false },
    credential: { credentialRefName: 'OPENAI_API_KEY', valueKnown: false, valueRead: false, approvedForNextGateOnly: true, credentialUsedNow: false },
    network: { approvedHostsForNextGate: ['api.openai.com'], dnsResolvedNow: false, endpointsTestedNow: false, networkUsedNow: false, wildcardAllowed: false, arbitraryInternetAllowed: false },
    toolsets: { approvedToolsetModeForNextGate: 'no_toolsets_text_only', toolsetsEnabledNow: false, hiddenDefaultToolsetsForbidden: true },
    runRoot: { approvedRunRootForNextGate: selection.selectedRunRoot.selectedRunRoot, runRootCreatedNow: false, mustBeCreatedOnlyByApprovedRuntimeAdapter: true },
    finalApproval: { approvedNow: true, approvedForNextGateOnly: true, runtimeAdapterApprovedNow: false, executionRuntimeApprovedNow: false },
  }
}

export function evaluateFactoryHermesFinalExecutionApproval(input: FactoryHermesFinalExecutionApprovalInput): FactoryHermesFinalExecutionApprovalResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_POLICY, ...(input.policy || {}) }
  const retry = input.researchExecutionApprovalRetryResult
  const selection = input.runtimeSelectionDecisionResult
  const finalApprovalId = `hermes-final-execution-approval:75b300f:${input.approvedAt}`
  const base = { finalApprovalId, finalApprovalKind: FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_KIND, finalApprovalVersion: FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'hermes_agent' as const, approvalRetryDecisionRef: retry?.approvalRetryId, runtimeSelectionDecisionRef: selection?.decisionId, checks: [], blockers: [], warnings: [], status: 'final_execution_approval_recorded' as const, decision: 'hermes_final_execution_approval_recorded_for_runtime_adapter_approval' as const, finalExecutionApprovalStatus: 'approved_for_runtime_adapter_approval' as const, canProceedToResearchRuntimeAdapterApproval: true, canProceedToResearchRuntimeAdapter: false as const, canProceedToResearchExecutionRuntime: false as const, canRunResearchNow: false as const, canExecuteHermesNow: false as const, canPassPromptNow: false as const, canUseNetworkNow: false as const, canUseCredentialsNow: false as const, canReadEnvSecretsNow: false as const, canCallModelsNow: false as const, canEnableToolsetsNow: false as const, canMutateFilesystemNow: false as const, canUseFindings: false as const, recommendedNextStep: FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_NEXT_STEP }
  if (policy.requireApprovalRetryBlockedByFinalApproval && !validRetry(retry)) return { ...base, status: 'blocked', decision: 'blocked_invalid_approval_retry', canProceedToResearchRuntimeAdapterApproval: false, blockers: [{ blockerId: 'invalid_approval_retry', message: 'Approval retry result is not blocked by missing final execution approval.' }] }
  if (policy.requireRuntimeSelectionDecision && !validSelection(selection)) return { ...base, status: 'blocked', decision: 'blocked_invalid_runtime_selection_decision', canProceedToResearchRuntimeAdapterApproval: false, blockers: [{ blockerId: 'invalid_runtime_selection_decision', message: 'Runtime selection decision is missing or invalid.' }] }
  const approvedRuntimeSelectionSnapshot = snapshot(selection)
  const runtimeAdapterApprovalRequirement = { requirementId: 'research_runtime_adapter_approval' as const, status: 'required_not_satisfied' as const, blocksRuntimeAdapterNow: true as const, reason: 'final approval is recorded, but runtime adapter still requires separate approval gate.', requiredBefore: ['research_runtime_adapter', 'research_execution_runtime', 'model_calls', 'network_use', 'credential_use', 'prompt_passing'], expectedFutureEvidence: ['final approval artifact', 'approved runtime selection snapshot', 'adapter manifest candidate', 'exact command', 'exact env injection plan', 'exact timeout plan', 'exact filesystem run root creation plan', 'exact output capture plan'] }
  const hermesFinalExecutionApprovalDecision = { decisionId: `${finalApprovalId}:decision`, toolId: 'hermes_agent' as const, finalExecutionApprovalStatus: 'approved_for_runtime_adapter_approval' as const, decision: 'hermes_final_execution_approval_recorded_for_runtime_adapter_approval' as const, reason: 'final_execution_approval_recorded_next_gate_only' as const, finalExecutionApproved: true as const, runtimeSelectionsApprovedForNextGate: true as const, runtimeAdapterApproved: false as const, researchRuntimeApproved: false as const, executionApprovedNow: false as const, canProceedToResearchRuntimeAdapterApproval: true as const, requiredNextGate: 'Factory Hermes Research Runtime Adapter Approval Gate v1' as const, noExecutionAuthorizedActions: FINAL_EXECUTION_APPROVAL_NO_EXECUTION_ACTIONS }
  const finalExecutionApprovalReceipt = { receiptId: `${finalApprovalId}:receipt`, finalApprovalId, toolId: 'hermes_agent' as const, approvedBy: input.approvedBy, approvedAt: input.approvedAt, decision: 'hermes_final_execution_approval_recorded_for_runtime_adapter_approval' as const, finalExecutionApprovalStatus: 'approved_for_runtime_adapter_approval' as const, scope: 'hermes_final_execution_approval_for_next_gate_only' as const, approvedNextGate: 'Factory Hermes Research Runtime Adapter Approval Gate v1' as const, limitations: ['Final approval is recorded for the next gate only.', 'Runtime adapter, execution runtime, prompt passing, network, credentials, model calls, toolsets, filesystem mutation, ingestion, and findings remain blocked.'], notAuthorizedActions: FINAL_EXECUTION_APPROVAL_NOT_AUTHORIZED_ACTIONS }
  return { ...base, approvedRuntimeSelectionSnapshot, runtimeAdapterApprovalRequirement, hermesFinalExecutionApprovalDecision, finalExecutionApprovalReceipt }
}
