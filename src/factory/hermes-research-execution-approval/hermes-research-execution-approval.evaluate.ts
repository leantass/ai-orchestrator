import { DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_POLICY, EXECUTION_APPROVAL_LIMITATIONS, EXECUTION_APPROVAL_NOT_AUTHORIZED_ACTIONS, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_VERSION } from './hermes-research-execution-approval.defaults.ts'
import type { FactoryHermesControlledResearchRuntimePlanningEnvelope, FactoryHermesExecutionReadinessReview, FactoryHermesExecutionApprovalRiskDispositionRegister, FactoryHermesResearchExecutionApprovalBlockerPlan, FactoryHermesResearchExecutionApprovalInput, FactoryHermesResearchExecutionApprovalResult } from './hermes-research-execution-approval.types.ts'

function validRetry(result: any): boolean {
  return result?.status === 'research_execution_approval_retry_granted'
    && result?.decision === 'hermes_research_execution_approval_retry_approved_for_final_execution_approval_gate'
    && result?.executionApprovalRetryStatus === 'approved_for_research_execution_approval_gate_only'
    && result?.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && result?.researchExecutionApprovalGateAllowed === true
    && result?.researchExecutionApprovedNow === false
    && result?.runtimeAdapterExecutionAllowedNow === false
    && result?.hermesExecutionAllowedNow === false
    && result?.promptPassingAllowedNow === false
    && result?.modelCallsAllowedNow === false
    && result?.networkAllowedNow === false
    && result?.credentialAccessAllowedNow === false
    && result?.toolsetEnablementAllowedNow === false
    && result?.findingsUseAllowedNow === false
    && result?.canProceedToResearchExecutionApproval === true
    && result?.canProceedToResearchRuntimeAdapterExecution === false
    && result?.canRunResearchNow === false
}

function validAdapter(adapter: any): boolean {
  return adapter?.status === 'research_runtime_adapter_prepared'
    && adapter?.decision === 'hermes_research_runtime_adapter_prepared_with_wrapper_boundary_for_execution_approval_retry'
    && adapter?.adapterStatus === 'prepared_code_only_not_executed'
    && adapter?.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && adapter?.wrapperBoundaryIntegrated === true
    && adapter?.adapterCommandEnvelopeBuilt === true
    && adapter?.adapterSafetyManifestBuilt === true
    && adapter?.runtimeAdapterExecutionAllowedNow === false
    && adapter?.researchExecutionApproved === false
    && adapter?.hermesExecutionApproved === false
    && adapter?.promptPassingApproved === false
    && adapter?.modelCallsApproved === false
    && adapter?.networkApproved === false
    && adapter?.credentialAccessApproved === false
    && adapter?.toolsetEnablementApproved === false
    && adapter?.findingsUseApproved === false
    && adapter?.canProceedToResearchExecutionApprovalRetry === true
    && adapter?.canProceedToResearchExecutionApproval === false
    && adapter?.canProceedToResearchRuntimeAdapterExecution === false
    && adapter?.canRunResearchNow === false
}

function validReview(review: any): boolean {
  return review?.status === 'wrapper_no_tool_mode_verification_review_completed'
    && review?.decision === 'hermes_wrapper_no_tool_mode_verification_review_accepted_for_adapter_approval_retry'
    && review?.reviewStatus === 'accepted_with_limitations'
    && review?.hermesWrapperNoToolModeVerificationReviewDecision?.adapterApprovalRetryAllowed === true
    && review?.hermesWrapperNoToolModeVerificationReviewDecision?.runtimeAdapterApproved === false
    && review?.hermesWrapperNoToolModeVerificationReviewDecision?.researchExecutionApproved === false
    && review?.canRunResearchNow === false
}

