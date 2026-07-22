import type { FactoryHermesInstallVerificationKind, FactoryHermesInstallVerificationPolicy, FactoryHermesInstallVerificationVersion } from './hermes-install-verification.types.ts';

export const FACTORY_HERMES_INSTALL_VERIFICATION_KIND: FactoryHermesInstallVerificationKind = 'factory_hermes_install_verification';
export const FACTORY_HERMES_INSTALL_VERIFICATION_VERSION: FactoryHermesInstallVerificationVersion = '1.0';
export const DEFAULT_FACTORY_HERMES_INSTALL_VERIFICATION_POLICY: FactoryHermesInstallVerificationPolicy = {
  requireInstallRootUnderCodexTemp: true,
  requireManifest: true,
  requireInstallResult: true,
  requireSourceCopy: true,
  forbidGitDirectoryInSourceCopy: true,
  requireAuditedHeadMatch: true,
  requireInstallVersionScopeAuditedHeadOnly: true,
  requireNpmCliJsCommandIfNodeInstalled: true,
  requireShellFalseForCommands: true,
  requireIgnoreScripts: true,
  requireNoAudit: true,
  requireNoFund: true,
  requireHermesNotExecuted: true,
  requireHermesScriptsNotExecuted: true,
  requirePythonInstallBlockedInV1: true,
  requireNoPipInstall: true,
  requireNoSetupPyExecution: true,
  requireNoCredentials: true,
  requireNoModelCalls: true,
  requireNoProjectPackageMutation: true,
  forbidExecutionInThisGate: true,
  forbidInstallInThisGate: true,
  forbidCredentialUse: true,
  forbidDeploy: true,
};
export const HERMES_INSTALL_VERIFICATION_NEXT_STEP = 'Proceed to Factory Hermes Python Install Strategy Gate v1 before Hermes execution or research runtime planning.';
