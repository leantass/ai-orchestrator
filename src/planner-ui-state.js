const normalizeOptionalString = (value) =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()

const normalizeOptionalStringArray = (value) =>
  Array.isArray(value)
    ? value.map((entry) => normalizeOptionalString(entry)).filter(Boolean)
    : []

const normalizeContinuationActionCandidateForUi = (value) => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const normalizedValue = {
    ...(normalizeOptionalString(value.id) ? { id: normalizeOptionalString(value.id) } : {}),
    ...(normalizeOptionalString(value.title)
      ? { title: normalizeOptionalString(value.title) }
      : {}),
    ...(normalizeOptionalString(value.description)
      ? { description: normalizeOptionalString(value.description) }
      : {}),
    ...(normalizeOptionalString(value.category)
      ? { category: normalizeOptionalString(value.category) }
      : {}),
    ...(normalizeOptionalString(value.targetStrategy)
      ? { targetStrategy: normalizeOptionalString(value.targetStrategy) }
      : {}),
    ...(typeof value.safeToPrepare === 'boolean'
      ? { safeToPrepare: value.safeToPrepare }
      : {}),
    ...(typeof value.safeToMaterialize === 'boolean'
      ? { safeToMaterialize: value.safeToMaterialize }
      : {}),
    ...(typeof value.requiresApproval === 'boolean'
      ? { requiresApproval: value.requiresApproval }
      : {}),
    ...(typeof value.blocked === 'boolean' ? { blocked: value.blocked } : {}),
    ...(normalizeOptionalString(value.blocker)
      ? { blocker: normalizeOptionalString(value.blocker) }
      : {}),
    ...(normalizeOptionalString(value.approvalType)
      ? { approvalType: normalizeOptionalString(value.approvalType) }
      : {}),
    ...(normalizeOptionalString(value.expectedOutcome)
      ? { expectedOutcome: normalizeOptionalString(value.expectedOutcome) }
      : {}),
    ...(typeof value.recommended === 'boolean'
      ? { recommended: value.recommended }
      : {}),
    ...(Number.isFinite(value.priority) ? { priority: value.priority } : {}),
    ...(normalizeOptionalString(value.phaseId)
      ? { phaseId: normalizeOptionalString(value.phaseId) }
      : {}),
    ...(normalizeOptionalString(value.moduleId)
      ? { moduleId: normalizeOptionalString(value.moduleId) }
      : {}),
    ...(normalizeOptionalString(value.riskLevel)
      ? { riskLevel: normalizeOptionalString(value.riskLevel) }
      : {}),
    ...(normalizeOptionalString(value.projectRoot)
      ? { projectRoot: normalizeOptionalString(value.projectRoot) }
      : {}),
    ...(normalizeOptionalString(value.deliveryLevel)
      ? { deliveryLevel: normalizeOptionalString(value.deliveryLevel) }
      : {}),
    ...(normalizeOptionalString(value.reason)
      ? { reason: normalizeOptionalString(value.reason) }
      : {}),
    ...(normalizeOptionalStringArray(value.targetFiles).length > 0
      ? { targetFiles: normalizeOptionalStringArray(value.targetFiles) }
      : {}),
    ...(normalizeOptionalStringArray(value.allowedTargetPaths).length > 0
      ? { allowedTargetPaths: normalizeOptionalStringArray(value.allowedTargetPaths) }
      : {}),
    ...(normalizeOptionalStringArray(value.explicitExclusions).length > 0
      ? { explicitExclusions: normalizeOptionalStringArray(value.explicitExclusions) }
      : {}),
    ...(normalizeOptionalStringArray(value.successCriteria).length > 0
      ? { successCriteria: normalizeOptionalStringArray(value.successCriteria) }
      : {}),
  }

  return Object.keys(normalizedValue).length > 0 ? normalizedValue : null
}

const buildPreparedModuleExpansionReviewActionForUi = (moduleExpansionPlan) => {
  if (!moduleExpansionPlan || typeof moduleExpansionPlan !== 'object') {
    return null
  }

  const moduleId = normalizeOptionalString(moduleExpansionPlan.moduleId)
  if (!moduleId) {
    return null
  }

  return normalizeContinuationActionCandidateForUi({
    id: `prepared-module-${moduleId}`,
    title:
      normalizeOptionalString(moduleExpansionPlan.moduleName) ||
      moduleId ||
      'Modulo preparado',
    description:
      normalizeOptionalString(moduleExpansionPlan.reason) ||
      'Hay una expansion preparada para revisar.',
    category: normalizeOptionalString(moduleExpansionPlan.expansionType),
    targetStrategy:
      moduleExpansionPlan.safeToMaterialize === true
        ? 'materialize-module-expansion-plan'
        : 'prepare-module-expansion-plan',
    safeToPrepare: moduleExpansionPlan.safeToPrepare !== false,
    safeToMaterialize: moduleExpansionPlan.safeToMaterialize === true,
    requiresApproval: moduleExpansionPlan.approvalRequired === true,
    blocked: normalizeOptionalStringArray(moduleExpansionPlan.blockers).length > 0,
    blocker: normalizeOptionalStringArray(moduleExpansionPlan.blockers)[0] || '',
    moduleId,
    riskLevel: normalizeOptionalString(moduleExpansionPlan.riskLevel),
    projectRoot: normalizeOptionalString(moduleExpansionPlan.projectRoot),
    reason: normalizeOptionalString(moduleExpansionPlan.reason),
    targetFiles: moduleExpansionPlan.targetFiles || [],
    allowedTargetPaths: moduleExpansionPlan.allowedTargetPaths || [],
    explicitExclusions: moduleExpansionPlan.explicitExclusions || [],
    successCriteria: moduleExpansionPlan.successCriteria || [],
    expectedOutcome:
      'Dejar la expansion del modulo lista para revision o materializacion segura.',
  })
}

