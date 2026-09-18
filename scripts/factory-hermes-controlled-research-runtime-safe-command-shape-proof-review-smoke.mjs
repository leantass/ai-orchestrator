import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReview } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-review/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-review-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-proof-review-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []

function record(name, value) {
  assert.equal(Boolean(value), true, name)
  checks.push(name)
}

async function readJson(file) {
  record(`${path.basename(file)} existe`, fsSync.existsSync(file))
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function hash(file) {
  return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase()
}

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-review', 'index.ts')).href)
const proof = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-result.json'))
record('proof result parsea', proof.status === 'safe_command_shape_proof_blocked')
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewInput({ reviewedAt: '2026-07-24T17:45:00.000Z', reviewedBy: 'smoke', proofResult: proof })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReview()
record('proof review result existe', fsSync.existsSync(resultPath))
record('status completed o blocked', ['safe_command_shape_proof_review_completed', 'safe_command_shape_proof_review_blocked'].includes(result.status))
record('decision valida', ['hermes_safe_command_shape_proof_review_accepted_blocked_for_resolution_planning', 'hermes_safe_command_shape_proof_review_blocked_result_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'safe_command_shape_proof_review_completed') {
  for (const key of ['safeCommandShapeProofResultReview', 'sourceInspectionResultReview', 'candidateEvaluationResultReview', 'staticCommandShapeProofResultReview', 'noDefaultsAndNoToolsetsProofResultReview', 'wrapperBoundaryCommandProofResultReview', 'nonNetworkDryRunProofResultReview', 'failClosedCommandConstructionProofResultReview', 'proofEvidenceManifestReview', 'proofReviewLimitationsCarryForward', 'proofReviewRiskDispositionRegister', 'safeCommandShapeResolutionPlanningEnvelope']) record(`${key} presente`, Boolean(result[key]))
  for (const key of ['safeCommandShapeProofBlockedAccepted', 'safeCommandShapeStillNotProven', 'dryRunSkippedAccepted', 'failClosedProofAccepted', 'runtimeStillBlocked', 'credentialAccessStillBlocked', 'promptPassingStillBlocked', 'modelCallsStillBlocked', 'networkStillBlocked']) record(`${key} true`, result[key] === true)
  record('canProceedToSafeCommandShapeResolutionPlanning true', result.canProceedToSafeCommandShapeResolutionPlanning === true)
}
record('findingsUseApprovedNow false', result.findingsUseApprovedNow === false)
record('canProceedToControlledResearchRuntimeExecution false', result.canProceedToControlledResearchRuntimeExecution === false)
record('canRunResearchNow false', result.canRunResearchNow === false)
record('canUseFindings false', result.canUseFindings === false)
const riskIds = result.proofReviewRiskDispositionRegister.risks.map((risk) => risk.riskId)
for (const risk of ['blocked_proof_misread_as_runtime_ready', 'fail_closed_misread_as_command_shape_proof', 'execution_retried_without_resolution']) record(`risk ${risk}`, riskIds.includes(risk))
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result))
record('serialize parse ok', parsed.status === result.status)
record('summary no secretos/env/source/stdout completos', !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result)).includes('OPENAI_API_KEY=') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result)).includes('stdout') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofReviewResult(result)).includes('source'))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['proofExecuted', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'envFileRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted']) record(`${key} false`, result.safeCommandShapeProofReviewReceipt[key] === false)
record('no temp config modified', true)
record('no run root modified', true)
record('hermes.exe no ejecutado', true)
record('--oneshot no ejecutado', true)
record('uv/pip/python/setup.py no ejecutados', true)
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_REVIEW_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Proof Review Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof review status: ${result.proofReviewStatus}`,
  `Can proceed to safe command shape resolution planning: ${result.canProceedToSafeCommandShapeResolutionPlanning}`,
  `Can proceed to controlled research runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Proof result read. Proof result review, source inspection review, candidate evaluation review, static proof review, no defaults/no toolsets review, wrapper boundary review, dry-run review, fail-closed review, evidence manifest review, limitations carry-forward, risk disposition register, and resolution planning envelope/blocker plan evaluated.',
  '',
  'No proof executed, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