function validSelection(result: any): boolean {
  const s = result?.runtimeSelectionDecisionRecord || result
  const hosts = s?.network?.selectedHosts || result?.selectedNetworkHosts?.selectedHosts || []
  return (s?.provider?.providerId || result?.selectedProvider?.providerId) === 'openai'
    && (s?.model?.modelId || result?.selectedModel?.modelId) === 'gpt-4o-mini'
    && (s?.credential?.credentialRefName || result?.selectedCredentialRef?.credentialRefName) === 'OPENAI_API_KEY'
    && hosts.includes('api.openai.com')
    && String(s?.runRoot?.selectedRunRoot || result?.selectedRunRoot?.selectedRunRoot || '').includes('.codex-temp')
}

function makeReadiness(input: FactoryHermesResearchExecutionApprovalInput, ok: boolean): FactoryHermesExecutionReadinessReview {
  return {
    researchExecutionApprovalRetryGranted: validRetry(input.researchExecutionApprovalRetryResult),
    researchRuntimeAdapterPrepared: validAdapter(input.researchRuntimeAdapterResult),
    adapterPreparedCodeOnly: input.researchRuntimeAdapterResult?.adapterStatus === 'prepared_code_only_not_executed',
    wrapperBoundaryIntegrated: input.researchRuntimeAdapterResult?.wrapperBoundaryIntegrated === true,
    adapterCommandEnvelopeNonExecutable: input.researchRuntimeAdapterResult?.adapterNonExecutableCommandEnvelope?.commandString === null,
    adapterSafetyManifestPresent: Boolean(input.researchRuntimeAdapterResult?.adapterRuntimeSafetyManifest),
    wrapperVerificationReviewAccepted: validReview(input.wrapperVerificationReviewResult),
    runtimeSelectionKnown: validSelection(input.runtimeSelectionDecisionResult),
    provider: 'openai',
    model: 'gpt-4o-mini',
    credentialRef: 'OPENAI_API_KEY',
    host: 'api.openai.com',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    noLiveTempConfig: true,
    noRunRootCreated: true,
    noPromptAvailableForExecution: true,
    noCredentialValuesAvailable: true,
    noNetworkApproved: true,
    noModelCallsApproved: true,
    noToolsetsApproved: true,
    evidenceSupportsControlledRuntimePlanning: ok,
    evidenceDoesNotApproveImmediateExecution: true,
    readinessSummary: ['Immediate execution is not approved.', 'Only controlled runtime planning is allowed.', 'Prompt, model, network, credentials, and toolsets remain separate future approvals.'],
  }
}

function makeRisks(id: string): FactoryHermesExecutionApprovalRiskDispositionRegister {
  const risks = ['execution_approval_confused_with_immediate_runtime', 'controlled_runtime_planning_auto_executes_by_mistake', 'hidden_defaults_not_detected_in_real_cli', 'config_schema_unknown_blocks_runtime_confidence', 'empty_toolsets_support_unknown_blocks_runtime_confidence', 'credential_access_approved_too_early', 'prompt_passing_approved_too_early', 'network_approved_too_early', 'toolsets_enabled_too_early', 'run_root_created_too_early', 'temp_config_created_too_early', 'research_execution_triggered_without_final_human_approval', 'findings_promoted_without_real_ingestion_review']
  return { registerId: `${id}:risk-register`, dispositions: risks.map((riskId) => ({ riskId, severity: ['controlled_runtime_planning_auto_executes_by_mistake', 'research_execution_triggered_without_final_human_approval'].includes(riskId) ? 'critical' : 'high', disposition: 'accepted_for_controlled_runtime_planning_only', mitigation: 'Carry planning-only envelope and require future gate control before any runtime, prompt, network, credential, model, toolset, temp config, run root, or findings action.', blocksControlledRuntimePlanning: false, blocksImmediateRuntimeExecution: true, blocksResearchExecution: true })) }
}

