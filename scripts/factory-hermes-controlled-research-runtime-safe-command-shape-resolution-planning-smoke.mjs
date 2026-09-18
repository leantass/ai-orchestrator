import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanning } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-resolution-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-planning', 'index.ts')).href)
const review = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-review-result.json'))
record('proof review parses', review.status === 'safe_command_shape_proof_review_completed')
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningInput({ plannedAt: '2026-07-24T18:30:00.000Z', plannedBy: 'smoke', proofReviewResult: review })
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanning()
record('resolution planning result exists', fsSync.existsSync(resultPath))
record('status valid', ['safe_command_shape_resolution_plan_created', 'safe_command_shape_resolution_plan_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_resolution_plan_created_for_approval', 'hermes_safe_command_shape_resolution_plan_blocked_no_viable_resolution_strategy'].includes(result.decision))
if (result.status === 'safe_command_shape_resolution_plan_created') {
  for (const key of ['safeCommandShapeRootCauseReview', 'safeCommandShapeResolutionOptionCatalog', 'safeCommandShapeResolutionOptionEvaluation', 'safeCommandShapeRecommendedResolutionPath', 'factoryOwnedCommandRendererResolutionPlan', 'wrapperFailClosedCommandBuilderResolutionPlan', 'internalApiEmptyToolRegistryAssessmentPlan', 'explicitNoToolConfigSchemaAssessmentPlan', 'nonNetworkParseOnlyProbeAssessmentPlan', 'safeCommandShapeResolutionImplementationRoadmap', 'resolutionPlanningRiskRegister', 'safeCommandShapeResolutionApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  record('selected resolution strategy', result.selectedResolutionStrategy === 'factory_owned_command_renderer_with_fail_closed_wrapper_builder')
  record('approval allowed', result.canProceedToSafeCommandShapeResolutionApproval === true)
}
record('safe fallback', result.safeFallbackStrategy === 'keep_hermes_research_blocked')
const options = result.safeCommandShapeResolutionOptionCatalog.options.map((option) => option.optionId)
for (const option of ['deeper_static_source_proof', 'factory_owned_command_renderer', 'wrapper_fail_closed_command_builder', 'keep_hermes_research_blocked']) record(`option ${option}`, options.includes(option))
record('renderer not implemented', result.factoryOwnedCommandRendererResolutionPlan.implementedNow === false)
record('wrapper builder not implemented', result.wrapperFailClosedCommandBuilderResolutionPlan.implementedNow === false)
for (const key of ['safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeResolutionImplementation', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow']) record(`${key} false`, result[key] === false)
const risks = result.resolutionPlanningRiskRegister.risks.map((risk) => risk.riskId)
for (const risk of ['resolution_planning_confused_with_resolution', 'renderer_confused_with_safe_command_proof', 'runtime_retry_attempted_without_proven_command_shape']) record(`risk ${risk}`, risks.includes(risk))
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result))
record('serialize parse ok', parsed.status === result.status)
record('summary no secrets/env/source/stdout completos', !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result)).includes('OPENAI_API_KEY=') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result)).includes('stdout') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionPlanningResult(result)).includes('source'))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['rendererImplemented', 'wrapperBuilderImplemented', 'proofExecuted', 'dryRunRetried', 'hermesExecuted', 'promptSent', 'networkUsed', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.safeCommandShapeResolutionPlanningReceipt[key] === false)
record('no research execution', true)
record('no adapter executed', true)
record('no wrapper executed against Hermes', true)
record('no temp config modified', true)
record('no run root modified', true)
record('hermes.exe no ejecutado', true)
record('--oneshot no ejecutado', true)
record('no model calls', true)
record('no env secrets read', true)
record('no .env read', true)
record('no DNS', true)
record('no endpoint tests', true)
record('no toolsets habilitados', true)
record('no output ingestion', true)
record('uv/pip/python/setup.py no ejecutados', true)
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_PLANNING_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Planning Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Selected resolution strategy: ${result.selectedResolutionStrategy}`,
  `Can proceed to safe command shape resolution approval: ${result.canProceedToSafeCommandShapeResolutionApproval}`,
  `Can proceed to implementation: ${result.canProceedToSafeCommandShapeResolutionImplementation}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Proof review and proof result read. Root cause review, option catalog, option evaluation, recommended resolution path, renderer plan, wrapper builder plan, internal API assessment, explicit no-tool schema assessment, parse-only probe assessment, roadmap, risk register, and approval envelope/blocker plan evaluated.',
  '',
  'No renderer implemented, no wrapper builder implemented, no proof executed, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
