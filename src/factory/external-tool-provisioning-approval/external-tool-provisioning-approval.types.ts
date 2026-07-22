import type { FactoryExternalToolProvisioningPlanCandidate, FactoryExternalToolProvisioningResult } from '../external-tool-provisioning/index.ts'

export type FactoryExternalToolProvisioningApprovalVersion = '1.0'
export type FactoryExternalToolProvisioningApprovalKind = 'factory-external-tool-provisioning-approval'
export type FactoryExternalToolProvisioningApprovalStatus = 'blocked' | 'human_review_required' | 'tool_provisioning_envelope_candidate_approved'
export type FactoryExternalToolProvisioningApprovalDecision = 'blocked_missing_provisioning_result' | 'blocked_invalid_provisioning_candidate' | 'blocked_insecure_provisioning_candidate' | 'human_review_required' | 'approve_tool_provisioning_envelope_for_runtime_candidate'

export interface FactoryExternalToolProvisioningApprovalPolicy {
  requireProvisioningResult: boolean
  requireProvisioningPlanCandidate: boolean
  requireHumanApproval: boolean
  requireReviewerIdentity: boolean
  requireToolId: boolean
  requireToolName: boolean
  requireTargetPlatform: boolean
  requireOfficialSourcePolicy: boolean
  requireChecksumPolicy: boolean
  requireRuntimeAdapterFuture: boolean
  requireVerificationGateFuture: boolean
  requireJefeReviewFuture: boolean
  forbidInstallInThisGate: boolean
  forbidExecutionInThisGate: boolean
  forbidDownloadInThisGate: boolean
  forbidShell: boolean
  forbidCmd: boolean
  forbidPowerShell: boolean
  forbidCurl: boolean
  forbidWget: boolean
  forbidPipFallback: boolean
  forbidGlobalInstall: boolean
  forbidProjectMutation: boolean
  forbidPackageFileMutation: boolean
  forbidCredentials: boolean
  forbidModelCalls: boolean
  forbidDeploy: boolean
}

export interface FactoryExternalToolProvisioningApprovalInput {
  externalToolProvisioningResult?: FactoryExternalToolProvisioningResult
  reviewedAt: string
  reviewedBy: string
  reviewerRole?: string
  humanApprovalRef?: string
  policy?: Partial<FactoryExternalToolProvisioningApprovalPolicy>
  reviewNotes?: string[]
}

export interface FactoryExternalToolProvisioningApprovalReceipt {
  receiptId: string
  approvalId: string
  toolId: string
  toolName: string
  targetPlatform: string
  reviewedBy: string
  reviewedAt: string
  humanApprovalRef: string
  decision: FactoryExternalToolProvisioningApprovalDecision
  scope: 'external_tool_provisioning_runtime_candidate'
  approvedProvisioningMethods: string[]
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryApprovedToolProvisioningEnvelope {
  envelopeId: string
  approvalId: string
  toolId: string
  toolName: string
  targetPlatform: string
  provisioningPlanCandidate: FactoryExternalToolProvisioningPlanCandidate
  approvedProvisioningMethods: string[]
  preferredProvisioningMethod: string
  fallbackProvisioningMethod: string
  installRootRef: string
  executableRef: string
  versionRequirement: string
  sourcePolicy: FactoryExternalToolProvisioningPlanCandidate['sourcePolicy']
  checksumPolicy: FactoryExternalToolProvisioningPlanCandidate['checksumPolicy']
  allowedCommands: string[]
  forbiddenCommands: string[]
  requiredFutureRuntimeAdapter: string
  requiredFutureVerificationGate: string
  requiredFutureJefeReview: string
  installStatus: 'not_installed'
  executionStatus: 'not_executed'
  downloadStatus: 'not_downloaded'
  shellStatus: 'not_allowed'
  credentialsStatus: 'not_allowed'
  modelCallStatus: 'not_allowed'
  projectMutationStatus: 'not_allowed'
  deployStatus: 'not_allowed'
  recommendedNextStep: string
}

export interface FactoryExternalToolProvisioningApprovalCheck { checkId: string; ok: boolean; message: string }
export interface FactoryExternalToolProvisioningApprovalBlocker { blockerId: string; message: string }
export interface FactoryExternalToolProvisioningApprovalWarning { warningId: string; message: string }

export interface FactoryExternalToolProvisioningApprovalResult {
  approvalId: string
  approvalKind: FactoryExternalToolProvisioningApprovalKind
  approvalVersion: FactoryExternalToolProvisioningApprovalVersion
  reviewedAt: string
  reviewedBy: string
  toolId: string
  toolName: string
  targetPlatform: string
  provisioningPlanCandidate?: FactoryExternalToolProvisioningPlanCandidate
  decision: FactoryExternalToolProvisioningApprovalDecision
  status: FactoryExternalToolProvisioningApprovalStatus
  checks: FactoryExternalToolProvisioningApprovalCheck[]
  blockers: FactoryExternalToolProvisioningApprovalBlocker[]
  warnings: FactoryExternalToolProvisioningApprovalWarning[]
  approvalReceipt?: FactoryExternalToolProvisioningApprovalReceipt
  approvedToolProvisioningEnvelope?: FactoryApprovedToolProvisioningEnvelope
  canInstallNow: false
  canExecuteToolNow: false
  canUseShell: false
  canUseCredentials: false
  canMutateProjectFiles: false
  canDeploy: false
  recommendedNextStep: string
}

export interface FactoryExternalToolProvisioningApprovalValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryExternalToolProvisioningApprovalSummary { approvalId: string; toolId: string; targetPlatform: string; approvedMethods: string[]; status: FactoryExternalToolProvisioningApprovalStatus; decision: FactoryExternalToolProvisioningApprovalDecision; installStatus?: string; downloadStatus?: string; executionStatus?: string; canInstallNow: false; canExecuteToolNow: false; nextStep: string }
