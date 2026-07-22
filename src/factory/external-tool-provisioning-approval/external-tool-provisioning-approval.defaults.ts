import type { FactoryExternalToolProvisioningApprovalKind, FactoryExternalToolProvisioningApprovalPolicy, FactoryExternalToolProvisioningApprovalVersion } from './external-tool-provisioning-approval.types.ts'

export const FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_KIND: FactoryExternalToolProvisioningApprovalKind = 'factory-external-tool-provisioning-approval'
export const FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_VERSION: FactoryExternalToolProvisioningApprovalVersion = '1.0'
export const FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NEXT_STEP = 'Proceed to UV Provisioning Runtime Adapter v1, then UV Provisioning Verification Gate v1; do not retry Hermes Python Runtime directly.'
export const FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NOT_AUTHORIZED_ACTIONS = ['install_tool_now', 'execute_tool_now', 'download_binary_now', 'execute_shell', 'execute_cmd', 'execute_powershell', 'execute_curl', 'execute_wget', 'execute_pip', 'execute_setup_py', 'global_install', 'mutate_project_package_files', 'access_credentials', 'call_model', 'deploy', 'execute_hermes', 'retry_hermes_python_runtime_now', 'execute_codex']

export const DEFAULT_FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_POLICY: FactoryExternalToolProvisioningApprovalPolicy = {
  requireProvisioningResult: true,
  requireProvisioningPlanCandidate: true,
  requireHumanApproval: true,
  requireReviewerIdentity: true,
  requireToolId: true,
  requireToolName: true,
  requireTargetPlatform: true,
  requireOfficialSourcePolicy: true,
  requireChecksumPolicy: true,
  requireRuntimeAdapterFuture: true,
  requireVerificationGateFuture: true,
  requireJefeReviewFuture: true,
  forbidInstallInThisGate: true,
  forbidExecutionInThisGate: true,
  forbidDownloadInThisGate: true,
  forbidShell: true,
  forbidCmd: true,
  forbidPowerShell: true,
  forbidCurl: true,
  forbidWget: true,
  forbidPipFallback: true,
  forbidGlobalInstall: true,
  forbidProjectMutation: true,
  forbidPackageFileMutation: true,
  forbidCredentials: true,
  forbidModelCalls: true,
  forbidDeploy: true,
}

const criticalTrueFlags: Array<keyof FactoryExternalToolProvisioningApprovalPolicy> = ['requireProvisioningResult', 'requireProvisioningPlanCandidate', 'requireHumanApproval', 'requireReviewerIdentity', 'forbidInstallInThisGate', 'forbidExecutionInThisGate', 'forbidDownloadInThisGate', 'forbidShell', 'forbidCmd', 'forbidPowerShell', 'forbidCurl', 'forbidWget', 'forbidPipFallback', 'forbidGlobalInstall', 'forbidProjectMutation', 'forbidPackageFileMutation', 'forbidCredentials', 'forbidModelCalls', 'forbidDeploy']

export function mergeFactoryExternalToolProvisioningApprovalPolicy(policy?: Partial<FactoryExternalToolProvisioningApprovalPolicy>): FactoryExternalToolProvisioningApprovalPolicy {
  const merged = { ...DEFAULT_FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_POLICY, ...(policy ?? {}) }
  for (const flag of criticalTrueFlags) merged[flag] = true
  return merged
}
