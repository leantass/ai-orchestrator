const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimePlanningPathContained, resolveFactoryHermesControlledResearchRuntimePlanningPaths } = require('./hermes-controlled-research-runtime-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimePlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimePlanningPaths();
  for (const target of [paths.researchExecutionApprovalResult, paths.researchRuntimeAdapterResult, paths.runtimeSelectionDecisionResult, paths.planningResult]) assertControlledResearchRuntimePlanningPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-planning', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimePlanning({
    plannedAt: input.plannedAt || '2026-07-23T14:00:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-planning-smoke',
    researchExecutionApprovalResult: input.researchExecutionApprovalResult || await readJson(paths.researchExecutionApprovalResult),
    researchRuntimeAdapterResult: input.researchRuntimeAdapterResult || await readJson(paths.researchRuntimeAdapterResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
  });
  await fs.mkdir(path.dirname(paths.planningResult), { recursive: true });
  await fs.writeFile(paths.planningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimePlanning };
