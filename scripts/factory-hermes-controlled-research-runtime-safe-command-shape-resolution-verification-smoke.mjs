import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerification } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-verification/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
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

const gate = await import(pathToFileURL(path.join(repoRoot, 'src', 'factory', 'hermes-controlled-research-runtime-safe-command-shape-resolution-verification', 'index.ts')).href)
const verificationApprovalResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-approval-result.json'))
const verificationPlanningResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-verification-planning-result.json'))
const implementationResult = await readJson(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json'))
record('verification approval parses', verificationApprovalResult.status === 'safe_command_shape_resolution_verification_approval_granted')
record('verification planning parses', verificationPlanningResult.status === 'safe_command_shape_resolution_verification_plan_created')
record('implementation result parses', implementationResult.status === 'safe_command_shape_resolution_implementation_completed')

const inputValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationInput({
  verifiedAt: '2026-07-24T22:30:00.000Z',
  verifiedBy: 'smoke',
  verificationApprovalResult,
  verificationPlanningResult,
  implementationResult,
})
record('validation input ok', inputValidation.ok)

const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerification()
record('verification result exists', fsSync.existsSync(resultPath))
record('status completed or failed', ['safe_command_shape_resolution_verification_completed', 'safe_command_shape_resolution_verification_failed'].includes(result.status))
record('decision valid', ['hermes_safe_command_shape_resolution_verified_for_proof_retry_planning', 'hermes_safe_command_shape_resolution_verification_failed_block_proof_retry'].includes(result.decision))
record('selected wrapper strategy', result.selectedWrapperStrategy === 'wrapper_temp_config_no_toolsets')
record('safe fallback', result.safeFallbackStrategy === 'keep_hermes_research_blocked')

if (result.status === 'safe_command_shape_resolution_verification_completed') {
  for (const key of ['rendererVerificationResult', 'wrapperBuilderVerificationResult', 'sourceCliContractModelVerificationResult', 'redactedCommandEnvelopeVerificationResult', 'noToolProofDependencyVerificationResult', 'failClosedRulesVerificationResult', 'rendererWrapperIntegrationVerificationResult', 'implementationSafetyScanVerificationResult', 'smokeRegressionVerificationResult', 'proofRetryReadinessVerificationResult', 'verificationSafetyManifest', 'safeCommandShapeProofRetryPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['rendererVerified', 'wrapperBuilderVerified', 'sourceCliContractModelVerified', 'redactedEnvelopeModelVerified', 'noToolProofDependencyVerified', 'failClosedRulesVerified', 'rendererWrapperIntegrationVerified', 'implementationSafetyScanPassed', 'smokeRegressionVerificationPassed', 'proofRetryReadinessVerified', 'rendererSmokePassed', 'wrapperBuilderSmokePassed', 'implementationSmokePassed', 'commandEnvelopeNonRunnableUntilFinalGate', 'verificationExecutedNow', 'canProceedToSafeCommandShapeProofRetryPlanning']) record(`${key} true`, result[key] === true)
  record('proof retry planning envelope target', result.safeCommandShapeProofRetryPlanningEnvelope.targetNextGate === 'Factory Hermes Controlled Research Runtime Safe Command Shape Proof Retry Planning Gate v1')
}

for (const key of ['rendererExecutesHermes', 'wrapperBuilderExecutesHermes', 'rendererReadsCredentials', 'wrapperBuilderReadsCredentials', 'rendererUsesNetwork', 'wrapperBuilderUsesNetwork', 'rendererPassesPrompt', 'wrapperBuilderPassesPrompt', 'rendererBuildsRunnableCommandNow', 'wrapperBuilderBuildsRunnableCommandNow', 'safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'toolsetEnablementAllowedNow', 'findingsUseApprovedNow', 'canProceedToSafeCommandShapeProofRetry', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canExecuteHermesNow', 'canPassPromptNow', 'canUseNetworkNow', 'canUseCredentialsNow', 'canReadEnvSecretsNow', 'canCallModelsNow', 'canEnableToolsetsNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
for (const key of ['proofRetry', 'dryRunRetried', 'researchExecution', 'adapterExecuted', 'wrapperExecutedAgainstHermes', 'tempConfigModified', 'runRootModified', 'hermesExecuted', 'hermesExeExecuted', 'oneshotExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'dnsResolved', 'endpointsTested', 'envSecretsRead', 'envFileRead', 'credentialValuesRead', 'toolsetsEnabled', 'outputIngestion', 'findingsPromoted', 'uvPipPythonSetupExecuted']) record(`receipt ${key} false`, result.safeCommandShapeResolutionVerificationReceipt[key] === false)
record('manifest no forbidden actions', result.verificationSafetyManifest.forbiddenActionsObserved === false)
record('manifest package hashes intact', result.verificationSafetyManifest.packageHashesIntact === true)
const resultValidation = gate.validateFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationResult(result)
record('validation result ok', resultValidation.ok)
const parsed = gate.parseFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationResult(gate.serializeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionVerificationResult(result))
record('serialize parse ok', parsed.status === result.status)
record('artifact existe', fsSync.existsSync(resultPath))
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs actualizadas', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_VERIFICATION_GATE_V1.md')))

await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Verification Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Verification status: ${result.verificationStatus}`,
  `Verification approval read: ${verificationApprovalResult.status}`,
  `Implementation result read: ${implementationResult.status}`,
  `Renderer verified: ${result.rendererVerified}`,
  `Wrapper builder verified: ${result.wrapperBuilderVerified}`,
  `Source CLI contract model verified: ${result.sourceCliContractModelVerified}`,
  `Redacted envelope verified: ${result.redactedEnvelopeModelVerified}`,
  `No-tool proof dependency verified: ${result.noToolProofDependencyVerified}`,
  `Fail-closed rules verified: ${result.failClosedRulesVerified}`,
  `Integration verified: ${result.rendererWrapperIntegrationVerified}`,
  `Safety scan passed: ${result.implementationSafetyScanPassed}`,
  `Smoke regression passed: ${result.smokeRegressionVerificationPassed}`,
  `Proof retry readiness verified: ${result.proofRetryReadinessVerified}`,
  `Can proceed to proof retry planning: ${result.canProceedToSafeCommandShapeProofRetryPlanning}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Verification executed code-only through renderer, wrapper builder, implementation, verification approval, typecheck, build, diff check, and static safety scans.',
  '',
  'No proof retry, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))

console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
