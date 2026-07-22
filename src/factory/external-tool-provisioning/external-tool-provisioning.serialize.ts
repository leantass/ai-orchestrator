import type { FactoryExternalToolProvisioningResult, FactoryExternalToolProvisioningSummary } from './external-tool-provisioning.types.ts'

export function serializeFactoryExternalToolProvisioningResult(result: FactoryExternalToolProvisioningResult): string {
  return JSON.stringify(result, null, 2)
}

export function parseFactoryExternalToolProvisioningResult(json: string): FactoryExternalToolProvisioningResult {
  return JSON.parse(json) as FactoryExternalToolProvisioningResult
}

export function summarizeFactoryExternalToolProvisioningResult(result: FactoryExternalToolProvisioningResult): FactoryExternalToolProvisioningSummary {
  return {
    provisioningId: result.provisioningId,
    toolId: result.toolId,
    targetPlatform: result.targetPlatform,
    preferredProvisioningMethod: result.provisioningPlanCandidate?.preferredProvisioningMethod,
    status: result.status,
    decision: result.decision,
    canInstallNow: false,
    canExecuteToolNow: false,
    nextStep: result.recommendedNextStep,
  }
}
