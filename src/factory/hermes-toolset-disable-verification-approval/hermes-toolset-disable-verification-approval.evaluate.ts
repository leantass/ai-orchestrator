import { DEFAULT_FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_POLICY, FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_KIND, FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_VERSION, TOOLSET_DISABLE_VERIFICATION_APPROVAL_NEXT_STEP_BLOCKED, TOOLSET_DISABLE_VERIFICATION_APPROVAL_NEXT_STEP_GRANTED, TOOLSET_DISABLE_VERIFICATION_APPROVAL_NOT_AUTHORIZED_ACTIONS } from './hermes-toolset-disable-verification-approval.defaults.ts'
import type { FactoryHermesControlledToolsetProbeEnvelope, FactoryHermesToolsetDisableVerificationApprovalInput, FactoryHermesToolsetDisableVerificationApprovalResult } from './hermes-toolset-disable-verification-approval.types.ts'

const INSTALL_ROOT = '.codex-temp/external-tools/hermes-agent/install/75b300f'

function validPlanning(r: any): boolean {
  const proofLevel = r?.toolsetDisableEvidence?.proofLevel || r?.proofLevel
  const noToolModeProven = r?.toolsetDisableEvidence?.noToolModeProven ?? r?.noToolModeProven
  return r?.status === 'toolset_disable_verification_plan_created'
    && r?.canProceedToToolsetDisableVerificationApproval === true
    && r?.canProceedToResearchRuntimeAdapterApprovalRetry === false
    && r?.canProceedToResearchRuntimeAdapter === false
    && noToolModeProven === false
    && ['not_supported', 'inconclusive'].includes(proofLevel)
}

function validAdapterApproval(r: any): boolean {
  return r?.status === 'research_runtime_adapter_approval_blocked'
    && r?.decision === 'hermes_research_runtime_adapter_approval_blocked_toolset_mode_unverified'
    && r?.runtimeAdapterApprovalStatus === 'blocked'
    && r?.canProceedToResearchRuntimeAdapter === false
}

function makeBlockedSourceAssessment(inputAssessment: any = {}) {
  return {
    sourceFilesInspected: inputAssessment.sourceFilesInspected || ['hermes_cli/main.py', 'hermes_cli/oneshot.py', 'hermes_cli/tools_config.py', 'hermes_cli/config.py', 'README.md'],
    hasToolsetsArgument: inputAssessment.hasToolsetsArgument === true,
    validatesKnownToolsetNames: inputAssessment.validatesKnownToolsetNames === true,
    rejectsAllInvalidToolsets: inputAssessment.rejectsAllInvalidToolsets === true,
    omittingToolsetsMayUseDefaults: inputAssessment.omittingToolsetsMayUseDefaults !== false,
    noMcpDisablesAllTools: inputAssessment.noMcpDisablesAllTools === true,
    noToolsetsTextOnlyIsHermesSyntax: inputAssessment.noToolsetsTextOnlyIsHermesSyntax === true,
    toolsetValidationBeforeAIAgent: inputAssessment.toolsetValidationBeforeAIAgent === true,
    safeProbeShapeProven: inputAssessment.safeProbeShapeProven === true,
    probeDoesNotRequirePrompt: inputAssessment.probeDoesNotRequirePrompt === true,
    probeCannotReachProviderModelNetwork: inputAssessment.probeCannotReachProviderModelNetwork === true,
    probeCannotReadCredentials: inputAssessment.probeCannotReadCredentials === true,
    exactCommandCandidateProven: inputAssessment.exactCommandCandidateProven === true,
    riskSummary: inputAssessment.riskSummary || ['No command path was proven that validates --toolsets without prompt/oneshot risk.', 'Omitting --toolsets can use hidden defaults.', 'no_mcp is not a complete no-tools mode.'],
    evidenceRefs: inputAssessment.evidenceRefs || ['hermes_cli/oneshot.py:_validate_explicit_toolsets', 'hermes_cli/oneshot.py:run_oneshot', 'hermes_cli/tools_config.py:no_mcp'],
  }
}

