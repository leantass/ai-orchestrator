import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-build-dependency-cache-runtime/index.cjs'
import { parseFactoryHermesBuildDependencyCacheRuntimeResult, serializeFactoryHermesBuildDependencyCacheRuntimeResult, summarizeFactoryHermesBuildDependencyCacheRuntimeResult, validateFactoryHermesBuildDependencyCacheRuntimeInput, validateFactoryHermesBuildDependencyCacheRuntimeResult } from '../src/factory/hermes-build-dependency-cache-runtime/index.ts'

const { resolveFactoryHermesBuildDependencyCacheRuntimePaths, executeFactoryHermesBuildDependencyCacheRuntime } = runtime
const paths = resolveFactoryHermesBuildDependencyCacheRuntimePaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.approvalResult), true) // 1
const approval = JSON.parse(readFileSync(paths.approvalResult, 'utf8'))
assert.ok(approval) // 2
assert.equal(approval.status, 'approved_for_runtime_candidate') // 3
assert.equal(approval.selectedMethodCandidate, 'uv_controlled_build_dependency_cache_prefetch') // 4
assert.equal(existsSync(paths.uvExecutable), true) // 5
assert.equal(existsSync(paths.sourceRoot), true) // 6
assert.equal(existsSync(`${paths.sourceRoot}/uv.lock`), true) // 7
assert.ok(paths.uvCacheRoot.includes('.codex-temp')) // 8
assert.ok(paths.tempEnvRoot.includes('.codex-temp')) // 9

const input = { executedAt: '2026-07-22T01:20:00.000Z', executedBy: 'factory-hermes-build-dependency-cache-runtime-smoke', approvalResult: approval }
assert.equal(validateFactoryHermesBuildDependencyCacheRuntimeInput(input).ok, true) // 41
const result = await executeFactoryHermesBuildDependencyCacheRuntime(input)
const command = result.commandResults[0]
assert.equal(command.commandKind, 'uv_sync_temp_env_for_cache_prefetch') // 10
assert.ok(command.args.includes('sync')) // 11
assert.ok(command.args.includes('--locked')) // 12
assert.ok(command.args.includes('--no-dev')) // 13
assert.ok(command.args.includes('--project')) // 14
assert.equal(command.shell, false) // 15
assert.equal(command.envRefs.UV_PROJECT_ENVIRONMENT, result.tempEnvRootRef) // 16
assert.equal(command.envRefs.UV_CACHE_DIR, result.uvCacheRootRef) // 17
assert.equal(command.envRefs.UV_OFFLINE, undefined) // 18
assert.equal(/TOKEN|PASSWORD|API_KEY|UV_INDEX|PIP_INDEX|PIP_EXTRA_INDEX/iu.test(JSON.stringify(command.envRefs)), false) // 19
assert.equal(/uv run/iu.test(JSON.stringify(command)), false) // 20
assert.equal(/uv pip/iu.test(JSON.stringify(command)), false) // 21
assert.equal(/uv venv/iu.test(JSON.stringify(command)), false) // 22
assert.equal(/\bpip\b/iu.test(command.commandKind), false) // 23
assert.equal(/\bpython\b/iu.test(command.commandKind), false) // 24
assert.equal(/setup\.py/iu.test(command.commandKind), false) // 25
assert.equal(/hermes\.exe|execute_hermes/iu.test(JSON.stringify(command)), false) // 26
assert.equal(result.materializationStatus, 'not_attempted') // 27
assert.equal(result.afterState.realPythonEnvHermesExeExists, result.beforeState.realPythonEnvHermesExeExists) // 28
assert.equal(existsSync(`${paths.metadataRoot}/build-dependency-cache-record.json`), true) // 29
assert.equal(existsSync(paths.manifest), true) // 30
assert.equal(existsSync(paths.result), true) // 31
assert.ok(['prefetched', 'controlled_failure'].includes(result.cacheStatus)) // 32
if (result.status === 'success') assert.equal(result.canProceedToBuildDependencyCacheVerification, true) // 33
if (result.status === 'controlled_failure') assert.equal(result.canProceedToBuildDependencyCacheVerification, false) // 34
assert.equal(result.canRetryMaterializationNow, false) // 35
assert.equal(result.canExecuteHermes, false) // 36
assert.equal(result.canUseCredentials, false) // 37
assert.equal(result.canCallModels, false) // 38
assert.equal(result.materializationStatus, 'not_attempted') // 39
assert.equal(result.adapterRetryStatus, 'not_attempted') // 40
assert.equal(validateFactoryHermesBuildDependencyCacheRuntimeResult(result).ok, true) // 42
assert.equal(parseFactoryHermesBuildDependencyCacheRuntimeResult(serializeFactoryHermesBuildDependencyCacheRuntimeResult(result)).cacheRunId, result.cacheRunId) // 43
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|full uv\.lock|full setup\.py|cache listing|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesBuildDependencyCacheRuntimeResult(result))), false) // 44
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 45
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 46
assert.ok(/Cache Verification|review/iu.test(result.recommendedNextStep)) // 47

console.log(JSON.stringify({ ok: true, checks: 47, status: result.status, decision: result.decision, cacheStatus: result.cacheStatus, tempEnvStatus: result.tempEnvStatus, uvStatus: result.uvStatus, networkStatus: result.networkStatus, canProceedToBuildDependencyCacheVerification: result.canProceedToBuildDependencyCacheVerification, canRetryMaterializationNow: result.canRetryMaterializationNow, canExecuteHermes: result.canExecuteHermes }, null, 2))
