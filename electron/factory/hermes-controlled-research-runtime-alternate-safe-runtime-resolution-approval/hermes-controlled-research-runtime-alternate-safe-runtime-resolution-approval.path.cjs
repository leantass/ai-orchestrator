const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-approval-result.json'),
    alternatePlanningResult: path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-planning-result.json'),
    proofRetryReviewResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
  };
}

function assertControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPaths,
  assertControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPathContained,
};
