const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const { assessArtifact, assessContentQuality } = require('./jefe-generator-quality.cjs')

function planFidelity({ html, spec }) {
  const source = String(html || '')
  const order = [...source.matchAll(/<(?:section|main)[^>]*id=["']([^"']+)["']/giu)].map((match) => match[1])
  const expected = Array.isArray(spec?.sectionOrder) ? spec.sectionOrder : []
  const missing = expected.filter((id) => !source.includes(`id="${id}"`) && !source.includes(`id='${id}'`))
  const actualExpectedOrder = order.filter((id) => expected.includes(id))
  const pass = missing.length === 0 && (actualExpectedOrder.length === 0 || expected.every((id, index) => actualExpectedOrder[index] === id))
  return { pass, status: pass ? 'PASS' : 'NEEDS_CORRECTION', expectedOrder: expected, actualOrder: order, comparedOrder: actualExpectedOrder, missing }
}
function independence({ html, css, js }) { const source = `${html}\n${css}\n${js}`; const findings = []; if (/\b(?:electron|preload|ipc)\b|file:\/\//iu.test(source)) findings.push('runtime dependency detected'); if (/(?:src|href)=["'](?:[a-z]:|\/|https?:)/iu.test(html)) findings.push('unsafe asset path'); return { pass: findings.length === 0, findings } }
function aggregate(reports) { const required = ['semanticPreGate', 'semanticPlanFidelity', 'artifactIndependence', 'visualQuality', 'contentQuality']; const pass = required.every((key) => reports[key]?.pass === true); return { ...reports, overallStatus: pass ? 'PASS' : 'NEEDS_CORRECTION', eligibleForPromotion: pass } }
async function candidateHash(candidateRoot) {
  const names = ['app/index.html', 'app/styles.css', 'app/app.js']
  const hash = crypto.createHash('sha256')
  for (const name of names) hash.update(name).update('\0').update(await fs.readFile(path.join(candidateRoot, name)))
  return hash.digest('hex')
}
async function evaluateCandidate({ candidateRoot, planning, spec, semanticPreGate = 'PASS', browserQuality = { status: 'NOT_IMPLEMENTED', mode: 'offline-static-candidate' }, experienceQuality = { status: 'NOT_IMPLEMENTED' } } = {}) {
  const read = (name) => fs.readFile(path.join(candidateRoot, 'app', name), 'utf8')
  const [html, css, js] = await Promise.all([read('index.html'), read('styles.css'), read('app.js')])
  const artifact = assessArtifact({ html, css, js }); const content = assessContentQuality(planning); const fidelity = planFidelity({ html, spec }); const independenceReport = independence({ html, css, js }); const quality = aggregate({ semanticPreGate: { pass: semanticPreGate === 'PASS' }, semanticPlanFidelity: fidelity, artifactIndependence: independenceReport, visualQuality: { pass: artifact.overallStatus === 'PASS', report: artifact }, contentQuality: { pass: content.overallContentStatus === 'PASS', report: content }, experienceQuality, browserQuality })
  return { ...quality, candidateRoot: path.resolve(candidateRoot), candidateHash: await candidateHash(candidateRoot), candidateIdentity: { root: path.resolve(candidateRoot), hashAlgorithm: 'sha256', files: ['app/index.html', 'app/styles.css', 'app/app.js'] } }
}
async function assertPromotionEligible(report, { candidateRoot = report?.candidateRoot } = {}) { const currentHash = await candidateHash(candidateRoot); if (report.overallStatus !== 'PASS' || report.eligibleForPromotion !== true || currentHash !== report.candidateHash) { const error = new Error('QUALITY_BEFORE_PROMOTION_FAILED'); error.code = 'QUALITY_BEFORE_PROMOTION_FAILED'; error.report = { ...report, currentHash }; throw error } return report }
module.exports = { planFidelity, independence, aggregate, evaluateCandidate, assertPromotionEligible }
