function normalizeRootFolder(rootFolder) {
  return typeof rootFolder === 'string' && rootFolder.trim()
    ? rootFolder.trim().replace(/[\\/]+/g, '/')
    : ''
}

function buildPhaseBlueprint({
  id,
  title,
  description,
  targetStrategy = 'prepare-project-phase-plan',
  materializable = true,
  suggestedOrder,
  buildFiles,
  validationHints,
  nextRecommendedPhase = '',
}) {
  return {
    id,
    title,
    description,
    objective: description,
    summary: description,
    targetStrategy,
    materializable,
    suggestedOrder,
    buildFiles,
    validationHints,
    nextRecommendedPhase,
  }
}

const FULLSTACK_LOCAL_BASE_PHASES = [
  buildPhaseBlueprint({
    id: 'frontend-mock-flow',
    title: 'Frontend mock flow',
    description:
      'Refinar el frontend mock local sin instalar dependencias, fetch ni runtime real.',
    suggestedOrder: 10,
    buildFiles: (rootFolder, manifestPath) => [
      `${rootFolder}/frontend/src/mock-data.js`,
      `${rootFolder}/frontend/src/components/App.js`,
      `${rootFolder}/frontend/src/styles.css`,
      `${rootFolder}/docs/local-runbook.md`,
      manifestPath,
    ],
    validationHints: [
      'Abrir frontend/index.html por file:// y recorrer navegación, filtros y detalle.',
      'Confirmar que no se usen import/export, type="module" ni fetch.',
      'Verificar que el siguiente paso seguro quede en backend-contracts.',
    ],
    nextRecommendedPhase: 'backend-contracts',
  }),
  buildPhaseBlueprint({
    id: 'backend-contracts',
    title: 'Backend contracts',
    description:
      'Ampliar contratos backend y shared sin levantar servidores, listen() ni puertos.',
    suggestedOrder: 20,
    buildFiles: (rootFolder, manifestPath) => [
      `${rootFolder}/backend/src/server.js`,
      `${rootFolder}/backend/src/routes/health.js`,
      `${rootFolder}/backend/src/modules/appointments.js`,
      `${rootFolder}/backend/src/lib/response.js`,
      `${rootFolder}/shared/contracts/domain.js`,
      `${rootFolder}/shared/types/contracts.js`,
      `${rootFolder}/docs/architecture.md`,
      `${rootFolder}/docs/local-runbook.md`,
      manifestPath,
    ],
    validationHints: [
      'Ejecutar node --check sobre backend/src y shared/ como chequeo sugerido.',
      'Confirmar que no aparezca listen() ni apertura de puertos.',
      'Verificar que el siguiente paso seguro quede en database-design.',
    ],
    nextRecommendedPhase: 'database-design',
  }),
  buildPhaseBlueprint({
    id: 'database-design',
    title: 'Database design',
    description:
      'Completar el diseño SQL revisable sin crear base real, migraciones ni ejecutar seeds.',
    suggestedOrder: 30,
    buildFiles: (rootFolder, manifestPath) => [
      `${rootFolder}/database/schema.sql`,
      `${rootFolder}/database/seeds/seed-local.sql`,
      `${rootFolder}/database/README.md`,
      `${rootFolder}/scripts/seed-local.js`,
      `${rootFolder}/docs/architecture.md`,
      `${rootFolder}/docs/local-runbook.md`,
      manifestPath,
    ],
    validationHints: [
      'Revisar schema.sql, seed-local.sql y scripts/seed-local.js sin ejecutar SQL real.',
      'Confirmar que no aparezcan migraciones, conexión real ni Docker.',
      'Verificar que el siguiente paso seguro quede en local-validation.',
    ],
    nextRecommendedPhase: 'local-validation',
  }),
  buildPhaseBlueprint({
    id: 'local-validation',
    title: 'Local validation',
    description:
      'Validar el proyecto local sin instalar dependencias, levantar servicios ni tocar una DB real.',
    suggestedOrder: 40,
    buildFiles: (rootFolder, manifestPath) => [
      `${rootFolder}/docs/validation-report.md`,
      `${rootFolder}/docs/local-runbook.md`,
      manifestPath,
    ],
    validationHints: [
      'Leer docs/validation-report.md para revisar checks, límites y próxima fase.',
      'Confirmar que el proyecto siga sin node_modules, .env, Docker ni runtime real.',
      'Verificar que review-and-expand quede disponible después de esta fase.',
    ],
    nextRecommendedPhase: 'review-and-expand',
  }),
  buildPhaseBlueprint({
    id: 'review-and-expand',
    title: 'Review and expand',
    description:
      'Revisar lo ya materializado y decidir la siguiente expansión segura sin ejecutar runtime real.',
    materializable: false,
    suggestedOrder: 50,
    buildFiles: (rootFolder, manifestPath) => [
      `${rootFolder}/docs/validation-report.md`,
      `${rootFolder}/docs/local-runbook.md`,
      manifestPath,
    ],
    validationHints: [
      'Revisar módulos seguros materializables y próximos planes revisables.',
      'Diferenciar expansión segura actual de aprobaciones futuras sensibles.',
      'Mantener el proyecto en modo local seguro mientras no haya aprobaciones reales.',
    ],
    nextRecommendedPhase: '',
  }),
]

