import { DEFAULT_FACTORY_HERMES_PROMPT_POLICY_PLANNING_POLICY, DEFAULT_PROMPT_CANDIDATE_SHA256, DEFAULT_PROMPT_CANDIDATE_TEXT, DEFAULT_PROMPT_MAX_CHARS, DEFAULT_PROMPT_MAX_LINES, FACTORY_HERMES_PROMPT_POLICY_PLANNING_KIND, FACTORY_HERMES_PROMPT_POLICY_PLANNING_NEXT_STEP, FACTORY_HERMES_PROMPT_POLICY_PLANNING_VERSION, PROMPT_POLICY_NOT_AUTHORIZED_ACTIONS, PROMPT_REQUIRED_NEXT_POLICIES } from './hermes-prompt-policy-planning.defaults.ts'
import type { FactoryHermesPromptPolicyPlanCandidate, FactoryHermesPromptPolicyPlanningInput, FactoryHermesPromptPolicyPlanningResult } from './hermes-prompt-policy-planning.types.ts'

export function sha256PromptCandidate(text: string): string {
  if (text !== DEFAULT_PROMPT_CANDIDATE_TEXT) throw new Error('unsupported_prompt_candidate_hash_request')
  return DEFAULT_PROMPT_CANDIDATE_SHA256
}

export function buildPromptPolicyPlanCandidate(planningId: string): FactoryHermesPromptPolicyPlanCandidate {
  return {
    planCandidateId: `${planningId}:prompt-policy-plan-candidate`,
    toolId: 'hermes_agent',
    commandShapeUnderConsideration: 'oneshot_real_with_provider_model',
    futureCommandShape: {
      executable: 'hermes.exe',
      argsTemplate: ['--oneshot', '<PROMPT>'],
      shell: false,
      promptPosition: 'argv[1]',
    },
    promptCandidate: {
      text: DEFAULT_PROMPT_CANDIDATE_TEXT,
      candidateOnly: true,
      notApprovedForExecutionYet: true,
      maxChars: DEFAULT_PROMPT_MAX_CHARS,
      maxLines: DEFAULT_PROMPT_MAX_LINES,
      sha256: sha256PromptCandidate(DEFAULT_PROMPT_CANDIDATE_TEXT),
    },
    promptRules: {
      purpose: {
        ruleId: 'prompt_purpose',
        ruleName: 'Prompt purpose',
        requirements: [
          'First future prompt must be harmless, operational and bounded.',
          'Prompt must not request browsing, web search, terminal, filesystem, secrets, credentials or external actions.',
          'Prompt must not request dangerous executable code, scraping, private-data extraction, file mutation, login or account use.',
        ],
      },
      length: {
        ruleId: 'prompt_length',
        ruleName: 'Prompt length',
        requirements: [
          `Prompt maxChars must be ${DEFAULT_PROMPT_MAX_CHARS} or less.`,
          `Prompt maxLines must be ${DEFAULT_PROMPT_MAX_LINES} or less.`,
          'No attachments, complex markdown or hidden instructions are allowed.',
        ],
      },
      allowlist: [
        'short functional test question',
        'textual reasoning task without tools',
        'artificial non-sensitive content',
        'no real names',
        'no personal data',
        'no secrets',
        'no URLs',
        'no files',
      ],
      blocklist: [
        'secrets/API keys/tokens/passwords',
        'personal data',
        'credentials',
        'external URLs',
        'network/web/browser/search instructions',
        'terminal/shell/executable code instructions',
        'filesystem instructions',
        'tool calls',
        'model/provider override',
        'prompt injection',
        'ignore previous instructions',
        'memory use',
        'output as final usable decision or findings',
      ],
      injectionDefense: [
        'Reject prompts that attempt to change JEFE policies.',
        'Reject prompts that ask to reveal system or developer messages.',
        'Reject prompts that ask to use unapproved tools.',
      ],
      loggingPolicy: [
        'Store the prompt candidate only in governed artifacts.',
        'Do not print the prompt in unnecessary extended logs.',
        'Never include secrets in prompt artifacts.',
        'Store a sha256 hash for candidate integrity.',
      ],
    },
    requiredNextPolicies: PROMPT_REQUIRED_NEXT_POLICIES,
    constraints: {
      noPromptExecutionNow: true,
      noHermesExecutionNow: true,
      noResearchNow: true,
      noFindingsNow: true,
      promptCannotContainSecrets: true,
      promptCannotRequestTools: true,
      promptCannotRequestNetwork: true,
      promptCannotRequestFilesystem: true,
    },
    canProceedToModelProviderPolicyPlanning: true,
    canProceedToResearchExecutionApproval: false,
    canPassPromptNow: false,
  }
}

