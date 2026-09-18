import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeProviderRuntimeReview } from '../electron/factory/hermes-controlled-research-runtime-provider-runtime-review/index.cjs'
const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const providerRoot = path.join(installRoot, 'provider-runtime')
const executionPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-review-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-provider-runtime-review-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const artifactNames = ['PROVIDER_PROMPT_ARTIFACT.json', 'PROVIDER_OUTPUT_CONTRACT.json', 'PROVIDER_RUNTIME_INPUT.json', 'PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json', 'PROVIDER_RUNTIME_OUTPUT_RAW.json', 'PROVIDER_RUNTIME_OUTPUT_REDACTED.json', 'PROVIDER_RUNTIME_AUDIT.json', 'PROVIDER_RUNTIME_REVIEW_CANDIDATE.json']
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('provider runtime execution result exists', fsSync.existsSync(executionPath))
JSON.parse(await fs.readFile(executionPath, 'utf8'))
record('provider runtime execution result parses', true)
for (const name of artifactNames) record(`${name} exists`, fsSync.existsSync(path.join(providerRoot, name)))
const result = await executeFactoryHermesControlledResearchRuntimeProviderRuntimeReview()
record('review result exists', fsSync.existsSync(resultPath))
record('status completed or blocked', ['controlled_research_runtime_provider_runtime_review_completed', 'controlled_research_runtime_provider_runtime_review_blocked'].includes(result.status))
if (result.status === 'controlled_research_runtime_provider_runtime_review_completed') {
  for (const key of ['providerRuntimeExecutionResultReview', 'providerPromptArtifactReview', 'providerOutputContractReview', 'providerRuntimeInputReview', 'providerRequestEnvelopeRedactedReview', 'providerCredentialAccessReview', 'providerNetworkModelCallReview', 'providerRawOutputReview', 'providerRedactedOutputReview', 'providerOutputContractValidationReview', 'providerRuntimeInvalidOutputRootCauseReview', 'providerNoToolEvidenceReview', 'providerOutputIngestionBlockReview', 'providerFindingsBlockReview', 'providerRuntimeAuditReview', 'providerRuntimeReviewCandidateReview', 'providerRuntimeExecutionSafetyManifestReview', 'providerRuntimeRetryPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('providerRuntimeRetryPlanningAllowedNow true', result.providerRuntimeRetryPlanningAllowedNow === true)
  record('canProceedToProviderRuntimeRetryPlanning true', result.canProceedToProviderRuntimeRetryPlanning === true)
}
record('outputIngestionApprovedNow false', result.outputIngestionApprovedNow === false)
record('findingsUseApprovedNow false', result.findingsUseApprovedNow === false)
record('canProceedToOutputIngestionPlanning false', result.canProceedToOutputIngestionPlanning === false)
record('canRunResearchNow false', result.canRunResearchNow === false)
record('canUseFindings false', result.canUseFindings === false)
record('no second provider call', result.providerRuntimeReviewReceipt.secondProviderCallExecuted === false)
record('no network in review', result.providerRuntimeReviewReceipt.networkUsedInReview === false)
record('no process.env read in review', result.providerRuntimeReviewReceipt.processEnvReadInReview === false)
record('no credentials in review', result.providerRuntimeReviewReceipt.credentialValuesReadInReview === false)
record('no findings', result.providerRuntimeReviewReceipt.findingsPromoted === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_REVIEW_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Provider Runtime Review Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Execution result read: ${fsSync.existsSync(executionPath)}`, `Artifacts reviewed: ${artifactNames.length}`, `Output invalidated by contract: ${result.providerOutputContractInvalidAccepted}`, `Secrets/tools absent: ${result.providerOutputContainsSecretsAcceptedFalse}/${result.providerOutputContainsToolMetadataAcceptedFalse}`, `Credential boundary accepted: ${result.providerCredentialBoundaryAccepted}`, `Network/model call accepted: ${result.providerNetworkModelCallAccepted}`, `Ingestion/findings blocked: ${result.providerOutputIngestionBlockAccepted}/${result.providerFindingsBlockAccepted}`, `Retry planning envelope: ${result.providerRuntimeRetryPlanningEnvelope?.envelopeId || 'none'}`, `Can proceed to provider runtime retry planning: ${result.canProceedToProviderRuntimeRetryPlanning}`, `Can proceed to output ingestion planning: ${result.canProceedToOutputIngestionPlanning}`, `Can run research now: ${result.canRunResearchNow}`, '', 'No second provider call. No network. No process.env. No credentials. No findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
