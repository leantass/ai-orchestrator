const {
  buildGenericSafeFirstDeliveryMaterializationPlan,
  buildLocalMaterializationTask,
} = require('./local-deterministic-executor.cjs')

function extractLocalMaterializationPlan(value) {
  if (!value || typeof value !== 'object') {
    return null
  }

  if (value.materializationPlan && typeof value.materializationPlan === 'object') {
    return value.materializationPlan
  }

  if (value.details && typeof value.details === 'object') {
    if (
      value.details.materializationPlan &&
      typeof value.details.materializationPlan === 'object'
    ) {
      return value.details.materializationPlan
    }
  }

  return null
}

function buildDerivedLocalMaterializationPlan({
  decisionKey,
  instruction,
  executionScope,
  businessSector,
  businessSectorLabel,
  safeFirstDeliveryMaterialization,
}) {
  return buildGenericSafeFirstDeliveryMaterializationPlan({
    decisionKey,
    instruction,
    executionScope,
    businessSector,
    businessSectorLabel,
    safeFirstDeliveryMaterialization,
  })
}

function buildLocalDeterministicTaskFromPlan({
  plan,
  workspacePath,
  requestId,
  instruction,
  brainStrategy,
  businessSector,
  businessSectorLabel,
  creativeDirection,
  reusableArtifactLookup,
  reusableArtifactsFound,
  reuseDecision,
  reuseReason,
  reusedArtifactIds,
  reuseMode,
  reuseMaterialization,
  materializationPlanSource,
  expectedTargetPaths,
}) {
  return buildLocalMaterializationTask({
    plan,
    workspacePath,
    requestId,
    instruction,
    brainStrategy,
    businessSector,
    businessSectorLabel,
    creativeDirection,
    reusableArtifactLookup,
    reusableArtifactsFound,
    reuseDecision,
    reuseReason,
    reusedArtifactIds,
    reuseMode,
    reuseMaterialization,
    materializationPlanSource,
    expectedTargetPaths,
  })
}

function extractMaterializationPlanTargetPaths({
  plan,
  summarizeUniqueExecutorStrings,
}) {
  if (!plan || typeof plan !== 'object') {
    return []
  }

  const targetPaths = []

  for (const operation of Array.isArray(plan.operations) ? plan.operations : []) {
    if (typeof operation?.targetPath === 'string' && operation.targetPath.trim()) {
      targetPaths.push(operation.targetPath.trim())
    }
  }

  for (const validation of Array.isArray(plan.validations) ? plan.validations : []) {
    if (typeof validation?.targetPath === 'string' && validation.targetPath.trim()) {
      targetPaths.push(validation.targetPath.trim())
    }
  }

  return summarizeUniqueExecutorStrings(targetPaths, 64)
}

function isMaterializationPlanWithinAllowedTargetPaths({
  plan,
  allowedTargetPaths,
  summarizeUniqueExecutorStrings,
}) {
  const normalizedAllowedTargetPaths = summarizeUniqueExecutorStrings(
    allowedTargetPaths,
    32,
  ).map((entry) => entry.replace(/\\/g, '/').toLocaleLowerCase())

  if (normalizedAllowedTargetPaths.length === 0) {
    return false
  }

  const normalizedPlanTargets = extractMaterializationPlanTargetPaths({
    plan,
    summarizeUniqueExecutorStrings,
  }).map((entry) => entry.replace(/\\/g, '/').toLocaleLowerCase())

  if (normalizedPlanTargets.length === 0) {
    return false
  }

  return normalizedPlanTargets.every((targetPath) =>
    normalizedAllowedTargetPaths.some(
      (allowedPath) =>
        targetPath === allowedPath || targetPath.startsWith(`${allowedPath}/`),
    ),
  )
}

