export type FactoryExternalToolProvisioningVersion = '1.0'
export type FactoryExternalToolProvisioningKind = 'factory-external-tool-provisioning'
export type FactoryExternalToolProvisioningStatus = 'blocked' | 'human_review_required' | 'provisioning_plan_candidate_approved'
export type FactoryExternalToolProvisioningDecision = 'blocked_invalid_tool_profile' | 'blocked_unsupported_platform' | 'blocked_insecure_provisioning_method' | 'human_review_required' | 'approve_provisioning_plan_candidate'
export type FactoryExternalToolProvisioningMethod = 'system_path_existing_uv' | 'local_uv_binary_under_codex_temp' | 'blocked_no_uv_available'

export interface FactoryExternalToolProvisioningCheck { checkId: string; ok: boolean; message: string }
export interface FactoryExternalToolProvisioningBlocker { blockerId: string; message: string }
export interface FactoryExternalToolProvisioningWarning { warningId: string; message: string }
export interface FactoryExternalToolProvisioningApprovalRequirement { approvalId: string; required: boolean; received: boolean; approvalRef?: string; reason: string }
export interface FactoryExternalToolProvisioningSourcePolicy { requireOfficialSource: boolean; officialSources: string[]; futureVerificationRequired: boolean }
export interface FactoryExternalToolProvisioningChecksumPolicy { requireChecksumStrategy: boolean; strategy: string; futureVerificationRequired: boolean }

export interface FactoryExternalToolProvisioningMethodProfile {
  methodId: FactoryExternalToolProvisioningMethod
  description: string
  requiresShell: boolean
  requiresCredentials: boolean
  downloadsBinary: boolean
  officialSourceDeclared: boolean
  checksumStrategyDeclared: boolean
  installRootRef?: string
  executableRef?: string
  requiresFutureVerificationGate: boolean
}

export interface FactoryExternalToolProvisioningToolProfile {
  toolId: string
  toolName: string
  toolCategory: string
  purpose: string
  requiredFor: string[]
  versionRequirement: string
  officialSources: string[]
  allowedFutureCommands: string[]
  forbiddenCommands: string[]
  allowedInstallRoots: string[]
  provisioningMethods: FactoryExternalToolProvisioningMethodProfile[]
  preferredMethod: FactoryExternalToolProvisioningMethod
  fallbackMethod: FactoryExternalToolProvisioningMethod
  currentKnownStatus: { status: string; source: string; decision: string }
}

export interface FactoryExternalToolProvisioningPolicy {
  requireToolProfile: boolean
  requireOfficialSource: boolean
  requireVersionPinOrRange: boolean
  requireChecksumStrategy: boolean
  requireInstallRootUnderCodexTemp: boolean
  requireHumanApproval: boolean
  requireNoShell: boolean
  requireNoCredentials: boolean
  requireNoProjectPackageMutation: boolean
  forbidInstallInThisGate: boolean
  forbidExecutionInThisGate: boolean
  forbidShell: boolean
  forbidCmd: boolean
  forbidPowerShell: boolean
  forbidCurl: boolean
  forbidWget: boolean
  forbidPipFallback: boolean
  forbidGlobalInstall: boolean
  forbidProjectMutation: boolean
  forbidDeploy: boolean
  requireRuntimeAdapterFuture: boolean
  requireVerificationGateFuture: boolean
  requireJefeReviewFuture: boolean
}

export interface FactoryExternalToolProvisioningInput {
  toolProfile?: FactoryExternalToolProvisioningToolProfile
  requestedAt: string
  requestedBy: string
  targetPlatform?: string
  requestedReason?: string
  policy?: Partial<FactoryExternalToolProvisioningPolicy>
  environmentSnapshot?: Record<string, unknown>
  humanApprovalRef?: string
}

export interface FactoryExternalToolProvisioningPlanCandidate {
  planId: string
  toolId: string
  targetPlatform: string
  preferredProvisioningMethod: FactoryExternalToolProvisioningMethod
  fallbackProvisioningMethod: FactoryExternalToolProvisioningMethod
  installRootRef: string
  executableRef: string
  versionRequirement: string
  sourcePolicy: FactoryExternalToolProvisioningSourcePolicy
  checksumPolicy: FactoryExternalToolProvisioningChecksumPolicy
  allowedCommands: string[]
  forbiddenCommands: string[]
  requiredApprovals: FactoryExternalToolProvisioningApprovalRequirement[]
  requiredFutureRuntimeAdapter: string
  requiredFutureVerificationGate: string
  requiredFutureJefeReview: string
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryExternalToolProvisioningResult {
  provisioningId: string
  provisioningKind: FactoryExternalToolProvisioningKind
  provisioningVersion: FactoryExternalToolProvisioningVersion
  requestedAt: string
  requestedBy: string
  toolId: string
  toolName: string
  toolVersionRequirement: string
  targetPlatform: string
  provisioningPlanCandidate?: FactoryExternalToolProvisioningPlanCandidate
  status: FactoryExternalToolProvisioningStatus
  decision: FactoryExternalToolProvisioningDecision
  checks: FactoryExternalToolProvisioningCheck[]
  blockers: FactoryExternalToolProvisioningBlocker[]
  warnings: FactoryExternalToolProvisioningWarning[]
  canInstallNow: false
  canExecuteToolNow: false
  canUseShell: false
  canUseCredentials: false
  canMutateProjectFiles: false
  canDeploy: false
  recommendedNextStep: string
}

export interface FactoryExternalToolProvisioningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryExternalToolProvisioningSummary { provisioningId: string; toolId: string; targetPlatform: string; preferredProvisioningMethod?: FactoryExternalToolProvisioningMethod; status: FactoryExternalToolProvisioningStatus; decision: FactoryExternalToolProvisioningDecision; canInstallNow: false; canExecuteToolNow: false; nextStep: string }
