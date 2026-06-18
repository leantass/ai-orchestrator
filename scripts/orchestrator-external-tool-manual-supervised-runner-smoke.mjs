import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-manual-supervised-runner-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-manual-supervised-runner.mjs')

const {
  buildManualSupervisedExecutionSession,
  writeManualSupervisedExecutionSession,
  validateManualEvidenceIntake,
  writeManualEvidenceIntake,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-manual-supervised-runner.cjs'))

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
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
      {
        id: 'human-approval-usable',
        label: 'Aprobacion humana usable',
        status: overrides.approvalUsable === false ? 'fail' : 'pass',
        evidence: 'approval usable',
        recommendation: 'OK',
      },
      {
        id: 'evidence-defined',
        label: 'Evidencia definida',
        status: 'pass',
        evidence: 'screenshots; operator notes',
        recommendation: 'OK',
      },
      {
        id: 'validation-defined',
        label: 'Validaciones posteriores definidas',
        status: 'pass',
        evidence: 'review',
        recommendation: 'OK',
      },
    ],
    blockedReasons: [],
    missingInputs: [],
    missingOutputs: [],
    requiredHumanApprovals: ['Aprobacion humana usable antes de cualquier ejecucion manual futura.'],
    approvedScopes: ['.codex-temp/orchestrator-external-tool-manual-supervised-runner-smoke/approved-scope'],
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
      targetProject: '.codex-temp/orchestrator-external-tool-manual-supervised-runner-smoke/approved-scope',
      noExternalToolExecuted: true,
      executionAllowed: false,
      automaticExecutionAllowed: false,
      statuses: {
        approvalStatus: overrides.approvalUsable === false ? 'denied' : 'approved',
        approvalUsable: overrides.approvalUsable !== false,
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
  return { session, written }
}

resetDir(smokeRoot)

runCase('Permit bundle listo', () => {
  const { session } = prepareSession('ready', baseBundle())
  assert(session.sessionStatus === 'ready_for_manual_operator', `status inesperado: ${session.sessionStatus}`)
  assert(session.executionAllowed === false, 'executionAllowed debe ser false')
  assert(session.automaticExecutionAllowed === false, 'automaticExecutionAllowed debe ser false')
  assert(session.externalToolExecutedByJefe === false, 'externalToolExecutedByJefe debe ser false')
})

runCase('Permit bundle con missing inputs', () => {
  const { session } = prepareSession('missing-inputs', baseBundle({
    permitStatus: 'needs_missing_inputs',
    manualSupervisedExecutionCandidate: false,
    missingInputs: ['asset brief'],
  }))
  assert(session.sessionStatus === 'not_ready_missing_inputs', `status inesperado: ${session.sessionStatus}`)
})

runCase('Permit bundle sin human approval', () => {
  const { session } = prepareSession('requires-approval', baseBundle({
    permitStatus: 'requires_human_approval',
    approvalUsable: false,
    manualSupervisedExecutionCandidate: false,
  }))
  assert(session.sessionStatus === 'requires_human_approval', `status inesperado: ${session.sessionStatus}`)
})

runCase('Permit bundle blocked', () => {
  const { session } = prepareSession('blocked', baseBundle({
    permitStatus: 'blocked',
    manualSupervisedExecutionCandidate: false,
    blockedReasons: ['ruta prohibida .env'],
  }))
  assert(session.sessionStatus === 'blocked', `status inesperado: ${session.sessionStatus}`)
})

runCase('Missing permit bundle', () => {
  const session = buildManualSupervisedExecutionSession({
    permitBundlePath: path.join(smokeRoot, 'missing', 'nope.json'),
    operatorName: 'Lean',
  })
  assert(session.sessionStatus === 'missing_artifacts', `status inesperado: ${session.sessionStatus}`)
})

runCase('Evidence intake valido', () => {
  const { session } = prepareSession('evidence-valid', baseBundle())
  const evidenceDir = path.join(smokeRoot, 'approved-scope', 'evidence-valid')
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.writeFileSync(path.join(evidenceDir, 'screenshots-preview.txt'), 'preview ok\n', 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'archivo-exportado-futuro.txt'), 'export placeholder ok\n', 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'manual-log.txt'), 'manual log ok\n', 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'operator-notes.md'), 'manual notes without secrets\n', 'utf8')
  const intake = validateManualEvidenceIntake({ session, evidenceDir, operatorName: 'Lean' })
  assert(intake.evidenceStatus === 'accepted_for_review', `evidence status inesperado: ${intake.evidenceStatus}`)
  assert(intake.externalToolExecutedByJefe === false, 'externalToolExecutedByJefe debe ser false')
})

