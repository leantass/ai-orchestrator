const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertControlledResearchRuntimeApprovalPathContained, resolveFactoryHermesControlledResearchRuntimeApprovalPaths } = require('./hermes-controlled-research-runtime-approval.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeApproval(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeApprovalPaths();
  for (const target of [paths.controlledRuntimePlanningResult, paths.researchExecutionApprovalResult, paths.researchRuntimeAdapterResult, paths.runtimeSelectionDecisionResult, paths.approvalResult]) assertControlledResearchRuntimeApprovalPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-approval', 'index.ts')).href);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeApproval({
    approvedAt: input.approvedAt || '2026-07-23T15:00:00.000Z',
    approvedBy: input.approvedBy || 'factory-hermes-controlled-research-runtime-approval-smoke',
    controlledRuntimePlanningResult: input.controlledRuntimePlanningResult || await readJson(paths.controlledRuntimePlanningResult),
    researchExecutionApprovalResult: input.researchExecutionApprovalResult || await readJson(paths.researchExecutionApprovalResult),
    researchRuntimeAdapterResult: input.researchRuntimeAdapterResult || await readJson(paths.researchRuntimeAdapterResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
  });
  await fs.mkdir(path.dirname(paths.approvalResult), { recursive: true });
  await fs.writeFile(paths.approvalResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeApproval };
