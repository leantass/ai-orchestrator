import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-entrypoint-materialization-runtime-retry/index.cjs'
import {
  parseFactoryHermesEntrypointMaterializationRuntimeRetryResult,
  serializeFactoryHermesEntrypointMaterializationRuntimeRetryResult,
  summarizeFactoryHermesEntrypointMaterializationRuntimeRetryResult,
  validateFactoryHermesEntrypointMaterializationRuntimeRetryInput,
  validateFactoryHermesEntrypointMaterializationRuntimeRetryResult
} from '../src/factory/hermes-entrypoint-materialization-runtime-retry/index.ts'

const {
  resolveFactoryHermesEntrypointMaterializationRuntimeRetryPaths,
  executeFactoryHermesEntrypointMaterializationRuntimeRetry
} = runtime

const paths = resolveFactoryHermesEntrypointMaterializationRuntimeRetryPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.cacheVerificationResult), true) // 1
const cacheVerification = readJson(paths.cacheVerificationResult)
assert.ok(cacheVerification) // 2
assert.ok(['verified', 'warning_verified'].includes(cacheVerification.status)) // 3
assert.equal(cacheVerification.decision, 'hermes_build_dependency_cache_verified_for_materialization_retry') // 4
assert.ok(cacheVerification.approvedEntrypointMaterializationRuntimeRetryEnvelope) // 5
assert.equal(cacheVerification.approvedEntrypointMaterializationRuntimeRetryEnvelope.verifiedBuildDependency.packageName, 'setuptools') // 6
assert.equal(cacheVerification.approvedEntrypointMaterializationRuntimeRetryEnvelope.verifiedBuildDependency.lockedPackageVersion, '81.0.0') // 6
assert.equal(existsSync(paths.uvExecutable), true) // 7
assert.equal(existsSync(paths.sourceRoot), true) // 8
assert.equal(existsSync(paths.uvLock), true) // 9
assert.equal(existsSync(paths.pythonEnvRoot), true) // 10
assert.equal(existsSync(paths.uvCacheRoot), true) // 11

const input = { executedAt: '2026-07-22T03:10:00.000Z', executedBy: 'factory-hermes-entrypoint-materialization-runtime-retry-smoke', cacheVerificationResult: cacheVerification }
assert.equal(validateFactoryHermesEntrypointMaterializationRuntimeRetryInput(input).ok, true) // 41
const result = await executeFactoryHermesEntrypointMaterializationRuntimeRetry(input)
const command = result.commandResults[0]

assert.equal(command.commandKind, 'uv_sync_install_project_locked_existing_env') // 12
assert.ok(command.args.includes('sync')) // 13
assert.ok(command.args.includes('--locked')) // 14
assert.ok(command.args.includes('--no-dev')) // 15
assert.ok(command.args.includes('--project')) // 16
assert.equal(command.args.includes('--no-install-project'), false) // 17
assert.equal(command.shell, false) // 18
assert.equal(command.envRefs.UV_PROJECT_ENVIRONMENT, paths.refs.pythonEnvRootRef) // 19
assert.equal(command.envRefs.UV_CACHE_DIR, paths.refs.uvCacheRootRef) // 20
assert.equal(command.envRefs.UV_OFFLINE, '1') // 21
assert.equal(/uv run/iu.test(JSON.stringify(command)), false) // 22
assert.equal(/uv pip/iu.test(JSON.stringify(command)), false) // 23
assert.equal(/uv venv/iu.test(JSON.stringify(command)), false) // 24
assert.equal(/\bpip\b/iu.test(command.commandKind), false) // 25
assert.equal(/\bpython\b/iu.test(command.commandKind), false) // 26
assert.equal(/setup\.py|setup_py/iu.test(command.commandKind), false) // 27
assert.equal(/execute_hermes|hermes\.exe/iu.test(JSON.stringify(command)), false) // 28
assert.equal(result.researchAdapterRetryStatus, 'not_attempted') // 29
assert.equal(result.networkStatus, 'not_allowed') // 30
if (result.status === 'success') {
  assert.equal(existsSync(paths.expectedExecutable), true)
  assert.equal(result.executableStatusAfter, 'present')
  assert.equal(result.materializationStatus, 'materialized')
  assert.equal(result.canProceedToEntrypointMaterializationVerification, true)
} else {
  assert.ok(['controlled_failure', 'failed', 'blocked'].includes(result.status))
  assert.ok(result.decision)
  assert.equal(result.canProceedToEntrypointMaterializationVerification, false)
}
assert.equal(result.canRetryResearchAdapterNow, false) // 33
assert.equal(result.canExecuteHermesNow, false) // 34
assert.equal(result.canTreatAsResearchResult, false) // 35
assert.deepEqual(result.beforeState.keyFileHashes, result.afterState.keyFileHashes) // 36
assert.ok((result.warnings || []).every((w) => ['source_metadata_egg_info_created_by_cache_runtime', 'source_nested_codex_temp_left_from_repaired_runtime_attempt'].includes(w.warningId))) // 37
assert.equal((result.afterState.forbiddenSourceMutations || []).some((x) => ['dist', 'build', '.venv'].includes(x)), false) // 38
assert.equal(existsSync(paths.manifest), true) // 39
assert.equal(existsSync(paths.result), true) // 40
assert.equal(validateFactoryHermesEntrypointMaterializationRuntimeRetryResult(result).ok, true) // 42
assert.equal(parseFactoryHermesEntrypointMaterializationRuntimeRetryResult(serializeFactoryHermesEntrypointMaterializationRuntimeRetryResult(result)).retryRunId, result.retryRunId) // 43
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|process\.env|pyproject contents|uv\.lock contents|setup\.py contents/iu.test(JSON.stringify(summarizeFactoryHermesEntrypointMaterializationRuntimeRetryResult(result))), false) // 44
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 45
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 46
assert.ok(result.status === 'success' ? /Entrypoint Materialization Verification/iu.test(result.recommendedNextStep) : /repair|review/iu.test(result.recommendedNextStep)) // 47

if (['blocked_network_attempt_detected'].includes(result.decision)) {
  console.error(JSON.stringify({ ok: false, boundaryViolation: true, status: result.status, decision: result.decision, blockers: result.blockers }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  checks: 47,
  status: result.status,
  decision: result.decision,
  executableStatusBefore: result.executableStatusBefore,
  executableStatusAfter: result.executableStatusAfter,
  materializationStatus: result.materializationStatus,
  sourceMutationStatus: result.sourceMutationStatus,
  uvStatus: result.uvStatus,
  networkStatus: result.networkStatus,
  canProceedToEntrypointMaterializationVerification: result.canProceedToEntrypointMaterializationVerification,
  canRetryResearchAdapterNow: result.canRetryResearchAdapterNow,
  canExecuteHermesNow: result.canExecuteHermesNow
}, null, 2))
