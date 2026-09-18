const path = require('node:path');

function resolveFactoryHermesControlledResearchRuntimeApprovalPaths(root = process.cwd()) {
  const installRoot = path.join(root, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot: root,
    installRoot,
    controlledRuntimePlanningResult: path.join(installRoot, 'controlled-research-runtime-planning-result.json'),
    researchExecutionApprovalResult: path.join(installRoot, 'research-execution-approval-result.json'),
    researchRuntimeAdapterResult: path.join(installRoot, 'research-runtime-adapter-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    approvalResult: path.join(installRoot, 'controlled-research-runtime-approval-result.json'),
  };
}

function assertControlledResearchRuntimeApprovalPathContained(target, root) {
  const rel = path.relative(path.resolve(root), path.resolve(target));
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`Path escapes allowed root: ${target}`);
}

module.exports = { resolveFactoryHermesControlledResearchRuntimeApprovalPaths, assertControlledResearchRuntimeApprovalPathContained };
