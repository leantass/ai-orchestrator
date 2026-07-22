const path = require('node:path');

function resolveRepoRoot() { return path.resolve(__dirname, '..', '..', '..'); }

function resolveFactoryHermesToolsetDisableVerificationApprovalPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  const sourceRoot = path.join(installRoot, 'source');
  return {
    repoRoot,
    installRoot,
    sourceRoot,
    planningResult: path.join(installRoot, 'toolset-disable-verification-planning-result.json'),
    adapterApprovalResult: path.join(installRoot, 'research-runtime-adapter-approval-result.json'),
    finalExecutionApprovalResult: path.join(installRoot, 'final-execution-approval-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    toolsetsPolicyPlanningResult: path.join(installRoot, 'toolsets-policy-planning-result.json'),
    approvalResult: path.join(installRoot, 'toolset-disable-verification-approval-result.json'),
    oneshot: path.join(sourceRoot, 'hermes_cli', 'oneshot.py'),
    main: path.join(sourceRoot, 'hermes_cli', 'main.py'),
    toolsConfig: path.join(sourceRoot, 'hermes_cli', 'tools_config.py'),
    config: path.join(sourceRoot, 'hermes_cli', 'config.py'),
    readme: path.join(sourceRoot, 'README.md'),
  };
}

function assertToolsetDisableApprovalPathContained(target, root) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`path_outside_root: ${target}`);
}

module.exports = { resolveFactoryHermesToolsetDisableVerificationApprovalPaths, assertToolsetDisableApprovalPathContained };
