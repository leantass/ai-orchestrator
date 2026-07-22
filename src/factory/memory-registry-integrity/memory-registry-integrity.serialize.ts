import type { FactoryMemoryRegistryIntegrityReport, FactoryMemoryRegistryIntegritySummary } from './memory-registry-integrity.types.ts'
export function serializeFactoryMemoryRegistryIntegrityReport(report: FactoryMemoryRegistryIntegrityReport): string { return JSON.stringify(report, null, 2) }
export function parseFactoryMemoryRegistryIntegrityReport(json: string): FactoryMemoryRegistryIntegrityReport { return JSON.parse(json) as FactoryMemoryRegistryIntegrityReport }
export function summarizeFactoryMemoryRegistryIntegrityReport(report: FactoryMemoryRegistryIntegrityReport): FactoryMemoryRegistryIntegritySummary { return structuredClone(report.summary) }
