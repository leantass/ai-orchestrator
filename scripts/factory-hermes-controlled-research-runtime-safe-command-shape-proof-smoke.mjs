import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProof } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-proof-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof', 'index.ts')).href)
const approval = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-approval-result.json'))
record('proof approval parsea', approval.status === 'safe_command_shape_proof_approval_granted')
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofInput({ provedAt: '2026-07-24T17:00:00.000Z', provedBy: 'smoke', proofApprovalResult: approval })
record('input validation ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProof()
record('proof result existe', fsSync.existsSync(resultPath))
record('status valid', ['safe_command_shape_proof_completed', 'safe_command_shape_proof_blocked', 'safe_command_shape_proof_failed'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_proven_for_execution_retry_review', 'hermes_safe_command_shape_proof_blocked_no_safe_command_shape', 'hermes_safe_command_shape_proof_failed_block_runtime'].includes(result.decision))
for (const key of ['safeCommandShapeSourceInspectionResult', 'safeCommandShapeCandidateEvaluationResult', 'staticCommandShapeProofResult', 'noDefaultsAndNoToolsetsProofResult', 'wrapperBoundaryCommandProofResult', 'nonNetworkDryRunProofResult', 'failClosedCommandConstructionProofResult', 'safeCommandShapeProofEvidenceManifest', 'safeCommandShapeProofReviewEnvelope']) record(`${key} presente`, Boolean(result[key]))
record('canProceedToSafeCommandShapeProofReview true', result.canProceedToSafeCommandShapeProofReview === true)
for (const key of ['controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canRunResearchNow', 'canUseFindings', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow']) record(`${key} false`, result[key] === false)
if (result.status === 'safe_command_shape_proof_blocked') {
  record('blocked safeCommandShapeProven false', result.safeCommandShapeProven === false)
  record('blocked failClosed passed', result.failClosedCommandConstructionProofPassed === true)
}
if (result.status === 'safe_command_shape_proof_completed') record('completed safeCommandShapeProven true', result.safeCommandShapeProven === true)
record('no credential values', JSON.stringify(result).includes('sk-') === false)
record('no .env read', result.safeCommandShapeProofReceipt.envRead === false)
record('no network usada', result.safeCommandShapeProofReceipt.networkUsed === false)
record('no DNS resuelto', result.safeCommandShapeProofReceipt.dnsResolved === false)
record('no endpoint tests', result.safeCommandShapeProofReceipt.endpointsTested === false)
record('no prompt enviado', result.safeCommandShapeProofReceipt.promptSent === false)
record('no model calls', result.safeCommandShapeProofReceipt.modelCalls === false)
record('no research execution', result.safeCommandShapeProofReceipt.researchExecution === false)
record('no adapter executed', result.safeCommandShapeProofReceipt.adapterExecuted === false)
record('no wrapper executed against Hermes', result.safeCommandShapeProofReceipt.wrapperExecutedAgainstHermes === false)
record('no findings promoted', result.safeCommandShapeProofReceipt.findingsPromoted === false)
record('dry-run skipped or recorded', result.dryRunExecuted === false && result.nonNetworkDryRunProofResult.skippedReason === 'safe_non_network_dry_run_not_proven')
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofResult(result)
record('result validation ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofResult(result))
record('serialize parse ok', parsed.status === result.status)
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_PROOF_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Proof Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof status: ${result.proofStatus}`,
  `Safe command shape proven: ${result.safeCommandShapeProven}`,
  `Dry-run executed: ${result.dryRunExecuted}`,
  `Can proceed to proof review: ${result.canProceedToSafeCommandShapeProofReview}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Proof approval read. Source inspection, candidate evaluation, static proof, no defaults/no toolsets proof, wrapper boundary proof, dry-run proof, fail-closed proof, proof decision, blockers, unknowns, limitations, and review envelope evaluated.',
  '',
  'No credential values read, no prompt sent, no model calls, no network, no DNS, no findings, no research execution, no adapter execution, no wrapper against Hermes, no uv/pip/python/setup.py.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, dryRunExecuted: result.dryRunExecuted, resultPath, reportPath }, null, 2))
