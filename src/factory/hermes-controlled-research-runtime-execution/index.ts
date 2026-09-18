export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_KIND = 'factory-hermes-controlled-research-runtime-execution'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeExecutionVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_VERSION
export type FactoryHermesControlledResearchRuntimeExecutionKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_EXECUTION_KIND
export type FactoryHermesControlledResearchRuntimeExecutionStatus = 'controlled_research_runtime_execution_completed' | 'controlled_research_runtime_execution_blocked' | 'controlled_research_runtime_execution_failed'
export type FactoryHermesControlledResearchRuntimeExecutionDecision = 'hermes_controlled_research_runtime_execution_completed_for_review' | 'hermes_controlled_research_runtime_execution_blocked_final_guards_not_satisfied' | 'hermes_controlled_research_runtime_execution_failed_for_review'
export type FactoryHermesControlledResearchRuntimeExecutionInput = { executedAt: string, executedBy: string }
export type FactoryHermesControlledResearchRuntimeExecutionPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', singleRunOnly: true, failClosed: true }
export type FactoryHermesFinalRuntimePreflightResult = any
export type FactoryHermesVerifiedArtifactStabilityResult = any
export type FactoryHermesFinalPromptArtifactManifest = any
export type FactoryHermesFinalCredentialAccessAudit = any
export type FactoryHermesFinalRuntimeCommandEnvelope = any
export type FactoryHermesFinalRuntimeGuardDecision = any
export type FactoryHermesControlledRuntimeProcessExecutionResult = any
export type FactoryHermesControlledRuntimeTimeoutKillSwitchResult = any
export type FactoryHermesControlledRuntimeOutputCaptureResult = any
export type FactoryHermesControlledRuntimeNoToolEvidenceResult = any
export type FactoryHermesControlledRuntimePostRunSecretScanResult = any
export type FactoryHermesControlledRuntimePostRunGitAuditResult = any
export type FactoryHermesControlledRuntimeExecutionReviewEnvelope = any
export type FactoryHermesControlledResearchRuntimeExecutionReceipt = any
export type FactoryHermesControlledResearchRuntimeExecutionResultRecord = any
export type FactoryHermesControlledResearchRuntimeExecutionCheck = { checkId: string, passed: boolean, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionBlocker = { blockerId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionWarning = { warningId: string, message: string }
export type FactoryHermesControlledResearchRuntimeExecutionResult = any
export type FactoryHermesControlledResearchRuntimeExecutionValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesControlledResearchRuntimeExecutionSummary = { executionId: string, status: string, decision: string, executionStatus: string, singleControlledRunExecuted: boolean, canUseFindings: boolean }

export function validateFactoryHermesControlledResearchRuntimeExecutionResult(result: FactoryHermesControlledResearchRuntimeExecutionResult): FactoryHermesControlledResearchRuntimeExecutionValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_execution_completed', 'controlled_research_runtime_execution_blocked', 'controlled_research_runtime_execution_failed'].includes(result?.status)) errors.push('invalid_status')
  if (result?.canProceedToControlledResearchRuntimeExecutionReview !== true) errors.push('review_gate_must_be_allowed')
  if (result?.canUseFindings !== false) errors.push('findings_must_stay_blocked')
  if (result?.findingsUseApprovedNow !== false) errors.push('findings_use_approved_now_must_be_false')
  if (result?.credentialValueLogged !== false) errors.push('credential_value_logged_must_be_false')
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeExecutionResult(result: FactoryHermesControlledResearchRuntimeExecutionResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeExecutionResult(text: string): FactoryHermesControlledResearchRuntimeExecutionResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeExecutionResult(result: FactoryHermesControlledResearchRuntimeExecutionResult): FactoryHermesControlledResearchRuntimeExecutionSummary {
  return { executionId: result.executionId, status: result.status, decision: result.decision, executionStatus: result.executionStatus, singleControlledRunExecuted: result.singleControlledRunExecuted, canUseFindings: result.canUseFindings }
}
