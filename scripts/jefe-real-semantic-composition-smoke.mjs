import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { createSemanticRuntimeComposition } from '../electron/jefe-semantic-runtime-composition.cjs'
import { ProviderCallBudget, SEMANTIC_SCHEMA, validateSemanticEnvelope } from '../electron/jefe-semantic-provider.cjs'

const root = await fs.mkdtemp(path.join(os.tmpdir(), 'jefe-real-semantic-composition-'))
try {
  const disabled = createSemanticRuntimeComposition({ root, mode: 'productive', env: { ...process.env, AI_ORCHESTRATOR_BRAIN_PROVIDER: '', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'false', OPENAI_API_KEY: '' } })
  await assert.rejects(() => disabled.decideSemantic({ operation: 'business_understanding', input: [], schema: SEMANTIC_SCHEMA, sourceRefs: ['synthetic-brief:bicycle-service'] }), (error) => error.code === 'SEMANTIC_PROVIDER_NOT_READY')

  const callBudget = new ProviderCallBudget(3)
  const env = { ...process.env, AI_ORCHESTRATOR_BRAIN_PROVIDER: 'openai', AI_ORCHESTRATOR_SEMANTIC_BRAIN_ENABLED: 'true', AI_ORCHESTRATOR_SEMANTIC_REASONING: 'low' }
  const composition = createSemanticRuntimeComposition({ root, mode: 'productive', env, callBudget })
  assert.equal(composition.providerHealth.enabled, true)
  assert.equal(composition.providerHealth.credentialAvailable, true)
  assert.equal(composition.providerHealth.readyForRealSemanticWork, true)
  const input = [{ role: 'user', content: [{ type: 'input_text', text: 'Brief sintético: servicio ficticio de reparación de bicicletas con reserva de turnos.' }] }]
  const envelope = await composition.decideSemantic({ operation: 'business_understanding', input, schema: SEMANTIC_SCHEMA, sourceRefs: ['synthetic-brief:bicycle-service'], outputBudgetRetryMax: 0 })
  validateSemanticEnvelope(envelope, { input, provider: composition.semanticProvider, sourceRefs: ['synthetic-brief:bicycle-service'] })
  assert.equal(envelope.provenance.provider, 'openai-semantic')
  assert.equal(envelope.provenance.generatedByJEFE ?? true, true)
  assert.equal(callBudget.callsUsed, 1)
  console.log(`PASS jefe-real-semantic-composition-smoke: provider=${composition.providerHealth.model}, calls=${callBudget.callsUsed}, structured-output, provenance, disabled-fail-closed`)
} finally {
  await fs.rm(root, { recursive: true, force: true })
}
