const { contextBridge, ipcRenderer } = require('electron')

const RENDERER_INVOKE_TIMEOUT_MS = 35000
const EXECUTION_EVENT_CHANNEL = 'ai-orchestrator:execution-event'
const EXECUTION_COMPLETE_CHANNEL = 'ai-orchestrator:execution-complete'

function debugPreloadLog(label, details) {
  if (details === undefined) {
    console.log(`[preload-debug] ${label}`)
    return
  }

  try {
    console.log(`[preload-debug] ${label}`, JSON.stringify(details))
  } catch {
    console.log(`[preload-debug] ${label}`, details)
  }
}

function buildRendererErrorResult(errorMessage, raw) {
  return {
    ok: false,
    error: errorMessage,
    ...(raw
      ? {
          details: {
            raw,
          },
        }
      : {}),
    trace: [
      {
        source: 'orquestador',
        title: 'Error en preload',
        content: errorMessage,
        status: 'error',
        ...(raw ? { raw } : {}),
      },
    ],
  }
}

function withRequestId(result, requestId) {
  if (!requestId || typeof result !== 'object' || result === null) {
    return result
  }

  return {
    ...result,
    requestId,
  }
}

function toRendererSafeResult(result, fallbackErrorMessage) {
  try {
    return JSON.parse(JSON.stringify(result))
  } catch (error) {
    return buildRendererErrorResult(
      fallbackErrorMessage ||
        'No se pudo normalizar la respuesta IPC para el renderer',
      error instanceof Error ? error.stack || error.message : String(error),
    )
  }
}

async function invokeForRenderer(channel, payload, timeoutMs = RENDERER_INVOKE_TIMEOUT_MS) {
  const requestId =
    typeof payload?.requestId === 'string' ? payload.requestId : undefined

  debugPreloadLog('invokeForRenderer:before-invoke', {
    channel,
    requestId,
    timeoutMs,
  })

  let timeoutId = null

  try {
    const invokePromise = ipcRenderer.invoke(channel, payload)
    const result = await Promise.race([
      invokePromise,
      new Promise((resolve) => {
        timeoutId = setTimeout(() => {
          debugPreloadLog('invokeForRenderer:timeout', {
            channel,
            requestId,
            timeoutMs,
          })

          resolve(
            buildRendererErrorResult(
              'Timeout esperando la resolucion IPC en preload',
              JSON.stringify({ channel, timeoutMs, requestId }, null, 2),
            ),
          )
        }, timeoutMs)
      }),
    ])

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const normalizedResult = withRequestId(
      toRendererSafeResult(
        result,
        'No se pudo normalizar la respuesta de executeTask en preload',
      ),
      requestId,
    )

    debugPreloadLog('invokeForRenderer:after-invoke', {
      channel,
      requestId: requestId || normalizedResult?.requestId,
      ok: normalizedResult?.ok === true,
      error: normalizedResult?.error || undefined,
      hasTrace: Array.isArray(normalizedResult?.trace),
    })

    debugPreloadLog(
      normalizedResult?.ok === false
        ? 'invokeForRenderer:normalized-error'
        : 'invokeForRenderer:normalized-success',
      {
        channel,
        requestId: requestId || normalizedResult?.requestId,
        ok: normalizedResult?.ok === true,
        error: normalizedResult?.error || undefined,
        hasTrace: Array.isArray(normalizedResult?.trace),
      },
    )
    debugPreloadLog('invokeForRenderer:before-return', {
      channel,
      requestId: requestId || normalizedResult?.requestId,
      ok: normalizedResult?.ok === true,
      error: normalizedResult?.error || undefined,
    })

    return normalizedResult
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    debugPreloadLog('invokeForRenderer:exception', {
      channel,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })

    const normalizedError = withRequestId(
      buildRendererErrorResult(
        'Fallo la invocacion IPC desde preload',
        error instanceof Error ? error.stack || error.message : String(error),
      ),
      requestId,
    )

    debugPreloadLog('invokeForRenderer:before-return-error', {
      channel,
      requestId: requestId || normalizedError?.requestId,
      ok: normalizedError?.ok === true,
      error: normalizedError?.error || undefined,
      hasTrace: Array.isArray(normalizedError?.trace),
    })

    return normalizedError
  }
}

contextBridge.exposeInMainWorld('aiOrchestrator', {
  platform: process.platform,
  getRuntimeStatus: () => ipcRenderer.invoke('ai-orchestrator:get-runtime-status'),
  testReturn: (payload) => ipcRenderer.invoke('ai-orchestrator:test-return', payload),
  listReusableArtifacts: (payload) =>
    ipcRenderer.invoke('ai-orchestrator:list-reusable-artifacts', payload),
  searchReusableArtifacts: (payload) =>
    ipcRenderer.invoke('ai-orchestrator:search-reusable-artifacts', payload),
  saveReusableArtifact: (payload) =>
    ipcRenderer.invoke('ai-orchestrator:save-reusable-artifact', payload),
  planTask: (payload) =>
    // El planner necesita el mismo contexto operativo que ya conoce la UI:
    // workspace, participation mode, decisiones resueltas y hints de routing.
    // Si este bridge recorta esos campos, el renderer "ve" una cosa y el
    // cerebro local decide otra.
    ipcRenderer.invoke('ai-orchestrator:plan-task', {
      goal: payload?.goal,
      context: payload?.context,
      workspacePath: payload?.workspacePath,
      iteration: payload?.iteration,
      previousExecutionResult: payload?.previousExecutionResult,
      userParticipationMode: payload?.userParticipationMode,
      projectState: payload?.projectState,
      autonomyLevel: payload?.autonomyLevel,
      costMode: payload?.costMode,
      routingHints: payload?.routingHints,
      manualReusablePreference: payload?.manualReusablePreference,
    }),
  onExecutionEvent: (listener) => {
    if (typeof listener !== 'function') {
      return () => {}
    }

    const wrappedListener = (_event, payload) => {
      listener(toRendererSafeResult(payload, 'No se pudo normalizar el evento IPC'))
    }

    ipcRenderer.on(EXECUTION_EVENT_CHANNEL, wrappedListener)

    return () => {
      ipcRenderer.removeListener(EXECUTION_EVENT_CHANNEL, wrappedListener)
    }
  },
  onExecutionComplete: (listener) => {
    if (typeof listener !== 'function') {
      return () => {}
    }

    const wrappedListener = (_event, payload) => {
      listener(
        toRendererSafeResult(
          payload,
          'No se pudo normalizar el evento final de ejecucion',
        ),
      )
    }

    ipcRenderer.on(EXECUTION_COMPLETE_CHANNEL, wrappedListener)

    return () => {
      ipcRenderer.removeListener(EXECUTION_COMPLETE_CHANNEL, wrappedListener)
    }
  },
  executeTask: async (payload) => {
    console.log('[preload-debug] executeTask:before-invoke', {
      requestId: payload?.requestId,
    })
    const result = await ipcRenderer.invoke('ai-orchestrator:execute-task', payload)
    console.log('[preload-debug] executeTask:after-invoke', {
      requestId: payload?.requestId,
      responseRequestId: result?.requestId,
      ok: result?.ok,
      accepted: result?.accepted,
      error: result?.error,
    })
    return result
  },
})
