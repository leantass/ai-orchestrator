import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeProviderRuntimeApproval } from '../electron/factory/hermes-controlled-research-runtime-provider-runtime-approval/index.cjs'
const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const planningPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-provider-runtime-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('provider runtime planning result exists', fsSync.existsSync(planningPath))
JSON.parse(await fs.readFile(planningPath, 'utf8'))
record('provider runtime planning parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeProviderRuntimeApproval()
record('provider runtime approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['controlled_research_runtime_provider_runtime_approval_granted', 'controlled_research_runtime_provider_runtime_approval_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_approved_for_execution_planning', 'factory_owned_provider_direct_runtime_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'controlled_research_runtime_provider_runtime_approval_granted') {
  for (const key of ['providerRuntimePlanReadinessReview', 'mockE2EReviewAcceptanceForProviderRuntimeReview', 'providerRuntimeScopePlanReview', 'providerPromptArtifactPlanReview', 'providerOutputContractPlanReview', 'providerRuntimeInputPlanReview', 'credentialAccessBoundaryPlanReview', 'networkModelBoundaryPlanReview', 'providerRequestEnvelopePlanReview', 'noToolProviderRequestPlanReview', 'providerTimeoutKillSwitchPlanReview', 'providerOutputCaptureRedactionPlanReview', 'providerOutputReviewPlanReview', 'outputIngestionGatePlanReview', 'findingsGatePlanReview', 'providerRuntimeApprovalRiskDispositionRegister', 'providerRuntimeExecutionPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['providerRuntimePlanAccepted', 'mockE2EReviewAcceptanceAccepted', 'providerRuntimeScopePlanAccepted', 'providerPromptArtifactPlanAccepted', 'providerOutputContractPlanAccepted', 'providerRuntimeInputPlanAccepted', 'credentialAccessBoundaryPlanAccepted', 'networkModelBoundaryPlanAccepted', 'providerRequestEnvelopePlanAccepted', 'noToolProviderRequestPlanAccepted', 'providerTimeoutKillSwitchPlanAccepted', 'providerOutputCaptureRedactionPlanAccepted', 'providerOutputReviewPlanAccepted', 'outputIngestionGatePlanAccepted', 'findingsGatePlanAccepted', 'providerRuntimeExecutionPlanningAllowed', 'canProceedToProviderRuntimeExecutionPlanning']) record(`${key} true`, result[key] === true)
  record('selectedProvider openai', result.selectedProvider === 'openai')
  record('selectedModel gpt-4o-mini', result.selectedModel === 'gpt-4o-mini')
  record('selectedCredentialRef OPENAI_API_KEY', result.selectedCredentialRef === 'OPENAI_API_KEY')
  record('selectedHost api.openai.com', result.selectedHost === 'api.openai.com')
}
for (const key of ['providerRuntimeExecutedNow', 'providerRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingToProviderAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'dnsAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimeExecution', 'canProceedToOutputIngestionPlanning', 'canRunResearchNow', 'canUseFindings', 'canReadProcessEnvNow']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['providerRuntimeExecuted', 'realResearchExecuted', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.providerRuntimeApprovalReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_APPROVAL_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Provider Runtime Approval Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Provider runtime planning read: ${fsSync.existsSync(planningPath)}`, `Readiness review: ${Boolean(result.providerRuntimePlanReadinessReview)}`, `Execution planning envelope: ${result.providerRuntimeExecutionPlanningEnvelope?.envelopeId || 'none'}`, `Can proceed to provider runtime execution planning: ${result.canProceedToProviderRuntimeExecutionPlanning}`, `Can proceed to provider runtime execution: ${result.canProceedToProviderRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Provider runtime approval only. No provider runtime execution, no real research, no Hermes, no prompt to provider, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
