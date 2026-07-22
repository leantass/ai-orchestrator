const path = require('node:path');

function resolveRepoRoot() { return path.resolve(__dirname, '..', '..', '..'); }

function resolveFactoryHermesResearchRuntimeAdapterApprovalPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  return {
    repoRoot,
    installRoot,
    sourceRoot,
    finalExecutionApprovalResult: path.join(installRoot, 'final-execution-approval-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    toolsetsPolicyPlanningResult: path.join(installRoot, 'toolsets-policy-planning-result.json'),
    researchRuntimeAdapterApprovalResult: path.join(installRoot, 'research-runtime-adapter-approval-result.json'),
    hermesCliOneshot: path.join(sourceRoot, 'hermes_cli', 'oneshot.py'),
    hermesCliMain: path.join(sourceRoot, 'hermes_cli', 'main.py'),
    hermesCliToolsConfig: path.join(sourceRoot, 'hermes_cli', 'tools_config.py'),
  };
}

function assertAdapterApprovalPathContained(target, root) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`path_outside_root: ${target}`);
}

module.exports = { resolveFactoryHermesResearchRuntimeAdapterApprovalPaths, assertAdapterApprovalPathContained };
