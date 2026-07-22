import type { FactoryExternalToolProvisioningKind, FactoryExternalToolProvisioningPolicy, FactoryExternalToolProvisioningVersion } from './external-tool-provisioning.types.ts'

export const FACTORY_EXTERNAL_TOOL_PROVISIONING_KIND: FactoryExternalToolProvisioningKind = 'factory-external-tool-provisioning'
export const FACTORY_EXTERNAL_TOOL_PROVISIONING_VERSION: FactoryExternalToolProvisioningVersion = '1.0'

export const DEFAULT_FACTORY_EXTERNAL_TOOL_PROVISIONING_POLICY: FactoryExternalToolProvisioningPolicy = {
  requireToolProfile: true,
  requireOfficialSource: true,
  requireVersionPinOrRange: true,
  requireChecksumStrategy: true,
  requireInstallRootUnderCodexTemp: true,
  requireHumanApproval: true,
  requireNoShell: true,
  requireNoCredentials: true,
  requireNoProjectPackageMutation: true,
  forbidInstallInThisGate: true,
  forbidExecutionInThisGate: true,
  forbidShell: true,
  forbidCmd: true,
  forbidPowerShell: true,
  forbidCurl: true,
  forbidWget: true,
  forbidPipFallback: true,
  forbidGlobalInstall: true,
  forbidProjectMutation: true,
  forbidDeploy: true,
  requireRuntimeAdapterFuture: true,
  requireVerificationGateFuture: true,
  requireJefeReviewFuture: true,
}

const criticalTrueFlags: Array<keyof FactoryExternalToolProvisioningPolicy> = [
  'requireToolProfile',
  'requireOfficialSource',
  'requireChecksumStrategy',
  'requireNoShell',
  'requireNoCredentials',
  'requireNoProjectPackageMutation',
  'forbidInstallInThisGate',
  'forbidExecutionInThisGate',
  'forbidShell',
  'forbidCmd',
  'forbidPowerShell',
  'forbidCurl',
  'forbidWget',
  'forbidPipFallback',
  'forbidGlobalInstall',
  'forbidProjectMutation',
  'forbidDeploy',
  'requireRuntimeAdapterFuture',
  'requireVerificationGateFuture',
  'requireJefeReviewFuture',
]

export function mergeFactoryExternalToolProvisioningPolicy(policy?: Partial<FactoryExternalToolProvisioningPolicy>): FactoryExternalToolProvisioningPolicy {
  const merged = { ...DEFAULT_FACTORY_EXTERNAL_TOOL_PROVISIONING_POLICY, ...(policy ?? {}) }
  for (const flag of criticalTrueFlags) merged[flag] = true
  return merged
}
