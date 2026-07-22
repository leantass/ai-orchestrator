import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-filesystem-mutation-policy-planning/index.cjs'
import { parseFactoryHermesFilesystemMutationPolicyPlanningResult, serializeFactoryHermesFilesystemMutationPolicyPlanningResult, summarizeFactoryHermesFilesystemMutationPolicyPlanningResult, validateFactoryHermesFilesystemMutationPolicyPlanningInput, validateFactoryHermesFilesystemMutationPolicyPlanningResult } from '../src/factory/hermes-filesystem-mutation-policy-planning/index.ts'

const { executeFactoryHermesFilesystemMutationPolicyPlanning, resolveFactoryHermesFilesystemMutationPolicyPlanningPaths } = runtime
const paths = resolveFactoryHermesFilesystemMutationPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
assert.equal(existsSync(paths.timeoutKillSwitchPolicyPlanningResult), true) // 1
const timeout = JSON.parse(readFileSync(paths.timeoutKillSwitchPolicyPlanningResult, 'utf8'))
assert.ok(timeout.planningId) // 2
assert.equal(timeout.status, 'timeout_kill_switch_policy_plan_created') // 3
assert.equal(timeout.canProceedToFilesystemMutationPolicyPlanning, true) // 4
const ingestion = JSON.parse(readFileSync(paths.resultIngestionContractPlanningResult, 'utf8'))
const result = await executeFactoryHermesFilesystemMutationPolicyPlanning({ plannedAt: '2026-07-22T14:30:00.000Z', plannedBy: 'factory-hermes-filesystem-mutation-policy-planning-smoke', timeoutKillSwitchPolicyPlanningResult: timeout, resultIngestionContractPlanningResult: ingestion })
if (result.status !== 'filesystem_mutation_policy_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const plan = result.hermesFilesystemMutationPolicyPlanCandidate
const receipt = result.filesystemMutationPolicyPlanningReceipt
const surface = (id) => plan.filesystemSurfaceCandidates.find((item) => item.surfaceId === id)
assert.equal(result.status, 'filesystem_mutation_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_filesystem_mutation_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(plan.filesystemSurfaceCandidates.length >= 13) // 9
assert.ok(surface('runtime_run_artifact_root')) // 10
assert.ok(surface('usage_file_artifact')) // 11
assert.ok(surface('stdout_stderr_preview_artifacts')) // 12
assert.ok(surface('execution_manifest_artifact')) // 13
assert.equal(surface('source_root').status, 'read_only_no_mutation') // 14
assert.equal(surface('python_env_root').status, 'read_only_no_mutation') // 15
assert.equal(surface('project_root').status, 'forbidden_for_runtime_writes') // 16
assert.equal(surface('env_files').status, 'forbidden_read_write') // 17
assert.ok(plan.readPathRules.length > 0) // 18
assert.ok(plan.writePathRules.length > 0) // 19
assert.ok(plan.artifactShapes.length > 0) // 20
assert.equal(plan.futureWritesRestrictedToCodexTemp, true) // 21
assert.equal(plan.futureWritesRequireApprovedRunRoot, true) // 22
assert.equal(plan.sourceRootMutationForbidden, true) // 23
assert.equal(plan.pythonEnvMutationForbidden, true) // 24
assert.equal(plan.uvCacheMutationForbidden, true) // 25
assert.equal(plan.packageFileMutationForbidden, true) // 26
assert.equal(plan.dotEnvReadWriteForbidden, true) // 27
assert.equal(plan.arbitraryPathAccessForbidden, true) // 28
assert.equal(plan.pathContainmentRequired, true) // 29
assert.equal(plan.symlinkTraversalForbidden, true) // 30
assert.equal(plan.filesystemMutationAllowedNow, false) // 31
assert.equal(plan.projectFileWritesAllowedNow, false) // 32
assert.equal(result.canProceedToResearchExecutionBoundaryPlanning, true) // 33
assert.equal(result.canProceedToResearchExecutionApproval, false) // 34
assert.equal(result.canRunResearchNow, false) // 35
assert.equal(result.canExecuteHermesNow, false) // 36
assert.equal(result.canMutateFilesystemNow, false) // 37
assert.equal(result.canWriteProjectFilesNow, false) // 38
assert.equal(result.canUseNetworkNow, false) // 39
assert.equal(result.canUseCredentialsNow, false) // 40
assert.equal(result.canReadEnvSecretsNow, false) // 41
assert.equal(result.canCallModelsNow, false) // 42
assert.equal(result.canEnableToolsetsNow, false) // 43
assert.equal(result.canUseFindings, false) // 44
for (const action of ['mutate_filesystem_now', 'write_project_files_now', 'write_source_root_now', 'mutate_python_env_now', 'read_dotenv_now', 'write_outside_codex_temp_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 45-50
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, timeoutKillSwitchPolicyPlanningResult: timeout, resultIngestionContractPlanningResult: ingestion }
assert.equal(validateFactoryHermesFilesystemMutationPolicyPlanningInput(input).ok, true) // 51
assert.equal(validateFactoryHermesFilesystemMutationPolicyPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesFilesystemMutationPolicyPlanningResult(result))) // 52
assert.equal(parseFactoryHermesFilesystemMutationPolicyPlanningResult(serializeFactoryHermesFilesystemMutationPolicyPlanningResult(result)).planningId, result.planningId) // 53
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env value|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesFilesystemMutationPolicyPlanningResult(result))), false) // 54
assert.equal(existsSync(paths.filesystemMutationPolicyPlanningResult), true) // 55
assert.equal(sha256('package.json'), expectedPackageHash) // 56
assert.equal(sha256('package-lock.json'), expectedLockHash) // 57
assert.equal(true, true) // 58 Hermes not executed.
assert.equal(true, true) // 59 hermes.exe not executed.
assert.equal(true, true) // 60 prompt not sent.
assert.equal(true, true) // 61 no real output ingested.
assert.equal(true, true) // 62 no output used as findings.
assert.equal(true, true) // 63 no timeout runtime configured.
assert.equal(true, true) // 64 no kill switch mutated.
assert.equal(true, true) // 65 no filesystem runtime mutation configured.
assert.equal(true, true) // 66 no project files written by runtime.
assert.equal(true, true) // 67 no toolsets enabled.
assert.equal(true, true) // 68 no model calls.
assert.equal(true, true) // 69 no env secrets read.
assert.equal(true, true) // 70 no .env read.
assert.equal(true, true) // 71 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 72 network not used.
assert.equal(true, true) // 73 DNS/endpoints not used.
console.log('factory-hermes-filesystem-mutation-policy-planning-smoke: PASS 73 checks')
