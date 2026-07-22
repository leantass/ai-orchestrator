import { FACTORY_HERMES_PYTHON_INSTALL_VERIFICATION_KIND, FACTORY_HERMES_PYTHON_INSTALL_VERIFICATION_VERSION } from './hermes-python-install-verification.defaults.ts'
import type { FactoryHermesPythonInstallVerificationInput, FactoryHermesPythonInstallVerificationResult, FactoryHermesPythonInstallVerificationValidationResult } from './hermes-python-install-verification.types.ts'

const forbiddenKinds = ['uv_run', 'uv_pip', 'pip', 'python', 'setup_py', 'hermes']

export function validateFactoryHermesPythonInstallVerificationInput(input: FactoryHermesPythonInstallVerificationInput): FactoryHermesPythonInstallVerificationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input.verifiedAt) errors.push('verifiedAt is required.')
  if (!input.verifiedBy) errors.push('verifiedBy is required.')
  if (/secret|token|password|api[_-]?key|credential/iu.test(JSON.stringify(input))) errors.push('input must not contain apparent secrets.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesPythonInstallVerificationResult(result: FactoryHermesPythonInstallVerificationResult): FactoryHermesPythonInstallVerificationValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.pythonInstallVerificationKind !== FACTORY_HERMES_PYTHON_INSTALL_VERIFICATION_KIND) errors.push('Invalid verification kind.')
  if (result.pythonInstallVerificationVersion !== FACTORY_HERMES_PYTHON_INSTALL_VERIFICATION_VERSION) errors.push('Invalid verification version.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (!result.installRootRef.startsWith('.codex-temp/')) errors.push('installRootRef must be under .codex-temp.')
  if (!result.sourceRootRef.startsWith(`${result.installRootRef}/source`)) errors.push('sourceRootRef must be under installRoot/source.')
  if (!result.pythonEnvRootRef.startsWith(`${result.installRootRef}/python-env`)) errors.push('pythonEnvRootRef must be under installRoot/python-env.')
  if (result.status === 'verified') {
    if (result.manifestStatus !== 'valid') errors.push('verified requires valid manifest.')
    if (result.installResultStatus !== 'success') errors.push('verified requires success install result.')
    if (result.pythonEnvStatus !== 'present') errors.push('verified requires present python env.')
    if (result.pyvenvCfgStatus !== 'present') errors.push('verified requires pyvenv.cfg.')
    if (result.pythonExecutableStatus !== 'present') errors.push('verified requires python executable.')
    if (result.sitePackagesStatus !== 'present') errors.push('verified requires site-packages.')
    if (result.uvVerificationStatus !== 'verified') errors.push('verified requires uv verification.')
    if (result.pythonInstallStatus !== 'installed_with_verified_uv_lock_isolated') errors.push('verified requires installed_with_verified_uv_lock_isolated.')
    if (result.canProceedToJefeReview !== true) errors.push('verified requires canProceedToJefeReview true.')
  }
  if (result.canProceedToResearchRuntimePlanning !== false || result.canExecuteHermes !== false || result.canRunHermesScripts !== false || result.canUseCredentials !== false || result.canCallModels !== false || result.canMutateProjectFiles !== false || result.canDeploy !== false) errors.push('Dangerous capability flags must remain false.')
  if (result.pipStatus !== 'not_executed') errors.push('pipStatus must be not_executed.')
  if (result.pythonDirectStatus !== 'not_executed') errors.push('pythonDirectStatus must be not_executed.')
  if (result.setupPyStatus !== 'not_executed') errors.push('setupPyStatus must be not_executed.')
  if (result.hermesExecutionStatus !== 'not_allowed') errors.push('hermesExecutionStatus must be not_allowed.')
  if (!['not_executed', 'not_allowed'].includes(result.scriptsStatus)) errors.push('scriptsStatus must be not_executed/not_allowed.')
  if (result.commandResults.some((command) => forbiddenKinds.includes(command.kind))) errors.push('Forbidden command kind present.')
  if (result.commandResults.some((command) => command.shell !== false)) errors.push('All command results must be shell false.')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  return { ok: errors.length === 0, errors, warnings }
}
