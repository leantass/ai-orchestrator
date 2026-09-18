const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPaths();
  for (const target of [paths.resultArtifact, paths.implementationResult, paths.implementationApprovalResult, paths.implementationPlanningResult]) {
    assertControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningPathContained(target, paths.installRoot);
  }
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning', 'index.ts')).href);
  const [implementationResult, implementationApprovalResult, implementationPlanningResult] = await Promise.all([
    readJson(paths.implementationResult),
    readJson(paths.implementationApprovalResult),
    readJson(paths.implementationPlanningResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanning({
    plannedAt: input.plannedAt || '2026-07-24T21:30:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning-smoke',
    implementationResult,
    implementationApprovalResult,
    implementationPlanningResult,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanning };
