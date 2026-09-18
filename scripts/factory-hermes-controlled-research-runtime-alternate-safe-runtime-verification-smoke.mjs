import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerification } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-verification/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-verification-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('verification approval result exists', fsSync.existsSync(path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-verification-approval-result.json')))
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeVerification()
record('verification result exists', fsSync.existsSync(resultPath))
record('status completed or failed', ['alternate_safe_runtime_verification_completed', 'alternate_safe_runtime_verification_failed'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_verified_for_mock_e2e_planning', 'factory_owned_provider_direct_runtime_verification_failed_block_mock_e2e'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_verification_completed') {
  for (const key of ['sharedContractsVerificationResult', 'providerDirectAdapterVerificationResult', 'mockRuntimeVerificationResult', 'promptArtifactOutputContractVerificationResult', 'credentialNetworkModelBoundaryVerificationResult', 'noToolEnforcementVerificationResult', 'timeoutKillSwitchVerificationResult', 'outputCaptureReviewVerificationResult', 'findingsGateDependencyVerificationResult', 'staticSafetyScanResult', 'smokeRegressionVerificationResult', 'staleRegressionCompatibilityVerificationResult', 'verificationSafetyManifest', 'mockE2EPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['sharedContractsVerified', 'providerDirectAdapterVerified', 'mockRuntimeVerified', 'staticSafetyScanPassed', 'staleRegressionCompatibilityVerified', 'canProceedToMockE2EPlanning']) record(`${key} true`, result[key] === true)
}
record('verification executed now true', result.verificationExecutedNow === true)
for (const key of ['alternateRuntimeExecutedNow', 'mockRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'findingsUseApprovedNow', 'providerDirectAdapterReadsProcessEnv', 'mockRuntimeReadsProcessEnv', 'canProceedToProviderRuntimePlanning', 'canProceedToControlledResearchRuntimeExecution', 'canRunResearchNow', 'canUseFindings']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['runtimeExecuted', 'researchExecuted', 'hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'processEnvRead', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.alternateSafeRuntimeVerificationReceipt[key] === false)
record('stale regression compatibility verified', result.staleRegressionCompatibilityVerificationResult.staleRegressionCompatibilityVerified === true)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_VERIFICATION_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Verification Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Shared contracts verified: ${result.sharedContractsVerified}`, `Provider adapter verified: ${result.providerDirectAdapterVerified}`, `Mock runtime verified: ${result.mockRuntimeVerified}`, `Static safety scan passed: ${result.staticSafetyScanPassed}`, `Smoke regression passed: ${result.smokeRegressionVerificationPassed}`, `Stale regression compatibility verified: ${result.staleRegressionCompatibilityVerified}`, `Mock E2E planning envelope: ${result.mockE2EPlanningEnvelope?.envelopeId || 'none'}`, `Can proceed to mock E2E planning: ${result.canProceedToMockE2EPlanning}`, `Can proceed to provider runtime planning: ${result.canProceedToProviderRuntimePlanning}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. Verification executed code-only/static. No runtime execution, no research execution, no Hermes, no prompt, no model calls, no network, no process.env, no credentials, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
