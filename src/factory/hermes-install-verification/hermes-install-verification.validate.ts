import { FACTORY_HERMES_INSTALL_VERIFICATION_KIND, FACTORY_HERMES_INSTALL_VERIFICATION_VERSION } from './hermes-install-verification.defaults.ts';
import type { FactoryHermesInstallVerificationResult, FactoryHermesInstallVerificationValidationResult } from './hermes-install-verification.types.ts';

export function validateFactoryHermesInstallVerificationResult(result: FactoryHermesInstallVerificationResult): FactoryHermesInstallVerificationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (result.verificationKind !== FACTORY_HERMES_INSTALL_VERIFICATION_KIND) errors.push('invalid verification kind.');
  if (result.verificationVersion !== FACTORY_HERMES_INSTALL_VERIFICATION_VERSION) errors.push('invalid verification version.');
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.');
  if (!result.installRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/')) errors.push('installRoot must be under .codex-temp.');
  if (!result.sourceCopyRoot) errors.push('sourceCopyRoot is required.');
  if (!result.artifactStatus.manifestExists) errors.push('manifest is required.');
  if (!result.artifactStatus.installResultExists) errors.push('install result is required.');
  if (typeof result.nodeInstallVerified !== 'boolean') errors.push('nodeInstallVerified must be boolean.');
  if (!result.pythonInstallStatus) errors.push('pythonInstallStatus is required.');
  if (result.pythonInstallStatus === 'blocked_requires_python_install_strategy') warnings.push('python strategy required.');
  if (!result.hermesExecutionVerifiedAsNotRun) errors.push('Hermes must be verified as not run.');
  if (!result.scriptsVerifiedAsNotRun) errors.push('Hermes scripts must be verified as not run.');
  if (result.projectPackageMutationDetected !== false) errors.push('project package mutation must be false.');
  if (result.canExecuteHermes || result.canRunHermesScripts || result.canUseCredentials || result.canCallModels || result.canMutateProjectFiles || result.canDeploy) errors.push('dangerous flags must remain false.');
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.');
  return { ok: errors.length === 0, errors, warnings };
}
