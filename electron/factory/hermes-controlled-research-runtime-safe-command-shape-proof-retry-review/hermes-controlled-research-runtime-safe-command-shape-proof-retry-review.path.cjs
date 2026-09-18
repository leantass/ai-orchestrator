const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json'),
    proofRetryResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-result.json'),
    proofRetryApprovalResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-approval-result.json'),
    proofRetryPlanningResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-planning-result.json'),
    resolutionVerificationResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json'),
  };
}

function assertControlledResearchRuntimeSafeCommandShapeProofRetryReviewPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewPaths,
  assertControlledResearchRuntimeSafeCommandShapeProofRetryReviewPathContained,
};
