const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertResultIngestionContractPlanningPathContained, resolveFactoryHermesResultIngestionContractPlanningPaths } = require('./hermes-result-ingestion-contract-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResultIngestionContractPlanning(input = {}) {
  const paths = resolveFactoryHermesResultIngestionContractPlanningPaths();
  for (const target of [paths.outputContractPolicyPlanningResult, paths.toolsetsPolicyPlanningResult, paths.networkPolicyPlanningResult, paths.credentialsPolicyPlanningResult, paths.resultIngestionContractPlanningResult]) assertResultIngestionContractPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesResultIngestionContractPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-result-ingestion-contract-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T12:30:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-result-ingestion-contract-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesResultIngestionContractPlanning({
      plannedAt,
      plannedBy,
      outputContractPolicyPlanningResult: input.outputContractPolicyPlanningResult || await readJson(paths.outputContractPolicyPlanningResult),
      toolsetsPolicyPlanningResult: input.toolsetsPolicyPlanningResult || await readJson(paths.toolsetsPolicyPlanningResult),
      networkPolicyPlanningResult: input.networkPolicyPlanningResult || await readJson(paths.networkPolicyPlanningResult),
      credentialsPolicyPlanningResult: input.credentialsPolicyPlanningResult || await readJson(paths.credentialsPolicyPlanningResult),
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
    });
  } catch (error) {
    result = evaluateFactoryHermesResultIngestionContractPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_output_contract_policy_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.resultIngestionContractPlanningResult), { recursive: true });
  await fs.writeFile(paths.resultIngestionContractPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResultIngestionContractPlanning };
