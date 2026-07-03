function buildLocalRouteContractModuleContent({ path, purpose }) {
  return `const routeContract = {
  method: 'GET',
  path: ${JSON.stringify(path)},
  purpose: ${JSON.stringify(purpose)},
  localOnly: true,
  activeRuntime: false,
}

module.exports = {
  routeContract,
}
`
}

function buildReplaceFileOperation(targetPath, nextContent) {
  return {
    type: 'replace-file',
    targetPath,
    nextContent,
  }
}

function buildFullstackLocalSpecializedBackendContentBundle({
  fullstackContractProfile,
  usesLogisticsFullstackContract,
  usesOnlineCoursesFullstackContract,
}) {
  const backendMockMercadoPagoServiceContent = usesOnlineCoursesFullstackContract
    ? `const PAYMENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled']

function createMockPreference(input = {}) {
  return {
    provider: 'mock-mercado-pago',
    mode: 'sandbox-local',
    externalCall: false,
    credentialsRequired: false,
    studentId: input.studentId || '',
    planCode: input.planCode || 'free',
    amountLabel: input.amountLabel || '$0',
    status: PAYMENT_STATUSES.includes(input.status) ? input.status : 'pending',
  }
}

module.exports = {
  PAYMENT_STATUSES,
  createMockPreference,
}
`
    : ''
  const sharedStatusesContent = usesLogisticsFullstackContract
    ? `const SHIPMENT_STATUSES = ['pendiente', 'en preparación', 'en tránsito', 'entregado', 'incidencia']
const INCIDENT_STATUSES = ['pendiente', 'en revisión', 'resuelto']
const TRACKING_EVENT_TYPES = ['alta', 'salida de depósito', 'en tránsito', 'incidencia', 'entrega']

module.exports = {
  SHIPMENT_STATUSES,
  INCIDENT_STATUSES,
  TRACKING_EVENT_TYPES,
}
`
    : ''
  const sharedPlansContent = usesOnlineCoursesFullstackContract
    ? `const PLAN_RULES = {
  Free: {
    code: 'free',
    access: ['free-lessons'],
    description: 'Acceso limitado a clases gratuitas.',
  },
  Plata: {
    code: 'plata',
    access: ['free-lessons', 'selected-courses', 'full-progress'],
    description: 'Acceso a cursos seleccionados y progreso completo.',
  },
  Oro: {
    code: 'oro',
    access: ['free-lessons', 'selected-courses', 'all-courses', 'full-progress', 'advanced-reports'],
    description: 'Acceso completo y beneficios simulados.',
  },
}

module.exports = {
  PLAN_RULES,
}
`
    : ''
  const sharedPaymentStatusesContent = usesOnlineCoursesFullstackContract
    ? `const PAYMENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled']

module.exports = {
  PAYMENT_STATUSES,
}
`
    : ''
  const sharedCourseStatusesContent = usesOnlineCoursesFullstackContract
    ? `const COURSE_STATUSES = ['draft', 'published', 'archived']

module.exports = {
  COURSE_STATUSES,
}
`
    : ''

  return {
    backendMockMercadoPagoServiceContent,
    sharedStatusesContent,
    sharedPlansContent,
    sharedPaymentStatusesContent,
    sharedCourseStatusesContent,
    backendCategoriesRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/categories',
          purpose: 'Listar categorias locales del catálogo de cursos.',
        })
      : '',
    backendModulesRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/modules',
          purpose: 'Listar modulos locales por curso.',
        })
      : '',
    backendLessonsRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/lessons',
          purpose: 'Listar clases locales y su acceso gratuito o premium.',
        })
      : '',
    backendStudentsRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/students',
          purpose: 'Listar alumnos mock y su plan activo.',
        })
      : '',
    backendEnrollmentsRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/enrollments',
          purpose: 'Listar inscripciones locales y acceso por plan.',
        })
      : '',
    backendPlansRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/plans',
          purpose: 'Exponer reglas mock de Free, Plata y Oro.',
        })
      : '',
    backendPaymentsRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/payments',
          purpose: 'Listar pagos simulados y estados mock sin pasarela real.',
        })
      : '',
    backendProgressRouteContent: usesOnlineCoursesFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/progress',
          purpose: 'Listar progreso local por curso, modulo y clase.',
        })
      : '',
    backendTrackingRouteContent: usesLogisticsFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: fullstackContractProfile.publicRoutePath || '/tracking/:code',
          purpose:
            fullstackContractProfile.publicRoutePurpose ||
            'Consultar tracking publico mock por codigo sin servicios reales.',
        })
      : '',
    backendReportsRouteContent: usesLogisticsFullstackContract
      ? buildLocalRouteContractModuleContent({
          path: '/reports',
          purpose:
            'Resumen local de envíos, incidencias y métricas básicas sin exportación real.',
        })
      : '',
  }
}

