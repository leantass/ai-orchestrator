import { DEFAULT_FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_POLICY, FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_KIND, FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_NEXT_STEP, FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_VERSION, RUNTIME_SELECTION_NOT_AUTHORIZED_ACTIONS } from './hermes-runtime-selection-planning.defaults.ts'
import type { FactoryHermesRuntimeSelectionDecisionPack, FactoryHermesRuntimeSelectionPlanningInput, FactoryHermesRuntimeSelectionPlanningResult, FactoryHermesRuntimeSelectionRequirement } from './hermes-runtime-selection-planning.types.ts'

const REQUIREMENTS = ['promptApproval', 'providerSelection', 'modelSelection', 'credentialSelection', 'networkHostApproval', 'toolsetSelectionApproval', 'runtimeRunRootApproval', 'finalExecutionApproval']
const INSTALL_ROOT = '.codex-temp/external-tools/hermes-agent/install/75b300f'

function reqs(approval: any): FactoryHermesRuntimeSelectionRequirement[] {
  return (approval?.runtimeSelectionRequirements || []).map((item: any) => ({ requirementId: item.requirementId, status: 'required_not_satisfied', blocksExecutionNow: true, reason: item.reason || 'Manual runtime selection is required.' }))
}

function promptCandidates(policies: Record<string, any>) {
  const candidate = policies.promptPolicyPlanning?.hermesPromptPolicyPlanCandidate?.promptCandidate || {}
  return [{ candidateId: 'prompt-policy-candidate-1', status: 'candidate_only_requires_human_approval' as const, selectedNow: false as const, approvedForExecutionNow: false as const, promptHash: candidate.sha256, text: candidate.text, policyRequirements: ['no secrets', 'no URLs', 'no tools', 'no personal data', 'no network request', 'no filesystem request'] }]
}

