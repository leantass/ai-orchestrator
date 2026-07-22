import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import approvalRuntime from '../electron/factory/hermes-research-runtime-approval/index.cjs'
import { evaluateFactoryHermesResearchRuntimeApproval, parseFactoryHermesResearchRuntimeApprovalResult, serializeFactoryHermesResearchRuntimeApprovalResult, summarizeFactoryHermesResearchRuntimeApprovalResult, validateFactoryHermesResearchRuntimeApprovalInput, validateFactoryHermesResearchRuntimeApprovalResult } from '../src/factory/hermes-research-runtime-approval/index.ts'

const { executeFactoryHermesResearchRuntimeApproval, resolveFactoryHermesResearchRuntimeApprovalPaths } = approvalRuntime
const paths = resolveFactoryHermesResearchRuntimeApprovalPaths()
const boundary = JSON.parse(readFileSync(paths.boundaryResult, 'utf8'))
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.boundaryResult), true) // 1
assert.ok(boundary) // 2
assert.equal(boundary.status, 'boundary_contract_created') // 3
assert.equal(boundary.canProceedToResearchRuntimeApproval, true) // 4
assert.equal(boundary.canCreateRuntimeNow, false) // 5
assert.equal(boundary.canExecuteHermes, false) // 6
assert.equal(boundary.hermesResearchRuntimeBoundaryContract.networkBoundary.networkAllowedNow, false) // 7
assert.equal(boundary.hermesResearchRuntimeBoundaryContract.credentialBoundary.credentialsAllowedNow, false) // 8
assert.equal(boundary.hermesResearchRuntimeBoundaryContract.modelBoundary.modelCallsAllowedNow, false) // 9
assert.equal(boundary.hermesResearchRuntimeBoundaryContract.commandBoundary.commandsAllowedNow.length, 0) // 10
assert.equal(boundary.hermesResearchRuntimeBoundaryContract.commandBoundary.futureCommandCandidate.shell, false) // 11
const input = { approvedAt: '2026-07-21T19:00:00.000Z', approvedBy: 'factory-hermes-research-runtime-approval-smoke', humanApprovalRef: 'human-review/hermes-research-runtime-approval-v1', boundaryResult: boundary }
const result = await executeFactoryHermesResearchRuntimeApproval(input)
if (result.status !== 'approved_for_adapter_candidate') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true, noNetwork: true }, null, 2)); process.exit(1) }
const env = result.approvedHermesResearchRuntimeAdapterEnvelope
const summary = summarizeFactoryHermesResearchRuntimeApprovalResult(result)
assert.equal(result.status, 'approved_for_adapter_candidate') // 13
assert.equal(result.decision, 'hermes_research_runtime_approved_for_adapter_candidate') // 14
assert.ok(result.researchRuntimeApprovalReceipt) // 15
assert.ok(env) // 16
assert.equal(env.approvedNextGate, 'Factory Hermes Research Runtime Adapter v1') // 17
assert.equal(result.canProceedToResearchRuntimeAdapter, true) // 18
assert.equal(result.canCreateRuntimeNow, false) // 19
assert.equal(result.canExecuteHermesNow, false) // 20
assert.equal(result.canExecuteHermesOutsideAdapter, false) // 21
assert.equal(result.canRunHermesScripts, false) // 22
assert.equal(result.canUseNetworkNow, false) // 23
assert.equal(result.canUseCredentialsNow, false) // 24
assert.equal(result.canCallModelsNow, false) // 25
assert.equal(result.canMutateProjectFiles, false) // 26
assert.equal(result.canDeploy, false) // 27
assert.equal(env.executionAuthorizationScope, 'future_runtime_adapter_only') // 28
assert.equal(env.directExecutionNow, false) // 29
assert.equal(env.futureRuntimeCanExecuteSelectedInterfaceUnderBoundary, true) // 30
assert.equal(env.futureRuntimeNetworkAllowed, false) // 31
assert.equal(env.futureRuntimeCredentialsAllowed, false) // 32
assert.equal(env.futureRuntimeModelCallsAllowed, false) // 33
assert.equal(result.selectedCandidateId, 'pyproject-console-script-1') // 34
assert.equal(result.commandName, 'hermes') // 35
assert.equal(result.pythonEntrypoint, 'hermes_cli.main:main') // 36
assert.equal(env.selectedInterface.commandName, 'hermes') // 37
assert.equal(env.selectedInterface.pythonEntrypoint, 'hermes_cli.main:main') // 38
assert.ok(env.selectedInterface.futureExecutableCandidateWindows.endsWith('python-env/Scripts/hermes.exe')) // 39
assert.equal(summary.commandName, 'hermes') // 40
assert.equal(summary.pythonEntrypoint, 'hermes_cli.main:main') // 41
assert.equal(JSON.stringify({ resultCommandName: result.commandName, envelopeCommandName: env.selectedInterface.commandName, summaryCommandName: summary.commandName }).includes('null'), false) // 42
assert.ok(/Research Runtime Adapter/iu.test(result.recommendedNextStep)) // 43
for (const control of ['shell:false', 'timeout', 'killSwitch', 'result ingestion']) assert.ok(env.requiredAdapterControls.includes(control)) // 34-37
for (const action of ['execute_hermes_now', 'execute_hermes_outside_adapter', 'create_runtime_in_this_gate', 'execute_python_now', 'execute_uv_now', 'execute_pip_now', 'execute_setup_py_now', 'use_network_now', 'call_models_now', 'access_credentials_now']) assert.ok(result.researchRuntimeApprovalReceipt.notAuthorizedActions.includes(action)) // 38-47
assert.equal(evaluateFactoryHermesResearchRuntimeApproval({ approvedAt: input.approvedAt, approvedBy: input.approvedBy }).decision, 'blocked_missing_boundary_contract') // 48
assert.equal(evaluateFactoryHermesResearchRuntimeApproval({ ...input, boundaryResult: { ...boundary, canExecuteHermes: true } }).decision, 'blocked_boundary_allows_execution_now') // 49
assert.equal(evaluateFactoryHermesResearchRuntimeApproval({ ...input, boundaryResult: { ...boundary, canUseNetwork: true } }).decision, 'blocked_boundary_allows_network_now') // 50
assert.equal(evaluateFactoryHermesResearchRuntimeApproval({ ...input, boundaryResult: { ...boundary, canUseCredentials: true } }).decision, 'blocked_boundary_allows_credentials_now') // 51
assert.equal(evaluateFactoryHermesResearchRuntimeApproval({ ...input, boundaryResult: { ...boundary, canCallModels: true } }).decision, 'blocked_boundary_allows_model_calls_now') // 52
assert.equal(evaluateFactoryHermesResearchRuntimeApproval({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 53
assert.equal(validateFactoryHermesResearchRuntimeApprovalInput(input).ok, true) // 54
assert.equal(validateFactoryHermesResearchRuntimeApprovalResult(result).ok, true) // 55
assert.equal(parseFactoryHermesResearchRuntimeApprovalResult(serializeFactoryHermesResearchRuntimeApprovalResult(result)).approvalId, result.approvalId) // 56
assert.equal(/full source|BEGIN|password|secret|api[_-]?key|bearer|raw log/iu.test(JSON.stringify(summary)), false) // 57
assert.equal(existsSync(paths.approvalResult), true) // 58
assert.equal(sha256('package.json'), expectedPackageHash) // 59
assert.equal(sha256('package-lock.json'), expectedLockHash) // 60
assert.ok(/Research Runtime Adapter/iu.test(result.recommendedNextStep) && !/execute Hermes/iu.test(result.recommendedNextStep)) // 61
assert.ok(result) // 12
console.log(JSON.stringify({ ok: true, checks: 70, status: result.status, decision: result.decision, selectedCandidateId: result.selectedCandidateId, commandName: result.commandName, pythonEntrypoint: result.pythonEntrypoint, canProceedToResearchRuntimeAdapter: result.canProceedToResearchRuntimeAdapter, canCreateRuntimeNow: result.canCreateRuntimeNow, canExecuteHermesNow: result.canExecuteHermesNow }, null, 2))
