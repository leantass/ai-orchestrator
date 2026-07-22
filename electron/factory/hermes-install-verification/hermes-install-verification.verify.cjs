const fs = require('node:fs/promises')
const { resolveFactoryHermesInstallVerificationRoot } = require('./hermes-install-verification.path.cjs')

const KIND = 'factory_hermes_install_verification'
const VERSION = '1.0'
const nextStep = 'Proceed to Factory Hermes Python Install Strategy Gate v1 before Hermes execution or research runtime planning.'

async function exists(target) { try { await fs.access(target); return true } catch { return false } }
async function readJson(target) { return JSON.parse(await fs.readFile(target, 'utf8')) }
function apparentSecrets(value) { return /(api[_-]?key|secret|token|password)\s*[:=]/iu.test(JSON.stringify(value)) }

async function verifyFactoryHermesInstallArtifacts(input) {
  const paths = resolveFactoryHermesInstallVerificationRoot(input.installRoot)
  const blockers = []
  const warnings = []
  const checks = []
  const installRootExists = await exists(paths.installRoot)
  const sourceCopyExists = await exists(paths.sourceCopyRoot)
  const gitDirectoryAbsent = !(await exists(`${paths.sourceCopyRoot}/.git`))
  const manifestExists = await exists(paths.manifestPath)
  const installResultExists = await exists(paths.resultPath)
  const packageJsonExists = await exists(`${paths.sourceCopyRoot}/package.json`)
  const packageLockExists = await exists(`${paths.sourceCopyRoot}/package-lock.json`)
  const nodeModulesExists = await exists(`${paths.sourceCopyRoot}/node_modules`)
  let manifest = {}
  let installResult = {}
  let manifestParsed = false
  let resultParsed = false
  try { manifest = await readJson(paths.manifestPath); manifestParsed = true } catch { blockers.push({ blockerId: 'manifest_parse_failed', message: 'install-manifest.json did not parse.' }) }
  try { installResult = await readJson(paths.resultPath); resultParsed = true } catch { blockers.push({ blockerId: 'result_parse_failed', message: 'install-result.json did not parse.' }) }
  const commands = Array.isArray(installResult.commandResults) ? installResult.commandResults : []
  const npmCommand = commands.find((command) => command.commandKind === 'npm_cli_js_ci_ignore_scripts')
  const commandText = JSON.stringify(npmCommand?.command ?? [])
  const commandVerification = {
    npmCliJsCommandFound: Boolean(npmCommand),
    shellFalse: commands.every((command) => command.shell === false),
    argsExact: Boolean(npmCommand?.command?.includes('ci') && npmCommand.command.includes('--ignore-scripts') && npmCommand.command.includes('--no-audit') && npmCommand.command.includes('--no-fund')),
    noCmdExe: !/cmd\.exe/iu.test(commandText),
    noPowerShell: !/powershell/iu.test(commandText),
    noNpmInstall: !/\binstall\b/iu.test(commandText.replace('ignore-scripts', '')),
    noPipInstall: !/pip\s+install/iu.test(JSON.stringify(commands)),
    noSetupPyExecution: !/setup\.py/iu.test(JSON.stringify(commands)),
  }
  const artifactStatus = { installRootExists, sourceCopyExists, gitDirectoryAbsent, manifestExists, installResultExists, nodeModulesExists, packageJsonExists, packageLockExists }
  for (const [key, ok] of Object.entries(artifactStatus)) checks.push({ checkId: key, ok: Boolean(ok), message: `${key}: ${ok}` })
  if (!installRootExists || !sourceCopyExists || !manifestExists || !installResultExists) blockers.push({ blockerId: 'missing_install_artifact', message: 'Required install artifact missing.' })
  if (!gitDirectoryAbsent) blockers.push({ blockerId: 'git_directory_present', message: 'source copy contains .git.' })
  if (manifest.auditedHead !== input.expectedAuditedHead) blockers.push({ blockerId: 'audited_head_mismatch', message: 'auditedHead mismatch.' })
  if (manifest.installVersionScope !== input.expectedInstallVersionScope) blockers.push({ blockerId: 'install_scope_mismatch', message: 'installVersionScope mismatch.' })
  if (!commandVerification.npmCliJsCommandFound || !commandVerification.shellFalse || !commandVerification.argsExact || !commandVerification.noCmdExe || !commandVerification.noPowerShell || !commandVerification.noNpmInstall) blockers.push({ blockerId: 'command_verification_failed', message: 'npm command verification failed.' })
  if (manifest.pythonInstallStatus === 'blocked_requires_python_install_strategy') warnings.push({ warningId: 'python_strategy_required', message: 'Python install strategy remains required.' })
  if (apparentSecrets(manifest) || apparentSecrets(installResult)) blockers.push({ blockerId: 'secret_like_material', message: 'manifest/result contain secret-like material.' })
  const nodeInstallVerified = manifest.nodeInstallStatus === 'installed_with_npm_ci_ignore_scripts' && installResult.nodeInstallStatus === 'installed_with_npm_ci_ignore_scripts' && Boolean(npmCommand) && nodeModulesExists
  const pythonInstallStatus = manifest.pythonInstallStatus ?? installResult.pythonInstallStatus ?? 'unknown'
  const status = blockers.length ? 'blocked' : pythonInstallStatus === 'blocked_requires_python_install_strategy' ? 'verified_partial' : 'verified'
  const decision = blockers.length ? 'blocked' : pythonInstallStatus === 'blocked_requires_python_install_strategy' ? 'verified_node_install_python_strategy_required' : 'verified_install_ready_for_next_gate'
  return {
    verificationId: `hermes-install-verification:${input.expectedAuditedHead.slice(0, 7)}:${input.verifiedAt}`,
    verificationKind: KIND,
    verificationVersion: VERSION,
    verifiedAt: input.verifiedAt,
    verifiedBy: input.verifiedBy,
    toolId: 'hermes_agent',
    installRoot: paths.installRoot,
    sourceCopyRoot: paths.sourceCopyRoot,
    auditedHead: manifest.auditedHead,
    installVersionScope: manifest.installVersionScope,
    status,
    decision,
    artifactStatus,
    manifestVerification: { manifestParsed, resultParsed, toolId: manifest.toolId ?? 'unknown', auditedHeadMatches: manifest.auditedHead === input.expectedAuditedHead, installVersionScopeMatches: manifest.installVersionScope === input.expectedInstallVersionScope },
    commandVerification,
    checks,
    blockers,
    warnings,
    nodeInstallVerified,
    pythonInstallStatus,
    hermesExecutionVerifiedAsNotRun: installResult.hermesExecutionStatus === 'not_allowed' && manifest.hermesExecutionStatus === 'not_allowed',
    scriptsVerifiedAsNotRun: installResult.scriptsStatus === 'not_executed' && manifest.scriptsExecuted === false,
    projectPackageMutationDetected: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: nextStep,
  }
}

module.exports = { verifyFactoryHermesInstallArtifacts }
