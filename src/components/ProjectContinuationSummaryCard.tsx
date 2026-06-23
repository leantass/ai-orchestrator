import { MetricCard, type MetricTone } from './AppUiPrimitives'

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export function ProjectContinuationSummaryCard({
  operatorMessage,
  nextStepReason,
  statusLabel,
  statusToneClass,
  nextStepTitle,
  projectStatusLabel,
  projectStatusValue,
  currentPhaseLabel,
  projectStatusTone,
  completedPhasesValue,
  completedPhasesDetail,
  pendingPhasesValue,
  pendingPhasesDetail,
  pendingPhasesTone,
  modulesValue,
  modulesDetail,
  prepareLabel,
  onPrepare,
  materializeLabel,
  onMaterialize,
  busy = false,
}: {
  operatorMessage: string
  nextStepReason: string
  statusLabel: string
  statusToneClass: string
  nextStepTitle: string
  projectStatusLabel: string
  projectStatusValue: string
  currentPhaseLabel: string
  projectStatusTone: MetricTone
  completedPhasesValue: string
  completedPhasesDetail: string
  pendingPhasesValue: string
  pendingPhasesDetail: string
  pendingPhasesTone: MetricTone
  modulesValue: string
  modulesDetail: string
  prepareLabel?: string
  onPrepare?: () => void
  materializeLabel?: string
  onMaterialize?: () => void
  busy?: boolean
}) {
  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Centro de continuidad
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            Próximo paso recomendado
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{operatorMessage}</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">{nextStepReason}</div>
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
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {projectStatusLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estado del proyecto"
          value={projectStatusValue}
          detail={currentPhaseLabel}
          tone={projectStatusTone}
        />
        <MetricCard
          label="Ya completado"
          value={completedPhasesValue}
          detail={completedPhasesDetail}
          tone="sky"
        />
        <MetricCard
          label="Falta resolver"
          value={pendingPhasesValue}
          detail={pendingPhasesDetail}
          tone={pendingPhasesTone}
        />
        <MetricCard
          label="Módulos del proyecto"
          value={modulesValue}
          detail={modulesDetail}
          tone="emerald"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {prepareLabel && onPrepare ? (
          <button
            type="button"
            onClick={onPrepare}
            disabled={busy}
            className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            {prepareLabel}
          </button>
        ) : null}
        {materializeLabel && onMaterialize ? (
          <button
            type="button"
            onClick={onMaterialize}
            disabled={busy}
            className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            {materializeLabel}
          </button>
        ) : null}
      </div>
    </>
  )
}