import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-entrypoint-materialization-planning/index.cjs'
import { parseFactoryHermesEntrypointMaterializationPlanningResult, serializeFactoryHermesEntrypointMaterializationPlanningResult, summarizeFactoryHermesEntrypointMaterializationPlanningResult, validateFactoryHermesEntrypointMaterializationPlanningInput, validateFactoryHermesEntrypointMaterializationPlanningResult } from '../src/factory/hermes-entrypoint-materialization-planning/index.ts'
const { resolveFactoryHermesEntrypointMaterializationPlanningPaths, inspectHermesEntrypointMaterializationSource, executeFactoryHermesEntrypointMaterializationPlanning } = runtime
const paths = resolveFactoryHermesEntrypointMaterializationPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.jefeReviewResult), true) // 1
const review = JSON.parse(readFileSync(paths.jefeReviewResult, 'utf8'))
assert.ok(review) // 2
assert.equal(review.status, 'approved_for_entrypoint_materialization_planning') // 3
assert.equal(existsSync(paths.sourceRoot), true) // 4
assert.equal(existsSync(paths.pyproject), true) // 5
const sourceInspection = inspectHermesEntrypointMaterializationSource(paths)
assert.equal(sourceInspection.projectScripts.hermes, 'hermes_cli.main:main') // 6
assert.equal(review.pythonEntrypoint, 'hermes_cli.main:main') // 7
assert.ok(review.approvedEntrypointMaterializationPlanningEnvelope.missingExecutableRef.endsWith('python-env/Scripts/hermes.exe')) // 8
assert.ok(review.approvedEntrypointMaterializationPlanningEnvelope.currentInstallMethod.includes('--no-install-project')) // 9
assert.ok(sourceInspection) // 10
const input = { plannedAt: '2026-07-21T23:00:00.000Z', plannedBy: 'factory-hermes-entrypoint-materialization-planning-smoke', researchJefeReviewResult: review, sourceInspection }
const result = await executeFactoryHermesEntrypointMaterializationPlanning(input)
const ids = result.methodCandidates.map((m) => m.methodId)
assert.ok(ids.includes('uv_sync_install_project_locked_existing_env')) // 11
assert.ok(ids.includes('direct_python_module_boundary_revision')) // 12
assert.ok(ids.includes('manual_wrapper_generation')) // 13
assert.equal(result.methodCandidates.find((m) => m.methodId === 'pip_install_project')?.status, 'forbidden') // 14
assert.equal(result.methodCandidates.find((m) => m.methodId === 'setup_py_install')?.status, 'forbidden') // 15
assert.equal(result.selectedMethodCandidate?.usesPip, false) // 16
assert.equal(result.selectedMethodCandidate?.usesSetupPyDirectly, false) // 17
assert.ok(['plan_candidate_created', 'manual_review_required'].includes(result.status)) // 18
if (result.status === 'plan_candidate_created') assert.ok(result.entrypointMaterializationPlanningReceipt) // 19
if (result.status === 'plan_candidate_created') assert.ok(result.hermesEntrypointMaterializationPlanCandidate) // 20
if (result.status === 'plan_candidate_created') assert.equal(result.canProceedToEntrypointMaterializationApproval, true) // 21
assert.equal(result.canMaterializeEntrypointNow, false) // 22
assert.equal(result.canRetryAdapterNow, false) // 23
assert.equal(result.canExecuteHermes, false) // 24
assert.equal(result.canRunHermesScripts, false) // 25
assert.equal(result.canUseNetwork, false) // 26
assert.equal(result.canUseCredentials, false) // 27
assert.equal(result.canCallModels, false) // 28
assert.equal(result.canMutateProjectFiles, false) // 29
assert.equal(result.canDeploy, false) // 30
for (const action of ['materialize_entrypoint_now', 'install_project_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'execute_hermes_now']) assert.ok(result.entrypointMaterializationPlanningReceipt.notAuthorizedActions.includes(action)) // 31-38
assert.equal(validateFactoryHermesEntrypointMaterializationPlanningInput(input).ok, true) // 39
assert.equal(validateFactoryHermesEntrypointMaterializationPlanningResult(result).ok, true) // 40
assert.equal(parseFactoryHermesEntrypointMaterializationPlanningResult(serializeFactoryHermesEntrypointMaterializationPlanningResult(result)).planningId, result.planningId) // 41
assert.equal(/full pyproject|uv\.lock|setup\.py|BEGIN|password|secret|api[_-]?key|bearer/iu.test(JSON.stringify(summarizeFactoryHermesEntrypointMaterializationPlanningResult(result))), false) // 42
assert.equal(existsSync(paths.planningResult), true) // 43
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 44
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 45
assert.ok(/Entrypoint Materialization Approval Gate/iu.test(result.recommendedNextStep) && !/runtime directo|run uv now/iu.test(result.recommendedNextStep)) // 46
console.log(JSON.stringify({ ok: true, checks: 46, status: result.status, decision: result.decision, selectedMethodCandidate: result.selectedMethodCandidate?.methodId, setupPyPresent: sourceInspection.setupPyPresent, canProceedToEntrypointMaterializationApproval: result.canProceedToEntrypointMaterializationApproval, canMaterializeEntrypointNow: result.canMaterializeEntrypointNow }, null, 2))
