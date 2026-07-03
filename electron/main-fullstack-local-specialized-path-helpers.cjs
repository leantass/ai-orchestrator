function resolveFullstackLocalSpecializedContractFlags(fullstackContractProfile) {
  const normalizedArchetype =
    typeof fullstackContractProfile?.archetype === 'string'
      ? fullstackContractProfile.archetype.trim()
      : ''
  const usesLogisticsFullstackContract = normalizedArchetype === 'logistics-tracking'
  const usesOnlineCoursesFullstackContract = normalizedArchetype === 'online-courses'
  const usesCanonicalSpecializedFullstackContract =
    usesLogisticsFullstackContract || usesOnlineCoursesFullstackContract

  return {
    usesLogisticsFullstackContract,
    usesOnlineCoursesFullstackContract,
    usesCanonicalSpecializedFullstackContract,
    usesLegacyMaterializationProfile:
      normalizedArchetype.length > 0 && normalizedArchetype !== 'operations',
  }
}

function buildFullstackLocalSpecializedPathPlan({
  fullstackContractPaths,
  frontendStudentFolder,
  backendServicesFolder,
  frontendSrcFolder,
  frontendRoutesFolder,
  frontendFeaturesFolder,
  frontendComponentsFolder,
  frontendIndexHtmlPath,
  frontendMainJsPath,
  frontendRoutesPath,
  frontendFeaturePath,
  frontendStylesPath,
  frontendMockDataPath,
  frontendAppComponentPath,
  usesLogisticsFullstackContract,
  usesOnlineCoursesFullstackContract,
  usesCanonicalSpecializedFullstackContract,
}) {
  const genericFrontendFolders = usesCanonicalSpecializedFullstackContract
    ? []
    : [
        frontendSrcFolder,
        frontendRoutesFolder,
        frontendFeaturesFolder,
        frontendComponentsFolder,
      ]
  const genericFrontendFiles = usesCanonicalSpecializedFullstackContract
    ? []
    : [
        frontendIndexHtmlPath,
        fullstackContractPaths.frontendAdminIndexPath,
        fullstackContractPaths.frontendPublicIndexPath,
        frontendMainJsPath,
        frontendRoutesPath,
        frontendFeaturePath,
        frontendStylesPath,
        frontendMockDataPath,
        frontendAppComponentPath,
      ]
  const additionalAllowedFolderTargets = [
    ...(usesOnlineCoursesFullstackContract ? [frontendStudentFolder] : []),
    ...(usesOnlineCoursesFullstackContract ? [backendServicesFolder] : []),
  ]
  const canonicalSpecializedPathTargets = usesCanonicalSpecializedFullstackContract
    ? [
        fullstackContractPaths.frontendAdminIndexPath,
        fullstackContractPaths.frontendAdminAppPath,
        fullstackContractPaths.frontendAdminStylesPath,
        fullstackContractPaths.frontendPublicIndexPath,
        fullstackContractPaths.frontendPublicAppPath,
        fullstackContractPaths.frontendPublicStylesPath,
        fullstackContractPaths.docsArchitecturePath,
        fullstackContractPaths.docsApiPath,
        fullstackContractPaths.docsDbSchemaPath,
      ]
    : []
  const logisticsSpecializedPathTargets = usesLogisticsFullstackContract
    ? [
        fullstackContractPaths.backendTrackingRoutePath,
        fullstackContractPaths.backendReportsRoutePath,
        fullstackContractPaths.sharedStatusesPath,
      ]
    : []
  const onlineCoursesAllowedTargetPaths = usesOnlineCoursesFullstackContract
    ? [
        fullstackContractPaths.frontendStudentIndexPath,
        fullstackContractPaths.frontendStudentAppPath,
        fullstackContractPaths.frontendStudentStylesPath,
        fullstackContractPaths.frontendStudentReadmePath,
        fullstackContractPaths.backendCategoriesRoutePath,
        fullstackContractPaths.backendModulesRoutePath,
        fullstackContractPaths.backendLessonsRoutePath,
        fullstackContractPaths.backendStudentsRoutePath,
        fullstackContractPaths.backendEnrollmentsRoutePath,
        fullstackContractPaths.backendPlansRoutePath,
        fullstackContractPaths.backendPaymentsRoutePath,
        fullstackContractPaths.backendProgressRoutePath,
        fullstackContractPaths.backendMockMercadoPagoServicePath,
        fullstackContractPaths.sharedPlansPath,
        fullstackContractPaths.sharedPaymentStatusesPath,
        fullstackContractPaths.sharedCourseStatusesPath,
        fullstackContractPaths.docsPaymentsMockPath,
        fullstackContractPaths.docsLocalValidationPath,
      ]
    : []
  const onlineCoursesScaffoldFiles = usesOnlineCoursesFullstackContract
    ? [
        fullstackContractPaths.frontendStudentIndexPath,
        fullstackContractPaths.frontendStudentAppPath,
        fullstackContractPaths.frontendStudentStylesPath,
        fullstackContractPaths.backendCategoriesRoutePath,
        fullstackContractPaths.backendModulesRoutePath,
        fullstackContractPaths.backendLessonsRoutePath,
        fullstackContractPaths.backendStudentsRoutePath,
        fullstackContractPaths.backendEnrollmentsRoutePath,
        fullstackContractPaths.backendPlansRoutePath,
        fullstackContractPaths.backendPaymentsRoutePath,
        fullstackContractPaths.backendProgressRoutePath,
        fullstackContractPaths.backendMockMercadoPagoServicePath,
        fullstackContractPaths.sharedPlansPath,
        fullstackContractPaths.sharedPaymentStatusesPath,
        fullstackContractPaths.sharedCourseStatusesPath,
        fullstackContractPaths.docsPaymentsMockPath,
        fullstackContractPaths.docsLocalValidationPath,
      ]
    : []

  return {
    genericFrontendFolders,
    genericFrontendFiles,
    additionalAllowedFolderTargets,
    additionalAllowedTargetPaths: [
      ...canonicalSpecializedPathTargets,
      ...logisticsSpecializedPathTargets,
      ...onlineCoursesAllowedTargetPaths,
    ],
    additionalScaffoldFiles: [
      ...canonicalSpecializedPathTargets,
      ...logisticsSpecializedPathTargets,
      ...onlineCoursesScaffoldFiles,
    ],
  }
}

module.exports = {
  resolveFullstackLocalSpecializedContractFlags,
  buildFullstackLocalSpecializedPathPlan,
}