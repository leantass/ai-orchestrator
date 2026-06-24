const { normalizeEventStringValue } = require('./main-normalizers.cjs')

function hasMarkedExecutionEventRequestId(eventSet, requestId) {
  const normalizedRequestId = normalizeEventStringValue(requestId)

  if (!normalizedRequestId) {
    return false
  }

  return eventSet.has(normalizedRequestId)
}

function markExecutionEventRequestId(eventSet, requestId, maxTrackedIds = 500) {
  const normalizedRequestId = normalizeEventStringValue(requestId)

  if (!normalizedRequestId) {
    return true
  }

  if (eventSet.has(normalizedRequestId)) {
    return false
  }

  eventSet.add(normalizedRequestId)

  if (eventSet.size > maxTrackedIds) {
    const oldestRequestId = eventSet.values().next().value

    if (oldestRequestId) {
      eventSet.delete(oldestRequestId)
    }
  }

  return true
}

module.exports = {
  hasMarkedExecutionEventRequestId,
  markExecutionEventRequestId,
}