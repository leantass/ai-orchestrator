const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const {
  assertControlledResearchRuntimeSafeCommandShapeProofRetryPathContained,
  resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPaths,
} = require('./hermes-controlled-research-runtime-safe-command-shape-proof-retry.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function inspectHermesSourceReadOnly(sourceRoot) {
  if (!fsSync.existsSync(sourceRoot)) return { sourceRootPresent: false, sourceFilesInspected: [], sourceSignals: {} };
  const candidates = ['cli.py', 'README.md', 'pyproject.toml', 'hermes_constants.py', 'mcp_serve.py'];
  const sourceFilesInspected = [];
  const textByFile = {};
  for (const candidate of candidates) {
    const file = path.join(sourceRoot, candidate);
    if (fsSync.existsSync(file)) {
      sourceFilesInspected.push(candidate);
      textByFile[candidate] = await fs.readFile(file, 'utf8');
    }
  }
  const joined = Object.values(textByFile).join('\n');
  return {
    sourceRootPresent: true,
    sourceFilesInspected,
    sourceSignals: {
      explicitConfigPathSupport: /config|yaml|--config/i.test(joined),
      explicitRunRootSupport: /workspace|cwd|run.?root|project/i.test(joined),
      promptFileRefSupport: /prompt/i.test(joined),
      providerModelHostRefsSupport: /model|provider|host|base.?url/i.test(joined),
    },
  };
}

async function executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetry(input = {}) {
  const paths = resolveFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryPaths();
  for (const target of [paths.resultArtifact, paths.proofRetryApprovalResult, paths.proofRetryPlanningResult, paths.resolutionVerificationResult, paths.implementationResult]) {
    assertControlledResearchRuntimeSafeCommandShapeProofRetryPathContained(target, paths.installRoot);
  }
  assertControlledResearchRuntimeSafeCommandShapeProofRetryPathContained(paths.sourceRoot, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry', 'index.ts')).href);
  const renderer = require('../hermes-controlled-research-runtime-command-renderer/index.cjs');
  const builder = require('../hermes-wrapper-fail-closed-command-builder/index.cjs');
  const [proofRetryApprovalResult, proofRetryPlanningResult, resolutionVerificationResult, implementationResult, sourceInspection] = await Promise.all([
    readJson(paths.proofRetryApprovalResult),
    readJson(paths.proofRetryPlanningResult),
    readJson(paths.resolutionVerificationResult),
    readJson(paths.implementationResult),
    inspectHermesSourceReadOnly(paths.sourceRoot),
  ]);
  const result = gate.evaluateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetry({
    retriedAt: input.retriedAt || '2026-07-24T23:45:00.000Z',
    retriedBy: input.retriedBy || 'factory-hermes-controlled-research-runtime-safe-command-shape-proof-retry-smoke',
    proofRetryApprovalResult,
    proofRetryPlanningResult,
    resolutionVerificationResult,
    implementationResult,
    rendererBoundary: renderer.rendererRuntimeBoundary,
    wrapperBuilderBoundary: builder.wrapperBuilderRuntimeBoundary,
    ...sourceInspection,
  });
  await fs.writeFile(paths.resultArtifact, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetry };
