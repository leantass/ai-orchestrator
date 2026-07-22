import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import {
  UV_TOOL_PROFILE_V1,
  evaluateFactoryExternalToolProvisioning,
} from '../src/factory/external-tool-provisioning/index.ts'
import { evaluateFactoryExternalToolProvisioningApproval } from '../src/factory/external-tool-provisioning-approval/index.ts'
import {
  parseFactoryUvProvisioningRuntimeResult,
  serializeFactoryUvProvisioningRuntimeResult,
  summarizeFactoryUvProvisioningRuntimeResult,
  validateFactoryUvProvisioningRuntimeInput,
  validateFactoryUvProvisioningRuntimeResult,
} from '../src/factory/uv-provisioning-runtime/index.ts'
import { executeFactoryUvProvisioningRuntime } from '../electron/factory/uv-provisioning-runtime/index.cjs'

const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

const provisioning = evaluateFactoryExternalToolProvisioning({
  toolProfile: UV_TOOL_PROFILE_V1,
  requestedAt: '2026-07-20T02:00:00.000Z',
  requestedBy: 'factory-uv-provisioning-runtime-smoke',
  targetPlatform: 'windows-x64-declarative',
  humanApprovalRef: 'LEAN-UV-PROVISIONING-PLAN-CANDIDATE-V1',
})
const approval = evaluateFactoryExternalToolProvisioningApproval({
  externalToolProvisioningResult: provisioning,
  reviewedAt: '2026-07-20T02:05:00.000Z',
  reviewedBy: 'lean',
  reviewerRole: 'owner',
  humanApprovalRef: 'LEAN-UV-PROVISIONING-RUNTIME-CANDIDATE-V1',
})
const input = {
  externalToolProvisioningApprovalResult: approval,
  executedAt: '2026-07-20T02:10:00.000Z',
  executedBy: 'factory-uv-provisioning-runtime-smoke',
  targetPlatform: 'windows-x64',
}
assert.equal(approval.status, 'tool_provisioning_envelope_candidate_approved') // 1
assert.equal(validateFactoryUvProvisioningRuntimeInput(input).ok, true)
const result = await executeFactoryUvProvisioningRuntime(input)

if (result.status !== 'success') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallbackUsed: true, noHermesRetry: true, noPip: true, noSetupPy: true }, null, 2))
  process.exit(1)
}

const commandKinds = result.commandResults.map((command) => command.kind)
assert.equal(result.status, 'success') // 2
assert.equal(result.toolId, 'uv') // 3
assert.ok(result.targetPlatform) // 4
assert.ok(result.installRootRef.startsWith('.codex-temp/external-tools/uv/')) // 5
assert.ok(result.executableRef) // 6
assert.ok(result.commandResults.some((command) => ['uv_version_system_path', 'uv_version_local'].includes(command.kind) && command.shell === false)) // 7
assert.equal(commandKinds.includes('uv_venv'), false) // 8
assert.equal(commandKinds.includes('uv_sync'), false) // 9
assert.equal(commandKinds.includes('uv_run'), false) // 10
assert.equal(commandKinds.includes('uv_pip'), false) // 11
assert.equal(commandKinds.includes('pip'), false) // 12
assert.equal(commandKinds.includes('python'), false) // 13
assert.equal(commandKinds.includes('setup_py'), false) // 14
assert.equal(commandKinds.includes('hermes'), false) // 15
if (result.downloadStatus === 'downloaded') assert.ok(result.artifactSha256) // 16
if (result.downloadStatus === 'downloaded') assert.ok(result.checksumSha256) // 17
if (result.downloadStatus === 'downloaded') assert.equal(result.artifactSha256, result.checksumSha256) // 18
if (result.downloadStatus === 'downloaded') assert.equal(result.extractionStatus, 'extracted') // 19
assert.equal(result.verificationStatus, 'uv_version_checked') // 20
assert.equal(result.executionStatus, 'uv_version_only') // 21
assert.equal(result.shellStatus, 'not_allowed') // 22
assert.equal(result.pipStatus, 'not_executed') // 23
assert.equal(result.pythonStatus, 'not_executed') // 24
assert.equal(result.setupPyStatus, 'not_executed') // 25
assert.equal(result.hermesExecutionStatus, 'not_allowed') // 26
assert.equal(result.scriptsStatus, 'not_executed') // 27
assert.equal(result.credentialsStatus, 'not_allowed') // 28
assert.equal(result.canExecuteUvForProjectOps, false) // 29
assert.equal(result.canExecuteHermes, false) // 30
assert.equal(result.canRunHermesScripts, false) // 31
assert.equal(result.canUseCredentials, false) // 32
assert.equal(result.canCallModels, false) // 33
assert.equal(result.canMutateProjectFiles, false) // 34
assert.equal(result.canDeploy, false) // 35
assert.equal(existsSync('.codex-temp/external-tools/uv/provisioning-manifest.json'), true) // 36
assert.equal(existsSync('.codex-temp/external-tools/uv/provisioning-result.json'), true) // 37
assert.equal(validateFactoryUvProvisioningRuntimeInput(input).ok, true) // 38
assert.equal(validateFactoryUvProvisioningRuntimeResult(result).ok, true) // 39
assert.equal(parseFactoryUvProvisioningRuntimeResult(serializeFactoryUvProvisioningRuntimeResult(result)).uvProvisioningRuntimeId, result.uvProvisioningRuntimeId) // 40
assert.equal(/password|secret|token|api[_-]?key|credential/iu.test(JSON.stringify(summarizeFactoryUvProvisioningRuntimeResult(result))), false) // 41
assert.equal(sha256('package.json'), expectedPackageHash) // 42
assert.equal(sha256('package-lock.json'), expectedLockHash) // 43
assert.ok(/UV Provisioning Verification Gate/iu.test(result.recommendedNextStep)) // 44
assert.equal(/Hermes Python Runtime retry now|retry Hermes now/iu.test(result.recommendedNextStep), false) // 45

console.log(JSON.stringify({
  ok: true,
  checks: 45,
  status: result.status,
  decision: result.decision,
  releaseTag: result.releaseTag,
  artifactName: result.artifactName,
  installStatus: result.installStatus,
  downloadStatus: result.downloadStatus,
  extractionStatus: result.extractionStatus,
  verificationStatus: result.verificationStatus,
  executionStatus: result.executionStatus,
  executableRef: result.executableRef,
  resolvedVersion: result.resolvedVersion,
}, null, 2))
