import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeOutputIngestionApproval } from '../electron/factory/hermes-controlled-research-runtime-output-ingestion-approval/index.cjs'
const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const planningPath = path.join(installRoot, 'controlled-research-runtime-output-ingestion-planning-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-output-ingestion-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-output-ingestion-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const forbiddenFutureArtifacts = ['OUTPUT_INGESTION_INPUT.json', 'OUTPUT_CANDIDATE_NORMALIZED.json', 'OUTPUT_CANDIDATE_PROVENANCE.json', 'OUTPUT_INGESTION_AUDIT.json', 'OUTPUT_INGESTION_REVIEW_CANDIDATE.json'].map((name) => path.join(installRoot, 'output-ingestion', name))
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('output ingestion planning result exists', fsSync.existsSync(planningPath))
JSON.parse(await fs.readFile(planningPath, 'utf8'))
record('planning result parses', true)
const result = await executeFactoryHermesControlledResearchRuntimeOutputIngestionApproval()
record('approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['controlled_research_runtime_output_ingestion_approval_granted', 'controlled_research_runtime_output_ingestion_approval_blocked'].includes(result.status))
record('decision valid', ['factory_owned_output_ingestion_approved_for_execution_gate', 'factory_owned_output_ingestion_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'controlled_research_runtime_output_ingestion_approval_granted') {
  for (const key of ['outputIngestionPlanReadinessReview', 'providerRuntimeRetryReviewAcceptanceForOutputIngestionReview', 'retryOutputValidityAcceptanceReview', 'outputIngestionScopePlanReview', 'outputCandidateStorePlanReview', 'normalizedOutputCandidatePlanReview', 'outputCandidateSchemaPlanReview', 'outputCandidateProvenancePlanReview', 'sourceArtifactReferencePlanReview', 'secretNoToolValidationCarryForwardPlanReview', 'outputIngestionValidationPlanReview', 'outputIngestionIdempotencyPlanReview', 'outputIngestionExecutionBoundaryPlanReview', 'outputIngestionReviewPlanReview', 'findingsBlockPlanReview', 'outputIngestionApprovalRiskDispositionRegister', 'outputIngestionExecutionGateEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('can proceed output ingestion execution true', result.canProceedToOutputIngestionExecution === true)
}
for (const key of ['outputIngestionExecutedNow', 'outputIngestionApprovedNow', 'outputIngestionExecutionAllowedNow', 'findingsUseApprovedNow', 'canProceedToFindingsReview', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const file of forbiddenFutureArtifacts) record(`future candidate artifact not created ${path.basename(file)}`, !fsSync.existsSync(file))
for (const key of ['outputIngestionExecution', 'candidateOutputCreated', 'findingsPromoted', 'providerRuntimeExecution', 'thirdProviderCall', 'realResearchExecution', 'hermesExecuted', 'promptSentToProvider', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'processEnvRead', 'dotEnvRead', 'credentialValuesRead', 'toolsEnabled']) record(`receipt ${key} false`, result.outputIngestionApprovalReceipt[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_OUTPUT_INGESTION_APPROVAL_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Output Ingestion Approval Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Output ingestion planning read: ${fsSync.existsSync(planningPath)}`, `Readiness review: ${Boolean(result.outputIngestionPlanReadinessReview)}`, `Source acceptance reviews: ${Boolean(result.providerRuntimeRetryReviewAcceptanceForOutputIngestionReview)}/${Boolean(result.retryOutputValidityAcceptanceReview)}`, `All plan reviews: ${result.outputIngestionPlanAccepted}`, `Limitations carry-forward: ${Boolean(result.outputIngestionApprovalLimitationsCarryForward)}`, `Risk register: ${Boolean(result.outputIngestionApprovalRiskDispositionRegister)}`, `Execution gate envelope: ${Boolean(result.outputIngestionExecutionGateEnvelope)}`, `Can proceed to output ingestion execution: ${result.canProceedToOutputIngestionExecution}`, `Can proceed to findings review: ${result.canProceedToFindingsReview}`, `Can run research now: ${result.canRunResearchNow}`, 'No provider call. No network. No process.env. No credentials. No output ingestion. No candidate output. No findings.', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
