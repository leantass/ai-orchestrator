const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeResolutionPlanningPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningPaths();
  for (const target of [paths.resultArtifact, paths.proofReviewResult, paths.proofResult, paths.proofApprovalResult, paths.proofPlanningResult, paths.executionReviewResult, paths.executionResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeSafeCommandShapeResolutionPlanningPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-planning', 'index.ts')).href);
  const [proofReviewResult, proofResult, executionReviewResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(paths.proofReviewResult),
    readJson(paths.proofResult),
    readJson(paths.executionReviewResult),
    readJson(paths.runtimeSelectionDecisionResult).catch(() => undefined),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanning({
    plannedAt: input.plannedAt || '2026-07-24T18:30:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-planning-smoke',
    proofReviewResult,
    proofResult,
    executionReviewResult,
    runtimeSelectionDecisionResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanning };
