import { APPROVAL_RETRY_NO_EXECUTION_ACTIONS, APPROVAL_RETRY_NOT_AUTHORIZED_ACTIONS, DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_POLICY, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_NEXT_STEP, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_VERSION } from './hermes-research-execution-approval-retry.defaults.ts'
import type { FactoryHermesResearchExecutionApprovalRetryInput, FactoryHermesResearchExecutionApprovalRetryResult, FactoryHermesValidatedRuntimeSelections } from './hermes-research-execution-approval-retry.types.ts'

function validSelection(decision: any): boolean {
  return decision?.status === 'runtime_selection_decision_recorded'
    && decision?.decision === 'hermes_runtime_selection_decision_recorded_for_approval_retry'
    && decision?.selectionStatus === 'selected_for_approval_retry'
    && decision?.selectedProvider?.providerId === 'openai'
    && decision?.selectedModel?.modelId === 'gpt-4o-mini'
    && decision?.selectedCredentialRef?.credentialRefName === 'OPENAI_API_KEY'
    && decision?.selectedCredentialRef?.valueRead === false
    && decision?.selectedNetworkHosts?.selectedHosts?.includes('api.openai.com')
    && decision?.selectedNetworkHosts?.dnsResolvedNow === false
    && decision?.selectedNetworkHosts?.endpointsTestedNow === false
    && decision?.selectedToolsetMode?.selectedToolsetMode === 'no_toolsets_text_only'
    && decision?.selectedRunRoot?.selectedRunRoot?.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/')
    && decision?.selectedRunRoot?.runRootCreatedNow === false
    && decision?.selectedFinalApproval?.approvedNow === false
    && decision?.allSelectionsResolvedForApprovalRetry === true
    && decision?.canProceedToResearchExecutionApprovalRetry === true
    && decision?.canProceedToResearchRuntimeAdapter === false
    && decision?.canRunResearchNow === false
}

function validated(decision: any): FactoryHermesValidatedRuntimeSelections {
  return {
    prompt: { promptHash: decision.selectedPrompt?.promptHash, promptSentNow: false, approvedForExecutionNow: false, validationStatus: 'valid_for_final_approval_gate' },
    provider: { providerId: 'openai', selectedNow: true, approvedForExecutionNow: false, validationStatus: 'valid_for_final_approval_gate' },
    model: { modelId: 'gpt-4o-mini', exactStringRequired: true, approvedForExecutionNow: false, validationStatus: 'valid_for_final_approval_gate' },
    credential: { credentialRefName: 'OPENAI_API_KEY', valueKnown: false, valueRead: false, approvedForUseNow: false, validationStatus: 'valid_reference_only_for_final_approval_gate' },
    network: { selectedHosts: ['api.openai.com'], approvedHostsNow: [], dnsResolvedNow: false, endpointsTestedNow: false, wildcardAllowed: false, arbitraryInternetAllowed: false, approvedForUseNow: false, validationStatus: 'valid_host_candidate_for_final_approval_gate' },
    toolsets: { selectedToolsetMode: 'no_toolsets_text_only', approvedToolsetsNow: [], hiddenDefaultToolsetsForbidden: true, approvedForExecutionNow: false, validationStatus: 'valid_for_final_approval_gate_or_manual_review_if_not_supported' },
    runRoot: { selectedRunRoot: decision.selectedRunRoot.selectedRunRoot, runRootCreatedNow: false, approvedForFutureRuntimeOnly: true, validationStatus: 'valid_for_final_approval_gate' },
    finalApproval: { approvedNow: false, validationStatus: 'missing_required_final_approval' },
  }
}

