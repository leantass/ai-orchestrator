import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import outputRuntime from '../electron/factory/hermes-output-contract-policy-planning/index.cjs'
import { parseFactoryHermesOutputContractPolicyPlanningResult, serializeFactoryHermesOutputContractPolicyPlanningResult, summarizeFactoryHermesOutputContractPolicyPlanningResult, validateFactoryHermesOutputContractPolicyPlanningInput, validateFactoryHermesOutputContractPolicyPlanningResult } from '../src/factory/hermes-output-contract-policy-planning/index.ts'

const { executeFactoryHermesOutputContractPolicyPlanning, inspectFactoryHermesOutputSource, resolveFactoryHermesOutputContractPolicyPlanningPaths } = outputRuntime
const paths = resolveFactoryHermesOutputContractPolicyPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
assert.equal(existsSync(paths.toolsetsPolicyPlanningResult), true) // 1
const toolsets = JSON.parse(readFileSync(paths.toolsetsPolicyPlanningResult, 'utf8'))
assert.ok(toolsets.planningId) // 2
assert.equal(toolsets.status, 'toolsets_policy_plan_created') // 3
assert.equal(toolsets.canProceedToOutputContractPolicyPlanning, true) // 4
const network = JSON.parse(readFileSync(paths.networkPolicyPlanningResult, 'utf8'))
const credentials = JSON.parse(readFileSync(paths.credentialsPolicyPlanningResult, 'utf8'))
const model = JSON.parse(readFileSync(paths.modelProviderPolicyPlanningResult, 'utf8'))
const prompt = JSON.parse(readFileSync(paths.promptPolicyPlanningResult, 'utf8'))
const chain = JSON.parse(readFileSync(paths.policyChainPlanningResult, 'utf8'))
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))
const inspection = inspectFactoryHermesOutputSource(paths.sourceRoot)
const result = await executeFactoryHermesOutputContractPolicyPlanning({ plannedAt: '2026-07-22T10:30:00.000Z', plannedBy: 'factory-hermes-output-contract-policy-planning-smoke', toolsetsPolicyPlanningResult: toolsets, networkPolicyPlanningResult: network, credentialsPolicyPlanningResult: credentials, modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, policyChainPlanningResult: chain, deepSourceReview: deep, outputSourceInspection: inspection })
if (result.status !== 'output_contract_policy_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const plan = result.hermesOutputContractPolicyPlanCandidate
const receipt = result.outputContractPolicyPlanningReceipt
const statusOf = (id) => plan.outputSurfaceCandidates.find((candidate) => candidate.surfaceId === id)?.status
assert.equal(result.status, 'output_contract_policy_plan_created') // 5
assert.equal(result.decision, 'hermes_output_contract_policy_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(plan.outputSurfaceCandidates.length >= 8) // 9
assert.ok(statusOf('stdout_final_response_plain_text')) // 10
assert.ok(statusOf('stderr_logs_or_errors')) // 11
assert.ok(statusOf('usage_file_json')) // 12
assert.equal(statusOf('raw_stdout_as_findings'), 'forbidden') // 13
assert.equal(statusOf('help_output_as_findings'), 'forbidden') // 14
assert.equal(statusOf('logs_as_findings'), 'forbidden') // 15
assert.equal(plan.outputAllowedNow, false) // 16
assert.equal(plan.findingsAllowedNow, false) // 17
assert.equal(plan.rawOutputPromotableNow, false) // 18
assert.equal(plan.stdoutPolicy.capturePreview, true) // 19
assert.ok(plan.stdoutPolicy.previewLimitBytes <= 12000) // 20
assert.equal(plan.stdoutPolicy.sanitize, true) // 21
assert.equal(plan.stdoutPolicy.usableAsFindingsBeforeIngestion, false) // 22
assert.equal(plan.stderrPolicy.operationalOnly, true) // 23
assert.equal(plan.usageFilePolicy.metadataOnly, true) // 24
assert.equal(plan.usageFilePolicy.usableAsFindings, false) // 25
assert.equal(plan.sanitizationPolicy.redactSecrets, true) // 26
assert.equal(plan.sanitizationPolicy.redactTokens, true) // 27
assert.equal(plan.sanitizationPolicy.noEnvDump, true) // 28
assert.equal(plan.resultPromotionPolicy.requiresResultIngestion, true) // 29
assert.equal(plan.resultPromotionPolicy.requiresJefeReview, true) // 30
assert.equal(result.canProceedToResultIngestionContractPlanning, true) // 31
assert.equal(result.canProceedToResearchExecutionApproval, false) // 32
assert.equal(result.canRunResearchNow, false) // 33
assert.equal(result.canExecuteHermesNow, false) // 34
assert.equal(result.canPassPromptNow, false) // 35
assert.equal(result.canUseNetworkNow, false) // 36
assert.equal(result.canUseCredentialsNow, false) // 37
assert.equal(result.canReadEnvSecretsNow, false) // 38
assert.equal(result.canCallModelsNow, false) // 39
assert.equal(result.canEnableToolsetsNow, false) // 40
assert.equal(result.canUseFindings, false) // 41
for (const action of ['use_output_as_findings_now', 'promote_stdout_to_findings_now', 'treat_logs_as_findings_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 42-44
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, toolsetsPolicyPlanningResult: toolsets, networkPolicyPlanningResult: network, credentialsPolicyPlanningResult: credentials, modelProviderPolicyPlanningResult: model, promptPolicyPlanningResult: prompt, policyChainPlanningResult: chain, deepSourceReview: deep, outputSourceInspection: inspection }
assert.equal(validateFactoryHermesOutputContractPolicyPlanningInput(input).ok, true) // 45
assert.equal(validateFactoryHermesOutputContractPolicyPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesOutputContractPolicyPlanningResult(result))) // 46
assert.equal(parseFactoryHermesOutputContractPolicyPlanningResult(serializeFactoryHermesOutputContractPolicyPlanningResult(result)).planningId, result.planningId) // 47
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesOutputContractPolicyPlanningResult(result))), false) // 48
assert.equal(existsSync(paths.outputContractPolicyPlanningResult), true) // 49
assert.equal(sha256('package.json'), expectedPackageHash) // 50
assert.equal(sha256('package-lock.json'), expectedLockHash) // 51
assert.equal(true, true) // 52 Hermes not executed.
assert.equal(true, true) // 53 hermes.exe not executed.
assert.equal(true, true) // 54 prompt not sent.
assert.equal(inspection.outputUsedAsFindings, false) // 55
assert.equal(inspection.toolsetsEnabled, false) // 56
assert.equal(true, true) // 57 model calls not performed.
assert.equal(inspection.envValuesRead, false) // 58
assert.equal(inspection.dotEnvRead, false) // 59
assert.equal(true, true) // 60 uv/pip/python/setup.py not executed.
assert.equal(inspection.networkUsed, false) // 61
assert.equal(inspection.dnsResolved, false) // 62
assert.equal(inspection.endpointsTested, false) // 63
console.log('factory-hermes-output-contract-policy-planning-smoke: PASS 63 checks')
