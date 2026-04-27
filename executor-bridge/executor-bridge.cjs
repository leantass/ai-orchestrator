const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const util = require('util')
const {
  normalizeMaterializationPlan,
  LOCAL_MATERIALIZATION_PLAN_VERSION,
} = require('../electron/local-deterministic-executor.cjs')

process.stdin.setEncoding('utf8')
const bridgeStdoutWriter = createPipeSafeWriter(process.stdout)
const bridgeStderrWriter =
  process.stderr === process.stdout
    ? bridgeStdoutWriter
    : createPipeSafeWriter(process.stderr)
const VALID_BRIDGE_MODES = new Set(['codex', 'mock'])
const CODEX_HEARTBEAT_INTERVAL_MS = 15000

function isBrokenPipeWriteError(error) {
  return Boolean(
    error &&
      typeof error === 'object' &&
      error.code === 'EPIPE' &&
      error.syscall === 'write',
  )
}

function createPipeSafeWriter(stream) {
  const state = { broken: false }

  if (!stream || typeof stream.on !== 'function') {
    state.broken = true
  } else {
    stream.on('error', (error) => {
      if (isBrokenPipeWriteError(error)) {
        state.broken = true
        return
      }

      setImmediate(() => {
        throw error
      })
    })
  }

  return {
    write(text, callback) {
      if (
        !stream ||
        state.broken === true ||
        stream.destroyed === true ||
        stream.writableEnded === true
      ) {
        return false
      }

      try {
        stream.write(text, () => {
          if (typeof callback === 'function') {
            callback()
          }
        })
        return true
      } catch (error) {
        if (isBrokenPipeWriteError(error)) {
          state.broken = true
          return false
        }

        throw error
      }
    },
    isWritable() {
      return (
        Boolean(stream) &&
        state.broken !== true &&
        stream.destroyed !== true &&
        stream.writableEnded !== true
      )
    },
  }
}

function formatBridgeLogDetails(details) {
  if (details === undefined) {
    return ''
  }

  if (typeof details === 'string') {
    return ` ${details}`
  }

  try {
    const serializedDetails = JSON.stringify(details)

    return serializedDetails === undefined
      ? ` ${util.inspect(details, { depth: 4, breakLength: Infinity })}`
      : ` ${serializedDetails}`
  } catch {
    return ` ${util.inspect(details, { depth: 4, breakLength: Infinity })}`
  }
}

function writeJson(payload) {
  bridgeStdoutWriter.write(`${JSON.stringify(payload)}\n`)
}

function writeBridgeEvent(payload) {
  writeJson({
    __executorBridgeEvent: true,
    emittedAt: new Date().toISOString(),
    ...payload,
  })
}

function writeBridgeLog(title, details) {
  bridgeStderrWriter.write(
    `[executor-bridge] ${title}${formatBridgeLogDetails(details)}\n`,
  )
}

function finishBridge(payload, exitCode = 0) {
  const normalizedExitCode = Number.isInteger(exitCode) ? exitCode : 0
  let didExit = false

  const finalizeExit = () => {
    if (didExit) {
      return
    }

    didExit = true
    writeBridgeLog('bridge esta por cerrar proceso', {
      exitCode: normalizedExitCode,
    })
    process.exit(normalizedExitCode)
  }

  writeBridgeLog('bridge imprimió JSON final', {
    ok: payload?.ok === true,
    error: payload?.error || undefined,
    approvalRequired: payload?.approvalRequired === true || undefined,
  })

  if (!bridgeStdoutWriter.write(`${JSON.stringify(payload)}\n`, finalizeExit)) {
    finalizeExit()
    return
  }

  const flushTimeout = setTimeout(finalizeExit, 200)

  if (typeof flushTimeout.unref === 'function') {
    flushTimeout.unref()
  }
}

writeBridgeLog('bridge inició')

function readPayload(rawInput) {
  if (!rawInput || !rawInput.trim()) {
    return {}
  }

  return JSON.parse(rawInput)
}

function buildTraceEntry(source, title, content, status = 'info', raw) {
  return {
    source,
    title,
    content,
    status,
    ...(raw ? { raw } : {}),
  }
}

function summarizeText(value, maxLength = 180) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().replace(/\s+/g, ' ')

  return normalizedValue.length > maxLength
    ? `${normalizedValue.slice(0, maxLength)}...`
    : normalizedValue
}

function normalizeConfiguredBridgeMode(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  return VALID_BRIDGE_MODES.has(normalizedValue) ? normalizedValue : ''
}

function resolveBridgeMode() {
  const configuredMode = normalizeConfiguredBridgeMode(
    process.env.AI_ORCHESTRATOR_BRIDGE_MODE,
  )

  return {
    mode: configuredMode || 'codex',
    source: configuredMode ? 'env' : 'default',
  }
}

function attachBridgeRuntimeMetadata(result, bridgeRuntime) {
  if (!result || typeof result !== 'object') {
    return result
  }

  const details =
    result.details && typeof result.details === 'object' ? result.details : {}

  return {
    ...result,
    bridgeMode: bridgeRuntime.mode,
    bridgeModeSource: bridgeRuntime.source,
    details: {
      ...details,
      bridgeMode: bridgeRuntime.mode,
      bridgeModeSource: bridgeRuntime.source,
    },
  }
}

function resolveExecutorWorkingDirectory(workspacePath) {
  if (typeof workspacePath === 'string' && workspacePath.trim()) {
    const resolvedWorkspacePath = path.resolve(workspacePath.trim())

    try {
      if (fs.statSync(resolvedWorkspacePath).isDirectory()) {
        return resolvedWorkspacePath
      }
    } catch {
      // Si el workspace indicado no existe, el bridge conserva el cwd actual.
    }
  }

  return process.cwd()
}

function resolveWindowsCodexExecutable() {
  const whereResult = spawnSync('where.exe', ['codex'], {
    windowsHide: true,
    encoding: 'utf8',
  })

  if (whereResult.status === 0 && typeof whereResult.stdout === 'string') {
    const candidates = whereResult.stdout
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean)

    const preferredExecutable =
      candidates.find((entry) => entry.toLocaleLowerCase().endsWith('.exe')) ||
      candidates.find((entry) => entry.toLocaleLowerCase().endsWith('.cmd')) ||
      candidates[0]

    if (preferredExecutable) {
      return preferredExecutable
    }
  }

  return 'codex'
}

function isWindowsCommandShim(command) {
  return Boolean(
    process.platform === 'win32' &&
      typeof command === 'string' &&
      /\.(cmd|bat)$/i.test(command.trim()),
  )
}

function buildWindowsCommandShimLaunch(command, args) {
  const commandText = typeof command === 'string' ? command.trim() : ''
  const normalizedArgs = Array.isArray(args)
    ? args.map((entry) =>
        typeof entry === 'string' ? entry : entry === undefined || entry === null ? '' : String(entry),
      )
    : []
  const comspec = process.env.ComSpec?.trim() || 'cmd.exe'

  return {
    command: comspec,
    args: ['/d', '/s', '/c', 'call', commandText, ...normalizedArgs],
    shell: false,
    rawCommand: `${commandText} ${normalizedArgs.join(' ')}`.trim(),
    launchStrategy: 'windows-command-shim',
    originalCommand: commandText,
    originalArgs: normalizedArgs,
  }
}

function hasNonTrivialOutput(value) {
  if (typeof value !== 'string') {
    return false
  }

  const normalizedValue = value.trim()

  return normalizedValue.length >= 24
}

function findFirstStringByKeys(value, keys, maxDepth = 4, visited = new Set()) {
  if (maxDepth < 0 || value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (typeof value !== 'object') {
    return ''
  }

  if (visited.has(value)) {
    return ''
  }

  visited.add(value)

  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = findFirstStringByKeys(entry, keys, maxDepth - 1, visited)

      if (match) {
        return match
      }
    }

    return ''
  }

  for (const key of keys) {
    const candidateValue = value[key]

    if (typeof candidateValue === 'string' && candidateValue.trim()) {
      return candidateValue.trim()
    }

    if (Array.isArray(candidateValue)) {
      const joinedValue = candidateValue
        .filter((entry) => typeof entry === 'string' && entry.trim())
        .join(' ')
        .trim()

      if (joinedValue) {
        return joinedValue
      }
    }
  }

  for (const nestedValue of Object.values(value)) {
    const match = findFirstStringByKeys(nestedValue, keys, maxDepth - 1, visited)

    if (match) {
      return match
    }
  }

  return ''
}

function extractEventCommand(event) {
  return findFirstStringByKeys(event, [
    'raw_command',
    'command',
    'cmd',
    'argv',
    'args',
  ])
}

function collectValuesByMatchingKeys(
  value,
  matcher,
  maxDepth = 5,
  visited = new Set(),
) {
  if (maxDepth < 0 || value === null || value === undefined) {
    return []
  }

  if (typeof value !== 'object') {
    return []
  }

  if (visited.has(value)) {
    return []
  }

  visited.add(value)

  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      collectValuesByMatchingKeys(entry, matcher, maxDepth - 1, visited),
    )
  }

  const collectedValues = []

  for (const [key, nestedValue] of Object.entries(value)) {
    if (matcher(key, nestedValue)) {
      collectedValues.push(nestedValue)
    }

    collectedValues.push(
      ...collectValuesByMatchingKeys(nestedValue, matcher, maxDepth - 1, visited),
    )
  }

  return collectedValues
}

function extractPathFragments(value) {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()]
  }

  if (Array.isArray(value)) {
    const flattenedValues = value
      .filter((entry) => typeof entry === 'string' && entry.trim())
      .map((entry) => entry.trim())

    if (flattenedValues.length === 0) {
      return []
    }

    return [flattenedValues.join(path.sep)]
  }

  return []
}

