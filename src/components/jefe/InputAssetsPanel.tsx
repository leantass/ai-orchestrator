export type JefeInputAsset = {
  id: string
  originalName: string
  safeName: string
  extension: string
  size: number
  kind: 'logo' | 'image' | 'pdf' | 'text' | 'markdown' | 'unknown_allowed' | string
  sourcePath?: string
  usageHint?: string
}

export type JefeInputAssetBlocked = {
  originalName?: string
  error?: string
}

type InputAssetsPanelProps = {
  assets: JefeInputAsset[]
  blockedAssets: JefeInputAssetBlocked[]
  brandColors: string
  visualNotes: string
  message: string
  onAssetsChange: (assets: JefeInputAsset[]) => void
  onBlockedAssetsChange: (blockedAssets: JefeInputAssetBlocked[]) => void
  onBrandColorsChange: (brandColors: string) => void
  onVisualNotesChange: (visualNotes: string) => void
  onMessageChange: (message: string) => void
}

declare global {
  interface Window {
    jefeInputAssetsBridge?: {
      selectInputAssets?: () => Promise<{
        ok: boolean
        canceled?: boolean
        assets?: JefeInputAsset[]
        blocked?: JefeInputAssetBlocked[]
        totalFiles?: number
        totalBytes?: number
        logoCandidate?: JefeInputAsset | null
        error?: string
      }>
    }
  }
}

function formatAssetSize(bytes: number) {
  return `${Math.ceil(bytes / 1024)} KB`
}

export function InputAssetsPanel({
  assets,
  blockedAssets,
  brandColors,
  visualNotes,
  message,
  onAssetsChange,
  onBlockedAssetsChange,
  onBrandColorsChange,
  onVisualNotesChange,
  onMessageChange,
}: InputAssetsPanelProps) {
  const totalBytes = assets.reduce((sum, asset) => sum + asset.size, 0)

  const handleSelectInputAssets = async () => {
    const bridge = window.jefeInputAssetsBridge
    if (!bridge?.selectInputAssets) {
      onMessageChange('Selector de materiales no disponible en este entorno.')
      return
    }

    const response = await bridge.selectInputAssets()
    if (!response?.ok) {
      onMessageChange(response?.error || 'No se pudieron agregar materiales.')
      return
    }
    if (response.canceled) return

    const bySafeName = new Map(assets.map((asset) => [asset.safeName, asset]))
    for (const asset of response.assets || []) bySafeName.set(asset.safeName, asset)

    onAssetsChange(Array.from(bySafeName.values()).slice(0, 20))
    onBlockedAssetsChange(response.blocked || [])
    onMessageChange(
      `${response.assets?.length || 0} materiales agregados. Los materiales se copian localmente al proyecto. No se suben a internet.`,
    )
  }

  const handleRemoveInputAsset = (assetId: string) => {
    onAssetsChange(assets.filter((asset) => asset.id !== assetId))
  }

  return (
    <section className="jefe-input-assets-panel" aria-label="Materiales de entrada">
      <div className="jefe-input-assets-header">
        <div>
          <strong>Materiales de entrada</strong>
          <span>Se copian localmente. No se suben a internet ni se ejecutan.</span>
        </div>
        <button type="button" onClick={handleSelectInputAssets}>
          Agregar archivos
        </button>
      </div>

      <label htmlFor="jefe-input-assets-brand-colors">Colores hex de marca</label>
      <textarea
        id="jefe-input-assets-brand-colors"
        value={brandColors}
        onChange={(event) => onBrandColorsChange(event.target.value)}
        rows={2}
        className="jefe-input-assets-textarea"
        placeholder="primario: #111827, secundario: #f97316"
      />

      <label htmlFor="jefe-input-assets-visual-notes">Notas visuales</label>
      <textarea
        id="jefe-input-assets-visual-notes"
        value={visualNotes}
        onChange={(event) => onVisualNotesChange(event.target.value)}
        rows={2}
        className="jefe-input-assets-textarea"
        placeholder="Estilo, tono visual, restricciones o preferencias."
      />

      <div className="jefe-input-assets-list">
        {assets.length > 0 ? (
          assets.map((asset) => (
            <div key={asset.id}>
              <span>{asset.originalName}</span>
              <small>{asset.kind} · {formatAssetSize(asset.size)}</small>
              <button type="button" onClick={() => handleRemoveInputAsset(asset.id)}>
                Quitar
              </button>
            </div>
          ))
        ) : (
          <p>Sin archivos cargados.</p>
        )}
      </div>

      <p className="jefe-input-assets-status">
        Peso total: {formatAssetSize(totalBytes)}
      </p>
      {message ? <p className="jefe-input-assets-status">{message}</p> : null}
      {blockedAssets.length > 0 ? (
        <p className="jefe-input-assets-status">
          Bloqueados: {blockedAssets.map((asset) => asset.originalName || asset.error || 'archivo').join(', ')}
        </p>
      ) : null}
    </section>
  )
}