function buildMaterializeSafeFirstDeliveryLocalPlanSkipReason({
  executionScope,
  instruction,
  plan,
  expectedBasenames = ['index.html', 'styles.css', 'script.js', 'mock-data.json'],
  summarizeUniqueExecutorStrings,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    12,
  )

  if (allowedTargetPaths.length === 0) {
    return 'missing-allowed-target-paths'
  }

  const normalizedInstruction =
    typeof instruction === 'string' ? instruction.toLocaleLowerCase() : ''
  const normalizedAllowedPaths = allowedTargetPaths.map((entry) =>
    entry.toLocaleLowerCase(),
  )
  const missingBasenames = expectedBasenames.filter(
    (basename) =>
      !normalizedAllowedPaths.some(
        (entry) => entry.endsWith(`\\${basename}`) || entry.endsWith(`/${basename}`),
      ),
  )

  if (
    missingBasenames.length > 0 &&
    !missingBasenames.every((basename) => normalizedInstruction.includes(basename))
  ) {
    return `invalid-allowed-target-paths:${missingBasenames.join(',')}`
  }

  if (
    plan &&
    !isMaterializationPlanWithinAllowedTargetPaths({
      plan,
      allowedTargetPaths,
      summarizeUniqueExecutorStrings,
    })
  ) {
    return 'plan-target-outside-allowed-paths'
  }

  return 'task-build-failed'
}

function buildMaterializeFrontendProjectLocalPlanSkipReason({
  executionScope,
  instruction,
  plan,
  summarizeUniqueExecutorStrings,
}) {
  return buildMaterializeSafeFirstDeliveryLocalPlanSkipReason({
    executionScope,
    instruction,
    plan,
    expectedBasenames: [
      'package.json',
      'index.html',
      'README.md',
      'main.js',
      'styles.css',
      'mock-data.js',
      'App.js',
    ],
    summarizeUniqueExecutorStrings,
  })
}

function buildMaterializeFullstackLocalPlanSkipReason({
  executionScope,
  instruction,
  plan,
  summarizeUniqueExecutorStrings,
}) {
  return buildMaterializeSafeFirstDeliveryLocalPlanSkipReason({
    executionScope,
    instruction,
    plan,
    expectedBasenames: [
      'README.md',
      'package.json',
      'index.html',
      'main.js',
      'styles.css',
      'mock-data.js',
      'App.js',
      'server.js',
      'health.js',
      'appointments.js',
      'response.js',
      'domain.js',
      'contracts.js',
      'schema.sql',
      'seed-local.sql',
      'seed-local.js',
      'architecture.md',
      'local-runbook.md',
    ],
    summarizeUniqueExecutorStrings,
  })
}

function buildMaterializeProjectPhaseLocalPlanSkipReason({
  executionScope,
  plan,
  summarizeUniqueExecutorStrings,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    24,
  )

  if (allowedTargetPaths.length === 0) {
    return 'missing-allowed-target-paths'
  }

  if (
    plan &&
    !isMaterializationPlanWithinAllowedTargetPaths({
      plan,
      allowedTargetPaths,
      summarizeUniqueExecutorStrings,
    })
  ) {
    return 'plan-target-outside-allowed-paths'
  }

  return 'task-build-failed'
}

function buildMaterializeSafeFirstDeliveryLocalFailureResponse({
  requestId,
  instruction,
  decisionKey,
  executionScope,
  reason,
  summarizeUniqueExecutorStrings,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    12,
  )

  return {
    ok: false,
    ...(requestId ? { requestId } : {}),
    instruction,
    error:
      'No se pudo preparar la materializacion segura local porque el alcance permitido es invalido o incompleto.',
    resultPreview:
      'La materializacion segura local no pudo iniciarse por un alcance permitido invalido.',
    failureType: 'invalid_local_safe_first_delivery_scope',
    reasoningLayer: 'local-rules',
    materializationLayer: 'local-deterministic',
    details: {
      decisionKey,
      strategy: decisionKey,
      executionMode: 'executor',
      currentAction: 'build-local-materialization-plan',
      currentTargetPath: allowedTargetPaths[0] || undefined,
      createdPaths: [],
      touchedPaths: [],
      hasMaterialProgress: false,
      materialState: 'local-deterministic-plan-invalid',
      allowedTargetPaths,
      errorMessage: reason,
    },
  }
}