function canApproveProbe(sourceSafetyAssessment: any, policy: any): boolean {
  return (!policy.requireSafeProbeShapeProven || sourceSafetyAssessment.safeProbeShapeProven === true)
    && (!policy.requireProbeWithoutPrompt || sourceSafetyAssessment.probeDoesNotRequirePrompt === true)
    && (!policy.requireProbeCannotReachProviderModelNetwork || sourceSafetyAssessment.probeCannotReachProviderModelNetwork === true)
    && (!policy.requireNoCredentialRead || sourceSafetyAssessment.probeCannotReadCredentials === true)
    && (!policy.requireValidationBeforeAIAgent || sourceSafetyAssessment.toolsetValidationBeforeAIAgent === true)
    && sourceSafetyAssessment.exactCommandCandidateProven === true
}

function makeEnvelope(id: string, sourceSafetyAssessment: any): FactoryHermesControlledToolsetProbeEnvelope {
  return {
    envelopeId: `${id}:controlled-probe-envelope`,
    probeType: 'toolset_disable_cli_validation_probe',
    objective: 'verify whether Hermes has safe no-tools/toolsets-disabled execution mode without model/network',
    executable: `${INSTALL_ROOT}/python-env/Scripts/hermes.exe`,
    cwd: `${INSTALL_ROOT}/source`,
    shell: false,
    executeNow: false,
    promptAllowed: false,
    modelCallsAllowed: false,
    networkAllowed: false,
    credentialsAllowed: false,
    toolsetsEnabled: false,
    expectedToReachAIAgent: false,
    expectedToReachProvider: false,
    timeoutMs: 30000,
    autoRetryAllowed: false,
    outputUseAsFindings: false,
    expectedClassification: ['controlled_probe_success', 'controlled_probe_failure', 'toolset_mode_not_supported'],
    exactCommandCandidate: sourceSafetyAssessment.exactCommandCandidate,
    safetyEvidenceRefs: sourceSafetyAssessment.evidenceRefs,
    nextGate: 'Factory Hermes Toolset Disable Verification Runtime Adapter v1',
  }
}

