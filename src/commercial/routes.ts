export type CommercialRoute =
  | { kind: 'home' }
  | { kind: 'build' }
  | { kind: 'projects' }
  | { kind: 'project'; projectId: string }
  | { kind: 'projectVersion'; projectId: string; versionId: string }
  | { kind: 'operation' }
  | { kind: 'notFound'; path: string }

const safeSegment = (value: string) => {
  if (!value || value === '.' || value === '..' || value.includes('/') || value.includes('\\') || value.startsWith('.')) return false
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,119}$/u.test(value)
}

const decodeSegment = (value: string) => {
  try {
    const decoded = decodeURIComponent(value)
    return safeSegment(decoded) ? decoded : null
  } catch {
    return null
  }
}

export function parseRoute(pathname: string): CommercialRoute {
  const path = pathname || '/'
  if (path === '/' || path === '') return { kind: 'home' }
  const parts = path.replace(/\/+$/u, '').split('/').filter(Boolean)
  if (parts.length === 1 && parts[0] === 'build') return { kind: 'build' }
  if (parts.length === 1 && parts[0] === 'projects') return { kind: 'projects' }
  if (parts.length === 1 && parts[0] === 'operation') return { kind: 'operation' }
  if (parts[0] !== 'projects' || parts.length < 2) return { kind: 'notFound', path }
  const projectId = decodeSegment(parts[1])
  if (!projectId) return { kind: 'notFound', path }
  if (parts.length === 2) return { kind: 'project', projectId }
  if (parts.length === 4 && parts[2] === 'versions') {
    const versionId = decodeSegment(parts[3])
    if (versionId) return { kind: 'projectVersion', projectId, versionId }
  }
  return { kind: 'notFound', path }
}

export function routePath(route: CommercialRoute): string {
  switch (route.kind) {
    case 'home': return '/'
    case 'build': return '/build'
    case 'projects': return '/projects'
    case 'operation': return '/operation'
    case 'project': return `/projects/${encodeURIComponent(route.projectId)}`
    case 'projectVersion': return `/projects/${encodeURIComponent(route.projectId)}/versions/${encodeURIComponent(route.versionId)}`
    case 'notFound': return route.path
  }
}
