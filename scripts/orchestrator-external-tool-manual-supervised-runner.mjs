import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildManualSupervisedExecutionSession,
  writeManualSupervisedExecutionSession,
  validateManualEvidenceIntake,
  writeManualEvidenceIntake,
  loadManualSupervisedExecutionSession,
  deriveManualSupervisedExecutionStatus,
  abortManualSupervisedExecutionSession,
  summarizeManualSupervisedExecutionSession,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-manual-supervised-runner.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-manual-supervised-runner.mjs \\
  --mode <prepare|record-evidence|abort|status> \\
  [--permit-bundle <path>] \\
  [--session <path>] \\
  [--operator <name>] \\
  [--role <role>] \\
  [--evidence-dir <path>] \\
  [--notes <text>] \\
  [--output <path>] \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    mode: 'prepare',
    json: false,
    summary: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    if (arg === '--json') {
      options.json = true
      continue
    }
    if (arg === '--summary') {
      options.summary = true
      continue
    }
    const nextValue = () => {
      const value = argv[index + 1]
      if (!value || value.startsWith('--')) {
        throw new Error(`Falta valor para ${arg}`)
      }
      index += 1
      return value
    }
    if (arg === '--mode') {
      options.mode = nextValue()
      continue
    }
    if (arg === '--permit-bundle') {
      options.permitBundlePath = nextValue()
      continue
    }
    if (arg === '--session') {
      options.sessionPath = nextValue()
      continue
    }
    if (arg === '--operator') {
      options.operatorName = nextValue()
      continue
    }
    if (arg === '--role') {
      options.operatorRole = nextValue()
      continue
    }
    if (arg === '--evidence-dir') {
      options.evidenceDir = nextValue()
      continue
    }
    if (arg === '--notes') {
      options.notes = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!['prepare', 'record-evidence', 'abort', 'status'].includes(options.mode)) {
    throw new Error(`--mode no soportado: ${options.mode}`)
  }
  if (options.mode === 'prepare' && !options.permitBundlePath) {
    throw new Error('--permit-bundle es obligatorio en mode prepare')
  }
  if (['record-evidence', 'abort', 'status'].includes(options.mode) && !options.sessionPath) {
    throw new Error('--session es obligatorio para este mode')
  }
  if (['prepare', 'record-evidence', 'abort'].includes(options.mode) && !options.outputDir) {
    throw new Error('--output es obligatorio para este mode')
  }
  return options
}

function runPrepare(options) {
  const outputDir = validateSafeOutputDir(options.outputDir)
  const session = buildManualSupervisedExecutionSession({
    permitBundlePath: options.permitBundlePath,
    operatorName: options.operatorName,
    operatorRole: options.operatorRole,
    evidenceDir: options.evidenceDir,
    mode: 'prepare',
  })
  const written = writeManualSupervisedExecutionSession(outputDir, session)
  return {
    mode: 'prepare',
    sessionStatus: written.session.sessionStatus,
    executionAllowed: written.session.executionAllowed,
    automaticExecutionAllowed: written.session.automaticExecutionAllowed,
    externalToolExecutedByJefe: written.session.externalToolExecutedByJefe,
    workerId: written.session.workerId,
    capability: written.session.capability,
    toolKind: written.session.toolKind,
    permitStatus: written.session.permitStatus,
    nextAction: written.session.nextAction,
    outputDir: written.outputDir,
    sessionPath: written.sessionPath,
    runbookPath: written.runbookPath,
    session: written.session,
  }
}

function runRecordEvidence(options) {
  const outputDir = validateSafeOutputDir(options.outputDir)
  const session = loadManualSupervisedExecutionSession(options.sessionPath)
  const intake = validateManualEvidenceIntake({
    session,
    sessionPath: options.sessionPath,
    evidenceDir: options.evidenceDir,
    operatorName: options.operatorName,
    notes: options.notes,
  })
  const written = writeManualEvidenceIntake(outputDir, intake)
  return {
    mode: 'record-evidence',
    evidenceStatus: written.intake.evidenceStatus,
    externalToolExecutedByJefe: written.intake.externalToolExecutedByJefe,
    filesFound: written.intake.filesFound,
    missingExpectedEvidence: written.intake.missingExpectedEvidence,
    blockedReasons: written.intake.blockedReasons,
    nextAction: written.intake.nextAction,
    outputDir: written.outputDir,
    intakePath: written.intakePath,
    intake: written.intake,
  }
}

function runAbort(options) {
  const outputDir = validateSafeOutputDir(options.outputDir)
  const session = loadManualSupervisedExecutionSession(options.sessionPath)
  const aborted = abortManualSupervisedExecutionSession(session, options.notes)
  const written = writeManualSupervisedExecutionSession(outputDir, aborted)
  return {
    mode: 'abort',
    sessionStatus: written.session.sessionStatus,
    executionAllowed: written.session.executionAllowed,
    automaticExecutionAllowed: written.session.automaticExecutionAllowed,
    externalToolExecutedByJefe: written.session.externalToolExecutedByJefe,
    nextAction: written.session.nextAction,
    outputDir: written.outputDir,
    sessionPath: written.sessionPath,
    session: written.session,
  }
}

function runStatus(options) {
  const session = loadManualSupervisedExecutionSession(options.sessionPath)
  const result = {
    mode: 'status',
    sessionStatus: session.sessionStatus,
    derivedStatus: deriveManualSupervisedExecutionStatus(session),
    executionAllowed: session.executionAllowed,
    automaticExecutionAllowed: session.automaticExecutionAllowed,
    externalToolExecutedByJefe: session.externalToolExecutedByJefe,
    workerId: session.workerId,
    capability: session.capability,
    toolKind: session.toolKind,
    permitStatus: session.permitStatus,
    nextAction: session.nextAction,
    summary: summarizeManualSupervisedExecutionSession(session),
    session,
  }
  if (options.outputDir) {
    const outputDir = validateSafeOutputDir(options.outputDir)
    const written = writeManualSupervisedExecutionSession(outputDir, session)
    result.outputDir = written.outputDir
    result.sessionPath = written.sessionPath
  }
  return result
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  if (options.mode === 'prepare') {
    return runPrepare(options)
  }
  if (options.mode === 'record-evidence') {
    return runRecordEvidence(options)
  }
  if (options.mode === 'abort') {
    return runAbort(options)
  }
  return runStatus(options)
}

function main() {
  try {
    const result = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    if (process.argv.includes('--summary')) {
      if (result.mode === 'record-evidence') {
        console.log(`${result.evidenceStatus}: files=${result.filesFound.length} externalToolExecutedByJefe=false`)
        console.log(`evidence intake: ${result.intakePath}`)
        return
      }
      console.log(`${result.sessionStatus}: executionAllowed=false automaticExecutionAllowed=false externalToolExecutedByJefe=false`)
      console.log(`session: ${result.sessionPath || '(read-only)'}`)
      return
    }
    console.log('Manual Supervised External Execution Runner')
    console.log(`mode: ${result.mode}`)
    console.log(`status: ${result.sessionStatus || result.evidenceStatus}`)
    console.log('executionAllowed: false')
    console.log('automaticExecutionAllowed: false')
    console.log('externalToolExecutedByJefe: false')
    console.log(`nextAction: ${result.nextAction}`)
  } catch (error) {
    console.error(`[manual-supervised-runner] ${error.message}`)
    process.exit(1)
  }
}

main()
