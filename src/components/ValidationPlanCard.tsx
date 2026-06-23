import { MetricCard } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type ValidationPlanFileCheckContractViewModel = {
  path?: string
  expectation?: string
}

export type ValidationPlanContractViewModel = {
  scope?: string
  level?: 'light' | 'medium' | 'full' | string
  commands?: string[]
  fileChecks?: ValidationPlanFileCheckContractViewModel[]
  forbiddenPaths?: string[]
  runtimeChecks?: string[]
  manualChecks?: string[]
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

const getValidationLevelLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'full') {
    return 'Completa'
  }
  if (normalizedValue === 'medium') {
    return 'Media'
  }

  return 'Ligera'
}

export function ValidationPlanCard({
  plan,
  compact = false,
}: {
  plan: ValidationPlanContractViewModel
  compact?: boolean
}) {
  const fileChecks = plan.fileChecks || []
  const visibleFileChecks = compact ? fileChecks.slice(0, 4) : fileChecks

  return (
    <article className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Plan de validación
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Resume cómo validar el plan o la materialización sin instalar dependencias ni levantar servicios reales.
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
          {getValidationLevelLabel(plan.level)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Scope"
          value={normalizeOptionalString(plan.scope) || 'Sin scope'}
          tone="sky"
        />
        <MetricCard
          label="Commands"
          value={
            normalizeOptionalStringArray(plan.commands).length > 0
              ? `${normalizeOptionalStringArray(plan.commands).length} comando(s)`
              : 'Sin comandos'
          }
          detail={
            normalizeOptionalStringArray(plan.commands)[0] ||
            'No hace falta ejecutar comandos'
          }
        />
        <MetricCard
          label="File checks"
          value={fileChecks.length > 0 ? `${fileChecks.length} check(s)` : 'Sin file checks'}
          detail={normalizeOptionalString(visibleFileChecks[0]?.path) || 'Sin path declarado'}
        />
        <MetricCard
          label="Paths prohibidos"
          value={
            normalizeOptionalStringArray(plan.forbiddenPaths).length > 0
              ? `${normalizeOptionalStringArray(plan.forbiddenPaths).length} path(s)`
              : 'Sin paths prohibidos'
          }
          detail={
            normalizeOptionalStringArray(plan.forbiddenPaths)[0] ||
            'Sin restricciones extra'
          }
          tone="amber"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            File checks
          </div>
          <div className="mt-3 grid gap-3">
            {visibleFileChecks.length > 0 ? (
              visibleFileChecks.map((entry) => (
                <div
                  key={`${entry.path || 'path'}-${entry.expectation || 'expectation'}`}
                  className="rounded-xl border border-white/8 bg-slate-900/60 px-4 py-3"
                >
                  <div className="text-sm font-medium leading-6 text-slate-100">
                    {entry.path || 'Path no declarado'}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    {entry.expectation || 'Sin expectativa declarada'}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm leading-6 text-slate-300">
                Este plan valida contrato y revisión manual, no filesystem real todavía.
              </div>
            )}
          </div>
          {compact && fileChecks.length > visibleFileChecks.length ? (
            <div className="mt-3 text-xs leading-5 text-slate-500">
              +{fileChecks.length - visibleFileChecks.length} file check(s) más.
            </div>
          ) : null}
        </article>
        <div className="grid gap-3">
          <ProductArchitectureGroup
            title="Checks de runtime"
            items={plan.runtimeChecks}
            compact={compact}
          />
          <ProductArchitectureGroup
            title="Checks manuales"
            items={plan.manualChecks}
            compact={compact}
            tone="sky"
          />
          <ProductArchitectureGroup
            title="Criterios de éxito"
            items={plan.successCriteria}
            compact={compact}
            tone="emerald"
          />
        </div>
      </div>
    </article>
  )
}