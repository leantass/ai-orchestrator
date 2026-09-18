import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanning } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const reviewPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-resolution-planning', 'index.ts')).href)
const review = await readJson(reviewPath)
record('proof retry review parses', review.status === 'safe_command_shape_proof_retry_review_completed')
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningInput({
  plannedAt: '2026-07-25T00:15:00.000Z',
  plannedBy: 'smoke',
  proofRetryReviewResult: review,
  proofRetryResult: await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-result.json')),
  resolutionVerificationResult: await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json')),
  runtimeSelectionDecisionResult: await readJson(path.join(installRoot, 'runtime-selection-decision-result.json')),
})
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanning()
record('alternate runtime planning result exists', fsSync.existsSync(resultPath))
record('status plan created or blocked', ['alternate_safe_runtime_resolution_plan_created', 'alternate_safe_runtime_resolution_plan_blocked'].includes(result.status))
record('decision valid', ['hermes_cli_blocked_alternate_safe_runtime_resolution_plan_created_for_approval', 'alternate_safe_runtime_resolution_plan_blocked_no_viable_safe_runtime_strategy'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_resolution_plan_created') {
  for (const key of ['hermesCliBlockedPathReview', 'alternateSafeRuntimeOptionCatalog', 'alternateSafeRuntimeOptionEvaluation', 'selectedAlternateRuntimePath', 'factoryOwnedNoToolProviderAdapterPlan', 'providerDirectRuntimeBoundaryPlan', 'promptArtifactOutputContractPlan', 'credentialNetworkModelSafetyPlan', 'noToolEnforcementAndDetectionPlan', 'runtimeTimeoutKillSwitchPlan', 'outputReviewAndFindingsGatePlan', 'alternateRuntimeGovernanceRoadmap', 'alternateRuntimeResolutionPlanningRiskRegister', 'alternateSafeRuntimeResolutionApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('selected strategy provider direct', result.selectedAlternateRuntimeStrategy === 'factory_owned_no_tool_model_provider_direct_research_adapter')
  record('can proceed to alternate approval true', result.canProceedToAlternateSafeRuntimeResolutionApproval === true)
}
record('Hermes CLI blocked true', result.hermesCliRuntimeBlocked === true)
record('safe fallback keep blocked', result.safeFallbackStrategy === 'keep_hermes_research_blocked')
for (const key of ['alternateRuntimeImplementedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeImplementation', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['alternateAdapterImplemented', 'runtimeExecuted', 'researchExecuted', 'adapterExecuted', 'hermesExecuted', 'modelCalls', 'networkUsed', 'credentialValuesRead', 'findingsPromoted']) record(`${key} false`, result.alternateSafeRuntimeResolutionPlanningReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_RESOLUTION_PLANNING_GATE_V1.md')))
const validation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningResult(result)
record('validation result ok', validation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningResult(gate.serializeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeResolutionPlanningResult(result))
record('serialize parse ok', parsed.status === result.status)

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Resolution Planning Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Proof retry review read: ${review.status}`,
  `Hermes CLI blocked path review: ${result.hermesCliBlockedPathReview.hermesCliRuntimeBlocked}`,
  `Option catalog entries: ${result.alternateSafeRuntimeOptionCatalog.options.length}`,
  `Selected alternate runtime path: ${result.selectedAlternateRuntimeStrategy}`,
  `Provider adapter plan built: ${result.factoryOwnedNoToolProviderAdapterPlanBuilt}`,
  `Runtime boundary plan built: ${result.providerDirectRuntimeBoundaryPlanBuilt}`,
  `Prompt/output contract plan built: ${result.promptArtifactOutputContractPlanBuilt}`,
  `Credential/network/model safety plan built: ${result.credentialNetworkModelSafetyPlanBuilt}`,
  `No-tool enforcement plan built: ${result.noToolEnforcementAndDetectionPlanBuilt}`,
  `Timeout/kill switch plan built: ${result.runtimeKillSwitchPlanBuilt}`,
  `Output review/findings plan built: ${result.outputReviewAndFindingsGatePlanBuilt}`,
  `Governance roadmap built: ${result.governanceRoadmapPlanBuilt}`,
  `Risk count: ${result.alternateRuntimeResolutionPlanningRiskRegister.risks.length}`,
  `Approval envelope: ${result.alternateSafeRuntimeResolutionApprovalEnvelope?.envelopeId || 'none'}`,
  `Can proceed to alternate approval: ${result.canProceedToAlternateSafeRuntimeResolutionApproval}`,
  `Can proceed to implementation: ${result.canProceedToAlternateSafeRuntimeImplementation}`,
  `Can proceed to controlled runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  '',
  'No adapter implemented, no runtime execution, no Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
