const path = require('node:path');

function resolveRepoRoot() { return path.resolve(__dirname, '..', '..', '..'); }

function resolveFactoryHermesRuntimeSelectionDecisionPaths() {
  const repoRoot = resolveRepoRoot();
  const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f');
  return {
    repoRoot,
    installRoot,
    runtimeSelectionPlanningResult: path.join(installRoot, 'runtime-selection-planning-result.json'),
    researchExecutionApprovalResult: path.join(installRoot, 'research-execution-approval-result.json'),
    researchExecutionBoundaryPlanningResult: path.join(installRoot, 'research-execution-boundary-planning-result.json'),
    promptPolicyPlanningResult: path.join(installRoot, 'prompt-policy-planning-result.json'),
    modelProviderPolicyPlanningResult: path.join(installRoot, 'model-provider-policy-planning-result.json'),
    credentialsPolicyPlanningResult: path.join(installRoot, 'credentials-policy-planning-result.json'),
    networkPolicyPlanningResult: path.join(installRoot, 'network-policy-planning-result.json'),
    toolsetsPolicyPlanningResult: path.join(installRoot, 'toolsets-policy-planning-result.json'),
    filesystemMutationPolicyPlanningResult: path.join(installRoot, 'filesystem-mutation-policy-planning-result.json'),
    runtimeSelectionDecisionResult: path.join(installRoot, 'runtime-selection-decision-result.json'),
  };
}

function assertRuntimeSelectionDecisionPathContained(target, root) {
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`path_outside_root: ${target}`);
}

module.exports = { resolveFactoryHermesRuntimeSelectionDecisionPaths, assertRuntimeSelectionDecisionPathContained };
