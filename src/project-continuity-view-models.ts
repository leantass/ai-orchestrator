import type { MetricTone } from './components/AppUiPrimitives'
import {
  getPrepareActionButtonLabel,
  getRuntimeApprovalStatusLabel,
  getRuntimeApprovalTone,
} from './project-state-labels'

type ContinuationSummaryRecommendedActionLike = {
  safeToPrepare?: boolean
  safeToMaterialize?: boolean
  requiresApproval?: boolean
  blocked?: boolean
}

type ContinuationVisibleModuleLike = {
  name?: string
  id?: string
}

type ContinuationApprovalActionLike = {
  safeToPrepare?: boolean
  requiresApproval?: boolean
  blocked?: boolean
}

type RuntimeApprovalStateLike = {
  title?: string
  notExecutedDisclaimer?: string
  description?: string
  safeAlternative?: string
  status?: string
  relatedReadinessArea?: string
  expectedOutcome?: string
  approvalPhrase?: string
}

type ApprovalRequestPlanLike = {
  title?: string
  operatorMessage?: string
  description?: string
  areaSummary?: string
  safeAlternative?: string
  blockedByDefault?: boolean
  approvalType?: string
  approvalCopy?: string
  requiresApproval?: boolean
  forbiddenInCurrentTask?: boolean
  explicitApprovalText?: string
}

export type ProjectContinuationSummaryCardViewModel = {
  operatorMessage: string
  nextStepReason: string
  statusLabel: string
  statusToneClass: string
  nextStepTitle: string
  projectStatusLabel: string
  projectStatusValue: string
  currentPhaseLabel: string
  projectStatusTone: MetricTone
  completedPhasesValue: string
  completedPhasesDetail: string
  pendingPhasesValue: string
  pendingPhasesDetail: string
  pendingPhasesTone: MetricTone
  modulesValue: string
  modulesDetail: string
  prepareLabel?: string
  materializeLabel?: string
}

export type ProjectContinuationApprovalPanelsViewModel = {
  hasActiveApprovalFlow: boolean
  showRuntimeApprovalPanel: boolean
  showApprovalRequestPanel: boolean
  readinessApprovalTitle: string
  readinessApprovalItems: string[]
  runtimeApprovalStatusLabel: string
  runtimeApprovalStatusTone: MetricTone
  runtimeApprovalTitle: string
  runtimeApprovalDisclaimer: string
  runtimeApprovalDescription: string
  runtimeApprovalGateDetail: string
  runtimeApprovalCommandsValue: string
  runtimeApprovalCommandsDetail: string
  runtimeApprovalValidationsValue: string
  runtimeApprovalValidationsDetail: string
  runtimeApprovalSafeAlternativeValue: string
  runtimeApprovalSafeAlternativeDetail: string
  runtimeApprovalProposedCommands: string[]
  runtimeApprovalTouchedFiles: string[]
  runtimeApprovalDirectoriesAndEnv: string[]
  runtimeApprovalValidationItems: string[]
  runtimeApprovalSafeAlternativeItems: string[]
  runtimeApprovalRiskItems: string[]
  runtimeApprovalFooterMessage: string
  approvalRequestTitle: string
  approvalRequestOperatorMessage: string
  approvalRequestAreaSummary: string
  approvalRequestStatusLabel: string
  approvalRequestStatusTone: MetricTone
  approvalRequestRiskDetail: string
  approvalRequestAreasValue: string
  approvalRequestAreasDetail: string
  approvalRequestSafeAlternativeValue: string
  approvalRequestSafeAlternativeDetail: string
  approvalRequestStateValue: string
  approvalRequestStateDetail: string
  approvalRequestTouchedAreas: string[]
  approvalRequestUntouchedAreas: string[]
  approvalRequestValidationItems: string[]
  approvalRequestWarningItems: string[]
  approvalRequestFooterMessage: string
}

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const listOrFallback = (items: string[], fallback: string[]) =>
  items.length > 0 ? items : fallback