const buildPreparedProjectPhaseReviewActionForUi = ({
  projectPhaseExecutionPlan,
  manifestPhases,
}) => {
  if (!projectPhaseExecutionPlan || typeof projectPhaseExecutionPlan !== 'object') {
    return null
  }

  const phaseId = normalizeOptionalString(projectPhaseExecutionPlan.phaseId)
  if (!phaseId) {
    return null
  }

  const phaseTitle =
    normalizeOptionalString(
      (Array.isArray(manifestPhases) ? manifestPhases : []).find(
        (phase) => normalizeOptionalString(phase?.id) === phaseId,
      )?.title,
    ) ||
    phaseId ||
    'Fase preparada'

  return normalizeContinuationActionCandidateForUi({
    id: `prepared-phase-${phaseId}`,
    title: phaseTitle,
    description:
      normalizeOptionalString(projectPhaseExecutionPlan.reason) ||
      'Hay una fase preparada para revisar.',
    category: 'project-phase',
    targetStrategy:
      normalizeOptionalString(projectPhaseExecutionPlan.targetStrategy) ||
      'prepare-project-phase-plan',
    safeToPrepare: true,
    safeToMaterialize: projectPhaseExecutionPlan.executableNow === true,
    requiresApproval: projectPhaseExecutionPlan.approvalRequired === true,
    blocked: normalizeOptionalStringArray(projectPhaseExecutionPlan.blockers).length > 0,
    blocker: normalizeOptionalStringArray(projectPhaseExecutionPlan.blockers)[0] || '',
    phaseId,
    riskLevel: normalizeOptionalString(projectPhaseExecutionPlan.riskLevel),
    projectRoot: normalizeOptionalString(projectPhaseExecutionPlan.projectRoot),
    reason: normalizeOptionalString(projectPhaseExecutionPlan.reason),
    targetFiles: projectPhaseExecutionPlan.targetFiles || [],
    allowedTargetPaths: projectPhaseExecutionPlan.allowedTargetPaths || [],
    explicitExclusions: projectPhaseExecutionPlan.explicitExclusions || [],
    successCriteria: projectPhaseExecutionPlan.successCriteria || [],
    expectedOutcome: 'Dejar la fase lista para revision o materializacion segura.',
  })
}

export const resolveProjectContinuityNextRecommendedActionForUi = ({
  projectContinuationState,
  projectReadinessState,
  continuationActionPlan,
  moduleExpansionPlan,
  projectPhaseExecutionPlan,
  localProjectManifest,
}) => {
  const manifestPhases = Array.isArray(localProjectManifest?.phases)
    ? localProjectManifest.phases
    : []

  return (
    normalizeContinuationActionCandidateForUi(projectContinuationState?.nextRecommendedAction) ||
    normalizeContinuationActionCandidateForUi(continuationActionPlan) ||
    normalizeContinuationActionCandidateForUi(projectReadinessState?.nextBestAction) ||
    buildPreparedModuleExpansionReviewActionForUi(moduleExpansionPlan) ||
    buildPreparedProjectPhaseReviewActionForUi({
      projectPhaseExecutionPlan,
      manifestPhases,
    }) ||
    null
  )
}

export const canPrepareProjectContinuityNextActionForUi = (action) =>
  Boolean(action) &&
  action.safeToPrepare !== false &&
  action.requiresApproval !== true &&
  action.blocked !== true

export const getProjectContinuityPrimaryActionLabelForUi = (action) => {
  if (!action || typeof action !== 'object') {
    return ''
  }

  const targetStrategy = normalizeOptionalString(action.targetStrategy).toLocaleLowerCase()
  const phaseId = normalizeOptionalString(action.phaseId)
  const moduleId = normalizeOptionalString(action.moduleId)
  const deliveryLevel = normalizeOptionalString(action.deliveryLevel).toLocaleLowerCase()

  if (
    phaseId ||
    targetStrategy === 'prepare-project-phase-plan' ||
    targetStrategy === 'materialize-project-phase-plan'
  ) {
    return 'Preparar siguiente fase segura'
  }

  if (
    moduleId ||
    targetStrategy === 'prepare-module-expansion-plan' ||
    targetStrategy === 'materialize-module-expansion-plan'
  ) {
    return 'Preparar siguiente expansion segura'
  }

  if (
    targetStrategy === 'materialize-fullstack-local-plan' ||
    (action.safeToMaterialize === true && deliveryLevel === 'fullstack-local')
  ) {
    return 'Preparar materializacion local segura'
  }

  return 'Preparar siguiente paso seguro'
}

export const canGenerateContinuationReviewFallbackForUi = ({
  plannerExecutionMetadata,
  effectivePlannerExecutionMetadata,
}) => {
  const currentMetadata =
    plannerExecutionMetadata && typeof plannerExecutionMetadata === 'object'
      ? plannerExecutionMetadata
      : null
  const effectiveMetadata =
    effectivePlannerExecutionMetadata &&
    typeof effectivePlannerExecutionMetadata === 'object'
      ? effectivePlannerExecutionMetadata
      : currentMetadata
  const normalizedDecisionKey = normalizeOptionalString(
    currentMetadata?.decisionKey || effectiveMetadata?.decisionKey,
  ).toLocaleLowerCase()
  const normalizedStrategy = normalizeOptionalString(
    currentMetadata?.strategy || effectiveMetadata?.strategy,
  ).toLocaleLowerCase()
  const normalizedExecutionMode = normalizeOptionalString(
    currentMetadata?.executionMode || effectiveMetadata?.executionMode,
  ).toLocaleLowerCase()
  const normalizedNextExpectedAction = normalizeOptionalString(
    currentMetadata?.nextExpectedAction || effectiveMetadata?.nextExpectedAction,
  ).toLocaleLowerCase()
  const hasPendingApproval =
    currentMetadata?.approvalRequired === true ||
    effectiveMetadata?.approvalRequired === true ||
    currentMetadata?.requiresApproval === true ||
    effectiveMetadata?.requiresApproval === true
  const isContinuationReview =
    normalizedDecisionKey === 'prepare-continuation-action-plan' ||
    normalizedStrategy === 'prepare-continuation-action-plan' ||
    normalizedNextExpectedAction === 'review-continuation-action'

  return (
    isContinuationReview &&
    normalizedExecutionMode === 'planner-only' &&
    hasPendingApproval === false &&
    hasSafeGeneratedDomainContractReviewSignalForUi({
      currentMetadata,
      effectiveMetadata,
    })
  )
}