const FULLSTACK_LOCAL_BASE_PHASES_BY_ID = new Map(
  FULLSTACK_LOCAL_BASE_PHASES.map((entry) => [entry.id, entry]),
)

function getFullstackLocalBasePhaseDefinition(phaseId) {
  return FULLSTACK_LOCAL_BASE_PHASES_BY_ID.get(String(phaseId || '').trim()) || null
}

function buildFullstackLocalManifestPhaseBlueprints(rootFolder) {
  const normalizedRootFolder = normalizeRootFolder(rootFolder)

  if (!normalizedRootFolder) {
    return []
  }

  const manifestPath = `${normalizedRootFolder}/jefe-project.json`
  const scaffoldFiles = [
    `${normalizedRootFolder}/README.md`,
    `${normalizedRootFolder}/frontend/index.html`,
    `${normalizedRootFolder}/backend/src/server.js`,
    `${normalizedRootFolder}/shared/contracts/domain.js`,
    `${normalizedRootFolder}/database/schema.sql`,
    manifestPath,
  ]

  return [
    {
      id: 'fullstack-local-scaffold',
      title: 'Fullstack local scaffold',
      description:
        'Crear la base fullstack local revisable con frontend, backend, shared, database, docs y manifest sin instalar dependencias.',
      objective:
        'Dejar el proyecto base listo para abrir por file:// y seguir por fases seguras.',
      summary:
        'Scaffold local revisable materializado sin runtime real, sin base de datos real y sin integraciones externas.',
      targetStrategy: 'materialize-fullstack-local-plan',
      safeToMaterialize: false,
      approvalRequired: false,
      files: scaffoldFiles,
      allowedTargetPaths: scaffoldFiles,
      validationHints: [
        'Abrir frontend/index.html por file:// para confirmar la base local.',
        'Revisar backend, shared y database solo como referencia revisable.',
        'Confirmar que no existan node_modules, .env, Docker ni deploy.',
      ],
      nextRecommendedPhase: 'frontend-mock-flow',
    },
    ...FULLSTACK_LOCAL_BASE_PHASES.map((entry) => {
      const files = Array.isArray(entry.buildFiles)
        ? entry.buildFiles
        : typeof entry.buildFiles === 'function'
          ? entry.buildFiles(normalizedRootFolder, manifestPath)
          : []

      return {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        objective: entry.objective || entry.description,
        summary: entry.summary || entry.description,
        targetStrategy: entry.targetStrategy,
        safeToMaterialize: entry.materializable === true,
        approvalRequired: false,
        files,
        allowedTargetPaths: files,
        validationHints: Array.isArray(entry.validationHints) ? entry.validationHints : [],
        nextRecommendedPhase: entry.nextRecommendedPhase || '',
      }
    }),
  ]
}

module.exports = {
  FULLSTACK_LOCAL_BASE_PHASES,
  getFullstackLocalBasePhaseDefinition,
  buildFullstackLocalManifestPhaseBlueprints,
}
