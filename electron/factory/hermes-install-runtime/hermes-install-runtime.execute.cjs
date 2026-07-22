const fs = require('node:fs/promises')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { resolveHermesInstallPaths } = require('./hermes-install-runtime.path.cjs')

const KIND = 'factory_hermes_install_runtime'
const VERSION = '1.0'
const nextStep = 'Proceed to Hermes Install Verification Gate; Python surfaces require Hermes Python Install Strategy Gate before any Python installation.'
const forbiddenEnvName = /(SECRET|TOKEN|API_KEY|PASSWORD|PRIVATE|OPENAI|GITHUB_TOKEN|NPM_TOKEN|NODE_AUTH_TOKEN)/iu

function sanitizeCommandOutput(value) {
  return String(value ?? '')
    .replace(/(api[_-]?key|secret|token|password)\s*[:=]\s*\S+/giu, '$1=[REDACTED]')
    .slice(0, 4000)
}

async function resolveNpmCliJsPath() {
  const candidates = []
  if (process.env.npm_execpath && /npm-cli\.js$/iu.test(process.env.npm_execpath)) candidates.push(process.env.npm_execpath)
  const nodeDir = path.dirname(process.execPath)
  candidates.push(path.join(nodeDir, 'node_modules', 'npm', 'bin', 'npm-cli.js'))
  candidates.push(path.join(nodeDir, '..', 'lib', 'node_modules', 'npm', 'bin', 'npm-cli.js'))
  const pathEntries = String(process.env.PATH ?? '').split(path.delimiter).filter(Boolean)
  for (const entry of pathEntries) {
    try {
      const names = await fs.readdir(entry)
      if (names.some((name) => name.toLowerCase() === 'npm.cmd' || name.toLowerCase() === 'npm')) {
        candidates.push(path.join(entry, 'node_modules', 'npm', 'bin', 'npm-cli.js'))
        candidates.push(path.join(path.dirname(entry), 'node_modules', 'npm', 'bin', 'npm-cli.js'))
      }
    } catch {}
  }
  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      return candidate
    } catch {}
  }
  return null
}

async function buildSanitizedEnv(installRoot) {
  const env = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (forbiddenEnvName.test(key)) continue
    if (['PATH', 'Path', 'SystemRoot', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'ComSpec'].includes(key)) env[key] = value
  }
  const npmrcPath = path.join(installRoot, '.npmrc')
  await fs.mkdir(installRoot, { recursive: true })
  await fs.writeFile(npmrcPath, '')
  env.NPM_CONFIG_USERCONFIG = npmrcPath
  return env
}

async function runAllowedCommand(commandKind, cwd, timeoutMs = 120000, options = {}) {
  const npmCliJsPath = await resolveNpmCliJsPath()
  const allowed = {
    git_rev_parse_head: ['git', ['rev-parse', 'HEAD']],
    node_version: ['node', ['--version']],
    npm_cli_js_version: npmCliJsPath ? [process.execPath, [npmCliJsPath, '--version'], npmCliJsPath] : null,
    npm_cli_js_ci_ignore_scripts: npmCliJsPath ? [process.execPath, [npmCliJsPath, 'ci', '--ignore-scripts', '--no-audit', '--no-fund'], npmCliJsPath] : null,
    python_version_detection: ['python', ['--version']],
  }
  const spec = allowed[commandKind]
  if (commandKind.startsWith('npm_cli_js') && !spec) return { commandKind, executableUsed: process.execPath, npmCliJsPath: undefined, commandDisplay: 'node <npm-cli.js> ci --ignore-scripts --no-audit --no-fund', command: [process.execPath], cwd, shell: false, exitCode: null, stdout: '', stderr: 'npm_cli_js_not_found', durationMs: 0, timedOut: false }
  if (!spec) throw new Error(`Command kind not allowlisted: ${commandKind}`)
  const [file, args, npmCliPath] = spec
  const started = Date.now()
  const spawnEnv = commandKind.startsWith('npm_cli_js') ? await buildSanitizedEnv(options.installRoot ?? cwd) : process.env
  return new Promise((resolve) => {
    const child = spawn(file, args, { cwd, shell: false, windowsHide: true, env: spawnEnv })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill()
    }, timeoutMs)
    child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
    child.on('error', (error) => {
      clearTimeout(timer)
      const notFound = error && error.code === 'ENOENT'
      resolve({ commandKind, executableUsed: file, npmCliJsPath: npmCliPath, commandDisplay: commandKind.startsWith('npm_cli_js') ? `node <npm-cli.js> ${args.slice(1).join(' ')}` : [file, ...args].join(' '), command: [file, ...args], cwd, shell: false, exitCode: null, stdout: sanitizeCommandOutput(stdout), stderr: sanitizeCommandOutput(`${stderr}\n${notFound ? 'npm_cli_js_not_found: ' : ''}${error.message}`), durationMs: Date.now() - started, timedOut })
    })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ commandKind, executableUsed: file, npmCliJsPath: npmCliPath, commandDisplay: commandKind.startsWith('npm_cli_js') ? `node <npm-cli.js> ${args.slice(1).join(' ')}` : [file, ...args].join(' '), command: [file, ...args], cwd, shell: false, exitCode: code, stdout: sanitizeCommandOutput(stdout), stderr: sanitizeCommandOutput(stderr), durationMs: Date.now() - started, timedOut })
    })
  })
}

