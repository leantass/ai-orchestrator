const fs = require('node:fs');
const path = require('node:path');
const { inspectFactoryHermesBuildDependencyCacheVerificationState } = require('./hermes-build-dependency-cache-verification.inspect.cjs');

const KIND = 'factory-hermes-build-dependency-cache-verification';
const VERSION = '1.0';
const NEXT_STEP = 'Proceed to Factory Hermes Entrypoint Materialization Runtime Retry Gate v1; retry is not authorized in this verification gate.';
const NOT_AUTHORIZED = [
  'retry_materialization_now',
  'execute_uv_now',
  'execute_uv_sync_now',
  'execute_python_now',
  'execute_pip_now',
  'execute_setup_py_now',
  'execute_hermes_now',
  'use_network_now',
  'call_models_now',
  'access_credentials_now',
  'mutate_project_files_now',
  'deploy_now'
];

function base(input, runtimeResult) {
  const r = runtimeResult || {};
  return {
    verificationId: `hermes-build-dependency-cache-verification:75b300f:${input.verifiedAt}`,
    verificationKind: KIND,
    verificationVersion: VERSION,
    verifiedAt: input.verifiedAt,
    verifiedBy: input.verifiedBy,
    toolId: 'hermes_agent',
    missingBuildDependency: r.missingBuildDependency || '',
    lockedPackageName: r.lockedPackageName || '',
    lockedPackageVersion: r.lockedPackageVersion || '',
    selectedMethodCandidate: r.selectedMethodCandidate || '',
    cacheStatus: r.cacheStatus || '',
    tempEnvStatus: r.tempEnvStatus || '',
    metadataStatus: r.metadataStatus || '',
    sourceMutationStatus: 'unknown',
    checks: [],
    blockers: [],
    warnings: [],
    status: 'blocked',
    decision: 'blocked_missing_cache_runtime_result',
    canProceedToEntrypointMaterializationRuntimeRetry: false,
    canRetryMaterializationNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseNetworkNow: false,
    canUseNetworkInMaterializationRetry: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: NEXT_STEP
  };
}

