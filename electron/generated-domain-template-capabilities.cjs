function normalizeOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

const GENERATED_DOMAIN_SPECIALIZED_TEMPLATE_CAPABILITIES = [
  {
    id: 'node-sqlite-rest-backoffice',
    artifactBuilderKey: 'node-sqlite-rest-backoffice',
    rules: {
      frontend: { pattern: /vanilla|static|html|css/u },
      backend: { pattern: /node|http|local-js|local/u },
      database: { pattern: /sqlite|node:sqlite|node-sqlite|sqlite-schema/u },
      apiStyle: { pattern: /rest|crud|http|mock/u },
      auth: {
        optional: true,
        pattern: /deferred|mock|none|role|rbac/u,
      },
      styling: {
        optional: true,
        pattern: /vanilla|css|plain|none/u,
      },
      testing: {
        optional: true,
        pattern: /smoke|manual|node/u,
      },
      runtime: {
        optional: true,
        pattern: /node|local/u,
      },
    },
  },
  {
    id: 'nextjs-app-router-prisma-sqlite-tailwind',
    artifactBuilderKey: 'nextjs-app-router-prisma-sqlite-tailwind',
    rules: {
      frontend: { pattern: /next(?:\.js|js)|app-router/u },
      database: { patterns: [/prisma/u, /sqlite/u] },
      styling: { pattern: /tailwind/u },
      backend: {
        optional: true,
        pattern: /next(?:\.js|js)|route-handlers|app-router/u,
      },
      apiStyle: {
        optional: true,
        pattern: /route-handlers|rest|app-router/u,
      },
      auth: {
        optional: true,
        pattern: /cookie|httponly|http-only|rbac|bcrypt|deferred|mock/u,
      },
    },
  },
]

const GENERATED_DOMAIN_SPECIALIZED_STACK_BLOCKERS = [
  {
    field: 'frontend',
    pattern: /next(?:\.js|js)|app-router|nuxt|sveltekit|remix|astro|angular|vue|solidstart/u,
    message:
      'El frontend pedido requiere un generador especializado y no puede degradarse a HTML/JS sandbox generico.',
  },
  {
    field: 'backend',
    pattern: /express|fastify|nest|nestjs|hono|koa|graphql|trpc/u,
    message:
      'El backend pedido depende de una familia de runtime con dependencias que el generador sandbox actual no emite.',
  },
  {
    field: 'database',
    pattern: /prisma|drizzle|typeorm|mikro-?orm|sequelize|postgres|postgresql|mysql|mongodb/u,
    message:
      'La capa de datos pedida requiere ORM o motor especifico que el generador universal actual no soporta.',
  },
  {
    field: 'apiStyle',
    pattern: /route-?handler|server-?action|graphql|trpc/u,
    message:
      'El estilo de API pedido requiere una topologia de framework que el scaffold universal actual no representa.',
  },
  {
    field: 'auth',
    pattern: /cookie|httponly|http-only|session|sessions|bcrypt|rbac|jwt|nextauth|clerk|lucia|auth0/u,
    message:
      'La autenticacion/autorizacion pedida requiere un generador especializado; el scaffold actual solo cubre auth mock o diferida.',
  },
  {
    field: 'styling',
    pattern: /tailwind|chakra|material-ui|mui|radix|shadcn|styled-components|sass|scss/u,
    message:
      'El sistema de estilos pedido requiere assets y convenciones que el generador sandbox actual no puede materializar fielmente.',
  },
]

function normalizeGeneratedDomainRequestedStackProfile(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const normalized = {
    ...(normalizeOptionalString(value.frontend) ? { frontend: normalizeOptionalString(value.frontend) } : {}),
    ...(normalizeOptionalString(value.backend) ? { backend: normalizeOptionalString(value.backend) } : {}),
    ...(normalizeOptionalString(value.database) ? { database: normalizeOptionalString(value.database) } : {}),
    ...(normalizeOptionalString(value.apiStyle) ? { apiStyle: normalizeOptionalString(value.apiStyle) } : {}),
    ...(normalizeOptionalString(value.auth) ? { auth: normalizeOptionalString(value.auth) } : {}),
    ...(normalizeOptionalString(value.styling) ? { styling: normalizeOptionalString(value.styling) } : {}),
    ...(normalizeOptionalString(value.testing) ? { testing: normalizeOptionalString(value.testing) } : {}),
    ...(normalizeOptionalString(value.packageManager)
      ? { packageManager: normalizeOptionalString(value.packageManager) }
      : {}),
    ...(normalizeOptionalString(value.runtime) ? { runtime: normalizeOptionalString(value.runtime) } : {}),
  }

  return Object.keys(normalized).length > 0 ? normalized : null
}

