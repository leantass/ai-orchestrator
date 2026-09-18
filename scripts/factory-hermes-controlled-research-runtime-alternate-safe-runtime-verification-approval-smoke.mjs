import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerificationApproval } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification-approval/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-approval-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-verification-approval-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('verification planning result exists', fsSync.existsSync(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-planning-result.json')))
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerificationApproval()
record('verification approval result exists', fsSync.existsSync(resultPath))
record('status granted or blocked', ['alternate_safe_runtime_verification_approval_granted', 'alternate_safe_runtime_verification_approval_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_verification_approved_for_verification_gate', 'factory_owned_provider_direct_runtime_verification_approval_blocked_plan_incomplete_or_unsafe'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_verification_approval_granted') {
  for (const key of ['verificationPlanReadinessReview', 'implementationResultVerificationPlanningReviewReview', 'sharedContractsVerificationPlanReview', 'providerDirectAdapterVerificationPlanReview', 'mockRuntimeVerificationPlanReview', 'promptArtifactOutputContractVerificationPlanReview', 'credentialNetworkModelBoundaryVerificationPlanReview', 'noToolEnforcementVerificationPlanReview', 'timeoutKillSwitchVerificationPlanReview', 'outputCaptureReviewVerificationPlanReview', 'findingsGateDependencyVerificationPlanReview', 'staticSafetyScanPlanReview', 'smokeRegressionVerificationPlanReview', 'staleRegressionAssertionReviewReview', 'regressionCompatibilityPlanReview', 'alternateRuntimeVerificationApprovalRiskDispositionRegister', 'alternateSafeRuntimeVerificationGateEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['verificationPlanAccepted', 'implementationResultReviewAccepted', 'sharedContractsVerificationPlanAccepted', 'providerDirectAdapterVerificationPlanAccepted', 'mockRuntimeVerificationPlanAccepted', 'promptArtifactOutputContractVerificationPlanAccepted', 'credentialNetworkModelBoundaryVerificationPlanAccepted', 'noToolEnforcementVerificationPlanAccepted', 'timeoutKillSwitchVerificationPlanAccepted', 'outputCaptureReviewVerificationPlanAccepted', 'findingsGateDependencyVerificationPlanAccepted', 'staticSafetyScanPlanAccepted', 'smokeRegressionVerificationPlanAccepted', 'staleRegressionAssertionReviewAccepted', 'regressionCompatibilityPlanAccepted', 'verificationGateAllowed', 'canProceedToAlternateSafeRuntimeVerification']) record(`${key} true`, result[key] === true)
}
record('Hermes CLI blocked true', result.hermesCliRuntimeBlocked === true)
for (const key of ['verificationExecutedNow', 'alternateRuntimeExecutedNow', 'mockRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToMockE2EPlanning', 'canProceedToProviderRuntimePlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('process env read false', result.canReadProcessEnvNow === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['verificationExecuted', 'runtimeExecuted', 'researchExecuted', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.alternateSafeRuntimeVerificationApprovalReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_VERIFICATION_APPROVAL_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Verification Approval Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Verification planning accepted: ${result.verificationPlanAccepted}`, `Stale regression accepted: ${result.staleRegressionAssertionReviewAccepted}`, `Regression compatibility accepted: ${result.regressionCompatibilityPlanAccepted}`, `Verification gate envelope: ${result.alternateSafeRuntimeVerificationGateEnvelope?.envelopeId || 'none'}`, `Can proceed to verification: ${result.canProceedToAlternateSafeRuntimeVerification}`, `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. No verification executed, no runtime execution, no research execution, no Hermes, no prompt, no model calls, no network, no process.env, no credentials, no findings. Stale regression assertions accepted as compatibility issue.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
