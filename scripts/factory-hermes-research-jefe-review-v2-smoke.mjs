import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import reviewRuntime from '../electron/factory/hermes-research-jefe-review-v2/index.cjs'
import { evaluateFactoryHermesResearchJefeReviewV2, parseFactoryHermesResearchJefeReviewV2Result, serializeFactoryHermesResearchJefeReviewV2Result, summarizeFactoryHermesResearchJefeReviewV2Result, validateFactoryHermesResearchJefeReviewV2Input, validateFactoryHermesResearchJefeReviewV2Result } from '../src/factory/hermes-research-jefe-review-v2/index.ts'

const { executeFactoryHermesResearchJefeReviewV2, resolveFactoryHermesResearchJefeReviewV2Paths } = reviewRuntime
const paths = resolveFactoryHermesResearchJefeReviewV2Paths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.ingestionV2Result), true) // 1
const ingestion = JSON.parse(readFileSync(paths.ingestionV2Result, 'utf8'))
assert.ok(ingestion) // 2
assert.equal(ingestion.status, 'ingested') // 3
assert.equal(ingestion.classification, 'controlled_help_probe_success') // 4
assert.equal(ingestion.normalizedOutcome, 'hermes_help_probe_succeeded') // 5
assert.equal(ingestion.canProceedToResearchJefeReviewV2, true) // 6
assert.equal(ingestion.canTreatAsResearchResult, false) // 7
assert.equal(ingestion.canUseFindings, false) // 8
const input = { reviewedAt: '2026-07-22T05:45:00.000Z', reviewedBy: 'factory-hermes-research-jefe-review-v2-smoke', humanApprovalRef: 'human-review/hermes-research-jefe-review-v2', researchResultIngestionV2Result: ingestion }
assert.equal(validateFactoryHermesResearchJefeReviewV2Input(input).ok, true) // 36
const result = await executeFactoryHermesResearchJefeReviewV2(input)
if (result.status !== 'approved_for_research_execution_planning') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true, noNetwork: true }, null, 2)); process.exit(1) }
const receipt = result.researchJefeReviewV2Receipt
const record = result.hermesResearchJefeReviewV2Record
const envelope = result.approvedResearchExecutionPlanningEnvelope
assert.equal(result.status, 'approved_for_research_execution_planning') // 9
assert.equal(result.decision, 'hermes_research_jefe_review_v2_approved_research_execution_planning') // 10
assert.ok(receipt) // 11
assert.ok(record) // 12
assert.ok(envelope) // 13
assert.equal(envelope.currentVerifiedCapability, 'help_probe_only') // 14
assert.equal(envelope.researchExecutionAllowedNow, false) // 15
assert.equal(envelope.hermesExecutionAllowedNow, false) // 16
assert.equal(envelope.networkAllowedNow, false) // 17
assert.equal(envelope.credentialsAllowedNow, false) // 18
assert.equal(envelope.modelCallsAllowedNow, false) // 19
assert.equal(envelope.promptPassingAllowedNow, false) // 20
assert.equal(result.canProceedToResearchExecutionPlanning, true) // 21
assert.equal(result.canRunResearchNow, false) // 22
assert.equal(result.canExecuteHermesNow, false) // 23
assert.equal(result.canUseFindings, false) // 24
assert.equal(result.canUseNetworkNow, false) // 25
assert.equal(result.canUseCredentials, false) // 26
assert.equal(result.canCallModelsNow, false) // 27
assert.ok(receipt.notAuthorizedActions.includes('run_research_now')) // 28
assert.ok(receipt.notAuthorizedActions.includes('execute_hermes_now')) // 29
assert.ok(receipt.notAuthorizedActions.includes('pass_prompt_now')) // 30
assert.ok(receipt.notAuthorizedActions.includes('treat_help_as_research_result')) // 31
assert.ok(receipt.notAuthorizedActions.includes('use_help_output_as_findings')) // 32
assert.equal(evaluateFactoryHermesResearchJefeReviewV2({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 33
assert.equal(evaluateFactoryHermesResearchJefeReviewV2({ reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, humanApprovalRef: input.humanApprovalRef }).decision, 'blocked_missing_ingestion_v2') // 34
assert.equal(evaluateFactoryHermesResearchJefeReviewV2({ ...input, researchResultIngestionV2Result: { ...ingestion, canTreatAsResearchResult: true } }).decision, 'blocked_help_probe_claims_research_result') // 35
assert.equal(validateFactoryHermesResearchJefeReviewV2Result(result).ok, true) // 37
assert.equal(parseFactoryHermesResearchJefeReviewV2Result(serializeFactoryHermesResearchJefeReviewV2Result(result)).jefeReviewId, result.jefeReviewId) // 38
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|usage: hermes|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesResearchJefeReviewV2Result(result))), false) // 39
assert.equal(existsSync(paths.reviewV2Result), true) // 40
assert.equal(sha256('package.json'), expectedPackageHash) // 41
assert.equal(sha256('package-lock.json'), expectedLockHash) // 42
assert.ok(/Research Execution Planning Gate/iu.test(result.recommendedNextStep) && !/run research now|execute hermes now|runtime adapter now/iu.test(result.recommendedNextStep)) // 43

console.log(JSON.stringify({ ok: true, checks: 43, status: result.status, decision: result.decision, helpProbeStatus: result.helpProbeStatus, ingestionClassification: result.ingestionClassification, canProceedToResearchExecutionPlanning: result.canProceedToResearchExecutionPlanning, canRunResearchNow: result.canRunResearchNow, canExecuteHermesNow: result.canExecuteHermesNow, canUseFindings: result.canUseFindings }, null, 2))