function matchesCapabilityField(rawValue, rule) {
  const normalizedValue = normalizeOptionalString(rawValue).toLocaleLowerCase()

  if (!normalizedValue) {
    return rule.optional === true
  }

  if (rule.pattern instanceof RegExp) {
    return rule.pattern.test(normalizedValue)
  }

  if (Array.isArray(rule.patterns) && rule.patterns.length > 0) {
    return rule.patterns.every((pattern) => pattern instanceof RegExp && pattern.test(normalizedValue))
  }

  return false
}

function matchesSpecializedTemplateCapability(stackProfile, capability) {
  if (!stackProfile || typeof stackProfile !== 'object' || !capability || typeof capability !== 'object') {
    return false
  }

  const capabilityRules = capability.rules && typeof capability.rules === 'object' ? capability.rules : {}
  return Object.entries(capabilityRules).every(([field, rule]) => matchesCapabilityField(stackProfile[field], rule))
}

function getGeneratedDomainSpecializedTemplateCapability(templateFamily) {
  const normalizedTemplateFamily = normalizeOptionalString(templateFamily)
  if (!normalizedTemplateFamily) {
    return null
  }

  return (
    GENERATED_DOMAIN_SPECIALIZED_TEMPLATE_CAPABILITIES.find(
      (entry) => entry.id === normalizedTemplateFamily,
    ) || null
  )
}

function resolveGeneratedDomainGeneratorReadiness({ stackProfile } = {}) {
  const normalizedStackProfile = normalizeGeneratedDomainRequestedStackProfile(stackProfile)
  const emptyReadiness = {
    requested: false,
    supportedNow: true,
    specializedGeneratorRequired: false,
    templateFamily: 'generic-sandbox-fullstack-local',
    blockingReasons: [],
    stackProfile: null,
  }

  if (!normalizedStackProfile) {
    return emptyReadiness
  }

  const supportedCapability = GENERATED_DOMAIN_SPECIALIZED_TEMPLATE_CAPABILITIES.find((capability) =>
    matchesSpecializedTemplateCapability(normalizedStackProfile, capability),
  )

  if (supportedCapability) {
    return {
      requested: true,
      supportedNow: true,
      specializedGeneratorRequired: true,
      templateFamily: supportedCapability.id,
      blockingReasons: [],
      stackProfile: normalizedStackProfile,
    }
  }

  const blockingReasons = GENERATED_DOMAIN_SPECIALIZED_STACK_BLOCKERS.flatMap((entry) => {
    const normalizedValue = normalizeOptionalString(normalizedStackProfile[entry.field]).toLocaleLowerCase()
    return normalizedValue && entry.pattern.test(normalizedValue) ? [entry.message] : []
  })

  const specializedGeneratorRequired = blockingReasons.length > 0

  return {
    requested: true,
    supportedNow: !specializedGeneratorRequired,
    specializedGeneratorRequired,
    templateFamily: specializedGeneratorRequired
      ? 'unsupported-specialized-stack'
      : 'generic-sandbox-fullstack-local',
    blockingReasons,
    stackProfile: normalizedStackProfile,
  }
}

module.exports = {
  GENERATED_DOMAIN_SPECIALIZED_TEMPLATE_CAPABILITIES,
  GENERATED_DOMAIN_SPECIALIZED_STACK_BLOCKERS,
  getGeneratedDomainSpecializedTemplateCapability,
  normalizeGeneratedDomainRequestedStackProfile,
  resolveGeneratedDomainGeneratorReadiness,
}