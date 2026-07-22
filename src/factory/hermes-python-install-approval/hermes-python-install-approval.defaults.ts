import type {
  FactoryHermesPythonInstallApprovalKind,
  FactoryHermesPythonInstallApprovalPolicy,
  FactoryHermesPythonInstallApprovalVersion,
} from './hermes-python-install-approval.types.ts';

export const FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_KIND: FactoryHermesPythonInstallApprovalKind =
  'factory_hermes_python_install_approval';

export const FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_VERSION: FactoryHermesPythonInstallApprovalVersion = '1.0';

export const DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_POLICY: FactoryHermesPythonInstallApprovalPolicy = {
  requirePythonInstallStrategy: true,
  requireHumanApproval: true,
  requireReviewerIdentity: true,
  requireAuditedHead: true,
  requireSourceRoot: true,
  requireInstallRoot: true,
  requirePythonEnvRootUnderCodexTemp: true,
  allowUvLockRuntimeCandidate: true,
  allowVenvPipRuntimeCandidate: true,
  forbidPythonInstallInThisGate: true,
  forbidUvExecutionInThisGate: true,
  forbidPipExecutionInThisGate: true,
  forbidVenvCreationInThisGate: true,
  forbidSetupPyExecution: true,
  forbidGlobalPipInstall: true,
  forbidHermesExecutionInThisGate: true,
  forbidHermesScriptsInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidProjectMutation: true,
  forbidPackageFileMutation: true,
  forbidDeploy: true,
  requirePythonInstallRuntimeAdapterFuture: true,
  requirePythonInstallVerificationFuture: true,
  requireJefeReviewFuture: true,
};

export const HERMES_PYTHON_INSTALL_APPROVAL_NEXT_STEP =
  'Proceed to Factory Hermes Python Install Runtime Adapter v1 only after explicit controlled-install authorization; Hermes execution remains disabled.';

export const HERMES_PYTHON_INSTALL_APPROVAL_NOT_AUTHORIZED_ACTIONS = [
  'install_python_now',
  'execute_uv_now',
  'execute_pip_now',
  'create_venv_now',
  'execute_setup_py',
  'global_pip_install',
  'execute_hermes',
  'run_hermes_scripts',
  'mutate_project_package_files',
  'read_env',
  'access_credentials',
  'call_model',
  'deploy',
  'publish',
  'execute_codex',
] as const;
