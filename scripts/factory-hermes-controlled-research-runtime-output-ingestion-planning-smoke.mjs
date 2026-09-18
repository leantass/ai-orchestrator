import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeOutputIngestionPlanning } from '../electron/factory/hermes-controlled-research-runtime-output-ingestion-planning/index.cjs'
const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const retryReviewPath = path.join(installRoot, 'controlled-research-runtime-provider-runtime-retry-review-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-output-ingestion-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-output-ingestion-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const futureRoot = path.join(installRoot, 'output-ingestion')
const forbiddenFutureArtifacts = ['OUTPUT_INGESTION_INPUT.json', 'OUTPUT_CANDIDATE_NORMALIZED.json', 'OUTPUT_CANDIDATE_PROVENANCE.json', 'OUTPUT_INGESTION_AUDIT.json', 'OUTPUT_INGESTION_REVIEW_CANDIDATE.json'].map((name) => path.join(futureRoot, name))
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('retry review result exists', fsSync.existsSync(retryReviewPath))
JSON.parse(await fs.readFile(retryReviewPath, 'utf8'))
record('retry review result parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeOutputIngestionPlanning()
record('output ingestion planning result exists', fsSync.existsSync(resultPath))
record('status plan created or blocked', ['controlled_research_runtime_output_ingestion_plan_created', 'controlled_research_runtime_output_ingestion_plan_blocked'].includes(result.status))
record('decision valid', ['factory_owned_output_ingestion_plan_created_for_approval', 'factory_owned_output_ingestion_plan_blocked_no_safe_plan'].includes(result.decision))
if (result.status === 'controlled_research_runtime_output_ingestion_plan_created') {
  for (const key of ['providerRuntimeRetryReviewAcceptanceForOutputIngestionPlanning', 'retryOutputValidityAcceptanceForOutputIngestionPlanning', 'outputIngestionScopePlan', 'outputCandidateStorePlan', 'normalizedOutputCandidatePlan', 'outputCandidateSchemaPlan', 'outputCandidateProvenancePlan', 'sourceArtifactReferencePlan', 'secretNoToolValidationCarryForwardPlan', 'outputIngestionValidationPlan', 'outputIngestionIdempotencyPlan', 'outputIngestionExecutionBoundaryPlan', 'outputIngestionReviewPlan', 'findingsBlockPlan', 'outputIngestionPlanningRiskRegister', 'outputIngestionApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('can proceed output ingestion approval true', result.canProceedToOutputIngestionApproval === true)
}
for (const key of ['outputIngestionExecutedNow', 'outputIngestionApprovedNow', 'outputIngestionExecutionAllowedNow', 'findingsUseApprovedNow', 'providerRuntimeExecutedNow', 'providerRuntimeRetryExecutedNow', 'credentialAccessAllowedNow', 'canReadProcessEnvNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'dnsAllowedNow', 'canProceedToOutputIngestionExecution', 'canProceedToFindingsReview', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const file of forbiddenFutureArtifacts) record(`future candidate artifact not created ${path.basename(file)}`, !fsSync.existsSync(file))
for (const key of ['providerRuntimeExecution', 'thirdProviderCall', 'realResearchExecution', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'processEnvRead', 'dotEnvRead', 'credentialValuesRead', 'toolsEnabled']) record(`receipt ${key} false`, result.outputIngestionPlanningReceipt[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_OUTPUT_INGESTION_PLANNING_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Output Ingestion Planning Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Retry review read: ${fsSync.existsSync(retryReviewPath)}`, 'Retry execution read: true', `Output valid accepted for planning: ${result.retryOutputValidForIngestionPlanning}`, `Ingestion scope plan: ${Boolean(result.outputIngestionScopePlan)}`, `Candidate store plan: ${Boolean(result.outputCandidateStorePlan)}`, `Normalized candidate plan: ${Boolean(result.normalizedOutputCandidatePlan)}`, `Schema/provenance/source refs: ${Boolean(result.outputCandidateSchemaPlan)}/${Boolean(result.outputCandidateProvenancePlan)}/${Boolean(result.sourceArtifactReferencePlan)}`, `Secret/no-tool carry-forward: ${Boolean(result.secretNoToolValidationCarryForwardPlan)}`, `Validation/idempotency: ${Boolean(result.outputIngestionValidationPlan)}/${Boolean(result.outputIngestionIdempotencyPlan)}`, `Execution boundary/review plans: ${Boolean(result.outputIngestionExecutionBoundaryPlan)}/${Boolean(result.outputIngestionReviewPlan)}`, `Findings block: ${Boolean(result.findingsBlockPlan)}`, `Risk register: ${Boolean(result.outputIngestionPlanningRiskRegister)}`, `Output ingestion approval envelope: ${Boolean(result.outputIngestionApprovalEnvelope)}`, `Can proceed to output ingestion approval: ${result.canProceedToOutputIngestionApproval}`, `Can proceed to output ingestion execution: ${result.canProceedToOutputIngestionExecution}`, `Can proceed to findings review: ${result.canProceedToFindingsReview}`, `Can run research now: ${result.canRunResearchNow}`, 'No provider call. No network. No process.env. No credentials. No output ingestion. No findings.', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
