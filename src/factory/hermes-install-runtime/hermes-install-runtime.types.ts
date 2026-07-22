import type { FactoryHermesInstallApprovalResult } from '../hermes-install-approval/index.ts';

export type FactoryHermesInstallRuntimeVersion = '1.0';
export type FactoryHermesInstallRuntimeKind = 'factory_hermes_install_runtime';
export type FactoryHermesInstallRuntimeStatus = 'success' | 'blocked' | 'failed';
export type FactoryHermesInstallRuntimeDecision = 'install_completed_for_audited_head' | 'blocked' | 'failed';
export type FactoryHermesInstallCommandKind = 'git_rev_parse_head' | 'node_version' | 'npm_cli_js_version' | 'npm_cli_js_ci_ignore_scripts' | 'python_version_detection';

export interface FactoryHermesInstallRuntimePolicy {
  requireApprovedInstallEnvelope: boolean;
  requireAuditedHeadOnly: boolean;
  requireSourceCheckout: boolean;
  requireInstallRootUnderCodexTemp: boolean;
  requireSourceCopy: boolean;
  requireCommandAllowlist: boolean;
  requireShellFalse: boolean;
  allowNodeNpmCiIgnoreScripts: boolean;
  forbidNpmInstallWithoutLockfile: boolean;
  forbidPackageLifecycleScripts: boolean;
  forbidPythonInstallInV1: boolean;
  forbidSetupPyExecution: boolean;
  forbidHermesExecution: boolean;
  forbidHermesScripts: boolean;
  forbidCredentials: boolean;
  forbidProjectPackageMutation: boolean;
  forbidGlobalInstall: boolean;
  forbidDeploy: boolean;
  requireManifest: boolean;
  requireResultJson: boolean;
  requireJefeReviewAfterInstall: boolean;
}

export interface FactoryHermesInstallRuntimeInput {
  hermesInstallApprovalResult?: FactoryHermesInstallApprovalResult;
  executedAt: string;
  executedBy: string;
  policy?: Partial<FactoryHermesInstallRuntimePolicy>;
  allowNodeDependencyInstall?: boolean;
  allowPythonInstall?: boolean;
  dryRun?: boolean;
}

export interface FactoryHermesInstallCommandResult {
  commandKind: FactoryHermesInstallCommandKind;
  command: string[];
  executableUsed?: string;
  npmCliJsPath?: string;
  commandDisplay?: string;
  cwd: string;
  shell: false;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export interface FactoryHermesInstallSurfaceResult {
  surface: 'node' | 'python';
  status: string;
  details: string[];
}

export interface FactoryHermesInstallManifest {
  manifestKind: 'factory_hermes_install_manifest';
  manifestVersion: FactoryHermesInstallRuntimeVersion;
  toolId: 'hermes_agent';
  auditedHead: string;
  remoteHead: string;
  installVersionScope: 'audited_head_only';
  sourcePathOriginalRef: string;
  sourceCopyRoot: string;
  installRoot: string;
  nodeInstallStatus: string;
  pythonInstallStatus: string;
  packageManagerUsed?: 'npm';
  lockfilesObserved: string[];
  scriptsExecuted: false;
  dependenciesInstalled: boolean;
  installedAt: string;
  installedBy: string;
  commandSummary: Array<{ commandKind: FactoryHermesInstallCommandKind; exitCode: number | null; shell: false }>;
  hermesExecutionStatus: 'not_allowed';
  credentialsStatus: 'not_allowed';
  projectMutationStatus: 'not_allowed';
  nextRequiredGate: string[];
}

export interface FactoryHermesInstallRuntimeResult {
  installRuntimeId: string;
  installRuntimeKind: FactoryHermesInstallRuntimeKind;
  installRuntimeVersion: FactoryHermesInstallRuntimeVersion;
  executedAt: string;
  executedBy: string;
  toolId: 'hermes_agent';
  auditedHead?: string;
  remoteHead?: string;
  installVersionScope?: 'audited_head_only';
  installRoot?: string;
  sourceCopyRoot?: string;
  manifest?: FactoryHermesInstallManifest;
  manifestPath?: string;
  resultPath?: string;
  commandResults: FactoryHermesInstallCommandResult[];
  surfaceResults: FactoryHermesInstallSurfaceResult[];
  status: FactoryHermesInstallRuntimeStatus;
  decision: FactoryHermesInstallRuntimeDecision;
  checks: string[];
  blockers: string[];
  warnings: string[];
  nodeInstallStatus: string;
  pythonInstallStatus: string;
  scriptsStatus: 'not_executed';
  hermesExecutionStatus: 'not_allowed';
  credentialsStatus: 'not_allowed';
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

export interface FactoryHermesInstallRuntimeValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface FactoryHermesInstallRuntimeSummary {
  installRuntimeId: string;
  auditedHead?: string;
  installRoot?: string;
  nodeInstallStatus: string;
  pythonInstallStatus: string;
  dependenciesInstalled: boolean;
  scriptsExecuted: false;
  hermesExecutionStatus: 'not_allowed';
  canExecuteHermes: false;
  nextStep: string;
}
