const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofApprovalPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalPaths();
  for (const target of [paths.resultArtifact, paths.proofPlanningResult, paths.executionReviewResult, paths.executionResult]) {
    assertControlledResearchRuntimeSafeCommandShapeProofApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-approval', 'index.ts')).href);
  const [proofPlanningResult, executionReviewResult, executionResult] = await Promise.all([
    readJson(paths.proofPlanningResult),
    readJson(paths.executionReviewResult),
    readJson(paths.executionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApproval({
    approvedAt: input.approvedAt || '2026-07-24T16:15:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-approval-smoke',
    proofPlanningResult,
    executionReviewResult,
    executionResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApproval };
