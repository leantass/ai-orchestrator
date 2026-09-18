const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningPathContained,
  resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningPaths,
} = require('./hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningPaths();
  for (const target of [paths.resultArtifact, paths.proofRetryReviewResult, paths.proofRetryResult, paths.resolutionVerificationResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning', 'index.ts')).href);
  const [proofRetryReviewResult, proofRetryResult, resolutionVerificationResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(paths.proofRetryReviewResult),
    readJson(paths.proofRetryResult),
    readJson(paths.resolutionVerificationResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanning({
    plannedAt: input.plannedAt || '2026-07-25T00:15:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning-smoke',
    proofRetryReviewResult,
    proofRetryResult,
    resolutionVerificationResult,
    runtimeSelectionDecisionResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanning };
