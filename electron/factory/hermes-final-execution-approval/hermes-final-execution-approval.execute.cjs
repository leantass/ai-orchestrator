const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertFinalExecutionApprovalPathContained, resolveFactoryHermesFinalExecutionApprovalPaths } = require('./hermes-final-execution-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesFinalExecutionApproval(input = {}) {
  const paths = resolveFactoryHermesFinalExecutionApprovalPaths();
  for (const target of Object.values(paths).filter((value) => typeof value === 'string' && value !== paths.repoRoot && value !== paths.installRoot)) assertFinalExecutionApprovalPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesFinalExecutionApproval } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-final-execution-approval', 'index.ts')).href);
  const approvedAt = input.approvedAt || '2026-07-22T20:00:00.000Z';
  const approvedBy = input.approvedBy || 'factory-hermes-final-execution-approval-smoke';
  let result;
  try {
    result = evaluateFactoryHermesFinalExecutionApproval({
      approvedAt,
      approvedBy,
      researchExecutionApprovalRetryResult: input.researchExecutionApprovalRetryResult || await readJson(paths.researchExecutionApprovalRetryResult),
      runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
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
      approval: { finalExecutionApproved: true, approvalScope: 'first_controlled_hermes_oneshot_run' },
    });
  } catch (error) {
    result = evaluateFactoryHermesFinalExecutionApproval({ approvedAt, approvedBy });
    result = { ...result, blockers: [{ blockerId: 'runtime_read_failed', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.finalExecutionApprovalResult), { recursive: true });
  await fs.writeFile(paths.finalExecutionApprovalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesFinalExecutionApproval };
