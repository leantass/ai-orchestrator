export type FactoryHermesFilesystemMutationPolicyPlanningVersion = '1.0'
export type FactoryHermesFilesystemMutationPolicyPlanningKind = 'factory-hermes-filesystem-mutation-policy-planning'
export type FactoryHermesFilesystemMutationPolicyPlanningStatus = 'filesystem_mutation_policy_plan_created' | 'blocked'
export type FactoryHermesFilesystemMutationPolicyPlanningDecision =
  | 'hermes_filesystem_mutation_policy_plan_created'
  | 'blocked_missing_timeout_kill_switch_policy_planning'
  | 'blocked_timeout_kill_switch_policy_not_ready_for_filesystem_mutation_policy'
  | 'blocked_result_ingestion_contract_not_ready_for_filesystem_mutation_policy'

export interface FactoryHermesFilesystemMutationPolicyPlanningInput {
  plannedAt: string
  plannedBy: string
  humanApprovalRef?: string
  timeoutKillSwitchPolicyPlanningResult?: any
  resultIngestionContractPlanningResult?: any
  policy?: Partial<FactoryHermesFilesystemMutationPolicyPlanningPolicy>
  planningNotes?: string
}

export interface FactoryHermesFilesystemMutationPolicyPlanningPolicy {
  requireTimeoutKillSwitchPolicyPlanning: boolean
  requireResultIngestionContractPlanning: boolean
  requireFilesystemSurfaceCandidates: boolean
  requireReadPathRules: boolean
  requireWritePathRules: boolean
  requireApprovedRunRootCandidate: boolean
  requireCodexTempOnlyFutureWrites: boolean
  requireNoProjectSourceWrites: boolean
  requireNoPackageFileWrites: boolean
  requireNoDotEnvReadWrite: boolean
  requireNoPythonEnvMutation: boolean
  requireNoSourceRootMutation: boolean
  requirePathContainment: boolean
  requireNoSymlinkTraversal: boolean
  requireNoPathTraversal: boolean
  requireArtifactHashing: boolean
  requireFsMutationReporting: boolean
  requireResearchExecutionBoundaryPlanningNext: boolean
  forbidFilesystemMutationInThisGate: boolean
  forbidRuntimeWriteConfigurationInThisGate: boolean
  forbidExecutionInThisGate: boolean
  forbidPromptExecutionInThisGate: boolean
  forbidHermesExecutionInThisGate: boolean
  forbidResearchExecutionInThisGate: boolean
  forbidNetworkInThisGate: boolean
  forbidModelCallsInThisGate: boolean
  forbidCredentialUseInThisGate: boolean
  forbidToolsetEnablementInThisGate: boolean
  forbidDeployInThisGate: boolean
}

export interface FactoryHermesFilesystemSurfaceCandidate {
  surfaceId: string
  candidateRoot?: string
  path?: string
  status: string
  canUseNow?: false
  writesAllowed?: false
  purpose?: string
  mustBeUnderApprovedRunRoot?: true
  metadataOnly?: true
  sanitizedOnly?: true
  previewLimited?: true
}

export interface FactoryHermesFilesystemMutationRule { ruleId: string; requirements: string[] }
export interface FactoryHermesFilesystemWritePathRule extends FactoryHermesFilesystemMutationRule {}
export interface FactoryHermesFilesystemReadPathRule extends FactoryHermesFilesystemMutationRule {}
export interface FactoryHermesFilesystemArtifactShape { shapeId: string; fields: string[]; noSecrets: true; metadataOnly?: true; usableAsFindings?: false; findingUseAllowed?: false; requiresJefeReview?: true }

