const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationApprovalPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationApprovalPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationApprovalPaths();
  for (const target of [paths.resultArtifact, paths.implementationPlanningResult, paths.resolutionApprovalResult, paths.proofReviewResult]) {
    assertControlledResearchRuntimeSafeCommandShapeResolutionImplementationApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval', 'index.ts')).href);
  const [implementationPlanningResult, resolutionApprovalResult, proofReviewResult] = await Promise.all([
    readJson(paths.implementationPlanningResult),
    readJson(paths.resolutionApprovalResult),
    readJson(paths.proofReviewResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationApproval({
    approvedAt: input.approvedAt || '2026-07-24T20:45:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-approval-smoke',
    implementationPlanningResult,
    resolutionApprovalResult,
    proofReviewResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationApproval };
