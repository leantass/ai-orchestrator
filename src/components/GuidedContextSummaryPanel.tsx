import type { ReactNode } from 'react'

import { ContextSummaryPanel } from './ContextSummaryPanel'

type GuidedContextSummaryStep =
  | 'goal'
  | 'context'
  | 'brain'
  | 'memory'
  | 'plan'
  | 'execution'
  | 'result'

type GuidedContextSummarySections = Parameters<typeof ContextSummaryPanel>[0]['sections']

export function GuidedContextSummaryPanel({
  step,
  sections,
  actions,
}: {
  step: GuidedContextSummaryStep
  sections: GuidedContextSummarySections
  actions?: ReactNode
}) {
  return (
    <ContextSummaryPanel
      title={step === 'goal' ? 'Que sigue' : 'Panel contextual'}
      description={step === 'goal' ? '' : 'Ayuda breve, sin robar foco al paso actual.'}
      sections={sections}
      actions={actions}
    />
  )
}