const resolveGeneratedDomainContractDiagnosticsForUi = ({
  currentMetadata,
  effectiveMetadata,
}) => {
  const candidate =
    effectiveMetadata?.generatedDomainContractDiagnostics &&
    typeof effectiveMetadata.generatedDomainContractDiagnostics === 'object'
      ? effectiveMetadata.generatedDomainContractDiagnostics
      : currentMetadata?.generatedDomainContractDiagnostics &&
          typeof currentMetadata.generatedDomainContractDiagnostics === 'object'
        ? currentMetadata.generatedDomainContractDiagnostics
        : null

  if (!candidate) {
    return null
  }

  return candidate
}

const resolveGeneratedDomainContractForUi = ({ currentMetadata, effectiveMetadata }) => {
  const candidate =
    effectiveMetadata?.generatedDomainContract &&
    typeof effectiveMetadata.generatedDomainContract === 'object'
      ? effectiveMetadata.generatedDomainContract
      : currentMetadata?.generatedDomainContract &&
          typeof currentMetadata.generatedDomainContract === 'object'
        ? currentMetadata.generatedDomainContract
        : null

  if (!candidate) {
    return null
  }

  return candidate
}

const hasConsistentGeneratedDomainContractRootForUi = ({
  generatedDomainContract,
  generatedDomainContractDiagnostics,
}) => {
  const contractRoot =
    generatedDomainContract?.root && typeof generatedDomainContract.root === 'object'
      ? generatedDomainContract.root
      : null
  const sourceRoot = normalizeOptionalString(
    contractRoot?.sourceRoot ||
      generatedDomainContract?.sourceRoot ||
      generatedDomainContractDiagnostics?.sourceRoot,
  )
  const targetRoot = normalizeOptionalString(
    contractRoot?.targetRoot ||
      generatedDomainContract?.targetRoot ||
      generatedDomainContractDiagnostics?.targetRoot,
  )

  if (!sourceRoot || !targetRoot) {
    return true
  }

  return normalizeText(sourceRoot) === normalizeText(targetRoot)
}

const hasSafeGeneratedDomainContractReviewSignalForUi = ({
  currentMetadata,
  effectiveMetadata,
}) => {
  const generatedDomainContractDiagnostics = resolveGeneratedDomainContractDiagnosticsForUi({
    currentMetadata,
    effectiveMetadata,
  })
  const generatedDomainContract = resolveGeneratedDomainContractForUi({
    currentMetadata,
    effectiveMetadata,
  })

  return (
    generatedDomainContractDiagnostics?.present === true &&
    generatedDomainContractDiagnostics?.valid === true &&
    generatedDomainContractDiagnostics?.safeForLocalMaterialization === true &&
    hasConsistentGeneratedDomainContractRootForUi({
      generatedDomainContract,
      generatedDomainContractDiagnostics,
    })
  )
}

const normalizeText = (value) =>
  normalizeOptionalString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()

const detectOnlineCoursesIntentForUi = (value) => {
  const normalizedValue = normalizeText(value)
    .replace(/\bno\s+mezclar\b[^.\n\r]*/gu, ' ')
    .replace(/\bsin\s+mezclar\b[^.\n\r]*/gu, ' ')
  if (!normalizedValue) {
    return false
  }

  const learningCore =
    /\b(?:cursos?|clases?|lecciones?|panel alumno)\b/u.test(normalizedValue)
  const learningActors =
    /\b(?:alumnos?|estudiantes?|inscripciones?)\b/u.test(normalizedValue)
  const commercialAccessSignals =
    /\b(?:planes?|free|plata|oro|progreso|premium|gratuitas?)\b/u.test(
      normalizedValue,
    )
  const onlinePlatformSignals =
    /\b(?:cursos? online|plataforma web de cursos|plataforma de cursos|panel alumno|frontend\/student)\b/u.test(
      normalizedValue,
    )

  return learningCore && (learningActors || onlinePlatformSignals) && (commercialAccessSignals || onlinePlatformSignals)
}

const normalizeContractPathCandidateForUi = (value) =>
  normalizeOptionalString(value).replace(/\\/g, '/').toLocaleLowerCase()

const normalizeContractDefinitionForUi = (value) => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const requiredPathGroups = Array.isArray(value.requiredPathGroups)
    ? value.requiredPathGroups
        .map((group) => {
          if (!group || typeof group !== 'object') {
            return null
          }

          const candidates = normalizeOptionalStringArray(group.candidates).map(
            normalizeContractPathCandidateForUi,
          )

          if (candidates.length === 0) {
            return null
          }

          return {
            label: normalizeOptionalString(group.label) || candidates[0],
            candidates,
          }
        })
        .filter(Boolean)
    : []

  return {
    ...value,
    contractKind: normalizeOptionalString(value.contractKind),
    requiredPathGroups,
    forbiddenSignals: normalizeOptionalStringArray(value.forbiddenSignals),
  }
}

