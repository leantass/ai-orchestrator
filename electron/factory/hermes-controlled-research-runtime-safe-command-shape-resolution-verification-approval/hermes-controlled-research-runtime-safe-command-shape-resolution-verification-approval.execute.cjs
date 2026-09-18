const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalPaths();
  for (const target of [paths.resultArtifact, paths.verificationPlanningResult, paths.implementationResult, paths.implementationApprovalResult]) {
    assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval', 'index.ts')).href);
  const [verificationPlanningResult, implementationResult, implementationApprovalResult] = await Promise.all([
    readJson(paths.verificationPlanningResult),
    readJson(paths.implementationResult),
    readJson(paths.implementationApprovalResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApproval({
    approvedAt: input.approvedAt || '2026-07-24T22:00:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval-smoke',
    verificationPlanningResult,
    implementationResult,
    implementationApprovalResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApproval };
