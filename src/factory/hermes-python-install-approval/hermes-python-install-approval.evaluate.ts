import {
  DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_POLICY,
  FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_KIND,
  FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_VERSION,
  HERMES_PYTHON_INSTALL_APPROVAL_NEXT_STEP,
  HERMES_PYTHON_INSTALL_APPROVAL_NOT_AUTHORIZED_ACTIONS,
} from './hermes-python-install-approval.defaults.ts';
import type {
  FactoryHermesApprovedPythonInstallEnvelope,
  FactoryHermesPythonInstallApprovalBlocker,
  FactoryHermesPythonInstallApprovalCheck,
  FactoryHermesPythonInstallApprovalInput,
  FactoryHermesPythonInstallApprovalPolicy,
  FactoryHermesPythonInstallApprovalReceipt,
  FactoryHermesPythonInstallApprovalResult,
  FactoryHermesPythonInstallApprovalWarning,
  FactoryHermesPythonInstallMethodScope,
} from './hermes-python-install-approval.types.ts';

function mergePolicy(policy?: Partial<FactoryHermesPythonInstallApprovalPolicy>): FactoryHermesPythonInstallApprovalPolicy {
  return {
    ...DEFAULT_FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_POLICY,
    ...policy,
    forbidPythonInstallInThisGate: true,
    forbidUvExecutionInThisGate: true,
    forbidPipExecutionInThisGate: true,
    forbidVenvCreationInThisGate: true,
    forbidSetupPyExecution: true,
    forbidGlobalPipInstall: true,
    forbidHermesExecutionInThisGate: true,
    forbidHermesScriptsInThisGate: true,
    forbidCredentialsInThisGate: true,
    forbidModelCallsInThisGate: true,
    forbidProjectMutation: true,
    forbidPackageFileMutation: true,
    forbidDeploy: true,
  };
}

function blockedResult(
  input: FactoryHermesPythonInstallApprovalInput,
  decision: FactoryHermesPythonInstallApprovalResult['decision'],
  status: FactoryHermesPythonInstallApprovalResult['status'],
  blockers: FactoryHermesPythonInstallApprovalBlocker[],
  warnings: FactoryHermesPythonInstallApprovalWarning[],
  checks: FactoryHermesPythonInstallApprovalCheck[],
  nextStep: string,
): FactoryHermesPythonInstallApprovalResult {
  return {
    approvalId: `hermes-python-install-approval:${input.reviewedAt}:${input.reviewedBy}`,
    approvalKind: FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_KIND,
    approvalVersion: FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_VERSION,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewedBy,
    toolId: 'hermes_agent',
    decision,
    status,
    checks,
    blockers,
    warnings,
    canInstallPythonNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: nextStep,
  };
}

function methodScope(managerDecision: string): FactoryHermesPythonInstallMethodScope | undefined {
  if (managerDecision === 'prefer_uv_lock') return 'uv_lock_isolated_only';
  if (managerDecision === 'prefer_venv_pip') return 'venv_pip_isolated_only';
  return undefined;
}

