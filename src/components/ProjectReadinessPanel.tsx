import { MetricCard, type MetricTone } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

const joinClasses = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ')

export function ProjectReadinessPanel({
  readinessLabel,
  readinessSummary,
  readinessDescription,
  readinessTone,
  validationStatusLabel,
  readinessStatusDetail,
  coreFlowLabel,
  coreFlowDetail,
  coreFlowTone,
  validationDetail,
  quickGuideValue,
  quickGuideDetail,
  builtItems,
  mockItems,
  approvalTitle,
  approvalItems,
  blockedItems,
  missingItems,
  guideItems,
  riskItems,
  compact = false,
}: {
  readinessLabel: string
  readinessSummary: string
  readinessDescription: string
  readinessTone: MetricTone
  validationStatusLabel: string
  readinessStatusDetail: string
  coreFlowLabel: string
  coreFlowDetail: string
  coreFlowTone: MetricTone
  validationDetail: string
  quickGuideValue: string
  quickGuideDetail: string
  builtItems: string[]
  mockItems: string[]
  approvalTitle: string
  approvalItems: string[]
  blockedItems: string[]
  missingItems: string[]
  guideItems: string[]
  riskItems: string[]
  compact?: boolean
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Estado para demo
          </div>
          <div className="mt-2 text-base font-semibold text-white">{readinessLabel}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{readinessSummary}</div>
          <div className="mt-2 text-xs leading-5 text-slate-400">{readinessDescription}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={joinClasses(
              'rounded-full border px-3 py-1 text-xs font-medium',
              readinessTone === 'rose'
                ? 'border-rose-300/20 bg-rose-300/10 text-rose-100'
                : readinessTone === 'amber'
                  ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
                  : readinessTone === 'emerald'
                    ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
                    : readinessTone === 'sky'
                      ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
                      : 'border-white/10 bg-white/5 text-slate-200',
            )}
          >
            {readinessLabel}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {validationStatusLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estado para demo"
          value={readinessLabel}
          detail={readinessStatusDetail}
          tone={readinessTone}
        />
        <MetricCard
          label="Flujo base"
          value={coreFlowLabel}
          detail={coreFlowDetail}
          tone={coreFlowTone}
        />
        <MetricCard
          label="Validación local"
          value={validationStatusLabel}
          detail={validationDetail}
          tone={readinessTone}
        />
        <MetricCard
          label="Guía rápida"
          value={quickGuideValue}
          detail={quickGuideDetail}
          tone="sky"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Qué ya está construido"
          items={builtItems}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Qué sigue siendo mock"
          items={mockItems}
          compact={compact}
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title={approvalTitle}
          items={approvalItems}
          compact={compact}
          tone="rose"
        />
        <ProductArchitectureGroup
          title="Bloqueado por seguridad"
          items={blockedItems}
          compact={compact}
          tone="rose"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Todavía falta completar"
          items={missingItems}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Guía rápida para probar"
          items={guideItems}
          compact={compact}
          tone="sky"
        />
      </div>

      {riskItems.length > 0 ? (
        <div className="mt-4">
          <ProductArchitectureGroup
            title="Riesgos pendientes"
            items={riskItems}
            compact={compact}
            tone="amber"
          />
        </div>
      ) : null}
    </div>
  )
}