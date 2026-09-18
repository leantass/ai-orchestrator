import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeMockE2EApproval } from '../electron/factory/hermes-controlled-research-runtime-mock-e2e-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const planningPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-planning-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-mock-e2e-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }

record('mock E2E planning result exists', fsSync.existsSync(planningPath))
JSON.parse(await fs.readFile(planningPath, 'utf8'))
record('mock E2E planning parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeMockE2EApproval()
record('mock E2E approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['controlled_research_runtime_mock_e2e_approval_granted', 'controlled_research_runtime_mock_e2e_approval_blocked'].includes(result.status))
record('decision valid', ['factory_owned_mock_runtime_e2e_approved_for_execution_gate', 'factory_owned_mock_runtime_e2e_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'controlled_research_runtime_mock_e2e_approval_granted') {
  for (const key of ['mockE2EPlanReadinessReview', 'alternateSafeRuntimeVerificationAcceptanceReview', 'mockE2EScopePlanReview', 'mockPromptArtifactPlanReview', 'mockOutputContractPlanReview', 'mockRuntimeInputPlanReview', 'mockExecutionBoundaryPlanReview', 'mockNoToolEvidencePlanReview', 'mockOutputCaptureRedactionPlanReview', 'mockOutputReviewPlanReview', 'mockFindingsBlockPlanReview', 'nestedSmokeEpermVerificationNoteReview', 'mockE2EApprovalRiskDispositionRegister', 'mockE2EExecutionGateEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['mockE2EPlanAccepted', 'alternateSafeRuntimeVerificationAcceptanceAccepted', 'mockE2EScopePlanAccepted', 'mockPromptArtifactPlanAccepted', 'mockOutputContractPlanAccepted', 'mockRuntimeInputPlanAccepted', 'mockExecutionBoundaryPlanAccepted', 'mockNoToolEvidencePlanAccepted', 'mockOutputCaptureRedactionPlanAccepted', 'mockOutputReviewPlanAccepted', 'mockFindingsBlockPlanAccepted', 'nestedSmokeEpermVerificationNoteAccepted', 'mockE2EExecutionGateAllowed', 'canProceedToMockE2EExecution']) record(`${key} true`, result[key] === true)
}
for (const key of ['mockE2EExecutedNow', 'providerRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimePlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings', 'canReadProcessEnvNow']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['mockE2EExecuted', 'runtimeExecuted', 'researchExecuted', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.mockE2EApprovalReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_MOCK_E2E_APPROVAL_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Mock E2E Approval Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Mock E2E planning read: ${fsSync.existsSync(planningPath)}`, `Verification read: ${Boolean(result.verificationRef)}`, `Readiness review: ${Boolean(result.mockE2EPlanReadinessReview)}`, `Verification acceptance review: ${Boolean(result.alternateSafeRuntimeVerificationAcceptanceReview)}`, `Mock scope review: ${Boolean(result.mockE2EScopePlanReview)}`, `Mock prompt artifact review: ${Boolean(result.mockPromptArtifactPlanReview)}`, `Mock output contract review: ${Boolean(result.mockOutputContractPlanReview)}`, `Mock runtime input review: ${Boolean(result.mockRuntimeInputPlanReview)}`, `Mock execution boundary review: ${Boolean(result.mockExecutionBoundaryPlanReview)}`, `No-tool evidence review: ${Boolean(result.mockNoToolEvidencePlanReview)}`, `Output capture/redaction review: ${Boolean(result.mockOutputCaptureRedactionPlanReview)}`, `Mock output review: ${Boolean(result.mockOutputReviewPlanReview)}`, `Mock findings block review: ${Boolean(result.mockFindingsBlockPlanReview)}`, `Nested EPERM note review: ${Boolean(result.nestedSmokeEpermVerificationNoteReview)}`, `Limitations carry-forward: ${Boolean(result.mockE2EApprovalLimitationsCarryForward)}`, `Risk disposition register: ${Boolean(result.mockE2EApprovalRiskDispositionRegister)}`, `Mock E2E execution gate envelope: ${result.mockE2EExecutionGateEnvelope?.envelopeId || 'none'}`, `Can proceed to mock E2E execution: ${result.canProceedToMockE2EExecution}`, `Can proceed to provider runtime planning: ${result.canProceedToProviderRuntimePlanning}`, `Can proceed to controlled research runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Mock E2E approval only. No mock execution, no runtime execution, no research execution, no Hermes, no prompt, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
