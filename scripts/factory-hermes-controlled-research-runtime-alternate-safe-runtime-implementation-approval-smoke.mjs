import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApproval } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const planningPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-planning-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation-approval', 'index.ts')).href)
const implementationPlanningResult = await readJson(planningPath)
record('implementation planning parses', implementationPlanningResult.status === 'alternate_safe_runtime_implementation_plan_created')
const alternateRuntimeResolutionApprovalResult = await readJson(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-resolution-approval-result.json'))
const runtimeSelectionDecisionResult = await readJson(path.join(installRoot, 'runtime-selection-decision-result.json'))
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalInput({ approvedAt: '2026-07-27T00:00:00.000Z', approvedBy: 'smoke', implementationPlanningResult, alternateRuntimeResolutionApprovalResult, runtimeSelectionDecisionResult })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApproval()
record('implementation approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['alternate_safe_runtime_implementation_approval_granted', 'alternate_safe_runtime_implementation_approval_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_implementation_approved_for_implementation_gate', 'factory_owned_provider_direct_runtime_implementation_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_implementation_approval_granted') {
  for (const key of ['implementationPlanReadinessReview', 'implementationScopePlanReview', 'implementationFileAllowlistPlanReview', 'providerDirectAdapterArchitecturePlanReview', 'mockResearchRuntimeArchitecturePlanReview', 'controlledResearchRuntimeContractsPlanReview', 'promptArtifactOutputContractImplementationPlanReview', 'credentialNetworkModelBoundaryImplementationPlanReview', 'noToolEnforcementImplementationPlanReview', 'runtimeTimeoutKillSwitchImplementationPlanReview', 'outputCaptureRedactionReviewImplementationPlanReview', 'findingsGateDependencyPlanReview', 'verificationAndE2ERoadmapPlanReview', 'alternateRuntimeImplementationApprovalRiskDispositionRegister', 'alternateSafeRuntimeImplementationGateEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('selected strategy provider direct', result.selectedAlternateRuntimeStrategy === 'factory_owned_no_tool_model_provider_direct_research_adapter')
  record('implementation gate allowed true', result.implementationGateAllowed === true)
  record('can proceed implementation true', result.canProceedToAlternateSafeRuntimeImplementation === true)
}
record('Hermes CLI blocked true', result.hermesCliRuntimeBlocked === true)
for (const key of ['alternateRuntimeImplementationAllowedNow', 'alternateRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'networkAllowedNow', 'modelCallsAllowedNow', 'findingsUseApprovedNow', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['adapterImplemented', 'runtimeImplemented', 'runtimeExecuted', 'researchExecuted', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'dotEnvRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted', 'uvPipPythonSetupExecuted']) record(`receipt ${key} false`, result.alternateSafeRuntimeImplementationApprovalReceipt[key] === false)
record('no provider adapter implemented', !fsSync.existsSync(path.join(repoRoot, 'src', 'factory', 'controlled-research-runtime-provider-direct-adapter')))
record('no mock runtime implemented', !fsSync.existsSync(path.join(repoRoot, 'src', 'factory', 'controlled-research-runtime-mock-adapter')))
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_IMPLEMENTATION_APPROVAL_GATE_V1.md')))
const validation = gate.validateFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalResult(result)
record('validation result ok', validation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalResult(gate.serializeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementationApprovalResult(result))
record('serialize parse ok', parsed.status === result.status)

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Approval Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Implementation planning read: ${implementationPlanningResult.status}`,
  `Implementation approval status: ${result.implementationApprovalStatus}`,
  `Readiness accepted: ${result.implementationPlanAccepted}`,
  `Scope accepted: ${result.implementationScopePlanAccepted}`,
  `File allowlist accepted: ${result.implementationFileAllowlistPlanAccepted}`,
  `Provider adapter accepted: ${result.providerDirectAdapterArchitecturePlanAccepted}`,
  `Mock runtime accepted: ${result.mockResearchRuntimeArchitecturePlanAccepted}`,
  `Shared contracts accepted: ${result.sharedRuntimeContractsPlanAccepted}`,
  `Prompt/output accepted: ${result.promptArtifactOutputContractPlanAccepted}`,
  `Credential/network/model accepted: ${result.credentialNetworkModelBoundaryPlanAccepted}`,
  `No-tool accepted: ${result.noToolEnforcementPlanAccepted}`,
  `Timeout accepted: ${result.timeoutKillSwitchPlanAccepted}`,
  `Output review accepted: ${result.outputCaptureReviewPlanAccepted}`,
  `Findings dependency accepted: ${result.findingsGateDependencyPlanAccepted}`,
  `Verification/E2E accepted: ${result.verificationAndE2ERoadmapPlanAccepted}`,
  `Limitations: ${result.alternateRuntimeImplementationApprovalLimitationsCarryForward.limitations.join(', ')}`,
  `Risk count: ${result.alternateRuntimeImplementationApprovalRiskDispositionRegister.risks.length}`,
  `Implementation gate envelope: ${result.alternateSafeRuntimeImplementationGateEnvelope?.envelopeId || 'none'}`,
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
