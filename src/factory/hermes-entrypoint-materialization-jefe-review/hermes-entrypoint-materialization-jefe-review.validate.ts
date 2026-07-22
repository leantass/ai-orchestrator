import { DEFAULT_FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_POLICY, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_KIND, FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_VERSION } from './hermes-entrypoint-materialization-jefe-review.defaults.ts'
import type { FactoryHermesEntrypointMaterializationJefeReviewInput, FactoryHermesEntrypointMaterializationJefeReviewResult, FactoryHermesEntrypointMaterializationJefeReviewValidationResult } from './hermes-entrypoint-materialization-jefe-review.types.ts'

const secretPattern = /password|secret|api[_-]?key|bearer|token|credential/iu
const blockedInAllowed = /uv sync|uv run|uv pip|pip|python|setup\.py|hermes\.exe|execute_hermes/iu

export function validateFactoryHermesEntrypointMaterializationJefeReviewInput(input: FactoryHermesEntrypointMaterializationJefeReviewInput): FactoryHermesEntrypointMaterializationJefeReviewValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const policy = { ...DEFAULT_FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_POLICY, ...input.policy }
  if (!input.reviewedAt) errors.push('reviewedAt is required')
  if (!input.reviewedBy) errors.push('reviewedBy is required')
  if (policy.requireHumanApprovalRef && !input.humanApprovalRef) errors.push('humanApprovalRef is required')
  if (policy.requireMaterializationIngestion && !input.materializationResultIngestionResult) errors.push('materializationResultIngestionResult is required')
  if (secretPattern.test(JSON.stringify(input.reviewNotes || ''))) errors.push('reviewNotes appear to contain secret material')
  return { ok: errors.length === 0, errors, warnings }
}

export function validateFactoryHermesEntrypointMaterializationJefeReviewResult(result: FactoryHermesEntrypointMaterializationJefeReviewResult): FactoryHermesEntrypointMaterializationJefeReviewValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (result.jefeReviewKind !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_KIND) errors.push('invalid kind')
  if (result.jefeReviewVersion !== FACTORY_HERMES_ENTRYPOINT_MATERIALIZATION_JEFE_REVIEW_VERSION) errors.push('invalid version')
  if (result.toolId !== 'hermes_agent') errors.push('toolId must be hermes_agent')
  if (result.status === 'approved_for_build_dependency_cache_planning') {
    if (!result.jefeReviewReceipt) errors.push('approved result requires jefeReviewReceipt')
    if (!result.hermesEntrypointMaterializationJefeReviewRecord) errors.push('approved result requires review record')
    if (!result.buildDependencyCachePlanningEnvelope) errors.push('approved result requires buildDependencyCachePlanningEnvelope')
    if (result.canProceedToBuildDependencyCachePlanning !== true) errors.push('approved result must allow proceeding to planning')
  }
  for (const [key, value] of Object.entries({
    canCacheBuildDependenciesNow: result.canCacheBuildDependenciesNow,
    canEnableNetworkNow: result.canEnableNetworkNow,
    canRetryMaterializationNow: result.canRetryMaterializationNow,
    canRetryResearchAdapterNow: result.canRetryResearchAdapterNow,
    canMaterializeEntrypointNow: result.canMaterializeEntrypointNow,
    canExecuteHermes: result.canExecuteHermes,
    canRunHermesScripts: result.canRunHermesScripts,
    canUseNetwork: result.canUseNetwork,
    canUseCredentials: result.canUseCredentials,
    canCallModels: result.canCallModels,
    canMutateProjectFiles: result.canMutateProjectFiles,
    canDeploy: result.canDeploy,
  })) if (value !== false) errors.push(`${key} must be false`)
  const actions = result.jefeReviewReceipt?.notAuthorizedActions || []
  for (const action of ['cache_build_dependency_now', 'enable_network_now', 'retry_materialization_now', 'execute_uv_sync_now', 'execute_hermes_now']) if (!actions.includes(action)) errors.push(`missing notAuthorizedAction ${action}`)
  if (blockedInAllowed.test(JSON.stringify(result.buildDependencyCachePlanningEnvelope?.requiredPlanningQuestions || []))) warnings.push('planning questions mention commands as text only; no execution is authorized')
  if (!result.recommendedNextStep) errors.push('recommendedNextStep is required')
  return { ok: errors.length === 0, errors, warnings }
}