function buildMaterializeFrontendProjectLocalFailureResponse({
  requestId,
  instruction,
  decisionKey,
  executionScope,
  reason,
  summarizeUniqueExecutorStrings,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    12,
  )

  return {
    ok: false,
    ...(requestId ? { requestId } : {}),
    instruction,
    error:
      'No se pudo preparar la materializacion frontend local porque el alcance permitido es invalido o el plan excede los targets permitidos.',
    resultPreview:
      'La materializacion frontend local no pudo iniciarse por un alcance permitido invalido o porque el plan excede los targets permitidos.',
    failureType: 'invalid_local_frontend_project_scope',
    reasoningLayer: 'local-rules',
    materializationLayer: 'local-deterministic',
    details: {
      decisionKey,
      strategy: decisionKey,
      executionMode: 'executor',
      currentAction: 'build-local-materialization-plan',
      currentTargetPath: allowedTargetPaths[0] || undefined,
      createdPaths: [],
      touchedPaths: [],
      hasMaterialProgress: false,
      materialState: 'local-deterministic-plan-invalid',
      allowedTargetPaths,
      errorMessage: reason,
    },
  }
}

function buildMaterializeFullstackLocalFailureResponse({
  requestId,
  instruction,
  decisionKey,
  executionScope,
  reason,
  summarizeUniqueExecutorStrings,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    24,
  )

  return {
    ok: false,
    ...(requestId ? { requestId } : {}),
    instruction,
    error:
      'No se pudo preparar la materializacion fullstack local porque el alcance permitido es invalido o el plan excede los targets permitidos.',
    resultPreview:
      'La materializacion fullstack local no pudo iniciarse por un alcance permitido invalido o porque el plan excede los targets permitidos.',
    failureType: 'invalid_local_fullstack_local_scope',
    reasoningLayer: 'local-rules',
    materializationLayer: 'local-deterministic',
    details: {
      decisionKey,
      strategy: decisionKey,
      executionMode: 'executor',
      currentAction: 'build-local-materialization-plan',
      currentTargetPath: allowedTargetPaths[0] || undefined,
      createdPaths: [],
      touchedPaths: [],
      hasMaterialProgress: false,
      materialState: 'local-deterministic-plan-invalid',
      allowedTargetPaths,
      errorMessage: reason,
    },
  }
}

function buildMaterializeProjectPhaseLocalFailureResponse({
  requestId,
  instruction,
  decisionKey,
  executionScope,
  reason,
  summarizeUniqueExecutorStrings,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    24,
  )

  return {
    ok: false,
    ...(requestId ? { requestId } : {}),
    instruction,
    error:
      'No se pudo preparar la materializacion de la fase segura porque el alcance permitido es invalido o el plan excede los targets permitidos.',
    resultPreview:
      'La materializacion de la fase segura no pudo iniciarse por un alcance permitido invalido o porque el plan excede los targets permitidos.',
    failureType: 'invalid_local_project_phase_scope',
    reasoningLayer: 'local-rules',
    materializationLayer: 'local-deterministic',
    details: {
      decisionKey,
      strategy: decisionKey,
      executionMode: 'executor',
      currentAction: 'build-local-project-phase-materialization',
      currentTargetPath: allowedTargetPaths[0] || undefined,
      createdPaths: [],
      touchedPaths: [],
      hasMaterialProgress: false,
      materialState: 'local-deterministic-plan-invalid',
      allowedTargetPaths,
      errorMessage: reason,
    },
  }
}

module.exports = {
  extractLocalMaterializationPlan,
  buildDerivedLocalMaterializationPlan,
  buildLocalDeterministicTaskFromPlan,
  extractMaterializationPlanTargetPaths,
  isMaterializationPlanWithinAllowedTargetPaths,
  buildMaterializeSafeFirstDeliveryLocalPlanSkipReason,
  buildMaterializeFrontendProjectLocalPlanSkipReason,
  buildMaterializeFullstackLocalPlanSkipReason,
  buildMaterializeProjectPhaseLocalPlanSkipReason,
  buildMaterializeSafeFirstDeliveryLocalFailureResponse,
  buildMaterializeFrontendProjectLocalFailureResponse,
  buildMaterializeFullstackLocalFailureResponse,
  buildMaterializeProjectPhaseLocalFailureResponse,
}