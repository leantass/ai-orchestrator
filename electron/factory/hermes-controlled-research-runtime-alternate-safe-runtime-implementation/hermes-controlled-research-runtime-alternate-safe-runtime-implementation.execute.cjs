const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPaths, assertControlledResearchRuntimeAlternateSafeRuntimeImplementationPathContained } = require('./hermes-controlled-research-runtime-alternate-safe-runtime-implementation.path.cjs');
async function readJson(file) { const text = await fs.readFile(file, 'utf8'); if (!text.trim()) throw new Error(`json_file_empty: ${file}`); return JSON.parse(text); }
async function executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementation(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPaths();
  for (const target of [paths.resultArtifact, paths.implementationApprovalResult, paths.implementationPlanningResult, paths.alternateResolutionApprovalResult, paths.runtimeSelectionDecisionResult]) assertControlledResearchRuntimeAlternateSafeRuntimeImplementationPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation', 'index.ts')).href);
  const [implementationApprovalResult, implementationPlanningResult, alternateResolutionApprovalResult, runtimeSelectionDecisionResult] = await Promise.all([readJson(paths.implementationApprovalResult), readJson(paths.implementationPlanningResult), readJson(paths.alternateResolutionApprovalResult), readJson(paths.runtimeSelectionDecisionResult)]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementation({ implementedAt: input.implementedAt || '2026-07-27T00:00:00.000Z', implementedBy: input.implementedBy || 'factory-hermes-controlled-research-runtime-alternate-safe-runtime-implementation-smoke', implementationApprovalResult, implementationPlanningResult, alternateResolutionApprovalResult, runtimeSelectionDecisionResult });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}
module.exports = { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementation };
