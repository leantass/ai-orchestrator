const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-review-result.json'),
    proofResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-result.json'),
    proofApprovalResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-approval-result.json'),
    proofPlanningResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-planning-result.json'),
    executionReviewResult: path.join(installRoot, 'controlled-research-runtime-execution-review-result.json'),
    executionResult: path.join(installRoot, 'controlled-research-runtime-execution-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
  };
}

function assertControlledResearchRuntimeSafeCommandShapeProofReviewPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewPaths,
  assertControlledResearchRuntimeSafeCommandShapeProofReviewPathContained,
};
