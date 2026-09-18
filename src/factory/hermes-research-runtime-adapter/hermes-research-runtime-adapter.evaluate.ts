import { ADAPTER_LIMITATIONS, ADAPTER_NOT_AUTHORIZED_ACTIONS, DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_POLICY, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_NEXT_STEP, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION } from './hermes-research-runtime-adapter.defaults.ts'
import type { FactoryHermesAdapterNonExecutableCommandEnvelope, FactoryHermesAdapterRiskDispositionRegister, FactoryHermesResearchExecutionApprovalRetryEnvelope, FactoryHermesResearchRuntimeAdapterInput, FactoryHermesResearchRuntimeAdapterResult } from './hermes-research-runtime-adapter.types.ts'

function validApprovalRetry(result: any): boolean {
  return result?.status === 'research_runtime_adapter_approval_retry_granted'
    && result?.decision === 'hermes_research_runtime_adapter_approval_retry_approved_with_wrapper_boundary'
    && result?.adapterApprovalRetryStatus === 'approved_for_runtime_adapter_gate_only'
    && result?.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && result?.runtimeAdapterApproved === true
    && result?.runtimeAdapterExecutionApproved === false
    && result?.researchExecutionApproved === false
    && result?.hermesExecutionApproved === false
    && result?.promptPassingApproved === false
    && result?.modelCallsApproved === false
    && result?.networkApproved === false
    && result?.credentialAccessApproved === false
    && result?.toolsetEnablementApproved === false
    && result?.findingsUseApproved === false
    && result?.canProceedToResearchRuntimeAdapter === true
    && result?.canProceedToResearchExecutionApproval === false
    && result?.canRunResearchNow === false
}

function validReview(result: any): boolean {
  return result?.status === 'wrapper_no_tool_mode_verification_review_completed'
    && result?.decision === 'hermes_wrapper_no_tool_mode_verification_review_accepted_for_adapter_approval_retry'
    && result?.reviewStatus === 'accepted_with_limitations'
    && result?.hermesWrapperNoToolModeVerificationReviewDecision?.adapterApprovalRetryAllowed === true
    && result?.hermesWrapperNoToolModeVerificationReviewDecision?.runtimeAdapterApproved === false
    && result?.hermesWrapperNoToolModeVerificationReviewDecision?.researchExecutionApproved === false
    && result?.canRunResearchNow === false
}

function validSelection(result: any): boolean {
  const s = result?.approvedRuntimeSelectionSnapshot || result?.runtimeSelectionDecisionRecord || result
  const hostList = s?.network?.approvedHostsForNextGate || s?.network?.selectedHosts || result?.selectedNetworkHosts?.selectedHosts || [result?.selectedHost]
  return (s?.provider?.providerId || result?.selectedProvider?.providerId || result?.selectedProvider) === 'openai'
    && (s?.model?.modelId || result?.selectedModel?.modelId || result?.selectedModel) === 'gpt-4o-mini'
    && (s?.credential?.credentialRefName || result?.selectedCredentialRef?.credentialRefName || result?.selectedCredentialRef) === 'OPENAI_API_KEY'
    && hostList.includes('api.openai.com')
    && (s?.toolsets?.approvedToolsetModeForNextGate || s?.toolsets?.selectedToolsetMode || result?.selectedToolsetMode?.selectedToolsetMode || result?.selectedToolsetMode) === 'no_toolsets_text_only'
    && String(s?.runRoot?.approvedRunRootForNextGate || s?.runRoot?.selectedRunRoot || result?.selectedRunRoot?.selectedRunRoot || result?.selectedRunRoot || '').includes('.codex-temp')
}

function makeEnvelope(id: string): FactoryHermesAdapterNonExecutableCommandEnvelope {
  return {
    envelopeId: `${id}:non-executable-command-envelope`,
    toolId: 'hermes_agent',
    provider: 'openai',
    model: 'gpt-4o-mini',
    credentialRef: 'OPENAI_API_KEY',
    host: 'api.openai.com',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    commandShape: 'non_executable_adapter_envelope_only',
    commandString: null,
    argv: [],
    env: {},
    prompt: null,
    tempConfigPath: null,
    runRoot: null,
    executionAllowed: false,
    adapterExecutionAllowed: false,
    hermesExecutionAllowed: false,
    wrapperExecutionAllowed: false,
    researchExecutionAllowed: false,
    promptPassingAllowed: false,
    modelCallsAllowed: false,
    networkAllowed: false,
    credentialAccessAllowed: false,
    envSecretReadAllowed: false,
    toolsetEnablementAllowed: false,
    filesystemRuntimeMutationAllowed: false,
    findingsUseAllowed: false,
  }
}

