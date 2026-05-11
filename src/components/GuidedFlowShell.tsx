import type { ReactNode } from 'react'

import { DisclosurePanel } from './AppUiPrimitives'
import { StepProgress, type StepProgressItem } from './StepProgress'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export function GuidedFlowShell({
  stepIndex,
  totalSteps,
  progressItems,
  children,
  footerActions,
}: {
  stepIndex: number
  totalSteps: number
  progressItems: StepProgressItem[]
  children: ReactNode
  footerActions?: ReactNode
}) {
  const completedSteps = progressItems.filter((item) => item.status === 'complete').length
  const showCompactRail = completedSteps > 0 || Boolean(footerActions)

  return (
    <section className="space-y-3">
      <div className="rounded-[28px] border border-white/10 bg-slate-950/74 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur sm:p-5">
        {children}
      </div>

      {showCompactRail ? (
        <div className="rounded-[20px] border border-white/8 bg-slate-950/64 px-4 py-3 shadow-[0_12px_34px_rgba(0,0,0,0.22)] backdrop-blur sm:px-5">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              {completedSteps > 0 ? (
                <div className="text-xs text-slate-400">{`${completedSteps} listo(s)`}</div>
              ) : null}
            </div>
            {footerActions ? (
              <div className={joinClasses('flex flex-wrap gap-3 xl:justify-end')}>{footerActions}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <DisclosurePanel
        title="Ver pasos 01 a 07"
        description="El progreso completo queda a un clic."
        icon="guided"
        badge={`${stepIndex + 1}/${totalSteps}`}
      >
        <StepProgress items={progressItems} />
      </DisclosurePanel>
    </section>
  )
}
