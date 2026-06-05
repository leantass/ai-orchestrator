import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
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
  buildGenericSafeFirstDeliveryMaterializationPlan,
  buildLocalMaterializationTask,
  runLocalDeterministicTask,
} = require(
  path.join(repoRoot, 'electron', 'local-deterministic-executor.cjs'),
)
const {
  buildUnavailableContextHubPack,
  fetchSuggestedContextHubPack,
  emitContextHubEvent,
  CONTEXT_HUB_API_URL_FALLBACKS,
} = require(path.join(repoRoot, 'electron', 'context-hub-client.cjs'))
const {
  summarizeContextHubPackForLog,
  buildExecutionFinishedEventPayload,
  buildExecutionFailedEventPayload,
} = require(path.join(repoRoot, 'electron', 'context-hub-events.cjs'))
const {
  FULLSTACK_LOCAL_BASE_PHASES,
  getFullstackLocalBasePhaseDefinition,
  buildFullstackLocalManifestPhaseBlueprints,
} = require(path.join(repoRoot, 'electron', 'fullstack-phase-contracts.cjs'))
const {
  classifyWorkspaceProjectIntent,
  selectBestWorkspaceProjectCandidate,
  shouldIgnoreWorkspaceDirectoryEntry,
} = require(path.join(repoRoot, 'electron', 'workspace-project-detection.cjs'))
const {
  analyzeExistingProject,
  buildAttachedInputMetadataList,
} = require(path.join(repoRoot, 'electron', 'project-context.cjs'))
const {
  normalizeGeneratedDomainContract,
  validateGeneratedDomainContract,
  deriveAllowedTargetPathsFromContract,
  deriveRequiredPathGroupsFromContract,
  deriveForbiddenSearchPatternsFromContract,
  isContractSafeForLocalMaterialization,
  buildGeneratedDomainCapabilityProfile,
  buildGeneratedDomainMaterializationShadowPlan,
  buildGeneratedDomainContractComparison,
  buildGeneratedDomainContractDiagnostics,
  extractGeneratedDomainContractCandidate,
} = require(path.join(repoRoot, 'electron', 'generated-domain-contract.cjs'))
const generatedDomainOrchestrationDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-orchestration-diagnostics.cjs'),
)
const generatedDomainLegacyDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-legacy-diagnostics.cjs'),
)
const generatedDomainMaterializationPolicies = require(
  path.join(repoRoot, 'electron', 'generated-domain-materialization-policies.cjs'),
)
const generatedDomainInspectionDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-inspection-diagnostics.cjs'),
)
const generatedDomainMaterializationPlanDiagnostics = require(
  path.join(repoRoot, 'electron', 'generated-domain-materialization-plan-diagnostics.cjs'),
)
const requiredPlannerFunctions = [
  'buildDomainUnderstanding',
  'buildProductArchitecturePlan',
  'buildSafeFirstDeliveryPlan',
  'buildMaterializeSafeFirstDeliveryPlan',
  'buildLocalStrategicBrainDecision',
  'normalizeOpenAIBrainDecision',
  'buildStrategicBrainInput',
  'shouldBlockWebScaffoldExecutionForFullstackRequest',
  'buildBlockedFullstackWebScaffoldExecutionResponse',
  'inspectFullstackLocalMaterializationContract',
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
    id: 'ecommerce-pelotas-futbol',
    label: 'Ecommerce pelotas de futbol',
    goal:
      'Crear una entrega funcional local para una tienda online moderna de venta de pelotas de futbol con hero comercial, catalogo destacado, categorias, productos, beneficios, testimonios, FAQ, carrito local y checkout simulado.',
    context:
      'La prioridad es marketing y conversion. Debe ser una landing comercial deportiva para vender o consultar pelotas de futbol, con categorias entrenamiento, partido, infantiles, profesionales y ofertas, sin deploy, sin publicacion real, sin pagos reales, sin base de datos real, sin credenciales ni integraciones externas reales.',
    mustInclude: [
      'hero comercial',
      'catalogo',
      'categorias',
      'productos',
      'beneficios',
      'testimonios',
      'preguntas frecuentes',
      'cta comercial',
      'carrito local',
      'checkout simulado',
    ],
    mustExclude: ['reservas', 'profesionales mock', 'agenda inicial', 'backoffice mock', 'panel operativo'],
    folderAnyOf: ['safe-first-delivery-tienda-pelotas-futbol'],
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
  {
    id: 'pedidos-recarga',
    label: 'Pedidos de recarga',
    goal:
      'Crear una entrega funcional local para gestion de pedidos de recarga de dispositivos personales tipo vape o vaporizador.',
    context:
      'Sistema local y mock para pedidos de recarga, clientes, dispositivos, recepcion del dispositivo, preparacion de recarga, listo para devolucion, retiro o devolucion, observaciones internas, costos estimados, alertas de pedidos pendientes, reportes por estado, sin pagos reales, sin checkout real, sin venta directa, sin base de datos real, sin integraciones externas reales y con validacion futura de edad y cumplimiento legal.',
    mustInclude: [
      'pedidos de recarga',
      'clientes',
      'dispositivos',
      'estados del pedido',
      'retiro y devolucion',
      'reportes por estado',
    ],
    mustExclude: [
      'operaciones portuarias',
      'muelles',
      'arribos',
      'salidas',
      'reservas',
      'checkout simulado',
      'carrito',
    ],
    folderAnyOf: ['safe-first-delivery-pedidos-recarga'],
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
    id: 'tracking-logistico-fullstack-local',
    label: 'Tracking logistico fullstack local',
    goal:
      'Hacer un sistema fullstack local de tracking logistico para una empresa de logistica con backend local, base de datos local preferentemente SQLite, API local, frontend administrativo, consulta publica por codigo de seguimiento, entidades y relaciones, envios, clientes remitente destinatario, direcciones, estados, historial de eventos, incidencias, reportes basicos y seed inicial. Sin deploy, sin credenciales, sin servicios externos, sin pagos reales, sin Docker, sin base productiva ni integraciones reales.',
    context:
      'Backend local permitido, base local SQLite permitida, API local, frontend administrativo, tracking publico por codigo, entidades y relaciones para envios, estados, eventos e incidencias. Todo local, revisable y sin servicios externos.',
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
      'frontend/admin',
      'frontend/public',
      'backend/src/routes',
      'shared',
      'database',
      'scripts',
      'docs',
    ],
    expectedFileTokens: [
      'backend/package.json',
      'backend/src/server.js',
      'backend/src/routes/shipments.js',
      'backend/src/routes/tracking.js',
      'database/schema.sql',
      'database/seed.sql',
      'frontend/admin/index.html',
      'frontend/public/index.html',
      'shared/statuses.js',
      'docs/api.md',
      'docs/db_schema.md',
      'scripts/seed-local.js',
      'docs/architecture.md',
    ],
    expectedLocalConstraintTokens: [
      'workspace local',
      'No corresponde instalar dependencias',
      'No corresponde levantar frontend',
      'database local queda como esquema o documentación revisable',
    ],
    expectedApprovalTokens: [
      'Instalar dependencias locales del frontend y backend',
      'Levantar manualmente el frontend local y el backend local',
      'Crear o migrar una base de datos local real',
      'Integrar servicios externos',
    ],
    expectedBlueprintModules: [
      'frontend local',
      'backend local',
      'database design',
      'documentacion',
    ],
    expectedBlueprintEntities: [
      'envios',
      'clientes',
      'direcciones',
      'estados',
      'incidencias',
    ],
    expectImplementationRoadmap: true,
    expectedRoadmapPhaseTokens: [
      'blueprint-fullstack',
      'scaffold-fullstack-local',
      'backend-contracts',
      'database-design',
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

const veterinaryFullstackLocalCase = {
  id: 'fullstack-local-veterinaria',
  label: 'Materializacion fullstack local veterinaria',
  goal:
    'Hacer un sistema fullstack local para turnos de veterinaria con clientes, mascotas, turnos, recordatorios y reportes.',
  context: '',
}

const portOperationsNewProjectCase = {
  id: 'port-operations-new-project',
  label: 'Dominio portuario nuevo con workspace ya ocupado',
  goal:
    'Crear una entrega funcional local para un sistema de gestion de entradas de barcos a un puerto.',
  context:
    'Quiero buques, solicitudes de entrada, ETA y ETD, muelle o zona asignada, tipo de operacion de carga, descarga, reparacion, espera o abastecimiento, documentacion requerida, estado de aprobacion, alertas operativas, tablero de control, reportes basicos, historial de movimientos y usuarios internos con roles operativos. Primera entrega funcional local, con datos mock realistas, sin instalar dependencias, sin backend real, sin base real, sin Docker, sin deploy y preparada para continuar por fases.',
}

const internalHelpdeskNewProjectCase = {
  id: 'internal-helpdesk-new-project',
  label: 'Mesa de ayuda interna nueva con workspace ya ocupado',
  goal:
    'Crear una entrega funcional local para una mesa de ayuda interna con tickets, responsables, prioridades, SLA, comentarios y reportes.',
  context:
    'Quiero tickets, responsables internos, prioridades, SLA, comentarios, historial, bandeja operativa, reportes basicos y datos mock revisables. Sin instalar dependencias, sin backend real, sin base real, sin Docker, sin deploy y preparada para continuar por fases.',
}

const veterinaryContinuationCase = {
  id: 'explicit-veterinary-continuation',
  label: 'Continuidad explicita veterinaria',
  goal: 'Continuá el proyecto fullstack-local-veterinaria y agregale reportes.',
  context: 'Mantener la continuidad del proyecto existente y no crear uno nuevo.',
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
  materializeReviewAndExpand: {
    id: 'materialize-review-and-expand',
    label: 'Materializar review and expand',
    goal:
      'Materializar la fase review-and-expand del proyecto fullstack local de turnos medicos.',
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
  manifestReviewComplete: {
    id: 'continuation-review-complete',
    label: 'Review and expand ya completado',
    goal:
      'Hace lo que siga de forma segura para el proyecto fullstack local de turnos medicos.',
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

function normalizeIdentifier(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizePathForComparison(value) {
  return String(value || '').replace(/\\/g, '/').toLocaleLowerCase()
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
  const debugDiagnosticsSurface = extractSegment({
    name: 'diagnosticos legacy de main-debug',
    startMarker: 'function summarizeGeneratedDomainContractDiagnosticsForDebug(diagnostics) {',
    endMarker: 'function buildSafeGeneratedDomainContractObservationErrorPreview(value) {',
  })
  const plannerSurface = extractSegment({
    name: 'superficie local de planner',
    startMarker: 'function normalizeExecutorAttemptScope(',
    endMarker: 'function buildOpenAIBrainInputPayload(input) {',
  })
  const normalizeOpenAISurface = extractSegment({
    name: 'normalizacion openai del planner',
    startMarker: 'async function normalizeOpenAIBrainDecision(rawDecision, input) {',
    endMarker: 'function createLocalRulesStrategicBrainProvider() {',
  })
  const harness = `
${debugDiagnosticsSurface}
${plannerSurface}
${normalizeOpenAISurface}
module.exports = {
  buildDomainUnderstanding,
  buildProductArchitecturePlan,
  buildSafeFirstDeliveryPlan,
  buildMaterializeSafeFirstDeliveryPlan,
  buildLocalStrategicBrainDecision,
  normalizeOpenAIBrainDecision,
  buildStrategicBrainInput,
  shouldBlockWebScaffoldExecutionForFullstackRequest,
  buildBlockedFullstackWebScaffoldExecutionResponse,
  inspectFullstackLocalMaterializationContract,
};
`

  const sandbox = {
    module: { exports: {} },
    exports: {},
    require,
    __dirname: path.join(repoRoot, 'electron'),
    console,
    process,
    Buffer,
    fs,
    path,
    LOCAL_MATERIALIZATION_PLAN_VERSION,
    FULLSTACK_LOCAL_BASE_PHASES,
    getFullstackLocalBasePhaseDefinition,
    buildFullstackLocalManifestPhaseBlueprints,
    classifyWorkspaceProjectIntent,
    selectBestWorkspaceProjectCandidate,
    shouldIgnoreWorkspaceDirectoryEntry,
    buildUnavailableContextHubPack,
    normalizeGeneratedDomainContract,
    validateGeneratedDomainContract,
    deriveAllowedTargetPathsFromContract,
    deriveRequiredPathGroupsFromContract,
    deriveForbiddenSearchPatternsFromContract,
    isContractSafeForLocalMaterialization,
    buildGeneratedDomainCapabilityProfile,
    buildGeneratedDomainMaterializationShadowPlan,
    buildGeneratedDomainContractComparison,
    buildGeneratedDomainContractDiagnostics,
    extractGeneratedDomainContractCandidate,
    generatedDomainOrchestrationDiagnostics,
    generatedDomainLegacyDiagnostics,
    generatedDomainMaterializationPolicies,
    generatedDomainInspectionDiagnostics,
    generatedDomainMaterializationPlanDiagnostics,
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

function inspectDecisionMaterializationContract({
  decision,
  goal,
  context,
}) {
  return plannerApi.inspectFullstackLocalMaterializationContract({
    goal,
    context,
    decisionKey: decision?.decisionKey,
    strategy: decision?.strategy,
    executionMode: decision?.executionMode,
    nextExpectedAction: decision?.nextExpectedAction,
    executionScope: decision?.executionScope,
    materializationPlan: decision?.materializationPlan,
    localProjectManifest: decision?.localProjectManifest,
    existingProjectDetection: decision?.existingProjectDetection,
  })
}

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

function summarizeProjectReadinessState(projectReadinessState) {
  return {
    readinessLevel: projectReadinessState?.readinessLevel || '',
    demoReady: projectReadinessState?.demoReady === true,
    safeLocalDemoReady: projectReadinessState?.safeLocalDemoReady === true,
    completedCoreFlow: projectReadinessState?.completedCoreFlow === true,
    lastCompletedPhase: projectReadinessState?.lastCompletedPhase || '',
    nextRecommendedPhase: projectReadinessState?.nextRecommendedPhase || '',
    operatorSummary: projectReadinessState?.operatorSummary || '',
    warnings: toStringArray(projectReadinessState?.warnings, 24),
    pendingMilestones: toStringArray(projectReadinessState?.pendingMilestones, 24),
    completedMilestones: toStringArray(projectReadinessState?.completedMilestones, 24),
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
    projectRoot: localProjectManifest?.projectRoot || '',
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
    readinessLevel: localProjectManifest?.readinessLevel || '',
    demoReady: localProjectManifest?.demoReady === true,
    safeLocalDemoReady: localProjectManifest?.safeLocalDemoReady === true,
    completedCoreFlow: localProjectManifest?.completedCoreFlow === true,
    recommendedDemoScript: toStringArray(localProjectManifest?.recommendedDemoScript, 24),
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
          title: entry?.title || '',
          description: entry?.description || '',
          objective: entry?.objective || '',
          summary: entry?.summary || '',
          status: entry?.status || '',
          createdAt: entry?.createdAt || '',
          safeToMaterialize: entry?.safeToMaterialize === true,
          approvalRequired: entry?.approvalRequired === true,
          targetStrategy: entry?.targetStrategy || '',
          allowedTargetPaths: toStringArray(entry?.allowedTargetPaths, 24),
          nextRecommendedPhase: entry?.nextRecommendedPhase || '',
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

async function runFullstackPhaseContractsHelperValidation() {
  const failures = []
  const rootFolder = 'C:/tmp/fullstack-demo'
  const phaseBlueprints = buildFullstackLocalManifestPhaseBlueprints(rootFolder)
  const scaffoldBlueprint = phaseBlueprints.find(
    (entry) => entry?.id === 'fullstack-local-scaffold',
  )
  const frontendPhase = phaseBlueprints.find(
    (entry) => entry?.id === 'frontend-mock-flow',
  )
  const validationPhase = phaseBlueprints.find(
    (entry) => entry?.id === 'local-validation',
  )
  const reviewPhase = phaseBlueprints.find(
    (entry) => entry?.id === 'review-and-expand',
  )

  if (FULLSTACK_LOCAL_BASE_PHASES.length < 5) {
    failures.push('FULLSTACK_LOCAL_BASE_PHASES deberia incluir las fases base del flujo local seguro.')
  }

  if (!scaffoldBlueprint) {
    failures.push('El helper de fases deberia construir fullstack-local-scaffold.')
  } else {
    if (scaffoldBlueprint.nextRecommendedPhase !== 'frontend-mock-flow') {
      failures.push('fullstack-local-scaffold deberia recomendar frontend-mock-flow.')
    }
    if (!toStringArray(scaffoldBlueprint.allowedTargetPaths, 20).some((entry) => entry.endsWith('/frontend/index.html'))) {
      failures.push('fullstack-local-scaffold deberia incluir frontend/index.html en allowedTargetPaths.')
    }
  }

  if (!frontendPhase) {
    failures.push('El helper de fases deberia construir frontend-mock-flow.')
  } else {
    if (frontendPhase.nextRecommendedPhase !== 'backend-contracts') {
      failures.push('frontend-mock-flow deberia recomendar backend-contracts.')
    }
    if (
      !normalizeText(frontendPhase.summary).includes('sin') ||
      !normalizeText(frontendPhase.summary).includes('runtime real')
    ) {
      failures.push('frontend-mock-flow deberia aclarar que sigue sin runtime real dentro del summary.')
    }
    if (!toStringArray(frontendPhase.allowedTargetPaths, 20).some((entry) => entry.endsWith('/frontend/src/mock-data.js'))) {
      failures.push('frontend-mock-flow deberia incluir mock-data.js en allowedTargetPaths.')
    }
  }

  if (!validationPhase) {
    failures.push('El helper de fases deberia construir local-validation.')
  } else {
    if (validationPhase.nextRecommendedPhase !== 'review-and-expand') {
      failures.push('local-validation deberia recomendar review-and-expand.')
    }
    if (!toStringArray(validationPhase.allowedTargetPaths, 20).some((entry) => entry.endsWith('/frontend/src/mock-data.js'))) {
      failures.push('local-validation deberia incluir frontend/src/mock-data.js en allowedTargetPaths.')
    }
    if (!toStringArray(validationPhase.allowedTargetPaths, 20).some((entry) => entry.endsWith('/docs/validation-report.md'))) {
      failures.push('local-validation deberia incluir docs/validation-report.md en allowedTargetPaths.')
    }
  }

  if (!reviewPhase) {
    failures.push('El helper de fases deberia construir review-and-expand.')
  } else {
    if (reviewPhase.nextRecommendedPhase !== 'prepare-reusable-candidate-plan') {
      failures.push(
        'review-and-expand deberia recomendar prepare-reusable-candidate-plan como siguiente accion segura.',
      )
    }
    if (reviewPhase.safeToMaterialize !== true) {
      failures.push('review-and-expand deberia quedar materializable en modo local seguro.')
    }
    if (
      !toStringArray(reviewPhase.allowedTargetPaths, 20).some((entry) =>
        entry.endsWith('/docs/review-and-expand.md'),
      )
    ) {
      failures.push('review-and-expand deberia incluir docs/review-and-expand.md en allowedTargetPaths.')
    }
    if (
      !toStringArray(reviewPhase.allowedTargetPaths, 20).some((entry) =>
        entry.endsWith('/frontend/src/mock-data.js'),
      )
    ) {
      failures.push('review-and-expand deberia incluir frontend/src/mock-data.js en allowedTargetPaths.')
    }
  }

  return {
    testCase: {
      id: 'fullstack-phase-contracts-helper',
      label: 'Helper de fases fullstack local',
      goal: 'Validar la metadata pura de continuidad fullstack local.',
    },
    ok: failures.length === 0,
    failures,
    strategy: 'helper',
    executionMode: 'local-test',
    nextExpectedAction: 'phase-blueprints-ready',
  }
}

async function runContextHubEventHelpersValidation() {
  const failures = []
  const availableContextHubStatus = summarizeContextHubPackForLog({
    available: true,
    endpoint: '/v1/packs/suggested',
    pack: {
      id: 'pack-veterinaria',
      slug: 'veterinaria-demo',
      title: 'Veterinaria local segura',
      metadata: {
        itemsCount: 4,
        estimatedTokens: 320,
      },
    },
  })
  const unavailableContextHubStatus = summarizeContextHubPackForLog({
    available: false,
    endpoint: '/v1/packs/suggested',
    reason: 'offline',
  })

  const finishedPayload = buildExecutionFinishedEventPayload({
    finalResponse: {
      ok: true,
      requestId: 'smoke-finished',
      instruction: 'Materializar scaffold fullstack local.',
      materializationLayer: 'local-deterministic',
      details: {
        decisionKey: 'materialize-fullstack-local-plan',
        strategy: 'materialize-fullstack-local-plan',
        executionMode: 'executor',
        createdPaths: [
          'C:/tmp/fullstack-demo/frontend/index.html',
          'item.started',
        ],
        touchedPaths: ['C:/tmp/fullstack-demo/jefe-project.json'],
        validationResults: [{ ok: true }, { ok: true }],
      },
    },
    requestId: 'smoke-finished',
    instruction: 'Materializar scaffold fullstack local.',
    workspacePath: path.join(repoRoot, 'tmp-smoke-workspace'),
    decisionKey: 'materialize-fullstack-local-plan',
    contextHubStatus: availableContextHubStatus,
  })
  const failedPayload = buildExecutionFailedEventPayload({
    finalResponse: {
      ok: false,
      requestId: 'smoke-failed',
      error: 'Fallo controlado',
      failureType: 'scaffold-error',
      details: {
        decisionKey: 'materialize-fullstack-local-plan',
        strategy: 'materialize-fullstack-local-plan',
        executionMode: 'executor',
        createdPaths: ['C:/tmp/fullstack-demo/frontend/index.html'],
        touchedPaths: ['C:/tmp/fullstack-demo/jefe-project.json'],
        validationResults: [{ ok: true }, { ok: false }],
        recentFailures: [
          {
            timestamp: '2026-05-06T10:00:00.000Z',
            failureType: 'scaffold-error',
            currentAction: 'write-file',
            currentTargetPath: 'frontend/src/mock-data.js',
            materialState: 'failed',
          },
        ],
      },
    },
    requestId: 'smoke-failed',
    instruction: 'Materializar scaffold fullstack local.',
    workspacePath: path.join(repoRoot, 'tmp-smoke-workspace'),
    decisionKey: 'materialize-fullstack-local-plan',
    contextHubStatus: unavailableContextHubStatus,
  })

  if (availableContextHubStatus.available !== true) {
    failures.push('summarizeContextHubPackForLog deberia marcar available=true para un pack valido.')
  }
  if (unavailableContextHubStatus.available !== false || unavailableContextHubStatus.reason !== 'offline') {
    failures.push('summarizeContextHubPackForLog deberia preservar unavailable + reason cuando Context Hub no esta disponible.')
  }
  if (finishedPayload.contextHub?.available !== true) {
    failures.push('buildExecutionFinishedEventPayload deberia incluir contextHub disponible.')
  }
  if (finishedPayload.sourceWorkspaceRelativePath !== 'tmp-smoke-workspace') {
    failures.push(`buildExecutionFinishedEventPayload deberia incluir sourceWorkspaceRelativePath relativo. Recibido: ${finishedPayload.sourceWorkspaceRelativePath || '(vacio)'}.`)
  }
  if ((finishedPayload.files?.createdPaths || []).some((entry) => entry === 'item.started')) {
    failures.push('buildExecutionFinishedEventPayload deberia limpiar ruido tecnico de createdPaths.')
  }
  if (failedPayload.contextHub?.available !== false) {
    failures.push('buildExecutionFailedEventPayload deberia incluir contextHub unavailable cuando no hay MEMORIA.')
  }
  if ((failedPayload.failure?.recentFailures || []).length !== 1) {
    failures.push('buildExecutionFailedEventPayload deberia resumir recentFailures para el evento de error.')
  }

  return {
    testCase: {
      id: 'context-hub-event-helpers',
      label: 'Helpers de eventos Context Hub',
      goal: 'Validar payloads compactos y fallback best-effort para MEMORIA.',
    },
    ok: failures.length === 0,
    failures,
    strategy: 'helper',
    executionMode: 'local-test',
    nextExpectedAction: 'context-hub-event-ready',
  }
}

async function runContextHubClientHelpersValidation() {
  const failures = []
  const requests = []
  const originalContextHubApiUrl = process.env.CONTEXT_HUB_API_URL
  const fallbackUrls = Array.isArray(CONTEXT_HUB_API_URL_FALLBACKS)
    ? CONTEXT_HUB_API_URL_FALLBACKS
    : []
  let server
  let serverPort = 0

  try {
    server = await new Promise((resolve, reject) => {
      const instance = http.createServer((request, response) => {
        const requestUrl = new URL(request.url || '/', 'http://127.0.0.1')
        const chunks = []

        request.on('data', (chunk) => chunks.push(chunk))
        request.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf8')
          let parsedBody = null

          try {
            parsedBody = rawBody ? JSON.parse(rawBody) : null
          } catch {
            parsedBody = null
          }

          requests.push({
            method: request.method || 'GET',
            pathname: requestUrl.pathname,
            search: requestUrl.search,
            body: parsedBody,
          })

          response.setHeader('Content-Type', 'application/json; charset=utf-8')

          if (
            request.method === 'GET' &&
            requestUrl.pathname === '/v1/packs/suggested'
          ) {
            response.writeHead(200)
            response.end(
              JSON.stringify({
                ok: true,
                pack: {
                  id: 'pack-veterinaria-local',
                  slug: 'veterinaria-local',
                  title: 'Veterinaria local segura',
                  content: 'Pack compacto para la demo veterinaria.',
                  metadata: {
                    itemsCount: 3,
                    estimatedTokens: 240,
                  },
                },
              }),
            )
            return
          }

          if (request.method === 'POST' && requestUrl.pathname === '/v1/events') {
            response.writeHead(200)
            response.end(JSON.stringify({ ok: true, accepted: true }))
            return
          }

          response.writeHead(404)
          response.end(JSON.stringify({ ok: false, reason: 'not-found' }))
        })
      })

      instance.once('error', reject)
      instance.listen(0, '127.0.0.1', () => resolve(instance))
    })

    serverPort = server.address()?.port || 0
    process.env.CONTEXT_HUB_API_URL = `http://127.0.0.1:${serverPort}`

    const packResult = await fetchSuggestedContextHubPack()
    const eventResult = await emitContextHubEvent({
      type: 'planning_finished',
      source: 'ai-orchestrator',
      requestId: 'smoke-context-hub-client',
      decisionKey: 'prepare-project-phase-plan',
      status: 'ok',
    })

    if (!fallbackUrls.includes('http://127.0.0.1:3210')) {
      failures.push('CONTEXT_HUB_API_URL_FALLBACKS deberia priorizar 127.0.0.1:3210.')
    }
    if (packResult?.available !== true) {
      failures.push('fetchSuggestedContextHubPack deberia marcar available=true contra un API local valida.')
    }
    if (packResult?.pack?.id !== 'pack-veterinaria-local') {
      failures.push('fetchSuggestedContextHubPack deberia normalizar el pack devuelto por Context Hub.')
    }
    if (packResult?.endpoint !== '/v1/packs/suggested') {
      failures.push('fetchSuggestedContextHubPack deberia preservar el endpoint esperado.')
    }
    if (eventResult?.ok !== true) {
      failures.push('emitContextHubEvent deberia devolver ok=true cuando /v1/events responde 200.')
    }
    if (eventResult?.endpoint !== '/v1/events') {
      failures.push('emitContextHubEvent deberia reportar /v1/events como endpoint.')
    }

    const suggestedRequest = requests.find(
      (entry) =>
        entry.method === 'GET' && entry.pathname === '/v1/packs/suggested',
    )
    const eventRequest = requests.find(
      (entry) => entry.method === 'POST' && entry.pathname === '/v1/events',
    )

    if (!suggestedRequest) {
      failures.push('El helper cliente deberia consultar GET /v1/packs/suggested.')
    }
    if (!eventRequest) {
      failures.push('El helper cliente deberia emitir POST /v1/events.')
    } else {
      if (eventRequest.body?.type !== 'planning_finished') {
        failures.push('emitContextHubEvent deberia enviar el tipo de evento esperado.')
      }
      if (eventRequest.body?.requestId !== 'smoke-context-hub-client') {
        failures.push('emitContextHubEvent deberia preservar requestId en el payload.')
      }
    }
  } catch (error) {
    failures.push(
      `No se pudo validar el cliente local de Context Hub: ${
        error instanceof Error ? error.message : String(error)
      }.`,
    )
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve))
    }
    if (typeof originalContextHubApiUrl === 'string') {
      process.env.CONTEXT_HUB_API_URL = originalContextHubApiUrl
    } else {
      delete process.env.CONTEXT_HUB_API_URL
    }
  }

  return {
    testCase: {
      id: 'context-hub-client-helpers',
      label: 'Cliente local de Context Hub',
      goal: 'Validar GET /v1/packs/suggested y POST /v1/events del lado JEFE.',
    },
    ok: failures.length === 0,
    failures,
    strategy: 'helper',
    executionMode: 'local-test',
    nextExpectedAction: serverPort > 0 ? 'context-hub-client-ready' : 'context-hub-client-failed',
  }
}

async function runProjectContextHelpersValidation() {
  const fixtureRoot = path.join(smokeExecutionWorkspaceRoot, 'project-context-helper')
  ensureCleanDirectory(fixtureRoot)

  const logoPath = path.join(fixtureRoot, 'brand-logo.png')
  const assetsFolderPath = path.join(fixtureRoot, 'assets')
  const existingProjectPath = path.join(fixtureRoot, 'existing-react-app')
  fs.writeFileSync(logoPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]))
  fs.mkdirSync(assetsFolderPath, { recursive: true })
  fs.mkdirSync(path.join(existingProjectPath, 'src'), { recursive: true })
  fs.mkdirSync(path.join(existingProjectPath, 'components'), { recursive: true })
  fs.writeFileSync(
    path.join(existingProjectPath, 'package.json'),
    JSON.stringify(
      {
        name: 'existing-react-app',
        scripts: {
          dev: 'vite',
          build: 'vite build',
        },
        dependencies: {
          react: '^19.2.4',
          'react-dom': '^19.2.4',
        },
        devDependencies: {
          vite: '^8.0.4',
        },
      },
      null,
      2,
    ),
    'utf8',
  )
  fs.writeFileSync(path.join(existingProjectPath, 'vite.config.ts'), 'export default {}\n', 'utf8')
  fs.writeFileSync(path.join(existingProjectPath, 'src', 'main.tsx'), 'console.log("hello")\n', 'utf8')
  fs.writeFileSync(path.join(existingProjectPath, '.env'), 'SECRET_TOKEN=hidden\n', 'utf8')
  fs.writeFileSync(path.join(existingProjectPath, 'Dockerfile'), 'FROM node:24\n', 'utf8')

  const attachedInputs = buildAttachedInputMetadataList([logoPath, assetsFolderPath], {
    status: 'referenced',
  })
  const existingProjectContext = analyzeExistingProject(existingProjectPath)
  const strategicInput = plannerApi.buildStrategicBrainInput({
    goal: 'Continuar un proyecto existente con assets ya entregados.',
    context: 'Usar un logo y una carpeta de assets como contexto.',
    workspacePath: fixtureRoot,
    attachedInputs,
    existingProjectContext,
    projectWorkMode: 'continue-existing',
  })
  const failures = []

  if (attachedInputs.length !== 2) {
    failures.push('La metadata de insumos deberia conservar archivo y carpeta adjuntos.')
  }
  if (!attachedInputs.some((entry) => entry.kind === 'file' && entry.inferredRole === 'logo')) {
    failures.push('La metadata del logo adjunto no deberia perder el rol inferido logo.')
  }
  if (!attachedInputs.some((entry) => entry.kind === 'folder')) {
    failures.push('La carpeta de assets deberia registrarse como folder.')
  }
  if (attachedInputs.some((entry) => 'content' in entry || 'buffer' in entry)) {
    failures.push('La metadata adjunta no deberia incluir contenido binario.')
  }
  if (existingProjectContext.framework !== 'Vite + React') {
    failures.push(
      `El analisis del proyecto existente deberia detectar Vite + React. Recibido: ${existingProjectContext.framework || '(vacio)'}.`,
    )
  }
  if (!existingProjectContext.protectedFilesDetected.some((entry) => entry.endsWith('.env'))) {
    failures.push('El analisis deberia detectar .env sin leer su contenido.')
  }
  if (!existingProjectContext.scripts.some((entry) => entry.name === 'dev')) {
    failures.push('El analisis deberia exponer scripts de package.json en modo read-only.')
  }
  if (!strategicInput.existingProjectContext?.selectedPath) {
    failures.push('buildStrategicBrainInput deberia incluir existingProjectContext.')
  }
  if (!Array.isArray(strategicInput.attachedInputs) || strategicInput.attachedInputs.length !== 2) {
    failures.push('buildStrategicBrainInput deberia incluir attachedInputs completos.')
  }
  if (strategicInput.projectWorkMode !== 'continue-existing') {
    failures.push('buildStrategicBrainInput deberia preservar projectWorkMode.')
  }
  if (
    !Array.isArray(strategicInput.securityConstraints) ||
    strategicInput.securityConstraints.length === 0
  ) {
    failures.push('buildStrategicBrainInput deberia adjuntar securityConstraints.')
  }

  return {
    testCase: {
      id: 'project-context-helpers',
      label: 'Metadata de insumos y analisis read-only del proyecto existente',
      goal: strategicInput.goal,
      context: strategicInput.context,
    },
    ok: failures.length === 0,
    failures,
  }
}

async function runSelectedExistingProjectContinuationValidation() {
  const fixtureRoot = path.join(smokeExecutionWorkspaceRoot, 'selected-existing-project')
  ensureCleanDirectory(fixtureRoot)
  const selectedProjectPath = path.join(fixtureRoot, 'legacy-admin-panel')
  fs.mkdirSync(path.join(selectedProjectPath, 'src'), { recursive: true })
  fs.writeFileSync(
    path.join(selectedProjectPath, 'package.json'),
    JSON.stringify(
      {
        name: 'legacy-admin-panel',
        scripts: {
          dev: 'vite',
        },
        dependencies: {
          react: '^19.2.4',
        },
        devDependencies: {
          vite: '^8.0.4',
        },
      },
      null,
      2,
    ),
    'utf8',
  )
  fs.writeFileSync(path.join(selectedProjectPath, 'src', 'App.tsx'), 'export default function App() { return null }\n', 'utf8')
  fs.writeFileSync(path.join(selectedProjectPath, '.env.local'), 'PRIVATE_TOKEN=hidden\n', 'utf8')

  const existingProjectContext = analyzeExistingProject(selectedProjectPath)
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: 'Continuar el proyecto existente seleccionado y llevarlo hacia un panel operativo mas claro.',
    context:
      'Tengo esta carpeta ya empezada y quiero que JEFE la continue sin ejecutar npm, sin tocar .env y sin instalar dependencias.',
    workspacePath: fixtureRoot,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'balanced',
    attachedInputs: [],
    existingProjectContext,
    projectWorkMode: 'continue-existing',
    reusablePlanningContext: buildReusablePlanningContext(),
  })
  const failures = []

  if (decision?.strategy !== 'prepare-continuation-action-plan') {
    failures.push('La seleccion explicita de proyecto existente deberia forzar prepare-continuation-action-plan en esta V1 segura.')
  }
  if (decision?.executionMode !== 'planner-only') {
    failures.push('La continuidad del proyecto seleccionado deberia quedar en planner-only.')
  }
  if (decision?.nextActionPlan?.targetStrategy !== 'prepare-continuation-action-plan') {
    failures.push('nextActionPlan deberia apuntar a prepare-continuation-action-plan.')
  }
  if (decision?.existingProjectDetection?.detected !== true) {
    failures.push('existingProjectDetection deberia registrar la carpeta seleccionada.')
  }
  if (decision?.existingProjectDetection?.applicable !== true) {
    failures.push('existingProjectDetection deberia marcar la carpeta seleccionada como aplicable.')
  }
  if (decision?.activeProjectContext?.mode !== 'existing-project') {
    failures.push('activeProjectContext deberia quedar como existing-project.')
  }
  if (
    normalizePathForComparison(decision?.continuationActionPlan?.projectRoot || '') !==
    normalizePathForComparison(selectedProjectPath)
  ) {
    failures.push('continuationActionPlan.projectRoot deberia apuntar a la carpeta seleccionada.')
  }
  if (decision?.materializationPlan) {
    failures.push('La continuidad seleccionada en V1 no deberia devolver materializationPlan.')
  }
  if (decision?.localProjectManifest) {
    failures.push('La continuidad sobre un proyecto externo no deberia inventar localProjectManifest de JEFE.')
  }

  return {
    testCase: {
      id: 'selected-existing-project-continuation',
      label: 'Continuidad segura de una carpeta seleccionada manualmente',
      goal: 'Continuar el proyecto existente seleccionado',
      context: selectedProjectPath,
    },
    ok: failures.length === 0,
    failures,
    strategy: decision?.strategy || '',
    executionMode: decision?.executionMode || '',
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

async function runRechargeMaterializationDomainPurityValidation() {
  const testCase = activeCases.find((entry) => entry.id === 'pedidos-recarga')
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'recharge-materialization-domain-purity',
        label: 'Materializacion limpia para pedidos de recarga',
        goal: '',
      },
      ok: false,
      failures: ['No se encontro el caso base de pedidos-recarga para la regresion.'],
    }
  }

  const structures = buildCaseStructures(testCase)
  const materializationPlan = buildGenericSafeFirstDeliveryMaterializationPlan({
    decisionKey: 'materialize-safe-first-delivery-plan',
    instruction: structures.materializePlan?.instruction || '',
    executionScope: structures.materializePlan?.executionScope || {},
    businessSector: structures.domainUnderstanding?.intentLabel || '',
    businessSectorLabel: structures.domainUnderstanding?.domainLabel || '',
    safeFirstDeliveryMaterialization:
      structures.materializePlan?.safeFirstDeliveryMaterialization || null,
  })

  if (!materializationPlan) {
    return {
      testCase,
      ok: false,
      failures: ['No se pudo construir el materializationPlan de pedidos de recarga.'],
    }
  }

  const workspacePath = path.join(smokeExecutionWorkspaceRoot, 'recharge-materialization-domain-purity')
  ensureCleanDirectory(workspacePath)

  const task = buildLocalMaterializationTask({
    plan: materializationPlan,
    workspacePath,
    requestId: 'smoke-recharge-materialization-domain-purity',
    instruction: structures.materializePlan?.instruction || '',
    brainStrategy: 'materialize-safe-first-delivery-plan',
    businessSector: structures.domainUnderstanding?.intentLabel || '',
    businessSectorLabel: structures.domainUnderstanding?.domainLabel || '',
    materializationPlanSource: 'planner-smoke',
  })

  if (!task) {
    return {
      testCase,
      ok: false,
      failures: ['No se pudo construir la tarea local deterministica de pedidos de recarga.'],
    }
  }

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    return {
      testCase,
      ok: false,
      failures: [
        `La materializacion local fallo: ${executionResult?.error || 'sin detalle'}.`,
      ],
    }
  }

  const expectedFolder = path.join(workspacePath, 'safe-first-delivery-pedidos-recarga')
  const expectedFiles = ['index.html', 'styles.css', 'script.js', 'mock-data.json']
  const forbiddenTokens = [
    'operaciones portuarias',
    'muelles',
    'arribos',
    'salidas',
    'reservas',
    'checkout real',
    'pagos reales',
    'venta directa',
  ]
  const requiredTokens = [
    'pedidos de recarga',
    'clientes',
    'dispositivos',
    'devolucion',
  ]

  if (!fs.existsSync(expectedFolder)) {
    failures.push('La materializacion no creo safe-first-delivery-pedidos-recarga.')
  }

  for (const basename of expectedFiles) {
    const filePath = path.join(expectedFolder, basename)
    if (!fs.existsSync(filePath)) {
      failures.push(`Falta el archivo generado ${basename}.`)
      continue
    }

    const content = fs.readFileSync(filePath, 'utf8')
    forbiddenTokens.forEach((token) => {
      if (normalizeText(content).includes(normalizeText(token))) {
        failures.push(`${basename} quedo contaminado con "${token}".`)
      }
    })
  }

  const mockDataPath = path.join(expectedFolder, 'mock-data.json')
  if (fs.existsSync(mockDataPath)) {
    const mockDataContent = fs.readFileSync(mockDataPath, 'utf8')
    requiredTokens.forEach((token) => {
      if (!normalizeText(mockDataContent).includes(normalizeText(token))) {
        failures.push(`mock-data.json deberia mencionar ${token}.`)
      }
    })
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
  }
}

