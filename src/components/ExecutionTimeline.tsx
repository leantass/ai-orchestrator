import type { ReactNode } from 'react'

import {
  DisclosurePanel,
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
  const visibleMetrics = metrics.slice(0, 3)
  const supportMetrics = metrics.slice(3)
  const visibleActivity = activity.slice(0, 3)
  const hiddenActivity = activity.slice(3)
  const resultPreview = result.length > 280 ? `${result.slice(0, 280)}...` : result

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_24%),radial-gradient(circle_at_72%_15%,rgba(167,139,250,0.12),transparent_18%),linear-gradient(180deg,rgba(9,17,32,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)]">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <ResultStatusBadge
                label={activeStage ? `${activeStage.label} activa` : 'Sin etapa activa'}
                tone={activeStage ? 'sky' : 'default'}
              />
              <ResultStatusBadge label="Tablero operativo" tone="violet" />
            </div>
            <div className="text-2xl font-semibold tracking-tight text-white">
              Seguir la ejecucion sin abrir toda la consola
            </div>
            <p className="text-sm leading-6 text-slate-400">
              La vista principal prioriza estado, progreso y accion del operador. Los detalles
              largos siguen disponibles como segundo nivel.
            </p>

            {blockedMessage ? (
              <InlineHint
                label="Bloqueo por aprobacion"
                detail={blockedMessage}
                tone="amber"
                icon="approval"
              />
            ) : null}

            <div className="grid gap-3 xl:grid-cols-3">
              {visibleMetrics.map((metric, index) => (
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
                        : 'execution')
                  }
                  emphasis={index === 0 ? 'hero' : 'compact'}
                  progress={index === 1 ? progressPercent : undefined}
                />
              ))}
            </div>

            <div className="rounded-[26px] border border-white/8 bg-slate-950/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Fases visibles
                </div>
                <ResultStatusBadge label={`${progressPercent}%`} tone={activeStage ? 'sky' : 'default'} />
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {stages.map((stage, index) => (
                  <div
                    key={stage.label}
                    className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border border-white/10 bg-slate-950/60 text-slate-200">
                          <DashboardIcon name={stageIcons[index] || 'flow'} className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {String(index + 1).padStart(2, '0')}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-slate-100">{stage.label}</div>
                        </div>
                      </div>
                      <ResultStatusBadge
                        label={
                          stage.status === 'active'
                            ? 'Activa'
                            : stage.status === 'completed'
                              ? 'Lista'
                              : stage.status === 'error'
                                ? 'Error'
                                : stage.status === 'not-required'
                                  ? 'No aplica'
                                  : 'Pendiente'
                        }
                        tone={stageStatusToneMap[stage.status]}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultSectionCard
              title="Accion del operador"
              description="El CTA correcto queda arriba y visible."
              icon="next"
              badge="Accion"
              tone="sky"
            >
              <div className="grid gap-2">{actions}</div>
            </ResultSectionCard>

            <ResultSectionCard
              title="Actividad reciente"
              description="Solo los ultimos eventos utiles quedan a la vista."
              icon="activity"
              badge={`${activity.length}`}
            >
              <div className="grid gap-2">
                {visibleActivity.length > 0 ? (
                  visibleActivity.map((entry, index) => (
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
              {hiddenActivity.length > 0 ? (
                <div className="mt-4">
                  <DisclosurePanel
                    title="Ver actividad completa"
                    description="Cronologia extendida del tablero."
                    icon="activity"
                    badge={`${hiddenActivity.length} mas`}
                  >
                    <div className="grid gap-2">
                      {hiddenActivity.map((entry, index) => (
                        <div
                          key={`${index + 1}-hidden-${entry}`}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-slate-200"
                        >
                          {entry}
                        </div>
                      ))}
                    </div>
                  </DisclosurePanel>
                </div>
              ) : null}
            </ResultSectionCard>
          </div>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
        <ResultSectionCard
          title="Resultado visible"
          description="Lectura breve del estado actual o del ultimo cierre."
          icon="result"
          badge="Output"
        >
          <div className="whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
            {resultPreview}
          </div>
          {result.length > resultPreview.length ? (
            <div className="mt-4">
              <DisclosurePanel
                title="Ver salida completa"
                description="Salida extendida del ejecutor."
                icon="result"
              >
                <div className="whitespace-pre-wrap break-words rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-7 text-slate-100">
                  {result}
                </div>
              </DisclosurePanel>
            </div>
          ) : null}
        </ResultSectionCard>

        <ResultSectionCard
          title="Senal de progreso"
          description="El tablero evita vender la ejecucion como completada cuando no lo esta."
          icon="status"
          badge={`${progressPercent}%`}
          tone={activeStage ? 'sky' : 'default'}
        >
          <div className="grid gap-3">
            <MetricCard
              label="Etapa actual"
              value={activeStage?.label || 'Sin etapa activa'}
              detail="Si hay error o aprobacion pendiente, este bloque lo hace visible."
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

      {supportMetrics.length > 0 ? (
        <DisclosurePanel
          title="Ver estado extendido"
          description="Modo de ejecucion, runtime y otras senales de soporte."
          icon="services"
          badge={`${supportMetrics.length}`}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {supportMetrics.map((metric, index) => (
              <MetricCard
                key={`${metric.label}-${metric.value}`}
                label={metric.label}
                value={metric.value}
                detail={metric.detail}
                tone={metric.tone}
                icon={metric.icon || (index % 2 === 0 ? 'runtime' : 'execution')}
              />
            ))}
          </div>
        </DisclosurePanel>
      ) : null}
    </div>
  )
}
