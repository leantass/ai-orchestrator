import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-supervised-worker-workflow-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-supervised-worker-workflow.mjs')

const {
  runSupervisedWorkerWorkflow,
  writeSupervisedWorkerWorkflowReport,
} = require(path.join(repoRoot, 'electron', 'orchestrator-supervised-worker-workflow.cjs'))

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

function createReadyHandoff(caseName, correctedEvidenceDir) {
  const handoffPath = path.join(smokeRoot, caseName, 'worker-handoff.json')
  writeJson(handoffPath, {
    workerHandoffStatus: 'ready',
    workerId: 'codex-manual-correction',
    workerDisplayName: 'Codex Manual Correction Worker',
    capability: 'sandbox.delivery.correct',
    caseName,
    correctedEvidenceDir,
    finalPrompt: 'Corregir evidencia sandbox manualmente. No tocar archivos versionados.',
    workerEnvelope: {
      envelopeStatus: 'ready',
      workerId: 'codex-manual-correction',
    },
    metadata: {
      promptPath: path.join(path.dirname(handoffPath), 'worker-handoff-prompt.md'),
    },
  })
  fs.writeFileSync(path.join(path.dirname(handoffPath), 'worker-handoff-prompt.md'), 'Prompt seguro\n', 'utf8')
  return handoffPath
}

function createCorrectedEvidence(caseName) {
  const dir = path.join(smokeRoot, caseName, 'corrected-evidence')
  fs.mkdirSync(dir, { recursive: true })
  writeJson(path.join(dir, 'summary.json'), { status: 'corrected' })
  return dir
}

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  })
}

resetDir(smokeRoot)

runCase('Handoff ready sin corrected evidence', () => {
  const missingEvidence = path.join(smokeRoot, 'awaiting', 'corrected-evidence')
  const handoffPath = createReadyHandoff('awaiting', missingEvidence)
  const result = runSupervisedWorkerWorkflow({
    caseName: 'awaiting',
    correctionWorkerHandoffPath: handoffPath,
    correctedEvidenceDir: missingEvidence,
    outputDir: path.join(smokeRoot, 'awaiting-output'),
  })
  assert(result.workflowStatus === 'awaiting_corrected_evidence', `status inesperado: ${result.workflowStatus}`)
})

runCase('Corrected evidence + dry-run validation', () => {
  const evidenceDir = createCorrectedEvidence('dry-run')
  const handoffPath = createReadyHandoff('dry-run', evidenceDir)
  const result = runSupervisedWorkerWorkflow({
    caseName: 'dry-run',
    correctionWorkerHandoffPath: handoffPath,
    correctedEvidenceDir: evidenceDir,
    validationPreset: 'registry-basic',
    outputDir: path.join(smokeRoot, 'dry-run-output'),
  })
  assert(result.workflowStatus === 'handoff_ready', `status inesperado: ${result.workflowStatus}`)
  assert(result.validationWorker.taskStatus === 'dry_run', 'validation worker no quedo dry_run')
})

runCase('Corrected evidence + execute validation segura', () => {
  const evidenceDir = createCorrectedEvidence('execute-safe')
  const handoffPath = createReadyHandoff('execute-safe', evidenceDir)
  const result = runSupervisedWorkerWorkflow({
    caseName: 'execute-safe',
    correctionWorkerHandoffPath: handoffPath,
    correctedEvidenceDir: evidenceDir,
    validationCommands: ['node --check src/planner-ui-state.js'],
    validationPreset: 'registry-basic',
    outputDir: path.join(smokeRoot, 'execute-safe-output'),
    executeValidation: true,
  })
  assert(result.workflowStatus === 'validation_passed', `status inesperado: ${result.workflowStatus}`)
  assert(result.validationWorker.validationPassed === true, 'validacion segura no paso')
})

runCase('Corrected evidence + validation command bloqueado', () => {
  const evidenceDir = createCorrectedEvidence('blocked-command')
  const handoffPath = createReadyHandoff('blocked-command', evidenceDir)
  const result = runSupervisedWorkerWorkflow({
    caseName: 'blocked-command',
    correctionWorkerHandoffPath: handoffPath,
    correctedEvidenceDir: evidenceDir,
    validationCommands: ['npm install'],
    validationPreset: 'registry-basic',
    outputDir: path.join(smokeRoot, 'blocked-command-output'),
    executeValidation: true,
  })
  assert(result.workflowStatus === 'blocked_requires_human', `status inesperado: ${result.workflowStatus}`)
})

runCase('Missing handoff', () => {
  const result = runSupervisedWorkerWorkflow({
    caseName: 'missing',
    correctionWorkerHandoffPath: path.join(smokeRoot, 'missing', 'worker-handoff.json'),
    outputDir: path.join(smokeRoot, 'missing-output'),
  })
  assert(result.workflowStatus === 'missing_artifacts', `status inesperado: ${result.workflowStatus}`)
})

runCase('Escritura de artefactos', () => {
  const evidenceDir = createCorrectedEvidence('write-artifacts')
  const handoffPath = createReadyHandoff('write-artifacts', evidenceDir)
  const result = runSupervisedWorkerWorkflow({
    caseName: 'write-artifacts',
    correctionWorkerHandoffPath: handoffPath,
    correctedEvidenceDir: evidenceDir,
    validationCommands: ['node --check src/planner-ui-state.js'],
    outputDir: path.join(smokeRoot, 'write-artifacts-output'),
  })
  const written = writeSupervisedWorkerWorkflowReport(path.join(smokeRoot, 'write-artifacts-output'), result)
  assert(fs.existsSync(written.reportPath), 'no escribio report')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

runCase('Output inseguro falla', () => {
  const evidenceDir = createCorrectedEvidence('unsafe-output')
  const handoffPath = createReadyHandoff('unsafe-output', evidenceDir)
  const result = runCli([
    '--worker-handoff',
    handoffPath,
    '--corrected-evidence',
    evidenceDir,
    '--output',
    'scripts/orchestrator-supervised-worker-workflow-output',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('Corrected evidence insegura falla', () => {
  const handoffPath = createReadyHandoff('unsafe-evidence', path.join(smokeRoot, 'unsafe-evidence', 'corrected-evidence'))
  const result = runCli([
    '--worker-handoff',
    handoffPath,
    '--corrected-evidence',
    'src/unsafe-corrected-evidence',
    '--output',
    path.join('.codex-temp', 'orchestrator-supervised-worker-workflow-smoke', 'unsafe-evidence-output'),
  ])
  assert(result.status !== 0, 'CLI acepto corrected evidence insegura')
})

runCase('JSON mode parseable', () => {
  const evidenceDir = createCorrectedEvidence('json-mode')
  const handoffPath = createReadyHandoff('json-mode', evidenceDir)
  const result = runCli([
    '--case',
    'json-mode',
    '--worker-handoff',
    handoffPath,
    '--corrected-evidence',
    evidenceDir,
    '--validation-preset',
    'registry-basic',
    '--output',
    path.join('.codex-temp', 'orchestrator-supervised-worker-workflow-smoke', 'json-output'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workflowStatus === 'handoff_ready', `JSON status inesperado: ${parsed.workflowStatus}`)
})

console.log('OK. Supervised Worker Workflow smoke completo.')
