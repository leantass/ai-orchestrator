const path = require('path')

function buildOutputPreview(text, maxLength = 240) {
  if (typeof text !== 'string' || !text) {
    return ''
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function normalizeEventStringValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function normalizeEventStringList(entries) {
  if (!Array.isArray(entries)) {
    return []
  }

  return [...new Set(entries.map(normalizeEventStringValue).filter(Boolean))]
}

function normalizeExecutorPathList(entries) {
  if (!Array.isArray(entries)) {
    return []
  }

  return entries
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .map((entry) => entry.trim())
    .filter(
      (entry) =>
        entry !== 'item.started' &&
        entry !== 'item.completed' &&
        entry !== 'file_change' &&
        entry !== 'command_execution',
    )
    .slice(0, 40)
}

function summarizeExecutionEventValidations(validationResults) {
  if (!Array.isArray(validationResults)) {
    return {
      total: 0,
      ok: 0,
      failed: 0,
    }
  }

  let okCount = 0

  validationResults.forEach((entry) => {
    if (entry && typeof entry === 'object' && entry.ok === true) {
      okCount += 1
    }
  })

  return {
    total: validationResults.length,
    ok: okCount,
    failed: Math.max(0, validationResults.length - okCount),
  }
}

function summarizeExecutionEventRecentFailures(recentFailures) {
  if (!Array.isArray(recentFailures)) {
    return []
  }

  return recentFailures
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const timestamp = normalizeEventStringValue(entry.timestamp)
      const failureType = normalizeEventStringValue(entry.failureType)
      const currentAction = normalizeEventStringValue(entry.currentAction)
      const currentTargetPath = normalizeEventStringValue(entry.currentTargetPath)
      const materialState = normalizeEventStringValue(entry.materialState)

      if (
        !timestamp &&
        !failureType &&
        !currentAction &&
        !currentTargetPath &&
        !materialState
      ) {
        return null
      }

      return {
        ...(timestamp ? { timestamp } : {}),
        ...(failureType ? { failureType } : {}),
        ...(currentAction ? { currentAction } : {}),
        ...(currentTargetPath ? { currentTargetPath } : {}),
        ...(materialState ? { materialState } : {}),
      }
    })
    .filter(Boolean)
    .slice(-4)
}

function buildWorkspaceEventPaths(workspacePath) {
  const normalizedWorkspacePath = normalizeEventStringValue(workspacePath)

  if (!normalizedWorkspacePath) {
    return {}
  }

  const payload = {
    sourceWorkspacePath: normalizedWorkspacePath,
  }

  try {
    const relativePath = path.relative(process.cwd(), normalizedWorkspacePath)

    if (
      relativePath &&
      !relativePath.startsWith('..') &&
      !path.isAbsolute(relativePath)
    ) {
      payload.sourceWorkspaceRelativePath = relativePath.replace(/[\\/]+/g, '/')
    }
  } catch {
    // Best effort: si no se puede relativizar, queda solo el path original.
  }

  return payload
}

function buildCompactContextHubPayload(contextHubStatus) {
  if (!contextHubStatus || typeof contextHubStatus !== 'object') {
    return {
      available: false,
      reason: 'unavailable',
    }
  }

  return {
    available: contextHubStatus.available === true,
    ...(typeof contextHubStatus.id === 'string' && contextHubStatus.id.trim()
      ? { id: contextHubStatus.id.trim() }
      : {}),
    ...(typeof contextHubStatus.slug === 'string' && contextHubStatus.slug.trim()
      ? { slug: contextHubStatus.slug.trim() }
      : {}),
    ...(typeof contextHubStatus.title === 'string' && contextHubStatus.title.trim()
      ? { title: contextHubStatus.title.trim() }
      : {}),
    ...(Number.isInteger(contextHubStatus.itemsCount) && contextHubStatus.itemsCount >= 0
      ? { itemsCount: contextHubStatus.itemsCount }
      : {}),
    ...(Number.isFinite(contextHubStatus.estimatedTokens) &&
    contextHubStatus.estimatedTokens >= 0
      ? { estimatedTokens: contextHubStatus.estimatedTokens }
      : {}),
    ...(typeof contextHubStatus.reason === 'string' && contextHubStatus.reason.trim()
      ? { reason: contextHubStatus.reason.trim() }
      : {}),
  }
}

function summarizeContextHubPackForLog(contextHubPack) {
  if (!contextHubPack || typeof contextHubPack !== 'object') {
    return {
      source: 'context-hub',
      endpoint: '/v1/packs/suggested',
      available: false,
      reason: 'unavailable',
    }
  }

  if (contextHubPack.available !== true || !contextHubPack.pack) {
    return {
      source: 'context-hub',
      endpoint:
        typeof contextHubPack.endpoint === 'string' && contextHubPack.endpoint.trim()
          ? contextHubPack.endpoint.trim()
          : '/v1/packs/suggested',
      available: false,
      reason:
        typeof contextHubPack.reason === 'string' && contextHubPack.reason.trim()
          ? contextHubPack.reason.trim()
          : 'unavailable',
    }
  }

  const pack = contextHubPack.pack
  const metadata = pack.metadata && typeof pack.metadata === 'object' ? pack.metadata : {}

  return {
    source: 'context-hub',
    endpoint:
      typeof contextHubPack.endpoint === 'string' && contextHubPack.endpoint.trim()
        ? contextHubPack.endpoint.trim()
        : '/v1/packs/suggested',
    available: true,
    id: typeof pack.id === 'string' && pack.id.trim() ? pack.id.trim() : undefined,
    slug:
      typeof pack.slug === 'string' && pack.slug.trim() ? pack.slug.trim() : undefined,
    title:
      typeof pack.title === 'string' && pack.title.trim()
        ? pack.title.trim()
        : undefined,
    itemsCount:
      Number.isFinite(metadata.itemsCount) && metadata.itemsCount >= 0
        ? metadata.itemsCount
        : undefined,
    estimatedTokens:
      Number.isFinite(metadata.estimatedTokens) && metadata.estimatedTokens >= 0
        ? metadata.estimatedTokens
        : undefined,
  }
}

function summarizeContextHubEventResultForLog(eventResult) {
  if (!eventResult || typeof eventResult !== 'object') {
    return {
      ok: false,
      endpoint: '/v1/events',
      eventType: 'unknown',
      reason: 'unavailable',
    }
  }

  return {
    ok: eventResult.ok === true,
    endpoint:
      typeof eventResult.endpoint === 'string' && eventResult.endpoint.trim()
        ? eventResult.endpoint.trim()
        : '/v1/events',
    eventType:
      typeof eventResult.eventType === 'string' && eventResult.eventType.trim()
        ? eventResult.eventType.trim()
        : 'unknown',
    ...(Number.isInteger(eventResult.statusCode)
      ? { statusCode: eventResult.statusCode }
      : {}),
    ...(typeof eventResult.reason === 'string' && eventResult.reason.trim()
      ? { reason: eventResult.reason.trim() }
      : {}),
  }
}

function buildPlanningFinishedEventPayload({
  goal,
  context,
  instruction,
  workspacePath,
  brainDecision,
  contextHubStatus,
}) {
  return {
    type: 'planning_finished',
    source: 'ai-orchestrator',
    sourceApp: 'ai-orchestrator',
    sourceProject: 'ai-orchestrator',
    timestamp: new Date().toISOString(),
    goal,
    contextPreview: buildOutputPreview(context || '', 220),
    ...buildWorkspaceEventPaths(workspacePath),
    decision: {
      decisionKey: brainDecision?.decisionKey || '',
      strategy: brainDecision?.strategy || '',
      executionMode: brainDecision?.executionMode || '',
      nextExpectedAction: brainDecision?.nextExpectedAction || '',
      requiresApproval: brainDecision?.requiresApproval === true,
      approvalRequired: brainDecision?.requiresApproval === true,
    },
    instructionPreview: buildOutputPreview(instruction || '', 220),
    tasksCount: Array.isArray(brainDecision?.tasks) ? brainDecision.tasks.length : 0,
    reuse: {
      reuseMode:
        typeof brainDecision?.reuseMode === 'string' && brainDecision.reuseMode.trim()
          ? brainDecision.reuseMode.trim()
          : 'none',
      reuseDecision: brainDecision?.reuseDecision === true,
      reusedArtifactIds: Array.isArray(brainDecision?.reusedArtifactIds)
        ? brainDecision.reusedArtifactIds
            .filter((artifactId) => typeof artifactId === 'string' && artifactId.trim())
            .map((artifactId) => artifactId.trim())
        : [],
    },
    contextHub: buildCompactContextHubPayload(contextHubStatus),
  }
}

