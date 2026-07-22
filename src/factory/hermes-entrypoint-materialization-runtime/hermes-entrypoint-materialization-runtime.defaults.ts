import type { FactoryHermesEntrypointMaterializationRuntimeKind, FactoryHermesEntrypointMaterializationRuntimePolicy, FactoryHermesEntrypointMaterializationRuntimeVersion } from './hermes-entrypoint-materialization-runtime.types.ts'

export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_KIND: FactoryHermesEntrypointMaterializationRuntimeKind = 'factory-hermes-entrypoint-materialization-runtime'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_VERSION: FactoryHermesEntrypointMaterializationRuntimeVersion = '1.0'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_SUCCESS_NEXT_STEP = 'Proceed to Factory Hermes Entrypoint Materialization Verification Gate v1; do not retry the research adapter yet.'
export const FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_REPAIR_NEXT_STEP = 'Review Factory Hermes Entrypoint Materialization Runtime Adapter v1 result and repair before retrying; do not execute Hermes.'

export const DEFAULT_FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_RUNTIME_POLICY: FactoryHermesEntrypointMaterializationRuntimePolicy = {
  requireApprovalEnvelope: true,
  requireApprovedMethodUvSyncInstallProject: true,
  requireUvVerified: true,
  requirePythonEnvPresent: true,
  requireSourceRootPresent: true,
  requirePyprojectPresent: true,
  requireUvLockPresent: true,
  requireShellFalse: true,
  requireSanitizedEnv: true,
  requireNoNoInstallProjectArg: true,
  requireExpectedExecutableAfterSync: true,
  requireManifestAndResult: true,
  requireVerificationNext: true,
  allowUvSyncProjectInstallOnly: true,
  allowSetuptoolsBuildBackendOnlyViaUv: true,
  forbidSetupPyDirectExecution: true,
  forbidPipExecution: true,
  forbidPythonDirectExecution: true,
  forbidHermesExecution: true,
  forbidHermesScripts: true,
  forbidUvRun: true,
  forbidUvPip: true,
  forbidUvVenv: true,
  forbidNetwork: true,
  forbidCredentials: true,
  forbidModelCalls: true,
  forbidProjectMutationOutsideAllowedRoots: true,
  forbidDeploy: true,
}
