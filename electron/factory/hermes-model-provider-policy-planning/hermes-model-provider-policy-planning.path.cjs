const path = require('node:path');

function resolveRepoRoot() {
  return path.resolve(__dirname, '..', '..', '..');
}

function resolveFactoryHermesModelProviderPolicyPlanningPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  return {
    repoRoot,
    installRoot,
    sourceRoot,
    promptPolicyPlanningResult: path.join(installRoot, 'prompt-policy-planning-result.json'),
    policyChainPlanningResult: path.join(installRoot, 'research-execution-policy-chain-planning-result.json'),
    modelProviderPolicyPlanningResult: path.join(installRoot, 'model-provider-policy-planning-result.json'),
    deepSourceReview: path.join(repoRoot, '.codex-temp', 'hermes-research-execution-deep-source-review-v1', 'deep-source-review.json'),
    commandShapeReview: path.join(repoRoot, '.codex-temp', 'hermes-research-command-shape-review-v1', 'command-shape-review.json'),
    researchExecutionPlanningResult: path.join(installRoot, 'research-execution-planning-result.json'),
  };
}

function assertModelProviderPolicyPlanningPathContained(target, container) {
  const relative = path.relative(path.resolve(container), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`path_outside_allowed_root: ${target}`);
}

module.exports = { resolveFactoryHermesModelProviderPolicyPlanningPaths, assertModelProviderPolicyPlanningPathContained };
