const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimePreparationPathContained, resolveFactoryHermesControlledResearchRuntimePreparationPaths } = require('./hermes-controlled-research-runtime-preparation.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimePreparation(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimePreparationPaths();
  for (const target of [paths.controlledRuntimeApprovalResult, paths.controlledRuntimePlanningResult, paths.researchRuntimeAdapterResult, paths.runtimeSelectionDecisionResult, paths.preparationResult]) assertControlledResearchRuntimePreparationPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-preparation', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimePreparation({
    preparedAt: input.preparedAt || '2026-07-23T16:00:00.000Z',
    preparedBy: input.preparedBy || 'factory-hermes-controlled-research-runtime-preparation-smoke',
    controlledRuntimeApprovalResult: input.controlledRuntimeApprovalResult || await readJson(paths.controlledRuntimeApprovalResult),
    controlledRuntimePlanningResult: input.controlledRuntimePlanningResult || await readJson(paths.controlledRuntimePlanningResult),
    researchRuntimeAdapterResult: input.researchRuntimeAdapterResult || await readJson(paths.researchRuntimeAdapterResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
  });
  await fs.mkdir(path.dirname(paths.preparationResult), { recursive: true });
  await fs.writeFile(paths.preparationResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimePreparation };
