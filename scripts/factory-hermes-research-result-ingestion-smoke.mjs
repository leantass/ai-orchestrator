import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import ingestionRuntime from '../electron/factory/hermes-research-result-ingestion/index.cjs'
import { evaluateFactoryHermesResearchResultIngestion, parseFactoryHermesResearchResultIngestionResult, serializeFactoryHermesResearchResultIngestionResult, summarizeFactoryHermesResearchResultIngestionResult, validateFactoryHermesResearchResultIngestionInput, validateFactoryHermesResearchResultIngestionResult } from '../src/factory/hermes-research-result-ingestion/index.ts'

const { executeFactoryHermesResearchResultIngestion, resolveFactoryHermesResearchResultIngestionPaths } = ingestionRuntime
const paths = resolveFactoryHermesResearchResultIngestionPaths()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.adapterResult), true) // 1
const adapter = JSON.parse(readFileSync(paths.adapterResult, 'utf8'))
assert.ok(adapter) // 2
assert.equal(adapter.decision, 'blocked_executable_missing') // 3
assert.equal(adapter.canProceedToResultIngestion, true) // 4
assert.equal(adapter.canTreatAsResearchResult, false) // 5
assert.equal(adapter.networkStatus, 'not_allowed') // 6
assert.equal(adapter.credentialsStatus, 'not_allowed') // 6
assert.equal(adapter.modelCallStatus, 'not_allowed') // 6
assert.equal(adapter.pipStatus, 'not_executed') // 7
assert.equal(adapter.pythonDirectStatus, 'not_executed') // 7
assert.equal(adapter.setupPyStatus, 'not_executed') // 7
assert.equal(adapter.uvStatus, 'not_executed') // 7
const input = { ingestedAt: '2026-07-21T21:00:00.000Z', ingestedBy: 'factory-hermes-research-result-ingestion-smoke', adapterResult: adapter }
const result = await executeFactoryHermesResearchResultIngestion(input)
if (result.status !== 'ingested') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true, noNetwork: true }, null, 2)); process.exit(1) }
const record = result.hermesResearchResultIngestionRecord
const receipt = result.researchResultIngestionReceipt
assert.equal(result.status, 'ingested') // 8
assert.equal(result.decision, 'hermes_research_result_ingested_controlled_adapter_block') // 9
assert.equal(result.classification, 'controlled_adapter_block') // 10
assert.equal(record.normalizedOutcome, 'entrypoint_executable_missing') // 11
assert.match(record.normalizedMessage, /missing executable|wrapper/iu) // 12
assert.ok(record.evidence.missingExecutablePath) // 13
assert.equal(record.evidence.exitCode, null) // 14
assert.equal(record.evidence.timedOut, false) // 15
assert.ok(record.safetyObservations.includes('noHermesExecution')) // 16
assert.ok(record.safetyObservations.includes('noResearchPrompt')) // 17
assert.ok(record.safetyObservations.includes('noNetwork')) // 18
assert.ok(record.safetyObservations.includes('noCredentials')) // 19
assert.ok(record.safetyObservations.includes('noModelCalls')) // 20
assert.equal(result.canProceedToResearchJefeReview, true) // 21
assert.equal(result.canProceedToEntrypointMaterializationReview, true) // 22
assert.equal(result.canTreatAsResearchResult, false) // 23
assert.equal(result.canUseFindings, false) // 24
assert.equal(result.canExecuteHermes, false) // 25
assert.equal(result.canRunHermesScripts, false) // 26
assert.equal(result.canUseNetwork, false) // 27
assert.equal(result.canUseCredentials, false) // 28
assert.equal(result.canCallModels, false) // 29
assert.ok(receipt) // 30
assert.ok(record) // 31
assert.equal(receipt.approvedNextGate, 'Factory Hermes Research JEFE Review Gate v1') // 32
assert.ok(receipt.notAuthorizedActions.includes('execute_hermes_now')) // 33
assert.ok(receipt.notAuthorizedActions.includes('retry_adapter_now')) // 34
assert.ok(receipt.notAuthorizedActions.includes('materialize_entrypoint_now')) // 35
assert.ok(receipt.notAuthorizedActions.includes('treat_as_research_result')) // 36
assert.equal(validateFactoryHermesResearchResultIngestionInput(input).ok, true) // 37
assert.equal(validateFactoryHermesResearchResultIngestionResult(result).ok, true) // 38
assert.equal(parseFactoryHermesResearchResultIngestionResult(serializeFactoryHermesResearchResultIngestionResult(result)).ingestionId, result.ingestionId) // 39
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|raw log|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesResearchResultIngestionResult(result))), false) // 40
assert.equal(existsSync(paths.ingestionResult), true) // 41
assert.equal(sha256('package.json'), expectedPackageHash) // 42
assert.equal(sha256('package-lock.json'), expectedLockHash) // 43
assert.ok(/Research JEFE Review Gate/iu.test(result.recommendedNextStep) && !/repair now|execute Hermes now/iu.test(result.recommendedNextStep)) // 44
assert.equal(evaluateFactoryHermesResearchResultIngestion({ ...input, adapterResult: { ...adapter, canTreatAsResearchResult: true } }).decision, 'blocked_adapter_result_claims_research_findings') // 45
assert.equal(evaluateFactoryHermesResearchResultIngestion({ ...input, adapterResult: { ...adapter, networkStatus: 'used' } }).decision, 'blocked_adapter_boundary_violation') // 46

console.log(JSON.stringify({ ok: true, checks: 46, status: result.status, decision: result.decision, classification: result.classification, normalizedOutcome: record.normalizedOutcome, canProceedToResearchJefeReview: result.canProceedToResearchJefeReview, canProceedToEntrypointMaterializationReview: result.canProceedToEntrypointMaterializationReview, canTreatAsResearchResult: result.canTreatAsResearchResult }, null, 2))
