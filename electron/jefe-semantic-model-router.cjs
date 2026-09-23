const DEFAULT_CAPABILITIES = Object.freeze({ simple: 'fast', medium: 'balanced', complex: 'complex', architectural: 'complex' })
const DETERMINISTIC_OPERATIONS = new Set(['validation', 'contrast', 'schema', 'hash', 'correction_plan', 'content_quality', 'content_fidelity', 'visual_quality', 'experience_quality', 'browser_quality', 'promotion'])
const SEMANTIC_OPERATION_POLICY = Object.freeze({
  business_understanding: Object.freeze({ complexity: 'medium', risk: 'medium', qualityNeed: 'strict', costPriority: 'high', latencyPriority: 'high' }),
  content_plan: Object.freeze({ complexity: 'medium', risk: 'medium', qualityNeed: 'strict', costPriority: 'standard', latencyPriority: 'standard' }),
  experience_plan: Object.freeze({ complexity: 'medium', risk: 'medium', qualityNeed: 'strict', costPriority: 'high', latencyPriority: 'standard' }),
  correction_plan: Object.freeze({ deterministic: true }),
  validation: Object.freeze({ deterministic: true }),
  schema: Object.freeze({ deterministic: true }),
  hash: Object.freeze({ deterministic: true })
})
function configuredModels(env = process.env) { const complex = env.AI_ORCHESTRATOR_SEMANTIC_MODEL?.trim() || env.AI_ORCHESTRATOR_BRAIN_OPENAI_MODEL?.trim() || 'gpt-5'; return Object.freeze({ fast: env.AI_ORCHESTRATOR_SEMANTIC_FAST_MODEL?.trim() || complex, balanced: env.AI_ORCHESTRATOR_SEMANTIC_BALANCED_MODEL?.trim() || complex, complex }) }
function valid(value, values, fallback) { return values.includes(value) ? value : fallback }
function routeSemanticOperation(operation = 'semantic', context = {}, available = configuredModels()) {
  const policy = SEMANTIC_OPERATION_POLICY[operation] || {}
  const complexity = valid(context.complexity, ['simple', 'medium', 'complex', 'architectural'], policy.complexity || 'medium')
  const risk = valid(context.risk, ['low', 'medium', 'high', 'critical'], policy.risk || 'medium')
  const qualityNeed = valid(context.qualityNeed, ['standard', 'strict'], policy.qualityNeed || 'standard')
  const costPriority = valid(context.costPriority || context.cost, ['high', 'standard', 'low'], policy.costPriority || 'standard')
  const latencyPriority = valid(context.latencyPriority || context.latency, ['high', 'standard', 'low'], policy.latencyPriority || 'standard')
  const escalationInput = context.escalation && typeof context.escalation === 'object' && context.escalation.reason ? context.escalation : null
  const history = context.history || null
  if (policy.deterministic || DETERMINISTIC_OPERATIONS.has(operation)) return { llmRequired: false, selectedCapability: 'local', selectedModel: null, reasoningEffort: null, executionMode: 'local', complexity, risk, qualityNeed, costPriority, latencyPriority, cost: costPriority, latency: latencyPriority, reason: 'deterministic-task', escalation: false, escalatedFrom: null, escalationReason: null, history, budgetAvailable: true }
  let selectedCapability; let reasoningEffort; let reason
  if (escalationInput) { selectedCapability = 'complex'; reasoningEffort = 'high'; reason = `explicit-escalation:${escalationInput.reason}` }
  else if (complexity === 'architectural' || risk === 'critical' || (risk === 'high' && complexity !== 'simple')) { selectedCapability = 'complex'; reasoningEffort = 'high'; reason = complexity === 'architectural' ? 'architectural-task' : 'risk-requires-complex-capability' }
  else if (complexity === 'complex') { selectedCapability = 'complex'; reasoningEffort = 'medium'; reason = 'complex-task-with-proportional-reasoning' }
  else if (complexity === 'simple' || (complexity === 'medium' && risk === 'low' && (costPriority === 'high' || latencyPriority === 'high'))) { selectedCapability = 'fast'; reasoningEffort = 'low'; reason = complexity === 'simple' ? 'simple-task' : 'medium-task-prioritizes-cost-or-latency' }
  else { selectedCapability = 'balanced'; reasoningEffort = 'medium'; reason = qualityNeed === 'strict' ? 'medium-semantic-task-with-strict-downstream-gates' : 'medium-task' }
  return { llmRequired: true, selectedCapability, selectedModel: available[selectedCapability] || available.complex, reasoningEffort, executionMode: 'background', complexity, risk, qualityNeed, costPriority, latencyPriority, cost: costPriority, latency: latencyPriority, reason, escalation: Boolean(escalationInput), escalatedFrom: escalationInput?.fromCapability || escalationInput?.fromModel || null, escalationReason: escalationInput?.reason || null, history, budgetAvailable: true }
}
function createSemanticModelRouter({ env = process.env, callBudget = null, models = null } = {}) {
  const available = models || configuredModels(env)
  function route({ operation = 'semantic', complexity, risk, qualityNeed, cost, latency, costPriority, latencyPriority, history = null, escalation = null } = {}) { const selection = routeSemanticOperation(operation, { complexity, risk, qualityNeed, cost, latency, costPriority, latencyPriority, history, escalation }, available); const snapshot = callBudget?.snapshot?.() || null; return { ...selection, budgetAvailable: selection.llmRequired ? (snapshot ? snapshot.callsRemaining > 0 : true) : true } }
  function canCall() { const snapshot = callBudget?.snapshot?.(); return !snapshot || snapshot.callsRemaining > 0 }
  return Object.freeze({ route, routeSemanticOperation: (operation, context) => routeSemanticOperation(operation, context, available), canCall, models: available, operationPolicy: SEMANTIC_OPERATION_POLICY })
}
module.exports = { DEFAULT_CAPABILITIES, SEMANTIC_OPERATION_POLICY, createSemanticModelRouter, configuredModels, routeSemanticOperation, DETERMINISTIC_OPERATIONS }
