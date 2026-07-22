import { FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_VERSION } from './hermes-research-runtime-adapter-approval.defaults.ts'
import type { FactoryHermesResearchRuntimeAdapterApprovalInput, FactoryHermesResearchRuntimeAdapterApprovalResult, FactoryHermesResearchRuntimeAdapterApprovalValidationResult } from './hermes-research-runtime-adapter-approval.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|process\.env|\.env|full stdout|full stderr|full source)/iu

export function validateFactoryHermesResearchRuntimeAdapterApprovalInput(input: FactoryHermesResearchRuntimeAdapterApprovalInput): FactoryHermesResearchRuntimeAdapterApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.evaluatedAt) errors.push('evaluatedAt is required.')
  if (!input?.evaluatedBy) errors.push('evaluatedBy is required.')
  if (!input?.finalExecutionApprovalResult) errors.push('finalExecutionApprovalResult is required.')
  if (!input?.runtimeSelectionDecisionResult) errors.push('runtimeSelectionDecisionResult is required.')
  if (SECRETISH.test(JSON.stringify({ evaluationNotes: input?.evaluationNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResearchRuntimeAdapterApprovalResult(result: FactoryHermesResearchRuntimeAdapterApprovalResult): FactoryHermesResearchRuntimeAdapterApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.adapterApprovalKind !== FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_KIND) errors.push('adapterApprovalKind mismatch.')
  if (result.adapterApprovalVersion !== FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_VERSION) errors.push('adapterApprovalVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (!['research_runtime_adapter_approval_granted', 'research_runtime_adapter_approval_blocked'].includes(result.status)) errors.push('status mismatch.')
  if (result.status === 'research_runtime_adapter_approval_granted') {
    const e = result.approvedResearchRuntimeAdapterEnvelope
    if (!e) errors.push('approvedResearchRuntimeAdapterEnvelope required when granted.')
    if (e && (e.commandEnvelope.shell !== false || e.commandEnvelope.oneShotOnly !== true || e.credentialEnvelope.credentialRefName !== 'OPENAI_API_KEY' || e.credentialEnvelope.valueReadNow !== false || e.networkEnvelope.allowedHosts[0] !== 'api.openai.com' || e.networkEnvelope.networkUsedNow !== false || e.toolsetEnvelope.selectedToolsetMode !== 'no_toolsets_text_only' || e.toolsetEnvelope.toolsetDisableSupportStatus === 'unverified_requires_toolset_disable_verification' || !e.filesystemEnvelope.runRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/') || e.filesystemEnvelope.runRootCreatedNow !== false || e.timeoutEnvelope.commandTimeoutMs !== 120000 || e.outputEnvelope.stdoutPreviewLimitBytes !== 12000)) errors.push('adapter envelope mismatch.')
    if (result.canProceedToResearchRuntimeAdapter !== true) errors.push('canProceedToResearchRuntimeAdapter must be true when granted.')
  } else {
    if (result.decision !== 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified') errors.push('blocked decision mismatch.')
    if (result.canProceedToResearchRuntimeAdapter !== false) errors.push('canProceedToResearchRuntimeAdapter must be false when blocked.')
    if (result.canProceedToToolsetDisableVerificationPlanning !== true) errors.push('canProceedToToolsetDisableVerificationPlanning must be true when blocked.')
  }
  for (const key of ['canProceedToResearchExecutionRuntime', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'execute_hermes_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now']) if (!result.researchRuntimeAdapterApprovalReceipt.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (SECRETISH.test(JSON.stringify({ receipt: result.researchRuntimeAdapterApprovalReceipt }))) errors.push('result summary fields appear to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