function normalizeEventPathCandidate(candidate, workspacePath) {
  if (typeof candidate !== 'string' || !candidate.trim()) {
    return ''
  }

  const normalizedCandidate = candidate.trim().replace(/^['"]+|['"]+$/g, '')
  const lowerCandidate = normalizedCandidate.toLocaleLowerCase()

  if (
    lowerCandidate === 'item.started' ||
    lowerCandidate === 'item.completed' ||
    lowerCandidate === 'file_change' ||
    lowerCandidate === 'command_execution'
  ) {
    return ''
  }

  const looksLikePath =
    /^[a-z]:[\\/]/i.test(normalizedCandidate) ||
    normalizedCandidate.startsWith('.\\') ||
    normalizedCandidate.startsWith('./') ||
    normalizedCandidate.startsWith('..\\') ||
    normalizedCandidate.startsWith('../') ||
    normalizedCandidate.includes('\\') ||
    normalizedCandidate.includes('/') ||
    /[a-z0-9_-]+\.[a-z0-9]{1,10}$/i.test(normalizedCandidate)

  if (!looksLikePath) {
    return ''
  }

  if (/^[a-z]:[\\/]/i.test(normalizedCandidate)) {
    return path.normalize(normalizedCandidate)
  }

  if (workspacePath && workspacePath.trim()) {
    return path.normalize(path.resolve(workspacePath.trim(), normalizedCandidate))
  }

  return path.normalize(normalizedCandidate)
}

function extractEventPath(event, workspacePath) {
  // Los eventos del bridge pueden venir con estructuras muy distintas según
  // el modo (mock/codex) y el tipo de herramienta. Acá privilegiamos la ruta
  // más específica disponible para que UI y resumen E2E muestren paths reales
  // en vez de tokens genéricos del stream.
  const rawCandidates = collectValuesByMatchingKeys(
    event,
    (key) =>
      [
        'target_path',
        'targetpath',
        'relative_path',
        'relativepath',
        'file_path',
        'filepath',
        'file',
        'filename',
        'path',
        'full_path',
        'fullpath',
        'fs_path',
        'fspath',
      ].includes(key.toLocaleLowerCase()),
  )

  const pathCandidates = rawCandidates
    .flatMap((value) => extractPathFragments(value))
    .map((candidate) => normalizeEventPathCandidate(candidate, workspacePath))
    .filter(Boolean)
    .sort((leftPath, rightPath) => rightPath.length - leftPath.length)

  return pathCandidates[0] || ''
}

function isAccessoryVerificationCommand(command, hasMaterialProgress = false) {
  if (typeof command !== 'string' || !command.trim()) {
    return false
  }

  // Algunos comandos de lectura/verificación fallan por contexto (por ejemplo
  // git status fuera de un repo) después de que ya hubo progreso material real.
  // Esos fallos no deberían pesar igual que un error del paso productivo.
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

function normalizeObjectiveScope(value) {
  if (
    value === 'single-target' ||
    value === 'single-subtask' ||
    value === 'continuation'
  ) {
    return value
  }

  return ''
}

function summarizeUniqueStrings(entries, limit = 4) {
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

function normalizeExecutionScope(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  // El executor trabaja con una versión compacta del scope. Esto evita que el
  // bridge vuelva a expandir recoveries chicos con narrativa redundante.
  const objectiveScope = normalizeObjectiveScope(value.objectiveScope)
  const allowedTargetPaths = summarizeUniqueStrings(value.allowedTargetPaths, 4)
  const blockedTargetPaths = summarizeUniqueStrings(value.blockedTargetPaths, 4)
  const successCriteria = summarizeUniqueStrings(value.successCriteria, 4)
  const continuationAnchor =
    value.continuationAnchor && typeof value.continuationAnchor === 'object'
      ? {
          ...(typeof value.continuationAnchor.targetPath === 'string' &&
          value.continuationAnchor.targetPath.trim()
            ? { targetPath: value.continuationAnchor.targetPath.trim() }
            : {}),
          ...(typeof value.continuationAnchor.subtask === 'string' &&
          value.continuationAnchor.subtask.trim()
            ? { subtask: value.continuationAnchor.subtask.trim() }
            : {}),
          ...(typeof value.continuationAnchor.action === 'string' &&
          value.continuationAnchor.action.trim()
            ? { action: value.continuationAnchor.action.trim() }
            : {}),
        }
      : null
  const enforceNarrowScope = value.enforceNarrowScope === true

  if (
    !objectiveScope &&
    allowedTargetPaths.length === 0 &&
    blockedTargetPaths.length === 0 &&
    successCriteria.length === 0 &&
    (!continuationAnchor || Object.keys(continuationAnchor).length === 0) &&
    enforceNarrowScope !== true
  ) {
    return null
  }

  return {
    ...(objectiveScope ? { objectiveScope } : {}),
    ...(allowedTargetPaths.length > 0 ? { allowedTargetPaths } : {}),
    ...(blockedTargetPaths.length > 0 ? { blockedTargetPaths } : {}),
    ...(successCriteria.length > 0 ? { successCriteria } : {}),
    ...(continuationAnchor && Object.keys(continuationAnchor).length > 0
      ? { continuationAnchor }
      : {}),
    ...(enforceNarrowScope ? { enforceNarrowScope: true } : {}),
  }
}

function formatContinuationAnchor(anchor) {
  if (!anchor || typeof anchor !== 'object') {
    return ''
  }

  if (anchor.targetPath && anchor.subtask) {
    return `${anchor.targetPath} (${anchor.subtask})`
  }

  return anchor.targetPath || anchor.subtask || anchor.action || ''
}

function buildExecutionScopePromptLines(executionScope) {
  const normalizedScope = normalizeExecutionScope(executionScope)

  if (!normalizedScope) {
    return []
  }

  const promptLines = [
    'Scope operativo explícito: respetalo por encima de cualquier contexto más amplio.',
  ]

  if (normalizedScope.objectiveScope) {
    promptLines.push(`objectiveScope: ${normalizedScope.objectiveScope}`)
  }

  if (normalizedScope.allowedTargetPaths?.length > 0) {
    promptLines.push(
      `allowedTargetPaths: ${normalizedScope.allowedTargetPaths.join(', ')}`,
    )
  }

  if (normalizedScope.blockedTargetPaths?.length > 0) {
    promptLines.push(
      `blockedTargetPaths: ${normalizedScope.blockedTargetPaths.join(', ')}`,
    )
  }

  if (normalizedScope.successCriteria?.length > 0) {
    promptLines.push(`successCriteria: ${normalizedScope.successCriteria.join(' | ')}`)
  }

  const continuationAnchor = formatContinuationAnchor(normalizedScope.continuationAnchor)
  if (continuationAnchor) {
    promptLines.push(`continuationAnchor: ${continuationAnchor}`)
  }

  if (normalizedScope.enforceNarrowScope === true) {
    promptLines.push(
      'No expandas el alcance. No rehagas el scaffold completo. No conviertas este recovery en un objetivo general.',
    )
  }

  return promptLines
}

function extractExplicitFileTargetsFromText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return []
  }

  const matches = value.match(
    /(?:^|[\s"'`(])((?:[a-z0-9._-]+[\\/])*[a-z0-9._-]+\.(?:html|css|js|ts|tsx|jsx|json|md|txt|cjs|mjs))(?:$|[\s"'`),.:;])/gi,
  )

  if (!Array.isArray(matches)) {
    return []
  }

  return summarizeUniqueStrings(
    matches.map((match) =>
      match.trim().replace(/^[\s"'`(]+|[\s"'`),.:;]+$/g, ''),
    ),
    12,
  )
}

function extractExplicitFolderTargetsFromText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return []
  }

  const quotedMatches = [
    ...value.matchAll(
      /(?:carpeta|directorio)\s+(?:llamad[oa]\s+)?["']([^"'\r\n]+)["']/gi,
    ),
  ]

  return summarizeUniqueStrings(
    quotedMatches
      .map((match) =>
        typeof match?.[1] === 'string' ? match[1].trim() : '',
      )
      .filter(Boolean),
    8,
  )
}

function resolveWorkspaceRelativeTarget(workspacePath, targetPath) {
  if (
    typeof workspacePath !== 'string' ||
    !workspacePath.trim() ||
    typeof targetPath !== 'string' ||
    !targetPath.trim()
  ) {
    return ''
  }

  return path.resolve(workspacePath.trim(), targetPath.trim())
}

function detectMaterializationExpectation({
  instruction,
  context,
  workspacePath,
  executionScope,
}) {
  if (typeof workspacePath !== 'string' || !workspacePath.trim()) {
    return {
      required: false,
      expectedPaths: [],
      expectedFolders: [],
      expectedRelativePaths: [],
      expectedRelativeFolders: [],
    }
  }

  const textSources = [instruction, context].filter(
    (entry) => typeof entry === 'string' && entry.trim(),
  )
  const combinedText = textSources.join('\n')
  const successCriteria = summarizeUniqueStrings(
    executionScope?.successCriteria,
    8,
  )
  const explicitRelativePaths = summarizeUniqueStrings(
    textSources.flatMap((entry) => extractExplicitFileTargetsFromText(entry)),
    12,
  )
  const explicitRelativeFolders = summarizeUniqueStrings(
    textSources.flatMap((entry) => extractExplicitFolderTargetsFromText(entry)),
    8,
  )
  const mentionsFilesystemWork =
    /\b(crear|crea|materializar|materializa|materializá|guardar|escribir|escribí|modificar|modifica|actualizar|actualiza|scaffold|landing|archivo|carpeta|directorio)\b/i.test(
      combinedText,
    ) ||
    /\b(create|write|modify|update|scaffold|file|folder|directory)\b/i.test(
      successCriteria.join(' '),
    )

  return {
    required:
      explicitRelativePaths.length > 0 ||
      explicitRelativeFolders.length > 0 ||
      mentionsFilesystemWork,
    expectedRelativePaths: explicitRelativePaths,
    expectedRelativeFolders: explicitRelativeFolders,
    expectedPaths: explicitRelativePaths
      .map((entry) => resolveWorkspaceRelativeTarget(workspacePath, entry))
      .filter(Boolean),
    expectedFolders: explicitRelativeFolders
      .map((entry) => resolveWorkspaceRelativeTarget(workspacePath, entry))
      .filter(Boolean),
  }
}

function capturePathState(targetPath) {
  if (typeof targetPath !== 'string' || !targetPath.trim()) {
    return {
      targetPath: '',
      exists: false,
      type: 'missing',
      mtimeMs: 0,
      size: 0,
    }
  }

  try {
    const stats = fs.statSync(targetPath)

    return {
      targetPath,
      exists: true,
      type: stats.isDirectory() ? 'dir' : 'file',
      mtimeMs: Number(stats.mtimeMs) || 0,
      size: stats.isFile() ? Number(stats.size) || 0 : 0,
    }
  } catch {
    return {
      targetPath,
      exists: false,
      type: 'missing',
      mtimeMs: 0,
      size: 0,
    }
  }
}

function captureMaterializationSnapshot(materializationExpectation) {
  const snapshot = new Map()

  if (!materializationExpectation?.required) {
    return snapshot
  }

  summarizeUniqueStrings(
    [
      ...(materializationExpectation.expectedFolders || []),
      ...(materializationExpectation.expectedPaths || []),
    ],
    24,
  ).forEach((targetPath) => {
    snapshot.set(targetPath, capturePathState(targetPath))
  })

  return snapshot
}

function mergeUniquePathEntries(existingPaths, incomingPaths) {
  return summarizeUniqueStrings(
    [
      ...(Array.isArray(existingPaths) ? existingPaths : []),
      ...(Array.isArray(incomingPaths) ? incomingPaths : []),
    ],
    200,
  )
}

function diffMaterializationSnapshot(initialSnapshot, nextSnapshot) {
  const createdPaths = []
  const touchedPaths = []

  for (const [targetPath, nextState] of nextSnapshot.entries()) {
    const initialState = initialSnapshot.get(targetPath) || {
      exists: false,
      type: 'missing',
      mtimeMs: 0,
      size: 0,
    }

    if (!nextState.exists) {
      continue
    }

    if (!initialState.exists) {
      createdPaths.push(targetPath)
      touchedPaths.push(targetPath)
      continue
    }

    if (
      nextState.type !== initialState.type ||
      nextState.mtimeMs !== initialState.mtimeMs ||
      nextState.size !== initialState.size
    ) {
      touchedPaths.push(targetPath)
    }
  }

  return {
    createdPaths: summarizeUniqueStrings(createdPaths, 200),
    touchedPaths: summarizeUniqueStrings(touchedPaths, 200),
  }
}

function runMockBridge({ instruction, context, workspacePath, executionScope }) {
  return Promise.resolve({
    ok: true,
    result: workspacePath?.trim()
      ? `Bridge local ejecutado para la instrucción en el workspace indicado: ${instruction}`
      : context?.trim()
        ? `Bridge local ejecutado con contexto adicional para la instrucción: ${instruction}`
        : `Bridge local ejecutado para la instrucción: ${instruction}`,
    trace: [
      buildTraceEntry(
        'bridge',
        'Payload recibido por el bridge',
        'El bridge recibió el pedido de ejecución en modo mock.',
        'info',
        JSON.stringify(
          {
            instruction,
            context: context || undefined,
            workspacePath: workspacePath || undefined,
            executionScope: normalizeExecutionScope(executionScope) || undefined,
          },
          null,
          2,
        ),
      ),
      buildTraceEntry(
        'executor',
        'Resultado mock del executor',
        'El executor mock devolvió un resultado local.',
        'success',
      ),
    ],
  })
}

function buildCodexPrompt(instruction, context, workspacePath, executionScope) {
  const materializationExpectation = detectMaterializationExpectation({
    instruction,
    context,
    workspacePath,
    executionScope,
  })
  const promptLines = [
    'Actuá como un executor técnico.',
    'Respondé SOLO con JSON válido.',
    'No uses markdown.',
    'No agregues explicación.',
    'No agregues relato.',
    'No le des instrucciones al usuario.',
    'No devuelvas recomendaciones operativas.',
    'No describas cómo usar el sistema.',
    'Respondé solo con el resultado final del executor.',
    'No menciones fallback mock.',
    'No menciones logs internos.',
    'No menciones la app, el bridge, el entorno local ni Codex dentro de result.',
    'No menciones lint, spawn, stderr, stdout ni detalles del sistema salvo en un error estructurado.',
    'No digas que ejecutaste comandos si no es estrictamente necesario.',
    'No sugieras comandos.',
    'No sugieras pasos manuales.',
    'No uses verbos imperativos dirigidos al usuario como Ejecutá, Corré, Usá, Probá, Abrí o Hacé.',
    'Si devolvés {"ok":true,"result":"..."}, el campo result debe ser una sola frase operativa, corta y utilizable.',
    'El campo result debe describir solo el resultado de la ejecución.',
    'El campo result no debe incluir pasos a seguir, consejos, comandos ni referencias al bridge, a la app o a Codex.',
    'Si la tarea implica archivos o carpetas, interpretala siempre respecto del workspace destino indicado.',
    'El campo result debe tener un máximo de 160 caracteres.',
    'Si no podés completar la tarea de forma confiable, devolvé exactamente {"ok":false,"error":"No se pudo completar la tarea de forma confiable."}.',
    'Si recibís un scope operativo explícito, ese scope manda sobre cualquier instrucción o contexto más amplio.',
    'La respuesta debe tener una de estas formas exactas:',
    '{"ok":true,"result":"..."}',
    '{"ok":true,"approvalRequired":true,"approvalReason":"...","resultPreview":"..."}',
    '{"ok":false,"error":"..."}',
    `Instrucción original: ${instruction}`,
  ]

  promptLines.push(...buildExecutionScopePromptLines(executionScope))

  if (materializationExpectation.required) {
    promptLines.push(
      'Esta tarea requiere materializacion real en el filesystem del workspace.',
    )
    if (materializationExpectation.expectedRelativeFolders.length > 0) {
      promptLines.push(
        `Carpetas esperadas: ${materializationExpectation.expectedRelativeFolders.join(', ')}`,
      )
    }
    if (materializationExpectation.expectedRelativePaths.length > 0) {
      promptLines.push(
        `Archivos esperados: ${materializationExpectation.expectedRelativePaths.join(', ')}`,
      )
    }
    promptLines.push(
      'No devuelvas ok:true si no creaste o modificaste archivos o carpetas reales dentro del workspace.',
    )
  }

  if (context?.trim()) {
    promptLines.push(`Contexto adicional: ${context.trim()}`)
  }

  if (workspacePath?.trim()) {
    promptLines.push(`Workspace destino: ${workspacePath.trim()}`)
  }

  return promptLines.join('\n')
}

function parseCodexJson(stdout) {
  const trimmedOutput = stdout.trim()

  if (!trimmedOutput) {
    return null
  }

  try {
    return JSON.parse(trimmedOutput)
  } catch {
    const firstBrace = trimmedOutput.indexOf('{')
    const lastBrace = trimmedOutput.lastIndexOf('}')

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null
    }

    try {
      return JSON.parse(trimmedOutput.slice(firstBrace, lastBrace + 1))
    } catch {
      return null
    }
  }
}

function parseCodexJsonLines(output) {
  if (!output || !output.trim()) {
    return []
  }

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function extractTextCandidatesFromValue(value) {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => extractTextCandidatesFromValue(entry))
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  return [
    value.text,
    value.output_text,
    value.result,
    value.content,
    value.message,
  ].flatMap((entry) => extractTextCandidatesFromValue(entry))
}

function extractStructuredResponseFromEvents(events) {
  const matchingEvents = [...events].reverse().filter((event) => {
    const eventType = typeof event?.type === 'string' ? event.type : ''
    const itemType = typeof event?.item?.type === 'string' ? event.item.type : ''

    return (
      eventType.includes('completed') ||
      eventType.includes('message') ||
      itemType.includes('message')
    )
  })

  if (matchingEvents.length === 0) {
    return {
      parsedOutput: null,
      matchedEventType: null,
      matchedItemType: null,
    }
  }

  for (const matchingEvent of matchingEvents) {
    const textCandidates = [
      ...extractTextCandidatesFromValue(matchingEvent?.item),
      ...extractTextCandidatesFromValue(matchingEvent),
    ]

    for (const candidate of textCandidates) {
      const parsedCandidate = parseCodexJson(candidate)

      if (isValidBridgeResponse(parsedCandidate)) {
        return {
          parsedOutput: parsedCandidate,
          matchedEventType:
            typeof matchingEvent?.type === 'string' ? matchingEvent.type : null,
          matchedItemType:
            typeof matchingEvent?.item?.type === 'string'
              ? matchingEvent.item.type
              : null,
        }
      }
    }
  }

  return {
    parsedOutput: null,
    matchedEventType: null,
    matchedItemType: null,
  }
}

function summarizeJsonlEvents(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      count: 0,
      first: [],
      last: [],
    }
  }

  const summarizeEvent = (event) => {
    const candidateTexts = [
      ...extractTextCandidatesFromValue(event?.item),
      ...extractTextCandidatesFromValue(event),
    ].filter((value) => typeof value === 'string' && value.trim())

    return {
      type: event?.type || 'desconocido',
      itemType: event?.item?.type || undefined,
      keys:
        event && typeof event === 'object'
          ? Object.keys(event).slice(0, 6)
          : [],
      itemKeys:
        event?.item && typeof event.item === 'object'
          ? Object.keys(event.item).slice(0, 6)
          : [],
      candidateTextPreview: candidateTexts[0]
        ? candidateTexts[0].slice(0, 160)
        : undefined,
    }
  }

  return {
    count: events.length,
    first: events.slice(0, 3).map(summarizeEvent),
    last: events.slice(-3).map(summarizeEvent),
  }
}

function collectCodexEventSignals(events) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      itemStartedTypes: [],
      itemCompletedTypes: [],
      hasTurnCompleted: false,
      hasAgentMessage: false,
      hasSuccessfulCommandExecution: false,
      hasFailedCommandExecution: false,
      hasFailedCriticalCommandExecution: false,
      hasFailedAccessoryCommandExecution: false,
      hasCompletedFileChange: false,
    }
  }

  const itemStartedTypes = new Set()
  const itemCompletedTypes = new Set()
  let hasTurnCompleted = false
  let hasAgentMessage = false
  let hasSuccessfulCommandExecution = false
  let hasFailedCommandExecution = false
  let hasFailedCriticalCommandExecution = false
  let hasFailedAccessoryCommandExecution = false
  let hasCompletedFileChange = false

  for (const event of events) {
    const eventType = typeof event?.type === 'string' ? event.type : ''
    const itemType = typeof event?.item?.type === 'string' ? event.item.type : ''

    if (eventType === 'turn.completed') {
      hasTurnCompleted = true
    }

    if (itemType === 'agent_message') {
      hasAgentMessage = true
    }

    if (eventType === 'item.started' && itemType) {
      itemStartedTypes.add(itemType)
    }

    if (eventType === 'item.completed' && itemType) {
      itemCompletedTypes.add(itemType)
    }

    if (eventType === 'item.completed' && itemType === 'command_execution') {
      if (event?.item?.exit_code === 0) {
        hasSuccessfulCommandExecution = true
      } else if (typeof event?.item?.exit_code === 'number' && event.item.exit_code !== 0) {
        hasFailedCommandExecution = true
        if (
          isAccessoryVerificationCommand(
            extractEventCommand(event),
            hasCompletedFileChange,
          )
        ) {
          hasFailedAccessoryCommandExecution = true
        } else {
          hasFailedCriticalCommandExecution = true
        }
      }
    }

    if (eventType === 'item.completed' && itemType === 'file_change') {
      hasCompletedFileChange = true
    }
  }

  return {
    itemStartedTypes: [...itemStartedTypes],
    itemCompletedTypes: [...itemCompletedTypes],
    hasTurnCompleted,
    hasAgentMessage,
    hasSuccessfulCommandExecution,
    hasFailedCommandExecution,
    hasFailedCriticalCommandExecution,
    hasFailedAccessoryCommandExecution,
    hasCompletedFileChange,
  }
}

function inferBridgeResponseFromEvents(events) {
  const signals = collectCodexEventSignals(events)
  const latestAgentMessage = [...events]
    .reverse()
    .find((event) => typeof event?.item?.type === 'string' && event.item.type === 'agent_message')
  const latestAgentMessageText = extractTextCandidatesFromValue(latestAgentMessage?.item)[0] || ''
  const hasEnoughEvidence =
    !signals.hasFailedCriticalCommandExecution &&
    signals.hasCompletedFileChange

  if (!hasEnoughEvidence) {
    return {
      parsedOutput: null,
      signals,
    }
  }

  return {
    parsedOutput: {
      ok: true,
      result:
        summarizeText(latestAgentMessageText, 160) ||
        'La instruccion se ejecuto correctamente.',
    },
    signals,
  }
}

function extractCodexStructuredResponse(stdout, stderr) {
  const directStdoutPayload = parseCodexJson(stdout)

  if (isValidBridgeResponse(directStdoutPayload)) {
    return {
      parsedOutput: directStdoutPayload,
      source: 'stdout-json',
      stdoutEventCount: 0,
      stderrEventCount: 0,
    }
  }

  const stdoutEvents = parseCodexJsonLines(stdout)
  const stderrEvents = parseCodexJsonLines(stderr)
  const stdoutSignals = collectCodexEventSignals(stdoutEvents)
  const stderrSignals = collectCodexEventSignals(stderrEvents)
  const stdoutStructuredCandidate = extractStructuredResponseFromEvents(stdoutEvents)

  if (
    isValidBridgeResponse(stdoutStructuredCandidate.parsedOutput) &&
    stdoutSignals.hasTurnCompleted
  ) {
    return {
      parsedOutput: stdoutStructuredCandidate.parsedOutput,
      source: 'stdout-jsonl-agent-message',
      resolutionKind: 'explicit',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals,
      stderrSignals,
      explicitCandidateDetected: true,
      explicitCandidateAccepted: true,
      explicitCandidateEventType: stdoutStructuredCandidate.matchedEventType,
      explicitCandidateItemType: stdoutStructuredCandidate.matchedItemType,
    }
  }

  if (hasValidMaterializationPlan(stdoutStructuredCandidate.parsedOutput)) {
    return {
      parsedOutput: normalizeBridgeSuccessPayload(
        stdoutStructuredCandidate.parsedOutput,
      ),
      source: 'stdout-jsonl-agent-message-plan-candidate',
      resolutionKind: 'explicit-plan',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals,
      stderrSignals,
      explicitCandidateDetected: true,
      explicitCandidateAccepted: true,
      explicitCandidateEventType: stdoutStructuredCandidate.matchedEventType,
      explicitCandidateItemType: stdoutStructuredCandidate.matchedItemType,
    }
  }

  if (isValidBridgeResponse(stdoutStructuredCandidate.parsedOutput)) {
    return {
      parsedOutput: null,
      source: 'stdout-jsonl-explicit-candidate',
      resolutionKind: 'waiting-for-turn-complete',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals,
      stderrSignals,
      explicitCandidateDetected: true,
      explicitCandidateAccepted: false,
      explicitCandidateEventType: stdoutStructuredCandidate.matchedEventType,
      explicitCandidateItemType: stdoutStructuredCandidate.matchedItemType,
      explicitCandidatePreview: stdoutStructuredCandidate.parsedOutput?.result,
    }
  }

  const directStderrPayload = parseCodexJson(stderr)

  if (isValidBridgeResponse(directStderrPayload)) {
    return {
      parsedOutput: directStderrPayload,
      source: 'stderr-json',
      resolutionKind: 'explicit',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals,
      stderrSignals,
    }
  }

  const stderrStructuredCandidate = extractStructuredResponseFromEvents(stderrEvents)

  if (
    isValidBridgeResponse(stderrStructuredCandidate.parsedOutput) &&
    stderrSignals.hasTurnCompleted
  ) {
    return {
      parsedOutput: stderrStructuredCandidate.parsedOutput,
      source: 'stderr-jsonl-agent-message',
      resolutionKind: 'explicit',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals,
      stderrSignals,
      explicitCandidateDetected: true,
      explicitCandidateAccepted: true,
      explicitCandidateEventType: stderrStructuredCandidate.matchedEventType,
      explicitCandidateItemType: stderrStructuredCandidate.matchedItemType,
    }
  }

  if (hasValidMaterializationPlan(stderrStructuredCandidate.parsedOutput)) {
    return {
      parsedOutput: normalizeBridgeSuccessPayload(
        stderrStructuredCandidate.parsedOutput,
      ),
      source: 'stderr-jsonl-agent-message-plan-candidate',
      resolutionKind: 'explicit-plan',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals,
      stderrSignals,
      explicitCandidateDetected: true,
      explicitCandidateAccepted: true,
      explicitCandidateEventType: stderrStructuredCandidate.matchedEventType,
      explicitCandidateItemType: stderrStructuredCandidate.matchedItemType,
    }
  }

  if (isValidBridgeResponse(stderrStructuredCandidate.parsedOutput)) {
    return {
      parsedOutput: null,
      source: 'stderr-jsonl-explicit-candidate',
      resolutionKind: 'waiting-for-turn-complete',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals,
      stderrSignals,
      explicitCandidateDetected: true,
      explicitCandidateAccepted: false,
      explicitCandidateEventType: stderrStructuredCandidate.matchedEventType,
      explicitCandidateItemType: stderrStructuredCandidate.matchedItemType,
      explicitCandidatePreview: stderrStructuredCandidate.parsedOutput?.result,
    }
  }

  const inferredStdoutResponse = inferBridgeResponseFromEvents(stdoutEvents)

  if (isValidBridgeResponse(inferredStdoutResponse.parsedOutput)) {
    return {
      parsedOutput: inferredStdoutResponse.parsedOutput,
      source: 'stdout-jsonl-inferred-success',
      resolutionKind: 'inferred',
      stdoutEventCount: stdoutEvents.length,
      stderrEventCount: stderrEvents.length,
      stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
      stderrEventSummary: summarizeJsonlEvents(stderrEvents),
      stdoutSignals: inferredStdoutResponse.signals,
      stderrSignals,
    }
  }

  return {
    parsedOutput: null,
    source: 'none',
    resolutionKind: 'none',
    stdoutEventCount: stdoutEvents.length,
    stderrEventCount: stderrEvents.length,
    stdoutEventSummary: summarizeJsonlEvents(stdoutEvents),
    stderrEventSummary: summarizeJsonlEvents(stderrEvents),
    stdoutSignals,
    stderrSignals,
    explicitCandidateDetected: false,
    explicitCandidateAccepted: false,
  }
}

