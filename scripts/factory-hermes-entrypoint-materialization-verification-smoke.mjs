import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import runtime from '../electron/factory/hermes-entrypoint-materialization-verification/index.cjs'
import { parseFactoryHermesEntrypointMaterializationVerificationResult, serializeFactoryHermesEntrypointMaterializationVerificationResult, summarizeFactoryHermesEntrypointMaterializationVerificationResult, validateFactoryHermesEntrypointMaterializationVerificationInput, validateFactoryHermesEntrypointMaterializationVerificationResult } from '../src/factory/hermes-entrypoint-materialization-verification/index.ts'

const { resolveFactoryHermesEntrypointMaterializationVerificationPaths, inspectFactoryHermesEntrypointMaterializationVerificationState, executeFactoryHermesEntrypointMaterializationVerification } = runtime
const paths = resolveFactoryHermesEntrypointMaterializationVerificationPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const inspected = inspectFactoryHermesEntrypointMaterializationVerificationState()
const retry = inspected.runtimeRetryResult

assert.equal(existsSync(paths.runtimeRetryResult), true) // 1
assert.equal(existsSync(paths.runtimeRetryManifest), true) // 2
assert.ok(retry) // 3
assert.equal(retry.status, 'success') // 4
assert.equal(retry.decision, 'hermes_entrypoint_materialized_after_cache_verified_retry') // 5
assert.ok(retry.expectedExecutableRef.endsWith('python-env/Scripts/hermes.exe')) // 6
assert.equal(existsSync(paths.expectedExecutable), true) // 7
assert.equal(path.relative(paths.scriptsRoot, paths.expectedExecutable).startsWith('..'), false) // 8
assert.ok(inspected.executableInspection.sizeBytes > 0) // 9
assert.equal(inspected.executableInspection.sha256, sha256(paths.expectedExecutable)) // 10
assert.equal(retry.materializationStatus, 'materialized') // 11
assert.equal(retry.executableStatusAfter, 'present') // 12
assert.equal(retry.hermesExecutionStatus, 'not_executed') // 13
assert.equal(retry.canExecuteHermesNow, false) // 14
assert.equal(retry.researchAdapterRetryStatus, 'not_attempted') // 15
assert.equal(retry.pipStatus, 'not_executed') // 16
assert.equal(retry.pythonDirectStatus, 'not_executed') // 17
assert.equal(retry.setupPyDirectStatus, 'not_executed') // 18
assert.equal(/uv run/iu.test(JSON.stringify(retry.commandResults)), false) // 19
assert.equal(/uv pip/iu.test(JSON.stringify(retry.commandResults)), false) // 20
assert.equal(/uv venv/iu.test(JSON.stringify(retry.commandResults)), false) // 21
assert.equal(retry.networkStatus, 'not_allowed') // 22
assert.equal(retry.credentialsStatus, 'not_allowed') // 23
assert.equal(retry.modelCallStatus, 'not_allowed') // 24
assert.equal(inspected.sourceInspection.keyFileHashesUnchanged, true) // 25
assert.ok(inspected.sourceInspection.knownWarnings.every((x) => ['source_nested_codex_temp_left_from_repaired_runtime_attempt', 'source_metadata_egg_info_created_by_cache_runtime'].includes(x))) // 26
assert.equal(inspected.sourceInspection.unexpectedSourceMutation, false) // 27

const input = { verifiedAt: '2026-07-22T04:10:00.000Z', verifiedBy: 'factory-hermes-entrypoint-materialization-verification-smoke', runtimeRetryResult: retry, runtimeRetryManifest: inspected.runtimeRetryManifest, executableInspection: inspected.executableInspection, sourceInspection: inspected.sourceInspection }
assert.equal(validateFactoryHermesEntrypointMaterializationVerificationInput(input).ok, true) // 48
const result = executeFactoryHermesEntrypointMaterializationVerification(input)
assert.ok(['verified', 'warning_verified'].includes(result.status)) // 28
assert.equal(result.decision, 'hermes_entrypoint_materialization_verified_for_research_runtime_adapter_retry') // 29
assert.ok(result.entrypointMaterializationVerificationReceipt) // 30
assert.ok(result.hermesEntrypointMaterializationVerificationRecord) // 31
assert.ok(result.approvedResearchRuntimeAdapterRetryEnvelope) // 32
assert.equal(result.approvedResearchRuntimeAdapterRetryEnvelope.executableRef, retry.expectedExecutableRef) // 33
assert.equal(result.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryMayExecuteHermesHelpOnly, true) // 34
assert.deepEqual(result.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryCommand.args, ['--help']) // 35
assert.equal(result.approvedResearchRuntimeAdapterRetryEnvelope.retryAllowedNow, false) // 36
assert.equal(result.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryMustNotUseNetwork, true) // 37
assert.equal(result.canProceedToResearchRuntimeAdapterRetry, true) // 38
assert.equal(result.canRetryResearchAdapterNow, false) // 39
assert.equal(result.canExecuteHermesNow, false) // 40
assert.equal(result.canTreatAsResearchResult, false) // 41
assert.equal(result.canUseNetwork, false) // 42
assert.equal(result.canUseCredentials, false) // 43
assert.equal(result.canCallModels, false) // 44
assert.ok(result.entrypointMaterializationVerificationReceipt.notAuthorizedActions.includes('execute_hermes_now')) // 45
assert.ok(result.entrypointMaterializationVerificationReceipt.notAuthorizedActions.includes('execute_entrypoint_now')) // 46
assert.ok(result.entrypointMaterializationVerificationReceipt.notAuthorizedActions.includes('retry_research_adapter_now')) // 47
assert.equal(validateFactoryHermesEntrypointMaterializationVerificationResult(result).ok, true) // 49
assert.equal(parseFactoryHermesEntrypointMaterializationVerificationResult(serializeFactoryHermesEntrypointMaterializationVerificationResult(result)).verificationId, result.verificationId) // 50
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|MZ.{20}|process\.env|uv\.lock contents/isu.test(JSON.stringify(summarizeFactoryHermesEntrypointMaterializationVerificationResult(result))), false) // 51
assert.equal(existsSync(paths.result), true) // 52
assert.equal(createHash('sha256').update(readFileSync('package.json')).digest('hex').toUpperCase(), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 53
assert.equal(createHash('sha256').update(readFileSync('package-lock.json')).digest('hex').toUpperCase(), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 54
assert.ok(/Research Runtime Adapter Retry Gate/iu.test(result.recommendedNextStep) && !/retry directo|execute Hermes/iu.test(result.recommendedNextStep)) // 55

console.log(JSON.stringify({ ok: true, checks: 55, status: result.status, decision: result.decision, executableStatus: result.executableStatus, executableSizeBytes: result.executableSizeBytes, executableSha256: result.executableSha256, sourceMutationStatus: result.sourceMutationStatus, canProceedToResearchRuntimeAdapterRetry: result.canProceedToResearchRuntimeAdapterRetry, canRetryResearchAdapterNow: result.canRetryResearchAdapterNow, canExecuteHermesNow: result.canExecuteHermesNow }, null, 2))
