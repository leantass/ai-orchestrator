const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimePreparationReviewPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    controlledRuntimePreparationResult: path.join(installRoot, 'controlled-research-runtime-preparation-result.json'),
    controlledRuntimeApprovalResult: path.join(installRoot, 'controlled-research-runtime-approval-result.json'),
    controlledRuntimePlanningResult: path.join(installRoot, 'controlled-research-runtime-planning-result.json'),
    preparationReviewResult: path.join(installRoot, 'controlled-research-runtime-preparation-review-result.json'),
  };
}

function assertControlledResearchRuntimePreparationReviewPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimePreparationReviewPaths, assertControlledResearchRuntimePreparationReviewPathContained };
