const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPaths();
  for (const target of [paths.resultArtifact, paths.resolutionVerificationResult, paths.implementationResult, paths.proofReviewResult]) {
    assertControlledResearchRuntimeSafeCommandShapeProofRetryPlanningPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning', 'index.ts')).href);
  const [resolutionVerificationResult, implementationResult, proofReviewResult] = await Promise.all([
    readJson(paths.resolutionVerificationResult),
    readJson(paths.implementationResult),
    readJson(paths.proofReviewResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPlanning({
    plannedAt: input.plannedAt || '2026-07-24T23:00:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-planning-smoke',
    resolutionVerificationResult,
    implementationResult,
    proofReviewResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPlanning };
