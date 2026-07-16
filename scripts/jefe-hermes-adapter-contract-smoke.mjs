import assert from 'node:assert/strict'
import {
  JEFE_HERMES_ADAPTER_IDENTITY,
  createJefeHermesHandoffToJefe,
  createJefeHermesResearchRequestV1,
  parseJefeHermesResearchReport,
  parseJefeHermesResearchRequest,
  scoreJefeHermesEvidenceQuality,
  serializeJefeHermesResearchReport,
  serializeJefeHermesResearchRequest,
  summarizeJefeHermesResearchReport,
  validateJefeHermesEvidenceItem,
  validateJefeHermesHandoffToJefe,
  validateJefeHermesResearchReport,
  validateJefeHermesResearchRequest,
} from '../src/factory/adapters/jefe-hermes/index.ts'

const at = '2026-07-16T12:00:00.000Z'
const request = createJefeHermesResearchRequestV1({ requestId: 'request-1', opportunityId: 'opportunity-1', source: 'radar', createdAt: at, requestedBy: 'JEFE', title: 'Research opportunity', opportunitySummary: 'Universal workflow opportunity.', targetAudience: 'Small teams', geography: ['global'], language: ['en'], category: 'productivity', researchQuestions: ['demand', 'pricing', 'monetization'], scope: { includedQuestions: ['demand', 'pricing', 'monetization'], excludedTopics: ['personal data'], maximumSources: 10, allowPersonalData: false, allowCredentialedSources: false }, allowedSources: ['manual_input', 'uploaded_research'], disallowedSources: ['personal_sensitive_data', 'leaked_data'], budgetPolicy: 'zero external spend without approval', timeboxPolicy: 'bounded', sensitiveTopicPolicy: 'human review', requiredEvidence: ['demand', 'pricing', 'monetization'] })
assert.equal(validateJefeHermesResearchRequest(request).ok, true)
const attemptedDegrade = createJefeHermesResearchRequestV1({ ...request, policy: { readOnly: false, mayModifyCode: true } })
assert.equal(attemptedDegrade.policy.readOnly, true)
for (const field of ['mayModifyCode', 'mayModifyRepo', 'mayApproveProject', 'mayDeploy']) { const unsafe = structuredClone(request); unsafe.policy[field] = true; assert.equal(validateJefeHermesResearchRequest(unsafe).ok, false) }
const noQuestions = structuredClone(request); noQuestions.researchQuestions = []; assert.equal(validateJefeHermesResearchRequest(noQuestions).ok, false)
const noSources = structuredClone(request); noSources.allowedSources = []; assert.equal(validateJefeHermesResearchRequest(noSources).ok, false)
const overlap = structuredClone(request); overlap.disallowedSources.push('manual_input'); assert.equal(validateJefeHermesResearchRequest(overlap).ok, false)

const evidence = (id, kind, sourceName, overrides = {}) => ({ evidenceId: id, kind, sourceType: 'manual_input', sourceName, title: `${kind} evidence`, summary: 'Short cited finding.', capturedAt: at, url: `https://example.test/${id}`, quote: 'Brief quote.', stance: 'supporting', confidence: 0.85, freshness: 'current', sourceQuality: 'high', relevance: 'high', riskFlags: [], notes: [], ...overrides })
const evidenceItems = [evidence('e1', 'demand', 'source-a'), evidence('e2', 'pricing', 'source-b'), evidence('e3', 'monetization', 'source-a'), evidence('e4', 'demand', 'source-c')]
assert.equal(validateJefeHermesEvidenceItem(evidenceItems[0]).ok, true)
assert.equal(validateJefeHermesEvidenceItem(evidence('bad-confidence', 'demand', 'a', { confidence: 2 })).ok, false)
assert.equal(validateJefeHermesEvidenceItem(evidence('long-quote', 'demand', 'a', { quote: 'x'.repeat(281) })).ok, false)
assert.equal(validateJefeHermesEvidenceItem(evidence('secret', 'demand', 'a', { summary: 'api_key=real-secret-value' })).ok, false)

