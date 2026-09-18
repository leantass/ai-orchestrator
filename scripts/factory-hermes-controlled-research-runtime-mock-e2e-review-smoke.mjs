import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeMockE2EReview } from '../electron/factory/hermes-controlled-research-runtime-mock-e2e-review/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const mockRoot = path.join(installRoot, 'mock-e2e')
const executionPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-execution-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-review-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-mock-e2e-review-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }

record('mock E2E execution result exists', fsSync.existsSync(executionPath))
JSON.parse(await fs.readFile(executionPath, 'utf8'))
record('mock E2E execution parses', true)
for (const name of ['MOCK_PROMPT_ARTIFACT.json', 'MOCK_OUTPUT_CONTRACT.json', 'MOCK_E2E_INPUT.json', 'MOCK_E2E_OUTPUT_RAW.json', 'MOCK_E2E_OUTPUT_REDACTED.json', 'MOCK_E2E_AUDIT.json', 'MOCK_E2E_REVIEW_CANDIDATE.json']) record(`${name} exists`, fsSync.existsSync(path.join(mockRoot, name)))
const result = await executeFactoryHermesControlledResearchRuntimeMockE2EReview()
record('review result exists', fsSync.existsSync(resultPath))
record('status completed or blocked', ['controlled_research_runtime_mock_e2e_review_completed', 'controlled_research_runtime_mock_e2e_review_blocked'].includes(result.status))
record('decision valid', ['factory_owned_mock_runtime_e2e_review_accepted_for_provider_runtime_planning', 'factory_owned_mock_runtime_e2e_review_blocked_artifacts_invalid_or_unsafe'].includes(result.decision))
if (result.status === 'controlled_research_runtime_mock_e2e_review_completed') {
  for (const key of ['mockE2EExecutionResultReview', 'mockPromptArtifactReview', 'mockOutputContractReview', 'mockE2EInputReview', 'mockRawOutputReview', 'mockRedactedOutputReview', 'mockAuditReview', 'mockReviewCandidateReview', 'mockNoToolEvidenceReview', 'mockFindingsBlockReview', 'mockSafetyManifestReview', 'mockE2EReviewLimitationsCarryForward', 'mockE2EReviewRiskDispositionRegister', 'providerRuntimePlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['mockE2EExecutionAccepted', 'mockPromptArtifactAccepted', 'mockOutputContractAccepted', 'mockE2EInputAccepted', 'mockRawOutputAccepted', 'mockRedactedOutputAccepted', 'mockAuditAccepted', 'mockReviewCandidateAccepted', 'mockNoToolEvidenceAccepted', 'mockFindingsBlockAccepted', 'mockSafetyManifestAccepted', 'providerRuntimePlanningAllowedNow', 'canProceedToProviderRuntimePlanning']) record(`${key} true`, result[key] === true)
}
for (const key of ['mockOutputIsRealResearch', 'mockOutputCanBeFindings', 'providerRuntimeExecutionAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingToProviderAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimeExecution', 'canRunResearchNow', 'canUseFindings', 'canReadProcessEnvNow']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['mockReExecuted', 'providerRuntimeExecuted', 'realResearchExecuted', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.mockE2EReviewReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_REVIEW_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Mock E2E Review Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Mock E2E execution read: ${fsSync.existsSync(executionPath)}`, `Mock artifacts read: true`, `Execution review: ${Boolean(result.mockE2EExecutionResultReview)}`, `Prompt artifact review: ${Boolean(result.mockPromptArtifactReview)}`, `Output contract review: ${Boolean(result.mockOutputContractReview)}`, `Input review: ${Boolean(result.mockE2EInputReview)}`, `Raw/redacted output review: ${Boolean(result.mockRawOutputReview && result.mockRedactedOutputReview)}`, `Audit review: ${Boolean(result.mockAuditReview)}`, `Review candidate review: ${Boolean(result.mockReviewCandidateReview)}`, `No-tool evidence review: ${Boolean(result.mockNoToolEvidenceReview)}`, `Findings block review: ${Boolean(result.mockFindingsBlockReview)}`, `Safety manifest review: ${Boolean(result.mockSafetyManifestReview)}`, `Provider runtime planning envelope: ${result.providerRuntimePlanningEnvelope?.envelopeId || 'none'}`, `Can proceed to provider runtime planning: ${result.canProceedToProviderRuntimePlanning}`, `Can proceed to provider runtime execution: ${result.canProceedToProviderRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Mock E2E reviewed. No provider runtime, no mock re-execution, no real research, no Hermes, no prompt to provider, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
