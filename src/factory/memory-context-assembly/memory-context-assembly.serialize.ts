import type { FactoryMemoryContextAssemblyResult, FactoryMemoryContextAssemblySummary } from './memory-context-assembly.types.ts'

export function serializeFactoryMemoryContextAssemblyResult(result: FactoryMemoryContextAssemblyResult): string { return JSON.stringify(result, null, 2) }
export function parseFactoryMemoryContextAssemblyResult(json: string): FactoryMemoryContextAssemblyResult { return JSON.parse(json) as FactoryMemoryContextAssemblyResult }
export function summarizeFactoryMemoryContextAssemblyResult(result: FactoryMemoryContextAssemblyResult): FactoryMemoryContextAssemblySummary { return { assemblyId: result.assemblyId, sourceReadRuntimeId: result.sourceReadRuntimeId, contextPurpose: result.contextPurpose, decision: result.decision, status: result.status, itemCount: result.packageCandidate?.itemCount ?? 0, approxChars: result.packageCandidate?.approxChars ?? 0, namespaces: result.packageCandidate ? [...new Set(result.packageCandidate.items.map((item) => item.namespace))] : [], canCreateCodexTask: false, canExecuteCodex: false, recommendedNextStep: result.recommendedNextStep } }