export function buildProjectContinuationSummaryCardViewModel({
  operatorMessage,
  nextStepReason,
  statusLabel,
  statusToneClass,
  nextStepTitle,
  projectStatusLabel,
  currentPhaseLabel,
  projectStatusTone,
  completedPhases,
  pendingPhases,
  nextRecommendedPhaseId,
  manifestModules,
  modulesDone,
  visibleModules,
  nextRecommendedAction,
}: {
  operatorMessage: string
  nextStepReason: string
  statusLabel: string
  statusToneClass: string
  nextStepTitle: string
  projectStatusLabel: string
  currentPhaseLabel: string
  projectStatusTone: MetricTone
  completedPhases: string[]
  pendingPhases: string[]
  nextRecommendedPhaseId: string
  manifestModules: ContinuationVisibleModuleLike[]
  modulesDone: string[]
  visibleModules: ContinuationVisibleModuleLike[]
  nextRecommendedAction?: ContinuationSummaryRecommendedActionLike | null
}): ProjectContinuationSummaryCardViewModel {
  return {
    operatorMessage,
    nextStepReason,
    statusLabel,
    statusToneClass,
    nextStepTitle,
    projectStatusLabel,
    projectStatusValue: projectStatusLabel,
    currentPhaseLabel,
    projectStatusTone,
    completedPhasesValue:
      completedPhases.length > 0 ? `${completedPhases.length} fase(s)` : 'Nada declarado',
    completedPhasesDetail:
      completedPhases[0] || 'Todavía no hay fases completas declaradas',
    pendingPhasesValue:
      pendingPhases.length > 0 ? `${pendingPhases.length} fase(s)` : 'Base segura completa',
    pendingPhasesDetail:
      pendingPhases[0] ||
      nextRecommendedPhaseId ||
      'Conviene revisar la siguiente expansión',
    pendingPhasesTone: pendingPhases.length > 0 ? 'amber' : 'emerald',
    modulesValue:
      manifestModules.length > 0 ? `${manifestModules.length} módulo(s)` : 'Sin módulos',
    modulesDetail:
      modulesDone[0] ||
      visibleModules[0]?.name ||
      visibleModules[0]?.id ||
      'Todavía no hay módulos declarados',
    prepareLabel:
      nextRecommendedAction?.safeToPrepare !== false
        ? getPrepareActionButtonLabel({
            requiresApproval: nextRecommendedAction?.requiresApproval,
            blocked: nextRecommendedAction?.blocked,
          })
        : undefined,
    materializeLabel:
      nextRecommendedAction?.safeToMaterialize === true &&
      !nextRecommendedAction.requiresApproval &&
      !nextRecommendedAction.blocked
        ? 'Materializar seguro'
        : undefined,
  }
}

