import type { ReactNode } from 'react'

import { AppShell, type AppShellNavItem } from './AppShell'

export function SimpleExperienceDashboard({
  title,
  description,
  modeSwitcher,
  themeSwitcher,
  navItems,
  statusLabel,
  statusDetail,
  statusBadge,
  requestPanel,
  understoodPanel,
  planPanel,
  approvalPanel,
  rightStatusPanel,
  rightNextStepsPanel,
  rightResultPanel,
  technicalPanel,
  footer,
}: {
  title: string
  description: string
  modeSwitcher: ReactNode
  themeSwitcher: ReactNode
  navItems: AppShellNavItem[]
  statusLabel: string
  statusDetail: string
  statusBadge?: string
  requestPanel: ReactNode
  understoodPanel: ReactNode
  planPanel: ReactNode
  approvalPanel?: ReactNode
  rightStatusPanel: ReactNode
  rightNextStepsPanel: ReactNode
  rightResultPanel: ReactNode
  technicalPanel: ReactNode
  footer?: ReactNode
}) {
  const flowSteps = [
    ['Entiende', 'Convierte el pedido en una mision clara.'],
    ['Planifica', 'Arma pasos, alcance y puntos de control.'],
    ['Ejecuta', 'Coordina trabajo supervisado con Codex y workers.'],
    ['Valida', 'Corre checks y revisa evidencia antes de entregar.'],
    ['Entrega', 'Deja resultado, resumen y auditoria disponible.'],
  ]
  const executiveCards: Array<{ label: string; value: ReactNode; detail: ReactNode }> = [
    {
      label: 'Proyecto actual',
      value: title,
      detail: description,
    },
    {
      label: 'Proximo paso',
      value: 'Crear plan',
      detail: 'Convertir el pedido en una ruta revisable.',
    },
    {
      label: 'Riesgo',
      value: 'Supervisado',
      detail: 'No se modifica nada sin permiso humano.',
    },
    {
      label: 'Ultima validacion',
      value: statusBadge || statusLabel,
      detail: statusDetail,
    },
  ]

  return (
    <AppShell
      eyebrow="JEFE"
      title="Orquestador de proyectos con IA"
      description="Pedile una tarea: JEFE entiende, planifica, coordina, valida y deja el resultado listo para revisar."
      modeSwitcher={modeSwitcher}
      quickActions={themeSwitcher}
      navItems={navItems}
      showSidebar={false}
      showMobileNav={false}
      statusLabel={statusLabel}
      statusDetail={statusDetail}
      statusBadge={statusBadge}
      mainContent={
        <div className="mx-auto grid max-w-6xl gap-5">
          <section className="jefe-surface overflow-hidden rounded-[32px] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex rounded-full border border-[color:var(--jefe-primary-line)] bg-[color:var(--jefe-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--jefe-primary)]">
                Modo Demo
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[color:var(--jefe-text-strong)] sm:text-5xl">
                ¿Qué querés construir o mejorar?
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[color:var(--jefe-muted)]">
                JEFE entiende el pedido, arma el plan, coordina el trabajo, valida y te entrega el resultado revisado.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-[color:var(--jefe-muted)]">
                <span className="rounded-full border border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-soft)] px-3 py-1">Codex y workers supervisados</span>
                <span className="rounded-full border border-[color:var(--jefe-line)] bg-[color:var(--jefe-panel-soft)] px-3 py-1">Validacion antes de entregar</span>
                <a href="#jefe-auditoria-demo" className="rounded-full border border-[color:var(--jefe-primary-line)] bg-[color:var(--jefe-primary-soft)] px-3 py-1 text-[color:var(--jefe-primary)]">
                  Auditoria disponible
                </a>
              </div>
            </div>
            <div className="mx-auto mt-7 max-w-4xl">{requestPanel}</div>
          </section>

          <section aria-label="Resumen ejecutivo" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {executiveCards.map((card) => (
              <article key={card.label} className="jefe-surface-soft rounded-[24px] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-subtle)]">
                  {card.label}
                </div>
                <div className="mt-3 text-sm font-semibold text-[color:var(--jefe-text-strong)]">{card.value}</div>
                <p className="mt-2 text-xs leading-5 text-[color:var(--jefe-muted)]">{card.detail}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-3 md:grid-cols-5">
            {flowSteps.map(([step, detail], index) => (
              <article key={step} className="jefe-surface-soft rounded-[24px] px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--jefe-subtle)]">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <div className="mt-3 text-sm font-semibold text-[color:var(--jefe-text-strong)]">{step}</div>
                <p className="mt-2 text-xs leading-5 text-[color:var(--jefe-muted)]">{detail}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="grid gap-4">
              {understoodPanel}
              {planPanel}
              {approvalPanel}
            </div>
            <div className="grid gap-4">
              {rightStatusPanel}
              {rightNextStepsPanel}
              {rightResultPanel}
            </div>
          </section>

          <section id="jefe-auditoria-demo" className="jefe-surface rounded-[28px] p-5 sm:p-6">
            <details>
              <summary className="flex cursor-pointer list-none flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block text-sm font-semibold text-[color:var(--jefe-text-strong)]">Auditoria / detalle tecnico</span>
                  <span className="mt-1 block text-sm leading-6 text-[color:var(--jefe-muted)]">
                    Git, CI, smokes, workers, permisos, Context Hub, logs y evidencia quedan disponibles sin dominar la demo.
                  </span>
                </span>
                <span className="rounded-full border border-[color:var(--jefe-line)] px-3 py-1 text-xs font-semibold text-[color:var(--jefe-muted)]">
                  Ver evidencia
                </span>
              </summary>
              <div className="mt-5 grid gap-4">
                {technicalPanel}
              </div>
            </details>
          </section>
        </div>
      }
      footer={footer}
    />
  )
}
