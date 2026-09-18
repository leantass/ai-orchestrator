const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofRetryReviewPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof-retry-review.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReview(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewPaths();
  for (const target of [paths.resultArtifact, paths.proofRetryResult, paths.proofRetryApprovalResult, paths.proofRetryPlanningResult, paths.resolutionVerificationResult]) {
    assertControlledResearchRuntimeSafeCommandShapeProofRetryReviewPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-review', 'index.ts')).href);
  const [proofRetryResult, proofRetryApprovalResult, proofRetryPlanningResult, resolutionVerificationResult] = await Promise.all([
    readJson(paths.proofRetryResult),
    readJson(paths.proofRetryApprovalResult),
    readJson(paths.proofRetryPlanningResult),
    readJson(paths.resolutionVerificationResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReview({
    reviewedAt: input.reviewedAt || '2026-07-25T00:00:00.000Z',
    reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-review-smoke',
    proofRetryResult,
    proofRetryApprovalResult,
    proofRetryPlanningResult,
    resolutionVerificationResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReview };
