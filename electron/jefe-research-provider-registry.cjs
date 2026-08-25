function definition(value) {
  return Object.freeze({
    ...value,
    capabilities: Object.freeze([...value.capabilities]),
    purposes: Object.freeze([...value.purposes]),
    risks: Object.freeze([...value.risks]),
  })
}

const TYPES = Object.freeze({
  manual_reference: definition({ capabilities: ['reference'], purposes: ['discovery', 'research'], requiresNetwork: false, requiresCredentials: false, receivesExternalContent: true, integrationState: 'registered', fallback: null, trust: 'unverified', evidenceRequired: true, risks: ['untrusted_content'] }),
  metasearch: definition({ capabilities: ['search'], purposes: ['research'], requiresNetwork: true, requiresCredentials: false, receivesExternalContent: true, integrationState: 'not_connected', fallback: 'manual_reference', trust: 'unverified', evidenceRequired: true, risks: ['network', 'untrusted_content'] }),
  automated_browser: definition({ capabilities: ['browse'], purposes: ['research'], requiresNetwork: true, requiresCredentials: false, receivesExternalContent: true, integrationState: 'not_connected', fallback: 'manual_reference', trust: 'unverified', evidenceRequired: true, risks: ['network', 'browser', 'untrusted_content'] }),
  crawler: definition({ capabilities: ['extract'], purposes: ['research'], requiresNetwork: true, requiresCredentials: false, receivesExternalContent: true, integrationState: 'not_connected', fallback: 'manual_reference', trust: 'unverified', evidenceRequired: true, risks: ['network', 'untrusted_content'] }),
  local_model: definition({ capabilities: ['analyze'], purposes: ['research'], requiresNetwork: false, requiresCredentials: false, receivesExternalContent: true, integrationState: 'not_configured', fallback: 'structured_analysis', trust: 'inference', evidenceRequired: true, risks: ['inference'] }),
  structured_analysis: definition({ capabilities: ['analyze'], purposes: ['research'], requiresNetwork: false, requiresCredentials: false, receivesExternalContent: false, integrationState: 'registered', fallback: null, trust: 'inference', evidenceRequired: true, risks: ['inference'] }),
  corroboration: definition({ capabilities: ['corroborate'], purposes: ['research'], requiresNetwork: false, requiresCredentials: false, receivesExternalContent: false, integrationState: 'registered', fallback: null, trust: 'technical', evidenceRequired: true, risks: ['independence'] }),
})
const STATES = Object.freeze(['registered', 'disabled', 'not_configured', 'not_connected', 'available', 'restricted', 'blocked'])

class ResearchProviderRegistryError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
  }
}

function fail(code, message) {
  throw new ResearchProviderRegistryError(code, message)
}

function getProvider(providerType, trusted = {}) {
  if (typeof providerType !== 'string' || !Object.hasOwn(TYPES, providerType)) fail('UNKNOWN_PROVIDER', 'Proveedor no registrado.')
  if (!trusted || typeof trusted !== 'object' || Array.isArray(trusted)) fail('INVALID_TRUSTED_CONFIGURATION', 'Configuracion confiable invalida.')
  const configured = trusted.providers && Object.hasOwn(trusted.providers, providerType) ? trusted.providers[providerType] : {}
  if (!configured || typeof configured !== 'object' || Array.isArray(configured) || Object.keys(configured).some((key) => key !== 'state')) fail('INVALID_TRUSTED_CONFIGURATION', 'Configuracion confiable invalida.')
  const state = configured.state || TYPES[providerType].integrationState
  if (!STATES.includes(state)) fail('INVALID_PROVIDER_STATE', 'Estado de proveedor invalido.')
  return Object.freeze({ ...TYPES[providerType], providerType, state })
}

function listProviders(trusted = {}) {
  return Object.keys(TYPES).sort().map((providerType) => getProvider(providerType, trusted))
}

module.exports = { TYPES, STATES, ResearchProviderRegistryError, getProvider, listProviders }
