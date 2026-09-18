import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReview } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry-review/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const proofRetryPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-review-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-review', 'index.ts')).href)
const proofRetry = await readJson(proofRetryPath)
record('proof retry result parses', proofRetry.status === 'safe_command_shape_proof_retry_blocked')
const approval = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-approval-result.json'))
const verification = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json'))
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewInput({ reviewedAt: '2026-07-25T00:00:00.000Z', reviewedBy: 'smoke', proofRetryResult: proofRetry, proofRetryApprovalResult: approval, resolutionVerificationResult: verification })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReview()
record('proof retry review result exists', fsSync.existsSync(resultPath))
record('status completed or blocked', ['safe_command_shape_proof_retry_review_completed', 'safe_command_shape_proof_retry_review_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_proof_retry_review_accepted_blocked_no_safe_command_shape', 'hermes_safe_command_shape_proof_retry_review_blocked_result_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'safe_command_shape_proof_retry_review_completed') {
  for (const key of ['proofRetryResultReview', 'sourceCliContractProofRetryReview', 'rendererCommandShapeProofRetryReview', 'wrapperBuilderProofRetryReview', 'noDefaultsNoToolsetsProofRetryReview', 'nonNetworkDryRunRetryReview', 'failClosedProofRetryReview', 'proofRetryEvidenceManifestReview', 'proofRetrySafetyManifestReview', 'proofRetryReviewLimitationsCarryForward', 'proofRetryReviewRiskDispositionRegister', 'keepHermesResearchBlockedDecisionEnvelope', 'alternateSafeRuntimeResolutionPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['safeCommandShapeStillNotProven', 'runtimeStillBlocked', 'credentialAccessStillBlocked', 'networkStillBlocked', 'canProceedToKeepHermesResearchBlockedDecision', 'canProceedToAlternateSafeRuntimeResolutionPlanning']) record(`${key} true`, result[key] === true)
}
record('findingsUseApprovedNow false', result.findingsUseApprovedNow === false)
record('canProceedToControlledResearchRuntimeExecution false', result.canProceedToControlledResearchRuntimeExecution === false)
record('canRunResearchNow false', result.canRunResearchNow === false)
record('canUseFindings false', result.canUseFindings === false)
const riskIds = result.proofRetryReviewRiskDispositionRegister.risks.map((risk) => risk.riskId)
for (const risk of ['blocked_retry_misread_as_safe_command_shape', 'renderer_builder_success_overinterpreted', 'execution_retried_without_safe_command_shape']) record(`risk ${risk}`, riskIds.includes(risk))
const validation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewResult(result)
record('validation result ok', validation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryReviewResult(result))
record('serialize parse ok', parsed.status === result.status)
record('artifact exists', fsSync.existsSync(resultPath))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['proofRetryRetried', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'tempConfigModified', 'runRootModified', 'hermesExecuted', 'hermesExeExecuted', 'oneshotExecuted', 'promptSent', 'modelCalls', 'envSecretsRead', 'envFileRead', 'networkUsed', 'dnsResolved', 'endpointsTested', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted', 'uvPipPythonSetupExecuted']) record(`${key} false`, result.safeCommandShapeProofRetryReviewReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_RETRY_REVIEW_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Review Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof retry review status: ${result.proofRetryReviewStatus}`,
  `Proof retry result read: ${proofRetry.status}`,
  `Proof retry result review: ${result.proofRetryResultReview.reviewConclusion}`,
  `Source CLI contract failure accepted: ${result.sourceCliContractFailureAccepted}`,
  `Renderer proof accepted: ${result.rendererProofAccepted}`,
  `Wrapper builder proof accepted: ${result.wrapperBuilderProofAccepted}`,
  `No-defaults/no-toolsets failure accepted: ${result.noDefaultsNoToolsetsFailureAccepted}`,
  `Dry-run skip accepted: ${result.dryRunSkipAccepted}`,
  `Fail-closed proof accepted: ${result.failClosedProofAccepted}`,
  `Evidence manifest accepted: ${result.proofRetryEvidenceManifestReview.evidenceManifestAccepted}`,
  `Safety manifest accepted: ${result.proofRetrySafetyManifestReview.safetyManifestAccepted}`,
  `Limitations: ${result.proofRetryReviewLimitationsCarryForward.limitations.join(', ')}`,
  `Risks: ${result.proofRetryReviewRiskDispositionRegister.risks.map((risk) => risk.riskId).join(', ')}`,
  `Keep blocked envelope: ${result.keepHermesResearchBlockedDecisionEnvelope.envelopeId}`,
  `Alternate safe runtime envelope: ${result.alternateSafeRuntimeResolutionPlanningEnvelope.envelopeId}`,
  `Can proceed to keep Hermes research blocked decision: ${result.canProceedToKeepHermesResearchBlockedDecision}`,
  `Can proceed to alternate safe runtime resolution planning: ${result.canProceedToAlternateSafeRuntimeResolutionPlanning}`,
  `Can proceed to controlled research runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  '',
  'No proof retry retry, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
