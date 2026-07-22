const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertRuntimeSelectionDecisionPathContained, resolveFactoryHermesRuntimeSelectionDecisionPaths } = require('./hermes-runtime-selection-decision.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesRuntimeSelectionDecision(input = {}) {
  const paths = resolveFactoryHermesRuntimeSelectionDecisionPaths();
  for (const target of [paths.runtimeSelectionPlanningResult, paths.researchExecutionApprovalResult, paths.researchExecutionBoundaryPlanningResult, paths.promptPolicyPlanningResult, paths.modelProviderPolicyPlanningResult, paths.credentialsPolicyPlanningResult, paths.networkPolicyPlanningResult, paths.toolsetsPolicyPlanningResult, paths.filesystemMutationPolicyPlanningResult, paths.runtimeSelectionDecisionResult]) assertRuntimeSelectionDecisionPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesRuntimeSelectionDecision } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-runtime-selection-decision', 'index.ts')).href);
  const decidedAt = input.decidedAt || '2026-07-22T18:00:00.000Z';
  const decidedBy = input.decidedBy || 'factory-hermes-runtime-selection-decision-smoke';
  let result;
  try {
    result = evaluateFactoryHermesRuntimeSelectionDecision({
      decidedAt,
      decidedBy,
      runtimeSelectionPlanningResult: input.runtimeSelectionPlanningResult || await readJson(paths.runtimeSelectionPlanningResult),
      researchExecutionApprovalResult: input.researchExecutionApprovalResult || await readJson(paths.researchExecutionApprovalResult),
      policyPlanningResults: input.policyPlanningResults || {
        researchExecutionBoundaryPlanning: await readJson(paths.researchExecutionBoundaryPlanningResult),
        promptPolicyPlanning: await readJson(paths.promptPolicyPlanningResult),
        modelProviderPolicyPlanning: await readJson(paths.modelProviderPolicyPlanningResult),
        credentialsPolicyPlanning: await readJson(paths.credentialsPolicyPlanningResult),
        networkPolicyPlanning: await readJson(paths.networkPolicyPlanningResult),
        toolsetsPolicyPlanning: await readJson(paths.toolsetsPolicyPlanningResult),
        filesystemMutationPolicyPlanning: await readJson(paths.filesystemMutationPolicyPlanningResult),
      },
    });
  } catch (error) {
    result = evaluateFactoryHermesRuntimeSelectionDecision({ decidedAt, decidedBy });
    result = { ...result, blockers: [{ blockerId: 'runtime_read_failed', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.runtimeSelectionDecisionResult), { recursive: true });
  await fs.writeFile(paths.runtimeSelectionDecisionResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesRuntimeSelectionDecision };
