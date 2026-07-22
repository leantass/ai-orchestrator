import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { executeFactoryHermesPythonInstallVerification } from '../electron/factory/hermes-python-install-verification/index.cjs'
import {
  parseFactoryHermesPythonInstallVerificationResult,
  serializeFactoryHermesPythonInstallVerificationResult,
  summarizeFactoryHermesPythonInstallVerificationResult,
  validateFactoryHermesPythonInstallVerificationInput,
  validateFactoryHermesPythonInstallVerificationResult,
} from '../src/factory/hermes-python-install-verification/index.ts'

const installRoot = '.codex-temp/external-tools/hermes-agent/install/75b300f'
const sourceRoot = `${installRoot}/source`
const pythonEnvRoot = `${installRoot}/python-env`
const manifestPath = `${installRoot}/python-install-manifest.json`
const installResultPath = `${installRoot}/python-install-result.json`
const verificationResultPath = `${installRoot}/python-install-verification-result.json`
const uvVerificationPath = '.codex-temp/external-tools/uv/provisioning-verification-result.json'
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const acceptedDecisions = ['hermes_python_install_completed_with_verified_uv', 'hermes_python_install_reused_existing_success_with_verified_uv', 'hermes_python_install_confirmed_existing_env_with_verified_uv_sync']
const acceptedVenvStatuses = ['created_with_verified_uv', 'existing_verified_uv_env_reused', 'existing_uv_env_reused']
const acceptedUvStatuses = ['executed_verified_allowlisted', 'verified_uv_existing_install_reused']
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const parseJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

assert.equal(existsSync(installRoot), true) // 1
assert.equal(existsSync(sourceRoot), true) // 2
assert.equal(existsSync(`${sourceRoot}/pyproject.toml`), true) // 3
assert.equal(existsSync(`${sourceRoot}/uv.lock`), true) // 4
assert.equal(existsSync(pythonEnvRoot), true) // 5
assert.equal(existsSync(`${pythonEnvRoot}/pyvenv.cfg`), true) // 6
assert.equal(existsSync(`${pythonEnvRoot}/Scripts/python.exe`), true) // 7
assert.equal(existsSync(`${pythonEnvRoot}/Lib/site-packages`), true) // 8
assert.equal(existsSync(manifestPath), true) // 9
assert.equal(existsSync(installResultPath), true) // 10
assert.equal(existsSync(uvVerificationPath), true) // 11
const manifest = parseJson(manifestPath)
const installResult = parseJson(installResultPath)
const uvVerification = parseJson(uvVerificationPath)
assert.ok(manifest && installResult && uvVerification) // 12
assert.equal(uvVerification.status, 'verified') // 13
assert.equal(uvVerification.canUseUvForHermesPythonRuntime, true) // 14
assert.equal(installResult.status, 'success') // 15
assert.ok(acceptedDecisions.includes(installResult.decision)) // 16
assert.equal(manifest.auditedHead, '75b300f13af40878ad6482b2ecb39c55c86679fe') // 17
assert.equal(manifest.sourceRootRef, sourceRoot) // 18
assert.equal(manifest.pythonEnvRootRef, `${pythonEnvRoot}/`) // 19
assert.equal(manifest.uvExecutableRef, uvVerification.executableRef) // 20
assert.equal(installResult.pythonInstallStatus, 'installed_with_verified_uv_lock_isolated') // 21
assert.ok(acceptedVenvStatuses.includes(installResult.venvStatus)) // 22
assert.ok(acceptedUvStatuses.includes(installResult.uvStatus)) // 23
assert.equal(installResult.pipStatus, 'not_executed') // 24
assert.equal(installResult.pythonDirectStatus, 'not_executed') // 25
assert.equal(installResult.setupPyStatus, 'not_executed') // 26
assert.equal(installResult.hermesExecutionStatus, 'not_allowed') // 27
assert.ok(['not_executed', 'not_allowed'].includes(installResult.scriptsStatus)) // 28
assert.equal(installResult.credentialsStatus, 'not_allowed') // 29
assert.equal(installResult.modelCallStatus, 'not_allowed') // 30
const commandKinds = installResult.commandResults.map((command) => command.kind)
assert.equal(commandKinds.includes('uv_run'), false) // 31
assert.equal(commandKinds.includes('uv_pip'), false) // 32
assert.equal(commandKinds.includes('pip'), false) // 33
assert.equal(commandKinds.includes('python'), false) // 34
assert.equal(commandKinds.includes('setup_py'), false) // 35
assert.equal(commandKinds.includes('hermes'), false) // 36
assert.equal(installResult.commandResults.every((command) => command.shell === false), true) // 37

const input = { verifiedAt: '2026-07-21T15:00:00.000Z', verifiedBy: 'factory-hermes-python-install-verification-smoke' }
assert.equal(validateFactoryHermesPythonInstallVerificationInput(input).ok, true)
const result = await executeFactoryHermesPythonInstallVerification(input)
if (result.status !== 'verified') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true }, null, 2))
  process.exit(1)
}
assert.equal(result.status, 'verified') // 38
assert.equal(result.decision, 'hermes_python_install_verified') // 39
assert.equal(result.canProceedToJefeReview, true) // 40
assert.equal(result.canProceedToResearchRuntimePlanning, false) // 41
assert.equal(result.canExecuteHermes, false) // 42
assert.equal(result.canRunHermesScripts, false) // 43
assert.equal(result.canUseCredentials, false) // 44
assert.equal(result.canCallModels, false) // 45
assert.equal(result.canMutateProjectFiles, false) // 46
assert.equal(result.canDeploy, false) // 47
assert.equal(existsSync(verificationResultPath), true) // 48
assert.equal(validateFactoryHermesPythonInstallVerificationInput(input).ok, true) // 49
assert.equal(validateFactoryHermesPythonInstallVerificationResult(result).ok, true) // 50
assert.equal(parseFactoryHermesPythonInstallVerificationResult(serializeFactoryHermesPythonInstallVerificationResult(result)).pythonInstallVerificationId, result.pythonInstallVerificationId) // 51
assert.equal(/stdout|stderr|bearer|password|api[_-]?key|secret|uv\.lock|pyproject\.toml/iu.test(JSON.stringify(summarizeFactoryHermesPythonInstallVerificationResult(result))), false) // 52
assert.equal(sha256('package.json'), expectedPackageHash) // 53
assert.equal(sha256('package-lock.json'), expectedLockHash) // 54
assert.ok(/Factory Hermes Python Install JEFE Review Gate v1/iu.test(result.recommendedNextStep) && !/execute Hermes/iu.test(result.recommendedNextStep)) // 55

console.log(JSON.stringify({ ok: true, checks: 55, status: result.status, decision: result.decision, manifestStatus: result.manifestStatus, installResultStatus: result.installResultStatus, pythonEnvStatus: result.pythonEnvStatus, pyvenvCfgStatus: result.pyvenvCfgStatus, pythonExecutableStatus: result.pythonExecutableStatus, sitePackagesStatus: result.sitePackagesStatus, uvVerificationStatus: result.uvVerificationStatus, canProceedToJefeReview: result.canProceedToJefeReview, canExecuteHermes: result.canExecuteHermes }, null, 2))
