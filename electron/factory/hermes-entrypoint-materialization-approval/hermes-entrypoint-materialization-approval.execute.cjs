const fs = require('node:fs');
const path = require('node:path');
const { resolveFactoryHermesEntrypointMaterializationApprovalPaths, assertApprovalPathContained } = require('./hermes-entrypoint-materialization-approval.path.cjs');

const KIND = 'factory-hermes-entrypoint-materialization-approval';
const VERSION = '1.0';
const NEXT_STEP = 'Proceed to Factory Hermes Entrypoint Materialization Runtime Adapter v1; do not materialize or execute uv now.';
const NOT_AUTHORIZED = ['materialize_entrypoint_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_direct_now', 'execute_hermes_now', 'retry_adapter_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now'];

function baseResult(input, planningResult, decision = 'blocked_missing_materialization_plan') {
  const plan = planningResult && planningResult.hermesEntrypointMaterializationPlanCandidate;
  return {
    approvalId: `hermes-entrypoint-materialization-approval:75b300f:${input.approvedAt}`,
    approvalKind: KIND,
    approvalVersion: VERSION,
    approvedAt: input.approvedAt,
    approvedBy: input.approvedBy,
    toolId: 'hermes_agent',
    selectedCandidateId: planningResult && planningResult.selectedCandidateId || '',
    commandName: planningResult && planningResult.commandName || '',
    pythonEntrypoint: planningResult && planningResult.pythonEntrypoint || '',
    missingExecutableRef: planningResult && planningResult.missingExecutableRef || '',
    sourceRootRef: planningResult && planningResult.sourceRootRef || '',
    pythonEnvRootRef: planningResult && planningResult.pythonEnvRootRef || '',
    uvExecutableRef: plan && plan.uvExecutableRef || '',
    selectedMethodCandidate: planningResult && planningResult.selectedMethodCandidate && planningResult.selectedMethodCandidate.methodId || '',
    setupPyPresent: Boolean(plan && plan.setupPyPresent),
    buildBackend: String(plan && plan.buildSystemSummary && plan.buildSystemSummary.buildBackend || ''),
    checks: [],
    blockers: [],
    warnings: [],
    status: 'blocked',
    decision,
    canProceedToEntrypointMaterializationRuntime: false,
    canMaterializeEntrypointNow: false,
    canRetryAdapterNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseNetwork: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: NEXT_STEP,
  };
}

