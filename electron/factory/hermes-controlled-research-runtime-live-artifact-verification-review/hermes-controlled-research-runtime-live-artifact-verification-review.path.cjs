const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    liveArtifactVerificationReviewResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-verification-review-result.json'),
    liveArtifactVerificationResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-verification-result.json'),
    liveArtifactCreationResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-creation-result.json'),
    liveArtifactApprovalResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-approval-result.json'),
    liveArtifactPlanningResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-planning-result.json'),
    preparationReviewResult: path.join(installRoot, 'controlled-research-runtime-preparation-review-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
  };
}

function assertControlledResearchRuntimeLiveArtifactVerificationReviewPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewPaths, assertControlledResearchRuntimeLiveArtifactVerificationReviewPathContained };
