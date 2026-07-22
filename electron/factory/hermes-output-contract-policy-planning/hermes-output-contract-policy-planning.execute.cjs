const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { inspectFactoryHermesOutputSource } = require('./hermes-output-contract-policy-planning.inspect.cjs');
const { assertOutputContractPolicyPlanningPathContained, resolveFactoryHermesOutputContractPolicyPlanningPaths } = require('./hermes-output-contract-policy-planning.path.cjs');

async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }

async function executeFactoryHermesOutputContractPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesOutputContractPolicyPlanningPaths();
  for (const target of [paths.toolsetsPolicyPlanningResult, paths.networkPolicyPlanningResult, paths.outputContractPolicyPlanningResult]) assertOutputContractPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesOutputContractPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-output-contract-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T10:30:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-output-contract-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesOutputContractPolicyPlanning({
      plannedAt, plannedBy,
      toolsetsPolicyPlanningResult: input.toolsetsPolicyPlanningResult || await readJson(paths.toolsetsPolicyPlanningResult),
      networkPolicyPlanningResult: input.networkPolicyPlanningResult || await readJson(paths.networkPolicyPlanningResult),
      credentialsPolicyPlanningResult: input.credentialsPolicyPlanningResult || await readJson(paths.credentialsPolicyPlanningResult),
      modelProviderPolicyPlanningResult: input.modelProviderPolicyPlanningResult || await readJson(paths.modelProviderPolicyPlanningResult),
      promptPolicyPlanningResult: input.promptPolicyPlanningResult || await readJson(paths.promptPolicyPlanningResult),
      policyChainPlanningResult: input.policyChainPlanningResult || await readJson(paths.policyChainPlanningResult),
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
      outputSourceInspection: input.outputSourceInspection || inspectFactoryHermesOutputSource(paths.sourceRoot),
    });
  } catch (error) {
    result = evaluateFactoryHermesOutputContractPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_toolsets_policy_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.outputContractPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.outputContractPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesOutputContractPolicyPlanning };
