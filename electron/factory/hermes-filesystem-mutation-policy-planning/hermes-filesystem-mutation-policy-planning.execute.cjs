const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertFilesystemMutationPolicyPlanningPathContained, resolveFactoryHermesFilesystemMutationPolicyPlanningPaths } = require('./hermes-filesystem-mutation-policy-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesFilesystemMutationPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesFilesystemMutationPolicyPlanningPaths();
  for (const target of [paths.timeoutKillSwitchPolicyPlanningResult, paths.resultIngestionContractPlanningResult, paths.filesystemMutationPolicyPlanningResult]) assertFilesystemMutationPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesFilesystemMutationPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-filesystem-mutation-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T14:30:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-filesystem-mutation-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesFilesystemMutationPolicyPlanning({
      plannedAt,
      plannedBy,
      timeoutKillSwitchPolicyPlanningResult: input.timeoutKillSwitchPolicyPlanningResult || await readJson(paths.timeoutKillSwitchPolicyPlanningResult),
      resultIngestionContractPlanningResult: input.resultIngestionContractPlanningResult || await readJson(paths.resultIngestionContractPlanningResult),
    });
  } catch (error) {
    result = evaluateFactoryHermesFilesystemMutationPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_timeout_kill_switch_policy_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.filesystemMutationPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.filesystemMutationPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesFilesystemMutationPolicyPlanning };
