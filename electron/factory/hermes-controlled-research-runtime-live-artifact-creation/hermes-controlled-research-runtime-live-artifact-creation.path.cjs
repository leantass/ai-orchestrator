const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeLiveArtifactCreationPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const liveTempConfigRoot = path.join(installRoot, 'wrapper-configs', 'no-tool-mode', 'hermes-first-controlled-run-001');
  const liveRunRoot = path.join(installRoot, 'research-runs', 'hermes-first-controlled-run-001');
  return {
    repoRoot: root,
    installRoot,
    liveArtifactApprovalResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-approval-result.json'),
    liveArtifactPlanningResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-planning-result.json'),
    liveArtifactCreationResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-creation-result.json'),
    liveTempConfigRoot,
    liveTempConfigPath: path.join(liveTempConfigRoot, 'config.yaml'),
    liveRunRoot,
    runRootManifestPath: path.join(liveRunRoot, 'RUN_MANIFEST.json'),
  };
}

function assertControlledResearchRuntimeLiveArtifactCreationPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeLiveArtifactCreationPaths, assertControlledResearchRuntimeLiveArtifactCreationPathContained };
