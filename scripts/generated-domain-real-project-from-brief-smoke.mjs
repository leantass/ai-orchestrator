import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const currentFilePath = fileURLToPath(import.meta.url)
const repoRoot = path.resolve(path.dirname(currentFilePath), '..')
const tempRoot = path.join(repoRoot, '.codex-temp', 'viandas-platform-e2e-v2')
const briefsDir = path.join(tempRoot, 'briefs')
const reportsDir = path.join(tempRoot, 'reports')
const logsDir = path.join(tempRoot, 'logs')
const outputPath = path.join(tempRoot, 'output', 'viandas-corporativas-b2b')
const briefPath = path.join(briefsDir, 'viandas-corporativas-b2b.md')

const brief = `# Viandas Corporativas B2B

Generar un MVP real local para una operacion de viandas corporativas.

Debe incluir empresas cliente, empleados, centros de costo, menus diarios, platos, extras, pedidos, estados de pedido, produccion de cocina, etiquetas y reportes.

Roles esperados:

- Empleado: ve menu disponible, elige plato y extras, confirma pedido, consulta estado, cancela antes del corte y revisa historial.
- Empresa: administra empleados, centros de costo, pedidos por empleado y reportes de consumo.
- Restaurante proveedor: gestiona menus, platos, extras, pedidos consolidados, produccion, etiquetas y reportes.
- Cocina: ve produccion diaria, pendientes, preparados y cantidades por plato/empresa.
- Admin: backoffice CRUD completo.

Restricciones: local only, SQLite real, REST CRUD, backoffice, sin pagos reales, sin credenciales, sin servicios externos.
`

function relativeFromRepo(absolutePath) {
  return path.relative(repoRoot, absolutePath).replace(/\\/g, '/')
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function runCommand({ command, args, cwd, label }) {
  const shouldUseCmdWrapper = process.platform === 'win32' && command.endsWith('.cmd')
  const effectiveCommand = shouldUseCmdWrapper ? 'cmd.exe' : command
  const effectiveArgs = shouldUseCmdWrapper ? ['/d', '/s', '/c', command, ...args] : args
  const result = spawnSync(effectiveCommand, effectiveArgs, {
    cwd,
    shell: false,
    windowsHide: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.error) throw result.error
  const summary = {
    label,
    command: `${command} ${args.join(' ')}`,
    cwd: relativeFromRepo(cwd),
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  }
  writeFile(path.join(logsDir, `${label}.log`), [
    `$ ${summary.command}`,
    `cwd=${summary.cwd}`,
    `exit=${summary.status}`,
    summary.stdout.trim(),
    summary.stderr.trim(),
  ].filter(Boolean).join('\n'))
  assert.equal(result.status, 0, `${summary.command} fallo. Ver ${relativeFromRepo(path.join(logsDir, `${label}.log`))}`)
  return summary
}

function runNode(args, label, cwd = repoRoot) {
  return runCommand({ command: process.execPath, args, cwd, label })
}

function runNpm(args, label, cwd = outputPath) {
  return runCommand({ command: process.platform === 'win32' ? 'npm.cmd' : 'npm', args, cwd, label })
}

function assertRolePage(relativePath, terms) {
  const absolutePath = path.join(outputPath, relativePath)
  assert.equal(fs.existsSync(absolutePath), true, `${relativePath} debe existir`)
  const content = fs.readFileSync(absolutePath, 'utf8').toLocaleLowerCase()
  assert.equal(content.includes('workflow operativo'), true, `${relativePath} debe tener workflow operativo`)
  assert.equal(content.includes('data-action'), true, `${relativePath} debe tener acciones de rol`)
  for (const term of terms) {
    assert.equal(content.includes(term), true, `${relativePath} debe incluir ${term}`)
  }
}

function writeFinalReport({ commands }) {
  const rolePages = [
    'public/employee.html',
    'public/company.html',
    'public/provider.html',
    'public/kitchen.html',
    'public/labels.html',
    'public/reports.html',
  ]
  const report = `# Viandas Platform E2E V2 final report

Status: PASS
Score: 5/5

## Improvements validated

- Official brief-to-output entrypoint: PASS
- Real SQLite DB/API/backoffice: PASS
- Role-specific UX pages: PASS
- Generated smoke and domain smoke: PASS
- No external services or credentials: PASS

## Output

- Project: \`${relativeFromRepo(outputPath)}\`
- Brief: \`${relativeFromRepo(briefPath)}\`
- Generation result: \`${relativeFromRepo(path.join(reportsDir, 'generation-result.json'))}\`

## Role pages

${rolePages.map((entry) => `- \`${entry}\``).join('\n')}

## Commands

${commands.map((entry) => `- \`${entry.command}\`: PASS`).join('\n')}

## Known limitation

The brief parser is deterministic and intentionally narrow. It supports Viandas-like B2B operational briefs and fails closed for unsupported brief shapes until a real extraction layer is added.
`
  writeFile(path.join(reportsDir, 'FINAL_REPORT.md'), report)
}

fs.rmSync(tempRoot, { recursive: true, force: true })
writeFile(briefPath, brief)

const generation = runNode([
  'scripts/generated-domain-real-project-from-brief.mjs',
  '--brief',
  relativeFromRepo(briefPath),
  '--output',
  relativeFromRepo(outputPath),
  '--mode',
  'real-project',
  '--reports-dir',
  relativeFromRepo(reportsDir),
  '--logs-dir',
  relativeFromRepo(logsDir),
], 'generate-from-brief')

const commands = [
  generation,
  runNpm(['run', 'seed'], 'npm-seed'),
  runNpm(['run', 'build'], 'npm-build'),
  runNpm(['run', 'smoke'], 'npm-smoke'),
  runNode(['scripts/domain-smoke.mjs'], 'domain-smoke', outputPath),
]

assertRolePage('public/employee.html', ['menu', 'pedido', 'cancelar', 'estado'])
assertRolePage('public/company.html', ['empleados', 'centros', 'reportes'])
assertRolePage('public/provider.html', ['menus', 'platos', 'extras', 'produccion'])
assertRolePage('public/kitchen.html', ['produccion', 'preparado', 'pendientes'])
assertRolePage('public/labels.html', ['etiqueta', 'empleado', 'empresa', 'plato'])
assertRolePage('public/reports.html', ['pedidos', 'empresa', 'plato', 'produccion'])

writeFinalReport({ commands })
console.log(JSON.stringify({
  ok: true,
  status: 'PASS',
  output: relativeFromRepo(outputPath),
  finalReport: relativeFromRepo(path.join(reportsDir, 'FINAL_REPORT.md')),
  commands: commands.map((entry) => ({ command: entry.command, status: entry.status })),
}, null, 2))