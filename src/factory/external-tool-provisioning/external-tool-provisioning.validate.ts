import { FACTORY_EXTERNAL_TOOL_PROVISIONING_KIND, FACTORY_EXTERNAL_TOOL_PROVISIONING_VERSION } from './external-tool-provisioning.defaults.ts'
import type { FactoryExternalToolProvisioningInput, FactoryExternalToolProvisioningResult, FactoryExternalToolProvisioningValidationResult } from './external-tool-provisioning.types.ts'

const secretPattern = /password|passwd|secret|token|api[_-]?key|credential/iu
const prohibitedAllowedCommandPattern = /\b(uv run|uv pip install|pip|python -m pip|setup\.py|curl|wget|irm|iwr|powershell|cmd\.exe|shell)\b/iu

export function validateFactoryExternalToolProvisioningInput(input: FactoryExternalToolProvisioningInput): FactoryExternalToolProvisioningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.toolProfile) errors.push('toolProfile is required.')
  if (!input?.toolProfile?.toolId) errors.push('toolProfile.toolId is required.')
  if (!input?.requestedAt) errors.push('requestedAt is required.')
  if (!input?.requestedBy) errors.push('requestedBy is required.')
  if (secretPattern.test(JSON.stringify(input.environmentSnapshot ?? {}))) errors.push('environmentSnapshot appears to contain secret-shaped keys.')
  if (secretPattern.test(input.requestedReason ?? '')) warnings.push('requestedReason contains secret-shaped text.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryExternalToolProvisioningResult(result: FactoryExternalToolProvisioningResult): FactoryExternalToolProvisioningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result?.provisioningKind !== FACTORY_EXTERNAL_TOOL_PROVISIONING_KIND) errors.push('provisioningKind is invalid.')
  if (result?.provisioningVersion !== FACTORY_EXTERNAL_TOOL_PROVISIONING_VERSION) errors.push('provisioningVersion is invalid.')
  if (!result?.toolId) errors.push('toolId is required.')
  if (result.status === 'provisioning_plan_candidate_approved' && !result.provisioningPlanCandidate) errors.push('Approved result requires provisioningPlanCandidate.')
  if (result.canInstallNow !== false) errors.push('canInstallNow must be false.')
  if (result.canExecuteToolNow !== false) errors.push('canExecuteToolNow must be false.')
  if (result.canUseShell !== false) errors.push('canUseShell must be false.')
  if (result.canUseCredentials !== false) errors.push('canUseCredentials must be false.')
  if (result.canMutateProjectFiles !== false) errors.push('canMutateProjectFiles must be false.')
  if (result.canDeploy !== false) errors.push('canDeploy must be false.')
  if (result.toolId === 'uv' && !result.provisioningPlanCandidate?.notAuthorizedActions.includes('install_uv_now')) errors.push('uv result must forbid install_uv_now.')
  if (result.provisioningPlanCandidate?.allowedCommands.some((command) => prohibitedAllowedCommandPattern.test(command))) errors.push('allowedCommands includes a prohibited command.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (secretPattern.test(JSON.stringify(result))) warnings.push('Result contains secret-shaped text; inspect summary before sharing.')
  return { ok: errors.length === 0, errors, warnings }
}
