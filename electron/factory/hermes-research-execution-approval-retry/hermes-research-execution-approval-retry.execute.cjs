const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertApprovalRetryPathContained, resolveFactoryHermesResearchExecutionApprovalRetryPaths } = require('./hermes-research-execution-approval-retry.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchExecutionApprovalRetry(input = {}) {
  const paths = resolveFactoryHermesResearchExecutionApprovalRetryPaths();
  for (const target of Object.values(paths).filter((value) => typeof value === 'string' && value !== paths.repoRoot && value !== paths.installRoot)) assertApprovalRetryPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesResearchExecutionApprovalRetry } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-execution-approval-retry', 'index.ts')).href);
  const evaluatedAt = input.evaluatedAt || '2026-07-22T19:00:00.000Z';
  const evaluatedBy = input.evaluatedBy || 'factory-hermes-research-execution-approval-retry-smoke';
  let result;
  try {
    result = evaluateFactoryHermesResearchExecutionApprovalRetry({
      evaluatedAt,
      evaluatedBy,
      runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
      runtimeSelectionPlanningResult: input.runtimeSelectionPlanningResult || await readJson(paths.runtimeSelectionPlanningResult),
      researchExecutionApprovalResult: input.researchExecutionApprovalResult || await readJson(paths.researchExecutionApprovalResult),
      researchExecutionBoundaryPlanningResult: input.researchExecutionBoundaryPlanningResult || await readJson(paths.researchExecutionBoundaryPlanningResult),
      policyPlanningResults: input.policyPlanningResults || {
        promptPolicyPlanning: await readJson(paths.promptPolicyPlanningResult),
        modelProviderPolicyPlanning: await readJson(paths.modelProviderPolicyPlanningResult),
        credentialsPolicyPlanning: await readJson(paths.credentialsPolicyPlanningResult),
        networkPolicyPlanning: await readJson(paths.networkPolicyPlanningResult),
        toolsetsPolicyPlanning: await readJson(paths.toolsetsPolicyPlanningResult),
        filesystemMutationPolicyPlanning: await readJson(paths.filesystemMutationPolicyPlanningResult),
        timeoutKillSwitchPolicyPlanning: await readJson(paths.timeoutKillSwitchPolicyPlanningResult),
        resultIngestionContractPlanning: await readJson(paths.resultIngestionContractPlanningResult),
        outputContractPolicyPlanning: await readJson(paths.outputContractPolicyPlanningResult),
      },
    });
  } catch (error) {
    result = evaluateFactoryHermesResearchExecutionApprovalRetry({ evaluatedAt, evaluatedBy });
    result = { ...result, blockers: [{ blockerId: 'runtime_read_failed', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.researchExecutionApprovalRetryResult), { recursive: true });
  await fs.writeFile(paths.researchExecutionApprovalRetryResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchExecutionApprovalRetry };
