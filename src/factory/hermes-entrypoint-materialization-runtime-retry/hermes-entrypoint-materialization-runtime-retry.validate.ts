import { FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_KIND, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_VERSION } from './hermes-entrypoint-materialization-runtime-retry.defaults.ts'
import type { FactoryHermesEntrypointMaterializationRuntimeRetryInput, FactoryHermesEntrypointMaterializationRuntimeRetryResult, FactoryHermesEntrypointMaterializationRuntimeRetryValidationResult } from './hermes-entrypoint-materialization-runtime-retry.types.ts'

const secretPattern = /secret|token|api[_-]?key|password|bearer|private/iu

export function validateFactoryHermesEntrypointMaterializationRuntimeRetryInput(input: FactoryHermesEntrypointMaterializationRuntimeRetryInput): FactoryHermesEntrypointMaterializationRuntimeRetryValidationResult {
  const errors: string[] = []
  if (!input.executedAt) errors.push('executedAt is required')
  if (!input.executedBy) errors.push('executedBy is required')
  if (!input.cacheVerificationResult) errors.push('cacheVerificationResult is required')
  if (secretPattern.test(JSON.stringify(input.runtimeNotes || []))) errors.push('runtimeNotes contain apparent secret text')
  return { ok: errors.length === 0, errors, warnings: [] }
}

export function validateFactoryHermesEntrypointMaterializationRuntimeRetryResult(result: FactoryHermesEntrypointMaterializationRuntimeRetryResult): FactoryHermesEntrypointMaterializationRuntimeRetryValidationResult {
  const errors: string[] = []
  if (result.retryKind !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_KIND) errors.push('invalid kind')
  if (result.retryVersion !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_VERSION) errors.push('invalid version')
  if (result.toolId !== 'hermes_agent') errors.push('invalid toolId')
  if (result.commandName !== 'hermes') errors.push('invalid commandName')
  if (result.pythonEntrypoint !== 'hermes_cli.main:main') errors.push('invalid pythonEntrypoint')
  if (result.selectedMethodCandidate !== 'uv_sync_install_project_locked_existing_env') errors.push('invalid selectedMethodCandidate')
  if (result.verifiedBuildDependency.packageName !== 'setuptools' || result.verifiedBuildDependency.lockedPackageVersion !== '81.0.0') errors.push('invalid verified build dependency')
  if (result.commandResults.length > 1) errors.push('only one command result is allowed')
  for (const command of result.commandResults) {
    if (JSON.stringify(command.args) !== JSON.stringify(['sync', '--locked', '--no-dev', '--project', result.sourceRootRef])) errors.push('command args are not exact')
    if (command.args.includes('--no-install-project')) errors.push('--no-install-project is forbidden')
    if (command.shell !== false) errors.push('shell must be false')
    if (command.envRefs.UV_OFFLINE !== '1') errors.push('UV_OFFLINE=1 is required')
    if (/uv_run|uv_pip|uv_venv|\bpip\b|\bpython\b|setup_py|hermes/iu.test(command.commandKind)) errors.push('forbidden command kind')
  }
  if (result.status === 'success') {
    if (result.executableStatusAfter !== 'present') errors.push('success requires executable present')
    if (result.materializationStatus !== 'materialized') errors.push('success requires materialized status')
    if (result.canProceedToEntrypointMaterializationVerification !== true) errors.push('success requires verification handoff')
  }
  for (const [key, value] of Object.entries({ canRetryResearchAdapterNow: result.canRetryResearchAdapterNow, canExecuteHermesNow: result.canExecuteHermesNow, canTreatAsResearchResult: result.canTreatAsResearchResult, canUseNetwork: result.canUseNetwork, canUseCredentials: result.canUseCredentials, canCallModels: result.canCallModels, canDeploy: result.canDeploy })) if (value !== false) errors.push(`${key} must be false`)
  for (const [key, value] of Object.entries({ networkStatus: result.networkStatus, credentialsStatus: result.credentialsStatus, modelCallStatus: result.modelCallStatus, pipStatus: result.pipStatus, pythonDirectStatus: result.pythonDirectStatus, setupPyDirectStatus: result.setupPyDirectStatus, hermesExecutionStatus: result.hermesExecutionStatus, scriptsStatus: result.scriptsStatus })) {
    if (!['not_allowed', 'not_executed'].includes(String(value))) errors.push(`${key} has unsafe status`)
  }
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required')
  return { ok: errors.length === 0, errors, warnings: [] }
}
