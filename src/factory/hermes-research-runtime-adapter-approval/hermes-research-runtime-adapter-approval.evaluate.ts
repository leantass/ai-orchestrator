import { ADAPTER_APPROVAL_NOT_AUTHORIZED_ACTIONS, DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_POLICY, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_KIND, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_NEXT_STEP_BLOCKED, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_NEXT_STEP_GRANTED, FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_VERSION } from './hermes-research-runtime-adapter-approval.defaults.ts'
import type { FactoryHermesApprovedResearchRuntimeAdapterEnvelope, FactoryHermesResearchRuntimeAdapterApprovalInput, FactoryHermesResearchRuntimeAdapterApprovalResult } from './hermes-research-runtime-adapter-approval.types.ts'

const INSTALL_ROOT = '.codex-temp/external-tools/hermes-agent/install/75b300f'

function validFinal(finalApproval: any): boolean {
  const s = finalApproval?.approvedRuntimeSelectionSnapshot
  return finalApproval?.status === 'final_execution_approval_recorded'
    && finalApproval?.decision === 'hermes_final_execution_approval_recorded_for_runtime_adapter_approval'
    && finalApproval?.finalExecutionApprovalStatus === 'approved_for_runtime_adapter_approval'
    && finalApproval?.hermesFinalExecutionApprovalDecision?.finalExecutionApproved === true
    && finalApproval?.hermesFinalExecutionApprovalDecision?.runtimeSelectionsApprovedForNextGate === true
    && finalApproval?.hermesFinalExecutionApprovalDecision?.runtimeAdapterApproved === false
    && finalApproval?.hermesFinalExecutionApprovalDecision?.executionApprovedNow === false
    && finalApproval?.canProceedToResearchRuntimeAdapterApproval === true
    && finalApproval?.canProceedToResearchRuntimeAdapter === false
    && finalApproval?.canRunResearchNow === false
    && s?.provider?.providerId === 'openai'
    && s?.model?.modelId === 'gpt-4o-mini'
    && s?.credential?.credentialRefName === 'OPENAI_API_KEY'
    && s?.credential?.valueRead === false
    && s?.network?.approvedHostsForNextGate?.includes('api.openai.com')
    && s?.network?.dnsResolvedNow === false
    && s?.network?.endpointsTestedNow === false
    && s?.toolsets?.approvedToolsetModeForNextGate === 'no_toolsets_text_only'
    && s?.runRoot?.approvedRunRootForNextGate?.startsWith(`${INSTALL_ROOT}/research-runs/hermes-first-controlled-run-001/`)
    && s?.runRoot?.runRootCreatedNow === false
}

function makeEnvelope(id: string, toolsetDisableSupportStatus: 'verified_from_source_or_policy_artifacts'): FactoryHermesApprovedResearchRuntimeAdapterEnvelope {
  return {
    envelopeId: `${id}:adapter-envelope`, toolId: 'hermes_agent',
    commandEnvelope: { executable: `${INSTALL_ROOT}/python-env/Scripts/hermes.exe`, cwd: `${INSTALL_ROOT}/source`, shell: false, stdinAllowed: false, interactiveModeAllowed: false, oneShotOnly: true, argsTemplate: ['--oneshot', '<PROMPT_FROM_APPROVED_REF>', '--provider', 'openai', '--model', 'gpt-4o-mini', '--toolsets', '<NO_TOOLSETS_MODE_RESOLVED>'], promptSourceRef: 'prompt_candidate_from_prompt_policy', promptSentNow: false, executeNow: false },
    envEnvelope: { inheritParentEnv: false, dotEnvReadAllowed: false, fullEnvDumpAllowed: false, envSecretReadAllowedInThisGate: false, futureRuntimeMayReadExactCredentialRef: 'OPENAI_API_KEY', futureRuntimeCredentialReadAllowedOnlyInsideAdapter: true, futureRuntimeMustNotLogCredentialValue: true, allowedFutureEnvKeys: ['OPENAI_API_KEY', 'OS required minimal process env keys if needed'], forbiddenEnv: ['wildcard env', 'dotenv', 'proxy env unless explicitly approved'] },
    credentialEnvelope: { credentialRefName: 'OPENAI_API_KEY', valueReadNow: false, valueKnownNow: false, futureRuntimeMayUseCredentialRef: true, futureRuntimeMustFailIfMissing: true, noArtifactMayContainCredentialValue: true },
    networkEnvelope: { networkUsedNow: false, futureRuntimeMayUseNetwork: true, approvedHostForFutureRuntime: 'api.openai.com', allowedHosts: ['api.openai.com'], wildcardHostsAllowed: false, arbitraryInternetAllowed: false, dnsResolvedNow: false, endpointsTestedNow: false, redirectsToUnapprovedHostsForbidden: true },
    toolsetEnvelope: { selectedToolsetMode: 'no_toolsets_text_only', toolsetDisableSupportStatus, webToolsAllowed: false, browserToolsAllowed: false, terminalToolsAllowed: false, filesystemToolsAllowed: false, mcpAllowed: false, hiddenDefaultToolsetsForbidden: true, unexpectedToolUseMustBlock: true },
    filesystemEnvelope: { runRoot: `${INSTALL_ROOT}/research-runs/hermes-first-controlled-run-001/`, runRootCreatedNow: false, futureRuntimeMayCreateRunRoot: true, futureWritesRestrictedToRunRoot: true, sourceRootReadOnly: true, projectWritesForbidden: true, dotEnvReadWriteForbidden: true, pathContainmentRequired: true },
    timeoutEnvelope: { commandTimeoutMs: 120000, maxCommandTimeoutMs: 300000, hardTimeoutRequired: true, noInfiniteTimeout: true, autoRetryAllowed: false, retryRequiresJefeReview: true, shutdownGraceMs: 5000 },
    outputEnvelope: { stdoutPreviewLimitBytes: 12000, stderrPreviewLimitBytes: 12000, sanitizeStdout: true, sanitizeStderr: true, usageFileMetadataOnly: true, outputUseAsFindingsNow: false, futureResultIngestionRequired: true, futureJefeReviewRequired: true },
    adapterLimits: { executeOnceOnly: true, noRetries: true, noToolsetEscalation: true, noProviderFallback: true, noModelFallback: true, noPromptMutation: true },
  }
}

