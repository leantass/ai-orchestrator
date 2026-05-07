const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const {
  CONTEXT_HUB_HEALTH_ENDPOINT,
  DEFAULT_CONTEXT_HUB_API_URL,
  fetchContextHubHealth,
} = require('./context-hub-client.cjs')

const CONTEXT_HUB_START_TIMEOUT_MS = 9000
const CONTEXT_HUB_POLL_INTERVAL_MS = 450
const CONTEXT_HUB_UI_DETECTION_TIMEOUT_MS = 1200
const CONTEXT_HUB_UI_LOCAL_STATE_ENDPOINT = '/__context-hub-api/local-state'
const CONTEXT_HUB_UI_URL_CANDIDATES = [
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'http://127.0.0.1:4174',
  'http://localhost:4174',
  'http://127.0.0.1:5174',
  'http://localhost:5174',
]
const CONTEXT_HUB_RUNTIME_LOG_NOTICE =
  'Context Hub puede escribir .context-hub/events.json como log runtime. No lo incluyas en commits.'
const CONTEXT_HUB_APP_HINT =
  'C:\\Users\\letas\\Desktop\\Proyectos\\Desarrollo\\context-hub\\app'

let managedContextHubProcess = null
let managedContextHubProcessState = {
  starting: false,
  startedAt: '',
  lastError: '',
  lastStdout: '',
  lastStderr: '',
}

function appendProcessLog(currentValue, chunk) {
  const nextValue = `${currentValue || ''}${chunk || ''}`
  return nextValue.length > 3000 ? nextValue.slice(nextValue.length - 3000) : nextValue
}

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function pathExists(targetPath) {
  try {
    return fs.existsSync(targetPath)
  } catch {
    return false
  }
}

function getManagedContextHubProcessState() {
  return managedContextHubProcess &&
    typeof managedContextHubProcess.exitCode !== 'number' &&
    managedContextHubProcess.killed !== true
    ? managedContextHubProcess
    : null
}

function resolveContextHubAppCandidates() {
  const configuredPath = normalizeOptionalString(
    process.env.AI_ORCHESTRATOR_CONTEXT_HUB_APP_PATH,
  )
  const siblingPath = path.resolve(__dirname, '..', '..', '..', 'context-hub', 'app')
  const cwdRelativePath = path.resolve(process.cwd(), '..', '..', 'context-hub', 'app')

  return [configuredPath, siblingPath, cwdRelativePath, CONTEXT_HUB_APP_HINT]
    .filter(Boolean)
    .map((candidate) => path.resolve(candidate))
    .filter((candidate, index, values) => values.indexOf(candidate) === index)
}

function inspectContextHubInstallation() {
  const candidates = resolveContextHubAppCandidates().map((appPath) => {
    const packageJsonPath = path.join(appPath, 'package.json')
    const compiledApiEntryPath = path.join(
      appPath,
      '.context-hub-cli-dist',
      'node',
      'contextHubApiServer.js',
    )
    const uiDistIndexPath = path.join(appPath, 'dist', 'index.html')

    const hasAppPath = pathExists(appPath)
    const hasPackageJson = pathExists(packageJsonPath)
    const hasCompiledApiEntry = pathExists(compiledApiEntryPath)
    const hasUiDist = pathExists(uiDistIndexPath)

    return {
      appPath,
      packageJsonPath,
      apiEntryPath: compiledApiEntryPath,
      uiDistIndexPath,
      exists: hasAppPath,
      hasPackageJson,
      hasCompiledApiEntry,
      hasUiDist,
      startable: hasAppPath && hasPackageJson && hasCompiledApiEntry,
      uiAvailableLocally: hasAppPath && hasPackageJson && hasUiDist,
    }
  })

  const selectedCandidate =
    candidates.find((candidate) => candidate.startable) ||
    candidates.find((candidate) => candidate.exists) ||
    candidates[0] ||
    null

  return {
    selectedCandidate,
    candidates,
  }
}

async function waitForContextHubAvailability(timeoutMs = CONTEXT_HUB_START_TIMEOUT_MS) {
  const startTime = Date.now()

  while (Date.now() - startTime <= timeoutMs) {
    const health = await fetchContextHubHealth()

    if (health.ok === true) {
      return health
    }

    const managedProcess = getManagedContextHubProcessState()
    if (!managedProcess && managedContextHubProcessState.lastError) {
      return null
    }

    await new Promise((resolve) => {
      setTimeout(resolve, CONTEXT_HUB_POLL_INTERVAL_MS)
    })
  }

  return null
}

function resolveContextHubUiCandidates() {
  const configuredUiUrl = normalizeOptionalString(
    process.env.AI_ORCHESTRATOR_CONTEXT_HUB_UI_URL || process.env.CONTEXT_HUB_UI_URL,
  )

  return [configuredUiUrl, ...CONTEXT_HUB_UI_URL_CANDIDATES]
    .filter(Boolean)
    .map((candidate) => normalizeOptionalString(candidate))
    .filter((candidate, index, values) => values.indexOf(candidate) === index)
}

