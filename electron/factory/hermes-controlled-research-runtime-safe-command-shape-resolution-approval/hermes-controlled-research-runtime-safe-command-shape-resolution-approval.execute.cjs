const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeResolutionApprovalPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalPaths();
  for (const target of [paths.resultArtifact, paths.resolutionPlanningResult, paths.proofReviewResult, paths.proofResult]) {
    assertControlledResearchRuntimeSafeCommandShapeResolutionApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-approval', 'index.ts')).href);
  const [resolutionPlanningResult, proofReviewResult, proofResult] = await Promise.all([
    readJson(paths.resolutionPlanningResult),
    readJson(paths.proofReviewResult),
    readJson(paths.proofResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApproval({
    approvedAt: input.approvedAt || '2026-07-24T19:15:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-approval-smoke',
    resolutionPlanningResult,
    proofReviewResult,
    proofResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApproval };
