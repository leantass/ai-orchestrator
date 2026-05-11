import type { ReactNode } from 'react'

import {
  DashboardIcon,
  InlineHint,
  MetricCard,
  ProgressMeter,
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
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-5">
        {metrics.map((metric, index) => (
          <MetricCard
            key={`${metric.label}-${metric.value}`}
            label={metric.label}
            value={metric.value}
            detail={metric.detail}
            tone={metric.tone}
            icon={
              metric.icon ||
              (index === 0
                ? 'status'
                : index === 1
                  ? 'activity'
                  : index === 2
                    ? 'execution'
                    : index === 3
                      ? 'runtime'
                      : 'result')
            }
            emphasis={index < 2 ? 'hero' : 'compact'}
            progress={index === 1 ? progressPercent : undefined}
          />
        ))}
      </div>

      {blockedMessage ? (
        <InlineHint
          label="Bloqueo por aprobación"
          detail={blockedMessage}
          tone="amber"
          icon="approval"
        />
      ) : null}

      <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_72%_15%,rgba(167,139,250,0.12),transparent_18%),linear-gradient(180deg,rgba(9,17,32,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <ResultStatusBadge
                label={activeStage ? `${activeStage.label} activa` : 'Sin etapa activa'}
                tone={activeStage ? 'sky' : 'default'}
              />
              <ResultStatusBadge label="Tablero operativo" tone="violet" />
            </div>
            <div className="text-2xl font-semibold tracking-tight text-white">
              Análisis, materialización, validaciones y cierre
            </div>
            <p className="text-sm leading-6 text-slate-400">
              El flujo de ejecución se lee como monitoreo real: etapa, progreso,
              actividad reciente y CTA correcto según el estado visible.
            </p>
            <ProgressMeter
              label="Circuito de ejecución"
              value={progressPercent}
              tone={activeStage ? 'sky' : 'default'}
            />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {stages.map((stage, index) => (
                <div
                  key={stage.label}
                  className="rounded-[24px] border border-white/8 bg-slate-950/55 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] text-slate-200">
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
                  <div className="mt-4 rounded-full border border-white/8 bg-slate-950/70 p-1">
                    <div
                      className={
                        stage.status === 'completed'
                          ? 'h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-200 to-emerald-50'
                          : stage.status === 'active'
                            ? 'h-1.5 w-[62%] rounded-full bg-gradient-to-r from-sky-400 via-cyan-200 to-cyan-50'
                            : stage.status === 'error'
                              ? 'h-1.5 w-[82%] rounded-full bg-gradient-to-r from-rose-400 via-rose-200 to-rose-50'
                              : 'h-1.5 w-[18%] rounded-full bg-gradient-to-r from-slate-300/30 via-slate-200/30 to-white/35'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <ResultSectionCard
              title="Puesto de operador"
              description="Acciones visibles para ejecutar, revisar error o abrir resultado según estado."
              icon="next"
              badge="Accion"
              tone="sky"
            >
              <div className="grid gap-2">{actions}</div>
            </ResultSectionCard>

            <ResultSectionCard
              title="Actividad reciente"
              description="Eventos útiles para seguir el avance sin abrir la consola completa."
              icon="activity"
              badge={`${activity.length}`}
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
                  <div className="text-sm text-slate-400">Aún no hay actividad reciente para mostrar.</div>
                )}
              </div>
            </ResultSectionCard>
          </div>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <ResultSectionCard
          title="Resultado del ejecutor"
          description="Lectura operativa del estado actual o del último cierre visible."
          icon="result"
          badge="Output"
        >
          <div className="whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
            {result}
          </div>
        </ResultSectionCard>

        <ResultSectionCard
          title="Señal de progreso"
          description="La combinación entre estado, actividad y etapas evita vender la ejecución como completada cuando no lo está."
          icon="status"
          badge={`${progressPercent}%`}
          tone={activeStage ? 'sky' : 'default'}
        >
          <div className="grid gap-3">
            <MetricCard
              label="Etapa actual"
              value={activeStage?.label || 'Sin etapa activa'}
              detail="Si hay error o aprobación pendiente, este bloque lo vuelve explícito."
              tone={activeStage ? 'sky' : 'default'}
              icon="activity"
              emphasis="hero"
            />
            <MetricCard
              label="Progreso visible"
              value={`${progressPercent}%`}
              detail="Se calcula desde las fases completadas informadas por el tablero."
              tone={progressPercent >= 50 ? 'emerald' : 'default'}
              icon="result"
              progress={progressPercent}
            />
          </div>
        </ResultSectionCard>
      </div>
    </div>
  )
}
