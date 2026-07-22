import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-entrypoint-materialization-runtime/index.cjs'
import { parseFactoryHermesEntrypointMaterializationRuntimeResult, serializeFactoryHermesEntrypointMaterializationRuntimeResult, summarizeFactoryHermesEntrypointMaterializationRuntimeResult, validateFactoryHermesEntrypointMaterializationRuntimeInput, validateFactoryHermesEntrypointMaterializationRuntimeResult } from '../src/factory/hermes-entrypoint-materialization-runtime/index.ts'

const { resolveFactoryHermesEntrypointMaterializationRuntimePaths, executeFactoryHermesEntrypointMaterializationRuntime } = runtime
const paths = resolveFactoryHermesEntrypointMaterializationRuntimePaths()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.approvalResult), true) // 1
const approval = JSON.parse(readFileSync(paths.approvalResult, 'utf8'))
assert.ok(approval) // 2
assert.equal(approval.status, 'approved_for_runtime_candidate') // 3
assert.equal(approval.approvedEntrypointMaterializationRuntimeEnvelope.selectedMethodCandidate, 'uv_sync_install_project_locked_existing_env') // 4
assert.equal(existsSync(paths.uvExecutable), true) // 5
assert.equal(existsSync(paths.sourceRoot), true) // 6
assert.equal(existsSync(paths.pyproject), true) // 7
assert.equal(existsSync(paths.uvLock), true) // 8
assert.equal(existsSync(paths.pythonEnvRoot), true) // 9

const input = { executedAt: '2026-07-21T23:45:00.000Z', executedBy: 'factory-hermes-entrypoint-materialization-runtime-smoke', approvalResult: approval }
const result = await executeFactoryHermesEntrypointMaterializationRuntime(input)
const command = result.commandResults[0]
assert.equal(command.commandKind, 'uv_sync_install_project_locked_existing_env') // 10
assert.ok(command.args.includes('sync')) // 11
assert.ok(command.args.includes('--locked')) // 12
assert.ok(command.args.includes('--no-dev')) // 13
assert.ok(command.args.includes('--project')) // 14
assert.equal(command.args.includes('--no-install-project'), false) // 15
assert.equal(command.shell, false) // 16
assert.equal(command.envRefs.UV_PROJECT_ENVIRONMENT, '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env') // 17
assert.ok(command.envRefs.UV_CACHE_DIR.startsWith('.codex-temp/external-tools/uv/cache/')) // 18
assert.equal(command.envRefs.UV_OFFLINE, '1') // 19
assert.equal(result.pipStatus, 'not_executed') // 20
assert.equal(result.pythonDirectStatus, 'not_executed') // 21
assert.equal(result.setupPyDirectStatus, 'not_executed') // 22
assert.equal(result.hermesExecutionStatus, 'not_executed') // 23
assert.equal(result.scriptsStatus, 'not_executed') // 24
assert.notEqual(command.commandKind, 'uv_run') // 25
assert.notEqual(command.commandKind, 'uv_pip') // 26
assert.notEqual(command.commandKind, 'uv_venv') // 27
assert.notEqual(command.commandKind, 'pip') // 28
assert.notEqual(command.commandKind, 'python') // 29
assert.notEqual(command.commandKind, 'setup_py') // 30
assert.notEqual(command.commandKind, 'hermes') // 31
assert.equal(result.expectedExecutableRef.endsWith('python-env/Scripts/hermes.exe'), true) // 32
assert.equal(existsSync(paths.manifest), true) // 33
assert.equal(existsSync(paths.result), true) // 34
if (result.status === 'success') {
  assert.equal(existsSync(paths.expectedExecutable), true) // 35
  assert.equal(result.materializationStatus, 'materialized')
  assert.equal(result.canProceedToEntrypointMaterializationVerification, true)
}
if (result.status !== 'success') {
  assert.ok(['blocked_network_required', 'failed_uv_sync_project_install', 'failed_entrypoint_not_created_after_sync', 'blocked_missing_approval_envelope', 'blocked_approved_command_not_safe', 'blocked_uv_not_verified', 'blocked_source_missing', 'blocked_python_env_missing'].includes(result.decision)) // 36
  assert.equal(result.canProceedToEntrypointMaterializationVerification, false)
}
assert.equal(result.canRetryResearchAdapterNow, false) // 37
assert.equal(result.canExecuteHermesNow, false) // 38
assert.equal(result.canTreatAsResearchResult, false) // 39
assert.equal(result.networkStatus, 'not_allowed') // 40
assert.equal(result.credentialsStatus, 'not_allowed') // 41
assert.equal(result.modelCallStatus, 'not_allowed') // 42
assert.equal(validateFactoryHermesEntrypointMaterializationRuntimeInput(input).ok, true) // 43
const validation = validateFactoryHermesEntrypointMaterializationRuntimeResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 44
assert.equal(parseFactoryHermesEntrypointMaterializationRuntimeResult(serializeFactoryHermesEntrypointMaterializationRuntimeResult(result)).materializationRunId, result.materializationRunId) // 45
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full pyproject|full uv\.lock|full setup\.py|process\.env|raw env/iu.test(JSON.stringify(summarizeFactoryHermesEntrypointMaterializationRuntimeResult(result))), false) // 46
assert.equal(sha256('package.json'), expectedPackageHash) // 47
assert.equal(sha256('package-lock.json'), expectedLockHash) // 48
assert.ok(result.status === 'success' ? /Materialization Verification Gate/iu.test(result.recommendedNextStep) : /repair|review/iu.test(result.recommendedNextStep)) // 49

console.log(JSON.stringify({
  ok: true,
  checks: 49,
  status: result.status,
  decision: result.decision,
  command: `${command.executableRef} ${command.args.join(' ')}`,
  uvOffline: command.envRefs.UV_OFFLINE,
  executableStatusBefore: result.executableStatusBefore,
  executableStatusAfter: result.executableStatusAfter,
  materializationStatus: result.materializationStatus,
  canProceedToEntrypointMaterializationVerification: result.canProceedToEntrypointMaterializationVerification,
  controlledFailureAccepted: result.status !== 'success',
}, null, 2))
