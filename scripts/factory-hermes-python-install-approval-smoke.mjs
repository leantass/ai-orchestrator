import assert from 'node:assert/strict';
import {
  evaluateFactoryHermesPythonInstallApproval,
  parseFactoryHermesPythonInstallApprovalResult,
  serializeFactoryHermesPythonInstallApprovalResult,
  summarizeFactoryHermesPythonInstallApprovalResult,
  validateFactoryHermesPythonInstallApprovalInput,
  validateFactoryHermesPythonInstallApprovalResult,
} from '../src/factory/hermes-python-install-approval/index.ts';

const reviewedAt = '2026-07-17T00:04:00.000Z';
const auditedHead = '75b300f13af40878ad6482b2ecb39c55c86679fe';
const installRootRef = '.codex-temp/external-tools/hermes-agent/install/75b300f';

function strategyResult(overrides = {}) {
  const plan = {
    strategyPlanId: `hermes-python-install-strategy:${auditedHead.slice(0, 7)}:2026-07-17T00:00:00.000Z`,
    strategyKind: 'factory_hermes_python_install_strategy',
    strategyVersion: '1.0',
    toolId: 'hermes_agent',
    auditedHead,
    sourceRootRef: `${installRootRef}/source`,
    installRootRef,
    pythonEnvRootSuggestion: `${installRootRef}/python-env/`,
    managerDecision: 'prefer_uv_lock',
    installSteps: [{ stepId: 'install_from_uv_lock', description: 'Future runtime installs from uv.lock.', declarativeOnly: true, executed: false }],
    validationSteps: [{ stepId: 'verify_hermes_not_executed', description: 'Verify Hermes remains not executed.', declarativeOnly: true, executed: false }],
    forbiddenSteps: ['global pip install', 'setup.py execution', 'executing Hermes'],
    risks: [],
    installAllowedNow: false,
    pythonInstallRuntimeAllowedNow: false,
    executionAllowedNow: false,
    credentialsAllowedNow: false,
    modelCallsAllowedNow: false,
    recommendedNextStep: 'Proceed to Factory Hermes Python Install Runtime Adapter v1 only after explicit approval; Hermes execution remains disabled.',
    ...(overrides.strategyPlan ?? {}),
  };
  return {
    resultId: `${plan.strategyPlanId}:result`,
    resultKind: 'factory_hermes_python_install_strategy',
    resultVersion: '1.0',
    createdAt: '2026-07-17T00:00:00.000Z',
    createdBy: 'factory-hermes-python-install-approval-smoke',
    decision: 'python_install_strategy_ready',
    status: 'python_install_strategy_ready',
    snapshot: {
      sourceRoot: `${installRootRef}/source`,
      pyprojectPresent: true,
      setupPyPresent: true,
      setupCfgPresent: false,
      uvLockPresent: true,
      requirementsPresent: false,
      poetryLockPresent: false,
      pipfilePresent: false,
      pythonPackagesDetected: ['hermes'],
      cliEntrypointsDetected: ['run_agent.py'],
      pythonScriptsDetected: [],
      likelyPythonManager: 'uv',
      strategyRiskNotes: [],
    },
    strategyPlan: plan,
    checks: [{ checkId: 'node_install_verified', ok: true, message: 'Node install verified.' }],
    blockers: [],
    warnings: [],
    installAllowedNow: false,
    pythonInstallRuntimeAllowedNow: false,
    executionAllowedNow: false,
    credentialsAllowedNow: false,
    modelCallsAllowedNow: false,
    canExecuteHermes: false,
    recommendedNextStep: plan.recommendedNextStep,
    ...overrides,
  };
}

const input = {
  hermesPythonInstallStrategyResult: strategyResult(),
  reviewedAt,
  reviewedBy: 'lean',
  reviewerRole: 'owner',
  humanApprovalRef: 'human-review/hermes-python-install-approval-v1',
};
const result = evaluateFactoryHermesPythonInstallApproval(input);
const receipt = result.approvalReceipt;
const envelope = result.approvedPythonInstallEnvelope;

