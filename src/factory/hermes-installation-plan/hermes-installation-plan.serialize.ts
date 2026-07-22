import type {
  FactoryHermesInstallationPlanResult,
  FactoryHermesInstallationPlanSummary,
} from './hermes-installation-plan.types.ts';

export function serializeFactoryHermesInstallationPlanResult(
  result: FactoryHermesInstallationPlanResult,
): string {
  return JSON.stringify(result, null, 2);
}

export function parseFactoryHermesInstallationPlanResult(json: string): FactoryHermesInstallationPlanResult {
  return JSON.parse(json) as FactoryHermesInstallationPlanResult;
}

export function summarizeFactoryHermesInstallationPlanResult(
  result: FactoryHermesInstallationPlanResult,
): FactoryHermesInstallationPlanSummary {
  return {
    planId: result.installationPlan?.planId,
    auditedHead: result.installationPlan?.auditedHead ?? result.sourceAuditSnapshot?.auditedHead,
    remoteHead: result.installationPlan?.remoteHead ?? result.sourceAuditSnapshot?.remoteHead,
    headsMatch: result.installationPlan?.headsMatch ?? result.sourceAuditSnapshot?.headsMatch,
    versionPolicyDecision: result.installationPlan?.versionPolicyDecision,
    installAllowedNow: false,
    executionAllowedNow: false,
    dependenciesInstalled: false,
    scriptsExecuted: false,
    status: result.status,
    decision: result.decision,
    warningsCount: result.warnings.length,
    blockersCount: result.blockers.length,
    nextStep: result.recommendedNextStep,
  };
}
