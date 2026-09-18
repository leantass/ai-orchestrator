export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_APPROVAL_KIND = 'factory-hermes-controlled-research-runtime-approval'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_APPROVAL_VERSION = '1.0'

const limitations = [
  'no_real_hermes_execution_tested',
  'no_model_network_or_provider_tested',
  'config_schema_partially_unknown',
  'empty_toolsets_support_unknown',
  'hidden_defaults_may_still_exist_in_real_cli_runtime',
  'wrapper_verified_only_as_code_boundary',
  'adapter_prepared_only_as_non_executable_boundary',
  'controlled_runtime_plan_is_not_preparation',
  'controlled_runtime_approval_is_not_execution',
  'preparation_gate_must_not_auto_execute',
  'preparation_gate_must_not_read_credentials_without_future_approval',
  'preparation_gate_must_not_pass_prompt_without_future_approval',
  'preparation_gate_must_not_use_network_without_future_approval',
  'preparation_gate_must_not_enable_toolsets_without_future_approval',
  'findings_use_requires_real_ingestion_review',
]

const notAuthorizedActions = [
  'execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now',
  'create_live_temp_config_now', 'create_run_root_now', 'pass_prompt_now', 'call_models_now',
  'use_network_now', 'access_credentials_now', 'read_env_secrets_now', 'enable_toolsets_now',
  'mutate_runtime_filesystem_now', 'ingest_real_output_now', 'promote_findings_now',
  'modify_hermes_source_now', 'execute_hermes_now', 'execute_oneshot_now',
  'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'deploy_now',
]

export interface FactoryHermesControlledResearchRuntimeApprovalInput {
  approvedAt: string
  approvedBy: string
  controlledRuntimePlanningResult?: any
  researchExecutionApprovalResult?: any
  researchRuntimeAdapterResult?: any
  runtimeSelectionDecisionResult?: any
}

export interface FactoryHermesControlledResearchRuntimeApprovalValidationResult { ok: boolean, errors: string[] }
export interface FactoryHermesControlledResearchRuntimeApprovalSummary { approvalId: string, status: string, decision: string, canProceedToControlledResearchRuntimePreparation: boolean, canRunResearchNow: boolean }

function selectionOk(selection: any): boolean {
  const s = selection?.runtimeSelectionDecisionRecord || selection
  return s?.provider?.providerId === 'openai'
    && s?.model?.modelId === 'gpt-4o-mini'
    && s?.credential?.credentialRefName === 'OPENAI_API_KEY'
    && s?.network?.selectedHosts?.includes('api.openai.com')
    && String(s?.runRoot?.selectedRunRoot || '').includes('.codex-temp')
}