runCase('Evidence intake faltante', () => {
  const { session } = prepareSession('evidence-missing', baseBundle())
  const intake = validateManualEvidenceIntake({
    session,
    evidenceDir: path.join(smokeRoot, 'approved-scope', 'missing-evidence'),
  })
  assert(intake.evidenceStatus === 'missing_evidence', `evidence status inesperado: ${intake.evidenceStatus}`)
})

runCase('Evidence con .env', () => {
  const { session } = prepareSession('evidence-env', baseBundle())
  const evidenceDir = path.join(smokeRoot, 'approved-scope', 'evidence-env')
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.writeFileSync(path.join(evidenceDir, '.env'), 'TOKEN=fake\n', 'utf8')
  const intake = validateManualEvidenceIntake({ session, evidenceDir })
  assert(intake.evidenceStatus === 'blocked', `evidence status inesperado: ${intake.evidenceStatus}`)
})

runCase('Evidence con credenciales simuladas', () => {
  const { session } = prepareSession('evidence-secret', baseBundle())
  const evidenceDir = path.join(smokeRoot, 'approved-scope', 'evidence-secret')
  fs.mkdirSync(evidenceDir, { recursive: true })
  fs.writeFileSync(path.join(evidenceDir, 'operator-notes.md'), 'API_KEY=fake_secret_12345\n', 'utf8')
  fs.writeFileSync(path.join(evidenceDir, 'screenshots-preview.txt'), 'preview ok\n', 'utf8')
  const intake = validateManualEvidenceIntake({ session, evidenceDir })
  assert(intake.evidenceStatus === 'blocked', `evidence status inesperado: ${intake.evidenceStatus}`)
})

runCase('Output inseguro', () => {
  const unsafe = runCli([
    '--mode', 'prepare',
    '--permit-bundle', bundlePath('unsafe-output', baseBundle()),
    '--operator', 'Lean',
    '--output', 'scripts/manual-supervised-runner-unsafe',
  ])
  assert(unsafe.status !== 0, 'CLI debio fallar con output inseguro')
})

runCase('JSON mode parseable', () => {
  const result = runCli([
    '--mode', 'prepare',
    '--permit-bundle', bundlePath('json-mode', baseBundle()),
    '--operator', 'Lean',
    '--output', path.join('.codex-temp', 'orchestrator-external-tool-manual-supervised-runner-smoke', 'json-mode-output'),
    '--json',
  ])
  assert(result.status === 0, `CLI fallo: ${result.stderr}`)
  const parsed = JSON.parse(result.stdout)
  assert(parsed.sessionStatus === 'ready_for_manual_operator', 'JSON mode no devolvio session ready')
  assert(parsed.externalToolExecutedByJefe === false, 'JSON mode no declara externalToolExecutedByJefe false')
})

runCase('Escritura de artefactos', () => {
  const { session } = prepareSession('write-session', baseBundle())
  const sessionDir = path.join(smokeRoot, 'write-session', 'artifacts')
  const written = writeManualSupervisedExecutionSession(sessionDir, session)
  for (const filePath of [
    written.sessionPath,
    written.runbookPath,
    written.checklistPath,
    written.evidencePath,
    written.abortPath,
    written.validationPath,
    written.readmePath,
  ]) {
    assert(fs.existsSync(filePath), `artefacto faltante: ${filePath}`)
  }
  const intake = validateManualEvidenceIntake({ session, evidenceDir: path.join(smokeRoot, 'write-session', 'missing') })
  const intakeWritten = writeManualEvidenceIntake(path.join(smokeRoot, 'write-session', 'intake'), intake)
  assert(fs.existsSync(intakeWritten.intakePath), 'intake json faltante')
  assert(readJson(written.sessionPath).externalToolExecutedByJefe === false, 'session escrita no conserva safety flag')
})

console.log('OK. Manual Supervised External Execution Runner smoke completo.')
