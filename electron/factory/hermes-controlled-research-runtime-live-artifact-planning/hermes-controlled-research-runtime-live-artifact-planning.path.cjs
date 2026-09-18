const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeLiveArtifactPlanningPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    preparationReviewResult: path.join(installRoot, 'controlled-research-runtime-preparation-review-result.json'),
    preparationResult: path.join(installRoot, 'controlled-research-runtime-preparation-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    liveArtifactPlanningResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-planning-result.json'),
  };
}

function assertControlledResearchRuntimeLiveArtifactPlanningPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeLiveArtifactPlanningPaths, assertControlledResearchRuntimeLiveArtifactPlanningPathContained };
