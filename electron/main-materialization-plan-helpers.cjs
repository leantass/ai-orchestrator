const {
  buildGenericSafeFirstDeliveryMaterializationPlan,
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

function buildMaterializeSafeFirstDeliveryLocalPlanSkipReason({
  executionScope,
  instruction,
  plan,
  expectedBasenames = ['index.html', 'styles.css', 'script.js', 'mock-data.json'],
  summarizeUniqueExecutorStrings,
  isMaterializationPlanWithinAllowedTargetPaths,
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

  if (plan && !isMaterializationPlanWithinAllowedTargetPaths(plan, allowedTargetPaths)) {
    return 'plan-target-outside-allowed-paths'
  }

  return 'task-build-failed'
}

function buildMaterializeFrontendProjectLocalPlanSkipReason({
  executionScope,
  instruction,
  plan,
  summarizeUniqueExecutorStrings,
  isMaterializationPlanWithinAllowedTargetPaths,
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
    isMaterializationPlanWithinAllowedTargetPaths,
  })
}

function buildMaterializeFullstackLocalPlanSkipReason({
  executionScope,
  instruction,
  plan,
  summarizeUniqueExecutorStrings,
  isMaterializationPlanWithinAllowedTargetPaths,
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
    isMaterializationPlanWithinAllowedTargetPaths,
  })
}

function buildMaterializeProjectPhaseLocalPlanSkipReason({
  executionScope,
  plan,
  summarizeUniqueExecutorStrings,
  isMaterializationPlanWithinAllowedTargetPaths,
}) {
  const allowedTargetPaths = summarizeUniqueExecutorStrings(
    executionScope?.allowedTargetPaths,
    24,
  )

  if (allowedTargetPaths.length === 0) {
    return 'missing-allowed-target-paths'
  }

  if (plan && !isMaterializationPlanWithinAllowedTargetPaths(plan, allowedTargetPaths)) {
    return 'plan-target-outside-allowed-paths'
  }

  return 'task-build-failed'
}

module.exports = {
  extractLocalMaterializationPlan,
  buildDerivedLocalMaterializationPlan,
  buildMaterializeSafeFirstDeliveryLocalPlanSkipReason,
  buildMaterializeFrontendProjectLocalPlanSkipReason,
  buildMaterializeFullstackLocalPlanSkipReason,
  buildMaterializeProjectPhaseLocalPlanSkipReason,
}