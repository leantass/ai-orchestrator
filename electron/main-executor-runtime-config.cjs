function buildDefaultExecutorCommand(defaultExecutorBridgePath) {
  return `node "${defaultExecutorBridgePath}"`
}

function normalizeConfiguredRuntimeMode(value, validModes) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  const normalizedValue = value.trim().toLocaleLowerCase()

  return validModes.has(normalizedValue) ? normalizedValue : ''
}

function resolveExecutorMode(configuredValue, validModes) {
  const configuredMode = normalizeConfiguredRuntimeMode(configuredValue, validModes)

  return {
    mode: configuredMode || 'command',
    source: configuredMode ? 'env' : 'default',
  }
}

function resolveExecutorBridgeMode(configuredValue, validModes) {
  const configuredMode = normalizeConfiguredRuntimeMode(configuredValue, validModes)

  return {
    mode: configuredMode || 'codex',
    source: configuredMode ? 'env' : 'default',
  }
}

function resolveExecutorCommandValue(configuredValue, defaultExecutorBridgePath) {
  return configuredValue?.trim() || buildDefaultExecutorCommand(defaultExecutorBridgePath)
}

module.exports = {
  resolveExecutorMode,
  resolveExecutorBridgeMode,
  resolveExecutorCommandValue,
}