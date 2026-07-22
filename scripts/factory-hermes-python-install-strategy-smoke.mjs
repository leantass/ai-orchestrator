import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { inspectHermesPythonSurface } from '../electron/factory/hermes-python-install-strategy/index.cjs';
import { verifyFactoryHermesInstallArtifacts } from '../electron/factory/hermes-install-verification/index.cjs';
import {
  evaluateFactoryHermesPythonInstallStrategy,
  parseFactoryHermesPythonInstallStrategyResult,
  serializeFactoryHermesPythonInstallStrategyResult,
  summarizeFactoryHermesPythonInstallStrategyResult,
  validateFactoryHermesPythonInstallStrategyPlan,
  validateFactoryHermesPythonInstallStrategyResult,
} from '../src/factory/hermes-python-install-strategy/index.ts';

const installRoot = '.codex-temp/external-tools/hermes-agent/install/75b300f';
const sourceRoot = `${installRoot}/source`;
const pythonEnvRoot = `${installRoot}/python-env`;
const pythonInstallResultPath = `${installRoot}/python-install-result.json`;
const auditedHead = '75b300f13af40878ad6482b2ecb39c55c86679fe';
const createdAt = '2026-07-17T00:00:00.000Z';
const pythonEnvExistsBeforeStrategy = existsSync(pythonEnvRoot);

const installVerificationResult = await verifyFactoryHermesInstallArtifacts({
  installRoot,
  expectedAuditedHead: auditedHead,
  expectedInstallVersionScope: 'audited_head_only',
  verifiedAt: createdAt,
  verifiedBy: 'factory-hermes-python-install-strategy-smoke',
});

const pythonSurfaceSnapshot = await inspectHermesPythonSurface(sourceRoot);
const result = evaluateFactoryHermesPythonInstallStrategy({
  installVerificationResult,
  pythonSurfaceSnapshot,
  createdAt,
  createdBy: 'factory-hermes-python-install-strategy-smoke',
  humanReviewRef: 'LEAN-HUMAN-REVIEW-PYTHON-STRATEGY-V1',
});

assert.equal(result.status, 'python_install_strategy_ready');
assert.equal(result.strategyPlan?.toolId, 'hermes_agent');
assert.equal(result.strategyPlan?.managerDecision, 'prefer_uv_lock');
assert.ok(result.strategyPlan?.risks.some((risk) => risk.riskId === 'setup_py_present_direct_execution_forbidden'));
assert.ok(result.strategyPlan?.pythonEnvRootSuggestion.startsWith('.codex-temp/external-tools/hermes-agent/install/'));
assert.equal(result.strategyPlan?.installAllowedNow, false);
assert.equal(result.strategyPlan?.pythonInstallRuntimeAllowedNow, false);
assert.equal(result.strategyPlan?.executionAllowedNow, false);
assert.equal(result.strategyPlan?.credentialsAllowedNow, false);
assert.equal(result.strategyPlan?.modelCallsAllowedNow, false);
assert.equal(result.installAllowedNow, false);
assert.equal(result.executionAllowedNow, false);
assert.equal(result.credentialsAllowedNow, false);
assert.equal(result.modelCallsAllowedNow, false);
assert.ok((result.strategyPlan?.installSteps.length ?? 0) > 0);
assert.ok((result.strategyPlan?.validationSteps.length ?? 0) > 0);
assert.ok(result.strategyPlan?.forbiddenSteps.some((step) => /setup\.py execution/iu.test(step)));
assert.ok(result.strategyPlan?.forbiddenSteps.some((step) => /global pip install/iu.test(step)));
assert.ok(result.strategyPlan?.installSteps.every((step) => step.executed === false));
assert.ok(/Python Install Runtime Adapter/iu.test(result.strategyPlan?.recommendedNextStep ?? ''));

const missingVerification = evaluateFactoryHermesPythonInstallStrategy({
  pythonSurfaceSnapshot,
  createdAt,
  createdBy: 'factory-hermes-python-install-strategy-smoke',
  humanReviewRef: 'LEAN-HUMAN-REVIEW-PYTHON-STRATEGY-V1',
});
assert.equal(missingVerification.status, 'blocked');

const nodeNotVerified = evaluateFactoryHermesPythonInstallStrategy({
  installVerificationResult: { ...installVerificationResult, nodeInstallVerified: false },
  pythonSurfaceSnapshot,
  createdAt,
  createdBy: 'factory-hermes-python-install-strategy-smoke',
  humanReviewRef: 'LEAN-HUMAN-REVIEW-PYTHON-STRATEGY-V1',
});
assert.equal(nodeNotVerified.status, 'blocked');

const missingHumanReview = evaluateFactoryHermesPythonInstallStrategy({
  installVerificationResult,
  pythonSurfaceSnapshot,
  createdAt,
  createdBy: 'factory-hermes-python-install-strategy-smoke',
});
assert.equal(missingHumanReview.decision, 'human_review_required');

assert.equal(validateFactoryHermesPythonInstallStrategyPlan(result.strategyPlan).ok, true);
assert.equal(validateFactoryHermesPythonInstallStrategyResult(result).ok, true);

const parsed = parseFactoryHermesPythonInstallStrategyResult(serializeFactoryHermesPythonInstallStrategyResult(result));
assert.equal(parsed.strategyPlan?.managerDecision, 'prefer_uv_lock');

const summary = summarizeFactoryHermesPythonInstallStrategyResult(result);
assert.ok(!/secret|token|password|api[_-]?key/iu.test(JSON.stringify(summary)));
assert.ok(/Python Install Runtime Adapter/iu.test(result.recommendedNextStep) && !/execute Hermes directly/iu.test(result.recommendedNextStep));
assert.equal(result.strategyPlan?.installSteps.some((step) => /pip install/iu.test(step.description) && step.executed), false);
assert.equal(result.strategyPlan?.forbiddenSteps.some((step) => /setup\.py execution/iu.test(step)), true);
assert.equal(result.canExecuteHermes, false);
assert.equal(result.strategyPlan?.installSteps.some((step) => /uv|pip|python|setup|hermes/iu.test(step.description) && step.executed), false);
const pythonEnvExistsAfterStrategy = existsSync(pythonEnvRoot);
assert.equal(pythonEnvExistsAfterStrategy, pythonEnvExistsBeforeStrategy);
if (pythonEnvExistsAfterStrategy) {
  assert.equal(existsSync(pythonInstallResultPath), true);
  const pythonInstallResult = JSON.parse(readFileSync(pythonInstallResultPath, 'utf8'));
  assert.ok([
    'hermes_python_install_completed_with_verified_uv',
    'hermes_python_install_confirmed_existing_env_with_verified_uv_sync',
    'hermes_python_install_reused_existing_success_with_verified_uv',
  ].includes(pythonInstallResult.decision));
  assert.equal(pythonInstallResult.pythonInstallStatus, 'installed_with_verified_uv_lock_isolated');
}

console.log('Factory Hermes Python Install Strategy smoke: PASS (post-runtime safe)');
