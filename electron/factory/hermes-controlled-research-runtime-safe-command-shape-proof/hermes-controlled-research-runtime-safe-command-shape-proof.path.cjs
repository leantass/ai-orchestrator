const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  return {
    repoRoot: root,
    installRoot,
    proofRoot: path.join(installRoot, 'safe-command-shape-proof'),
    resultArtifact: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-result.json'),
    proofApprovalResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-approval-result.json'),
    proofPlanningResult: path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-planning-result.json'),
    executionReviewResult: path.join(installRoot, 'controlled-research-runtime-execution-review-result.json'),
    executionResult: path.join(installRoot, 'controlled-research-runtime-execution-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    researchRuntimeAdapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    sourcePaths: [
      path.join(sourceRoot, 'hermes_cli', 'main.py'),
      path.join(sourceRoot, 'hermes_cli', 'oneshot.py'),
      path.join(sourceRoot, 'hermes_cli', 'tools_config.py'),
      path.join(sourceRoot, 'hermes_cli', 'config.py'),
      path.join(sourceRoot, 'hermes_cli', 'runtime_provider.py'),
      path.join(sourceRoot, 'hermes_cli', 'auth.py'),
      path.join(sourceRoot, 'toolsets.py'),
      path.join(sourceRoot, 'run_agent.py'),
      path.join(sourceRoot, 'README.md'),
      path.join(sourceRoot, 'pyproject.toml'),
      path.join(root, 'src', 'factory', 'hermes-wrapper-no-tool-mode-runtime', 'index.ts'),
      path.join(root, 'electron', 'factory', 'hermes-wrapper-no-tool-mode-runtime', 'index.cjs'),
      path.join(root, 'src', 'factory', 'hermes-research-runtime-adapter'),
      path.join(root, 'electron', 'factory', 'hermes-research-runtime-adapter'),
    ],
  };
}

function assertControlledResearchRuntimeSafeCommandShapeProofPathContained(target, root) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = {
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPaths,
  assertControlledResearchRuntimeSafeCommandShapeProofPathContained,
};
