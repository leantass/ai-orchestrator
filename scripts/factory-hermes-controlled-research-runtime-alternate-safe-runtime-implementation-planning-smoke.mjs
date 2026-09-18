import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanning } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const approvalPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-approval-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation-planning', 'index.ts')).href)
const approval = await readJson(approvalPath)
record('alternate approval parses', approval.status === 'alternate_safe_runtime_resolution_approval_granted')
const alternateRuntimeResolutionPlanningResult = await readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-planning-result.json'))
const proofRetryReviewResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-retry-review-result.json'))
const runtimeSelectionDecisionResult = await readJson(path.join(installRoot, 'runtime-selection-decision-result.json'))
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningInput({ plannedAt: '2026-07-26T00:00:00.000Z', plannedBy: 'smoke', alternateRuntimeResolutionApprovalResult: approval, alternateRuntimeResolutionPlanningResult, proofRetryReviewResult, runtimeSelectionDecisionResult })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanning()
record('implementation planning result exists', fsSync.existsSync(resultPath))
record('status plan_created or blocked', ['alternate_safe_runtime_implementation_plan_created', 'alternate_safe_runtime_implementation_plan_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_implementation_plan_created_for_approval', 'factory_owned_provider_direct_runtime_implementation_plan_blocked_no_safe_plan'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_implementation_plan_created') {
  for (const key of ['alternateSafeRuntimeImplementationScopePlan', 'alternateSafeRuntimeImplementationFileAllowlistPlan', 'providerDirectAdapterArchitecturePlan', 'mockResearchRuntimeArchitecturePlan', 'controlledResearchRuntimeContractsPlan', 'promptArtifactOutputContractImplementationPlan', 'credentialNetworkModelBoundaryImplementationPlan', 'noToolEnforcementImplementationPlan', 'runtimeTimeoutKillSwitchImplementationPlan', 'outputCaptureRedactionReviewImplementationPlan', 'findingsGateDependencyPlan', 'alternateRuntimeVerificationAndE2ERoadmapPlan', 'alternateRuntimeImplementationPlanningRiskRegister', 'alternateSafeRuntimeImplementationApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('selected strategy provider direct', result.selectedAlternateRuntimeStrategy === 'factory_owned_no_tool_model_provider_direct_research_adapter')
  record('can proceed implementation approval true', result.canProceedToAlternateSafeRuntimeImplementationApproval === true)
}
record('Hermes CLI blocked true', result.hermesCliRuntimeBlocked === true)
for (const key of ['alternateRuntimeImplementedNow', 'mockRuntimeImplementedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'networkAllowedNow', 'modelCallsAllowedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeImplementation', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['alternateRuntimeImplementedNow', 'mockRuntimeImplementedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'hermesExecuted', 'promptSent', 'envSecretsRead', 'credentialValuesRead']) record(`receipt ${key} false`, result.alternateSafeRuntimeImplementationPlanningReceipt[key] === false)
record('no provider adapter implemented', !fsSync.existsSync(path.join(repoRoot, 'src', 'factory', 'controlled-research-runtime-provider-direct-adapter')))
record('no mock runtime implemented', !fsSync.existsSync(path.join(repoRoot, 'src', 'factory', 'controlled-research-runtime-mock-adapter')))
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_IMPLEMENTATION_PLANNING_GATE_V1.md')))
const validation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningResult(result)
record('validation result ok', validation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningResult(gate.serializeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationPlanningResult(result))
record('serialize parse ok', parsed.status === result.status)

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Planning Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Implementation planning status: ${result.implementationPlanningStatus}`,
  `Selected alternate runtime strategy: ${result.selectedAlternateRuntimeStrategy}`,
  `Safe fallback strategy: ${result.safeFallbackStrategy}`,
  `Scope plan built: ${result.implementationScopePlanBuilt}`,
  `File allowlist plan built: ${result.implementationFileAllowlistPlanBuilt}`,
  `Provider-direct adapter architecture plan built: ${result.providerDirectAdapterArchitecturePlanBuilt}`,
  `Mock runtime architecture plan built: ${result.mockRuntimeArchitecturePlanBuilt}`,
  `Shared contracts plan built: ${result.sharedRuntimeContractsPlanBuilt}`,
  `Prompt/output contract plan built: ${result.promptArtifactOutputContractPlanBuilt}`,
  `Credential/network/model boundary plan built: ${result.credentialNetworkModelBoundaryPlanBuilt}`,
  `No-tool enforcement plan built: ${result.noToolEnforcementPlanBuilt}`,
  `Timeout/kill switch plan built: ${result.timeoutKillSwitchPlanBuilt}`,
  `Output review plan built: ${result.outputReviewPlanBuilt}`,
  `Findings gate dependency plan built: ${result.findingsGateDependencyPlanBuilt}`,
  `Verification/E2E roadmap plan built: ${result.verificationAndE2ERoadmapPlanBuilt}`,
  `Risk count: ${result.alternateRuntimeImplementationPlanningRiskRegister.risks.length}`,
  `Implementation approval envelope: ${result.alternateSafeRuntimeImplementationApprovalEnvelope?.envelopeId || 'none'}`,
  `Can proceed to implementation approval: ${result.canProceedToAlternateSafeRuntimeImplementationApproval}`,
  `Can proceed to implementation: ${result.canProceedToAlternateSafeRuntimeImplementation}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  '',
  'No adapter implemented, no mock runtime implemented, no runtime execution, no research execution, no Hermes, no prompt, no model calls, no network, no DNS, no credentials, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
