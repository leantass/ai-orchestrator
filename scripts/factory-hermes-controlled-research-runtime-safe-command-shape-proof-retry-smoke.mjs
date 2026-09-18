import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetry } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-proof-retry/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const approvalPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-approval-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-proof-retry', 'index.ts')).href)
const approval = await readJson(approvalPath)
record('proof retry approval parses', approval.status === 'safe_command_shape_proof_retry_approval_granted')
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetry()
record('proof retry result exists', fsSync.existsSync(resultPath))
record('status completed blocked or failed', ['safe_command_shape_proof_retry_completed', 'safe_command_shape_proof_retry_blocked', 'safe_command_shape_proof_retry_failed'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_proof_retry_proven_for_review', 'hermes_safe_command_shape_proof_retry_blocked_no_safe_command_shape', 'hermes_safe_command_shape_proof_retry_failed_block_runtime'].includes(result.decision))
for (const key of ['sourceCliContractProofRetryResult', 'rendererCommandShapeProofRetryResult', 'wrapperBuilderProofRetryResult', 'noDefaultsNoToolsetsProofRetryResult', 'nonNetworkDryRunRetryAssessmentResult', 'failClosedProofRetryResult', 'proofRetryEvidenceManifest', 'proofRetrySafetyManifest', 'safeCommandShapeProofRetryReviewEnvelope']) record(`${key} present`, Boolean(result[key]))
record('proofRetryExecutedNow true', result.proofRetryExecutedNow === true)
for (const key of ['controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('canProceedToSafeCommandShapeProofRetryReview true', result.canProceedToSafeCommandShapeProofRetryReview === true)
if (result.status === 'safe_command_shape_proof_retry_completed') record('completed proves command shape', result.safeCommandShapeProven === true)
if (result.status === 'safe_command_shape_proof_retry_blocked') record('blocked does not prove command shape', result.safeCommandShapeProven === false)
if (result.status === 'safe_command_shape_proof_retry_failed') record('failed does not prove command shape', result.safeCommandShapeProven === false)
for (const [key, expected] of Object.entries({ credentialValuesRead: false, dotEnvRead: false, networkUsed: false, dnsResolved: false, endpointTests: false, promptSent: false, modelCallsMade: false, researchExecuted: false, adapterExecuted: false, wrapperExecutedAgainstHermes: false, findingsPromoted: false })) record(`safety ${key}`, result.proofRetrySafetyManifest[key] === expected)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
const validation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryResult(result)
record('validation result ok', validation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeProofRetryResult(result))
record('serialize parse ok', parsed.status === result.status)
const serialized = JSON.stringify(result)
record('no credential values leaked', !serialized.includes('OPENAI_API_KEY=') && !serialized.includes('sk-'))
record('no dotenv path read marker', result.proofRetrySafetyManifest.dotEnvRead === false)

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof retry status: ${result.proofRetryStatus}`,
  `Proof retry approval read: ${approval.status}`,
  `Source CLI contract proof passed: ${result.sourceCliContractProofPassed}`,
  `Renderer proof passed: ${result.rendererCommandShapeProofPassed}`,
  `Wrapper builder proof passed: ${result.wrapperBuilderProofPassed}`,
  `No-defaults/no-toolsets proof passed: ${result.noDefaultsNoToolsetsProofPassed}`,
  `Dry-run retry executed: ${result.dryRunRetryExecuted}`,
  `Dry-run retry passed: ${result.dryRunRetryPassed}`,
  `Fail-closed proof passed: ${result.failClosedProofPassed}`,
  `Safe command shape proven: ${result.safeCommandShapeProven}`,
  `Blockers: ${result.blockers.length}`,
  `Unknowns: ${result.proofRetryEvidenceManifest.unknowns.join(', ')}`,
  `Review envelope: ${result.safeCommandShapeProofRetryReviewEnvelope.envelopeId}`,
  `Can proceed to proof retry review: ${result.canProceedToSafeCommandShapeProofRetryReview}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  '',
  'No credentials, no .env, no prompt sent, no model calls, no network, no DNS, no endpoint tests, no adapter, no Hermes runtime, no wrapper against Hermes runtime, no output ingestion, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, safeCommandShapeProven: result.safeCommandShapeProven, dryRunRetryExecuted: result.dryRunRetryExecuted, resultPath, reportPath }, null, 2))
