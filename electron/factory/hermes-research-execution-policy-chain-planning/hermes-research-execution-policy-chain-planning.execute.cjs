const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertPolicyChainPlanningPathContained, resolveFactoryHermesResearchExecutionPolicyChainPlanningPaths } = require('./hermes-research-execution-policy-chain-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchExecutionPolicyChainPlanning(input = {}) {
  const paths = resolveFactoryHermesResearchExecutionPolicyChainPlanningPaths();
  for (const target of [paths.researchExecutionPlanningResult, paths.researchJefeReviewV2Result, paths.researchResultIngestionV2Result, paths.policyChainPlanningResult]) assertPolicyChainPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesResearchExecutionPolicyChainPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-execution-policy-chain-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T07:30:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-research-execution-policy-chain-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesResearchExecutionPolicyChainPlanning({
      plannedAt,
      plannedBy,
      humanApprovalRef: input.humanApprovalRef,
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
      commandShapeReview: input.commandShapeReview || await readJson(paths.commandShapeReview),
      researchExecutionPlanningResult: input.researchExecutionPlanningResult || await readJson(paths.researchExecutionPlanningResult),
      planningNotes: input.planningNotes,
    });
  } catch (error) {
    result = evaluateFactoryHermesResearchExecutionPolicyChainPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_deep_source_review', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.policyChainPlanningResult), { recursive: true });
  await fs.writeFile(paths.policyChainPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchExecutionPolicyChainPlanning };
