const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-planning-result.json'),
    resolutionVerificationResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json'),
    implementationResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json'),
    proofReviewResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-review-result.json'),
  };
}

function assertControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPaths,
  assertControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPathContained,
};
