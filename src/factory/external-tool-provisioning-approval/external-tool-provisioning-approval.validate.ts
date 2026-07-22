import { FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_KIND, FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_VERSION, mergeFactoryExternalToolProvisioningApprovalPolicy } from './external-tool-provisioning-approval.defaults.ts'
import type { FactoryExternalToolProvisioningApprovalInput, FactoryExternalToolProvisioningApprovalResult, FactoryExternalToolProvisioningApprovalValidationResult } from './external-tool-provisioning-approval.types.ts'

const secretPattern = /password|passwd|secret|token|api[_-]?key|credential/iu
const prohibitedAllowedCommandPattern = /\b(uv run|uv pip install|pip|python -m pip|setup\.py|curl|wget|irm|iwr|powershell|cmd\.exe|shell)\b/iu

function inspectForSecrets(value: unknown): boolean {
  if (typeof value === 'string') return secretPattern.test(value)
  if (Array.isArray(value)) return value.some(inspectForSecrets)
  if (value && typeof value === 'object') return Object.values(value).some(inspectForSecrets)
  return false
}

export function validateFactoryExternalToolProvisioningApprovalInput(input: FactoryExternalToolProvisioningApprovalInput): FactoryExternalToolProvisioningApprovalValidationResult {
  const policy = mergeFactoryExternalToolProvisioningApprovalPolicy(input.policy)
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.externalToolProvisioningResult) errors.push('externalToolProvisioningResult is required.')
  if (!input.reviewedAt) errors.push('reviewedAt is required.')
  if (!input.reviewedBy) errors.push('reviewedBy is required.')
  if (policy.requireHumanApproval && !input.humanApprovalRef) errors.push('humanApprovalRef is required.')
  if (inspectForSecrets(input.reviewNotes ?? [])) errors.push('reviewNotes appear to contain secret-shaped material.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryExternalToolProvisioningApprovalResult(result: FactoryExternalToolProvisioningApprovalResult): FactoryExternalToolProvisioningApprovalValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.approvalKind !== FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_KIND) errors.push('approvalKind is invalid.')
  if (result.approvalVersion !== FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_VERSION) errors.push('approvalVersion is invalid.')
  if (!result.toolId) errors.push('toolId is required.')
  if (result.status === 'tool_provisioning_envelope_candidate_approved' && !result.approvalReceipt) errors.push('approved result requires approvalReceipt.')
  if (result.status === 'tool_provisioning_envelope_candidate_approved' && !result.approvedToolProvisioningEnvelope) errors.push('approved result requires approvedToolProvisioningEnvelope.')
  if (result.canInstallNow !== false) errors.push('canInstallNow must be false.')
  if (result.canExecuteToolNow !== false) errors.push('canExecuteToolNow must be false.')
  if (result.canUseShell !== false) errors.push('canUseShell must be false.')
  if (result.canUseCredentials !== false) errors.push('canUseCredentials must be false.')
  if (result.canMutateProjectFiles !== false) errors.push('canMutateProjectFiles must be false.')
  if (result.canDeploy !== false) errors.push('canDeploy must be false.')
  const envelope = result.approvedToolProvisioningEnvelope
  if (envelope) {
    if (envelope.installStatus !== 'not_installed') errors.push('envelope installStatus must be not_installed.')
    if (envelope.executionStatus !== 'not_executed') errors.push('envelope executionStatus must be not_executed.')
    if (envelope.downloadStatus !== 'not_downloaded') errors.push('envelope downloadStatus must be not_downloaded.')
    if (envelope.shellStatus !== 'not_allowed') errors.push('envelope shellStatus must be not_allowed.')
    if (envelope.allowedCommands.some((command) => prohibitedAllowedCommandPattern.test(command))) errors.push('allowedCommands includes a prohibited command.')
  }
  const actions = result.approvalReceipt?.notAuthorizedActions ?? []
  if (result.status === 'tool_provisioning_envelope_candidate_approved' && !actions.includes('install_tool_now')) errors.push('notAuthorizedActions must include install_tool_now.')
  if (result.toolId === 'uv' && (!actions.includes('install_uv_now') || !actions.includes('execute_uv_now'))) errors.push('uv notAuthorizedActions must include install_uv_now and execute_uv_now.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (inspectForSecrets(result)) warnings.push('Result contains secret-shaped text; inspect before sharing.')
  return { ok: errors.length === 0, errors, warnings }
}
