export type FactoryHermesControlledResearchRuntimePreparationVersion = '1.0'
export type FactoryHermesControlledResearchRuntimePreparationKind = 'factory-hermes-controlled-research-runtime-preparation'
export type FactoryHermesControlledResearchRuntimePreparationStatus = 'controlled_research_runtime_prepared' | 'controlled_research_runtime_preparation_blocked'
export type FactoryHermesControlledResearchRuntimePreparationDecision = 'hermes_controlled_research_runtime_prepared_for_preparation_review' | 'hermes_controlled_research_runtime_preparation_blocked_live_runtime_surface_detected'

export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_KIND: FactoryHermesControlledResearchRuntimePreparationKind = 'factory-hermes-controlled-research-runtime-preparation'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_VERSION: FactoryHermesControlledResearchRuntimePreparationVersion = '1.0'

export interface FactoryHermesControlledResearchRuntimePreparationInput {
  preparedAt: string
  preparedBy: string
  controlledRuntimeApprovalResult?: any
  controlledRuntimePlanningResult?: any
  researchRuntimeAdapterResult?: any
  runtimeSelectionDecisionResult?: any
}

export interface FactoryHermesControlledResearchRuntimePreparationPolicy { policyId: string, allowedNow: boolean, requiresFutureApproval: boolean }
export interface FactoryHermesControlledRuntimePreparationManifest { manifestId: string, toolId: 'hermes_agent', preparationMode: 'non_executing_runtime_preparation', selectedWrapperStrategy: string, provider: string, model: string, credentialRef: string, host: string, preparationAllowed: boolean, runtimeExecutionAllowed: boolean, researchExecutionAllowed: boolean, adapterExecutionAllowed: boolean, hermesExecutionAllowed: boolean, wrapperExecutionAllowed: boolean, promptPassingAllowed: boolean, modelCallsAllowed: boolean, networkAllowed: boolean, credentialAccessAllowed: boolean, toolsetEnablementAllowed: boolean, findingsUseAllowed: boolean, artifactsAreNonExecutable: boolean, liveTempConfigCreated: boolean, runRootCreated: boolean, promptPassed: boolean, credentialValuesRead: boolean }
export interface FactoryHermesControlledRuntimeVirtualTempConfigCandidate { candidateId: string, virtualOnly: boolean, fileWritten: boolean, liveTempConfigCreated: boolean, plannedRoot: string, plannedFileName: 'config.yaml', plannedPathStringOnly: boolean, containsSecrets: boolean, containsCredentialValues: boolean, containsEnvDump: boolean, usesProjectRoot: boolean, modifiesHermesSource: boolean, disablesOrEmptiesCliToolsets: 'intended_but_not_runtime_proven', disablesMcp: 'intended_but_not_runtime_proven', avoidsHiddenDefaults: 'required_but_not_runtime_proven', exactConfigSchemaKnown: 'unknown', emptyToolsetsInConfigSupported: 'unknown', runnableModeAllowed: boolean, runtimeUseRequiresFutureApproval: boolean, runtimeUseRequiresVerificationArtifact: boolean }
export interface FactoryHermesControlledRuntimeRunRootPathValidationManifest { manifestId: string, runRootCreated: boolean, runRootCreationAllowedNow: boolean, plannedRunRoot: string, pathStringOnly: boolean, underCodexTemp: boolean, pathEscapesCodexTemp: boolean, overwriteExistingDataAllowed: boolean, manifestRequiredBeforeUse: boolean, cleanupOrRetentionPolicyRequired: boolean, filesystemMutationPolicyRequiredBeforeRuntime: boolean, futureRunRootCreationRequiresApproval: boolean }
export interface FactoryHermesControlledRuntimeCredentialReferenceBoundary { boundaryId: string, credentialRef: string, credentialValueRead: boolean, credentialAccessAllowedNow: boolean, envSecretReadAllowedNow: boolean, dotEnvReadAllowedNow: boolean, processEnvReadAllowedNow: boolean, credentialValueInArtifact: boolean, credentialValueInStdout: boolean, futureCredentialAccessRequiresApproval: boolean, redactionPolicyRequired: boolean, postRunSecretAuditRequired: boolean }
export interface FactoryHermesControlledRuntimePromptReferencePolicy { policyId: string, promptPassingAllowedNow: boolean, promptCreatedNow: boolean, promptSentNow: boolean, plannedPromptKind: 'first_controlled_research_prompt', promptReferenceRequiredBeforeRuntime: boolean, promptMustHaveOutputContract: boolean, promptMustHaveNoSecrets: boolean, promptMustHaveNoToolInstructionsOutsidePolicy: boolean, promptMustBeLoggedOnlyAsHashOrSafeSummaryBeforeRuntime: boolean, futurePromptApprovalGateRequired: boolean }
export interface FactoryHermesControlledRuntimeModelNetworkAllowlistPolicy { policyId: string, provider: string, model: string, host: string, modelCallsAllowedNow: boolean, networkAllowedNow: boolean, dnsAllowedNow: boolean, endpointTestsAllowedNow: boolean, endpointAllowlistRequiredBeforeRuntime: boolean, timeoutRequiredBeforeRuntime: boolean, retryPolicyRequiredBeforeRuntime: boolean, rateLimitRequiredBeforeRuntime: boolean, killSwitchRequiredBeforeRuntime: boolean, hostReferencedButNotTested: boolean }
export interface FactoryHermesControlledRuntimeToolsetDisableProofRequirements { requirementsId: string, selectedWrapperStrategy: string, toolsetEnablementAllowedNow: boolean, directNoToolsetsTextOnlyRejected: boolean, directHermesCliDefaultsForbidden: boolean, noMcpInsufficientAlone: boolean, hiddenDefaultsRiskCarriedForward: boolean, futureRuntimeMustUseWrapperBoundary: boolean, futureRuntimeMustFailIfToolsetsCannotBeProvenDisabled: boolean, futureRuntimeMustFailIfDefaultToolsetsLoad: boolean, futureRuntimeMustFailIfMcpEnabled: boolean, futureRuntimeMustFailIfAnyToolUsageAppearsInOutput: boolean, proofArtifactRequiredBeforeRuntime: boolean, runtimeNoToolModeNotYetProven: boolean }
export interface FactoryHermesControlledRuntimeTimeoutKillSwitchEnvelope { envelopeId: string, processCreatedNow: boolean, timeoutAppliedNow: boolean, futureRuntimeTimeoutRequired: boolean, maxRuntimeSeconds: number, noOutputTimeoutSeconds: number, killSwitchRequired: boolean, cancellationSignalRequired: boolean, processTreeKillRequiredIfProcessExistsInFuture: boolean, runawayOutputLimitRequired: boolean, maxStdoutBytes: number, maxStderrBytes: number, timeoutMustBlockFindings: boolean, failureMustBlockFindings: boolean }
export interface FactoryHermesControlledRuntimeOutputIngestionContract { contractId: string, outputIngestionAllowedNow: boolean, findingsUseAllowedNow: boolean, futureOutputIngestionRequiresApproval: boolean, outputMustHaveContract: boolean, outputMustBeStoredUnderCodexTemp: boolean, outputMustBeRedacted: boolean, outputMustBeBounded: boolean, outputMustBeClassifiedBeforeUse: boolean, findingsRequireReviewGate: boolean, rawOutputMustNotBePromotedToFindingsAutomatically: boolean, failedRunOutputMustNotBeUsedAsFindings: boolean, timeoutOutputMustNotBeUsedAsFindings: boolean }
export interface FactoryHermesControlledRuntimePreparationRiskRegister { registerId: string, risks: any[] }
export interface FactoryHermesControlledRuntimePreparationReviewEnvelope { envelopeId: string, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_preparation_review_only', selectedWrapperStrategy: string, sourcePreparationRef: string, sourceApprovalRef: string, targetNextGate: string, purpose: string, allowedInNextGate: string[], forbiddenEvenInNextGate: string[], flags: Record<string, boolean>, recommendedNextGate: string }
export interface FactoryHermesControlledResearchRuntimePreparationReceipt { receiptId: string, preparationId: string, toolId: 'hermes_agent', preparedBy: string, preparedAt: string, decision: FactoryHermesControlledResearchRuntimePreparationDecision, preparationStatus: string, scope: string, approvedNextGate: string, notAuthorizedActions: string[] }
export interface FactoryHermesControlledResearchRuntimePreparationResultRecord { recordId: string, preparationStatus: string, decision: FactoryHermesControlledResearchRuntimePreparationDecision, liveRuntimePrepared: boolean, runtimeExecutionAllowedNow: boolean, canProceedToControlledResearchRuntimePreparationReview: boolean }
export interface FactoryHermesControlledResearchRuntimePreparationCheck { checkId: string, passed: boolean, message: string }
export interface FactoryHermesControlledResearchRuntimePreparationBlocker { blockerId: string, message: string }
export interface FactoryHermesControlledResearchRuntimePreparationWarning { warningId: string, message: string }
export interface FactoryHermesControlledResearchRuntimePreparationValidationResult { ok: boolean, errors: string[] }
export interface FactoryHermesControlledResearchRuntimePreparationSummary { preparationId: string, status: string, decision: string, canProceedToControlledResearchRuntimePreparationReview: boolean, canRunResearchNow: boolean }
export interface FactoryHermesControlledResearchRuntimePreparationResult {
  preparationId: string
  preparationKind: FactoryHermesControlledResearchRuntimePreparationKind
  preparationVersion: FactoryHermesControlledResearchRuntimePreparationVersion
  preparedAt: string
  preparedBy: string
  toolId: 'hermes_agent'
  controlledRuntimeApprovalRef?: string
  controlledRuntimePlanningRef?: string
  researchRuntimeAdapterRef?: string
  runtimeSelectionDecisionRef?: string
  selectedWrapperStrategy: string
  controlledRuntimePreparationManifest?: FactoryHermesControlledRuntimePreparationManifest
  controlledRuntimeVirtualTempConfigCandidate?: FactoryHermesControlledRuntimeVirtualTempConfigCandidate
  controlledRuntimeRunRootPathValidationManifest?: FactoryHermesControlledRuntimeRunRootPathValidationManifest
  controlledRuntimeCredentialReferenceBoundary?: FactoryHermesControlledRuntimeCredentialReferenceBoundary
  controlledRuntimePromptReferencePolicy?: FactoryHermesControlledRuntimePromptReferencePolicy
  controlledRuntimeModelNetworkAllowlistPolicy?: FactoryHermesControlledRuntimeModelNetworkAllowlistPolicy
  controlledRuntimeToolsetDisableProofRequirements?: FactoryHermesControlledRuntimeToolsetDisableProofRequirements
  controlledRuntimeTimeoutKillSwitchEnvelope?: FactoryHermesControlledRuntimeTimeoutKillSwitchEnvelope
  controlledRuntimeOutputIngestionContract?: FactoryHermesControlledRuntimeOutputIngestionContract
  controlledRuntimePreparationRiskRegister?: FactoryHermesControlledRuntimePreparationRiskRegister
  controlledRuntimePreparationReviewEnvelope?: FactoryHermesControlledRuntimePreparationReviewEnvelope
  controlledResearchRuntimePreparationReceipt: FactoryHermesControlledResearchRuntimePreparationReceipt
  hermesControlledResearchRuntimePreparationResultRecord: FactoryHermesControlledResearchRuntimePreparationResultRecord
  checks: FactoryHermesControlledResearchRuntimePreparationCheck[]
  blockers: FactoryHermesControlledResearchRuntimePreparationBlocker[]
  warnings: FactoryHermesControlledResearchRuntimePreparationWarning[]
  status: FactoryHermesControlledResearchRuntimePreparationStatus
  decision: FactoryHermesControlledResearchRuntimePreparationDecision
  preparationStatus: string
  runtimePreparationManifestBuilt: boolean
  virtualTempConfigCandidateBuilt: boolean
  runRootPathValidationManifestBuilt: boolean
  credentialReferenceBoundaryPrepared: boolean
  promptReferencePolicyPrepared: boolean
  modelNetworkAllowlistPrepared: boolean
  toolsetDisableProofPrepared: boolean
  timeoutKillSwitchEnvelopePrepared: boolean
  outputIngestionContractPrepared: boolean
  controlledRuntimeExecutionAllowedNow: boolean
  researchExecutionApprovedNow: boolean
  tempConfigCreatedNow: boolean
  runRootCreatedNow: boolean
  promptPassedNow: boolean
  modelCallsMadeNow: boolean
  networkUsedNow: boolean
  credentialValuesReadNow: boolean
  toolsetsEnabledNow: boolean
  findingsUseApprovedNow: boolean
  canProceedToControlledResearchRuntimePreparationReview: boolean
  canProceedToControlledResearchRuntimeExecution: boolean
  canProceedToResearchRuntimeAdapterExecution: boolean
  canProceedToKeepHermesResearchBlockedDecision: boolean
  canRunResearchNow: boolean
  canExecuteHermesNow: boolean
  canPassPromptNow: boolean
  canUseNetworkNow: boolean
  canUseCredentialsNow: boolean
  canReadEnvSecretsNow: boolean
  canCallModelsNow: boolean
  canEnableToolsetsNow: boolean
  canMutateFilesystemNow: boolean
  canUseFindings: boolean
  recommendedNextStep: string
}

const forbiddenEvenInNextGate = [
  'execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes',
  'create live temp config', 'create run root', 'pass prompt', 'call model', 'use network',
  'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'enable actual toolsets',
  'execute research', 'ingest real output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py',
]

const notAuthorizedActions = [
  'prepare_live_runtime_now', 'execute_research_now', 'execute_research_runtime_adapter_now',
  'execute_wrapper_against_hermes_now', 'create_live_temp_config_now', 'create_config_yaml_now',
  'create_run_root_now', 'pass_prompt_now', 'call_models_now', 'use_network_now', 'resolve_dns_now',
  'test_endpoints_now', 'access_credentials_now', 'read_env_secrets_now', 'read_dotenv_now',
  'read_credential_values_now', 'enable_toolsets_now', 'ingest_real_output_now', 'promote_findings_now',
  'modify_hermes_source_now', 'modify_python_env_now', 'modify_cache_now', 'execute_hermes_now',
  'execute_hermes_help_now', 'execute_oneshot_now', 'execute_uv_now', 'execute_python_now',
  'execute_pip_now', 'execute_setup_py_now', 'deploy_now',
]

function selectionRecord(selection: any): any {
  return selection?.runtimeSelectionDecisionRecord || selection
}

function selectionField(selection: any, key: string): string | undefined {
  const s = selectionRecord(selection)
  if (key === 'provider') return s?.selectedProvider || s?.provider?.providerId
  if (key === 'model') return s?.selectedModel || s?.model?.modelId
  if (key === 'credentialRef') return s?.selectedCredentialRef || s?.credential?.credentialRefName
  if (key === 'host') return s?.selectedHost || s?.network?.selectedHosts?.[0]
  if (key === 'runRoot') return s?.selectedRunRoot || s?.runRoot?.selectedRunRoot
  return undefined
}

function buildRiskRegister(id: string): FactoryHermesControlledRuntimePreparationRiskRegister {
  const risks = [
    'preparation_confused_with_execution',
    'virtual_temp_config_confused_with_live_config',
    'run_root_path_confused_with_created_directory',
    'credential_ref_confused_with_credential_value',
    'prompt_policy_confused_with_prompt_approval',
    'model_network_policy_confused_with_network_approval',
    'toolset_proof_requirements_confused_with_toolset_disable_proof',
    'timeout_envelope_confused_with_active_process_control',
    'output_contract_confused_with_output_ingestion',
    'hidden_defaults_loaded_in_future_runtime',
    'schema_unknown_overlooked',
    'findings_used_without_real_ingestion_review',
  ]
  return {
    registerId: `${id}:risk-register`,
    risks: risks.map((riskId) => ({
      riskId,
      severity: ['preparation_confused_with_execution', 'hidden_defaults_loaded_in_future_runtime'].includes(riskId) ? 'critical' : 'high',
      disposition: ['accepted_for_preparation_review_only', 'blocks_runtime_execution', 'blocks_research_execution', 'requires_future_gate_control'],
      mitigation: 'Keep artifacts non-executable and require future gate control before live runtime, credentials, prompt, network, toolsets, output ingestion, or findings use.',
      blocksPreparation: false,
      blocksPreparationReview: false,
      blocksRuntimeExecution: true,
      blocksResearchExecution: true,
    })),
  }
}

export function evaluateFactoryHermesControlledResearchRuntimePreparation(input: FactoryHermesControlledResearchRuntimePreparationInput): FactoryHermesControlledResearchRuntimePreparationResult {
  const id = `hermes-controlled-research-runtime-preparation:75b300f:${input.preparedAt}`
  const approval = input.controlledRuntimeApprovalResult || {}
  const plan = input.controlledRuntimePlanningResult || {}
  const adapter = input.researchRuntimeAdapterResult || {}
  const selection = input.runtimeSelectionDecisionResult || {}
  const provider = selectionField(selection, 'provider') || 'openai'
  const model = selectionField(selection, 'model') || 'gpt-4o-mini'
  const credentialRef = selectionField(selection, 'credentialRef') || 'OPENAI_API_KEY'
  const host = selectionField(selection, 'host') || 'api.openai.com'
  const selectedRunRoot = selectionField(selection, 'runRoot') || '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/'
  const plannedRoot = plan.controlledRuntimeTempConfigPolicyPlan?.plannedTempConfigRoot || '.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode/hermes-first-controlled-runtime-001/'
  const plannedRunRoot = plan.controlledRuntimeRunRootPolicyPlan?.plannedRunRoot || selectedRunRoot

  const approvalOk = approval.status === 'controlled_research_runtime_approval_granted'
    && approval.decision === 'hermes_controlled_research_runtime_approved_for_preparation_gate'
    && approval.controlledRuntimeApprovalStatus === 'approved_for_preparation_only'
    && approval.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && approval.controlledRuntimePreparationAllowed === true
    && approval.controlledRuntimeExecutionAllowedNow === false
    && approval.researchExecutionApprovedNow === false
    && approval.tempConfigCreationApprovedNow === false
    && approval.runRootCreationApprovedNow === false
    && approval.promptPassingApprovedNow === false
    && approval.modelCallsApprovedNow === false
    && approval.networkApprovedNow === false
    && approval.credentialAccessApprovedNow === false
    && approval.toolsetEnablementApprovedNow === false
    && approval.findingsUseApprovedNow === false
    && approval.canProceedToControlledResearchRuntimePreparation === true
    && approval.canProceedToControlledResearchRuntimeExecution === false
    && approval.canRunResearchNow === false
  const planOk = plan.status === 'controlled_research_runtime_plan_created'
    && plan.decision === 'hermes_controlled_research_runtime_plan_created_for_approval'
    && plan.runtimePlanningStatus === 'plan_candidate_created'
    && Boolean(plan.controlledRuntimeBoundaryPlan)
    && Boolean(plan.controlledRuntimeTempConfigPolicyPlan)
    && Boolean(plan.controlledRuntimeRunRootPolicyPlan)
    && Boolean(plan.controlledRuntimeCredentialAccessPolicyPlan)
    && Boolean(plan.controlledRuntimePromptPassingPolicyPlan)
    && Boolean(plan.controlledRuntimeModelNetworkPolicyPlan)
    && Boolean(plan.controlledRuntimeToolsetDisablePolicyPlan)
    && Boolean(plan.controlledRuntimeTimeoutKillSwitchPolicyPlan)
    && Boolean(plan.controlledRuntimeOutputIngestionPolicyPlan)
    && Boolean(plan.controlledRuntimeRiskRegister)
  const adapterOk = adapter.status === 'research_runtime_adapter_prepared'
    && adapter.adapterStatus === 'prepared_code_only_not_executed'
    && adapter.wrapperBoundaryIntegrated === true
    && adapter.adapterCommandEnvelopeBuilt === true
    && adapter.adapterSafetyManifestBuilt === true
    && adapter.runtimeAdapterExecutionAllowedNow === false
    && adapter.canRunResearchNow === false
  const selectionOk = provider === 'openai' && model === 'gpt-4o-mini' && credentialRef === 'OPENAI_API_KEY' && host === 'api.openai.com' && String(selectedRunRoot).includes('.codex-temp')
  const liveSurfaceDetected = false
  const blockers = [
    ...(!approvalOk ? [{ blockerId: 'controlled_runtime_approval_invalid', message: 'Controlled runtime approval does not authorize preparation-only flow.' }] : []),
    ...(!planOk ? [{ blockerId: 'controlled_runtime_plan_invalid', message: 'Controlled runtime plan is incomplete.' }] : []),
    ...(!adapterOk ? [{ blockerId: 'research_runtime_adapter_invalid', message: 'Research runtime adapter is not prepared code-only.' }] : []),
    ...(!selectionOk ? [{ blockerId: 'runtime_selection_invalid', message: 'Runtime selection is incomplete or outside allowed values.' }] : []),
    ...(liveSurfaceDetected ? [{ blockerId: 'live_runtime_surface_detected', message: 'Live runtime surface detected during preparation.' }] : []),
  ]
  const prepared = blockers.length === 0
  const status: FactoryHermesControlledResearchRuntimePreparationStatus = prepared ? 'controlled_research_runtime_prepared' : 'controlled_research_runtime_preparation_blocked'
  const decision: FactoryHermesControlledResearchRuntimePreparationDecision = prepared ? 'hermes_controlled_research_runtime_prepared_for_preparation_review' : 'hermes_controlled_research_runtime_preparation_blocked_live_runtime_surface_detected'
  const preparationStatus = prepared ? 'prepared_non_executing_runtime_artifacts' : 'blocked'

  const manifest: FactoryHermesControlledRuntimePreparationManifest = {
    manifestId: `${id}:manifest`, toolId: 'hermes_agent', preparationMode: 'non_executing_runtime_preparation',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', provider, model, credentialRef, host, preparationAllowed: true,
    runtimeExecutionAllowed: false, researchExecutionAllowed: false, adapterExecutionAllowed: false, hermesExecutionAllowed: false,
    wrapperExecutionAllowed: false, promptPassingAllowed: false, modelCallsAllowed: false, networkAllowed: false,
    credentialAccessAllowed: false, toolsetEnablementAllowed: false, findingsUseAllowed: false,
    artifactsAreNonExecutable: true, liveTempConfigCreated: false, runRootCreated: false, promptPassed: false, credentialValuesRead: false,
  }
  const virtualTempConfig: FactoryHermesControlledRuntimeVirtualTempConfigCandidate = {
    candidateId: `${id}:virtual-temp-config-candidate`, virtualOnly: true, fileWritten: false, liveTempConfigCreated: false,
    plannedRoot, plannedFileName: 'config.yaml', plannedPathStringOnly: true, containsSecrets: false, containsCredentialValues: false,
    containsEnvDump: false, usesProjectRoot: false, modifiesHermesSource: false, disablesOrEmptiesCliToolsets: 'intended_but_not_runtime_proven',
    disablesMcp: 'intended_but_not_runtime_proven', avoidsHiddenDefaults: 'required_but_not_runtime_proven',
    exactConfigSchemaKnown: 'unknown', emptyToolsetsInConfigSupported: 'unknown', runnableModeAllowed: false,
    runtimeUseRequiresFutureApproval: true, runtimeUseRequiresVerificationArtifact: true,
  }
  const runRootManifest: FactoryHermesControlledRuntimeRunRootPathValidationManifest = {
    manifestId: `${id}:run-root-path-validation`, runRootCreated: false, runRootCreationAllowedNow: false, plannedRunRoot,
    pathStringOnly: true, underCodexTemp: String(plannedRunRoot).includes('.codex-temp'), pathEscapesCodexTemp: false,
    overwriteExistingDataAllowed: false, manifestRequiredBeforeUse: true, cleanupOrRetentionPolicyRequired: true,
    filesystemMutationPolicyRequiredBeforeRuntime: true, futureRunRootCreationRequiresApproval: true,
  }
  const credentialBoundary: FactoryHermesControlledRuntimeCredentialReferenceBoundary = {
    boundaryId: `${id}:credential-reference-boundary`, credentialRef, credentialValueRead: false, credentialAccessAllowedNow: false,
    envSecretReadAllowedNow: false, dotEnvReadAllowedNow: false, processEnvReadAllowedNow: false, credentialValueInArtifact: false,
    credentialValueInStdout: false, futureCredentialAccessRequiresApproval: true, redactionPolicyRequired: true, postRunSecretAuditRequired: true,
  }
  const promptPolicy: FactoryHermesControlledRuntimePromptReferencePolicy = {
    policyId: `${id}:prompt-reference-policy`, promptPassingAllowedNow: false, promptCreatedNow: false, promptSentNow: false,
    plannedPromptKind: 'first_controlled_research_prompt', promptReferenceRequiredBeforeRuntime: true, promptMustHaveOutputContract: true,
    promptMustHaveNoSecrets: true, promptMustHaveNoToolInstructionsOutsidePolicy: true,
    promptMustBeLoggedOnlyAsHashOrSafeSummaryBeforeRuntime: true, futurePromptApprovalGateRequired: true,
  }
  const modelNetworkPolicy: FactoryHermesControlledRuntimeModelNetworkAllowlistPolicy = {
    policyId: `${id}:model-network-allowlist`, provider, model, host, modelCallsAllowedNow: false, networkAllowedNow: false,
    dnsAllowedNow: false, endpointTestsAllowedNow: false, endpointAllowlistRequiredBeforeRuntime: true,
    timeoutRequiredBeforeRuntime: true, retryPolicyRequiredBeforeRuntime: true, rateLimitRequiredBeforeRuntime: true,
    killSwitchRequiredBeforeRuntime: true, hostReferencedButNotTested: true,
  }
  const toolsetRequirements: FactoryHermesControlledRuntimeToolsetDisableProofRequirements = {
    requirementsId: `${id}:toolset-disable-proof`, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    toolsetEnablementAllowedNow: false, directNoToolsetsTextOnlyRejected: true, directHermesCliDefaultsForbidden: true,
    noMcpInsufficientAlone: true, hiddenDefaultsRiskCarriedForward: true, futureRuntimeMustUseWrapperBoundary: true,
    futureRuntimeMustFailIfToolsetsCannotBeProvenDisabled: true, futureRuntimeMustFailIfDefaultToolsetsLoad: true,
    futureRuntimeMustFailIfMcpEnabled: true, futureRuntimeMustFailIfAnyToolUsageAppearsInOutput: true,
    proofArtifactRequiredBeforeRuntime: true, runtimeNoToolModeNotYetProven: true,
  }
  const timeoutEnvelope: FactoryHermesControlledRuntimeTimeoutKillSwitchEnvelope = {
    envelopeId: `${id}:timeout-kill-switch`, processCreatedNow: false, timeoutAppliedNow: false, futureRuntimeTimeoutRequired: true,
    maxRuntimeSeconds: 60, noOutputTimeoutSeconds: 20, killSwitchRequired: true, cancellationSignalRequired: true,
    processTreeKillRequiredIfProcessExistsInFuture: true, runawayOutputLimitRequired: true, maxStdoutBytes: 200000,
    maxStderrBytes: 100000, timeoutMustBlockFindings: true, failureMustBlockFindings: true,
  }
  const outputContract: FactoryHermesControlledRuntimeOutputIngestionContract = {
    contractId: `${id}:output-ingestion-contract`, outputIngestionAllowedNow: false, findingsUseAllowedNow: false,
    futureOutputIngestionRequiresApproval: true, outputMustHaveContract: true, outputMustBeStoredUnderCodexTemp: true,
    outputMustBeRedacted: true, outputMustBeBounded: true, outputMustBeClassifiedBeforeUse: true, findingsRequireReviewGate: true,
    rawOutputMustNotBePromotedToFindingsAutomatically: true, failedRunOutputMustNotBeUsedAsFindings: true,
    timeoutOutputMustNotBeUsedAsFindings: true,
  }
  const riskRegister = buildRiskRegister(id)
  const reviewEnvelope: FactoryHermesControlledRuntimePreparationReviewEnvelope = {
    envelopeId: `${id}:review-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_preparation_review_only',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', sourcePreparationRef: 'controlled-research-runtime-preparation-result.json',
    sourceApprovalRef: 'controlled-research-runtime-approval-result.json',
    targetNextGate: 'Factory Hermes Controlled Research Runtime Preparation Review Gate v1',
    purpose: 'review prepared non-executable runtime artifacts before any live temp config, run root, credentials, prompt, network, model call, toolset, Hermes execution, research execution or findings use',
    allowedInNextGate: ['read controlled-research-runtime-preparation-result.json', 'read controlled-research-runtime-approval-result.json', 'review preparation manifest', 'review virtual temp config candidate', 'review run root path validation', 'review credential reference boundary', 'review prompt reference policy', 'review model/network allowlist policy', 'review toolset disable proof requirements', 'review timeout/kill switch envelope', 'review output ingestion contract', 'decide whether to proceed to a future controlled runtime final approval/preparation step', 'write ignored review artifact'],
    forbiddenEvenInNextGate,
    flags: { preparationReviewAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, tempConfigCreationAllowedNow: false, runRootCreationAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false, canProceedToControlledResearchRuntimePreparationReview: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false },
    recommendedNextGate: 'Factory Hermes Controlled Research Runtime Preparation Review Gate v1',
  }
  const checks = [
    { checkId: 'controlled_runtime_approval_valid', passed: approvalOk, message: 'Controlled runtime approval grants preparation-only flow.' },
    { checkId: 'controlled_runtime_plan_valid', passed: planOk, message: 'Controlled runtime plan contains required policy plans.' },
    { checkId: 'research_runtime_adapter_prepared', passed: adapterOk, message: 'Research runtime adapter is prepared code-only.' },
    { checkId: 'runtime_selection_valid', passed: selectionOk, message: 'Runtime selection is within allowed values.' },
    { checkId: 'live_runtime_surface_absent', passed: !liveSurfaceDetected, message: 'No live runtime surface was created or detected.' },
  ]
  return {
    preparationId: id, preparationKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_KIND,
    preparationVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_VERSION, preparedAt: input.preparedAt,
    preparedBy: input.preparedBy, toolId: 'hermes_agent', controlledRuntimeApprovalRef: approval.approvalId,
    controlledRuntimePlanningRef: plan.planningId, researchRuntimeAdapterRef: adapter.adapterId,
    runtimeSelectionDecisionRef: selectionRecord(selection)?.decisionId || selectionRecord(selection)?.runtimeSelectionDecisionId || plan.runtimeSelectionDecisionRef,
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    ...(prepared ? { controlledRuntimePreparationManifest: manifest, controlledRuntimeVirtualTempConfigCandidate: virtualTempConfig, controlledRuntimeRunRootPathValidationManifest: runRootManifest, controlledRuntimeCredentialReferenceBoundary: credentialBoundary, controlledRuntimePromptReferencePolicy: promptPolicy, controlledRuntimeModelNetworkAllowlistPolicy: modelNetworkPolicy, controlledRuntimeToolsetDisableProofRequirements: toolsetRequirements, controlledRuntimeTimeoutKillSwitchEnvelope: timeoutEnvelope, controlledRuntimeOutputIngestionContract: outputContract, controlledRuntimePreparationRiskRegister: riskRegister, controlledRuntimePreparationReviewEnvelope: reviewEnvelope } : {}),
    controlledResearchRuntimePreparationReceipt: { receiptId: `${id}:receipt`, preparationId: id, toolId: 'hermes_agent', preparedBy: input.preparedBy, preparedAt: input.preparedAt, decision, preparationStatus, scope: 'hermes_controlled_research_runtime_preparation_only', approvedNextGate: prepared ? 'Factory Hermes Controlled Research Runtime Preparation Review Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1', notAuthorizedActions },
    hermesControlledResearchRuntimePreparationResultRecord: { recordId: `${id}:result-record`, preparationStatus, decision, liveRuntimePrepared: false, runtimeExecutionAllowedNow: false, canProceedToControlledResearchRuntimePreparationReview: prepared },
    checks, blockers, warnings: ['config_schema_unknown', 'empty_toolsets_support_unknown', 'hidden_defaults_risk_carried_forward', 'preparation_is_not_execution', 'virtual_temp_config_is_not_live_config', 'run_root_path_is_not_created_directory'].map((message) => ({ warningId: message, message })),
    status, decision, preparationStatus,
    runtimePreparationManifestBuilt: prepared, virtualTempConfigCandidateBuilt: prepared, runRootPathValidationManifestBuilt: prepared,
    credentialReferenceBoundaryPrepared: prepared, promptReferencePolicyPrepared: prepared, modelNetworkAllowlistPrepared: prepared,
    toolsetDisableProofPrepared: prepared, timeoutKillSwitchEnvelopePrepared: prepared, outputIngestionContractPrepared: prepared,
    controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, tempConfigCreatedNow: false, runRootCreatedNow: false,
    promptPassedNow: false, modelCallsMadeNow: false, networkUsedNow: false, credentialValuesReadNow: false,
    toolsetsEnabledNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimePreparationReview: prepared,
    canProceedToControlledResearchRuntimeExecution: false, canProceedToResearchRuntimeAdapterExecution: false,
    canProceedToKeepHermesResearchBlockedDecision: !prepared, canRunResearchNow: false, canExecuteHermesNow: false,
    canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false,
    canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false,
    recommendedNextStep: prepared ? 'Proceed to Factory Hermes Controlled Research Runtime Preparation Review Gate v1; runtime execution remains blocked.' : 'Keep Hermes research blocked or repair preparation inputs.',
  }
}

export function validateFactoryHermesControlledResearchRuntimePreparationInput(input: FactoryHermesControlledResearchRuntimePreparationInput): FactoryHermesControlledResearchRuntimePreparationValidationResult {
  const errors: string[] = []
  if (!input?.preparedAt) errors.push('preparedAt_required')
  if (!input?.preparedBy) errors.push('preparedBy_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimePreparationResult(result: any): FactoryHermesControlledResearchRuntimePreparationValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_prepared', 'controlled_research_runtime_preparation_blocked'].includes(result?.status)) errors.push('invalid_status')
  if (result?.selectedWrapperStrategy !== 'wrapper_temp_config_no_toolsets') errors.push('invalid_wrapper_strategy')
  for (const key of ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'tempConfigCreatedNow', 'runRootCreatedNow', 'promptPassedNow', 'modelCallsMadeNow', 'networkUsedNow', 'credentialValuesReadNow', 'toolsetsEnabledNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  if (result?.status === 'controlled_research_runtime_prepared') {
    for (const key of ['runtimePreparationManifestBuilt', 'virtualTempConfigCandidateBuilt', 'runRootPathValidationManifestBuilt', 'credentialReferenceBoundaryPrepared', 'promptReferencePolicyPrepared', 'modelNetworkAllowlistPrepared', 'toolsetDisableProofPrepared', 'timeoutKillSwitchEnvelopePrepared', 'outputIngestionContractPrepared', 'canProceedToControlledResearchRuntimePreparationReview']) if (result?.[key] !== true) errors.push(`${key}_must_be_true`)
    if (result?.controlledRuntimeVirtualTempConfigCandidate?.fileWritten !== false) errors.push('virtual_temp_config_file_written_must_be_false')
    if (result?.controlledRuntimeRunRootPathValidationManifest?.runRootCreated !== false) errors.push('run_root_created_must_be_false')
  }
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimePreparationResult(result: FactoryHermesControlledResearchRuntimePreparationResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimePreparationResult(text: string): FactoryHermesControlledResearchRuntimePreparationResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimePreparationResult(result: FactoryHermesControlledResearchRuntimePreparationResult): FactoryHermesControlledResearchRuntimePreparationSummary {
  return { preparationId: result.preparationId, status: result.status, decision: result.decision, canProceedToControlledResearchRuntimePreparationReview: result.canProceedToControlledResearchRuntimePreparationReview, canRunResearchNow: result.canRunResearchNow }
}
