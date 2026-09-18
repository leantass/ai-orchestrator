const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofReviewPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof-review.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReview(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewPaths();
  for (const target of [paths.resultArtifact, paths.proofResult, paths.proofApprovalResult, paths.proofPlanningResult, paths.executionReviewResult, paths.executionResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeSafeCommandShapeProofReviewPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-review', 'index.ts')).href);
  const [proofResult, proofApprovalResult, proofPlanningResult, executionReviewResult, executionResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(paths.proofResult),
    readJson(paths.proofApprovalResult),
    readJson(paths.proofPlanningResult),
    readJson(paths.executionReviewResult),
    readJson(paths.executionResult),
    readJson(paths.runtimeSelectionDecisionResult).catch(() => undefined),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReview({
    reviewedAt: input.reviewedAt || '2026-07-24T17:45:00.000Z',
    reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-review-smoke',
    proofResult,
    proofApprovalResult,
    proofPlanningResult,
    executionReviewResult,
    executionResult,
    runtimeSelectionDecisionResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReview };
