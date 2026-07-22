import { FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_KIND, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_NEXT_STEP, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_NOT_AUTHORIZED_ACTIONS, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_VERSION } from './hermes-entrypoint-materialization-jefe-review.defaults.ts'
import type { FactoryHermesEntrypointMaterializationJefeReviewInput, FactoryHermesEntrypointMaterializationJefeReviewResult } from './hermes-entrypoint-materialization-jefe-review.types.ts'

const sourceRootRef = '.codex-temp/external-tools/hermes-agent/install/75b300f/source'
const pythonEnvRootRef = '.codex-temp/external-tools/hermes-agent/install/75b300f/python-env'
const uvExecutableRef = '.codex-temp/external-tools/uv/bin/uv.exe'
const uvCacheRootRef = '.codex-temp/external-tools/uv/cache/'

function evidence(ingestion: any) {
  const record = ingestion?.hermesEntrypointMaterializationResultIngestionRecord || {}
  const e = record.evidence || {}
  return {
    record,
    selectedCandidateId: ingestion?.selectedCandidateId || record.selectedCandidateId || '',
    commandName: ingestion?.commandName || record.commandName || '',
    pythonEntrypoint: ingestion?.pythonEntrypoint || record.pythonEntrypoint || '',
    runtimeDecision: ingestion?.runtimeDecision || record.runtimeDecision || '',
    classification: ingestion?.classification || record.classification || '',
    normalizedOutcome: ingestion?.normalizedOutcome || record.normalizedOutcome || '',
    missingBuildDependency: e.missingBuildDependency || '',
    buildBackend: e.buildBackend || '',
    setupPyPresent: e.setupPyPresent === true,
  }
}

function base(input: FactoryHermesEntrypointMaterializationJefeReviewInput): FactoryHermesEntrypointMaterializationJefeReviewResult {
  const data = evidence(input.materializationResultIngestionResult)
  return {
    jefeReviewId: `hermes-entrypoint-materialization-jefe-review:75b300f:${input.reviewedAt}`,
    jefeReviewKind: FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_KIND,
    jefeReviewVersion: FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_VERSION,
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
    recommendedNextStep: FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_NEXT_STEP,
  }
}

