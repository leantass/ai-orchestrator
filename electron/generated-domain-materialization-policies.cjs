const path = require('node:path')

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizePathForComparison(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim().replace(/\\/gu, '/').replace(/\/{2,}/gu, '/')
    : ''
}

function summarizeUniqueExecutorStrings(entries, limit = 4) {
  if (!Array.isArray(entries)) {
    return []
  }

  const uniqueEntries = []
  const seenEntries = new Set()

  for (const entry of entries) {
    if (typeof entry !== 'string' || !entry.trim()) {
      continue
    }

    const trimmedEntry = entry.trim()
    const normalizedEntry = trimmedEntry.toLocaleLowerCase()

    if (seenEntries.has(normalizedEntry)) {
      continue
    }

    seenEntries.add(normalizedEntry)
    uniqueEntries.push(trimmedEntry)

    if (uniqueEntries.length >= limit) {
      break
    }
  }

  return uniqueEntries
}

function sanitizeDebugPreview(value, maxLength = 240) {
  const normalized =
    typeof value === 'string'
      ? value
      : value === null || value === undefined
        ? ''
        : String(value)

  if (!normalized.trim()) {
    return ''
  }

  const compacted = normalized.replace(/\s+/gu, ' ').trim()

  return compacted.length <= maxLength
    ? compacted
    : `${compacted.slice(0, Math.max(0, maxLength - 3))}...`
}

function summarizeDebugEntries(entries, maxEntries = 3) {
  if (!Array.isArray(entries) || maxEntries <= 0) {
    return {
      firstEntry: undefined,
      preview: [],
    }
  }

  const preview = []
  const seen = new Set()

  for (const entry of entries) {
    const sanitized = sanitizeDebugPreview(entry, 240)
    if (!sanitized || seen.has(sanitized)) {
      continue
    }

    seen.add(sanitized)
    preview.push(sanitized)

    if (preview.length >= maxEntries) {
      break
    }
  }

  return {
    firstEntry: preview[0],
    preview,
  }
}

function pushUniqueMessage(target, message) {
  const normalized =
    typeof message === 'string'
      ? message.trim().replace(/\s+/gu, ' ')
      : message === null || message === undefined
        ? ''
        : String(message).trim().replace(/\s+/gu, ' ')
  if (!normalized || target.includes(normalized)) {
    return
  }
  target.push(normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}...`)
}

function summarizeGeneratedDomainMaterializationSourceResolutionForDebug(resolution) {
  if (!resolution || typeof resolution !== 'object') {
    return {
      present: false,
      resolved: false,
      source: 'none',
      mode: 'runtime-disabled',
    }
  }

  const warningSummary = summarizeDebugEntries(resolution.warnings)
  const errorSummary = summarizeDebugEntries(resolution.errors)

  return {
    present: resolution.present === true,
    resolved: resolution.resolved === true,
    source:
      typeof resolution.source === 'string' && resolution.source.trim()
        ? resolution.source.trim()
        : 'none',
    mode:
      typeof resolution.mode === 'string' && resolution.mode.trim()
        ? resolution.mode.trim()
        : 'runtime-disabled',
    behaviorChanged: resolution.behaviorChanged === true,
    switchEnabled: resolution.inputs?.switchEnabled === true,
    materializationPlanPresent: resolution.inputs?.materializationPlanPresent === true,
    shadowPlanBuilt: resolution.inputs?.shadowPlanBuilt === true,
    wouldSelectShadow: resolution.testProjection?.wouldSelectShadow === true,
    materializationPlanChanged:
      resolution.runtime?.materializationPlanChanged === true,
    executionScopeChanged: resolution.runtime?.executionScopeChanged === true,
    recommendedAction:
      typeof resolution.recommendation?.action === 'string' &&
      resolution.recommendation.action.trim()
        ? resolution.recommendation.action.trim()
        : 'observe',
    warningsCount: Array.isArray(resolution.warnings) ? resolution.warnings.length : 0,
    errorsCount: Array.isArray(resolution.errors) ? resolution.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainControlledEnablePolicyForDebug(policy) {
  if (!policy || typeof policy !== 'object') {
    return {
      present: false,
      evaluated: false,
      status: 'not-ready',
    }
  }

  const warningSummary = summarizeDebugEntries(policy.warnings)
  const errorSummary = summarizeDebugEntries(policy.errors)

  return {
    present: policy.present === true,
    evaluated: policy.evaluated === true,
    status:
      typeof policy.status === 'string' && policy.status.trim()
        ? policy.status.trim()
        : 'not-ready',
    behaviorChanged: policy.behaviorChanged === true,
    runtimeEnabled: policy.runtimeEnabled === true,
    hasLegacyMaterializationPlan:
      policy.eligibility?.hasLegacyMaterializationPlan === true,
    hasShadowCandidate: policy.eligibility?.hasShadowCandidate === true,
    candidateUsableByFutureSwitch:
      policy.eligibility?.candidateUsableByFutureSwitch === true,
    endToEndReadyForHarness:
      policy.eligibility?.endToEndReadyForHarness === true,
    controlledRuntimeEnable:
      policy.allowedModes?.controlledRuntimeEnable === true,
    recommendedAction:
      typeof policy.recommendation?.action === 'string' &&
      policy.recommendation.action.trim()
        ? policy.recommendation.action.trim()
        : 'observe',
    warningsCount: Array.isArray(policy.warnings) ? policy.warnings.length : 0,
    errorsCount: Array.isArray(policy.errors) ? policy.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainFirstControlledEnableScenarioForDebug(scenario) {
  if (!scenario || typeof scenario !== 'object') {
    return {
      present: false,
      evaluated: false,
      status: 'not-ready',
    }
  }

  const warningSummary = summarizeDebugEntries(scenario.warnings)
  const errorSummary = summarizeDebugEntries(scenario.errors)

  return {
    present: scenario.present === true,
    evaluated: scenario.evaluated === true,
    status:
      typeof scenario.status === 'string' && scenario.status.trim()
        ? scenario.status.trim()
        : 'not-ready',
    behaviorChanged: scenario.behaviorChanged === true,
    allowedNow: scenario.allowedNow === true,
    requiresLeanApproval: scenario.requiresLeanApproval !== false,
    fullstackLocalOnly: scenario.conditions?.fullstackLocalOnly === true,
    hasLegacyMaterializationPlan:
      scenario.conditions?.hasLegacyMaterializationPlan === true,
    hasShadowCandidate: scenario.conditions?.hasShadowCandidate === true,
    candidateUsableByFutureSwitch:
      scenario.conditions?.candidateUsableByFutureSwitch === true,
    controlledRuntimeEnable:
      scenario.conditions?.controlledRuntimeEnable === true,
    recommendedAction:
      typeof scenario.recommendation?.action === 'string' &&
      scenario.recommendation.action.trim()
        ? scenario.recommendation.action.trim()
        : 'observe',
    warningsCount: Array.isArray(scenario.warnings) ? scenario.warnings.length : 0,
    errorsCount: Array.isArray(scenario.errors) ? scenario.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainFileCreationApprovalPolicyForDebug(policy) {
  if (!policy || typeof policy !== 'object') {
    return {
      present: false,
      evaluated: false,
      status: 'not-ready',
    }
  }

  const warningSummary = summarizeDebugEntries(policy.warnings)
  const errorSummary = summarizeDebugEntries(policy.errors)

  return {
    present: policy.present === true,
    evaluated: policy.evaluated === true,
    status:
      typeof policy.status === 'string' && policy.status.trim()
        ? policy.status.trim()
        : 'not-ready',
    behaviorChanged: policy.behaviorChanged === true,
    approvalRequired: policy.approvalRequired === true,
    allowedNow: policy.allowedNow === true,
    requiresLeanApproval: policy.requiresLeanApproval !== false,
    targetRoot:
      typeof policy.scope?.targetRoot === 'string' && policy.scope.targetRoot.trim()
        ? policy.scope.targetRoot.trim()
        : undefined,
    previewPathsCount: Array.isArray(policy.scope?.previewPaths)
      ? policy.scope.previewPaths.length
      : 0,
    candidateComparisonStatus:
      typeof policy.evidence?.candidateComparisonStatus === 'string' &&
      policy.evidence.candidateComparisonStatus.trim()
        ? policy.evidence.candidateComparisonStatus.trim()
        : 'not-available',
    candidateUsableByFutureSwitch:
      policy.evidence?.candidateUsableByFutureSwitch === true,
    noCommands: policy.safeguards?.noCommands === true,
    noWritesExecuted: policy.safeguards?.noWritesExecuted === true,
    noWebPrueba: policy.safeguards?.noWebPrueba === true,
    recommendedAction:
      typeof policy.recommendation?.action === 'string' &&
      policy.recommendation.action.trim()
        ? policy.recommendation.action.trim()
        : 'observe',
    warningsCount: Array.isArray(policy.warnings) ? policy.warnings.length : 0,
    errorsCount: Array.isArray(policy.errors) ? policy.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainMaterializationApprovalPayloadForDebug(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      present: false,
      evaluated: false,
      status: 'not-ready',
    }
  }

  const warningSummary = summarizeDebugEntries(payload.warnings)
  const errorSummary = summarizeDebugEntries(payload.errors)

  return {
    present: payload.present === true,
    evaluated: payload.evaluated === true,
    status:
      typeof payload.status === 'string' && payload.status.trim()
        ? payload.status.trim()
        : 'not-ready',
    behaviorChanged: payload.behaviorChanged === true,
    approvalRequired: payload.approvalRequired === true,
    approved: payload.approved === true,
    allowedNow: payload.allowedNow === true,
    requiresLeanApproval: payload.requiresLeanApproval !== false,
    root:
      typeof payload.review?.root === 'string' && payload.review.root.trim()
        ? payload.review.root.trim()
        : undefined,
    targetRoot:
      typeof payload.review?.targetRoot === 'string' && payload.review.targetRoot.trim()
        ? payload.review.targetRoot.trim()
        : undefined,
    pathsPreviewCount: Array.isArray(payload.review?.pathsPreview)
      ? payload.review.pathsPreview.length
      : 0,
    filesPreviewCount: Array.isArray(payload.review?.filesPreview)
      ? payload.review.filesPreview.length
      : 0,
    forbiddenPathsCount: Array.isArray(payload.review?.forbiddenPaths)
      ? payload.review.forbiddenPaths.length
      : 0,
    previewStatus:
      typeof payload.evidence?.previewStatus === 'string' &&
      payload.evidence.previewStatus.trim()
        ? payload.evidence.previewStatus.trim()
        : 'not-available',
    approvalPolicyStatus:
      typeof payload.evidence?.approvalPolicyStatus === 'string' &&
      payload.evidence.approvalPolicyStatus.trim()
        ? payload.evidence.approvalPolicyStatus.trim()
        : 'not-available',
    blockedReasonsCount: Array.isArray(payload.blockedReasons)
      ? payload.blockedReasons.length
      : 0,
    warningsCount: Array.isArray(payload.warnings) ? payload.warnings.length : 0,
    errorsCount: Array.isArray(payload.errors) ? payload.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainRuntimeShadowReadinessDecisionForDebug(decision) {
  if (!decision || typeof decision !== 'object') {
    return {
      present: false,
      evaluated: false,
      status: 'not-ready',
    }
  }

  const warningSummary = summarizeDebugEntries(decision.warnings)
  const errorSummary = summarizeDebugEntries(decision.errors)

  return {
    present: decision.present === true,
    evaluated: decision.evaluated === true,
    status:
      typeof decision.status === 'string' && decision.status.trim()
        ? decision.status.trim()
        : 'not-ready',
    behaviorChanged: decision.behaviorChanged === true,
    runtimeEnabled: decision.runtimeEnabled === true,
    controlledRuntimeEnable: decision.controlledRuntimeEnable === true,
    requiresLeanApproval: decision.requiresLeanApproval !== false,
    readyForHarness: decision.readiness?.readyForHarness === true,
    readyForControlledRuntimeReview:
      decision.readiness?.readyForControlledRuntimeReview === true,
    approvalPayloadReady: decision.readiness?.approvalPayloadReady === true,
    sourceReal:
      typeof decision.evidence?.sourceReal === 'string' && decision.evidence.sourceReal.trim()
        ? decision.evidence.sourceReal.trim()
        : 'none',
    sourceProjectedInTest:
      typeof decision.evidence?.sourceProjectedInTest === 'string' &&
      decision.evidence.sourceProjectedInTest.trim()
        ? decision.evidence.sourceProjectedInTest.trim()
        : 'not-available',
    materializationPlanChanged:
      decision.safeguards?.materializationPlanChanged === true,
    executionScopeChanged: decision.safeguards?.executionScopeChanged === true,
    recommendedAction:
      typeof decision.recommendation?.action === 'string' &&
      decision.recommendation.action.trim()
        ? decision.recommendation.action.trim()
        : 'observe',
    warningsCount: Array.isArray(decision.warnings) ? decision.warnings.length : 0,
    errorsCount: Array.isArray(decision.errors) ? decision.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainMvpReadinessExecutiveReportForDebug(report) {
  if (!report || typeof report !== 'object') {
    return {
      present: false,
      evaluated: false,
      status: 'not-ready',
    }
  }

  const warningSummary = summarizeDebugEntries(report.warnings)
  const errorSummary = summarizeDebugEntries(report.errors)

  return {
    present: report.present === true,
    evaluated: report.evaluated === true,
    status:
      typeof report.status === 'string' && report.status.trim()
        ? report.status.trim()
        : 'not-ready',
    behaviorChanged: report.behaviorChanged === true,
    contractReady: report.mvpFlow?.contractReady === true,
    previewReady: report.mvpFlow?.previewReady === true,
    planReady: report.mvpFlow?.planReady === true,
    approvalPayloadReady: report.mvpFlow?.approvalPayloadReady === true,
    approvalGateReady: report.mvpFlow?.approvalGateReady === true,
    sandboxReady: report.mvpFlow?.sandboxReady === true,
    validationReady: report.mvpFlow?.validationReady === true,
    reportReady: report.mvpFlow?.reportReady === true,
    runtimeEnabled: report.runtime?.runtimeEnabled === true,
    controlledRuntimeEnable: report.runtime?.controlledRuntimeEnable === true,
    sourceReal:
      typeof report.runtime?.sourceReal === 'string' && report.runtime.sourceReal.trim()
        ? report.runtime.sourceReal.trim()
        : 'none',
    approvalRequired: report.approvals?.approvalRequired !== false,
    approved: report.approvals?.approved === true,
    pendingApprovalsCount: Array.isArray(report.approvals?.pendingItems)
      ? report.approvals.pendingItems.length
      : 0,
    blockersCount: Array.isArray(report.blockers) ? report.blockers.length : 0,
    risksCount: Array.isArray(report.risks) ? report.risks.length : 0,
    warningsCount: Array.isArray(report.warnings) ? report.warnings.length : 0,
    errorsCount: Array.isArray(report.errors) ? report.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function summarizeGeneratedDomainMaterializationInspectionSourceResolutionForDebug(
  resolution,
) {
  if (!resolution || typeof resolution !== 'object') {
    return {
      present: false,
      resolved: false,
      source: 'none',
    }
  }

  const warningSummary = summarizeDebugEntries(resolution.warnings)
  const errorSummary = summarizeDebugEntries(resolution.errors)

  return {
    present: resolution.present === true,
    resolved: resolution.resolved === true,
    source:
      typeof resolution.source === 'string' && resolution.source.trim()
        ? resolution.source.trim()
        : 'none',
    behaviorChanged: resolution.behaviorChanged === true,
    candidatePreferred: resolution.candidatePreferred === true,
    legacyUsedAsFallback: resolution.legacyUsedAsFallback === true,
    materializationPlanChanged:
      resolution.runtime?.materializationPlanChanged === true,
    executionScopeChanged: resolution.runtime?.executionScopeChanged === true,
    candidateStatus:
      typeof resolution.inputs?.candidateStatus === 'string' &&
      resolution.inputs.candidateStatus.trim()
        ? resolution.inputs.candidateStatus.trim()
        : 'not-available',
    comparisonStatus:
      typeof resolution.inputs?.candidateComparisonStatus === 'string' &&
      resolution.inputs.candidateComparisonStatus.trim()
        ? resolution.inputs.candidateComparisonStatus.trim()
        : 'not-available',
    approvalStatus:
      typeof resolution.inputs?.approvalPolicyStatus === 'string' &&
      resolution.inputs.approvalPolicyStatus.trim()
        ? resolution.inputs.approvalPolicyStatus.trim()
        : 'not-available',
    recommendedAction:
      typeof resolution.recommendation?.action === 'string' &&
      resolution.recommendation.action.trim()
        ? resolution.recommendation.action.trim()
        : 'observe',
    warningsCount: Array.isArray(resolution.warnings) ? resolution.warnings.length : 0,
    errorsCount: Array.isArray(resolution.errors) ? resolution.errors.length : 0,
    ...(warningSummary.firstEntry ? { firstWarning: warningSummary.firstEntry } : {}),
    ...(errorSummary.firstEntry ? { firstError: errorSummary.firstEntry } : {}),
  }
}

function resolveGeneratedDomainMaterializationSource({
  materializationPlan,
  generatedDomainMaterializationShadowPlan,
  generatedDomainMaterializationPreferenceSwitch,
  generatedDomainMaterializationSwitchReadinessReport,
  generatedDomainMaterializationPreferenceDecision,
  domainConsistencyDiagnostics,
  sourceResolutionOptions,
}) {
  const emptyResolution = {
    present: false,
    evaluated: false,
    resolved: false,
    source: 'none',
    mode: 'runtime-disabled',
    behaviorChanged: false,
    runtime: {
      switchEnabled: false,
      selectedSource: 'none',
      materializationPlanChanged: false,
      executionScopeChanged: false,
    },
    testProjection: {
      wouldSelectShadow: false,
      projectedSource: 'none',
      reason: '',
    },
    inputs: {
      materializationPlanPresent: false,
      shadowPlanBuilt: false,
      switchEnabled: false,
      readinessStatus: null,
      switchMode: null,
      domainConsistencyStatus: null,
      semanticStatus: null,
    },
    safeguards: {
      requiresExplicitEnable: true,
      requiresDomainConsistency: true,
      requiresReadiness: true,
      requiresNoBlockingErrors: true,
      allowsRuntimeMutation: false,
    },
    recommendation: {
      action: 'observe',
      reason: '',
      nextSafeStep: '',
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const shadowPlan =
    generatedDomainMaterializationShadowPlan &&
    typeof generatedDomainMaterializationShadowPlan === 'object'
      ? generatedDomainMaterializationShadowPlan
      : null
  const preferenceSwitch =
    generatedDomainMaterializationPreferenceSwitch &&
    typeof generatedDomainMaterializationPreferenceSwitch === 'object'
      ? generatedDomainMaterializationPreferenceSwitch
      : null
  const readinessReport =
    generatedDomainMaterializationSwitchReadinessReport &&
    typeof generatedDomainMaterializationSwitchReadinessReport === 'object'
      ? generatedDomainMaterializationSwitchReadinessReport
      : null
  const preferenceDecision =
    generatedDomainMaterializationPreferenceDecision &&
    typeof generatedDomainMaterializationPreferenceDecision === 'object'
      ? generatedDomainMaterializationPreferenceDecision
      : null
  const consistency =
    domainConsistencyDiagnostics && typeof domainConsistencyDiagnostics === 'object'
      ? domainConsistencyDiagnostics
      : null

  if (
    !shadowPlan &&
    !preferenceSwitch &&
    !readinessReport &&
    !preferenceDecision &&
    !consistency &&
    !(materializationPlan && typeof materializationPlan === 'object')
  ) {
    return emptyResolution
  }

  try {
    const warnings = []
    const errors = []
    const testEnabled = sourceResolutionOptions?.testEnabled === true
    const materializationPlanPresent = Boolean(
      materializationPlan && typeof materializationPlan === 'object',
    )
    const shadowPlanBuilt = shadowPlan?.built === true
    const readinessStatus =
      typeof readinessReport?.status === 'string' && readinessReport.status.trim()
        ? readinessReport.status.trim()
        : null
    const switchMode =
      typeof preferenceSwitch?.mode === 'string' && preferenceSwitch.mode.trim()
        ? preferenceSwitch.mode.trim()
        : testEnabled
          ? 'test-enabled'
          : 'runtime-disabled'
    const domainConsistencyStatus =
      typeof consistency?.status === 'string' && consistency.status.trim()
        ? consistency.status.trim()
        : null
    const semanticStatus =
      typeof consistency?.semanticStatus === 'string' && consistency.semanticStatus.trim()
        ? consistency.semanticStatus.trim()
        : null
    const switchEnabled = testEnabled || preferenceSwitch?.enabled === true
    const runtimeSelectedSource = materializationPlanPresent
      ? typeof preferenceSwitch?.actual?.selectedSource === 'string' &&
        ['current', 'legacy'].includes(
          preferenceSwitch.actual.selectedSource.trim(),
        )
        ? preferenceSwitch.actual.selectedSource.trim()
        : 'legacy'
      : 'none'
    const domainConsistent =
      domainConsistencyStatus === 'consistent' &&
      (semanticStatus === null || semanticStatus === 'consistent')
    const domainBlocked =
      domainConsistencyStatus === 'mismatch' ||
      domainConsistencyStatus === 'error' ||
      semanticStatus === 'mismatch' ||
      semanticStatus === 'error'
    const readinessBlocked =
      readinessStatus === 'blocked' ||
      readinessReport?.blockers?.domainMismatch === true ||
      readinessReport?.blockers?.diffDivergent === true ||
      readinessReport?.blockers?.switchAlreadyEnabled === true ||
      readinessReport?.blockers?.errorsPresent === true
    const readinessAllowsShadow =
      readinessStatus === 'ready-for-test-harness' ||
      readinessStatus === 'ready-for-controlled-enable'
    const hasBlockingErrors =
      (shadowPlan?.errorsCount || 0) > 0 ||
      (preferenceSwitch?.errorsCount || 0) > 0 ||
      (readinessReport?.errorsCount || 0) > 0 ||
      (preferenceDecision?.errorsCount || 0) > 0 ||
      (consistency?.errorsCount || 0) > 0
    const dryRunWouldPreferShadow =
      preferenceDecision?.dryRun?.wouldPreferShadow === true
    const canProjectShadow =
      testEnabled &&
      shadowPlanBuilt &&
      readinessAllowsShadow &&
      domainConsistent &&
      dryRunWouldPreferShadow &&
      !readinessBlocked &&
      !hasBlockingErrors

    let source = runtimeSelectedSource
    let projectedSource = runtimeSelectedSource
    let recommendation = {
      action: materializationPlanPresent ? 'keep-current' : 'observe',
      reason: materializationPlanPresent
        ? 'El runtime actual debe seguir usando la fuente actual mientras el switch real permanezca apagado.'
        : 'Todavia no hay una fuente materializable activa para resolver en runtime.',
      nextSafeStep: materializationPlanPresent
        ? 'Mantener la fuente actual y seguir acumulando evidencia antes de un cambio real.'
        : 'Seguir observando el shadow plan y el readiness report antes de pensar en una activacion futura.',
    }

    if (!materializationPlanPresent) {
      pushUniqueMessage(
        warnings,
        'No hay materializationPlan real activo; el runtime sigue sin una fuente materializable disponible.',
      )
    }
    if (!shadowPlanBuilt) {
      pushUniqueMessage(
        warnings,
        'El shadow plan universal todavia no esta construido, asi que no puede proyectarse como fuente futura.',
      )
    }
    if (!readinessAllowsShadow && readinessStatus && readinessStatus !== 'blocked') {
      pushUniqueMessage(
        warnings,
        'El readiness report todavia no habilita una proyeccion segura hacia generated-domain-shadow.',
      )
    }
    if (domainBlocked) {
      pushUniqueMessage(
        warnings,
        'La consistencia de dominio no permite proyectar generated-domain-shadow como fuente candidata.',
      )
    }

    if (domainBlocked || readinessBlocked || hasBlockingErrors) {
      projectedSource = testEnabled ? 'blocked' : runtimeSelectedSource
      source = testEnabled ? 'blocked' : runtimeSelectedSource
      recommendation = {
        action: 'investigate',
        reason:
          'Hay bloqueos estructurales o de consistencia que impiden resolver una fuente shadow segura, incluso en test harness.',
        nextSafeStep:
          'Investigar los bloqueos antes de intentar una proyeccion o una activacion controlada del switch.',
      }
    } else if (canProjectShadow) {
      projectedSource = 'generated-domain-shadow'
      source = 'generated-domain-shadow'
      recommendation = {
        action: 'test-harness-only',
        reason:
          'En modo test-enabled, la evidencia actual alcanza para proyectar generated-domain-shadow sin mutar el runtime real.',
        nextSafeStep:
          'Mantener esta resolucion solo en harness y sumar validaciones antes de cualquier enable controlado.',
      }
    } else if (testEnabled && materializationPlanPresent) {
      projectedSource = runtimeSelectedSource
      source = runtimeSelectedSource
      recommendation = {
        action: 'keep-current',
        reason:
          'Aun en test-enabled, la resolucion debe conservar la fuente actual porque la evidencia shadow no alcanza.',
        nextSafeStep:
          'Seguir observando readiness y consistencia antes de proyectar generated-domain-shadow.',
      }
    }

    return {
      ...emptyResolution,
      present: true,
      evaluated:
        materializationPlanPresent ||
        shadowPlanBuilt ||
        preferenceSwitch?.evaluated === true ||
        readinessReport?.evaluated === true ||
        preferenceDecision?.evaluated === true ||
        consistency?.checked === true,
      resolved:
        materializationPlanPresent ||
        shadowPlanBuilt ||
        preferenceSwitch?.present === true ||
        readinessReport?.present === true,
      source,
      mode: testEnabled ? 'test-enabled' : 'runtime-disabled',
      runtime: {
        switchEnabled,
        selectedSource: runtimeSelectedSource,
        materializationPlanChanged: false,
        executionScopeChanged: false,
      },
      testProjection: {
        wouldSelectShadow: projectedSource === 'generated-domain-shadow',
        projectedSource,
        reason:
          projectedSource === 'generated-domain-shadow'
            ? 'La proyeccion de test habilita generated-domain-shadow sin mutar el runtime real.'
            : projectedSource === 'blocked'
              ? 'La proyeccion de test queda bloqueada por readiness, consistencia o errores observacionales.'
              : materializationPlanPresent
                ? 'La proyeccion sigue conservando la fuente actual porque no hay evidencia suficiente para shadow.'
                : 'No hay fuente materializable disponible para una proyeccion distinta en esta fase.',
      },
      inputs: {
        materializationPlanPresent,
        shadowPlanBuilt,
        switchEnabled,
        readinessStatus,
        switchMode,
        domainConsistencyStatus,
        semanticStatus,
      },
      recommendation,
      warnings,
      errors,
      warningsCount: warnings.length,
      errorsCount: errors.length,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyResolution,
      present: true,
      evaluated: true,
      resolved: false,
      source: 'blocked',
      mode: sourceResolutionOptions?.testEnabled === true ? 'test-enabled' : 'runtime-disabled',
      recommendation: {
        action: 'investigate',
        reason:
          'La resolucion observacional de fuente de materializacion devolvio un error interno.',
        nextSafeStep:
          'Mantener runtime current/legacy sin cambios y revisar el resolver antes de usarlo como base futura.',
      },
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildGeneratedDomainControlledEnablePolicy({
  generatedDomainMaterializationPreferenceSwitch,
  generatedDomainMaterializationSwitchReadinessReport,
  generatedDomainMaterializationSourceResolution,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainShadowMaterializationEndToEndReadiness,
  generatedDomainMaterializationShadowDiff,
  domainConsistencyDiagnostics,
  materializationPlan,
}) {
  const emptyPolicy = {
    present: false,
    evaluated: false,
    status: 'not-ready',
    source: 'generated-domain-shadow-enable-policy',
    behaviorChanged: false,
    runtimeEnabled: false,
    eligibility: {
      hasLegacyMaterializationPlan: false,
      hasShadowCandidate: false,
      candidateUsableByFutureSwitch: false,
      endToEndReadyForHarness: false,
      sourceResolutionCanProjectShadow: false,
      domainConsistencyOk: false,
      diffAligned: false,
      noBlockingErrors: false,
    },
    blockers: {
      missingLegacyMaterializationPlan: true,
      missingShadowCandidate: true,
      candidateNotUsable: true,
      endToEndNotReady: true,
      domainMismatch: false,
      diffNotAligned: true,
      blockingErrors: false,
      runtimeEnableNotAllowed: true,
    },
    allowedModes: {
      observeOnly: true,
      testHarnessEnable: false,
      controlledRuntimeEnable: false,
    },
    recommendation: {
      action: 'observe',
      reason: '',
      nextSafeStep: '',
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const preferenceSwitch =
    generatedDomainMaterializationPreferenceSwitch &&
    typeof generatedDomainMaterializationPreferenceSwitch === 'object'
      ? generatedDomainMaterializationPreferenceSwitch
      : null
  const readinessReport =
    generatedDomainMaterializationSwitchReadinessReport &&
    typeof generatedDomainMaterializationSwitchReadinessReport === 'object'
      ? generatedDomainMaterializationSwitchReadinessReport
      : null
  const sourceResolution =
    generatedDomainMaterializationSourceResolution &&
    typeof generatedDomainMaterializationSourceResolution === 'object'
      ? generatedDomainMaterializationSourceResolution
      : null
  const candidatePlan =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null
  const endToEndReadiness =
    generatedDomainShadowMaterializationEndToEndReadiness &&
    typeof generatedDomainShadowMaterializationEndToEndReadiness === 'object'
      ? generatedDomainShadowMaterializationEndToEndReadiness
      : null
  const shadowDiff =
    generatedDomainMaterializationShadowDiff &&
    typeof generatedDomainMaterializationShadowDiff === 'object'
      ? generatedDomainMaterializationShadowDiff
      : null
  const consistency =
    domainConsistencyDiagnostics && typeof domainConsistencyDiagnostics === 'object'
      ? domainConsistencyDiagnostics
      : null

  if (
    !preferenceSwitch &&
    !readinessReport &&
    !sourceResolution &&
    !candidatePlan &&
    !endToEndReadiness &&
    !shadowDiff &&
    !consistency &&
    !(materializationPlan && typeof materializationPlan === 'object')
  ) {
    return emptyPolicy
  }

  try {
    const warnings = []
    const errors = []
    const hasLegacyMaterializationPlan = Boolean(
      materializationPlan && typeof materializationPlan === 'object',
    )
    const hasShadowCandidate = candidatePlan?.present === true
    const candidateUsableByFutureSwitch =
      candidatePlan?.compatibility?.canBeUsedByFutureSwitch === true
    const endToEndReadyForHarness =
      endToEndReadiness?.status === 'ready-for-test-harness'
    const sourceResolutionCanProjectShadow =
      (sourceResolution?.testProjection?.wouldSelectShadow === true &&
        sourceResolution?.testProjection?.projectedSource ===
          'generated-domain-shadow') ||
      endToEndReadiness?.pipeline?.sourceResolutionProjectsShadowInTest === true
    const domainConsistencyOk =
      consistency?.status === 'consistent' &&
      (consistency?.semanticStatus === null ||
        consistency?.semanticStatus === undefined ||
        consistency?.semanticStatus === 'consistent')
    const diffAligned =
      shadowDiff?.status === 'compared' ||
      shadowDiff?.recommendation?.action === 'prepare-preference-switch'
    const noBlockingErrors =
      (preferenceSwitch?.errorsCount || 0) === 0 &&
      (readinessReport?.errorsCount || 0) === 0 &&
      (sourceResolution?.errorsCount || 0) === 0 &&
      (candidatePlan?.errorsCount || 0) === 0 &&
      (endToEndReadiness?.errorsCount || 0) === 0 &&
      (shadowDiff?.errorsCount || 0) === 0 &&
      (consistency?.errorsCount || 0) === 0
    const domainMismatch =
      consistency?.status === 'mismatch' ||
      consistency?.status === 'error' ||
      consistency?.semanticStatus === 'mismatch' ||
      consistency?.semanticStatus === 'error'
    const candidateBlocked =
      candidatePlan?.status === 'blocked' ||
      candidatePlan?.status === 'error' ||
      candidateUsableByFutureSwitch !== true
    const endToEndNotReady = !endToEndReadyForHarness
    const diffNotAligned = !diffAligned
    const blockingErrors = !noBlockingErrors

    const policy = {
      ...emptyPolicy,
      present: true,
      evaluated:
        hasLegacyMaterializationPlan ||
        hasShadowCandidate ||
        Boolean(readinessReport?.evaluated === true) ||
        Boolean(sourceResolution?.resolved === true) ||
        Boolean(endToEndReadiness?.evaluated === true),
      eligibility: {
        hasLegacyMaterializationPlan,
        hasShadowCandidate,
        candidateUsableByFutureSwitch,
        endToEndReadyForHarness,
        sourceResolutionCanProjectShadow,
        domainConsistencyOk,
        diffAligned,
        noBlockingErrors,
      },
      blockers: {
        missingLegacyMaterializationPlan: !hasLegacyMaterializationPlan,
        missingShadowCandidate: !hasShadowCandidate,
        candidateNotUsable: !candidateUsableByFutureSwitch,
        endToEndNotReady,
        domainMismatch,
        diffNotAligned,
        blockingErrors,
        runtimeEnableNotAllowed: true,
      },
      allowedModes: {
        observeOnly: true,
        testHarnessEnable:
          hasShadowCandidate &&
          candidateUsableByFutureSwitch &&
          endToEndReadyForHarness &&
          sourceResolutionCanProjectShadow &&
          domainConsistencyOk &&
          diffAligned &&
          noBlockingErrors,
        controlledRuntimeEnable: false,
      },
      recommendation: {
        action: 'observe',
        reason:
          'La policy sigue siendo observacional y define una frontera conservadora antes de cualquier enable real.',
        nextSafeStep:
          'Mantener el runtime actual y seguir validando la cadena shadow por harness.',
      },
      warnings,
      errors,
    }

    if (!hasLegacyMaterializationPlan) {
      pushUniqueMessage(
        warnings,
        'Todavia no hay materializationPlan legacy comparable, por lo que un enable controlado real no puede considerarse listo.',
      )
    }
    if (!hasShadowCandidate) {
      pushUniqueMessage(
        warnings,
        'Todavia no existe un shadow candidate suficiente para respaldar una politica de enable.',
      )
    }
    if (!candidateUsableByFutureSwitch) {
      pushUniqueMessage(
        warnings,
        'El shadow candidate aun no es usable por un future switch, asi que la politica debe mantenerse conservadora.',
      )
    }
    if (!endToEndReadyForHarness) {
      pushUniqueMessage(
        warnings,
        'El pipeline shadow end-to-end todavia no esta listo para harness, por lo que la politica no puede escalar.',
      )
    }
    if (domainMismatch) {
      pushUniqueMessage(
        warnings,
        'La consistencia de dominio sigue mostrando un mismatch, por lo que cualquier enable futuro debe bloquearse.',
      )
    }
    if (diffNotAligned) {
      pushUniqueMessage(
        warnings,
        'El diff observacional todavia no esta lo bastante alineado para una politica de enable mas fuerte.',
      )
    }
    if (blockingErrors) {
      pushUniqueMessage(
        warnings,
        'La politica detecta errores bloqueantes en los diagnostics previos, por lo que debe mantenerse en modo observacional.',
      )
    }

    if (domainMismatch || candidatePlan?.status === 'blocked' || blockingErrors) {
      policy.status = 'blocked'
      policy.recommendation = {
        action: 'investigate',
        reason:
          'Hay bloqueos estructurales o de consistencia que impiden definir una politica segura de enable futuro.',
        nextSafeStep:
          'Investigar candidate, consistencia o errores antes de acercar cualquier enable controlado.',
      }
    } else if (!hasLegacyMaterializationPlan || !hasShadowCandidate || !candidateUsableByFutureSwitch) {
      policy.status = 'not-ready'
      policy.recommendation = {
        action: 'observe',
        reason:
          'Falta evidencia estructural minima para pensar en una politica de enable mas fuerte.',
        nextSafeStep:
          'Seguir acumulando materializationPlan legacy comparable y un candidate plenamente usable.',
      }
    } else if (
      hasLegacyMaterializationPlan &&
      hasShadowCandidate &&
      candidateUsableByFutureSwitch &&
      endToEndReadyForHarness &&
      sourceResolutionCanProjectShadow &&
      domainConsistencyOk &&
      diffAligned &&
      noBlockingErrors
    ) {
      policy.status = 'eligible-for-controlled-runtime-enable'
      policy.recommendation = {
        action: 'prepare-runtime-enable-review',
        reason:
          'La evidencia observacional ya es suficientemente fuerte para preparar una revision formal de runtime enable, sin activarlo todavia.',
        nextSafeStep:
          'Hacer una revision controlada de riesgos y fallback antes de cualquier cambio real de runtime.',
      }
    } else if (policy.allowedModes.testHarnessEnable) {
      policy.status = 'eligible-for-test-enable'
      policy.recommendation = {
        action: 'allow-test-harness-enable',
        reason:
          'La policy permite seguir usando solo harness para ensayar la proyeccion shadow, sin tocar el runtime real.',
        nextSafeStep:
          'Mantener el uso en harness y ampliar las validaciones antes de una revision mas fuerte.',
      }
    } else {
      policy.status = 'not-ready'
    }

    policy.warningsCount = policy.warnings.length
    policy.errorsCount = policy.errors.length
    return policy
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyPolicy,
      present: true,
      evaluated: true,
      status: 'error',
      recommendation: {
        action: 'investigate',
        reason: 'La policy observacional de controlled enable devolvio un error interno.',
        nextSafeStep: 'Revisar la policy y mantener el runtime actual sin cambios.',
      },
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildGeneratedDomainFirstControlledEnableScenario({
  generatedDomainControlledEnablePolicy,
  generatedDomainMaterializationPreferenceSwitch,
  generatedDomainMaterializationSourceResolution,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainShadowMaterializationEndToEndReadiness,
  domainConsistencyDiagnostics,
  materializationPlan,
}) {
  const emptyScenario = {
    present: false,
    evaluated: false,
    status: 'not-ready',
    source: 'generated-domain-first-controlled-enable-scenario',
    behaviorChanged: false,
    allowedNow: false,
    requiresLeanApproval: true,
    conditions: {
      fullstackLocalOnly: false,
      hasLegacyMaterializationPlan: false,
      hasShadowCandidate: false,
      candidateUsableByFutureSwitch: false,
      domainConsistencyOk: false,
      semanticConsistencyOk: false,
      diffAligned: false,
      noErrors: false,
      noDotEnv: false,
      noNodeModules: false,
      noDocker: false,
      noDeploy: false,
      noExternalServices: false,
      noRealPayments: false,
      noCommands: false,
      noFileWrites: false,
      noWebPrueba: false,
      runtimeEnabled: false,
      controlledRuntimeEnable: false,
    },
    blockers: {
      notFullstackLocal: true,
      missingLegacyMaterializationPlan: true,
      missingShadowCandidate: true,
      candidateNotUsable: true,
      domainMismatch: false,
      semanticMismatch: false,
      diffNotAligned: true,
      blockingErrors: false,
      runtimeEnableStillForbidden: true,
      leanApprovalRequired: true,
    },
    recommendation: {
      action: 'observe',
      reason: '',
      nextSafeStep: '',
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const collectStrings = (value, target = []) => {
    if (typeof value === 'string') {
      target.push(value)
      return target
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        collectStrings(entry, target)
      }
      return target
    }
    if (value && typeof value === 'object') {
      for (const nestedValue of Object.values(value)) {
        collectStrings(nestedValue, target)
      }
    }
    return target
  }

  const controlledEnablePolicy =
    generatedDomainControlledEnablePolicy &&
    typeof generatedDomainControlledEnablePolicy === 'object'
      ? generatedDomainControlledEnablePolicy
      : null
  const preferenceSwitch =
    generatedDomainMaterializationPreferenceSwitch &&
    typeof generatedDomainMaterializationPreferenceSwitch === 'object'
      ? generatedDomainMaterializationPreferenceSwitch
      : null
  const sourceResolution =
    generatedDomainMaterializationSourceResolution &&
    typeof generatedDomainMaterializationSourceResolution === 'object'
      ? generatedDomainMaterializationSourceResolution
      : null
  const candidatePlan =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null
  const endToEndReadiness =
    generatedDomainShadowMaterializationEndToEndReadiness &&
    typeof generatedDomainShadowMaterializationEndToEndReadiness === 'object'
      ? generatedDomainShadowMaterializationEndToEndReadiness
      : null
  const consistency =
    domainConsistencyDiagnostics && typeof domainConsistencyDiagnostics === 'object'
      ? domainConsistencyDiagnostics
      : null

  if (
    !controlledEnablePolicy &&
    !preferenceSwitch &&
    !sourceResolution &&
    !candidatePlan &&
    !endToEndReadiness &&
    !(materializationPlan && typeof materializationPlan === 'object')
  ) {
    return emptyScenario
  }

  try {
    const warnings = []
    const errors = []
    const candidateStrings = collectStrings(candidatePlan?.candidate).map((value) =>
      value.toLocaleLowerCase(),
    )
    const deliveryLevel =
      typeof candidatePlan?.candidate?.deliveryLevel === 'string' &&
      candidatePlan.candidate.deliveryLevel.trim()
        ? candidatePlan.candidate.deliveryLevel.trim()
        : null
    const hasLegacyMaterializationPlan = Boolean(
      materializationPlan && typeof materializationPlan === 'object',
    )
    const hasShadowCandidate = candidatePlan?.present === true
    const candidateUsableByFutureSwitch =
      candidatePlan?.compatibility?.canBeUsedByFutureSwitch === true
    const fullstackLocalOnly = deliveryLevel === 'fullstack-local'
    const domainConsistencyOk = consistency?.status === 'consistent'
    const semanticConsistencyOk =
      consistency?.semanticStatus === 'consistent' ||
      consistency?.semanticStatus === null ||
      consistency?.semanticStatus === undefined
    const diffAligned =
      controlledEnablePolicy?.eligibility?.diffAligned === true &&
      endToEndReadiness?.pipeline?.candidateInspectable === true
    const noErrors =
      (controlledEnablePolicy?.errorsCount || 0) === 0 &&
      (candidatePlan?.errorsCount || 0) === 0 &&
      (endToEndReadiness?.errorsCount || 0) === 0 &&
      (consistency?.errorsCount || 0) === 0
    const noCommands =
      endToEndReadiness?.safeguards?.noCommands === true &&
      !candidateStrings.some((value) => /\b(?:npm install|docker|deploy)\b/iu.test(value))
    const noFileWrites = endToEndReadiness?.safeguards?.noFileWrites === true
    const noWebPrueba = endToEndReadiness?.safeguards?.noWebPrueba === true
    const noDotEnv = !candidateStrings.some((value) => value.includes('.env'))
    const noNodeModules = !candidateStrings.some((value) => value.includes('node_modules'))
    const noDocker = !candidateStrings.some((value) => value.includes('docker'))
    const noDeploy = !candidateStrings.some((value) => /\bdeploy\b/iu.test(value))
    const noExternalServices =
      candidatePlan?.candidate?.safety?.forbidsExternalServices === true
    const noRealPayments =
      candidatePlan?.candidate?.safety?.forbidsRealPayments === true
    const runtimeEnabled = controlledEnablePolicy?.runtimeEnabled === true
    const controlledRuntimeEnable =
      controlledEnablePolicy?.allowedModes?.controlledRuntimeEnable === true
    const canProjectShadowInHarness =
      sourceResolution?.testProjection?.projectedSource === 'generated-domain-shadow' ||
      endToEndReadiness?.pipeline?.sourceResolutionProjectsShadowInTest === true ||
      controlledEnablePolicy?.eligibility?.sourceResolutionCanProjectShadow === true
    const blockingErrors = !noErrors
    const domainMismatch =
      consistency?.status === 'mismatch' || consistency?.status === 'error'
    const semanticMismatch =
      consistency?.semanticStatus === 'mismatch' ||
      consistency?.semanticStatus === 'error'

    const scenario = {
      ...emptyScenario,
      present: true,
      evaluated:
        controlledEnablePolicy?.evaluated === true ||
        candidatePlan?.present === true ||
        endToEndReadiness?.evaluated === true ||
        sourceResolution?.resolved === true ||
        hasLegacyMaterializationPlan,
      conditions: {
        fullstackLocalOnly,
        hasLegacyMaterializationPlan,
        hasShadowCandidate,
        candidateUsableByFutureSwitch,
        domainConsistencyOk,
        semanticConsistencyOk,
        diffAligned,
        noErrors,
        noDotEnv,
        noNodeModules,
        noDocker,
        noDeploy,
        noExternalServices,
        noRealPayments,
        noCommands,
        noFileWrites,
        noWebPrueba,
        runtimeEnabled,
        controlledRuntimeEnable,
      },
      blockers: {
        notFullstackLocal: !fullstackLocalOnly,
        missingLegacyMaterializationPlan: !hasLegacyMaterializationPlan,
        missingShadowCandidate: !hasShadowCandidate,
        candidateNotUsable: !candidateUsableByFutureSwitch,
        domainMismatch,
        semanticMismatch,
        diffNotAligned: !diffAligned,
        blockingErrors,
        runtimeEnableStillForbidden: true,
        leanApprovalRequired: true,
      },
      recommendation: {
        action: 'observe',
        reason:
          'El primer escenario real de enable sigue siendo solo una frontera observacional y requiere aprobacion manual antes de existir como runtime.',
        nextSafeStep:
          'Mantener el escenario como diagnostico y seguir ensayandolo en harness sin tocar el runtime normal.',
      },
      warnings,
      errors,
    }

    if (!fullstackLocalOnly) {
      pushUniqueMessage(
        warnings,
        'El primer escenario controlado futuro deberia limitarse a fullstack-local seguro y todavia no cumple esa condicion.',
      )
    }
    if (!hasLegacyMaterializationPlan) {
      pushUniqueMessage(
        warnings,
        'Sin materializationPlan legacy comparable no corresponde evaluar un primer enable real futuro.',
      )
    }
    if (!candidateUsableByFutureSwitch) {
      pushUniqueMessage(
        warnings,
        'El shadow candidate todavia no es usable por un future switch, por lo que el escenario debe seguir cerrado.',
      )
    }
    if (domainMismatch || semanticMismatch) {
      pushUniqueMessage(
        warnings,
        'La consistencia de dominio o la consistencia semantica siguen bloqueando cualquier escenario de enable real futuro.',
      )
    }
    if (!noCommands || !noFileWrites || !noWebPrueba || !noDotEnv || !noNodeModules) {
      pushUniqueMessage(
        errors,
        'El escenario controlado detecto senales incompatibles con un primer enable ultra acotado: commands, writes, web-prueba, .env o node_modules.',
      )
    }
    if (runtimeEnabled || controlledRuntimeEnable) {
      pushUniqueMessage(
        errors,
        'El primer escenario controlado no debe activar runtimeEnabled ni controlledRuntimeEnable en esta fase observacional.',
      )
    }

    if (
      domainMismatch ||
      semanticMismatch ||
      !noCommands ||
      !noFileWrites ||
      !noWebPrueba ||
      !noDotEnv ||
      !noNodeModules ||
      !noDocker ||
      !noDeploy ||
      !noExternalServices ||
      !noRealPayments ||
      blockingErrors ||
      runtimeEnabled ||
      controlledRuntimeEnable
    ) {
      scenario.status = 'blocked'
      scenario.recommendation = {
        action: 'investigate',
        reason:
          'El primer escenario real futuro todavia tiene bloqueos de seguridad, consistencia o alcance que impiden siquiera pedir habilitacion.',
        nextSafeStep:
          'Investigar candidate, policy o consistency antes de elevar este escenario a revision manual.',
      }
    } else if (
      fullstackLocalOnly &&
      hasLegacyMaterializationPlan &&
      hasShadowCandidate &&
      candidateUsableByFutureSwitch &&
      domainConsistencyOk &&
      semanticConsistencyOk &&
      diffAligned &&
      noErrors &&
      noCommands &&
      noFileWrites &&
      noWebPrueba &&
      noDotEnv &&
      noNodeModules &&
      noDocker &&
      noDeploy &&
      noExternalServices &&
      noRealPayments &&
      endToEndReadiness?.status === 'ready-for-test-harness' &&
      controlledEnablePolicy?.status === 'eligible-for-controlled-runtime-enable' &&
      canProjectShadowInHarness
    ) {
      scenario.status = 'ready-for-review'
      scenario.recommendation = {
        action: 'request-lean-approval',
        reason:
          'La evidencia observacional ya describe un primer escenario ultra acotado que podria revisarse manualmente antes de cualquier enable real.',
        nextSafeStep:
          'Presentar este escenario a Lean con riesgos, fallback y alcance estrictamente acotado antes de pensar en un enable real interno.',
      }
    } else {
      scenario.status = 'not-ready'
    }

    scenario.warningsCount = scenario.warnings.length
    scenario.errorsCount = scenario.errors.length
    return scenario
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyScenario,
      present: true,
      evaluated: true,
      status: 'error',
      recommendation: {
        action: 'investigate',
        reason: 'El escenario controlado del primer enable real devolvio un error interno.',
        nextSafeStep: 'Mantener el runtime actual sin cambios y revisar el diagnostico.',
      },
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildGeneratedDomainMaterializationApprovalPayload({
  generatedDomainFileCreationApprovalPolicy,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainUniversalMaterializationPlanPreviewComparison,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainMaterializationInspectionSourceResolution,
  generatedDomainStructuralCapabilities,
}) {
  const emptyPayload = {
    present: false,
    evaluated: false,
    status: 'not-ready',
    source: 'generated-domain-materialization-approval-payload',
    behaviorChanged: false,
    approvalRequired: true,
    approved: false,
    allowedNow: false,
    requiresLeanApproval: true,
    review: {
      root: null,
      sourceRoot: null,
      targetRoot: null,
      pathsPreview: [],
      filesPreview: [],
      directoriesPreview: [],
      forbiddenPaths: [],
      excludedTargets: [],
      affectedAreas: [],
      fileCounts: {
        total: 0,
        files: 0,
        directories: 0,
      },
    },
    evidence: {
      previewStatus: null,
      previewComparisonStatus: null,
      approvalPolicyStatus: null,
      candidateStatus: null,
      inspectionSource: 'none',
      safeLocalMaterialization: false,
    },
    validations: [],
    risks: [],
    blockedReasons: [],
    recommendation: {
      action: 'observe',
      reason: '',
      nextSafeStep: '',
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
    notExecutedDisclaimer:
      'No se ejecuto ninguna materializacion real: este payload solo prepara una revision manual futura.',
  }

  const approvalPolicy =
    generatedDomainFileCreationApprovalPolicy &&
    typeof generatedDomainFileCreationApprovalPolicy === 'object'
      ? generatedDomainFileCreationApprovalPolicy
      : null
  const preview =
    generatedDomainUniversalMaterializationPlanPreview &&
    typeof generatedDomainUniversalMaterializationPlanPreview === 'object'
      ? generatedDomainUniversalMaterializationPlanPreview
      : null
  const previewComparison =
    generatedDomainUniversalMaterializationPlanPreviewComparison &&
    typeof generatedDomainUniversalMaterializationPlanPreviewComparison === 'object'
      ? generatedDomainUniversalMaterializationPlanPreviewComparison
      : null
  const candidatePlan =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null
  const inspectionSourceResolution =
    generatedDomainMaterializationInspectionSourceResolution &&
    typeof generatedDomainMaterializationInspectionSourceResolution === 'object'
      ? generatedDomainMaterializationInspectionSourceResolution
      : null
  const structuralCapabilities =
    generatedDomainStructuralCapabilities &&
    typeof generatedDomainStructuralCapabilities === 'object'
      ? generatedDomainStructuralCapabilities
      : null

  if (
    !approvalPolicy &&
    !preview &&
    !previewComparison &&
    !candidatePlan &&
    !inspectionSourceResolution &&
    !structuralCapabilities
  ) {
    return emptyPayload
  }

  const normalizeReviewPath = (value, rootHint = '') => {
    const normalized = normalizeOptionalString(value)
    if (!normalized) {
      return ''
    }
    const candidate = normalizePathForComparison(normalized)
    if (!path.isAbsolute(candidate)) {
      return candidate
    }
    const normalizedRootHint = normalizePathForComparison(rootHint)
    if (!normalizedRootHint) {
      return candidate
    }
    const pathSegments = candidate.split('/').filter(Boolean)
    const rootSegments = normalizedRootHint.split('/').filter(Boolean)
    const rootBasename = rootSegments[rootSegments.length - 1] || normalizedRootHint
    const rootIndex = pathSegments.lastIndexOf(rootBasename)
    if (rootIndex === -1) {
      return candidate
    }
    return pathSegments.slice(rootIndex).join('/')
  }

  const pathLooksLikeFile = (value) => {
    const normalized = normalizeOptionalString(value)
    if (!normalized) {
      return false
    }
    const basename = normalized.split('/').filter(Boolean).pop() || ''
    if (!basename || basename === normalized) {
      return /\.[a-z0-9_-]+$/iu.test(basename)
    }
    return /\.[a-z0-9_-]+$/iu.test(basename)
  }

  try {
    const warnings = []
    const errors = []
    const blockedReasons = []
    const validations = []
    const risks = []
    const targetRoot =
      normalizeOptionalString(preview?.targetRoot) ||
      normalizeOptionalString(candidatePlan?.candidate?.targetRoot) ||
      normalizeOptionalString(approvalPolicy?.scope?.targetRoot) ||
      null
    const sourceRoot =
      normalizeOptionalString(preview?.sourceRoot) ||
      normalizeOptionalString(candidatePlan?.candidate?.sourceRoot) ||
      normalizeOptionalString(preview?.root) ||
      null
    const root =
      normalizeOptionalString(preview?.root) ||
      normalizeOptionalString(candidatePlan?.candidate?.root) ||
      normalizeOptionalString(targetRoot) ||
      null
    const combinedPreviewPaths = summarizeUniqueExecutorStrings(
      [
        ...(Array.isArray(approvalPolicy?.scope?.previewPaths)
          ? approvalPolicy.scope.previewPaths
          : []),
        ...(Array.isArray(preview?.allowedTargetPaths) ? preview.allowedTargetPaths : []),
      ].map((entry) => normalizeReviewPath(entry, targetRoot || root || '')),
      256,
    ).filter(Boolean)
    const filesPreview = combinedPreviewPaths.filter((entry) => pathLooksLikeFile(entry))
    const directoriesPreview = combinedPreviewPaths.filter(
      (entry) => !pathLooksLikeFile(entry),
    )
    const forbiddenPaths = summarizeUniqueExecutorStrings(
      combinedPreviewPaths.filter(
        (entry) =>
          path.isAbsolute(entry) ||
          entry.startsWith('../') ||
          /(^|\/)\.env(?:\..+)?($|\/)/iu.test(entry) ||
          /(^|\/)node_modules($|\/)/iu.test(entry) ||
          /(^|\/)web-prueba($|\/)/iu.test(entry) ||
          /(^|\/)(?:dockerfile|docker-compose\.yml|docker-compose\.yaml)($|\/)/iu.test(entry) ||
          /(^|\/)deploy($|\/)/iu.test(entry),
      ),
      64,
    )
    const excludedTargets = summarizeUniqueExecutorStrings(
      [
        ...(Array.isArray(preview?.forbiddenSignals) ? preview.forbiddenSignals : []),
        ...(approvalPolicy?.safeguards?.noDotEnv === true ? ['.env bloqueado'] : []),
        ...(approvalPolicy?.safeguards?.noNodeModules === true
          ? ['node_modules bloqueado']
          : []),
        ...(approvalPolicy?.safeguards?.noDocker === true ? ['Docker bloqueado'] : []),
        ...(approvalPolicy?.safeguards?.noDeploy === true ? ['deploy bloqueado'] : []),
        ...(approvalPolicy?.safeguards?.noExternalServices === true
          ? ['servicios externos reales bloqueados']
          : []),
        ...(approvalPolicy?.safeguards?.noRealPayments === true
          ? ['pagos reales bloqueados']
          : []),
        ...(approvalPolicy?.safeguards?.noWebPrueba === true
          ? ['web-prueba bloqueado']
          : []),
      ],
      32,
    )
    const affectedAreas = summarizeUniqueExecutorStrings(
      [
        ...(preview?.frontend?.present === true ? ['frontend'] : []),
        ...(preview?.backend?.present === true ? ['backend'] : []),
        ...(preview?.database?.present === true ? ['database'] : []),
        ...(preview?.shared?.present === true ? ['shared'] : []),
        ...(preview?.docs?.present === true ? ['docs'] : []),
        ...(preview?.scripts?.present === true ? ['scripts'] : []),
        ...(preview?.validation?.present === true ? ['validation'] : []),
        ...(structuralCapabilities?.capabilities?.hasReporting === true
          ? ['reporting']
          : []),
        ...(structuralCapabilities?.capabilities?.hasScheduling === true
          ? ['scheduling']
          : []),
        ...(structuralCapabilities?.capabilities?.hasInventory === true
          ? ['inventory']
          : []),
        ...(structuralCapabilities?.capabilities?.hasDocuments === true
          ? ['documents']
          : []),
        ...(structuralCapabilities?.capabilities?.hasMockPayments === true
          ? ['mock-payments']
          : []),
      ],
      24,
    )

    if (preview?.built === true) {
      pushUniqueMessage(validations, 'El universal materialization preview ya esta construido.')
    }
    if (previewComparison?.status === 'aligned') {
      pushUniqueMessage(
        validations,
        'La comparacion entre preview universal, candidate y legacy ya esta alineada.',
      )
    } else if (previewComparison?.status === 'partial') {
      pushUniqueMessage(
        validations,
        'La comparacion entre preview universal, candidate y legacy quedo parcial pero usable para observacion.',
      )
    }
    if (approvalPolicy?.safeguards?.noCommands === true) {
      pushUniqueMessage(validations, 'No hay commands ejecutables en el candidate ni en la policy.')
    }
    if (approvalPolicy?.safeguards?.noWritesExecuted === true) {
      pushUniqueMessage(validations, 'No se ejecuto ningun write real.')
    }
    if (approvalPolicy?.safeguards?.noWebPrueba === true) {
      pushUniqueMessage(validations, 'web-prueba sigue bloqueado por defecto.')
    }

    if (approvalPolicy?.approvalRequired === true) {
      pushUniqueMessage(
        risks,
        'Cualquier materializacion real sigue requiriendo aprobacion explicita de Lean.',
      )
    }
    if (forbiddenPaths.length > 0) {
      pushUniqueMessage(
        risks,
        'Hay paths o patrones que seguirian bloqueados para una materializacion real.',
      )
    }
    if (approvalPolicy?.status !== 'ready-for-manual-approval-review') {
      pushUniqueMessage(
        risks,
        'La policy de aprobacion todavia no esta lista para una revision manual de escritura real.',
      )
    }

    const payload = {
      ...emptyPayload,
      present: true,
      evaluated:
        preview?.present === true ||
        approvalPolicy?.evaluated === true ||
        previewComparison?.present === true ||
        candidatePlan?.present === true ||
        inspectionSourceResolution?.present === true,
      approvalRequired: approvalPolicy?.approvalRequired !== false,
      approved: approvalPolicy?.approved === true,
      review: {
        root,
        sourceRoot,
        targetRoot,
        pathsPreview: combinedPreviewPaths,
        filesPreview,
        directoriesPreview,
        forbiddenPaths,
        excludedTargets,
        affectedAreas,
        fileCounts: {
          total: combinedPreviewPaths.length,
          files: filesPreview.length,
          directories: directoriesPreview.length,
        },
      },
      evidence: {
        previewStatus: normalizeOptionalString(preview?.status) || null,
        previewComparisonStatus:
          normalizeOptionalString(previewComparison?.status) || null,
        approvalPolicyStatus: normalizeOptionalString(approvalPolicy?.status) || null,
        candidateStatus: normalizeOptionalString(candidatePlan?.status) || null,
        inspectionSource:
          normalizeOptionalString(inspectionSourceResolution?.source) || 'none',
        safeLocalMaterialization:
          preview?.safety?.safeForLocalMaterialization === true &&
          approvalPolicy?.safeguards?.withinAllowedRootOnly === true,
      },
      validations,
      risks,
      blockedReasons,
      warnings,
      errors,
      recommendation: {
        action: 'observe',
        reason:
          'El payload de aprobacion deja visible el alcance de una futura materializacion, pero no ejecuta nada real.',
        nextSafeStep:
          'Mantener la revision sobre paths, riesgos y exclusions antes de cualquier aprobacion manual.',
      },
    }

    if (approvalPolicy?.status === 'blocked' || forbiddenPaths.length > 0) {
      if (approvalPolicy?.blockers?.unsafePaths === true) {
        pushUniqueMessage(
          blockedReasons,
          'Los paths propuestos incluyen ubicaciones inseguras o bloqueadas.',
        )
      }
      if (approvalPolicy?.blockers?.forbiddenSignals === true) {
        pushUniqueMessage(
          blockedReasons,
          'Se detectaron señales incompatibles con una aprobacion segura.',
        )
      }
      if (forbiddenPaths.length > 0) {
        pushUniqueMessage(
          blockedReasons,
          'La revision de archivos sigue detectando rutas prohibidas (.env, node_modules, web-prueba, Docker o deploy).',
        )
      }
      payload.status = 'blocked'
      payload.recommendation = {
        action: 'investigate',
        reason:
          'El payload detecto rutas o señales bloqueantes para cualquier aprobacion manual de archivos.',
        nextSafeStep:
          'Corregir el candidate, la comparacion o los paths bloqueantes antes de volver a revisar el approval.',
      }
    } else if (
      approvalPolicy?.status === 'ready-for-manual-approval-review' &&
      preview?.built === true &&
      filesPreview.length > 0
    ) {
      payload.status = 'ready-for-review'
      payload.recommendation = {
        action: 'request-lean-approval',
        reason:
          'La revision de paths, candidate y comparaciones ya es suficientemente concreta para una aprobacion manual futura.',
        nextSafeStep:
          'Mostrar root, archivos, exclusiones y riesgos antes de cualquier write real.',
      }
    } else {
      payload.status = 'not-ready'
    }

    payload.warningsCount = payload.warnings.length
    payload.errorsCount = payload.errors.length
    return payload
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyPayload,
      present: true,
      evaluated: true,
      status: 'error',
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
      recommendation: {
        action: 'investigate',
        reason: 'El payload de aprobacion de materializacion devolvio un error interno.',
        nextSafeStep:
          'Mantener la materializacion real apagada y revisar el payload antes de cualquier approval.',
      },
    }
  }
}

function buildGeneratedDomainRuntimeShadowReadinessDecision({
  generatedDomainControlledEnablePolicy,
  generatedDomainFileCreationApprovalPolicy,
  generatedDomainFirstControlledEnableScenario,
  generatedDomainShadowMaterializationCandidatePlan,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainUniversalMaterializationPlanPreviewComparison,
  generatedDomainShadowCandidateLegacyComparison,
  domainConsistencyDiagnostics,
  generatedDomainMaterializationSourceResolution,
  generatedDomainShadowMaterializationEndToEndReadiness,
  generatedDomainMaterializationApprovalPayload,
}) {
  const emptyDecision = {
    present: false,
    evaluated: false,
    status: 'not-ready',
    source: 'generated-domain-runtime-shadow-readiness-decision',
    behaviorChanged: false,
    runtimeEnabled: false,
    controlledRuntimeEnable: false,
    requiresLeanApproval: true,
    readiness: {
      readyForHarness: false,
      readyForControlledRuntimeReview: false,
      approvalPayloadReady: false,
      runtimeNormalStillOff: true,
    },
    evidence: {
      controlledEnablePolicyStatus: null,
      fileCreationApprovalPolicyStatus: null,
      firstControlledScenarioStatus: null,
      candidateStatus: null,
      previewStatus: null,
      previewComparisonStatus: null,
      candidateLegacyComparisonStatus: null,
      domainConsistencyStatus: null,
      semanticStatus: null,
      sourceReal: 'none',
      sourceProjectedInTest: null,
      endToEndStatus: null,
    },
    safeguards: {
      sourceRealNotShadow: true,
      materializationPlanChanged: false,
      executionScopeChanged: false,
      noCommands: false,
      noWritesExecuted: false,
      noWebPrueba: false,
      approvalRequired: true,
      approved: false,
    },
    blockers: {
      domainMismatch: false,
      candidateBlocked: false,
      previewNotBuilt: true,
      previewComparisonNotAligned: true,
      candidateLegacyComparisonNotAligned: true,
      approvalPayloadNotReady: true,
      controlledPolicyNotReady: true,
      endToEndNotReady: true,
      runtimeNormalNotOff: false,
      leanApprovalRequired: true,
    },
    recommendation: {
      action: 'observe',
      reason: '',
      nextSafeStep: '',
    },
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const controlledEnablePolicy =
    generatedDomainControlledEnablePolicy &&
    typeof generatedDomainControlledEnablePolicy === 'object'
      ? generatedDomainControlledEnablePolicy
      : null
  const approvalPolicy =
    generatedDomainFileCreationApprovalPolicy &&
    typeof generatedDomainFileCreationApprovalPolicy === 'object'
      ? generatedDomainFileCreationApprovalPolicy
      : null
  const firstScenario =
    generatedDomainFirstControlledEnableScenario &&
    typeof generatedDomainFirstControlledEnableScenario === 'object'
      ? generatedDomainFirstControlledEnableScenario
      : null
  const candidatePlan =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null
  const preview =
    generatedDomainUniversalMaterializationPlanPreview &&
    typeof generatedDomainUniversalMaterializationPlanPreview === 'object'
      ? generatedDomainUniversalMaterializationPlanPreview
      : null
  const previewComparison =
    generatedDomainUniversalMaterializationPlanPreviewComparison &&
    typeof generatedDomainUniversalMaterializationPlanPreviewComparison === 'object'
      ? generatedDomainUniversalMaterializationPlanPreviewComparison
      : null
  const candidateComparison =
    generatedDomainShadowCandidateLegacyComparison &&
    typeof generatedDomainShadowCandidateLegacyComparison === 'object'
      ? generatedDomainShadowCandidateLegacyComparison
      : null
  const consistency =
    domainConsistencyDiagnostics && typeof domainConsistencyDiagnostics === 'object'
      ? domainConsistencyDiagnostics
      : null
  const sourceResolution =
    generatedDomainMaterializationSourceResolution &&
    typeof generatedDomainMaterializationSourceResolution === 'object'
      ? generatedDomainMaterializationSourceResolution
      : null
  const endToEndReadiness =
    generatedDomainShadowMaterializationEndToEndReadiness &&
    typeof generatedDomainShadowMaterializationEndToEndReadiness === 'object'
      ? generatedDomainShadowMaterializationEndToEndReadiness
      : null
  const approvalPayload =
    generatedDomainMaterializationApprovalPayload &&
    typeof generatedDomainMaterializationApprovalPayload === 'object'
      ? generatedDomainMaterializationApprovalPayload
      : null

  if (
    !controlledEnablePolicy &&
    !approvalPolicy &&
    !firstScenario &&
    !candidatePlan &&
    !preview &&
    !previewComparison &&
    !candidateComparison &&
    !consistency &&
    !sourceResolution &&
    !endToEndReadiness &&
    !approvalPayload
  ) {
    return emptyDecision
  }

  try {
    const warnings = []
    const errors = []
    const controlledEnablePolicyStatus =
      normalizeOptionalString(controlledEnablePolicy?.status) || null
    const fileCreationApprovalPolicyStatus =
      normalizeOptionalString(approvalPolicy?.status) || null
    const firstControlledScenarioStatus =
      normalizeOptionalString(firstScenario?.status) || null
    const candidateStatus = normalizeOptionalString(candidatePlan?.status) || null
    const previewStatus = normalizeOptionalString(preview?.status) || null
    const previewComparisonStatus =
      normalizeOptionalString(previewComparison?.status) || null
    const candidateLegacyComparisonStatus =
      normalizeOptionalString(candidateComparison?.status) || null
    const domainConsistencyStatus =
      normalizeOptionalString(consistency?.status) || null
    const semanticStatus =
      normalizeOptionalString(consistency?.semanticStatus) || null
    const sourceReal = normalizeOptionalString(sourceResolution?.source) || 'none'
    const sourceProjectedInTest =
      normalizeOptionalString(sourceResolution?.testProjection?.projectedSource) || null
    const endToEndStatus = normalizeOptionalString(endToEndReadiness?.status) || null
    const domainMismatch =
      domainConsistencyStatus === 'mismatch' ||
      domainConsistencyStatus === 'error' ||
      semanticStatus === 'mismatch' ||
      semanticStatus === 'error'
    const candidateBlocked =
      candidateStatus === 'blocked' ||
      candidateStatus === 'error' ||
      candidateLegacyComparisonStatus === 'blocked' ||
      candidateLegacyComparisonStatus === 'divergent'
    const previewBuilt = preview?.built === true
    const previewComparisonAligned =
      previewComparisonStatus === 'aligned' || previewComparisonStatus === 'partial'
    const candidateLegacyComparisonAligned =
      candidateLegacyComparisonStatus === 'aligned' ||
      candidateLegacyComparisonStatus === 'partial'
    const controlledPolicyReady =
      controlledEnablePolicyStatus === 'eligible-for-test-enable' ||
      controlledEnablePolicyStatus === 'eligible-for-controlled-runtime-enable'
    const endToEndReady = endToEndStatus === 'ready-for-test-harness'
    const runtimeNormalStillOff =
      sourceReal !== 'generated-domain-shadow' &&
      sourceResolution?.runtime?.materializationPlanChanged !== true &&
      sourceResolution?.runtime?.executionScopeChanged !== true
    const readyForHarness =
      controlledEnablePolicy?.allowedModes?.testHarnessEnable === true &&
      endToEndReady &&
      previewBuilt &&
      previewComparisonAligned &&
      candidateLegacyComparisonAligned &&
      !domainMismatch &&
      !candidateBlocked &&
      runtimeNormalStillOff
    const approvalPayloadReady = approvalPayload?.status === 'ready-for-review'
    const readyForControlledRuntimeReview =
      controlledEnablePolicyStatus === 'eligible-for-controlled-runtime-enable' &&
      firstControlledScenarioStatus === 'ready-for-review' &&
      approvalPayloadReady &&
      runtimeNormalStillOff

    const decision = {
      ...emptyDecision,
      present: true,
      evaluated:
        controlledEnablePolicy?.evaluated === true ||
        approvalPolicy?.evaluated === true ||
        firstScenario?.evaluated === true ||
        endToEndReadiness?.evaluated === true ||
        approvalPayload?.evaluated === true ||
        preview?.present === true,
      readiness: {
        readyForHarness,
        readyForControlledRuntimeReview,
        approvalPayloadReady,
        runtimeNormalStillOff,
      },
      evidence: {
        controlledEnablePolicyStatus,
        fileCreationApprovalPolicyStatus,
        firstControlledScenarioStatus,
        candidateStatus,
        previewStatus,
        previewComparisonStatus,
        candidateLegacyComparisonStatus,
        domainConsistencyStatus,
        semanticStatus,
        sourceReal,
        sourceProjectedInTest,
        endToEndStatus,
      },
      safeguards: {
        sourceRealNotShadow: sourceReal !== 'generated-domain-shadow',
        materializationPlanChanged:
          sourceResolution?.runtime?.materializationPlanChanged === true,
        executionScopeChanged:
          sourceResolution?.runtime?.executionScopeChanged === true,
        noCommands: approvalPolicy?.safeguards?.noCommands === true,
        noWritesExecuted: approvalPolicy?.safeguards?.noWritesExecuted === true,
        noWebPrueba: approvalPolicy?.safeguards?.noWebPrueba === true,
        approvalRequired: approvalPolicy?.approvalRequired !== false,
        approved: approvalPolicy?.approved === true,
      },
      blockers: {
        domainMismatch,
        candidateBlocked,
        previewNotBuilt: !previewBuilt,
        previewComparisonNotAligned: !previewComparisonAligned,
        candidateLegacyComparisonNotAligned: !candidateLegacyComparisonAligned,
        approvalPayloadNotReady: !approvalPayloadReady,
        controlledPolicyNotReady: !controlledPolicyReady,
        endToEndNotReady: !endToEndReady,
        runtimeNormalNotOff: !runtimeNormalStillOff,
        leanApprovalRequired: approvalPolicy?.approved !== true,
      },
      recommendation: {
        action: 'observe',
        reason:
          'La decision final de readiness sigue siendo observacional y no activa el runtime shadow.',
        nextSafeStep:
          'Mantener el runtime actual y seguir revisando candidate, approval payload y readiness en harness.',
      },
      warnings,
      errors,
    }

    if (domainMismatch) {
      pushUniqueMessage(
        errors,
        'La consistencia de dominio o la consistencia semantica siguen en mismatch, por lo que el runtime shadow debe bloquearse.',
      )
    }
    if (candidateBlocked) {
      pushUniqueMessage(
        errors,
        'El candidate shadow o su comparacion con legacy todavia estan bloqueados para una promocion futura.',
      )
    }
    if (!runtimeNormalStillOff) {
      pushUniqueMessage(
        errors,
        'La decision detecto una mutacion de runtime o una fuente real shadow, lo que bloquea la promocion.',
      )
    }
    if (!previewBuilt) {
      pushUniqueMessage(
        warnings,
        'El universal materialization preview todavia no quedo completamente construido.',
      )
    }
    if (!previewComparisonAligned) {
      pushUniqueMessage(
        warnings,
        'La comparacion entre preview universal, candidate y legacy todavia no esta lo bastante alineada.',
      )
    }
    if (!approvalPayloadReady) {
      pushUniqueMessage(
        warnings,
        'Todavia falta un approval payload listo para una revision manual concreta.',
      )
    }

    if (domainMismatch || candidateBlocked || !runtimeNormalStillOff) {
      decision.status = 'blocked'
      decision.recommendation = {
        action: 'investigate',
        reason:
          'Hay bloqueos estructurales o de safety que impiden considerar el runtime shadow como listo.',
        nextSafeStep:
          'Corregir mismatch, candidate o mutaciones de runtime antes de volver a revisar la readiness.',
      }
    } else if (readyForControlledRuntimeReview && approvalPolicy?.approved === true) {
      decision.status = 'ready-for-controlled-runtime-review'
      decision.requiresLeanApproval = false
      decision.recommendation = {
        action: 'prepare-runtime-review',
        reason:
          'La evidencia estructural y la aprobacion ya permitirian preparar una revision controlada de runtime.',
        nextSafeStep:
          'Ejecutar un review final de fallback y de safety antes de cualquier enable real.',
      }
    } else if (readyForControlledRuntimeReview) {
      decision.status = 'requires-Lean-approval'
      decision.recommendation = {
        action: 'request-lean-approval',
        reason:
          'La cadena shadow ya esta fuerte para una revision controlada, pero sigue faltando la aprobacion explicita de Lean.',
        nextSafeStep:
          'Revisar approval payload, root, archivos y riesgos antes de cualquier cambio real de runtime.',
      }
    } else if (readyForHarness) {
      decision.status = 'ready-for-harness'
      decision.recommendation = {
        action: 'keep-harness-only',
        reason:
          'La cadena shadow ya esta lista para seguir ensayandose en harness, sin tocar el runtime real.',
        nextSafeStep:
          'Mantener los ensayos en harness y seguir acumulando evidencia para approval y runtime review.',
      }
    } else {
      decision.status = 'not-ready'
    }

    decision.warningsCount = decision.warnings.length
    decision.errorsCount = decision.errors.length
    return decision
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyDecision,
      present: true,
      evaluated: true,
      status: 'error',
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
      recommendation: {
        action: 'investigate',
        reason: 'La decision final de runtime shadow devolvio un error interno.',
        nextSafeStep:
          'Mantener el runtime actual sin cambios y revisar la decision antes de promover nada.',
      },
    }
  }
}

function buildGeneratedDomainMvpReadinessExecutiveReport({
  generatedDomainContractDiagnostics,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainUniversalMaterializationPlan,
  generatedDomainFileCreationApprovalPolicy,
  generatedDomainMaterializationApprovalPayload,
  generatedDomainFileCreationApprovalEvaluation,
  generatedDomainRuntimeShadowReadinessDecision,
  generatedDomainStructuralCapabilities,
  legacyDomainHardcodingDebtReport,
  localDeterministicExecutorLegacyDebtReport,
}) {
  const emptyReport = {
    present: false,
    evaluated: false,
    status: 'not-ready',
    source: 'generated-domain-mvp-readiness-executive-report',
    behaviorChanged: false,
    mvpFlow: {
      contractReady: false,
      previewReady: false,
      planReady: false,
      approvalPayloadReady: false,
      approvalGateReady: false,
      sandboxReady: false,
      validationReady: false,
      reportReady: false,
    },
    runtime: {
      runtimeEnabled: false,
      controlledRuntimeEnable: false,
      sourceReal: 'none',
      materializationPlanChanged: false,
      executionScopeChanged: false,
      runtimeNormalStillOff: true,
    },
    approvals: {
      approvalRequired: true,
      approved: false,
      requiresLeanApproval: true,
      approvalPolicyStatus: null,
      approvalPayloadStatus: null,
      approvalEvaluationStatus: null,
      pendingItems: [],
    },
    risks: [],
    blockers: [],
    recommendedNextActions: [],
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const contractDiagnostics =
    generatedDomainContractDiagnostics &&
    typeof generatedDomainContractDiagnostics === 'object'
      ? generatedDomainContractDiagnostics
      : null
  const preview =
    generatedDomainUniversalMaterializationPlanPreview &&
    typeof generatedDomainUniversalMaterializationPlanPreview === 'object'
      ? generatedDomainUniversalMaterializationPlanPreview
      : null
  const universalPlan =
    generatedDomainUniversalMaterializationPlan &&
    typeof generatedDomainUniversalMaterializationPlan === 'object'
      ? generatedDomainUniversalMaterializationPlan
      : null
  const approvalPolicy =
    generatedDomainFileCreationApprovalPolicy &&
    typeof generatedDomainFileCreationApprovalPolicy === 'object'
      ? generatedDomainFileCreationApprovalPolicy
      : null
  const approvalPayload =
    generatedDomainMaterializationApprovalPayload &&
    typeof generatedDomainMaterializationApprovalPayload === 'object'
      ? generatedDomainMaterializationApprovalPayload
      : null
  const approvalEvaluation =
    generatedDomainFileCreationApprovalEvaluation &&
    typeof generatedDomainFileCreationApprovalEvaluation === 'object'
      ? generatedDomainFileCreationApprovalEvaluation
      : null
  const runtimeReadiness =
    generatedDomainRuntimeShadowReadinessDecision &&
    typeof generatedDomainRuntimeShadowReadinessDecision === 'object'
      ? generatedDomainRuntimeShadowReadinessDecision
      : null
  const structuralCapabilities =
    generatedDomainStructuralCapabilities &&
    typeof generatedDomainStructuralCapabilities === 'object'
      ? generatedDomainStructuralCapabilities
      : null
  const legacyDebtReport =
    legacyDomainHardcodingDebtReport && typeof legacyDomainHardcodingDebtReport === 'object'
      ? legacyDomainHardcodingDebtReport
      : null
  const executorDebtReport =
    localDeterministicExecutorLegacyDebtReport &&
    typeof localDeterministicExecutorLegacyDebtReport === 'object'
      ? localDeterministicExecutorLegacyDebtReport
      : null

  if (
    !contractDiagnostics &&
    !preview &&
    !universalPlan &&
    !approvalPolicy &&
    !approvalPayload &&
    !approvalEvaluation &&
    !runtimeReadiness &&
    !structuralCapabilities &&
    !legacyDebtReport &&
    !executorDebtReport
  ) {
    return emptyReport
  }

  try {
    const warnings = []
    const errors = []
    const risks = []
    const blockers = []
    const pendingItems = []
    const recommendedNextActions = []

    const contractReady =
      contractDiagnostics?.valid === true &&
      contractDiagnostics?.safeForLocalMaterialization === true
    const previewReady =
      preview?.built === true &&
      preview?.safety?.safeForLocalMaterialization === true &&
      preview?.approvalRequired === true
    const planReady =
      universalPlan?.built === true &&
      universalPlan?.canMaterializeInSandbox === true &&
      universalPlan?.safety?.safeForLocalMaterialization === true
    const approvalPayloadReady =
      approvalPayload?.status === 'ready-for-review' || approvalPayload?.status === 'blocked'
    const approvalGateReady =
      approvalPolicy?.present === true &&
      approvalPolicy?.evaluated === true &&
      approvalPolicy?.approvalRequired === true &&
      approvalPolicy?.safeguards?.noCommands === true &&
      approvalPolicy?.safeguards?.noWritesExecuted === true
    const sandboxReady =
      universalPlan?.canMaterializeInSandbox === true &&
      universalPlan?.safety?.sandboxOnly === true &&
      approvalEvaluation?.status !== 'error'
    const validationReady =
      Array.isArray(universalPlan?.fileChecks) &&
      universalPlan.fileChecks.length > 0 &&
      Array.isArray(universalPlan?.validationPlan?.syntaxChecks)
    const reportReady =
      normalizeOptionalString(universalPlan?.report?.reportFile).length > 0

    const runtimeEnabled = runtimeReadiness?.runtimeEnabled === true
    const controlledRuntimeEnable = runtimeReadiness?.controlledRuntimeEnable === true
    const sourceReal =
      normalizeOptionalString(runtimeReadiness?.evidence?.sourceReal) ||
      normalizeOptionalString(runtimeReadiness?.runtime?.sourceReal) ||
      'none'
    const materializationPlanChanged =
      runtimeReadiness?.safeguards?.materializationPlanChanged === true
    const executionScopeChanged =
      runtimeReadiness?.safeguards?.executionScopeChanged === true
    const runtimeNormalStillOff =
      runtimeReadiness?.readiness?.runtimeNormalStillOff !== false &&
      runtimeEnabled !== true &&
      controlledRuntimeEnable !== true &&
      sourceReal !== 'generated-domain-shadow' &&
      materializationPlanChanged !== true &&
      executionScopeChanged !== true

    if (!contractReady) {
      pushUniqueMessage(blockers, 'El GeneratedDomainContract todavia no esta validado como base segura del MVP.')
      pushUniqueMessage(warnings, 'El contrato generado aun no alcanza una condicion segura para cerrar el MVP completo.')
    }
    if (!previewReady) {
      pushUniqueMessage(blockers, 'El universal preview todavia no esta listo como evidencia estructural completa.')
    }
    if (!planReady) {
      pushUniqueMessage(blockers, 'El universal materialization plan todavia no quedo listo como candidate seguro de sandbox.')
    }
    if (!approvalGateReady) {
      pushUniqueMessage(blockers, 'La policy de aprobacion de archivos todavia no esta lista como gate formal del MVP.')
    }
    if (!approvalPayloadReady) {
      pushUniqueMessage(blockers, 'El payload de aprobacion todavia no es lo bastante concreto para review manual futura.')
    }
    if (!validationReady) {
      pushUniqueMessage(blockers, 'El plan universal todavia no expone una superficie de validacion suficientemente completa.')
    }
    if (!reportReady) {
      pushUniqueMessage(blockers, 'El plan universal todavia no deja listo un report file consistente para el MVP.')
    }
    if (!runtimeNormalStillOff) {
      pushUniqueMessage(errors, 'El readiness ejecutivo detecto un runtime normal alterado o una fuente shadow real, lo cual esta prohibido.')
    }

    if (approvalPolicy?.approvalRequired !== false && approvalPolicy?.approved !== true) {
      pushUniqueMessage(
        pendingItems,
        'Aprobacion explicita de Lean para cualquier write real fuera de sandbox/harness.',
      )
    }
    if (runtimeReadiness?.status === 'requires-Lean-approval') {
      pushUniqueMessage(
        pendingItems,
        'Approval explicita de Lean antes de cualquier runtime review controlado.',
      )
    }

    if ((legacyDebtReport?.runtimeCriticalCount || 0) > 0) {
      pushUniqueMessage(
        risks,
        'main.cjs todavia conserva ramas runtime-critical legacy que obligan a mantener fallback y observabilidad fuerte.',
      )
    }
    if ((executorDebtReport?.runtimeCriticalCount || 0) > 0) {
      pushUniqueMessage(
        risks,
        'local-deterministic-executor.cjs sigue acoplado a ramas legacy por dominio/familia.',
      )
    }
    if (structuralCapabilities?.hasSafeLocalMaterialization !== true) {
      pushUniqueMessage(
        risks,
        'Las capacidades estructurales todavia no demuestran completamente una materializacion local segura en todos los casos.',
      )
    }

    if (runtimeReadiness?.status === 'ready-for-harness') {
      pushUniqueMessage(
        recommendedNextActions,
        'Seguir validando el MVP solo en harness/sandbox y ampliar fixtures domain-agnostic antes de cualquier paso real.',
      )
    }
    if (approvalPolicy?.approved !== true) {
      pushUniqueMessage(
        recommendedNextActions,
        'Mantener approvalRequired=true y approved=false fuera del sandbox controlado.',
      )
    }
    pushUniqueMessage(
      recommendedNextActions,
      'Seguir desacoplando main.cjs y mantener local-deterministic-executor.cjs como deuda observada hasta tener mas cobertura.',
    )

    const report = {
      ...emptyReport,
      present: true,
      evaluated:
        contractDiagnostics?.present === true ||
        preview?.present === true ||
        universalPlan?.present === true ||
        approvalPolicy?.evaluated === true ||
        approvalPayload?.evaluated === true ||
        approvalEvaluation?.evaluated === true ||
        runtimeReadiness?.evaluated === true,
      mvpFlow: {
        contractReady,
        previewReady,
        planReady,
        approvalPayloadReady,
        approvalGateReady,
        sandboxReady,
        validationReady,
        reportReady,
      },
      runtime: {
        runtimeEnabled,
        controlledRuntimeEnable,
        sourceReal,
        materializationPlanChanged,
        executionScopeChanged,
        runtimeNormalStillOff,
      },
      approvals: {
        approvalRequired: approvalPolicy?.approvalRequired !== false,
        approved: approvalPolicy?.approved === true,
        requiresLeanApproval: approvalPolicy?.requiresLeanApproval !== false,
        approvalPolicyStatus: normalizeOptionalString(approvalPolicy?.status) || null,
        approvalPayloadStatus: normalizeOptionalString(approvalPayload?.status) || null,
        approvalEvaluationStatus: normalizeOptionalString(approvalEvaluation?.status) || null,
        pendingItems,
      },
      risks,
      blockers,
      recommendedNextActions,
      warnings,
      errors,
    }

    if (!runtimeNormalStillOff) {
      report.status = 'blocked'
    } else if (
      contractReady &&
      previewReady &&
      planReady &&
      approvalPayloadReady &&
      approvalGateReady &&
      sandboxReady &&
      validationReady &&
      reportReady
    ) {
      report.status = pendingItems.length > 0 ? 'requires-Lean-approval' : 'ready'
    } else {
      report.status = 'not-ready'
    }

    report.warningsCount = report.warnings.length
    report.errorsCount = report.errors.length
    return report
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyReport,
      present: true,
      evaluated: true,
      status: 'error',
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

module.exports = {
  summarizeGeneratedDomainMaterializationSourceResolutionForDebug,
  summarizeGeneratedDomainControlledEnablePolicyForDebug,
  summarizeGeneratedDomainFirstControlledEnableScenarioForDebug,
  summarizeGeneratedDomainFileCreationApprovalPolicyForDebug,
  summarizeGeneratedDomainMaterializationApprovalPayloadForDebug,
  summarizeGeneratedDomainRuntimeShadowReadinessDecisionForDebug,
  summarizeGeneratedDomainMvpReadinessExecutiveReportForDebug,
  summarizeGeneratedDomainMaterializationInspectionSourceResolutionForDebug,
  resolveGeneratedDomainMaterializationSource,
  buildGeneratedDomainControlledEnablePolicy,
  buildGeneratedDomainFirstControlledEnableScenario,
  buildGeneratedDomainMaterializationApprovalPayload,
  buildGeneratedDomainRuntimeShadowReadinessDecision,
  buildGeneratedDomainMvpReadinessExecutiveReport,
}
