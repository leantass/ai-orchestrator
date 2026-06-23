import { MetricCard, type MetricTone } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export function ApprovalRequestPanel({
  title,
  operatorMessage,
  areaSummary,
  statusLabel,
  statusToneClass,
  riskLabel,
  riskTone,
  riskDetail,
  approvalAreasValue,
  approvalAreasDetail,
  safeAlternativeValue,
  safeAlternativeDetail,
  stateValue,
  stateDetail,
  touchedAreas,
  untouchedAreas,
  validationItems,
  warningItems,
  footerMessage,
  compact = false,
  busy = false,
  onPrepare,
}: {
  title: string
  operatorMessage: string
  areaSummary: string
  statusLabel: string
  statusToneClass: string
  riskLabel: string
  riskTone: MetricTone
  riskDetail: string
  approvalAreasValue: string
  approvalAreasDetail: string
  safeAlternativeValue: string
  safeAlternativeDetail: string
  stateValue: string
  stateDetail: string
  touchedAreas: string[]
  untouchedAreas: string[]
  validationItems: string[]
  warningItems: string[]
  footerMessage: string
  compact?: boolean
  busy?: boolean
  onPrepare?: () => void
}) {
  return (
    <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Requiere aprobación
          </div>
          <div className="mt-2 text-base font-semibold text-white">{title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{operatorMessage}</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">{areaSummary}</div>
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
            {riskLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Riesgo"
          value={riskLabel}
          detail={riskDetail}
          tone={riskTone}
        />
        <MetricCard
          label="Qué se aprobaría"
          value={approvalAreasValue}
          detail={approvalAreasDetail}
          tone="amber"
        />
        <MetricCard
          label="Alternativa segura"
          value={safeAlternativeValue}
          detail={safeAlternativeDetail}
          tone="sky"
        />
        <MetricCard
          label="Estado"
          value={stateValue}
          detail={stateDetail}
          tone={stateValue === 'Bloqueado' ? 'rose' : 'amber'}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Qué tocaría"
          items={touchedAreas}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="No se ejecutó todavía"
          items={untouchedAreas}
          compact={compact}
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Validaciones pedidas"
          items={validationItems}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Alertas del paquete"
          items={warningItems}
          compact={compact}
          tone="rose"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {onPrepare ? (
          <button
            type="button"
            onClick={onPrepare}
            disabled={busy}
            className="rounded-xl border border-sky-300/20 bg-sky-300/10 px-4 py-2.5 text-sm font-medium text-sky-100 transition hover:bg-sky-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
          >
            Preparar aprobación
          </button>
        ) : null}
        <span className="text-sm leading-6 text-slate-400">{footerMessage}</span>
      </div>
    </div>
  )
}