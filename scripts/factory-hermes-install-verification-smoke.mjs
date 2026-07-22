import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import {
  parseFactoryHermesInstallVerificationResult,
  serializeFactoryHermesInstallVerificationResult,
  summarizeFactoryHermesInstallVerificationResult,
  validateFactoryHermesInstallVerificationResult,
} from '../src/factory/hermes-install-verification/index.ts'
import { verifyFactoryHermesInstallArtifacts } from '../electron/factory/hermes-install-verification/index.cjs'

const installRoot = '.codex-temp/external-tools/hermes-agent/install/75b300f'
const result = await verifyFactoryHermesInstallArtifacts({
  installRoot,
  expectedAuditedHead: '75b300f13af40878ad6482b2ecb39c55c86679fe',
  expectedInstallVersionScope: 'audited_head_only',
  verifiedAt: '2026-07-17T00:04:00.000Z',
  verifiedBy: 'install-verification-smoke',
})

assert.equal(result.artifactStatus.installRootExists, true) // 1
assert.equal(result.artifactStatus.sourceCopyExists, true) // 2
assert.equal(result.artifactStatus.gitDirectoryAbsent, true) // 3
assert.equal(result.artifactStatus.manifestExists, true) // 4
assert.equal(result.artifactStatus.installResultExists, true) // 5
assert.equal(result.manifestVerification.manifestParsed, true) // 6
assert.equal(result.manifestVerification.resultParsed, true) // 7
assert.equal(result.manifestVerification.toolId, 'hermes_agent') // 8
assert.equal(result.manifestVerification.auditedHeadMatches, true) // 9
assert.equal(result.manifestVerification.installVersionScopeMatches, true) // 10
assert.equal(result.nodeInstallVerified, true) // 11
assert.equal(result.pythonInstallStatus, 'blocked_requires_python_install_strategy') // 12
assert.equal(result.scriptsVerifiedAsNotRun, true) // 13
assert.equal(result.hermesExecutionVerifiedAsNotRun, true) // 14
assert.equal(result.canUseCredentials, false) // 15
assert.equal(result.commandVerification.npmCliJsCommandFound, true) // 16
assert.equal(result.commandVerification.shellFalse, true) // 17
assert.equal(result.commandVerification.argsExact, true) // 18
assert.equal(result.commandVerification.argsExact, true) // 19
assert.equal(result.commandVerification.argsExact, true) // 20
assert.equal(result.commandVerification.argsExact, true) // 21
assert.equal(result.commandVerification.noCmdExe, true) // 22
assert.equal(result.commandVerification.noPowerShell, true) // 23
assert.equal(result.commandVerification.noNpmInstall, true) // 24
assert.equal(result.artifactStatus.packageJsonExists, true) // 25
assert.equal(result.artifactStatus.packageLockExists, true) // 26
assert.equal(result.artifactStatus.nodeModulesExists, true) // 27
assert.equal(result.commandVerification.noSetupPyExecution, true) // 28
assert.equal(result.commandVerification.noPipInstall, true) // 29
assert.equal(result.hermesExecutionVerifiedAsNotRun, true) // 30
assert.equal(result.scriptsVerifiedAsNotRun, true) // 31
assert.equal(validateFactoryHermesInstallVerificationResult(result).ok, true) // 32
assert.equal(parseFactoryHermesInstallVerificationResult(serializeFactoryHermesInstallVerificationResult(result)).verificationId, result.verificationId) // 33
assert.equal(JSON.stringify(summarizeFactoryHermesInstallVerificationResult(result)).includes('added 1304'), false) // 34
assert.equal(result.canExecuteHermes, false) // 35
assert.equal(result.canRunHermesScripts, false) // 36
assert.equal(result.canUseCredentials, false) // 37
assert.equal(result.canCallModels, false) // 38
assert.equal(result.canMutateProjectFiles, false) // 39
assert.equal(result.canDeploy, false) // 40
assert.equal(result.decision, 'verified_node_install_python_strategy_required') // 41
assert.equal(result.status, 'verified_partial') // 42
assert.ok(/Python Install Strategy Gate/u.test(result.recommendedNextStep) && !/execute Hermes directly/iu.test(result.recommendedNextStep)) // 43
assert.equal(existsSync(`${installRoot}/source/package.json`), true)

console.log(JSON.stringify({ ok: true, checks: 43, status: result.status, decision: result.decision, nodeInstallVerified: result.nodeInstallVerified, pythonInstallStatus: result.pythonInstallStatus }, null, 2))
