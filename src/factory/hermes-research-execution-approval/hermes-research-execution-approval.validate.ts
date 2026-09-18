import type { FactoryHermesResearchExecutionApprovalInput, FactoryHermesResearchExecutionApprovalResult, FactoryHermesResearchExecutionApprovalValidationResult } from './hermes-research-execution-approval.types.ts'

export function validateFactoryHermesResearchExecutionApprovalInput(input: FactoryHermesResearchExecutionApprovalInput): FactoryHermesResearchExecutionApprovalValidationResult {
  const errors: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt_required')
  if (!input?.approvedBy) errors.push('approvedBy_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesResearchExecutionApprovalResult(result: FactoryHermesResearchExecutionApprovalResult): FactoryHermesResearchExecutionApprovalValidationResult {
  const errors: string[] = []
  if (!['research_execution_approval_granted', 'research_execution_approval_blocked'].includes(result?.status)) errors.push('invalid_status')
  if (result?.selectedWrapperStrategy !== 'wrapper_temp_config_no_toolsets') errors.push('invalid_wrapper_strategy')
  if (result?.researchExecutionApprovedNow !== false || result?.runtimeAdapterExecutionAllowedNow !== false || result?.hermesExecutionAllowedNow !== false) errors.push('execution_must_remain_blocked')
  if (result?.promptPassingAllowedNow !== false || result?.modelCallsAllowedNow !== false || result?.networkAllowedNow !== false || result?.credentialAccessAllowedNow !== false || result?.toolsetEnablementAllowedNow !== false || result?.tempConfigCreationAllowedNow !== false || result?.runRootCreationAllowedNow !== false || result?.findingsUseAllowedNow !== false) errors.push('runtime_capabilities_must_remain_blocked')
  if (result?.canRunResearchNow !== false || result?.canExecuteHermesNow !== false || result?.canPassPromptNow !== false || result?.canUseNetworkNow !== false || result?.canUseCredentialsNow !== false || result?.canReadEnvSecretsNow !== false || result?.canCallModelsNow !== false || result?.canEnableToolsetsNow !== false || result?.canMutateFilesystemNow !== false || result?.canUseFindings !== false) errors.push('now_flags_must_be_false')
  if (result?.status === 'research_execution_approval_granted' && !result?.controlledResearchRuntimePlanningEnvelope) errors.push('granted_requires_planning_envelope')
  if (result?.status === 'research_execution_approval_blocked' && !result?.approvalBlockerPlan) errors.push('blocked_requires_blocker_plan')
  return { ok: errors.length === 0, errors }
}
