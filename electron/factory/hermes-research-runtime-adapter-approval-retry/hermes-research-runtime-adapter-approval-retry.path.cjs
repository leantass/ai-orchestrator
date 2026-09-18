const path = require('node:path');

function repoRoot() {
  return path.resolve(__dirname, '..', '..', '..');
}

function resolveFactoryHermesResearchRuntimeAdapterApprovalRetryPaths() {
  const root = repoRoot();
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    wrapperVerificationReviewResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-review-result.json'),
    wrapperVerificationResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-result.json'),
    wrapperVerificationApprovalResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-approval-result.json'),
    wrapperImplementationResult: path.join(installRoot, 'wrapper-no-tool-mode-implementation-result.json'),
    previousAdapterApprovalResult: path.join(installRoot, 'research-runtime-adapter-approval-result.json'),
    runtimeSelectionRevisionPlanningResult: path.join(installRoot, 'runtime-selection-revision-planning-result.json'),
    toolsetDisableVerificationApprovalResult: path.join(installRoot, 'toolset-disable-verification-approval-result.json'),
    researchRuntimeAdapterApprovalRetryResult: path.join(installRoot, 'research-runtime-adapter-approval-retry-result.json'),
  };
}

function assertAdapterApprovalRetryPathContained(target, container) {
  const relative = path.relative(container, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`path_outside_install_root: ${target}`);
}

module.exports = { resolveFactoryHermesResearchRuntimeAdapterApprovalRetryPaths, assertAdapterApprovalRetryPathContained };