export function evaluateFactoryHermesToolsetDisableVerificationApproval(input: FactoryHermesToolsetDisableVerificationApprovalInput): FactoryHermesToolsetDisableVerificationApprovalResult {
  const policy = { ...DEFAULT_FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_POLICY, ...(input.policy || {}) }
  const approvalId = `hermes-toolset-disable-verification-approval:75b300f:${input.evaluatedAt}`
  const planningOk = !policy.requirePlanningAllowsApproval || validPlanning(input.toolsetDisableVerificationPlanningResult)
  const adapterOk = !policy.requireAdapterApprovalBlockedByToolset || validAdapterApproval(input.researchRuntimeAdapterApprovalResult)
  const sourceSafetyAssessment = makeBlockedSourceAssessment(input.sourceSafetyAssessment)
  const granted = planningOk && adapterOk && canApproveProbe(sourceSafetyAssessment, policy)
  const status = granted ? 'toolset_disable_verification_approval_granted' : 'toolset_disable_verification_approval_blocked'
  const decision = granted ? 'hermes_toolset_disable_verification_approved_for_controlled_probe_runtime_candidate' : (!planningOk ? 'blocked_invalid_toolset_disable_verification_planning' : (!adapterOk ? 'blocked_invalid_research_runtime_adapter_approval' : 'hermes_toolset_disable_verification_approval_blocked_no_safe_probe_shape'))
  const approvalStatus = granted ? 'approved_for_controlled_probe_runtime_candidate' : 'blocked'
  const nextGate = granted ? 'Factory Hermes Toolset Disable Verification Runtime Adapter v1' : 'Factory Hermes Runtime Selection Revision Planning Gate v1'
  const result: FactoryHermesToolsetDisableVerificationApprovalResult = {
    approvalId,
    approvalKind: FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_KIND,
    approvalVersion: FACTORY_HERMES_TOOLSET_DISABLE_VERIFICATION_APPROVAL_VERSION,
    evaluatedAt: input.evaluatedAt,
    evaluatedBy: input.evaluatedBy,
    toolId: 'hermes_agent',
    planningDecisionRef: input.toolsetDisableVerificationPlanningResult?.planningId,
    adapterApprovalDecisionRef: input.researchRuntimeAdapterApprovalResult?.adapterApprovalId,
    sourceSafetyAssessment,
    checks: [],
    blockers: granted ? [] : [{ blockerId: 'no_safe_probe_shape', message: 'Source does not prove a toolset-disable probe that avoids prompt, provider/model, credentials, and network paths.' }],
    warnings: sourceSafetyAssessment.omittingToolsetsMayUseDefaults ? [{ warningId: 'hidden_default_toolsets_risk', message: 'Omitting --toolsets may activate configured CLI defaults.' }] : [],
    status,
    decision,
    approvalStatus,
    canProceedToToolsetDisableVerificationRuntimeAdapter: granted,
    canProceedToRuntimeSelectionRevisionPlanning: !granted,
    canProceedToResearchRuntimeAdapterApprovalRetry: false,
    canProceedToResearchRuntimeAdapter: false,
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
    recommendedNextStep: granted ? TOOLSET_DISABLE_VERIFICATION_APPROVAL_NEXT_STEP_GRANTED : TOOLSET_DISABLE_VERIFICATION_APPROVAL_NEXT_STEP_BLOCKED,
    toolsetDisableVerificationApprovalDecision: { decisionId: `${approvalId}:decision`, toolId: 'hermes_agent', approvalStatus, decision, reason: granted ? 'safe_controlled_probe_shape_proven_from_source' : 'no_safe_toolset_disable_probe_shape', probeEnvelopeCreated: granted, executionApprovedNow: false, runtimeAdapterApproved: false, canProceedToToolsetDisableVerificationRuntimeAdapter: granted, canProceedToRuntimeSelectionRevisionPlanning: !granted },
    toolsetDisableVerificationApprovalReceipt: { receiptId: `${approvalId}:receipt`, approvalId, toolId: 'hermes_agent', evaluatedBy: input.evaluatedBy, evaluatedAt: input.evaluatedAt, decision, approvalStatus, scope: 'hermes_toolset_disable_verification_approval_only', approvedNextGate: nextGate, limitations: ['No Hermes execution, oneshot, prompt passing, model calls, network, credential reads, toolset enablement, run-root creation, adapter approval, ingestion, or findings promotion is authorized by this gate.'], notAuthorizedActions: TOOLSET_DISABLE_VERIFICATION_APPROVAL_NOT_AUTHORIZED_ACTIONS },
  }
  if (granted) result.controlledToolsetProbeEnvelope = makeEnvelope(approvalId, sourceSafetyAssessment)
  else result.approvalBlockerPlan = { blockerPlanId: `${approvalId}:blocker-plan`, toolId: 'hermes_agent', blockerType: 'no_safe_toolset_disable_probe_shape', blockers: ['noToolModeNotSupported', 'noSafeProbeCommandProven', 'hiddenDefaultToolsetsRisk'], resolutionOptions: ['Factory Hermes Runtime Selection Revision Planning Gate v1', 'Factory Hermes Hermes Wrapper No-Tool Mode Planning Gate v1', 'Keep Hermes research execution blocked'], recommendedConservativeNextGate: 'Factory Hermes Runtime Selection Revision Planning Gate v1', canProceedToRuntimeSelectionRevisionPlanning: true, canProceedToToolsetDisableVerificationRuntimeAdapter: false, canProceedToResearchRuntimeAdapterApprovalRetry: false }
  return result
}
