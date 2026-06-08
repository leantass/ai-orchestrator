function normalizePathForComparison(value) {
  return typeof value === 'string' && value.trim()
    ? value.trim().replace(/\\/gu, '/').replace(/\/{2,}/gu, '/')
    : ''
}

function normalizeOptionalString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeWorkspaceProjectRoot(value) {
  return typeof value === 'string' && value.trim()
    ? normalizePathForComparison(value.trim()).replace(/\/+$/u, '')
    : ''
}

function normalizeEventStringValue(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function normalizeEventStringList(entries) {
  if (!Array.isArray(entries)) {
    return []
  }

  return [...new Set(entries.map(normalizeEventStringValue).filter(Boolean))]
}

function normalizeExecutorDecisionKey(value) {
  return typeof value === 'string' ? value.trim() : ''
}

module.exports = {
  normalizeEventStringList,
  normalizeEventStringValue,
  normalizeExecutorDecisionKey,
  normalizeOptionalString,
  normalizePathForComparison,
  normalizeWorkspaceProjectRoot,
}