async function fetchContextHubUiState(baseUrl) {
  let requestUrl = ''

  try {
    requestUrl = new URL(CONTEXT_HUB_UI_LOCAL_STATE_ENDPOINT, baseUrl).toString()
  } catch {
    return null
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), CONTEXT_HUB_UI_DETECTION_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: abortController.signal,
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json()

    if (!payload || typeof payload !== 'object') {
      return null
    }

    if (!Object.prototype.hasOwnProperty.call(payload, 'state')) {
      return null
    }

    return {
      baseUrl,
      endpoint: CONTEXT_HUB_UI_LOCAL_STATE_ENDPOINT,
    }
  } catch {
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

async function detectContextHubUi() {
  const candidates = resolveContextHubUiCandidates()

  for (const baseUrl of candidates) {
    const uiState = await fetchContextHubUiState(baseUrl)

    if (uiState) {
      return uiState
    }
  }

  return null
}

function buildContextHubStatusSnapshot({
  health,
  installation,
  uiRuntime,
  actionMessage,
} = {}) {
  const selectedCandidate = installation?.selectedCandidate || null
  const managedProcess = getManagedContextHubProcessState()
  const available = health?.ok === true
  const state = available
    ? 'connected'
    : managedContextHubProcessState.starting
      ? 'starting'
      : managedContextHubProcessState.lastError
        ? 'error'
        : 'unavailable'
  const suggestedBaseUrl =
    normalizeOptionalString(health?.baseUrl) || DEFAULT_CONTEXT_HUB_API_URL
  const technicalOpenUrl = `${suggestedBaseUrl}/v1/packs/suggested`
  const uiUrl = normalizeOptionalString(uiRuntime?.baseUrl)
  const openUrl = uiUrl || (available ? technicalOpenUrl : '')
  const openKind = uiUrl ? 'ui' : available ? 'technical-endpoint' : ''
  const openLabel = uiUrl ? 'Abrir MEMORIA' : 'Abrir endpoint tecnico'
  const openDetail = uiUrl
    ? 'Context Hub esta sirviendo una UI real en local.'
    : available
      ? 'MEMORIA responde solo por API; JEFE abrira una vista tecnica de diagnostico.'
      : 'Se habilita cuando MEMORIA responde o cuando hay una UI real detectada.'

  return {
    source: 'context-hub',
    available,
    state,
    endpoint: available
      ? health.endpoint || CONTEXT_HUB_HEALTH_ENDPOINT
      : '/v1/packs/suggested',
    baseUrl: suggestedBaseUrl,
    openUrl,
    technicalOpenUrl,
    uiUrl,
    openKind,
    openLabel,
    openDetail,
    healthUrl: `${suggestedBaseUrl}${CONTEXT_HUB_HEALTH_ENDPOINT}`,
    managedByJefe: Boolean(managedProcess),
    processId:
      managedProcess && Number.isInteger(managedProcess.pid) ? managedProcess.pid : null,
    canStart: selectedCandidate?.startable === true && !available,
    canOpen: Boolean(openUrl),
    appPath: selectedCandidate?.appPath || '',
    packageJsonPath: selectedCandidate?.packageJsonPath || '',
    apiEntryPath: selectedCandidate?.apiEntryPath || '',
    workspaceRoot: normalizeOptionalString(health?.workspaceRoot),
    reason: available
      ? 'connected'
      : normalizeOptionalString(managedContextHubProcessState.lastError)
        ? 'start-failed'
        : selectedCandidate?.startable === true
          ? 'unavailable'
          : selectedCandidate?.exists !== true
            ? 'app-path-missing'
            : selectedCandidate?.hasPackageJson !== true
              ? 'package-json-missing'
              : selectedCandidate?.hasCompiledApiEntry !== true
                ? 'compiled-api-missing'
                : 'unavailable',
    message:
      normalizeOptionalString(actionMessage) ||
      (available
        ? uiUrl
          ? 'MEMORIA disponible y con UI local detectada.'
          : 'MEMORIA disponible para packs sugeridos y eventos.'
        : managedContextHubProcessState.starting
          ? 'JEFE está intentando levantar MEMORIA sin bloquear el flujo principal.'
          : normalizeOptionalString(managedContextHubProcessState.lastError) ||
            'JEFE puede seguir funcionando sin MEMORIA.'),
    runtimeLogNotice: CONTEXT_HUB_RUNTIME_LOG_NOTICE,
    lastError: normalizeOptionalString(managedContextHubProcessState.lastError),
    lastStdout: normalizeOptionalString(managedContextHubProcessState.lastStdout),
    lastStderr: normalizeOptionalString(managedContextHubProcessState.lastStderr),
    lastCheckAt: new Date().toISOString(),
    lastStartAt: normalizeOptionalString(managedContextHubProcessState.startedAt),
  }
}

async function getContextHubStatusSnapshot(actionMessage = '') {
  const installation = inspectContextHubInstallation()
  const health = await fetchContextHubHealth()
  const uiRuntime = await detectContextHubUi()

  return buildContextHubStatusSnapshot({
    health,
    installation,
    uiRuntime,
    actionMessage,
  })
}

async function retryContextHubConnection() {
  return getContextHubStatusSnapshot('JEFE volvió a consultar MEMORIA.')
}

async function startLocalContextHub() {
  const currentHealth = await fetchContextHubHealth()
  if (currentHealth.ok === true) {
    return {
      ok: true,
      started: false,
      status: buildContextHubStatusSnapshot({
        health: currentHealth,
        installation: inspectContextHubInstallation(),
        actionMessage: 'MEMORIA ya estaba disponible; no fue necesario iniciar otro proceso.',
      }),
    }
  }

  const installation = inspectContextHubInstallation()
  const selectedCandidate = installation.selectedCandidate

  if (!selectedCandidate?.startable) {
    return {
      ok: false,
      error:
        selectedCandidate?.exists !== true
          ? `No se encontró la app de Context Hub. Ruta esperada: ${CONTEXT_HUB_APP_HINT}`
          : selectedCandidate?.hasPackageJson !== true
            ? 'Se encontró la carpeta de Context Hub, pero falta package.json.'
            : 'Se encontró Context Hub, pero no existe .context-hub-cli-dist/node/contextHubApiServer.js. Levantalo manualmente una vez para compilar la API.',
      status: buildContextHubStatusSnapshot({
        installation,
        actionMessage:
          'MEMORIA no se pudo iniciar automáticamente. JEFE sigue operativo sin bloquear la sesión.',
      }),
    }
  }

  const activeManagedProcess = getManagedContextHubProcessState()
  if (activeManagedProcess) {
    const availableHealth = await waitForContextHubAvailability()
    const status = buildContextHubStatusSnapshot({
      health: availableHealth,
      installation,
      actionMessage: availableHealth
        ? 'MEMORIA terminó de responder después de un reintento.'
        : 'Hay un proceso previo de MEMORIA gestionado por JEFE, pero todavía no responde.',
    })

    return {
      ok: Boolean(availableHealth),
      started: false,
      ...(availableHealth
        ? {}
        : {
            error:
              managedContextHubProcessState.lastError ||
              'MEMORIA sigue sin responder luego del reintento local.',
          }),
      status,
    }
  }

  managedContextHubProcessState = {
    starting: true,
    startedAt: new Date().toISOString(),
    lastError: '',
    lastStdout: '',
    lastStderr: '',
  }

  try {
    const child = spawn('node', [selectedCandidate.apiEntryPath], {
      cwd: selectedCandidate.appPath,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    managedContextHubProcess = child

    child.stdout?.on('data', (chunk) => {
      managedContextHubProcessState.lastStdout = appendProcessLog(
        managedContextHubProcessState.lastStdout,
        String(chunk),
      )
    })

    child.stderr?.on('data', (chunk) => {
      managedContextHubProcessState.lastStderr = appendProcessLog(
        managedContextHubProcessState.lastStderr,
        String(chunk),
      )
    })

    child.once('error', (error) => {
      managedContextHubProcessState.starting = false
      managedContextHubProcessState.lastError =
        error instanceof Error
          ? `No se pudo iniciar MEMORIA: ${error.message}`
          : `No se pudo iniciar MEMORIA: ${String(error)}`
      managedContextHubProcess = null
    })

    child.once('exit', (code, signal) => {
      managedContextHubProcessState.starting = false

      if (
        !managedContextHubProcessState.lastError &&
        code !== 0 &&
        code !== null
      ) {
        managedContextHubProcessState.lastError = `MEMORIA cerró con código ${code}${
          signal ? ` (${signal})` : ''
        }.`
      }

      managedContextHubProcess = null
    })

    const availableHealth = await waitForContextHubAvailability()
    managedContextHubProcessState.starting = false

    if (availableHealth) {
      return {
        ok: true,
        started: true,
        status: buildContextHubStatusSnapshot({
          health: availableHealth,
          installation,
          actionMessage:
            'MEMORIA quedó disponible desde el launcher local de JEFE.',
        }),
      }
    }

    const errorMessage =
      managedContextHubProcessState.lastError ||
      normalizeOptionalString(managedContextHubProcessState.lastStderr) ||
      'MEMORIA no respondió en el puerto 3210 después del arranque local.'

    return {
      ok: false,
      error: errorMessage,
      status: buildContextHubStatusSnapshot({
        installation,
        actionMessage:
          'JEFE intentó levantar MEMORIA, pero la API no quedó disponible a tiempo.',
      }),
    }
  } catch (error) {
    managedContextHubProcessState.starting = false
    managedContextHubProcessState.lastError =
      error instanceof Error
        ? `No se pudo iniciar MEMORIA: ${error.message}`
        : `No se pudo iniciar MEMORIA: ${String(error)}`

    managedContextHubProcess = null

    return {
      ok: false,
      error: managedContextHubProcessState.lastError,
      status: buildContextHubStatusSnapshot({
        installation,
        actionMessage:
          'JEFE intentó levantar MEMORIA, pero el proceso no pudo inicializarse.',
      }),
    }
  }
}

module.exports = {
  CONTEXT_HUB_APP_HINT,
  CONTEXT_HUB_RUNTIME_LOG_NOTICE,
  getContextHubStatusSnapshot,
  retryContextHubConnection,
  startLocalContextHub,
}
