import type { FactoryHermesInstallationPlanResult } from '../hermes-installation-plan/index.ts';
import type { FactoryHermesRuntimeBoundaryResult } from '../hermes-runtime-boundary/index.ts';

export type FactoryHermesInstallApprovalVersion = '1.0';
export type FactoryHermesInstallApprovalKind = 'factory_hermes_install_approval';
export type FactoryHermesInstallApprovalStatus =
  | 'blocked'
  | 'rejected'
  | 'changes_required'
  | 'human_review_required'
  | 'install_envelope_candidate_approved';
export type FactoryHermesInstallApprovalDecision =
  | 'blocked'
  | 'reject_install_request'
  | 'request_install_plan_changes'
  | 'human_review_required'
  | 'approve_install_envelope_for_runtime_candidate';

export interface FactoryHermesInstallApprovalPolicy {
  requireInstallationPlan: boolean;
  requireRuntimeBoundary: boolean;
  requireHumanApproval: boolean;
  requireReviewerIdentity: boolean;
  requireAuditedHeadMatch: boolean;
  allowRemoteHeadMismatchOnlyWithWarning: boolean;
  approveAuditedHeadOnly: boolean;
  requireInstallRootUnderCodexTemp: boolean;
  requireRuntimeBoundaryBeforeInstallRuntime: boolean;
  forbidInstallInThisGate: boolean;
  forbidExecutionInThisGate: boolean;
  forbidScriptsInThisGate: boolean;
  forbidCredentialsInThisGate: boolean;
  forbidModelCallsInThisGate: boolean;
  forbidProjectMutation: boolean;
  forbidPackageFileMutation: boolean;
  forbidGlobalInstall: boolean;
  forbidDeploy: boolean;
  requireInstallRuntimeAdapterFuture: boolean;
  requireInstallVerificationFuture: boolean;
  requireJefeReviewFuture: boolean;
}

export interface FactoryHermesInstallApprovalInput {
  hermesInstallationPlanResult?: FactoryHermesInstallationPlanResult;
  hermesRuntimeBoundaryResult?: FactoryHermesRuntimeBoundaryResult;
  reviewedAt: string;
  reviewedBy: string;
  reviewerRole?: string;
  humanApprovalRef?: string;
  policy?: Partial<FactoryHermesInstallApprovalPolicy>;
  reviewNotes?: string[];
}

export interface FactoryHermesInstallApprovalReviewer {
  reviewedBy: string;
  reviewerRole?: string;
  reviewedAt: string;
  humanApprovalRef?: string;
}

export interface FactoryHermesInstallApprovalReceipt {
  receiptId: string;
  approvalId: string;
  toolId: 'hermes_agent';
  auditedHead: string;
  remoteHead: string;
  headsMatch: boolean;
  reviewedBy: string;
  reviewedAt: string;
  humanApprovalRef: string;
  decision: FactoryHermesInstallApprovalDecision;
  scope: 'hermes_install_runtime_candidate';
  installVersionScope: 'audited_head_only';
  limitations: string[];
  notAuthorizedActions: string[];
}

export interface FactoryHermesApprovedInstallEnvelope {
  envelopeId: string;
  approvalId: string;
  toolId: 'hermes_agent';
  auditedHead: string;
  remoteHead: string;
  installVersionScope: 'audited_head_only';
  installationPlanRef: string;
  runtimeBoundaryRef: string;
  installRootRef: string;
  runtimeRootRef: string;
  outputRootRef: string;
  logsRootRef: string;
  boundaryContractSummary: {
    boundaryId: string;
    networkAllowedByDefault: false;
    credentialsAllowedNow: false;
    executionAllowedNow: false;
  };
  installPlanSummary: {
    planId: string;
    versionPolicyDecision: string;
    installAllowedNow: false;
    executionAllowedNow: false;
  };
  validation: {
    ok: boolean;
    warnings: string[];
    blockers: string[];
  };
  installStatus: 'not_installed';
  executionStatus: 'not_allowed';
  scriptsStatus: 'not_allowed';
  credentialsStatus: 'not_allowed';
  modelCallStatus: 'not_allowed';
  projectMutationStatus: 'not_allowed';
  deployStatus: 'not_allowed';
  recommendedNextStep: string;
}

export interface FactoryHermesInstallApprovalCheck {
  checkId: string;
  ok: boolean;
  message: string;
}

export interface FactoryHermesInstallApprovalBlocker {
  blockerId: string;
  message: string;
}

export interface FactoryHermesInstallApprovalWarning {
  warningId: string;
  message: string;
}

export interface FactoryHermesInstallApprovalResult {
  approvalId: string;
  approvalKind: FactoryHermesInstallApprovalKind;
  approvalVersion: FactoryHermesInstallApprovalVersion;
  reviewedAt: string;
  reviewedBy: string;
  toolId: 'hermes_agent';
  auditedHead?: string;
  remoteHead?: string;
  headsMatch?: boolean;
  sourceInstallationPlanId?: string;
  sourceRuntimeBoundaryId?: string;
  decision: FactoryHermesInstallApprovalDecision;
  status: FactoryHermesInstallApprovalStatus;
  checks: FactoryHermesInstallApprovalCheck[];
  blockers: FactoryHermesInstallApprovalBlocker[];
  warnings: FactoryHermesInstallApprovalWarning[];
  approvalReceipt?: FactoryHermesInstallApprovalReceipt;
  approvedInstallEnvelope?: FactoryHermesApprovedInstallEnvelope;
  canInstallHermesNow: false;
  canExecuteHermes: false;
  canRunHermesScripts: false;
  canUseCredentials: false;
  canCallModels: false;
  canMutateProjectFiles: false;
  canDeploy: false;
  recommendedNextStep: string;
}

export interface FactoryHermesInstallApprovalValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface FactoryHermesInstallApprovalSummary {
  approvalId: string;
  auditedHead?: string;
  remoteHead?: string;
  headsMatch?: boolean;
  decision: FactoryHermesInstallApprovalDecision;
  status: FactoryHermesInstallApprovalStatus;
  receiptPresent: boolean;
  envelopePresent: boolean;
  installStatus?: string;
  executionStatus?: string;
  credentialsStatus?: string;
  canInstallHermesNow: false;
  canExecuteHermes: false;
  nextStep: string;
}
