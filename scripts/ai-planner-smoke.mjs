import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const mainFilePath = path.join(repoRoot, 'electron', 'main.cjs')
const mainSource = fs.readFileSync(mainFilePath, 'utf8')
const {
  LOCAL_MATERIALIZATION_PLAN_VERSION,
  buildLocalMaterializationTask,
  runLocalDeterministicTask,
} = require(
  path.join(repoRoot, 'electron', 'local-deterministic-executor.cjs'),
)
const requiredPlannerFunctions = [
  'buildDomainUnderstanding',
  'buildProductArchitecturePlan',
  'buildSafeFirstDeliveryPlan',
  'buildMaterializeSafeFirstDeliveryPlan',
  'buildLocalStrategicBrainDecision',
]

const activeCases = [
  {
    id: 'social-barrial',
    label: 'App social barrial',
    goal:
      'Hacer una app social para comunidades barriales con perfiles, publicaciones, comentarios, grupos, notificaciones y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para una app social barrial. Revisar perfiles, publicaciones, comentarios, grupos, notificaciones, reportes, busqueda, filtro por estado, detalle seleccionado, acciones locales y log de actividad.',
    mustInclude: ['perfiles', 'publicaciones', 'comentarios', 'grupos', 'notificaciones', 'reportes'],
    mustExclude: [
      'accesos',
      'alertas',
      'sensores',
      'zonas',
      'operadores',
      'alumnos',
      'familias',
      'cursos',
      'productos',
      'carrito',
      'checkout',
      'documentos',
      'vencimientos',
    ],
    folderAnyOf: ['safe-first-delivery-social'],
  },
  {
    id: 'documental-puro',
    label: 'Sistema documental puro',
    goal:
      'Hacer un sistema documental para gestionar documentos, operaciones, vencimientos, observaciones, responsables y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para un sistema documental. Revisar documentos, operaciones, vencimientos, observaciones, responsables, reportes, busqueda, filtro por estado, detalle seleccionado, acciones locales y log de actividad.',
    mustInclude: ['documentos', 'operaciones', 'vencimientos', 'observaciones', 'responsables', 'reportes'],
    mustExclude: [
      'accesos',
      'solicitudes',
      'sensores',
      'zonas',
      'operadores',
      'carrito',
      'checkout',
      'alumnos',
      'familias',
    ],
    folderAnyOf: ['safe-first-delivery-documental'],
  },
  {
    id: 'seguridad',
    label: 'Sistema de seguridad',
    goal:
      'Hacer un sistema de seguridad para monitorear accesos, alertas, sensores, zonas, operadores y eventos.',
    context:
      'Quiero validar una primera entrega segura local y mock para seguridad y monitoreo. Revisar accesos, alertas, sensores, zonas, operadores, eventos, busqueda, filtro por estado, detalle seleccionado y log de actividad.',
    mustInclude: ['accesos', 'alertas', 'sensores', 'zonas', 'operadores', 'eventos', 'reportes'],
    mustExclude: [
      'perfiles',
      'publicaciones',
      'documentos',
      'vencimientos',
      'productos',
      'carrito',
      'checkout',
      'alumnos',
      'familias',
      'cursos',
    ],
    mustMention: ['panel de monitoreo'],
    folderAnyOf: ['safe-first-delivery-seguridad'],
  },
  {
    id: 'ecommerce',
    label: 'Ecommerce',
    goal: 'Hacer un ecommerce con productos, carrito, ordenes, checkout simulado y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para ecommerce con catalogo, productos, carrito, checkout simulado, ordenes y reportes.',
    mustInclude: ['productos', 'carrito', 'checkout simulado', 'ordenes', 'reportes'],
    folderAnyOf: ['safe-first-delivery-ecommerce'],
  },
  {
    id: 'crm-escolar',
    label: 'CRM escolar',
    goal:
      'Hacer un CRM para escuelas con alumnos, familias, cursos, comunicaciones, seguimiento y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para un CRM escolar con alumnos, familias, cursos, comunicaciones, seguimiento y reportes.',
    mustInclude: ['alumnos', 'familias', 'cursos', 'comunicaciones', 'seguimiento', 'reportes'],
    folderAnyOf: ['safe-first-delivery-crm'],
  },
  {
    id: 'solicitudes-operativas',
    label: 'Solicitudes operativas',
    goal:
      'Hacer un sistema interno para gestionar solicitudes operativas, revisar estados, registrar observaciones y generar reportes simples.',
    context:
      'Quiero validar una primera entrega segura local y mock para solicitudes operativas con estados, observaciones, reportes, busqueda, detalle seleccionado y acciones locales.',
    mustInclude: ['solicitudes', 'estados', 'observaciones', 'reportes'],
    folderAnyOf: ['safe-first-delivery-solicitudes'],
  },
  {
    id: 'reservas-canchas',
    label: 'Reservas de canchas',
    goal:
      'Hacer un sistema de reservas de canchas para gestionar canchas, horarios, reservas, clientes, disponibilidad y reportes.',
    context:
      'Quiero validar una primera entrega segura local y mock para reservas de canchas con disponibilidad, horarios, reservas, clientes, reportes y acciones locales.',
    mustInclude: ['canchas', 'horarios', 'reservas', 'clientes', 'disponibilidad', 'reportes'],
    mustExclude: [
      'ecommerce',
      'checkout',
      'alumnos',
      'familias',
      'accesos',
      'sensores',
      'documentos',
      'perfiles',
    ],
    folderAnyOf: ['safe-first-delivery-reservas', 'safe-first-delivery-canchas'],
  },
]

const candidateCases = [
  {
    id: 'turnos-medicos',
    reason:
      'Hoy detecta turnos, disponibilidad, pacientes y profesionales, pero todavia no preserva especialidades y el folder cae en safe-first-delivery-negocio.',
  },
  {
    id: 'logistica-entregas',
    reason:
      'Hoy solo conserva rutas, estados y reportes; faltan envios, entregas, choferes y vehiculos, y el folder cae en safe-first-delivery-negocio.',
  },
  {
    id: 'navegacion-rutas',
    reason:
      'Hoy conserva rutas, ubicaciones y reportes, pero todavia no preserva puntos de interes ni vehiculos, y el folder cae en safe-first-delivery-negocio.',
  },
]

const scalableValidationCases = [
  {
    id: 'landing-relojeria',
    label: 'Pedido chico',
    goal: 'Hacer una landing para una relojería premium.',
    context: '',
    acceptedStrategies: ['web-scaffold-base', 'safe-first-delivery-plan'],
    rejectedStrategies: ['scalable-delivery-plan'],
  },
  {
    id: 'frontend-project',
    label: 'Frontend project',
    goal:
      'Hacer una app React completa para reservas de canchas con componentes, rutas, mocks y estructura de proyecto.',
    context: '',
    expectedDeliveryLevel: 'frontend-project',
    expectProjectBlueprint: true,
    expectedBlueprintRoles: ['cliente', 'operador local'],
    expectedBlueprintModules: ['frontend shell', 'componentes', 'mocks locales'],
    expectedStackProfile: {
      frontend: 'react-ready-static',
      backend: 'none',
      database: 'mock-data',
      apiStyle: 'none/local-mock',
    },
    expectImplementationRoadmap: true,
    expectedRoadmapPhaseTokens: [
      'review-frontend-plan',
      'materialize-frontend-local',
      'validate-frontend-files',
    ],
    expectedNextActionType: 'prepare-materialization',
    expectedNextActionStrategy: 'materialize-frontend-project-plan',
    expectedNextActionSafeToRunNow: true,
    expectedNextActionRequiresApproval: false,
    expectValidationPlan: true,
  },
  {
    id: 'fullstack-local',
    label: 'Fullstack local',
    goal:
      'Hacer un sistema fullstack local para turnos médicos con frontend, backend y base de datos local.',
    context: '',
    expectedDeliveryLevel: 'fullstack-local',
    expectProjectBlueprint: true,
    expectedTargetStructureTokens: [
      'frontend/',
      'backend/',
      'shared/',
      'database/',
      'scripts/',
      'docs/',
    ],
    expectedDirectoryTokens: [
      'frontend/src',
      'backend/src',
      'shared/contracts',
      'database/migrations',
      'scripts',
      'docs',
    ],
    expectedFileTokens: [
      'README.md',
      'package.json',
      'frontend/package.json',
      'frontend/src/main.js',
      'backend/package.json',
      'backend/src/server.js',
      'shared/contracts/domain.js',
      'database/schema.sql',
      'scripts/seed-local.js',
      'docs/architecture.md',
      'docs/local-runbook.md',
    ],
    expectedLocalConstraintTokens: [
      'workspace local',
      'No corresponde instalar dependencias',
      'No corresponde levantar frontend',
      'database local queda como esquema o documentación revisable',
      'Migraciones reales',
    ],
    expectedApprovalTokens: [
      'Instalar dependencias locales del frontend y backend',
      'Levantar manualmente el frontend local y el backend local',
      'Crear o migrar una base de datos local real',
      'Configurar auth real',
      'Integrar servicios externos',
      'Usar datos reales',
    ],
    expectedBlueprintRoles: ['pacientes', 'profesionales', 'operador interno'],
    expectedBlueprintModules: [
      'frontend local',
      'backend local',
      'shared contracts',
      'database design',
      'scripts locales',
      'documentacion',
    ],
    expectedBlueprintEntities: [
      'pacientes',
      'profesionales',
      'turnos',
      'especialidades',
      'disponibilidad',
    ],
    expectedPhaseTokens: [
      'blueprint-fullstack',
      'scaffold-fullstack-local',
      'habilitacion-local-real',
    ],
    expectedStackProfile: {
      frontend: 'react-ready-static',
      backend: 'node-express-style',
      database: 'sql-local-design',
      apiStyle: 'rest',
      auth: 'deferred',
      testing: 'manual-smoke-first',
      packageManager: 'npm-deferred',
    },
    expectImplementationRoadmap: true,
    expectedRoadmapPhaseTokens: [
      'blueprint-fullstack',
      'scaffold-fullstack-local',
      'frontend-mock-flow',
      'backend-contracts',
      'database-design',
      'validate-fullstack-local',
      'approve-real-runtime',
    ],
    expectedNextActionType: 'prepare-materialization',
    expectedNextActionStrategy: 'materialize-fullstack-local-plan',
    expectedNextActionSafeToRunNow: true,
    expectedNextActionRequiresApproval: false,
    expectValidationPlan: true,
  },
  {
    id: 'monorepo-local',
    label: 'Monorepo local',
    goal:
      'Hacer un monorepo local con app web, API, workers, paquetes compartidos y documentación.',
    context: '',
    expectedDeliveryLevel: 'monorepo-local',
    expectProjectBlueprint: true,
    expectedTargetStructureTokens: [
      'apps/',
      'apps/web/',
      'apps/api/',
      'packages/',
      'services/workers/',
      'scripts/',
      'docs/',
      'local-runtime/',
    ],
    expectedFileTokens: [
      'package.json',
      'apps/web/package.json',
      'apps/api/package.json',
      'services/workers/package.json',
      'packages/shared/package.json',
      'docs/architecture.md',
      'docs/local-runbook.md',
      'scripts/README.md',
      'local-runtime/README.md',
    ],
    expectedBlueprintModules: [
      'apps web',
      'api service',
      'workers',
      'shared contracts',
      'ui package',
    ],
    expectedPhaseTokens: ['blueprint-monorepo', 'workspaces-futuros'],
    expectImplementationRoadmap: true,
    expectedRoadmapPhaseTokens: [
      'blueprint-monorepo',
      'package-contracts',
      'runtime-local-proposal',
    ],
    expectedNextActionType: 'review-plan',
    expectedNextActionStrategy: 'scalable-delivery-plan',
    expectedNextActionSafeToRunNow: true,
    expectedNextActionRequiresApproval: false,
    expectValidationPlan: true,
  },
  {
    id: 'infra-local-plan',
    label: 'Infra local',
    goal:
      'Hacer una base local con Docker, Redis, BullMQ, cron y Postgres para un sistema de reservas.',
    context: '',
    expectedDeliveryLevel: 'infra-local-plan',
    mustRequireApprovalLater: true,
    expectProjectBlueprint: true,
    expectedPhaseTokens: ['plan-infra-local', 'aprobacion-sensible'],
    expectImplementationRoadmap: true,
    expectedRoadmapPhaseTokens: ['plan-infra-local', 'approval-sensitive-runtime'],
    expectedNextActionType: 'request-approval',
    expectedNextActionStrategy: 'scalable-delivery-plan',
    expectedNextActionSafeToRunNow: false,
    expectedNextActionRequiresApproval: true,
    expectValidationPlan: true,
  },
]

const frontendProjectMaterializationCase = {
  id: 'frontend-project-materialization',
  label: 'Materializacion frontend project',
  goal:
    'Hacer una app React completa para reservas de canchas con componentes, rutas, mocks y estructura de proyecto.',
  context: '',
}

const fullstackLocalMaterializationCase = {
  id: 'fullstack-local-materialization',
  label: 'Materializacion fullstack local',
  goal:
    'Hacer un sistema fullstack local para turnos medicos con frontend, backend y base de datos local.',
  context: '',
}

