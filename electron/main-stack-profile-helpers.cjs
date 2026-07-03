function normalizeSectorDetectionText(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return ''
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function detectStackPreference(text, candidates) {
  const normalizedText = normalizeSectorDetectionText(text)

  for (const candidate of candidates) {
    if (candidate.pattern.test(normalizedText)) {
      return candidate.value
    }
  }

  return ''
}

function buildExplicitRequestedStackProfile({
  goal,
  context,
  deliveryLevel,
  domainUnderstanding,
}) {
  const normalizedDeliveryLevel =
    typeof deliveryLevel === 'string' && deliveryLevel.trim()
      ? deliveryLevel.trim()
      : 'safe-first-delivery'
  const combinedText = [goal, context, domainUnderstanding?.domainLabel]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)
  const requestedStackProfile = {}

  if (/\bsveltekit\b/u.test(normalizedText)) {
    requestedStackProfile.frontend = 'sveltekit'
  } else if (/\bnext(?:\.js|js)?\b/u.test(normalizedText)) {
    requestedStackProfile.frontend = 'nextjs-app-router'
  } else if (/\bnuxt\b/u.test(normalizedText)) {
    requestedStackProfile.frontend = 'nuxt'
  } else if (/\bremix\b/u.test(normalizedText)) {
    requestedStackProfile.frontend = 'remix'
  } else if (/\bastro\b/u.test(normalizedText)) {
    requestedStackProfile.frontend = 'astro'
  } else if (/\bangular\b/u.test(normalizedText)) {
    requestedStackProfile.frontend = 'angular'
  } else if (/\bvue\b/u.test(normalizedText)) {
    requestedStackProfile.frontend = 'vue'
  }

  if (/\bprisma\b/u.test(normalizedText) && /\bsqlite\b/u.test(normalizedText)) {
    requestedStackProfile.database = 'prisma-sqlite'
  } else if (/\bdrizzle\b/u.test(normalizedText) && /\bpostgres(?:ql)?\b/u.test(normalizedText)) {
    requestedStackProfile.database = 'drizzle-postgres'
  }

  if (/\broute[\s-]?handlers?\b/u.test(normalizedText)) {
    requestedStackProfile.apiStyle = 'route-handlers'
  } else if (/\bgraphql\b/u.test(normalizedText)) {
    requestedStackProfile.apiStyle = 'graphql'
  }

  if (requestedStackProfile.frontend === 'nextjs-app-router') {
    requestedStackProfile.backend = 'nextjs-route-handlers'
  } else if (/\bgraphql\b/u.test(normalizedText)) {
    requestedStackProfile.backend = 'graphql-gateway'
  } else if (/\bfastify\b/u.test(normalizedText)) {
    requestedStackProfile.backend = 'fastify'
  } else if (/\bnest(?:js)?\b/u.test(normalizedText)) {
    requestedStackProfile.backend = 'nestjs'
  } else if (/\bhono\b/u.test(normalizedText)) {
    requestedStackProfile.backend = 'hono'
  }

  if (
    (/\bhttp[\s-]?only\b|\bhttponly\b/u.test(normalizedText) && /\bcookie\b/u.test(normalizedText)) ||
    /\bbcrypt\b/u.test(normalizedText) ||
    /\brbac\b/u.test(normalizedText)
  ) {
    requestedStackProfile.auth = 'http-only-cookie-rbac-bcrypt'
  } else if (/\bauth0\b/u.test(normalizedText) || /\bjwt\b/u.test(normalizedText)) {
    requestedStackProfile.auth = 'auth0-jwt'
  }

  if (/\btailwind(?:css)?\b/u.test(normalizedText)) {
    requestedStackProfile.styling = 'tailwindcss'
  } else if (/\bchakra(?:\s+ui|-ui)?\b/u.test(normalizedText)) {
    requestedStackProfile.styling = 'chakra-ui'
  }

  if (/\bplaywright\b/u.test(normalizedText) && /\bvitest\b/u.test(normalizedText)) {
    requestedStackProfile.testing = 'playwright-vitest'
  }

  if (/\bpnpm\b/u.test(normalizedText)) {
    requestedStackProfile.packageManager = 'pnpm'
  } else if (/\byarn\b/u.test(normalizedText)) {
    requestedStackProfile.packageManager = 'yarn'
  } else if (/\bbun\b/u.test(normalizedText)) {
    requestedStackProfile.packageManager = 'bun'
    requestedStackProfile.runtime = 'bun'
  } else if (/\bnpm\b/u.test(normalizedText)) {
    requestedStackProfile.packageManager = 'npm'
  }

  if (/\bnode\s*18\b|\bnode18\b/u.test(normalizedText)) {
    requestedStackProfile.runtime = 'node18'
  }

  if (
    normalizedDeliveryLevel !== 'fullstack-local' &&
    normalizedDeliveryLevel !== 'frontend-project' &&
    normalizedDeliveryLevel !== 'monorepo-local'
  ) {
    return null
  }

  return Object.keys(requestedStackProfile).length > 0 ? requestedStackProfile : null
}

function buildStackProfile({
  goal,
  context,
  deliveryLevel,
  domainUnderstanding,
}) {
  const normalizedDeliveryLevel =
    typeof deliveryLevel === 'string' && deliveryLevel.trim()
      ? deliveryLevel.trim()
      : 'safe-first-delivery'
  const combinedText = [goal, context, domainUnderstanding?.domainLabel]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
  const normalizedText = normalizeSectorDetectionText(combinedText)
  const frontendPreference = detectStackPreference(combinedText, [
    { pattern: /\bnext(?:\.js|js)?\b/u, value: 'nextjs-app-router-plan' },
    { pattern: /\breact\b/u, value: 'react-ready-static' },
    { pattern: /\bvue\b/u, value: 'vue-local-plan' },
    { pattern: /\bangular\b/u, value: 'angular-local-plan' },
    { pattern: /\bsvelte\b/u, value: 'svelte-local-plan' },
    { pattern: /\bastro\b/u, value: 'astro-local-plan' },
  ])
  const backendPreference = detectStackPreference(combinedText, [
    { pattern: /\bfastapi\b/u, value: 'fastapi-style' },
    { pattern: /\bdjango\b/u, value: 'django-style' },
    { pattern: /\blaravel\b|\bphp\b/u, value: 'laravel-style' },
    { pattern: /\b\.net\b|\bdotnet\b|\bc#\b/u, value: 'dotnet-webapi-style' },
    { pattern: /\bspring\b|\bjava\b/u, value: 'spring-style' },
    { pattern: /\bexpress\b/u, value: 'node-express-style' },
  ])
  const databasePreference = detectStackPreference(combinedText, [
    { pattern: /\bpostgres(?:ql)?\b/u, value: 'postgres-ready-local-design' },
    { pattern: /\bsqlite\b/u, value: 'sqlite-local-design' },
    { pattern: /\bmysql\b/u, value: 'mysql-ready-local-design' },
    { pattern: /\bmongo(?:db)?\b/u, value: 'mongo-ready-local-design' },
    { pattern: /\bredis\b/u, value: 'redis-local-plan' },
  ])
  const packageManagerPreference = detectStackPreference(combinedText, [
    { pattern: /\bpnpm\b/u, value: 'pnpm-deferred' },
    { pattern: /\byarn\b/u, value: 'yarn-deferred' },
    { pattern: /\bbun\b/u, value: 'bun-deferred' },
    { pattern: /\bcomposer\b/u, value: 'composer-deferred' },
    { pattern: /\bpip\b/u, value: 'pip-deferred' },
    { pattern: /\bdotnet\b|\b\.net\b/u, value: 'dotnet-cli-deferred' },
  ])
  const explicitRequestedStackProfile = buildExplicitRequestedStackProfile({
    goal,
    context,
    deliveryLevel: normalizedDeliveryLevel,
    domainUnderstanding,
  })
  const prefersSupportedNextAppRouterProfile =
    explicitRequestedStackProfile?.frontend === 'nextjs-app-router' &&
    explicitRequestedStackProfile?.database === 'prisma-sqlite' &&
    explicitRequestedStackProfile?.styling === 'tailwindcss'

  if (normalizedDeliveryLevel === 'infra-local-plan') {
    return {
      frontend: frontendPreference || 'none',
      backend: backendPreference || 'service-runtime-deferred',
      database: databasePreference || 'postgres-local-plan',
      apiStyle: 'runtime-plan',
      auth: 'deferred',
      styling: 'n/a',
      testing: 'manual-safety-review',
      packageManager: packageManagerPreference || 'deferred',
      runtime: 'local-infra-plan',
    }
  }

  if (normalizedDeliveryLevel === 'monorepo-local') {
    return {
      frontend: frontendPreference || 'app-web',
      backend: backendPreference || 'api-service',
      database: databasePreference || 'local-design',
      apiStyle: 'rest',
      auth: normalizedText.includes('auth real') ? 'approval-required' : 'deferred',
      styling:
        frontendPreference && frontendPreference.includes('nextjs')
          ? 'component-system-plan'
          : 'css-modular-simple',
      testing: 'manual-smoke-first',
      packageManager: packageManagerPreference || 'workspace-deferred',
      runtime: 'multi-service-local-plan',
    }
  }

  if (normalizedDeliveryLevel === 'fullstack-local') {
    return {
      frontend:
        explicitRequestedStackProfile?.frontend || frontendPreference || 'react-ready-static',
      backend:
        explicitRequestedStackProfile?.backend ||
        (prefersSupportedNextAppRouterProfile
          ? 'nextjs-route-handlers'
          : backendPreference || 'node-express-style'),
      database:
        explicitRequestedStackProfile?.database ||
        databasePreference ||
        (/\bbase de datos\b|\bsql\b/u.test(normalizedText)
          ? 'sql-local-design'
          : 'mock-data'),
      apiStyle:
        explicitRequestedStackProfile?.apiStyle ||
        (prefersSupportedNextAppRouterProfile
          ? 'route-handlers'
          : /\bgraphql\b/u.test(normalizedText)
            ? 'graphql'
            : 'rest'),
      auth:
        explicitRequestedStackProfile?.auth ||
        (normalizedText.includes('auth real') ? 'approval-required' : 'deferred'),
      styling:
        explicitRequestedStackProfile?.styling ||
        (frontendPreference && frontendPreference.includes('vue')
          ? 'component-css-plan'
          : 'css-modular-simple'),
      testing: explicitRequestedStackProfile?.testing || 'manual-smoke-first',
      packageManager:
        explicitRequestedStackProfile?.packageManager ||
        packageManagerPreference ||
        'npm-deferred',
      runtime:
        explicitRequestedStackProfile?.runtime ||
        (backendPreference === 'fastapi-style'
          ? 'python-local-plan'
          : backendPreference === 'laravel-style'
            ? 'php-local-plan'
            : backendPreference === 'dotnet-webapi-style'
              ? 'dotnet-local-plan'
              : backendPreference === 'spring-style'
                ? 'jvm-local-plan'
                : 'node-local-plan'),
    }
  }

  if (normalizedDeliveryLevel === 'frontend-project') {
    return {
      frontend: frontendPreference || 'react-ready-static',
      backend: 'none',
      database: 'mock-data',
      apiStyle: 'none/local-mock',
      auth: 'deferred',
      styling:
        frontendPreference === 'nextjs-app-router-plan'
          ? 'component-system-plan'
          : 'css-modular-simple',
      testing: 'manual-smoke-first',
      packageManager: packageManagerPreference || 'none-yet',
      runtime: 'static-local-review',
    }
  }

  return {
    frontend: frontendPreference || 'vanilla-js-static',
    backend: 'none',
    database: 'mock-data',
    apiStyle: 'none/local-mock',
    auth: 'deferred',
    styling: 'css-simple',
    testing: 'manual-smoke-first',
    packageManager: 'none-yet',
    runtime: 'static-local-review',
  }
}

module.exports = {
  buildExplicitRequestedStackProfile,
  buildStackProfile,
}