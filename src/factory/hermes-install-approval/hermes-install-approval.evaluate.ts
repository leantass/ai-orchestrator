import {
  DEFAULT_FACTORY_HERMES_INSTALL_APPROVAL_POLICY,
  FACTORY_HERMES_INSTALL_APPROVAL_KIND,
  FACTORY_HERMES_INSTALL_APPROVAL_VERSION,
  HERMES_INSTALL_APPROVAL_NEXT_STEP,
  HERMES_INSTALL_APPROVAL_NOT_AUTHORIZED_ACTIONS,
} from './hermes-install-approval.defaults.ts';
import type {
  FactoryHermesApprovedInstallEnvelope,
  FactoryHermesInstallApprovalBlocker,
  FactoryHermesInstallApprovalCheck,
  FactoryHermesInstallApprovalInput,
  FactoryHermesInstallApprovalPolicy,
  FactoryHermesInstallApprovalReceipt,
  FactoryHermesInstallApprovalResult,
  FactoryHermesInstallApprovalWarning,
} from './hermes-install-approval.types.ts';

function mergePolicy(policy?: Partial<FactoryHermesInstallApprovalPolicy>): FactoryHermesInstallApprovalPolicy {
  return {
    ...DEFAULT_FACTORY_HERMES_INSTALL_APPROVAL_POLICY,
    ...policy,
    forbidInstallInThisGate: true,
    forbidExecutionInThisGate: true,
    forbidScriptsInThisGate: true,
    forbidCredentialsInThisGate: true,
    forbidModelCallsInThisGate: true,
    forbidProjectMutation: true,
    forbidPackageFileMutation: true,
    forbidGlobalInstall: true,
    forbidDeploy: true,
  };
}

function blockedResult(
  input: FactoryHermesInstallApprovalInput,
  decision: FactoryHermesInstallApprovalResult['decision'],
  status: FactoryHermesInstallApprovalResult['status'],
  blockers: FactoryHermesInstallApprovalBlocker[],
  warnings: FactoryHermesInstallApprovalWarning[],
  checks: FactoryHermesInstallApprovalCheck[],
  nextStep: string,
): FactoryHermesInstallApprovalResult {
  return {
    approvalId: `hermes-install-approval:${input.reviewedAt}:${input.reviewedBy}`,
    approvalKind: FACTORY_HERMES_INSTALL_APPROVAL_KIND,
    approvalVersion: FACTORY_HERMES_INSTALL_APPROVAL_VERSION,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewedBy,
    toolId: 'hermes_agent',
    decision,
    status,
    checks,
    blockers,
    warnings,
    canInstallHermesNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: nextStep,
  };
}