const buildFallbackMaterializationContractDefinitionForUi = ({
  metadata,
  normalizedTargetSummary,
}) => {
  const explicitContractDefinition =
    metadata?.materializationContract &&
    typeof metadata.materializationContract === 'object'
      ? metadata.materializationContract
      : metadata?.materializationPlan?.contractDefinition &&
          typeof metadata.materializationPlan.contractDefinition === 'object'
        ? metadata.materializationPlan.contractDefinition
        : null

  if (explicitContractDefinition) {
    return normalizeContractDefinitionForUi(explicitContractDefinition)
  }

  const explicitContractKind = normalizeOptionalString(
    metadata?.selectedContractKind || metadata?.materializationPlan?.contractKind,
  ).toLocaleLowerCase()
  const explicitDomain = normalizeOptionalString(metadata?.selectedDomain).toLocaleLowerCase()

  const inspectionSurface = normalizeText(
    [
      metadata?.decisionKey,
      metadata?.strategy,
      metadata?.selectedDomain,
      metadata?.selectedContractKind,
      metadata?.businessSector,
      metadata?.domainUnderstanding?.domainLabel,
      metadata?.materializationPlan?.projectRoot,
      normalizedTargetSummary,
    ].join(' '),
  )
  const onlineCoursesDetected =
    explicitContractKind === 'online-courses-fullstack-local' ||
    explicitDomain === 'online-courses' ||
    detectOnlineCoursesIntentForUi(inspectionSurface)

  if (onlineCoursesDetected) {
    const requiredPathGroups = [
      {
        label: 'backend/src/server.js|backend/server.js',
        candidates: ['backend/src/server.js', 'backend/server.js'],
      },
      { label: 'backend/src/routes/courses.js', candidates: ['backend/src/routes/courses.js'] },
      {
        label: 'backend/src/routes/categories.js',
        candidates: ['backend/src/routes/categories.js'],
      },
      { label: 'backend/src/routes/modules.js', candidates: ['backend/src/routes/modules.js'] },
      { label: 'backend/src/routes/lessons.js', candidates: ['backend/src/routes/lessons.js'] },
      {
        label: 'backend/src/routes/students.js',
        candidates: ['backend/src/routes/students.js'],
      },
      {
        label: 'backend/src/routes/enrollments.js',
        candidates: ['backend/src/routes/enrollments.js'],
      },
      { label: 'backend/src/routes/plans.js', candidates: ['backend/src/routes/plans.js'] },
      {
        label: 'backend/src/routes/payments.js',
        candidates: ['backend/src/routes/payments.js'],
      },
      {
        label: 'backend/src/routes/progress.js',
        candidates: ['backend/src/routes/progress.js'],
      },
      {
        label: 'backend/src/services/mock-mercado-pago.js',
        candidates: ['backend/src/services/mock-mercado-pago.js'],
      },
      { label: 'database/schema.sql', candidates: ['database/schema.sql'] },
      {
        label: 'database/seed.sql',
        candidates: ['database/seed.sql', 'database/seeds/seed-local.sql'],
      },
      { label: 'frontend/admin/index.html', candidates: ['frontend/admin/index.html'] },
      { label: 'frontend/admin/app.js', candidates: ['frontend/admin/app.js'] },
      { label: 'frontend/public/index.html', candidates: ['frontend/public/index.html'] },
      { label: 'frontend/public/app.js', candidates: ['frontend/public/app.js'] },
      {
        label: 'frontend/student/index.html',
        candidates: ['frontend/student/index.html'],
      },
      { label: 'frontend/student/app.js', candidates: ['frontend/student/app.js'] },
      { label: 'shared/plans.js', candidates: ['shared/plans.js'] },
      {
        label: 'shared/payment-statuses.js',
        candidates: ['shared/payment-statuses.js'],
      },
      {
        label: 'shared/course-statuses.js',
        candidates: ['shared/course-statuses.js'],
      },
      { label: 'docs/API.md', candidates: ['docs/api.md'] },
      { label: 'docs/ARCHITECTURE.md', candidates: ['docs/architecture.md'] },
      {
        label: 'docs/DB_SCHEMA.md|docs/DATA_MODEL.md',
        candidates: ['docs/db_schema.md', 'docs/data_model.md', 'docs/data-model.md'],
      },
      { label: 'docs/PAYMENTS_MOCK.md', candidates: ['docs/payments_mock.md'] },
      {
        label: 'docs/LOCAL_VALIDATION.md',
        candidates: ['docs/local_validation.md'],
      },
      {
        label: 'scripts/seed-local.js|scripts/README.md',
        candidates: ['scripts/seed-local.js', 'scripts/readme.md'],
      },
    ]

    return normalizeContractDefinitionForUi({
      contractKind: 'online-courses-fullstack-local',
      requiredPathGroups,
      forbiddenSignals: [
        'shipments',
        'tracking',
        'veterinaria',
        'appointments',
        'turnos',
        'pacientes',
        'mascotas',
        'productos',
        'stock',
        'inventario',
      ],
    })
  }

  const requiredPathGroups = [
    {
      label: 'backend/src/server.js|backend/server.js',
      candidates: ['backend/src/server.js', 'backend/server.js'],
    },
    {
      label: 'backend/src/routes/shipments.js',
      candidates: ['backend/src/routes/shipments.js'],
    },
    {
      label: 'backend/src/routes/tracking.js',
      candidates: ['backend/src/routes/tracking.js'],
    },
    {
      label: 'database/schema.sql',
      candidates: ['database/schema.sql'],
    },
    {
      label: 'database/seed.sql',
      candidates: ['database/seed.sql', 'database/seeds/seed-local.sql'],
    },
    {
      label: 'frontend/admin/index.html',
      candidates: ['frontend/admin/index.html'],
    },
    {
      label: 'frontend/admin/app.js',
      candidates: ['frontend/admin/app.js'],
    },
    {
      label: 'frontend/public/index.html',
      candidates: ['frontend/public/index.html'],
    },
    {
      label: 'frontend/public/app.js',
      candidates: ['frontend/public/app.js'],
    },
    {
      label: 'docs/API.md',
      candidates: ['docs/api.md'],
    },
    {
      label: 'docs/ARCHITECTURE.md',
      candidates: ['docs/architecture.md'],
    },
    {
      label: 'docs/DB_SCHEMA.md|docs/DATA_MODEL.md',
      candidates: ['docs/db_schema.md', 'docs/data_model.md', 'docs/data-model.md'],
    },
    {
      label: 'shared/constants.js|shared/statuses.js',
      candidates: ['shared/constants.js', 'shared/statuses.js'],
    },
    {
      label: 'scripts/seed-local.js|scripts/README.md',
      candidates: ['scripts/seed-local.js', 'scripts/readme.md'],
    },
  ]

  return normalizeContractDefinitionForUi({
    contractKind: 'logistics-fullstack-local',
    requiredPathGroups,
    forbiddenSignals: [
      'veterinaria',
      'appointments',
      'turnos',
      'pacientes',
      'mascotas',
      'reservas',
      'fullstack-local-veterinaria',
    ],
  })
}

const buildInspectionFailure = (baseDetails, reason, extra = {}) => ({
  ...baseDetails,
  ...extra,
  ok: false,
  contractOk: false,
  reason,
})

