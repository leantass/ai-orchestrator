import { DEFAULT_FACTORY_HERMES_RUNTIME_SELECTION_DECISION_POLICY, FACTORY_HERMES_RUNTIME_SELECTION_DECISION_KIND, FACTORY_HERMES_RUNTIME_SELECTION_DECISION_NEXT_STEP, FACTORY_HERMES_RUNTIME_SELECTION_DECISION_VERSION, HERMES_RUNTIME_SELECTION_RUN_ROOT, RUNTIME_SELECTION_DECISION_NOT_AUTHORIZED_ACTIONS } from './hermes-runtime-selection-decision.defaults.ts'
import type { FactoryHermesRuntimeSelectionDecisionInput, FactoryHermesRuntimeSelectionDecisionRecord, FactoryHermesRuntimeSelectionDecisionResult } from './hermes-runtime-selection-decision.types.ts'

function defaultSelection(planning: any): FactoryHermesRuntimeSelectionDecisionRecord {
  const prompt = planning?.promptSelectionCandidates?.[0] || planning?.hermesRuntimeSelectionPlanCandidate?.promptSelectionCandidates?.[0] || {}
  return {
    prompt: { promptHash: prompt.promptHash, promptTextRef: 'prompt_candidate_from_prompt_policy', candidateOnly: true, approvedForExecutionNow: false, promptSentNow: false },
    provider: { providerId: 'openai', selectedNow: true, approvedForExecutionNow: false },
    model: { modelId: 'gpt-4o-mini', exactStringRequired: true, noWildcard: true, noLatestAlias: true, selectedNow: true, approvedForExecutionNow: false },
    credential: { credentialRefName: 'OPENAI_API_KEY', valueKnown: false, valueRead: false, selectedNow: true, approvedForUseNow: false },
    network: { selectedHosts: ['api.openai.com'], approvedHostsNow: [], dnsResolvedNow: false, endpointsTestedNow: false, wildcardAllowed: false, arbitraryInternetAllowed: false, approvedForUseNow: false },
    toolsets: { selectedToolsetMode: 'no_toolsets_text_only', approvedToolsetsNow: [], selectedNow: true, approvedForExecutionNow: false, hiddenDefaultToolsetsForbidden: true, disabledToolsets: ['web', 'browser', 'terminal', 'mcp', 'filesystem'] },
    runRoot: { selectedRunRoot: HERMES_RUNTIME_SELECTION_RUN_ROOT, runRootCreatedNow: false, mustBeCreatedOnlyByFutureRuntimeAdapterIfApproved: true, approvedForFutureRuntimeOnly: true, pathContainmentRequired: true },
    finalApproval: { approvedNow: false, approvalRetryRequired: true },
  }
}

function hasCandidate(planning: any, key: string, predicate: (item: any) => boolean): boolean {
  const direct = planning?.[key] || []
  const nested = planning?.hermesRuntimeSelectionPlanCandidate?.[key] || []
  return [...direct, ...nested].some(predicate)
}

function isValidPlanning(planning: any): boolean {
  return planning?.status === 'runtime_selection_plan_created'
    && planning?.decision === 'hermes_runtime_selection_plan_created_manual_selection_required'
    && planning?.canProceedToRuntimeSelectionDecision === true
    && planning?.canProceedToResearchExecutionApprovalRetry === false
    && planning?.canProceedToResearchRuntimeAdapter === false
    && planning?.canRunResearchNow === false
}

function isValidSelection(selection: FactoryHermesRuntimeSelectionDecisionRecord, planning: any): boolean {
  return selection.provider.providerId === 'openai'
    && hasCandidate(planning, 'providerSelectionCandidates', (item) => item.providerId === 'openai')
    && selection.provider.approvedForExecutionNow === false
    && selection.model.modelId === 'gpt-4o-mini'
    && selection.model.exactStringRequired === true
    && selection.model.noWildcard === true
    && selection.model.noLatestAlias === true
    && selection.credential.credentialRefName === 'OPENAI_API_KEY'
    && hasCandidate(planning, 'credentialSelectionCandidates', (item) => item.credentialRef === 'OPENAI_API_KEY')
    && selection.credential.valueRead === false
    && selection.credential.approvedForUseNow === false
    && selection.network.selectedHosts.length === 1
    && selection.network.selectedHosts[0] === 'api.openai.com'
    && selection.network.dnsResolvedNow === false
    && selection.network.endpointsTestedNow === false
    && selection.network.wildcardAllowed === false
    && selection.network.arbitraryInternetAllowed === false
    && selection.network.approvedForUseNow === false
    && selection.toolsets.selectedToolsetMode === 'no_toolsets_text_only'
    && hasCandidate(planning, 'toolsetSelectionCandidates', (item) => item.toolsetId === 'no_toolsets_text_only')
    && selection.toolsets.approvedForExecutionNow === false
    && selection.toolsets.hiddenDefaultToolsetsForbidden === true
    && selection.runRoot.selectedRunRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/')
    && selection.runRoot.runRootCreatedNow === false
    && selection.finalApproval.approvedNow === false
    && selection.finalApproval.approvalRetryRequired === true
}

export function evaluateFactoryHermesRuntimeSelectionDecision(input: FactoryHermesRuntimeSelectionDecisionInput): FactoryHermesRuntimeSelectionDecisionResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RUNTIME_SELECTION_DECISION_POLICY, ...(input.policy || {}) }
  const planning = input.runtimeSelectionPlanningResult
  const selection = { ...defaultSelection(planning), ...(input.selection || {}) } as FactoryHermesRuntimeSelectionDecisionRecord
  const decisionId = `hermes-runtime-selection-decision:75b300f:${input.decidedAt}`
  const base = {
    decisionId, decisionKind: FACTORY_HERMES_RUNTIME_SELECTION_DECISION_KIND, decisionVersion: FACTORY_HERMES_RUNTIME_SELECTION_DECISION_VERSION, decidedAt: input.decidedAt, decidedBy: input.decidedBy, toolId: 'hermes_agent' as const, planningDecisionRef: planning?.planningId, approvalDecisionRef: input.researchExecutionApprovalResult?.approvalId, selectedPrompt: selection.prompt, selectedProvider: selection.provider, selectedModel: selection.model, selectedCredentialRef: selection.credential, selectedNetworkHosts: selection.network, selectedToolsetMode: selection.toolsets, selectedRunRoot: selection.runRoot, selectedFinalApproval: selection.finalApproval, checks: [], blockers: [], warnings: [], status: 'runtime_selection_decision_recorded' as const, decision: 'hermes_runtime_selection_decision_recorded_for_approval_retry' as const, selectionStatus: 'selected_for_approval_retry' as const, allSelectionsResolvedForApprovalRetry: true, canProceedToResearchExecutionApprovalRetry: true, canProceedToResearchRuntimeAdapter: false as const, canRunResearchNow: false as const, canExecuteHermesNow: false as const, canPassPromptNow: false as const, canUseNetworkNow: false as const, canUseCredentialsNow: false as const, canReadEnvSecretsNow: false as const, canCallModelsNow: false as const, canEnableToolsetsNow: false as const, canMutateFilesystemNow: false as const, canUseFindings: false as const, recommendedNextStep: FACTORY_HERMES_RUNTIME_SELECTION_DECISION_NEXT_STEP,
  }
  if (policy.requireRuntimeSelectionPlanning && !isValidPlanning(planning)) return { ...base, status: 'blocked', decision: 'blocked_invalid_runtime_selection_planning', selectionStatus: 'blocked', allSelectionsResolvedForApprovalRetry: false, canProceedToResearchExecutionApprovalRetry: false, blockers: [{ blockerId: 'invalid_runtime_selection_planning', message: 'Runtime selection planning result is not ready for decision.' }] }
  if (!isValidSelection(selection, planning)) return { ...base, status: 'blocked', decision: 'blocked_invalid_runtime_selection', selectionStatus: 'blocked', allSelectionsResolvedForApprovalRetry: false, canProceedToResearchExecutionApprovalRetry: false, blockers: [{ blockerId: 'invalid_runtime_selection', message: 'Runtime selection does not match Lean controlled selection or violates no-execution constraints.' }] }
  const runtimeSelectionDecisionReceipt = { receiptId: `${decisionId}:receipt`, decisionId, toolId: 'hermes_agent' as const, decidedBy: input.decidedBy, decidedAt: input.decidedAt, decision: 'hermes_runtime_selection_decision_recorded_for_approval_retry' as const, scope: 'hermes_runtime_selection_decision_only' as const, approvedNextGate: 'Factory Hermes Research Execution Approval Retry Gate v1' as const, limitations: ['Selection is recorded only for approval retry.', 'No execution, prompt passing, network, credential use, model call, toolset enablement, filesystem mutation, run root creation, ingestion, or findings promotion is authorized.'], notAuthorizedActions: RUNTIME_SELECTION_DECISION_NOT_AUTHORIZED_ACTIONS }
  return { ...base, runtimeSelectionDecisionRecord: selection, runtimeSelectionDecisionReceipt }
}
