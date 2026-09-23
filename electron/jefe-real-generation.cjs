const fs = require('fs')
const path = require('path')
const { validateProductPlanning, validateGeneratedArtifact } = require('./jefe-product-planning.cjs')
const { assertArtifactQuality, assertContentQuality } = require('./jefe-generator-quality.cjs')
const { adaptSemanticGenerationSpec, buildContentSectionCatalog, canonicalSemanticContentRef, validateSemanticContentCatalog } = require('./jefe-semantic-generation-adapter.cjs')

class MaterializationError extends Error {
  constructor(code, message, details = {}) { super(message); this.name = 'MaterializationError'; this.code = code; this.details = details }
}
function fail(code, message, details) { throw new MaterializationError(code, message, details) }
function isInside(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}
function resolveInside(root, relativePath, field) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath) || relativePath.split(/[\\/]/u).includes('..')) fail('UNSAFE_RELATIVE_PATH', `${field} debe ser una ruta relativa segura.`, { field, relativePath })
  const resolved = path.resolve(root, relativePath)
  if (!isInside(root, resolved)) fail('PATH_OUTSIDE_ROOT', `${field} queda fuera del root autorizado.`, { field, relativePath })
  return resolved
}
function safeFileName(value) { return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,179}$/u.test(value) && !value.includes('..') }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/gu, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])) }
function artifact(relativePath, content, encoding = 'utf8') { return { relativePath, content, encoding } }
function stable(value) {
  if (Array.isArray(value)) return value.map(stable)
  if (!value || typeof value !== 'object') return value
  return Object.keys(value).sort().reduce((result, key) => { result[key] = stable(value[key]); return result }, {})
}

