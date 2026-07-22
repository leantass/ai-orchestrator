import { FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_KIND, FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_NEXT_STEP, FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_NOT_AUTHORIZED_ACTIONS, FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_VERSION } from './hermes-build-dependency-cache-planning.defaults.ts'
import type { FactoryHermesBuildDependencyCacheMethodCandidate, FactoryHermesBuildDependencyCachePlanningInput, FactoryHermesBuildDependencyCachePlanningResult } from './hermes-build-dependency-cache-planning.types.ts'

function methodCandidates(missingBuildDependency: string, uvCacheRootRef: string): FactoryHermesBuildDependencyCacheMethodCandidate[] {
  return [
    { methodId: 'uv_controlled_build_dependency_cache_prefetch', status: 'candidate_only', description: 'Future controlled runtime uses verified uv to populate governed cache for missing build dependencies only.', reason: 'Keeps materialization runtime offline and separates network/cache population into dedicated approval/runtime/verification gates.', executableRef: '.codex-temp/external-tools/uv/bin/uv.exe', strategy: 'controlled_prefetch_for_build_dependency', packageConstraint: missingBuildDependency, cacheRoot: uvCacheRootRef, networkAllowedFuture: true, requiresHashCapture: true, requiresArtifactRecord: true, requiresCacheVerification: true },
    { methodId: 'uv_sync_project_install_temp_env_for_cache_prefetch', status: 'candidate_only', description: 'Future temp-env uv sync may populate cache without touching the real python-env.', reason: 'More risky because it can involve project build backend behavior; requires explicit approval.', executableRef: '.codex-temp/external-tools/uv/bin/uv.exe', strategy: 'temp_env_cache_prefetch', packageConstraint: missingBuildDependency, cacheRoot: uvCacheRootRef, networkAllowedFuture: true, requiresHashCapture: true, requiresArtifactRecord: true, requiresCacheVerification: true },
    { methodId: 'enable_network_in_materialization_runtime', status: 'not_recommended_for_now', description: 'Enable network while materializing the entrypoint.', reason: 'Mixes cache prefetch with materialization and weakens separation.' },
    { methodId: 'pip_download_or_install_setuptools', status: 'forbidden', description: 'Use pip to download or install setuptools.', reason: 'pip is prohibited by JEFE/Hermes Python boundaries.' },
    { methodId: 'setup_py_install', status: 'forbidden', description: 'Invoke setup.py directly.', reason: 'Direct setup.py execution is prohibited.' },
    { methodId: 'manual_cache_copy', status: 'not_recommended_for_now', description: 'Manual cache copy from outside runtime.', reason: 'Provenance, hash and source records are harder to verify.' },
    { methodId: 'disable_uv_offline_and_retry', status: 'forbidden', description: 'Retry materialization with network enabled.', reason: 'Network belongs in a future cache runtime, not materialization runtime.' },
  ]
}

function base(input: FactoryHermesBuildDependencyCachePlanningInput): FactoryHermesBuildDependencyCachePlanningResult {
  const r = input.materializationJefeReviewResult || {}
  const env = r.buildDependencyCachePlanningEnvelope || {}
  const missing = r.missingBuildDependency || env.missingBuildDependency || ''
  const buildBackend = r.buildBackend || env.buildBackend || ''
  const uvCacheRootRef = env.uvCacheRootRef || '.codex-temp/external-tools/uv/cache/'
  return {
    planningId: `hermes-build-dependency-cache-planning:75b300f:${input.plannedAt}`,
    planningKind: FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_KIND,
    planningVersion: FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_VERSION,
    plannedAt: input.plannedAt,
    plannedBy: input.plannedBy,
    toolId: 'hermes_agent',
    selectedCandidateId: r.selectedCandidateId || env.selectedCandidateId || '',
    commandName: r.commandName || env.commandName || '',
    pythonEntrypoint: r.pythonEntrypoint || env.pythonEntrypoint || '',
    missingBuildDependency: missing,
    buildBackend,
    setupPyPresent: r.setupPyPresent === true || env.setupPyPresent === true,
    uvExecutableRef: env.uvExecutableRef || '.codex-temp/external-tools/uv/bin/uv.exe',
    uvCacheRootRef,
    sourceRootRef: env.sourceRootRef || '.codex-temp/external-tools/hermes-agent/install/75b300f/source',
    pythonEnvRootRef: env.pythonEnvRootRef || '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env',
    sourceInspectionSummary: input.sourceInspection || {},
    cacheInspectionSummary: input.cacheInspection || {},
    methodCandidates: methodCandidates(missing, uvCacheRootRef),
    checks: [],
    blockers: [],
    warnings: [],
    status: 'blocked',
    decision: 'blocked_missing_materialization_jefe_review',
    canProceedToBuildDependencyCacheApproval: false,
    canCacheBuildDependenciesNow: false,
    canEnableNetworkNow: false,
    canRetryMaterializationNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseNetwork: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_NEXT_STEP,
  }
}

export function evaluateFactoryHermesBuildDependencyCachePlanning(input: FactoryHermesBuildDependencyCachePlanningInput): FactoryHermesBuildDependencyCachePlanningResult {
  const r = input.materializationJefeReviewResult
  const out = base(input)
  if (!r) return { ...out, blockers: [{ blockerId: 'blocked_missing_materialization_jefe_review', message: 'Materialization JEFE Review result is required.' }] }
  if (r.status !== 'approved_for_build_dependency_cache_planning' || r.decision !== 'hermes_entrypoint_materialization_jefe_review_approved_build_dependency_cache_planning' || r.canProceedToBuildDependencyCachePlanning !== true || r.canCacheBuildDependenciesNow !== false || r.canEnableNetworkNow !== false || r.canRetryMaterializationNow !== false) {
    return { ...out, decision: 'blocked_jefe_review_not_approved_for_cache_planning', blockers: [{ blockerId: 'blocked_jefe_review_not_approved_for_cache_planning', message: 'JEFE Review is not approved for build dependency cache planning.' }] }
  }
  const unsafeReview = r.canRetryResearchAdapterNow === true || r.canMaterializeEntrypointNow === true || r.canExecuteHermes === true || r.canRunHermesScripts === true || r.canUseNetwork === true || r.canUseCredentials === true || r.canCallModels === true || r.canMutateProjectFiles === true || r.canDeploy === true
  if (unsafeReview) return { ...out, decision: 'blocked_jefe_review_not_approved_for_cache_planning', blockers: [{ blockerId: 'blocked_jefe_review_boundary_violation', message: 'JEFE Review contains an unsafe authorization flag.' }] }
  if (!out.missingBuildDependency || !/setuptools/iu.test(out.missingBuildDependency)) return { ...out, decision: 'blocked_missing_build_dependency_identity', blockers: [{ blockerId: 'blocked_missing_build_dependency_identity', message: 'Missing build dependency identity is required.' }] }
  if (out.buildBackend !== 'setuptools.build_meta') return { ...out, decision: 'blocked_missing_build_dependency_identity', blockers: [{ blockerId: 'blocked_missing_build_backend', message: 'Expected build backend setuptools.build_meta.' }] }
  if (input.sourceInspection?.sourceRootExists !== true || input.sourceInspection?.pyprojectExists !== true || input.sourceInspection?.uvLockExists !== true) return { ...out, decision: 'blocked_source_missing', blockers: [{ blockerId: 'blocked_source_missing', message: 'Source inspection requires sourceRoot, pyproject.toml and uv.lock.' }] }
  if (input.cacheInspection?.cacheRootExists !== true) return { ...out, decision: 'blocked_uv_cache_root_missing', blockers: [{ blockerId: 'blocked_uv_cache_root_missing', message: 'uv cache root is required for planning.' }] }
  const decision = 'hermes_build_dependency_cache_plan_candidate_created' as const
  const receipt = { receiptId: `${out.planningId}:receipt`, planningId: out.planningId, toolId: 'hermes_agent' as const, plannedBy: input.plannedBy, plannedAt: input.plannedAt, missingBuildDependency: out.missingBuildDependency, buildBackend: out.buildBackend, decision, scope: 'hermes_build_dependency_cache_planning_only' as const, approvedNextGate: 'Factory Hermes Build Dependency Cache Approval Gate v1' as const, limitations: ['Planning only.', 'No dependency cache action, network enablement, uv execution, materialization retry or Hermes execution is authorized now.'], notAuthorizedActions: FACTORY_HERMES_BUILD_DEPENDENCY_CACHE_PLANNING_NOT_AUTHORIZED_ACTIONS }
  const planCandidate = { planCandidateId: `${out.planningId}:candidate`, toolId: 'hermes_agent' as const, selectedCandidateId: out.selectedCandidateId, commandName: 'hermes' as const, pythonEntrypoint: 'hermes_cli.main:main' as const, missingBuildDependency: out.missingBuildDependency, buildBackend: 'setuptools.build_meta' as const, setupPyPresent: out.setupPyPresent, uvExecutableRef: out.uvExecutableRef, uvCacheRootRef: out.uvCacheRootRef, sourceRootRef: out.sourceRootRef, pythonEnvRootRef: out.pythonEnvRootRef, selectedMethodCandidate: 'uv_controlled_build_dependency_cache_prefetch' as const, methodCandidates: out.methodCandidates, cacheScope: 'build_dependency_cache_only' as const, proposedCacheRoot: '.codex-temp/external-tools/uv/cache/', proposedMetadataRoot: '.codex-temp/external-tools/hermes-agent/install/75b300f/build-dependency-cache-metadata/', proposedNetworkPolicy: { networkAllowedNow: false, futureNetworkRequiresApproval: true, allowedDomainsFutureCandidate: [], packageIndexFutureCandidate: 'official_python_package_index_requires_approval' }, proposedArtifactPolicy: { requireHashCapture: true, requirePackageNameVersionRecord: true, requireDownloadUrlRecord: true, requireNoCredentials: true, requireNoEnvRead: true }, proposedRuntimeSafety: { noHermesExecution: true, noMaterializationRetryDuringCacheRuntime: true, noPythonDirectExecutionByJefe: true, noPipExecution: true, noSetupPyDirectExecution: true, noModelCalls: true, noProjectMutation: true }, proposedVerification: ['cacheContainsSetuptoolsCompatibleVersion', 'recordedHashMatchesCachedArtifact', 'noMaterializationPerformed', 'noHermesExecution'], requiredNextGates: ['Factory Hermes Build Dependency Cache Approval Gate v1', 'Factory Hermes Build Dependency Cache Runtime Adapter v1', 'Factory Hermes Build Dependency Cache Verification Gate v1', 'Factory Hermes Entrypoint Materialization Runtime Retry Gate v1'] }
  return { ...out, status: 'plan_candidate_created', decision, selectedMethodCandidate: 'uv_controlled_build_dependency_cache_prefetch', buildDependencyCachePlanningReceipt: receipt, hermesBuildDependencyCachePlanCandidate: planCandidate, canProceedToBuildDependencyCacheApproval: true }
}
