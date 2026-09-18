const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeLiveArtifactVerificationReviewPathContained, resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewPaths } = require('./hermes-controlled-research-runtime-live-artifact-verification-review.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReview(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReviewPaths();
  for (const target of [paths.liveArtifactVerificationReviewResult, paths.liveArtifactVerificationResult, paths.liveArtifactCreationResult, paths.liveArtifactApprovalResult, paths.liveArtifactPlanningResult, paths.preparationReviewResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeLiveArtifactVerificationReviewPathContained(target, paths.installRoot);
  }

  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-live-artifact-verification-review', 'index.ts')).href);
  const [verification, creation, approval, planning, preparationReview, runtimeSelection] = await Promise.all([
    readJson(paths.liveArtifactVerificationResult),
    readJson(paths.liveArtifactCreationResult),
    readJson(paths.liveArtifactApprovalResult),
    readJson(paths.liveArtifactPlanningResult),
    readJson(paths.preparationReviewResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReview({
    reviewedAt: input.reviewedAt || '2026-07-24T00:00:00.000Z',
    reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-live-artifact-verification-review-smoke',
    liveArtifactVerificationResult: verification,
    liveArtifactCreationResult: creation,
    liveArtifactApprovalResult: approval,
    liveArtifactPlanningResult: planning,
    preparationReviewResult: preparationReview,
    runtimeSelectionDecisionResult: runtimeSelection,
  });
  await fs.writeFile(paths.liveArtifactVerificationReviewResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeLiveArtifactVerificationReview };
