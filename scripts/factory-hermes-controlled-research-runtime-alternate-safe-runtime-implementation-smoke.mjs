import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementation } from '../electron/factory/hermes-controlled-research-runtime-alternate-safe-runtime-implementation/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const approvalPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-approval-result.json')
const resultPath = path.join(installRoot, 'controlled-research-runtime-alternate-safe-runtime-implementation-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-alternate-safe-runtime-implementation-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function readJson(file) { record(`${path.basename(file)} exists`, fsSync.existsSync(file)); return JSON.parse(await fs.readFile(file, 'utf8')) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
const approval = await readJson(approvalPath)
record('implementation approval parses', approval.status === 'alternate_safe_runtime_implementation_approval_granted')
const result = await executeFactoryHermesControlledResearchRuntimeAlternateSafeRuntimeImplementation()
record('implementation result exists', fsSync.existsSync(resultPath))
record('status completed or blocked', ['alternate_safe_runtime_implementation_completed', 'alternate_safe_runtime_implementation_blocked'].includes(result.status))
record('decision valid', ['factory_owned_provider_direct_runtime_implementation_completed_for_verification_planning', 'factory_owned_provider_direct_runtime_implementation_blocked_unsafe_or_incomplete'].includes(result.decision))
if (result.status === 'alternate_safe_runtime_implementation_completed') {
  for (const key of ['sharedRuntimeContractsImplementationResult', 'providerDirectAdapterImplementationResult', 'mockResearchRuntimeImplementationResult', 'implementationSafetyManifest', 'alternateSafeRuntimeVerificationPlanningEnvelope']) record(`${key} present`, Boolean(result[key]))
  for (const key of ['sharedRuntimeContractsImplemented', 'providerDirectAdapterImplemented', 'mockResearchRuntimeImplemented', 'alternateRuntimeImplementedNow', 'canProceedToAlternateSafeRuntimeVerificationPlanning']) record(`${key} true`, result[key] === true)
}
for (const key of ['alternateRuntimeExecutedNow', 'controlledRuntimeExecutionAllowedNow', 'credentialAccessAllowedNow', 'promptPassingAllowedNow', 'modelCallsAllowedNow', 'networkAllowedNow', 'outputIngestionApprovedNow', 'findingsUseApprovedNow', 'canProceedToAlternateSafeRuntimeVerification', 'canProceedToMockE2EPlanning', 'canProceedToProviderRuntimePlanning', 'canRunResearchNow']) record(`${key} false`, result[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
for (const key of ['hermesExecuted', 'promptSent', 'modelCalls', 'networkUsed', 'credentialValuesRead', 'findingsPromoted']) record(`receipt ${key} false`, result.alternateSafeRuntimeImplementationReceipt[key] === false)
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_ALTERNATE_SAFE_RUNTIME_IMPLEMENTATION_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, ['# Factory Hermes Controlled Research Runtime Alternate Safe Runtime Implementation Gate v1', '', `Status: ${result.status}`, `Decision: ${result.decision}`, `Implementation approval read: ${approval.status}`, `Shared contracts: ${result.sharedRuntimeContractsImplemented}`, `Provider adapter: ${result.providerDirectAdapterImplemented}`, `Mock runtime: ${result.mockResearchRuntimeImplemented}`, `Safety manifest runtime blocked: ${result.implementationSafetyManifest.runtimeStillBlocked}`, `Verification planning envelope: ${result.alternateSafeRuntimeVerificationPlanningEnvelope?.envelopeId || 'none'}`, `Can proceed to verification planning: ${result.canProceedToAlternateSafeRuntimeVerificationPlanning}`, `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`, `Can run research now: ${result.canRunResearchNow}`, '', 'Hermes CLI remains blocked. No runtime execution, no research execution, no Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no findings.', '', `Next step: ${result.recommendedNextStep}`, ''].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
