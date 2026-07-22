import { FACTORY_HERMES_INSTALL_RUNTIME_KIND, FACTORY_HERMES_INSTALL_RUNTIME_VERSION } from './hermes-install-runtime.defaults.ts';
import type { FactoryHermesInstallRuntimeInput, FactoryHermesInstallRuntimeResult, FactoryHermesInstallRuntimeValidationResult } from './hermes-install-runtime.types.ts';

export function validateFactoryHermesInstallRuntimeInput(input: FactoryHermesInstallRuntimeInput): FactoryHermesInstallRuntimeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input.hermesInstallApprovalResult) errors.push('approval result is required.');
  if (!input.executedAt) errors.push('executedAt is required.');
  if (!input.executedBy) errors.push('executedBy is required.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateFactoryHermesInstallRuntimeResult(result: FactoryHermesInstallRuntimeResult): FactoryHermesInstallRuntimeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (result.installRuntimeKind !== FACTORY_HERMES_INSTALL_RUNTIME_KIND) errors.push('invalid runtime kind.');
  if (result.installRuntimeVersion !== FACTORY_HERMES_INSTALL_RUNTIME_VERSION) errors.push('invalid runtime version.');
  if (result.installRoot && !result.installRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/')) errors.push('installRoot must be under .codex-temp Hermes install root.');
  if (!result.auditedHead) errors.push('auditedHead is required.');
  if (!result.sourceCopyRoot) errors.push('sourceCopyRoot is required.');
  if (!result.manifest) errors.push('manifest is required.');
  if (!result.manifestPath) errors.push('manifestPath is required.');
  if (!result.resultPath) errors.push('resultPath is required.');
  if (result.scriptsStatus !== 'not_executed') errors.push('scriptsStatus must be not_executed.');
  if (result.hermesExecutionStatus !== 'not_allowed') errors.push('Hermes execution must remain not_allowed.');
  if (result.credentialsStatus !== 'not_allowed') errors.push('credentials must remain not_allowed.');
  if (result.canExecuteHermes || result.canRunHermesScripts || result.canUseCredentials || result.canCallModels || result.canMutateProjectFiles || result.canDeploy) errors.push('dangerous capability flags must remain false.');
  if (result.pythonInstallStatus === 'installed') errors.push('python install cannot be installed in v1.');
  for (const command of result.commandResults) {
    if (command.shell !== false) errors.push(`${command.commandKind} must use shell false.`);
    if (command.commandKind === 'npm_cli_js_ci_ignore_scripts') {
      if (!command.command.includes('--ignore-scripts')) errors.push('npm cli js ci must include --ignore-scripts.');
      if (!command.command.includes('--no-audit')) errors.push('npm cli js ci must include --no-audit.');
      if (!command.command.includes('--no-fund')) errors.push('npm cli js ci must include --no-fund.');
      if (!command.npmCliJsPath) errors.push('npm cli js command must record npmCliJsPath.');
    }
  }
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.');
  if (result.status !== 'success') warnings.push('runtime result did not finish success.');
  return { ok: errors.length === 0, errors, warnings };
}
