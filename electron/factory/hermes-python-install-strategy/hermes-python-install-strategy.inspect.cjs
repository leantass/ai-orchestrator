const fs = require('node:fs/promises')
const path = require('node:path')

async function exists(target) { try { await fs.access(target); return true } catch { return false } }
async function listPythonScripts(root) {
  const scriptsRoot = path.join(root, 'scripts')
  try { return (await fs.readdir(scriptsRoot)).filter((name) => name.endsWith('.py')).map((name) => `scripts/${name}`) } catch { return [] }
}
async function inspectHermesPythonSurface(sourceRoot) {
  const pyprojectPresent = await exists(path.join(sourceRoot, 'pyproject.toml'))
  const setupPyPresent = await exists(path.join(sourceRoot, 'setup.py'))
  const setupCfgPresent = await exists(path.join(sourceRoot, 'setup.cfg'))
  const uvLockPresent = await exists(path.join(sourceRoot, 'uv.lock'))
  const poetryLockPresent = await exists(path.join(sourceRoot, 'poetry.lock'))
  const pipfilePresent = await exists(path.join(sourceRoot, 'Pipfile'))
  let requirementsPresent = false
  try { requirementsPresent = (await fs.readdir(sourceRoot)).some((name) => /^requirements.*\.txt$/u.test(name)) } catch {}
  const pythonPackagesDetected = []
  for (const name of ['hermes', 'hermes_cli', 'agent']) if (await exists(path.join(sourceRoot, name))) pythonPackagesDetected.push(name)
  const cliEntrypointsDetected = []
  for (const name of ['run_agent.py', 'cli.py']) if (await exists(path.join(sourceRoot, name))) cliEntrypointsDetected.push(name)
  const pythonScriptsDetected = await listPythonScripts(sourceRoot)
  const likelyPythonManager = uvLockPresent ? 'uv' : poetryLockPresent ? 'poetry' : pyprojectPresent || requirementsPresent || setupPyPresent ? 'pip' : 'unknown'
  const strategyRiskNotes = []
  if (setupPyPresent) strategyRiskNotes.push('setup.py present; direct execution forbidden.')
  if (uvLockPresent) strategyRiskNotes.push('uv.lock present; prefer uv lock strategy in future runtime.')
  return { sourceRoot: sourceRoot.replaceAll('\\', '/'), pyprojectPresent, setupPyPresent, setupCfgPresent, uvLockPresent, requirementsPresent, poetryLockPresent, pipfilePresent, pythonPackagesDetected, cliEntrypointsDetected, pythonScriptsDetected, likelyPythonManager, strategyRiskNotes }
}
module.exports = { inspectHermesPythonSurface }
