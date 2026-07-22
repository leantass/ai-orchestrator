import type { FactoryMemoryRegistryIndex, FactoryMemoryRegistryQueryResult, FactoryMemoryRegistrySummary } from './memory-registry.types.ts'
export function serializeFactoryMemoryRegistryIndex(index: FactoryMemoryRegistryIndex): string { return JSON.stringify(index, null, 2) }
export function parseFactoryMemoryRegistryIndex(json: string): FactoryMemoryRegistryIndex { return JSON.parse(json) as FactoryMemoryRegistryIndex }
export function summarizeFactoryMemoryRegistryIndex(index: FactoryMemoryRegistryIndex): FactoryMemoryRegistrySummary { return structuredClone(index.summary) }
export function serializeFactoryMemoryRegistryQueryResult(result: FactoryMemoryRegistryQueryResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryMemoryRegistryQueryResult(json: string): FactoryMemoryRegistryQueryResult { return JSON.parse(json) as FactoryMemoryRegistryQueryResult }
export function summarizeFactoryMemoryRegistryQueryResult(result: FactoryMemoryRegistryQueryResult): FactoryMemoryRegistryQueryResult['summary'] { return structuredClone(result.summary) }
