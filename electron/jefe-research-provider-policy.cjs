const { getProvider } = require('./jefe-research-provider-registry.cjs')
const LIMITS = Object.freeze({ maxQueries: 8, maxSources: 12, maxBytesPerReceipt: 65536, maxTotalBytes: 262144, maxDepth: 3, maxDurationMs: 30000, maxRedirects: 3, maxAttempts: 2, maxCorroborations: 3 })
const ROLES = Object.freeze({ radar: 'discovery', scout: 'research', hermes: 'research', jefe: 'supervision' })
const SENSITIVE_URL = /password|passphrase|token|api.?key|secret|cookie|authorization|bearer|credential|private.?key/iu
const INVISIBLE_URL = /[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u
class ResearchProviderPolicyError extends Error { constructor(code, message) { super(message); this.code = code } }; function fail(code, message) { throw new ResearchProviderPolicyError(code, message) }
function budget(raw = {}) { if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some((key) => !Object.hasOwn(LIMITS, key))) fail('INVALID_BUDGET', 'Presupuesto invalido.'); const out = {}; for (const [key, cap] of Object.entries(LIMITS)) { const value = raw[key] === undefined ? cap : raw[key]; if (!Number.isSafeInteger(value) || value < 1 || value > cap) fail('INVALID_BUDGET', 'Presupuesto invalido.'); out[key] = value } return out }
function safeUrl(value) {
  if (typeof value !== 'string') fail('INVALID_URL', 'Referencia URL invalida.')
  const normalized = value.normalize('NFKC')
  if (normalized.length > 500 || /[\x00-\x1f\x7f]/u.test(normalized) || INVISIBLE_URL.test(normalized) || SENSITIVE_URL.test(normalized)) fail('INVALID_URL', 'Referencia URL invalida.')
  let url
  try { url = new URL(normalized) } catch { fail('INVALID_URL', 'Referencia URL invalida.') }
  let decoded
  try { decoded = decodeURIComponent(`${url.pathname}${url.search}`).normalize('NFKC') } catch { fail('INVALID_URL', 'Referencia URL invalida.') }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/gu, '')
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || !host || host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host === '0.0.0.0' || /^127(?:\.\d{1,3}){3}$/u.test(host) || /(?:^|\/)\.\.(?:\/|$)/u.test(url.pathname) || INVISIBLE_URL.test(decoded) || SENSITIVE_URL.test(decoded)) fail('INVALID_URL', 'Referencia URL invalida.')
  return url.toString()
}
function select(input = {}, trusted = {}) { if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some((key) => !['providerType', 'purpose', 'role', 'budget', 'references'].includes(key))) fail('INVALID_POLICY_REQUEST', 'Solicitud de politica invalida.'); const provider = getProvider(input.providerType, trusted); if (!Object.hasOwn(ROLES, input.role) || !provider.purposes.includes(input.purpose) || (input.role === 'radar' && input.purpose !== 'discovery') || (!['radar', 'scout', 'hermes'].includes(input.role))) fail('POLICY_BLOCKED', 'La politica no permite esta solicitud.'); const normalizedBudget = budget(input.budget); const references = input.references === undefined ? [] : input.references.map(safeUrl); const networkEnabled = trusted.networkEnabled === true; let status = 'available'; if (provider.state === 'disabled' || provider.state === 'blocked' || provider.state === 'restricted') status = 'policy_blocked'; else if (provider.requiresNetwork && !networkEnabled) status = 'policy_blocked'; else if (provider.state !== 'available' && provider.state !== 'registered') status = 'not_connected'; return { status, provider, budget: normalizedBudget, references, networkEnabled, authority: 'technical_result', provenance: 'trusted_research_provider_policy', fallback: provider.fallback } }
module.exports = { LIMITS, ROLES, ResearchProviderPolicyError, budget, safeUrl, select }