export function buildProjectContinuationApprovalPanelsViewModel({
  runtimeApprovalState,
  runtimeApprovalAction,
  approvalRequestPlan,
  approvalPacketAction,
  nextRecommendedNeedsApproval,
  readinessApprovalAreas,
  runtimeApprovalCommands,
  runtimeApprovalFiles,
  runtimeApprovalDirectories,
  runtimeApprovalEnv,
  runtimeApprovalSecrets,
  runtimeApprovalValidations,
  runtimeApprovalAlternativeItems,
  runtimeApprovalRiskItems,
  approvalPacketTouches,
  approvalPacketWillNotTouch,
  approvalPacketValidations,
  approvalPacketWarnings,
}: {
  runtimeApprovalState?: RuntimeApprovalStateLike | null
  runtimeApprovalAction?: ContinuationApprovalActionLike | null
  approvalRequestPlan?: ApprovalRequestPlanLike | null
  approvalPacketAction?: ContinuationApprovalActionLike | null
  nextRecommendedNeedsApproval: boolean
  readinessApprovalAreas: string[]
  runtimeApprovalCommands: string[]
  runtimeApprovalFiles: string[]
  runtimeApprovalDirectories: string[]
  runtimeApprovalEnv: string[]
  runtimeApprovalSecrets: string[]
  runtimeApprovalValidations: string[]
  runtimeApprovalAlternativeItems: string[]
  runtimeApprovalRiskItems: string[]
  approvalPacketTouches: string[]
  approvalPacketWillNotTouch: string[]
  approvalPacketValidations: string[]
  approvalPacketWarnings: string[]
}): ProjectContinuationApprovalPanelsViewModel {
  const hasRuntimeApprovalAction = Boolean(
    runtimeApprovalAction &&
      (runtimeApprovalAction.requiresApproval || runtimeApprovalAction.blocked),
  )
  const hasApprovalPacketAction = Boolean(
    approvalPacketAction &&
      (approvalPacketAction.requiresApproval || approvalPacketAction.blocked),
  )
  const hasActiveApprovalFlow = Boolean(
    (runtimeApprovalState && hasRuntimeApprovalAction) || nextRecommendedNeedsApproval,
  )
  const showRuntimeApprovalPanel = Boolean(runtimeApprovalState && hasRuntimeApprovalAction)
  const showApprovalRequestPanel = Boolean(
    !showRuntimeApprovalPanel &&
      approvalRequestPlan &&
      hasApprovalPacketAction &&
      nextRecommendedNeedsApproval,
  )
  const runtimeApprovalDirectoriesAndEnv = [
    ...runtimeApprovalDirectories,
    ...runtimeApprovalEnv,
    ...runtimeApprovalSecrets,
  ]

  return {
    hasActiveApprovalFlow,
    showRuntimeApprovalPanel,
    showApprovalRequestPanel,
    readinessApprovalTitle: hasActiveApprovalFlow
      ? 'Requiere aprobación'
      : 'Aprobaciones futuras',
    readinessApprovalItems:
      readinessApprovalAreas.length > 0
        ? readinessApprovalAreas
        : [
            hasActiveApprovalFlow
              ? 'No se toca nada real sin aprobación.'
              : 'La fase segura actual no necesita aprobación. Lo sensible queda para más adelante.',
          ],
    runtimeApprovalStatusLabel: getRuntimeApprovalStatusLabel(runtimeApprovalState?.status),
    runtimeApprovalStatusTone: getRuntimeApprovalTone(runtimeApprovalState?.status),
    runtimeApprovalTitle:
      normalizeOptionalString(runtimeApprovalState?.title) || 'Pasar a ejecución real',
    runtimeApprovalDisclaimer:
      normalizeOptionalString(runtimeApprovalState?.notExecutedDisclaimer) ||
      'No se ejecutó nada todavía.',
    runtimeApprovalDescription:
      normalizeOptionalString(runtimeApprovalState?.description) ||
      normalizeOptionalString(runtimeApprovalState?.safeAlternative) ||
      'JEFE preparó un preview controlado sin salir del modo local seguro.',
    runtimeApprovalGateDetail:
      normalizeOptionalString(runtimeApprovalState?.relatedReadinessArea) ||
      'La ejecución real sigue bloqueada hasta aprobación explícita.',
    runtimeApprovalCommandsValue:
      runtimeApprovalCommands.length > 0
        ? `${runtimeApprovalCommands.length} comando(s)`
        : 'Sin comandos',
    runtimeApprovalCommandsDetail:
      runtimeApprovalCommands[0] || 'No hay comandos propuestos para esta aprobación.',
    runtimeApprovalValidationsValue:
      runtimeApprovalValidations.length > 0
        ? `${runtimeApprovalValidations.length} check(s)`
        : 'Sin checks',
    runtimeApprovalValidationsDetail:
      runtimeApprovalValidations[0] ||
      'Primero hay que revisar riesgo, alcance y alternativa segura.',
    runtimeApprovalSafeAlternativeValue:
      normalizeOptionalString(runtimeApprovalState?.safeAlternative) ||
      'Seguir en modo local seguro',
    runtimeApprovalSafeAlternativeDetail:
      normalizeOptionalString(runtimeApprovalState?.expectedOutcome) ||
      'Todavía no se ejecuta nada real.',
    runtimeApprovalProposedCommands: listOrFallback(runtimeApprovalCommands, [
      'Todavía no hay comandos propuestos para esta aprobación.',
    ]),
    runtimeApprovalTouchedFiles: listOrFallback(runtimeApprovalFiles, [
      ...(approvalPacketTouches.length > 0
        ? approvalPacketTouches
        : ['El alcance sigue siendo solo informativo por ahora.']),
    ]),
    runtimeApprovalDirectoriesAndEnv: listOrFallback(runtimeApprovalDirectoriesAndEnv, [
      'No se toca nada real sin aprobación.',
    ]),
    runtimeApprovalValidationItems: listOrFallback(runtimeApprovalValidations, [
      ...(approvalPacketValidations.length > 0
        ? approvalPacketValidations
        : ['Revisar alcance, riesgo y alternativa segura antes de aprobar.']),
    ]),
    runtimeApprovalSafeAlternativeItems: listOrFallback(runtimeApprovalAlternativeItems, [
      ...(approvalPacketWillNotTouch.length > 0
        ? approvalPacketWillNotTouch
        : ['No se ejecutó nada todavía.']),
    ]),
    runtimeApprovalRiskItems: listOrFallback(runtimeApprovalRiskItems, [
      'No se toca nada real sin aprobación.',
    ]),
    runtimeApprovalFooterMessage:
      normalizeOptionalString(runtimeApprovalState?.approvalPhrase) ||
      normalizeOptionalString(runtimeApprovalState?.notExecutedDisclaimer) ||
      'No se ejecutó todavía. Primero hace falta revisar y aprobar el alcance.',
    approvalRequestTitle:
      normalizeOptionalString(approvalRequestPlan?.title) || 'Acción sensible pendiente',
    approvalRequestOperatorMessage:
      normalizeOptionalString(approvalRequestPlan?.operatorMessage) ||
      normalizeOptionalString(approvalRequestPlan?.description) ||
      'Todavía no se ejecutó nada real.',
    approvalRequestAreaSummary:
      normalizeOptionalString(approvalRequestPlan?.areaSummary) ||
      normalizeOptionalString(approvalRequestPlan?.safeAlternative) ||
      'JEFE preparó el paquete de aprobación sin salir del modo local seguro.',
    approvalRequestStatusLabel: approvalRequestPlan?.blockedByDefault
      ? 'Bloqueado por seguridad'
      : 'Requiere aprobación',
    approvalRequestStatusTone: approvalRequestPlan?.blockedByDefault ? 'rose' : 'amber',
    approvalRequestRiskDetail:
      normalizeOptionalString(approvalRequestPlan?.approvalType) || 'Sin tipo',
    approvalRequestAreasValue:
      approvalPacketTouches.length > 0 ? `${approvalPacketTouches.length} area(s)` : 'Sin áreas',
    approvalRequestAreasDetail: approvalPacketTouches[0] || 'Sin alcance declarado',
    approvalRequestSafeAlternativeValue:
      normalizeOptionalString(approvalRequestPlan?.safeAlternative) ||
      'Seguir en modo local seguro',
    approvalRequestSafeAlternativeDetail:
      normalizeOptionalString(approvalRequestPlan?.approvalCopy) || 'Sin copy',
    approvalRequestStateValue: approvalRequestPlan?.blockedByDefault
      ? 'Bloqueado'
      : approvalRequestPlan?.requiresApproval
        ? 'Pendiente'
        : 'Revisable',
    approvalRequestStateDetail: approvalRequestPlan?.forbiddenInCurrentTask
      ? 'No se ejecuta en esta tarea.'
      : 'Todavía no se ejecutó nada real.',
    approvalRequestTouchedAreas: listOrFallback(approvalPacketTouches, [
      'El alcance sigue siendo solo informativo por ahora.',
    ]),
    approvalRequestUntouchedAreas: listOrFallback(approvalPacketWillNotTouch, [
      'No se toca nada real sin aprobación.',
    ]),
    approvalRequestValidationItems: listOrFallback(approvalPacketValidations, [
      'Revisar alcance, riesgo y alternativa segura antes de aprobar.',
    ]),
    approvalRequestWarningItems: listOrFallback(approvalPacketWarnings, [
      normalizeOptionalString(approvalRequestPlan?.explicitApprovalText) ||
        'No se ejecuta nada real en esta corrida.',
    ]),
    approvalRequestFooterMessage:
      normalizeOptionalString(approvalRequestPlan?.explicitApprovalText) ||
      'No se ejecutó todavía. Primero hace falta revisar y aprobar el alcance.',
  }
}