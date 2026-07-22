import { FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_KIND, FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NEXT_STEP, FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NOT_AUTHORIZED_ACTIONS, FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_VERSION, mergeFactoryExternalToolProvisioningApprovalPolicy } from './external-tool-provisioning-approval.defaults.ts'
import type { FactoryApprovedToolProvisioningEnvelope, FactoryExternalToolProvisioningApprovalBlocker, FactoryExternalToolProvisioningApprovalCheck, FactoryExternalToolProvisioningApprovalInput, FactoryExternalToolProvisioningApprovalReceipt, FactoryExternalToolProvisioningApprovalResult, FactoryExternalToolProvisioningApprovalWarning } from './external-tool-provisioning-approval.types.ts'

function baseResult(input: FactoryExternalToolProvisioningApprovalInput, decision: FactoryExternalToolProvisioningApprovalResult['decision'], status: FactoryExternalToolProvisioningApprovalResult['status'], blockers: FactoryExternalToolProvisioningApprovalBlocker[], warnings: FactoryExternalToolProvisioningApprovalWarning[], checks: FactoryExternalToolProvisioningApprovalCheck[], nextStep: string): FactoryExternalToolProvisioningApprovalResult {
  const source = input.externalToolProvisioningResult
  return {
    approvalId: `external-tool-provisioning-approval:${source?.toolId ?? 'unknown'}:${input.reviewedAt}`,
    approvalKind: FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_KIND,
    approvalVersion: FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_VERSION,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewedBy,
    toolId: source?.toolId ?? '',
    toolName: source?.toolName ?? '',
    targetPlatform: source?.targetPlatform ?? '',
    provisioningPlanCandidate: source?.provisioningPlanCandidate,
    decision,
    status,
    checks,
    blockers,
    warnings,
    canInstallNow: false,
    canExecuteToolNow: false,
    canUseShell: false,
    canUseCredentials: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: nextStep,
  }
}

