const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const runFile = promisify(execFile);
const { downloadUvArtifactAndChecksum } = require('./uv-provisioning-runtime.download.cjs');
const { extractUvExecutablesFromZip } = require('./uv-provisioning-runtime.zip.cjs');
const { resolveFactoryUvProvisioningRuntimePaths, assertUvInstallRootAllowed, sanitizeCommandOutput, sanitizeEnvironment, findUvOnPath, toRef } = require('./uv-provisioning-runtime.path.cjs');

const KIND = 'factory-uv-provisioning-runtime';
const VERSION = '1.0';
const NEXT = 'Proceed to UV Provisioning Verification Gate v1; Hermes Python Runtime retry requires a separate future block.';

function base(input, overrides = {}) {
  const paths = resolveFactoryUvProvisioningRuntimePaths();
  return {
    uvProvisioningRuntimeId: `uv-provisioning-runtime:uv:${input.executedAt}`,
    uvProvisioningRuntimeKind: KIND,
    uvProvisioningRuntimeVersion: VERSION,
    executedAt: input.executedAt,
    executedBy: input.executedBy,
    toolId: 'uv',
    toolName: 'uv',
    targetPlatform: input.targetPlatform || `${process.platform}-${process.arch}`,
    installRootRef: paths.refs.uvRootRef,
    downloadStatus: 'not_downloaded',
    extractionStatus: 'not_needed',
    verificationStatus: 'not_verified',
    installStatus: 'not_installed',
    executionStatus: 'not_executed',
    shellStatus: 'not_allowed',
    pipStatus: 'not_executed',
    pythonStatus: 'not_executed',
    setupPyStatus: 'not_executed',
    hermesExecutionStatus: 'not_allowed',
    scriptsStatus: 'not_executed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    commandResults: [],
    checks: [],
    blockers: [],
    warnings: [],
    status: 'blocked',
    decision: 'request_uv_provisioning_repair',
    canExecuteUvForVersionCheck: false,
    canExecuteUvForProjectOps: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: NEXT,
    ...overrides,
  };
}
function validateApproval(input) {
  const approval = input.externalToolProvisioningApprovalResult;
  const envelope = approval && approval.approvedToolProvisioningEnvelope;
  if (!approval || !envelope) return 'approval result with approved envelope is required';
  if (approval.status !== 'tool_provisioning_envelope_candidate_approved') return 'approval result must be approved';
  if (approval.toolId !== 'uv' || envelope.toolId !== 'uv') return 'toolId must be uv';
  if (envelope.installStatus !== 'not_installed' || envelope.executionStatus !== 'not_executed' || envelope.downloadStatus !== 'not_downloaded') return 'envelope must be not_installed/not_executed/not_downloaded';
  if (approval.canInstallNow || approval.canExecuteToolNow || approval.canUseShell || approval.canUseCredentials || approval.canMutateProjectFiles || approval.canDeploy) return 'approval capability flags are unsafe';
  assertUvInstallRootAllowed(envelope.installRootRef);
  return undefined;
}
async function uvVersion(executablePath, cwd, kind) {
  try {
    const { stdout, stderr } = await runFile(executablePath, ['--version'], { cwd, env: sanitizeEnvironment(), shell: false, timeout: 60000, windowsHide: true });
    return { ok: true, command: { kind, commandRef: toRef(executablePath), args: ['--version'], exitCode: 0, shell: false, stdout: sanitizeCommandOutput(stdout), stderr: sanitizeCommandOutput(stderr), timedOut: false } };
  } catch (error) {
    return { ok: false, command: { kind, commandRef: toRef(executablePath), args: ['--version'], exitCode: typeof error.code === 'number' ? error.code : null, shell: false, stdout: sanitizeCommandOutput(error.stdout), stderr: sanitizeCommandOutput(error.stderr || error.message), timedOut: Boolean(error.killed) } };
  }
}
async function writeAudit(paths, result) {
  const manifest = {
    manifestKind: 'factory-uv-provisioning-manifest',
    manifestVersion: VERSION,
    toolId: 'uv',
    toolName: 'uv',
    targetPlatform: result.targetPlatform,
    sourceReleaseProvider: result.releaseTag ? 'github_releases_astral_sh_uv' : 'system_path',
    releaseTag: result.releaseTag,
    artifactName: result.artifactName,
    artifactUrlHost: result.sourceUrlRef,
    checksumUrlHost: result.checksumUrlRef,
    artifactSha256: result.artifactSha256,
    checksumSha256: result.checksumSha256,
    installRootRef: result.installRootRef,
    executableRef: result.executableRef,
    uvVersionOutput: result.resolvedVersion,
    commandSummary: result.commandResults.map((command) => ({ kind: command.kind, exitCode: command.exitCode, shell: false })),
    installStatus: result.installStatus,
    downloadStatus: result.downloadStatus,
    extractionStatus: result.extractionStatus,
    verificationStatus: result.verificationStatus,
    executionStatus: result.executionStatus,
    shellStatus: 'not_allowed',
    pipStatus: 'not_executed',
    pythonStatus: 'not_executed',
    setupPyStatus: 'not_executed',
    hermesExecutionStatus: 'not_allowed',
    scriptsStatus: 'not_executed',
    credentialsStatus: 'not_allowed',
    modelCallStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    installedAt: result.executedAt,
    installedBy: result.executedBy,
    nextRequiredGate: 'UV Provisioning Verification Gate v1',
  };
  await fs.mkdir(paths.uvRoot, { recursive: true });
  await fs.writeFile(paths.manifestPath, JSON.stringify(manifest, null, 2));
  await fs.writeFile(paths.resultPath, JSON.stringify(result, null, 2));
}
async function executeFactoryUvProvisioningRuntime(input) {
  const paths = resolveFactoryUvProvisioningRuntimePaths();
  const invalid = validateApproval(input);
  if (invalid) {
    const result = base(input, { decision: 'blocked_invalid_tool_provisioning_envelope', blockers: [{ blockerId: 'invalid_tool_provisioning_envelope', message: invalid }] });
    await writeAudit(paths, result);
    return result;
  }
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    const result = base(input, { status: 'blocked', decision: 'blocked_unsupported_platform', blockers: [{ blockerId: 'unsupported_platform', message: 'UV provisioning runtime v1 supports Windows x64 only.' }] });
    await writeAudit(paths, result);
    return result;
  }
  await fs.mkdir(paths.downloadsRoot, { recursive: true });
  await fs.mkdir(paths.binRoot, { recursive: true });
  const systemUv = findUvOnPath();
  if (systemUv) {
    const version = await uvVersion(systemUv, paths.uvRoot, 'uv_version_system_path');
    const result = base(input, { status: version.ok ? 'success' : 'failed', decision: version.ok ? 'uv_found_on_system_path_verified' : 'failed_uv_version_check', executableRef: systemUv, resolvedVersion: version.command.stdout.trim(), verificationStatus: version.ok ? 'uv_version_checked' : 'uv_version_failed', installStatus: version.ok ? 'existing_system_path_verified' : 'not_installed', executionStatus: version.ok ? 'uv_version_only' : 'not_executed', canExecuteUvForVersionCheck: version.ok, commandResults: [version.command], blockers: version.ok ? [] : [{ blockerId: 'uv_version_check_failed', message: version.command.stderr || 'uv --version failed.' }] });
    await writeAudit(paths, result);
    return result;
  }
  let download;
  try { download = await downloadUvArtifactAndChecksum(paths.downloadsRoot); } catch (error) {
    const result = base(input, { status: 'failed', decision: 'failed_release_metadata_download', blockers: [{ blockerId: 'release_metadata_download_failed', message: sanitizeCommandOutput(error.message) }] });
    await writeAudit(paths, result);
    return result;
  }
  if (download.status === 'blocked_no_supported_artifact' || download.status === 'blocked_checksum_unavailable') {
    const result = base(input, { status: 'blocked', decision: download.status, releaseTag: download.releaseTag, blockers: [{ blockerId: download.status, message: 'Required uv Windows x64 artifact or checksum was unavailable.' }] });
    await writeAudit(paths, result);
    return result;
  }
  if (!download.checksumSha256 || !/^[a-f0-9]{64}$/u.test(download.checksumSha256) || download.artifactSha256 !== download.checksumSha256) {
    const result = base(input, { status: 'failed', decision: 'failed_checksum_verification', releaseTag: download.releaseTag, artifactName: download.artifactName, artifactSha256: download.artifactSha256, checksumSha256: download.checksumSha256, downloadStatus: 'downloaded', blockers: [{ blockerId: 'checksum_verification_failed', message: 'Artifact checksum did not match checksum file.' }] });
    await writeAudit(paths, result);
    return result;
  }
  try { await extractUvExecutablesFromZip(download.artifactPath, paths.binRoot); } catch (error) {
    const result = base(input, { status: 'failed', decision: 'failed_zip_extraction', releaseTag: download.releaseTag, artifactName: download.artifactName, artifactSha256: download.artifactSha256, checksumSha256: download.checksumSha256, sourceUrlRef: download.artifactUrlHost, checksumUrlRef: download.checksumUrlHost, downloadStatus: 'downloaded', extractionStatus: 'failed', blockers: [{ blockerId: error.blockerId || 'zip_extraction_failed', message: sanitizeCommandOutput(error.message) }] });
    await writeAudit(paths, result);
    return result;
  }
  const version = await uvVersion(paths.executablePath, paths.binRoot, 'uv_version_local');
  const result = base(input, { status: version.ok ? 'success' : 'failed', decision: version.ok ? 'uv_provisioned_locally_with_checksum_verified' : 'failed_uv_version_check', releaseTag: download.releaseTag, artifactName: download.artifactName, sourceUrlRef: download.artifactUrlHost, checksumUrlRef: download.checksumUrlHost, artifactSha256: download.artifactSha256, checksumSha256: download.checksumSha256, executableRef: paths.refs.executableRef, resolvedVersion: version.command.stdout.trim(), downloadStatus: 'downloaded', extractionStatus: 'extracted', verificationStatus: version.ok ? 'uv_version_checked' : 'uv_version_failed', installStatus: version.ok ? 'provisioned_local_codex_temp' : 'not_installed', executionStatus: version.ok ? 'uv_version_only' : 'not_executed', canExecuteUvForVersionCheck: version.ok, commandResults: [version.command], blockers: version.ok ? [] : [{ blockerId: 'uv_version_check_failed', message: version.command.stderr || 'uv --version failed.' }] });
  await writeAudit(paths, result);
  return result;
}
module.exports = { executeFactoryUvProvisioningRuntime };
