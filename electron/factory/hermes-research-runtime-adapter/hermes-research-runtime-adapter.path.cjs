const path = require('node:path');

function resolveFactoryHermesResearchRuntimeAdapterPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    root,
    installRoot,
    adapterApprovalRetryResult: path.join(installRoot, 'research-runtime-adapter-approval-retry-result.json'),
    wrapperVerificationReviewResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-review-result.json'),
    wrapperVerificationResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-result.json'),
    previousAdapterApprovalResult: path.join(installRoot, 'research-runtime-adapter-approval-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    finalExecutionApprovalResult: path.join(installRoot, 'final-execution-approval-result.json'),
    adapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    adapterSourceRoot: path.join(root, 'src', 'factory', 'hermes-research-runtime-adapter'),
    adapterElectronRoot: path.join(root, 'electron', 'factory', 'hermes-research-runtime-adapter'),
  };
}

function assertAdapterPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesResearchRuntimeAdapterPaths, assertAdapterPathContained };
