import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import runtime from '../electron/factory/hermes-controlled-research-runtime-execution/index.cjs'
import { parseFactoryHermesControlledResearchRuntimeExecutionResult, serializeFactoryHermesControlledResearchRuntimeExecutionResult, summarizeFactoryHermesControlledResearchRuntimeExecutionResult, validateFactoryHermesControlledResearchRuntimeExecutionResult } from '../src/factory/hermes-controlled-research-runtime-execution/index.ts'

const { executeFactoryHermesControlledResearchRuntimeExecution, resolveFactoryHermesControlledResearchRuntimeExecutionPaths } = runtime
const paths = resolveFactoryHermesControlledResearchRuntimeExecutionPaths()
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').toUpperCase()

assert.equal(existsSync(paths.executionApprovalResult), true) // 1
JSON.parse(readFileSync(paths.executionApprovalResult, 'utf8')) // 2
const result = await executeFactoryHermesControlledResearchRuntimeExecution({ executedAt: '2026-07-24T03:00:00.000Z', executedBy: 'factory-hermes-controlled-research-runtime-execution-smoke' })
assert.equal(existsSync(paths.executionResult), true) // 3
assert.ok(['controlled_research_runtime_execution_completed', 'controlled_research_runtime_execution_blocked', 'controlled_research_runtime_execution_failed'].includes(result.status)) // 4
assert.ok(['hermes_controlled_research_runtime_execution_completed_for_review', 'hermes_controlled_research_runtime_execution_blocked_final_guards_not_satisfied', 'hermes_controlled_research_runtime_execution_failed_for_review'].includes(result.decision)) // 5
for (const key of ['finalRuntimePreflightResult', 'verifiedArtifactStabilityResult', 'finalRuntimeGuardDecision', 'controlledRuntimeExecutionReviewEnvelope']) assert.ok(result[key]) // 6-9
if (result.finalRuntimePreflightResult.passed) assert.ok(result.finalPromptArtifactManifest) // 10
if (result.finalRuntimeGuardDecision.safeCommandShapeProven) assert.ok(result.finalCredentialAccessAudit) // 11
if (result.finalRuntimeGuardDecision.allFinalGuardsPassed) assert.ok(result.finalRuntimeCommandEnvelope) // 12
assert.equal(result.canProceedToControlledResearchRuntimeExecutionReview, true) // 13
assert.equal(result.canUseFindings, false) // 14
assert.equal(result.findingsUseApprovedNow, false) // 15
assert.equal(sha256('package.json'), '660BFE94E2C1AC11ABDAA04AC36190503B4638217932C8C0D2BFE5F5CD0259FF') // 16
assert.equal(sha256('package-lock.json'), '6A202A2A9D202936DFEE777591FE2E01CFFC0AB588C6775FAF20849990280303') // 17
assert.equal(/package(-lock)?\.json/u.test(execFileSync('git', ['status', '--short'], { encoding: 'utf8' })), false) // 18
assert.equal(result.controlledRuntimePostRunGitAuditResult.noSourceHermesMutation, true) // 19
assert.equal(result.controlledRuntimePostRunGitAuditResult.noUiPreloadAppMutation, true) // 20
assert.equal(result.finalCredentialAccessAudit.dotEnvRead, false) // 21
assert.equal(result.credentialValueLogged, false) // 22
assert.equal(/sk-[a-z0-9]|bearer\s+|OPENAI_API_KEY\s*=/iu.test(readFileSync(paths.executionResult, 'utf8')), false) // 23
assert.equal(/credential value persisted|api key value/iu.test(readFileSync(paths.executionResult, 'utf8')), false) // 24
assert.equal(result.canUseFindings, false) // 25
if (result.status === 'controlled_research_runtime_execution_completed') {
  assert.equal(result.singleControlledRunExecuted, true) // 26
  assert.equal(result.rawOutputCaptured, true) // 27
  assert.equal(result.outputRedacted, true) // 28
  assert.equal(result.outputBounded, true) // 29
  assert.equal(result.timeoutKillSwitchApplied, true) // 30
}
if (result.status === 'controlled_research_runtime_execution_blocked') assert.equal(result.singleControlledRunExecuted, false) // 31
if (result.status === 'controlled_research_runtime_execution_failed') assert.equal(result.canUseFindings, false) // 32
for (const file of [result.controlledRuntimeProcessExecutionResult?.stdoutRedactedPath, result.controlledRuntimeProcessExecutionResult?.stderrRedactedPath].filter(Boolean)) assert.ok(file.includes('.codex-temp')) // 33
assert.ok(paths.executionResult.includes('.codex-temp')) // 34
assert.equal(result.finalRuntimePreflightResult.noPackageChanges, true) // 35
assert.equal(execFileSync('git', ['diff', '--cached', '--name-status'], { encoding: 'utf8' }).trim(), '') // 36
assert.equal(execFileSync('git', ['diff', '--check'], { encoding: 'utf8' }).trim(), '') // 37
assert.equal(/sk-[a-z0-9]|bearer\s+|process\.env|full source|full stdout|full stderr|password\s*[:=]/iu.test(JSON.stringify(summarizeFactoryHermesControlledResearchRuntimeExecutionResult(result))), false) // 38
assert.equal(validateFactoryHermesControlledResearchRuntimeExecutionResult(result).ok, true, JSON.stringify(validateFactoryHermesControlledResearchRuntimeExecutionResult(result)))
assert.equal(parseFactoryHermesControlledResearchRuntimeExecutionResult(serializeFactoryHermesControlledResearchRuntimeExecutionResult(result)).executionId, result.executionId)
console.log('factory-hermes-controlled-research-runtime-execution-smoke: PASS 38 checks')
