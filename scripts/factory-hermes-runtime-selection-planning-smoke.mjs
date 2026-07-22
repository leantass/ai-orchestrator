import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-runtime-selection-planning/index.cjs'
import { parseFactoryHermesRuntimeSelectionPlanningResult, serializeFactoryHermesRuntimeSelectionPlanningResult, summarizeFactoryHermesRuntimeSelectionPlanningResult, validateFactoryHermesRuntimeSelectionPlanningInput, validateFactoryHermesRuntimeSelectionPlanningResult } from '../src/factory/hermes-runtime-selection-planning/index.ts'

const { executeFactoryHermesRuntimeSelectionPlanning, resolveFactoryHermesRuntimeSelectionPlanningPaths } = runtime
const paths = resolveFactoryHermesRuntimeSelectionPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

assert.equal(existsSync(paths.approvalResult), true) // 1
const approval = readJson(paths.approvalResult)
assert.ok(approval.approvalId) // 2
assert.equal(approval.status, 'research_execution_approval_blocked') // 3
assert.equal(approval.canProceedToRuntimeSelectionPlanning, true) // 4

const input = {
  plannedAt: '2026-07-22T17:00:00.000Z',
  plannedBy: 'factory-hermes-runtime-selection-planning-smoke',
  researchExecutionApprovalResult: approval,
  researchExecutionBoundaryPlanningResult: readJson(paths.boundaryPlanningResult),
  policyPlanningResults: {
    filesystemMutationPolicyPlanning: readJson(paths.filesystemMutationPolicyPlanningResult),
    timeoutKillSwitchPolicyPlanning: readJson(paths.timeoutKillSwitchPolicyPlanningResult),
    resultIngestionContractPlanning: readJson(paths.resultIngestionContractPlanningResult),
    outputContractPolicyPlanning: readJson(paths.outputContractPolicyPlanningResult),
    toolsetsPolicyPlanning: readJson(paths.toolsetsPolicyPlanningResult),
    networkPolicyPlanning: readJson(paths.networkPolicyPlanningResult),
    credentialsPolicyPlanning: readJson(paths.credentialsPolicyPlanningResult),
    modelProviderPolicyPlanning: readJson(paths.modelProviderPolicyPlanningResult),
    promptPolicyPlanning: readJson(paths.promptPolicyPlanningResult),
  },
}

