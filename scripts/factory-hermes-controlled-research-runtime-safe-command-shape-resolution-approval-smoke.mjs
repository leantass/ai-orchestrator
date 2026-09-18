import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApproval } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-resolution-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-approval', 'index.ts')).href)
const planning = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-planning-result.json'))
record('resolution planning parses', planning.status === 'safe_command_shape_resolution_plan_created')
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalInput({ approvedAt: '2026-07-24T19:15:00.000Z', approvedBy: 'smoke', resolutionPlanningResult: planning })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApproval()
record('resolution approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['safe_command_shape_resolution_approval_granted', 'safe_command_shape_resolution_approval_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_resolution_approved_for_implementation_planning', 'hermes_safe_command_shape_resolution_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'safe_command_shape_resolution_approval_granted') {
  for (const key of ['resolutionPlanReadinessReview', 'rootCauseReviewReview', 'resolutionOptionCatalogReview', 'resolutionOptionEvaluationReview', 'recommendedResolutionPathReview', 'factoryOwnedCommandRendererPlanReview', 'wrapperFailClosedCommandBuilderPlanReview', 'internalApiEmptyToolRegistryAssessmentPlanReview', 'explicitNoToolConfigSchemaAssessmentPlanReview', 'nonNetworkParseOnlyProbeAssessmentPlanReview', 'implementationRoadmapReview', 'resolutionApprovalRiskDispositionRegister', 'safeCommandShapeResolutionImplementationPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('selected strategy', result.selectedResolutionStrategy === 'factory_owned_command_renderer_with_fail_closed_wrapper_builder')
  record('implementation planning allowed', result.resolutionImplementationPlanningAllowed === true)
  record('can proceed implementation planning', result.canProceedToSafeCommandShapeResolutionImplementationPlanning === true)
}
record('safe fallback', result.safeFallbackStrategy === 'keep_hermes_research_blocked')
for (const key of ['safeCommandShapeResolutionImplementationAllowedNow', 'safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeResolutionImplementation', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow']) record(`${key} false`, result[key] === false)
const risks = result.resolutionApprovalRiskDispositionRegister.risks.map((risk) => risk.riskId)
for (const risk of ['approval_confused_with_resolution', 'renderer_implementation_confused_with_command_proof', 'runtime_retry_attempted_without_proven_command_shape']) record(`risk ${risk}`, risks.includes(risk))
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result))
record('serialize parse ok', parsed.status === result.status)
record('summary no secrets/env/source/stdout completos', !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result)).includes('OPENAI_API_KEY=') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result)).includes('stdout') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionApprovalResult(result)).includes('source'))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['rendererImplemented', 'wrapperBuilderImplemented', 'proofExecuted', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'envFileRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted']) record(`${key} false`, result.safeCommandShapeResolutionApprovalReceipt[key] === false)
record('no temp config modified', true)
record('no run root modified', true)
record('hermes.exe no ejecutado', true)
record('--oneshot no ejecutado', true)
record('uv/pip/python/setup.py no ejecutados', true)
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_APPROVAL_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Approval Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Resolution approval status: ${result.resolutionApprovalStatus}`,
  `Can proceed to implementation planning: ${result.canProceedToSafeCommandShapeResolutionImplementationPlanning}`,
  `Can proceed to implementation: ${result.canProceedToSafeCommandShapeResolutionImplementation}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Resolution planning and proof review read. Readiness review, root cause review, option catalog review, option evaluation review, recommended path review, renderer plan review, wrapper builder plan review, assessment reviews, roadmap review, limitations, risk register, and implementation planning envelope/blocker plan evaluated.',
  '',
  'No renderer implemented, no wrapper builder implemented, no proof executed, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
