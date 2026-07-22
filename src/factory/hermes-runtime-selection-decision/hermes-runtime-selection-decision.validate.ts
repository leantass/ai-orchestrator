import { FACTORY_HERMES_RUNTIME_SELECTION_DECISION_KIND, FACTORY_HERMES_RUNTIME_SELECTION_DECISION_VERSION } from './hermes-runtime-selection-decision.defaults.ts'
import type { FactoryHermesRuntimeSelectionDecisionInput, FactoryHermesRuntimeSelectionDecisionResult, FactoryHermesRuntimeSelectionDecisionValidationResult } from './hermes-runtime-selection-decision.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|process\.env|\.env|full stdout|full stderr|full source)/iu

export function validateFactoryHermesRuntimeSelectionDecisionInput(input: FactoryHermesRuntimeSelectionDecisionInput): FactoryHermesRuntimeSelectionDecisionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.decidedAt) errors.push('decidedAt is required.')
  if (!input?.decidedBy) errors.push('decidedBy is required.')
  if (!input?.runtimeSelectionPlanningResult) errors.push('runtimeSelectionPlanningResult is required.')
  if (SECRETISH.test(JSON.stringify({ decisionNotes: input?.decisionNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesRuntimeSelectionDecisionResult(result: FactoryHermesRuntimeSelectionDecisionResult): FactoryHermesRuntimeSelectionDecisionValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.decisionKind !== FACTORY_HERMES_RUNTIME_SELECTION_DECISION_KIND) errors.push('decisionKind mismatch.')
  if (result.decisionVersion !== FACTORY_HERMES_RUNTIME_SELECTION_DECISION_VERSION) errors.push('decisionVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'runtime_selection_decision_recorded') errors.push('status must be runtime_selection_decision_recorded.')
  if (result.decision !== 'hermes_runtime_selection_decision_recorded_for_approval_retry') errors.push('decision mismatch.')
  if (result.selectionStatus !== 'selected_for_approval_retry') errors.push('selectionStatus mismatch.')
  if (!result.runtimeSelectionDecisionRecord) errors.push('runtimeSelectionDecisionRecord required.')
  if (!result.runtimeSelectionDecisionReceipt) errors.push('runtimeSelectionDecisionReceipt required.')
  if (result.selectedProvider.providerId !== 'openai') errors.push('provider must be openai.')
  if (result.selectedModel.modelId !== 'gpt-4o-mini' || result.selectedModel.exactStringRequired !== true || result.selectedModel.noWildcard !== true || result.selectedModel.noLatestAlias !== true) errors.push('model selection must be exact gpt-4o-mini without wildcard/latest.')
  if (result.selectedCredentialRef.credentialRefName !== 'OPENAI_API_KEY' || result.selectedCredentialRef.valueRead !== false || result.selectedCredentialRef.valueKnown !== false || result.selectedCredentialRef.approvedForUseNow !== false) errors.push('credential ref must remain unread and not approved for use.')
  if (result.selectedNetworkHosts.selectedHosts[0] !== 'api.openai.com' || result.selectedNetworkHosts.dnsResolvedNow !== false || result.selectedNetworkHosts.endpointsTestedNow !== false || result.selectedNetworkHosts.approvedForUseNow !== false) errors.push('network host selection must not use network.')
  if (result.selectedToolsetMode.selectedToolsetMode !== 'no_toolsets_text_only' || result.selectedToolsetMode.approvedForExecutionNow !== false) errors.push('toolsets must remain disabled.')
  if (!result.selectedRunRoot.selectedRunRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/') || result.selectedRunRoot.runRootCreatedNow !== false) errors.push('run root must be under .codex-temp and not created.')
  if (result.selectedFinalApproval.approvedNow !== false || result.selectedFinalApproval.approvalRetryRequired !== true) errors.push('final approval must remain false and retry required.')
  if (result.allSelectionsResolvedForApprovalRetry !== true) errors.push('allSelectionsResolvedForApprovalRetry must be true.')
  if (result.canProceedToResearchExecutionApprovalRetry !== true) errors.push('canProceedToResearchExecutionApprovalRetry must be true.')
  for (const key of ['canProceedToResearchRuntimeAdapter', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now']) if (!result.runtimeSelectionDecisionReceipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep required.')
  if (SECRETISH.test(JSON.stringify({ receipt: result.runtimeSelectionDecisionReceipt, summaryFields: { decisionId: result.decisionId, provider: result.selectedProvider.providerId } }))) errors.push('result summary fields appear to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
