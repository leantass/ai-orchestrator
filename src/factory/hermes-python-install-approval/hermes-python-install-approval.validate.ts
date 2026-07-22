import {
  DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_POLICY,
  FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_KIND,
  FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_VERSION,
} from './hermes-python-install-approval.defaults.ts';
import type {
  FactoryHermesPythonInstallApprovalInput,
  FactoryHermesPythonInstallApprovalResult,
  FactoryHermesPythonInstallApprovalValidationResult,
} from './hermes-python-install-approval.types.ts';

function hasSecretLikeText(value: unknown): boolean {
  return typeof value === 'string' && /(api[_-]?key|secret|token|password)\s*[:=]/iu.test(value);
}

function inspectForSecrets(value: unknown): boolean {
  if (hasSecretLikeText(value)) return true;
  if (Array.isArray(value)) return value.some(inspectForSecrets);
  if (value && typeof value === 'object') return Object.values(value).some(inspectForSecrets);
  return false;
}

export function validateFactoryHermesPythonInstallApprovalInput(
  input: FactoryHermesPythonInstallApprovalInput,
): FactoryHermesPythonInstallApprovalValidationResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_POLICY, ...input.policy };
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input.hermesPythonInstallStrategyResult) errors.push('Python Install Strategy result is required.');
  if (!input.reviewedAt) errors.push('reviewedAt is required.');
  if (!input.reviewedBy) errors.push('reviewedBy is required.');
  if (policy.requireHumanApproval && !input.humanApprovalRef) errors.push('humanApprovalRef is required.');
  if (inspectForSecrets(input.reviewNotes ?? [])) errors.push('Input review notes appear to contain secret-like material.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateFactoryHermesPythonInstallApprovalResult(
  result: FactoryHermesPythonInstallApprovalResult,
): FactoryHermesPythonInstallApprovalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (result.approvalKind !== FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_KIND) errors.push('Invalid approval kind.');
  if (result.approvalVersion !== FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_VERSION) errors.push('Invalid approval version.');
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.');
  if (result.status === 'python_install_envelope_candidate_approved' && !result.auditedHead) errors.push('approved result requires auditedHead.');
  if (result.status === 'python_install_envelope_candidate_approved' && !result.approvalReceipt) errors.push('approved result requires approvalReceipt.');
  if (result.status === 'python_install_envelope_candidate_approved' && !result.approvedPythonInstallEnvelope) errors.push('approved result requires approvedPythonInstallEnvelope.');
  if (result.canInstallPythonNow !== false || result.canExecuteHermes !== false || result.canRunHermesScripts !== false || result.canUseCredentials !== false || result.canCallModels !== false || result.canMutateProjectFiles !== false || result.canDeploy !== false) errors.push('Dangerous capability flags must remain false.');
  if (result.approvedPythonInstallEnvelope) {
    const envelope = result.approvedPythonInstallEnvelope;
    if (!envelope.pythonEnvRootRef.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/')) errors.push('pythonEnvRootRef must be under expected .codex-temp Hermes python-env root.');
    if (envelope.pythonInstallStatus !== 'not_installed') errors.push('Envelope pythonInstallStatus must be not_installed.');
    if (envelope.venvStatus !== 'not_created') errors.push('Envelope venvStatus must be not_created.');
    if (envelope.uvStatus !== 'not_executed') errors.push('Envelope uvStatus must be not_executed.');
    if (envelope.pipStatus !== 'not_executed') errors.push('Envelope pipStatus must be not_executed.');
    if (envelope.setupPyStatus !== 'not_executed') errors.push('Envelope setupPyStatus must be not_executed.');
    if (envelope.hermesExecutionStatus !== 'not_allowed') errors.push('Envelope hermesExecutionStatus must be not_allowed.');
    if (envelope.scriptsStatus !== 'not_allowed') errors.push('Envelope scriptsStatus must be not_allowed.');
    if (envelope.credentialsStatus !== 'not_allowed') errors.push('Envelope credentialsStatus must be not_allowed.');
  }
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.');
  if (inspectForSecrets(result)) errors.push('Result appears to contain secret-like material.');
  return { ok: errors.length === 0, errors, warnings };
}
