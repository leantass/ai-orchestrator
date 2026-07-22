export type FactoryHermesEntrypointMaterializationRuntimeVersion = '1.0'
export type FactoryHermesEntrypointMaterializationRuntimeKind = 'factory-hermes-entrypoint-materialization-runtime'
export type FactoryHermesEntrypointMaterializationRuntimeStatus = 'success' | 'blocked' | 'failed'
export type FactoryHermesEntrypointMaterializationRuntimeDecision =
  | 'hermes_entrypoint_materialized_with_uv_sync_project_install'
  | 'blocked_missing_approval_envelope'
  | 'blocked_approved_command_not_safe'
  | 'blocked_uv_not_verified'
  | 'blocked_source_missing'
  | 'blocked_python_env_missing'
  | 'failed_uv_sync_project_install'
  | 'failed_entrypoint_not_created_after_sync'
  | 'blocked_network_required'
  | 'request_materialization_runtime_repair'

export interface FactoryHermesEntrypointMaterializationRuntimeInput {
  executedAt: string
  executedBy: string
  approvalResult?: unknown
  dryRun?: boolean
  policy?: Partial<FactoryHermesEntrypointMaterializationRuntimePolicy>
  runtimeNotes?: string
}

export interface FactoryHermesEntrypointMaterializationRuntimePolicy {
  requireApprovalEnvelope: boolean
  requireApprovedMethodUvSyncInstallProject: boolean
  requireUvVerified: boolean
  requirePythonEnvPresent: boolean
  requireSourceRootPresent: boolean
  requirePyprojectPresent: boolean
  requireUvLockPresent: boolean
  requireShellFalse: boolean
  requireSanitizedEnv: boolean
  requireNoNoInstallProjectArg: boolean
  requireExpectedExecutableAfterSync: boolean
  requireManifestAndResult: boolean
  requireVerificationNext: boolean
  allowUvSyncProjectInstallOnly: boolean
  allowSetuptoolsBuildBackendOnlyViaUv: boolean
  forbidSetupPyDirectExecution: boolean
  forbidPipExecution: boolean
  forbidPythonDirectExecution: boolean
  forbidHermesExecution: boolean
  forbidHermesScripts: boolean
  forbidUvRun: boolean
  forbidUvPip: boolean
  forbidUvVenv: boolean
  forbidNetwork: boolean
  forbidCredentials: boolean
  forbidModelCalls: boolean
  forbidProjectMutationOutsideAllowedRoots: boolean
  forbidDeploy: boolean
}

export interface FactoryHermesEntrypointMaterializationCommandResult {
  commandKind: 'uv_sync_install_project_locked_existing_env'
  executableRef: string
  args: string[]
  cwdRef: string
  shell: false
  timeoutMs: number
  envRefs: {
    UV_PROJECT_ENVIRONMENT: string
    UV_CACHE_DIR: string
    UV_OFFLINE: '1'
  }
  stdoutPreview: string
  stderrPreview: string
  exitCode: number | null
  timedOut: boolean
  started: boolean
  completed: boolean
}

export interface FactoryHermesEntrypointMaterializationRuntimeManifest {
  manifestKind: 'factory_hermes_entrypoint_materialization_runtime_manifest'
  manifestVersion: FactoryHermesEntrypointMaterializationRuntimeVersion
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: string
  pythonEntrypoint: string
  selectedMethodCandidate: string
  uvExecutableRef: string
  sourceRootRef: string
  pythonEnvRootRef: string
  expectedExecutableRef: string
  buildBackend: string
  setupPyPresent: boolean
  approvedCommandSummary: unknown
  commandResultSummary: unknown
  beforeState: unknown
  afterState: unknown
  materializationStatus: string
  executableStatusBefore: string
  executableStatusAfter: string
  uvStatus: string
  pipStatus: 'not_executed'
  pythonDirectStatus: 'not_executed'
  setupPyDirectStatus: 'not_executed'
  hermesExecutionStatus: 'not_executed'
  scriptsStatus: 'not_executed'
  networkStatus: 'not_allowed'
  credentialsStatus: 'not_allowed'
  modelCallStatus: 'not_allowed'
  materializedAt: string
  materializedBy: string
  nextRequiredGate: 'Factory Hermes Entrypoint Materialization Verification Gate v1'
}

export interface FactoryHermesEntrypointMaterializationRuntimeResult {
  materializationRunId: string
  materializationKind: FactoryHermesEntrypointMaterializationRuntimeKind
  materializationVersion: FactoryHermesEntrypointMaterializationRuntimeVersion
  executedAt: string
  executedBy: string
  toolId: 'hermes_agent'
  selectedCandidateId: string
  commandName: string
  pythonEntrypoint: string
  selectedMethodCandidate: string
  uvExecutableRef: string
  sourceRootRef: string
  pythonEnvRootRef: string
  expectedExecutableRef: string
  setupPyPresent: boolean
  buildBackend: string
  commandResults: FactoryHermesEntrypointMaterializationCommandResult[]
  beforeState: unknown
  afterState: unknown
  executableStatusBefore: string
  executableStatusAfter: string
  materializationStatus: string
  uvStatus: string
  pipStatus: 'not_executed'
  pythonDirectStatus: 'not_executed'
  setupPyDirectStatus: 'not_executed'
  hermesExecutionStatus: 'not_executed'
  scriptsStatus: 'not_executed'
  networkStatus: 'not_allowed'
  credentialsStatus: 'not_allowed'
  modelCallStatus: 'not_allowed'
  projectMutationStatus: string
  status: FactoryHermesEntrypointMaterializationRuntimeStatus
  decision: FactoryHermesEntrypointMaterializationRuntimeDecision
  blockers: unknown[]
  warnings: unknown[]
  checks: unknown[]
  canProceedToEntrypointMaterializationVerification: boolean
  canRetryResearchAdapterNow: false
  canExecuteHermesNow: false
  canTreatAsResearchResult: false
  canUseFindings: false
  canUseCredentials: false
  canCallModels: false
  canDeploy: false
  recommendedNextStep: string
}

export interface FactoryHermesEntrypointMaterializationRuntimeValidationResult { ok: boolean; errors: string[]; warnings: string[] }
export interface FactoryHermesEntrypointMaterializationRuntimeSummary { materializationRunId: string; commandName: string; pythonEntrypoint: string; status: FactoryHermesEntrypointMaterializationRuntimeStatus; decision: FactoryHermesEntrypointMaterializationRuntimeDecision; materializationStatus: string; executableStatusAfter: string; expectedExecutableRef: string; canProceedToEntrypointMaterializationVerification: boolean; canRetryResearchAdapterNow: false; canExecuteHermesNow: false; nextStep: string }
