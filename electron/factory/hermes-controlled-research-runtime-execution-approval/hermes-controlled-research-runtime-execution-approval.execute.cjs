const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeExecutionApprovalPathContained, resolveFactoryHermesControlledResearchRuntimeExecutionApprovalPaths } = require('./hermes-controlled-research-runtime-execution-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeExecutionApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeExecutionApprovalPaths();
  for (const target of [paths.executionApprovalResult, paths.executionPlanningResult, paths.liveArtifactVerificationReviewResult, paths.researchRuntimeAdapterResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeExecutionApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-execution-approval', 'index.ts')).href);
  const [planning, review, adapter, selection] = await Promise.all([
    readJson(paths.executionPlanningResult),
    readJson(paths.liveArtifactVerificationReviewResult),
    readJson(paths.researchRuntimeAdapterResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeExecutionApproval({
    approvedAt: input.approvedAt || '2026-07-24T02:00:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-execution-approval-smoke',
    executionPlanningResult: planning,
    liveArtifactVerificationReviewResult: review,
    researchRuntimeAdapterResult: adapter,
    runtimeSelectionDecisionResult: selection,
  });
  await fs.writeFile(paths.executionApprovalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeExecutionApproval };
