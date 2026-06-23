import { MetricCard, type MetricTone } from './AppUiPrimitives'
import { ProductArchitectureGroup } from './ProductArchitectureGroup'

export type ProjectBlueprintIntegrationContractViewModel = {
  name?: string
  type?: string
  requiredNow?: boolean
  approvalRequired?: boolean
  reason?: string
}

export type ProjectBlueprintPhaseContractViewModel = {
  phase?: string
  goal?: string
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
    | string
  executableNow?: boolean
  approvalRequired?: boolean
}

export type ProjectBlueprintStackProfileViewModel = {
  frontend?: string
  backend?: string
  database?: string
  apiStyle?: string
  auth?: string
  styling?: string
  testing?: string
  packageManager?: string
  runtime?: string
}

export type ProjectBlueprintContractViewModel = {
  productType?: string
  domain?: string
  intent?: string
  deliveryLevel?:
    | 'safe-first-delivery'
    | 'frontend-project'
    | 'fullstack-local'
    | 'monorepo-local'
    | 'infra-local-plan'
    | string
  confidence?: 'low' | 'medium' | 'high' | string
  stackProfile?: ProjectBlueprintStackProfileViewModel
  roles?: string[]
  modules?: string[]
  entities?: string[]
  coreFlows?: string[]
  integrations?: ProjectBlueprintIntegrationContractViewModel[]
  dataSensitivity?: 'none' | 'low' | 'medium' | 'high' | string
  riskLevel?: 'low' | 'medium' | 'high' | string
  assumptions?: string[]
  blockingQuestions?: string[]
  delegatedDecisions?: string[]
  phasePlan?: ProjectBlueprintPhaseContractViewModel[]
  explicitExclusions?: string[]
  approvalRequiredLater?: string[]
  successCriteria?: string[]
}

export type QuestionPolicyContractViewModel = {
  mode?: 'ask-only-if-blocking' | 'brain-decides-missing' | 'user-will-contribute' | string
  blockingQuestions?: string[]
  optionalQuestions?: string[]
  delegatedDecisions?: string[]
  shouldAskBeforePlanning?: boolean
  shouldAskBeforeMaterialization?: boolean
  reason?: string
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

const getDeliveryLevelTone = (value: unknown): MetricTone => {
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

const getBlueprintConfidenceLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'Alta'
  }

  if (normalizedValue === 'medium') {
    return 'Media'
  }

  if (normalizedValue === 'low') {
    return 'Baja'
  }

  return normalizeOptionalString(value) || 'No definida'
}

const getQuestionPolicyModeLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'brain-decides-missing') {
    return 'El Cerebro decide faltantes menores'
  }

  if (normalizedValue === 'user-will-contribute') {
    return 'El usuario puede aportar definiciones'
  }

  if (normalizedValue === 'ask-only-if-blocking') {
    return 'Preguntar solo si bloquea'
  }

  return normalizeOptionalString(value) || 'No definida'
}

const getSensitivityLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'Alta'
  }

  if (normalizedValue === 'medium') {
    return 'Media'
  }

  if (normalizedValue === 'low') {
    return 'Baja'
  }

  if (normalizedValue === 'none') {
    return 'Nula'
  }

  return normalizeOptionalString(value) || 'No definida'
}

const getRiskLabel = (value: unknown) => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'Alto'
  }

  if (normalizedValue === 'medium') {
    return 'Medio'
  }

  if (normalizedValue === 'low') {
    return 'Bajo'
  }

  return normalizeOptionalString(value) || 'No definido'
}

const getRiskTone = (value: unknown): MetricTone => {
  const normalizedValue = normalizeOptionalString(value).toLocaleLowerCase()

  if (normalizedValue === 'high') {
    return 'rose'
  }

  if (normalizedValue === 'medium') {
    return 'amber'
  }

  if (normalizedValue === 'low') {
    return 'emerald'
  }

  return 'default'
}

const getStackProfileSummary = (blueprint?: ProjectBlueprintContractViewModel | null) => {
  if (!blueprint?.stackProfile) {
    return 'Sin stack recomendado'
  }

  return (
    [
      normalizeOptionalString(blueprint.stackProfile.frontend),
      normalizeOptionalString(blueprint.stackProfile.backend),
      normalizeOptionalString(blueprint.stackProfile.database),
    ]
      .filter(Boolean)
      .join(' / ') || 'Sin stack recomendado'
  )
}

export function ProjectBlueprintCard({
  blueprint,
  questionPolicy,
  compact = false,
}: {
  blueprint: ProjectBlueprintContractViewModel
  questionPolicy?: QuestionPolicyContractViewModel | null
  compact?: boolean
}) {
  const stackProfile = blueprint.stackProfile || null
  const stackItems = [
    stackProfile?.frontend ? `Frontend: ${stackProfile.frontend}` : '',
    stackProfile?.backend ? `Backend: ${stackProfile.backend}` : '',
    stackProfile?.database ? `Base de datos: ${stackProfile.database}` : '',
    stackProfile?.apiStyle ? `API: ${stackProfile.apiStyle}` : '',
    stackProfile?.auth ? `Auth: ${stackProfile.auth}` : '',
    stackProfile?.styling ? `Styling: ${stackProfile.styling}` : '',
    stackProfile?.testing ? `Testing: ${stackProfile.testing}` : '',
    stackProfile?.packageManager
      ? `Package manager: ${stackProfile.packageManager}`
      : '',
    stackProfile?.runtime ? `Runtime: ${stackProfile.runtime}` : '',
  ].filter(Boolean)
  const visibleStackItems = compact ? stackItems.slice(0, 5) : stackItems
  const visibleIntegrations = compact
    ? (blueprint.integrations || []).slice(0, 3)
    : blueprint.integrations || []
  const visiblePhasePlan = compact
    ? (blueprint.phasePlan || []).slice(0, 3)
    : blueprint.phasePlan || []

  return (
    <article className="rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.06] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Blueprint del proyecto
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-400">
            Esta lectura resume el tipo de producto, el stack recomendado, los módulos
            y las decisiones de arquitectura que JEFE está usando para planificar.
          </div>
          <div className="mt-2 text-xs leading-5 text-slate-500">
            {normalizeOptionalString(blueprint.intent) ||
              'Sin intención resumida disponible.'}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
            Arquitectura dinámica
          </span>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-100">
            {getDeliveryLevelLabel(blueprint.deliveryLevel)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tipo de producto"
          value={normalizeOptionalString(blueprint.productType) || 'No definido'}
          detail={normalizeOptionalString(blueprint.domain) || 'Sin dominio declarado'}
          tone="emerald"
        />
        <MetricCard
          label="Delivery level"
          value={getDeliveryLevelLabel(blueprint.deliveryLevel)}
          detail={getScalableDeliveryPlanTypeLabel(blueprint.deliveryLevel)}
          tone={getDeliveryLevelTone(blueprint.deliveryLevel)}
        />
        <MetricCard
          label="Confianza"
          value={getBlueprintConfidenceLabel(blueprint.confidence)}
          detail={getStackProfileSummary(blueprint)}
          tone="sky"
        />
        <MetricCard
          label="Riesgo"
          value={getRiskLabel(blueprint.riskLevel)}
          detail={`Sensibilidad: ${getSensitivityLabel(blueprint.dataSensitivity)}`}
          tone={getRiskTone(blueprint.riskLevel)}
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Roles"
          items={blueprint.roles}
          compact={compact}
          tone="sky"
        />
        <ProductArchitectureGroup
          title="Módulos"
          items={blueprint.modules}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Entidades"
          items={blueprint.entities}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Flujos principales"
          items={blueprint.coreFlows}
          compact={compact}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Stack recomendado
        </div>
        <div className="mt-3 grid gap-3 xl:grid-cols-2">
          {visibleStackItems.length > 0 ? (
            visibleStackItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-100"
              >
                {item}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300 xl:col-span-2">
              El Cerebro todavía no dejó un stack profile estructurado.
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Supuestos"
          items={blueprint.assumptions}
          compact={compact}
        />
        <ProductArchitectureGroup
          title="Decisiones delegadas"
          items={blueprint.delegatedDecisions || questionPolicy?.delegatedDecisions}
          compact={compact}
          tone="emerald"
        />
        <ProductArchitectureGroup
          title="Preguntas bloqueantes"
          items={blueprint.blockingQuestions || questionPolicy?.blockingQuestions}
          compact={compact}
          tone="amber"
        />
        <ProductArchitectureGroup
          title="Aprobaciones futuras"
          items={blueprint.approvalRequiredLater}
          compact={compact}
          tone="rose"
        />
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Política de preguntas
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <MetricCard
              label="Modo"
              value={getQuestionPolicyModeLabel(questionPolicy?.mode)}
              detail={normalizeOptionalString(questionPolicy?.reason) || 'Sin razón declarada'}
              tone="amber"
            />
            <MetricCard
              label="Antes de planificar"
              value={questionPolicy?.shouldAskBeforePlanning ? 'Preguntar' : 'Seguir'}
              detail={
                questionPolicy?.shouldAskBeforeMaterialization
                  ? 'También podría frenar antes de materializar'
                  : 'No hace falta bloquear la materialización por ahora'
              }
              tone={questionPolicy?.shouldAskBeforePlanning ? 'amber' : 'emerald'}
            />
          </div>
          {normalizeOptionalStringArray(questionPolicy?.optionalQuestions).length > 0 ? (
            <div className="mt-4">
              <ProductArchitectureGroup
                title="Preguntas opcionales"
                items={questionPolicy?.optionalQuestions}
                compact={compact}
              />
            </div>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Fases propuestas
          </div>
          <div className="mt-3 grid gap-3">
            {visiblePhasePlan.length > 0 ? (
              visiblePhasePlan.map((phaseEntry) => (
                <div
                  key={`${phaseEntry.phase || 'phase'}-${phaseEntry.goal || 'goal'}`}
                  className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
                >
                  <div className="text-sm font-medium leading-6 text-slate-100">
                    {phaseEntry.phase || 'Fase sin nombre'}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">
                    {phaseEntry.goal || 'Sin objetivo declarado'}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <span>{getDeliveryLevelLabel(phaseEntry.deliveryLevel)}</span>
                    <span>
                      {phaseEntry.executableNow ? 'ejecutable ahora' : 'no ejecutable todavía'}
                    </span>
                    <span>
                      {phaseEntry.approvalRequired
                        ? 'requiere aprobación'
                        : 'sin aprobación previa'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
                El blueprint todavía no dejó fases estructuradas.
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        <ProductArchitectureGroup
          title="Exclusiones explícitas"
          items={blueprint.explicitExclusions}
          compact={compact}
          tone="rose"
        />
        <ProductArchitectureGroup
          title="Criterios de éxito"
          items={blueprint.successCriteria}
          compact={compact}
          tone="emerald"
        />
      </div>

      {visibleIntegrations.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Integraciones consideradas
          </div>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {visibleIntegrations.map((integration) => (
              <div
                key={`${integration.name || 'integration'}-${integration.type || 'type'}`}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
              >
                <div className="text-sm font-medium leading-6 text-slate-100">
                  {integration.name || 'Integración sin nombre'}
                </div>
                <div className="mt-1 text-xs leading-5 text-slate-400">
                  {integration.reason || 'Sin motivo declarado'}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  <span>{integration.type || 'tipo no declarado'}</span>
                  <span>{integration.requiredNow ? 'requerida ahora' : 'no requerida ahora'}</span>
                  <span>
                    {integration.approvalRequired
                      ? 'requiere aprobación'
                      : 'sin aprobación previa'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}