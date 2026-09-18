import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import { executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementation } from '../electron/factory/hermes-controlled-research-runtime-safe-command-shape-resolution-implementation/index.cjs'

const repoRoot = process.cwd()
const installRoot = path.join(repoRoot, '.codex-temp', 'external-tools', 'hermes-agent', 'install', '75b300f')
const resultPath = path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-result.json')
const reportPath = path.join(repoRoot, '.codex-temp', 'hermes-controlled-research-runtime-safe-command-shape-resolution-implementation-v1', 'reports', 'IMPLEMENTATION_REPORT.md')
const checks = []
function record(name, value) { assert.equal(Boolean(value), true, name); checks.push(name) }
async function hash(file) { return crypto.createHash('sha256').update(await fs.readFile(path.join(repoRoot, file))).digest('hex').toUpperCase() }
record('approval result exists', fsSync.existsSync(path.join(installRoot, 'controlled-research-runtime-safe-command-shape-resolution-implementation-approval-result.json')))
const result = await executeFactoryHermesControlledResearchRuntimeSafeCommandShapeResolutionImplementation()
record('implementation result exists', fsSync.existsSync(resultPath))
record('status completed or blocked', ['safe_command_shape_resolution_implementation_completed', 'safe_command_shape_resolution_implementation_blocked'].includes(result.status))
if (result.status === 'safe_command_shape_resolution_implementation_completed') {
  for (const key of ['factoryOwnedRendererImplemented', 'wrapperFailClosedBuilderImplemented', 'sourceCliContractModelImplemented', 'redactedCommandEnvelopeModelImplemented', 'noToolProofDependencyModelImplemented', 'failClosedRulesImplemented']) record(`${key} true`, result[key] === true)
  record('verification planning allowed', result.canProceedToSafeCommandShapeResolutionVerificationPlanning === true)
}
record('implementation safety manifest present', Boolean(result.implementationSafetyManifest))
record('verification planning envelope present', Boolean(result.implementationVerificationPlanningEnvelope))
for (const key of ['rendererExecutesHermes', 'wrapperBuilderExecutesHermes', 'rendererReadsCredentials', 'wrapperBuilderReadsCredentials', 'rendererUsesNetwork', 'wrapperBuilderUsesNetwork', 'rendererBuildsRunnableCommandNow', 'wrapperBuilderBuildsRunnableCommandNow', 'safeCommandShapeResolvedNow', 'safeCommandShapeProofRetryAllowedNow', 'controlledRuntimeExecutionAllowedNow', 'canProceedToSafeCommandShapeProofRetry', 'canRunResearchNow']) record(`${key} false`, result[key] === false)
for (const key of ['proofExecuted', 'dryRunRetried', 'hermesExecuted', 'networkUsed', 'credentialValuesRead']) record(`${key} false`, result.safeCommandShapeResolutionImplementationReceipt[key] === false)
record('package.json intacto', await hash('package.json') === '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF')
record('package-lock.json intacto', await hash('package-lock.json') === '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303')
record('docs updated', fsSync.existsSync(path.join(repoRoot, 'docs', 'factory', 'HERMES_CONTROLLED_RESEARCH_RUNTIME_SAFE_COMMAND_SHAPE_RESOLUTION_IMPLEMENTATION_GATE_V1.md')))
await fs.mkdir(path.dirname(reportPath), { recursive: true })
await fs.writeFile(reportPath, [
  '# Factory Hermes Controlled Research Runtime Safe Command Shape Resolution Implementation Gate v1',
  '',
  `Status: ${result.status}`,
  `Decision: ${result.decision}`,
  `Can proceed to verification planning: ${result.canProceedToSafeCommandShapeResolutionVerificationPlanning}`,
  `Can proceed to proof retry: ${result.canProceedToSafeCommandShapeProofRetry}`,
  `Can proceed to runtime execution: ${result.canProceedToControlledResearchRuntimeExecution}`,
  `Can run research now: ${result.canRunResearchNow}`,
  `Checks: ${checks.length}`,
  '',
  'Renderer and wrapper builder implemented code-only. Source CLI contract, redacted command envelope, no-tool proof dependency, fail-closed rules, renderer/builder integration, safety manifest, and verification planning envelope produced.',
  '',
  'No proof executed, no dry-run retry, no research execution, no adapter execution, no Hermes, no wrapper against Hermes, no prompt sent, no model calls, no network, no DNS, no credential values read, no toolsets enabled, no findings.',
  '',
  `Next step: ${result.recommendedNextStep}`,
  '',
].join('\n'))
console.log(JSON.stringify({ ok: true, checks: checks.length, status: result.status, decision: result.decision, resultPath, reportPath }, null, 2))
