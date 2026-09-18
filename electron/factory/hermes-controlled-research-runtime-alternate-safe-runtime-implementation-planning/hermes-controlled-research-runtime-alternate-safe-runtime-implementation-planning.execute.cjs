const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningPathContained,
  resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningPaths,
} = require('./hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningPaths();
  for (const target of [paths.resultArtifact, paths.alternateApprovalResult, paths.alternatePlanningResult, paths.proofRetryReviewResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning', 'index.ts')).href);
  const [alternateRuntimeResolutionApprovalResult, alternateRuntimeResolutionPlanningResult, proofRetryReviewResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(paths.alternateApprovalResult),
    readJson(paths.alternatePlanningResult),
    readJson(paths.proofRetryReviewResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanning({
    plannedAt: input.plannedAt || '2026-07-26T00:00:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning-smoke',
    alternateRuntimeResolutionApprovalResult,
    alternateRuntimeResolutionPlanningResult,
    proofRetryReviewResult,
    runtimeSelectionDecisionResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanning };
