const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { assertRuntimeSelectionRevisionPlanningPathContained, resolveFactoryHermesRuntimeSelectionRevisionPlanningPaths } = require('./hermes-runtime-selection-revision-planning.path.cjs');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesRuntimeSelectionRevisionPlanning(input = {}) {
  const paths = resolveFactoryHermesRuntimeSelectionRevisionPlanningPaths();
  for (const target of Object.entries(paths).filter(([k]) => k !== 'repoRoot' && k !== 'installRoot').map(([, v]) => v)) assertRuntimeSelectionRevisionPlanningPathContained(target, paths.installRoot);
  const { evaluateFactoryHermesRuntimeSelectionRevisionPlanning } = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-runtime-selection-revision-planning', 'index.ts')).href);
  const result = evaluateFactoryHermesRuntimeSelectionRevisionPlanning({
    plannedAt: input.plannedAt || '2026-07-23T00:00:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-runtime-selection-revision-planning-smoke',
    toolsetDisableVerificationApprovalResult: input.toolsetDisableVerificationApprovalResult || await readJson(paths.toolsetDisableVerificationApprovalResult),
    toolsetDisableVerificationPlanningResult: input.toolsetDisableVerificationPlanningResult || await readJson(paths.toolsetDisableVerificationPlanningResult),
    researchRuntimeAdapterApprovalResult: input.researchRuntimeAdapterApprovalResult || await readJson(paths.researchRuntimeAdapterApprovalResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
    runtimeSelectionPlanningResult: input.runtimeSelectionPlanningResult || await readJson(paths.runtimeSelectionPlanningResult),
    toolsetsPolicyPlanningResult: input.toolsetsPolicyPlanningResult || await readJson(paths.toolsetsPolicyPlanningResult),
    finalExecutionApprovalResult: input.finalExecutionApprovalResult || await readJson(paths.finalExecutionApprovalResult),
  });
  await fs.mkdir(path.dirname(paths.runtimeSelectionRevisionPlanningResult), { recursive: true });
  await fs.writeFile(paths.runtimeSelectionRevisionPlanningResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesRuntimeSelectionRevisionPlanning };
