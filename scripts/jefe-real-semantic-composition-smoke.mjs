import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { createSemanticRuntimeComposition } from '../electron/jefe-semantic-runtime-composition.cjs'
import { ProviderRunBudget, SEMANTIC_SCHEMA, validateSemanticEnvelope } from '../electron/jefe-semantic-provider.cjs'

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-real-semantic-composition-'))
try {
  if (process.env.JEFE_SEMANTIC_LIVE_TEST !== '1') {
    const synthetic = createSemanticRuntimeComposition({ root, mode: 'synthetic' })
    assert.equal(synthetic.semanticProvider, null)
    assert.equal(synthetic.providerHealth.readyForRealSemanticWork, false)
    console.log('PASS jefe-real-semantic-composition-smoke: OFFLINE default; live requires JEFE_SEMANTIC_LIVE_TEST=1')
    process.exit(0)
  }
  const disabled = createSemanticRuntimeComposition({ root, mode: 'productive', env: { ...process.env, AI_ORCHESTRATOR_BRAIN_PROVIDER: '', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'false', OPENAI_API_KEY: '' } })
  await assert.rejects(() => disabled.decideSemantic({ operation: 'business_understanding', input: [], schema: SEMANTIC_SCHEMA, sourceRefs: ['synthetic-brief:bicycle-service'] }), (error) => error.code === 'SEMANTIC_PROVIDER_NOT_READY')

  const callBudget = new ProviderRunBudget({ runId: 'live-plan-wiring-smoke', maxCalls: 6 })
  const env = { ...process.env, AI_ORCHESTRATOR_BRAIN_PROVIDER: 'openai', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true', AI_ORCHESTRATOR_SEMANTIC_REASONING: 'low' }
  const composition = createSemanticRuntimeComposition({ root, mode: 'productive', env, callBudget })
  assert.equal(composition.providerHealth.enabled, true)
  assert.equal(composition.providerHealth.credentialAvailable, true)
  assert.equal(composition.providerHealth.readyForRealSemanticWork, true)
  const plans = await composition.runSemanticPlans({ brief: 'Empresa ficticia que ofrece espacios de coworking, oficinas por hora y salas de reunión mediante reserva previa para profesionales y pequeños equipos.' })
  for (const [name, envelope] of Object.entries(plans).filter(([key]) => key !== 'providerBudget')) {
    validateSemanticEnvelope(envelope, { input: undefined, provider: composition.semanticProvider, sourceRefs: ['synthetic-brief:composition'] })
    assert.equal(envelope.provenance.provider, 'openai-semantic')
    assert.ok(envelope.provenance.responseId)
    assert.match(envelope.decision.schemaVersion, /^(business|content|experience)-plan-v2$/u)
    console.log(`${name}=REAL_PROVIDER`)
  }
  assert.ok(plans.providerBudget.callsUsed >= 3 && plans.providerBudget.callsUsed <= 6)
  assert.equal(plans.providerBudget.exhausted, false)
  console.log(`PASS jefe-real-semantic-composition-smoke: provider=${composition.providerHealth.model}, calls=${plans.providerBudget.callsUsed}/4, structured-output, provenance, no-local-fallback, disabled-fail-closed`)
} finally {
  await fs.rm(root, { recursive: true, force: true })
}