async function exists(target) {
  try { await fs.access(target); return true } catch { return false }
}

async function copySource(sourceRoot, sourceCopyRoot) {
  await fs.rm(sourceCopyRoot, { recursive: true, force: true })
  await fs.mkdir(path.dirname(sourceCopyRoot), { recursive: true })
  await fs.cp(sourceRoot, sourceCopyRoot, {
    recursive: true,
    filter: (source) => {
      const normalized = source.replaceAll('\\', '/')
      return !/\/\.git(\/|$)|\/node_modules(\/|$)|\/website\/i18n(\/|$)|\/\.cache(\/|$)/u.test(normalized)
    },
  })
}

function blocked(input, message) {
  return {
    installRuntimeId: `hermes-install-runtime:${input.executedAt}:${input.executedBy}`,
    installRuntimeKind: KIND,
    installRuntimeVersion: VERSION,
    executedAt: input.executedAt,
    executedBy: input.executedBy,
    toolId: 'hermes_agent',
    commandResults: [],
    surfaceResults: [],
    status: 'blocked',
    decision: 'blocked',
    checks: [],
    blockers: [message],
    warnings: [],
    nodeInstallStatus: 'not_started',
    pythonInstallStatus: 'not_started',
    scriptsStatus: 'not_executed',
    hermesExecutionStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: 'Repair Hermes install approval before install runtime.',
  }
}

