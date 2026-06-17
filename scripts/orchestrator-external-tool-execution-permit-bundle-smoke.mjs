import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-execution-permit-bundle-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-execution-permit-bundle.mjs')

const {
  buildPlannedExternalWorkerTask,
  buildPlannedExternalWorkerHandoff,
  writePlannedExternalWorkerHandoff,
} = require(path.join(repoRoot, 'electron', 'orchestrator-planned-external-workers.cjs'))

const {
  buildExternalToolApprovalGate,
  writeExternalToolApprovalGate,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-approval-gates.cjs'))

const {
  buildExternalToolDryRunPlan,
  writeExternalToolDryRunPlan,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-dry-run-planner.cjs'))

const {
  buildExternalToolSupervisedExecutionRequest,
  buildExternalToolSupervisedExecutionContract,
  buildExternalToolSupervisedExecutionHandoff,
  writeExternalToolSupervisedExecutionHandoff,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-supervised-execution.cjs'))

const {
  buildExternalToolReadinessReview,
  writeExternalToolReadinessReview,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-readiness-review.cjs'))

const {
  buildExternalToolManualExecutionPacket,
  writeExternalToolManualExecutionPacket,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-manual-execution-packet.cjs'))

const {
  buildExternalToolHumanApprovalRecord,
  writeExternalToolHumanApprovalRecord,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-human-approval-record.cjs'))

const {
  buildExternalToolExecutionPermitBundle,
  writeExternalToolExecutionPermitBundle,
} = require(path.join(repoRoot, 'electron', 'orchestrator-external-tool-execution-permit-bundle.cjs'))

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
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

function completeFixture(name, overrides = {}) {
  const baseDir = path.join(smokeRoot, name)
  const capability = overrides.capability || 'asset.blender.create'
  const taskTitle = overrides.taskTitle || 'Preparar permiso externo supervisado'
  const targetProject = overrides.targetProject || 'permit bundle smoke sandbox'
  const inputArtifacts = overrides.inputArtifacts || ['approved source folder', 'approved task brief']
  const outputArtifacts = overrides.outputArtifacts || ['manual execution report', 'preview checklist']
  const targetPaths = overrides.targetPaths || ['.codex-temp', 'approved sandbox']
  const humanApproval = overrides.humanApproval !== false

  const plannedTask = buildPlannedExternalWorkerTask({
    capability,
    title: taskTitle,
    targetProject,
    targetPaths: [],
    inputArtifacts,
    outputArtifacts,
  })
  const plannedHandoff = {
    ...buildPlannedExternalWorkerHandoff(plannedTask),
    ...(overrides.plannedHandoff || {}),
  }
  const plannedWritten = writePlannedExternalWorkerHandoff(path.join(baseDir, 'planned'), plannedHandoff)

  const gate = {
    ...buildExternalToolApprovalGate({
      handoff: plannedHandoff,
      capability,
      requestedAction: taskTitle,
      targetProject,
      targetPaths,
      inputArtifacts,
      outputArtifacts,
      humanApproval,
    }),
    ...(overrides.approvalGate || {}),
  }
  const gateWritten = writeExternalToolApprovalGate(path.join(baseDir, 'gate'), gate)

  const dryRunPlan = {
    ...buildExternalToolDryRunPlan({
      approvalGate: gate,
      humanApproval,
    }),
    ...(overrides.dryRunPlan || {}),
  }
  const planWritten = writeExternalToolDryRunPlan(path.join(baseDir, 'dry-run'), dryRunPlan)

  const supervisedRequest = buildExternalToolSupervisedExecutionRequest({
    dryRunPlan,
    humanApproval,
  })
  const supervised = {
    ...buildExternalToolSupervisedExecutionHandoff(
      buildExternalToolSupervisedExecutionContract(supervisedRequest),
    ),
    ...(overrides.supervisedExecution || {}),
  }
  const supervisedWritten = writeExternalToolSupervisedExecutionHandoff(path.join(baseDir, 'supervised'), supervised)

  const review = {
    ...buildExternalToolReadinessReview({
      plannedHandoffPath: plannedWritten.handoffPath,
      approvalGatePath: gateWritten.gatePath,
      dryRunPlanPath: planWritten.planPath,
      supervisedExecutionPath: supervisedWritten.handoffPath,
      humanApproval,
    }),
    ...(overrides.readinessReview || {}),
  }
  const reviewWritten = writeExternalToolReadinessReview(path.join(baseDir, 'readiness'), review)

  const packet = {
    ...buildExternalToolManualExecutionPacket({
      readinessReviewPath: reviewWritten.reviewPath,
      operatorName: 'Lean',
    }),
    ...(overrides.manualPacket || {}),
  }
  const packetWritten = writeExternalToolManualExecutionPacket(path.join(baseDir, 'packet'), packet)

  const record = {
    ...buildExternalToolHumanApprovalRecord({
      manualExecutionPacketPath: packetWritten.packetPath,
      approverName: 'Lean',
      approverRole: 'Human Owner',
      approvalDecision: 'approved',
      approvalReason: overrides.approvalReason || 'Aprobacion controlada de smoke; no autoriza ejecucion automatica.',
      approvedScopes: overrides.approvedScopes || ['.codex-temp/permit-bundle-approved-scope'],
      approvalConditions: overrides.approvalConditions || ['no Docker, no deploy, no credenciales'],
    }),
    ...(overrides.humanApprovalRecord || {}),
  }
  const recordWritten = writeExternalToolHumanApprovalRecord(path.join(baseDir, 'approval-record'), record)

  return {
    plannedHandoffPath: plannedWritten.handoffPath,
    approvalGatePath: gateWritten.gatePath,
    dryRunPlanPath: planWritten.planPath,
    supervisedExecutionPath: supervisedWritten.handoffPath,
    readinessReviewPath: reviewWritten.reviewPath,
    manualExecutionPacketPath: packetWritten.packetPath,
    humanApprovalRecordPath: recordWritten.recordPath,
    baseDir,
    capability,
  }
}

function bundleFor(paths, overrides = {}) {
  return buildExternalToolExecutionPermitBundle({
    ...paths,
    ...overrides,
  })
}

function assertNoExecution(bundle) {
  assert(bundle.executionAllowed === false, 'bundle permitio ejecucion')
  assert(bundle.automaticExecutionAllowed === false, 'bundle permitio ejecucion automatica')
  assert(bundle.metadata.noExternalToolExecuted === true, 'bundle no declara noExternalToolExecuted')
  assert(!JSON.stringify(bundle).includes('"executionAllowed":true'), 'bundle contiene executionAllowed true')
}

resetDir(smokeRoot)

runCase('Blender bundle completo y aprobado', () => {
  const fixture = completeFixture('blender-ready')
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'ready_for_manual_supervised_execution', `status inesperado: ${bundle.permitStatus}`)
  assert(bundle.manualSupervisedExecutionCandidate === true, 'no quedo candidato manual')
  assertNoExecution(bundle)
})

runCase('Blender sin human approval usable', () => {
  const fixture = completeFixture('blender-no-human-approval', {
    humanApprovalRecord: {
      approvalStatus: 'denied',
      approvalUsable: false,
      approvalDecision: 'denied',
    },
  })
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'requires_human_approval', `status inesperado: ${bundle.permitStatus}`)
  assertNoExecution(bundle)
})

runCase('Blender con missing inputs', () => {
  const fixture = completeFixture('blender-missing-inputs', {
    readinessReview: {
      readinessStatus: 'needs_more_planning',
      missingInputs: ['asset brief'],
    },
    manualPacket: {
      packetStatus: 'needs_missing_inputs',
      missingInputs: ['asset brief'],
    },
  })
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'needs_missing_inputs', `status inesperado: ${bundle.permitStatus}`)
  assert(bundle.missingInputs.includes('asset brief'), 'no reporto missing input')
  assertNoExecution(bundle)
})

runCase('Unity bundle completo', () => {
  const fixture = completeFixture('unity-ready', {
    capability: 'unity.import.assets',
    targetPaths: ['.codex-temp', 'approved Unity sandbox branch'],
  })
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'ready_for_manual_supervised_execution', `status inesperado: ${bundle.permitStatus}`)
  assert(bundle.toolKind === 'unity', 'toolKind Unity incorrecto')
  assertNoExecution(bundle)
})

runCase('MCP bundle completo pero sin scopes', () => {
  const fixture = completeFixture('mcp-no-scopes', {
    capability: 'mcp.invoke',
    targetPaths: ['.codex-temp', 'planned MCP routing only'],
    approvedScopes: ['.codex-temp/permit-bundle-approved-scope'],
  })
  const record = readJson(fixture.humanApprovalRecordPath)
  record.approvedScopes = []
  record.approvalUsable = false
  record.invalidationReasons = []
  writeJson(fixture.humanApprovalRecordPath, record)
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'needs_missing_inputs', `status inesperado: ${bundle.permitStatus}`)
  assertNoExecution(bundle)
})

runCase('Artifact faltante', () => {
  const fixture = completeFixture('missing-artifact')
  const bundle = bundleFor({
    ...fixture,
    readinessReviewPath: path.join(smokeRoot, 'missing-review.json'),
  })
  assert(bundle.permitStatus === 'missing_artifacts', `status inesperado: ${bundle.permitStatus}`)
  assert(bundle.artifactStatus.readinessReview === 'missing', 'readiness no figura missing')
  assertNoExecution(bundle)
})

runCase('Artifact inconsistente', () => {
  const fixture = completeFixture('mismatch')
  const dryRun = readJson(fixture.dryRunPlanPath)
  dryRun.capability = 'unity.import.assets'
  dryRun.workerId = 'unity-manual-integration-worker'
  writeJson(fixture.dryRunPlanPath, dryRun)
  const bundle = bundleFor(fixture)
  assert(['invalid', 'needs_more_planning'].includes(bundle.permitStatus), `status inesperado: ${bundle.permitStatus}`)
  assert(bundle.consistencyChecks.some((item) => item.id === 'identity-consistency' && item.status === 'fail'), 'no detecto mismatch')
  assertNoExecution(bundle)
})

runCase('Accion peligrosa .env', () => {
  const fixture = completeFixture('danger-env', {
    approvedScopes: ['.codex-temp/permit-bundle-approved-scope'],
  })
  const record = readJson(fixture.humanApprovalRecordPath)
  record.approvedScopes = ['web-prueba/.env']
  writeJson(fixture.humanApprovalRecordPath, record)
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'blocked', `status inesperado: ${bundle.permitStatus}`)
  assert(bundle.blockedReasons.some((reason) => /web-prueba|env/iu.test(reason)), 'no detecto .env/web-prueba')
  assertNoExecution(bundle)
})

runCase('Accion peligrosa deploy Docker', () => {
  const fixture = completeFixture('danger-deploy', {
    targetProject: 'Hacer deploy con Docker real',
  })
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'blocked', `status inesperado: ${bundle.permitStatus}`)
  assert(bundle.blockedReasons.some((reason) => /deploy|docker/iu.test(reason)), 'no detecto deploy/Docker')
  assertNoExecution(bundle)
})

runCase('Negacion segura no bloquea', () => {
  const fixture = completeFixture('safe-negation', {
    approvalConditions: ['no Docker, no deploy, no credenciales, no crear .env'],
  })
  const bundle = bundleFor(fixture)
  assert(bundle.permitStatus === 'ready_for_manual_supervised_execution', `negacion segura bloqueo: ${bundle.permitStatus}`)
  assertNoExecution(bundle)
})

runCase('Output inseguro falla', () => {
  const fixture = completeFixture('unsafe-output')
  const result = runCli([
    '--planned-handoff',
    fixture.plannedHandoffPath,
    '--approval-gate',
    fixture.approvalGatePath,
    '--dry-run-plan',
    fixture.dryRunPlanPath,
    '--supervised-execution',
    fixture.supervisedExecutionPath,
    '--readiness-review',
    fixture.readinessReviewPath,
    '--manual-packet',
    fixture.manualExecutionPacketPath,
    '--human-approval',
    fixture.humanApprovalRecordPath,
    '--output',
    'scripts/external-tool-execution-permit-bundle-unsafe',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('JSON mode parseable', () => {
  const fixture = completeFixture('json-mode')
  const result = runCli([
    '--planned-handoff',
    fixture.plannedHandoffPath,
    '--approval-gate',
    fixture.approvalGatePath,
    '--dry-run-plan',
    fixture.dryRunPlanPath,
    '--supervised-execution',
    fixture.supervisedExecutionPath,
    '--readiness-review',
    fixture.readinessReviewPath,
    '--manual-packet',
    fixture.manualExecutionPacketPath,
    '--human-approval',
    fixture.humanApprovalRecordPath,
    '--output',
    path.join('.codex-temp', 'orchestrator-external-tool-execution-permit-bundle-smoke', 'json-output'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.permitStatus === 'ready_for_manual_supervised_execution', `JSON status inesperado: ${parsed.permitStatus}`)
  assert(parsed.executionAllowed === false, 'JSON permitio ejecucion')
})

runCase('Escritura de artefactos', () => {
  const fixture = completeFixture('write-artifacts')
  const bundle = bundleFor(fixture)
  const written = writeExternalToolExecutionPermitBundle(path.join(smokeRoot, 'bundle-artifacts'), bundle)
  assert(fs.existsSync(written.bundlePath), 'no escribio bundle JSON')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.goNoGoPath), 'no escribio go/no-go')
  assert(fs.existsSync(written.preconditionsPath), 'no escribio preconditions')
  assert(fs.existsSync(written.evidencePath), 'no escribio evidence contract')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

console.log('OK. External Tool Execution Permit Bundle smoke completo.')
