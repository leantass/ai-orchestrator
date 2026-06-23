import {
  ResultKeyValueGrid,
  ResultSectionCard,
  ResultStatusBadge,
} from './AppUiPrimitives'

type ResultValidationItem = {
  key: string
  ok: boolean
  label: string
  detail: string
}

type ResultNextStepItem = {
  title: string
  detail: string
}

export function ResultTechnicalDetailsPanel({
  writtenArtifactsDescription,
  primaryAffectedPathLabel,
  currentTargetPathLabel,
  createdFolderPaths,
  writtenFilePaths,
  touchedFilePaths,
  materializationFileLabels,
  writtenArtifactPaths,
  materializationLimits,
  validationCount,
  validationOkCount,
  validationFailureCount,
  validationSummaryText,
  executionNeedsMaterialReview,
  validationItems,
  operationalWorkState,
  operationalWorkStateDetail,
  approvalStatusLabel,
  approvalDetailLabel,
  repoStatusValue,
  repoStatusDetail,
  ciStatusValue,
  ciStatusDetail,
  primaryNextStepItem,
  appliedReuseModeLabel,
  reuseApplied,
  reusableSummaryLabel,
  reusableSupportLabel,
  reusableSupportValue,
  scopeSummaryLabel,
  continuationAnchor,
  contextHubLabel,
  contextHubDetail,
  blockedPaths,
  scopeRespected,
  allowedPaths,
  scopeSuccessCriteria,
}: {
  writtenArtifactsDescription: string
  primaryAffectedPathLabel: string
  currentTargetPathLabel: string
  createdFolderPaths: string[]
  writtenFilePaths: string[]
  touchedFilePaths: string[]
  materializationFileLabels: string[]
  writtenArtifactPaths: string[]
  materializationLimits: string[]
  validationCount: number
  validationOkCount: number
  validationFailureCount: number
  validationSummaryText: string
  executionNeedsMaterialReview: boolean
  validationItems: ResultValidationItem[]
  operationalWorkState: string
  operationalWorkStateDetail: string
  approvalStatusLabel: string
  approvalDetailLabel: string
  repoStatusValue: string
  repoStatusDetail: string
  ciStatusValue: string
  ciStatusDetail: string
  primaryNextStepItem: ResultNextStepItem | null
  appliedReuseModeLabel: string
  reuseApplied: boolean
  reusableSummaryLabel: string
  reusableSupportLabel: string
  reusableSupportValue: string
  scopeSummaryLabel: string
  continuationAnchor: string
  contextHubLabel: string
  contextHubDetail: string
  blockedPaths: string[]
  scopeRespected: boolean
  allowedPaths: string[]
  scopeSuccessCriteria: string[]
}) {
  return (
    <>
      <ResultSectionCard title="Archivos" description={writtenArtifactsDescription}>
        <ResultKeyValueGrid
          items={[
            {
              label: 'Carpeta principal',
              value: primaryAffectedPathLabel || 'No disponible',
            },
            {
              label: 'Target actual',
              value: currentTargetPathLabel || 'No disponible',
            },
            {
              label: 'Carpetas creadas',
              value:
                createdFolderPaths.length > 0
                  ? `${createdFolderPaths.length} carpeta(s)`
                  : 'Sin carpetas creadas',
            },
            {
              label: 'Archivos escritos confirmados',
              value:
                writtenFilePaths.length > 0
                  ? `${writtenFilePaths.length} archivo(s)`
                  : 'Sin archivos escritos confirmados',
            },
            {
              label: 'Archivos tocados adicionales',
              value:
                touchedFilePaths.length > 0
                  ? `${touchedFilePaths.length} archivo(s)`
                  : 'Sin archivos tocados',
            },
            {
              label: 'Archivos previstos por plan',
              value:
                materializationFileLabels.length > 0
                  ? `${materializationFileLabels.length} archivo(s)`
                  : 'Sin archivos previstos',
            },
          ]}
        />
        <div className="mt-4 grid gap-2">
          {writtenArtifactPaths.length > 0 ? (
            writtenArtifactPaths.map((artifactPath) => (
              <div
                key={`result-artifact-${artifactPath}`}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
              >
                {artifactPath}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
              No se reportaron archivos previstos ni tocados.
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-2">
          {materializationLimits.map((limitLabel) => (
            <div
              key={`result-limit-${limitLabel}`}
              className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
            >
              {limitLabel}
            </div>
          ))}
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Validaciones"
        description="Chequeos reportados por la ejecución para confirmar la salida material."
      >
        <div className="flex flex-wrap items-center gap-3">
          <ResultStatusBadge
            label={
              validationCount > 0
                ? `${validationOkCount}/${validationCount} OK`
                : executionNeedsMaterialReview
                  ? 'Validación faltante'
                  : 'Sin validaciones'
            }
            tone={
              validationCount > 0 && validationOkCount === validationCount
                ? 'emerald'
                : validationCount > 0
                  ? 'amber'
                  : executionNeedsMaterialReview
                    ? 'rose'
                    : 'default'
            }
          />
          <div className="text-sm leading-6 text-slate-300">{validationSummaryText}</div>
        </div>
        <div className="mt-4 grid gap-2">
          <ResultKeyValueGrid
            items={[
              {
                label: 'Validaciones OK',
                value: validationCount > 0 ? `${validationOkCount}` : '0',
              },
              {
                label: 'Validaciones fallidas',
                value: validationCount > 0 ? `${validationFailureCount}` : '0',
              },
            ]}
          />
          {validationItems.length > 0 ? (
            validationItems.map((item) => (
              <div
                key={item.key}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium leading-6 text-slate-100">{item.label}</div>
                  <div className="text-xs leading-5 text-slate-400">
                    {item.detail || 'Validación reportada'}
                  </div>
                </div>
                <ResultStatusBadge
                  label={item.ok ? 'OK' : 'Fallo'}
                  tone={item.ok ? 'emerald' : 'rose'}
                />
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-4 text-sm leading-6 text-slate-300">
              {executionNeedsMaterialReview
                ? 'La ejecución no devolvió validaciones finales para mostrar.'
                : 'No hay validaciones disponibles para mostrar.'}
            </div>
          )}
        </div>
      </ResultSectionCard>

      <ResultSectionCard
        title="Cierre operativo"
        description="Contrato minimo del delivery report: estado, evidencia, repo/CI y siguiente paso visible."
      >
        <ResultKeyValueGrid
          items={[
            {
              label: 'Loop operativo',
              value: operationalWorkState,
              detail: operationalWorkStateDetail,
            },
            {
              label: 'Aprobación',
              value: approvalStatusLabel,
              detail: approvalDetailLabel,
            },
            {
              label: 'Repo / Git',
              value: repoStatusValue,
              detail: repoStatusDetail,
            },
            {
              label: 'CI',
              value: ciStatusValue,
              detail: ciStatusDetail,
            },
            {
              label: 'Siguiente paso lógico',
              value: primaryNextStepItem?.title || 'Sin siguiente paso visible',
              detail:
                primaryNextStepItem?.detail ||
                'El cierre todavía no expone una recomendación operativa resumida.',
            },
          ]}
        />
      </ResultSectionCard>

      <ResultSectionCard
        title="Reusable y scope"
        description="Aplicación real de memoria reusable y restricciones respetadas por la corrida."
      >
        <ResultKeyValueGrid
          items={[
            {
              label: 'Reusable',
              value: appliedReuseModeLabel,
              detail: !reuseApplied
                ? 'No se aplicó memoria reusable en esta corrida.'
                : reusableSummaryLabel,
            },
            {
              label: reusableSupportLabel,
              value: reusableSupportValue,
            },
            {
              label: 'Scope',
              value: scopeSummaryLabel,
              detail: continuationAnchor || 'Sin continuation anchor reportado',
            },
            {
              label: 'MEMORIA / Context Hub',
              value: contextHubLabel,
              detail: contextHubDetail,
            },
            {
              label: 'Archivos bloqueados respetados',
              value:
                blockedPaths.length > 0
                  ? scopeRespected
                    ? 'S?'
                    : 'Revisar'
                  : 'No aplica',
              detail:
                blockedPaths.length > 0
                  ? scopeRespected
                    ? 'Los paths bloqueados no aparecen en touchedPaths ni createdPaths.'
                    : 'Hay paths bloqueados que requieren revisión técnica.'
                  : 'La corrida no defini? archivos bloqueados.',
            },
          ]}
        />
        {allowedPaths.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {allowedPaths.map((pathValue) => (
              <div
                key={`allowed-${pathValue}`}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
              >
                {pathValue}
              </div>
            ))}
          </div>
        ) : null}
        {scopeSuccessCriteria.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {scopeSuccessCriteria.map((criterion) => (
              <div
                key={criterion}
                className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3 text-sm leading-6 text-slate-200"
              >
                {criterion}
              </div>
            ))}
          </div>
        ) : null}
      </ResultSectionCard>
    </>
  )
}