export const derivePlannerNextExpectedActionForUi = (value) => {
  const normalizedNextExpectedAction = normalizeOptionalString(
    value?.nextExpectedAction,
  ).toLocaleLowerCase()

  if (normalizedNextExpectedAction) {
    return normalizedNextExpectedAction
  }

  const normalizedDecisionKey = normalizeOptionalString(value?.decisionKey).toLocaleLowerCase()
  const normalizedStrategy = normalizeOptionalString(value?.strategy).toLocaleLowerCase()
  const normalizedExecutionMode = normalizeOptionalString(
    value?.executionMode,
  ).toLocaleLowerCase()
  const normalizedTargetStrategy = normalizeOptionalString(
    value?.nextActionPlan?.targetStrategy,
  ).toLocaleLowerCase()
  const materializeFullstackDecisionDetected =
    normalizedStrategy === 'materialize-fullstack-local-plan' ||
    normalizedDecisionKey === 'materialize-fullstack-local-plan' ||
    normalizedDecisionKey.startsWith('materialize-fullstack-local-') ||
    normalizedTargetStrategy === 'materialize-fullstack-local-plan'

  if (
    materializeFullstackDecisionDetected &&
    normalizedExecutionMode === 'executor' &&
    value?.approvalRequired !== true &&
    value?.requiresApproval !== true
  ) {
    return 'execute-plan'
  }

  return ''
}

export const isReviewOnlyPlannerResponseForUi = (value) => {
  const normalizedNextExpectedAction = derivePlannerNextExpectedActionForUi(value)
  const normalizedExecutionMode = normalizeOptionalString(
    value?.executionMode,
  ).toLocaleLowerCase()
  const normalizedStrategy = normalizeOptionalString(value?.strategy).toLocaleLowerCase()
  const normalizedDecisionKey = normalizeOptionalString(value?.decisionKey).toLocaleLowerCase()

  return (
    normalizedExecutionMode === 'planner-only' ||
    normalizedNextExpectedAction === 'review-safe-first-delivery' ||
    normalizedNextExpectedAction === 'review-scalable-delivery' ||
    normalizedNextExpectedAction === 'review-product-architecture' ||
    normalizedNextExpectedAction === 'review-plan' ||
    normalizedStrategy === 'safe-first-delivery-plan' ||
    normalizedDecisionKey === 'safe-first-delivery-plan' ||
    normalizedStrategy === 'scalable-delivery-plan' ||
    normalizedDecisionKey === 'scalable-delivery-plan' ||
    normalizedStrategy === 'product-architecture-plan' ||
    normalizedDecisionKey === 'product-architecture-plan'
  )
}

export const isPreparedFullstackLocalMaterializationResponse = (value) => {
  const normalizedStrategy = normalizeOptionalString(value?.strategy).toLocaleLowerCase()
  const normalizedDecisionKey = normalizeOptionalString(value?.decisionKey).toLocaleLowerCase()
  const normalizedExecutionMode = normalizeOptionalString(
    value?.executionMode,
  ).toLocaleLowerCase()
  const normalizedNextExpectedAction = derivePlannerNextExpectedActionForUi(value)

  return (
    (normalizedStrategy === 'materialize-fullstack-local-plan' ||
      normalizedDecisionKey === 'materialize-fullstack-local-plan' ||
      normalizedDecisionKey.startsWith('materialize-fullstack-local-')) &&
    normalizedExecutionMode === 'executor' &&
    normalizedNextExpectedAction === 'execute-plan' &&
    value?.approvalRequired !== true &&
    value?.requiresApproval !== true
  )
}

