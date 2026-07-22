const fs = require('node:fs/promises');
const path = require('node:path');

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(file) {
  if (!(await exists(file))) return '';
  return fs.readFile(file, 'utf8');
}

function matchLines(text, pattern, limit = 20) {
  return text.split(/\r?\n/u).filter((line) => pattern.test(line)).slice(0, limit);
}

async function inspectSource(sourceRoot) {
  const pyprojectPath = path.join(sourceRoot, 'pyproject.toml');
  const uvLockPath = path.join(sourceRoot, 'uv.lock');
  const setupPyPath = path.join(sourceRoot, 'setup.py');
  const setupCfgPath = path.join(sourceRoot, 'setup.cfg');
  const pyproject = await readTextIfExists(pyprojectPath);
  const uvLock = await readTextIfExists(uvLockPath);
  return {
    sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source',
    sourceRootExists: await exists(sourceRoot),
    pyprojectExists: await exists(pyprojectPath),
    uvLockExists: await exists(uvLockPath),
    setupPyExists: await exists(setupPyPath),
    setupCfgExists: await exists(setupCfgPath),
    buildBackend: /build-backend\s*=\s*"setuptools\.build_meta"/u.test(pyproject) ? 'setuptools.build_meta' : '',
    buildSystemRequiresSetuptools: /setuptools\s*>=\s*77(?:\.0)?\s*,\s*<\s*83/iu.test(pyproject),
    buildSystemRequiresSummary: matchLines(pyproject, /build-system|requires|build-backend|setuptools/iu, 8),
    uvLockMentionsSetuptools: /name\s*=\s*"setuptools"|setuptools/iu.test(uvLock),
    uvLockSetuptoolsSummary: matchLines(uvLock, /setuptools/iu, 8),
    packageEntrypointSummary: matchLines(pyproject, /project\.scripts|console_scripts|hermes\s*=/iu, 8),
  };
}

async function inspectCache(cacheRoot) {
  const cacheRootExists = await exists(cacheRoot);
  const matches = [];
  let topLevelEntryCount = 0;
  if (cacheRootExists) {
    const top = await fs.readdir(cacheRoot, { withFileTypes: true });
    topLevelEntryCount = top.length;
    const stack = [cacheRoot];
    while (stack.length && matches.length < 20) {
      const current = stack.pop();
      const entries = await fs.readdir(current, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (/setuptools/iu.test(entry.name)) matches.push(path.relative(cacheRoot, full).replace(/\\/gu, '/'));
        if (entry.isDirectory() && matches.length < 20) stack.push(full);
      }
    }
  }
  return {
    uvCacheRootRef: '.codex-temp/external-tools/uv/cache/',
    cacheRootExists,
    topLevelEntryCount,
    setuptoolsNameMatchesLimited: matches,
    appearsToContainSetuptoolsByName: matches.length > 0,
    inspectionLimit: 20,
  };
}

module.exports = { inspectSource, inspectCache };