const phaseExecutionValidationCases = {
  prepareFrontendMockFlow: {
    id: 'prepare-frontend-mock-flow',
    label: 'Preparar frontend mock flow',
    goal:
      'Continuar el proyecto fullstack local de turnos medicos y preparar la fase frontend-mock-flow.',
    context: '',
  },
  materializeFrontendMockFlow: {
    id: 'materialize-frontend-mock-flow',
    label: 'Materializar frontend mock flow',
    goal:
      'Materializar la fase frontend-mock-flow del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareBackendContracts: {
    id: 'prepare-backend-contracts',
    label: 'Preparar backend contracts',
    goal:
      'Preparar la fase backend-contracts del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeBackendContractsBlocked: {
    id: 'materialize-backend-contracts-blocked',
    label: 'Materializar backend contracts sin frontend previo',
    goal:
      'Materializar la fase backend-contracts del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeBackendContracts: {
    id: 'materialize-backend-contracts',
    label: 'Materializar backend contracts',
    goal:
      'Materializar la fase backend-contracts del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareDatabaseDesign: {
    id: 'prepare-database-design',
    label: 'Preparar database design',
    goal:
      'Preparar la fase database-design del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeDatabaseDesignBlocked: {
    id: 'materialize-database-design-blocked',
    label: 'Materializar database design sin backend previo',
    goal:
      'Materializar la fase database-design del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeDatabaseDesign: {
    id: 'materialize-database-design',
    label: 'Materializar database design',
    goal:
      'Materializar la fase database-design del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareLocalValidation: {
    id: 'prepare-local-validation',
    label: 'Preparar local validation',
    goal:
      'Preparar la fase local-validation del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeLocalValidationBlocked: {
    id: 'materialize-local-validation-blocked',
    label: 'Materializar local validation sin database previa',
    goal:
      'Materializar la fase local-validation del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeLocalValidation: {
    id: 'materialize-local-validation',
    label: 'Materializar local validation',
    goal:
      'Materializar la fase local-validation del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareReviewAndExpand: {
    id: 'prepare-review-and-expand',
    label: 'Preparar review and expand',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareModuleExpansion: {
    id: 'prepare-module-expansion',
    label: 'Preparar expansion de modulo',
    goal:
      'Preparar una expansion de modulo de notificaciones para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareUnsupportedModuleExpansion: {
    id: 'prepare-unsupported-module-expansion',
    label: 'Preparar expansion de modulo no soportado',
    goal:
      'Preparar una expansion de modulo de facturacion para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareReportsModuleExpansion: {
    id: 'prepare-reports-module-expansion',
    label: 'Preparar expansion reports',
    goal:
      'Preparar una expansion de modulo de reportes para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareInventoryModuleExpansion: {
    id: 'prepare-inventory-module-expansion',
    label: 'Preparar expansion inventory',
    goal:
      'Preparar una expansion de modulo de inventario para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareAuthModuleExpansion: {
    id: 'prepare-auth-module-expansion',
    label: 'Preparar expansion auth',
    goal:
      'Preparar una expansion de modulo de autenticacion para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeModuleExpansion: {
    id: 'materialize-module-expansion',
    label: 'Materializar expansion de modulo',
    goal:
      'Materializar la expansion de modulo de notificaciones para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeReportsModuleExpansion: {
    id: 'materialize-reports-module-expansion',
    label: 'Materializar expansion reports',
    goal:
      'Materializar la expansion de modulo de reportes para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeInventoryModuleExpansion: {
    id: 'materialize-inventory-module-expansion',
    label: 'Materializar expansion inventory',
    goal:
      'Materializar la expansion de modulo de inventario para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeUnsupportedModuleExpansion: {
    id: 'materialize-unsupported-module-expansion',
    label: 'Materializar expansion de modulo no soportado',
    goal:
      'Materializar la expansion de modulo de facturacion para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializePaymentsModuleExpansion: {
    id: 'materialize-payments-module-expansion',
    label: 'Materializar expansion payments',
    goal:
      'Materializar la expansion de modulo de pagos para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeAuthModuleExpansion: {
    id: 'materialize-auth-module-expansion',
    label: 'Materializar expansion auth',
    goal:
      'Materializar la expansion de modulo de autenticacion para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeDeployModuleExpansion: {
    id: 'materialize-deploy-module-expansion',
    label: 'Materializar expansion deploy',
    goal:
      'Materializar la expansion de modulo de deploy para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeIntegrationsModuleExpansion: {
    id: 'materialize-integrations-module-expansion',
    label: 'Materializar expansion integraciones',
    goal:
      'Materializar la expansion de modulo de integraciones externas para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeDockerModuleExpansion: {
    id: 'materialize-docker-module-expansion',
    label: 'Materializar expansion docker',
    goal:
      'Materializar la expansion de modulo de docker para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeUnknownModuleExpansion: {
    id: 'materialize-unknown-module-expansion',
    label: 'Materializar expansion desconocida',
    goal:
      'Materializar la expansion de modulo de analitica avanzada para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeDuplicateModuleExpansion: {
    id: 'materialize-duplicate-module-expansion',
    label: 'Materializar expansion duplicada',
    goal:
      'Materializar la expansion de modulo de notificaciones para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeDuplicateReportsModuleExpansion: {
    id: 'materialize-duplicate-reports-module-expansion',
    label: 'Materializar reports duplicado',
    goal:
      'Materializar la expansion de modulo de reportes para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  materializeDuplicateInventoryModuleExpansion: {
    id: 'materialize-duplicate-inventory-module-expansion',
    label: 'Materializar inventory duplicado',
    goal:
      'Materializar la expansion de modulo de inventario para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
}

const continuationValidationCases = {
  legacyManifestWithoutPhases: {
    id: 'continuation-legacy-without-phases',
    label: 'Manifest viejo sin phases',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestFrontendDone: {
    id: 'continuation-frontend-done',
    label: 'Manifest con frontend done',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestBackendDone: {
    id: 'continuation-backend-done',
    label: 'Manifest con frontend y backend done',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestDatabaseDone: {
    id: 'continuation-database-done',
    label: 'Manifest con database done',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestBaseComplete: {
    id: 'continuation-base-complete',
    label: 'Manifest con base completa',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestBaseCompleteWithoutModules: {
    id: 'continuation-base-complete-without-modules',
    label: 'Base completa sin modulos',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestNotificationsDone: {
    id: 'continuation-notifications-done',
    label: 'Notifications ya hecho',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestAllSafeModulesDone: {
    id: 'continuation-all-safe-modules-done',
    label: 'Todos los modulos seguros hechos',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestPartialModule: {
    id: 'continuation-partial-module',
    label: 'Modulo partial',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  manifestBlockedModule: {
    id: 'continuation-blocked-module',
    label: 'Modulo blocked',
    goal:
      'Preparar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareRuntimePlan: {
    id: 'continuation-runtime-plan',
    label: 'Plan de runtime local',
    goal:
      'Preparar un plan de runtime local para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareDependencyInstallPlan: {
    id: 'continuation-dependency-plan',
    label: 'Plan de dependencias',
    goal:
      'Preparar un plan de instalacion de dependencias para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareDbRealPlan: {
    id: 'continuation-db-real-plan',
    label: 'Plan de DB real',
    goal:
      'Preparar un plan de base real para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareAuthPlan: {
    id: 'continuation-auth-plan',
    label: 'Plan de auth real',
    goal:
      'Preparar un plan de auth real para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareDeployPlan: {
    id: 'continuation-deploy-plan',
    label: 'Plan de deploy',
    goal:
      'Preparar un plan de deploy futuro para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareExternalIntegrationPlan: {
    id: 'continuation-external-integration-plan',
    label: 'Plan de integracion externa',
    goal:
      'Preparar un plan de integracion externa para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
  prepareDockerPlan: {
    id: 'continuation-docker-plan',
    label: 'Plan de Docker',
    goal:
      'Preparar un plan de Docker e infraestructura para el proyecto fullstack local de turnos medicos.',
    context: '',
  },
}

const smokeExecutionWorkspaceRoot = path.join(
  process.env.TEMP || 'C:/tmp',
  'ai-planner-phase-smoke',
)
let cachedFullstackPhaseFixturePromise = null

function printUsage() {
  console.log('Uso: node scripts/ai-planner-smoke.mjs [--verbose] [--list] [--case=<id>]')
}

function parseArgs(argv) {
  let verbose = false
  let listOnly = false
  let caseId = ''

  for (const arg of argv) {
    if (arg === '--verbose') {
      verbose = true
      continue
    }

    if (arg === '--list') {
      listOnly = true
      continue
    }

    if (arg.startsWith('--case=')) {
      caseId = arg.slice('--case='.length).trim()
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
  }

  return {
    verbose,
    listOnly,
    caseId,
  }
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizePathForComparison(value) {
  return String(value || '').replace(/\\/g, '/')
}

function summarizeUniqueStrings(entries, limit = 12) {
  const values = []
  const seen = new Set()

  ;(Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (typeof entry !== 'string' || !entry.trim()) {
      return
    }

    const value = entry.trim()
    if (seen.has(value)) {
      return
    }

    seen.add(value)
    values.push(value)
  })

  return values.slice(0, limit)
}

function buildAllowedTargetPathsExpectation(folderName) {
  return [
    folderName,
    `${folderName}/index.html`,
    `${folderName}/styles.css`,
    `${folderName}/script.js`,
    `${folderName}/mock-data.json`,
  ]
}

function listHasToken(entries, token) {
  const normalizedToken = normalizeText(token)

  return entries.some((entry) => {
    const normalizedEntry = normalizeText(entry)
    return (
      normalizedEntry === normalizedToken ||
      normalizedEntry.includes(normalizedToken) ||
      new RegExp(`\\b${escapeRegExp(normalizedToken)}\\b`, 'u').test(normalizedEntry)
    )
  })
}

function formatList(entries) {
  return Array.isArray(entries) && entries.length > 0 ? entries.join(', ') : '(vacio)'
}

function extractSegment({ name, startMarker, endMarker }) {
  const start = mainSource.indexOf(startMarker)
  if (start === -1) {
    throw new Error(
      `[ai-planner-smoke] No se encontro el anchor inicial de ${name}: ${JSON.stringify(startMarker)}.`,
    )
  }

  const end = mainSource.indexOf(endMarker, start)
  if (end === -1) {
    throw new Error(
      `[ai-planner-smoke] No se encontro el anchor final de ${name}: ${JSON.stringify(endMarker)}.`,
    )
  }

  return mainSource.slice(start, end)
}

function loadPlannerTestingSurface() {
  const plannerSurface = extractSegment({
    name: 'superficie local de planner',
    startMarker: 'function normalizeExecutorAttemptScope(',
    endMarker: 'function buildOpenAIBrainInputPayload(input) {',
  })
  const harness = `
${plannerSurface}
module.exports = {
  buildDomainUnderstanding,
  buildProductArchitecturePlan,
  buildSafeFirstDeliveryPlan,
  buildMaterializeSafeFirstDeliveryPlan,
  buildLocalStrategicBrainDecision,
};
`

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    console,
    process,
    Buffer,
    fs,
    path,
    LOCAL_MATERIALIZATION_PLAN_VERSION,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
  }

  vm.createContext(sandbox)

  try {
    vm.runInContext(harness, sandbox, {
      filename: 'ai-planner-smoke-harness.cjs',
    })
  } catch (error) {
    throw new Error(
      `[ai-planner-smoke] No se pudo ejecutar el harness del planner extraido desde electron/main.cjs: ${error.message}`,
    )
  }

  const exported = sandbox.module.exports || {}
  const missing = requiredPlannerFunctions.filter((name) => typeof exported[name] !== 'function')

  if (missing.length > 0) {
    throw new Error(
      `[ai-planner-smoke] El harness se cargo pero faltan funciones requeridas: ${missing.join(', ')}.`,
    )
  }

  return exported
}

const plannerApi = loadPlannerTestingSurface()

function toStringArray(value, limit = 20) {
  return summarizeUniqueStrings(value, limit)
}

function buildCaseStructures(testCase) {
  const domainUnderstanding = plannerApi.buildDomainUnderstanding({
    goal: testCase.goal,
    context: testCase.context,
  })
  const productArchitecturePlan = plannerApi.buildProductArchitecturePlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
  })
  const safeFirstDeliveryPlan = plannerApi.buildSafeFirstDeliveryPlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
  })
  const materializePlan = plannerApi.buildMaterializeSafeFirstDeliveryPlan({
    goal: testCase.goal,
    context: testCase.context,
    domainUnderstanding,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
  })

  const domainModules = toStringArray(domainUnderstanding?.primaryModules)
  const architectureModules = toStringArray(productArchitecturePlan?.productArchitecture?.coreModules)
  const safeModules = toStringArray(safeFirstDeliveryPlan?.safeFirstDeliveryPlan?.modules)
  const materializeModules = toStringArray(materializePlan?.safeFirstDeliveryMaterialization?.modules)
  const materializeCollections = toStringArray(
    materializePlan?.safeFirstDeliveryMaterialization?.mockCollections,
  )
  const allowedTargetPaths = Array.isArray(materializePlan?.executionScope?.allowedTargetPaths)
    ? materializePlan.executionScope.allowedTargetPaths
    : []
  const folderName = allowedTargetPaths[0] || ''
  const aggregatedModules = [
    ...domainModules,
    ...architectureModules,
    ...safeModules,
    ...materializeModules,
  ]
  const aggregatedTexts = [
    ...toStringArray(productArchitecturePlan?.productArchitecture?.keyFlows, 24),
    ...toStringArray(safeFirstDeliveryPlan?.safeFirstDeliveryPlan?.screens, 24),
    ...toStringArray(safeFirstDeliveryPlan?.safeFirstDeliveryPlan?.localBehavior, 24),
    ...toStringArray(materializePlan?.safeFirstDeliveryMaterialization?.screens, 24),
    ...toStringArray(materializePlan?.safeFirstDeliveryMaterialization?.localActions, 24),
  ]

  return {
    domainUnderstanding,
    productArchitecturePlan,
    safeFirstDeliveryPlan,
    materializePlan,
    domainModules,
    architectureModules,
    safeModules,
    materializeModules,
    materializeCollections,
    allowedTargetPaths,
    folderName,
    aggregatedModules,
    aggregatedTexts,
  }
}

function summarizeDomainUnderstanding(domainUnderstanding) {
  return {
    domainLabel: domainUnderstanding?.domainLabel || '',
    intentLabel: domainUnderstanding?.intentLabel || '',
    productKind: domainUnderstanding?.productKind || '',
    primaryModules: toStringArray(domainUnderstanding?.primaryModules),
    primaryEntities: toStringArray(domainUnderstanding?.primaryEntities),
    secondaryEntities: toStringArray(domainUnderstanding?.secondaryEntities),
    roles: toStringArray(domainUnderstanding?.roles),
    coreFlows: toStringArray(domainUnderstanding?.coreFlows),
    stateModel: toStringArray(domainUnderstanding?.stateModel),
    localActions: toStringArray(domainUnderstanding?.localActions),
  }
}

function summarizeProductArchitecture(productArchitecturePlan) {
  const architecture = productArchitecturePlan?.productArchitecture || {}

  return {
    productType: architecture.productType || '',
    domain: architecture.domain || '',
    coreModules: toStringArray(architecture.coreModules),
    dataEntities: toStringArray(architecture.dataEntities),
    keyFlows: toStringArray(architecture.keyFlows),
    roles: toStringArray(architecture.roles),
    users: toStringArray(architecture.users),
  }
}

function summarizeSafeFirstDeliveryPlan(safeFirstDeliveryPlan) {
  const plan = safeFirstDeliveryPlan?.safeFirstDeliveryPlan || {}

  return {
    modules: toStringArray(plan.modules),
    screens: toStringArray(plan.screens),
    localBehavior: toStringArray(plan.localBehavior),
    mockData: toStringArray(plan.mockData),
    explicitExclusions: toStringArray(plan.explicitExclusions),
  }
}

function summarizeMaterialization(materializePlan) {
  const materialization = materializePlan?.safeFirstDeliveryMaterialization || {}

  return {
    modules: toStringArray(materialization.modules),
    entities: toStringArray(materialization.entities),
    mockCollections: toStringArray(materialization.mockCollections),
    screens: toStringArray(materialization.screens),
    localActions: toStringArray(materialization.localActions),
    stateHints: toStringArray(materialization.stateHints),
    approvalThemes: toStringArray(materialization.approvalThemes),
    explicitExclusions: toStringArray(materialization.explicitExclusions),
  }
}

function summarizeProjectBlueprint(projectBlueprint) {
  return {
    productType: projectBlueprint?.productType || '',
    domain: projectBlueprint?.domain || '',
    intent: projectBlueprint?.intent || '',
    deliveryLevel: projectBlueprint?.deliveryLevel || '',
    confidence: projectBlueprint?.confidence || '',
    roles: toStringArray(projectBlueprint?.roles, 24),
    modules: toStringArray(projectBlueprint?.modules, 24),
    entities: toStringArray(projectBlueprint?.entities, 24),
    coreFlows: toStringArray(projectBlueprint?.coreFlows, 24),
    assumptions: toStringArray(projectBlueprint?.assumptions, 24),
    delegatedDecisions: toStringArray(projectBlueprint?.delegatedDecisions, 24),
    approvalRequiredLater: toStringArray(projectBlueprint?.approvalRequiredLater, 24),
    successCriteria: toStringArray(projectBlueprint?.successCriteria, 24),
    phasePlan: Array.isArray(projectBlueprint?.phasePlan)
      ? projectBlueprint.phasePlan.map((entry) => ({
          phase: typeof entry?.phase === 'string' ? entry.phase : '',
          goal: typeof entry?.goal === 'string' ? entry.goal : '',
          deliveryLevel:
            typeof entry?.deliveryLevel === 'string' ? entry.deliveryLevel : '',
          executableNow: entry?.executableNow === true,
          approvalRequired: entry?.approvalRequired === true,
        }))
      : [],
    stackProfile:
      projectBlueprint?.stackProfile && typeof projectBlueprint.stackProfile === 'object'
        ? projectBlueprint.stackProfile
        : null,
  }
}

function summarizeQuestionPolicy(questionPolicy) {
  return {
    mode: questionPolicy?.mode || '',
    blockingQuestions: toStringArray(questionPolicy?.blockingQuestions, 12),
    optionalQuestions: toStringArray(questionPolicy?.optionalQuestions, 12),
    delegatedDecisions: toStringArray(questionPolicy?.delegatedDecisions, 24),
    shouldAskBeforePlanning: questionPolicy?.shouldAskBeforePlanning === true,
    shouldAskBeforeMaterialization:
      questionPolicy?.shouldAskBeforeMaterialization === true,
    reason: questionPolicy?.reason || '',
  }
}

function summarizeImplementationRoadmap(implementationRoadmap) {
  return {
    projectSlug: implementationRoadmap?.projectSlug || '',
    projectType: implementationRoadmap?.projectType || '',
    domain: implementationRoadmap?.domain || '',
    deliveryLevel: implementationRoadmap?.deliveryLevel || '',
    currentPhase: implementationRoadmap?.currentPhase || '',
    nextRecommendedPhase: implementationRoadmap?.nextRecommendedPhase || '',
    suggestedNextAction: implementationRoadmap?.suggestedNextAction || '',
    blockers: toStringArray(implementationRoadmap?.blockers, 24),
    explicitExclusions: toStringArray(implementationRoadmap?.explicitExclusions, 24),
    approvalRequiredLater: toStringArray(implementationRoadmap?.approvalRequiredLater, 24),
    successCriteria: toStringArray(implementationRoadmap?.successCriteria, 24),
    phases: Array.isArray(implementationRoadmap?.phases)
      ? implementationRoadmap.phases.map((entry) => ({
          id: typeof entry?.id === 'string' ? entry.id : '',
          title: typeof entry?.title === 'string' ? entry.title : '',
          goal: typeof entry?.goal === 'string' ? entry.goal : '',
          deliveryLevel:
            typeof entry?.deliveryLevel === 'string' ? entry.deliveryLevel : '',
          status: typeof entry?.status === 'string' ? entry.status : '',
          executableNow: entry?.executableNow === true,
          approvalRequired: entry?.approvalRequired === true,
          riskLevel: typeof entry?.riskLevel === 'string' ? entry.riskLevel : '',
          expectedOutputs: toStringArray(entry?.expectedOutputs, 16),
          allowedRootPaths: toStringArray(entry?.allowedRootPaths, 8),
          dependencies: toStringArray(entry?.dependencies, 8),
          validationStrategy: toStringArray(entry?.validationStrategy, 12),
        }))
      : [],
  }
}

function summarizeNextActionPlan(nextActionPlan) {
  return {
    currentState: nextActionPlan?.currentState || '',
    recommendedAction: nextActionPlan?.recommendedAction || '',
    actionType: nextActionPlan?.actionType || '',
    targetStrategy: nextActionPlan?.targetStrategy || '',
    targetDeliveryLevel: nextActionPlan?.targetDeliveryLevel || '',
    reason: nextActionPlan?.reason || '',
    safeToRunNow: nextActionPlan?.safeToRunNow === true,
    requiresApproval: nextActionPlan?.requiresApproval === true,
    userFacingLabel: nextActionPlan?.userFacingLabel || '',
    technicalLabel: nextActionPlan?.technicalLabel || '',
    expectedOutcome: nextActionPlan?.expectedOutcome || '',
  }
}

function summarizeValidationPlan(validationPlan) {
  return {
    scope: validationPlan?.scope || '',
    level: validationPlan?.level || '',
    commands: toStringArray(validationPlan?.commands, 24),
    fileChecks: Array.isArray(validationPlan?.fileChecks)
      ? validationPlan.fileChecks.map((entry) => ({
          path: typeof entry?.path === 'string' ? entry.path : '',
          expectation:
            typeof entry?.expectation === 'string' ? entry.expectation : '',
        }))
      : [],
    forbiddenPaths: toStringArray(validationPlan?.forbiddenPaths, 24),
    runtimeChecks: toStringArray(validationPlan?.runtimeChecks, 24),
    manualChecks: toStringArray(validationPlan?.manualChecks, 24),
    successCriteria: toStringArray(validationPlan?.successCriteria, 24),
  }
}

function summarizePhaseExpansionPlan(phaseExpansionPlan) {
  return {
    phaseId: phaseExpansionPlan?.phaseId || '',
    goal: phaseExpansionPlan?.goal || '',
    targetFiles: toStringArray(phaseExpansionPlan?.targetFiles, 16),
    changesExpected: toStringArray(phaseExpansionPlan?.changesExpected, 16),
    risks: toStringArray(phaseExpansionPlan?.risks, 16),
    executableNow: phaseExpansionPlan?.executableNow === true,
    approvalRequired: phaseExpansionPlan?.approvalRequired === true,
    nextExpectedAction: phaseExpansionPlan?.nextExpectedAction || '',
    validationPlan:
      phaseExpansionPlan?.validationPlan &&
      typeof phaseExpansionPlan.validationPlan === 'object'
        ? summarizeValidationPlan(phaseExpansionPlan.validationPlan)
        : null,
  }
}

function summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan) {
  return {
    phaseId: projectPhaseExecutionPlan?.phaseId || '',
    sourceStrategy: projectPhaseExecutionPlan?.sourceStrategy || '',
    targetStrategy: projectPhaseExecutionPlan?.targetStrategy || '',
    deliveryLevel: projectPhaseExecutionPlan?.deliveryLevel || '',
    projectRoot: projectPhaseExecutionPlan?.projectRoot || '',
    goal: projectPhaseExecutionPlan?.goal || '',
    reason: projectPhaseExecutionPlan?.reason || '',
    executableNow: projectPhaseExecutionPlan?.executableNow === true,
    approvalRequired: projectPhaseExecutionPlan?.approvalRequired === true,
    riskLevel: projectPhaseExecutionPlan?.riskLevel || '',
    prerequisitePhaseId: projectPhaseExecutionPlan?.prerequisitePhaseId || '',
    targetFiles: toStringArray(projectPhaseExecutionPlan?.targetFiles, 24),
    allowedTargetPaths: toStringArray(
      projectPhaseExecutionPlan?.allowedTargetPaths,
      24,
    ),
    operationsPreview: Array.isArray(projectPhaseExecutionPlan?.operationsPreview)
      ? projectPhaseExecutionPlan.operationsPreview.map((entry) => ({
          type: entry?.type || '',
          targetPath: entry?.targetPath || '',
          purpose: entry?.purpose || '',
        }))
      : [],
    validationPlan:
      projectPhaseExecutionPlan?.validationPlan &&
      typeof projectPhaseExecutionPlan.validationPlan === 'object'
        ? summarizeValidationPlan(projectPhaseExecutionPlan.validationPlan)
        : null,
    explicitExclusions: toStringArray(
      projectPhaseExecutionPlan?.explicitExclusions,
      24,
    ),
    blockers: toStringArray(projectPhaseExecutionPlan?.blockers, 24),
    successCriteria: toStringArray(projectPhaseExecutionPlan?.successCriteria, 24),
  }
}

function summarizeExpansionOptions(expansionOptions) {
  return {
    projectRoot: expansionOptions?.projectRoot || '',
    currentPhase: expansionOptions?.currentPhase || '',
    recommendedOptionId: expansionOptions?.recommendedOptionId || '',
    options: Array.isArray(expansionOptions?.options)
      ? expansionOptions.options.map((entry) => ({
          id: entry?.id || '',
          label: entry?.label || '',
          description: entry?.description || '',
          expansionType: entry?.expansionType || '',
          riskLevel: entry?.riskLevel || '',
          safeToPrepare: entry?.safeToPrepare === true,
          safeToMaterialize: entry?.safeToMaterialize === true,
          requiresApproval: entry?.requiresApproval === true,
          targetStrategy: entry?.targetStrategy || '',
          expectedFiles: toStringArray(entry?.expectedFiles, 20),
          reason: entry?.reason || '',
        }))
      : [],
  }
}

function summarizeModuleExpansionPlan(moduleExpansionPlan) {
  return {
    moduleId: moduleExpansionPlan?.moduleId || '',
    moduleName: moduleExpansionPlan?.moduleName || '',
    projectRoot: moduleExpansionPlan?.projectRoot || '',
    domain: moduleExpansionPlan?.domain || '',
    expansionType: moduleExpansionPlan?.expansionType || '',
    reason: moduleExpansionPlan?.reason || '',
    safeToPrepare: moduleExpansionPlan?.safeToPrepare !== false,
    safeToMaterialize: moduleExpansionPlan?.safeToMaterialize === true,
    approvalRequired: moduleExpansionPlan?.approvalRequired === true,
    riskLevel: moduleExpansionPlan?.riskLevel || '',
    affectedLayers: toStringArray(moduleExpansionPlan?.affectedLayers, 16),
    targetFiles: toStringArray(moduleExpansionPlan?.targetFiles, 24),
    allowedTargetPaths: toStringArray(moduleExpansionPlan?.allowedTargetPaths, 24),
    forbiddenPaths: toStringArray(moduleExpansionPlan?.forbiddenPaths, 24),
    blockers: toStringArray(moduleExpansionPlan?.blockers, 16),
    expectedChanges: Array.isArray(moduleExpansionPlan?.expectedChanges)
      ? moduleExpansionPlan.expectedChanges.map((entry) => ({
          layer: entry?.layer || '',
          targetPath: entry?.targetPath || '',
          purpose: entry?.purpose || '',
        }))
      : [],
    validationPlan:
      moduleExpansionPlan?.validationPlan &&
      typeof moduleExpansionPlan.validationPlan === 'object'
        ? summarizeValidationPlan(moduleExpansionPlan.validationPlan)
        : null,
    explicitExclusions: toStringArray(moduleExpansionPlan?.explicitExclusions, 24),
    successCriteria: toStringArray(moduleExpansionPlan?.successCriteria, 24),
  }
}

function summarizeContinuationAction(action) {
  return {
    id: action?.id || '',
    title: action?.title || '',
    description: action?.description || '',
    category: action?.category || '',
    targetStrategy: action?.targetStrategy || '',
    safeToPrepare: action?.safeToPrepare !== false,
    safeToMaterialize: action?.safeToMaterialize === true,
    requiresApproval: action?.requiresApproval === true,
    blocked: action?.blocked === true,
    blocker: action?.blocker || '',
    approvalType: action?.approvalType || '',
    expectedOutcome: action?.expectedOutcome || '',
    recommended: action?.recommended === true,
    priority: Number.isFinite(action?.priority) ? action.priority : 0,
    phaseId: action?.phaseId || '',
    moduleId: action?.moduleId || '',
    riskLevel: action?.riskLevel || '',
    projectRoot: action?.projectRoot || '',
    reason: action?.reason || '',
    targetFiles: toStringArray(action?.targetFiles, 24),
    allowedTargetPaths: toStringArray(action?.allowedTargetPaths, 24),
    explicitExclusions: toStringArray(action?.explicitExclusions, 24),
    successCriteria: toStringArray(action?.successCriteria, 24),
    risks: toStringArray(action?.risks, 24),
    validationPlan:
      action?.validationPlan && typeof action.validationPlan === 'object'
        ? summarizeValidationPlan(action.validationPlan)
        : null,
  }
}

function summarizeProjectContinuationState(projectContinuationState) {
  return {
    projectStatus: projectContinuationState?.projectStatus || '',
    completedPhases: toStringArray(projectContinuationState?.completedPhases, 24),
    pendingPhases: toStringArray(projectContinuationState?.pendingPhases, 24),
    availableSafeActions: Array.isArray(projectContinuationState?.availableSafeActions)
      ? projectContinuationState.availableSafeActions.map(summarizeContinuationAction)
      : [],
    availablePlanningActions: Array.isArray(
      projectContinuationState?.availablePlanningActions,
    )
      ? projectContinuationState.availablePlanningActions.map(summarizeContinuationAction)
      : [],
    approvalRequiredActions: Array.isArray(
      projectContinuationState?.approvalRequiredActions,
    )
      ? projectContinuationState.approvalRequiredActions.map(
          summarizeContinuationAction,
        )
      : [],
    blockedActions: Array.isArray(projectContinuationState?.blockedActions)
      ? projectContinuationState.blockedActions.map(summarizeContinuationAction)
      : [],
    modulesDone: toStringArray(projectContinuationState?.modulesDone, 24),
    modulesAvailable: toStringArray(projectContinuationState?.modulesAvailable, 24),
    modulesBlocked: toStringArray(projectContinuationState?.modulesBlocked, 24),
    nextRecommendedAction:
      projectContinuationState?.nextRecommendedAction &&
      typeof projectContinuationState.nextRecommendedAction === 'object'
        ? summarizeContinuationAction(projectContinuationState.nextRecommendedAction)
        : null,
    nextRecommendedPhase: projectContinuationState?.nextRecommendedPhase || '',
    nextRecommendedModule: projectContinuationState?.nextRecommendedModule || '',
    risks: toStringArray(projectContinuationState?.risks, 24),
    blockers: toStringArray(projectContinuationState?.blockers, 24),
    summary: projectContinuationState?.summary || '',
    operatorMessage: projectContinuationState?.operatorMessage || '',
  }
}

function summarizeLocalProjectManifest(localProjectManifest) {
  return {
    version: Number.isFinite(localProjectManifest?.version)
      ? localProjectManifest.version
      : 0,
    projectType: localProjectManifest?.projectType || '',
    domain: localProjectManifest?.domain || '',
    deliveryLevel: localProjectManifest?.deliveryLevel || '',
    createdBy: localProjectManifest?.createdBy || '',
    materializationLayer: localProjectManifest?.materializationLayer || '',
    forbiddenPaths: toStringArray(localProjectManifest?.forbiddenPaths, 24),
    nextRecommendedPhase: localProjectManifest?.nextRecommendedPhase || '',
    nextRecommendedAction: localProjectManifest?.nextRecommendedAction || '',
    lastCompletedPhase: localProjectManifest?.lastCompletedPhase || '',
    availableActions: toStringArray(localProjectManifest?.availableActions, 24),
    blockedActions: toStringArray(localProjectManifest?.blockedActions, 24),
    approvalRequiredActions: toStringArray(
      localProjectManifest?.approvalRequiredActions,
      24,
    ),
    risks: toStringArray(localProjectManifest?.risks, 24),
    updatedAt: localProjectManifest?.updatedAt || '',
    history: Array.isArray(localProjectManifest?.history)
      ? localProjectManifest.history.map((entry) => ({
          kind: entry?.kind || '',
          id: entry?.id || '',
          status: entry?.status || '',
          at: entry?.at || '',
          note: entry?.note || '',
        }))
      : [],
    phases: Array.isArray(localProjectManifest?.phases)
      ? localProjectManifest.phases.map((entry) => ({
          id: entry?.id || '',
          status: entry?.status || '',
          createdAt: entry?.createdAt || '',
          files: toStringArray(entry?.files, 24),
        }))
      : [],
    modules: Array.isArray(localProjectManifest?.modules)
      ? localProjectManifest.modules.map((entry) => ({
          id: entry?.id || '',
          name: entry?.name || '',
          status: entry?.status || '',
          addedAt: entry?.addedAt || '',
          layers: toStringArray(entry?.layers, 16),
          files: toStringArray(entry?.files, 24),
        }))
      : [],
  }
}

function runCase(testCase) {
  const structures = buildCaseStructures(testCase)
  const failures = []
  const missingExpectedModules = []
  const forbiddenModulesFound = []
  const missingMentions = []
  const expectedAllowedTargetPaths = buildAllowedTargetPathsExpectation(structures.folderName)
  const normalizedAllowed = structures.allowedTargetPaths.map(normalizePathForComparison)
  const normalizedExpectedAllowed = expectedAllowedTargetPaths.map(normalizePathForComparison)

  if (!structures.domainUnderstanding || typeof structures.domainUnderstanding !== 'object') {
    failures.push('domainUnderstanding ausente.')
  } else {
    if (!String(structures.domainUnderstanding.domainLabel || '').trim()) {
      failures.push('domainUnderstanding pobre: falta domainLabel.')
    }

    if (structures.domainModules.length === 0) {
      failures.push('domainUnderstanding pobre: primaryModules vacio.')
    }
  }

  if (structures.architectureModules.length === 0) {
    failures.push('productArchitecture incoherente: coreModules vacio.')
  }

  if (structures.safeModules.length === 0) {
    failures.push('safeFirstDeliveryPlan incoherente: modules vacio.')
  }

  if (structures.materializeModules.length === 0) {
    failures.push('safeFirstDeliveryMaterialization incoherente: modules vacio.')
  }

  for (const expected of testCase.mustInclude || []) {
    if (!listHasToken(structures.aggregatedModules, expected)) {
      missingExpectedModules.push(expected)
    }
  }

  for (const forbidden of testCase.mustExclude || []) {
    if (listHasToken(structures.aggregatedModules, forbidden)) {
      forbiddenModulesFound.push(forbidden)
    }
  }

  for (const expectedText of testCase.mustMention || []) {
    if (!listHasToken(structures.aggregatedTexts, expectedText)) {
      missingMentions.push(expectedText)
    }
  }

  if (
    !testCase.folderAnyOf.some(
      (entry) => normalizePathForComparison(entry) === normalizePathForComparison(structures.folderName),
    )
  ) {
    failures.push(
      `Folder incorrecto. Esperado: ${testCase.folderAnyOf.join(', ')}. Recibido: ${
        structures.folderName || '(vacio)'
      }.`,
    )
  }

  if (
    normalizedAllowed.length !== normalizedExpectedAllowed.length ||
    normalizedAllowed.some((entry, index) => entry !== normalizedExpectedAllowed[index])
  ) {
    failures.push(
      `allowedTargetPaths incorrectos. Esperado: ${normalizedExpectedAllowed.join(' | ')}. Recibido: ${
        normalizedAllowed.join(' | ') || '(vacio)'
      }.`,
    )
  }

  if (missingExpectedModules.length > 0) {
    failures.push(`Modulos esperados faltantes: ${missingExpectedModules.join(', ')}.`)
  }

  if (forbiddenModulesFound.length > 0) {
    failures.push(`Modulos prohibidos encontrados: ${forbiddenModulesFound.join(', ')}.`)
  }

  if (missingMentions.length > 0) {
    failures.push(`Senales textuales faltantes: ${missingMentions.join(', ')}.`)
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    missingExpectedModules,
    forbiddenModulesFound,
    missingMentions,
    summaries: {
      domainUnderstanding: summarizeDomainUnderstanding(structures.domainUnderstanding),
      productArchitecture: summarizeProductArchitecture(structures.productArchitecturePlan),
      safeFirstDeliveryPlan: summarizeSafeFirstDeliveryPlan(structures.safeFirstDeliveryPlan),
      safeFirstDeliveryMaterialization: summarizeMaterialization(structures.materializePlan),
    },
    folderName: structures.folderName,
    allowedTargetPaths: structures.allowedTargetPaths,
    materializeCollections: structures.materializeCollections,
  }
}

function printList() {
  console.log('AI Planner Smoke - Casos activos')
  activeCases.forEach((testCase) => {
    console.log(`- ${testCase.id}`)
  })

  if (candidateCases.length > 0) {
    console.log('')
    console.log('AI Planner Smoke - Casos evaluados pero no incorporados')
    candidateCases.forEach((testCase) => {
      console.log(`- ${testCase.id}: ${testCase.reason}`)
    })
  }
}

function printCompactResult(result) {
  const {
    testCase,
    ok,
    summaries,
    folderName,
    materializeCollections,
    failures,
  } = result

  console.log(`${ok ? 'PASS' : 'FAIL'} ${testCase.id} | ${testCase.label}`)
  console.log(`- objetivo: ${testCase.goal}`)
  console.log(`- dominio detectado: ${summaries.domainUnderstanding.domainLabel || '(sin domainLabel)'}`)
  console.log(`- folder esperado: ${testCase.folderAnyOf.join(' | ')}`)
  console.log(`- folder recibido: ${folderName || '(vacio)'}`)
  console.log(`- modulos principales: ${formatList(summaries.safeFirstDeliveryPlan.modules)}`)
  console.log(`- colecciones materializadas: ${formatList(materializeCollections)}`)
  console.log(`- resultado: ${ok ? 'OK' : 'FALLO'}`)

  if (!ok) {
    failures.forEach((failure) => console.log(`  - ${failure}`))
  }
}

function printVerboseResult(result) {
  printCompactResult(result)
  console.log('  domainUnderstanding:')
  console.log(`    ${JSON.stringify(result.summaries.domainUnderstanding)}`)
  console.log('  productArchitecture:')
  console.log(`    ${JSON.stringify(result.summaries.productArchitecture)}`)
  console.log('  safeFirstDeliveryPlan:')
  console.log(`    ${JSON.stringify(result.summaries.safeFirstDeliveryPlan)}`)
  console.log('  safeFirstDeliveryMaterialization:')
  console.log(`    ${JSON.stringify(result.summaries.safeFirstDeliveryMaterialization)}`)
  console.log(`  allowedTargetPaths: ${result.allowedTargetPaths.join(' | ') || '(vacio)'}`)
}

function resolveCases(caseId) {
  if (!caseId) {
    return activeCases
  }

  const selected = activeCases.find((testCase) => testCase.id === caseId)
  if (selected) {
    return [selected]
  }

  const pending = candidateCases.find((testCase) => testCase.id === caseId)
  if (pending) {
    console.error(
      `[ai-planner-smoke] El caso "${caseId}" fue evaluado, pero todavia no esta incorporado al smoke activo: ${pending.reason}`,
    )
    process.exit(1)
  }

  console.error(`[ai-planner-smoke] No existe un caso con id "${caseId}". Usa --list para ver los disponibles.`)
  process.exit(1)
}

async function runScalableValidationCase(testCase) {
  const reusablePlanningContext = {
    reusableArtifactLookup: {
      executed: false,
      foundCount: 0,
      matches: [],
    },
    reusableArtifactsFound: 0,
    reuseDecision: false,
    reuseReason: '',
    reusedArtifactIds: [],
    reuseMode: 'none',
    creativeDirection: null,
  }
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const scalablePlan =
    decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
      ? decision.scalableDeliveryPlan
      : null
  const projectBlueprint =
    decision?.projectBlueprint && typeof decision.projectBlueprint === 'object'
      ? decision.projectBlueprint
      : null
  const questionPolicy =
    decision?.questionPolicy && typeof decision.questionPolicy === 'object'
      ? decision.questionPolicy
      : null
  const implementationRoadmap =
    decision?.implementationRoadmap && typeof decision.implementationRoadmap === 'object'
      ? decision.implementationRoadmap
      : null
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null
  const validationPlan =
    decision?.validationPlan && typeof decision.validationPlan === 'object'
      ? decision.validationPlan
      : null
  const phaseExpansionPlan =
    decision?.phaseExpansionPlan && typeof decision.phaseExpansionPlan === 'object'
      ? decision.phaseExpansionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null

  if (Array.isArray(testCase.acceptedStrategies) && !testCase.acceptedStrategies.includes(strategy)) {
    failures.push(
      `Estrategia inesperada. Esperado: ${testCase.acceptedStrategies.join(' | ')}. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (Array.isArray(testCase.rejectedStrategies) && testCase.rejectedStrategies.includes(strategy)) {
    failures.push(`La estrategia no debía escalar. Recibido: ${strategy}.`)
  }

  if (testCase.expectedDeliveryLevel) {
    if (strategy !== 'scalable-delivery-plan') {
      failures.push(`Estrategia incorrecta. Esperado: scalable-delivery-plan. Recibido: ${strategy || '(vacia)'}.`)
    }

    if (executionMode !== 'planner-only') {
      failures.push(`executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`)
    }

    if (nextExpectedAction !== 'review-scalable-delivery') {
      failures.push(
        `nextExpectedAction incorrecto. Esperado: review-scalable-delivery. Recibido: ${nextExpectedAction || '(vacio)'}.`,
      )
    }

    if (materializationPlan) {
      failures.push('No deberia haber materializationPlan ejecutable en scalable-delivery-plan.')
    }

    if (!scalablePlan) {
      failures.push('scalableDeliveryPlan ausente.')
    } else {
      if (String(scalablePlan.deliveryLevel || '').trim() !== testCase.expectedDeliveryLevel) {
        failures.push(
          `deliveryLevel incorrecto. Esperado: ${testCase.expectedDeliveryLevel}. Recibido: ${
            scalablePlan.deliveryLevel || '(vacio)'
          }.`,
        )
      }

      if (!Array.isArray(scalablePlan.allowedRootPaths) || scalablePlan.allowedRootPaths.length === 0) {
        failures.push('allowedRootPaths vacío.')
      }

      if (!Array.isArray(scalablePlan.filesToCreate) || scalablePlan.filesToCreate.length === 0) {
        failures.push('filesToCreate vacío.')
      }

      if (
        Array.isArray(testCase.expectedTargetStructureTokens) &&
        testCase.expectedTargetStructureTokens.length > 0
      ) {
        const targetStructure = summarizeUniqueStrings(scalablePlan.targetStructure, 24)
        testCase.expectedTargetStructureTokens.forEach((token) => {
          const normalizedToken = normalizePathForComparison(token)
          if (!targetStructure.some((entry) => normalizePathForComparison(entry).includes(normalizedToken))) {
            failures.push(`targetStructure no incluye ${token}.`)
          }
        })
      }

      if (
        Array.isArray(testCase.expectedDirectoryTokens) &&
        testCase.expectedDirectoryTokens.length > 0
      ) {
        const directories = summarizeUniqueStrings(scalablePlan.directories, 32)
        testCase.expectedDirectoryTokens.forEach((token) => {
          const normalizedToken = normalizePathForComparison(token)
          if (!directories.some((entry) => normalizePathForComparison(entry).includes(normalizedToken))) {
            failures.push(`directories no incluye ${token}.`)
          }
        })
      }

      if (Array.isArray(testCase.expectedFileTokens) && testCase.expectedFileTokens.length > 0) {
        const filePaths = Array.isArray(scalablePlan.filesToCreate)
          ? scalablePlan.filesToCreate
              .map((entry) =>
                entry && typeof entry === 'object' ? String(entry.path || '').trim() : '',
              )
              .filter(Boolean)
          : []
        testCase.expectedFileTokens.forEach((token) => {
          const normalizedToken = normalizePathForComparison(token)
          if (!filePaths.some((entry) => normalizePathForComparison(entry).includes(normalizedToken))) {
            failures.push(`filesToCreate no incluye ${token}.`)
          }
        })
      }

      if (
        !Array.isArray(scalablePlan.localOnlyConstraints) ||
        scalablePlan.localOnlyConstraints.length === 0
      ) {
        failures.push('localOnlyConstraints vacío.')
      }

      if (
        Array.isArray(testCase.expectedLocalConstraintTokens) &&
        testCase.expectedLocalConstraintTokens.length > 0
      ) {
        const localOnlyConstraints = summarizeUniqueStrings(
          scalablePlan.localOnlyConstraints,
          24,
        )
        testCase.expectedLocalConstraintTokens.forEach((token) => {
          if (!localOnlyConstraints.some((entry) => entry.includes(token))) {
            failures.push(`localOnlyConstraints no incluye "${token}".`)
          }
        })
      }

      if (
        !Array.isArray(scalablePlan.successCriteria) ||
        scalablePlan.successCriteria.length === 0
      ) {
        failures.push('successCriteria vacío.')
      }

      if (testCase.mustRequireApprovalLater) {
        if (
          !Array.isArray(scalablePlan.approvalRequiredLater) ||
          scalablePlan.approvalRequiredLater.length === 0
        ) {
          failures.push('approvalRequiredLater debería tener entradas para este caso.')
        }
      }

      if (Array.isArray(testCase.expectedApprovalTokens) && testCase.expectedApprovalTokens.length > 0) {
        const approvalRequiredLater = summarizeUniqueStrings(
          scalablePlan.approvalRequiredLater,
          24,
        )
        testCase.expectedApprovalTokens.forEach((token) => {
          if (!approvalRequiredLater.some((entry) => entry.includes(token))) {
            failures.push(`approvalRequiredLater no incluye "${token}".`)
          }
        })
      }
    }

    if (testCase.expectProjectBlueprint) {
      if (!projectBlueprint) {
        failures.push('projectBlueprint ausente.')
      } else {
        if (String(projectBlueprint.deliveryLevel || '').trim() !== testCase.expectedDeliveryLevel) {
          failures.push(
            `projectBlueprint.deliveryLevel incorrecto. Esperado: ${testCase.expectedDeliveryLevel}. Recibido: ${
              projectBlueprint.deliveryLevel || '(vacio)'
            }.`,
          )
        }

        const blueprintSummary = summarizeProjectBlueprint(projectBlueprint)

        if (!blueprintSummary.stackProfile || typeof blueprintSummary.stackProfile !== 'object') {
          failures.push('projectBlueprint.stackProfile ausente.')
        }

        if (blueprintSummary.roles.length === 0) {
          failures.push('projectBlueprint.roles vacio.')
        }

        if (blueprintSummary.modules.length === 0) {
          failures.push('projectBlueprint.modules vacio.')
        }

        if (blueprintSummary.phasePlan.length === 0) {
          failures.push('projectBlueprint.phasePlan vacio.')
        }

        ;(testCase.expectedBlueprintRoles || []).forEach((token) => {
          if (!listHasToken(blueprintSummary.roles, token)) {
            failures.push(`projectBlueprint.roles no incluye ${token}.`)
          }
        })

        ;(testCase.expectedBlueprintModules || []).forEach((token) => {
          if (!listHasToken(blueprintSummary.modules, token)) {
            failures.push(`projectBlueprint.modules no incluye ${token}.`)
          }
        })

        ;(testCase.expectedBlueprintEntities || []).forEach((token) => {
          if (!listHasToken(blueprintSummary.entities, token)) {
            failures.push(`projectBlueprint.entities no incluye ${token}.`)
          }
        })

        ;(testCase.expectedPhaseTokens || []).forEach((token) => {
          if (
            !blueprintSummary.phasePlan.some((entry) =>
              normalizeText(entry.phase).includes(normalizeText(token)),
            )
          ) {
            failures.push(`projectBlueprint.phasePlan no incluye ${token}.`)
          }
        })

        if (testCase.expectedStackProfile && blueprintSummary.stackProfile) {
          Object.entries(testCase.expectedStackProfile).forEach(([key, expectedValue]) => {
            if (String(blueprintSummary.stackProfile[key] || '').trim() !== expectedValue) {
              failures.push(
                `projectBlueprint.stackProfile.${key} incorrecto. Esperado: ${expectedValue}. Recibido: ${
                  blueprintSummary.stackProfile[key] || '(vacio)'
                }.`,
              )
            }
          })
        }
      }
    }

    if (!questionPolicy) {
      failures.push('questionPolicy ausente.')
    } else {
      const questionPolicySummary = summarizeQuestionPolicy(questionPolicy)
      if (!String(questionPolicySummary.mode || '').trim()) {
        failures.push('questionPolicy.mode vacio.')
      }
      if (!String(questionPolicySummary.reason || '').trim()) {
        failures.push('questionPolicy.reason vacio.')
      }
    }

    if (testCase.expectImplementationRoadmap) {
      if (!implementationRoadmap) {
        failures.push('implementationRoadmap ausente.')
      } else {
        const roadmapSummary = summarizeImplementationRoadmap(implementationRoadmap)
        if (String(roadmapSummary.deliveryLevel || '').trim() !== testCase.expectedDeliveryLevel) {
          failures.push(
            `implementationRoadmap.deliveryLevel incorrecto. Esperado: ${testCase.expectedDeliveryLevel}. Recibido: ${
              roadmapSummary.deliveryLevel || '(vacio)'
            }.`,
          )
        }
        if (roadmapSummary.phases.length === 0) {
          failures.push('implementationRoadmap.phases vacio.')
        }
        if (!String(roadmapSummary.nextRecommendedPhase || '').trim()) {
          failures.push('implementationRoadmap.nextRecommendedPhase vacio.')
        }
        ;(testCase.expectedRoadmapPhaseTokens || []).forEach((token) => {
          if (
            !roadmapSummary.phases.some((entry) =>
              [entry.id, entry.title]
                .filter(Boolean)
                .some((value) => normalizeText(value).includes(normalizeText(token))),
            )
          ) {
            failures.push(`implementationRoadmap.phases no incluye ${token}.`)
          }
        })
      }
    }

    if (!nextActionPlan) {
      failures.push('nextActionPlan ausente.')
    } else {
      const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
      if (!String(nextActionSummary.actionType || '').trim()) {
        failures.push('nextActionPlan.actionType vacio.')
      }
      if (
        testCase.expectedNextActionType &&
        String(nextActionSummary.actionType || '').trim() !== testCase.expectedNextActionType
      ) {
        failures.push(
          `nextActionPlan.actionType incorrecto. Esperado: ${testCase.expectedNextActionType}. Recibido: ${
            nextActionSummary.actionType || '(vacio)'
          }.`,
        )
      }
      if (
        testCase.expectedNextActionStrategy &&
        String(nextActionSummary.targetStrategy || '').trim() !==
          testCase.expectedNextActionStrategy
      ) {
        failures.push(
          `nextActionPlan.targetStrategy incorrecto. Esperado: ${testCase.expectedNextActionStrategy}. Recibido: ${
            nextActionSummary.targetStrategy || '(vacio)'
          }.`,
        )
      }
      if (
        typeof testCase.expectedNextActionSafeToRunNow === 'boolean' &&
        nextActionSummary.safeToRunNow !== testCase.expectedNextActionSafeToRunNow
      ) {
        failures.push(
          `nextActionPlan.safeToRunNow incorrecto. Esperado: ${testCase.expectedNextActionSafeToRunNow}. Recibido: ${nextActionSummary.safeToRunNow}.`,
        )
      }
      if (
        typeof testCase.expectedNextActionRequiresApproval === 'boolean' &&
        nextActionSummary.requiresApproval !==
          testCase.expectedNextActionRequiresApproval
      ) {
        failures.push(
          `nextActionPlan.requiresApproval incorrecto. Esperado: ${testCase.expectedNextActionRequiresApproval}. Recibido: ${nextActionSummary.requiresApproval}.`,
        )
      }
    }

    if (testCase.expectValidationPlan) {
      if (!validationPlan) {
        failures.push('validationPlan ausente.')
      } else {
        const validationSummary = summarizeValidationPlan(validationPlan)
        if (!String(validationSummary.scope || '').trim()) {
          failures.push('validationPlan.scope vacio.')
        }
        if (!String(validationSummary.level || '').trim()) {
          failures.push('validationPlan.level vacio.')
        }
        if (
          testCase.expectedDeliveryLevel === 'monorepo-local' &&
          String(nextActionPlan?.targetStrategy || '').trim() ===
            'materialize-fullstack-local-plan'
        ) {
          failures.push(
            'monorepo-local no deberia recomendar materialize-fullstack-local-plan.',
          )
        }
      }
    }

    if (phaseExpansionPlan && testCase.expectedDeliveryLevel === 'monorepo-local') {
      failures.push('monorepo-local no deberia devolver phaseExpansionPlan en esta fase.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
    scalablePlan,
    projectBlueprint,
    questionPolicy,
    implementationRoadmap,
    nextActionPlan,
    validationPlan,
    phaseExpansionPlan,
  }
}

function printScalableValidationResult(result) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.testCase.id} | ${result.testCase.label}`)
  console.log(`- objetivo: ${result.testCase.goal}`)
  console.log(`- estrategia: ${result.strategy || '(vacia)'}`)
  console.log(`- executionMode: ${result.executionMode || '(vacio)'}`)
  console.log(
    `- deliveryLevel: ${result.scalablePlan?.deliveryLevel || '(no aplica)'}`,
  )

  if (!result.ok) {
    result.failures.forEach((failure) => console.log(`  - ${failure}`))
  }
}

async function runQuestionPolicyLowRiskValidation() {
  const reusablePlanningContext = {
    reusableArtifactLookup: {
      executed: false,
      foundCount: 0,
      matches: [],
    },
    reusableArtifactsFound: 0,
    reuseDecision: false,
    reuseReason: '',
    reusedArtifactIds: [],
    reuseMode: 'none',
    creativeDirection: null,
  }
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: 'Hacer un sistema de turnos medicos con frontend, backend y agenda local revisable.',
    context:
      'Quiero una base local de demo. Si faltan detalles menores, el cerebro debe decidirlos sin preguntar salvo bloqueos reales.',
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const questionPolicy =
    decision?.questionPolicy && typeof decision.questionPolicy === 'object'
      ? decision.questionPolicy
      : null
  const projectBlueprint =
    decision?.projectBlueprint && typeof decision.projectBlueprint === 'object'
      ? decision.projectBlueprint
      : null
  const summary = summarizeQuestionPolicy(questionPolicy)

  if (!questionPolicy) {
    failures.push('questionPolicy ausente.')
  } else {
    if (summary.mode !== 'brain-decides-missing') {
      failures.push(
        `questionPolicy.mode incorrecto. Esperado: brain-decides-missing. Recibido: ${summary.mode || '(vacio)'}.`,
      )
    }
    if (summary.blockingQuestions.length > 0) {
      failures.push(
        'questionPolicy no deberia abrir blockingQuestions para faltantes menores delegados.',
      )
    }
    if (summary.optionalQuestions.length > 0) {
      failures.push(
        'questionPolicy no deberia abrir optionalQuestions cuando el cerebro decide faltantes menores.',
      )
    }
    if (summary.delegatedDecisions.length === 0) {
      failures.push('questionPolicy.delegatedDecisions deberia registrar decisiones delegadas.')
    }
    if (summary.shouldAskBeforePlanning) {
      failures.push('questionPolicy.shouldAskBeforePlanning deberia ser false.')
    }
    if (summary.shouldAskBeforeMaterialization) {
      failures.push('questionPolicy.shouldAskBeforeMaterialization deberia ser false.')
    }
  }

  if (!projectBlueprint) {
    failures.push('projectBlueprint ausente en el caso brain-decides-missing.')
  } else if (toStringArray(projectBlueprint.delegatedDecisions, 24).length === 0) {
    failures.push(
      'projectBlueprint.delegatedDecisions deberia reflejar la delegacion del usuario.',
    )
  }

  return {
    testCase: {
      id: 'question-policy-brain-decides-low-risk',
      label: 'Question policy brain-decides-missing low risk',
      goal: 'Hacer un sistema de turnos medicos con base local revisable.',
    },
    ok: failures.length === 0,
    failures,
    strategy: String(decision?.strategy || '').trim(),
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
    scalablePlan:
      decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
        ? decision.scalableDeliveryPlan
        : null,
    projectBlueprint,
    questionPolicy,
  }
}

async function runQuestionPolicySensitiveRiskValidation() {
  const reusablePlanningContext = {
    reusableArtifactLookup: {
      executed: false,
      foundCount: 0,
      matches: [],
    },
    reusableArtifactsFound: 0,
    reuseDecision: false,
    reuseReason: '',
    reusedArtifactIds: [],
    reuseMode: 'none',
    creativeDirection: null,
  }
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal:
      'Hacer un sistema de turnos medicos con pagos reales, auth real, datos sensibles y deploy productivo.',
    context:
      'Quiero que JEFE decida faltantes menores sin preguntar, pero si aparece un riesgo sensible real tiene que conservar el bloqueo antes de materializar.',
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const questionPolicy =
    decision?.questionPolicy && typeof decision.questionPolicy === 'object'
      ? decision.questionPolicy
      : null
  const projectBlueprint =
    decision?.projectBlueprint && typeof decision.projectBlueprint === 'object'
      ? decision.projectBlueprint
      : null
  const summary = summarizeQuestionPolicy(questionPolicy)

  if (!questionPolicy) {
    failures.push('questionPolicy ausente.')
  } else {
    if (summary.mode !== 'brain-decides-missing') {
      failures.push(
        `questionPolicy.mode incorrecto. Esperado: brain-decides-missing. Recibido: ${summary.mode || '(vacio)'}.`,
      )
    }
    if (summary.blockingQuestions.length === 0) {
      failures.push(
        'questionPolicy deberia conservar blockingQuestions cuando hay riesgos sensibles reales.',
      )
    }
    if (summary.delegatedDecisions.length === 0) {
      failures.push('questionPolicy.delegatedDecisions deberia registrar decisiones delegadas.')
    }
    if (summary.shouldAskBeforePlanning) {
      failures.push('questionPolicy.shouldAskBeforePlanning deberia seguir false.')
    }
    if (!summary.shouldAskBeforeMaterialization) {
      failures.push(
        'questionPolicy.shouldAskBeforeMaterialization deberia ser true con riesgos sensibles reales.',
      )
    }
    if (!String(summary.reason || '').trim()) {
      failures.push('questionPolicy.reason vacio.')
    } else {
      const normalizedReason = normalizeText(summary.reason)
      if (
        !normalizedReason.includes(normalizeText('faltantes menores')) ||
        !(
          normalizedReason.includes(normalizeText('riesgos sensibles')) ||
          normalizedReason.includes(normalizeText('aprobaciones')) ||
          normalizedReason.includes(normalizeText('materializar'))
        )
      ) {
        failures.push(
          'questionPolicy.reason deberia explicar delegacion de faltantes menores y bloqueo ante riesgos sensibles.',
        )
      }
    }
  }

  if (!projectBlueprint) {
    failures.push('projectBlueprint ausente en el caso sensible brain-decides-missing.')
  } else {
    if (String(projectBlueprint.riskLevel || '').trim() !== 'high') {
      failures.push(
        `projectBlueprint.riskLevel incorrecto. Esperado: high. Recibido: ${
          projectBlueprint.riskLevel || '(vacio)'
        }.`,
      )
    }
    if (toStringArray(projectBlueprint.approvalRequiredLater, 24).length === 0) {
      failures.push(
        'projectBlueprint.approvalRequiredLater deberia reflejar aprobaciones futuras para el caso sensible.',
      )
    }
    if (toStringArray(projectBlueprint.blockingQuestions, 24).length === 0) {
      failures.push(
        'projectBlueprint.blockingQuestions deberia reflejar los bloqueos sensibles del questionPolicy.',
      )
    }
  }

  return {
    testCase: {
      id: 'question-policy-brain-decides-sensitive',
      label: 'Question policy brain-decides-missing sensitive risk',
      goal:
        'Hacer un sistema de turnos medicos con pagos reales, auth real, datos sensibles y deploy productivo.',
    },
    ok: failures.length === 0,
    failures,
    strategy: String(decision?.strategy || '').trim(),
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
    scalablePlan:
      decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
        ? decision.scalableDeliveryPlan
        : null,
    projectBlueprint,
    questionPolicy,
  }
}

function buildFrontendProjectMaterializationPrompt({ goal, scalablePlan }) {
  const allowedRootPaths = summarizeUniqueStrings(scalablePlan?.allowedRootPaths, 6)
  const targetStructure = summarizeUniqueStrings(scalablePlan?.targetStructure, 12)
  const directories = summarizeUniqueStrings(scalablePlan?.directories, 12)
  const filesToCreate = Array.isArray(scalablePlan?.filesToCreate)
    ? scalablePlan.filesToCreate
        .map((entry) => (entry && typeof entry === 'object' ? String(entry.path || '').trim() : ''))
        .filter(Boolean)
        .slice(0, 12)
    : []
  const localOnlyConstraints = summarizeUniqueStrings(
    scalablePlan?.localOnlyConstraints,
    12,
  )
  const explicitExclusions = summarizeUniqueStrings(
    scalablePlan?.explicitExclusions,
    12,
  )

  return {
    goal: `Materializar frontend-project revisado para "${goal}".`,
    context: [
      'deliveryLevel: frontend-project.',
      'accion requerida: materializar frontend-project.',
      allowedRootPaths.length > 0
        ? `allowedRootPaths: ${allowedRootPaths.join(', ')}`
        : '',
      targetStructure.length > 0
        ? `targetStructure: ${targetStructure.join(', ')}`
        : '',
      directories.length > 0 ? `directories: ${directories.join(', ')}` : '',
      filesToCreate.length > 0 ? `filesToCreate: ${filesToCreate.join(', ')}` : '',
      localOnlyConstraints.length > 0
        ? `localOnlyConstraints: ${localOnlyConstraints.join(' | ')}`
        : '',
      explicitExclusions.length > 0
        ? `explicitExclusions: ${explicitExclusions.join(' | ')}`
        : '',
      'Archivos requeridos: package.json, index.html, README.md, src/main.js, src/styles.css, src/mock-data.js, src/components/App.js.',
      'Devolver un materialize-frontend-project-plan ejecutable por el executor local deterministico.',
      'No instalar dependencias ni crear node_modules.',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function buildFullstackLocalMaterializationPrompt({ goal, scalablePlan }) {
  const allowedRootPaths = summarizeUniqueStrings(scalablePlan?.allowedRootPaths, 8)
  const targetStructure = summarizeUniqueStrings(scalablePlan?.targetStructure, 16)
  const directories = summarizeUniqueStrings(scalablePlan?.directories, 24)
  const filesToCreate = Array.isArray(scalablePlan?.filesToCreate)
    ? scalablePlan.filesToCreate
        .map((entry) => (entry && typeof entry === 'object' ? String(entry.path || '').trim() : ''))
        .filter(Boolean)
        .slice(0, 24)
    : []
  const localOnlyConstraints = summarizeUniqueStrings(
    scalablePlan?.localOnlyConstraints,
    16,
  )
  const explicitExclusions = summarizeUniqueStrings(
    scalablePlan?.explicitExclusions,
    16,
  )

  return {
    goal: `Materializar fullstack-local revisado para "${goal}".`,
    context: [
      'deliveryLevel: fullstack-local.',
      'accion requerida: materializar fullstack-local.',
      allowedRootPaths.length > 0
        ? `allowedRootPaths: ${allowedRootPaths.join(', ')}`
        : '',
      targetStructure.length > 0
        ? `targetStructure: ${targetStructure.join(', ')}`
        : '',
      directories.length > 0 ? `directories: ${directories.join(', ')}` : '',
      filesToCreate.length > 0 ? `filesToCreate: ${filesToCreate.join(', ')}` : '',
      localOnlyConstraints.length > 0
        ? `localOnlyConstraints: ${localOnlyConstraints.join(' | ')}`
        : '',
      explicitExclusions.length > 0
        ? `explicitExclusions: ${explicitExclusions.join(' | ')}`
        : '',
      'Archivos requeridos: README.md, package.json, frontend/package.json, frontend/index.html, frontend/src/main.js, frontend/src/styles.css, frontend/src/mock-data.js, frontend/src/components/App.js, backend/package.json, backend/src/server.js, backend/src/routes/health.js, backend/src/modules/appointments.js, backend/src/lib/response.js, shared/contracts/domain.js, shared/types/contracts.js, database/README.md, database/schema.sql, database/seeds/seed-local.sql, scripts/README.md, scripts/seed-local.js, docs/architecture.md, docs/local-runbook.md.',
      'Devolver un materialize-fullstack-local-plan ejecutable por el executor local deterministico.',
      'No instalar dependencias, no crear node_modules, no crear .env real y no levantar servicios.',
    ]
      .filter(Boolean)
      .join('\n'),
  }
}

function buildReusablePlanningContext() {
  return {
    reusableArtifactLookup: {
      executed: false,
      foundCount: 0,
      matches: [],
    },
    reusableArtifactsFound: 0,
    reuseDecision: false,
    reuseReason: '',
    reusedArtifactIds: [],
    reuseMode: 'none',
    creativeDirection: null,
  }
}

function ensureCleanDirectory(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
  fs.mkdirSync(targetPath, { recursive: true })
}

function findManifestPathInsideWorkspace(workspacePath) {
  if (!workspacePath || !fs.existsSync(workspacePath)) {
    return ''
  }

  const directManifestPath = path.join(workspacePath, 'jefe-project.json')
  if (fs.existsSync(directManifestPath)) {
    return directManifestPath
  }

  const entries = fs
    .readdirSync(workspacePath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .slice(0, 12)

  for (const entry of entries) {
    const manifestPath = path.join(workspacePath, entry.name, 'jefe-project.json')
    if (fs.existsSync(manifestPath)) {
      return manifestPath
    }
  }

  return ''
}

async function buildPhaseExecutionFixture({ workspaceName = 'fullstack-project-phase' } = {}) {
  const workspacePath = path.join(smokeExecutionWorkspaceRoot, workspaceName)
  ensureCleanDirectory(workspacePath)

  const reusablePlanningContext = buildReusablePlanningContext()
  const phaseOneDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: fullstackLocalMaterializationCase.goal,
    context: fullstackLocalMaterializationCase.context,
    workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })
  const scalablePlan =
    phaseOneDecision?.scalableDeliveryPlan &&
    typeof phaseOneDecision.scalableDeliveryPlan === 'object'
      ? phaseOneDecision.scalableDeliveryPlan
      : null
  const prompt = buildFullstackLocalMaterializationPrompt({
    goal: fullstackLocalMaterializationCase.goal,
    scalablePlan,
  })
  const phaseTwoDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: prompt.goal,
    context: prompt.context,
    workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  if (!phaseTwoDecision?.materializationPlan) {
    throw new Error('No se pudo construir el materializationPlan base de fullstack-local para fases.')
  }

  const task = buildLocalMaterializationTask({
    plan: phaseTwoDecision.materializationPlan,
    workspacePath,
    requestId: 'smoke-phase-fixture',
    instruction: phaseTwoDecision.instruction || '',
    brainStrategy: phaseTwoDecision.strategy || '',
    businessSector: phaseTwoDecision.businessSector || '',
    businessSectorLabel: phaseTwoDecision.businessSectorLabel || '',
    creativeDirection: phaseTwoDecision.creativeDirection || null,
    reusableArtifactLookup: phaseTwoDecision.reusableArtifactLookup || null,
    reusableArtifactsFound: phaseTwoDecision.reusableArtifactsFound || 0,
    reuseDecision: phaseTwoDecision.reuseDecision === true,
    reuseReason: phaseTwoDecision.reuseReason || '',
    reusedArtifactIds: Array.isArray(phaseTwoDecision.reusedArtifactIds)
      ? phaseTwoDecision.reusedArtifactIds
      : [],
    reuseMode: phaseTwoDecision.reuseMode || 'none',
    reuseMaterialization: null,
    materializationPlanSource: phaseTwoDecision.materializationPlanSource || 'planner',
  })

  if (!task) {
    throw new Error('No se pudo construir la tarea local deterministica para el fixture de fases.')
  }

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    throw new Error(
      executionResult?.error ||
        'La materializacion del fixture fullstack-local para fases no termino en OK.',
    )
  }

  const manifestPath = findManifestPathInsideWorkspace(workspacePath)
  if (!manifestPath) {
    throw new Error('No se encontro jefe-project.json dentro del fixture de fases.')
  }

  const projectRootPath = path.dirname(manifestPath)
  const projectRootRelativePath = normalizePathForComparison(
    path.relative(workspacePath, projectRootPath) || '.',
  )
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

  return {
    workspacePath,
    manifestPath,
    manifest,
    projectRootPath,
    projectRootRelativePath,
    phaseOneDecision,
    phaseTwoDecision,
    executionResult,
  }
}

async function getPhaseExecutionFixture() {
  if (!cachedFullstackPhaseFixturePromise) {
    cachedFullstackPhaseFixturePromise = buildPhaseExecutionFixture()
  }

  return cachedFullstackPhaseFixturePromise
}

async function materializePhaseOnFixture({ fixture, phaseId, requestId }) {
  const reusablePlanningContext = buildReusablePlanningContext()
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: `Materializar la fase ${phaseId} del proyecto fullstack local de turnos medicos.`,
    context: `phaseId: ${phaseId}`,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  if (!decision?.materializationPlan) {
    throw new Error(`No se pudo construir el materializationPlan de ${phaseId}.`)
  }

  const task = buildLocalMaterializationTask({
    plan: decision.materializationPlan,
    workspacePath: fixture.workspacePath,
    requestId,
    instruction: decision.instruction || '',
    brainStrategy: decision.strategy || '',
    businessSector: decision.businessSector || '',
    businessSectorLabel: decision.businessSectorLabel || '',
    creativeDirection: decision.creativeDirection || null,
    reusableArtifactLookup: decision.reusableArtifactLookup || null,
    reusableArtifactsFound: decision.reusableArtifactsFound || 0,
    reuseDecision: decision.reuseDecision === true,
    reuseReason: decision.reuseReason || '',
    reusedArtifactIds: Array.isArray(decision.reusedArtifactIds)
      ? decision.reusedArtifactIds
      : [],
    reuseMode: decision.reuseMode || 'none',
    reuseMaterialization: null,
    materializationPlanSource: decision.materializationPlanSource || 'planner',
  })

  if (!task) {
    throw new Error(`No se pudo construir la tarea local deterministica de ${phaseId}.`)
  }

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    throw new Error(
      executionResult?.error ||
        `La materializacion local de ${phaseId} no termino en OK.`,
    )
  }

  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'))

  return {
    ...fixture,
    manifest,
    lastPhaseDecision: decision,
    lastPhaseExecutionResult: executionResult,
  }
}

async function materializeModuleExpansionOnFixture({
  fixture,
  moduleLabel = 'notificaciones',
  requestId,
}) {
  const reusablePlanningContext = buildReusablePlanningContext()
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: `Materializar la expansion de modulo de ${moduleLabel} para el proyecto fullstack local de turnos medicos.`,
    context: `moduleId: ${moduleLabel}`,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  if (!decision?.materializationPlan) {
    throw new Error(`No se pudo construir el materializationPlan del modulo ${moduleLabel}.`)
  }

  const task = buildLocalMaterializationTask({
    plan: decision.materializationPlan,
    workspacePath: fixture.workspacePath,
    requestId,
    instruction: decision.instruction || '',
    brainStrategy: decision.strategy || '',
    businessSector: decision.businessSector || '',
    businessSectorLabel: decision.businessSectorLabel || '',
    creativeDirection: decision.creativeDirection || null,
    reusableArtifactLookup: decision.reusableArtifactLookup || null,
    reusableArtifactsFound: decision.reusableArtifactsFound || 0,
    reuseDecision: decision.reuseDecision === true,
    reuseReason: decision.reuseReason || '',
    reusedArtifactIds: Array.isArray(decision.reusedArtifactIds)
      ? decision.reusedArtifactIds
      : [],
    reuseMode: decision.reuseMode || 'none',
    reuseMaterialization: null,
    materializationPlanSource: decision.materializationPlanSource || 'planner',
  })

  if (!task) {
    throw new Error(`No se pudo construir la tarea local deterministica del modulo ${moduleLabel}.`)
  }

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    throw new Error(
      executionResult?.error ||
        `La materializacion local del modulo ${moduleLabel} no termino en OK.`,
    )
  }

  const manifest = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'))

  return {
    ...fixture,
    manifest,
    lastModuleDecision: decision,
    lastModuleExecutionResult: executionResult,
  }
}

async function buildModuleExpansionReadyFixture(workspaceName) {
  let fixture = await buildPhaseExecutionFixture({ workspaceName })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: `${workspaceName}-frontend`,
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: `${workspaceName}-backend`,
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: `${workspaceName}-database`,
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: `${workspaceName}-validation`,
  })
  return fixture
}

const continuationBasePhaseIds = [
  'fullstack-local-scaffold',
  'frontend-mock-flow',
  'backend-contracts',
  'database-design',
  'local-validation',
  'review-and-expand',
]

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value))
}

function buildContinuationScenarioManifest(baseManifest, options = {}) {
  const manifest = cloneJson(baseManifest || {})
  const existingPhaseMap = new Map(
    (Array.isArray(manifest.phases) ? manifest.phases : []).map((entry) => [
      String(entry?.id || '').trim(),
      entry,
    ]),
  )
  const phaseStatuses =
    options.phaseStatuses && typeof options.phaseStatuses === 'object'
      ? options.phaseStatuses
      : {}

  manifest.version = Number.isFinite(manifest.version) ? manifest.version : 1
  manifest.projectType = 'fullstack-local'
  manifest.deliveryLevel = 'fullstack-local'

  if (options.includePhases === false) {
    delete manifest.phases
  } else {
    const declaredPhaseIds = summarizeUniqueStrings(
      [...continuationBasePhaseIds, ...Object.keys(phaseStatuses)],
      24,
    )
    manifest.phases = declaredPhaseIds
      .map((phaseId) => {
        const existingEntry = existingPhaseMap.get(phaseId) || {}
        const status =
          typeof phaseStatuses[phaseId] === 'string'
            ? phaseStatuses[phaseId]
            : String(existingEntry?.status || '').trim()

        if (!status) {
          return null
        }

        return {
          ...existingEntry,
          id: phaseId,
          status,
          createdAt: existingEntry?.createdAt || 'scenario-manifest',
          files: toStringArray(existingEntry?.files, 24),
        }
      })
      .filter(Boolean)
  }

  if (options.modulesMode === 'remove') {
    delete manifest.modules
  } else if (options.modulesMode === 'replace') {
    manifest.modules = Array.isArray(options.modules)
      ? options.modules.map((entry) => ({
          id: String(entry?.id || '').trim(),
          name: String(entry?.name || entry?.id || '').trim(),
          status: String(entry?.status || '').trim(),
          addedAt: String(entry?.addedAt || 'scenario-manifest').trim(),
          layers: toStringArray(entry?.layers, 16),
          files: toStringArray(entry?.files, 24),
        }))
      : []
  }

  if (Object.prototype.hasOwnProperty.call(options, 'nextRecommendedPhase')) {
    if (options.nextRecommendedPhase) {
      manifest.nextRecommendedPhase = String(options.nextRecommendedPhase).trim()
    } else {
      delete manifest.nextRecommendedPhase
    }
  }

  delete manifest.nextRecommendedAction
  delete manifest.lastCompletedPhase
  delete manifest.availableActions
  delete manifest.blockedActions
  delete manifest.approvalRequiredActions
  delete manifest.risks
  delete manifest.updatedAt
  delete manifest.history

  return manifest
}

function writeFixtureManifest(fixture, manifest) {
  fs.writeFileSync(fixture.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  return {
    ...fixture,
    manifest,
  }
}

async function requestContinuationDecision({ fixture, testCase }) {
  const reusablePlanningContext = buildReusablePlanningContext()
  return plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })
}

function buildExpectedModuleTargets(fixture, moduleId) {
  return [
    `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
    `${fixture.projectRootRelativePath}/frontend/src/components/App.js`,
    `${fixture.projectRootRelativePath}/frontend/src/styles.css`,
    `${fixture.projectRootRelativePath}/backend/src/modules/${moduleId}.js`,
    `${fixture.projectRootRelativePath}/backend/src/routes/${moduleId}.js`,
    `${fixture.projectRootRelativePath}/shared/contracts/domain.js`,
    `${fixture.projectRootRelativePath}/shared/types/contracts.js`,
    `${fixture.projectRootRelativePath}/database/schema.sql`,
    `${fixture.projectRootRelativePath}/database/seeds/seed-local.sql`,
    `${fixture.projectRootRelativePath}/docs/architecture.md`,
    `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
    `${fixture.projectRootRelativePath}/docs/validation-report.md`,
    `${fixture.projectRootRelativePath}/jefe-project.json`,
  ].map(normalizePathForComparison)
}

function buildModuleValidationMarkers(moduleId) {
  if (moduleId === 'notifications') {
    return {
      app: 'Notificaciones mock',
      module: 'simulateNotificationDispatch',
      route: 'listNotificationsHandler',
      manifestId: 'notifications',
    }
  }
  if (moduleId === 'reports') {
    return {
      app: 'Reportes operativos mock',
      module: 'buildOperationalIndicators',
      route: 'listReportsHandler',
      manifestId: 'reports',
    }
  }
  if (moduleId === 'inventory') {
    return {
      app: 'Inventario y stock mock',
      module: 'suggestRestock',
      route: 'listInventoryHandler',
      manifestId: 'inventory',
    }
  }
  return null
}

async function runFrontendProjectMaterializationValidation() {
  const reusablePlanningContext = {
    reusableArtifactLookup: {
      executed: false,
      foundCount: 0,
      matches: [],
    },
    reusableArtifactsFound: 0,
    reuseDecision: false,
    reuseReason: '',
    reusedArtifactIds: [],
    reuseMode: 'none',
    creativeDirection: null,
  }
  const phaseOneDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: frontendProjectMaterializationCase.goal,
    context: frontendProjectMaterializationCase.context,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })
  const scalablePlan =
    phaseOneDecision?.scalableDeliveryPlan &&
    typeof phaseOneDecision.scalableDeliveryPlan === 'object'
      ? phaseOneDecision.scalableDeliveryPlan
      : null
  const prompt = buildFrontendProjectMaterializationPrompt({
    goal: frontendProjectMaterializationCase.goal,
    scalablePlan,
  })
  const phaseTwoDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: prompt.goal,
    context: prompt.context,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(phaseTwoDecision?.strategy || '').trim()
  const executionMode = String(phaseTwoDecision?.executionMode || '').trim()
  const nextExpectedAction = String(phaseTwoDecision?.nextExpectedAction || '').trim()
  const phaseTwoScalablePlan =
    phaseTwoDecision?.scalableDeliveryPlan &&
    typeof phaseTwoDecision.scalableDeliveryPlan === 'object'
      ? phaseTwoDecision.scalableDeliveryPlan
      : null
  const executionScope =
    phaseTwoDecision?.executionScope && typeof phaseTwoDecision.executionScope === 'object'
      ? phaseTwoDecision.executionScope
      : null
  const nextActionPlan =
    phaseTwoDecision?.nextActionPlan && typeof phaseTwoDecision.nextActionPlan === 'object'
      ? phaseTwoDecision.nextActionPlan
      : null
  const validationPlan =
    phaseTwoDecision?.validationPlan && typeof phaseTwoDecision.validationPlan === 'object'
      ? phaseTwoDecision.validationPlan
      : null
  const phaseExpansionPlan =
    phaseTwoDecision?.phaseExpansionPlan &&
    typeof phaseTwoDecision.phaseExpansionPlan === 'object'
      ? phaseTwoDecision.phaseExpansionPlan
      : null
  const materializationPlan =
    phaseTwoDecision?.materializationPlan &&
    typeof phaseTwoDecision.materializationPlan === 'object'
      ? phaseTwoDecision.materializationPlan
      : null
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    20,
  )

  if (String(phaseOneDecision?.strategy || '').trim() !== 'scalable-delivery-plan') {
    failures.push('La fase 1 no devolvio scalable-delivery-plan para el caso frontend-project.')
  }

  if (strategy !== 'materialize-frontend-project-plan') {
    failures.push(
      `Estrategia incorrecta en fase 2. Esperado: materialize-frontend-project-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'executor') {
    failures.push(`executionMode incorrecto en fase 2. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`)
  }

  if (nextExpectedAction !== 'execute-plan') {
    failures.push(
      `nextExpectedAction incorrecto en fase 2. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  if (String(phaseTwoScalablePlan?.deliveryLevel || '').trim() !== 'frontend-project') {
    failures.push('deliveryLevel incorrecto en fase 2 para scalableDeliveryPlan.')
  }

  if (!materializationPlan) {
    failures.push('materializationPlan ausente en fase 2.')
  } else {
    if (String(materializationPlan.strategy || '').trim() !== 'materialize-frontend-project-plan') {
      failures.push('materializationPlan.strategy incorrecto.')
    }

    if (!Array.isArray(materializationPlan.operations) || materializationPlan.operations.length < 8) {
      failures.push('materializationPlan.operations deberia incluir la estructura minima del frontend.')
    }

    if (!Array.isArray(materializationPlan.validations) || materializationPlan.validations.length < 8) {
      failures.push('materializationPlan.validations deberia validar la estructura minima del frontend.')
    }
  }

  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en fase 2.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (nextActionSummary.actionType !== 'execute-materialization') {
      failures.push('nextActionPlan.actionType deberia ser execute-materialization.')
    }
    if (nextActionSummary.targetStrategy !== 'materialize-frontend-project-plan') {
      failures.push(
        'nextActionPlan.targetStrategy deberia apuntar a materialize-frontend-project-plan.',
      )
    }
    if (!nextActionSummary.safeToRunNow) {
      failures.push('nextActionPlan.safeToRunNow deberia ser true en fase 2 frontend.')
    }
  }

  if (!validationPlan) {
    failures.push('validationPlan ausente en fase 2 frontend.')
  } else {
    const validationSummary = summarizeValidationPlan(validationPlan)
    ;['node_modules', '.env', 'backend', 'database'].forEach((token) => {
      if (!validationSummary.forbiddenPaths.some((entry) => entry.includes(token))) {
        failures.push(`validationPlan.forbiddenPaths no incluye ${token}.`)
      }
    })
  }

  if (!phaseExpansionPlan) {
    failures.push('phaseExpansionPlan ausente en fase 2 frontend.')
  } else {
    const expansionSummary = summarizePhaseExpansionPlan(phaseExpansionPlan)
    if (!String(expansionSummary.phaseId || '').trim()) {
      failures.push('phaseExpansionPlan.phaseId vacio en fase 2 frontend.')
    }
  }

  const expectedTargets = [
    'package.json',
    'index.html',
    'README.md',
    'src/main.js',
    'src/styles.css',
    'src/mock-data.js',
    'src/components/App.js',
  ]

  if (allowedTargetPaths.length === 0) {
    failures.push('allowedTargetPaths vacio en fase 2.')
  } else {
    expectedTargets.forEach((token) => {
      if (!allowedTargetPaths.some((targetPath) => normalizePathForComparison(targetPath).endsWith(token))) {
        failures.push(`allowedTargetPaths no incluye ${token}.`)
      }
    })

    if (allowedTargetPaths.some((targetPath) => /node_modules/i.test(targetPath))) {
      failures.push('allowedTargetPaths no deberia incluir node_modules.')
    }
  }

  return {
    testCase: frontendProjectMaterializationCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
    scalablePlan: phaseTwoScalablePlan,
  }
}

