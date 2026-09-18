const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeExecutionPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const runRoot = path.join(installRoot, 'research-runs', 'hermes-first-controlled-run-001');
  return {
    repoRoot: root,
    installRoot,
    runRoot,
    executionResult: path.join(installRoot, 'controlled-research-runtime-execution-result.json'),
    executionApprovalResult: path.join(installRoot, 'controlled-research-runtime-execution-approval-result.json'),
    executionPlanningResult: path.join(installRoot, 'controlled-research-runtime-execution-planning-result.json'),
    liveArtifactVerificationReviewResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-verification-review-result.json'),
    liveArtifactVerificationResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-verification-result.json'),
    liveArtifactCreationResult: path.join(installRoot, 'controlled-research-runtime-live-artifact-creation-result.json'),
    researchRuntimeAdapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    configPath: path.join(installRoot, 'wrapper-configs', 'no-tool-mode', 'hermes-first-controlled-run-001', 'config.yaml'),
    runManifestPath: path.join(runRoot, 'RUN_MANIFEST.json'),
    promptManifestPath: path.join(runRoot, 'PROMPT_MANIFEST.json'),
    commandEnvelopePath: path.join(runRoot, 'EXECUTION_COMMAND_ENVELOPE.json'),
    runExecutionResultPath: path.join(runRoot, 'EXECUTION_RESULT.json'),
    stdoutRedactedPath: path.join(runRoot, 'STDOUT_REDACTED.txt'),
    stderrRedactedPath: path.join(runRoot, 'STDERR_REDACTED.txt'),
    postRunAuditPath: path.join(runRoot, 'POST_RUN_AUDIT.json'),
  };
}

function assertControlledResearchRuntimeExecutionPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeExecutionPaths, assertControlledResearchRuntimeExecutionPathContained };
