export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_KIND = 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-planning'
export const FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_VERSION = '1.0'

export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningVersion = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_VERSION
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningKind = typeof FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_KIND
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningInput = { plannedAt: string, plannedBy: string, executionReviewResult?: any, executionResult?: any, runtimeSelectionDecisionResult?: any, sourceInventory?: any[] }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningPolicy = { selectedWrapperStrategy: 'wrapper_temp_config_no_toolsets', planningOnly: true }
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningStatus = 'safe_command_shape_proof_plan_created' | 'safe_command_shape_proof_plan_blocked'
export type FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningDecision = 'hermes_safe_command_shape_proof_plan_created_for_approval' | 'hermes_safe_command_shape_proof_plan_blocked_no_viable_proof_strategy'
export type FactoryHermesSafeCommandShapeSourceInspectionPlan = any
export type FactoryHermesSafeCommandShapeCandidateSet = any
export type FactoryHermesStaticCommandShapeProofPlan = any
export type FactoryHermesNoDefaultsAndNoToolsetsProofPlan = any
export type FactoryHermesWrapperBoundaryCommandProofPlan = any
export type FactoryHermesNonNetworkDryRunProofPlan = any
export type FactoryHermesFailClosedCommandConstructionPlan = any
export type FactoryHermesSafeCommandShapeProofRiskRegister = any
export type FactoryHermesSafeCommandShapeProofApprovalEnvelope = any
export type FactoryHermesSafeCommandShapeProofPlanningReceipt = any
export type FactoryHermesSafeCommandShapeProofPlanCandidate = any
export type FactoryHermesSafeCommandShapeProofPlanningCheck = { checkId: string, passed: boolean, expected: unknown, actual: unknown }
export type FactoryHermesSafeCommandShapeProofPlanningBlocker = { blockerId: string, message: string }
export type FactoryHermesSafeCommandShapeProofPlanningWarning = { warningId: string, message: string }
export type FactoryHermesSafeCommandShapeProofPlanningResult = any
export type FactoryHermesSafeCommandShapeProofPlanningValidationResult = { ok: boolean, errors: string[] }
export type FactoryHermesSafeCommandShapeProofPlanningSummary = { planningId: string, status: string, decision: string, canProceedToSafeCommandShapeProofApproval: boolean, canRunResearchNow: boolean }

