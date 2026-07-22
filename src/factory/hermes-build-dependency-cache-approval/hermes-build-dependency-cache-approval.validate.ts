import { FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_KIND, FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_VERSION } from './hermes-build-dependency-cache-approval.defaults.ts'
import type { FactoryHermesBuildDependencyCacheApprovalInput, FactoryHermesBuildDependencyCacheApprovalResult, FactoryHermesBuildDependencyCacheApprovalValidationResult } from './hermes-build-dependency-cache-approval.types.ts'

const secretPattern = /password\s*=|secret\s*=|api[_-]?key\s*=|bearer\s+[a-z0-9._-]+|token\s*=|process\.env/iu

export function validateFactoryHermesBuildDependencyCacheApprovalInput(input: FactoryHermesBuildDependencyCacheApprovalInput): FactoryHermesBuildDependencyCacheApprovalValidationResult {
  const errors: string[] = []
  if (!input.approvedAt) errors.push('approvedAt is required')
  if (!input.approvedBy) errors.push('approvedBy is required')
  if (!input.buildDependencyCachePlanningResult) errors.push('buildDependencyCachePlanningResult is required')
  if (!input.humanApprovalRef) errors.push('humanApprovalRef is required')
  if (!input.networkRiskAcceptanceNotes) errors.push('networkRiskAcceptanceNotes is required')
  if (!input.hashVerificationPolicyNotes) errors.push('hashVerificationPolicyNotes is required')
  if (secretPattern.test(JSON.stringify(input))) errors.push('input appears to contain secret material')
  return { ok: errors.length === 0, errors, warnings: [] }
}

export function validateFactoryHermesBuildDependencyCacheApprovalResult(result: FactoryHermesBuildDependencyCacheApprovalResult): FactoryHermesBuildDependencyCacheApprovalValidationResult {
  const errors: string[] = []
  if (result.approvalKind !== FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_KIND) errors.push('invalid kind')
  if (result.approvalVersion !== FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_APPROVAL_VERSION) errors.push('invalid version')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent')
  if (result.status === 'approved_for_runtime_candidate') {
    if (!result.approvalReceipt) errors.push('receipt is required')
    if (!result.approvedBuildDependencyCacheRuntimeEnvelope) errors.push('runtime envelope is required')
    if (result.selectedMethodCandidate !== 'uv_controlled_build_dependency_cache_prefetch') errors.push('invalid selected method')
    if (result.canProceedToBuildDependencyCacheRuntime !== true) errors.push('must proceed to cache runtime')
    if (result.canUseNetworkInFutureRuntime !== true) errors.push('future runtime network allowance must be true')
  }
  for (const [key, value] of Object.entries({ canCacheBuildDependenciesNow: result.canCacheBuildDependenciesNow, canEnableNetworkNow: result.canEnableNetworkNow, canUseNetworkNow: result.canUseNetworkNow, canRetryMaterializationNow: result.canRetryMaterializationNow, canExecuteHermes: result.canExecuteHermes, canRunHermesScripts: result.canRunHermesScripts, canUseCredentials: result.canUseCredentials, canCallModels: result.canCallModels, canMutateProjectFiles: result.canMutateProjectFiles, canDeploy: result.canDeploy })) if (value !== false) errors.push(`${key} must be false`)
  const actions = result.approvalReceipt?.notAuthorizedActions || []
  for (const action of ['cache_build_dependency_now', 'enable_network_now', 'execute_uv_now', 'execute_uv_sync_now']) if (!actions.includes(action)) errors.push(`missing ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required')
  return { ok: errors.length === 0, errors, warnings: [] }
}
