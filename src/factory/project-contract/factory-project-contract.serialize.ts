import type {
  FactoryProjectContractSummary,
  FactoryProjectContractV1,
} from './factory-project-contract.types.ts'

export function serializeFactoryProjectContractV1(contract: FactoryProjectContractV1): string {
  return JSON.stringify(contract, null, 2)
}

export function parseFactoryProjectContractV1(json: string): unknown {
  return JSON.parse(json) as unknown
}

export function summarizeFactoryProjectContractV1(
  contract: FactoryProjectContractV1,
): FactoryProjectContractSummary {
  return {
    contractVersion: contract.contractVersion,
    projectId: contract.project.projectId,
    slug: contract.project.slug,
    name: contract.project.name,
    briefId: contract.lineage.briefId,
    runId: contract.lineage.runId,
    lifecycleStatus: contract.lifecycle.lifecycleStatus,
    readiness: contract.lifecycle.readiness,
    repositoryRequired: contract.repository.repositoryRequired,
    ciRequired: contract.ci.ciRequired,
    runtimeDependsOnJefe: false,
    environmentVariables: contract.environmentVariables.map((variable) => ({
      name: variable.name,
      required: variable.required,
      secret: variable.secret,
      scope: variable.scope,
    })),
    requiredChecks: [...contract.quality.requiredChecks],
    requiredArtifacts: [...contract.evidence.requiredArtifacts],
    warnings: [...contract.lifecycle.warnings],
    risks: [...contract.lifecycle.risks],
    blockers: [...contract.lifecycle.blockers],
  }
}
