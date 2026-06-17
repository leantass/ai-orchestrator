import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')

const {
  buildExternalToolManualExecutionPacket,
  writeExternalToolManualExecutionPacket,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-manual-execution-packet.cjs'))

const {
  validateSafeOutputDir,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

function printUsage() {
  console.log(`Uso: node scripts/orchestrator-external-tool-manual-execution-packet.mjs \\
  --readiness-review <path> \\
  --output <path> \\
  [--operator <name>] \\
  [--human-approval-request <text>] \\
  [--json] \\
  [--summary]`)
}

function parseArgs(argv) {
  const options = {
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
    if (arg === '--readiness-review') {
      options.readinessReviewPath = nextValue()
      continue
    }
    if (arg === '--output') {
      options.outputDir = nextValue()
      continue
    }
    if (arg === '--operator') {
      options.operatorName = nextValue()
      continue
    }
    if (arg === '--human-approval-request') {
      options.humanApprovalRequest = nextValue()
      continue
    }
    throw new Error(`Argumento no soportado: ${arg}`)
  }
  if (!options.readinessReviewPath) {
    throw new Error('--readiness-review es obligatorio')
  }
  if (!options.outputDir) {
    throw new Error('--output es obligatorio')
  }
  return options
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv)
  const outputDir = validateSafeOutputDir(options.outputDir)
  const packet = buildExternalToolManualExecutionPacket({
    readinessReviewPath: options.readinessReviewPath,
    operatorName: options.operatorName,
    humanApprovalRequest: options.humanApprovalRequest,
  })
  const written = writeExternalToolManualExecutionPacket(outputDir, packet)
  return {
    packetStatus: written.packet.packetStatus,
    readinessStatus: written.packet.readinessStatus,
    workerId: written.packet.workerId,
    workerDisplayName: written.packet.workerDisplayName,
    capability: written.packet.capability,
    toolKind: written.packet.toolKind,
    riskLevel: written.packet.riskLevel,
    missingInputs: written.packet.missingInputs,
    missingOutputs: written.packet.missingOutputs,
    blockedReasons: written.packet.blockedReasons,
    nextAction: written.packet.goNoGoSummary,
    outputDir: written.outputDir,
    packetPath: written.packetPath,
    summaryPath: written.summaryPath,
    approvalPath: written.approvalPath,
    checklistPath: written.checklistPath,
    missingInputsPath: written.missingInputsPath,
    goNoGoPath: written.goNoGoPath,
    packet: written.packet,
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
      console.log(`${result.packetStatus}: ${result.workerId || 'no worker'} (${result.capability || 'no capability'})`)
      console.log(`manual packet: ${result.packetPath}`)
      return
    }
    console.log('External Tool Manual Execution Packet')
    console.log(`packetStatus: ${result.packetStatus}`)
    console.log(`readinessStatus: ${result.readinessStatus || '(none)'}`)
    console.log(`worker: ${result.workerId || '(none)'}`)
    console.log(`capability: ${result.capability || '(none)'}`)
    console.log(`output: ${result.packetPath}`)
  } catch (error) {
    console.error(`[external-tool-manual-execution-packet] ${error.message}`)
    process.exit(1)
  }
}

main()