function buildPlanningFinishedEventLogSummary({
  eventPayload,
  contextHubStatus,
  eventResult,
}) {
  return {
    type:
      typeof eventPayload?.type === 'string' && eventPayload.type.trim()
        ? eventPayload.type.trim()
        : 'planning_finished',
    decisionKey:
      typeof eventPayload?.decision?.decisionKey === 'string' &&
      eventPayload.decision.decisionKey.trim()
        ? eventPayload.decision.decisionKey.trim()
        : undefined,
    strategy:
      typeof eventPayload?.decision?.strategy === 'string' &&
      eventPayload.decision.strategy.trim()
        ? eventPayload.decision.strategy.trim()
        : undefined,
    executionMode:
      typeof eventPayload?.decision?.executionMode === 'string' &&
      eventPayload.decision.executionMode.trim()
        ? eventPayload.decision.executionMode.trim()
        : undefined,
    nextExpectedAction:
      typeof eventPayload?.decision?.nextExpectedAction === 'string' &&
      eventPayload.decision.nextExpectedAction.trim()
        ? eventPayload.decision.nextExpectedAction.trim()
        : undefined,
    requiresApproval: eventPayload?.decision?.requiresApproval === true,
    tasksCount:
      Number.isInteger(eventPayload?.tasksCount) && eventPayload.tasksCount >= 0
        ? eventPayload.tasksCount
        : 0,
    contextHubAvailable: contextHubStatus?.available === true,
    ...(typeof contextHubStatus?.id === 'string' && contextHubStatus.id.trim()
      ? { contextHubId: contextHubStatus.id.trim() }
      : {}),
    ...(typeof contextHubStatus?.slug === 'string' && contextHubStatus.slug.trim()
      ? { contextHubSlug: contextHubStatus.slug.trim() }
      : {}),
    ...(typeof contextHubStatus?.title === 'string' && contextHubStatus.title.trim()
      ? { contextHubTitle: contextHubStatus.title.trim() }
      : {}),
    ...(Number.isInteger(contextHubStatus?.itemsCount) && contextHubStatus.itemsCount >= 0
      ? { contextHubItemsCount: contextHubStatus.itemsCount }
      : {}),
    ...(Number.isFinite(contextHubStatus?.estimatedTokens) &&
    contextHubStatus.estimatedTokens >= 0
      ? { contextHubEstimatedTokens: contextHubStatus.estimatedTokens }
      : {}),
    ...summarizeContextHubEventResultForLog(eventResult),
  }
}

function buildExecutionFinishedEventPayload({
  finalResponse,
  requestId,
  instruction,
  workspacePath,
  decisionKey,
  contextHubStatus,
}) {
  const responseDetails =
    finalResponse?.details && typeof finalResponse.details === 'object'
      ? finalResponse.details
      : {}
  const resolvedRequestId =
    normalizeEventStringValue(requestId) ||
    normalizeEventStringValue(finalResponse?.requestId)
  const resolvedDecisionKey =
    normalizeEventStringValue(decisionKey) ||
    normalizeEventStringValue(responseDetails.decisionKey)
  const createdPaths = normalizeExecutorPathList(responseDetails.createdPaths)
  const touchedPaths = normalizeExecutorPathList(responseDetails.touchedPaths)
  const validationSummary = summarizeExecutionEventValidations(
    responseDetails.validationResults,
  )
  const resultPreviewSource =
    normalizeEventStringValue(finalResponse?.resultPreview) ||
    normalizeEventStringValue(finalResponse?.result) ||
    normalizeEventStringValue(finalResponse?.error)

  return {
    type: 'execution_finished',
    source: 'ai-orchestrator',
    sourceApp: 'ai-orchestrator',
    sourceProject: 'ai-orchestrator',
    ...buildWorkspaceEventPaths(workspacePath),
    timestamp: new Date().toISOString(),
    requestId: resolvedRequestId,
    decisionKey: resolvedDecisionKey,
    instructionPreview: buildOutputPreview(
      normalizeEventStringValue(instruction) ||
        normalizeEventStringValue(finalResponse?.instruction),
      220,
    ),
    resultPreview: buildOutputPreview(resultPreviewSource, 220),
    execution: {
      status: 'success',
      strategy:
        normalizeEventStringValue(responseDetails.strategy) ||
        normalizeEventStringValue(finalResponse?.strategy),
      brainStrategy:
        normalizeEventStringValue(responseDetails.brainStrategy) ||
        normalizeEventStringValue(finalResponse?.brainStrategy),
      executionMode:
        normalizeEventStringValue(responseDetails.executionMode) ||
        normalizeEventStringValue(finalResponse?.executionMode) ||
        normalizeEventStringValue(finalResponse?.executorMode),
      materializationLayer:
        normalizeEventStringValue(finalResponse?.materializationLayer) ||
        normalizeEventStringValue(responseDetails.materializationLayer),
      materialState: normalizeEventStringValue(responseDetails.materialState),
      currentAction: normalizeEventStringValue(responseDetails.currentAction),
      currentTargetPath: normalizeEventStringValue(responseDetails.currentTargetPath),
    },
    files: {
      createdPaths,
      touchedPaths,
    },
    validations: validationSummary,
    reuse: {
      appliedReuseMode: normalizeEventStringValue(responseDetails.appliedReuseMode),
      reusedStyleFromArtifactId: normalizeEventStringValue(
        responseDetails.reusedStyleFromArtifactId,
      ),
      reusedStructureFromArtifactId: normalizeEventStringValue(
        responseDetails.reusedStructureFromArtifactId,
      ),
      reuseAppliedFields: normalizeEventStringList(responseDetails.reuseAppliedFields),
    },
    contextHub: buildCompactContextHubPayload(contextHubStatus),
  }
}

