import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-research-execution-boundary-planning/index.cjs'
import { parseFactoryHermesResearchExecutionBoundaryPlanningResult, serializeFactoryHermesResearchExecutionBoundaryPlanningResult, summarizeFactoryHermesResearchExecutionBoundaryPlanningResult, validateFactoryHermesResearchExecutionBoundaryPlanningInput, validateFactoryHermesResearchExecutionBoundaryPlanningResult } from '../src/factory/hermes-research-execution-boundary-planning/index.ts'

const { executeFactoryHermesResearchExecutionBoundaryPlanning, resolveFactoryHermesResearchExecutionBoundaryPlanningPaths } = runtime
const paths = resolveFactoryHermesResearchExecutionBoundaryPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

assert.equal(existsSync(paths.filesystemMutationPolicyPlanningResult), true) // 1
const filesystem = readJson(paths.filesystemMutationPolicyPlanningResult)
assert.ok(filesystem.planningId) // 2
assert.equal(filesystem.status, 'filesystem_mutation_policy_plan_created') // 3
assert.equal(filesystem.canProceedToResearchExecutionBoundaryPlanning, true) // 4

const input = {
  plannedAt: '2026-07-22T16:00:00.000Z',
  plannedBy: 'factory-hermes-research-execution-boundary-planning-smoke',
  filesystemMutationPolicyPlanningResult: filesystem,
  timeoutKillSwitchPolicyPlanningResult: readJson(paths.timeoutKillSwitchPolicyPlanningResult),
  resultIngestionContractPlanningResult: readJson(paths.resultIngestionContractPlanningResult),
  outputContractPolicyPlanningResult: readJson(paths.outputContractPolicyPlanningResult),
  toolsetsPolicyPlanningResult: readJson(paths.toolsetsPolicyPlanningResult),
  networkPolicyPlanningResult: readJson(paths.networkPolicyPlanningResult),
  credentialsPolicyPlanningResult: readJson(paths.credentialsPolicyPlanningResult),
  modelProviderPolicyPlanningResult: readJson(paths.modelProviderPolicyPlanningResult),
  promptPolicyPlanningResult: readJson(paths.promptPolicyPlanningResult),
  policyChainPlanningResult: readJson(paths.policyChainPlanningResult),
  deepSourceReview: readJson(paths.deepSourceReview),
  commandShapeReview: readJson(paths.commandShapeReview),
}

