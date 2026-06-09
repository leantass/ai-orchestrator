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
  return (
    <AppShell
      eyebrow="JEFE / ORQUESTADOR DE IA"
      title={title}
      description={description}
      modeSwitcher={modeSwitcher}
      quickActions={themeSwitcher}
      navItems={navItems}
      statusLabel={statusLabel}
      statusDetail={statusDetail}
      statusBadge={statusBadge}
      mainContent={
        <div className="grid gap-4">
          {requestPanel}
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4">
              {understoodPanel}
              {planPanel}
            </div>
            <div className="grid gap-4">{rightNextStepsPanel}</div>
          </div>
          {approvalPanel}
        </div>
      }
      rightPanel={
        <div className="grid gap-4">
          {rightStatusPanel}
          {rightResultPanel}
          {technicalPanel}
        </div>
      }
      footer={footer}
    />
  )
}
