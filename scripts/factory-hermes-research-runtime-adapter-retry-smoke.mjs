import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import retryRuntime from '../electron/factory/hermes-research-runtime-adapter-retry/index.cjs'
import { parseFactoryHermesResearchRuntimeAdapterRetryResult, serializeFactoryHermesResearchRuntimeAdapterRetryResult, summarizeFactoryHermesResearchRuntimeAdapterRetryResult, validateFactoryHermesResearchRuntimeAdapterRetryInput, validateFactoryHermesResearchRuntimeAdapterRetryResult } from '../src/factory/hermes-research-runtime-adapter-retry/index.ts'

const { executeFactoryHermesResearchRuntimeAdapterRetry, resolveFactoryHermesResearchRuntimeAdapterRetryPaths } = retryRuntime
const paths = resolveFactoryHermesResearchRuntimeAdapterRetryPaths()
const expectedPackageHash = '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF'
const expectedLockHash = '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303'
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const sha256Upper = (file) => sha256(file).toUpperCase()

assert.equal(existsSync(paths.verificationResult), true) // 1
const verification = JSON.parse(readFileSync(paths.verificationResult, 'utf8'))
assert.ok(['verified', 'warning_verified'].includes(verification.status)) // 2
assert.equal(verification.decision, 'hermes_entrypoint_materialization_verified_for_research_runtime_adapter_retry') // 3
assert.equal(verification.canProceedToResearchRuntimeAdapterRetry, true) // 4
assert.ok(verification.approvedResearchRuntimeAdapterRetryEnvelope) // 5
assert.equal(verification.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryMayExecuteHermesHelpOnly, true) // 6
assert.deepEqual(verification.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryCommand.args, ['--help']) // 7
assert.equal(verification.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryCommand.shell, false) // 8
assert.equal(verification.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryMustNotUseNetwork, true) // 9
assert.equal(verification.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryMustNotUseCredentials, true) // 10
assert.equal(verification.approvedResearchRuntimeAdapterRetryEnvelope.futureRetryMustNotCallModels, true) // 11
assert.equal(verification.expectedExecutableRef.endsWith('python-env/Scripts/hermes.exe'), true) // 12
assert.equal(existsSync(paths.executable), true) // 13
assert.equal(sha256(paths.executable), verification.executableSha256) // 14
assert.equal(existsSync(paths.boundaryResult), true) // 15
assert.equal(existsSync(paths.approvalResult), true) // 16
assert.equal(existsSync(paths.interfaceSelectionResult), true) // 17

