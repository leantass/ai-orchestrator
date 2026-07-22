const path = require('node:path');

function resolveRepoRoot() { return path.resolve(__dirname, '..', '..', '..'); }

function resolveFactoryHermesTimeoutKillSwitchPolicyPlanningPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot,
    installRoot,
    resultIngestionContractPlanningResult: path.join(installRoot, 'result-ingestion-contract-planning-result.json'),
    outputContractPolicyPlanningResult: path.join(installRoot, 'output-contract-policy-planning-result.json'),
    timeoutKillSwitchPolicyPlanningResult: path.join(installRoot, 'timeout-kill-switch-policy-planning-result.json'),
  };
}

function assertTimeoutKillSwitchPolicyPlanningPathContained(target, root) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`path_outside_root: ${target}`);
}

module.exports = { resolveFactoryHermesTimeoutKillSwitchPolicyPlanningPaths, assertTimeoutKillSwitchPolicyPlanningPathContained };
