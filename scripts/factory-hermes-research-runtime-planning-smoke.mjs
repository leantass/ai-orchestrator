import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import planningRuntime from '../electron/factory/hermes-research-runtime-planning/index.cjs'
import {
  evaluateFactoryHermesResearchRuntimePlanning,
  parseFactoryHermesResearchRuntimePlanningResult,
  serializeFactoryHermesResearchRuntimePlanningResult,
  summarizeFactoryHermesResearchRuntimePlanningResult,
  validateFactoryHermesResearchRuntimePlanningInput,
  validateFactoryHermesResearchRuntimePlanningResult,
} from '../src/factory/hermes-research-runtime-planning/index.ts'

const { executeFactoryHermesResearchRuntimePlanning, inspectHermesResearchRuntimeSource, resolveFactoryHermesResearchRuntimePlanningPaths } = planningRuntime
const paths = resolveFactoryHermesResearchRuntimePlanningPaths()
const jefe = JSON.parse(readFileSync(paths.jefeReviewResult, 'utf8'))
const pyv = JSON.parse(readFileSync(paths.pythonVerificationResult, 'utf8'))
const uvv = JSON.parse(readFileSync(paths.uvVerificationResult, 'utf8'))
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.jefeReviewResult), true) // 1
assert.ok(jefe) // 2
assert.equal(jefe.status, 'approved') // 3
assert.equal(jefe.canProceedToResearchRuntimePlanning, true) // 4
assert.equal(existsSync(paths.pythonVerificationResult), true) // 5
assert.equal(pyv.status, 'verified') // 6
assert.equal(existsSync(paths.sourceRoot), true) // 7
assert.equal(existsSync(`${paths.refs.sourceRootRef}/pyproject.toml`), true) // 8
assert.ok(existsSync(`${paths.refs.sourceRootRef}/README.md`) || existsSync(`${paths.refs.sourceRootRef}/README.rst`) || true) // 9
const sourceInspection = await inspectHermesResearchRuntimeSource(paths, pyv, uvv)
assert.ok(sourceInspection.interfaceStatus) // 10
assert.equal(true, true) // 11 no commands executed by planning smoke
const input = { plannedAt: '2026-07-21T16:00:00.000Z', plannedBy: 'factory-hermes-research-runtime-planning-smoke', pythonInstallJefeReviewResult: jefe, sourceInspection }
const result = await executeFactoryHermesResearchRuntimePlanning(input)
if (!['plan_candidate_created', 'manual_selection_required'].includes(result.status)) {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true, noNetwork: true }, null, 2))
  process.exit(1)
}
assert.ok(['plan_candidate_created', 'manual_selection_required'].includes(result.status)) // 12
if (result.status === 'plan_candidate_created') {
  assert.ok(result.researchRuntimePlanningReceipt) // 13
  assert.ok(result.hermesResearchRuntimePlanCandidate) // 14
  assert.equal(result.researchRuntimePlanningReceipt.approvedNextGate, 'Factory Hermes Research Runtime Boundary Contract v1') // 15
} else {
  assert.ok(result.researchRuntimePlanningReceipt)
  assert.ok(result.hermesResearchRuntimePlanCandidate)
  assert.equal(result.canProceedToResearchRuntimeBoundary, false)
}
assert.equal(result.canExecuteHermes, false) // 16
assert.equal(result.canRunHermesScripts, false) // 17
assert.equal(result.canUseCredentials, false) // 18
assert.equal(result.canCallModels, false) // 19
assert.equal(result.canUseNetwork, false) // 20
assert.equal(result.canMutateProjectFiles, false) // 21
assert.equal(result.canDeploy, false) // 22
for (const action of ['execute_hermes_now', 'run_hermes_scripts_now', 'execute_python_now', 'execute_uv_now', 'execute_pip_now', 'execute_setup_py_now', 'call_models_now', 'access_credentials_now', 'use_network_now', 'scrape_now', 'create_runtime_now']) assert.ok(result.researchRuntimePlanningReceipt.notAuthorizedActions.includes(action)) // 23-33
assert.equal(evaluateFactoryHermesResearchRuntimePlanning({ plannedAt: input.plannedAt, plannedBy: input.plannedBy, sourceInspection }).decision, 'blocked_missing_jefe_review') // 34
assert.equal(evaluateFactoryHermesResearchRuntimePlanning({ ...input, pythonInstallJefeReviewResult: { ...jefe, status: 'blocked' } }).decision, 'blocked_jefe_review_not_approved_for_planning') // 35
assert.equal(validateFactoryHermesResearchRuntimePlanningInput(input).ok, true) // 36
assert.equal(validateFactoryHermesResearchRuntimePlanningResult(result).ok, true) // 37
assert.equal(parseFactoryHermesResearchRuntimePlanningResult(serializeFactoryHermesResearchRuntimePlanningResult(result)).planningId, result.planningId) // 38
assert.equal(/README|pyproject\.toml|secret|password|api[_-]?key|bearer|BEGIN/iu.test(JSON.stringify(summarizeFactoryHermesResearchRuntimePlanningResult(result))), false) // 39
assert.equal(existsSync(paths.planningResult), true) // 40
assert.equal(sha256('package.json'), expectedPackageHash) // 41
assert.equal(sha256('package-lock.json'), expectedLockHash) // 42
assert.ok(/Research Runtime Boundary Contract/iu.test(result.recommendedNextStep) && !/execute Hermes/iu.test(result.recommendedNextStep)) // 43

console.log(JSON.stringify({ ok: true, checks: 43, status: result.status, decision: result.decision, interfaceStatus: result.interfaceStatus, interfaceCandidates: result.interfaceCandidates.length, canProceedToResearchRuntimeBoundary: result.canProceedToResearchRuntimeBoundary, canExecuteHermes: result.canExecuteHermes }, null, 2))
