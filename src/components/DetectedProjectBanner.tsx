import { MetricCard } from './AppUiPrimitives'

export function DetectedProjectBanner({
  projectRoot,
  lastCompletedPhaseLabel,
}: {
  projectRoot: string
  lastCompletedPhaseLabel: string
}) {
  return (
    <div className="mt-4 rounded-2xl border border-sky-300/15 bg-sky-300/[0.05] px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        Proyecto existente detectado
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-200">
        JEFE leyó un proyecto local ya materializado dentro del workspace y va a continuar
        desde el manifest actual en vez de recrear el scaffold.
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <MetricCard
          label="Carpeta detectada"
          value={projectRoot}
          detail="Origen de continuidad leído desde disco."
          tone="sky"
        />
        <MetricCard
          label="Última fase completada"
          value={lastCompletedPhaseLabel}
          detail="La siguiente acción segura se calcula desde este estado."
          tone="emerald"
        />
      </div>
    </div>
  )
}