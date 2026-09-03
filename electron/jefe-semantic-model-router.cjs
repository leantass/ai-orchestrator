const DEFAULT_CAPABILITIES = Object.freeze({ simple: 'fast', medium: 'balanced', complex: 'complex', architectural: 'complex' })
const DETERMINISTIC_OPERATIONS = new Set(['validation', 'contrast', 'schema', 'hash', 'correction_plan'])
function configuredModels(env = process.env) {
  const complex = env.AI_ORCHESTRATOR_SEMANTIC_MODEL?.trim() || env.AI_ORCHESTRATOR_BRAIN_OPENAI_MODEL?.trim() || 'gpt-5'
  return Object.freeze({ fast: env.AI_ORCHESTRATOR_SEMANTIC_FAST_MODEL?.trim() || complex, balanced: env.AI_ORCHESTRATOR_SEMANTIC_BALANCED_MODEL?.trim() || complex, complex })
}
function createSemanticModelRouter({ env = process.env, callBudget = null, models = null } = {}) {
  const available = models || configuredModels(env)
  function route({ operation = 'semantic', complexity = 'medium', risk = 'medium', qualityNeed = 'standard', cost = 'standard', latency = 'standard', history = null, escalation = null } = {}) {
    if (DETERMINISTIC_OPERATIONS.has(operation)) return { llmRequired: false, selectedModel: null, reasoningEffort: null, executionMode: 'local', complexity, risk, reason: 'deterministic-task', escalatedFrom: null, escalationReason: null, budgetAvailable: true }
    const level = ['simple', 'medium', 'complex', 'architectural'].includes(complexity) ? complexity : 'medium'
    const capability = DEFAULT_CAPABILITIES[level]
    const highRisk = risk === 'high' || risk === 'critical' || qualityNeed === 'strict' || level === 'architectural'
    const selectedModel = available[escalation?.fromModel && escalation?.reason ? 'complex' : highRisk ? 'complex' : capability] || available.complex
    const escalated = escalation?.fromModel && escalation?.reason ? { escalatedFrom: escalation.fromModel, escalationReason: escalation.reason } : { escalatedFrom: null, escalationReason: null }
    const snapshot = callBudget?.snapshot?.() || null
    return { llmRequired: true, selectedModel, reasoningEffort: level === 'architectural' || highRisk ? 'high' : level === 'simple' ? 'low' : 'medium', executionMode: 'background', complexity: level, risk, cost, latency, reason: highRisk ? 'quality-and-risk-capacity' : `${level}-capacity`, history: history || null, ...escalated, budgetAvailable: snapshot ? snapshot.callsRemaining > 0 : true }
  }
  function canCall() { const snapshot = callBudget?.snapshot?.(); return !snapshot || snapshot.callsRemaining > 0 }
  return Object.freeze({ route, canCall, models: available })
}
module.exports = { createSemanticModelRouter, configuredModels, DETERMINISTIC_OPERATIONS }
