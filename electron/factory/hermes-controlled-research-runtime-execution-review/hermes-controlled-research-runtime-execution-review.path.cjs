const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeExecutionReviewPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const runRoot = path.join(installRoot, 'research-runs', 'hermes-first-controlled-run-001');
  return {
    repoRoot: root,
    installRoot,
    runRoot,
    executionReviewResult: path.join(installRoot, 'controlled-research-runtime-execution-review-result.json'),
    executionResult: path.join(installRoot, 'controlled-research-runtime-execution-result.json'),
    executionApprovalResult: path.join(installRoot, 'controlled-research-runtime-execution-approval-result.json'),
    executionPlanningResult: path.join(installRoot, 'controlled-research-runtime-execution-planning-result.json'),
    promptManifestPath: path.join(runRoot, 'PROMPT_MANIFEST.json'),
  };
}

function assertControlledResearchRuntimeExecutionReviewPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeExecutionReviewPaths, assertControlledResearchRuntimeExecutionReviewPathContained };
