import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-build-dependency-cache-planning/index.cjs'
import { evaluateFactoryHermesBuildDependencyCachePlanning, parseFactoryHermesBuildDependencyCachePlanningResult, serializeFactoryHermesBuildDependencyCachePlanningResult, summarizeFactoryHermesBuildDependencyCachePlanningResult, validateFactoryHermesBuildDependencyCachePlanningInput, validateFactoryHermesBuildDependencyCachePlanningResult } from '../src/factory/hermes-build-dependency-cache-planning/index.ts'

const { resolveFactoryHermesBuildDependencyCachePlanningPaths, inspectSource, inspectCache, executeFactoryHermesBuildDependencyCachePlanning } = runtime
const paths = resolveFactoryHermesBuildDependencyCachePlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.materializationJefeReviewResult), true) // 1
const jefeReview = JSON.parse(readFileSync(paths.materializationJefeReviewResult, 'utf8'))
assert.ok(jefeReview) // 2
assert.equal(jefeReview.status, 'approved_for_build_dependency_cache_planning') // 3
assert.ok(jefeReview.missingBuildDependency.includes('setuptools')) // 4
assert.equal(jefeReview.buildBackend, 'setuptools.build_meta') // 5
assert.equal(existsSync(paths.sourceRoot), true) // 6
assert.equal(existsSync(`${paths.sourceRoot}/pyproject.toml`), true) // 7
assert.equal(existsSync(`${paths.sourceRoot}/uv.lock`), true) // 8
const sourceInspection = await inspectSource(paths.sourceRoot)
const cacheInspection = await inspectCache(paths.uvCacheRoot)
assert.equal(cacheInspection.cacheRootExists, true) // 9

const input = { plannedAt: '2026-07-22T00:40:00.000Z', plannedBy: 'factory-hermes-build-dependency-cache-planning-smoke', materializationJefeReviewResult: jefeReview, sourceInspection, cacheInspection }
const result = await executeFactoryHermesBuildDependencyCachePlanning(input)
const candidate = result.hermesBuildDependencyCachePlanCandidate
const receipt = result.buildDependencyCachePlanningReceipt
const methods = result.methodCandidates
assert.ok(methods.some((m) => m.methodId === 'uv_controlled_build_dependency_cache_prefetch')) // 10
assert.equal(methods.find((m) => m.methodId === 'enable_network_in_materialization_runtime')?.status, 'not_recommended_for_now') // 11
assert.equal(methods.find((m) => m.methodId === 'pip_download_or_install_setuptools')?.status, 'forbidden') // 12
assert.equal(methods.find((m) => m.methodId === 'setup_py_install')?.status, 'forbidden') // 13
assert.equal(methods.find((m) => m.methodId === 'disable_uv_offline_and_retry')?.status, 'forbidden') // 14
assert.equal(result.selectedMethodCandidate, 'uv_controlled_build_dependency_cache_prefetch') // 15
assert.ok(candidate) // 16
assert.ok(receipt) // 17
assert.ok(candidate.proposedCacheRoot.startsWith('.codex-temp/external-tools/uv/cache')) // 18
assert.equal(candidate.proposedNetworkPolicy.networkAllowedNow, false) // 19
assert.equal(candidate.proposedNetworkPolicy.futureNetworkRequiresApproval, true) // 20
assert.equal(candidate.proposedArtifactPolicy.requireHashCapture, true) // 21
assert.equal(candidate.proposedArtifactPolicy.requirePackageNameVersionRecord, true) // 22
assert.equal(candidate.proposedArtifactPolicy.requireNoCredentials, true) // 23
assert.equal(candidate.proposedRuntimeSafety.noHermesExecution, true) // 24
assert.equal(candidate.proposedRuntimeSafety.noMaterializationRetryDuringCacheRuntime, true) // 25
assert.equal(result.canProceedToBuildDependencyCacheApproval, true) // 26
assert.equal(result.canCacheBuildDependenciesNow, false) // 27
assert.equal(result.canEnableNetworkNow, false) // 28
assert.equal(result.canRetryMaterializationNow, false) // 29
assert.equal(result.canExecuteHermes, false) // 30
assert.equal(result.canRunHermesScripts, false) // 31
assert.equal(result.canUseNetwork, false) // 32
assert.equal(result.canUseCredentials, false) // 33
assert.equal(result.canCallModels, false) // 34
for (const action of ['cache_build_dependency_now', 'enable_network_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_pip_now', 'execute_setup_py_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 35-40
assert.equal(validateFactoryHermesBuildDependencyCachePlanningInput(input).ok, true) // 41
assert.equal(validateFactoryHermesBuildDependencyCachePlanningResult(result).ok, true) // 42
assert.equal(parseFactoryHermesBuildDependencyCachePlanningResult(serializeFactoryHermesBuildDependencyCachePlanningResult(result)).planningId, result.planningId) // 43
const summaryText = JSON.stringify(summarizeFactoryHermesBuildDependencyCachePlanningResult(result))
assert.equal(/full pyproject|full uv\.lock|full setup\.py|cache listing|BEGIN|password|secret|api[_-]?key|bearer|process\.env/iu.test(summaryText), false) // 44
assert.equal(existsSync(paths.planningResult), true) // 45
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 46
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 47
assert.ok(/Build Dependency Cache Approval Gate/iu.test(result.recommendedNextStep) && !/runtime directo|retry now|enable network now/iu.test(result.recommendedNextStep)) // 48
assert.equal(evaluateFactoryHermesBuildDependencyCachePlanning({ ...input, materializationJefeReviewResult: { ...jefeReview, canUseNetwork: true } }).decision, 'blocked_jefe_review_not_approved_for_cache_planning')

console.log(JSON.stringify({ ok: true, checks: 48, status: result.status, decision: result.decision, missingBuildDependency: result.missingBuildDependency, selectedMethodCandidate: result.selectedMethodCandidate, canProceedToBuildDependencyCacheApproval: result.canProceedToBuildDependencyCacheApproval, canCacheBuildDependenciesNow: result.canCacheBuildDependenciesNow, canEnableNetworkNow: result.canEnableNetworkNow, canRetryMaterializationNow: result.canRetryMaterializationNow }, null, 2))
