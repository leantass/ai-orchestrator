const fs = require('fs')
const path = require('path')

class MaterializationError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = 'MaterializationError'
    this.code = code
    this.details = details
  }
}

function fail(code, message, details) {
  throw new MaterializationError(code, message, details)
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function resolveInside(root, relativePath, field) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes('..')) {
    fail('UNSAFE_RELATIVE_PATH', `${field} debe ser una ruta relativa segura.`, { field, relativePath })
  }
  const resolved = path.resolve(root, relativePath)
  if (!isInside(root, resolved)) fail('PATH_OUTSIDE_ROOT', `${field} queda fuera del root autorizado.`, { field, relativePath })
  return resolved
}

function safeFileName(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,179}$/u.test(value) && !value.includes('..')
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/gu, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]))
}

function artifact(relativePath, content, encoding = 'utf8') {
  return { relativePath, content, encoding }
}

function factoryArtifacts(project, capabilities) {
  const label = project.projectType.replace(/_/gu, ' ')
  const data = {
    project: {
      projectId: project.projectId,
      runId: project.runId,
      versionId: project.activeVersionId,
      projectType: project.projectType,
      platform: project.platform,
      generationProfile: project.generationProfile,
      capabilityMatrix: capabilities,
      deliveryLevel: 'local_mock_only',
    },
  }
  const title = escapeHtml(project.brandSpec.name || project.projectId)
  return [
    artifact('README.md', `# ${project.brandSpec.name || project.projectId}\n\nPrimera versión Factory tipada. Este artefacto es un mock local; no declara backend, pagos, autenticación, despliegue ni integración externa.\n`),
    artifact('docs/DELIVERY.md', '# Entrega\n\nEstado: `not_ready`. Materialización local de una primera versión tipada; no es una entrega comercial.\n'),
    artifact('docs/CAPABILITIES.md', `${JSON.stringify(capabilities, null, 2)}\n`),
    artifact('data/mock-data.json', `${JSON.stringify(data, null, 2)}\n`),
    artifact('app/index.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="./styles.css"></head><body><main class="factory-shell" data-profile="factory_typed"><header><p>Mock tipado</p><h1>${title}</h1></header><section id="resumen"><h2>${escapeHtml(label)}</h2><p>Primera versión local con capacidades declaradas y datos mock.</p></section><section id="capabilities"><h2>Capacidades</h2><pre id="capability-output"></pre></section></main><script src="./app.js"></script></body></html>`),
    artifact('app/styles.css', 'body{font-family:system-ui;margin:0;background:#f4f6f8;color:#16202a}.factory-shell{max-width:820px;margin:auto;padding:48px}header{border-bottom:4px solid #2b6cb0}pre{background:#fff;padding:18px;overflow:auto}\n'),
    artifact('app/app.js', `const MOCK_DATA=${JSON.stringify(data)};document.querySelector('#capability-output').textContent=JSON.stringify(MOCK_DATA.project.capabilityMatrix,null,2);\n`),
  ]
}

function commercialLayout(direction, brandName, action, logoAppPath = null) {
  const identity = logoAppPath
    ? `<span class="brand-identity"><img src="${escapeHtml(logoAppPath)}" alt="${brandName}"><strong>${brandName}</strong></span>`
    : `<strong>${brandName}</strong>`
  if (direction === 'expresiva') {
    return `<aside class="expressive-rail">${identity}<a href="#obras">Obras</a><a href="#contacto">Contacto</a></aside><main><section id="inicio" class="expressive-hero"><p>Dirección expresiva</p><h1>Una presencia que toma posición.</h1><div class="poster-grid"><b>Identidad</b><b>Ritmo</b><b>Campaña</b></div></section><section id="obras" class="expressive-gallery"><article>Exploración 01</article><article>Exploración 02</article><article>Exploración 03</article></section><section id="contacto" class="expressive-contact"><h2>${action}</h2><a href="mailto:hola@example.local">Abrir conversación</a></section></main>`
  }
  if (direction === 'comercial') {
    return `<header class="commercial-nav">${identity}<nav><a href="#beneficios">Beneficios</a><a href="#conversion">Contacto</a></nav></header><main><section id="inicio" class="commercial-hero"><div><p>Dirección comercial</p><h1>Una propuesta clara para decidir más rápido.</h1><a class="cta" href="#conversion">${action}</a></div><aside><strong>Propuesta</strong><p>Valor, prioridad y próximo paso.</p></aside></section><section id="beneficios" class="benefit-grid"><article>Mensaje directo</article><article>Oferta ordenada</article><article>Conversión local</article></section><section id="conversion" class="conversion-panel"><h2>${action}</h2><form><label>Nombre <input name="name"></label><label>Email <input name="email"></label><button type="button">Solicitar contacto</button></form></section></main><footer>Contacto local, sin envío remoto.</footer>`
  }
  return `<header class="editorial-nav">${identity}<nav><a href="#relato">Relato</a><a href="#servicios">Servicios</a><a href="#contacto">Contacto</a></nav></header><main><section id="inicio" class="editorial-hero"><p>Dirección editorial</p><h1>Una historia de marca con ritmo y criterio.</h1></section><section id="relato" class="editorial-story"><article><h2>Contexto</h2><p>La marca ordena su voz, sus piezas y su próximo capítulo.</p></article><aside>01 / Nota de dirección</aside></section><section id="servicios" class="editorial-services"><article>Estrategia</article><article>Identidad</article><article>Sitio</article></section><section id="contacto" class="editorial-contact"><h2>${action}</h2><a href="mailto:hola@example.local">Escribir</a></section></main><footer>Edición local de primera versión.</footer>`
}

function commercialArtifacts(project, profileContext = {}) {
  const brandName = escapeHtml(project.brandSpec.name || project.projectId)
  const direction = project.visualDirection
  const action = 'Solicitar una conversación'
  const structure = commercialLayout(direction, brandName, action, profileContext.logoAppPath)
  const data = {
    projectId: project.projectId,
    runId: project.runId,
    versionId: project.activeVersionId,
    direction,
    businessType: profileContext.businessType || 'negocio local',
    audience: profileContext.audience || 'audiencia declarada en el brief',
    proposition: profileContext.proposition || 'propuesta local inicial',
    urlReferences: project.inputAssets.urlReferences || [],
  }
  return [
    artifact('README.md', `# ${project.brandSpec.name || project.projectId}\n\nPrimera versión local de sitio comercial (${direction}). No analiza URLs remotas ni ejecuta archivos aportados.\n`),
    artifact('docs/DELIVERY.md', '# Entrega\n\nEstado: `not_ready`. Los archivos son locales y no constituyen una entrega ni un despliegue.\n'),
    artifact('docs/BRAND.md', `# Marca\n\n- Nombre: ${project.brandSpec.name || project.projectId}\n- Dirección: ${direction}\n- Notas: ${project.brandSpec.visualNotes || 'sin notas'}\n`),
    artifact('data/mock-data.json', `${JSON.stringify(data, null, 2)}\n`),
    artifact('app/index.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${brandName}</title>${profileContext.logoAppPath ? `<link rel="icon" href="./favicon${path.extname(profileContext.logoAppPath)}">` : ''}<link rel="stylesheet" href="./styles.css"></head><body data-profile="commercial_site" data-creative-direction="${direction}">${structure}<script src="./app.js"></script></body></html>`),
    artifact('app/styles.css', `:root{--primary:${project.brandSpec.primaryColor || '#1A202C'};--accent:${project.brandSpec.accentColor || '#D53F8C'}}*{box-sizing:border-box}body{margin:0;font-family:Georgia,serif;color:var(--primary)}header,.expressive-rail{padding:20px;display:flex;justify-content:space-between;gap:18px}.brand-identity{display:flex;align-items:center;gap:9px}.brand-identity img{max-height:32px;max-width:96px}nav{display:flex;gap:14px}main{max-width:1080px;margin:auto}.editorial-hero,.commercial-hero,.expressive-hero{min-height:45vh;padding:72px 36px}.editorial-story,.commercial-hero,.expressive-gallery{display:grid;grid-template-columns:2fr 1fr;gap:24px;padding:36px}.editorial-services,.benefit-grid,.poster-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:36px}.editorial-services article,.benefit-grid article,.expressive-gallery article,.poster-grid b{padding:28px;background:#f1f3f5}.conversion-panel,.editorial-contact,.expressive-contact{padding:48px;background:var(--primary);color:white}.cta,button{background:var(--accent);color:white;padding:12px 18px;display:inline-block}.expressive-rail{position:fixed;flex-direction:column;height:100vh;background:var(--primary);color:white}.expressive-rail+main{margin-left:180px}.expressive-hero{background:var(--accent);color:white}.expressive-gallery{grid-template-columns:repeat(3,1fr)}footer{padding:24px;text-align:center}@media(max-width:640px){.expressive-rail{position:static;height:auto}.expressive-rail+main{margin-left:0}.editorial-story,.commercial-hero,.expressive-gallery{grid-template-columns:1fr}.editorial-services,.benefit-grid,.poster-grid{grid-template-columns:1fr}}\n`),
    artifact('app/app.js', `const PROJECT=${JSON.stringify(data)};document.body.dataset.projectId=PROJECT.projectId;\n`),
  ]
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (!value || typeof value !== 'object') return value
  return Object.keys(value).sort().reduce((result, key) => { result[key] = stable(value[key]); return result }, {})
}

async function writeArtifact(root, entry) {
  const target = resolveInside(root, entry.relativePath, 'artifact.relativePath')
  await fs.promises.mkdir(path.dirname(target), { recursive: true })
  await fs.promises.writeFile(target, entry.content, entry.encoding)
}

async function materializeProject({ project, destinationRoot, capabilities, profileContext = {}, providedAssets = [], failureInjection = null }) {
  if (!project || typeof project !== 'object') fail('INVALID_PROJECT', 'Se requiere un proyecto normalizado.')
  if (typeof destinationRoot !== 'string' || !path.isAbsolute(destinationRoot)) fail('INVALID_DESTINATION_ROOT', 'destinationRoot debe ser absoluto.')
  const root = path.resolve(destinationRoot)
  const versionId = project.activeVersionId
  const projectRoot = resolveInside(root, path.join(project.projectId, versionId), 'project root')
  const manifestPath = resolveInside(projectRoot, 'manifest.json', 'manifest path')
  if (fs.existsSync(projectRoot)) fail('VERSION_COLLISION', 'La versión ya tiene un directorio materializado.', { projectId: project.projectId, versionId, projectRoot })
  const stagingRoot = resolveInside(root, path.join('.jefe-staging', `${project.projectId}-${versionId}`), 'staging root')
  if (fs.existsSync(stagingRoot)) fail('STAGING_COLLISION', 'Existe un staging pendiente para esta versión.', { stagingRoot })

  const assetMetadata = project.inputAssets.files.map((file) => ({ ...file, preservedAsReference: true }))
  const sourceByName = new Map()
  for (const supplied of providedAssets) {
    if (!supplied || !safeFileName(supplied.safeName)) fail('INVALID_INPUT_ASSET', 'El archivo de entrada tiene un nombre inválido.', { safeName: supplied && supplied.safeName })
    if (!Object.hasOwn(supplied, 'content')) fail('INVALID_INPUT_ASSET', 'El archivo de entrada debe aportar contenido explícito; no se ejecutan paths.', { safeName: supplied.safeName })
    if (sourceByName.has(supplied.safeName)) fail('DUPLICATE_INPUT_ASSET', 'No puede repetirse un Input Asset.', { safeName: supplied.safeName })
    sourceByName.set(supplied.safeName, supplied.content)
  }
  for (const suppliedName of sourceByName.keys()) {
    if (!project.inputAssets.files.some((file) => file.safeName === suppliedName)) fail('UNKNOWN_INPUT_ASSET', 'El contenido aportado no existe en el contrato.', { safeName: suppliedName })
  }
  const logo = project.inputAssets.files.find((file) => /logo/iu.test(file.kind) && sourceByName.has(file.safeName))
  const logoExtension = logo ? path.extname(logo.safeName).toLowerCase() : ''
  if (logo && !['.png', '.svg', '.jpg', '.jpeg', '.webp'].includes(logoExtension)) fail('INVALID_LOGO_ASSET', 'Un logo materializable debe usar una extensión de imagen local.', { safeName: logo.safeName })
  const effectiveProfileContext = logo
    ? { ...profileContext, logoAppPath: `./assets/logo${logoExtension}` }
    : profileContext
  const artifacts = project.generationProfile === 'commercial_site'
    ? commercialArtifacts(project, effectiveProfileContext)
    : factoryArtifacts(project, capabilities)
  artifacts.push(artifact('assets/input/input-assets.json', `${JSON.stringify({ files: assetMetadata, urlReferences: project.inputAssets.urlReferences || [] }, null, 2)}\n`))

  try {
    await fs.promises.mkdir(path.dirname(stagingRoot), { recursive: true })
    await fs.promises.mkdir(stagingRoot, { recursive: false })
    let writes = 0
    for (const entry of artifacts) {
      await writeArtifact(stagingRoot, entry)
      writes += 1
      if (failureInjection && writes === failureInjection.afterWrites) fail('INJECTED_MATERIALIZATION_FAILURE', 'Fallo parcial inyectado para smoke.', { writes })
    }
    for (const [safeName, content] of sourceByName.entries()) {
      await writeArtifact(stagingRoot, artifact(path.join('assets', 'input', safeName), content, Buffer.isBuffer(content) ? undefined : 'utf8'))
    }
    const copiedAssetPaths = [...sourceByName.keys()].map((name) => `assets/input/${name}`)
    if (logo) {
      const logoContent = sourceByName.get(logo.safeName)
      await writeArtifact(stagingRoot, artifact(`app/assets/logo${logoExtension}`, logoContent, Buffer.isBuffer(logoContent) ? undefined : 'utf8'))
      await writeArtifact(stagingRoot, artifact(`app/favicon${logoExtension}`, logoContent, Buffer.isBuffer(logoContent) ? undefined : 'utf8'))
      copiedAssetPaths.push(`app/assets/logo${logoExtension}`, `app/favicon${logoExtension}`)
    }
    const portableArtifacts = artifacts.map((entry) => entry.relativePath.replace(/\\/gu, '/')).sort()
    const manifest = stable({
      schemaVersion: 'jefe-project-manifest/v1',
      contract: project,
      profileContext: effectiveProfileContext,
      artifactPaths: portableArtifacts.concat(copiedAssetPaths).sort(),
      physicalPaths: { projectRoot: '.', manifestPath: 'manifest.json' },
      materialization: { status: 'materialized_local', generatedAt: project.timestamps.updatedAt },
    })
    await writeArtifact(stagingRoot, artifact('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`))
    await fs.promises.mkdir(path.dirname(projectRoot), { recursive: true })
    await fs.promises.rename(stagingRoot, projectRoot)
    return { projectRoot, manifestPath, artifactPaths: manifest.artifactPaths }
  } catch (error) {
    await fs.promises.rm(stagingRoot, { recursive: true, force: true }).catch(() => {})
    if (error instanceof MaterializationError) throw error
    fail('MATERIALIZATION_FAILED', error instanceof Error ? error.message : String(error))
  }
}

async function readMaterializedManifest(manifestPath, { deserializeProjectContract, allowedRoots }) {
  if (typeof manifestPath !== 'string' || !path.isAbsolute(manifestPath)) fail('INVALID_MANIFEST_PATH', 'manifestPath debe ser absoluto.')
  let parsed
  try {
    parsed = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'))
  } catch (error) {
    fail('INVALID_MANIFEST', 'No se pudo leer un manifest JSON válido.', { message: error instanceof Error ? error.message : String(error) })
  }
  if (!parsed || typeof parsed !== 'object' || !parsed.contract || !Array.isArray(parsed.artifactPaths)) fail('INVALID_MANIFEST', 'El manifest no contiene contrato ni artefactos válidos.')
  if (parsed.artifactPaths.some((entry) => typeof entry !== 'string' || path.isAbsolute(entry) || entry.split('/').includes('..'))) fail('INVALID_MANIFEST_PATHS', 'El manifest contiene rutas no portables.')
  return { manifest: parsed, project: deserializeProjectContract(JSON.stringify(parsed.contract), { allowedRoots }) }
}

module.exports = { MaterializationError, materializeProject, readMaterializedManifest }
