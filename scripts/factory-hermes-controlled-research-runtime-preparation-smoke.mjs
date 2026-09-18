import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-preparation/index.cjs'
import { parseFactoryHermesControlledResearchRuntimePreparationResult, serializeFactoryHermesControlledResearchRuntimePreparationResult, summarizeFactoryHermesControlledResearchRuntimePreparationResult, validateFactoryHermesControlledResearchRuntimePreparationInput, validateFactoryHermesControlledResearchRuntimePreparationResult } from '../src/factory/hermes-controlled-research-runtime-preparation/index.ts'

const { executeFactoryHermesControlledResearchRuntimePreparation, resolveFactoryHermesControlledResearchRuntimePreparationPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimePreparationPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { preparedAt: '2026-07-23T16:00:00.000Z', preparedBy: 'factory-hermes-controlled-research-runtime-preparation-smoke' }

assert.equal(existsSync(paths.controlledRuntimeApprovalResult), true) // 1
assert.equal(readJson(paths.controlledRuntimeApprovalResult).status, 'controlled_research_runtime_approval_granted') // 2
assert.equal(validateFactoryHermesControlledResearchRuntimePreparationInput(input).ok, true) // 54
const result = await executeFactoryHermesControlledResearchRuntimePreparation(input)
assert.equal(existsSync(paths.preparationResult), true) // 3
assert.equal(['controlled_research_runtime_prepared', 'controlled_research_runtime_preparation_blocked'].includes(result.status), true) // 4
assert.equal(['hermes_controlled_research_runtime_prepared_for_preparation_review', 'hermes_controlled_research_runtime_preparation_blocked_live_runtime_surface_detected'].includes(result.decision), true) // 5
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 6
if (result.status === 'controlled_research_runtime_prepared') {
  assert.ok(result.controlledRuntimePreparationManifest) // 7
  assert.ok(result.controlledRuntimeVirtualTempConfigCandidate) // 8
  assert.ok(result.controlledRuntimeRunRootPathValidationManifest) // 9
  assert.ok(result.controlledRuntimeCredentialReferenceBoundary) // 10
  assert.ok(result.controlledRuntimePromptReferencePolicy) // 11
  assert.ok(result.controlledRuntimeModelNetworkAllowlistPolicy) // 12
  assert.ok(result.controlledRuntimeToolsetDisableProofRequirements) // 13
  assert.ok(result.controlledRuntimeTimeoutKillSwitchEnvelope) // 14
  assert.ok(result.controlledRuntimeOutputIngestionContract) // 15
  assert.ok(result.controlledRuntimePreparationRiskRegister) // 16
  assert.ok(result.controlledRuntimePreparationReviewEnvelope) // 17
  for (const key of ['runtimePreparationManifestBuilt', 'virtualTempConfigCandidateBuilt', 'runRootPathValidationManifestBuilt', 'credentialReferenceBoundaryPrepared', 'promptReferencePolicyPrepared', 'modelNetworkAllowlistPrepared', 'toolsetDisableProofPrepared', 'timeoutKillSwitchEnvelopePrepared', 'outputIngestionContractPrepared']) assert.equal(result[key], true) // 18-26
  assert.equal(result.controlledRuntimeVirtualTempConfigCandidate.fileWritten, false) // 27
  assert.equal(result.controlledRuntimeVirtualTempConfigCandidate.liveTempConfigCreated, false) // 28
  assert.equal(result.controlledRuntimeRunRootPathValidationManifest.runRootCreated, false) // 29
  assert.equal(result.canProceedToControlledResearchRuntimePreparationReview, true) // 36
  for (const riskId of ['preparation_confused_with_execution', 'virtual_temp_config_confused_with_live_config', 'run_root_path_confused_with_created_directory', 'credential_ref_confused_with_credential_value', 'hidden_defaults_loaded_in_future_runtime']) assert.equal(result.controlledRuntimePreparationRiskRegister.risks.some((risk) => risk.riskId === riskId), true) // 49-53
}
for (const key of ['promptPassedNow', 'modelCallsMadeNow', 'networkUsedNow', 'credentialValuesReadNow', 'toolsetsEnabledNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) assert.equal(result[key], false) // 30-48
assert.equal(validateFactoryHermesControlledResearchRuntimePreparationResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimePreparationResult(result))) // 55
assert.equal(parseFactoryHermesControlledResearchRuntimePreparationResult(serializeFactoryHermesControlledResearchRuntimePreparationResult(result)).preparationId, result.preparationId) // 56
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimePreparationResult(result))), false) // 57
assert.equal(existsSync(paths.preparationResult), true) // 58
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 59
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 60
assert.equal(result.controlledRuntimePreparationManifest?.artifactsAreNonExecutable, true) // 61
assert.equal(result.researchExecutionApprovedNow, false) // 62
assert.equal(result.canProceedToResearchRuntimeAdapterExecution, false) // 63
assert.equal(result.controlledResearchRuntimePreparationReceipt.notAuthorizedActions.includes('execute_wrapper_against_hermes_now'), true) // 64
assert.equal(result.tempConfigCreatedNow, false) // 65
assert.equal(result.runRootCreatedNow, false) // 66
assert.equal(result.canExecuteHermesNow, false) // 67
assert.equal(result.controlledResearchRuntimePreparationReceipt.notAuthorizedActions.includes('execute_hermes_help_now'), true) // 68
assert.equal(result.controlledResearchRuntimePreparationReceipt.notAuthorizedActions.includes('execute_oneshot_now'), true) // 69
assert.equal(result.promptPassedNow, false) // 70
assert.equal(result.modelCallsMadeNow, false) // 71
assert.equal(result.canReadEnvSecretsNow, false) // 72
assert.equal(result.controlledResearchRuntimePreparationReceipt.notAuthorizedActions.includes('read_dotenv_now'), true) // 73
assert.equal(result.networkUsedNow, false) // 74
assert.equal(result.controlledResearchRuntimePreparationReceipt.notAuthorizedActions.includes('resolve_dns_now'), true) // 75
assert.equal(result.controlledResearchRuntimePreparationReceipt.notAuthorizedActions.includes('test_endpoints_now'), true) // 76
assert.equal(result.credentialValuesReadNow, false) // 77
assert.equal(result.toolsetsEnabledNow, false) // 78
for (const action of ['execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimePreparationReceipt.notAuthorizedActions.includes(action), true) // 79
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_PREPARATION_GATE_V1.md'), true) // 80
console.log('factory-hermes-controlled-research-runtime-preparation-smoke: PASS 80 checks')