const selectedWrapperStrategy = 'wrapper_temp_config_no_toolsets'
const falseFlags = ['safeCommandShapeProofAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeProof', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']
const riskIds = ['proof_planning_confused_with_proof', 'proof_confused_with_execution', 'static_source_read_misses_runtime_defaults', 'parse_only_mode_actually_reads_credentials', 'dry_run_mode_actually_uses_network', 'command_shape_falls_back_to_defaults', 'wrapper_boundary_overtrusted', 'hidden_mcp_or_toolsets_enabled', 'prompt_passed_before_no_tool_proof', 'credential_read_before_no_tool_proof', 'network_model_started_before_no_tool_proof', 'proof_artifact_overclaims_runtime_safety', 'future_execution_retries_without_new_approval', 'findings_used_without_successful_review']

function add(checks: FactoryHermesSafeCommandShapeProofPlanningCheck[], checkId: string, actual: unknown, expected: unknown = true): boolean {
  const passed = actual === expected
  checks.push({ checkId, passed, expected, actual })
  return passed
}

function provider(selection: any): string | undefined { return selection?.selectedProvider?.providerId ?? selection?.runtimeSelectionDecisionRecord?.provider?.providerId }
function model(selection: any): string | undefined { return selection?.selectedModel?.modelId ?? selection?.runtimeSelectionDecisionRecord?.model?.modelId }
function credential(selection: any): string | undefined { return selection?.selectedCredentialRef?.credentialRefName ?? selection?.runtimeSelectionDecisionRecord?.credential?.credentialRefName }
function host(selection: any): string | undefined { return selection?.selectedNetworkHosts?.selectedHosts?.[0] ?? selection?.runtimeSelectionDecisionRecord?.network?.selectedHosts?.[0] }
function runRoot(selection: any): string { return selection?.selectedRunRoot?.selectedRunRoot ?? selection?.runtimeSelectionDecisionRecord?.runRoot?.selectedRunRoot ?? '' }

export function evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanning(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningInput): FactoryHermesSafeCommandShapeProofPlanningResult {
  const review = input.executionReviewResult
  const execution = input.executionResult
  const selection = input.runtimeSelectionDecisionResult
  const checks: FactoryHermesSafeCommandShapeProofPlanningCheck[] = []
  const planningId = `hermes-controlled-research-runtime-safe-command-shape-proof-planning:75b300f:${input.plannedAt}`
  const required = [
    add(checks, 'review_completed', review?.status, 'controlled_research_runtime_execution_review_completed'),
    add(checks, 'review_decision', review?.decision, 'hermes_controlled_research_runtime_execution_review_accepted_blocked_before_runtime_for_command_shape_resolution'),
    add(checks, 'review_allows_planning', review?.canProceedToSafeCommandShapeProofPlanning),
    add(checks, 'execution_blocked', execution?.status, 'controlled_research_runtime_execution_blocked'),
    add(checks, 'safe_command_not_proven', execution?.finalRuntimeGuardDecision?.safeCommandShapeProven, false),
    add(checks, 'safe_command_reason', execution?.finalRuntimeGuardDecision?.blockReasons?.includes('safe_command_shape_not_proven')),
    add(checks, 'credential_skipped', execution?.credentialAccessPerformed, false),
    add(checks, 'selection_provider', provider(selection), 'openai'),
    add(checks, 'selection_model', model(selection), 'gpt-4o-mini'),
    add(checks, 'selection_credential', credential(selection), 'OPENAI_API_KEY'),
    add(checks, 'selection_host', host(selection), 'api.openai.com'),
    add(checks, 'selection_run_root', runRoot(selection).startsWith('.codex-temp')),
  ]
  const accepted = required.every(Boolean)
  const blockers = accepted ? [] : checks.filter((item) => !item.passed).map((item) => ({ blockerId: item.checkId, message: `Proof planning check failed: ${item.checkId}` }))
  const status: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningStatus = accepted ? 'safe_command_shape_proof_plan_created' : 'safe_command_shape_proof_plan_blocked'
  const decision: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningDecision = accepted ? 'hermes_safe_command_shape_proof_plan_created_for_approval' : 'hermes_safe_command_shape_proof_plan_blocked_no_viable_proof_strategy'
  const sourceFilesToInspect = ['.codex-temp/external-tools/hermes-agent/install/75b300f/source/hermes_cli/main.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/hermes_cli/oneshot.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/hermes_cli/tools_config.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/hermes_cli/config.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/hermes_cli/runtime_provider.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/hermes_cli/auth.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/toolsets.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/run_agent.py', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/README.md', '.codex-temp/external-tools/hermes-agent/install/75b300f/source/pyproject.toml', 'src/factory/hermes-wrapper-no-tool-mode-runtime/index.ts', 'electron/factory/hermes-wrapper-no-tool-mode-runtime/index.cjs', 'src/factory/hermes-research-runtime-adapter/', 'electron/factory/hermes-research-runtime-adapter/']
  const safeCommandShapeProofApprovalEnvelope = accepted ? { envelopeId: `${planningId}:approval-envelope`, toolId: 'hermes_agent', approvedFor: 'controlled_research_runtime_safe_command_shape_proof_approval_only', selectedWrapperStrategy, sourceProofPlanningRef: 'controlled-research-runtime-safe-command-shape-proof-planning-result.json', sourceExecutionReviewRef: 'controlled-research-runtime-execution-review-result.json', targetNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Approval Gate v1', purpose: 'approve or block a future proof gate that validates a safe runnable command shape before any credential access, prompt passing, network, model call, Hermes execution or research execution', allowedInNextGate: ['read safe command shape proof planning result', 'read execution review result', 'review source inspection plan', 'review candidate command shapes', 'review static proof plan', 'review no-defaults/no-toolsets proof plan', 'review wrapper boundary proof plan', 'review non-network dry-run proof plan', 'decide whether proof gate may run', 'write ignored approval artifact'], forbiddenEvenInNextGate: ['execute Hermes', 'execute hermes.exe', 'execute --oneshot', 'execute wrapper against Hermes', 'pass prompt', 'call model', 'use network', 'resolve DNS', 'test endpoints', 'read credential values', 'read .env', 'enable actual toolsets', 'execute research', 'ingest output', 'promote findings', 'mutate Hermes source', 'run uv/pip/python/setup.py'], flags: { safeCommandShapeProofApprovalAllowedNow: true, safeCommandShapeProofAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofApproval: true, canProceedToSafeCommandShapeProof: false, canProceedToControlledResearchRuntimeExecution: false, canRunResearchNow: false }, recommendedNextGate: 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Approval Gate v1' } : undefined
  return {
    planningId, planningKind: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_KIND, planningVersion: FACTORY_HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', executionReviewRef: 'controlled-research-runtime-execution-review-result.json', executionRef: 'controlled-research-runtime-execution-result.json', runtimeSelectionDecisionRef: 'runtime-selection-decision-result.json', selectedWrapperStrategy,
    safeCommandShapeSourceInspectionPlan: { sourceInspectionPlanned: true, inspectedInventory: input.sourceInventory || [], sourceFilesToInspect, inspectionScope: ['entrypoints', 'prompt_path', 'provider_model_credential_path', 'toolsets_defaults_path', 'runtime_output_path', 'proof_blockers'], noExecution: true, noRuntimeProofClaimed: true },
    safeCommandShapeCandidateSet: { candidates: [
      { strategyId: 'direct_cli_with_explicit_verified_config', description: 'execute Hermes CLI with verified config path, run root, and approved prompt', status: 'candidate_if_source_proves_explicit_config_and_no_defaults', risk: 'high', proofRequired: ['explicit config path accepted', 'config applied before defaults', 'no hidden CLI defaults', 'no MCP', 'no toolsets', 'credential read after guards only'] },
      { strategyId: 'wrapper_managed_command_with_fail_closed_preflight', description: 'wrapper builds final command only if all no-tool checks pass', status: 'preferred_planning_candidate', risk: 'medium', proofRequired: ['wrapper does not execute early', 'command built only after verified artifacts', 'command cannot fall back to defaults', 'no command if proof missing'] },
      { strategyId: 'internal_api_empty_tool_registry', status: 'candidate_if_internal_api_accepts_empty_tools', risk: 'medium_high' },
      { strategyId: 'non_network_dry_run_or_parse_only_probe', status: 'candidate_if_source_has_parse_only_or_validate_config_mode', risk: 'medium' },
      { strategyId: 'direct_cli_omit_toolsets', status: 'forbidden', reason: 'hidden defaults risk' },
      { strategyId: 'direct_cli_no_mcp_only', status: 'forbidden', reason: 'no_mcp does not disable all tools' },
      { strategyId: 'direct_cli_no_toolsets_text_only', status: 'forbidden', reason: 'label policy is not proven Hermes syntax' },
      { strategyId: 'modify_hermes_source_to_add_no_tool_mode', status: 'forbidden_initially', reason: 'mutates third-party source and breaks audited boundary' },
      { strategyId: 'keep_execution_blocked', status: 'safe_fallback', reason: 'conservative option if command shape cannot be proven' },
    ] },
    staticCommandShapeProofPlan: { staticProofAllowedNow: false, futureStaticProofRequiresApproval: true, sourceFilesToInspect, requiredAssertions: ['exact entrypoint', 'exact args', 'exact config path', 'exact run root', 'exact prompt artifact path', 'provider/model/host refs', 'credential ref only', 'no hidden defaults', 'no MCP', 'no toolsets', 'no fallback', 'validation before credential/network/model', 'fail closed'], failIfAnyAssertionUnknown: true, proofArtifactRequiredBeforeCredentialAccess: true, proofArtifactRequiredBeforeNetwork: true, proofArtifactRequiredBeforePromptPassing: true, proofArtifactRequiredBeforeHermesExecution: true },
    noDefaultsAndNoToolsetsProofPlan: { selectedWrapperStrategy, directNoToolsetsTextOnlyRejected: true, directHermesCliDefaultsForbidden: true, noMcpInsufficientAlone: true, hiddenDefaultsRiskCarriedForward: true, futureProofMustShowConfigWinsOverDefaults: true, futureProofMustShowOmittedToolsetsDoNotLoadDefaults: true, futureProofMustShowMcpDisabled: true, futureProofMustShowNoToolRegistryOrEmptyToolRegistry: true, futureProofMustBlockIfUnknown: true, futureRuntimeMustFailIfAnyToolUsageAppearsInOutput: true, proofMustBeProducedBeforeCredentialAccess: true, proofMustBeProducedBeforeExecution: true },
    wrapperBoundaryCommandProofPlan: { wrapperBoundaryRequired: true, wrapperBoundaryCanBuildCommandNow: false, futureWrapperCommandBuildRequiresApproval: true, wrapperMustUseVerifiedConfig: true, wrapperMustUseVerifiedRunManifest: true, wrapperMustUseApprovedPromptArtifact: true, wrapperMustUseCredentialRefOnlyUntilFinalGate: true, wrapperMustNotUseDirectHermesDefaults: true, wrapperMustNotFallbackToCliDefaults: true, wrapperMustEmitRedactedCommandEnvelope: true, wrapperMustEmitFailClosedReasonIfProofMissing: true, wrapperMustDenyExecutionIfSafeCommandShapeNotProven: true },
    nonNetworkDryRunProofPlan: { dryRunAllowedNow: false, futureDryRunRequiresApproval: true, dryRunMustNotReadCredentials: true, dryRunMustNotUseNetwork: true, dryRunMustNotResolveDNS: true, dryRunMustNotCallModel: true, dryRunMustNotPassRealPromptToProvider: true, dryRunMustNotEnableToolsets: true, dryRunMustNotCreateRuntimeOutputAsFindings: true, possibleModesToSearch: ['config validate', 'parse only', 'command render', 'dry run no provider', 'help metadata from existing artifacts only'], dryRunBlockedIfOnlyAvailableModeRunsProvider: true, dryRunBlockedIfCredentialReadOccursBeforeValidation: true },
    failClosedCommandConstructionPlan: { failClosedRequired: true, commandNotBuiltIfProofMissing: true, credentialNotReadIfProofMissing: true, promptNotPassedIfProofMissing: true, networkNotUsedIfProofMissing: true, modelNotCalledIfProofMissing: true, hermesNotExecutedIfProofMissing: true, wrapperNotExecutedIfProofMissing: true, adapterNotExecutedIfProofMissing: true, toolsetsNotEnabledIfProofMissing: true, resultMustRecordBlockerReason: true, allowedBlockerReasons: ['safe_command_shape_not_proven', 'config_path_not_proven', 'hidden_defaults_not_excluded', 'no_toolsets_not_proven', 'mcp_disable_not_proven', 'credential_read_order_not_safe', 'network_or_model_may_start_before_validation', 'prompt_passing_order_not_safe'] },
    safeCommandShapeProofRiskRegister: { risks: riskIds.map((riskId) => ({ riskId, severity: riskId.includes('credential') || riskId.includes('network') || riskId.includes('defaults') ? 'high' : 'medium', disposition: 'accepted_for_proof_planning_only', blocksSafeCommandShapeProofDisposition: 'blocks_safe_command_shape_proof', blocksRuntimeExecutionDisposition: 'blocks_runtime_execution', blocksResearchExecutionDisposition: 'blocks_research_execution', futureGateDisposition: 'requires_future_gate_control', mitigation: 'Require proof approval and proof gate before any command construction, credential, prompt, network, model, Hermes, wrapper, or research action.', blocksProofPlanning: false, blocksProof: riskId !== 'proof_planning_confused_with_proof', blocksRuntimeExecution: true, blocksResearchExecution: true })) },
    safeCommandShapeProofApprovalEnvelope,
    safeCommandShapeProofPlanningReceipt: { receiptId: `${planningId}:receipt`, planningId, decision, proofExecuted: false, executionApprovedNow: false },
    hermesSafeCommandShapeProofPlanCandidate: { candidateId: `${planningId}:candidate`, preferredCandidate: 'wrapper_managed_command_with_fail_closed_preflight', safeFallback: 'keep_execution_blocked', proofRequiredBeforeCredentialAccess: true, proofRequiredBeforeExecution: true },
    safeCommandShapeProofPlanningBlockerPlan: accepted ? undefined : { planId: `${planningId}:blocker-plan`, blockers, canProceedToKeepHermesResearchBlockedDecision: true },
    checks, blockers, warnings: riskIds.map((warningId) => ({ warningId, message: warningId })),
    status, decision, proofPlanningStatus: accepted ? 'plan_candidate_created' : 'blocked', sourceInspectionPlanned: accepted, commandShapeCandidateSetBuilt: accepted, staticProofPlanBuilt: accepted, noDefaultsProofPlanBuilt: accepted, wrapperBoundaryProofPlanBuilt: accepted, nonNetworkDryRunProofPlanBuilt: accepted, failClosedCommandConstructionPlanBuilt: accepted, safeCommandShapeProofApprovalEnvelopeBuilt: accepted, safeCommandShapeProofAllowedNow: false, controlledRuntimeExecutionAllowedNow: false, credentialAccessAllowedNow: false, promptPassingAllowedNow: false, modelCallsAllowedNow: false, networkAllowedNow: false, toolsetEnablementAllowedNow: false, outputIngestionApprovedNow: false, findingsUseApprovedNow: false, canProceedToSafeCommandShapeProofApproval: accepted, canProceedToSafeCommandShapeProof: false, canProceedToControlledResearchRuntimeExecution: false, canProceedToKeepHermesResearchBlockedDecision: !accepted, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: accepted ? 'Proceed to Factory Hermes Controlled Research Runtime Safe Command Shape Proof Approval Gate v1.' : 'Keep Hermes research blocked; no viable proof strategy was planned.',
  }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningInput(input: FactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningInput): FactoryHermesSafeCommandShapeProofPlanningValidationResult {
  const errors: string[] = []
  if (!input?.plannedAt) errors.push('plannedAt_required')
  if (!input?.plannedBy) errors.push('plannedBy_required')
  if (!input?.executionReviewResult) errors.push('executionReviewResult_required')
  return { ok: errors.length === 0, errors }
}

export function validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(result: FactoryHermesSafeCommandShapeProofPlanningResult): FactoryHermesSafeCommandShapeProofPlanningValidationResult {
  const errors: string[] = []
  if (!['safe_command_shape_proof_plan_created', 'safe_command_shape_proof_plan_blocked'].includes(result?.status)) errors.push('invalid_status')
  for (const key of falseFlags) if (result?.[key] !== false) errors.push(`${key}_must_be_false`)
  return { ok: errors.length === 0, errors }
}

export function serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(result: FactoryHermesSafeCommandShapeProofPlanningResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(text: string): FactoryHermesSafeCommandShapeProofPlanningResult { return JSON.parse(text) }
export function summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningResult(result: FactoryHermesSafeCommandShapeProofPlanningResult): FactoryHermesSafeCommandShapeProofPlanningSummary {
  return { planningId: result.planningId, status: result.status, decision: result.decision, canProceedToSafeCommandShapeProofApproval: result.canProceedToSafeCommandShapeProofApproval, canRunResearchNow: result.canRunResearchNow }
}
