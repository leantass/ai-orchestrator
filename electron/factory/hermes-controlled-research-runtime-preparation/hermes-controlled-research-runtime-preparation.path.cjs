const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimePreparationPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    controlledRuntimeApprovalResult: path.join(installRoot, 'controlled-research-runtime-approval-result.json'),
    controlledRuntimePlanningResult: path.join(installRoot, 'controlled-research-runtime-planning-result.json'),
    researchRuntimeAdapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    wrapperVerificationReviewResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-review-result.json'),
    preparationResult: path.join(installRoot, 'controlled-research-runtime-preparation-result.json'),
  };
}

function assertControlledResearchRuntimePreparationPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimePreparationPaths, assertControlledResearchRuntimePreparationPathContained };
