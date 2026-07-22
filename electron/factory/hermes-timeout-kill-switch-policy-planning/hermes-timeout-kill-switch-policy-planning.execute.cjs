const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertTimeoutKillSwitchPolicyPlanningPathContained, resolveFactoryHermesTimeoutKillSwitchPolicyPlanningPaths } = require('./hermes-timeout-kill-switch-policy-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesTimeoutKillSwitchPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesTimeoutKillSwitchPolicyPlanningPaths();
  for (const target of [paths.resultIngestionContractPlanningResult, paths.outputContractPolicyPlanningResult, paths.timeoutKillSwitchPolicyPlanningResult]) assertTimeoutKillSwitchPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesTimeoutKillSwitchPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-timeout-kill-switch-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T13:30:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-timeout-kill-switch-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesTimeoutKillSwitchPolicyPlanning({
      plannedAt,
      plannedBy,
      resultIngestionContractPlanningResult: input.resultIngestionContractPlanningResult || await readJson(paths.resultIngestionContractPlanningResult),
      outputContractPolicyPlanningResult: input.outputContractPolicyPlanningResult || await readJson(paths.outputContractPolicyPlanningResult),
    });
  } catch (error) {
    result = evaluateFactoryHermesTimeoutKillSwitchPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_result_ingestion_contract_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.timeoutKillSwitchPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.timeoutKillSwitchPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesTimeoutKillSwitchPolicyPlanning };
