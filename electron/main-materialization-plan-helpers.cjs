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

module.exports = {
  extractLocalMaterializationPlan,
  buildDerivedLocalMaterializationPlan,
}