function base(input: FactoryHermesPromptPolicyPlanningInput): FactoryHermesPromptPolicyPlanningResult {
  return {
    planningId: `hermes-prompt-policy-planning:75b300f:${input.plannedAt}`,
    planningKind: FACTORY_HERMES_PROMPT_POLICY_PLANNING_KIND,
    planningVersion: FACTORY_HERMES_PROMPT_POLICY_PLANNING_VERSION,
    plannedAt: input.plannedAt,
    plannedBy: input.plannedBy,
    toolId: 'hermes_agent',
    commandShapeUnderConsideration: 'oneshot_real_with_provider_model',
    futureCommandShape: 'hermes.exe --oneshot "<PROMPT>"',
    checks: [],
    blockers: [],
    warnings: [],
    status: 'blocked',
    decision: 'blocked_missing_policy_chain_planning',
    canProceedToModelProviderPolicyPlanning: false,
    canProceedToResearchExecutionApproval: false,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    canPassPromptNow: false,
    canUseNetworkNow: false,
    canUseCredentialsNow: false,
    canCallModelsNow: false,
    canUseFindings: false,
    recommendedNextStep: FACTORY_HERMES_PROMPT_POLICY_PLANNING_NEXT_STEP,
  }
}

export function evaluateFactoryHermesPromptPolicyPlanning(input: FactoryHermesPromptPolicyPlanningInput): FactoryHermesPromptPolicyPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_PROMPT_POLICY_PLANNING_POLICY, ...(input.policy || {}) }
  const out = base(input)
  const chain = input.policyChainPlanningResult
  const deep = input.deepSourceReview
  if (!chain) return { ...out, blockers: [{ blockerId: 'blocked_missing_policy_chain_planning', message: 'Policy chain planning result is required.' }] }
  if (
    policy.requirePolicyChainPlanning &&
    (chain.status !== 'policy_chain_plan_created' ||
      chain.decision !== 'hermes_research_execution_policy_chain_plan_created' ||
      chain.canProceedToPromptPolicyPlanning !== true ||
      chain.canProceedToResearchExecutionApproval !== false ||
      chain.canRunResearchNow !== false ||
      chain.canExecuteHermesNow !== false ||
      chain.canPassPromptNow !== false ||
      chain.canUseNetworkNow !== false ||
      chain.canUseCredentialsNow !== false ||
      chain.canCallModelsNow !== false)
  ) {
    return { ...out, decision: 'blocked_policy_chain_not_ready_for_prompt_policy', blockers: [{ blockerId: 'blocked_policy_chain_not_ready_for_prompt_policy', message: 'Policy chain planning is not ready for prompt policy planning.' }] }
  }
  if (!chain.requiredPolicies?.some((p: any) => p.policyName === 'Prompt Policy') || chain.proposedGateSequence?.[0]?.gateName !== 'Factory Hermes Prompt Policy Planning Gate v1') {
    return { ...out, decision: 'blocked_policy_chain_not_ready_for_prompt_policy', blockers: [{ blockerId: 'blocked_policy_chain_not_ready_for_prompt_policy', message: 'Prompt Policy is not first in the policy chain.' }] }
  }
  if (deep) {
    const real = deep.commandContractCandidates?.find((c: any) => c.id === 'oneshot_real_with_provider_model')
    const mock = deep.commandContractCandidates?.find((c: any) => c.id === 'oneshot_mock_or_offline')
    if (deep.recommendedDefault !== 'KEEP_BLOCKED_UNTIL_POLICY_CHAIN' || real?.recommendation !== 'requires_policy_chain' || mock?.recommendation !== 'not_available' || deep.noExecutionPerformed !== true) {
      return { ...out, decision: 'blocked_deep_source_review_not_policy_chain', blockers: [{ blockerId: 'blocked_deep_source_review_not_policy_chain', message: 'Deep source review does not support prompt policy planning.' }] }
    }
  }
  if (chain.canUseFindings !== false) return { ...out, decision: 'blocked_unsafe_prior_execution_state', blockers: [{ blockerId: 'blocked_unsafe_prior_execution_state', message: 'Prior chain unexpectedly allows findings.' }] }
  const plan = buildPromptPolicyPlanCandidate(out.planningId)
  const receipt = {
    receiptId: `${out.planningId}:receipt`,
    planningId: out.planningId,
    toolId: 'hermes_agent' as const,
    plannedBy: input.plannedBy,
    plannedAt: input.plannedAt,
    decision: 'hermes_prompt_policy_plan_created' as const,
    scope: 'hermes_prompt_policy_planning_only' as const,
    approvedNextGate: 'Factory Hermes Model Provider Policy Planning Gate v1' as const,
    limitations: [
      'Prompt candidate is candidate-only and not approved for execution.',
      'No prompt may be sent to Hermes in this gate.',
      'Model provider, credentials, network, toolsets, output and boundary policies remain required.',
    ],
    notAuthorizedActions: PROMPT_POLICY_NOT_AUTHORIZED_ACTIONS,
  }
  return { ...out, status: 'prompt_policy_plan_created', decision: 'hermes_prompt_policy_plan_created', promptPolicyPlanningReceipt: receipt, hermesPromptPolicyPlanCandidate: plan, canProceedToModelProviderPolicyPlanning: true }
}