assert.equal(result.status, 'python_install_envelope_candidate_approved'); // 1
assert.equal(result.toolId, 'hermes_agent'); // 2
assert.ok(result.auditedHead); // 3
assert.ok(result.managerDecision); // 4
assert.ok(envelope?.pythonInstallMethodScope); // 5
assert.ok(receipt); // 6
assert.ok(envelope); // 7
assert.ok(envelope?.pythonEnvRootRef.startsWith('.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/')); // 8
assert.equal(envelope?.pythonInstallStatus, 'not_installed'); // 9
assert.equal(envelope?.venvStatus, 'not_created'); // 10
assert.equal(envelope?.uvStatus, 'not_executed'); // 11
assert.equal(envelope?.pipStatus, 'not_executed'); // 12
assert.equal(envelope?.setupPyStatus, 'not_executed'); // 13
assert.equal(envelope?.hermesExecutionStatus, 'not_allowed'); // 14
assert.equal(result.canInstallPythonNow, false); // 15
assert.equal(result.canExecuteHermes, false); // 16
assert.equal(result.canRunHermesScripts, false); // 17
assert.equal(result.canUseCredentials, false); // 18
assert.equal(result.canCallModels, false); // 19
assert.equal(result.canMutateProjectFiles, false); // 20
assert.equal(result.canDeploy, false); // 21
assert.ok(receipt?.notAuthorizedActions.includes('install_python_now')); // 22
assert.ok(receipt?.notAuthorizedActions.includes('execute_uv_now')); // 23
assert.ok(receipt?.notAuthorizedActions.includes('execute_pip_now')); // 24
assert.ok(receipt?.notAuthorizedActions.includes('create_venv_now')); // 25
assert.ok(receipt?.notAuthorizedActions.includes('execute_setup_py')); // 26
assert.ok(receipt?.notAuthorizedActions.includes('global_pip_install')); // 27
assert.ok(receipt?.notAuthorizedActions.includes('execute_hermes')); // 28
assert.equal(evaluateFactoryHermesPythonInstallApproval({ ...input, hermesPythonInstallStrategyResult: undefined }).status, 'blocked'); // 29
assert.equal(evaluateFactoryHermesPythonInstallApproval({ ...input, hermesPythonInstallStrategyResult: strategyResult({ executionAllowedNow: true }) }).status, 'blocked'); // 30
assert.equal(evaluateFactoryHermesPythonInstallApproval({ ...input, hermesPythonInstallStrategyResult: strategyResult({ installAllowedNow: true }) }).status, 'blocked'); // 31
assert.equal(evaluateFactoryHermesPythonInstallApproval({ ...input, humanApprovalRef: undefined }).status, 'human_review_required'); // 32
assert.equal(validateFactoryHermesPythonInstallApprovalInput(input).ok, true); // 33
assert.equal(validateFactoryHermesPythonInstallApprovalResult(result).ok, true); // 34
assert.equal(parseFactoryHermesPythonInstallApprovalResult(serializeFactoryHermesPythonInstallApprovalResult(result)).approvalId, result.approvalId); // 35
assert.equal(/token|password|api[_-]?key|secret/iu.test(JSON.stringify(summarizeFactoryHermesPythonInstallApprovalResult(result))), false); // 36
assert.ok(/Hermes Python Install Runtime Adapter/iu.test(result.recommendedNextStep) && !/execute Hermes directly/iu.test(result.recommendedNextStep)); // 37
assert.equal(envelope?.pythonInstallStatus, 'not_installed'); // 38
assert.equal(envelope?.uvStatus, 'not_executed'); // 39
assert.equal(envelope?.pipStatus, 'not_executed'); // 40
assert.equal(envelope?.venvStatus, 'not_created'); // 41
assert.equal(envelope?.setupPyStatus, 'not_executed'); // 42
assert.equal(result.canExecuteHermes, false); // 43

console.log(JSON.stringify({
  ok: true,
  checks: 43,
  approvalKind: result.approvalKind,
  status: result.status,
  auditedHead: result.auditedHead,
  managerDecision: result.managerDecision,
  pythonInstallMethodScope: envelope?.pythonInstallMethodScope,
  pythonInstallStatus: envelope?.pythonInstallStatus,
  canInstallPythonNow: result.canInstallPythonNow,
  canExecuteHermes: result.canExecuteHermes,
}, null, 2));