export function evaluateFactoryHermesResearchExecutionApprovalRetry(input: FactoryHermesResearchExecutionApprovalRetryInput): FactoryHermesResearchExecutionApprovalRetryResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_POLICY, ...(input.policy || {}) }
  const selectionDecision = input.runtimeSelectionDecisionResult
  const approvalRetryId = `hermes-research-execution-approval-retry:75b300f:${input.evaluatedAt}`
  const base = { approvalRetryId, approvalRetryKind: FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_KIND, approvalRetryVersion: FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_VERSION, evaluatedAt: input.evaluatedAt, evaluatedBy: input.evaluatedBy, toolId: 'hermes_agent' as const, runtimeSelectionDecisionRef: selectionDecision?.decisionId, approvalDecisionRef: input.researchExecutionApprovalResult?.approvalId, boundaryDecisionRef: input.researchExecutionBoundaryPlanningResult?.planningId, checks: [], blockers: [], warnings: [], status: 'research_execution_approval_retry_blocked' as const, decision: 'hermes_research_execution_approval_retry_blocked_final_execution_approval_required' as const, approvalRetryStatus: 'not_approved' as const, runtimeSelectionsValidated: true, finalExecutionApprovalRequired: true, canProceedToFinalExecutionApprovalGate: true, canProceedToResearchRuntimeAdapter: false as const, canProceedToResearchExecutionRuntime: false as const, canRunResearchNow: false as const, canExecuteHermesNow: false as const, canPassPromptNow: false as const, canUseNetworkNow: false as const, canUseCredentialsNow: false as const, canReadEnvSecretsNow: false as const, canCallModelsNow: false as const, canEnableToolsetsNow: false as const, canMutateFilesystemNow: false as const, canUseFindings: false as const, recommendedNextStep: FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_NEXT_STEP }
  if (policy.requireRuntimeSelectionDecision && !validSelection(selectionDecision)) return { ...base, status: 'blocked', decision: 'blocked_invalid_runtime_selection_decision', runtimeSelectionsValidated: false, canProceedToFinalExecutionApprovalGate: false, blockers: [{ blockerId: 'invalid_runtime_selection_decision', message: 'Runtime selection decision is missing or invalid for approval retry.' }] }
  const validatedRuntimeSelections = validated(selectionDecision)
  const finalExecutionApprovalRequirement = { requirementId: 'final_execution_approval' as const, status: 'required_not_satisfied' as const, blocksExecutionNow: true as const, reason: 'finalExecutionApproval.approvedNow is false', requiredBefore: ['research_runtime_adapter', 'research_execution_runtime', 'model_calls', 'network_use', 'credential_use', 'prompt_passing'], expectedFutureEvidence: ['explicit human/gate approval', 'selected prompt hash', 'provider/model confirmation', 'credential ref confirmation', 'allowed host confirmation', 'toolset mode confirmation', 'run root confirmation', 'final approval timestamp/id'] }
  const hermesResearchExecutionApprovalRetryDecision = { decisionId: `${approvalRetryId}:decision`, toolId: 'hermes_agent' as const, approvalRetryStatus: 'not_approved' as const, decision: 'hermes_research_execution_approval_retry_blocked_final_execution_approval_required' as const, reason: 'final_execution_approval_required' as const, runtimeSelectionsValidated: true as const, finalExecutionApprovalRequired: true as const, finalExecutionApprovalSatisfied: false as const, executionApproved: false as const, runtimeAdapterApproved: false as const, researchRuntimeApproved: false as const, canProceedToFinalExecutionApprovalGate: true as const, requiredNextGate: 'Factory Hermes Final Execution Approval Gate v1' as const, noExecutionAuthorizedActions: APPROVAL_RETRY_NO_EXECUTION_ACTIONS }
  const approvalRetryBlockerPlan = { blockerPlanId: `${approvalRetryId}:blocker-plan`, toolId: 'hermes_agent' as const, blockerType: 'final_execution_approval_required' as const, blockers: ['finalExecutionApprovalMissing'] as ['finalExecutionApprovalMissing'], resolutionOrder: ['Factory Hermes Final Execution Approval Gate v1', 'Factory Hermes Research Runtime Adapter Approval Gate v1', 'Factory Hermes Research Runtime Adapter v1', 'Factory Hermes Research Execution Result Ingestion Gate v1', 'Factory Hermes Research Execution JEFE Review Gate v1'], nextGateCandidate: 'Factory Hermes Final Execution Approval Gate v1' as const, canProceedToFinalExecutionApprovalGate: true as const, canProceedToResearchRuntimeAdapter: false as const, executionRemainsBlocked: true as const }
  const researchExecutionApprovalRetryReceipt = { receiptId: `${approvalRetryId}:receipt`, approvalRetryId, toolId: 'hermes_agent' as const, evaluatedBy: input.evaluatedBy, evaluatedAt: input.evaluatedAt, decision: 'hermes_research_execution_approval_retry_blocked_final_execution_approval_required' as const, approvalRetryStatus: 'not_approved' as const, scope: 'hermes_research_execution_approval_retry_evaluation_only' as const, approvedNextGate: 'Factory Hermes Final Execution Approval Gate v1' as const, limitations: ['Runtime selections are valid only for final approval review.', 'Final execution approval is missing.', 'No runtime adapter, execution, prompt passing, network, credentials, model calls, toolsets, filesystem mutation, ingestion, or findings use is authorized.'], notAuthorizedActions: APPROVAL_RETRY_NOT_AUTHORIZED_ACTIONS }
  return { ...base, validatedRuntimeSelections, finalExecutionApprovalRequirement, hermesResearchExecutionApprovalRetryDecision, researchExecutionApprovalRetryReceipt, approvalRetryBlockerPlan }
}
