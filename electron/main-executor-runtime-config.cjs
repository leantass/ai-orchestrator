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

function parseExecutorCommand(commandValue) {
  if (typeof commandValue !== 'string' || !commandValue.trim()) {
    return null
  }

  const tokens = []
  let currentToken = ''
  let quoteChar = ''

  for (let index = 0; index < commandValue.length; index += 1) {
    const character = commandValue[index]

    if ((character === '"' || character === "'") && !quoteChar) {
      quoteChar = character
      continue
    }

    if (character === quoteChar) {
      quoteChar = ''
      continue
    }

    if (!quoteChar && /\s/.test(character)) {
      if (currentToken) {
        tokens.push(currentToken)
        currentToken = ''
      }
      continue
    }

    currentToken += character
  }

  if (quoteChar) {
    return null
  }

  if (currentToken) {
    tokens.push(currentToken)
  }

  if (tokens.length === 0) {
    return null
  }

  return {
    command: tokens[0],
    args: tokens.slice(1),
  }
}

module.exports = {
  parseExecutorCommand,
  resolveExecutorMode,
  resolveExecutorBridgeMode,
  resolveExecutorCommandValue,
}