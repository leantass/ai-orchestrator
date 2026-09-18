export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PLANNING_KIND = 'factory-hermes-controlled-research-runtime-planning'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PLANNING_VERSION = '1.0'

const limitations = [
  'no_real_hermes_execution_tested',
  'no_model_network_or_provider_tested',
  'config_schema_partially_unknown',
  'empty_toolsets_support_unknown',
  'hidden_defaults_may_still_exist_in_real_cli_runtime',
  'wrapper_verified_only_as_code_boundary',
  'adapter_prepared_only_as_non_executable_boundary',
]

const notAuthorizedActions = [
  'execute_research_now',
  'execute_research_runtime_adapter_now',
  'execute_wrapper_against_hermes_now',
  'create_temp_config_now',
  'create_run_root_now',
  'execute_hermes_now',
  'execute_oneshot_now',
  'pass_prompt_now',
  'call_models_now',
  'use_network_now',
  'read_env_secrets_now',
  'enable_toolsets_now',
  'execute_uv_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
]

export interface FactoryHermesControlledResearchRuntimePlanningInput {
  plannedAt: string
  plannedBy: string
  researchExecutionApprovalResult?: any
  researchRuntimeAdapterResult?: any
  runtimeSelectionDecisionResult?: any
}

export interface FactoryHermesControlledResearchRuntimePlanningValidationResult { ok: boolean, errors: string[] }
export interface FactoryHermesControlledResearchRuntimePlanningSummary { planningId: string, status: string, decision: string, canProceedToControlledResearchRuntimeApproval: boolean, canRunResearchNow: boolean }

