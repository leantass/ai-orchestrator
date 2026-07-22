const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertPromptPolicyPlanningPathContained, resolveFactoryHermesPromptPolicyPlanningPaths } = require('./hermes-prompt-policy-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesPromptPolicyPlanning(input = {}) {
  const paths = resolveFactoryHermesPromptPolicyPlanningPaths();
  for (const target of [paths.policyChainPlanningResult, paths.promptPolicyPlanningResult, paths.researchExecutionPlanningResult, paths.researchJefeReviewV2Result]) assertPromptPolicyPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesPromptPolicyPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-prompt-policy-planning', 'index.ts')).href);
  const plannedAt = input.plannedAt || '2026-07-22T08:00:00.000Z';
  const plannedBy = input.plannedBy || 'factory-hermes-prompt-policy-planning-smoke';
  let result;
  try {
    result = evaluateFactoryHermesPromptPolicyPlanning({
      plannedAt,
      plannedBy,
      humanApprovalRef: input.humanApprovalRef,
      policyChainPlanningResult: input.policyChainPlanningResult || await readJson(paths.policyChainPlanningResult),
      deepSourceReview: input.deepSourceReview || await readJson(paths.deepSourceReview),
      commandShapeReview: input.commandShapeReview || await readJson(paths.commandShapeReview),
      planningNotes: input.planningNotes,
    });
  } catch (error) {
    result = evaluateFactoryHermesPromptPolicyPlanning({ plannedAt, plannedBy });
    result = { ...result, blockers: [{ blockerId: 'blocked_missing_policy_chain_planning', message: String(error.message || error) }] };
  }
  await fs.mkdir(path.dirname(paths.promptPolicyPlanningResult), { recursive: true });
  await fs.writeFile(paths.promptPolicyPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesPromptPolicyPlanning };
