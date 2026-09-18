const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { resolveFactoryHermesResearchRuntimeAdapterPaths, assertAdapterPathContained } = require('./hermes-research-runtime-adapter.path.cjs');

async function readJson(file) {
  const text = await fs.readFile(file, 'utf8');
  if (!text.trim()) throw new Error(`json_file_empty: ${file}`);
  return JSON.parse(text);
}

async function readTextIfExists(file) {
  try { return await fs.readFile(file, 'utf8'); } catch { return ''; }
}

function sourceFiles(paths) {
  const candidates = [
    path.join(paths.adapterSourceRoot, 'index.ts'),
    path.join(paths.adapterSourceRoot, 'hermes-research-runtime-adapter.types.ts'),
    path.join(paths.adapterSourceRoot, 'hermes-research-runtime-adapter.defaults.ts'),
    path.join(paths.adapterSourceRoot, 'hermes-research-runtime-adapter.evaluate.ts'),
    path.join(paths.adapterSourceRoot, 'hermes-research-runtime-adapter.validate.ts'),
    path.join(paths.adapterSourceRoot, 'hermes-research-runtime-adapter.serialize.ts'),
    path.join(paths.adapterElectronRoot, 'index.cjs'),
    path.join(paths.adapterElectronRoot, 'hermes-research-runtime-adapter.path.cjs'),
    path.join(paths.adapterElectronRoot, 'hermes-research-runtime-adapter.execute.cjs'),
  ];
  return candidates.filter((file) => fsSync.existsSync(file));
}

function inspectText(ref, text) {
  const executablePatterns = [
    /require\(['"]node:child_process['"]\)/u,
    /from ['"]node:child_process['"]/u,
    /\bspawn\s*\(/u,
    /\bexec\s*\(/u,
    /\bexecFile\s*\(/u,
    /\bfork\s*\(/u,
    /\bfetch\s*\(/u,
    /require\(['"]node:http['"]\)/u,
    /require\(['"]node:https['"]\)/u,
    /require\(['"]node:net['"]\)/u,
    /require\(['"]node:dns['"]\)/u,
  ];
  const controlledPatterns = ['process.env', '.env', 'OPENAI_API_KEY', 'hermes.exe', '--oneshot'];
  const executableMatches = executablePatterns.filter((pattern) => pattern.test(text)).map((pattern) => `${ref}:${pattern.source}`);
  const controlledStringMatches = controlledPatterns.filter((pattern) => text.includes(pattern)).map((pattern) => `${ref}:${pattern}`);
  return { executableMatches, controlledStringMatches };
}

async function inspectAdapterSource(paths, adaptedAt) {
  const files = sourceFiles(paths);
  const inspectedRefs = [];
  const executableMatches = [];
  const controlledStringMatches = [];
  for (const file of files) {
    const ref = path.relative(paths.root, file).replace(/\\/g, '/');
    inspectedRefs.push(ref);
    const found = inspectText(ref, await readTextIfExists(file));
    executableMatches.push(...found.executableMatches);
    controlledStringMatches.push(...found.controlledStringMatches);
  }
  const hasWrapperBoundary = files.some((file) => file.includes('hermes-research-runtime-adapter')) && controlledStringMatches.some((entry) => entry.includes('OPENAI_API_KEY'));
  return {
    inspectionId: `hermes-research-runtime-adapter:75b300f:${adaptedAt}:source-inspection`,
    classification: executableMatches.length > 0 ? 'case_d_executable_surface_detected' : hasWrapperBoundary ? 'case_c_exists_with_wrapper_boundary' : files.length > 0 ? 'case_b_exists_without_wrapper_boundary' : 'case_a_not_found',
    inspectedRefs,
    dangerousExecutableSurfaceDetected: executableMatches.length > 0,
    controlledStringMatches,
    executableMatches,
  };
}

async function executeFactoryHermesResearchRuntimeAdapter(input = {}) {
  const paths = resolveFactoryHermesResearchRuntimeAdapterPaths();
  for (const target of [paths.adapterApprovalRetryResult, paths.wrapperVerificationReviewResult, paths.wrapperVerificationResult, paths.previousAdapterApprovalResult, paths.runtimeSelectionDecisionResult, paths.finalExecutionApprovalResult, paths.adapterResult]) assertAdapterPathContained(target, paths.installRoot);
  const gate = await import(pathToFileURL(path.join(paths.root, 'src', 'factory', 'hermes-research-runtime-adapter', 'index.ts')).href);
  const adaptedAt = input.adaptedAt || '2026-07-23T11:00:00.000Z';
  const adaptedBy = input.adaptedBy || 'factory-hermes-research-runtime-adapter-smoke';
  const adapterSourceInspection = input.adapterSourceInspection || await inspectAdapterSource(paths, adaptedAt);
  const result = gate.evaluateFactoryHermesResearchRuntimeAdapter({
    adaptedAt,
    adaptedBy,
    adapterApprovalRetryResult: input.adapterApprovalRetryResult || await readJson(paths.adapterApprovalRetryResult),
    wrapperVerificationReviewResult: input.wrapperVerificationReviewResult || await readJson(paths.wrapperVerificationReviewResult),
    wrapperVerificationResult: input.wrapperVerificationResult || await readJson(paths.wrapperVerificationResult),
    previousAdapterApprovalResult: input.previousAdapterApprovalResult || await readJson(paths.previousAdapterApprovalResult),
    runtimeSelectionDecisionResult: input.runtimeSelectionDecisionResult || await readJson(paths.runtimeSelectionDecisionResult),
    finalExecutionApprovalResult: input.finalExecutionApprovalResult || await readJson(paths.finalExecutionApprovalResult),
    adapterSourceInspection,
  });
  await fs.mkdir(path.dirname(paths.adapterResult), { recursive: true });
  await fs.writeFile(paths.adapterResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = { executeFactoryHermesResearchRuntimeAdapter, inspectAdapterSource };
