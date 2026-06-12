import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'generated-domain-delivery-history-ledger-smoke')
const roundtripRoot = path.join(smokeRoot, 'roundtrips')
const ledgerCliPath = path.join(repoRoot, 'scripts', 'generated-domain-delivery-history-ledger.mjs')
const {
  buildDeliveryHistoryEntry,
  buildDeliveryHistoryLedger,
  discoverDeliveryHistoryCases,
  writeDeliveryHistoryLedger,
} = require(path.join(repoRoot, 'electron', 'generated-domain-delivery-history-ledger.cjs'))

function resetSmokeRoot() {
  if (fs.existsSync(smokeRoot)) {
    fs.rmSync(smokeRoot, { recursive: true, force: true })
  }
  fs.mkdirSync(roundtripRoot, { recursive: true })
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${value}\n`, 'utf8')
}

function issue(message, category = 'completeness', severity = 'major') {
  return {
    severity,
    category,
    message,
    evidence: message,
  }
}

function makeCase(caseName, options = {}) {
  const caseDir = path.join(roundtripRoot, caseName)
  const initialIssues = options.initialIssues || []
  const remainingIssues =
    options.remainingIssues === undefined ? initialIssues : options.remainingIssues
  const resolvedIssues = options.resolvedIssues || []
  const report = {
    roundtripStatus: options.roundtripStatus,
    initialReviewStatus: options.initialReviewStatus,
    correctionTaskStatus: options.correctionTaskStatus || '',
    followupReviewStatus: options.followupReviewStatus || '',
    initialReview: {
      status: options.initialReviewStatus,
      issues: initialIssues,
      restrictionViolations: options.initialRestrictionViolations || [],
      sandboxViolations: options.initialSandboxViolations || [],
      reviewerSummary: `${caseName} initial summary`,
    },
    correctionTask: options.correctionTask || undefined,
    followupReview: options.followupReviewStatus
      ? {
          status: options.followupReviewStatus,
          issues: remainingIssues,
          restrictionViolations: options.followupRestrictionViolations || [],
          sandboxViolations: options.followupSandboxViolations || [],
          reviewerSummary: `${caseName} followup summary`,
        }
      : undefined,
    resolvedIssues,
    remainingIssues,
    metadata: {
      mode: 'dry-run',
      initialEvidenceDir: path.join(smokeRoot, 'evidence', caseName, 'initial'),
      correctedEvidenceDir: options.correctedEvidenceDir
        ? path.join(smokeRoot, 'evidence', caseName, 'corrected')
        : '',
      projectName: caseName,
    },
  }
  writeJson(path.join(caseDir, 'delivery-roundtrip-report.json'), report)

  if (options.taskStatus) {
    writeJson(path.join(caseDir, 'correction-task', 'codex-correction-task.json'), {
      taskStatus: options.taskStatus,
      sourceReviewStatus: options.initialReviewStatus,
      title: `Task ${caseName}`,
      severity: 'major',
      issues: initialIssues,
    })
  }

  if (options.handoffStatus) {
    writeJson(path.join(caseDir, 'codex-correction-handoff.json'), {
      handoffStatus: options.handoffStatus,
      caseName,
      sourceEvidenceDir: path.join(smokeRoot, 'evidence', caseName, 'initial'),
      correctedEvidenceDir: options.correctedEvidenceDir
        ? path.join(smokeRoot, 'evidence', caseName, 'corrected')
        : '',
    })
  }

  writeText(path.join(caseDir, 'roundtrip-summary.md'), `# ${caseName}`)
  return caseDir
}

function runLedgerCli(args) {
  return spawnSync(process.execPath, [ledgerCliPath, ...args], {
    cwd: repoRoot,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
  })
}

function runJsonLedger(args) {
  const result = runLedgerCli([...args, '--json'])
  assert.equal(result.status, 0, result.stderr || result.stdout)
  return JSON.parse(result.stdout)
}

