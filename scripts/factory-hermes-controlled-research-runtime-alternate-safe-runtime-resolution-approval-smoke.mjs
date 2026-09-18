import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApproval } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const planningPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-planning-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []

function record(name, value) {
  assert.equal(Boolean(value), true, name)
  checks.push(name)
}

async function readJson(file) {
  record(`${path.basename(file)} exists`, fsSync.existsSync(file))
  return JSON.parse(await fs.readFile(file, 'utf8'))
}

async function hash(file) {
  return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase()
}

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-resolution-approval', 'index.ts')).href)
const planning = await readJson(planningPath)
record('alternate planning parses', planning.status === 'alternate_safe_runtime_resolution_plan_created')
const proofRetryReviewResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json'))
const runtimeSelectionDecisionResult = await readJson(path.join(installRoot, 'runtime-selection-decision-result.json'))
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalInput({ approvedAt: '2026-07-26T00:00:00.000Z', approvedBy: 'smoke', alternateRuntimeResolutionPlanningResult: planning, proofRetryReviewResult, runtimeSelectionDecisionResult })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApproval()
record('alternate approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['alternate_safe_runtime_resolution_approval_granted', 'alternate_safe_runtime_resolution_approval_blocked'].includes(result.status))
record('decision valid', ['hermes_cli_blocked_alternate_safe_runtime_resolution_approved_for_implementation_planning', 'alternate_safe_runtime_resolution_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_resolution_approval_granted') {
  for (const key of ['alternateRuntimePlanReadinessReview', 'hermesCliBlockedPathReviewReview', 'alternateRuntimeOptionCatalogReview', 'alternateRuntimeOptionEvaluationReview', 'selectedAlternateRuntimePathReview', 'factoryOwnedNoToolProviderAdapterPlanReview', 'providerDirectRuntimeBoundaryPlanReview', 'promptArtifactOutputContractPlanReview', 'credentialNetworkModelSafetyPlanReview', 'noToolEnforcementAndDetectionPlanReview', 'runtimeTimeoutKillSwitchPlanReview', 'outputReviewAndFindingsGatePlanReview', 'alternateRuntimeGovernanceRoadmapReview', 'alternateRuntimeResolutionApprovalRiskDispositionRegister', 'alternateSafeRuntimeImplementationPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('selected strategy provider direct', result.selectedAlternateRuntimeStrategy === 'factory_owned_no_tool_model_provider_direct_research_adapter')
  record('implementation planning allowed true', result.alternateRuntimeImplementationPlanningAllowed === true)
  record('can proceed implementation planning true', result.canProceedToAlternateSafeRuntimeImplementationPlanning === true)
}
record('Hermes CLI blocked true', result.hermesCliRuntimeBlocked === true)
for (const key of ['alternateRuntimeImplementationAllowedNow', 'alternateRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'networkAllowedNow', 'modelCallsAllowedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeImplementation', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['alternateAdapterImplemented', 'runtimeExecuted', 'researchExecuted', 'adapterExecuted', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'credentialValuesRead', 'findingsPromoted']) record(`${key} false`, result.alternateSafeRuntimeResolutionApprovalReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_APPROVAL_GATE_V1.md')))
const validation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalResult(result)
record('validation result ok', validation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalResult(gate.serializeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionApprovalResult(result))
record('serialize parse ok', parsed.status === result.status)

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Approval Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Alternate planning read: ${planning.status}`,
  `Plan readiness accepted: ${result.alternateRuntimePlanAccepted}`,
  `Hermes CLI blocked review accepted: ${result.hermesCliBlockedPathReviewAccepted}`,
  `Option catalog/evaluation accepted: ${result.alternateRuntimeOptionCatalogAccepted}/${result.alternateRuntimeOptionEvaluationAccepted}`,
  `Selected path accepted: ${result.selectedAlternateRuntimePathAccepted}`,
  `Provider adapter plan accepted: ${result.factoryOwnedNoToolProviderAdapterPlanAccepted}`,
  `Provider direct boundary accepted: ${result.providerDirectRuntimeBoundaryPlanAccepted}`,
  `Prompt/output contract accepted: ${result.promptArtifactOutputContractPlanAccepted}`,
  `Credential/network/model safety accepted: ${result.credentialNetworkModelSafetyPlanAccepted}`,
  `No-tool enforcement accepted: ${result.noToolEnforcementAndDetectionPlanAccepted}`,
  `Timeout/kill switch accepted: ${result.runtimeTimeoutKillSwitchPlanAccepted}`,
  `Output/findings review accepted: ${result.outputReviewAndFindingsGatePlanAccepted}`,
  `Governance roadmap accepted: ${result.governanceRoadmapAccepted}`,
  `Limitations: ${result.alternateRuntimeResolutionApprovalLimitationsCarryForward.limitations.join(', ')}`,
  `Risk count: ${result.alternateRuntimeResolutionApprovalRiskDispositionRegister.risks.length}`,
  `Implementation planning envelope: ${result.alternateSafeRuntimeImplementationPlanningEnvelope?.envelopeId || 'none'}`,
  `Can proceed to implementation planning: ${result.canProceedToAlternateSafeRuntimeImplementationPlanning}`,
  `Can proceed to implementation: ${result.canProceedToAlternateSafeRuntimeImplementation}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  '',
  'Hermes CLI remains blocked. No adapter implemented, no runtime execution, no research execution, no Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
