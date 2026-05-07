const DEFAULT_CONTEXT_HUB_EVENT_STATUS = Object.freeze({
  state: 'idle',
  eventType: '',
  endpoint: '/v1/events',
  label: 'Sin eventos emitidos',
  detail:
    'JEFE todavia no registro eventos de MEMORIA en esta sesion.',
  updatedAt: '',
  reason: '',
  statusCode: null,
})

let lastContextHubEventStatus = { ...DEFAULT_CONTEXT_HUB_EVENT_STATUS }

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeStatusCode(value) {
  return Number.isInteger(value) && value >= 100 ? value : null
}

function formatEventTypeLabel(eventType) {
  const normalizedEventType = normalizeOptionalString(eventType)
  return normalizedEventType || 'evento desconocido'
}

function buildContextHubEventStatus(value = {}) {
  const state = normalizeOptionalString(value.state) || 'idle'
  const eventType = normalizeOptionalString(value.eventType)
  const endpoint = normalizeOptionalString(value.endpoint) || '/v1/events'
  const updatedAt = normalizeOptionalString(value.updatedAt) || new Date().toISOString()
  const reason = normalizeOptionalString(value.reason)
  const statusCode = normalizeStatusCode(value.statusCode)
  const eventTypeLabel = formatEventTypeLabel(eventType)

  if (state === 'pending') {
    return {
      state,
      eventType,
      endpoint,
      label: `Enviando ${eventTypeLabel}`,
      detail: `JEFE esta intentando registrar ${eventTypeLabel} en MEMORIA.`,
      updatedAt,
      reason,
      statusCode,
    }
  }

  if (state === 'sent') {
    return {
      state,
      eventType,
      endpoint,
      label: `${eventTypeLabel} enviado`,
      detail: [
        `Endpoint: ${endpoint}`,
        statusCode ? `HTTP ${statusCode}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
      updatedAt,
      reason,
      statusCode,
    }
  }

  if (state === 'failed') {
    return {
      state,
      eventType,
      endpoint,
      label: `${eventTypeLabel} fallido`,
      detail: [
        `Endpoint: ${endpoint}`,
        reason ? `Motivo: ${reason}` : 'No se pudo registrar el evento.',
        statusCode ? `HTTP ${statusCode}` : '',
      ]
        .filter(Boolean)
        .join(' | '),
      updatedAt,
      reason,
      statusCode,
    }
  }

  if (state === 'skipped') {
    return {
      state,
      eventType,
      endpoint,
      label: `${eventTypeLabel} omitido`,
      detail: reason || 'JEFE omitio el evento en esta corrida.',
      updatedAt,
      reason,
      statusCode,
    }
  }

  return {
    ...DEFAULT_CONTEXT_HUB_EVENT_STATUS,
    updatedAt: normalizeOptionalString(value.updatedAt),
  }
}

function setLastContextHubEventStatus(nextStatus) {
  lastContextHubEventStatus = buildContextHubEventStatus(nextStatus)
  return lastContextHubEventStatus
}

function getLastContextHubEventStatus() {
  return buildContextHubEventStatus(lastContextHubEventStatus)
}

function attachLastContextHubEventStatus(status) {
  const lastEventStatus = getLastContextHubEventStatus()

  if (!status || typeof status !== 'object') {
    return {
      lastEventStatus,
    }
  }

  return {
    ...status,
    lastEventStatus,
  }
}

function recordContextHubEventPending({
  eventType,
  endpoint = '/v1/events',
}) {
  return setLastContextHubEventStatus({
    state: 'pending',
    eventType,
    endpoint,
    updatedAt: new Date().toISOString(),
  })
}

function recordContextHubEventResult({
  eventType,
  eventResult,
}) {
  const normalizedEventType =
    normalizeOptionalString(eventResult?.eventType) || normalizeOptionalString(eventType)

  return setLastContextHubEventStatus({
    state: eventResult?.ok === true ? 'sent' : 'failed',
    eventType: normalizedEventType,
    endpoint: normalizeOptionalString(eventResult?.endpoint) || '/v1/events',
    updatedAt: new Date().toISOString(),
    reason: normalizeOptionalString(eventResult?.reason),
    statusCode: normalizeStatusCode(eventResult?.statusCode),
  })
}

function recordContextHubEventSkipped({
  eventType,
  reason,
  endpoint = '/v1/events',
}) {
  return setLastContextHubEventStatus({
    state: 'skipped',
    eventType,
    endpoint,
    updatedAt: new Date().toISOString(),
    reason,
  })
}

module.exports = {
  attachLastContextHubEventStatus,
  getLastContextHubEventStatus,
  recordContextHubEventPending,
  recordContextHubEventResult,
  recordContextHubEventSkipped,
}
