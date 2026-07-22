import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { executeFactoryHermesPythonInstallRuntime } from '../electron/factory/hermes-python-install-runtime/index.cjs';
import {
  evaluateFactoryHermesPythonInstallApproval,
} from '../src/factory/hermes-python-install-approval/index.ts';
import {
  parseFactoryHermesPythonInstallRuntimeResult,
  serializeFactoryHermesPythonInstallRuntimeResult,
  summarizeFactoryHermesPythonInstallRuntimeResult,
  validateFactoryHermesPythonInstallRuntimeInput,
  validateFactoryHermesPythonInstallRuntimeResult,
} from '../src/factory/hermes-python-install-runtime/index.ts';

const auditedHead = '75b300f13af40878ad6482b2ecb39c55c86679fe';
const installRootRef = '.codex-temp/external-tools/hermes-agent/install/75b300f';
const sourceRootRef = `${installRootRef}/source`;
const pythonEnvRootRef = `${installRootRef}/python-env/`;
const executedAt = '2026-07-17T00:05:00.000Z';

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex').toUpperCase();
}

function strategyResult() {
  const plan = {
    strategyPlanId: `hermes-python-install-strategy:${auditedHead.slice(0, 7)}:2026-07-17T00:00:00.000Z`,
    strategyKind: 'factory_hermes_python_install_strategy',
    strategyVersion: '1.0',
    toolId: 'hermes_agent',
    auditedHead,
    sourceRootRef,
    installRootRef,
    pythonEnvRootSuggestion: pythonEnvRootRef,
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
  };
  return {
    resultId: `${plan.strategyPlanId}:result`,
    resultKind: 'factory_hermes_python_install_strategy',
    resultVersion: '1.0',
    createdAt: '2026-07-17T00:00:00.000Z',
    createdBy: 'factory-hermes-python-install-runtime-smoke',
    decision: 'python_install_strategy_ready',
    status: 'python_install_strategy_ready',
    strategyPlan: plan,
    checks: [],
    blockers: [],
    warnings: [],
    installAllowedNow: false,
    pythonInstallRuntimeAllowedNow: false,
    executionAllowedNow: false,
    credentialsAllowedNow: false,
    modelCallsAllowedNow: false,
    canExecuteHermes: false,
    recommendedNextStep: plan.recommendedNextStep,
  };
}

const approval = evaluateFactoryHermesPythonInstallApproval({
  hermesPythonInstallStrategyResult: strategyResult(),
  reviewedAt: '2026-07-17T00:04:00.000Z',
  reviewedBy: 'lean',
  reviewerRole: 'owner',
  humanApprovalRef: 'human-review/hermes-python-install-approval-v1',
});

const input = {
  hermesPythonInstallApprovalResult: approval,
  executedAt,
  executedBy: 'factory-hermes-python-install-runtime-smoke',
};

const packageJsonBefore = await sha256('package.json');
const packageLockBefore = await sha256('package-lock.json');
const result = await executeFactoryHermesPythonInstallRuntime(input);

if (result.decision === 'blocked_uv_executable_not_found') {
  console.error(JSON.stringify({
    ok: false,
    expectedInstall: true,
    status: result.status,
    decision: result.decision,
    uvStatus: result.uvStatus,
    pythonInstallStatus: result.pythonInstallStatus,
    noFallbackUsed: true,
  }, null, 2));
  process.exit(1);
}

assert.equal(result.status, 'success'); // 1
assert.equal(existsSync(sourceRootRef), true); // 2
assert.equal(existsSync(installRootRef), true); // 3
assert.equal(existsSync(`${sourceRootRef}/pyproject.toml`), true); // 4
assert.equal(existsSync(`${sourceRootRef}/uv.lock`), true); // 5
assert.ok(result.commandResults[0]?.executableUsed); // 6
assert.equal(result.commandResults.some((command) => command.commandKind === 'uv_version' && command.shell === false), true); // 7
assert.equal(result.commandResults.some((command) => command.commandKind === 'uv_venv' && command.shell === false), true); // 8
assert.equal(result.commandResults.some((command) => command.commandKind === 'uv_sync_locked_no_install_project' && command.shell === false), true); // 9
const syncCommand = result.commandResults.find((command) => command.commandKind === 'uv_sync_locked_no_install_project');
assert.ok(syncCommand?.command.includes('sync')); // 10
assert.ok(syncCommand?.command.includes('--locked')); // 11
assert.ok(syncCommand?.command.includes('--no-install-project')); // 12
assert.ok(syncCommand?.command.includes('--no-dev')); // 13
assert.ok(syncCommand?.command.includes('--project')); // 14
assert.equal(syncCommand?.envSummary?.UV_PROJECT_ENVIRONMENT, pythonEnvRootRef); // 15
assert.ok(result.pythonEnvRootRef?.startsWith('.codex-temp')); // 16
assert.equal(existsSync(pythonEnvRootRef), true); // 17
assert.equal(existsSync(`${installRootRef}/python-install-manifest.json`), true); // 18
assert.equal(existsSync(`${installRootRef}/python-install-result.json`), true); // 19
assert.equal(result.pythonInstallStatus, 'installed_with_uv_lock_isolated'); // 20
assert.equal(result.venvStatus, 'created_with_uv'); // 21
assert.equal(result.uvStatus, 'executed_allowlisted'); // 22
assert.equal(result.pipStatus, 'not_executed'); // 23
assert.equal(result.setupPyStatus, 'not_executed'); // 24
assert.equal(result.hermesExecutionStatus, 'not_allowed'); // 25
assert.equal(result.scriptsStatus, 'not_executed'); // 26
assert.equal(result.credentialsStatus, 'not_allowed'); // 27
assert.equal(result.canExecuteHermes, false); // 28
assert.equal(result.canRunHermesScripts, false); // 29
assert.equal(result.canUseCredentials, false); // 30
assert.equal(result.canCallModels, false); // 31
assert.equal(result.canMutateProjectFiles, false); // 32
assert.equal(result.canDeploy, false); // 33
assert.equal(result.commandResults.some((command) => /pip/iu.test(command.commandKind)), false); // 34
assert.equal(result.commandResults.some((command) => /setup/iu.test(command.commandKind)), false); // 35
assert.equal(result.commandResults.some((command) => /uv_run/iu.test(command.commandKind)), false); // 36
assert.equal(result.canExecuteHermes, false); // 37
assert.equal(validateFactoryHermesPythonInstallRuntimeInput(input).ok, true); // 38
assert.equal(validateFactoryHermesPythonInstallRuntimeResult(result).ok, true); // 39
assert.equal(parseFactoryHermesPythonInstallRuntimeResult(serializeFactoryHermesPythonInstallRuntimeResult(result)).pythonInstallRuntimeId, result.pythonInstallRuntimeId); // 40
assert.equal(/stdout|stderr|token|password|api[_-]?key|secret/iu.test(JSON.stringify(summarizeFactoryHermesPythonInstallRuntimeResult(result))), false); // 41
assert.equal(await sha256('package.json'), packageJsonBefore); // 42
assert.equal(await sha256('package-lock.json'), packageLockBefore); // 43
assert.ok(/Python Install Verification Gate/iu.test(result.recommendedNextStep)); // 44

console.log(JSON.stringify({
  ok: true,
  checks: 44,
  status: result.status,
  decision: result.decision,
  uvStatus: result.uvStatus,
  venvStatus: result.venvStatus,
  pythonInstallStatus: result.pythonInstallStatus,
  pipStatus: result.pipStatus,
  setupPyStatus: result.setupPyStatus,
  hermesExecutionStatus: result.hermesExecutionStatus,
}, null, 2));