function buildGenericFailure(trace = [], extraPayload = {}) {
  return {
    ok: false,
    error: 'No se pudo completar la tarea de forma confiable.',
    ...(typeof extraPayload.resultPreview === 'string' &&
    extraPayload.resultPreview.trim()
      ? { resultPreview: extraPayload.resultPreview.trim() }
      : {}),
    ...(extraPayload.details && typeof extraPayload.details === 'object'
      ? { details: extraPayload.details }
      : {}),
    trace,
  }
}

function isValidBridgeResponse(payload) {
  if (!payload || typeof payload !== 'object' || typeof payload.ok !== 'boolean') {
    return false
  }

  if (payload.ok === false) {
    return typeof payload.error === 'string' && payload.error.trim().length > 0
  }

  if (payload.approvalRequired === true) {
    return (
      typeof payload.approvalReason === 'string' &&
      payload.approvalReason.trim().length > 0 &&
      typeof payload.resultPreview === 'string' &&
      payload.resultPreview.trim().length > 0
    )
  }

  return typeof payload.result === 'string' && payload.result.trim().length > 0
}

function extractMaterializationPlanCandidate(payload) {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  if (payload.materializationPlan && typeof payload.materializationPlan === 'object') {
    return payload.materializationPlan
  }

  if (payload.details && typeof payload.details === 'object') {
    if (
      payload.details.materializationPlan &&
      typeof payload.details.materializationPlan === 'object'
    ) {
      return payload.details.materializationPlan
    }
  }

  return null
}

function hasValidMaterializationPlan(payload) {
  return Boolean(normalizeMaterializationPlan(extractMaterializationPlanCandidate(payload)))
}

function normalizeBridgeSuccessPayload(payload) {
  if (!payload || typeof payload !== 'object' || payload.ok !== true) {
    return payload
  }

  const normalizedPlan = normalizeMaterializationPlan(
    extractMaterializationPlanCandidate(payload),
  )

  if (!normalizedPlan) {
    return payload
  }

  const details =
    payload.details && typeof payload.details === 'object' ? payload.details : {}

  return {
    ...payload,
    ...(typeof payload.result === 'string' && payload.result.trim()
      ? {}
      : { result: 'Plan de materializacion local listo para aplicar.' }),
    reasoningLayer:
      typeof payload.reasoningLayer === 'string' && payload.reasoningLayer.trim()
        ? payload.reasoningLayer.trim()
        : normalizedPlan.reasoningLayer || 'codex-brain',
    materializationLayer:
      typeof payload.materializationLayer === 'string' &&
      payload.materializationLayer.trim()
        ? payload.materializationLayer.trim()
        : normalizedPlan.materializationLayer || 'local-deterministic',
    materializationPlan: normalizedPlan,
    details: {
      ...details,
      materializationPlan: normalizedPlan,
      reasoningLayer:
        typeof details.reasoningLayer === 'string' && details.reasoningLayer.trim()
          ? details.reasoningLayer.trim()
          : normalizedPlan.reasoningLayer || 'codex-brain',
      materializationLayer:
        typeof details.materializationLayer === 'string' &&
        details.materializationLayer.trim()
          ? details.materializationLayer.trim()
          : normalizedPlan.materializationLayer || 'local-deterministic',
      materializationPlanVersion:
        Number.isInteger(normalizedPlan.version) && normalizedPlan.version > 0
          ? normalizedPlan.version
          : LOCAL_MATERIALIZATION_PLAN_VERSION,
    },
  }
}

