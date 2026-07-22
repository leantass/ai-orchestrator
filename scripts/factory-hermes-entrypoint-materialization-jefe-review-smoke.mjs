import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-entrypoint-materialization-jefe-review/index.cjs'
import { evaluateFactoryHermesEntrypointMaterializationJefeReview, parseFactoryHermesEntrypointMaterializationJefeReviewResult, serializeFactoryHermesEntrypointMaterializationJefeReviewResult, summarizeFactoryHermesEntrypointMaterializationJefeReviewResult, validateFactoryHermesEntrypointMaterializationJefeReviewInput, validateFactoryHermesEntrypointMaterializationJefeReviewResult } from '../src/factory/hermes-entrypoint-materialization-jefe-review/index.ts'

const { resolveFactoryHermesEntrypointMaterializationJefeReviewPaths, executeFactoryHermesEntrypointMaterializationJefeReview } = runtime
const paths = resolveFactoryHermesEntrypointMaterializationJefeReviewPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.ingestionResult), true) // 1
const ingestion = JSON.parse(readFileSync(paths.ingestionResult, 'utf8'))
assert.ok(ingestion) // 2
assert.equal(ingestion.status, 'ingested') // 3
assert.equal(ingestion.classification, 'controlled_build_dependency_cache_miss') // 4
assert.equal(ingestion.normalizedOutcome, 'build_dependency_missing_from_offline_cache') // 5
assert.equal(ingestion.runtimeDecision, 'blocked_network_required') // 6
assert.equal(ingestion.canProceedToMaterializationJefeReview, true) // 7
assert.equal(ingestion.canProceedToBuildDependencyCachePlanning, true) // 8
assert.equal(ingestion.canProceedToMaterializationVerification, false) // 9

const input = { reviewedAt: '2026-07-22T00:20:00.000Z', reviewedBy: 'factory-hermes-entrypoint-materialization-jefe-review-smoke', humanApprovalRef: 'human-review/hermes-entrypoint-materialization-jefe-review-v1', materializationResultIngestionResult: ingestion }
const result = await executeFactoryHermesEntrypointMaterializationJefeReview(input)
const receipt = result.jefeReviewReceipt
const record = result.hermesEntrypointMaterializationJefeReviewRecord
const envelope = result.buildDependencyCachePlanningEnvelope
assert.equal(result.status, 'approved_for_build_dependency_cache_planning') // 10
assert.equal(result.decision, 'hermes_entrypoint_materialization_jefe_review_approved_build_dependency_cache_planning') // 11
assert.ok(receipt) // 12
assert.ok(record) // 13
assert.ok(envelope) // 14
assert.ok(envelope.missingBuildDependency.includes('setuptools')) // 15
assert.equal(envelope.buildBackend, 'setuptools.build_meta') // 16
assert.equal(envelope.setupPyPresent, true) // 17
assert.equal(envelope.cacheAllowedNow, false) // 18
assert.equal(envelope.networkAllowedNow, false) // 19
assert.equal(envelope.materializationRetryAllowedNow, false) // 20
assert.equal(result.canProceedToBuildDependencyCachePlanning, true) // 21
assert.equal(result.canCacheBuildDependenciesNow, false) // 22
assert.equal(result.canEnableNetworkNow, false) // 23
assert.equal(result.canRetryMaterializationNow, false) // 24
assert.equal(result.canRetryResearchAdapterNow, false) // 25
assert.equal(result.canExecuteHermes, false) // 26
assert.equal(result.canRunHermesScripts, false) // 27
assert.equal(result.canUseNetwork, false) // 28
assert.equal(result.canUseCredentials, false) // 29
assert.equal(result.canCallModels, false) // 30
for (const action of ['cache_build_dependency_now', 'enable_network_now', 'retry_materialization_now', 'execute_uv_sync_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 31-34
assert.equal(evaluateFactoryHermesEntrypointMaterializationJefeReview({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 35
assert.equal(evaluateFactoryHermesEntrypointMaterializationJefeReview({ reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, humanApprovalRef: input.humanApprovalRef }).decision, 'blocked_missing_materialization_ingestion') // 36
assert.equal(evaluateFactoryHermesEntrypointMaterializationJefeReview({ ...input, materializationResultIngestionResult: { ...ingestion, canUseNetwork: true } }).decision, 'blocked_materialization_boundary_violation') // 37
assert.equal(validateFactoryHermesEntrypointMaterializationJefeReviewInput(input).ok, true) // 38
assert.equal(validateFactoryHermesEntrypointMaterializationJefeReviewResult(result).ok, true) // 39
assert.equal(parseFactoryHermesEntrypointMaterializationJefeReviewResult(serializeFactoryHermesEntrypointMaterializationJefeReviewResult(result)).jefeReviewId, result.jefeReviewId) // 40
const summaryText = JSON.stringify(summarizeFactoryHermesEntrypointMaterializationJefeReviewResult(result))
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|full pyproject|full uv\.lock|full setup\.py|process\.env/iu.test(summaryText), false) // 41
assert.equal(existsSync(paths.jefeReviewResult), true) // 42
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 43
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 44
assert.ok(/Build Dependency Cache Planning Gate/iu.test(result.recommendedNextStep) && !/cache runtime direct|retry now|enable network now/iu.test(result.recommendedNextStep)) // 45

console.log(JSON.stringify({ ok: true, checks: 45, status: result.status, decision: result.decision, classification: result.classification, normalizedOutcome: result.normalizedOutcome, missingBuildDependency: result.missingBuildDependency, canProceedToBuildDependencyCachePlanning: result.canProceedToBuildDependencyCachePlanning, canCacheBuildDependenciesNow: result.canCacheBuildDependenciesNow, canEnableNetworkNow: result.canEnableNetworkNow, canRetryMaterializationNow: result.canRetryMaterializationNow }, null, 2))