export const inspectPreparedFullstackLocalMaterialization = ({
  metadata,
  sourcePlan,
}) => {
  const normalizedDecisionKey = normalizeOptionalString(metadata?.decisionKey).toLocaleLowerCase()
  const normalizedStrategy = normalizeOptionalString(metadata?.strategy).toLocaleLowerCase()
  const normalizedExecutionMode = normalizeOptionalString(
    metadata?.executionMode,
  ).toLocaleLowerCase()
  const normalizedNextExpectedAction = derivePlannerNextExpectedActionForUi(metadata)
  const hasExecutionScope = Boolean(
    metadata?.executionScope && typeof metadata.executionScope === 'object',
  )
  const hasMaterializationPlan = Boolean(
    metadata?.materializationPlan && typeof metadata.materializationPlan === 'object',
  )
  const allowedTargetPaths = normalizeOptionalStringArray(
    metadata?.executionScope?.allowedTargetPaths,
  )
  const materializationDecisionDetected =
    normalizedDecisionKey === 'materialize-fullstack-local-plan' ||
    normalizedStrategy === 'materialize-fullstack-local-plan' ||
    normalizedDecisionKey.startsWith('materialize-fullstack-local-')
  const baseDetails = {
    decisionKey: normalizeOptionalString(metadata?.decisionKey),
    strategy: normalizeOptionalString(metadata?.strategy),
    executionMode: normalizeOptionalString(metadata?.executionMode),
    nextExpectedAction:
      normalizeOptionalString(metadata?.nextExpectedAction) ||
      normalizedNextExpectedAction,
    hasExecutionScope,
    hasMaterializationPlan,
    allowedTargetPathsCount: allowedTargetPaths.length,
    contractKind: normalizeOptionalString(
      metadata?.selectedContractKind || metadata?.materializationPlan?.contractDefinition?.contractKind,
    ),
    rootPath:
      normalizeOptionalString(metadata?.materializationPlan?.projectRoot) ||
      allowedTargetPaths[0] ||
      '',
    missingRequiredPaths: [],
    forbiddenSignalsFound: [],
  }

  if (!materializationDecisionDetected) {
    return buildInspectionFailure(
      baseDetails,
      'El planificador no devolvio un materialize-fullstack-local-plan valido.',
    )
  }

  if (normalizedExecutionMode !== 'executor') {
    return buildInspectionFailure(
      baseDetails,
      'El plan materializable fullstack no quedo marcado para executor.',
    )
  }

  if (normalizedNextExpectedAction !== 'execute-plan') {
    return buildInspectionFailure(
      baseDetails,
      'El plan materializable fullstack no quedo listo para execute-plan.',
    )
  }

  if (!allowedTargetPaths.length) {
    return buildInspectionFailure(
      baseDetails,
      'El plan materializable fullstack no devolvio allowedTargetPaths.',
    )
  }

  if (!hasMaterializationPlan) {
    return buildInspectionFailure(
      baseDetails,
      'El plan materializable fullstack no devolvio materializationPlan.',
    )
  }

  const materializationTargets = [
    ...allowedTargetPaths,
    ...normalizeOptionalStringArray(metadata?.materializationPlan?.allowedTargetPaths),
    ...(Array.isArray(metadata?.materializationPlan?.operations)
      ? metadata.materializationPlan.operations.flatMap((entry) => [
          normalizeOptionalString(entry?.targetPath),
          normalizeOptionalString(entry?.sourcePath),
        ])
      : []),
  ].filter(Boolean)
  const normalizedTargetSummary = materializationTargets
    .map((entry) => normalizeOptionalString(entry).replace(/\\/g, '/').toLocaleLowerCase())
    .join(' ')
  const contractDefinition = buildFallbackMaterializationContractDefinitionForUi({
    metadata,
    normalizedTargetSummary,
  })
  const requiredPathGroups = Array.isArray(contractDefinition?.requiredPathGroups)
    ? contractDefinition.requiredPathGroups
    : []
  const missingRequiredPaths = requiredPathGroups
    .filter(
      (group) =>
        !group.candidates.some((candidate) => normalizedTargetSummary.includes(candidate)),
    )
    .map((group) => group.label)
  const hasCanonicalDataModelDoc = requiredPathGroups
    .find((group) => group.label === 'docs/DB_SCHEMA.md|docs/DATA_MODEL.md')
    ?.candidates.some((candidate) => normalizedTargetSummary.includes(candidate))
  const hasSqlContract =
    normalizedTargetSummary.includes('database/schema.sql') &&
    (normalizedTargetSummary.includes('database/seed.sql') ||
      normalizedTargetSummary.includes('database/seeds/seed-local.sql'))
  const normalizedProjectIntent = normalizeText(
    metadata?.projectIntent || metadata?.scalableDeliveryPlan?.projectIntent,
  )
  const normalizedDetectedProjectRoot = normalizeOptionalString(
    metadata?.existingProjectDetection?.projectRoot,
  )
    .replace(/\\/g, '/')
    .toLocaleLowerCase()
    .replace(/\/+$/g, '')
  const activeProjectContextMode = normalizeText(metadata?.activeProjectContext?.mode)
  const activeProjectContextSource = normalizeText(metadata?.activeProjectContext?.source)
  const shouldIgnoreDetectedProjectSignals =
    metadata?.existingProjectDetection?.applicable === false ||
    normalizedProjectIntent === 'new-project-intent' ||
    activeProjectContextMode === 'new-project' ||
    activeProjectContextSource.includes('new-project') ||
    (normalizedDetectedProjectRoot !== '' &&
      !normalizedTargetSummary.includes(normalizedDetectedProjectRoot))
  const contaminationSourceSignals = [
    metadata?.decisionKey,
    metadata?.strategy,
    metadata?.executionMode,
    metadata?.nextExpectedAction,
    metadata?.selectedDomain,
    metadata?.detectedVertical,
    metadata?.selectedContractKind,
    metadata?.activeProjectContext?.domain,
    metadata?.domainUnderstanding?.domainLabel,
    ...(Array.isArray(metadata?.tasks)
      ? metadata.tasks.flatMap((entry) =>
          entry && typeof entry === 'object'
            ? [entry.targetPath]
            : [],
        )
      : []),
    ...normalizeOptionalStringArray(metadata?.executionScope?.allowedTargetPaths),
    ...normalizeOptionalStringArray(metadata?.materializationPlan?.allowedTargetPaths),
    ...(shouldIgnoreDetectedProjectSignals
      ? []
      : [
          metadata?.existingProjectDetection?.projectRoot,
          metadata?.existingProjectDetection?.domain,
          metadata?.localProjectManifest?.domain,
          ...(metadata?.localProjectManifest?.modules || []),
        ]),
  ]
  const contaminationPool = normalizeText(
    [
      ...contaminationSourceSignals,
      ...(metadata?.materializationPlan?.operations || []).flatMap((entry) => [
        normalizeOptionalString(entry?.targetPath),
        typeof entry?.nextContent === 'string' ? entry.nextContent.slice(0, 600) : '',
      ]),
    ]
      .filter(Boolean)
      .join(' '),
  )
  const forbiddenSignalsFound = normalizeOptionalStringArray(
    contractDefinition?.forbiddenSignals,
  ).filter((token) => contaminationPool.includes(normalizeText(token)))
  const sourceRootPath = normalizeOptionalStringArray(sourcePlan?.allowedRootPaths)[0]
  const returnedRootPath = allowedTargetPaths[0] || ''

  if (!hasSqlContract) {
    return buildInspectionFailure(
      baseDetails,
      'Falta contrato SQL local: database/schema.sql y database/seed.sql.',
      {
        missingRequiredPaths: missingRequiredPaths.includes('database/schema.sql')
          ? missingRequiredPaths
          : [...missingRequiredPaths, 'database/schema.sql', 'database/seed.sql'],
      },
    )
  }

  if (missingRequiredPaths.length > 0) {
    return buildInspectionFailure(
      baseDetails,
      `El plan materializable fullstack no devolvio el contrato minimo esperado. Faltan: ${missingRequiredPaths.join(
        ', ',
      )}.`,
      {
        missingRequiredPaths,
      },
    )
  }

  if (!hasCanonicalDataModelDoc) {
    return buildInspectionFailure(
      baseDetails,
      'El plan materializable fullstack no devolvio documentacion suficiente del modelo de datos. Falta docs/DB_SCHEMA.md o docs/DATA_MODEL.md.',
      {
        missingRequiredPaths: ['docs/DB_SCHEMA.md|docs/DATA_MODEL.md'],
      },
    )
  }

  if (forbiddenSignalsFound.length > 0) {
    return buildInspectionFailure(
      baseDetails,
      `El plan materializable fullstack quedo contaminado con otro dominio. Tokens detectados: ${forbiddenSignalsFound.join(
        ', ',
      )}.`,
      {
        forbiddenSignalsFound,
      },
    )
  }

  if (
    sourceRootPath &&
    returnedRootPath &&
    normalizeOptionalString(sourceRootPath).toLocaleLowerCase() !==
      normalizeOptionalString(returnedRootPath).toLocaleLowerCase()
  ) {
    return buildInspectionFailure(
      baseDetails,
      `El root permitido del plan materializable no coincide con el plan fullstack activo. Fuente: ${sourceRootPath}. Devuelto: ${returnedRootPath}.`,
    )
  }

  return {
    ...baseDetails,
    ok: true,
    contractOk: true,
    reason: 'Contrato fullstack local válido.',
    missingRequiredPaths,
    forbiddenSignalsFound,
  }
}