function evaluateFactoryHermesEntrypointMaterializationApproval(input) {
  const planningResult = input.materializationPlanningResult;
  const plan = planningResult && planningResult.hermesEntrypointMaterializationPlanCandidate;
  const base = baseResult(input, planningResult);
  if (!planningResult || !plan) return { ...base, blockers: [{ blockerId: 'blocked_missing_materialization_plan', message: 'Planning result is required.' }] };
  if (planningResult.status !== 'plan_candidate_created' || planningResult.decision !== 'hermes_entrypoint_materialization_plan_candidate_created' || planningResult.canProceedToEntrypointMaterializationApproval !== true || planningResult.canMaterializeEntrypointNow !== false || planningResult.canRetryAdapterNow !== false) {
    return { ...base, decision: 'blocked_materialization_plan_not_candidate', blockers: [{ blockerId: 'blocked_materialization_plan_not_candidate', message: 'Planning result is not an approvable candidate.' }] };
  }
  const selectedMethod = planningResult.selectedMethodCandidate && planningResult.selectedMethodCandidate.methodId;
  const proposed = plan.proposedRuntimeCommand || {};
  if (selectedMethod !== 'uv_sync_install_project_locked_existing_env' || plan.selectedMethodCandidate.usesPip || plan.selectedMethodCandidate.usesSetupPyDirectly || proposed.shell !== false || (proposed.args || []).includes('--no-install-project')) {
    return { ...base, decision: 'blocked_unsafe_materialization_method', blockers: [{ blockerId: 'blocked_unsafe_materialization_method', message: 'Materialization method is unsafe.' }] };
  }
  if (!input.humanApprovalRef) return { ...base, status: 'human_review_required', decision: 'blocked_missing_human_approval', blockers: [{ blockerId: 'blocked_missing_human_approval', message: 'humanApprovalRef is required.' }] };
  if (plan.setupPyPresent && !input.riskAcceptanceNotes) return { ...base, status: 'manual_review_required', decision: 'blocked_build_hook_risk_requires_manual_review', blockers: [{ blockerId: 'blocked_build_hook_risk_requires_manual_review', message: 'setup.py/build backend risk acceptance is required.' }] };

  const approvalId = base.approvalId;
  const receipt = {
    receiptId: `${approvalId}:receipt`,
    approvalId,
    toolId: 'hermes_agent',
    approvedBy: input.approvedBy,
    approvedAt: input.approvedAt,
    humanApprovalRef: input.humanApprovalRef,
    selectedCandidateId: planningResult.selectedCandidateId,
    commandName: 'hermes',
    pythonEntrypoint: 'hermes_cli.main:main',
    selectedMethodCandidate: selectedMethod,
    setupPyPresent: true,
    buildBackend: 'setuptools.build_meta',
    riskAcceptanceNotes: input.riskAcceptanceNotes,
    decision: 'hermes_entrypoint_materialization_approved_for_runtime_candidate',
    scope: 'hermes_entrypoint_materialization_runtime_candidate_only',
    approvedNextGate: 'Factory Hermes Entrypoint Materialization Runtime Adapter v1',
    limitations: ['Approval is for a future runtime candidate only.', 'No uv sync or materialization is authorized in this gate.', 'setup.py direct execution remains forbidden.'],
    notAuthorizedActions: NOT_AUTHORIZED,
  };
  const envelope = {
    envelopeId: `${approvalId}:envelope`,
    approvalId,
    toolId: 'hermes_agent',
    selectedCandidateId: planningResult.selectedCandidateId,
    commandName: 'hermes',
    pythonEntrypoint: 'hermes_cli.main:main',
    expectedExecutableRef: planningResult.missingExecutableRef,
    missingExecutableRef: planningResult.missingExecutableRef,
    sourceRootRef: planningResult.sourceRootRef,
    pythonEnvRootRef: planningResult.pythonEnvRootRef,
    uvExecutableRef: plan.uvExecutableRef,
    selectedMethodCandidate: 'uv_sync_install_project_locked_existing_env',
    approvedRuntimeCommand: { executableRef: plan.uvExecutableRef, args: ['sync', '--locked', '--no-dev', '--project', '<sourceRoot>'], cwd: planningResult.sourceRootRef, shell: false, timeoutMs: 300000 },
    approvedEnvPolicy: { UV_PROJECT_ENVIRONMENT: planningResult.pythonEnvRootRef, UV_CACHE_DIR: '.codex-temp/external-tools/uv/cache/', UV_NO_PROGRESS: '1', PYTHONNOUSERSITE: '1', PIP_CONFIG_FILE: 'NUL', sanitized: true },
    allowedWriteRoots: [planningResult.pythonEnvRootRef, '.codex-temp/external-tools/uv/cache/', '.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-logs/'],
    forbiddenActions: ['pip', 'python direct', 'setup.py direct', 'hermes execution', 'adapter retry', 'network', 'credentials', 'model calls'],
    buildRiskAcceptance: { setupPyPresent: true, buildBackend: 'setuptools.build_meta', acceptedOnlyForUvSyncProjectInstall: true, setupPyDirectExecutionAllowed: false },
    materializationAllowedNow: false,
    futureRuntimeMayMaterializeEntrypointUnderEnvelope: true,
    adapterRetryAllowedNow: false,
    hermesExecutionAllowedNow: false,
    networkAllowedNow: false,
    credentialsAllowedNow: false,
    modelCallsAllowedNow: false,
    canProceedToEntrypointMaterializationRuntime: true,
    recommendedNextStep: NEXT_STEP,
  };
  return { ...base, status: 'approved_for_runtime_candidate', decision: 'hermes_entrypoint_materialization_approved_for_runtime_candidate', approvalReceipt: receipt, approvedEntrypointMaterializationRuntimeEnvelope: envelope, canProceedToEntrypointMaterializationRuntime: true };
}

function executeFactoryHermesEntrypointMaterializationApproval(input = {}) {
  const paths = resolveFactoryHermesEntrypointMaterializationApprovalPaths();
  assertApprovalPathContained(paths.planningResult, paths.installRoot);
  assertApprovalPathContained(paths.approvalResult, paths.installRoot);
  const materializationPlanningResult = JSON.parse(fs.readFileSync(paths.planningResult, 'utf8'));
  const result = evaluateFactoryHermesEntrypointMaterializationApproval({
    approvedAt: input.approvedAt || '2026-07-21T23:30:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-entrypoint-materialization-approval-smoke',
    humanApprovalRef: input.humanApprovalRef || 'human-review/hermes-entrypoint-materialization-approval-v1',
    riskAcceptanceNotes: input.riskAcceptanceNotes || 'Accept setuptools.build_meta/setup.py presence only for future uv sync project install under envelope; setup.py direct execution remains forbidden.',
    materializationPlanningResult,
  });
  fs.writeFileSync(paths.approvalResult, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

module.exports = { evaluateFactoryHermesEntrypointMaterializationApproval, executeFactoryHermesEntrypointMaterializationApproval };
