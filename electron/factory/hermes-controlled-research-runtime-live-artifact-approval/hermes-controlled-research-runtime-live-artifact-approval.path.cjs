const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeLiveArtifactApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    liveArtifactPlanningResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-planning-result.json'),
    preparationReviewResult: path.join(installRoot, 'controlled-research-runtime-preparation-review-result.json'),
    liveArtifactApprovalResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-approval-result.json'),
  };
}

function assertControlledResearchRuntimeLiveArtifactApprovalPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeLiveArtifactApprovalPaths, assertControlledResearchRuntimeLiveArtifactApprovalPathContained };
