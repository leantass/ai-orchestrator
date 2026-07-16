import type { MarketOpportunity, RadarSignal } from './radar.types.ts'

export const RADAR_VERSION = '1.0' as const
export const RADAR_SIGNAL_STRENGTHS = ['weak', 'moderate', 'strong', 'critical'] as const
export const RADAR_DECISIONS = ['reject', 'hold', 'research_with_hermes', 'draft_factory_brief', 'needs_human_review'] as const
export const RADAR_SENSITIVE_CATEGORIES = ['finance', 'health_sensitive', 'legal_sensitive'] as const

export type RadarSignalInput = Omit<RadarSignal, 'radarVersion'>
export type MarketOpportunityInput = Omit<MarketOpportunity, 'radarVersion'>

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }

export function createRadarSignalV1(input: RadarSignalInput): RadarSignal {
  return clone({ ...input, radarVersion: RADAR_VERSION })
}

export function createMarketOpportunityV1(input: MarketOpportunityInput): MarketOpportunity {
  return clone({ ...input, radarVersion: RADAR_VERSION })
}
