import type { ReactNode } from 'react'

import {
  ActionTile,
  DashboardIcon,
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

  return (
    <div className="space-y-4">
      <article className="overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_70%_18%,rgba(167,139,250,0.12),transparent_20%),linear-gradient(180deg,rgba(6,11,22,0.98),rgba(8,15,28,0.9))] p-5 shadow-[0_34px_100px_rgba(0,0,0,0.42)]">
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <SurfaceHeaderTag>Inicio</SurfaceHeaderTag>
              <SurfaceHeaderTag>Executive cockpit</SurfaceHeaderTag>
              <SurfaceHeaderTag>Control operativo</SurfaceHeaderTag>
            </div>
            <div className="max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-[2.6rem]">
              {title}
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
            <div className="flex flex-wrap gap-2">
              {statusBadges.map((badge) => (
                <ResultStatusBadge
                  key={`${badge.label}-${badge.value}`}
                  label={`${badge.label}: ${badge.value}`}
                  tone={badge.tone}
                />
              ))}
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {metrics.map((metric, index) => (
                <MetricCard
                  key={`${metric.label}-${metric.value}`}
                  label={metric.label}
                  value={metric.value}
                  detail={metric.detail}
                  tone={metric.tone}
                  icon={metric.icon}
                  emphasis={index < 2 ? 'hero' : 'compact'}
                  progress={
                    index === 3
                      ? flowProgressPercent
                      : index === 2
                        ? metric.value.toLowerCase().includes('coincidencia')
                          ? 66
                          : 24
                        : undefined
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.02))] p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Mision actual
                    </div>
                    <div className="mt-2 text-sm font-semibold leading-6 text-slate-100">
                      {currentFlow ? currentFlow.label : 'Sin paso activo'}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">
                      {currentFlow?.description || 'El flujo todavia no marcó una etapa visible.'}
                    </div>
                  </div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                    <DashboardIcon name="guided" className="h-5 w-5" />
                  </div>
                </div>
                <ProgressMeter
                  label="Flujo 01-07"
                  value={flowProgressPercent}
                  tone={flowProgressPercent >= 50 ? 'emerald' : 'sky'}
                />
              </div>
            </div>

            {heroActions ? <div className="grid gap-2 sm:grid-cols-2">{heroActions}</div> : null}

            <ResultSectionCard
              title="Radar del sistema"
              description="Planner, ejecutor, memoria y aprobaciones resumidos para decidir rápido."
              icon="services"
              badge="Live"
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
            </ResultSectionCard>
          </div>
        </div>
      </article>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="space-y-4">
          <ResultSectionCard
            title="Corrida actual o mas reciente"
            description="Objetivo, instrucción, estado y señales de avance en una lectura de una sola pasada."
            icon="runs"
            badge={latestRun ? 'Activo' : 'Sin corridas'}
          >
            {latestRun ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ResultStatusBadge label={latestRun.scenario} tone="sky" />
                  <ResultStatusBadge label={latestRun.status} tone="default" />
                </div>
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-[26px] border border-white/8 bg-slate-950/55 px-4 py-4">
                    <div className="text-sm font-semibold leading-6 text-white">
                      {latestRun.objective}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">
                      {latestRun.instruction}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {latestRun.stats.map((stat) => (
                      <MetricCard
                        key={`${stat.label}-${stat.value}`}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                      />
                    ))}
                  </div>
                </div>
                {latestRun.onOpen ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ActionTile
                      label="Ver detalle de la corrida"
                      detail="Abrí el cierre completo, requestId, artefactos y señal de recuperación."
                      icon="runs"
                      tone="sky"
                      onClick={latestRun.onOpen}
                    />
                    <ActionTile
                      label="Estado operativo"
                      detail="La corrida ya se resume en clave ejecutiva sin abrir la consola técnica."
                      icon="result"
                      tone="default"
                    />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                Todavía no hay corridas ejecutadas para resumir.
              </div>
            )}
          </ResultSectionCard>

          <ResultSectionCard
            title="Vista del flujo 01-07"
            description="Panorama del recorrido guiado con una lectura más cercana a un tablero que a un wizard lineal."
            icon="guided"
            badge={`${readyFlowCount}/${flowItems.length}`}
          >
            <StepProgress items={flowItems} />
          </ResultSectionCard>
        </div>

        <div className="space-y-4">
          <ResultSectionCard
            title="Command deck"
            description="Atajos operativos para mover el sistema sin recorrer toda la pantalla."
            icon="next"
            badge={`${quickActions.length} acciones`}
          >
            <div className="grid gap-2">
              {quickActions.map((action, index) => (
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
          </ResultSectionCard>

          <ResultSectionCard
            title="Referencias activas"
            description="Workspace, proyecto, respuesta visible y apoyos listos para la sesión."
            icon="projects"
            badge="Snapshot"
          >
            <div className="grid gap-3">
              {snapshotItems.map((item, index) => (
                <MetricCard
                  key={`${item.label}-${item.value}`}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                  icon={item.icon}
                  tone={index === 0 ? 'sky' : index === 1 ? 'emerald' : 'default'}
                  emphasis={index === 0 ? 'hero' : 'compact'}
                />
              ))}
            </div>
          </ResultSectionCard>
        </div>
      </div>
    </div>
  )
}
