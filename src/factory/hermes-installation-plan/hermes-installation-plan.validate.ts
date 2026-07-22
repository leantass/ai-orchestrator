import {
  FACTORY_HERMES_INSTALLATION_PLAN_KIND,
  FACTORY_HERMES_INSTALLATION_PLAN_VERSION,
} from './hermes-installation-plan.defaults.ts';
import type {
  FactoryHermesInstallationPlan,
  FactoryHermesInstallationPlanResult,
  FactoryHermesInstallationPlanValidationResult,
} from './hermes-installation-plan.types.ts';

function hasSecretLikeText(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return /(api[_-]?key|secret|token|password)\s*[:=]/iu.test(value);
}

function inspectForSecrets(value: unknown): boolean {
  if (hasSecretLikeText(value)) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.some(inspectForSecrets);
  }
  if (value && typeof value === 'object') {
    return Object.values(value).some(inspectForSecrets);
  }
  return false;
}

export function validateFactoryHermesInstallationPlan(
  plan: FactoryHermesInstallationPlan,
): FactoryHermesInstallationPlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (plan.planKind !== FACTORY_HERMES_INSTALLATION_PLAN_KIND) errors.push('Invalid Hermes installation plan kind.');
  if (plan.planVersion !== FACTORY_HERMES_INSTALLATION_PLAN_VERSION) errors.push('Invalid Hermes installation plan version.');
  if (plan.toolId !== 'hermes_agent') errors.push('Plan toolId must be hermes_agent.');
  if (!plan.auditedHead) errors.push('Plan auditedHead is required.');
  if (!plan.remoteHead) errors.push('Plan remoteHead is required.');
  if (!plan.sourcePathRef) errors.push('Plan sourcePathRef is required.');
  if (!plan.recommendedNextStep) errors.push('Plan recommendedNextStep is required.');
  if (plan.installAllowedNow !== false) errors.push('Plan cannot allow install now.');
  if (plan.executionAllowedNow !== false) errors.push('Plan cannot allow execution now.');
  if (plan.credentialsAllowedNow !== false) errors.push('Plan cannot allow credentials now.');
  if (plan.scriptsExecuted !== false) errors.push('Plan cannot mark scripts executed.');
  if (plan.dependenciesInstalled !== false) errors.push('Plan cannot mark dependencies installed.');
  if (plan.projectPackageMutated !== false) errors.push('Plan cannot mutate project package files.');
  if (plan.runtimeBoundaryRequired !== true) errors.push('Plan must require runtime boundary.');
  if (plan.adapterRequired !== true) errors.push('Plan must require adapter.');
  if (plan.resultIngestionRequired !== true) errors.push('Plan must require result ingestion.');
  if (plan.jefeReviewRequired !== true) errors.push('Plan must require JEFE review.');
  if (!plan.isolatedInstallRootSuggestion.startsWith('.codex-temp/external-tools/hermes-agent/install/')) {
    errors.push('Plan isolated install root must stay under the controlled Hermes .codex-temp install root.');
  }
  if (!plan.headsMatch && !plan.risks.some((risk) => risk.riskId === 'remote_head_differs_from_audited_head')) {
    errors.push('Plan with differing heads must include remote_head_differs_from_audited_head risk.');
  }
  if (inspectForSecrets(plan)) errors.push('Plan appears to contain secret-like material.');
  if (plan.installSteps.length === 0) warnings.push('Plan has no install steps.');
  if (plan.validationSteps.length === 0) warnings.push('Plan has no validation steps.');

  return { ok: errors.length === 0, errors, warnings };
}

export function validateFactoryHermesInstallationPlanResult(
  result: FactoryHermesInstallationPlanResult,
): FactoryHermesInstallationPlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (result.resultKind !== FACTORY_HERMES_INSTALLATION_PLAN_KIND) errors.push('Invalid result kind.');
  if (result.resultVersion !== FACTORY_HERMES_INSTALLATION_PLAN_VERSION) errors.push('Invalid result version.');
  if (!result.resultId) errors.push('Result id is required.');
  if (!result.recommendedNextStep) errors.push('Result recommendedNextStep is required.');
  if (result.installAllowedNow !== false) errors.push('Result cannot allow install now.');
  if (result.executionAllowedNow !== false) errors.push('Result cannot allow execution now.');
  if (result.credentialsAllowedNow !== false) errors.push('Result cannot allow credentials now.');
  if (result.scriptsExecuted !== false) errors.push('Result cannot mark scripts executed.');
  if (result.dependenciesInstalled !== false) errors.push('Result cannot mark dependencies installed.');
  if (result.projectPackageMutated !== false) errors.push('Result cannot mutate project package files.');
  if (result.canExecuteCodex !== false) errors.push('Result cannot enable Codex.');
  if (result.status === 'install_plan_ready_for_audited_head' && !result.installationPlan) {
    errors.push('Ready result must include installationPlan.');
  }
  if (result.installationPlan) {
    const planValidation = validateFactoryHermesInstallationPlan(result.installationPlan);
    errors.push(...planValidation.errors.map((error) => `Plan: ${error}`));
    warnings.push(...planValidation.warnings.map((warning) => `Plan: ${warning}`));
  }
  if (inspectForSecrets(result)) errors.push('Result appears to contain secret-like material.');

  return { ok: errors.length === 0, errors, warnings };
}
