import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeProviderRuntimeExecution } from '../electron/factory/hermes-controlled-research-runtime-provider-runtime-execution/index.cjs'
const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const providerRoot = path.join(installRoot, 'provider-runtime')
const approvalPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-approval-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-provider-runtime-execution-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const artifactNames = ['PROVIDER_PROMPT_ARTIFACT.json', 'PROVIDER_OUTPUT_CONTRACT.json', 'PROVIDER_RUNTIME_INPUT.json', 'PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json', 'PROVIDER_RUNTIME_OUTPUT_RAW.json', 'PROVIDER_RUNTIME_OUTPUT_REDACTED.json', 'PROVIDER_RUNTIME_AUDIT.json', 'PROVIDER_RUNTIME_REVIEW_CANDIDATE.json']
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('execution approval result exists', fsSync.existsSync(approvalPath))
JSON.parse(await fs.readFile(approvalPath, 'utf8'))
const result = await executeFactoryHermesControlledResearchRuntimeProviderRuntimeExecution()
record('execution result exists', fsSync.existsSync(resultPath))
record('status completed blocked or failed', ['controlled_research_runtime_provider_runtime_execution_completed', 'controlled_research_runtime_provider_runtime_execution_blocked', 'controlled_research_runtime_provider_runtime_execution_failed'].includes(result.status))
if (result.status === 'controlled_research_runtime_provider_runtime_execution_completed') {
  for (const name of artifactNames) record(`${name} exists`, fsSync.existsSync(path.join(providerRoot, name)))
  record('providerRuntimeExecuted true', result.providerRuntimeExecuted === true)
  record('providerRuntimeSingleRequestExecuted true', result.providerRuntimeSingleRequestExecuted === true)
  record('networkUsed true', result.networkUsed === true)
  record('modelCallExecuted true', result.modelCallExecuted === true)
}
if (result.status !== 'controlled_research_runtime_provider_runtime_execution_completed') {
  record('review envelope present when blocked or failed', Boolean(result.providerRuntimeReviewEnvelope))
  record('blocker plan present when blocked or failed', Boolean(result.providerRuntimeExecutionBlockerPlan))
}
const credential = process.env.OPENAI_API_KEY || ''
for (const name of artifactNames) {
  const file = path.join(providerRoot, name)
  if (fsSync.existsSync(file) && credential) {
    const text = await fs.readFile(file, 'utf8')
    record(`credential value not present in ${name}`, !text.includes(credential))
  }
}
const envelopeText = await fs.readFile(path.join(providerRoot, 'PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json'), 'utf8')
record('authorization header redacted', envelopeText.includes('[REDACTED]'))
record('dotEnvRead false', result.dotEnvRead === false)
record('no env dump', result.providerRuntimeExecutionSafetyManifest.envDumped === false)
record('tools enabled false', result.providerRuntimeExecutionSafetyManifest.toolsEnabled === false)
record('output ingestion false', result.outputIngestionApprovedNow === false)
record('findings false', result.findingsUseApprovedNow === false)
record('canProceedToProviderRuntimeReview true', result.canProceedToProviderRuntimeReview === true)
record('canProceedToOutputIngestionPlanning false', result.canProceedToOutputIngestionPlanning === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Provider Runtime Execution Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Execution approval read: ${fsSync.existsSync(approvalPath)}`, `Prompt artifact result: ${JSON.stringify(result.providerPromptArtifactResult)}`, `Output contract result: ${JSON.stringify(result.providerOutputContractResult)}`, `Runtime input result: ${JSON.stringify(result.providerRuntimeInputResult)}`, `Redacted request envelope result: ${JSON.stringify(result.providerRequestEnvelopeRedactedResult)}`, `Credential access result: ${JSON.stringify(result.providerCredentialAccessResult)}`, `Network/model call result: ${JSON.stringify(result.providerNetworkModelCallResult)}`, `Raw/redacted output result: ${JSON.stringify(result.providerRawOutputResult)} / ${JSON.stringify(result.providerOutputRedactionResult)}`, `Output validation/no-tool/secret scan: ${JSON.stringify(result.providerOutputContractValidationResult)} / ${JSON.stringify(result.providerNoToolEvidenceResult)} / ${JSON.stringify(result.providerRuntimeAuditResult)}`, `Review candidate: ${JSON.stringify(result.providerRuntimeReviewCandidateResult)}`, `Safety manifest: ${JSON.stringify(result.providerRuntimeExecutionSafetyManifest)}`, `Review envelope: ${result.providerRuntimeReviewEnvelope?.envelopeId}`, `Real provider call made: ${result.status === 'controlled_research_runtime_provider_runtime_execution_completed'}`, `Blocked/failed reason: ${result.providerRuntimeExecutionBlockerPlan?.reason || 'none'}`, `Can proceed to provider runtime review: ${result.canProceedToProviderRuntimeReview}`, `Can proceed to output ingestion planning: ${result.canProceedToOutputIngestionPlanning}`, `Can run research now: ${result.canRunResearchNow}`, '', 'No findings. Output ingestion remains false. Hermes CLI remains blocked.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
