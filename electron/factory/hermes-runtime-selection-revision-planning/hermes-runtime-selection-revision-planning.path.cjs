const path = require('node:path');
function resolveRepoRoot() { return path.resolve(__dirname, '..', '..', '..'); }
function resolveFactoryHermesRuntimeSelectionRevisionPlanningPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot,
    installRoot,
    toolsetDisableVerificationApprovalResult: path.join(installRoot, 'toolset-disable-verification-approval-result.json'),
    toolsetDisableVerificationPlanningResult: path.join(installRoot, 'toolset-disable-verification-planning-result.json'),
    researchRuntimeAdapterApprovalResult: path.join(installRoot, 'research-runtime-adapter-approval-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
    runtimeSelectionPlanningResult: path.join(installRoot, 'runtime-selection-planning-result.json'),
    toolsetsPolicyPlanningResult: path.join(installRoot, 'toolsets-policy-planning-result.json'),
    finalExecutionApprovalResult: path.join(installRoot, 'final-execution-approval-result.json'),
    runtimeSelectionRevisionPlanningResult: path.join(installRoot, 'runtime-selection-revision-planning-result.json'),
  };
}
function assertRuntimeSelectionRevisionPlanningPathContained(target, root) { const rel = path.relative(root, target); if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`path_outside_root: ${target}`); }
module.exports = { resolveFactoryHermesRuntimeSelectionRevisionPlanningPaths, assertRuntimeSelectionRevisionPlanningPathContained };
