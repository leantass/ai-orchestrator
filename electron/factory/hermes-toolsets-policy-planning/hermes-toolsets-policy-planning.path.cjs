const path = require('node:path');

function resolveRepoRoot() {
  return path.resolve(__dirname, '..', '..', '..');
}

function resolveFactoryHermesToolsetsPolicyPlanningPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  return {
    repoRoot,
    installRoot,
    sourceRoot,
    networkPolicyPlanningResult: path.join(installRoot, 'network-policy-planning-result.json'),
    credentialsPolicyPlanningResult: path.join(installRoot, 'credentials-policy-planning-result.json'),
    modelProviderPolicyPlanningResult: path.join(installRoot, 'model-provider-policy-planning-result.json'),
    promptPolicyPlanningResult: path.join(installRoot, 'prompt-policy-planning-result.json'),
    policyChainPlanningResult: path.join(installRoot, 'research-execution-policy-chain-planning-result.json'),
    deepSourceReview: path.join(repoRoot, '.codex-temp', 'hermes-research-execution-deep-source-review-v1', 'deep-source-review.json'),
    commandShapeReview: path.join(repoRoot, '.codex-temp', 'hermes-research-command-shape-review-v1', 'command-shape-review.json'),
    toolsetsPolicyPlanningResult: path.join(installRoot, 'toolsets-policy-planning-result.json'),
  };
}

function assertToolsetsPolicyPlanningPathContained(target, root) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`path_outside_root: ${target}`);
}

module.exports = { resolveFactoryHermesToolsetsPolicyPlanningPaths, assertToolsetsPolicyPlanningPathContained };