function providerCandidates() {
  return [
    { candidateId: 'provider-openai', providerId: 'openai', status: 'manual_selection_required' as const, selectedNow: false as const, approvedForExecutionNow: false as const },
    { candidateId: 'provider-anthropic', providerId: 'anthropic', status: 'manual_selection_required' as const, selectedNow: false as const, approvedForExecutionNow: false as const },
    { candidateId: 'provider-gemini-google', providerId: 'gemini_google', status: 'manual_selection_required' as const, selectedNow: false as const, approvedForExecutionNow: false as const },
    { candidateId: 'provider-local-offline-mock', providerId: 'local_offline_mock', status: 'not_available' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Deep source review did not find a contractual mock/offline provider.' },
    { candidateId: 'provider-default-from-env-or-config', providerId: 'default_from_env_or_config', status: 'forbidden' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Hidden env/config defaults are forbidden.' },
  ]
}

function decisionPack(): FactoryHermesRuntimeSelectionDecisionPack {
  const mk = (decisionId: string, options: string[], recommendedConservativeOption: string, risks: string[]) => ({ decisionId, currentStatus: 'pending_human_decision' as const, options, recommendedConservativeOption, risks, blockedUntilChosen: true as const })
  return { packId: 'hermes-runtime-selection-decision-pack:75b300f', decisions: [
    mk('choose_prompt_exact_or_candidate', ['approve prompt candidate', 'provide exact replacement prompt', 'keep blocked'], 'keep blocked', ['prompt may request tools/network/secrets if not reviewed']),
    mk('choose_provider_explicit', ['openai', 'anthropic', 'gemini_google', 'keep blocked'], 'keep blocked', ['provider implies credentials/network/model calls']),
    mk('choose_model_exact', ['exact model string', 'keep blocked'], 'keep blocked', ['wildcards/latest aliases can drift']),
    mk('choose_credential_ref', ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'keep blocked'], 'keep blocked', ['credential exposure risk']),
    mk('choose_network_hosts', ['exact provider hosts', 'keep network blocked'], 'keep network blocked', ['network egress risk']),
    mk('choose_toolset_mode', ['no_toolsets_text_only', 'explicit toolsets', 'keep toolsets blocked'], 'no_toolsets_text_only', ['toolsets may browse, use terminal, or mutate files']),
    mk('approve_run_root', [`${INSTALL_ROOT}/research-runs/<runId>/`, 'keep blocked'], 'keep blocked', ['path containment must be proven']),
    mk('approve_final_execution_retry', ['approve retry after selections', 'keep blocked'], 'keep blocked', ['final approval is the last execution guard']),
  ] }
}

export function evaluateFactoryHermesRuntimeSelectionPlanning(input: FactoryHermesRuntimeSelectionPlanningInput): FactoryHermesRuntimeSelectionPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_POLICY, ...(input.policy || {}) }
  const approval = input.researchExecutionApprovalResult
  const policies = input.policyPlanningResults || {}
  const planningId = `hermes-runtime-selection-planning:75b300f:${input.plannedAt}`
  const runtimeSelectionRequirements = reqs(approval)
  const promptSelectionCandidates = promptCandidates(policies)
  const providerSelectionCandidates = providerCandidates()
  const modelSelectionCandidates = [{ candidateId: 'model-exact-string-required', status: 'manual_exact_model_selection_required' as const, selectedModel: null, selectedNow: false as const, approvedForExecutionNow: false as const, noWildcard: true as const, noLatestAliasWithoutExplicitApproval: true as const }]
  const credentialSelectionCandidates = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY'].map((credentialRef) => ({ candidateId: `credential-${credentialRef}`, credentialRef, valueKnown: false as const, valueRead: false as const, selectedNow: false as const, approvedForUseNow: false as const }))
  const networkPlan = policies.networkPolicyPlanning?.hermesNetworkPolicyPlanCandidate
  const hostCandidates = (networkPlan?.providerNetworkCandidates || []).flatMap((item: any) => item.hostCandidates || [])
  const networkHostSelectionCandidates = [{ candidateId: 'network-hosts-manual-selection-required', hostCandidates, selectedHostsNow: [] as [], approvedHostsNow: [] as [], wildcardAllowed: false as const, arbitraryInternetAllowed: false as const, status: 'manual_exact_host_selection_required' as const }]
  const toolsetSelectionCandidates = [
    { candidateId: 'toolset-no-toolsets-text-only', toolsetId: 'no_toolsets_text_only', status: 'candidate_requires_approval' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Conservative mode if supported by future decision.' },
    { candidateId: 'toolset-default-cli', toolsetId: 'default_cli_toolsets', status: 'forbidden' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Hidden defaults forbidden.' },
    { candidateId: 'toolset-web', toolsetId: 'web_toolset', status: 'forbidden_until_policy' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Requires network/toolsets approval.' },
    { candidateId: 'toolset-browser', toolsetId: 'browser_toolset', status: 'forbidden_until_policy' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Requires network/toolsets approval.' },
    { candidateId: 'toolset-terminal', toolsetId: 'terminal_toolset', status: 'forbidden' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Terminal tools forbidden for this planning path.' },
    { candidateId: 'toolset-filesystem', toolsetId: 'filesystem_toolset', status: 'forbidden_until_policy' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Requires filesystem policy/runtime evidence.' },
    { candidateId: 'toolset-mcp', toolsetId: 'mcp_toolset', status: 'forbidden_until_policy' as const, selectedNow: false as const, approvedForExecutionNow: false as const, reason: 'Requires MCP policy.' },
  ]
  const runtimeRunRootSelectionCandidates = [{ candidateId: 'codex-temp-run-root-pattern', rootPattern: `${INSTALL_ROOT}/research-runs/<runId>/`, selectedRunRootNow: null, runRootCreatedNow: false as const, approvalRequired: true as const, pathContainmentRequired: true as const }]
  const finalApprovalSelectionCandidate = { candidateId: 'final-execution-approval-required', finalExecutionApprovalRequired: true as const, approvedNow: false as const, approvalRetryRequired: true as const }
  const leanRuntimeSelectionDecisionPack = decisionPack()
  const receipt = { receiptId: `${planningId}:receipt`, planningId, toolId: 'hermes_agent' as const, plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision: 'hermes_runtime_selection_plan_created_manual_selection_required' as const, scope: 'hermes_runtime_selection_planning_only' as const, approvedNextGate: 'Factory Hermes Runtime Selection Decision Gate v1' as const, limitations: ['No final runtime values are selected.', 'No execution, prompt passing, network, credentials, model calls, toolsets, or run root creation are authorized.'], notAuthorizedActions: RUNTIME_SELECTION_NOT_AUTHORIZED_ACTIONS }
  const plan = { planCandidateId: `${planningId}:plan-candidate`, toolId: 'hermes_agent' as const, commandShapeUnderConsideration: 'oneshot_real_with_provider_model' as const, futureCommandShape: { executable: 'hermes.exe' as const, argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>'] as ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>'], shell: false as const }, promptSelectionCandidates, providerSelectionCandidates, modelSelectionCandidates, credentialSelectionCandidates, networkHostSelectionCandidates, toolsetSelectionCandidates, runtimeRunRootSelectionCandidates, finalApprovalSelectionCandidate, leanRuntimeSelectionDecisionPack, allSelectionsResolvedNow: false as const, executionApprovalRetryAllowedNow: false as const, runtimeAdapterAllowedNow: false as const, researchExecutionAllowedNow: false as const, finalHumanDecisionRequired: true as const, canProceedToRuntimeSelectionDecision: true as const, canProceedToResearchExecutionApprovalRetry: false as const, canProceedToResearchRuntimeAdapter: false as const, canRunResearchNow: false as const }
  const base = { planningId, planningKind: FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_KIND, planningVersion: FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent' as const, approvalDecisionRef: approval?.approvalId, boundaryDecisionRef: input.researchExecutionBoundaryPlanningResult?.planningId, commandShapeUnderConsideration: 'oneshot_real_with_provider_model' as const, promptSelectionCandidates, providerSelectionCandidates, modelSelectionCandidates, credentialSelectionCandidates, networkHostSelectionCandidates, toolsetSelectionCandidates, runtimeRunRootSelectionCandidates, finalApprovalSelectionCandidate, runtimeSelectionRequirements, leanRuntimeSelectionDecisionPack, checks: [], blockers: [], warnings: [], status: 'runtime_selection_plan_created' as const, decision: 'hermes_runtime_selection_plan_created_manual_selection_required' as const, canProceedToRuntimeSelectionDecision: true, canProceedToResearchExecutionApprovalRetry: false as const, canProceedToResearchRuntimeAdapter: false as const, canRunResearchNow: false as const, canExecuteHermesNow: false as const, canPassPromptNow: false as const, canUseNetworkNow: false as const, canUseCredentialsNow: false as const, canReadEnvSecretsNow: false as const, canCallModelsNow: false as const, canEnableToolsetsNow: false as const, canMutateFilesystemNow: false as const, canUseFindings: false as const, recommendedNextStep: FACTORY_HERMES_RUNTIME_SELECTION_PLANNING_NEXT_STEP }
  const okApproval = !policy.requireResearchExecutionApprovalBlocked || (approval?.status === 'research_execution_approval_blocked' && approval?.decision === 'hermes_research_execution_approval_blocked_missing_runtime_selections' && approval?.approvalStatus === 'not_approved' && approval?.canProceedToRuntimeSelectionPlanning === true && approval?.canProceedToResearchRuntimeAdapter === false && approval?.canRunResearchNow === false)
  const hasReqs = REQUIREMENTS.every((id) => runtimeSelectionRequirements.some((item) => item.requirementId === id && item.status === 'required_not_satisfied' && item.blocksExecutionNow === true))
  if (!okApproval || !hasReqs) return { ...base, status: 'blocked', decision: 'blocked_invalid_research_execution_approval', canProceedToRuntimeSelectionDecision: false, blockers: [{ blockerId: 'invalid_research_execution_approval', message: 'Research execution approval result is not ready for runtime selection planning.' }] }
  return { ...base, runtimeSelectionPlanningReceipt: receipt, hermesRuntimeSelectionPlanCandidate: plan }
}