export function evaluateFactoryHermesPythonInstallApproval(
  input: FactoryHermesPythonInstallApprovalInput,
): FactoryHermesPythonInstallApprovalResult {
  const policy = mergePolicy(input.policy);
  const checks: FactoryHermesPythonInstallApprovalCheck[] = [
    { checkId: 'python_install_forbidden', ok: policy.forbidPythonInstallInThisGate, message: 'This gate cannot install Python dependencies.' },
    { checkId: 'uv_forbidden', ok: policy.forbidUvExecutionInThisGate, message: 'This gate cannot execute uv.' },
    { checkId: 'pip_forbidden', ok: policy.forbidPipExecutionInThisGate, message: 'This gate cannot execute pip.' },
    { checkId: 'venv_forbidden', ok: policy.forbidVenvCreationInThisGate, message: 'This gate cannot create a venv.' },
    { checkId: 'hermes_forbidden', ok: policy.forbidHermesExecutionInThisGate, message: 'This gate cannot execute Hermes.' },
  ];
  const blockers: FactoryHermesPythonInstallApprovalBlocker[] = [];
  const warnings: FactoryHermesPythonInstallApprovalWarning[] = [];
  const strategyResult = input.hermesPythonInstallStrategyResult;

  if (!strategyResult) {
    blockers.push({ blockerId: 'missing_python_install_strategy', message: 'Hermes Python Install Strategy result is required.' });
    return blockedResult(input, 'blocked', 'blocked', blockers, warnings, checks, 'Create Factory Hermes Python Install Strategy Gate v1 before Python install approval.');
  }

  const plan = strategyResult.strategyPlan;
  if (!plan || strategyResult.status !== 'python_install_strategy_ready') {
    blockers.push({ blockerId: 'python_strategy_not_ready', message: 'Python install strategy must be ready.' });
    return blockedResult(input, 'request_python_strategy_changes', 'changes_required', blockers, warnings, checks, 'Repair Python install strategy before approval.');
  }

  if (strategyResult.installAllowedNow || strategyResult.pythonInstallRuntimeAllowedNow || strategyResult.executionAllowedNow || strategyResult.credentialsAllowedNow || strategyResult.modelCallsAllowedNow || strategyResult.canExecuteHermes) {
    blockers.push({ blockerId: 'unsafe_python_strategy_flags', message: 'Python strategy exposes unsafe install/execution/credential/model flags.' });
  }
  if (plan.installAllowedNow || plan.pythonInstallRuntimeAllowedNow || plan.executionAllowedNow || plan.credentialsAllowedNow || plan.modelCallsAllowedNow) {
    blockers.push({ blockerId: 'unsafe_python_strategy_plan_flags', message: 'Python strategy plan exposes unsafe runtime flags.' });
  }
  if (!plan.auditedHead) blockers.push({ blockerId: 'missing_audited_head', message: 'Audited HEAD is required.' });
  if (!plan.sourceRootRef) blockers.push({ blockerId: 'missing_source_root', message: 'sourceRootRef is required.' });
  if (!plan.installRootRef) blockers.push({ blockerId: 'missing_install_root', message: 'installRootRef is required.' });
  if (!plan.pythonEnvRootSuggestion) blockers.push({ blockerId: 'missing_python_env_root', message: 'pythonEnvRootSuggestion is required.' });
  if (plan.pythonEnvRootSuggestion && !plan.pythonEnvRootSuggestion.startsWith(`${plan.installRootRef}/python-env/`)) {
    blockers.push({ blockerId: 'python_env_root_not_under_install_root', message: 'pythonEnvRootSuggestion must be under the install root python-env directory.' });
  }

  if (plan.managerDecision === 'require_manual_python_review') {
    return blockedResult(input, 'human_review_required', 'human_review_required', blockers, warnings, checks, 'Manual Python review is required before approval.');
  }
  if (plan.managerDecision === 'block_python_install') {
    blockers.push({ blockerId: 'python_install_blocked_by_strategy', message: 'Python strategy blocks Python installation.' });
  }

  const scope = methodScope(plan.managerDecision);
  if (!scope) {
    blockers.push({ blockerId: 'unsupported_manager_decision', message: 'Manager decision is not approved for runtime candidate.' });
  }
  if (scope === 'uv_lock_isolated_only' && !policy.allowUvLockRuntimeCandidate) {
    blockers.push({ blockerId: 'uv_lock_runtime_candidate_disallowed', message: 'Policy disallows uv lock runtime candidates.' });
  }
  if (scope === 'venv_pip_isolated_only' && !policy.allowVenvPipRuntimeCandidate) {
    blockers.push({ blockerId: 'venv_pip_runtime_candidate_disallowed', message: 'Policy disallows venv pip runtime candidates.' });
  }

  if (blockers.length > 0) {
    return blockedResult(input, 'blocked', 'blocked', blockers, warnings, checks, 'Repair blocked Python install approval inputs before creating an envelope.');
  }

  if (policy.requireHumanApproval && !input.humanApprovalRef) {
    return blockedResult(input, 'human_review_required', 'human_review_required', blockers, warnings, checks, 'Provide humanApprovalRef before approving Python install envelope candidate.');
  }

  const approvalId = `hermes-python-install-approval:${plan.auditedHead.slice(0, 12)}:${input.reviewedAt}`;
  const pythonInstallMethodScope = scope ?? 'uv_lock_isolated_only';
  const receipt: FactoryHermesPythonInstallApprovalReceipt = {
    receiptId: `${approvalId}:receipt`,
    approvalId,
    toolId: 'hermes_agent',
    auditedHead: plan.auditedHead,
    reviewedBy: input.reviewedBy,
    reviewedAt: input.reviewedAt,
    humanApprovalRef: input.humanApprovalRef ?? '',
    decision: 'approve_python_install_envelope_for_runtime_candidate',
    scope: 'hermes_python_install_runtime_candidate',
    pythonInstallMethodScope,
    limitations: [
      'Approval prepares a future isolated Python install runtime candidate only.',
      'Python install, uv, pip, venv creation, setup.py, Hermes execution, scripts, credentials, model calls, project mutation and deploy remain unauthorized.',
      'Runtime scope is limited to the audited Hermes source and isolated python-env root.',
    ],
    notAuthorizedActions: [...HERMES_PYTHON_INSTALL_APPROVAL_NOT_AUTHORIZED_ACTIONS],
  };
  const envelope: FactoryHermesApprovedPythonInstallEnvelope = {
    envelopeId: `${approvalId}:envelope`,
    approvalId,
    toolId: 'hermes_agent',
    auditedHead: plan.auditedHead,
    sourceRootRef: plan.sourceRootRef,
    installRootRef: plan.installRootRef,
    pythonEnvRootRef: plan.pythonEnvRootSuggestion,
    managerDecision: plan.managerDecision,
    pythonInstallMethodScope,
    strategyPlanRef: plan.strategyPlanId,
    strategySummary: {
      status: strategyResult.status,
      installAllowedNow: false,
      pythonInstallRuntimeAllowedNow: false,
      executionAllowedNow: false,
    },
    validation: {
      ok: true,
      warnings: warnings.map((warning) => warning.message),
      blockers: [],
    },
    pythonInstallStatus: 'not_installed',
    venvStatus: 'not_created',
    uvStatus: 'not_executed',
    pipStatus: 'not_executed',
    setupPyStatus: 'not_executed',
    hermesExecutionStatus: 'not_allowed',
    scriptsStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    recommendedNextStep: HERMES_PYTHON_INSTALL_APPROVAL_NEXT_STEP,
  };

  return {
    approvalId,
    approvalKind: FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_KIND,
    approvalVersion: FACTORY_HERMES_PYTHON_INSTALL_APPROVAL_VERSION,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewedBy,
    toolId: 'hermes_agent',
    auditedHead: plan.auditedHead,
    sourceRootRef: plan.sourceRootRef,
    installRootRef: plan.installRootRef,
    pythonEnvRootRef: plan.pythonEnvRootSuggestion,
    managerDecision: plan.managerDecision,
    decision: 'approve_python_install_envelope_for_runtime_candidate',
    status: 'python_install_envelope_candidate_approved',
    checks,
    blockers,
    warnings,
    approvalReceipt: receipt,
    approvedPythonInstallEnvelope: envelope,
    canInstallPythonNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: HERMES_PYTHON_INSTALL_APPROVAL_NEXT_STEP,
  };
}