function buildExecutionFailedEventPayload({
  finalResponse,
  requestId,
  instruction,
  workspacePath,
  decisionKey,
  contextHubStatus,
}) {
  const responseDetails =
    finalResponse?.details && typeof finalResponse.details === 'object'
      ? finalResponse.details
      : {}
  const resolvedRequestId =
    normalizeEventStringValue(requestId) ||
    normalizeEventStringValue(finalResponse?.requestId)
  const resolvedDecisionKey =
    normalizeEventStringValue(decisionKey) ||
    normalizeEventStringValue(responseDetails.decisionKey)
  const createdPaths = normalizeExecutorPathList(responseDetails.createdPaths)
  const touchedPaths = normalizeExecutorPathList(responseDetails.touchedPaths)
  const validationSummary = summarizeExecutionEventValidations(
    responseDetails.validationResults,
  )
  const failureType =
    normalizeEventStringValue(finalResponse?.failureType) ||
    normalizeEventStringValue(responseDetails.failureType)
  const resultPreviewSource =
    normalizeEventStringValue(finalResponse?.resultPreview) ||
    normalizeEventStringValue(finalResponse?.result)
  const errorPreviewSource =
    normalizeEventStringValue(finalResponse?.error) ||
    normalizeEventStringValue(responseDetails.errorMessage)
  const failureMessagePreviewSource =
    errorPreviewSource ||
    resultPreviewSource ||
    normalizeEventStringValue(finalResponse?.result)

  return {
    type: 'execution_failed',
    source: 'ai-orchestrator',
    sourceApp: 'ai-orchestrator',
    sourceProject: 'ai-orchestrator',
    ...buildWorkspaceEventPaths(workspacePath),
    timestamp: new Date().toISOString(),
    requestId: resolvedRequestId,
    decisionKey: resolvedDecisionKey,
    instructionPreview: buildOutputPreview(
      normalizeEventStringValue(instruction) ||
        normalizeEventStringValue(finalResponse?.instruction),
      220,
    ),
    resultPreview: buildOutputPreview(resultPreviewSource, 220),
    errorPreview: buildOutputPreview(errorPreviewSource, 220),
    execution: {
      status: 'failed',
      strategy:
        normalizeEventStringValue(responseDetails.strategy) ||
        normalizeEventStringValue(finalResponse?.strategy),
      brainStrategy:
        normalizeEventStringValue(responseDetails.brainStrategy) ||
        normalizeEventStringValue(finalResponse?.brainStrategy),
      executionMode:
        normalizeEventStringValue(responseDetails.executionMode) ||
        normalizeEventStringValue(finalResponse?.executionMode) ||
        normalizeEventStringValue(finalResponse?.executorMode),
      materializationLayer:
        normalizeEventStringValue(finalResponse?.materializationLayer) ||
        normalizeEventStringValue(responseDetails.materializationLayer),
      materialState: normalizeEventStringValue(responseDetails.materialState),
      currentAction: normalizeEventStringValue(responseDetails.currentAction),
      currentTargetPath: normalizeEventStringValue(responseDetails.currentTargetPath),
      failureType,
    },
    files: {
      createdPaths,
      touchedPaths,
    },
    validations: validationSummary,
    failure: {
      type: failureType,
      messagePreview: buildOutputPreview(failureMessagePreviewSource, 220),
      recentFailures: summarizeExecutionEventRecentFailures(responseDetails.recentFailures),
    },
    reuse: {
      appliedReuseMode: normalizeEventStringValue(responseDetails.appliedReuseMode),
      reusedStyleFromArtifactId: normalizeEventStringValue(
        responseDetails.reusedStyleFromArtifactId,
      ),
      reusedStructureFromArtifactId: normalizeEventStringValue(
        responseDetails.reusedStructureFromArtifactId,
      ),
      reuseAppliedFields: normalizeEventStringList(responseDetails.reuseAppliedFields),
    },
    contextHub: buildCompactContextHubPayload(contextHubStatus),
  }
}

function buildExecutionFinishedEventLogSummary({
  eventPayload,
  eventResult,
  skippedDuplicate = false,
}) {
  const createdPathsCount = Array.isArray(eventPayload?.files?.createdPaths)
    ? eventPayload.files.createdPaths.length
    : 0
  const touchedPathsCount = Array.isArray(eventPayload?.files?.touchedPaths)
    ? eventPayload.files.touchedPaths.length
    : 0

  return {
    type:
      typeof eventPayload?.type === 'string' && eventPayload.type.trim()
        ? eventPayload.type.trim()
        : 'execution_finished',
    requestId: normalizeEventStringValue(eventPayload?.requestId) || undefined,
    decisionKey: normalizeEventStringValue(eventPayload?.decisionKey) || undefined,
    status: normalizeEventStringValue(eventPayload?.execution?.status) || 'success',
    strategy: normalizeEventStringValue(eventPayload?.execution?.strategy) || undefined,
    brainStrategy:
      normalizeEventStringValue(eventPayload?.execution?.brainStrategy) || undefined,
    executionMode:
      normalizeEventStringValue(eventPayload?.execution?.executionMode) || undefined,
    materializationLayer:
      normalizeEventStringValue(eventPayload?.execution?.materializationLayer) || undefined,
    materialState:
      normalizeEventStringValue(eventPayload?.execution?.materialState) || undefined,
    currentAction:
      normalizeEventStringValue(eventPayload?.execution?.currentAction) || undefined,
    currentTargetPath:
      normalizeEventStringValue(eventPayload?.execution?.currentTargetPath) || undefined,
    createdPathsCount,
    touchedPathsCount,
    validationsTotal:
      Number.isInteger(eventPayload?.validations?.total) ? eventPayload.validations.total : 0,
    validationsFailed:
      Number.isInteger(eventPayload?.validations?.failed)
        ? eventPayload.validations.failed
        : 0,
    appliedReuseMode:
      normalizeEventStringValue(eventPayload?.reuse?.appliedReuseMode) || undefined,
    contextHubAvailable: eventPayload?.contextHub?.available === true,
    skippedDuplicate,
    ...(skippedDuplicate ? {} : summarizeContextHubEventResultForLog(eventResult)),
  }
}

function buildExecutionFailedEventLogSummary({
  eventPayload,
  eventResult,
  skippedDuplicate = false,
  skippedBecauseFinished = false,
}) {
  const createdPathsCount = Array.isArray(eventPayload?.files?.createdPaths)
    ? eventPayload.files.createdPaths.length
    : 0
  const touchedPathsCount = Array.isArray(eventPayload?.files?.touchedPaths)
    ? eventPayload.files.touchedPaths.length
    : 0
  const recentFailuresCount = Array.isArray(eventPayload?.failure?.recentFailures)
    ? eventPayload.failure.recentFailures.length
    : 0

  return {
    type:
      typeof eventPayload?.type === 'string' && eventPayload.type.trim()
        ? eventPayload.type.trim()
        : 'execution_failed',
    requestId: normalizeEventStringValue(eventPayload?.requestId) || undefined,
    decisionKey: normalizeEventStringValue(eventPayload?.decisionKey) || undefined,
    status: normalizeEventStringValue(eventPayload?.execution?.status) || 'failed',
    strategy: normalizeEventStringValue(eventPayload?.execution?.strategy) || undefined,
    brainStrategy:
      normalizeEventStringValue(eventPayload?.execution?.brainStrategy) || undefined,
    executionMode:
      normalizeEventStringValue(eventPayload?.execution?.executionMode) || undefined,
    materializationLayer:
      normalizeEventStringValue(eventPayload?.execution?.materializationLayer) || undefined,
    materialState:
      normalizeEventStringValue(eventPayload?.execution?.materialState) || undefined,
    currentAction:
      normalizeEventStringValue(eventPayload?.execution?.currentAction) || undefined,
    currentTargetPath:
      normalizeEventStringValue(eventPayload?.execution?.currentTargetPath) || undefined,
    failureType:
      normalizeEventStringValue(eventPayload?.execution?.failureType) || undefined,
    createdPathsCount,
    touchedPathsCount,
    validationsTotal:
      Number.isInteger(eventPayload?.validations?.total) ? eventPayload.validations.total : 0,
    validationsFailed:
      Number.isInteger(eventPayload?.validations?.failed)
        ? eventPayload.validations.failed
        : 0,
    recentFailuresCount,
    appliedReuseMode:
      normalizeEventStringValue(eventPayload?.reuse?.appliedReuseMode) || undefined,
    contextHubAvailable: eventPayload?.contextHub?.available === true,
    skippedDuplicate,
    skippedBecauseFinished,
    ...(skippedDuplicate || skippedBecauseFinished
      ? {}
      : summarizeContextHubEventResultForLog(eventResult)),
  }
}

module.exports = {
  summarizeContextHubPackForLog,
  summarizeContextHubEventResultForLog,
  buildPlanningFinishedEventPayload,
  buildPlanningFinishedEventLogSummary,
  buildExecutionFinishedEventPayload,
  buildExecutionFailedEventPayload,
  buildExecutionFinishedEventLogSummary,
  buildExecutionFailedEventLogSummary,
  buildCompactContextHubPayload,
}