export const derivePlannerMaterializationUiState = ({
  plannerExecutionMetadata,
  effectivePlannerExecutionMetadata,
}) => {
  const currentMetadata =
    plannerExecutionMetadata && typeof plannerExecutionMetadata === 'object'
      ? plannerExecutionMetadata
      : {}
  const effectiveMetadata =
    effectivePlannerExecutionMetadata &&
    typeof effectivePlannerExecutionMetadata === 'object'
      ? effectivePlannerExecutionMetadata
      : currentMetadata
  const scalableDeliveryPlan =
    effectiveMetadata?.scalableDeliveryPlan &&
    typeof effectiveMetadata.scalableDeliveryPlan === 'object'
      ? effectiveMetadata.scalableDeliveryPlan
      : currentMetadata?.scalableDeliveryPlan &&
          typeof currentMetadata.scalableDeliveryPlan === 'object'
        ? currentMetadata.scalableDeliveryPlan
        : null
  const nextActionPlan =
    effectiveMetadata?.nextActionPlan && typeof effectiveMetadata.nextActionPlan === 'object'
      ? effectiveMetadata.nextActionPlan
      : currentMetadata?.nextActionPlan && typeof currentMetadata.nextActionPlan === 'object'
        ? currentMetadata.nextActionPlan
        : null
  const projectReadinessState =
    effectiveMetadata?.projectReadinessState &&
    typeof effectiveMetadata.projectReadinessState === 'object'
      ? effectiveMetadata.projectReadinessState
      : currentMetadata?.projectReadinessState &&
          typeof currentMetadata.projectReadinessState === 'object'
        ? currentMetadata.projectReadinessState
        : null
  const projectContinuationState =
    effectiveMetadata?.projectContinuationState &&
    typeof effectiveMetadata.projectContinuationState === 'object'
      ? effectiveMetadata.projectContinuationState
      : currentMetadata?.projectContinuationState &&
          typeof currentMetadata.projectContinuationState === 'object'
        ? currentMetadata.projectContinuationState
        : null
  const generatedDomainContractDiagnostics = resolveGeneratedDomainContractDiagnosticsForUi({
    currentMetadata,
    effectiveMetadata,
  })
  const generatedDomainContract = resolveGeneratedDomainContractForUi({
    currentMetadata,
    effectiveMetadata,
  })
  const tasks = Array.isArray(effectiveMetadata?.tasks)
    ? effectiveMetadata.tasks
    : Array.isArray(currentMetadata?.tasks)
      ? currentMetadata.tasks
      : []
  const normalizedDecisionKey = normalizeOptionalString(
    currentMetadata?.decisionKey || effectiveMetadata?.decisionKey,
  ).toLocaleLowerCase()
  const normalizedStrategy = normalizeOptionalString(
    currentMetadata?.strategy || effectiveMetadata?.strategy,
  ).toLocaleLowerCase()
  const normalizedNextExpectedAction = derivePlannerNextExpectedActionForUi({
    ...effectiveMetadata,
    ...currentMetadata,
  })
  const normalizedExecutionMode = normalizeOptionalString(
    currentMetadata?.executionMode || effectiveMetadata?.executionMode,
  ).toLocaleLowerCase()
  const hasPendingApproval =
    currentMetadata?.approvalRequired === true ||
    effectiveMetadata?.approvalRequired === true ||
    currentMetadata?.requiresApproval === true ||
    effectiveMetadata?.requiresApproval === true
  const scalableDeliveryLevel = normalizeOptionalString(
    scalableDeliveryPlan?.deliveryLevel ||
      nextActionPlan?.targetDeliveryLevel ||
      projectReadinessState?.nextBestAction?.targetDeliveryLevel ||
      projectContinuationState?.nextRecommendedAction?.targetDeliveryLevel,
  ).toLocaleLowerCase()
  const targetStrategy = normalizeOptionalString(
    nextActionPlan?.targetStrategy ||
      projectReadinessState?.nextBestAction?.targetStrategy ||
      projectContinuationState?.nextRecommendedAction?.targetStrategy,
  ).toLocaleLowerCase()
  const targetDeliveryLevel = normalizeOptionalString(
    nextActionPlan?.targetDeliveryLevel ||
      projectReadinessState?.nextBestAction?.targetDeliveryLevel ||
      projectContinuationState?.nextRecommendedAction?.targetDeliveryLevel ||
      scalableDeliveryPlan?.deliveryLevel,
  ).toLocaleLowerCase()
  const reviewHintSurface = [
    currentMetadata?.decisionKey,
    currentMetadata?.strategy,
    currentMetadata?.businessSector,
    currentMetadata?.creativeProfile,
    currentMetadata?.nextExpectedAction,
    generatedDomainContract?.deliveryLevel,
    generatedDomainContract?.root?.slug,
    generatedDomainContractDiagnostics?.rootSlug,
    scalableDeliveryPlan?.deliveryLevel,
    scalableDeliveryPlan?.reason,
    nextActionPlan?.currentState,
    nextActionPlan?.userFacingLabel,
    nextActionPlan?.recommendedAction,
    nextActionPlan?.reason,
    nextActionPlan?.technicalLabel,
    nextActionPlan?.targetStrategy,
    nextActionPlan?.targetDeliveryLevel,
    projectReadinessState?.runtimeReadiness,
    projectReadinessState?.nextBestAction?.title,
    projectReadinessState?.nextBestAction?.description,
    projectReadinessState?.nextBestAction?.targetStrategy,
    projectContinuationState?.nextRecommendedAction?.title,
    projectContinuationState?.nextRecommendedAction?.description,
    projectContinuationState?.nextRecommendedAction?.targetStrategy,
    ...tasks.flatMap((task) =>
      task && typeof task === 'object'
        ? [task.title, task.operation, task.description, task.targetPath]
        : [],
    ),
  ]
    .map((value) => normalizeOptionalString(value).toLocaleLowerCase())
    .filter(Boolean)
    .join(' ')
  const structureSurface = [
    ...normalizeOptionalStringArray(scalableDeliveryPlan?.targetStructure),
    ...normalizeOptionalStringArray(scalableDeliveryPlan?.directories),
    ...normalizeOptionalStringArray(scalableDeliveryPlan?.allowedRootPaths),
    normalizeOptionalString(generatedDomainContract?.root?.sourceRoot),
    normalizeOptionalString(generatedDomainContract?.root?.targetRoot),
    ...normalizeOptionalStringArray(
      Array.isArray(generatedDomainContract?.materialization?.requiredFiles)
        ? generatedDomainContract.materialization.requiredFiles
        : [],
    ),
    ...normalizeOptionalStringArray(
      Array.isArray(generatedDomainContract?.validation?.requiredPathGroups)
        ? generatedDomainContract.validation.requiredPathGroups.flatMap((group) =>
            Array.isArray(group?.candidates) ? group.candidates : [],
          )
        : [],
    ),
    ...normalizeOptionalStringArray(
      Array.isArray(scalableDeliveryPlan?.filesToCreate)
        ? scalableDeliveryPlan.filesToCreate.map((entry) =>
            entry && typeof entry === 'object' ? entry.path : '',
          )
        : [],
    ),
    ...tasks.flatMap((task) =>
      task && typeof task === 'object'
        ? [task.targetPath, task.title, task.operation]
        : [],
    ),
  ].map((value) => normalizeOptionalString(value).toLocaleLowerCase())
  const structureLooksLikeFullstackLocal =
    structureSurface.some((value) => value.includes('backend')) &&
    structureSurface.some(
      (value) =>
        value.includes('database') ||
        value.includes('schema.sql') ||
        value.includes('seed.sql'),
    ) &&
    structureSurface.some((value) => value.includes('frontend'))
  const structureLooksLikeFrontendProject =
    structureSurface.some((value) => value.includes('src')) &&
    structureSurface.some(
      (value) =>
        value.includes('components') ||
        value.includes('routes') ||
        value.includes('pages'),
    )
  const generatedDomainContractSafeReviewSignal =
    hasPendingApproval === false &&
    hasSafeGeneratedDomainContractReviewSignalForUi({
      currentMetadata,
      effectiveMetadata,
    })
  const looksLikeFullstackLocalReview =
    scalableDeliveryLevel === 'fullstack-local' ||
    targetDeliveryLevel === 'fullstack-local' ||
    targetStrategy === 'materialize-fullstack-local-plan' ||
    reviewHintSurface.includes('fullstack local') ||
    reviewHintSurface.includes('fullstack-local') ||
    reviewHintSurface.includes('materialize-fullstack-local-plan') ||
    reviewHintSurface.includes('backend local') ||
    reviewHintSurface.includes('sqlite') ||
    structureLooksLikeFullstackLocal ||
    generatedDomainContractSafeReviewSignal
  const looksLikeFrontendProjectReview =
    scalableDeliveryLevel === 'frontend-project' ||
    targetDeliveryLevel === 'frontend-project' ||
    targetStrategy === 'materialize-frontend-project-plan' ||
    reviewHintSurface.includes('frontend project') ||
    reviewHintSurface.includes('frontend-project') ||
    reviewHintSurface.includes('materialize-frontend-project-plan') ||
    structureLooksLikeFrontendProject
  const responseReady = isPreparedFullstackLocalMaterializationResponse(
    currentMetadata,
  )
  const effectiveReviewOnly =
    isReviewOnlyPlannerResponseForUi(currentMetadata) &&
    normalizedExecutionMode !== 'executor' &&
    !responseReady
  const plannerIsScalableDeliveryReview =
    normalizedDecisionKey === 'scalable-delivery-plan' ||
    normalizedStrategy === 'scalable-delivery-plan' ||
    normalizedNextExpectedAction === 'review-scalable-delivery' ||
    (effectiveReviewOnly &&
      Boolean(scalableDeliveryPlan) &&
      scalableDeliveryLevel !== 'safe-first-delivery')
  const canPrepareFullstackLocal =
    plannerIsScalableDeliveryReview &&
    hasPendingApproval === false &&
    looksLikeFullstackLocalReview
  const canPrepareFrontendProject =
    plannerIsScalableDeliveryReview && looksLikeFrontendProjectReview
  const prepareCtaKind = canPrepareFullstackLocal
    ? 'fullstack-local'
    : canPrepareFrontendProject
      ? 'frontend-project'
      : ''
  const prepareCtaVisible =
    effectiveReviewOnly && plannerIsScalableDeliveryReview && prepareCtaKind !== ''
  const prepareCtaLabel =
    prepareCtaKind === 'fullstack-local'
      ? 'Preparar entrega funcional local'
      : prepareCtaKind === 'frontend-project'
        ? 'Preparar frontend local ejecutable'
        : ''
  const contractInspection = inspectPreparedFullstackLocalMaterialization({
    metadata: effectiveMetadata,
    sourcePlan: scalableDeliveryPlan,
  })
  const materializeCtaVisible = responseReady && !effectiveReviewOnly
  const materializeCtaEnabled = materializeCtaVisible && contractInspection.ok
  const materializeCtaDisabledReason =
    materializeCtaVisible && !materializeCtaEnabled
      ? contractInspection.reason || 'Contrato materializable incompleto.'
      : ''
  const uiState = responseReady
    ? materializeCtaEnabled
      ? 'materialization-ready'
      : 'materialization-incomplete'
    : effectiveReviewOnly
      ? plannerIsScalableDeliveryReview
        ? 'review-scalable-delivery'
        : 'review-plan'
      : 'plan-active'

  return {
    isScalableReview: plannerIsScalableDeliveryReview,
    looksLikeFullstackLocalReview,
    looksLikeFrontendProjectReview,
    canPrepareFullstackLocal,
    canPrepareFrontendProject,
    prepareCtaVisible,
    prepareCtaLabel,
    prepareCtaKind,
    fullstackMaterializationResponseReady: responseReady,
    fullstackMaterializationContractReady: responseReady && contractInspection.ok,
    contractInspection,
    effectiveReviewOnly,
    shouldShowScalableDeliveryPlan:
      plannerIsScalableDeliveryReview &&
      !responseReady &&
      Boolean(scalableDeliveryPlan) &&
      scalableDeliveryLevel !== 'safe-first-delivery',
    shouldShowMaterializeDeliveryCta: materializeCtaVisible,
    materializeCtaVisible,
    materializeCtaEnabled,
    materializeCtaDisabledReason,
    uiState,
  }
}