async function runFullstackLocalMaterializationValidation() {
  const reusablePlanningContext = buildReusablePlanningContext()
  const phaseOneDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: fullstackLocalMaterializationCase.goal,
    context: fullstackLocalMaterializationCase.context,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })
  const scalablePlan =
    phaseOneDecision?.scalableDeliveryPlan &&
    typeof phaseOneDecision.scalableDeliveryPlan === 'object'
      ? phaseOneDecision.scalableDeliveryPlan
      : null
  const prompt = buildFullstackLocalMaterializationPrompt({
    goal: fullstackLocalMaterializationCase.goal,
    scalablePlan,
  })
  const phaseTwoDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: prompt.goal,
    context: prompt.context,
    workspacePath: 'C:/tmp/ai-planner-smoke-workspace',
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(phaseTwoDecision?.strategy || '').trim()
  const executionMode = String(phaseTwoDecision?.executionMode || '').trim()
  const nextExpectedAction = String(phaseTwoDecision?.nextExpectedAction || '').trim()
  const phaseTwoScalablePlan =
    phaseTwoDecision?.scalableDeliveryPlan &&
    typeof phaseTwoDecision.scalableDeliveryPlan === 'object'
      ? phaseTwoDecision.scalableDeliveryPlan
      : null
  const executionScope =
    phaseTwoDecision?.executionScope && typeof phaseTwoDecision.executionScope === 'object'
      ? phaseTwoDecision.executionScope
      : null
  const nextActionPlan =
    phaseTwoDecision?.nextActionPlan && typeof phaseTwoDecision.nextActionPlan === 'object'
      ? phaseTwoDecision.nextActionPlan
      : null
  const validationPlan =
    phaseTwoDecision?.validationPlan && typeof phaseTwoDecision.validationPlan === 'object'
      ? phaseTwoDecision.validationPlan
      : null
  const phaseExpansionPlan =
    phaseTwoDecision?.phaseExpansionPlan &&
    typeof phaseTwoDecision.phaseExpansionPlan === 'object'
      ? phaseTwoDecision.phaseExpansionPlan
      : null
  const localProjectManifest =
    phaseTwoDecision?.localProjectManifest &&
    typeof phaseTwoDecision.localProjectManifest === 'object'
      ? phaseTwoDecision.localProjectManifest
      : null
  const materializationPlan =
    phaseTwoDecision?.materializationPlan &&
    typeof phaseTwoDecision.materializationPlan === 'object'
      ? phaseTwoDecision.materializationPlan
      : null
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    40,
  )

  if (String(phaseOneDecision?.strategy || '').trim() !== 'scalable-delivery-plan') {
    failures.push('La fase 1 no devolvio scalable-delivery-plan para el caso fullstack-local.')
  }

  if (strategy !== 'materialize-fullstack-local-plan') {
    failures.push(
      `Estrategia incorrecta en fase 2. Esperado: materialize-fullstack-local-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'executor') {
    failures.push(`executionMode incorrecto en fase 2. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`)
  }

  if (nextExpectedAction !== 'execute-plan') {
    failures.push(
      `nextExpectedAction incorrecto en fase 2. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  if (String(phaseTwoScalablePlan?.deliveryLevel || '').trim() !== 'fullstack-local') {
    failures.push('deliveryLevel incorrecto en fase 2 para scalableDeliveryPlan.')
  }

  if (!materializationPlan) {
    failures.push('materializationPlan ausente en fase 2.')
  } else {
    if (String(materializationPlan.strategy || '').trim() !== 'materialize-fullstack-local-plan') {
      failures.push('materializationPlan.strategy incorrecto.')
    }

    if (!Array.isArray(materializationPlan.operations) || materializationPlan.operations.length < 20) {
      failures.push('materializationPlan.operations deberia incluir la estructura minima del fullstack local.')
    }

    if (!Array.isArray(materializationPlan.validations) || materializationPlan.validations.length < 16) {
      failures.push('materializationPlan.validations deberia validar la estructura minima del fullstack local.')
    }

    const operationTargets = toStringArray(
      materializationPlan.operations?.map((entry) => entry?.targetPath || ''),
      40,
    )
    if (!operationTargets.some((targetPath) => normalizePathForComparison(targetPath).endsWith('jefe-project.json'))) {
      failures.push('materializationPlan.operations deberia incluir jefe-project.json.')
    }
  }

  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en fase 2 fullstack.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (nextActionSummary.actionType !== 'execute-materialization') {
      failures.push('nextActionPlan.actionType deberia ser execute-materialization.')
    }
    if (nextActionSummary.targetStrategy !== 'materialize-fullstack-local-plan') {
      failures.push(
        'nextActionPlan.targetStrategy deberia apuntar a materialize-fullstack-local-plan.',
      )
    }
    if (!nextActionSummary.safeToRunNow) {
      failures.push('nextActionPlan.safeToRunNow deberia ser true en fase 2 fullstack.')
    }
  }

  if (!validationPlan) {
    failures.push('validationPlan ausente en fase 2 fullstack.')
  } else {
    const validationSummary = summarizeValidationPlan(validationPlan)
    ;['node_modules', '.env', 'docker-compose.yml', 'Dockerfile', 'deploy'].forEach(
      (token) => {
        if (!validationSummary.forbiddenPaths.some((entry) => entry.includes(token))) {
          failures.push(`validationPlan.forbiddenPaths no incluye ${token}.`)
        }
      },
    )
    if (
      !validationSummary.fileChecks.some((entry) =>
        normalizePathForComparison(entry.path).endsWith('jefe-project.json'),
      )
    ) {
      failures.push('validationPlan.fileChecks deberia incluir jefe-project.json.')
    }
  }

  if (!phaseExpansionPlan) {
    failures.push('phaseExpansionPlan ausente en fase 2 fullstack.')
  } else {
    const expansionSummary = summarizePhaseExpansionPlan(phaseExpansionPlan)
    if (!String(expansionSummary.phaseId || '').trim()) {
      failures.push('phaseExpansionPlan.phaseId vacio en fase 2 fullstack.')
    }
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en fase 2 fullstack.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    if (manifestSummary.deliveryLevel !== 'fullstack-local') {
      failures.push('localProjectManifest.deliveryLevel incorrecto.')
    }
    if (!String(manifestSummary.nextRecommendedPhase || '').trim()) {
      failures.push('localProjectManifest.nextRecommendedPhase vacio.')
    }
    ;[
      'fullstack-local-scaffold',
      'frontend-mock-flow',
      'backend-contracts',
      'database-design',
    ].forEach(
      (phaseId) => {
        if (!manifestSummary.phases.some((entry) => entry.id === phaseId)) {
          failures.push(`localProjectManifest.phases no incluye ${phaseId}.`)
        }
      },
    )
    ;['node_modules', '.env', 'docker-compose.yml', 'Dockerfile', 'deploy'].forEach(
      (token) => {
        if (!manifestSummary.forbiddenPaths.some((entry) => entry.includes(token))) {
          failures.push(`localProjectManifest.forbiddenPaths no incluye ${token}.`)
        }
      },
    )
  }

  const expectedTargets = [
    'README.md',
    'package.json',
    'frontend/package.json',
    'frontend/index.html',
    'frontend/src/main.js',
    'frontend/src/styles.css',
    'frontend/src/mock-data.js',
    'frontend/src/components/App.js',
    'backend/package.json',
    'backend/src/server.js',
    'backend/src/routes/health.js',
    'backend/src/modules/appointments.js',
    'backend/src/lib/response.js',
    'shared/contracts/domain.js',
    'shared/types/contracts.js',
    'database/README.md',
    'database/schema.sql',
    'database/seeds/seed-local.sql',
    'scripts/README.md',
    'scripts/seed-local.js',
    'docs/architecture.md',
    'docs/local-runbook.md',
    'jefe-project.json',
  ]

  if (allowedTargetPaths.length === 0) {
    failures.push('allowedTargetPaths vacio en fase 2.')
  } else {
    expectedTargets.forEach((token) => {
      if (!allowedTargetPaths.some((targetPath) => normalizePathForComparison(targetPath).endsWith(token))) {
        failures.push(`allowedTargetPaths no incluye ${token}.`)
      }
    })

    ;['frontend/', 'backend/', 'shared/', 'database/', 'scripts/', 'docs/'].forEach((token) => {
      const normalizedToken = normalizePathForComparison(token)
      if (!allowedTargetPaths.some((targetPath) => normalizePathForComparison(targetPath).includes(normalizedToken))) {
        failures.push(`allowedTargetPaths no incluye ${token}.`)
      }
    })

    if (allowedTargetPaths.some((targetPath) => /node_modules|\.env$/i.test(targetPath))) {
      failures.push('allowedTargetPaths no deberia incluir node_modules ni .env reales.')
    }
  }

  return {
    testCase: fullstackLocalMaterializationCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
    scalablePlan: phaseTwoScalablePlan,
  }
}