function makeEnvelope(id: string): FactoryHermesControlledResearchRuntimePlanningEnvelope {
  return {
    envelopeId: `${id}:controlled-runtime-planning-envelope`,
    toolId: 'hermes_agent',
    approvedFor: 'controlled_research_runtime_planning_only',
    selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    sourceExecutionApprovalRef: 'research-execution-approval-result.json',
    sourceAdapterRef: 'research-runtime-adapter-result.json',
    targetNextGate: 'Factory Hermes Controlled Research Runtime Planning Gate v1',
    purpose: 'plan the first controlled Hermes research runtime using prepared adapter and wrapper boundary while keeping actual execution blocked',
    allowedInNextGate: ['read research-execution-approval-result.json', 'read research-runtime-adapter-result.json', 'read runtime-selection-decision-result.json', 'plan temp config creation policy', 'plan run root creation policy', 'plan credential access policy without reading values', 'plan prompt passing policy without sending prompt', 'plan model/network use policy without calls', 'plan toolset disable verification strategy', 'plan runtime kill switch and timeout', 'produce controlled runtime plan artifact', 'write ignored planning artifact'],
    forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'create live temp config', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'create runtime run root', 'enable actual toolsets', 'execute research', 'ingest real output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'],
    flags: { controlledRuntimePlanningAllowedNow: true, researchExecutionApprovedNow: false, runtimeAdapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, tempConfigCreationAllowedNow: false, runRootCreationAllowedNow: false, findingsUseAllowedNow: false, canProceedToControlledResearchRuntimePlanning: true, canProceedToResearchRuntimeAdapterExecution: false, canRunResearchNow: false },
    recommendedNextGate: 'Factory Hermes Controlled Research Runtime Planning Gate v1',
  }
}

