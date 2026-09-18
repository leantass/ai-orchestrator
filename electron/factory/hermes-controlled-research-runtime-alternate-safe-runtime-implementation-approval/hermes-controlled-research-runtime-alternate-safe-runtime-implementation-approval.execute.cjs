const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPathContained,
  resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPaths,
} = require('./hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPaths();
  for (const target of [paths.resultArtifact, paths.implementationPlanningResult, paths.alternateApprovalResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval', 'index.ts')).href);
  const [implementationPlanningResult, alternateRuntimeResolutionApprovalResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(paths.implementationPlanningResult),
    readJson(paths.alternateApprovalResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApproval({
    approvedAt: input.approvedAt || '2026-07-27T00:00:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval-smoke',
    implementationPlanningResult,
    alternateRuntimeResolutionApprovalResult,
    runtimeSelectionDecisionResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApproval };
