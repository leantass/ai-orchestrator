import type {
  FactoryHermesInstallationPlanKind,
  FactoryHermesInstallationPlanPolicy,
  FactoryHermesInstallationPlanVersion,
} from './hermes-installation-plan.types.ts';

export const FACTORY_HERMES_INSTALLATION_PLAN_KIND: FactoryHermesInstallationPlanKind =
  'factory_hermes_installation_plan';

export const FACTORY_HERMES_INSTALLATION_PLAN_VERSION: FactoryHermesInstallationPlanVersion = '1.0';

export const DEFAULT_FACTORY_HERMES_INSTALLATION_PLAN_POLICY: FactoryHermesInstallationPlanPolicy = {
  requireSourceCheckoutAudit: true,
  requireAuditedHead: true,
  requireRemoteHead: true,
  requireVersionPolicy: true,
  requireHumanReviewForInstall: true,
  requireRuntimeBoundaryBeforeExecution: true,
  forbidInstallInThisGate: true,
  forbidExecutionInThisGate: true,
  forbidScriptsInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidProjectPackageMutation: true,
  forbidGlobalInstall: true,
  forbidShellAdapter: true,
  forbidCodexExecution: true,
  requireIsolatedToolRoot: true,
  requireNoVendorIntoRepo: true,
  requireResultIngestionFuture: true,
  requireJefeReviewFuture: true,
};

export const HERMES_AGENT_TOOL_ID = 'hermes_agent' as const;

export const HERMES_INSTALLATION_PLAN_SAFE_NEXT_STEP =
  'Proceed to Factory Hermes Runtime Boundary Contract v1 or re-audit the remote HEAD before any future install runtime approval; Hermes execution remains disabled.';
