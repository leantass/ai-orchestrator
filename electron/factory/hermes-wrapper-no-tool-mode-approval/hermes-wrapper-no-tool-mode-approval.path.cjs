const path = require('node:path');

function resolveRepoRoot() {
  return path.resolve(__dirname, '..', '..', '..');
}

function assertWrapperNoToolModeApprovalPathContained(targetPath, rootPath) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(rootPath);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`path_outside_install_root: ${resolvedTarget}`);
  }
}

function resolveFactoryHermesWrapperNoToolModeApprovalPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot,
    installRoot,
    wrapperPlanningResult: path.join(installRoot, 'wrapper-no-tool-mode-planning-result.json'),
    runtimeSelectionRevisionPlanningResult: path.join(installRoot, 'runtime-selection-revision-planning-result.json'),
    toolsetDisableVerificationApprovalResult: path.join(installRoot, 'toolset-disable-verification-approval-result.json'),
    researchRuntimeAdapterApprovalResult: path.join(installRoot, 'research-runtime-adapter-approval-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    finalExecutionApprovalResult: path.join(installRoot, 'final-execution-approval-result.json'),
    approvalResult: path.join(installRoot, 'wrapper-no-tool-mode-approval-result.json'),
  };
}

module.exports = { assertWrapperNoToolModeApprovalPathContained, resolveFactoryHermesWrapperNoToolModeApprovalPaths };
