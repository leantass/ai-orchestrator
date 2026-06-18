import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-post-execution-review-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-post-execution-review.mjs')

const {
  buildManualSupervisedExecutionSession,
  writeManualSupervisedExecutionSession,
  validateManualEvidenceIntake,
  writeManualEvidenceIntake,
  abortManualSupervisedExecutionSession,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-manual-supervised-runner.cjs'))

const {
  buildExternalToolPostExecutionReview,
  writeExternalToolPostExecutionReview,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-post-execution-review.cjs'))

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function resetDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true })
  fs.mkdirSync(dir, { recursive: true })
}

function runCase(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error.stack || error.message)
    process.exit(1)
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function baseBundle(overrides = {}) {
  const permitStatus = overrides.permitStatus || 'ready_for_manual_supervised_execution'
  return {
    permitStatus,
    executionAllowed: false,
    automaticExecutionAllowed: false,
    manualSupervisedExecutionCandidate: permitStatus === 'ready_for_manual_supervised_execution',
    workerId: 'external.blender.asset.create',
    workerDisplayName: 'Blender manual asset worker',
    capability: 'asset.blender.create',
    toolKind: 'blender',
    artifactStatus: {
      plannedHandoff: 'present',
      approvalGate: 'present',
      dryRunPlan: 'present',
      supervisedExecutionDesign: 'present',
      readinessReview: 'present',
      manualExecutionPacket: 'present',
      humanApprovalRecord: 'present',
    },
    consistencyChecks: [
      {
        id: 'artifacts-present',
        label: 'Artefactos presentes',
        status: 'pass',
        evidence: 'all present',
        recommendation: 'OK',
      },
    ],
    blockedReasons: [],
    missingInputs: [],
    missingOutputs: [],
    requiredHumanApprovals: ['Aprobacion humana usable antes de cualquier ejecucion manual futura.'],
    approvedScopes: ['.codex-temp/orchestrator-external-tool-post-execution-review-smoke/approved-scope'],
    forbiddenActions: ['No ejecutar Blender automaticamente.', 'No usar credenciales reales.'],
    executionPreconditions: ['asset brief aprobado', 'input scope aprobado', 'output scope aprobado'],
    manualOperatorChecklist: ['Confirmar Blender manual fuera de JEFE.', 'Confirmar evidencia esperada.'],
    evidenceContract: ['screenshots', 'operator notes'],
    validationPlan: ['post-execution review futuro', 'repo status review'],
    abortConditions: ['Abortar si aparece .env o credenciales.'],
    goNoGoSummary: 'GO para preparacion de ejecucion manual supervisada futura.',
    nextAction: 'Preparar sesion manual supervisada.',
    metadata: {
      generatedAt: '2026-06-18T00:00:00.000Z',
      targetProject: '.codex-temp/orchestrator-external-tool-post-execution-review-smoke/approved-scope',
      noExternalToolExecuted: true,
      executionAllowed: false,
      automaticExecutionAllowed: false,
      statuses: {
        approvalStatus: 'approved',
        approvalUsable: true,
        readinessStatus: 'ready_for_human_execution_approval',
      },
    },
    ...overrides,
  }
}

function bundlePath(name, bundle) {
  const filePath = path.join(smokeRoot, name, 'external-tool-execution-permit-bundle.json')
  writeJson(filePath, bundle)
  return filePath
}

function prepareSession(name, bundle) {
  const session = buildManualSupervisedExecutionSession({
    permitBundlePath: bundlePath(name, bundle),
    operatorName: 'Lean',
    operatorRole: 'Human Owner',
  })
  const written = writeManualSupervisedExecutionSession(path.join(smokeRoot, name, 'session'), session)
  return { session: written.session, sessionPath: written.sessionPath }
}

function createEvidenceDir(name, files) {
  const evidenceDir = path.join(smokeRoot, 'approved-scope', name)
  fs.mkdirSync(evidenceDir, { recursive: true })
  for (const [relativePath, content] of files) {
    const filePath = path.join(evidenceDir, relativePath)
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, content, 'utf8')
  }
  return evidenceDir
}

function prepareIntake(name, session, evidenceDir) {
  const intake = validateManualEvidenceIntake({
    session,
    evidenceDir,
    operatorName: 'Lean',
    notes: `intake ${name}`,
  })
  const written = writeManualEvidenceIntake(path.join(smokeRoot, name, 'intake'), intake)
  return { intake: written.intake, intakePath: written.intakePath }
}

function prepareReview(name, sessionPath, intakePath, extra = {}) {
  const review = buildExternalToolPostExecutionReview({
    sessionPath,
    intakePath,
    reviewerName: 'Lean',
    reviewerRole: 'Human Reviewer',
    notes: `review ${name}`,
    ...extra,
  })
  const written = writeExternalToolPostExecutionReview(path.join(smokeRoot, name, 'review'), review)
  return { review: written.review, reviewPath: written.reviewPath }
}

resetDir(smokeRoot)

