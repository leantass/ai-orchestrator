import type { FactoryHermesEntrypointMaterializationRuntimeRetryPolicy } from './hermes-entrypoint-materialization-runtime-retry.types.ts'

export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_KIND = 'factory-hermes-entrypoint-materialization-runtime-retry' as const
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_VERSION = '1.0' as const
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_SUCCESS_NEXT_STEP = 'Proceed to Factory Hermes Entrypoint Materialization Verification Gate v1; do not execute Hermes or retry the research adapter yet.'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_REPAIR_NEXT_STEP = 'Review Factory Hermes Entrypoint Materialization Runtime Retry result before repair; do not execute Hermes.'
export const DEFAULT_FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_RETRY_POLICY: FactoryHermesEntrypointMaterializationRuntimeRetryPolicy = {
  requireCacheVerification: true,
  requireCacheVerificationVerifiedOrWarningVerified: true,
  requireVerifiedBuildDependency: true,
  requireUvVerified: true,
  requireUvCacheRootUnderCodexTemp: true,
  requirePythonEnvRootUnderCodexTemp: true,
  requireSourceRootUnderCodexTemp: true,
  requireUvOffline: true,
  requireShellFalse: true,
  requireNoNoInstallProjectArg: true,
  requireExpectedExecutableAfterRetry: true,
  requireManifestAndResult: true,
  requireVerificationNext: true,
  allowUvSyncProjectInstallOnly: true,
  allowSetuptoolsBuildBackendOnlyViaUv: true,
  allowKnownSourceMetadataWarnings: true,
  forbidNetwork: true,
  forbidHermesExecution: true,
  forbidHermesScripts: true,
  forbidResearchAdapterRetry: true,
  forbidPipExecution: true,
  forbidPythonDirectExecution: true,
  forbidSetupPyDirectExecution: true,
  forbidUvRun: true,
  forbidUvPip: true,
  forbidUvVenv: true,
  forbidCredentials: true,
  forbidModelCalls: true,
  forbidProjectMutationOutsideAllowedRoots: true,
  forbidDeploy: true
}
