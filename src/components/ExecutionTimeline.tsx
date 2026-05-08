import type { ReactNode } from 'react'

import {
  DashboardIcon,
  InlineHint,
  MetricCard,
  ResultSectionCard,
  ResultStatusBadge,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

const stageIcons: AppIconName[] = ['brain', 'build', 'approval', 'result']

const stageStatusToneMap = {
  active: 'sky',
  completed: 'emerald',
  pending: 'default',
  'not-required': 'default',
  error: 'rose',
} as const satisfies Record<
  'active' | 'completed' | 'pending' | 'not-required' | 'error',
  MetricTone
>

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
    icon?: AppIconName
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
  const completedStages = stages.filter((stage) => stage.status === 'completed').length
  const activeStage = stages.find((stage) => stage.status === 'active')
  const progressPercent = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <MetricCard
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
            icon={metric.icon || (index === 0 ? 'status' : index === 1 ? 'activity' : index === 2 ? 'execution' : index === 3 ? 'runtime' : 'result')}
          />
        ))}
      </div>

      {blockedMessage ? (
        <InlineHint
          label="Bloqueo por aprobacion"
          detail={blockedMessage}
          tone="amber"
          icon="approval"
        />
      ) : null}

      <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_24%),linear-gradient(180deg,rgba(9,17,32,0.94),rgba(8,15,28,0.88))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Tablero operativo
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Analisis, materializacion, validaciones y cierre
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <ResultStatusBadge
                label={activeStage ? `${activeStage.label} activa` : 'Sin etapa activa'}
                tone={activeStage ? 'sky' : 'default'}
              />
              <span className="text-sm text-slate-400">{`${progressPercent}% del circuito completado`}</span>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        <div className="mt-4 rounded-full border border-white/8 bg-slate-950/55 p-1">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-300 transition-all"
            style={{ width: `${Math.max(progressPercent, activeStage ? 18 : 6)}%` }}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stages.map((stage, index) => (
            <div
              key={stage.label}
              className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200">
                    <DashboardIcon name={stageIcons[index] || 'flow'} className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Etapa {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">{stage.label}</div>
                  </div>
                </div>
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
                  tone={stageStatusToneMap[stage.status]}
                />
              </div>
            </div>
          ))}
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <ResultSectionCard
          title="Resultado del ejecutor"
          description="Lectura operativa del estado actual o del ultimo cierre visible."
          icon="result"
        >
          <div className="whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
            {result}
          </div>
        </ResultSectionCard>

        <ResultSectionCard
          title="Actividad reciente"
          description="Eventos utiles para seguir el avance sin entrar al detalle tecnico completo."
          icon="activity"
        >
          <div className="grid gap-2">
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
              <div className="text-sm text-slate-400">Aun no hay actividad reciente para mostrar.</div>
            )}
          </div>
        </ResultSectionCard>
      </div>
    </div>
  )
}
