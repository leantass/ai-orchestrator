const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertExecutionApprovalRetryPathContained, resolveFactoryHermesResearchExecutionApprovalRetryPaths } = require('./hermes-research-execution-approval-retry.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchExecutionApprovalRetry(input = {}) {
  const paths = resolveFactoryHermesResearchExecutionApprovalRetryPaths();
  for (const target of [paths.researchRuntimeAdapterResult, paths.adapterApprovalRetryResult, paths.wrapperVerificationReviewResult, paths.wrapperVerificationResult, paths.runtimeSelectionDecisionResult, paths.finalExecutionApprovalResult, paths.researchExecutionApprovalRetryResult]) assertExecutionApprovalRetryPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.root, 'src', 'factory', 'hermes-research-execution-approval-retry', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesResearchExecutionApprovalRetry({
    retriedAt: input.retriedAt || '2026-07-23T12:00:00.000Z',
    retriedBy: input.retriedBy || 'factory-hermes-research-execution-approval-retry-smoke',
    researchRuntimeAdapterResult: input.researchRuntimeAdapterResult || await readJson(paths.researchRuntimeAdapterResult),
    adapterApprovalRetryResult: input.adapterApprovalRetryResult || await readJson(paths.adapterApprovalRetryResult),
    wrapperVerificationReviewResult: input.wrapperVerificationReviewResult || await readJson(paths.wrapperVerificationReviewResult),
    wrapperVerificationResult: input.wrapperVerificationResult || await readJson(paths.wrapperVerificationResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
    finalExecutionApprovalResult: input.finalExecutionApprovalResult || await readJson(paths.finalExecutionApprovalResult),
  });
  await fs.mkdir(path.dirname(paths.researchExecutionApprovalRetryResult), { recursive: true });
  await fs.writeFile(paths.researchExecutionApprovalRetryResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchExecutionApprovalRetry };
