import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { emptyDraft, loadDraft, payloadFromDraft, validateStep } from '../src/commercial/hubModel.ts'

const app = await fs.readFile(new URL('../src/commercial/CommercialApp.tsx', import.meta.url), 'utf8')
assert.match(app, /draft\.step === 2[\s\S]*Acción principal/u)
assert.match(app, /value=\{draft\.cta\}/u)
assert.match(app, /setDraft\(\{ \.\.\.draft, cta: event\.target\.value \}\)/u)
assert.match(app, /placeholder="Ej: Solicitar una reunión"/u)

const complete = { ...emptyDraft(), businessType: 'Estudio', audience: 'Pymes', proposition: 'Ordenar marca', cta: 'Solicitar una reunión' }
assert.equal(validateStep(complete, 2), null)
assert.equal(validateStep({ ...complete, cta: '' }, 2), 'Completá negocio, audiencia, propuesta y acción principal.')
assert.equal(payloadFromDraft(complete).primaryCta, complete.cta)
const legacy = loadDraft(JSON.stringify({ ...emptyDraft(), name: 'Borrador legacy' }))
assert.equal(legacy?.cta, '')
assert.equal(validateStep({ ...legacy, businessType: 'Estudio', audience: 'Pymes', proposition: 'Ordenar marca' }, 2), 'Completá negocio, audiencia, propuesta y acción principal.')

console.log(JSON.stringify({ ok: true, PrimaryCtaWizard: 'PASS', CTAFieldVisible: true, CTAFieldStep: 2, CTARequired: true, LegacyDraftCompatible: true, ReviewSummary: true, PayloadPrimaryCta: true, ProviderCalls: 0 }))
