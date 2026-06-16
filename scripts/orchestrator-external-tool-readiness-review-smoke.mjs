import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'orchestrator-external-tool-readiness-review-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'orchestrator-external-tool-readiness-review.mjs')

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

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function completeFixture(name, overrides = {}) {
  const baseDir = path.join(smokeRoot, name)
  const capability = overrides.capability || 'asset.blender.create'
  const taskTitle = overrides.taskTitle || 'Planificar readiness de herramienta externa'
  const targetProject = overrides.targetProject || 'readiness smoke sandbox'
  const inputArtifacts = overrides.inputArtifacts || ['approved source asset folder', 'approved task brief']
  const outputArtifacts = overrides.outputArtifacts || ['manual execution report', 'expected preview checklist']
  const targetPaths = overrides.targetPaths || ['approved asset sandbox']
  const humanApproval = overrides.humanApproval === true

  const plannedTask = buildPlannedExternalWorkerTask({
    capability,
    title: overrides.plannedTaskTitle || taskTitle,
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
    dryRunPlan: dryRunPlan,
    humanApproval,
  })
  const supervised = {
    ...buildExternalToolSupervisedExecutionHandoff(
      buildExternalToolSupervisedExecutionContract(supervisedRequest),
    ),
    ...(overrides.supervisedExecution || {}),
  }
  const supervisedWritten = writeExternalToolSupervisedExecutionHandoff(path.join(baseDir, 'supervised'), supervised)

  return {
    plannedHandoffPath: plannedWritten.handoffPath,
    approvalGatePath: gateWritten.gatePath,
    dryRunPlanPath: planWritten.planPath,
    supervisedExecutionPath: supervisedWritten.handoffPath,
    baseDir,
    capability,
  }
}

function reviewFor(paths, overrides = {}) {
  return buildExternalToolReadinessReview({
    ...paths,
    ...overrides,
  })
}

function assertNoExecution(review) {
  assert(review.metadata.noExternalToolExecuted === true, 'review no declara noExternalToolExecuted')
  assert(!JSON.stringify(review).includes('"executionAllowed":true'), 'review contiene executionAllowed true')
}

resetDir(smokeRoot)

runCase('Blender completo sin aprobacion humana', () => {
  const fixture = completeFixture('blender-no-approval')
  const review = reviewFor(fixture)
  assert(review.readinessStatus === 'requires_human_approval', `status inesperado: ${review.readinessStatus}`)
  assert(review.workerId === 'blender-manual-asset-worker', 'worker Blender incorrecto')
  assertNoExecution(review)
})

runCase('Blender completo con aprobacion humana simulada', () => {
  const fixture = completeFixture('blender-approved', { humanApproval: true })
  const review = reviewFor(fixture, { humanApproval: true })
  assert(review.readinessStatus === 'ready_for_human_execution_approval', `status inesperado: ${review.readinessStatus}`)
  assertNoExecution(review)
})

runCase('Missing dry-run plan', () => {
  const fixture = completeFixture('missing-dry-run')
  const review = reviewFor({
    ...fixture,
    dryRunPlanPath: path.join(smokeRoot, 'missing-dry-run-plan.json'),
  })
  assert(review.readinessStatus === 'missing_artifacts', `status inesperado: ${review.readinessStatus}`)
  assert(review.artifactStatus.dryRunPlan === 'missing', 'dryRunPlan no figura missing')
  assertNoExecution(review)
})

runCase('Unity con output indefinido', () => {
  const fixture = completeFixture('unity-missing-output', {
    capability: 'unity.import.assets',
    taskTitle: 'Planificar importacion Unity con output pendiente',
    targetPaths: ['approved Unity sandbox branch/Assets'],
    outputArtifacts: ['manual Unity report'],
    humanApproval: true,
  })
  const dryRun = JSON.parse(fs.readFileSync(fixture.dryRunPlanPath, 'utf8'))
  dryRun.expectedEvidence = []
  dryRun.steps = (dryRun.steps || []).map((step) => ({ ...step, outputs: [] }))
  writeJson(fixture.dryRunPlanPath, dryRun)
  const supervised = JSON.parse(fs.readFileSync(fixture.supervisedExecutionPath, 'utf8'))
  supervised.evidenceContract = []
  supervised.executionPhases = (supervised.executionPhases || []).map((phase) => ({ ...phase, outputs: [] }))
  writeJson(fixture.supervisedExecutionPath, supervised)
  const gate = JSON.parse(fs.readFileSync(fixture.approvalGatePath, 'utf8'))
  gate.expectedEvidence = []
  writeJson(fixture.approvalGatePath, gate)
  const planned = JSON.parse(fs.readFileSync(fixture.plannedHandoffPath, 'utf8'))
  planned.expectedOutputs = []
  writeJson(fixture.plannedHandoffPath, planned)
  const review = reviewFor(fixture, { humanApproval: true })
  assert(review.readinessStatus === 'needs_more_planning', `status inesperado: ${review.readinessStatus}`)
  assert(review.missingOutputs.length > 0, 'no reporto outputs faltantes')
  assertNoExecution(review)
})

runCase('MCP con credenciales bloqueado', () => {
  const fixture = completeFixture('mcp-credentials', {
    capability: 'mcp.invoke',
    taskTitle: 'Usar credenciales reales para invocar MCP futuro',
    targetPaths: ['planned MCP routing only'],
    humanApproval: true,
  })
  const review = reviewFor(fixture, { humanApproval: true })
  assert(review.readinessStatus === 'blocked', `status inesperado: ${review.readinessStatus}`)
  assert(review.blockedReasons.some((reason) => /credenciales/iu.test(reason)), 'no detecto credenciales')
  assertNoExecution(review)
})

runCase('Accion peligrosa .env bloqueada', () => {
  const fixture = completeFixture('dangerous-env', {
    taskTitle: 'Crear .env para credenciales reales',
    humanApproval: true,
  })
  const review = reviewFor(fixture, { humanApproval: true })
  assert(review.readinessStatus === 'blocked', `status inesperado: ${review.readinessStatus}`)
  assert(review.blockedReasons.some((reason) => /env|credenciales/iu.test(reason)), 'no detecto .env')
  assertNoExecution(review)
})

runCase('Negacion segura no bloquea', () => {
  const fixture = completeFixture('safe-negation', {
    capability: 'mcp.invoke',
    plannedTaskTitle: 'Readiness manual para MCP futuro',
    taskTitle: 'Readiness manual: no Docker, no deploy, no credenciales',
    targetPaths: ['planned MCP routing only'],
    humanApproval: true,
  })
  const review = reviewFor(fixture, { humanApproval: true })
  assert(review.readinessStatus !== 'blocked', `negacion segura bloqueada: ${review.readinessStatus}`)
  assertNoExecution(review)
})

runCase('Coherencia worker capability rota', () => {
  const fixture = completeFixture('broken-coherence', { humanApproval: true })
  const dryRun = JSON.parse(fs.readFileSync(fixture.dryRunPlanPath, 'utf8'))
  dryRun.capability = 'unity.import.assets'
  dryRun.workerId = 'unity-manual-integration-worker'
  writeJson(fixture.dryRunPlanPath, dryRun)
  const review = reviewFor(fixture, { humanApproval: true })
  assert(['needs_more_planning', 'blocked'].includes(review.readinessStatus), `status inesperado: ${review.readinessStatus}`)
  assert(review.checks.some((item) => item.id === 'worker-capability-coherence' && item.status === 'fail'), 'no marco coherencia rota')
  assertNoExecution(review)
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
    '--output',
    'scripts/external-tool-readiness-unsafe',
  ])
  assert(result.status !== 0, 'CLI acepto output inseguro')
})

runCase('JSON mode parseable', () => {
  const fixture = completeFixture('json-mode', {
    capability: 'unity.import.assets',
    targetPaths: ['approved Unity sandbox branch/Assets'],
    humanApproval: true,
  })
  const result = runCli([
    '--planned-handoff',
    fixture.plannedHandoffPath,
    '--approval-gate',
    fixture.approvalGatePath,
    '--dry-run-plan',
    fixture.dryRunPlanPath,
    '--supervised-execution',
    fixture.supervisedExecutionPath,
    '--human-approval',
    '--output',
    path.join('.codex-temp', 'orchestrator-external-tool-readiness-review-smoke', 'json-output'),
    '--json',
  ])
  assert(result.status === 0, result.stderr || 'CLI JSON fallo')
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workerId === 'unity-manual-integration-worker', 'JSON worker incorrecto')
  assert(parsed.readinessStatus === 'ready_for_human_execution_approval', `JSON status inesperado: ${parsed.readinessStatus}`)
})

runCase('Escritura de artefactos', () => {
  const fixture = completeFixture('write-artifacts', { humanApproval: true })
  const review = reviewFor(fixture, { humanApproval: true })
  const written = writeExternalToolReadinessReview(path.join(smokeRoot, 'review-artifacts'), review)
  assert(fs.existsSync(written.reviewPath), 'no escribio review')
  assert(fs.existsSync(written.summaryPath), 'no escribio summary')
  assert(fs.existsSync(written.checklistPath), 'no escribio go/no-go checklist')
  assert(fs.existsSync(written.missingPath), 'no escribio missing artifacts')
  assert(fs.existsSync(written.readmePath), 'no escribio README')
})

console.log('OK. External Tool Readiness Review smoke completo.')
