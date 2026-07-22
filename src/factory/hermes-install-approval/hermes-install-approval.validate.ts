import {
  DEFAULT_FACTORY_HERMES_INSTALL_APPROVAL_POLICY,
  FACTORY_HERMES_INSTALL_APPROVAL_KIND,
  FACTORY_HERMES_INSTALL_APPROVAL_VERSION,
} from './hermes-install-approval.defaults.ts';
import type {
  FactoryHermesInstallApprovalInput,
  FactoryHermesInstallApprovalResult,
  FactoryHermesInstallApprovalValidationResult,
} from './hermes-install-approval.types.ts';

function hasSecretLikeText(value: unknown): boolean {
  return typeof value === 'string' && /(api[_-]?key|secret|token|password)\s*[:=]/iu.test(value);
}

function inspectForSecrets(value: unknown): boolean {
  if (hasSecretLikeText(value)) return true;
  if (Array.isArray(value)) return value.some(inspectForSecrets);
  if (value && typeof value === 'object') return Object.values(value).some(inspectForSecrets);
  return false;
}

export function validateFactoryHermesInstallApprovalInput(
  input: FactoryHermesInstallApprovalInput,
): FactoryHermesInstallApprovalValidationResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_INSTALL_APPROVAL_POLICY, ...input.policy };
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!input.hermesInstallationPlanResult) errors.push('Installation plan result is required.');
  if (!input.hermesRuntimeBoundaryResult) errors.push('Runtime boundary result is required.');
  if (!input.reviewedAt) errors.push('reviewedAt is required.');
  if (!input.reviewedBy) errors.push('reviewedBy is required.');
  if (policy.requireHumanApproval && !input.humanApprovalRef) errors.push('humanApprovalRef is required.');
  if (inspectForSecrets(input.reviewNotes ?? [])) errors.push('Input review notes appear to contain secret-like material.');
  return { ok: errors.length === 0, errors, warnings };
}

export function validateFactoryHermesInstallApprovalResult(
  result: FactoryHermesInstallApprovalResult,
): FactoryHermesInstallApprovalValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (result.approvalKind !== FACTORY_HERMES_INSTALL_APPROVAL_KIND) errors.push('Invalid approval kind.');
  if (result.approvalVersion !== FACTORY_HERMES_INSTALL_APPROVAL_VERSION) errors.push('Invalid approval version.');
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.');
  if (result.status === 'install_envelope_candidate_approved' && !result.auditedHead) errors.push('approved result requires auditedHead.');
  if (result.status === 'install_envelope_candidate_approved' && !result.approvalReceipt) errors.push('approved result requires approvalReceipt.');
  if (result.status === 'install_envelope_candidate_approved' && !result.approvedInstallEnvelope) errors.push('approved result requires approvedInstallEnvelope.');
  if (result.canInstallHermesNow !== false || result.canExecuteHermes !== false || result.canRunHermesScripts !== false || result.canUseCredentials !== false || result.canCallModels !== false || result.canMutateProjectFiles !== false || result.canDeploy !== false) errors.push('Dangerous capability flags must remain false.');
  if (result.approvedInstallEnvelope) {
    const envelope = result.approvedInstallEnvelope;
    if (envelope.installStatus !== 'not_installed') errors.push('Envelope installStatus must be not_installed.');
    if (envelope.executionStatus !== 'not_allowed') errors.push('Envelope executionStatus must be not_allowed.');
    if (envelope.scriptsStatus !== 'not_allowed') errors.push('Envelope scriptsStatus must be not_allowed.');
    if (envelope.credentialsStatus !== 'not_allowed') errors.push('Envelope credentialsStatus must be not_allowed.');
    if (envelope.installVersionScope !== 'audited_head_only') errors.push('Envelope installVersionScope must be audited_head_only.');
  }
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.');
  if (result.headsMatch === false && !result.warnings.some((warning) => warning.warningId === 'remote_head_differs_from_audited_head')) errors.push('Head mismatch must produce warning.');
  if (inspectForSecrets(result)) errors.push('Result appears to contain secret-like material.');
  return { ok: errors.length === 0, errors, warnings };
}
