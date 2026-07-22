const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { inspectFactoryHermesCredentialSource } = require('./hermes-credentials-policy-planning.inspect.cjs');
const { assertCredentialsPolicyPlanningPathContained, resolveFactoryHermesCredentialsPolicyPlanningPaths } = require('./hermes-credentials-policy-planning.path.cjs');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesCredentialsPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesCredentialsPolicyPlanningPaths();
  for (const target of [paths.modelProviderPolicyPlanningResult, paths.promptPolicyPlanningResult, paths.credentialsPolicyPlanningResult]) assertCredentialsPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesCredentialsPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-credentials-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T09:00:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-credentials-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesCredentialsPolicyPlanning({ plannedAt, plannedBy, modelProviderPolicyPlanningResult: input.modelProviderPolicyPlanningResult || await readJson(paths.modelProviderPolicyPlanningResult), promptPolicyPlanningResult: input.promptPolicyPlanningResult || await readJson(paths.promptPolicyPlanningResult), deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview), credentialSourceInspection: input.credentialSourceInspection || inspectFactoryHermesCredentialSource(paths.sourceRoot), planningNotes: input.planningNotes });
  } catch (error) {
    result = evaluateFactoryHermesCredentialsPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_model_provider_policy_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.credentialsPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.credentialsPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesCredentialsPolicyPlanning };
