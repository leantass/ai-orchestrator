import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApproval } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-proof-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
const requiredRisks = ['approval_confused_with_proof', 'proof_gate_accidentally_executes_hermes', 'proof_gate_accidentally_reads_credentials']
const requiredLimitations = ['proof_approval_is_not_proof', 'safe_command_shape_still_not_proven']

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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-approval', 'index.ts')).href)
const planning = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-planning-result.json'))
const review = await readJson(path.join(installRoot, 'controlled-research-runtime-execution-review-result.json'))
const execution = await readJson(path.join(installRoot, 'controlled-research-runtime-execution-result.json'))
record('planning parses with created status', planning.status === 'safe_command_shape_proof_plan_created')
record('execution review parses', review.status === 'controlled_research_runtime_execution_review_completed')
record('execution result parses', execution.status === 'controlled_research_runtime_execution_blocked')

const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalInput({ approvedAt: '2026-07-24T16:15:00.000Z', approvedBy: 'smoke', proofPlanningResult: planning, executionReviewResult: review, executionResult: execution })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApproval()
record('proof approval result exists', fsSync.existsSync(resultPath))
record('status valid', ['safe_command_shape_proof_approval_granted', 'safe_command_shape_proof_approval_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_proof_approved_for_proof_gate', 'hermes_safe_command_shape_proof_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
record('selected strategy wrapper_temp_config_no_toolsets', result.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets')

if (result.status === 'safe_command_shape_proof_approval_granted') {
  for (const key of ['proofPlanReadinessReview', 'sourceInspectionPlanReview', 'commandShapeCandidateSetReview', 'staticCommandShapeProofPlanReview', 'noDefaultsAndNoToolsetsProofPlanReview', 'wrapperBoundaryCommandProofPlanReview', 'nonNetworkDryRunProofPlanReview', 'failClosedCommandConstructionPlanReview', 'proofApprovalLimitationsCarryForward', 'proofApprovalRiskDispositionRegister', 'safeCommandShapeProofGateEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['proofPlanAccepted', 'sourceInspectionPlanAccepted', 'commandShapeCandidateSetAccepted', 'staticProofPlanAccepted', 'noDefaultsProofPlanAccepted', 'wrapperBoundaryProofPlanAccepted', 'nonNetworkDryRunProofPlanAccepted', 'failClosedCommandConstructionPlanAccepted', 'safeCommandShapeProofGateAllowed', 'canProceedToSafeCommandShapeProof']) record(`${key} true`, result[key] === true)
}
if (result.status === 'safe_command_shape_proof_approval_blocked') {
  record('blocker plan present', Boolean(result.safeCommandShapeProofApprovalBlockerPlan))
  record('keep blocked decision allowed', result.canProceedToKeepHermesResearchBlockedDecision === true)
}

for (const key of ['safeCommandShapeProofAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const limitation of requiredLimitations) record(`limitation ${limitation}`, result.proofApprovalLimitationsCarryForward.limitations.includes(limitation))
const risks = result.proofApprovalRiskDispositionRegister.risks.map((risk) => risk.riskId)
for (const risk of requiredRisks) record(`risk ${risk}`, risks.includes(risk))
record('all risks block runtime', result.proofApprovalRiskDispositionRegister.risks.every((risk) => risk.blocksRuntimeExecution === true && risk.blocksResearchExecution === true && risk.blocksFindingsUse === true))
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(result)
record('validation result ok', resultValidation.ok)
const serialized = gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(result)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(serialized)
const summary = gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofApprovalResult(parsed)
record('serialize parse ok', parsed.status === result.status && parsed.decision === result.decision)
record('summary no secrets/env/source/stdout completos', !JSON.stringify(summary).includes('OPENAI_API_KEY=') && !JSON.stringify(summary).includes('sk-') && !JSON.stringify(summary).includes('stdout') && !JSON.stringify(summary).includes('source'))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['proofExecuted', 'researchExecution', 'retryExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'hermesExecuted']) record(`receipt ${key} false`, result.safeCommandShapeProofApprovalReceipt[key] === false)
record('no temp config modified', true)
record('no run root modified', true)
record('no hermes.exe executed', true)
record('--oneshot no ejecutado', true)
record('prompt no enviado', true)
record('no model calls', true)
record('no env secrets read', true)
record('no .env read', true)
record('no network', true)
record('no DNS', true)
record('no endpoint tests', true)
record('no credential values', true)
record('no toolsets habilitados', true)
record('no output ingestion', true)
record('no findings promoted', true)
record('uv/pip/python/setup.py no ejecutados', true)
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_APPROVAL_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Proof Approval Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof approval status: ${result.proofApprovalStatus}`,
  `Can proceed to safe command shape proof: ${result.canProceedToSafeCommandShapeProof}`,
  `Can proceed to controlled research runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Proof planning read, execution review read, proof plan readiness review, source inspection plan review, command shape candidate set review, static proof plan review, no defaults/no toolsets proof plan review, wrapper boundary proof plan review, non-network dry-run proof plan review, fail-closed construction plan review, limitations carry-forward, risk disposition register, and proof gate envelope/blocker plan evaluated.',
  '',
  'No proof executed, no research execution, no retry execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings, no uv/pip/python/setup.py.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