function runCase(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

resetSmokeRoot()

const missingReportCaseDir = path.join(roundtripRoot, 'missing-artifacts-case')

runCase('Fixture setup', () => {
  makeCase('completed-pass-case', {
    roundtripStatus: 'completed_pass',
    initialReviewStatus: 'needs_revision',
    correctionTaskStatus: 'ready',
    taskStatus: 'ready',
    handoffStatus: 'ready',
    followupReviewStatus: 'pass',
    initialIssues: [issue('Faltan reportes simples.')],
    remainingIssues: [],
    resolvedIssues: [issue('Faltan reportes simples.')],
    correctedEvidenceDir: true,
  })
  makeCase('no-action-needed-case', {
    roundtripStatus: 'no_action_needed',
    initialReviewStatus: 'pass',
    initialIssues: [],
    remainingIssues: [],
  })
  makeCase('awaiting-manual-correction-case', {
    roundtripStatus: 'awaiting_manual_correction',
    initialReviewStatus: 'needs_revision',
    correctionTaskStatus: 'ready',
    taskStatus: 'ready',
    handoffStatus: 'ready',
    initialIssues: [issue('Falta backend mock.')],
  })
  makeCase('needs-more-revision-case', {
    roundtripStatus: 'needs_more_revision',
    initialReviewStatus: 'needs_revision',
    correctionTaskStatus: 'ready',
    taskStatus: 'ready',
    followupReviewStatus: 'needs_revision',
    initialIssues: [issue('Falta base local.')],
    remainingIssues: [issue('Falta base local.')],
    correctedEvidenceDir: true,
  })
  makeCase('blocked-case', {
    roundtripStatus: 'blocked_requires_human',
    initialReviewStatus: 'blocked',
    correctionTaskStatus: 'blocked_requires_human',
    taskStatus: 'blocked_requires_human',
    initialIssues: [issue('Se intento escribir ../escape.txt.', 'sandbox', 'blocking')],
    initialSandboxViolations: ['../escape.txt'],
  })
  fs.mkdirSync(missingReportCaseDir, { recursive: true })
  writeText(path.join(missingReportCaseDir, 'roundtrip-summary.md'), '# Missing artifacts')
  assert.ok(fs.existsSync(roundtripRoot))
})

runCase('Casos clasificados por modulo', () => {
  const artifacts = discoverDeliveryHistoryCases([roundtripRoot])
  const entries = artifacts.map((artifact) => buildDeliveryHistoryEntry(artifact))
  const byName = new Map(entries.map((entry) => [entry.caseName, entry]))

  assert.equal(byName.get('completed-pass-case').status, 'completed_pass')
  assert.equal(byName.get('completed-pass-case').nextAction, 'archive_success_evidence')
  assert.equal(byName.get('no-action-needed-case').status, 'no_action_needed')
  assert.equal(byName.get('awaiting-manual-correction-case').status, 'awaiting_manual_correction')
  assert.equal(byName.get('awaiting-manual-correction-case').nextAction, 'run_manual_correction')
  assert.equal(byName.get('needs-more-revision-case').status, 'needs_more_revision')
  assert.equal(byName.get('blocked-case').status, 'blocked_requires_human')
  assert.equal(byName.get('blocked-case').nextAction, 'review_blocked_case')
  assert.equal(byName.get('missing-artifacts-case').status, 'missing_artifacts')
  assert.equal(byName.get('missing-artifacts-case').nextAction, 'inspect_missing_artifacts')
})

runCase('Ledger y artefactos escritos', () => {
  const artifacts = discoverDeliveryHistoryCases([roundtripRoot])
  const entries = artifacts.map((artifact) => buildDeliveryHistoryEntry(artifact))
  const ledger = buildDeliveryHistoryLedger(entries)
  const output = path.join(smokeRoot, 'outputs', 'module-ledger')
  const written = writeDeliveryHistoryLedger(output, ledger)

  assert.equal(ledger.totalCases, 6)
  assert.equal(ledger.counts.completedPass, 1)
  assert.equal(ledger.counts.awaitingManualCorrection, 1)
  assert.equal(ledger.counts.needsMoreRevision, 1)
  assert.equal(ledger.counts.blocked, 1)
  assert.equal(ledger.counts.missingArtifacts, 1)
  assert.ok(fs.existsSync(written.ledgerPath))
  assert.ok(fs.existsSync(written.summaryPath))
})

runCase('CLI JSON mode parseable', () => {
  const output = path.join(smokeRoot, 'outputs', 'cli-json')
  const result = runJsonLedger(['--root', roundtripRoot, '--output', output])
  assert.equal(result.ledger.totalCases, 6)
  assert.equal(result.ledger.counts.completedPass, 1)
  assert.ok(fs.existsSync(path.join(output, 'delivery-history-ledger.json')))
})

runCase('CLI case filter', () => {
  const output = path.join(smokeRoot, 'outputs', 'cli-filter')
  const result = runJsonLedger([
    '--root',
    roundtripRoot,
    '--case',
    'completed-pass-case',
    '--output',
    output,
  ])
  assert.equal(result.ledger.totalCases, 1)
  assert.equal(result.ledger.entries[0].caseName, 'completed-pass-case')
  assert.equal(result.ledger.entries[0].status, 'completed_pass')
})

runCase('Output inseguro bloqueado', () => {
  const unsafeOutput = path.join(repoRoot, 'scripts', 'history-ledger-smoke-output')
  const result = runLedgerCli(['--root', roundtripRoot, '--output', unsafeOutput])
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /Output inseguro/)
  assert.equal(fs.existsSync(path.join(unsafeOutput, 'delivery-history-ledger.json')), false)
})

if (process.exitCode) {
  process.exit(process.exitCode)
}
