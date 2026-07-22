import type { FactoryHermesInstallationPlanResult } from '../hermes-installation-plan/index.ts';

export type FactoryHermesRuntimeBoundaryVersion = '1.0';
export type FactoryHermesRuntimeBoundaryKind = 'factory_hermes_runtime_boundary';
export type FactoryHermesRuntimeBoundaryStatus =
  | 'blocked'
  | 'rejected'
  | 'changes_required'
  | 'human_review_required'
  | 'runtime_boundary_contract_ready';
export type FactoryHermesRuntimeBoundaryDecision =
  | 'blocked'
  | 'reject_runtime_boundary'
  | 'request_runtime_boundary_changes'
  | 'human_review_required'
  | 'approve_runtime_boundary_contract';

export interface FactoryHermesRuntimeBoundaryInput {
  hermesInstallationPlanResult?: FactoryHermesInstallationPlanResult;
  createdAt: string;
  createdBy: string;
  policy?: Partial<FactoryHermesRuntimeBoundaryPolicy>;
  humanReviewRef?: string;
  boundaryNotes?: string[];
}

export interface FactoryHermesRuntimeBoundaryPolicy {
  requireInstallationPlan: boolean;
  requireAuditedHead: boolean;
  requireIsolatedInstallRoot: boolean;
  requireIsolatedRuntimeRoot: boolean;
  requireInputOutputRoots: boolean;
  requireFilesystemPolicy: boolean;
  requireNetworkPolicy: boolean;
  requireEnvironmentPolicy: boolean;
  requireCredentialPolicy: boolean;
  requireExecutionPolicy: boolean;
  requireLoggingPolicy: boolean;
  requireKillSwitches: boolean;
  requireAdapterRequirements: boolean;
  requireResultContract: boolean;
  requireHumanReview: boolean;
  forbidInstallInThisGate: boolean;
  forbidExecutionInThisGate: boolean;
  forbidCredentialsInThisGate: boolean;
  forbidModelCallsInThisGate: boolean;
  forbidExternalNetworkByDefault: boolean;
  forbidProjectMutation: boolean;
  forbidDeploy: boolean;
  requireJefeReviewAfterToolResult: boolean;
  requireResultIngestion: boolean;
  requireNoVendorIntoRepo: boolean;
}

export interface FactoryHermesRuntimeBoundaryFilesystemPolicy {
  installRootRef: string;
  runtimeRootRef: string;
  inputRootRefs: string[];
  outputRootRef: string;
  logsRootRef: string;
  allowedFutureRoots: string[];
  forbiddenRoots: string[];
  repoMutationAllowedNow: false;
  packageMutationAllowedNow: false;
}

export interface FactoryHermesRuntimeBoundaryNetworkPolicy {
  networkAllowedByDefault: false;
  futureAllowlistRequired: true;
  arbitraryBrowsingAllowed: false;
  credentialedExternalCallsAllowedNow: false;
}

export interface FactoryHermesRuntimeBoundaryEnvironmentPolicy {
  allowedEnvNames: string[];
  forbiddenEnvPatterns: string[];
  envInjectionAllowedNow: false;
}

export interface FactoryHermesRuntimeBoundaryCredentialPolicy {
  credentialsAllowedNow: false;
  credentialStoreAllowedNow: false;
  envFileReadsAllowedNow: false;
  futureCredentialApprovalRequired: true;
}

export interface FactoryHermesRuntimeBoundaryExecutionPolicy {
  executionAllowedNow: false;
  installAllowedNow: false;
  scriptsAllowedNow: false;
  commandExecutionAllowedNow: false;
  maxRuntimeSecondsFuture: number;
  maxOutputBytesFuture: number;
  killSwitchRequired: true;
}

export interface FactoryHermesRuntimeBoundaryLoggingPolicy {
  logsRootRef: string;
  redactSecrets: true;
  rawCredentialsAllowed: false;
  structuredResultRequired: true;
}

export interface FactoryHermesRuntimeBoundaryKillSwitch {
  switchId: string;
  enabled: false;
  description: string;
}

export interface FactoryHermesRuntimeBoundaryAllowedOperation {
  operationId: string;
  description: string;
  futureOnly: true;
}

export interface FactoryHermesRuntimeBoundaryForbiddenOperation {
  operationId: string;
  description: string;
}

