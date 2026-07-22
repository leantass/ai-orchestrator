import { FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_KIND, FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_VERSION } from './hermes-final-execution-approval.defaults.ts'
import type { FactoryHermesFinalExecutionApprovalInput, FactoryHermesFinalExecutionApprovalResult, FactoryHermesFinalExecutionApprovalValidationResult } from './hermes-final-execution-approval.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|process\.env|\.env|full stdout|full stderr|full source)/iu

export function validateFactoryHermesFinalExecutionApprovalInput(input: FactoryHermesFinalExecutionApprovalInput): FactoryHermesFinalExecutionApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt is required.')
  if (!input?.approvedBy) errors.push('approvedBy is required.')
  if (!input?.researchExecutionApprovalRetryResult) errors.push('researchExecutionApprovalRetryResult is required.')
  if (!input?.runtimeSelectionDecisionResult) errors.push('runtimeSelectionDecisionResult is required.')
  if (SECRETISH.test(JSON.stringify({ approvalNotes: input?.approvalNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesFinalExecutionApprovalResult(result: FactoryHermesFinalExecutionApprovalResult): FactoryHermesFinalExecutionApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.finalApprovalKind !== FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_KIND) errors.push('finalApprovalKind mismatch.')
  if (result.finalApprovalVersion !== FACTORY_HERMES_FINAL_EXECUTION_APPROVAL_VERSION) errors.push('finalApprovalVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'final_execution_approval_recorded') errors.push('status mismatch.')
  if (result.decision !== 'hermes_final_execution_approval_recorded_for_runtime_adapter_approval') errors.push('decision mismatch.')
  if (result.finalExecutionApprovalStatus !== 'approved_for_runtime_adapter_approval') errors.push('finalExecutionApprovalStatus mismatch.')
  const s = result.approvedRuntimeSelectionSnapshot
  if (!s) errors.push('approvedRuntimeSelectionSnapshot required.')
  if (s && (s.finalApproval.approvedNow !== true || s.finalApproval.runtimeAdapterApprovedNow !== false || s.finalApproval.executionRuntimeApprovedNow !== false || s.provider.providerId !== 'openai' || s.model.modelId !== 'gpt-4o-mini' || s.credential.credentialRefName !== 'OPENAI_API_KEY' || s.credential.valueRead !== false || s.network.approvedHostsForNextGate[0] !== 'api.openai.com' || s.network.dnsResolvedNow !== false || s.network.endpointsTestedNow !== false || s.toolsets.approvedToolsetModeForNextGate !== 'no_toolsets_text_only' || !s.runRoot.approvedRunRootForNextGate.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/') || s.runRoot.runRootCreatedNow !== false)) errors.push('approved snapshot mismatch.')
  if (result.runtimeAdapterApprovalRequirement?.status !== 'required_not_satisfied' || result.runtimeAdapterApprovalRequirement.blocksRuntimeAdapterNow !== true) errors.push('runtime adapter approval requirement must block.')
  const d = result.hermesFinalExecutionApprovalDecision
  if (!d || d.finalExecutionApproved !== true || d.runtimeSelectionsApprovedForNextGate !== true || d.runtimeAdapterApproved !== false || d.researchRuntimeApproved !== false || d.executionApprovedNow !== false) errors.push('decision record mismatch.')
  if (result.canProceedToResearchRuntimeAdapterApproval !== true) errors.push('canProceedToResearchRuntimeAdapterApproval must be true.')
  for (const key of ['canProceedToResearchRuntimeAdapter', 'canProceedToResearchExecutionRuntime', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now']) if (!result.finalExecutionApprovalReceipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep required.')
  if (SECRETISH.test(JSON.stringify({ receipt: result.finalExecutionApprovalReceipt }))) errors.push('result summary fields appear to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