export function evaluateFactoryExternalToolProvisioningApproval(input: FactoryExternalToolProvisioningApprovalInput): FactoryExternalToolProvisioningApprovalResult {
  const policy = mergeFactoryExternalToolProvisioningApprovalPolicy(input.policy)
  const checks: FactoryExternalToolProvisioningApprovalCheck[] = [
    { checkId: 'install_forbidden', ok: policy.forbidInstallInThisGate, message: 'This approval gate cannot install tools.' },
    { checkId: 'execution_forbidden', ok: policy.forbidExecutionInThisGate, message: 'This approval gate cannot execute tools.' },
    { checkId: 'download_forbidden', ok: policy.forbidDownloadInThisGate, message: 'This approval gate cannot download binaries.' },
    { checkId: 'shell_forbidden', ok: policy.forbidShell && policy.forbidCmd && policy.forbidPowerShell, message: 'Shell, cmd.exe and PowerShell are forbidden.' },
  ]
  const blockers: FactoryExternalToolProvisioningApprovalBlocker[] = []
  const warnings: FactoryExternalToolProvisioningApprovalWarning[] = []
  const source = input.externalToolProvisioningResult
  if (!source) return baseResult(input, 'blocked_missing_provisioning_result', 'blocked', [{ blockerId: 'missing_provisioning_result', message: 'externalToolProvisioningResult is required.' }], warnings, checks, 'Create External Tool Provisioning Gate v1 candidate before approval.')
  const plan = source.provisioningPlanCandidate
  if (source.status !== 'provisioning_plan_candidate_approved' || source.decision !== 'approve_provisioning_plan_candidate') blockers.push({ blockerId: 'provisioning_candidate_not_approved', message: 'Provisioning result must be candidate approved.' })
  if (!plan) blockers.push({ blockerId: 'missing_provisioning_plan_candidate', message: 'provisioningPlanCandidate is required.' })
  if (!source.toolId || !source.toolName || !source.targetPlatform) blockers.push({ blockerId: 'missing_tool_identity_or_platform', message: 'toolId, toolName and targetPlatform are required.' })
  if (source.canInstallNow || source.canExecuteToolNow || source.canUseShell || source.canUseCredentials || source.canMutateProjectFiles || source.canDeploy) blockers.push({ blockerId: 'unsafe_source_capability_flags', message: 'Provisioning result exposes unsafe capability flags.' })
  if (plan) {
    if (!plan.sourcePolicy?.requireOfficialSource || !plan.sourcePolicy?.futureVerificationRequired) blockers.push({ blockerId: 'missing_official_source_policy', message: 'Official source policy and future verification are required.' })
    if (!plan.checksumPolicy?.requireChecksumStrategy || !plan.checksumPolicy?.futureVerificationRequired) blockers.push({ blockerId: 'missing_checksum_policy', message: 'Checksum policy and future verification are required.' })
    if (!plan.requiredFutureRuntimeAdapter || !plan.requiredFutureVerificationGate || !plan.requiredFutureJefeReview) blockers.push({ blockerId: 'missing_future_gates', message: 'Future runtime, verification and JEFE review are required.' })
    if (plan.allowedCommands.some((command) => /\b(uv run|uv pip install|pip|python -m pip|setup\.py|curl|wget|irm|iwr|powershell|cmd\.exe|shell)\b/iu.test(command))) blockers.push({ blockerId: 'prohibited_allowed_command', message: 'Candidate allowedCommands include a prohibited command.' })
  }
  if (blockers.length > 0) return baseResult(input, blockers.some((blocker) => blocker.blockerId.startsWith('unsafe') || blocker.blockerId === 'prohibited_allowed_command') ? 'blocked_insecure_provisioning_candidate' : 'blocked_invalid_provisioning_candidate', 'blocked', blockers, warnings, checks, 'Repair provisioning candidate before approval.')
  if (policy.requireHumanApproval && !input.humanApprovalRef) return baseResult(input, 'human_review_required', 'human_review_required', blockers, warnings, checks, 'Provide humanApprovalRef before approving provisioning envelope candidate.')

  const approvalId = `external-tool-provisioning-approval:${source.toolId}:${input.reviewedAt}`
  const notAuthorizedActions = source.toolId === 'uv' ? [...FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NOT_AUTHORIZED_ACTIONS, 'install_uv_now', 'execute_uv_now'] : [...FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NOT_AUTHORIZED_ACTIONS]
  const approvedProvisioningMethods = [plan!.preferredProvisioningMethod, plan!.fallbackProvisioningMethod]
  const receipt: FactoryExternalToolProvisioningApprovalReceipt = {
    receiptId: `${approvalId}:receipt`,
    approvalId,
    toolId: source.toolId,
    toolName: source.toolName,
    targetPlatform: source.targetPlatform,
    reviewedBy: input.reviewedBy,
    reviewedAt: input.reviewedAt,
    humanApprovalRef: input.humanApprovalRef ?? '',
    decision: 'approve_tool_provisioning_envelope_for_runtime_candidate',
    scope: 'external_tool_provisioning_runtime_candidate',
    approvedProvisioningMethods,
    limitations: ['Approval creates a future runtime candidate only.', 'Install, execution, download, shell, credentials, model calls, project mutation, deploy and Hermes retry remain unauthorized.'],
    notAuthorizedActions,
  }
  const envelope: FactoryApprovedToolProvisioningEnvelope = {
    envelopeId: `${approvalId}:envelope`,
    approvalId,
    toolId: source.toolId,
    toolName: source.toolName,
    targetPlatform: source.targetPlatform,
    provisioningPlanCandidate: plan!,
    approvedProvisioningMethods,
    preferredProvisioningMethod: plan!.preferredProvisioningMethod,
    fallbackProvisioningMethod: plan!.fallbackProvisioningMethod,
    installRootRef: plan!.installRootRef,
    executableRef: plan!.executableRef,
    versionRequirement: plan!.versionRequirement,
    sourcePolicy: plan!.sourcePolicy,
    checksumPolicy: plan!.checksumPolicy,
    allowedCommands: [...plan!.allowedCommands],
    forbiddenCommands: [...plan!.forbiddenCommands],
    requiredFutureRuntimeAdapter: plan!.requiredFutureRuntimeAdapter,
    requiredFutureVerificationGate: plan!.requiredFutureVerificationGate,
    requiredFutureJefeReview: plan!.requiredFutureJefeReview,
    installStatus: 'not_installed',
    executionStatus: 'not_executed',
    downloadStatus: 'not_downloaded',
    shellStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    recommendedNextStep: FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NEXT_STEP,
  }
  return { ...baseResult(input, 'approve_tool_provisioning_envelope_for_runtime_candidate', 'tool_provisioning_envelope_candidate_approved', blockers, warnings, checks, FACTORY_EXTERNAL_TOOL_PROVISIONING_APPROVAL_NEXT_STEP), approvalId, approvalReceipt: receipt, approvedToolProvisioningEnvelope: envelope }
}