export function evaluateFactoryHermesControlledResearchRuntimePlanning(input: FactoryHermesControlledResearchRuntimePlanningInput): any {
  const id = `hermes-controlled-research-runtime-planning:75b300f:${input.plannedAt}`
  const approval = input.researchExecutionApprovalResult || {}
  const adapter = input.researchRuntimeAdapterResult || {}
  const selection = input.runtimeSelectionDecisionResult || {}
  const selectionRecord = selection.runtimeSelectionDecisionRecord || selection
  const selectionOk = selectionRecord?.provider?.providerId === 'openai'
    && selectionRecord?.model?.modelId === 'gpt-4o-mini'
    && selectionRecord?.credential?.credentialRefName === 'OPENAI_API_KEY'
    && selectionRecord?.network?.selectedHosts?.includes('api.openai.com')
    && String(selectionRecord?.runRoot?.selectedRunRoot || '').includes('.codex-temp')
  const approvalOk = approval.status === 'research_execution_approval_granted'
    && approval.decision === 'hermes_research_execution_approval_granted_for_controlled_runtime_planning'
    && approval.executionApprovalStatus === 'approved_for_controlled_runtime_planning_only'
    && approval.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && approval.controlledResearchRuntimePlanningAllowed === true
    && approval.canProceedToControlledResearchRuntimePlanning === true
    && approval.canRunResearchNow === false
  const adapterOk = adapter.status === 'research_runtime_adapter_prepared'
    && adapter.adapterStatus === 'prepared_code_only_not_executed'
    && adapter.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && adapter.wrapperBoundaryIntegrated === true
    && adapter.adapterCommandEnvelopeBuilt === true
    && adapter.adapterSafetyManifestBuilt === true
    && adapter.canRunResearchNow === false
  const blockers = [
    ...(!approvalOk ? [{ blockerId: 'research_execution_approval_not_granted', message: 'Research execution approval does not allow controlled runtime planning.' }] : []),
    ...(!adapterOk ? [{ blockerId: 'research_runtime_adapter_not_prepared', message: 'Research runtime adapter is not prepared.' }] : []),
    ...(!selectionOk ? [{ blockerId: 'runtime_selection_invalid', message: 'Runtime selection decision is incomplete.' }] : []),
  ]
  const created = blockers.length === 0
  const status = created ? 'controlled_research_runtime_plan_created' : 'controlled_research_runtime_plan_blocked'
  const decision = created ? 'hermes_controlled_research_runtime_plan_created_for_approval' : 'hermes_controlled_research_runtime_plan_blocked_unsafe_runtime_surface'
  const runtimeId = 'hermes-first-controlled-runtime-001'
  const boundary = {
    planId: `${id}:boundary-plan`, toolId: 'hermes_agent', selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', provider: 'openai', model: 'gpt-4o-mini', credentialRef: 'OPENAI_API_KEY', host: 'api.openai.com', plannedRuntimeMode: 'controlled_first_research_runtime',
    runtimeExecutionAllowedNow: false, adapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, wrapperExecutionAllowedNow: false, researchExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false,
    notes: ['runtime planning only', 'no execution in this gate', 'all execution-affecting operations require future explicit approval'],
  }
  const temp = { tempConfigCreationAllowedNow: false, futureTempConfigCreationRequiresApproval: true, plannedTempConfigRoot: `.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode/${runtimeId}/`, plannedTempConfigFile: 'config.yaml', configMustBeGeneratedUnderCodexTemp: true, configMustNotContainSecrets: true, configMustNotContainCredentialValues: true, configMustNotContainEnvDump: true, configMustNotUseProjectRoot: true, configMustNotModifyHermesSource: true, configMustDisableOrEmptyCliToolsets: true, configMustDisableMcp: true, configMustAvoidHiddenDefaults: true, configMustBeReferencedExplicitlyByWrapper: true, configValidationRequiredBeforeRuntime: true, exactConfigSchemaKnown: 'unknown', emptyToolsetsInConfigSupported: 'unknown', runnableModeAllowed: false, futureTempConfigApprovalGateRequired: true, futureVerificationArtifactRequiredBeforeRuntime: true }
  const runRoot = { runRootCreationAllowedNow: false, futureRunRootCreationRequiresApproval: true, plannedRunRoot: '.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001/', runRootMustBeUnderCodexTemp: true, runRootMustNotOverwriteExistingData: true, runRootMustNotContainSecrets: true, runRootMustHaveManifestBeforeUse: true, runRootMustHaveCleanupOrRetentionPolicy: true, runRootMustBeDeniedIfPathEscapesCodexTemp: true, filesystemMutationPolicyRequiredBeforeRuntime: true }
  const credential = { credentialAccessAllowedNow: false, envSecretReadAllowedNow: false, credentialRef: 'OPENAI_API_KEY', credentialValueReadNow: false, futureCredentialAccessRequiresApproval: true, futureCredentialAccessMustUseRefOnlyUntilRuntime: true, futureCredentialAccessMustNotLogValue: true, futureCredentialAccessMustNotWriteValueToArtifact: true, futureCredentialAccessMustNotDumpEnv: true, futureCredentialAccessMustBeScopedToProviderOnly: true, futureCredentialAccessMustHaveRedactionPolicy: true, futureCredentialAccessMustHavePostRunSecretAudit: true, dotEnvReadForbidden: true, processEnvReadForbiddenInPlanning: true, credentialValuesForbiddenInArtifacts: true, credentialValuesForbiddenInStdout: true }
  const prompt = { promptPassingAllowedNow: false, futurePromptPassingRequiresApproval: true, plannedPromptKind: 'first_controlled_research_prompt', promptMustBeStaticOrApprovedArtifact: true, promptMustBeIncludedByReferenceBeforeRuntime: true, promptMustHaveOutputContract: true, promptMustHaveNoSecrets: true, promptMustHaveNoToolInstructionsOutsidePolicy: true, promptMustBeLoggedOnlyAsHashOrSafeSummaryBeforeRuntime: true, futurePromptApprovalGateRequired: true, exactPromptDefinedInFutureGate: true }
  const network = { modelCallsAllowedNow: false, networkAllowedNow: false, dnsAllowedNow: false, endpointTestsAllowedNow: false, provider: 'openai', model: 'gpt-4o-mini', host: 'api.openai.com', futureModelCallRequiresApproval: true, futureNetworkUseRequiresApproval: true, futureDnsResolutionRequiresApproval: true, futureEndpointAllowlistRequired: true, futureTimeoutRequired: true, futureRetryPolicyRequired: true, futureRateLimitRequired: true, futureKillSwitchRequired: true, hostIsSelectionReferenceOnly: true }
  const toolsets = { toolsetEnablementAllowedNow: false, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', directNoToolsetsTextOnlyRejected: true, directHermesCliDefaultsForbidden: true, hiddenDefaultsRiskCarriedForward: true, noMcpInsufficientAlone: true, futureRuntimeMustUseWrapperBoundary: true, futureRuntimeMustFailIfToolsetsCannotBeProvenDisabled: true, futureRuntimeMustFailIfDefaultToolsetsLoad: true, futureRuntimeMustFailIfMcpEnabled: true, futureRuntimeMustFailIfAnyToolUsageAppearsInOutput: true, futureToolsetVerificationArtifactRequired: true, runtimeNoToolModeNotYetProven: true }
  const timeout = { timeoutKillSwitchPolicyPlanned: true, futureRuntimeTimeoutRequired: true, suggestedMaxRuntimeSeconds: 60, suggestedNoOutputTimeoutSeconds: 20, killSwitchRequired: true, cancellationSignalRequired: true, processTreeKillRequiredIfProcessExistsInFuture: true, runawayOutputLimitRequired: true, maxStdoutBytesSuggested: 200000, maxStderrBytesSuggested: 100000, failureMustBlockFindings: true, timeoutMustBlockFindings: true, processCreatedNow: false, processKillNow: false }
  const output = { outputIngestionAllowedNow: false, findingsUseAllowedNow: false, futureOutputIngestionRequiresApproval: true, futureOutputMustHaveContract: true, futureOutputMustBeStoredUnderCodexTemp: true, futureOutputMustBeRedacted: true, futureOutputMustBeBounded: true, futureOutputMustBeClassifiedBeforeUse: true, futureFindingsRequireReviewGate: true, rawOutputMustNotBePromotedToFindingsAutomatically: true, failedRunOutputMustNotBeUsedAsFindings: true, timeoutOutputMustNotBeUsedAsFindings: true }
  const riskIds = ['planning_confused_with_runtime_execution', 'temp_config_created_too_early', 'run_root_created_too_early', 'credential_value_read_too_early', 'prompt_sent_too_early', 'network_enabled_too_early', 'model_called_too_early', 'toolsets_enabled_too_early', 'hidden_defaults_loaded_in_real_runtime', 'config_schema_unknown_blocks_confidence', 'empty_toolsets_unknown_blocks_confidence', 'runaway_process_future', 'raw_output_promoted_without_review', 'findings_used_without_ingestion_review']
  const riskRegister = { registerId: `${id}:risk-register`, risks: riskIds.map((riskId) => ({ riskId, severity: ['planning_confused_with_runtime_execution', 'hidden_defaults_loaded_in_real_runtime'].includes(riskId) ? 'critical' : 'high', disposition: 'accepted_for_runtime_planning_only', mitigation: 'Require future gate control before any runtime-affecting action.', blocksControlledRuntimePlanning: false, blocksRuntimeExecution: true, blocksResearchExecution: true })) }
  const envelope = { envelopeId: `${id}:approval-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_approval_only', selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', sourcePlanningRef: 'controlled-research-runtime-planning-result.json', sourceExecutionApprovalRef: 'research-execution-approval-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Approval Gate v1', purpose: 'approve or block the future controlled runtime plan before any temp config, run root, prompt, credentials, network, model call, Hermes execution, or research execution', allowedInNextGate: ['read controlled-research-runtime-planning-result.json', 'read research-execution-approval-result.json', 'evaluate controlled runtime plan completeness', 'decide approved/blocked for controlled runtime preparation only', 'write ignored approval artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'create live temp config', 'create run root', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'enable actual toolsets', 'execute research', 'ingest real output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], flags: { controlledRuntimeApprovalAllowedNow: true, controlledRuntimePreparationAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, tempConfigCreationAllowedNow: false, runRootCreationAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false, canProceedToControlledResearchRuntimeApproval: true, canProceedToControlledResearchRuntimePreparation: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Approval Gate v1' }
  const receipt = { receiptId: `${id}:receipt`, planningId: id, toolId: 'hermes_agent', plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision, runtimePlanningStatus: created ? 'plan_candidate_created' : 'blocked', scope: 'hermes_controlled_research_runtime_planning_only', approvedNextGate: created ? 'Factory Hermes Controlled Research Runtime Approval Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1', limitations, notAuthorizedActions }
  return {
    planningId: id, planningKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PLANNING_KIND, planningVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent',
    researchExecutionApprovalRef: approval.approvalId, researchRuntimeAdapterRef: adapter.adapterId, runtimeSelectionDecisionRef: selection.decisionId, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    controlledRuntimeBoundaryPlan: boundary, controlledRuntimeTempConfigPolicyPlan: temp, controlledRuntimeRunRootPolicyPlan: runRoot, controlledRuntimeCredentialAccessPolicyPlan: credential, controlledRuntimePromptPassingPolicyPlan: prompt, controlledRuntimeModelNetworkPolicyPlan: network, controlledRuntimeToolsetDisablePolicyPlan: toolsets, controlledRuntimeTimeoutKillSwitchPolicyPlan: timeout, controlledRuntimeOutputIngestionPolicyPlan: output, controlledRuntimeRiskRegister: riskRegister, controlledResearchRuntimeApprovalEnvelope: envelope, controlledResearchRuntimePlanningReceipt: receipt,
    hermesControlledResearchRuntimePlanCandidate: { candidateId: `${id}:candidate`, runtimeId, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', boundaryPlanId: boundary.planId, approvalEnvelopeId: envelope.envelopeId, executionAllowedNow: false },
    checks: [{ checkId: 'research_execution_approval_granted', passed: approvalOk, message: 'Research execution approval grants planning.' }, { checkId: 'adapter_prepared', passed: adapterOk, message: 'Adapter prepared.' }, { checkId: 'runtime_selection_valid', passed: selectionOk, message: 'Runtime selection valid.' }],
    blockers, warnings: limitations.map((message) => ({ warningId: message, message })), status, decision, runtimePlanningStatus: created ? 'plan_candidate_created' : 'blocked',
    controlledRuntimeBoundaryPlanned: created, tempConfigPolicyPlanned: created, runRootPolicyPlanned: created, credentialAccessPolicyPlanned: created, promptPassingPolicyPlanned: created, modelNetworkPolicyPlanned: created, toolsetDisablePolicyPlanned: created, timeoutKillSwitchPolicyPlanned: created, outputIngestionPolicyPlanned: created,
    tempConfigCreationAllowedNow: false, runRootCreationAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false,
    canProceedToControlledResearchRuntimeApproval: created, canProceedToControlledResearchRuntimePreparation: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToResearchRuntimeAdapterExecution: false, canProceedToKeepHermesResearchBlockedDecision: !created, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false,
    recommendedNextStep: created ? 'Proceed to Factory Hermes Controlled Research Runtime Approval Gate v1; runtime execution remains blocked.' : 'Keep Hermes research blocked or repair planning evidence.',
  }
}

export function validateFactoryHermesControlledResearchRuntimePlanningInput(input: FactoryHermesControlledResearchRuntimePlanningInput): FactoryHermesControlledResearchRuntimePlanningValidationResult {
  const errors: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt_required')
  if (!input?.plannedBy) errors.push('plannedBy_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimePlanningResult(result: any): FactoryHermesControlledResearchRuntimePlanningValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_plan_created', 'controlled_research_runtime_plan_blocked'].includes(result?.status)) errors.push('invalid_status')
  if (result?.selectedWrapperStrategy !== 'wrapper_temp_config_no_toolsets') errors.push('invalid_wrapper_strategy')
  for (const key of ['tempConfigCreationAllowedNow', 'runRootCreationAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseAllowedNow', 'canProceedToControlledResearchRuntimePreparation', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimePlanningResult(result: any): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimePlanningResult(text: string): any { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimePlanningResult(result: any): FactoryHermesControlledResearchRuntimePlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, canProceedToControlledResearchRuntimeApproval: result.canProceedToControlledResearchRuntimeApproval, canRunResearchNow: result.canRunResearchNow }
}