export interface FactoryHermesFilesystemMutationPolicyPlanCandidate {
  planCandidateId: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: { executable: 'hermes.exe'; argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>']; shell: false }
  filesystemSurfaceCandidates: FactoryHermesFilesystemSurfaceCandidate[]
  readPathRules: FactoryHermesFilesystemReadPathRule[]
  writePathRules: FactoryHermesFilesystemWritePathRule[]
  artifactShapes: FactoryHermesFilesystemArtifactShape[]
  filesystemMutationAllowedNow: false
  projectFileWritesAllowedNow: false
  futureWritesRequireApprovedRunRoot: true
  futureWritesRestrictedToCodexTemp: true
  sourceRootMutationForbidden: true
  pythonEnvMutationForbidden: true
  uvCacheMutationForbidden: true
  packageFileMutationForbidden: true
  dotEnvReadWriteForbidden: true
  arbitraryPathAccessForbidden: true
  pathContainmentRequired: true
  symlinkTraversalForbidden: true
  fsMutationReportingRequired: true
  requiredNextPolicies: string[]
  canProceedToResearchExecutionBoundaryPlanning: true
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
}

export interface FactoryHermesFilesystemMutationPolicyPlanningReceipt {
  receiptId: string
  planningId: string
  toolId: 'hermes_agent'
  plannedBy: string
  plannedAt: string
  decision: FactoryHermesFilesystemMutationPolicyPlanningDecision
  scope: 'hermes_filesystem_mutation_policy_planning_only'
  approvedNextGate: 'Factory Hermes Research Execution Boundary Planning Gate v1'
  limitations: string[]
  notAuthorizedActions: string[]
}

export interface FactoryHermesFilesystemMutationPolicyPlanningCheck { checkId: string; message: string }
export interface FactoryHermesFilesystemMutationPolicyPlanningBlocker { blockerId: string; message: string }
export interface FactoryHermesFilesystemMutationPolicyPlanningWarning { warningId: string; message: string }

export interface FactoryHermesFilesystemMutationPolicyPlanningResult {
  planningId: string
  planningKind: FactoryHermesFilesystemMutationPolicyPlanningKind
  planningVersion: FactoryHermesFilesystemMutationPolicyPlanningVersion
  plannedAt: string
  plannedBy: string
  toolId: 'hermes_agent'
  commandShapeUnderConsideration: 'oneshot_real_with_provider_model'
  futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>'
  filesystemSurfaceCandidates: FactoryHermesFilesystemSurfaceCandidate[]
  readPathRules: FactoryHermesFilesystemReadPathRule[]
  writePathRules: FactoryHermesFilesystemWritePathRule[]
  artifactShapes: FactoryHermesFilesystemArtifactShape[]
  filesystemMutationPolicyPlanningReceipt?: FactoryHermesFilesystemMutationPolicyPlanningReceipt
  hermesFilesystemMutationPolicyPlanCandidate?: FactoryHermesFilesystemMutationPolicyPlanCandidate
  checks: FactoryHermesFilesystemMutationPolicyPlanningCheck[]
  blockers: FactoryHermesFilesystemMutationPolicyPlanningBlocker[]
  warnings: FactoryHermesFilesystemMutationPolicyPlanningWarning[]
  status: FactoryHermesFilesystemMutationPolicyPlanningStatus
  decision: FactoryHermesFilesystemMutationPolicyPlanningDecision
  canProceedToResearchExecutionBoundaryPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
  canExecuteHermesNow: false
  canMutateFilesystemNow: false
  canWriteProjectFilesNow: false
  canUseNetworkNow: false
  canUseCredentialsNow: false
  canReadEnvSecretsNow: false
  canCallModelsNow: false
  canEnableToolsetsNow: false
  canUseFindings: false
  recommendedNextStep: string
}

export interface FactoryHermesFilesystemMutationPolicyPlanningValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesFilesystemMutationPolicyPlanningSummary {
  planningId: string
  status: FactoryHermesFilesystemMutationPolicyPlanningStatus
  decision: FactoryHermesFilesystemMutationPolicyPlanningDecision
  filesystemSurfaceCandidateCount: number
  futureWritesRestrictedToCodexTemp: true
  filesystemMutationAllowedNow: false
  canProceedToResearchExecutionBoundaryPlanning: boolean
  canProceedToResearchExecutionApproval: false
  canRunResearchNow: false
  nextStep: string
}
