import type { ReactNode } from 'react'

import {
  DashboardIcon,
  MetricCard,
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
  return (
    <div className="space-y-6">
      <article className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_25%),linear-gradient(180deg,rgba(6,11,22,0.96),rgba(8,15,28,0.9))] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <SurfaceHeaderTag>Inicio</SurfaceHeaderTag>
              <SurfaceHeaderTag>Control operativo</SurfaceHeaderTag>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {statusBadges.map((badge) => (
                <ResultStatusBadge
                  key={`${badge.label}-${badge.value}`}
                  label={`${badge.label}: ${badge.value}`}
                  tone={badge.tone}
                />
              ))}
            </div>
          </div>
          {heroActions ? <div className="flex flex-wrap gap-2">{heroActions}</div> : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={`${metric.label}-${metric.value}`}
              label={metric.label}
              value={metric.value}
              detail={metric.detail}
              tone={metric.tone}
              icon={metric.icon}
            />
          ))}
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="space-y-4">
          <ResultSectionCard
            title="Corrida actual o mas reciente"
            description="Estado de trabajo, objetivo resumido y lectura rapida del ultimo cierre."
            icon="runs"
          >
            {latestRun ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ResultStatusBadge label={latestRun.scenario} tone="sky" />
                  <ResultStatusBadge label={latestRun.status} tone="default" />
                </div>
                <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4">
                  <div className="text-sm font-semibold leading-6 text-white">{latestRun.objective}</div>
                  <div className="mt-2 text-sm leading-6 text-slate-300">{latestRun.instruction}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {latestRun.stats.map((stat) => (
                    <MetricCard
                      key={`${stat.label}-${stat.value}`}
                      label={stat.label}
                      value={stat.value}
                      icon={stat.icon}
                    />
                  ))}
                </div>
                {latestRun.onOpen ? (
                  <button
                    type="button"
                    onClick={latestRun.onOpen}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    Ver detalle de la corrida
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                Todavia no hay corridas ejecutadas para resumir.
              </div>
            )}
          </ResultSectionCard>

          <ResultSectionCard
            title="Vista rapida del flujo 01-07"
            description="Panorama del recorrido guiado con acceso directo a cada etapa."
            icon="guided"
          >
            <StepProgress items={flowItems} />
          </ResultSectionCard>
        </div>

        <div className="space-y-4">
          <ResultSectionCard
            title="Quick actions"
            description="Atajos para mover el sistema sin recorrer toda la pantalla."
            icon="next"
          >
            <div className="grid gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="rounded-[22px] border border-white/8 bg-slate-950/50 px-4 py-4 text-left transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200">
                      <DashboardIcon name={action.icon} className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{action.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-400">{action.detail}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ResultSectionCard>

          <ResultSectionCard
            title="Servicios y plataforma"
            description="Planner, ejecucion, memoria y espacio operativo leidos como tablero."
            icon="services"
          >
            <div className="grid gap-3">
              {serviceItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-white/8 bg-slate-950/50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200">
                        <DashboardIcon name={item.icon} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white">{item.label}</div>
                        {item.detail ? (
                          <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                        ) : null}
                      </div>
                    </div>
                    <ResultStatusBadge label={item.value} tone={item.tone} />
                  </div>
                </div>
              ))}
            </div>
          </ResultSectionCard>

          <ResultSectionCard
            title="Referencias activas"
            description="Workspace, proyecto, memoria y otros apoyos visibles desde Inicio."
            icon="projects"
          >
            <div className="grid gap-2">
              {snapshotItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[22px] border border-white/8 bg-slate-950/50 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200">
                      <DashboardIcon name={item.icon} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                        {item.value}
                      </div>
                      {item.detail ? (
                        <div className="mt-1 text-xs leading-5 text-slate-400">{item.detail}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ResultSectionCard>
        </div>
      </div>
    </div>
  )
}
