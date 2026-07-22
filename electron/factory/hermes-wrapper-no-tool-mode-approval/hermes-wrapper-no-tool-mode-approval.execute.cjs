const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertWrapperNoToolModeApprovalPathContained, resolveFactoryHermesWrapperNoToolModeApprovalPaths } = require('./hermes-wrapper-no-tool-mode-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesWrapperNoToolModeApproval(input = {}) {
  const paths = resolveFactoryHermesWrapperNoToolModeApprovalPaths();
  for (const target of Object.entries(paths).filter(([key]) => !['repoRoot', 'installRoot'].includes(key)).map(([, value]) => value)) {
    assertWrapperNoToolModeApprovalPathContained(target, paths.installRoot);
  }
  const moduleUrl = pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-wrapper-no-tool-mode-approval', 'index.ts')).href;
  const { evaluateFactoryHermesWrapperNoToolModeApproval, serializeFactoryHermesWrapperNoToolModeApprovalResult } = await import(moduleUrl);
  const result = evaluateFactoryHermesWrapperNoToolModeApproval({
    evaluatedAt: input.evaluatedAt || '2026-07-23T02:00:00.000Z',
    evaluatedBy: input.evaluatedBy || 'factory-hermes-wrapper-no-tool-mode-approval-smoke',
    wrapperNoToolModePlanningResult: input.wrapperNoToolModePlanningResult || await readJson(paths.wrapperPlanningResult),
    runtimeSelectionRevisionPlanningResult: input.runtimeSelectionRevisionPlanningResult || await readJson(paths.runtimeSelectionRevisionPlanningResult),
    toolsetDisableVerificationApprovalResult: input.toolsetDisableVerificationApprovalResult || await readJson(paths.toolsetDisableVerificationApprovalResult),
    researchRuntimeAdapterApprovalResult: input.researchRuntimeAdapterApprovalResult || await readJson(paths.researchRuntimeAdapterApprovalResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
    finalExecutionApprovalResult: input.finalExecutionApprovalResult || await readJson(paths.finalExecutionApprovalResult),
    approvalNotes: input.approvalNotes,
  });
  await fs.mkdir(path.dirname(paths.approvalResult), { recursive: true });
  await fs.writeFile(paths.approvalResult, serializeFactoryHermesWrapperNoToolModeApprovalResult(result));
  return result;
}

module.exports = { executeFactoryHermesWrapperNoToolModeApproval };