export function evaluateFactoryHermesResearchRuntimeAdapterApproval(input: FactoryHermesResearchRuntimeAdapterApprovalInput): FactoryHermesResearchRuntimeAdapterApprovalResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_POLICY, ...(input.policy || {}) }
  const toolsetDisableSupportStatus = input.toolsetDisableSupportStatus || 'unverified_requires_toolset_disable_verification'
  const finalApproval = input.finalExecutionApprovalResult
  const id = `hermes-research-runtime-adapter-approval:75b300f:${input.evaluatedAt}`
  const finalOk = !policy.requireFinalExecutionApproval || validFinal(finalApproval)
  const granted = finalOk && toolsetDisableSupportStatus === 'verified_from_source_or_policy_artifacts'
  const decision = granted ? 'hermes_research_runtime_adapter_approved_for_first_controlled_oneshot_runtime_candidate' : 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified'
  const status = granted ? 'research_runtime_adapter_approval_granted' : 'research_runtime_adapter_approval_blocked'
  const runtimeAdapterApprovalStatus = granted ? 'approved_for_runtime_adapter_candidate' : 'blocked'
  const nextGate = granted ? 'Factory Hermes Research Runtime Adapter v1' : 'Factory Hermes Toolset Disable Verification Planning Gate v1'
  const result: FactoryHermesResearchRuntimeAdapterApprovalResult = {
    adapterApprovalId: id, adapterApprovalKind: FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_KIND, adapterApprovalVersion: FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_VERSION, evaluatedAt: input.evaluatedAt, evaluatedBy: input.evaluatedBy, toolId: 'hermes_agent', finalExecutionApprovalRef: finalApproval?.finalApprovalId, runtimeSelectionDecisionRef: input.runtimeSelectionDecisionResult?.decisionId, toolsetDisableSupportStatus, checks: [], blockers: [], warnings: [], status, decision, runtimeAdapterApprovalStatus, canProceedToResearchRuntimeAdapter: granted, canProceedToToolsetDisableVerificationPlanning: !granted, canProceedToResearchExecutionRuntime: false, canRunResearchNow: false, canExecuteHermesNow: false, canPassPromptNow: false, canUseNetworkNow: false, canUseCredentialsNow: false, canReadEnvSecretsNow: false, canCallModelsNow: false, canEnableToolsetsNow: false, canMutateFilesystemNow: false, canUseFindings: false, recommendedNextStep: granted ? FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_NEXT_STEP_GRANTED : FACTORY_HERMES_RESEARCH_RUNTIME_ADAPTER_APPROVAL_NEXT_STEP_BLOCKED,
    hermesResearchRuntimeAdapterApprovalDecision: { decisionId: `${id}:decision`, toolId: 'hermes_agent', runtimeAdapterApprovalStatus, decision, reason: granted ? 'final_approval_and_runtime_selections_validated' : 'toolset_disable_support_unverified', finalExecutionApprovalValidated: finalOk, runtimeSelectionsValidated: finalOk, adapterEnvelopeCreated: granted, runtimeAdapterApprovedForNextGate: granted, executionApprovedInThisGate: false, canProceedToResearchRuntimeAdapter: granted, requiredNextGate: nextGate },
    researchRuntimeAdapterApprovalReceipt: { receiptId: `${id}:receipt`, adapterApprovalId: id, toolId: 'hermes_agent', evaluatedBy: input.evaluatedBy, evaluatedAt: input.evaluatedAt, decision, runtimeAdapterApprovalStatus, scope: 'hermes_research_runtime_adapter_approval_only', approvedNextGate: nextGate, limitations: ['No Hermes execution, prompt passing, network use, credential read, model call, toolset enablement, run root creation, output ingestion, or findings promotion is authorized by this gate.'], notAuthorizedActions: ADAPTER_APPROVAL_NOT_AUTHORIZED_ACTIONS },
  }
  if (granted) result.approvedResearchRuntimeAdapterEnvelope = makeEnvelope(id, toolsetDisableSupportStatus)
  else result.blockers = [{ blockerId: 'toolset_mode_unverified', message: 'Source/policy evidence does not prove no_toolsets_text_only as a safe executable Hermes --toolsets mode.' }]
  return result
}
