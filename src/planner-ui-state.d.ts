type PlannerUiRecord = Record<string, unknown>

type PlannerUiContinuationAction = {
  id?: string
  title?: string
  description?: string
  category?: string
  targetStrategy?: string
  safeToPrepare?: boolean
  safeToMaterialize?: boolean
  requiresApproval?: boolean
  blocked?: boolean
  blocker?: string
  approvalType?: string
  expectedOutcome?: string
  recommended?: boolean
  priority?: number
  phaseId?: string
  moduleId?: string
  riskLevel?: string
  projectRoot?: string
  deliveryLevel?: string
  reason?: string
  targetFiles?: string[]
  allowedTargetPaths?: string[]
  explicitExclusions?: string[]
  successCriteria?: string[]
}

type PlannerUiContractInspection = {
  ok?: boolean
  contractOk?: boolean
  reason?: string
  decisionKey?: string
  strategy?: string
  executionMode?: string
  nextExpectedAction?: string
  hasExecutionScope?: boolean
  hasMaterializationPlan?: boolean
  allowedTargetPathsCount?: number
  missingRequiredPaths?: string[]
  forbiddenSignalsFound?: string[]
}

type PlannerUiMaterializationState = {
  uiState: string
  effectiveReviewOnly: boolean
  fullstackMaterializationResponseReady: boolean
  fullstackMaterializationContractReady: boolean
  materializeCtaVisible: boolean
  materializeCtaEnabled: boolean
  materializeCtaDisabledReason: string
  shouldShowScalableDeliveryPlan: boolean
  isScalableReview: boolean
  looksLikeFullstackLocalReview: boolean
  looksLikeFrontendProjectReview: boolean
  canPrepareFullstackLocal: boolean
  canPrepareFrontendProject: boolean
  prepareCtaKind: string
  prepareCtaVisible: boolean
  contractInspection: PlannerUiContractInspection
}

type PlannerUiApprovalSurfaceViewModel = {
  present: boolean
  status: string
  approvalState: string
  root: string
  summary: string
  filesCount: number
  blockedCount: number
  warningsCount: number
  errorsCount: number
  requiresLeanApproval: boolean
  nextActionLabel: string
  blockers: string[]
  safetyLabels: string[]
  validations: string[]
}

export const buildPlannerApprovalSurfaceViewModel: (args: {
  generatedDomainMaterializationApprovalSurface?: PlannerUiRecord | null
  plannerExecutionMetadata?: PlannerUiRecord | null
  effectivePlannerExecutionMetadata?: PlannerUiRecord | null
}) => PlannerUiApprovalSurfaceViewModel

export const canGenerateContinuationReviewFallbackForUi: (args: {
  plannerExecutionMetadata?: PlannerUiRecord | null
  effectivePlannerExecutionMetadata?: PlannerUiRecord | null
}) => boolean

export const canPrepareProjectContinuityNextActionForUi: (
  action?: PlannerUiContinuationAction | null,
) => boolean

export const derivePlannerNextExpectedActionForUi: (
  value?: PlannerUiRecord | null,
) => string

export const derivePlannerMaterializationUiState: (args: {
  plannerExecutionMetadata?: PlannerUiRecord | null
  effectivePlannerExecutionMetadata?: PlannerUiRecord | null
}) => PlannerUiMaterializationState

export const getProjectContinuityPrimaryActionLabelForUi: (
  action?: PlannerUiContinuationAction | null,
) => string

export const inspectPreparedFullstackLocalMaterialization: (args: {
  metadata?: PlannerUiRecord | null
  sourcePlan?: PlannerUiRecord | null
}) => PlannerUiContractInspection

export const isPreparedFullstackLocalMaterializationResponse: (
  value?: PlannerUiRecord | null,
) => boolean

export const resolveProjectContinuityNextRecommendedActionForUi: (args: {
  projectContinuationState?: PlannerUiRecord | null
  projectReadinessState?: PlannerUiRecord | null
  continuationActionPlan?: PlannerUiContinuationAction | null
  moduleExpansionPlan?: PlannerUiRecord | null
  projectPhaseExecutionPlan?: PlannerUiRecord | null
  localProjectManifest?: PlannerUiRecord | null
}) => PlannerUiContinuationAction | null