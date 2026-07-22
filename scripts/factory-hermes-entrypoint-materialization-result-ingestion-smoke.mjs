import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-entrypoint-materialization-result-ingestion/index.cjs'
import { evaluateFactoryHermesEntrypointMaterializationResultIngestion, parseFactoryHermesEntrypointMaterializationResult, serializeFactoryHermesEntrypointMaterializationResultIngestionResult, summarizeFactoryHermesEntrypointMaterializationResultIngestionResult, validateFactoryHermesEntrypointMaterializationResultIngestionInput, validateFactoryHermesEntrypointMaterializationResultIngestionResult } from '../src/factory/hermes-entrypoint-materialization-result-ingestion/index.ts'

const { resolveFactoryHermesEntrypointMaterializationResultIngestionPaths, executeFactoryHermesEntrypointMaterializationResultIngestion } = runtime
const paths = resolveFactoryHermesEntrypointMaterializationResultIngestionPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.runtimeResult), true) // 1
const runtimeResult = JSON.parse(readFileSync(paths.runtimeResult, 'utf8'))
assert.ok(runtimeResult) // 2
assert.equal(runtimeResult.decision, 'blocked_network_required') // 3
assert.equal(runtimeResult.materializationStatus, 'not_materialized') // 4
assert.equal(runtimeResult.executableStatusAfter, 'missing') // 5
assert.ok(runtimeResult.commandResults[0].envRefs.UV_OFFLINE === '1' || /network|offline|cache/iu.test(JSON.stringify(runtimeResult))) // 6
const input = { ingestedAt: '2026-07-21T23:55:00.000Z', ingestedBy: 'factory-hermes-entrypoint-materialization-result-ingestion-smoke', materializationRuntimeResult: runtimeResult }
const result = await executeFactoryHermesEntrypointMaterializationResultIngestion(input)
const record = result.hermesEntrypointMaterializationResultIngestionRecord
const receipt = result.entrypointMaterializationResultIngestionReceipt
assert.equal(result.status, 'ingested') // 7
assert.equal(result.decision, 'hermes_entrypoint_materialization_result_ingested_controlled_build_dependency_cache_miss') // 8
assert.equal(result.classification, 'controlled_build_dependency_cache_miss') // 9
assert.equal(result.normalizedOutcome, 'build_dependency_missing_from_offline_cache') // 10
assert.ok(/setuptools|cache offline|build dependency/iu.test(record.normalizedMessage)) // 11
assert.ok(record.evidence.expectedExecutableRef) // 12
assert.equal(record.evidence.uvOffline, true) // 13
assert.equal(record.evidence.buildBackend, 'setuptools.build_meta') // 14
assert.equal(record.evidence.setupPyPresent, true) // 15
for (const item of ['noHermesExecution', 'noSelectedInterfaceExecution', 'noPip', 'noPythonDirect', 'noSetupPyDirect', 'networkBlockedByUvOffline']) assert.ok(record.safetyObservations.includes(item)) // 16-21
assert.equal(result.canProceedToMaterializationJefeReview, true) // 22
assert.equal(result.canProceedToBuildDependencyCachePlanning, true) // 23
assert.equal(result.canProceedToMaterializationVerification, false) // 24
assert.equal(result.canRetryResearchAdapterNow, false) // 25
assert.equal(result.canTreatAsResearchResult, false) // 26
assert.equal(result.canUseFindings, false) // 27
assert.equal(result.canExecuteHermes, false) // 28
assert.equal(result.canUseNetwork, false) // 29
assert.equal(result.canUseCredentials, false) // 30
assert.equal(result.canCallModels, false) // 31
assert.ok(receipt) // 32
assert.ok(record) // 33
assert.equal(receipt.approvedNextGate, 'Factory Hermes Entrypoint Materialization JEFE Review Gate v1') // 34
for (const action of ['retry_materialization_now', 'provision_build_dependency_cache_now', 'enable_network_now', 'execute_hermes_now', 'treat_as_research_result']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 35-39
assert.equal(validateFactoryHermesEntrypointMaterializationResultIngestionInput(input).ok, true) // 40
assert.equal(validateFactoryHermesEntrypointMaterializationResultIngestionResult(result).ok, true) // 41
assert.equal(parseFactoryHermesEntrypointMaterializationResult(serializeFactoryHermesEntrypointMaterializationResultIngestionResult(result)).ingestionId, result.ingestionId) // 42
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|full pyproject|full uv\.lock|full setup\.py|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesEntrypointMaterializationResultIngestionResult(result))), false) // 43
assert.equal(existsSync(paths.ingestionResult), true) // 44
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 45
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 46
assert.ok(/Materialization JEFE Review Gate/iu.test(result.recommendedNextStep) && !/repair directo|retry now|enable network/iu.test(result.recommendedNextStep)) // 47
assert.equal(evaluateFactoryHermesEntrypointMaterializationResultIngestion({ ...input, materializationRuntimeResult: { ...runtimeResult, pipStatus: 'executed' } }).decision, 'blocked_materialization_boundary_violation')

console.log(JSON.stringify({ ok: true, checks: 47, status: result.status, decision: result.decision, classification: result.classification, normalizedOutcome: result.normalizedOutcome, canProceedToMaterializationJefeReview: result.canProceedToMaterializationJefeReview, canProceedToBuildDependencyCachePlanning: result.canProceedToBuildDependencyCachePlanning, canProceedToMaterializationVerification: result.canProceedToMaterializationVerification }, null, 2))
