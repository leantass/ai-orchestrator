import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import planningRuntime from '../electron/factory/hermes-research-execution-planning/index.cjs'
import { evaluateFactoryHermesResearchExecutionPlanning, parseFactoryHermesResearchExecutionPlanningResult, serializeFactoryHermesResearchExecutionPlanningResult, summarizeFactoryHermesResearchExecutionPlanningResult, validateFactoryHermesResearchExecutionPlanningInput, validateFactoryHermesResearchExecutionPlanningResult } from '../src/factory/hermes-research-execution-planning/index.ts'

const { executeFactoryHermesResearchExecutionPlanning, resolveFactoryHermesResearchExecutionPlanningPaths } = planningRuntime
const paths = resolveFactoryHermesResearchExecutionPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'

assert.equal(existsSync(paths.reviewV2Result), true) // 1
const review = JSON.parse(readFileSync(paths.reviewV2Result, 'utf8'))
assert.equal(review.status, 'approved_for_research_execution_planning') // 2
assert.equal(review.decision, 'hermes_research_jefe_review_v2_approved_research_execution_planning') // 3
assert.equal(review.canProceedToResearchExecutionPlanning, true) // 4
assert.equal(review.canRunResearchNow, false) // 5
assert.equal(review.canExecuteHermesNow, false) // 6
assert.equal(review.canUseFindings, false) // 7
const retry = JSON.parse(readFileSync(paths.adapterRetryResult, 'utf8'))
assert.equal(retry.helpProbeStatus, 'succeeded') // 8
assert.equal(retry.commandResults?.[0]?.shell, false) // 9
assert.deepEqual(retry.commandResults?.[0]?.args, ['--help']) // 10
assert.equal(retry.canTreatAsResearchResult, false) // 11
assert.equal(retry.canUseFindings, false) // 12

const result = await executeFactoryHermesResearchExecutionPlanning({
  plannedAt: '2026-07-22T06:15:00.000Z',
  plannedBy: 'factory-hermes-research-execution-planning-smoke',
  researchJefeReviewV2Result: review,
  researchRuntimeAdapterRetryResult: retry,
})

if (!['plan_candidate_created', 'manual_review_required'].includes(result.status)) {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noHermes: true, noUv: true, noPip: true, noPython: true, noNetwork: true }, null, 2))
  process.exit(1)
}

assert.ok(result.helpProbeInspectionSummary) // 13
assert.equal(result.helpProbeInspectionSummary.helpProbeStatus, 'succeeded') // 14
assert.equal(result.helpProbeInspectionSummary.hasOneshotPromptFlag, true) // 15
assert.equal(result.helpProbeInspectionSummary.hasModelFlag, true) // 16
assert.ok(result.sourceInspectionSummary) // 17
assert.ok(result.methodCandidates.length >= 7) // 18
assert.ok(result.methodCandidates.some((c) => c.methodType === 'help_derived_noninteractive_research_command')) // 19
assert.ok(result.methodCandidates.some((c) => c.methodType === 'source_mapped_research_command')) // 20
assert.ok(result.methodCandidates.some((c) => c.methodType === 'interactive_cli_research_session')) // 21
assert.ok(result.methodCandidates.some((c) => c.methodType === 'networked_research_execution')) // 22
assert.ok(result.methodCandidates.some((c) => c.methodType === 'credentialed_model_research_execution')) // 23
assert.ok(result.methodCandidates.some((c) => c.methodType === 'mock_or_dry_run_research_execution')) // 24
assert.ok(result.methodCandidates.some((c) => c.methodType === 'help_output_as_research_source')) // 25
assert.ok(result.researchExecutionPlanningReceipt) // 26
assert.equal(result.canRunResearchNow, false) // 27
assert.equal(result.canExecuteHermesNow, false) // 28
assert.equal(result.canPassPromptNow, false) // 29
assert.equal(result.canUseNetworkNow, false) // 30
assert.equal(result.canUseCredentialsNow, false) // 31
assert.equal(result.canCallModelsNow, false) // 32
assert.equal(result.canUseFindings, false) // 33
assert.equal(result.networkStatus, 'not_allowed') // 34
assert.equal(result.credentialsStatus, 'not_allowed') // 35
assert.equal(result.modelCallStatus, 'not_allowed') // 36
assert.equal(result.hermesExecutionStatus, 'not_executed') // 37
for (const action of ['run_research_now', 'execute_hermes_now', 'pass_prompt_now', 'use_network_now', 'access_credentials_now', 'call_models_now', 'execute_uv_now', 'execute_pip', 'execute_python_direct', 'execute_setup_py']) assert.ok(result.researchExecutionPlanningReceipt.notAuthorizedActions.includes(action)) // 38
assert.equal(result.status, 'manual_review_required') // 39
assert.equal(result.decision, 'hermes_research_execution_requires_manual_command_review') // 40
assert.equal(result.canProceedToResearchExecutionApproval, false) // 41
assert.ok(result.warnings.some((w) => w.warningId === 'manual_command_review_required')) // 42
assert.equal(result.hermesResearchExecutionPlanCandidate, undefined) // 43

const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, researchJefeReviewV2Result: review, helpProbeInspectionSummary: result.helpProbeInspectionSummary, sourceInspectionSummary: result.sourceInspectionSummary }
assert.equal(validateFactoryHermesResearchExecutionPlanningInput(input).ok, true) // 44
assert.equal(validateFactoryHermesResearchExecutionPlanningResult(result).ok, true) // 45
assert.equal(parseFactoryHermesResearchExecutionPlanningResult(serializeFactoryHermesResearchExecutionPlanningResult(result)).planningId, result.planningId) // 46
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|full stdout|full stderr|usage: hermes|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesResearchExecutionPlanningResult(result))), false) // 47
assert.equal(existsSync(paths.planningResult), true) // 48
assert.equal(evaluateFactoryHermesResearchExecutionPlanning({ plannedAt: result.plannedAt, plannedBy: result.plannedBy }).decision, 'blocked_missing_jefe_review_v2') // 49
assert.equal(evaluateFactoryHermesResearchExecutionPlanning({ ...input, researchJefeReviewV2Result: { ...review, canExecuteHermesNow: true } }).decision, 'blocked_unsafe_planning_input') // 50
assert.equal(sha256('package.json'), expectedPackageHash) // 51
assert.equal(sha256('package-lock.json'), expectedLockHash) // 52
assert.ok(/Manual command review|Research Execution Approval Gate/iu.test(result.recommendedNextStep) && !/execute Hermes now|run research now/iu.test(result.recommendedNextStep)) // 53

console.log(JSON.stringify({ ok: true, checks: 53, status: result.status, decision: result.decision, methodCandidates: result.methodCandidates.length, canProceedToResearchExecutionApproval: result.canProceedToResearchExecutionApproval, canRunResearchNow: result.canRunResearchNow, canExecuteHermesNow: result.canExecuteHermesNow, networkStatus: result.networkStatus, credentialsStatus: result.credentialsStatus, modelCallStatus: result.modelCallStatus }, null, 2))
