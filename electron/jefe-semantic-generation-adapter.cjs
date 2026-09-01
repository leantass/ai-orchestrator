const crypto = require('node:crypto')
const { validateProductPlanning } = require('./jefe-product-planning.cjs')

function hash(value) { return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex') }
function fail(message) { throw Object.assign(new Error(message), { code: 'INVALID_SEMANTIC_GENERATION_SPEC' }) }
function adaptSemanticGenerationSpec(spec) {
  if (!spec || spec.schemaVersion !== 'semantic-generation-spec-v1') fail('SemanticGenerationSpec schema is required.')
  if (!spec.planning || typeof spec.planning !== 'object') fail('SemanticGenerationSpec must contain structured planning.')
  validateProductPlanning(spec.planning)
  if (!Array.isArray(spec.sectionOrder) || spec.sectionOrder.length === 0) fail('sectionOrder is required.')
  if (spec.sectionOrder.some((id) => !['relato', 'servicios', 'confianza', 'faq', 'contacto'].includes(id))) fail('sectionOrder contains an unknown section.')
  if (!spec.heroVariant || typeof spec.heroVariant !== 'string' || spec.heroVariant.includes('<')) fail('heroVariant is invalid.')
  if (spec.treatments && (!Array.isArray(spec.treatments) || spec.treatments.some((value) => typeof value !== 'string'))) fail('treatments are invalid.')
  if (spec.assets && (!Array.isArray(spec.assets) || spec.assets.some((value) => typeof value !== 'string' || value.includes('..') || value.startsWith('/')))) fail('assets must be safe relative references.')
  return { schemaVersion: 'normalized-generation-plan-v1', planning: spec.planning, sectionOrder: [...spec.sectionOrder], heroVariant: spec.heroVariant, treatments: [...(spec.treatments || [])], creativeDirection: spec.creativeDirection || null, contentDensity: spec.contentDensity || 'balanced', ctaStrategy: spec.ctaStrategy || null, preservedQualities: [...(spec.preservedQualities || [])], prohibitedChanges: [...(spec.prohibitedChanges || [])], semanticGenerationSpecHash: hash(spec) }
}
module.exports = { adaptSemanticGenerationSpec }
