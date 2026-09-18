const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-approval-result.json'),
    implementationPlanningResult: path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-planning-result.json'),
    alternateApprovalResult: path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-approval-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
  };
}

function assertControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPaths,
  assertControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPathContained,
};
