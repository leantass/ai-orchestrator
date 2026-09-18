const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertAdapterApprovalRetryPathContained, resolveFactoryHermesResearchRuntimeAdapterApprovalRetryPaths } = require('./hermes-research-runtime-adapter-approval-retry.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchRuntimeAdapterApprovalRetry(input = {}) {
  const paths = resolveFactoryHermesResearchRuntimeAdapterApprovalRetryPaths();
  for (const target of [paths.wrapperVerificationReviewResult, paths.wrapperVerificationResult, paths.previousAdapterApprovalResult, paths.researchRuntimeAdapterApprovalRetryResult]) assertAdapterApprovalRetryPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-runtime-adapter-approval-retry', 'index.ts')).href);
  const retryInput = {
    retriedAt: input.retriedAt || '2026-07-23T10:00:00.000Z',
    retriedBy: input.retriedBy || 'factory-hermes-research-runtime-adapter-approval-retry-smoke',
    wrapperVerificationReviewResult: input.wrapperVerificationReviewResult || await readJson(paths.wrapperVerificationReviewResult),
    wrapperVerificationResult: input.wrapperVerificationResult || await readJson(paths.wrapperVerificationResult),
    wrapperVerificationApprovalResult: input.wrapperVerificationApprovalResult || await readJson(paths.wrapperVerificationApprovalResult),
    wrapperImplementationResult: input.wrapperImplementationResult || await readJson(paths.wrapperImplementationResult),
    previousAdapterApprovalResult: input.previousAdapterApprovalResult || await readJson(paths.previousAdapterApprovalResult),
    runtimeSelectionRevisionPlanningResult: input.runtimeSelectionRevisionPlanningResult || await readJson(paths.runtimeSelectionRevisionPlanningResult),
    toolsetDisableVerificationApprovalResult: input.toolsetDisableVerificationApprovalResult || await readJson(paths.toolsetDisableVerificationApprovalResult),
  };
  const result = gate.evaluateFactoryHermesResearchRuntimeAdapterApprovalRetry(retryInput);
  await fs.mkdir(path.dirname(paths.researchRuntimeAdapterApprovalRetryResult), { recursive: true });
  await fs.writeFile(paths.researchRuntimeAdapterApprovalRetryResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchRuntimeAdapterApprovalRetry };
