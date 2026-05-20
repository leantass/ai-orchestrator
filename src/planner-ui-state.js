const normalizeOptionalString = (value) =>
  typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()

const normalizeOptionalStringArray = (value) =>
  Array.isArray(value)
    ? value.map((entry) => normalizeOptionalString(entry)).filter(Boolean)
    : []

const normalizeText = (value) =>
  normalizeOptionalString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()

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
    metadata?.reason,
    metadata?.activeProjectContext?.domain,
    metadata?.activeProjectContext?.note,
    metadata?.domainUnderstanding?.domainLabel,
    ...(Array.isArray(metadata?.tasks)
      ? metadata.tasks.flatMap((entry) =>
          entry && typeof entry === 'object'
            ? [entry.title, entry.operation, entry.description, entry.targetPath]
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
  const forbiddenSignalsFound = [
    'veterinaria',
    'appointments',
    'turnos',
    'pacientes',
    'mascotas',
    'reservas',
    'fullstack-local-veterinaria',
  ].filter((token) => contaminationPool.includes(normalizeText(token)))
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
  const looksLikeFullstackLocalReview =
    scalableDeliveryLevel === 'fullstack-local' ||
    targetDeliveryLevel === 'fullstack-local' ||
    targetStrategy === 'materialize-fullstack-local-plan' ||
    reviewHintSurface.includes('fullstack local') ||
    reviewHintSurface.includes('fullstack-local') ||
    reviewHintSurface.includes('materialize-fullstack-local-plan') ||
    reviewHintSurface.includes('backend local') ||
    reviewHintSurface.includes('sqlite') ||
    structureLooksLikeFullstackLocal
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
    plannerIsScalableDeliveryReview && looksLikeFullstackLocalReview
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
