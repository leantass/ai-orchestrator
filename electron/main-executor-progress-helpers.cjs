function buildExecutorProgressHelpers({
  normalizeExecutorPathList,
  hasNonTrivialExecutorOutput,
}) {
  function hasExecutorMaterialProgress(progressSnapshot) {
    if (!progressSnapshot || typeof progressSnapshot !== 'object') {
      return false
    }

    return Boolean(
      progressSnapshot.hasMaterialProgress === true ||
        (typeof progressSnapshot.lastMaterialProgressAt === 'string' &&
          progressSnapshot.lastMaterialProgressAt.trim()) ||
        (typeof progressSnapshot.currentTargetPath === 'string' &&
          progressSnapshot.currentTargetPath.trim()) ||
        normalizeExecutorPathList(progressSnapshot.createdPaths).length > 0 ||
        normalizeExecutorPathList(progressSnapshot.touchedPaths).length > 0 ||
        hasNonTrivialExecutorOutput(progressSnapshot.stdout) ||
        hasNonTrivialExecutorOutput(progressSnapshot.stderr),
    )
  }

  function buildExecutorProgressSnapshot(requestId, progressState, extra = {}) {
    return {
      ...(requestId ? { requestId } : {}),
      stepIndex:
        typeof progressState?.currentStepIndex === 'number' &&
        progressState.currentStepIndex > 0
          ? progressState.currentStepIndex
          : undefined,
      totalSteps:
        typeof progressState?.totalSteps === 'number' && progressState.totalSteps > 0
          ? progressState.totalSteps
          : undefined,
      currentStep: progressState?.currentStepTitle || undefined,
      currentSubtask:
        progressState?.currentSubtask || progressState?.currentStepTitle || undefined,
      currentAction: progressState?.currentAction || undefined,
      currentCommand: progressState?.currentCommand || undefined,
      currentTargetPath: progressState?.currentTargetPath || undefined,
      touchedPaths: normalizeExecutorPathList(progressState?.touchedPaths),
      createdPaths: normalizeExecutorPathList(progressState?.createdPaths),
      stdout: progressState?.stdoutPreview || undefined,
      stderr: progressState?.stderrPreview || undefined,
      lastProgressAt: progressState?.lastProgressAt || new Date().toISOString(),
      lastMaterialProgressAt: progressState?.lastMaterialProgressAt || undefined,
      hasMaterialProgress: progressState?.hasMaterialProgress === true,
      materialState: progressState?.materialState || undefined,
      acceptedAt: progressState?.acceptedAt || undefined,
      ...extra,
    }
  }

  return {
    hasExecutorMaterialProgress,
    buildExecutorProgressSnapshot,
  }
}

module.exports = {
  buildExecutorProgressHelpers,
}