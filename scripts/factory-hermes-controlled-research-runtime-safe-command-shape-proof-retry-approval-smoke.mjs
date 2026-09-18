import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApproval } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-approval', 'index.ts')).href)
const proofRetryPlanningResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-planning-result.json'))
const resolutionVerificationResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json'))
const implementationResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json'))
record('proof retry planning parses', proofRetryPlanningResult.status === 'safe_command_shape_proof_retry_plan_created')
record('resolution verification parses', resolutionVerificationResult.status === 'safe_command_shape_resolution_verification_completed')
record('implementation parses', implementationResult.status === 'safe_command_shape_resolution_implementation_completed')
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalInput({
  approvedAt: '2026-07-24T23:30:00.000Z',
  approvedBy: 'smoke',
  proofRetryPlanningResult,
  resolutionVerificationResult,
  implementationResult,
})
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApproval()
record('proof retry approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['safe_command_shape_proof_retry_approval_granted', 'safe_command_shape_proof_retry_approval_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_proof_retry_approved_for_retry_gate', 'hermes_safe_command_shape_proof_retry_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'safe_command_shape_proof_retry_approval_granted') {
  for (const key of ['proofRetryPlanReadinessReview', 'resolutionVerificationAcceptanceReview', 'proofRetryScopePlanReview', 'proofRetryInputArtifactPlanReview', 'sourceCliContractProofRetryPlanReview', 'rendererCommandShapeProofRetryPlanReview', 'wrapperBuilderProofRetryPlanReview', 'noDefaultsNoToolsetsProofRetryPlanReview', 'nonNetworkDryRunRetryAssessmentPlanReview', 'failClosedProofRetryPlanReview', 'proofRetryEvidencePlanReview', 'proofRetryApprovalRiskDispositionRegister', 'safeCommandShapeProofRetryGateEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['proofRetryPlanAccepted', 'resolutionVerificationAcceptanceAccepted', 'proofRetryScopePlanAccepted', 'proofRetryInputArtifactPlanAccepted', 'sourceCliContractProofRetryPlanAccepted', 'rendererCommandShapeProofRetryPlanAccepted', 'wrapperBuilderProofRetryPlanAccepted', 'noDefaultsNoToolsetsProofRetryPlanAccepted', 'nonNetworkDryRunRetryAssessmentPlanAccepted', 'failClosedProofRetryPlanAccepted', 'proofRetryEvidencePlanAccepted', 'proofRetryGateAllowed', 'canProceedToSafeCommandShapeProofRetry']) record(`${key} true`, result[key] === true)
}
for (const key of ['proofRetryExecutedNow', 'dryRunRetryExecutedNow', 'safeCommandShapeProvenNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const key of ['proofRetry', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'tempConfigModified', 'runRootModified', 'hermesExecuted', 'hermesExeExecuted', 'oneshotExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'envFileRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted', 'uvPipPythonSetupExecuted']) record(`receipt ${key} false`, result.safeCommandShapeProofRetryApprovalReceipt[key] === false)
const risks = result.proofRetryApprovalRiskDispositionRegister.risks.map((risk) => risk.riskId)
for (const risk of ['proof_retry_approval_confused_with_proof_retry', 'redacted_envelope_used_as_runnable', 'runtime_execution_attempted_without_proof_retry_review']) record(`risk ${risk}`, risks.includes(risk))
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(result))
record('serialize parse ok', parsed.status === result.status)
const summaryText = JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryApprovalResult(result))
record('summary no secretos/env/source/stdout completos', !summaryText.includes('OPENAI_API_KEY=') && !summaryText.includes('stdout') && !summaryText.includes('source') && !summaryText.includes('.env'))
record('artifact existe', fsSync.existsSync(resultPath))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_APPROVAL_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Approval Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof retry approval status: ${result.proofRetryApprovalStatus}`,
  `Proof retry planning read: ${proofRetryPlanningResult.status}`,
  `Resolution verification read: ${resolutionVerificationResult.status}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Reviews produced: readiness, verification acceptance, scope, input artifacts, source CLI contract retry plan, renderer retry plan, wrapper builder retry plan, no-defaults/no-toolsets, dry-run assessment, fail-closed retry, evidence, limitations, risk register, and proof retry gate envelope when granted.',
  '',
  'No proof retry, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
