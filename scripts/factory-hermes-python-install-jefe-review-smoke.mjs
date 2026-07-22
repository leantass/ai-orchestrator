import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { executeFactoryHermesPythonInstallJefeReview } from '../electron/factory/hermes-python-install-jefe-review/index.cjs'
import {
  evaluateFactoryHermesPythonInstallJefeReview,
  parseFactoryHermesPythonInstallJefeReviewResult,
  serializeFactoryHermesPythonInstallJefeReviewResult,
  summarizeFactoryHermesPythonInstallJefeReviewResult,
  validateFactoryHermesPythonInstallJefeReviewInput,
  validateFactoryHermesPythonInstallJefeReviewResult,
} from '../src/factory/hermes-python-install-jefe-review/index.ts'

const verificationPath = '.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-verification-result.json'
const reviewResultPath = '.codex-temp/external-tools/hermes-agent/install/75b300f/python-install-jefe-review-result.json'
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const verification = JSON.parse(readFileSync(verificationPath, 'utf8'))

assert.equal(existsSync(verificationPath), true) // 1
assert.ok(verification) // 2
assert.equal(verification.status, 'verified') // 3
assert.equal(verification.decision, 'hermes_python_install_verified') // 4
assert.equal(verification.canProceedToJefeReview, true) // 5
assert.equal(verification.canExecuteHermes, false) // 6

const input = { reviewedAt: '2026-07-21T15:30:00.000Z', reviewedBy: 'lean', reviewerRole: 'owner', humanApprovalRef: 'human-review/hermes-python-install-jefe-review-v1', pythonInstallVerificationResult: verification }
const evaluated = evaluateFactoryHermesPythonInstallJefeReview(input)
assert.equal(evaluated.status, 'approved') // 7
const result = await executeFactoryHermesPythonInstallJefeReview(input)
assert.ok(result.reviewReceipt) // 8
assert.ok(result.approvedHermesPythonInstallReadinessEnvelope) // 9
assert.equal(result.approvedHermesPythonInstallReadinessEnvelope.approvedNextGate, 'Factory Hermes Research Runtime Planning Gate v1') // 10
assert.equal(result.canProceedToResearchRuntimePlanning, true) // 11
assert.equal(result.canExecuteHermes, false) // 12
assert.equal(result.canRunHermesScripts, false) // 13
assert.equal(result.canUseCredentials, false) // 14
assert.equal(result.canCallModels, false) // 15
assert.equal(result.canMutateProjectFiles, false) // 16
assert.equal(result.canDeploy, false) // 17
for (const action of ['execute_hermes_now', 'run_hermes_scripts_now', 'call_models_now', 'access_credentials_now', 'execute_codex_now', 'execute_uv_run', 'execute_uv_pip', 'execute_pip', 'execute_python_direct', 'execute_setup_py', 'create_research_runtime_now']) assert.ok(result.reviewReceipt.notAuthorizedActions.includes(action)) // 18-28
assert.equal(evaluateFactoryHermesPythonInstallJefeReview({ reviewedAt: input.reviewedAt, reviewedBy: input.reviewedBy, humanApprovalRef: input.humanApprovalRef }).decision, 'blocked_missing_python_install_verification') // 29
assert.equal(evaluateFactoryHermesPythonInstallJefeReview({ ...input, pythonInstallVerificationResult: { ...verification, status: 'blocked' } }).decision, 'blocked_python_install_not_verified') // 30
assert.equal(evaluateFactoryHermesPythonInstallJefeReview({ ...input, pythonInstallVerificationResult: { ...verification, canExecuteHermes: true } }).decision, 'blocked_verification_allows_hermes_execution') // 31
assert.equal(evaluateFactoryHermesPythonInstallJefeReview({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 32
assert.equal(validateFactoryHermesPythonInstallJefeReviewInput(input).ok, true) // 33
assert.equal(validateFactoryHermesPythonInstallJefeReviewResult(result).ok, true) // 34
assert.equal(parseFactoryHermesPythonInstallJefeReviewResult(serializeFactoryHermesPythonInstallJefeReviewResult(result)).jefeReviewId, result.jefeReviewId) // 35
assert.equal(/secret|password|api[_-]?key|bearer|stdout|stderr/iu.test(JSON.stringify(summarizeFactoryHermesPythonInstallJefeReviewResult(result))), false) // 36
assert.equal(existsSync(reviewResultPath), true) // 37
assert.equal(sha256('package.json'), expectedPackageHash) // 38
assert.equal(sha256('package-lock.json'), expectedLockHash) // 39
assert.ok(/Research Runtime Planning Gate/iu.test(result.recommendedNextStep) && !/execute Hermes/iu.test(result.recommendedNextStep)) // 40

console.log(JSON.stringify({ ok: true, checks: 40, status: result.status, decision: result.decision, verificationStatus: result.verificationStatus, canProceedToResearchRuntimePlanning: result.canProceedToResearchRuntimePlanning, canExecuteHermes: result.canExecuteHermes, approvedNextGate: result.approvedHermesPythonInstallReadinessEnvelope.approvedNextGate }, null, 2))