function factoryArtifacts(project, capabilities) {
  const data = { project: { projectId: project.projectId, runId: project.runId, versionId: project.activeVersionId, projectType: project.projectType, platform: project.platform, generationProfile: project.generationProfile, capabilityMatrix: capabilities, deliveryLevel: 'local_mock_only' } }
  const title = escapeHtml(project.brandSpec.name || project.projectId)
  return [
    artifact('README.md', `# ${project.brandSpec.name || project.projectId}\n\nPrimera versión Factory tipada. Este artefacto es un mock local; no declara backend, pagos, autenticación, despliegue ni integración externa.\n`),
    artifact('docs/DELIVERY.md', '# Entrega\n\nEstado: `not_ready`. Materialización local de una primera versión tipada; no es una entrega comercial.\n'),
    artifact('docs/CAPABILITIES.md', `${JSON.stringify(capabilities, null, 2)}\n`),
    artifact('data/mock-data.json', `${JSON.stringify(data, null, 2)}\n`),
    artifact('app/index.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="./styles.css"></head><body><main class="factory-shell" data-profile="factory_typed"><header><p>Mock tipado</p><h1>${title}</h1></header><section id="resumen"><h2>${escapeHtml(project.projectType.replace(/_/gu, ' '))}</h2><p>Primera versión local con capacidades declaradas y datos mock.</p></section><section id="capabilities"><h2>Capacidades</h2><pre id="capability-output"></pre></section></main><script src="./app.js"></script></body></html>`),
    artifact('app/styles.css', 'body{font-family:system-ui;margin:0;background:#f4f6f8;color:#16202a}.factory-shell{max-width:820px;margin:auto;padding:48px}header{border-bottom:4px solid #2b6cb0}pre{background:#fff;padding:18px;overflow:auto}\n'),
    artifact('app/app.js', `const MOCK_DATA=${JSON.stringify(data)};document.querySelector('#capability-output').textContent=JSON.stringify(MOCK_DATA.project.capabilityMatrix,null,2);\n`),
  ]
}

function commercialLayoutV2(direction, brandName, action, logoAppPath = null, planning = null) {
  const content = planning?.content || {}
  const sections = planning?.experience?.sections || []
  const semanticMode = planning?.semanticRefs?.contentPlan === 'ContentPlanV2'
  const catalog = buildContentSectionCatalog(content, { validate: semanticMode })
  if (semanticMode) validateSemanticContentCatalog(catalog)
  const catalogById = new Map(catalog.map((item) => [item.id, item]))
  const descriptorFor = (section) => catalogById.get(section) || { id: section, role: section, kind: section, contentRef: section, label: section }
  const sectionType = (section) => {
    const descriptor = descriptorFor(section)
    const values = [canonicalSemanticContentRef(descriptor.contentRef), canonicalSemanticContentRef(descriptor.role), canonicalSemanticContentRef(descriptor.kind), descriptor.contentRef, descriptor.role, descriptor.kind].map((value) => String(value || '').toLowerCase())
    if (values.some((value) => value === 'hero')) return 'hero'
    if (values.some((value) => value === 'services' || value === 'service' || value.includes('service-catalog'))) return 'services'
    if (values.some((value) => value === 'trust' || value === 'proof')) return 'trust'
    if (values.some((value) => value === 'faq' || value.includes('question'))) return 'faq'
    if (values.some((value) => value === 'contact' || value === 'conversion' || value.includes('conversion-form'))) return 'contact'
    if (values.some((value) => value === 'presentation' || value === 'narrative')) return 'presentation'
    return 'other'
  }
  const anchor = (value) => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/gu, '').replace(/[^a-z0-9]+/gu, '-')
  const label = (value) => { const descriptor = descriptorFor(value); return descriptor.label || value.charAt(0).toUpperCase() + value.slice(1) }
  const contactSection = sections.find((section) => sectionType(section) === 'contact') || sections[sections.length - 1] || 'contacto'
  const identity = logoAppPath ? `<span class="brand-identity"><img src="${escapeHtml(logoAppPath)}" alt="${escapeHtml(brandName)}"><strong>${escapeHtml(brandName)}</strong></span>` : `<strong>${escapeHtml(brandName)}</strong>`
  const nav = sections.filter((item) => sectionType(item) !== 'hero').map((item) => `<a href="#${anchor(item)}">${escapeHtml(label(item))}</a>`).join('')
  const benefits = (content.services || content.benefits || []).map((item) => { const service = typeof item === 'string' ? { title: item, description: item } : item; return `<article class="benefit-card"><h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p>${service.value ? `<small>${escapeHtml(service.value)}</small>` : ''}</article>` }).join('')
  const trust = (content.trustItems || content.trust || []).map((item) => { const trustItem = typeof item === 'string' ? { title: 'Confianza', description: item } : item; return `<article class="trust-card"><h3>${escapeHtml(trustItem.title)}</h3><p>${escapeHtml(trustItem.description)}</p></article>` }).join('')
  const faq = (content.faq || []).map((item) => `<details><summary>${escapeHtml(item.question)}</summary><p>${escapeHtml(item.answer)}</p></details>`).join('')
  const form = `<form id="primary-contact"><label for="name">Nombre<input id="name" name="name" autocomplete="name"></label><label for="email">Email<input id="email" name="email" type="email" autocomplete="email"></label><button type="button">${escapeHtml(action)}</button></form>`
  const renderSectionLegacy = (section) => {
    if (section === 'inicio') return `<section id="inicio" class="site-hero hero-${direction} ${direction === 'comercial' ? 'commercial-hero' : `${direction}-hero`}"><div><p class="eyebrow">${escapeHtml(content.hero?.eyebrow || content.contextual?.businessType || 'Propuesta')}</p><h1>${escapeHtml(content.hero?.title || content.title)}</h1><p class="lede">${escapeHtml(content.hero?.description || content.subtitle)}</p><a class="cta" href="#${anchor(sections.includes('conversion') ? 'conversion' : 'contacto')}">${escapeHtml(content.hero?.primaryCTA || action)}</a></div>${content.hero?.supportingNote ? `<aside class="hero-note"><strong>${escapeHtml(content.hero.supportingNote)}</strong></aside>` : ''}</section>`
    if (section === 'confianza' || section === 'comunidad') return `<section id="${section}" class="trust-grid"><div class="section-heading"><p class="eyebrow">Confianza</p><h2>${escapeHtml(content.trustItems?.[0]?.title || 'Criterios para avanzar')}</h2></div>${trust}</section>`
    if (section === 'faq') return `<section id="faq" class="faq-panel"><div class="section-heading"><p class="eyebrow">Preguntas frecuentes</p><h2>${escapeHtml(content.businessUnderstanding?.customerQuestions?.[0] || 'Preguntas para decidir')}</h2></div>${faq}</section>`
    if (section === 'conversion' || section === 'contacto') return `<section id="${section}" class="conversion-panel"><p class="eyebrow">Próximo paso</p><h2>${escapeHtml(action)}</h2>${form}</section>`
    if (section === 'beneficios' || section === 'servicios' || section === 'funcionalidades' || section === 'mecanicas' || section === 'capacidades' || section === 'modulos') return `<section id="${section}" class="benefit-grid"><div class="section-heading"><p class="eyebrow">${escapeHtml(label(section))}</p><h2>${escapeHtml(content.businessUnderstanding?.primaryGoal || content.title || 'Propuesta y alcance')}</h2></div>${benefits}</section>`
    return `<section id="${section}" class="feature-panel"><div class="section-heading"><p class="eyebrow">${escapeHtml(label(section))}</p><h2>${escapeHtml(content.businessUnderstanding?.businessModel || content.title || 'Contexto para avanzar')}</h2></div><div class="feature-copy"><p>${escapeHtml(content.hero?.description || content.subtitle || '')}</p><p>${escapeHtml(content.businessUnderstanding?.customerNeeds?.[0] || content.benefits?.[0] || '')}</p></div></section>`
  }
  const railClass = direction === 'expresiva' ? ' expressive-rail' : ''
  const renderSection = (section) => {
    const type = sectionType(section)
    if (type === 'hero') return `<section id="${anchor(section)}" class="site-hero hero-${direction} ${direction === 'comercial' ? 'commercial-hero' : `${direction}-hero`}"><div><p class="eyebrow">${escapeHtml(content.hero?.eyebrow || content.contextual?.businessType || 'Propuesta')}</p><h1>${escapeHtml(content.hero?.title || content.title)}</h1><p class="lede">${escapeHtml(content.hero?.description || content.subtitle)}</p><a class="cta" href="#${anchor(contactSection)}">${escapeHtml(content.hero?.primaryCTA || action)}</a></div>${content.hero?.supportingNote ? `<aside class="hero-note"><strong>${escapeHtml(content.hero.supportingNote)}</strong></aside>` : ''}</section>`
    if (type === 'trust') return `<section id="${anchor(section)}" class="trust-grid"><div class="section-heading"><p class="eyebrow">Confianza</p><h2>${escapeHtml(content.trustItems?.[0]?.title || 'Criterios para avanzar')}</h2></div>${trust}</section>`
    if (type === 'faq') return `<section id="${anchor(section)}" class="faq-panel"><div class="section-heading"><p class="eyebrow">Preguntas frecuentes</p><h2>${escapeHtml(content.businessUnderstanding?.customerQuestions?.[0] || 'Preguntas para decidir')}</h2></div>${faq}</section>`
    if (type === 'contact') return `<section id="${anchor(section)}" class="conversion-panel"><p class="eyebrow">Proximo paso</p><h2>${escapeHtml(action)}</h2>${form}</section>`
    if (type === 'presentation') return `<section id="${anchor(section)}" class="feature-panel"><div class="section-heading"><p class="eyebrow">${escapeHtml(label(section))}</p><h2>${escapeHtml(label(section) || 'Presentación')}</h2></div><div class="feature-copy"><p>${escapeHtml(content.presentation || content.subtitle || '')}</p></div></section>`
    if (type === 'services') return `<section id="${anchor(section)}" class="benefit-grid"><div class="section-heading"><p class="eyebrow">${escapeHtml(label(section))}</p><h2>${escapeHtml(content.businessUnderstanding?.primaryGoal || content.title || 'Propuesta y alcance')}</h2></div>${benefits}</section>`
    if (semanticMode) fail('UNSUPPORTED_SEMANTIC_SECTION_CONTENT', 'La sección semántica no tiene un renderer de contenido soportado.', { sectionId: section, role: descriptorFor(section).role, kind: descriptorFor(section).kind, contentRef: descriptorFor(section).contentRef })
    return renderSectionLegacy(section)
  }
  return `<header class="site-nav${railClass}">${identity}<nav>${nav}</nav><button class="theme-toggle" type="button" aria-pressed="false">Cambiar tema</button></header><main class="site-main">${sections.map(renderSection).join('')}</main><footer>Una experiencia local pensada para avanzar con claridad.</footer>`
}

