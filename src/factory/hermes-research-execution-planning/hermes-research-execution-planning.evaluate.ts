import { DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_POLICY, FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_KIND, FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_NEXT_STEP, FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_NOT_AUTHORIZED_ACTIONS, FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_VERSION } from './hermes-research-execution-planning.defaults.ts'
import type { FactoryHermesResearchExecutionMethodCandidate, FactoryHermesResearchExecutionPlanningInput, FactoryHermesResearchExecutionPlanningResult } from './hermes-research-execution-planning.types.ts'

function makeCandidates(input: FactoryHermesResearchExecutionPlanningInput): FactoryHermesResearchExecutionMethodCandidate[] {
  const h = input.helpProbeInspectionSummary
  const s = input.sourceInspectionSummary
  return [
    { candidateId: 'help-derived-oneshot-prompt', methodType: 'help_derived_noninteractive_research_command', status: 'manual_review_required', commandShapeText: 'hermes --oneshot <bounded-prompt>', evidence: h?.hasOneshotPromptFlag ? ['Help output exposes -z PROMPT / --oneshot PROMPT.'] : ['No help-derived oneshot flag was confirmed.'], risks: ['Prompt passing can trigger model calls, tools, memory, rules and approvals auto-bypass according to help text.'], requiresNetwork: true, requiresCredentials: true, mayCallModels: true, canBeApprovedNow: false },
    { candidateId: 'source-mapped-cli-entrypoint', methodType: 'source_mapped_research_command', status: 'manual_review_required', commandShapeText: 'source-mapped hermes_cli.main:main command invocation', evidence: [s?.consoleScriptEvidence || 'Console script/source mapping requires review before execution.'], risks: ['Source routing needs a bounded command/output contract before runtime execution.'], requiresNetwork: true, requiresCredentials: true, mayCallModels: true, canBeApprovedNow: false },
    { candidateId: 'interactive-cli-session', methodType: 'interactive_cli_research_session', status: 'not_recommended_for_now', commandShapeText: 'hermes chat / interactive session', evidence: ['Help output identifies interactive chat/session modes.'], risks: ['Interactive execution is difficult to bound and ingest deterministically.'], requiresNetwork: true, requiresCredentials: true, mayCallModels: true, canBeApprovedNow: false },
    { candidateId: 'networked-research-execution', methodType: 'networked_research_execution', status: 'requires_future_policy', commandShapeText: 'future network-authorized Hermes research command', evidence: ['Research execution may require provider/network access.'], risks: ['Network access is not authorized by this planning gate.'], requiresNetwork: true, requiresCredentials: false, mayCallModels: true, canBeApprovedNow: false },
    { candidateId: 'credentialed-model-research-execution', methodType: 'credentialed_model_research_execution', status: 'forbidden_until_credentials_policy', commandShapeText: 'future credentialed provider/model invocation', evidence: h?.hasProviderFlag || h?.hasModelFlag ? ['Help output exposes provider/model flags.'] : ['Credentialed model execution requires a later policy.'], risks: ['Credentials and model calls are forbidden in this gate.'], requiresNetwork: true, requiresCredentials: true, mayCallModels: true, canBeApprovedNow: false },
    { candidateId: 'mock-or-dry-run-research-execution', methodType: 'mock_or_dry_run_research_execution', status: h?.hasExplicitDryRunOrMockFlag || s?.safeMockOrDryRunEvidence ? 'manual_review_required' : 'manual_review_required', commandShapeText: 'future mock/dry-run command if explicit support is proven', evidence: h?.hasExplicitDryRunOrMockFlag || s?.safeMockOrDryRunEvidence ? ['Potential mock/dry-run evidence found but requires manual confirmation.'] : ['No explicit mock/dry-run research mode is proven by the inspected evidence.'], risks: ['A fake dry-run assumption could accidentally execute real model/provider behavior.'], requiresNetwork: false, requiresCredentials: false, mayCallModels: false, canBeApprovedNow: false },
    { candidateId: 'help-output-as-research-source', methodType: 'help_output_as_research_source', status: 'forbidden', commandShapeText: 'use help output as findings', evidence: ['JEFE Review v2 explicitly says help output is operational evidence only.'], risks: ['Help output is not research and cannot become findings.'], requiresNetwork: false, requiresCredentials: false, mayCallModels: false, canBeApprovedNow: false },
  ]
}

