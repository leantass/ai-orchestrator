import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-wrapper-no-tool-mode-verification-planning/index.cjs'
import { parseFactoryHermesWrapperNoToolModeVerificationPlanningResult, serializeFactoryHermesWrapperNoToolModeVerificationPlanningResult, summarizeFactoryHermesWrapperNoToolModeVerificationPlanningResult, validateFactoryHermesWrapperNoToolModeVerificationPlanningInput, validateFactoryHermesWrapperNoToolModeVerificationPlanningResult } from '../src/factory/hermes-wrapper-no-tool-mode-verification-planning/index.ts'
const { executeFactoryHermesWrapperNoToolModeVerificationPlanning, resolveFactoryHermesWrapperNoToolModeVerificationPlanningPaths } = runtime
const paths = resolveFactoryHermesWrapperNoToolModeVerificationPlanningPaths()
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
assert.equal(existsSync(paths.implementationResult), true) // 1
const implementation = readJson(paths.implementationResult); assert.equal(implementation.status, 'wrapper_no_tool_mode_implementation_completed') // 2
const input = { plannedAt: '2026-07-23T06:00:00.000Z', plannedBy: 'factory-hermes-wrapper-no-tool-mode-verification-planning-smoke', implementationResult: implementation, implementationApprovalResult: readJson(paths.implementationApprovalResult), implementationPlanningResult: readJson(paths.implementationPlanningResult), wrapperApprovalResult: readJson(paths.wrapperApprovalResult), wrapperPlanningResult: readJson(paths.wrapperPlanningResult), adapterApprovalResult: readJson(paths.adapterApprovalResult) }
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationPlanningInput(input).ok, true)
const result = await executeFactoryHermesWrapperNoToolModeVerificationPlanning(input)
assert.equal(existsSync(paths.verificationPlanningResult), true) // 3
assert.equal(result.status, 'wrapper_no_tool_mode_verification_plan_created') // 4
assert.equal(result.decision, 'hermes_wrapper_no_tool_mode_verification_plan_created_for_approval') // 5
assert.equal(result.verificationPlanningStatus, 'plan_candidate_created') // 6
assert.equal(result.selectedWrapperStrategy, 'wrapper_temp_config_no_toolsets') // 7
assert.ok(result.wrapperStaticSafetyScanPlan) // 8
assert.ok(result.wrapperConfigSerializerVerificationPlan) // 9
assert.ok(result.wrapperCommandEnvelopeVerificationPlan) // 10
assert.ok(result.wrapperTempConfigVirtualVerificationPlan) // 11
assert.ok(result.wrapperNoHermesExecutionVerificationPlan) // 12
assert.ok(result.wrapperVerificationRiskRegister) // 13
const risks = result.wrapperVerificationRiskRegister.risks.map((risk) => risk.riskId)
assert.ok(risks.includes('static_scan_false_negative')) // 14
assert.ok(risks.includes('serializer_declares_safe_but_schema_unknown')) // 15
assert.ok(risks.includes('command_envelope_accidentally_runnable')) // 16
assert.ok(risks.includes('hidden_defaults_not_detected')) // 17
assert.ok(result.wrapperNoToolModeVerificationApprovalEnvelope) // 18
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.verificationExecutionAllowedNow, false) // 19
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.wrapperExecutionAllowedNow, false) // 20
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.tempConfigCreationAllowedNow, false) // 21
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.hermesExecutionAllowedNow, false) // 22
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.researchRuntimeAdapterAllowedNow, false) // 23
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.researchExecutionAllowedNow, false) // 24
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.futureVerificationRequiresApproval, true) // 25
assert.equal(result.hermesWrapperNoToolModeVerificationPlanCandidate.futureRuntimeAdapterRetryRequiresApproval, true) // 26
assert.equal(result.canProceedToHermesWrapperNoToolModeVerificationApproval, true) // 27
assert.equal(result.canProceedToHermesWrapperNoToolModeVerification, false) // 28
assert.equal(result.canProceedToResearchRuntimeAdapterApprovalRetry, false) // 29
assert.equal(result.canProceedToResearchRuntimeAdapter, false) // 30
assert.equal(result.canRunResearchNow, false) // 31
assert.equal(result.canExecuteHermesNow, false) // 32
assert.equal(result.canPassPromptNow, false) // 33
assert.equal(result.canUseNetworkNow, false) // 34
assert.equal(result.canUseCredentialsNow, false) // 35
assert.equal(result.canReadEnvSecretsNow, false) // 36
assert.equal(result.canCallModelsNow, false) // 37
assert.equal(result.canEnableToolsetsNow, false) // 38
assert.equal(result.canMutateFilesystemNow, false) // 39
assert.equal(result.canUseFindings, false) // 40
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationPlanningInput(input).ok, true) // 41
assert.equal(validateFactoryHermesWrapperNoToolModeVerificationPlanningResult(result).ok, true) // 42
assert.equal(parseFactoryHermesWrapperNoToolModeVerificationPlanningResult(serializeFactoryHermesWrapperNoToolModeVerificationPlanningResult(result)).planningId, result.planningId) // 43
assert.equal(/sk-|bearer\s+|password|token|full stdout|full stderr|full source/iu.test(JSON.stringify(summarizeFactoryHermesWrapperNoToolModeVerificationPlanningResult(result))), false) // 44
assert.equal(existsSync(paths.verificationPlanningResult), true) // 45
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 46
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 47
assert.equal(result.wrapperStaticSafetyScanPlan.scanExecutionAllowedNow, false) // 48
assert.equal(result.wrapperNoToolModeVerificationApprovalEnvelope.wrapperExecutionAllowedNow, false) // 49
assert.equal(result.wrapperNoToolModeVerificationApprovalEnvelope.tempConfigCreationAllowedNow, false) // 50
assert.equal(result.wrapperNoToolModeVerificationApprovalEnvelope.hermesExecutionAllowedNow, false) // 51
assert.equal(result.wrapperNoToolModeVerificationApprovalEnvelope.researchExecutionAllowedNow, false) // 52
assert.equal(result.wrapperNoHermesExecutionVerificationPlan.executionAllowedNow, false) // 53
assert.equal(result.wrapperNoHermesExecutionVerificationPlan.requiresSeparateVerificationApproval, true) // 54
assert.equal(result.wrapperCommandEnvelopeVerificationPlan.executionAllowedNow, false) // 55
assert.equal(result.wrapperConfigSerializerVerificationPlan.executionAllowedNow, false) // 56
assert.equal(result.wrapperTempConfigVirtualVerificationPlan.executionAllowedNow, false) // 57
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/wrapper-configs/no-tool-mode'), false) // 58
assert.equal(existsSync('.codex-temp/external-tools/hermes-agent/install/75b300f/research-runs/hermes-first-controlled-run-001'), false) // 59
assert.ok(result.wrapperStaticSafetyScanPlan.forbiddenRuntimePatterns.includes('child_process')) // 60
assert.ok(result.wrapperStaticSafetyScanPlan.forbiddenRuntimePatterns.includes('OPENAI_API_KEY')) // 61
assert.ok(result.wrapperNoToolModeVerificationPlanningReceipt.notAuthorizedActions.includes('execute_wrapper_now')) // 62
assert.ok(result.wrapperNoToolModeVerificationPlanningReceipt.notAuthorizedActions.includes('create_temp_config_now')) // 63
assert.equal(existsSync('docs/factory/HERMES_WRAPPER_NO_TOOL_MODE_VERIFICATION_PLANNING_GATE_V1.md'), true) // 65
console.log('factory-hermes-wrapper-no-tool-mode-verification-planning-smoke: PASS 65 checks')
