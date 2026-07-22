import { FACTORY_EXTERNAL_TOOL_PROVISIONING_KIND, FACTORY_EXTERNAL_TOOL_PROVISIONING_VERSION, mergeFactoryExternalToolProvisioningPolicy } from './external-tool-provisioning.defaults.ts'
import type { FactoryExternalToolProvisioningBlocker, FactoryExternalToolProvisioningCheck, FactoryExternalToolProvisioningDecision, FactoryExternalToolProvisioningInput, FactoryExternalToolProvisioningPlanCandidate, FactoryExternalToolProvisioningResult, FactoryExternalToolProvisioningStatus, FactoryExternalToolProvisioningWarning } from './external-tool-provisioning.types.ts'

const notAuthorizedActions = ['install_uv_now', 'execute_uv_now', 'execute_shell', 'execute_cmd', 'execute_powershell', 'execute_curl', 'execute_wget', 'execute_pip', 'execute_setup_py', 'global_install', 'mutate_project_package_files', 'access_credentials', 'call_model', 'deploy', 'execute_hermes', 'retry_hermes_python_runtime_now']

function buildPlanCandidate(input: FactoryExternalToolProvisioningInput): FactoryExternalToolProvisioningPlanCandidate | undefined {
  const profile = input.toolProfile
  if (!profile) return undefined
  const targetPlatform = input.targetPlatform ?? 'current_platform_declarative'
  const localMethod = profile.provisioningMethods.find((method) => method.methodId === profile.fallbackMethod)
  return {
    planId: `external-tool-provisioning:${profile.toolId}:${targetPlatform}:${input.requestedAt}`,
    toolId: profile.toolId,
    targetPlatform,
    preferredProvisioningMethod: profile.preferredMethod,
    fallbackProvisioningMethod: profile.fallbackMethod,
    installRootRef: localMethod?.installRootRef ?? profile.allowedInstallRoots[0] ?? '.codex-temp/external-tools/',
    executableRef: localMethod?.executableRef ?? 'PATH:uv',
    versionRequirement: profile.versionRequirement,
    sourcePolicy: { requireOfficialSource: true, officialSources: [...profile.officialSources], futureVerificationRequired: true },
    checksumPolicy: { requireChecksumStrategy: true, strategy: 'Future runtime must verify approved checksum strategy before materializing or accepting uv.', futureVerificationRequired: true },
    allowedCommands: [...profile.allowedFutureCommands],
    forbiddenCommands: [...profile.forbiddenCommands],
    requiredApprovals: [{ approvalId: 'uv-provisioning-approval-v1', required: true, received: Boolean(input.humanApprovalRef), approvalRef: input.humanApprovalRef, reason: 'External tool provisioning requires explicit JEFE human approval before any runtime install or verification.' }],
    requiredFutureRuntimeAdapter: 'UV Provisioning Runtime Adapter v1',
    requiredFutureVerificationGate: 'UV Provisioning Verification Gate v1',
    requiredFutureJefeReview: 'JEFE External Tool Provisioning Review v1',
    limitations: ['Plan candidate only.', 'No install in this gate.', 'No uv execution in this gate.', 'No Hermes Python Runtime retry in this gate.'],
    notAuthorizedActions,
  }
}

