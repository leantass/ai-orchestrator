import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createFirstVersionFromRun } = require('../electron/jefe-project-creation.cjs')
const { createProjectPersistence } = require('../electron/jefe-project-persistence.cjs')
const { createProjectLifecycle } = require('../electron/jefe-project-lifecycle.cjs')

const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-lifecycle-'))
try {
  const first = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'cycle-project', runId: 'cycle-run', versionId: 'cycle-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Ciclo', brief: 'Sitio inicial', brandSpec: { name: 'Ciclo' }, inputAssets: { files: [{ safeName: 'logo.png', kind: 'logo', sizeBytes: 2 }], urlReferences: ['https://example.test'] } })
  assert.equal(first.ok, true, JSON.stringify(first.error))
  const persistence = createProjectPersistence({ root }); await persistence.registerManifest(first.artifacts.manifestPath)
  const lifecycle = createProjectLifecycle({ root, persistence }); await lifecycle.ensureCreated(first.project)
  const concurrent = await Promise.allSettled([lifecycle.createVersion({ projectId: 'cycle-project', changeRequest: 'Cambiar el titular.' }), lifecycle.createVersion({ projectId: 'cycle-project', changeRequest: 'No debe iniciar en paralelo.' })])
  assert.equal(concurrent.filter((item) => item.status === 'fulfilled').length, 1, 'una versión concurrente es rechazada')
  const second = concurrent.find((item) => item.status === 'fulfilled').value
  assert.equal(second.ok, true); assert.notEqual(second.versionId, 'cycle-version'); assert.equal((await persistence.listVersions('cycle-project')).length, 2)
  const secondRecord = await persistence.getVersionRecord('cycle-project', second.versionId)
  assert.equal(secondRecord.project.visualDirection, 'editorial', 'hereda dirección')
  const changed = await lifecycle.createVersion({ projectId: 'cycle-project', changeRequest: 'Nueva campaña.', options: { visualDirection: 'expresiva' } })
  assert.equal(changed.ok, true, JSON.stringify(changed.error)); assert.equal((await persistence.getVersionRecord('cycle-project', changed.versionId)).project.visualDirection, 'expresiva')
  await assert.rejects(() => lifecycle.createVersion({ projectId: 'cycle-project', changeRequest: 'fallo', options: { visualDirection: 'invalida' } }), { code: 'INVALID_VISUAL_DIRECTION' })
  const afterFailure = await lifecycle.createVersion({ projectId: 'cycle-project', changeRequest: 'El lock se liberó.' }); assert.equal(afterFailure.ok, true)
  const record = await persistence.getVersionRecord('cycle-project', second.versionId); const raw = JSON.parse(await fs.promises.readFile(record.manifestPath, 'utf8')); raw.artifactPaths.push('app/new.txt'); await fs.promises.writeFile(path.join(path.dirname(record.manifestPath), 'app/new.txt'), 'nuevo', 'utf8'); await fs.promises.writeFile(path.join(path.dirname(record.manifestPath), 'README.md'), 'modificado', 'utf8'); await fs.promises.rm(path.join(path.dirname(record.manifestPath), 'docs', 'BRAND.md')); await fs.promises.writeFile(record.manifestPath, `${JSON.stringify(raw, null, 2)}\n`, 'utf8')
  const comparison = await lifecycle.compare('cycle-project', 'cycle-version', second.versionId)
  assert.equal(comparison.ok, true); assert.ok(comparison.artifacts.added.includes('app/new.txt')); assert.ok(comparison.artifacts.removed.includes('docs/BRAND.md')); assert.ok(comparison.artifacts.modified.includes('README.md'))
  await assert.rejects(() => lifecycle.compare('cycle-project', second.versionId, second.versionId), { code: 'SAME_VERSION' })
  const other = await createFirstVersionFromRun({ destinationRoot: root, allowedRoots: [root], projectId: 'other-project', runId: 'other-run', versionId: 'other-version', projectType: 'agency_site', platform: 'web', generationProfile: 'commercial_site', creativeDirection: 'editorial', projectName: 'Otro', brandSpec: { name: 'Otro' } }); await persistence.registerManifest(other.artifacts.manifestPath); await assert.rejects(() => lifecycle.compare('cycle-project', second.versionId, 'other-version'), { code: 'VERSION_NOT_FOUND' })
  const approval = await lifecycle.approval('cycle-project', afterFailure.versionId, true, 'Listo para entrega'); assert.equal(approval.ok, true); assert.equal((await lifecycle.approvalFor('cycle-project', afterFailure.versionId)).approved, true)
  await assert.rejects(() => lifecycle.prepareDelivery('cycle-project', 'cycle-version'), { code: 'APPROVAL_REQUIRED' })
  const delivery = await lifecycle.prepareDelivery('cycle-project', afterFailure.versionId); assert.equal(delivery.ok, true); await assert.rejects(() => lifecycle.prepareDelivery('cycle-project', afterFailure.versionId), { code: 'DELIVERY_COLLISION' }); assert.equal(fs.existsSync(path.join(root, 'cycle-project', 'deliveries', `delivery-${afterFailure.versionId}`, 'delivery-manifest.json')), true)
  const restored = await lifecycle.restore('cycle-project', 'cycle-version'); assert.equal(restored.ok, true); assert.notEqual(restored.versionId, 'cycle-version'); assert.equal(fs.existsSync(first.artifacts.manifestPath), true)
  const history = await lifecycle.history('cycle-project'); assert.deepEqual(history.map((event) => event.sequence), [...history].map((_, index) => index + 1)); assert.equal(new Set(history.map((event) => event.eventId)).size, history.length); assert.ok(history.some((event) => event.type === 'version_created')); assert.ok(history.some((event) => event.type === 'version_approval_changed'))
  const snapshot = await lifecycle.snapshot('cycle-project'); assert.equal(snapshot.versionCount, 5); assert.equal(snapshot.approval.approved, false, 'restaurar no hereda aprobación')
  console.log('PASS jefe-project-lifecycle-smoke')
} finally { await fs.promises.rm(root, { recursive: true, force: true }) }
