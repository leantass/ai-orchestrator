const { buildHumanFeedback } = require('./jefe-human-feedback.cjs')

const SEMANTIC_PROVIDER_STATES = Object.freeze([
  'REAL_AVAILABLE',
  'CONFIGURED_BUT_DISABLED',
  'CONTRACT_ONLY',
  'NOT_AVAILABLE',
])

function required(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${field} is required.`)
  return value.trim()
}

function words(value) {
  return String(value || '').toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3)
}

function unique(values) { return [...new Set(values)] }

function auditSemanticProvider({ env = process.env, adapter = null } = {}) {
  if (adapter?.providerId && typeof adapter.decide === 'function') return { providerId: adapter.providerId, status: 'REAL_AVAILABLE', used: false }
  if (env.OPENAI_API_KEY?.trim()) return { providerId: 'openai', status: env.AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED === 'true' ? 'REAL_AVAILABLE' : 'CONFIGURED_BUT_DISABLED', used: false }
  return { providerId: 'semantic-brain-contract', status: 'CONTRACT_ONLY', used: false }
}

function createSemanticBrainAdapter({ provider = null } = {}) {
  const audit = auditSemanticProvider({ adapter: provider })
  return Object.freeze({
    ...audit,
    async decide(input) {
      if (!provider || typeof provider.decide !== 'function') throw new Error('SEMANTIC_PROVIDER_REQUIRED')
      return provider.decide(input)
    },
  })
}

function createCorrectionPlan({ feedback, businessUnderstanding, correctionRound = 1, now = new Date().toISOString() } = {}) {
  if (!feedback || !feedback.rejectionReason) throw new TypeError('HumanFeedbackInput is required.')
  if (!businessUnderstanding || businessUnderstanding.schemaVersion !== 'business-understanding-v2') throw new TypeError('BusinessUnderstandingV2 is required.')
  return {
    schemaVersion: 'correction-plan-v1', correctionRound, createdAt: now, status: 'planned', source: 'human_feedback',
    projectId: feedback.snapshot.projectId, versionId: feedback.snapshot.versionId, correctionId: feedback.correctionId,
    returnTarget: feedback.returnTarget, feedback: { rejectionReason: feedback.rejectionReason, findings: feedback.findings },
    objectives: ['address_human_feedback', 'preserve_business_intent', 'improve_content_and_experience'],
    constraints: ['no_manual_artifact_mutation', 'no_copy_specific_heuristics', 'new_version_requires_quality_gates'],
    requiredOutputs: ['BusinessUnderstandingV2', 'ContentPlanV2', 'ExperiencePlanV2', 'qualityReports'],
  }
}

function buildBusinessUnderstandingV2({ brief, feedback = null } = {}) {
  if (!brief || typeof brief !== 'object') throw new TypeError('brief is required.')
  const audience = required(brief.audience || brief.targetAudience, 'audience')
  const objective = required(brief.objective || brief.goal, 'objective')
  const services = Array.isArray(brief.services) ? brief.services.map((item) => required(item, 'service')) : []
  const needs = Array.isArray(brief.customerNeeds) ? brief.customerNeeds.map((item) => required(item, 'customerNeed')) : []
  const trustDrivers = Array.isArray(brief.trustDrivers) ? brief.trustDrivers.map((item) => required(item, 'trustDriver')) : []
  return { schemaVersion: 'business-understanding-v2', audience, objective, services, customerNeeds: unique(needs), trustDrivers: unique(trustDrivers), conversionActions: unique((brief.conversionActions || []).map((item) => required(item, 'conversionAction'))), feedbackContext: feedback ? { correctionId: feedback.correctionId, returnTarget: feedback.returnTarget } : null }
}

function buildContentPlanV2(understanding) {
  if (!understanding || understanding.schemaVersion !== 'business-understanding-v2') throw new TypeError('BusinessUnderstandingV2 is required.')
  return { schemaVersion: 'content-plan-v2', sections: [{ id: 'relato', purpose: 'orient_context', source: 'objective' }, { id: 'servicios', purpose: 'explain_offer', source: 'services' }, { id: 'confianza', purpose: 'explain_method', source: 'trustDrivers' }, { id: 'faq', purpose: 'remove_decision_friction', source: 'customerNeeds' }, { id: 'contacto', purpose: 'convert', source: 'conversionActions' }] }
}

function buildExperiencePlanV2(understanding) {
  if (!understanding || understanding.schemaVersion !== 'business-understanding-v2') throw new TypeError('BusinessUnderstandingV2 is required.')
  const mode = understanding.conversionActions.length > 1 ? 'guided-consultation' : 'focused-conversion'
  return { schemaVersion: 'experience-plan-v2', archetype: mode, navigation: ['relato', 'servicios', 'confianza', 'faq', 'contacto'], responsive: true, fingerprint: `${mode}:${understanding.services.join('|')}:${understanding.customerNeeds.join('|')}` }
}

function visibleText(value) { return typeof value === 'string' ? value : JSON.stringify(value || '') }
function briefLeakageGate(text) { const source = visibleText(text); const leaked = /\b(audience|objetivo|brief|metadata|projectId|versionId|internal)\s*:/iu.test(source); return { pass: !leaked, leaked } }
function naturalnessGate(text) { const source = visibleText(text); return { pass: !/(\.\.|\.\.\.|solicita\s+solicitar|lorem ipsum)/iu.test(source), truncated: /\.\.|\.\.\./u.test(source) } }
function specificityGate(understanding) { const tokens = unique(words([understanding?.objective, ...(understanding?.services || []), ...(understanding?.customerNeeds || [])].join(' '))); return { pass: tokens.length >= 5, tokenCount: tokens.length } }
function faqQuality(faq, understanding) { const items = Array.isArray(faq) ? faq : []; const pass = items.length >= 4 && items.every((item) => item && typeof item.question === 'string' && typeof item.answer === 'string' && item.answer.length >= 30 && !/^(audience|brief|objetivo):/iu.test(item.answer)); return { pass, count: items.length, related: pass && items.some((item) => words(item.answer).some((word) => words(understanding?.customerNeeds).includes(word))) } }
function trustQuality(items, understanding) { const values = Array.isArray(items) ? items : []; const pass = values.length >= 3 && values.every((item) => item?.detail && item?.source && (understanding?.trustDrivers || []).some((driver) => words(item.detail).some((word) => words(driver).includes(word)))); return { pass, count: values.length } }
function experienceDifferentiation(plan) { return { pass: Boolean(plan?.fingerprint && plan.navigation?.length === 5), fingerprint: plan?.fingerprint || null } }

module.exports = { SEMANTIC_PROVIDER_STATES, auditSemanticProvider, createSemanticBrainAdapter, buildHumanFeedback, createCorrectionPlan, buildBusinessUnderstandingV2, buildContentPlanV2, buildExperiencePlanV2, briefLeakageGate, naturalnessGate, specificityGate, faqQuality, trustQuality, experienceDifferentiation }
