const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeLiveArtifactPlanningPathContained, resolveFactoryHermesControlledResearchRuntimeLiveArtifactPlanningPaths } = require('./hermes-controlled-research-runtime-live-artifact-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeLiveArtifactPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactPlanningPaths();
  for (const target of [paths.preparationReviewResult, paths.preparationResult, paths.runtimeSelectionDecisionResult, paths.liveArtifactPlanningResult]) assertControlledResearchRuntimeLiveArtifactPlanningPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-live-artifact-planning', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeLiveArtifactPlanning({
    plannedAt: input.plannedAt || '2026-07-23T18:00:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-live-artifact-planning-smoke',
    preparationReviewResult: input.preparationReviewResult || await readJson(paths.preparationReviewResult),
    preparationResult: input.preparationResult || await readJson(paths.preparationResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
  });
  await fs.mkdir(path.dirname(paths.liveArtifactPlanningResult), { recursive: true });
  await fs.writeFile(paths.liveArtifactPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeLiveArtifactPlanning };
