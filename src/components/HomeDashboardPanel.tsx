import type { ReactNode } from 'react'

import {
  ActionTile,
  DashboardIcon,
  DisclosurePanel,
  MetricCard,
  ProgressMeter,
  ResultSectionCard,
  ResultStatusBadge,
  SurfaceHeaderTag,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'
import { StepProgress, type StepProgressItem } from './StepProgress'

export function HomeDashboardPanel({
  title,
  description,
  statusBadges,
  heroActions,
  metrics,
  latestRun,
  quickActions,
  serviceItems,
  snapshotItems,
  flowItems,
}: {
  title: string
  description: string
  statusBadges: Array<{
    label: string
    value: string
    tone?: MetricTone
  }>
  heroActions?: ReactNode
  metrics: Array<{
    label: string
    value: string
    detail?: string
    tone?: MetricTone
    icon?: AppIconName
  }>
  latestRun: {
    scenario: string
    status: string
    objective: string
    instruction: string
    stats: Array<{ label: string; value: string; icon?: AppIconName }>
    onOpen?: () => void
  } | null
  quickActions: Array<{
    label: string
    detail: string
    icon: AppIconName
    onClick: () => void
    disabled?: boolean
  }>
  serviceItems: Array<{
    label: string
    value: string
    detail?: string
    tone?: MetricTone
    icon: AppIconName
  }>
  snapshotItems: Array<{
    label: string
    value: string
    detail?: string
    icon: AppIconName
  }>
  flowItems: StepProgressItem[]
}) {
  const readyFlowCount = flowItems.filter((item) => item.status === 'complete').length
  const currentFlow = flowItems.find((item) => item.status === 'current')
  const flowProgressPercent =
    flowItems.length > 0 ? Math.round((readyFlowCount / flowItems.length) * 100) : 0
  const visibleMetrics = metrics.slice(0, 3)
  const visibleActions = quickActions.slice(0, 3)
  const extraActions = quickActions.slice(3)
  const visibleSnapshots = snapshotItems.slice(0, 2)

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_70%_18%,rgba(167,139,250,0.12),transparent_20%),linear-gradient(180deg,rgba(6,11,22,0.98),rgba(8,15,28,0.9))] p-5 shadow-[0_34px_100px_rgba(0,0,0,0.42)]">
        <div className="grid gap-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <SurfaceHeaderTag>Inicio</SurfaceHeaderTag>
              <SurfaceHeaderTag>Centro de control</SurfaceHeaderTag>
            </div>
            <div className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-[2.4rem]">
              {title}
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
            <div className="flex flex-wrap gap-2">
              {statusBadges.slice(0, 3).map((badge) => (
                <ResultStatusBadge
                  key={`${badge.label}-${badge.value}`}
                  label={`${badge.label}: ${badge.value}`}
                  tone={badge.tone}
                />
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
              {visibleMetrics.map((metric, index) => (
                <MetricCard
                  key={`${metric.label}-${metric.value}`}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                  tone={metric.tone}
                  icon={metric.icon}
                  emphasis={index === 0 ? 'hero' : 'compact'}
                  progress={index === 2 ? flowProgressPercent : undefined}
                />
              ))}
            </div>
            {heroActions ? <div className="grid gap-2 lg:grid-cols-2">{heroActions}</div> : null}
          </div>

          <div className="space-y-4">
            <ResultSectionCard
              title="Continuar ahora"
              description="JEFE pone adelante la etapa actual, la decision inmediata y el CTA de continuidad."
              icon="guided"
              badge={currentFlow ? currentFlow.label : 'Sin paso'}
              tone="sky"
            >
              <div className="space-y-4">
                <div className="rounded-[24px] border border-white/8 bg-slate-950/55 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Paso actual
                      </div>
                      <div className="mt-2 text-base font-semibold text-white">
                        {currentFlow ? currentFlow.label : 'Sin paso activo'}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-slate-400">
                        {currentFlow?.description || 'El flujo todavia no mostro una etapa visible.'}
                      </div>
                    </div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                      <DashboardIcon name="guided" className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressMeter
                      label="Progreso 01-07"
                      value={flowProgressPercent}
                      tone={flowProgressPercent >= 50 ? 'emerald' : 'sky'}
                    />
                  </div>
                </div>

                {latestRun ? (
                  <div className="rounded-[24px] border border-white/8 bg-slate-950/55 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <ResultStatusBadge label={latestRun.status} tone="default" />
                      <ResultStatusBadge label={latestRun.scenario} tone="sky" />
                    </div>
                    <div className="mt-3 text-sm font-semibold leading-6 text-white">
                      {latestRun.objective}
                    </div>
                    <div className="mt-1 text-sm leading-6 text-slate-400">{latestRun.instruction}</div>
                    {latestRun.onOpen ? (
                      <div className="mt-4">
                        <ActionTile
                          label="Ver cierre reciente"
                          detail="Abrir la corrida mas nueva con su resumen completo."
                          icon="runs"
                          tone="default"
                          onClick={latestRun.onOpen}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                    Todavia no hay corridas para resumir. El foco queda en preparar o continuar el flujo.
                  </div>
                )}
              </div>
            </ResultSectionCard>
          </div>
        </div>
      </article>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.04fr)_minmax(340px,0.96fr)]">
        <ResultSectionCard
          title="Acciones sugeridas"
          description="Solo las acciones mas utiles quedan visibles de entrada."
          icon="next"
          badge={`${quickActions.length} disponibles`}
        >
          <div className="grid gap-2">
            {visibleActions.map((action, index) => (
              <ActionTile
                key={action.label}
                label={action.label}
                detail={action.detail}
                icon={action.icon}
                tone={index === 0 ? 'sky' : index === 1 ? 'violet' : 'default'}
                onClick={action.onClick}
                disabled={action.disabled}
              />
            ))}
          </div>
          {extraActions.length > 0 ? (
            <div className="mt-4">
              <DisclosurePanel
                title="Ver mas acciones"
                description="Accesos secundarios que no necesitan dominar la home."
                icon="next"
                badge={`${extraActions.length}`}
              >
                <div className="grid gap-2">
                  {extraActions.map((action) => (
                    <ActionTile
                      key={action.label}
                      label={action.label}
                      detail={action.detail}
                      icon={action.icon}
                      tone="default"
                      onClick={action.onClick}
                      disabled={action.disabled}
                    />
                  ))}
                </div>
              </DisclosurePanel>
            </div>
          ) : null}
        </ResultSectionCard>

        <ResultSectionCard
          title="Referencias activas"
          description="Proyecto y workspace visibles sin convertir la home en una consola."
          icon="projects"
          badge="Snapshot"
        >
          <div className="grid gap-3">
            {visibleSnapshots.map((item, index) => (
              <MetricCard
                key={`${item.label}-${item.value}`}
                label={item.label}
                value={item.value}
                detail={item.detail}
                icon={item.icon}
                tone={index === 0 ? 'sky' : 'default'}
                emphasis={index === 0 ? 'hero' : 'compact'}
              />
            ))}
          </div>
        </ResultSectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DisclosurePanel
          title="Ver estado del sistema"
          description="Planner, ejecutor, memoria y aprobaciones quedan como segundo nivel."
          icon="services"
          badge={`${serviceItems.length} nodos`}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {serviceItems.map((item) => (
              <MetricCard
                key={`${item.label}-${item.value}`}
                label={item.label}
                value={item.value}
                detail={item.detail}
                tone={item.tone}
                icon={item.icon}
              />
            ))}
          </div>
        </DisclosurePanel>

        <DisclosurePanel
          title="Ver recorrido y apoyos"
          description="El flujo completo y las referencias extendidas solo aparecen cuando hacen falta."
          icon="guided"
          badge={`${readyFlowCount}/${flowItems.length}`}
        >
          <div className="space-y-4">
            <StepProgress items={flowItems} />
            <div className="grid gap-3 md:grid-cols-2">
              {snapshotItems.slice(2).map((item) => (
                <MetricCard
                  key={`${item.label}-${item.value}`}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
        </DisclosurePanel>
      </div>
    </div>
  )
}
