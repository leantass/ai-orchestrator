const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { makeHelpProbeInspection, makeSourceInspection } = require('./hermes-research-execution-planning.inspect.cjs');
const { assertResearchExecutionPlanningPathContained, resolveFactoryHermesResearchExecutionPlanningPaths } = require('./hermes-research-execution-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchExecutionPlanning(input = {}) {
  const paths = resolveFactoryHermesResearchExecutionPlanningPaths();
  const { evaluateFactoryHermesResearchExecutionPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-execution-planning', 'index.ts')).href);
  for (const target of [paths.reviewV2Result, paths.adapterRetryResult, paths.planningResult]) assertResearchExecutionPlanningPathContained(target, paths.installRoot);
  assertResearchExecutionPlanningPathContained(paths.sourceRoot, paths.installRoot);
  const plannedAt = input.plannedAt || '2026-07-22T06:15:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-research-execution-planning-smoke';
  let review;
  let retry;
  try {
    review = input.researchJefeReviewV2Result || await readJson(paths.reviewV2Result);
    retry = input.researchRuntimeAdapterRetryResult || await readJson(paths.adapterRetryResult);
  } catch (error) {
    const result = evaluateFactoryHermesResearchExecutionPlanning({ plannedAt, plannedBy });
    const blocked = { ...result, blockers: [{ blockerId: 'blocked_missing_jefe_review_v2', message: String(error.message || error) }] };
    await fs.writeFile(paths.planningResult, `${JSON.stringify(blocked, null, 2)}\n`);
    return blocked;
  }
  const result = evaluateFactoryHermesResearchExecutionPlanning({
    plannedAt,
    plannedBy,
    researchJefeReviewV2Result: review,
    helpProbeInspectionSummary: input.helpProbeInspectionSummary || makeHelpProbeInspection(retry),
    sourceInspectionSummary: input.sourceInspectionSummary || makeSourceInspection(paths.sourceRoot),
    planningNotes: input.planningNotes,
  });
  await fs.writeFile(paths.planningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchExecutionPlanning };
