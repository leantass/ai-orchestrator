import { FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_KIND, FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_VERSION, TOOLSET_DISABLE_VERIFICATION_APPROVAL_NOT_AUTHORIZED_ACTIONS } from './hermes-toolset-disable-verification-approval.defaults.ts'
import type { FactoryHermesToolsetDisableVerificationApprovalInput, FactoryHermesToolsetDisableVerificationApprovalResult, FactoryHermesToolsetDisableVerificationApprovalValidationResult } from './hermes-toolset-disable-verification-approval.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=]|process\.env|\.env|full stdout|full stderr|full source)/iu

export function validateFactoryHermesToolsetDisableVerificationApprovalInput(input: FactoryHermesToolsetDisableVerificationApprovalInput): FactoryHermesToolsetDisableVerificationApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.evaluatedAt) errors.push('evaluatedAt is required.')
  if (!input?.evaluatedBy) errors.push('evaluatedBy is required.')
  if (!input?.toolsetDisableVerificationPlanningResult) errors.push('toolsetDisableVerificationPlanningResult is required.')
  if (!input?.researchRuntimeAdapterApprovalResult) errors.push('researchRuntimeAdapterApprovalResult is required.')
  if (SECRETISH.test(JSON.stringify({ approvalNotes: input?.approvalNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesToolsetDisableVerificationApprovalResult(result: FactoryHermesToolsetDisableVerificationApprovalResult): FactoryHermesToolsetDisableVerificationApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.approvalKind !== FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_KIND) errors.push('approvalKind mismatch.')
  if (result.approvalVersion !== FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_VERSION) errors.push('approvalVersion mismatch.')
  if (!['toolset_disable_verification_approval_granted', 'toolset_disable_verification_approval_blocked'].includes(result.status)) errors.push('status must be granted or blocked.')
  if (!result.approvalStatus) errors.push('approvalStatus is required.')
  if (!result.sourceSafetyAssessment) errors.push('sourceSafetyAssessment is required.')
  if (!result.toolsetDisableVerificationApprovalDecision) errors.push('decision record is required.')
  if (!result.toolsetDisableVerificationApprovalReceipt) errors.push('receipt is required.')
  if (result.status === 'toolset_disable_verification_approval_granted') {
    if (!result.controlledToolsetProbeEnvelope) errors.push('controlledToolsetProbeEnvelope is required when granted.')
    if (!result.controlledToolsetProbeEnvelope?.exactCommandCandidate?.length) errors.push('exactCommandCandidate is required when granted.')
    if (result.canProceedToToolsetDisableVerificationRuntimeAdapter !== true) errors.push('granted result must allow toolset-disable runtime adapter.')
    if (result.canProceedToRuntimeSelectionRevisionPlanning !== false) errors.push('granted result must not route to selection revision.')
  }
  if (result.status === 'toolset_disable_verification_approval_blocked') {
    if (!result.approvalBlockerPlan) errors.push('approvalBlockerPlan is required when blocked.')
    if (result.canProceedToToolsetDisableVerificationRuntimeAdapter !== false) errors.push('blocked result must not allow toolset-disable runtime adapter.')
    if (result.canProceedToRuntimeSelectionRevisionPlanning !== true) errors.push('blocked result must allow runtime selection revision planning.')
  }
  for (const key of ['canProceedToResearchRuntimeAdapterApprovalRetry', 'canProceedToResearchRuntimeAdapter', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of TOOLSET_DISABLE_VERIFICATION_APPROVAL_NOT_AUTHORIZED_ACTIONS) if (!result.toolsetDisableVerificationApprovalReceipt.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction: ${action}`)
  if (SECRETISH.test(JSON.stringify({ summary: result.toolsetDisableVerificationApprovalReceipt, blockerPlan: result.approvalBlockerPlan }))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