async function runPrepareFrontendMockFlowValidation() {
  const fixture = await getPhaseExecutionFixture()
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareFrontendMockFlow
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }

  if (nextExpectedAction !== 'review-project-phase') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-project-phase. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  if (materializationPlan) {
    failures.push('No deberia devolver materializationPlan ejecutable en la fase prepare-project-phase-plan.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'frontend-mock-flow') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser frontend-mock-flow.')
    }
    if (phaseSummary.targetStrategy !== 'materialize-project-phase-plan') {
      failures.push('projectPhaseExecutionPlan.targetStrategy deberia apuntar a materialize-project-phase-plan.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('projectPhaseExecutionPlan.executableNow deberia ser true para frontend-mock-flow.')
    }
    const expectedTargets = [
      `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
      `${fixture.projectRootRelativePath}/frontend/src/components/App.js`,
      `${fixture.projectRootRelativePath}/frontend/src/styles.css`,
      `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
      `${fixture.projectRootRelativePath}/jefe-project.json`,
    ].map(normalizePathForComparison)
    expectedTargets.forEach((targetPath) => {
      if (
        !phaseSummary.allowedTargetPaths.some(
          (entry) => normalizePathForComparison(entry) === targetPath,
        )
      ) {
        failures.push(`projectPhaseExecutionPlan.allowedTargetPaths no incluye ${targetPath}.`)
      }
    })
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en prepare frontend-mock-flow.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    if (manifestSummary.nextRecommendedPhase !== 'frontend-mock-flow') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia seguir apuntando a frontend-mock-flow.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runMaterializeFrontendMockFlowValidation() {
  const fixture = await getPhaseExecutionFixture()
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeFrontendMockFlow
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const phaseExpansionPlan =
    decision?.phaseExpansionPlan && typeof decision.phaseExpansionPlan === 'object'
      ? decision.phaseExpansionPlan
      : null
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    24,
  ).map(normalizePathForComparison)

  if (strategy !== 'materialize-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: materialize-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'executor') {
    failures.push(
      `executionMode incorrecto. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }

  if (nextExpectedAction !== 'execute-plan') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en materialize frontend-mock-flow.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'frontend-mock-flow') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser frontend-mock-flow.')
    }
  }

  if (!materializationPlan) {
    failures.push('materializationPlan ausente en materialize-project-phase-plan.')
  } else {
    if (String(materializationPlan.strategy || '').trim() !== 'materialize-project-phase-plan') {
      failures.push('materializationPlan.strategy incorrecto para frontend-mock-flow.')
    }

    const operationTargets = toStringArray(
      materializationPlan.operations?.map((entry) => entry?.targetPath || ''),
      24,
    ).map(normalizePathForComparison)
    const expectedTargets = [
      `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
      `${fixture.projectRootRelativePath}/frontend/src/components/App.js`,
      `${fixture.projectRootRelativePath}/frontend/src/styles.css`,
      `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
      `${fixture.projectRootRelativePath}/jefe-project.json`,
    ].map(normalizePathForComparison)

    expectedTargets.forEach((targetPath) => {
      if (!operationTargets.includes(targetPath)) {
        failures.push(`materializationPlan.operations no incluye ${targetPath}.`)
      }
    })

    if (operationTargets.some((targetPath) => /backend\/|database\/|node_modules|\.env$/i.test(targetPath))) {
      failures.push('materializationPlan.operations no deberia tocar backend, database, node_modules ni .env.')
    }
  }

  const expectedAllowedTargets = [
    `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
    `${fixture.projectRootRelativePath}/frontend/src/components/App.js`,
    `${fixture.projectRootRelativePath}/frontend/src/styles.css`,
    `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
    `${fixture.projectRootRelativePath}/jefe-project.json`,
  ].map(normalizePathForComparison)

  expectedAllowedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })

  if (allowedTargetPaths.some((targetPath) => /backend\/|database\/|package\.json|node_modules|\.env$/i.test(targetPath))) {
    failures.push('allowedTargetPaths no deberia incluir backend, database, package.json, node_modules ni .env.')
  }

  if (!phaseExpansionPlan) {
    failures.push('phaseExpansionPlan ausente en materialize frontend-mock-flow.')
  } else {
    const expansionSummary = summarizePhaseExpansionPlan(phaseExpansionPlan)
    if (expansionSummary.phaseId !== 'backend-contracts') {
      failures.push('phaseExpansionPlan deberia proponer backend-contracts como siguiente fase.')
    }
    if (expansionSummary.executableNow) {
      failures.push('phaseExpansionPlan no deberia quedar ejecutable automaticamente para backend-contracts.')
    }
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en materialize frontend-mock-flow.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    const frontendPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'frontend-mock-flow',
    )
    const backendPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'backend-contracts',
    )
    if (manifestSummary.nextRecommendedPhase !== 'backend-contracts') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia avanzar a backend-contracts.')
    }
    if (!frontendPhase || frontendPhase.status !== 'done') {
      failures.push('localProjectManifest deberia marcar frontend-mock-flow como done.')
    }
    if (!backendPhase || backendPhase.status !== 'available') {
      failures.push('localProjectManifest deberia mantener backend-contracts como available.')
    }
  }

  if (materializationPlan) {
    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath: fixture.workspacePath,
      requestId: 'smoke-frontend-mock-flow-materialization',
      instruction: decision?.instruction || '',
      brainStrategy: decision?.strategy || '',
      businessSector: decision?.businessSector || '',
      businessSectorLabel: decision?.businessSectorLabel || '',
      creativeDirection: decision?.creativeDirection || null,
      reusableArtifactLookup: decision?.reusableArtifactLookup || null,
      reusableArtifactsFound: decision?.reusableArtifactsFound || 0,
      reuseDecision: decision?.reuseDecision === true,
      reuseReason: decision?.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision?.reusedArtifactIds)
        ? decision.reusedArtifactIds
        : [],
      reuseMode: decision?.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision?.materializationPlanSource || 'planner',
    })

    if (!task) {
      failures.push('No se pudo construir la tarea local deterministica para frontend-mock-flow.')
    } else {
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok !== true) {
        failures.push(
          executionResult?.error ||
            'La materializacion local de frontend-mock-flow no termino en OK.',
        )
      } else {
        const touchedPaths = toStringArray(executionResult?.details?.touchedPaths, 24).map(
          normalizePathForComparison,
        )
        const manifestPath = path.join(
          fixture.workspacePath,
          fixture.projectRootRelativePath,
          'jefe-project.json',
        )
        const manifestFromDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const manifestFromDiskSummary = summarizeLocalProjectManifest(manifestFromDisk)
        const frontendPhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'frontend-mock-flow',
        )
        const backendPhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'backend-contracts',
        )

        if (
          !touchedPaths.some((targetPath) =>
            targetPath.endsWith(
              normalizePathForComparison(
                `${fixture.projectRootRelativePath}/jefe-project.json`,
              ),
            ),
          )
        ) {
          failures.push('La ejecucion real de frontend-mock-flow deberia tocar jefe-project.json.')
        }
        if (manifestFromDiskSummary.nextRecommendedPhase !== 'backend-contracts') {
          failures.push(
            'El jefe-project.json resultante deberia actualizar nextRecommendedPhase a backend-contracts.',
          )
        }
        if (!frontendPhase || frontendPhase.status !== 'done') {
          failures.push(
            'El jefe-project.json resultante deberia marcar frontend-mock-flow como done.',
          )
        }
        if (!backendPhase || backendPhase.status !== 'available') {
          failures.push(
            'El jefe-project.json resultante deberia mantener backend-contracts como available.',
          )
        }
      }
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runPrepareBackendContractsValidation() {
  const fixture = await getPhaseExecutionFixture()
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareBackendContracts
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }

  if (materializationPlan) {
    failures.push('backend-contracts no deberia devolver materializationPlan en este bloque.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en backend-contracts.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'backend-contracts') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser backend-contracts.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('backend-contracts deberia quedar listo para materializacion segura tras la revisión.')
    }
    if (phaseSummary.targetStrategy !== 'materialize-project-phase-plan') {
      failures.push('backend-contracts deberia apuntar a materialize-project-phase-plan tras la preparación.')
    }
    const expectedTargets = [
      `${fixture.projectRootRelativePath}/backend/src/modules/appointments.js`,
      `${fixture.projectRootRelativePath}/backend/src/routes/health.js`,
      `${fixture.projectRootRelativePath}/backend/src/lib/response.js`,
      `${fixture.projectRootRelativePath}/shared/contracts/domain.js`,
      `${fixture.projectRootRelativePath}/shared/types/contracts.js`,
      `${fixture.projectRootRelativePath}/docs/architecture.md`,
      `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
      `${fixture.projectRootRelativePath}/jefe-project.json`,
    ].map(normalizePathForComparison)

    expectedTargets.forEach((targetPath) => {
      if (
        !phaseSummary.allowedTargetPaths.some(
          (entry) => normalizePathForComparison(entry) === targetPath,
        )
      ) {
        failures.push(`projectPhaseExecutionPlan.allowedTargetPaths no incluye ${targetPath}.`)
      }
    })
    if (
      phaseSummary.allowedTargetPaths.some((entry) =>
        /frontend\/|database\/|node_modules|\.env$/i.test(entry),
      )
    ) {
      failures.push('backend-contracts no deberia incluir frontend, database, node_modules ni .env en allowedTargetPaths.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runBlockedBackendContractsMaterializationValidation() {
  const fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-backend-blocked',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeBackendContractsBlocked
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }

  if (nextExpectedAction !== 'review-project-phase') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-project-phase. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  if (materializationPlan) {
    failures.push('No deberia devolver materializationPlan cuando frontend-mock-flow sigue pendiente.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en backend-contracts bloqueada.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'backend-contracts') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser backend-contracts.')
    }
    if (phaseSummary.executableNow) {
      failures.push('backend-contracts no deberia quedar ejecutableNow si frontend-mock-flow sigue available.')
    }
    if (phaseSummary.prerequisitePhaseId !== 'frontend-mock-flow') {
      failures.push('backend-contracts deberia declarar frontend-mock-flow como prerequisitePhaseId.')
    }
    if (
      !phaseSummary.blockers.some((entry) =>
        entry.toLocaleLowerCase().includes('frontend-mock-flow'),
      )
    ) {
      failures.push('backend-contracts deberia exponer un blocker claro apuntando a frontend-mock-flow.')
    }
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en backend-contracts bloqueada.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    if (manifestSummary.nextRecommendedPhase !== 'frontend-mock-flow') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia seguir apuntando a frontend-mock-flow.')
    }
    const frontendPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'frontend-mock-flow',
    )
    const backendPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'backend-contracts',
    )
    if (!frontendPhase || frontendPhase.status !== 'available') {
      failures.push('frontend-mock-flow deberia seguir available en el caso negativo.')
    }
    if (!backendPhase || backendPhase.status !== 'available') {
      failures.push('backend-contracts deberia seguir available en el caso negativo.')
    }
  }

  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en backend-contracts bloqueada.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (!nextActionSummary.reason.toLocaleLowerCase().includes('frontend-mock-flow')) {
      failures.push('nextActionPlan.reason deberia mencionar frontend-mock-flow como prerequisito.')
    }
    if (!nextActionSummary.userFacingLabel.toLocaleLowerCase().includes('frontend mock flow')) {
      failures.push('nextActionPlan.userFacingLabel deberia recomendar completar frontend mock flow.')
    }
    if (!nextActionSummary.safeToRunNow) {
      failures.push('nextActionPlan.safeToRunNow deberia quedar true para permitir ejecutar la fase previa segura.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runMaterializeBackendContractsValidation() {
  const fixture = await getPhaseExecutionFixture()
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeBackendContracts
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const phaseExpansionPlan =
    decision?.phaseExpansionPlan && typeof decision.phaseExpansionPlan === 'object'
      ? decision.phaseExpansionPlan
      : null
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    24,
  ).map(normalizePathForComparison)

  if (strategy !== 'materialize-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: materialize-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'executor') {
    failures.push(
      `executionMode incorrecto. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }

  if (nextExpectedAction !== 'execute-plan') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en materialize backend-contracts.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'backend-contracts') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser backend-contracts.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('backend-contracts deberia estar marcado como executableNow en la materializacion.')
    }
  }

  const expectedTargets = [
    `${fixture.projectRootRelativePath}/backend/src/modules/appointments.js`,
    `${fixture.projectRootRelativePath}/backend/src/routes/health.js`,
    `${fixture.projectRootRelativePath}/backend/src/lib/response.js`,
    `${fixture.projectRootRelativePath}/shared/contracts/domain.js`,
    `${fixture.projectRootRelativePath}/shared/types/contracts.js`,
    `${fixture.projectRootRelativePath}/docs/architecture.md`,
    `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
    `${fixture.projectRootRelativePath}/jefe-project.json`,
  ].map(normalizePathForComparison)

  if (!materializationPlan) {
    failures.push('materializationPlan ausente en materialize backend-contracts.')
  } else {
    if (String(materializationPlan.strategy || '').trim() !== 'materialize-project-phase-plan') {
      failures.push('materializationPlan.strategy incorrecto para backend-contracts.')
    }

    const operationTargets = toStringArray(
      materializationPlan.operations?.map((entry) => entry?.targetPath || ''),
      24,
    ).map(normalizePathForComparison)

    expectedTargets.forEach((targetPath) => {
      if (!operationTargets.includes(targetPath)) {
        failures.push(`materializationPlan.operations no incluye ${targetPath}.`)
      }
    })

    if (
      operationTargets.some((targetPath) =>
        /frontend\/|database\/|node_modules|\.env$|docker|deploy/i.test(targetPath),
      )
    ) {
      failures.push('materializationPlan.operations no deberia tocar frontend, database, node_modules, .env, docker ni deploy.')
    }
  }

  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })

  if (
    allowedTargetPaths.some((targetPath) =>
      /frontend\/|database\/|node_modules|\.env$|docker|deploy/i.test(targetPath),
    )
  ) {
    failures.push('allowedTargetPaths no deberia incluir frontend, database, node_modules, .env, docker ni deploy.')
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en materialize backend-contracts.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    const backendPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'backend-contracts',
    )
    const databasePhase = manifestSummary.phases.find(
      (entry) => entry.id === 'database-design',
    )
    if (manifestSummary.nextRecommendedPhase !== 'database-design') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia avanzar a database-design.')
    }
    if (!backendPhase || backendPhase.status !== 'done') {
      failures.push('localProjectManifest deberia marcar backend-contracts como done.')
    }
    if (!databasePhase || databasePhase.status !== 'available') {
      failures.push('localProjectManifest deberia mantener database-design como available.')
    }
  }

  if (!phaseExpansionPlan) {
    failures.push('phaseExpansionPlan ausente en materialize backend-contracts.')
  } else {
    const expansionSummary = summarizePhaseExpansionPlan(phaseExpansionPlan)
    if (expansionSummary.phaseId !== 'database-design') {
      failures.push('phaseExpansionPlan deberia proponer database-design como siguiente fase.')
    }
    if (expansionSummary.executableNow) {
      failures.push('phaseExpansionPlan no deberia materializar database-design automaticamente.')
    }
  }

  if (materializationPlan) {
    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath: fixture.workspacePath,
      requestId: 'smoke-backend-contracts-materialization',
      instruction: decision?.instruction || '',
      brainStrategy: decision?.strategy || '',
      businessSector: decision?.businessSector || '',
      businessSectorLabel: decision?.businessSectorLabel || '',
      creativeDirection: decision?.creativeDirection || null,
      reusableArtifactLookup: decision?.reusableArtifactLookup || null,
      reusableArtifactsFound: decision?.reusableArtifactsFound || 0,
      reuseDecision: decision?.reuseDecision === true,
      reuseReason: decision?.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision?.reusedArtifactIds)
        ? decision.reusedArtifactIds
        : [],
      reuseMode: decision?.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision?.materializationPlanSource || 'planner',
    })

    if (!task) {
      failures.push('No se pudo construir la tarea local deterministica para backend-contracts.')
    } else {
      const backendBefore = {
        frontendMain: fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'main.js'),
          'utf8',
        ),
        databaseSchema: fs.readFileSync(
          path.join(fixture.projectRootPath, 'database', 'schema.sql'),
          'utf8',
        ),
      }
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok !== true) {
        failures.push(
          executionResult?.error ||
            'La materializacion local de backend-contracts no termino en OK.',
        )
      } else {
        const touchedPaths = toStringArray(executionResult?.details?.touchedPaths, 32).map(
          normalizePathForComparison,
        )
        const manifestPath = path.join(
          fixture.workspacePath,
          fixture.projectRootRelativePath,
          'jefe-project.json',
        )
        const manifestFromDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const manifestFromDiskSummary = summarizeLocalProjectManifest(manifestFromDisk)
        const backendPhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'backend-contracts',
        )
        const databasePhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'database-design',
        )

        expectedTargets.forEach((targetPath) => {
          if (
            !touchedPaths.some((entry) =>
              entry.endsWith(normalizePathForComparison(targetPath)),
            )
          ) {
            failures.push(`La ejecucion real de backend-contracts deberia tocar ${targetPath}.`)
          }
        })

        if (manifestFromDiskSummary.nextRecommendedPhase !== 'database-design') {
          failures.push(
            'El jefe-project.json resultante deberia actualizar nextRecommendedPhase a database-design.',
          )
        }
        if (!backendPhase || backendPhase.status !== 'done') {
          failures.push(
            'El jefe-project.json resultante deberia marcar backend-contracts como done.',
          )
        }
        if (!databasePhase || databasePhase.status !== 'available') {
          failures.push(
            'El jefe-project.json resultante deberia mantener database-design como available.',
          )
        }

        const frontendAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'main.js'),
          'utf8',
        )
        const databaseAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'database', 'schema.sql'),
          'utf8',
        )
        if (frontendAfter !== backendBefore.frontendMain) {
          failures.push('backend-contracts no deberia tocar frontend/src/main.js.')
        }
        if (databaseAfter !== backendBefore.databaseSchema) {
          failures.push('backend-contracts no deberia tocar database/schema.sql.')
        }

        ;[
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', 'health.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'lib', 'response.js'),
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          path.join(fixture.projectRootPath, 'shared', 'types', 'contracts.js'),
        ].forEach((filePath) => {
          execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' })
        })
      }
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runPrepareDatabaseDesignValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-database-ready',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-database-ready-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-database-ready-backend',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareDatabaseDesign
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }

  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }

  if (nextExpectedAction !== 'review-project-phase') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-project-phase. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  if (materializationPlan) {
    failures.push('database-design no deberia devolver materializationPlan en este bloque.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en database-design.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'database-design') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser database-design.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('database-design deberia quedar executableNow cuando backend-contracts ya está done.')
    }
    if (phaseSummary.targetStrategy !== 'materialize-project-phase-plan') {
      failures.push('database-design deberia apuntar a materialize-project-phase-plan cuando está desbloqueada.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runBlockedDatabaseDesignMaterializationValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-database-blocked',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-database-blocked-frontend',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeDatabaseDesignBlocked
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-project-phase') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-project-phase. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (materializationPlan) {
    failures.push('database-design no deberia devolver materializationPlan si backend-contracts sigue pendiente.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en database-design bloqueada.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'database-design') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser database-design.')
    }
    if (phaseSummary.executableNow) {
      failures.push('database-design no deberia quedar executableNow si backend-contracts no está done.')
    }
    if (phaseSummary.prerequisitePhaseId !== 'backend-contracts') {
      failures.push('database-design deberia declarar backend-contracts como prerequisitePhaseId.')
    }
    if (
      !phaseSummary.blockers.some((entry) =>
        entry.toLocaleLowerCase().includes('backend-contracts'),
      )
    ) {
      failures.push('database-design deberia exponer un blocker claro apuntando a backend-contracts.')
    }
  }

  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en database-design bloqueada.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (!nextActionSummary.reason.toLocaleLowerCase().includes('backend-contracts')) {
      failures.push('nextActionPlan.reason deberia mencionar backend-contracts como prerequisito.')
    }
    if (!nextActionSummary.userFacingLabel.toLocaleLowerCase().includes('backend contracts')) {
      failures.push('nextActionPlan.userFacingLabel deberia recomendar completar backend contracts.')
    }
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en database-design bloqueada.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    if (manifestSummary.nextRecommendedPhase !== 'backend-contracts') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia seguir apuntando a backend-contracts.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runMaterializeDatabaseDesignValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-database-materialization',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-database-materialization-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-database-materialization-backend',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeDatabaseDesign
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const phaseExpansionPlan =
    decision?.phaseExpansionPlan && typeof decision.phaseExpansionPlan === 'object'
      ? decision.phaseExpansionPlan
      : null
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    24,
  ).map(normalizePathForComparison)

  if (strategy !== 'materialize-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: materialize-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'executor') {
    failures.push(
      `executionMode incorrecto. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'execute-plan') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  const expectedTargets = [
    `${fixture.projectRootRelativePath}/database/schema.sql`,
    `${fixture.projectRootRelativePath}/database/seeds/seed-local.sql`,
    `${fixture.projectRootRelativePath}/database/README.md`,
    `${fixture.projectRootRelativePath}/docs/architecture.md`,
    `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
    `${fixture.projectRootRelativePath}/jefe-project.json`,
  ].map(normalizePathForComparison)

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en materialize database-design.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'database-design') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser database-design.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('database-design deberia estar marcado como executableNow en la materializacion.')
    }
  }

  if (!materializationPlan) {
    failures.push('materializationPlan ausente en materialize database-design.')
  } else {
    if (String(materializationPlan.strategy || '').trim() !== 'materialize-project-phase-plan') {
      failures.push('materializationPlan.strategy incorrecto para database-design.')
    }
    const operationTargets = toStringArray(
      materializationPlan.operations?.map((entry) => entry?.targetPath || ''),
      24,
    ).map(normalizePathForComparison)
    expectedTargets.forEach((targetPath) => {
      if (!operationTargets.includes(targetPath)) {
        failures.push(`materializationPlan.operations no incluye ${targetPath}.`)
      }
    })
    if (
      operationTargets.some((targetPath) =>
        /frontend\/|backend\/|shared\/|scripts\/|node_modules|\.env$|docker|deploy/i.test(
          targetPath,
        ),
      )
    ) {
      failures.push('materializationPlan.operations no deberia tocar frontend, backend, shared, scripts, node_modules, .env, docker ni deploy.')
    }
  }

  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })
  if (
    allowedTargetPaths.some((targetPath) =>
      /frontend\/|backend\/|shared\/|scripts\/|node_modules|\.env$|docker|deploy/i.test(
        targetPath,
      ),
    )
  ) {
    failures.push('allowedTargetPaths no deberia incluir frontend, backend, shared, scripts, node_modules, .env, docker ni deploy.')
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en materialize database-design.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    const databasePhase = manifestSummary.phases.find(
      (entry) => entry.id === 'database-design',
    )
    const validationPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'local-validation',
    )
    if (manifestSummary.nextRecommendedPhase !== 'local-validation') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia avanzar a local-validation.')
    }
    if (!databasePhase || databasePhase.status !== 'done') {
      failures.push('localProjectManifest deberia marcar database-design como done.')
    }
    if (!validationPhase || validationPhase.status !== 'available') {
      failures.push('localProjectManifest deberia mantener local-validation como available.')
    }
  }

  if (!phaseExpansionPlan) {
    failures.push('phaseExpansionPlan ausente en materialize database-design.')
  } else {
    const expansionSummary = summarizePhaseExpansionPlan(phaseExpansionPlan)
    if (expansionSummary.phaseId !== 'local-validation') {
      failures.push('phaseExpansionPlan deberia proponer local-validation como siguiente fase.')
    }
    if (expansionSummary.executableNow) {
      failures.push('phaseExpansionPlan no deberia materializar local-validation automaticamente.')
    }
  }

  if (materializationPlan) {
    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath: fixture.workspacePath,
      requestId: 'smoke-database-design-materialization',
      instruction: decision?.instruction || '',
      brainStrategy: decision?.strategy || '',
      businessSector: decision?.businessSector || '',
      businessSectorLabel: decision?.businessSectorLabel || '',
      creativeDirection: decision?.creativeDirection || null,
      reusableArtifactLookup: decision?.reusableArtifactLookup || null,
      reusableArtifactsFound: decision?.reusableArtifactsFound || 0,
      reuseDecision: decision?.reuseDecision === true,
      reuseReason: decision?.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision?.reusedArtifactIds)
        ? decision.reusedArtifactIds
        : [],
      reuseMode: decision?.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision?.materializationPlanSource || 'planner',
    })

    if (!task) {
      failures.push('No se pudo construir la tarea local deterministica para database-design.')
    } else {
      const beforeSnapshot = {
        frontendMain: fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'main.js'),
          'utf8',
        ),
        backendModule: fs.readFileSync(
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          'utf8',
        ),
        sharedDomain: fs.readFileSync(
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          'utf8',
        ),
        scriptsReadme: fs.readFileSync(
          path.join(fixture.projectRootPath, 'scripts', 'README.md'),
          'utf8',
        ),
      }
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok !== true) {
        failures.push(
          executionResult?.error ||
            'La materializacion local de database-design no termino en OK.',
        )
      } else {
        const touchedPaths = toStringArray(executionResult?.details?.touchedPaths, 32).map(
          normalizePathForComparison,
        )
        const manifestPath = path.join(
          fixture.workspacePath,
          fixture.projectRootRelativePath,
          'jefe-project.json',
        )
        const manifestFromDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const manifestFromDiskSummary = summarizeLocalProjectManifest(manifestFromDisk)
        const databasePhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'database-design',
        )
        const validationPhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'local-validation',
        )

        expectedTargets.forEach((targetPath) => {
          if (
            !touchedPaths.some((entry) =>
              entry.endsWith(normalizePathForComparison(targetPath)),
            )
          ) {
            failures.push(`La ejecucion real de database-design deberia tocar ${targetPath}.`)
          }
        })

        if (manifestFromDiskSummary.nextRecommendedPhase !== 'local-validation') {
          failures.push(
            'El jefe-project.json resultante deberia actualizar nextRecommendedPhase a local-validation.',
          )
        }
        if (!databasePhase || databasePhase.status !== 'done') {
          failures.push(
            'El jefe-project.json resultante deberia marcar database-design como done.',
          )
        }
        if (!validationPhase || validationPhase.status !== 'available') {
          failures.push(
            'El jefe-project.json resultante deberia mantener local-validation como available.',
          )
        }

        const frontendAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'main.js'),
          'utf8',
        )
        const backendAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          'utf8',
        )
        const sharedAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          'utf8',
        )
        const scriptsAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'scripts', 'README.md'),
          'utf8',
        )
        if (frontendAfter !== beforeSnapshot.frontendMain) {
          failures.push('database-design no deberia tocar frontend/src/main.js.')
        }
        if (backendAfter !== beforeSnapshot.backendModule) {
          failures.push('database-design no deberia tocar backend/src/modules/appointments.js.')
        }
        if (sharedAfter !== beforeSnapshot.sharedDomain) {
          failures.push('database-design no deberia tocar shared/contracts/domain.js.')
        }
        if (scriptsAfter !== beforeSnapshot.scriptsReadme) {
          failures.push('database-design no deberia tocar scripts/README.md.')
        }
      }
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runPrepareLocalValidationValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-local-validation-ready',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-local-validation-ready-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-local-validation-ready-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-local-validation-ready-database',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareLocalValidation
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-project-phase') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-project-phase. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (materializationPlan) {
    failures.push('local-validation no deberia devolver materializationPlan en prepare.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en local-validation.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'local-validation') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser local-validation.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('local-validation deberia quedar executableNow cuando database-design ya esta done.')
    }
    if (phaseSummary.targetStrategy !== 'materialize-project-phase-plan') {
      failures.push('local-validation deberia apuntar a materialize-project-phase-plan cuando esta desbloqueada.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runBlockedLocalValidationMaterializationValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-local-validation-blocked',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-local-validation-blocked-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-local-validation-blocked-backend',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeLocalValidationBlocked
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-project-phase') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-project-phase. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (materializationPlan) {
    failures.push('local-validation no deberia devolver materializationPlan si database-design sigue pendiente.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en local-validation bloqueada.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'local-validation') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser local-validation.')
    }
    if (phaseSummary.executableNow) {
      failures.push('local-validation no deberia quedar executableNow si database-design no esta done.')
    }
    if (phaseSummary.prerequisitePhaseId !== 'database-design') {
      failures.push('local-validation deberia declarar database-design como prerequisitePhaseId.')
    }
    if (
      !phaseSummary.blockers.some((entry) =>
        entry.toLocaleLowerCase().includes('database-design'),
      )
    ) {
      failures.push('local-validation deberia exponer un blocker claro apuntando a database-design.')
    }
  }

  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en local-validation bloqueada.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (!nextActionSummary.reason.toLocaleLowerCase().includes('database-design')) {
      failures.push('nextActionPlan.reason deberia mencionar database-design como prerequisito.')
    }
    if (!nextActionSummary.userFacingLabel.toLocaleLowerCase().includes('database design')) {
      failures.push('nextActionPlan.userFacingLabel deberia recomendar completar database design.')
    }
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en local-validation bloqueada.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    if (manifestSummary.nextRecommendedPhase !== 'database-design') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia seguir apuntando a database-design.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runMaterializeLocalValidationValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-local-validation-materialization',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-local-validation-materialization-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-local-validation-materialization-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-local-validation-materialization-database',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeLocalValidation
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const phaseExpansionPlan =
    decision?.phaseExpansionPlan && typeof decision.phaseExpansionPlan === 'object'
      ? decision.phaseExpansionPlan
      : null
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    24,
  ).map(normalizePathForComparison)

  if (strategy !== 'materialize-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: materialize-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'executor') {
    failures.push(
      `executionMode incorrecto. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'execute-plan') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }

  const expectedTargets = [
    `${fixture.projectRootRelativePath}/docs/validation-report.md`,
    `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
    `${fixture.projectRootRelativePath}/jefe-project.json`,
  ].map(normalizePathForComparison)

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en materialize local-validation.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'local-validation') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser local-validation.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('local-validation deberia estar marcado como executableNow en la materializacion.')
    }
  }

  if (!materializationPlan) {
    failures.push('materializationPlan ausente en materialize local-validation.')
  } else {
    if (String(materializationPlan.strategy || '').trim() !== 'materialize-project-phase-plan') {
      failures.push('materializationPlan.strategy incorrecto para local-validation.')
    }
    const operationTargets = toStringArray(
      materializationPlan.operations?.map((entry) => entry?.targetPath || ''),
      24,
    ).map(normalizePathForComparison)
    expectedTargets.forEach((targetPath) => {
      if (!operationTargets.includes(targetPath)) {
        failures.push(`materializationPlan.operations no incluye ${targetPath}.`)
      }
    })
    if (
      operationTargets.some((targetPath) =>
        /frontend\/|backend\/|shared\/|database\/|scripts\/|node_modules|\.env$|docker|deploy/i.test(
          targetPath,
        ),
      )
    ) {
      failures.push('materializationPlan.operations no deberia tocar frontend, backend, shared, database, scripts, node_modules, .env, docker ni deploy.')
    }
  }

  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })
  if (
    allowedTargetPaths.some((targetPath) =>
      /frontend\/|backend\/|shared\/|database\/|scripts\/|node_modules|\.env$|docker|deploy/i.test(
        targetPath,
      ),
    )
  ) {
    failures.push('allowedTargetPaths no deberia incluir frontend, backend, shared, database, scripts, node_modules, .env, docker ni deploy.')
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en materialize local-validation.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    const localValidationPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'local-validation',
    )
    const reviewPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'review-and-expand',
    )
    if (manifestSummary.nextRecommendedPhase !== 'review-and-expand') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia avanzar a review-and-expand.')
    }
    if (!localValidationPhase || localValidationPhase.status !== 'done') {
      failures.push('localProjectManifest deberia marcar local-validation como done.')
    }
    if (!reviewPhase || reviewPhase.status !== 'available') {
      failures.push('localProjectManifest deberia mantener review-and-expand como available.')
    }
  }

  if (!phaseExpansionPlan) {
    failures.push('phaseExpansionPlan ausente en materialize local-validation.')
  } else {
    const expansionSummary = summarizePhaseExpansionPlan(phaseExpansionPlan)
    if (expansionSummary.phaseId !== 'review-and-expand') {
      failures.push('phaseExpansionPlan deberia proponer review-and-expand como siguiente fase.')
    }
    if (expansionSummary.executableNow) {
      failures.push('phaseExpansionPlan no deberia materializar review-and-expand automaticamente.')
    }
  }

  if (materializationPlan) {
    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath: fixture.workspacePath,
      requestId: 'smoke-local-validation-materialization',
      instruction: decision?.instruction || '',
      brainStrategy: decision?.strategy || '',
      businessSector: decision?.businessSector || '',
      businessSectorLabel: decision?.businessSectorLabel || '',
      creativeDirection: decision?.creativeDirection || null,
      reusableArtifactLookup: decision?.reusableArtifactLookup || null,
      reusableArtifactsFound: decision?.reusableArtifactsFound || 0,
      reuseDecision: decision?.reuseDecision === true,
      reuseReason: decision?.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision?.reusedArtifactIds)
        ? decision.reusedArtifactIds
        : [],
      reuseMode: decision?.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision?.materializationPlanSource || 'planner',
    })

    if (!task) {
      failures.push('No se pudo construir la tarea local deterministica para local-validation.')
    } else {
      const beforeSnapshot = {
        frontendMain: fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'main.js'),
          'utf8',
        ),
        backendModule: fs.readFileSync(
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          'utf8',
        ),
        sharedDomain: fs.readFileSync(
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          'utf8',
        ),
        databaseSchema: fs.readFileSync(
          path.join(fixture.projectRootPath, 'database', 'schema.sql'),
          'utf8',
        ),
        scriptsReadme: fs.readFileSync(
          path.join(fixture.projectRootPath, 'scripts', 'README.md'),
          'utf8',
        ),
      }
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok !== true) {
        failures.push(
          executionResult?.error ||
            'La materializacion local de local-validation no termino en OK.',
        )
      } else {
        const touchedPaths = toStringArray(executionResult?.details?.touchedPaths, 32).map(
          normalizePathForComparison,
        )
        const manifestPath = path.join(
          fixture.workspacePath,
          fixture.projectRootRelativePath,
          'jefe-project.json',
        )
        const validationReportPath = path.join(
          fixture.workspacePath,
          fixture.projectRootRelativePath,
          'docs',
          'validation-report.md',
        )
        const runbookPath = path.join(
          fixture.workspacePath,
          fixture.projectRootRelativePath,
          'docs',
          'local-runbook.md',
        )
        const manifestFromDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const manifestFromDiskSummary = summarizeLocalProjectManifest(manifestFromDisk)
        const localValidationPhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'local-validation',
        )
        const reviewPhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'review-and-expand',
        )
        const validationReportContent = fs.readFileSync(validationReportPath, 'utf8')
        const runbookContent = fs.readFileSync(runbookPath, 'utf8')

        expectedTargets.forEach((targetPath) => {
          if (
            !touchedPaths.some((entry) =>
              entry.endsWith(normalizePathForComparison(targetPath)),
            )
          ) {
            failures.push(`La ejecucion real de local-validation deberia tocar ${targetPath}.`)
          }
        })

        if (manifestFromDiskSummary.nextRecommendedPhase !== 'review-and-expand') {
          failures.push(
            'El jefe-project.json resultante deberia actualizar nextRecommendedPhase a review-and-expand.',
          )
        }
        if (!localValidationPhase || localValidationPhase.status !== 'done') {
          failures.push(
            'El jefe-project.json resultante deberia marcar local-validation como done.',
          )
        }
        if (!reviewPhase || reviewPhase.status !== 'available') {
          failures.push(
            'El jefe-project.json resultante deberia mantener review-and-expand como available.',
          )
        }
        if (!validationReportContent.includes('Validacion local del proyecto')) {
          failures.push('validation-report.md deberia incluir el titulo principal de validacion local.')
        }
        if (!validationReportContent.includes('no se ejecuto base de datos')) {
          failures.push('validation-report.md deberia aclarar que no se ejecuto base de datos.')
        }
        if (!validationReportContent.includes('no se levanto backend')) {
          failures.push('validation-report.md deberia aclarar que no se levanto backend.')
        }
        if (!validationReportContent.includes('no se instalaron dependencias')) {
          failures.push('validation-report.md deberia aclarar que no se instalaron dependencias.')
        }
        if (!validationReportContent.includes('review-and-expand')) {
          failures.push('validation-report.md deberia mencionar review-and-expand como siguiente paso.')
        }
        if (!runbookContent.includes('local-validation')) {
          failures.push('docs/local-runbook.md deberia incluir la fase local-validation.')
        }

        const frontendAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'main.js'),
          'utf8',
        )
        const backendAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          'utf8',
        )
        const sharedAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          'utf8',
        )
        const databaseAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'database', 'schema.sql'),
          'utf8',
        )
        const scriptsAfter = fs.readFileSync(
          path.join(fixture.projectRootPath, 'scripts', 'README.md'),
          'utf8',
        )
        if (frontendAfter !== beforeSnapshot.frontendMain) {
          failures.push('local-validation no deberia tocar frontend/src/main.js.')
        }
        if (backendAfter !== beforeSnapshot.backendModule) {
          failures.push('local-validation no deberia tocar backend/src/modules/appointments.js.')
        }
        if (sharedAfter !== beforeSnapshot.sharedDomain) {
          failures.push('local-validation no deberia tocar shared/contracts/domain.js.')
        }
        if (databaseAfter !== beforeSnapshot.databaseSchema) {
          failures.push('local-validation no deberia tocar database/schema.sql.')
        }
        if (scriptsAfter !== beforeSnapshot.scriptsReadme) {
          failures.push('local-validation no deberia tocar scripts/README.md.')
        }

        ;[
          path.join(fixture.projectRootPath, 'backend', 'src', 'server.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', 'health.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'lib', 'response.js'),
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          path.join(fixture.projectRootPath, 'shared', 'types', 'contracts.js'),
          path.join(fixture.projectRootPath, 'scripts', 'seed-local.js'),
        ].forEach((filePath) => {
          execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' })
        })
      }
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runPrepareReviewAndExpandValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-phase-review-expand-ready',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-review-expand-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-review-expand-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-review-expand-database',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: 'smoke-review-expand-local-validation',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareReviewAndExpand
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null
  const expansionOptions =
    decision?.expansionOptions && typeof decision.expansionOptions === 'object'
      ? decision.expansionOptions
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-project-phase-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-project-phase') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-project-phase. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (materializationPlan) {
    failures.push('review-and-expand no deberia devolver materializationPlan.')
  }

  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente en review-and-expand.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'review-and-expand') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser review-and-expand.')
    }
    if (phaseSummary.executableNow) {
      failures.push('review-and-expand deberia seguir planner-only y no executableNow.')
    }
  }

  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en review-and-expand.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (nextActionSummary.actionType !== 'review-plan') {
      failures.push('review-and-expand deberia recomendar review-plan.')
    }
  }

  if (!expansionOptions) {
    failures.push('expansionOptions ausente en review-and-expand.')
  } else {
    const optionsSummary = summarizeExpansionOptions(expansionOptions)
    if (optionsSummary.recommendedOptionId !== 'notifications') {
      failures.push('review-and-expand deberia recomendar notifications como primera expansion segura.')
    }
    ;['notifications', 'reports', 'inventory'].forEach((moduleId) => {
      if (
        !optionsSummary.options.some(
          (entry) =>
            entry.id === moduleId &&
            entry.safeToMaterialize &&
            entry.targetStrategy === 'materialize-module-expansion-plan',
        )
      ) {
        failures.push(`review-and-expand deberia exponer ${moduleId} como opcion materializable segura.`)
      }
    })
    const billingOption = optionsSummary.options.find((entry) => entry.id === 'billing')
    if (!billingOption || billingOption.safeToMaterialize) {
      failures.push('review-and-expand deberia exponer billing como planner-only y no materializable.')
    }
    const authOption = optionsSummary.options.find((entry) => entry.id === 'auth')
    if (!authOption || authOption.requiresApproval !== true) {
      failures.push('review-and-expand deberia marcar auth como requiresApproval.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runPrepareModuleExpansionValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-module-expansion-ready',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-module-expansion-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-module-expansion-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-module-expansion-database',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: 'smoke-module-expansion-validation',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareModuleExpansion
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null

  if (strategy !== 'prepare-module-expansion-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-module-expansion-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-module-expansion') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-module-expansion. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (materializationPlan) {
    failures.push('prepare-module-expansion-plan no deberia devolver materializationPlan.')
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente en prepare-module-expansion-plan.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (moduleSummary.moduleId !== 'notifications') {
      failures.push('moduleExpansionPlan.moduleId deberia ser notifications.')
    }
    if (!moduleSummary.safeToMaterialize) {
      failures.push('notifications deberia quedar safeToMaterialize en prepare-module-expansion-plan.')
    }
    ;['frontend', 'backend', 'shared', 'database', 'docs', 'manifest'].forEach((layer) => {
      if (!moduleSummary.affectedLayers.includes(layer)) {
        failures.push(`moduleExpansionPlan deberia incluir la capa ${layer}.`)
      }
    })
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runPrepareUnsupportedModuleExpansionValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-module-expansion-unsupported-ready',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-module-unsupported-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-module-unsupported-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-module-unsupported-database',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: 'smoke-module-unsupported-validation',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareUnsupportedModuleExpansion
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null

  if (strategy !== 'prepare-module-expansion-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: prepare-module-expansion-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-module-expansion') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-module-expansion. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (materializationPlan) {
    failures.push('Un modulo no soportado no deberia devolver materializationPlan.')
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente en el caso de modulo no soportado.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (!['facturacion', 'billing'].includes(moduleSummary.moduleId)) {
      failures.push('moduleExpansionPlan.moduleId deberia normalizarse como facturacion o billing.')
    }
    if (!moduleSummary.safeToPrepare) {
      failures.push('Un modulo no soportado deberia poder prepararse como plan revisable.')
    }
    if (moduleSummary.safeToMaterialize) {
      failures.push('Un modulo no soportado no deberia quedar materializable.')
    }
    if (
      !moduleSummary.blockers.some(
        (entry) =>
          entry.toLocaleLowerCase().includes('materializador seguro') ||
          entry.toLocaleLowerCase().includes('revisarlo manualmente'),
      ) &&
      !moduleSummary.reason.toLocaleLowerCase().includes('materializador seguro')
    ) {
      failures.push(
        'El caso no soportado deberia explicar que todavia no existe un materializador seguro.',
      )
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runMaterializeModuleExpansionValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-module-expansion-materialization',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-module-materialization-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-module-materialization-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-module-materialization-database',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: 'smoke-module-materialization-validation',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeModuleExpansion
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest &&
    typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    32,
  ).map(normalizePathForComparison)
  const expectedTargets = [
    `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
    `${fixture.projectRootRelativePath}/frontend/src/components/App.js`,
    `${fixture.projectRootRelativePath}/frontend/src/styles.css`,
    `${fixture.projectRootRelativePath}/backend/src/modules/notifications.js`,
    `${fixture.projectRootRelativePath}/backend/src/routes/notifications.js`,
    `${fixture.projectRootRelativePath}/shared/contracts/domain.js`,
    `${fixture.projectRootRelativePath}/shared/types/contracts.js`,
    `${fixture.projectRootRelativePath}/database/schema.sql`,
    `${fixture.projectRootRelativePath}/database/seeds/seed-local.sql`,
    `${fixture.projectRootRelativePath}/docs/architecture.md`,
    `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
    `${fixture.projectRootRelativePath}/docs/validation-report.md`,
    `${fixture.projectRootRelativePath}/jefe-project.json`,
  ].map(normalizePathForComparison)

  if (strategy !== 'materialize-module-expansion-plan') {
    failures.push(
      `Estrategia incorrecta. Esperado: materialize-module-expansion-plan. Recibido: ${strategy || '(vacia)'}.`,
    )
  }
  if (executionMode !== 'executor') {
    failures.push(
      `executionMode incorrecto. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'execute-plan') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente en materialize-module-expansion-plan.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (moduleSummary.moduleId !== 'notifications') {
      failures.push('moduleExpansionPlan.moduleId deberia ser notifications.')
    }
    if (!moduleSummary.safeToMaterialize) {
      failures.push('moduleExpansionPlan deberia quedar materializable en el caso positivo.')
    }
  }
  if (!materializationPlan) {
    failures.push('materializationPlan ausente en materialize-module-expansion-plan.')
  }
  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })
  if (
    allowedTargetPaths.some((targetPath) =>
      /package\.json$|node_modules|\.env$|docker|deploy/i.test(targetPath),
    )
  ) {
    failures.push('allowedTargetPaths no deberia incluir package.json, node_modules, .env, docker ni deploy.')
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en materialize-module-expansion-plan.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    const moduleEntry = manifestSummary.modules.find((entry) => entry.id === 'notifications')
    const phaseEntry = manifestSummary.phases.find(
      (entry) => entry.id === 'module-expansion-notifications',
    )
    if (manifestSummary.nextRecommendedPhase !== 'review-and-expand') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia volver a review-and-expand.')
    }
    if (!moduleEntry || moduleEntry.status !== 'done') {
      failures.push('localProjectManifest deberia registrar notifications como modulo done.')
    }
    if (!phaseEntry || phaseEntry.status !== 'done') {
      failures.push('localProjectManifest deberia registrar module-expansion-notifications como done.')
    }
  }

  if (materializationPlan) {
    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath: fixture.workspacePath,
      requestId: 'smoke-module-expansion-materialization',
      instruction: decision.instruction || '',
      brainStrategy: decision.strategy || '',
      businessSector: decision.businessSector || '',
      businessSectorLabel: decision.businessSectorLabel || '',
      creativeDirection: decision.creativeDirection || null,
      reusableArtifactLookup: decision.reusableArtifactLookup || null,
      reusableArtifactsFound: decision.reusableArtifactsFound || 0,
      reuseDecision: decision.reuseDecision === true,
      reuseReason: decision.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision.reusedArtifactIds)
        ? decision.reusedArtifactIds
        : [],
      reuseMode: decision.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision.materializationPlanSource || 'planner',
    })

    if (!task) {
      failures.push('No se pudo construir la tarea local deterministica del modulo notifications.')
    } else {
      const beforeSnapshot = {
        packageJson: fs.readFileSync(path.join(fixture.projectRootPath, 'package.json'), 'utf8'),
        scriptsReadme: fs.readFileSync(path.join(fixture.projectRootPath, 'scripts', 'README.md'), 'utf8'),
      }
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok !== true) {
        failures.push(
          executionResult?.error ||
            'La materializacion local del modulo notifications no termino en OK.',
        )
      } else {
        const touchedPaths = toStringArray(executionResult?.details?.touchedPaths, 40).map(
          normalizePathForComparison,
        )
        expectedTargets.forEach((targetPath) => {
          if (!touchedPaths.some((entry) => entry.endsWith(targetPath))) {
            failures.push(`La ejecucion real del modulo notifications deberia tocar ${targetPath}.`)
          }
        })

        const manifestFromDisk = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'))
        const manifestSummary = summarizeLocalProjectManifest(manifestFromDisk)
        const moduleEntry = manifestSummary.modules.find((entry) => entry.id === 'notifications')
        if (!moduleEntry || moduleEntry.status !== 'done') {
          failures.push('El manifest en disco deberia registrar notifications como done.')
        }
        if (manifestSummary.nextRecommendedPhase !== 'review-and-expand') {
          failures.push('El manifest en disco deberia volver a review-and-expand.')
        }
        if (
          fs.readFileSync(path.join(fixture.projectRootPath, 'package.json'), 'utf8') !==
          beforeSnapshot.packageJson
        ) {
          failures.push('module-expansion-notifications no deberia tocar package.json.')
        }
        if (
          fs.readFileSync(path.join(fixture.projectRootPath, 'scripts', 'README.md'), 'utf8') !==
          beforeSnapshot.scriptsReadme
        ) {
          failures.push('module-expansion-notifications no deberia tocar scripts/README.md.')
        }

        ;[
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'notifications.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', 'notifications.js'),
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          path.join(fixture.projectRootPath, 'shared', 'types', 'contracts.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'server.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', 'health.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'lib', 'response.js'),
          path.join(fixture.projectRootPath, 'scripts', 'seed-local.js'),
        ].forEach((filePath) => {
          execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' })
        })
      }
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runMaterializeUnsupportedModuleExpansionValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-module-expansion-unsupported-materialization',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-module-unsupported-materialization-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-module-unsupported-materialization-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-module-unsupported-materialization-database',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: 'smoke-module-unsupported-materialization-validation',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeUnsupportedModuleExpansion
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null

  if (strategy !== 'prepare-module-expansion-plan') {
    failures.push('Materializar un modulo no soportado deberia volver a prepare-module-expansion-plan.')
  }
  if (executionMode !== 'planner-only') {
    failures.push('Materializar un modulo no soportado no deberia caer en executor.')
  }
  if (nextExpectedAction !== 'review-module-expansion') {
    failures.push('Materializar un modulo no soportado deberia volver a review-module-expansion.')
  }
  if (materializationPlan) {
    failures.push('Un modulo no soportado no deberia devolver materializationPlan.')
  }
  if (executionScope) {
    failures.push('Un modulo no soportado no deberia devolver executionScope ejecutable.')
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente al pedir materializar un modulo no soportado.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (moduleSummary.safeToMaterialize) {
      failures.push('Un modulo no soportado no deberia prometer materializacion inmediata.')
    }
    if (
      !moduleSummary.blockers.some(
        (entry) =>
          entry.toLocaleLowerCase().includes('materializador seguro') ||
          entry.toLocaleLowerCase().includes('revisarlo manualmente'),
      ) &&
      !moduleSummary.reason.toLocaleLowerCase().includes('materializador seguro')
    ) {
      failures.push(
        'El fallback de modulo no soportado deberia explicar que falta un materializador seguro.',
      )
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runDuplicateModuleExpansionValidation() {
  let fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-module-expansion-duplicate',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'frontend-mock-flow',
    requestId: 'smoke-module-duplicate-frontend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'backend-contracts',
    requestId: 'smoke-module-duplicate-backend',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'database-design',
    requestId: 'smoke-module-duplicate-database',
  })
  fixture = await materializePhaseOnFixture({
    fixture,
    phaseId: 'local-validation',
    requestId: 'smoke-module-duplicate-validation',
  })
  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel: 'notificaciones',
    requestId: 'smoke-module-duplicate-first-materialization',
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.materializeDuplicateModuleExpansion
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null

  if (strategy !== 'prepare-module-expansion-plan') {
    failures.push('Un modulo duplicado deberia volver a prepare-module-expansion-plan.')
  }
  if (executionMode !== 'planner-only') {
    failures.push('Un modulo duplicado no deberia caer en executor.')
  }
  if (materializationPlan) {
    failures.push('Un modulo duplicado no deberia devolver materializationPlan para recrearse.')
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente en el caso duplicado.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (moduleSummary.safeToMaterialize) {
      failures.push('Un modulo duplicado no deberia quedar materializable.')
    }
    if (
      !moduleSummary.blockers.some((entry) =>
        entry.toLocaleLowerCase().includes('ya existe'),
      )
    ) {
      failures.push('El caso duplicado deberia exponer un blocker claro indicando que el modulo ya existe.')
    }
  }
  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en el caso duplicado.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (nextActionSummary.actionType !== 'review-plan') {
      failures.push('El caso duplicado deberia recomendar review-plan.')
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runPrepareSpecificModuleExpansionValidation({
  testCase,
  workspaceName,
  expectedModuleIds,
  expectMaterializable,
  expectApproval = false,
}) {
  const fixture = await buildModuleExpansionReadyFixture(workspaceName)
  const reusablePlanningContext = buildReusablePlanningContext()
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null

  if (strategy !== 'prepare-module-expansion-plan') {
    failures.push(`Estrategia incorrecta. Esperado: prepare-module-expansion-plan. Recibido: ${strategy || '(vacia)'}.`)
  }
  if (executionMode !== 'planner-only') {
    failures.push(`executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`)
  }
  if (nextExpectedAction !== 'review-module-expansion') {
    failures.push(`nextExpectedAction incorrecto. Esperado: review-module-expansion. Recibido: ${nextExpectedAction || '(vacio)'}.`)
  }
  if (materializationPlan) {
    failures.push('prepare-module-expansion-plan no deberia devolver materializationPlan.')
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente en prepare-module-expansion-plan.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (!expectedModuleIds.includes(moduleSummary.moduleId)) {
      failures.push(`moduleExpansionPlan.moduleId deberia ser ${expectedModuleIds.join(' o ')}.`)
    }
    if (moduleSummary.safeToMaterialize !== expectMaterializable) {
      failures.push(`safeToMaterialize inesperado para ${moduleSummary.moduleId}.`)
    }
    if (moduleSummary.approvalRequired !== expectApproval) {
      failures.push(`approvalRequired inesperado para ${moduleSummary.moduleId}.`)
    }
  }

  return { testCase, ok: failures.length === 0, failures, strategy, executionMode, nextExpectedAction }
}

async function runMaterializeSpecificModuleExpansionValidation({
  testCase,
  workspaceName,
  moduleId,
  moduleLabel,
}) {
  const fixture = await buildModuleExpansionReadyFixture(workspaceName)
  const reusablePlanningContext = buildReusablePlanningContext()
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null
  const localProjectManifest =
    decision?.localProjectManifest && typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const allowedTargetPaths = summarizeUniqueStrings(executionScope?.allowedTargetPaths, 32).map(
    normalizePathForComparison,
  )
  const expectedTargets = buildExpectedModuleTargets(fixture, moduleId)
  const markers = buildModuleValidationMarkers(moduleId)

  if (strategy !== 'materialize-module-expansion-plan') {
    failures.push(`Estrategia incorrecta. Esperado: materialize-module-expansion-plan. Recibido: ${strategy || '(vacia)'}.`)
  }
  if (executionMode !== 'executor') {
    failures.push(`executionMode incorrecto. Esperado: executor. Recibido: ${executionMode || '(vacio)'}.`)
  }
  if (nextExpectedAction !== 'execute-plan') {
    failures.push(`nextExpectedAction incorrecto. Esperado: execute-plan. Recibido: ${nextExpectedAction || '(vacio)'}.`)
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente en materialize-module-expansion-plan.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (moduleSummary.moduleId !== moduleId) {
      failures.push(`moduleExpansionPlan.moduleId deberia ser ${moduleId}.`)
    }
    if (!moduleSummary.safeToMaterialize) {
      failures.push(`moduleExpansionPlan deberia quedar materializable para ${moduleId}.`)
    }
  }
  if (!materializationPlan) {
    failures.push('materializationPlan ausente en materialize-module-expansion-plan.')
  }
  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })
  if (
    allowedTargetPaths.some((targetPath) =>
      /package\\.json$|node_modules|\\.env$|docker|deploy/i.test(targetPath),
    )
  ) {
    failures.push('allowedTargetPaths no deberia incluir package.json, node_modules, .env, docker ni deploy.')
  }
  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en materialize-module-expansion-plan.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    const moduleEntry = manifestSummary.modules.find((entry) => entry.id === moduleId)
    const phaseEntry = manifestSummary.phases.find((entry) => entry.id === `module-expansion-${moduleId}`)
    if (manifestSummary.nextRecommendedPhase !== 'review-and-expand') {
      failures.push('localProjectManifest.nextRecommendedPhase deberia volver a review-and-expand.')
    }
    if (!moduleEntry || moduleEntry.status !== 'done') {
      failures.push(`localProjectManifest deberia registrar ${moduleId} como modulo done.`)
    }
    if (!phaseEntry || phaseEntry.status !== 'done') {
      failures.push(`localProjectManifest deberia registrar module-expansion-${moduleId} como done.`)
    }
  }

  if (materializationPlan) {
    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath: fixture.workspacePath,
      requestId: `smoke-module-expansion-${moduleId}-materialization`,
      instruction: decision.instruction || '',
      brainStrategy: decision.strategy || '',
      businessSector: decision.businessSector || '',
      businessSectorLabel: decision.businessSectorLabel || '',
      creativeDirection: decision.creativeDirection || null,
      reusableArtifactLookup: decision.reusableArtifactLookup || null,
      reusableArtifactsFound: decision.reusableArtifactsFound || 0,
      reuseDecision: decision.reuseDecision === true,
      reuseReason: decision.reuseReason || '',
      reusedArtifactIds: Array.isArray(decision.reusedArtifactIds) ? decision.reusedArtifactIds : [],
      reuseMode: decision.reuseMode || 'none',
      reuseMaterialization: null,
      materializationPlanSource: decision.materializationPlanSource || 'planner',
    })

    if (!task) {
      failures.push(`No se pudo construir la tarea local deterministica del modulo ${moduleLabel}.`)
    } else {
      const beforeSnapshot = {
        packageJson: fs.readFileSync(path.join(fixture.projectRootPath, 'package.json'), 'utf8'),
        scriptsReadme: fs.readFileSync(path.join(fixture.projectRootPath, 'scripts', 'README.md'), 'utf8'),
      }
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok !== true) {
        failures.push(executionResult?.error || `La materializacion local del modulo ${moduleLabel} no termino en OK.`)
      } else {
        const touchedPaths = toStringArray(executionResult?.details?.touchedPaths, 40).map(
          normalizePathForComparison,
        )
        expectedTargets.forEach((targetPath) => {
          if (!touchedPaths.some((entry) => entry.endsWith(targetPath))) {
            failures.push(`La ejecucion real del modulo ${moduleId} deberia tocar ${targetPath}.`)
          }
        })

        const manifestFromDisk = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'))
        const manifestSummary = summarizeLocalProjectManifest(manifestFromDisk)
        const moduleEntry = manifestSummary.modules.find((entry) => entry.id === markers.manifestId)
        if (!moduleEntry || moduleEntry.status !== 'done') {
          failures.push(`El manifest en disco deberia registrar ${moduleId} como done.`)
        }
        if (manifestSummary.nextRecommendedPhase !== 'review-and-expand') {
          failures.push('El manifest en disco deberia volver a review-and-expand.')
        }
        if (fs.readFileSync(path.join(fixture.projectRootPath, 'package.json'), 'utf8') !== beforeSnapshot.packageJson) {
          failures.push(`module-expansion-${moduleId} no deberia tocar package.json.`)
        }
        if (fs.readFileSync(path.join(fixture.projectRootPath, 'scripts', 'README.md'), 'utf8') !== beforeSnapshot.scriptsReadme) {
          failures.push(`module-expansion-${moduleId} no deberia tocar scripts/README.md.`)
        }

        ;[
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', `${moduleId}.js`),
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', `${moduleId}.js`),
          path.join(fixture.projectRootPath, 'shared', 'contracts', 'domain.js'),
          path.join(fixture.projectRootPath, 'shared', 'types', 'contracts.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'server.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', 'health.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', 'appointments.js'),
          path.join(fixture.projectRootPath, 'backend', 'src', 'lib', 'response.js'),
          path.join(fixture.projectRootPath, 'scripts', 'seed-local.js'),
        ].forEach((filePath) => {
          execFileSync(process.execPath, ['--check', filePath], { stdio: 'pipe' })
        })

        const appContent = fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'components', 'App.js'),
          'utf8',
        )
        const moduleContent = fs.readFileSync(
          path.join(fixture.projectRootPath, 'backend', 'src', 'modules', `${moduleId}.js`),
          'utf8',
        )
        const routeContent = fs.readFileSync(
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', `${moduleId}.js`),
          'utf8',
        )
        if (!appContent.includes(markers.app)) {
          failures.push(`App.js deberia mencionar ${markers.app}.`)
        }
        if (!moduleContent.includes(markers.module)) {
          failures.push(`El modulo ${moduleId}.js deberia incluir ${markers.module}.`)
        }
        if (!routeContent.includes(markers.route)) {
          failures.push(`La ruta ${moduleId}.js deberia incluir ${markers.route}.`)
        }
      }
    }
  }

  return { testCase, ok: failures.length === 0, failures, strategy, executionMode, nextExpectedAction }
}

async function runDuplicateSpecificModuleExpansionValidation({
  testCase,
  workspaceName,
  moduleId,
  moduleLabel,
}) {
  let fixture = await buildModuleExpansionReadyFixture(workspaceName)
  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel,
    requestId: `${workspaceName}-first-materialization`,
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null

  if (strategy !== 'prepare-module-expansion-plan') {
    failures.push('Un modulo duplicado deberia volver a prepare-module-expansion-plan.')
  }
  if (executionMode !== 'planner-only') {
    failures.push('Un modulo duplicado no deberia caer en executor.')
  }
  if (materializationPlan) {
    failures.push('Un modulo duplicado no deberia devolver materializationPlan para recrearse.')
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente en el caso duplicado.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (moduleSummary.moduleId !== moduleId) {
      failures.push(`moduleExpansionPlan.moduleId deberia ser ${moduleId}.`)
    }
    if (moduleSummary.safeToMaterialize) {
      failures.push('Un modulo duplicado no deberia quedar materializable.')
    }
    if (!moduleSummary.blockers.some((entry) => entry.toLocaleLowerCase().includes('ya existe'))) {
      failures.push('El caso duplicado deberia exponer un blocker claro indicando que el modulo ya existe.')
    }
  }

  return { testCase, ok: failures.length === 0, failures, strategy, executionMode, nextExpectedAction: String(decision?.nextExpectedAction || '').trim() }
}

async function runBlockedMaterializeModuleExpansionValidation({
  testCase,
  workspaceName,
  expectedModuleIds,
  expectApproval = false,
}) {
  const fixture = await buildModuleExpansionReadyFixture(workspaceName)
  const reusablePlanningContext = buildReusablePlanningContext()
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const moduleExpansionPlan =
    decision?.moduleExpansionPlan && typeof decision.moduleExpansionPlan === 'object'
      ? decision.moduleExpansionPlan
      : null

  if (strategy !== 'prepare-module-expansion-plan') {
    failures.push('Materializar un modulo no soportado deberia volver a prepare-module-expansion-plan.')
  }
  if (executionMode !== 'planner-only') {
    failures.push('Materializar un modulo no soportado no deberia caer en executor.')
  }
  if (nextExpectedAction !== 'review-module-expansion') {
    failures.push('Materializar un modulo no soportado deberia volver a review-module-expansion.')
  }
  if (materializationPlan) {
    failures.push('Un modulo no soportado no deberia devolver materializationPlan.')
  }
  if (executionScope) {
    failures.push('Un modulo no soportado no deberia devolver executionScope ejecutable.')
  }
  if (!moduleExpansionPlan) {
    failures.push('moduleExpansionPlan ausente al pedir materializar un modulo no soportado.')
  } else {
    const moduleSummary = summarizeModuleExpansionPlan(moduleExpansionPlan)
    if (!expectedModuleIds.includes(moduleSummary.moduleId)) {
      failures.push(`moduleExpansionPlan.moduleId deberia ser ${expectedModuleIds.join(' o ')}.`)
    }
    if (moduleSummary.safeToMaterialize) {
      failures.push('Un modulo no soportado no deberia prometer materializacion inmediata.')
    }
    if (moduleSummary.approvalRequired !== expectApproval) {
      failures.push('approvalRequired inesperado para modulo bloqueado.')
    }
    if (
      !moduleSummary.blockers.some(
        (entry) =>
          entry.toLocaleLowerCase().includes('materializador seguro') ||
          entry.toLocaleLowerCase().includes('aprobacion') ||
          entry.toLocaleLowerCase().includes('aprobación') ||
          entry.toLocaleLowerCase().includes('riesgo'),
      ) &&
      !moduleSummary.reason.toLocaleLowerCase().includes('materializador seguro') &&
      !moduleSummary.reason.toLocaleLowerCase().includes('aprob')
    ) {
      failures.push('El fallback bloqueado deberia explicar por que no existe materializacion segura.')
    }
  }

  return { testCase, ok: failures.length === 0, failures, strategy, executionMode, nextExpectedAction }
}

async function runReviewAndExpandAfterModuleValidation({
  workspaceName,
  moduleLabel,
  moduleId,
}) {
  let fixture = await buildModuleExpansionReadyFixture(workspaceName)
  fixture = await materializeModuleExpansionOnFixture({
    fixture,
    moduleLabel,
    requestId: `${workspaceName}-existing-module`,
  })
  const reusablePlanningContext = buildReusablePlanningContext()
  const testCase = phaseExecutionValidationCases.prepareReviewAndExpand
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: fixture.workspacePath,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: '',
    manualReusablePreference: null,
    contextHubPack: {
      available: false,
      endpoint: '/v1/packs/suggested',
      reason: 'smoke',
    },
    reusablePlanningContext,
  })

  const failures = []
  const expansionOptions =
    decision?.expansionOptions && typeof decision.expansionOptions === 'object'
      ? decision.expansionOptions
      : null

  if (!expansionOptions) {
    failures.push('expansionOptions ausente en review-and-expand despues de materializar un modulo.')
  } else {
    const optionsSummary = summarizeExpansionOptions(expansionOptions)
    if (optionsSummary.options.some((entry) => entry.id === moduleId && entry.safeToMaterialize)) {
      failures.push(`review-and-expand no deberia sugerir ${moduleId} como nueva opcion materializable si ya esta done.`)
    }
  }

  return {
    testCase: {
      id: `review-after-${moduleId}`,
      label: `Review and expand despues de ${moduleId}`,
    },
    ok: failures.length === 0,
    failures,
    strategy: String(decision?.strategy || '').trim(),
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

function continuationActionMatchesId(actionSummary, identifier) {
  const expectedId = String(identifier || '').trim()

  if (!expectedId || !actionSummary || typeof actionSummary !== 'object') {
    return false
  }

  return [actionSummary.id, actionSummary.phaseId, actionSummary.moduleId].some(
    (value) => String(value || '').trim() === expectedId,
  )
}

async function runContinuationRecommendationValidation({
  testCase,
  workspaceName,
  baseFixture = 'phase',
  manifestOptions = {},
  expectedNextPhase = '',
  expectedNextActionId = '',
  expectedProjectStatus = '',
  expectedSafeActionIds = [],
  expectedPlanningActionIds = [],
  expectedApprovalActionIds = [],
  expectedBlockedActionIds = [],
  expectedSafeModuleOptions = [],
  forbiddenMaterializableOptionIds = [],
  expectedModulesAvailable = [],
  expectedModulesBlocked = [],
}) {
  const fixtureBuilder =
    baseFixture === 'review-ready'
      ? buildModuleExpansionReadyFixture
      : async (name) => buildPhaseExecutionFixture({ workspaceName: name })
  let fixture = await fixtureBuilder(workspaceName)
  fixture = writeFixtureManifest(
    fixture,
    buildContinuationScenarioManifest(fixture.manifest, manifestOptions),
  )

  const decision = await requestContinuationDecision({ fixture, testCase })
  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const projectContinuationState =
    decision?.projectContinuationState &&
    typeof decision.projectContinuationState === 'object'
      ? decision.projectContinuationState
      : null
  const localProjectManifest =
    decision?.localProjectManifest && typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const expansionOptions =
    decision?.expansionOptions && typeof decision.expansionOptions === 'object'
      ? decision.expansionOptions
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push('La validacion de continuidad deberia seguir usando prepare-project-phase-plan para review-and-expand.')
  }
  if (executionMode !== 'planner-only') {
    failures.push('La validacion de continuidad deberia mantenerse en planner-only.')
  }
  if (nextExpectedAction !== 'review-project-phase') {
    failures.push('La validacion de continuidad deberia devolver review-project-phase.')
  }
  if (materializationPlan) {
    failures.push('La continuidad revisable no deberia devolver materializationPlan.')
  }
  if (!projectContinuationState) {
    failures.push('projectContinuationState ausente en el escenario de continuidad.')
  } else {
    const stateSummary = summarizeProjectContinuationState(projectContinuationState)

    if (expectedNextPhase && stateSummary.nextRecommendedPhase !== expectedNextPhase) {
      failures.push(
        `projectContinuationState.nextRecommendedPhase deberia ser ${expectedNextPhase}.`,
      )
    }
    if (expectedProjectStatus && stateSummary.projectStatus !== expectedProjectStatus) {
      failures.push(
        `projectContinuationState.projectStatus deberia ser ${expectedProjectStatus}.`,
      )
    }
    if (
      expectedNextActionId &&
      !continuationActionMatchesId(stateSummary.nextRecommendedAction, expectedNextActionId)
    ) {
      failures.push(
        `projectContinuationState.nextRecommendedAction deberia apuntar a ${expectedNextActionId}.`,
      )
    }

    for (const actionId of expectedSafeActionIds) {
      if (
        !stateSummary.availableSafeActions.some((entry) =>
          continuationActionMatchesId(entry, actionId),
        )
      ) {
        failures.push(`availableSafeActions deberia incluir ${actionId}.`)
      }
    }
    for (const actionId of expectedPlanningActionIds) {
      if (
        !stateSummary.availablePlanningActions.some((entry) =>
          continuationActionMatchesId(entry, actionId),
        )
      ) {
        failures.push(`availablePlanningActions deberia incluir ${actionId}.`)
      }
    }
    for (const actionId of expectedApprovalActionIds) {
      if (
        !stateSummary.approvalRequiredActions.some((entry) =>
          continuationActionMatchesId(entry, actionId),
        )
      ) {
        failures.push(`approvalRequiredActions deberia incluir ${actionId}.`)
      }
    }
    for (const actionId of expectedBlockedActionIds) {
      if (
        !stateSummary.blockedActions.some((entry) =>
          continuationActionMatchesId(entry, actionId),
        )
      ) {
        failures.push(`blockedActions deberia incluir ${actionId}.`)
      }
    }
    for (const moduleName of expectedModulesAvailable) {
      if (
        !stateSummary.modulesAvailable.some(
          (entry) => normalizeText(entry) === normalizeText(moduleName),
        )
      ) {
        failures.push(`modulesAvailable deberia incluir ${moduleName}.`)
      }
    }
    for (const moduleName of expectedModulesBlocked) {
      if (
        !stateSummary.modulesBlocked.some(
          (entry) => normalizeText(entry) === normalizeText(moduleName),
        )
      ) {
        failures.push(`modulesBlocked deberia incluir ${moduleName}.`)
      }
    }
  }

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en el escenario de continuidad.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)

    if (expectedNextPhase && manifestSummary.nextRecommendedPhase !== expectedNextPhase) {
      failures.push(`localProjectManifest.nextRecommendedPhase deberia ser ${expectedNextPhase}.`)
    }
    if (expectedSafeActionIds.length > 0) {
      expectedSafeActionIds.forEach((actionId) => {
        if (!manifestSummary.availableActions.includes(actionId)) {
          failures.push(`localProjectManifest.availableActions deberia incluir ${actionId}.`)
        }
      })
    }
  }

  if (expectedSafeModuleOptions.length > 0 || forbiddenMaterializableOptionIds.length > 0) {
    if (!expansionOptions) {
      failures.push('expansionOptions ausente cuando deberia sugerir modulos seguros.')
    } else {
      const optionsSummary = summarizeExpansionOptions(expansionOptions)
      expectedSafeModuleOptions.forEach((moduleId) => {
        if (
          !optionsSummary.options.some(
            (entry) => entry.id === moduleId && entry.safeToMaterialize === true,
          )
        ) {
          failures.push(`expansionOptions deberia incluir ${moduleId} como opcion materializable segura.`)
        }
      })
      forbiddenMaterializableOptionIds.forEach((moduleId) => {
        if (
          optionsSummary.options.some(
            (entry) => entry.id === moduleId && entry.safeToMaterialize === true,
          )
        ) {
          failures.push(`expansionOptions no deberia sugerir ${moduleId} como materializable nuevo.`)
        }
      })
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runContinuationActionPlanValidation({
  testCase,
  workspaceName,
  expectedActionId,
  expectApproval = true,
  expectBlocked = false,
}) {
  const fixture = await buildModuleExpansionReadyFixture(workspaceName)
  const decision = await requestContinuationDecision({ fixture, testCase })
  const failures = []
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const executionScope =
    decision?.executionScope && typeof decision.executionScope === 'object'
      ? decision.executionScope
      : null
  const continuationActionPlan =
    decision?.continuationActionPlan &&
    typeof decision.continuationActionPlan === 'object'
      ? decision.continuationActionPlan
      : null
  const projectContinuationState =
    decision?.projectContinuationState &&
    typeof decision.projectContinuationState === 'object'
      ? decision.projectContinuationState
      : null

  if (strategy !== 'prepare-continuation-action-plan') {
    failures.push('La accion sensible deberia devolver prepare-continuation-action-plan.')
  }
  if (executionMode !== 'planner-only') {
    failures.push('Las acciones sensibles o revisables deben quedar en planner-only.')
  }
  if (nextExpectedAction !== 'review-continuation-action') {
    failures.push('Las acciones sensibles deben volver a review-continuation-action.')
  }
  if (materializationPlan) {
    failures.push('Las acciones sensibles no deberian devolver materializationPlan.')
  }
  if (executionScope) {
    failures.push('Las acciones sensibles no deberian devolver executionScope ejecutable.')
  }
  if (!continuationActionPlan) {
    failures.push('continuationActionPlan ausente.')
  } else {
    const actionSummary = summarizeContinuationAction(continuationActionPlan)
    if (!continuationActionMatchesId(actionSummary, expectedActionId)) {
      failures.push(`continuationActionPlan.id deberia ser ${expectedActionId}.`)
    }
    if (actionSummary.safeToMaterialize) {
      failures.push('Una accion sensible nunca deberia quedar safeToMaterialize=true.')
    }
    if (actionSummary.requiresApproval !== expectApproval) {
      failures.push('requiresApproval inesperado en continuationActionPlan.')
    }
    if (actionSummary.blocked !== expectBlocked) {
      failures.push('blocked inesperado en continuationActionPlan.')
    }
    if (
      !actionSummary.blocker &&
      !actionSummary.reason &&
      !actionSummary.description
    ) {
      failures.push('continuationActionPlan deberia explicar el motivo de la restriccion.')
    }
  }
  if (!projectContinuationState) {
    failures.push('projectContinuationState ausente en accion sensible.')
  } else {
    const stateSummary = summarizeProjectContinuationState(projectContinuationState)
    const targetList = expectBlocked
      ? stateSummary.blockedActions
      : stateSummary.approvalRequiredActions

    if (!targetList.some((entry) => continuationActionMatchesId(entry, expectedActionId))) {
      failures.push(
        `${expectBlocked ? 'blockedActions' : 'approvalRequiredActions'} deberia incluir ${expectedActionId}.`,
      )
    }
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function main() {
  const { verbose, listOnly, caseId } = parseArgs(process.argv.slice(2))

  if (listOnly) {
    printList()
    return
  }

  const casesToRun = resolveCases(caseId)
  const results = casesToRun.map(runCase)
  const passedCount = results.filter((result) => result.ok).length
  const failedResults = results.filter((result) => !result.ok)

  console.log('AI Planner Smoke')
  console.log('=================')

  results.forEach((result) => {
    if (verbose) {
      printVerboseResult(result)
    } else {
      printCompactResult(result)
    }
  })

  console.log('-----------------')

  let scalableResults = []
  let questionPolicyResults = []
  if (!caseId) {
    console.log('Scalable Delivery Checks')
    console.log('=======================')
    scalableResults = await Promise.all(
      scalableValidationCases.map(runScalableValidationCase),
    )
    scalableResults.forEach(printScalableValidationResult)
    console.log('-----------------')

    console.log('Question Policy Check')
    console.log('=====================')
    questionPolicyResults = await Promise.all([
      runQuestionPolicyLowRiskValidation(),
      runQuestionPolicySensitiveRiskValidation(),
    ])
    questionPolicyResults.forEach(printScalableValidationResult)
    console.log('-----------------')
  }

  let frontendMaterializationResult = null
  let fullstackMaterializationResult = null
  let projectPhaseExecutionResults = []
  let continuationResults = []
  if (!caseId) {
    console.log('Frontend Project Materialization Check')
    console.log('=====================================')
    frontendMaterializationResult =
      await runFrontendProjectMaterializationValidation()
    printScalableValidationResult(frontendMaterializationResult)
    console.log('-----------------')

    console.log('Fullstack Local Materialization Check')
    console.log('====================================')
    fullstackMaterializationResult =
      await runFullstackLocalMaterializationValidation()
    printScalableValidationResult(fullstackMaterializationResult)
    console.log('-----------------')

    console.log('Project Phase Execution Checks')
    console.log('==============================')
    projectPhaseExecutionResults = [
      await runPrepareFrontendMockFlowValidation(),
      await runMaterializeFrontendMockFlowValidation(),
      await runBlockedBackendContractsMaterializationValidation(),
      await runBlockedDatabaseDesignMaterializationValidation(),
      await runPrepareBackendContractsValidation(),
      await runMaterializeBackendContractsValidation(),
      await runPrepareDatabaseDesignValidation(),
      await runMaterializeDatabaseDesignValidation(),
      await runBlockedLocalValidationMaterializationValidation(),
      await runPrepareLocalValidationValidation(),
      await runMaterializeLocalValidationValidation(),
      await runPrepareReviewAndExpandValidation(),
      await runPrepareModuleExpansionValidation(),
      await runPrepareUnsupportedModuleExpansionValidation(),
      await runPrepareSpecificModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.prepareReportsModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-reports-ready',
        expectedModuleIds: ['reports'],
        expectMaterializable: true,
      }),
      await runPrepareSpecificModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.prepareInventoryModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-inventory-ready',
        expectedModuleIds: ['inventory'],
        expectMaterializable: true,
      }),
      await runPrepareSpecificModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.prepareAuthModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-auth-ready',
        expectedModuleIds: ['auth'],
        expectMaterializable: false,
        expectApproval: true,
      }),
      await runMaterializeModuleExpansionValidation(),
      await runMaterializeSpecificModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeReportsModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-reports-materialization',
        moduleId: 'reports',
        moduleLabel: 'reportes',
      }),
      await runMaterializeSpecificModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeInventoryModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-inventory-materialization',
        moduleId: 'inventory',
        moduleLabel: 'inventario',
      }),
      await runMaterializeUnsupportedModuleExpansionValidation(),
      await runBlockedMaterializeModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeAuthModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-auth-blocked',
        expectedModuleIds: ['auth'],
        expectApproval: true,
      }),
      await runBlockedMaterializeModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializePaymentsModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-payments-blocked',
        expectedModuleIds: ['payments'],
        expectApproval: true,
      }),
      await runBlockedMaterializeModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeDeployModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-deploy-blocked',
        expectedModuleIds: ['deploy'],
        expectApproval: true,
      }),
      await runBlockedMaterializeModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeIntegrationsModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-integrations-blocked',
        expectedModuleIds: ['integrations'],
        expectApproval: true,
      }),
      await runBlockedMaterializeModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeDockerModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-docker-blocked',
        expectedModuleIds: ['docker'],
        expectApproval: true,
      }),
      await runBlockedMaterializeModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeUnknownModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-unknown-blocked',
        expectedModuleIds: ['analitica-avanzada'],
      }),
      await runDuplicateModuleExpansionValidation(),
      await runDuplicateSpecificModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeDuplicateReportsModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-reports-duplicate',
        moduleId: 'reports',
        moduleLabel: 'reportes',
      }),
      await runDuplicateSpecificModuleExpansionValidation({
        testCase: phaseExecutionValidationCases.materializeDuplicateInventoryModuleExpansion,
        workspaceName: 'fullstack-project-module-expansion-inventory-duplicate',
        moduleId: 'inventory',
        moduleLabel: 'inventario',
      }),
      await runReviewAndExpandAfterModuleValidation({
        workspaceName: 'fullstack-project-review-after-notifications',
        moduleId: 'notifications',
        moduleLabel: 'notificaciones',
      }),
    ]
    projectPhaseExecutionResults.forEach(printScalableValidationResult)
    console.log('-----------------')

    console.log('Project Continuation Checks')
    console.log('===========================')
    continuationResults = [
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.legacyManifestWithoutPhases,
        workspaceName: 'fullstack-project-continuation-legacy-manifest',
        baseFixture: 'phase',
        manifestOptions: {
          includePhases: false,
          modulesMode: 'remove',
          nextRecommendedPhase: '',
        },
        expectedNextPhase: 'frontend-mock-flow',
        expectedNextActionId: 'frontend-mock-flow',
        expectedProjectStatus: 'base-phases-in-progress',
        expectedSafeActionIds: ['frontend-mock-flow'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestFrontendDone,
        workspaceName: 'fullstack-project-continuation-frontend-done',
        baseFixture: 'phase',
        manifestOptions: {
          phaseStatuses: {
            'fullstack-local-scaffold': 'done',
            'frontend-mock-flow': 'done',
            'backend-contracts': 'available',
            'database-design': 'planned',
            'local-validation': 'pending',
            'review-and-expand': 'pending',
          },
          modulesMode: 'remove',
          nextRecommendedPhase: 'backend-contracts',
        },
        expectedNextPhase: 'backend-contracts',
        expectedNextActionId: 'backend-contracts',
        expectedProjectStatus: 'base-phases-in-progress',
        expectedSafeActionIds: ['backend-contracts'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestBackendDone,
        workspaceName: 'fullstack-project-continuation-backend-done',
        baseFixture: 'phase',
        manifestOptions: {
          phaseStatuses: {
            'fullstack-local-scaffold': 'done',
            'frontend-mock-flow': 'done',
            'backend-contracts': 'done',
            'database-design': 'available',
            'local-validation': 'pending',
            'review-and-expand': 'pending',
          },
          modulesMode: 'remove',
          nextRecommendedPhase: 'database-design',
        },
        expectedNextPhase: 'database-design',
        expectedNextActionId: 'database-design',
        expectedProjectStatus: 'base-phases-in-progress',
        expectedSafeActionIds: ['database-design'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestDatabaseDone,
        workspaceName: 'fullstack-project-continuation-database-done',
        baseFixture: 'phase',
        manifestOptions: {
          phaseStatuses: {
            'fullstack-local-scaffold': 'done',
            'frontend-mock-flow': 'done',
            'backend-contracts': 'done',
            'database-design': 'done',
            'local-validation': 'available',
            'review-and-expand': 'pending',
          },
          modulesMode: 'remove',
          nextRecommendedPhase: 'local-validation',
        },
        expectedNextPhase: 'local-validation',
        expectedNextActionId: 'local-validation',
        expectedProjectStatus: 'base-phases-in-progress',
        expectedSafeActionIds: ['local-validation'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestBaseComplete,
        workspaceName: 'fullstack-project-continuation-base-complete',
        baseFixture: 'review-ready',
        manifestOptions: {
          nextRecommendedPhase: 'review-and-expand',
        },
        expectedNextPhase: 'review-and-expand',
        expectedNextActionId: 'notifications',
        expectedProjectStatus: 'safe-module-expansion-ready',
        expectedSafeActionIds: ['notifications', 'reports', 'inventory'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestBaseCompleteWithoutModules,
        workspaceName: 'fullstack-project-continuation-without-modules',
        baseFixture: 'review-ready',
        manifestOptions: {
          modulesMode: 'remove',
          nextRecommendedPhase: 'review-and-expand',
        },
        expectedNextPhase: 'review-and-expand',
        expectedNextActionId: 'notifications',
        expectedProjectStatus: 'safe-module-expansion-ready',
        expectedSafeActionIds: ['notifications', 'reports', 'inventory'],
        expectedSafeModuleOptions: ['notifications', 'reports', 'inventory'],
        expectedModulesAvailable: ['Notificaciones', 'Reportes', 'Inventario'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestNotificationsDone,
        workspaceName: 'fullstack-project-continuation-notifications-done',
        baseFixture: 'review-ready',
        manifestOptions: {
          modulesMode: 'replace',
          modules: [
            {
              id: 'notifications',
              name: 'Notificaciones',
              status: 'done',
              addedAt: 'scenario-manifest',
              layers: ['frontend', 'backend', 'shared', 'database', 'docs'],
              files: ['docs/validation-report.md'],
            },
          ],
          nextRecommendedPhase: 'review-and-expand',
        },
        expectedNextPhase: 'review-and-expand',
        expectedNextActionId: 'reports',
        expectedProjectStatus: 'safe-module-expansion-ready',
        expectedSafeActionIds: ['reports', 'inventory'],
        expectedSafeModuleOptions: ['reports', 'inventory'],
        forbiddenMaterializableOptionIds: ['notifications'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestAllSafeModulesDone,
        workspaceName: 'fullstack-project-continuation-all-safe-done',
        baseFixture: 'review-ready',
        manifestOptions: {
          modulesMode: 'replace',
          modules: [
            {
              id: 'notifications',
              name: 'Notificaciones',
              status: 'done',
              addedAt: 'scenario-manifest',
              layers: ['frontend', 'backend', 'shared', 'database', 'docs'],
              files: ['docs/validation-report.md'],
            },
            {
              id: 'reports',
              name: 'Reportes',
              status: 'done',
              addedAt: 'scenario-manifest',
              layers: ['frontend', 'backend', 'shared', 'database', 'docs'],
              files: ['docs/architecture.md'],
            },
            {
              id: 'inventory',
              name: 'Inventario',
              status: 'done',
              addedAt: 'scenario-manifest',
              layers: ['frontend', 'backend', 'shared', 'database', 'docs'],
              files: ['database/schema.sql'],
            },
          ],
          nextRecommendedPhase: 'review-and-expand',
        },
        expectedNextPhase: 'review-and-expand',
        expectedNextActionId: 'prepare-frontend-improvement-plan',
        expectedProjectStatus: 'safe-capabilities-complete',
        expectedPlanningActionIds: [
          'prepare-frontend-improvement-plan',
          'prepare-backend-improvement-plan',
          'prepare-validation-improvement-plan',
        ],
        forbiddenMaterializableOptionIds: ['notifications', 'reports', 'inventory'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestPartialModule,
        workspaceName: 'fullstack-project-continuation-partial-module',
        baseFixture: 'review-ready',
        manifestOptions: {
          modulesMode: 'replace',
          modules: [
            {
              id: 'notifications',
              name: 'Notificaciones',
              status: 'partial',
              addedAt: 'scenario-manifest',
              layers: ['frontend', 'backend'],
              files: ['frontend/src/components/App.js'],
            },
          ],
          nextRecommendedPhase: 'review-and-expand',
        },
        expectedNextPhase: 'review-and-expand',
        expectedNextActionId: 'notifications',
        expectedProjectStatus: 'safe-module-expansion-ready',
        expectedSafeActionIds: ['reports', 'inventory'],
        expectedPlanningActionIds: ['notifications'],
        forbiddenMaterializableOptionIds: ['notifications'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestBlockedModule,
        workspaceName: 'fullstack-project-continuation-blocked-module',
        baseFixture: 'review-ready',
        manifestOptions: {
          modulesMode: 'replace',
          modules: [
            {
              id: 'notifications',
              name: 'Notificaciones',
              status: 'blocked',
              addedAt: 'scenario-manifest',
              layers: ['frontend', 'backend'],
              files: ['frontend/src/components/App.js'],
            },
          ],
          nextRecommendedPhase: 'review-and-expand',
        },
        expectedNextPhase: 'review-and-expand',
        expectedProjectStatus: 'safe-module-expansion-ready',
        expectedSafeActionIds: ['reports', 'inventory'],
        expectedBlockedActionIds: ['notifications'],
        forbiddenMaterializableOptionIds: ['notifications'],
        expectedModulesBlocked: ['Notificaciones'],
      }),
      await runContinuationActionPlanValidation({
        testCase: continuationValidationCases.prepareRuntimePlan,
        workspaceName: 'fullstack-project-continuation-runtime-plan',
        expectedActionId: 'prepare-runtime-plan',
        expectApproval: true,
      }),
      await runContinuationActionPlanValidation({
        testCase: continuationValidationCases.prepareDependencyInstallPlan,
        workspaceName: 'fullstack-project-continuation-dependency-plan',
        expectedActionId: 'prepare-dependency-install-plan',
        expectApproval: true,
      }),
      await runContinuationActionPlanValidation({
        testCase: continuationValidationCases.prepareDbRealPlan,
        workspaceName: 'fullstack-project-continuation-db-real-plan',
        expectedActionId: 'prepare-db-real-plan',
        expectApproval: true,
      }),
      await runContinuationActionPlanValidation({
        testCase: continuationValidationCases.prepareAuthPlan,
        workspaceName: 'fullstack-project-continuation-auth-plan',
        expectedActionId: 'prepare-auth-plan',
        expectApproval: true,
      }),
      await runContinuationActionPlanValidation({
        testCase: continuationValidationCases.prepareDeployPlan,
        workspaceName: 'fullstack-project-continuation-deploy-plan',
        expectedActionId: 'prepare-deploy-plan',
        expectApproval: true,
        expectBlocked: true,
      }),
      await runContinuationActionPlanValidation({
        testCase: continuationValidationCases.prepareExternalIntegrationPlan,
        workspaceName: 'fullstack-project-continuation-external-integration-plan',
        expectedActionId: 'prepare-external-integration-plan',
        expectApproval: true,
      }),
      await runContinuationActionPlanValidation({
        testCase: continuationValidationCases.prepareDockerPlan,
        workspaceName: 'fullstack-project-continuation-docker-plan',
        expectedActionId: 'prepare-docker-plan',
        expectApproval: true,
        expectBlocked: true,
      }),
    ]
    continuationResults.forEach(printScalableValidationResult)
    console.log('-----------------')
  }

  const failedScalableResults = scalableResults.filter((result) => !result.ok)
  const failedQuestionPolicyResults = questionPolicyResults.filter((result) => !result.ok)
  const failedProjectPhaseExecutionResults = projectPhaseExecutionResults.filter(
    (result) => !result.ok,
  )
  const failedContinuationResults = continuationResults.filter((result) => !result.ok)
  const frontendMaterializationFailed = frontendMaterializationResult?.ok === false
  const fullstackMaterializationFailed = fullstackMaterializationResult?.ok === false

  if (
    failedResults.length === 0 &&
    failedScalableResults.length === 0 &&
    failedQuestionPolicyResults.length === 0 &&
    failedContinuationResults.length === 0 &&
    failedProjectPhaseExecutionResults.length === 0 &&
    !frontendMaterializationFailed &&
    !fullstackMaterializationFailed
  ) {
    console.log(`OK. ${passedCount}/${results.length} casos pasaron.`)
    if (scalableResults.length > 0) {
      console.log(`OK. ${scalableResults.length}/${scalableResults.length} checks escalables pasaron.`)
    }
    if (questionPolicyResults.length > 0) {
      console.log(
        `OK. ${questionPolicyResults.length}/${questionPolicyResults.length} checks de questionPolicy pasaron.`,
      )
    }
    if (frontendMaterializationResult) {
      console.log('OK. 1/1 check de materializacion frontend-project paso.')
    }
    if (fullstackMaterializationResult) {
      console.log('OK. 1/1 check de materializacion fullstack-local paso.')
    }
    if (projectPhaseExecutionResults.length > 0) {
      console.log(
        `OK. ${projectPhaseExecutionResults.length}/${projectPhaseExecutionResults.length} checks de project phase execution pasaron.`,
      )
    }
    if (continuationResults.length > 0) {
      console.log(
        `OK. ${continuationResults.length}/${continuationResults.length} checks de project continuation pasaron.`,
      )
    }
    return
  }

  console.log(`FALLO. ${passedCount}/${results.length} casos pasaron.`)
  console.log('casos fallidos:')
  failedResults.forEach((result) => {
    console.log(`- ${result.testCase.id}: ${result.failures[0] || 'sin detalle'}`)
  })

  if (failedScalableResults.length > 0) {
    console.log('checks escalables fallidos:')
    failedScalableResults.forEach((result) => {
      console.log(`- ${result.testCase.id}: ${result.failures[0] || 'sin detalle'}`)
    })
  }

  if (failedQuestionPolicyResults.length > 0) {
    console.log('checks de questionPolicy fallidos:')
    failedQuestionPolicyResults.forEach((result) => {
      console.log(`- ${result.testCase.id}: ${result.failures[0] || 'sin detalle'}`)
    })
  }

  if (failedProjectPhaseExecutionResults.length > 0) {
    console.log('checks de project phase execution fallidos:')
    failedProjectPhaseExecutionResults.forEach((result) => {
      console.log(`- ${result.testCase.id}: ${result.failures[0] || 'sin detalle'}`)
    })
  }

  if (failedContinuationResults.length > 0) {
    console.log('checks de project continuation fallidos:')
    failedContinuationResults.forEach((result) => {
      console.log(`- ${result.testCase.id}: ${result.failures[0] || 'sin detalle'}`)
    })
  }

  if (frontendMaterializationFailed) {
    console.log('check de materializacion frontend-project fallido:')
    console.log(
      `- ${frontendMaterializationResult.testCase.id}: ${
        frontendMaterializationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (fullstackMaterializationFailed) {
    console.log('check de materializacion fullstack-local fallido:')
    console.log(
      `- ${fullstackMaterializationResult.testCase.id}: ${
        fullstackMaterializationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  process.exit(1)
}

await main()
