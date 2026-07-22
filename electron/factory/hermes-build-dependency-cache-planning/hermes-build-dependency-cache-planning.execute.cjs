const fs = require('node:fs/promises');
const { resolveFactoryHermesBuildDependencyCachePlanningPaths, assertPlanningPathContained } = require('./hermes-build-dependency-cache-planning.path.cjs');
const { inspectSource, inspectCache } = require('./hermes-build-dependency-cache-planning.inspect.cjs');

const KIND = 'factory-hermes-build-dependency-cache-planning';
const VERSION = '1.0';
const NEXT = 'Proceed to Factory Hermes Build Dependency Cache Approval Gate v1; do not cache dependencies, enable network, execute uv, retry materialization, or execute Hermes in this gate.';
const NOT_AUTH = ['cache_build_dependency_now', 'enable_network_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_uv_pip_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'execute_hermes_now', 'retry_materialization_now', 'retry_adapter_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now'];

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function candidates(missingBuildDependency, uvCacheRootRef) {
  return [
    { methodId: 'uv_controlled_build_dependency_cache_prefetch', status: 'candidate_only', description: 'Future controlled runtime uses verified uv to populate governed cache for missing build dependencies only.', reason: 'Keeps materialization runtime offline and separates cache population.', executableRef: '.codex-temp/external-tools/uv/bin/uv.exe', strategy: 'controlled_prefetch_for_build_dependency', packageConstraint: missingBuildDependency, cacheRoot: uvCacheRootRef, networkAllowedFuture: true, requiresHashCapture: true, requiresArtifactRecord: true, requiresCacheVerification: true },
    { methodId: 'uv_sync_project_install_temp_env_for_cache_prefetch', status: 'candidate_only', description: 'Future temp-env uv sync may populate cache without touching real python-env.', reason: 'Riskier because it can involve build backend behavior.', executableRef: '.codex-temp/external-tools/uv/bin/uv.exe', strategy: 'temp_env_cache_prefetch', packageConstraint: missingBuildDependency, cacheRoot: uvCacheRootRef, networkAllowedFuture: true, requiresHashCapture: true, requiresArtifactRecord: true, requiresCacheVerification: true },
    { methodId: 'enable_network_in_materialization_runtime', status: 'not_recommended_for_now', description: 'Enable network while materializing the entrypoint.', reason: 'Mixes cache prefetch with materialization.' },
    { methodId: 'pip_download_or_install_setuptools', status: 'forbidden', description: 'Use pip to download or install setuptools.', reason: 'pip is prohibited.' },
    { methodId: 'setup_py_install', status: 'forbidden', description: 'Invoke setup.py directly.', reason: 'Direct setup.py execution is prohibited.' },
    { methodId: 'manual_cache_copy', status: 'not_recommended_for_now', description: 'Manual cache copy from outside runtime.', reason: 'Hard to verify provenance and hash.' },
    { methodId: 'disable_uv_offline_and_retry', status: 'forbidden', description: 'Retry materialization with network enabled.', reason: 'Network belongs in cache runtime, not materialization runtime.' },
  ];
}

function base(input) {
  const r = input.materializationJefeReviewResult || {};
  const env = r.buildDependencyCachePlanningEnvelope || {};
  const missing = r.missingBuildDependency || env.missingBuildDependency || '';
  const uvCacheRootRef = env.uvCacheRootRef || '.codex-temp/external-tools/uv/cache/';
  return { planningId: `hermes-build-dependency-cache-planning:75b300f:${input.plannedAt}`, planningKind: KIND, planningVersion: VERSION, plannedAt: input.plannedAt, plannedBy: input.plannedBy, toolId: 'hermes_agent', selectedCandidateId: r.selectedCandidateId || env.selectedCandidateId || '', commandName: r.commandName || env.commandName || '', pythonEntrypoint: r.pythonEntrypoint || env.pythonEntrypoint || '', missingBuildDependency: missing, buildBackend: r.buildBackend || env.buildBackend || '', setupPyPresent: r.setupPyPresent === true || env.setupPyPresent === true, uvExecutableRef: env.uvExecutableRef || '.codex-temp/external-tools/uv/bin/uv.exe', uvCacheRootRef, sourceRootRef: env.sourceRootRef || '.codex-temp/external-tools/hermes-agent/install/75b300f/source', pythonEnvRootRef: env.pythonEnvRootRef || '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env', sourceInspectionSummary: input.sourceInspection || {}, cacheInspectionSummary: input.cacheInspection || {}, methodCandidates: candidates(missing, uvCacheRootRef), checks: [], blockers: [], warnings: [], status: 'blocked', decision: 'blocked_missing_materialization_jefe_review', canProceedToBuildDependencyCacheApproval: false, canCacheBuildDependenciesNow: false, canEnableNetworkNow: false, canRetryMaterializationNow: false, canExecuteHermes: false, canRunHermesScripts: false, canUseNetwork: false, canUseCredentials: false, canCallModels: false, canMutateProjectFiles: false, canDeploy: false, recommendedNextStep: NEXT };
}

function evaluateFactoryHermesBuildDependencyCachePlanning(input) {
  const r = input.materializationJefeReviewResult;
  const out = base(input);
  if (!r) return { ...out, blockers: [{ blockerId: 'blocked_missing_materialization_jefe_review', message: 'Materialization JEFE Review result is required.' }] };
  if (r.status !== 'approved_for_build_dependency_cache_planning' || r.decision !== 'hermes_entrypoint_materialization_jefe_review_approved_build_dependency_cache_planning' || r.canProceedToBuildDependencyCachePlanning !== true || r.canCacheBuildDependenciesNow !== false || r.canEnableNetworkNow !== false || r.canRetryMaterializationNow !== false) return { ...out, decision: 'blocked_jefe_review_not_approved_for_cache_planning', blockers: [{ blockerId: 'blocked_jefe_review_not_approved_for_cache_planning', message: 'JEFE Review is not approved for cache planning.' }] };
  if (r.canRetryResearchAdapterNow === true || r.canMaterializeEntrypointNow === true || r.canExecuteHermes === true || r.canRunHermesScripts === true || r.canUseNetwork === true || r.canUseCredentials === true || r.canCallModels === true || r.canMutateProjectFiles === true || r.canDeploy === true) return { ...out, decision: 'blocked_jefe_review_not_approved_for_cache_planning', blockers: [{ blockerId: 'blocked_jefe_review_boundary_violation', message: 'JEFE Review contains an unsafe authorization flag.' }] };
  if (!/setuptools/iu.test(out.missingBuildDependency)) return { ...out, decision: 'blocked_missing_build_dependency_identity', blockers: [{ blockerId: 'blocked_missing_build_dependency_identity', message: 'Missing build dependency identity is required.' }] };
  if (input.sourceInspection?.sourceRootExists !== true || input.sourceInspection?.pyprojectExists !== true || input.sourceInspection?.uvLockExists !== true) return { ...out, decision: 'blocked_source_missing', blockers: [{ blockerId: 'blocked_source_missing', message: 'Source inspection is incomplete.' }] };
  if (input.cacheInspection?.cacheRootExists !== true) return { ...out, decision: 'blocked_uv_cache_root_missing', blockers: [{ blockerId: 'blocked_uv_cache_root_missing', message: 'uv cache root missing.' }] };
  const decision = 'hermes_build_dependency_cache_plan_candidate_created';
  const receipt = { receiptId: `${out.planningId}:receipt`, planningId: out.planningId, toolId: 'hermes_agent', plannedBy: input.plannedBy, plannedAt: input.plannedAt, missingBuildDependency: out.missingBuildDependency, buildBackend: out.buildBackend, decision, scope: 'hermes_build_dependency_cache_planning_only', approvedNextGate: 'Factory Hermes Build Dependency Cache Approval Gate v1', limitations: ['Planning only.', 'No cache action, network, uv execution, retry or Hermes execution is authorized now.'], notAuthorizedActions: NOT_AUTH };
  const plan = { planCandidateId: `${out.planningId}:candidate`, toolId: 'hermes_agent', selectedCandidateId: out.selectedCandidateId, commandName: 'hermes', pythonEntrypoint: 'hermes_cli.main:main', missingBuildDependency: out.missingBuildDependency, buildBackend: 'setuptools.build_meta', setupPyPresent: out.setupPyPresent, uvExecutableRef: out.uvExecutableRef, uvCacheRootRef: out.uvCacheRootRef, sourceRootRef: out.sourceRootRef, pythonEnvRootRef: out.pythonEnvRootRef, selectedMethodCandidate: 'uv_controlled_build_dependency_cache_prefetch', methodCandidates: out.methodCandidates, cacheScope: 'build_dependency_cache_only', proposedCacheRoot: '.codex-temp/external-tools/uv/cache/', proposedMetadataRoot: '.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-metadata/', proposedNetworkPolicy: { networkAllowedNow: false, futureNetworkRequiresApproval: true, allowedDomainsFutureCandidate: [], packageIndexFutureCandidate: 'official_python_package_index_requires_approval' }, proposedArtifactPolicy: { requireHashCapture: true, requirePackageNameVersionRecord: true, requireDownloadUrlRecord: true, requireNoCredentials: true, requireNoEnvRead: true }, proposedRuntimeSafety: { noHermesExecution: true, noMaterializationRetryDuringCacheRuntime: true, noPythonDirectExecutionByJefe: true, noPipExecution: true, noSetupPyDirectExecution: true, noModelCalls: true, noProjectMutation: true }, proposedVerification: ['cacheContainsSetuptoolsCompatibleVersion', 'recordedHashMatchesCachedArtifact', 'noMaterializationPerformed', 'noHermesExecution'], requiredNextGates: ['Factory Hermes Build Dependency Cache Approval Gate v1', 'Factory Hermes Build Dependency Cache Runtime Adapter v1', 'Factory Hermes Build Dependency Cache Verification Gate v1', 'Factory Hermes Entrypoint Materialization Runtime Retry Gate v1'] };
  return { ...out, status: 'plan_candidate_created', decision, selectedMethodCandidate: 'uv_controlled_build_dependency_cache_prefetch', buildDependencyCachePlanningReceipt: receipt, hermesBuildDependencyCachePlanCandidate: plan, canProceedToBuildDependencyCacheApproval: true };
}

async function executeFactoryHermesBuildDependencyCachePlanning(input = {}) {
  const paths = resolveFactoryHermesBuildDependencyCachePlanningPaths();
  for (const target of [paths.materializationJefeReviewResult, paths.materializationIngestionResult, paths.materializationRuntimeResult, paths.materializationRuntimeManifest, paths.materializationApprovalResult, paths.planningResult]) assertPlanningPathContained(target, paths.installRoot);
  const runInput = { plannedAt: input.plannedAt || '2026-07-22T00:40:00.000Z', plannedBy: input.plannedBy || 'factory-hermes-build-dependency-cache-planning-smoke', materializationJefeReviewResult: input.materializationJefeReviewResult || await readJson(paths.materializationJefeReviewResult), sourceInspection: input.sourceInspection || await inspectSource(paths.sourceRoot), cacheInspection: input.cacheInspection || await inspectCache(paths.uvCacheRoot) };
  const result = evaluateFactoryHermesBuildDependencyCachePlanning(runInput);
  await fs.writeFile(paths.planningResult, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

module.exports = { evaluateFactoryHermesBuildDependencyCachePlanning, executeFactoryHermesBuildDependencyCachePlanning };
