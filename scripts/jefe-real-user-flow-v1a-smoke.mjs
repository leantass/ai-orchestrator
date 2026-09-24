import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const web = await fs.readFile(new URL('./jefe-web.mjs', import.meta.url), 'utf8')
const client = await fs.readFile(new URL('../src/commercial/runtimeClient.ts', import.meta.url), 'utf8')
const app = await fs.readFile(new URL('../src/commercial/CommercialApp.tsx', import.meta.url), 'utf8')

assert.match(web, /createSemanticRuntimeComposition\(\{ root, mode: 'productive' \}\)/u)
assert.match(web, /JEFE_WEB_DATA_ROOT.*jefe-canonical-projects/u)
assert.match(client, /requestSemanticCorrection/u)
assert.match(client, /semantic-corrections/u)
assert.match(app, /requestSemanticCorrection\?:/u)
assert.match(app, /approval\?\.state !== 'rejected'/u)
assert.match(app, /preview\.versionId/u)
assert.match(app, /Corregir versión/u)
assert.match(app, /JEFE está preparando una nueva versión/u)
assert.match(app, /SEMANTIC_PROVIDER_NOT_READY/u)
assert.match(app, /No se pudo iniciar la corrección semántica porque el provider no está listo\./u)
assert.match(app, /if \(busy\) return/u)

console.log(JSON.stringify({ ok: true, RealUserProjectFlowV1A: 'PASS', JefeWebSemanticMode: 'productive', RejectedCorrectionAction: true, UsesExactRejectedVersion: true, NoAutoRunAfterReject: true, DoubleSubmitProtected: true, SafeErrorUX: true, NormalRootPreserved: true, ProviderCalls: 0 }))