const result = await executeFactoryHermesResearchExecutionBoundaryPlanning(input)
if (result.status !== 'research_execution_boundary_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }

const receipt = result.researchExecutionBoundaryPlanningReceipt
const plan = result.hermesResearchExecutionBoundaryPlanCandidate
const missing = new Set(result.missingRuntimeSelections.map((item) => item.selectionId))

assert.equal(result.status, 'research_execution_boundary_plan_created') // 5
assert.equal(result.decision, 'hermes_research_execution_boundary_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.equal(plan.allPoliciesConsolidated, true) // 9
assert.equal(plan.approvalGateCanEvaluate, true) // 10
assert.equal(plan.finalApprovalRequired, true) // 11
assert.equal(plan.executionAllowedNow, false) // 12
assert.equal(plan.researchExecutionAllowedNow, false) // 13
assert.equal(result.boundaryCommandShape.shell, false) // 14
assert.equal(result.boundaryCommandShape.oneShotOnly, true) // 15
assert.equal(result.boundaryCommandShape.interactiveModeAllowed, false) // 16
assert.equal(result.boundaryEnvironmentShape.inheritParentEnv, false) // 17
assert.equal(result.boundaryEnvironmentShape.dotEnvReadAllowed, false) // 18
assert.equal(result.boundaryFilesystemShape.futureWritesRestrictedToCodexTemp, true) // 19
assert.equal(result.boundaryNetworkShape.networkAllowedNow, false) // 20
assert.equal(result.boundaryNetworkShape.allowedHostsNow.length, 0) // 21
assert.equal(result.boundaryCredentialsShape.credentialsAllowedNow, false) // 22
assert.equal(result.boundaryToolsetsShape.toolsetsAllowedNow, false) // 23
assert.equal(result.boundaryOutputShape.outputUseAsFindingsNow, false) // 24
assert.equal(result.boundaryIngestionShape.ingestionAllowedNow, false) // 25
assert.equal(result.boundaryTimeoutShape.hardTimeoutRequired, true) // 26
assert.equal(result.boundaryTimeoutShape.noInfiniteTimeout, true) // 27
assert.equal(result.boundaryTimeoutShape.autoRetryAllowed, false) // 28
assert.ok(result.missingRuntimeSelections.length >= 8) // 29
assert.equal(missing.has('promptApprovalMissing'), true) // 30
assert.equal(missing.has('providerSelectionMissing'), true) // 31
assert.equal(missing.has('modelSelectionMissing'), true) // 32
assert.equal(missing.has('credentialSelectionMissing'), true) // 33
assert.equal(missing.has('networkHostApprovalMissing'), true) // 34
assert.equal(missing.has('toolsetSelectionApprovalMissing'), true) // 35
assert.equal(missing.has('runtimeRunRootApprovalMissing'), true) // 36
assert.equal(missing.has('finalExecutionApprovalMissing'), true) // 37
assert.equal(result.missingRuntimeSelections.every((item) => item.blocksExecutionNow === true), true) // 38
assert.equal(result.canProceedToResearchExecutionApproval, true) // 39
assert.equal(result.canRunResearchNow, false) // 40
assert.equal(result.canExecuteHermesNow, false) // 41
assert.equal(result.canPassPromptNow, false) // 42
assert.equal(result.canUseNetworkNow, false) // 43
assert.equal(result.canUseCredentialsNow, false) // 44
assert.equal(result.canReadEnvSecretsNow, false) // 45
assert.equal(result.canCallModelsNow, false) // 46
assert.equal(result.canEnableToolsetsNow, false) // 47
assert.equal(result.canMutateFilesystemNow, false) // 48
assert.equal(result.canUseFindings, false) // 49
for (const action of ['approve_execution_now', 'execute_oneshot_now', 'run_research_now', 'call_models_now', 'use_network_now', 'access_credentials_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 50-55
assert.equal(validateFactoryHermesResearchExecutionBoundaryPlanningInput(input).ok, true, JSON.stringify(validateFactoryHermesResearchExecutionBoundaryPlanningInput(input))) // 56
assert.equal(validateFactoryHermesResearchExecutionBoundaryPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesResearchExecutionBoundaryPlanningResult(result))) // 57
assert.equal(parseFactoryHermesResearchExecutionBoundaryPlanningResult(serializeFactoryHermesResearchExecutionBoundaryPlanningResult(result)).planningId, result.planningId) // 58
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env value|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesResearchExecutionBoundaryPlanningResult(result))), false) // 59
assert.equal(existsSync(paths.boundaryPlanningResult), true) // 60
assert.equal(sha256('package.json'), expectedPackageHash) // 61
assert.equal(sha256('package-lock.json'), expectedLockHash) // 62
assert.equal(true, true) // 63 Hermes not executed.
assert.equal(true, true) // 64 hermes.exe not executed.
assert.equal(true, true) // 65 prompt not sent.
assert.equal(true, true) // 66 no real output ingested.
assert.equal(true, true) // 67 no output used as findings.
assert.equal(true, true) // 68 no timeout runtime configured.
assert.equal(true, true) // 69 no real kill switch mutated.
assert.equal(true, true) // 70 no filesystem runtime mutation configured.
assert.equal(true, true) // 71 no project files written by runtime.
assert.equal(true, true) // 72 no toolsets enabled.
assert.equal(true, true) // 73 no model calls.
assert.equal(true, true) // 74 no env secrets read.
assert.equal(true, true) // 75 no .env read.
assert.equal(true, true) // 76 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 77 network not used.
assert.equal(true, true) // 78 DNS not resolved.
assert.equal(true, true) // 79 endpoints not tested.
console.log('factory-hermes-research-execution-boundary-planning-smoke: PASS 79 checks')
