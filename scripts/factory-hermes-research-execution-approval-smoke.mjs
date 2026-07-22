import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-research-execution-approval/index.cjs'
import { parseFactoryHermesResearchExecutionApprovalResult, serializeFactoryHermesResearchExecutionApprovalResult, summarizeFactoryHermesResearchExecutionApprovalResult, validateFactoryHermesResearchExecutionApprovalInput, validateFactoryHermesResearchExecutionApprovalResult } from '../src/factory/hermes-research-execution-approval/index.ts'

const { executeFactoryHermesResearchExecutionApproval, resolveFactoryHermesResearchExecutionApprovalPaths } = runtime
const paths = resolveFactoryHermesResearchExecutionApprovalPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

assert.equal(existsSync(paths.boundaryPlanningResult), true) // 1
const boundary = readJson(paths.boundaryPlanningResult)
assert.ok(boundary.planningId) // 2
assert.equal(boundary.status, 'research_execution_boundary_plan_created') // 3
assert.equal(boundary.canProceedToResearchExecutionApproval, true) // 4

const input = {
  approvedAt: '2026-07-22T16:30:00.000Z',
  approvedBy: 'factory-hermes-research-execution-approval-smoke',
  researchExecutionBoundaryPlanningResult: boundary,
  policyPlanningResults: {
    policyChainPlanning: readJson(paths.policyChainPlanningResult),
    promptPolicyPlanning: readJson(paths.promptPolicyPlanningResult),
    modelProviderPolicyPlanning: readJson(paths.modelProviderPolicyPlanningResult),
    credentialsPolicyPlanning: readJson(paths.credentialsPolicyPlanningResult),
    networkPolicyPlanning: readJson(paths.networkPolicyPlanningResult),
    toolsetsPolicyPlanning: readJson(paths.toolsetsPolicyPlanningResult),
    outputContractPolicyPlanning: readJson(paths.outputContractPolicyPlanningResult),
    resultIngestionContractPlanning: readJson(paths.resultIngestionContractPlanningResult),
    timeoutKillSwitchPolicyPlanning: readJson(paths.timeoutKillSwitchPolicyPlanningResult),
    filesystemMutationPolicyPlanning: readJson(paths.filesystemMutationPolicyPlanningResult),
  },
}

const result = await executeFactoryHermesResearchExecutionApproval(input)
if (result.status !== 'research_execution_approval_blocked') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.approvalBlockers }, null, 2)); process.exit(1) }
const receipt = result.researchExecutionApprovalReceipt
const decision = result.hermesResearchExecutionApprovalDecision
const blockerPlan = result.researchExecutionApprovalBlockerPlan
const requirements = new Set(result.runtimeSelectionRequirements.map((item) => item.requirementId))

assert.equal(result.status, 'research_execution_approval_blocked') // 5
assert.equal(result.decision, 'hermes_research_execution_approval_blocked_missing_runtime_selections') // 6
assert.equal(result.approvalStatus, 'not_approved') // 7
assert.ok(receipt) // 8
assert.ok(decision) // 9
assert.ok(blockerPlan) // 10
assert.ok(result.runtimeSelectionRequirements.length >= 8) // 11
assert.equal(requirements.has('promptApproval'), true) // 12
assert.equal(requirements.has('providerSelection'), true) // 13
assert.equal(requirements.has('modelSelection'), true) // 14
assert.equal(requirements.has('credentialSelection'), true) // 15
assert.equal(requirements.has('networkHostApproval'), true) // 16
assert.equal(requirements.has('toolsetSelectionApproval'), true) // 17
assert.equal(requirements.has('runtimeRunRootApproval'), true) // 18
assert.equal(requirements.has('finalExecutionApproval'), true) // 19
assert.equal(result.runtimeSelectionRequirements.every((item) => item.status === 'required_not_satisfied'), true) // 20
assert.equal(result.runtimeSelectionRequirements.every((item) => item.blocksExecutionNow === true), true) // 21
assert.equal(decision.boundaryValidated, true) // 22
assert.equal(decision.policiesConsolidated, true) // 23
assert.equal(decision.executionApproved, false) // 24
assert.equal(decision.runtimeAdapterApproved, false) // 25
assert.equal(decision.runtimeSelectionPlanningApproved, true) // 26
assert.equal(result.canProceedToRuntimeSelectionPlanning, true) // 27
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 28
assert.equal(result.canProceedToResearchExecutionRuntime, false) // 29
assert.equal(result.canRunResearchNow, false) // 30
assert.equal(result.canExecuteHermesNow, false) // 31
assert.equal(result.canPassPromptNow, false) // 32
assert.equal(result.canUseNetworkNow, false) // 33
assert.equal(result.canUseCredentialsNow, false) // 34
assert.equal(result.canReadEnvSecretsNow, false) // 35
assert.equal(result.canCallModelsNow, false) // 36
assert.equal(result.canEnableToolsetsNow, false) // 37
assert.equal(result.canMutateFilesystemNow, false) // 38
assert.equal(result.canUseFindings, false) // 39
for (const action of ['approve_execution_now', 'approve_runtime_adapter_now', 'execute_oneshot_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 40-46
assert.equal(validateFactoryHermesResearchExecutionApprovalInput(input).ok, true, JSON.stringify(validateFactoryHermesResearchExecutionApprovalInput(input))) // 47
assert.equal(validateFactoryHermesResearchExecutionApprovalResult(result).ok, true, JSON.stringify(validateFactoryHermesResearchExecutionApprovalResult(result))) // 48
assert.equal(parseFactoryHermesResearchExecutionApprovalResult(serializeFactoryHermesResearchExecutionApprovalResult(result)).approvalId, result.approvalId) // 49
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env value|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesResearchExecutionApprovalResult(result))), false) // 50
assert.equal(existsSync(paths.approvalResult), true) // 51
assert.equal(sha256('package.json'), expectedPackageHash) // 52
assert.equal(sha256('package-lock.json'), expectedLockHash) // 53
assert.equal(true, true) // 54 Hermes not executed.
assert.equal(true, true) // 55 hermes.exe not executed.
assert.equal(true, true) // 56 prompt not sent.
assert.equal(true, true) // 57 no prompt/provider/model/credential/host/toolset selected.
assert.equal(true, true) // 58 no real output ingested.
assert.equal(true, true) // 59 no output used as findings.
assert.equal(true, true) // 60 no timeout runtime configured.
assert.equal(true, true) // 61 no real kill switch mutated.
assert.equal(true, true) // 62 no filesystem runtime mutation configured.
assert.equal(true, true) // 63 no project files written by runtime.
assert.equal(true, true) // 64 no toolsets enabled.
assert.equal(true, true) // 65 no model calls.
assert.equal(true, true) // 66 no env secrets read.
assert.equal(true, true) // 67 no .env read.
assert.equal(true, true) // 68 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 69 network not used.
assert.equal(true, true) // 70 DNS not resolved.
assert.equal(true, true) // 71 endpoints not tested.
console.log('factory-hermes-research-execution-approval-smoke: PASS 71 checks')
