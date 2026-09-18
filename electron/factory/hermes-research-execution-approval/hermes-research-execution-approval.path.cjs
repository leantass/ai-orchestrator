const path = require('node:path');

function resolveFactoryHermesResearchExecutionApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    researchExecutionApprovalRetryResult: path.join(installRoot, 'research-execution-approval-retry-result.json'),
    researchRuntimeAdapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    adapterApprovalRetryResult: path.join(installRoot, 'research-runtime-adapter-approval-retry-result.json'),
    wrapperVerificationReviewResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-review-result.json'),
    wrapperVerificationResult: path.join(installRoot, 'wrapper-no-tool-mode-verification-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    finalExecutionApprovalResult: path.join(installRoot, 'final-execution-approval-result.json'),
    approvalResult: path.join(installRoot, 'research-execution-approval-result.json'),
  };
}

function assertResearchExecutionApprovalPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesResearchExecutionApprovalPaths, assertResearchExecutionApprovalPathContained };
