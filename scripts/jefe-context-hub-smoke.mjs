import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-context-hub-'))
const { SCOPES, TYPES, ACTORS, validateContextEntry } = require('../electron/jefe-context-contract.cjs')
const { createContextMemory, ContextPersistenceError, projectContextSnapshot } = require('../electron/jefe-context-persistence.cjs')
let sequence = 0; const clock = () => `2026-08-21T12:00:${String(sequence++).padStart(2, '0')}.000Z`
const memory = createContextMemory({ root, allowedRoots: [root], clock })
const entry = (entryId, overrides = {}) => ({ entryId, scope: 'project', identity: { projectId: 'project-alpha' }, type: 'requirement', summary: entryId, actor: 'system', authority: 'system_event', provenance: 'smoke', timestamp: '2026-08-21T12:00:00.000Z', ...overrides })
const rejects = async (work, code) => await assert.rejects(work, (error) => error.code === code)
try {
  await memory.append({ ...entry('orchestrator-objective', { scope: 'orchestrator', identity: {}, type: 'objective', actor: 'lean', authority: 'human_decision', metadata: { nextResponsible: 'planner' } }) })
  await memory.append(entry('project-requirement'))
  await memory.append(entry('run-evidence', { scope: 'run', identity: { projectId: 'project-alpha', runId: 'run-alpha' }, type: 'evidence', actor: 'radar', authority: 'verified_evidence' }))
  await memory.append(entry('version-validation', { scope: 'version', identity: { projectId: 'project-alpha', runId: 'run-alpha', versionId: 'version-alpha' }, type: 'validation', actor: 'qa', authority: 'technical_result' }))
  await rejects(() => memory.append(entry('bad-identity', { scope: 'run', identity: { projectId: 'project-alpha' } })), 'INVALID_IDENTITY')
  assert.throws(() => validateContextEntry(entry('../bad')), (error) => error.code === 'INVALID_ID')
  for (const [index, type] of TYPES.entries()) await memory.append(entry(`type-${index}-${type}`, { type, actor: ACTORS[index % ACTORS.length], authority: type === 'decision' ? 'human_decision' : 'system_event', state: type === 'question' || type === 'risk' || type === 'failure' ? 'open' : 'active' }))
  for (const [index, actor] of ACTORS.entries()) await memory.append(entry(`actor-${index}`, { actor, type: 'result', authority: actor === 'lean' ? 'human_decision' : 'technical_result' }))
  await memory.append(entry('human-decision', { type: 'decision', actor: 'lean', authority: 'human_decision' }))
  await rejects(() => memory.append(entry('agent-replacement', { type: 'decision', actor: 'cerebro', authority: 'agent_inference', relations: [{ kind: 'replaces', entryId: 'human-decision' }] })), 'HUMAN_DECISION_PROTECTED')
  await memory.append(entry('human-replacement', { type: 'decision', actor: 'lean', authority: 'human_decision', relations: [{ kind: 'replaces', entryId: 'human-decision' }] }))
  await memory.append(entry('conflict', { type: 'risk', actor: 'qa', authority: 'technical_result', relations: [{ kind: 'conflicts_with', entryId: 'human-replacement' }] }))
  await memory.append(entry('open-question', { type: 'question', actor: 'jefe', authority: 'system_event', state: 'open', metadata: { requiresLean: true } }))
  await memory.append(entry('answered-question', { type: 'result', actor: 'lean', authority: 'human_decision', relations: [{ kind: 'resolves', entryId: 'open-question' }] }))
  await memory.append(entry('open-failure', { type: 'failure', actor: 'codex', authority: 'technical_result', state: 'open' }))
  await memory.append(entry('correction', { type: 'correction', actor: 'codex', authority: 'technical_result', state: 'applied', relations: [{ kind: 'resolves', entryId: 'open-failure' }] }))
  const duplicate = await memory.append(entry('project-requirement')); assert.equal(duplicate.idempotent, true)
  await rejects(() => memory.append(entry('project-requirement', { summary: 'different' })), 'ENTRY_ID_COLLISION')
  const first = await memory.getSnapshot(); assert.equal(first.nextResponsible, 'planner'); assert.equal(first.questionsOpen.some((item) => item.entryId === 'open-question'), false); assert.equal(first.failuresOpen.some((item) => item.entryId === 'open-failure'), false); assert.equal(first.history.some((item) => item.entryId === 'human-decision'), true)
  const reopened = createContextMemory({ root, allowedRoots: [root], clock }); assert.equal((await reopened.getSnapshot()).history.length, first.history.length)
  await fs.promises.writeFile(reopened.paths.indexPath, '{bad', 'utf8'); await fs.promises.writeFile(reopened.paths.snapshotPath, '{bad', 'utf8'); const rebuilt = await reopened.rebuild(); assert.equal(rebuilt.history.length, first.history.length)
  await fs.promises.writeFile(path.join(reopened.paths.eventsDir, 'corrupt.json'), '{bad', 'utf8'); const corrupted = await reopened.getSnapshot(); assert.equal(corrupted.corruptions.length, 1)
  const partialRoot = path.join(root, 'partial'); const partial = createContextMemory({ root: partialRoot, allowedRoots: [root], clock, failureInjection: 'before_rename' }); await rejects(() => partial.append(entry('partial-entry')), 'INJECTED_FAILURE'); assert.equal(partial.isLocked(`project:${JSON.stringify({ projectId: 'project-alpha' })}`), false); assert.equal(fs.existsSync(path.join(partial.paths.eventsDir, 'partial-entry.json')), false)
  assert.throws(() => createContextMemory({ root: path.resolve(root, '..', 'outside'), allowedRoots: [root] }), (error) => error.code === 'ROOT_OUTSIDE_ALLOWED')
  await memory.append(entry('url-reference', { type: 'evidence', actor: 'scout', authority: 'verified_evidence', references: [{ kind: 'url', value: 'https://example.test/evidence' }] })); assert.equal((await memory.getSnapshot()).history.find((item) => item.entryId === 'url-reference').references[0].value, 'https://example.test/evidence')
  assert.throws(() => validateContextEntry(entry('sensitive', { password: 'forbidden', metadata: { apiKey: 'forbidden' } })), (error) => error.code === 'SENSITIVE_FIELD')
  assert.throws(() => validateContextEntry(entry('too-large', { detail: 'x'.repeat(4001) })), (error) => error.code === 'INVALID_TEXT')
  assert.equal(JSON.stringify(projectContextSnapshot((await memory.readEvents()).entries).history), JSON.stringify((await memory.getSnapshot()).history))
  console.log('PASS jefe-context-hub-smoke: 35 contractual, persistence, projection and safety cases')
} finally { await fs.promises.rm(root, { recursive: true, force: true }) }
