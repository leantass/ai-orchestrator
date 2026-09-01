/* eslint-disable @typescript-eslint/no-explicit-any -- adapters mirror semantic bridge payloads. */
import { humanStateLabel } from './hubModel'

type ElectronBridge = Record<string, (...args: any[]) => Promise<any>>

const electron = () => (window as Window & { jefeProjectBridge?: ElectronBridge }).jefeProjectBridge
const previewElectron = () => (window as Window & { jefePreviewApprovalBridge?: ElectronBridge }).jefePreviewApprovalBridge

async function request(path: string, options: RequestInit = {}) {
  const token = document.querySelector('meta[name="jefe-session"]')?.getAttribute('content') || ''
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !headers.has('Content-Type') && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  const response = await fetch(path, { ...options, headers })
  const result = await response.json().catch(() => ({ ok: false, error: { message: 'Respuesta inválida del servidor JEFE.' } }))
  return result
}

function webClient() {
  const call = (path: string, options?: RequestInit) => request(path, options)
  return {
    listProjects: () => call('/api/projects'),
    getProject: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}`),
    getWorkspaceSnapshot: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/workspace`),
    listVersions: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/versions`),
    createFirstVersion: (payload: unknown) => call('/api/projects', { method: 'POST', body: JSON.stringify(payload) }),
    createVersion: (projectId: string, changeRequest: string, options = {}) => call(`/api/projects/${encodeURIComponent(projectId)}/versions`, { method: 'POST', body: JSON.stringify({ changeRequest, options }) }),
    requestSemanticCorrection: (projectId: string, sourceVersionId: string, idempotencyKey?: string) => call(`/api/projects/${encodeURIComponent(projectId)}/semantic-corrections`, { method: 'POST', body: JSON.stringify({ sourceVersionId, ...(idempotencyKey ? { idempotencyKey } : {}) }) }),
    compareVersions: (projectId: string, leftVersionId: string, rightVersionId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/compare`, { method: 'POST', body: JSON.stringify({ leftVersionId, rightVersionId }) }),
    restoreVersion: (projectId: string, sourceVersionId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/restore`, { method: 'POST', body: JSON.stringify({ sourceVersionId }) }),
    prepareLocalDelivery: (projectId: string, versionId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/delivery`, { method: 'POST', body: JSON.stringify({ versionId }) }),
    openPreview: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/preview/open`, { method: 'POST' }),
    openDelivery: (projectId: string, versionId?: string) => call(`/api/projects/${encodeURIComponent(projectId)}/delivery/open`, { method: 'POST', body: JSON.stringify({ versionId }) }),
    copyPreviewLocation: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/preview/copy`, { method: 'POST' }),
    copyDeliveryLocation: (projectId: string, versionId?: string) => call(`/api/projects/${encodeURIComponent(projectId)}/delivery/copy`, { method: 'POST', body: JSON.stringify({ versionId }) }),
    capabilities: () => call('/api/capabilities'),
    getContextSnapshot: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/context/snapshot`),
    getContextTimeline: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/context/timeline`),
    getContextSyncStatus: (projectId: string) => call(`/api/projects/${encodeURIComponent(projectId)}/context/status`),
    uploadInputAssets: async (projectId: string, files: File[]) => { const form = new FormData(); files.forEach((file) => form.append('files', file, file.name)); return request(`/api/projects/${encodeURIComponent(projectId)}/assets`, { method: 'POST', body: form }) },
    removeInputAsset: (projectId: string, safeName: string) => call(`/api/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(safeName)}`, { method: 'DELETE' }),
    selectInputAssets: async () => {
      const input = document.createElement('input'); input.type = 'file'; input.multiple = true; input.accept = '*/*'
      const result = await new Promise<FileList | null>((resolve) => { input.onchange = () => resolve(input.files); input.click() })
      return { assets: [...(result || [])].map((file) => ({ name: file.name, safeName: file.name.replace(/[^a-zA-Z0-9._-]/gu, '-'), kind: 'reference', size: file.size })) }
    },
  }
}

export function createJefeRuntimeClient() {
  const bridge = electron()
  if (bridge) return bridge
  return webClient()
}

export function isJefeWebRuntime() {
  return !electron()
}

export function createJefePreviewClient() {
  const bridge = previewElectron()
  if (bridge) return bridge
  let preparedPreview: { key: string; url: string } | null = null
  const resolvePreview = (projectId: string, previewRequestId: string) => request(`/api/projects/${encodeURIComponent(projectId)}/previews/${encodeURIComponent(previewRequestId)}/open`, { method: 'POST' }).then((result: any) => { const url = result.url || null; if (result.ok && url) preparedPreview = { key: `${projectId}:${previewRequestId}`, url }; return result })
  return {
    request: (payload: any) => request('/api/previews', { method: 'POST', body: JSON.stringify(payload) }).then((result: any) => result.ok && result.preview ? { ...result, preview: { ...result.preview, stateCode: result.preview.state, state: humanStateLabel(result.preview.state), stateLabel: humanStateLabel(result.preview.state) } } : result),
    readApproval: (projectId: string, previewRequestId: string) => request(`/api/projects/${encodeURIComponent(projectId)}/previews/${encodeURIComponent(previewRequestId)}/approval`).then((result: any) => result.ok && result.approval ? { ...result, approval: { ...result.approval, stateLabel: humanStateLabel(result.approval.state) } } : result),
    review: (payload: any) => request(`/api/previews/${encodeURIComponent(payload.previewRequestId)}/review`, { method: 'POST', body: JSON.stringify(payload) }),
    approval: (payload: any) => request(`/api/previews/${encodeURIComponent(payload.previewRequestId)}/approval`, { method: 'POST', body: JSON.stringify(payload) }),
    prepare: (projectId: string, previewRequestId: string) => resolvePreview(projectId, previewRequestId),
    open: (projectId: string, previewRequestId: string) => { const key = `${projectId}:${previewRequestId}`; const prepared = preparedPreview?.key === key ? preparedPreview.url : null; if (prepared) { const popup = window.open(prepared, '_blank', 'noopener,noreferrer'); return Promise.resolve({ ok: true, url: prepared, openedExternally: Boolean(popup), previewUrl: prepared }) } return resolvePreview(projectId, previewRequestId).then((result: any) => { const previewUrl = result.url || null; const popup = result.ok && previewUrl ? window.open(previewUrl, '_blank', 'noopener,noreferrer') : null; return { ...result, openedExternally: Boolean(result.ok && previewUrl && popup), previewUrl } }) },
  }
}
