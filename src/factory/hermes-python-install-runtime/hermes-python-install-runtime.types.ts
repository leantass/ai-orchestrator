import type { FactoryHermesPythonInstallApprovalResult } from '../hermes-python-install-approval/index.ts';

export type FactoryHermesPythonInstallRuntimeVersion = '1.0';
export type FactoryHermesPythonInstallRuntimeKind = 'factory_hermes_python_install_runtime';
export type FactoryHermesPythonInstallRuntimeStatus = 'success' | 'blocked' | 'failed';
export type FactoryHermesPythonInstallRuntimeDecision =
  | 'python_install_completed_with_uv_lock_isolated'
  | 'blocked_uv_executable_not_found'
  | 'blocked_invalid_python_install_envelope'
  | 'failed_uv_venv'
  | 'failed_uv_sync'
  | 'request_python_install_repair';
export type FactoryHermesPythonInstallCommandKind =
  | 'uv_version'
  | 'uv_venv'
  | 'uv_sync_locked_no_install_project';

export interface FactoryHermesPythonInstallRuntimePolicy {
  requireApprovedPythonInstallEnvelope: boolean;
  requireUvLockMethodScope: boolean;
  requireUvLockFile: boolean;
  requirePyproject: boolean;
  requirePythonEnvRootUnderCodexTemp: boolean;
  requireCommandAllowlist: boolean;
  requireShellFalse: boolean;
  allowUvVersionDetection: boolean;
  allowUvVenv: boolean;
  allowUvSyncLockedNoInstallProject: boolean;
  forbidUvRun: boolean;
  forbidUvPipInstall: boolean;
  forbidPipExecution: boolean;
  forbidSetupPyExecution: boolean;
  forbidHermesExecution: boolean;
  forbidHermesScripts: boolean;
  forbidCredentials: boolean;
  forbidModelCalls: boolean;
  forbidProjectPackageMutation: boolean;
  forbidGlobalPythonInstall: boolean;
  forbidDeploy: boolean;
  requirePythonInstallManifest: boolean;
  requirePythonInstallResultJson: boolean;
  requireFuturePythonInstallVerification: boolean;
  requireJefeReviewAfterPythonInstall: boolean;
}

export interface FactoryHermesPythonInstallRuntimeInput {
  hermesPythonInstallApprovalResult?: FactoryHermesPythonInstallApprovalResult;
  executedAt: string;
  executedBy: string;
  policy?: Partial<FactoryHermesPythonInstallRuntimePolicy>;
  dryRun?: boolean;
}

export interface FactoryHermesPythonInstallCommandResult {
  commandKind: FactoryHermesPythonInstallCommandKind;
  executableUsed: string;
  commandDisplay: string;
  command: string[];
  cwd?: string;
  envSummary?: {
    UV_PROJECT_ENVIRONMENT: string;
    UV_NO_PROGRESS: '1';
    PYTHONNOUSERSITE: '1';
    PIP_CONFIG_FILE: string;
  };
  shell: false;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export interface FactoryHermesPythonInstallManifest {
  manifestKind: 'factory_hermes_python_install_manifest';
  manifestVersion: FactoryHermesPythonInstallRuntimeVersion;
  toolId: 'hermes_agent';
  auditedHead: string;
  sourceRootRef: string;
  installRootRef: string;
  pythonEnvRootRef: string;
  managerDecision: string;
  pythonInstallMethodScope: 'uv_lock_isolated_only';
  pyprojectPresent: boolean;
  uvLockPresent: boolean;
  setupPyPresent: boolean;
  uvExecutableUsed?: string;
  uvVersion?: string;
  commandSummary: Array<{ commandKind: FactoryHermesPythonInstallCommandKind; exitCode: number | null; shell: false }>;
  pythonInstallStatus: string;
  venvStatus: string;
  uvStatus: string;
  pipStatus: 'not_executed';
  setupPyStatus: 'not_executed';
  hermesExecutionStatus: 'not_allowed';
  scriptsStatus: 'not_executed';
  credentialsStatus: 'not_allowed';
  modelCallStatus: 'not_allowed';
  projectMutationStatus: 'not_allowed';
  installedAt: string;
  installedBy: string;
  nextRequiredGate: 'Factory Hermes Python Install Verification Gate v1';
}

export interface FactoryHermesPythonInstallRuntimeResult {
  pythonInstallRuntimeId: string;
  pythonInstallRuntimeKind: FactoryHermesPythonInstallRuntimeKind;
  pythonInstallRuntimeVersion: FactoryHermesPythonInstallRuntimeVersion;
  executedAt: string;
  executedBy: string;
  toolId: 'hermes_agent';
  auditedHead?: string;
  sourceRootRef?: string;
  installRootRef?: string;
  pythonEnvRootRef?: string;
  managerDecision?: string;
  pythonInstallMethodScope?: string;
  manifest?: FactoryHermesPythonInstallManifest;
  commandResults: FactoryHermesPythonInstallCommandResult[];
  checks: Array<{ checkId: string; ok: boolean; message: string }>;
  blockers: Array<{ blockerId: string; message: string }>;
  warnings: Array<{ warningId: string; message: string }>;
  status: FactoryHermesPythonInstallRuntimeStatus;
  decision: FactoryHermesPythonInstallRuntimeDecision;
  uvStatus: 'not_found' | 'not_executed' | 'executed_allowlisted';
  venvStatus: 'not_created' | 'created_with_uv';
  pythonInstallStatus: 'not_installed' | 'installed_with_uv_lock_isolated';
  pipStatus: 'not_executed';
  setupPyStatus: 'not_executed';
  hermesExecutionStatus: 'not_allowed';
  scriptsStatus: 'not_executed';
  credentialsStatus: 'not_allowed';
  modelCallStatus: 'not_allowed';
  projectMutationStatus: 'not_allowed';
  deployStatus: 'not_allowed';
  canExecuteHermes: false;
  canRunHermesScripts: false;
  canUseCredentials: false;
  canCallModels: false;
  canMutateProjectFiles: false;
  canDeploy: false;
  recommendedNextStep: string;
}

export interface FactoryHermesPythonInstallRuntimeValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesPythonInstallRuntimeSummary {
  pythonInstallRuntimeId: string;
  auditedHead?: string;
  sourceRootRef?: string;
  pythonEnvRootRef?: string;
  managerDecision?: string;
  methodScope?: string;
  pythonInstallStatus: string;
  venvStatus: string;
  uvStatus: string;
  pipStatus: string;
  setupPyStatus: string;
  hermesExecutionStatus: string;
  canExecuteHermes: false;
  nextStep: string;
}
