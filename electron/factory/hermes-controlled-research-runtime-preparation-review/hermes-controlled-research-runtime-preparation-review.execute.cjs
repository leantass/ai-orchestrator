const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimePreparationReviewPathContained, resolveFactoryHermesControlledResearchRuntimePreparationReviewPaths } = require('./hermes-controlled-research-runtime-preparation-review.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimePreparationReview(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimePreparationReviewPaths();
  for (const target of [paths.controlledRuntimePreparationResult, paths.controlledRuntimeApprovalResult, paths.controlledRuntimePlanningResult, paths.preparationReviewResult]) assertControlledResearchRuntimePreparationReviewPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-preparation-review', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimePreparationReview({
    reviewedAt: input.reviewedAt || '2026-07-23T17:00:00.000Z',
    reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-preparation-review-smoke',
    controlledRuntimePreparationResult: input.controlledRuntimePreparationResult || await readJson(paths.controlledRuntimePreparationResult),
    controlledRuntimeApprovalResult: input.controlledRuntimeApprovalResult || await readJson(paths.controlledRuntimeApprovalResult),
    controlledRuntimePlanningResult: input.controlledRuntimePlanningResult || await readJson(paths.controlledRuntimePlanningResult),
  });
  await fs.mkdir(path.dirname(paths.preparationReviewResult), { recursive: true });
  await fs.writeFile(paths.preparationReviewResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimePreparationReview };
