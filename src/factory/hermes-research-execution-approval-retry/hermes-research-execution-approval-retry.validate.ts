import { FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_VERSION } from './hermes-research-execution-approval-retry.defaults.ts'
import type { FactoryHermesResearchExecutionApprovalRetryInput, FactoryHermesResearchExecutionApprovalRetryResult, FactoryHermesResearchExecutionApprovalRetryValidationResult } from './hermes-research-execution-approval-retry.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|process\.env|\.env|full stdout|full stderr|full source)/iu

export function validateFactoryHermesResearchExecutionApprovalRetryInput(input: FactoryHermesResearchExecutionApprovalRetryInput): FactoryHermesResearchExecutionApprovalRetryValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.evaluatedAt) errors.push('evaluatedAt is required.')
  if (!input?.evaluatedBy) errors.push('evaluatedBy is required.')
  if (!input?.runtimeSelectionDecisionResult) errors.push('runtimeSelectionDecisionResult is required.')
  if (SECRETISH.test(JSON.stringify({ evaluationNotes: input?.evaluationNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResearchExecutionApprovalRetryResult(result: FactoryHermesResearchExecutionApprovalRetryResult): FactoryHermesResearchExecutionApprovalRetryValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.approvalRetryKind !== FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_KIND) errors.push('approvalRetryKind mismatch.')
  if (result.approvalRetryVersion !== FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_RETRY_VERSION) errors.push('approvalRetryVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'research_execution_approval_retry_blocked') errors.push('status mismatch.')
  if (result.decision !== 'hermes_research_execution_approval_retry_blocked_final_execution_approval_required') errors.push('decision mismatch.')
  if (result.approvalRetryStatus !== 'not_approved') errors.push('approvalRetryStatus must be not_approved.')
  if (result.runtimeSelectionsValidated !== true) errors.push('runtimeSelectionsValidated must be true.')
  if (result.finalExecutionApprovalRequired !== true) errors.push('finalExecutionApprovalRequired must be true.')
  if (result.finalExecutionApprovalRequirement?.status !== 'required_not_satisfied' || result.finalExecutionApprovalRequirement.blocksExecutionNow !== true) errors.push('final execution requirement must block.')
  const v = result.validatedRuntimeSelections
  if (!v) errors.push('validatedRuntimeSelections required.')
  if (v && (v.provider.providerId !== 'openai' || v.model.modelId !== 'gpt-4o-mini' || v.credential.credentialRefName !== 'OPENAI_API_KEY' || v.credential.valueRead !== false || v.network.selectedHosts[0] !== 'api.openai.com' || v.network.dnsResolvedNow !== false || v.network.endpointsTestedNow !== false || v.toolsets.selectedToolsetMode !== 'no_toolsets_text_only' || !v.runRoot.selectedRunRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/') || v.runRoot.runRootCreatedNow !== false || v.finalApproval.approvedNow !== false)) errors.push('validated selections mismatch.')
  const d = result.hermesResearchExecutionApprovalRetryDecision
  if (!d || d.finalExecutionApprovalSatisfied !== false || d.executionApproved !== false || d.runtimeAdapterApproved !== false || d.researchRuntimeApproved !== false) errors.push('approval retry decision must remain not approved.')
  if (result.canProceedToFinalExecutionApprovalGate !== true) errors.push('canProceedToFinalExecutionApprovalGate must be true.')
  for (const key of ['canProceedToResearchRuntimeAdapter', 'canProceedToResearchExecutionRuntime', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now']) if (!result.researchExecutionApprovalRetryReceipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep required.')
  if (SECRETISH.test(JSON.stringify({ receipt: result.researchExecutionApprovalRetryReceipt, blockerPlan: result.approvalRetryBlockerPlan }))) errors.push('result summary fields appear to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
