const path = require('node:path');

function resolveRepoRoot() { return path.resolve(__dirname, '..', '..', '..'); }

function resolveFactoryHermesResultIngestionContractPlanningPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot,
    installRoot,
    outputContractPolicyPlanningResult: path.join(installRoot, 'output-contract-policy-planning-result.json'),
    toolsetsPolicyPlanningResult: path.join(installRoot, 'toolsets-policy-planning-result.json'),
    networkPolicyPlanningResult: path.join(installRoot, 'network-policy-planning-result.json'),
    credentialsPolicyPlanningResult: path.join(installRoot, 'credentials-policy-planning-result.json'),
    deepSourceReview: path.join(repoRoot, '.codex-temp', 'hermes-research-execution-deep-source-review-v1', 'deep-source-review.json'),
    commandShapeReview: path.join(repoRoot, '.codex-temp', 'hermes-research-command-shape-review-v1', 'command-shape-review.json'),
    resultIngestionContractPlanningResult: path.join(installRoot, 'result-ingestion-contract-planning-result.json'),
  };
}

function assertResultIngestionContractPlanningPathContained(target, root) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`path_outside_root: ${target}`);
}

module.exports = { resolveFactoryHermesResultIngestionContractPlanningPaths, assertResultIngestionContractPlanningPathContained };
