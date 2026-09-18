import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-live-artifact-creation/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult, serializeFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult, summarizeFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult, validateFactoryHermesControlledResearchRuntimeLiveArtifactCreationInput, validateFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult } from '../src/factory/hermes-controlled-research-runtime-live-artifact-creation/index.ts'

const { executeFactoryHermesControlledResearchRuntimeLiveArtifactCreation, resolveFactoryHermesControlledResearchRuntimeLiveArtifactCreationPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeLiveArtifactCreationPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const input = { createdAt: '2026-07-23T20:00:00.000Z', createdBy: 'factory-hermes-controlled-research-runtime-live-artifact-creation-smoke' }

assert.equal(existsSync(paths.liveArtifactApprovalResult), true) // 1
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactCreationInput(input).ok, true) // 2
const result = await executeFactoryHermesControlledResearchRuntimeLiveArtifactCreation(input)
assert.equal(existsSync(paths.liveTempConfigPath), true) // 3
assert.equal(existsSync(paths.liveRunRoot), true) // 4
assert.equal(existsSync(paths.runRootManifestPath), true) // 5
assert.equal(existsSync(paths.liveArtifactCreationResult), true) // 6
assert.equal(result.status, 'controlled_research_runtime_live_artifacts_created') // 7
assert.equal(result.decision, 'hermes_controlled_research_runtime_live_artifacts_created_for_verification') // 8
assert.equal(result.creationStatus, 'created_for_verification_only') // 9
assert.equal(result.liveTempConfigCreatedNow, true) // 10
assert.equal(result.liveRunRootCreatedNow, true) // 11
assert.equal(result.canProceedToControlledResearchRuntimeLiveArtifactVerification, true) // 12
for (const key of ['controlledRuntimeExecutionAllowedNow', 'researchExecutionApprovedNow', 'promptPassingApprovedNow', 'modelCallsApprovedNow', 'networkApprovedNow', 'credentialAccessApprovedNow', 'toolsetEnablementApprovedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canProceedToResearchRuntimeAdapterExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings']) assert.equal(result[key], false) // 13-31
const configText = readFileSync(paths.liveTempConfigPath, 'utf8')
assert.equal(configText.includes('execution_allowed: false'), true) // 32
assert.equal(configText.includes('credential_access_allowed: false'), true) // 33
assert.equal(/sk-[a-z0-9]|bearer\s+|password\s*[:=]/iu.test(configText), false) // 34
assert.equal(validateFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult(result))) // 35
assert.equal(parseFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult(serializeFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult(result)).creationId, result.creationId) // 36
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeLiveArtifactCreationResult(result))), false) // 37
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 38
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 39
for (const action of ['execute_research_now', 'execute_research_runtime_adapter_now', 'execute_wrapper_against_hermes_now', 'execute_hermes_now', 'execute_hermes_help_now', 'execute_oneshot_now', 'pass_prompt_now', 'call_models_now', 'read_env_secrets_now', 'read_dotenv_now', 'use_network_now', 'resolve_dns_now', 'test_endpoints_now', 'read_credential_values_now', 'enable_toolsets_now', 'execute_uv_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now']) assert.equal(result.controlledResearchRuntimeLiveArtifactCreationReceipt.notAuthorizedActions.includes(action), true) // 40-58
assert.equal(existsSync('docs/factory/HERMES_CONTROLLED_RESEARCH_RUNTIME_LIVE_ARTIFACT_CREATION_GATE_V1.md'), true) // 59
console.log('factory-hermes-controlled-research-runtime-live-artifact-creation-smoke: PASS 59 checks')
