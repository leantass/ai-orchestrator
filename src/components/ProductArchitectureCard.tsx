import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type ProductArchitectureContractViewModel = {
  productType?: string
  domain?: string
  users?: string[]
  roles?: string[]
  coreModules?: string[]
  dataEntities?: string[]
  keyFlows?: string[]
  integrations?: string[]
  criticalRisks?: string[]
  approvalRequiredFor?: string[]
  suggestedArchitecture?: {
    frontend?: string
    backend?: string
    database?: string
    auth?: string
    payments?: string
    storage?: string
  }
  phases?: string[]
  safeFirstDelivery?: string[]
  outOfScopeForFirstIteration?: string[]
}

const PRODUCT_ARCHITECTURE_TYPE_LABELS: Record<string, string> = {
  'business-system': 'Sistema de negocio',
  ecommerce: 'Ecommerce',
  crm: 'CRM',
  erp: 'ERP',
  marketplace: 'Marketplace',
  saas: 'SaaS',
  'internal-tool': 'Herramienta interna',
  unknown: 'No definido',
}

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeOptionalStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
      )
    : []

const getProductArchitectureTypeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No definido'
  }

  return (
    PRODUCT_ARCHITECTURE_TYPE_LABELS[normalizedValue] ||
    normalizeOptionalString(value).replace(/-/g, ' ')
  )
}

function ProductArchitectureDetailBlock({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  const normalizedValue = normalizeOptionalString(value)

  if (!normalizedValue) {
    return null
  }

  return (
    <div className="rounded-xl border border-white/8 bg-slate-950/50 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-100">{normalizedValue}</div>
    </div>
  )
}

export function ProductArchitectureCard({
  architecture,
  compact = false,
  reviewOnly = false,
  onPrepareSafeFirstDelivery,
}: {
  architecture: ProductArchitectureContractViewModel
  compact?: boolean
  reviewOnly?: boolean
  onPrepareSafeFirstDelivery?: (() => void) | null
}) {
  const canPrepareSafeFirstDelivery =
    reviewOnly &&
    typeof onPrepareSafeFirstDelivery === 'function' &&
    (normalizeOptionalStringArray(architecture.safeFirstDelivery).length > 0 ||
      normalizeOptionalStringArray(architecture.phases).length > 0)
  const suggestedArchitectureEntries = [
    ['Frontend', architecture.suggestedArchitecture?.frontend],
    ['Backend', architecture.suggestedArchitecture?.backend],
    ['Database', architecture.suggestedArchitecture?.database],
    ['Auth', architecture.suggestedArchitecture?.auth],
    ['Payments', architecture.suggestedArchitecture?.payments],
    ['Storage', architecture.suggestedArchitecture?.storage],
  ].filter((entry): entry is [string, string] => normalizeOptionalString(entry[1]) !== '')
  const hasSuggestedArchitecture = suggestedArchitectureEntries.length > 0

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Arquitectura del producto
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            {reviewOnly
              ? 'Este bloque resume la arquitectura propuesta por el Cerebro para revisión, no para ejecución inmediata.'
              : 'Resumen estructurado de la arquitectura propuesta por el planner.'}
          </div>
        </div>
        {reviewOnly ? (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
              Revisión manual
            </span>
            {canPrepareSafeFirstDelivery ? (
              <button
                type="button"
                onClick={onPrepareSafeFirstDelivery || undefined}
                className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-medium text-sky-100 transition hover:bg-sky-300/15"
              >
                Preparar primera entrega segura
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Tipo de producto"
          value={getProductArchitectureTypeLabel(architecture.productType)}
          tone="sky"
        />
        <MetricCard
          label="Dominio"
          value={normalizeOptionalString(architecture.domain) || 'Sin datos definidos'}
        />
        <MetricCard
          label="Primera entrega segura"
          value={
            normalizeOptionalStringArray(architecture.safeFirstDelivery)[0] ||
            'Sin datos definidos'
          }
          tone="emerald"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Usuarios"
          items={architecture.users}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Roles"
          items={architecture.roles}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Módulos principales"
          items={architecture.coreModules}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Entidades de datos"
          items={architecture.dataEntities}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Flujos clave"
          items={architecture.keyFlows}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Integraciones"
          items={architecture.integrations}
          compact={compact}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Riesgos críticos"
          items={architecture.criticalRisks}
          compact={compact}
          tone="rose"
        />
        <ProductArchitectureGroup
          title="Aprobaciones necesarias"
          items={architecture.approvalRequiredFor}
          compact={compact}
          tone="amber"
        />
      </div>

      {hasSuggestedArchitecture ? (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Arquitectura sugerida
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {suggestedArchitectureEntries.map(([label, value]) => (
              <ProductArchitectureDetailBlock
                key={label}
                label={label}
                value={normalizeOptionalString(value)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Fases sugeridas"
          items={architecture.phases}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Fuera de alcance de la primera iteración"
          items={architecture.outOfScopeForFirstIteration}
          compact={compact}
        />
      </div>

      {!compact ? (
        <div className="mt-4">
          <ProductArchitectureGroup
            title="Primera entrega segura"
            items={architecture.safeFirstDelivery}
            tone="emerald"
          />
        </div>
      ) : null}
    </article>
  )
}