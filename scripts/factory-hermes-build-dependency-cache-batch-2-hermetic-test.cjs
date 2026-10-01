const assert = require('node:assert/strict')
const cp = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const ts = require('typescript')

const root = process.cwd()
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jefe-cache-batch-2-'))
const domain = 'hermes-build-dependency-cache-verification'
const prefix = 'hermes-build-dependency-cache-verification'
const files = ['defaults', 'evaluate', 'serialize']

function compile(version, suffix) {
  const file = `src/factory/${domain}/${prefix}.${suffix}.ts`
  const source = version === 'after'
    ? fs.readFileSync(path.join(root, file), 'utf8')
    : cp.execFileSync('git', ['show', `bed669bda04cafd7f883127e6169a520cbaa82b0:${file}`], { encoding: 'utf8' })
  return ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('.ts', '.js')
}

function load(version) {
  const dir = path.join(tempRoot, version)
  fs.mkdirSync(dir, { recursive: true })
  for (const suffix of files) fs.writeFileSync(path.join(dir, `${prefix}.${suffix}.js`), compile(version, suffix))
  return {
    evaluate: require(path.join(dir, `${prefix}.evaluate.js`)).evaluateFactoryHermesBuildDependencyCacheVerification,
    serialize: require(path.join(dir, `${prefix}.serialize.js`)).serializeFactoryHermesBuildDependencyCacheVerificationResult,
  }
}

const fixtures = [
  { verifiedAt: '2026-07-23T06:00:00.000Z', verifiedBy: 'batch-2-hermetic-test' },
  {
    verifiedAt: '2026-07-23T06:01:00.000Z', verifiedBy: 'batch-2-hermetic-test',
    cacheRuntimeResult: { status: 'blocked', decision: 'blocked_missing_cache_approval' },
  },
  {
    verifiedAt: '2026-07-23T06:02:00.000Z', verifiedBy: 'batch-2-hermetic-test',
    cacheRuntimeResult: {
      status: 'success', decision: 'hermes_build_dependency_cache_prefetch_completed', cacheStatus: 'prefetched',
      canProceedToBuildDependencyCacheVerification: true, materializationStatus: 'not_attempted', adapterRetryStatus: 'not_attempted',
      hermesExecutionStatus: 'not_executed', pipStatus: 'not_executed', pythonDirectStatus: 'not_executed', setupPyDirectStatus: 'not_executed',
      credentialsStatus: 'not_allowed', modelCallStatus: 'not_allowed', beforeState: { sourceKeyHashes: {} }, afterState: { sourceKeyHashes: {} },
      missingBuildDependency: 'setuptools', lockedPackageName: 'setuptools', lockedPackageVersion: '81.0.0', selectedMethodCandidate: 'uv_sync_install_project_locked_existing_env',
      tempEnvStatus: 'ready', metadataStatus: 'recorded', sourceRootRef: 'source', pythonEnvRootRef: 'env', uvExecutableRef: 'uv', uvCacheRootRef: 'cache',
    },
    cacheMetadataRecord: { packageName: 'setuptools', lockedPackageVersion: '81.0.0', networkScope: 'cache_prefetch_only' },
  },
]

const before = load('before')
const after = load('after')
for (const input of fixtures) {
  assert.deepEqual(after.evaluate(input), before.evaluate(input))
  assert.equal(after.serialize(after.evaluate(input)), before.serialize(before.evaluate(input)))
}
console.log('factory-hermes-build-dependency-cache-batch-2-hermetic-test: PASS BEFORE/AFTER, optional and runtime fixtures')