function isValidBridgeResponse(payload) {
  if (!payload || typeof payload !== 'object' || typeof payload.ok !== 'boolean') {
    return false
  }

  if (payload.ok === false) {
    return typeof payload.error === 'string' && payload.error.trim().length > 0
  }

  if (payload.approvalRequired === true) {
    return (
      typeof payload.approvalReason === 'string' &&
      payload.approvalReason.trim().length > 0 &&
      typeof payload.resultPreview === 'string' &&
      payload.resultPreview.trim().length > 0
    )
  }

  if (hasValidMaterializationPlan(payload)) {
    return (
      typeof payload.result === 'string' && payload.result.trim().length > 0
    )
  }

  return typeof payload.result === 'string' && payload.result.trim().length > 0
}

function normalizeInstructionForExecutorPrompt(instruction) {
  if (typeof instruction !== 'string' || !instruction.trim()) {
    return ''
  }

  const normalizedInstruction = instruction.trim()
  const strippedInstruction = normalizedInstruction.replace(
    /^(?:resolver\s+de\s+forma\s+concreta\s+el\s+objetivo\s+indicado|resolver\s+de\s+forma\s+concreta|resolver\s+el\s+objetivo\s+indicado|resolver\s+el\s+objetivo\s+actual|ejecutar\s+el\s+objetivo\s+indicado)\s*:\s*/i,
    '',
  )

  return strippedInstruction.trim() || normalizedInstruction
}

function buildCodexPrompt(instruction, context, workspacePath, executionScope) {
  const normalizedObjective = normalizeInstructionForExecutorPrompt(instruction)
  const materializationExpectation = detectMaterializationExpectation({
    instruction: normalizedObjective || instruction,
    context,
    workspacePath,
    executionScope,
  })
  const promptLines = [
    'Actua como un executor tecnico.',
    'Responde SOLO con JSON valido.',
    'No uses markdown.',
    'No agregues explicacion.',
    'No agregues relato.',
    'No le des instrucciones al usuario.',
    'No devuelvas recomendaciones operativas.',
    'No describas como usar el sistema.',
    'Responde solo con el resultado final del executor.',
    'No menciones fallback mock.',
    'No menciones logs internos.',
    'No menciones la app, el bridge, el entorno local ni Codex dentro de result.',
    'No menciones lint, spawn, stderr, stdout ni detalles del sistema salvo en un error estructurado.',
    'No digas que ejecutaste comandos si no es estrictamente necesario.',
    'No sugieras comandos.',
    'No sugieras pasos manuales.',
    'No uses verbos imperativos dirigidos al usuario.',
    'Si devuelves {"ok":true,"result":"..."}, el campo result debe ser una sola frase operativa, corta y utilizable.',
    'El campo result debe describir solo el resultado de la ejecucion.',
    'El campo result no debe incluir pasos a seguir, consejos, comandos ni referencias al bridge, a la app o a Codex.',
    'Si la tarea implica archivos o carpetas, interpretala siempre respecto del workspace destino indicado.',
    'El campo result debe tener un maximo de 160 caracteres.',
    'Si no podes completar la tarea de forma confiable, devuelve exactamente {"ok":false,"error":"No se pudo completar la tarea de forma confiable."}.',
    'Si recibis un scope operativo explicito, ese scope manda sobre cualquier instruccion o contexto mas amplio.',
    'La respuesta debe tener una de estas formas exactas:',
    '{"ok":true,"result":"..."}',
    '{"ok":true,"approvalRequired":true,"approvalReason":"...","resultPreview":"..."}',
    '{"ok":true,"result":"...","materializationPlan":{"version":1,"kind":"local-materialization","summary":"...","reasoningLayer":"codex-brain","materializationLayer":"local-deterministic","folders":["carpeta"],"files":[{"path":"carpeta/index.html","mode":"create","content":"..."}],"validations":[{"type":"exists","path":"carpeta","expectedKind":"folder"}]}}',
    '{"ok":false,"error":"..."}',
    `Objetivo operativo concreto: ${normalizedObjective || instruction}`,
    `Instruccion original: ${instruction}`,
  ]

  promptLines.push(...buildExecutionScopePromptLines(executionScope))

  if (materializationExpectation.required) {
    promptLines.push('Esta tarea requiere materializacion local en el workspace.')
    if (materializationExpectation.expectedRelativeFolders.length > 0) {
      promptLines.push(
        `Carpetas esperadas: ${materializationExpectation.expectedRelativeFolders.join(', ')}`,
      )
    }
    if (materializationExpectation.expectedRelativePaths.length > 0) {
      promptLines.push(
        `Archivos esperados: ${materializationExpectation.expectedRelativePaths.join(', ')}`,
      )
    }
    promptLines.push('NO escribas archivos ni carpetas directamente.')
    promptLines.push(
      'Tu trabajo es devolver un materializationPlan estructurado para que otra capa local lo aplique.',
    )
    promptLines.push(
      'El materializationPlan debe usar solamente rutas relativas al workspace destino.',
    )
    promptLines.push(
      'El materializationPlan debe incluir folders, files y validations suficientes para materializar y verificar el resultado final.',
    )
    promptLines.push(
      'Si el objetivo es un scaffold web o una landing base, devuelve una carpeta base y como minimo index.html, styles.css y script.js dentro de esa carpeta.',
    )
    promptLines.push(
      'No devuelvas ok:true sin materializationPlan valido cuando la tarea requiera materializacion local.',
    )
  }

  if (context?.trim()) {
    promptLines.push(`Contexto adicional: ${context.trim()}`)
  }

  if (workspacePath?.trim()) {
    promptLines.push(`Workspace destino: ${workspacePath.trim()}`)
  }

  return promptLines.join('\n')
}

function buildCodexLaunchConfig(workingDirectory) {
  const normalizedWorkingDirectory =
    typeof workingDirectory === 'string' && workingDirectory.trim()
      ? path.resolve(workingDirectory.trim())
      : ''
  const args = ['exec', '--skip-git-repo-check', '--json', '--sandbox', 'workspace-write']

  if (normalizedWorkingDirectory) {
    args.push('--cd', normalizedWorkingDirectory)
  }

  if (process.platform === 'win32') {
    const command = resolveWindowsCodexExecutable()

    if (isWindowsCommandShim(command)) {
      return buildWindowsCommandShimLaunch(command, args)
    }

    return {
      command,
      args,
      shell: false,
      rawCommand: `${command} ${args.join(' ')}`,
      launchStrategy: 'direct',
    }
  }

  return {
    command: 'codex',
    args,
    shell: false,
    rawCommand: `codex ${args.join(' ')}`,
    launchStrategy: 'direct',
  }
}

