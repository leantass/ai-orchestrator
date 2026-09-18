import type { FactoryHermesResearchRuntimeAdapterApprovalRetryInput, FactoryHermesResearchRuntimeAdapterApprovalRetryResult, FactoryHermesResearchRuntimeAdapterApprovalRetryValidationResult } from './hermes-research-runtime-adapter-approval-retry.types.ts'

export function validateFactoryHermesResearchRuntimeAdapterApprovalRetryInput(input: FactoryHermesResearchRuntimeAdapterApprovalRetryInput): FactoryHermesResearchRuntimeAdapterApprovalRetryValidationResult {
  const errors: string[] = []
  if (!input?.retriedAt) errors.push('retriedAt_required')
  if (!input?.retriedBy) errors.push('retriedBy_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesResearchRuntimeAdapterApprovalRetryResult(result: FactoryHermesResearchRuntimeAdapterApprovalRetryResult): FactoryHermesResearchRuntimeAdapterApprovalRetryValidationResult {
  const errors: string[] = []
  if (!['research_runtime_adapter_approval_retry_granted', 'research_runtime_adapter_approval_retry_blocked'].includes(result?.status)) errors.push('invalid_status')
  if (result?.canRunResearchNow !== false) errors.push('research_must_remain_blocked')
  if (result?.canExecuteHermesNow !== false) errors.push('hermes_must_remain_blocked')
  if (result?.canPassPromptNow !== false) errors.push('prompt_must_remain_blocked')
  if (result?.canUseNetworkNow !== false) errors.push('network_must_remain_blocked')
  if (result?.canReadEnvSecretsNow !== false) errors.push('env_secrets_must_remain_blocked')
  if (result?.canUseFindings !== false) errors.push('findings_must_remain_blocked')
  if (result?.status === 'research_runtime_adapter_approval_retry_granted' && !result?.approvedResearchRuntimeAdapterGateEnvelope) errors.push('accepted_result_requires_envelope')
  if (result?.status === 'research_runtime_adapter_approval_retry_blocked' && !result?.retryBlockerPlan) errors.push('blocked_result_requires_blocker_plan')
  return { ok: errors.length === 0, errors }
}
