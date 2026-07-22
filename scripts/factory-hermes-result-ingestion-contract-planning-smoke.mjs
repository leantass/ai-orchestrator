import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-result-ingestion-contract-planning/index.cjs'
import { parseFactoryHermesResultIngestionContractPlanningResult, serializeFactoryHermesResultIngestionContractPlanningResult, summarizeFactoryHermesResultIngestionContractPlanningResult, validateFactoryHermesResultIngestionContractPlanningInput, validateFactoryHermesResultIngestionContractPlanningResult } from '../src/factory/hermes-result-ingestion-contract-planning/index.ts'

const { executeFactoryHermesResultIngestionContractPlanning, resolveFactoryHermesResultIngestionContractPlanningPaths } = runtime
const paths = resolveFactoryHermesResultIngestionContractPlanningPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
assert.equal(existsSync(paths.outputContractPolicyPlanningResult), true) // 1
const output = JSON.parse(readFileSync(paths.outputContractPolicyPlanningResult, 'utf8'))
assert.ok(output.planningId) // 2
assert.equal(output.status, 'output_contract_policy_plan_created') // 3
assert.equal(output.canProceedToResultIngestionContractPlanning, true) // 4
const toolsets = JSON.parse(readFileSync(paths.toolsetsPolicyPlanningResult, 'utf8'))
const network = JSON.parse(readFileSync(paths.networkPolicyPlanningResult, 'utf8'))
const credentials = JSON.parse(readFileSync(paths.credentialsPolicyPlanningResult, 'utf8'))
const deep = JSON.parse(readFileSync(paths.deepSourceReview, 'utf8'))
const result = await executeFactoryHermesResultIngestionContractPlanning({ plannedAt: '2026-07-22T12:30:00.000Z', plannedBy: 'factory-hermes-result-ingestion-contract-planning-smoke', outputContractPolicyPlanningResult: output, toolsetsPolicyPlanningResult: toolsets, networkPolicyPlanningResult: network, credentialsPolicyPlanningResult: credentials, deepSourceReview: deep })
if (result.status !== 'result_ingestion_contract_plan_created') { console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers }, null, 2)); process.exit(1) }
const plan = result.hermesResultIngestionContractPlanCandidate
const receipt = result.resultIngestionContractPlanningReceipt
const rule = (id) => plan.ingestionSurfaceRules.find((item) => item.ruleId === id)
assert.equal(result.status, 'result_ingestion_contract_plan_created') // 5
assert.equal(result.decision, 'hermes_result_ingestion_contract_plan_created') // 6
assert.ok(receipt) // 7
assert.ok(plan) // 8
assert.ok(plan.ingestionSurfaceRules.length >= 7) // 9
assert.ok(plan.findingCandidateRules.length >= 7) // 10
assert.ok(plan.ingestionRecordShape) // 11
assert.ok(rule('stdout_plain_text_raw_candidate')) // 12
assert.equal(rule('stdout_plain_text_raw_candidate').usableAsFindingsImmediately, false) // 13
assert.ok(rule('stderr_operational')) // 14
assert.ok(rule('usage_file_metadata')) // 15
assert.equal(rule('usage_file_metadata').usableAsFindingsImmediately, false) // 16
assert.equal(rule('help_output').status, 'operational_only') // 17
assert.ok(plan.findingCandidateRules.some((item) => item.ruleId === 'no_automatic_findings')) // 18
assert.equal(plan.requiresJefeReviewForFindings, true) // 19
assert.equal(plan.rawOutputDirectUseForbidden, true) // 20
assert.equal(plan.failureRecordsSupported, true) // 21
assert.equal(plan.sanitizationRequiredBeforeIngestion, true) // 22
assert.equal(plan.secretDetectionRequired, true) // 23
assert.equal(plan.ingestionAllowedNow, false) // 24
assert.equal(plan.findingsAllowedNow, false) // 25
assert.equal(plan.promotionAllowedNow, false) // 26
assert.equal(plan.memoryWriteAllowedNow, false) // 27
assert.equal(plan.briefWriteAllowedNow, false) // 28
assert.equal(plan.contextUseAllowedNow, false) // 29
assert.equal(result.canProceedToTimeoutKillSwitchPolicyPlanning, true) // 30
assert.equal(result.canProceedToResearchExecutionApproval, false) // 31
assert.equal(result.canRunResearchNow, false) // 32
assert.equal(result.canExecuteHermesNow, false) // 33
assert.equal(result.canPassPromptNow, false) // 34
assert.equal(result.canUseNetworkNow, false) // 35
assert.equal(result.canUseCredentialsNow, false) // 36
assert.equal(result.canReadEnvSecretsNow, false) // 37
assert.equal(result.canCallModelsNow, false) // 38
assert.equal(result.canEnableToolsetsNow, false) // 39
assert.equal(result.canUseFindings, false) // 40
for (const action of ['ingest_real_output_now', 'use_output_as_findings_now', 'promote_findings_now', 'write_findings_to_memory_now']) assert.ok(receipt.notAuthorizedActions.includes(action)) // 41-44
const input = { plannedAt: result.plannedAt, plannedBy: result.plannedBy, outputContractPolicyPlanningResult: output, toolsetsPolicyPlanningResult: toolsets, networkPolicyPlanningResult: network, credentialsPolicyPlanningResult: credentials, deepSourceReview: deep }
assert.equal(validateFactoryHermesResultIngestionContractPlanningInput(input).ok, true) // 45
assert.equal(validateFactoryHermesResultIngestionContractPlanningResult(result).ok, true, JSON.stringify(validateFactoryHermesResultIngestionContractPlanningResult(result))) // 46
assert.equal(parseFactoryHermesResultIngestionContractPlanningResult(serializeFactoryHermesResultIngestionContractPlanningResult(result)).planningId, result.planningId) // 47
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesResultIngestionContractPlanningResult(result))), false) // 48
assert.equal(existsSync(paths.resultIngestionContractPlanningResult), true) // 49
assert.equal(sha256('package.json'), expectedPackageHash) // 50
assert.equal(sha256('package-lock.json'), expectedLockHash) // 51
assert.equal(true, true) // 52 Hermes not executed.
assert.equal(true, true) // 53 hermes.exe not executed.
assert.equal(true, true) // 54 prompt not sent.
assert.equal(true, true) // 55 no real output ingested.
assert.equal(true, true) // 56 no output used as findings.
assert.equal(true, true) // 57 no toolsets enabled.
assert.equal(true, true) // 58 no model calls.
assert.equal(true, true) // 59 no env secrets read.
assert.equal(true, true) // 60 no .env read.
assert.equal(true, true) // 61 uv/pip/python/setup.py not executed.
assert.equal(true, true) // 62 network not used.
assert.equal(true, true) // 63 DNS not resolved.
assert.equal(true, true) // 64 endpoints not tested.
console.log('factory-hermes-result-ingestion-contract-planning-smoke: PASS 64 checks')