function runCodexBridge({ instruction, context, workspacePath, executionScope }) {
  return new Promise((resolve) => {
    const workingDirectory = resolveExecutorWorkingDirectory(workspacePath)
    const materializationExpectation = detectMaterializationExpectation({
      instruction,
      context,
      workspacePath,
      executionScope,
    })
    const initialMaterializationSnapshot = captureMaterializationSnapshot(
      materializationExpectation,
    )
    const codexLaunchConfig = buildCodexLaunchConfig(workingDirectory)
    const codexPrompt = buildCodexPrompt(
      instruction,
      context,
      workspacePath,
      executionScope,
    )
    const progressState = {
      stepIndex: 0,
      totalSteps: 6,
      currentTitle: 'Preparando bridge',
      currentAction: 'bridge-prep',
      currentTargetPath: '',
      currentCommand: codexLaunchConfig.rawCommand,
      createdPaths: [],
      touchedPaths: [],
      stdoutPreview: '',
      stderrPreview: '',
      hasMaterialProgress: false,
      materialState: 'accepted-but-idle',
      lastActivityAt: '',
      lastMaterialProgressAt: '',
    }
    const bridgeTrace = [
      buildTraceEntry(
        'bridge',
        'Payload recibido por el bridge',
        'El bridge recibió el pedido de ejecución y preparó el prompt para Codex.',
        'info',
        JSON.stringify(
          {
            instruction,
            context: context || undefined,
            workspacePath: workspacePath || undefined,
            executionScope: normalizeExecutionScope(executionScope) || undefined,
          },
          null,
          2,
        ),
      ),
      buildTraceEntry(
        'codex',
        'Prompt enviado a Codex',
        'Este fue el prompt completo enviado a Codex.',
        'info',
        codexPrompt,
      ),
    ]
    let child

    let stdout = ''
    let stderr = ''
    let settled = false
    let closeCode = null
    let exitCode = null
    let exitSignal = null
    let forcedFinalizeTimeoutId = null
    let latestStructuredResponse = null
    let lastLoggedStdoutEventCount = -1
    let lastLoggedStderrEventCount = -1
    let stdoutLineBuffer = ''
    let stderrLineBuffer = ''
    let lastProgressFingerprint = ''
    let lastCodexOutputAt = Date.now()
    let heartbeatIntervalId = null

    const registerTouchedPath = (targetPath) => {
      if (typeof targetPath !== 'string' || !targetPath.trim()) {
        return
      }

      const normalizedTargetPath = targetPath.trim()

      if (!progressState.touchedPaths.includes(normalizedTargetPath)) {
        progressState.touchedPaths.push(normalizedTargetPath)
      }
    }

    const refreshFilesystemMaterializationEvidence = () => {
      if (!materializationExpectation.required) {
        return {
          hasFilesystemEvidence: false,
          createdPaths: progressState.createdPaths,
          touchedPaths: progressState.touchedPaths,
        }
      }

      const nextSnapshot = captureMaterializationSnapshot(materializationExpectation)
      const snapshotDiff = diffMaterializationSnapshot(
        initialMaterializationSnapshot,
        nextSnapshot,
      )

      progressState.createdPaths = mergeUniquePathEntries(
        progressState.createdPaths,
        snapshotDiff.createdPaths,
      )
      progressState.touchedPaths = mergeUniquePathEntries(
        progressState.touchedPaths,
        snapshotDiff.touchedPaths,
      )

      if (
        progressState.createdPaths.length > 0 ||
        progressState.touchedPaths.length > 0
      ) {
        progressState.hasMaterialProgress = true
        progressState.materialState = 'filesystem-materialized'
        progressState.lastMaterialProgressAt =
          progressState.lastMaterialProgressAt || new Date().toISOString()
      }

      return {
        hasFilesystemEvidence:
          progressState.createdPaths.length > 0 ||
          progressState.touchedPaths.length > 0,
        createdPaths: progressState.createdPaths,
        touchedPaths: progressState.touchedPaths,
      }
    }

    const responseRequiresFilesystemEvidence = (parsedOutput) =>
      Boolean(
        materializationExpectation.required &&
          parsedOutput?.ok === true &&
          parsedOutput?.approvalRequired !== true &&
          hasValidMaterializationPlan(parsedOutput) !== true,
      )

    const emitProgress = ({
      title,
      content,
      action,
      targetPath,
      command,
      status = 'info',
      raw,
      incrementStep = true,
      materialProgress = false,
      materialState,
    }) => {
      if (incrementStep) {
        progressState.stepIndex += 1
      }

      const emittedAt = new Date().toISOString()
      progressState.currentTitle = title || progressState.currentTitle
      progressState.currentAction = action || progressState.currentAction
      progressState.currentTargetPath =
        targetPath || progressState.currentTargetPath
      progressState.currentCommand = command || progressState.currentCommand
      progressState.lastActivityAt = emittedAt

      if (typeof materialState === 'string' && materialState.trim()) {
        progressState.materialState = materialState.trim()
      }

      if (materialProgress) {
        progressState.hasMaterialProgress = true
        progressState.lastMaterialProgressAt = emittedAt
      }

      const fingerprint = JSON.stringify({
        stepIndex: progressState.stepIndex,
        title: progressState.currentTitle,
        action: progressState.currentAction,
        targetPath: progressState.currentTargetPath,
        command: progressState.currentCommand,
        materialProgress,
        materialState: progressState.materialState,
      })

      if (fingerprint === lastProgressFingerprint) {
        return
      }

      lastProgressFingerprint = fingerprint
      writeBridgeEvent({
        type: 'progress',
        emittedAt,
        stepIndex: progressState.stepIndex,
        totalSteps: progressState.totalSteps,
        title: progressState.currentTitle,
        content:
          content ||
          `Step ${progressState.stepIndex}/${progressState.totalSteps}: ${progressState.currentTitle}`,
        status,
        action: progressState.currentAction,
        ...(progressState.currentTargetPath
          ? { targetPath: progressState.currentTargetPath }
          : {}),
        ...(progressState.currentCommand
          ? { command: progressState.currentCommand }
          : {}),
        materialProgress,
        materialState: progressState.materialState,
        hasMaterialProgress: progressState.hasMaterialProgress,
        ...(progressState.stdoutPreview
          ? { stdoutPreview: progressState.stdoutPreview }
          : {}),
        ...(progressState.stderrPreview
          ? { stderrPreview: progressState.stderrPreview }
          : {}),
        ...(progressState.lastActivityAt
          ? { lastActivityAt: progressState.lastActivityAt }
          : {}),
        ...(progressState.lastMaterialProgressAt
          ? { lastMaterialProgressAt: progressState.lastMaterialProgressAt }
          : {}),
        ...(progressState.createdPaths.length > 0
          ? { createdPaths: progressState.createdPaths }
          : {}),
        ...(progressState.touchedPaths.length > 0
          ? { touchedPaths: progressState.touchedPaths }
          : {}),
        ...(raw ? { raw } : {}),
      })
    }

    const processCodexJsonLine = (line, stream) => {
      if (typeof line !== 'string' || !line.trim()) {
        return
      }

      let parsedLine

      try {
        parsedLine = JSON.parse(line)
      } catch {
        return
      }

      const eventType = typeof parsedLine?.type === 'string' ? parsedLine.type : ''
      const itemType =
        typeof parsedLine?.item?.type === 'string' ? parsedLine.item.type : ''
      const targetPath = extractEventPath(parsedLine, workspacePath)
      const command = extractEventCommand(parsedLine)
      const accessoryCommandFailure = isAccessoryVerificationCommand(
        command,
        progressState.hasMaterialProgress || progressState.createdPaths.length > 0,
      )

      if (targetPath && itemType === 'file_change') {
        registerTouchedPath(targetPath)
      }

      if (eventType === 'item.started' && itemType === 'command_execution') {
        emitProgress({
          title: 'Ejecutando comando del executor',
          content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: ejecutando comando interno${command ? `: ${summarizeText(command, 120)}` : ''}`,
          action: 'command-execution',
          command: command || progressState.currentCommand,
          status: 'info',
          materialProgress: false,
          materialState: 'command-running',
          raw: summarizeText(line, 240),
        })
        return
      }

      if (eventType === 'item.completed' && itemType === 'command_execution') {
        emitProgress({
          title: 'Comando interno completado',
          content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: comando finalizado${command ? `: ${summarizeText(command, 120)}` : ''}`,
          action: 'command-completed',
          command: command || progressState.currentCommand,
          status:
            typeof parsedLine?.item?.exit_code === 'number' &&
            parsedLine.item.exit_code !== 0
              ? 'warning'
              : 'success',
          materialProgress: false,
          materialState:
            typeof parsedLine?.item?.exit_code === 'number' &&
            parsedLine.item.exit_code !== 0
              ? accessoryCommandFailure
                ? 'accessory-command-failed'
                : 'command-failed'
              : 'command-completed',
          raw: summarizeText(line, 240),
        })
        return
      }

      if (eventType === 'item.started' && itemType === 'file_change') {
        emitProgress({
          title: 'Modificando archivo',
          content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: trabajando sobre ${targetPath || 'un archivo del proyecto'}`,
          action: 'file-change',
          targetPath,
          status: 'info',
          materialProgress: Boolean(targetPath),
          materialState: 'file-write-started',
          raw: summarizeText(line, 240),
        })
        return
      }

      if (eventType === 'item.completed' && itemType === 'file_change') {
        emitProgress({
          title: 'Archivo actualizado',
          content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: archivo procesado ${targetPath || 'sin ruta detectada'}`,
          action: 'file-change-completed',
          targetPath,
          status: 'success',
          materialProgress: true,
          materialState: 'file-write-partial',
          raw: summarizeText(line, 240),
        })
        return
      }

      if (eventType === 'turn.completed') {
        emitProgress({
          title: 'Empaquetando resultado del executor',
          content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: consolidando la salida final del executor`,
          action: 'package-result',
          status: 'info',
          incrementStep: true,
        })
        return
      }

      if (stream === 'stderr' && eventType) {
        emitProgress({
          title: 'Evento de diagnostico del executor',
          content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: diagnostico intermedio (${eventType})`,
          action: 'diagnostic-event',
          targetPath,
          command,
          status: 'warning',
          materialProgress: false,
          materialState: progressState.materialState || 'diagnostic-event',
          raw: summarizeText(line, 240),
          incrementStep: false,
        })
      }
    }

    const flushJsonLineBuffer = (bufferValue, stream) => {
      const lines = bufferValue.split(/\r?\n/)
      const remainder = lines.pop() || ''

      lines.forEach((line) => {
        processCodexJsonLine(line, stream)
      })

      return remainder
    }

    const clearForcedFinalizeTimeout = () => {
      if (forcedFinalizeTimeoutId) {
        clearTimeout(forcedFinalizeTimeoutId)
        forcedFinalizeTimeoutId = null
      }
    }

    const clearHeartbeatInterval = () => {
      if (heartbeatIntervalId) {
        clearInterval(heartbeatIntervalId)
        heartbeatIntervalId = null
      }
    }

    const emitHeartbeatProgress = () => {
      const emittedAt = new Date().toISOString()
      const idleForMs = Math.max(0, Date.now() - lastCodexOutputAt)
      progressState.lastActivityAt = emittedAt

      writeBridgeEvent({
        type: 'progress',
        emittedAt,
        stepIndex: progressState.stepIndex,
        totalSteps: progressState.totalSteps,
        title: 'Bridge esperando respuesta de Codex',
        content:
          'El bridge sigue esperando el plan estructurado de Codex y mantiene viva la ejecucion.',
        status: 'info',
        action: 'await-codex-heartbeat',
        ...(progressState.currentCommand
          ? { command: progressState.currentCommand }
          : {}),
        materialProgress: false,
        materialState: progressState.materialState || 'awaiting-codex-plan',
        hasMaterialProgress: progressState.hasMaterialProgress,
        ...(progressState.stdoutPreview
          ? { stdoutPreview: progressState.stdoutPreview }
          : {}),
        ...(progressState.stderrPreview
          ? { stderrPreview: progressState.stderrPreview }
          : {}),
        ...(progressState.lastMaterialProgressAt
          ? { lastMaterialProgressAt: progressState.lastMaterialProgressAt }
          : {}),
        ...(progressState.createdPaths.length > 0
          ? { createdPaths: progressState.createdPaths }
          : {}),
        ...(progressState.touchedPaths.length > 0
          ? { touchedPaths: progressState.touchedPaths }
          : {}),
        raw: JSON.stringify(
          {
            heartbeat: true,
            idleForMs,
            waitingFor: 'codex-structured-materialization-plan',
          },
          null,
          2,
        ),
      })
    }

    const armHeartbeatInterval = () => {
      clearHeartbeatInterval()
      heartbeatIntervalId = setInterval(() => {
        if (settled) {
          clearHeartbeatInterval()
          return
        }

        if (Date.now() - lastCodexOutputAt < CODEX_HEARTBEAT_INTERVAL_MS) {
          return
        }

        emitHeartbeatProgress()
      }, CODEX_HEARTBEAT_INTERVAL_MS)
    }

    const finalizeCodexSuccess = (parsedOutput, source, details = {}) => {
      if (settled) {
        return
      }

      const normalizedParsedOutput = normalizeBridgeSuccessPayload(parsedOutput)

      settled = true
      clearForcedFinalizeTimeout()
      clearHeartbeatInterval()
      emitProgress({
        title: 'Resultado final listo',
        content: `Step ${Math.max(progressState.stepIndex + 1, progressState.totalSteps)}/${progressState.totalSteps}: resultado final empaquetado`,
        action: 'final-result',
        status: 'success',
      })
      writeBridgeLog('bridge resolvió éxito final', {
        source,
        closeCode,
        exitCode,
        exitSignal: exitSignal || undefined,
        ...details,
      })
      resolve({
        ...normalizedParsedOutput,
        details: {
          ...(normalizedParsedOutput?.details &&
          typeof normalizedParsedOutput.details === 'object'
            ? normalizedParsedOutput.details
            : {}),
          currentStep: progressState.currentTitle,
          currentAction: progressState.currentAction,
          currentTargetPath: progressState.currentTargetPath || undefined,
          currentCommand: progressState.currentCommand || undefined,
          createdPaths: progressState.createdPaths,
          touchedPaths: progressState.touchedPaths,
          stdoutPreview: progressState.stdoutPreview || undefined,
          stderrPreview: progressState.stderrPreview || undefined,
          hasMaterialProgress: progressState.hasMaterialProgress,
          materialState: progressState.materialState || undefined,
          lastActivityAt: progressState.lastActivityAt || undefined,
          lastMaterialProgressAt: progressState.lastMaterialProgressAt || undefined,
        },
        trace: bridgeTrace,
      })
    }

    const resolveCodexFailure = (details) => {
      if (settled) {
        return
      }

      settled = true
      clearForcedFinalizeTimeout()
      clearHeartbeatInterval()
      emitProgress({
        title: 'Fallo contextualizado del executor',
        content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: fallo en ${progressState.currentTitle || 'la subtarea actual'}`,
        action: 'final-error',
        targetPath: progressState.currentTargetPath,
        command: progressState.currentCommand,
        status: 'error',
        incrementStep: false,
      })
      writeBridgeLog('bridge devolvió error final', details)
      resolve(
        buildGenericFailure(bridgeTrace, {
          resultPreview:
            progressState.createdPaths.length > 0
              ? `La ejecucion fallo en "${progressState.currentTitle}", pero quedaron ${progressState.createdPaths.length} archivo(s) tocado(s).`
              : `La ejecucion fallo en "${progressState.currentTitle || 'la subtarea actual'}".`,
          details: {
            origin: details?.origin || undefined,
            currentStep: progressState.currentTitle,
            currentAction: progressState.currentAction,
            currentTargetPath: progressState.currentTargetPath || undefined,
            currentCommand: progressState.currentCommand || undefined,
            createdPaths: progressState.createdPaths,
            touchedPaths: progressState.touchedPaths,
            stdoutPreview: progressState.stdoutPreview || undefined,
            stderrPreview: progressState.stderrPreview || undefined,
            hasMaterialProgress: progressState.hasMaterialProgress,
            materialState: progressState.materialState || undefined,
            lastActivityAt: progressState.lastActivityAt || undefined,
            lastMaterialProgressAt: progressState.lastMaterialProgressAt || undefined,
            ...(details && typeof details === 'object' ? details : {}),
          },
        }),
      )
    }

    const scheduleForcedFinalize = (source) => {
      if (!latestStructuredResponse?.parsedOutput || settled) {
        return
      }

      clearForcedFinalizeTimeout()
      forcedFinalizeTimeoutId = setTimeout(() => {
        if (settled || !latestStructuredResponse?.parsedOutput) {
          return
        }

        const filesystemEvidence = refreshFilesystemMaterializationEvidence()

        if (
          responseRequiresFilesystemEvidence(latestStructuredResponse.parsedOutput) &&
          filesystemEvidence.hasFilesystemEvidence !== true
        ) {
          writeBridgeLog('bridge retuvo cierre anticipado por falta de materializacion', {
            source,
            structuredSource: latestStructuredResponse.source,
            expectedPaths: materializationExpectation.expectedRelativePaths,
            expectedFolders: materializationExpectation.expectedRelativeFolders,
          })
          return
        }

        bridgeTrace.push(
          buildTraceEntry(
            'bridge',
            'Resolución anticipada del bridge',
            'El bridge cerró usando una respuesta estructurada válida sin esperar más salida del proceso hijo.',
            'warning',
            JSON.stringify(
              {
                source,
                structuredSource: latestStructuredResponse.source,
                exitCode,
                closeCode,
                stdoutBytes: stdout.length,
                stderrBytes: stderr.length,
              },
              null,
              2,
            ),
          ),
        )
        finalizeCodexSuccess(
          latestStructuredResponse.parsedOutput,
          `${latestStructuredResponse.source}-forced`,
          {
            triggerSource: source,
            stdoutEventCount: latestStructuredResponse.stdoutEventCount,
            stderrEventCount: latestStructuredResponse.stderrEventCount,
          },
        )
      }, 1200)
    }

    const updateStructuredResponseCandidate = (origin) => {
      const extraction = extractCodexStructuredResponse(stdout, stderr)

      if (
        extraction.stdoutEventSummary?.count > 0 &&
        extraction.stdoutEventSummary.count !== lastLoggedStdoutEventCount
      ) {
        lastLoggedStdoutEventCount = extraction.stdoutEventSummary.count
        writeBridgeLog('bridge auditó eventos JSONL de stdout', {
          count: extraction.stdoutEventSummary.count,
          first: extraction.stdoutEventSummary.first,
          last: extraction.stdoutEventSummary.last,
        })
      }

      if (
        extraction.stderrEventSummary?.count > 0 &&
        extraction.stderrEventSummary.count !== lastLoggedStderrEventCount
      ) {
        lastLoggedStderrEventCount = extraction.stderrEventSummary.count
        writeBridgeLog('bridge auditó eventos JSONL de stderr', {
          count: extraction.stderrEventSummary.count,
          first: extraction.stderrEventSummary.first,
          last: extraction.stderrEventSummary.last,
        })
      }

      writeBridgeLog('bridge intentó interpretar salida de Codex', {
        origin,
        source: extraction.source,
        resolutionKind: extraction.resolutionKind,
        stdoutBytes: stdout.length,
        stderrBytes: stderr.length,
        stdoutEventCount: extraction.stdoutEventCount,
        stderrEventCount: extraction.stderrEventCount,
        stdoutCandidateTypes:
          extraction.stdoutEventSummary?.last?.map((event) => event.type) || [],
        stderrCandidateTypes:
          extraction.stderrEventSummary?.last?.map((event) => event.type) || [],
        stdoutItemCompletedTypes: extraction.stdoutSignals?.itemCompletedTypes || [],
        stderrItemCompletedTypes: extraction.stderrSignals?.itemCompletedTypes || [],
        hasStdoutTurnCompleted: extraction.stdoutSignals?.hasTurnCompleted || false,
        hasStdoutAgentMessage: extraction.stdoutSignals?.hasAgentMessage || false,
        explicitCandidateDetected: extraction.explicitCandidateDetected || false,
        explicitCandidateAccepted: extraction.explicitCandidateAccepted || false,
        explicitCandidateEventType: extraction.explicitCandidateEventType || undefined,
        explicitCandidateItemType: extraction.explicitCandidateItemType || undefined,
        explicitCandidatePreview: extraction.explicitCandidatePreview || undefined,
      })

      if (!extraction.parsedOutput) {
        return
      }

      latestStructuredResponse = extraction
      scheduleForcedFinalize(origin)
    }

    emitProgress({
      title: 'Preparando prompt del executor',
      content: `Step 1/${progressState.totalSteps}: preparando prompt y contexto de ejecucion`,
      action: 'prepare-prompt',
      command: codexLaunchConfig.rawCommand,
      status: 'info',
    })

    try {
      writeBridgeLog('bridge preparó comando de Codex', {
        command: codexLaunchConfig.command,
        args: codexLaunchConfig.args,
        shell: codexLaunchConfig.shell,
        rawCommand: codexLaunchConfig.rawCommand,
        launchStrategy: codexLaunchConfig.launchStrategy || 'direct',
        originalCommand: codexLaunchConfig.originalCommand || undefined,
        originalArgs: codexLaunchConfig.originalArgs || undefined,
        cwd: workingDirectory,
      })
      child = spawn(codexLaunchConfig.command, codexLaunchConfig.args, {
        cwd: workingDirectory,
        shell: codexLaunchConfig.shell,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (error) {
      resolveCodexFailure({
        origin: 'spawn-throw',
        errorMessage: error instanceof Error ? error.message : String(error),
        command: codexLaunchConfig.command,
        args: codexLaunchConfig.args,
        shell: codexLaunchConfig.shell,
        rawCommand: codexLaunchConfig.rawCommand,
        launchStrategy: codexLaunchConfig.launchStrategy || 'direct',
        originalCommand: codexLaunchConfig.originalCommand || undefined,
        originalArgs: codexLaunchConfig.originalArgs || undefined,
      })
      return
    }

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')

    child.on('spawn', () => {
      lastCodexOutputAt = Date.now()
      armHeartbeatInterval()
      emitProgress({
        title: 'Lanzando proceso del executor',
        content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: lanzando ${codexLaunchConfig.rawCommand}`,
        action: 'spawn-executor',
        command: codexLaunchConfig.rawCommand,
        status: 'info',
      })
      writeBridgeLog('bridge lanzó proceso de Codex', {
        pid: child.pid,
        command: codexLaunchConfig.command,
        args: codexLaunchConfig.args,
        shell: codexLaunchConfig.shell,
        rawCommand: codexLaunchConfig.rawCommand,
        launchStrategy: codexLaunchConfig.launchStrategy || 'direct',
        originalCommand: codexLaunchConfig.originalCommand || undefined,
        originalArgs: codexLaunchConfig.originalArgs || undefined,
        cwd: workingDirectory,
      })
    })

    child.stdout.on('data', (chunk) => {
      lastCodexOutputAt = Date.now()
      stdout += chunk
      progressState.stdoutPreview = summarizeText(stdout, 220)
      progressState.lastActivityAt = new Date().toISOString()
      if (hasNonTrivialOutput(chunk)) {
        emitProgress({
          title: 'Salida material del executor',
          content: `El executor devolvio salida material mientras ejecutaba ${
            progressState.currentCommand || 'un comando interno'
          }.`,
          action: 'command-output',
          command: progressState.currentCommand,
          status: 'info',
          raw: summarizeText(chunk, 240),
          incrementStep: false,
          materialProgress: false,
          materialState: 'command-running',
        })
      }
      stdoutLineBuffer += chunk
      stdoutLineBuffer = flushJsonLineBuffer(stdoutLineBuffer, 'stdout')
      writeBridgeLog('bridge recibió stdout de Codex', {
        length: chunk.length,
        totalBytes: stdout.length,
      })
      updateStructuredResponseCandidate('stdout')
    })

    child.stderr.on('data', (chunk) => {
      lastCodexOutputAt = Date.now()
      stderr += chunk
      progressState.stderrPreview = summarizeText(stderr, 220)
      progressState.lastActivityAt = new Date().toISOString()
      if (hasNonTrivialOutput(chunk)) {
        emitProgress({
          title: 'Salida material del executor',
          content: `El executor devolvio salida de diagnostico relevante mientras ejecutaba ${
            progressState.currentCommand || 'un comando interno'
          }.`,
          action: 'command-output',
          command: progressState.currentCommand,
          status: 'warning',
          raw: summarizeText(chunk, 240),
          incrementStep: false,
          materialProgress: false,
          materialState: 'command-running',
        })
      }
      stderrLineBuffer += chunk
      stderrLineBuffer = flushJsonLineBuffer(stderrLineBuffer, 'stderr')
      writeBridgeLog('bridge recibió stderr de Codex', {
        length: chunk.length,
        totalBytes: stderr.length,
      })
      updateStructuredResponseCandidate('stderr')
    })

    child.on('error', (error) => {
      resolveCodexFailure({
        origin: 'child-error',
        errorMessage: error instanceof Error ? error.message : String(error),
      })
    })

    child.on('exit', (code, signal) => {
      exitCode = code
      exitSignal = signal
      writeBridgeLog('bridge recibió exit de Codex', {
        code,
        signal: signal || undefined,
      })
      scheduleForcedFinalize('exit')
    })

    child.on('close', (code) => {
      if (settled) {
        return
      }

      clearHeartbeatInterval()
      closeCode = code
      const filesystemEvidence = refreshFilesystemMaterializationEvidence()
      processCodexJsonLine(stdoutLineBuffer, 'stdout')
      processCodexJsonLine(stderrLineBuffer, 'stderr')
      stdoutLineBuffer = ''
      stderrLineBuffer = ''

      writeBridgeLog('bridge recibió close de Codex', {
        code,
        stdoutBytes: stdout.length,
        stderrBytes: stderr.length,
      })

      bridgeTrace.push(
        buildTraceEntry(
          'codex',
          'stdout crudo de Codex',
          stdout.trim() ? 'Codex devolvió salida por stdout.' : 'Codex no devolvió salida por stdout.',
          stdout.trim() ? 'info' : 'warning',
          stdout.trim() || '(vacío)',
        ),
      )
      bridgeTrace.push(
        buildTraceEntry(
          'codex',
          'stderr crudo de Codex',
          stderr.trim() ? 'Codex devolvió salida por stderr.' : 'Codex no devolvió salida por stderr.',
          stderr.trim() ? 'warning' : 'info',
          stderr.trim() || '(vacío)',
        ),
      )

      const extraction = extractCodexStructuredResponse(stdout, stderr)
      writeBridgeLog('bridge terminó de parsear salida de Codex', {
        parseable: Boolean(extraction.parsedOutput),
        source: extraction.source,
        resolutionKind: extraction.resolutionKind,
        stdoutEventCount: extraction.stdoutEventCount,
        stderrEventCount: extraction.stderrEventCount,
        stdoutItemCompletedTypes: extraction.stdoutSignals?.itemCompletedTypes || [],
        stderrItemCompletedTypes: extraction.stderrSignals?.itemCompletedTypes || [],
        hasStdoutTurnCompleted: extraction.stdoutSignals?.hasTurnCompleted || false,
        hasStdoutAgentMessage: extraction.stdoutSignals?.hasAgentMessage || false,
        explicitCandidateDetected: extraction.explicitCandidateDetected || false,
        explicitCandidateAccepted: extraction.explicitCandidateAccepted || false,
        materializationRequired: materializationExpectation.required,
        createdPaths: filesystemEvidence.createdPaths,
        touchedPaths: filesystemEvidence.touchedPaths,
      })

      if (code !== 0) {
        if (
          extraction.parsedOutput &&
          (progressState.hasMaterialProgress ||
            progressState.createdPaths.length > 0 ||
            progressState.touchedPaths.length > 0 ||
            extraction.stdoutSignals?.hasCompletedFileChange === true)
        ) {
          bridgeTrace.push(
            buildTraceEntry(
              'bridge',
              'Cierre con comando accesorio fallido',
              'Codex cerró con exit code no cero, pero el bridge conservó el resultado porque detectó progreso material y una salida estructurada válida.',
              'warning',
              JSON.stringify(
                {
                  closeCode: code,
                  source: extraction.source,
                  resolutionKind: extraction.resolutionKind,
                  stdoutSignals: extraction.stdoutSignals,
                },
                null,
                2,
              ),
            ),
          )
          finalizeCodexSuccess(
            extraction.parsedOutput,
            `${extraction.source}-nonzero-exit`,
            {
              closeCode: code,
              stdoutEventCount: extraction.stdoutEventCount,
              stderrEventCount: extraction.stderrEventCount,
            },
          )
          return
        }

        resolveCodexFailure({
          origin: 'child-close',
          code,
          stdoutBytes: stdout.length,
          stderrBytes: stderr.length,
        })
        return
      }

      if (!extraction.parsedOutput) {
        bridgeTrace.push(
          buildTraceEntry(
            'bridge',
            'Resultado parseado por el bridge',
            'El bridge no pudo validar una respuesta JSON utilizable desde stdout ni stderr.',
            'error',
            JSON.stringify(
              {
                stdout: stdout.trim() || '(sin salida parseable)',
                stderr: stderr.trim() || '(sin salida parseable)',
              },
              null,
              2,
            ),
          ),
        )
        resolveCodexFailure({
          origin: 'invalid-json',
          stdoutLength: stdout.length,
          stderrLength: stderr.length,
        })
        return
      }

      if (
        responseRequiresFilesystemEvidence(extraction.parsedOutput) &&
        filesystemEvidence.hasFilesystemEvidence !== true &&
        extraction.stdoutSignals?.hasCompletedFileChange !== true
      ) {
        bridgeTrace.push(
          buildTraceEntry(
            'bridge',
            'Materializacion insuficiente',
            'Codex devolvio una respuesta estructurada, pero no hubo evidencia real de archivos o carpetas creados/modificados en el workspace.',
            'error',
            JSON.stringify(
              {
                source: extraction.source,
                expectedPaths: materializationExpectation.expectedRelativePaths,
                expectedFolders: materializationExpectation.expectedRelativeFolders,
                createdPaths: filesystemEvidence.createdPaths,
                touchedPaths: filesystemEvidence.touchedPaths,
                stdoutSignals: extraction.stdoutSignals,
              },
              null,
              2,
            ),
          ),
        )
        resolveCodexFailure({
          origin: 'missing-materialization-evidence',
          source: extraction.source,
          expectedPaths: materializationExpectation.expectedRelativePaths,
          expectedFolders: materializationExpectation.expectedRelativeFolders,
        })
        return
      }

      bridgeTrace.push(
        buildTraceEntry(
          'bridge',
          'Resultado parseado por el bridge',
          extraction.resolutionKind === 'inferred'
            ? 'El bridge cerró por inferencia conservadora basada en eventos completos de Codex.'
            : 'El bridge validó correctamente la respuesta estructurada.',
          extraction.resolutionKind === 'inferred' ? 'warning' : 'success',
          JSON.stringify(
            {
              source: extraction.source,
              resolutionKind: extraction.resolutionKind,
              stdoutSignals: extraction.stdoutSignals,
              payload: extraction.parsedOutput,
            },
            null,
            2,
          ),
        ),
      )
      finalizeCodexSuccess(extraction.parsedOutput, extraction.source, {
        stdoutEventCount: extraction.stdoutEventCount,
        stderrEventCount: extraction.stderrEventCount,
      })
    })

    try {
      child.stdin.setDefaultEncoding('utf8')
      child.stdin.write(codexPrompt)
      child.stdin.end()
      emitProgress({
        title: 'Esperando trabajo del executor',
        content: `Step ${progressState.stepIndex + 1}/${progressState.totalSteps}: prompt enviado, esperando subpasos del executor`,
        action: 'await-executor',
        command: codexLaunchConfig.rawCommand,
        status: 'info',
      })
      writeBridgeLog('bridge envió prompt a Codex', {
        promptLength: codexPrompt.length,
      })
    } catch (error) {
      resolveCodexFailure({
        origin: 'stdin-write',
        errorMessage: error instanceof Error ? error.message : String(error),
      })
    }
  })
}

