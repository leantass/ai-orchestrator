const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertResearchExecutionApprovalPathContained, resolveFactoryHermesResearchExecutionApprovalPaths } = require('./hermes-research-execution-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchExecutionApproval(input = {}) {
  const paths = resolveFactoryHermesResearchExecutionApprovalPaths();
  for (const target of [paths.boundaryPlanningResult, paths.policyChainPlanningResult, paths.promptPolicyPlanningResult, paths.modelProviderPolicyPlanningResult, paths.credentialsPolicyPlanningResult, paths.networkPolicyPlanningResult, paths.toolsetsPolicyPlanningResult, paths.outputContractPolicyPlanningResult, paths.resultIngestionContractPlanningResult, paths.timeoutKillSwitchPolicyPlanningResult, paths.filesystemMutationPolicyPlanningResult, paths.approvalResult]) assertResearchExecutionApprovalPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesResearchExecutionApproval } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-execution-approval', 'index.ts')).href);
  const approvedAt = input.approvedAt || '2026-07-22T16:30:00.000Z';
  const approvedBy = input.approvedBy || 'factory-hermes-research-execution-approval-smoke';
  let result;
  try {
    result = evaluateFactoryHermesResearchExecutionApproval({
      approvedAt,
      approvedBy,
      researchExecutionBoundaryPlanningResult: input.researchExecutionBoundaryPlanningResult || await readJson(paths.boundaryPlanningResult),
      policyPlanningResults: input.policyPlanningResults || {
        policyChainPlanning: await readJson(paths.policyChainPlanningResult),
        promptPolicyPlanning: await readJson(paths.promptPolicyPlanningResult),
        modelProviderPolicyPlanning: await readJson(paths.modelProviderPolicyPlanningResult),
        credentialsPolicyPlanning: await readJson(paths.credentialsPolicyPlanningResult),
        networkPolicyPlanning: await readJson(paths.networkPolicyPlanningResult),
        toolsetsPolicyPlanning: await readJson(paths.toolsetsPolicyPlanningResult),
        outputContractPolicyPlanning: await readJson(paths.outputContractPolicyPlanningResult),
        resultIngestionContractPlanning: await readJson(paths.resultIngestionContractPlanningResult),
        timeoutKillSwitchPolicyPlanning: await readJson(paths.timeoutKillSwitchPolicyPlanningResult),
        filesystemMutationPolicyPlanning: await readJson(paths.filesystemMutationPolicyPlanningResult),
      },
    });
  } catch (error) {
    result = evaluateFactoryHermesResearchExecutionApproval({ approvedAt, approvedBy });
    result = { ...result, approvalBlockers: [{ blockerId: 'runtime_read_failed', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.approvalResult), { recursive: true });
  await fs.writeFile(paths.approvalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchExecutionApproval };
