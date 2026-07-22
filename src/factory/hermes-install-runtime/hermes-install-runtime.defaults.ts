import type { FactoryHermesInstallRuntimeKind, FactoryHermesInstallRuntimePolicy, FactoryHermesInstallRuntimeVersion } from './hermes-install-runtime.types.ts';

export const FACTORY_HERMES_INSTALL_RUNTIME_KIND: FactoryHermesInstallRuntimeKind = 'factory_hermes_install_runtime';
export const FACTORY_HERMES_INSTALL_RUNTIME_VERSION: FactoryHermesInstallRuntimeVersion = '1.0';

export const DEFAULT_FACTORY_HERMES_INSTALL_RUNTIME_POLICY: FactoryHermesInstallRuntimePolicy = {
  requireApprovedInstallEnvelope: true,
  requireAuditedHeadOnly: true,
  requireSourceCheckout: true,
  requireInstallRootUnderCodexTemp: true,
  requireSourceCopy: true,
  requireCommandAllowlist: true,
  requireShellFalse: true,
  allowNodeNpmCiIgnoreScripts: true,
  forbidNpmInstallWithoutLockfile: true,
  forbidPackageLifecycleScripts: true,
  forbidPythonInstallInV1: true,
  forbidSetupPyExecution: true,
  forbidHermesExecution: true,
  forbidHermesScripts: true,
  forbidCredentials: true,
  forbidProjectPackageMutation: true,
  forbidGlobalInstall: true,
  forbidDeploy: true,
  requireManifest: true,
  requireResultJson: true,
  requireJefeReviewAfterInstall: true,
};

export const HERMES_INSTALL_RUNTIME_NEXT_STEP = 'Proceed to Hermes Install Verification Gate; Python surfaces require Hermes Python Install Strategy Gate before any Python installation.';
