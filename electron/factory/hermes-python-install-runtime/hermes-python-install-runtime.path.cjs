const path = require('node:path');

const INSTALL_ROOT_REF = '.codex-temp/external-tools/hermes-agent/install/75b300f';
const SOURCE_ROOT_REF = `${INSTALL_ROOT_REF}/source`;
const PYTHON_ENV_ROOT_REF = `${INSTALL_ROOT_REF}/python-env/`;
const MANIFEST_REF = `${INSTALL_ROOT_REF}/python-install-manifest.json`;
const RESULT_REF = `${INSTALL_ROOT_REF}/python-install-result.json`;
const LOGS_ROOT_REF = `${INSTALL_ROOT_REF}/python-install-logs/`;

function normalizeRef(value) {
  return String(value ?? '').replace(/\\/gu, '/').replace(/\/+$/u, '') + (String(value ?? '').endsWith('/') ? '/' : '');
}

function toAbsolute(repoRoot, ref) {
  return path.resolve(repoRoot, ref);
}

function assertFactoryHermesPythonInstallRuntimePathContained(repoRoot, targetRef, containerRef) {
  const target = toAbsolute(repoRoot, targetRef);
  const container = toAbsolute(repoRoot, containerRef);
  const relative = path.relative(container, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Path escapes allowed container: ${targetRef}`);
  }
  return target;
}

function assertPythonEnvRootAllowed(repoRoot, pythonEnvRootRef) {
  const normalized = normalizeRef(pythonEnvRootRef);
  if (normalized !== PYTHON_ENV_ROOT_REF) throw new Error('pythonEnvRootRef must match the approved Hermes python-env root.');
  return assertFactoryHermesPythonInstallRuntimePathContained(repoRoot, normalized, INSTALL_ROOT_REF);
}

function resolveFactoryHermesPythonInstallRuntimePaths(input, options = {}) {
  const repoRoot = options.repoRoot ?? process.cwd();
  const envelope = input?.hermesPythonInstallApprovalResult?.approvedPythonInstallEnvelope;
  const sourceRootRef = envelope?.sourceRootRef;
  const installRootRef = envelope?.installRootRef;
  const pythonEnvRootRef = envelope?.pythonEnvRootRef;
  if (installRootRef !== INSTALL_ROOT_REF) throw new Error('installRootRef must match the approved Hermes install root.');
  if (sourceRootRef !== SOURCE_ROOT_REF) throw new Error('sourceRootRef must match the approved Hermes install source root.');
  assertPythonEnvRootAllowed(repoRoot, pythonEnvRootRef);
  return {
    repoRoot,
    installRootRef,
    sourceRootRef,
    pythonEnvRootRef,
    manifestRef: MANIFEST_REF,
    resultRef: RESULT_REF,
    logsRootRef: LOGS_ROOT_REF,
    installRoot: toAbsolute(repoRoot, installRootRef),
    sourceRoot: toAbsolute(repoRoot, sourceRootRef),
    pythonEnvRoot: toAbsolute(repoRoot, pythonEnvRootRef),
    manifestPath: toAbsolute(repoRoot, MANIFEST_REF),
    resultPath: toAbsolute(repoRoot, RESULT_REF),
    logsRoot: toAbsolute(repoRoot, LOGS_ROOT_REF),
  };
}

module.exports = {
  INSTALL_ROOT_REF,
  SOURCE_ROOT_REF,
  PYTHON_ENV_ROOT_REF,
  MANIFEST_REF,
  RESULT_REF,
  LOGS_ROOT_REF,
  assertFactoryHermesPythonInstallRuntimePathContained,
  assertPythonEnvRootAllowed,
  resolveFactoryHermesPythonInstallRuntimePaths,
};
