import { FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_KIND, FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_VERSION } from './hermes-result-ingestion-contract-planning.defaults.ts'
import type { FactoryHermesResultIngestionContractPlanningInput, FactoryHermesResultIngestionContractPlanningResult, FactoryHermesResultIngestionContractPlanningValidationResult } from './hermes-result-ingestion-contract-planning.types.ts'

const SECRETISH = /(sk-[a-z0-9]|bearer\s+|api[_-]?key\s*[:=]\s*[^,\s]+|password\s*[:=]|token\s*[:=])/iu

export function validateFactoryHermesResultIngestionContractPlanningInput(input: FactoryHermesResultIngestionContractPlanningInput): FactoryHermesResultIngestionContractPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt is required.')
  if (!input?.plannedBy) errors.push('plannedBy is required.')
  if (!input?.outputContractPolicyPlanningResult) errors.push('outputContractPolicyPlanningResult is required.')
  if (!input?.toolsetsPolicyPlanningResult) errors.push('toolsetsPolicyPlanningResult is required.')
  if (!input?.networkPolicyPlanningResult) errors.push('networkPolicyPlanningResult is required.')
  if (!input?.credentialsPolicyPlanningResult) errors.push('credentialsPolicyPlanningResult is required.')
  if (SECRETISH.test(JSON.stringify({ planningNotes: input?.planningNotes }))) errors.push('input appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesResultIngestionContractPlanningResult(result: FactoryHermesResultIngestionContractPlanningResult): FactoryHermesResultIngestionContractPlanningValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.planningKind !== FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_KIND) errors.push('planningKind mismatch.')
  if (result.planningVersion !== FACTORY_HERMES_RESULT_INGESTION_CONTRACT_PLANNING_VERSION) errors.push('planningVersion mismatch.')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent.')
  if (result.status !== 'result_ingestion_contract_plan_created') errors.push('status must be result_ingestion_contract_plan_created.')
  if (result.decision !== 'hermes_result_ingestion_contract_plan_created') errors.push('decision must be hermes_result_ingestion_contract_plan_created.')
  const receipt = result.resultIngestionContractPlanningReceipt
  const plan = result.hermesResultIngestionContractPlanCandidate
  if (!receipt) errors.push('resultIngestionContractPlanningReceipt is required.')
  if (!plan) errors.push('hermesResultIngestionContractPlanCandidate is required.')
  const byId = new Map((plan?.ingestionSurfaceRules || []).map((rule) => [rule.ruleId, rule]))
  if (byId.get('stdout_plain_text_raw_candidate')?.status !== 'ingestible_as_raw_candidate_evidence' || byId.get('stdout_plain_text_raw_candidate')?.usableAsFindingsImmediately !== false) errors.push('stdout rule invalid.')
  if (byId.get('stderr_operational')?.status !== 'operational_only') errors.push('stderr rule invalid.')
  if (byId.get('usage_file_metadata')?.status !== 'operational_metadata_only') errors.push('usage file rule invalid.')
  if (byId.get('help_output')?.status !== 'operational_only') errors.push('help output rule invalid.')
  if (!plan?.findingCandidateRules.some((rule) => rule.ruleId === 'no_automatic_findings')) errors.push('no automatic findings rule missing.')
  if (!plan?.ingestionRecordShape?.requiredFields.includes('findingUseAllowed')) errors.push('ingestion record shape missing findingUseAllowed.')
  if (plan) {
    if (plan.ingestionAllowedNow !== false) errors.push('ingestionAllowedNow must be false.')
    if (plan.findingsAllowedNow !== false) errors.push('findingsAllowedNow must be false.')
    if (plan.promotionAllowedNow !== false) errors.push('promotionAllowedNow must be false.')
    if (plan.memoryWriteAllowedNow !== false || plan.briefWriteAllowedNow !== false || plan.contextUseAllowedNow !== false) errors.push('write/use flags must be false.')
    if (plan.rawOutputDirectUseForbidden !== true || plan.requiresJefeReviewForFindings !== true || plan.failureRecordsSupported !== true || plan.sanitizationRequiredBeforeIngestion !== true || plan.secretDetectionRequired !== true) errors.push('safety plan flags invalid.')
  }
  if (result.canProceedToTimeoutKillSwitchPolicyPlanning !== true) errors.push('canProceedToTimeoutKillSwitchPolicyPlanning must be true.')
  for (const key of ['canProceedToResearchExecutionApproval', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings'] as const) if (result[key] !== false) errors.push(`${key} must be false.`)
  for (const action of ['ingest_real_output_now', 'use_output_as_findings_now', 'promote_findings_now', 'write_findings_to_memory_now']) if (!receipt?.notAuthorizedActions.includes(action)) errors.push(`missing notAuthorizedAction ${action}.`)
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required.')
  if (SECRETISH.test(JSON.stringify(result))) errors.push('result appears to contain secret-like values.')
  return { ok: errors.length === 0, errors, warnings }
}