function premiumStyles(project, planning) {
  const palette = planning?.visual?.palette || {}
  return `:root{--primary:${palette.primary || '#1E1B18'};--accent:${palette.accent || '#E87524'};--surface:${palette.surface || '#F7F1E8'};--text:${palette.text || '#1E1B18'};--dark-surface:${palette.darkSurface || '#1E1B18'};color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--surface);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.6}a{color:inherit;text-decoration:none}a:hover{color:var(--accent)}button,input,textarea{font:inherit}button{appearance:none;border:0;cursor:pointer}input{display:block;width:100%;border:1px solid color-mix(in srgb,var(--text) 28%,transparent);border-radius:14px;background:transparent;color:inherit;padding:13px 16px}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid var(--accent);outline-offset:4px}.site-nav{align-items:center;border-bottom:1px solid color-mix(in srgb,var(--text) 18%,transparent);display:flex;gap:28px;justify-content:space-between;padding:22px clamp(20px,5vw,72px);position:sticky;top:0;background:color-mix(in srgb,var(--surface) 94%,transparent);z-index:2}.brand-identity{align-items:center;display:flex;gap:10px}.brand-identity img{max-height:32px;max-width:96px}.site-nav nav{display:flex;gap:20px;flex-wrap:wrap}.theme-toggle{background:transparent;border:1px solid currentColor;border-radius:999px;padding:9px 14px}.site-main{margin:auto;max-width:1200px}.site-hero{display:grid;gap:48px;grid-template-columns:minmax(0,1.4fr) minmax(220px,.6fr);min-height:68vh;padding:clamp(72px,12vw,160px) clamp(20px,7vw,96px);align-items:end}.hero-editorial{letter-spacing:-.02em}.hero-comercial{background:linear-gradient(135deg,color-mix(in srgb,var(--surface) 88%,var(--accent)),var(--surface))}.hero-expresiva{background:var(--accent);color:#fff;min-height:76vh}.eyebrow{color:var(--accent);font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.hero-expresiva .eyebrow{color:inherit}.site-hero h1{font-family:Georgia,serif;font-size:clamp(2.8rem,7vw,6.5rem);font-weight:400;letter-spacing:-.06em;line-height:.98;margin:18px 0 24px;max-width:900px}.lede{font-size:clamp(1.1rem,2vw,1.35rem);max-width:600px}.hero-note{border-left:2px solid var(--accent);padding:20px}.hero-expresiva .hero-note{border-color:#fff}.cta{background:var(--accent);border-radius:999px;color:#fff;display:inline-block;font-weight:700;margin-top:18px;padding:14px 22px}.benefit-grid,.trust-grid{display:grid;gap:16px;grid-template-columns:repeat(3,minmax(0,1fr));padding:80px clamp(20px,7vw,96px)}.section-heading{grid-column:1/-1;max-width:600px}.section-heading h2{font-family:Georgia,serif;font-size:clamp(2rem,4vw,3.6rem);font-weight:400;line-height:1.05;margin-top:8px}.benefit-card,.trust-card{border:1px solid color-mix(in srgb,var(--text) 18%,transparent);border-radius:24px;min-height:170px;padding:26px;display:flex;align-items:end}.trust-grid{background:var(--dark-surface);color:var(--surface)}.faq-panel,.feature-panel{padding:80px clamp(20px,7vw,96px)}.feature-panel{border-top:1px solid color-mix(in srgb,var(--text) 18%,transparent)}.feature-copy{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr));font-size:1.2rem}.faq-panel details{border-top:1px solid color-mix(in srgb,var(--text) 24%,transparent);padding:20px 0}.faq-panel summary{cursor:pointer;font-family:Georgia,serif;font-size:1.25rem}.faq-panel details p{max-width:700px}.conversion-panel{background:var(--dark-surface);color:var(--surface);padding:80px clamp(20px,7vw,96px)}form{display:grid;gap:18px;max-width:560px}label{display:grid;gap:8px;font-size:.9rem}form button{background:var(--accent);border-radius:999px;color:#fff;padding:14px 20px}.form-feedback{min-height:1.6em}.form-feedback.error{color:#ffb4a8}.form-feedback.success{color:#b9f6c8}footer{padding:30px;text-align:center}.expressive-rail{align-items:flex-start;flex-direction:column;position:sticky;top:0}.expressive-rail nav{flex-direction:column}@media(max-width:700px){.site-nav{align-items:flex-start;flex-wrap:wrap}.site-nav nav{order:3;width:100%}.site-hero{grid-template-columns:1fr;min-height:auto}.benefit-grid,.trust-grid{grid-template-columns:1fr;padding-top:56px;padding-bottom:56px}.feature-copy{grid-template-columns:1fr}.expressive-rail{position:sticky}}[data-theme="dark"]{--surface:#1E1B18;--text:#F7F1E8;--dark-surface:#0F0E0C}[data-theme="dark"] .site-nav{background:color-mix(in srgb,var(--surface) 94%,transparent)}`
}

