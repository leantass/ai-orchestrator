import {
  FACTORY_PROJECT_CONTRACT_KIND,
  FACTORY_PROJECT_CONTRACT_VERSION,
  FACTORY_PROJECT_SCHEMA_VERSION,
} from './factory-project-contract.defaults.ts'
import type {
  FactoryProjectContractV1,
  FactoryProjectContractValidationResult,
} from './factory-project-contract.types.ts'

type UnknownRecord = Record<string, unknown>

const FORBIDDEN_ACTUAL_PATH_SEGMENTS = new Set([
  '.env',
  '.git',
  'node_modules',
  'web-prueba',
])

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function requireText(
  record: UnknownRecord,
  key: string,
  path: string,
  errors: string[],
): void {
  if (!hasText(record[key])) errors.push(`${path}.${key} es obligatorio.`)
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function validateProjectPath(label: string, value: unknown, errors: string[]): void {
  if (!hasText(value)) {
    errors.push(`${label} es obligatorio.`)
    return
  }

  const normalized = value.replaceAll('\\', '/').trim()
  const segments = normalized.split('/').filter(Boolean)
  if (/^[a-z]:\//iu.test(normalized) || normalized.startsWith('/')) {
    errors.push(`${label} debe ser relativo y portable.`)
  }
  if (segments.includes('..')) errors.push(`${label} no puede contener path traversal.`)
  if (segments.some((segment) => FORBIDDEN_ACTUAL_PATH_SEGMENTS.has(segment.toLowerCase()))) {
    errors.push(`${label} apunta a una ruta protegida.`)
  }
  if (normalized.toLowerCase().includes('ai-orchestrator/electron')) {
    errors.push(`${label} no puede apuntar a internals de JEFE.`)
  }
}

function validateEnvironmentVariables(value: unknown, errors: string[], warnings: string[]): void {
  if (!Array.isArray(value)) {
    errors.push('environmentVariables debe ser una lista.')
    return
  }

  const names = new Set<string>()
  value.forEach((entry, index) => {
    const variable = asRecord(entry)
    const path = `environmentVariables[${index}]`
    requireText(variable, 'name', path, errors)
    requireText(variable, 'scope', path, errors)
    requireText(variable, 'description', path, errors)

    if (Object.hasOwn(variable, 'value')) errors.push(`${path} no puede contener value.`)
    if (variable.secret === true && hasText(variable.exampleSafeValue)) {
      errors.push(`${path} no puede incluir exampleSafeValue cuando secret=true.`)
    }
    if (hasText(variable.name)) {
      if (!/^[A-Z][A-Z0-9_]*$/u.test(variable.name)) {
        warnings.push(`${path}.name no sigue el formato MAYUSCULAS_CON_GUIONES_BAJOS.`)
      }
      if (names.has(variable.name)) errors.push(`${path}.name esta duplicado.`)
      names.add(variable.name)
    }
  })
}

export function validateFactoryProjectContractV1(
  value: unknown,
): FactoryProjectContractValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!isRecord(value)) {
    return { ok: false, errors: ['El contrato debe ser un objeto JSON.'], warnings }
  }

  if (value.contractVersion !== FACTORY_PROJECT_CONTRACT_VERSION) {
    errors.push(`contractVersion debe ser ${FACTORY_PROJECT_CONTRACT_VERSION}.`)
  }
  if (value.contractKind !== FACTORY_PROJECT_CONTRACT_KIND) {
    errors.push(`contractKind debe ser ${FACTORY_PROJECT_CONTRACT_KIND}.`)
  }
  if (value.schemaVersion !== FACTORY_PROJECT_SCHEMA_VERSION) {
    errors.push(`schemaVersion debe ser ${FACTORY_PROJECT_SCHEMA_VERSION}.`)
  }
  requireText(value, 'createdAt', 'contract', errors)

  const project = asRecord(value.project)
  requireText(project, 'projectId', 'project', errors)
  requireText(project, 'slug', 'project', errors)
  requireText(project, 'name', 'project', errors)

  const lineage = asRecord(value.lineage)
  requireText(lineage, 'briefId', 'lineage', errors)
  requireText(lineage, 'runId', 'lineage', errors)
  if (lineage.generatedBy !== 'JEFE') errors.push('lineage.generatedBy debe ser JEFE.')

  const independence = asRecord(value.independence)
  if (independence.runtimeDependsOnJefe !== false) {
    errors.push('independence.runtimeDependsOnJefe debe ser false.')
  }
  if (independence.mustUseOwnRepository !== true) {
    warnings.push('independence.mustUseOwnRepository deberia ser true.')
  }
  if (independence.mustHaveOwnRoot !== true) {
    errors.push('independence.mustHaveOwnRoot debe ser true.')
  }

  const memory = asRecord(value.memory)
  requireText(memory, 'memoryNamespace', 'memory', errors)
  requireText(memory, 'projectMemoryNamespace', 'memory', errors)

  const paths = asRecord(value.paths)
  validateProjectPath('paths.plannedOutputRoot', paths.plannedOutputRoot, errors)
  validateProjectPath('paths.evidenceRoot', paths.evidenceRoot, errors)
  validateProjectPath('paths.runArtifactsRoot', paths.runArtifactsRoot, errors)

  const security = asRecord(value.security)
  if (security.approvalRequiredForExternalCalls !== true) {
    errors.push('security.approvalRequiredForExternalCalls debe ser true.')
  }
  if (security.approvalRequiredForDeploy !== true) {
    errors.push('security.approvalRequiredForDeploy debe ser true.')
  }

  const approvals = asRecord(value.approvals)
  if (approvals.codexSelfApprovalAllowed !== false) {
    errors.push('approvals.codexSelfApprovalAllowed debe ser false.')
  }
  if (approvals.humanApprovalRequired !== true) {
    warnings.push('approvals.humanApprovalRequired deberia ser true en v1.')
  }

  const evidence = asRecord(value.evidence)
  if (asArray(evidence.requiredArtifacts).length === 0) {
    errors.push('evidence.requiredArtifacts no puede estar vacio.')
  }

  const repository = asRecord(value.repository)
  if (repository.repositoryRequired === true) {
    requireText(repository, 'provider', 'repository', errors)
    requireText(repository, 'owner', 'repository', errors)
    requireText(repository, 'repoName', 'repository', errors)
    requireText(repository, 'defaultBranch', 'repository', errors)
  }

  const ci = asRecord(value.ci)
  if (ci.ciRequired === true) {
    requireText(ci, 'provider', 'ci', errors)
    if (asArray(ci.requiredWorkflows).length === 0) {
      warnings.push('ci.requiredWorkflows esta vacio aunque ciRequired=true.')
    }
  }

  validateEnvironmentVariables(value.environmentVariables, errors, warnings)

  return { ok: errors.length === 0, errors, warnings }
}

export function isFactoryProjectContractV1(value: unknown): value is FactoryProjectContractV1 {
  return validateFactoryProjectContractV1(value).ok
}
