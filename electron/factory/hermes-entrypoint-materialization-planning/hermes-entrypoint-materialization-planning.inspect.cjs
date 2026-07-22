const fs = require('node:fs');
function matchOne(text, regex) { const m = text.match(regex); return m ? m[1] : '' }
function inspectHermesEntrypointMaterializationSource(paths) {
  const pyprojectPresent = fs.existsSync(paths.pyproject);
  const pyproject = pyprojectPresent ? fs.readFileSync(paths.pyproject, 'utf8') : '';
  return {
    sourceRootExists: fs.existsSync(paths.sourceRoot),
    pyprojectPresent,
    uvLockPresent: fs.existsSync(paths.uvLock),
    setupPyPresent: fs.existsSync(paths.setupPy),
    setupCfgPresent: fs.existsSync(paths.setupCfg),
    projectName: matchOne(pyproject, /name\s*=\s*"([^"]+)"/u),
    projectVersion: matchOne(pyproject, /version\s*=\s*"([^"]+)"/u),
    projectScripts: { hermes: matchOne(pyproject, /hermes\s*=\s*"([^"]+)"/u) },
    buildSystem: { buildBackend: matchOne(pyproject, /build-backend\s*=\s*"([^"]+)"/u), requires: matchOne(pyproject, /requires\s*=\s*(\[[^\n]+\])/u) },
    packageLayoutHints: ['hermes_cli', 'agent', 'providers', 'scripts'].filter((name) => fs.existsSync(require('node:path').join(paths.sourceRoot, name))),
    hermesExeExists: fs.existsSync(paths.missingExecutable),
    pythonExeExists: fs.existsSync(paths.pythonExe),
    pyvenvCfgExists: fs.existsSync(paths.pyvenvCfg),
    sitePackagesExists: fs.existsSync(paths.sitePackages),
    pythonEnvExists: fs.existsSync(paths.pythonEnvRoot),
  };
}
module.exports = { inspectHermesEntrypointMaterializationSource };
