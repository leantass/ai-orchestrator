const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { inspectFactoryHermesToolsetsSource } = require('./hermes-toolsets-policy-planning.inspect.cjs');
const { assertToolsetsPolicyPlanningPathContained, resolveFactoryHermesToolsetsPolicyPlanningPaths } = require('./hermes-toolsets-policy-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesToolsetsPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesToolsetsPolicyPlanningPaths();
  for (const target of [paths.networkPolicyPlanningResult, paths.credentialsPolicyPlanningResult, paths.modelProviderPolicyPlanningResult, paths.promptPolicyPlanningResult, paths.policyChainPlanningResult, paths.toolsetsPolicyPlanningResult]) assertToolsetsPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesToolsetsPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-toolsets-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T10:00:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-toolsets-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesToolsetsPolicyPlanning({
      plannedAt,
      plannedBy,
      networkPolicyPlanningResult: input.networkPolicyPlanningResult || await readJson(paths.networkPolicyPlanningResult),
      credentialsPolicyPlanningResult: input.credentialsPolicyPlanningResult || await readJson(paths.credentialsPolicyPlanningResult),
      modelProviderPolicyPlanningResult: input.modelProviderPolicyPlanningResult || await readJson(paths.modelProviderPolicyPlanningResult),
      promptPolicyPlanningResult: input.promptPolicyPlanningResult || await readJson(paths.promptPolicyPlanningResult),
      policyChainPlanningResult: input.policyChainPlanningResult || await readJson(paths.policyChainPlanningResult),
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
      toolsetsSourceInspection: input.toolsetsSourceInspection || inspectFactoryHermesToolsetsSource(paths.sourceRoot),
      planningNotes: input.planningNotes,
    });
  } catch (error) {
    result = evaluateFactoryHermesToolsetsPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_network_policy_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.toolsetsPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.toolsetsPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesToolsetsPolicyPlanning };
