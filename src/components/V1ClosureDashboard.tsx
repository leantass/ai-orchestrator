import {
  DisclosurePanel,
  MetricCard,
  ResultKeyValueGrid,
  ResultSectionCard,
  ResultStatusBadge,
  SectionHeader,
  SurfaceHeaderTag,
  type AppIconName,
  type MetricTone,
} from './AppUiPrimitives'

const safetyItems = [
  {
    label: 'External tools',
    value: 'Disabled',
    detail: 'No Blender, Unity or MCP real execution in V1.',
    tone: 'emerald' as MetricTone,
    icon: 'shield' as AppIconName,
  },
  {
    label: 'Automatic external execution',
    value: 'Disabled',
    detail: 'executionAllowed and automaticExecutionAllowed stay false.',
    tone: 'emerald' as MetricTone,
    icon: 'approval' as AppIconName,
  },
  {
    label: 'Sandbox required',
    value: 'Enabled',
    detail: 'Materialization remains scoped to approved local sandboxes.',
    tone: 'sky' as MetricTone,
    icon: 'workspace' as AppIconName,
  },
  {
    label: 'Human approval required',
    value: 'Enabled',
    detail: 'Risky steps remain blocked until a person approves the scope.',
    tone: 'amber' as MetricTone,
    icon: 'approval' as AppIconName,
  },
]

const productAreas = [
  ['Proyecto', 'Objetivo, workspace, contexto y estado visible.', 'Available'],
  ['Planificacion', 'Planner, decisionKey, memoria y proxima accion.', 'Available'],
  ['Sandbox', 'Writes locales solo en scopes aprobados.', 'Available'],
  ['Delivery review', 'Revision de evidencia y decision de entrega.', 'Available'],
  ['Codex worker', 'Correccion empaquetada y supervisada.', 'Available'],
  ['Smoke runner', 'Validaciones allowlisted y quality.', 'Available'],
  ['External tools', 'Blender, Unity y MCP quedan planificados.', 'Prepared'],
  ['Approvals', 'Gates, packets, records y permits.', 'Available'],
  ['History / Ledger', 'Hitos, revisiones y correcciones.', 'Available'],
  ['QA / Release', 'Smokes, build, lint, TypeScript y CI.', 'Available'],
] as const

const taskPipeline = [
  {
    name: 'Pedido',
    status: 'Available',
    mode: 'Manual',
    module: 'src/App.tsx / ProjectInputsPanel',
    description: 'El operador declara objetivo, contexto y limites.',
  },
  {
    name: 'Plan',
    status: 'Available',
    mode: 'Supervised',
    module: 'planner-ui-state.js / ai-planner-smoke',
    description: 'JEFE genera una ruta segura y explica la siguiente accion.',
  },
  {
    name: 'Approval',
    status: 'Available',
    mode: 'Manual',
    module: 'approval surface / runtime approval flow',
    description: 'Los pasos sensibles quedan frenados hasta aprobacion humana.',
  },
  {
    name: 'Sandbox',
    status: 'Available',
    mode: 'Supervised',
    module: 'generated-domain materialization policies',
    description: 'Los writes se limitan a ubicaciones aprobadas.',
  },
  {
    name: 'Materialization',
    status: 'Available',
    mode: 'Supervised',
    module: 'generated-domain materialization sandbox smoke',
    description: 'Se crea una entrega local revisable dentro del scope.',
  },
  {
    name: 'Delivery Review',
    status: 'Available',
    mode: 'Supervised',
    module: 'generated-domain-delivery-review.cjs',
    description: 'La entrega se compara contra contrato, dominio y evidencia.',
  },
  {
    name: 'Codex Correction',
    status: 'Available',
    mode: 'Manual handoff',
    module: 'generated-domain-delivery-worker-handoff.cjs',
    description: 'Las correcciones se empaquetan para un worker supervisado.',
  },
  {
    name: 'Validation',
    status: 'Available',
    mode: 'Allowlisted',
    module: 'orchestrator-local-smoke-worker.cjs',
    description: 'Smokes y quality verifican sin comandos peligrosos.',
  },
  {
    name: 'History',
    status: 'Available',
    mode: 'Recorded',
    module: 'generated-domain-delivery-history-ledger.cjs',
    description: 'Los hitos quedan resumidos en ledger y reportes.',
  },
  {
    name: 'Final Report',
    status: 'Available',
    mode: 'Manual review',
    module: 'ResultSummaryPanel / docs V1',
    description: 'El cierre explica resultado, evidencias y limites.',
  },
] as const

const internalWorkers = [
  {
    name: 'Codex manual correction worker',
    capability: 'delivery.correction.manual',
    status: 'Supervised handoff',
    realExecution: 'No automatic execution',
    approval: 'Human review required',
    risks: 'Wrong domain, unsafe paths, incomplete evidence.',
    next: 'Use handoff only after delivery review asks for revision.',
  },
  {
    name: 'Local smoke runner',
    capability: 'tests.run.allowlisted',
    status: 'Available',
    realExecution: 'Only allowlisted commands',
    approval: 'Blocked for unsafe commands',
    risks: 'npm install, Docker, deploy, git add dot, .env.',
    next: 'Run focused smokes or quality through controlled scripts.',
  },
  {
    name: 'Supervised workflow',
    capability: 'workflow.supervised.local',
    status: 'Available',
    realExecution: 'No hidden automation',
    approval: 'Human gate for risky transitions',
    risks: 'Skipping corrected evidence or unsafe validation command.',
    next: 'Continue correction loop with explicit evidence.',
  },
] as const

const externalWorkers = [
  {
    name: 'Blender manual asset worker',
    capability: 'external.blender.asset.create',
    status: 'Permit prepared',
    realExecution: 'No Blender launch in V1',
    approval: 'Human approval record required',
    risks: 'Unapproved paths, missing asset brief, unexpected exports.',
    next: 'Provide asset brief, references, input/output scopes and visual checklist.',
  },
  {
    name: 'Unity manual integration worker',
    capability: 'external.unity.assets.import',
    status: 'Permit prepared',
    realExecution: 'No Unity launch in V1',
    approval: 'Human approval record required',
    risks: 'Project mutation, scene/prefab mismatch, builds.',
    next: 'Approve Unity sandbox, branch, inputs and validation evidence.',
  },
  {
    name: 'MCP future worker',
    capability: 'external.mcp.future.invoke',
    status: 'Future gated',
    realExecution: 'No MCP invocation in V1',
    approval: 'Exact capability and scopes required',
    risks: 'Real credentials, unsafe payload, external service effects.',
    next: 'Define capability, redacted payload, future scopes and expected outputs.',
  },
] as const

const externalChain = [
  'planned handoff',
  'approval gate',
  'dry-run plan',
  'supervised execution design',
  'readiness review',
  'manual execution packet',
  'human approval record',
  'permit bundle',
]

const approvalLayers = [
  {
    name: 'Approval gates',
    means: 'Early safety gate for planned external work.',
    authorizes: 'Preparation and review of the request.',
    doesNotAuthorize: 'Opening tools or writing outside scope.',
  },
  {
    name: 'Manual execution packet',
    means: 'Operator-facing checklist for future execution.',
    authorizes: 'Human review of inputs, scopes and abort conditions.',
    doesNotAuthorize: 'Running Blender, Unity or MCP.',
  },
  {
    name: 'Human approval record',
    means: 'Formal record of who approved what future action.',
    authorizes: 'A usable approval candidate when complete and unexpired.',
    doesNotAuthorize: 'Automatic execution; executionAuthorized remains false.',
  },
  {
    name: 'Permit bundle',
    means: 'Final consistency layer across all external artifacts.',
    authorizes: 'Readiness for a future manual supervised execution candidate.',
    doesNotAuthorize: 'Real external execution in V1.',
  },
] as const

const v15ManualRunnerItems = [
  {
    label: 'Permit bundle',
    value: 'Entrada requerida',
    detail: 'Solo avanza si el permit esta ready_for_manual_supervised_execution.',
    icon: 'approval' as AppIconName,
  },
  {
    label: 'Manual session',
    value: 'V1.5',
    detail: 'Prepara sesion, operator runbook, checklist, evidencia esperada y abort conditions.',
    icon: 'guided' as AppIconName,
  },
  {
    label: 'Evidence intake',
    value: 'Seguro',
    detail: 'Registra evidencia humana local y bloquea .env, credenciales, builds y paths fuera de scope.',
    icon: 'files' as AppIconName,
  },
  {
    label: 'Post-execution review',
    value: 'Siguiente',
    detail: 'Queda preparado para un bloque futuro; V1.5 no valida calidad profunda de binarios.',
    icon: 'reports' as AppIconName,
  },
] as const

const ledgerItems = [
  {
    label: 'Delivery history ledger',
    value: 'generated-domain-delivery-history-ledger',
    detail: 'Summarizes review/correction entries and status counts.',
    icon: 'history' as AppIconName,
  },
  {
    label: 'Roundtrip runner',
    value: 'generated-domain-delivery-roundtrip-runner',
    detail: 'Keeps pass, revision and blocked paths reproducible.',
    icon: 'runs' as AppIconName,
  },
  {
    label: 'External evidence',
    value: '.codex-temp external packets',
    detail: 'Local trial artifacts stay unversioned and reviewable.',
    icon: 'files' as AppIconName,
  },
  {
    label: 'Release quality',
    value: 'scripts/ai-quality.mjs',
    detail: 'Aggregates the release candidate checks.',
    icon: 'reports' as AppIconName,
  },
]

const historyMilestones = [
  'V1 accepted with remote CI green.',
  'Regression baseline passed without blockers.',
  'External tools remain planned-only in V1.',
  'Local QA evidence lives in .codex-temp and is not versioned.',
]

export function V1ClosureDashboard({
  headLabel,
  branchLabel,
  repoStatusLabel,
  ciLabel,
  latestRunLabel,
}: {
  headLabel: string
  branchLabel: string
  repoStatusLabel: string
  ciLabel: string
  latestRunLabel: string
}) {
  return (
    <div className="space-y-5">
      <article className="overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.15),transparent_25%),radial-gradient(circle_at_70%_18%,rgba(59,130,246,0.12),transparent_22%),linear-gradient(180deg,rgba(8,13,25,0.96),rgba(10,18,32,0.9))] p-5 shadow-[0_26px_70px_rgba(0,0,0,0.32)] sm:p-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <SectionHeader
              eyebrow="V1 release status"
              title="JEFE / AI Orchestrator"
              description="Control room local para planificar, aprobar, materializar en sandbox, revisar entregas, coordinar workers y preparar herramientas externas sin ejecutarlas."
              icon="shield"
            />
            <div className="mt-5 flex flex-wrap gap-2">
              <ResultStatusBadge label="V1 aceptada" tone="emerald" />
              <ResultStatusBadge label="CI verde" tone="emerald" />
              <ResultStatusBadge label="External execution disabled" tone="amber" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard
              label="Estado V1"
              value="Complete and demonstrable"
              detail="Usable desde la app, con docs, smoke V1 y baseline visual."
              tone="emerald"
              icon="result"
              emphasis="hero"
            />
            <MetricCard
              label="Branch / HEAD"
              value={branchLabel}
              detail={headLabel}
              tone="sky"
              icon="git"
            />
          </div>
        </div>
      </article>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Repo / CI"
          value={repoStatusLabel}
          detail={ciLabel}
          tone="emerald"
          icon="reports"
        />
        <MetricCard
          label="Ultimo hito"
          value={latestRunLabel}
          detail="Aceptacion documental V1 cerrada con CI remoto verde."
          tone="violet"
          icon="history"
        />
        <MetricCard
          label="Siguiente recomendado"
          value="V1.1 UI Polish"
          detail="Pulir claridad visual sin abrir ejecucion externa."
          tone="sky"
          icon="next"
        />
        <MetricCard
          label="V1.5 posterior"
          value="Manual supervised runner"
          detail="Solo despues de cerrar polish y permisos humanos."
          tone="amber"
          icon="guided"
        />
      </div>

      <ResultSectionCard
        title="Dashboard V1"
        description="Mapa compacto de lo que V1 ya permite operar desde la app y lo que queda preparado para fases posteriores."
        icon="home"
        badge="Usable"
        tone="sky"
      >
        <div className="grid gap-2 lg:grid-cols-2">
          {productAreas.map(([label, detail, status]) => (
            <ProductAreaRow
              key={label}
              label={label}
              detail={detail}
              status={status}
            />
          ))}
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Security posture"
        description="La regla de V1 es simple: preparar, explicar, pedir permiso, registrar evidencia y validar antes de cualquier accion con riesgo real."
        icon="shield"
        badge="Locked"
      >
        <div className="mb-4 rounded-[22px] border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm leading-6 text-amber-50">
          Blender, Unity y MCP siguen deshabilitados para ejecucion real. V1 prepara permisos y evidencia; no abre herramientas externas ni autoriza automatizacion.
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {safetyItems.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Flujo de tarea"
        description="Pipeline completo de V1, con modo operativo y modulo de respaldo."
        icon="flow"
        badge={`${taskPipeline.length} etapas`}
      >
        <div className="grid gap-3 xl:grid-cols-2">
          {taskPipeline.map((stage, index) => (
            <div
              key={stage.name}
              className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
            >
              <div className="flex h-full flex-col gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SurfaceHeaderTag>{String(index + 1).padStart(2, '0')}</SurfaceHeaderTag>
                    <ResultStatusBadge label={stage.status} tone="emerald" />
                    <ResultStatusBadge label={stage.mode} tone="default" />
                  </div>
                  <div className="mt-3 text-base font-semibold text-[color:var(--jefe-text-strong)]">
                    {stage.name}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-[color:var(--jefe-muted)]">
                    {stage.description}
                  </div>
                </div>
                <div className="mt-auto min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-3 text-xs leading-5 text-slate-300">
                  {stage.module}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Workers / External tools"
        description="Internal workers are usable through safe contracts. External workers remain planned/manual and do not launch real tools in V1."
        icon="services"
        badge="Registry"
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-[color:var(--jefe-text-strong)]">
              Workers internos
            </div>
            {internalWorkers.map((worker) => (
              <WorkerRow key={worker.name} worker={worker} />
            ))}
          </div>
          <div className="space-y-3">
            <div className="text-sm font-semibold text-[color:var(--jefe-text-strong)]">
              External planned workers
            </div>
            {externalWorkers.map((worker) => (
              <WorkerRow key={worker.name} worker={worker} external />
            ))}
          </div>
        </div>
        <div className="mt-5 rounded-[22px] border border-white/8 bg-slate-950/45 px-4 py-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            External tools chain
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {externalChain.map((step, index) => (
              <span
                key={step}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200"
              >
                <span className="text-slate-500">{index + 1}</span>
                {step}
              </span>
            ))}
          </div>
          <div className="mt-3 text-sm leading-6 text-slate-400">
            V1 does not open Blender, does not open Unity and does not invoke MCP. It prepares permissions, evidence and packets.
          </div>
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Approvals / Permits"
        description="Cada capa reduce riesgo, pero ninguna ejecuta herramientas reales en V1."
        icon="approval"
        badge="executionAllowed false"
      >
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <MetricCard
            label="executionAllowed"
            value="false"
            detail="El permit bundle puede estar listo para revision futura, pero no habilita ejecucion real."
            tone="amber"
            icon="shield"
          />
          <MetricCard
            label="automaticExecutionAllowed"
            value="false"
            detail="V1.5 debera agregar runner manual-supervisado antes de cualquier ejecucion externa."
            tone="amber"
            icon="approval"
          />
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {approvalLayers.map((layer) => (
            <div
              key={layer.name}
              className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
            >
              <div className="text-sm font-semibold text-[color:var(--jefe-text-strong)]">
                {layer.name}
              </div>
              <div className="mt-2 text-sm leading-6 text-[color:var(--jefe-muted)]">
                {layer.means}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <MetricCard
                  label="Autoriza"
                  value={layer.authorizes}
                  tone="sky"
                  icon="approval"
                />
                <MetricCard
                  label="No autoriza"
                  value={layer.doesNotAuthorize}
                  tone="amber"
                  icon="shield"
                />
              </div>
            </div>
          ))}
        </div>
        <DisclosurePanel
          title="Typical missing pieces"
          description="Why a case may remain needs_missing_inputs or requires_human_approval."
          icon="next"
          badge="Checklist"
        >
          <ResultKeyValueGrid
            items={[
              { label: 'Inputs', value: 'Briefs, references, assets, payloads', icon: 'files' },
              { label: 'Scopes', value: 'Approved input and output paths', icon: 'workspace' },
              { label: 'Evidence', value: 'Logs, previews, screenshots, reports', icon: 'reports' },
              { label: 'Validation', value: 'Post-run checks and abort conditions', icon: 'result' },
            ]}
          />
        </DisclosurePanel>
      </ResultSectionCard>

      <ResultSectionCard
        title="V1.5 Manual Supervised Execution"
        description="Nueva capa preparada para convertir un permit bundle listo en una sesion manual supervisada con runbook, checklist e intake de evidencia."
        icon="guided"
        badge="Manual only"
        tone="amber"
      >
        <div className="mb-4 rounded-[22px] border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-sm leading-6 text-amber-50">
          JEFE no abre Blender, no abre Unity y no invoca MCP. V1.5 prepara y registra la sesion para un operador humano; el post-execution review queda para el siguiente bloque.
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {v15ManualRunnerItems.map((item) => (
            <MetricCard
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
              icon={item.icon}
              tone={item.value === 'Siguiente' ? 'sky' : 'amber'}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-white/8 bg-slate-950/35 px-4 py-3 text-xs leading-5 text-[color:var(--jefe-muted)]">
            <span className="font-semibold text-[color:var(--jefe-text-strong)]">executionAllowed: </span>
            false
          </div>
          <div className="rounded-[18px] border border-white/8 bg-slate-950/35 px-4 py-3 text-xs leading-5 text-[color:var(--jefe-muted)]">
            <span className="font-semibold text-[color:var(--jefe-text-strong)]">automaticExecutionAllowed: </span>
            false
          </div>
          <div className="rounded-[18px] border border-white/8 bg-slate-950/35 px-4 py-3 text-xs leading-5 text-[color:var(--jefe-muted)]">
            <span className="font-semibold text-[color:var(--jefe-text-strong)]">externalToolExecutedByJefe: </span>
            false
          </div>
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Historial / Ledger"
        description="Donde mirar que paso, que se valido y que evidencia local queda fuera de Git."
        icon="history"
        badge="Navigable"
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <ResultKeyValueGrid items={ledgerItems} />
          <div className="rounded-[22px] border border-white/8 bg-slate-950/38 px-4 py-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              V1 milestones
            </div>
            <div className="mt-3 grid gap-2">
              {historyMilestones.map((milestone) => (
                <div
                  key={milestone}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-300"
                >
                  {milestone}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Known limits"
        description="These limits are part of the V1 safety contract, not missing buttons."
        icon="reports"
        badge="V1"
      >
        <div className="grid gap-2 md:grid-cols-2">
          {[
            'No real Blender execution.',
            'No real Unity execution.',
            'No real MCP invocation.',
            'No deploy, Docker, payments or production database.',
            'Some artifact generation remains CLI-first.',
            'Future external execution needs a manual supervised runner.',
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/8 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-slate-200"
            >
              {item}
            </div>
          ))}
        </div>
      </ResultSectionCard>
    </div>
  )
}

function WorkerRow({
  worker,
  external = false,
}: {
  worker: {
    name: string
    capability: string
    status: string
    realExecution: string
    approval: string
    risks: string
    next: string
  }
  external?: boolean
}) {
  return (
    <div className="rounded-[22px] border border-white/8 bg-slate-950/38 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ResultStatusBadge label={worker.status} tone={external ? 'amber' : 'sky'} />
        <SurfaceHeaderTag>{worker.capability}</SurfaceHeaderTag>
      </div>
      <div className="mt-3 text-sm font-semibold text-[color:var(--jefe-text-strong)]">
        {worker.name}
      </div>
      <div className="mt-3 grid gap-2 text-xs leading-5 text-[color:var(--jefe-muted)]">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <span className="font-semibold text-[color:var(--jefe-text-strong)]">Execution: </span>
          {worker.realExecution}
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
          <span className="font-semibold text-[color:var(--jefe-text-strong)]">Approval: </span>
          {worker.approval}
        </div>
        <div>
          <span className="font-semibold text-[color:var(--jefe-text-strong)]">Risk: </span>
          {worker.risks}
        </div>
        <div>
          <span className="font-semibold text-[color:var(--jefe-text-strong)]">Next: </span>
          {worker.next}
        </div>
      </div>
    </div>
  )
}

function ProductAreaRow({
  label,
  detail,
  status,
}: {
  label: string
  detail: string
  status: 'Available' | 'Prepared'
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-[18px] border border-white/8 bg-slate-950/35 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-[color:var(--jefe-text-strong)]">{label}</div>
        <div className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">{detail}</div>
      </div>
      <ResultStatusBadge label={status} tone={status === 'Prepared' ? 'amber' : 'emerald'} />
    </div>
  )
}
