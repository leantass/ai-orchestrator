const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-planning-result.json'),
    resolutionApprovalResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-approval-result.json'),
    resolutionPlanningResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-planning-result.json'),
    proofReviewResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-review-result.json'),
  };
}

function assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPaths,
  assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPathContained,
};
