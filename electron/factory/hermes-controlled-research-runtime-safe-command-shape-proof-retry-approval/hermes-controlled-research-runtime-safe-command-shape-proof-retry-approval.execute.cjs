const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofRetryApprovalPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalPaths();
  for (const target of [paths.resultArtifact, paths.proofRetryPlanningResult, paths.resolutionVerificationResult, paths.implementationResult]) {
    assertControlledResearchRuntimeSafeCommandShapeProofRetryApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval', 'index.ts')).href);
  const [proofRetryPlanningResult, resolutionVerificationResult, implementationResult] = await Promise.all([
    readJson(paths.proofRetryPlanningResult),
    readJson(paths.resolutionVerificationResult),
    readJson(paths.implementationResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApproval({
    approvedAt: input.approvedAt || '2026-07-24T23:30:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval-smoke',
    proofRetryPlanningResult,
    resolutionVerificationResult,
    implementationResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApproval };
