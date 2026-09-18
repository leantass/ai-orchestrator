import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const providerRoot = path.join(installRoot, 'provider-runtime-retry')
const approvalPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-approval-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-execution-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-provider-runtime-retry-execution-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const artifactPaths = {
  prompt: path.join(providerRoot, 'PROVIDER_RETRY_PROMPT_ARTIFACT.json'),
  contract: path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_CONTRACT.json'),
  input: path.join(providerRoot, 'PROVIDER_RETRY_RUNTIME_INPUT.json'),
  envelope: path.join(providerRoot, 'PROVIDER_RETRY_REQUEST_ENVELOPE_REDACTED.json'),
  raw: path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_RAW.json'),
  redacted: path.join(providerRoot, 'PROVIDER_RETRY_OUTPUT_REDACTED.json'),
  audit: path.join(providerRoot, 'PROVIDER_RETRY_AUDIT.json'),
  review: path.join(providerRoot, 'PROVIDER_RETRY_REVIEW_CANDIDATE.json'),
}
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function readJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
function assertNoCredentialText(name, text) {
  record(`${name} no authorization bearer value`, !/Bearer\s+(?!\[REDACTED\])[A-Za-z0-9._\-]+/.test(text))
  record(`${name} no sk-like token`, !/sk-[A-Za-z0-9_\-]{12,}/.test(text))
  record(`${name} no env dump`, !/OPENAI_API_KEY=|process\.env|ALLUSERSPROFILE=|Path=|USERNAME=/.test(text))
}

record('retry approval result exists', fsSync.existsSync(approvalPath))
record('retry execution result exists', fsSync.existsSync(resultPath))
const approval = await readJson(approvalPath)
const result = await readJson(resultPath)
record('approval granted', approval.status === 'controlled_research_runtime_provider_runtime_retry_approval_granted')
record('status completed blocked or failed', ['controlled_research_runtime_provider_runtime_retry_execution_completed', 'controlled_research_runtime_provider_runtime_retry_execution_blocked', 'controlled_research_runtime_provider_runtime_retry_execution_failed'].includes(result.status))
record('decision present', typeof result.decision === 'string' && result.decision.length > 0)
record('review envelope present', Boolean(result.providerRuntimeRetryReviewEnvelope))
record('can proceed retry review true', result.canProceedToProviderRuntimeRetryReview === true)
record('can proceed output ingestion false', result.canProceedToOutputIngestionPlanning === false)
record('output ingestion false', result.outputIngestionApprovedNow === false)
record('findings false', result.findingsUseApprovedNow === false)
record('can run research false', result.canRunResearchNow === false)
record('dotEnvRead false', result.dotEnvRead === false)
record('credential persisted false', result.credentialValuePersisted === false)
record('credential logged false', result.credentialValueLogged === false)
record('credential written false', result.credentialValueWrittenToArtifacts === false)
record('tool metadata false', result.providerRetryOutputContainsToolMetadata === false)
record('secrets false', result.providerRetryOutputContainsSecrets === false)
record('no tool evidence present', result.providerRetryNoToolEvidencePresent === true)
record('runtime request count max one', result.providerRetryNetworkModelCallResult?.requestAttempted === false || result.providerRetryNetworkModelCallResult?.singleRequest === true)
record('safety max requests one', result.providerRetryExecutionSafetyManifest?.maxRequests === 1)
record('safety no tools', result.providerRetryExecutionSafetyManifest?.toolsEnabled === false)
record('safety no findings', result.providerRetryExecutionSafetyManifest?.findingsPromoted === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')

for (const [name, file] of Object.entries(artifactPaths)) {
  if (result.status === 'controlled_research_runtime_provider_runtime_retry_execution_completed' || fsSync.existsSync(file)) {
    record(`${name} artifact exists`, fsSync.existsSync(file))
    const text = await fs.readFile(file, 'utf8')
    JSON.parse(text)
    record(`${name} artifact parses`, true)
    assertNoCredentialText(`${name} artifact`, text)
  }
}
record('authorization header redacted', (await readJson(artifactPaths.envelope)).authorizationHeader === 'Bearer [REDACTED]')
record('raw output not findings', (await readJson(artifactPaths.raw)).rawOutputPromotedToFindings === false)
record('redacted output redacted', (await readJson(artifactPaths.redacted)).redacted === true)
record('audit max one retry', (await readJson(artifactPaths.audit)).maxRequests === 1)
record('review candidate no findings', (await readJson(artifactPaths.review)).findingsUseApprovedNow === false)

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Provider Runtime Retry Execution Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Retry approval read: ${fsSync.existsSync(approvalPath)}`,
  `Retry prompt artifact result: ${Boolean(result.providerRetryPromptArtifactResult)}`,
  `Retry output contract result: ${Boolean(result.providerRetryOutputContractResult)}`,
  `Retry runtime input result: ${Boolean(result.providerRetryRuntimeInputResult)}`,
  `Retry redacted request envelope result: ${Boolean(result.providerRetryRequestEnvelopeRedactedResult)}`,
  `Retry credential access result: ${JSON.stringify(result.providerRetryCredentialAccessResult)}`,
  `Retry network/model call result: ${JSON.stringify(result.providerRetryNetworkModelCallResult)}`,
  `Retry raw output result: ${Boolean(result.providerRetryRawOutputResult)}`,
  `Retry output redaction result: ${Boolean(result.providerRetryOutputRedactionResult)}`,
  `Retry output validation/no-tool/secret scan: ${result.providerRetryOutputSchemaValid}/${result.providerRetryNoToolEvidencePresent}/${result.providerRetryOutputContainsSecrets}`,
  `Retry audit result: ${Boolean(result.providerRetryRuntimeAuditResult)}`,
  `Retry review candidate: ${Boolean(result.providerRetryRuntimeReviewCandidateResult)}`,
  `Retry safety manifest: ${Boolean(result.providerRetryExecutionSafetyManifest)}`,
  `Retry review envelope: ${Boolean(result.providerRuntimeRetryReviewEnvelope)}`,
  `Second real provider call made exactly once: ${result.providerRuntimeRetrySingleRequestExecuted}`,
  `Retry output JSON valid: ${result.providerRetryOutputSchemaValid}`,
  `Can proceed to provider runtime retry review: ${result.canProceedToProviderRuntimeRetryReview}`,
  `Can proceed to output ingestion planning: ${result.canProceedToOutputIngestionPlanning}`,
  `Can run research now: ${result.canRunResearchNow}`,
  'No findings promoted.',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
