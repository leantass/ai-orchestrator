import type { FactoryHermesResearchRuntimeAdapterKind, FactoryHermesResearchRuntimeAdapterPolicy, FactoryHermesResearchRuntimeAdapterVersion } from './hermes-research-runtime-adapter.types.ts'

export const FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND: FactoryHermesResearchRuntimeAdapterKind = 'factory-hermes-research-runtime-adapter'
export const FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION: FactoryHermesResearchRuntimeAdapterVersion = '1.0'
export const FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_NEXT_STEP = 'Proceed to Factory Hermes Research Result Ingestion Gate v1; this help probe is not a research result.'
export const DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_POLICY: FactoryHermesResearchRuntimeAdapterPolicy = {
  requireApprovalEnvelope: true,
  requireBoundaryContract: true,
  requireSelectedInterface: true,
  requireModeHelpProbeOnly: true,
  requireExecutableUnderPythonEnv: true,
  requireCwdSourceRoot: true,
  requireShellFalse: true,
  requireTimeout: true,
  requireKillSwitch: true,
  requireProcessTreeKillBestEffort: true,
  requireSanitizedLogs: true,
  requireBoundedOutputRoots: true,
  requireResultIngestionNext: true,
  forbidInteractiveNoArgs: true,
  forbidResearchPromptInV1: true,
  forbidNetwork: true,
  forbidCredentials: true,
  forbidModelCalls: true,
  forbidUvExecution: true,
  forbidPipExecution: true,
  forbidPythonDirectExecution: true,
  forbidSetupPyExecution: true,
  forbidHermesScripts: true,
  forbidProjectMutation: true,
  forbidDeploy: true,
}
