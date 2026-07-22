import type {
  FactoryHermesPythonInstallRuntimeKind,
  FactoryHermesPythonInstallRuntimePolicy,
  FactoryHermesPythonInstallRuntimeVersion,
} from './hermes-python-install-runtime.types.ts';

export const FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_KIND: FactoryHermesPythonInstallRuntimeKind =
  'factory_hermes_python_install_runtime';
export const FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_VERSION: FactoryHermesPythonInstallRuntimeVersion = '1.0';
export const HERMES_PYTHON_INSTALL_RUNTIME_NEXT_STEP = 'Proceed to Factory Hermes Python Install Verification Gate v1 before planning any Hermes runtime.';

export const DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_RUNTIME_POLICY: FactoryHermesPythonInstallRuntimePolicy = {
  requireApprovedPythonInstallEnvelope: true,
  requireUvLockMethodScope: true,
  requireUvLockFile: true,
  requirePyproject: true,
  requirePythonEnvRootUnderCodexTemp: true,
  requireCommandAllowlist: true,
  requireShellFalse: true,
  allowUvVersionDetection: true,
  allowUvVenv: true,
  allowUvSyncLockedNoInstallProject: true,
  forbidUvRun: true,
  forbidUvPipInstall: true,
  forbidPipExecution: true,
  forbidSetupPyExecution: true,
  forbidHermesExecution: true,
  forbidHermesScripts: true,
  forbidCredentials: true,
  forbidModelCalls: true,
  forbidProjectPackageMutation: true,
  forbidGlobalPythonInstall: true,
  forbidDeploy: true,
  requirePythonInstallManifest: true,
  requirePythonInstallResultJson: true,
  requireFuturePythonInstallVerification: true,
  requireJefeReviewAfterPythonInstall: true,
};
