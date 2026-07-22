import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import ingestionRuntime from '../electron/factory/hermes-research-result-ingestion-v2/index.cjs'
import { parseFactoryHermesResearchResultIngestionV2Result, serializeFactoryHermesResearchResultIngestionV2Result, summarizeFactoryHermesResearchResultIngestionV2Result, validateFactoryHermesResearchResultIngestionV2Input, validateFactoryHermesResearchResultIngestionV2Result } from '../src/factory/hermes-research-result-ingestion-v2/index.ts'

const { executeFactoryHermesResearchResultIngestionV2, resolveFactoryHermesResearchResultIngestionV2Paths } = ingestionRuntime
const paths = resolveFactoryHermesResearchResultIngestionV2Paths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.retryResult), true) // 1
const retry = JSON.parse(readFileSync(paths.retryResult, 'utf8'))
assert.ok(retry) // 2
assert.equal(retry.status, 'success') // 3
assert.equal(retry.decision, 'hermes_research_runtime_adapter_retry_help_probe_succeeded') // 4
assert.equal(retry.helpProbeStatus, 'succeeded') // 5
assert.equal(retry.exitCode, 0) // 6
assert.deepEqual(retry.commandResults[0].args, ['--help']) // 7
assert.equal(retry.commandResults[0].shell, false) // 8
assert.equal(retry.canTreatAsResearchResult, false) // 9
assert.equal(retry.canUseFindings, false) // 10
const input = { ingestedAt: '2026-07-22T05:30:00.000Z', ingestedBy: 'factory-hermes-research-result-ingestion-v2-smoke', researchRuntimeAdapterRetryResult: retry }
assert.equal(validateFactoryHermesResearchResultIngestionV2Input(input).ok, true) // 36
const result = await executeFactoryHermesResearchResultIngestionV2(input)
if (result.status !== 'ingested') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true, noNetwork: true }, null, 2)); process.exit(1) }
const receipt = result.researchResultIngestionV2Receipt
const record = result.hermesResearchResultIngestionV2Record
assert.equal(result.status, 'ingested') // 11
assert.equal(result.classification, 'controlled_help_probe_success') // 12
assert.equal(result.normalizedOutcome, 'hermes_help_probe_succeeded') // 13
assert.equal(result.decision, 'hermes_research_result_ingested_help_probe_success') // 14
assert.ok(receipt) // 15
assert.ok(record) // 16
assert.match(record.normalizedMessage, /operational health evidence only/iu) // 17
assert.ok(record.safetyObservations.includes('helpProbeOnly')) // 18
assert.ok(record.safetyObservations.includes('noResearchPrompt')) // 19
assert.ok(record.safetyObservations.includes('noResearchFindings')) // 20
assert.ok(record.safetyObservations.includes('noNetwork')) // 21
assert.ok(record.safetyObservations.includes('noCredentials')) // 22
assert.ok(record.safetyObservations.includes('noModelCalls')) // 23
assert.ok(record.safetyObservations.includes('noUv')) // 24
assert.equal(result.canProceedToResearchJefeReviewV2, true) // 25
assert.equal(result.canTreatAsResearchResult, false) // 26
assert.equal(result.canUseFindings, false) // 27
assert.equal(result.canExecuteHermes, false) // 28
assert.equal(result.canUseNetwork, false) // 29
assert.equal(result.canUseCredentials, false) // 30
assert.equal(result.canCallModels, false) // 31
assert.ok(receipt.notAuthorizedActions.includes('execute_hermes_now')) // 32
assert.ok(receipt.notAuthorizedActions.includes('run_research_now')) // 33
assert.ok(receipt.notAuthorizedActions.includes('treat_help_as_research_result')) // 34
assert.ok(receipt.notAuthorizedActions.includes('use_help_output_as_findings')) // 35
assert.equal(validateFactoryHermesResearchResultIngestionV2Result(result).ok, true) // 37
assert.equal(parseFactoryHermesResearchResultIngestionV2Result(serializeFactoryHermesResearchResultIngestionV2Result(result)).ingestionId, result.ingestionId) // 38
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|usage: hermes|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesResearchResultIngestionV2Result(result))), false) // 39
assert.equal(existsSync(paths.ingestionV2Result), true) // 40
assert.equal(sha256('package.json'), expectedPackageHash) // 41
assert.equal(sha256('package-lock.json'), expectedLockHash) // 42
assert.ok(/Research JEFE Review Gate v2/iu.test(result.recommendedNextStep)) // 43

console.log(JSON.stringify({ ok: true, checks: 43, status: result.status, decision: result.decision, classification: result.classification, normalizedOutcome: result.normalizedOutcome, helpProbeStatus: result.helpProbeStatus, canProceedToResearchJefeReviewV2: result.canProceedToResearchJefeReviewV2, canTreatAsResearchResult: result.canTreatAsResearchResult, canUseFindings: result.canUseFindings }, null, 2))