export interface FactoryHermesRuntimeBoundaryAdapterRequirement {
  requirementId: string;
  description: string;
  required: true;
}

export interface FactoryHermesRuntimeBoundaryResultContract {
  resultKind: 'hermes_research_result';
  requiredFields: string[];
  citationsRequired: true;
  rawSecretsAllowed: false;
  directProjectMutationAllowed: false;
  recommendedNextStepRequired: true;
}

export interface FactoryHermesRuntimeBoundaryContract {
  boundaryId: string;
  boundaryKind: FactoryHermesRuntimeBoundaryKind;
  boundaryVersion: FactoryHermesRuntimeBoundaryVersion;
  toolId: 'hermes_agent';
  auditedHead: string;
  remoteHead: string;
  headsMatch: boolean;
  versionPolicyDecision: string;
  sourcePathRef: string;
  installRootRef: string;
  runtimeRootRef: string;
  inputRootRefs: string[];
  outputRootRef: string;
  filesystemPolicy: FactoryHermesRuntimeBoundaryFilesystemPolicy;
  networkPolicy: FactoryHermesRuntimeBoundaryNetworkPolicy;
  environmentPolicy: FactoryHermesRuntimeBoundaryEnvironmentPolicy;
  credentialPolicy: FactoryHermesRuntimeBoundaryCredentialPolicy;
  executionPolicy: FactoryHermesRuntimeBoundaryExecutionPolicy;
  loggingPolicy: FactoryHermesRuntimeBoundaryLoggingPolicy;
  killSwitches: FactoryHermesRuntimeBoundaryKillSwitch[];
  allowedOperations: FactoryHermesRuntimeBoundaryAllowedOperation[];
  forbiddenOperations: FactoryHermesRuntimeBoundaryForbiddenOperation[];
  adapterRequirements: FactoryHermesRuntimeBoundaryAdapterRequirement[];
  resultContract: FactoryHermesRuntimeBoundaryResultContract;
  status: 'boundary_contract_not_executable';
  installStatus: 'not_installed';
  executionStatus: 'not_allowed';
  credentialsStatus: 'not_allowed';
  networkStatus: 'not_allowed_by_default';
  modelCallStatus: 'not_allowed';
  projectMutationStatus: 'not_allowed';
  deployStatus: 'not_allowed';
  canInstallHermes: false;
  canExecuteHermes: false;
  canUseCredentials: false;
  canCallModels: false;
  canAccessExternalNetwork: false;
  canMutateProjectFiles: false;
  canDeploy: false;
  recommendedNextStep: string;
}

export interface FactoryHermesRuntimeBoundaryCheck {
  checkId: string;
  ok: boolean;
  message: string;
}

export interface FactoryHermesRuntimeBoundaryBlocker {
  blockerId: string;
  message: string;
}

export interface FactoryHermesRuntimeBoundaryWarning {
  warningId: string;
  message: string;
}

export interface FactoryHermesRuntimeBoundaryResult {
  resultId: string;
  resultKind: FactoryHermesRuntimeBoundaryKind;
  resultVersion: FactoryHermesRuntimeBoundaryVersion;
  createdAt: string;
  createdBy: string;
  decision: FactoryHermesRuntimeBoundaryDecision;
  status: FactoryHermesRuntimeBoundaryStatus;
  boundaryContract?: FactoryHermesRuntimeBoundaryContract;
  checks: FactoryHermesRuntimeBoundaryCheck[];
  blockers: FactoryHermesRuntimeBoundaryBlocker[];
  warnings: FactoryHermesRuntimeBoundaryWarning[];
  canInstallHermes: false;
  canExecuteHermes: false;
  canUseCredentials: false;
  canCallModels: false;
  canAccessExternalNetwork: false;
  canMutateProjectFiles: false;
  canDeploy: false;
  recommendedNextStep: string;
}

export interface FactoryHermesRuntimeBoundaryValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface FactoryHermesRuntimeBoundarySummary {
  boundaryId?: string;
  auditedHead?: string;
  remoteHead?: string;
  headsMatch?: boolean;
  decision: FactoryHermesRuntimeBoundaryDecision;
  status: FactoryHermesRuntimeBoundaryStatus;
  installAllowedNow: false;
  executionAllowedNow: false;
  credentialsAllowedNow: false;
  networkAllowedByDefault: false;
  canExecuteHermes: false;
  nextStep: string;
}
