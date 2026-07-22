const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { resolveFactoryHermesPythonInstallVerificationPaths, assertHermesPythonEnvAllowed, sanitizeFilePreview, readJsonFileSafe, hashFileIfPresent, sizeFileIfPresent, countDirectoryEntriesLimited } = require('./hermes-python-install-verification.path.cjs');

const KIND = 'factory-hermes-python-install-verification';
const VERSION = '1.0';
const HEAD = '75b300f13af40878ad6482b2ecb39c55c86679fe';
const NEXT = 'Proceed to Factory Hermes Python Install JEFE Review Gate v1; Hermes execution remains forbidden.';
const acceptedDecisions = ['hermes_python_install_completed_with_verified_uv', 'hermes_python_install_reused_existing_success_with_verified_uv', 'hermes_python_install_confirmed_existing_env_with_verified_uv_sync'];
const acceptedVenvStatuses = ['created_with_verified_uv', 'existing_verified_uv_env_reused', 'existing_uv_env_reused'];
const acceptedUvStatuses = ['executed_verified_allowlisted', 'verified_uv_existing_install_reused'];
const forbiddenKinds = ['uv_run', 'uv_pip', 'pip', 'python', 'setup_py', 'hermes'];

function base(input, overrides = {}) {
  const p = resolveFactoryHermesPythonInstallVerificationPaths();
  return { pythonInstallVerificationId: `hermes-python-install-verification:75b300f:${input.verifiedAt}`, pythonInstallVerificationKind: KIND, pythonInstallVerificationVersion: VERSION, verifiedAt: input.verifiedAt, verifiedBy: input.verifiedBy, toolId: 'hermes_agent', auditedHead: input.expectedAuditedHead || HEAD, installRootRef: p.refs.installRootRef, sourceRootRef: p.refs.sourceRootRef, pythonEnvRootRef: p.refs.pythonEnvRootRef, uvExecutableRef: p.refs.uvExecutableRef, uvVerificationRef: p.refs.uvVerificationRef, pythonInstallManifestRef: p.refs.pythonInstallManifestRef, pythonInstallResultRef: p.refs.pythonInstallResultRef, pythonInstallVerificationResultRef: p.refs.pythonInstallVerificationResultRef, manifestStatus: 'unknown', installResultStatus: 'unknown', pythonEnvStatus: 'unknown', pyvenvCfgStatus: 'unknown', pythonExecutableStatus: 'unknown', sitePackagesStatus: 'unknown', uvVerificationStatus: 'unknown', checksumStatus: 'unknown', pythonInstallStatus: 'unknown', venvStatus: 'unknown', uvStatus: 'unknown', pipStatus: 'not_executed', pythonDirectStatus: 'not_executed', setupPyStatus: 'not_executed', hermesExecutionStatus: 'not_allowed', scriptsStatus: 'not_executed', credentialsStatus: 'not_allowed', modelCallStatus: 'not_allowed', projectMutationStatus: 'not_allowed', deployStatus: 'not_allowed', commandResults: [], checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'request_hermes_python_install_repair', canProceedToJefeReview: false, canProceedToResearchRuntimePlanning: false, canExecuteHermes: false, canRunHermesScripts: false, canUseCredentials: false, canCallModels: false, canMutateProjectFiles: false, canDeploy: false, recommendedNextStep: NEXT, ...overrides };
}
function hasForbiddenCommands(commands = []) { return commands.some((command) => forbiddenKinds.includes(command.kind) || command.shell !== false); }
async function writeResult(paths, result) { await fs.writeFile(paths.verificationResult, JSON.stringify(result, null, 2)); }

async function executeFactoryHermesPythonInstallVerification(input) {
  const p = resolveFactoryHermesPythonInstallVerificationPaths();
  const blockers = [];
  try { assertHermesPythonEnvAllowed(p); } catch (error) { blockers.push({ blockerId: 'blocked_python_env_outside_codex_temp', message: sanitizeFilePreview(error.message) }); }
  const exists = {
    installRoot: fsSync.existsSync(p.installRoot), sourceRoot: fsSync.existsSync(p.sourceRoot), pyproject: fsSync.existsSync(path.join(p.sourceRoot, 'pyproject.toml')), uvLock: fsSync.existsSync(path.join(p.sourceRoot, 'uv.lock')), pythonEnv: fsSync.existsSync(p.pythonEnvRoot), pyvenvCfg: fsSync.existsSync(p.pyvenvCfg), pythonExecutable: fsSync.existsSync(p.pythonExecutable), sitePackages: fsSync.existsSync(p.sitePackages), manifest: fsSync.existsSync(p.pythonInstallManifest), result: fsSync.existsSync(p.pythonInstallResult), uvVerification: fsSync.existsSync(p.uvVerificationResult),
  };
  if (!exists.manifest) blockers.push({ blockerId: 'blocked_missing_python_install_manifest', message: 'python-install-manifest.json is missing.' });
  if (!exists.result) blockers.push({ blockerId: 'blocked_missing_python_install_result', message: 'python-install-result.json is missing.' });
  if (!exists.uvVerification) blockers.push({ blockerId: 'blocked_uv_verification_missing', message: 'UV verification result is missing.' });
  if (!exists.pythonEnv) blockers.push({ blockerId: 'blocked_python_env_missing', message: 'python-env is missing.' });
  for (const [key, ok] of Object.entries(exists)) if (!ok && !['manifest', 'result', 'uvVerification', 'pythonEnv'].includes(key)) blockers.push({ blockerId: `missing_${key}`, message: `${key} is missing.` });
  const manifestRead = exists.manifest ? await readJsonFileSafe(p.pythonInstallManifest) : { ok: false };
  const installRead = exists.result ? await readJsonFileSafe(p.pythonInstallResult) : { ok: false };
  const uvRead = exists.uvVerification ? await readJsonFileSafe(p.uvVerificationResult) : { ok: false };
  if (exists.manifest && !manifestRead.ok) blockers.push({ blockerId: 'blocked_invalid_python_install_manifest', message: 'python-install-manifest.json is invalid.' });
  if (exists.result && !installRead.ok) blockers.push({ blockerId: 'blocked_invalid_python_install_result', message: 'python-install-result.json is invalid.' });
  if (exists.uvVerification && !uvRead.ok) blockers.push({ blockerId: 'blocked_uv_not_verified', message: 'UV verification JSON is invalid.' });
  const manifest = manifestRead.value;
  const install = installRead.value;
  const uv = uvRead.value;
  if (uv && (uv.toolId !== 'uv' || uv.status !== 'verified' || uv.decision !== 'uv_provisioning_verified' || uv.canUseUvForHermesPythonRuntime !== true)) blockers.push({ blockerId: 'blocked_uv_not_verified', message: 'UV verification is not approved for Hermes Python runtime.' });
  if (install && (install.status !== 'success' || !acceptedDecisions.includes(install.decision) || install.pythonInstallStatus !== 'installed_with_verified_uv_lock_isolated' || !acceptedVenvStatuses.includes(install.venvStatus) || !acceptedUvStatuses.includes(install.uvStatus) || install.canProceedToPythonInstallVerification !== true || install.canExecuteHermes !== false)) blockers.push({ blockerId: 'blocked_invalid_python_install_result', message: 'Python install result is not compatible with verification.' });
  if (manifest && (manifest.toolId !== 'hermes_agent' || manifest.auditedHead !== (input.expectedAuditedHead || HEAD) || manifest.sourceRootRef !== p.refs.sourceRootRef || manifest.installRootRef !== p.refs.installRootRef || manifest.pythonEnvRootRef !== p.refs.pythonEnvRootRef || manifest.uvExecutableRef !== p.refs.uvExecutableRef || manifest.managerDecision !== 'prefer_uv_lock' || manifest.pythonInstallMethodScope !== 'uv_lock_isolated_only')) blockers.push({ blockerId: 'blocked_invalid_python_install_manifest', message: 'Python install manifest is not compatible with verification.' });
  const statusSource = install || manifest || {};
  if (statusSource.pipStatus !== 'not_executed' || statusSource.pythonDirectStatus !== 'not_executed' || statusSource.setupPyStatus !== 'not_executed' || statusSource.hermesExecutionStatus !== 'not_allowed' || !['not_executed', 'not_allowed'].includes(statusSource.scriptsStatus) || statusSource.credentialsStatus !== 'not_allowed' || statusSource.modelCallStatus !== 'not_allowed' || statusSource.projectMutationStatus !== 'not_allowed') blockers.push({ blockerId: 'blocked_insecure_python_install_result', message: 'Python install statuses are unsafe.' });
  if (install && hasForbiddenCommands(install.commandResults)) blockers.push({ blockerId: 'blocked_insecure_python_install_result', message: 'Python install command results include forbidden command or shell usage.' });
  const pyvenvPreview = exists.pyvenvCfg ? sanitizeFilePreview(await fs.readFile(p.pyvenvCfg, 'utf8')) : undefined;
  if (exists.pyvenvCfg && !pyvenvPreview) blockers.push({ blockerId: 'pyvenv_cfg_empty', message: 'pyvenv.cfg is empty.' });
  const result = base(input, { manifestStatus: manifestRead.ok ? 'valid' : exists.manifest ? 'invalid' : 'missing', installResultStatus: installRead.ok && install?.status === 'success' ? 'success' : exists.result ? 'invalid' : 'missing', pythonEnvStatus: exists.pythonEnv ? 'present' : 'missing', pyvenvCfgStatus: exists.pyvenvCfg ? 'present' : 'missing', pythonExecutableStatus: exists.pythonExecutable ? 'present' : 'missing', sitePackagesStatus: exists.sitePackages ? 'present' : 'missing', uvVerificationStatus: uvRead.ok && uv?.status === 'verified' ? 'verified' : exists.uvVerification ? 'invalid' : 'missing', checksumStatus: uv?.checksumStatus || 'unknown', pythonInstallStatus: install?.pythonInstallStatus || 'unknown', venvStatus: install?.venvStatus || 'unknown', uvStatus: install?.uvStatus || 'unknown', commandResults: install?.commandResults || [], pyvenvCfgPreview: pyvenvPreview, pythonExecutableSha256: await hashFileIfPresent(p.pythonExecutable), pythonExecutableSizeBytes: await sizeFileIfPresent(p.pythonExecutable), sitePackagesEntryCount: await countDirectoryEntriesLimited(p.sitePackages), status: blockers.length === 0 ? 'verified' : 'blocked', decision: blockers.length === 0 ? 'hermes_python_install_verified' : blockers[0].blockerId, blockers, canProceedToJefeReview: blockers.length === 0 });
  await writeResult(p, result);
  return result;
}

module.exports = { executeFactoryHermesPythonInstallVerification };
