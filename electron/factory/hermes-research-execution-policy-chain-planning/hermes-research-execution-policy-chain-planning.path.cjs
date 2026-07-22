const path = require('node:path');

function resolveRepoRoot() {
  return path.resolve(__dirname, '..', '..', '..');
}

function resolveFactoryHermesResearchExecutionPolicyChainPlanningPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot,
    installRoot,
    deepSourceReview: path.join(repoRoot, '.codex-temp', 'hermes-research-execution-deep-source-review-v1', 'deep-source-review.json'),
    deepSourceReviewMd: path.join(repoRoot, '.codex-temp', 'hermes-research-execution-deep-source-review-v1', 'DEEP_SOURCE_REVIEW.md'),
    commandShapeReview: path.join(repoRoot, '.codex-temp', 'hermes-research-command-shape-review-v1', 'command-shape-review.json'),
    researchExecutionPlanningResult: path.join(installRoot, 'research-execution-planning-result.json'),
    researchJefeReviewV2Result: path.join(installRoot, 'research-jefe-review-v2-result.json'),
    researchResultIngestionV2Result: path.join(installRoot, 'research-result-ingestion-v2-result.json'),
    policyChainPlanningResult: path.join(installRoot, 'research-execution-policy-chain-planning-result.json'),
  };
}

function assertPolicyChainPlanningPathContained(target, container) {
  const relative = path.relative(path.resolve(container), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`path_outside_allowed_root: ${target}`);
}

module.exports = { resolveFactoryHermesResearchExecutionPolicyChainPlanningPaths, assertPolicyChainPlanningPathContained };