export function evaluateFactoryHermesInstallApproval(
  input: FactoryHermesInstallApprovalInput,
): FactoryHermesInstallApprovalResult {
  const policy = mergePolicy(input.policy);
  const checks: FactoryHermesInstallApprovalCheck[] = [
    { checkId: 'install_forbidden', ok: policy.forbidInstallInThisGate, message: 'This gate cannot install Hermes.' },
    { checkId: 'execution_forbidden', ok: policy.forbidExecutionInThisGate, message: 'This gate cannot execute Hermes.' },
    { checkId: 'scripts_forbidden', ok: policy.forbidScriptsInThisGate, message: 'This gate cannot run Hermes scripts.' },
    { checkId: 'credentials_forbidden', ok: policy.forbidCredentialsInThisGate, message: 'This gate cannot use credentials.' },
  ];
  const blockers: FactoryHermesInstallApprovalBlocker[] = [];
  const warnings: FactoryHermesInstallApprovalWarning[] = [];
  const planResult = input.hermesInstallationPlanResult;
  const boundaryResult = input.hermesRuntimeBoundaryResult;

  if (!planResult) {
    blockers.push({ blockerId: 'missing_installation_plan', message: 'Hermes installation plan result is required.' });
    return blockedResult(input, 'blocked', 'blocked', blockers, warnings, checks, 'Create Factory Hermes Installation Plan Gate v1 before install approval.');
  }

  if (!boundaryResult) {
    blockers.push({ blockerId: 'missing_runtime_boundary', message: 'Hermes runtime boundary result is required.' });
    return blockedResult(input, 'blocked', 'blocked', blockers, warnings, checks, 'Create Factory Hermes Runtime Boundary Contract v1 before install approval.');
  }

  const plan = planResult.installationPlan;
  const boundary = boundaryResult.boundaryContract;

  if (!plan || planResult.status !== 'install_plan_ready_for_audited_head') {
    blockers.push({ blockerId: 'installation_plan_not_ready', message: 'Hermes installation plan must be ready.' });
    return blockedResult(input, 'request_install_plan_changes', 'changes_required', blockers, warnings, checks, 'Repair the Hermes installation plan before install approval.');
  }

  if (!boundary || boundaryResult.status !== 'runtime_boundary_contract_ready') {
    blockers.push({ blockerId: 'runtime_boundary_not_ready', message: 'Hermes runtime boundary must be ready.' });
    return blockedResult(input, 'request_install_plan_changes', 'changes_required', blockers, warnings, checks, 'Repair the Hermes runtime boundary before install approval.');
  }

  if (planResult.installAllowedNow || planResult.executionAllowedNow || planResult.credentialsAllowedNow || planResult.scriptsExecuted || planResult.dependenciesInstalled || planResult.projectPackageMutated) {
    blockers.push({ blockerId: 'unsafe_installation_plan_flags', message: 'Installation plan exposes unsafe install/execution/script/dependency/mutation flags.' });
  }

  if (boundary.canInstallHermes || boundary.canExecuteHermes || boundary.canUseCredentials || boundary.canCallModels || boundary.canMutateProjectFiles || boundary.canDeploy || boundary.executionPolicy.installAllowedNow || boundary.executionPolicy.executionAllowedNow) {
    blockers.push({ blockerId: 'unsafe_runtime_boundary_flags', message: 'Runtime boundary exposes unsafe install/execution/credential/model/mutation/deploy flags.' });
  }

  if (!plan.auditedHead || !boundary.auditedHead) {
    blockers.push({ blockerId: 'missing_audited_head', message: 'Audited HEAD is required in plan and boundary.' });
  }

  if (plan.auditedHead && boundary.auditedHead && plan.auditedHead !== boundary.auditedHead) {
    blockers.push({ blockerId: 'audited_head_mismatch', message: 'Plan and boundary audited HEAD values differ.' });
  }

  if (blockers.length > 0) {
    return blockedResult(input, 'blocked', 'blocked', blockers, warnings, checks, 'Repair blocked Hermes install approval inputs before creating an install envelope.');
  }

  if (policy.requireHumanApproval && !input.humanApprovalRef) {
    return blockedResult(input, 'human_review_required', 'human_review_required', blockers, warnings, checks, 'Provide humanApprovalRef before approving Hermes install envelope candidate.');
  }

  const headsMatch = plan.auditedHead === plan.remoteHead;
  if (!headsMatch) {
    warnings.push({
      warningId: 'remote_head_differs_from_audited_head',
      message: 'Install approval is scoped to the audited Hermes HEAD only; re-audit remote HEAD before installing any newer version.',
    });
  }

  const approvalId = `hermes-install-approval:${plan.auditedHead.slice(0, 12)}:${input.reviewedAt}`;
  const receipt: FactoryHermesInstallApprovalReceipt = {
    receiptId: `${approvalId}:receipt`,
    approvalId,
    toolId: 'hermes_agent',
    auditedHead: plan.auditedHead,
    remoteHead: plan.remoteHead,
    headsMatch,
    reviewedBy: input.reviewedBy,
    reviewedAt: input.reviewedAt,
    humanApprovalRef: input.humanApprovalRef ?? '',
    decision: 'approve_install_envelope_for_runtime_candidate',
    scope: 'hermes_install_runtime_candidate',
    installVersionScope: 'audited_head_only',
    limitations: [
      'Approval prepares a future install runtime candidate only.',
      'Install, execution, scripts, credentials, model calls, project mutation and deploy remain unauthorized.',
      'Version scope is limited to the audited Hermes HEAD.',
    ],
    notAuthorizedActions: [...HERMES_INSTALL_APPROVAL_NOT_AUTHORIZED_ACTIONS],
  };

  const envelope: FactoryHermesApprovedInstallEnvelope = {
    envelopeId: `${approvalId}:envelope`,
    approvalId,
    toolId: 'hermes_agent',
    auditedHead: plan.auditedHead,
    remoteHead: plan.remoteHead,
    installVersionScope: 'audited_head_only',
    installationPlanRef: plan.planId,
    runtimeBoundaryRef: boundary.boundaryId,
    installRootRef: boundary.installRootRef,
    runtimeRootRef: boundary.runtimeRootRef,
    outputRootRef: boundary.outputRootRef,
    logsRootRef: boundary.filesystemPolicy.logsRootRef,
    boundaryContractSummary: {
      boundaryId: boundary.boundaryId,
      networkAllowedByDefault: false,
      credentialsAllowedNow: false,
      executionAllowedNow: false,
    },
    installPlanSummary: {
      planId: plan.planId,
      versionPolicyDecision: plan.versionPolicyDecision,
      installAllowedNow: false,
      executionAllowedNow: false,
    },
    validation: {
      ok: true,
      warnings: warnings.map((warning) => warning.message),
      blockers: [],
    },
    installStatus: 'not_installed',
    executionStatus: 'not_allowed',
    scriptsStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    recommendedNextStep: HERMES_INSTALL_APPROVAL_NEXT_STEP,
  };

  return {
    approvalId,
    approvalKind: FACTORY_HERMES_INSTALL_APPROVAL_KIND,
    approvalVersion: FACTORY_HERMES_INSTALL_APPROVAL_VERSION,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewedBy,
    toolId: 'hermes_agent',
    auditedHead: plan.auditedHead,
    remoteHead: plan.remoteHead,
    headsMatch,
    sourceInstallationPlanId: plan.planId,
    sourceRuntimeBoundaryId: boundary.boundaryId,
    decision: 'approve_install_envelope_for_runtime_candidate',
    status: 'install_envelope_candidate_approved',
    checks,
    blockers,
    warnings,
    approvalReceipt: receipt,
    approvedInstallEnvelope: envelope,
    canInstallHermesNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: HERMES_INSTALL_APPROVAL_NEXT_STEP,
  };
}
