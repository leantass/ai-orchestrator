import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { executeFactoryHermesPythonInstallRuntimeRetry } from '../electron/factory/hermes-python-install-runtime-retry/index.cjs'
import {
  parseFactoryHermesPythonInstallRuntimeRetryResult,
  serializeFactoryHermesPythonInstallRuntimeRetryResult,
  summarizeFactoryHermesPythonInstallRuntimeRetryResult,
  validateFactoryHermesPythonInstallRuntimeRetryInput,
  validateFactoryHermesPythonInstallRuntimeRetryResult,
} from '../src/factory/hermes-python-install-runtime-retry/index.ts'

const installRootRef = '.codex-temp/external-tools/hermes-agent/install/75b300f'
const sourceRootRef = `${installRootRef}/source`
const pythonEnvRootRef = `${installRootRef}/python-env/`
const uvExecutableRef = '.codex-temp/external-tools/uv/bin/uv.exe'
const uvVerificationRef = '.codex-temp/external-tools/uv/provisioning-verification-result.json'
const pythonInstallManifestRef = `${installRootRef}/python-install-manifest.json`
const pythonInstallResultRef = `${installRootRef}/python-install-result.json`
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

const parseJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(uvVerificationRef), true) // 1
const uvVerification = parseJson(uvVerificationRef)
assert.equal(uvVerification.status, 'verified') // 2
assert.equal(uvVerification.canUseUvForHermesPythonRuntime, true) // 3
assert.equal(existsSync(uvExecutableRef), true) // 4
assert.equal(existsSync(installRootRef), true) // 5
assert.equal(existsSync(sourceRootRef), true) // 6
assert.equal(existsSync(`${sourceRootRef}/pyproject.toml`), true) // 7
assert.equal(existsSync(`${sourceRootRef}/uv.lock`), true) // 8

const input = {
  executedAt: '2026-07-21T14:05:00.000Z',
  executedBy: 'factory-hermes-python-install-runtime-retry-smoke',
}
assert.equal(validateFactoryHermesPythonInstallRuntimeRetryInput(input).ok, true)

const result = await executeFactoryHermesPythonInstallRuntimeRetry(input)
if (result.status !== 'success') {
  console.error(JSON.stringify({
    ok: false,
    status: result.status,
    decision: result.decision,
    blockers: result.blockers,
    commandResults: result.commandResults,
    noFallback: true,
    noHermes: true,
    noPip: true,
    noSetupPy: true,
  }, null, 2))
  process.exit(1)
}

const versionCommand = result.commandResults.find((command) => command.kind === 'uv_version_recheck_for_hermes')
const venvCommand = result.commandResults.find((command) => command.kind === 'uv_venv_hermes_python_env')
const syncCommand = result.commandResults.find((command) => command.kind === 'uv_sync_hermes_locked_no_install_project')
const commandKinds = result.commandResults.map((command) => command.kind)
const successDecisions = [
  'hermes_python_install_completed_with_verified_uv',
  'hermes_python_install_reused_existing_success_with_verified_uv',
  'hermes_python_install_confirmed_existing_env_with_verified_uv_sync',
]
const isIdempotentReuse = result.decision === 'hermes_python_install_reused_existing_success_with_verified_uv'
const isSyncConfirmation = result.decision === 'hermes_python_install_confirmed_existing_env_with_verified_uv_sync'
const isFreshInstall = result.decision === 'hermes_python_install_completed_with_verified_uv'

assert.equal(versionCommand?.shell, false) // 9
assert.ok(successDecisions.includes(result.decision)) // 10
assert.equal(isIdempotentReuse || isSyncConfirmation ? venvCommand === undefined : venvCommand?.shell === false, true) // 11
assert.equal(isIdempotentReuse ? syncCommand === undefined : syncCommand?.shell === false, true) // 12
if (!isIdempotentReuse) {
  assert.ok(syncCommand?.args.includes('--locked')) // 13
  assert.ok(syncCommand?.args.includes('--no-install-project')) // 14
  assert.ok(syncCommand?.args.includes('--no-dev')) // 15
  assert.ok(syncCommand?.args.includes('--project')) // 16
}
assert.equal((syncCommand ?? versionCommand)?.envRefs?.UV_PROJECT_ENVIRONMENT, pythonEnvRootRef) // 17
assert.ok(result.pythonEnvRootRef.startsWith('.codex-temp')) // 18
assert.equal(existsSync(pythonEnvRootRef), true) // 19
assert.equal(existsSync(pythonInstallManifestRef), true) // 20
assert.equal(existsSync(pythonInstallResultRef), true) // 21
assert.equal(result.pythonInstallStatus, 'installed_with_verified_uv_lock_isolated') // 22
assert.ok(['created_with_verified_uv', 'existing_verified_uv_env_reused', 'existing_uv_env_reused'].includes(result.venvStatus)) // 23
assert.ok(['executed_verified_allowlisted', 'verified_uv_existing_install_reused'].includes(result.uvStatus)) // 24
assert.equal(result.pipStatus, 'not_executed') // 25
assert.equal(result.pythonDirectStatus, 'not_executed') // 26
assert.equal(result.setupPyStatus, 'not_executed') // 27
assert.equal(result.hermesExecutionStatus, 'not_allowed') // 28
assert.equal(result.scriptsStatus, 'not_executed') // 29
assert.equal(result.credentialsStatus, 'not_allowed') // 30
assert.equal(result.canProceedToPythonInstallVerification, true) // 31
assert.equal(result.canExecuteHermes, false) // 32
assert.equal(result.canRunHermesScripts, false) // 33
assert.equal(result.canUseCredentials, false) // 34
assert.equal(result.canCallModels, false) // 35
assert.equal(result.canMutateProjectFiles, false) // 36
assert.equal(result.canDeploy, false) // 37
assert.equal(isIdempotentReuse ? result.idempotentExistingInstallUsed : Boolean(result.idempotentExistingInstallUsed), isIdempotentReuse) // 37a
assert.equal(isIdempotentReuse || isSyncConfirmation ? result.reusedExistingPythonEnv : Boolean(result.reusedExistingPythonEnv), isIdempotentReuse || isSyncConfirmation) // 37b
assert.equal(isSyncConfirmation ? result.syncConfirmedExistingEnv : Boolean(result.syncConfirmedExistingEnv), isSyncConfirmation) // 37c
assert.equal(isFreshInstall || isSyncConfirmation || isIdempotentReuse, true) // 37d
assert.equal(commandKinds.includes('uv_run'), false) // 38
assert.equal(commandKinds.includes('uv_pip'), false) // 39
assert.equal(commandKinds.includes('pip'), false) // 40
assert.equal(commandKinds.includes('python'), false) // 41
assert.equal(commandKinds.includes('setup_py'), false) // 42
assert.equal(commandKinds.includes('hermes'), false) // 43
assert.equal(validateFactoryHermesPythonInstallRuntimeRetryInput(input).ok, true) // 44
assert.equal(validateFactoryHermesPythonInstallRuntimeRetryResult(result).ok, true) // 45
assert.equal(parseFactoryHermesPythonInstallRuntimeRetryResult(serializeFactoryHermesPythonInstallRuntimeRetryResult(result)).retryId, result.retryId) // 46
assert.equal(/stdout|stderr|token|password|api[_-]?key|secret|credential/iu.test(JSON.stringify(summarizeFactoryHermesPythonInstallRuntimeRetryResult(result))), false) // 47
assert.equal(sha256('package.json'), expectedPackageHash) // 48
assert.equal(sha256('package-lock.json'), expectedLockHash) // 49
assert.ok(/Factory Hermes Python Install Verification Gate v1/iu.test(result.recommendedNextStep) && !/retry Hermes|execute Hermes/iu.test(result.recommendedNextStep)) // 50
assert.equal(result.canExecuteHermes, false) // 51

console.log(JSON.stringify({
  ok: true,
  checks: 51,
  status: result.status,
  decision: result.decision,
  uvVersion: result.uvVersionOutput,
  pythonInstallStatus: result.pythonInstallStatus,
  venvStatus: result.venvStatus,
  uvStatus: result.uvStatus,
  pipStatus: result.pipStatus,
  pythonDirectStatus: result.pythonDirectStatus,
  setupPyStatus: result.setupPyStatus,
  hermesExecutionStatus: result.hermesExecutionStatus,
  canProceedToPythonInstallVerification: result.canProceedToPythonInstallVerification,
}, null, 2))
