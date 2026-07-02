function buildPlanningApprovalBundle(
  {
    strategy,
    scalableDeliveryPlan,
    localProjectManifest,
    nextActionPlan,
    validationPlan,
    continuationActionPlan,
    projectContinuationState,
  },
  {
    buildProjectReadinessState,
    buildRuntimeApprovalState,
    syncLocalProjectManifestWithContinuationState,
    syncLocalProjectManifestWithRuntimeApprovalState,
    syncLocalProjectManifestWithReadinessState,
    normalizeLocalProjectManifestContract,
    buildApprovalRequestPlan,
  },
) {
  const provisionalProjectReadinessState = buildProjectReadinessState({
    strategy,
    scalableDeliveryPlan,
    localProjectManifest,
    nextActionPlan,
    validationPlan,
    projectContinuationState,
  })
  const runtimeApprovalState = buildRuntimeApprovalState({
    continuationActionPlan,
    projectContinuationState,
    projectReadinessState: provisionalProjectReadinessState,
    localProjectManifest,
  })
  const projectReadinessState = buildProjectReadinessState({
    strategy,
    scalableDeliveryPlan,
    localProjectManifest,
    nextActionPlan,
    validationPlan,
    projectContinuationState,
    runtimeApprovalState,
  })
  const continuationSyncedManifest =
    syncLocalProjectManifestWithContinuationState({
      localProjectManifest,
      projectContinuationState,
    }) || localProjectManifest
  const runtimeSyncedManifest =
    syncLocalProjectManifestWithRuntimeApprovalState({
      localProjectManifest: continuationSyncedManifest,
      runtimeApprovalState,
    }) || continuationSyncedManifest
  const enrichedLocalProjectManifest = normalizeLocalProjectManifestContract(
    syncLocalProjectManifestWithReadinessState({
      localProjectManifest: runtimeSyncedManifest,
      projectReadinessState,
    }) || runtimeSyncedManifest,
  )
  const approvalRequestPlan = buildApprovalRequestPlan({
    continuationActionPlan,
    projectContinuationState,
    projectReadinessState,
    localProjectManifest: enrichedLocalProjectManifest,
    runtimeApprovalState,
  })

  return {
    projectReadinessState,
    runtimeApprovalState,
    localProjectManifest: enrichedLocalProjectManifest,
    approvalRequestPlan,
  }
}

module.exports = {
  buildPlanningApprovalBundle,
}