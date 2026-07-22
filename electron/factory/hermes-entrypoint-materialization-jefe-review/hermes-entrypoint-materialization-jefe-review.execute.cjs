const fs = require('node:fs/promises');
const { resolveFactoryHermesEntrypointMaterializationJefeReviewPaths, assertJefeReviewPathContained } = require('./hermes-entrypoint-materialization-jefe-review.path.cjs');

const KIND = 'factory-hermes-entrypoint-materialization-jefe-review';
const VERSION = '1.0';
const NEXT = 'Proceed to Factory Hermes Build Dependency Cache Planning Gate v1; do not cache dependencies, enable network, retry materialization, or execute Hermes in this gate.';
const NOT_AUTH = ['cache_build_dependency_now', 'enable_network_now', 'retry_materialization_now', 'retry_research_adapter_now', 'execute_uv_now', 'execute_uv_sync_now', 'execute_python_now', 'execute_pip_now', 'execute_setup_py_now', 'execute_hermes_now', 'use_network_now', 'call_models_now', 'access_credentials_now', 'mutate_project_files_now', 'deploy_now'];

async function readOptionalJson(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    if (!raw.trim()) return undefined;
    return JSON.parse(raw);
  } catch (error) {
    if (error && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function evidence(ingestion) {
  const record = ingestion?.hermesEntrypointMaterializationResultIngestionRecord || {};
  const e = record.evidence || {};
  return {
    selectedCandidateId: ingestion?.selectedCandidateId || record.selectedCandidateId || '',
    commandName: ingestion?.commandName || record.commandName || '',
    pythonEntrypoint: ingestion?.pythonEntrypoint || record.pythonEntrypoint || '',
    runtimeDecision: ingestion?.runtimeDecision || record.runtimeDecision || '',
    classification: ingestion?.classification || record.classification || '',
    normalizedOutcome: ingestion?.normalizedOutcome || record.normalizedOutcome || '',
    missingBuildDependency: e.missingBuildDependency || '',
    buildBackend: e.buildBackend || '',
    setupPyPresent: e.setupPyPresent === true,
  };
}

function base(input) {
  const data = evidence(input.materializationResultIngestionResult);
  return {
    jefeReviewId: `hermes-entrypoint-materialization-jefe-review:75b300f:${input.reviewedAt}`,
    jefeReviewKind: KIND,
    jefeReviewVersion: VERSION,
    reviewedAt: input.reviewedAt,
    reviewedBy: input.reviewedBy,
    toolId: 'hermes_agent',
    selectedCandidateId: data.selectedCandidateId,
    commandName: data.commandName,
    pythonEntrypoint: data.pythonEntrypoint,
    runtimeDecision: data.runtimeDecision,
    classification: data.classification,
    normalizedOutcome: data.normalizedOutcome,
    missingBuildDependency: data.missingBuildDependency,
    buildBackend: data.buildBackend,
    setupPyPresent: data.setupPyPresent,
    checks: [],
    blockers: [],
    warnings: [],
    status: 'blocked',
    decision: 'blocked_missing_materialization_ingestion',
    canProceedToBuildDependencyCachePlanning: false,
    canCacheBuildDependenciesNow: false,
    canEnableNetworkNow: false,
    canRetryMaterializationNow: false,
    canRetryResearchAdapterNow: false,
    canMaterializeEntrypointNow: false,
    canExecuteHermes: false,
    canRunHermesScripts: false,
    canUseNetwork: false,
    canUseCredentials: false,
    canCallModels: false,
    canMutateProjectFiles: false,
    canDeploy: false,
    recommendedNextStep: NEXT,
  };
}

function evaluateFactoryHermesEntrypointMaterializationJefeReview(input) {
  const ingestion = input.materializationResultIngestionResult;
  const out = base(input);
  if (!ingestion) return { ...out, blockers: [{ blockerId: 'blocked_missing_materialization_ingestion', message: 'Materialization result ingestion is required.' }] };
  if (ingestion.status !== 'ingested' || ingestion.canProceedToMaterializationJefeReview !== true || ingestion.canProceedToBuildDependencyCachePlanning !== true) return { ...out, decision: 'blocked_materialization_ingestion_not_reviewable', blockers: [{ blockerId: 'blocked_materialization_ingestion_not_reviewable', message: 'Materialization ingestion is not reviewable for cache planning.' }] };
  const unsafe = ingestion.canProceedToMaterializationVerification === true || ingestion.canRetryResearchAdapterNow === true || ingestion.canTreatAsResearchResult === true || ingestion.canExecuteHermes === true || ingestion.canRunHermesScripts === true || ingestion.canUseNetwork === true || ingestion.canUseCredentials === true || ingestion.canCallModels === true || ingestion.canDeploy === true;
  if (unsafe) return { ...out, decision: 'blocked_materialization_boundary_violation', blockers: [{ blockerId: 'blocked_materialization_boundary_violation', message: 'Ingestion result violates boundary.' }] };
  if (out.runtimeDecision !== 'blocked_network_required' || out.classification !== 'controlled_build_dependency_cache_miss' || out.normalizedOutcome !== 'build_dependency_missing_from_offline_cache' || !out.missingBuildDependency) return { ...out, status: 'changes_required', decision: 'blocked_not_build_dependency_cache_miss', blockers: [{ blockerId: 'blocked_not_build_dependency_cache_miss', message: 'Expected controlled build dependency cache miss.' }] };
  if (!input.humanApprovalRef) return { ...out, status: 'human_review_required', decision: 'blocked_missing_human_approval', blockers: [{ blockerId: 'blocked_missing_human_approval', message: 'humanApprovalRef is required.' }] };
  const decision = 'hermes_entrypoint_materialization_jefe_review_approved_build_dependency_cache_planning';
  const receipt = { receiptId: `${out.jefeReviewId}:receipt`, jefeReviewId: out.jefeReviewId, toolId: 'hermes_agent', reviewedBy: input.reviewedBy, reviewedAt: input.reviewedAt, humanApprovalRef: input.humanApprovalRef, decision, scope: 'hermes_entrypoint_materialization_build_dependency_cache_planning_only', approvedNextGate: 'Factory Hermes Build Dependency Cache Planning Gate v1', limitations: ['Planning only.', 'No cache action, network, retry or Hermes execution is authorized now.'], notAuthorizedActions: NOT_AUTH };
  const record = { recordId: `${out.jefeReviewId}:record`, jefeReviewId: out.jefeReviewId, toolId: 'hermes_agent', selectedCandidateId: out.selectedCandidateId, commandName: out.commandName, pythonEntrypoint: out.pythonEntrypoint, runtimeDecision: out.runtimeDecision, classification: out.classification, normalizedOutcome: out.normalizedOutcome, missingBuildDependency: out.missingBuildDependency, buildBackend: out.buildBackend, setupPyPresent: out.setupPyPresent, jefeAssessment: 'The materialization failure is a controlled offline build dependency cache miss.', rootCause: 'The project build backend needs setuptools>=77,<83, which is not present in the governed offline uv cache.', safetyConclusion: 'Proceed only to build dependency cache planning.', canProceedToBuildDependencyCachePlanning: true, canCacheBuildDependenciesNow: false, canEnableNetworkNow: false, canRetryMaterializationNow: false };
  const envelope = { envelopeId: `${out.jefeReviewId}:envelope`, jefeReviewId: out.jefeReviewId, toolId: 'hermes_agent', selectedCandidateId: out.selectedCandidateId, commandName: out.commandName, pythonEntrypoint: out.pythonEntrypoint, missingBuildDependency: out.missingBuildDependency, buildBackend: out.buildBackend, setupPyPresent: out.setupPyPresent, uvExecutableRef: '.codex-temp/external-tools/uv/bin/uv.exe', uvCacheRootRef: '.codex-temp/external-tools/uv/cache/', sourceRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/source', pythonEnvRootRef: '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env', currentFailure: out.runtimeDecision, allowedNextGate: 'Factory Hermes Build Dependency Cache Planning Gate v1', cacheAllowedNow: false, networkAllowedNow: false, materializationRetryAllowedNow: false, hermesExecutionAllowedNow: false, requiredPlanningQuestions: ['Which cache artifact should satisfy setuptools>=77,<83 without enabling runtime network?', 'How will checksum/source provenance be validated before cache population?', 'Which future approval permits the cache action?'], requiredFutureGates: ['Factory Hermes Build Dependency Cache Planning Gate v1', 'Factory Hermes Build Dependency Cache Approval Gate v1', 'Factory Hermes Build Dependency Cache Runtime Adapter v1', 'Factory Hermes Entrypoint Materialization Runtime Adapter Retry Gate v1'], recommendedNextStep: NEXT };
  return { ...out, status: 'approved_for_build_dependency_cache_planning', decision, jefeReviewReceipt: receipt, hermesEntrypointMaterializationJefeReviewRecord: record, buildDependencyCachePlanningEnvelope: envelope, canProceedToBuildDependencyCachePlanning: true };
}

async function executeFactoryHermesEntrypointMaterializationJefeReview(input = {}) {
  const paths = resolveFactoryHermesEntrypointMaterializationJefeReviewPaths();
  for (const target of [paths.ingestionResult, paths.runtimeResult, paths.runtimeManifest, paths.approvalResult, paths.jefeReviewResult]) assertJefeReviewPathContained(target, paths.installRoot);
  const runInput = {
    reviewedAt: input.reviewedAt || '2026-07-22T00:20:00.000Z',
    reviewedBy: input.reviewedBy || 'factory-hermes-entrypoint-materialization-jefe-review-smoke',
    humanApprovalRef: input.humanApprovalRef || 'human-review/hermes-entrypoint-materialization-jefe-review-v1',
    materializationResultIngestionResult: input.materializationResultIngestionResult || await readOptionalJson(paths.ingestionResult),
    materializationRuntimeResult: input.materializationRuntimeResult || await readOptionalJson(paths.runtimeResult),
    materializationApprovalResult: input.materializationApprovalResult || await readOptionalJson(paths.approvalResult),
  };
  const result = evaluateFactoryHermesEntrypointMaterializationJefeReview(runInput);
  await fs.writeFile(paths.jefeReviewResult, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  return result;
}

module.exports = { evaluateFactoryHermesEntrypointMaterializationJefeReview, executeFactoryHermesEntrypointMaterializationJefeReview };
