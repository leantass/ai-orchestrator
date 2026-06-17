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
    label: 'External tools real execution',
    value: 'Disabled',
    detail: 'Blender, Unity and MCP are prepared through packets only.',
    tone: 'emerald' as MetricTone,
    icon: 'shield' as AppIconName,
  },
  {
    label: 'Automatic execution',
    value: 'Disabled',
    detail: 'External permits never flip executionAllowed in V1.',
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
  ['Proyecto', 'Workspace, objetivo, contexto activo y estado de la sesion.', 'Available'],
  ['Planificacion', 'Planner, decisionKey, estrategia, memoria y accion siguiente.', 'Available'],
  ['Sandbox', 'Materializacion local segura con approval antes de writes.', 'Available'],
  ['Delivery review', 'Revision de evidencia, decision y estado de la entrega.', 'Available'],
  ['Codex worker', 'Handoff manual y correccion supervisada.', 'Available'],
  ['Smoke runner', 'Worker local para comandos allowlisted y quality.', 'Available'],
  ['External tools', 'Blender, Unity y MCP como ejecucion futura preparada.', 'Prepared'],
  ['Approvals', 'Approval gates, packets, records y permits.', 'Available'],
  ['History / Ledger', 'Historial de revisiones y correcciones.', 'Available'],
  ['QA / Release', 'Smokes, build, lint, TypeScript y CI remoto.', 'Available'],
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
    <div className="space-y-6">
      <SectionHeader
        eyebrow="V1 closure"
        title="JEFE / AI Orchestrator"
        description="A usable local control room for safe planning, approvals, sandbox materialization, delivery review, supervised workers, external-tool permits and release evidence."
        icon="shield"
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Estado V1"
          value="Complete and demonstrable"
          detail="The product is usable from the app, with docs and release smoke."
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
          emphasis="hero"
        />
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
          detail="Latest external-tool permit bundle closed with remote CI green."
          tone="violet"
          icon="history"
        />
      </div>

      <ResultSectionCard
        title="Dashboard V1"
        description="The product surface now explains what JEFE can do, what it refuses to do, and how the pieces fit together."
        icon="home"
        badge="Usable"
        tone="sky"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {productAreas.map(([label, detail, status]) => (
            <MetricCard
              key={label}
              label={label}
              value={status}
              detail={detail}
              icon={label.includes('External') ? 'connectors' : label.includes('History') ? 'history' : 'status'}
              tone={status === 'Prepared' ? 'amber' : 'default'}
            />
          ))}
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Security posture"
        description="V1 is intentionally conservative: it prepares and validates, but keeps risky execution behind explicit human control."
        icon="shield"
        badge="Locked"
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {safetyItems.map((item) => (
            <MetricCard key={item.label} {...item} />
          ))}
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Flujo de tarea"
        description="Every stage has a conceptual status, a backing module and a supervision mode."
        icon="flow"
        badge={`${taskPipeline.length} etapas`}
      >
        <div className="grid gap-3">
          {taskPipeline.map((stage, index) => (
            <div
              key={stage.name}
              className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
                <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-3 text-xs leading-5 text-slate-300 lg:w-[340px]">
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
        description="The approval stack explains what is prepared and why real execution remains disabled."
        icon="approval"
        badge="executionAllowed false"
      >
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
        title="Historial / Ledger"
        description="V1 keeps history understandable through ledgers, run summaries and local evidence folders."
        icon="history"
        badge="Navigable"
      >
        <ResultKeyValueGrid items={ledgerItems} />
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
    <div className="rounded-[22px] border border-white/8 bg-slate-950/45 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ResultStatusBadge label={worker.status} tone={external ? 'amber' : 'sky'} />
        <SurfaceHeaderTag>{worker.capability}</SurfaceHeaderTag>
      </div>
      <div className="mt-3 text-sm font-semibold text-[color:var(--jefe-text-strong)]">
        {worker.name}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <MetricCard label="Real execution" value={worker.realExecution} icon="shield" />
        <MetricCard label="Approval" value={worker.approval} icon="approval" />
      </div>
      <div className="mt-3 text-xs leading-5 text-[color:var(--jefe-muted)]">
        Risks: {worker.risks}
      </div>
      <div className="mt-1 text-xs leading-5 text-[color:var(--jefe-muted)]">
        Next: {worker.next}
      </div>
    </div>
  )
}
