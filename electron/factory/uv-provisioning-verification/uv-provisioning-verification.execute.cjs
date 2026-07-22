const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const { resolveFactoryUvProvisioningVerificationPaths, assertFactoryUvVerificationPathContained, runUvVersionRecheck, sanitizeCommandOutput } = require('./uv-provisioning-verification.path.cjs');

const KIND = 'factory-uv-provisioning-verification';
const VERSION = '1.0';
const NEXT = 'Proceed to Hermes Python Install Runtime Retry Gate v1; Hermes execution remains forbidden.';
const forbiddenKinds = ['uv_venv', 'uv_sync', 'uv_run', 'uv_pip', 'pip', 'python', 'setup_py', 'hermes'];

function base(input, overrides = {}) {
  const paths = resolveFactoryUvProvisioningVerificationPaths();
  return { uvProvisioningVerificationId: `uv-provisioning-verification:uv:${input.verifiedAt}`, uvProvisioningVerificationKind: KIND, uvProvisioningVerificationVersion: VERSION, verifiedAt: input.verifiedAt, verifiedBy: input.verifiedBy, toolId: 'uv', toolName: 'uv', uvRootRef: paths.refs.uvRootRef, executableRef: paths.refs.executableRef, manifestRef: paths.refs.manifestRef, provisioningResultRef: paths.refs.provisioningResultRef, verificationResultRef: paths.refs.verificationResultRef, checksumStatus: 'unknown', executableStatus: 'unknown', versionCheckStatus: 'not_rechecked', installStatus: 'unknown', executionStatus: 'uv_version_only', shellStatus: 'not_allowed', pipStatus: 'not_executed', pythonStatus: 'not_executed', setupPyStatus: 'not_executed', hermesExecutionStatus: 'not_allowed', scriptsStatus: 'not_executed', credentialsStatus: 'not_allowed', modelCallStatus: 'not_allowed', projectMutationStatus: 'not_allowed', deployStatus: 'not_allowed', commandResults: [], checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'request_uv_provisioning_repair', canUseUvForHermesPythonRuntime: false, canExecuteUvForProjectOps: false, canExecuteHermes: false, canRunHermesScripts: false, canUseCredentials: false, canCallModels: false, canMutateProjectFiles: false, canDeploy: false, recommendedNextStep: NEXT, ...overrides };
}
async function readJson(filePath, missingDecision, invalidDecision) {
  try { return { ok: true, value: JSON.parse(await fs.readFile(filePath, 'utf8')) }; }
  catch (error) { return { ok: false, decision: error.code === 'ENOENT' ? missingDecision : invalidDecision, message: sanitizeCommandOutput(error.message) }; }
}
function dangerousPreviousCommands(result) {
  return (result.commandResults || []).some((command) => forbiddenKinds.includes(command.kind) || command.shell !== false);
}
async function writeResult(paths, result) { await fs.writeFile(paths.verificationResultPath, JSON.stringify(result, null, 2)); }
async function executeFactoryUvProvisioningVerification(input) {
  const paths = resolveFactoryUvProvisioningVerificationPaths();
  const manifestRead = await readJson(paths.manifestPath, 'blocked_missing_provisioning_manifest', 'blocked_invalid_provisioning_manifest');
  if (!manifestRead.ok) { const result = base(input, { decision: manifestRead.decision, blockers: [{ blockerId: manifestRead.decision, message: manifestRead.message }] }); await writeResult(paths, result); return result; }
  const resultRead = await readJson(paths.provisioningResultPath, 'blocked_missing_provisioning_result', 'blocked_invalid_provisioning_result');
  if (!resultRead.ok) { const result = base(input, { decision: resultRead.decision, blockers: [{ blockerId: resultRead.decision, message: resultRead.message }] }); await writeResult(paths, result); return result; }
  const manifest = manifestRead.value;
  const provisioning = resultRead.value;
  const blockers = [];
  try { assertFactoryUvVerificationPathContained(paths.uvRoot, paths.repoRoot); assertFactoryUvVerificationPathContained(paths.executablePath, paths.uvRoot); } catch (error) { blockers.push({ blockerId: 'blocked_uv_path_outside_codex_temp', message: sanitizeCommandOutput(error.message) }); }
  if (manifest.toolId !== 'uv') blockers.push({ blockerId: 'invalid_manifest_tool', message: 'Manifest toolId must be uv.' });
  if (provisioning.toolId !== 'uv' || provisioning.status !== 'success') blockers.push({ blockerId: 'invalid_provisioning_result', message: 'Provisioning result must be success for uv.' });
  if (!['uv_provisioned_locally_with_checksum_verified', 'uv_found_on_system_path_verified'].includes(provisioning.decision)) blockers.push({ blockerId: 'invalid_provisioning_decision', message: 'Provisioning decision is not compatible.' });
  if (!['provisioned_local_codex_temp', 'existing_system_path_verified'].includes(provisioning.installStatus)) blockers.push({ blockerId: 'invalid_install_status', message: 'Install status is not compatible.' });
  if (provisioning.installStatus === 'provisioned_local_codex_temp' && provisioning.executableRef !== paths.refs.executableRef) blockers.push({ blockerId: 'blocked_uv_path_outside_codex_temp', message: 'Local executableRef must be under .codex-temp uv bin root.' });
  if (!fsSync.existsSync(paths.executablePath)) blockers.push({ blockerId: 'blocked_missing_uv_executable', message: 'uv.exe is missing.' });
  if (provisioning.downloadStatus === 'downloaded' && (!provisioning.artifactSha256 || !provisioning.checksumSha256 || provisioning.artifactSha256 !== provisioning.checksumSha256)) blockers.push({ blockerId: 'checksum_not_verified', message: 'Downloaded artifact checksum is not verified.' });
  if (provisioning.downloadStatus === 'downloaded' && provisioning.extractionStatus !== 'extracted') blockers.push({ blockerId: 'extraction_not_verified', message: 'Extraction status must be extracted.' });
  if (provisioning.verificationStatus !== 'uv_version_checked' || provisioning.executionStatus !== 'uv_version_only') blockers.push({ blockerId: 'previous_version_check_invalid', message: 'Previous uv version check is invalid.' });
  if (provisioning.shellStatus !== 'not_allowed' || provisioning.pipStatus !== 'not_executed' || provisioning.pythonStatus !== 'not_executed' || provisioning.setupPyStatus !== 'not_executed' || provisioning.hermesExecutionStatus !== 'not_allowed' || provisioning.scriptsStatus !== 'not_executed') blockers.push({ blockerId: 'dangerous_previous_status', message: 'Previous provisioning statuses are unsafe.' });
  if (dangerousPreviousCommands(provisioning)) blockers.push({ blockerId: 'dangerous_previous_command', message: 'Previous command results include forbidden command or shell usage.' });
  if (blockers.length > 0) { const result = base(input, { decision: blockers.some((b) => b.blockerId === 'blocked_missing_uv_executable') ? 'blocked_missing_uv_executable' : 'blocked_invalid_provisioning_result', releaseTag: provisioning.releaseTag, artifact: provisioning.artifactName, checksumStatus: 'invalid', executableStatus: fsSync.existsSync(paths.executablePath) ? 'present' : 'missing', installStatus: provisioning.installStatus || 'unknown', blockers }); await writeResult(paths, result); return result; }
  const version = await runUvVersionRecheck(paths.executablePath, paths.binRoot);
  const stdout = version.command.stdout.trim();
  const expected = input.expectedVersionPrefix || input.expectedReleaseTag || provisioning.releaseTag || manifest.releaseTag;
  const versionOk = version.ok && stdout.startsWith('uv ') && (!expected || stdout.includes(String(expected).replace(/^v/u, '')));
  const result = base(input, { releaseTag: provisioning.releaseTag || manifest.releaseTag, artifact: provisioning.artifactName || manifest.artifactName, checksumStatus: 'verified', executableStatus: 'present', versionCheckStatus: versionOk ? 'uv_version_rechecked' : 'failed', installStatus: provisioning.installStatus, commandResults: [version.command], status: versionOk ? 'verified' : 'failed', decision: versionOk ? 'uv_provisioning_verified' : 'failed_uv_version_recheck', canUseUvForHermesPythonRuntime: versionOk, blockers: versionOk ? [] : [{ blockerId: 'failed_uv_version_recheck', message: version.command.stderr || 'uv --version recheck failed or version mismatch.' }] });
  await writeResult(paths, result);
  return result;
}
module.exports = { executeFactoryUvProvisioningVerification };
