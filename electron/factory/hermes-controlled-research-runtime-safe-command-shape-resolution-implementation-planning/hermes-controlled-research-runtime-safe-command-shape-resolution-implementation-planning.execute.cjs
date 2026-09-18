const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPaths();
  for (const target of [paths.resultArtifact, paths.resolutionApprovalResult, paths.resolutionPlanningResult, paths.proofReviewResult]) {
    assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning', 'index.ts')).href);
  const [resolutionApprovalResult, resolutionPlanningResult, proofReviewResult] = await Promise.all([
    readJson(paths.resolutionApprovalResult),
    readJson(paths.resolutionPlanningResult),
    readJson(paths.proofReviewResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanning({
    plannedAt: input.plannedAt || '2026-07-24T20:00:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning-smoke',
    resolutionApprovalResult,
    resolutionPlanningResult,
    proofReviewResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanning };
