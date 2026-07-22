const path = require('node:path');
function resolveRepoRoot() { return path.resolve(__dirname, '..', '..', '..'); }
function resolveFactoryHermesCredentialsPolicyPlanningPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return { repoRoot, installRoot, sourceRoot: path.join(installRoot, 'source'), modelProviderPolicyPlanningResult: path.join(installRoot, 'model-provider-policy-planning-result.json'), promptPolicyPlanningResult: path.join(installRoot, 'prompt-policy-planning-result.json'), credentialsPolicyPlanningResult: path.join(installRoot, 'credentials-policy-planning-result.json'), deepSourceReview: path.join(repoRoot, '.codex-temp', 'hermes-research-execution-deep-source-review-v1', 'deep-source-review.json'), commandShapeReview: path.join(repoRoot, '.codex-temp', 'hermes-research-command-shape-review-v1', 'command-shape-review.json') };
}
function assertCredentialsPolicyPlanningPathContained(target, container) {
  const relative = path.relative(path.resolve(container), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`path_outside_allowed_root: ${target}`);
}
module.exports = { resolveFactoryHermesCredentialsPolicyPlanningPaths, assertCredentialsPolicyPlanningPathContained };
