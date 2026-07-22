const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { inspectFactoryHermesNetworkSource } = require('./hermes-network-policy-planning.inspect.cjs');
const { assertNetworkPolicyPlanningPathContained, resolveFactoryHermesNetworkPolicyPlanningPaths } = require('./hermes-network-policy-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesNetworkPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesNetworkPolicyPlanningPaths();
  for (const target of [paths.credentialsPolicyPlanningResult, paths.modelProviderPolicyPlanningResult, paths.promptPolicyPlanningResult, paths.policyChainPlanningResult, paths.networkPolicyPlanningResult]) assertNetworkPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesNetworkPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-network-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T09:30:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-network-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesNetworkPolicyPlanning({
      plannedAt,
      plannedBy,
      credentialsPolicyPlanningResult: input.credentialsPolicyPlanningResult || await readJson(paths.credentialsPolicyPlanningResult),
      modelProviderPolicyPlanningResult: input.modelProviderPolicyPlanningResult || await readJson(paths.modelProviderPolicyPlanningResult),
      promptPolicyPlanningResult: input.promptPolicyPlanningResult || await readJson(paths.promptPolicyPlanningResult),
      policyChainPlanningResult: input.policyChainPlanningResult || await readJson(paths.policyChainPlanningResult),
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
      networkSourceInspection: input.networkSourceInspection || inspectFactoryHermesNetworkSource(paths.sourceRoot),
      planningNotes: input.planningNotes,
    });
  } catch (error) {
    result = evaluateFactoryHermesNetworkPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_credentials_policy_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.networkPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.networkPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesNetworkPolicyPlanning };
