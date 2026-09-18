const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-approval-result.json'),
    proofPlanningResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-planning-result.json'),
    executionReviewResult: path.join(installRoot, 'controlled-research-runtime-execution-review-result.json'),
    executionResult: path.join(installRoot, 'controlled-research-runtime-execution-result.json'),
  };
}

function assertControlledResearchRuntimeSafeCommandShapeProofApprovalPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalPaths,
  assertControlledResearchRuntimeSafeCommandShapeProofApprovalPathContained,
};
