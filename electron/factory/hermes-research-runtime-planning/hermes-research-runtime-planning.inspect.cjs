const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');

async function readTextIfExists(filePath, max = 12000) { if (!fsSync.existsSync(filePath)) return ''; return (await fs.readFile(filePath, 'utf8')).slice(0, max); }
function candidate(id, label, source, confidence, commandTextCandidate, reason) { return { candidateId: id, label, source, confidence, commandTextCandidate, reason }; }
async function inspectHermesResearchRuntimeSource(paths, pythonVerification, uvVerification) {
  if (!fsSync.existsSync(paths.sourceRoot)) return { interfaceStatus: 'blocked_source_missing', interfaceCandidates: [], pythonInstallVerified: false, uvVerified: false, summary: { sourceRootPresent: false } };
  const pyproject = await readTextIfExists(path.join(paths.sourceRoot, 'pyproject.toml'));
  const readme = (await readTextIfExists(path.join(paths.sourceRoot, 'README.md'))) || (await readTextIfExists(path.join(paths.sourceRoot, 'README.rst')));
  const setupPyPresent = fsSync.existsSync(path.join(paths.sourceRoot, 'setup.py'));
  const packageJsonPresent = fsSync.existsSync(path.join(paths.sourceRoot, 'package.json'));
  const dirs = {};
  for (const dir of ['src', 'hermes', 'scripts', 'docs']) dirs[dir] = fsSync.existsSync(path.join(paths.sourceRoot, dir));
  const candidates = [];
  const scriptMatches = [...pyproject.matchAll(/([\w.-]+)\s*=\s*["']([^"']+)["']/g)].filter((m) => /hermes|agent|research|cli|run/iu.test(`${m[1]} ${m[2]}`));
  for (const [index, match] of scriptMatches.entries()) candidates.push(candidate(`pyproject-console-script-${index + 1}`, match[1], 'pyproject.toml', 'medium', `${match[1]} -> ${match[2]}`, 'Console script-like declaration found in pyproject text.'));
  if (/run_agent\.py/iu.test(readme)) candidates.push(candidate('readme-run-agent', 'run_agent.py usage', 'README', 'low', 'python run_agent.py', 'README mentions run_agent.py; textual only.'));
  if (/cli\.py/iu.test(readme)) candidates.push(candidate('readme-cli', 'cli.py usage', 'README', 'low', 'python cli.py', 'README mentions cli.py; textual only.'));
  if (dirs.scripts) candidates.push(candidate('scripts-directory', 'scripts directory', 'filesystem', 'low', undefined, 'scripts directory exists and requires manual review.'));
  const unique = candidates.slice(0, 8);
  const interfaceStatus = unique.length === 1 ? 'interface_candidate_identified' : unique.length > 1 ? 'interface_requires_manual_selection' : 'interface_not_identified';
  return { interfaceStatus, interfaceCandidates: unique, pythonInstallVerified: pythonVerification?.status === 'verified' && pythonVerification?.decision === 'hermes_python_install_verified', uvVerified: uvVerification?.status === 'verified' && uvVerification?.canUseUvForHermesPythonRuntime === true, summary: { sourceRootPresent: true, pyprojectPresent: Boolean(pyproject), readmePresent: Boolean(readme), setupPyPresent, packageJsonPresent, dirs, candidateCount: unique.length, readmeUsageSummary: readme ? 'README present; usage mentions scanned without retaining raw content.' : 'README not present.' } };
}
module.exports = { inspectHermesResearchRuntimeSource };