const scoring = scoreJefeHermesEvidenceQuality(evidenceItems, request.researchQuestions, request.researchQuestions)
const report = { ...JEFE_HERMES_ADAPTER_IDENTITY, reportId: 'report-1', requestId: request.requestId, opportunityId: request.opportunityId, createdAt: at, status: 'completed', executiveSummary: 'Evidence supports further JEFE review.', demandFindings: [{ summary: 'Demand is recurring.', strength: 'high', sourceEvidenceIds: ['e1', 'e4'] }], competitorFindings: [{ name: 'Alternative', positioning: 'General solution', strengths: [], weaknesses: ['Not focused'], sourceEvidenceIds: ['e1'] }], pricingFindings: [{ model: 'subscription', priceDescription: 'Comparable subscription', confidence: 0.8, sourceEvidenceIds: ['e2'] }], reviewFindings: [], trendFindings: [], monetizationFindings: [{ model: 'subscription', viability: 'high', rationale: 'Recurring value.', sourceEvidenceIds: ['e3'] }], riskFindings: [], evidence: evidenceItems, confidence: scoring.confidence, contradictions: [], openQuestions: [], recommendedDecisionForJefe: 'convert_to_factory_brief', limitations: ['No external execution in v1.'], requiredCoverage: [...request.researchQuestions], satisfiedCoverage: [...request.researchQuestions], costEstimate: '0' }
assert.equal(validateJefeHermesResearchReport(report).ok, true)
const oneEvidenceScoring = scoreJefeHermesEvidenceQuality([evidenceItems[0]], request.researchQuestions, ['demand'])
const oneEvidenceReport = { ...structuredClone(report), evidence: [evidenceItems[0]], confidence: oneEvidenceScoring.confidence, satisfiedCoverage: ['demand'], recommendedDecisionForJefe: 'request_more_research' }
assert.equal(validateJefeHermesResearchReport(oneEvidenceReport).ok, false)
const contradicted = structuredClone(report); contradicted.contradictions = ['Conflict A', 'Conflict B']; assert.equal(validateJefeHermesResearchReport(contradicted).ok, false)
const critical = structuredClone(report); critical.riskFindings = [{ riskId: 'critical', severity: 'critical', category: 'legal', description: 'Critical legal risk.', sourceEvidenceIds: ['e1'] }]; assert.equal(validateJefeHermesResearchReport(critical).ok, false)
const lowEvidence = evidenceItems.map((item) => ({ ...item, sourceQuality: 'low' })); const lowScoring = scoreJefeHermesEvidenceQuality(lowEvidence, request.researchQuestions, request.researchQuestions); const lowReport = { ...structuredClone(report), evidence: lowEvidence, confidence: lowScoring.confidence }; assert.equal(validateJefeHermesResearchReport(lowReport).ok, false)

const handoff = createJefeHermesHandoffToJefe(report)
assert.equal(validateJefeHermesHandoffToJefe(handoff).ok, true)
const codexHandoff = structuredClone(handoff); codexHandoff.codexAllowed = true; assert.equal(validateJefeHermesHandoffToJefe(codexHandoff).ok, false)
assert.deepEqual(handoff.missingCoverage, [])
const partialScoring = scoreJefeHermesEvidenceQuality([evidenceItems[0]], request.researchQuestions, ['demand', 'pricing']); assert.deepEqual(partialScoring.missingCoverage, ['pricing', 'monetization'])

assert.equal(validateJefeHermesResearchRequest(parseJefeHermesResearchRequest(serializeJefeHermesResearchRequest(request))).ok, true)
assert.equal(validateJefeHermesResearchReport(parseJefeHermesResearchReport(serializeJefeHermesResearchReport(report))).ok, true)
const sensitiveReport = structuredClone(report); sensitiveReport.demandFindings[0].summary = 'secret=do-not-expose user@example.com ' + 'x'.repeat(500); const summary = summarizeJefeHermesResearchReport(sensitiveReport); const summaryText = JSON.stringify(summary); assert.equal(summaryText.includes('do-not-expose'), false); assert.equal(summaryText.includes('user@example.com'), false); assert.ok(summaryText.length < 3000)
assert.equal(request.externalToolOrigin, 'external_tool'); assert.equal(request.adapterName, 'JefeHermesAdapter'); assert.equal(request.runtimeIntegrated, false)

console.log(JSON.stringify({ ok: true, checks: 25, adapterName: request.adapterName, adapterKind: request.adapterKind, externalToolName: request.externalToolName, externalToolOrigin: request.externalToolOrigin, runtimeIntegrated: request.runtimeIntegrated, confidence: scoring.confidence.score, missingCoverage: handoff.missingCoverage }, null, 2))
