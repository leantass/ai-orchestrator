function buildExecutionEventEmitters({
  executionEventChannel,
  executionCompleteChannel,
}) {
  function emitSerializedWebContentsEvent(webContents, channel, eventPayload) {
    if (!webContents || webContents.isDestroyed()) {
      return
    }

    try {
      webContents.send(channel, JSON.parse(JSON.stringify(eventPayload)))
    } catch {
      // Ignora errores de emision para no romper la respuesta principal.
    }
  }

  function emitExecutionEvent(webContents, eventPayload) {
    emitSerializedWebContentsEvent(
      webContents,
      executionEventChannel,
      eventPayload,
    )
  }

  function emitExecutionCompleteEvent(webContents, eventPayload) {
    emitSerializedWebContentsEvent(
      webContents,
      executionCompleteChannel,
      eventPayload,
    )
  }

  return {
    emitExecutionEvent,
    emitExecutionCompleteEvent,
  }
}

module.exports = {
  buildExecutionEventEmitters,
}