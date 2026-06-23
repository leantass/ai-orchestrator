import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const smokeRoot = path.join(repoRoot, '.codex-temp', 'project-operations-run-envelope-smoke')
const cliPath = path.join(repoRoot, 'scripts', 'project-operations-run-envelope.mjs')

const {
  buildProjectOperationsRunEnvelope,
  loadProjectOperationsRunEnvelope,
  writeProjectOperationsRunEnvelope,
  validateProjectOperationsRunEnvelope,
} = require(path.join(repoRoot, 'electron', 'project-operations-run-envelope.cjs'))

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

function relativeToRepo(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/gu, '/')
}

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

function baseInput(overrides = {}) {
  return {
    request: {
      requestId: 'req-v18-smoke',
      objective: 'Continuar un bloque real del proyecto con validacion honesta.',
      summary: 'Smoke para run envelope',
      requestedBy: 'Lean',
      workspacePath: '.',
    },
    project: {
      projectPath: '.',
      projectKind: 'repo-existing',
      continuationMode: 'continue-existing',
      contextSources: ['openspec', 'repo-state'],
    },
    preflight: {
      gitBranch: 'main',
      gitHead: 'abcdef1',
      workingTreeStatus: 'dirty',
      ciStatus: 'unknown',
      risks: ['No tocar electron/main.cjs.'],
      summary: 'Repo real inspeccionado antes de seguir.',
    },
    routing: {
      reasoningProvider: 'local-rules',
      executionPath: 'local',
      requiresOpenAI: false,
      requiresHumanApproval: false,
      selectedWorkerId: '',
      capability: 'project.loop',
      rationale: 'Trabajo local y acotado.',
    },
    execution: {
      status: 'not_started',
      executionMode: 'local',
      workerId: '',
      capability: 'project.loop',
      outputArtifacts: [],
      validationCommands: ['node --check electron/project-operations-run-envelope.cjs'],
      blockerReason: '',
      externalToolExecutedByJefe: false,
    },
    validation: {
      status: 'unknown',
      ciStatus: 'unknown',
      commands: ['node scripts/project-operations-run-envelope-smoke.mjs'],
      evidence: [],
      summary: '',
    },
    review: {
      status: 'pending',
      reviewer: 'Lean',
      summary: '',
      blockerReason: '',
    },
    revisionLoop: {
      retryCount: 0,
      maxRetries: 3,
      nextAction: '',
      blockerReason: '',
    },
    history: {
      previousState: 'planned',
      transitionReason: 'Smoke setup',
      relatedArtifacts: [],
    },
    metadata: {
      notes: 'smoke',
      sourcePaths: ['openspec/changes/v1-8-project-operations-loop/implementation-map.md'],
      noExternalToolExecuted: true,
    },
    ...overrides,
  }
}

resetDir(smokeRoot)

runCase('Deriva requires_human_approval', () => {
  const envelope = buildProjectOperationsRunEnvelope(baseInput({
    routing: {
      reasoningProvider: 'local-rules',
      executionPath: 'human-approval',
      requiresOpenAI: false,
      requiresHumanApproval: true,
      selectedWorkerId: '',
      capability: 'project.loop',
      rationale: 'Hay gating humano.',
    },
  }))
  assert(envelope.workState === 'requires_human_approval', `state inesperado: ${envelope.workState}`)
})

runCase('Deriva requires_openai', () => {
  const envelope = buildProjectOperationsRunEnvelope(baseInput({
    routing: {
      reasoningProvider: 'local-rules',
      executionPath: 'none',
      requiresOpenAI: true,
      requiresHumanApproval: false,
      selectedWorkerId: '',
      capability: 'project.loop',
      rationale: 'Hace falta juicio avanzado.',
    },
  }))
  assert(envelope.workState === 'requires_openai', `state inesperado: ${envelope.workState}`)
})

runCase('Deriva running_codex_worker', () => {
  const envelope = buildProjectOperationsRunEnvelope(baseInput({
    routing: {
      reasoningProvider: 'local-rules',
      executionPath: 'codex-worker',
      requiresOpenAI: false,
      requiresHumanApproval: false,
      selectedWorkerId: 'codex.patch.worker',
      capability: 'project.loop',
      rationale: 'Codex worker acotado.',
    },
    execution: {
      status: 'running',
      executionMode: 'codex_worker',
      workerId: 'codex.patch.worker',
      capability: 'project.loop',
      outputArtifacts: ['.codex-temp/project-operations-run-envelope-smoke/worker-output.txt'],
      validationCommands: ['npm run lint'],
      blockerReason: '',
      externalToolExecutedByJefe: false,
    },
  }))
  assert(envelope.workState === 'running_codex_worker', `state inesperado: ${envelope.workState}`)
})

runCase('Deriva blocked_after_retries', () => {
  const envelope = buildProjectOperationsRunEnvelope(baseInput({
    validation: {
      status: 'failed',
      ciStatus: 'unknown',
      commands: ['npm run lint'],
      evidence: [],
      summary: 'Persisten fallas.',
    },
    review: {
      status: 'needs_revision',
      reviewer: 'Lean',
      summary: 'El resultado sigue corto.',
      blockerReason: 'Se agoto el presupuesto de correccion.',
    },
    revisionLoop: {
      retryCount: 3,
      maxRetries: 3,
      nextAction: '',
      blockerReason: 'Se agoto el presupuesto de correccion.',
    },
  }))
  assert(envelope.workState === 'blocked_after_retries', `state inesperado: ${envelope.workState}`)
})

runCase('Write and load keeps accepted state', () => {
  const envelope = buildProjectOperationsRunEnvelope(baseInput({
    validation: {
      status: 'passed',
      ciStatus: 'success',
      commands: ['npm run build'],
      evidence: ['.codex-temp/project-operations-run-envelope-smoke/build.log'],
      summary: 'Build y checks verdes.',
    },
    review: {
      status: 'accepted',
      reviewer: 'Lean',
      summary: 'Aprobado para cierre.',
      blockerReason: '',
    },
  }))
  const written = writeProjectOperationsRunEnvelope(
    path.join('.codex-temp', 'project-operations-run-envelope-smoke', 'written'),
    envelope,
  )
  const loaded = loadProjectOperationsRunEnvelope(relativeToRepo(written.envelopePath))
  assert(fs.existsSync(written.summaryPath), 'summaryPath faltante')
  assert(loaded.workState === 'accepted', `state cargado inesperado: ${loaded.workState}`)
})

runCase('Validation reports missing objective', () => {
  const envelope = buildProjectOperationsRunEnvelope(baseInput({
    request: {
      requestId: 'req-v18-smoke-missing',
      objective: '',
      summary: '',
      requestedBy: 'Lean',
      workspacePath: '.',
    },
  }))
  const issues = validateProjectOperationsRunEnvelope(envelope)
  assert(issues.some((issue) => issue.includes('request.objective o request.summary')), 'No detecto objective faltante')
})

runCase('CLI build writes parseable JSON', () => {
  const inputPath = path.join(smokeRoot, 'cli-build-input.json')
  writeJson(inputPath, baseInput({
    routing: {
      reasoningProvider: 'local-rules',
      executionPath: 'codex-worker',
      requiresOpenAI: false,
      requiresHumanApproval: false,
      selectedWorkerId: 'codex.patch.worker',
      capability: 'project.loop',
      rationale: 'CLI build path.',
    },
    execution: {
      status: 'pending',
      executionMode: 'codex_worker',
      workerId: 'codex.patch.worker',
      capability: 'project.loop',
      outputArtifacts: [],
      validationCommands: ['npm run lint'],
      blockerReason: '',
      externalToolExecutedByJefe: false,
    },
  }))
  const result = runCli([
    '--mode', 'build',
    '--input', relativeToRepo(inputPath),
    '--output', '.codex-temp/project-operations-run-envelope-smoke/cli-build-output',
    '--json',
  ])
  assert(result.status === 0, `CLI build fallo: ${result.stderr}`)
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workState === 'running_codex_worker', `state CLI inesperado: ${parsed.workState}`)
  assert(parsed.envelopePath.includes('project-operations-run-envelope.json'), 'envelopePath inesperado')
})

runCase('CLI status reads written envelope', () => {
  const envelope = buildProjectOperationsRunEnvelope(baseInput({
    routing: {
      reasoningProvider: 'local-rules',
      executionPath: 'human-approval',
      requiresOpenAI: false,
      requiresHumanApproval: true,
      selectedWorkerId: '',
      capability: 'project.loop',
      rationale: 'CLI status path.',
    },
  }))
  const written = writeProjectOperationsRunEnvelope(
    path.join('.codex-temp', 'project-operations-run-envelope-smoke', 'cli-status'),
    envelope,
  )
  const result = runCli([
    '--mode', 'status',
    '--envelope', relativeToRepo(written.envelopePath),
    '--json',
  ])
  assert(result.status === 0, `CLI status fallo: ${result.stderr}`)
  const parsed = JSON.parse(result.stdout)
  assert(parsed.workState === 'requires_human_approval', `state CLI inesperado: ${parsed.workState}`)
})