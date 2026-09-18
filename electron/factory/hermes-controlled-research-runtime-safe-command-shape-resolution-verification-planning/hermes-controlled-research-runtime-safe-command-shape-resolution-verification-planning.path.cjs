const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-planning-result.json'),
    implementationResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json'),
    implementationApprovalResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-approval-result.json'),
    implementationPlanningResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-planning-result.json'),
  };
}

function assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPaths,
  assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPathContained,
};
