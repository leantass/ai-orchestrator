import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type SafeFirstDeliveryPlanContractViewModel = {
  scope?: string[]
  modules?: string[]
  mockData?: string[]
  screens?: string[]
  localBehavior?: string[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

const normalizeOptionalStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
      )
    : []

export function SafeFirstDeliveryPlanCard({
  plan,
  compact = false,
  reviewOnly = false,
  onPrepareMaterialization,
  materializationActionState = 'idle',
  hideActionButton = false,
}: {
  plan: SafeFirstDeliveryPlanContractViewModel
  compact?: boolean
  reviewOnly?: boolean
  onPrepareMaterialization?: (() => void) | null
  materializationActionState?: 'idle' | 'preparing' | 'prepared'
  hideActionButton?: boolean
}) {
  const canPrepareMaterialization =
    reviewOnly &&
    typeof onPrepareMaterialization === 'function' &&
    (normalizeOptionalStringArray(plan.scope).length > 0 ||
      normalizeOptionalStringArray(plan.modules).length > 0 ||
      normalizeOptionalStringArray(plan.screens).length > 0)
  const preparingMaterialization = materializationActionState === 'preparing'
  const preparedMaterialization = materializationActionState === 'prepared'
  const scopeSummary =
    normalizeOptionalStringArray(plan.scope)[0] || 'Sin datos definidos'
  const moduleSummary =
    normalizeOptionalStringArray(plan.modules)[0] || 'Sin datos definidos'
  const exclusionSummary =
    normalizeOptionalStringArray(plan.explicitExclusions)[0] || 'Sin datos definidos'

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Primera entrega segura
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            {preparedMaterialization
              ? 'Este bloque conserva el alcance aprobado y la materializacion ya quedo lista en el CTA principal.'
              : 'Este bloque resume la primera fase segura propuesta por el Cerebro y no ejecuta cambios todavia.'}
          </div>
          {canPrepareMaterialization ? (
            <div className="mt-2 text-xs leading-5 text-slate-500">
              {preparingMaterialization
                ? 'JEFE esta preparando un plan ejecutable acotado para materializar la entrega.'
                : 'Esto genera un plan ejecutable acotado; no ejecuta cambios todavia.'}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            {preparedMaterialization
              ? 'Lista para materializar'
              : preparingMaterialization
                ? 'Preparando materializacion'
                : reviewOnly
                  ? 'Revision manual'
                  : 'Resumen activo'}
          </span>
          {canPrepareMaterialization && !hideActionButton ? (
            <button
              type="button"
              onClick={onPrepareMaterialization || undefined}
              disabled={preparingMaterialization}
              className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100 transition hover:bg-emerald-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-slate-500"
            >
              {preparingMaterialization
                ? 'Preparando materializacion...'
                : 'Preparar materializacion segura'}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <MetricCard label="Alcance inicial" value={scopeSummary} tone="sky" />
        <MetricCard label="Módulo priorizado" value={moduleSummary} tone="emerald" />
        <MetricCard label="Exclusión clave" value={exclusionSummary} tone="amber" />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup title="Alcance" items={plan.scope} compact={compact} tone="sky" />
        <ProductArchitectureGroup title="Módulos" items={plan.modules} compact={compact} tone="emerald" />
        <ProductArchitectureGroup title="Datos mock" items={plan.mockData} compact={compact} />
        <ProductArchitectureGroup title="Pantallas" items={plan.screens} compact={compact} />
        <ProductArchitectureGroup title="Comportamiento local" items={plan.localBehavior} compact={compact} />
        <ProductArchitectureGroup
          title="Criterios de éxito"
          items={plan.successCriteria}
          compact={compact}
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Exclusiones explícitas"
          items={plan.explicitExclusions}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Aprobaciones más adelante"
          items={plan.approvalRequiredLater}
          compact={compact}
          tone="rose"
        />
      </div>
    </article>
  )
}