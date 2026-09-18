const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

function redact(text) {
  return String(text).replace(/sk-[A-Za-z0-9_-]+/g, '[REDACTED]').replace(/OPENAI_API_KEY\s*=\s*[^\s]+/g, 'OPENAI_API_KEY=[REDACTED]');
}

async function inspectPath(target, repoRoot) {
  const exists = fsSync.existsSync(target);
  const relativePath = path.relative(repoRoot, target).replace(/\\/g, '/');
  if (!exists) return { relativePath, exists, kind: 'missing', redactedPreview: '' };
  const stats = fsSync.statSync(target);
  if (stats.isDirectory()) return { relativePath, exists, kind: 'directory', childCount: fsSync.readdirSync(target).length, redactedPreview: '' };
  const text = await fs.readFile(target, 'utf8').catch(() => '');
  return { relativePath, exists, kind: 'file', sizeBytes: stats.size, redactedPreview: redact(text).slice(0, 12000) };
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProof(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofPaths();
  for (const target of [paths.resultArtifact, paths.proofApprovalResult, paths.proofPlanningResult, paths.executionReviewResult, paths.executionResult, paths.runtimeSelectionDecisionResult, paths.researchRuntimeAdapterResult]) {
    assertControlledResearchRuntimeSafeCommandShapeProofPathContained(target, paths.installRoot);
  }
  assertControlledResearchRuntimeSafeCommandShapeProofPathContained(paths.proofRoot, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof', 'index.ts')).href);
  const [proofApprovalResult, proofPlanningResult, executionReviewResult, executionResult, runtimeSelectionDecisionResult, researchRuntimeAdapterResult] = await Promise.all([
    readJson(paths.proofApprovalResult),
    readJson(paths.proofPlanningResult),
    readJson(paths.executionReviewResult),
    readJson(paths.executionResult),
    readJson(paths.runtimeSelectionDecisionResult).catch(() => undefined),
    readJson(paths.researchRuntimeAdapterResult).catch(() => undefined),
  ]);
  const sourceInspection = await Promise.all(paths.sourcePaths.map((sourcePath) => inspectPath(sourcePath, paths.repoRoot)));
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProof({
    provedAt: input.provedAt || '2026-07-24T17:00:00.000Z',
    provedBy: input.provedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-smoke',
    proofApprovalResult,
    proofPlanningResult,
    executionReviewResult,
    executionResult,
    runtimeSelectionDecisionResult,
    researchRuntimeAdapterResult,
    sourceInspection,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProof };
