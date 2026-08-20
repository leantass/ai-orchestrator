import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const {
  normalizeProjectContract,
  validateProjectContract,
  serializeProjectContract,
  deserializeProjectContract,
} = require('../electron/jefe-project-contract.cjs')

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jefe-project-contract-smoke-'))
const projectRoot = path.join(root, 'projects', 'north-studio')
const deliveryPath = path.join(projectRoot, 'delivery', 'v2')
fs.mkdirSync(deliveryPath, { recursive: true })
const options = { allowedRoots: [path.join(root, 'projects')] }

function factoryProject() {
  return {
    projectId: 'factory-north-studio',
    runId: 'run-factory-north-studio',
    projectType: 'dashboard_internal',
    generationProfile: 'factory_typed',
    physicalPaths: { projectRoot },
    timestamps: { createdAt: '2026-08-20T12:00:00.000Z' },
    changeOrigin: { kind: 'factory', reference: 'intake-v1' },
  }
}

function commercialProject() {
  return {
    projectId: 'commercial-north-studio',
    runId: 'run-commercial-north-studio',
    projectType: 'agency_site',
    platform: 'web',
    generationProfile: 'commercial_site',
    visualDirection: 'editorial',
    brandSpec: { name: 'North Studio', primaryColor: '#112233', accentColor: '#CC5500', visualNotes: 'Ritmo editorial.' },
    inputAssets: { files: [{ safeName: 'logo.svg', kind: 'logo', sizeBytes: 24 }], detectedHexColors: ['#cc5500', '#112233'] },
    physicalPaths: { projectRoot, manifestPath: path.join(projectRoot, 'manifest.json'), deliveryPath },
    timestamps: { createdAt: '2026-08-20T12:00:00.000Z', updatedAt: '2026-08-20T12:01:00.000Z' },
    changeOrigin: { kind: 'commercial', reference: 'wizard-step-5' },
    versions: [
      { versionId: 'version-north-one', runId: 'run-north-one', createdAt: '2026-08-20T12:02:00.000Z', changeOrigin: { kind: 'commercial', reference: 'first-version' } },
      { versionId: 'version-north-two', runId: 'run-north-two', createdAt: '2026-08-20T12:03:00.000Z', changeOrigin: { kind: 'manual', reference: 'change-request-1' }, deliveryPath, summary: 'Nueva portada.' },
    ],
    activeVersionId: 'version-north-two',
    delivery: { status: 'delivered_local', localPath: deliveryPath, deliveredAt: '2026-08-20T12:04:00.000Z' },
  }
}

try {
  const factory = normalizeProjectContract(factoryProject(), options)
  assert.equal(factory.generationProfile, 'factory_typed')
  assert.equal(factory.versions.length, 0)
  assert.equal(factory.delivery.status, 'not_ready')
  assert.equal(factory.activeVersionId, null)

  const commercial = normalizeProjectContract(commercialProject(), options)
  assert.equal(commercial.generationProfile, 'commercial_site')
  assert.equal(commercial.visualDirection, 'editorial')
  assert.equal(commercial.versions.length, 2)
  assert.equal(commercial.delivery.status, 'delivered_local')
  assert.notEqual(commercial.projectId, commercial.runId)
  assert.notEqual(commercial.versions[0].runId, commercial.versions[0].versionId)
  assert.equal(commercial.inputAssets.totalFiles, 1)
  assert.deepEqual(commercial.inputAssets.detectedHexColors, ['#112233', '#CC5500'])

  assert.equal(validateProjectContract({ ...factoryProject(), projectId: 'Bad ID' }, options).valid, false)
  assert.equal(validateProjectContract({ ...commercialProject(), visualDirection: 'futurista' }, options).valid, false)
  assert.equal(validateProjectContract({ ...commercialProject(), physicalPaths: { projectRoot: path.join(root, 'projects', '..', '..', 'escape') } }, options).valid, false)
  assert.equal(validateProjectContract({ ...commercialProject(), physicalPaths: { projectRoot: path.join(root, 'outside') } }, options).valid, false)

  const serialized = serializeProjectContract(commercialProject(), options)
  const reopened = deserializeProjectContract(serialized, options)
  assert.deepEqual(reopened, commercial)
  assert.equal(serializeProjectContract(commercialProject(), options), serialized)
  assert.equal(normalizeProjectContract(factoryProject(), options).brandSpec.name, null)
  assert.equal(normalizeProjectContract(factoryProject(), options).inputAssets.totalFiles, 0)
  assert.equal(commercial.changeOrigin.reference, 'wizard-step-5')
  console.log('PASS jefe-project-contract-smoke')
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
