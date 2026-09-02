const SCHEMA_VERSIONS = Object.freeze({ BusinessUnderstanding: 'business-understanding-v2', ContentPlan: 'content-plan-v2', ExperiencePlan: 'experience-plan-v2' })
function fail(message) { throw Object.assign(new Error(message), { code: 'INVALID_SEMANTIC_PLAN_REPORT' }) }
function validateRealSemanticPlanRunReport(report) {
  if (!report || report.providerModel !== 'gpt-5' || report.executionMode !== 'background') fail('provider/model/mode mismatch')
  if (report.semanticGenerationCalls !== 3 || report.maxCalls !== 6 || report.retries !== 0 || report.providerBudgetExceeded !== false) fail('generation accounting mismatch')
  if (report.abortTimeoutObserved || report.backgroundDeadlineExceeded || report.syntheticFallbackUsedInRealMode) fail('unsafe execution state')
  for (const name of Object.keys(SCHEMA_VERSIONS)) {
    const plan = report.plans?.[name]
    if (!plan || plan.source !== 'REAL_PROVIDER' || plan.status !== 'completed' || plan.structuredOutput !== true || plan.provenanceGeneratedByJEFE !== true || plan.provenanceGeneratedByModel !== false || plan.schemaVersion !== SCHEMA_VERSIONS[name]) fail(`${name} evidence mismatch`)
  }
  return report
}
module.exports = { SCHEMA_VERSIONS, validateRealSemanticPlanRunReport }
