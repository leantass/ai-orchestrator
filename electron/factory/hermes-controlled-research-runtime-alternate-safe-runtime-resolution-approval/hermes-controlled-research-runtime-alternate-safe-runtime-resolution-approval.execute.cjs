const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPathContained,
  resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPaths,
} = require('./hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPaths();
  for (const target of [paths.resultArtifact, paths.alternatePlanningResult, paths.proofRetryReviewResult, paths.runtimeSelectionDecisionResult]) {
    assertControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval', 'index.ts')).href);
  const [alternateRuntimeResolutionPlanningResult, proofRetryReviewResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(paths.alternatePlanningResult),
    readJson(paths.proofRetryReviewResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApproval({
    approvedAt: input.approvedAt || '2026-07-26T00:00:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval-smoke',
    alternateRuntimeResolutionPlanningResult,
    proofRetryReviewResult,
    runtimeSelectionDecisionResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApproval };
