import type { ReactNode } from 'react'

import { ResultStatusBadge, type MetricTone } from './AppUiPrimitives'
import { StepProgress, type StepProgressItem } from './StepProgress'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export function GuidedFlowShell({
  stepIndex,
  totalSteps,
  title,
  description,
  statusBadges,
  actionSummaryLabel,
  actionSummaryDetail,
  progressItems,
  children,
  footerNote,
  footerActions,
}: {
  stepIndex: number
  totalSteps: number
  title: string
  description: string
  statusBadges: Array<{
    label: string
    value: string
    tone?: MetricTone
  }>
  actionSummaryLabel: string
  actionSummaryDetail: string
  progressItems: StepProgressItem[]
  children: ReactNode
  footerNote: string
  footerActions: ReactNode
}) {
  return (
    <section className="space-y-4">
      <article className="rounded-[30px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
              {`Paso ${stepIndex + 1} de ${totalSteps}`}
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]">
              {title}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <div className="rounded-[24px] border border-cyan-300/15 bg-cyan-300/8 px-4 py-4 xl:max-w-[320px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/80">
              Qué sigue ahora
            </div>
            <div className="mt-2 text-sm font-semibold text-white">{actionSummaryLabel}</div>
            <div className="mt-1 text-xs leading-5 text-slate-300">{actionSummaryDetail}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {statusBadges.map((badge) => (
            <div
              key={`${badge.label}-${badge.value}`}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {badge.label}
                </span>
                <ResultStatusBadge label={badge.value} tone={badge.tone} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <StepProgress items={progressItems} />
        </div>
      </article>

      <div className="rounded-[30px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur sm:p-6">
        {children}
      </div>

      <div className="rounded-[26px] border border-white/8 bg-slate-950/60 px-4 py-4 shadow-[0_16px_50px_rgba(0,0,0,0.28)] backdrop-blur sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-sm leading-6 text-slate-400">{footerNote}</p>
          <div className={joinClasses('flex flex-wrap gap-3')}>{footerActions}</div>
        </div>
      </div>
    </section>
  )
}
