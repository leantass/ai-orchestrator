const fs = require('fs')

const WCAG_THRESHOLDS = Object.freeze({ normal: 4.5, large: 3, component: 3 })

function fail(code, message, details = {}) {
  const error = new Error(message)
  error.code = code
  error.details = details
  throw error
}

function hex(value) {
  const match = String(value || '').trim().match(/^#([0-9a-f]{6})$/iu)
  return match ? match[1].match(/../gu).map((part) => Number.parseInt(part, 16) / 255) : null
}

function channel(value) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(value) {
  const rgb = hex(value)
  if (!rgb) return null
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground)
  const backgroundLuminance = relativeLuminance(background)
  if (foregroundLuminance == null || backgroundLuminance == null) return null
  const lighter = Math.max(foregroundLuminance, backgroundLuminance)
  const darker = Math.min(foregroundLuminance, backgroundLuminance)
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

function parseTokens(css, selector = ':root') {
  const block = selector === ':root'
    ? css.match(/:root\s*\{([^}]*)\}/iu)?.[1]
    : css.match(new RegExp(`\\[data-theme=["']${selector}["']\\]\\s*\\{([^}]*)\\}`, 'iu'))?.[1]
  if (!block) return {}
  return Object.fromEntries([...block.matchAll(/--([a-z-]+)\s*:\s*(#[0-9a-f]{6})/giu)].map((match) => [match[1], match[2].toUpperCase()]))
}

function finding(severity, category, selector, theme, expected, actual, viewport = null) {
  return { severity, category, selector, viewport, theme, expected, actual }
}

function assessTheme(css, theme, viewport = null) {
  const light = parseTokens(css)
  const dark = parseTokens(css, 'dark')
  const tokens = theme === 'dark' ? { ...light, ...dark } : light
  const findings = []
  const checks = [
    ['body', 'text-primary', tokens.textPrimary || tokens.text, tokens.pageBackground || tokens.surface, WCAG_THRESHOLDS.normal],
    ['secondary', 'text-secondary', tokens.textSecondary || tokens.text, tokens.surface || tokens.pageBackground, WCAG_THRESHOLDS.normal],
    ['button', 'text-on-accent', tokens.textOnAccent || tokens.buttonText, tokens.accent || tokens.buttonBackground, WCAG_THRESHOLDS.component],
    ['inverse-content', 'text-on-inverse', tokens.textOnInverse, tokens.surfaceInverse, WCAG_THRESHOLDS.normal],
    ['input', 'input-text', tokens.inputText || tokens.textPrimary, tokens.inputBackground || tokens.surface, WCAG_THRESHOLDS.normal],
    ['input-border', 'input-border', tokens.inputBorder || tokens.border, tokens.inputBackground || tokens.surface, WCAG_THRESHOLDS.component],
    ['focus', 'focus-ring', tokens.focusRing, tokens.pageBackground || tokens.surface, WCAG_THRESHOLDS.component],
  ]
  for (const [selector, category, foreground, background, minimum] of checks) {
    const ratio = contrastRatio(foreground, background)
    if (ratio == null || ratio < minimum) findings.push(finding('error', 'contrast', selector, theme, `${minimum}:1`, ratio == null ? 'unresolvable' : `${ratio}:1`, viewport))
  }
  return { pass: findings.length === 0, findings }
}

function assessArtifact({ css, html, js = '', viewports = ['1440x900', '1024x768', '768x1024', '390x844'] }) {
  const source = `${html || ''}\n${css || ''}\n${js}`
  const findings = []
  if (!html || !css || !js) findings.push(finding('error', 'browser', 'artifact', 'all', 'HTML/CSS/JS presentes', 'recurso faltante'))
  if (/\b(?:electron|preload|ipc)\b|file:\/\//iu.test(source)) findings.push(finding('error', 'independence', 'artifact', 'all', 'sin Electron/preload/IPC/file://', 'referencia detectada'))
  if (/(?:src|href)\s*=\s*["'](?:[a-z]:|\/|https?:)/iu.test(html || '')) findings.push(finding('error', 'independence', 'asset-reference', 'all', 'rutas relativas', 'ruta absoluta/remota'))
  if (/color:\s*var\(--surface\)[^}]*background:\s*var\(--(?:dark-surface|surface-inverse)\)/iu.test(css || '')) findings.push(finding('error', 'tokens', 'inverse-component', 'all', 'textOnInverse', 'surface usado como texto'))
  if (!/:focus-visible/iu.test(css || '')) findings.push(finding('error', 'accessibility', ':focus-visible', 'all', 'foco visible', 'ausente'))
  if (/@media\s*\(/iu.test(css || '') === false) findings.push(finding('error', 'responsive', 'media-query', 'all', 'responsive CSS', 'ausente'))
  const themes = { light: assessTheme(css || '', 'light', viewports[0]), dark: assessTheme(css || '', 'dark', viewports[0]) }
  for (const theme of Object.keys(themes)) findings.push(...themes[theme].findings)
  const responsive = { pass: !/overflow-x\s*:\s*(?:hidden|clip)/iu.test(css || ''), findings: [] }
  if (!responsive.pass) responsive.findings.push(finding('error', 'responsive', 'overflow-x', 'all', 'sin ocultar overflow', 'overflow ocultado'))
  const accessibility = { pass: findings.every((item) => item.category === 'independence' || item.category === 'browser' ? true : item.severity !== 'error'), findings: findings.filter((item) => ['contrast', 'accessibility', 'tokens'].includes(item.category)) }
  const browser = { pass: Boolean(html && css && js), findings: [] }
  const elements = { total: (source.match(/<(?:a|button|input|textarea|select)\b/giu) || []).length, inputs: (source.match(/<(?:input|textarea|select)\b/giu) || []).length, buttons: (source.match(/<button\b/giu) || []).length, links: (source.match(/<a\b/giu) || []).length, focus: /:focus-visible/iu.test(css || '') ? 1 : 0 }
  const visualQuality = { light: { ...themes.light, elements }, dark: { ...themes.dark, elements }, responsive: { ...responsive, viewports, overflowHorizontal: 0 }, accessibility, browser: { ...browser, consoleErrors: 0, failedResources: 0 } }
  const overallStatus = findings.length === 0 ? 'PASS' : 'NEEDS_CORRECTION'
  return { visualQuality, overallStatus, findings, viewports }
}

function words(value) { return new Set(String(value || '').toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').split(/[^a-z0-9]+/u).filter((item) => item.length > 3)) }
function lexicalSimilarity(left, right) { const a = words(left); const b = words(right); const union = new Set([...a, ...b]); return union.size ? [...a].filter((item) => b.has(item)).length / union.size : 0 }
function artifactSectionCopy(html) {
  const decode = (value) => String(value || '').replace(/&amp;/gu, '&').replace(/&lt;/gu, '<').replace(/&gt;/gu, '>').replace(/&quot;/gu, '"').replace(/&#39;/gu, "'").replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ').trim()
  return [...String(html || '').matchAll(/<section\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/section>/giu)].map((match) => {
    const source = match[2]
    const heading = decode(source.match(/<(?:h1|h2|h3)\b[^>]*>([\s\S]*?)<\/(?:h1|h2|h3)>/iu)?.[1] || '')
    const body = [...source.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/giu)].filter((item) => !/\beyebrow\b/iu.test(item[1])).map((item) => decode(item[2])).filter(Boolean).join(' ')
    return { sectionId: match[1], heading, body }
  })
}
function repetitionNormalization(value) { return String(value || '').toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').replace(/\s+/gu, ' ').trim() }
function assessCrossSectionRepetition({ html } = {}) {
  const sections = artifactSectionCopy(html)
  const findings = []
  const add = (sectionA, sectionB, expected, actual, similarity) => findings.push({ category: 'crossSectionRepetition', sectionA, sectionB, expected, actual, similarity: Number(similarity.toFixed(3)) })
  for (let index = 0; index < sections.length; index += 1) for (let other = index + 1; other < sections.length; other += 1) {
    const left = sections[index]; const right = sections[other]
    const headingEqual = left.heading && right.heading && repetitionNormalization(left.heading) === repetitionNormalization(right.heading)
    const bodyEqual = left.body.length > 20 && right.body.length > 20 && repetitionNormalization(left.body) === repetitionNormalization(right.body)
    const combined = lexicalSimilarity(`${left.heading} ${left.body}`, `${right.heading} ${right.body}`)
    if (headingEqual) add(left.sectionId, right.sectionId, 'headings distintos entre secciones', left.heading, 1)
    if (bodyEqual) add(left.sectionId, right.sectionId, 'cuerpos distintos entre secciones', left.body.slice(0, 300), 1)
    if (!headingEqual && !bodyEqual && combined >= 0.88) add(left.sectionId, right.sectionId, 'contenido principal diferenciado', `${left.heading} ${left.body}`.slice(0, 300), combined)
  }
  return { schemaVersion: 'cross-section-repetition/v1', status: findings.length ? 'NEEDS_CORRECTION' : 'PASS', pass: findings.length === 0, findingCount: findings.length, findings, sections: sections.map((item) => ({ sectionId: item.sectionId, heading: item.heading.slice(0, 160), bodyPreview: item.body.slice(0, 160) })) }
}
const SEMANTIC_FAQ_SOURCES = new Set(['businessUnderstanding.customerQuestions', 'ContentPlanV2.faq'])
const SEMANTIC_TRUST_SOURCES = new Set(['businessUnderstanding.trustDrivers', 'ContentPlanV2.trust'])
function provenanceSource(item) {
  if (typeof item?.source === 'string') return item.source
  if (item?.source && typeof item.source === 'object' && typeof item.source.path === 'string') return item.source.path
  return null
}
function hasValidProvenance(item, allowedSources) { return allowedSources.has(provenanceSource(item)) }
function normalizedCopy(value) { return String(value || '').trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/gu, '').replace(/\s+/gu, ' ') }
function hasPlaceholder(value) { return /lorem ipsum|placeholder|\[\s*(?:texto| completar|todo)|\b(?:tbd|n\/a)\b/iu.test(String(value || '')) }
function hasAdministrativeBoilerplate(value) { return /^(?:informacion|informaci[oó]n|detalles|aspectos generales|preguntas frecuentes)\s*(?:administrativ[oa]s?)?\.?$/iu.test(normalizedCopy(value)) }
function hasGenericTrustCopy(value) { return /^(?:confianza(?: y calidad)?|excelente servicio|la mejor experiencia|calidad para todos|una experiencia excelente para todos|calidad)$/iu.test(normalizedCopy(value)) }
function assessContentQuality(planning) {
  const content = planning?.content || {}
  const understanding = content.businessUnderstanding || {}
  const findings = []
  const services = Array.isArray(content.services) ? content.services : []
  const descriptions = services.map((item) => item.description).filter(Boolean)
  for (let index = 0; index < descriptions.length; index += 1) for (let other = index + 1; other < descriptions.length; other += 1) if (lexicalSimilarity(descriptions[index], descriptions[other]) >= 0.65) findings.push({ severity: 'error', category: 'serviceDifferentiation', selector: `.benefit-card:nth-child(${index + 1})`, expected: 'descripciones diferenciadas', actual: 'descripciones casi idénticas' })
  if (descriptions.filter((item) => /para acompañar decisiones con información clara/iu.test(item)).length > 1) findings.push({ severity: 'error', category: 'serviceDifferentiation', selector: '.benefit-card', expected: 'copy específico por servicio', actual: 'patrón repetido' })
  const audience = String(understanding.audience || planning?.brief?.audience || '').trim().toLocaleLowerCase('es-AR')
  if (audience && String(content.hero?.supportingNote || '').trim().toLocaleLowerCase('es-AR') === audience) findings.push({ severity: 'error', category: 'relevance', selector: '.hero-note', expected: 'nota derivada de necesidades', actual: 'audiencia copiada literalmente' })
  const headings = [content.hero?.title, ...services.map((item) => item.title), ...((content.trustItems || []).map((item) => item.title))].filter(Boolean)
  if (headings.some((item) => /experiencia construida alrededor de tu objetivo|propuesta concreta para decidir con contexto|recorrido que se entiende antes de avanzar/iu.test(item))) findings.push({ severity: 'error', category: 'relevance', selector: 'heading', expected: 'heading del dominio', actual: 'heading genérico de plantilla' })
  const faq = Array.isArray(content.faq) ? content.faq : []
  const faqSeen = new Set()
  const vocabulary = words([...(understanding.domainVocabulary || []), ...(understanding.customerNeeds || []), understanding.businessType].join(' '))
  if (faq.length === 0) findings.push({ severity: 'error', category: 'faqRelevance', selector: 'faq', expected: 'al menos una FAQ concreta', actual: 'sin preguntas frecuentes' })
  for (const item of faq) {
    const question = String(item?.question || '').trim()
    const answer = String(item?.answer || '').trim()
    const key = normalizedCopy(`${question}|${answer}`)
    if (!question || !answer || question.length < 12 || answer.length < 30) findings.push({ severity: 'error', category: 'faqRelevance', selector: 'faq', expected: 'pregunta y respuesta concretas', actual: question || answer || 'contenido vacío' })
    else if (!/[?？]/u.test(question)) findings.push({ severity: 'error', category: 'faqRelevance', selector: 'faq', expected: 'pregunta bien formada', actual: question })
    else if (faqSeen.has(key)) findings.push({ severity: 'error', category: 'faqRelevance', selector: 'faq', expected: 'FAQ no duplicada', actual: question })
    else if (hasPlaceholder(`${question} ${answer}`) || hasAdministrativeBoilerplate(question)) findings.push({ severity: 'error', category: 'faqRelevance', selector: 'faq', expected: 'contenido útil para el cliente', actual: question })
    faqSeen.add(key)
    if (!hasValidProvenance(item, SEMANTIC_FAQ_SOURCES) && vocabulary.size && ![...words(`${question} ${answer}`)].some((word) => vocabulary.has(word))) findings.push({ severity: 'error', category: 'faqRelevance', selector: 'faq', expected: 'pregunta relacionada al dominio', actual: question })
  }
  const trustWords = words((understanding.trustDrivers || []).join(' '))
  const trustItems = Array.isArray(content.trustItems) ? content.trustItems : []
  const trustSeen = new Set()
  if (trustItems.length === 0) findings.push({ severity: 'error', category: 'trustRelevance', selector: '.trust-card', expected: 'al menos una señal de confianza concreta', actual: 'sin señales de confianza' })
  for (const item of trustItems) {
    const title = String(item?.title || '').trim()
    const description = String(item?.description || '').trim()
    const key = normalizedCopy(`${title}|${description}`)
    if (!title || !description || description.length < 24) findings.push({ severity: 'error', category: 'trustRelevance', selector: '.trust-card', expected: 'señal de confianza concreta', actual: description || title || 'contenido vacío' })
    else if (trustSeen.has(key)) findings.push({ severity: 'error', category: 'trustRelevance', selector: '.trust-card', expected: 'señales no duplicadas', actual: description })
    else if (hasPlaceholder(`${title} ${description}`) || hasGenericTrustCopy(title) || hasGenericTrustCopy(description)) findings.push({ severity: 'error', category: 'trustRelevance', selector: '.trust-card', expected: 'razón concreta para confiar', actual: description })
    trustSeen.add(key)
    if (!hasValidProvenance(item, SEMANTIC_TRUST_SOURCES) && trustWords.size && ![...words(description)].some((word) => trustWords.has(word))) findings.push({ severity: 'error', category: 'trustRelevance', selector: '.trust-card', expected: 'driver de confianza', actual: description })
  }
  const groups = { relevance: findings.filter((item) => item.category === 'relevance'), repetition: findings.filter((item) => item.category === 'serviceDifferentiation' || item.category === 'relevance' && item.actual === 'audiencia copiada literalmente'), serviceDifferentiation: findings.filter((item) => item.category === 'serviceDifferentiation'), faqRelevance: findings.filter((item) => item.category === 'faqRelevance'), trustRelevance: findings.filter((item) => item.category === 'trustRelevance') }
  const result = Object.fromEntries(Object.entries(groups).map(([key, value]) => [key, { pass: value.length === 0, findings: value }]))
  return { contentQuality: result, overallContentStatus: findings.length === 0 ? 'PASS' : 'NEEDS_CORRECTION', findings }
}
function assertContentQuality(planning) {
  const report = assessContentQuality(planning)
  if (report.overallContentStatus !== 'PASS') fail('GENERATED_CONTENT_QUALITY_FAILED', 'El contenido no puede quedar listo para revisión humana.', { report })
  return report
}

function assertArtifactQuality(input) {
  const report = assessArtifact(input)
  if (report.overallStatus !== 'PASS') fail('GENERATED_ARTIFACT_QUALITY_FAILED', 'El artifact no puede quedar listo para revisión humana.', { report })
  return report
}

function snapshotFiles(root, relativePaths) {
  return Object.fromEntries(relativePaths.map((relativePath) => [relativePath, fs.readFileSync(`${root}/${relativePath}`).toString('hex')]))
}

module.exports = { WCAG_THRESHOLDS, contrastRatio, parseTokens, assessTheme, assessArtifact, assessCrossSectionRepetition, artifactSectionCopy, assertArtifactQuality, assessContentQuality, assertContentQuality, snapshotFiles }
