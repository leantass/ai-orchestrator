const DEFAULT_CONTEXT_HUB_API_URL = 'http://127.0.0.1:3210'
const CONTEXT_HUB_HEALTH_ENDPOINT = '/health'
const SUGGESTED_CONTEXT_HUB_ENDPOINT = '/v1/packs/suggested'
const CONTEXT_HUB_EVENTS_ENDPOINT = '/v1/events'
const CONTEXT_HUB_TIMEOUT_MS = 1200
const CONTEXT_HUB_API_URL_FALLBACKS = [
  DEFAULT_CONTEXT_HUB_API_URL,
  'http://localhost:3210',
  'http://localhost:3710',
]

function buildUnavailableContextHubPack(reason = 'unavailable') {
  return {
    source: 'context-hub',
    endpoint: SUGGESTED_CONTEXT_HUB_ENDPOINT,
    available: false,
    pack: null,
    reason,
  }
}

function resolveContextHubApiUrls() {
  const configuredValue =
    typeof process.env.CONTEXT_HUB_API_URL === 'string'
      ? process.env.CONTEXT_HUB_API_URL.trim()
      : ''

  if (configuredValue) {
    return [configuredValue]
  }

  return [...new Set(CONTEXT_HUB_API_URL_FALLBACKS)]
}

async function requestContextHubJson(endpoint, options = {}) {
  const baseUrls = resolveContextHubApiUrls()
  let lastFailureReason = 'unavailable'
  let lastStatusCode = null

  for (const baseUrl of baseUrls) {
    let requestUrl = ''

    try {
      requestUrl = new URL(endpoint, baseUrl).toString()
    } catch {
      lastFailureReason = 'error'
      continue
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), CONTEXT_HUB_TIMEOUT_MS)

    try {
      const response = await fetch(requestUrl, {
        method: options.method || 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.body !== undefined
            ? { 'Content-Type': 'application/json' }
            : {}),
          ...(options.headers && typeof options.headers === 'object' ? options.headers : {}),
        },
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
        signal: abortController.signal,
      })

      const responseText = await response.text()
      let parsedPayload = null

      try {
        parsedPayload = responseText ? JSON.parse(responseText) : null
      } catch {
        parsedPayload = null
      }

      if (response.ok) {
        return {
          ok: true,
          baseUrl,
          statusCode: response.status,
          payload: parsedPayload,
        }
      }

      lastFailureReason = 'error'
      lastStatusCode = response.status
    } catch (error) {
      if (error?.name === 'AbortError') {
        lastFailureReason = 'timeout'
      } else {
        lastFailureReason = 'unavailable'
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  return {
    ok: false,
    reason: lastFailureReason,
    ...(Number.isInteger(lastStatusCode) ? { statusCode: lastStatusCode } : {}),
  }
}

function normalizeSuggestedPackFromLegacyShape(pack) {
  if (!pack || typeof pack !== 'object') {
    return null
  }

  const metadata =
    pack.metadata && typeof pack.metadata === 'object' ? pack.metadata : {}

  return {
    id: typeof pack.id === 'string' ? pack.id : '',
    slug: typeof pack.slug === 'string' ? pack.slug : '',
    title: typeof pack.title === 'string' ? pack.title : '',
    summary: typeof pack.summary === 'string' ? pack.summary : '',
    content: typeof pack.content === 'string' ? pack.content : '',
    items: Array.isArray(pack.items) ? pack.items : [],
    metadata: {
      estimatedTokens: Number.isFinite(metadata.estimatedTokens)
        ? metadata.estimatedTokens
        : 0,
      itemsCount: Number.isFinite(metadata.itemsCount) ? metadata.itemsCount : 0,
      generatedAt:
        typeof metadata.generatedAt === 'string' ? metadata.generatedAt : null,
    },
  }
}

function normalizeSuggestedPackFromCurrentShape(pack) {
  if (!pack || typeof pack !== 'object') {
    return null
  }

  const metadata =
    pack.metadata && typeof pack.metadata === 'object' ? pack.metadata : {}
  const title =
    typeof metadata.title === 'string' && metadata.title.trim()
      ? metadata.title.trim()
      : 'Suggested Context Pack'
  const summary =
    typeof metadata.title === 'string' && metadata.title.trim()
      ? metadata.title.trim()
      : ''
  const includedDocumentPaths = Array.isArray(metadata.includedDocumentPaths)
    ? metadata.includedDocumentPaths
    : []

  return {
    id: 'suggested',
    slug: 'suggested',
    title,
    summary,
    content: typeof pack.text === 'string' ? pack.text : '',
    items: [],
    metadata: {
      estimatedTokens: Number.isFinite(metadata.estimatedTokens)
        ? metadata.estimatedTokens
        : Number.isFinite(metadata.wordCount)
          ? metadata.wordCount
          : 0,
      itemsCount: includedDocumentPaths.length,
      generatedAt:
        typeof metadata.generatedAt === 'string' ? metadata.generatedAt : null,
    },
  }
}

function normalizeSuggestedPack(pack) {
  if (!pack || typeof pack !== 'object') {
    return null
  }

  if ('text' in pack) {
    return normalizeSuggestedPackFromCurrentShape(pack)
  }

  return normalizeSuggestedPackFromLegacyShape(pack)
}

function resolveSuggestedPackPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      ok: false,
      pack: null,
      reason: 'error',
    }
  }

  if ('ok' in payload) {
    if (payload.ok !== true) {
      return {
        ok: false,
        pack: null,
        reason: 'error',
      }
    }

    return {
      ok: true,
      pack: Object.prototype.hasOwnProperty.call(payload, 'pack') ? payload.pack : null,
      reason: 'ok',
    }
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'pack')) {
    return {
      ok: true,
      pack: payload.pack,
      reason: 'ok',
    }
  }

  return {
    ok: false,
    pack: null,
    reason: 'error',
  }
}