async function executeFactoryHermesInstallRuntime(input) {
  const approval = input.hermesInstallApprovalResult
  const envelope = approval?.approvedInstallEnvelope
  if (!approval || approval.status !== 'install_envelope_candidate_approved') return blocked(input, 'Approved install approval result is required.')
  if (!envelope || envelope.installVersionScope !== 'audited_head_only') return blocked(input, 'Approved install envelope scoped to audited_head_only is required.')
  const auditedHead = envelope.auditedHead
  const paths = resolveHermesInstallPaths(auditedHead)
  const checks = []
  const blockers = []
  const warnings = []
  const commandResults = []
  const sourceOriginal = paths.sourceRoot
  if (!(await exists(sourceOriginal))) return blocked(input, 'Hermes source checkout is missing.')

  await fs.mkdir(paths.installRoot, { recursive: true })
  const gitHead = await runAllowedCommand('git_rev_parse_head', sourceOriginal, 30000)
  commandResults.push(gitHead)
  if (gitHead.exitCode !== 0 || gitHead.stdout.trim() !== auditedHead) return blocked(input, `Hermes source HEAD mismatch: ${gitHead.stdout.trim()}`)
  checks.push('auditedHead verified')

  await copySource(sourceOriginal, paths.sourceCopyRoot)
  checks.push('source copied without .git/node_modules/website i18n')

  const packageJson = path.join(paths.sourceCopyRoot, 'package.json')
  const packageLock = path.join(paths.sourceCopyRoot, 'package-lock.json')
  const pyproject = path.join(paths.sourceCopyRoot, 'pyproject.toml')
  const setupPy = path.join(paths.sourceCopyRoot, 'setup.py')
  const hasPackageJson = await exists(packageJson)
  const hasPackageLock = await exists(packageLock)
  const hasPythonSurface = (await exists(pyproject)) || (await exists(setupPy))
  const nodeInstallAllowed = input.allowNodeDependencyInstall !== false
  let nodeInstallStatus = 'not_applicable'
  let dependenciesInstalled = false
  const surfaceResults = []

  if (hasPackageJson && hasPackageLock && nodeInstallAllowed) {
    commandResults.push(await runAllowedCommand('node_version', paths.sourceCopyRoot, 30000))
    commandResults.push(await runAllowedCommand('npm_cli_js_version', paths.sourceCopyRoot, 30000, { installRoot: paths.installRoot }))
    const npmCi = await runAllowedCommand('npm_cli_js_ci_ignore_scripts', paths.sourceCopyRoot, 600000, { installRoot: paths.installRoot })
    commandResults.push(npmCi)
    if (npmCi.exitCode !== 0) {
      nodeInstallStatus = 'failed'
      blockers.push('npm ci --ignore-scripts failed.')
    } else {
      nodeInstallStatus = 'installed_with_npm_ci_ignore_scripts'
      dependenciesInstalled = true
    }
  } else if (hasPackageJson && !hasPackageLock) {
    nodeInstallStatus = 'blocked_missing_lockfile'
    blockers.push('package.json exists without package-lock.json; npm install is forbidden.')
  }

  const pythonInstallStatus = hasPythonSurface ? 'blocked_requires_python_install_strategy' : 'not_applicable'
  if (hasPythonSurface) warnings.push('Python surfaces detected; pip/setup.py/venv are blocked in v1.')
  surfaceResults.push({ surface: 'node', status: nodeInstallStatus, details: [`package.json=${hasPackageJson}`, `package-lock.json=${hasPackageLock}`] })
  surfaceResults.push({ surface: 'python', status: pythonInstallStatus, details: [`pyproject/setup.py detected=${hasPythonSurface}`] })

  const manifest = {
    manifestKind: 'factory_hermes_install_manifest',
    manifestVersion: VERSION,
    toolId: 'hermes_agent',
    auditedHead,
    remoteHead: envelope.remoteHead,
    installVersionScope: 'audited_head_only',
    sourcePathOriginalRef: sourceOriginal,
    sourceCopyRoot: paths.sourceCopyRoot.replaceAll('\\', '/'),
    installRoot: paths.installRoot.replaceAll('\\', '/'),
    nodeInstallStatus,
    pythonInstallStatus,
    packageManagerUsed: hasPackageJson && hasPackageLock ? 'npm' : undefined,
    lockfilesObserved: hasPackageLock ? ['package-lock.json'] : [],
    scriptsExecuted: false,
    dependenciesInstalled,
    installedAt: input.executedAt,
    installedBy: input.executedBy,
    commandSummary: commandResults.map((result) => ({ commandKind: result.commandKind, exitCode: result.exitCode, shell: false })),
    hermesExecutionStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    nextRequiredGate: ['Hermes Install Verification Gate', ...(hasPythonSurface ? ['Hermes Python Install Strategy Gate'] : [])],
  }

  const status = blockers.length ? 'failed' : 'success'
  const result = {
    installRuntimeId: `hermes-install-runtime:${auditedHead.slice(0, 7)}:${input.executedAt}`,
    installRuntimeKind: KIND,
    installRuntimeVersion: VERSION,
    executedAt: input.executedAt,
    executedBy: input.executedBy,
    toolId: 'hermes_agent',
    auditedHead,
    remoteHead: envelope.remoteHead,
    installVersionScope: 'audited_head_only',
    installRoot: paths.installRoot.replaceAll('\\', '/'),
    sourceCopyRoot: paths.sourceCopyRoot.replaceAll('\\', '/'),
    manifest,
    manifestPath: paths.manifestPath.replaceAll('\\', '/'),
    resultPath: paths.resultPath.replaceAll('\\', '/'),
    commandResults,
    surfaceResults,
    status,
    decision: status === 'success' ? 'install_completed_for_audited_head' : 'failed',
    checks,
    blockers,
    warnings,
    nodeInstallStatus,
    pythonInstallStatus,
    scriptsStatus: 'not_executed',
    hermesExecutionStatus: 'not_allowed',
    credentialsStatus: 'not_allowed',
    projectMutationStatus: 'not_allowed',
    deployStatus: 'not_allowed',
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: nextStep,
  }
  await fs.writeFile(paths.manifestPath, JSON.stringify(manifest, null, 2))
  await fs.writeFile(paths.resultPath, JSON.stringify(result, null, 2))
  return result
}

module.exports = { executeFactoryHermesInstallRuntime, runAllowedCommand, sanitizeCommandOutput }
