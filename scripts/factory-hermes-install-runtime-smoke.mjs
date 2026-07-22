import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { evaluateFactoryHermesInstallationPlan } from '../src/factory/hermes-installation-plan/index.ts'
import { evaluateFactoryHermesRuntimeBoundary } from '../src/factory/hermes-runtime-boundary/index.ts'
import { evaluateFactoryHermesInstallApproval } from '../src/factory/hermes-install-approval/index.ts'
import {
  parseFactoryHermesInstallRuntimeResult,
  serializeFactoryHermesInstallRuntimeResult,
  summarizeFactoryHermesInstallRuntimeResult,
  validateFactoryHermesInstallRuntimeResult,
} from '../src/factory/hermes-install-runtime/index.ts'
import { executeFactoryHermesInstallRuntime } from '../electron/factory/hermes-install-runtime/index.cjs'

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

async function pathExists(path) {
  try { await stat(path); return true } catch { return false }
}

const jefePackageHashBefore = await sha256('package.json')
const jefeLockHashBefore = await sha256('package-lock.json')

const sourceAuditSnapshot = {
  remoteUrl: 'https://github.com/NousResearch/hermes-agent.git',
  sourcePath: '.codex-temp/external-tools/hermes-agent/source',
  auditedHead: '75b300f13af40878ad6482b2ecb39c55c86679fe',
  remoteHead: 'cf52edbb595638fd6c9d7286ce4ff081fa95129b',
  headsMatch: false,
  checkoutStrategy: 'windows_safe_sparse_checkout',
  sparsePatterns: ['/README*', '/package.json', '/pyproject.toml', '!/website/i18n/**'],
  manifestsFound: ['README.md', 'LICENSE', 'package.json', 'package-lock.json', 'pyproject.toml', 'setup.py', 'uv.lock'],
  likelyEcosystems: ['mixed'],
  installSurfaces: [{ surfaceId: 'node', kind: 'node', path: 'package.json', description: 'Node install surface.', installCommandCandidates: ['npm install'], executionAllowedNow: false }],
  runtimeSurfaces: [{ surfaceId: 'cli', kind: 'cli', path: 'run_agent.py', description: 'CLI surface.', executionAllowedNow: false }],
  cliSurfaces: ['run_agent.py'],
  docsSurfaces: ['README.md'],
  licenseDetected: 'LICENSE',
  packageManagersDetected: ['npm', 'python'],
  lockfilesDetected: ['package-lock.json', 'uv.lock'],
  scriptsDetected: ['scripts/install.ps1'],
  riskNotes: ['Mixed install surface.'],
}

const planResult = evaluateFactoryHermesInstallationPlan({ sourceAuditSnapshot, createdAt: '2026-07-17T00:00:00.000Z', createdBy: 'install-runtime-smoke' })
const boundaryResult = evaluateFactoryHermesRuntimeBoundary({ hermesInstallationPlanResult: planResult, createdAt: '2026-07-17T00:01:00.000Z', createdBy: 'install-runtime-smoke', humanReviewRef: 'human-review/hermes-runtime-boundary-v1' })
const approvalResult = evaluateFactoryHermesInstallApproval({ hermesInstallationPlanResult: planResult, hermesRuntimeBoundaryResult: boundaryResult, reviewedAt: '2026-07-17T00:02:00.000Z', reviewedBy: 'lean', humanApprovalRef: 'human-review/hermes-install-approval-v1' })

const result = await executeFactoryHermesInstallRuntime({
  hermesInstallApprovalResult: approvalResult,
  executedAt: '2026-07-17T00:03:00.000Z',
  executedBy: 'install-runtime-smoke',
})

assert.equal(result.status, 'success') // 1
assert.ok(result.installRoot.startsWith('.codex-temp/external-tools/hermes-agent/install/')) // 2
assert.ok(await pathExists(result.sourceCopyRoot)) // 3
assert.equal(await pathExists(`${result.sourceCopyRoot}/.git`), false) // 4
assert.equal(result.commandResults.find((command) => command.commandKind === 'npm_cli_js_ci_ignore_scripts') ? await pathExists(`${result.sourceCopyRoot}/node_modules`) : false, result.nodeInstallStatus === 'installed_with_npm_ci_ignore_scripts') // 5
assert.equal(result.checks.includes('auditedHead verified'), true) // 6
assert.equal(existsSync(`${result.sourceCopyRoot}/package.json`) && existsSync(`${result.sourceCopyRoot}/package-lock.json`), true) // 7
const npmCommand = result.commandResults.find((command) => command.commandKind === 'npm_cli_js_ci_ignore_scripts')
assert.equal(npmCommand?.command.includes('ci'), true) // 8
assert.equal(npmCommand?.command.includes('--ignore-scripts'), true) // 9
assert.equal(npmCommand?.command.includes('--no-audit'), true) // 10
assert.equal(npmCommand?.command.includes('--no-fund'), true) // 11
assert.equal(npmCommand?.shell, false) // 12
assert.equal(npmCommand?.executableUsed, process.execPath)
assert.ok(npmCommand?.npmCliJsPath)
assert.equal(result.scriptsStatus, 'not_executed') // 13
assert.equal(result.hermesExecutionStatus, 'not_allowed') // 14
assert.equal(result.credentialsStatus, 'not_allowed') // 15
assert.equal(result.canExecuteHermes, false) // 16
assert.equal(result.canRunHermesScripts, false) // 17
assert.equal(result.canUseCredentials, false) // 18
assert.equal(result.canCallModels, false) // 19
assert.equal(result.canMutateProjectFiles, false) // 20
assert.equal(result.canDeploy, false) // 21
assert.equal(result.pythonInstallStatus, 'blocked_requires_python_install_strategy') // 22
assert.equal(result.commandResults.some((command) => command.command.includes('setup.py')), false) // 23
assert.equal(result.commandResults.some((command) => /install\.(sh|ps1)/iu.test(command.command.join(' '))), false) // 24
assert.equal(await pathExists(result.manifestPath), true) // 25
assert.equal(await pathExists(result.resultPath), true) // 26
assert.equal(result.manifest.manifestKind, 'factory_hermes_install_manifest') // 27
assert.equal(validateFactoryHermesInstallRuntimeResult(result).ok, true) // 28
assert.equal(parseFactoryHermesInstallRuntimeResult(serializeFactoryHermesInstallRuntimeResult(result)).installRuntimeId, result.installRuntimeId) // 29
assert.equal(JSON.stringify(summarizeFactoryHermesInstallRuntimeResult(result)).includes('added '), false) // 30
assert.equal(await sha256('package.json'), jefePackageHashBefore) // 31
assert.equal(await sha256('package-lock.json'), jefeLockHashBefore) // 32
assert.equal(result.commandResults.some((command) => command.command.join(' ').includes('.env')), false) // 33
assert.equal(result.commandResults.some((command) => command.command.includes('-g')), false) // 34
assert.equal(result.hermesExecutionStatus, 'not_allowed') // 35
assert.ok(/Install Verification Gate|Python Install Strategy/u.test(result.recommendedNextStep) && !/execute Hermes directly/iu.test(result.recommendedNextStep)) // 36

console.log(JSON.stringify({
  ok: true,
  checks: 36,
  status: result.status,
  installRoot: result.installRoot,
  nodeInstallStatus: result.nodeInstallStatus,
  pythonInstallStatus: result.pythonInstallStatus,
  commands: result.commandResults.map((command) => ({ kind: command.commandKind, exitCode: command.exitCode, shell: command.shell })),
}, null, 2))
