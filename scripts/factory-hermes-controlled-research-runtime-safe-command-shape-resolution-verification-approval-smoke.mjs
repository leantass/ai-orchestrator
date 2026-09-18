import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApproval } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []

function record(name, value) {
  assert.equal(Boolean(value), true, name)
  checks.push(name)
}

async function readJson(file) {
  record(`${path.basename(file)} exists`, fsSync.existsSync(file))
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function hash(file) {
  return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase()
}

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification-approval', 'index.ts')).href)
const verificationPlanningResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-planning-result.json'))
const implementationResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json'))
const implementationApprovalResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-approval-result.json'))
record('verification planning parses', verificationPlanningResult.status === 'safe_command_shape_resolution_verification_plan_created')
record('implementation result completed', implementationResult.status === 'safe_command_shape_resolution_implementation_completed')
record('implementation approval parses', implementationApprovalResult.status === 'safe_command_shape_resolution_implementation_approval_granted')

const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalInput({
  approvedAt: '2026-07-24T22:00:00.000Z',
  approvedBy: 'smoke',
  verificationPlanningResult,
  implementationResult,
  implementationApprovalResult,
})
record('validation input ok', inputValidation.ok)

const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApproval()
record('verification approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['safe_command_shape_resolution_verification_approval_granted', 'safe_command_shape_resolution_verification_approval_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_resolution_verification_approved_for_verification_gate', 'hermes_safe_command_shape_resolution_verification_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
record('selected wrapper strategy', result.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets')
record('safe fallback', result.safeFallbackStrategy === 'keep_hermes_research_blocked')

if (result.status === 'safe_command_shape_resolution_verification_approval_granted') {
  for (const key of ['verificationPlanReadinessReview', 'implementationResultVerificationPlanningReviewReview', 'rendererVerificationPlanReview', 'wrapperBuilderVerificationPlanReview', 'sourceCliContractModelVerificationPlanReview', 'redactedCommandEnvelopeVerificationPlanReview', 'noToolProofDependencyVerificationPlanReview', 'failClosedRulesVerificationPlanReview', 'rendererWrapperIntegrationVerificationPlanReview', 'implementationSafetyScanVerificationPlanReview', 'smokeRegressionVerificationPlanReview', 'proofRetryReadinessVerificationPlanReview', 'verificationApprovalLimitationsCarryForward', 'verificationApprovalRiskDispositionRegister', 'safeCommandShapeResolutionVerificationGateEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['verificationPlanAccepted', 'implementationResultReviewAccepted', 'rendererVerificationPlanAccepted', 'wrapperBuilderVerificationPlanAccepted', 'sourceCliContractModelVerificationPlanAccepted', 'redactedEnvelopeVerificationPlanAccepted', 'noToolProofDependencyVerificationPlanAccepted', 'failClosedRulesVerificationPlanAccepted', 'integrationVerificationPlanAccepted', 'safetyScanVerificationPlanAccepted', 'smokeRegressionVerificationPlanAccepted', 'proofRetryReadinessVerificationPlanAccepted', 'verificationGateAllowed']) record(`${key} true`, result[key] === true)
  record('verification gate proceed true', result.canProceedToSafeCommandShapeResolutionVerification === true)
  record('verification gate envelope target', result.safeCommandShapeResolutionVerificationGateEnvelope.targetNextGate === 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Gate v1')
}

for (const key of ['verificationExecutedNow', 'safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const key of ['verificationExecuted', 'proofRetry', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'tempConfigModified', 'runRootModified', 'hermesExecuted', 'hermesExeExecuted', 'oneshotExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'envFileRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted', 'uvPipPythonSetupExecuted']) record(`receipt ${key} false`, result.safeCommandShapeResolutionVerificationApprovalReceipt[key] === false)

const risks = result.verificationApprovalRiskDispositionRegister.risks.map((risk) => risk.riskId)
for (const risk of ['verification_approval_confused_with_verification', 'verification_gate_accidentally_runs_hermes', 'proof_retry_started_before_verification_review']) record(`risk ${risk}`, risks.includes(risk))
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalResult(result))
record('serialize parse ok', parsed.status === result.status)
const summaryText = JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationApprovalResult(result))
record('summary no secretos/env/source/stdout completos', !summaryText.includes('OPENAI_API_KEY=') && !summaryText.includes('stdout') && !summaryText.includes('source') && !summaryText.includes('.env'))
record('artifact existe', fsSync.existsSync(resultPath))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_APPROVAL_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Approval Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Verification approval status: ${result.verificationApprovalStatus}`,
  `Verification planning read: ${verificationPlanningResult.status}`,
  `Implementation result read: ${implementationResult.status}`,
  `Can proceed to verification: ${result.canProceedToSafeCommandShapeResolutionVerification}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Reviews produced: readiness, implementation result, renderer verification plan, wrapper builder verification plan, source CLI contract model, redacted command envelope, no-tool proof dependency, fail-closed rules, integration, safety scan, smoke regression, proof retry readiness, limitations carry-forward, risk disposition register, and verification gate envelope when granted.',
  '',
  'No verification executed, no proof retry, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