export function evaluateFactoryHermesEntrypointMaterializationJefeReview(input: FactoryHermesEntrypointMaterializationJefeReviewInput): FactoryHermesEntrypointMaterializationJefeReviewResult {
  const ingestion = input.materializationResultIngestionResult
  const out = base(input)
  if (!ingestion) return { ...out, blockers: [{ blockerId: 'blocked_missing_materialization_ingestion', message: 'Materialization result ingestion is required.' }] }
  if (ingestion.status !== 'ingested' || ingestion.canProceedToMaterializationJefeReview !== true || ingestion.canProceedToBuildDependencyCachePlanning !== true) {
    return { ...out, decision: 'blocked_materialization_ingestion_not_reviewable', blockers: [{ blockerId: 'blocked_materialization_ingestion_not_reviewable', message: 'Materialization ingestion is not reviewable for cache planning.' }] }
  }
  const unsafe = ingestion.canProceedToMaterializationVerification === true || ingestion.canRetryResearchAdapterNow === true || ingestion.canTreatAsResearchResult === true || ingestion.canExecuteHermes === true || ingestion.canRunHermesScripts === true || ingestion.canUseNetwork === true || ingestion.canUseCredentials === true || ingestion.canCallModels === true || ingestion.canDeploy === true
  if (unsafe) return { ...out, decision: 'blocked_materialization_boundary_violation', blockers: [{ blockerId: 'blocked_materialization_boundary_violation', message: 'Ingestion result violates the no-execution/no-network boundary.' }] }
  if (out.runtimeDecision !== 'blocked_network_required' || out.classification !== 'controlled_build_dependency_cache_miss' || out.normalizedOutcome !== 'build_dependency_missing_from_offline_cache' || !out.missingBuildDependency) {
    return { ...out, decision: 'blocked_not_build_dependency_cache_miss', status: 'changes_required', blockers: [{ blockerId: 'blocked_not_build_dependency_cache_miss', message: 'Review expects a controlled offline build dependency cache miss.' }] }
  }
  if (!input.humanApprovalRef) return { ...out, status: 'human_review_required', decision: 'blocked_missing_human_approval', blockers: [{ blockerId: 'blocked_missing_human_approval', message: 'humanApprovalRef is required before JEFE review approval.' }] }
  const decision = 'hermes_entrypoint_materialization_jefe_review_approved_build_dependency_cache_planning' as const
  const receipt = { receiptId: `${out.jefeReviewId}:receipt`, jefeReviewId: out.jefeReviewId, toolId: 'hermes_agent' as const, reviewedBy: input.reviewedBy, reviewedAt: input.reviewedAt, humanApprovalRef: input.humanApprovalRef, decision, scope: 'hermes_entrypoint_materialization_build_dependency_cache_planning_only' as const, approvedNextGate: 'Factory Hermes Build Dependency Cache Planning Gate v1' as const, limitations: ['Approval is limited to planning a build dependency cache strategy.', 'No dependency cache action, network enablement, uv sync retry, materialization retry or Hermes execution is authorized now.'], notAuthorizedActions: FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_NOT_AUTHORIZED_ACTIONS }
  const reviewRecord = { recordId: `${out.jefeReviewId}:record`, jefeReviewId: out.jefeReviewId, toolId: 'hermes_agent' as const, selectedCandidateId: out.selectedCandidateId, commandName: out.commandName, pythonEntrypoint: out.pythonEntrypoint, runtimeDecision: out.runtimeDecision, classification: out.classification, normalizedOutcome: out.normalizedOutcome, missingBuildDependency: out.missingBuildDependency, buildBackend: out.buildBackend, setupPyPresent: out.setupPyPresent, jefeAssessment: 'The materialization failure is a controlled offline build dependency cache miss.', rootCause: 'The project build backend needs setuptools>=77,<83, which is not present in the governed offline uv cache.', safetyConclusion: 'Proceed only to build dependency cache planning; do not enable network, cache dependencies, retry materialization or execute Hermes here.', canProceedToBuildDependencyCachePlanning: true, canCacheBuildDependenciesNow: false as const, canEnableNetworkNow: false as const, canRetryMaterializationNow: false as const }
  const envelope = { envelopeId: `${out.jefeReviewId}:envelope`, jefeReviewId: out.jefeReviewId, toolId: 'hermes_agent' as const, selectedCandidateId: out.selectedCandidateId, commandName: out.commandName, pythonEntrypoint: out.pythonEntrypoint, missingBuildDependency: out.missingBuildDependency, buildBackend: out.buildBackend, setupPyPresent: out.setupPyPresent, uvExecutableRef, uvCacheRootRef, sourceRootRef, pythonEnvRootRef, currentFailure: out.runtimeDecision, allowedNextGate: 'Factory Hermes Build Dependency Cache Planning Gate v1' as const, cacheAllowedNow: false as const, networkAllowedNow: false as const, materializationRetryAllowedNow: false as const, hermesExecutionAllowedNow: false as const, requiredPlanningQuestions: ['Which cache artifact should satisfy setuptools>=77,<83 without enabling runtime network?', 'How will checksum/source provenance be validated before cache population?', 'Which future approval permits the cache action?', 'How will materialization retry remain shell:false and no-Hermes?'], requiredFutureGates: ['Factory Hermes Build Dependency Cache Planning Gate v1', 'Factory Hermes Build Dependency Cache Approval Gate v1', 'Factory Hermes Build Dependency Cache Runtime Adapter v1', 'Factory Hermes Entrypoint Materialization Runtime Adapter Retry Gate v1'], recommendedNextStep: FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_NEXT_STEP }
  return { ...out, status: 'approved_for_build_dependency_cache_planning', decision, jefeReviewReceipt: receipt, hermesEntrypointMaterializationJefeReviewRecord: reviewRecord, buildDependencyCachePlanningEnvelope: envelope, canProceedToBuildDependencyCachePlanning: true }
}
