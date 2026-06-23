import { MetricCard, type MetricTone } from './AppUiPrimitives'

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

type OverviewAction = {
  label: string
  tone: 'sky' | 'emerald'
  onClick: () => void
}

export function ProjectContinuityOverviewCard({
  description,
  statusLabel,
  statusToneClass,
  nextStepTitle,
  nextActionValue,
  nextActionDetail,
  nextActionTone,
  stateValue,
  stateDetail,
  stateTone,
  currentPhaseValue,
  currentPhaseDetail,
  modulesValue,
  modulesDetail,
  actions,
  busy = false,
}: {
  description: string
  statusLabel: string
  statusToneClass: string
  nextStepTitle: string
  nextActionValue: string
  nextActionDetail: string
  nextActionTone: MetricTone
  stateValue: string
  stateDetail: string
  stateTone: MetricTone
  currentPhaseValue: string
  currentPhaseDetail: string
  modulesValue: string
  modulesDetail: string
  actions: OverviewAction[]
  busy?: boolean
}) {
  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Continuidad del proyecto
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            Próximo paso recomendado
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              statusToneClass,
            )}
          >
            {statusLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {nextStepTitle}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Siguiente acción"
          value={nextActionValue}
          detail={nextActionDetail}
          tone={nextActionTone}
        />
        <MetricCard
          label="Estado"
          value={stateValue}
          detail={stateDetail}
          tone={stateTone}
        />
        <MetricCard
          label="Fase actual"
          value={currentPhaseValue}
          detail={currentPhaseDetail}
          tone="sky"
        />
        <MetricCard
          label="Módulos agregados"
          value={modulesValue}
          detail={modulesDetail}
          tone="emerald"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={busy}
            className={joinClasses(
              'rounded-full px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500',
              action.tone === 'emerald'
                ? 'border border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15'
                : 'border border-sky-300/20 bg-sky-300/10 text-sky-100 hover:bg-sky-300/15',
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </>
  )
}