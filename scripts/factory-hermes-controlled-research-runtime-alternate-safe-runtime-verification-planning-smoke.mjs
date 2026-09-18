import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerificationPlanning } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-planning-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-verification-planning-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }

record('implementation result exists', fsSync.existsSync(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json')))
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerificationPlanning()
record('verification planning result exists', fsSync.existsSync(resultPath))
record('status created or blocked', ['alternate_safe_runtime_verification_plan_created', 'alternate_safe_runtime_verification_plan_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_verification_plan_created_for_approval', 'factory_owned_provider_direct_runtime_verification_plan_blocked_no_safe_verification_plan'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_verification_plan_created') {
  for (const key of ['implementationResultVerificationPlanningReview', 'sharedContractsVerificationPlan', 'providerDirectAdapterVerificationPlan', 'mockRuntimeVerificationPlan', 'promptArtifactOutputContractVerificationPlan', 'credentialNetworkModelBoundaryVerificationPlan', 'noToolEnforcementVerificationPlan', 'timeoutKillSwitchVerificationPlan', 'outputCaptureReviewVerificationPlan', 'findingsGateDependencyVerificationPlan', 'staticSafetyScanPlan', 'smokeRegressionVerificationPlan', 'staleRegressionAssertionReview', 'regressionCompatibilityPlan', 'alternateRuntimeVerificationPlanningRiskRegister', 'alternateSafeRuntimeVerificationApprovalEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['implementationResultAcceptedForVerificationPlanning', 'sharedContractsVerificationPlanBuilt', 'providerDirectAdapterVerificationPlanBuilt', 'mockRuntimeVerificationPlanBuilt', 'staticSafetyScanPlanBuilt', 'smokeRegressionVerificationPlanBuilt', 'staleRegressionAssertionReviewBuilt', 'regressionCompatibilityPlanBuilt', 'verificationApprovalEnvelopeBuilt', 'canProceedToAlternateSafeRuntimeVerificationApproval']) record(`${key} true`, result[key] === true)
}
record('stale regression assertions detected', result.staleRegressionAssertionReview.staleRegressionAssertionsDetected === true)
for (const key of ['verificationExecutedNow', 'alternateRuntimeExecutedNow', 'mockRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeVerification', 'canProceedToMockE2EPlanning', 'canProceedToProviderRuntimePlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_VERIFICATION_PLANNING_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Verification Planning Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Implementation result review: ${result.implementationResultAcceptedForVerificationPlanning}`, `Static safety scan plan: ${result.staticSafetyScanPlanBuilt}`, `Smoke/regression plan: ${result.smokeRegressionVerificationPlanBuilt}`, `Stale regression assertions recorded: ${result.staleRegressionAssertionReview.staleRegressionAssertionsDetected}`, `Regression compatibility plan: ${result.regressionCompatibilityPlan.compatibilityPlanBuilt}`, `Verification approval envelope: ${result.alternateSafeRuntimeVerificationApprovalEnvelope?.envelopeId || 'none'}`, `Can proceed to verification approval: ${result.canProceedToAlternateSafeRuntimeVerificationApproval}`, `Can proceed to verification: ${result.canProceedToAlternateSafeRuntimeVerification}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. No verification executed, no runtime execution, no research execution, no Hermes, no prompt, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
