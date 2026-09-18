import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeMockE2EExecution } from '../electron/factory/hermes-controlled-research-runtime-mock-e2e-execution/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const mockRoot = path.join(installRoot, 'mock-e2e')
const approvalPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-approval-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-execution-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-mock-e2e-execution-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }

record('mock E2E approval result exists', fsSync.existsSync(approvalPath))
JSON.parse(await fs.readFile(approvalPath, 'utf8'))
record('mock E2E approval parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeMockE2EExecution()
record('mock E2E execution result exists', fsSync.existsSync(resultPath))
record('status completed blocked or failed', ['controlled_research_runtime_mock_e2e_execution_completed', 'controlled_research_runtime_mock_e2e_execution_blocked', 'controlled_research_runtime_mock_e2e_execution_failed'].includes(result.status))
record('decision valid', ['factory_owned_mock_runtime_e2e_executed_for_review', 'factory_owned_mock_runtime_e2e_execution_blocked_unsafe_or_incomplete', 'factory_owned_mock_runtime_e2e_execution_failed_block_provider_runtime'].includes(result.decision))
if (result.status === 'controlled_research_runtime_mock_e2e_execution_completed') {
  for (const name of ['MOCK_PROMPT_ARTIFACT.json', 'MOCK_OUTPUT_CONTRACT.json', 'MOCK_E2E_INPUT.json', 'MOCK_E2E_OUTPUT_RAW.json', 'MOCK_E2E_OUTPUT_REDACTED.json', 'MOCK_E2E_AUDIT.json', 'MOCK_E2E_REVIEW_CANDIDATE.json']) record(`${name} exists`, fsSync.existsSync(path.join(mockRoot, name)))
  for (const key of ['mockRuntimeExecuted', 'mockOutputSchemaValid', 'mockNoToolEvidencePresent', 'mockE2EExecutedNow', 'canProceedToMockE2EReview']) record(`${key} true`, result[key] === true)
  record('mock output is real research false', result.mockOutputIsRealResearch === false)
  record('findings use false in raw output', result.mockOutputRawResult.artifact.findingsUseApprovedNow === false)
}
for (const key of ['providerRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingToProviderAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimePlanning', 'canRunResearchNow', 'canUseFindings', 'canReadProcessEnvNow']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['providerRuntimeExecuted', 'realResearchExecuted', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.mockE2EExecutionReceipt[key] === false)
record('artifacts under codex temp', result.mockPromptArtifactResult.artifactRef.startsWith('mock-e2e/'))
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_EXECUTION_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Mock E2E Execution Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Mock E2E approval read: ${fsSync.existsSync(approvalPath)}`, `Mock prompt artifact result: ${result.mockPromptArtifactCreated}`, `Mock output contract result: ${result.mockOutputContractCreated}`, `Mock input result: ${result.mockE2EInputCreated}`, `Mock runtime execution result: ${result.mockRuntimeExecuted}`, `Raw output result: ${result.mockRawOutputCreated}`, `Redacted output result: ${result.mockRedactedOutputCreated}`, `Audit result: ${result.mockAuditCreated}`, `Review candidate result: ${result.mockReviewCandidateCreated}`, `No-tool evidence result: ${result.mockNoToolEvidencePresent}`, `Findings block result: ${Boolean(result.mockFindingsBlockResult)}`, `Safety manifest: ${Boolean(result.mockE2EExecutionSafetyManifest)}`, `Mock E2E review envelope: ${result.mockE2EReviewEnvelope?.envelopeId || 'none'}`, `Can proceed to mock E2E review: ${result.canProceedToMockE2EReview}`, `Can proceed to provider runtime planning: ${result.canProceedToProviderRuntimePlanning}`, `Can proceed to controlled research runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Mock E2E executed only if completed. No provider runtime, no real research, no Hermes, no prompt to provider, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
