import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-entrypoint-materialization-approval/index.cjs'
import { evaluateFactoryHermesEntrypointMaterializationApproval, parseFactoryHermesEntrypointMaterializationApprovalResult, serializeFactoryHermesEntrypointMaterializationApprovalResult, summarizeFactoryHermesEntrypointMaterializationApprovalResult, validateFactoryHermesEntrypointMaterializationApprovalInput, validateFactoryHermesEntrypointMaterializationApprovalResult } from '../src/factory/hermes-entrypoint-materialization-approval/index.ts'

const { resolveFactoryHermesEntrypointMaterializationApprovalPaths, executeFactoryHermesEntrypointMaterializationApproval } = runtime
const paths = resolveFactoryHermesEntrypointMaterializationApprovalPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.planningResult), true) // 1
const planning = JSON.parse(readFileSync(paths.planningResult, 'utf8'))
assert.ok(planning) // 2
assert.equal(planning.status, 'plan_candidate_created') // 3
assert.equal(planning.selectedMethodCandidate.methodId, 'uv_sync_install_project_locked_existing_env') // 4
assert.equal(planning.hermesEntrypointMaterializationPlanCandidate.setupPyPresent, true) // 5
assert.equal(planning.hermesEntrypointMaterializationPlanCandidate.buildSystemSummary.buildBackend, 'setuptools.build_meta') // 6

const input = {
  approvedAt: '2026-07-21T23:30:00.000Z',
  approvedBy: 'factory-hermes-entrypoint-materialization-approval-smoke',
  humanApprovalRef: 'human-review/hermes-entrypoint-materialization-approval-v1',
  riskAcceptanceNotes: 'Accept setuptools.build_meta/setup.py presence only for future uv sync project install under envelope; setup.py direct execution remains forbidden.',
  materializationPlanningResult: planning,
}
const result = await executeFactoryHermesEntrypointMaterializationApproval(input)
const envelope = result.approvedEntrypointMaterializationRuntimeEnvelope
const receipt = result.approvalReceipt
assert.equal(result.status, 'approved_for_runtime_candidate') // 7-8
assert.equal(result.decision, 'hermes_entrypoint_materialization_approved_for_runtime_candidate') // 9
assert.ok(receipt) // 10
assert.ok(envelope) // 11
assert.equal(envelope.commandName, 'hermes') // 12
assert.equal(envelope.pythonEntrypoint, 'hermes_cli.main:main') // 13
assert.ok(envelope.expectedExecutableRef.endsWith('python-env/Scripts/hermes.exe')) // 14
assert.equal(envelope.uvExecutableRef, '.codex-temp/external-tools/uv/bin/uv.exe') // 15
assert.equal(envelope.approvedRuntimeCommand.executableRef, '.codex-temp/external-tools/uv/bin/uv.exe') // 16
for (const arg of ['sync', '--locked', '--no-dev', '--project']) assert.ok(envelope.approvedRuntimeCommand.args.includes(arg)) // 17-20
assert.equal(envelope.approvedRuntimeCommand.args.includes('--no-install-project'), false) // 21
assert.equal(envelope.approvedRuntimeCommand.shell, false) // 22
assert.equal(envelope.approvedEnvPolicy.sanitized, true) // 23
assert.equal(envelope.buildRiskAcceptance.setupPyPresent, true) // 24
assert.equal(envelope.buildRiskAcceptance.setupPyDirectExecutionAllowed, false) // 25
assert.equal(envelope.materializationAllowedNow, false) // 26
assert.equal(envelope.futureRuntimeMayMaterializeEntrypointUnderEnvelope, true) // 27
assert.equal(envelope.adapterRetryAllowedNow, false) // 28
assert.equal(envelope.hermesExecutionAllowedNow, false) // 29
assert.equal(envelope.networkAllowedNow, false) // 30
assert.equal(envelope.credentialsAllowedNow, false) // 31
assert.equal(envelope.modelCallsAllowedNow, false) // 32
assert.equal(result.canProceedToEntrypointMaterializationRuntime, true) // 33
assert.equal(result.canMaterializeEntrypointNow, false) // 34
assert.equal(result.canRetryAdapterNow, false) // 35
assert.equal(result.canExecuteHermes, false) // 36
assert.equal(result.canUseNetwork, false) // 37
assert.equal(result.canUseCredentials, false) // 38
assert.equal(result.canCallModels, false) // 39
for (const action of ['pip', 'python direct', 'setup.py direct', 'hermes execution']) assert.ok(envelope.forbiddenActions.includes(action)) // 40-43
for (const action of ['materialize_entrypoint_now', 'execute_uv_sync_now', 'execute_hermes_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 44-46
assert.equal(evaluateFactoryHermesEntrypointMaterializationApproval({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 47
assert.equal(evaluateFactoryHermesEntrypointMaterializationApproval({ ...input, riskAcceptanceNotes: undefined }).status, 'manual_review_required') // 48
const unsafePlanning = structuredClone(planning)
unsafePlanning.selectedMethodCandidate = { methodId: 'pip_install_project', usesPip: true, usesSetupPyDirectly: false, usesUv: false }
unsafePlanning.hermesEntrypointMaterializationPlanCandidate.selectedMethodCandidate = unsafePlanning.selectedMethodCandidate
assert.equal(evaluateFactoryHermesEntrypointMaterializationApproval({ ...input, materializationPlanningResult: unsafePlanning }).decision, 'blocked_unsafe_materialization_method') // 49
assert.equal(validateFactoryHermesEntrypointMaterializationApprovalInput(input).ok, true) // 50
assert.equal(validateFactoryHermesEntrypointMaterializationApprovalResult(result).ok, true) // 51
assert.equal(parseFactoryHermesEntrypointMaterializationApprovalResult(serializeFactoryHermesEntrypointMaterializationApprovalResult(result)).approvalId, result.approvalId) // 52
assert.equal(/full pyproject|uv\.lock|setup\.py content|BEGIN|password|secret|api[_-]?key|bearer/iu.test(JSON.stringify(summarizeFactoryHermesEntrypointMaterializationApprovalResult(result))), false) // 53
assert.equal(existsSync(paths.approvalResult), true) // 54
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 55
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 56
assert.ok(/Entrypoint Materialization Runtime Adapter/iu.test(result.recommendedNextStep) && !/materialize now|execute hermes|run uv now/iu.test(result.recommendedNextStep)) // 57

console.log(JSON.stringify({ ok: true, checks: 57, status: result.status, decision: result.decision, selectedMethodCandidate: result.selectedMethodCandidate, commandName: envelope.commandName, pythonEntrypoint: envelope.pythonEntrypoint, canProceedToEntrypointMaterializationRuntime: result.canProceedToEntrypointMaterializationRuntime, canMaterializeEntrypointNow: result.canMaterializeEntrypointNow, canRetryAdapterNow: result.canRetryAdapterNow }, null, 2))