async function runSoccerEcommerceApprovalContinuationValidation() {
  const testCase = activeCases.find((entry) => entry.id === 'ecommerce-pelotas-futbol')
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'soccer-ecommerce-approval-continuation',
        label: 'Approval local para ecommerce de pelotas',
        goal: '',
      },
      ok: false,
      failures: ['No se encontro el caso base ecommerce-pelotas-futbol para la regresion.'],
    }
  }

  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con una entrega local, mock y segura para esta tienda online.',
      approvalReason:
        'El usuario no autoriza deploy ni publicacion real, pero quiere seguir con la entrega local mock.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      freeAnswer:
        'No quiero publicar ni desplegar esta web fuera del entorno local. Quiero seguir solo local, mock y seguro, usable por file://, sin deploy, sin publicacion real, sin pagos reales, sin base de datos real, sin credenciales y sin integraciones externas. El carrito y el checkout deben ser solamente simulados.',
    })

  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: approvalFeedback,
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'smart',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  if (
    decision?.strategy !== 'safe-first-delivery-plan' &&
    decision?.strategy !== 'materialize-safe-first-delivery-plan'
  ) {
    failures.push(
      `La continuidad post-approval deberia volver a una ruta segura local. Recibido: ${
        decision?.strategy || '(vacio)'
      }.`,
    )
  }
  if (normalizeText(decision?.reason || '').includes('executor')) {
    failures.push('La razon de la continuidad post-approval no deberia caer otra vez en executor-general.')
  }

  const domainSummary = normalizeText(
    [
      decision?.domainUnderstanding?.domainLabel,
      ...(Array.isArray(decision?.domainUnderstanding?.primaryModules)
        ? decision.domainUnderstanding.primaryModules
        : []),
      ...(Array.isArray(decision?.domainUnderstanding?.coreFlows)
        ? decision.domainUnderstanding.coreFlows
        : []),
      ...(Array.isArray(decision?.domainUnderstanding?.localActions)
        ? decision.domainUnderstanding.localActions
        : []),
      decision?.instruction,
    ]
      .filter(Boolean)
      .join(' '),
  )

  ;['reservas', 'flujo de reservas', 'agenda inicial', 'profesionales mock'].forEach(
    (token) => {
    if (domainSummary.includes(normalizeText(token))) {
      failures.push(`La replanificacion post-approval quedo contaminada con "${token}".`)
    }
    },
  )

  ;['pelotas', 'catalogo', 'carrito', 'checkout simulado'].forEach((token) => {
    if (!domainSummary.includes(normalizeText(token))) {
      failures.push(`La replanificacion post-approval deberia preservar ${token}.`)
    }
  })

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy: decision?.strategy || '',
    nextExpectedAction: decision?.nextExpectedAction || '',
  }
}

