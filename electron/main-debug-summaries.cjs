const util = require('util')

function buildOutputPreview(text, maxLength = 240) {
  if (typeof text !== 'string' || !text) {
    return ''
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

function formatMainDebugDetails(details) {
  if (details === undefined) {
    return ''
  }

  if (typeof details === 'string') {
    return details
  }

  try {
    const serializedDetails = JSON.stringify(details)

    return serializedDetails === undefined
      ? util.inspect(details, { depth: 4, breakLength: Infinity })
      : serializedDetails
  } catch {
    return util.inspect(details, { depth: 4, breakLength: Infinity })
  }
}

function compactGeneratedDomainContractDebugAbsolutePath(value) {
  const normalized =
    typeof value === 'string' ? value.trim().replace(/\\/gu, '/') : ''
  if (!normalized || normalized.length <= 48) {
    return normalized
  }

  const segments = normalized.split('/').filter(Boolean)
  if (segments.length <= 3) {
    return normalized
  }

  if (/^[A-Za-z]:\//u.test(normalized)) {
    return `${normalized.slice(0, 2)}/.../${segments.slice(-3).join('/')}`
  }

  if (normalized.startsWith('/')) {
    return `/.../${segments.slice(-3).join('/')}`
  }

  return `.../${segments.slice(-3).join('/')}`
}

function compactGeneratedDomainContractDebugAbsolutePaths(value) {
  const normalized = typeof value === 'string' ? value : ''
  if (!normalized) {
    return ''
  }

  const withWindowsPathsCompacted = normalized.replace(
    /[A-Za-z]:[\\/](?:[^\\/\s"'`]+[\\/])*[^\\/\s"'`]+/gu,
    (entry) => compactGeneratedDomainContractDebugAbsolutePath(entry),
  )

  return withWindowsPathsCompacted.replace(
    /(^|[\s("'`])\/(?:[^\/\s"'`]+\/){2,}[^\/\s"'`]+/gu,
    (entry, prefix) =>
      `${prefix}${compactGeneratedDomainContractDebugAbsolutePath(entry.slice(prefix.length))}`,
  )
}

function sanitizeGeneratedDomainContractDebugPreview(value, maxLength = 240) {
  const normalized =
    typeof value === 'string'
      ? value
      : value === null || value === undefined
        ? ''
        : String(value)
  if (!normalized.trim()) {
    return ''
  }

  let sanitized = normalized.replace(/\s+/gu, ' ').trim()

  sanitized = sanitized.replace(
    /\bheaders?\b\s*[:=]\s*(?:\{[^{}]*\}|\[[^[\]]*\]|"[^"]*"|'[^']*'|[^\s,;]+)/giu,
    'headers:[redacted]',
  )
  sanitized = sanitized.replace(
    /\bbod(?:y|ies)\b\s*[:=]\s*(?:\{[^{}]*\}|\[[^[\]]*\]|"[^"]*"|'[^']*'|[^\s,;]+)/giu,
    'body:[redacted]',
  )
  sanitized = sanitized.replace(
    /\bpayload\b\s*[:=]\s*(?:\{[^{}]*\}|\[[^[\]]*\]|"[^"]*"|'[^']*'|[^\s,;]+)/giu,
    'payload:[redacted]',
  )
  sanitized = sanitized.replace(
    /\b((?:api[_-]?key|access[_-]?token|refresh[_-]?token|id[_-]?token|token|secret|password|authorization))\b(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/giu,
    (_match, key, separator) => `${key}${separator}[redacted]`,
  )
  sanitized = sanitized.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/giu, 'Bearer [redacted]')
  sanitized = sanitized.replace(/\bsk-[A-Za-z0-9_-]{8,}\b/gu, '[redacted-api-key]')
  sanitized = compactGeneratedDomainContractDebugAbsolutePaths(sanitized)

  return buildOutputPreview(sanitized, maxLength)
}

function summarizeGeneratedDomainContractDebugEntries(entries, maxEntries = 3) {
  if (!Array.isArray(entries) || maxEntries <= 0) {
    return {
      firstEntry: undefined,
      preview: [],
    }
  }

  const preview = []
  const seen = new Set()

  for (const entry of entries) {
    const sanitized = sanitizeGeneratedDomainContractDebugPreview(entry, 240)
    if (!sanitized || seen.has(sanitized)) {
      continue
    }

    seen.add(sanitized)
    preview.push(sanitized)

    if (preview.length >= maxEntries) {
      break
    }
  }

  return {
    firstEntry: preview[0],
    preview,
  }
}

function buildSafeGeneratedDomainContractObservationErrorPreview(value) {
  return sanitizeGeneratedDomainContractDebugPreview(value, 180)
}

module.exports = {
  buildOutputPreview,
  buildSafeGeneratedDomainContractObservationErrorPreview,
  compactGeneratedDomainContractDebugAbsolutePath,
  compactGeneratedDomainContractDebugAbsolutePaths,
  formatMainDebugDetails,
  sanitizeGeneratedDomainContractDebugPreview,
  summarizeGeneratedDomainContractDebugEntries,
}
