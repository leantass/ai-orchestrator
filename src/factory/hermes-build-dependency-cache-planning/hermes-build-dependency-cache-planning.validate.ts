import { FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_KIND, FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_VERSION } from './hermes-build-dependency-cache-planning.defaults.ts'
import type { FactoryHermesBuildDependencyCachePlanningInput, FactoryHermesBuildDependencyCachePlanningResult, FactoryHermesBuildDependencyCachePlanningValidationResult } from './hermes-build-dependency-cache-planning.types.ts'

const secretPattern = /password|secret|api[_-]?key|bearer|token|credential|process\.env/iu

export function validateFactoryHermesBuildDependencyCachePlanningInput(input: FactoryHermesBuildDependencyCachePlanningInput): FactoryHermesBuildDependencyCachePlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.plannedAt) errors.push('plannedAt is required')
  if (!input.plannedBy) errors.push('plannedBy is required')
  if (!input.materializationJefeReviewResult) errors.push('materializationJefeReviewResult is required')
  if (!input.sourceInspection) errors.push('sourceInspection is required')
  if (!input.cacheInspection) errors.push('cacheInspection is required')
  if (secretPattern.test(JSON.stringify(input.planningNotes || ''))) errors.push('planningNotes appear to contain secret material')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesBuildDependencyCachePlanningResult(result: FactoryHermesBuildDependencyCachePlanningResult): FactoryHermesBuildDependencyCachePlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_KIND) errors.push('invalid kind')
  if (result.planningVersion !== FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_VERSION) errors.push('invalid version')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent')
  if (!/setuptools/iu.test(result.missingBuildDependency)) errors.push('missingBuildDependency must include setuptools')
  if (result.buildBackend !== 'setuptools.build_meta') errors.push('buildBackend must be setuptools.build_meta')
  if (result.status === 'plan_candidate_created') {
    if (!result.buildDependencyCachePlanningReceipt) errors.push('receipt is required')
    if (!result.hermesBuildDependencyCachePlanCandidate) errors.push('plan candidate is required')
    if (result.selectedMethodCandidate !== 'uv_controlled_build_dependency_cache_prefetch') errors.push('selected method must be uv_controlled_build_dependency_cache_prefetch')
    if (result.canProceedToBuildDependencyCacheApproval !== true) errors.push('approval progression must be true')
  }
  for (const [key, value] of Object.entries({ canCacheBuildDependenciesNow: result.canCacheBuildDependenciesNow, canEnableNetworkNow: result.canEnableNetworkNow, canRetryMaterializationNow: result.canRetryMaterializationNow, canExecuteHermes: result.canExecuteHermes, canRunHermesScripts: result.canRunHermesScripts, canUseNetwork: result.canUseNetwork, canUseCredentials: result.canUseCredentials, canCallModels: result.canCallModels, canMutateProjectFiles: result.canMutateProjectFiles, canDeploy: result.canDeploy })) if (value !== false) errors.push(`${key} must be false`)
  const actions = result.buildDependencyCachePlanningReceipt?.notAuthorizedActions || []
  for (const action of ['cache_build_dependency_now', 'enable_network_now', 'execute_uv_now', 'execute_uv_sync_now']) if (!actions.includes(action)) errors.push(`missing notAuthorizedAction ${action}`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required')
  return { ok: errors.length === 0, errors, warnings }
}
