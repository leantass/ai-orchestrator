import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import adapterRuntime from '../electron/factory/hermes-research-runtime-adapter/index.cjs'
import { parseFactoryHermesResearchRuntimeAdapterResult, serializeFactoryHermesResearchRuntimeAdapterResult, summarizeFactoryHermesResearchRuntimeAdapterResult, validateFactoryHermesResearchRuntimeAdapterInput, validateFactoryHermesResearchRuntimeAdapterResult } from '../src/factory/hermes-research-runtime-adapter/index.ts'

const { executeFactoryHermesResearchRuntimeAdapter, resolveFactoryHermesResearchRuntimeAdapterPaths } = adapterRuntime
const paths = resolveFactoryHermesResearchRuntimeAdapterPaths()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.approvalResult), true) // 1
const approval = JSON.parse(readFileSync(paths.approvalResult, 'utf8'))
assert.ok(approval) // 2
assert.equal(approval.status, 'approved_for_adapter_candidate') // 3
assert.equal(approval.commandName, 'hermes') // 4
assert.equal(approval.pythonEntrypoint, 'hermes_cli.main:main') // 5
assert.equal(existsSync(paths.boundaryResult), true) // 6
const boundary = JSON.parse(readFileSync(paths.boundaryResult, 'utf8'))
assert.ok(boundary) // 7
const executableExists = existsSync(paths.executableRef)
assert.equal(typeof executableExists, 'boolean') // 8
const input = { executedAt: '2026-07-21T20:00:00.000Z', executedBy: 'factory-hermes-research-runtime-adapter-smoke', mode: 'help_probe_only' }
assert.equal(input.mode, 'help_probe_only') // 9
const result = await executeFactoryHermesResearchRuntimeAdapter(input)
const command = result.commandResults[0]
assert.equal(command.commandKind, 'hermes_help_probe') // 10
assert.deepEqual(command.args, ['--help']) // 11
assert.equal(command.shell, false) // 12
assert.equal(command.cwdRef, '.codex-temp/external-tools/hermes-agent/install/75b300f/source') // 13
assert.ok(command.timeoutMs > 0 && command.timeoutMs <= 60000) // 14
assert.equal(command.stdinStatus, 'closed') // 15
assert.equal(typeof command.stdoutPreview, 'string') // 16
assert.equal(typeof command.stderrPreview, 'string') // 17
assert.ok(['completed', 'failed', 'timed_out', 'blocked'].includes(result.status)) // 18
if (result.status === 'completed') assert.equal(result.decision, 'hermes_research_runtime_help_probe_completed') // 19
if (result.decision === 'blocked_executable_missing') assert.equal(command.started, false) // 19b
assert.equal(result.canProceedToResultIngestion, true) // 20
assert.equal(result.canTreatAsResearchResult, false) // 21
assert.equal(result.canUseFindings, false) // 22
assert.equal(result.networkStatus, 'not_allowed') // 23
assert.equal(result.credentialsStatus, 'not_allowed') // 24
assert.equal(result.modelCallStatus, 'not_allowed') // 25
assert.equal(result.scriptsStatus, 'not_executed') // 26
assert.equal(result.pipStatus, 'not_executed') // 27
assert.equal(result.pythonDirectStatus, 'not_executed') // 28
assert.equal(result.setupPyStatus, 'not_executed') // 29
assert.equal(result.uvStatus, 'not_executed') // 30
assert.notEqual(command.commandKind, 'uv') // 31
assert.notEqual(command.commandKind, 'pip') // 32
assert.notEqual(command.commandKind, 'python') // 33
assert.notEqual(command.commandKind, 'setup_py') // 34
assert.notEqual(command.commandKind, 'hermes_script') // 35
assert.ok(result.outputRootRef.startsWith('.codex-temp/')) // 36
assert.ok(result.tempRootRef.startsWith('.codex-temp/')) // 37
assert.equal(existsSync(paths.adapterResult), true) // 38
assert.equal(validateFactoryHermesResearchRuntimeAdapterInput(input).ok, true) // 39
const validation = validateFactoryHermesResearchRuntimeAdapterResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 40
assert.equal(parseFactoryHermesResearchRuntimeAdapterResult(serializeFactoryHermesResearchRuntimeAdapterResult(result)).adapterRunId, result.adapterRunId) // 41
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|raw env|process\.env/iu.test(JSON.stringify(summarizeFactoryHermesResearchRuntimeAdapterResult(result))), false) // 42
assert.equal(sha256('package.json'), expectedPackageHash) // 43
assert.equal(sha256('package-lock.json'), expectedLockHash) // 44
assert.ok(/Result Ingestion Gate/iu.test(result.recommendedNextStep)) // 45
assert.equal(result.commandName, 'hermes') // 46
assert.equal(result.pythonEntrypoint, 'hermes_cli.main:main') // 47
assert.equal(result.canCallModels, false) // 48
assert.equal(result.canUseCredentials, false) // 49
assert.equal(result.canUseNetwork, false) // 50
assert.equal(result.canDeploy, false) // 51
assert.equal(result.executableRef.endsWith('python-env/Scripts/hermes.exe'), true) // 52
assert.equal(approval.approvedHermesResearchRuntimeAdapterEnvelope.executionAuthorizationScope, 'future_runtime_adapter_only') // 53
assert.equal(boundary.hermesResearchRuntimeBoundaryContract.commandBoundary.futureCommandCandidate.shell, false) // 54
assert.equal(boundary.hermesResearchRuntimeBoundaryContract.commandBoundary.commandsAllowedNow.length, 0) // 55

if (!['completed', 'failed', 'timed_out', 'blocked'].includes(result.status)) {
  console.error(JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers, noFallback: true, noUv: true, noPip: true, noPython: true, noSetupPy: true, noNetwork: true, noCredentials: true }, null, 2))
  process.exit(1)
}

console.log(JSON.stringify({
  ok: true,
  checks: 55,
  executableExists,
  status: result.status,
  decision: result.decision,
  mode: result.mode,
  command: `${result.executableRef} --help`,
  exitCode: result.exitCode,
  timedOut: result.timedOut,
  killed: result.killed,
  canProceedToResultIngestion: result.canProceedToResultIngestion,
  canTreatAsResearchResult: result.canTreatAsResearchResult,
  hermesExecutionStatus: result.hermesExecutionStatus,
}, null, 2))