function semanticStyles(planning) {
  const tokens = planning?.visual?.tokens || {}
  const light = tokens.light || {}
  const dark = tokens.dark || {}
  const css = (item) => Object.entries(item).map(([key, value]) => `--${key}:${value}`).join(';')
  return `:root{${css(light)};color-scheme:light}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:96px}body{margin:0;background:var(--pageBackground);color:var(--textPrimary);font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.6}a{color:inherit;text-decoration:none}a:hover{color:var(--accent)}button,input,textarea{font:inherit}button{appearance:none;border:0;cursor:pointer}input{display:block;width:100%;border:1px solid var(--inputBorder);border-radius:14px;background:var(--inputBackground);color:var(--inputText);padding:13px 16px}input::placeholder{color:var(--inputPlaceholder);opacity:.75}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid var(--focusRing);outline-offset:4px}section[id]{scroll-margin-top:96px}.site-nav{align-items:center;border-bottom:1px solid var(--border);display:flex;gap:24px;justify-content:space-between;padding:16px clamp(20px,5vw,72px);position:sticky;top:0;background:var(--pageBackground);z-index:10}.site-nav nav{display:flex;gap:20px;flex-wrap:wrap}.theme-toggle{background:var(--buttonBackground);border:1px solid var(--buttonBorder);border-radius:999px;color:var(--buttonText);padding:9px 14px}.site-main{margin:auto;max-width:1200px}.site-hero{display:grid;gap:clamp(28px,5vw,72px);grid-template-columns:minmax(0,1.35fr) minmax(240px,.65fr);min-height:clamp(420px,62vh,680px);padding:clamp(56px,8vw,112px) clamp(20px,7vw,96px);align-items:center}.site-hero h1{font-family:Georgia,serif;font-size:clamp(2.8rem,6.4vw,6rem);font-weight:400;letter-spacing:-.06em;line-height:.98;margin:18px 0 24px;max-width:820px}.eyebrow{color:var(--accent);font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.lede{font-size:clamp(1.05rem,1.7vw,1.25rem);max-width:600px}.hero-note{border-left:2px solid var(--accent);padding:20px}.cta,form button{background:var(--buttonBackground);border-radius:999px;color:var(--buttonText);font-weight:800;padding:14px 22px}.cta{display:inline-block;margin-top:18px}.benefit-grid,.trust-grid{display:grid;gap:16px;grid-template-columns:repeat(4,minmax(0,1fr));padding:72px clamp(20px,7vw,96px)}.section-heading{grid-column:1/-1;max-width:600px}.section-heading h2{font-family:Georgia,serif;font-size:clamp(2rem,4vw,3.6rem);font-weight:400;line-height:1.05;margin:8px 0 0}.benefit-card,.trust-card{border:1px solid var(--border);border-radius:20px;min-height:150px;padding:22px}.faq-panel,.feature-panel{padding:72px clamp(20px,7vw,96px)}.feature-panel{border-top:1px solid var(--border)}.feature-copy{display:grid;gap:16px;grid-template-columns:repeat(2,minmax(0,1fr));font-size:1.15rem}.faq-panel details{border-top:1px solid var(--border);padding:18px 0}.faq-panel summary{cursor:pointer;font-family:Georgia,serif;font-size:1.2rem}.faq-panel details p{max-width:700px}.conversion-panel{background:var(--surfaceInverse);color:var(--textOnInverse);padding:72px clamp(20px,7vw,96px)}form{display:grid;gap:18px;max-width:560px}label{display:grid;gap:8px;font-size:.9rem}footer{padding:30px;text-align:center}@media(max-width:700px){.site-nav{align-items:flex-start;flex-wrap:wrap}.site-nav nav{order:3;width:100%}.site-hero{grid-template-columns:1fr;min-height:auto;padding-top:64px;padding-bottom:64px}.benefit-grid,.trust-grid{grid-template-columns:1fr;padding-top:56px;padding-bottom:56px}.feature-copy{grid-template-columns:1fr}}[data-theme="dark"]{${css(dark)};color-scheme:dark}`
}
function premiumStylesGeneral(project, planning) {
  const palette = planning?.visual?.palette || {}
  return semanticStyles(planning)
}
function premiumScript() {
  return `const form=document.querySelector('#primary-contact');const feedback=document.createElement('p');feedback.className='form-feedback';feedback.setAttribute('aria-live','polite');const theme=document.querySelector('.theme-toggle');if(theme){theme.addEventListener('click',()=>{const dark=document.documentElement.dataset.theme==='dark';document.documentElement.dataset.theme=dark?'':'dark';theme.setAttribute('aria-pressed',String(!dark))})}if(form){form.append(feedback);form.addEventListener('click',(event)=>{if(event.target?.tagName!=='BUTTON')return;const name=form.elements.name?.value.trim();const email=form.elements.email?.value.trim();feedback.className='form-feedback';if(!name||!email){feedback.classList.add('error');feedback.textContent='Completá tu nombre y email para continuar.';return}feedback.classList.add('success');feedback.textContent='Gracias, '+name+'. Tu consulta quedó preparada localmente para revisión.';form.reset()})}`
}

