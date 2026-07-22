import type { FactoryHermesResearchResultIngestionKind, FactoryHermesResearchResultIngestionPolicy, FactoryHermesResearchResultIngestionVersion } from './hermes-research-result-ingestion.types.ts'

export const FACTORY_HERMES_RESEARCH_RESULT_INGESTION_KIND: FactoryHermesResearchResultIngestionKind = 'factory-hermes-research-result-ingestion'
export const FACTORY_HERMES_RESEARCH_RESULT_INGESTION_VERSION: FactoryHermesResearchResultIngestionVersion = '1.0'
export const FACTORY_HERMES_RESEARCH_RESULT_INGESTION_NEXT_STEP = 'Proceed to Factory Hermes Research JEFE Review Gate v1; do not repair or execute Hermes directly.'
export const FACTORY_HERMES_RESEARCH_RESULT_INGESTION_NOT_AUTHORIZED_ACTIONS = ['execute_hermes_now', 'retry_adapter_now', 'materialize_entrypoint_now', 'execute_python_now', 'execute_uv_now', 'execute_pip_now', 'execute_setup_py_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'treat_as_research_result', 'use_findings_now', 'mutate_project_files_now', 'deploy_now']
export const DEFAULT_FACTORY_HERMES_RESEARCH_RESULT_INGESTION_POLICY: FactoryHermesResearchResultIngestionPolicy = {
  requireAdapterResult: true,
  requireAdapterUnderBoundary: true,
  requireCanProceedToResultIngestion: true,
  requireNoResearchFindingsForHelpProbe: true,
  requireNoNetwork: true,
  requireNoCredentials: true,
  requireNoModelCalls: true,
  requireNoPip: true,
  requireNoPythonDirect: true,
  requireNoSetupPy: true,
  requireNoUv: true,
  requireNoHermesScripts: true,
  allowControlledBlockedExecutableMissing: true,
  allowHelpProbeControlledFailure: true,
  forbidTreatingHelpProbeAsResearch: true,
  forbidFindingsUseFromHelpProbe: true,
  forbidExecutionInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidCredentialsInThisGate: true,
  forbidModelCallsInThisGate: true,
  requireJefeReviewNext: true,
  requireEntrypointMaterializationReviewIfMissingExecutable: true,
}