function evaluate(input) {
  const r = input.cacheRuntimeResult;
  const meta = input.cacheMetadataRecord;
  const out = base(input, r);
  if (!r) return { ...out, blockers: [{ blockerId: 'blocked_missing_cache_runtime_result', message: 'Cache runtime result is required.' }] };
  if (r.status !== 'success' || r.decision !== 'hermes_build_dependency_cache_prefetch_completed' || r.cacheStatus !== 'prefetched' || r.canProceedToBuildDependencyCacheVerification !== true) {
    return { ...out, decision: 'blocked_cache_runtime_not_success', blockers: [{ blockerId: 'blocked_cache_runtime_not_success', message: 'Cache runtime did not complete successfully.' }] };
  }
  if (!meta || meta.packageName !== 'setuptools' || meta.lockedPackageVersion !== '81.0.0' || meta.networkScope !== 'cache_prefetch_only') {
    return { ...out, decision: 'blocked_cache_metadata_missing', blockers: [{ blockerId: 'blocked_cache_metadata_missing', message: 'Cache metadata is missing or incomplete.' }] };
  }
  const unsafe = r.materializationStatus !== 'not_attempted' || r.adapterRetryStatus !== 'not_attempted' || r.hermesExecutionStatus !== 'not_executed' || r.pipStatus !== 'not_executed' || r.pythonDirectStatus !== 'not_executed' || r.setupPyDirectStatus !== 'not_executed' || r.credentialsStatus !== 'not_allowed' || r.modelCallStatus !== 'not_allowed';
  if (unsafe) return { ...out, decision: 'blocked_boundary_violation_detected', blockers: [{ blockerId: 'blocked_boundary_violation_detected', message: 'Runtime result violates safety boundary.' }] };
  const hashesUnchanged = JSON.stringify(r.beforeState?.sourceKeyHashes || {}) === JSON.stringify(r.afterState?.sourceKeyHashes || {});
  const validPostMaterializationRetry = r.postMaterializationRetryState?.validRetrySuccess === true;
  if (r.afterState?.realPythonEnvHermesExeExists === true && !validPostMaterializationRetry) {
    return { ...out, decision: 'blocked_unexpected_materialization_during_cache_runtime', blockers: [{ blockerId: 'blocked_unexpected_materialization_during_cache_runtime', message: 'Real python env hermes.exe appeared without a valid runtime retry success.' }] };
  }
  const sourceEntries = r.afterState?.sourceSuspiciousEntries || [];
  if (!hashesUnchanged || sourceEntries.some((x) => ['dist', 'build', '.venv'].includes(x))) {
    return { ...out, decision: 'blocked_unexpected_source_mutation', sourceMutationStatus: 'unexpected_source_mutation', blockers: [{ blockerId: 'blocked_unexpected_source_mutation', message: 'Source mutation exceeded allowed metadata warning.' }] };
  }
  const warningEntries = sourceEntries.filter((x) => x === 'hermes_agent.egg-info' || x === '.codex-temp');
  const warnings = warningEntries.map((x) => ({ warningId: x === 'hermes_agent.egg-info' ? 'source_metadata_egg_info_created_by_cache_runtime' : 'source_nested_codex_temp_left_from_repaired_runtime_attempt', message: x }));
  if (validPostMaterializationRetry) warnings.push({ warningId: 'post_materialization_state_detected', message: 'hermes.exe is present due to a valid Entrypoint Materialization Runtime Retry success.' });
  const decision = 'hermes_build_dependency_cache_verified_for_materialization_retry';
  const sourceMutationStatus = warningEntries.length ? 'metadata_warning_only' : 'unchanged';
  const receipt = {
    receiptId: `${out.verificationId}:receipt`,
    verificationId: out.verificationId,
    toolId: 'hermes_agent',
    verifiedBy: input.verifiedBy,
    verifiedAt: input.verifiedAt,
    missingBuildDependency: r.missingBuildDependency,
    lockedPackageName: r.lockedPackageName,
    lockedPackageVersion: r.lockedPackageVersion,
    cacheStatus: r.cacheStatus,
    tempEnvStatus: r.tempEnvStatus,
    metadataStatus: r.metadataStatus,
    sourceMutationStatus,
    decision,
    scope: 'hermes_build_dependency_cache_verification_only',
    approvedNextGate: 'Factory Hermes Entrypoint Materialization Runtime Retry Gate v1',
    limitations: ['Verification only.', 'No materialization retry, uv execution, network use or Hermes execution is authorized now.'],
    notAuthorizedActions: NOT_AUTHORIZED
  };
  const record = {
    recordId: `${out.verificationId}:record`,
    verificationId: out.verificationId,
    toolId: 'hermes_agent',
    missingBuildDependency: r.missingBuildDependency,
    lockedPackageName: 'setuptools',
    lockedPackageVersion: '81.0.0',
    selectedMethodCandidate: r.selectedMethodCandidate,
    cacheRuntimeResultRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-runtime-result.json',
    cacheRuntimeManifestRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-runtime-manifest.json',
    metadataRecordRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-metadata/build-dependency-cache-record.json',
    cacheVerification: { cacheStatus: r.cacheStatus, metadataStatus: r.metadataStatus, tempEnvStatus: r.tempEnvStatus, uvCacheRootRef: r.uvCacheRootRef, metadataRootRef: r.metadataRootRef, recordedHashes: meta.recordedHashes || [], recordedSourceUrls: meta.recordedSourceUrls || [], recordedHosts: meta.recordedHosts || [] },
    safetyVerification: { noHermesExecution: true, noSelectedInterfaceExecution: true, noMaterializationRetry: true, noResearchAdapterRetry: true, noPip: true, noPythonDirect: true, noSetupPyDirect: true, noUvRun: true, noUvPip: true, noUvVenv: true, noCredentials: true, noModelCalls: true },
    sourceVerification: { keyFileHashesUnchanged: true, eggInfoWarning: warningEntries.includes('hermes_agent.egg-info'), unexpectedSourceMutation: false },
    materializationRetryReadiness: { buildDependencyCacheVerified: true, futureMaterializationRuntimeMustUseUvOffline: true, futureMaterializationRuntimeMayRetryUnderSeparateGate: true },
    canProceedToEntrypointMaterializationRuntimeRetry: true,
    canRetryMaterializationNow: false
  };
  const envelope = {
    envelopeId: `${out.verificationId}:envelope`,
    verificationId: out.verificationId,
    toolId: 'hermes_agent',
    commandName: 'hermes',
    pythonEntrypoint: 'hermes_cli.main:main',
    expectedExecutableRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env/Scripts/hermes.exe',
    sourceRootRef: r.sourceRootRef,
    pythonEnvRootRef: r.pythonEnvRootRef,
    uvExecutableRef: r.uvExecutableRef,
    uvCacheRootRef: r.uvCacheRootRef,
    verifiedBuildDependency: { packageName: 'setuptools', lockedPackageVersion: '81.0.0', versionConstraint: 'setuptools>=77,<83', cacheStatus: 'prefetched' },
    retryMethodCandidate: 'uv_sync_install_project_locked_existing_env',
    approvedNextGate: 'Factory Hermes Entrypoint Materialization Runtime Retry Gate v1',
    retryAllowedNow: false,
    futureRetryMayExecuteUvSyncOffline: true,
    futureRetryMustUseUvOffline: true,
    futureRetryMustNotUseNetwork: true,
    futureRetryMustNotExecuteHermes: true,
    futureRetryMustNotUsePip: true,
    futureRetryMustNotExecutePythonDirect: true,
    futureRetryMustNotExecuteSetupPyDirect: true,
    requiredFutureGates: ['Factory Hermes Entrypoint Materialization Runtime Retry Gate v1', 'Factory Hermes Entrypoint Materialization Verification Gate v1', 'Factory Hermes Research Runtime Adapter Retry Gate v1']
  };
  return { ...out, status: warnings.length ? 'warning_verified' : 'verified', decision, sourceMutationStatus, cacheVerificationReceipt: receipt, hermesBuildDependencyCacheVerificationRecord: record, approvedEntrypointMaterializationRuntimeRetryEnvelope: envelope, warnings, canProceedToEntrypointMaterializationRuntimeRetry: true };
}

