import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createContextMemory } = require('../electron/jefe-context-persistence.cjs')
const { AGENT_PURPOSES, canonical } = require('../electron/jefe-context-package-contract.cjs')
const { buildContextPackage } = require('../electron/jefe-context-package-builder.cjs')
const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-context-package-'))
const identity = { projectId: 'package-project', runId: 'package-run', versionId: 'package-version' }
let sequence = 0
let snapshot
function entry(entryId, type, extra = {}) { sequence += 1; return { entryId, scope: 'version', identity, type, summary: `${type} ${entryId}`, actor: 'system', authority: 'technical_result', provenance: 'physical_manifest_or_ledger', timestamp: `2026-08-21T00:00:${String(sequence).padStart(2, '0')}.000Z`, references: [], relations: [], metadata: {}, ...extra } }
function request(targetAgent, purpose = AGENT_PURPOSES[targetAgent], extra = {}) { return { targetAgent, purpose, scope: 'version', identity, snapshot, syncStatus: { status: 'synced' }, budget: { maxEntries: 20, maxCharacters: 8000 }, ...extra } }

try {
  const memory = createContextMemory({ root: path.join(root, '.jefe-context'), allowedRoots: [root] })
  await memory.append(entry('objective-main', 'objective', { summary: 'Objetivo vigente verificable' }))
  await memory.append(entry('requirement-main', 'requirement', { summary: 'Requisito verificable vigente' }))
  await memory.append(entry('constraint-main', 'constraint', { summary: 'Restriccion local sin red' }))
  await memory.append(entry('decision-human', 'decision', { summary: 'Decision humana local', actor: 'lean', authority: 'human_decision', provenance: 'local_human_approval' }))
  await memory.append(entry('evidence-main', 'evidence', { summary: 'Evidencia tecnica disponible', references: [{ kind: 'url', value: 'https://example.test/reference' }] }))
  await memory.append(entry('risk-main', 'risk', { summary: 'Riesgo abierto controlado', state: 'open' }))
  await memory.append(entry('question-main', 'question', { summary: 'Pregunta de investigacion', state: 'open' }))
  await memory.append(entry('result-main', 'result', { summary: 'Resultado fisico local' }))
  await memory.append(entry('requirement-old', 'requirement', { summary: 'Requisito reemplazado' }))
  await memory.append(entry('correction-main', 'correction', { summary: 'Correccion aplicada', state: 'applied', relations: [{ kind: 'replaces', entryId: 'requirement-old' }] }))
  snapshot = await memory.getSnapshot()

  for (const [agent, purpose] of Object.entries(AGENT_PURPOSES)) {
    const result = buildContextPackage(request(agent, purpose))
    assert.equal(result.targetAgent, agent, `1-8 paquete para ${agent}`)
    assert.equal(result.purpose, purpose, `1-8 proposito para ${agent}`)
  }
  const planner = buildContextPackage(request('planner'))
  assert.equal(planner.packageId, buildContextPackage(request('planner')).packageId, '9 packageId determinista')
  assert.equal(canonical(planner), canonical(buildContextPackage(request('planner'))), '10 serializacion estable')
  assert.throws(() => buildContextPackage(request('planner', 'research')), { code: 'INVALID_AGENT_PURPOSE' }, '11 combinacion invalida rechazada')
  assert.throws(() => buildContextPackage({ ...request('planner'), scope: 'project', identity }), { code: 'INVALID_IDENTITY' }, '12 scope e identidad incompatibles rechazados')
  assert.equal(planner.disposition, 'restricted', '13 memoria sincronizada refleja pregunta restrictiva')
  assert.equal(buildContextPackage(request('planner', 'planning', { syncStatus: { status: 'pending' } })).disposition, 'blocked', '14 pending no produce ready')
  assert.equal(buildContextPackage(request('planner', 'planning', { syncStatus: { status: 'failed' } })).disposition, 'blocked', '15 failed no produce ready')
  const conflicted = structuredClone(snapshot); conflicted.conflicts = [{ entryId: 'decision-human', conflictsWith: 'result-main' }]
  assert.equal(buildContextPackage(request('cerebro', 'supervision', { snapshot: conflicted })).disposition, 'restricted', '16 conflicto visible y restrictivo')
  const human = buildContextPackage(request('planner'))
  assert.equal(human.context.decisions[0].authority, 'human_decision', '17 autoridad humana prevalece')
  assert.equal(human.context.lineage.some((item) => item.entryId === 'correction-main') && human.context.lineage.some((item) => item.entryId === 'requirement-old'), true, '18 reemplazo conserva lineage')
  const limited = buildContextPackage(request('planner', 'planning', { budget: { maxEntries: 3, maxCharacters: 8000 } }))
  assert.equal(limited.budget.usedEntries <= 3, true, '19 maxEntries determinista')
  const tooSmall = buildContextPackage(request('planner', 'planning', { budget: { maxEntries: 20, maxCharacters: 200 } }))
  assert.equal(tooSmall.disposition, 'blocked', '20 maxCharacters bloquea honestamente')
  assert.equal(human.context.objective.length > 0 && human.context.decisions.some((item) => item.authority === 'human_decision'), true, '21 nucleo critico no se omite')
  assert.equal(limited.omissions.every((item) => item.section && item.count && item.reason && item.entryIds.length), true, '22 omisiones trazables')
  const unsafe = structuredClone(snapshot)
  unsafe.evidence.push({ ...entry('evidence-secret', 'evidence', { summary: 'token secreto C:\\private' }), references: [{ kind: 'url', value: 'file:///private' }] })
  unsafe.evidence.push({ ...entry('evidence-file', 'evidence', { summary: 'Referencia segura con origen invalido' }), references: [{ kind: 'url', value: 'file:///private' }] })
  const secure = buildContextPackage(request('radar', 'discovery', { snapshot: unsafe }))
  assert.equal(/token|secreto|C:\\|file:\/\//iu.test(canonical(secure)), false, '23 secretos paths y referencias invalidas no salen')
  const before = canonical(snapshot)
  const identityB = { projectId: 'package-other', runId: 'package-other-run', versionId: 'package-other-version' }
  const snapshotB = structuredClone(snapshot); snapshotB.history = snapshotB.history.map((item) => ({ ...item, identity: identityB })); for (const key of ['objective', 'requirements', 'constraints', 'preferences', 'decisions', 'evidence', 'assumptionsPending', 'risksOpen', 'questionsOpen', 'validations', 'results', 'failuresOpen', 'correctionsApplied']) if (Array.isArray(snapshotB[key])) snapshotB[key] = snapshotB[key].map((item) => ({ ...item, identity: identityB }))
  snapshotB.objective = { ...snapshotB.objective, identity: identityB }
  const packageB = buildContextPackage({ ...request('planner'), identity: identityB, snapshot: snapshotB })
  assert.equal(packageB.context.objective[0].identity.projectId, 'package-other', '24 aislamiento A/B')
  assert.equal(canonical(snapshot), before, '24 builder no muta snapshot ni memoria')
  console.log('PASS jefe-context-package-smoke: casos 1-24')
} finally {
  await fs.promises.rm(root, { recursive: true, force: true })
}
