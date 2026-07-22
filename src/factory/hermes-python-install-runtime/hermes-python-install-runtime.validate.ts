import {
  FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_KIND,
  FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_VERSION,
} from './hermes-python-install-runtime.defaults.ts';
import type { FactoryHermesPythonInstallRuntimeInput, FactoryHermesPythonInstallRuntimeResult, FactoryHermesPythonInstallRuntimeValidationResult } from './hermes-python-install-runtime.types.ts';

function hasSecretLikeText(value: unknown): boolean {
  return typeof value === 'string' && /(api[_-]?key|secret|token|password)\s*[:=]/iu.test(value);
}

function inspectForSecrets(value: unknown): boolean {
  if (hasSecretLikeText(value)) return true;
  if (Array.isArray(value)) return value.some(inspectForSecrets);
  if (value && typeof value === 'object') return Object.values(value).some(inspectForSecrets);
  return false;
}

export function validateFactoryHermesPythonInstallRuntimeInput(input: FactoryHermesPythonInstallRuntimeInput): FactoryHermesPythonInstallRuntimeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const approval = input.hermesPythonInstallApprovalResult;
  const envelope = approval?.approvedPythonInstallEnvelope;
  if (!approval) errors.push('Python install approval result is required.');
  if (!envelope) errors.push('approvedPythonInstallEnvelope is required.');
  if (approval && approval.status !== 'python_install_envelope_candidate_approved') errors.push('Python install approval status must be approved.');
  if (envelope?.pythonInstallMethodScope !== 'uv_lock_isolated_only') errors.push('Python install method scope must be uv_lock_isolated_only.');
  if (!input.executedAt) errors.push('executedAt is required.');
  if (!input.executedBy) errors.push('executedBy is required.');
  if (inspectForSecrets(input)) errors.push('Input appears to contain secret-like material.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateFactoryHermesPythonInstallRuntimeResult(result: FactoryHermesPythonInstallRuntimeResult): FactoryHermesPythonInstallRuntimeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (result.pythonInstallRuntimeKind !== FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_KIND) errors.push('Invalid runtime kind.');
  if (result.pythonInstallRuntimeVersion !== FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_VERSION) errors.push('Invalid runtime version.');
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.');
  if (!result.sourceRootRef) errors.push('sourceRootRef is required.');
  if (!result.installRootRef) errors.push('installRootRef is required.');
  if (!result.pythonEnvRootRef?.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/')) errors.push('pythonEnvRootRef must be under .codex-temp Hermes python-env root.');
  if (result.status === 'success') {
    if (result.pythonInstallStatus !== 'installed_with_uv_lock_isolated') errors.push('success requires installed_with_uv_lock_isolated.');
    if (result.venvStatus !== 'created_with_uv') errors.push('success requires created_with_uv.');
    if (result.uvStatus !== 'executed_allowlisted') errors.push('success requires executed_allowlisted.');
  }
  if (result.pipStatus !== 'not_executed') errors.push('pipStatus must be not_executed.');
  if (result.setupPyStatus !== 'not_executed') errors.push('setupPyStatus must be not_executed.');
  if (result.hermesExecutionStatus !== 'not_allowed') errors.push('hermesExecutionStatus must be not_allowed.');
  if (result.scriptsStatus !== 'not_executed') errors.push('scriptsStatus must be not_executed.');
  if (result.credentialsStatus !== 'not_allowed') errors.push('credentialsStatus must be not_allowed.');
  if (result.canExecuteHermes || result.canRunHermesScripts || result.canUseCredentials || result.canCallModels || result.canMutateProjectFiles || result.canDeploy) errors.push('Dangerous capability flags must be false.');
  if (result.commandResults.some((command) => command.shell !== false)) errors.push('All command results must record shell false.');
  if (result.commandResults.some((command) => /pip|setup|hermes|uv_run/iu.test(command.commandKind))) errors.push('Command results contain forbidden command kind.');
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.');
  return { ok: errors.length === 0, errors, warnings };
}
