import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import jefeRuntime from '../electron/factory/hermes-research-jefe-review/index.cjs'
import { evaluateFactoryHermesResearchJefeReview, parseFactoryHermesResearchJefeReviewResult, serializeFactoryHermesResearchJefeReviewResult, summarizeFactoryHermesResearchJefeReviewResult, validateFactoryHermesResearchJefeReviewInput, validateFactoryHermesResearchJefeReviewResult } from '../src/factory/hermes-research-jefe-review/index.ts'

const { resolveFactoryHermesResearchJefeReviewPaths } = jefeRuntime
const paths = resolveFactoryHermesResearchJefeReviewPaths()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.ingestionResult), true) // 1
const ingestion = JSON.parse(readFileSync(paths.ingestionResult, 'utf8'))
assert.ok(ingestion) // 2
assert.equal(ingestion.status, 'ingested') // 3
assert.equal(ingestion.classification, 'controlled_adapter_block') // 4
assert.equal(ingestion.hermesResearchResultIngestionRecord.normalizedOutcome, 'entrypoint_executable_missing') // 5
assert.equal(ingestion.canProceedToResearchJefeReview, true) // 6
assert.equal(ingestion.canProceedToEntrypointMaterializationReview, true) // 7
assert.equal(ingestion.canTreatAsResearchResult, false) // 8
assert.equal(ingestion.canUseFindings, false) // 9
assert.equal(ingestion.adapterDecision, 'blocked_executable_missing') // 10
const input = { reviewedAt: '2026-07-21T22:00:00.000Z', reviewedBy: 'factory-hermes-research-jefe-review-smoke', humanApprovalRef: 'human-review/hermes-research-jefe-review-v1', ingestionResult: ingestion }
const result = evaluateFactoryHermesResearchJefeReview(input)
writeFileSync(paths.jefeReviewResult, serializeFactoryHermesResearchJefeReviewResult(result))
const envelope = result.approvedEntrypointMaterializationPlanningEnvelope
assert.equal(result.status, 'approved_for_entrypoint_materialization_planning') // 11
assert.equal(result.decision, 'hermes_research_jefe_review_approved_entrypoint_materialization_planning') // 12
assert.ok(result.researchJefeReviewReceipt) // 13
assert.ok(result.hermesResearchJefeReviewRecord) // 14
assert.ok(envelope) // 15
assert.equal(envelope.commandName, 'hermes') // 16
assert.equal(envelope.pythonEntrypoint, 'hermes_cli.main:main') // 17
assert.ok(envelope.missingExecutableRef.endsWith('python-env/Scripts/hermes.exe')) // 18
assert.equal(envelope.materializationAllowedNow, false) // 19
assert.equal(envelope.adapterRetryAllowedNow, false) // 20
assert.equal(envelope.hermesExecutionAllowedNow, false) // 21
assert.equal(result.canProceedToEntrypointMaterializationPlanning, true) // 22
assert.equal(result.canMaterializeEntrypointNow, false) // 23
assert.equal(result.canRetryAdapterNow, false) // 24
assert.equal(result.canExecuteHermes, false) // 25
assert.equal(result.canRunHermesScripts, false) // 26
assert.equal(result.canUseNetwork, false) // 27
assert.equal(result.canUseCredentials, false) // 28
assert.equal(result.canCallModels, false) // 29
assert.equal(result.canMutateProjectFiles, false) // 30
assert.equal(result.canDeploy, false) // 31
for (const action of ['materialize_entrypoint_now', 'install_project_now', 'retry_adapter_now', 'execute_hermes_now', 'execute_python_now', 'execute_uv_now', 'execute_pip_now', 'execute_setup_py_now', 'treat_as_research_result']) assert.ok(result.researchJefeReviewReceipt.notAuthorizedActions.includes(action)) // 32-40
assert.equal(evaluateFactoryHermesResearchJefeReview({ reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy }).decision, 'blocked_missing_ingestion_result') // 41
assert.equal(evaluateFactoryHermesResearchJefeReview({ ...input, ingestionResult: { ...ingestion, canTreatAsResearchResult: true } }).decision, 'blocked_ingestion_claims_research_result') // 42
assert.equal(evaluateFactoryHermesResearchJefeReview({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 43
assert.equal(validateFactoryHermesResearchJefeReviewInput(input).ok, true) // 44
assert.equal(validateFactoryHermesResearchJefeReviewResult(result).ok, true) // 45
assert.equal(parseFactoryHermesResearchJefeReviewResult(serializeFactoryHermesResearchJefeReviewResult(result)).jefeReviewId, result.jefeReviewId) // 46
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|raw log|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesResearchJefeReviewResult(result))), false) // 47
assert.equal(existsSync(paths.jefeReviewResult), true) // 48
assert.equal(sha256('package.json'), expectedPackageHash) // 49
assert.equal(sha256('package-lock.json'), expectedLockHash) // 50
assert.ok(/Entrypoint Materialization Planning Gate/iu.test(result.recommendedNextStep) && !/runtime directo|materialize now/iu.test(result.recommendedNextStep)) // 51
console.log(JSON.stringify({ ok: true, checks: 51, status: result.status, decision: result.decision, adapterDecision: result.adapterDecision, classification: result.classification, normalizedOutcome: result.normalizedOutcome, canProceedToEntrypointMaterializationPlanning: result.canProceedToEntrypointMaterializationPlanning, canMaterializeEntrypointNow: result.canMaterializeEntrypointNow, canRetryAdapterNow: result.canRetryAdapterNow }, null, 2))