const input = { executedAt: '2026-07-22T05:10:00.000Z', executedBy: 'factory-hermes-research-runtime-adapter-retry-smoke', entrypointMaterializationVerificationResult: verification }
assert.equal(validateFactoryHermesResearchRuntimeAdapterRetryInput(input).ok, true) // 18
const result = await executeFactoryHermesResearchRuntimeAdapterRetry(input)
assert.ok(['success', 'controlled_failure'].includes(result.status), JSON.stringify({ status: result.status, decision: result.decision, blockers: result.blockers })) // 19
assert.ok(['hermes_research_runtime_adapter_retry_help_probe_succeeded', 'failed_hermes_help_probe', 'failed_hermes_help_probe_timeout', 'blocked_network_attempt_detected'].includes(result.decision)) // 20
assert.equal(result.toolId, 'hermes_agent') // 21
assert.equal(result.commandName, 'hermes') // 22
assert.equal(result.pythonEntrypoint, 'hermes_cli.main:main') // 23
assert.equal(result.executableRef.endsWith('python-env/Scripts/hermes.exe'), true) // 24
assert.equal(result.commandResults.length, 1) // 25
const command = result.commandResults[0]
assert.equal(command.commandKind, 'hermes_help_probe') // 26
assert.deepEqual(command.args, ['--help']) // 27
assert.equal(command.shell, false) // 28
assert.equal(command.cwdRef, '.codex-temp/external-tools/hermes-agent/install/75b300f/source') // 29
assert.ok(command.timeoutMs > 0 && command.timeoutMs <= 180000) // 30
assert.equal(command.envRefs.HERMES_NO_NETWORK, '1') // 31
assert.equal(command.envRefs.HERMES_NO_MODEL_CALLS, '1') // 32
assert.equal(command.envRefs.HERMES_NO_CREDENTIALS, '1') // 33
assert.equal(/uv|uv sync|uv run|uv pip|uv venv|pip|python|setup\.py/iu.test(JSON.stringify({ commandKind: command.commandKind, args: command.args })), false) // 34
assert.equal(typeof command.stdoutPreview, 'string') // 35
assert.equal(typeof command.stderrPreview, 'string') // 36
assert.equal(command.started, true) // 37
if (result.status === 'success') {
  assert.equal(result.decision, 'hermes_research_runtime_adapter_retry_help_probe_succeeded') // 38
  assert.equal(result.helpProbeStatus, 'succeeded') // 39
  assert.equal(result.exitCode, 0) // 40
  assert.equal(result.timedOut, false) // 41
  assert.equal(result.hermesExecutionStatus, 'executed_help_probe_only') // 42
  assert.equal(result.selectedInterfaceExecutionStatus, 'executed_help_probe_only') // 43
} else {
  assert.ok(['failed_hermes_help_probe', 'failed_hermes_help_probe_timeout', 'blocked_network_attempt_detected'].includes(result.decision)) // 44
  assert.notEqual(result.helpProbeStatus, 'succeeded') // 45
  assert.equal(result.hermesExecutionStatus, 'executed_help_probe_only_failed') // 46
}
assert.equal(result.canProceedToResearchResultIngestionV2, true) // 47
assert.equal(result.canTreatAsResearchResult, false) // 48
assert.equal(result.canUseFindings, false) // 49
assert.equal(result.canExecuteHermesNow, false) // 50
assert.equal(result.canUseNetwork, false) // 51
assert.equal(result.canUseCredentials, false) // 52
assert.equal(result.canCallModels, false) // 53
assert.equal(result.networkStatus, 'not_allowed') // 54
assert.equal(result.credentialsStatus, 'not_allowed') // 55
assert.equal(result.modelCallStatus, 'not_allowed') // 56
assert.equal(result.pipStatus, 'not_executed') // 57
assert.equal(result.pythonDirectStatus, 'not_executed') // 58
assert.equal(result.setupPyDirectStatus, 'not_executed') // 59
assert.equal(result.uvStatus, 'not_executed') // 60
assert.equal(result.materializationStatus, 'not_attempted') // 61
assert.equal(result.cacheRuntimeStatus, 'not_attempted') // 62
assert.equal(result.canDeploy, false) // 63
assert.equal(existsSync(paths.manifest), true) // 64
assert.equal(existsSync(paths.result), true) // 65
const validation = validateFactoryHermesResearchRuntimeAdapterRetryResult(result)
assert.equal(validation.ok, true, JSON.stringify(validation)) // 66
assert.equal(parseFactoryHermesResearchRuntimeAdapterRetryResult(serializeFactoryHermesResearchRuntimeAdapterRetryResult(result)).retryRunId, result.retryRunId) // 67
assert.equal(/BEGIN|password|secret|api[_-]?key|bearer|process\.env|full stdout|full stderr|credential/iu.test(JSON.stringify(summarizeFactoryHermesResearchRuntimeAdapterRetryResult(result))), false) // 68
assert.ok(/Research Result Ingestion Gate v2/iu.test(result.recommendedNextStep) && !/research findings/iu.test(result.stdoutPreview.slice(0, 80))) // 69
assert.equal(sha256Upper('package.json'), expectedPackageHash) // 70
assert.equal(sha256Upper('package-lock.json'), expectedLockHash) // 71

console.log(JSON.stringify({ ok: true, checks: 71, status: result.status, decision: result.decision, helpProbeStatus: result.helpProbeStatus, exitCode: result.exitCode, timedOut: result.timedOut, hermesExecutionStatus: result.hermesExecutionStatus, canProceedToResearchResultIngestionV2: result.canProceedToResearchResultIngestionV2, canTreatAsResearchResult: result.canTreatAsResearchResult, canUseFindings: result.canUseFindings, networkStatus: result.networkStatus, credentialsStatus: result.credentialsStatus, modelCallStatus: result.modelCallStatus, pipStatus: result.pipStatus, pythonDirectStatus: result.pythonDirectStatus, setupPyDirectStatus: result.setupPyDirectStatus, uvStatus: result.uvStatus }, null, 2))
