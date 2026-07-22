export type FactoryHermesEntrypointMaterializationRuntimeRetryVersion = '1.0'
export type FactoryHermesEntrypointMaterializationRuntimeRetryKind = 'factory-hermes-entrypoint-materialization-runtime-retry'
export type FactoryHermesEntrypointMaterializationRuntimeRetryStatus = 'success' | 'blocked' | 'failed' | 'controlled_failure'
export type FactoryHermesEntrypointMaterializationRuntimeRetryDecision = 'hermes_entrypoint_materialized_after_cache_verified_retry' | 'blocked_missing_cache_verification' | 'blocked_cache_verification_not_ready' | 'blocked_retry_command_not_safe' | 'blocked_uv_not_verified' | 'blocked_source_missing' | 'blocked_python_env_missing' | 'failed_uv_sync_offline_retry' | 'failed_entrypoint_not_created_after_retry' | 'blocked_network_attempt_detected' | 'blocked_unexpected_source_mutation' | 'request_materialization_retry_repair'
export type FactoryHermesEntrypointMaterializationRuntimeRetryValidationResult = { ok: boolean; errors: string[]; warnings: string[] }
export type FactoryHermesEntrypointMaterializationRuntimeRetryInput = { executedAt: string; executedBy: string; cacheVerificationResult?: any; dryRun?: boolean; policy?: Partial<FactoryHermesEntrypointMaterializationRuntimeRetryPolicy>; runtimeNotes?: string[] }
export type FactoryHermesEntrypointMaterializationRuntimeRetryPolicy = {
  requireCacheVerification: boolean
  requireCacheVerificationVerifiedOrWarningVerified: boolean
  requireVerifiedBuildDependency: boolean
  requireUvVerified: boolean
  requireUvCacheRootUnderCodexTemp: boolean
  requirePythonEnvRootUnderCodexTemp: boolean
  requireSourceRootUnderCodexTemp: boolean
  requireUvOffline: boolean
  requireShellFalse: boolean
  requireNoNoInstallProjectArg: boolean
  requireExpectedExecutableAfterRetry: boolean
  requireManifestAndResult: boolean
  requireVerificationNext: boolean
  allowUvSyncProjectInstallOnly: boolean
  allowSetuptoolsBuildBackendOnlyViaUv: boolean
  allowKnownSourceMetadataWarnings: boolean
  forbidNetwork: boolean
  forbidHermesExecution: boolean
  forbidHermesScripts: boolean
  forbidResearchAdapterRetry: boolean
  forbidPipExecution: boolean
  forbidPythonDirectExecution: boolean
  forbidSetupPyDirectExecution: boolean
  forbidUvRun: boolean
  forbidUvPip: boolean
  forbidUvVenv: boolean
  forbidCredentials: boolean
  forbidModelCalls: boolean
  forbidProjectMutationOutsideAllowedRoots: boolean
  forbidDeploy: boolean
}
export type FactoryHermesEntrypointMaterializationRuntimeRetryCommandResult = { commandKind: string; executableRef: string; args: string[]; cwdRef: string; shell: false; timeoutMs: number; envRefs: Record<string, string>; stdoutPreview: string; stderrPreview: string; exitCode: number | null; timedOut: boolean; started: boolean; completed: boolean }
export type FactoryHermesEntrypointMaterializationRuntimeRetryManifest = Record<string, unknown>
export type FactoryHermesEntrypointMaterializationRuntimeRetryResult = {
  retryRunId: string
  retryKind: FactoryHermesEntrypointMaterializationRuntimeRetryKind
  retryVersion: FactoryHermesEntrypointMaterializationRuntimeRetryVersion
  executedAt: string
  executedBy: string
  toolId: 'hermes_agent'
  commandName: 'hermes'
  pythonEntrypoint: 'hermes_cli.main:main'
  selectedMethodCandidate: 'uv_sync_install_project_locked_existing_env'
  verifiedBuildDependency: { packageName: string; lockedPackageVersion: string; versionConstraint?: string; cacheStatus?: string }
  uvExecutableRef: string
  uvCacheRootRef: string
  sourceRootRef: string
  pythonEnvRootRef: string
  expectedExecutableRef: string
  commandResults: FactoryHermesEntrypointMaterializationRuntimeRetryCommandResult[]
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
  executableStatusBefore: string
  executableStatusAfter: string
  materializationStatus: string
  sourceMutationStatus: string
  uvStatus: string
  networkStatus: 'not_allowed'
  credentialsStatus: 'not_allowed'
  modelCallStatus: 'not_allowed'
  pipStatus: 'not_executed'
  pythonDirectStatus: 'not_executed'
  setupPyDirectStatus: 'not_executed'
  hermesExecutionStatus: 'not_executed'
  scriptsStatus: 'not_executed'
  researchAdapterRetryStatus: 'not_attempted'
  status: FactoryHermesEntrypointMaterializationRuntimeRetryStatus
  decision: FactoryHermesEntrypointMaterializationRuntimeRetryDecision
  blockers: Array<{ blockerId: string; message: string }>
  warnings: Array<{ warningId: string; message: string }>
  canProceedToEntrypointMaterializationVerification: boolean
  canRetryResearchAdapterNow: false
  canExecuteHermesNow: false
  canTreatAsResearchResult: false
  canUseFindings: false
  canUseNetwork: false
  canUseCredentials: false
  canCallModels: false
  canDeploy: false
  recommendedNextStep: string
}
export type FactoryHermesEntrypointMaterializationRuntimeRetrySummary = { retryRunId: string; commandName: string; pythonEntrypoint: string; status: string; decision: string; materializationStatus: string; executableStatusAfter: string; expectedExecutableRef: string; sourceMutationStatus: string; canProceedToEntrypointMaterializationVerification: boolean; canRetryResearchAdapterNow: false; canExecuteHermesNow: false; nextStep: string }
