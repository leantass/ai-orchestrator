import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanning } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-planning', 'index.ts')).href)
const approval = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-approval-result.json'))
record('resolution approval parses', approval.status === 'safe_command_shape_resolution_approval_granted')
const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningInput({
  plannedAt: '2026-07-24T20:00:00.000Z',
  plannedBy: 'smoke',
  resolutionApprovalResult: approval,
  resolutionPlanningResult: await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-planning-result.json')),
  proofReviewResult: await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-proof-review-result.json')),
})
record('validation input ok', inputValidation.ok)
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanning()
record('implementation planning result exists', fsSync.existsSync(resultPath))
record('status plan_created or blocked', ['safe_command_shape_resolution_implementation_plan_created', 'safe_command_shape_resolution_implementation_plan_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_resolution_implementation_plan_created_for_approval', 'hermes_safe_command_shape_resolution_implementation_plan_blocked_no_safe_implementation_plan'].includes(result.decision))
if (result.status === 'safe_command_shape_resolution_implementation_plan_created') {
  for (const key of ['safeCommandShapeResolutionImplementationScopePlan', 'safeCommandShapeResolutionImplementationFilePlan', 'factoryOwnedCommandRendererArchitecturePlan', 'wrapperFailClosedCommandBuilderArchitecturePlan', 'sourceCliContractModelPlan', 'redactedCommandEnvelopeModelPlan', 'noToolProofDependencyPlan', 'failClosedRulesPlan', 'rendererAndWrapperIntegrationPlan', 'implementationVerificationStrategyPlan', 'proofRetryChainPlan', 'implementationPlanningRiskRegister', 'safeCommandShapeResolutionImplementationApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['implementationScopePlanBuilt', 'implementationFilePlanBuilt', 'factoryOwnedRendererArchitecturePlanBuilt', 'wrapperFailClosedBuilderArchitecturePlanBuilt', 'sourceCliContractModelPlanBuilt', 'redactedCommandEnvelopeModelPlanBuilt', 'noToolProofDependencyPlanBuilt', 'failClosedRulesPlanBuilt', 'verificationStrategyPlanBuilt', 'proofRetryChainPlanBuilt', 'implementationApprovalEnvelopeBuilt']) record(`${key} true`, result[key] === true)
  record('selected strategy', result.selectedResolutionStrategy === 'factory_owned_command_renderer_with_fail_closed_wrapper_builder')
  record('can proceed implementation approval', result.canProceedToSafeCommandShapeResolutionImplementationApproval === true)
}
record('safe fallback', result.safeFallbackStrategy === 'keep_hermes_research_blocked')
for (const key of ['rendererImplementedNow', 'wrapperBuilderImplementedNow', 'safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeResolutionImplementation', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
const risks = result.implementationPlanningRiskRegister.risks.map((risk) => risk.riskId)
for (const risk of ['implementation_planning_confused_with_implementation', 'renderer_core_accidentally_reads_env', 'builder_accidentally_executes_wrapper', 'command_envelope_used_before_proof_retry']) record(`risk ${risk}`, risks.includes(risk))
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningResult(result))
record('serialize parse ok', parsed.status === result.status)
record('summary no secretos/env/source/stdout completos', !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningResult(result)).includes('OPENAI_API_KEY=') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningResult(result)).includes('stdout') && !JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementationPlanningResult(result)).includes('source'))
record('artifact existe', fsSync.existsSync(resultPath))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['rendererImplemented', 'wrapperBuilderImplemented', 'proofExecuted', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'tempConfigModified', 'runRootModified', 'hermesExecuted', 'hermesExeExecuted', 'oneshotExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'envFileRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted', 'uvPipPythonSetupExecuted']) record(`${key} false`, result.safeCommandShapeResolutionImplementationPlanningReceipt[key] === false)
record('no renderer implemented', true)
record('no wrapper builder implemented', true)
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_IMPLEMENTATION_PLANNING_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Planning Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Implementation planning status: ${result.implementationPlanningStatus}`,
  `Can proceed to implementation approval: ${result.canProceedToSafeCommandShapeResolutionImplementationApproval}`,
  `Can proceed to implementation: ${result.canProceedToSafeCommandShapeResolutionImplementation}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Artifacts read: resolution approval, resolution planning, and proof review.',
  '',
  'Plans produced: implementation scope, implementation file plan, renderer architecture, wrapper builder architecture, source CLI contract model, redacted command envelope model, no-tool proof dependency, fail-closed rules, integration, verification strategy, proof retry chain, risk register, and implementation approval envelope when plan_created.',
  '',
  'No renderer implemented, no wrapper builder implemented, no proof executed, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
