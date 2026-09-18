import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeMockE2EPlanning } from '../electron/factory/hermes-controlled-research-runtime-mock-e2e-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const verificationPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-mock-e2e-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }

record('verification result exists', fsSync.existsSync(verificationPath))
JSON.parse(await fs.readFile(verificationPath, 'utf8'))
record('verification result parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeMockE2EPlanning()
record('mock E2E planning result exists', fsSync.existsSync(resultPath))
record('status plan_created or blocked', ['controlled_research_runtime_mock_e2e_plan_created', 'controlled_research_runtime_mock_e2e_plan_blocked'].includes(result.status))
record('decision valid', ['factory_owned_mock_runtime_e2e_plan_created_for_approval', 'factory_owned_mock_runtime_e2e_plan_blocked_no_safe_plan'].includes(result.decision))
if (result.status === 'controlled_research_runtime_mock_e2e_plan_created') {
  for (const key of ['alternateSafeRuntimeVerificationAcceptanceForMockE2EPlan', 'mockE2EScopePlan', 'mockPromptArtifactPlan', 'mockOutputContractPlan', 'mockRuntimeInputPlan', 'mockExecutionBoundaryPlan', 'mockNoToolEvidencePlan', 'mockOutputCaptureRedactionPlan', 'mockOutputReviewPlan', 'mockFindingsBlockPlan', 'nestedSmokeEpermVerificationNote', 'mockE2EPlanningRiskRegister', 'mockE2EApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['alternateSafeRuntimeVerificationAcceptedForMockE2EPlanning', 'sharedContractsAvailableForMockE2E', 'mockRuntimeAvailableForMockE2E', 'providerDirectAdapterAvailableButNotExecutable', 'mockE2EScopePlanBuilt', 'mockPromptArtifactPlanBuilt', 'mockOutputContractPlanBuilt', 'mockRuntimeInputPlanBuilt', 'mockExecutionBoundaryPlanBuilt', 'mockNoToolEvidencePlanBuilt', 'mockOutputCaptureRedactionPlanBuilt', 'mockOutputReviewPlanBuilt', 'mockFindingsBlockPlanBuilt', 'nestedSmokeEpermVerificationNoteBuilt', 'mockE2EApprovalEnvelopeBuilt', 'canProceedToMockE2EApproval']) record(`${key} true`, result[key] === true)
}
for (const key of ['mockE2EExecutedNow', 'providerRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'providerRuntimePlanningAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToMockE2EExecution', 'canProceedToProviderRuntimePlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('canReadProcessEnvNow false', result.canReadProcessEnvNow === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['mockE2EExecuted', 'runtimeExecuted', 'researchExecuted', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.mockE2EPlanningReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_PLANNING_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Mock E2E Planning Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Verification result read: ${fsSync.existsSync(verificationPath)}`, `Verification acceptance: ${result.alternateSafeRuntimeVerificationAcceptedForMockE2EPlanning}`, `Mock E2E scope plan: ${result.mockE2EScopePlanBuilt}`, `Mock prompt artifact plan: ${result.mockPromptArtifactPlanBuilt}`, `Mock output contract plan: ${result.mockOutputContractPlanBuilt}`, `Mock runtime input plan: ${result.mockRuntimeInputPlanBuilt}`, `Mock execution boundary plan: ${result.mockExecutionBoundaryPlanBuilt}`, `No-tool evidence plan: ${result.mockNoToolEvidencePlanBuilt}`, `Output capture/redaction plan: ${result.mockOutputCaptureRedactionPlanBuilt}`, `Mock output review plan: ${result.mockOutputReviewPlanBuilt}`, `Mock findings block plan: ${result.mockFindingsBlockPlanBuilt}`, `Nested smoke EPERM note: ${result.nestedSmokeEpermVerificationNoteBuilt}`, `Risk register: ${Boolean(result.mockE2EPlanningRiskRegister)}`, `Mock E2E approval envelope: ${result.mockE2EApprovalEnvelope?.envelopeId || 'none'}`, `Can proceed to mock E2E approval: ${result.canProceedToMockE2EApproval}`, `Can proceed to mock E2E execution: ${result.canProceedToMockE2EExecution}`, `Can proceed to provider runtime planning: ${result.canProceedToProviderRuntimePlanning}`, `Can proceed to controlled research runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Mock E2E planning only. No mock execution, no runtime execution, no research execution, no Hermes, no prompt, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
