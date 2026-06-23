import { MetricCard, type MetricTone } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export function PreparedModuleExpansionCard({
  title,
  description,
  statusLabel,
  statusToneClass,
  typeLabel,
  domainLabel,
  riskLabel,
  riskTone,
  projectRoot,
  affectedLayersValue,
  affectedLayersDetail,
  targetFilesValue,
  targetFilesDetail,
  affectedLayers,
  notes,
  notesTone,
  compact = false,
}: {
  title: string
  description: string
  statusLabel: string
  statusToneClass: string
  typeLabel: string
  domainLabel: string
  riskLabel: string
  riskTone: MetricTone
  projectRoot: string
  affectedLayersValue: string
  affectedLayersDetail: string
  targetFilesValue: string
  targetFilesDetail: string
  affectedLayers: string[]
  notes: string[]
  notesTone: 'amber' | 'rose'
  compact?: boolean
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Plan del módulo preparado
          </div>
          <div className="mt-2 text-base font-semibold text-white">{title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{description}</div>
        </div>
        <span
          className={joinClasses(
            'rounded-full border px-3 py-1 text-xs font-medium',
            statusToneClass,
          )}
        >
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tipo"
          value={typeLabel}
          detail={domainLabel}
          tone="sky"
        />
        <MetricCard
          label="Riesgo"
          value={riskLabel}
          detail={projectRoot}
          tone={riskTone}
        />
        <MetricCard
          label="Capas afectadas"
          value={affectedLayersValue}
          detail={affectedLayersDetail}
        />
        <MetricCard
          label="Archivos objetivo"
          value={targetFilesValue}
          detail={targetFilesDetail}
        />
      </div>
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Capas afectadas"
          items={affectedLayers}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Bloqueos o notas"
          items={notes}
          compact={compact}
          tone={notesTone}
        />
      </div>
    </div>
  )
}