function buildFullstackLocalSpecializedMaterializationOperations({
  usesLogisticsFullstackContract,
  usesOnlineCoursesFullstackContract,
  fullstackContractPaths,
  frontendContentBundle,
  documentationContentBundle,
  backendContentBundle,
  databaseCanonicalSeedContent,
}) {
  const preCoreOperations = usesLogisticsFullstackContract
    ? [
        buildReplaceFileOperation(
          fullstackContractPaths.frontendAdminIndexPath,
          frontendContentBundle.logisticsAdminIndexHtmlContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.frontendAdminAppPath,
          frontendContentBundle.logisticsAdminAppJsContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.frontendAdminStylesPath,
          frontendContentBundle.logisticsSurfaceStylesContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.frontendPublicIndexPath,
          frontendContentBundle.logisticsPublicIndexHtmlContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.frontendPublicAppPath,
          frontendContentBundle.logisticsPublicAppJsContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.frontendPublicStylesPath,
          frontendContentBundle.logisticsSurfaceStylesContent,
        ),
      ]
    : usesOnlineCoursesFullstackContract
      ? [
          buildReplaceFileOperation(
            fullstackContractPaths.frontendStudentReadmePath,
            frontendContentBundle.frontendStudentReadmeContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendAdminIndexPath,
            frontendContentBundle.onlineCoursesAdminIndexHtmlContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendAdminAppPath,
            frontendContentBundle.onlineCoursesAdminAppJsContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendAdminStylesPath,
            frontendContentBundle.logisticsSurfaceStylesContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendPublicIndexPath,
            frontendContentBundle.onlineCoursesPublicIndexHtmlContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendPublicAppPath,
            frontendContentBundle.onlineCoursesPublicAppJsContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendPublicStylesPath,
            frontendContentBundle.logisticsSurfaceStylesContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendStudentIndexPath,
            frontendContentBundle.onlineCoursesStudentIndexHtmlContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendStudentAppPath,
            frontendContentBundle.onlineCoursesStudentAppJsContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.frontendStudentStylesPath,
            frontendContentBundle.logisticsSurfaceStylesContent,
          ),
        ]
      : []

  const coreExtensionOperations = [
    ...(usesLogisticsFullstackContract
      ? [
          buildReplaceFileOperation(
            fullstackContractPaths.databaseSeedPath,
            databaseCanonicalSeedContent,
          ),
        ]
      : []),
    ...(usesOnlineCoursesFullstackContract
      ? [
          buildReplaceFileOperation(
            fullstackContractPaths.databaseSeedPath,
            databaseCanonicalSeedContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.sharedPlansPath,
            backendContentBundle.sharedPlansContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.sharedPaymentStatusesPath,
            backendContentBundle.sharedPaymentStatusesContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.sharedCourseStatusesPath,
            backendContentBundle.sharedCourseStatusesContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendCategoriesRoutePath,
            backendContentBundle.backendCategoriesRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendModulesRoutePath,
            backendContentBundle.backendModulesRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendLessonsRoutePath,
            backendContentBundle.backendLessonsRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendStudentsRoutePath,
            backendContentBundle.backendStudentsRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendEnrollmentsRoutePath,
            backendContentBundle.backendEnrollmentsRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendPlansRoutePath,
            backendContentBundle.backendPlansRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendPaymentsRoutePath,
            backendContentBundle.backendPaymentsRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendProgressRoutePath,
            backendContentBundle.backendProgressRouteContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.backendMockMercadoPagoServicePath,
            backendContentBundle.backendMockMercadoPagoServiceContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.docsArchitecturePath,
            documentationContentBundle.docsCanonicalArchitectureContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.docsApiPath,
            documentationContentBundle.docsCanonicalApiContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.docsDbSchemaPath,
            documentationContentBundle.docsCanonicalDbSchemaContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.docsPaymentsMockPath,
            documentationContentBundle.docsPaymentsMockContent,
          ),
          buildReplaceFileOperation(
            fullstackContractPaths.docsLocalValidationPath,
            documentationContentBundle.docsLocalValidationContent,
          ),
        ]
      : []),
  ]

  const postCoreOperations = usesLogisticsFullstackContract
    ? [
        buildReplaceFileOperation(
          fullstackContractPaths.sharedStatusesPath,
          backendContentBundle.sharedStatusesContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.backendTrackingRoutePath,
          backendContentBundle.backendTrackingRouteContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.backendReportsRoutePath,
          backendContentBundle.backendReportsRouteContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.docsArchitecturePath,
          documentationContentBundle.docsCanonicalArchitectureContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.docsApiPath,
          documentationContentBundle.docsCanonicalApiContent,
        ),
        buildReplaceFileOperation(
          fullstackContractPaths.docsDbSchemaPath,
          documentationContentBundle.docsCanonicalDbSchemaContent,
        ),
      ]
    : []

  return {
    preCoreOperations,
    coreExtensionOperations,
    postCoreOperations,
  }
}

module.exports = {
  buildFullstackLocalSpecializedBackendContentBundle,
  buildFullstackLocalSpecializedMaterializationOperations,
}