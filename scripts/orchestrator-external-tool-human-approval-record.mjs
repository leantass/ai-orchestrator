import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildExternalToolHumanApprovalRecord,
  writeExternalToolHumanApprovalRecord,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-human-approval-record.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-human-approval-record.mjs \\
  --packet <path> \\
  --approver <name> \\
  [--role <role>] \\
  --decision <approved|denied|draft|revoked|expired> \\
  [--reason <text>] \\
  [--approved-scope <path>]... \\
  [--approved-input <path>]... \\
  [--approved-output <path>]... \\
  [--condition <text>]... \\
  [--expires-at <iso-date>] \\
  --output <path> \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
    json: false,
    summary: false,
    approvedScopes: [],
    approvedInputs: [],
    approvedOutputs: [],
    approvalConditions: [],
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
    if (arg === '--packet') {
      options.manualExecutionPacketPath = nextValue()
      continue
    }
    if (arg === '--approver') {
      options.approverName = nextValue()
      continue
    }
    if (arg === '--role') {
      options.approverRole = nextValue()
      continue
    }
    if (arg === '--decision') {
      options.approvalDecision = nextValue()
      continue
    }
    if (arg === '--reason') {
      options.approvalReason = nextValue()
      continue
    }
    if (arg === '--approved-scope') {
      options.approvedScopes.push(nextValue())
      continue
    }
    if (arg === '--approved-input') {
      options.approvedInputs.push(nextValue())
      continue
    }
    if (arg === '--approved-output') {
      options.approvedOutputs.push(nextValue())
      continue
    }
    if (arg === '--condition') {
      options.approvalConditions.push(nextValue())
      continue
    }
    if (arg === '--expires-at') {
      options.expiration = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!options.manualExecutionPacketPath) {
    throw new Error('--packet es obligatorio')
  }
  if (!options.approverName) {
    throw new Error('--approver es obligatorio')
  }
  if (!options.approvalDecision) {
    throw new Error('--decision es obligatorio')
  }
  if (!options.outputDir) {
    throw new Error('--output es obligatorio')
  }
  return options
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const outputDir = validateSafeOutputDir(options.outputDir)
  const record = buildExternalToolHumanApprovalRecord(options)
  const written = writeExternalToolHumanApprovalRecord(outputDir, record)
  return {
    approvalStatus: written.record.approvalStatus,
    approvalUsable: written.record.approvalUsable,
    executionAuthorized: written.record.executionAuthorized,
    workerId: written.record.workerId,
    workerDisplayName: written.record.workerDisplayName,
    capability: written.record.capability,
    toolKind: written.record.toolKind,
    approver: written.record.approver,
    approvalDecision: written.record.approvalDecision,
    invalidationReasons: written.record.invalidationReasons,
    nextAction: written.record.nextAction,
    outputDir: written.outputDir,
    recordPath: written.recordPath,
    summaryPath: written.summaryPath,
    approvedScopePath: written.approvedScopePath,
    conditionsPath: written.conditionsPath,
    nextActionPath: written.nextActionPath,
    record: written.record,
  }
}

function main() {
  try {
    const result = run()
    if (process.argv.includes('--json')) {
      console.log(JSON.stringify(result, null, 2))
      return
    }
    if (process.argv.includes('--summary')) {
      console.log(`${result.approvalStatus}: usable=${result.approvalUsable ? 'true' : 'false'} executionAuthorized=false`)
      console.log(`human approval record: ${result.recordPath}`)
      return
    }
    console.log('External Tool Human Approval Record')
    console.log(`approvalStatus: ${result.approvalStatus}`)
    console.log(`approvalUsable: ${result.approvalUsable ? 'true' : 'false'}`)
    console.log('executionAuthorized: false')
    console.log(`worker: ${result.workerId || '(none)'}`)
    console.log(`capability: ${result.capability || '(none)'}`)
    console.log(`output: ${result.recordPath}`)
  } catch (error) {
    console.error(`[external-tool-human-approval-record] ${error.message}`)
    process.exit(1)
  }
}

main()
