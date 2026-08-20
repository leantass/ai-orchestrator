import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { createFirstVersionFromRun, reopenFirstVersion } = require('../electron/jefe-project-creation.cjs')

const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'jefe-canonical-creation-'))
const allowedRoot = path.join(tempRoot, 'allowed')
const outsideRoot = path.join(tempRoot, 'outside')

function request(overrides = {}) {
  return {
    destinationRoot: allowedRoot,
    allowedRoots: [allowedRoot],
    projectId: 'factory-project',
    runId: 'factory-run',
    versionId: 'factory-version',
    projectType: 'dashboard_internal',
    platform: 'web',
    generationProfile: 'factory_typed',
    projectName: 'Panel de operaciones',
    brandSpec: { name: 'Panel de operaciones', primaryColor: '#1A202C', accentColor: '#D53F8C', visualNotes: 'Sobrio y claro' },
    inputAssets: { manifestId: 'factory-assets', files: [{ safeName: 'brief.txt', kind: 'brief', sizeBytes: 12 }], detectedHexColors: ['#1A202C'] },
    providedAssets: [{ safeName: 'brief.txt', content: 'globalThis.__input_asset_executed = true' }],
    ...overrides,
  }
}

function assertRejected(result, code) {
  assert.equal(result.ok, false, `se esperaba rechazo ${code}`)
  assert.equal(result.error.code, code, `${result.error.code}: ${result.error.message}`)
}

try {
  await fs.promises.mkdir(allowedRoot, { recursive: true })

  const factory = await createFirstVersionFromRun(request())
  assert.equal(factory.ok, true, JSON.stringify(factory.error))
  assert.equal(factory.project.projectId, 'factory-project')
  assert.equal(factory.project.runId, 'factory-run')
  assert.equal(factory.project.activeVersionId, 'factory-version')
  assert.equal(factory.project.generationProfile, 'factory_typed')
  assert.equal(factory.project.delivery.status, 'not_ready')
  assert.equal(fs.existsSync(factory.artifacts.manifestPath), true)
  assert.equal(fs.existsSync(path.join(factory.artifacts.projectRoot, 'app', 'index.html')), true)
  assert.equal(fs.existsSync(path.join(factory.artifacts.projectRoot, 'assets', 'input', 'brief.txt')), true)
  assert.equal(globalThis.__input_asset_executed, undefined, 'un Input Asset no debe ejecutarse')

  const reopenedFactory = await reopenFirstVersion(factory.artifacts.manifestPath, { allowedRoots: [allowedRoot] })
  assert.equal(reopenedFactory.ok, true, JSON.stringify(reopenedFactory.error))
  assert.deepEqual(reopenedFactory.project, factory.project, 'el manifest debe reabrir el contrato sin pérdida')
  assert.equal(reopenedFactory.manifest.artifactPaths.every((entry) => !path.isAbsolute(entry) && !entry.split('/').includes('..')), true)
  assert.equal(reopenedFactory.manifest.artifactPaths.every((entry) => fs.existsSync(path.join(factory.artifacts.projectRoot, entry))), true)

  const duplicate = await createFirstVersionFromRun(request())
  assertRejected(duplicate, 'VERSION_COLLISION')

  const invalidProfile = await createFirstVersionFromRun(request({ projectId: 'invalid-profile-project', runId: 'invalid-profile-run', versionId: 'invalid-profile-version', generationProfile: 'invalid' }))
  assertRejected(invalidProfile, 'INVALID_GENERATION_PROFILE')
  const incompatibleType = await createFirstVersionFromRun(request({ projectId: 'type-project', runId: 'type-run', versionId: 'type-version', projectType: 'mobile_app_mock', platform: 'web' }))
  assertRejected(incompatibleType, 'TYPE_PLATFORM_MISMATCH')
  const traversal = await createFirstVersionFromRun(request({ projectId: 'traversal-project', runId: 'traversal-run', versionId: 'traversal-version', destinationRoot: path.join(allowedRoot, '..', 'outside') }))
  assertRejected(traversal, 'PATH_OUTSIDE_ROOT')
  const outside = await createFirstVersionFromRun(request({ projectId: 'outside-project', runId: 'outside-run', versionId: 'outside-version', destinationRoot: outsideRoot }))
  assertRejected(outside, 'PATH_OUTSIDE_ROOT')
  const invalidAsset = await createFirstVersionFromRun(request({ projectId: 'asset-project', runId: 'asset-run', versionId: 'asset-version', inputAssets: { files: [{ safeName: '../evil.js', kind: 'script', sizeBytes: 1 }] } }))
  assertRejected(invalidAsset, 'INVALID_ASSET')

  const partial = await createFirstVersionFromRun(request({ projectId: 'partial-project', runId: 'partial-run', versionId: 'partial-version', testFailureInjection: { afterWrites: 2 } }))
  assertRejected(partial, 'INJECTED_MATERIALIZATION_FAILURE')
  assert.equal(fs.existsSync(path.join(allowedRoot, 'partial-project', 'partial-version')), false, 'un fallo parcial no puede presentar versión válida')
  assert.equal(fs.existsSync(path.join(allowedRoot, '.jefe-staging', 'partial-project-partial-version')), false, 'el staging parcial debe limpiarse')

  const directions = ['editorial', 'comercial', 'expresiva']
  const htmlByDirection = new Map()
  for (const direction of directions) {
    const commercial = await createFirstVersionFromRun(request({
      projectId: `commercial-${direction}`,
      runId: `commercial-run-${direction}`,
      versionId: `commercial-version-${direction}`,
      projectType: 'agency_site',
      platform: 'web',
      generationProfile: 'commercial_site',
      creativeDirection: direction,
      projectName: `Estudio ${direction}`,
      businessType: 'Estudio de diseño',
      audience: 'equipos que necesitan una identidad clara',
      proposition: 'Estrategia, identidad y sitio local',
      inputAssets: {
        manifestId: `assets-${direction}`,
        files: [{ safeName: 'logo.svg', kind: 'logo', sizeBytes: 116 }],
        detectedHexColors: ['#112233', '#D53F8C'],
        visualNotes: `Notas ${direction}`,
        urlReferences: ['https://example.org/referencia'],
      },
      providedAssets: [{ safeName: 'logo.svg', content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#112233"/></svg>' }],
    }))
    assert.equal(commercial.ok, true, JSON.stringify(commercial.error))
    assert.equal(commercial.project.generationProfile, 'commercial_site')
    assert.equal(commercial.project.visualDirection, direction)
    assert.equal(commercial.project.inputAssets.urlReferences[0], 'https://example.org/referencia')
    assert.equal(commercial.project.delivery.status, 'not_ready')
    const html = await fs.promises.readFile(path.join(commercial.artifacts.projectRoot, 'app', 'index.html'), 'utf8')
    htmlByDirection.set(direction, html)
    const manifest = JSON.parse(await fs.promises.readFile(commercial.artifacts.manifestPath, 'utf8'))
    assert.equal(manifest.artifactPaths.every((entry) => !path.isAbsolute(entry) && !entry.includes('..')), true)
    assert.equal(manifest.contract.inputAssets.urlReferences[0], 'https://example.org/referencia', 'URL sólo como referencia')
    assert.equal(fs.existsSync(path.join(commercial.artifacts.projectRoot, 'app', 'assets', 'logo.svg')), true, 'logo real materializado')
    assert.equal(fs.existsSync(path.join(commercial.artifacts.projectRoot, 'app', 'favicon.svg')), true, 'favicon local desde logo real')
    assert.match(html, /assets\/logo\.svg/u, 'HTML referencia el logo local')
  }
  assert.match(htmlByDirection.get('editorial'), /editorial-hero/u)
  assert.match(htmlByDirection.get('comercial'), /commercial-hero/u)
  assert.match(htmlByDirection.get('expresiva'), /expressive-rail/u)
  assert.notEqual(htmlByDirection.get('editorial'), htmlByDirection.get('comercial'))
  assert.notEqual(htmlByDirection.get('comercial'), htmlByDirection.get('expresiva'))
  assert.notEqual(htmlByDirection.get('editorial'), htmlByDirection.get('expresiva'))

  const firstVersion = await createFirstVersionFromRun(request({ projectId: 'multi-project', runId: 'multi-run-one', versionId: 'multi-version-one' }))
  const secondVersion = await createFirstVersionFromRun(request({ projectId: 'multi-project', runId: 'multi-run-two', versionId: 'multi-version-two' }))
  assert.equal(firstVersion.ok, true, JSON.stringify(firstVersion.error))
  assert.equal(secondVersion.ok, true, JSON.stringify(secondVersion.error))
  assert.notEqual(firstVersion.artifacts.projectRoot, secondVersion.artifacts.projectRoot)
  assert.equal(fs.existsSync(path.join(firstVersion.artifacts.projectRoot, 'app', 'index.html')), true)
  assert.equal(fs.existsSync(path.join(secondVersion.artifacts.projectRoot, 'app', 'index.html')), true)

  console.log('PASS jefe-project-creation-smoke')
} finally {
  await fs.promises.rm(tempRoot, { recursive: true, force: true })
}
