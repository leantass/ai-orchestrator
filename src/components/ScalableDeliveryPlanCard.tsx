import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type ScalableDeliveryPlanFileContractViewModel = {
  path?: string
  purpose?: string
  required?: boolean
}

export type ScalableDeliveryPlanContractViewModel = {
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
  reason?: string
  targetStructure?: string[]
  allowedRootPaths?: string[]
  modules?: string[]
  directories?: string[]
  filesToCreate?: ScalableDeliveryPlanFileContractViewModel[]
  localOnlyConstraints?: string[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

const normalizeOptionalString = (value: unknown) =>
  typeof value === 'string' ? value.trim() : ''

const normalizeOptionalStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string => typeof entry === 'string' && entry.trim() !== '',
      )
    : []

const DELIVERY_LEVEL_LABELS: Record<string, string> = {
  'safe-first-delivery': 'Primera entrega segura',
  'frontend-project': 'Frontend project',
  'fullstack-local': 'Fullstack local',
  'monorepo-local': 'Monorepo local',
  'infra-local-plan': 'Infra local plan',
}

const getDeliveryLevelLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'No definido'
  }

  return (
    DELIVERY_LEVEL_LABELS[normalizedValue] ||
    normalizeOptionalString(value).replace(/-/g, ' ')
  )
}

const getDeliveryLevelTone = (
  value: unknown,
): 'default' | 'sky' | 'emerald' | 'amber' | 'rose' => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'infra-local-plan') {
    return 'amber'
  }

  if (normalizedValue === 'fullstack-local') {
    return 'emerald'
  }

  if (
    normalizedValue === 'frontend-project' ||
    normalizedValue === 'monorepo-local'
  ) {
    return 'sky'
  }

  return 'default'
}

const getScalableDeliveryPlanTypeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'Plan escalable local'
  }

  if (normalizedValue === 'frontend-project') {
    return 'Proyecto frontend local'
  }

  if (normalizedValue === 'fullstack-local') {
    return 'Proyecto fullstack local'
  }

  if (normalizedValue === 'monorepo-local') {
    return 'Monorepo local'
  }

  if (normalizedValue === 'infra-local-plan') {
    return 'Infraestructura local planificada'
  }

  return 'Plan escalable local'
}

const getScalableDeliverySummary = (
  plan?: ScalableDeliveryPlanContractViewModel | null,
) => {
  if (!plan) {
    return 'JEFE detectó una entrega escalable y la dejó en revisión manual.'
  }

  const firstStructureEntry = normalizeOptionalStringArray(plan.targetStructure)[0]
  const firstDirectoryEntry = normalizeOptionalStringArray(plan.directories)[0]
  const firstFileEntry = normalizeOptionalString(plan.filesToCreate?.[0]?.path)

  return (
    firstStructureEntry ||
    firstDirectoryEntry ||
    firstFileEntry ||
    'JEFE detectó una entrega escalable y la dejó en revisión manual.'
  )
}

const getNextExpectedActionLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (!normalizedValue) {
    return 'Sin siguiente acción declarada'
  }

  if (normalizedValue === 'execute-plan') {
    return 'Ejecutar el plan actual'
  }

  if (normalizedValue === 'user-approval') {
    return 'Esperar una aprobación humana'
  }

  if (normalizedValue === 'user-clarification') {
    return 'Esperar una nueva definición del usuario'
  }

  if (normalizedValue === 'scalable-delivery-plan') {
    return 'Plan escalable local'
  }

  if (normalizedValue === 'materialize-frontend-project-plan') {
    return 'Materializacion controlada de frontend project'
  }

  if (normalizedValue === 'review-project-phase') {
    return 'Revisar fase segura preparada'
  }

  if (normalizedValue === 'review-continuation-action') {
    return 'Revisar continuidad preparada'
  }

  return normalizeOptionalString(value).replace(/-/g, ' ')
}

export function ScalableDeliveryPlanCard({
  plan,
  compact = false,
  reviewOnly = false,
  nextExpectedAction,
  prepareMaterializationKind = '',
  onPrepareMaterialization,
}: {
  plan: ScalableDeliveryPlanContractViewModel
  compact?: boolean
  reviewOnly?: boolean
  nextExpectedAction?: string
  prepareMaterializationKind?: string
  onPrepareMaterialization?: (() => void) | null
}) {
  const normalizedDeliveryLevel = normalizeOptionalString(plan.deliveryLevel)
  const normalizedPrepareMaterializationKind = normalizeOptionalString(
    prepareMaterializationKind,
  ).toLocaleLowerCase()
  const planReason =
    normalizeOptionalString(plan.reason) || 'Sin motivo resumido disponible.'
  const typeLabel = getScalableDeliveryPlanTypeLabel(normalizedDeliveryLevel)
  const reviewStateLabel = reviewOnly ? 'No ejecuta todavía' : 'Plan informado'
  const nextActionLabel = getNextExpectedActionLabel(nextExpectedAction)
  const canPrepareFrontendMaterialization =
    reviewOnly &&
    normalizedPrepareMaterializationKind === 'frontend-project' &&
    typeof onPrepareMaterialization === 'function'
  const canPrepareFullstackMaterialization =
    reviewOnly &&
    normalizedPrepareMaterializationKind === 'fullstack-local' &&
    typeof onPrepareMaterialization === 'function'
  const prepareMaterializationLabel = canPrepareFrontendMaterialization
    ? 'Preparar materialización frontend'
    : canPrepareFullstackMaterialization
      ? 'Preparar materialización fullstack local'
      : ''
  const prepareMaterializationHelperCopy = canPrepareFrontendMaterialization
    ? 'Después de revisar este plan, este es el paso para convertirlo en un scaffold frontend local y ejecutable de forma segura.'
    : canPrepareFullstackMaterialization
      ? 'Después de revisar este plan, este es el paso para preparar el scaffold fullstack local que sí se puede materializar de forma segura.'
      : ''
  const fileEntries = Array.isArray(plan.filesToCreate)
    ? plan.filesToCreate
        .map((entry) =>
          entry && typeof entry === 'object'
            ? {
                path: normalizeOptionalString(entry.path),
                purpose: normalizeOptionalString(entry.purpose),
                required: entry.required !== false,
              }
            : null,
        )
        .filter(
          (
            entry,
          ): entry is { path: string; purpose: string; required: boolean } =>
            Boolean(entry?.path || entry?.purpose),
        )
    : []
  const visibleFileEntries = compact ? fileEntries.slice(0, 4) : fileEntries

  return (
    <article className="rounded-3xl border border-sky-300/15 bg-sky-300/[0.06] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Plan escalable
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Este bloque resume una entrega local más grande que la primera entrega segura y queda en revisión; no ejecuta cambios todavía.
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            {getScalableDeliverySummary(plan)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            Plan revisable
          </span>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
            No ejecuta todavía
          </span>
        </div>
      </div>

      {prepareMaterializationLabel ? (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-sky-300/20 bg-slate-950/45 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold leading-6 text-white">
              Paso siguiente para este plan
            </div>
            <div className="mt-1 text-sm leading-6 text-slate-300">
              {prepareMaterializationHelperCopy}
            </div>
          </div>
          <button
            type="button"
            onClick={onPrepareMaterialization || undefined}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-sky-300/25 bg-sky-300/15 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/20"
          >
            {prepareMaterializationLabel}
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Nivel de entrega"
          value={getDeliveryLevelLabel(normalizedDeliveryLevel)}
          tone={getDeliveryLevelTone(normalizedDeliveryLevel)}
        />
        <MetricCard
          label="Tipo de plan"
          value={typeLabel}
          detail="Salida planner-only para revisar antes de materializar."
          tone="sky"
        />
        <MetricCard
          label="Estado"
          value={reviewStateLabel}
          detail="JEFE no debería ejecutar archivos grandes desde este paso."
          tone="amber"
        />
        <MetricCard
          label="Siguiente acción"
          value={nextActionLabel}
          detail={normalizeOptionalString(nextExpectedAction) || 'Sin clave declarada'}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Estructura propuesta"
          items={plan.targetStructure}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Directorios principales"
          items={plan.directories}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Módulos principales"
          items={plan.modules}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Roots permitidos"
          items={plan.allowedRootPaths}
          compact={compact}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-slate-950/40 px-4 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Razón del nivel elegido
        </div>
        <div className="mt-3 text-sm leading-6 text-slate-100">{planReason}</div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Archivos propuestos
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {visibleFileEntries.length > 0 ? (
            visibleFileEntries.map((entry) => (
              <div
                key={`${entry.path || entry.purpose}-${entry.required ? 'required' : 'optional'}`}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
              >
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {entry.path || 'Ruta no declarada'}
                </div>
                <div className="mt-2 text-xs leading-5 text-slate-400">
                  {entry.purpose || 'Sin propósito declarado'}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {entry.required ? 'Requerido' : 'Opcional'}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300 xl:col-span-2">
              El planner no dejó archivos propuestos estructurados para este nivel.
            </div>
          )}
        </div>
        {compact && fileEntries.length > visibleFileEntries.length ? (
          <div className="mt-3 text-xs leading-5 text-slate-500">
            +{fileEntries.length - visibleFileEntries.length} archivo(s) más en la propuesta completa.
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Restricciones locales"
          items={plan.localOnlyConstraints}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Exclusiones explícitas"
          items={plan.explicitExclusions}
          compact={compact}
          tone="rose"
        />
        <ProductArchitectureGroup
          title="Aprobaciones futuras"
          items={plan.approvalRequiredLater}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Criterios de éxito"
          items={plan.successCriteria}
          compact={compact}
          tone="emerald"
        />
      </div>
    </article>
  )
}