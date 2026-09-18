const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json'),
    implementationApprovalResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-approval-result.json'),
    rendererSource: path.join(root, 'src', 'factory', 'hermes-controlled-research-runtime-command-renderer', 'index.ts'),
    wrapperBuilderSource: path.join(root, 'src', 'factory', 'hermes-wrapper-fail-closed-command-builder', 'index.ts'),
  };
}

function assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPaths, assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPathContained };
