const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertResearchExecutionApprovalPathContained, resolveFactoryHermesResearchExecutionApprovalPaths } = require('./hermes-research-execution-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesResearchExecutionApproval(input = {}) {
  const paths = resolveFactoryHermesResearchExecutionApprovalPaths();
  for (const target of [paths.researchExecutionApprovalRetryResult, paths.researchRuntimeAdapterResult, paths.adapterApprovalRetryResult, paths.wrapperVerificationReviewResult, paths.wrapperVerificationResult, paths.runtimeSelectionDecisionResult, paths.finalExecutionApprovalResult, paths.approvalResult]) assertResearchExecutionApprovalPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-research-execution-approval', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesResearchExecutionApproval({
    approvedAt: input.approvedAt || '2026-07-23T13:00:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-research-execution-approval-smoke',
    researchExecutionApprovalRetryResult: input.researchExecutionApprovalRetryResult || await readJson(paths.researchExecutionApprovalRetryResult),
    researchRuntimeAdapterResult: input.researchRuntimeAdapterResult || await readJson(paths.researchRuntimeAdapterResult),
    adapterApprovalRetryResult: input.adapterApprovalRetryResult || await readJson(paths.adapterApprovalRetryResult),
    wrapperVerificationReviewResult: input.wrapperVerificationReviewResult || await readJson(paths.wrapperVerificationReviewResult),
    wrapperVerificationResult: input.wrapperVerificationResult || await readJson(paths.wrapperVerificationResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
    finalExecutionApprovalResult: input.finalExecutionApprovalResult || await readJson(paths.finalExecutionApprovalResult),
  });
  await fs.mkdir(path.dirname(paths.approvalResult), { recursive: true });
  await fs.writeFile(paths.approvalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchExecutionApproval };
