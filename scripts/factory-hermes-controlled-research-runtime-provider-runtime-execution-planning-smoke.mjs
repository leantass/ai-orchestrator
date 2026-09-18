import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeProviderRuntimeExecutionPlanning } from '../electron/factory/hermes-controlled-research-runtime-provider-runtime-execution-planning/index.cjs'
const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const approvalPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-approval-result.json')
const planningPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-planning-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-execution-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-provider-runtime-execution-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const forbiddenFutureArtifacts = ['PROVIDER_PROMPT_ARTIFACT.json', 'PROVIDER_OUTPUT_CONTRACT.json', 'PROVIDER_RUNTIME_INPUT.json', 'PROVIDER_RUNTIME_REQUEST_ENVELOPE_REDACTED.json', 'PROVIDER_RUNTIME_OUTPUT_RAW.json', 'PROVIDER_RUNTIME_OUTPUT_REDACTED.json', 'PROVIDER_RUNTIME_AUDIT.json', 'PROVIDER_RUNTIME_REVIEW_CANDIDATE.json'].map((name) => path.join(installRoot, 'provider-runtime', name))
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('provider runtime approval result exists', fsSync.existsSync(approvalPath))
JSON.parse(await fs.readFile(approvalPath, 'utf8'))
record('provider runtime approval parses', true)
record('provider runtime planning result exists', fsSync.existsSync(planningPath))
JSON.parse(await fs.readFile(planningPath, 'utf8'))
record('provider runtime planning parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeProviderRuntimeExecutionPlanning()
record('execution planning result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['controlled_research_runtime_provider_runtime_execution_plan_created', 'controlled_research_runtime_provider_runtime_execution_plan_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_execution_plan_created_for_approval', 'factory_owned_provider_direct_runtime_execution_plan_blocked_no_safe_execution_plan'].includes(result.decision))
if (result.status === 'controlled_research_runtime_provider_runtime_execution_plan_created') {
  for (const key of ['providerRuntimeApprovalAcceptanceForExecutionPlanning', 'providerRuntimeExecutionScopePlan', 'providerPromptArtifactCreationPlan', 'providerOutputContractCreationPlan', 'providerRuntimeInputArtifactPlan', 'providerCredentialReadExecutionPlan', 'providerNetworkModelExecutionPlan', 'providerRequestEnvelopeExecutionPlan', 'providerNoToolExecutionPlan', 'providerTimeoutKillSwitchExecutionPlan', 'providerOutputCaptureRedactionExecutionPlan', 'providerRuntimeAuditPlan', 'providerRuntimeReviewPlan', 'outputIngestionPostRuntimePlan', 'findingsPostRuntimePlan', 'providerRuntimeExecutionPlanningRiskRegister', 'providerRuntimeExecutionApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['providerRuntimeApprovalAcceptedForExecutionPlanning', 'providerRuntimeExecutionScopePlanBuilt', 'providerPromptArtifactCreationPlanBuilt', 'providerOutputContractCreationPlanBuilt', 'providerRuntimeInputArtifactPlanBuilt', 'providerCredentialReadExecutionPlanBuilt', 'providerNetworkModelExecutionPlanBuilt', 'providerRequestEnvelopeExecutionPlanBuilt', 'providerNoToolExecutionPlanBuilt', 'providerTimeoutKillSwitchExecutionPlanBuilt', 'providerOutputCaptureRedactionExecutionPlanBuilt', 'providerRuntimeAuditPlanBuilt', 'providerRuntimeReviewPlanBuilt', 'outputIngestionPostRuntimePlanBuilt', 'findingsPostRuntimePlanBuilt', 'providerRuntimeExecutionApprovalEnvelopeBuilt', 'canProceedToProviderRuntimeExecutionApproval']) record(`${key} true`, result[key] === true)
  record('providerRuntimeExecutionPlanningStatus plan_candidate_created', result.providerRuntimeExecutionPlanningStatus === 'plan_candidate_created')
  record('selectedProvider openai', result.selectedProvider === 'openai')
  record('selectedModel gpt-4o-mini', result.selectedModel === 'gpt-4o-mini')
  record('selectedCredentialRef OPENAI_API_KEY', result.selectedCredentialRef === 'OPENAI_API_KEY')
  record('selectedHost api.openai.com', result.selectedHost === 'api.openai.com')
}
for (const key of ['providerRuntimeExecutedNow', 'providerRuntimeExecutionAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingToProviderAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'dnsAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToProviderRuntimeExecution', 'canProceedToOutputIngestionPlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings', 'canReadProcessEnvNow']) record(`${key} false`, result[key] === false)
for (const file of forbiddenFutureArtifacts) record(`future artifact not created ${path.basename(file)}`, !fsSync.existsSync(file))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['providerRuntimeExecuted', 'realResearchExecuted', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'dnsResolved', 'processEnvRead', 'credentialValuesRead', 'providerRuntimeArtifactsCreated', 'findingsPromoted']) record(`receipt ${key} false`, result.providerRuntimeExecutionPlanningReceipt[key] === false)
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Provider Runtime Execution Planning Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Provider runtime approval read: ${fsSync.existsSync(approvalPath)}`, `Execution approval envelope: ${result.providerRuntimeExecutionApprovalEnvelope?.envelopeId || 'none'}`, `Can proceed to provider runtime execution approval: ${result.canProceedToProviderRuntimeExecutionApproval}`, `Can proceed to provider runtime execution: ${result.canProceedToProviderRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Execution planning only. No provider runtime execution, no real research, no Hermes, no prompt to provider, no model calls, no network, no process.env, no credentials, no provider-runtime artifacts, no output ingestion, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