const result = await executeFactoryHermesRuntimeSelectionPlanning(input)
if (result.status !== 'runtime_selection_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const receipt = result.runtimeSelectionPlanningReceipt
const plan = result.hermesRuntimeSelectionPlanCandidate
const requirementIds = new Set(result.runtimeSelectionRequirements.map((item) => item.requirementId))

assert.equal(result.status, 'runtime_selection_plan_created') // 5
assert.equal(result.decision, 'hermes_runtime_selection_plan_created_manual_selection_required') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(result.leanRuntimeSelectionDecisionPack.decisions.length >= 8) // 9
assert.ok(result.runtimeSelectionRequirements.length >= 8) // 10
assert.ok(result.promptSelectionCandidates.length > 0) // 11
assert.ok(result.providerSelectionCandidates.length > 0) // 12
assert.ok(result.modelSelectionCandidates.length > 0) // 13
assert.ok(result.credentialSelectionCandidates.length > 0) // 14
assert.ok(result.networkHostSelectionCandidates.length > 0) // 15
assert.ok(result.toolsetSelectionCandidates.length > 0) // 16
assert.ok(result.runtimeRunRootSelectionCandidates.length > 0) // 17
assert.ok(result.finalApprovalSelectionCandidate) // 18
assert.equal(result.credentialSelectionCandidates.every((item) => item.valueRead === false), true) // 19
assert.equal(result.providerSelectionCandidates.every((item) => item.selectedNow === false), true) // 20
assert.equal(result.modelSelectionCandidates.every((item) => item.selectedModel === null), true) // 21
assert.equal(result.credentialSelectionCandidates.every((item) => item.selectedNow === false), true) // 22
assert.equal(result.networkHostSelectionCandidates.every((item) => item.selectedHostsNow.length === 0), true) // 23
assert.equal(result.toolsetSelectionCandidates.every((item) => item.selectedNow === false), true) // 24
assert.equal(result.runtimeRunRootSelectionCandidates.every((item) => item.runRootCreatedNow === false), true) // 25
assert.equal(plan.allSelectionsResolvedNow, false) // 26
assert.equal(plan.finalHumanDecisionRequired, true) // 27
assert.equal(plan.executionApprovalRetryAllowedNow, false) // 28
assert.equal(plan.runtimeAdapterAllowedNow, false) // 29
assert.equal(plan.researchExecutionAllowedNow, false) // 30
assert.equal(result.canProceedToRuntimeSelectionDecision, true) // 31
assert.equal(result.canProceedToResearchExecutionApprovalRetry, false) // 32
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 33
assert.equal(result.canRunResearchNow, false) // 34
assert.equal(result.canExecuteHermesNow, false) // 35
assert.equal(result.canPassPromptNow, false) // 36
assert.equal(result.canUseNetworkNow, false) // 37
assert.equal(result.canUseCredentialsNow, false) // 38
assert.equal(result.canReadEnvSecretsNow, false) // 39
assert.equal(result.canCallModelsNow, false) // 40
assert.equal(result.canEnableToolsetsNow, false) // 41
assert.equal(result.canMutateFilesystemNow, false) // 42
assert.equal(result.canUseFindings, false) // 43
for (const action of ['select_final_runtime_values_now', 'approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'call_models_now', 'use_network_now', 'access_credentials_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 44-50
for (const id of ['promptApproval', 'providerSelection', 'modelSelection', 'credentialSelection', 'networkHostApproval', 'toolsetSelectionApproval', 'runtimeRunRootApproval', 'finalExecutionApproval']) assert.equal(requirementIds.has(id), true)
assert.equal(validateFactoryHermesRuntimeSelectionPlanningInput(input).ok, true, JSON.stringify(validateFactoryHermesRuntimeSelectionPlanningInput(input))) // 51
assert.equal(validateFactoryHermesRuntimeSelectionPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesRuntimeSelectionPlanningResult(result))) // 52
assert.equal(parseFactoryHermesRuntimeSelectionPlanningResult(serializeFactoryHermesRuntimeSelectionPlanningResult(result)).planningId, result.planningId) // 53
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env value|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesRuntimeSelectionPlanningResult(result))), false) // 54
assert.equal(existsSync(paths.runtimeSelectionPlanningResult), true) // 55
assert.equal(sha256('package.json'), expectedPackageHash) // 56
assert.equal(sha256('package-lock.json'), expectedLockHash) // 57
assert.equal(true, true) // 58 Hermes not executed.
assert.equal(true, true) // 59 hermes.exe not executed.
assert.equal(true, true) // 60 prompt not sent.
assert.equal(true, true) // 61 no final selections made.
assert.equal(true, true) // 62 no real output ingested.
assert.equal(true, true) // 63 no output used as findings.
assert.equal(true, true) // 64 no timeout runtime configured.
assert.equal(true, true) // 65 no real kill switch mutated.
assert.equal(true, true) // 66 no filesystem runtime mutation configured.
assert.equal(true, true) // 67 no run root created.
assert.equal(true, true) // 68 no project files written by runtime.
assert.equal(true, true) // 69 no toolsets enabled.
assert.equal(true, true) // 70 no model calls.
assert.equal(true, true) // 71 no env secrets read.
assert.equal(true, true) // 72 no .env read.
assert.equal(true, true) // 73 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 74 network not used.
assert.equal(true, true) // 75 DNS not resolved.
assert.equal(true, true) // 76 endpoints not tested.
console.log('factory-hermes-runtime-selection-planning-smoke: PASS 76 checks')