function executeFactoryHermesBuildDependencyCacheVerification(input = {}) {
  const inspected = inspectFactoryHermesBuildDependencyCacheVerificationState(input.root);
  const runtimeResult = {
    ...inspected.runtimeResult,
    afterState: {
      ...(inspected.runtimeResult.afterState || {}),
      realPythonEnvHermesExeExists: inspected.inspectedState.realPythonEnvHermesExeExists,
      sourceKeyHashes: inspected.inspectedState.sourceKeyHashes,
      sourceSuspiciousEntries: inspected.inspectedState.sourceSuspiciousEntries
    },
    postMaterializationRetryState: {
      validRetrySuccess: inspected.materializationRuntimeRetryResult?.status === 'success'
        && inspected.materializationRuntimeRetryResult?.decision === 'hermes_entrypoint_materialized_after_cache_verified_retry'
        && inspected.materializationRuntimeRetryResult?.executableStatusAfter === 'present'
        && inspected.materializationRuntimeRetryResult?.hermesExecutionStatus === 'not_executed',
      retryResultRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/entrypoint-materialization-runtime-retry-result.json'
    }
  };
  const result = evaluate({
    verifiedAt: input.verifiedAt,
    verifiedBy: input.verifiedBy,
    cacheRuntimeResult: runtimeResult,
    cacheRuntimeManifest: inspected.runtimeManifest,
    cacheMetadataRecord: inspected.metadataRecord
  });
  fs.mkdirSync(path.dirname(inspected.paths.verificationResult), { recursive: true });
  fs.writeFileSync(inspected.paths.verificationResult, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

module.exports = {
  evaluateFactoryHermesBuildDependencyCacheVerificationRuntime: evaluate,
  executeFactoryHermesBuildDependencyCacheVerification
};
