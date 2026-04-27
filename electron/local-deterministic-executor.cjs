const fs = require('fs')
const path = require('path')

const LOCAL_MATERIALIZATION_PLAN_VERSION = 1
const VALID_OPERATION_TYPES = new Set([
  'create-folder',
  'create-file',
  'replace-file',
  'append-file',
])
const VALIDATION_TYPES = new Set(['exists', 'file-contains'])

function buildOutputPreview(text, maxLength = 240) {
  if (typeof text !== 'string') {
    return ''
  }

  const normalizedText = text.trim().replace(/\s+/g, ' ')

  if (!normalizedText) {
    return ''
  }

  return normalizedText.length > maxLength
    ? `${normalizedText.slice(0, Math.max(0, maxLength - 3))}...`
    : normalizedText
}

function summarizeUniquePaths(entries, limit = 200) {
  if (!Array.isArray(entries)) {
    return []
  }

  const uniqueEntries = []
  const seenEntries = new Set()

  for (const entry of entries) {
    if (typeof entry !== 'string' || !entry.trim()) {
      continue
    }

    const trimmedEntry = path.normalize(entry.trim())
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

function resolveWorkspaceTarget(workspacePath, requestedTargetPath) {
  if (
    typeof workspacePath !== 'string' ||
    !workspacePath.trim() ||
    typeof requestedTargetPath !== 'string' ||
    !requestedTargetPath.trim()
  ) {
    return null
  }

  const resolvedWorkspacePath = path.resolve(workspacePath.trim())
  const normalizedTargetPath = requestedTargetPath.trim()
  const resolvedTargetPath = path.resolve(resolvedWorkspacePath, normalizedTargetPath)

  if (!isPathInsideWorkspace(resolvedWorkspacePath, resolvedTargetPath)) {
    return null
  }

  return {
    relativeTargetPath: path.relative(resolvedWorkspacePath, resolvedTargetPath) || '.',
    resolvedTargetPath,
  }
}

function normalizeOperationType(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  if (normalizedValue === 'create') {
    return 'create-file'
  }

  if (normalizedValue === 'replace' || normalizedValue === 'write-file') {
    return 'replace-file'
  }

  if (normalizedValue === 'append') {
    return 'append-file'
  }

  return VALID_OPERATION_TYPES.has(normalizedValue) ? normalizedValue : ''
}

function normalizePlanFileOperation(fileEntry) {
  if (!fileEntry || typeof fileEntry !== 'object') {
    return null
  }

  const targetPath =
    typeof fileEntry.targetPath === 'string' && fileEntry.targetPath.trim()
      ? fileEntry.targetPath.trim()
      : typeof fileEntry.path === 'string' && fileEntry.path.trim()
        ? fileEntry.path.trim()
        : ''

  if (!targetPath) {
    return null
  }

  const operationType =
    normalizeOperationType(fileEntry.operation || fileEntry.type || fileEntry.mode) ||
    'create-file'
  const content =
    typeof fileEntry.content === 'string'
      ? fileEntry.content
      : typeof fileEntry.nextContent === 'string'
        ? fileEntry.nextContent
        : typeof fileEntry.initialContent === 'string'
          ? fileEntry.initialContent
          : ''

  return {
    type: operationType,
    targetPath,
    ...(operationType === 'append-file'
      ? { appendContent: content }
      : operationType === 'replace-file'
        ? { nextContent: content }
        : { initialContent: content }),
  }
}

function normalizeValidationType(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  if (normalizedValue === 'contains' || normalizedValue === 'content-includes') {
    return 'file-contains'
  }

  return VALIDATION_TYPES.has(normalizedValue) ? normalizedValue : ''
}

function normalizePlanValidation(validationEntry) {
  if (!validationEntry || typeof validationEntry !== 'object') {
    return null
  }

  const type = normalizeValidationType(validationEntry.type)
  const targetPath =
    typeof validationEntry.targetPath === 'string' && validationEntry.targetPath.trim()
      ? validationEntry.targetPath.trim()
      : typeof validationEntry.path === 'string' && validationEntry.path.trim()
        ? validationEntry.path.trim()
        : ''

  if (!type || !targetPath) {
    return null
  }

  return {
    type,
    targetPath,
    ...(type === 'exists'
      ? {
          expectedKind:
            validationEntry.expectedKind === 'folder' ||
            validationEntry.expectedKind === 'file'
              ? validationEntry.expectedKind
              : validationEntry.kind === 'folder' || validationEntry.kind === 'file'
                ? validationEntry.kind
                : undefined,
        }
      : {}),
    ...(type === 'file-contains' &&
    typeof validationEntry.expectedText === 'string' &&
    validationEntry.expectedText
      ? { expectedText: validationEntry.expectedText }
      : type === 'file-contains' &&
          typeof validationEntry.contains === 'string' &&
          validationEntry.contains
        ? { expectedText: validationEntry.contains }
        : {}),
  }
}

function normalizeMaterializationPlan(plan) {
  if (!plan || typeof plan !== 'object') {
    return null
  }

  const normalizedFolders = []
  const folderCandidates = [
    ...(Array.isArray(plan.folders) ? plan.folders : []),
    ...(Array.isArray(plan.directories) ? plan.directories : []),
    ...(Array.isArray(plan.foldersToCreate) ? plan.foldersToCreate : []),
  ]

  folderCandidates.forEach((entry) => {
    const targetPath =
      typeof entry === 'string'
        ? entry.trim()
        : entry && typeof entry === 'object' && typeof entry.targetPath === 'string'
          ? entry.targetPath.trim()
          : entry && typeof entry === 'object' && typeof entry.path === 'string'
            ? entry.path.trim()
            : ''

    if (!targetPath) {
      return
    }

    normalizedFolders.push({
      type: 'create-folder',
      targetPath,
    })
  })

  const normalizedOperations = [
    ...(Array.isArray(plan.operations)
      ? plan.operations
          .map((entry) => {
            if (!entry || typeof entry !== 'object') {
              return null
            }

            const type = normalizeOperationType(entry.type || entry.operation || entry.mode)
            const targetPath =
              typeof entry.targetPath === 'string' && entry.targetPath.trim()
                ? entry.targetPath.trim()
                : typeof entry.path === 'string' && entry.path.trim()
                  ? entry.path.trim()
                  : ''

            if (!type || !targetPath) {
              return null
            }

            return {
              type,
              targetPath,
              ...(type === 'append-file'
                ? {
                    appendContent:
                      typeof entry.appendContent === 'string'
                        ? entry.appendContent
                        : typeof entry.content === 'string'
                          ? entry.content
                          : '',
                  }
                : type === 'replace-file'
                  ? {
                      nextContent:
                        typeof entry.nextContent === 'string'
                          ? entry.nextContent
                          : typeof entry.content === 'string'
                            ? entry.content
                            : '',
                    }
                  : type === 'create-file'
                    ? {
                        initialContent:
                          typeof entry.initialContent === 'string'
                            ? entry.initialContent
                            : typeof entry.content === 'string'
                              ? entry.content
                              : '',
                      }
                    : {}),
            }
          })
          .filter(Boolean)
      : []),
    ...(Array.isArray(plan.files) ? plan.files.map(normalizePlanFileOperation).filter(Boolean) : []),
  ]

  const operations = [...normalizedFolders, ...normalizedOperations]

  if (operations.length === 0) {
    return null
  }

  const validations =
    Array.isArray(plan.validations) && plan.validations.length > 0
      ? plan.validations.map(normalizePlanValidation).filter(Boolean)
      : operations
          .map((operation) => ({
            type: 'exists',
            targetPath: operation.targetPath,
            expectedKind: operation.type === 'create-folder' ? 'folder' : 'file',
          }))
          .filter(Boolean)

  return {
    version:
      Number.isInteger(plan.version) && plan.version > 0
        ? plan.version
        : LOCAL_MATERIALIZATION_PLAN_VERSION,
    kind:
      typeof plan.kind === 'string' && plan.kind.trim()
        ? plan.kind.trim()
        : 'local-materialization',
    summary:
      typeof plan.summary === 'string' && plan.summary.trim() ? plan.summary.trim() : '',
    strategy:
      typeof plan.strategy === 'string' && plan.strategy.trim() ? plan.strategy.trim() : '',
    reasoningLayer:
      typeof plan.reasoningLayer === 'string' && plan.reasoningLayer.trim()
        ? plan.reasoningLayer.trim()
        : '',
    materializationLayer:
      typeof plan.materializationLayer === 'string' && plan.materializationLayer.trim()
        ? plan.materializationLayer.trim()
        : 'local-deterministic',
    operations,
    validations,
  }
}

function getLocalDeterministicOperationLabel(taskType) {
  switch (taskType) {
    case 'materialization-plan':
      return 'materializacion local deterministica'
    case 'create-folder':
      return 'creacion de carpeta'
    case 'create-file':
      return 'creacion de archivo'
    case 'replace-file':
      return 'reemplazo total de archivo'
    case 'append-file':
      return 'append al final de archivo'
    default:
      return 'operacion local'
  }
}

function buildLocalMaterializationTask({
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
  const normalizedPlan = normalizeMaterializationPlan(plan)

  if (!normalizedPlan) {
    return null
  }

  const normalizedWorkspacePath =
    typeof workspacePath === 'string' && workspacePath.trim() ? workspacePath.trim() : ''

  if (!normalizedWorkspacePath) {
    return null
  }

  const operations = []
  for (const [index, operation] of normalizedPlan.operations.entries()) {
    const target = resolveWorkspaceTarget(normalizedWorkspacePath, operation.targetPath)

    if (!target) {
      return null
    }

    operations.push({
      ...operation,
      stepIndex: index + 1,
      ...target,
    })
  }

  const validations = []
  for (const validation of normalizedPlan.validations) {
    const target = resolveWorkspaceTarget(normalizedWorkspacePath, validation.targetPath)

    if (!target) {
      return null
    }

    validations.push({
      ...validation,
      ...target,
    })
  }

  const primaryTargetPath =
    operations[0]?.relativeTargetPath ||
    validations[0]?.relativeTargetPath ||
    '.'

  return {
    type: 'materialization-plan',
    requestId: requestId || undefined,
    instruction,
    relativeTargetPath: primaryTargetPath,
    workspacePath: path.resolve(normalizedWorkspacePath),
    planVersion: normalizedPlan.version,
    planKind: normalizedPlan.kind,
    planSummary: normalizedPlan.summary || undefined,
    reasoningLayer: normalizedPlan.reasoningLayer || 'local-rules',
    materializationLayer: normalizedPlan.materializationLayer || 'local-deterministic',
    materializationPlanSource: materializationPlanSource || 'inline',
    operations,
    validations,
    brainStrategy: brainStrategy || normalizedPlan.strategy || undefined,
    businessSector: businessSector || undefined,
    businessSectorLabel: businessSectorLabel || undefined,
    creativeDirection: creativeDirection || undefined,
    reusableArtifactLookup: reusableArtifactLookup || undefined,
    reusableArtifactsFound:
      Number.isInteger(reusableArtifactsFound) && reusableArtifactsFound >= 0
        ? reusableArtifactsFound
        : undefined,
    reuseDecision: reuseDecision === true,
    reuseReason: reuseReason || undefined,
    reusedArtifactIds: Array.isArray(reusedArtifactIds) ? reusedArtifactIds : [],
    reuseMode: reuseMode || 'none',
    reuseMaterialization: reuseMaterialization || undefined,
  }
}

function capturePathState(targetPath) {
  try {
    const stats = fs.statSync(targetPath)

    return {
      exists: true,
      type: stats.isDirectory() ? 'folder' : 'file',
      mtimeMs: Number(stats.mtimeMs) || 0,
      size: stats.isFile() ? Number(stats.size) || 0 : 0,
    }
  } catch {
    return {
      exists: false,
      type: 'missing',
      mtimeMs: 0,
      size: 0,
    }
  }
}

async function applyMaterializationOperation(operation) {
  switch (operation.type) {
    case 'create-folder':
      await fs.promises.mkdir(operation.resolvedTargetPath, { recursive: true })
      return
    case 'create-file':
      await fs.promises.mkdir(path.dirname(operation.resolvedTargetPath), {
        recursive: true,
      })
      await fs.promises.writeFile(
        operation.resolvedTargetPath,
        operation.initialContent || '',
        'utf8',
      )
      return
    case 'replace-file':
      await fs.promises.mkdir(path.dirname(operation.resolvedTargetPath), {
        recursive: true,
      })
      await fs.promises.writeFile(
        operation.resolvedTargetPath,
        operation.nextContent || '',
        'utf8',
      )
      return
    case 'append-file':
      await fs.promises.mkdir(path.dirname(operation.resolvedTargetPath), {
        recursive: true,
      })
      await fs.promises.appendFile(
        operation.resolvedTargetPath,
        operation.appendContent || '',
        'utf8',
      )
      return
    default:
      throw new Error(`Operacion local no soportada: ${operation.type}`)
  }
}

async function runPlanValidations(validations) {
  const validationResults = []

  for (const validation of validations) {
    if (validation.type === 'exists') {
      try {
        const stats = await fs.promises.stat(validation.resolvedTargetPath)
        const detectedKind = stats.isDirectory() ? 'folder' : 'file'

        if (validation.expectedKind && detectedKind !== validation.expectedKind) {
          return {
            ok: false,
            validationResults: [
              ...validationResults,
              {
                type: validation.type,
                targetPath: validation.relativeTargetPath,
                ok: false,
                reason: `Se esperaba ${validation.expectedKind} y se encontro ${detectedKind}.`,
              },
            ],
          }
        }

        validationResults.push({
          type: validation.type,
          targetPath: validation.relativeTargetPath,
          ok: true,
        })
      } catch (error) {
        if (error && typeof error === 'object' && error.code === 'ENOENT') {
          return {
            ok: false,
            validationResults: [
              ...validationResults,
              {
                type: validation.type,
                targetPath: validation.relativeTargetPath,
                ok: false,
                reason: 'No existe al finalizar la materializacion.',
              },
            ],
          }
        }

        throw error
      }

      continue
    }

    if (validation.type === 'file-contains') {
      const fileContent = await fs.promises.readFile(validation.resolvedTargetPath, 'utf8')

      if (
        typeof validation.expectedText === 'string' &&
        validation.expectedText &&
        !fileContent.includes(validation.expectedText)
      ) {
        return {
          ok: false,
          validationResults: [
            ...validationResults,
            {
              type: validation.type,
              targetPath: validation.relativeTargetPath,
              ok: false,
              reason: 'El contenido final no incluye el texto esperado.',
            },
          ],
        }
      }

      validationResults.push({
        type: validation.type,
        targetPath: validation.relativeTargetPath,
        ok: true,
      })
    }
  }

  return {
    ok: true,
    validationResults,
  }
}

function diffPathStates(beforeStates, afterStates) {
  const createdPaths = []
  const touchedPaths = []

  for (const [targetPath, afterState] of afterStates.entries()) {
    const beforeState = beforeStates.get(targetPath) || {
      exists: false,
      type: 'missing',
      mtimeMs: 0,
      size: 0,
    }

    if (!beforeState.exists && afterState.exists) {
      createdPaths.push(targetPath)
      touchedPaths.push(targetPath)
      continue
    }

    if (
      afterState.exists &&
      (beforeState.type !== afterState.type ||
        beforeState.mtimeMs !== afterState.mtimeMs ||
        beforeState.size !== afterState.size)
    ) {
      touchedPaths.push(targetPath)
    }
  }

  return {
    createdPaths: summarizeUniquePaths(createdPaths),
    touchedPaths: summarizeUniquePaths(touchedPaths),
  }
}

async function runLocalDeterministicTask(task) {
  if (!task || task.type !== 'materialization-plan') {
    return {
      ok: false,
      ...(task?.requestId ? { requestId: task.requestId } : {}),
      instruction: task?.instruction,
      error: 'No se pudo ejecutar el plan local deterministico solicitado.',
    }
  }

  const trackedPaths = summarizeUniquePaths([
    ...task.operations.map((operation) => operation.resolvedTargetPath),
    ...task.validations.map((validation) => validation.resolvedTargetPath),
  ])
  const beforeStates = new Map(
    trackedPaths.map((targetPath) => [targetPath, capturePathState(targetPath)]),
  )
  const stepResults = []

  try {
    for (const operation of task.operations) {
      await applyMaterializationOperation(operation)
      stepResults.push({
        step: operation.stepIndex,
        operation: operation.type,
        operationLabel: getLocalDeterministicOperationLabel(operation.type),
        targetPath: operation.relativeTargetPath,
      })
    }

    const validationOutcome = await runPlanValidations(task.validations)
    const afterStates = new Map(
      trackedPaths.map((targetPath) => [targetPath, capturePathState(targetPath)]),
    )
    const filesystemDiff = diffPathStates(beforeStates, afterStates)

    if (validationOutcome.ok !== true) {
      return {
        ok: false,
        ...(task.requestId ? { requestId: task.requestId } : {}),
        instruction: task.instruction,
        reasoningLayer: task.reasoningLayer,
        materializationLayer: task.materializationLayer,
        error: 'La materializacion local termino, pero fallo una validacion final.',
        resultPreview: 'La validacion final de la materializacion local fallo.',
        details: {
          reasoningLayer: task.reasoningLayer,
          materializationLayer: task.materializationLayer,
          materializationPlanVersion: task.planVersion,
          materializationPlanSource: task.materializationPlanSource,
          currentAction: 'validation',
          currentTargetPath: validationOutcome.validationResults.at(-1)?.targetPath,
          createdPaths: filesystemDiff.createdPaths,
          touchedPaths: filesystemDiff.touchedPaths,
          hasMaterialProgress:
            filesystemDiff.createdPaths.length > 0 ||
            filesystemDiff.touchedPaths.length > 0,
          materialState: 'local-deterministic-validation-failed',
          validationResults: validationOutcome.validationResults,
        },
      }
    }
    const summaryTarget = task.relativeTargetPath === '.' ? 'workspace' : task.relativeTargetPath
    const summary =
      task.planSummary ||
      `Plan local deterministico aplicado sobre "${summaryTarget}".`

    return {
      ok: true,
      ...(task.requestId ? { requestId: task.requestId } : {}),
      instruction: task.instruction,
      reasoningLayer: task.reasoningLayer,
      materializationLayer: task.materializationLayer,
      result:
        `${summary}\n` +
        `Operaciones aplicadas: ${task.operations.length}. Validaciones: ${task.validations.length}.`,
      resultPreview: buildOutputPreview(summary),
      details: {
        strategy: 'local-deterministic-materialization',
        ...(typeof task.brainStrategy === 'string' && task.brainStrategy
          ? { brainStrategy: task.brainStrategy }
          : {}),
        ...(typeof task.businessSector === 'string' && task.businessSector
          ? { businessSector: task.businessSector }
          : {}),
        ...(typeof task.businessSectorLabel === 'string' && task.businessSectorLabel
          ? { businessSectorLabel: task.businessSectorLabel }
          : {}),
        reasoningLayer: task.reasoningLayer,
        materializationLayer: task.materializationLayer,
        materializationPlanVersion: task.planVersion,
        materializationPlanSource: task.materializationPlanSource,
        currentAction: 'materialization-plan',
        currentTargetPath:
          filesystemDiff.touchedPaths.at(-1) ||
          filesystemDiff.createdPaths.at(-1) ||
          task.operations.at(-1)?.resolvedTargetPath ||
          undefined,
        createdPaths: filesystemDiff.createdPaths,
        touchedPaths: filesystemDiff.touchedPaths,
        hasMaterialProgress:
          filesystemDiff.createdPaths.length > 0 || filesystemDiff.touchedPaths.length > 0,
        materialState: 'local-deterministic-success',
        materializationPlan: {
          version: task.planVersion,
          kind: task.planKind,
          summary: task.planSummary || undefined,
          operations: task.operations.map((operation) => ({
            type: operation.type,
            targetPath: operation.relativeTargetPath,
          })),
          validations: task.validations.map((validation) => ({
            type: validation.type,
            targetPath: validation.relativeTargetPath,
            ...(validation.expectedKind ? { expectedKind: validation.expectedKind } : {}),
          })),
        },
        validationResults: task.validations.map((validation) => ({
          type: validation.type,
          targetPath: validation.relativeTargetPath,
          ok: true,
        })),
        stepResults,
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
      },
    }
  } catch (error) {
    const afterStates = new Map(
      trackedPaths.map((targetPath) => [targetPath, capturePathState(targetPath)]),
    )
    const filesystemDiff = diffPathStates(beforeStates, afterStates)

    return {
      ok: false,
      ...(task.requestId ? { requestId: task.requestId } : {}),
      instruction: task.instruction,
      reasoningLayer: task.reasoningLayer,
      materializationLayer: task.materializationLayer,
      error:
        error instanceof Error
          ? error.message
          : 'La materializacion local determinstica fallo.',
      resultPreview: 'La materializacion local deterministica fallo.',
      details: {
        reasoningLayer: task.reasoningLayer,
        materializationLayer: task.materializationLayer,
        materializationPlanVersion: task.planVersion,
        materializationPlanSource: task.materializationPlanSource,
        currentAction: task.operations.at(stepResults.length)?.type || undefined,
        currentTargetPath: task.operations.at(stepResults.length)?.resolvedTargetPath || undefined,
        createdPaths: filesystemDiff.createdPaths,
        touchedPaths: filesystemDiff.touchedPaths,
        hasMaterialProgress:
          filesystemDiff.createdPaths.length > 0 ||
          filesystemDiff.touchedPaths.length > 0,
        materialState: 'local-deterministic-failed',
        stepResults,
      },
    }
  }
}

module.exports = {
  LOCAL_MATERIALIZATION_PLAN_VERSION,
  normalizeMaterializationPlan,
  buildLocalMaterializationTask,
  runLocalDeterministicTask,
  getLocalDeterministicOperationLabel,
}
