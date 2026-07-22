import type { FactoryHermesToolsetDisableVerificationApprovalKind, FactoryHermesToolsetDisableVerificationApprovalPolicy, FactoryHermesToolsetDisableVerificationApprovalVersion } from './hermes-toolset-disable-verification-approval.types.ts'

export const FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_KIND: FactoryHermesToolsetDisableVerificationApprovalKind = 'factory-hermes-toolset-disable-verification-approval'
export const FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_VERSION: FactoryHermesToolsetDisableVerificationApprovalVersion = '1.0'
export const TOOLSET_DISABLE_VERIFICATION_APPROVAL_NEXT_STEP_BLOCKED = 'Proceed to Factory Hermes Runtime Selection Revision Planning Gate v1; no Hermes execution is authorized.'
export const TOOLSET_DISABLE_VERIFICATION_APPROVAL_NEXT_STEP_GRANTED = 'Proceed to Factory Hermes Toolset Disable Verification Runtime Adapter v1; execution remains prohibited until that gate.'
export const TOOLSET_DISABLE_VERIFICATION_APPROVAL_NOT_AUTHORIZED_ACTIONS = ['execute_hermes_now', 'execute_oneshot_now', 'pass_prompt_now', 'run_research_now', 'validate_toolsets_by_execution_now', 'call_models_now', 'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now', 'mutate_filesystem_now', 'create_runtime_run_root_now', 'approve_research_runtime_adapter_now', 'ingest_real_output_now', 'promote_findings_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'deploy_now']

export const DEFAULT_FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_POLICY: FactoryHermesToolsetDisableVerificationApprovalPolicy = {
  requirePlanningAllowsApproval: true,
  requireAdapterApprovalBlockedByToolset: true,
  requireSafeProbeShapeProven: true,
  requireProbeWithoutPrompt: true,
  requireProbeCannotReachProviderModelNetwork: true,
  requireNoCredentialRead: true,
  requireValidationBeforeAIAgent: true,
  forbidHermesExecutionInThisGate: true,
  forbidOneshotExecutionInThisGate: true,
  forbidPromptPassingInThisGate: true,
  forbidNetworkInThisGate: true,
  forbidCredentialUseInThisGate: true,
  forbidModelCallsInThisGate: true,
  forbidToolsetEnablementInThisGate: true,
  forbidResearchRuntimeAdapterApprovalInThisGate: true,
  forbidUsingFindingsInThisGate: true,
  forbidDeployInThisGate: true,
}
