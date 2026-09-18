import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const require = createRequire(import.meta.url)

const docs = [
  'docs/factory/JEFE_MASTER_ROADMAP_V1.md',
  'docs/factory/JEFE_PRODUCT_BACKLOG_V1.md',
  'docs/factory/JEFE_PROJECT_MODES_V1.md',
  'docs/factory/JEFE_CONTEXT_AND_MODEL_DECISION_POLICY_V1.md',
  'docs/factory/JEFE_ASSETS_AND_DATABASE_GENERATION_ROADMAP_V1.md',
]

const requiredTerms = [
  'crear proyecto nuevo',
  'continuar proyecto existente',
  'terminar proyecto incompleto',
  'auditar proyecto existente',
  'assets',
  'base de datos',
  'modelos de datos',
  'mock data',
  'memoria local',
  'OpenAI API',
  'Hermes',
  'Scout',
  'Codex',
  'Vitest',
  'MSW',
  'Playwright',
  'Gitleaks',
  'Semgrep',
  'Trivy',
  'axe',
  'Lighthouse',
  'Promptfoo',
  'staging',
  'produccion',
  'analitica',
  'monetizacion',
  'memoria validada',
  'governance',
  'approvals',
  'cost control',
]

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

const combinedDocs = docs.map((relativePath) => {
  const filePath = path.join(repoRoot, relativePath)
  assert.equal(fs.existsSync(filePath), true, `${relativePath} existe`)
  return fs.readFileSync(filePath, 'utf8')
}).join('\n')

for (const term of requiredTerms) {
  assert.equal(
    normalize(combinedDocs).includes(normalize(term)),
    true,
    `roadmap docs mencionan ${term}`,
  )
}

const registry = require(path.join(repoRoot, 'electron', 'jefe-roadmap-registry.cjs'))
for (const exportName of [
  'phases',
  'projectModes',
  'intelligenceDecisionLevels',
  'currentCapabilities',
  'plannedCapabilities',
]) {
  assert.equal(Array.isArray(registry[exportName]), true, `registry exporta ${exportName}`)
  assert.equal(registry[exportName].length > 0, true, `${exportName} no vacio`)
}

console.log(JSON.stringify({
  ok: true,
  docs: docs.length,
  terms: requiredTerms.length,
  registryExports: 5,
}, null, 2))