function base(input: FactoryHermesResearchExecutionPlanningInput): FactoryHermesResearchExecutionPlanningResult {
  const review = input.researchJefeReviewV2Result || {}
  return {
    planningId: `hermes-research-execution-planning:75b300f:${input.plannedAt}`,
    planningKind: FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_KIND,
    planningVersion: FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_VERSION,
    plannedAt: input.plannedAt,
    plannedBy: input.plannedBy,
    toolId: 'hermes_agent',
    commandName: review.commandName || '',
    pythonEntrypoint: review.pythonEntrypoint || '',
    executableRef: review.executableRef || '',
    executableSha256: review.executableSha256 || '',
    currentVerifiedCapability: 'help_probe_only',
    helpProbeInspectionSummary: input.helpProbeInspectionSummary,
    sourceInspectionSummary: input.sourceInspectionSummary,
    methodCandidates: makeCandidates(input),
    checks: [],
    blockers: [],
    warnings: [],
    status: 'blocked',
    decision: 'blocked_missing_jefe_review_v2',
    canProceedToResearchExecutionApproval: false,
    canRunResearchNow: false,
    canExecuteHermesNow: false,
    canPassPromptNow: false,
    canUseNetworkNow: false,
    canUseCredentialsNow: false,
    canCallModelsNow: false,
    canUseFindings: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    networkStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    hermesExecutionStatus: 'not_executed',
    recommendedNextStep: FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_NEXT_STEP,
  }
}

export function evaluateFactoryHermesResearchExecutionPlanning(input: FactoryHermesResearchExecutionPlanningInput): FactoryHermesResearchExecutionPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_POLICY, ...(input.policy || {}) }
  const review = input.researchJefeReviewV2Result
  const result = base(input)
  if (!review) return { ...result, blockers: [{ blockerId: 'blocked_missing_jefe_review_v2', message: 'Research JEFE Review v2 result is required.' }] }
  if (policy.requireJefeReviewV2Approved && (review.status !== 'approved_for_research_execution_planning' || review.decision !== 'hermes_research_jefe_review_v2_approved_research_execution_planning' || review.canProceedToResearchExecutionPlanning !== true)) return { ...result, decision: 'blocked_jefe_review_v2_not_approved', blockers: [{ blockerId: 'blocked_jefe_review_v2_not_approved', message: 'Research JEFE Review v2 is not approved for execution planning.' }] }
  if (review.canRunResearchNow !== false || review.canExecuteHermesNow !== false || review.canUseNetworkNow !== false || review.canUseCredentials !== false || review.canCallModelsNow !== false || review.canUseFindings !== false) return { ...result, decision: 'blocked_unsafe_planning_input', blockers: [{ blockerId: 'blocked_unsafe_planning_input', message: 'Review v2 contains unsafe now-permissions.' }] }
  if (policy.requireHelpProbeSucceeded && (review.helpProbeStatus !== 'succeeded' || input.helpProbeInspectionSummary?.helpProbeStatus !== 'succeeded')) return { ...result, decision: 'blocked_help_probe_not_available', blockers: [{ blockerId: 'blocked_help_probe_not_available', message: 'Successful help probe inspection is required.' }] }

  const selected = result.methodCandidates.find((c) => c.canBeApprovedNow)
  const receipt = { receiptId: `${result.planningId}:receipt`, planningId: result.planningId, toolId: 'hermes_agent' as const, plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision: selected ? 'hermes_research_execution_plan_candidate_created' as const : 'hermes_research_execution_requires_manual_command_review' as const, scope: 'hermes_research_execution_planning_only' as const, approvedNextGate: selected ? 'Factory Hermes Research Execution Approval Gate v1' as const : undefined, limitations: ['This gate does not execute Hermes or pass prompts.', 'Help output is operational evidence only and is not research findings.', 'Prompt/model/network/credential behavior requires explicit future approval.'], notAuthorizedActions: FACTORY_HERMES_RESEARCH_EXECUTION_PLANNING_NOT_AUTHORIZED_ACTIONS }

  if (!selected) return { ...result, status: 'manual_review_required', decision: 'hermes_research_execution_requires_manual_command_review', researchExecutionPlanningReceipt: receipt, warnings: [{ warningId: 'manual_command_review_required', message: 'Help/source evidence does not prove a safe offline research command shape.' }] }

  const plan = { planId: `${result.planningId}:plan-candidate`, toolId: 'hermes_agent' as const, commandName: 'hermes' as const, pythonEntrypoint: 'hermes_cli.main:main' as const, executableRef: result.executableRef, selectedMethodCandidateId: selected.candidateId, commandShapeText: selected.commandShapeText, promptPolicy: 'future approval required', networkPolicy: 'not allowed until approved', credentialsPolicy: 'not allowed until approved', modelCallPolicy: 'not allowed until approved', outputPolicy: 'future ingestion contract required', requiredNextGate: 'Factory Hermes Research Execution Approval Gate v1' as const, canRunResearchNow: false as const, canExecuteHermesNow: false as const }
  return { ...result, status: 'plan_candidate_created', decision: 'hermes_research_execution_plan_candidate_created', selectedMethodCandidate: selected, researchExecutionPlanningReceipt: receipt, hermesResearchExecutionPlanCandidate: plan, canProceedToResearchExecutionApproval: true, recommendedNextStep: 'Proceed to Factory Hermes Research Execution Approval Gate v1; do not execute Hermes yet.' }
}
