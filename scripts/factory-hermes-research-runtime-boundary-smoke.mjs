import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import boundaryRuntime from '../electron/factory/hermes-research-runtime-boundary/index.cjs'
import {
  evaluateFactoryHermesResearchRuntimeBoundary,
  parseFactoryHermesResearchRuntimeBoundaryResult,
  serializeFactoryHermesResearchRuntimeBoundaryResult,
  summarizeFactoryHermesResearchRuntimeBoundaryResult,
  validateFactoryHermesResearchRuntimeBoundaryInput,
  validateFactoryHermesResearchRuntimeBoundaryResult,
} from '../src/factory/hermes-research-runtime-boundary/index.ts'

const { executeFactoryHermesResearchRuntimeBoundary, resolveFactoryHermesResearchRuntimeBoundaryPaths } = boundaryRuntime
const paths = resolveFactoryHermesResearchRuntimeBoundaryPaths()
const selection = JSON.parse(readFileSync(paths.interfaceSelectionResult, 'utf8'))
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.interfaceSelectionResult), true) // 1
assert.ok(selection) // 2
assert.equal(selection.status, 'selected') // 3
assert.equal(selection.selectedCandidateId, 'pyproject-console-script-1') // 4
assert.equal(selection.selectedInterface.commandName, 'hermes') // 5
assert.equal(selection.selectedInterface.pythonEntrypoint, 'hermes_cli.main:main') // 6
const input = { boundedAt: '2026-07-21T18:00:00.000Z', boundedBy: 'factory-hermes-research-runtime-boundary-smoke', humanApprovalRef: 'human-review/hermes-research-runtime-boundary-v1', interfaceSelectionResult: selection }
const result = await executeFactoryHermesResearchRuntimeBoundary(input)
if (result.status !== 'boundary_contract_created') {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noHermes: true, noNetwork: true }, null, 2))
  process.exit(1)
}
const contract = result.hermesResearchRuntimeBoundaryContract
assert.equal(result.status, 'boundary_contract_created') // 7
assert.equal(result.decision, 'hermes_research_runtime_boundary_contract_created') // 8
assert.ok(result.researchRuntimeBoundaryReceipt) // 9
assert.ok(contract) // 10
assert.equal(result.researchRuntimeBoundaryReceipt.approvedNextGate, 'Factory Hermes Research Runtime Approval Gate v1') // 11
assert.equal(result.canProceedToResearchRuntimeApproval, true) // 12
assert.equal(result.canCreateRuntimeNow, false) // 13
assert.equal(result.canExecuteHermes, false) // 14
assert.equal(result.canRunHermesScripts, false) // 15
assert.equal(result.canUseNetwork, false) // 16
assert.equal(result.canUseCredentials, false) // 17
assert.equal(result.canCallModels, false) // 18
assert.equal(result.canMutateProjectFiles, false) // 19
assert.equal(result.canDeploy, false) // 20
assert.equal(contract.commandBoundary.commandsAllowedNow.length, 0) // 21
assert.equal(contract.commandBoundary.futureCommandCandidate.executableRef.endsWith('hermes.exe'), true) // 22
assert.equal(contract.commandBoundary.futureCommandCandidate.shell, false) // 23
assert.equal(contract.networkBoundary.networkAllowedNow, false) // 24
assert.equal(contract.credentialBoundary.credentialsAllowedNow, false) // 25
assert.equal(contract.modelBoundary.modelCallsAllowedNow, false) // 26
assert.equal(contract.safetyBoundary.killSwitchRequired, true) // 27
assert.equal(contract.safetyBoundary.timeoutRequired, true) // 28
assert.equal(contract.safetyBoundary.resultIngestionRequired, true) // 29
assert.equal(contract.safetyBoundary.jefeReviewRequired, true) // 30
for (const action of ['execute_hermes_now', 'execute_selected_interface_now', 'execute_python_now', 'execute_uv_now', 'execute_pip_now', 'execute_setup_py_now', 'call_models_now', 'access_credentials_now', 'use_network_now', 'create_runtime_now']) assert.ok(result.researchRuntimeBoundaryReceipt.notAuthorizedActions.includes(action)) // 31-40
assert.equal(evaluateFactoryHermesResearchRuntimeBoundary({ boundedAt: input.boundedAt, boundedBy: input.boundedBy }).decision, 'blocked_missing_interface_selection') // 41
assert.equal(evaluateFactoryHermesResearchRuntimeBoundary({ ...input, humanApprovalRef: undefined }).status, 'human_review_required') // 42
assert.equal(validateFactoryHermesResearchRuntimeBoundaryInput(input).ok, true) // 43
assert.equal(validateFactoryHermesResearchRuntimeBoundaryResult(result).ok, true) // 44
assert.equal(parseFactoryHermesResearchRuntimeBoundaryResult(serializeFactoryHermesResearchRuntimeBoundaryResult(result)).boundaryId, result.boundaryId) // 45
assert.equal(/full source|BEGIN|password|secret|api[_-]?key|bearer|raw log/iu.test(JSON.stringify(summarizeFactoryHermesResearchRuntimeBoundaryResult(result))), false) // 46
assert.equal(existsSync(paths.boundaryResult), true) // 47
assert.equal(sha256('package.json'), expectedPackageHash) // 48
assert.equal(sha256('package-lock.json'), expectedLockHash) // 49
assert.ok(/Research Runtime Approval Gate/iu.test(result.recommendedNextStep) && !/execute Hermes/iu.test(result.recommendedNextStep)) // 50

console.log(JSON.stringify({ ok: true, checks: 50, status: result.status, decision: result.decision, selectedCandidateId: result.selectedCandidateId, commandName: contract.commandName, canProceedToResearchRuntimeApproval: result.canProceedToResearchRuntimeApproval, canCreateRuntimeNow: result.canCreateRuntimeNow, canExecuteHermes: result.canExecuteHermes }, null, 2))
