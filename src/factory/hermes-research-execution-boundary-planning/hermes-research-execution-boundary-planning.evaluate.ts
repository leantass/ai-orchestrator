import { DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_POLICY, FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_NEXT_STEP, FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_VERSION, RESEARCH_EXECUTION_BOUNDARY_NOT_AUTHORIZED_ACTIONS } from './hermes-research-execution-boundary-planning.defaults.ts'
import type { FactoryHermesResearchExecutionBoundaryCommandShape, FactoryHermesResearchExecutionBoundaryCredentialsShape, FactoryHermesResearchExecutionBoundaryEnvironmentShape, FactoryHermesResearchExecutionBoundaryFilesystemShape, FactoryHermesResearchExecutionBoundaryIngestionShape, FactoryHermesResearchExecutionBoundaryMissingSelection, FactoryHermesResearchExecutionBoundaryNetworkShape, FactoryHermesResearchExecutionBoundaryOutputShape, FactoryHermesResearchExecutionBoundaryPlanningDecision, FactoryHermesResearchExecutionBoundaryPlanningInput, FactoryHermesResearchExecutionBoundaryPlanningResult, FactoryHermesResearchExecutionBoundaryTimeoutShape, FactoryHermesResearchExecutionBoundaryToolsetsShape } from './hermes-research-execution-boundary-planning.types.ts'

const INSTALL_ROOT = '.codex-temp/external-tools/hermes-agent/install/75b300f'
const SOURCE_ROOT = `${INSTALL_ROOT}/source`

