import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-implementation/index.cjs'
import { parseFactoryHermesWrapperNoToolModeImplementationResult, serializeFactoryHermesWrapperNoToolModeImplementationResult, summarizeFactoryHermesWrapperNoToolModeImplementationResult, validateFactoryHermesWrapperNoToolModeImplementationInput, validateFactoryHermesWrapperNoToolModeImplementationResult } from '../src/factory/hermes-wrapper-no-tool-mode-implementation/index.ts'
const { executeFactoryHermesWrapperNoToolModeImplementation, resolveFactoryHermesWrapperNoToolModeImplementationPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeImplementationPaths()
const readJson = (f) => JSON.parse(readFileSync(f, 'utf8'))
const sha256 = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').toUpperCase()
function files(dir) { return readdirSync(dir).flatMap((name) => { const p = join(dir, name); return statSync(p).isDirectory() ? files(p) : [p] }) }
function scanSafe(pathsToScan) { const text = pathsToScan.map((p) => readFileSync(p, 'utf8')).join('\n'); for (const pattern of [/child_process/, /spawn\s*\(/, /exec\s*\(/, /execFile\s*\(/, /fork\s*\(/, /fetch\s*\(/, /http\./, /https\./, /net\./, /dns\./, /process\.env/, /\.env/, /OPENAI_API_KEY/]) assert.equal(pattern.test(text), false, `forbidden pattern ${pattern}`) }
assert.equal(existsSync(paths.implementationApprovalResult), true) // 1
const approval = readJson(paths.implementationApprovalResult); assert.equal(approval.status, 'wrapper_no_tool_mode_implementation_approval_granted') // 2
assert.equal(existsSync('src/factory/hermes-wrapper-no-tool-mode-runtime'), true) // 3
assert.equal(existsSync('electron/factory/hermes-wrapper-no-tool-mode-runtime'), true) // 4
assert.equal(existsSync('src/factory/hermes-wrapper-no-tool-mode-implementation'), true) // 5
assert.equal(existsSync('electron/factory/hermes-wrapper-no-tool-mode-implementation'), true) // 6
const input = { implementedAt: '2026-07-23T05:00:00.000Z', implementedBy: 'factory-hermes-wrapper-no-tool-mode-implementation-smoke', implementationApprovalResult: approval, implementationPlanningResult: readJson(paths.implementationPlanningResult), runtimeModuleFiles: [paths.runtimeSource, paths.runtimeCjs] }
assert.equal(validateFactoryHermesWrapperNoToolModeImplementationInput(input).ok, true)
const result = await executeFactoryHermesWrapperNoToolModeImplementation(input)
assert.equal(existsSync(paths.implementationResult), true) // 7
assert.equal(result.status, 'wrapper_no_tool_mode_implementation_completed') // 8
assert.equal(result.decision, 'hermes_wrapper_no_tool_mode_implementation_completed_for_verification_planning') // 9
assert.equal(result.implementationStatus, 'implemented_code_only_not_executable') // 10
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 11
assert.equal(result.wrapperRuntimeImplemented, true) // 12
assert.ok(result.wrapperRuntimeModuleManifest) // 13
assert.ok(result.wrapperRuntimeSafetyManifest) // 14
assert.ok(result.wrapperNoToolModeConfigSerializerManifest) // 15
assert.ok(result.wrapperNoToolModeCommandEnvelopeManifest) // 16
assert.ok(result.wrapperNoToolModeVerificationPlanningEnvelope) // 17
assert.equal(result.wrapperNoToolModeConfigSerializerManifest.serializerExists, true) // 18
assert.equal(result.wrapperNoToolModeConfigSerializerManifest.serializerWritesFiles, false) // 19
assert.equal(result.wrapperNoToolModeCommandEnvelopeManifest.executionAllowed, false) // 20
assert.equal(result.wrapperNoToolModeCommandEnvelopeManifest.networkAllowed, false) // 21
assert.equal(result.wrapperNoToolModeCommandEnvelopeManifest.modelCallsAllowed, false) // 22
assert.equal(result.wrapperNoToolModeCommandEnvelopeManifest.credentialAccessAllowed, false) // 23
assert.equal(result.wrapperNoToolModeCommandEnvelopeManifest.toolsetsEnabled, false) // 24
for (const key of ['wrapperExecutionAllowedNow','tempConfigCreationAllowedNow','hermesExecutionAllowedNow','researchRuntimeAdapterAllowedNow','researchExecutionAllowedNow']) assert.equal(result[key], false)
assert.equal(result.canProceedToHermesWrapperNoToolModeVerificationPlanning, true) // 30
for (const key of ['canProceedToHermesWrapperNoToolModeVerification','canProceedToResearchRuntimeAdapterApprovalRetry','canProceedToResearchRuntimeAdapter','canRunResearchNow','canExecuteHermesNow','canPassPromptNow','canUseNetworkNow','canUseCredentialsNow','canReadEnvSecretsNow','canCallModelsNow','canEnableToolsetsNow','canMutateFilesystemNow','canUseFindings']) assert.equal(result[key], false)
assert.equal(validateFactoryHermesWrapperNoToolModeImplementationResult(result).ok, true) // 44/45
assert.equal(parseFactoryHermesWrapperNoToolModeImplementationResult(serializeFactoryHermesWrapperNoToolModeImplementationResult(result)).implementationId, result.implementationId) // 46
assert.equal(/sk-|bearer\s+|password|token|process\.env|full stdout|full stderr|full source/iu.test(JSON.stringify(summarizeFactoryHermesWrapperNoToolModeImplementationResult(result))), false) // 47
assert.equal(existsSync(paths.implementationResult), true) // 48
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 49
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 50
scanSafe([...files('src/factory/hermes-wrapper-no-tool-mode-runtime'), ...files('electron/factory/hermes-wrapper-no-tool-mode-runtime'), ...files('src/factory/hermes-wrapper-no-tool-mode-implementation'), ...files('electron/factory/hermes-wrapper-no-tool-mode-implementation')]) // 51-56
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001'), false) // 57
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode'), false) // 58
assert.equal(result.canEnableToolsetsNow, false) // 59
assert.equal(result.wrapperRuntimeSafetyManifest.noWrapperExecution, true) // 60
assert.equal(result.wrapperRuntimeSafetyManifest.noHermesExecution, true) // 61
assert.equal(result.canExecuteHermesNow, false); assert.equal(result.canPassPromptNow, false); assert.equal(result.canCallModelsNow, false); assert.equal(result.canUseNetworkNow, false); assert.equal(result.canReadEnvSecretsNow, false)
assert.equal(existsSync('docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_IMPLEMENTATION_GATE_V1.md'), true) // 70
console.log('factory-hermes-wrapper-no-tool-mode-implementation-smoke: PASS 70 checks')