runCase('Evidence aceptada produce pass', () => {
  const { session, sessionPath } = prepareSession('pass', baseBundle())
  const evidenceDir = createEvidenceDir('pass', [
    ['screenshots-preview.txt', 'preview ok\n'],
    ['archivo-exportado-futuro.txt', 'export ok\n'],
    ['manual-log.txt', 'operator log ok\n'],
    ['operator-notes.md', 'notes ok\n'],
  ])
  const { intakePath } = prepareIntake('pass', session, evidenceDir)
  const { review } = prepareReview('pass', sessionPath, intakePath)
  assert(review.reviewStatus === 'pass', `status inesperado: ${review.reviewStatus}`)
  assert(review.externalToolExecutedByJefe === false, 'externalToolExecutedByJefe debe ser false')
})

runCase('Evidence faltante produce missing_evidence', () => {
  const { session, sessionPath } = prepareSession('missing-evidence', baseBundle())
  const { intakePath } = prepareIntake('missing-evidence', session, path.join(smokeRoot, 'approved-scope', 'missing-evidence'))
  const { review } = prepareReview('missing-evidence', sessionPath, intakePath)
  assert(review.reviewStatus === 'missing_evidence', `status inesperado: ${review.reviewStatus}`)
})

runCase('Evidence incompleta produce needs_revision', () => {
  const { session, sessionPath } = prepareSession('needs-revision', baseBundle())
  const evidenceDir = createEvidenceDir('needs-revision', [
    ['operator-notes.md', 'notes only\n'],
  ])
  const { intakePath } = prepareIntake('needs-revision', session, evidenceDir)
  const { review } = prepareReview('needs-revision', sessionPath, intakePath)
  assert(review.reviewStatus === 'needs_revision', `status inesperado: ${review.reviewStatus}`)
})

runCase('Scope prohibido produce invalid_scope', () => {
  const { session, sessionPath } = prepareSession('invalid-scope', baseBundle())
  const evidenceDir = createEvidenceDir('invalid-scope', [
    ['screenshots-preview.txt', 'preview ok\n'],
    ['archivo-exportado-futuro.txt', 'export ok\n'],
    ['manual-log.txt', 'operator log ok\n'],
    ['operator-notes.md', 'notes ok\n'],
    ['build/run.txt', 'should not be here\n'],
  ])
  const { intakePath } = prepareIntake('invalid-scope', session, evidenceDir)
  const { review } = prepareReview('invalid-scope', sessionPath, intakePath)
  assert(review.reviewStatus === 'invalid_scope', `status inesperado: ${review.reviewStatus}`)
})

runCase('Hallazgo sensible produce blocked', () => {
  const { session, sessionPath } = prepareSession('blocked-security', baseBundle())
  const evidenceDir = createEvidenceDir('blocked-security', [
    ['screenshots-preview.txt', 'preview ok\n'],
    ['archivo-exportado-futuro.txt', 'export ok\n'],
    ['manual-log.txt', 'operator log ok\n'],
    ['operator-notes.md', 'API_KEY=fake_secret_12345\n'],
  ])
  const { intakePath } = prepareIntake('blocked-security', session, evidenceDir)
  const { review } = prepareReview('blocked-security', sessionPath, intakePath)
  assert(review.reviewStatus === 'blocked', `status inesperado: ${review.reviewStatus}`)
})

runCase('Sesion abortada produce blocked', () => {
  const { session, sessionPath } = prepareSession('aborted', baseBundle())
  const aborted = abortManualSupervisedExecutionSession(session, 'Operator aborted before review')
  const writtenSession = writeManualSupervisedExecutionSession(path.join(smokeRoot, 'aborted', 'session-aborted'), aborted)
  const evidenceDir = createEvidenceDir('aborted', [
    ['screenshots-preview.txt', 'preview ok\n'],
    ['archivo-exportado-futuro.txt', 'export ok\n'],
    ['manual-log.txt', 'operator log ok\n'],
    ['operator-notes.md', 'notes ok\n'],
  ])
  const { intakePath } = prepareIntake('aborted', writtenSession.session, evidenceDir)
  const { review } = prepareReview('aborted', writtenSession.sessionPath, intakePath)
  assert(sessionPath, 'sessionPath original faltante')
  assert(review.reviewStatus === 'blocked', `status inesperado: ${review.reviewStatus}`)
})

runCase('CLI JSON parseable', () => {
  const { session, sessionPath } = prepareSession('cli-json', baseBundle())
  const evidenceDir = createEvidenceDir('cli-json', [
    ['screenshots-preview.txt', 'preview ok\n'],
    ['archivo-exportado-futuro.txt', 'export ok\n'],
    ['manual-log.txt', 'operator log ok\n'],
    ['operator-notes.md', 'notes ok\n'],
  ])
  const { intakePath } = prepareIntake('cli-json', session, evidenceDir)
  const outputDir = path.join('.codex-temp', 'orchestrator-external-tool-post-execution-review-smoke', 'cli-json', 'review-output')
  const result = runCli([
    '--mode', 'review',
    '--session', path.relative(repoRoot, sessionPath),
    '--intake', path.relative(repoRoot, intakePath),
    '--reviewer', 'Lean',
    '--output', outputDir,
    '--json',
  ])
  assert(result.status === 0, `CLI fallo: ${result.stderr}`)
  const parsed = JSON.parse(result.stdout)
  assert(parsed.reviewStatus === 'pass', 'JSON mode no devolvio review pass')
  assert(parsed.externalToolExecutedByJefe === false, 'JSON mode debe declarar externalToolExecutedByJefe false')
})