export type FactoryHermesInstallVerificationVersion = '1.0';
export type FactoryHermesInstallVerificationKind = 'factory_hermes_install_verification';
export type FactoryHermesInstallVerificationStatus = 'blocked' | 'repair_required' | 'verified_partial' | 'verified';
export type FactoryHermesInstallVerificationDecision = 'blocked' | 'request_install_repair' | 'verified_node_install_python_strategy_required' | 'verified_install_ready_for_next_gate';

export interface FactoryHermesInstallVerificationInput {
  installRoot: string;
  expectedAuditedHead: string;
  expectedInstallVersionScope: 'audited_head_only';
  verifiedAt: string;
  verifiedBy: string;
  policy?: Partial<FactoryHermesInstallVerificationPolicy>;
}

export interface FactoryHermesInstallVerificationPolicy {
  requireInstallRootUnderCodexTemp: boolean;
  requireManifest: boolean;
  requireInstallResult: boolean;
  requireSourceCopy: boolean;
  forbidGitDirectoryInSourceCopy: boolean;
  requireAuditedHeadMatch: boolean;
  requireInstallVersionScopeAuditedHeadOnly: boolean;
  requireNpmCliJsCommandIfNodeInstalled: boolean;
  requireShellFalseForCommands: boolean;
  requireIgnoreScripts: boolean;
  requireNoAudit: boolean;
  requireNoFund: boolean;
  requireHermesNotExecuted: boolean;
  requireHermesScriptsNotExecuted: boolean;
  requirePythonInstallBlockedInV1: boolean;
  requireNoPipInstall: boolean;
  requireNoSetupPyExecution: boolean;
  requireNoCredentials: boolean;
  requireNoModelCalls: boolean;
  requireNoProjectPackageMutation: boolean;
  forbidExecutionInThisGate: boolean;
  forbidInstallInThisGate: boolean;
  forbidCredentialUse: boolean;
  forbidDeploy: boolean;
}

export interface FactoryHermesInstallVerificationCheck { checkId: string; ok: boolean; message: string }
export interface FactoryHermesInstallVerificationBlocker { blockerId: string; message: string }
export interface FactoryHermesInstallVerificationWarning { warningId: string; message: string }
export interface FactoryHermesInstallArtifactStatus { installRootExists: boolean; sourceCopyExists: boolean; gitDirectoryAbsent: boolean; manifestExists: boolean; installResultExists: boolean; nodeModulesExists: boolean; packageJsonExists: boolean; packageLockExists: boolean }
export interface FactoryHermesInstallCommandVerification { npmCliJsCommandFound: boolean; shellFalse: boolean; argsExact: boolean; noCmdExe: boolean; noPowerShell: boolean; noNpmInstall: boolean; noPipInstall: boolean; noSetupPyExecution: boolean }
export interface FactoryHermesInstallManifestVerification { manifestParsed: boolean; resultParsed: boolean; toolId: 'hermes_agent' | 'unknown'; auditedHeadMatches: boolean; installVersionScopeMatches: boolean }

export interface FactoryHermesInstallVerificationResult {
  verificationId: string;
  verificationKind: FactoryHermesInstallVerificationKind;
  verificationVersion: FactoryHermesInstallVerificationVersion;
  verifiedAt: string;
  verifiedBy: string;
  toolId: 'hermes_agent';
  installRoot: string;
  sourceCopyRoot: string;
  auditedHead?: string;
  installVersionScope?: 'audited_head_only';
  status: FactoryHermesInstallVerificationStatus;
  decision: FactoryHermesInstallVerificationDecision;
  artifactStatus: FactoryHermesInstallArtifactStatus;
  manifestVerification: FactoryHermesInstallManifestVerification;
  commandVerification: FactoryHermesInstallCommandVerification;
  checks: FactoryHermesInstallVerificationCheck[];
  blockers: FactoryHermesInstallVerificationBlocker[];
  warnings: FactoryHermesInstallVerificationWarning[];
  nodeInstallVerified: boolean;
  pythonInstallStatus: string;
  hermesExecutionVerifiedAsNotRun: boolean;
  scriptsVerifiedAsNotRun: boolean;
  projectPackageMutationDetected: false;
  canExecuteHermes: false;
  canRunHermesScripts: false;
  canUseCredentials: false;
  canCallModels: false;
  canMutateProjectFiles: false;
  canDeploy: false;
  recommendedNextStep: string;
}

export interface FactoryHermesInstallVerificationValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesInstallVerificationSummary { verificationId: string; auditedHead?: string; installRoot: string; status: FactoryHermesInstallVerificationStatus; decision: FactoryHermesInstallVerificationDecision; nodeInstallVerified: boolean; pythonInstallStatus: string; hermesExecutionVerifiedAsNotRun: boolean; scriptsVerifiedAsNotRun: boolean; canExecuteHermes: false; nextStep: string }
