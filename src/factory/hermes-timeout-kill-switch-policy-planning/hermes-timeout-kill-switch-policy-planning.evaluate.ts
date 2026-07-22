import { DEFAULT_FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_POLICY, FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_KIND, FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_NEXT_STEP, FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_VERSION, TIMEOUT_KILL_SWITCH_NOT_AUTHORIZED_ACTIONS, TIMEOUT_KILL_SWITCH_REQUIRED_NEXT_POLICIES } from './hermes-timeout-kill-switch-policy-planning.defaults.ts'
import type { FactoryHermesKillSwitchPolicyRule, FactoryHermesRetryPolicyRule, FactoryHermesRuntimeAbortReportingShape, FactoryHermesTimeoutKillSwitchPolicyPlanningInput, FactoryHermesTimeoutKillSwitchPolicyPlanningResult, FactoryHermesTimeoutPolicyRule } from './hermes-timeout-kill-switch-policy-planning.types.ts'

function timeoutRules(): FactoryHermesTimeoutPolicyRule[] {
  return [
    { ruleId: 'process_timeout', commandTimeoutMsDefault: 120000, commandTimeoutMsMax: 300000, hardTimeoutRequired: true, noInfiniteTimeout: true },
    { ruleId: 'startup_timeout', startupTimeoutMsDefault: 30000, startupTimeoutMsMax: 60000, appliesTo: 'process startup / first output / readiness if supported' },
    { ruleId: 'output_idle_timeout', outputIdleTimeoutMsDefault: 60000, outputIdleTimeoutMsMax: 120000, appliesTo: 'no stdout/stderr activity if runtime supports detection', status: 'future_candidate' },
    { ruleId: 'shutdown_grace', shutdownGraceMsDefault: 5000, shutdownGraceMsMax: 15000, killAfterGrace: true },
    { ruleId: 'output_limit', stdoutPreviewLimitBytes: 12000, stderrPreviewLimitBytes: 12000, maxCapturedOutputBytesFuture: 1048576, truncateBeforeStorage: true },
    { ruleId: 'usage_file_timeout_dependency', notes: ['usage-file write must complete before process exit or be marked missing.', 'missing usage-file is not fatal unless future approval requires it.'] },
    { ruleId: 'timeout_classification', classifications: ['timed_out', 'killed_after_timeout', 'killed_by_kill_switch', 'completed', 'controlled_failure'] },
  ]
}

function killSwitchRules(): FactoryHermesKillSwitchPolicyRule[] {
  return [
    { ruleId: 'global_research_kill_switch', required: true, defaultState: 'disabled_until_explicit_runtime_approval', behavior: 'If enabled false at runtime, runtime must block before execution.' },
    { ruleId: 'hermes_tool_kill_switch', required: true, appliesTo: 'Hermes external tool' },
    { ruleId: 'provider_kill_switch', required: true, appliesTo: 'selected provider/model' },
    { ruleId: 'credentials_kill_switch', required: true, behavior: 'Blocks credential injection if active.' },
    { ruleId: 'network_kill_switch', required: true, behavior: 'Blocks outbound network if active or if network policy unavailable.' },
    { ruleId: 'toolsets_kill_switch', required: true, behavior: 'Blocks all toolsets unless explicitly approved.' },
    { ruleId: 'emergency_stop', required: true, behavior: 'Can abort running process in future runtime; runtime must report emergencyStopStatus.' },
    { ruleId: 'no_disable_in_runtime', required: true, behavior: 'Runtime cannot disable kill switches; only approval/boundary gates set effective policy.' },
    { ruleId: 'kill_reporting', required: true, reportedFields: ['killSwitchStatus', 'killSwitchesChecked', 'killSwitchBlockers', 'killed', 'killReason', 'killSignal', 'killTimestamp'] },
  ]
}

function retryRules(): FactoryHermesRetryPolicyRule[] {
  return [
    { ruleId: 'no_auto_retry_initial_research', autoRetryAllowed: false, reason: 'First bounded research execution must not retry automatically.' },
    { ruleId: 'retry_requires_jefe_review', retryRequiresJefeReview: true, reason: 'Retry after timeout/failure requires separate ingestion and JEFE Review.' },
    { ruleId: 'no_provider_fallback_retry', reason: 'No fallback provider/model on failure.' },
    { ruleId: 'no_network_retry_expansion', reason: 'No expanding network/hosts on retry.' },
    { ruleId: 'no_prompt_mutation_retry', reason: 'No modifying prompt automatically.' },
    { ruleId: 'no_toolset_retry_expansion', reason: 'No enabling tools after failure.' },
  ]
}

function abortShape(): FactoryHermesRuntimeAbortReportingShape {
  return { requiredFields: ['runId', 'timeoutPolicyRef', 'commandTimeoutMs', 'startupTimeoutMs', 'outputIdleTimeoutMs', 'shutdownGraceMs', 'timedOut', 'timeoutKind', 'killed', 'killReason', 'killSignal', 'killSwitchStatus', 'killSwitchesChecked', 'emergencyStopStatus', 'retryAttempted', 'retryAllowed', 'retryReason', 'processExitCode', 'processSignal', 'durationMs', 'stdoutTruncated', 'stderrTruncated', 'outputLimitExceeded', 'normalizedOutcome'], forbiddenFields: ['secrets', 'fullEnv', 'fullStdout', 'fullStderr'] }
}

function base(input: FactoryHermesTimeoutKillSwitchPolicyPlanningInput): FactoryHermesTimeoutKillSwitchPolicyPlanningResult {
  return { planningId: `hermes-timeout-kill-switch-policy-planning:75b300f:${input.plannedAt}`, planningKind: FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_KIND, planningVersion: FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', commandShapeUnderConsideration: 'oneshot_real_with_provider_model', futureCommandShape: 'hermes.exe --oneshot "<PROMPT>" --provider <PROVIDER> --model <MODEL> --toolsets <TOOLSETS>', timeoutPolicyRules: [], killSwitchPolicyRules: [], retryPolicyRules: [], checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_result_ingestion_contract_planning', canProceedToFilesystemMutationPolicyPlanning: false, canProceedToResearchExecutionApproval: false, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canUseFindings: false, recommendedNextStep: FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_NEXT_STEP }
}

export function evaluateFactoryHermesTimeoutKillSwitchPolicyPlanning(input: FactoryHermesTimeoutKillSwitchPolicyPlanningInput): FactoryHermesTimeoutKillSwitchPolicyPlanningResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_TIMEOUT_KILL_SWITCH_POLICY_PLANNING_POLICY, ...(input.policy || {}) }
  const out = base(input)
  const ingestion = input.resultIngestionContractPlanningResult
  if (policy.requireResultIngestionContractPlanning && !ingestion) return { ...out, blockers: [{ blockerId: 'blocked_missing_result_ingestion_contract_planning', message: 'Result ingestion contract planning result is required.' }] }
  const ingestionPlan = ingestion?.hermesResultIngestionContractPlanCandidate
  if (ingestion?.status !== 'result_ingestion_contract_plan_created' || ingestion?.decision !== 'hermes_result_ingestion_contract_plan_created' || ingestion?.canProceedToTimeoutKillSwitchPolicyPlanning !== true || ingestion?.canProceedToResearchExecutionApproval !== false || ingestion?.canRunResearchNow !== false || ingestion?.canExecuteHermesNow !== false || ingestion?.canPassPromptNow !== false || ingestion?.canUseNetworkNow !== false || ingestion?.canUseCredentialsNow !== false || ingestion?.canReadEnvSecretsNow !== false || ingestion?.canCallModelsNow !== false || ingestion?.canEnableToolsetsNow !== false || ingestion?.canUseFindings !== false || ingestionPlan?.ingestionAllowedNow !== false || ingestionPlan?.findingsAllowedNow !== false || ingestionPlan?.promotionAllowedNow !== false || ingestionPlan?.rawOutputDirectUseForbidden !== true || ingestionPlan?.requiresJefeReviewForFindings !== true) return { ...out, decision: 'blocked_result_ingestion_contract_not_ready_for_timeout_kill_switch_policy', blockers: [{ blockerId: 'blocked_result_ingestion_contract_not_ready_for_timeout_kill_switch_policy', message: 'Result ingestion contract planning is not ready.' }] }
  const output = input.outputContractPolicyPlanningResult
  if (policy.requireOutputContractPolicyPlanning && (!output || output.status !== 'output_contract_policy_plan_created' || output.canProceedToResultIngestionContractPlanning !== true || output.canUseFindings !== false)) return { ...out, decision: 'blocked_output_contract_policy_not_ready_for_timeout_kill_switch_policy', blockers: [{ blockerId: 'blocked_output_contract_policy_not_ready_for_timeout_kill_switch_policy', message: 'Output contract policy planning is not ready.' }] }
  const timeoutPolicyRules = timeoutRules()
  const killSwitchPolicyRules = killSwitchRules()
  const retryPolicyRules = retryRules()
  const runtimeAbortReportingShape = abortShape()
  const receipt = { receiptId: `${out.planningId}:receipt`, planningId: out.planningId, toolId: 'hermes_agent' as const, plannedBy: input.plannedBy, plannedAt: input.plannedAt, decision: 'hermes_timeout_kill_switch_policy_plan_created' as const, scope: 'hermes_timeout_kill_switch_policy_planning_only' as const, approvedNextGate: 'Factory Hermes Filesystem Mutation Policy Planning Gate v1' as const, limitations: ['No runtime timeout is configured now.', 'No kill switch is mutated now.', 'No automatic retry is authorized.'], notAuthorizedActions: TIMEOUT_KILL_SWITCH_NOT_AUTHORIZED_ACTIONS }
  const plan = { planCandidateId: `${out.planningId}:timeout-kill-switch-policy-plan-candidate`, toolId: 'hermes_agent' as const, commandShapeUnderConsideration: 'oneshot_real_with_provider_model' as const, futureCommandShape: { executable: 'hermes.exe' as const, argsTemplate: ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>'] as ['--oneshot', '<PROMPT>', '--provider', '<PROVIDER>', '--model', '<MODEL>', '--toolsets', '<TOOLSETS>'], shell: false as const }, timeoutPolicyRules, killSwitchPolicyRules, retryPolicyRules, runtimeAbortReportingShape, timeoutAllowedNow: false as const, killSwitchMutationAllowedNow: false as const, researchExecutionAllowedNow: false as const, noInfiniteTimeout: true as const, hardTimeoutRequired: true as const, autoRetryAllowed: false as const, retryRequiresJefeReview: true as const, requiredNextPolicies: TIMEOUT_KILL_SWITCH_REQUIRED_NEXT_POLICIES, canProceedToFilesystemMutationPolicyPlanning: true as const, canProceedToResearchExecutionApproval: false as const, canRunResearchNow: false as const }
  return { ...out, timeoutPolicyRules, killSwitchPolicyRules, retryPolicyRules, runtimeAbortReportingShape, timeoutKillSwitchPolicyPlanningReceipt: receipt, hermesTimeoutKillSwitchPolicyPlanCandidate: plan, status: 'timeout_kill_switch_policy_plan_created', decision: 'hermes_timeout_kill_switch_policy_plan_created', canProceedToFilesystemMutationPolicyPlanning: true }
}
