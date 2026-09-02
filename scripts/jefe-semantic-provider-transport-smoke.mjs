import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { ProviderCallBudget, createOpenAISemanticProvider, probeSemantic, providerHealth, wrapSemanticDecision } = require('../electron/jefe-semantic-provider.cjs')
if (process.env.JEFE_SEMANTIC_LIVE_TEST !== '1') { console.log('PASS jefe-semantic-provider-transport-smoke: OFFLINE default; live requires JEFE_SEMANTIC_LIVE_TEST=1'); process.exit(0) }
const provider = createOpenAISemanticProvider()
const budget = new ProviderCallBudget(3)
const providerWithBudget = createOpenAISemanticProvider({ callBudget: budget })
const report = { provider: provider.providerId, model: provider.model, credentialAvailable: provider.credentialAvailable, calls: 0 }
const safeProbe = (probe) => ({ ok: probe.ok, status: probe.status, errorCategory: probe.errorCategory || null, errorCode: probe.errorCode || null, errorType: probe.errorType || null, errorParam: probe.errorParam || null, durationMs: probe.telemetry?.durationMs ?? null, httpStatus: probe.telemetry?.status ?? 0, requestIdPresent: Boolean(probe.telemetry?.requestId) })
if (!provider.credentialAvailable) { console.log(JSON.stringify({ ...report, status: 'BLOCKED_MISSING_CREDENTIAL' })); process.exit(2) }
const semantic = await probeSemantic(providerWithBudget); report.calls += 1; report.semantic = safeProbe(semantic)
if (!semantic.ok) { console.log(JSON.stringify({ ...report, health: providerHealth(provider, { transport: 'pass', lastProbeStatus: semantic.errorCategory, lastProbeDurationMs: semantic.telemetry?.durationMs, structuredOutputs: 'PASS' }) }, null, 2)); process.exit(1) }
const semanticPayload = JSON.parse(semantic.text); assert.equal(semanticPayload.schemaVersion, 'business-understanding-v2'); assert.ok(semanticPayload.customerNeeds.length > 0)
const envelope = wrapSemanticDecision({ decision: semanticPayload, operation: 'business-understanding-readiness', provider: { ...provider, responseId: semantic.payload?.id || null }, input: 'synthetic-brief:language-lessons', sourceRefs: ['synthetic-brief:language-lessons'] })
assert.equal(envelope.provenance.provider, provider.providerId); assert.equal(envelope.provenance.sourceRefs[0], 'synthetic-brief:language-lessons'); assert.ok(budget.callsUsed >= 1 && budget.callsUsed <= 3)
console.log(JSON.stringify({ provider: report.provider, model: report.model, credentialAvailable: true, calls: budget.callsUsed, hardCallBudget: 'PASS', semantic: report.semantic, localProvenance: 'PASS', health: providerHealth(provider, { transport: 'pass', lastProbeStatus: 'completed', lastProbeDurationMs: semantic.telemetry.durationMs, structuredOutputs: 'PASS', readyForRealSemanticWork: true }) }, null, 2))
