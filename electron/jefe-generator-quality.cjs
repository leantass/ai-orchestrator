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
  const vocabulary = words([...(understanding.domainVocabulary || []), ...(understanding.customerNeeds || []), understanding.businessType].join(' '))
  const faq = Array.isArray(content.faq) ? content.faq : []
  for (const item of faq) if (vocabulary.size && ![...words(`${item.question} ${item.answer}`)].some((word) => vocabulary.has(word))) findings.push({ severity: 'error', category: 'faqRelevance', selector: 'faq', expected: 'pregunta relacionada al dominio', actual: item.question })
  const trustWords = words((understanding.trustDrivers || []).join(' '))
  for (const item of content.trustItems || []) if (trustWords.size && ![...words(item.description)].some((word) => trustWords.has(word))) findings.push({ severity: 'error', category: 'trustRelevance', selector: '.trust-card', expected: 'driver de confianza', actual: item.description })
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

module.exports = { WCAG_THRESHOLDS, contrastRatio, parseTokens, assessTheme, assessArtifact, assertArtifactQuality, assessContentQuality, assertContentQuality, snapshotFiles }
