const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertResearchExecutionBoundaryPlanningPathContained, resolveFactoryHermesResearchExecutionBoundaryPlanningPaths } = require('./hermes-research-execution-boundary-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchExecutionBoundaryPlanning(input = {}) {
  const paths = resolveFactoryHermesResearchExecutionBoundaryPlanningPaths();
  for (const target of [paths.policyChainPlanningResult, paths.promptPolicyPlanningResult, paths.modelProviderPolicyPlanningResult, paths.credentialsPolicyPlanningResult, paths.networkPolicyPlanningResult, paths.toolsetsPolicyPlanningResult, paths.outputContractPolicyPlanningResult, paths.resultIngestionContractPlanningResult, paths.timeoutKillSwitchPolicyPlanningResult, paths.filesystemMutationPolicyPlanningResult, paths.boundaryPlanningResult]) assertResearchExecutionBoundaryPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesResearchExecutionBoundaryPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-execution-boundary-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T16:00:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-research-execution-boundary-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesResearchExecutionBoundaryPlanning({
      plannedAt,
      plannedBy,
      filesystemMutationPolicyPlanningResult: input.filesystemMutationPolicyPlanningResult || await readJson(paths.filesystemMutationPolicyPlanningResult),
      timeoutKillSwitchPolicyPlanningResult: input.timeoutKillSwitchPolicyPlanningResult || await readJson(paths.timeoutKillSwitchPolicyPlanningResult),
      resultIngestionContractPlanningResult: input.resultIngestionContractPlanningResult || await readJson(paths.resultIngestionContractPlanningResult),
      outputContractPolicyPlanningResult: input.outputContractPolicyPlanningResult || await readJson(paths.outputContractPolicyPlanningResult),
      toolsetsPolicyPlanningResult: input.toolsetsPolicyPlanningResult || await readJson(paths.toolsetsPolicyPlanningResult),
      networkPolicyPlanningResult: input.networkPolicyPlanningResult || await readJson(paths.networkPolicyPlanningResult),
      credentialsPolicyPlanningResult: input.credentialsPolicyPlanningResult || await readJson(paths.credentialsPolicyPlanningResult),
      modelProviderPolicyPlanningResult: input.modelProviderPolicyPlanningResult || await readJson(paths.modelProviderPolicyPlanningResult),
      promptPolicyPlanningResult: input.promptPolicyPlanningResult || await readJson(paths.promptPolicyPlanningResult),
      policyChainPlanningResult: input.policyChainPlanningResult || await readJson(paths.policyChainPlanningResult),
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
      commandShapeReview: input.commandShapeReview || await readJson(paths.commandShapeReview),
    });
  } catch (error) {
    result = evaluateFactoryHermesResearchExecutionBoundaryPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_policy_planning_result', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.boundaryPlanningResult), { recursive: true });
  await fs.writeFile(paths.boundaryPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchExecutionBoundaryPlanning };
