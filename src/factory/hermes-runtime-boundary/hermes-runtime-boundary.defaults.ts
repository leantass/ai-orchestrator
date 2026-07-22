import type {
  FactoryHermesRuntimeBoundaryKind,
  FactoryHermesRuntimeBoundaryPolicy,
  FactoryHermesRuntimeBoundaryVersion,
} from './hermes-runtime-boundary.types.ts';

export const FACTORY_HERMES_RUNTIME_BOUNDARY_KIND: FactoryHermesRuntimeBoundaryKind =
  'factory_hermes_runtime_boundary';

export const FACTORY_HERMES_RUNTIME_BOUNDARY_VERSION: FactoryHermesRuntimeBoundaryVersion = '1.0';

export const DEFAULT_FACTORY_HERMES_RUNTIME_BOUNDARY_POLICY: FactoryHermesRuntimeBoundaryPolicy = {
  requireInstallationPlan: true,
  requireAuditedHead: true,
  requireIsolatedInstallRoot: true,
  requireIsolatedRuntimeRoot: true,
  requireInputOutputRoots: true,
  requireFilesystemPolicy: true,
  requireNetworkPolicy: true,
  requireEnvironmentPolicy: true,
  requireCredentialPolicy: true,
  requireExecutionPolicy: true,
  requireLoggingPolicy: true,
  requireKillSwitches: true,
  requireAdapterRequirements: true,
  requireResultContract: true,
  requireHumanReview: true,
  forbidInstallInThisGate: true,
  forbidExecutionInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidExternalNetworkByDefault: true,
  forbidProjectMutation: true,
  forbidDeploy: true,
  requireJefeReviewAfterToolResult: true,
  requireResultIngestion: true,
  requireNoVendorIntoRepo: true,
};

export const HERMES_RUNTIME_BOUNDARY_NEXT_STEP =
  'Proceed to Factory Hermes Install Runtime Adapter only after explicit approval, or re-audit the Hermes remote HEAD before installation; Hermes execution remains disabled.';
