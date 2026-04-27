const DEFAULT_CONTEXT_HUB_API_URL = 'http://localhost:3710'
const SUGGESTED_CONTEXT_HUB_ENDPOINT = '/v1/packs/suggested'
const CONTEXT_HUB_EVENTS_ENDPOINT = '/v1/events'
const CONTEXT_HUB_TIMEOUT_MS = 1200

function buildUnavailableContextHubPack(reason = 'unavailable') {
  return {
    source: 'context-hub',
    endpoint: SUGGESTED_CONTEXT_HUB_ENDPOINT,
    available: false,
    pack: null,
    reason,
  }
}

function resolveContextHubApiUrl() {
  const configuredValue =
    typeof process.env.CONTEXT_HUB_API_URL === 'string'
      ? process.env.CONTEXT_HUB_API_URL.trim()
      : ''

  return configuredValue || DEFAULT_CONTEXT_HUB_API_URL
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
  let requestUrl = ''

  try {
    requestUrl = new URL(
      SUGGESTED_CONTEXT_HUB_ENDPOINT,
      resolveContextHubApiUrl(),
    ).toString()
  } catch {
    return buildUnavailableContextHubPack('error')
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), CONTEXT_HUB_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: abortController.signal,
    })

    const responseText = await response.text()
    let parsedPayload = null

    try {
      parsedPayload = responseText ? JSON.parse(responseText) : null
    } catch {
      return buildUnavailableContextHubPack('error')
    }

    if (!response.ok) {
      return buildUnavailableContextHubPack('error')
    }

    const resolvedPayload = resolveSuggestedPackPayload(parsedPayload)

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
  } catch (error) {
    if (error?.name === 'AbortError') {
      return buildUnavailableContextHubPack('timeout')
    }

    return buildUnavailableContextHubPack('unavailable')
  } finally {
    clearTimeout(timeoutId)
  }
}

async function emitContextHubEvent(eventPayload) {
  let requestUrl = ''

  try {
    requestUrl = new URL(
      CONTEXT_HUB_EVENTS_ENDPOINT,
      resolveContextHubApiUrl(),
    ).toString()
  } catch {
    return {
      ok: false,
      endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
      eventType:
        typeof eventPayload?.type === 'string' ? eventPayload.type : 'unknown',
      reason: 'error',
    }
  }

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), CONTEXT_HUB_TIMEOUT_MS)

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload && typeof eventPayload === 'object' ? eventPayload : {}),
      signal: abortController.signal,
    })

    const responseText = await response.text()
    let parsedPayload = null

    try {
      parsedPayload = responseText ? JSON.parse(responseText) : null
    } catch {
      parsedPayload = null
    }

    if (!response.ok) {
      return {
        ok: false,
        endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
        eventType:
          typeof eventPayload?.type === 'string' ? eventPayload.type : 'unknown',
        statusCode: response.status,
        reason: 'error',
      }
    }

    if (
      parsedPayload &&
      typeof parsedPayload === 'object' &&
      Object.prototype.hasOwnProperty.call(parsedPayload, 'ok') &&
      parsedPayload.ok !== true
    ) {
      return {
        ok: false,
        endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
        eventType:
          typeof eventPayload?.type === 'string' ? eventPayload.type : 'unknown',
        statusCode: response.status,
        reason: 'error',
      }
    }

    return {
      ok: true,
      endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
      eventType:
        typeof eventPayload?.type === 'string' ? eventPayload.type : 'unknown',
      statusCode: response.status,
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        ok: false,
        endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
        eventType:
          typeof eventPayload?.type === 'string' ? eventPayload.type : 'unknown',
        reason: 'timeout',
      }
    }

    return {
      ok: false,
      endpoint: CONTEXT_HUB_EVENTS_ENDPOINT,
      eventType:
        typeof eventPayload?.type === 'string' ? eventPayload.type : 'unknown',
      reason: 'unavailable',
    }
  } finally {
    clearTimeout(timeoutId)
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
  SUGGESTED_CONTEXT_HUB_ENDPOINT,
  CONTEXT_HUB_EVENTS_ENDPOINT,
  CONTEXT_HUB_TIMEOUT_MS,
  buildUnavailableContextHubPack,
  emitContextHubEvent,
  emitExecutionFailedEvent,
  emitExecutionFinishedEvent,
  fetchSuggestedContextHubPack,
}
