import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { executeFactoryUvProvisioningVerification } from '../electron/factory/uv-provisioning-verification/index.cjs'
import {
  parseFactoryUvProvisioningVerificationResult,
  serializeFactoryUvProvisioningVerificationResult,
  summarizeFactoryUvProvisioningVerificationResult,
  validateFactoryUvProvisioningVerificationInput,
  validateFactoryUvProvisioningVerificationResult,
} from '../src/factory/uv-provisioning-verification/index.ts'

const manifestPath = '.codex-temp/external-tools/uv/provisioning-manifest.json'
const provisioningResultPath = '.codex-temp/external-tools/uv/provisioning-result.json'
const verificationResultPath = '.codex-temp/external-tools/uv/provisioning-verification-result.json'
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const parseJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

assert.equal(existsSync(manifestPath), true) // 1
assert.equal(existsSync(provisioningResultPath), true) // 2
const manifest = parseJson(manifestPath)
const provisioning = parseJson(provisioningResultPath)
assert.ok(manifest && provisioning) // 3
assert.equal(provisioning.toolId, 'uv') // 4
assert.equal(provisioning.status, 'success') // 5
assert.ok(['uv_provisioned_locally_with_checksum_verified', 'uv_found_on_system_path_verified'].includes(provisioning.decision)) // 6
assert.ok(provisioning.executableRef.startsWith('.codex-temp/external-tools/uv/bin/uv.exe')) // 7
assert.equal(existsSync('.codex-temp/external-tools/uv/bin/uv.exe'), true) // 8
assert.ok(provisioning.artifactSha256 && provisioning.checksumSha256 && provisioning.artifactSha256 === provisioning.checksumSha256) // 9
assert.ok(provisioning.artifactSha256) // 10
assert.ok(provisioning.checksumSha256) // 11
assert.equal(provisioning.artifactSha256, provisioning.checksumSha256) // 12
assert.equal(provisioning.extractionStatus, 'extracted') // 13
assert.equal(provisioning.verificationStatus, 'uv_version_checked') // 14
assert.equal(provisioning.executionStatus, 'uv_version_only') // 15
const input = { verifiedAt: '2026-07-21T00:00:00.000Z', verifiedBy: 'factory-uv-provisioning-verification-smoke', expectedReleaseTag: provisioning.releaseTag }
assert.equal(validateFactoryUvProvisioningVerificationInput(input).ok, true)
const result = await executeFactoryUvProvisioningVerification(input)
if (result.status !== 'verified') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noDownload: true, noExtraction: true, noHermesRetry: true }, null, 2))
  process.exit(1)
}
const commandKinds = result.commandResults.map((command) => command.kind)
assert.ok(result.commandResults.some((command) => command.kind === 'uv_version_recheck' && command.shell === false)) // 16
assert.ok(result.commandResults.some((command) => command.stdout.includes('uv '))) // 17
assert.ok(result.commandResults.some((command) => command.stdout.includes(provisioning.releaseTag))) // 18
assert.equal(result.status, 'verified') // 19
assert.equal(result.decision, 'uv_provisioning_verified') // 20
assert.equal(result.canUseUvForHermesPythonRuntime, true) // 21
assert.equal(result.canExecuteUvForProjectOps, false) // 22
assert.equal(result.canExecuteHermes, false) // 23
assert.equal(result.canRunHermesScripts, false) // 24
assert.equal(result.canUseCredentials, false) // 25
assert.equal(result.canCallModels, false) // 26
assert.equal(result.canMutateProjectFiles, false) // 27
assert.equal(result.canDeploy, false) // 28
assert.equal(result.shellStatus, 'not_allowed') // 29
assert.equal(result.pipStatus, 'not_executed') // 30
assert.equal(result.pythonStatus, 'not_executed') // 31
assert.equal(result.setupPyStatus, 'not_executed') // 32
assert.equal(result.hermesExecutionStatus, 'not_allowed') // 33
assert.equal(result.scriptsStatus, 'not_executed') // 34
assert.equal(commandKinds.includes('uv_venv'), false) // 35
assert.equal(commandKinds.includes('uv_sync'), false) // 36
assert.equal(commandKinds.includes('uv_run'), false) // 37
assert.equal(commandKinds.includes('uv_pip'), false) // 38
assert.equal(commandKinds.includes('pip'), false) // 39
assert.equal(commandKinds.includes('python'), false) // 40
assert.equal(commandKinds.includes('setup_py'), false) // 41
assert.equal(commandKinds.includes('hermes'), false) // 42
assert.equal(existsSync(verificationResultPath), true) // 43
assert.equal(validateFactoryUvProvisioningVerificationInput(input).ok, true) // 44
assert.equal(validateFactoryUvProvisioningVerificationResult(result).ok, true) // 45
assert.equal(parseFactoryUvProvisioningVerificationResult(serializeFactoryUvProvisioningVerificationResult(result)).uvProvisioningVerificationId, result.uvProvisioningVerificationId) // 46
assert.equal(/password|secret|token|api[_-]?key|credential/iu.test(JSON.stringify(summarizeFactoryUvProvisioningVerificationResult(result))), false) // 47
assert.equal(sha256('package.json'), expectedPackageHash) // 48
assert.equal(sha256('package-lock.json'), expectedLockHash) // 49
assert.ok(/Hermes Python Install Runtime Retry Gate/iu.test(result.recommendedNextStep) && !/execute Hermes/iu.test(result.recommendedNextStep)) // 50

console.log(JSON.stringify({ ok: true, checks: 50, status: result.status, decision: result.decision, releaseTag: result.releaseTag, executableRef: result.executableRef, checksumStatus: result.checksumStatus, executableStatus: result.executableStatus, versionCheckStatus: result.versionCheckStatus, canUseUvForHermesPythonRuntime: result.canUseUvForHermesPythonRuntime }, null, 2))
