import type { FactoryMemoryPersistenceResult, FactoryMemoryPersistenceSummary } from './memory-persistence.types.ts'
export function serializeFactoryMemoryPersistenceResult(result: FactoryMemoryPersistenceResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryMemoryPersistenceResult(json: string): FactoryMemoryPersistenceResult { return JSON.parse(json) as FactoryMemoryPersistenceResult }
export function summarizeFactoryMemoryPersistenceResult(result: FactoryMemoryPersistenceResult): FactoryMemoryPersistenceSummary { return structuredClone(result.summary) }
