const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { resolveFactoryHermesBuildDependencyCacheVerificationPaths, assertBuildDependencyCacheVerificationPathContained } = require('./hermes-build-dependency-cache-verification.path.cjs');

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw);
}

function sha256(file) {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function sourceKeyHashes(sourceRoot) {
  const keys = [
    ['pyprojectToml', 'pyproject.toml'],
    ['uvLock', 'uv.lock'],
    ['setupPy', 'setup.py']
  ];
  return Object.fromEntries(keys.map(([key, name]) => [key, fs.existsSync(path.join(sourceRoot, name)) ? sha256(path.join(sourceRoot, name)) : null]));
}

function sourceSuspiciousEntries(sourceRoot) {
  if (!fs.existsSync(sourceRoot)) return [];
  return fs.readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && ['dist', 'build', '.venv', '.codex-temp', 'hermes_agent.egg-info'].includes(entry.name))
    .map((entry) => entry.name)
    .sort();
}

function inspectFactoryHermesBuildDependencyCacheVerificationState(root) {
  const paths = resolveFactoryHermesBuildDependencyCacheVerificationPaths(root);
  const allowedRoots = [paths.installRoot, path.join(paths.root, '.codex-temp/external-tools/uv')];
  [
    paths.cacheRuntimeResult,
    paths.cacheRuntimeManifest,
    paths.metadataRecord,
    paths.verificationResult,
    paths.sourceRoot,
    paths.pythonEnvRoot,
    paths.uvExecutable,
    paths.uvVerificationResult
  ].forEach((target) => assertBuildDependencyCacheVerificationPathContained(target, allowedRoots));

  const runtimeResult = readJson(paths.cacheRuntimeResult);
  const runtimeManifest = readJson(paths.cacheRuntimeManifest);
  const metadataRecord = readJson(paths.metadataRecord);
  return {
    paths,
    runtimeResult,
    runtimeManifest,
    metadataRecord,
    approvalResult: fs.existsSync(paths.cacheApprovalResult) ? readJson(paths.cacheApprovalResult) : null,
    planningResult: fs.existsSync(paths.cachePlanningResult) ? readJson(paths.cachePlanningResult) : null,
    commandSummary: fs.existsSync(paths.commandSummary) ? readJson(paths.commandSummary) : null,
    materializationRuntimeResult: fs.existsSync(paths.materializationRuntimeResult) ? readJson(paths.materializationRuntimeResult) : null,
    materializationRuntimeRetryResult: fs.existsSync(paths.materializationRuntimeRetryResult) ? readJson(paths.materializationRuntimeRetryResult) : null,
    materializationRuntimeRetryManifest: fs.existsSync(paths.materializationRuntimeRetryManifest) ? readJson(paths.materializationRuntimeRetryManifest) : null,
    uvVerificationResult: fs.existsSync(paths.uvVerificationResult) ? readJson(paths.uvVerificationResult) : null,
    inspectedState: {
      metadataRootExists: fs.existsSync(paths.metadataRoot),
      metadataRecordExists: fs.existsSync(paths.metadataRecord),
      sourceRootExists: fs.existsSync(paths.sourceRoot),
      pythonEnvRootExists: fs.existsSync(paths.pythonEnvRoot),
      realPythonEnvHermesExeExists: fs.existsSync(paths.realHermesExecutable),
      uvExecutableExists: fs.existsSync(paths.uvExecutable),
      sourceKeyHashes: sourceKeyHashes(paths.sourceRoot),
      sourceSuspiciousEntries: sourceSuspiciousEntries(paths.sourceRoot)
    }
  };
}

module.exports = {
  inspectFactoryHermesBuildDependencyCacheVerificationState
};