function runBridgeTask({ instruction, context, workspacePath, executionScope }) {
  const bridgeRuntime = resolveBridgeMode()

  writeBridgeLog('bridge detectó modo', {
    bridgeMode: bridgeRuntime.mode,
    bridgeModeSource: bridgeRuntime.source,
  })

  const taskPromise =
    bridgeRuntime.mode === 'codex'
      ? runCodexBridge({ instruction, context, workspacePath, executionScope })
      : runMockBridge({ instruction, context, workspacePath, executionScope })

  return Promise.resolve(taskPromise).then((result) =>
    attachBridgeRuntimeMetadata(result, bridgeRuntime),
  )
}

let input = ''

process.stdin.on('data', (chunk) => {
  input += chunk
})

process.stdin.on('end', () => {
  handleBridgeInput().catch((error) => {
    finishBridge({
      ok: false,
      error:
        error instanceof Error && error.message
          ? error.message
          : 'Falló la ejecución del bridge local',
    }, 1)
  })
})

async function handleBridgeInput() {
  let payload

  try {
    payload = readPayload(input)
  } catch {
    finishBridge({
      ok: false,
      error: 'No se pudo interpretar la entrada del bridge local',
    }, 1)
    return
  }

  writeBridgeLog('bridge recibió payload por stdin', {
    hasInstruction: typeof payload?.instruction === 'string',
    hasContext: typeof payload?.context === 'string',
    hasWorkspacePath: typeof payload?.workspacePath === 'string',
    objectiveScope: normalizeExecutionScope(payload?.executionScope)?.objectiveScope || undefined,
  })

  const instruction =
    typeof payload.instruction === 'string' ? payload.instruction.trim() : ''
  const context = typeof payload.context === 'string' ? payload.context.trim() : ''
  const workspacePath =
    typeof payload.workspacePath === 'string' ? payload.workspacePath.trim() : ''
  const executionScope = normalizeExecutionScope(payload.executionScope)

  if (!instruction) {
    finishBridge({
      ok: false,
      error: 'Instrucción vacía en el bridge local',
    }, 1)
    return
  }

  const result = await runBridgeTask({
    instruction,
    context,
    workspacePath,
    executionScope,
  })
  finishBridge(result, result?.ok === false ? 1 : 0)
}