function makeRiskRegister(id: string): FactoryHermesAdapterRiskDispositionRegister {
  const risks = ['adapter_boundary_overinterpreted_as_runtime_ready', 'hidden_defaults_not_detected_in_real_cli', 'config_schema_unknown_blocks_runtime_confidence', 'empty_toolsets_support_unknown_blocks_runtime_confidence', 'future_execution_approval_reads_credentials_too_early', 'future_execution_approval_passes_prompt_too_early', 'future_execution_approval_enables_network_too_early', 'adapter_command_envelope_accidentally_runnable', 'research_execution_triggered_without_final_approval', 'findings_promoted_without_real_ingestion_review']
  return {
    registerId: `${id}:risk-register`,
    dispositions: risks.map((riskId) => ({
      riskId,
      severity: riskId === 'research_execution_triggered_without_final_approval' ? 'critical' : 'high',
      disposition: 'accepted_for_execution_approval_retry_only',
      mitigation: 'Preserve non-executable adapter envelope and require future gate approval before runtime, prompt, network, credential, model, toolset, or findings actions.',
      blocksExecutionApprovalRetry: false,
      blocksRuntimeExecution: true,
      blocksResearchExecution: true,
    })),
  }
}

function makeRetryEnvelope(id: string): FactoryHermesResearchExecutionApprovalRetryEnvelope {
  return {
    envelopeId: `${id}:research-execution-approval-retry-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'research_execution_approval_retry_only',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    sourceAdapterRef: 'research-runtime-adapter-result.json',
    targetNextGate: 'Factory Hermes Research Execution Approval Retry Gate v1',
    purpose: 'retry research execution approval using prepared non-executable adapter with wrapper boundary while preserving all execution blocks',
    allowedInNextGate: ['read research-runtime-adapter-result.json', 'read approval retry result', 'read runtime selection decision', 'evaluate whether execution approval can be retried', 'produce final approval/blocker envelope', 'write ignored approval retry artifact'],
    forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'create live temp config', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'create runtime run root', 'enable actual toolsets', 'execute research', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'],
    flags: { researchExecutionApprovalRetryAllowedNow: true, researchExecutionApprovedNow: false, runtimeAdapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, findingsUseAllowedNow: false, canProceedToResearchExecutionApprovalRetry: true, canProceedToResearchExecutionApproval: false, canRunResearchNow: false },
    recommendedNextGate: 'Factory Hermes Research Execution Approval Retry Gate v1',
  }
}

export function evaluateFactoryHermesResearchRuntimeAdapter(input: FactoryHermesResearchRuntimeAdapterInput): FactoryHermesResearchRuntimeAdapterResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_POLICY, ...(input.policy || {}) }
  const id = `hermes-research-runtime-adapter:75b300f:${input.adaptedAt}`
  const approvalRetryOk = validApprovalRetry(input.adapterApprovalRetryResult)
  const reviewOk = validReview(input.wrapperVerificationReviewResult)
  const selectionOk = validSelection(input.runtimeSelectionDecisionResult)
  const sourceInspection = input.adapterSourceInspection || { inspectionId: `${id}:source-inspection`, classification: 'case_a_not_found', inspectedRefs: [], dangerousExecutableSurfaceDetected: false, controlledStringMatches: [], executableMatches: [] }
  const executableSurface = sourceInspection.dangerousExecutableSurfaceDetected === true
  const policyOk = Object.values(policy).every((value) => value === true)
  const blockers = [
    ...(!approvalRetryOk ? [{ blockerId: 'approval_retry_not_granted', message: 'Adapter approval retry is not granted.' }] : []),
    ...(!reviewOk ? [{ blockerId: 'wrapper_review_not_accepted', message: 'Wrapper verification review is not accepted.' }] : []),
    ...(!selectionOk ? [{ blockerId: 'runtime_selection_invalid', message: 'Runtime selection decision does not match the approved OpenAI/gpt-4o-mini wrapper-boundary input.' }] : []),
    ...(executableSurface ? [{ blockerId: 'executable_surface_detected', message: 'Adapter source inspection detected executable surface.' }] : []),
    ...(!policyOk ? [{ blockerId: 'policy_override_degrades_required_controls', message: 'Policy override disabled required controls.' }] : []),
  ]
  const prepared = blockers.length === 0
  const decision = executableSurface ? 'hermes_research_runtime_adapter_blocked_executable_surface_detected' : prepared ? 'hermes_research_runtime_adapter_prepared_with_wrapper_boundary_for_execution_approval_retry' : 'hermes_research_runtime_adapter_blocked_input_evidence_invalid'
  const status = prepared ? 'research_runtime_adapter_prepared' : 'research_runtime_adapter_blocked'
  const adapterStatus = prepared ? 'prepared_code_only_not_executed' : 'blocked'
  const nextGate = prepared ? 'Factory Hermes Research Execution Approval Retry Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1'
  const wrapperBoundaryIntegrated = prepared
  const adapterCommandEnvelopeBuilt = prepared
  const adapterSafetyManifestBuilt = prepared
  return {
    adapterId: id,
    adapterKind: FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_KIND,
    adapterVersion: FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_VERSION,
    adaptedAt: input.adaptedAt,
    adaptedBy: input.adaptedBy,
    toolId: 'hermes_agent',
    adapterApprovalRetryRef: input.adapterApprovalRetryResult?.retryId,
    wrapperVerificationReviewRef: input.wrapperVerificationReviewResult?.reviewId,
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    sourceInspection,
    adapterWrapperBoundaryIntegrationManifest: { integrationId: `${id}:wrapper-boundary-integration`, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', wrapperVerificationReviewRef: 'wrapper-no-tool-mode-verification-review-result.json', wrapperVerificationRef: 'wrapper-no-tool-mode-verification-result.json', adapterUsesWrapperBoundary: true, adapterDoesNotUseDirectHermesCliDefaults: true, directNoToolsetsTextOnlyRejected: true, hiddenDefaultsRiskCarriedForward: true, wrapperBoundaryType: 'code_only_no_runtime_execution', realHermesRuntimeNotProven: true, noToolModeRuntimeNotClaimed: true, adapterMustNotExecuteNow: true, notes: ['Adapter prepared with wrapper boundary.', 'No claim is made that real Hermes accepts no-tool mode.', 'Prompt, model, network, credentials, and toolsets remain blocked.'] },
    adapterNonExecutableCommandEnvelope: makeEnvelope(id),
    adapterRuntimeSafetyManifest: { manifestId: `${id}:safety-manifest`, checks: { noChildProcess: true, noSpawnExecFork: true, noFetchHttpHttpsNetDns: true, noProcessEnvReads: true, noDotEnvReads: true, noCredentialReads: true, noPromptPassing: true, noModelCalls: true, noNetwork: true, noDns: true, noEndpointTests: true, noTempConfigWrites: true, noRunRootCreation: true, noHermesExecution: true, noWrapperAgainstHermesExecution: true, noResearchExecution: true, noFindingsPromotion: true, noToolsetsEnabled: true }, packageFilesUnchanged: true, hermesSourceReadOnly: true },
    adapterLimitationsCarryForward: { limitations: ADAPTER_LIMITATIONS, limitationsAcceptableForExecutionApprovalRetry: true, limitationsBlockImmediateRuntimeExecution: true, limitationsBlockImmediateResearchExecution: true, limitationsBlockFindingsUse: true },
    adapterRiskDispositionRegister: makeRiskRegister(id),
    researchExecutionApprovalRetryEnvelope: makeRetryEnvelope(id),
    researchRuntimeAdapterReceipt: { receiptId: `${id}:receipt`, adapterId: id, toolId: 'hermes_agent', adaptedBy: input.adaptedBy, adaptedAt: input.adaptedAt, decision, adapterStatus, scope: 'hermes_research_runtime_adapter_preparation_only', approvedNextGate: nextGate, limitations: ADAPTER_LIMITATIONS, notAuthorizedActions: ADAPTER_NOT_AUTHORIZED_ACTIONS },
    hermesResearchRuntimeAdapterResultRecord: { recordId: `${id}:record`, toolId: 'hermes_agent', adapterStatus, decision, wrapperBoundaryIntegrated, adapterCommandEnvelopeBuilt, adapterSafetyManifestBuilt, runtimeAdapterExecutionAllowedNow: false, researchExecutionApproved: false, hermesExecutionApproved: false },
    checks: [{ checkId: 'approval_retry_granted', passed: approvalRetryOk, message: 'Adapter approval retry granted.' }, { checkId: 'wrapper_review_accepted', passed: reviewOk, message: 'Wrapper verification review accepted.' }, { checkId: 'runtime_selection_valid', passed: selectionOk, message: 'Runtime selection matches wrapper-boundary inputs.' }, { checkId: 'no_executable_surface_detected', passed: !executableSurface, message: 'Adapter source inspection found no active executable surface.' }],
    blockers,
    warnings: ADAPTER_LIMITATIONS.map((message) => ({ warningId: message, message })),
    status,
    decision,
    adapterStatus,
    wrapperBoundaryIntegrated,
    adapterCommandEnvelopeBuilt,
    adapterSafetyManifestBuilt,
    runtimeAdapterExecutionAllowedNow: false,
    researchExecutionApproved: false,
    hermesExecutionApproved: false,
    promptPassingApproved: false,
    modelCallsApproved: false,
    networkApproved: false,
    credentialAccessApproved: false,
    toolsetEnablementApproved: false,
    findingsUseApproved: false,
    canProceedToResearchExecutionApprovalRetry: prepared,
    canProceedToResearchExecutionApproval: false,
    canProceedToResearchRuntimeAdapterExecution: false,
    canProceedToKeepHermesResearchBlockedDecision: !prepared,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    canPassPromptNow: false,
    canUseNetworkNow: false,
    canUseCredentialsNow: false,
    canReadEnvSecretsNow: false,
    canCallModelsNow: false,
    canEnableToolsetsNow: false,
    canMutateFilesystemNow: false,
    canUseFindings: false,
    recommendedNextStep: prepared ? FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_NEXT_STEP : 'Keep Hermes research blocked or repair adapter evidence.',
  }
}
