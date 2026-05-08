import type { ReactNode } from 'react'

import { MetricCard, ResultStatusBadge, type MetricTone } from './AppUiPrimitives'

const joinClasses = (...tokens: Array<string | false | null | undefined>) =>
  tokens.filter(Boolean).join(' ')

export function ExecutionTimeline({
  metrics,
  stages,
  activity,
  result,
  blockedMessage,
  actions,
}: {
  metrics: Array<{
    label: string
    value: string
    detail?: string
    tone?: MetricTone
  }>
  stages: Array<{
    label: string
    status: 'active' | 'completed' | 'pending' | 'not-required' | 'error'
  }>
  activity: string[]
  result: string
  blockedMessage?: string
  actions?: ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
          />
        ))}
      </div>

      {blockedMessage ? (
        <article className="rounded-[24px] border border-amber-300/25 bg-amber-300/10 p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
            Bloqueo por aprobación
          </div>
          <div className="mt-2 text-sm leading-6 text-amber-50">{blockedMessage}</div>
        </article>
      ) : null}

      <article className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Timeline operativo
            </div>
            <div className="mt-2 text-xl font-semibold text-white">
              Análisis, materialización, validaciones y cierre
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage) => (
            <div
              key={stage.label}
              className={joinClasses(
                'rounded-2xl border px-4 py-4',
                stage.status === 'active'
                  ? 'border-cyan-300/25 bg-cyan-300/10'
                  : stage.status === 'completed'
                    ? 'border-emerald-300/20 bg-emerald-300/10'
                    : stage.status === 'error'
                      ? 'border-rose-300/20 bg-rose-300/10'
                    : stage.status === 'not-required'
                      ? 'border-white/8 bg-white/[0.03]'
                      : 'border-white/10 bg-slate-950/50',
              )}
            >
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {stage.label}
              </div>
              <div className="mt-3">
                <ResultStatusBadge
                  label={
                    stage.status === 'active'
                      ? 'Activa'
                      : stage.status === 'completed'
                        ? 'Completada'
                        : stage.status === 'error'
                          ? 'Con error'
                        : stage.status === 'not-required'
                          ? 'No requerida'
                          : 'En espera'
                  }
                  tone={
                    stage.status === 'active'
                      ? 'sky'
                      : stage.status === 'completed'
                        ? 'emerald'
                        : stage.status === 'error'
                          ? 'rose'
                        : 'default'
                  }
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Resultado del ejecutor
            </div>
            <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-slate-100">
              {result}
            </div>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Actividad reciente
            </div>
            <div className="mt-3 grid gap-2">
              {activity.length > 0 ? (
                activity.map((entry, index) => (
                  <div
                    key={`${index + 1}-${entry}`}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-slate-200"
                  >
                    {entry}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">
                  Aún no hay actividad reciente para mostrar.
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
