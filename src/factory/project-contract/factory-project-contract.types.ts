export type FactoryProjectContractVersion = '1.0'

export type FactoryProjectLifecycleStatus =
  | 'draft'
  | 'planned'
  | 'approved'
  | 'materializing'
  | 'validating'
  | 'ready'
  | 'released'
  | 'blocked'
  | 'archived'

export interface FactoryProjectIdentity {
  projectId: string
  slug: string
  name: string
  description: string
  projectType: string
  businessDomain?: string
  owner?: string
}

export interface FactoryProjectIndependence {
  runtimeDependsOnJefe: false
  mustUseOwnRepository: boolean
  mustHaveOwnRoot: boolean
  forbiddenRuntimeImports: string[]
  allowedTraceabilityLinks: string[]
}

export interface FactoryProjectLineage {
  opportunityId?: string
  briefId: string
  runId: string
  sourceChat?: string
  sourcePromptHash?: string
  outputId?: string
  parentContractId?: string
  generatedBy: 'JEFE'
  generatedAt?: string
}

export interface FactoryProjectPathPolicy {
  plannedOutputRoot: string
  projectRootPolicy: string
  forbiddenPaths: string[]
  evidenceRoot: string
  runArtifactsRoot: string
}

export interface FactoryProjectMemoryPolicy {
  memoryNamespace: string
  projectMemoryNamespace: string
  globalLearningPolicy: string
  promotionPolicy: string
  retentionPolicy: string
  staleDataPolicy: string
}

export interface FactoryProjectStack {
  language: string
  frontend: string
  backend: string
  runtime: string
  database: string
  orm?: string
  packageManager: string
  testFrameworks: string[]
  deploymentTarget: string
}

export interface FactoryProjectEnvironmentVariable {
  name: string
  required: boolean
  secret: boolean
  scope: 'build' | 'runtime' | 'test' | 'deployment' | 'shared'
  description: string
  exampleSafeValue?: string
  defaultAllowed: boolean
  productionRequired: boolean
}

export interface FactoryProjectQualityProfile {
  qualityProfile: string
  requiredChecks: string[]
  optionalChecks: string[]
  smokeRequired: boolean
  domainSmokeRequired: boolean
  unitTestsPlanned: boolean
  integrationTestsPlanned: boolean
  e2eTestsPlanned: boolean
  visualEvidenceRequired: boolean
  accessibilityRequired: boolean
  performanceRequired: boolean
}

export interface FactoryProjectSecurityPolicy {
  secretPolicy: string
  sandboxPolicy: string
  networkPolicy: string
  filesystemPolicy: string
  commandExecutionPolicy: string
  promptInjectionPolicy: string
  dependencyPolicy: string
  approvalRequiredForExternalCalls: boolean
  approvalRequiredForDeploy: boolean
}

export interface FactoryProjectApprovalStage {
  id: string
  description: string
  required: boolean
}

export interface FactoryProjectApprovalPolicy {
  requiredApprovals: string[]
  approvalStages: FactoryProjectApprovalStage[]
  humanApprovalRequired: boolean
  autoApprovalAllowed: boolean
  codexSelfApprovalAllowed: false
}

export interface FactoryProjectRepositoryPolicy {
  repositoryRequired: boolean
  provider: string
  visibility: 'private' | 'internal' | 'public' | 'planned'
  owner: string
  repoName: string
  defaultBranch: string
  protectedBranches: string[]
  commitPolicy: string
  pushPolicy: string
}

export interface FactoryProjectCiPolicy {
  ciRequired: boolean
  provider: string
  requiredWorkflows: string[]
  requiredStatusChecks: string[]
  stagingRequired: boolean
  productionDeployAllowed: boolean
  rollbackRequired: boolean
}

export interface FactoryProjectPublicationEnvironment {
  enabled: boolean
  url?: string
  approvalRequired: boolean
}

export interface FactoryProjectPublicationPolicy {
  staging: FactoryProjectPublicationEnvironment
  production: FactoryProjectPublicationEnvironment
  domains: string[]
  deploymentStrategy: string
  rollbackStrategy: string
  releaseApproval: string
}

export interface FactoryProjectAnalyticsPolicy {
  analyticsPlanned: boolean
  analyticsProvider: string
  monetizationPlanned: boolean
  monetizationModel: string
  revenueEvents: string[]
  killCriteria: string[]
  scaleCriteria: string[]
}

export interface FactoryProjectEvidencePolicy {
  requiredArtifacts: string[]
  reportsRequired: string[]
  screenshotsRequired: boolean
  logsRequired: boolean
  validationSummaryRequired: boolean
  deliveryLedgerRequired: boolean
  traceabilityRequired: boolean
}

export interface FactoryProjectLifecycle {
  lifecycleStatus: FactoryProjectLifecycleStatus
  readiness: string
  warnings: string[]
  risks: string[]
  blockers: string[]
}

export interface FactoryProjectContractV1 {
  contractVersion: FactoryProjectContractVersion
  contractKind: 'factory-project-contract'
  schemaVersion: 1
  createdAt: string
  updatedAt?: string
  project: FactoryProjectIdentity
  independence: FactoryProjectIndependence
  lineage: FactoryProjectLineage
  paths: FactoryProjectPathPolicy
  memory: FactoryProjectMemoryPolicy
  stack: FactoryProjectStack
  environmentVariables: FactoryProjectEnvironmentVariable[]
  quality: FactoryProjectQualityProfile
  security: FactoryProjectSecurityPolicy
  approvals: FactoryProjectApprovalPolicy
  repository: FactoryProjectRepositoryPolicy
  ci: FactoryProjectCiPolicy
  publication: FactoryProjectPublicationPolicy
  analytics: FactoryProjectAnalyticsPolicy
  evidence: FactoryProjectEvidencePolicy
  lifecycle: FactoryProjectLifecycle
}

export interface FactoryProjectContractValidationResult {
  ok: boolean
  errors: string[]
  warnings: string[]
}

export interface FactoryProjectContractSummary {
  contractVersion: FactoryProjectContractVersion
  projectId: string
  slug: string
  name: string
  briefId: string
  runId: string
  lifecycleStatus: FactoryProjectLifecycleStatus
  readiness: string
  repositoryRequired: boolean
  ciRequired: boolean
  runtimeDependsOnJefe: false
  environmentVariables: Array<{ name: string; required: boolean; secret: boolean; scope: string }>
  requiredChecks: string[]
  requiredArtifacts: string[]
  warnings: string[]
  risks: string[]
  blockers: string[]
}
