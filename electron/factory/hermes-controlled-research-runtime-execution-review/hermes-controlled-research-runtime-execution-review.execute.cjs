const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeExecutionReviewPathContained, resolveFactoryHermesControlledResearchRuntimeExecutionReviewPaths } = require('./hermes-controlled-research-runtime-execution-review.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeExecutionReview(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeExecutionReviewPaths();
  for (const target of [paths.executionReviewResult, paths.executionResult, paths.executionApprovalResult, paths.executionPlanningResult, paths.promptManifestPath]) {
    assertControlledResearchRuntimeExecutionReviewPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-execution-review', 'index.ts')).href);
  const [execution, approval, planning] = await Promise.all([
    readJson(paths.executionResult),
    readJson(paths.executionApprovalResult),
    readJson(paths.executionPlanningResult),
  ]);
  const promptManifest = fsSync.existsSync(paths.promptManifestPath) ? await readJson(paths.promptManifestPath) : undefined;
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeExecutionReview({
    reviewedAt: input.reviewedAt || '2026-07-24T04:00:00.000Z',
    reviewedBy: input.reviewedBy || 'factory-hermes-controlled-research-runtime-execution-review-smoke',
    executionResult: execution,
    executionApprovalResult: approval,
    executionPlanningResult: planning,
    promptManifest,
  });
  await fs.writeFile(paths.executionReviewResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeExecutionReview };
