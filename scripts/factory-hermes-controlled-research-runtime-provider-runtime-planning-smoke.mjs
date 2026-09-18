import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeProviderRuntimePlanning } from '../electron/factory/hermes-controlled-research-runtime-provider-runtime-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const reviewPath = path.join(installRoot, 'controlled-research-runtime-mock-e2e-review-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-provider-runtime-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }

record('mock E2E review result exists', fsSync.existsSync(reviewPath))
JSON.parse(await fs.readFile(reviewPath, 'utf8'))
record('mock E2E review parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeProviderRuntimePlanning()
record('provider runtime planning result exists', fsSync.existsSync(resultPath))
record('status plan_created or blocked', ['controlled_research_runtime_provider_runtime_plan_created', 'controlled_research_runtime_provider_runtime_plan_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_plan_created_for_approval', 'factory_owned_provider_direct_runtime_plan_blocked_no_safe_plan'].includes(result.decision))
if (result.status === 'controlled_research_runtime_provider_runtime_plan_created') {
  for (const key of ['mockE2EReviewAcceptanceForProviderRuntimePlan', 'providerRuntimeScopePlan', 'providerPromptArtifactPlan', 'providerOutputContractPlan', 'providerRuntimeInputPlan', 'credentialAccessBoundaryPlan', 'networkModelBoundaryPlan', 'providerRequestEnvelopePlan', 'noToolProviderRequestPlan', 'providerTimeoutKillSwitchPlan', 'providerOutputCaptureRedactionPlan', 'providerOutputReviewPlan', 'outputIngestionGatePlan', 'findingsGatePlan', 'providerRuntimePlanningRiskRegister', 'providerRuntimeApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['providerRuntimeScopePlanBuilt', 'providerPromptArtifactPlanBuilt', 'providerOutputContractPlanBuilt', 'providerRuntimeInputPlanBuilt', 'credentialAccessBoundaryPlanBuilt', 'networkModelBoundaryPlanBuilt', 'providerRequestEnvelopePlanBuilt', 'noToolProviderRequestPlanBuilt', 'providerTimeoutKillSwitchPlanBuilt', 'providerOutputCaptureRedactionPlanBuilt', 'providerOutputReviewPlanBuilt', 'outputIngestionGatePlanBuilt', 'findingsGatePlanBuilt', 'providerRuntimeApprovalEnvelopeBuilt', 'canProceedToProviderRuntimeApproval']) record(`${key} true`, result[key] === true)
  record('selectedProvider openai', result.selectedProvider === 'openai')
  record('selectedModel gpt-4o-mini', result.selectedModel === 'gpt-4o-mini')
  record('selectedCredentialRef OPENAI_API_KEY', result.selectedCredentialRef === 'OPENAI_API_KEY')
  record('selectedHost api.openai.com', result.selectedHost === 'api.openai.com')
}
for (const key of ['providerRuntimeExecutedNow', 'providerRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingToProviderAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'dnsAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimeExecution', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings', 'canReadProcessEnvNow']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['providerRuntimeExecuted', 'realResearchExecuted', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.providerRuntimePlanningReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_PROVIDER_RUNTIME_PLANNING_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Provider Runtime Planning Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Mock E2E review read: ${fsSync.existsSync(reviewPath)}`, `Mock E2E review acceptance: ${result.mockE2EReviewAcceptedForProviderRuntimePlanning}`, `Provider runtime scope plan: ${result.providerRuntimeScopePlanBuilt}`, `Provider prompt artifact plan: ${result.providerPromptArtifactPlanBuilt}`, `Provider output contract plan: ${result.providerOutputContractPlanBuilt}`, `Provider runtime input plan: ${result.providerRuntimeInputPlanBuilt}`, `Credential access boundary plan: ${result.credentialAccessBoundaryPlanBuilt}`, `Network/model boundary plan: ${result.networkModelBoundaryPlanBuilt}`, `Provider request envelope plan: ${result.providerRequestEnvelopePlanBuilt}`, `No-tool provider request plan: ${result.noToolProviderRequestPlanBuilt}`, `Timeout/kill switch plan: ${result.providerTimeoutKillSwitchPlanBuilt}`, `Output capture/redaction plan: ${result.providerOutputCaptureRedactionPlanBuilt}`, `Provider output review plan: ${result.providerOutputReviewPlanBuilt}`, `Output ingestion gate plan: ${result.outputIngestionGatePlanBuilt}`, `Findings gate plan: ${result.findingsGatePlanBuilt}`, `Provider runtime approval envelope: ${result.providerRuntimeApprovalEnvelope?.envelopeId || 'none'}`, `Can proceed to provider runtime approval: ${result.canProceedToProviderRuntimeApproval}`, `Can proceed to provider runtime execution: ${result.canProceedToProviderRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Provider runtime planning only. No provider runtime execution, no real research, no Hermes, no prompt to provider, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
