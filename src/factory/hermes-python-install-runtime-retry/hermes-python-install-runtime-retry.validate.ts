import { FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_RETRY_KIND, FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_RETRY_VERSION } from './hermes-python-install-runtime-retry.defaults.ts'
import type { FactoryHermesPythonInstallRuntimeRetryInput, FactoryHermesPythonInstallRuntimeRetryResult, FactoryHermesPythonInstallRuntimeRetryValidationResult } from './hermes-python-install-runtime-retry.types.ts'

const forbiddenKinds = ['uv_run', 'uv_pip', 'pip', 'python', 'setup_py', 'hermes']

export function validateFactoryHermesPythonInstallRuntimeRetryInput(input: FactoryHermesPythonInstallRuntimeRetryInput): FactoryHermesPythonInstallRuntimeRetryValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!input.executedAt) errors.push('executedAt is required.')
  if (!input.executedBy) errors.push('executedBy is required.')

  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesPythonInstallRuntimeRetryResult(result: FactoryHermesPythonInstallRuntimeRetryResult): FactoryHermesPythonInstallRuntimeRetryValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (result.retryKind !== FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_RETRY_KIND) errors.push('Invalid retry kind.')
  if (result.retryVersion !== FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_RETRY_VERSION) errors.push('Invalid retry version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (!result.uvExecutableRef.startsWith('.codex-temp/external-tools/uv/bin/uv.exe')) errors.push('uvExecutableRef must point to verified local uv.exe.')
  if (!result.sourceRootRef.startsWith(`${result.installRootRef}/source`)) errors.push('sourceRootRef must be under install source.')
  if (!result.pythonEnvRootRef.startsWith(`${result.installRootRef}/python-env`)) errors.push('pythonEnvRootRef must be under install python-env.')
  if (result.status === 'success' && result.pythonInstallStatus !== 'installed_with_verified_uv_lock_isolated') errors.push('success requires installed_with_verified_uv_lock_isolated.')
  if (result.status === 'success' && !['created_with_verified_uv', 'existing_verified_uv_env_reused', 'existing_uv_env_reused'].includes(result.venvStatus)) errors.push('success requires an approved venv status.')
  if (result.status === 'success' && !['executed_verified_allowlisted', 'verified_uv_existing_install_reused'].includes(result.uvStatus)) errors.push('success requires an approved uv status.')
  if (result.pipStatus !== 'not_executed') errors.push('pipStatus must be not_executed.')
  if (result.pythonDirectStatus !== 'not_executed') errors.push('pythonDirectStatus must be not_executed.')
  if (result.setupPyStatus !== 'not_executed') errors.push('setupPyStatus must be not_executed.')
  if (result.hermesExecutionStatus !== 'not_allowed') errors.push('hermesExecutionStatus must be not_allowed.')
  if (result.scriptsStatus !== 'not_executed') errors.push('scriptsStatus must be not_executed.')
  if (result.commandResults.some((command) => forbiddenKinds.includes(command.kind))) errors.push('Forbidden command kind present.')
  if (result.commandResults.some((command) => command.shell !== false)) errors.push('All commands must use shell false.')
  if ((result.status === 'success') !== result.canProceedToPythonInstallVerification) errors.push('canProceedToPythonInstallVerification true only on success.')
  if (
    result.canExecuteHermes !== false ||
    result.canRunHermesScripts !== false ||
    result.canUseCredentials !== false ||
    result.canCallModels !== false ||
    result.canMutateProjectFiles !== false ||
    result.canDeploy !== false
  ) errors.push('Dangerous capability flags must remain false.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')

  return { ok: errors.length === 0, errors, warnings }
}