export function evaluateFactoryHermesControlledResearchRuntimeApproval(input: FactoryHermesControlledResearchRuntimeApprovalInput): any {
  const id = `hermes-controlled-research-runtime-approval:75b300f:${input.approvedAt}`
  const plan = input.controlledRuntimePlanningResult || {}
  const approval = input.researchExecutionApprovalResult || {}
  const adapter = input.researchRuntimeAdapterResult || {}
  const planOk = plan.status === 'controlled_research_runtime_plan_created'
    && plan.decision === 'hermes_controlled_research_runtime_plan_created_for_approval'
    && plan.runtimePlanningStatus === 'plan_candidate_created'
    && plan.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets'
    && plan.controlledRuntimeBoundaryPlanned === true
    && plan.tempConfigPolicyPlanned === true
    && plan.runRootPolicyPlanned === true
    && plan.credentialAccessPolicyPlanned === true
    && plan.promptPassingPolicyPlanned === true
    && plan.modelNetworkPolicyPlanned === true
    && plan.toolsetDisablePolicyPlanned === true
    && plan.timeoutKillSwitchPolicyPlanned === true
    && plan.outputIngestionPolicyPlanned === true
    && Boolean(plan.controlledRuntimeRiskRegister)
    && Boolean(plan.controlledResearchRuntimeApprovalEnvelope)
    && plan.canProceedToControlledResearchRuntimeApproval === true
    && plan.canProceedToControlledResearchRuntimePreparation === false
    && plan.canProceedToControlledResearchRuntimeExecution === false
    && plan.canRunResearchNow === false
  const executionApprovalOk = approval.status === 'research_execution_approval_granted'
    && approval.executionApprovalStatus === 'approved_for_controlled_runtime_planning_only'
    && approval.controlledResearchRuntimePlanningAllowed === true
    && approval.researchExecutionApprovedNow === false
    && approval.runtimeAdapterExecutionAllowedNow === false
    && approval.hermesExecutionAllowedNow === false
    && approval.tempConfigCreationAllowedNow === false
    && approval.runRootCreationAllowedNow === false
  const adapterOk = adapter.status === 'research_runtime_adapter_prepared'
    && adapter.adapterStatus === 'prepared_code_only_not_executed'
    && adapter.wrapperBoundaryIntegrated === true
    && adapter.runtimeAdapterExecutionAllowedNow === false
    && adapter.canRunResearchNow === false
  const runtimeSelectionOk = selectionOk(input.runtimeSelectionDecisionResult)
  const blockers = [
    ...(!planOk ? [{ blockerId: 'controlled_runtime_plan_incomplete', message: 'Controlled runtime plan is incomplete or unsafe.' }] : []),
    ...(!executionApprovalOk ? [{ blockerId: 'research_execution_approval_invalid', message: 'Research execution approval is not planning-only granted.' }] : []),
    ...(!adapterOk ? [{ blockerId: 'research_runtime_adapter_invalid', message: 'Research runtime adapter is not prepared.' }] : []),
    ...(!runtimeSelectionOk ? [{ blockerId: 'runtime_selection_invalid', message: 'Runtime selection is incomplete.' }] : []),
  ]
  const granted = blockers.length === 0
  const status = granted ? 'controlled_research_runtime_approval_granted' : 'controlled_research_runtime_approval_blocked'
  const decision = granted ? 'hermes_controlled_research_runtime_approved_for_preparation_gate' : 'hermes_controlled_research_runtime_approval_blocked_plan_incomplete_or_unsafe'
  const approvalStatus = granted ? 'approved_for_preparation_only' : 'blocked'
  const riskIds = ['approval_confused_with_runtime_preparation', 'preparation_confused_with_runtime_execution', 'temp_config_created_without_preparation_policy', 'run_root_created_without_preparation_policy', 'credential_access_approved_too_early', 'prompt_passing_approved_too_early', 'network_approved_too_early', 'model_called_too_early', 'toolsets_enabled_too_early', 'hidden_defaults_loaded_in_real_runtime', 'raw_output_promoted_without_review', 'findings_used_without_ingestion_review']
  const riskRegister = { registerId: `${id}:risk-register`, risks: riskIds.map((riskId) => ({ riskId, severity: ['approval_confused_with_runtime_preparation', 'preparation_confused_with_runtime_execution'].includes(riskId) ? 'critical' : 'high', disposition: 'accepted_for_preparation_gate_only', mitigation: 'Require future gate control before preparation or execution-affecting actions.', blocksControlledRuntimeApproval: false, blocksRuntimePreparation: false, blocksRuntimeExecution: true, blocksResearchExecution: true })) }
  const readiness = { controlledRuntimePlanCreated: planOk, controlledRuntimeBoundaryPlanned: plan.controlledRuntimeBoundaryPlanned === true, tempConfigPolicyPlanned: plan.tempConfigPolicyPlanned === true, runRootPolicyPlanned: plan.runRootPolicyPlanned === true, credentialAccessPolicyPlanned: plan.credentialAccessPolicyPlanned === true, promptPassingPolicyPlanned: plan.promptPassingPolicyPlanned === true, modelNetworkPolicyPlanned: plan.modelNetworkPolicyPlanned === true, toolsetDisablePolicyPlanned: plan.toolsetDisablePolicyPlanned === true, timeoutKillSwitchPolicyPlanned: plan.timeoutKillSwitchPolicyPlanned === true, outputIngestionPolicyPlanned: plan.outputIngestionPolicyPlanned === true, riskRegisterPresent: Boolean(plan.controlledRuntimeRiskRegister), approvalEnvelopePresent: Boolean(plan.controlledResearchRuntimeApprovalEnvelope), provider: 'openai', model: 'gpt-4o-mini', credentialRef: 'OPENAI_API_KEY', host: 'api.openai.com', selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', readinessSupportsPreparationGate: granted, readinessDoesNotApproveExecution: true, readinessDoesNotApproveTempConfigCreationNow: true, readinessDoesNotApproveRunRootCreationNow: true, readinessDoesNotApprovePromptNow: true, readinessDoesNotApproveNetworkNow: true, readinessDoesNotApproveCredentialsNow: true, readinessDoesNotApproveToolsetsNow: true, readinessDoesNotApproveFindingsUseNow: true }
  const prepEnvelope = { envelopeId: `${id}:preparation-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_preparation_gate_only', selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', sourceApprovalRef: 'controlled-research-runtime-approval-result.json', sourcePlanningRef: 'controlled-research-runtime-planning-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Preparation Gate v1', purpose: 'prepare non-executed runtime artifacts and policies for the first controlled Hermes research run while keeping execution, model, network, credentials and findings blocked', allowedInNextGate: ['read controlled-research-runtime-approval-result.json', 'read controlled-research-runtime-planning-result.json', 'prepare non-executable runtime manifests', 'prepare temp config candidate as virtual or gated artifact only if still non-runnable', 'prepare run root manifest or path validation without creating live runtime root unless explicitly allowed by that gate', 'prepare prompt reference policy without sending prompt', 'prepare credential reference policy without reading value', 'prepare model/network allowlist policy without calls', 'prepare toolset disable proof requirements', 'prepare timeout/kill switch envelope', 'prepare output ingestion contract', 'write ignored preparation artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'pass prompt to Hermes', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'enable actual toolsets', 'execute research', 'ingest real output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], specialNote: 'If next gate proposes creating a live temp config file or live run root, it must explicitly keep execution false and prove no secrets/prompt/credential/model/network/toolsets are touched.', flags: { controlledRuntimePreparationAllowedNow: true, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, tempConfigCreationApprovedNow: false, runRootCreationApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimePreparation: true, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Preparation Gate v1' }
  const blockerPlan = { blockerPlanId: `${id}:blocker-plan`, toolId: 'hermes_agent', blockerType: 'controlled_runtime_plan_incomplete_or_unsafe', blockers: blockers.map((b) => b.blockerId), resolutionOptions: ['Return to Controlled Research Runtime Planning Gate', 'Return to Research Execution Approval Gate', 'Return to Research Runtime Adapter Gate', 'Keep Hermes research blocked', 'Change research provider/tool'], recommendedConservativeNextGate: 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1' }
  return {
    approvalId: id, approvalKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_APPROVAL_KIND, approvalVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_APPROVAL_VERSION, approvedAt: input.approvedAt, approvedBy: input.approvedBy, toolId: 'hermes_agent',
    controlledRuntimePlanningRef: plan.planningId, researchExecutionApprovalRef: approval.approvalId, researchRuntimeAdapterRef: adapter.adapterId, selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets',
    controlledRuntimePlanReadinessReview: readiness,
    controlledRuntimeApprovalLimitationsCarryForward: { limitations, limitationsAcceptableForPreparationGate: true, limitationsBlockImmediateRuntimeExecution: true, limitationsBlockImmediateResearchExecution: true, limitationsBlockImmediateFindingsUse: true },
    controlledRuntimeApprovalRiskDispositionRegister: riskRegister,
    ...(granted ? { controlledResearchRuntimePreparationEnvelope: prepEnvelope } : { controlledResearchRuntimeApprovalBlockerPlan: blockerPlan, approvalBlockerPlan: blockerPlan }),
    controlledResearchRuntimeApprovalReceipt: { receiptId: `${id}:receipt`, approvalId: id, toolId: 'hermes_agent', approvedBy: input.approvedBy, approvedAt: input.approvedAt, decision, controlledRuntimeApprovalStatus: approvalStatus, scope: 'hermes_controlled_research_runtime_approval_only', approvedNextGate: granted ? 'Factory Hermes Controlled Research Runtime Preparation Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1', limitations, notAuthorizedActions },
    hermesControlledResearchRuntimeApprovalDecision: { decisionId: `${id}:decision`, toolId: 'hermes_agent', controlledRuntimeApprovalStatus: approvalStatus, decision, reason: granted ? 'controlled_runtime_plan_complete_for_non_executing_preparation_gate' : 'controlled_runtime_plan_incomplete_or_unsafe', controlledRuntimePlanAccepted: granted, controlledRuntimePreparationAllowed: granted, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, tempConfigCreationApprovedNow: false, runRootCreationApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, findingsUseApprovedNow: false, canProceedToControlledResearchRuntimePreparation: granted, requiredNextGate: granted ? 'Factory Hermes Controlled Research Runtime Preparation Gate v1' : 'Factory Hermes Keep Hermes Research Blocked Decision Gate v1' },
    checks: [{ checkId: 'controlled_runtime_plan_created', passed: planOk, message: 'Controlled runtime plan is complete.' }, { checkId: 'research_execution_approval_granted', passed: executionApprovalOk, message: 'Research execution approval is planning-only granted.' }, { checkId: 'adapter_prepared', passed: adapterOk, message: 'Research runtime adapter is prepared.' }, { checkId: 'runtime_selection_valid', passed: runtimeSelectionOk, message: 'Runtime selection is complete.' }],
    blockers, warnings: limitations.map((message) => ({ warningId: message, message })),
    status, decision, controlledRuntimeApprovalStatus: approvalStatus, controlledRuntimePreparationAllowed: granted, controlledRuntimeExecutionAllowedNow: false, researchExecutionApprovedNow: false, tempConfigCreationApprovedNow: false, runRootCreationApprovedNow: false, promptPassingApprovedNow: false, modelCallsApprovedNow: false, networkApprovedNow: false, credentialAccessApprovedNow: false, toolsetEnablementApprovedNow: false, findingsUseApprovedNow: false,
    canProceedToControlledResearchRuntimePreparation: granted, canProceedToControlledResearchRuntimeExecution: false, canProceedToResearchRuntimeAdapterExecution: false, canProceedToKeepHermesResearchBlockedDecision: !granted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false,
    recommendedNextStep: granted ? 'Proceed to Factory Hermes Controlled Research Runtime Preparation Gate v1; runtime execution remains blocked.' : 'Keep Hermes research blocked or repair controlled runtime plan.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeApprovalInput(input: FactoryHermesControlledResearchRuntimeApprovalInput): FactoryHermesControlledResearchRuntimeApprovalValidationResult {
  const errors: string[] = []
  if (!input?.approvedAt) errors.push('approvedAt_required')
  if (!input?.approvedBy) errors.push('approvedBy_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeApprovalResult(result: any): FactoryHermesControlledResearchRuntimeApprovalValidationResult {
  const errors: string[] = []
  if (!['controlled_research_runtime_approval_granted', 'controlled_research_runtime_approval_blocked'].includes(result?.status)) errors.push('invalid_status')
  if (result?.selectedWrapperStrategy !== 'wrapper_temp_config_no_toolsets') errors.push('invalid_wrapper_strategy')
  for (const key of ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'tempConfigCreationApprovedNow', 'runRootCreationApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeApprovalResult(result: any): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeApprovalResult(text: string): any { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeApprovalResult(result: any): FactoryHermesControlledResearchRuntimeApprovalSummary {
  return { approvalId: result.approvalId, status: result.status, decision: result.decision, canProceedToControlledResearchRuntimePreparation: result.canProceedToControlledResearchRuntimePreparation, canRunResearchNow: result.canRunResearchNow }
}