function commandShape(): FactoryHermesResearchExecutionBoundaryCommandShape {
  return { executableRef: `${INSTALL_ROOT}/python-env/Scripts/hermes.exe`, executableMustExistInFutureRuntime: true, commandName: 'hermes.exe', argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>'], shell: false, cwd: SOURCE_ROOT, cwdMutationAllowed: false, stdinAllowed: false, interactiveModeAllowed: false, helpOutputAsFindings: false, oneShotOnly: true, commandExecutionAllowedNow: false }
}

function environmentShape(): FactoryHermesResearchExecutionBoundaryEnvironmentShape {
  return { inheritParentEnv: false, fullEnvDumpAllowed: false, dotEnvReadAllowed: false, envSecretReadAllowed: false, allowedEnvKeysFutureCandidate: ['provider/model keys only if future approval requires them', 'credential refs only as injected values under credentials policy'], forbiddenEnvKeys: ['any unapproved secrets', 'wildcard env', 'proxy env unless network policy approves'], envValuesStoredInArtifacts: false, envValuesLogged: false, envSanitizationRequired: true }
}

function filesystemShape(): FactoryHermesResearchExecutionBoundaryFilesystemShape {
  return { futureRunRootCandidate: `${INSTALL_ROOT}/research-runs/<runId>/`, writesAllowedNow: false, futureWritesRestrictedToCodexTemp: true, sourceRootReadOnly: true, sourceRootWritesForbidden: true, pythonEnvMutationForbidden: true, uvCacheMutationForbidden: true, packageFileMutationForbidden: true, dotEnvReadWriteForbidden: true, projectRootWritesForbidden: true, arbitraryPathAccessForbidden: true, pathContainmentRequired: true, symlinkTraversalForbidden: true, fsMutationReportingRequired: true }
}

function networkShape(): FactoryHermesResearchExecutionBoundaryNetworkShape {
  return { networkAllowedNow: false, allowedHostsNow: [], allowedSchemesNow: [], wildcardHostsAllowed: false, arbitraryInternetAllowed: false, futureHostSelectionRequired: true, providerNetworkRequiresApproval: true, toolsetNetworkDisabled: true, dnsResolutionAllowedNow: false, endpointTestingAllowedNow: false, networkStatusRequired: true, redirectsToUnapprovedHostsForbidden: true }
}

function credentialsShape(): FactoryHermesResearchExecutionBoundaryCredentialsShape {
  return { credentialsAllowedNow: false, credentialValuesReadNow: false, credentialValuesStored: false, credentialValuesLogged: false, futureCredentialSelectionRequired: true, credentialRefsAvailableAsNamesOnly: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'], credentialInjectionRequiresFutureApproval: true, maskingRequired: true, credentialKillSwitchRequired: true }
}

function toolsetsShape(input: FactoryHermesResearchExecutionBoundaryPlanningInput): FactoryHermesResearchExecutionBoundaryToolsetsShape {
  const toolsetsPlan = input.toolsetsPolicyPlanningResult?.hermesToolsetsPolicyPlanCandidate
  const preferred = toolsetsPlan?.preferredFutureToolsetMode === 'no_toolsets_text_only' ? 'no_toolsets_text_only' : 'manual_review_required'
  return { toolsetsAllowedNow: false, toolsetsApprovedNow: [], explicitToolsetsRequiredForFutureRuntime: true, hiddenDefaultToolsetsForbidden: true, webToolsAllowedNow: false, browserToolsAllowedNow: false, terminalToolsAllowedNow: false, mcpAllowedNow: false, filesystemToolsAllowedNow: false, preferredFutureToolsetMode: preferred, unexpectedToolUseMustBlock: true }
}

function outputShape(): FactoryHermesResearchExecutionBoundaryOutputShape {
  return { stdoutPreviewLimitBytes: 12000, stderrPreviewLimitBytes: 12000, sanitizeStdout: true, sanitizeStderr: true, usageFileMetadataOnly: true, outputUseAsFindingsNow: false, rawOutputPromotionForbidden: true }
}

function ingestionShape(): FactoryHermesResearchExecutionBoundaryIngestionShape {
  return { ingestionAllowedNow: false, futureIngestionRecordRequired: true, rawOutputDirectUseForbidden: true, requiresJefeReviewForFindings: true, memoryWriteAllowedNow: false, briefWriteAllowedNow: false, contextUseAllowedNow: false }
}

function timeoutShape(): FactoryHermesResearchExecutionBoundaryTimeoutShape {
  return { commandTimeoutMsDefault: 120000, commandTimeoutMsMax: 300000, hardTimeoutRequired: true, noInfiniteTimeout: true, shutdownGraceRequired: true, autoRetryAllowed: false, retryRequiresJefeReview: true, killSwitchesRequired: ['global_research', 'hermes_tool', 'provider', 'credentials', 'network', 'toolsets', 'emergency_stop'] }
}

function missingSelections(): FactoryHermesResearchExecutionBoundaryMissingSelection[] {
  return [
    { selectionId: 'promptApprovalMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Prompt Policy Planning Gate v1', reason: 'Prompt is planned as candidate-only and not approved for execution.' },
    { selectionId: 'providerSelectionMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Model Provider Policy Planning Gate v1', reason: 'Provider remains unselected.' },
    { selectionId: 'modelSelectionMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Model Provider Policy Planning Gate v1', reason: 'Model remains unselected.' },
    { selectionId: 'credentialSelectionMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Credentials Policy Planning Gate v1', reason: 'Credential refs are names only and values were not read.' },
    { selectionId: 'networkHostApprovalMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Network Policy Planning Gate v1', reason: 'No runtime host allowlist is approved now.' },
    { selectionId: 'toolsetSelectionApprovalMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Toolsets Policy Planning Gate v1', reason: 'No toolsets are approved now.' },
    { selectionId: 'runtimeRunRootApprovalMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Filesystem Mutation Policy Planning Gate v1', reason: 'Future run root candidate still requires runtime approval.' },
    { selectionId: 'finalExecutionApprovalMissing', status: 'required_before_runtime', blocksExecutionNow: true, requiredByGate: 'Factory Hermes Research Execution Approval Gate v1', reason: 'Boundary planning is not final execution approval.' },
  ]
}

function base(input: FactoryHermesResearchExecutionBoundaryPlanningInput): FactoryHermesResearchExecutionBoundaryPlanningResult {
  const boundaryCommandShape = commandShape()
  const boundaryEnvironmentShape = environmentShape()
  const boundaryFilesystemShape = filesystemShape()
  const boundaryNetworkShape = networkShape()
  const boundaryCredentialsShape = credentialsShape()
  const boundaryToolsetsShape = toolsetsShape(input)
  const boundaryOutputShape = outputShape()
  const boundaryTimeoutShape = timeoutShape()
  const boundaryIngestionShape = ingestionShape()
  const missingRuntimeSelections = missingSelections()
  return { planningId: `hermes-research-execution-boundary-planning:75b300f:${input.plannedAt}`, planningKind: FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_KIND, planningVersion: FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', commandShapeUnderConsideration: 'oneshot_real_with_provider_model', boundaryCommandShape, boundaryEnvironmentShape, boundaryFilesystemShape, boundaryNetworkShape, boundaryCredentialsShape, boundaryToolsetsShape, boundaryOutputShape, boundaryTimeoutShape, boundaryIngestionShape, missingRuntimeSelections, checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_policy_planning_result', canProceedToResearchExecutionApproval: false, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_NEXT_STEP }
}

function blocked(out: FactoryHermesResearchExecutionBoundaryPlanningResult, decision: FactoryHermesResearchExecutionBoundaryPlanningDecision, message: string): FactoryHermesResearchExecutionBoundaryPlanningResult {
  return { ...out, decision, blockers: [{ blockerId: decision, message }] }
}

export function evaluateFactoryHermesResearchExecutionBoundaryPlanning(input: FactoryHermesResearchExecutionBoundaryPlanningInput): FactoryHermesResearchExecutionBoundaryPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_BOUNDARY_PLANNING_POLICY, ...(input.policy || {}) }
  const out = base(input)
  if (policy.requirePolicyChainPlanning && (!input.policyChainPlanningResult || input.policyChainPlanningResult.status !== 'policy_chain_plan_created' || input.policyChainPlanningResult.canProceedToPromptPolicyPlanning !== true || input.policyChainPlanningResult.canProceedToResearchExecutionApproval !== false)) return blocked(out, 'blocked_policy_chain_not_ready_for_boundary_planning', 'Policy chain planning is not ready for boundary planning.')
  if (policy.requirePromptPolicyPlanning && (!input.promptPolicyPlanningResult || input.promptPolicyPlanningResult.status !== 'prompt_policy_plan_created' || input.promptPolicyPlanningResult.canPassPromptNow !== false)) return blocked(out, 'blocked_prompt_policy_not_ready_for_boundary_planning', 'Prompt policy planning is not ready.')
  const modelProviderSelection = input.modelProviderPolicyPlanningResult?.hermesModelProviderPolicyPlanCandidate?.providerSelection
  if (policy.requireModelProviderPolicyPlanning && (!input.modelProviderPolicyPlanningResult || input.modelProviderPolicyPlanningResult.status !== 'model_provider_policy_plan_created' || modelProviderSelection?.selectedProvider !== null || modelProviderSelection?.selectedModel !== null || modelProviderSelection?.providerSelectionRequired !== true || input.modelProviderPolicyPlanningResult.canCallModelsNow !== false)) return blocked(out, 'blocked_model_provider_policy_not_ready_for_boundary_planning', 'Model provider policy planning is not ready.')
  if (policy.requireCredentialsPolicyPlanning && (!input.credentialsPolicyPlanningResult || input.credentialsPolicyPlanningResult.status !== 'credentials_policy_plan_created' || input.credentialsPolicyPlanningResult.canUseCredentialsNow !== false || input.credentialsPolicyPlanningResult.canReadEnvSecretsNow !== false)) return blocked(out, 'blocked_credentials_policy_not_ready_for_boundary_planning', 'Credentials policy planning is not ready.')
  const networkPlan = input.networkPolicyPlanningResult?.hermesNetworkPolicyPlanCandidate
  if (policy.requireNetworkPolicyPlanning && (!input.networkPolicyPlanningResult || input.networkPolicyPlanningResult.status !== 'network_policy_plan_created' || networkPlan?.networkAllowedNow !== false || networkPlan?.wildcardHostsAllowed !== false || networkPlan?.arbitraryInternetAllowed !== false || (networkPlan?.allowedHostsNow || []).length !== 0)) return blocked(out, 'blocked_network_policy_not_ready_for_boundary_planning', 'Network policy planning is not ready.')
  const toolsetsPlan = input.toolsetsPolicyPlanningResult?.hermesToolsetsPolicyPlanCandidate
  if (policy.requireToolsetsPolicyPlanning && (!input.toolsetsPolicyPlanningResult || input.toolsetsPolicyPlanningResult.status !== 'toolsets_policy_plan_created' || toolsetsPlan?.toolsetsAllowedNow !== false || (toolsetsPlan?.toolsetsApprovedNow || []).length !== 0 || toolsetsPlan?.hiddenDefaultToolsetsForbidden !== true)) return blocked(out, 'blocked_toolsets_policy_not_ready_for_boundary_planning', 'Toolsets policy planning is not ready.')
  const outputPlan = input.outputContractPolicyPlanningResult?.hermesOutputContractPolicyPlanCandidate
  if (policy.requireOutputContractPolicyPlanning && (!input.outputContractPolicyPlanningResult || input.outputContractPolicyPlanningResult.status !== 'output_contract_policy_plan_created' || outputPlan?.findingsAllowedNow !== false || outputPlan?.rawOutputPromotableNow !== false)) return blocked(out, 'blocked_output_contract_not_ready_for_boundary_planning', 'Output contract policy planning is not ready.')
  const ingestionPlan = input.resultIngestionContractPlanningResult?.hermesResultIngestionContractPlanCandidate
  if (policy.requireResultIngestionContractPlanning && (!input.resultIngestionContractPlanningResult || input.resultIngestionContractPlanningResult.status !== 'result_ingestion_contract_plan_created' || ingestionPlan?.ingestionAllowedNow !== false || ingestionPlan?.findingsAllowedNow !== false || ingestionPlan?.requiresJefeReviewForFindings !== true)) return blocked(out, 'blocked_result_ingestion_contract_not_ready_for_boundary_planning', 'Result ingestion contract planning is not ready.')
  const timeoutPlan = input.timeoutKillSwitchPolicyPlanningResult?.hermesTimeoutKillSwitchPolicyPlanCandidate
  if (policy.requireTimeoutKillSwitchPolicyPlanning && (!input.timeoutKillSwitchPolicyPlanningResult || input.timeoutKillSwitchPolicyPlanningResult.status !== 'timeout_kill_switch_policy_plan_created' || timeoutPlan?.hardTimeoutRequired !== true || timeoutPlan?.noInfiniteTimeout !== true || timeoutPlan?.autoRetryAllowed !== false)) return blocked(out, 'blocked_timeout_policy_not_ready_for_boundary_planning', 'Timeout kill switch policy planning is not ready.')
  if (policy.requireFilesystemMutationPolicyPlanning && (!input.filesystemMutationPolicyPlanningResult || input.filesystemMutationPolicyPlanningResult.status !== 'filesystem_mutation_policy_plan_created' || input.filesystemMutationPolicyPlanningResult.canProceedToResearchExecutionBoundaryPlanning !== true || input.filesystemMutationPolicyPlanningResult.canMutateFilesystemNow !== false)) return blocked(out, 'blocked_filesystem_policy_not_ready_for_boundary_planning', 'Filesystem mutation policy planning is not ready.')
  const receipt = { receiptId: `${out.planningId}:receipt`, planningId: out.planningId, toolId: 'hermes_agent' as const, plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision: 'hermes_research_execution_boundary_plan_created' as const, scope: 'hermes_research_execution_boundary_planning_only' as const, approvedNextGate: 'Factory Hermes Research Execution Approval Gate v1' as const, limitations: ['Boundary planning only consolidates previous policies.', 'Research execution approval can evaluate this plan, but no execution is authorized now.', 'Prompt, provider, model, credentials, network hosts, toolsets, run root, and final approval remain missing runtime selections.'], notAuthorizedActions: RESEARCH_EXECUTION_BOUNDARY_NOT_AUTHORIZED_ACTIONS }
  const plan = { planCandidateId: `${out.planningId}:boundary-plan-candidate`, toolId: 'hermes_agent' as const, commandShapeUnderConsideration: 'oneshot_real_with_provider_model' as const, boundaryCommandShape: out.boundaryCommandShape, boundaryEnvironmentShape: out.boundaryEnvironmentShape, boundaryFilesystemShape: out.boundaryFilesystemShape, boundaryNetworkShape: out.boundaryNetworkShape, boundaryCredentialsShape: out.boundaryCredentialsShape, boundaryToolsetsShape: out.boundaryToolsetsShape, boundaryOutputShape: out.boundaryOutputShape, boundaryIngestionShape: out.boundaryIngestionShape, boundaryTimeoutShape: out.boundaryTimeoutShape, missingRuntimeSelections: out.missingRuntimeSelections, executionAllowedNow: false as const, researchExecutionAllowedNow: false as const, finalApprovalRequired: true as const, approvalGateCanEvaluate: true as const, allPoliciesConsolidated: true as const, canProceedToResearchExecutionApproval: true as const, canRunResearchNow: false as const, canExecuteHermesNow: false as const }
  return { ...out, researchExecutionBoundaryPlanningReceipt: receipt, hermesResearchExecutionBoundaryPlanCandidate: plan, status: 'research_execution_boundary_plan_created', decision: 'hermes_research_execution_boundary_plan_created', canProceedToResearchExecutionApproval: true }
}
