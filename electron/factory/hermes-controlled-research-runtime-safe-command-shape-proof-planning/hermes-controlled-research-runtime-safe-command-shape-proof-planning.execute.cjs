const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofPlanningPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof-planning.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

function toSourceInventory(sourcePaths, roots) {
  return sourcePaths.map((sourcePath) => {
    const exists = fsSync.existsSync(sourcePath);
    const stats = exists ? fsSync.statSync(sourcePath) : undefined;
    const relativePath = path.relative(roots.repoRoot, sourcePath).replace(/\\/g, '/');
    return {
      relativePath,
      exists,
      kind: stats?.isDirectory() ? 'directory' : 'file',
      sizeBytes: stats?.isFile() ? stats.size : undefined,
      inspectionMode: 'metadata_only_read_only_no_execution',
    };
  });
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanning(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanningPaths();
  for (const target of [
    paths.resultArtifact,
    paths.executionReviewResult,
    paths.executionResult,
    paths.runtimeSelectionDecisionResult,
  ]) {
    assertControlledResearchRuntimeSafeCommandShapeProofPlanningPathContained(target, paths.installRoot);
  }

  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-planning', 'index.ts')).href);
  const [executionReviewResult, executionResult, runtimeSelectionDecisionResult] = await Promise.all([
    readJson(paths.executionReviewResult),
    readJson(paths.executionResult),
    readJson(paths.runtimeSelectionDecisionResult),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanning({
    plannedAt: input.plannedAt || '2026-07-24T15:30:00.000Z',
    plannedBy: input.plannedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-planning-smoke',
    executionReviewResult,
    executionResult,
    runtimeSelectionDecisionResult,
    sourceInventory: toSourceInventory(paths.sourcePaths, paths),
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPlanning };
