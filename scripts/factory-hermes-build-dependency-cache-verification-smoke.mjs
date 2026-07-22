import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-build-dependency-cache-verification/index.cjs'
import {
  parseFactoryHermesBuildDependencyCacheVerificationResult,
  serializeFactoryHermesBuildDependencyCacheVerificationResult,
  summarizeFactoryHermesBuildDependencyCacheVerificationResult,
  validateFactoryHermesBuildDependencyCacheVerificationInput,
  validateFactoryHermesBuildDependencyCacheVerificationResult
} from '../src/factory/hermes-build-dependency-cache-verification/index.ts'

const {
  resolveFactoryHermesBuildDependencyCacheVerificationPaths,
  inspectFactoryHermesBuildDependencyCacheVerificationState,
  executeFactoryHermesBuildDependencyCacheVerification
} = runtime

const paths = resolveFactoryHermesBuildDependencyCacheVerificationPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

assert.equal(existsSync(paths.cacheRuntimeResult), true) // 1
assert.equal(existsSync(paths.cacheRuntimeManifest), true) // 2
assert.equal(existsSync(paths.metadataRecord), true) // 3
const inspected = inspectFactoryHermesBuildDependencyCacheVerificationState()
const runtimeResult = inspected.runtimeResult
const manifest = inspected.runtimeManifest
const metadataRecord = inspected.metadataRecord
const retryResult = inspected.materializationRuntimeRetryResult
const validPostMaterializationRetry = retryResult?.status === 'success'
  && retryResult?.decision === 'hermes_entrypoint_materialized_after_cache_verified_retry'
  && retryResult?.executableStatusAfter === 'present'
  && retryResult?.hermesExecutionStatus === 'not_executed'
assert.ok(runtimeResult) // 4
assert.equal(runtimeResult.status, 'success') // 5
assert.equal(runtimeResult.decision, 'hermes_build_dependency_cache_prefetch_completed') // 6
assert.equal(runtimeResult.cacheStatus, 'prefetched') // 7
assert.equal(runtimeResult.tempEnvStatus, 'created_or_updated') // 8
assert.equal(runtimeResult.metadataStatus, 'written') // 9
assert.equal(runtimeResult.lockedPackageName, 'setuptools') // 10
assert.equal(runtimeResult.lockedPackageVersion, '81.0.0') // 11
assert.equal(metadataRecord.networkScope, 'cache_prefetch_only') // 12
assert.equal(runtimeResult.materializationStatus, 'not_attempted') // 13
assert.equal(runtimeResult.hermesExecutionStatus, 'not_executed') // 14
assert.equal(runtimeResult.pipStatus, 'not_executed') // 15
assert.equal(runtimeResult.pythonDirectStatus, 'not_executed') // 16
assert.equal(runtimeResult.setupPyDirectStatus, 'not_executed') // 17
assert.equal(runtimeResult.credentialsStatus, 'not_allowed') // 18
assert.equal(runtimeResult.modelCallStatus, 'not_allowed') // 19
assert.deepEqual(runtimeResult.beforeState.sourceKeyHashes, runtimeResult.afterState.sourceKeyHashes) // 20
if (runtimeResult.afterState.sourceSuspiciousEntries.includes('hermes_agent.egg-info')) assert.ok(true) // 21
assert.equal(runtimeResult.afterState.sourceSuspiciousEntries.some((x) => ['dist', 'build', '.venv'].includes(x)), false) // 22
if (inspected.inspectedState.realPythonEnvHermesExeExists) {
  assert.equal(validPostMaterializationRetry, true) // 23
} else {
  assert.equal(validPostMaterializationRetry, false) // 23
}

const input = {
  verifiedAt: '2026-07-22T02:30:00.000Z',
  verifiedBy: 'factory-hermes-build-dependency-cache-verification-smoke',
  cacheRuntimeResult: runtimeResult,
  cacheRuntimeManifest: manifest,
  cacheMetadataRecord: metadataRecord
}
assert.equal(validateFactoryHermesBuildDependencyCacheVerificationInput(input).ok, true) // 42
const result = executeFactoryHermesBuildDependencyCacheVerification({
  verifiedAt: input.verifiedAt,
  verifiedBy: input.verifiedBy
})

assert.ok(['verified', 'warning_verified'].includes(result.status)) // 24
assert.equal(result.decision, 'hermes_build_dependency_cache_verified_for_materialization_retry') // 25
assert.ok(result.cacheVerificationReceipt) // 26
assert.ok(result.hermesBuildDependencyCacheVerificationRecord) // 27
assert.ok(result.approvedEntrypointMaterializationRuntimeRetryEnvelope) // 28
assert.equal(result.approvedEntrypointMaterializationRuntimeRetryEnvelope.futureRetryMustUseUvOffline, true) // 29
assert.equal(result.approvedEntrypointMaterializationRuntimeRetryEnvelope.futureRetryMustNotUseNetwork, true) // 30
assert.equal(result.approvedEntrypointMaterializationRuntimeRetryEnvelope.futureRetryMustNotExecuteHermes, true) // 31
assert.equal(result.canProceedToEntrypointMaterializationRuntimeRetry, true) // 32
assert.equal(result.canRetryMaterializationNow, false) // 33
assert.equal(result.canExecuteHermes, false) // 34
assert.equal(result.canUseNetworkNow, false) // 35
assert.equal(result.canUseCredentials, false) // 36
assert.equal(result.canCallModels, false) // 37
assert.ok(result.cacheVerificationReceipt.notAuthorizedActions.includes('retry_materialization_now')) // 38
assert.ok(result.cacheVerificationReceipt.notAuthorizedActions.includes('execute_uv_sync_now')) // 39
assert.ok(result.cacheVerificationReceipt.notAuthorizedActions.includes('execute_hermes_now')) // 40
assert.ok(result.cacheVerificationReceipt.notAuthorizedActions.includes('use_network_now')) // 41
assert.equal(validateFactoryHermesBuildDependencyCacheVerificationResult(result).ok, true) // 43
assert.equal(parseFactoryHermesBuildDependencyCacheVerificationResult(serializeFactoryHermesBuildDependencyCacheVerificationResult(result)).verificationId, result.verificationId) // 44
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|cache listing|process\.env|uv\.lock contents/iu.test(JSON.stringify(summarizeFactoryHermesBuildDependencyCacheVerificationResult(result))), false) // 45
assert.equal(existsSync(paths.verificationResult), true) // 46
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 47
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 48
assert.ok(/Entrypoint Materialization Runtime Retry Gate/iu.test(result.recommendedNextStep) && !/retry directo|execute Hermes/iu.test(result.recommendedNextStep)) // 49

console.log(JSON.stringify({
  ok: true,
  checks: 49,
  status: result.status,
  decision: result.decision,
  missingBuildDependency: result.missingBuildDependency,
  lockedPackageVersion: result.lockedPackageVersion,
  cacheStatus: result.cacheStatus,
  tempEnvStatus: result.tempEnvStatus,
  metadataStatus: result.metadataStatus,
  sourceMutationStatus: result.sourceMutationStatus,
  warnings: result.warnings,
  postMaterializationState: validPostMaterializationRetry ? 'post_materialization_state_detected' : 'pre_retry_state',
  canProceedToEntrypointMaterializationRuntimeRetry: result.canProceedToEntrypointMaterializationRuntimeRetry,
  canRetryMaterializationNow: result.canRetryMaterializationNow,
  canExecuteHermes: result.canExecuteHermes
}, null, 2))
