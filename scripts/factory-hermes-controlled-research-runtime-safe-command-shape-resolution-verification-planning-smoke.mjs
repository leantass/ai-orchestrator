import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanning } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification-planning', 'index.ts')).href)
const implementationResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json'))
const implementationApprovalResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-approval-result.json'))
const implementationPlanningResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-planning-result.json'))
record('implementation result completed', implementationResult.status === 'safe_command_shape_resolution_implementation_completed')
record('implementation approval granted', implementationApprovalResult.status === 'safe_command_shape_resolution_implementation_approval_granted')
record('implementation planning parses', implementationPlanningResult.status === 'safe_command_shape_resolution_implementation_plan_created')

const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningInput({
  plannedAt: '2026-07-24T21:30:00.000Z',
  plannedBy: 'smoke',
  implementationResult,
  implementationApprovalResult,
  implementationPlanningResult,
})
record('validation input ok', inputValidation.ok)

const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanning()
record('verification planning result exists', fsSync.existsSync(resultPath))
record('status plan created or blocked', ['safe_command_shape_resolution_verification_plan_created', 'safe_command_shape_resolution_verification_plan_blocked'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_resolution_verification_plan_created_for_approval', 'hermes_safe_command_shape_resolution_verification_plan_blocked_no_safe_verification_plan'].includes(result.decision))
record('selected wrapper strategy', result.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets')
record('safe fallback', result.safeFallbackStrategy === 'keep_hermes_research_blocked')

if (result.status === 'safe_command_shape_resolution_verification_plan_created') {
  for (const key of ['safeCommandShapeResolutionVerificationPlanningReceipt', 'hermesSafeCommandShapeResolutionVerificationPlanCandidate', 'implementationResultVerificationPlanningReview', 'rendererVerificationPlan', 'wrapperBuilderVerificationPlan', 'sourceCliContractModelVerificationPlan', 'redactedCommandEnvelopeVerificationPlan', 'noToolProofDependencyVerificationPlan', 'failClosedRulesVerificationPlan', 'rendererWrapperIntegrationVerificationPlan', 'implementationSafetyScanVerificationPlan', 'smokeRegressionVerificationPlan', 'proofRetryReadinessVerificationPlan', 'verificationPlanningRiskRegister', 'safeCommandShapeResolutionVerificationApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['implementationResultAcceptedForVerificationPlanning', 'rendererVerificationPlanBuilt', 'wrapperBuilderVerificationPlanBuilt', 'sourceCliContractModelVerificationPlanBuilt', 'redactedEnvelopeVerificationPlanBuilt', 'noToolProofDependencyVerificationPlanBuilt', 'failClosedRulesVerificationPlanBuilt', 'integrationVerificationPlanBuilt', 'safetyScanVerificationPlanBuilt', 'smokeRegressionVerificationPlanBuilt', 'proofRetryReadinessVerificationPlanBuilt', 'verificationApprovalEnvelopeBuilt']) record(`${key} true`, result[key] === true)
  record('verification approval allowed', result.canProceedToSafeCommandShapeResolutionVerificationApproval === true)
  record('approval envelope target gate', result.safeCommandShapeResolutionVerificationApprovalEnvelope.targetNextGate === 'Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Approval Gate v1')
}

for (const key of ['verificationExecutedNow', 'safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeResolutionVerification', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canMutateFilesystemNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const key of ['verificationExecuted', 'proofRetry', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'tempConfigModified', 'runRootModified', 'hermesExecuted', 'hermesExeExecuted', 'oneshotExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'envFileRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted', 'uvPipPythonSetupExecuted']) record(`receipt ${key} false`, result.safeCommandShapeResolutionVerificationPlanningReceipt[key] === false)

const risks = result.verificationPlanningRiskRegister.risks.map((risk) => risk.riskId)
for (const risk of ['verification_planning_confused_with_verification', 'renderer_smoke_confused_with_safe_command_shape_proof', 'non_runnable_envelope_used_as_runnable']) record(`risk ${risk}`, risks.includes(risk))
record('renderer plan no hermes execution', result.rendererVerificationPlan.staticSafety.includes('no_hermes_execution'))
record('wrapper plan no wrapper execution', result.wrapperBuilderVerificationPlan.staticSafety.includes('no_wrapper_execution_against_hermes'))
record('no tool proof dependency planned', result.noToolProofDependencyVerificationPlan.checks.includes('missing_proof_blocks_execution'))
record('fail closed rules planned', result.failClosedRulesVerificationPlan.rules.includes('any_blocker_prevents_hermes_execution'))
record('integration keeps envelope non runnable', result.rendererWrapperIntegrationVerificationPlan.checks.includes('builder_does_not_convert_envelope_to_runnable'))
record('safety scan no package changes', result.implementationSafetyScanVerificationPlan.scans.includes('no_package_changes'))
record('smoke plan no Hermes', result.smokeRegressionVerificationPlan.doesNotExecuteHermes === true)
record('proof retry still gated', result.proofRetryReadinessVerificationPlan.checks.includes('proof_retry_not_allowed_until_verification_review'))

const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningResult(result))
record('serialize parse ok', parsed.status === result.status)
const summaryText = JSON.stringify(gate.summarizeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationPlanningResult(result))
record('summary no secretos/env/source/stdout completos', !summaryText.includes('OPENAI_API_KEY=') && !summaryText.includes('stdout') && !summaryText.includes('source') && !summaryText.includes('.env'))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_PLANNING_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Planning Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Verification planning status: ${result.verificationPlanningStatus}`,
  `Selected wrapper strategy: ${result.selectedWrapperStrategy}`,
  `Selected resolution strategy: ${result.selectedResolutionStrategy}`,
  `Can proceed to verification approval: ${result.canProceedToSafeCommandShapeResolutionVerificationApproval}`,
  `Can proceed to verification: ${result.canProceedToSafeCommandShapeResolutionVerification}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Plans produced: renderer, wrapper builder, source CLI contract model, redacted command envelope, no-tool proof dependency, fail-closed rules, integration, safety scan, smoke regression, proof retry readiness, risk register, and verification approval envelope when accepted.',
  '',
  'No verification executed, no proof retry, no dry-run retry, no research execution, no adapter execution, no Hermes, no hermes.exe, no --oneshot, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credentials, no toolsets, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
