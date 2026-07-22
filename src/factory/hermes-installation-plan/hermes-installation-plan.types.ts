export type FactoryHermesInstallationPlanVersion = '1.0';

export type FactoryHermesInstallationPlanKind = 'factory_hermes_installation_plan';

export type FactoryHermesVersionPolicyDecision =
  | 'pin_audited_head'
  | 'require_remote_head_reaudit'
  | 'block_until_version_decision'
  | 'allow_install_plan_for_audited_head_only';

export type FactoryHermesInstallationPlanDecision =
  | 'blocked'
  | 'request_install_plan_changes'
  | 'human_review_required'
  | 'approve_installation_plan_for_future_gate';

export type FactoryHermesInstallationPlanStatus =
  | 'blocked'
  | 'changes_required'
  | 'human_review_required'
  | 'install_plan_ready_for_audited_head';

export type FactoryHermesInstallSurfaceKind = 'node' | 'python' | 'shell' | 'docker' | 'nix' | 'unknown';

export interface FactoryHermesInstallationPlanPolicy {
  requireSourceCheckoutAudit: boolean;
  requireAuditedHead: boolean;
  requireRemoteHead: boolean;
  requireVersionPolicy: boolean;
  requireHumanReviewForInstall: boolean;
  requireRuntimeBoundaryBeforeExecution: boolean;
  forbidInstallInThisGate: boolean;
  forbidExecutionInThisGate: boolean;
  forbidScriptsInThisGate: boolean;
  forbidCredentialsInThisGate: boolean;
  forbidProjectPackageMutation: boolean;
  forbidGlobalInstall: boolean;
  forbidShellAdapter: boolean;
  forbidCodexExecution: boolean;
  requireIsolatedToolRoot: boolean;
  requireNoVendorIntoRepo: boolean;
  requireResultIngestionFuture: boolean;
  requireJefeReviewFuture: boolean;
}

export interface FactoryHermesSourceAuditSnapshot {
  remoteUrl: string;
  sourcePath: string;
  auditedHead: string;
  remoteHead: string;
  headsMatch: boolean;
  checkoutStrategy: string;
  sparsePatterns: string[];
  manifestsFound: string[];
  likelyEcosystems: Array<'node' | 'python' | 'mixed' | 'unknown'>;
  installSurfaces: FactoryHermesInstallSurface[];
  runtimeSurfaces: FactoryHermesRuntimeSurface[];
  cliSurfaces: string[];
  docsSurfaces: string[];
  licenseDetected?: string;
  packageManagersDetected: string[];
  lockfilesDetected: string[];
  scriptsDetected: string[];
  riskNotes: string[];
}

export interface FactoryHermesInstallationPlanInput {
  sourceAuditSnapshot?: FactoryHermesSourceAuditSnapshot;
  createdAt: string;
  createdBy: string;
  policy?: Partial<FactoryHermesInstallationPlanPolicy>;
  humanReviewRef?: string;
  preferredVersionPolicy?: FactoryHermesVersionPolicyDecision;
}

export interface FactoryHermesInstallSurface {
  surfaceId: string;
  kind: FactoryHermesInstallSurfaceKind;
  path: string;
  description: string;
  installCommandCandidates: string[];
  executionAllowedNow: false;
}

export interface FactoryHermesRuntimeSurface {
  surfaceId: string;
  kind: 'cli' | 'python_module' | 'node_workspace' | 'service' | 'docker' | 'unknown';
  path: string;
  description: string;
  executionAllowedNow: false;
}

export interface FactoryHermesInstallStep {
  stepId: string;
  title: string;
  description: string;
  declarativeOnly: true;
  executed: false;
}

export interface FactoryHermesValidationStep {
  stepId: string;
  title: string;
  description: string;
  declarativeOnly: true;
  executed: false;
}

export interface FactoryHermesRisk {
  riskId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  mitigation: string;
}

export interface FactoryHermesInstallationPlanCheck {
  checkId: string;
  ok: boolean;
  message: string;
}

export interface FactoryHermesInstallationPlanBlocker {
  blockerId: string;
  message: string;
}

export interface FactoryHermesInstallationPlanWarning {
  warningId: string;
  message: string;
}

export interface FactoryHermesInstallationPlan {
  planId: string;
  planKind: FactoryHermesInstallationPlanKind;
  planVersion: FactoryHermesInstallationPlanVersion;
  toolId: 'hermes_agent';
  createdAt: string;
  createdBy: string;
  auditedHead: string;
  remoteHead: string;
  headsMatch: boolean;
  versionPolicyDecision: FactoryHermesVersionPolicyDecision;
  sourcePathRef: string;
  isolatedInstallRootSuggestion: string;
  manifestsFound: string[];
  installSurfaces: FactoryHermesInstallSurface[];
  runtimeSurfaces: FactoryHermesRuntimeSurface[];
  installSteps: FactoryHermesInstallStep[];
  validationSteps: FactoryHermesValidationStep[];
  risks: FactoryHermesRisk[];
  runtimeBoundaryRequired: true;
  adapterRequired: true;
  resultIngestionRequired: true;
  jefeReviewRequired: true;
  installAllowedNow: false;
  executionAllowedNow: false;
  credentialsAllowedNow: false;
  scriptsExecuted: false;
  dependenciesInstalled: false;
  projectPackageMutated: false;
  recommendedNextStep: string;
}

export interface FactoryHermesInstallationPlanResult {
  resultId: string;
  resultKind: FactoryHermesInstallationPlanKind;
  resultVersion: FactoryHermesInstallationPlanVersion;
  createdAt: string;
  createdBy: string;
  decision: FactoryHermesInstallationPlanDecision;
  status: FactoryHermesInstallationPlanStatus;
  sourceAuditSnapshot?: FactoryHermesSourceAuditSnapshot;
  installationPlan?: FactoryHermesInstallationPlan;
  checks: FactoryHermesInstallationPlanCheck[];
  blockers: FactoryHermesInstallationPlanBlocker[];
  warnings: FactoryHermesInstallationPlanWarning[];
  installAllowedNow: false;
  executionAllowedNow: false;
  credentialsAllowedNow: false;
  scriptsExecuted: false;
  dependenciesInstalled: false;
  projectPackageMutated: false;
  canExecuteCodex: false;
  recommendedNextStep: string;
}

export interface FactoryHermesInstallationPlanValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface FactoryHermesInstallationPlanSummary {
  planId?: string;
  auditedHead?: string;
  remoteHead?: string;
  headsMatch?: boolean;
  versionPolicyDecision?: FactoryHermesVersionPolicyDecision;
  installAllowedNow: false;
  executionAllowedNow: false;
  dependenciesInstalled: false;
  scriptsExecuted: false;
  status: FactoryHermesInstallationPlanStatus;
  decision: FactoryHermesInstallationPlanDecision;
  warningsCount: number;
  blockersCount: number;
  nextStep: string;
}