function makeBlockerPlan(id: string, blockers: string[]): FactoryHermesResearchExecutionApprovalBlockerPlan {
  return { blockerPlanId: `${id}:blocker-plan`, toolId: 'hermes_agent', blockerType: 'execution_approval_evidence_incomplete_or_unsafe', blockers, resolutionOptions: ['Return to Research Execution Approval Retry Gate', 'Return to Research Runtime Adapter Gate', 'Return to Wrapper Verification Review Gate', 'Keep Hermes research blocked', 'Change research provider/tool'], recommendedConservativeNextGate: 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1' }
}

export function evaluateFactoryHermesResearchExecutionApproval(input: FactoryHermesResearchExecutionApprovalInput): FactoryHermesResearchExecutionApprovalResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_POLICY, ...(input.policy || {}) }
  const id = `hermes-research-execution-approval:75b300f:${input.approvedAt}`
  const retryOk = validRetry(input.researchExecutionApprovalRetryResult)
  const adapterOk = validAdapter(input.researchRuntimeAdapterResult)
  const reviewOk = validReview(input.wrapperVerificationReviewResult)
  const selectionOk = validSelection(input.runtimeSelectionDecisionResult)
  const policyOk = Object.values(policy).every((value) => value === true)
  const blockers = [
    ...(!retryOk ? [{ blockerId: 'execution_approval_retry_not_granted', message: 'Execution approval retry is not granted.' }] : []),
    ...(!adapterOk ? [{ blockerId: 'research_runtime_adapter_not_prepared', message: 'Research runtime adapter is not prepared.' }] : []),
    ...(!reviewOk ? [{ blockerId: 'wrapper_verification_review_not_accepted', message: 'Wrapper verification review is not accepted.' }] : []),
    ...(!selectionOk ? [{ blockerId: 'runtime_selection_incomplete', message: 'Runtime selection is incomplete.' }] : []),
    ...(!policyOk ? [{ blockerId: 'policy_override_degrades_required_controls', message: 'Policy override disabled required controls.' }] : []),
  ]
  const granted = blockers.length === 0
  const status = granted ? 'research_execution_approval_granted' : 'research_execution_approval_blocked'
  const decision = granted ? 'hermes_research_execution_approval_granted_for_controlled_runtime_planning' : 'hermes_research_execution_approval_blocked_evidence_incomplete_or_unsafe'
  const approvalStatus = granted ? 'approved_for_controlled_runtime_planning_only' : 'blocked'
  const nextGate = granted ? 'Factory Hermes Controlled Research Runtime Planning Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1'
  const result: FactoryHermesResearchExecutionApprovalResult = {
    approvalId: id, approvalKind: FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_KIND, approvalVersion: FACTORY_HERMES_RESEARCH_EXECUTION_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'hermes_agent',
    executionApprovalRetryRef: input.researchExecutionApprovalRetryResult?.retryId, researchRuntimeAdapterRef: input.researchRuntimeAdapterResult?.adapterId, wrapperVerificationReviewRef: input.wrapperVerificationReviewResult?.reviewId, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    executionReadinessReview: makeReadiness(input, granted),
    executionApprovalLimitationsCarryForward: { limitations: EXECUTION_APPROVAL_LIMITATIONS, limitationsAcceptableForControlledRuntimePlanning: true, limitationsBlockImmediateRuntimeExecution: true, limitationsBlockImmediateResearchExecution: true, limitationsBlockImmediateFindingsUse: true },
    executionApprovalRiskDispositionRegister: makeRisks(id),
    researchExecutionApprovalReceipt: { receiptId: `${id}:receipt`, approvalId: id, toolId: 'hermes_agent', approvedBy: input.approvedBy, approvedAt: input.approvedAt, decision, executionApprovalStatus: approvalStatus, scope: 'hermes_research_execution_approval_only', approvedNextGate: nextGate, limitations: EXECUTION_APPROVAL_LIMITATIONS, notAuthorizedActions: EXECUTION_APPROVAL_NOT_AUTHORIZED_ACTIONS },
    hermesResearchExecutionApprovalDecision: { decisionId: `${id}:decision`, toolId: 'hermes_agent', executionApprovalStatus: approvalStatus, decision, reason: granted ? 'adapter_and_wrapper_boundary_support_controlled_runtime_planning_only' : 'execution_approval_evidence_incomplete_or_unsafe', researchExecutionApprovalRetryGranted: retryOk, researchRuntimeAdapterPrepared: adapterOk, wrapperVerificationReviewAccepted: reviewOk, controlledResearchRuntimePlanningAllowed: granted, researchExecutionApprovedNow: false, runtimeAdapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, tempConfigCreationAllowedNow: false, runRootCreationAllowedNow: false, findingsUseAllowedNow: false, canProceedToControlledResearchRuntimePlanning: granted, requiredNextGate: nextGate },
    checks: [{ checkId: 'execution_approval_retry_granted', passed: retryOk, message: 'Execution approval retry granted.' }, { checkId: 'research_runtime_adapter_prepared', passed: adapterOk, message: 'Research runtime adapter prepared.' }, { checkId: 'wrapper_review_accepted', passed: reviewOk, message: 'Wrapper verification review accepted.' }, { checkId: 'runtime_selection_known', passed: selectionOk, message: 'Runtime selection known.' }],
    blockers, warnings: EXECUTION_APPROVAL_LIMITATIONS.map((message) => ({ warningId: message, message })),
    status, decision, executionApprovalStatus: approvalStatus, controlledResearchRuntimePlanningAllowed: granted,
    researchExecutionApprovedNow: false, runtimeAdapterExecutionAllowedNow: false, hermesExecutionAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, credentialAccessAllowedNow: false, toolsetEnablementAllowedNow: false, tempConfigCreationAllowedNow: false, runRootCreationAllowedNow: false, findingsUseAllowedNow: false,
    canProceedToControlledResearchRuntimePlanning: granted, canProceedToResearchRuntimeAdapterExecution: false, canProceedToKeepHermesResearchBlockedDecision: !granted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false,
    recommendedNextStep: granted ? 'Proceed to Factory Hermes Controlled Research Runtime Planning Gate v1; runtime execution remains blocked.' : 'Keep Hermes research blocked or repair approval evidence.',
  }
  if (granted) result.controlledResearchRuntimePlanningEnvelope = makeEnvelope(id)
  else result.approvalBlockerPlan = makeBlockerPlan(id, blockers.map((blocker) => blocker.blockerId))
  return result
}