async function fetchSuggestedContextHubPack() {
  const result = await requestContextHubJson(SUGGESTED_CONTEXT_HUB_ENDPOINT, {
    method: 'GET',
  })

  if (result.ok !== true) {
    return buildUnavailableContextHubPack(result.reason || 'unavailable')
  }

  const resolvedPayload = resolveSuggestedPackPayload(result.payload)

  if (resolvedPayload.ok !== true) {
    return buildUnavailableContextHubPack('error')
  }

  if (resolvedPayload.pack === null) {
    return buildUnavailableContextHubPack('no-pack')
  }

  const normalizedPack = normalizeSuggestedPack(resolvedPayload.pack)

  if (!normalizedPack) {
    return buildUnavailableContextHubPack('error')
  }

  return {
    source: 'context-hub',
    endpoint: SUGGESTED_CONTEXT_HUB_ENDPOINT,
    available: true,
    pack: normalizedPack,
  }
}

async function fetchContextHubHealth() {
  const result = await requestContextHubJson(CONTEXT_HUB_HEALTH_ENDPOINT, {
    method: 'GET',
  })

  if (result.ok !== true) {
    return {
      ok: false,
      source: 'context-hub',
      endpoint: CONTEXT_HUB_HEALTH_ENDPOINT,
      available: false,
      reason: result.reason || 'unavailable',
      ...(Number.isInteger(result.statusCode) ? { statusCode: result.statusCode } : {}),
    }
  }

  const payload =
    result.payload && typeof result.payload === 'object' ? result.payload : {}

  return {
    ok: true,
    source: 'context-hub',
    endpoint: CONTEXT_HUB_HEALTH_ENDPOINT,
    available: true,
    baseUrl: result.baseUrl,
    workspaceRoot:
      typeof payload.workspaceRoot === 'string' ? payload.workspaceRoot : '',
    statusCode: result.statusCode,
  }
}

async function emitContextHubEvent(eventPayload) {
  const eventType =
    typeof eventPayload?.type === 'string' ? eventPayload.type : 'unknown'
  const result = await requestContextHubJson(CONTEXT_HUB_EVENTS_ENDPOINT, {
    method: 'POST',
    body: eventPayload && typeof eventPayload === 'object' ? eventPayload : {},
  })

  if (result.ok !== true) {
    return {
      ok: false,
      endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
      eventType,
      ...(Number.isInteger(result.statusCode) ? { statusCode: result.statusCode } : {}),
      reason: result.reason || 'error',
    }
  }

  if (
    result.payload &&
    typeof result.payload === 'object' &&
    Object.prototype.hasOwnProperty.call(result.payload, 'ok') &&
    result.payload.ok !== true
  ) {
    return {
      ok: false,
      endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
      eventType,
      ...(Number.isInteger(result.statusCode) ? { statusCode: result.statusCode } : {}),
      reason: 'error',
    }
  }

  return {
    ok: true,
    endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
    eventType,
    ...(Number.isInteger(result.statusCode) ? { statusCode: result.statusCode } : {}),
  }
}

async function emitExecutionFinishedEvent(payload) {
  return emitContextHubEvent(payload)
}

async function emitExecutionFailedEvent(payload) {
  return emitContextHubEvent(payload)
}

module.exports = {
  DEFAULT_CONTEXT_HUB_API_URL,
  CONTEXT_HUB_HEALTH_ENDPOINT,
  SUGGESTED_CONTEXT_HUB_ENDPOINT,
  CONTEXT_HUB_EVENTS_ENDPOINT,
  CONTEXT_HUB_TIMEOUT_MS,
  CONTEXT_HUB_API_URL_FALLBACKS,
  buildUnavailableContextHubPack,
  emitContextHubEvent,
  emitExecutionFailedEvent,
  emitExecutionFinishedEvent,
  fetchContextHubHealth,
  fetchSuggestedContextHubPack,
  requestContextHubJson,
  resolveContextHubApiUrls,
}
