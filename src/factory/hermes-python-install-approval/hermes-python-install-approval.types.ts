import type { FactoryHermesPythonInstallStrategyResult } from '../hermes-python-install-strategy/index.ts';

export type FactoryHermesPythonInstallApprovalVersion = '1.0';
export type FactoryHermesPythonInstallApprovalKind = 'factory_hermes_python_install_approval';
export type FactoryHermesPythonInstallApprovalStatus =
  | 'blocked'
  | 'rejected'
  | 'changes_required'
  | 'human_review_required'
  | 'python_install_envelope_candidate_approved';
export type FactoryHermesPythonInstallApprovalDecision =
  | 'blocked'
  | 'reject_python_install_request'
  | 'request_python_strategy_changes'
  | 'human_review_required'
  | 'approve_python_install_envelope_for_runtime_candidate';
export type FactoryHermesPythonInstallMethodScope =
  | 'uv_lock_isolated_only'
  | 'venv_pip_isolated_only';

export interface FactoryHermesPythonInstallApprovalPolicy {
  requirePythonInstallStrategy: boolean;
  requireHumanApproval: boolean;
  requireReviewerIdentity: boolean;
  requireAuditedHead: boolean;
  requireSourceRoot: boolean;
  requireInstallRoot: boolean;
  requirePythonEnvRootUnderCodexTemp: boolean;
  allowUvLockRuntimeCandidate: boolean;
  allowVenvPipRuntimeCandidate: boolean;
  forbidPythonInstallInThisGate: boolean;
  forbidUvExecutionInThisGate: boolean;
  forbidPipExecutionInThisGate: boolean;
  forbidVenvCreationInThisGate: boolean;
  forbidSetupPyExecution: boolean;
  forbidGlobalPipInstall: boolean;
  forbidHermesExecutionInThisGate: boolean;
  forbidHermesScriptsInThisGate: boolean;
  forbidCredentialsInThisGate: boolean;
  forbidModelCallsInThisGate: boolean;
  forbidProjectMutation: boolean;
  forbidPackageFileMutation: boolean;
  forbidDeploy: boolean;
  requirePythonInstallRuntimeAdapterFuture: boolean;
  requirePythonInstallVerificationFuture: boolean;
  requireJefeReviewFuture: boolean;
}

export interface FactoryHermesPythonInstallApprovalInput {
  hermesPythonInstallStrategyResult?: FactoryHermesPythonInstallStrategyResult;
  reviewedAt: string;
  reviewedBy: string;
  reviewerRole?: string;
  humanApprovalRef?: string;
  policy?: Partial<FactoryHermesPythonInstallApprovalPolicy>;
  reviewNotes?: string[];
}

export interface FactoryHermesPythonInstallApprovalReviewer {
  reviewedBy: string;
  reviewerRole?: string;
  reviewedAt: string;
  humanApprovalRef?: string;
}

export interface FactoryHermesPythonInstallApprovalReceipt {
  receiptId: string;
  approvalId: string;
  toolId: 'hermes_agent';
  auditedHead: string;
  reviewedBy: string;
  reviewedAt: string;
  humanApprovalRef: string;
  decision: FactoryHermesPythonInstallApprovalDecision;
  scope: 'hermes_python_install_runtime_candidate';
  pythonInstallMethodScope: FactoryHermesPythonInstallMethodScope;
  limitations: string[];
  notAuthorizedActions: string[];
}

export interface FactoryHermesApprovedPythonInstallEnvelope {
  envelopeId: string;
  approvalId: string;
  toolId: 'hermes_agent';
  auditedHead: string;
  sourceRootRef: string;
  installRootRef: string;
  pythonEnvRootRef: string;
  managerDecision: string;
  pythonInstallMethodScope: FactoryHermesPythonInstallMethodScope;
  strategyPlanRef: string;
  strategySummary: {
    status: string;
    installAllowedNow: false;
    pythonInstallRuntimeAllowedNow: false;
    executionAllowedNow: false;
  };
  validation: {
    ok: boolean;
    warnings: string[];
    blockers: string[];
  };
  pythonInstallStatus: 'not_installed';
  venvStatus: 'not_created';
  uvStatus: 'not_executed';
  pipStatus: 'not_executed';
  setupPyStatus: 'not_executed';
  hermesExecutionStatus: 'not_allowed';
  scriptsStatus: 'not_allowed';
  credentialsStatus: 'not_allowed';
  modelCallStatus: 'not_allowed';
  projectMutationStatus: 'not_allowed';
  deployStatus: 'not_allowed';
  recommendedNextStep: string;
}

export interface FactoryHermesPythonInstallApprovalCheck {
  checkId: string;
  ok: boolean;
  message: string;
}

export interface FactoryHermesPythonInstallApprovalBlocker {
  blockerId: string;
  message: string;
}

export interface FactoryHermesPythonInstallApprovalWarning {
  warningId: string;
  message: string;
}

export interface FactoryHermesPythonInstallApprovalResult {
  approvalId: string;
  approvalKind: FactoryHermesPythonInstallApprovalKind;
  approvalVersion: FactoryHermesPythonInstallApprovalVersion;
  reviewedAt: string;
  reviewedBy: string;
  toolId: 'hermes_agent';
  auditedHead?: string;
  sourceRootRef?: string;
  installRootRef?: string;
  pythonEnvRootRef?: string;
  managerDecision?: string;
  decision: FactoryHermesPythonInstallApprovalDecision;
  status: FactoryHermesPythonInstallApprovalStatus;
  checks: FactoryHermesPythonInstallApprovalCheck[];
  blockers: FactoryHermesPythonInstallApprovalBlocker[];
  warnings: FactoryHermesPythonInstallApprovalWarning[];
  approvalReceipt?: FactoryHermesPythonInstallApprovalReceipt;
  approvedPythonInstallEnvelope?: FactoryHermesApprovedPythonInstallEnvelope;
  canInstallPythonNow: false;
  canExecuteHermes: false;
  canRunHermesScripts: false;
  canUseCredentials: false;
  canCallModels: false;
  canMutateProjectFiles: false;
  canDeploy: false;
  recommendedNextStep: string;
}

export interface FactoryHermesPythonInstallApprovalValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface FactoryHermesPythonInstallApprovalSummary {
  approvalId: string;
  auditedHead?: string;
  managerDecision?: string;
  pythonInstallMethodScope?: FactoryHermesPythonInstallMethodScope;
  decision: FactoryHermesPythonInstallApprovalDecision;
  status: FactoryHermesPythonInstallApprovalStatus;
  receiptPresent: boolean;
  envelopePresent: boolean;
  pythonInstallStatus?: string;
  venvStatus?: string;
  uvStatus?: string;
  pipStatus?: string;
  setupPyStatus?: string;
  canInstallPythonNow: false;
  canExecuteHermes: false;
  nextStep: string;
}
