import type {
  FactoryHermesInstallApprovalKind,
  FactoryHermesInstallApprovalPolicy,
  FactoryHermesInstallApprovalVersion,
} from './hermes-install-approval.types.ts';

export const FACTORY_HERMES_INSTALL_APPROVAL_KIND: FactoryHermesInstallApprovalKind =
  'factory_hermes_install_approval';

export const FACTORY_HERMES_INSTALL_APPROVAL_VERSION: FactoryHermesInstallApprovalVersion = '1.0';

export const DEFAULT_FACTORY_HERMES_INSTALL_APPROVAL_POLICY: FactoryHermesInstallApprovalPolicy = {
  requireInstallationPlan: true,
  requireRuntimeBoundary: true,
  requireHumanApproval: true,
  requireReviewerIdentity: true,
  requireAuditedHeadMatch: true,
  allowRemoteHeadMismatchOnlyWithWarning: true,
  approveAuditedHeadOnly: true,
  requireInstallRootUnderCodexTemp: true,
  requireRuntimeBoundaryBeforeInstallRuntime: true,
  forbidInstallInThisGate: true,
  forbidExecutionInThisGate: true,
  forbidScriptsInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidProjectMutation: true,
  forbidPackageFileMutation: true,
  forbidGlobalInstall: true,
  forbidDeploy: true,
  requireInstallRuntimeAdapterFuture: true,
  requireInstallVerificationFuture: true,
  requireJefeReviewFuture: true,
};

export const HERMES_INSTALL_APPROVAL_NEXT_STEP =
  'Proceed to Factory Hermes Install Runtime Adapter v1 only after explicit install-runtime authorization; Hermes execution remains disabled.';

export const HERMES_INSTALL_APPROVAL_NOT_AUTHORIZED_ACTIONS = [
  'install_now',
  'execute_hermes',
  'run_hermes_scripts',
  'install_global_dependencies',
  'mutate_project_package_files',
  'read_env',
  'access_credentials',
  'call_model',
  'external_network_runtime',
  'deploy',
  'publish',
  'execute_codex',
] as const;