function commercialArtifacts(project, profileContext = {}) {
  const brandName = project.brandSpec.name || project.projectId
  const direction = project.visualDirection
  const planning = profileContext.normalizedGenerationPlan?.planning || project.planning || null
  const action = planning?.content?.ctas?.[0] || 'Solicitar una conversación'
  const structure = commercialLayoutV2(direction, brandName, action, profileContext.logoAppPath, planning)
  const data = { projectId: project.projectId, runId: project.runId, versionId: project.activeVersionId, direction, businessType: profileContext.businessType || planning?.content?.contextual?.businessType || 'producto', audience: profileContext.audience || planning?.brief?.audience || '', proposition: profileContext.proposition || planning?.strategy?.primaryMessage || '', brief: profileContext.brief || planning?.brief?.objective || '', planning, manualBrandColors: project.inputAssets.manualBrandColors || planning?.brief?.visualPreferences?.manualBrandColors || '', urlReferences: project.inputAssets.urlReferences || [] }
  return [
    artifact('README.md', `# ${brandName}\n\nPrimera versión local de sitio comercial (${direction}). No analiza URLs remotas ni ejecuta archivos aportados.\n`),
    artifact('docs/DELIVERY.md', '# Entrega\n\nEstado: `not_ready`. Los archivos son locales y no constituyen una entrega ni un despliegue.\n'),
    artifact('docs/BRAND.md', `# Marca\n\n- Nombre: ${brandName}\n- Dirección: ${direction}\n- Notas: ${project.brandSpec.visualNotes || 'sin notas'}\n`),
    artifact('data/mock-data.json', `${JSON.stringify(data, null, 2)}\n`),
    artifact('data/planning.json', `${JSON.stringify(planning, null, 2)}\n`),
    artifact('app/index.html', `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(brandName)}</title>${profileContext.logoAppPath ? `<link rel="icon" href="./favicon${path.extname(profileContext.logoAppPath)}">` : ''}<link rel="stylesheet" href="./styles.css"></head><body data-profile="commercial_site" data-creative-direction="${escapeHtml(direction)}">${structure}<script src="./app.js"></script></body></html>`),
    artifact('app/styles.css', premiumStylesGeneral(project, planning)),
    artifact('app/app.js', premiumScript()),
  ]
}

