const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertRuntimeSelectionPlanningPathContained, resolveFactoryHermesRuntimeSelectionPlanningPaths } = require('./hermes-runtime-selection-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesRuntimeSelectionPlanning(input = {}) {
  const paths = resolveFactoryHermesRuntimeSelectionPlanningPaths();
  for (const target of [paths.approvalResult, paths.boundaryPlanningResult, paths.filesystemMutationPolicyPlanningResult, paths.timeoutKillSwitchPolicyPlanningResult, paths.resultIngestionContractPlanningResult, paths.outputContractPolicyPlanningResult, paths.toolsetsPolicyPlanningResult, paths.networkPolicyPlanningResult, paths.credentialsPolicyPlanningResult, paths.modelProviderPolicyPlanningResult, paths.promptPolicyPlanningResult, paths.runtimeSelectionPlanningResult]) assertRuntimeSelectionPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesRuntimeSelectionPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-runtime-selection-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T17:00:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-runtime-selection-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesRuntimeSelectionPlanning({
      plannedAt,
      plannedBy,
      researchExecutionApprovalResult: input.researchExecutionApprovalResult || await readJson(paths.approvalResult),
      researchExecutionBoundaryPlanningResult: input.researchExecutionBoundaryPlanningResult || await readJson(paths.boundaryPlanningResult),
      policyPlanningResults: input.policyPlanningResults || {
        filesystemMutationPolicyPlanning: await readJson(paths.filesystemMutationPolicyPlanningResult),
        timeoutKillSwitchPolicyPlanning: await readJson(paths.timeoutKillSwitchPolicyPlanningResult),
        resultIngestionContractPlanning: await readJson(paths.resultIngestionContractPlanningResult),
        outputContractPolicyPlanning: await readJson(paths.outputContractPolicyPlanningResult),
        toolsetsPolicyPlanning: await readJson(paths.toolsetsPolicyPlanningResult),
        networkPolicyPlanning: await readJson(paths.networkPolicyPlanningResult),
        credentialsPolicyPlanning: await readJson(paths.credentialsPolicyPlanningResult),
        modelProviderPolicyPlanning: await readJson(paths.modelProviderPolicyPlanningResult),
        promptPolicyPlanning: await readJson(paths.promptPolicyPlanningResult),
      },
    });
  } catch (error) {
    result = evaluateFactoryHermesRuntimeSelectionPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'runtime_read_failed', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.runtimeSelectionPlanningResult), { recursive: true });
  await fs.writeFile(paths.runtimeSelectionPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesRuntimeSelectionPlanning };
