const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { inspectFactoryHermesModelProviderSource } = require('./hermes-model-provider-policy-planning.inspect.cjs');
const { assertModelProviderPolicyPlanningPathContained, resolveFactoryHermesModelProviderPolicyPlanningPaths } = require('./hermes-model-provider-policy-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesModelProviderPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesModelProviderPolicyPlanningPaths();
  for (const target of [paths.promptPolicyPlanningResult, paths.policyChainPlanningResult, paths.modelProviderPolicyPlanningResult, paths.researchExecutionPlanningResult]) assertModelProviderPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesModelProviderPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-model-provider-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T08:30:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-model-provider-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesModelProviderPolicyPlanning({
      plannedAt,
      plannedBy,
      promptPolicyPlanningResult: input.promptPolicyPlanningResult || await readJson(paths.promptPolicyPlanningResult),
      policyChainPlanningResult: input.policyChainPlanningResult || await readJson(paths.policyChainPlanningResult),
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
      providerSourceInspection: input.providerSourceInspection || inspectFactoryHermesModelProviderSource(paths.sourceRoot),
      planningNotes: input.planningNotes,
    });
  } catch (error) {
    result = evaluateFactoryHermesModelProviderPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_prompt_policy_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.modelProviderPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.modelProviderPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesModelProviderPolicyPlanning };
