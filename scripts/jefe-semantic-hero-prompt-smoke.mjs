import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const source = await fs.readFile(new URL('../electron/jefe-semantic-runtime-composition.cjs', import.meta.url), 'utf8')
assert.match(source, /hero\.title debe ser un heading escaneable/u)
assert.match(source, /160 caracteres y 24 palabras/u)
assert.match(source, /nunca un .*p[aá]rrafo ni varias ideas encadenadas/u)
console.log('PASS jefe-semantic-hero-prompt-smoke: provider prompt constrains hero scannability')