export function evaluateFactoryExternalToolProvisioning(input: FactoryExternalToolProvisioningInput): FactoryExternalToolProvisioningResult {
  const policy = mergeFactoryExternalToolProvisioningPolicy(input.policy)
  const checks: FactoryExternalToolProvisioningCheck[] = []
  const blockers: FactoryExternalToolProvisioningBlocker[] = []
  const warnings: FactoryExternalToolProvisioningWarning[] = []
  const profile = input.toolProfile
  const plan = buildPlanCandidate(input)

  if (policy.requireToolProfile && !profile) blockers.push({ blockerId: 'tool_profile_missing', message: 'toolProfile is required.' })
  if (profile && (!profile.toolId || !profile.toolName)) blockers.push({ blockerId: 'tool_profile_identity_missing', message: 'toolProfile requires toolId and toolName.' })
  if (profile && policy.requireVersionPinOrRange && !profile.versionRequirement) blockers.push({ blockerId: 'version_requirement_missing', message: 'toolProfile requires a version requirement.' })
  if (profile && policy.requireOfficialSource && profile.officialSources.length === 0) blockers.push({ blockerId: 'official_source_missing', message: 'toolProfile requires declared official sources.' })

  const unsafeMethod = profile?.provisioningMethods.find((method) => (policy.requireNoShell && method.requiresShell) || (policy.requireNoCredentials && method.requiresCredentials))
  if (unsafeMethod) blockers.push({ blockerId: 'insecure_provisioning_method', message: `${unsafeMethod.methodId} requires shell or credentials.` })

  const weakDownloadMethod = profile?.provisioningMethods.find((method) => method.downloadsBinary && (!method.officialSourceDeclared || !method.checksumStrategyDeclared))
  if (weakDownloadMethod && (policy.requireOfficialSource || policy.requireChecksumStrategy)) warnings.push({ warningId: 'download_method_requires_human_review', message: `${weakDownloadMethod.methodId} downloads without complete source/checksum declaration.` })

  checks.push({ checkId: 'install_forbidden_in_this_gate', ok: policy.forbidInstallInThisGate, message: 'This gate cannot install external tools.' })
  checks.push({ checkId: 'execution_forbidden_in_this_gate', ok: policy.forbidExecutionInThisGate, message: 'This gate cannot execute external tools.' })
  checks.push({ checkId: 'shell_forbidden', ok: policy.forbidShell && policy.forbidCmd && policy.forbidPowerShell, message: 'Shell, cmd.exe and PowerShell are forbidden.' })

  let decision: FactoryExternalToolProvisioningDecision = 'approve_provisioning_plan_candidate'
  let status: FactoryExternalToolProvisioningStatus = 'provisioning_plan_candidate_approved'
  if (blockers.some((blocker) => blocker.blockerId.includes('tool_profile') || blocker.blockerId === 'version_requirement_missing' || blocker.blockerId === 'official_source_missing')) {
    decision = 'blocked_invalid_tool_profile'
    status = 'blocked'
  } else if (blockers.some((blocker) => blocker.blockerId === 'insecure_provisioning_method')) {
    decision = 'blocked_insecure_provisioning_method'
    status = 'blocked'
  } else if (weakDownloadMethod && !weakDownloadMethod.officialSourceDeclared && policy.requireOfficialSource) {
    decision = 'human_review_required'
    status = 'human_review_required'
  } else if (policy.requireHumanApproval && !input.humanApprovalRef) {
    decision = 'human_review_required'
    status = 'human_review_required'
  }

  return {
    provisioningId: `external-tool-provisioning:${profile?.toolId ?? 'unknown'}:${input.requestedAt}`,
    provisioningKind: FACTORY_EXTERNAL_TOOL_PROVISIONING_KIND,
    provisioningVersion: FACTORY_EXTERNAL_TOOL_PROVISIONING_VERSION,
    requestedAt: input.requestedAt,
    requestedBy: input.requestedBy,
    toolId: profile?.toolId ?? '',
    toolName: profile?.toolName ?? '',
    toolVersionRequirement: profile?.versionRequirement ?? '',
    targetPlatform: input.targetPlatform ?? 'current_platform_declarative',
    provisioningPlanCandidate: plan,
    status,
    decision,
    checks,
    blockers,
    warnings,
    canInstallNow: false,
    canExecuteToolNow: false,
    canUseShell: false,
    canUseCredentials: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: status === 'provisioning_plan_candidate_approved' ? 'Proceed to UV Provisioning Approval/Runtime future block; do not retry Hermes Python Runtime directly.' : 'Resolve provisioning gate blockers or obtain JEFE human review before any runtime provisioning.',
  }
}
