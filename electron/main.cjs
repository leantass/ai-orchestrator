const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const util = require('util')

function isElectronExecutablePath(executablePath) {
  if (typeof executablePath !== 'string' || !executablePath.trim()) {
    return false
  }

  const normalizedBasename = path.basename(executablePath.trim()).toLocaleLowerCase()

  return normalizedBasename === 'electron' || normalizedBasename === 'electron.exe'
}

function relaunchElectronRuntimeIfNeeded() {
  if (process.env.ELECTRON_RUN_AS_NODE !== '1') {
    return
  }

  if (process.env.AI_ORCHESTRATOR_ELECTRON_RUNTIME_RELAUNCHED === '1') {
    return
  }

  if (!isElectronExecutablePath(process.execPath)) {
    return
  }

  const relaunchEnv = {
    ...process.env,
    AI_ORCHESTRATOR_ELECTRON_RUNTIME_RELAUNCHED: '1',
  }
  const appRootPath = path.resolve(__dirname, '..')
  const forwardedCliArgs = process.argv.slice(2)

  delete relaunchEnv.ELECTRON_RUN_AS_NODE

  try {
    const relaunchedProcess = spawn(process.execPath, [appRootPath, ...forwardedCliArgs], {
      env: relaunchEnv,
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    })

    if (typeof relaunchedProcess.unref === 'function') {
      relaunchedProcess.unref()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(
      `No se pudo relanzar Electron fuera de ELECTRON_RUN_AS_NODE: ${errorMessage}`,
    )
  }

  process.exit(0)
}

relaunchElectronRuntimeIfNeeded()

const electronModule = require('electron')
const { app, BrowserWindow, ipcMain } = electronModule

if (
  !electronModule ||
  typeof electronModule !== 'object' ||
  !app ||
  !BrowserWindow ||
  !ipcMain ||
  typeof ipcMain.handle !== 'function'
) {
  const electronModuleType = typeof electronModule
  const electronModuleKeys =
    electronModule && typeof electronModule === 'object'
      ? Object.keys(electronModule).slice(0, 8)
      : []

  throw new Error(
    `Electron main process APIs no disponibles. require('electron') devolvio ${electronModuleType}${
      electronModuleKeys.length > 0 ? ` con claves ${electronModuleKeys.join(', ')}` : ''
    }. Revisar ELECTRON_RUN_AS_NODE y el contexto de arranque.`,
  )
}
const {
  ensureArtifactMemoryStorage,
  saveReusableArtifact,
  listReusableArtifacts,
  findSimilarReusableArtifacts,
  lookupReusableArtifactsForPlanning,
  buildReusableArtifactFromWebScaffold,
  isReusableArtifactTrusted,
} = require('./reusable-artifact-memory.cjs')
const {
  LOCAL_MATERIALIZATION_PLAN_VERSION,
  buildLocalMaterializationTask,
  buildGenericSafeFirstDeliveryMaterializationPlan,
  runLocalDeterministicTask,
} = require('./local-deterministic-executor.cjs')
const {
  buildUnavailableContextHubPack,
  emitContextHubEvent,
  emitExecutionFailedEvent,
  emitExecutionFinishedEvent,
  fetchSuggestedContextHubPack,
} = require('./context-hub-client.cjs')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
const defaultExecutorBridgePath = path.join(
  __dirname,
  '..',
  'executor-bridge',
  'executor-bridge.cjs',
)
const EXECUTOR_TIMEOUT_MS = 90000
const EXECUTOR_MATERIAL_PROGRESS_TIMEOUT_MS = Math.min(
  EXECUTOR_TIMEOUT_MS,
  Math.max(
    10000,
    Number.parseInt(
      process.env.AI_ORCHESTRATOR_EXECUTOR_MATERIAL_TIMEOUT_MS || '30000',
      10,
    ) || 30000,
  ),
)
const EXECUTOR_STRUCTURED_PLAN_TIMEOUT_MS = Math.max(
  EXECUTOR_MATERIAL_PROGRESS_TIMEOUT_MS,
  Math.max(
    60000,
    Number.parseInt(
      process.env.AI_ORCHESTRATOR_EXECUTOR_STRUCTURED_PLAN_TIMEOUT_MS || '150000',
      10,
    ) || 150000,
  ),
)
const EXECUTION_EVENT_CHANNEL = 'ai-orchestrator:execution-event'
const EXECUTION_COMPLETE_CHANNEL = 'ai-orchestrator:execution-complete'
const VALID_EXECUTOR_MODES = new Set(['command', 'mock'])
const VALID_BRIDGE_MODES = new Set(['codex', 'mock'])
const executorProgressSnapshots = new Map()
const executorRecoveryHistories = new Map()
const emittedExecutionFailedRequestIds = new Set()
const emittedExecutionFinishedRequestIds = new Set()
const MAX_EXECUTOR_RECOVERY_HISTORY = 20
const MAX_EMITTED_EXECUTION_FINAL_EVENT_IDS = 500
const mainStdoutGuard = installBrokenPipeGuard(process.stdout)
const mainStderrGuard =
  process.stderr === process.stdout
    ? mainStdoutGuard
    : installBrokenPipeGuard(process.stderr)

function isBrokenPipeWriteError(error) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      error.code === 'EPIPE' &&
      error.syscall === 'write',
  )
}

function installBrokenPipeGuard(stream) {
  const guard = { broken: false }

  if (!stream || typeof stream.on !== 'function') {
    guard.broken = true
    return guard
  }

  stream.on('error', (error) => {
    if (isBrokenPipeWriteError(error)) {
      guard.broken = true
      return
    }

    setImmediate(() => {
      throw error
    })
  })

  return guard
}

function canWriteToGuardedStream(stream, guard) {
  return Boolean(
    stream &&
      guard &&
      guard.broken !== true &&
      stream.destroyed !== true &&
      stream.writableEnded !== true,
  )
}

function writeToGuardedStream(stream, guard, text) {
  if (!canWriteToGuardedStream(stream, guard)) {
    return false
  }

  try {
    stream.write(text)
    return true
  } catch (error) {
    if (isBrokenPipeWriteError(error)) {
      guard.broken = true
      return false
    }

    throw error
  }
}

function formatMainDebugDetails(details) {
  if (details === undefined) {
    return ''
  }

  if (typeof details === 'string') {
    return details
  }

  try {
    const serializedDetails = JSON.stringify(details)

    return serializedDetails === undefined
      ? util.inspect(details, { depth: 4, breakLength: Infinity })
      : serializedDetails
  } catch {
    return util.inspect(details, { depth: 4, breakLength: Infinity })
  }
}

function debugMainLog(label, details) {
  const message =
    details === undefined
      ? `[main-debug] ${label}\n`
      : `[main-debug] ${label} ${formatMainDebugDetails(details)}\n`

  if (writeToGuardedStream(process.stdout, mainStdoutGuard, message)) {
    return
  }

  writeToGuardedStream(process.stderr, mainStderrGuard, message)
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
    sourceWorkspacePath: workspacePath || '',
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
    contextHub: {
      available: contextHubStatus?.available === true,
      ...(typeof contextHubStatus?.id === 'string' && contextHubStatus.id.trim()
        ? { id: contextHubStatus.id.trim() }
        : {}),
      ...(typeof contextHubStatus?.slug === 'string' && contextHubStatus.slug.trim()
        ? { slug: contextHubStatus.slug.trim() }
        : {}),
      ...(typeof contextHubStatus?.title === 'string' && contextHubStatus.title.trim()
        ? { title: contextHubStatus.title.trim() }
        : {}),
      ...(Number.isInteger(contextHubStatus?.itemsCount) &&
      contextHubStatus.itemsCount >= 0
        ? { itemsCount: contextHubStatus.itemsCount }
        : {}),
      ...(Number.isFinite(contextHubStatus?.estimatedTokens) &&
      contextHubStatus.estimatedTokens >= 0
        ? { estimatedTokens: contextHubStatus.estimatedTokens }
        : {}),
      ...(typeof contextHubStatus?.reason === 'string' && contextHubStatus.reason.trim()
        ? { reason: contextHubStatus.reason.trim() }
        : {}),
    },
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

function normalizeEventStringValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function normalizeEventStringList(entries) {
  if (!Array.isArray(entries)) {
    return []
  }

  return [...new Set(entries.map(normalizeEventStringValue).filter(Boolean))]
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

function buildExecutionFinishedEventPayload({
  finalResponse,
  requestId,
  instruction,
  workspacePath,
  decisionKey,
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
    sourceWorkspacePath: normalizeEventStringValue(workspacePath),
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
  }
}

function buildExecutionFailedEventPayload({
  finalResponse,
  requestId,
  instruction,
  workspacePath,
  decisionKey,
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
    errorPreviewSource || resultPreviewSource || normalizeEventStringValue(finalResponse?.result)

  return {
    type: 'execution_failed',
    source: 'ai-orchestrator',
    sourceApp: 'ai-orchestrator',
    sourceProject: 'ai-orchestrator',
    sourceWorkspacePath: normalizeEventStringValue(workspacePath),
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
    status:
      normalizeEventStringValue(eventPayload?.execution?.status) || 'success',
    strategy:
      normalizeEventStringValue(eventPayload?.execution?.strategy) || undefined,
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
    strategy:
      normalizeEventStringValue(eventPayload?.execution?.strategy) || undefined,
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
    skippedDuplicate,
    skippedBecauseFinished,
    ...(skippedDuplicate || skippedBecauseFinished
      ? {}
      : summarizeContextHubEventResultForLog(eventResult)),
  }
}

function hasMarkedExecutionEventRequestId(eventSet, requestId) {
  const normalizedRequestId = normalizeEventStringValue(requestId)

  if (!normalizedRequestId) {
    return false
  }

  return eventSet.has(normalizedRequestId)
}

function markExecutionEventRequestId(eventSet, requestId) {
  const normalizedRequestId = normalizeEventStringValue(requestId)

  if (!normalizedRequestId) {
    return true
  }

  if (eventSet.has(normalizedRequestId)) {
    return false
  }

  eventSet.add(normalizedRequestId)

  if (eventSet.size > MAX_EMITTED_EXECUTION_FINAL_EVENT_IDS) {
    const oldestRequestId = eventSet.values().next().value

    if (oldestRequestId) {
      eventSet.delete(oldestRequestId)
    }
  }

  return true
}

function emitExecutionFinishedEventBestEffort({
  finalResponse,
  requestId,
  instruction,
  workspacePath,
  decisionKey,
}) {
  if (!finalResponse || finalResponse.ok !== true || finalResponse.approvalRequired === true) {
    return
  }

  const eventPayload = buildExecutionFinishedEventPayload({
    finalResponse,
    requestId,
    instruction,
    workspacePath,
    decisionKey,
  })

  if (!markExecutionEventRequestId(emittedExecutionFinishedRequestIds, eventPayload.requestId)) {
    debugMainLog(
      'execute-task:context-hub-execution-finished-skipped-duplicate',
      buildExecutionFinishedEventLogSummary({
        eventPayload,
        skippedDuplicate: true,
      }),
    )
    return
  }

  void emitExecutionFinishedEvent(eventPayload)
    .then((eventResult) => {
      debugMainLog(
        'execute-task:context-hub-execution-finished',
        buildExecutionFinishedEventLogSummary({
          eventPayload,
          eventResult,
        }),
      )
    })
    .catch((error) => {
      debugMainLog('execute-task:context-hub-execution-finished', {
        ...buildExecutionFinishedEventLogSummary({
          eventPayload,
          eventResult: {
            ok: false,
            endpoint: '/v1/events',
            eventType: 'execution_finished',
            reason: 'error',
          },
        }),
        error: error instanceof Error ? error.message : String(error),
      })
    })
}

function emitExecutionFailedEventBestEffort({
  finalResponse,
  requestId,
  instruction,
  workspacePath,
  decisionKey,
}) {
  if (!finalResponse || finalResponse.ok === true || finalResponse.approvalRequired === true) {
    return
  }

  const eventPayload = buildExecutionFailedEventPayload({
    finalResponse,
    requestId,
    instruction,
    workspacePath,
    decisionKey,
  })

  if (hasMarkedExecutionEventRequestId(emittedExecutionFinishedRequestIds, eventPayload.requestId)) {
    debugMainLog(
      'execute-task:context-hub-execution-failed-skipped-finished',
      buildExecutionFailedEventLogSummary({
        eventPayload,
        skippedBecauseFinished: true,
      }),
    )
    return
  }

  if (!markExecutionEventRequestId(emittedExecutionFailedRequestIds, eventPayload.requestId)) {
    debugMainLog(
      'execute-task:context-hub-execution-failed-skipped-duplicate',
      buildExecutionFailedEventLogSummary({
        eventPayload,
        skippedDuplicate: true,
      }),
    )
    return
  }

  void emitExecutionFailedEvent(eventPayload)
    .then((eventResult) => {
      debugMainLog(
        'execute-task:context-hub-execution-failed',
        buildExecutionFailedEventLogSummary({
          eventPayload,
          eventResult,
        }),
      )
    })
    .catch((error) => {
      debugMainLog('execute-task:context-hub-execution-failed', {
        ...buildExecutionFailedEventLogSummary({
          eventPayload,
          eventResult: {
            ok: false,
            endpoint: '/v1/events',
            eventType: 'execution_failed',
            reason: 'error',
          },
        }),
        error: error instanceof Error ? error.message : String(error),
      })
    })
}

function getArtifactMemoryUserDataPath() {
  return app.getPath('userData')
}

async function pathExists(targetPath) {
  try {
    await fs.promises.access(targetPath, fs.constants.F_OK)
    return true
  } catch {
    return false
  }
}

async function resolveReusableArtifactHtmlEntry(artifact) {
  if (!artifact || typeof artifact !== 'object') {
    return ''
  }

  const candidatePaths = [
    ...(Array.isArray(artifact?.metadata?.createdPaths) ? artifact.metadata.createdPaths : []),
    artifact.localPath,
  ]
    .filter((entry) => typeof entry === 'string' && entry.trim())
    .map((entry) => path.normalize(entry.trim()))

  for (const candidatePath of candidatePaths) {
    const basename = path.basename(candidatePath).toLocaleLowerCase()

    if (basename === 'index.html' && (await pathExists(candidatePath))) {
      return candidatePath
    }

    if (await pathExists(candidatePath)) {
      try {
        const stats = await fs.promises.stat(candidatePath)
        if (stats.isDirectory()) {
          const indexPath = path.join(candidatePath, 'index.html')
          if (await pathExists(indexPath)) {
            return indexPath
          }
        }
      } catch {
        // Sigue con el siguiente candidato si este path no se puede inspeccionar.
      }
    }
  }

  return ''
}

async function captureReusableArtifactPreview({ artifact, userDataPath }) {
  const htmlEntryPath = await resolveReusableArtifactHtmlEntry(artifact)

  if (!htmlEntryPath) {
    return {
      status: 'unavailable',
      source: 'capture-page',
      errorMessage:
        'No se pudo resolver un index.html local para generar la preview real.',
    }
  }

  const { previewsDir } = await ensureArtifactMemoryStorage({ userDataPath })
  const previewPath = path.join(previewsDir, `${artifact.id}.png`)
  const previewWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    backgroundColor: '#0b1120',
  })

  try {
    await previewWindow.loadURL(pathToFileURL(htmlEntryPath).href)
    await new Promise((resolve) => setTimeout(resolve, 450))
    const image = await previewWindow.webContents.capturePage()
    await fs.promises.writeFile(previewPath, image.toPNG())

    return {
      status: 'generated',
      imagePath: previewPath,
      generatedAt: new Date().toISOString(),
      source: 'capture-page',
    }
  } catch (error) {
    return {
      status: 'failed',
      generatedAt: new Date().toISOString(),
      source: 'capture-page',
      errorMessage: error instanceof Error ? error.message : String(error),
    }
  } finally {
    if (!previewWindow.isDestroyed()) {
      previewWindow.destroy()
    }
  }
}

function buildDefaultExecutorCommand() {
  return `node "${defaultExecutorBridgePath}"`
}

function normalizeConfiguredRuntimeMode(value, validModes) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  return validModes.has(normalizedValue) ? normalizedValue : ''
}

function resolveExecutorMode() {
  const configuredMode = normalizeConfiguredRuntimeMode(
    process.env.AI_ORCHESTRATOR_EXECUTOR_MODE,
    VALID_EXECUTOR_MODES,
  )

  return {
    mode: configuredMode || 'command',
    source: configuredMode ? 'env' : 'default',
  }
}

function resolveExecutorBridgeMode() {
  const configuredMode = normalizeConfiguredRuntimeMode(
    process.env.AI_ORCHESTRATOR_BRIDGE_MODE,
    VALID_BRIDGE_MODES,
  )

  return {
    mode: configuredMode || 'codex',
    source: configuredMode ? 'env' : 'default',
  }
}

function resolveExecutorCommandValue() {
  return process.env.AI_ORCHESTRATOR_EXECUTOR_COMMAND?.trim() || buildDefaultExecutorCommand()
}

function attachExecutorRuntimeMetadata(response, runtimeMetadata) {
  if (!response || typeof response !== 'object') {
    return response
  }

  const details =
    response.details && typeof response.details === 'object' ? response.details : {}

  return {
    ...response,
    executorMode: runtimeMetadata.executorMode,
    executorModeSource: runtimeMetadata.executorModeSource,
    bridgeMode: runtimeMetadata.bridgeMode,
    bridgeModeSource: runtimeMetadata.bridgeModeSource,
    details: {
      ...details,
      executorMode: runtimeMetadata.executorMode,
      executorModeSource: runtimeMetadata.executorModeSource,
      bridgeMode: runtimeMetadata.bridgeMode,
      bridgeModeSource: runtimeMetadata.bridgeModeSource,
      ...(runtimeMetadata.executorCommand
        ? { executorCommand: runtimeMetadata.executorCommand }
        : {}),
    },
  }
}

function extractLocalMaterializationPlan(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  if (value.materializationPlan && typeof value.materializationPlan === 'object') {
    return value.materializationPlan
  }

  if (value.details && typeof value.details === 'object') {
    if (
      value.details.materializationPlan &&
      typeof value.details.materializationPlan === 'object'
    ) {
      return value.details.materializationPlan
    }
  }

  return null
}

function buildDerivedLocalMaterializationPlan({
  decisionKey,
  instruction,
  executionScope,
  businessSector,
  businessSectorLabel,
  safeFirstDeliveryMaterialization,
}) {
  return buildGenericSafeFirstDeliveryMaterializationPlan({
    decisionKey,
    instruction,
    executionScope,
    businessSector,
    businessSectorLabel,
    safeFirstDeliveryMaterialization,
  })
}

function buildMaterializeSafeFirstDeliveryLocalPlanSkipReason({
  executionScope,
  instruction,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    12,
  )

  if (allowedTargetPaths.length === 0) {
    return 'missing-allowed-target-paths'
  }

  const normalizedInstruction =
    typeof instruction === 'string' ? instruction.toLocaleLowerCase() : ''
  const normalizedAllowedPaths = allowedTargetPaths.map((entry) =>
    entry.toLocaleLowerCase(),
  )
  const expectedBasenames = ['index.html', 'styles.css', 'script.js', 'mock-data.json']
  const missingBasenames = expectedBasenames.filter(
    (basename) =>
      !normalizedAllowedPaths.some(
        (entry) => entry.endsWith(`\\${basename}`) || entry.endsWith(`/${basename}`),
      ),
  )

  if (
    missingBasenames.length > 0 &&
    !missingBasenames.every((basename) => normalizedInstruction.includes(basename))
  ) {
    return `invalid-allowed-target-paths:${missingBasenames.join(',')}`
  }

  return 'task-build-failed'
}

function buildMaterializeSafeFirstDeliveryLocalFailureResponse({
  requestId,
  instruction,
  decisionKey,
  executionScope,
  reason,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    12,
  )

  return {
    ok: false,
    ...(requestId ? { requestId } : {}),
    instruction,
    error:
      'No se pudo preparar la materializacion segura local porque el alcance permitido es invalido o incompleto.',
    resultPreview:
      'La materializacion segura local no pudo iniciarse por un alcance permitido invalido.',
    failureType: 'invalid_local_safe_first_delivery_scope',
    reasoningLayer: 'local-rules',
    materializationLayer: 'local-deterministic',
    details: {
      decisionKey,
      strategy: decisionKey,
      executionMode: 'executor',
      currentAction: 'build-local-materialization-plan',
      currentTargetPath: allowedTargetPaths[0] || undefined,
      createdPaths: [],
      touchedPaths: [],
      hasMaterialProgress: false,
      materialState: 'local-deterministic-plan-invalid',
      allowedTargetPaths,
      errorMessage: reason,
    },
  }
}

function buildLocalDeterministicTaskFromPlan({
  plan,
  workspacePath,
  requestId,
  instruction,
  brainStrategy,
  businessSector,
  businessSectorLabel,
  creativeDirection,
  reusableArtifactLookup,
  reusableArtifactsFound,
  reuseDecision,
  reuseReason,
  reusedArtifactIds,
  reuseMode,
  reuseMaterialization,
  materializationPlanSource,
}) {
  return buildLocalMaterializationTask({
    plan,
    workspacePath,
    requestId,
    instruction,
    brainStrategy,
    businessSector,
    businessSectorLabel,
    creativeDirection,
    reusableArtifactLookup,
    reusableArtifactsFound,
    reuseDecision,
    reuseReason,
    reusedArtifactIds,
    reuseMode,
    reuseMaterialization,
    materializationPlanSource,
  })
}

function mergeExecutorMaterializationResponse({
  executorResponse,
  materializationResponse,
  task,
}) {
  if (!materializationResponse || typeof materializationResponse !== 'object') {
    return executorResponse
  }

  const executorDetails =
    executorResponse?.details && typeof executorResponse.details === 'object'
      ? executorResponse.details
      : {}
  const materializationDetails =
    materializationResponse?.details &&
    typeof materializationResponse.details === 'object'
      ? materializationResponse.details
      : {}
  const combinedResult = [
    typeof executorResponse?.result === 'string' && executorResponse.result.trim()
      ? executorResponse.result.trim()
      : '',
    typeof materializationResponse?.result === 'string' &&
    materializationResponse.result.trim()
      ? materializationResponse.result.trim()
      : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    ...executorResponse,
    ...materializationResponse,
    instruction:
      materializationResponse?.instruction ||
      executorResponse?.instruction ||
      task?.instruction,
    result: combinedResult || materializationResponse?.result || executorResponse?.result,
    resultPreview:
      materializationResponse?.resultPreview ||
      executorResponse?.resultPreview ||
      buildOutputPreview(combinedResult),
    reasoningLayer:
      materializationDetails.reasoningLayer ||
      executorDetails.reasoningLayer ||
      task?.reasoningLayer ||
      undefined,
    materializationLayer:
      materializationDetails.materializationLayer ||
      executorDetails.materializationLayer ||
      task?.materializationLayer ||
      undefined,
    details: {
      ...executorDetails,
      ...materializationDetails,
      reasoningLayer:
        materializationDetails.reasoningLayer ||
        executorDetails.reasoningLayer ||
        task?.reasoningLayer ||
        undefined,
      materializationLayer:
        materializationDetails.materializationLayer ||
        executorDetails.materializationLayer ||
        task?.materializationLayer ||
        undefined,
      materializationPlanVersion:
        materializationDetails.materializationPlanVersion ||
        executorDetails.materializationPlanVersion ||
        task?.planVersion ||
        undefined,
      materializationPlanSource:
        materializationDetails.materializationPlanSource ||
        task?.materializationPlanSource ||
        undefined,
      materializationAppliedAt: new Date().toISOString(),
    },
  }
}

function parseExecutorCommand(commandValue) {
  if (typeof commandValue !== 'string' || !commandValue.trim()) {
    return null
  }

  const tokens = []
  let currentToken = ''
  let quoteChar = ''

  for (let index = 0; index < commandValue.length; index += 1) {
    const character = commandValue[index]

    if ((character === '"' || character === "'") && !quoteChar) {
      quoteChar = character
      continue
    }

    if (character === quoteChar) {
      quoteChar = ''
      continue
    }

    if (!quoteChar && /\s/.test(character)) {
      if (currentToken) {
        tokens.push(currentToken)
        currentToken = ''
      }
      continue
    }

    currentToken += character
  }

  if (quoteChar) {
    return null
  }

  if (currentToken) {
    tokens.push(currentToken)
  }

  if (tokens.length === 0) {
    return null
  }

  return {
    command: tokens[0],
    args: tokens.slice(1),
  }
}

function buildMainTraceEntry(title, content, status = 'info', raw) {
  return {
    source: 'orquestador',
    title,
    content,
    status,
    ...(raw ? { raw } : {}),
  }
}

function toSerializableIpcResult(value, fallbackErrorMessage) {
  try {
    return JSON.parse(JSON.stringify(value))
  } catch (error) {
    return {
      ok: false,
      error:
        fallbackErrorMessage || 'No se pudo serializar la respuesta para el renderer',
      details: {
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      trace: [
        buildMainTraceEntry(
          'Error serializando respuesta IPC',
          'Electron no pudo serializar la respuesta antes de entregarla al renderer.',
          'error',
          error instanceof Error ? error.stack || error.message : String(error),
        ),
      ],
    }
  }
}

function emitExecutionEvent(webContents, eventPayload) {
  if (!webContents || webContents.isDestroyed()) {
    return
  }

  try {
    webContents.send(
      EXECUTION_EVENT_CHANNEL,
      JSON.parse(JSON.stringify(eventPayload)),
    )
  } catch {
    // Ignora errores de emisión para no romper la respuesta principal.
  }
}

function emitExecutionCompleteEvent(webContents, eventPayload) {
  if (!webContents || webContents.isDestroyed()) {
    return
  }

  try {
    webContents.send(
      EXECUTION_COMPLETE_CHANNEL,
      JSON.parse(JSON.stringify(eventPayload)),
    )
  } catch {
    // Ignora errores de emision para no romper la respuesta principal.
  }
}

function buildOutputPreview(text, maxLength = 240) {
  if (typeof text !== 'string' || !text) {
    return ''
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function normalizeExecutorAttemptScope(value) {
  if (
    value === 'broad' ||
    value === 'targeted' ||
    value === 'subtask' ||
    value === 'continuation'
  ) {
    return value
  }

  return 'broad'
}

function normalizeExecutorDecisionKey(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeExecutorObjectiveScope(value) {
  if (
    value === 'single-target' ||
    value === 'single-subtask' ||
    value === 'continuation'
  ) {
    return value
  }

  return ''
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

function isMaterializeSafeFirstDeliveryDecisionKey(value) {
  return (
    typeof value === 'string' &&
    value.trim().toLocaleLowerCase() === 'materialize-safe-first-delivery-plan'
  )
}

function normalizeExecutorContinuationAnchor(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const targetPath =
    typeof value.targetPath === 'string' && value.targetPath.trim()
      ? value.targetPath.trim()
      : ''
  const subtask =
    typeof value.subtask === 'string' && value.subtask.trim() ? value.subtask.trim() : ''
  const action =
    typeof value.action === 'string' && value.action.trim() ? value.action.trim() : ''

  if (!targetPath && !subtask && !action) {
    return null
  }

  return {
    ...(targetPath ? { targetPath } : {}),
    ...(subtask ? { subtask } : {}),
    ...(action ? { action } : {}),
  }
}

function normalizeExecutorExecutionScope(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const objectiveScope = normalizeExecutorObjectiveScope(value.objectiveScope)
  const allowedTargetPaths = summarizeUniqueExecutorStrings(value.allowedTargetPaths, 12)
  const blockedTargetPaths = summarizeUniqueExecutorStrings(value.blockedTargetPaths, 8)
  const successCriteria = summarizeUniqueExecutorStrings(value.successCriteria, 8)
  const continuationAnchor = normalizeExecutorContinuationAnchor(value.continuationAnchor)
  const enforceNarrowScope = value.enforceNarrowScope === true

  if (
    !objectiveScope &&
    allowedTargetPaths.length === 0 &&
    blockedTargetPaths.length === 0 &&
    successCriteria.length === 0 &&
    !continuationAnchor &&
    enforceNarrowScope !== true
  ) {
    return null
  }

  return {
    ...(objectiveScope ? { objectiveScope } : {}),
    ...(allowedTargetPaths.length > 0 ? { allowedTargetPaths } : {}),
    ...(blockedTargetPaths.length > 0 ? { blockedTargetPaths } : {}),
    ...(successCriteria.length > 0 ? { successCriteria } : {}),
    ...(continuationAnchor ? { continuationAnchor } : {}),
    ...(enforceNarrowScope ? { enforceNarrowScope: true } : {}),
  }
}

function buildExecuteTaskRendererPayload(response, fallbackRequestId) {
  const responseRequestId =
    typeof response?.requestId === 'string' ? response.requestId.trim() : ''
  const requestId =
    typeof fallbackRequestId === 'string' && fallbackRequestId.trim()
      ? fallbackRequestId.trim()
      : responseRequestId
  const result =
    typeof response?.result === 'string' && response.result
      ? response.result
      : undefined
  const error =
    typeof response?.error === 'string' && response.error
      ? response.error
      : undefined
  const responseDetails =
    response?.details && typeof response.details === 'object' ? response.details : null
  const compactPayload = {
    ok: response?.ok === true,
    trace: [],
    ...(requestId ? { requestId } : {}),
    ...(typeof response?.instruction === 'string' && response.instruction
      ? { instruction: response.instruction }
      : {}),
    ...(result ? { result } : {}),
    ...(error ? { error } : {}),
    ...(typeof response?.approvalRequired === 'boolean'
      ? { approvalRequired: response.approvalRequired }
      : {}),
    ...(typeof response?.approvalReason === 'string' && response.approvalReason
      ? { approvalReason: response.approvalReason }
      : {}),
    ...(typeof response?.resultPreview === 'string' && response.resultPreview
      ? { resultPreview: response.resultPreview }
      : {}),
    ...(typeof response?.failureType === 'string' && response.failureType
      ? { failureType: response.failureType }
      : {}),
    ...(typeof response?.executorMode === 'string' && response.executorMode
      ? { executorMode: response.executorMode }
      : {}),
    ...(typeof response?.executorModeSource === 'string' && response.executorModeSource
      ? { executorModeSource: response.executorModeSource }
      : {}),
    ...(typeof response?.bridgeMode === 'string' && response.bridgeMode
      ? { bridgeMode: response.bridgeMode }
      : {}),
    ...(typeof response?.bridgeModeSource === 'string' && response.bridgeModeSource
      ? { bridgeModeSource: response.bridgeModeSource }
      : {}),
    ...((typeof response?.reasoningLayer === 'string' && response.reasoningLayer) ||
    (typeof responseDetails?.reasoningLayer === 'string' &&
      responseDetails.reasoningLayer)
      ? {
          reasoningLayer:
            response.reasoningLayer || responseDetails?.reasoningLayer,
        }
      : {}),
    ...((typeof response?.materializationLayer === 'string' &&
    response.materializationLayer) ||
    (typeof responseDetails?.materializationLayer === 'string' &&
      responseDetails.materializationLayer)
      ? {
          materializationLayer:
            response.materializationLayer || responseDetails?.materializationLayer,
        }
      : {}),
    ...(response?.details && typeof response.details === 'object'
      ? { details: response.details }
      : {}),
  }

  if (!compactPayload.resultPreview && result) {
    compactPayload.resultPreview = buildOutputPreview(result)
  } else if (!compactPayload.resultPreview && error) {
    compactPayload.resultPreview = buildOutputPreview(error)
  }

  return compactPayload
}

function buildExecuteTaskCompletionPayload(response, fallbackRequestId) {
  const rendererPayload = buildExecuteTaskRendererPayload(response, fallbackRequestId)
  const { trace, ...completionPayload } = rendererPayload

  return completionPayload
}

function buildExecuteTaskAcceptedAck(requestId) {
  return {
    ok: true,
    accepted: true,
    ...(requestId ? { requestId } : {}),
  }
}

function isPathInsideWorkspace(workspacePath, targetPath) {
  if (
    typeof workspacePath !== 'string' ||
    !workspacePath.trim() ||
    typeof targetPath !== 'string' ||
    !targetPath.trim()
  ) {
    return false
  }

  const relativePath = path.relative(
    path.resolve(workspacePath),
    path.resolve(targetPath),
  )

  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  )
}

function detectExecutorStructuredMaterializationIntent({
  instruction,
  context,
  executionScope,
}) {
  const combinedText = [
    typeof instruction === 'string' ? instruction : '',
    typeof context === 'string' ? context : '',
    ...(Array.isArray(executionScope?.successCriteria)
      ? executionScope.successCriteria
      : []),
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  return (
    combinedText.includes('materializacion') ||
    combinedText.includes('materialización') ||
    combinedText.includes('crear carpeta') ||
    combinedText.includes('crear archivo') ||
    combinedText.includes('index.html') ||
    combinedText.includes('styles.css') ||
    combinedText.includes('script.js') ||
    combinedText.includes('landing') ||
    combinedText.includes('scaffold')
  )
}

function resolveWorkspaceTarget(workspacePath, requestedTargetPath) {
  if (
    typeof workspacePath !== 'string' ||
    !workspacePath.trim() ||
    typeof requestedTargetPath !== 'string' ||
    !requestedTargetPath.trim()
  ) {
    return null
  }

  const resolvedWorkspacePath = path.resolve(workspacePath)
  const normalizedTargetPath = requestedTargetPath.trim()
  const resolvedTargetPath = path.resolve(resolvedWorkspacePath, normalizedTargetPath)

  if (!isPathInsideWorkspace(resolvedWorkspacePath, resolvedTargetPath)) {
    return null
  }

  return {
    workspacePath: resolvedWorkspacePath,
    requestedTargetPath: normalizedTargetPath,
    resolvedTargetPath,
    relativeTargetPath:
      path.relative(resolvedWorkspacePath, resolvedTargetPath) || normalizedTargetPath,
  }
}

function extractFileTargetPath(instruction) {
  if (typeof instruction !== 'string' || !instruction.trim()) {
    return ''
  }

  const quotedMatch =
    instruction.match(/archivo\s+\"([^\"\r\n]+)\"/i) ||
    instruction.match(/archivo\s+'([^'\r\n]+)'/i)

  if (quotedMatch?.[1]) {
    return normalizeExplicitTargetPathCandidate(quotedMatch[1])
  }

  const unquotedMatch = instruction.match(
    /archivo(?:\s+llamad[oa])?\s+([^\s,]+(?:[\\/][^\s,]+)*)/i,
  )

  return normalizeExplicitTargetPathCandidate(unquotedMatch?.[1])
}

function extractFolderTargetPath(instruction) {
  if (typeof instruction !== 'string' || !instruction.trim()) {
    return ''
  }

  const quotedMatch =
    instruction.match(
      /(?:carpeta|directorio|folder)(?:\s+(?:nuev[oa]|principal|base|local))*\s+(?:llamad[oa]|con nombre|de nombre)\s+\"([^\"\r\n]+)\"/i,
    ) ||
    instruction.match(
      /(?:carpeta|directorio|folder)(?:\s+(?:nuev[oa]|principal|base|local))*\s+(?:llamad[oa]|con nombre|de nombre)\s+'([^'\r\n]+)'/i,
    ) ||
    instruction.match(/(?:carpeta|directorio|folder)\s+(?:llamad[oa]\s+)?\"([^\"\r\n]+)\"/i) ||
    instruction.match(/(?:carpeta|directorio|folder)\s+(?:llamad[oa]\s+)?'([^'\r\n]+)'/i)

  if (quotedMatch?.[1]) {
    return normalizeExplicitTargetPathCandidate(quotedMatch[1])
  }

  const unquotedMatch = instruction.match(
    /(?:carpeta|directorio|folder)(?:\s+(?:nuev[oa]|principal|base|local))*\s+(?:llamad[oa]|con nombre|de nombre)\s+([^\s,.;:]+(?:[\\/][^\s,.;:]+)*)/i,
  )

  return normalizeExplicitTargetPathCandidate(unquotedMatch?.[1])
}

function looksLikeWorkspacePathCandidate(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false
  }

  const normalizedValue = value.trim()

  return (
    /^[a-z]:[\\/]/i.test(normalizedValue) ||
    normalizedValue.startsWith('.\\') ||
    normalizedValue.startsWith('./') ||
    normalizedValue.startsWith('..\\') ||
    normalizedValue.startsWith('../') ||
    normalizedValue.includes('\\') ||
    normalizedValue.includes('/') ||
    /^[a-z0-9][a-z0-9._-]*$/i.test(normalizedValue)
  )
}

function isDegenerateWorkspacePathCandidate(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return true
  }

  const normalizedValue = value.trim().toLocaleLowerCase()
  const normalizedLastSegment = normalizedValue
    .split(/[\\/]+/)
    .filter(Boolean)
    .at(-1)

  if (
    normalizedValue.length <= 1 &&
    !/^[a-z]:$/i.test(normalizedValue)
  ) {
    return true
  }

  return [
    normalizedValue,
    normalizedLastSegment,
  ].some((candidate) =>
    [
      'y',
      'o',
      'e',
      'de',
      'del',
      'la',
      'el',
      'los',
      'las',
      'con',
      'para',
      'en',
      'carpeta',
      'directorio',
      'archivo',
      'ruta',
      'path',
      'target',
      'destino',
      'folder',
    ].includes(candidate || ''),
  )
}

function normalizeExplicitTargetPathCandidate(value) {
  if (!looksLikeWorkspacePathCandidate(value)) {
    return ''
  }

  const normalizedValue = value.trim()

  return isDegenerateWorkspacePathCandidate(normalizedValue)
    ? ''
    : normalizedValue
}

function extractQuotedTargetPathHint(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return ''
  }

  const contextualMatch =
    text.match(
      /(?:en|ruta|path|target|destino|carpeta|folder|directorio)\s+["'“”]([^"'“”\r\n]+)["'“”]/i,
    ) ||
    text.match(
      /(?:en|ruta|path|target|destino|carpeta|folder|directorio)\s+'([^'\r\n]+)'/i,
    )

  if (contextualMatch?.[1]) {
    return normalizeExplicitTargetPathCandidate(contextualMatch[1])
  }

  const genericQuotedMatches = [...text.matchAll(/["'“”]([^"'“”\r\n]+)["'“”]/g)]

  for (const match of genericQuotedMatches) {
    const candidate = match?.[1]?.trim()

    if (candidate) {
      const normalizedCandidate = normalizeExplicitTargetPathCandidate(candidate)

      if (normalizedCandidate) {
        return normalizedCandidate
      }
    }
  }

  return ''
}

function resolveFastRouteExplicitTargetPath({
  instruction,
  context,
  executionScope,
}) {
  // Orden de prioridad:
  // 1. guards explícitos del planner/recovery,
  // 2. hints textuales del pedido,
  // 3. ningún target si el parser solo encontró ruido narrativo.
  // La fast route no debe inventar una carpeta aislada por leer frases como
  // "devolver un resumen breve de la carpeta y los archivos...".
  const scopeTargetPath =
    normalizeExplicitTargetPathCandidate(
      normalizeExecutorContinuationAnchor(executionScope?.continuationAnchor)?.targetPath,
    ) ||
    normalizeExplicitTargetPathCandidate(
      summarizeUniqueExecutorStrings(executionScope?.allowedTargetPaths, 1)[0],
    ) ||
    ''

  return (
    scopeTargetPath ||
    extractFolderTargetPath(instruction) ||
    extractFolderTargetPath(context) ||
    extractFileTargetPath(instruction) ||
    extractFileTargetPath(context) ||
    extractQuotedTargetPathHint(instruction) ||
    extractQuotedTargetPathHint(context)
  )
}

function getFastTaskOperationLabel(taskType) {
  switch (taskType) {
    case 'materialization-plan':
      return 'materialización local determinística'
    case 'composite-local':
      return 'ejecución compuesta local'
    case 'delete-file':
      return 'borrado de archivo'
    case 'delete-folder':
      return 'borrado de carpeta'
    case 'append-file':
      return 'append al final de archivo'
    case 'list-folder':
      return 'listado breve de carpeta'
    case 'exists-check':
      return 'verificación de existencia'
    case 'replace-file':
      return 'reemplazo total de archivo'
    case 'create-folder':
      return 'creación de carpeta'
    case 'create-file':
      return 'creación de archivo'
    case 'read-file':
      return 'lectura breve de archivo'
    default:
      return 'operación local'
  }
}

function buildFastLocalTracePayload(task, extra = {}) {
  return {
    strategy: 'ruta-rapida',
    operation: task.type,
    operationLabel: getFastTaskOperationLabel(task.type),
    ...(typeof task.brainStrategy === 'string' && task.brainStrategy
      ? { brainStrategy: task.brainStrategy }
      : {}),
    ...(typeof task.businessSector === 'string' && task.businessSector
      ? { businessSector: task.businessSector }
      : {}),
    ...(typeof task.businessSectorLabel === 'string' && task.businessSectorLabel
      ? { businessSectorLabel: task.businessSectorLabel }
      : {}),
    ...(task.creativeDirection &&
    typeof task.creativeDirection === 'object'
      ? {
          creativeDirection: {
            profileKey: task.creativeDirection.profileKey,
            layoutVariant: task.creativeDirection.layoutVariant,
            originalityLevel: task.creativeDirection.originalityLevel,
            visualStyle: task.creativeDirection.visualStyle,
          },
        }
      : {}),
    ...(task.relativeTargetPath ? { targetPath: task.relativeTargetPath } : {}),
    ...(typeof task.reasoningLayer === 'string' && task.reasoningLayer
      ? { reasoningLayer: task.reasoningLayer }
      : {}),
    ...(typeof task.materializationLayer === 'string' && task.materializationLayer
      ? { materializationLayer: task.materializationLayer }
      : {}),
    ...(Number.isInteger(task.planVersion)
      ? { materializationPlanVersion: task.planVersion }
      : {}),
    ...(typeof task.materializationPlanSource === 'string' && task.materializationPlanSource
      ? { materializationPlanSource: task.materializationPlanSource }
      : {}),
    ...(Array.isArray(task.steps)
      ? {
          steps: task.steps.map((step) => ({
            step: step.stepIndex,
            operation: step.type,
            operationLabel: getFastTaskOperationLabel(step.type),
            targetPath: step.relativeTargetPath,
          })),
        }
      : {}),
    ...(Array.isArray(task.operations)
      ? {
          operations: task.operations.map((operation) => ({
            step: operation.stepIndex,
            operation: operation.type,
            operationLabel: getFastTaskOperationLabel(operation.type),
            targetPath: operation.relativeTargetPath,
          })),
        }
      : {}),
    ...extra,
  }
}

function buildFastLocalSuccessDetails(task, extraDetails = {}) {
  const isWriteOperation =
    task?.type === 'replace-file' ||
    task?.type === 'create-folder' ||
    task?.type === 'create-file' ||
    task?.type === 'delete-file' ||
    task?.type === 'delete-folder' ||
    task?.type === 'append-file'
  const isCreateOperation = task?.type === 'create-folder' || task?.type === 'create-file'
  const currentTargetPath =
    typeof task?.resolvedTargetPath === 'string' && task.resolvedTargetPath.trim()
      ? task.resolvedTargetPath.trim()
      : ''

  return {
    currentAction: task?.type || undefined,
    currentTargetPath: currentTargetPath || undefined,
    createdPaths: isCreateOperation && currentTargetPath ? [currentTargetPath] : [],
    touchedPaths: isWriteOperation && currentTargetPath ? [currentTargetPath] : [],
    hasMaterialProgress: isWriteOperation,
    materialState: isWriteOperation ? 'local-fast-success' : 'local-fast-readonly',
    reasoningLayer:
      typeof task?.reasoningLayer === 'string' ? task.reasoningLayer : undefined,
    materializationLayer:
      typeof task?.materializationLayer === 'string'
        ? task.materializationLayer
        : undefined,
    materializationPlanVersion:
      Number.isInteger(task?.planVersion) ? task.planVersion : undefined,
    materializationPlanSource:
      typeof task?.materializationPlanSource === 'string'
        ? task.materializationPlanSource
        : undefined,
    appliedReuseMode:
      typeof task?.reuseMaterialization?.appliedReuseMode === 'string'
        ? task.reuseMaterialization.appliedReuseMode
        : undefined,
    reusedStyleFromArtifactId:
      typeof task?.reuseMaterialization?.reusedStyleFromArtifactId === 'string'
        ? task.reuseMaterialization.reusedStyleFromArtifactId
        : undefined,
    reusedStructureFromArtifactId:
      typeof task?.reuseMaterialization?.reusedStructureFromArtifactId === 'string'
        ? task.reuseMaterialization.reusedStructureFromArtifactId
        : undefined,
    reuseAppliedFields: Array.isArray(task?.reuseMaterialization?.reuseAppliedFields)
      ? task.reuseMaterialization.reuseAppliedFields
      : undefined,
    reuseMaterializationReason:
      typeof task?.reuseMaterialization?.reuseMaterializationReason === 'string'
        ? task.reuseMaterialization.reuseMaterializationReason
        : undefined,
    ...extraDetails,
  }
}

function buildFastLocalSuccessResponse(task, detail, details = null) {
  const operationLabel = getFastTaskOperationLabel(task.type)
  const summary = `Ruta rápida completada (${operationLabel}) sobre "${task.relativeTargetPath}".`
  const result =
    typeof detail === 'string' && detail.trim() ? `${summary}\n${detail.trim()}` : summary

  return {
    ok: true,
    ...(task.requestId ? { requestId: task.requestId } : {}),
    instruction: task.instruction,
    result,
    resultPreview: buildOutputPreview(summary),
    details:
      details && typeof details === 'object'
        ? details
        : buildFastLocalSuccessDetails(task),
  }
}

const WEB_SCAFFOLD_SECTOR_PRESETS = {
  estetica: {
    key: 'estetica',
    label: 'estetica / belleza',
    folderName: 'web-estetica-base',
    businessNoun: 'una estetica',
    brandName: 'Estética',
    metaLead:
      'Estética con tratamientos, turnos simples y una propuesta cercana para bienestar y cuidado personal.',
    heroTitle: 'Una experiencia de belleza pensada para sentirse bien.',
    heroSummaryFallback:
      'Espacio de belleza, bienestar y cuidado personal con foco en una experiencia cálida y profesional.',
    primaryCta: 'Reservar turno',
    secondaryCta: 'Ver servicios',
    heroCardLabel: 'Propuesta inicial',
    heroBullets: [
      'Atención personalizada',
      'Servicios de estética facial y corporal',
      'Ambiente calmo y profesional',
    ],
    aboutTag: 'Sobre el negocio',
    aboutTitle: 'Cuidado experto con una mirada cercana.',
    aboutCopy:
      'Una propuesta pensada para presentar tratamientos, experiencia y cercanía con un tono profesional y amable.',
    servicesTag: 'Servicios',
    servicesTitle: 'Tratamientos que se adaptan a cada necesidad.',
    serviceCards: [
      {
        title: 'Limpieza facial',
        description:
          'Una propuesta pensada para renovar, iluminar y equilibrar la piel.',
      },
      {
        title: 'Masajes relajantes',
        description: 'Un momento para bajar el ritmo y recuperar bienestar.',
      },
      {
        title: 'Tratamientos corporales',
        description:
          'Rutinas iniciales enfocadas en cuidado, tono y acompañamiento profesional.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Primeros mensajes que construyen confianza.',
    testimonials: [
      {
        quote: 'Un espacio cuidado, profesional y muy cálido para volver cada mes.',
        author: 'Cliente frecuente',
      },
      {
        quote: 'La experiencia fue simple, clara y me sentí acompañada desde el primer turno.',
        author: 'Nuevo turno',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Reservas y consultas con una experiencia clara.',
    contactCopy:
      'Un espacio pensado para sumar agenda, ubicación, horarios y servicios destacados sin perder calidez.',
    ctaButtonLabel: 'Quiero reservar un turno',
    footerCopy: 'Estética profesional - Bienestar y turnos',
    palette: {
      bg: '#f8f1ed',
      panel: '#fffaf7',
      text: '#2d1f24',
      muted: '#6e5c64',
      accent: '#c56f8c',
      accentStrong: '#9f4c67',
      border: 'rgba(45, 31, 36, 0.12)',
      shadow: '0 24px 60px rgba(84, 49, 62, 0.14)',
      highlight: 'rgba(197, 111, 140, 0.18)',
      gradientStart: '#fff8f4',
      gradientEnd: '#f7ede8',
      accentShadow: 'rgba(197, 111, 140, 0.28)',
    },
    keywords: ['estetica', 'estética', 'belleza', 'salon de belleza', 'spa'],
  },
  supermercado: {
    key: 'supermercado',
    label: 'supermercado',
    folderName: 'web-supermercado-base',
    businessNoun: 'un supermercado',
    brandName: 'Supermercado',
    metaLead:
      'Supermercado con ofertas visibles, categorías claras y una experiencia de compra simple para el barrio.',
    heroTitle: 'Todo lo esencial del barrio, en un solo lugar.',
    heroSummaryFallback:
      'Una web base para un supermercado con foco en cercanía, ofertas, categorías principales y canales de contacto simples.',
    primaryCta: 'Ver promociones',
    secondaryCta: 'Explorar categorías',
    heroCardLabel: 'Foco comercial',
    heroBullets: [
      'Promociones semanales destacadas',
      'Categorías claras para compra rápida',
      'Canal directo para consultas y pedidos',
    ],
    aboutTag: 'Sobre el negocio',
    aboutTitle: 'Una propuesta cercana para compras de todos los días.',
    aboutCopy:
      'Esta base inicial ordena la presencia digital de un supermercado con foco en conveniencia, surtido y comunicación directa.',
    servicesTag: 'Categorías',
    servicesTitle: 'Una estructura simple para destacar lo más buscado.',
    serviceCards: [
      {
        title: 'Almacén y frescos',
        description: 'Productos esenciales para resolver la compra cotidiana con rapidez.',
      },
      {
        title: 'Promociones semanales',
        description: 'Espacio claro para comunicar descuentos, combos y oportunidades.',
      },
      {
        title: 'Pedidos y consultas',
        description: 'Canal inicial para coordinar disponibilidad, horarios y atención.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Señales simples para reforzar cercanía y disponibilidad.',
    testimonials: [
      {
        quote: 'Encuentro rápido lo que necesito y siempre veo las promos destacadas.',
        author: 'Cliente habitual',
      },
      {
        quote: 'La información es clara y me ayuda a resolver la compra del día.',
        author: 'Compra semanal',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Deja visible horarios, promos y canales de consulta.',
    contactCopy:
      'La base queda lista para sumar dirección, horarios, categorías reales, promociones activas y medios de contacto.',
    ctaButtonLabel: 'Quiero ver promociones',
    footerCopy: 'Supermercado de cercanía - Promociones y categorías',
    palette: {
      bg: '#f6f6ee',
      panel: '#fffef8',
      text: '#243127',
      muted: '#5c6b5e',
      accent: '#5fa45a',
      accentStrong: '#2f7a2f',
      border: 'rgba(36, 49, 39, 0.12)',
      shadow: '0 24px 60px rgba(55, 83, 54, 0.14)',
      highlight: 'rgba(95, 164, 90, 0.18)',
      gradientStart: '#fcfff5',
      gradientEnd: '#eef4e7',
      accentShadow: 'rgba(95, 164, 90, 0.28)',
    },
    keywords: ['supermercado', 'autoservicio'],
  },
  veterinaria: {
    key: 'veterinaria',
    label: 'veterinaria',
    folderName: 'web-veterinaria-base',
    businessNoun: 'una veterinaria',
    brandName: 'Veterinaria',
    metaLead:
      'Veterinaria con atención cercana, servicios esenciales y un canal simple para turnos y consultas.',
    heroTitle: 'Cuidado profesional para las mascotas que acompañan tu vida.',
    heroSummaryFallback:
      'Una base web clara para una veterinaria, pensada para transmitir confianza, cercanía y atención responsable.',
    primaryCta: 'Pedir turno',
    secondaryCta: 'Ver servicios',
    heroCardLabel: 'Atención base',
    heroBullets: [
      'Consultas generales y controles',
      'Seguimiento cercano para mascotas y familias',
      'Información clara para turnos y urgencias',
    ],
    aboutTag: 'Sobre el negocio',
    aboutTitle: 'Una presencia digital que transmite calma y confianza.',
    aboutCopy:
      'La estructura inicial prioriza cercanía, servicios visibles y una comunicación simple para acompañar a cada mascota.',
    servicesTag: 'Servicios',
    servicesTitle: 'Lo esencial para una primera web clara y útil.',
    serviceCards: [
      {
        title: 'Consultas y controles',
        description: 'Espacio para comunicar atención general, chequeos y seguimiento.',
      },
      {
        title: 'Vacunación y prevención',
        description: 'Una sección base para reforzar cuidados preventivos y acompañamiento.',
      },
      {
        title: 'Orientación para familias',
        description: 'Canal inicial para consultas simples, turnos y primeros pasos.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Mensajes que ayudan a transmitir cercanía profesional.',
    testimonials: [
      {
        quote: 'Nos sentimos acompañados desde la primera consulta y con información muy clara.',
        author: 'Familia de paciente',
      },
      {
        quote: 'Transmiten tranquilidad y profesionalismo desde el primer contacto.',
        author: 'Cliente nuevo',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Turnos, consultas y acompañamiento visible desde el inicio.',
    contactCopy:
      'Una experiencia pensada para sumar datos de contacto, horarios, urgencias y servicios con claridad.',
    ctaButtonLabel: 'Quiero pedir un turno',
    footerCopy: 'Veterinaria - Cuidado cercano y profesional',
    palette: {
      bg: '#eff8f6',
      panel: '#fafffe',
      text: '#1d3030',
      muted: '#567170',
      accent: '#4aa7a0',
      accentStrong: '#2b7d78',
      border: 'rgba(29, 48, 48, 0.12)',
      shadow: '0 24px 60px rgba(46, 95, 92, 0.14)',
      highlight: 'rgba(74, 167, 160, 0.18)',
      gradientStart: '#f7fffd',
      gradientEnd: '#e6f3f0',
      accentShadow: 'rgba(74, 167, 160, 0.28)',
    },
    keywords: ['veterinaria', 'veterinario', 'mascotas', 'clinica veterinaria'],
  },
  'estudio-juridico': {
    key: 'estudio-juridico',
    label: 'estudio juridico',
    folderName: 'web-estudio-juridico-base',
    businessNoun: 'un estudio juridico',
    brandName: 'Estudio Jurídico',
    metaLead:
      'Estudio jurídico con servicios visibles, tono profesional y un canal claro para consultas iniciales.',
    heroTitle: 'Asesoría legal clara para tomar decisiones con respaldo.',
    heroSummaryFallback:
      'Una base institucional para un estudio jurídico con foco en confianza, claridad y presentación profesional.',
    primaryCta: 'Solicitar consulta',
    secondaryCta: 'Ver áreas de práctica',
    heroCardLabel: 'Presentación inicial',
    heroBullets: [
      'Servicios legales ordenados por especialidad',
      'Tono profesional y cercano',
      'Canal simple para consultas iniciales',
    ],
    aboutTag: 'Sobre el estudio',
    aboutTitle: 'Una primera presencia digital sobria y confiable.',
    aboutCopy:
      'La base prioriza claridad, servicios visibles y un mensaje que transmita criterio profesional desde el primer vistazo.',
    servicesTag: 'Áreas de práctica',
    servicesTitle: 'Una estructura común para explicar el acompañamiento legal.',
    serviceCards: [
      {
        title: 'Asesoría preventiva',
        description: 'Espacio para presentar orientación inicial y acompañamiento profesional.',
      },
      {
        title: 'Conflictos y representación',
        description: 'Base para comunicar experiencia, método de trabajo y etapas de intervención.',
      },
      {
        title: 'Consultas y seguimiento',
        description: 'Canal inicial para ordenar contacto, entrevistas y próximos pasos.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Elementos iniciales para reforzar solvencia y claridad.',
    testimonials: [
      {
        quote: 'La información fue clara desde el inicio y el proceso se entendió mejor.',
        author: 'Cliente asesorado',
      },
      {
        quote: 'Transmiten seriedad, orden y una comunicación muy cuidada.',
        author: 'Consulta inicial',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Consultas iniciales con información clara y profesional.',
    contactCopy:
      'Un espacio pensado para sumar especialidades, profesionales, ubicación y canales de contacto con solvencia.',
    ctaButtonLabel: 'Quiero una consulta inicial',
    footerCopy: 'Estudio jurídico - Claridad, criterio y respaldo',
    palette: {
      bg: '#f3f1ee',
      panel: '#fffdfa',
      text: '#2b2620',
      muted: '#6a6258',
      accent: '#9a7a4f',
      accentStrong: '#705533',
      border: 'rgba(43, 38, 32, 0.12)',
      shadow: '0 24px 60px rgba(73, 58, 40, 0.14)',
      highlight: 'rgba(154, 122, 79, 0.18)',
      gradientStart: '#fffdf9',
      gradientEnd: '#eee8df',
      accentShadow: 'rgba(154, 122, 79, 0.28)',
    },
    keywords: ['estudio juridico', 'estudio jurídico', 'abogado', 'abogados', 'bufete'],
  },
  restaurante: {
    key: 'restaurante',
    label: 'restaurante',
    folderName: 'web-restaurante-base',
    businessNoun: 'un restaurante',
    brandName: 'Restaurante',
    metaLead:
      'Restaurante con propuesta gastronómica clara, ambiente atractivo y un CTA directo para reservas o pedidos.',
    heroTitle: 'Una primera web para abrir el apetito desde el primer scroll.',
    heroSummaryFallback:
      'Base web para un restaurante con foco en experiencia, propuesta de valor y contacto simple para reservas.',
    primaryCta: 'Reservar mesa',
    secondaryCta: 'Ver propuesta',
    heroCardLabel: 'Experiencia inicial',
    heroBullets: [
      'Carta y propuesta destacadas',
      'Clima visual pensado para invitar',
      'CTA directo para reservas y consultas',
    ],
    aboutTag: 'Sobre el negocio',
    aboutTitle: 'Una presencia digital que invita a conocer la propuesta.',
    aboutCopy:
      'La estructura inicial combina presentación del concepto, propuesta destacada, prueba social y un contacto simple para activar reservas.',
    servicesTag: 'Propuesta',
    servicesTitle: 'Secciones base para contar qué hace especial al lugar.',
    serviceCards: [
      {
        title: 'Platos destacados',
        description: 'Base para comunicar sabores, especialidades y experiencia principal.',
      },
      {
        title: 'Ambiente y experiencia',
        description: 'Espacio para transmitir estilo, clima y ocasiones ideales.',
      },
      {
        title: 'Reservas y consultas',
        description: 'Canal inicial para convertir interés en visitas reales.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Señales iniciales para sumar deseo y credibilidad.',
    testimonials: [
      {
        quote: 'La propuesta se entiende rápido y ya da ganas de reservar.',
        author: 'Comensal frecuente',
      },
      {
        quote: 'El mensaje transmite muy bien el estilo del lugar desde el inicio.',
        author: 'Primera visita',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Reservas y consultas en un recorrido simple.',
    contactCopy:
      'Una experiencia preparada para sumar menú, horarios, reservas, ubicación y redes sin perder personalidad.',
    ctaButtonLabel: 'Quiero reservar una mesa',
    footerCopy: 'Restaurante - Experiencia, propuesta y reservas',
    palette: {
      bg: '#f8f2ea',
      panel: '#fffaf4',
      text: '#2f2218',
      muted: '#705847',
      accent: '#c56b3d',
      accentStrong: '#8f4324',
      border: 'rgba(47, 34, 24, 0.12)',
      shadow: '0 24px 60px rgba(88, 52, 32, 0.14)',
      highlight: 'rgba(197, 107, 61, 0.18)',
      gradientStart: '#fff9f1',
      gradientEnd: '#f5e9dc',
      accentShadow: 'rgba(197, 107, 61, 0.28)',
    },
    keywords: ['restaurante', 'restaurant', 'gastronomico', 'gastronomica', 'gastronomia'],
  },
  'relojeria-premium': {
    key: 'relojeria-premium',
    label: 'relojeria premium',
    folderName: 'web-relojeria-premium-base',
    businessNoun: 'una relojeria premium',
    brandName: 'Relojería Premium',
    metaLead:
      'Relojería premium con piezas curadas, tono sobrio y una presencia digital pensada para explorar colecciones.',
    heroTitle: 'Alta relojería con criterio contemporáneo y presencia precisa.',
    heroSummaryFallback:
      'Colecciones seleccionadas, precisión mecánica y una experiencia de compra cuidada para piezas excepcionales.',
    primaryCta: 'Explorar colección',
    secondaryCta: 'Solicitar cita',
    heroCardLabel: 'Colección destacada',
    heroBullets: [
      'Colecciones presentadas con una jerarquía visual sobria y precisa',
      'Piezas destacadas con foco en valor, detalle y presencia',
      'Recorrido pensado para explorar colecciones y consultas privadas',
    ],
    signalLabel: 'Experiencia privada',
    signalLines: [
      'Piezas seleccionadas con criterio, precisión y terminaciones destacadas.',
      'Asesoramiento privado para una experiencia de compra cuidada y contemporánea.',
    ],
    aboutTag: 'Marca',
    aboutTitle: 'Una presencia digital pensada para alta relojería contemporánea.',
    aboutCopy:
      'Una narrativa visual sobria y refinada para presentar piezas seleccionadas, criterio de marca y asesoramiento privado.',
    servicesTag: 'Colección',
    servicesTitle: 'Un recorrido claro para destacar piezas, valor y experiencia.',
    serviceCards: [
      {
        title: 'Piezas destacadas',
        description: 'Una selección curada para destacar referencias emblemáticas, ediciones especiales y novedades.',
      },
      {
        title: 'Colecciones y criterio',
        description: 'Una forma clara de contar origen, precisión, terminaciones y el carácter de cada colección.',
      },
      {
        title: 'Asesoramiento privado',
        description: 'Un canal pensado para consultas, citas y acompañamiento personalizado en cada decisión.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Mensajes iniciales para transmitir criterio, lujo y precisión.',
    testimonials: [
      {
        quote: 'La propuesta transmite precisión, exclusividad y una experiencia de compra realmente cuidada.',
        author: 'Coleccionista',
      },
      {
        quote: 'Se entiende el valor de las piezas y el tono premium aparece desde el primer scroll.',
        author: 'Consulta privada',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Explora colecciones y solicita asesoramiento privado.',
    contactCopy:
      'Un recorrido pensado para presentar colecciones, coordinar citas y reforzar una experiencia de compra sobria y contemporánea.',
    ctaButtonLabel: 'Explorar colección',
    footerCopy: 'Relojería premium - Colecciones seleccionadas',
    palette: {
      bg: '#f5f0e7',
      panel: '#fffaf2',
      text: '#1f1812',
      muted: '#6b5d4f',
      accent: '#b38743',
      accentStrong: '#7e5824',
      border: 'rgba(31, 24, 18, 0.12)',
      shadow: '0 24px 60px rgba(58, 40, 17, 0.14)',
      highlight: 'rgba(179, 135, 67, 0.18)',
      gradientStart: '#fffaf2',
      gradientEnd: '#efe4d2',
      accentShadow: 'rgba(179, 135, 67, 0.28)',
    },
    keywords: [
      'relojeria',
      'relojería',
      'relojes',
      'reloj',
      'watch',
      'watches',
      'watchmaking',
      'alta relojeria',
      'alta relojería',
    ],
  },
  'inmobiliaria-premium': {
    key: 'inmobiliaria-premium',
    label: 'inmobiliaria premium',
    folderName: 'web-inmobiliaria-premium-base',
    businessNoun: 'una inmobiliaria premium',
    brandName: 'Inmobiliaria Premium',
    metaLead:
      'Inmobiliaria premium con propiedades exclusivas, asesoramiento privado y una presencia digital pensada para visitas e inversión.',
    heroTitle: 'Propiedades exclusivas con criterio patrimonial y una experiencia de visita cuidada.',
    heroSummaryFallback:
      'Barrios destacados, tasaciones, asesoramiento privado y un recorrido comercial pensado para activos de alto valor.',
    primaryCta: 'Ver propiedades exclusivas',
    secondaryCta: 'Coordinar visita privada',
    heroCardLabel: 'Selecciones destacadas',
    heroBullets: [
      'Propiedades exclusivas presentadas con foco en ubicación, valor y estilo de vida',
      'Recorrido pensado para destacar desarrollos, oportunidades de inversión y barrios clave',
      'CTA claro para coordinar visitas privadas, tasaciones y asesoramiento personalizado',
    ],
    signalLabel: 'Asesoramiento privado',
    signalLines: [
      'Visitas coordinadas, análisis patrimonial y acompañamiento comercial en cada decisión.',
      'Una narrativa sobria para presentar propiedades exclusivas con criterio y claridad.',
    ],
    aboutTag: 'Firma',
    aboutTitle: 'Una presencia digital pensada para patrimonio, ubicación y confianza comercial.',
    aboutCopy:
      'Una narrativa inmobiliaria premium para mostrar activos diferenciales, barrios destacados y una experiencia de asesoramiento privado desde el primer scroll.',
    servicesTag: 'Propiedades',
    servicesTitle: 'Un recorrido claro para presentar activos, oportunidades y próximos pasos.',
    serviceCards: [
      {
        title: 'Propiedades exclusivas',
        description:
          'Espacio para destacar residencias, desarrollos y activos seleccionados con foco en ubicación, escala y valor.',
      },
      {
        title: 'Tasaciones e inversión',
        description:
          'Bloque inicial para comunicar oportunidades de inversión, valuaciones y acompañamiento patrimonial.',
      },
      {
        title: 'Visitas coordinadas',
        description:
          'Canal pensado para consultas calificadas, recorridos privados y asesoramiento comercial personalizado.',
      },
    ],
    trustTag: 'Respaldo',
    trustTitle: 'Mensajes iniciales para transmitir criterio, solvencia y acompañamiento.',
    testimonials: [
      {
        quote: 'La propuesta transmite exclusividad, claridad comercial y una experiencia acorde al nivel de las propiedades.',
        author: 'Comprador patrimonial',
      },
      {
        quote: 'Se entiende rápido el valor de la ubicación, el acompañamiento y la oportunidad de inversión.',
        author: 'Consulta privada',
      },
    ],
    contactTag: 'Visitas',
    contactTitle: 'Explora propiedades exclusivas y coordina una visita privada.',
    contactCopy:
      'Un recorrido pensado para sumar activos, barrios destacados, tasaciones, consultas privadas y próximos pasos comerciales con tono sobrio y contemporáneo.',
    ctaButtonLabel: 'Coordinar visita privada',
    footerCopy: 'Inmobiliaria premium - Propiedades exclusivas y asesoramiento privado',
    palette: {
      bg: '#f3efe8',
      panel: '#fcfaf6',
      text: '#1f232c',
      muted: '#5f6673',
      accent: '#9b7a4a',
      accentStrong: '#624826',
      border: 'rgba(31, 35, 44, 0.10)',
      shadow: '0 24px 60px rgba(31, 35, 44, 0.14)',
      highlight: 'rgba(155, 122, 74, 0.16)',
      gradientStart: '#fcfaf6',
      gradientEnd: '#ede5da',
      accentShadow: 'rgba(155, 122, 74, 0.28)',
    },
    keywords: [
      'inmobiliaria',
      'real estate',
      'propiedades',
      'propiedades exclusivas',
      'desarrollo inmobiliario',
      'desarrollos',
      'inversion inmobiliaria',
      'barrios destacados',
      'tasaciones',
      'visitas coordinadas',
    ],
  },
  'joyeria-premium': {
    key: 'joyeria-premium',
    label: 'joyeria premium',
    folderName: 'web-joyeria-premium-base',
    businessNoun: 'una joyeria premium',
    brandName: 'Joyería Premium',
    metaLead:
      'Joyería premium con piezas curadas, tono elegante y una presencia digital orientada a colección y consulta.',
    heroTitle: 'Joyería contemporánea con piezas de autor y presencia refinada.',
    heroSummaryFallback:
      'Colecciones destacadas, materiales nobles y una experiencia de compra cuidada para piezas con identidad.',
    primaryCta: 'Explorar colección',
    secondaryCta: 'Solicitar cita',
    heroCardLabel: 'Piezas destacadas',
    heroBullets: [
      'Colecciones presentadas con elegancia, detalle y ritmo visual',
      'Piezas destacadas con foco en materiales, brillo y presencia',
      'Recorrido pensado para explorar piezas y coordinar consultas privadas',
    ],
    signalLabel: 'Experiencia privada',
    signalLines: [
      'Colecciones con materiales nobles, detalle y presencia contemporánea.',
      'Consulta personalizada para acompañar decisiones con una experiencia cuidada.',
    ],
    aboutTag: 'Marca',
    aboutTitle: 'Una presencia digital clara para piezas con identidad y deseo.',
    aboutCopy:
      'Una propuesta que combina elegancia contemporánea, detalle y un recorrido comercial pensado para piezas de valor.',
    servicesTag: 'Colección',
    servicesTitle: 'Un recorrido claro para destacar piezas, marca y experiencia.',
    serviceCards: [
      {
        title: 'Colecciones destacadas',
        description: 'Base para mostrar piezas icónicas, lanzamientos y universos de producto.',
      },
      {
        title: 'Curaduría visual',
        description: 'Espacio para comunicar estilo, materiales y narrativa de marca.',
      },
      {
        title: 'Consulta privada',
        description: 'Canal inicial para ventas asistidas, citas y acompañamiento comercial.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Elementos iniciales para transmitir criterio, detalle y valor.',
    testimonials: [
      {
        quote: 'La propuesta se siente cuidada, aspiracional y muy clara para explorar piezas.',
        author: 'Cliente premium',
      },
      {
        quote: 'Hay una mezcla justa entre marca, producto y conversión comercial.',
        author: 'Consulta inicial',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Explora colecciones y agenda una consulta privada.',
    contactCopy:
      'Un espacio pensado para sumar colecciones, materiales, citas y contacto directo con una experiencia de marca cuidada.',
    ctaButtonLabel: 'Explorar colección',
    footerCopy: 'Joyería premium - Piezas y colecciones destacadas',
    palette: {
      bg: '#f8f2ec',
      panel: '#fffaf6',
      text: '#241913',
      muted: '#70584d',
      accent: '#be8b58',
      accentStrong: '#8a5d33',
      border: 'rgba(36, 25, 19, 0.12)',
      shadow: '0 24px 60px rgba(71, 47, 27, 0.14)',
      highlight: 'rgba(190, 139, 88, 0.18)',
      gradientStart: '#fffaf6',
      gradientEnd: '#efe0d1',
      accentShadow: 'rgba(190, 139, 88, 0.28)',
    },
    keywords: ['joyeria', 'joyería', 'jewelry', 'jewellery'],
  },
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function indentMultilineHtml(value, indentation = '') {
  if (typeof value !== 'string' || !value) {
    return ''
  }

  return value
    .split('\n')
    .map((line) => `${indentation}${line}`)
    .join('\n')
}

function toSafeAsciiCommentText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sanitizeBusinessSectorLabel(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s+(?:dentro|en)\s+(?:la|el|un|una)?\s*(?:raiz|root)\s+(?:del|de la)\s+(?:workspace|proyecto).*$/i, '')
    .replace(/\s+y\s+(?:devolver|crear|armar|generar|resolver|escribir).*$/i, '')
    .replace(/\s+con\s+(?:hero|sobre|servicios|contacto|cta).*$/i, '')
    .replace(
      /\s+(?:manteniendo|mantener|conservando|conservar|cambiando|cambiar|rediseñando|redisenando|rediseñar|redisenar|redefiniendo|redefinir|reutilizando|reutilizar|usando|usar|tomando|tomar|renovando|renovar|mejorando|mejorar)\b.*$/iu,
      '',
    )
    .replace(/[.,;:!?]+$/g, '')
    .trim()
}

function stripLeadingSpanishArticle(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value.replace(/^(?:un|una|el|la|los|las)\s+/i, '').trim()
}

function toTitleCaseWords(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function slugifyBusinessSector(value) {
  const normalizedValue = stripLeadingSpanishArticle(
    sanitizeBusinessSectorLabel(value),
  )

  return (
    normalizedValue
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'negocio'
  )
}

function extractGenericWebScaffoldSectorLabel(...texts) {
  const extractionPatterns = [
    /crear\s+una?\s+(?:web|pagina web|sitio(?:\s+web)?|landing)(?:\s+(?!para\b|dentro\b|en\b|con\b|y\b)[\p{L}0-9-]+){0,5}\s+para\s+(.+?)(?:[.,;:]| dentro\b| en\b| con\b| y\b|$)/iu,
    /(?:web|pagina web|sitio(?:\s+web)?|landing)(?:\s+(?!para\b|dentro\b|en\b|con\b|y\b)[\p{L}0-9-]+){0,5}\s+para\s+(.+?)(?:[.,;:]| dentro\b| en\b| con\b| y\b|$)/iu,
  ]

  for (const text of texts) {
    if (typeof text !== 'string' || !text.trim()) {
      continue
    }

    for (const pattern of extractionPatterns) {
      const match = text.match(pattern)
      const sectorLabel = sanitizeBusinessSectorLabel(match?.[1] || '')

      if (sectorLabel) {
        return sectorLabel
      }
    }
  }

  return ''
}

function buildGenericWebScaffoldSectorConfig(rawSectorLabel) {
  const sanitizedSectorLabel = sanitizeBusinessSectorLabel(rawSectorLabel)
  const sectorDisplayLabel =
    stripLeadingSpanishArticle(sanitizedSectorLabel) || sanitizedSectorLabel || 'negocio'
  const sectorSlug = slugifyBusinessSector(sanitizedSectorLabel || sectorDisplayLabel)
  const sectorBusinessNoun =
    sanitizedSectorLabel || `el rubro ${sectorDisplayLabel}`
  const sectorTitleLabel = toTitleCaseWords(sectorDisplayLabel)

  return {
    key: sectorSlug,
    label: sectorDisplayLabel,
    folderName: `web-${sectorSlug}-base`,
    businessNoun: sectorBusinessNoun,
    brandName: sectorTitleLabel,
    metaLead:
      `${sectorTitleLabel} con una web institucional clara, propuesta visible y un contacto directo para seguir creciendo.`,
    heroTitle: `Una propuesta clara para ${sectorDisplayLabel}.`,
    heroSummaryFallback:
      `Una presencia clara para ${sectorDisplayLabel}, con propuesta visible, beneficios bien ordenados y contacto directo.`,
    primaryCta: 'Solicitar información',
    secondaryCta: 'Ver propuesta',
    heroCardLabel: 'Propuesta destacada',
    heroBullets: [
      `Presentación clara para ${sectorDisplayLabel}`,
      'Propuesta o servicios visibles desde el inicio',
      'Contacto directo para convertir consultas en próximos pasos',
    ],
    aboutTag: 'Sobre el negocio',
    aboutTitle: `Una primera presencia digital para ${sectorDisplayLabel}.`,
    aboutCopy:
      `Una propuesta clara para ${sectorDisplayLabel}, pensada para mostrar valor, confianza y próximos pasos comerciales.`,
    servicesTag: 'Propuesta',
    servicesTitle: 'Una estructura simple para contar que ofrece el negocio.',
    serviceCards: [
      {
        title: 'Servicio o propuesta principal',
        description:
          `Espacio para explicar de forma clara qué hace especial a ${sectorDisplayLabel}.`,
      },
      {
        title: 'Beneficios destacados',
        description:
          'Una forma directa de mostrar ventajas, diferenciales y razones para elegir la propuesta.',
      },
      {
        title: 'Atención y contacto',
        description:
          'Canal inicial para consultas, coordinación y próximos pasos comerciales.',
      },
    ],
    trustTag: 'Confianza',
    trustTitle: 'Elementos iniciales para comunicar valor y cercanía.',
    testimonials: [
      {
        quote:
          `El mensaje deja claro qué ofrece ${sectorDisplayLabel} y cómo avanzar con una consulta.`,
        author: 'Primer contacto',
      },
      {
        quote:
          'La propuesta se entiende rápido y transmite una presencia profesional desde el inicio.',
        author: 'Consulta comercial',
      },
    ],
    contactTag: 'Contacto',
    contactTitle: 'Contacto directo para seguir la conversacion.',
    contactCopy:
      `Un recorrido pensado para sumar dirección, horarios, canales y diferenciales de ${sectorDisplayLabel} con claridad.`,
    ctaButtonLabel: 'Quiero más información',
    footerCopy: `${sectorTitleLabel} - Propuesta clara y contacto directo`,
    palette: {
      bg: '#f3f6fb',
      panel: '#fcfdff',
      text: '#1f2a37',
      muted: '#5b6676',
      accent: '#3b82f6',
      accentStrong: '#1d4ed8',
      border: 'rgba(31, 42, 55, 0.12)',
      shadow: '0 24px 60px rgba(39, 73, 128, 0.14)',
      highlight: 'rgba(59, 130, 246, 0.16)',
      gradientStart: '#f9fbff',
      gradientEnd: '#edf3fb',
      accentShadow: 'rgba(59, 130, 246, 0.28)',
    },
    keywords: [],
  }
}

function normalizeSectorDetectionText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasExplicitlyNegatedSectorKeywords(text, keywords = []) {
  const normalizedText = normalizeSectorDetectionText(text)

  if (!normalizedText || !Array.isArray(keywords) || keywords.length === 0) {
    return false
  }

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeSectorDetectionText(keyword)

    if (!normalizedKeyword) {
      return false
    }

    const negatedPattern = new RegExp(
      `\\b(?:no|sin|ni)\\s+(?:una?\\s+|el\\s+|la\\s+)?${escapeRegExp(normalizedKeyword)}\\b`,
      'i',
    )

    return negatedPattern.test(normalizedText)
  })
}

function resolveExplicitPremiumWebSectorPreset(...texts) {
  const normalizedText = normalizeSectorDetectionText(texts.join(' '))

  if (!normalizedText) {
    return null
  }

  const hasRealEstateIntent =
    /\b(?:inmobiliaria|real estate|propiedades?|propiedades exclusivas|desarrollo(?:es)?|inversion inmobiliaria|proyecto inmobiliario|proyectos inmobiliarios|barrios destacados|tasaciones?)\b/.test(
      normalizedText,
    ) &&
    !hasExplicitlyNegatedSectorKeywords(normalizedText, [
      'inmobiliaria',
      'real estate',
      'propiedad',
      'propiedades',
      'desarrollo inmobiliario',
      'desarrollos',
      'inversion inmobiliaria',
      'barrios destacados',
      'tasacion',
      'tasaciones',
    ])

  if (hasRealEstateIntent) {
    return WEB_SCAFFOLD_SECTOR_PRESETS['inmobiliaria-premium']
  }

  const hasWatchIntent =
    /\b(?:relojeria|reloj(?:es)?|watch(?:es)?|watchmaking|alta relojeria)\b/.test(
      normalizedText,
    ) &&
    !hasExplicitlyNegatedSectorKeywords(normalizedText, [
      'relojeria',
      'reloj',
      'relojes',
      'watch',
      'watches',
      'watchmaking',
      'alta relojeria',
    ])

  if (hasWatchIntent) {
    return WEB_SCAFFOLD_SECTOR_PRESETS['relojeria-premium']
  }

  const hasJewelryIntent =
    /\b(?:joyeria|jewelry|jewellery)\b/.test(normalizedText) &&
    !hasExplicitlyNegatedSectorKeywords(normalizedText, [
      'joyeria',
      'joyeria generica',
      'jewelry',
      'jewellery',
    ])

  if (hasJewelryIntent) {
    return WEB_SCAFFOLD_SECTOR_PRESETS['joyeria-premium']
  }

  return null
}

function matchesEsteticaBusinessSector(text) {
  const normalizedText = normalizeSectorDetectionText(text)

  if (!normalizedText) {
    return false
  }

  if (
    hasExplicitlyNegatedSectorKeywords(normalizedText, [
      'estetica',
      'clinica estetica',
      'centro de estetica',
      'gabinete de estetica',
      'belleza',
      'salon de belleza',
      'spa',
      'wellness',
    ])
  ) {
    return false
  }

  if (/\b(?:spa|wellness|salon de belleza|belleza)\b/.test(normalizedText)) {
    return true
  }

  if (
    /\b(?:clinica estetica|centro de estetica|gabinete de estetica|servicios de estetica|tratamientos de estetica|estetica facial|estetica corporal|estetica integral|estetica medica|estetica profesional)\b/.test(
      normalizedText,
    )
  ) {
    return true
  }

  if (
    /\b(?:para|una|un|la|el)\s+(?:clinica\s+|centro\s+de\s+|gabinete\s+de\s+)?estetica\b/.test(
      normalizedText,
    )
  ) {
    return true
  }

  if (
    /\b(?:conservar|mantener|misma|nuevo|nueva|cambiar|redisenar|rediseñar|reutilizar|reusar|tratamiento|lenguaje|direccion|paleta|tono|look|hero|estructura|visual)\s+estetica\b/.test(
      normalizedText,
    )
  ) {
    return false
  }

  if (
    /\bestetica\s+de\s+(?:lujo|marca|producto|interfaz|landing|web|sitio|hero|color|paleta|tono)\b/.test(
      normalizedText,
    )
  ) {
    return false
  }

  return /^(?:una|un|la|el)?\s*estetica(?:\s+(?:premium|integral|facial|corporal|medica|profesional))?$/.test(
    normalizedText,
  )
}

function matchesSupportedWebSectorPreset(sectorPreset, text) {
  if (!sectorPreset || typeof sectorPreset !== 'object') {
    return false
  }

  if (hasExplicitlyNegatedSectorKeywords(text, sectorPreset.keywords)) {
    return false
  }

  if (sectorPreset.key === 'estetica') {
    return matchesEsteticaBusinessSector(text)
  }

  const normalizedText = normalizeSectorDetectionText(text)

  if (!normalizedText) {
    return false
  }

  return sectorPreset.keywords.some((keyword) =>
    normalizedText.includes(normalizeSectorDetectionText(keyword)),
  )
}

function detectSupportedWebScaffoldSector(...texts) {
  const joinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')

  if (!joinedText) {
    return null
  }

  const sectorPresets = Object.values(WEB_SCAFFOLD_SECTOR_PRESETS)

  return (
    sectorPresets.find((sectorPreset) =>
      matchesSupportedWebSectorPreset(sectorPreset, joinedText),
    ) || null
  )
}

function resolveWebScaffoldSectorConfig({
  businessSector,
  businessSectorLabel,
  instruction,
  context,
}) {
  const normalizedBusinessSector =
    typeof businessSector === 'string' ? businessSector.trim().toLocaleLowerCase() : ''
  const explicitSectorConfig = normalizedBusinessSector
    ? WEB_SCAFFOLD_SECTOR_PRESETS[normalizedBusinessSector] || null
    : null

  if (explicitSectorConfig) {
    return {
      ...explicitSectorConfig,
      label:
        typeof businessSectorLabel === 'string' && businessSectorLabel.trim()
          ? businessSectorLabel.trim()
          : explicitSectorConfig.label,
    }
  }

  if (normalizedBusinessSector) {
    return buildGenericWebScaffoldSectorConfig(
      businessSectorLabel || businessSector,
    )
  }

  const explicitPremiumSector = resolveExplicitPremiumWebSectorPreset(
    instruction,
    context,
    businessSectorLabel,
  )

  if (explicitPremiumSector) {
    return explicitPremiumSector
  }

  const explicitBusinessLabel =
    extractExplicitBusinessLabelFromPlanningText(instruction, context) ||
    extractGenericWebScaffoldSectorLabel(instruction, context)

  if (explicitBusinessLabel) {
    return (
      resolveExplicitPremiumWebSectorPreset(explicitBusinessLabel) ||
      detectSupportedWebScaffoldSector(explicitBusinessLabel) ||
      buildGenericWebScaffoldSectorConfig(explicitBusinessLabel)
    )
  }

  const detectedSupportedSector = detectSupportedWebScaffoldSector(
    instruction,
    context,
  )

  if (detectedSupportedSector) {
    return detectedSupportedSector
  }

  return null
}

function detectWebOriginalityLevel(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return 'standard'
  }

  if (
    /s[uú]per\s+original|muy\s+original|nunca\s+vist[oa]|muy\s+distint[oa]|rompedor|arriesgad[oa]|fuera\s+de\s+lo\s+com[uú]n/i.test(
      combinedText,
    )
  ) {
    return 'high'
  }

  if (/original|distint[oa]|creativ[oa]|diferent[ea]/i.test(combinedText)) {
    return 'elevated'
  }

  return 'standard'
}

function buildWebCreativeDirection({
  goal,
  context,
  sectorConfig,
}) {
  // La creatividad local no intenta reemplazar un director de arte completo:
  // solo genera una semilla suficientemente distinta para que planner y fast
  // route no reciclen la misma landing entre rubros incompatibles.
  const joinedText = [goal, context, sectorConfig?.label, sectorConfig?.businessNoun]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedJoinedText = normalizeSectorDetectionText(joinedText)
  const originalityLevel = detectWebOriginalityLevel(goal, context)
  const normalizedSectorPrimaryCta =
    typeof sectorConfig?.primaryCta === 'string'
      ? sectorConfig.primaryCta.trim().toLocaleLowerCase()
      : ''
  const normalizedSectorSecondaryCta =
    typeof sectorConfig?.secondaryCta === 'string'
      ? sectorConfig.secondaryCta.trim().toLocaleLowerCase()
      : ''
  const sectorPrimaryCtaLooksGeneric =
    !normalizedSectorPrimaryCta ||
    normalizedSectorPrimaryCta === 'solicitar informacion' ||
    normalizedSectorPrimaryCta === 'contactar ahora' ||
    normalizedSectorPrimaryCta === 'hacer una consulta'
  const sectorSecondaryCtaLooksGeneric =
    !normalizedSectorSecondaryCta ||
    normalizedSectorSecondaryCta === 'ver propuesta'
  const sectorProfileMap = {
    'relojeria-premium': 'editorial-premium',
    'joyeria-premium': 'editorial-premium',
    'inmobiliaria-premium': 'real-estate-premium',
  }
  let profileKey =
    typeof sectorConfig?.key === 'string' && sectorProfileMap[sectorConfig.key]
      ? sectorProfileMap[sectorConfig.key]
      : 'balanced-brand'

  if (
    /inmobiliaria|real estate|desarrollo|desarrollos|amenities|propiedades|inversion|residencial|desarrollo premium|residencial premium|proyecto inmobiliario|proyectos inmobiliarios/.test(
      normalizedJoinedText,
    )
  ) {
    profileKey = 'real-estate-premium'
  } else if (/joyeria|relojeria|atelier|boutique|lux/.test(normalizedJoinedText)) {
    profileKey = 'editorial-premium'
  } else if (/discoteca|boliche|nightclub|club\s+nocturno|fiesta|dj|evento\s+nocturno/i.test(joinedText)) {
    profileKey = 'immersive-night'
  } else if (
    /ropa|streetwear|urbana|indumentaria|fashion|moda|lookbook|coleccion|drop|branding/.test(
      normalizedJoinedText,
    )
  ) {
    profileKey = 'fashion-editorial'
  } else if (
    /gimnasio|fitness|entrenamiento|crossfit|musculacion|membresia|clases|alto rendimiento|performance|workout/.test(
      normalizedJoinedText,
    )
  ) {
    profileKey = 'fitness-performance'
  } else if (/hospital|clinica|sanatorio|salud|centro medico|guardia/.test(normalizedJoinedText)) {
    profileKey = 'trusted-institutional'
  } else if (
    /estudio juridico|juridico|abogad|legal|contable|contador|impositivo|tributario|compliance|societario/.test(
      normalizedJoinedText,
    )
  ) {
    profileKey = 'formal-advisory'
  } else if (/restaurante|gastronom|bar|cafeteria|bistro/.test(normalizedJoinedText)) {
    profileKey = 'sensory-showcase'
  } else if (/veterinaria|estetica|belleza|spa|wellness/.test(normalizedJoinedText)) {
    profileKey = 'warm-studio'
  } else if (/supermercado|ferreteria|remiseria|inmobiliaria|estacion de trenes|traslado|servicio/.test(normalizedJoinedText)) {
    profileKey = 'practical-service'
  }

  const creativityProfiles = {
    'editorial-premium': {
      experienceType: 'editorial-premium',
      visualStyle: originalityLevel === 'high' ? 'luxury-editorial-experimental' : 'luxury-editorial',
      tone: 'elegante, aspiracional y curado',
      heroStyle: originalityLevel === 'high' ? 'statement-mosaic' : 'statement-split',
      layoutVariant: originalityLevel === 'high' ? 'editorial-mosaic' : 'editorial-gallery',
      layoutRhythm: 'airy',
      contentDensity: originalityLevel === 'high' ? 'low' : 'medium',
      primaryCta: 'Explorar colección',
      secondaryCta: 'Descubrir piezas',
      sectionOrder: ['services', 'about', 'trust', 'contact'],
      prioritySections: ['colecciones', 'marca', 'piezas destacadas', 'contacto'],
      heroEyebrow: 'Direccion editorial',
      heroPanelTitle: 'Colecciones y piezas destacadas',
      heroPanelItems: [
        'Presentación de piezas icónicas y colecciones',
        'Espacios con aire visual y foco en marca',
        'Recorrido pensado para consultas privadas o citas',
      ],
      sectionLabels: {
        aboutTag: 'Marca',
        servicesTag: 'Colecciones',
        trustTag: 'Deseo y confianza',
        contactTag: 'Contacto privado',
      },
      typography: {
        headingFamily: '"Cormorant Garamond", serif',
        bodyFamily: '"Manrope", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap',
      },
      paletteSuggestion: originalityLevel === 'high'
        ? {
            accent: '#a66bff',
            accentStrong: '#7040d0',
            highlight: 'rgba(166, 107, 255, 0.18)',
          }
        : {
            accent: '#b78752',
            accentStrong: '#7b5632',
          },
    },
    'immersive-night': {
      experienceType: 'impacto-nocturno',
      visualStyle: originalityLevel === 'high' ? 'neon-club-experimental' : 'neon-club',
      tone: 'intenso, nocturno y de alto impacto',
      heroStyle: 'poster-stack',
      layoutVariant: 'immersive-pulse',
      layoutRhythm: 'dynamic',
      contentDensity: 'medium',
      primaryCta: 'Reservar acceso',
      secondaryCta: 'Ver agenda',
      sectionOrder: ['services', 'trust', 'about', 'contact'],
      prioritySections: ['agenda', 'reservas', 'ambiente', 'contacto'],
      heroEyebrow: 'Night experience',
      heroPanelTitle: 'Agenda, reservas y ambiente',
      heroPanelItems: [
        'Foco en eventos, fechas y ambientacion',
        'CTA rápido para reservas o listas',
        'Visual más enérgico que institucional',
      ],
      sectionLabels: {
        aboutTag: 'Ambiente',
        servicesTag: 'Agenda',
        trustTag: 'Experiencia',
        contactTag: 'Reservas',
      },
      typography: {
        headingFamily: '"Bebas Neue", sans-serif',
        bodyFamily: '"Space Grotesk", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;700&display=swap',
      },
      paletteSuggestion: {
        bg: '#0c0914',
        panel: 'rgba(19, 14, 35, 0.82)',
        text: '#f7f3ff',
        muted: '#b7afd4',
        accent: originalityLevel === 'high' ? '#ff4db8' : '#7c5cff',
        accentStrong: originalityLevel === 'high' ? '#ff187b' : '#4d2dd8',
        border: 'rgba(247, 243, 255, 0.10)',
        shadow: '0 28px 72px rgba(8, 5, 18, 0.45)',
        highlight: originalityLevel === 'high'
          ? 'rgba(255, 77, 184, 0.22)'
          : 'rgba(124, 92, 255, 0.18)',
        gradientStart: '#120c24',
        gradientEnd: '#05040b',
        accentShadow: originalityLevel === 'high'
          ? 'rgba(255, 77, 184, 0.34)'
          : 'rgba(124, 92, 255, 0.34)',
      },
    },
    'fashion-editorial': {
      experienceType: 'marca-editorial-comercial',
      visualStyle: originalityLevel === 'high' ? 'street-editorial-bold' : 'street-editorial',
      tone: 'aspiracional, visual y con foco en colección',
      heroStyle: originalityLevel === 'high' ? 'lookbook-mosaic' : 'lookbook-stack',
      layoutVariant: originalityLevel === 'high' ? 'editorial-mosaic' : 'lookbook-flow',
      layoutRhythm: 'dynamic',
      contentDensity: originalityLevel === 'high' ? 'low' : 'medium',
      primaryCta:
        !sectorPrimaryCtaLooksGeneric && sectorConfig?.primaryCta
          ? sectorConfig.primaryCta
          : 'Explorar colección',
      secondaryCta:
        !sectorSecondaryCtaLooksGeneric && sectorConfig?.secondaryCta
          ? sectorConfig.secondaryCta
          : 'Ver lookbook',
      sectionOrder: ['about', 'services', 'contact', 'trust'],
      prioritySections: ['coleccion', 'drop destacado', 'universo visual', 'comunidad'],
      heroEyebrow: 'Drop editorial',
      heroPanelTitle: 'Colección, actitud y marca',
      heroPanelItems: [
        'Narrativa visual primero, detalle después',
        'Jerarquía pensada para colecciones y lanzamientos',
        'CTA orientado a explorar, seguir el drop o comprar',
      ],
      sectionLabels: {
        aboutTag: sectorConfig?.aboutTag || 'Marca',
        servicesTag: sectorConfig?.servicesTag || 'Colección',
        trustTag: sectorConfig?.trustTag || 'Comunidad',
        contactTag: sectorConfig?.contactTag || 'Drop',
      },
      typography: {
        headingFamily: '"Oswald", sans-serif',
        bodyFamily: '"Space Grotesk", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap',
      },
      paletteSuggestion: {
        bg: '#f4f1ec',
        panel: '#fffaf4',
        text: '#161616',
        muted: '#5f5a54',
        accent: originalityLevel === 'high' ? '#ff5a1f' : '#111111',
        accentStrong: originalityLevel === 'high' ? '#bf3300' : '#2a2a2a',
        border: 'rgba(22, 22, 22, 0.12)',
        shadow: '0 28px 72px rgba(22, 22, 22, 0.16)',
        highlight: originalityLevel === 'high'
          ? 'rgba(255, 90, 31, 0.18)'
          : 'rgba(17, 17, 17, 0.08)',
      },
    },
    'real-estate-premium': {
      experienceType: 'inversion-editorial',
      visualStyle: originalityLevel === 'high'
        ? 'architectural-signature'
        : 'architectural-premium',
      tone: 'sereno, aspiracional y orientado a inversión',
      heroStyle: originalityLevel === 'high' ? 'statement-mosaic' : 'statement-split',
      layoutVariant: originalityLevel === 'high' ? 'editorial-mosaic' : 'editorial-gallery',
      layoutRhythm: 'airy',
      contentDensity: 'medium',
      primaryCta:
        !sectorPrimaryCtaLooksGeneric && sectorConfig?.primaryCta
          ? sectorConfig.primaryCta
          : 'Agendar visita',
      secondaryCta:
        !sectorSecondaryCtaLooksGeneric && sectorConfig?.secondaryCta
          ? sectorConfig.secondaryCta
          : 'Ver desarrollos',
      sectionOrder: ['services', 'trust', 'about', 'contact'],
      prioritySections: ['desarrollos', 'amenities', 'inversion', 'consulta'],
      heroEyebrow: 'Desarrollos y patrimonio',
      heroPanelTitle: 'Proyectos, ubicación y valor',
      heroPanelItems: [
        'Presentación premium con foco en activos y proyecto',
        'Jerarquía visual pensada para desarrollos y amenities',
        'CTA claro para visitas, consultas e inversión',
      ],
      sectionLabels: {
        aboutTag: sectorConfig?.aboutTag || 'Desarrolladora',
        servicesTag: sectorConfig?.servicesTag || 'Proyectos',
        trustTag: sectorConfig?.trustTag || 'Valor',
        contactTag: sectorConfig?.contactTag || 'Visitas',
      },
      typography: {
        headingFamily: '"Playfair Display", serif',
        bodyFamily: '"Inter Tight", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap',
      },
      paletteSuggestion: {
        bg: '#f4f2ed',
        panel: '#fdfbf7',
        text: '#1f2430',
        muted: '#5d6470',
        accent: '#9a7a45',
        accentStrong: '#624824',
        border: 'rgba(31, 36, 48, 0.10)',
        shadow: '0 28px 72px rgba(31, 36, 48, 0.12)',
        highlight: 'rgba(154, 122, 69, 0.16)',
      },
    },
    'trusted-institutional': {
      experienceType: 'confianza-funcional',
      visualStyle: originalityLevel === 'high' ? 'clarity-with-signature' : 'clarity-first',
      tone: 'claro, confiable y ordenado',
      heroStyle: 'info-first',
      layoutVariant: 'structured-trust',
      layoutRhythm: 'structured',
      contentDensity: 'high',
      primaryCta: 'Solicitar orientación',
      secondaryCta: 'Ver servicios clave',
      sectionOrder: ['services', 'about', 'trust', 'contact'],
      prioritySections: ['servicios', 'credenciales', 'orientacion', 'contacto'],
      heroEyebrow: 'Información prioritaria',
      heroPanelTitle: 'Accesos rápidos y confianza',
      heroPanelItems: [
        'Lectura clara, orden y jerarquia informativa',
        'Canales directos para orientación inicial',
        'Enfasis en accesibilidad y respaldo profesional',
      ],
      sectionLabels: {
        aboutTag: 'Atención',
        servicesTag: 'Servicios clave',
        trustTag: 'Respaldo',
        contactTag: 'Orientación',
      },
      typography: {
        headingFamily: '"Source Serif 4", serif',
        bodyFamily: '"IBM Plex Sans", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Source+Serif+4:wght@600;700&display=swap',
      },
      paletteSuggestion: {
        bg: '#eef5fb',
        panel: '#fbfdff',
        text: '#18324a',
        muted: '#567086',
        accent: '#2d7fb8',
        accentStrong: '#1f5d86',
        highlight: 'rgba(45, 127, 184, 0.14)',
      },
    },
    'formal-advisory': {
      experienceType: 'autoridad-metodica',
      visualStyle: originalityLevel === 'high'
        ? 'institutional-ledger-signature'
        : 'institutional-ledger',
      tone: 'sobrio, preciso y metodico',
      heroStyle: 'authority-columns',
      layoutVariant: originalityLevel === 'high' ? 'structured-trust' : 'evidence-ledger',
      layoutRhythm: 'measured',
      contentDensity: 'high',
      primaryCta:
        !sectorPrimaryCtaLooksGeneric && sectorConfig?.primaryCta
          ? sectorConfig.primaryCta
          : 'Solicitar consulta',
      secondaryCta:
        !sectorSecondaryCtaLooksGeneric && sectorConfig?.secondaryCta
          ? sectorConfig.secondaryCta
          : 'Ver áreas de práctica',
      sectionOrder: ['trust', 'services', 'about', 'contact'],
      prioritySections: ['credenciales', 'areas de practica', 'metodologia', 'consulta'],
      heroEyebrow: 'Respaldo profesional',
      heroPanelTitle: 'Criterio, orden y especialidad',
      heroPanelItems: [
        'Credenciales y especialidades al primer vistazo',
        'Lectura jerárquica pensada para evaluar solvencia',
        'CTA claro para consultas iniciales bien calificadas',
      ],
      sectionLabels: {
        aboutTag: sectorConfig?.aboutTag || 'Estudio',
        servicesTag: sectorConfig?.servicesTag || 'Especialidades',
        trustTag: sectorConfig?.trustTag || 'Credenciales',
        contactTag: sectorConfig?.contactTag || 'Consulta',
      },
      typography: {
        headingFamily: '"Libre Baskerville", serif',
        bodyFamily: '"Inter Tight", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=Libre+Baskerville:wght@400;700&display=swap',
      },
      paletteSuggestion: {
        bg: '#f2f0ec',
        panel: '#fdfbf8',
        text: '#241f1a',
        muted: '#655c53',
        accent: '#6d5a43',
        accentStrong: '#463828',
        border: 'rgba(36, 31, 26, 0.12)',
        shadow: '0 24px 60px rgba(62, 49, 37, 0.12)',
        highlight: 'rgba(109, 90, 67, 0.14)',
      },
    },
    'fitness-performance': {
      experienceType: 'conversion-energetica',
      visualStyle: originalityLevel === 'high'
        ? 'performance-voltage'
        : 'performance-burst',
      tone: 'enérgico, desafiante y orientado a accion',
      heroStyle: originalityLevel === 'high' ? 'poster-stack' : 'performance-mosaic',
      layoutVariant: 'editorial-mosaic',
      layoutRhythm: 'dynamic',
      contentDensity: 'medium',
      primaryCta:
        !sectorPrimaryCtaLooksGeneric && sectorConfig?.primaryCta
          ? sectorConfig.primaryCta
          : 'Probar una clase',
      secondaryCta:
        !sectorSecondaryCtaLooksGeneric && sectorConfig?.secondaryCta
          ? sectorConfig.secondaryCta
          : 'Ver planes',
      sectionOrder: ['services', 'trust', 'contact', 'about'],
      prioritySections: ['clases', 'planes', 'comunidad', 'prueba inicial'],
      heroEyebrow: 'Ritmo y rendimiento',
      heroPanelTitle: 'Clases, energia y conversion',
      heroPanelItems: [
        'Impacto visual inmediato y CTA de prueba rapida',
        'Oferta centrada en planes, intensidad y comunidad',
        'Ritmo dinamico pensado para conversion de membresias',
      ],
      sectionLabels: {
        aboutTag: sectorConfig?.aboutTag || 'Comunidad',
        servicesTag: sectorConfig?.servicesTag || 'Clases',
        trustTag: sectorConfig?.trustTag || 'Resultados',
        contactTag: sectorConfig?.contactTag || 'Prueba',
      },
      typography: {
        headingFamily: '"Bebas Neue", sans-serif',
        bodyFamily: '"Inter", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap',
      },
      paletteSuggestion: {
        bg: '#0b0f13',
        panel: 'rgba(16, 22, 28, 0.84)',
        text: '#eef3f7',
        muted: '#a6b3bf',
        accent: originalityLevel === 'high' ? '#ff5f1f' : '#c7ff2f',
        accentStrong: originalityLevel === 'high' ? '#b93300' : '#7aa300',
        border: 'rgba(238, 243, 247, 0.10)',
        shadow: '0 28px 72px rgba(4, 8, 12, 0.44)',
        highlight: originalityLevel === 'high'
          ? 'rgba(255, 95, 31, 0.22)'
          : 'rgba(199, 255, 47, 0.18)',
        gradientStart: '#131922',
        gradientEnd: '#040608',
        accentShadow: originalityLevel === 'high'
          ? 'rgba(255, 95, 31, 0.34)'
          : 'rgba(199, 255, 47, 0.28)',
      },
    },
    'warm-studio': {
      experienceType: 'cercania-curada',
      visualStyle: originalityLevel === 'high' ? 'soft-editorial' : 'soft-signature',
      tone: 'cercano, cuidado y contemporaneo',
      heroStyle: 'soft-split',
      layoutVariant: originalityLevel === 'high' ? 'editorial-mosaic' : 'balanced-studio',
      layoutRhythm: 'airy',
      contentDensity: 'medium',
      primaryCta: sectorConfig?.primaryCta || 'Quiero reservar',
      secondaryCta: sectorConfig?.secondaryCta || 'Ver experiencia',
      sectionOrder: ['about', 'services', 'trust', 'contact'],
      prioritySections: ['experiencia', 'servicios', 'confianza', 'contacto'],
      heroEyebrow: 'Experiencia cercana',
      heroPanelTitle: 'Bienestar, cercanía y claridad',
      heroPanelItems: [
        'Presentación suave con foco en confianza',
        'Servicios visibles sin saturar la página',
        'CTA simple para dar el siguiente paso',
      ],
      sectionLabels: {
        aboutTag: sectorConfig?.aboutTag || 'Sobre el negocio',
        servicesTag: sectorConfig?.servicesTag || 'Servicios',
        trustTag: sectorConfig?.trustTag || 'Confianza',
        contactTag: sectorConfig?.contactTag || 'Contacto',
      },
      typography: {
        headingFamily: '"Fraunces", serif',
        bodyFamily: '"Manrope", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700&display=swap',
      },
      paletteSuggestion: {
        accent: '#d36f7b',
        accentStrong: '#93424d',
      },
    },
    'sensory-showcase': {
      experienceType: 'showcase-sensorial',
      visualStyle: originalityLevel === 'high' ? 'gastronomic-storytelling-bold' : 'gastronomic-storytelling',
      tone: 'atractivo, sensorial y memorable',
      heroStyle: 'story-poster',
      layoutVariant: originalityLevel === 'high' ? 'editorial-mosaic' : 'immersive-pulse',
      layoutRhythm: 'dynamic',
      contentDensity: 'medium',
      primaryCta: sectorConfig?.primaryCta || 'Reservar ahora',
      secondaryCta: sectorConfig?.secondaryCta || 'Ver propuesta',
      sectionOrder: ['services', 'about', 'trust', 'contact'],
      prioritySections: ['platos', 'experiencia', 'prueba social', 'reservas'],
      heroEyebrow: 'Experiencia destacada',
      heroPanelTitle: 'Propuesta, ambiente y reservas',
      heroPanelItems: [
        'Visual más sensorial que institucional',
        'Contenido pensado para abrir apetito o curiosidad',
        'CTA visible para activar reservas',
      ],
      sectionLabels: {
        aboutTag: 'Concepto',
        servicesTag: 'Propuesta',
        trustTag: 'Experiencias',
        contactTag: 'Reservas',
      },
      typography: {
        headingFamily: '"DM Serif Display", serif',
        bodyFamily: '"Plus Jakarta Sans", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;700&display=swap',
      },
      paletteSuggestion: {
        accent: '#df6f2d',
        accentStrong: '#9b4317',
      },
    },
    'practical-service': {
      experienceType: 'servicio-directo',
      visualStyle: originalityLevel === 'high' ? 'urban-signal' : 'practical-clear',
      tone: 'directo, útil y orientado a acción',
      heroStyle: 'quick-actions',
      layoutVariant: originalityLevel === 'high' ? 'structured-trust' : 'balanced-studio',
      layoutRhythm: 'compact',
      contentDensity: 'high',
      primaryCta: sectorConfig?.primaryCta || 'Hacer una consulta',
      secondaryCta: sectorConfig?.secondaryCta || 'Ver propuesta',
      sectionOrder: ['services', 'trust', 'about', 'contact'],
      prioritySections: ['servicio', 'beneficios', 'cobertura', 'contacto'],
      heroEyebrow: 'Accion rapida',
      heroPanelTitle: 'Lo esencial al primer vistazo',
      heroPanelItems: [
        'Información visible sin rodeos',
        'CTA rápido y propuesta entendible',
        'Jerarquía pensada para resolver consultas rápido',
      ],
      sectionLabels: {
        aboutTag: 'Servicio',
        servicesTag: 'Soluciones',
        trustTag: 'Ventajas',
        contactTag: 'Contacto',
      },
      typography: {
        headingFamily: '"Sora", sans-serif',
        bodyFamily: '"Public Sans", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;700&family=Sora:wght@500;600;700&display=swap',
      },
      paletteSuggestion: {
        accent: '#2667ff',
        accentStrong: '#1940a6',
      },
    },
    'balanced-brand': {
      experienceType: 'institucional-flexible',
      visualStyle: originalityLevel === 'high' ? 'conceptual-balanced' : 'balanced-brand',
      tone: 'claro, adaptable y editable',
      heroStyle: 'split-balance',
      layoutVariant: originalityLevel === 'high' ? 'editorial-mosaic' : 'balanced-studio',
      layoutRhythm: 'balanced',
      contentDensity: 'medium',
      primaryCta: sectorConfig?.primaryCta || 'Contactar ahora',
      secondaryCta: sectorConfig?.secondaryCta || 'Ver propuesta',
      sectionOrder: ['about', 'services', 'trust', 'contact'],
      prioritySections: ['marca', 'propuesta', 'confianza', 'contacto'],
      heroEyebrow: 'Direccion base',
      heroPanelTitle: 'Estructura lista para iterar',
      heroPanelItems: [
        'Base institucional adaptable al rubro',
        'Secciones editables y CTA claro',
        'Espacio para sumar identidad real luego',
      ],
      sectionLabels: {
        aboutTag: sectorConfig?.aboutTag || 'Sobre el negocio',
        servicesTag: sectorConfig?.servicesTag || 'Propuesta',
        trustTag: sectorConfig?.trustTag || 'Confianza',
        contactTag: sectorConfig?.contactTag || 'Contacto',
      },
      typography: {
        headingFamily: '"Outfit", sans-serif',
        bodyFamily: '"Manrope", sans-serif',
        fontHref:
          'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap',
      },
      paletteSuggestion: {
        accent: '#4f46e5',
        accentStrong: '#312e81',
      },
    },
  }

  const selectedProfile =
    creativityProfiles[profileKey] || creativityProfiles['balanced-brand']

  return {
    profileKey,
    originalityLevel,
    ...selectedProfile,
    cta: {
      primary: selectedProfile.primaryCta,
      secondary: selectedProfile.secondaryCta,
    },
    layoutCriteria: [
      `Experiencia: ${selectedProfile.experienceType}`,
      `Estilo visual: ${selectedProfile.visualStyle}`,
      `Hero: ${selectedProfile.heroStyle}`,
      `Ritmo de layout: ${selectedProfile.layoutRhythm}`,
      `Originalidad: ${originalityLevel}`,
    ],
  }
}

function extractExplicitWebScaffoldFolderName(...texts) {
  for (const text of texts) {
    const folderTargetPath = extractFolderTargetPath(text)

    if (folderTargetPath && !path.extname(folderTargetPath)) {
      return folderTargetPath
    }
  }

  return ''
}

function buildWebScaffoldBaseFolderName(sectorInput) {
  const explicitFolderName =
    typeof sectorInput === 'object' &&
    sectorInput &&
    typeof sectorInput.explicitFolderName === 'string'
      ? sectorInput.explicitFolderName.trim()
      : ''

  if (explicitFolderName) {
    return explicitFolderName
  }

  const resolvedSectorConfig =
    typeof sectorInput === 'object' && sectorInput
      ? sectorInput
      : WEB_SCAFFOLD_SECTOR_PRESETS[sectorInput] || WEB_SCAFFOLD_SECTOR_PRESETS.estetica

  return (
    resolvedSectorConfig?.folderName ||
    WEB_SCAFFOLD_SECTOR_PRESETS.estetica.folderName
  )
}

function detectExtendedWebScaffoldDeliverables(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  const extendedDeliverablePatterns = [
    'readme',
    '.env.example',
    'env example',
    'asset',
    'assets',
    'logo',
    'imagenes',
    'imágenes',
    'branch local',
    'rama local',
    'feature/',
    'commit local',
    'git commit',
    'git branch',
  ]

  return extendedDeliverablePatterns.some((pattern) => combinedText.includes(pattern))
}

function buildWebScaffoldBaseExecutionScope(sectorConfig) {
  const scaffoldFolderName = buildWebScaffoldBaseFolderName(sectorConfig)
  const scaffoldPaths = [
    scaffoldFolderName,
    path.join(scaffoldFolderName, 'index.html'),
    path.join(scaffoldFolderName, 'styles.css'),
    path.join(scaffoldFolderName, 'script.js'),
  ]

  return {
    allowedTargetPaths: scaffoldPaths,
    successCriteria: [
      `Materializar solo la carpeta "${scaffoldFolderName}" con index.html, styles.css y script.js.`,
      'No incluir assets extra, README.md, .env.example, ramas ni commits locales en esta primera iteración.',
      'Devolver un resumen breve de la carpeta y los archivos creados o editados.',
    ],
    enforceNarrowScope: true,
  }
}

function normalizeReusableArtifactMatch(match) {
  if (!match || typeof match !== 'object') {
    return null
  }

  const matchId = typeof match.id === 'string' ? match.id.trim() : ''
  if (!matchId) {
    return null
  }

  return {
    id: matchId,
    visualStyle: typeof match.visualStyle === 'string' ? match.visualStyle.trim() : '',
    layoutVariant:
      typeof match.layoutVariant === 'string' ? match.layoutVariant.trim() : '',
    heroStyle: typeof match.heroStyle === 'string' ? match.heroStyle.trim() : '',
    primaryCta: typeof match.primaryCta === 'string' ? match.primaryCta.trim() : '',
    secondaryCta:
      typeof match.secondaryCta === 'string' ? match.secondaryCta.trim() : '',
    typography:
      match.typography && typeof match.typography === 'object' ? match.typography : null,
    colors: match.colors && typeof match.colors === 'object' ? match.colors : null,
    metadata: match.metadata && typeof match.metadata === 'object' ? match.metadata : {},
    similarityScore:
      typeof match.similarityScore === 'number' ? match.similarityScore : 0,
    matchReasons: Array.isArray(match.matchReasons)
      ? match.matchReasons.filter(
          (reason) => typeof reason === 'string' && reason.trim(),
        )
      : [],
  }
}

const WEB_LAYOUT_VARIANT_DEFAULTS = {
  'editorial-gallery': {
    heroStyle: 'statement-split',
    layoutRhythm: 'airy',
    contentDensity: 'medium',
  },
  'editorial-mosaic': {
    heroStyle: 'statement-mosaic',
    layoutRhythm: 'dynamic',
    contentDensity: 'low',
  },
  'lookbook-flow': {
    heroStyle: 'lookbook-stack',
    layoutRhythm: 'dynamic',
    contentDensity: 'medium',
  },
  'immersive-pulse': {
    heroStyle: 'poster-stack',
    layoutRhythm: 'dynamic',
    contentDensity: 'medium',
  },
  'structured-trust': {
    heroStyle: 'info-first',
    layoutRhythm: 'structured',
    contentDensity: 'high',
  },
  'evidence-ledger': {
    heroStyle: 'authority-columns',
    layoutRhythm: 'measured',
    contentDensity: 'high',
  },
  'balanced-studio': {
    heroStyle: 'split-balance',
    layoutRhythm: 'balanced',
    contentDensity: 'medium',
  },
}

function normalizeSectionOrderList(sectionOrder) {
  if (!Array.isArray(sectionOrder)) {
    return []
  }

  const normalizedEntries = []
  const seenEntries = new Set()

  for (const entry of sectionOrder) {
    if (typeof entry !== 'string' || !entry.trim()) {
      continue
    }

    const normalizedEntry = entry.trim()

    if (seenEntries.has(normalizedEntry)) {
      continue
    }

    seenEntries.add(normalizedEntry)
    normalizedEntries.push(normalizedEntry)
  }

  return normalizedEntries
}

function areSectionOrdersEqual(leftOrder, rightOrder) {
  const normalizedLeftOrder = normalizeSectionOrderList(leftOrder)
  const normalizedRightOrder = normalizeSectionOrderList(rightOrder)

  if (normalizedLeftOrder.length !== normalizedRightOrder.length) {
    return false
  }

  return normalizedLeftOrder.every((sectionKey, index) => sectionKey === normalizedRightOrder[index])
}

function arrangeSectionOrder(baseOrder, preferredOrder) {
  const normalizedBaseOrder = normalizeSectionOrderList(baseOrder)
  const normalizedPreferredOrder = normalizeSectionOrderList(preferredOrder)
  const arrangedOrder = []
  const seenSections = new Set()

  for (const sectionKey of [...normalizedPreferredOrder, ...normalizedBaseOrder]) {
    if (seenSections.has(sectionKey)) {
      continue
    }

    if (!normalizedBaseOrder.includes(sectionKey)) {
      continue
    }

    arrangedOrder.push(sectionKey)
    seenSections.add(sectionKey)
  }

  return arrangedOrder.length > 0 ? arrangedOrder : normalizedBaseOrder
}

function uniqueStructuralLayoutCandidates(layoutCandidates) {
  const uniqueCandidates = []
  const seenLayouts = new Set()

  for (const layoutCandidate of layoutCandidates) {
    if (typeof layoutCandidate !== 'string' || !layoutCandidate.trim()) {
      continue
    }

    const normalizedLayoutCandidate = layoutCandidate.trim()

    if (seenLayouts.has(normalizedLayoutCandidate)) {
      continue
    }

    seenLayouts.add(normalizedLayoutCandidate)
    uniqueCandidates.push(normalizedLayoutCandidate)
  }

  return uniqueCandidates
}

function buildStyleReuseStructuralRedesign({
  baseCreativeDirection,
  topMatch,
  goal,
  context,
}) {
  if (!topMatch || typeof topMatch !== 'object') {
    return null
  }

  const redesignSignals = detectReusableRedesignSignals(goal, context)
  const shouldForceStructuralRedesign = Boolean(
    redesignSignals.mentionsRedesign ||
      redesignSignals.mentionsStructure ||
      redesignSignals.mentionsHero ||
      redesignSignals.mentionsHierarchy ||
      redesignSignals.mentionsSales,
  )

  if (!shouldForceStructuralRedesign) {
    return null
  }

  const currentLayoutVariant =
    typeof baseCreativeDirection?.layoutVariant === 'string'
      ? baseCreativeDirection.layoutVariant.trim()
      : ''
  const currentHeroStyle =
    typeof baseCreativeDirection?.heroStyle === 'string'
      ? baseCreativeDirection.heroStyle.trim()
      : ''
  const currentSectionOrder = normalizeSectionOrderList(baseCreativeDirection?.sectionOrder)
  const reusedLayoutVariant =
    typeof topMatch.layoutVariant === 'string' ? topMatch.layoutVariant.trim() : ''
  const reusedHeroStyle =
    typeof topMatch.heroStyle === 'string' ? topMatch.heroStyle.trim() : ''
  const reusedSectionOrder = normalizeSectionOrderList(topMatch.metadata?.sectionOrder)
  const layoutDefaults = WEB_LAYOUT_VARIANT_DEFAULTS[currentLayoutVariant] || {}
  const currentStructureTooSimilar =
    (currentLayoutVariant && currentLayoutVariant === reusedLayoutVariant) ||
    (currentHeroStyle && currentHeroStyle === reusedHeroStyle) ||
    (currentSectionOrder.length > 0 &&
      reusedSectionOrder.length > 0 &&
      areSectionOrdersEqual(currentSectionOrder, reusedSectionOrder))

  if (!currentStructureTooSimilar) {
    return null
  }

  const layoutCandidatePriority = uniqueStructuralLayoutCandidates([
    ...(currentLayoutVariant === 'editorial-gallery'
      ? ['editorial-mosaic', 'lookbook-flow', 'immersive-pulse']
      : currentLayoutVariant === 'editorial-mosaic'
        ? ['lookbook-flow', 'immersive-pulse', 'editorial-gallery']
        : currentLayoutVariant === 'lookbook-flow'
          ? ['editorial-mosaic', 'editorial-gallery', 'immersive-pulse']
          : currentLayoutVariant === 'immersive-pulse'
            ? ['editorial-mosaic', 'lookbook-flow', 'structured-trust']
            : currentLayoutVariant === 'structured-trust'
              ? ['balanced-studio', 'editorial-mosaic', 'lookbook-flow']
              : currentLayoutVariant === 'evidence-ledger'
                ? ['structured-trust', 'balanced-studio', 'editorial-mosaic']
                : ['editorial-mosaic', 'lookbook-flow', 'structured-trust']),
    ...(redesignSignals.mentionsSales
      ? ['editorial-mosaic', 'lookbook-flow', 'structured-trust']
      : []),
    ...(redesignSignals.mentionsHero || redesignSignals.mentionsStructure
      ? ['editorial-mosaic', 'lookbook-flow', 'immersive-pulse']
      : []),
    'balanced-studio',
  ]).filter((layoutVariant) => layoutVariant !== reusedLayoutVariant)

  const sectionOrderBlueprints = [
    ...(redesignSignals.mentionsSales ? [['services', 'about', 'contact', 'trust']] : []),
    ...(redesignSignals.mentionsStructure || redesignSignals.mentionsHero
      ? [['about', 'services', 'contact', 'trust']]
      : []),
    ...(redesignSignals.mentionsHierarchy ? [['services', 'contact', 'about', 'trust']] : []),
    [['services', 'about', 'contact', 'trust']],
    [['about', 'services', 'contact', 'trust']],
    [['services', 'contact', 'about', 'trust']],
    [['trust', 'services', 'contact', 'about']],
  ]
  const sectionOrderCandidates = sectionOrderBlueprints
    .map((sectionOrderBlueprint) => arrangeSectionOrder(currentSectionOrder, sectionOrderBlueprint))
    .filter((candidateOrder) => candidateOrder.length > 0)
  const resolvedSectionOrder =
    sectionOrderCandidates.find(
      (candidateOrder) => !areSectionOrdersEqual(candidateOrder, reusedSectionOrder),
    ) ||
    sectionOrderCandidates.find(
      (candidateOrder) => !areSectionOrdersEqual(candidateOrder, currentSectionOrder),
    ) ||
    currentSectionOrder

  const resolvedLayoutVariant =
    layoutCandidatePriority[0] || currentLayoutVariant || reusedLayoutVariant
  const resolvedLayoutDefaults =
    WEB_LAYOUT_VARIANT_DEFAULTS[resolvedLayoutVariant] || layoutDefaults
  const resolvedHeroStyle =
    resolvedLayoutDefaults.heroStyle ||
    (resolvedLayoutVariant !== reusedLayoutVariant
      ? currentHeroStyle
      : currentHeroStyle !== reusedHeroStyle
        ? currentHeroStyle
        : '')

  if (
    (!resolvedLayoutVariant || resolvedLayoutVariant === currentLayoutVariant) &&
    (!resolvedHeroStyle || resolvedHeroStyle === currentHeroStyle) &&
    areSectionOrdersEqual(resolvedSectionOrder, currentSectionOrder)
  ) {
    return null
  }

  const redesignNotes = []

  if (resolvedLayoutVariant && resolvedLayoutVariant !== currentLayoutVariant) {
    redesignNotes.push(`layout ${currentLayoutVariant || 'n/a'} -> ${resolvedLayoutVariant}`)
  }

  if (resolvedHeroStyle && resolvedHeroStyle !== currentHeroStyle) {
    redesignNotes.push(`hero ${currentHeroStyle || 'n/a'} -> ${resolvedHeroStyle}`)
  }

  if (!areSectionOrdersEqual(resolvedSectionOrder, currentSectionOrder)) {
    redesignNotes.push(
      `sectionOrder ${currentSectionOrder.join(' > ') || 'n/a'} -> ${resolvedSectionOrder.join(' > ')}`,
    )
  }

  return {
    nextCreativeDirection: {
      ...baseCreativeDirection,
      ...(resolvedLayoutVariant ? { layoutVariant: resolvedLayoutVariant } : {}),
      ...(resolvedHeroStyle ? { heroStyle: resolvedHeroStyle } : {}),
      ...(resolvedLayoutDefaults.layoutRhythm
        ? { layoutRhythm: resolvedLayoutDefaults.layoutRhythm }
        : {}),
      ...(resolvedLayoutDefaults.contentDensity
        ? { contentDensity: resolvedLayoutDefaults.contentDensity }
        : {}),
      ...(resolvedSectionOrder.length > 0 ? { sectionOrder: resolvedSectionOrder } : {}),
    },
    reason:
      redesignNotes.length > 0
        ? `reuse-style forzó una reestructuración para no clonar la base reusable: ${redesignNotes.join(', ')}`
        : 'reuse-style forzó una reestructuración para no clonar la base reusable.',
  }
}

function buildWebReuseMaterialization({
  creativeDirection,
  reusableArtifactLookup,
  reusedArtifactIds,
  reuseMode,
  reuseReason,
  goal,
  context,
  targetSectorKey,
}) {
  const baseCreativeDirection =
    creativeDirection && typeof creativeDirection === 'object' ? creativeDirection : {}
  const matches = Array.isArray(reusableArtifactLookup?.matches)
    ? reusableArtifactLookup.matches
        .map((match) => normalizeReusableArtifactMatch(match))
        .filter(Boolean)
    : []
  const normalizedReuseMode =
    typeof reuseMode === 'string' && reuseMode.trim() ? reuseMode.trim() : 'none'
  const preferredArtifactId =
    Array.isArray(reusedArtifactIds) &&
    reusedArtifactIds.find((artifactId) => typeof artifactId === 'string' && artifactId.trim())
      ? reusedArtifactIds.find(
          (artifactId) => typeof artifactId === 'string' && artifactId.trim(),
        )
      : ''
  const topMatch =
    matches.find((match) => match.id === preferredArtifactId) || matches[0] || null
  const normalizedTargetSectorKey =
    typeof targetSectorKey === 'string' && targetSectorKey.trim()
      ? targetSectorKey.trim()
      : ''
  const sameSector =
    typeof topMatch?.sector === 'string' &&
    topMatch.sector.trim() &&
    normalizedTargetSectorKey &&
    topMatch.sector.trim() === normalizedTargetSectorKey

  if (!topMatch || normalizedReuseMode === 'none') {
    return {
      effectiveCreativeDirection: baseCreativeDirection,
      appliedReuseMode: 'none',
      reusedStyleFromArtifactId: '',
      reusedStructureFromArtifactId: '',
      reuseAppliedFields: [],
      reuseMaterializationReason:
        reuseReason ||
        'La materialización no heredó memoria reusable porque no aportaba valor en esta corrida.',
    }
  }

  const effectiveCreativeDirection = {
    ...baseCreativeDirection,
    typography: {
      ...(baseCreativeDirection.typography || {}),
    },
    paletteSuggestion: {
      ...(baseCreativeDirection.paletteSuggestion || {}),
    },
    cta: {
      ...(baseCreativeDirection.cta || {}),
    },
  }
  const reuseAppliedFields = []
  let reusedStyleFromArtifactId = ''
  let reusedStructureFromArtifactId = ''
  let structuralRedesignApplied = false
  let structuralRedesignReason = ''

  const applyStyleReuse = (soft = false) => {
    if (topMatch.colors && typeof topMatch.colors === 'object') {
      effectiveCreativeDirection.paletteSuggestion = {
        ...(effectiveCreativeDirection.paletteSuggestion || {}),
        ...(soft
          ? {
              ...(typeof topMatch.colors.accent === 'string'
                ? { accent: topMatch.colors.accent }
                : {}),
              ...(typeof topMatch.colors.accentStrong === 'string'
                ? { accentStrong: topMatch.colors.accentStrong }
                : {}),
              ...(typeof topMatch.colors.highlight === 'string'
                ? { highlight: topMatch.colors.highlight }
                : {}),
            }
          : topMatch.colors),
      }
      if (!reuseAppliedFields.includes('colors')) {
        reuseAppliedFields.push('colors')
      }
    }

    if (topMatch.typography && typeof topMatch.typography === 'object') {
      effectiveCreativeDirection.typography = {
        ...(effectiveCreativeDirection.typography || {}),
        ...(soft
          ? {
              ...(typeof topMatch.typography.headingFamily === 'string'
                ? { headingFamily: topMatch.typography.headingFamily }
                : {}),
            }
          : topMatch.typography),
      }
      if (!reuseAppliedFields.includes('typography')) {
        reuseAppliedFields.push('typography')
      }
    }

    if (!soft && topMatch.visualStyle) {
      effectiveCreativeDirection.visualStyle = topMatch.visualStyle
    }

    // En reuse-style el hero conserva su layout, pero sí hereda el tratamiento
    // visual general a través de la tipografía, la paleta y el copy de apoyo.
    effectiveCreativeDirection.heroPanelTitle =
      effectiveCreativeDirection.heroPanelTitle || 'Referencia visual reaprovechada'
    if (!reuseAppliedFields.includes('heroTreatment')) {
      reuseAppliedFields.push('heroTreatment')
    }
    reusedStyleFromArtifactId = topMatch.id
  }

  const applyStructureReuse = () => {
    if (topMatch.layoutVariant) {
      effectiveCreativeDirection.layoutVariant = topMatch.layoutVariant
      if (!reuseAppliedFields.includes('layoutVariant')) {
        reuseAppliedFields.push('layoutVariant')
      }
    }
    if (topMatch.heroStyle) {
      effectiveCreativeDirection.heroStyle = topMatch.heroStyle
      if (!reuseAppliedFields.includes('heroStyle')) {
        reuseAppliedFields.push('heroStyle')
      }
    }
    if (Array.isArray(topMatch.metadata?.sectionOrder) && topMatch.metadata.sectionOrder.length > 0) {
      effectiveCreativeDirection.sectionOrder = topMatch.metadata.sectionOrder
      if (!reuseAppliedFields.includes('sectionOrder')) {
        reuseAppliedFields.push('sectionOrder')
      }
    }
    if (
      sameSector &&
      Array.isArray(topMatch.metadata?.prioritySections) &&
      topMatch.metadata.prioritySections.length > 0
    ) {
      effectiveCreativeDirection.prioritySections = topMatch.metadata.prioritySections
      if (!reuseAppliedFields.includes('prioritySections')) {
        reuseAppliedFields.push('prioritySections')
      }
    }
    if (typeof topMatch.metadata?.layoutRhythm === 'string' && topMatch.metadata.layoutRhythm.trim()) {
      effectiveCreativeDirection.layoutRhythm = topMatch.metadata.layoutRhythm.trim()
      if (!reuseAppliedFields.includes('layoutRhythm')) {
        reuseAppliedFields.push('layoutRhythm')
      }
    }
    if (
      typeof topMatch.metadata?.contentDensity === 'string' &&
      topMatch.metadata.contentDensity.trim()
    ) {
      effectiveCreativeDirection.contentDensity = topMatch.metadata.contentDensity.trim()
      if (!reuseAppliedFields.includes('contentDensity')) {
        reuseAppliedFields.push('contentDensity')
      }
    }
    reusedStructureFromArtifactId = topMatch.id
  }

  if (normalizedReuseMode === 'reuse-style') {
    applyStyleReuse(false)
    const structuralRedesign = buildStyleReuseStructuralRedesign({
      baseCreativeDirection: effectiveCreativeDirection,
      topMatch,
      goal,
      context,
    })

    if (structuralRedesign?.nextCreativeDirection) {
      Object.assign(effectiveCreativeDirection, structuralRedesign.nextCreativeDirection)
      structuralRedesignApplied = true
      structuralRedesignReason = structuralRedesign.reason
    }
  } else if (normalizedReuseMode === 'reuse-structure') {
    applyStructureReuse()
  } else if (normalizedReuseMode === 'reuse-style-and-structure') {
    applyStyleReuse(false)
    applyStructureReuse()
  } else if (normalizedReuseMode === 'inspiration-only') {
    applyStyleReuse(true)
  }

  return {
    effectiveCreativeDirection,
    appliedReuseMode: normalizedReuseMode,
    reusedStyleFromArtifactId,
    reusedStructureFromArtifactId,
    reuseAppliedFields,
    structuralRedesignApplied,
    structuralRedesignReason,
    reuseMaterializationReason:
      reuseReason ||
      (normalizedReuseMode === 'inspiration-only'
        ? 'La materialización tomó referencias suaves de memoria reusable sin copiar la base literal.'
        : `La materialización heredó ${reuseAppliedFields.join(', ')} desde memoria reusable.`),
  }
}

function buildWebScaffoldVisibleSummary({ sectorPreset, creativeDirection }) {
  const summaryCandidates = [
    sectorPreset?.heroSummaryFallback,
    sectorPreset?.metaLead,
    creativeDirection?.heroPanelItems?.[0],
  ].filter((value) => typeof value === 'string' && value.trim())

  return summaryCandidates[0] || 'Una propuesta clara, comercial y lista para presentar la marca.'
}

function buildWebScaffoldMetaDescription({ sectorPreset, creativeDirection }) {
  const metaCandidates = [
    sectorPreset?.metaLead,
    sectorPreset?.heroSummaryFallback,
    creativeDirection?.heroPanelItems?.[0],
  ].filter((value) => typeof value === 'string' && value.trim())

  return buildOutputPreview(metaCandidates[0] || 'Propuesta comercial con presencia clara y contacto directo.', 150)
}

function buildWebScaffoldSignalContent({
  sectorPreset,
  heroBullets,
}) {
  const curatedLines = Array.isArray(sectorPreset?.signalLines)
    ? sectorPreset.signalLines
    : []
  const fallbackLines = Array.isArray(heroBullets) ? heroBullets : []
  const linesSource =
    curatedLines.filter((value) => typeof value === 'string' && value.trim()).length >= 2
      ? curatedLines
      : fallbackLines
  const lines = linesSource
    .filter((value) => typeof value === 'string' && value.trim())
    .slice(0, 2)

  return {
    label:
      (typeof sectorPreset?.signalLabel === 'string' && sectorPreset.signalLabel.trim()) ||
      (typeof sectorPreset?.brandName === 'string' && sectorPreset.brandName.trim()) ||
      'Experiencia',
    lines:
      lines.length > 0
        ? lines
        : ['Propuesta clara y comercial.', 'Contacto directo para seguir la conversacion.'],
  }
}

function buildWebScaffoldBaseFiles({
  sectorKey,
  sectorConfig,
  creativeDirection,
  reuseMaterialization,
}) {
  const sectorPreset =
    sectorConfig ||
    WEB_SCAFFOLD_SECTOR_PRESETS[sectorKey] ||
    WEB_SCAFFOLD_SECTOR_PRESETS.estetica
  const resolvedCreativeDirection =
    creativeDirection ||
    buildWebCreativeDirection({
      goal: '',
      context,
      sectorConfig: sectorPreset,
    })
  const businessSummary = buildWebScaffoldVisibleSummary({
    sectorPreset,
    creativeDirection: resolvedCreativeDirection,
  })
  const metaDescription = buildWebScaffoldMetaDescription({
    sectorPreset,
    creativeDirection: resolvedCreativeDirection,
  })
  const mergedPalette = {
    ...sectorPreset.palette,
    ...(resolvedCreativeDirection.paletteSuggestion || {}),
  }
  const headingFont =
    resolvedCreativeDirection.typography?.headingFamily || '"Cormorant Garamond", serif'
  const bodyFont =
    resolvedCreativeDirection.typography?.bodyFamily || '"Manrope", sans-serif'
  const fontHref =
    resolvedCreativeDirection.typography?.fontHref ||
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap'
  const primaryCta =
    resolvedCreativeDirection.cta?.primary || sectorPreset.primaryCta
  const secondaryCta =
    resolvedCreativeDirection.cta?.secondary || sectorPreset.secondaryCta
  const sectionLabels = {
    aboutTag:
      resolvedCreativeDirection.sectionLabels?.aboutTag || sectorPreset.aboutTag,
    servicesTag:
      resolvedCreativeDirection.sectionLabels?.servicesTag || sectorPreset.servicesTag,
    trustTag:
      resolvedCreativeDirection.sectionLabels?.trustTag || sectorPreset.trustTag,
    contactTag:
      resolvedCreativeDirection.sectionLabels?.contactTag || sectorPreset.contactTag,
  }
  const businessSummaryHtml = escapeHtml(businessSummary)
  const metaDescriptionHtml = escapeHtml(metaDescription)
  const heroBullets = Array.isArray(resolvedCreativeDirection.heroPanelItems) &&
    resolvedCreativeDirection.heroPanelItems.length > 0
    ? resolvedCreativeDirection.heroPanelItems
    : sectorPreset.heroBullets
  const heroSignalContent = buildWebScaffoldSignalContent({
    sectorPreset,
    heroBullets,
  })
  const heroBulletsHtml = heroBullets
    .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
    .join('\n')
  const heroBulletsHtmlIndented = indentMultilineHtml(heroBulletsHtml, '          ')
  const heroSignalLinesHtml = heroSignalContent.lines
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('\n')
  const heroSignalLinesHtmlIndented = indentMultilineHtml(
    heroSignalLinesHtml,
    '          ',
  )
  const serviceCardsHtml = sectorPreset.serviceCards
    .map(
      (serviceCard, index) => `          <article class="service-card service-card--${(index % 3) + 1}">
            <h3>${escapeHtml(serviceCard.title)}</h3>
            <p>${escapeHtml(serviceCard.description)}</p>
          </article>`,
    )
    .join('\n')
  const testimonialsHtml = sectorPreset.testimonials
    .map(
      (testimonial) => `          <blockquote>
            <p>"${escapeHtml(testimonial.quote)}"</p>
            <footer>${escapeHtml(testimonial.author)}</footer>
          </blockquote>`,
    )
    .join('\n')
  const aboutSectionHtml = `      <section id="sobre-nosotros" class="section section--about">
        <span class="section-tag">${escapeHtml(sectionLabels.aboutTag)}</span>
        <h2>${escapeHtml(sectorPreset.aboutTitle)}</h2>
        <p>${escapeHtml(sectorPreset.aboutCopy)}</p>
      </section>`
  const servicesSectionHtml = `      <section id="servicios" class="section section--services section--${escapeHtml(resolvedCreativeDirection.layoutVariant)}">
        <div class="section-heading">
          <span class="section-tag">${escapeHtml(sectionLabels.servicesTag)}</span>
          <h2>${escapeHtml(sectorPreset.servicesTitle)}</h2>
        </div>
        <div class="service-list">
${serviceCardsHtml}
        </div>
      </section>`
  const trustSectionHtml = `      <section id="testimonios" class="section section--trust">
        <span class="section-tag">${escapeHtml(sectionLabels.trustTag)}</span>
        <h2>${escapeHtml(sectorPreset.trustTitle)}</h2>
        <div class="testimonial-list">
${testimonialsHtml}
        </div>
      </section>`
  const contactSectionHtml = `      <section id="contacto" class="section contact-panel">
        <div>
          <span class="section-tag">${escapeHtml(sectionLabels.contactTag)}</span>
          <h2>${escapeHtml(sectorPreset.contactTitle)}</h2>
          <p>${escapeHtml(sectorPreset.contactCopy)}</p>
        </div>
        <button id="cta-turnos" class="button primary" type="button">
          ${escapeHtml(sectorPreset.ctaButtonLabel)}
        </button>
      </section>`
  const sectionsMap = {
    about: aboutSectionHtml,
    services: servicesSectionHtml,
    trust: trustSectionHtml,
    contact: contactSectionHtml,
  }
  // El planner puede cambiar el orden lógico de secciones por rubro. El
  // scaffold tiene que respetarlo literalmente para que la diferencia creativa
  // llegue a ejecución y no quede solo en metadata.
  const orderedSectionsHtml = (resolvedCreativeDirection.sectionOrder || [
    'about',
    'services',
    'trust',
    'contact',
  ])
    .map((sectionKey) => sectionsMap[sectionKey] || '')
    .filter(Boolean)
    .join('\n\n')
  const heroPanelTitle =
    resolvedCreativeDirection.heroPanelTitle || sectorPreset.heroCardLabel
  const heroEyebrow = sectorPreset.brandName
  const heroLayoutVariant = resolvedCreativeDirection.layoutVariant
  const heroHtmlByVariant = {
    'editorial-gallery': `    <header class="site-header site-header--editorial">
      <div class="brand-block">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(sectorPreset.heroTitle)}</h1>
        <p>${businessSummaryHtml}</p>
        <div class="hero-actions">
          <a class="button primary" href="#contacto">${escapeHtml(primaryCta)}</a>
          <a class="button secondary" href="#servicios">${escapeHtml(secondaryCta)}</a>
        </div>
      </div>
      <div class="hero-card hero-card--stacked">
        <p class="hero-card-label">${escapeHtml(heroPanelTitle)}</p>
        <ul>
${heroBulletsHtmlIndented}
        </ul>
      </div>
    </header>`,
    'editorial-mosaic': `    <header class="site-header site-header--editorial site-header--mosaic">
      <div class="brand-block">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(sectorPreset.heroTitle)}</h1>
        <p>${businessSummaryHtml}</p>
        <div class="hero-actions">
          <a class="button primary" href="#contacto">${escapeHtml(primaryCta)}</a>
          <a class="button secondary" href="#servicios">${escapeHtml(secondaryCta)}</a>
        </div>
      </div>
      <div class="hero-mosaic">
        <article class="hero-card">
          <p class="hero-card-label">${escapeHtml(heroPanelTitle)}</p>
          <ul>
${heroBulletsHtmlIndented}
          </ul>
        </article>
        <article class="hero-card hero-card--contrast">
          <p class="hero-card-label">${escapeHtml(heroSignalContent.label)}</p>
${heroSignalLinesHtmlIndented}
        </article>
      </div>
    </header>`,
    'lookbook-flow': `    <header class="site-header site-header--lookbook">
      <div class="brand-block brand-block--lookbook">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(sectorPreset.heroTitle)}</h1>
        <p>${businessSummaryHtml}</p>
        <div class="hero-actions">
          <a class="button primary" href="#contacto">${escapeHtml(primaryCta)}</a>
          <a class="button secondary" href="#servicios">${escapeHtml(secondaryCta)}</a>
        </div>
      </div>
      <div class="hero-lookbook-grid">
        <article class="hero-card hero-card--lookbook hero-card--feature">
          <p class="hero-card-label">${escapeHtml(heroPanelTitle)}</p>
          <ul>
${heroBulletsHtmlIndented}
          </ul>
        </article>
        <article class="hero-card hero-card--lookbook hero-card--signal">
          <p class="hero-card-label">${escapeHtml(heroSignalContent.label)}</p>
${heroSignalLinesHtmlIndented}
        </article>
      </div>
    </header>`,
    'immersive-pulse': `    <header class="site-header site-header--immersive">
      <div class="hero-copy hero-copy--centered">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(sectorPreset.heroTitle)}</h1>
        <p>${businessSummaryHtml}</p>
        <div class="hero-actions">
          <a class="button primary" href="#contacto">${escapeHtml(primaryCta)}</a>
          <a class="button secondary" href="#servicios">${escapeHtml(secondaryCta)}</a>
        </div>
      </div>
      <div class="hero-chip-row">
${heroBullets
  .map((bullet) => `        <span class="hero-chip">${escapeHtml(bullet)}</span>`)
  .join('\n')}
      </div>
    </header>`,
    'structured-trust': `    <header class="site-header site-header--structured">
      <div class="brand-block">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(sectorPreset.heroTitle)}</h1>
        <p>${businessSummaryHtml}</p>
        <div class="hero-actions">
          <a class="button primary" href="#contacto">${escapeHtml(primaryCta)}</a>
          <a class="button secondary" href="#servicios">${escapeHtml(secondaryCta)}</a>
        </div>
      </div>
      <aside class="hero-card hero-card--structured">
        <p class="hero-card-label">${escapeHtml(heroPanelTitle)}</p>
        <ul>
${heroBulletsHtmlIndented}
        </ul>
      </aside>
    </header>`,
    'evidence-ledger': `    <header class="site-header site-header--ledger">
      <div class="brand-block brand-block--ledger">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(sectorPreset.heroTitle)}</h1>
        <p>${businessSummaryHtml}</p>
        <div class="hero-actions">
          <a class="button primary" href="#contacto">${escapeHtml(primaryCta)}</a>
          <a class="button secondary" href="#servicios">${escapeHtml(secondaryCta)}</a>
        </div>
      </div>
      <aside class="hero-card hero-card--ledger">
        <p class="hero-card-label">${escapeHtml(heroPanelTitle)}</p>
        <ul>
${heroBulletsHtmlIndented}
        </ul>
      </aside>
    </header>`,
    'balanced-studio': `    <header class="site-header">
      <div class="brand-block">
        <span class="eyebrow">${escapeHtml(heroEyebrow)}</span>
        <h1>${escapeHtml(sectorPreset.heroTitle)}</h1>
        <p>${businessSummaryHtml}</p>
        <div class="hero-actions">
          <a class="button primary" href="#contacto">${escapeHtml(primaryCta)}</a>
          <a class="button secondary" href="#servicios">${escapeHtml(secondaryCta)}</a>
        </div>
      </div>
      <div class="hero-card">
        <p class="hero-card-label">${escapeHtml(heroPanelTitle)}</p>
        <ul>
${heroBulletsHtmlIndented}
        </ul>
      </div>
    </header>`,
  }
  const heroHtml =
    heroHtmlByVariant[heroLayoutVariant] || heroHtmlByVariant['balanced-studio']
  const normalizedReuseMaterialization =
    reuseMaterialization && typeof reuseMaterialization === 'object'
      ? reuseMaterialization
      : null
  const reuseFieldsComment =
    normalizedReuseMaterialization?.reuseAppliedFields?.length > 0
      ? normalizedReuseMaterialization.reuseAppliedFields.join(', ')
      : 'none'
  const structureRedesignComment =
    normalizedReuseMaterialization?.structuralRedesignApplied
      ? toSafeAsciiCommentText(normalizedReuseMaterialization.structuralRedesignReason) ||
        'style-reuse-structural-redesign'
      : 'none'

  return {
    'index.html': `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(sectorPreset.brandName)}</title>
    <meta
      name="description"
      content="${metaDescriptionHtml}"
    />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="${fontHref}"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body data-layout-variant="${escapeHtml(resolvedCreativeDirection.layoutVariant)}" data-originality-level="${escapeHtml(resolvedCreativeDirection.originalityLevel)}" data-applied-reuse-mode="${escapeHtml(normalizedReuseMaterialization?.appliedReuseMode || 'none')}" data-reused-style-from="${escapeHtml(normalizedReuseMaterialization?.reusedStyleFromArtifactId || '')}" data-reused-structure-from="${escapeHtml(normalizedReuseMaterialization?.reusedStructureFromArtifactId || '')}" data-structure-redesign="${escapeHtml(normalizedReuseMaterialization?.structuralRedesignApplied ? 'true' : 'false')}">
    <!-- reuse-materialization: mode=${escapeHtml(normalizedReuseMaterialization?.appliedReuseMode || 'none')}; fields=${escapeHtml(reuseFieldsComment)}; styleFrom=${escapeHtml(normalizedReuseMaterialization?.reusedStyleFromArtifactId || '')}; structureFrom=${escapeHtml(normalizedReuseMaterialization?.reusedStructureFromArtifactId || '')}; structureRedesign=${escapeHtml(structureRedesignComment)} -->
${heroHtml}

    <main class="main-content main-content--${escapeHtml(resolvedCreativeDirection.layoutVariant)}">
${orderedSectionsHtml}
    </main>

    <footer class="site-footer">
      <p>${escapeHtml(sectorPreset.footerCopy)}</p>
      <p id="footer-year"></p>
    </footer>

    <script src="./script.js"></script>
  </body>
</html>
`,
    'styles.css': `/* reuse-materialization: mode=${normalizedReuseMaterialization?.appliedReuseMode || 'none'}; fields=${reuseFieldsComment}; styleFrom=${normalizedReuseMaterialization?.reusedStyleFromArtifactId || ''}; structureFrom=${normalizedReuseMaterialization?.reusedStructureFromArtifactId || ''}; structureRedesign=${structureRedesignComment} */
:root {
  --bg: ${mergedPalette.bg};
  --panel: ${mergedPalette.panel};
  --text: ${mergedPalette.text};
  --muted: ${mergedPalette.muted};
  --accent: ${mergedPalette.accent};
  --accent-strong: ${mergedPalette.accentStrong};
  --border: ${mergedPalette.border};
  --shadow: ${mergedPalette.shadow};
  --highlight: ${mergedPalette.highlight};
  --gradient-start: ${mergedPalette.gradientStart};
  --gradient-end: ${mergedPalette.gradientEnd};
  --accent-shadow: ${mergedPalette.accentShadow};
  --heading-font: ${headingFont};
  --body-font: ${bodyFont};
  --section-gap: ${resolvedCreativeDirection.layoutRhythm === 'airy' ? '56px' : resolvedCreativeDirection.layoutRhythm === 'dynamic' ? '36px' : resolvedCreativeDirection.layoutRhythm === 'compact' ? '28px' : '40px'};
  --surface-radius: ${resolvedCreativeDirection.originalityLevel === 'high' ? '34px' : '26px'};
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--body-font);
  color: var(--text);
  background:
    radial-gradient(circle at top left, var(--highlight), transparent 35%),
    linear-gradient(180deg, var(--gradient-start) 0%, var(--gradient-end) 100%);
}

a {
  color: inherit;
  text-decoration: none;
}

.site-header,
.section,
.site-footer {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
}

.site-header {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
  align-items: center;
  padding: 72px 0 40px;
}

.site-header--editorial,
.site-header--structured,
.site-header--ledger {
  grid-template-columns: 1.2fr 0.9fr;
}

.site-header--lookbook {
  grid-template-columns: 0.95fr 1.15fr;
  align-items: end;
}

.site-header--immersive {
  min-height: 78vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 32px;
  text-align: center;
}

.eyebrow,
.section-tag,
.hero-card-label {
  display: inline-block;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-strong);
  margin-bottom: 14px;
}

h1,
h2,
h3 {
  font-family: var(--heading-font);
  margin: 0;
}

h1 {
  font-size: clamp(3rem, 6vw, 5rem);
  line-height: 0.94;
  max-width: 11ch;
}

.site-header--immersive h1 {
  max-width: 12ch;
  margin: 0 auto;
}

h2 {
  font-size: clamp(2.2rem, 4vw, 3.3rem);
  line-height: 1;
  margin-bottom: 14px;
}

p {
  color: var(--muted);
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 28px;
}

.hero-copy--centered .hero-actions,
.site-header--immersive .hero-actions {
  justify-content: center;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-weight: 700;
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.button:hover {
  transform: translateY(-1px);
}

.button.primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 16px 30px var(--accent-shadow);
}

.button.secondary {
  background: rgba(255, 255, 255, 0.82);
}

.hero-card,
.service-card,
.testimonial-list blockquote,
.contact-panel {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
  backdrop-filter: blur(8px);
}

.hero-card {
  padding: 28px;
  border-radius: var(--surface-radius);
}

.hero-card ul {
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.8;
}

.hero-card--contrast {
  background: linear-gradient(180deg, var(--accent), var(--accent-strong));
  color: white;
}

.hero-card--contrast p {
  color: rgba(255, 255, 255, 0.86);
}

.hero-mosaic {
  display: grid;
  gap: 18px;
}

.hero-lookbook-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 18px;
  align-items: stretch;
}

.hero-card--lookbook,
.hero-card--ledger {
  position: relative;
  overflow: hidden;
}

.hero-card--feature {
  min-height: 320px;
}

.hero-card--signal {
  align-self: end;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.72));
}

.hero-card--ledger {
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.8)),
    repeating-linear-gradient(
      180deg,
      transparent,
      transparent 30px,
      rgba(0, 0, 0, 0.035) 30px,
      rgba(0, 0, 0, 0.035) 31px
    );
}

.hero-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.hero-chip {
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.08);
  color: var(--text);
  padding: 10px 14px;
  border-radius: 999px;
  backdrop-filter: blur(8px);
}

.section {
  padding: var(--section-gap) 0;
}

.section-heading {
  max-width: 56ch;
}

.service-list,
.testimonial-list {
  display: grid;
  gap: 16px;
}

.service-card,
.testimonial-list blockquote,
.contact-panel {
  padding: 24px;
  border-radius: var(--surface-radius);
}

.section--services .service-list {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.section--editorial-gallery .service-card,
.section--editorial-mosaic .service-card {
  min-height: 220px;
}

.section--lookbook-flow .service-card {
  min-height: 220px;
  transform: rotate(-0.4deg);
}

.section--immersive-pulse .service-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
}

.section--evidence-ledger .service-card {
  border-radius: 18px;
  box-shadow: 0 18px 36px rgba(60, 48, 36, 0.08);
}

.section--structured-trust .service-card {
  border-radius: 18px;
}

.testimonial-list {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.testimonial-list blockquote p {
  margin-top: 0;
  color: var(--text);
}

.testimonial-list footer {
  color: var(--accent-strong);
  font-size: 14px;
  font-weight: 700;
}

.contact-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.main-content--structured-trust .contact-panel,
.main-content--balanced-studio .contact-panel,
.main-content--evidence-ledger .contact-panel {
  align-items: flex-start;
}

.site-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 0 40px;
  font-size: 14px;
  color: var(--muted);
}

@media (max-width: 860px) {
  .site-header,
  .contact-panel,
  .site-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .site-header {
    grid-template-columns: 1fr;
  }

  .site-header {
    padding-top: 48px;
  }

  h1 {
    max-width: none;
  }

  .site-header--immersive .hero-actions,
  .hero-chip-row {
    justify-content: flex-start;
  }
}
`,
    'script.js': `const ctaButton = document.getElementById('cta-turnos');
const footerYear = document.getElementById('footer-year');
const body = document.body;

if (footerYear) {
  footerYear.textContent = String(new Date().getFullYear());
}

if (ctaButton) {
  ctaButton.addEventListener('click', () => {
    const contactSection = document.getElementById('contacto');

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

if (body && body.dataset.originalityLevel === 'high') {
  body.classList.add('is-high-originality');
}
`,
  }
}

function detectWebScaffoldBaseLocalTask({
  instruction,
  context,
  workspacePath,
  requestId,
  businessSector,
  businessSectorLabel,
  creativeDirection,
  reusableArtifactLookup,
  reusableArtifactsFound,
  reuseDecision,
  reuseReason,
  reusedArtifactIds,
  reuseMode,
  executionScope,
}) {
  if (
    typeof instruction !== 'string' ||
    !instruction.trim() ||
    typeof workspacePath !== 'string' ||
    !workspacePath.trim()
  ) {
    return null
  }

  const normalizedInstruction = instruction.toLocaleLowerCase()
  const hasExplicitBusinessSector =
    typeof businessSector === 'string' &&
    businessSector.trim()
  const resolvedSectorConfig = resolveWebScaffoldSectorConfig({
    businessSector,
    businessSectorLabel,
    instruction,
    context,
  })
  const resolvedCreativeDirection =
    creativeDirection && typeof creativeDirection === 'object'
      ? creativeDirection
      : buildWebCreativeDirection({
          goal: instruction,
          context,
          sectorConfig: resolvedSectorConfig,
        })
  const looksLikeWebBaseIntent =
    normalizedInstruction.includes('web base') ||
    normalizedInstruction.includes('web institucional') ||
    normalizedInstruction.includes('sitio institucional') ||
    normalizedInstruction.includes('landing') ||
    normalizedInstruction.includes('scaffoldear') ||
    normalizedInstruction.includes('pagina web')
  const looksLikeWebScaffoldInstruction =
    Boolean(resolvedSectorConfig) &&
    looksLikeWebBaseIntent &&
    (hasExplicitBusinessSector ||
      (normalizedInstruction.includes('hero') &&
        normalizedInstruction.includes('servicios') &&
        normalizedInstruction.includes('contacto')))

  if (!looksLikeWebScaffoldInstruction) {
    return null
  }

  // La ruta rápida web solo cubre un scaffold inicial de una landing. Si el
  // planner ya bajó un alcance más rico (componentes reutilizables, pages,
  // formularios o mock API), es preferible dejar que siga el executor real
  // antes que degradar silenciosamente el pedido.
  const scopeRequirementText = [
    instruction,
    context,
    ...(Array.isArray(executionScope?.successCriteria)
      ? executionScope.successCriteria
      : []),
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()
  const requiresAdvancedScaffold =
    scopeRequirementText.includes('componentes reutilizables') ||
    scopeRequirementText.includes('componentes base') ||
    scopeRequirementText.includes('pages') ||
    scopeRequirementText.includes('paginas') ||
    scopeRequirementText.includes('páginas') ||
    scopeRequirementText.includes('formulario') ||
    scopeRequirementText.includes('mock endpoint') ||
    scopeRequirementText.includes('mock api') ||
    scopeRequirementText.includes('endpoint local') ||
    scopeRequirementText.includes('api local') ||
    scopeRequirementText.includes('ruteo') ||
    scopeRequirementText.includes('routing')

  if (requiresAdvancedScaffold) {
    return null
  }

  const explicitTargetPath = resolveFastRouteExplicitTargetPath({
    instruction,
    context,
    executionScope,
  })
  const explicitFolderName =
    extractExplicitWebScaffoldFolderName(instruction, context) ||
    (explicitTargetPath && !path.extname(explicitTargetPath)
      ? explicitTargetPath
      : '')
  const scaffoldFolderName =
    explicitFolderName ||
    buildWebScaffoldBaseFolderName({
      ...resolvedSectorConfig,
      explicitFolderName,
    })
  const scaffoldFolderTarget = resolveWorkspaceTarget(workspacePath, scaffoldFolderName)

  if (!scaffoldFolderTarget) {
    return null
  }

  const reuseMaterialization = buildWebReuseMaterialization({
    creativeDirection: resolvedCreativeDirection,
    reusableArtifactLookup,
    reusedArtifactIds,
    reuseMode,
    reuseReason,
    goal: instruction,
    context,
    targetSectorKey: resolvedSectorConfig.key,
  })
  const scaffoldFiles = buildWebScaffoldBaseFiles({
    sectorKey: resolvedSectorConfig.key,
    sectorConfig: resolvedSectorConfig,
    context,
    creativeDirection: reuseMaterialization.effectiveCreativeDirection,
    reuseMaterialization,
  })

  return buildLocalDeterministicTaskFromPlan({
    workspacePath,
    requestId,
    instruction,
    brainStrategy: 'web-scaffold-base',
    businessSector: resolvedSectorConfig.key,
    businessSectorLabel: resolvedSectorConfig.label,
    creativeDirection: reuseMaterialization.effectiveCreativeDirection,
    reusableArtifactLookup,
    reusableArtifactsFound,
    reuseDecision,
    reuseReason,
    reusedArtifactIds,
    reuseMode,
    reuseMaterialization,
    materializationPlanSource: 'fast-route:web-scaffold-base',
    plan: {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'local-materialization',
      summary: `Materializar la base web local en "${scaffoldFolderName}"`,
      strategy: 'web-scaffold-base',
      reasoningLayer: 'local-rules',
      materializationLayer: 'local-deterministic',
      folders: [scaffoldFolderTarget.relativeTargetPath],
      files: Object.entries(scaffoldFiles).map(([fileName, fileContent]) => ({
        path: path.join(scaffoldFolderName, fileName),
        mode: 'create',
        content: fileContent,
      })),
      validations: [
        {
          type: 'exists',
          path: scaffoldFolderTarget.relativeTargetPath,
          expectedKind: 'folder',
        },
        ...Object.keys(scaffoldFiles).map((fileName) => ({
          type: 'exists',
          path: path.join(scaffoldFolderName, fileName),
          expectedKind: 'file',
        })),
      ],
    },
  })
}

function extractStructuredCompositeSteps(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return []
  }

  const rawLines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const steps = []

  for (const line of rawLines) {
    if (/^(pasos?|acciones?)\s*:\s*$/i.test(line)) {
      continue
    }

    const stepMatch = line.match(/^(?:[-*]\s+|\d+[.)]\s+|paso\s+\d+\s*:\s*)(.+)$/i)

    if (!stepMatch?.[1]) {
      return []
    }

    steps.push(stepMatch[1].trim())
  }

  return steps.length >= 2 ? steps : []
}

function detectFastAtomicLocalTask({
  instruction,
  context,
  workspacePath,
  requestId,
  stepIndex,
}) {
  if (
    typeof instruction !== 'string' ||
    !instruction.trim() ||
    typeof workspacePath !== 'string' ||
    !workspacePath.trim()
  ) {
    return null
  }

  const normalizedInstruction = instruction.toLocaleLowerCase()
  const normalizedContext = typeof context === 'string' ? context.trim() : ''
  const fileTargetPath = extractFileTargetPath(instruction)
  const folderTargetPath = extractFolderTargetPath(instruction)
  const baseTask = {
    requestId: requestId || undefined,
    instruction,
    ...(Number.isInteger(stepIndex) ? { stepIndex } : {}),
  }

  if (fileTargetPath) {
    const replaceFromInstructionMatch =
      /reemplaz(?:a|á|ar)/i.test(instruction) &&
      normalizedInstruction.includes('contenido del archivo') &&
      normalizedInstruction.includes('por:')
        ? instruction.match(/por:\s*([\s\S]+)$/i)
        : null
    const replaceFromContextMatch = normalizedContext.match(
      /reemplaz(?:a|á)\s+todo\s+el\s+contenido\s+del\s+archivo\s+por:\s*([\s\S]+)$/i,
    )

    if (replaceFromInstructionMatch?.[1]?.trim() || replaceFromContextMatch?.[1]?.trim()) {
      const target = resolveWorkspaceTarget(workspacePath, fileTargetPath)
      const nextContent =
        replaceFromInstructionMatch?.[1]?.trim() || replaceFromContextMatch?.[1] || ''

      if (!target || !nextContent) {
        return null
      }

      return {
        type: 'replace-file',
        nextContent,
        ...baseTask,
        ...target,
      }
    }
  }

  if (
    folderTargetPath &&
    (normalizedInstruction.includes('borrar carpeta') ||
      normalizedInstruction.includes('borrar la carpeta') ||
      normalizedInstruction.includes('eliminar carpeta') ||
      normalizedInstruction.includes('eliminar la carpeta') ||
      normalizedInstruction.includes('borrar directorio') ||
      normalizedInstruction.includes('eliminar directorio'))
  ) {
    const target = resolveWorkspaceTarget(workspacePath, folderTargetPath)

    if (!target) {
      return null
    }

    return {
      type: 'delete-folder',
      ...baseTask,
      ...target,
    }
  }

  if (
    fileTargetPath &&
    (normalizedInstruction.includes('borrar archivo') ||
      normalizedInstruction.includes('borrar el archivo') ||
      normalizedInstruction.includes('eliminar archivo') ||
      normalizedInstruction.includes('eliminar el archivo'))
  ) {
    const target = resolveWorkspaceTarget(workspacePath, fileTargetPath)

    if (!target) {
      return null
    }

    return {
      type: 'delete-file',
      ...baseTask,
      ...target,
    }
  }

  if (
    folderTargetPath &&
    (normalizedInstruction.includes('crear carpeta') ||
      normalizedInstruction.includes('crea carpeta') ||
      normalizedInstruction.includes('crear la carpeta') ||
      normalizedInstruction.includes('crea la carpeta') ||
      normalizedInstruction.includes('crear una carpeta') ||
      normalizedInstruction.includes('crea una carpeta') ||
      normalizedInstruction.includes('crear carpeta llamada') ||
      normalizedInstruction.includes('crea carpeta llamada') ||
      normalizedInstruction.includes('crear la carpeta llamada') ||
      normalizedInstruction.includes('crea la carpeta llamada') ||
      normalizedInstruction.includes('crear una carpeta llamada') ||
      normalizedInstruction.includes('crea una carpeta llamada') ||
      normalizedInstruction.includes('crear directorio') ||
      normalizedInstruction.includes('crea directorio') ||
      normalizedInstruction.includes('crear el directorio') ||
      normalizedInstruction.includes('crea el directorio') ||
      normalizedInstruction.includes('crear un directorio'))
  ) {
    const target = resolveWorkspaceTarget(workspacePath, folderTargetPath)

    if (!target) {
      return null
    }

    return {
      type: 'create-folder',
      ...baseTask,
      ...target,
    }
  }

  if (
    fileTargetPath &&
    (normalizedInstruction.includes('agregar al final del archivo') ||
      normalizedInstruction.includes('append al archivo') ||
      normalizedInstruction.includes('append al final del archivo'))
  ) {
    const target = resolveWorkspaceTarget(workspacePath, fileTargetPath)
    const appendContentMatch = instruction.match(/:\s*([\s\S]+)$/i)

    if (!target || !appendContentMatch?.[1]?.trim()) {
      return null
    }

    return {
      type: 'append-file',
      appendContent: appendContentMatch[1],
      ...baseTask,
      ...target,
    }
  }

  if (
    fileTargetPath &&
    (normalizedInstruction.includes('crear archivo') ||
      normalizedInstruction.includes('crea archivo') ||
      normalizedInstruction.includes('crear el archivo') ||
      normalizedInstruction.includes('crea el archivo') ||
      normalizedInstruction.includes('crear un archivo') ||
      normalizedInstruction.includes('crea un archivo') ||
      normalizedInstruction.includes('crear archivo llamado') ||
      normalizedInstruction.includes('crea archivo llamado') ||
      normalizedInstruction.includes('crear el archivo llamado') ||
      normalizedInstruction.includes('crea el archivo llamado') ||
      normalizedInstruction.includes('crear un archivo llamado') ||
      normalizedInstruction.includes('crea un archivo llamado') ||
      normalizedInstruction.includes('generar archivo') ||
      normalizedInstruction.includes('hacer archivo'))
  ) {
    const target = resolveWorkspaceTarget(workspacePath, fileTargetPath)
    const initialContentMatch =
      instruction.match(/contenido(?:\s+inicial)?\s*:\s*([\s\S]+)$/i) ||
      instruction.match(/escrib(?:í|i|ir)\s+el\s+contenido\s*:\s*([\s\S]+)$/i)

    if (!target) {
      return null
    }

    return {
      type: 'create-file',
      initialContent: initialContentMatch?.[1]?.trim() || normalizedContext,
      ...baseTask,
      ...target,
    }
  }

  if (
    folderTargetPath &&
    (normalizedInstruction.includes('listar carpeta') ||
      normalizedInstruction.includes('listar la carpeta') ||
      normalizedInstruction.includes('mostrar contenido de la carpeta') ||
      normalizedInstruction.includes('mostrar el contenido de la carpeta') ||
      normalizedInstruction.includes('listar directorio') ||
      normalizedInstruction.includes('mostrar contenido del directorio'))
  ) {
    const target = resolveWorkspaceTarget(workspacePath, folderTargetPath)

    if (!target) {
      return null
    }

    return {
      type: 'list-folder',
      ...baseTask,
      ...target,
    }
  }

  if (
    (fileTargetPath || folderTargetPath) &&
    (normalizedInstruction.includes('decime si existe') ||
      normalizedInstruction.includes('verificar si existe') ||
      normalizedInstruction.includes('si existe el archivo') ||
      normalizedInstruction.includes('si existe la carpeta') ||
      normalizedInstruction.includes('existe el archivo') ||
      normalizedInstruction.includes('existe la carpeta'))
  ) {
    const targetKind = fileTargetPath ? 'file' : 'folder'
    const requestedTargetPath = fileTargetPath || folderTargetPath
    const target = resolveWorkspaceTarget(workspacePath, requestedTargetPath)

    if (!target) {
      return null
    }

    return {
      type: 'exists-check',
      expectedTargetKind: targetKind,
      ...baseTask,
      ...target,
    }
  }

  if (
    fileTargetPath &&
    (normalizedInstruction.includes('leer archivo') ||
      normalizedInstruction.includes('leer el archivo') ||
      normalizedInstruction.includes('revisar archivo') ||
      normalizedInstruction.includes('revisar el archivo') ||
      normalizedInstruction.includes('mostrar archivo') ||
      normalizedInstruction.includes('mostrar el archivo') ||
      normalizedInstruction.includes('ver archivo') ||
      normalizedInstruction.includes('ver el archivo') ||
      normalizedInstruction.includes('analizar archivo') ||
      normalizedInstruction.includes('analizar el archivo') ||
      normalizedInstruction.includes('resumir archivo') ||
      normalizedInstruction.includes('resumir el archivo'))
  ) {
    const target = resolveWorkspaceTarget(workspacePath, fileTargetPath)

    if (!target) {
      return null
    }

    return {
      type: 'read-file',
      ...baseTask,
      ...target,
    }
  }

  return null
}

function detectFastCompositeStepTask({ stepText, workspacePath, requestId, stepIndex }) {
  return detectFastAtomicLocalTask({
    instruction: stepText,
    workspacePath,
    requestId,
    stepIndex,
  })
}

function detectFastCompositeLocalTask({ instruction, context, workspacePath, requestId }) {
  const structuredSources = [context, instruction]

  for (const candidateSource of structuredSources) {
    const stepLines = extractStructuredCompositeSteps(candidateSource)

    if (stepLines.length < 2) {
      continue
    }

    const steps = []
    let everyStepMatched = true

    stepLines.forEach((stepText, index) => {
      if (!everyStepMatched) {
        return
      }

      const detectedStep = detectFastCompositeStepTask({
        stepText,
        workspacePath,
        requestId,
        stepIndex: index + 1,
      })

      if (!detectedStep) {
        everyStepMatched = false
        return
      }

      steps.push(detectedStep)
    })

    if (!everyStepMatched || steps.length < 2) {
      continue
    }

    return {
      type: 'composite-local',
      requestId: requestId || undefined,
      instruction,
      relativeTargetPath: `${steps.length} operaciones locales`,
      steps,
    }
  }

  return null
}

function detectFastLocalTask({ instruction, context, workspacePath, requestId }) {
  return detectFastAtomicLocalTask({
    instruction,
    context,
    workspacePath,
    requestId,
  })
}

async function runFastLocalTask(task) {
  if (!task || typeof task !== 'object') {
    return {
      ok: false,
      error: 'No se pudo ejecutar la ruta rápida solicitada.',
    }
  }

  switch (task.type) {
    case 'materialization-plan':
      return runLocalDeterministicTask(task)
    case 'composite-local': {
      const stepResults = []
      const createdPaths = []
      const touchedPaths = []

      for (const step of task.steps) {
        try {
          const stepResponse = await runFastLocalTask(step)

          if (stepResponse?.ok !== true) {
            return {
              ok: false,
              ...(task.requestId ? { requestId: task.requestId } : {}),
              instruction: task.instruction,
              error: `Ruta rápida compuesta interrumpida en el paso ${step.stepIndex} (${getFastTaskOperationLabel(step.type)}) sobre "${step.relativeTargetPath}".`,
              resultPreview: `Fallo en el paso ${step.stepIndex}.`,
              stepResults,
              details: {
                currentAction: step.type,
                currentTargetPath: step.resolvedTargetPath,
                createdPaths,
                touchedPaths,
                hasMaterialProgress: createdPaths.length > 0 || touchedPaths.length > 0,
                materialState: 'local-fast-partial',
              },
            }
          }

          normalizeExecutorPathList(stepResponse?.details?.createdPaths).forEach((entry) => {
            if (!createdPaths.includes(entry)) {
              createdPaths.push(entry)
            }
          })
          normalizeExecutorPathList(stepResponse?.details?.touchedPaths).forEach((entry) => {
            if (!touchedPaths.includes(entry)) {
              touchedPaths.push(entry)
            }
          })

          stepResults.push({
            step: step.stepIndex,
            operation: step.type,
            operationLabel: getFastTaskOperationLabel(step.type),
            targetPath: step.relativeTargetPath,
            resultPreview: stepResponse.resultPreview || buildOutputPreview(stepResponse.result),
          })
        } catch (error) {
          return {
            ok: false,
            ...(task.requestId ? { requestId: task.requestId } : {}),
            instruction: task.instruction,
            error: `Ruta rápida compuesta interrumpida en el paso ${step.stepIndex} (${getFastTaskOperationLabel(step.type)}) sobre "${step.relativeTargetPath}": ${error instanceof Error ? error.message : String(error)}`,
            resultPreview: `Fallo en el paso ${step.stepIndex}.`,
            stepResults,
            details: {
              currentAction: step.type,
              currentTargetPath: step.resolvedTargetPath,
              createdPaths,
              touchedPaths,
              hasMaterialProgress: createdPaths.length > 0 || touchedPaths.length > 0,
              materialState: 'local-fast-partial',
            },
          }
        }
      }

      const detail = stepResults
        .map(
          (stepResult) =>
            `${stepResult.step}. ${stepResult.operationLabel} sobre "${stepResult.targetPath}". ${stepResult.resultPreview}`,
        )
        .join('\n')

      return {
        ...buildFastLocalSuccessResponse(
          task,
          `Secuencia ejecutada correctamente:\n${detail}`,
          buildFastLocalSuccessDetails(task, {
            currentAction: 'composite-local',
            currentTargetPath:
              touchedPaths.at(-1) || createdPaths.at(-1) || task.resolvedTargetPath || undefined,
            createdPaths,
            touchedPaths,
            hasMaterialProgress: createdPaths.length > 0 || touchedPaths.length > 0,
            materialState: 'local-fast-composite',
            appliedReuseMode: task?.reuseMaterialization?.appliedReuseMode || 'none',
            reusedStyleFromArtifactId:
              task?.reuseMaterialization?.reusedStyleFromArtifactId || undefined,
            reusedStructureFromArtifactId:
              task?.reuseMaterialization?.reusedStructureFromArtifactId || undefined,
            reuseAppliedFields: Array.isArray(task?.reuseMaterialization?.reuseAppliedFields)
              ? task.reuseMaterialization.reuseAppliedFields
              : [],
            reuseMaterializationReason:
              task?.reuseMaterialization?.reuseMaterializationReason || undefined,
          }),
        ),
        stepResults,
      }
    }
    case 'replace-file': {
      await fs.promises.writeFile(task.resolvedTargetPath, task.nextContent, 'utf8')
      return buildFastLocalSuccessResponse(
        task,
        'Contenido reemplazado por completo.',
        buildFastLocalSuccessDetails(task),
      )
    }
    case 'create-folder': {
      await fs.promises.mkdir(task.resolvedTargetPath, { recursive: true })
      return buildFastLocalSuccessResponse(
        task,
        'Carpeta creada dentro del workspace.',
        buildFastLocalSuccessDetails(task),
      )
    }
    case 'create-file': {
      await fs.promises.mkdir(path.dirname(task.resolvedTargetPath), { recursive: true })
      await fs.promises.writeFile(
        task.resolvedTargetPath,
        task.initialContent || '',
        'utf8',
      )
      return buildFastLocalSuccessResponse(
        task,
        task.initialContent
          ? 'Archivo creado con contenido inicial.'
          : 'Archivo creado sin contenido inicial.',
        buildFastLocalSuccessDetails(task),
      )
    }
    case 'delete-file': {
      try {
        const fileStats = await fs.promises.stat(task.resolvedTargetPath)

        if (!fileStats.isFile()) {
          return {
            ok: false,
            ...(task.requestId ? { requestId: task.requestId } : {}),
            instruction: task.instruction,
            error: `La ruta rápida esperaba un archivo en "${task.relativeTargetPath}", pero encontró otro tipo de elemento.`,
          }
        }

        await fs.promises.unlink(task.resolvedTargetPath)

        return buildFastLocalSuccessResponse(
          task,
          'Archivo borrado del workspace.',
          buildFastLocalSuccessDetails(task, {
            createdPaths: [],
          }),
        )
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
          return buildFastLocalSuccessResponse(
            task,
            'El archivo no existía; no hubo cambios.',
            buildFastLocalSuccessDetails(task, {
              touchedPaths: [],
              hasMaterialProgress: false,
              materialState: 'local-fast-noop',
            }),
          )
        }

        throw error
      }
    }
    case 'delete-folder': {
      try {
        const folderStats = await fs.promises.stat(task.resolvedTargetPath)

        if (!folderStats.isDirectory()) {
          return {
            ok: false,
            ...(task.requestId ? { requestId: task.requestId } : {}),
            instruction: task.instruction,
            error: `La ruta rápida esperaba una carpeta en "${task.relativeTargetPath}", pero encontró otro tipo de elemento.`,
          }
        }

        await fs.promises.rm(task.resolvedTargetPath, { recursive: true, force: false })

        return buildFastLocalSuccessResponse(
          task,
          'Carpeta borrada del workspace.',
          buildFastLocalSuccessDetails(task, {
            createdPaths: [],
          }),
        )
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
          return buildFastLocalSuccessResponse(
            task,
            'La carpeta no existía; no hubo cambios.',
            buildFastLocalSuccessDetails(task, {
              touchedPaths: [],
              hasMaterialProgress: false,
              materialState: 'local-fast-noop',
            }),
          )
        }

        throw error
      }
    }
    case 'append-file': {
      try {
        const fileStats = await fs.promises.stat(task.resolvedTargetPath)

        if (!fileStats.isFile()) {
          return {
            ok: false,
            ...(task.requestId ? { requestId: task.requestId } : {}),
            instruction: task.instruction,
            error: `La ruta rápida esperaba un archivo en "${task.relativeTargetPath}" para hacer append, pero encontró otro tipo de elemento.`,
          }
        }
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
          return {
            ok: false,
            ...(task.requestId ? { requestId: task.requestId } : {}),
            instruction: task.instruction,
            error: `No se pudo hacer append porque el archivo "${task.relativeTargetPath}" no existe.`,
          }
        }

        throw error
      }

      await fs.promises.appendFile(task.resolvedTargetPath, task.appendContent, 'utf8')

      return buildFastLocalSuccessResponse(
        task,
        'Contenido agregado al final del archivo.',
        buildFastLocalSuccessDetails(task),
      )
    }
    case 'read-file': {
      const fileContent = await fs.promises.readFile(task.resolvedTargetPath, 'utf8')
      const preview = buildOutputPreview(fileContent, 700)
      const lineCount = fileContent ? fileContent.split(/\r?\n/).length : 0
      const detail = `Vista previa (${lineCount} líneas, ${fileContent.length} caracteres):\n${preview}`

      return buildFastLocalSuccessResponse(
        task,
        detail,
        buildFastLocalSuccessDetails(task, {
          touchedPaths: [],
          hasMaterialProgress: false,
          materialState: 'local-fast-readonly',
        }),
      )
    }
    case 'list-folder': {
      try {
        const folderStats = await fs.promises.stat(task.resolvedTargetPath)

        if (!folderStats.isDirectory()) {
          return {
            ok: false,
            ...(task.requestId ? { requestId: task.requestId } : {}),
            instruction: task.instruction,
            error: `La ruta rápida esperaba una carpeta en "${task.relativeTargetPath}", pero encontró otro tipo de elemento.`,
          }
        }

        const folderEntries = await fs.promises.readdir(task.resolvedTargetPath, {
          withFileTypes: true,
        })
        const sortedEntries = folderEntries
          .map((entry) => ({
            label: entry.isDirectory()
              ? `carpeta: ${entry.name}`
              : entry.isFile()
                ? `archivo: ${entry.name}`
                : `otro: ${entry.name}`,
            sortKey: entry.name.toLocaleLowerCase(),
          }))
          .sort((left, right) => left.sortKey.localeCompare(right.sortKey))
        const visibleEntries = sortedEntries.slice(0, 15).map((entry) => entry.label)
        const hiddenCount = Math.max(0, sortedEntries.length - visibleEntries.length)
        const detailLines = [
          `Elementos encontrados: ${sortedEntries.length}.`,
          ...(visibleEntries.length > 0 ? visibleEntries : ['La carpeta está vacía.']),
          ...(hiddenCount > 0 ? [`Se ocultaron ${hiddenCount} elementos adicionales.`] : []),
        ]

        return buildFastLocalSuccessResponse(
          task,
          detailLines.join('\n'),
          buildFastLocalSuccessDetails(task, {
            touchedPaths: [],
            hasMaterialProgress: false,
            materialState: 'local-fast-readonly',
          }),
        )
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
          return {
            ok: false,
            ...(task.requestId ? { requestId: task.requestId } : {}),
            instruction: task.instruction,
            error: `No se pudo listar porque la carpeta "${task.relativeTargetPath}" no existe.`,
          }
        }

        throw error
      }
    }
    case 'exists-check': {
      try {
        const targetStats = await fs.promises.stat(task.resolvedTargetPath)
        const detectedKind = targetStats.isDirectory()
          ? 'carpeta'
          : targetStats.isFile()
            ? 'archivo'
            : 'otro tipo'
        const expectedKindLabel =
          task.expectedTargetKind === 'folder'
            ? 'carpeta'
            : task.expectedTargetKind === 'file'
              ? 'archivo'
              : 'elemento'

        return buildFastLocalSuccessResponse(
          task,
          `Sí existe. Se detectó como ${detectedKind}; consulta esperada: ${expectedKindLabel}.`,
          buildFastLocalSuccessDetails(task, {
            touchedPaths: [],
            hasMaterialProgress: false,
            materialState: 'local-fast-readonly',
          }),
        )
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
          return buildFastLocalSuccessResponse(
            task,
            'No existe dentro del workspace.',
            buildFastLocalSuccessDetails(task, {
              touchedPaths: [],
              hasMaterialProgress: false,
              materialState: 'local-fast-readonly',
            }),
          )
        }

        throw error
      }
    }
    default:
      return {
        ok: false,
        ...(task.requestId ? { requestId: task.requestId } : {}),
        instruction: task.instruction,
        error: 'La ruta rápida detectada no pudo ejecutarse localmente.',
      }
  }
}

function buildLegacyPlannerInstruction(goal, iteration, previousExecutionResult) {
  const normalizedGoal = goal.toLocaleLowerCase()
  const normalizedPreviousExecutionResult =
    previousExecutionResult.toLocaleLowerCase()
  // Este fallback legacy tiene que respetar negaciones explícitas del objetivo.
  // Si el usuario dice "sin crear carpetas" o "sin tocar archivos", no podemos
  // degradar ese pedido a una instrucción de escritura local.
  const includesNegatedIntent = (patterns) =>
    patterns.some((pattern) => normalizedGoal.includes(pattern))
  const looksLikeCreateFolderGoal =
    normalizedGoal.includes('crear carpeta') ||
    normalizedGoal.includes('crear una carpeta') ||
    normalizedGoal.includes('crear directorio') ||
    normalizedGoal.includes('crear una carpeta llamada') ||
    normalizedGoal.includes('crear carpeta llamada')
  const negatesCreateFolderGoal = includesNegatedIntent([
    'sin crear carpeta',
    'sin crear carpetas',
    'sin crear una carpeta',
    'sin crear directorio',
    'sin crear directorios',
    'sin tocar archivos ni crear carpeta',
    'sin tocar archivos ni crear carpetas',
    'no crear carpeta',
    'no crear carpetas',
    'no crear una carpeta',
    'no crear directorio',
    'no crear directorios',
  ])
  const looksLikeCreateFileGoal =
    normalizedGoal.includes('crear archivo') ||
    normalizedGoal.includes('crear un archivo') ||
    normalizedGoal.includes('generar archivo') ||
    normalizedGoal.includes('hacer archivo') ||
    normalizedGoal.includes('crear archivo llamado') ||
    normalizedGoal.includes('crear un archivo llamado')
  const negatesCreateFileGoal = includesNegatedIntent([
    'sin crear archivo',
    'sin crear archivos',
    'sin crear un archivo',
    'sin tocar archivo',
    'sin tocar archivos',
    'no crear archivo',
    'no crear archivos',
    'no crear un archivo',
    'no tocar archivo',
    'no tocar archivos',
  ])
  const looksLikeEditFileGoal =
    normalizedGoal.includes('editar archivo') ||
    normalizedGoal.includes('modificar archivo') ||
    normalizedGoal.includes('actualizar archivo') ||
    normalizedGoal.includes('cambiar archivo') ||
    normalizedGoal.includes('reescribir archivo') ||
    normalizedGoal.includes('editar el archivo') ||
    normalizedGoal.includes('modificar el archivo')
  const looksLikeReadFileGoal =
    normalizedGoal.includes('leer archivo') ||
    normalizedGoal.includes('revisar archivo') ||
    normalizedGoal.includes('resumir archivo') ||
    normalizedGoal.includes('mostrar archivo') ||
    normalizedGoal.includes('ver archivo') ||
    normalizedGoal.includes('analizar archivo')
  const looksLikeTextResponseGoal =
    normalizedGoal.includes('respuesta') ||
    normalizedGoal.includes('responder') ||
    normalizedGoal.includes('explicar') ||
    normalizedGoal.includes('describir') ||
    normalizedGoal.includes('resumen') ||
    normalizedGoal.includes('breve') ||
    normalizedGoal.includes('texto')

  if (
    normalizedPreviousExecutionResult.includes('validación completa') ||
    normalizedPreviousExecutionResult.includes('validacion completa')
  ) {
    return {
      instruction: 'Cerrar la ejecución con una confirmación breve del objetivo cumplido',
      completed: true,
    }
  }

  if (!previousExecutionResult || iteration === 1) {
    if (looksLikeCreateFolderGoal && !negatesCreateFolderGoal) {
      const folderNameMatch = goal.match(
        /(?:carpeta|directorio)(?:\s+(?:llamada|con nombre|de nombre))?\s+["'“”]?([a-zA-Z0-9._-]+)["'“”]?/i,
      )
      const detectedFolderName = folderNameMatch?.[1]?.trim()

      return {
        instruction: detectedFolderName
          ? `Crear la carpeta "${detectedFolderName}" en la raíz del proyecto y devolver un resultado corto confirmando si quedó creada`
          : 'Crear una carpeta nueva en la raíz del proyecto según el objetivo indicado y devolver un resultado corto confirmando el nombre usado',
        completed: false,
      }
    }

    if (looksLikeCreateFileGoal && !negatesCreateFileGoal) {
      const fileNameMatch = goal.match(
        /(?:archivo)(?:\s+(?:llamado|con nombre|de nombre))?\s+["'“”]?([a-zA-Z0-9._-]+\.[a-zA-Z0-9]+|[a-zA-Z0-9._-]+)["'“”]?/i,
      )
      const detectedFileName = fileNameMatch?.[1]?.trim()

      return {
        instruction: detectedFileName
          ? `Crear el archivo "${detectedFileName}" en la raíz del workspace y escribir el contenido indicado en el objetivo o en el contexto adicional, devolviendo una confirmación breve`
          : 'Crear un archivo nuevo en la raíz del workspace según el objetivo indicado y devolver una confirmación breve con el nombre usado',
        completed: false,
      }
    }

    if (looksLikeEditFileGoal) {
      const filePathMatch = goal.match(
        /["'“”]?(([a-zA-Z]:\\|\.{1,2}[\\/]|\/)?[a-zA-Z0-9_\-.\\/]+?\.[a-zA-Z0-9]+)["'“”]?/i,
      )
      const detectedFilePath = filePathMatch?.[1]?.trim()

      return {
        instruction: detectedFilePath
          ? `Editar el archivo "${detectedFilePath}" dentro del workspace y reemplazar o actualizar su contenido según el objetivo o el contexto adicional, devolviendo una confirmación breve`
          : 'Editar el archivo indicado en el objetivo dentro del workspace y devolver una confirmación breve del cambio aplicado',
        completed: false,
      }
    }

    if (looksLikeReadFileGoal) {
      const filePathMatch = goal.match(
        /["'“”]?(([a-zA-Z]:\\|\.{1,2}[\\/]|\/)?[a-zA-Z0-9_\-.\\/]+?\.[a-zA-Z0-9]+)["'“”]?/i,
      )
      const detectedFilePath = filePathMatch?.[1]?.trim()

      return {
        instruction: detectedFilePath
          ? `Leer el archivo "${detectedFilePath}" dentro del workspace y devolver un resumen técnico breve en español argentino`
          : 'Leer el archivo indicado en el objetivo dentro del workspace y devolver un resumen técnico breve',
        completed: false,
      }
    }
  }

  if (!previousExecutionResult || iteration === 1) {
    return {
      instruction: looksLikeTextResponseGoal
        ? `Devolver una respuesta técnica breve en español argentino sobre: ${goal}`
        : `Resolver de forma concreta el objetivo indicado: ${goal}`,
      completed: false,
    }
  }

  if (normalizedPreviousExecutionResult.includes('correctamente')) {
    return {
      instruction: looksLikeTextResponseGoal
        ? `Validar y ajustar en una sola frase la respuesta técnica sobre: ${goal}`
        : `Validar el resultado anterior y completar el objetivo indicado: ${goal}`,
      completed: false,
    }
  }

  if (iteration >= 3) {
    return {
      instruction: 'Cerrar la ejecución con una confirmación breve del objetivo cumplido',
      completed: true,
    }
  }

  return {
    instruction: looksLikeTextResponseGoal
      ? `Reformular en una sola frase técnica el resultado sobre: ${goal}`
      : `Tomar el resultado anterior y resolver el objetivo indicado: ${goal}`,
    completed: false,
  }
}

function detectAnalysisProposalPlanningIntent(goal, context) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return {
      matches: false,
      explicitNoExecution: false,
      mentionsWorkflowSurface: false,
      mentionsHistoricalContext: false,
    }
  }

  const analysisProposalPatterns = [
    /preparar\s+una?\s+mejora/u,
    /proponer\s+una?\s+mejora/u,
    /analizar\s+una?\s+mejora/u,
    /revisar\s+flujo/u,
    /mejorar\s+flujo/u,
    /mejorar\s+flujo\s+de\s+trabajo/u,
    /validar\s+integraci[oó]n/u,
    /pensar\s+una?\s+mejora/u,
    /solo\s+analizar/u,
    /solo\s+proponer/u,
    /solo\s+generar\s+un?\s+plan/u,
  ]
  const nonExecutionPatterns = [
    /no\s+ejecutar/u,
    /no\s+ejecutar\s+cambios/u,
    /sin\s+ejecutar\s+cambios/u,
    /no\s+modificar\s+archivos/u,
    /sin\s+modificar\s+archivos/u,
    /sin\s+tocar\s+archivos/u,
    /solo\s+generar\s+un?\s+plan/u,
    /solo\s+plan/u,
    /solo\s+analizar/u,
    /solo\s+proponer/u,
    /todav[ií]a\s+no/u,
  ]
  const workflowSurfacePatterns = [
    /\bflujo\b/u,
    /\bplanificador\b/u,
    /\bplanner\b/u,
    /\bejecutor\b/u,
    /\bexecutor\b/u,
    /flujo\s+de\s+trabajo/u,
    /integraci[oó]n/u,
    /propuesta/u,
    /an[aá]lisis/u,
    /\bmejora\b/u,
  ]
  const historicalContextPatterns = [
    /contexto\s+hist[oó]rico/u,
    /memoria\s+externa/u,
    /context\s+hub/u,
    /memoria/u,
  ]

  const explicitNoExecution = nonExecutionPatterns.some((pattern) =>
    pattern.test(combinedText),
  )
  const mentionsWorkflowSurface = workflowSurfacePatterns.some((pattern) =>
    pattern.test(combinedText),
  )
  const mentionsHistoricalContext = historicalContextPatterns.some((pattern) =>
    pattern.test(combinedText),
  )
  const matches =
    analysisProposalPatterns.some((pattern) => pattern.test(combinedText)) &&
    (explicitNoExecution || mentionsWorkflowSurface || mentionsHistoricalContext)

  return {
    matches,
    explicitNoExecution,
    mentionsWorkflowSurface,
    mentionsHistoricalContext,
  }
}

function buildAnalysisProposalInstruction({
  goal,
  contextHubPack,
}) {
  const normalizedGoal = typeof goal === 'string' ? goal.trim() : ''
  const contextHubAvailable = contextHubPack?.available === true

  return `Analizar el flujo actual entre planificador y ejecutor y proponer una mejora mínima para que el plan generado sea más accionable, usando MEMORIA externa como contexto auxiliar si ${
    contextHubAvailable ? 'está disponible' : 'llega a estar disponible'
  }, sin modificar archivos ni ejecutar cambios en esta iteración. Objetivo de referencia: ${normalizedGoal}`
}

function detectProductArchitecturePlanningIntent(goal, context) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)

  if (!normalizedText) {
    return {
      matches: false,
      productTypeHint: 'unknown',
      complexityScore: 0,
      explicitSystemIntent: false,
      explicitDomainIntent: false,
    }
  }

  const directProductTypeMap = [
    { key: 'ecommerce', pattern: /\b(?:ecommerce|tienda online|tienda en linea)\b/u },
    { key: 'crm', pattern: /\bcrm\b/u },
    { key: 'erp', pattern: /\berp\b/u },
    { key: 'marketplace', pattern: /\bmarketplace\b/u },
    { key: 'saas', pattern: /\bsaas\b/u },
    {
      key: 'internal-tool',
      pattern:
        /\b(?:herramienta interna|tool interna|tool interno|gestion interna|operacion interna)\b/u,
    },
  ]
  const directProductType =
    directProductTypeMap.find(({ pattern }) => pattern.test(normalizedText))?.key ||
    'unknown'
  const explicitSystemIntent =
    /\b(?:hacer|crear|armar|construir|desarrollar|montar|preparar|generar)\b/u.test(
      normalizedText,
    ) &&
    /\b(?:sistema|plataforma|app|aplicacion|solucion|producto)\b/u.test(
      normalizedText,
    )
  const explicitDomainIntent =
    /\b(?:sistema|plataforma|app|aplicacion|crm|erp|marketplace|ecommerce|saas|herramienta|solucion)\s+para\b/u.test(
      normalizedText,
    )
  const complexitySignals = [
    /\busuarios\b/u,
    /\broles\b/u,
    /\bpermisos\b/u,
    /\bbackoffice\b/u,
    /\bpanel administrativo\b/u,
    /\bdashboard(?: operativo)?\b/u,
    /\bcarrito\b/u,
    /\bcheckout\b/u,
    /\bpagos\b/u,
    /\bmercado pago\b/u,
    /\bbase de datos\b/u,
    /\bautenticacion\b/u,
    /\breportes\b/u,
    /\bintegraciones?\b/u,
    /\bordenes\b/u,
    /\bpedidos\b/u,
    /\binventario\b/u,
    /\balumnos\b/u,
    /\bfamilias\b/u,
    /\bcursos\b/u,
    /\bcomunicaciones\b/u,
    /\bseguimiento\b/u,
    /\bturnos\b/u,
    /\bclinicas?\b/u,
    /\bescuelas?\b/u,
    /\bdespachantes?\b/u,
    /\baduana\b/u,
  ]
  const complexityScore = complexitySignals.reduce(
    (score, pattern) => (pattern.test(normalizedText) ? score + 1 : score),
    0,
  )
  const looksLikeInstitutionalWebOnly =
    /\b(?:web institucional|sitio institucional|landing|one page|home page|index\.html|styles\.css|script\.js|hero|paleta|tipografia)\b/u.test(
      normalizedText,
    ) &&
    !/\b(?:usuarios|roles|backoffice|panel administrativo|carrito|checkout|pagos|reportes|base de datos|autenticacion|integraciones?)\b/u.test(
      normalizedText,
    )
  const matches =
    !looksLikeInstitutionalWebOnly &&
    (directProductType !== 'unknown' ||
      explicitDomainIntent ||
      (explicitSystemIntent && complexityScore >= 1) ||
      complexityScore >= 3)

  return {
    matches,
    productTypeHint: directProductType,
    complexityScore,
    explicitSystemIntent,
    explicitDomainIntent,
  }
}

function detectSafeFirstDeliveryPlanningIntent(goal, context) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)

  if (!normalizedText) {
    return {
      matches: false,
      productTypeHint: 'unknown',
      explicitPhaseIntent: false,
      exclusionScore: 0,
      localPrototypeScore: 0,
      derivativeSignal: false,
    }
  }

  const directProductTypeMap = [
    { key: 'ecommerce', pattern: /\b(?:ecommerce|tienda online|tienda en linea)\b/u },
    { key: 'crm', pattern: /\bcrm\b/u },
    { key: 'erp', pattern: /\berp\b/u },
    { key: 'marketplace', pattern: /\bmarketplace\b/u },
    { key: 'saas', pattern: /\bsaas\b/u },
    {
      key: 'internal-tool',
      pattern:
        /\b(?:herramienta interna|tool interna|tool interno|gestion interna|operacion interna)\b/u,
    },
  ]
  const directProductType =
    directProductTypeMap.find(({ pattern }) => pattern.test(normalizedText))?.key ||
    (/catalogo|carrito|checkout|mercado pago|productos|backoffice/u.test(normalizedText)
      ? 'ecommerce'
      : /alumnos|familias|cursos|comunicaciones|seguimiento/u.test(normalizedText)
        ? 'crm'
        : /turnos|clinicas?|salud/u.test(normalizedText)
          ? 'business-system'
          : 'unknown')
  const explicitPhaseIntent =
    /\b(?:primera entrega segura|primera fase segura|safe first delivery|safe-first-delivery|base navegable inicial|prototipo funcional local|version inicial acotada|entrega inicial acotada|planificar una primera entrega segura|planificar la primera entrega segura|preparar la primera entrega segura|preparar la primera fase segura)\b/u.test(
      normalizedText,
    )
  const derivativeSignal =
    /\b(?:derivad[oa] desde arquitectura|derivado desde arquitectura|arquitectura de producto|no reanalizar toda la arquitectura|primera entrega segura priorizada)\b/u.test(
      normalizedText,
    )
  const exclusionSignals = [
    /\bsin pagos reales\b/u,
    /\bsin credenciales\b/u,
    /\bsin secretos\b/u,
    /\bsin webhooks?\b/u,
    /\bsin deploy\b/u,
    /\bsin migraciones\b/u,
    /\bsin auth real\b/u,
    /\bsin autenticacion real\b/u,
    /\bsin base de datos real\b/u,
    /\bsin persistencia real\b/u,
    /\bsin integraciones sensibles\b/u,
    /\bsin datos sensibles reales\b/u,
    /\bsin callbacks? externos reales\b/u,
  ]
  const exclusionScore = exclusionSignals.reduce(
    (score, pattern) => (pattern.test(normalizedText) ? score + 1 : score),
    0,
  )
  const localPrototypeSignals = [
    /\bmock\b/u,
    /\bsimulad[oa]\b/u,
    /\blocal\b/u,
    /\bdatos de muestra\b/u,
    /\bbase navegable\b/u,
    /\bprototipo\b/u,
    /\bpanel operativo inicial\b/u,
    /\bbackoffice mock\b/u,
  ]
  const localPrototypeScore = localPrototypeSignals.reduce(
    (score, pattern) => (pattern.test(normalizedText) ? score + 1 : score),
    0,
  )
  const complexitySignals = [
    /\bcatalogo\b/u,
    /\bproductos\b/u,
    /\bcarrito\b/u,
    /\bcheckout\b/u,
    /\bbackoffice\b/u,
    /\bpanel administrativo\b/u,
    /\bpanel operativo\b/u,
    /\breportes\b/u,
    /\busuarios\b/u,
    /\broles\b/u,
    /\bpermisos\b/u,
    /\balumnos\b/u,
    /\bfamilias\b/u,
    /\bcursos\b/u,
    /\bcomunicaciones\b/u,
    /\bseguimiento\b/u,
  ]
  const complexityScore = complexitySignals.reduce(
    (score, pattern) => (pattern.test(normalizedText) ? score + 1 : score),
    0,
  )
  const looksLikeInstitutionalWebOnly =
    /\b(?:web institucional|sitio institucional|landing|one page|home page|index\.html|styles\.css|script\.js|hero|paleta|tipografia)\b/u.test(
      normalizedText,
    ) &&
    !/\b(?:usuarios|roles|backoffice|panel administrativo|carrito|checkout|pagos|reportes|base de datos|autenticacion|integraciones?)\b/u.test(
      normalizedText,
    )
  const matches =
    !looksLikeInstitutionalWebOnly &&
    ((explicitPhaseIntent && (exclusionScore >= 2 || localPrototypeScore >= 1)) ||
      (derivativeSignal && (explicitPhaseIntent || exclusionScore >= 3)) ||
      (explicitPhaseIntent && complexityScore >= 2))

  return {
    matches,
    productTypeHint: directProductType,
    explicitPhaseIntent,
    exclusionScore,
    localPrototypeScore,
    derivativeSignal,
  }
}

function detectMaterializeSafeFirstDeliveryPlanningIntent(goal, context) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)

  if (!normalizedText) {
    return {
      matches: false,
      productTypeHint: 'unknown',
      explicitMaterializationIntent: false,
      explicitSafetyIntent: false,
      explicitLocalScope: false,
    }
  }

  const directProductTypeMap = [
    { key: 'ecommerce', pattern: /\b(?:ecommerce|tienda online|tienda en linea)\b/u },
    { key: 'crm', pattern: /\bcrm\b/u },
    { key: 'erp', pattern: /\berp\b/u },
    { key: 'marketplace', pattern: /\bmarketplace\b/u },
    { key: 'saas', pattern: /\bsaas\b/u },
    {
      key: 'internal-tool',
      pattern:
        /\b(?:herramienta interna|tool interna|tool interno|gestion interna|operacion interna)\b/u,
    },
  ]
  const directProductType =
    directProductTypeMap.find(({ pattern }) => pattern.test(normalizedText))?.key ||
    (/catalogo|carrito|checkout|mercado pago|productos|backoffice/u.test(normalizedText)
      ? 'ecommerce'
      : /alumnos|familias|cursos|comunicaciones|seguimiento/u.test(normalizedText)
        ? 'crm'
        : /turnos|clinicas?|salud/u.test(normalizedText)
          ? 'business-system'
          : 'unknown')
  const explicitMaterializationIntent =
    /\b(?:materializar|materializacion segura|materialización segura|preparar materializacion segura|preparar materialización segura|materializar primera entrega|materializar primera fase|plan materializable|plan ejecutable acotado)\b/u.test(
      normalizedText,
    )
  const explicitSafetyIntent =
    /\b(?:primera entrega segura|primera fase segura|safe first delivery|safe-first-delivery|sin pagos reales|sin credenciales|sin webhooks?|sin deploy|sin migraciones|sin auth real|sin autenticacion real|sin base de datos real|sin datos sensibles reales|sin integraciones externas reales)\b/u.test(
      normalizedText,
    )
  const explicitLocalScope =
    /\b(?:archivos locales|carpeta nueva|dentro del workspace|frontend navegable|datos mock|datos de muestra|checkout simulado|backoffice mock|carrito local)\b/u.test(
      normalizedText,
    )
  const looksLikeInstitutionalWebOnly =
    /\b(?:web institucional|sitio institucional|landing|one page|home page|index\.html|styles\.css|script\.js|hero|paleta|tipografia)\b/u.test(
      normalizedText,
    ) &&
    !/\b(?:usuarios|roles|backoffice|panel administrativo|carrito|checkout|pagos|reportes|base de datos|autenticacion|integraciones?)\b/u.test(
      normalizedText,
    )
  const matches =
    !looksLikeInstitutionalWebOnly &&
    explicitMaterializationIntent &&
    explicitSafetyIntent &&
    explicitLocalScope

  return {
    matches,
    productTypeHint: directProductType,
    explicitMaterializationIntent,
    explicitSafetyIntent,
    explicitLocalScope,
  }
}

function pushUniquePlannerValues(target, values, maxItems = 12) {
  if (!Array.isArray(target) || !Array.isArray(values)) {
    return target
  }

  const knownValues = new Set(
    target
      .filter((value) => typeof value === 'string' && value.trim())
      .map((value) => value.trim().toLocaleLowerCase()),
  )

  for (const value of values) {
    if (typeof value !== 'string' || !value.trim()) {
      continue
    }

    const normalizedValue = value.trim().toLocaleLowerCase()

    if (knownValues.has(normalizedValue)) {
      continue
    }

    target.push(value.trim())
    knownValues.add(normalizedValue)

    if (target.length >= maxItems) {
      break
    }
  }

  return target
}

function extractProductArchitectureDomainLabel(goal, context, productType) {
  const normalizedSourceText = normalizeSectorDetectionText(
    [goal, context]
      .filter((value) => typeof value === 'string' && value.trim())
      .join(' '),
  )

  const extractionPatterns = [
    /\b(?:ecommerce|crm|erp|marketplace|saas|sistema|plataforma|app|aplicacion|herramienta|solucion)\s+para\s+(.+?)(?=\s+(?:con|que|preparad[oa]|orientad[oa]|pensad[oa]|sin|no|y\b)|[.,;:]|$)/iu,
    /\bpara\s+(una?|el|la)\s+(.+?)(?=\s+(?:con|que|preparad[oa]|orientad[oa]|pensad[oa]|sin|no|y\b)|[.,;:]|$)/iu,
  ]

  for (const text of [goal, context]) {
    if (typeof text !== 'string' || !text.trim()) {
      continue
    }

    for (const pattern of extractionPatterns) {
      const match = text.match(pattern)
      const extractedLabel = sanitizeBusinessSectorLabel(match?.[2] || match?.[1] || '')

      if (extractedLabel) {
        return stripLeadingSpanishArticle(extractedLabel)
      }
    }
  }

  const explicitBusinessLabel = extractExplicitBusinessLabelFromPlanningText(goal, context)

  if (explicitBusinessLabel) {
    return explicitBusinessLabel
  }

  if (productType === 'ecommerce') {
    return 'comercio online'
  }

  if (productType === 'crm') {
    if (
      /\bescuel|\balumnos?\b|\bfamilias?\b|\bcursos?\b|\bdocentes?\b|\bpreceptores?\b/u.test(
        normalizedSourceText,
      )
    ) {
      return 'gestion escolar'
    }

    return 'gestion comercial o relacional'
  }

  if (productType === 'erp') {
    return 'operacion interna del negocio'
  }

  return ''
}

function detectSafeFirstDeliveryRequestTrackingIntent(normalizedText) {
  if (typeof normalizedText !== 'string' || !normalizedText.trim()) {
    return false
  }

  if (
    /\bsolicitudes?\b|\btickets?\b|\bmesa de ayuda\b|\bhelpdesk\b/u.test(
      normalizedText,
    )
  ) {
    return true
  }

  return (
    /\bestados?\b/u.test(normalizedText) &&
    /\boperativ|\bintern[ao]|\bgestion\b|\bobservaciones?\b|\bresponsables?\b/u.test(
      normalizedText,
    )
  )
}

function buildDynamicSafeDeliveryPlanParts(sourceText) {
  const normalizedText = normalizeSectorDetectionText(sourceText)
  const modules = []
  const mockData = []
  const screens = []
  const localBehavior = []

  if (!normalizedText) {
    return { modules, mockData, screens, localBehavior }
  }

  const definitions = [
    {
      label: 'perfiles',
      patterns: [/\bperfiles?\b/u],
      mockData: 'Perfiles mock para explorar relaciones y actividad local.',
      screen: 'perfiles',
      behavior: 'Revisar perfiles mock y su actividad local.',
    },
    {
      label: 'publicaciones',
      patterns: [/\bpublicaciones?\b/u],
      mockData: 'Publicaciones mock con estados visibles y contenido de ejemplo.',
      screen: 'publicaciones',
      behavior: 'Consultar publicaciones mock y registrar una publicacion simulada.',
    },
    {
      label: 'comentarios',
      patterns: [/\bcomentarios?\b/u],
      mockData: 'Comentarios mock asociados a publicaciones o conversaciones internas.',
      screen: 'comentarios',
      behavior: 'Registrar comentario mock y revisar conversaciones simuladas.',
    },
    {
      label: 'grupos',
      patterns: [/\bgrupos?\b/u],
      mockData: 'Grupos mock con participantes y estado inicial de actividad.',
      screen: 'grupos',
      behavior: 'Revisar grupos mock y su actividad inicial.',
    },
    {
      label: 'notificaciones',
      patterns: [/\bnotificaciones?\b/u],
      mockData: 'Notificaciones mock con estados de lectura o revision.',
      screen: 'notificaciones',
      behavior: 'Marcar notificacion como revisada y validar actividad local.',
    },
    {
      label: 'accesos',
      patterns: [/\baccesos?\b/u],
      mockData: 'Accesos mock con estado de ingreso y responsable local.',
      screen: 'accesos',
      behavior: 'Revisar accesos mock y su trazabilidad local.',
    },
    {
      label: 'alertas',
      patterns: [/\balertas?\b/u],
      mockData: 'Alertas mock con severidad y estado de revision local.',
      screen: 'alertas',
      behavior: 'Marcar alerta revisada y validar seguimiento local.',
    },
    {
      label: 'sensores',
      patterns: [/\bsensores?\b/u],
      mockData: 'Sensores mock con estado operativo y ultimo evento local.',
      screen: 'sensores',
      behavior: 'Cambiar estado de sensor y revisar eventos mock asociados.',
    },
    {
      label: 'zonas',
      patterns: [/\bzonas?\b/u],
      mockData: 'Zonas mock para distribuir alertas, accesos o cobertura local.',
      screen: 'zonas',
      behavior: 'Revisar zonas mock y su cobertura inicial.',
    },
    {
      label: 'operadores',
      patterns: [/\boperadores?\b/u],
      mockData: 'Operadores mock asignados a eventos o revisiones locales.',
      screen: 'operadores',
      behavior: 'Asignar operador mock y revisar su carga local.',
    },
    {
      label: 'eventos',
      patterns: [/\beventos?\b/u],
      mockData: 'Eventos mock con estado, responsable y detalle de muestra.',
      screen: 'eventos',
      behavior: 'Registrar evento mock y revisar su detalle local.',
    },
    {
      label: 'documentos',
      patterns: [/\bdocumentos?\b/u],
      mockData: 'Documentos mock con estado, responsable y vencimiento de muestra.',
      screen: 'documentos',
      behavior: 'Revisar documentos mock y cambiar su estado documental.',
    },
    {
      label: 'operaciones',
      patterns: [/\boperaciones?\b/u],
      mockData: 'Operaciones mock con estados y responsables de ejemplo.',
      screen: 'operaciones',
      behavior: 'Consultar operaciones mock y su avance local.',
    },
    {
      label: 'vencimientos',
      patterns: [/\bvencimientos?\b/u],
      mockData: 'Vencimientos mock con prioridad y estado de revision.',
      screen: 'vencimientos',
      behavior: 'Marcar vencimiento revisado y registrar seguimiento local.',
    },
    {
      label: 'observaciones',
      patterns: [/\bobservaciones?\b/u],
      mockData: 'Observaciones mock vinculadas al flujo principal del sistema.',
      screen: 'observaciones',
      behavior: 'Registrar observacion mock y revisar anotaciones locales.',
    },
    {
      label: 'responsables',
      patterns: [/\bresponsables?\b/u],
      mockData: 'Responsables mock asociados a tareas, documentos o solicitudes.',
      screen: 'responsables',
      behavior: 'Revisar responsables mock y su asignacion inicial.',
    },
    {
      label: 'rutas',
      patterns: [/\brutas?\b/u],
      mockData: 'Rutas mock con puntos de control y estado de recorrido.',
      screen: 'rutas',
      behavior: 'Consultar rutas mock y revisar su seguimiento local.',
    },
    {
      label: 'ubicaciones',
      patterns: [/\bubicaciones?\b/u],
      mockData: 'Ubicaciones mock con referencias y estado operativo.',
      screen: 'ubicaciones',
      behavior: 'Revisar ubicaciones mock y su relacion con el flujo principal.',
    },
    {
      label: 'turnos',
      patterns: [/\bturnos?\b/u],
      mockData: 'Turnos mock con estados, responsables y agenda local.',
      screen: 'turnos',
      behavior: 'Consultar turnos mock y cambiar su estado local.',
    },
    {
      label: 'pacientes',
      patterns: [/\bpacientes?\b/u],
      mockData: 'Pacientes mock sin datos sensibles reales.',
      screen: 'pacientes',
      behavior: 'Revisar pacientes mock y su seguimiento local.',
    },
    {
      label: 'profesionales',
      patterns: [/\bprofesionales?\b/u],
      mockData: 'Profesionales mock con disponibilidad y estado local.',
      screen: 'profesionales',
      behavior: 'Revisar profesionales mock y su agenda inicial.',
    },
    {
      label: 'ordenes',
      patterns: [/\bordenes?\b/u],
      mockData: 'Ordenes mock con estado, responsable y resumen operativo.',
      screen: 'ordenes',
      behavior: 'Consultar ordenes mock y revisar su estado local.',
    },
    {
      label: 'stock',
      patterns: [/\bstock\b/u],
      mockData: 'Stock mock con cantidades y estado de disponibilidad.',
      screen: 'stock',
      behavior: 'Revisar stock mock y sus cambios locales.',
    },
    {
      label: 'solicitudes',
      patterns: [/\bsolicitudes?\b|\btickets?\b|\bmesa de ayuda\b|\bhelpdesk\b/u],
      mockData: 'Solicitudes mock con historial, estado y responsables de ejemplo.',
      screen: 'detalle de solicitud',
      behavior: 'Consultar solicitudes mock y su historial local.',
    },
    {
      label: 'estados',
      patterns: [/\bestados?\b/u],
      mockData: 'Estados mock para validar transiciones del flujo principal.',
      screen: 'estado de seguimiento',
      behavior: 'Cambiar estados mock sin depender de servicios externos.',
    },
    {
      label: 'reportes',
      patterns: [/\breportes?\b/u],
      mockData: 'Reportes mock para revisar actividad, alertas o resultados del flujo principal.',
      screen: 'reportes',
      behavior: 'Revisar reportes mock y proximos pasos del flujo local.',
    },
  ]

  definitions.forEach((definition) => {
    if (!definition.patterns.some((pattern) => pattern.test(normalizedText))) {
      return
    }

    pushUniquePlannerValues(modules, [definition.label])
    pushUniquePlannerValues(mockData, [definition.mockData])
    pushUniquePlannerValues(screens, [definition.screen])
    pushUniquePlannerValues(localBehavior, [definition.behavior])
  })

  if (
    /\bpublicaciones?\b|\bcomentarios?\b|\bgrupos?\b|\bnotificaciones?\b/u.test(
      normalizedText,
    )
  ) {
    pushUniquePlannerValues(screens, ['inicio o feed'])
    pushUniquePlannerValues(localBehavior, [
      'Revisar actividad local, publicaciones y grupos mock desde una vista inicial.',
    ])
  }

  if (/\balertas?\b|\bsensores?\b|\beventos?\b|\baccesos?\b/u.test(normalizedText)) {
    pushUniquePlannerValues(screens, ['panel de monitoreo'])
    pushUniquePlannerValues(localBehavior, [
      'Revisar alertas, accesos o eventos mock desde un tablero inicial de monitoreo.',
    ])
  }

  if (/\bdocumentos?\b|\bvencimientos?\b/u.test(normalizedText)) {
    pushUniquePlannerValues(screens, ['panel documental'])
    pushUniquePlannerValues(localBehavior, [
      'Registrar observaciones mock y revisar vencimientos o estados documentales.',
    ])
  }

  return {
    modules,
    mockData,
    screens,
    localBehavior,
  }
}

function buildSafeFirstDeliveryPlan({
  goal,
  context,
  contextHubPack,
  intent,
}) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)
  const productType =
    intent?.productTypeHint && intent.productTypeHint !== 'unknown'
      ? intent.productTypeHint
      : /\bcarrito\b|\bcheckout\b|\bmercado pago\b|\bpagos\b|\bcatalogo\b|\bproductos\b/u.test(
            normalizedText,
          )
        ? 'ecommerce'
        : /\bcrm\b|\balumnos\b|\bfamilias\b|\bcursos\b|\bcomunicaciones\b|\bseguimiento\b/u.test(
              normalizedText,
            )
          ? 'crm'
          : /\berp\b|\baduana\b|\bdespachantes?\b/u.test(normalizedText)
            ? 'erp'
            : /\bmarketplace\b/u.test(normalizedText)
              ? 'marketplace'
              : /\bsaas\b/u.test(normalizedText)
                ? 'saas'
                : /\b(?:gestion interna|herramienta interna|operacion interna)\b/u.test(
                      normalizedText,
                    )
                  ? 'internal-tool'
                  : /\bturnos\b|\bclinicas?\b|\bsalud\b|\bsistema\b|\bplataforma\b|\bapp\b/u.test(
                        normalizedText,
                      )
                    ? 'business-system'
                    : 'unknown'
  const contextHubAvailable = contextHubPack?.available === true
  const domain = extractProductArchitectureDomainLabel(goal, context, productType)
  const domainLabel = domain || 'dominio a precisar'
  const dynamicPlanParts = buildDynamicSafeDeliveryPlanParts(combinedText)
  const hasExplicitDynamicModules = dynamicPlanParts.modules.length > 0
  const isSchoolCrm =
    productType === 'crm' &&
    /\bescuel|\balumnos?\b|\bfamilias?\b|\bcursos?\b|\bcomunicaciones?\b|\bseguimiento\b|\breportes?\b/u.test(
      normalizedText,
    )
  const isRequestTrackingSystem =
    productType !== 'ecommerce' &&
    detectSafeFirstDeliveryRequestTrackingIntent(normalizedText)
  const scope = []
  const modules = []
  const mockData = []
  const screens = []
  const localBehavior = []
  const explicitExclusions = []
  const approvalRequiredLater = []
  const successCriteria = []

  pushUniquePlannerValues(scope, [
    `Delimitar una primera entrega segura y revisable para ${domainLabel}.`,
    'Materializar solo un recorte local del flujo principal sin integraciones reales.',
    'Priorizar navegacion funcional, datos de muestra y estados simulados por sobre completitud total.',
  ])
  pushUniquePlannerValues(mockData, [
    'Datos de muestra consistentes para recorrer el flujo principal sin usar informacion sensible real.',
    'Estados y transiciones mock que permitan revisar el comportamiento esperado antes de integrar servicios reales.',
  ])
  pushUniquePlannerValues(localBehavior, [
    'Navegacion local entre modulos priorizados con datos de ejemplo.',
    'Estados simulados o memoria temporal para validar el flujo sin dependencias externas.',
    'Fallback explicito a mocks cuando una capacidad requiera credenciales, servicios externos o infraestructura real.',
  ])
  pushUniquePlannerValues(explicitExclusions, [
    'Pagos reales o cobros efectivos.',
    'Credenciales, secretos o configuraciones productivas.',
    'Webhooks, callbacks o integraciones externas reales.',
    'Deploy o publicacion productiva.',
    'Migraciones o persistencia real irreversible.',
    'Autenticacion real y manejo definitivo de sesiones sin aprobacion.',
    'Base de datos real y datos sensibles reales.',
  ])
  pushUniquePlannerValues(approvalRequiredLater, [
    'Credenciales reales, secretos y configuraciones productivas.',
    'Autenticacion real, permisos finos y politicas de acceso definitivas.',
    'Base de datos real, migraciones y respaldo operativo.',
    'Integraciones criticas, webhooks y despliegue.',
  ])
  pushUniquePlannerValues(successCriteria, [
    'El alcance de la primera entrega queda acotado y entendible para el usuario.',
    'Los modulos priorizados pueden revisarse con datos de muestra y sin integraciones reales.',
    'Quedan explicitados los limites, exclusiones y aprobaciones futuras antes de cualquier ejecucion.',
    'El resultado prepara un proximo plan materializable, pero no ejecuta cambios automaticamente.',
  ])

  switch (productType) {
    case 'ecommerce':
      pushUniquePlannerValues(scope, [
        'Base navegable del catalogo comercial con seleccion local y panel interno inicial.',
      ])
      pushUniquePlannerValues(modules, [
        'catalogo',
        'productos',
        'carrito local',
        'checkout simulado',
        'backoffice mock',
        'ordenes mock',
      ])
      pushUniquePlannerValues(mockData, [
        'Productos, categorias y precios de muestra.',
        'Ordenes simuladas y estados de compra mock.',
      ])
      pushUniquePlannerValues(screens, [
        'Inicio o catalogo principal.',
        'Detalle de producto.',
        'Carrito local.',
        'Checkout simulado.',
        'Backoffice inicial de productos.',
      ])
      pushUniquePlannerValues(localBehavior, [
        'Agregar y quitar productos en un carrito local simple.',
        'Calcular subtotal y resumen de compra sin cobrar dinero real.',
        'Generar una orden simulada visible en backoffice o resumen local.',
      ])
      pushUniquePlannerValues(approvalRequiredLater, [
        'Pasarela real de pagos, credenciales y webhooks de checkout.',
      ])
      break
    case 'crm':
      if (isSchoolCrm) {
        pushUniquePlannerValues(scope, [
          'Panel operativo inicial para gestion escolar con seguimiento academico y comunicaciones mock.',
        ])
        pushUniquePlannerValues(modules, [
          'alumnos',
          'familias',
          'cursos',
          'comunicaciones',
          'seguimiento',
          'reportes',
          'panel operativo',
        ])
        pushUniquePlannerValues(mockData, [
          'Alumnos mock, familias mock, cursos mock y comunicaciones mock sin datos sensibles reales.',
          'Seguimientos y reportes mock para revisar alertas, estados y proximos pasos.',
        ])
        pushUniquePlannerValues(screens, [
          'dashboard operativo',
          'alumnos',
          'familias',
          'cursos',
          'comunicaciones',
          'seguimiento',
          'reportes',
        ])
        pushUniquePlannerValues(localBehavior, [
          'Consultar alumnos mock y revisar su estado academico u operativo.',
          'Ver familias o responsables mock asociados a cada alumno.',
          'Revisar cursos mock y su composicion inicial.',
          'Registrar comunicacion simulada y dejar trazabilidad local.',
          'Actualizar seguimiento local de alertas, compromisos o proximos pasos.',
          'Revisar reportes mock sin usar datos sensibles reales.',
        ])
        pushUniquePlannerValues(approvalRequiredLater, [
          'Datos sensibles reales, permisos escolares finos, auditoria y resguardo institucional.',
        ])
        break
      }

      if (hasExplicitDynamicModules) {
        pushUniquePlannerValues(scope, [
          `Panel operativo inicial de ${domainLabel} con entidades explicitamente mencionadas en el objetivo.`,
        ])
        pushUniquePlannerValues(modules, dynamicPlanParts.modules)
        pushUniquePlannerValues(mockData, dynamicPlanParts.mockData)
        pushUniquePlannerValues(screens, dynamicPlanParts.screens)
        pushUniquePlannerValues(localBehavior, dynamicPlanParts.localBehavior)
        pushUniquePlannerValues(modules, ['panel operativo inicial'])
        pushUniquePlannerValues(screens, ['panel operativo inicial'])
        pushUniquePlannerValues(localBehavior, [
          'Revisar el flujo principal con entidades mock y seguimiento local sin integraciones reales.',
        ])
        pushUniquePlannerValues(approvalRequiredLater, [
          'Datos sensibles reales, auditoria y permisos finos por rol.',
        ])
        break
      }

      pushUniquePlannerValues(scope, [
        'Panel operativo inicial con entidades nucleares, seguimiento basico y vistas mock.',
      ])
      pushUniquePlannerValues(modules, [
        'entidades principales',
        'seguimiento',
        'comunicaciones mock',
        'reportes basicos',
        'panel operativo inicial',
      ])
      pushUniquePlannerValues(mockData, [
        'Contactos, cuentas o registros principales de muestra.',
        'Historiales y reportes mock sin datos sensibles reales.',
      ])
      pushUniquePlannerValues(screens, [
        'Listado principal.',
        'Detalle o ficha operativa.',
        'Panel de seguimiento.',
        'Reporte inicial.',
      ])
      pushUniquePlannerValues(localBehavior, [
        'Alta, edicion y consulta mock de entidades nucleares.',
        'Seguimiento local de estados y proximos pasos.',
        'Reportes basicos calculados con datos de muestra.',
      ])
      pushUniquePlannerValues(approvalRequiredLater, [
        'Datos sensibles reales, auditoria y permisos finos por rol.',
      ])
      break
    case 'erp':
      pushUniquePlannerValues(scope, [
        'Modulo operativo inicial con trazabilidad basica y panel de estados.',
      ])
      pushUniquePlannerValues(modules, [
        'maestros minimos',
        'operacion principal',
        'reportes internos',
        'auditoria mock',
      ])
      pushUniquePlannerValues(mockData, [
        'Operaciones y documentos de muestra.',
        'Estados operativos simulados para validar trazabilidad.',
      ])
      pushUniquePlannerValues(screens, [
        'Panel operativo inicial.',
        'Detalle de operacion.',
        'Reporte basico.',
      ])
      pushUniquePlannerValues(localBehavior, [
        'Registrar operaciones mock y transiciones de estado locales.',
        'Relacionar entidades y documentos sin integraciones criticas.',
      ])
      pushUniquePlannerValues(approvalRequiredLater, [
        'Reglas operativas criticas, auditoria definitiva y fuentes externas.',
      ])
      break
    default:
      pushUniquePlannerValues(scope, [
        'Estructura navegable inicial del flujo principal del producto.',
      ])
      if (hasExplicitDynamicModules) {
        pushUniquePlannerValues(modules, dynamicPlanParts.modules)
        pushUniquePlannerValues(mockData, dynamicPlanParts.mockData)
        pushUniquePlannerValues(screens, dynamicPlanParts.screens)
        pushUniquePlannerValues(localBehavior, dynamicPlanParts.localBehavior)
        pushUniquePlannerValues(modules, ['panel operativo'])
        pushUniquePlannerValues(screens, ['panel operativo inicial'])
      } else if (isRequestTrackingSystem) {
        pushUniquePlannerValues(modules, [
          'solicitudes',
          'estados',
          'reportes',
          'panel operativo',
        ])
        pushUniquePlannerValues(mockData, [
          'Solicitudes mock, estados mock y reportes mock para revisar el flujo principal.',
        ])
        pushUniquePlannerValues(screens, [
          'panel principal',
          'detalle de solicitud',
          'estado de seguimiento',
          'reportes',
        ])
        pushUniquePlannerValues(localBehavior, [
          'Consultar solicitudes mock y su historial local.',
          'Cambiar estados mock sin depender de servicios externos.',
          'Revisar reportes mock y proximos pasos del panel operativo.',
        ])
      } else {
        pushUniquePlannerValues(modules, [
          'entidades principales',
          'seguimiento',
          'reportes',
          'panel operativo',
        ])
        pushUniquePlannerValues(mockData, [
          'Entidades y estados de ejemplo para el flujo principal.',
        ])
        pushUniquePlannerValues(screens, [
          'vista principal',
          'detalle del flujo principal',
          'panel operativo inicial',
          'reportes',
        ])
        pushUniquePlannerValues(localBehavior, [
          'Recorrer el flujo principal con estados mock y datos de muestra.',
          'Actualizar seguimiento local y revisar reportes basicos.',
        ])
      }
      break
  }

  if (/\busuarios\b|\broles\b|\bpermisos\b/u.test(normalizedText)) {
    pushUniquePlannerValues(modules, ['usuarios y roles'])
    pushUniquePlannerValues(screens, ['Vista inicial de permisos o accesos mock'])
  }

  if (/\breportes\b/u.test(normalizedText)) {
    pushUniquePlannerValues(modules, ['reportes'])
    pushUniquePlannerValues(screens, ['Reporte inicial'])
  }

  if (/\bbackoffice\b|\bpanel administrativo\b/u.test(normalizedText)) {
    pushUniquePlannerValues(modules, ['backoffice mock'])
  }

  if (/\bdatos sensibles\b|\bmenores\b|\bsalud\b/u.test(normalizedText)) {
    pushUniquePlannerValues(approvalRequiredLater, [
      'Tratamiento de datos sensibles reales y politicas de resguardo.',
    ])
    pushUniquePlannerValues(explicitExclusions, [
      'Uso de datos sensibles reales o informacion productiva.',
    ])
  }

  return {
    tasks: [
      {
        step: 1,
        title: 'Delimitar el alcance exacto de la primera entrega segura y registrar sus exclusiones obligatorias.',
      },
      {
        step: 2,
        title: 'Definir la estructura navegable inicial y las pantallas prioritarias del flujo principal.',
      },
      {
        step: 3,
        title: 'Seleccionar los modulos mock o iniciales que si entran en esta fase local y revisable.',
      },
      {
        step: 4,
        title: 'Preparar datos de muestra, estados simulados y comportamiento local suficiente para validar el recorrido end-to-end.',
      },
      {
        step: 5,
        title: contextHubAvailable
          ? 'Cruzar el alcance propuesto con MEMORIA externa solo como apoyo contextual, sin depender de ella para definir la primera fase.'
          : 'Mantener el plan autocontenido y usar MEMORIA externa solo si luego aparece disponible como apoyo contextual.',
      },
      {
        step: 6,
        title: 'Dejar explicitamente fuera de alcance pagos reales, credenciales, webhooks, deploy, migraciones, auth real, base de datos real e integraciones sensibles.',
      },
      {
        step: 7,
        title: 'Devolver un plan concreto y revisable para la primera entrega segura, listo para una futura ejecucion manual y acotada.',
      },
    ],
    assumptions: [
      'Esta iteracion sigue siendo de planificacion; no corresponde crear archivos ni ejecutar cambios automaticamente.',
      'La primera entrega segura debe validar el flujo principal con mocks, datos de muestra y comportamiento local.',
      'Todo lo que requiera credenciales, infraestructura real, datos sensibles o integraciones criticas queda fuera de alcance hasta nueva aprobacion.',
      'El objetivo no es construir el sistema completo, sino preparar una base segura y revisable para la siguiente fase.',
    ],
    instruction:
      'Preparar un plan concreto, acotado y revisable para materializar solo la primera entrega segura del producto, definiendo alcance, modulos mock, datos de muestra, pantallas, comportamiento local, exclusiones explicitas y criterios de exito, sin crear archivos ni ejecutar cambios todavia.',
    safeFirstDeliveryPlan: {
      scope,
      modules,
      mockData,
      screens,
      localBehavior,
      explicitExclusions,
      approvalRequiredLater,
      successCriteria,
    },
  }
}

function buildMaterializeSafeFirstDeliveryFolderName({
  productType,
  domain,
  modules = [],
  entities = [],
  mockCollections = [],
  sourceText = '',
}) {
  const normalizedProductType =
    typeof productType === 'string' ? productType.trim().toLocaleLowerCase() : ''
  const normalizedSourceText = normalizeSectorDetectionText(sourceText)
  const blockedActorSlugs = new Set([
    'usuario',
    'usuarios',
    'user',
    'users',
    'cliente',
    'clientes',
    'admin',
    'administrador',
    'administradores',
    'operador',
    'operadores',
    'rol',
    'roles',
    'member',
    'members',
    'owner',
    'owners',
    'viewer',
    'viewers',
  ])
  const isMeaningfulFolderSlug = (value) => {
    const normalizedSlug =
      typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''

    if (!normalizedSlug) {
      return false
    }

    const slugTokens = normalizedSlug.split('-').filter(Boolean)

    if (slugTokens.length === 0) {
      return false
    }

    if (slugTokens.every((token) => blockedActorSlugs.has(token))) {
      return false
    }

    if (blockedActorSlugs.has(slugTokens[0]) && slugTokens.length <= 2) {
      return false
    }

    return true
  }
  const productTypeFolderSlugMap = {
    ecommerce: 'ecommerce',
    crm: 'crm',
    erp: 'erp',
    marketplace: 'marketplace',
    saas: 'saas',
  }
  const productTypeSlug = productTypeFolderSlugMap[normalizedProductType] || ''
  const normalizeFolderSlugCandidate = (value) => {
    const rawSlug = slugifyBusinessSector(value || '')

    if (!rawSlug) {
      return ''
    }

    const normalizedSlug = rawSlug
      .replace(/\b(?:app|aplicacion|plataforma|sistema|gestion|para|de|del|la|el)\b/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!normalizedSlug) {
      return ''
    }

    const normalizationRules = [
      { pattern: /\b(?:social|red-social|comunidades?|comunidad-barrial)\b/u, slug: 'social' },
      { pattern: /\b(?:seguridad|alertas|accesos|sensores|monitoreo-de-seguridad)\b/u, slug: 'seguridad' },
      { pattern: /\b(?:documental|documentos|vencimientos)\b/u, slug: 'documental' },
      { pattern: /\b(?:solicitudes|tickets|mesa-de-ayuda|helpdesk)\b/u, slug: 'solicitudes' },
      { pattern: /\b(?:navegacion|rutas|ubicaciones)\b/u, slug: 'navegacion' },
      { pattern: /\b(?:turnos|agenda)\b/u, slug: 'turnos' },
      { pattern: /\b(?:logistica|envios|entregas)\b/u, slug: 'logistica' },
      { pattern: /\b(?:monitoreo|observabilidad)\b/u, slug: 'monitoreo' },
      { pattern: /\b(?:gestion-escolar|escuelas|alumnos|familias|cursos)\b/u, slug: 'gestion-escolar' },
      { pattern: /\b(?:documental|documentos|observaciones|reportes)\b/u, slug: 'documental' },
      { pattern: /\b(?:comercio-online|tienda-online|catalogo|checkout)\b/u, slug: 'ecommerce' },
    ]

    return (
      normalizationRules.find(({ pattern }) => pattern.test(normalizedSlug))?.slug ||
      normalizedSlug
    )
  }
  const domainSlug = normalizeFolderSlugCandidate(domain || '')
  const moduleCandidateMap = [
    { slug: 'catalogo', pattern: /\bcatalogo\b|\bproductos\b/u },
    { slug: 'alumnos', pattern: /\balumnos\b|\bcursos\b|\bfamilias\b/u },
    { slug: 'ordenes', pattern: /\bordenes\b|\bpedidos\b/u },
    { slug: 'reportes', pattern: /\breportes\b/u },
    { slug: 'turnos-clinica', pattern: /\bturnos\b|\bclinicas?\b|\bsalud\b/u },
    { slug: 'backoffice', pattern: /\bbackoffice\b|\bpanel administrativo\b/u },
  ]
  const structuredLabels = [
    ...(Array.isArray(modules) ? modules : []),
    ...(Array.isArray(entities) ? entities : []),
    ...(Array.isArray(mockCollections) ? mockCollections : []),
  ]
  const structuredText = normalizeSectorDetectionText(structuredLabels.join(' '))
  const combinedStructuredSlug = normalizeFolderSlugCandidate(structuredLabels.join(' '))
  const moduleSlug =
    moduleCandidateMap.find(({ pattern }) =>
      pattern.test(structuredText) || pattern.test(normalizedSourceText),
    )?.slug || ''
  const structuredSlugCandidates = structuredLabels
    .map((entry) => normalizeFolderSlugCandidate(entry))
    .filter(Boolean)
  const prioritizedStructuredSlug =
    structuredSlugCandidates.find((entry) => isMeaningfulFolderSlug(entry)) || ''
  const sourceTextSlug = normalizeFolderSlugCandidate(sourceText)
  const folderSlug =
    (productTypeSlug && isMeaningfulFolderSlug(productTypeSlug)
      ? productTypeSlug
      : '') ||
    (domainSlug && isMeaningfulFolderSlug(domainSlug) ? domainSlug : '') ||
    (combinedStructuredSlug && isMeaningfulFolderSlug(combinedStructuredSlug)
      ? combinedStructuredSlug
      : '') ||
    (prioritizedStructuredSlug && isMeaningfulFolderSlug(prioritizedStructuredSlug)
      ? prioritizedStructuredSlug
      : '') ||
    (moduleSlug && isMeaningfulFolderSlug(moduleSlug) ? moduleSlug : '') ||
    (sourceTextSlug && isMeaningfulFolderSlug(sourceTextSlug) ? sourceTextSlug : '') ||
    'producto'

  return `safe-first-delivery-${folderSlug}`
}

function inferSafeFirstDeliveryMaterializationCollectionKey(label) {
  const normalizedLabel = normalizeSectorDetectionText(label)

  if (!normalizedLabel) {
    return ''
  }

  if (/\b(?:catalogo|productos?|detalle de producto|detalle principal)\b/u.test(normalizedLabel)) {
    return 'productos'
  }

  if (/\bcarrito\b/u.test(normalizedLabel)) {
    return 'carrito'
  }

  if (/\b(?:checkout|ordenes?|pedidos?)\b/u.test(normalizedLabel)) {
    return 'ordenes'
  }

  if (/\b(?:backoffice|panel administrativo|panel operativo|operacion)\b/u.test(normalizedLabel)) {
    return 'operacion'
  }

  if (/\bperfiles?\b/u.test(normalizedLabel)) {
    return 'perfiles'
  }

  if (/\bpublicaciones?\b/u.test(normalizedLabel)) {
    return 'publicaciones'
  }

  if (/\bcomentarios?\b/u.test(normalizedLabel)) {
    return 'comentarios'
  }

  if (/\bgrupos?\b/u.test(normalizedLabel)) {
    return 'grupos'
  }

  if (/\bnotificaciones?\b/u.test(normalizedLabel)) {
    return 'notificaciones'
  }

  if (/\baccesos?\b/u.test(normalizedLabel)) {
    return 'accesos'
  }

  if (/\balertas?\b/u.test(normalizedLabel)) {
    return 'alertas'
  }

  if (/\bsensores?\b/u.test(normalizedLabel)) {
    return 'sensores'
  }

  if (/\bzonas?\b/u.test(normalizedLabel)) {
    return 'zonas'
  }

  if (/\boperadores?\b/u.test(normalizedLabel)) {
    return 'operadores'
  }

  if (/\beventos?\b/u.test(normalizedLabel)) {
    return 'eventos'
  }

  if (/\bdocumentos?\b/u.test(normalizedLabel)) {
    return 'documentos'
  }

  if (/\boperaciones?\b/u.test(normalizedLabel)) {
    return 'operaciones'
  }

  if (/\bvencimientos?\b/u.test(normalizedLabel)) {
    return 'vencimientos'
  }

  if (/\bobservaciones?\b/u.test(normalizedLabel)) {
    return 'observaciones'
  }

  if (/\bresponsables?\b/u.test(normalizedLabel)) {
    return 'responsables'
  }

  if (/\brutas?\b/u.test(normalizedLabel)) {
    return 'rutas'
  }

  if (/\bubicaciones?\b/u.test(normalizedLabel)) {
    return 'ubicaciones'
  }

  if (/\bturnos?\b/u.test(normalizedLabel)) {
    return 'turnos'
  }

  if (/\bpacientes?\b/u.test(normalizedLabel)) {
    return 'pacientes'
  }

  if (/\bprofesionales?\b/u.test(normalizedLabel)) {
    return 'profesionales'
  }

  if (/\bstock\b/u.test(normalizedLabel)) {
    return 'stock'
  }

  if (/\balumnos?\b/u.test(normalizedLabel)) {
    return 'alumnos'
  }

  if (/\bfamilias?\b/u.test(normalizedLabel)) {
    return 'familias'
  }

  if (/\bcursos?\b/u.test(normalizedLabel)) {
    return 'cursos'
  }

  if (/\bcomunicaciones?\b/u.test(normalizedLabel)) {
    return 'comunicaciones'
  }

  if (/\bseguimiento\b/u.test(normalizedLabel)) {
    return 'seguimientos'
  }

  if (/\breportes?\b/u.test(normalizedLabel)) {
    return 'reportes'
  }

  if (/\bsolicitudes?\b/u.test(normalizedLabel)) {
    return 'solicitudes'
  }

  if (/\bestados?\b/u.test(normalizedLabel)) {
    return 'estados'
  }

  if (/\busuarios?\b|\broles?\b|\bpermisos?\b/u.test(normalizedLabel)) {
    return 'accesos'
  }

  return ''
}

function inferSafeFirstDeliveryMaterializationEntityName(label) {
  const normalizedLabel = normalizeSectorDetectionText(label)

  if (!normalizedLabel) {
    return ''
  }

  if (/\b(?:catalogo|productos?|detalle de producto|detalle principal)\b/u.test(normalizedLabel)) {
    return 'producto'
  }

  if (/\bcarrito\b/u.test(normalizedLabel)) {
    return 'carrito'
  }

  if (/\b(?:checkout|ordenes?|pedidos?)\b/u.test(normalizedLabel)) {
    return 'orden'
  }

  if (/\b(?:backoffice|panel administrativo|panel operativo|operacion)\b/u.test(normalizedLabel)) {
    return 'operacion'
  }

  if (/\bperfiles?\b/u.test(normalizedLabel)) {
    return 'perfil'
  }

  if (/\bpublicaciones?\b/u.test(normalizedLabel)) {
    return 'publicacion'
  }

  if (/\bcomentarios?\b/u.test(normalizedLabel)) {
    return 'comentario'
  }

  if (/\bgrupos?\b/u.test(normalizedLabel)) {
    return 'grupo'
  }

  if (/\bnotificaciones?\b/u.test(normalizedLabel)) {
    return 'notificacion'
  }

  if (/\baccesos?\b/u.test(normalizedLabel)) {
    return 'acceso'
  }

  if (/\balertas?\b/u.test(normalizedLabel)) {
    return 'alerta'
  }

  if (/\bsensores?\b/u.test(normalizedLabel)) {
    return 'sensor'
  }

  if (/\bzonas?\b/u.test(normalizedLabel)) {
    return 'zona'
  }

  if (/\boperadores?\b/u.test(normalizedLabel)) {
    return 'operador'
  }

  if (/\beventos?\b/u.test(normalizedLabel)) {
    return 'evento'
  }

  if (/\bdocumentos?\b/u.test(normalizedLabel)) {
    return 'documento'
  }

  if (/\boperaciones?\b/u.test(normalizedLabel)) {
    return 'operacion'
  }

  if (/\bvencimientos?\b/u.test(normalizedLabel)) {
    return 'vencimiento'
  }

  if (/\bobservaciones?\b/u.test(normalizedLabel)) {
    return 'observacion'
  }

  if (/\bresponsables?\b/u.test(normalizedLabel)) {
    return 'responsable'
  }

  if (/\brutas?\b/u.test(normalizedLabel)) {
    return 'ruta'
  }

  if (/\bubicaciones?\b/u.test(normalizedLabel)) {
    return 'ubicacion'
  }

  if (/\bturnos?\b/u.test(normalizedLabel)) {
    return 'turno'
  }

  if (/\bpacientes?\b/u.test(normalizedLabel)) {
    return 'paciente'
  }

  if (/\bprofesionales?\b/u.test(normalizedLabel)) {
    return 'profesional'
  }

  if (/\bstock\b/u.test(normalizedLabel)) {
    return 'stock'
  }

  if (/\balumnos?\b/u.test(normalizedLabel)) {
    return 'alumno'
  }

  if (/\bfamilias?\b/u.test(normalizedLabel)) {
    return 'familia'
  }

  if (/\bcursos?\b/u.test(normalizedLabel)) {
    return 'curso'
  }

  if (/\bcomunicaciones?\b/u.test(normalizedLabel)) {
    return 'comunicacion'
  }

  if (/\bseguimiento\b/u.test(normalizedLabel)) {
    return 'seguimiento'
  }

  if (/\breportes?\b/u.test(normalizedLabel)) {
    return 'reporte'
  }

  if (/\bsolicitudes?\b/u.test(normalizedLabel)) {
    return 'solicitud'
  }

  if (/\bestados?\b/u.test(normalizedLabel)) {
    return 'estado'
  }

  if (/\busuarios?\b/u.test(normalizedLabel)) {
    return 'usuario'
  }

  if (/\broles?\b/u.test(normalizedLabel)) {
    return 'rol'
  }

  return ''
}

function buildSafeFirstDeliveryMaterializationStateHints({
  productType,
  isSchoolCrm,
  isRequestTrackingSystem,
}) {
  if (productType === 'ecommerce') {
    return ['borrador', 'publicado', 'simulada', 'en revision']
  }

  if (productType === 'crm' && isSchoolCrm) {
    return ['regular', 'alerta', 'pendiente', 'en curso', 'listo para revision']
  }

  if (isRequestTrackingSystem) {
    return ['nueva', 'en revision', 'resuelta mock', 'habilitada']
  }

  return ['listo para demo', 'en revision', 'aprobado mock']
}

function buildSafeFirstDeliveryMaterializationApprovalThemes({
  productType,
  isSchoolCrm,
}) {
  if (productType === 'ecommerce') {
    return [
      'pasarela de pagos',
      'credenciales reales',
      'webhooks y conciliacion',
      'persistencia real',
      'autenticacion real',
      'deploy',
    ]
  }

  if (productType === 'crm' && isSchoolCrm) {
    return [
      'autenticacion y permisos',
      'datos sensibles reales',
      'auditoria y trazabilidad',
      'persistencia real',
      'integraciones institucionales',
      'cumplimiento normativo o institucional',
    ]
  }

  return [
    'autenticacion real',
    'permisos',
    'persistencia real',
    'auditoria',
    'integraciones externas',
    'datos productivos',
  ]
}

function buildSafeFirstDeliveryMaterializationContract({
  domainLabel,
  productType,
  modules,
  screens,
  localActions,
  explicitExclusions,
  approvalThemes,
  stateHints,
  mockDataHints,
}) {
  const normalizedModules = summarizeUniqueExecutorStrings(modules, 12)
  const normalizedScreens = summarizeUniqueExecutorStrings(screens, 12)
  const normalizedLocalActions = summarizeUniqueExecutorStrings(localActions, 12)
  const normalizedExclusions = summarizeUniqueExecutorStrings(explicitExclusions, 12)
  const normalizedApprovalThemes = summarizeUniqueExecutorStrings(approvalThemes, 12)
  const normalizedStateHints = summarizeUniqueExecutorStrings(stateHints, 10)
  const normalizedMockDataHints = summarizeUniqueExecutorStrings(mockDataHints, 12)
  const entityInferenceSources =
    normalizedModules.length > 0 ? normalizedModules : normalizedMockDataHints
  const entities = summarizeUniqueExecutorStrings(
    [
      ...entityInferenceSources.map(inferSafeFirstDeliveryMaterializationEntityName),
    ].filter(Boolean),
    12,
  )
  const collectionInferenceSources =
    normalizedModules.length > 0 ? normalizedModules : normalizedMockDataHints
  const mockCollections = summarizeUniqueExecutorStrings(
    [
      ...collectionInferenceSources.map(inferSafeFirstDeliveryMaterializationCollectionKey),
    ].filter(Boolean),
    12,
  )

  return {
    domainLabel: domainLabel || 'dominio a precisar',
    productType: productType || 'unknown',
    modules: normalizedModules,
    screens: normalizedScreens,
    entities,
    mockCollections,
    localActions: normalizedLocalActions,
    stateHints: normalizedStateHints,
    approvalThemes: normalizedApprovalThemes,
    explicitExclusions: normalizedExclusions,
  }
}

function buildMaterializeSafeFirstDeliveryPlan({
  goal,
  context,
  workspacePath,
  contextHubPack,
  intent,
}) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)
  const productType =
    intent?.productTypeHint && intent.productTypeHint !== 'unknown'
      ? intent.productTypeHint
      : /\bcarrito\b|\bcheckout\b|\bmercado pago\b|\bpagos\b|\bcatalogo\b|\bproductos\b/u.test(
            normalizedText,
          )
        ? 'ecommerce'
        : /\bcrm\b|\balumnos\b|\bfamilias\b|\bcursos\b|\bcomunicaciones\b|\bseguimiento\b/u.test(
              normalizedText,
            )
          ? 'crm'
          : /\berp\b|\baduana\b|\bdespachantes?\b/u.test(normalizedText)
            ? 'erp'
            : /\bmarketplace\b/u.test(normalizedText)
              ? 'marketplace'
              : /\bsaas\b/u.test(normalizedText)
                ? 'saas'
                : /\b(?:gestion interna|herramienta interna|operacion interna)\b/u.test(
                      normalizedText,
                    )
                  ? 'internal-tool'
                  : /\bturnos\b|\bclinicas?\b|\bsalud\b|\bsistema\b|\bplataforma\b|\bapp\b/u.test(
                        normalizedText,
                      )
                    ? 'business-system'
                    : 'unknown'
  const contextHubAvailable = contextHubPack?.available === true
  const domain = extractProductArchitectureDomainLabel(goal, context, productType)
  const domainLabel = domain || 'dominio a precisar'
  const dynamicPlanParts = buildDynamicSafeDeliveryPlanParts(combinedText)
  const hasExplicitDynamicModules = dynamicPlanParts.modules.length > 0
  const isSchoolCrm =
    productType === 'crm' &&
    /\bescuel|\balumnos?\b|\bfamilias?\b|\bcursos?\b|\bcomunicaciones?\b|\bseguimiento\b|\breportes?\b/u.test(
      normalizedText,
    )
  const isRequestTrackingSystem =
    productType !== 'ecommerce' &&
    detectSafeFirstDeliveryRequestTrackingIntent(normalizedText)
  const scopeHighlights = []
  const moduleHighlights = []
  const screenHighlights = []
  const mockDataHighlights = []
  const localBehaviorHighlights = []
  const exclusionHighlights = []

  if (productType === 'ecommerce') {
    pushUniquePlannerValues(scopeHighlights, [
      'Base navegable con catalogo, detalle de producto, carrito local, checkout simulado y backoffice mock inicial.',
    ])
    pushUniquePlannerValues(moduleHighlights, [
      'catalogo',
      'detalle de producto',
      'carrito local',
      'checkout simulado',
      'backoffice mock',
    ])
    pushUniquePlannerValues(screenHighlights, [
      'catalogo principal',
      'detalle de producto',
      'carrito local',
      'checkout simulado',
      'panel mock de productos',
    ])
    pushUniquePlannerValues(mockDataHighlights, [
      'productos, categorias, precios y estados de orden mock editables',
    ])
    pushUniquePlannerValues(localBehaviorHighlights, [
      'navegacion entre catalogo, carrito y checkout simulado',
      'edicion local de productos mock desde backoffice inicial',
    ])
  } else if (productType === 'crm') {
    if (isSchoolCrm) {
      pushUniquePlannerValues(scopeHighlights, [
        'Panel operativo inicial para gestion escolar con alumnos, familias, cursos, comunicaciones, seguimiento y reportes mock.',
      ])
      pushUniquePlannerValues(moduleHighlights, [
        'alumnos',
        'familias',
        'cursos',
        'comunicaciones',
        'seguimiento',
        'reportes',
        'panel operativo',
      ])
      pushUniquePlannerValues(screenHighlights, [
        'dashboard operativo',
        'alumnos',
        'familias',
        'cursos',
        'comunicaciones',
        'seguimiento',
        'reportes',
      ])
      pushUniquePlannerValues(mockDataHighlights, [
        'alumnos mock, familias mock, cursos mock, comunicaciones mock, seguimientos mock y reportes mock editables',
      ])
      pushUniquePlannerValues(localBehaviorHighlights, [
        'consultar alumnos mock y revisar familias o responsables asociados',
        'registrar comunicacion simulada y actualizar seguimiento local',
        'revisar reportes mock sin datos sensibles reales',
      ])
    } else {
      if (hasExplicitDynamicModules) {
        pushUniquePlannerValues(scopeHighlights, [
          `Primera version navegable de ${domainLabel} con entidades explicitamente mencionadas en el objetivo.`,
        ])
        pushUniquePlannerValues(moduleHighlights, dynamicPlanParts.modules)
        pushUniquePlannerValues(screenHighlights, dynamicPlanParts.screens)
        pushUniquePlannerValues(mockDataHighlights, dynamicPlanParts.mockData)
        pushUniquePlannerValues(localBehaviorHighlights, dynamicPlanParts.localBehavior)
        pushUniquePlannerValues(moduleHighlights, ['panel operativo inicial'])
        pushUniquePlannerValues(screenHighlights, ['panel operativo inicial'])
        pushUniquePlannerValues(localBehaviorHighlights, [
          'Revisar el flujo principal con entidades mock y actividad local sin integraciones reales.',
        ])
      } else {
        pushUniquePlannerValues(scopeHighlights, [
          'Panel operativo inicial con entidades principales, seguimiento basico y reportes mock.',
        ])
        pushUniquePlannerValues(moduleHighlights, [
          'entidades principales',
          'seguimiento',
          'panel operativo inicial',
          'reportes mock',
        ])
        pushUniquePlannerValues(screenHighlights, [
          'listado principal',
          'detalle operativo',
          'seguimiento',
          'reporte inicial',
        ])
        pushUniquePlannerValues(mockDataHighlights, [
          'entidades, estados y reportes mock editables sin datos sensibles reales',
        ])
        pushUniquePlannerValues(localBehaviorHighlights, [
          'alta, consulta y actualizacion local de entidades mock',
          'seguimiento local de estados y proximos pasos',
        ])
      }
    }
  } else {
    if (hasExplicitDynamicModules) {
      pushUniquePlannerValues(scopeHighlights, [
        `Primera version navegable del flujo principal para ${domainLabel}.`,
      ])
      pushUniquePlannerValues(moduleHighlights, dynamicPlanParts.modules)
      pushUniquePlannerValues(screenHighlights, dynamicPlanParts.screens)
      pushUniquePlannerValues(mockDataHighlights, dynamicPlanParts.mockData)
      pushUniquePlannerValues(localBehaviorHighlights, dynamicPlanParts.localBehavior)
      pushUniquePlannerValues(moduleHighlights, ['panel operativo'])
      pushUniquePlannerValues(screenHighlights, ['panel operativo inicial'])
      pushUniquePlannerValues(localBehaviorHighlights, [
        'Revisar el flujo principal con entidades mock y actividad local sin integraciones reales.',
      ])
    } else if (isRequestTrackingSystem) {
      pushUniquePlannerValues(scopeHighlights, [
        `Primera version navegable del flujo principal para ${domainLabel}.`,
      ])
      pushUniquePlannerValues(moduleHighlights, [
        'solicitudes',
        'estados',
        'reportes',
        'panel operativo',
      ])
      pushUniquePlannerValues(screenHighlights, [
        'panel principal',
        'detalle de solicitud',
        'estado de seguimiento',
        'reportes',
      ])
      pushUniquePlannerValues(mockDataHighlights, [
        'solicitudes mock, estados mock y reportes mock editables',
      ])
      pushUniquePlannerValues(localBehaviorHighlights, [
        'consultar solicitudes mock y cambiar su estado local',
        'revisar reportes mock y proximos pasos del panel operativo',
      ])
    } else {
      pushUniquePlannerValues(scopeHighlights, [
        `Primera version navegable del flujo principal para ${domainLabel}.`,
      ])
      pushUniquePlannerValues(moduleHighlights, [
        'entidades principales',
        'seguimiento',
        'reportes',
        'panel operativo',
      ])
      pushUniquePlannerValues(screenHighlights, [
        'vista principal',
        'detalle principal',
        'panel operativo inicial',
        'reportes',
      ])
      pushUniquePlannerValues(mockDataHighlights, [
        'entidades y estados mock editables para recorrer la experiencia',
      ])
      pushUniquePlannerValues(localBehaviorHighlights, [
        'navegacion local completa sin dependencias externas reales',
      ])
    }
  }

  pushUniquePlannerValues(exclusionHighlights, [
    'pagos reales',
    'credenciales reales',
    'webhooks reales',
    'deploy',
    'migraciones',
    'auth real',
    'base de datos real',
    'integraciones externas reales',
    'datos sensibles reales',
  ])
  const approvalThemes = buildSafeFirstDeliveryMaterializationApprovalThemes({
    productType,
    isSchoolCrm,
  })
  const safeFirstDeliveryMaterialization = buildSafeFirstDeliveryMaterializationContract({
    domainLabel,
    productType,
    modules: moduleHighlights,
    screens: screenHighlights,
    localActions: localBehaviorHighlights,
    explicitExclusions: exclusionHighlights,
    approvalThemes,
    stateHints: buildSafeFirstDeliveryMaterializationStateHints({
      productType,
      isSchoolCrm,
      isRequestTrackingSystem,
    }),
    mockDataHints: mockDataHighlights,
  })
  const targetFolderName = buildMaterializeSafeFirstDeliveryFolderName({
    productType,
    domain,
    modules: moduleHighlights,
    entities: safeFirstDeliveryMaterialization.entities,
    mockCollections: safeFirstDeliveryMaterialization.mockCollections,
    sourceText: combinedText,
  })
  const allowedTargetPaths = [
    targetFolderName,
    path.join(targetFolderName, 'index.html'),
    path.join(targetFolderName, 'styles.css'),
    path.join(targetFolderName, 'script.js'),
    path.join(targetFolderName, 'mock-data.json'),
  ]
  const successCriteria = summarizeUniqueExecutorStrings(
    [
      `Materializar solo la carpeta "${targetFolderName}" y sus archivos locales permitidos.`,
      'Entregar una experiencia navegable con datos mock editables para el flujo principal.',
      'Mantener fuera de alcance pagos reales, credenciales, webhooks, deploy, migraciones, auth real, base de datos real e integraciones externas reales.',
      workspacePath
        ? `Resolver todo dentro del workspace configurado: ${workspacePath}.`
        : 'Resolver todo dentro del workspace activo del proyecto.',
    ],
    4,
  )
  const executionScope = normalizeExecutorExecutionScope({
    allowedTargetPaths,
    successCriteria,
    enforceNarrowScope: true,
  })

  const instructionLines = [
    `Materializar una primera entrega segura y acotada dentro de "${targetFolderName}" en el workspace local.`,
    `Usar solo los archivos permitidos: ${allowedTargetPaths
      .slice(1)
      .map((entry) => `"${entry}"`)
      .join(', ')}.`,
    scopeHighlights.length > 0
      ? `Alcance funcional: ${scopeHighlights.join(' | ')}`
      : '',
    moduleHighlights.length > 0
      ? `Modulos a cubrir: ${moduleHighlights.join(' | ')}`
      : '',
    screenHighlights.length > 0
      ? `Pantallas o vistas: ${screenHighlights.join(' | ')}`
      : '',
    mockDataHighlights.length > 0
      ? `Datos mock requeridos: ${mockDataHighlights.join(' | ')}`
      : '',
    localBehaviorHighlights.length > 0
      ? `Comportamiento local esperado: ${localBehaviorHighlights.join(' | ')}`
      : '',
    `Excluir explícitamente: ${exclusionHighlights.join(' | ')}.`,
    'Usar datos mock editables, comportamiento local y cero conexiones externas reales.',
    `allowedTargetPaths: ${allowedTargetPaths.join(', ')}`,
    `successCriteria: ${successCriteria.join(' | ')}`,
  ].filter(Boolean)

  return {
    tasks: [
      {
        step: 1,
        title: `Preparar la carpeta "${targetFolderName}" y definir solo los archivos locales permitidos.`,
        operation: 'create-folder',
        targetPath: targetFolderName,
      },
      {
        step: 2,
        title: 'Materializar una interfaz navegable inicial con vistas, flujo principal y datos mock editables.',
        operation: 'create-or-edit-files',
        targetPath: targetFolderName,
      },
      {
        step: 3,
        title: 'Validar que todo siga local, mock y acotado, sin tocar integraciones reales ni salir del scope permitido.',
        operation: 'validate-scope',
        targetPath: targetFolderName,
      },
    ],
    assumptions: [
      'Esta iteracion prepara un plan ejecutable posterior, pero la UI no debe ejecutarlo automaticamente.',
      `Toda la materializacion queda acotada a "${targetFolderName}" y a los archivos declarados en allowedTargetPaths.`,
      'La primera entrega debe usar datos mock editables, frontend navegable y comportamiento local sin servicios externos reales.',
      'Pagos reales, credenciales, webhooks, deploy, migraciones, auth real, base de datos real y datos sensibles reales quedan fuera de alcance.',
      contextHubAvailable
        ? 'MEMORIA externa puede usarse como apoyo contextual, pero no para ampliar el alcance ni salir del workspace.'
        : 'El plan debe ser util aun sin MEMORIA externa disponible.',
    ],
    instruction: instructionLines.join('\n'),
    executionScope,
    safeFirstDeliveryMaterialization,
  }
}

function buildProductArchitecturePlan({
  goal,
  context,
  contextHubPack,
  intent,
}) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)
  const productType =
    intent?.productTypeHint && intent.productTypeHint !== 'unknown'
      ? intent.productTypeHint
      : /\bcarrito\b|\bcheckout\b|\bmercado pago\b|\bpagos\b/u.test(normalizedText)
        ? 'ecommerce'
        : /\bcrm\b/u.test(normalizedText)
          ? 'crm'
          : /\berp\b/u.test(normalizedText)
            ? 'erp'
            : /\bmarketplace\b/u.test(normalizedText)
              ? 'marketplace'
              : /\bsaas\b/u.test(normalizedText)
                ? 'saas'
                : /\b(?:gestion interna|herramienta interna|operacion interna)\b/u.test(
                      normalizedText,
                    )
                  ? 'internal-tool'
                  : /\b(?:sistema|plataforma|app|aplicacion|solucion)\b/u.test(
                        normalizedText,
                      )
                    ? 'business-system'
                    : 'unknown'
  const domain = extractProductArchitectureDomainLabel(goal, context, productType)
  const users = []
  const roles = []
  const coreModules = []
  const dataEntities = []
  const keyFlows = []
  const integrations = []
  const criticalRisks = []
  const approvalRequiredFor = []
  const safeFirstDelivery = []
  const outOfScopeForFirstIteration = []
  const phases = []

  pushUniquePlannerValues(
    criticalRisks,
    [
      'Evitar intentar construir todo el sistema en una sola corrida.',
      'Separar claramente maqueta visual, prototipo funcional local y sistema real con integraciones.',
    ],
    14,
  )
  pushUniquePlannerValues(
    outOfScopeForFirstIteration,
    [
      'Produccion completa con integraciones reales, secretos y despliegue final.',
      'Automatizaciones irreversibles o migraciones sin aprobacion humana.',
    ],
    12,
  )

  switch (productType) {
    case 'ecommerce':
      pushUniquePlannerValues(users, ['cliente final', 'operador comercial', 'administrador'])
      pushUniquePlannerValues(roles, ['cliente', 'catalog-admin', 'admin'])
      pushUniquePlannerValues(
        coreModules,
        ['catalogo', 'productos', 'carrito', 'checkout', 'ordenes', 'backoffice'],
      )
      pushUniquePlannerValues(
        dataEntities,
        ['producto', 'categoria', 'carrito', 'orden', 'cliente'],
      )
      pushUniquePlannerValues(
        keyFlows,
        [
          'Explorar catalogo y ver detalle de producto.',
          'Agregar productos al carrito y revisar totales.',
          'Iniciar checkout y registrar una orden.',
          'Gestionar productos y ordenes desde backoffice.',
        ],
      )
      pushUniquePlannerValues(safeFirstDelivery, [
        'Catalogo navegable con productos de muestra y carrito local.',
        'Backoffice minimo para alta y edicion de productos sin pagos reales.',
        'Checkout simulado o preparado para futura integracion.',
      ])
      break
    case 'crm':
      pushUniquePlannerValues(
        users,
        ['administrador', 'equipo operativo', 'usuario final del seguimiento'],
      )
      pushUniquePlannerValues(roles, ['admin', 'operador', 'supervisor'])
      pushUniquePlannerValues(
        coreModules,
        ['contactos', 'seguimiento', 'comunicaciones', 'reportes', 'configuracion'],
      )
      pushUniquePlannerValues(
        dataEntities,
        ['contacto', 'cuenta', 'interaccion', 'seguimiento', 'reporte'],
      )
      pushUniquePlannerValues(
        keyFlows,
        [
          'Registrar y actualizar entidades principales.',
          'Seguir historial y proximos pasos por caso o cuenta.',
          'Emitir reportes operativos y de gestion.',
        ],
      )
      pushUniquePlannerValues(safeFirstDelivery, [
        'CRUD inicial de entidades nucleares con permisos basicos.',
        'Vista operativa de seguimiento y estado.',
        'Reportes basicos sin automatizaciones externas.',
      ])
      break
    case 'erp':
      pushUniquePlannerValues(users, ['administrador', 'operador interno', 'responsable de area'])
      pushUniquePlannerValues(roles, ['admin', 'operador', 'supervisor'])
      pushUniquePlannerValues(
        coreModules,
        ['maestros', 'operaciones', 'reportes', 'auditoria', 'configuracion'],
      )
      pushUniquePlannerValues(
        dataEntities,
        ['cliente', 'proveedor', 'operacion', 'documento', 'reporte'],
      )
      pushUniquePlannerValues(
        keyFlows,
        [
          'Registrar operaciones y estados por area.',
          'Relacionar documentos y trazabilidad operativa.',
          'Consolidar reportes y auditoria por proceso.',
        ],
      )
      pushUniquePlannerValues(safeFirstDelivery, [
        'Modulo operativo acotado con trazabilidad basica.',
        'Maestros y permisos iniciales.',
        'Reportes internos sin integraciones criticas.',
      ])
      break
    case 'marketplace':
      pushUniquePlannerValues(
        users,
        ['comprador', 'vendedor', 'operador de marketplace', 'administrador'],
      )
      pushUniquePlannerValues(roles, ['buyer', 'seller', 'operator', 'admin'])
      pushUniquePlannerValues(
        coreModules,
        ['catalogo', 'publicaciones', 'carrito o solicitud', 'ordenes', 'moderacion'],
      )
      pushUniquePlannerValues(
        dataEntities,
        ['usuario', 'publicacion', 'orden', 'pago', 'comision'],
      )
      pushUniquePlannerValues(
        keyFlows,
        [
          'Publicar y moderar oferta o inventario.',
          'Descubrir, comparar y convertir una compra o solicitud.',
          'Gestionar ordenes, comisiones y estados.',
        ],
      )
      pushUniquePlannerValues(safeFirstDelivery, [
        'Onboarding basico de vendedores y compradores.',
        'Catalogo o listado con publicaciones de muestra.',
        'Flujo acotado de solicitud o compra sin dinero real.',
      ])
      break
    case 'saas':
      pushUniquePlannerValues(users, ['administrador de cuenta', 'miembro del equipo', 'owner'])
      pushUniquePlannerValues(roles, ['owner', 'admin', 'member'])
      pushUniquePlannerValues(
        coreModules,
        ['auth', 'workspace', 'panel operativo', 'configuracion', 'reportes'],
      )
      pushUniquePlannerValues(
        dataEntities,
        ['workspace', 'usuario', 'rol', 'configuracion', 'evento'],
      )
      pushUniquePlannerValues(
        keyFlows,
        [
          'Crear workspace y alta de usuarios.',
          'Operar funcionalidades nucleares por rol.',
          'Revisar actividad y metricas basicas.',
        ],
      )
      pushUniquePlannerValues(safeFirstDelivery, [
        'Workspace unico con usuarios y roles basicos.',
        'Modulo principal funcional sin billing ni integraciones reales.',
        'Panel operativo inicial con datos de ejemplo.',
      ])
      break
    case 'internal-tool':
      pushUniquePlannerValues(users, ['equipo interno', 'responsable operativo', 'administrador'])
      pushUniquePlannerValues(roles, ['operador', 'supervisor', 'admin'])
      pushUniquePlannerValues(
        coreModules,
        ['panel operativo', 'gestion de casos', 'reportes', 'configuracion'],
      )
      pushUniquePlannerValues(
        dataEntities,
        ['caso', 'estado', 'usuario', 'reporte'],
      )
      pushUniquePlannerValues(
        keyFlows,
        [
          'Registrar y actualizar trabajo interno.',
          'Asignar responsables y estados.',
          'Visualizar reportes y pendientes.',
        ],
      )
      pushUniquePlannerValues(safeFirstDelivery, [
        'Panel operativo con datos y estados basicos.',
        'Permisos simples por rol.',
        'Reportes iniciales sin integraciones externas.',
      ])
      break
    default:
      pushUniquePlannerValues(users, ['administrador', 'operador principal', 'usuario final'])
      pushUniquePlannerValues(roles, ['admin', 'operador', 'viewer'])
      pushUniquePlannerValues(
        coreModules,
        ['usuarios y roles', 'operacion principal', 'reportes', 'configuracion'],
      )
      pushUniquePlannerValues(
        dataEntities,
        ['usuario', 'rol', 'entidad principal', 'evento'],
      )
      pushUniquePlannerValues(
        keyFlows,
        [
          'Alta y gestion de entidades principales.',
          'Operacion del flujo critico principal.',
          'Seguimiento operativo y reportes.',
        ],
      )
      pushUniquePlannerValues(safeFirstDelivery, [
        'MVP acotado del flujo principal con permisos basicos.',
        'Datos de ejemplo y reportes iniciales.',
      ])
      break
  }

  if (/\bescuelas?\b/u.test(normalizedText)) {
    pushUniquePlannerValues(users, ['administrador escolar', 'docente', 'preceptor o directivo', 'familia o alumno'])
    pushUniquePlannerValues(roles, ['admin', 'docente', 'preceptor', 'familia'])
    pushUniquePlannerValues(
      coreModules,
      ['alumnos', 'familias', 'cursos', 'comunicaciones', 'seguimiento', 'reportes'],
    )
    pushUniquePlannerValues(
      dataEntities,
      ['alumno', 'familia', 'curso', 'comunicacion', 'seguimiento'],
    )
    pushUniquePlannerValues(
      criticalRisks,
      ['Hay datos sensibles de menores o informacion educativa que requieren permisos y resguardo reforzados.'],
      14,
    )
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Definir tratamiento de datos sensibles, permisos finos y auditoria.'],
      12,
    )
  }

  if (/\bclinicas?\b|\bsalud\b|\bturnos\b/u.test(normalizedText)) {
    pushUniquePlannerValues(users, ['recepcion', 'profesional', 'administrador', 'paciente'])
    pushUniquePlannerValues(roles, ['admin', 'profesional', 'recepcion', 'paciente'])
    pushUniquePlannerValues(
      criticalRisks,
      ['Hay datos personales o de salud que requieren seguridad y permisos estrictos.'],
      14,
    )
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Definir alcance de datos sensibles, autenticacion real y politicas de acceso.'],
      12,
    )
  }

  if (/\bdespachantes?\b|\baduana\b/u.test(normalizedText)) {
    pushUniquePlannerValues(
      criticalRisks,
      ['Los procesos aduaneros suelen exigir trazabilidad documental, auditoria y validacion humana de reglas.'],
      14,
    )
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Definir reglas operativas criticas, auditoria y fuentes oficiales antes de automatizar.'],
      12,
    )
  }

  if (/\busuarios\b/u.test(normalizedText)) {
    pushUniquePlannerValues(users, ['usuarios autenticados'])
  }

  if (/\broles\b|\bpermisos\b/u.test(normalizedText)) {
    pushUniquePlannerValues(roles, ['admin', 'operador', 'viewer'])
    pushUniquePlannerValues(coreModules, ['roles y permisos'])
  }

  if (/\bbackoffice\b|\bpanel administrativo\b/u.test(normalizedText)) {
    pushUniquePlannerValues(coreModules, ['backoffice'])
  }

  if (/\bdashboard(?: operativo)?\b/u.test(normalizedText)) {
    pushUniquePlannerValues(coreModules, ['dashboard operativo'])
  }

  if (/\breportes\b/u.test(normalizedText)) {
    pushUniquePlannerValues(coreModules, ['reportes'])
  }

  if (/\bmercado pago\b/u.test(normalizedText)) {
    pushUniquePlannerValues(integrations, ['Mercado Pago'])
    pushUniquePlannerValues(
      criticalRisks,
      ['Mercado Pago requiere credenciales, webhooks y validacion humana antes de pasar a integracion real.'],
      14,
    )
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Credenciales reales, webhooks y paso a pagos reales.'],
      12,
    )
  } else if (/\bpagos\b|\bcheckout\b/u.test(normalizedText)) {
    pushUniquePlannerValues(integrations, ['pasarela de pagos'])
    pushUniquePlannerValues(
      criticalRisks,
      ['Los pagos reales requieren credenciales, conciliacion y webhooks con aprobacion humana.'],
      14,
    )
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Seleccion de pasarela, credenciales y webhooks de pagos.'],
      12,
    )
  }

  if (/\bautenticacion\b|\blogin\b|\busuarios\b/u.test(normalizedText)) {
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Autenticacion real, gestion de sesiones y politicas de acceso.'],
      12,
    )
  }

  if (/\bbase de datos\b|\bdatos\b|\breportes\b/u.test(normalizedText)) {
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Base de datos real, migraciones y politicas de respaldo.'],
      12,
    )
  }

  if (/\bwebhooks?\b|\bintegraciones?\b/u.test(normalizedText)) {
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Integraciones externas, webhooks y manejo de secretos.'],
      12,
    )
  }

  if (!approvalRequiredFor.length) {
    pushUniquePlannerValues(
      approvalRequiredFor,
      ['Cualquier credencial real, despliegue productivo o integracion critica.'],
      12,
    )
  }

  pushUniquePlannerValues(phases, [
    'Fase 1: descubrir alcance, dominio, actores y flujo critico principal.',
    'Fase 2: definir MVP seguro con modulos y datos minimos.',
    'Fase 3: implementar prototipo funcional local con auth y persistencia acotadas.',
    'Fase 4: integrar capacidades criticas aprobadas y endurecer seguridad, auditoria y despliegue.',
  ])

  if (!safeFirstDelivery.length) {
    pushUniquePlannerValues(safeFirstDelivery, [
      'MVP local del flujo principal con datos de ejemplo y permisos basicos.',
    ])
  }

  const suggestedArchitecture = {
    frontend:
      productType === 'ecommerce' || productType === 'marketplace'
        ? 'Frontend web con experiencia de catalogo/backoffice separada por roles.'
        : 'Frontend web modular con vistas por rol y foco en el flujo principal.',
    backend:
      'Backend con API por modulos de dominio, validaciones de permisos y servicios desacoplados para integraciones futuras.',
    database:
      'Base relacional para entidades transaccionales, relaciones fuertes y trazabilidad operativa.',
    auth:
      /\bautenticacion\b|\busuarios\b|\broles\b/u.test(normalizedText)
        ? 'Autenticacion con roles y permisos por modulo; sesiones seguras o proveedor dedicado cuando se apruebe.'
        : 'Definir autenticacion simple al principio y endurecerla antes de abrir acceso real.',
    payments:
      /\bpagos\b|\bcheckout\b|\bmercado pago\b/u.test(normalizedText)
        ? 'Mantener pagos desacoplados y simulados en primeras fases; integrar pasarela real solo con aprobacion humana.'
        : 'No aplicar por ahora salvo que el flujo comercial lo exija.',
    storage:
      'Storage para adjuntos o assets solo si el dominio lo necesita, con politicas claras de acceso y retencion.',
  }
  const contextHubAvailable = contextHubPack?.available === true
  const productLabel = productType === 'unknown' ? 'sistema complejo' : productType
  const domainLabel = domain || 'dominio a precisar'

  return {
    tasks: [
      {
        step: 1,
        title: `Clasificar el tipo de producto (${productLabel}) y delimitar el dominio funcional inicial (${domainLabel}).`,
      },
      {
        step: 2,
        title: 'Identificar usuarios, roles y permisos esperados antes de pensar integraciones o despliegue.',
      },
      {
        step: 3,
        title: 'Proponer modulos principales y flujos criticos que den una primera entrega segura y no ficticia.',
      },
      {
        step: 4,
        title: 'Listar entidades de datos, dependencias tecnicas e integraciones externas potenciales.',
      },
      {
        step: 5,
        title: contextHubAvailable
          ? 'Cruzar la arquitectura propuesta con MEMORIA externa disponible solo como contexto auxiliar.'
          : 'Mantener la arquitectura autocontenida y usar MEMORIA externa solo si aparece disponible luego.',
      },
      {
        step: 6,
        title: 'Detectar riesgos, aprobaciones humanas futuras y limites de esta iteracion antes de cualquier materializacion.',
      },
      {
        step: 7,
        title: 'Definir fases de implementacion y una primera entrega segura sin crear archivos ni ejecutar cambios todavia.',
      },
    ],
    assumptions: [
      'Esta iteracion es solo de arquitectura de producto; no corresponde crear archivos ni materializar cambios.',
      'El objetivo describe un sistema suficientemente amplio como para requerir fases y una primera entrega segura.',
      'Pagos reales, autenticacion real, base de datos real, migraciones, deploy, webhooks, credenciales y datos sensibles requieren aprobacion humana especifica.',
      'MEMORIA externa puede enriquecer el contexto, pero el plan debe ser util incluso si no esta disponible.',
    ],
    instruction:
      'Analizar el producto solicitado y generar una arquitectura inicial dinamica, identificando dominio, usuarios, modulos, entidades de datos, integraciones, riesgos, aprobaciones necesarias, fases de implementacion y primera entrega segura, sin crear archivos ni ejecutar cambios todavia.',
    productArchitecture: {
      productType,
      domain: domainLabel,
      users,
      roles,
      coreModules,
      dataEntities,
      keyFlows,
      integrations,
      criticalRisks,
      approvalRequiredFor,
      suggestedArchitecture,
      phases,
      safeFirstDelivery,
      outOfScopeForFirstIteration,
    },
  }
}

const ORCHESTRATOR_PLANNER_FEEDBACK_PREFIX = '__orchestrator_feedback__:'

function parseOrchestratorPlannerFeedback(previousExecutionResult) {
  if (
    typeof previousExecutionResult !== 'string' ||
    !previousExecutionResult.trim() ||
    !previousExecutionResult.startsWith(ORCHESTRATOR_PLANNER_FEEDBACK_PREFIX)
  ) {
    return null
  }

  try {
    const parsedFeedback = JSON.parse(
      previousExecutionResult.slice(ORCHESTRATOR_PLANNER_FEEDBACK_PREFIX.length),
    )

    return parsedFeedback && typeof parsedFeedback === 'object'
      ? parsedFeedback
      : null
  } catch {
    return null
  }
}

function detectBrainAtomicOperationDescriptor(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return null
  }

  const normalizedText = text.toLocaleLowerCase()
  const fileTargetPath = extractFileTargetPath(text)
  const folderTargetPath = extractFolderTargetPath(text)

  if (
    fileTargetPath &&
    (/reemplaz(?:a|á|ar)/i.test(text) ||
      normalizedText.includes('editar el archivo') ||
      normalizedText.includes('actualizar el archivo'))
  ) {
    return {
      operation: 'replace-file',
      targetPath: fileTargetPath,
    }
  }

  if (
    folderTargetPath &&
    (normalizedText.includes('crear carpeta') ||
      normalizedText.includes('crea carpeta') ||
      normalizedText.includes('crear la carpeta') ||
      normalizedText.includes('crea la carpeta') ||
      normalizedText.includes('crear una carpeta') ||
      normalizedText.includes('crea una carpeta') ||
      normalizedText.includes('crear directorio') ||
      normalizedText.includes('crea directorio') ||
      normalizedText.includes('borrar carpeta') ||
      normalizedText.includes('eliminar carpeta') ||
      normalizedText.includes('listar carpeta') ||
      normalizedText.includes('mostrar contenido de la carpeta') ||
      normalizedText.includes('existe la carpeta'))
  ) {
    return {
      operation:
        normalizedText.includes('borrar') || normalizedText.includes('eliminar')
          ? 'delete-folder'
          : normalizedText.includes('listar') || normalizedText.includes('mostrar')
            ? 'list-folder'
            : normalizedText.includes('existe')
              ? 'exists-check'
              : 'create-folder',
      targetPath: folderTargetPath,
    }
  }

  if (
    fileTargetPath &&
    (normalizedText.includes('crear archivo') ||
      normalizedText.includes('crea archivo') ||
      normalizedText.includes('crear el archivo') ||
      normalizedText.includes('crea el archivo') ||
      normalizedText.includes('crear un archivo') ||
      normalizedText.includes('crea un archivo') ||
      normalizedText.includes('generar archivo') ||
      normalizedText.includes('hacer archivo') ||
      normalizedText.includes('leer archivo') ||
      normalizedText.includes('leer el archivo') ||
      normalizedText.includes('revisar archivo') ||
      normalizedText.includes('mostrar archivo') ||
      normalizedText.includes('ver archivo') ||
      normalizedText.includes('borrar archivo') ||
      normalizedText.includes('eliminar archivo') ||
      normalizedText.includes('agregar al final del archivo') ||
      normalizedText.includes('append al archivo') ||
      normalizedText.includes('existe el archivo'))
  ) {
    let operation = 'create-file'

    if (
      normalizedText.includes('leer') ||
      normalizedText.includes('revisar') ||
      normalizedText.includes('mostrar') ||
      normalizedText.includes('ver')
    ) {
      operation = 'read-file'
    } else if (normalizedText.includes('borrar') || normalizedText.includes('eliminar')) {
      operation = 'delete-file'
    } else if (
      normalizedText.includes('agregar al final del archivo') ||
      normalizedText.includes('append al archivo')
    ) {
      operation = 'append-file'
    } else if (normalizedText.includes('existe el archivo')) {
      operation = 'exists-check'
    }

    return {
      operation,
      targetPath: fileTargetPath,
    }
  }

  return null
}

function normalizePlannerRelativeTargetPath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value.trim().replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/^\/+/, '')
}

function detectScopedExistingFileEditIntent({
  goal,
  context,
  workspacePath,
}) {
  const extractRelaxedFolderHint = (text) => {
    if (typeof text !== 'string' || !text.trim()) {
      return ''
    }

    const match = text.match(
      /(?:carpeta|directorio|folder)\s+([^\s,.;:]+(?:[\\/][^\s,.;:]+)*)/i,
    )
    const candidate = normalizePlannerRelativeTargetPath(match?.[1] || '')
    const normalizedCandidate = candidate.toLocaleLowerCase()

    return [
      '',
      'nueva',
      'nuevo',
      'principal',
      'base',
      'local',
      'llamada',
      'con',
      'nombre',
      'de',
    ].includes(normalizedCandidate)
      ? ''
      : candidate
  }
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedCombinedText = combinedText.toLocaleLowerCase()

  if (!normalizedCombinedText) {
    return null
  }

  const explicitFileHint =
    extractFileTargetPath(goal) ||
    extractFileTargetPath(context) ||
    extractQuotedTargetPathHint(goal) ||
    extractQuotedTargetPathHint(context) ||
    ''
  const explicitFolderHint =
    extractFolderTargetPath(goal) ||
    extractFolderTargetPath(context) ||
    extractRelaxedFolderHint(goal) ||
    extractRelaxedFolderHint(context) ||
    ''
  const normalizedFileHint = normalizePlannerRelativeTargetPath(explicitFileHint)
  const normalizedFolderHint = normalizePlannerRelativeTargetPath(explicitFolderHint)
  const inferredFileName =
    path.extname(normalizedFileHint)
      ? path.posix.basename(normalizedFileHint)
      : normalizedCombinedText.includes('index.html')
        ? 'index.html'
        : normalizedCombinedText.includes('styles.css')
          ? 'styles.css'
          : normalizedCombinedText.includes('script.js')
            ? 'script.js'
            : ''
  const fileHintLooksLikeBareFileName =
    Boolean(normalizedFileHint) &&
    path.extname(normalizedFileHint) &&
    !normalizedFileHint.includes('/')
  const relativeTargetPath =
    fileHintLooksLikeBareFileName && normalizedFolderHint
      ? path.posix.join(normalizedFolderHint, path.posix.basename(normalizedFileHint))
      : path.extname(normalizedFileHint)
        ? normalizedFileHint
        : normalizedFolderHint && inferredFileName
          ? path.posix.join(normalizedFolderHint, inferredFileName)
          : inferredFileName
  const resolvedTarget = relativeTargetPath
    ? resolveWorkspaceTarget(workspacePath, relativeTargetPath)
    : null
  const targetExists = Boolean(
    resolvedTarget?.resolvedTargetPath && fs.existsSync(resolvedTarget.resolvedTargetPath),
  )
  const mentionsEditVerb =
    normalizedCombinedText.includes('modificar') ||
    normalizedCombinedText.includes('editar') ||
    normalizedCombinedText.includes('actualizar') ||
    normalizedCombinedText.includes('cambiar') ||
    normalizedCombinedText.includes('mejorar') ||
    normalizedCombinedText.includes('ajustar') ||
    normalizedCombinedText.includes('reescribir')
  const mentionsSingleFileConstraint =
    normalizedCombinedText.includes('modificar únicamente el archivo') ||
    normalizedCombinedText.includes('modificar unicamente el archivo') ||
    normalizedCombinedText.includes('modificar solamente el archivo') ||
    normalizedCombinedText.includes('modificar solo el archivo') ||
    normalizedCombinedText.includes('solo index.html') ||
    normalizedCombinedText.includes('solamente index.html') ||
    normalizedCombinedText.includes('únicamente index.html') ||
    normalizedCombinedText.includes('unicamente index.html') ||
    normalizedCombinedText.includes('únicamente el archivo') ||
    normalizedCombinedText.includes('unicamente el archivo')
  const forbidsNewFolders =
    normalizedCombinedText.includes('no crear carpetas nuevas') ||
    normalizedCombinedText.includes('no crear carpeta nueva') ||
    normalizedCombinedText.includes('no crear carpetas') ||
    normalizedCombinedText.includes('no crear carpeta')
  const forbidsTouchCss =
    normalizedCombinedText.includes('no tocar styles.css') ||
    normalizedCombinedText.includes('no debe tocar styles.css') ||
    normalizedCombinedText.includes('no tocar css') ||
    normalizedCombinedText.includes('no debe tocar css') ||
    ((normalizedCombinedText.includes('no tocar') ||
      normalizedCombinedText.includes('no debe tocar')) &&
      (normalizedCombinedText.includes('styles.css') ||
        normalizedCombinedText.includes(' css')))
  const forbidsTouchJs =
    normalizedCombinedText.includes('no tocar script.js') ||
    normalizedCombinedText.includes('no debe tocar script.js') ||
    normalizedCombinedText.includes('no tocar javascript') ||
    normalizedCombinedText.includes('no debe tocar javascript') ||
    normalizedCombinedText.includes('no tocar js') ||
    normalizedCombinedText.includes('no debe tocar js') ||
    ((normalizedCombinedText.includes('no tocar') ||
      normalizedCombinedText.includes('no debe tocar')) &&
      (normalizedCombinedText.includes('script.js') ||
        normalizedCombinedText.includes('javascript') ||
        normalizedCombinedText.includes(' js')))
  const keepsStructure =
    normalizedCombinedText.includes('mantener la estructura') ||
    normalizedCombinedText.includes('mantener estructura') ||
    normalizedCombinedText.includes('conservar la estructura') ||
    normalizedCombinedText.includes('conservar estructura') ||
    normalizedCombinedText.includes('no cambiar estructura')
  const keepsClasses =
    normalizedCombinedText.includes('no cambiar clases') ||
    normalizedCombinedText.includes('no debe cambiar clases') ||
    normalizedCombinedText.includes('mantener las clases')
  const keepsSections =
    normalizedCombinedText.includes('no cambiar secciones') ||
    normalizedCombinedText.includes('no debe cambiar secciones') ||
    normalizedCombinedText.includes('mantener secciones')
  const keepsButtons =
    normalizedCombinedText.includes('conservar los botones actuales') ||
    normalizedCombinedText.includes('mantener los botones actuales') ||
    normalizedCombinedText.includes('conservar botones actuales')
  const targetsHeroCopyOnly =
    normalizedCombinedText.includes('hero') &&
    (normalizedCombinedText.includes('titulo principal') ||
      normalizedCombinedText.includes('título principal')) &&
    (normalizedCombinedText.includes('parrafo descriptivo') ||
      normalizedCombinedText.includes('párrafo descriptivo') ||
      normalizedCombinedText.includes('parrafo del hero') ||
      normalizedCombinedText.includes('párrafo del hero'))
  const explicitScopedEdit =
    mentionsEditVerb &&
    relativeTargetPath &&
    (mentionsSingleFileConstraint ||
      forbidsNewFolders ||
      forbidsTouchCss ||
      forbidsTouchJs ||
      keepsStructure ||
      keepsClasses ||
      keepsSections ||
      keepsButtons ||
      targetsHeroCopyOnly)

  if (!explicitScopedEdit || !resolvedTarget) {
    return null
  }

  const targetDirectory = path.posix.dirname(relativeTargetPath)
  const blockedTargetPaths = [
    forbidsTouchCss
      ? targetDirectory && targetDirectory !== '.'
        ? path.posix.join(targetDirectory, 'styles.css')
        : 'styles.css'
      : '',
    forbidsTouchJs
      ? targetDirectory && targetDirectory !== '.'
        ? path.posix.join(targetDirectory, 'script.js')
        : 'script.js'
      : '',
  ].filter(Boolean)
  const successCriteria = [
    `Modificar solo "${relativeTargetPath}" y guardar el cambio en ese archivo.`,
    targetsHeroCopyOnly
      ? 'Cambiar solo el titulo principal y el parrafo descriptivo del hero.'
      : 'Limitar la edicion al contenido puntual pedido por el usuario.',
    keepsStructure || keepsClasses || keepsSections || keepsButtons
      ? 'Mantener estructura, clases, secciones y botones actuales sin cambios laterales.'
      : '',
    forbidsTouchCss || forbidsTouchJs
      ? 'No tocar CSS ni JavaScript durante esta iteracion.'
      : '',
  ].filter(Boolean)
  const executionScope = normalizeExecutorExecutionScope({
    objectiveScope: 'single-target',
    allowedTargetPaths: [relativeTargetPath],
    blockedTargetPaths,
    successCriteria,
    continuationAnchor: {
      targetPath: relativeTargetPath,
      action: 'edit-existing-file',
    },
    enforceNarrowScope: true,
  })
  const instructionLines = [
    `Modificar únicamente "${relativeTargetPath}" dentro del workspace.`,
    targetsHeroCopyOnly
      ? 'Actualizar solo el titulo principal y el parrafo descriptivo del hero para mejorar claridad, tono premium y conversion inmobiliaria.'
      : 'Aplicar solo la edicion puntual pedida sobre el archivo existente.',
    keepsStructure ? 'Mantener la estructura actual del HTML.' : '',
    keepsClasses ? 'No cambiar clases del HTML.' : '',
    keepsSections ? 'No cambiar secciones.' : '',
    keepsButtons ? 'Conservar los botones actuales.' : '',
    forbidsNewFolders ? 'No crear carpetas nuevas ni scaffold adicional.' : '',
    forbidsTouchCss ? 'No tocar styles.css ni otros estilos.' : '',
    forbidsTouchJs ? 'No tocar script.js ni JavaScript.' : '',
    `objectiveScope: single-target`,
    `allowedTargetPaths: ${relativeTargetPath}`,
    blockedTargetPaths.length > 0
      ? `blockedTargetPaths: ${blockedTargetPaths.join(', ')}`
      : '',
    `successCriteria: ${successCriteria.join(' | ')}`,
  ].filter(Boolean)

  return {
    relativeTargetPath,
    resolvedTargetPath: resolvedTarget.resolvedTargetPath,
    executionScope,
    instruction: instructionLines.join('\n'),
    successCriteria,
    tasks: [
      {
        step: 1,
        title: `Revisar solo "${relativeTargetPath}" y ubicar el bloque actual del hero.`,
        operation: 'edit-file',
        targetPath: relativeTargetPath,
      },
      {
        step: 2,
        title: targetsHeroCopyOnly
          ? 'Actualizar exclusivamente el titulo principal y el parrafo descriptivo del hero.'
          : 'Aplicar solo la edicion textual solicitada dentro del archivo objetivo.',
        operation: 'edit-file',
        targetPath: relativeTargetPath,
      },
      {
        step: 3,
        title:
          'Validar que no se hayan tocado clases, secciones, CSS ni JavaScript fuera del alcance pedido.',
        operation: 'validate-scope',
        targetPath: relativeTargetPath,
      },
    ],
    assumptions: [
      'Las restricciones explicitas del usuario mandan sobre cualquier heuristica de scaffold web.',
      `El cambio debe quedar limitado a "${relativeTargetPath}".`,
      targetExists
        ? 'El target ya existe dentro del workspace y debe tratarse como una edicion acotada.'
        : 'El target fue indicado de forma explicita y debe tratarse como una edicion acotada, no como scaffold nuevo.',
      forbidsNewFolders
        ? 'No corresponde crear carpetas nuevas ni una base web paralela.'
        : 'No corresponde ampliar el alcance fuera del archivo objetivo.',
      forbidsTouchCss || forbidsTouchJs
        ? 'CSS y JavaScript quedan fuera de alcance en esta iteracion.'
        : 'El alcance se mantiene en HTML salvo que el usuario lo amplie.',
    ],
  }
}

function buildBrainApprovalRequest({
  decisionKey,
  reason,
  question,
  options,
  allowFreeAnswer = true,
  allowBrainDefault = false,
  impact = 'medium',
  nextExpectedAction = 'user-response',
}) {
  return {
    decisionKey: decisionKey || 'approval-required',
    reason: typeof reason === 'string' ? reason : '',
    question: typeof question === 'string' ? question : '',
    options: Array.isArray(options) ? options : [],
    allowFreeAnswer: allowFreeAnswer !== false,
    allowBrainDefault: allowBrainDefault === true,
    impact,
    nextExpectedAction,
  }
}

function buildBrainDecisionContract({
  decisionKey,
  strategy,
  executionMode,
  reason,
  question,
  tasks,
  requiresApproval,
  approvalRequest,
  assumptions,
  instruction,
  completed,
  nextExpectedAction,
  businessSector,
  businessSectorLabel,
  creativeDirection,
  executionScope,
  reusableArtifactLookup,
  reusableArtifactsFound,
  reuseDecision,
  reuseReason,
  reusedArtifactIds,
  reuseMode,
  productArchitecture,
  safeFirstDeliveryPlan,
  safeFirstDeliveryMaterialization,
  finalResult,
}) {
  const resolvedRequiresApproval = requiresApproval === true
  const resolvedApprovalRequest =
    resolvedRequiresApproval && approvalRequest && typeof approvalRequest === 'object'
      ? approvalRequest
      : null
  const resolvedReason =
    resolvedApprovalRequest?.reason ||
    (typeof reason === 'string' ? reason : '')
  const resolvedQuestion =
    resolvedApprovalRequest?.question ||
    (typeof question === 'string' ? question : '')

  return {
    decisionKey: decisionKey || strategy || 'brain-decision',
    strategy,
    executionMode,
    ...(businessSector ? { businessSector } : {}),
    ...(businessSectorLabel ? { businessSectorLabel } : {}),
    ...(creativeDirection && typeof creativeDirection === 'object'
      ? { creativeDirection }
      : {}),
    ...(normalizeExecutorExecutionScope(executionScope)
      ? { executionScope: normalizeExecutorExecutionScope(executionScope) }
      : {}),
    ...(reusableArtifactLookup && typeof reusableArtifactLookup === 'object'
      ? { reusableArtifactLookup }
      : {}),
    reusableArtifactsFound:
      Number.isInteger(reusableArtifactsFound) && reusableArtifactsFound >= 0
        ? reusableArtifactsFound
        : Array.isArray(reusableArtifactLookup?.matches)
          ? reusableArtifactLookup.matches.length
          : 0,
    reuseDecision: reuseDecision === true,
    reuseReason: typeof reuseReason === 'string' ? reuseReason : '',
    reusedArtifactIds: Array.isArray(reusedArtifactIds)
      ? [...new Set(reusedArtifactIds.filter((value) => typeof value === 'string' && value.trim()))]
      : [],
    reuseMode:
      typeof reuseMode === 'string' && reuseMode.trim() ? reuseMode.trim() : 'none',
    reason: resolvedReason,
    question: resolvedQuestion,
    ...(resolvedApprovalRequest ? { approvalRequest: resolvedApprovalRequest } : {}),
    tasks: Array.isArray(tasks) ? tasks : [],
    requiresApproval: resolvedRequiresApproval,
    assumptions: Array.isArray(assumptions) ? assumptions : [],
    instruction,
    completed: completed === true,
    nextExpectedAction:
      nextExpectedAction ||
      resolvedApprovalRequest?.nextExpectedAction ||
      (completed === true ? 'final-result' : 'execute-plan'),
    ...(productArchitecture && typeof productArchitecture === 'object'
      ? { productArchitecture }
      : {}),
    ...(safeFirstDeliveryPlan && typeof safeFirstDeliveryPlan === 'object'
      ? { safeFirstDeliveryPlan }
      : {}),
    ...(safeFirstDeliveryMaterialization &&
    typeof safeFirstDeliveryMaterialization === 'object'
      ? { safeFirstDeliveryMaterialization }
      : {}),
    ...(finalResult && typeof finalResult === 'object'
      ? { finalResult }
      : {}),
  }
}

function buildReusablePlanningTags({ sectorConfig, creativeDirection }) {
  return [
    sectorConfig?.key,
    sectorConfig?.label,
    creativeDirection?.profileKey,
    creativeDirection?.visualStyle,
    creativeDirection?.layoutVariant,
    creativeDirection?.heroStyle,
    creativeDirection?.originalityLevel,
    creativeDirection?.layoutRhythm,
    creativeDirection?.contentDensity,
    ...(Array.isArray(creativeDirection?.prioritySections)
      ? creativeDirection.prioritySections
      : []),
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim())
}

function detectReusableArtifactConstraints(goal, context) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  return {
    avoidStructure:
      combinedText.includes('otra estructura') ||
      combinedText.includes('distinta estructura') ||
      combinedText.includes('estructura distinta') ||
      combinedText.includes('cambiar estructura'),
    avoidStyle:
      combinedText.includes('otro estilo') ||
      combinedText.includes('estilo distinto') ||
      combinedText.includes('otra estetica') ||
      combinedText.includes('más oscura') ||
      combinedText.includes('mas oscura') ||
      combinedText.includes('más oscuro') ||
      combinedText.includes('mas oscuro') ||
      combinedText.includes('más clara') ||
      combinedText.includes('mas clara') ||
      combinedText.includes('más claro') ||
      combinedText.includes('mas claro'),
  }
}

function decideReusableArtifactPlan({
  goal,
  context,
  sectorConfig,
  creativeDirection,
  artifactLookup,
}) {
  const matches = Array.isArray(artifactLookup?.matches) ? artifactLookup.matches : []
  const topMatch = matches[0] || null

  if (!topMatch) {
    return {
      reuseMode: 'none',
      reuseDecision: false,
      reusedArtifactIds: [],
      reuseReason:
        'No hay artefactos reutilizables suficientemente parecidos para este objetivo.',
    }
  }

  const constraints = detectReusableArtifactConstraints(goal, context)
  const sameSector = topMatch.matchReasons?.includes('same-sector') === true
  const sameStyle = topMatch.matchReasons?.includes('same-style') === true
  const sameLayout = topMatch.matchReasons?.includes('same-layout') === true
  const strongSimilarity = typeof topMatch.similarityScore === 'number' && topMatch.similarityScore >= 10

  if (constraints.avoidStyle && constraints.avoidStructure) {
    return {
      reuseMode: 'none',
      reuseDecision: false,
      reusedArtifactIds: [],
      reuseReason:
        'Hay memoria reusable disponible, pero el pedido actual contradice tanto estilo como estructura previos y conviene partir de una decision nueva.',
    }
  }

  if (sameSector && sameStyle && sameLayout && !constraints.avoidStyle && !constraints.avoidStructure) {
    return {
      reuseMode: 'reuse-style-and-structure',
      reuseDecision: true,
      reusedArtifactIds: [topMatch.id],
      reuseReason:
        'Existe un artefacto muy cercano del mismo rubro, estilo y estructura; conviene reutilizar esa base como punto de partida.',
    }
  }

  if ((sameStyle || strongSimilarity) && !constraints.avoidStyle && constraints.avoidStructure) {
    return {
      reuseMode: 'reuse-style',
      reuseDecision: true,
      reusedArtifactIds: [topMatch.id],
      reuseReason:
        'Hay un artefacto cercano cuyo lenguaje visual sirve, pero el pedido actual pide una estructura distinta.',
    }
  }

  if ((sameLayout || strongSimilarity) && !constraints.avoidStructure && constraints.avoidStyle) {
    return {
      reuseMode: 'reuse-structure',
      reuseDecision: true,
      reusedArtifactIds: [topMatch.id],
      reuseReason:
        'Hay una estructura reusable valiosa, pero el pedido actual pide apartarse del estilo visual previo.',
    }
  }

  if (sameStyle && !constraints.avoidStyle) {
    return {
      reuseMode: 'reuse-style',
      reuseDecision: true,
      reusedArtifactIds: [topMatch.id],
      reuseReason:
        sameSector
          ? 'Existe un antecedente del mismo rubro con un estilo visual útil para acelerar la dirección creativa.'
          : 'No hay match exacto de rubro, pero sí una referencia visual reusable que puede aportar sin copiar la estructura.',
    }
  }

  if (sameLayout && !constraints.avoidStructure) {
    return {
      reuseMode: 'reuse-structure',
      reuseDecision: true,
      reusedArtifactIds: [topMatch.id],
      reuseReason:
        sameSector
          ? 'Existe una estructura previa del mismo rubro que puede reutilizarse parcialmente.'
          : 'No hay match exacto de rubro, pero sí una estructura reusable que puede servir como base.',
    }
  }

  return {
    reuseMode: 'inspiration-only',
    reuseDecision: true,
    reusedArtifactIds: matches.slice(0, 2).map((match) => match.id),
    reuseReason:
      'La memoria local no aporta una base para reutilizar tal cual, pero sí referencias cercanas para inspirar estilo o estructura.',
  }
}

function applyReusableArtifactToCreativeDirection({
  baseCreativeDirection,
  artifactLookup,
  reuseMode,
  sectorConfig,
}) {
  const topMatch = Array.isArray(artifactLookup?.matches) ? artifactLookup.matches[0] : null

  if (!topMatch || reuseMode === 'none' || reuseMode === 'inspiration-only') {
    return baseCreativeDirection
  }

  const shouldReuseStyle =
    reuseMode === 'reuse-style' || reuseMode === 'reuse-style-and-structure'
  const shouldReuseStructure =
    reuseMode === 'reuse-structure' || reuseMode === 'reuse-style-and-structure'
  const sameSector =
    typeof topMatch.sector === 'string' &&
    typeof sectorConfig?.key === 'string' &&
    topMatch.sector.trim() &&
    topMatch.sector.trim() === sectorConfig.key.trim()

  return {
    ...baseCreativeDirection,
    ...(shouldReuseStyle
      ? {
          visualStyle: topMatch.visualStyle || baseCreativeDirection.visualStyle,
          profileKey:
            topMatch.metadata?.profileKey || baseCreativeDirection.profileKey,
          typography:
            topMatch.typography && typeof topMatch.typography === 'object'
              ? {
                  ...(baseCreativeDirection.typography || {}),
                  ...topMatch.typography,
                }
              : baseCreativeDirection.typography,
          paletteSuggestion:
            topMatch.colors && typeof topMatch.colors === 'object'
              ? {
                  ...(baseCreativeDirection.paletteSuggestion || {}),
                  ...topMatch.colors,
                }
              : baseCreativeDirection.paletteSuggestion,
        }
      : {}),
    ...(shouldReuseStructure
      ? {
          layoutVariant: topMatch.layoutVariant || baseCreativeDirection.layoutVariant,
          heroStyle: topMatch.heroStyle || baseCreativeDirection.heroStyle,
          layoutRhythm:
            topMatch.metadata?.layoutRhythm || baseCreativeDirection.layoutRhythm,
          contentDensity:
            topMatch.metadata?.contentDensity ||
            baseCreativeDirection.contentDensity,
          sectionOrder:
            Array.isArray(topMatch.metadata?.sectionOrder) &&
            topMatch.metadata.sectionOrder.length > 0
              ? topMatch.metadata.sectionOrder
              : baseCreativeDirection.sectionOrder,
          prioritySections:
            sameSector &&
            Array.isArray(topMatch.metadata?.prioritySections) &&
            topMatch.metadata.prioritySections.length > 0
              ? topMatch.metadata.prioritySections
              : baseCreativeDirection.prioritySections,
        }
      : {}),
    ...((shouldReuseStructure || reuseMode === 'reuse-style-and-structure') &&
    sameSector &&
    topMatch.primaryCta &&
    topMatch.secondaryCta
      ? {
          cta: {
            ...(baseCreativeDirection.cta || {}),
            primary: topMatch.primaryCta,
            secondary: topMatch.secondaryCta,
          },
        }
      : {}),
  }
}

function hasActiveReusablePlanningDecision(reusablePlanningContext) {
  return Boolean(
    reusablePlanningContext &&
      typeof reusablePlanningContext === 'object' &&
      reusablePlanningContext.reuseDecision === true &&
      typeof reusablePlanningContext.reuseMode === 'string' &&
      reusablePlanningContext.reuseMode.trim() &&
      reusablePlanningContext.reuseMode.trim() !== 'none' &&
      Array.isArray(reusablePlanningContext.reusedArtifactIds) &&
      reusablePlanningContext.reusedArtifactIds.some(
        (artifactId) => typeof artifactId === 'string' && artifactId.trim(),
      ),
  )
}

function buildReusableInstructionSuffix(reusablePlanningContext) {
  if (!hasActiveReusablePlanningDecision(reusablePlanningContext)) {
    return ''
  }

  const artifactIds = reusablePlanningContext.reusedArtifactIds
    .filter((artifactId) => typeof artifactId === 'string' && artifactId.trim())
    .map((artifactId) => artifactId.trim())

  if (artifactIds.length === 0) {
    return ''
  }

  return `, reutilizar memoria local en modo ${reusablePlanningContext.reuseMode} tomando como referencia ${artifactIds.join(', ')}`
}

function buildReusableReferenceLabel(reusablePlanningContext) {
  if (!hasActiveReusablePlanningDecision(reusablePlanningContext)) {
    return ''
  }

  const primaryArtifactId = reusablePlanningContext.reusedArtifactIds.find(
    (artifactId) => typeof artifactId === 'string' && artifactId.trim(),
  )

  return primaryArtifactId ? primaryArtifactId.trim() : ''
}

function extractExplicitBusinessLabelFromPlanningText(...texts) {
  const extractionPatterns = [
    /\b(?:para|de)\s+(una?|el|la)\s+(.+?)(?=\s+(?:manteniendo|mantener|conservando|conservar|cambiando|cambiar|rediseñando|redisenando|rediseñar|redisenar|redefiniendo|redefinir|renovando|renovar|mejorando|mejorar|optimizando|optimizar|reorganizando|reorganizar|con\s+estilo|con\s+estructura|con\s+una?\s+base|pero\b|sin\b|si\b|y\b)|[.,;:]|$)/iu,
    /\b(?:rubro|negocio|marca)\s+(?:actual\s+)?(?:de\s+)?(.+?)(?=\s+(?:manteniendo|mantener|conservando|conservar|cambiando|cambiar|rediseñando|redisenando|rediseñar|redisenar|redefiniendo|redefinir|renovando|renovar|mejorando|mejorar|optimizando|optimizar|reorganizando|reorganizar|pero\b|sin\b|si\b|y\b)|[.,;:]|$)/iu,
  ]

  for (const text of texts) {
    if (typeof text !== 'string' || !text.trim()) {
      continue
    }

    for (const pattern of extractionPatterns) {
      const match = text.match(pattern)
      const extractedLabel = sanitizeBusinessSectorLabel(match?.[2] || match?.[1] || '')

      if (extractedLabel) {
        return stripLeadingSpanishArticle(extractedLabel)
      }
    }
  }

  return ''
}

function inferReusableTargetLabel(goal, context, sectorConfig) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()
  const explicitBusinessLabel = extractExplicitBusinessLabelFromPlanningText(
    goal,
    context,
  )
  const resolvedBusinessLabel =
    explicitBusinessLabel ||
    stripLeadingSpanishArticle(sectorConfig?.label || sectorConfig?.businessNoun || '')

  if (combinedText.includes('landing')) {
    return resolvedBusinessLabel
      ? `la landing para ${resolvedBusinessLabel}`
      : 'la landing'
  }

  if (combinedText.includes('home')) {
    return resolvedBusinessLabel ? `la home para ${resolvedBusinessLabel}` : 'la home'
  }

  if (combinedText.includes('pagina') || combinedText.includes('página')) {
    return resolvedBusinessLabel
      ? `la página principal para ${resolvedBusinessLabel}`
      : 'la página principal'
  }

  if (combinedText.includes('web') || combinedText.includes('sitio')) {
    return resolvedBusinessLabel ? `la web para ${resolvedBusinessLabel}` : 'la web'
  }

  if (resolvedBusinessLabel) {
    return `la experiencia web para ${resolvedBusinessLabel}`
  }

  return 'la interfaz principal'
}

function buildReusablePreserveDirective({
  reuseMode,
  creativeDirection,
  topMatch,
}) {
  const resolvedReuseMode =
    typeof reuseMode === 'string' ? reuseMode.trim() : ''
  const styleDetails = [
    topMatch?.visualStyle || creativeDirection?.visualStyle,
    creativeDirection?.tone,
  ].filter((value) => typeof value === 'string' && value.trim())
  const structureDetails = [
    topMatch?.layoutVariant || creativeDirection?.layoutVariant,
    topMatch?.heroStyle || creativeDirection?.heroStyle,
  ].filter((value) => typeof value === 'string' && value.trim())

  if (resolvedReuseMode === 'reuse-style') {
    return styleDetails.length > 0
      ? `conservar el lenguaje visual (${styleDetails.join(', ')}), junto con paleta, tipografías y tono`
      : 'conservar paleta, tipografías, tono y tratamiento visual'
  }

  if (resolvedReuseMode === 'reuse-structure') {
    return structureDetails.length > 0
      ? `conservar la base estructural (${structureDetails.join(', ')}), junto con el orden de lectura y la jerarquía de secciones`
      : 'conservar la base estructural, el orden de lectura y la jerarquía de secciones'
  }

  if (resolvedReuseMode === 'reuse-style-and-structure') {
    const mergedDetails = [...styleDetails, ...structureDetails]

    return mergedDetails.length > 0
      ? `conservar el estilo y la estructura base (${mergedDetails.join(', ')})`
      : 'conservar el estilo y la estructura base del artefacto reusable'
  }

  return 'tomar la referencia reusable como guía concreta para la siguiente iteración'
}

function detectReusableRedesignSignals(goal, context) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  return {
    mentionsStructure:
      combinedText.includes('estructura') ||
      combinedText.includes('reorgan') ||
      combinedText.includes('orden de secciones') ||
      combinedText.includes('layout'),
    mentionsStyle:
      combinedText.includes('estilo') ||
      combinedText.includes('visual') ||
      combinedText.includes('paleta') ||
      combinedText.includes('tipograf') ||
      combinedText.includes('tono'),
    mentionsHero:
      combinedText.includes('hero') ||
      combinedText.includes('apertura') ||
      combinedText.includes('primer scroll'),
    mentionsHierarchy:
      combinedText.includes('jerarqu') ||
      combinedText.includes('claridad') ||
      combinedText.includes('lectura'),
    mentionsSales:
      combinedText.includes('vender') ||
      combinedText.includes('venta') ||
      combinedText.includes('convers') ||
      combinedText.includes('lead') ||
      combinedText.includes('consulta') ||
      combinedText.includes('captar'),
    mentionsRedesign:
      combinedText.includes('redise') ||
      combinedText.includes('redisen') ||
      combinedText.includes('mejorar') ||
      combinedText.includes('cambiar') ||
      combinedText.includes('reforzar') ||
      combinedText.includes('optimizar'),
  }
}

function buildReusableChangeDirective({
  reuseMode,
  creativeDirection,
  redesignSignals,
}) {
  const resolvedReuseMode =
    typeof reuseMode === 'string' ? reuseMode.trim() : ''
  if (resolvedReuseMode === 'reuse-structure') {
    const directives = [
      'adaptar el contenido, los titulos, las etiquetas de seccion y los CTA al rubro actual sin arrastrar mensajes comerciales del artefacto reusable',
    ]

    if (redesignSignals.mentionsStyle || redesignSignals.mentionsRedesign) {
      directives.push(
        'actualizar el tratamiento visual para alinearlo al objetivo actual sin romper la base estructural heredada',
      )
    }

    if (redesignSignals.mentionsHero || redesignSignals.mentionsSales || redesignSignals.mentionsRedesign) {
      directives.push(
        'reescribir el hero y sus llamadas a la accion dentro de la misma composicion base para que el primer scroll responda al nuevo negocio',
      )
    }

    if (redesignSignals.mentionsHierarchy) {
      directives.push(
        'ordenar titulos, bloques y llamadas a la accion dentro de la estructura heredada para que la lectura sea mas nitida',
      )
    }

    if (redesignSignals.mentionsSales || redesignSignals.mentionsRedesign) {
      directives.push(
        'volver la propuesta mas persuasiva y orientada a conversion desde el contenido, sin reorganizar las secciones base',
      )
    }

    return directives.join(', ')
  }

  const sectionOrder =
    Array.isArray(creativeDirection?.sectionOrder) &&
    creativeDirection.sectionOrder.length > 0
      ? creativeDirection.sectionOrder.join(', ')
      : 'las secciones principales'
  const shouldChangeStructure =
    redesignSignals.mentionsStructure || resolvedReuseMode === 'reuse-style'
  const shouldChangeStyle =
    redesignSignals.mentionsStyle || resolvedReuseMode === 'reuse-structure'
  const directives = []

  if (shouldChangeStructure) {
    directives.push(
      `rediseñar la estructura general, reorganizar ${sectionOrder} y mejorar la jerarquía visual del recorrido`,
    )
  }

  if (shouldChangeStyle) {
    directives.push(
      'actualizar el tratamiento visual para alinearlo al objetivo actual sin perder claridad editorial',
    )
  }

  if (redesignSignals.mentionsHero || resolvedReuseMode !== 'reuse-structure') {
    directives.push('reforzar el hero y el primer scroll para dar una entrada más clara y memorable')
  }

  if (redesignSignals.mentionsHierarchy || shouldChangeStructure) {
    directives.push('ordenar títulos, bloques y llamadas a la acción para que la lectura sea más nítida')
  }

  if (redesignSignals.mentionsSales || redesignSignals.mentionsRedesign) {
    directives.push('volver la propuesta más persuasiva y orientada a conversión sin perder tono de marca')
  }

  return directives.length > 0
    ? directives.join(', ')
    : 'ajustar la propuesta para que sea más clara, sólida y accionable'
}

function hasReusableRedesignIntent(goal, context) {
  const redesignSignals = detectReusableRedesignSignals(goal, context)

  return Boolean(
    redesignSignals.mentionsRedesign ||
      redesignSignals.mentionsStructure ||
      redesignSignals.mentionsStyle ||
      redesignSignals.mentionsHero ||
      redesignSignals.mentionsHierarchy ||
      redesignSignals.mentionsSales,
  )
}

function hasSufficientReusableInstructionContext({
  goal,
  context,
  reusablePlanningContext,
}) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')

  return (
    hasActiveReusablePlanningDecision(reusablePlanningContext) &&
    combinedText.trim().length >= 24
  )
}

function buildReusableExecutionInstruction({
  goal,
  context,
  sectorConfig,
  creativeDirection,
  reusablePlanningContext,
}) {
  if (
    !hasSufficientReusableInstructionContext({
      goal,
      context,
      reusablePlanningContext,
    })
  ) {
    return ''
  }

  const topMatch =
    Array.isArray(reusablePlanningContext?.reusableArtifactLookup?.matches) &&
    reusablePlanningContext.reusableArtifactLookup.matches.length > 0
      ? reusablePlanningContext.reusableArtifactLookup.matches[0]
      : null
  const targetLabel = inferReusableTargetLabel(goal, context, sectorConfig)
  const referenceLabel =
    buildReusableReferenceLabel(reusablePlanningContext) || 'la referencia reusable seleccionada'
  const preserveDirective = buildReusablePreserveDirective({
    reuseMode: reusablePlanningContext.reuseMode,
    creativeDirection,
    topMatch,
  })
  const redesignSignals = detectReusableRedesignSignals(goal, context)
  const changeDirective = buildReusableChangeDirective({
    reuseMode: reusablePlanningContext.reuseMode,
    creativeDirection,
    redesignSignals,
  })
  const resultDirective =
    creativeDirection?.cta?.primary && typeof creativeDirection.cta.primary === 'string'
      ? `dejar como resultado ${targetLabel} más clara, consistente y lista para ejecutar, con CTA principal "${creativeDirection.cta.primary}" y una propuesta final editable dentro del workspace`
      : `dejar como resultado ${targetLabel} más clara, consistente y lista para ejecutar, con una propuesta final editable dentro del workspace`
  const resolvedReuseMode =
    typeof reusablePlanningContext?.reuseMode === 'string'
      ? reusablePlanningContext.reuseMode.trim()
      : ''
  const instructionLead =
    resolvedReuseMode === 'reuse-structure'
      ? `Reutilizar la estructura base de ${referenceLabel} para adaptar ${targetLabel}`
      : resolvedReuseMode === 'reuse-style-and-structure'
        ? `Adaptar ${targetLabel} dentro del proyecto tomando como base reusable ${referenceLabel}`
        : `Rediseñar ${targetLabel} dentro del proyecto tomando como base reusable ${referenceLabel}`

  return `${instructionLead}: ${preserveDirective}, ${changeDirective}, y ${resultDirective}.`
}

function isGenericPlannerInstruction(instruction) {
  if (typeof instruction !== 'string' || !instruction.trim()) {
    return true
  }

  const normalizedInstruction = instruction.trim().toLocaleLowerCase()
  const genericPrefixes = [
    'resolver de forma concreta el objetivo indicado:',
    'tomar el resultado anterior y resolver el objetivo indicado:',
    'validar el resultado anterior y completar el objetivo indicado:',
    'devolver una respuesta técnica breve en español argentino sobre:',
    'devolver una respuesta tecnica breve en español argentino sobre:',
  ]

  return genericPrefixes.some((prefix) => normalizedInstruction.startsWith(prefix))
}

function instructionMentionsReusablePlanningContext(
  instruction,
  reusablePlanningContext,
) {
  if (typeof instruction !== 'string' || !instruction.trim()) {
    return false
  }

  if (!hasActiveReusablePlanningDecision(reusablePlanningContext)) {
    return false
  }

  const normalizedInstruction = instruction.trim().toLocaleLowerCase()
  const normalizedReuseMode =
    typeof reusablePlanningContext.reuseMode === 'string'
      ? reusablePlanningContext.reuseMode.trim().toLocaleLowerCase()
      : ''
  const artifactIds = reusablePlanningContext.reusedArtifactIds
    .filter((artifactId) => typeof artifactId === 'string' && artifactId.trim())
    .map((artifactId) => artifactId.trim().toLocaleLowerCase())

  return (
    normalizedInstruction.includes('reutil') ||
    normalizedInstruction.includes('memoria reusable') ||
    normalizedInstruction.includes('memoria local') ||
    (normalizedReuseMode && normalizedInstruction.includes(normalizedReuseMode)) ||
    artifactIds.some((artifactId) => normalizedInstruction.includes(artifactId))
  )
}

function resolveReusableAwareInstruction({
  rawInstruction,
  fallbackInstruction,
  reusablePlanningContext,
}) {
  const normalizedRawInstruction =
    typeof rawInstruction === 'string' ? rawInstruction.trim() : ''
  const normalizedFallbackInstruction =
    typeof fallbackInstruction === 'string' ? fallbackInstruction.trim() : ''

  if (!hasActiveReusablePlanningDecision(reusablePlanningContext)) {
    return normalizedRawInstruction || normalizedFallbackInstruction
  }

  if (
    normalizedRawInstruction &&
    !isGenericPlannerInstruction(normalizedRawInstruction) &&
    instructionMentionsReusablePlanningContext(
      normalizedRawInstruction,
      reusablePlanningContext,
    )
  ) {
    return normalizedRawInstruction
  }

  return normalizedFallbackInstruction || normalizedRawInstruction
}

async function buildReusableArtifactPlanningContext({
  userDataPath,
  goal,
  context,
  sectorConfig,
  creativeDirection,
  manualReusablePreference,
}) {
  const artifactLookup = await lookupReusableArtifactsForPlanning({
    userDataPath,
    sector: sectorConfig?.key,
    visualStyle: creativeDirection?.visualStyle,
    layoutVariant: creativeDirection?.layoutVariant,
    heroStyle: creativeDirection?.heroStyle,
    tags: buildReusablePlanningTags({ sectorConfig, creativeDirection }),
    limit: 5,
  })
  const normalizedManualReusablePreference =
    normalizeManualReusablePreference(manualReusablePreference)

  if (normalizedManualReusablePreference?.reuseMode === 'none') {
    return {
      reusableArtifactLookup: artifactLookup,
      reusableArtifactsFound: artifactLookup.foundCount,
      reuseDecision: false,
      reuseReason:
        'El operador desactivó manualmente la reutilización para esta corrida, así que el lookup se conserva solo como referencia.',
      reusedArtifactIds: [],
      reuseMode: 'none',
      creativeDirection,
    }
  }

  if (
    normalizedManualReusablePreference?.artifactId &&
    normalizedManualReusablePreference?.reuseMode
  ) {
    const selectedArtifacts = await listReusableArtifacts({
      userDataPath,
      filters: {
        id: normalizedManualReusablePreference.artifactId,
        limit: 1,
      },
    })
    const selectedArtifact = selectedArtifacts[0] || null

    if (selectedArtifact) {
      const selectedMatch = {
        id: selectedArtifact.id,
        type: selectedArtifact.type,
        sector: selectedArtifact.sector,
        sectorLabel: selectedArtifact.sectorLabel,
        visualStyle: selectedArtifact.visualStyle,
        layoutVariant: selectedArtifact.layoutVariant,
        heroStyle: selectedArtifact.heroStyle,
        localPath: selectedArtifact.localPath,
        primaryCta: selectedArtifact.primaryCta,
        secondaryCta: selectedArtifact.secondaryCta,
        typography: selectedArtifact.typography,
        colors: selectedArtifact.colors,
        metadata: selectedArtifact.metadata,
        tags: Array.isArray(selectedArtifact.tags) ? selectedArtifact.tags : [],
        similarityScore: 99,
        matchReasons: ['manual-selection'],
      }
      const mergedMatches = [
        selectedMatch,
        ...artifactLookup.matches.filter((match) => match.id !== selectedMatch.id),
      ].slice(0, 5)
      const manualArtifactLookup = {
        executed: true,
        foundCount: mergedMatches.length,
        matches: mergedMatches,
      }

      // La selección manual del operador debe mandar por encima del lookup
      // automático. El resto de los matches se conserva solo como contexto
      // secundario para trazabilidad y futuras iteraciones.
      const adjustedCreativeDirection = applyReusableArtifactToCreativeDirection({
        baseCreativeDirection: creativeDirection,
        artifactLookup: manualArtifactLookup,
        reuseMode: normalizedManualReusablePreference.reuseMode,
        sectorConfig,
      })

      return {
        reusableArtifactLookup: manualArtifactLookup,
        reusableArtifactsFound: manualArtifactLookup.foundCount,
        reuseDecision: true,
        reuseReason:
          `El operador seleccionó manualmente el artefacto ${selectedMatch.id} ` +
          `en modo ${normalizedManualReusablePreference.reuseMode}; esa preferencia tiene prioridad sobre la sugerencia automática.`,
        reusedArtifactIds: [selectedMatch.id],
        reuseMode: normalizedManualReusablePreference.reuseMode,
        creativeDirection: adjustedCreativeDirection,
      }
    }
  }

  const reusePlan = decideReusableArtifactPlan({
    goal,
    context,
    sectorConfig,
    creativeDirection,
    artifactLookup,
  })
  const adjustedCreativeDirection = applyReusableArtifactToCreativeDirection({
    baseCreativeDirection: creativeDirection,
    artifactLookup,
    reuseMode: reusePlan.reuseMode,
    sectorConfig,
  })

  return {
    reusableArtifactLookup: artifactLookup,
    reusableArtifactsFound: artifactLookup.foundCount,
    reuseDecision: reusePlan.reuseDecision,
    reuseReason: reusePlan.reuseReason,
    reusedArtifactIds: reusePlan.reusedArtifactIds,
    reuseMode: reusePlan.reuseMode,
    creativeDirection: adjustedCreativeDirection,
  }
}

function buildLocalWebScaffoldBaseBrainDecision({
  goal,
  context,
  workspacePath,
  sectorConfig,
  reusablePlanningContext,
}) {
  const hasBusinessContext = typeof context === 'string' && context.trim().length > 0
  const resolvedSectorConfig =
    sectorConfig ||
    resolveWebScaffoldSectorConfig({
      instruction: goal,
      context,
    }) ||
    WEB_SCAFFOLD_SECTOR_PRESETS.estetica
  const creativeDirection = buildWebCreativeDirection({
    goal,
    context,
    sectorConfig: resolvedSectorConfig,
  })
  const effectiveReusablePlanningContext =
    reusablePlanningContext && typeof reusablePlanningContext === 'object'
      ? reusablePlanningContext
      : {
          reusableArtifactLookup: {
            executed: false,
            foundCount: 0,
            matches: [],
          },
          reusableArtifactsFound: 0,
          reuseDecision: false,
          reuseReason: '',
          reusedArtifactIds: [],
          reuseMode: 'none',
          creativeDirection,
        }
  const resolvedCreativeDirection =
    effectiveReusablePlanningContext.creativeDirection || creativeDirection
  const explicitScaffoldFolderName = extractExplicitWebScaffoldFolderName(
    goal,
    context,
  )
  const scaffoldSectorConfig = {
    ...resolvedSectorConfig,
    explicitFolderName: explicitScaffoldFolderName,
  }
  const scaffoldFolderName = buildWebScaffoldBaseFolderName(scaffoldSectorConfig)
  const webScaffoldExecutionScope =
    buildWebScaffoldBaseExecutionScope(scaffoldSectorConfig)
  const reusableRedesignInstruction = buildReusableExecutionInstruction({
    goal,
    context,
    sectorConfig: resolvedSectorConfig,
    creativeDirection: resolvedCreativeDirection,
    reusablePlanningContext: effectiveReusablePlanningContext,
  })
  const shouldUseReusableRedesignInstruction =
    Boolean(reusableRedesignInstruction) &&
    hasActiveReusablePlanningDecision(effectiveReusablePlanningContext) &&
    hasReusableRedesignIntent(goal, context)

  return buildBrainDecisionContract({
    decisionKey: 'web-scaffold-base',
    strategy: 'web-scaffold-base',
    executionMode: 'executor',
    businessSector: resolvedSectorConfig.key,
    businessSectorLabel: resolvedSectorConfig.label,
    creativeDirection: resolvedCreativeDirection,
    reusableArtifactLookup: effectiveReusablePlanningContext.reusableArtifactLookup,
    reusableArtifactsFound: effectiveReusablePlanningContext.reusableArtifactsFound,
    reuseDecision: effectiveReusablePlanningContext.reuseDecision,
    reuseReason: effectiveReusablePlanningContext.reuseReason,
    reusedArtifactIds: effectiveReusablePlanningContext.reusedArtifactIds,
    reuseMode: effectiveReusablePlanningContext.reuseMode,
    reason:
      'El objetivo pide una web institucional base y conviene bajar primero un scaffold inicial concreto y adaptable al rubro detectado o indicado.',
    tasks: [
      {
        step: 1,
        title: 'Revisar la estructura actual del proyecto y detectar el entrypoint web principal',
      },
      {
        step: 2,
        title:
          `Definir una direccion creativa ${resolvedCreativeDirection.experienceType} para ${resolvedSectorConfig.businessNoun} con hero ${resolvedCreativeDirection.heroStyle} y ritmo ${resolvedCreativeDirection.layoutRhythm}`,
      },
      {
        step: 3,
        title:
          shouldUseReusableRedesignInstruction
            ? effectiveReusablePlanningContext.reuseMode === 'reuse-style'
              ? `Conservar estilo reusable y rediseñar estructura, hero y jerarquía visual para ${resolvedSectorConfig.label}.`
              : effectiveReusablePlanningContext.reuseMode === 'reuse-structure'
                ? `Conservar estructura reusable y actualizar estilo, tono y tratamiento visual para ${resolvedSectorConfig.label}.`
                : `Conservar la base reusable y ajustarla con foco en hero, CTA y jerarquía visual para ${resolvedSectorConfig.label}.`
            : `Adaptar estructura, CTA, tono y estilo visual (${resolvedCreativeDirection.visualStyle}) al rubro detectado (${resolvedSectorConfig.label}) usando el contexto disponible`,
      },
      ...(effectiveReusablePlanningContext.reuseDecision
        ? [
            {
              step: 4,
              title: `Aprovechar memoria reusable en modo ${effectiveReusablePlanningContext.reuseMode}: ${effectiveReusablePlanningContext.reuseReason}`,
            },
          ]
        : []),
      {
        step: effectiveReusablePlanningContext.reuseDecision ? 5 : 4,
        title:
          `Materializar solo la carpeta "${scaffoldFolderName}" con index.html, styles.css y script.js dentro del workspace local`,
      },
      {
        step: effectiveReusablePlanningContext.reuseDecision ? 6 : 5,
        title:
          'Devolver un resumen breve de la carpeta y los archivos creados o editados',
      },
    ],
    requiresApproval: false,
    question: hasBusinessContext
      ? ''
      : `Faltan detalles especificos de ${resolvedSectorConfig.label}. Se puede arrancar igual con placeholders claros.`,
    assumptions: [
      'Se asume una landing inicial de una sola página como primera entrega.',
      hasBusinessContext
        ? 'Se priorizará el contexto del negocio aportado por el usuario para el primer scaffold.'
        : 'Si faltan datos del negocio, se usarán placeholders neutros y editables.',
      `El rubro detectado para adaptar la base institucional es: ${resolvedSectorConfig.label}.`,
      `La direccion creativa inicial es ${resolvedCreativeDirection.visualStyle} con hero ${resolvedCreativeDirection.heroStyle}.`,
      ...(effectiveReusablePlanningContext.reuseDecision
        ? [
            `La memoria reusable aportará ${effectiveReusablePlanningContext.reuseMode} con artefactos: ${effectiveReusablePlanningContext.reusedArtifactIds.join(', ')}.`,
          ]
        : effectiveReusablePlanningContext.reusableArtifactsFound > 0
          ? [
              'Se revisó memoria reusable existente, pero en esta corrida no conviene reutilizarla de forma directa.',
            ]
          : []),
      `En esta primera iteración, el scaffold base queda acotado a ${scaffoldFolderName}, index.html, styles.css y script.js.`,
      workspacePath
        ? `El scaffold inicial se resolverá dentro del workspace configurado: ${workspacePath}.`
        : 'El scaffold inicial se resolverá dentro del workspace activo del proyecto.',
    ],
    instruction:
      shouldUseReusableRedesignInstruction
        ? `${reusableRedesignInstruction} Limitar esta primera iteración a materializar la carpeta "${scaffoldFolderName}" con index.html, styles.css y script.js, y devolver un resumen breve de los archivos creados o editados.`
        : `Crear una web institucional base inicial para ${resolvedSectorConfig.businessNoun} dentro del proyecto actual: revisar la estructura existente, identificar el entrypoint principal, scaffoldear una landing con direccion creativa ${resolvedCreativeDirection.visualStyle}, hero ${resolvedCreativeDirection.heroStyle}, orden de secciones ${resolvedCreativeDirection.sectionOrder.join(', ')}, CTA principal "${resolvedCreativeDirection.cta.primary}", tono ${resolvedCreativeDirection.tone}, originalidad ${resolvedCreativeDirection.originalityLevel}, usar el contexto del negocio si esta disponible y placeholders claros si falta informacion${effectiveReusablePlanningContext.reuseDecision ? `, reutilizar memoria local en modo ${effectiveReusablePlanningContext.reuseMode} tomando como referencia ${effectiveReusablePlanningContext.reusedArtifactIds.join(', ')}` : ''}, limitar esta primera iteracion a crear la carpeta "${scaffoldFolderName}" con index.html, styles.css y script.js, y devolver un resumen breve de la carpeta y los archivos creados o editados.`,
    executionScope: webScaffoldExecutionScope,
    completed: false,
    nextExpectedAction: 'execute-plan',
  })
}

function buildLocalAskUserBrainDecision({
  goal,
  workspacePath,
  reason,
  question,
}) {
  return buildBrainDecisionContract({
    decisionKey: 'ask-user-clarification',
    strategy: 'ask-user',
    executionMode: 'ask-user',
    reason:
      typeof reason === 'string' && reason.trim()
        ? reason.trim()
        : 'El objetivo es demasiado amplio o ambiguo para decidir una estrategia segura sin una aclaración mínima del usuario.',
    tasks: [
      {
        step: 1,
        title: 'Pedir una aclaración breve antes de elegir estrategia o ejecutar cambios',
      },
    ],
    requiresApproval: false,
    question:
      typeof question === 'string' && question.trim()
        ? question.trim()
        : `Necesito una aclaración mínima para avanzar con: ${goal}`,
    assumptions: [
      workspacePath
        ? `La futura ejecución ocurrirá dentro del workspace configurado: ${workspacePath}.`
        : 'La futura ejecución ocurrirá dentro del workspace activo del proyecto.',
    ],
    instruction:
      'Solicitar al usuario una aclaración breve sobre el objetivo antes de continuar con la ejecución.',
    completed: false,
    nextExpectedAction: 'user-clarification',
  })
}

function normalizeUserParticipationMode(value) {
  if (
    value === 'user-will-contribute' ||
    value === 'brain-decides-missing'
  ) {
    return value
  }

  return ''
}

function normalizeResolvedDecisionKey(value) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''
}

function normalizeApprovalFamilyKey(value) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''
}

function buildResolvedDecisionMap(projectState, userParticipationMode) {
  const resolvedDecisionMap = new Map()
  const normalizedUserParticipationMode =
    normalizeUserParticipationMode(
      projectState?.userParticipationMode || userParticipationMode,
    )
  const rawResolvedDecisions = Array.isArray(projectState?.resolvedDecisions)
    ? projectState.resolvedDecisions
    : []

  // El planner trabaja con un mapa operativo, no con un historial crudo.
  // Acá normalizamos el estado persistido para que la última decisión humana
  // o de sistema sea la única fuente de verdad al decidir approvals y recoveries.
  for (const decision of rawResolvedDecisions) {
    const normalizedKey = normalizeResolvedDecisionKey(decision?.key)

    if (!normalizedKey) {
      continue
    }

    resolvedDecisionMap.set(normalizedKey, {
      key: normalizedKey,
      status:
        decision?.status === 'delegated' ||
        decision?.status === 'approved' ||
        decision?.status === 'rejected' ||
        decision?.status === 'resolved'
          ? decision.status
          : 'resolved',
      source:
        decision?.source === 'system' ||
        decision?.source === 'user' ||
        decision?.source === 'planner' ||
        decision?.source === 'executor'
          ? decision.source
          : 'system',
      summary: typeof decision?.summary === 'string' ? decision.summary.trim() : '',
      selectedOption:
        typeof decision?.selectedOption === 'string'
          ? decision.selectedOption.trim()
          : '',
      freeAnswer:
        typeof decision?.freeAnswer === 'string' ? decision.freeAnswer.trim() : '',
      approvalFamily: normalizeApprovalFamilyKey(decision?.approvalFamily),
      updatedAt:
        typeof decision?.updatedAt === 'string' ? decision.updatedAt.trim() : '',
    })
  }

  if (normalizedUserParticipationMode === 'brain-decides-missing') {
    ;[
      'technical-defaults',
      'placeholder-content',
      'provisional-assets',
      'local-scaffold-work',
      'local-branch-work',
      'local-commit-work',
      'readme-env-example',
    ].forEach((decisionKey) => {
      if (!resolvedDecisionMap.has(decisionKey)) {
        resolvedDecisionMap.set(decisionKey, {
          key: decisionKey,
          status: 'delegated',
          source: 'system',
          summary:
            'Decision delegada al Cerebro por la politica de participacion del usuario.',
        })
      }
    })
  }

  return resolvedDecisionMap
}

function hasResolvedDecision(resolvedDecisionMap, ...decisionKeys) {
  return decisionKeys.some((decisionKey) =>
    resolvedDecisionMap.has(normalizeResolvedDecisionKey(decisionKey)),
  )
}

function getResolvedDecisionRecord(resolvedDecisionMap, ...decisionKeys) {
  for (const decisionKey of decisionKeys) {
    const record = resolvedDecisionMap.get(normalizeResolvedDecisionKey(decisionKey))

    if (record) {
      return record
    }
  }

  return null
}

function hasRejectedDecision(resolvedDecisionMap, ...decisionKeys) {
  const decisionRecord = getResolvedDecisionRecord(resolvedDecisionMap, ...decisionKeys)

  return decisionRecord?.status === 'rejected'
}

function detectMinorDelegableTopic(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  const minorPatterns = [
    'default',
    'placeholder',
    'colores',
    'tipograf',
    'logo provisional',
    'foto stock',
    'assets provis',
    'foco visual',
    'estructura base',
    'stack razonable',
    'branch local',
    'commit local',
    'scaffold local',
    'readme',
    '.env.example',
    'formulario placeholder',
    'hooks placeholder',
    'rutas',
    'componentes base',
    'contenido provisional',
  ]

  return minorPatterns.some((pattern) => combinedText.includes(pattern))
}

function detectPlaceholderAssetApprovalTopic(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  const placeholderAssetPatterns = [
    'placeholder',
    'logo',
    'subir logo',
    'cargar logo',
    'upload logo',
    'foto',
    'fotos',
    'subir fotos',
    'cargar fotos',
    'imagenes',
    'imágenes',
    'foto stock',
    'stock',
    'asset',
    'assets',
    'assets menores',
    'assets provis',
    'provisional assets',
    'identidad visual',
    'branding basico',
    'branding básico',
  ]

  return placeholderAssetPatterns.some((pattern) => combinedText.includes(pattern))
}

function deriveApprovalEquivalenceFamily(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return ''
  }

  // Mantener en sync con src/App.tsx.
  // La UI persiste estas mismas familias para que renderer y planner resuelvan
  // equivalencias igual: scaffold local provisional, repo público y deploy.
  const explicitlyNoDeploy =
    combinedText.includes('approve_no_deploy') ||
    combinedText.includes('repo sin deploy') ||
    combinedText.includes('sin deploy') ||
    combinedText.includes('no deploy') ||
    combinedText.includes('no desplegar') ||
    combinedText.includes('no publicar') ||
    combinedText.includes('sin publicar') ||
    combinedText.includes('sin publicacion') ||
    combinedText.includes('sin publicación')
  const explicitlyNoPublicRepo =
    combinedText.includes('sin repo publico') ||
    combinedText.includes('sin repo público') ||
    combinedText.includes('no crear repo publico') ||
    combinedText.includes('no crear repo público') ||
    combinedText.includes('no subir repo') ||
    combinedText.includes('sin github repo') ||
    combinedText.includes('sin public repo')
  const explicitlyLocalOnly =
    combinedText.includes('solo para pruebas locales') ||
    combinedText.includes('solo local') ||
    combinedText.includes('solo en local') ||
    combinedText.includes('solo dentro del workspace local') ||
    combinedText.includes('dentro del workspace local') ||
    combinedText.includes('entorno local')
  const mentionsDeploy =
    combinedText.includes('deploy') ||
    combinedText.includes('github pages') ||
    combinedText.includes('publicacion') ||
    combinedText.includes('publicación') ||
    combinedText.includes('publicar') ||
    combinedText.includes('vercel') ||
    combinedText.includes('produccion') ||
    combinedText.includes('producción')
  const mentionsPublicRepo =
    combinedText.includes('repo publico') ||
    combinedText.includes('repo público') ||
    combinedText.includes('public repo') ||
    combinedText.includes('github repo') ||
    combinedText.includes('crear repo') ||
    combinedText.includes('subir repo') ||
    combinedText.includes('publicar repo') ||
    explicitlyNoDeploy
  const hasPositiveDeployIntent = mentionsDeploy && !explicitlyNoDeploy
  const hasPositivePublicRepoIntent = mentionsPublicRepo && !explicitlyNoPublicRepo
  const isProvisionalWebScaffoldApproval =
    (combinedText.includes('scaffold') || combinedText.includes('generacion')) &&
    (combinedText.includes('provisional') ||
      combinedText.includes('placeholder') ||
      combinedText.includes('mock endpoint') ||
      combinedText.includes('mock api') ||
      combinedText.includes('endpoint local') ||
      combinedText.includes('continu') ||
      combinedText.includes('clinic-website') ||
      combinedText.includes('ruta local') ||
      combinedText.includes('path local'))

  if (
    isProvisionalWebScaffoldApproval &&
    (explicitlyLocalOnly || explicitlyNoDeploy || explicitlyNoPublicRepo) &&
    !hasPositiveDeployIntent &&
    !hasPositivePublicRepoIntent
  ) {
    return 'provisional-web-scaffold'
  }

  if (hasPositiveDeployIntent) {
    return 'public-deploy'
  }

  if (hasPositivePublicRepoIntent) {
    return 'public-repo-creation'
  }

  if (isProvisionalWebScaffoldApproval) {
    return 'provisional-web-scaffold'
  }

  return ''
}

function detectSensitiveApprovalRequirement(...texts) {
  const approvalFamily = deriveApprovalEquivalenceFamily(...texts)

  if (approvalFamily) {
    return true
  }

  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  const sensitivePatterns = [
    'borrar',
    'eliminar',
    'migrar',
    'auth',
    'credencial',
    'api key',
    'token',
    'password',
    'produccion',
    'producción',
    'deploy',
    'publicar',
    'publicacion',
    'publicación',
    'github pages',
    'vercel',
    'repo publico',
    'repo público',
    'public repo',
    'github repo',
  ]

  return sensitivePatterns.some((pattern) => combinedText.includes(pattern))
}

function buildSensitiveApprovalRequest({ goal, context }) {
  const approvalFamily = deriveApprovalEquivalenceFamily(goal, context)

  if (approvalFamily === 'provisional-web-scaffold') {
    return buildBrainApprovalRequest({
      decisionKey: 'approve-provisional-web-scaffold',
      reason:
        'El pedido propone generar un scaffold local provisional con placeholders o mock endpoint, y eso necesita validacion explicita salvo que ya entre en trabajo local delegado.',
      question:
        `Antes de generar el scaffold local provisional para "${goal}", ¿confirmas que queres avanzar con placeholders, contenido editable y mock endpoint solo dentro del workspace local?`,
      allowFreeAnswer: true,
      allowBrainDefault: false,
      impact: 'medium',
      nextExpectedAction: 'user-approval',
    })
  }

  if (approvalFamily === 'public-repo-creation') {
    return buildBrainApprovalRequest({
      decisionKey: 'approve-public-repo-creation',
      reason:
        'La accion implica crear, subir o exponer un repo publico y requiere una validacion humana explicita.',
      question:
        `Antes de continuar con "${goal}", ¿confirmas que queres crear o exponer un repo publico?`,
      allowFreeAnswer: true,
      allowBrainDefault: false,
      impact: 'high',
      nextExpectedAction: 'user-approval',
    })
  }

  if (approvalFamily === 'public-deploy') {
    return buildBrainApprovalRequest({
      decisionKey: 'approve-public-deploy',
      reason:
        'La accion implica publicar o desplegar fuera del entorno local y requiere una validacion humana explicita.',
      question:
        `Antes de continuar con "${goal}", ¿confirmas que queres publicar o desplegar esta web fuera del entorno local?`,
      allowFreeAnswer: true,
      allowBrainDefault: false,
      impact: 'high',
      nextExpectedAction: 'user-approval',
    })
  }

  return null
}

function hasEquivalentApprovalResolved(resolvedDecisionMap, ...texts) {
  const familyKey = deriveApprovalEquivalenceFamily(...texts)

  return familyKey
    ? hasResolvedDecision(resolvedDecisionMap, `approval-family:${familyKey}`)
    : false
}

function resolveEquivalentApprovalFamilyKey(...texts) {
  const familyKey = deriveApprovalEquivalenceFamily(...texts)

  return familyKey ? `approval-family:${familyKey}` : ''
}

function hasEquivalentApprovalRejected(resolvedDecisionMap, ...texts) {
  const familyDecisionKey = resolveEquivalentApprovalFamilyKey(...texts)

  return familyDecisionKey
    ? hasRejectedDecision(resolvedDecisionMap, familyDecisionKey)
    : false
}

function hasDelegatedPlaceholderAssetDefaults(resolvedDecisionMap) {
  return hasResolvedDecision(
    resolvedDecisionMap,
    'placeholder-content',
    'provisional-assets',
  )
}

function shouldSuppressPlaceholderAssetApproval({
  resolvedDecisionMap,
  userParticipationMode,
  texts,
}) {
  return (
    normalizeUserParticipationMode(userParticipationMode) ===
      'brain-decides-missing' &&
    hasDelegatedPlaceholderAssetDefaults(resolvedDecisionMap) &&
    detectPlaceholderAssetApprovalTopic(...texts)
  )
}

function detectRemoteOrCriticalAction(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  const criticalPatterns = [
    'push',
    'pull request',
    'pr ',
    'pr.',
    'deploy',
    'publicar',
    'publicacion',
    'publicación',
    'produccion',
    'producción',
    'github pages',
    'vercel',
    'repo publico',
    'repo público',
    'public repo',
    'github repo',
    'subir repo',
    'dominio real',
    'dns',
    'credencial',
    'api key',
    'token',
    'password',
    'costo real',
    'costos reales',
    'legal',
    'seguridad',
    'borrar',
    'eliminar',
  ]

  return criticalPatterns.some((pattern) => combinedText.includes(pattern))
}

function detectRecoverableExecutorFailure(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  return (
    combinedText.includes('execution-error') ||
    combinedText.includes('timeout esperando respuesta del executor') ||
    combinedText.includes('no se pudo completar la tarea de forma confiable')
  )
}

function detectOversizedExecutorInstruction(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  const oversizedPatterns = [
    'scaffold completo',
    'crear todo el proyecto',
    'rehacer el scaffold entero',
    'html',
    'css',
    'js',
    'readme',
    'qa',
    'wp starter',
    'wordpress',
    'tailwind',
    'next.js',
    'nextjs',
    'formulario',
    'commit',
  ]

  const matchedPatternCount = oversizedPatterns.filter((pattern) =>
    combinedText.includes(pattern),
  ).length

  return (
    matchedPatternCount >= 4 ||
    combinedText.includes('completo') ||
    combinedText.includes('entero') ||
    /html.*css.*js/i.test(combinedText)
  )
}

function buildExecutorFlowKey({
  workspacePath,
  businessSector,
  businessSectorLabel,
  instruction,
}) {
  const normalizedWorkspacePath =
    typeof workspacePath === 'string' ? workspacePath.trim().toLocaleLowerCase() : ''
  const normalizedBusinessSector =
    typeof businessSector === 'string' ? businessSector.trim().toLocaleLowerCase() : ''
  const normalizedBusinessSectorLabel =
    typeof businessSectorLabel === 'string'
      ? businessSectorLabel.trim().toLocaleLowerCase()
      : ''
  const normalizedInstruction =
    typeof instruction === 'string' ? instruction.trim().toLocaleLowerCase() : ''
  const flowFamily =
    normalizedBusinessSector ||
    normalizedBusinessSectorLabel ||
    (normalizedInstruction.includes('wordpress') || normalizedInstruction.includes('wp')
      ? 'wordpress'
      : normalizedInstruction.includes('web') ||
          normalizedInstruction.includes('landing') ||
          normalizedInstruction.includes('sitio')
        ? 'web'
        : normalizedInstruction.includes('formulario') ||
            normalizedInstruction.includes('contacto')
          ? 'form'
          : 'generic')

  return [normalizedWorkspacePath || 'workspace-unknown', flowFamily].join('|')
}

function summarizeExecutorAttemptPaths(paths, limit = 4) {
  return normalizeExecutorPathList(paths).slice(0, limit)
}

function classifyExecutorAttemptScope({
  decisionKey,
  instruction,
  failureContext,
}) {
  const normalizedDecisionKey = normalizeExecutorDecisionKey(decisionKey).toLocaleLowerCase()
  const normalizedInstruction =
    typeof instruction === 'string' ? instruction.trim().toLocaleLowerCase() : ''

  if (
    normalizedDecisionKey === 'recover-single-target' ||
    failureContext?.currentTargetPath
  ) {
    return 'targeted'
  }

  if (
    normalizedDecisionKey === 'recover-single-subtask' ||
    failureContext?.currentSubtask ||
    failureContext?.currentAction
  ) {
    return 'subtask'
  }

  if (
    normalizedDecisionKey === 'recover-and-continue' ||
    normalizedInstruction.includes('continúa desde el estado parcial') ||
    normalizedInstruction.includes('continua desde el estado parcial')
  ) {
    return 'continuation'
  }

  return detectOversizedExecutorInstruction(instruction) ? 'broad' : 'broad'
}

function buildExecutorAttemptAnchor({
  instruction,
  failureContext,
  attemptScope,
}) {
  const targetPath =
    typeof failureContext?.currentTargetPath === 'string'
      ? failureContext.currentTargetPath.trim()
      : ''
  const currentSubtask =
    typeof failureContext?.currentSubtask === 'string'
      ? failureContext.currentSubtask.trim()
      : ''
  const currentAction =
    typeof failureContext?.currentAction === 'string'
      ? failureContext.currentAction.trim()
      : ''

  if (targetPath) {
    return path.basename(targetPath).toLocaleLowerCase()
  }

  if (currentSubtask || currentAction) {
    return `${currentSubtask || currentAction}`.toLocaleLowerCase().slice(0, 120)
  }

  const fallbackTargetPath = suggestFallbackRecoveryTargetPath({
    goal: instruction,
    context: '',
    webScaffoldSector: null,
    executorFailureContext: failureContext,
  })

  if (fallbackTargetPath) {
    return fallbackTargetPath.toLocaleLowerCase()
  }

  return attemptScope
}

function buildExecutorAttemptFingerprint({
  decisionKey,
  instruction,
  failureContext,
  attemptScope,
  hadMaterialProgress,
}) {
  const normalizedDecisionKey =
    normalizeExecutorDecisionKey(decisionKey).toLocaleLowerCase() || 'executor'
  const normalizedAttemptScope = normalizeExecutorAttemptScope(attemptScope)
  const recoveryAnchor = buildExecutorAttemptAnchor({
    instruction,
    failureContext,
    attemptScope: normalizedAttemptScope,
  })
  const materialState =
    typeof failureContext?.materialState === 'string' && failureContext.materialState.trim()
      ? failureContext.materialState.trim().toLocaleLowerCase()
      : 'material-unknown'

  return [
    normalizedDecisionKey,
    normalizedAttemptScope,
    recoveryAnchor || 'generic',
    materialState,
    hadMaterialProgress ? 'material' : 'idle',
  ].join('|')
}

function buildExecutorAttemptRecord({
  decisionKey,
  instruction,
  failureType,
  failureContext,
  timestamp,
}) {
  const normalizedFailureContext =
    normalizeExecutorFailureContextForBrain(failureContext) || {}
  const attemptScope = classifyExecutorAttemptScope({
    decisionKey,
    instruction,
    failureContext: normalizedFailureContext,
  })
  const hadMaterialProgress = hasExecutorMaterialProgress(normalizedFailureContext)
  const fingerprint = buildExecutorAttemptFingerprint({
    decisionKey,
    instruction,
    failureContext: normalizedFailureContext,
    attemptScope,
    hadMaterialProgress,
  })

  return {
    timestamp:
      typeof timestamp === 'string' && timestamp.trim()
        ? timestamp.trim()
        : new Date().toISOString(),
    decisionKey: normalizeExecutorDecisionKey(decisionKey) || 'executor',
    failureType:
      typeof failureType === 'string' && failureType.trim() ? failureType.trim() : '',
    hadMaterialProgress,
    materialState:
      typeof normalizedFailureContext.materialState === 'string'
        ? normalizedFailureContext.materialState
        : '',
    currentTargetPath:
      typeof normalizedFailureContext.currentTargetPath === 'string'
        ? normalizedFailureContext.currentTargetPath
        : '',
    currentSubtask:
      typeof normalizedFailureContext.currentSubtask === 'string'
        ? normalizedFailureContext.currentSubtask
        : '',
    currentAction:
      typeof normalizedFailureContext.currentAction === 'string'
        ? normalizedFailureContext.currentAction
        : '',
    createdPaths: summarizeExecutorAttemptPaths(normalizedFailureContext.createdPaths),
    touchedPaths: summarizeExecutorAttemptPaths(normalizedFailureContext.touchedPaths),
    attemptScope,
    fingerprint,
    isRecoveryAttempt:
      normalizeExecutorDecisionKey(decisionKey).toLocaleLowerCase().startsWith('recover-') ||
      attemptScope !== 'broad',
    status:
      typeof failureType === 'string' && failureType.trim() ? 'failed' : 'completed',
  }
}

function getExecutorRecoveryHistory(flowKey) {
  if (typeof flowKey !== 'string' || !flowKey.trim()) {
    return []
  }

  return executorRecoveryHistories.get(flowKey.trim()) || []
}

function persistExecutorRecoveryHistory(flowKey, attemptRecord) {
  if (
    typeof flowKey !== 'string' ||
    !flowKey.trim() ||
    !attemptRecord ||
    typeof attemptRecord !== 'object'
  ) {
    return []
  }

  const currentHistory = getExecutorRecoveryHistory(flowKey)
  const nextHistory = [...currentHistory, attemptRecord].slice(-MAX_EXECUTOR_RECOVERY_HISTORY)
  executorRecoveryHistories.set(flowKey.trim(), nextHistory)
  return nextHistory
}

function buildExecutorRecoveryMemory({
  flowKey,
  currentAttempt,
}) {
  const history = persistExecutorRecoveryHistory(flowKey, currentAttempt)
  const trailingAttempts = []

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const attempt = history[index]

    trailingAttempts.unshift(attempt)

    if (attempt.status === 'completed' && index !== history.length - 1) {
      trailingAttempts.shift()
      break
    }
  }

  const trailingFailures = trailingAttempts.filter((attempt) => attempt.status === 'failed')
  const equivalentFailures = trailingFailures.filter((attempt) => {
    if (attempt.fingerprint === currentAttempt.fingerprint) {
      return true
    }

    const sameTarget =
      attempt.currentTargetPath &&
      currentAttempt.currentTargetPath &&
      path.basename(attempt.currentTargetPath).toLocaleLowerCase() ===
        path.basename(currentAttempt.currentTargetPath).toLocaleLowerCase()
    const sameSubtask =
      attempt.currentSubtask &&
      currentAttempt.currentSubtask &&
      attempt.currentSubtask.toLocaleLowerCase() ===
        currentAttempt.currentSubtask.toLocaleLowerCase()
    const sameAction =
      attempt.currentAction &&
      currentAttempt.currentAction &&
      attempt.currentAction.toLocaleLowerCase() === currentAttempt.currentAction.toLocaleLowerCase()
    const broadishAttempt =
      (attempt.attemptScope === 'broad' || attempt.attemptScope === 'continuation') &&
      (currentAttempt.attemptScope === 'broad' ||
        currentAttempt.attemptScope === 'continuation')

    return Boolean(sameTarget || sameSubtask || sameAction || broadishAttempt)
  })
  const lowProgressEquivalentFailures = equivalentFailures.filter(
    (attempt) =>
      attempt.hadMaterialProgress !== true ||
      attempt.failureType === 'accepted_but_idle' ||
      attempt.failureType === 'no_material_progress' ||
      attempt.failureType === 'repeated_recovery_failure' ||
      attempt.failureType === 'command_stalled',
  )
  const blockedRecoveryModes = []

  if (lowProgressEquivalentFailures.length >= 2) {
    blockedRecoveryModes.push('recover-and-continue', 'broad-rebuild')
  }

  if (
    equivalentFailures.filter(
      (attempt) => attempt.attemptScope === 'broad' || attempt.attemptScope === 'continuation',
    ).length >= 2
  ) {
    blockedRecoveryModes.push('continuation')
  }

  return {
    lastFailure: trailingFailures.at(-1) || null,
    recentFailures: trailingFailures.slice(-4),
    repeatedFailureCount: equivalentFailures.length,
    lastAttemptScope: currentAttempt.attemptScope,
    blockedRecoveryModes: [...new Set(blockedRecoveryModes)],
  }
}

function normalizeExecutorFailureContextForBrain(failureContext) {
  if (!failureContext || typeof failureContext !== 'object') {
    return null
  }

  const normalizedContext = {
    timestamp:
      typeof failureContext.timestamp === 'string' && failureContext.timestamp.trim()
        ? failureContext.timestamp.trim()
        : '',
    decisionKey:
      typeof failureContext.decisionKey === 'string' && failureContext.decisionKey.trim()
        ? failureContext.decisionKey.trim()
        : '',
    failureType:
      typeof failureContext.failureType === 'string' && failureContext.failureType.trim()
        ? failureContext.failureType.trim()
        : '',
    currentStep:
      typeof failureContext.currentStep === 'string' && failureContext.currentStep.trim()
        ? failureContext.currentStep.trim()
        : '',
    currentSubtask:
      typeof failureContext.currentSubtask === 'string' &&
      failureContext.currentSubtask.trim()
        ? failureContext.currentSubtask.trim()
        : '',
    currentAction:
      typeof failureContext.currentAction === 'string' &&
      failureContext.currentAction.trim()
        ? failureContext.currentAction.trim()
        : '',
    currentCommand:
      typeof failureContext.currentCommand === 'string' &&
      failureContext.currentCommand.trim()
        ? failureContext.currentCommand.trim()
        : '',
    currentTargetPath:
      typeof failureContext.currentTargetPath === 'string' &&
      failureContext.currentTargetPath.trim()
        ? failureContext.currentTargetPath.trim()
        : '',
    createdPaths: normalizeExecutorPathList(failureContext.createdPaths),
    touchedPaths: normalizeExecutorPathList(failureContext.touchedPaths),
    stdout:
      typeof failureContext.stdout === 'string' && failureContext.stdout.trim()
        ? failureContext.stdout.trim()
        : '',
    stderr:
      typeof failureContext.stderr === 'string' && failureContext.stderr.trim()
        ? failureContext.stderr.trim()
        : '',
    lastMaterialProgressAt:
      typeof failureContext.lastMaterialProgressAt === 'string' &&
      failureContext.lastMaterialProgressAt.trim()
        ? failureContext.lastMaterialProgressAt.trim()
        : '',
    hasMaterialProgress: failureContext.hasMaterialProgress === true,
    materialState:
      typeof failureContext.materialState === 'string' && failureContext.materialState.trim()
        ? failureContext.materialState.trim()
        : '',
    acceptedAt:
      typeof failureContext.acceptedAt === 'string' && failureContext.acceptedAt.trim()
        ? failureContext.acceptedAt.trim()
        : '',
    attemptScope:
      failureContext.attemptScope === 'broad' ||
      failureContext.attemptScope === 'targeted' ||
      failureContext.attemptScope === 'subtask' ||
      failureContext.attemptScope === 'continuation'
        ? failureContext.attemptScope
        : '',
    fingerprint:
      typeof failureContext.fingerprint === 'string' && failureContext.fingerprint.trim()
        ? failureContext.fingerprint.trim()
        : '',
    isRecoveryAttempt: failureContext.isRecoveryAttempt === true,
    repeatedFailureCount:
      typeof failureContext.repeatedFailureCount === 'number' &&
      failureContext.repeatedFailureCount > 0
        ? failureContext.repeatedFailureCount
        : 0,
    lastAttemptScope:
      failureContext.lastAttemptScope === 'broad' ||
      failureContext.lastAttemptScope === 'targeted' ||
      failureContext.lastAttemptScope === 'subtask' ||
      failureContext.lastAttemptScope === 'continuation'
        ? failureContext.lastAttemptScope
        : '',
    blockedRecoveryModes: Array.isArray(failureContext.blockedRecoveryModes)
      ? failureContext.blockedRecoveryModes.filter(
          (entry) => typeof entry === 'string' && entry.trim(),
        )
      : [],
    lastFailure:
      failureContext.lastFailure && typeof failureContext.lastFailure === 'object'
        ? normalizeExecutorFailureContextForBrain(failureContext.lastFailure)
        : null,
    recentFailures: Array.isArray(failureContext.recentFailures)
      ? failureContext.recentFailures
          .map((entry) => normalizeExecutorFailureContextForBrain(entry))
          .filter(Boolean)
      : [],
  }

  return Object.values(normalizedContext).some((value) =>
    Array.isArray(value) ? value.length > 0 : Boolean(value),
  )
    ? normalizedContext
    : null
}

function resolveExecutorRecoveryTargetPath(failureContext) {
  if (!failureContext) {
    return ''
  }

  return (
    failureContext.currentTargetPath ||
    failureContext.createdPaths[0] ||
    failureContext.touchedPaths[0] ||
    ''
  )
}

function hasSufficientRecoverableFailureContext(failureContext) {
  if (!failureContext) {
    return false
  }

  return Boolean(
    failureContext.currentTargetPath ||
      failureContext.currentSubtask ||
      failureContext.currentStep ||
      failureContext.currentAction ||
      (typeof failureContext.repeatedFailureCount === 'number' &&
        failureContext.repeatedFailureCount > 0) ||
      (Array.isArray(failureContext.blockedRecoveryModes) &&
        failureContext.blockedRecoveryModes.length > 0) ||
      resolveHistoricalRecoveryTargetPath(failureContext) ||
      (Array.isArray(failureContext.createdPaths) &&
        failureContext.createdPaths.length > 0) ||
      (Array.isArray(failureContext.touchedPaths) &&
        failureContext.touchedPaths.length > 0),
  )
}

function resolveRecoverableExecutionDecisionKey(failureContext) {
  if (!failureContext) {
    return 'recover-and-continue'
  }

  if (failureContext.currentTargetPath) {
    return 'recover-single-target'
  }

  if (
    failureContext.currentSubtask ||
    failureContext.currentStep ||
    failureContext.currentAction
  ) {
    return 'recover-single-subtask'
  }

  return 'recover-and-continue'
}

function resolveHistoricalRecoveryTargetPath(failureContext) {
  if (!failureContext || !Array.isArray(failureContext.recentFailures)) {
    return ''
  }

  for (let index = failureContext.recentFailures.length - 1; index >= 0; index -= 1) {
    const recentFailure = failureContext.recentFailures[index]

    if (
      recentFailure &&
      typeof recentFailure.currentTargetPath === 'string' &&
      recentFailure.currentTargetPath.trim()
    ) {
      return recentFailure.currentTargetPath.trim()
    }
  }

  return ''
}

function collectExecutorHistoricalTargetPaths(failureContext) {
  if (!failureContext || typeof failureContext !== 'object') {
    return []
  }

  const historicalPaths = []

  if (
    failureContext.lastFailure &&
    typeof failureContext.lastFailure.currentTargetPath === 'string' &&
    failureContext.lastFailure.currentTargetPath.trim()
  ) {
    historicalPaths.push(failureContext.lastFailure.currentTargetPath.trim())
  }

  if (Array.isArray(failureContext.recentFailures)) {
    for (const recentFailure of failureContext.recentFailures) {
      if (
        recentFailure &&
        typeof recentFailure.currentTargetPath === 'string' &&
        recentFailure.currentTargetPath.trim()
      ) {
        historicalPaths.push(recentFailure.currentTargetPath.trim())
      }
    }
  }

  return summarizeUniqueExecutorStrings(historicalPaths, 6)
}

function formatExecutorContinuationAnchorLabel(continuationAnchor) {
  const normalizedContinuationAnchor =
    normalizeExecutorContinuationAnchor(continuationAnchor)

  if (!normalizedContinuationAnchor) {
    return ''
  }

  if (normalizedContinuationAnchor.targetPath && normalizedContinuationAnchor.subtask) {
    return `"${normalizedContinuationAnchor.targetPath}" (${normalizedContinuationAnchor.subtask})`
  }

  if (normalizedContinuationAnchor.targetPath) {
    return `"${normalizedContinuationAnchor.targetPath}"`
  }

  if (normalizedContinuationAnchor.subtask) {
    return `"${normalizedContinuationAnchor.subtask}"`
  }

  if (normalizedContinuationAnchor.action) {
    return `"${normalizedContinuationAnchor.action}"`
  }

  return ''
}

function buildExecutorContinuationAnchor({
  failureContext,
  recoveryTargetPath,
  failureSubtask,
  partialPaths,
}) {
  if (!failureContext || typeof failureContext !== 'object') {
    return null
  }

  const targetPath =
    (typeof failureContext.currentTargetPath === 'string' &&
    failureContext.currentTargetPath.trim()
      ? failureContext.currentTargetPath.trim()
      : '') ||
    (typeof recoveryTargetPath === 'string' && recoveryTargetPath.trim()
      ? recoveryTargetPath.trim()
      : '') ||
    (Array.isArray(partialPaths) && partialPaths[0] ? partialPaths[0] : '') ||
    resolveHistoricalRecoveryTargetPath(failureContext)
  const subtask =
    (typeof failureContext.currentSubtask === 'string' &&
    failureContext.currentSubtask.trim()
      ? failureContext.currentSubtask.trim()
      : '') ||
    (typeof failureSubtask === 'string' && failureSubtask.trim() ? failureSubtask.trim() : '')
  const action =
    typeof failureContext.currentAction === 'string' && failureContext.currentAction.trim()
      ? failureContext.currentAction.trim()
      : ''

  return normalizeExecutorContinuationAnchor({
    ...(targetPath ? { targetPath } : {}),
    ...(subtask ? { subtask } : {}),
    ...(action ? { action } : {}),
  })
}

function buildExecutorPathGuards({
  objectiveScope,
  recoveryTargetPath,
  partialPaths,
  failureContext,
  shouldBlockBroadRecovery,
}) {
  const normalizedObjectiveScope = normalizeExecutorObjectiveScope(objectiveScope)
  const normalizedPartialPaths = summarizeUniqueExecutorStrings(partialPaths, 6)
  const historicalPaths = collectExecutorHistoricalTargetPaths(failureContext)
  const prioritizedCandidates = []

  if (normalizedObjectiveScope === 'single-target' && recoveryTargetPath) {
    prioritizedCandidates.push(recoveryTargetPath)
  }

  if (normalizedObjectiveScope === 'single-subtask' || normalizedObjectiveScope === 'continuation') {
    if (recoveryTargetPath) {
      prioritizedCandidates.push(recoveryTargetPath)
    }
    prioritizedCandidates.push(...normalizedPartialPaths)
  }

  prioritizedCandidates.push(...historicalPaths)
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    prioritizedCandidates,
    normalizedObjectiveScope === 'single-target' ? 1 : 3,
  )

  if (!shouldBlockBroadRecovery && normalizedObjectiveScope === 'continuation') {
    return {
      allowedTargetPaths,
      blockedTargetPaths: [],
    }
  }

  const blockedCandidates = []

  if (normalizedObjectiveScope === 'single-target' || shouldBlockBroadRecovery) {
    blockedCandidates.push(...normalizedPartialPaths)
  }

  blockedCandidates.push(...historicalPaths)

  const allowedPathSet = new Set(allowedTargetPaths.map((entry) => entry.toLocaleLowerCase()))
  const blockedTargetPaths = summarizeUniqueExecutorStrings(
    blockedCandidates.filter((entry) => !allowedPathSet.has(entry.toLocaleLowerCase())),
    4,
  )

  return {
    allowedTargetPaths,
    blockedTargetPaths,
  }
}

function buildExecutorSuccessCriteria({
  objectiveScope,
  recoveryTargetPath,
  failureSubtask,
  failureContext,
  allowedTargetPaths,
  continuationAnchor,
}) {
  const normalizedObjectiveScope = normalizeExecutorObjectiveScope(objectiveScope)
  const successCriteria = []
  const currentAction =
    typeof failureContext?.currentAction === 'string' && failureContext.currentAction.trim()
      ? failureContext.currentAction.trim()
      : ''

  if (normalizedObjectiveScope === 'single-target' && recoveryTargetPath) {
    successCriteria.push(`Modificar solo "${recoveryTargetPath}" y dejar un cambio material guardado.`)
    if (failureSubtask || currentAction) {
      successCriteria.push(`Cerrar solo "${failureSubtask || currentAction}" sobre ese target.`)
    }
  } else if (normalizedObjectiveScope === 'single-subtask' && failureSubtask) {
    successCriteria.push(`Completar solo la subtarea "${failureSubtask}".`)
    if (allowedTargetPaths.length > 0) {
      successCriteria.push(`Limitar la subtarea a ${allowedTargetPaths.join(', ')}.`)
    }
  } else if (normalizedObjectiveScope === 'continuation') {
    const continuationLabel = formatExecutorContinuationAnchorLabel(continuationAnchor)
    if (continuationLabel) {
      successCriteria.push(`Continuar desde ${continuationLabel} sin reiniciar el bloque padre.`)
    }
    if (allowedTargetPaths.length > 0) {
      successCriteria.push(`Dejar progreso material en ${allowedTargetPaths.join(', ')}.`)
    }
  }

  if (successCriteria.length === 0 && allowedTargetPaths.length > 0) {
    successCriteria.push(`Dejar progreso material solo en ${allowedTargetPaths.join(', ')}.`)
  }

  return summarizeUniqueExecutorStrings(successCriteria, 3)
}

function buildScopedExecutorInstruction({
  objectiveScope,
  recoveryTargetPath,
  failureSubtask,
  allowedTargetPaths,
  blockedTargetPaths,
  successCriteria,
  continuationAnchor,
  shouldBlockBroadRecovery,
}) {
  const normalizedObjectiveScope = normalizeExecutorObjectiveScope(objectiveScope)
  const objectiveLabel =
    normalizedObjectiveScope === 'single-target'
      ? recoveryTargetPath
        ? `Reparar solo "${recoveryTargetPath}".`
        : 'Reparar solo un target puntual.'
      : normalizedObjectiveScope === 'single-subtask'
        ? failureSubtask
          ? `Completar solo la subtarea "${failureSubtask}".`
          : 'Completar solo una subtarea puntual.'
        : normalizedObjectiveScope === 'continuation'
          ? formatExecutorContinuationAnchorLabel(continuationAnchor)
            ? `Continuar solo desde ${formatExecutorContinuationAnchorLabel(continuationAnchor)}.`
            : 'Continuar solo desde el avance parcial disponible.'
          : 'Resolver solo el alcance operativo indicado.'
  const instructionLines = [
    objectiveLabel,
    normalizedObjectiveScope ? `objectiveScope: ${normalizedObjectiveScope}` : '',
    allowedTargetPaths.length > 0
      ? `allowedTargetPaths: ${allowedTargetPaths.join(', ')}`
      : '',
    blockedTargetPaths.length > 0
      ? `blockedTargetPaths: ${blockedTargetPaths.join(', ')}`
      : '',
    successCriteria.length > 0 ? `successCriteria: ${successCriteria.join(' | ')}` : '',
    formatExecutorContinuationAnchorLabel(continuationAnchor)
      ? `continuationAnchor: ${formatExecutorContinuationAnchorLabel(continuationAnchor)}`
      : '',
    shouldBlockBroadRecovery
      ? 'No reabrir el objetivo general ni rehacer el scaffold completo.'
      : 'No ampliar el alcance fuera de este recovery.',
  ].filter(Boolean)

  return instructionLines.join('\n')
}

function suggestFallbackRecoveryTargetPath({
  goal,
  context,
  webScaffoldSector,
  executorFailureContext,
}) {
  const combinedText = [
    goal,
    context,
    executorFailureContext?.currentSubtask,
    executorFailureContext?.currentAction,
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (combinedText.includes('styles.css') || combinedText.includes('css')) {
    return 'styles.css'
  }

  if (
    combinedText.includes('form.js') ||
    combinedText.includes('formulario') ||
    combinedText.includes('contacto') ||
    combinedText.includes('reserva') ||
    combinedText.includes('turno')
  ) {
    return 'assets/js/app.js'
  }

  if (combinedText.includes('wp starter') || combinedText.includes('wordpress')) {
    return 'wp-starter'
  }

  if (webScaffoldSector || combinedText.includes('web') || combinedText.includes('landing')) {
    return 'index.html'
  }

  return ''
}

function detectCriticalHumanBlocker(...texts) {
  const combinedText = texts
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return false
  }

  const criticalPatterns = [
    'credencial',
    'credentials',
    'api key',
    'token',
    'password',
    'contraseña',
    'contrasena',
    'costo real',
    'costos reales',
    'facturacion',
    'facturación',
    'pago real',
    'pagos reales',
    'tarjeta real',
    'publicacion irreversible',
    'publicación irreversible',
    'produccion',
    'producción',
    'deploy real',
    'dominio real',
    'dns',
    'legal',
    'compliance',
    'seguridad',
    'security',
    'borrar',
    'eliminar',
    'destructiv',
  ]

  return criticalPatterns.some((pattern) => combinedText.includes(pattern))
}

function buildRecoverableExecutionReplanDecision({
  goal,
  context,
  workspacePath,
  webScaffoldSector,
  previousExecutionResult,
  executorFailureContext,
  failedInstruction,
}) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()
  const normalizedFailureContext =
    normalizeExecutorFailureContextForBrain(executorFailureContext)
  const failedInstructionWasOversized = detectOversizedExecutorInstruction(
    failedInstruction,
    goal,
    context,
  )
  const mentionsForm =
    combinedText.includes('formulario') ||
    combinedText.includes('form ') ||
    combinedText.includes('contacto') ||
    combinedText.includes('reserva') ||
    combinedText.includes('turno')
  const mentionsEmail =
    combinedText.includes('mail') ||
    combinedText.includes('correo') ||
    combinedText.includes('email') ||
    combinedText.includes('nodemailer')
  const mentionsBranchLocal = combinedText.includes('branch')
  const mentionsCommitLocal = combinedText.includes('commit')
  const looksLikeWebOrScaffoldTask =
    Boolean(webScaffoldSector) ||
    combinedText.includes('web') ||
    combinedText.includes('landing') ||
    combinedText.includes('sitio') ||
    combinedText.includes('next') ||
    combinedText.includes('tailwind') ||
    combinedText.includes('scaffold')
  const hasSufficientFailureContext =
    hasSufficientRecoverableFailureContext(normalizedFailureContext)

  if (
    !hasSufficientFailureContext &&
    !looksLikeWebOrScaffoldTask &&
    !mentionsBranchLocal &&
    !mentionsCommitLocal
  ) {
    return null
  }

  const failureType =
    typeof normalizedFailureContext?.failureType === 'string'
      ? normalizedFailureContext.failureType
      : ''
  const repeatedFailureCount =
    typeof normalizedFailureContext?.repeatedFailureCount === 'number'
      ? normalizedFailureContext.repeatedFailureCount
      : 0
  const blockedRecoveryModes = Array.isArray(normalizedFailureContext?.blockedRecoveryModes)
    ? normalizedFailureContext.blockedRecoveryModes
    : []
  const lastFailure =
    normalizedFailureContext?.lastFailure && typeof normalizedFailureContext.lastFailure === 'object'
      ? normalizedFailureContext.lastFailure
      : null
  const failedWithoutMaterialProgress =
    failureType === 'accepted_but_idle' ||
    failureType === 'no_material_progress' ||
    failureType === 'command_stalled' ||
    failureType === 'repeated_recovery_failure'
  const shouldBlockBroadRecovery =
    blockedRecoveryModes.includes('recover-and-continue') ||
    blockedRecoveryModes.includes('broad-rebuild') ||
    blockedRecoveryModes.includes('continuation') ||
    (repeatedFailureCount >= 2 &&
      (failedWithoutMaterialProgress || normalizedFailureContext?.hasMaterialProgress !== true))
  const recoveryTargetPath =
    resolveExecutorRecoveryTargetPath(normalizedFailureContext) ||
    resolveHistoricalRecoveryTargetPath(normalizedFailureContext) ||
    (failedWithoutMaterialProgress || failedInstructionWasOversized
      ? suggestFallbackRecoveryTargetPath({
          goal,
          context,
          webScaffoldSector,
          executorFailureContext: normalizedFailureContext,
        })
      : '')
  const recoveryTargetName = recoveryTargetPath ? path.basename(recoveryTargetPath) : ''
  const recoveryTargetIsFile =
    Boolean(recoveryTargetPath) && Boolean(path.extname(recoveryTargetPath))
  const failureSubtask =
    normalizedFailureContext?.currentSubtask ||
    (typeof lastFailure?.currentSubtask === 'string' ? lastFailure.currentSubtask : '') ||
    normalizedFailureContext?.currentStep ||
    normalizedFailureContext?.currentAction ||
    (typeof lastFailure?.currentAction === 'string' ? lastFailure.currentAction : '') ||
    ''
  const touchedPaths = normalizeExecutorPathList(normalizedFailureContext?.touchedPaths)
  const createdPaths = normalizeExecutorPathList(normalizedFailureContext?.createdPaths)
  const partialPaths = summarizeUniqueExecutorStrings([...createdPaths, ...touchedPaths], 6)
  const recoverDecisionKey = recoveryTargetPath
    ? 'recover-single-target'
    : failureSubtask || shouldBlockBroadRecovery
      ? 'recover-single-subtask'
      : resolveRecoverableExecutionDecisionKey(normalizedFailureContext)
  const objectiveScope =
    recoverDecisionKey === 'recover-single-target'
      ? 'single-target'
      : recoverDecisionKey === 'recover-single-subtask'
        ? 'single-subtask'
        : 'continuation'
  const continuationAnchor = buildExecutorContinuationAnchor({
    failureContext: normalizedFailureContext,
    recoveryTargetPath,
    failureSubtask,
    partialPaths,
  })
  const { allowedTargetPaths, blockedTargetPaths } = buildExecutorPathGuards({
    objectiveScope,
    recoveryTargetPath,
    partialPaths,
    failureContext: normalizedFailureContext,
    shouldBlockBroadRecovery,
  })
  const successCriteria = buildExecutorSuccessCriteria({
    objectiveScope,
    recoveryTargetPath,
    failureSubtask,
    failureContext: normalizedFailureContext,
    allowedTargetPaths,
    continuationAnchor,
  })
  const executionScope = normalizeExecutorExecutionScope({
    objectiveScope,
    allowedTargetPaths,
    blockedTargetPaths,
    successCriteria,
    continuationAnchor,
    enforceNarrowScope:
      objectiveScope === 'single-target' ||
      blockedRecoveryModes.length > 0 ||
      repeatedFailureCount >= 2,
  })
  const microTaskTitles = recoveryTargetPath
    ? [
        'Revisar el estado parcial ya generado y conservar lo que siga siendo util.',
        ...(failedWithoutMaterialProgress ||
        failedInstructionWasOversized ||
        shouldBlockBroadRecovery
          ? ['Reducir el alcance de la recuperacion para evitar relanzar una subtarea demasiado grande.']
          : []),
        recoveryTargetIsFile
          ? `Reintentar solo el archivo "${recoveryTargetPath}" dentro del workspace, sin rehacer el scaffold completo.`
          : `Reintentar solo el bloque local "${recoveryTargetPath}" dentro del workspace, sin rehacer el scaffold completo.`,
        mentionsForm ||
        /form|contact|reserva|turno/i.test(
          [
            recoveryTargetPath,
            normalizedFailureContext?.currentAction,
            normalizedFailureContext?.currentSubtask,
          ]
            .filter(Boolean)
            .join(' '),
        )
          ? 'Validar solo el bloque del formulario o interaccion vinculada a esta recuperacion.'
          : 'Validar solo el bloque recuperado antes de continuar con otros archivos.',
        ...(mentionsCommitLocal
          ? ['Postergar el commit local hasta despues de validar este micro-bloque.']
          : []),
        ...(mentionsBranchLocal
          ? ['Postergar cualquier branch local adicional hasta despues de recuperar este bloque.']
          : []),
      ]
    : [
        'Revisar la estructura actual y dejar solo la base minima necesaria para continuar.',
        failureSubtask
          ? `Reintentar solo la subtarea "${failureSubtask}" en una unidad local mas chica y verificable.`
          : shouldBlockBroadRecovery
            ? 'Crear o ajustar solo un bloque minimo y verificable del proyecto, sin volver al scaffold padre amplio.'
            : looksLikeWebOrScaffoldTask
            ? 'Crear o ajustar un unico bloque minimo de la pagina con placeholders editables y sin integraciones finales.'
            : 'Resolver un primer bloque local acotado y verificable antes de continuar.',
        ...(mentionsForm
          ? ['Agregar o corregir solo el formulario placeholder sin conectar servicios reales.']
          : []),
        ...(mentionsEmail
          ? ['Mantener la integracion de email como placeholder o desacoplada, sin credenciales reales.']
          : []),
        ...(mentionsCommitLocal
          ? ['Postergar el commit local hasta despues de validar el bloque minimo.']
          : []),
        ...(mentionsBranchLocal
          ? ['Postergar el branch local para el final, solo si sigue haciendo falta.']
          : []),
      ]
  const recoveryInstruction = buildScopedExecutorInstruction({
    objectiveScope,
    recoveryTargetPath,
    failureSubtask,
    allowedTargetPaths: executionScope?.allowedTargetPaths || [],
    blockedTargetPaths: executionScope?.blockedTargetPaths || [],
    successCriteria: executionScope?.successCriteria || [],
    continuationAnchor: executionScope?.continuationAnchor || null,
    shouldBlockBroadRecovery:
      executionScope?.enforceNarrowScope === true ||
      failedWithoutMaterialProgress ||
      failedInstructionWasOversized ||
      shouldBlockBroadRecovery,
  })

  return buildBrainDecisionContract({
    decisionKey: recoverDecisionKey,
    strategy: looksLikeWebOrScaffoldTask ? 'web-scaffold-base' : 'executor',
    executionMode: 'executor',
    ...(webScaffoldSector
      ? {
          businessSector: webScaffoldSector.key,
          businessSectorLabel: webScaffoldSector.label,
        }
      : {}),
    reason:
      recoveryTargetPath
        ? 'La ejecucion anterior fallo en un target identificable. El Cerebro prioriza recover-single-target y reintenta solo ese punto.'
        : failureSubtask
          ? 'La ejecucion anterior fallo en una subtarea identificable. El Cerebro prioriza recover-single-subtask sin volver a abrir preguntas menores.'
          : shouldBlockBroadRecovery
            ? 'La ejecucion anterior ya fallo varias veces en un bloque parecido. El Cerebro bloquea el replan amplio repetido y fuerza una recuperacion mas chica.'
            : 'La ejecucion anterior dejo avances parciales. El Cerebro prioriza recover-and-continue para seguir desde lo ya creado.',
    tasks: microTaskTitles.map((title, index) => ({
      step: index + 1,
      title,
      ...(index === 1 && recoveryTargetPath
        ? {
            operation: recoveryTargetIsFile ? 'recover-file' : 'recover-block',
            targetPath: recoveryTargetPath,
          }
        : {}),
    })),
    requiresApproval: false,
    assumptions: [
      'Las decisiones ya resueltas no deben volver a preguntarse durante esta replanificacion.',
      'El reintento debe enfocarse en una unidad local mas chica y verificable.',
      'Si ya hubo avances parciales, no corresponde volver a lanzar una tarea global equivalente.',
      ...(shouldBlockBroadRecovery
        ? ['Ya hubo fallas equivalentes con poco o nulo progreso material; el bloque amplio queda explicitamente bloqueado.']
        : []),
      ...(executionScope?.allowedTargetPaths?.length > 0
        ? [
            `El executor debe limitarse a: ${executionScope.allowedTargetPaths.join(', ')}.`,
          ]
        : []),
      workspacePath
        ? `La ejecucion sigue dentro del workspace configurado: ${workspacePath}.`
        : 'La ejecucion sigue dentro del workspace activo del proyecto.',
    ],
    instruction: recoveryInstruction,
    executionScope,
    completed: false,
    nextExpectedAction: 'execute-plan',
  })
}

function detectExplicitApprovalPreference(goal, context) {
  const combinedText = [goal, context]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()

  if (!combinedText) {
    return null
  }

  const explicitApprovalPatterns = [
    /no\s+quiero\s+que\s+decidan\s+sol[oa]s?/i,
    /no\s+decidan\s+sol[oa]s?/i,
    /antes\s+de\s+ejecutar.*pregunt/i,
    /pregunt.*antes\s+de\s+ejecutar/i,
    /pedi(?:rme)?\s+aprobaci[oó]n\s+expl[ií]cita/i,
    /debe\s+pedirme\s+aprobaci[oó]n\s+expl[ií]cita/i,
    /necesito\s+que\s+el\s+sistema\s+me\s+lo\s+pregunte\s+antes\s+de\s+ejecutar/i,
    /esper(?:e|ar)\s+mi\s+respuesta/i,
  ]
  const explicitApprovalRequested = explicitApprovalPatterns.some((pattern) =>
    pattern.test(combinedText),
  )

  if (!explicitApprovalRequested) {
    return null
  }

  const commerceChoicePatterns = [
    'solo institucional',
    'institucional + venta online',
    'institucional o institucional + venta online',
    'institucional o tienda online',
    'venta online',
    'tienda online',
    'e-commerce',
    'ecommerce',
  ]
  const asksBusinessModelDecision = commerceChoicePatterns.some((pattern) =>
    combinedText.includes(pattern),
  )

  return {
    explicitApprovalRequested: true,
    approvalRequest: buildBrainApprovalRequest({
      decisionKey: asksBusinessModelDecision
        ? 'clarify-web-business-model'
        : 'confirm-before-execute',
      reason: asksBusinessModelDecision
        ? 'El usuario pidió explícitamente no decidir solo el alcance comercial de la web antes de ejecutar.'
        : 'El usuario pidió explícitamente una aprobación humana antes de ejecutar.',
      question: asksBusinessModelDecision
        ? `Antes de ejecutar "${goal}", necesito tu aprobación explícita sobre el alcance: ¿la web debe ser solo institucional o institucional + venta online?`
        : `Antes de ejecutar "${goal}", necesito tu aprobación explícita para continuar con el plan actual.`,
      options: asksBusinessModelDecision
        ? [
            {
              key: 'solo-institucional',
              label: 'Solo institucional',
              description: 'Prioriza presencia institucional y contacto sin venta online inicial.',
            },
            {
              key: 'institucional-y-venta-online',
              label: 'Institucional + venta online',
              description: 'Incluye desde el inicio una propuesta orientada también a comercio online.',
            },
          ]
        : [
            {
              key: 'aprobar-plan',
              label: 'Aprobar plan',
              description: 'Permite que el Cerebro continúe con la estrategia actual.',
            },
          ],
      allowFreeAnswer: true,
      allowBrainDefault: false,
      impact: asksBusinessModelDecision ? 'high' : 'medium',
      nextExpectedAction: 'user-approval',
    }),
  }
}

async function buildLocalStrategicBrainDecision({
  goal,
  context,
  workspacePath,
  iteration,
  previousExecutionResult,
  requiresApproval,
  projectState,
  userParticipationMode,
  manualReusablePreference,
  contextHubPack,
  reusablePlanningContext: providedReusablePlanningContext,
}) {
  const normalizedGoal = goal.toLocaleLowerCase()
  const normalizedPreviousExecutionResult =
    previousExecutionResult.toLocaleLowerCase()
  const plannerFeedback = parseOrchestratorPlannerFeedback(previousExecutionResult)
  const approvalAlreadyGranted = plannerFeedback?.type === 'approval-granted'
  const approvalRejected = plannerFeedback?.type === 'approval-rejected'
  const hasRecoverableExecutionError = plannerFeedback?.type === 'execution-error'
  const normalizedExecutorFailureContext = normalizeExecutorFailureContextForBrain(
    plannerFeedback?.executorFailureContext,
  )
  const explicitApprovalPreference = detectExplicitApprovalPreference(goal, context)
  const sensitiveApprovalRequest = buildSensitiveApprovalRequest({
    goal,
    context,
  })
  const fallbackApprovalRequest = buildBrainApprovalRequest({
    decisionKey: 'confirm-sensitive-execution',
    reason: 'La decision actual requiere validacion manual antes de ejecutar.',
    question: `Antes de ejecutar "${goal}", necesito una validacion humana para continuar con seguridad.`,
    allowFreeAnswer: true,
    allowBrainDefault: false,
    impact: 'high',
    nextExpectedAction: 'user-approval',
  })
  const approvalRequestForDecision =
    (Boolean(requiresApproval) || Boolean(explicitApprovalPreference)) &&
    !approvalAlreadyGranted
      ? explicitApprovalPreference?.approvalRequest ||
        sensitiveApprovalRequest ||
        fallbackApprovalRequest
      : null
  const normalizedUserParticipationMode =
    normalizeUserParticipationMode(userParticipationMode)
  const userDelegatedMissingInputs =
    normalizedUserParticipationMode === 'brain-decides-missing'
  const resolvedDecisionMap = buildResolvedDecisionMap(
    projectState,
    normalizedUserParticipationMode,
  )
  const normalizedContext = typeof context === 'string' ? context.trim() : ''
  const normalizedManualReusablePreference =
    normalizeManualReusablePreference(manualReusablePreference)
  const basePlan = buildLegacyPlannerInstruction(goal, iteration, previousExecutionResult)
  const compositeCandidateSteps = [
    ...extractStructuredCompositeSteps(normalizedContext),
    ...extractStructuredCompositeSteps(goal),
  ]
  const compositeSteps =
    compositeCandidateSteps.length >= 2 &&
    compositeCandidateSteps.every((stepText) => detectBrainAtomicOperationDescriptor(stepText))
      ? compositeCandidateSteps
      : []
  const localGoalDescriptor = detectBrainAtomicOperationDescriptor(goal)
  const analysisProposalIntent = detectAnalysisProposalPlanningIntent(goal, context)
  const materializeSafeFirstDeliveryIntent =
    detectMaterializeSafeFirstDeliveryPlanningIntent(goal, context)
  const safeFirstDeliveryIntent = detectSafeFirstDeliveryPlanningIntent(goal, context)
  const productArchitectureIntent = detectProductArchitecturePlanningIntent(
    goal,
    context,
  )
  const scopedFileEditIntent = detectScopedExistingFileEditIntent({
    goal,
    context,
    workspacePath,
  })
  const webScaffoldSector = resolveWebScaffoldSectorConfig({
    instruction: goal,
    context,
  })
  const baseWebCreativeDirection = buildWebCreativeDirection({
    goal,
    context,
    sectorConfig: webScaffoldSector || null,
  })
  const reusablePlanningContext =
    providedReusablePlanningContext && typeof providedReusablePlanningContext === 'object'
      ? providedReusablePlanningContext
      : baseWebCreativeDirection &&
          (webScaffoldSector || normalizedManualReusablePreference)
      ? await buildReusableArtifactPlanningContext({
          userDataPath: getArtifactMemoryUserDataPath(),
          goal,
          context,
          sectorConfig: webScaffoldSector,
          creativeDirection: baseWebCreativeDirection,
          manualReusablePreference: normalizedManualReusablePreference,
        })
      : null
  const looksLikeWebBaseGoal =
    !scopedFileEditIntent &&
    Boolean(webScaffoldSector) &&
    (normalizedGoal.includes('web') ||
      normalizedGoal.includes('sitio') ||
      normalizedGoal.includes('landing') ||
      normalizedGoal.includes('pagina'))
  const wantsExtendedWebScaffoldDeliverables = detectExtendedWebScaffoldDeliverables(
    goal,
    context,
  )
  const looksTooAmbiguousForSafeExecution =
    (!normalizedContext || normalizedContext.length < 12) &&
    (normalizedGoal.includes('algo') ||
      normalizedGoal.includes('alguna') ||
      normalizedGoal.includes('como sea') ||
      normalizedGoal.includes('mejoralo') ||
      normalizedGoal.includes('hacelo mejor'))
  const hasCriticalHumanBlocker = detectCriticalHumanBlocker(
    goal,
    context,
    previousExecutionResult,
  )
  const hasRecoverableExecutorFailure = detectRecoverableExecutorFailure(
    plannerFeedback?.error || '',
    previousExecutionResult,
  )
  const hasSufficientFailureContext =
    hasSufficientRecoverableFailureContext(normalizedExecutorFailureContext)
  const localWorkAlreadyDelegated =
    userDelegatedMissingInputs ||
    hasResolvedDecision(
      resolvedDecisionMap,
      'technical-defaults',
      'placeholder-content',
      'provisional-assets',
      'local-scaffold-work',
      'local-branch-work',
      'local-commit-work',
      'readme-env-example',
    )
  const approvalDecisionAlreadyResolved = hasResolvedDecision(
    resolvedDecisionMap,
    approvalRequestForDecision?.decisionKey,
  ) || hasEquivalentApprovalResolved(
    resolvedDecisionMap,
    goal,
    context,
    approvalRequestForDecision?.decisionKey,
    approvalRequestForDecision?.reason,
    approvalRequestForDecision?.question,
  )
  const approvalDecisionRejected = hasRejectedDecision(
    resolvedDecisionMap,
    approvalRequestForDecision?.decisionKey,
  ) || hasEquivalentApprovalRejected(
    resolvedDecisionMap,
    goal,
    context,
    approvalRequestForDecision?.decisionKey,
    approvalRequestForDecision?.reason,
    approvalRequestForDecision?.question,
  )
  const shouldPrioritizeRecoverableExecution =
    hasRecoverableExecutionError &&
    hasRecoverableExecutorFailure &&
    hasSufficientFailureContext &&
    userDelegatedMissingInputs &&
    localWorkAlreadyDelegated &&
    !hasCriticalHumanBlocker
  const effectiveRequiresApproval =
    !shouldPrioritizeRecoverableExecution &&
    !approvalDecisionAlreadyResolved &&
    !shouldSuppressPlaceholderAssetApproval({
      resolvedDecisionMap,
      userParticipationMode: normalizedUserParticipationMode,
      texts: [
        goal,
        context,
        approvalRequestForDecision?.decisionKey,
        approvalRequestForDecision?.reason,
        approvalRequestForDecision?.question,
      ],
    }) &&
    !(
      localWorkAlreadyDelegated &&
      !hasCriticalHumanBlocker &&
      detectMinorDelegableTopic(
        goal,
        context,
        approvalRequestForDecision?.decisionKey,
        approvalRequestForDecision?.reason,
        approvalRequestForDecision?.question,
      ) &&
      !detectRemoteOrCriticalAction(
        goal,
        context,
        approvalRequestForDecision?.reason,
        approvalRequestForDecision?.question,
      )
    ) &&
    (Boolean(requiresApproval) || Boolean(explicitApprovalPreference)) &&
    !approvalAlreadyGranted

  if (approvalRejected) {
    const rejectionDetails = [
      typeof plannerFeedback?.selectedOption === 'string' &&
      plannerFeedback.selectedOption.trim()
        ? `Opcion elegida: ${plannerFeedback.selectedOption.trim()}`
        : '',
      typeof plannerFeedback?.freeAnswer === 'string' && plannerFeedback.freeAnswer.trim()
        ? `Respuesta del usuario: ${plannerFeedback.freeAnswer.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join('. ')

    return buildBrainDecisionContract({
      decisionKey: 'approval-response-rejected',
      strategy: 'ask-user',
      executionMode: 'ask-user',
      reason:
        'El usuario rechazo la propuesta actual y el Cerebro necesita una nueva definicion antes de ejecutar.',
      question: rejectionDetails
        ? `Recibi un rechazo del usuario. ${rejectionDetails}. ¿Como queres redefinir el siguiente paso?`
        : 'Recibi un rechazo del usuario. ¿Como queres redefinir el siguiente paso antes de ejecutar?',
      tasks: [
        {
          step: 1,
          title: 'Solicitar una nueva definicion o criterio antes de continuar',
        },
      ],
      requiresApproval: false,
      assumptions: [
        'El rechazo del usuario debe volver al Cerebro antes de cualquier ejecucion.',
      ],
      instruction:
        'Solicitar una nueva definicion o criterio del usuario antes de continuar con la ejecucion.',
      completed: false,
      nextExpectedAction: 'user-clarification',
    })
  }

  if (
    approvalDecisionRejected &&
    !approvalAlreadyGranted &&
    !approvalRejected &&
    !hasCriticalHumanBlocker
  ) {
    return buildLocalAskUserBrainDecision({
      goal,
      workspacePath,
      reason:
        'Ya existe un rechazo humano vigente para esta approval o una familia equivalente. El Cerebro no debe reabrir la misma decision sin un cambio material de alcance.',
      question:
        'La ultima respuesta humana para esta accion fue rechazarla. Si queres continuar, necesito un cambio material de alcance o una alternativa distinta.',
    })
  }

  if (shouldPrioritizeRecoverableExecution) {
    const recoverableReplanDecision = buildRecoverableExecutionReplanDecision({
      goal,
      context,
      workspacePath,
      webScaffoldSector,
      previousExecutionResult: plannerFeedback?.error || previousExecutionResult,
      executorFailureContext: normalizedExecutorFailureContext,
      failedInstruction: plannerFeedback?.instruction || '',
    })

    if (recoverableReplanDecision) {
      return recoverableReplanDecision
    }
  }

  if (
    hasRecoverableExecutionError &&
    hasRecoverableExecutorFailure &&
    userDelegatedMissingInputs &&
    hasCriticalHumanBlocker
  ) {
    return buildLocalAskUserBrainDecision({
      goal,
      workspacePath,
      reason:
        'La ejecucion anterior fallo, pero aparecio un bloqueo critico nuevo y real. El Cerebro solo puede volver a preguntar por ese bloqueo antes de continuar.',
      question:
        'Aparecio un bloqueo critico nuevo tras la falla del executor. Necesito esa definicion humana para continuar sin riesgo.',
    })
  }

  if (
    materializeSafeFirstDeliveryIntent.matches &&
    !scopedFileEditIntent &&
    !localGoalDescriptor &&
    !looksLikeWebBaseGoal &&
    compositeSteps.length < 2 &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    const materializeSafeFirstDeliveryPlan = buildMaterializeSafeFirstDeliveryPlan({
      goal,
      context,
      workspacePath,
      contextHubPack,
      intent: materializeSafeFirstDeliveryIntent,
    })

    return buildBrainDecisionContract({
      decisionKey: 'materialize-safe-first-delivery-plan',
      strategy: 'materialize-safe-first-delivery-plan',
      executionMode: 'executor',
      reason:
        'El objetivo ya pide materializar una primera entrega segura y acotada, así que el Cerebro puede devolver un plan ejecutable posterior con scope estrictamente local y revisable.',
      tasks: materializeSafeFirstDeliveryPlan.tasks,
      requiresApproval: false,
      assumptions: materializeSafeFirstDeliveryPlan.assumptions,
      instruction: materializeSafeFirstDeliveryPlan.instruction,
      completed: false,
      nextExpectedAction: 'execute-plan',
      executionScope: materializeSafeFirstDeliveryPlan.executionScope,
      safeFirstDeliveryMaterialization:
        materializeSafeFirstDeliveryPlan.safeFirstDeliveryMaterialization,
    })
  }

  if (
    safeFirstDeliveryIntent.matches &&
    !scopedFileEditIntent &&
    !localGoalDescriptor &&
    !looksLikeWebBaseGoal &&
    compositeSteps.length < 2 &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    const safeFirstDeliveryPlan = buildSafeFirstDeliveryPlan({
      goal,
      context,
      contextHubPack,
      intent: safeFirstDeliveryIntent,
    })

    return buildBrainDecisionContract({
      decisionKey: 'safe-first-delivery-plan',
      strategy: 'safe-first-delivery-plan',
      executionMode: 'planner-only',
      reason:
        'El objetivo ya describe una primera fase segura, local y acotada de un producto complejo, así que conviene devolver un plan revisable antes de cualquier materialización.',
      tasks: safeFirstDeliveryPlan.tasks,
      requiresApproval: false,
      assumptions: safeFirstDeliveryPlan.assumptions,
      instruction: safeFirstDeliveryPlan.instruction,
      completed: false,
      nextExpectedAction: 'review-safe-first-delivery',
      safeFirstDeliveryPlan: safeFirstDeliveryPlan.safeFirstDeliveryPlan,
    })
  }

  if (
    productArchitectureIntent.matches &&
    !scopedFileEditIntent &&
    !localGoalDescriptor &&
    !looksLikeWebBaseGoal &&
    compositeSteps.length < 2 &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    const productArchitecturePlan = buildProductArchitecturePlan({
      goal,
      context,
      contextHubPack,
      intent: productArchitectureIntent,
    })

    return buildBrainDecisionContract({
      decisionKey: 'product-architecture-plan',
      strategy: 'product-architecture-plan',
      executionMode: 'planner-only',
      reason:
        'El objetivo describe un producto o sistema complejo con modulos, datos y riesgos suficientes como para necesitar una arquitectura previa antes de ejecutar cambios.',
      tasks: productArchitecturePlan.tasks,
      requiresApproval: false,
      assumptions: productArchitecturePlan.assumptions,
      instruction: productArchitecturePlan.instruction,
      completed: false,
      nextExpectedAction: 'review-product-architecture',
      productArchitecture: productArchitecturePlan.productArchitecture,
    })
  }

  if (
    analysisProposalIntent.matches &&
    !scopedFileEditIntent &&
    !localGoalDescriptor &&
    !looksLikeWebBaseGoal &&
    compositeSteps.length < 2 &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    const contextHubAvailable = contextHubPack?.available === true

    return buildBrainDecisionContract({
      decisionKey: 'analysis-proposal-plan',
      strategy: 'executor',
      executionMode: 'executor',
      reason:
        'El objetivo pide analizar o proponer una mejora sin ejecución material en esta iteración, así que el Cerebro debe devolver un plan concreto y seguro en vez de una orden genérica.',
      tasks: [
        {
          step: 1,
          title: contextHubAvailable
            ? 'Revisar el objetivo, el contexto disponible y el estado de MEMORIA externa ya consultada antes de planificar.'
            : 'Revisar el objetivo y el contexto disponible, contemplando MEMORIA externa solo como apoyo opcional si aparece disponible.',
        },
        {
          step: 2,
          title:
            'Identificar el punto débil del flujo planificador → ejecutor que vuelve demasiado genérica la instrucción generada.',
        },
        {
          step: 3,
          title:
            'Proponer una mejora mínima, reversible y acotada para distinguir mejor entre análisis, propuesta y ejecución material.',
        },
        {
          step: 4,
          title:
            'Definir explícitamente qué no se debe tocar en esta iteración: executor, bridge, reusable core, materializationPlan y UI de cierre.',
        },
        {
          step: 5,
          title:
            'Devolver una recomendación técnica breve en español argentino con próximo paso sugerido, sin crear archivos ni ejecutar cambios todavía.',
        },
      ],
      requiresApproval: false,
      assumptions: [
        'Esta iteración es de análisis y propuesta; no corresponde materializar cambios ni crear archivos.',
        'MEMORIA externa puede aportar contexto auxiliar, pero el plan no debe depender de ella para ser útil.',
        'La mejora propuesta debe ser mínima, reversible y compatible con los flujos existentes de web-scaffold-base y fast-local.',
      ],
      instruction: buildAnalysisProposalInstruction({
        goal,
        contextHubPack,
      }),
      completed: false,
      nextExpectedAction: 'review-plan',
    })
  }

  if (
    scopedFileEditIntent &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    return buildBrainDecisionContract({
      decisionKey: 'edit-single-existing-file',
      strategy: 'executor',
      executionMode: 'executor',
      ...(webScaffoldSector
        ? {
            businessSector: webScaffoldSector.key,
            businessSectorLabel: webScaffoldSector.label,
          }
        : {}),
      reason:
        'El objetivo pide una edicion puntual sobre un archivo existente y explicita que no hay que crear scaffold ni tocar otros assets.',
      tasks: scopedFileEditIntent.tasks,
      requiresApproval: effectiveRequiresApproval,
      approvalRequest: approvalRequestForDecision,
      assumptions: scopedFileEditIntent.assumptions,
      instruction: scopedFileEditIntent.instruction,
      executionScope: scopedFileEditIntent.executionScope,
      completed: false,
      nextExpectedAction: effectiveRequiresApproval ? 'user-approval' : 'execute-plan',
    })
  }

  if (
    looksLikeWebBaseGoal &&
    !wantsExtendedWebScaffoldDeliverables &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    const webDecision = buildLocalWebScaffoldBaseBrainDecision({
      goal,
      context,
      workspacePath,
      sectorConfig: webScaffoldSector,
      reusablePlanningContext,
    })

    return buildBrainDecisionContract({
      ...webDecision,
      requiresApproval: effectiveRequiresApproval,
      approvalRequest: approvalRequestForDecision,
      reason: hasRecoverableExecutionError
        ? 'La ejecución anterior falló y el Cerebro replanifica el scaffold web dentro de la misma estrategia.'
        : approvalAlreadyGranted
          ? 'Ya existe una aprobación registrada; el Cerebro puede seguir con el scaffold web sin volver a abrir ese stop.'
          : userDelegatedMissingInputs
            ? 'El usuario delegó los faltantes menores, así que el Cerebro puede avanzar con defaults razonables dentro de la estrategia web.'
          : webDecision.reason,
    })
  }

  if (
    compositeSteps.length >= 2 &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    return buildBrainDecisionContract({
      decisionKey: 'fast-composite',
      strategy: 'fast-composite',
      executionMode: 'local-fast-composite',
      reason: hasRecoverableExecutionError
        ? 'La ejecución anterior falló y el Cerebro replanifica la misma secuencia local para corregir o reintentar.'
        : approvalAlreadyGranted
          ? 'Ya existe una aprobación registrada y el Cerebro puede continuar con la secuencia local sin volver a pedirla.'
          : 'El pedido ya viene descompuesto en varios pasos locales claros, así que se puede planificar como una secuencia compuesta.',
      tasks: compositeSteps.map((stepText, index) => {
        const stepDescriptor = detectBrainAtomicOperationDescriptor(stepText)

        return {
          step: index + 1,
          title: stepText,
          operation: stepDescriptor?.operation || 'executor',
          targetPath: stepDescriptor?.targetPath || '',
        }
      }),
      requiresApproval: effectiveRequiresApproval,
      approvalRequest: approvalRequestForDecision,
      assumptions: [
        'Cada paso debe seguir siendo una operación local explícita y determinística.',
        userDelegatedMissingInputs
          ? 'Si faltan detalles menores, el Cerebro debe asumir defaults razonables sin volver a frenar.'
          : 'Si hace falta una definición adicional relevante, el Cerebro puede volver a consultarla.',
      ],
      instruction:
        'Ejecutar la secuencia local indicada paso a paso dentro del workspace y devolver un resumen breve del resultado de cada paso.',
      completed: false,
      nextExpectedAction: effectiveRequiresApproval ? 'user-approval' : 'execute-plan',
    })
  }

  if (
    localGoalDescriptor &&
    (!previousExecutionResult ||
      iteration === 1 ||
      approvalAlreadyGranted ||
      hasRecoverableExecutionError)
  ) {
    return buildBrainDecisionContract({
      decisionKey: 'fast-local',
      strategy: 'fast-local',
      executionMode: 'local-fast',
      reason: hasRecoverableExecutionError
        ? 'La ejecución anterior falló y el Cerebro replanifica la misma operación puntual para corregirla o reintentarla.'
        : approvalAlreadyGranted
          ? 'Ya existe una aprobación registrada y el Cerebro puede seguir con la operación puntual sin volver a pedirla.'
          : 'El objetivo parece una operación puntual sobre archivo o carpeta, apta para la capa local rápida.',
      tasks: [
        {
          step: 1,
          title: basePlan.instruction,
          operation: localGoalDescriptor.operation,
          targetPath: localGoalDescriptor.targetPath,
        },
      ],
      requiresApproval: effectiveRequiresApproval,
      approvalRequest: approvalRequestForDecision,
      assumptions: [
        'La operación debe poder resolverse íntegramente dentro del workspace.',
        userDelegatedMissingInputs
          ? 'Si faltan detalles menores, el Cerebro debe resolverlos con defaults razonables.'
          : 'Si aparece una ambigüedad relevante, el Cerebro puede pedir una aclaración breve.',
      ],
      instruction: basePlan.instruction,
      completed: basePlan.completed === true,
      nextExpectedAction: effectiveRequiresApproval ? 'user-approval' : 'execute-plan',
    })
  }

  if (
    looksTooAmbiguousForSafeExecution &&
    (!previousExecutionResult || iteration === 1) &&
    (!userDelegatedMissingInputs || hasCriticalHumanBlocker)
  ) {
    return buildLocalAskUserBrainDecision({
      goal,
      workspacePath,
      ...(hasCriticalHumanBlocker
        ? {
            reason:
              'El Cerebro solo puede pedir aclaracion porque detecto un bloqueo critico real antes de ejecutar.',
            question:
              'Necesito una aclaracion humana por un bloqueo critico real antes de continuar con la ejecucion.',
          }
        : {}),
    })
  }

  const reusableExecutionInstruction = buildReusableExecutionInstruction({
    goal,
    context,
    sectorConfig: webScaffoldSector,
    creativeDirection:
      reusablePlanningContext?.creativeDirection || baseWebCreativeDirection,
    reusablePlanningContext,
  })

  return buildBrainDecisionContract({
    decisionKey: 'executor-general',
    strategy: 'executor',
    executionMode: 'executor',
    ...(webScaffoldSector
      ? {
          businessSector: webScaffoldSector.key,
          businessSectorLabel: webScaffoldSector.label,
        }
      : {}),
    reason:
      hasRecoverableExecutionError
        ? 'La ejecución anterior falló y el Cerebro decidió replanificar antes de volver a ejecutar.'
        : normalizedPreviousExecutionResult.includes('validación completa') ||
            normalizedPreviousExecutionResult.includes('validacion completa')
        ? 'La ejecución previa ya marcó cierre del objetivo; solo resta confirmar el resultado.'
        : 'El objetivo requiere una resolución general fuera de la capa local rápida, así que sigue el flujo actual con executor.',
    tasks:
      looksLikeWebBaseGoal && previousExecutionResult
        ? [
            {
              step: 1,
              title: 'Validar el scaffold web anterior y completar la siguiente iteración necesaria',
            },
            ...(hasActiveReusablePlanningDecision(reusablePlanningContext)
              ? [
                  {
                    step: 2,
                    title:
                      `Conservar la referencia reusable en modo ${reusablePlanningContext.reuseMode} usando ${reusablePlanningContext.reusedArtifactIds.join(', ')}.`,
                  },
                  {
                    step: 3,
                    title:
                      reusablePlanningContext.reuseMode === 'reuse-style'
                        ? 'Mantener paleta, tipografías y tono; rediseñar estructura, hero y jerarquía visual.'
                        : reusablePlanningContext.reuseMode === 'reuse-structure'
                          ? 'Mantener estructura y ritmo de secciones; actualizar estilo, tono y señales visuales.'
                          : 'Mantener la base reusable y adaptarla con foco en hero, jerarquía y resultado final.',
                  },
                ]
              : []),
          ]
        : [
            ...(hasActiveReusablePlanningDecision(reusablePlanningContext)
              ? [
                  {
                    step: 1,
                    title:
                      `Tomar como referencia reusable ${reusablePlanningContext.reusedArtifactIds.join(', ')} en modo ${reusablePlanningContext.reuseMode}.`,
                  },
                  {
                    step: 2,
                    title:
                      reusablePlanningContext.reuseMode === 'reuse-style'
                        ? 'Conservar estilo base y rediseñar estructura, hero y recorrido visual.'
                        : reusablePlanningContext.reuseMode === 'reuse-structure'
                          ? 'Conservar estructura base y redefinir estilo, tono y tratamiento visual.'
                          : reusablePlanningContext.reuseMode === 'reuse-style-and-structure'
                            ? 'Conservar estilo y estructura base, ajustando mensaje, hero y CTA al nuevo objetivo.'
                            : basePlan.instruction,
                  },
                  {
                    step: 3,
                    title:
                      'Entregar una propuesta concreta, editable y lista para ejecutar dentro del workspace.',
                  },
                ]
              : [
                  {
                    step: 1,
                    title: basePlan.instruction,
                  },
                ]),
          ],
    requiresApproval: effectiveRequiresApproval,
    approvalRequest: approvalRequestForDecision,
    assumptions: [
      'Si el objetivo no entra con claridad en una ruta local, conviene preservar el flujo actual con executor.',
      userDelegatedMissingInputs
        ? 'El usuario pidió que el Cerebro resuelva faltantes menores por default y solo frene por bloqueos realmente críticos.'
        : 'Si falta una definición importante y el usuario piensa aportar, el Cerebro puede volver a consultarla.',
      ...(hasActiveReusablePlanningDecision(reusablePlanningContext)
        ? [
            `La planificación debe conservar la referencia reusable en modo ${reusablePlanningContext.reuseMode} usando ${reusablePlanningContext.reusedArtifactIds.join(', ')}.`,
          ]
        : []),
    ],
    instruction: hasRecoverableExecutionError
      ? reusableExecutionInstruction
        ? `${reusableExecutionInstruction} Corregir además el error anterior: ${plannerFeedback?.error || previousExecutionResult}.`
        : `Corregir el error anterior y resolver el objetivo indicado: ${goal}. Error previo: ${plannerFeedback?.error || previousExecutionResult}${buildReusableInstructionSuffix(
            reusablePlanningContext,
          )}`
      : reusableExecutionInstruction ||
        `${basePlan.instruction}${buildReusableInstructionSuffix(
          reusablePlanningContext,
        )}`,
    completed: basePlan.completed === true,
    nextExpectedAction: effectiveRequiresApproval ? 'user-approval' : 'execute-plan',
    ...(reusablePlanningContext && typeof reusablePlanningContext === 'object'
      ? {
          reusableArtifactLookup: reusablePlanningContext.reusableArtifactLookup,
          reusableArtifactsFound: reusablePlanningContext.reusableArtifactsFound,
          reuseDecision: reusablePlanningContext.reuseDecision,
          reuseReason: reusablePlanningContext.reuseReason,
          reusedArtifactIds: reusablePlanningContext.reusedArtifactIds,
          reuseMode: reusablePlanningContext.reuseMode,
        }
      : {}),
  })
}

function normalizeBrainProviderId(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  if (normalizedValue === 'openai' || normalizedValue === 'local-rules') {
    return normalizedValue
  }

  return ''
}

function normalizeBrainCostMode(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'balanced'
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  if (
    normalizedValue === 'cheap' ||
    normalizedValue === 'balanced' ||
    normalizedValue === 'smart' ||
    normalizedValue === 'max-quality'
  ) {
    return normalizedValue
  }

  if (
    normalizedValue === 'max_quality' ||
    normalizedValue === 'maxquality' ||
    normalizedValue === 'quality'
  ) {
    return 'max-quality'
  }

  if (
    normalizedValue === 'low' ||
    normalizedValue === 'local-first' ||
    normalizedValue === 'local_first' ||
    normalizedValue === 'economico' ||
    normalizedValue === 'económico' ||
    normalizedValue === 'barato'
  ) {
    return 'cheap'
  }

  return 'balanced'
}

function classifyBrainRoutingLevel(score) {
  if (score >= 4) {
    return 'high'
  }

  if (score >= 2) {
    return 'medium'
  }

  return 'low'
}

// El routing usa una heurística local estable para no depender de un único
// provider: mide complejidad, ambigüedad, riesgo e impacto y luego la política
// de costo decide si conviene arrancar por OpenAI o por reglas locales.
function buildBrainRoutingAssessment(input) {
  const normalizedGoal = input.goal.toLocaleLowerCase()
  const normalizedContext =
    typeof input.context === 'string' ? input.context.trim().toLocaleLowerCase() : ''
  const plannerFeedback = parseOrchestratorPlannerFeedback(
    input.previousExecutionResult || '',
  )
  const explicitApprovalPreference = detectExplicitApprovalPreference(
    input.goal,
    input.context,
  )
  const scopedFileEditIntent = detectScopedExistingFileEditIntent({
    goal: input.goal,
    context: input.context,
    workspacePath: input.workspacePath,
  })
  const localGoalDescriptor =
    detectBrainAtomicOperationDescriptor(input.goal) ||
    (scopedFileEditIntent
      ? {
          operation: 'edit-file',
          targetPath: scopedFileEditIntent.relativeTargetPath,
        }
      : null)
  const compositeCandidateSteps = [
    ...extractStructuredCompositeSteps(normalizedContext),
    ...extractStructuredCompositeSteps(input.goal),
  ]
  const isDeterministicComposite =
    compositeCandidateSteps.length >= 2 &&
    compositeCandidateSteps.every((stepText) =>
      detectBrainAtomicOperationDescriptor(stepText),
    )
  const webScaffoldSector = resolveWebScaffoldSectorConfig({
    instruction: input.goal,
    context: input.context,
  })
  const looksLikeWebBaseGoal =
    !scopedFileEditIntent &&
    Boolean(webScaffoldSector) &&
    (normalizedGoal.includes('web') ||
      normalizedGoal.includes('sitio') ||
      normalizedGoal.includes('landing') ||
      normalizedGoal.includes('pagina'))
  const looksLikeCreativeOrOpenEndedGoal =
    (!scopedFileEditIntent && looksLikeWebBaseGoal) ||
    normalizedGoal.includes('base') ||
    (!scopedFileEditIntent && normalizedGoal.includes('experiencia')) ||
    normalizedGoal.includes('diseño') ||
    normalizedGoal.includes('diseno') ||
    (!scopedFileEditIntent && normalizedGoal.includes('original')) ||
    (!scopedFileEditIntent && normalizedGoal.includes('estructura')) ||
    normalizedGoal.includes('marca') ||
    (!scopedFileEditIntent && normalizedContext.length > 140)
  const hasRecoverableExecutionError = plannerFeedback?.type === 'execution-error'
  const isDeterministicLocal =
    Boolean(localGoalDescriptor) || Boolean(scopedFileEditIntent) || isDeterministicComposite
  const combinedText = `${normalizedGoal} ${normalizedContext}`.trim()
  const mentionsCriticalSurface =
    combinedText.includes('deploy') ||
    combinedText.includes('produccion') ||
    combinedText.includes('producción') ||
    combinedText.includes('repo publico') ||
    combinedText.includes('repo público') ||
    combinedText.includes('github pages') ||
    combinedText.includes('vercel') ||
    combinedText.includes('auth') ||
    combinedText.includes('borrar') ||
    combinedText.includes('eliminar') ||
    combinedText.includes('migrar')
  const asksForBrainJudgement =
    combinedText.includes('mejor') ||
    combinedText.includes('defini') ||
    combinedText.includes('definí') ||
    combinedText.includes('propon') ||
    combinedText.includes('elegi') ||
    combinedText.includes('elegí') ||
    combinedText.includes('decidi') ||
    combinedText.includes('decidí')

  const complexityScore =
    (hasRecoverableExecutionError ? 3 : 0) +
    (looksLikeCreativeOrOpenEndedGoal ? 2 : 0) +
    (isDeterministicComposite ? 1 : 0) +
    (!localGoalDescriptor && !isDeterministicComposite ? 1 : 0) +
    (normalizedContext.length > 240 ? 1 : 0) +
    (Number.isInteger(input.iteration) && input.iteration > 1 ? 1 : 0)
  const ambiguityScore =
    (looksLikeCreativeOrOpenEndedGoal ? 2 : 0) +
    (asksForBrainJudgement ? 1 : 0) +
    (explicitApprovalPreference ? 1 : 0) +
    (!localGoalDescriptor && !isDeterministicComposite ? 1 : 0)
  const riskScore =
    (input.requiresApproval === true ? 2 : 0) +
    (explicitApprovalPreference ? 1 : 0) +
    (mentionsCriticalSurface ? 2 : 0) +
    (hasRecoverableExecutionError ? 3 : 0)
  const impactScore =
    (input.requiresApproval === true ? 2 : 0) +
    (mentionsCriticalSurface ? 2 : 0) +
    (looksLikeWebBaseGoal ? 1 : 0) +
    (compositeCandidateSteps.length >= 3 ? 1 : 0) +
    (normalizedContext.length > 240 ? 1 : 0)

  const complexity = classifyBrainRoutingLevel(complexityScore)
  const ambiguity = classifyBrainRoutingLevel(ambiguityScore)
  const risk = classifyBrainRoutingLevel(riskScore)
  const impact = classifyBrainRoutingLevel(impactScore)
  const localRulesFit =
    isDeterministicLocal &&
    complexity === 'low' &&
    ambiguity === 'low' &&
    risk === 'low' &&
    impact !== 'high' &&
    !looksLikeCreativeOrOpenEndedGoal &&
    !hasRecoverableExecutionError

  return {
    complexity,
    ambiguity,
    risk,
    impact,
    explicitApprovalPreference,
    scopedFileEditIntent,
    localGoalDescriptor,
    compositeCandidateSteps,
    isDeterministicComposite,
    webScaffoldSector,
    looksLikeWebBaseGoal,
    looksLikeCreativeOrOpenEndedGoal,
    hasRecoverableExecutionError,
    isDeterministicLocal,
    localRulesFit,
  }
}

function buildBrainRoutingDecisionDetails({
  selectedProvider,
  fallbackProvider,
  reason,
  confidence,
  routingMode,
  problemNature,
  costMode,
  assessment,
}) {
  return {
    selectedProvider,
    fallbackProvider,
    reason,
    confidence,
    routingMode,
    problemNature,
    costMode,
    complexity: assessment.complexity,
    ambiguity: assessment.ambiguity,
    risk: assessment.risk,
    impact: assessment.impact,
  }
}

function buildStrategicBrainProviderDescriptor(provider) {
  if (!provider || typeof provider !== 'object') {
    return null
  }

  return {
    id: provider.providerId,
    kind: provider.providerKind,
    label: provider.providerLabel,
  }
}

function normalizeManualReusablePreference(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const artifactId =
    typeof value.artifactId === 'string' ? value.artifactId.trim() : ''
  const reuseMode =
    typeof value.reuseMode === 'string' ? value.reuseMode.trim() : ''
  const allowedModes = new Set([
    'none',
    'inspiration-only',
    'reuse-style',
    'reuse-structure',
    'reuse-style-and-structure',
  ])

  if (!allowedModes.has(reuseMode)) {
    return null
  }

  return {
    artifactId,
    reuseMode,
    source:
      typeof value.source === 'string' && value.source.trim()
        ? value.source.trim()
        : 'ui-manual',
  }
}

function buildStrategicBrainInput(input) {
  return {
    goal: typeof input?.goal === 'string' ? input.goal : '',
    context: typeof input?.context === 'string' ? input.context : '',
    workspacePath:
      typeof input?.workspacePath === 'string' ? input.workspacePath : '',
    iteration: Number.isInteger(input?.iteration) ? input.iteration : 1,
    previousExecutionResult:
      typeof input?.previousExecutionResult === 'string'
        ? input.previousExecutionResult
        : '',
    requiresApproval: input?.requiresApproval === true,
    projectState:
      input?.projectState && typeof input.projectState === 'object'
        ? input.projectState
        : null,
    autonomyLevel:
      typeof input?.autonomyLevel === 'string' ? input.autonomyLevel : 'balanced',
    costMode: normalizeBrainCostMode(input?.costMode),
    userParticipationMode: normalizeUserParticipationMode(
      input?.userParticipationMode,
    ),
    routingHints:
      input?.routingHints && typeof input.routingHints === 'object'
        ? input.routingHints
        : null,
    manualReusablePreference: normalizeManualReusablePreference(
      input?.manualReusablePreference,
    ),
    contextHubPack:
      input?.contextHubPack && typeof input.contextHubPack === 'object'
        ? input.contextHubPack
        : buildUnavailableContextHubPack('unavailable'),
    reusablePlanningContext:
      input?.reusablePlanningContext &&
      typeof input.reusablePlanningContext === 'object'
        ? input.reusablePlanningContext
        : null,
  }
}

function buildBrainRoutingDecision(input) {
  const assessment = buildBrainRoutingAssessment(input)
  const forcedProvider =
    normalizeBrainProviderId(input.routingHints?.forceProvider) ||
    normalizeBrainProviderId(process.env.AI_ORCHESTRATOR_BRAIN_PROVIDER)
  const preferredProviderHint = normalizeBrainProviderId(
    input.routingHints?.preferProvider,
  )
  const normalizedCostMode = normalizeBrainCostMode(input.costMode)

  if (forcedProvider) {
    return buildBrainRoutingDecisionDetails({
      selectedProvider: forcedProvider,
      fallbackProvider: forcedProvider === 'openai' ? 'local-rules' : 'openai',
      reason:
        'El routing del Cerebro fue forzado explícitamente por configuración o hints.',
      confidence: 1,
      routingMode: 'forced',
      problemNature: forcedProvider === 'openai' ? 'forced-openai' : 'forced-local',
      costMode: normalizedCostMode,
      assessment,
    })
  }

  if (preferredProviderHint) {
    return buildBrainRoutingDecisionDetails({
      selectedProvider: preferredProviderHint,
      fallbackProvider:
        preferredProviderHint === 'openai' ? 'local-rules' : 'openai',
      reason:
        'El routing del Cerebro respetó una preferencia explícita del Mensajero.',
      confidence: 0.9,
      routingMode: 'hinted',
      problemNature:
        preferredProviderHint === 'openai' ? 'hinted-openai' : 'hinted-local',
      costMode: normalizedCostMode,
      assessment,
    })
  }

  if (normalizedCostMode === 'cheap') {
    if (
      assessment.isDeterministicLocal &&
      assessment.risk === 'low' &&
      assessment.ambiguity === 'low' &&
      !assessment.looksLikeCreativeOrOpenEndedGoal &&
      !assessment.hasRecoverableExecutionError
    ) {
      return buildBrainRoutingDecisionDetails({
        selectedProvider: 'local-rules',
        fallbackProvider: 'openai',
        reason:
          'El modo cheap prioriza costo bajo en tareas cerradas: la consigna es simple, determinística y de bajo riesgo.',
        confidence: 0.92,
        routingMode: 'cheap-policy',
        problemNature: assessment.isDeterministicComposite
          ? 'cheap-deterministic-composite'
          : 'cheap-deterministic-atomic',
        costMode: normalizedCostMode,
        assessment,
      })
    }

    return buildBrainRoutingDecisionDetails({
      selectedProvider: 'openai',
      fallbackProvider: 'local-rules',
      reason:
        'Aunque el modo cheap cuida costo, esta tarea tiene demasiada complejidad, ambigüedad, riesgo o impacto para cerrarla solo con reglas locales.',
      confidence:
        assessment.hasRecoverableExecutionError || assessment.risk === 'high'
          ? 0.95
          : 0.87,
      routingMode: 'cheap-policy',
      problemNature: assessment.hasRecoverableExecutionError
        ? 'cheap-recoverable-error'
        : assessment.looksLikeWebBaseGoal
          ? 'cheap-creative-web'
          : 'cheap-escalated-open-ended',
      costMode: normalizedCostMode,
      assessment,
    })
  }

  if (normalizedCostMode === 'balanced') {
    if (assessment.localRulesFit) {
      return buildBrainRoutingDecisionDetails({
        selectedProvider: 'local-rules',
        fallbackProvider: 'openai',
        reason:
          'El modo balanced reserva OpenAI para los casos menos cerrados y deja los pedidos triviales en local-rules.',
        confidence: 0.93,
        routingMode: 'balanced-policy',
        problemNature: assessment.isDeterministicComposite
          ? 'balanced-deterministic-composite'
          : 'balanced-deterministic-atomic',
        costMode: normalizedCostMode,
        assessment,
      })
    }

    return buildBrainRoutingDecisionDetails({
      selectedProvider: 'openai',
      fallbackProvider: 'local-rules',
      reason: assessment.hasRecoverableExecutionError
        ? 'El modo balanced detectó replanificación tras un error, así que conviene usar OpenAI como Cerebro principal.'
        : assessment.explicitApprovalPreference
          ? 'El modo balanced detectó una decisión sensible o ambigua y prioriza OpenAI con fallback local.'
          : assessment.looksLikeCreativeOrOpenEndedGoal
            ? 'El modo balanced detectó una tarea abierta, creativa o estructural y la manda a OpenAI.'
            : 'El pedido no es lo bastante cerrado para resolverlo solo con reglas locales en modo balanced.',
      confidence:
        assessment.hasRecoverableExecutionError ||
        assessment.explicitApprovalPreference
          ? 0.94
          : 0.88,
      routingMode: 'balanced-policy',
      problemNature: assessment.hasRecoverableExecutionError
        ? 'balanced-recoverable-error'
        : assessment.looksLikeWebBaseGoal
          ? 'balanced-creative-web'
          : 'balanced-open-ended',
      costMode: normalizedCostMode,
      assessment,
    })
  }

  if (normalizedCostMode === 'max-quality') {
    if (
      assessment.localRulesFit &&
      assessment.impact === 'low' &&
      !assessment.explicitApprovalPreference
    ) {
      return buildBrainRoutingDecisionDetails({
        selectedProvider: 'local-rules',
        fallbackProvider: 'openai',
        reason:
          'Incluso en max-quality, el pedido es tan trivial y acotado que local-rules alcanza sin sacrificar calidad material.',
        confidence: 0.8,
        routingMode: 'max-quality-policy',
        problemNature: 'max-quality-trivial-local',
        costMode: normalizedCostMode,
        assessment,
      })
    }

    return buildBrainRoutingDecisionDetails({
      selectedProvider: 'openai',
      fallbackProvider: 'local-rules',
      reason:
        'El modo max-quality prioriza OpenAI casi siempre para maximizar criterio y adaptabilidad del Cerebro.',
      confidence: 0.97,
      routingMode: 'max-quality-policy',
      problemNature: assessment.hasRecoverableExecutionError
        ? 'max-quality-recoverable-error'
        : assessment.looksLikeWebBaseGoal
          ? 'max-quality-creative-web'
          : 'max-quality-open-ended',
      costMode: normalizedCostMode,
      assessment,
    })
  }

  if (
    assessment.isDeterministicLocal &&
    assessment.risk === 'low' &&
    assessment.ambiguity === 'low' &&
    assessment.impact !== 'high' &&
    !assessment.looksLikeCreativeOrOpenEndedGoal &&
    !assessment.hasRecoverableExecutionError
  ) {
    return buildBrainRoutingDecisionDetails({
      selectedProvider: 'local-rules',
      fallbackProvider: 'openai',
      reason:
        'El modo smart detectó una tarea concreta, de bajo riesgo y bajo costo cognitivo, así que arranca por local-rules y deja OpenAI como escalamiento.',
      confidence: assessment.localRulesFit ? 0.95 : 0.89,
      routingMode: 'smart-policy',
      problemNature: assessment.isDeterministicComposite
        ? 'smart-deterministic-composite'
        : 'smart-deterministic-atomic',
      costMode: normalizedCostMode,
      assessment,
    })
  }

  return buildBrainRoutingDecisionDetails({
    selectedProvider: 'openai',
    fallbackProvider: 'local-rules',
    reason: assessment.hasRecoverableExecutionError
      ? 'El modo smart detectó replanificación o recovery complejo, así que escala a OpenAI con fallback local.'
      : assessment.looksLikeCreativeOrOpenEndedGoal
        ? 'El modo smart detectó una tarea creativa, abierta o estructural y la deriva a OpenAI.'
        : 'El modo smart detectó suficiente ambigüedad, riesgo o impacto como para no cerrar el pedido solo con reglas locales.',
    confidence:
      assessment.hasRecoverableExecutionError || assessment.risk === 'high'
        ? 0.96
        : 0.9,
    routingMode: 'smart-policy',
    problemNature: assessment.hasRecoverableExecutionError
      ? 'smart-recoverable-error'
      : assessment.looksLikeWebBaseGoal
        ? 'smart-creative-web'
        : 'smart-open-ended',
    costMode: normalizedCostMode,
    assessment,
  })
}

function getOpenAIBrainConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() || '',
    model: process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_MODEL?.trim() || 'gpt-5',
    baseUrl:
      process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_BASE_URL?.trim() ||
      'https://api.openai.com/v1/responses',
    timeoutMs: Math.max(
      5000,
      Number.parseInt(
        process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_TIMEOUT_MS || '90000',
        10,
      ) || 90000,
    ),
    organization:
      process.env.OPENAI_ORGANIZATION?.trim() ||
      process.env.OPENAI_ORG_ID?.trim() ||
      '',
    project: process.env.OPENAI_PROJECT?.trim() || '',
    reasoningEffort:
      process.env.AI_ORCHESTRATOR_BRAIN_OPENAI_REASONING?.trim() || 'medium',
  }
}

function buildOpenAIBrainSystemPrompt() {
  return `
Sos el Cerebro estratégico del ORQUESTADOR DE IA LOCAL.

Roles:
- Mensajero: coordina flujo, approvals, errores, trazabilidad y estado.
- Cerebro: interpreta, decide, redecide y propone planes.
- Trabajador: executor / Codex que ejecuta cambios concretos.

Tu tarea es devolver una decision estructurada y operativa.

Reglas:
- Elegí entre estrategias compatibles con el sistema: fast-local, fast-composite, executor, web-scaffold-base, product-architecture-plan, safe-first-delivery-plan, materialize-safe-first-delivery-plan, ask-user.
- Usá web-scaffold-base para webs institucionales o creativas cuando corresponda.
- Usá product-architecture-plan cuando el objetivo implique un sistema o producto complejo (por ejemplo ecommerce, CRM, ERP, marketplace, SaaS o plataforma con usuarios, roles, backoffice, datos e integraciones) y todavía haga falta definir arquitectura antes de ejecutar.
- Si devolvés product-architecture-plan, usá executionMode="planner-only", nextExpectedAction="review-product-architecture", requiresApproval=false y describí fases, riesgos, integraciones y primera entrega segura sin crear archivos.
- Usá safe-first-delivery-plan cuando el objetivo ya pida una primera entrega segura o una primera fase local/mock derivada de una arquitectura previa; en ese caso usá executionMode="planner-only", nextExpectedAction="review-safe-first-delivery", requiresApproval=false y dejá explícitamente fuera pagos reales, credenciales, webhooks, deploy, migraciones, auth real, base de datos real e integraciones sensibles.
- Usá materialize-safe-first-delivery-plan cuando el objetivo ya pida materializar esa primera entrega segura con archivos locales acotados; en ese caso usá executionMode="executor", nextExpectedAction="execute-plan", requiresApproval=false, fijá una carpeta destino segura dentro del workspace y limitá el alcance a archivos mock locales sin pagos reales, credenciales, webhooks, deploy, migraciones, auth real, base de datos real ni integraciones externas reales.
- Si hace falta una decisión humana real, devolvé requiresApproval=true y un approvalRequest estructurado.
- Si llega feedback de error recuperable, replanificá.
- Si el pedido es simple y determinístico, podés devolver fast-local o fast-composite.
- Si userParticipationMode es "brain-decides-missing", asumí defaults razonables para faltantes menores y no abras approvals por colores, tipografias, placeholders, assets provisionales, foco visual, contenido editable o detalles menores de stack.
- Si userParticipationMode es "brain-decides-missing", solo frená por credenciales, costos reales, publicaciones irreversibles, acciones destructivas, temas legales/seguridad o bloqueos realmente críticos.
- Si manualReusablePreference trae artifactId y reuseMode, esa preferencia manual manda sobre el lookup automático y debe verse reflejada en reusableArtifactLookup, reusableArtifactsFound, reuseDecision, reuseMode, reusedArtifactIds e instruction.
- Si reusablePlanningContext.reuseDecision es true, la instruction final no puede quedar genérica: debe mencionar explícitamente la reutilización o la referencia reusable seleccionada.
- Si projectState.resolvedDecisions ya incluye una decision resuelta o delegada, no la vuelvas a preguntar salvo que aparezca un bloqueo nuevo y realmente crítico.
- Si hubo execution-error o timeout del executor, conservá decisiones previas y replanificá en subtareas más chicas antes de volver a pedir un approval.
- Si plannerFeedback.executorFailureContext trae currentTargetPath, currentAction, currentSubtask o archivos parciales, usalos para proponer una micro-subtarea de recuperación y no rehagas el scaffold entero.
- Priorizá este orden de decision cuando hay error recuperable con contexto suficiente: recover-single-target, recover-single-subtask, recover-and-continue, ask-user.
- Si el failureType indica accepted_but_idle, no_material_progress, command_stalled o repeated_recovery_failure, reducí todavía más la subtarea antes de reintentar.
- Si plannerFeedback.executorFailureContext trae repeatedFailureCount >= 2 o blockedRecoveryModes, bloqueá explícitamente cualquier recover-and-continue amplio o reconstrucción del bloque padre.
- Si plannerFeedback.executorFailureContext trae recentFailures o lastFailure con targetPath o subtask reutilizable, continuá desde ese punto y no repitas un intento broad equivalente.
- Si la instrucción fallida era oversized, dividila antes del siguiente intento y elegí un único archivo o bloque verificable.
- Solo usá ask-user después de una falla del executor si apareció un bloqueo crítico real como credenciales, deploy real, DNS/dominio real, costos reales, acción destructiva o legal/seguridad.
- Si userParticipationMode es "user-will-contribute", podés pedir definiciones o approvals cuando hagan falta de forma concreta y no repetitiva.
- No devuelvas texto libre fuera del JSON.
- Mantené el contrato uniforme del Cerebro.
`.trim()
}

function buildOpenAIBrainSchema() {
  return {
    type: 'object',
    additionalProperties: true,
    properties: {
      decisionKey: { type: 'string' },
      strategy: { type: 'string' },
      executionMode: { type: 'string' },
      reason: { type: 'string' },
      question: { type: 'string' },
      requiresApproval: { type: 'boolean' },
      completed: { type: 'boolean' },
      instruction: { type: 'string' },
      nextExpectedAction: { type: 'string' },
      businessSector: { type: 'string' },
      businessSectorLabel: { type: 'string' },
      executionScope: {
        type: 'object',
        additionalProperties: true,
        properties: {
          objectiveScope: { type: 'string' },
          allowedTargetPaths: {
            type: 'array',
            items: { type: 'string' },
          },
          blockedTargetPaths: {
            type: 'array',
            items: { type: 'string' },
          },
          successCriteria: {
            type: 'array',
            items: { type: 'string' },
          },
          continuationAnchor: {
            type: 'object',
            additionalProperties: true,
            properties: {
              targetPath: { type: 'string' },
              subtask: { type: 'string' },
              action: { type: 'string' },
            },
          },
          enforceNarrowScope: { type: 'boolean' },
        },
      },
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            step: { type: 'number' },
            title: { type: 'string' },
            operation: { type: 'string' },
            targetPath: { type: 'string' },
          },
        },
      },
      assumptions: {
        type: 'array',
        items: { type: 'string' },
      },
      approvalRequest: {
        type: 'object',
        additionalProperties: true,
        properties: {
          decisionKey: { type: 'string' },
          reason: { type: 'string' },
          question: { type: 'string' },
          allowFreeAnswer: { type: 'boolean' },
          allowBrainDefault: { type: 'boolean' },
          impact: { type: 'string' },
          nextExpectedAction: { type: 'string' },
          options: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                key: { type: 'string' },
                label: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      creativeDirection: {
        type: 'object',
        additionalProperties: true,
        properties: {
          profileKey: { type: 'string' },
          originalityLevel: { type: 'string' },
          experienceType: { type: 'string' },
          visualStyle: { type: 'string' },
          tone: { type: 'string' },
          heroStyle: { type: 'string' },
          layoutVariant: { type: 'string' },
          layoutRhythm: { type: 'string' },
          contentDensity: { type: 'string' },
          primaryCta: { type: 'string' },
          secondaryCta: { type: 'string' },
          sectionOrder: { type: 'array', items: { type: 'string' } },
          prioritySections: { type: 'array', items: { type: 'string' } },
        },
      },
      reusableArtifactLookup: {
        type: 'object',
        additionalProperties: true,
        properties: {
          executed: { type: 'boolean' },
          foundCount: { type: 'number' },
          matches: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                sector: { type: 'string' },
                sectorLabel: { type: 'string' },
                visualStyle: { type: 'string' },
                layoutVariant: { type: 'string' },
                heroStyle: { type: 'string' },
                localPath: { type: 'string' },
                similarityScore: { type: 'number' },
                matchReasons: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      reusableArtifactsFound: { type: 'number' },
      reuseDecision: { type: 'boolean' },
      reuseReason: { type: 'string' },
      reusedArtifactIds: { type: 'array', items: { type: 'string' } },
      reuseMode: { type: 'string' },
      productArchitecture: {
        type: 'object',
        additionalProperties: true,
        properties: {
          productType: { type: 'string' },
          domain: { type: 'string' },
          users: { type: 'array', items: { type: 'string' } },
          roles: { type: 'array', items: { type: 'string' } },
          coreModules: { type: 'array', items: { type: 'string' } },
          dataEntities: { type: 'array', items: { type: 'string' } },
          keyFlows: { type: 'array', items: { type: 'string' } },
          integrations: { type: 'array', items: { type: 'string' } },
          criticalRisks: { type: 'array', items: { type: 'string' } },
          approvalRequiredFor: { type: 'array', items: { type: 'string' } },
          suggestedArchitecture: {
            type: 'object',
            additionalProperties: true,
            properties: {
              frontend: { type: 'string' },
              backend: { type: 'string' },
              database: { type: 'string' },
              auth: { type: 'string' },
              payments: { type: 'string' },
              storage: { type: 'string' },
            },
          },
          phases: { type: 'array', items: { type: 'string' } },
          safeFirstDelivery: { type: 'array', items: { type: 'string' } },
          outOfScopeForFirstIteration: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      safeFirstDeliveryPlan: {
        type: 'object',
        additionalProperties: true,
        properties: {
          scope: { type: 'array', items: { type: 'string' } },
          modules: { type: 'array', items: { type: 'string' } },
          mockData: { type: 'array', items: { type: 'string' } },
          screens: { type: 'array', items: { type: 'string' } },
          localBehavior: { type: 'array', items: { type: 'string' } },
          explicitExclusions: { type: 'array', items: { type: 'string' } },
          approvalRequiredLater: { type: 'array', items: { type: 'string' } },
          successCriteria: { type: 'array', items: { type: 'string' } },
        },
      },
      safeFirstDeliveryMaterialization: {
        type: 'object',
        additionalProperties: true,
        properties: {
          domainLabel: { type: 'string' },
          productType: { type: 'string' },
          modules: { type: 'array', items: { type: 'string' } },
          screens: { type: 'array', items: { type: 'string' } },
          entities: { type: 'array', items: { type: 'string' } },
          mockCollections: { type: 'array', items: { type: 'string' } },
          localActions: { type: 'array', items: { type: 'string' } },
          stateHints: { type: 'array', items: { type: 'string' } },
          approvalThemes: { type: 'array', items: { type: 'string' } },
          explicitExclusions: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    required: [
      'decisionKey',
      'strategy',
      'executionMode',
      'reason',
      'instruction',
      'completed',
      'nextExpectedAction',
      'tasks',
      'assumptions',
      'requiresApproval',
    ],
  }
}

function buildOpenAIBrainInputPayload(input) {
  return {
    roleModel: {
      messenger: 'coordina',
      brain: 'decide',
      worker: 'ejecuta',
    },
    goal: input.goal,
    context: input.context,
    workspacePath: input.workspacePath,
    iteration: input.iteration,
    previousExecutionResult: input.previousExecutionResult || '',
    plannerFeedback:
      parseOrchestratorPlannerFeedback(input.previousExecutionResult || '') || null,
    projectState: input.projectState || null,
    autonomyLevel: input.autonomyLevel,
    costMode: input.costMode,
    userParticipationMode: input.userParticipationMode || '',
    routingHints: input.routingHints || null,
    manualReusablePreference: input.manualReusablePreference || null,
    contextHubPack: input.contextHubPack || buildUnavailableContextHubPack('unavailable'),
    reusablePlanningContext: input.reusablePlanningContext || null,
  }
}

function extractOpenAIResponseText(responsePayload) {
  if (typeof responsePayload?.output_text === 'string' && responsePayload.output_text.trim()) {
    return responsePayload.output_text
  }

  if (!Array.isArray(responsePayload?.output)) {
    return ''
  }

  for (const outputItem of responsePayload.output) {
    if (!Array.isArray(outputItem?.content)) {
      continue
    }

    for (const contentItem of outputItem.content) {
      if (typeof contentItem?.text === 'string' && contentItem.text.trim()) {
        return contentItem.text
      }
    }
  }

  return ''
}

async function normalizeOpenAIBrainDecision(rawDecision, input) {
  const fallbackDecision = await buildLocalStrategicBrainDecision(input)
  const resolvedDecisionMap = buildResolvedDecisionMap(
    input.projectState,
    input.userParticipationMode,
  )
  const resolvedSectorConfig = resolveWebScaffoldSectorConfig({
    businessSector: rawDecision?.businessSector,
    businessSectorLabel: rawDecision?.businessSectorLabel,
    instruction: input.goal,
    context: input.context,
  })
  const seededCreativeDirection = buildWebCreativeDirection({
    goal: input.goal,
    context: input.context,
    sectorConfig: resolvedSectorConfig,
  })
  const normalizedApprovalRequest =
    rawDecision?.approvalRequest && typeof rawDecision.approvalRequest === 'object'
      ? buildBrainApprovalRequest({
          decisionKey: rawDecision.approvalRequest.decisionKey,
          reason: rawDecision.approvalRequest.reason,
          question: rawDecision.approvalRequest.question,
          options: rawDecision.approvalRequest.options,
          allowFreeAnswer: rawDecision.approvalRequest.allowFreeAnswer !== false,
          allowBrainDefault:
            rawDecision.approvalRequest.allowBrainDefault === true,
          impact: rawDecision.approvalRequest.impact,
          nextExpectedAction: rawDecision.approvalRequest.nextExpectedAction,
        })
      : fallbackDecision.approvalRequest
  const effectiveReusablePlanningContext =
    input?.reusablePlanningContext && typeof input.reusablePlanningContext === 'object'
      ? input.reusablePlanningContext
      : fallbackDecision
  const shouldPreserveFallbackReusableDecision =
    hasActiveReusablePlanningDecision(effectiveReusablePlanningContext) &&
    !(
      rawDecision?.reuseDecision === true &&
      typeof rawDecision?.reuseMode === 'string' &&
      rawDecision.reuseMode.trim() &&
      rawDecision.reuseMode.trim() !== 'none' &&
      Array.isArray(rawDecision?.reusedArtifactIds) &&
      rawDecision.reusedArtifactIds.some(
        (artifactId) => typeof artifactId === 'string' && artifactId.trim(),
      )
    )
  const mergedCreativeDirection =
    rawDecision?.creativeDirection && typeof rawDecision.creativeDirection === 'object'
      ? {
          ...(fallbackDecision.creativeDirection || seededCreativeDirection),
          ...rawDecision.creativeDirection,
          cta: {
            ...(fallbackDecision.creativeDirection?.cta || seededCreativeDirection.cta),
            ...(rawDecision.creativeDirection.cta || {}),
          },
          sectionLabels: {
            ...(
              fallbackDecision.creativeDirection?.sectionLabels ||
              seededCreativeDirection.sectionLabels
            ),
            ...(rawDecision.creativeDirection.sectionLabels || {}),
          },
          typography: {
            ...(
              fallbackDecision.creativeDirection?.typography ||
              seededCreativeDirection.typography
            ),
            ...(rawDecision.creativeDirection.typography || {}),
          },
          paletteSuggestion: {
            ...(
              fallbackDecision.creativeDirection?.paletteSuggestion ||
              seededCreativeDirection.paletteSuggestion
            ),
            ...(rawDecision.creativeDirection.paletteSuggestion || {}),
          },
        }
      : fallbackDecision.creativeDirection || seededCreativeDirection
  const normalizedDecision = buildBrainDecisionContract({
    ...fallbackDecision,
    decisionKey:
      typeof rawDecision?.decisionKey === 'string' && rawDecision.decisionKey.trim()
        ? rawDecision.decisionKey.trim()
        : fallbackDecision.decisionKey,
    strategy:
      typeof rawDecision?.strategy === 'string' && rawDecision.strategy.trim()
        ? rawDecision.strategy.trim()
        : fallbackDecision.strategy,
    executionMode:
      typeof rawDecision?.executionMode === 'string' &&
      rawDecision.executionMode.trim()
        ? rawDecision.executionMode.trim()
        : fallbackDecision.executionMode,
    businessSector:
      typeof rawDecision?.businessSector === 'string' &&
      rawDecision.businessSector.trim()
        ? rawDecision.businessSector.trim()
        : fallbackDecision.businessSector,
    businessSectorLabel:
      typeof rawDecision?.businessSectorLabel === 'string' &&
      rawDecision.businessSectorLabel.trim()
        ? rawDecision.businessSectorLabel.trim()
        : fallbackDecision.businessSectorLabel,
    reason:
      typeof rawDecision?.reason === 'string' && rawDecision.reason.trim()
        ? rawDecision.reason.trim()
        : fallbackDecision.reason,
    question:
      typeof rawDecision?.question === 'string' ? rawDecision.question.trim() : '',
    tasks:
      Array.isArray(rawDecision?.tasks) && rawDecision.tasks.length > 0
        ? rawDecision.tasks
        : fallbackDecision.tasks,
    requiresApproval:
      rawDecision?.requiresApproval === true ||
      (normalizedApprovalRequest &&
        typeof normalizedApprovalRequest.question === 'string' &&
        normalizedApprovalRequest.question.trim() &&
        rawDecision?.completed !== true),
    approvalRequest: normalizedApprovalRequest,
    assumptions:
      Array.isArray(rawDecision?.assumptions) && rawDecision.assumptions.length > 0
        ? rawDecision.assumptions
        : fallbackDecision.assumptions,
    instruction: resolveReusableAwareInstruction({
      rawInstruction:
        typeof rawDecision?.instruction === 'string' ? rawDecision.instruction : '',
      fallbackInstruction: fallbackDecision.instruction,
      reusablePlanningContext: effectiveReusablePlanningContext,
    }),
    completed: rawDecision?.completed === true,
    nextExpectedAction:
      typeof rawDecision?.nextExpectedAction === 'string' &&
      rawDecision.nextExpectedAction.trim()
        ? rawDecision.nextExpectedAction.trim()
        : fallbackDecision.nextExpectedAction,
    creativeDirection: mergedCreativeDirection,
    executionScope:
      normalizeExecutorExecutionScope(rawDecision?.executionScope) ||
      normalizeExecutorExecutionScope(fallbackDecision.executionScope),
    reusableArtifactLookup:
      !shouldPreserveFallbackReusableDecision &&
      rawDecision?.reusableArtifactLookup &&
      typeof rawDecision.reusableArtifactLookup === 'object'
        ? rawDecision.reusableArtifactLookup
        : fallbackDecision.reusableArtifactLookup,
    reusableArtifactsFound:
      !shouldPreserveFallbackReusableDecision &&
      Number.isInteger(rawDecision?.reusableArtifactsFound) &&
      rawDecision.reusableArtifactsFound >= 0
        ? rawDecision.reusableArtifactsFound
        : fallbackDecision.reusableArtifactsFound,
    reuseDecision:
      !shouldPreserveFallbackReusableDecision &&
      typeof rawDecision?.reuseDecision === 'boolean'
        ? rawDecision.reuseDecision
        : fallbackDecision.reuseDecision,
    reuseReason:
      !shouldPreserveFallbackReusableDecision &&
      typeof rawDecision?.reuseReason === 'string' && rawDecision.reuseReason.trim()
        ? rawDecision.reuseReason.trim()
        : fallbackDecision.reuseReason,
    reusedArtifactIds:
      !shouldPreserveFallbackReusableDecision &&
      Array.isArray(rawDecision?.reusedArtifactIds) &&
      rawDecision.reusedArtifactIds.length > 0
        ? rawDecision.reusedArtifactIds
        : fallbackDecision.reusedArtifactIds,
    reuseMode:
      !shouldPreserveFallbackReusableDecision &&
      typeof rawDecision?.reuseMode === 'string' && rawDecision.reuseMode.trim()
        ? rawDecision.reuseMode.trim()
        : fallbackDecision.reuseMode,
    productArchitecture:
      rawDecision?.productArchitecture &&
      typeof rawDecision.productArchitecture === 'object'
        ? rawDecision.productArchitecture
        : fallbackDecision.productArchitecture,
    safeFirstDeliveryPlan:
      rawDecision?.safeFirstDeliveryPlan &&
      typeof rawDecision.safeFirstDeliveryPlan === 'object'
        ? rawDecision.safeFirstDeliveryPlan
        : fallbackDecision.safeFirstDeliveryPlan,
    safeFirstDeliveryMaterialization:
      rawDecision?.safeFirstDeliveryMaterialization &&
      typeof rawDecision.safeFirstDeliveryMaterialization === 'object'
        ? rawDecision.safeFirstDeliveryMaterialization
        : fallbackDecision.safeFirstDeliveryMaterialization,
  })
  const equivalentApprovalRejected =
    normalizedDecision.requiresApproval === true &&
    (hasRejectedDecision(
      resolvedDecisionMap,
      normalizedDecision.approvalRequest?.decisionKey,
    ) ||
      hasEquivalentApprovalRejected(
        resolvedDecisionMap,
        input.goal,
        input.context,
        normalizedDecision.reason,
        normalizedDecision.question,
        normalizedDecision.approvalRequest?.decisionKey,
        normalizedDecision.approvalRequest?.reason,
        normalizedDecision.approvalRequest?.question,
      ))

  if (equivalentApprovalRejected) {
    return buildLocalAskUserBrainDecision({
      goal: input.goal,
      workspacePath: input.workspacePath,
      reason:
        'Ya existe un rechazo humano vigente para esta approval o una familia equivalente. El Cerebro no debe reabrirla ni tratarla como aprobación activa.',
      question:
        'La ultima respuesta humana para esta accion fue rechazarla. Para continuar necesito un cambio material de alcance o una alternativa distinta.',
    })
  }
  const shouldSuppressMinorApproval =
    normalizedDecision.requiresApproval === true &&
    (hasEquivalentApprovalResolved(
      resolvedDecisionMap,
      input.goal,
      input.context,
      normalizedDecision.reason,
      normalizedDecision.question,
      normalizedDecision.approvalRequest?.decisionKey,
      normalizedDecision.approvalRequest?.reason,
      normalizedDecision.approvalRequest?.question,
    ) ||
      normalizeUserParticipationMode(input.userParticipationMode) ===
        'brain-decides-missing') &&
    !detectRemoteOrCriticalAction(
      input.goal,
      input.context,
      normalizedDecision.reason,
      normalizedDecision.question,
      normalizedDecision.approvalRequest?.reason,
      normalizedDecision.approvalRequest?.question,
    ) &&
    (shouldSuppressPlaceholderAssetApproval({
      resolvedDecisionMap,
      userParticipationMode: input.userParticipationMode,
      texts: [
        input.goal,
        input.context,
        normalizedDecision.reason,
        normalizedDecision.question,
        normalizedDecision.approvalRequest?.decisionKey,
        normalizedDecision.approvalRequest?.reason,
        normalizedDecision.approvalRequest?.question,
      ],
    }) ||
      hasResolvedDecision(
        resolvedDecisionMap,
        normalizedDecision.approvalRequest?.decisionKey,
        'technical-defaults',
        'placeholder-content',
        'provisional-assets',
        'local-scaffold-work',
        'local-branch-work',
        'local-commit-work',
        'readme-env-example',
      ) ||
      detectMinorDelegableTopic(
        input.goal,
        input.context,
        normalizedDecision.reason,
        normalizedDecision.question,
        normalizedDecision.approvalRequest?.reason,
        normalizedDecision.approvalRequest?.question,
      ))

  if (!shouldSuppressMinorApproval) {
    return normalizedDecision
  }

  return buildBrainDecisionContract({
    ...normalizedDecision,
    requiresApproval: false,
    approvalRequest: null,
    question: '',
    reason:
      'El usuario ya delegó los faltantes menores o la decisión ya estaba resuelta, así que el Cerebro sigue sin reabrir ese approval.',
    nextExpectedAction: 'execute-plan',
  })
}

function createLocalRulesStrategicBrainProvider() {
  return {
    providerId: 'local-rules',
    providerKind: 'local-rules',
    providerLabel: 'Local Rules Strategic Brain Provider',
    isAvailable() {
      return true
    },
    async decide(input) {
      return buildLocalStrategicBrainDecision(input)
    },
  }
}

function createOpenAIStrategicBrainProvider() {
  const config = getOpenAIBrainConfig()

  return {
    providerId: 'openai',
    providerKind: 'openai',
    providerLabel: 'OpenAI Strategic Brain Provider',
    config,
    isAvailable() {
      return Boolean(config.apiKey)
    },
    async decide(input) {
      if (!config.apiKey) {
        throw new Error(
          'El provider OpenAI no está configurado porque falta OPENAI_API_KEY.',
        )
      }

      const requestBody = {
        model: config.model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: buildOpenAIBrainSystemPrompt(),
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: JSON.stringify(buildOpenAIBrainInputPayload(input), null, 2),
              },
            ],
          },
        ],
        reasoning: {
          effort: config.reasoningEffort,
        },
        text: {
          format: {
            type: 'json_schema',
            name: 'strategic_brain_decision',
            strict: false,
            schema: buildOpenAIBrainSchema(),
          },
        },
      }
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), config.timeoutMs)

      try {
        const response = await fetch(config.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
            ...(config.organization
              ? { 'OpenAI-Organization': config.organization }
              : {}),
            ...(config.project ? { 'OpenAI-Project': config.project } : {}),
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        })
        const responseText = await response.text()

        if (!response.ok) {
          throw new Error(
            `OpenAI Responses API devolvió ${response.status}: ${buildOutputPreview(responseText, 400)}`,
          )
        }

        const parsedPayload = JSON.parse(responseText)
        const responseJsonText = extractOpenAIResponseText(parsedPayload)

        if (!responseJsonText.trim()) {
          throw new Error(
            'OpenAI no devolvió texto estructurado utilizable para el Cerebro.',
          )
        }

        const parsedDecision = JSON.parse(responseJsonText)

        return await normalizeOpenAIBrainDecision(parsedDecision, input)
      } catch (error) {
        if (error?.name === 'AbortError') {
          throw new Error('OpenAI superó el timeout configurado para el Cerebro.')
        }

        throw error
      } finally {
        clearTimeout(timeoutId)
      }
    },
  }
}

function createStrategicBrainProviderRegistry() {
  const localRulesProvider = createLocalRulesStrategicBrainProvider()
  const openAIProvider = createOpenAIStrategicBrainProvider()

  return {
    'local-rules': localRulesProvider,
    openai: openAIProvider,
  }
}

async function requestStrategicBrainDecision(input) {
  const strategicBrainInput = buildStrategicBrainInput(input)
  const precomputedWebSector = resolveWebScaffoldSectorConfig({
    instruction: strategicBrainInput.goal,
    context: strategicBrainInput.context,
  })
  const precomputedCreativeDirection = buildWebCreativeDirection({
    goal: strategicBrainInput.goal,
    context: strategicBrainInput.context,
    sectorConfig: precomputedWebSector || null,
  })

  if (
    !strategicBrainInput.reusablePlanningContext &&
    precomputedCreativeDirection &&
    (precomputedWebSector || strategicBrainInput.manualReusablePreference)
  ) {
    strategicBrainInput.reusablePlanningContext =
      await buildReusableArtifactPlanningContext({
        userDataPath: getArtifactMemoryUserDataPath(),
        goal: strategicBrainInput.goal,
        context: strategicBrainInput.context,
        sectorConfig: precomputedWebSector,
        creativeDirection: precomputedCreativeDirection,
        manualReusablePreference: strategicBrainInput.manualReusablePreference,
      })
  }
  const providerRegistry = createStrategicBrainProviderRegistry()
  const routingDecision = buildBrainRoutingDecision(strategicBrainInput)
  const primaryProvider =
    providerRegistry[routingDecision.selectedProvider] ||
    providerRegistry['local-rules']
  const fallbackProvider =
    routingDecision.fallbackProvider &&
    providerRegistry[routingDecision.fallbackProvider]
      ? providerRegistry[routingDecision.fallbackProvider]
      : null

  try {
    if (typeof primaryProvider.isAvailable === 'function' && !primaryProvider.isAvailable()) {
      throw new Error(
        `El provider ${primaryProvider.providerId} no está disponible en este entorno.`,
      )
    }

    const decision = await primaryProvider.decide(strategicBrainInput)

    return {
      routingDecision: {
        ...routingDecision,
        selectedProvider: primaryProvider.providerId,
        resolvedProvider: primaryProvider.providerId,
        fallbackUsed: false,
      },
      adapter: buildStrategicBrainProviderDescriptor(primaryProvider),
      primaryAdapter: buildStrategicBrainProviderDescriptor(primaryProvider),
      fallbackAdapter: buildStrategicBrainProviderDescriptor(fallbackProvider),
      decision,
    }
  } catch (error) {
    if (fallbackProvider && fallbackProvider.providerId !== primaryProvider.providerId) {
      const fallbackDecision = await fallbackProvider.decide(strategicBrainInput)

      return {
        routingDecision: {
          ...routingDecision,
          selectedProvider: primaryProvider.providerId,
          resolvedProvider: fallbackProvider.providerId,
          fallbackUsed: true,
          fallbackReason:
            error instanceof Error ? error.message : String(error),
        },
        adapter: buildStrategicBrainProviderDescriptor(fallbackProvider),
        primaryAdapter: buildStrategicBrainProviderDescriptor(primaryProvider),
        fallbackAdapter: buildStrategicBrainProviderDescriptor(fallbackProvider),
        decision: fallbackDecision,
      }
    }

    throw error
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0f1c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    return
  }

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

function runMockExecutorTask({ instruction, context, workspacePath }) {
  const requiresApproval = detectSensitiveApprovalRequirement(
    instruction,
    context,
    workspacePath,
  )

  if (requiresApproval) {
    return {
      ok: true,
      instruction,
      approvalRequired: true,
      approvalReason:
        'El ejecutor detectó una acción sensible antes de ejecutar',
      resultPreview:
        'La instrucción requiere validación antes de correr la ejecución',
    }
  }

  return {
    ok: true,
    instruction,
    result: 'La ejecución mock terminó correctamente',
    approvalRequired: false,
  }
}

function parseExecutorBridgeJsonLine(line) {
  if (typeof line !== 'string' || !line.trim()) {
    return null
  }

  try {
    return JSON.parse(line)
  } catch {
    return null
  }
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
}

function hasNonTrivialExecutorOutput(value) {
  return typeof value === 'string' && value.trim().length >= 24
}

function isAccessoryVerificationCommand(command, hasMaterialProgress = false) {
  if (typeof command !== 'string' || !command.trim()) {
    return false
  }

  const normalizedCommand = command.trim().toLocaleLowerCase()
  const accessoryPatterns = [
    /\bgit status\b/,
    /\bgit diff\b/,
    /\bgit rev-parse\b/,
    /(^|\s)(ls|dir|tree)\b/,
    /(^|\s)(find|type|cat|rg)\b/,
    /\bget-childitem\b/,
    /\bselect-string\b/,
  ]

  return (
    hasMaterialProgress &&
    accessoryPatterns.some((pattern) => pattern.test(normalizedCommand))
  )
}

function hasExecutorMaterialProgress(progressSnapshot) {
  if (!progressSnapshot || typeof progressSnapshot !== 'object') {
    return false
  }

  return Boolean(
    progressSnapshot.hasMaterialProgress === true ||
      (typeof progressSnapshot.lastMaterialProgressAt === 'string' &&
        progressSnapshot.lastMaterialProgressAt.trim()) ||
      (typeof progressSnapshot.currentTargetPath === 'string' &&
        progressSnapshot.currentTargetPath.trim()) ||
      normalizeExecutorPathList(progressSnapshot.createdPaths).length > 0 ||
      normalizeExecutorPathList(progressSnapshot.touchedPaths).length > 0 ||
      hasNonTrivialExecutorOutput(progressSnapshot.stdout) ||
      hasNonTrivialExecutorOutput(progressSnapshot.stderr),
  )
}

function buildExecutorProgressState() {
  return {
    currentStepTitle: '',
    currentSubtask: '',
    currentStepIndex: 0,
    totalSteps: 0,
    currentAction: '',
    currentTargetPath: '',
    currentCommand: '',
    createdPaths: [],
    touchedPaths: [],
    stdoutPreview: '',
    stderrPreview: '',
    lastProgressAt: '',
    lastMaterialProgressAt: '',
    hasMaterialProgress: false,
    materialState: 'accepted-but-idle',
    acceptedAt: '',
  }
}

function updateExecutorProgressState(progressState, progressPayload) {
  if (!progressPayload || typeof progressPayload !== 'object') {
    return progressState
  }

  return {
    currentStepTitle:
      typeof progressPayload.title === 'string' && progressPayload.title.trim()
        ? progressPayload.title.trim()
        : progressState.currentStepTitle,
    currentSubtask:
      typeof progressPayload.subtask === 'string' && progressPayload.subtask.trim()
        ? progressPayload.subtask.trim()
        : typeof progressPayload.title === 'string' && progressPayload.title.trim()
          ? progressPayload.title.trim()
          : progressState.currentSubtask,
    currentStepIndex:
      typeof progressPayload.stepIndex === 'number'
        ? progressPayload.stepIndex
        : progressState.currentStepIndex,
    totalSteps:
      typeof progressPayload.totalSteps === 'number'
        ? progressPayload.totalSteps
        : progressState.totalSteps,
    currentAction:
      typeof progressPayload.action === 'string' && progressPayload.action.trim()
        ? progressPayload.action.trim()
        : progressState.currentAction,
    currentTargetPath:
      typeof progressPayload.targetPath === 'string' &&
      progressPayload.targetPath.trim()
        ? progressPayload.targetPath.trim()
        : progressState.currentTargetPath,
    currentCommand:
      typeof progressPayload.command === 'string' && progressPayload.command.trim()
        ? progressPayload.command.trim()
        : progressState.currentCommand,
    createdPaths: Array.isArray(progressPayload.createdPaths)
      ? normalizeExecutorPathList(progressPayload.createdPaths)
      : progressState.createdPaths,
    touchedPaths: Array.isArray(progressPayload.touchedPaths)
      ? normalizeExecutorPathList(progressPayload.touchedPaths)
      : progressState.touchedPaths,
    stdoutPreview:
      typeof progressPayload.stdoutPreview === 'string'
        ? progressPayload.stdoutPreview.trim()
        : progressState.stdoutPreview,
    stderrPreview:
      typeof progressPayload.stderrPreview === 'string'
        ? progressPayload.stderrPreview.trim()
        : progressState.stderrPreview,
    lastProgressAt:
      typeof progressPayload.emittedAt === 'string' && progressPayload.emittedAt.trim()
        ? progressPayload.emittedAt.trim()
        : new Date().toISOString(),
    lastMaterialProgressAt:
      typeof progressPayload.lastMaterialProgressAt === 'string' &&
      progressPayload.lastMaterialProgressAt.trim()
        ? progressPayload.lastMaterialProgressAt.trim()
        : progressPayload.materialProgress === true
          ? typeof progressPayload.emittedAt === 'string' &&
            progressPayload.emittedAt.trim()
            ? progressPayload.emittedAt.trim()
            : new Date().toISOString()
          : progressState.lastMaterialProgressAt,
    hasMaterialProgress:
      progressPayload.materialProgress === true ||
      progressPayload.hasMaterialProgress === true ||
      progressState.hasMaterialProgress === true,
    materialState:
      typeof progressPayload.materialState === 'string' &&
      progressPayload.materialState.trim()
        ? progressPayload.materialState.trim()
        : progressState.materialState,
    acceptedAt: progressState.acceptedAt,
  }
}

function buildExecutorProgressSnapshot(requestId, progressState, extra = {}) {
  return {
    ...(requestId ? { requestId } : {}),
    stepIndex:
      typeof progressState?.currentStepIndex === 'number' &&
      progressState.currentStepIndex > 0
        ? progressState.currentStepIndex
        : undefined,
    totalSteps:
      typeof progressState?.totalSteps === 'number' && progressState.totalSteps > 0
        ? progressState.totalSteps
        : undefined,
    currentStep: progressState?.currentStepTitle || undefined,
    currentSubtask:
      progressState?.currentSubtask || progressState?.currentStepTitle || undefined,
    currentAction: progressState?.currentAction || undefined,
    currentCommand: progressState?.currentCommand || undefined,
    currentTargetPath: progressState?.currentTargetPath || undefined,
    touchedPaths: normalizeExecutorPathList(progressState?.touchedPaths),
    createdPaths: normalizeExecutorPathList(progressState?.createdPaths),
    stdout: progressState?.stdoutPreview || undefined,
    stderr: progressState?.stderrPreview || undefined,
    lastProgressAt:
      progressState?.lastProgressAt || new Date().toISOString(),
    lastMaterialProgressAt: progressState?.lastMaterialProgressAt || undefined,
    hasMaterialProgress: progressState?.hasMaterialProgress === true,
    materialState: progressState?.materialState || undefined,
    acceptedAt: progressState?.acceptedAt || undefined,
    ...extra,
  }
}

function persistExecutorProgressSnapshot(requestId, progressState, extra = {}) {
  if (typeof requestId !== 'string' || !requestId.trim()) {
    return null
  }

  const snapshot = buildExecutorProgressSnapshot(requestId.trim(), progressState, extra)
  executorProgressSnapshots.set(requestId.trim(), snapshot)

  if (executorProgressSnapshots.size > 100) {
    const oldestKey = executorProgressSnapshots.keys().next().value

    if (oldestKey) {
      executorProgressSnapshots.delete(oldestKey)
    }
  }

  return snapshot
}

function getExecutorProgressSnapshot(requestId) {
  if (typeof requestId !== 'string' || !requestId.trim()) {
    return null
  }

  return executorProgressSnapshots.get(requestId.trim()) || null
}

function classifyExecutorFailure({
  origin,
  errorMessage,
  progressSnapshot,
  stdout,
  stderr,
  instruction,
}) {
  const combinedText = [errorMessage, stdout, stderr]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLocaleLowerCase()
  const normalizedInstruction =
    typeof instruction === 'string' ? instruction.trim().toLocaleLowerCase() : ''
  const hasMaterialProgress = hasExecutorMaterialProgress(progressSnapshot)
  const currentCommand =
    typeof progressSnapshot?.currentCommand === 'string'
      ? progressSnapshot.currentCommand.trim()
      : ''
  const currentMaterialState =
    typeof progressSnapshot?.materialState === 'string'
      ? progressSnapshot.materialState
      : ''
  const hasAccessoryCommandFailure = isAccessoryVerificationCommand(
    currentCommand,
    hasMaterialProgress,
  )
  const isRecoveryInstruction =
    normalizedInstruction.includes('reintenta solo') ||
    normalizedInstruction.includes('reparar solo') ||
    normalizedInstruction.includes('completar solo') ||
    normalizedInstruction.includes('continuar solo desde') ||
    normalizedInstruction.includes('micro-subtarea') ||
    normalizedInstruction.includes('micro-recuperacion') ||
    normalizedInstruction.includes('continúa desde el estado parcial') ||
    normalizedInstruction.includes('continua desde el estado parcial') ||
    normalizedInstruction.includes('objectivescope: single-target') ||
    normalizedInstruction.includes('objectivescope: single-subtask') ||
    normalizedInstruction.includes('objectivescope: continuation') ||
    normalizedInstruction.includes('recover-')

  if (origin === 'timeout') {
    return 'timeout'
  }

  if (origin === 'material-timeout') {
    if (!hasMaterialProgress) {
      if (currentMaterialState === 'command-running') {
        return isRecoveryInstruction ? 'repeated_recovery_failure' : 'command_stalled'
      }

      if (
        currentMaterialState === 'accepted-but-idle' ||
        currentMaterialState === 'prepare-prompt' ||
        currentMaterialState === 'spawn-executor'
      ) {
        return isRecoveryInstruction ? 'repeated_recovery_failure' : 'accepted_but_idle'
      }

      return isRecoveryInstruction ? 'repeated_recovery_failure' : 'no_material_progress'
    }

    if (
      currentMaterialState === 'file-write-started' ||
      currentMaterialState === 'file-write-partial'
    ) {
      return 'file_write_partial'
    }

    if (currentMaterialState === 'command-running') {
      return isRecoveryInstruction ? 'repeated_recovery_failure' : 'command_stalled'
    }

    return isRecoveryInstruction ? 'repeated_recovery_failure' : 'no_material_progress'
  }

  if (origin === 'child-error' || origin === 'spawn-throw' || origin === 'spawn-error') {
    return 'process_spawn_error'
  }

  if (hasAccessoryCommandFailure) {
    return 'accessory_command_failed'
  }

  if (
    origin === 'exit-con-streams-cerrados' ||
    origin === 'exit-sin-close' ||
    origin === 'close'
  ) {
    return 'invalid_final_json'
  }

  if (!hasMaterialProgress) {
    if (currentMaterialState === 'command-running') {
      return isRecoveryInstruction ? 'repeated_recovery_failure' : 'command_stalled'
    }

    if (
      currentMaterialState === 'accepted-but-idle' ||
      currentMaterialState === 'prepare-prompt' ||
      currentMaterialState === 'spawn-executor'
    ) {
      return isRecoveryInstruction ? 'repeated_recovery_failure' : 'accepted_but_idle'
    }

    return isRecoveryInstruction ? 'repeated_recovery_failure' : 'no_material_progress'
  }

  if (
    currentMaterialState === 'file-write-started' ||
    currentMaterialState === 'file-write-partial'
  ) {
    return 'file_write_partial'
  }

  if (currentMaterialState === 'command-running') {
    return isRecoveryInstruction ? 'repeated_recovery_failure' : 'command_stalled'
  }

  if (
    origin === 'stdin-write' ||
    origin === 'stdin-error' ||
    combinedText.includes('enoent') ||
    combinedText.includes('eacces') ||
    combinedText.includes('eperm') ||
    combinedText.includes('file') ||
    combinedText.includes('archivo')
  ) {
    if (progressSnapshot?.currentTargetPath) {
      return 'file_write_error'
    }
  }

  if (
    combinedText.includes('command failed') ||
    combinedText.includes('comando fall') ||
    combinedText.includes('exit code') ||
    combinedText.includes('non-zero exit')
  ) {
    return 'command_failed'
  }

  if (
    combinedText.includes('no se pudo completar la tarea de forma confiable') ||
    combinedText.includes('executor_reported_error') ||
    combinedText.includes('fallo la ejecucion')
  ) {
    return 'executor_reported_error'
  }

  return 'unknown_executor_failure'
}

function buildExecutorProgressEventPayload(progressPayload, requestId) {
  const stepIndex =
    typeof progressPayload?.stepIndex === 'number' ? progressPayload.stepIndex : 0
  const totalSteps =
    typeof progressPayload?.totalSteps === 'number' ? progressPayload.totalSteps : 0
  const title =
    typeof progressPayload?.title === 'string' && progressPayload.title.trim()
      ? progressPayload.title.trim()
      : 'Progreso del executor'

  return {
    requestId: requestId || undefined,
    source: 'executor',
    title:
      stepIndex > 0 && totalSteps > 0
        ? `Step ${stepIndex}/${totalSteps}: ${title}`
        : title,
    content:
      typeof progressPayload?.content === 'string' && progressPayload.content.trim()
        ? progressPayload.content.trim()
        : 'El executor reportó un avance incremental.',
    status:
      progressPayload?.status === 'success' ||
      progressPayload?.status === 'warning' ||
      progressPayload?.status === 'error'
        ? progressPayload.status
        : 'info',
    raw: JSON.stringify(progressPayload, null, 2),
  }
}

function buildExecutorTimeoutResponse({
  requestId,
  timeoutMs,
  timeoutKind = 'activity',
  progressState,
  stdout,
  stderr,
  instruction,
}) {
  const progressSnapshot =
    getExecutorProgressSnapshot(requestId) ||
    buildExecutorProgressSnapshot(requestId, progressState, {
      stdout: stdout.trim() || progressState?.stdoutPreview || undefined,
      stderr: stderr.trim() || progressState?.stderrPreview || undefined,
    })
  const failureType = classifyExecutorFailure({
    origin: timeoutKind === 'material' ? 'material-timeout' : 'timeout',
    errorMessage: 'Timeout esperando respuesta del executor',
    progressSnapshot,
    stdout,
    stderr,
    instruction,
  })
  const currentStepLabel =
    progressSnapshot?.currentSubtask ||
    progressSnapshot?.currentStep ||
    'la subtarea actual del executor'
  const createdPaths = normalizeExecutorPathList(progressSnapshot?.createdPaths)
  const touchedPaths = normalizeExecutorPathList(progressSnapshot?.touchedPaths)
  const partialSummary =
    createdPaths.length > 0
      ? `Se detectaron ${createdPaths.length} archivo(s) tocado(s) antes del timeout.`
      : 'No se detectaron archivos creados o modificados antes del timeout.'

  return {
    ok: false,
    error: `Timeout esperando respuesta del executor en ${currentStepLabel}`,
    failureType,
    resultPreview: partialSummary,
    details: {
      timeoutMs,
      timeoutKind,
      failureType,
      stepIndex: progressSnapshot?.stepIndex,
      totalSteps: progressSnapshot?.totalSteps,
      currentStep: progressSnapshot?.currentStep,
      currentSubtask: progressSnapshot?.currentSubtask,
      currentAction: progressSnapshot?.currentAction,
      currentTargetPath: progressSnapshot?.currentTargetPath,
      currentCommand: progressSnapshot?.currentCommand,
      createdPaths,
      touchedPaths,
      stdout: stdout.trim() || progressSnapshot?.stdout || undefined,
      stderr: stderr.trim() || progressSnapshot?.stderr || undefined,
      lastProgressAt: progressSnapshot?.lastProgressAt,
      lastMaterialProgressAt: progressSnapshot?.lastMaterialProgressAt,
      hasMaterialProgress: progressSnapshot?.hasMaterialProgress === true,
      materialState: progressSnapshot?.materialState,
      acceptedAt: progressSnapshot?.acceptedAt,
    },
    trace: [
      buildMainTraceEntry(
        'Timeout del executor',
        `Electron agotó el tiempo de espera durante ${currentStepLabel}. ${partialSummary}`,
        'error',
        JSON.stringify(
            {
              timeoutMs,
            timeoutKind,
            failureType,
            currentStep: progressSnapshot?.currentStep || undefined,
            currentSubtask: progressSnapshot?.currentSubtask || undefined,
            currentAction: progressSnapshot?.currentAction || undefined,
            currentTargetPath: progressSnapshot?.currentTargetPath || undefined,
            currentCommand: progressSnapshot?.currentCommand || undefined,
            createdPaths,
            touchedPaths,
            stdoutPreview: buildOutputPreview(
              stdout || progressSnapshot?.stdout || '',
            ),
            stderrPreview: buildOutputPreview(
              stderr || progressSnapshot?.stderr || '',
            ),
            lastProgressAt: progressSnapshot?.lastProgressAt || undefined,
          },
          null,
          2,
        ),
      ),
    ],
    ...(requestId ? { requestId } : {}),
  }
}

function enrichExecutorFailureResponseWithHistory({
  response,
  requestId,
  instruction,
  workspacePath,
  businessSector,
  businessSectorLabel,
  decisionKey,
}) {
  if (!response || typeof response !== 'object') {
    return response
  }

  const details =
    response.details && typeof response.details === 'object' ? response.details : {}
  const normalizedFailureContext =
    normalizeExecutorFailureContextForBrain({
      ...details,
      ...(typeof response.failureType === 'string' && response.failureType.trim()
        ? { failureType: response.failureType.trim() }
        : {}),
      ...(decisionKey ? { decisionKey } : {}),
    }) || {}
  const failureType =
    typeof response.failureType === 'string' && response.failureType.trim()
      ? response.failureType.trim()
      : ''
  const attemptRecord = buildExecutorAttemptRecord({
    decisionKey,
    instruction,
    failureType,
    failureContext: normalizedFailureContext,
    timestamp:
      typeof normalizedFailureContext.timestamp === 'string'
        ? normalizedFailureContext.timestamp
        : new Date().toISOString(),
  })
  const flowKey = buildExecutorFlowKey({
    workspacePath,
    businessSector,
    businessSectorLabel,
    instruction,
  })
  const recoveryMemory = buildExecutorRecoveryMemory({
    flowKey,
    currentAttempt: attemptRecord,
  })

  return {
    ...response,
    ...(requestId && !response.requestId ? { requestId } : {}),
    ...(failureType ? { failureType } : {}),
    details: {
      ...details,
      timestamp: attemptRecord.timestamp,
      decisionKey: attemptRecord.decisionKey,
      failureType: failureType || details.failureType,
      hasMaterialProgress: attemptRecord.hadMaterialProgress,
      materialState: attemptRecord.materialState || details.materialState,
      currentTargetPath:
        attemptRecord.currentTargetPath || details.currentTargetPath || undefined,
      currentSubtask:
        attemptRecord.currentSubtask || details.currentSubtask || undefined,
      currentAction: attemptRecord.currentAction || details.currentAction || undefined,
      createdPaths: summarizeExecutorAttemptPaths(
        attemptRecord.createdPaths.length > 0 ? attemptRecord.createdPaths : details.createdPaths,
        6,
      ),
      touchedPaths: summarizeExecutorAttemptPaths(
        attemptRecord.touchedPaths.length > 0 ? attemptRecord.touchedPaths : details.touchedPaths,
        6,
      ),
      attemptScope: attemptRecord.attemptScope,
      fingerprint: attemptRecord.fingerprint,
      isRecoveryAttempt: attemptRecord.isRecoveryAttempt,
      repeatedFailureCount: recoveryMemory.repeatedFailureCount,
      lastAttemptScope: recoveryMemory.lastAttemptScope,
      blockedRecoveryModes: recoveryMemory.blockedRecoveryModes,
      lastFailure: recoveryMemory.lastFailure || undefined,
      recentFailures: recoveryMemory.recentFailures,
    },
  }
}

function buildExecutorBridgeContext({ context, executionScope }) {
  if (
    executionScope?.enforceNarrowScope === true &&
    normalizeExecutorObjectiveScope(executionScope.objectiveScope)
  ) {
    return ''
  }

  return typeof context === 'string' ? context.trim() : ''
}

function runCommandExecutorTask({
  instruction,
  context,
  workspacePath,
  executionScope,
  requestId,
  emitEvent,
}) {
  debugMainLog('runCommandExecutorTask:enter', {
    requestId: requestId || undefined,
    hasInstruction: Boolean(instruction),
    hasContext: Boolean(context),
    hasWorkspacePath: Boolean(workspacePath),
    objectiveScope: executionScope?.objectiveScope || undefined,
  })
  const executorContext = buildExecutorBridgeContext({
    context,
    executionScope,
  })
  const usesStructuredMaterializationIntent =
    detectExecutorStructuredMaterializationIntent({
      instruction,
      context: executorContext || context,
      executionScope,
    })
  const bridgeModeResolution = resolveExecutorBridgeMode()
  const usesCodexBrainExecutor = bridgeModeResolution.mode === 'codex'
  const materialProgressTimeoutMs =
    usesStructuredMaterializationIntent || usesCodexBrainExecutor
      ? Math.max(
          EXECUTOR_STRUCTURED_PLAN_TIMEOUT_MS,
          EXECUTOR_TIMEOUT_MS + 60000,
        )
      : EXECUTOR_MATERIAL_PROGRESS_TIMEOUT_MS
  const executorCommandValue = resolveExecutorCommandValue()
  const parsedExecutorCommand = parseExecutorCommand(executorCommandValue)

  if (!parsedExecutorCommand) {
    emitEvent?.(
      'runExecutorTask devolvió error final',
      'Electron no pudo interpretar el comando configurado para el executor.',
      'error',
      {
        requestId: requestId || undefined,
        executorCommand: executorCommandValue,
      },
    )

    return Promise.resolve({
      ok: false,
      error: 'No se pudo interpretar el comando configurado para el executor',
      details: {
        executorCommand: executorCommandValue,
      },
      trace: [],
      ...(requestId ? { requestId } : {}),
    })
  }

  emitEvent?.(
    'executor command preparado',
    'Electron preparó el comando del executor real.',
    'info',
    {
      requestId: requestId || undefined,
      executorCommand: executorCommandValue,
      command: parsedExecutorCommand.command,
      args: parsedExecutorCommand.args,
      shell: false,
    },
  )
  debugMainLog('runCommandExecutorTask:command-prepared', {
    requestId: requestId || undefined,
    command: parsedExecutorCommand.command,
    args: parsedExecutorCommand.args,
  })

  return new Promise((resolve) => {
    const child = spawn(parsedExecutorCommand.command, parsedExecutorCommand.args, {
      stdio: 'pipe',
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let stdoutProtocolBuffer = ''
    let settled = false
    let exitCode = null
    let exitSignal = null
    let closeCode = null
    let closeSignal = null
    let exitEventReceived = false
    let stdoutEnded = false
    let stderrEnded = false
    let stdoutEventSent = false
    let stderrEventSent = false
    let closeFallbackTimeoutId = null
    let activityTimeoutId = null
    let materialProgressTimeoutId = null
    let childKilledByTimeout = false
    let progressState = {
      ...buildExecutorProgressState(),
      currentCommand: executorCommandValue,
    }
    persistExecutorProgressSnapshot(requestId, progressState)

    const clearCloseFallbackTimeout = () => {
      if (closeFallbackTimeoutId) {
        clearTimeout(closeFallbackTimeoutId)
        closeFallbackTimeoutId = null
      }
    }

    const clearActivityTimeout = () => {
      if (activityTimeoutId) {
        clearTimeout(activityTimeoutId)
        activityTimeoutId = null
      }
    }

    const clearMaterialProgressTimeout = () => {
      if (materialProgressTimeoutId) {
        clearTimeout(materialProgressTimeoutId)
        materialProgressTimeoutId = null
      }
    }

    const finalizeResult = (result, title, content, status = 'info', raw) => {
      if (settled) {
        return
      }

      settled = true
      clearCloseFallbackTimeout()
      clearActivityTimeout()
      clearMaterialProgressTimeout()
      debugMainLog('runCommandExecutorTask:resolve', {
        requestId: requestId || undefined,
        title,
        status,
        ok: result?.ok === true,
        error: result?.error || undefined,
      })
      emitEvent?.(title, content, status, raw)
      resolve(result)
    }

    const armActivityTimeout = () => {
      clearActivityTimeout()
      activityTimeoutId = setTimeout(() => {
        if (settled) {
          return
        }

        childKilledByTimeout = true

        try {
          child.kill()
        } catch {
          // Ignora kill sobre procesos ya cerrados.
        }

        finalizeResult(
          buildExecutorTimeoutResponse({
            requestId,
            timeoutMs: EXECUTOR_TIMEOUT_MS,
            timeoutKind: 'activity',
            progressState,
            stdout,
            stderr,
            instruction,
          }),
          'runExecutorTask devolvió error final',
          'Electron cerró la ejecución por timeout contextualizado del executor.',
          'error',
          {
            requestId: requestId || undefined,
            timeoutMs: EXECUTOR_TIMEOUT_MS,
            timeoutKind: 'activity',
            currentStep: progressState.currentStepTitle || undefined,
            currentAction: progressState.currentAction || undefined,
            currentTargetPath: progressState.currentTargetPath || undefined,
            currentCommand: progressState.currentCommand || undefined,
            createdPaths: progressState.createdPaths,
            touchedPaths: progressState.touchedPaths,
            stdoutPreview: buildOutputPreview(stdout),
            stderrPreview: buildOutputPreview(stderr),
          },
        )
      }, EXECUTOR_TIMEOUT_MS)
    }

    const armMaterialProgressTimeout = () => {
      clearMaterialProgressTimeout()
      materialProgressTimeoutId = setTimeout(() => {
        if (settled) {
          return
        }

        childKilledByTimeout = true

        try {
          child.kill()
        } catch {
          // Ignora kill sobre procesos ya cerrados.
        }

        finalizeResult(
          buildExecutorTimeoutResponse({
            requestId,
            timeoutMs: materialProgressTimeoutMs,
            timeoutKind: 'material',
            progressState,
            stdout,
            stderr,
            instruction,
          }),
          'runExecutorTask devolvió error final',
          'Electron cerró la ejecución por falta de progreso material del executor.',
          'error',
          {
            requestId: requestId || undefined,
            timeoutMs: materialProgressTimeoutMs,
            timeoutKind: 'material',
            currentStep: progressState.currentStepTitle || undefined,
            currentAction: progressState.currentAction || undefined,
            currentTargetPath: progressState.currentTargetPath || undefined,
            currentCommand: progressState.currentCommand || undefined,
            materialState: progressState.materialState || undefined,
            hasMaterialProgress: progressState.hasMaterialProgress === true,
            lastMaterialProgressAt: progressState.lastMaterialProgressAt || undefined,
            createdPaths: progressState.createdPaths,
            touchedPaths: progressState.touchedPaths,
            stdoutPreview: buildOutputPreview(stdout),
            stderrPreview: buildOutputPreview(stderr),
          },
        )
      }, materialProgressTimeoutMs)
    }

    const markMaterialProgress = (materialState = '') => {
      progressState = {
        ...progressState,
        hasMaterialProgress: true,
        materialState: materialState || progressState.materialState || 'material-progress',
        lastMaterialProgressAt: new Date().toISOString(),
      }
      persistExecutorProgressSnapshot(requestId, progressState, {
        stdout: stdout.trim() || progressState.stdoutPreview || undefined,
        stderr: stderr.trim() || progressState.stderrPreview || undefined,
      })
      armMaterialProgressTimeout()
    }

    const processStdoutProtocolLines = (flushRemainder = false) => {
      const lines = stdoutProtocolBuffer.split(/\r?\n/)

      if (!flushRemainder) {
        stdoutProtocolBuffer = lines.pop() || ''
      } else {
        stdoutProtocolBuffer = ''
      }

      for (const line of lines) {
        const parsedLine = parseExecutorBridgeJsonLine(line)

        if (!parsedLine || parsedLine.__executorBridgeEvent !== true) {
          continue
        }

        progressState = updateExecutorProgressState(progressState, parsedLine)
        persistExecutorProgressSnapshot(requestId, progressState)
        armActivityTimeout()
        if (parsedLine.materialProgress === true) {
          markMaterialProgress(
            typeof parsedLine.materialState === 'string'
              ? parsedLine.materialState
              : progressState.materialState,
          )
        } else {
          armMaterialProgressTimeout()
        }
        const progressEvent = buildExecutorProgressEventPayload(
          parsedLine,
          requestId,
        )
        emitEvent?.(
          progressEvent.title,
          progressEvent.content,
          progressEvent.status,
          parsedLine,
        )
      }
    }

    const resolveBridgeError = (errorMessage, origin, extraDetails = {}) => {
      const progressSnapshot =
        getExecutorProgressSnapshot(requestId) ||
        persistExecutorProgressSnapshot(requestId, progressState)
      const failureType = classifyExecutorFailure({
        origin,
        errorMessage,
        progressSnapshot,
        stdout,
        stderr,
        instruction,
      })

      finalizeResult(
        {
          ok: false,
          error: errorMessage || 'No se pudo ejecutar el bridge local del executor',
          failureType,
          resultPreview:
            progressSnapshot?.createdPaths?.length > 0 ||
            progressSnapshot?.touchedPaths?.length > 0
              ? `La ejecución falló en ${progressSnapshot?.currentSubtask || progressSnapshot?.currentStep || 'la subtarea actual'}, pero hubo avances parciales.`
              : undefined,
          details: {
            failureType,
            ...(origin ? { origin } : {}),
            command: parsedExecutorCommand.command,
            args: parsedExecutorCommand.args,
            shell: false,
            ...(typeof exitCode === 'number' ? { exitCode } : {}),
            ...(exitSignal ? { exitSignal } : {}),
            ...(typeof closeCode === 'number' ? { closeCode } : {}),
            ...(closeSignal ? { closeSignal } : {}),
            ...(progressSnapshot?.stepIndex ? { stepIndex: progressSnapshot.stepIndex } : {}),
            ...(progressSnapshot?.totalSteps
              ? { totalSteps: progressSnapshot.totalSteps }
              : {}),
            ...(progressSnapshot?.currentStep
              ? { currentStep: progressSnapshot.currentStep }
              : {}),
            ...(progressSnapshot?.currentSubtask
              ? { currentSubtask: progressSnapshot.currentSubtask }
              : {}),
            ...(progressSnapshot?.currentAction
              ? { currentAction: progressSnapshot.currentAction }
              : {}),
            ...(progressSnapshot?.currentTargetPath
              ? { currentTargetPath: progressSnapshot.currentTargetPath }
              : {}),
            ...(progressSnapshot?.currentCommand
              ? { currentCommand: progressSnapshot.currentCommand }
              : {}),
            createdPaths: normalizeExecutorPathList(progressSnapshot?.createdPaths),
            touchedPaths: normalizeExecutorPathList(progressSnapshot?.touchedPaths),
            ...(stdout.trim() || progressSnapshot?.stdout
              ? { stdout: stdout.trim() || progressSnapshot?.stdout }
              : {}),
            ...(stderr.trim() || progressSnapshot?.stderr
              ? { stderr: stderr.trim() || progressSnapshot?.stderr }
              : {}),
            ...(progressSnapshot?.lastProgressAt
              ? { lastProgressAt: progressSnapshot.lastProgressAt }
              : {}),
            ...(progressSnapshot?.lastMaterialProgressAt
              ? { lastMaterialProgressAt: progressSnapshot.lastMaterialProgressAt }
              : {}),
            ...(typeof progressSnapshot?.hasMaterialProgress === 'boolean'
              ? { hasMaterialProgress: progressSnapshot.hasMaterialProgress }
              : {}),
            ...(progressSnapshot?.materialState
              ? { materialState: progressSnapshot.materialState }
              : {}),
            ...(progressSnapshot?.acceptedAt
              ? { acceptedAt: progressSnapshot.acceptedAt }
              : {}),
            ...extraDetails,
          },
          trace: [],
          ...(requestId ? { requestId } : {}),
        },
        'runExecutorTask devolvió error final',
        'Electron devolvió un error final desde runExecutorTask.',
        'error',
        {
          requestId: requestId || undefined,
          origin,
          command: parsedExecutorCommand.command,
          args: parsedExecutorCommand.args,
          shell: false,
          errorMessage:
            errorMessage || 'No se pudo ejecutar el bridge local del executor',
          ...(typeof exitCode === 'number' ? { exitCode } : {}),
          ...(exitSignal ? { exitSignal } : {}),
          ...(typeof closeCode === 'number' ? { closeCode } : {}),
          ...(closeSignal ? { closeSignal } : {}),
          failureType,
          currentStep: progressSnapshot?.currentStep || undefined,
          currentSubtask: progressSnapshot?.currentSubtask || undefined,
          currentAction: progressSnapshot?.currentAction || undefined,
          currentTargetPath: progressSnapshot?.currentTargetPath || undefined,
          currentCommand: progressSnapshot?.currentCommand || undefined,
          createdPaths: normalizeExecutorPathList(progressSnapshot?.createdPaths),
          touchedPaths: normalizeExecutorPathList(progressSnapshot?.touchedPaths),
          stdoutLength: stdout.length,
          stderrLength: stderr.length,
          ...extraDetails,
        },
      )
    }

    const resolveParsedOutput = (origin) => {
      if (settled) {
        return
      }

      emitEvent?.(
        'runExecutorTask empezó a parsear stdout',
        'Electron empezó a parsear el stdout acumulado del executor.',
        'info',
        {
          requestId: requestId || undefined,
          origin,
          stdoutLength: stdout.length,
          stderrLength: stderr.length,
          ...(typeof exitCode === 'number' ? { exitCode } : {}),
          ...(exitSignal ? { exitSignal } : {}),
          ...(typeof closeCode === 'number' ? { closeCode } : {}),
          ...(closeSignal ? { closeSignal } : {}),
        },
      )

      try {
        processStdoutProtocolLines(true)
        const stdoutLines = stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
        const nonProtocolLines = stdoutLines.filter((line) => {
          const parsedLine = parseExecutorBridgeJsonLine(line)

          return !parsedLine || parsedLine.__executorBridgeEvent !== true
        })
        const parsedOutput =
          parseExecutorBridgeJsonLine(nonProtocolLines.at(-1) || '') ||
          JSON.parse(stdout.trim())
        const progressSnapshot =
          getExecutorProgressSnapshot(requestId) ||
          persistExecutorProgressSnapshot(requestId, progressState)
        const parsedOutputOrigin =
          parsedOutput?.details &&
          typeof parsedOutput.details === 'object' &&
          typeof parsedOutput.details.origin === 'string' &&
          parsedOutput.details.origin.trim()
            ? parsedOutput.details.origin.trim()
            : origin
        const parsedFailureType =
          parsedOutput?.ok === false
            ? classifyExecutorFailure({
                origin: parsedOutputOrigin,
                errorMessage: parsedOutput?.error,
                progressSnapshot,
                stdout,
                stderr,
                instruction,
              })
            : undefined

        finalizeResult(
          {
            ...parsedOutput,
            ...(requestId && !parsedOutput?.requestId ? { requestId } : {}),
            trace: Array.isArray(parsedOutput?.trace) ? parsedOutput.trace : [],
            ...(parsedFailureType && !parsedOutput?.failureType
              ? { failureType: parsedFailureType }
              : {}),
            details: {
              ...(parsedOutput?.details && typeof parsedOutput.details === 'object'
                ? parsedOutput.details
                : {}),
              ...(parsedFailureType ? { failureType: parsedFailureType } : {}),
              ...(typeof exitCode === 'number' ? { exitCode } : {}),
              ...(exitSignal ? { exitSignal } : {}),
              ...(typeof closeCode === 'number' ? { closeCode } : {}),
              ...(closeSignal ? { closeSignal } : {}),
              ...(progressSnapshot?.stepIndex
                ? { stepIndex: progressSnapshot.stepIndex }
                : {}),
              ...(progressSnapshot?.totalSteps
                ? { totalSteps: progressSnapshot.totalSteps }
                : {}),
              ...(progressSnapshot?.currentStep
                ? { currentStep: progressSnapshot.currentStep }
                : {}),
              ...(progressSnapshot?.currentSubtask
                ? { currentSubtask: progressSnapshot.currentSubtask }
                : {}),
              ...(progressSnapshot?.currentAction
                ? { currentAction: progressSnapshot.currentAction }
                : {}),
              ...(progressSnapshot?.currentTargetPath
                ? { currentTargetPath: progressSnapshot.currentTargetPath }
                : {}),
              ...(progressSnapshot?.currentCommand
                ? { currentCommand: progressSnapshot.currentCommand }
                : {}),
              createdPaths: normalizeExecutorPathList(progressSnapshot?.createdPaths),
              touchedPaths: normalizeExecutorPathList(progressSnapshot?.touchedPaths),
              ...(stdout.trim() || progressSnapshot?.stdout
                ? { stdout: stdout.trim() || progressSnapshot?.stdout }
                : {}),
              ...(stderr.trim() || progressSnapshot?.stderr
                ? { stderr: stderr.trim() || progressSnapshot?.stderr }
                : {}),
              ...(progressSnapshot?.lastProgressAt
                ? { lastProgressAt: progressSnapshot.lastProgressAt }
                : {}),
              ...(progressSnapshot?.lastMaterialProgressAt
                ? { lastMaterialProgressAt: progressSnapshot.lastMaterialProgressAt }
                : {}),
              ...(typeof progressSnapshot?.hasMaterialProgress === 'boolean'
                ? { hasMaterialProgress: progressSnapshot.hasMaterialProgress }
                : {}),
              ...(progressSnapshot?.materialState
                ? { materialState: progressSnapshot.materialState }
                : {}),
              ...(progressSnapshot?.acceptedAt
                ? { acceptedAt: progressSnapshot.acceptedAt }
                : {}),
            },
          },
          'runExecutorTask devolvió respuesta final',
          'Electron devolvió la respuesta final de runExecutorTask.',
          parsedOutput?.ok === false ? 'warning' : 'success',
          {
            requestId: requestId || parsedOutput?.requestId,
            origin: parsedOutputOrigin,
            ok: parsedOutput?.ok === true,
            error: parsedOutput?.error || undefined,
            failureType: parsedFailureType || parsedOutput?.failureType || undefined,
            currentStep: progressSnapshot?.currentStep || undefined,
            currentSubtask: progressSnapshot?.currentSubtask || undefined,
            currentAction: progressSnapshot?.currentAction || undefined,
            currentTargetPath: progressSnapshot?.currentTargetPath || undefined,
            createdPaths: normalizeExecutorPathList(progressSnapshot?.createdPaths),
            touchedPaths: normalizeExecutorPathList(progressSnapshot?.touchedPaths),
            ...(typeof exitCode === 'number' ? { exitCode } : {}),
            ...(exitSignal ? { exitSignal } : {}),
            ...(typeof closeCode === 'number' ? { closeCode } : {}),
            ...(closeSignal ? { closeSignal } : {}),
          },
        )
      } catch (error) {
        resolveBridgeError(
          stdout.trim()
            ? 'El bridge local devolvió una respuesta no parseable'
            : 'El bridge local no devolvió una respuesta utilizable',
          origin,
          {
            parseError: error instanceof Error ? error.message : String(error),
          },
        )
      }
    }

    const maybeResolveAfterExit = () => {
      if (!exitEventReceived || settled) {
        return
      }

      if (stdoutEnded && stderrEnded) {
        resolveParsedOutput('exit-con-streams-cerrados')
        return
      }

      clearCloseFallbackTimeout()
      closeFallbackTimeoutId = setTimeout(() => {
        resolveParsedOutput('exit-sin-close')
      }, 250)
    }

    child.on('spawn', () => {
      debugMainLog('runCommandExecutorTask:spawn', {
        requestId: requestId || undefined,
        pid: child.pid,
      })
      progressState = {
        ...progressState,
        acceptedAt: new Date().toISOString(),
        lastProgressAt: new Date().toISOString(),
        materialState: 'accepted-but-idle',
      }
      persistExecutorProgressSnapshot(requestId, progressState)
      armActivityTimeout()
      armMaterialProgressTimeout()
      emitEvent?.(
        'proceso hijo lanzado',
        'Electron lanzó el proceso hijo del executor.',
        'info',
        {
          requestId: requestId || undefined,
          pid: child.pid,
          command: parsedExecutorCommand.command,
          args: parsedExecutorCommand.args,
          shell: false,
        },
      )
    })

    child.stdout.on('data', (chunk) => {
      const chunkText = chunk.toString()
      stdout += chunkText
      progressState = {
        ...progressState,
        stdoutPreview: buildOutputPreview(stdout),
        lastProgressAt: new Date().toISOString(),
      }
      persistExecutorProgressSnapshot(requestId, progressState, {
        stdout: stdout.trim() || progressState.stdoutPreview || undefined,
      })
      stdoutProtocolBuffer += chunkText
      processStdoutProtocolLines(false)
      armActivityTimeout()
      armMaterialProgressTimeout()
      debugMainLog('runCommandExecutorTask:stdout-data', {
        requestId: requestId || undefined,
        chunkBytes: Buffer.byteLength(chunkText),
        totalStdoutBytes: Buffer.byteLength(stdout),
      })
      if (!stdoutEventSent) {
        stdoutEventSent = true
        emitEvent?.(
          'primer stdout recibido',
          'Electron recibió el primer bloque de stdout del executor.',
          'info',
          {
            requestId: requestId || undefined,
            bytes: Buffer.byteLength(chunkText),
          },
        )
      }
    })

    child.stdout.on('end', () => {
      stdoutEnded = true
      maybeResolveAfterExit()
    })

    child.stderr.on('data', (chunk) => {
      const chunkText = chunk.toString()
      stderr += chunkText
      progressState = {
        ...progressState,
        stderrPreview: buildOutputPreview(stderr),
        lastProgressAt: new Date().toISOString(),
      }
      persistExecutorProgressSnapshot(requestId, progressState, {
        stderr: stderr.trim() || progressState.stderrPreview || undefined,
      })
      armActivityTimeout()
      armMaterialProgressTimeout()
      debugMainLog('runCommandExecutorTask:stderr-data', {
        requestId: requestId || undefined,
        chunkBytes: Buffer.byteLength(chunkText),
        totalStderrBytes: Buffer.byteLength(stderr),
      })
      if (!stderrEventSent) {
        stderrEventSent = true
        emitEvent?.(
          'primer stderr recibido',
          'Electron recibió el primer bloque de stderr del executor.',
          'warning',
          {
            requestId: requestId || undefined,
            bytes: Buffer.byteLength(chunkText),
          },
        )
      }
    })

    child.stderr.on('end', () => {
      stderrEnded = true
      maybeResolveAfterExit()
    })

    child.stdin.on('error', (error) => {
      debugMainLog('runCommandExecutorTask:stdin-error', {
        requestId: requestId || undefined,
        error: error?.message || 'stdin-error',
      })
      resolveBridgeError(
        error?.message || 'Falló stdin del proceso hijo del executor',
        'stdin-error',
        {
          errorMessage: error?.message || 'Falló stdin del proceso hijo del executor',
        },
      )
    })

    child.on('error', (error) => {
      debugMainLog('runCommandExecutorTask:child-error', {
        requestId: requestId || undefined,
        error: error?.message || 'child-error',
      })
      resolveBridgeError(
        error?.message || 'No se pudo ejecutar el bridge local del executor',
        'child-error',
        {
          errorMessage: error?.message || 'No se pudo ejecutar el bridge local del executor',
        },
      )
    })

    child.on('exit', (code, signal) => {
      exitEventReceived = true
      exitCode = code
      exitSignal = signal
      debugMainLog('runCommandExecutorTask:exit', {
        requestId: requestId || undefined,
        exitCode: typeof code === 'number' ? code : undefined,
        exitSignal: signal || undefined,
        stdoutEnded,
        stderrEnded,
      })
      emitEvent?.(
        'evento exit recibido',
        'Electron recibió el evento exit del proceso hijo del executor.',
        code === 0 ? 'success' : 'warning',
        {
          requestId: requestId || undefined,
          ...(typeof code === 'number' ? { exitCode: code } : {}),
          ...(signal ? { exitSignal: signal } : {}),
        },
      )
      maybeResolveAfterExit()
    })

    child.on('close', (code, signal) => {
      if (childKilledByTimeout) {
        return
      }

      closeCode = code
      closeSignal = signal
      clearCloseFallbackTimeout()
      processStdoutProtocolLines(true)
      debugMainLog('runCommandExecutorTask:close', {
        requestId: requestId || undefined,
        closeCode: typeof code === 'number' ? code : undefined,
        closeSignal: signal || undefined,
        stdoutBytes: Buffer.byteLength(stdout),
        stderrBytes: Buffer.byteLength(stderr),
      })
      emitEvent?.(
        'evento close recibido',
        'Electron recibió el evento close del proceso hijo del executor.',
        code === 0 ? 'success' : 'warning',
        {
          requestId: requestId || undefined,
          ...(typeof code === 'number' ? { closeCode: code } : {}),
          ...(signal ? { closeSignal: signal } : {}),
        },
      )
      resolveParsedOutput('close')
    })

    const stdinPayload = JSON.stringify({
      instruction,
      context: executorContext,
      workspacePath,
      ...(executionScope ? { executionScope } : {}),
    })

    try {
      child.stdin.write(stdinPayload, () => {
        debugMainLog('runCommandExecutorTask:stdin-written', {
          requestId: requestId || undefined,
          bytes: Buffer.byteLength(stdinPayload),
        })
        armActivityTimeout()
        armMaterialProgressTimeout()
        emitEvent?.(
          'stdin enviado al executor',
          'Electron envió el payload al stdin del executor.',
          'info',
          {
            requestId: requestId || undefined,
            bytes: Buffer.byteLength(stdinPayload),
          },
        )
      })
      child.stdin.end(() => {
        debugMainLog('runCommandExecutorTask:stdin-ended', {
          requestId: requestId || undefined,
        })
        emitEvent?.(
          'stdin cerrado',
          'Electron cerró el stdin del executor.',
          'info',
          {
            requestId: requestId || undefined,
          },
        )
      })
    } catch (error) {
      debugMainLog('runCommandExecutorTask:stdin-write-error', {
        requestId: requestId || undefined,
        error: error instanceof Error ? error.message : String(error),
      })
      resolveBridgeError(
        error instanceof Error ? error.message : 'No se pudo escribir en stdin del executor',
        'stdin-write',
        {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      )
    }
  })
}

function runExecutorTask({
  instruction,
  context,
  workspacePath,
  executionScope,
  requestId,
  emitEvent,
}) {
  const executorModeResolution = resolveExecutorMode()
  const bridgeModeResolution = resolveExecutorBridgeMode()
  const executorCommandValue =
    executorModeResolution.mode === 'command' ? resolveExecutorCommandValue() : ''
  const runtimeMetadata = {
    executorMode: executorModeResolution.mode,
    executorModeSource: executorModeResolution.source,
    bridgeMode: bridgeModeResolution.mode,
    bridgeModeSource: bridgeModeResolution.source,
    executorCommand: executorCommandValue,
  }

  emitEvent?.(
    'runExecutorTask inició',
    'Electron entró a runExecutorTask.',
    'info',
    {
      requestId: requestId || undefined,
      executorMode: runtimeMetadata.executorMode,
      executorModeSource: runtimeMetadata.executorModeSource,
      bridgeMode: runtimeMetadata.bridgeMode,
      bridgeModeSource: runtimeMetadata.bridgeModeSource,
      executorCommand: runtimeMetadata.executorCommand || undefined,
    },
  )

  if (runtimeMetadata.executorMode === 'command') {
    return Promise.resolve(
      runCommandExecutorTask({
        instruction,
        context,
        workspacePath,
        executionScope,
        requestId,
        emitEvent,
      }),
    ).then(async (response) => {
      const responseWithRuntime = attachExecutorRuntimeMetadata(response, runtimeMetadata)
      const responseMaterializationPlan = extractLocalMaterializationPlan(
        responseWithRuntime,
      )

      if (responseWithRuntime?.ok !== true || !responseMaterializationPlan) {
        return responseWithRuntime
      }

      const localMaterializationTask = buildLocalDeterministicTaskFromPlan({
        plan: responseMaterializationPlan,
        workspacePath,
        requestId,
        instruction,
        brainStrategy:
          typeof responseWithRuntime?.details?.brainStrategy === 'string'
            ? responseWithRuntime.details.brainStrategy
            : '',
        materializationPlanSource: 'executor-response',
      })

      if (!localMaterializationTask) {
        return responseWithRuntime
      }

      emitEvent?.(
        'plan estructurado recibido',
        'Electron recibió un plan estructurado del executor y lo va a materializar localmente.',
        'info',
        {
          requestId: requestId || undefined,
          reasoningLayer: localMaterializationTask.reasoningLayer,
          materializationLayer: localMaterializationTask.materializationLayer,
          materializationPlanVersion: localMaterializationTask.planVersion,
          materializationPlanSource: localMaterializationTask.materializationPlanSource,
        },
      )

      const materializationResponse = await runLocalDeterministicTask(
        localMaterializationTask,
      )

      return attachExecutorRuntimeMetadata(
        mergeExecutorMaterializationResponse({
          executorResponse: responseWithRuntime,
          materializationResponse,
          task: localMaterializationTask,
        }),
        runtimeMetadata,
      )
    })
  }

  const mockResponse = attachExecutorRuntimeMetadata(
    runMockExecutorTask({ instruction, context, workspacePath }),
    runtimeMetadata,
  )
  emitEvent?.(
    'runExecutorTask devolvió respuesta final',
    'Electron devolvió una respuesta mock desde runExecutorTask.',
    mockResponse?.ok === false ? 'warning' : 'success',
    {
      requestId: requestId || undefined,
      ok: mockResponse?.ok === true,
      error: mockResponse?.error || undefined,
    },
  )
  return mockResponse
}

ipcMain.handle('ai-orchestrator:get-runtime-status', () => {
  const executorModeResolution = resolveExecutorMode()
  const bridgeModeResolution = resolveExecutorBridgeMode()

  return {
    ok: true,
    platform: process.platform,
    electron: process.versions.electron,
    node: process.versions.node,
    executorMode: executorModeResolution.mode,
    executorModeSource: executorModeResolution.source,
    bridgeMode: bridgeModeResolution.mode,
    bridgeModeSource: bridgeModeResolution.source,
    materializationLayer: 'local-deterministic',
    materializationPlanVersion: LOCAL_MATERIALIZATION_PLAN_VERSION,
    supportsStructuredMaterializationPlan: true,
  }
})

ipcMain.handle('ai-orchestrator:test-return', (_event, payload) => {
  const echoedRequestId =
    typeof payload?.requestId === 'string' ? payload.requestId.trim() : ''

  return {
    ok: true,
    ...(echoedRequestId ? { echoedRequestId } : {}),
    marker: 'test-return-ok',
  }
})

ipcMain.handle('ai-orchestrator:list-reusable-artifacts', async (_event, payload) => {
  return {
    ok: true,
    artifacts: await listReusableArtifacts({
      userDataPath: getArtifactMemoryUserDataPath(),
      filters: payload && typeof payload === 'object' ? payload : {},
    }),
  }
})

ipcMain.handle('ai-orchestrator:search-reusable-artifacts', async (_event, payload) => {
  return {
    ok: true,
    artifacts: await findSimilarReusableArtifacts({
      userDataPath: getArtifactMemoryUserDataPath(),
      query: payload && typeof payload === 'object' ? payload : {},
      limit:
        Number.isInteger(payload?.limit) && payload.limit > 0 ? payload.limit : 10,
    }),
  }
})

ipcMain.handle('ai-orchestrator:save-reusable-artifact', async (_event, payload) => {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      error: 'No se pudo guardar el artefacto reusable porque el payload es inválido.',
    }
  }

  return {
    ok: true,
    artifact: await saveReusableArtifact({
      userDataPath: getArtifactMemoryUserDataPath(),
      artifact: payload,
    }),
  }
})

ipcMain.handle('ai-orchestrator:plan-task', async (_event, payload) => {
  const goal = typeof payload?.goal === 'string' ? payload.goal.trim() : ''
  const context =
    typeof payload?.context === 'string' ? payload.context.trim() : ''
  const workspacePath =
    typeof payload?.workspacePath === 'string'
      ? payload.workspacePath.trim()
      : ''
  const requestedIteration = Number.isInteger(payload?.iteration)
    ? payload.iteration
    : 1
  const iteration = Math.max(1, requestedIteration)
  const previousExecutionResult =
    typeof payload?.previousExecutionResult === 'string'
      ? payload.previousExecutionResult.trim()
      : ''
  const projectState =
    payload?.projectState && typeof payload.projectState === 'object'
      ? payload.projectState
      : null
  const autonomyLevel =
    typeof payload?.autonomyLevel === 'string'
      ? payload.autonomyLevel.trim()
      : ''
  const costMode =
    typeof payload?.costMode === 'string' ? payload.costMode.trim() : ''
  const userParticipationMode = normalizeUserParticipationMode(
    payload?.userParticipationMode,
  )
  const routingHints =
    payload?.routingHints && typeof payload.routingHints === 'object'
      ? payload.routingHints
      : null
  const manualReusablePreference = normalizeManualReusablePreference(
    payload?.manualReusablePreference,
  )

  if (!goal) {
    return {
      ok: false,
      error: 'Objetivo vacío',
    }
  }

  const requiresApproval = detectSensitiveApprovalRequirement(goal, context)
  const iterationLabel = `Iteración ${iteration}`
  const contextHubPack = await fetchSuggestedContextHubPack()
  const contextHubStatus = summarizeContextHubPackForLog(contextHubPack)

  debugMainLog('plan-task:context-hub-pack', contextHubStatus)

  const strategicBrainResult = await requestStrategicBrainDecision({
    goal,
    context,
    workspacePath,
    iteration,
    previousExecutionResult,
    requiresApproval,
    projectState,
    autonomyLevel,
    costMode,
    userParticipationMode,
    routingHints,
    manualReusablePreference,
    contextHubPack,
  })
  const {
    adapter: brainAdapter,
    primaryAdapter: brainPrimaryAdapter,
    fallbackAdapter: brainFallbackAdapter,
    routingDecision: brainRoutingDecision,
    decision: brainDecision,
  } = strategicBrainResult
  const { instruction, completed } = brainDecision

  debugMainLog('plan-task:brain-adapter-decision', {
    adapterId: brainAdapter.id,
    adapterKind: brainAdapter.kind,
    primaryProvider: brainPrimaryAdapter?.id || undefined,
    fallbackProvider: brainFallbackAdapter?.id || undefined,
    costMode: brainRoutingDecision?.costMode || undefined,
    routingMode: brainRoutingDecision?.routingMode || undefined,
    providerReason: brainRoutingDecision?.reason || undefined,
    complexity: brainRoutingDecision?.complexity || undefined,
    ambiguity: brainRoutingDecision?.ambiguity || undefined,
    risk: brainRoutingDecision?.risk || undefined,
    impact: brainRoutingDecision?.impact || undefined,
    fallbackUsed: brainRoutingDecision?.fallbackUsed === true,
    decisionKey: brainDecision.decisionKey,
    strategy: brainDecision.strategy,
    executionMode: brainDecision.executionMode,
    businessSector: brainDecision.businessSector || undefined,
    creativeProfile: brainDecision.creativeDirection?.profileKey || undefined,
    originalityLevel:
      brainDecision.creativeDirection?.originalityLevel || undefined,
    reuseMode: brainDecision.reuseMode || undefined,
    reusableArtifactsFound:
      Number.isInteger(brainDecision.reusableArtifactsFound)
        ? brainDecision.reusableArtifactsFound
        : undefined,
    completed: brainDecision.completed === true,
    requiresApproval: brainDecision.requiresApproval === true,
    tasksCount: Array.isArray(brainDecision.tasks) ? brainDecision.tasks.length : 0,
  })

  const planningFinishedEventPayload = buildPlanningFinishedEventPayload({
    goal,
    context,
    instruction:
      instruction ||
      brainDecision.question ||
      (completed
        ? 'Confirmar el cierre de una acción sensible antes de finalizar el objetivo'
        : 'Revisar el impacto del cambio antes de continuar con la ejecución'),
    workspacePath,
    brainDecision,
    contextHubStatus,
  })
  const contextHubEventResult = await emitContextHubEvent(planningFinishedEventPayload)

  debugMainLog(
    'plan-task:context-hub-event',
    buildPlanningFinishedEventLogSummary({
      eventPayload: planningFinishedEventPayload,
      contextHubStatus,
      eventResult: contextHubEventResult,
    }),
  )

  if (brainDecision.requiresApproval === true) {
    return {
      ok: true,
      goal,
      instruction:
        brainDecision.question ||
        (completed
          ? 'Confirmar el cierre de una acción sensible antes de finalizar el objetivo'
          : 'Revisar el impacto del cambio antes de continuar con la ejecución'),
      completed,
      iterationLabel,
      approvalRequired: true,
      approvalReason:
        brainDecision.reason ||
        'El planificador detectó una acción sensible que requiere validación manual',
      strategy: brainDecision.strategy,
      executionMode: brainDecision.executionMode,
      businessSector: brainDecision.businessSector,
      businessSectorLabel: brainDecision.businessSectorLabel,
      creativeDirection: brainDecision.creativeDirection,
      reusableArtifactLookup: brainDecision.reusableArtifactLookup,
      reusableArtifactsFound: brainDecision.reusableArtifactsFound,
      reuseDecision: brainDecision.reuseDecision,
      reuseReason: brainDecision.reuseReason,
      reusedArtifactIds: brainDecision.reusedArtifactIds,
      reuseMode: brainDecision.reuseMode,
      productArchitecture: brainDecision.productArchitecture,
      safeFirstDeliveryPlan: brainDecision.safeFirstDeliveryPlan,
      safeFirstDeliveryMaterialization: brainDecision.safeFirstDeliveryMaterialization,
      executionScope: brainDecision.executionScope,
      decisionKey: brainDecision.decisionKey,
      reason: brainDecision.reason,
      tasks: brainDecision.tasks,
      assumptions: brainDecision.assumptions,
      question: brainDecision.question,
      approvalRequest: brainDecision.approvalRequest,
      nextExpectedAction: brainDecision.nextExpectedAction,
      contextHubStatus,
      brainRoutingDecision,
      brainPrimaryAdapter,
      brainFallbackAdapter,
      brainAdapter,
      brainDecision,
    }
  }

  return {
    ok: true,
    goal,
    instruction,
    completed,
    iterationLabel,
    approvalRequired: false,
    strategy: brainDecision.strategy,
    executionMode: brainDecision.executionMode,
    businessSector: brainDecision.businessSector,
    businessSectorLabel: brainDecision.businessSectorLabel,
    creativeDirection: brainDecision.creativeDirection,
    reusableArtifactLookup: brainDecision.reusableArtifactLookup,
    reusableArtifactsFound: brainDecision.reusableArtifactsFound,
    reuseDecision: brainDecision.reuseDecision,
    reuseReason: brainDecision.reuseReason,
    reusedArtifactIds: brainDecision.reusedArtifactIds,
    reuseMode: brainDecision.reuseMode,
    productArchitecture: brainDecision.productArchitecture,
    safeFirstDeliveryPlan: brainDecision.safeFirstDeliveryPlan,
    safeFirstDeliveryMaterialization: brainDecision.safeFirstDeliveryMaterialization,
    executionScope: brainDecision.executionScope,
    decisionKey: brainDecision.decisionKey,
    reason: brainDecision.reason,
    tasks: brainDecision.tasks,
    assumptions: brainDecision.assumptions,
    question: brainDecision.question,
    approvalRequest: brainDecision.approvalRequest,
    nextExpectedAction: brainDecision.nextExpectedAction,
    contextHubStatus,
    brainRoutingDecision,
    brainPrimaryAdapter,
    brainFallbackAdapter,
    brainAdapter,
    brainDecision,
  }
})

ipcMain.handle('ai-orchestrator:execute-task', (_event, payload) => {
  const instruction =
    typeof payload?.instruction === 'string' ? payload.instruction.trim() : ''
  const context =
    typeof payload?.context === 'string' ? payload.context.trim() : ''
  const workspacePath =
    typeof payload?.workspacePath === 'string'
      ? payload.workspacePath.trim()
      : ''
  const requestId =
    typeof payload?.requestId === 'string' ? payload.requestId.trim() : ''
  const decisionKey =
    typeof payload?.decisionKey === 'string' ? payload.decisionKey.trim() : ''
  const businessSector =
    typeof payload?.businessSector === 'string' ? payload.businessSector.trim() : ''
  const businessSectorLabel =
    typeof payload?.businessSectorLabel === 'string'
      ? payload.businessSectorLabel.trim()
      : ''
  const creativeDirection =
    payload?.creativeDirection && typeof payload.creativeDirection === 'object'
      ? payload.creativeDirection
      : null
  const reusableArtifactLookup =
    payload?.reusableArtifactLookup &&
    typeof payload.reusableArtifactLookup === 'object'
      ? payload.reusableArtifactLookup
      : null
  const reusableArtifactsFound =
    Number.isInteger(payload?.reusableArtifactsFound) && payload.reusableArtifactsFound >= 0
      ? payload.reusableArtifactsFound
      : 0
  const reuseDecision = payload?.reuseDecision === true
  const reuseReason =
    typeof payload?.reuseReason === 'string' ? payload.reuseReason.trim() : ''
  const reusedArtifactIds = Array.isArray(payload?.reusedArtifactIds)
    ? payload.reusedArtifactIds
        .filter((artifactId) => typeof artifactId === 'string' && artifactId.trim())
        .map((artifactId) => artifactId.trim())
    : []
  const reuseMode =
    typeof payload?.reuseMode === 'string' ? payload.reuseMode.trim() : 'none'
  const executionScope = normalizeExecutorExecutionScope(payload?.executionScope)
  const safeFirstDeliveryMaterialization =
    payload?.safeFirstDeliveryMaterialization &&
    typeof payload.safeFirstDeliveryMaterialization === 'object'
      ? payload.safeFirstDeliveryMaterialization
      : null
  const materializationPlan =
    payload?.materializationPlan && typeof payload.materializationPlan === 'object'
      ? payload.materializationPlan
      : null
  const requiresLocalSafeFirstDeliveryMaterialization =
    isMaterializeSafeFirstDeliveryDecisionKey(decisionKey)
  const derivedMaterializationPlan =
    materializationPlan ||
    !executionScope ||
    !requiresLocalSafeFirstDeliveryMaterialization
        ? null
      : buildDerivedLocalMaterializationPlan({
          decisionKey,
          instruction,
          executionScope,
          businessSector,
          businessSectorLabel,
          safeFirstDeliveryMaterialization,
        })
  debugMainLog('execute-task:handler-enter', {
    requestId: requestId || undefined,
    decisionKey: decisionKey || undefined,
    hasInstruction: Boolean(instruction),
    hasContext: Boolean(context),
    hasWorkspacePath: Boolean(workspacePath),
    businessSector: businessSector || undefined,
    creativeProfile: creativeDirection?.profileKey || undefined,
    reuseMode: reuseMode || undefined,
    objectiveScope: executionScope?.objectiveScope || undefined,
    allowedTargetPathsCount: executionScope?.allowedTargetPaths?.length || 0,
    hasSafeFirstDeliveryMaterialization: safeFirstDeliveryMaterialization !== null,
    materializationPlanSource: materializationPlan
      ? 'renderer-payload'
      : derivedMaterializationPlan
        ? 'derived-local-rules'
        : undefined,
  })

  if (!instruction) {
    return {
      ok: false,
      accepted: false,
      error: 'Instrucción vacía',
      ...(requestId ? { requestId } : {}),
    }
  }

  const webContents = _event.sender

  void (async () => {
    try {
      let forcedLocalTask = null

      if (requiresLocalSafeFirstDeliveryMaterialization) {
        debugMainLog('materialize-safe-first-delivery:local-plan-attempt', {
          requestId: requestId || undefined,
          decisionKey,
          allowedTargetPathsCount: executionScope?.allowedTargetPaths?.length || 0,
          hasRendererPlan: materializationPlan !== null,
        })

        if (!materializationPlan && !derivedMaterializationPlan) {
          const reason = buildMaterializeSafeFirstDeliveryLocalPlanSkipReason({
            executionScope,
            instruction,
          })
          debugMainLog('materialize-safe-first-delivery:local-plan-skipped', {
            requestId: requestId || undefined,
            decisionKey,
            reason,
            allowedTargetPaths: executionScope?.allowedTargetPaths || [],
          })
          const localFailureResponse = buildExecuteTaskCompletionPayload(
            enrichExecutorFailureResponseWithHistory({
              response: buildMaterializeSafeFirstDeliveryLocalFailureResponse({
                requestId,
                instruction,
                decisionKey,
                executionScope,
                reason,
              }),
              requestId,
              instruction,
              workspacePath,
              businessSector,
              businessSectorLabel,
              decisionKey,
            }),
            requestId,
          )
          emitExecutionFailedEventBestEffort({
            finalResponse: localFailureResponse,
            requestId,
            instruction,
            workspacePath,
            decisionKey,
          })
          debugMainLog('execute-task:before-fast-route-completion-event', {
            requestId: requestId || localFailureResponse?.requestId,
            ok: false,
            operation: 'materialize-safe-first-delivery-plan',
            targetPath: executionScope?.allowedTargetPaths?.[0] || undefined,
          })
          emitExecutionCompleteEvent(webContents, localFailureResponse)
          debugMainLog('execute-task:fast-route-completion-event-emitted', {
            requestId: requestId || localFailureResponse?.requestId,
            ok: false,
            operation: 'materialize-safe-first-delivery-plan',
          })
          return
        }

        forcedLocalTask = buildLocalDeterministicTaskFromPlan({
          plan: materializationPlan || derivedMaterializationPlan,
          workspacePath,
          requestId,
          instruction,
          businessSector,
          businessSectorLabel,
          creativeDirection,
          reusableArtifactLookup,
          reusableArtifactsFound,
          reuseDecision,
          reuseReason,
          reusedArtifactIds,
          reuseMode,
          materializationPlanSource: materializationPlan
            ? 'renderer-payload'
            : derivedMaterializationPlan
              ? 'derived-local-rules'
              : '',
        })

        if (!forcedLocalTask) {
          const reason = buildMaterializeSafeFirstDeliveryLocalPlanSkipReason({
            executionScope,
            instruction,
          })
          debugMainLog('materialize-safe-first-delivery:local-plan-skipped', {
            requestId: requestId || undefined,
            decisionKey,
            reason,
            allowedTargetPaths: executionScope?.allowedTargetPaths || [],
          })
          const localFailureResponse = buildExecuteTaskCompletionPayload(
            enrichExecutorFailureResponseWithHistory({
              response: buildMaterializeSafeFirstDeliveryLocalFailureResponse({
                requestId,
                instruction,
                decisionKey,
                executionScope,
                reason,
              }),
              requestId,
              instruction,
              workspacePath,
              businessSector,
              businessSectorLabel,
              decisionKey,
            }),
            requestId,
          )
          emitExecutionFailedEventBestEffort({
            finalResponse: localFailureResponse,
            requestId,
            instruction,
            workspacePath,
            decisionKey,
          })
          debugMainLog('execute-task:before-fast-route-completion-event', {
            requestId: requestId || localFailureResponse?.requestId,
            ok: false,
            operation: 'materialize-safe-first-delivery-plan',
            targetPath: executionScope?.allowedTargetPaths?.[0] || undefined,
          })
          emitExecutionCompleteEvent(webContents, localFailureResponse)
          debugMainLog('execute-task:fast-route-completion-event-emitted', {
            requestId: requestId || localFailureResponse?.requestId,
            ok: false,
            operation: 'materialize-safe-first-delivery-plan',
          })
          return
        }

        debugMainLog('materialize-safe-first-delivery:local-plan-built', {
          requestId: requestId || undefined,
          decisionKey,
          operationsCount: Array.isArray(forcedLocalTask.operations)
            ? forcedLocalTask.operations.length
            : 0,
          validationsCount: Array.isArray(forcedLocalTask.validations)
            ? forcedLocalTask.validations.length
            : 0,
          targetPath: forcedLocalTask.relativeTargetPath || undefined,
        })
      }

      const fastTask =
        forcedLocalTask ||
        detectWebScaffoldBaseLocalTask({
          instruction,
          context,
          workspacePath,
          requestId,
          businessSector,
          businessSectorLabel,
          creativeDirection,
          reusableArtifactLookup,
          reusableArtifactsFound,
          reuseDecision,
          reuseReason,
          reusedArtifactIds,
          reuseMode,
          executionScope,
        }) ||
        detectFastCompositeLocalTask({
          instruction,
          context,
          workspacePath,
          requestId,
        }) ||
        detectFastLocalTask({
          instruction,
          context,
          workspacePath,
          requestId,
        })

      if (fastTask) {
        const operationLabel = getFastTaskOperationLabel(fastTask.type)
        const fastTaskTracePayload = buildFastLocalTracePayload(fastTask)

        debugMainLog('execute-task:fast-route-detected', {
          requestId: requestId || undefined,
          operation: fastTask.type,
          targetPath: fastTask.relativeTargetPath,
        })
        emitExecutionEvent(webContents, {
          requestId: requestId || undefined,
          source: 'orquestador',
          title: 'Ruta rápida detectada',
          content:
            `Electron detectó una ${operationLabel} y la resolverá localmente sin enviar la tarea a Codex.`,
          status: 'info',
          raw: JSON.stringify(fastTaskTracePayload, null, 2),
        })

        const fastRouteResponse = enrichExecutorFailureResponseWithHistory({
          response: await runFastLocalTask(fastTask),
          requestId,
          instruction,
          workspacePath,
          businessSector,
          businessSectorLabel,
          decisionKey,
        })

        if (fastRouteResponse?.ok === true) {
          const reusableArtifact = buildReusableArtifactFromWebScaffold({
            requestId,
            instruction,
            context,
            workspacePath,
            businessSector,
            businessSectorLabel,
            creativeDirection,
            fastTask,
            response: fastRouteResponse,
          })

          if (reusableArtifact) {
            try {
              if (!isReusableArtifactTrusted(reusableArtifact)) {
                debugMainLog('execute-task:artifact-memory-skipped-temporary-source', {
                  requestId: requestId || undefined,
                  localPath: reusableArtifact.localPath || undefined,
                  workspacePath: reusableArtifact.metadata?.workspacePath || undefined,
                })
              } else {
                const savedArtifact = await saveReusableArtifact({
                  userDataPath: getArtifactMemoryUserDataPath(),
                  artifact: reusableArtifact,
                })
                const preview = await captureReusableArtifactPreview({
                  artifact: savedArtifact,
                  userDataPath: getArtifactMemoryUserDataPath(),
                })
                const artifactWithPreview = await saveReusableArtifact({
                  userDataPath: getArtifactMemoryUserDataPath(),
                  artifact: {
                    ...savedArtifact,
                    preview,
                  },
                })

                debugMainLog('execute-task:artifact-memory-saved', {
                  requestId: requestId || undefined,
                  artifactId: artifactWithPreview.id,
                  type: artifactWithPreview.type,
                  sector: artifactWithPreview.sector || undefined,
                  visualStyle: artifactWithPreview.visualStyle || undefined,
                  localPath: artifactWithPreview.localPath || undefined,
                  previewStatus: artifactWithPreview.preview?.status || undefined,
                  previewPath: artifactWithPreview.preview?.imagePath || undefined,
                })
              }
            } catch (artifactError) {
              // La memoria reusable es best-effort: si falla, no debe contaminar
              // la corrida principal ni el cierre que ya resolvió la ejecución.
              debugMainLog('execute-task:artifact-memory-save-failed', {
                requestId: requestId || undefined,
                error:
                  artifactError instanceof Error
                    ? artifactError.message
                    : String(artifactError),
              })
            }
          }
        }

        emitExecutionEvent(webContents, {
          requestId: requestId || undefined,
          source: 'orquestador',
          title:
            fastRouteResponse?.ok === true
              ? 'Ruta rápida completada'
              : 'Ruta rápida interrumpida',
          content:
            fastRouteResponse?.ok === true
              ? `Electron completó localmente la ${operationLabel} y cerrará la ejecución con el resultado final.`
              : `Electron interrumpió localmente la ${operationLabel} y devolverá un error claro al cerrar la ejecución.`,
          status: fastRouteResponse?.ok === true ? 'success' : 'error',
          raw: JSON.stringify(
            buildFastLocalTracePayload(fastTask, {
              result: fastRouteResponse.result,
              resultPreview: fastRouteResponse.resultPreview,
              error: fastRouteResponse.error,
              stepResults: fastRouteResponse.stepResults,
            }),
            null,
            2,
          ),
        })

        const finalFastRouteResponse = buildExecuteTaskCompletionPayload(
          fastRouteResponse,
          requestId,
        )
        emitExecutionFinishedEventBestEffort({
          finalResponse: finalFastRouteResponse,
          requestId,
          instruction,
          workspacePath,
          decisionKey,
        })
        emitExecutionFailedEventBestEffort({
          finalResponse: finalFastRouteResponse,
          requestId,
          instruction,
          workspacePath,
          decisionKey,
        })
        debugMainLog('execute-task:before-fast-route-completion-event', {
          requestId: requestId || finalFastRouteResponse?.requestId,
          ok: finalFastRouteResponse?.ok === true,
          operation: fastTask.type,
          targetPath: fastTask.relativeTargetPath,
        })
        emitExecutionCompleteEvent(webContents, finalFastRouteResponse)
        debugMainLog('execute-task:fast-route-completion-event-emitted', {
          requestId: requestId || finalFastRouteResponse?.requestId,
          ok: finalFastRouteResponse?.ok === true,
          operation: fastTask.type,
        })
        return
      }

      debugMainLog('execute-task:before-runExecutorTask', {
        requestId: requestId || undefined,
      })
      const executorResponse = enrichExecutorFailureResponseWithHistory({
        response: await Promise.resolve(
          runExecutorTask({
            instruction,
            context,
            workspacePath,
            executionScope,
            requestId,
            emitEvent: (title, content, status = 'info', raw) => {
              emitExecutionEvent(webContents, {
                requestId: requestId || undefined,
                source: 'executor',
                title,
                content,
                status,
                ...(raw ? { raw: JSON.stringify(raw, null, 2) } : {}),
              })
            },
          }),
        ),
        requestId,
        instruction,
        workspacePath,
        businessSector,
        businessSectorLabel,
        decisionKey,
      })
      debugMainLog('execute-task:after-runExecutorTask', {
        requestId: requestId || executorResponse?.requestId,
        ok: executorResponse?.ok === true,
        error: executorResponse?.error || undefined,
        traceLength: Array.isArray(executorResponse?.trace)
          ? executorResponse.trace.length
          : 0,
      })

      const finalResponse = buildExecuteTaskCompletionPayload(
        executorResponse,
        requestId,
      )
      emitExecutionFinishedEventBestEffort({
        finalResponse,
        requestId,
        instruction,
        workspacePath,
        decisionKey,
      })
      emitExecutionFailedEventBestEffort({
        finalResponse,
        requestId,
        instruction,
        workspacePath,
        decisionKey,
      })
      debugMainLog('execute-task:before-completion-event', {
        requestId: requestId || finalResponse?.requestId,
        ok: finalResponse?.ok === true,
        error: finalResponse?.error || undefined,
      })
      emitExecutionCompleteEvent(webContents, finalResponse)
      debugMainLog('execute-task:completion-event-emitted', {
        requestId: requestId || finalResponse?.requestId,
        ok: finalResponse?.ok === true,
        error: finalResponse?.error || undefined,
      })
    } catch (error) {
      const progressSnapshot = getExecutorProgressSnapshot(requestId)
      const failureType = classifyExecutorFailure({
        origin: 'execute-task-catch',
        errorMessage: error instanceof Error ? error.message : String(error),
        progressSnapshot,
        stdout: progressSnapshot?.stdout || '',
        stderr: progressSnapshot?.stderr || '',
        instruction,
      })
      const finalErrorResponse = buildExecuteTaskCompletionPayload(
        enrichExecutorFailureResponseWithHistory({
          response: {
            ok: false,
            error: 'Error inesperado al ejecutar la tarea desde Electron',
            failureType,
            details: {
              failureType,
              ...(progressSnapshot || {}),
              errorMessage: error instanceof Error ? error.message : String(error),
            },
          },
          requestId,
          instruction,
          workspacePath,
          businessSector,
          businessSectorLabel,
          decisionKey,
        }),
        requestId,
      )
      emitExecutionFailedEventBestEffort({
        finalResponse: finalErrorResponse,
        requestId,
        instruction,
        workspacePath,
        decisionKey,
      })
      debugMainLog('execute-task:before-completion-error-event', {
        requestId: requestId || finalErrorResponse?.requestId,
        error: finalErrorResponse?.error || undefined,
      })
      emitExecutionCompleteEvent(webContents, finalErrorResponse)
      debugMainLog('execute-task:completion-error-event-emitted', {
        requestId: requestId || finalErrorResponse?.requestId,
        error: finalErrorResponse?.error || undefined,
      })
    }
  })()

  const acceptedAck = buildExecuteTaskAcceptedAck(requestId)
  debugMainLog('execute-task:ack-return', {
    requestId: requestId || acceptedAck?.requestId,
    ok: acceptedAck?.ok === true,
    accepted: acceptedAck?.accepted === true,
  })

  return acceptedAck
})

app.whenReady().then(async () => {
  try {
    await ensureArtifactMemoryStorage({
      userDataPath: getArtifactMemoryUserDataPath(),
    })
  } catch (error) {
    debugMainLog('artifact-memory:init-failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