async function runLogisticsFullstackApprovalContinuationValidation() {
  const testCase = scalableValidationCases.find(
    (entry) => entry.id === 'tracking-logistico-fullstack-local',
  )
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'tracking-logistico-fullstack-post-approval',
        label: 'Tracking logistico fullstack post approval',
        goal: '',
      },
      ok: false,
      failures: [
        'No se encontro el caso base tracking-logistico-fullstack-local para la regresion.',
      ],
    }
  }

  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
      approvalReason:
        'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      selectedOption: 'No deploy',
      freeAnswer:
        'No deploy. Seguir local. Backend local y base local SQLite permitidos. No externos.',
    })

  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: approvalFeedback,
    requiresApproval: true,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null
  const projectReadinessState =
    decision?.projectReadinessState && typeof decision.projectReadinessState === 'object'
      ? decision.projectReadinessState
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
  const scalableDeliveryPlan =
    decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
      ? decision.scalableDeliveryPlan
      : null
  const planFiles = Array.isArray(scalableDeliveryPlan?.filesToCreate)
    ? scalableDeliveryPlan.filesToCreate.map((entry) => String(entry?.path || '').trim())
    : []
  const planDirectories = Array.isArray(scalableDeliveryPlan?.directories)
    ? scalableDeliveryPlan.directories.map((entry) => String(entry || '').trim())
    : []
  const planStructure = Array.isArray(scalableDeliveryPlan?.targetStructure)
    ? scalableDeliveryPlan.targetStructure.map((entry) => String(entry || '').trim())
    : []
  const planAllowedRoots = Array.isArray(scalableDeliveryPlan?.allowedRootPaths)
    ? scalableDeliveryPlan.allowedRootPaths.map((entry) => String(entry || '').trim())
    : []
  const readinessApprovalAreas = Array.isArray(projectReadinessState?.approvalRequiredAreas)
    ? projectReadinessState.approvalRequiredAreas.map((entry) => String(entry || '').trim())
    : []
  const readinessPlannerOnlyAreas = Array.isArray(projectReadinessState?.plannerOnlyAreas)
    ? projectReadinessState.plannerOnlyAreas.map((entry) => String(entry || '').trim())
    : []
  const runtimeApprovalPreviewTokens = [
    ...(Array.isArray(decision?.runtimeApprovalState?.commandsPreview)
      ? decision.runtimeApprovalState.commandsPreview
      : []),
    ...(Array.isArray(decision?.approvalRequestPlan?.commandsPreview)
      ? decision.approvalRequestPlan.commandsPreview
      : []),
  ].map((entry) => String(entry || '').trim())
  const planTargetSummary = [
    localProjectManifest?.projectRoot,
    ...planAllowedRoots,
    ...planDirectories,
    ...planStructure,
    ...planFiles,
  ]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
  const domainSummary = normalizeText(
    [
      decision?.reason,
      decision?.instruction,
      decision?.domainUnderstanding?.domainLabel,
      ...(Array.isArray(decision?.domainUnderstanding?.primaryModules)
        ? decision.domainUnderstanding.primaryModules
        : []),
      ...(Array.isArray(decision?.domainUnderstanding?.primaryEntities)
        ? decision.domainUnderstanding.primaryEntities
        : []),
      ...(Array.isArray(decision?.domainUnderstanding?.coreFlows)
        ? decision.domainUnderstanding.coreFlows
        : []),
    ]
      .filter(Boolean)
      .join(' '),
  )

  if (strategy === 'web-scaffold-base') {
    failures.push('La continuidad post-approval fullstack no debe degradar a web-scaffold-base.')
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `executionMode incorrecto. Esperado: planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-scalable-delivery') {
    failures.push(
      `nextExpectedAction incorrecto. Esperado: review-scalable-delivery. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (strategy !== 'scalable-delivery-plan') {
    failures.push(
      `La continuidad post-approval fullstack deberia seguir en scalable-delivery-plan. Recibido: ${strategy || '(vacio)'}.`,
    )
  }
  if (
    String(decision?.businessSector || '').trim() &&
    String(decision?.businessSector || '').trim() !== 'logistics'
  ) {
    failures.push(
      `businessSector incorrecto. Esperado: logistics. Recibido: ${decision?.businessSector || '(vacio)'}.`,
    )
  }
  if (String(scalableDeliveryPlan?.deliveryLevel || '').trim() !== 'fullstack-local') {
    failures.push('scalableDeliveryPlan.deliveryLevel deberia ser fullstack-local.')
  }
  if (decision?.materializationPlan && typeof decision.materializationPlan === 'object') {
    failures.push('No deberia haber materializationPlan ejecutable en la continuidad post-approval fullstack.')
  }
  if (decision?.approvalRequest) {
    failures.push('No deberia quedar approvalRequest pendiente despues de la aprobacion humana.')
  }
  if (String(decision?.question || '').trim()) {
    failures.push('No deberia quedar una question de aprobacion pendiente despues de la aprobacion humana.')
  }
  if (decision?.approvalRequestPlan) {
    failures.push('No deberia quedar approvalRequestPlan pendiente despues de la aprobacion humana.')
  }
  if (decision?.runtimeApprovalState) {
    failures.push('No deberia quedar runtimeApprovalState pendiente despues de la aprobacion humana.')
  }
  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en la continuidad post-approval fullstack.')
  } else {
    if (String(nextActionPlan.actionType || '').trim() === 'request-approval') {
      failures.push('nextActionPlan no debe quedar en request-approval despues de la aprobacion humana.')
    }
    if (nextActionPlan.requiresApproval === true) {
      failures.push('nextActionPlan.requiresApproval no debe quedar en true despues de la aprobacion humana.')
    }
    if (
      String(nextActionPlan.targetStrategy || '').trim() !==
      'materialize-fullstack-local-plan'
    ) {
      failures.push('nextActionPlan.targetStrategy deberia seguir apuntando a materialize-fullstack-local-plan.')
    }
    if (
      normalizeText(nextActionPlan.userFacingLabel || '').includes(
        normalizeText('Resolver aprobación sensible'),
      )
    ) {
      failures.push('nextActionPlan no deberia pedir Resolver aprobacion sensible como accion actual.')
    }
  }
  if (!projectReadinessState) {
    failures.push('projectReadinessState ausente en la continuidad post-approval fullstack.')
  } else {
    const runtimeReadiness = String(projectReadinessState.runtimeReadiness || '').trim()
    const nextBestAction = projectReadinessState.nextBestAction || null
    if (runtimeReadiness === 'approval-preview' || runtimeReadiness === 'approval-pending') {
      failures.push(`runtimeReadiness no deberia quedar en approval-preview/pending. Recibido: ${runtimeReadiness}.`)
    }
    if (
      readinessApprovalAreas.some((entry) =>
        normalizeText(entry).includes(normalizeText('Resolver aprobación sensible')),
      )
    ) {
      failures.push('projectReadinessState no deberia exponer Resolver aprobacion sensible como area actual.')
    }
    if (
      readinessPlannerOnlyAreas.length > 0 &&
      !readinessPlannerOnlyAreas.some((entry) =>
        normalizeText(entry).includes(normalizeText('Preparar materialización fullstack local')),
      )
    ) {
      failures.push('projectReadinessState deberia seguir mostrando la revision fullstack local como planner-only area.')
    }
    if (nextBestAction) {
      if (nextBestAction.requiresApproval === true) {
        failures.push('projectReadinessState.nextBestAction no debe requerir aprobacion.')
      }
      if (String(nextBestAction.targetStrategy || '').trim() !== 'materialize-fullstack-local-plan') {
        failures.push('projectReadinessState.nextBestAction deberia seguir apuntando a materialize-fullstack-local-plan.')
      }
      if (
        normalizeText(nextBestAction.title || nextBestAction.description || '').includes(
          normalizeText('Resolver aprobación sensible'),
        )
      ) {
        failures.push('projectReadinessState.nextBestAction no deberia volver a Resolver aprobacion sensible.')
      }
    }
  }
  if (projectContinuationState?.nextRecommendedAction?.requiresApproval === true) {
    failures.push('projectContinuationState.nextRecommendedAction no deberia requerir aprobacion en la continuidad local.')
  }
  if (
    runtimeApprovalPreviewTokens.some((entry) =>
      normalizeText(entry).includes(normalizeText('gateway de pagos')),
    )
  ) {
    failures.push('commandsPreview no deberia mencionar gateway de pagos en la continuidad local.')
  }
  if (
    runtimeApprovalPreviewTokens.some((entry) =>
      normalizeText(entry).includes(normalizeText('webhooks')),
    )
  ) {
    failures.push('commandsPreview no deberia mencionar webhooks reales en la continuidad local.')
  }
  if (
    !planTargetSummary.some((entry) =>
      normalizeText(entry).includes(normalizeText('logitrack-local-v1')),
    )
  ) {
    failures.push('El plan fullstack local deberia targetear logitrack-local-v1.')
  }
  if (
    String(localProjectManifest?.projectRoot || '').trim() &&
    String(localProjectManifest?.projectRoot || '').trim() !== 'logitrack-local-v1'
  ) {
    failures.push(
      `localProjectManifest.projectRoot incorrecto. Esperado: logitrack-local-v1. Recibido: ${
        localProjectManifest?.projectRoot || '(vacio)'
      }.`,
    )
  }
  if (
    normalizeText(
      [
        decision?.approvalRequest?.decisionKey,
        decision?.approvalRequestPlan?.approvalType,
        decision?.runtimeApprovalState?.actionId,
        decision?.runtimeApprovalState?.relatedReadinessArea,
      ]
        .filter(Boolean)
        .join(' '),
    ).includes(normalizeText('approve-public-deploy'))
  ) {
    failures.push('No deberia quedar approve-public-deploy activo en la continuidad local.')
  }

  ;['envios', 'clientes', 'direcciones', 'estados', 'incidencias'].forEach((token) => {
    if (!domainSummary.includes(normalizeText(token))) {
      failures.push(`La continuidad post-approval deberia preservar ${token}.`)
    }
  })

  ;[
    'web-scaffold-base',
    'landing',
    'hero principal',
    'index.html',
    'styles.css',
    'script.js',
    'materializar la carpeta',
    'web-sistema-de-tracking-logistico',
  ].forEach((token) => {
    if (domainSummary.includes(normalizeText(token))) {
      failures.push(`La continuidad post-approval no deberia contaminarse con ${token}.`)
    }
  })
  ;[
    'frontend/admin',
    'frontend/public',
    'database/schema.sql',
    'database/seed.sql',
    'docs/api.md',
    'docs/db_schema.md',
  ].forEach((token) => {
    const normalizedToken = normalizePathForComparison(token)
    const presentInPlan =
      planFiles.some((entry) => normalizePathForComparison(entry).includes(normalizedToken)) ||
      planDirectories.some((entry) => normalizePathForComparison(entry).includes(normalizedToken)) ||
      planStructure.some((entry) => normalizePathForComparison(entry).includes(normalizedToken))

    if (!presentInPlan) {
      failures.push(`La continuidad post-approval deberia conservar ${token} en el plan fullstack visible.`)
    }
  })

  return {
    testCase: {
      ...testCase,
      id: 'tracking-logistico-fullstack-post-approval-ui-state',
      label: 'Tracking logistico fullstack post approval UI state',
    },
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runLogisticsFullstackOpenAIWebScaffoldGuardValidation() {
  const testCase = scalableValidationCases.find(
    (entry) => entry.id === 'tracking-logistico-fullstack-local',
  )
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'tracking-logistico-fullstack-openai-web-scaffold-guard',
        label: 'Tracking logistico fullstack OpenAI web scaffold guard',
        goal: '',
      },
      ok: false,
      failures: [
        'No se encontro el caso base tracking-logistico-fullstack-local para la regresion OpenAI.',
      ],
    }
  }

  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
      approvalReason:
        'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      selectedOption: 'No deploy',
      freeAnswer:
        'No quiero publicar ni desplegar. Seguir local con backend local, API local y SQLite/base local. No externos.',
    })

  const strategicInput = plannerApi.buildStrategicBrainInput({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: approvalFeedback,
    requiresApproval: true,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const contaminatedOpenAIDecision = {
    ok: true,
    decisionKey: 'web-scaffold-base',
    strategy: 'web-scaffold-base',
    executionMode: 'executor',
    requiresApproval: false,
    question:
      'Queres publicar o desplegar esta solucion antes de seguir con la materializacion?',
    approvalRequest: {
      decisionKey: 'approve-public-deploy',
      reason: 'La salida publica requiere aprobacion humana.',
      question: 'Antes de publicar o desplegar, necesito una decision humana.',
      allowFreeAnswer: true,
      allowBrainDefault: false,
      nextExpectedAction: 'user-approval',
    },
    instruction:
      'Rediseñar la landing y materializar la carpeta web-sistema-de-tracking-logistico con index.html, styles.css y script.js.',
    nextExpectedAction: 'execute-plan',
    tasks: [
      {
        step: 1,
        title: 'Crear index principal',
        operation: 'create-file',
        targetPath: 'web-sistema-de-tracking-logistico/index.html',
      },
      {
        step: 2,
        title: 'Crear estilos',
        operation: 'create-file',
        targetPath: 'web-sistema-de-tracking-logistico/styles.css',
      },
      {
        step: 3,
        title: 'Crear script principal',
        operation: 'create-file',
        targetPath: 'web-sistema-de-tracking-logistico/script.js',
      },
    ],
    materializationPlan: {
      projectRoot: 'web-sistema-de-tracking-logistico',
      allowedTargetPaths: ['web-sistema-de-tracking-logistico'],
      operations: [
        {
          type: 'create-file',
          targetPath: 'web-sistema-de-tracking-logistico/index.html',
          purpose: 'Landing principal',
        },
      ],
    },
  }

  const decision = await plannerApi.normalizeOpenAIBrainDecision(
    contaminatedOpenAIDecision,
    strategicInput,
  )

  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const instruction = String(decision?.instruction || '').trim()
  const localProjectManifest =
    decision?.localProjectManifest && typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null
  const scalableDeliveryPlan =
    decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
      ? decision.scalableDeliveryPlan
      : null
  const runtimeApprovalPreviewTokens = [
    ...(Array.isArray(decision?.runtimeApprovalState?.commandsPreview)
      ? decision.runtimeApprovalState.commandsPreview
      : []),
    ...(Array.isArray(decision?.approvalRequestPlan?.commandsPreview)
      ? decision.approvalRequestPlan.commandsPreview
      : []),
  ].map((entry) => String(entry || '').trim())
  const planTargetSummary = [
    localProjectManifest?.projectRoot,
    ...(Array.isArray(scalableDeliveryPlan?.allowedRootPaths)
      ? scalableDeliveryPlan.allowedRootPaths
      : []),
    ...(Array.isArray(scalableDeliveryPlan?.targetDirectories)
      ? scalableDeliveryPlan.targetDirectories
      : []),
    ...(Array.isArray(scalableDeliveryPlan?.targetFiles)
      ? scalableDeliveryPlan.targetFiles
      : []),
    ...(Array.isArray(scalableDeliveryPlan?.targetStructure)
      ? scalableDeliveryPlan.targetStructure
      : []),
  ]
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
  const normalizedInstruction = normalizeText(instruction)
  const normalizedTargetSummary = normalizeText(planTargetSummary.join(' '))

  if (strategy !== 'scalable-delivery-plan') {
    failures.push(
      `La respuesta OpenAI contaminada deberia normalizar a scalable-delivery-plan. Recibido: ${strategy || '(vacio)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `La respuesta OpenAI contaminada deberia normalizar a planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-scalable-delivery') {
    failures.push(
      `La respuesta OpenAI contaminada deberia volver a review-scalable-delivery. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (decision?.requiresApproval === true || decision?.approvalRequest) {
    failures.push('No deberia quedar approvalRequest pendiente despues de la respuesta humana no deploy.')
  }
  if (decision?.runtimeApprovalState || decision?.approvalRequestPlan) {
    failures.push('No deberia quedar runtimeApprovalState ni approvalRequestPlan activos despues del guard.')
  }
  if (String(decision?.decisionKey || '').trim() === 'web-scaffold-base') {
    failures.push('No deberia quedar decisionKey web-scaffold-base despues del guard.')
  }
  if (normalizedInstruction.includes(normalizeText('rediseñar la landing'))) {
    failures.push('La instruction final no deberia conservar la landing contaminada.')
  }
  if (normalizedInstruction.includes(normalizeText('index.html'))) {
    failures.push('La instruction final no deberia caer en index.html como salida principal.')
  }
  if (normalizedTargetSummary.includes(normalizeText('web-sistema-de-tracking-logistico'))) {
    failures.push('El target final no deberia quedar en web-sistema-de-tracking-logistico.')
  }
  if (
    !planTargetSummary.some((entry) =>
      normalizeText(entry).includes(normalizeText('logitrack-local-v1')),
    )
  ) {
    failures.push('El guard deberia preservar logitrack-local-v1 como project root.')
  }
  ;[
    'backend/',
    'frontend/admin',
    'frontend/public',
    'database',
    'docs',
  ].forEach((token) => {
    if (!normalizedTargetSummary.includes(normalizeText(token))) {
      failures.push(`El guard deberia preservar ${token} en el plan fullstack local.`)
    }
  })
  if (
    runtimeApprovalPreviewTokens.some((entry) =>
      normalizeText(entry).includes(normalizeText('gateway de pagos')),
    )
  ) {
    failures.push('commandsPreview no deberia mencionar gateway de pagos despues del guard.')
  }
  if (
    runtimeApprovalPreviewTokens.some((entry) =>
      normalizeText(entry).includes(normalizeText('webhooks')),
    )
  ) {
    failures.push('commandsPreview no deberia mencionar webhooks despues del guard.')
  }

  return {
    testCase: {
      ...testCase,
      id: 'tracking-logistico-fullstack-openai-web-scaffold-guard',
      label: 'Tracking logistico fullstack OpenAI web scaffold guard',
    },
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runLogisticsFullstackTimeoutFallbackNoWebScaffoldValidation() {
  const testCase = scalableValidationCases.find(
    (entry) => entry.id === 'tracking-logistico-fullstack-local',
  )
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'tracking-logistico-fullstack-timeout-fallback-no-web-scaffold',
        label: 'Tracking logistico fullstack timeout fallback no web scaffold',
        goal: '',
      },
      ok: false,
      failures: [
        'No se encontro el caso base tracking-logistico-fullstack-local para la regresion de timeout/fallback.',
      ],
    }
  }

  const timeoutFeedback =
    'OpenAI superó el timeout configurado para el Cerebro (~62000 ms, limite 60000 ms).'
  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: `${testCase.context}\n\nNo landing. No demo solamente visual. No web scaffold.`,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 1,
    previousExecutionResult: timeoutFeedback,
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const instruction = normalizeText(String(decision?.instruction || '').trim())
  const scalableDeliveryPlan =
    decision?.scalableDeliveryPlan && typeof decision.scalableDeliveryPlan === 'object'
      ? decision.scalableDeliveryPlan
      : null
  const planTargetSummary = normalizeText(
    [
      decision?.decisionKey,
      decision?.strategy,
      decision?.instruction,
      scalableDeliveryPlan?.projectRoot,
      ...(Array.isArray(scalableDeliveryPlan?.allowedRootPaths)
        ? scalableDeliveryPlan.allowedRootPaths
        : []),
      ...(Array.isArray(scalableDeliveryPlan?.targetDirectories)
        ? scalableDeliveryPlan.targetDirectories
        : []),
      ...(Array.isArray(scalableDeliveryPlan?.targetFiles)
        ? scalableDeliveryPlan.targetFiles
        : []),
      ...(Array.isArray(scalableDeliveryPlan?.targetStructure)
        ? scalableDeliveryPlan.targetStructure
        : []),
    ]
      .filter(Boolean)
      .join(' '),
  )

  if (strategy !== 'scalable-delivery-plan') {
    failures.push(
      `El fallback local-rules post-timeout deberia volver a scalable-delivery-plan. Recibido: ${strategy || '(vacio)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push(
      `El fallback local-rules post-timeout deberia quedar en planner-only. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== 'review-scalable-delivery') {
    failures.push(
      `El fallback local-rules post-timeout deberia volver a review-scalable-delivery. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
  }
  if (String(decision?.decisionKey || '').trim() === 'web-scaffold-base') {
    failures.push('El fallback local-rules no deberia volver a decisionKey web-scaffold-base.')
  }
  if (decision?.materializationPlan && typeof decision.materializationPlan === 'object') {
    failures.push('El fallback local-rules post-timeout no deberia devolver materializationPlan de landing.')
  }
  if (instruction.includes(normalizeText('landing'))) {
    failures.push('La instruction post-timeout no deberia degradar a landing.')
  }
  if (planTargetSummary.includes(normalizeText('web-sistema-de-tracking'))) {
    failures.push('El fallback post-timeout no deberia targetear web-sistema-de-tracking.')
  }
  if (planTargetSummary.includes(normalizeText('index.html'))) {
    failures.push('El fallback post-timeout no deberia dejar index.html como salida principal.')
  }

  return {
    testCase: {
      ...testCase,
      id: 'tracking-logistico-fullstack-timeout-fallback-no-web-scaffold',
      label: 'Tracking logistico fullstack timeout fallback no web scaffold',
    },
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runLogisticsFullstackExecutorBlocksWebScaffoldValidation() {
  const failures = []
  const guardDecision = plannerApi.shouldBlockWebScaffoldExecutionForFullstackRequest({
    goal:
      'Sistema fullstack local de tracking logistico con backend local, SQLite local, API local, frontend administrativo y consulta publica por codigo.',
    context:
      'El sistema debe manejar entidades, relaciones, envios, historial de eventos, incidencias y reportes basicos. No landing. No demo visual solamente.',
    decisionKey: 'web-scaffold-base',
    strategy: 'web-scaffold-base',
    instruction:
      'Rediseñar la landing y materializar la carpeta web-sistema-de-tracking-logistico con index.html, styles.css y script.js.',
    executionScope: {
      allowedTargetPaths: ['web-sistema-de-tracking-logistico/index.html'],
    },
    materializationPlan: {
      projectRoot: 'web-sistema-de-tracking-logistico',
      allowedTargetPaths: ['web-sistema-de-tracking-logistico'],
    },
  })
  const blockedResponse = plannerApi.buildBlockedFullstackWebScaffoldExecutionResponse({
    requestId: 'smoke-fullstack-block',
    instruction:
      'Rediseñar la landing y materializar la carpeta web-sistema-de-tracking-logistico con index.html, styles.css y script.js.',
    decisionKey: 'web-scaffold-base',
    context:
      'Backend local, SQLite local, API local, frontend administrativo y consulta publica por codigo.',
    executionScope: {
      allowedTargetPaths: ['web-sistema-de-tracking-logistico/index.html'],
    },
    materializationPlan: {
      projectRoot: 'web-sistema-de-tracking-logistico',
      allowedTargetPaths: ['web-sistema-de-tracking-logistico'],
    },
    reason: guardDecision.reason,
  })

  if (!guardDecision?.blocked) {
    failures.push('El executor safety gate deberia bloquear web-scaffold-base cuando el pedido original es fullstack fuerte.')
  }
  if (blockedResponse?.ok !== false) {
    failures.push('La respuesta bloqueada del executor deberia devolver ok:false.')
  }
  if (String(blockedResponse?.status || '').trim() !== 'blocked') {
    failures.push('La respuesta bloqueada del executor deberia devolver status: blocked.')
  }
  if (String(blockedResponse?.reason || '').trim() !== 'fullstack request cannot execute web scaffold') {
    failures.push('La respuesta bloqueada del executor deberia exponer el reason canonico.')
  }
  if (String(blockedResponse?.failureType || '').trim() !== 'blocked_fullstack_web_scaffold') {
    failures.push('La respuesta bloqueada del executor deberia marcar failureType blocked_fullstack_web_scaffold.')
  }
  if (Array.isArray(blockedResponse?.createdPaths) && blockedResponse.createdPaths.length > 0) {
    failures.push('Una ejecucion bloqueada no deberia reportar createdPaths.')
  }
  if (Array.isArray(blockedResponse?.touchedPaths) && blockedResponse.touchedPaths.length > 0) {
    failures.push('Una ejecucion bloqueada no deberia reportar touchedPaths.')
  }

  return {
    testCase: {
      id: 'tracking-logistico-fullstack-executor-blocks-web-scaffold',
      label: 'Tracking logistico fullstack executor blocks web scaffold',
      goal: 'Bloquear web scaffold degradado en executor',
    },
    ok: failures.length === 0,
    failures,
    strategy: 'web-scaffold-base',
    executionMode: 'executor',
    nextExpectedAction: 'blocked',
  }
}

async function runTrackingLogisticsValidMaterializationNotBlockedValidation() {
  const failures = []
  const guardDecision = plannerApi.shouldBlockWebScaffoldExecutionForFullstackRequest({
    goal:
      'Sistema fullstack local de tracking logistico con backend local, SQLite local, API local, frontend administrativo, frontend publico y consulta publica por codigo.',
    context:
      'Entidades y relaciones, envios, historial de eventos, incidencias y reportes basicos. No landing. No demo visual solamente.',
    decisionKey: 'materialize-fullstack-logistics-tracker-local-v1',
    strategy: 'materialize-fullstack-local-plan',
    instruction:
      'Materializar una entrega fullstack local valida con backend, database, frontend admin/public, shared, scripts y docs, sin deploy ni servicios externos.',
    executionScope: {
      allowedTargetPaths: [
        'logistics-tracker-local/backend',
        'logistics-tracker-local/frontend/admin',
        'logistics-tracker-local/frontend/public',
        'logistics-tracker-local/database',
        'logistics-tracker-local/docs',
        'logistics-tracker-local/shared',
        'logistics-tracker-local/scripts',
      ],
    },
    materializationPlan: {
      strategy: 'materialize-fullstack-local-plan',
      projectRoot: 'logistics-tracker-local',
      allowedTargetPaths: [
        'logistics-tracker-local/backend',
        'logistics-tracker-local/frontend/admin',
        'logistics-tracker-local/frontend/public',
        'logistics-tracker-local/database',
        'logistics-tracker-local/docs',
        'logistics-tracker-local/shared',
        'logistics-tracker-local/scripts',
      ],
      operations: [
        { targetPath: 'logistics-tracker-local/README.md' },
        { targetPath: 'logistics-tracker-local/backend/package.json' },
        { targetPath: 'logistics-tracker-local/backend/src/server.js' },
        { targetPath: 'logistics-tracker-local/backend/src/routes/shipments.js' },
        { targetPath: 'logistics-tracker-local/backend/src/routes/tracking.js' },
        { targetPath: 'logistics-tracker-local/database/schema.sql' },
        { targetPath: 'logistics-tracker-local/database/seed.sql' },
        { targetPath: 'logistics-tracker-local/frontend/public/index.html' },
        { targetPath: 'logistics-tracker-local/frontend/public/app.js' },
        { targetPath: 'logistics-tracker-local/frontend/admin/index.html' },
        { targetPath: 'logistics-tracker-local/frontend/admin/app.js' },
        { targetPath: 'logistics-tracker-local/frontend/admin/styles.css' },
        { targetPath: 'logistics-tracker-local/docs/API.md' },
        { targetPath: 'logistics-tracker-local/docs/ARCHITECTURE.md' },
        { targetPath: 'logistics-tracker-local/docs/api.md' },
        { targetPath: 'logistics-tracker-local/docs/db_schema.md' },
        { targetPath: 'logistics-tracker-local/docs/architecture.md' },
        { targetPath: 'logistics-tracker-local/shared/statuses.js' },
        { targetPath: 'logistics-tracker-local/scripts/seed-local.js' },
      ],
    },
  })
  const contractInspection = guardDecision?.contractInspection

  if (guardDecision?.blocked) {
    failures.push('Una materializacion fullstack valida no deberia bloquearse por el safety gate web scaffold.')
  }
  if (String(guardDecision?.reason || '').trim()) {
    failures.push('Una materializacion fullstack valida no deberia exponer reason de bloqueo.')
  }
  if (guardDecision?.looksLikeValidFullstackLocalMaterialization !== true) {
    failures.push('El guard deberia reconocer la estructura como fullstack local valida antes de decidir bloqueo.')
  }
  if (!contractInspection || contractInspection.ok !== true) {
    failures.push(
      `El guard deberia reutilizar un contrato canonico valido. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
    )
  }
  ;[
    'database/schema.sql',
    'database/seed.sql',
    'docs/API.md',
    'docs/DB_SCHEMA.md|docs/DATA_MODEL.md',
    'backend/src/routes/shipments.js',
    'backend/src/routes/tracking.js',
  ].forEach((token) => {
    const normalizedToken = normalizePathForComparison(token)
    const presentInContract =
      token.includes('|')
        ? token
            .split('|')
            .map((entry) => normalizePathForComparison(entry))
            .some((candidate) =>
              Array.isArray(contractInspection?.expectedTargetPaths) &&
              contractInspection.expectedTargetPaths.some((entry) =>
                normalizePathForComparison(entry).endsWith(candidate),
              ),
            )
        : Array.isArray(contractInspection?.expectedTargetPaths) &&
          contractInspection.expectedTargetPaths.some((entry) =>
            normalizePathForComparison(entry).endsWith(normalizedToken),
          )

    if (!presentInContract) {
      failures.push(`El contrato canonico deberia exigir ${token}.`)
    }
  })
  if (contractInspection?.usesJsonAsPrimaryPersistence) {
    failures.push('El contrato canonico no deberia marcar JSON como persistencia principal en una materializacion valida.')
  }

  return {
    testCase: {
      id: 'tracking-logistico-fullstack-valid-materialization-not-blocked',
      label: 'Tracking logistico fullstack valid materialization not blocked',
      goal: 'Permitir materializacion fullstack valida con frontend estatico dentro del scaffold',
    },
    ok: failures.length === 0,
    failures,
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
  }
}

async function runLogisticsFullstackPostApprovalNoWebBaseMaterializationValidation() {
  const testCase = scalableValidationCases.find(
    (entry) => entry.id === 'tracking-logistico-fullstack-local',
  )
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'tracking-logistico-fullstack-post-approval-does-not-materialize-web-base',
        label: 'Tracking logistico fullstack post approval does not materialize web base',
        goal: '',
      },
      ok: false,
      failures: [
        'No se encontro el caso base tracking-logistico-fullstack-local para la regresion post-approval.',
      ],
    }
  }

  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
      approvalReason:
        'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      selectedOption: 'No deploy',
      freeAnswer:
        'No quiero publicar ni desplegar. Seguir local con backend local y SQLite/base local. No externos.',
      error:
        'OpenAI superó el timeout configurado para el Cerebro (~62000 ms, limite 60000 ms).',
    })

  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: approvalFeedback,
    requiresApproval: true,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const planSummary = normalizeText(
    [
      decision?.instruction,
      decision?.decisionKey,
      decision?.strategy,
      decision?.materializationPlan?.projectRoot,
      ...(Array.isArray(decision?.materializationPlan?.allowedTargetPaths)
        ? decision.materializationPlan.allowedTargetPaths
        : []),
    ]
      .filter(Boolean)
      .join(' '),
  )

  if (strategy !== 'scalable-delivery-plan') {
    failures.push('La continuidad post-approval con timeout no deberia materializar ni salir de scalable-delivery-plan.')
  }
  if (executionMode !== 'planner-only') {
    failures.push('La continuidad post-approval con timeout deberia quedarse en planner-only.')
  }
  if (nextExpectedAction !== 'review-scalable-delivery') {
    failures.push('La continuidad post-approval con timeout deberia volver a review-scalable-delivery.')
  }
  if (decision?.materializationPlan && typeof decision.materializationPlan === 'object') {
    failures.push('La continuidad post-approval con timeout no deberia devolver materializationPlan ejecutable.')
  }
  if (planSummary.includes(normalizeText('web-sistema-de-tracking-logistico'))) {
    failures.push('La continuidad post-approval con timeout no deberia apuntar a web-sistema-de-tracking-logistico.')
  }
  if (planSummary.includes(normalizeText('index.html'))) {
    failures.push('La continuidad post-approval con timeout no deberia caer en index.html/styles.css/script.js.')
  }

  return {
    testCase: {
      ...testCase,
      id: 'tracking-logistico-fullstack-post-approval-does-not-materialize-web-base',
      label: 'Tracking logistico fullstack post approval does not materialize web base',
    },
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function requestTrackingLogisticsPreparedMaterializationDecision() {
  const testCase = scalableValidationCases.find(
    (entry) => entry.id === 'tracking-logistico-fullstack-local',
  )

  if (!testCase) {
    return {
      testCase: {
        id: 'tracking-logistico-fullstack-prepare-functional-delivery-transition',
        label: 'Tracking logistico fullstack prepare functional delivery transition',
        goal: '',
      },
      baseDecision: null,
      decision: null,
      failures: [
        'No se encontro el caso base tracking-logistico-fullstack-local para la transicion de materializacion.',
      ],
    }
  }

  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
      approvalReason:
        'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      selectedOption: 'No deploy',
      freeAnswer:
        'No deploy. Seguir local con backend local, API local y SQLite/base local. No externos.',
    })

  const baseDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: approvalFeedback,
    requiresApproval: true,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const scalablePlan =
    baseDecision?.scalableDeliveryPlan && typeof baseDecision.scalableDeliveryPlan === 'object'
      ? baseDecision.scalableDeliveryPlan
      : null

  if (!scalablePlan) {
    return {
      testCase,
      baseDecision,
      decision: null,
      failures: [
        'La base reviewed fullstack local no devolvio scalableDeliveryPlan para preparar la entrega funcional local.',
      ],
    }
  }

  const allowedRootPaths = summarizeUniqueStrings(scalablePlan?.allowedRootPaths, 8)
  const directories = summarizeUniqueStrings(scalablePlan?.directories, 24)
  const filesToCreate = Array.isArray(scalablePlan?.filesToCreate)
    ? scalablePlan.filesToCreate
        .map((entry) => (entry && typeof entry === 'object' ? String(entry.path || '').trim() : ''))
        .filter(Boolean)
        .slice(0, 24)
    : []

  const decision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: `Preparar entrega funcional local para "${testCase.goal}".`,
    context: [
      'cta: Preparar entrega funcional local.',
      'plannerReviewState: review-scalable-delivery.',
      'deliveryLevel: fullstack-local.',
      'projectIntent: new-project-intent.',
      'approvalAlreadyGranted: true.',
      'accion requerida: preparar materializacion fullstack local.',
      'strategyEsperada: materialize-fullstack-local-plan.',
      'executionModeEsperado: executor.',
      'nextExpectedActionEsperado: execute-plan.',
      allowedRootPaths.length > 0 ? `allowedRootPaths: ${allowedRootPaths.join(', ')}` : '',
      directories.length > 0 ? `directories: ${directories.join(', ')}` : '',
      filesToCreate.length > 0 ? `filesToCreate: ${filesToCreate.join(', ')}` : '',
      'Archivos requeridos: frontend/admin/index.html, frontend/admin/app.js, frontend/public/index.html, frontend/public/app.js, backend/src/server.js, backend/src/routes/shipments.js, backend/src/routes/tracking.js, database/schema.sql, database/seed.sql, docs/API.md, docs/DB_SCHEMA.md o docs/DATA_MODEL.md.',
      'No usar database/shipments.json ni JSON equivalente como persistencia principal.',
      'Si existe un proyecto detectado no aplicable como fullstack-local-veterinaria, ignorarlo por completo para este proyecto nuevo.',
      'No devolver prepare-continuation-action-plan.',
      'No devolver prepare-project-phase-plan.',
      'No devolver web-scaffold-base.',
      'No ejecutar todavia. Solo dejar listo el materialize-fullstack-local-plan para el boton Materializar entrega.',
    ]
      .filter(Boolean)
      .join('\n'),
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 3,
    previousExecutionResult: approvalFeedback,
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  return {
    testCase,
    baseDecision,
    decision,
    failures: [],
  }
}

async function runTrackingLogisticsPrepareFunctionalDeliveryTransitionValidation() {
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const nextActionPlan =
    decision?.nextActionPlan && typeof decision.nextActionPlan === 'object'
      ? decision.nextActionPlan
      : null
  const targetSummary = summarizeUniqueStrings([
    decision?.materializationPlan?.projectRoot,
    ...(Array.isArray(materializationPlan?.allowedTargetPaths)
      ? materializationPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(materializationPlan?.operations)
      ? materializationPlan.operations.map((entry) => entry?.targetPath || '')
      : []),
  ], 160).map((entry) => normalizePathForComparison(entry))

  if (strategy !== 'materialize-fullstack-local-plan') {
    failures.push('Preparar entrega funcional local deberia devolver materialize-fullstack-local-plan.')
  }
  if (executionMode !== 'executor') {
    failures.push('Preparar entrega funcional local deberia devolver executionMode executor.')
  }
  if (nextExpectedAction !== 'execute-plan') {
    failures.push('Preparar entrega funcional local deberia devolver nextExpectedAction execute-plan.')
  }
  if (decision?.requiresApproval === true || decision?.approvalRequest) {
    failures.push('La transicion a materializacion fullstack no deberia reabrir approvals pendientes.')
  }
  if (
    strategy === 'prepare-continuation-action-plan' ||
    nextExpectedAction === 'review-continuation-action' ||
    String(decision?.decisionKey || '').trim() === 'web-scaffold-base'
  ) {
    failures.push('La transicion fullstack no deberia caer en continuation action ni en web-scaffold-base.')
  }
  if (!materializationPlan) {
    failures.push('La transicion fullstack deberia devolver materializationPlan.')
  }
  if (!nextActionPlan || String(nextActionPlan.actionType || '').trim() !== 'execute-materialization') {
    failures.push('nextActionPlan deberia quedar en execute-materialization.')
  }
  ;[
    'frontend/admin/index.html',
    'frontend/admin/app.js',
    'frontend/public/index.html',
    'frontend/public/app.js',
    'backend/src/server.js',
    'backend/src/routes/shipments.js',
    'backend/src/routes/tracking.js',
    'database/schema.sql',
    'database/seed.sql',
    'docs/api.md',
    'docs/db_schema.md',
  ].forEach((token) => {
    if (!targetSummary.some((entry) => entry.endsWith(normalizePathForComparison(token)))) {
      failures.push(`La transicion fullstack deberia incluir ${token}.`)
    }
  })

  return {
    testCase: {
      id: 'tracking-logistico-fullstack-prepare-functional-delivery-transition',
      label: 'Tracking logistico fullstack prepare functional delivery transition',
      goal: result.testCase?.goal || '',
    },
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runTrackingLogisticsNoDomainContaminationValidation() {
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const contentPool = normalizeText(
    [
      decision?.reason,
      decision?.instruction,
      decision?.domainUnderstanding?.domainLabel,
      ...(Array.isArray(decision?.domainUnderstanding?.primaryModules)
        ? decision.domainUnderstanding.primaryModules
        : []),
      ...(Array.isArray(decision?.domainUnderstanding?.primaryEntities)
        ? decision.domainUnderstanding.primaryEntities
        : []),
      ...(Array.isArray(materializationPlan?.operations)
        ? materializationPlan.operations.flatMap((entry) => [
            entry?.targetPath || '',
            typeof entry?.nextContent === 'string' ? entry.nextContent.slice(0, 1200) : '',
          ])
        : []),
    ]
      .filter(Boolean)
      .join(' '),
  )

  ;[
    'veterinaria',
    'turnos medicos',
    'appointments',
    'pacientes',
    'mascotas',
    'reservas',
    'frontend mock flow',
    'web inmobiliaria',
    'relojeria',
    'fullstack-local-veterinaria',
  ].forEach(
    (token) => {
      if (contentPool.includes(normalizeText(token))) {
        failures.push(`La materializacion logistica no deberia contaminarse con ${token}.`)
      }
    },
  )
  if (normalizeText(String(decision?.strategy || '')).includes('prepare-continuation-action-plan')) {
    failures.push('La materializacion logistica no deberia usar prepare-continuation-action-plan.')
  }
  if (!contentPool.includes(normalizeText('envios')) || !contentPool.includes(normalizeText('tracking'))) {
    failures.push('La materializacion logistica deberia conservar envios y tracking en el contrato materializable.')
  }

  return {
    testCase: {
      id: 'tracking-logistico-fullstack-no-domain-contamination-materialization',
      label: 'Tracking logistico fullstack no domain contamination materialization',
      goal: result.testCase?.goal || '',
    },
    ok: failures.length === 0,
    failures,
    strategy: String(decision?.strategy || '').trim(),
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runTrackingLogisticsMaterializationContractValidation() {
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const decision = result.decision
  const materializationPlan =
    decision?.materializationPlan && typeof decision.materializationPlan === 'object'
      ? decision.materializationPlan
      : null
  const contractInspection = inspectDecisionMaterializationContract({
    decision,
    goal: result.testCase?.goal || '',
    context: result.testCase?.context || '',
  })
  const allowedTargetPaths = summarizeUniqueStrings(
    [
      ...(Array.isArray(decision?.executionScope?.allowedTargetPaths)
        ? decision.executionScope.allowedTargetPaths
        : []),
      ...(Array.isArray(materializationPlan?.allowedTargetPaths)
        ? materializationPlan.allowedTargetPaths
        : []),
      ...(Array.isArray(materializationPlan?.operations)
        ? materializationPlan.operations.map((entry) => entry?.targetPath || '')
        : []),
    ],
    200,
  ).map((entry) => normalizePathForComparison(entry))

  if (!materializationPlan) {
    failures.push('materializationPlan ausente para el contrato fullstack logistico.')
  }
  if (!contractInspection || contractInspection.ok !== true) {
    failures.push(
      `El contrato canonico deberia validar la materializacion logistica. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
    )
  }

  ;[
    'backend/src/server.js',
    'backend/src/routes/shipments.js',
    'backend/src/routes/tracking.js',
    'frontend/admin/index.html',
    'frontend/admin/app.js',
    'frontend/public/index.html',
    'frontend/public/app.js',
    'database/schema.sql',
    'database/seed.sql',
    'docs/architecture.md',
    'docs/api.md',
    'docs/db_schema.md',
    'shared/statuses.js',
  ].forEach((token) => {
    if (!allowedTargetPaths.some((entry) => entry.endsWith(normalizePathForComparison(token)))) {
      failures.push(`allowedTargetPaths deberia incluir ${token}.`)
    }
  })
  if (allowedTargetPaths.some((entry) => entry.endsWith(normalizePathForComparison('database/shipments.json')))) {
    failures.push('allowedTargetPaths no deberia usar database/shipments.json como persistencia principal.')
  }
  if (Array.isArray(contractInspection?.missingRequiredPaths) && contractInspection.missingRequiredPaths.length > 0) {
    failures.push(
      `El validador canonico no deberia marcar faltantes en el contrato logistico valido: ${contractInspection.missingRequiredPaths.join(', ')}.`,
    )
  }
  if (Array.isArray(contractInspection?.forbiddenSignalsFound) && contractInspection.forbiddenSignalsFound.length > 0) {
    failures.push(
      `El validador canonico no deberia detectar contaminaciones en el contrato logistico valido: ${contractInspection.forbiddenSignalsFound.join(', ')}.`,
    )
  }
  ;['web-sistema-de-tracking', 'script.js'].forEach((token) => {
    if (
      allowedTargetPaths.some((entry) => entry.includes(normalizePathForComparison(token))) &&
      !normalizePathForComparison(token).includes('index.html')
    ) {
      failures.push(`allowedTargetPaths no deberia caer en ${token}.`)
    }
  })

  return {
    testCase: {
      id: 'tracking-logistico-fullstack-materialization-contract',
      label: 'Tracking logistico fullstack materialization contract',
      goal: result.testCase?.goal || '',
    },
    ok: failures.length === 0,
    failures,
    strategy: String(decision?.strategy || '').trim(),
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runExistingProjectDetectionNewProjectIsolationValidation() {
  const failures = []
  const fixture = await buildFullstackFixtureForCase({
    workspaceName: 'fullstack-project-existing-veterinary-for-logistics',
    goal: veterinaryFullstackLocalCase.goal,
    context: veterinaryFullstackLocalCase.context,
  })
  const testCase = scalableValidationCases.find(
    (entry) => entry.id === 'tracking-logistico-fullstack-local',
  )

  if (!testCase) {
    return {
      testCase: {
        id: 'existing-project-detection-new-project-isolation',
        label: 'Existing project detection new project isolation',
        goal: '',
      },
      ok: false,
      failures: ['No se encontro el caso base tracking-logistico-fullstack-local para aislar proyecto nuevo.'],
    }
  }

  const decision = await requestContinuationDecision({
    fixture,
    testCase,
  })
  const strategy = String(decision?.strategy || '').trim()
  const existingProjectDetection =
    decision?.existingProjectDetection && typeof decision.existingProjectDetection === 'object'
      ? decision.existingProjectDetection
      : null
  const activeProjectContext =
    decision?.activeProjectContext && typeof decision.activeProjectContext === 'object'
      ? decision.activeProjectContext
      : null
  const targetSummary = summarizeUniqueStrings([
    activeProjectContext?.projectRoot,
    decision?.implementationRoadmap?.projectSlug,
    decision?.projectBlueprint?.projectRoot,
    ...(Array.isArray(decision?.executionScope?.allowedTargetPaths)
      ? decision.executionScope.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.continuationActionPlan?.allowedTargetPaths)
      ? decision.continuationActionPlan.allowedTargetPaths
      : []),
  ]).map((entry) => normalizePathForComparison(entry))
  const contaminationPool = normalizeText(
    JSON.stringify({
      existingProjectDetection: decision?.existingProjectDetection || null,
      activeProjectContext: decision?.activeProjectContext || null,
      localProjectManifest: decision?.localProjectManifest || null,
      implementationRoadmap: decision?.implementationRoadmap || null,
      phaseExpansionPlan: decision?.phaseExpansionPlan || null,
    }),
  )

  if (existingProjectDetection?.detected !== true || existingProjectDetection?.applicable !== false) {
    failures.push('El proyecto veterinaria existente deberia detectarse pero quedar como no aplicable para tracking logistico nuevo.')
  }
  if (
    strategy === 'prepare-project-phase-plan' ||
    strategy === 'prepare-continuation-action-plan' ||
    decision?.continuationActionPlan
  ) {
    failures.push('Tracking logistico nuevo no deberia entrar en continuidad del proyecto veterinaria.')
  }
  if (normalizeIdentifier(activeProjectContext?.mode).includes('existing')) {
    failures.push('activeProjectContext no deberia quedar en existing-project para tracking logistico nuevo.')
  }
  if (
    targetSummary.some((entry) => entry.includes('fullstack-local-veterinaria')) ||
    targetSummary.some((entry) => entry.includes('veterinaria'))
  ) {
    failures.push('Los target paths del caso logistico nuevo no deberian apuntar a fullstack-local-veterinaria.')
  }
  ;['appointments', 'turnos', 'pacientes', 'mascotas'].forEach((token) => {
    if (contaminationPool.includes(normalizeText(token))) {
      failures.push(`El proyecto logistico nuevo no deberia reutilizar ${token} desde el manifest veterinario.`)
    }
  })

  return {
    testCase: {
      id: 'tracking-logistico-new-project-does-not-use-veterinary-manifest',
      label: 'Tracking logistico new project does not use veterinary manifest',
      goal: testCase.goal,
    },
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runTrackingLogisticsMaterializationRequiresSqlContractValidation() {
  const result = await requestTrackingLogisticsPreparedMaterializationDecision()
  const failures = [...(Array.isArray(result.failures) ? result.failures : [])]
  const contractInspection = inspectDecisionMaterializationContract({
    decision: result.decision,
    goal: result.testCase?.goal || '',
    context: result.testCase?.context || '',
  })
  const materializationPlan =
    result.decision?.materializationPlan && typeof result.decision.materializationPlan === 'object'
      ? result.decision.materializationPlan
      : null
  const targetSummary = normalizeText(
    [
      ...(Array.isArray(materializationPlan?.allowedTargetPaths)
        ? materializationPlan.allowedTargetPaths.map((entry) => normalizePathForComparison(entry))
        : []),
      ...(Array.isArray(materializationPlan?.operations)
        ? materializationPlan.operations.flatMap((entry) => [
            normalizePathForComparison(entry?.targetPath || ''),
            typeof entry?.nextContent === 'string' ? entry.nextContent.slice(0, 800) : '',
          ])
        : []),
    ]
      .filter(Boolean)
      .join(' '),
  )

  ;[
    'database/schema.sql',
    'database/seed.sql',
    'docs/api.md',
    'docs/db_schema.md',
  ].forEach((token) => {
    if (!targetSummary.includes(normalizeText(token))) {
      failures.push(`El contrato materializable logistico deberia incluir ${token}.`)
    }
  })
  if (targetSummary.includes(normalizeText('database/shipments.json'))) {
    failures.push('database/shipments.json no puede reemplazar al contrato SQL principal.')
  }
  if (!contractInspection || contractInspection.ok !== true) {
    failures.push(
      `El contrato canonico deberia aceptar este plan con SQL local. Recibido: ${contractInspection?.reason || '(sin reason)'}.`,
    )
  }
  ;['database/schema.sql', 'database/seed.sql'].forEach((token) => {
    if (
      !Array.isArray(contractInspection?.expectedTargetPaths) ||
      !contractInspection.expectedTargetPaths.some((entry) =>
        normalizePathForComparison(entry).endsWith(normalizePathForComparison(token)),
      )
    ) {
      failures.push(`El contrato canonico deberia exigir ${token}.`)
    }
  })

  return {
    testCase: {
      id: 'tracking-logistico-fullstack-materialization-requires-sql-contract',
      label: 'Tracking logistico fullstack materialization requires SQL contract',
      goal: result.testCase?.goal || '',
    },
    ok: failures.length === 0,
    failures,
    strategy: String(result.decision?.strategy || '').trim(),
    executionMode: String(result.decision?.executionMode || '').trim(),
    nextExpectedAction: String(result.decision?.nextExpectedAction || '').trim(),
  }
}

async function runTrackingLogisticsMaterializationRejectsJsonOnlyValidation() {
  const testCase = scalableValidationCases.find(
    (entry) => entry.id === 'tracking-logistico-fullstack-local',
  )
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'tracking-logistico-fullstack-materialization-rejects-json-only',
        label: 'Tracking logistico fullstack materialization rejects JSON only',
        goal: '',
      },
      ok: false,
      failures: ['No se encontro el caso base tracking-logistico-fullstack-local para la regresion JSON-only.'],
    }
  }

  const approvalFeedback =
    '__orchestrator_feedback__:' +
    JSON.stringify({
      type: 'approval-granted',
      source: 'planner',
      approvalMode: 'once',
      instruction:
        'Continuar solo con backend local, API local y SQLite local, sin deploy ni servicios externos.',
      approvalReason:
        'El usuario rechazo deploy pero mantiene permitido backend local y base SQLite local.',
      approvalRequestDecisionKey: 'approve-public-deploy',
      selectedOption: 'No deploy',
      freeAnswer:
        'No deploy. Seguir local con backend local y SQLite/base local. No externos.',
    })

  const strategicInput = plannerApi.buildStrategicBrainInput({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 3,
    previousExecutionResult: approvalFeedback,
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'max-quality',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  const contaminatedDecision = {
    decisionKey: 'materialize-fullstack-logistics-tracker-local-v1',
    strategy: 'materialize-fullstack-local-plan',
    executionMode: 'executor',
    requiresApproval: false,
    nextExpectedAction: 'execute-plan',
    instruction:
      'Materializar una base local rapida usando database/shipments.json como almacenamiento principal.',
    executionScope: {
      allowedTargetPaths: [
        'logistics-tracker-local/frontend',
        'logistics-tracker-local/backend',
        'logistics-tracker-local/database',
      ],
    },
    materializationPlan: {
      projectRoot: 'logistics-tracker-local',
      allowedTargetPaths: ['logistics-tracker-local'],
      operations: [
        { type: 'replace-file', targetPath: 'logistics-tracker-local/database/shipments.json', nextContent: '[]' },
        { type: 'replace-file', targetPath: 'logistics-tracker-local/frontend/public/index.html', nextContent: '<html></html>' },
      ],
    },
  }

  const decision = await plannerApi.normalizeOpenAIBrainDecision(
    contaminatedDecision,
    strategicInput,
  )
  const contractInspection = inspectDecisionMaterializationContract({
    decision,
    goal: testCase.goal,
    context: testCase.context,
  })

  const normalizedDecision = normalizeText(JSON.stringify(decision || {}))
  if (
    String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan' &&
    !normalizedDecision.includes(normalizeText('database/seed.sql'))
  ) {
    failures.push('Una materializacion JSON-only no debe quedar validada como contrato materializable logistico.')
  }
  if (normalizedDecision.includes(normalizeText('database/shipments.json'))) {
    failures.push('El fallback no debe conservar database/shipments.json como persistencia principal.')
  }
  if (contractInspection?.ok === true) {
    failures.push('El contrato canonico no deberia aceptar una materializacion JSON-only.')
  }
  if (
    String(decision?.strategy || '').trim() === 'materialize-fullstack-local-plan' &&
    !String(contractInspection?.reason || '')
      .toLocaleLowerCase()
      .includes('database/schema.sql') &&
    !String(contractInspection?.reason || '')
      .toLocaleLowerCase()
      .includes('database/seed.sql')
  ) {
    failures.push('El contrato canonico deberia explicar que falta schema.sql y/o seed.sql en una propuesta JSON-only.')
  }

  return {
    testCase: {
      id: 'tracking-logistico-fullstack-materialization-rejects-json-only',
      label: 'Tracking logistico fullstack materialization rejects JSON only',
      goal: testCase.goal,
    },
    ok: failures.length === 0,
    failures,
    strategy: String(decision?.strategy || '').trim(),
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runSensitiveApprovalRoutingValidation() {
  const testCase = {
    id: 'sensitive-approval-routing',
    label: 'Approval para deploy y pagos reales',
    goal: 'Validar approval routing para deploy y pagos reales.',
  }
  const failures = []

  const deployDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: 'Quiero publicar esta web en produccion con deploy real.',
    context: 'Necesito salida publica y deploy real para una web comercial.',
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'smart',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  if (deployDecision?.requiresApproval !== true) {
    failures.push('El caso de deploy real deberia requerir aprobacion manual.')
  }
  if (deployDecision?.nextExpectedAction !== 'user-approval') {
    failures.push(
      `El caso de deploy real deberia quedar en user-approval. Recibido: ${
        deployDecision?.nextExpectedAction || '(vacio)'
      }.`,
    )
  }
  if (deployDecision?.approvalRequest?.decisionKey !== 'approve-public-deploy') {
    failures.push(
      `El caso de deploy real deberia usar approve-public-deploy. Recibido: ${
        deployDecision?.approvalRequest?.decisionKey || '(vacio)'
      }.`,
    )
  }

  const paymentsDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: 'Quiero agregar pagos reales con Mercado Pago.',
    context: 'El objetivo es cobrar pagos reales en una experiencia comercial.',
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'smart',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  if (paymentsDecision?.requiresApproval !== true) {
    failures.push('El caso de pagos reales deberia requerir aprobacion manual.')
  }
  if (paymentsDecision?.nextExpectedAction !== 'user-approval') {
    failures.push(
      `El caso de pagos reales deberia quedar en user-approval. Recibido: ${
        paymentsDecision?.nextExpectedAction || '(vacio)'
      }.`,
    )
  }
  if (
    !normalizeText(
      [
        paymentsDecision?.approvalRequest?.decisionKey,
        paymentsDecision?.approvalRequest?.reason,
        paymentsDecision?.approvalRequest?.question,
      ]
        .filter(Boolean)
        .join(' '),
    ).includes('pago')
  ) {
    failures.push('El caso de pagos reales deberia exponer una aprobacion vinculada a pagos.')
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
  }
}

async function runProjectPhaseMaterializationCoverageGuardValidation() {
  const testCase = {
    id: 'project-phase-materialization-coverage-guard',
    label: 'Project phase materialization coverage guard',
  }
  const workspacePath = fs.mkdtempSync(
    path.join(os.tmpdir(), 'ai-orchestrator-phase-coverage-'),
  )
  const failures = []

  try {
    const materializationPlan = {
      version: LOCAL_MATERIALIZATION_PLAN_VERSION,
      kind: 'project-phase-materialization',
      summary: 'Fase 2 reducida de forma incorrecta.',
      strategy: 'materialize-project-phase-plan',
      reasoningLayer: 'openai',
      materializationLayer: 'local-deterministic',
      operations: [
        {
          type: 'replace-file',
          targetPath: 'data/mock-data.json',
          nextContent: '{"catalog":[]}\n',
        },
        {
          type: 'replace-file',
          targetPath: 'data/mock-data.js',
          nextContent: 'window.ZonaGolMockCatalog = [];\n',
        },
        {
          type: 'replace-file',
          targetPath: 'src/js/storage.js',
          nextContent: 'window.ZonaGolStorage = {};\n',
        },
        {
          type: 'replace-file',
          targetPath: 'src/js/data-loader.js',
          nextContent: 'window.ZonaGolDataLoader = {};\n',
        },
      ],
      validations: [
        { type: 'exists', targetPath: 'data/mock-data.json', expectedKind: 'file' },
        { type: 'exists', targetPath: 'data/mock-data.js', expectedKind: 'file' },
        { type: 'exists', targetPath: 'src/js/storage.js', expectedKind: 'file' },
        { type: 'exists', targetPath: 'src/js/data-loader.js', expectedKind: 'file' },
      ],
    }

    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath,
      requestId: 'smoke-project-phase-coverage',
      instruction:
        'Materializar fase 2 de catalogo y admin local sin perder archivos prometidos.',
      brainStrategy: 'materialize-project-phase-plan',
      businessSector: 'tienda-pelotas-futbol-mock',
      businessSectorLabel: 'tienda pelotas futbol mock',
      creativeDirection: null,
      reusableArtifactLookup: null,
      reusableArtifactsFound: 0,
      reuseDecision: false,
      reuseReason: '',
      reusedArtifactIds: [],
      reuseMode: 'none',
      reuseMaterialization: null,
      materializationPlanSource: 'smoke',
      expectedTargetPaths: [
        'data/mock-data.json',
        'data/mock-data.js',
        'src/js/storage.js',
        'src/js/data-loader.js',
        'src/js/catalog.js',
        'admin/admin.html',
        'admin/admin.css',
        'admin/admin.js',
        'docs/README-ADMIN.md',
        'index.html',
      ],
    })

    if (!task) {
      failures.push('No se pudo construir la tarea local para validar cobertura de targetFiles.')
    } else {
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok === true) {
        failures.push(
          'La materializacion reducida no deberia cerrar en success si faltan catalog.js, admin/ y docs/README-ADMIN.md.',
        )
      } else {
        const missingExpectedTargets = toStringArray(
          executionResult?.details?.missingExpectedTargets,
          32,
        ).map((entry) => normalizePathForComparison(entry))
        ;['src/js/catalog.js', 'admin/admin.html', 'admin/admin.css', 'admin/admin.js', 'docs/README-ADMIN.md'].forEach(
          (targetPath) => {
            const normalizedTargetPath = normalizePathForComparison(targetPath)
            if (!missingExpectedTargets.some((entry) => entry.endsWith(normalizedTargetPath))) {
              failures.push(
                `La ejecucion fallida deberia reportar ${targetPath} dentro de missingExpectedTargets.`,
              )
            }
          },
        )
      }
    }
  } finally {
    fs.rmSync(workspacePath, { recursive: true, force: true })
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    strategy: 'materialize-project-phase-plan',
    executionMode: 'executor',
    nextExpectedAction: 'execute-plan',
  }
}

async function runSoccerEcommercePreparedMaterializationTransitionValidation() {
  const testCase = activeCases.find((entry) => entry.id === 'ecommerce-pelotas-futbol')
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'soccer-ecommerce-prepared-materialization-transition',
        label: 'Transicion ecommerce de pelotas a materializacion segura',
        goal: '',
      },
      ok: false,
      failures: ['No se encontro el caso base ecommerce-pelotas-futbol para la regresion.'],
    }
  }

  const phaseOneDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: testCase.goal,
    context: testCase.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 1,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'smart',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  if (phaseOneDecision?.strategy !== 'safe-first-delivery-plan') {
    failures.push(
      `La fase inicial ecommerce de pelotas deberia arrancar en safe-first-delivery-plan. Recibido: ${
        phaseOneDecision?.strategy || '(vacio)'
      }.`,
    )
  }

  const preparedPrompt = buildSafeFirstDeliveryMaterializationPromptLikeRenderer({
    plan: phaseOneDecision?.safeFirstDeliveryPlan || null,
    originalGoal: testCase.goal,
    originalContext: testCase.context,
  })
  const phaseTwoDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal: preparedPrompt.goal,
    context: preparedPrompt.context,
    workspacePath: smokeExecutionWorkspaceRoot,
    iteration: 2,
    previousExecutionResult: '',
    requiresApproval: false,
    projectState: { resolvedDecisions: [] },
    userParticipationMode: 'brain-decides-missing',
    costMode: 'smart',
    attachedInputs: [],
    existingProjectContext: null,
    projectWorkMode: 'auto',
    reusablePlanningContext: buildReusablePlanningContext(),
  })

  if (phaseTwoDecision?.strategy !== 'materialize-safe-first-delivery-plan') {
    failures.push(
      `La preparacion de materializacion ecommerce deberia devolver materialize-safe-first-delivery-plan. Recibido: ${
        phaseTwoDecision?.strategy || '(vacio)'
      }.`,
    )
  }
  if (phaseTwoDecision?.executionMode !== 'executor') {
    failures.push(
      `La preparacion de materializacion ecommerce deberia quedar en executor. Recibido: ${
        phaseTwoDecision?.executionMode || '(vacio)'
      }.`,
    )
  }
  if (phaseTwoDecision?.nextExpectedAction !== 'execute-plan') {
    failures.push(
      `La preparacion de materializacion ecommerce deberia quedar lista para execute-plan. Recibido: ${
        phaseTwoDecision?.nextExpectedAction || '(vacio)'
      }.`,
    )
  }

  const modulesSummary = normalizeText(
    [
      phaseTwoDecision?.domainUnderstanding?.domainLabel,
      ...(Array.isArray(phaseTwoDecision?.domainUnderstanding?.primaryModules)
        ? phaseTwoDecision.domainUnderstanding.primaryModules
        : []),
      ...(Array.isArray(phaseTwoDecision?.domainUnderstanding?.coreFlows)
        ? phaseTwoDecision.domainUnderstanding.coreFlows
        : []),
      ...(Array.isArray(phaseTwoDecision?.domainUnderstanding?.localActions)
        ? phaseTwoDecision.domainUnderstanding.localActions
        : []),
      ...(Array.isArray(phaseTwoDecision?.safeFirstDeliveryMaterialization?.modules)
        ? phaseTwoDecision.safeFirstDeliveryMaterialization.modules
        : []),
      ...(Array.isArray(phaseTwoDecision?.safeFirstDeliveryMaterialization?.screens)
        ? phaseTwoDecision.safeFirstDeliveryMaterialization.screens
        : []),
      phaseTwoDecision?.instruction,
    ]
      .filter(Boolean)
      .join(' '),
  )
  ;[
    'reservas',
    'agenda inicial',
    'profesionales mock',
    'autorizaciones',
    'accesos',
    'registrar aprobaciones mock',
    'trazabilidad local',
    'cambiar estados mock sin depender de servicios externos',
  ].forEach((token) => {
    if (modulesSummary.includes(normalizeText(token))) {
      failures.push(`La transicion a materializacion ecommerce quedo contaminada con "${token}".`)
    }
  })

  return {
    testCase,
    ok: failures.length === 0,
    failures,
    phaseOneStrategy: phaseOneDecision?.strategy || '',
    phaseTwoStrategy: phaseTwoDecision?.strategy || '',
    phaseTwoExecutionMode: phaseTwoDecision?.executionMode || '',
    phaseTwoNextExpectedAction: phaseTwoDecision?.nextExpectedAction || '',
  }
}

async function runSoccerEcommerceMaterializationValidation() {
  const testCase = activeCases.find((entry) => entry.id === 'ecommerce-pelotas-futbol')
  const failures = []

  if (!testCase) {
    return {
      testCase: {
        id: 'soccer-ecommerce-materialization',
        label: 'Materializacion ecommerce de pelotas',
        goal: '',
      },
      ok: false,
      failures: ['No se encontro el caso base ecommerce-pelotas-futbol para la regresion.'],
    }
  }

  const structures = buildCaseStructures(testCase)
  const materializationPlan = buildGenericSafeFirstDeliveryMaterializationPlan({
    decisionKey: 'materialize-safe-first-delivery-plan',
    instruction: structures.materializePlan?.instruction || '',
    executionScope: structures.materializePlan?.executionScope || {},
    businessSector: structures.domainUnderstanding?.intentLabel || '',
    businessSectorLabel: structures.domainUnderstanding?.domainLabel || '',
    safeFirstDeliveryMaterialization:
      structures.materializePlan?.safeFirstDeliveryMaterialization || null,
  })

  if (!materializationPlan) {
    return {
      testCase,
      ok: false,
      failures: ['No se pudo construir el materializationPlan ecommerce de pelotas.'],
    }
  }

  const workspacePath = path.join(smokeExecutionWorkspaceRoot, 'soccer-ecommerce-materialization')
  ensureCleanDirectory(workspacePath)

  const task = buildLocalMaterializationTask({
    plan: materializationPlan,
    workspacePath,
    requestId: 'smoke-soccer-ecommerce-materialization',
    instruction: structures.materializePlan?.instruction || '',
    brainStrategy: 'materialize-safe-first-delivery-plan',
    businessSector: structures.domainUnderstanding?.intentLabel || '',
    businessSectorLabel: structures.domainUnderstanding?.domainLabel || '',
    materializationPlanSource: 'planner-smoke',
  })

  if (!task) {
    return {
      testCase,
      ok: false,
      failures: ['No se pudo construir la tarea local deterministica ecommerce de pelotas.'],
    }
  }

  const executionResult = await runLocalDeterministicTask(task)
  if (executionResult?.ok !== true) {
    return {
      testCase,
      ok: false,
      failures: [
        `La materializacion local ecommerce de pelotas fallo: ${
          executionResult?.error || 'sin detalle'
        }.`,
      ],
    }
  }

  const expectedFolder = path.join(workspacePath, 'safe-first-delivery-tienda-pelotas-futbol')
  const expectedFiles = ['index.html', 'styles.css', 'script.js', 'mock-data.json']
  const requiredTokenChecks = {
    'script.js': ['pelota', 'catalogo', 'carrito', 'checkout simulado'],
    'mock-data.json': ['pelota', 'testimonios', 'preguntas frecuentes'],
  }
  const forbiddenTokens = [
    'reservas',
    'flujo de reservas',
    'agenda',
    'profesionales mock',
    'backoffice',
    'operaciones portuarias',
  ]

  if (!fs.existsSync(expectedFolder)) {
    failures.push('La materializacion no creo safe-first-delivery-tienda-pelotas-futbol.')
  }

  for (const basename of expectedFiles) {
    const filePath = path.join(expectedFolder, basename)
    if (!fs.existsSync(filePath)) {
      failures.push(`Falta el archivo generado ${basename}.`)
      continue
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const requiredTokens = requiredTokenChecks[basename] || []
    requiredTokens.forEach((token) => {
      if (!normalizeText(content).includes(normalizeText(token))) {
        failures.push(`${basename} deberia mencionar ${token}.`)
      }
    })
    forbiddenTokens.forEach((token) => {
      if (normalizeText(content).includes(normalizeText(token))) {
        failures.push(`${basename} quedo contaminado con "${token}".`)
      }
    })
  }

  return {
    testCase,
    ok: failures.length === 0,
    failures,
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
      'projectIntent: new-project-intent.',
      'strategyEsperada: materialize-fullstack-local-plan.',
      'executionModeEsperado: executor.',
      'nextExpectedActionEsperado: execute-plan.',
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
      'Archivos requeridos: README.md, package.json, frontend/package.json, frontend/admin/README.md, frontend/public/README.md, frontend/index.html, frontend/src/main.js, frontend/src/routes/index.js, frontend/src/features/appointments.js, frontend/src/styles.css, frontend/src/mock-data.js, frontend/src/components/App.js, backend/package.json, backend/src/server.js, backend/src/routes/health.js, backend/src/routes/appointments.js, backend/src/modules/appointments.js, backend/src/lib/response.js, shared/contracts/domain.js, shared/types/contracts.js, database/README.md, database/schema.sql, database/seeds/seed-local.sql, scripts/README.md, scripts/seed-local.js, docs/architecture.md, docs/api.md, docs/data-model.md, docs/local-runbook.md.',
      'Devolver un materialize-fullstack-local-plan ejecutable por el executor local deterministico.',
      'No devolver prepare-continuation-action-plan ni review-continuation-action.',
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

function buildSafeFirstDeliveryMaterializationPromptLikeRenderer({
  plan,
  originalGoal,
  originalContext,
}) {
  const safeString = (value) => (typeof value === 'string' ? value.trim() : '')
  const sanitize = (value) =>
    safeString(value)
      .replace(/ecommerce/gi, 'experiencia comercial')
      .replace(/marketplace/gi, 'experiencia de catalogo')
      .replace(/carrito/gi, 'seleccion local')
      .replace(/checkout/gi, 'cierre simulado')
      .replace(/backoffice/gi, 'panel interno mock')
      .replace(/ordenes/gi, 'resumenes de pedidos mock')
      .replace(/órdenes/gi, 'resumenes de pedidos mock')
      .replace(/pagos?\s+reales?/gi, 'cobros reales')
      .replace(/pasarela\s+de\s+pagos/gi, 'pasarela externa')
      .replace(/\bauth\s+real\b/gi, 'identidad real')
      .replace(/autenticaci[oó]n\s+real/gi, 'identidad real')
      .replace(/\bsin\s+aprobaci[oó]n\b/gi, 'sin validacion final')
      .replace(/\baprobaciones?\s+futuras?\b/gi, 'validaciones futuras')
      .replace(/base\s+de\s+datos\s+real/gi, 'persistencia real')
      .replace(/\s+/g, ' ')
      .trim()
  const scopeItems = toStringArray(plan?.scope || []).map(sanitize).filter(Boolean)
  const moduleItems = toStringArray(plan?.modules || []).map(sanitize).filter(Boolean)
  const mockDataItems = toStringArray(plan?.mockData || []).map(sanitize).filter(Boolean)
  const screenItems = toStringArray(plan?.screens || []).map(sanitize).filter(Boolean)
  const behaviorItems = toStringArray(plan?.localBehavior || []).map(sanitize).filter(Boolean)
  const exclusionItems = toStringArray(plan?.explicitExclusions || [])
    .map(sanitize)
    .filter(Boolean)
  const successCriteriaItems = toStringArray(plan?.successCriteria || [])
    .map(sanitize)
    .filter(Boolean)
  const scopeSummary =
    scopeItems.length > 0
      ? scopeItems.join('; ')
      : 'una primera entrega segura y navegable del flujo principal'

  return {
    goal: [
      'Materializar una primera entrega segura y acotada del objetivo actual dentro de una carpeta nueva del workspace.',
      scopeSummary,
      'No devolver otro safe-first-delivery-plan ni otro product-architecture-plan; devolver un plan materializable, acotado y revisable antes de ejecutar.',
    ].join(' '),
    context: [
      `Objetivo original: ${sanitize(originalGoal) || 'No definido'}.`,
      moduleItems.length > 0
        ? `Modulos que si entran: ${moduleItems.join(' | ')}.`
        : '',
      screenItems.length > 0
        ? `Pantallas o vistas prioritarias: ${screenItems.join(' | ')}.`
        : '',
      mockDataItems.length > 0
        ? `Datos mock obligatorios: ${mockDataItems.join(' | ')}.`
        : '',
      behaviorItems.length > 0
        ? `Comportamiento local esperado: ${behaviorItems.join(' | ')}.`
        : '',
      exclusionItems.length > 0
        ? `Exclusiones obligatorias: ${exclusionItems.join(' | ')}.`
        : '',
      successCriteriaItems.length > 0
        ? `Criterios de exito: ${successCriteriaItems.join(' | ')}.`
        : '',
      'La materializacion debe quedar acotada a archivos locales dentro del workspace, con frontend navegable, datos mock editables y sin conexiones externas reales.',
      'No usar pagos reales, credenciales reales, webhooks reales, deploy, migraciones, auth real, base de datos real, datos sensibles reales ni integraciones externas reales.',
      'El siguiente resultado debe ser un plan ejecutable y acotado, con carpeta destino y archivos permitidos claros, pero sin ejecutar cambios automaticamente.',
      safeString(originalContext)
        ? `Contexto previo del operador: ${sanitize(safeString(originalContext))}.`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
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

async function buildFullstackFixtureForCase({
  workspaceName,
  goal,
  context,
}) {
  const workspacePath = path.join(smokeExecutionWorkspaceRoot, workspaceName)
  ensureCleanDirectory(workspacePath)

  const reusablePlanningContext = buildReusablePlanningContext()
  const phaseOneDecision = await plannerApi.buildLocalStrategicBrainDecision({
    goal,
    context,
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
    goal,
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

async function buildPhaseExecutionFixture({ workspaceName = 'fullstack-project-phase' } = {}) {
  return buildFullstackFixtureForCase({
    workspaceName,
    goal: fullstackLocalMaterializationCase.goal,
    context: fullstackLocalMaterializationCase.context,
  })
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

async function runExistingWorkspaceProjectDetectionValidation() {
  const failures = []
  const fixture = await buildPhaseExecutionFixture({
    workspaceName: 'fullstack-project-existing-workspace-detection',
  })
  const decision = await requestContinuationDecision({
    fixture,
    testCase: fullstackLocalMaterializationCase,
  })
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const nextExpectedAction = String(decision?.nextExpectedAction || '').trim()
  const projectPhaseExecutionPlan =
    decision?.projectPhaseExecutionPlan &&
    typeof decision.projectPhaseExecutionPlan === 'object'
      ? decision.projectPhaseExecutionPlan
      : null
  const projectContinuationState =
    decision?.projectContinuationState &&
    typeof decision.projectContinuationState === 'object'
      ? decision.projectContinuationState
      : null
  const projectReadinessState =
    decision?.projectReadinessState &&
    typeof decision.projectReadinessState === 'object'
      ? decision.projectReadinessState
      : null
  const localProjectManifest =
    decision?.localProjectManifest && typeof decision.localProjectManifest === 'object'
      ? decision.localProjectManifest
      : null

  if (strategy !== 'prepare-project-phase-plan') {
    failures.push(
      `Con un proyecto local existente debería devolver prepare-project-phase-plan. Recibido: ${strategy || '(vacío)'}.`,
    )
  }
  if (executionMode !== 'planner-only') {
    failures.push('La continuidad desde un proyecto existente debería quedar en planner-only.')
  }
  if (nextExpectedAction !== 'review-project-phase') {
    failures.push('La continuidad desde un proyecto existente debería volver a review-project-phase.')
  }
  if (decision?.materializationPlan) {
    failures.push('No debería devolver materializationPlan cuando ya existe el scaffold local.')
  }
  if (decision?.scalableDeliveryPlan) {
    failures.push('No debería volver a devolver scalableDeliveryPlan cuando ya existe el proyecto local.')
  }
  if (!projectPhaseExecutionPlan) {
    failures.push('projectPhaseExecutionPlan ausente al detectar un proyecto existente.')
  } else {
    if (projectPhaseExecutionPlan.phaseId !== 'frontend-mock-flow') {
      failures.push('La continuidad detectada desde disco debería arrancar en frontend-mock-flow.')
    }
    if (projectPhaseExecutionPlan.targetStrategy !== 'materialize-project-phase-plan') {
      failures.push('projectPhaseExecutionPlan.targetStrategy debería apuntar a materialize-project-phase-plan.')
    }
    if (
      normalizePathForComparison(projectPhaseExecutionPlan.projectRoot) !==
      fixture.projectRootRelativePath
    ) {
      failures.push('projectPhaseExecutionPlan.projectRoot debería apuntar al proyecto detectado dentro del workspace.')
    }
    const allowedTargetPaths = toStringArray(
      projectPhaseExecutionPlan.allowedTargetPaths,
      24,
    ).map((entry) => normalizePathForComparison(entry))
    const expectedAllowedPathTokens = [
      '/frontend/src/mock-data.js',
      '/frontend/src/components/App.js',
      '/frontend/src/styles.css',
      '/docs/local-runbook.md',
      '/jefe-project.json',
    ]
    if (
      !expectedAllowedPathTokens.every((token) =>
        allowedTargetPaths.some((entry) =>
          entry.endsWith(normalizePathForComparison(token)),
        ),
      )
    ) {
      failures.push('projectPhaseExecutionPlan.allowedTargetPaths debería quedar acotado a frontend/src, docs/local-runbook.md y jefe-project.json.')
    }
    if (
      !allowedTargetPaths.every(
        (entry) =>
          entry.startsWith(`${fixture.projectRootRelativePath}/`) &&
          !entry.includes('/backend/') &&
          !entry.includes('/database/') &&
          !entry.includes('/shared/') &&
          !entry.includes('node_modules') &&
          !entry.endsWith('/.env') &&
          !entry.toLocaleLowerCase().includes('docker'),
      )
    ) {
      failures.push('projectPhaseExecutionPlan.allowedTargetPaths no debería reabrir backend, database, shared, node_modules, .env ni Docker.')
    }
  }
  if (!projectContinuationState) {
    failures.push('projectContinuationState ausente al detectar un proyecto existente.')
  } else {
    const stateSummary = summarizeProjectContinuationState(projectContinuationState)
    if (stateSummary.nextRecommendedPhase !== 'frontend-mock-flow') {
      failures.push('projectContinuationState.nextRecommendedPhase debería ser frontend-mock-flow.')
    }
    if (!continuationActionMatchesId(stateSummary.nextRecommendedAction, 'frontend-mock-flow')) {
      failures.push('projectContinuationState.nextRecommendedAction debería apuntar a frontend-mock-flow.')
    }
    if (!String(stateSummary.projectStatus || '').trim()) {
      failures.push('projectContinuationState.projectStatus no debería quedar vacío.')
    }
  }
  if (!projectReadinessState) {
    failures.push('projectReadinessState ausente al detectar un proyecto existente.')
  } else {
    const readinessSummary = summarizeProjectReadinessState(projectReadinessState)
    if (normalizeText(readinessSummary.readinessLevel) !== 'scaffold-materialized') {
      failures.push('El readiness debería inferir scaffold-materialized desde el manifest existente.')
    }
  }
  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente al detectar un proyecto existente.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    if (manifestSummary.nextRecommendedPhase !== 'frontend-mock-flow') {
      failures.push('El manifest detectado debería seguir recomendando frontend-mock-flow.')
    }
    if (
      normalizePathForComparison(manifestSummary.projectRoot || '') !==
      fixture.projectRootRelativePath
    ) {
      failures.push('localProjectManifest.projectRoot debería coincidir con la carpeta detectada dentro del workspace.')
    }
    if (normalizeText(manifestSummary.readinessLevel) !== 'scaffold-materialized') {
      failures.push('localProjectManifest.readinessLevel debería rehidratarse como scaffold-materialized.')
    }
  }
  if (
    !normalizeText(decision?.reason || '').includes('proyecto existente') ||
    !normalizeText(decision?.instruction || '').includes('proyecto existente detectado')
  ) {
    failures.push('La continuidad debería explicar que se detectó un proyecto existente dentro del workspace.')
  }
  if (decision?.approvalRequestPlan || decision?.runtimeApprovalState) {
    failures.push('La detección del proyecto existente no debería exigir aprobación sensible.')
  }

  return {
    testCase: {
      id: 'existing-workspace-project-detection',
      label: 'Proyecto existente detectado antes del scaffold inicial',
      goal: fullstackLocalMaterializationCase.goal,
      context: fullstackLocalMaterializationCase.context,
    },
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction,
  }
}

async function runPortDomainCreatesNewProjectValidation() {
  const failures = []
  const fixture = await buildFullstackFixtureForCase({
    workspaceName: 'fullstack-project-existing-veterinary-for-port',
    goal: veterinaryFullstackLocalCase.goal,
    context: veterinaryFullstackLocalCase.context,
  })
  const decision = await requestContinuationDecision({
    fixture,
    testCase: portOperationsNewProjectCase,
  })
  const strategy = String(decision?.strategy || '').trim()
  const executionMode = String(decision?.executionMode || '').trim()
  const roadmapSummary = summarizeImplementationRoadmap(decision?.implementationRoadmap || null)
  const blueprintSummary = summarizeProjectBlueprint(decision?.projectBlueprint || null)
  const nextActionSummary = summarizeNextActionPlan(decision?.nextActionPlan || null)
  const existingProjectDetection =
    decision?.existingProjectDetection && typeof decision.existingProjectDetection === 'object'
      ? decision.existingProjectDetection
      : null
  const activeProjectContext =
    decision?.activeProjectContext && typeof decision.activeProjectContext === 'object'
      ? decision.activeProjectContext
      : null
  const intentSummary = classifyWorkspaceProjectIntent({
    goal: portOperationsNewProjectCase.goal,
    context: portOperationsNewProjectCase.context,
    candidate: {
      manifest: fixture.manifest,
      projectRootRelativePath: fixture.projectRootRelativePath,
    },
  })
  const modulePool = summarizeUniqueStrings([
    ...toStringArray(decision?.domainUnderstanding?.primaryModules, 24),
    ...roadmapSummary.phases.flatMap((entry) => [entry.goal, entry.title]),
    ...blueprintSummary.modules,
  ])
  const entityPool = summarizeUniqueStrings([
    ...toStringArray(decision?.domainUnderstanding?.primaryEntities, 24),
    ...blueprintSummary.entities,
  ])
  const projectSlugSignals = [
    activeProjectContext?.projectRoot,
    roadmapSummary.projectSlug,
    roadmapSummary.domain,
    blueprintSummary.domain,
  ]
    .map((entry) => normalizeIdentifier(entry))
    .filter(Boolean)
  const joinedReasoning = normalizeText(
    [decision?.reason, decision?.instruction, nextActionSummary.targetStrategy].join(' '),
  )

  if (intentSummary.intent !== 'new-project-intent') {
    failures.push(
      `La clasificacion de intención debería ser new-project-intent. Recibido: ${intentSummary.intent}.`,
    )
  }
  if (
    strategy === 'prepare-project-phase-plan' ||
    strategy === 'prepare-continuation-action-plan'
  ) {
    failures.push('El pedido portuario nuevo no deberia caer en continuidad del proyecto existente.')
  }
  if (existingProjectDetection?.detected !== true) {
    failures.push('El caso portuario deberia registrar que existe un proyecto previo en el workspace.')
  }
  if (existingProjectDetection?.applicable !== false) {
    failures.push('El proyecto detectado en el workspace deberia marcarse como no aplicable para el pedido portuario nuevo.')
  }
  if (normalizeIdentifier(activeProjectContext?.mode).includes('existing')) {
    failures.push('El activeProjectContext no deberia quedar como existing-project en el caso portuario nuevo.')
  }
  if (
    executionMode !== 'planner-only' &&
    executionMode !== 'executor'
  ) {
    failures.push(`executionMode inesperado para el caso portuario: ${executionMode || '(vacío)'}.`)
  }
  if (decision?.localProjectManifest) {
    failures.push('Un pedido portuario nuevo no deberia reusar localProjectManifest del proyecto existente.')
  }
  if (
    decision?.projectPhaseExecutionPlan ||
    decision?.continuationActionPlan ||
    decision?.projectContinuationState
  ) {
    failures.push('El pedido portuario nuevo no deberia devolver planes o estados de continuidad del proyecto viejo.')
  }
  if (decision?.expansionOptions) {
    failures.push('El pedido portuario nuevo no deberia exponer expansionOptions del proyecto viejo como opciones activas.')
  }
  if (
    normalizeIdentifier(nextActionSummary.targetStrategy).includes('prepare-dependency-install-plan') ||
    normalizeIdentifier(decision?.approvalRequestPlan?.approvalType || '').includes('dependency-install')
  ) {
    failures.push('El pedido portuario con exclusión explícita no deberia proponer prepare-dependency-install-plan.')
  }
  if (normalizeIdentifier(nextActionSummary.targetStrategy).includes('prepare-continuation-action-plan')) {
    failures.push('nextActionPlan.targetStrategy no deberia apuntar a prepare-continuation-action-plan en un proyecto portuario nuevo.')
  }
  if (normalizeText(nextActionSummary.userFacingLabel).includes('arquitectura')) {
    failures.push('El CTA del caso portuario nuevo no deberia quedar en “Revisar arquitectura” si ya existe una ruta local segura.')
  }
  if (joinedReasoning.includes('proyecto existente') || joinedReasoning.includes('veterinaria')) {
    failures.push('El razonamiento del caso portuario no deberia quedar pegado al proyecto veterinaria existente.')
  }
  if (
    !projectSlugSignals.some(
      (entry) =>
        entry.includes('port') || entry.includes('puert') || entry.includes('buque') || entry.includes('barco'),
    )
  ) {
    failures.push(
      `El slug/dominio propuesto deberia reflejar el dominio portuario. Recibido: ${projectSlugSignals.join(' | ') || '(vacio)'}.`,
    )
  }
  ;['buques', 'muelles', 'operaciones portuarias', 'documentacion'].forEach((expectedModule) => {
    if (!modulePool.some((entry) => normalizeText(entry).includes(normalizeText(expectedModule)))) {
      failures.push(`El caso portuario deberia conservar el modulo ${expectedModule}.`)
    }
  })
  ;['buque', 'muelle', 'operacion portuaria', 'documentacion'].forEach((expectedEntity) => {
    if (!entityPool.some((entry) => normalizeText(entry).includes(normalizeText(expectedEntity)))) {
      failures.push(`El caso portuario deberia conservar la entidad ${expectedEntity}.`)
    }
  })
  const combinedTargetPaths = summarizeUniqueStrings([
    ...(Array.isArray(decision?.executionScope?.allowedTargetPaths)
      ? decision.executionScope.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.moduleExpansionPlan?.allowedTargetPaths)
      ? decision.moduleExpansionPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.projectPhaseExecutionPlan?.allowedTargetPaths)
      ? decision.projectPhaseExecutionPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.continuationActionPlan?.allowedTargetPaths)
      ? decision.continuationActionPlan.allowedTargetPaths
      : []),
  ])
  if (
    combinedTargetPaths.some((entry) =>
      normalizePathForComparison(entry).includes('fullstack-local-veterinaria'),
    )
  ) {
    failures.push('allowedTargetPaths no deberia apuntar a fullstack-local-veterinaria en el caso portuario nuevo.')
  }
  if (
    normalizeIdentifier(blueprintSummary.domain).includes('seguridad') ||
    normalizeIdentifier(roadmapSummary.domain).includes('seguridad')
  ) {
    failures.push('El dominio portuario no deberia clasificarse como seguridad y monitoreo.')
  }

  return {
    testCase: portOperationsNewProjectCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode,
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runExplicitVeterinaryContinuationValidation() {
  const failures = []
  const fixture = await buildFullstackFixtureForCase({
    workspaceName: 'fullstack-project-explicit-veterinary-continuation',
    goal: veterinaryFullstackLocalCase.goal,
    context: veterinaryFullstackLocalCase.context,
  })
  const dynamicContinuationCase = {
    ...veterinaryContinuationCase,
    goal: `Continuá el proyecto ${fixture.projectRootRelativePath} y agregale reportes.`,
    context: 'Mantener la continuidad del proyecto existente y no crear uno nuevo.',
  }
  const decision = await requestContinuationDecision({
    fixture,
    testCase: dynamicContinuationCase,
  })
  const strategy = String(decision?.strategy || '').trim()
  const intentSummary = classifyWorkspaceProjectIntent({
    goal: dynamicContinuationCase.goal,
    context: dynamicContinuationCase.context,
    candidate: {
      manifest: fixture.manifest,
      projectRootRelativePath: fixture.projectRootRelativePath,
    },
  })
  const projectRootCandidates = summarizeUniqueStrings([
    decision?.moduleExpansionPlan?.projectRoot,
    decision?.projectPhaseExecutionPlan?.projectRoot,
    decision?.continuationActionPlan?.projectRoot,
    decision?.localProjectManifest?.projectRoot,
  ])
  const targetsCombined = summarizeUniqueStrings([
    ...(Array.isArray(decision?.moduleExpansionPlan?.allowedTargetPaths)
      ? decision.moduleExpansionPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.projectPhaseExecutionPlan?.allowedTargetPaths)
      ? decision.projectPhaseExecutionPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.continuationActionPlan?.allowedTargetPaths)
      ? decision.continuationActionPlan.allowedTargetPaths
      : []),
  ]).map((entry) => normalizePathForComparison(entry))

  if (intentSummary.intent !== 'continue-existing-project-intent') {
    failures.push(
      `La clasificacion de intención debería ser continue-existing-project-intent. Recibido: ${intentSummary.intent}.`,
    )
  }
  if (
    strategy === 'scalable-delivery-plan' ||
    strategy === 'safe-first-delivery-plan' ||
    strategy === 'materialize-fullstack-local-plan'
  ) {
    failures.push('La continuidad veterinaria no deberia recrear un proyecto nuevo.')
  }
  if (
    projectRootCandidates.length === 0 ||
    !projectRootCandidates.every(
      (entry) => normalizePathForComparison(entry) === fixture.projectRootRelativePath,
    )
  ) {
    failures.push('La continuidad veterinaria deberia mantener el mismo projectRoot detectado en el workspace.')
  }
  if (
    targetsCombined.length > 0 &&
    !targetsCombined.every((entry) => entry.startsWith(`${fixture.projectRootRelativePath}/`))
  ) {
    failures.push('La continuidad veterinaria no deberia apuntar rutas fuera del proyecto existente.')
  }
  if (
    decision?.moduleExpansionPlan &&
    !normalizeIdentifier(decision.moduleExpansionPlan.moduleId).includes('report')
  ) {
    failures.push('La continuidad veterinaria con reportes deberia apuntar al modulo reports.')
  }

  return {
    testCase: dynamicContinuationCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
}

async function runGenericNewDomainDoesNotReuseExistingProjectValidation() {
  const failures = []
  const fixture = await buildFullstackFixtureForCase({
    workspaceName: 'fullstack-project-existing-veterinary-for-helpdesk',
    goal: veterinaryFullstackLocalCase.goal,
    context: veterinaryFullstackLocalCase.context,
  })
  const decision = await requestContinuationDecision({
    fixture,
    testCase: internalHelpdeskNewProjectCase,
  })
  const strategy = String(decision?.strategy || '').trim()
  const nextActionSummary = summarizeNextActionPlan(decision?.nextActionPlan || null)
  const existingProjectDetection =
    decision?.existingProjectDetection && typeof decision.existingProjectDetection === 'object'
      ? decision.existingProjectDetection
      : null
  const activeProjectContext =
    decision?.activeProjectContext && typeof decision.activeProjectContext === 'object'
      ? decision.activeProjectContext
      : null
  const intentSummary = classifyWorkspaceProjectIntent({
    goal: internalHelpdeskNewProjectCase.goal,
    context: internalHelpdeskNewProjectCase.context,
    candidate: {
      manifest: fixture.manifest,
      projectRootRelativePath: fixture.projectRootRelativePath,
    },
  })
  const projectRootSignals = summarizeUniqueStrings([
    activeProjectContext?.projectRoot,
    decision?.implementationRoadmap?.projectSlug,
    decision?.projectBlueprint?.projectRoot,
  ]).map((entry) => normalizeIdentifier(entry))

  if (intentSummary.intent !== 'new-project-intent') {
    failures.push(
      `La mesa de ayuda nueva deberia clasificarse como new-project-intent. Recibido: ${intentSummary.intent}.`,
    )
  }
  if (existingProjectDetection?.detected !== true || existingProjectDetection?.applicable !== false) {
    failures.push('El proyecto veterinaria existente deberia detectarse pero marcarse como no aplicable.')
  }
  if (normalizeIdentifier(activeProjectContext?.mode).includes('existing')) {
    failures.push('La mesa de ayuda nueva no deberia usar activeProjectContext existing-project.')
  }
  if (
    strategy === 'prepare-project-phase-plan' ||
    strategy === 'prepare-continuation-action-plan' ||
    normalizeIdentifier(nextActionSummary.targetStrategy).includes('prepare-continuation-action-plan')
  ) {
    failures.push('La mesa de ayuda nueva no deberia entrar en continuidad del proyecto veterinaria.')
  }
  if (
    normalizeIdentifier(nextActionSummary.targetStrategy).includes('prepare-dependency-install-plan') ||
    normalizeIdentifier(decision?.approvalRequestPlan?.approvalType || '').includes('dependency-install')
  ) {
    failures.push('La mesa de ayuda nueva no deberia pedir aprobacion de dependencias cuando fueron excluidas.')
  }
  if (
    decision?.localProjectManifest ||
    decision?.projectContinuationState ||
    decision?.continuationActionPlan ||
    decision?.expansionOptions
  ) {
    failures.push('La mesa de ayuda nueva no deberia reusar manifest, continuidad ni expansionOptions del proyecto existente.')
  }
  const combinedTargetPaths = summarizeUniqueStrings([
    ...(Array.isArray(decision?.executionScope?.allowedTargetPaths)
      ? decision.executionScope.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.moduleExpansionPlan?.allowedTargetPaths)
      ? decision.moduleExpansionPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.projectPhaseExecutionPlan?.allowedTargetPaths)
      ? decision.projectPhaseExecutionPlan.allowedTargetPaths
      : []),
    ...(Array.isArray(decision?.continuationActionPlan?.allowedTargetPaths)
      ? decision.continuationActionPlan.allowedTargetPaths
      : []),
  ])
  if (
    combinedTargetPaths.some((entry) =>
      normalizePathForComparison(entry).includes('fullstack-local-veterinaria'),
    )
  ) {
    failures.push('La mesa de ayuda nueva no deberia targetear paths de fullstack-local-veterinaria.')
  }
  if (
    projectRootSignals.some((entry) => entry.includes('veterinaria')) ||
    (projectRootSignals.length > 0 &&
      !projectRootSignals.some(
        (entry) =>
          entry.includes('help') ||
          entry.includes('mesa') ||
          entry.includes('ticket') ||
          entry.includes('soporte'),
      ))
  ) {
    failures.push(
      `La mesa de ayuda nueva deberia proponer un projectRoot propio del dominio. Recibido: ${projectRootSignals.join(' | ') || '(vacio)'}.`,
    )
  }

  return {
    testCase: internalHelpdeskNewProjectCase,
    ok: failures.length === 0,
    failures,
    strategy,
    executionMode: String(decision?.executionMode || '').trim(),
    nextExpectedAction: String(decision?.nextExpectedAction || '').trim(),
  }
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
    80,
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
      const normalizedToken = normalizePathForComparison(token)
      if (!allowedTargetPaths.some((targetPath) => normalizePathForComparison(targetPath).endsWith(normalizedToken))) {
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
    [
      ...(Array.isArray(executionScope?.allowedTargetPaths)
        ? executionScope.allowedTargetPaths
        : []),
      ...(Array.isArray(materializationPlan?.operations)
        ? materializationPlan.operations.map((entry) => entry?.targetPath || '')
        : []),
    ],
    200,
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
      160,
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
    if (normalizeText(manifestSummary.readinessLevel) !== 'scaffold-materialized') {
      failures.push(
        `localProjectManifest.readinessLevel deberia marcar scaffold-materialized luego del scaffold base. Recibido: ${manifestSummary.readinessLevel || '(vacio)'}.`,
      )
    }
    if (manifestSummary.demoReady || manifestSummary.safeLocalDemoReady) {
      failures.push(
        'localProjectManifest no deberia marcar demoReady ni safeLocalDemoReady luego del scaffold base.',
      )
    }
    const normalizedRecommendedDemoScript = normalizeText(
      manifestSummary.recommendedDemoScript.join(' '),
    )
    if (
      !normalizedRecommendedDemoScript.includes('frontend/index.html') ||
      !normalizedRecommendedDemoScript.includes('doble click')
    ) {
      failures.push(
        `localProjectManifest.recommendedDemoScript deberia explicar como abrir frontend/index.html con doble click. Recibido: ${manifestSummary.recommendedDemoScript.join(' | ') || '(vacio)'}.`,
      )
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
    const scaffoldPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'fullstack-local-scaffold',
    )
    const frontendPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'frontend-mock-flow',
    )
    if (!scaffoldPhase?.summary || !scaffoldPhase.summary.toLocaleLowerCase().includes('scaffold')) {
      failures.push('La fase fullstack-local-scaffold deberia conservar un summary entendible dentro del manifest.')
    }
    if (scaffoldPhase?.nextRecommendedPhase !== 'frontend-mock-flow') {
      failures.push('La fase fullstack-local-scaffold deberia apuntar a frontend-mock-flow como siguiente fase.')
    }
    if (!frontendPhase?.safeToMaterialize) {
      failures.push('frontend-mock-flow deberia figurar safeToMaterialize=true dentro del manifest.')
    }
    if (frontendPhase?.targetStrategy !== 'prepare-project-phase-plan') {
      failures.push('frontend-mock-flow deberia declarar prepare-project-phase-plan como targetStrategy base.')
    }
    if (
      !frontendPhase?.allowedTargetPaths.some((entry) =>
        normalizePathForComparison(entry).endsWith('/frontend/src/mock-data.js'),
      )
    ) {
      failures.push('frontend-mock-flow deberia exponer allowedTargetPaths ricos dentro del manifest.')
    }
  }

  const expectedTargets = [
    'README.md',
    'package.json',
    'frontend/package.json',
    'frontend/admin/README.md',
    'frontend/public/README.md',
    'frontend/index.html',
    'frontend/src/main.js',
    'frontend/src/routes/index.js',
    'frontend/src/features/appointments.js',
    'frontend/src/styles.css',
    'frontend/src/mock-data.js',
    'frontend/src/components/App.js',
    'backend/package.json',
    'backend/src/server.js',
    'backend/src/routes/health.js',
    'backend/src/routes/appointments.js',
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
    'docs/api.md',
    'docs/data-model.md',
    'docs/local-runbook.md',
    'jefe-project.json',
  ]

  if (allowedTargetPaths.length === 0) {
    failures.push('allowedTargetPaths vacio en fase 2.')
  } else {
    expectedTargets.forEach((token) => {
      const normalizedToken = normalizePathForComparison(token)
      if (!allowedTargetPaths.some((targetPath) => normalizePathForComparison(targetPath).endsWith(normalizedToken))) {
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
    const frontendPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'frontend-mock-flow',
    )
    if (!frontendPhase?.objective || !normalizeText(frontendPhase.objective).includes('frontend')) {
      failures.push('frontend-mock-flow deberia conservar objective dentro del manifest.')
    }
    if (frontendPhase?.nextRecommendedPhase !== 'backend-contracts') {
      failures.push('frontend-mock-flow deberia declarar backend-contracts como siguiente fase.')
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
        const validationResults = Array.isArray(executionResult?.details?.validationResults)
          ? executionResult.details.validationResults
          : []
        const frontendCriticalPaths = [
          `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
          `${fixture.projectRootRelativePath}/frontend/src/components/App.js`,
          `${fixture.projectRootRelativePath}/frontend/src/styles.css`,
        ]
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

        if (validationResults.length === 0 || validationResults.some((entry) => entry?.ok === false)) {
          failures.push(
            'La ejecucion real de frontend-mock-flow debe devolver validaciones finales OK y no quedar sin coverage.',
          )
        }
        if (
          normalizeText(executionResult?.result || '').includes('pendiente de ejecucion') ||
          normalizeText(executionResult?.resultPreview || '').includes('pendiente de ejecucion')
        ) {
          failures.push(
            'La materializacion real de frontend-mock-flow no debe cerrar como pendiente de ejecucion.',
          )
        }
        frontendCriticalPaths.forEach((targetPath) => {
          const resolvedPath = path.join(fixture.workspacePath, targetPath)
          const stats = fs.statSync(resolvedPath)
          if (!stats.isFile() || Number(stats.size) <= 0) {
            failures.push(`${targetPath} no debe quedar vacio tras frontend-mock-flow.`)
          }
          if (!touchedPaths.some((entry) => entry.endsWith(normalizePathForComparison(targetPath)))) {
            failures.push(`La ejecucion real de frontend-mock-flow deberia tocar ${targetPath}.`)
          }
        })
        if (
          touchedPaths.some((entry) =>
            /\/backend\/|\/database\/|\/shared\/|package\.json$|node_modules|\/\.env$|docker/i.test(
              entry,
            ),
          )
        ) {
          failures.push(
            'frontend-mock-flow no debe tocar backend, database, shared, package.json, node_modules, .env ni Docker.',
          )
        }

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
        if (normalizeText(manifestFromDiskSummary.lastCompletedPhase) !== 'frontend-mock-flow') {
          failures.push(
            'El jefe-project.json resultante deberia marcar lastCompletedPhase como frontend-mock-flow.',
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
    `${fixture.projectRootRelativePath}/backend/src/server.js`,
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
        const serverModule = require(
          path.join(fixture.projectRootPath, 'backend', 'src', 'server.js'),
        )
        const healthModule = require(
          path.join(fixture.projectRootPath, 'backend', 'src', 'routes', 'health.js'),
        )
        const responseModule = require(
          path.join(fixture.projectRootPath, 'backend', 'src', 'lib', 'response.js'),
        )
        if (frontendAfter !== backendBefore.frontendMain) {
          failures.push('backend-contracts no deberia tocar frontend/src/main.js.')
        }
        if (databaseAfter !== backendBefore.databaseSchema) {
          failures.push('backend-contracts no deberia tocar database/schema.sql.')
        }
        if (
          typeof serverModule?.createServerContract !== 'function' ||
          serverModule.createServerContract()?.canListen !== false
        ) {
          failures.push('backend/src/server.js deberia exportar un contrato local sin listen() ni puertos.')
        }
        if (
          typeof healthModule?.healthRoute !== 'function' ||
          healthModule.healthRoute()?.ok !== true
        ) {
          failures.push('backend/src/routes/health.js deberia devolver una respuesta mock valida.')
        }
        if (
          typeof responseModule?.ok !== 'function' ||
          typeof responseModule?.fail !== 'function' ||
          typeof responseModule?.list !== 'function' ||
          typeof responseModule?.validation !== 'function'
        ) {
          failures.push('backend/src/lib/response.js deberia exponer helpers ok, fail, list y validation.')
        }

        ;[
          path.join(fixture.projectRootPath, 'backend', 'src', 'server.js'),
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
    `${fixture.projectRootRelativePath}/scripts/seed-local.js`,
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
        /frontend\/|backend\/|shared\/|node_modules|\.env$|docker|deploy/i.test(
          targetPath,
        ),
      )
    ) {
      failures.push('materializationPlan.operations no deberia tocar frontend, backend, shared, node_modules, .env, docker ni deploy.')
    }
  }

  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })
  if (
    allowedTargetPaths.some((targetPath) =>
      /frontend\/|backend\/|shared\/|node_modules|\.env$|docker|deploy/i.test(
        targetPath,
      ),
    )
  ) {
    failures.push('allowedTargetPaths no deberia incluir frontend, backend, shared, node_modules, .env, docker ni deploy.')
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
        const seedScriptSource = fs.readFileSync(
          path.join(fixture.projectRootPath, 'scripts', 'seed-local.js'),
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
        if (!seedScriptSource.includes('seedPreview') || !seedScriptSource.includes('printSeedPreview')) {
          failures.push('scripts/seed-local.js deberia quedar como preview local seguro del seed.')
        }
        execFileSync(
          process.execPath,
          ['--check', path.join(fixture.projectRootPath, 'scripts', 'seed-local.js')],
          { stdio: 'pipe' },
        )
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
    `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
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
    const invalidOperationTargets = operationTargets.filter((targetPath) => {
      if (targetPath.endsWith('/frontend/src/mock-data.js')) {
        return false
      }

      return /frontend\/|backend\/|shared\/|database\/|scripts\/|node_modules|\.env$|docker|deploy/i.test(
        targetPath,
      )
    })
    if (invalidOperationTargets.length > 0) {
      failures.push('materializationPlan.operations solo deberia tocar frontend/src/mock-data.js, docs y jefe-project.json durante local-validation.')
    }
  }

  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })
  const invalidAllowedTargetPaths = allowedTargetPaths.filter((targetPath) => {
    if (targetPath.endsWith('/frontend/src/mock-data.js')) {
      return false
    }

    return /frontend\/|backend\/|shared\/|database\/|scripts\/|node_modules|\.env$|docker|deploy/i.test(
      targetPath,
    )
  })
  if (invalidAllowedTargetPaths.length > 0) {
    failures.push('allowedTargetPaths solo deberia incluir frontend/src/mock-data.js, docs y jefe-project.json durante local-validation.')
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
        frontendMockData: fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'mock-data.js'),
          'utf8',
        ),
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
        const mockDataContent = fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'mock-data.js'),
          'utf8',
        )

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
        const normalizedValidationReportContent = normalizeText(validationReportContent)
        if (!normalizedValidationReportContent.includes(normalizeText('Validación local del proyecto'))) {
          failures.push('validation-report.md deberia incluir el titulo principal de validacion local.')
        }
        if (!normalizedValidationReportContent.includes(normalizeText('no se ejecutó base de datos'))) {
          failures.push('validation-report.md deberia aclarar que no se ejecuto base de datos.')
        }
        if (!normalizedValidationReportContent.includes(normalizeText('no se levantó backend'))) {
          failures.push('validation-report.md deberia aclarar que no se levanto backend.')
        }
        if (!normalizedValidationReportContent.includes(normalizeText('no se instalaron dependencias'))) {
          failures.push('validation-report.md deberia aclarar que no se instalaron dependencias.')
        }
        if (!validationReportContent.includes('review-and-expand')) {
          failures.push('validation-report.md deberia mencionar review-and-expand como siguiente paso.')
        }
        if (!validationReportContent.includes('| Scaffold fullstack local |')) {
          failures.push('validation-report.md deberia incluir la tabla final de fases y porcentajes.')
        }
        if (!validationReportContent.includes('Backend contracts | done | 75%')) {
          failures.push('validation-report.md deberia reflejar backend-contracts con 75% o mas.')
        }
        if (!validationReportContent.includes('Database design | done | 75%')) {
          failures.push('validation-report.md deberia reflejar database-design con 75% o mas.')
        }
        if (!validationReportContent.includes('Local validation | done | 65%')) {
          failures.push('validation-report.md deberia reflejar local-validation con 65% o mas.')
        }
        if (!validationReportContent.includes('Review and expand | available | 50%')) {
          failures.push('validation-report.md deberia reflejar review-and-expand preparado al 50%.')
        }
        if (!runbookContent.includes('local-validation')) {
          failures.push('docs/local-runbook.md deberia incluir la fase local-validation.')
        }
        if (manifestFromDiskSummary.lastCompletedPhase !== 'local-validation') {
          failures.push('El jefe-project.json resultante deberia marcar lastCompletedPhase como local-validation.')
        }
        if (manifestFromDisk?.safeLocalDemoReady !== true || manifestFromDisk?.completedCoreFlow !== true) {
          failures.push('El jefe-project.json resultante deberia marcar safeLocalDemoReady y completedCoreFlow en true.')
        }
        if (
          !Array.isArray(manifestFromDisk?.availableActions) ||
          !manifestFromDisk.availableActions.includes('review-and-expand')
        ) {
          failures.push('El jefe-project.json resultante deberia ofrecer review-and-expand dentro de availableActions.')
        }
        if (mockDataContent === beforeSnapshot.frontendMockData) {
          failures.push('local-validation deberia resincronizar frontend/src/mock-data.js con el estado funcional local validado.')
        }
        if (!mockDataContent.includes('Entrega funcional local validada')) {
          failures.push('frontend/src/mock-data.js deberia mostrar Entrega funcional local validada despues de local-validation.')
        }
        if (!mockDataContent.includes('review-and-expand')) {
          failures.push('frontend/src/mock-data.js deberia mencionar review-and-expand como siguiente fase segura.')
        }
        if (!mockDataContent.includes('Core flow completo')) {
          failures.push('frontend/src/mock-data.js deberia marcar el core flow como completo despues de local-validation.')
        }
        if (!mockDataContent.includes('local-validation')) {
          failures.push('frontend/src/mock-data.js deberia dejar visible que la ultima fase completada fue local-validation.')
        }
        if (
          mockDataContent.includes('Siguiente paso: backend-contracts') ||
          mockDataContent.includes('La demo sigue siendo local y mock. El próximo paso seguro es backend-contracts.')
        ) {
          failures.push('frontend/src/mock-data.js no deberia seguir mostrando backend-contracts como siguiente paso principal despues de local-validation.')
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
    if (!phaseSummary.executableNow) {
      failures.push('review-and-expand deberia quedar executableNow para materializacion segura local.')
    }
    if (phaseSummary.targetStrategy !== 'materialize-project-phase-plan') {
      failures.push(
        'review-and-expand deberia apuntar a materialize-project-phase-plan como targetStrategy.',
      )
    }
  }

  if (!nextActionPlan) {
    failures.push('nextActionPlan ausente en review-and-expand.')
  } else {
    const nextActionSummary = summarizeNextActionPlan(nextActionPlan)
    if (nextActionSummary.actionType !== 'expand-next-phase') {
      failures.push('review-and-expand deberia recomendar expand-next-phase.')
    }
    if (nextActionSummary.targetStrategy !== 'materialize-project-phase-plan') {
      failures.push(
        'review-and-expand deberia preparar una siguiente accion materialize-project-phase-plan.',
      )
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

async function runMaterializeReviewAndExpandValidation() {
  const reusablePlanningContext = buildReusablePlanningContext()
  let fixture = await buildModuleExpansionReadyFixture(
    'fullstack-project-phase-review-and-expand-materialization',
  )
  const testCase = phaseExecutionValidationCases.materializeReviewAndExpand
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
  const allowedTargetPaths = summarizeUniqueStrings(
    executionScope?.allowedTargetPaths,
    24,
  ).map(normalizePathForComparison)
  const expectedTargets = [
    `${fixture.projectRootRelativePath}/frontend/src/mock-data.js`,
    `${fixture.projectRootRelativePath}/docs/review-and-expand.md`,
    `${fixture.projectRootRelativePath}/docs/validation-report.md`,
    `${fixture.projectRootRelativePath}/docs/local-runbook.md`,
    `${fixture.projectRootRelativePath}/jefe-project.json`,
  ].map(normalizePathForComparison)

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
    failures.push('projectPhaseExecutionPlan ausente en materialize review-and-expand.')
  } else {
    const phaseSummary = summarizeProjectPhaseExecutionPlan(projectPhaseExecutionPlan)
    if (phaseSummary.phaseId !== 'review-and-expand') {
      failures.push('projectPhaseExecutionPlan.phaseId deberia ser review-and-expand.')
    }
    if (!phaseSummary.executableNow) {
      failures.push('review-and-expand deberia quedar executableNow en la materializacion.')
    }
  }

  if (!materializationPlan) {
    failures.push('materializationPlan ausente en materialize review-and-expand.')
  } else {
    if (String(materializationPlan.strategy || '').trim() !== 'materialize-project-phase-plan') {
      failures.push('materializationPlan.strategy incorrecto para review-and-expand.')
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
  }

  expectedTargets.forEach((targetPath) => {
    if (!allowedTargetPaths.includes(targetPath)) {
      failures.push(`allowedTargetPaths no incluye ${targetPath}.`)
    }
  })

  if (!localProjectManifest) {
    failures.push('localProjectManifest ausente en materialize review-and-expand.')
  } else {
    const manifestSummary = summarizeLocalProjectManifest(localProjectManifest)
    const reviewPhase = manifestSummary.phases.find(
      (entry) => entry.id === 'review-and-expand',
    )
    if (manifestSummary.nextRecommendedPhase !== 'prepare-reusable-candidate-plan') {
      failures.push(
        'localProjectManifest.nextRecommendedPhase deberia avanzar a prepare-reusable-candidate-plan.',
      )
    }
    if (!reviewPhase || reviewPhase.status !== 'done') {
      failures.push('localProjectManifest deberia marcar review-and-expand como done.')
    }
  }

  if (materializationPlan) {
    const task = buildLocalMaterializationTask({
      plan: materializationPlan,
      workspacePath: fixture.workspacePath,
      requestId: 'smoke-review-and-expand-materialization',
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
      failures.push('No se pudo construir la tarea local deterministica para review-and-expand.')
    } else {
      const executionResult = await runLocalDeterministicTask(task)
      if (executionResult?.ok !== true) {
        failures.push(
          executionResult?.error ||
            'La materializacion local de review-and-expand no termino en OK.',
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
        const reviewPath = path.join(
          fixture.workspacePath,
          fixture.projectRootRelativePath,
          'docs',
          'review-and-expand.md',
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
        const mockDataPath = path.join(
          fixture.projectRootPath,
          'frontend',
          'src',
          'mock-data.js',
        )
        const manifestFromDisk = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
        const manifestFromDiskSummary = summarizeLocalProjectManifest(manifestFromDisk)
        const reviewPhase = manifestFromDiskSummary.phases.find(
          (entry) => entry.id === 'review-and-expand',
        )
        const reviewContent = fs.readFileSync(reviewPath, 'utf8')
        const validationReportContent = fs.readFileSync(validationReportPath, 'utf8')
        const runbookContent = fs.readFileSync(runbookPath, 'utf8')
        const mockDataContent = fs.readFileSync(mockDataPath, 'utf8')

        expectedTargets.forEach((targetPath) => {
          if (
            !touchedPaths.some((entry) =>
              entry.endsWith(normalizePathForComparison(targetPath)),
            )
          ) {
            failures.push(`La ejecucion real de review-and-expand deberia tocar ${targetPath}.`)
          }
        })

        if (manifestFromDiskSummary.lastCompletedPhase !== 'review-and-expand') {
          failures.push(
            'El jefe-project.json resultante deberia marcar lastCompletedPhase como review-and-expand.',
          )
        }
        if (
          manifestFromDiskSummary.nextRecommendedPhase !==
          'prepare-reusable-candidate-plan'
        ) {
          failures.push(
            'El jefe-project.json resultante deberia apuntar a prepare-reusable-candidate-plan.',
          )
        }
        if (!reviewPhase || reviewPhase.status !== 'done') {
          failures.push(
            'El jefe-project.json resultante deberia marcar review-and-expand como done.',
          )
        }
        if (
          !Array.isArray(manifestFromDisk?.availableActions) ||
          !manifestFromDisk.availableActions.includes('prepare-reusable-candidate-plan')
        ) {
          failures.push(
            'El jefe-project.json resultante deberia ofrecer prepare-reusable-candidate-plan dentro de availableActions.',
          )
        }
        if (
          manifestFromDisk?.safeLocalDemoReady !== true ||
          manifestFromDisk?.completedCoreFlow !== true ||
          manifestFromDisk?.demoReady !== true
        ) {
          failures.push(
            'El jefe-project.json resultante deberia mantener demoReady, safeLocalDemoReady y completedCoreFlow en true.',
          )
        }
        if (!reviewContent.includes('Reusable candidate')) {
          failures.push('docs/review-and-expand.md deberia mencionar reusable candidate.')
        }
        if (!validationReportContent.includes('Review and expand | done | 90%')) {
          failures.push(
            'validation-report.md deberia reflejar review-and-expand como done al 90% o mas.',
          )
        }
        if (!runbookContent.includes('prepare-reusable-candidate-plan')) {
          failures.push(
            'docs/local-runbook.md deberia mencionar prepare-reusable-candidate-plan como siguiente accion segura.',
          )
        }
        if (!mockDataContent.includes('Review and expand completado')) {
          failures.push(
            'frontend/src/mock-data.js deberia reflejar Review and expand completado.',
          )
        }
        if (!mockDataContent.includes('prepare-reusable-candidate-plan')) {
          failures.push(
            'frontend/src/mock-data.js deberia reflejar prepare-reusable-candidate-plan como siguiente accion segura.',
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
        const mockDataContent = fs.readFileSync(
          path.join(fixture.projectRootPath, 'frontend', 'src', 'mock-data.js'),
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
        if (!appContent.includes('data-view-id')) {
          failures.push('App.js deberia seguir exponiendo la superficie generica data-view-id.')
        }
        if (!mockDataContent.includes(markers.app)) {
          failures.push(`mock-data.js deberia mencionar ${markers.app}.`)
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
  expectedStrategy = 'prepare-project-phase-plan',
  expectedExecutionMode = 'planner-only',
  expectedNextExpectedAction = 'review-project-phase',
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

  if (strategy !== expectedStrategy) {
    failures.push(
      `La validacion de continuidad deberia usar ${expectedStrategy}. Recibido: ${strategy || '(vacio)'}.`,
    )
  }
  if (executionMode !== expectedExecutionMode) {
    failures.push(
      `La validacion de continuidad deberia mantenerse en ${expectedExecutionMode}. Recibido: ${executionMode || '(vacio)'}.`,
    )
  }
  if (nextExpectedAction !== expectedNextExpectedAction) {
    failures.push(
      `La validacion de continuidad deberia devolver ${expectedNextExpectedAction}. Recibido: ${nextExpectedAction || '(vacio)'}.`,
    )
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
  let internalHardeningResults = []
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

    console.log('Internal Hardening Checks')
    console.log('=========================')
    internalHardeningResults = await Promise.all([
      runFullstackPhaseContractsHelperValidation(),
      runContextHubEventHelpersValidation(),
      runContextHubClientHelpersValidation(),
      runProjectContextHelpersValidation(),
    ])
    internalHardeningResults.forEach(printScalableValidationResult)
    console.log('-----------------')
  }

  let frontendMaterializationResult = null
  let fullstackMaterializationResult = null
  let rechargeMaterializationResult = null
  let soccerApprovalContinuationResult = null
  let logisticsApprovalContinuationResult = null
  let logisticsOpenAIWebScaffoldGuardResult = null
  let logisticsTimeoutFallbackNoWebScaffoldResult = null
  let logisticsExecutorBlocksWebScaffoldResult = null
  let logisticsValidMaterializationNotBlockedResult = null
  let logisticsPostApprovalNoWebBaseMaterializationResult = null
  let logisticsPrepareFunctionalDeliveryTransitionResult = null
  let logisticsNoDomainContaminationResult = null
  let logisticsMaterializationContractResult = null
  let existingProjectIsolationResult = null
  let soccerPreparedMaterializationTransitionResult = null
  let sensitiveApprovalRoutingResult = null
  let soccerMaterializationResult = null
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

    console.log('Recharge Materialization Domain Check')
    console.log('====================================')
    rechargeMaterializationResult =
      await runRechargeMaterializationDomainPurityValidation()
    printScalableValidationResult(rechargeMaterializationResult)
    console.log('-----------------')

    console.log('Soccer Ecommerce Approval Continuation Check')
    console.log('===========================================')
    soccerApprovalContinuationResult =
      await runSoccerEcommerceApprovalContinuationValidation()
    printScalableValidationResult(soccerApprovalContinuationResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Approval Continuation Check')
    console.log('==============================================')
    logisticsApprovalContinuationResult =
      await runLogisticsFullstackApprovalContinuationValidation()
    printScalableValidationResult(logisticsApprovalContinuationResult)
    console.log('-----------------')

    console.log('Logistics Fullstack OpenAI Web Scaffold Guard Check')
    console.log('==================================================')
    logisticsOpenAIWebScaffoldGuardResult =
      await runLogisticsFullstackOpenAIWebScaffoldGuardValidation()
    printScalableValidationResult(logisticsOpenAIWebScaffoldGuardResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Timeout Fallback No Web Scaffold Check')
    console.log('==========================================================')
    logisticsTimeoutFallbackNoWebScaffoldResult =
      await runLogisticsFullstackTimeoutFallbackNoWebScaffoldValidation()
    printScalableValidationResult(logisticsTimeoutFallbackNoWebScaffoldResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Executor Blocks Web Scaffold Check')
    console.log('======================================================')
    logisticsExecutorBlocksWebScaffoldResult =
      await runLogisticsFullstackExecutorBlocksWebScaffoldValidation()
    printScalableValidationResult(logisticsExecutorBlocksWebScaffoldResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Valid Materialization Not Blocked Check')
    console.log('===========================================================')
    logisticsValidMaterializationNotBlockedResult =
      await runTrackingLogisticsValidMaterializationNotBlockedValidation()
    printScalableValidationResult(logisticsValidMaterializationNotBlockedResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Post Approval No Web Base Materialization Check')
    console.log('===================================================================')
    logisticsPostApprovalNoWebBaseMaterializationResult =
      await runLogisticsFullstackPostApprovalNoWebBaseMaterializationValidation()
    printScalableValidationResult(logisticsPostApprovalNoWebBaseMaterializationResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Prepare Functional Delivery Transition Check')
    console.log('===============================================================')
    logisticsPrepareFunctionalDeliveryTransitionResult =
      await runTrackingLogisticsPrepareFunctionalDeliveryTransitionValidation()
    printScalableValidationResult(logisticsPrepareFunctionalDeliveryTransitionResult)
    console.log('-----------------')

    console.log('Logistics Fullstack No Domain Contamination Check')
    console.log('================================================')
    logisticsNoDomainContaminationResult =
      await runTrackingLogisticsNoDomainContaminationValidation()
    printScalableValidationResult(logisticsNoDomainContaminationResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Materialization Requires SQL Contract Check')
    console.log('==============================================================')
    const logisticsMaterializationRequiresSqlContractResult =
      await runTrackingLogisticsMaterializationRequiresSqlContractValidation()
    printScalableValidationResult(logisticsMaterializationRequiresSqlContractResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Materialization Rejects JSON Only Check')
    console.log('==========================================================')
    const logisticsMaterializationRejectsJsonOnlyResult =
      await runTrackingLogisticsMaterializationRejectsJsonOnlyValidation()
    printScalableValidationResult(logisticsMaterializationRejectsJsonOnlyResult)
    console.log('-----------------')

    console.log('Logistics Fullstack Materialization Contract Check')
    console.log('=================================================')
    logisticsMaterializationContractResult =
      await runTrackingLogisticsMaterializationContractValidation()
    printScalableValidationResult(logisticsMaterializationContractResult)
    console.log('-----------------')

    console.log('Existing Project Detection New Project Isolation Check')
    console.log('=====================================================')
    existingProjectIsolationResult =
      await runExistingProjectDetectionNewProjectIsolationValidation()
    printScalableValidationResult(existingProjectIsolationResult)
    console.log('-----------------')

    console.log('Soccer Ecommerce Prepared Materialization Transition Check')
    console.log('=========================================================')
    soccerPreparedMaterializationTransitionResult =
      await runSoccerEcommercePreparedMaterializationTransitionValidation()
    printScalableValidationResult(soccerPreparedMaterializationTransitionResult)
    console.log('-----------------')

    console.log('Sensitive Approval Routing Check')
    console.log('================================')
    sensitiveApprovalRoutingResult = await runSensitiveApprovalRoutingValidation()
    printScalableValidationResult(sensitiveApprovalRoutingResult)
    console.log('-----------------')

    console.log('Soccer Ecommerce Materialization Check')
    console.log('=====================================')
    soccerMaterializationResult =
      await runSoccerEcommerceMaterializationValidation()
    printScalableValidationResult(soccerMaterializationResult)
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
      await runMaterializeReviewAndExpandValidation(),
      await runProjectPhaseMaterializationCoverageGuardValidation(),
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
      await runExistingWorkspaceProjectDetectionValidation(),
      await runSelectedExistingProjectContinuationValidation(),
      await runPortDomainCreatesNewProjectValidation(),
      await runGenericNewDomainDoesNotReuseExistingProjectValidation(),
      await runExplicitVeterinaryContinuationValidation(),
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
        expectedNextActionId: 'review-and-expand',
        expectedProjectStatus: 'needs-review',
        expectedSafeActionIds: ['review-and-expand', 'notifications', 'reports', 'inventory'],
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
        expectedNextActionId: 'review-and-expand',
        expectedProjectStatus: 'needs-review',
        expectedSafeActionIds: ['review-and-expand', 'notifications', 'reports', 'inventory'],
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
        expectedNextActionId: 'review-and-expand',
        expectedProjectStatus: 'needs-review',
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
        expectedNextActionId: 'review-and-expand',
        expectedProjectStatus: 'needs-review',
        expectedSafeActionIds: ['review-and-expand'],
        expectedPlanningActionIds: [
          'prepare-frontend-improvement-plan',
          'prepare-backend-improvement-plan',
          'prepare-validation-improvement-plan',
        ],
        forbiddenMaterializableOptionIds: ['notifications', 'reports', 'inventory'],
      }),
      await runContinuationRecommendationValidation({
        testCase: continuationValidationCases.manifestReviewComplete,
        workspaceName: 'fullstack-project-continuation-review-complete',
        baseFixture: 'review-ready',
        manifestOptions: {
          phaseStatuses: {
            'fullstack-local-scaffold': 'done',
            'frontend-mock-flow': 'done',
            'backend-contracts': 'done',
            'database-design': 'done',
            'local-validation': 'done',
            'review-and-expand': 'done',
          },
          nextRecommendedPhase: 'prepare-reusable-candidate-plan',
        },
        expectedStrategy: 'prepare-continuation-action-plan',
        expectedNextExpectedAction: 'review-continuation-action',
        expectedNextPhase: 'prepare-reusable-candidate-plan',
        expectedNextActionId: 'prepare-reusable-candidate-plan',
        expectedProjectStatus: 'safe-module-expansion-ready',
        expectedSafeActionIds: ['notifications', 'reports', 'inventory'],
        expectedPlanningActionIds: ['prepare-reusable-candidate-plan'],
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
        expectedNextActionId: 'review-and-expand',
        expectedProjectStatus: 'needs-review',
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
        expectedProjectStatus: 'needs-review',
        expectedSafeActionIds: ['review-and-expand', 'reports', 'inventory'],
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
  const failedInternalHardeningResults = internalHardeningResults.filter(
    (result) => !result.ok,
  )
  const failedProjectPhaseExecutionResults = projectPhaseExecutionResults.filter(
    (result) => !result.ok,
  )
  const failedContinuationResults = continuationResults.filter((result) => !result.ok)
  const frontendMaterializationFailed = frontendMaterializationResult?.ok === false
  const fullstackMaterializationFailed = fullstackMaterializationResult?.ok === false
  const rechargeMaterializationFailed = rechargeMaterializationResult?.ok === false
  const soccerApprovalContinuationFailed = soccerApprovalContinuationResult?.ok === false
  const logisticsApprovalContinuationFailed =
    logisticsApprovalContinuationResult?.ok === false
  const logisticsOpenAIWebScaffoldGuardFailed =
    logisticsOpenAIWebScaffoldGuardResult?.ok === false
  const logisticsTimeoutFallbackNoWebScaffoldFailed =
    logisticsTimeoutFallbackNoWebScaffoldResult?.ok === false
  const logisticsExecutorBlocksWebScaffoldFailed =
    logisticsExecutorBlocksWebScaffoldResult?.ok === false
  const logisticsValidMaterializationNotBlockedFailed =
    logisticsValidMaterializationNotBlockedResult?.ok === false
  const logisticsPostApprovalNoWebBaseMaterializationFailed =
    logisticsPostApprovalNoWebBaseMaterializationResult?.ok === false
  const logisticsPrepareFunctionalDeliveryTransitionFailed =
    logisticsPrepareFunctionalDeliveryTransitionResult?.ok === false
  const logisticsNoDomainContaminationFailed =
    logisticsNoDomainContaminationResult?.ok === false
  const logisticsMaterializationContractFailed =
    logisticsMaterializationContractResult?.ok === false
  const existingProjectIsolationFailed =
    existingProjectIsolationResult?.ok === false
  const soccerPreparedMaterializationTransitionFailed =
    soccerPreparedMaterializationTransitionResult?.ok === false
  const sensitiveApprovalRoutingFailed = sensitiveApprovalRoutingResult?.ok === false
  const soccerMaterializationFailed = soccerMaterializationResult?.ok === false

  if (
    failedResults.length === 0 &&
    failedScalableResults.length === 0 &&
    failedQuestionPolicyResults.length === 0 &&
    failedInternalHardeningResults.length === 0 &&
    failedContinuationResults.length === 0 &&
    failedProjectPhaseExecutionResults.length === 0 &&
    !frontendMaterializationFailed &&
    !fullstackMaterializationFailed &&
    !rechargeMaterializationFailed &&
    !soccerApprovalContinuationFailed &&
    !logisticsApprovalContinuationFailed &&
    !logisticsOpenAIWebScaffoldGuardFailed &&
    !logisticsTimeoutFallbackNoWebScaffoldFailed &&
    !logisticsExecutorBlocksWebScaffoldFailed &&
    !logisticsValidMaterializationNotBlockedFailed &&
    !logisticsPostApprovalNoWebBaseMaterializationFailed &&
    !logisticsPrepareFunctionalDeliveryTransitionFailed &&
    !logisticsNoDomainContaminationFailed &&
    !logisticsMaterializationContractFailed &&
    !existingProjectIsolationFailed &&
    !soccerPreparedMaterializationTransitionFailed &&
    !sensitiveApprovalRoutingFailed &&
    !soccerMaterializationFailed
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
    if (internalHardeningResults.length > 0) {
      console.log(
        `OK. ${internalHardeningResults.length}/${internalHardeningResults.length} checks de hardening interno pasaron.`,
      )
    }
    if (frontendMaterializationResult) {
      console.log('OK. 1/1 check de materializacion frontend-project paso.')
    }
    if (fullstackMaterializationResult) {
      console.log('OK. 1/1 check de materializacion fullstack-local paso.')
    }
    if (rechargeMaterializationResult) {
      console.log('OK. 1/1 check de materializacion de pedidos de recarga paso.')
    }
    if (soccerApprovalContinuationResult) {
      console.log('OK. 1/1 check de continuidad post-approval ecommerce de pelotas paso.')
    }
    if (logisticsApprovalContinuationResult) {
      console.log(
        'OK. 1/1 check de continuidad post-approval fullstack logistico paso.',
      )
    }
    if (logisticsOpenAIWebScaffoldGuardResult) {
      console.log(
        'OK. 1/1 check de guard OpenAI contra web-scaffold-base en fullstack logistico paso.',
      )
    }
    if (logisticsTimeoutFallbackNoWebScaffoldResult) {
      console.log(
        'OK. 1/1 check de fallback local-rules post-timeout sin web-scaffold-base en fullstack logistico paso.',
      )
    }
    if (logisticsExecutorBlocksWebScaffoldResult) {
      console.log(
        'OK. 1/1 check de bloqueo del executor contra web-scaffold-base degradado en fullstack logistico paso.',
      )
    }
    if (logisticsValidMaterializationNotBlockedResult) {
      console.log(
        'OK. 1/1 check de materializacion fullstack valida no bloqueada por el safety gate paso.',
      )
    }
    if (logisticsPostApprovalNoWebBaseMaterializationResult) {
      console.log(
        'OK. 1/1 check de continuidad post-approval sin materializacion web base en fullstack logistico paso.',
      )
    }
    if (logisticsPrepareFunctionalDeliveryTransitionResult) {
      console.log(
        'OK. 1/1 check de transicion de Preparar entrega funcional local a materialize-fullstack-local-plan paso.',
      )
    }
    if (logisticsNoDomainContaminationResult) {
      console.log(
        'OK. 1/1 check de no contaminacion de dominio logistico en la materializacion paso.',
      )
    }
    if (logisticsMaterializationContractResult) {
      console.log(
        'OK. 1/1 check de contrato materializable fullstack logistico paso.',
      )
    }
    if (existingProjectIsolationResult) {
      console.log(
        'OK. 1/1 check de aislamiento de proyecto nuevo frente a fullstack-local-veterinaria paso.',
      )
    }
    if (soccerPreparedMaterializationTransitionResult) {
      console.log(
        'OK. 1/1 check de transicion segura ecommerce de pelotas a materializacion paso.',
      )
    }
    if (sensitiveApprovalRoutingResult) {
      console.log('OK. 1/1 check de approval sensible para deploy y pagos reales paso.')
    }
    if (soccerMaterializationResult) {
      console.log('OK. 1/1 check de materializacion ecommerce de pelotas paso.')
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

  if (failedInternalHardeningResults.length > 0) {
    console.log('checks de hardening interno fallidos:')
    failedInternalHardeningResults.forEach((result) => {
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
  if (rechargeMaterializationFailed) {
    console.log('check de materializacion de pedidos de recarga fallido:')
    console.log(
      `- ${rechargeMaterializationResult.testCase.id}: ${
        rechargeMaterializationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (soccerApprovalContinuationFailed) {
    console.log('check de continuidad post-approval ecommerce de pelotas fallido:')
    console.log(
      `- ${soccerApprovalContinuationResult.testCase.id}: ${
        soccerApprovalContinuationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsApprovalContinuationFailed) {
    console.log('check de continuidad post-approval fullstack logistico fallido:')
    console.log(
      `- ${logisticsApprovalContinuationResult.testCase.id}: ${
        logisticsApprovalContinuationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsOpenAIWebScaffoldGuardFailed) {
    console.log('check de guard OpenAI contra web-scaffold-base en fullstack logistico fallido:')
    console.log(
      `- ${logisticsOpenAIWebScaffoldGuardResult.testCase.id}: ${
        logisticsOpenAIWebScaffoldGuardResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsTimeoutFallbackNoWebScaffoldFailed) {
    console.log('check de fallback local-rules post-timeout sin web-scaffold-base en fullstack logistico fallido:')
    console.log(
      `- ${logisticsTimeoutFallbackNoWebScaffoldResult.testCase.id}: ${
        logisticsTimeoutFallbackNoWebScaffoldResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsExecutorBlocksWebScaffoldFailed) {
    console.log('check de bloqueo del executor contra web-scaffold-base degradado en fullstack logistico fallido:')
    console.log(
      `- ${logisticsExecutorBlocksWebScaffoldResult.testCase.id}: ${
        logisticsExecutorBlocksWebScaffoldResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsValidMaterializationNotBlockedFailed) {
    console.log('check de materializacion fullstack valida no bloqueada por el safety gate fallido:')
    console.log(
      `- ${logisticsValidMaterializationNotBlockedResult.testCase.id}: ${
        logisticsValidMaterializationNotBlockedResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsPostApprovalNoWebBaseMaterializationFailed) {
    console.log('check de continuidad post-approval sin materializacion web base en fullstack logistico fallido:')
    console.log(
      `- ${logisticsPostApprovalNoWebBaseMaterializationResult.testCase.id}: ${
        logisticsPostApprovalNoWebBaseMaterializationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsPrepareFunctionalDeliveryTransitionFailed) {
    console.log('check de transicion de Preparar entrega funcional local a materialize-fullstack-local-plan fallido:')
    console.log(
      `- ${logisticsPrepareFunctionalDeliveryTransitionResult.testCase.id}: ${
        logisticsPrepareFunctionalDeliveryTransitionResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsNoDomainContaminationFailed) {
    console.log('check de no contaminacion de dominio logistico en la materializacion fallido:')
    console.log(
      `- ${logisticsNoDomainContaminationResult.testCase.id}: ${
        logisticsNoDomainContaminationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (logisticsMaterializationContractFailed) {
    console.log('check de contrato materializable fullstack logistico fallido:')
    console.log(
      `- ${logisticsMaterializationContractResult.testCase.id}: ${
        logisticsMaterializationContractResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (existingProjectIsolationFailed) {
    console.log('check de aislamiento de proyecto nuevo frente a fullstack-local-veterinaria fallido:')
    console.log(
      `- ${existingProjectIsolationResult.testCase.id}: ${
        existingProjectIsolationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (soccerPreparedMaterializationTransitionFailed) {
    console.log('check de transicion segura ecommerce de pelotas a materializacion fallido:')
    console.log(
      `- ${soccerPreparedMaterializationTransitionResult.testCase.id}: ${
        soccerPreparedMaterializationTransitionResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (sensitiveApprovalRoutingFailed) {
    console.log('check de approval sensible para deploy y pagos reales fallido:')
    console.log(
      `- ${sensitiveApprovalRoutingResult.testCase.id}: ${
        sensitiveApprovalRoutingResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  if (soccerMaterializationFailed) {
    console.log('check de materializacion ecommerce de pelotas fallido:')
    console.log(
      `- ${soccerMaterializationResult.testCase.id}: ${
        soccerMaterializationResult.failures[0] || 'sin detalle'
      }`,
    )
  }
  process.exit(1)
}

await main()
