const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeExecutionPlanningPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    executionPlanningResult: path.join(installRoot, 'controlled-research-runtime-execution-planning-result.json'),
    liveArtifactVerificationReviewResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-verification-review-result.json'),
    liveArtifactVerificationResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-verification-result.json'),
    liveArtifactCreationResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-creation-result.json'),
    researchRuntimeAdapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
  };
}

function assertControlledResearchRuntimeExecutionPlanningPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeExecutionPlanningPaths, assertControlledResearchRuntimeExecutionPlanningPathContained };
