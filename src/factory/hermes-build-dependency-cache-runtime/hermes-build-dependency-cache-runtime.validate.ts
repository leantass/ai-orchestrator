import { FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_RUNTIME_KIND, FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_RUNTIME_VERSION } from './hermes-build-dependency-cache-runtime.defaults.ts'
import type { FactoryHermesBuildDependencyCacheRuntimeInput, FactoryHermesBuildDependencyCacheRuntimeResult, FactoryHermesBuildDependencyCacheRuntimeValidationResult } from './hermes-build-dependency-cache-runtime.types.ts'
export function validateFactoryHermesBuildDependencyCacheRuntimeInput(input: FactoryHermesBuildDependencyCacheRuntimeInput): FactoryHermesBuildDependencyCacheRuntimeValidationResult { const errors: string[] = []; if (!input.executedAt) errors.push('executedAt is required'); if (!input.executedBy) errors.push('executedBy is required'); return { ok: errors.length === 0, errors, warnings: [] } }
export function validateFactoryHermesBuildDependencyCacheRuntimeResult(result: FactoryHermesBuildDependencyCacheRuntimeResult): FactoryHermesBuildDependencyCacheRuntimeValidationResult {
  const errors: string[] = []
  if (result.cacheKind !== FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_RUNTIME_KIND) errors.push('invalid kind')
  if (result.cacheVersion !== FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_RUNTIME_VERSION) errors.push('invalid version')
  if (result.selectedMethodCandidate !== 'uv_controlled_build_dependency_cache_prefetch') errors.push('invalid selected method')
  const command = result.commandResults[0]
  if (command) {
    if (command.commandKind !== 'uv_sync_temp_env_for_cache_prefetch') errors.push('invalid command kind')
    for (const arg of ['sync', '--locked', '--no-dev', '--project']) if (!command.args.includes(arg)) errors.push(`missing arg ${arg}`)
    if (command.shell !== false) errors.push('shell must be false')
    if (command.envRefs.UV_PROJECT_ENVIRONMENT !== result.tempEnvRootRef) errors.push('UV_PROJECT_ENVIRONMENT must target temp env')
    if (command.envRefs.UV_PROJECT_ENVIRONMENT === result.pythonEnvRootRef) errors.push('must not target real python env')
  }
  for (const [key, value] of Object.entries({ pipStatus: result.pipStatus, pythonDirectStatus: result.pythonDirectStatus, setupPyDirectStatus: result.setupPyDirectStatus, hermesExecutionStatus: result.hermesExecutionStatus, materializationStatus: result.materializationStatus, adapterRetryStatus: result.adapterRetryStatus, credentialsStatus: result.credentialsStatus, modelCallStatus: result.modelCallStatus })) {
    const expected = key === 'materializationStatus' || key === 'adapterRetryStatus' ? 'not_attempted' : key === 'credentialsStatus' || key === 'modelCallStatus' ? 'not_allowed' : 'not_executed'
    if (value !== expected) errors.push(`${key} must be ${expected}`)
  }
  if (result.canRetryMaterializationNow !== false || result.canExecuteHermes !== false) errors.push('dangerous capabilities must be false')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required')
  return { ok: errors.length === 0, errors, warnings: [] }
}