async function writeArtifact(root, entry) {
  const target = resolveInside(root, entry.relativePath, 'artifact.relativePath')
  await fs.promises.mkdir(path.dirname(target), { recursive: true })
  await fs.promises.writeFile(target, entry.content, entry.encoding)
}
async function materializeProject({ project, destinationRoot, capabilities, profileContext = {}, providedAssets = [], failureInjection = null }) {
  if (!project || typeof project !== 'object') fail('INVALID_PROJECT', 'Se requiere un proyecto normalizado.')
  if (typeof destinationRoot !== 'string' || !path.isAbsolute(destinationRoot)) fail('INVALID_DESTINATION_ROOT', 'destinationRoot debe ser absoluto.')
  const root = path.resolve(destinationRoot); const versionId = project.activeVersionId
  const normalizedProfileContext = profileContext.generationMode === 'semantic_correction' ? { ...profileContext, normalizedGenerationPlan: adaptSemanticGenerationSpec(profileContext.semanticGenerationSpec) } : profileContext
  const effectivePlanning = normalizedProfileContext.normalizedGenerationPlan?.planning || project.planning
  const materializedProject = effectivePlanning === project.planning ? project : { ...project, planning: effectivePlanning }
  const projectRoot = resolveInside(root, path.join(project.projectId, versionId), 'project root'); const manifestPath = resolveInside(projectRoot, 'manifest.json', 'manifest path')
  if (fs.existsSync(projectRoot)) fail('VERSION_COLLISION', 'La versión ya tiene un directorio materializado.', { projectId: project.projectId, versionId, projectRoot })
  const stagingRoot = resolveInside(root, path.join('.jefe-staging', `${project.projectId}-${versionId}`), 'staging root')
  if (fs.existsSync(stagingRoot)) fail('STAGING_COLLISION', 'Existe un staging pendiente para esta versión.', { stagingRoot })
  const assetMetadata = project.inputAssets.files.map((file) => ({ ...file, preservedAsReference: true })); const sourceByName = new Map()
  for (const supplied of providedAssets) {
    if (!supplied || !safeFileName(supplied.safeName)) fail('INVALID_INPUT_ASSET', 'El archivo de entrada tiene un nombre inválido.', { safeName: supplied && supplied.safeName })
    if (!Object.hasOwn(supplied, 'content')) fail('INVALID_INPUT_ASSET', 'El archivo de entrada debe aportar contenido explícito; no se ejecutan paths.', { safeName: supplied.safeName })
    if (sourceByName.has(supplied.safeName)) fail('DUPLICATE_INPUT_ASSET', 'No puede repetirse un Input Asset.', { safeName: supplied.safeName })
    sourceByName.set(supplied.safeName, supplied.content)
  }
  for (const suppliedName of sourceByName.keys()) if (!project.inputAssets.files.some((file) => file.safeName === suppliedName)) fail('UNKNOWN_INPUT_ASSET', 'El contenido aportado no existe en el contrato.', { safeName: suppliedName })
  const logo = project.inputAssets.files.find((file) => /logo/iu.test(file.kind) && sourceByName.has(file.safeName)); const logoExtension = logo ? path.extname(logo.safeName).toLowerCase() : ''
  if (logo && !['.png', '.svg', '.jpg', '.jpeg', '.webp'].includes(logoExtension)) fail('INVALID_LOGO_ASSET', 'Un logo materializable debe usar una extensión de imagen local.', { safeName: logo.safeName })
  const effectiveProfileContext = logo ? { ...normalizedProfileContext, logoAppPath: `./assets/logo${logoExtension}` } : normalizedProfileContext
  const artifacts = project.generationProfile === 'commercial_site' ? commercialArtifacts(project, effectiveProfileContext) : factoryArtifacts(project, capabilities)
  let qualityReport = null
  let contentQualityReport = null
  if (project.generationProfile === 'commercial_site') {
    validateProductPlanning(effectivePlanning)
    contentQualityReport = assertContentQuality(effectivePlanning)
    const stylesheet = artifacts.find((entry) => entry.relativePath === 'app/styles.css'); const script = artifacts.find((entry) => entry.relativePath === 'app/app.js'); const html = artifacts.find((entry) => entry.relativePath === 'app/index.html')
    validateGeneratedArtifact(effectivePlanning, { html: html?.content, css: stylesheet?.content, js: script?.content })
    qualityReport = assertArtifactQuality({ html: html?.content, css: stylesheet?.content, js: script?.content })
  }
  artifacts.push(artifact('assets/input/input-assets.json', `${JSON.stringify({ files: assetMetadata, urlReferences: project.inputAssets.urlReferences || [] }, null, 2)}\n`))
  try {
    await fs.promises.mkdir(path.dirname(stagingRoot), { recursive: true }); await fs.promises.mkdir(stagingRoot, { recursive: false }); let writes = 0
    for (const entry of artifacts) { await writeArtifact(stagingRoot, entry); writes += 1; if (failureInjection && writes === failureInjection.afterWrites) fail('INJECTED_MATERIALIZATION_FAILURE', 'Fallo parcial inyectado para smoke.', { writes }) }
    for (const [safeName, content] of sourceByName.entries()) await writeArtifact(stagingRoot, artifact(path.join('assets', 'input', safeName), content, Buffer.isBuffer(content) ? undefined : 'utf8'))
    const copiedAssetPaths = [...sourceByName.keys()].map((name) => `assets/input/${name}`)
    if (logo) { const logoContent = sourceByName.get(logo.safeName); await writeArtifact(stagingRoot, artifact(`app/assets/logo${logoExtension}`, logoContent, Buffer.isBuffer(logoContent) ? undefined : 'utf8')); await writeArtifact(stagingRoot, artifact(`app/favicon${logoExtension}`, logoContent, Buffer.isBuffer(logoContent) ? undefined : 'utf8')); copiedAssetPaths.push(`app/assets/logo${logoExtension}`, `app/favicon${logoExtension}`) }
    const portableArtifacts = artifacts.map((entry) => entry.relativePath.replace(/\\/gu, '/')).sort()
    const manifest = stable({ schemaVersion: 'jefe-project-manifest/v1', contract: materializedProject, profileContext: effectiveProfileContext, artifactPaths: portableArtifacts.concat(copiedAssetPaths).sort(), physicalPaths: { projectRoot: '.', manifestPath: 'manifest.json' }, materialization: { status: 'materialized_local', generatedAt: project.timestamps.updatedAt, ...(qualityReport ? { visualQuality: qualityReport } : {}), ...(contentQualityReport ? { contentQuality: contentQualityReport } : {}) } })
    await writeArtifact(stagingRoot, artifact('manifest.json', `${JSON.stringify(manifest, null, 2)}\n`))
    if (project.generationProfile === 'commercial_site') {
      const persistedPlanning = JSON.parse(await fs.promises.readFile(resolveInside(stagingRoot, 'data/planning.json', 'planning artifact'), 'utf8')); const persistedManifest = JSON.parse(await fs.promises.readFile(resolveInside(stagingRoot, 'manifest.json', 'manifest artifact'), 'utf8'))
      if (JSON.stringify(stable(persistedPlanning)) !== JSON.stringify(stable(persistedManifest.contract?.planning))) fail('MANIFEST_PLANNING_MISMATCH', 'manifest.json y data/planning.json no contienen el mismo planning.')
    }
    await fs.promises.mkdir(path.dirname(projectRoot), { recursive: true }); await fs.promises.rename(stagingRoot, projectRoot)
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
  try { parsed = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8')) } catch (error) { fail('INVALID_MANIFEST', 'No se pudo leer un manifest JSON válido.', { message: error instanceof Error ? error.message : String(error) }) }
  if (!parsed || typeof parsed !== 'object' || !parsed.contract || !Array.isArray(parsed.artifactPaths)) fail('INVALID_MANIFEST', 'El manifest no contiene contrato ni artefactos válidos.')
  if (parsed.artifactPaths.some((entry) => typeof entry !== 'string' || path.isAbsolute(entry) || entry.split('/').includes('..'))) fail('INVALID_MANIFEST_PATHS', 'El manifest contiene rutas no portables.')
  return { manifest: parsed, project: deserializeProjectContract(JSON.stringify(parsed.contract), { allowedRoots }) }
}
function unavailableLegacyGeneration() { return { ok: false, status: 'not_available', error: 'La generación heredada fue reemplazada por creación canónica materializada.' } }
module.exports = { MaterializationError, materializeProject, readMaterializedManifest, premiumStyles, startGenerationFromRun: unavailableLegacyGeneration, getGenerationStatus: unavailableLegacyGeneration, readGenerationResult: unavailableLegacyGeneration }
