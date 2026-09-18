const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeExecutionPlanningPathContained, resolveFactoryHermesControlledResearchRuntimeExecutionPlanningPaths } = require('./hermes-controlled-research-runtime-execution-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeExecutionPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeExecutionPlanningPaths();
  for (const target of [paths.executionPlanningResult, paths.liveArtifactVerificationReviewResult, paths.liveArtifactVerificationResult, paths.liveArtifactCreationResult, paths.researchRuntimeAdapterResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeExecutionPlanningPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-execution-planning', 'index.ts')).href);
  const [review, verification, creation, adapter, selection] = await Promise.all([
    readJson(paths.liveArtifactVerificationReviewResult),
    readJson(paths.liveArtifactVerificationResult),
    readJson(paths.liveArtifactCreationResult),
    readJson(paths.researchRuntimeAdapterResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeExecutionPlanning({
    plannedAt: input.plannedAt || '2026-07-24T01:00:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-execution-planning-smoke',
    liveArtifactVerificationReviewResult: review,
    liveArtifactVerificationResult: verification,
    liveArtifactCreationResult: creation,
    researchRuntimeAdapterResult: adapter,
    runtimeSelectionDecisionResult: selection,
  });
  await fs.writeFile(paths.executionPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeExecutionPlanning };
