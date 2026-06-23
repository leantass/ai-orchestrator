import type { ReactNode } from 'react'

import { SecondaryActionButton } from './AppUiPrimitives'

type GuidedFooterActionsStep =
  | 'goal'
  | 'context'
  | 'brain'
  | 'memory'
  | 'plan'
  | 'execution'
  | 'result'

export function GuidedFooterActions({
  step,
  primaryAction,
  onBack,
}: {
  step: GuidedFooterActionsStep
  primaryAction?: ReactNode
  onBack: () => void
}) {
  const showBackButton =
    step !== 'goal' && step !== 'plan' && step !== 'execution' && step !== 'result'

  return (
    <>
      {showBackButton ? (
        <SecondaryActionButton onClick={onBack} className="sm:w-auto">
          Atrás
        </SecondaryActionButton>
      ) : null}
      {primaryAction ? <div className="sm:min-w-[220px]">{primaryAction}</div> : null}
    </>
  )
}