import type { FactoryContractRegistryIntegrityReport, FactoryContractRegistryIntegritySummary } from './contract-registry-integrity.types.ts'
export function serializeFactoryContractRegistryIntegrityReport(report: FactoryContractRegistryIntegrityReport): string { return JSON.stringify(report, null, 2) }
export function parseFactoryContractRegistryIntegrityReport(json: string): FactoryContractRegistryIntegrityReport { return JSON.parse(json) as FactoryContractRegistryIntegrityReport }
export function summarizeFactoryContractRegistryIntegrityReport(report: FactoryContractRegistryIntegrityReport): FactoryContractRegistryIntegritySummary { return structuredClone(report.summary) }
