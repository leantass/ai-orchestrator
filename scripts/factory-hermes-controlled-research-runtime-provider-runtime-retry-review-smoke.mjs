import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryReview } from '../electron/factory/hermes-controlled-research-runtime-provider-runtime-retry-review/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const providerRoot = path.join(installRoot, 'provider-runtime-retry')
const retryExecutionPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-execution-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-review-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-provider-runtime-retry-review-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const artifactNames = ['PROVIDER_RETRY_PROMPT_ARTIFACT.json', 'PROVIDER_RETRY_OUTPUT_CONTRACT.json', 'PROVIDER_RETRY_RUNTIME_INPUT.json', 'PROVIDER_RETRY_REQUEST_ENVELOPE_REDACTED.json', 'PROVIDER_RETRY_OUTPUT_RAW.json', 'PROVIDER_RETRY_OUTPUT_REDACTED.json', 'PROVIDER_RETRY_AUDIT.json', 'PROVIDER_RETRY_REVIEW_CANDIDATE.json']
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }

record('retry execution result exists', fsSync.existsSync(retryExecutionPath))
JSON.parse(await fs.readFile(retryExecutionPath, 'utf8'))
record('retry execution result parses', true)
for (const artifactName of artifactNames) {
  const artifactPath = path.join(providerRoot, artifactName)
  record(`${artifactName} exists`, fsSync.existsSync(artifactPath))
  JSON.parse(await fs.readFile(artifactPath, 'utf8'))
  record(`${artifactName} parses`, true)
}
const result = await executeFactoryHermesControlledResearchRuntimeProviderRuntimeRetryReview()
record('retry review result exists', fsSync.existsSync(resultPath))
record('status completed or blocked', ['controlled_research_runtime_provider_runtime_retry_review_completed', 'controlled_research_runtime_provider_runtime_retry_review_blocked'].includes(result.status))
if (result.status === 'controlled_research_runtime_provider_runtime_retry_review_completed') {
  for (const key of ['providerRuntimeRetryExecutionResultReview', 'providerRetryPromptArtifactReview', 'providerRetryOutputContractReview', 'providerRetryRuntimeInputReview', 'providerRetryRequestEnvelopeRedactedReview', 'providerRetryCredentialAccessReview', 'providerRetryNetworkModelCallReview', 'providerRetryRawOutputReview', 'providerRetryRedactedOutputReview', 'providerRetryOutputContractValidationReview', 'providerRetryNoToolEvidenceReview', 'providerRetryOutputIngestionBlockReview', 'providerRetryFindingsBlockReview', 'providerRetryRuntimeAuditReview', 'providerRetryRuntimeReviewCandidateReview', 'providerRetryExecutionSafetyManifestReview', 'outputIngestionPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('output ingestion planning allowed true', result.outputIngestionPlanningAllowedNow === true)
  record('can proceed output ingestion planning true', result.canProceedToOutputIngestionPlanning === true)
}
for (const key of ['outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToOutputIngestionExecution', 'canProceedToFindingsReview', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const key of ['thirdProviderCall', 'providerRuntimeExecution', 'realResearchExecution', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'processEnvRead', 'dotEnvRead', 'credentialValuesRead', 'toolsEnabled', 'outputIngestion', 'findingsPromoted']) record(`receipt ${key} false`, result.providerRuntimeRetryReviewReceipt[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_RETRY_REVIEW_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Provider Runtime Retry Review Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Retry execution read: ${fsSync.existsSync(retryExecutionPath)}`, 'Retry artifacts reviewed: true', `Valid JSON accepted for review: ${result.providerRetryOutputSchemaValidAccepted}`, `Secrets/tools absent: ${result.providerRetryOutputContainsSecretsAcceptedFalse}/${result.providerRetryOutputContainsToolMetadataAcceptedFalse}`, `Credential boundary accepted: ${result.providerRetryCredentialBoundaryAccepted}`, `Network/model call accepted: ${result.providerRetryNetworkModelCallAccepted}`, `Ingestion/findings blocked: ${result.outputIngestionApprovedNow}/${result.findingsUseApprovedNow}`, `Output ingestion planning envelope: ${Boolean(result.outputIngestionPlanningEnvelope)}`, `Can proceed to output ingestion planning: ${result.canProceedToOutputIngestionPlanning}`, `Can proceed to output ingestion execution: ${result.canProceedToOutputIngestionExecution}`, `Can run research now: ${result.canRunResearchNow}`, 'No third provider call. No network. No process.env. No credentials. No findings.', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
