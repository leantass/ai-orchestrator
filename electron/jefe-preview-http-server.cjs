const fs = require('fs')
const http = require('http')
const path = require('path')

const MIME = Object.freeze({ '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon' })
const servers = new Map()

function inside(root, candidate) {
  const relative = path.relative(root, candidate)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function resolveStaticFile(root, requestPath) {
  let decoded
  try { decoded = decodeURIComponent(requestPath) } catch { return null }
  if (!decoded.startsWith('/') || decoded.includes('\0')) return null
  const relative = decoded === '/' ? 'index.html' : decoded.slice(1)
  const candidate = path.resolve(root, relative)
  if (!inside(root, candidate) || !fs.existsSync(candidate) || !fs.statSync(candidate).isFile()) return null
  return candidate
}

function createServer(root) {
  const allowedRoot = path.resolve(root)
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1')
    const filePath = resolveStaticFile(allowedRoot, requestUrl.pathname)
    if (!filePath) { response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); response.end('Not found'); return }
    response.writeHead(200, { 'content-type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' })
    fs.createReadStream(filePath).on('error', () => { if (!response.headersSent) response.writeHead(500); response.end() }).pipe(response)
  })
  return { allowedRoot, server }
}

async function servePreview(root) {
  const allowedRoot = path.resolve(root)
  const existing = servers.get(allowedRoot)
  if (existing) return existing
  const { server } = createServer(allowedRoot)
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (!address || typeof address === 'string' || !address.port) { await new Promise((resolve) => server.close(resolve)); throw new Error('PREVIEW_HTTP_SERVER_ADDRESS_UNAVAILABLE') }
  const record = { root: allowedRoot, port: address.port, url: `http://127.0.0.1:${address.port}/`, server }
  servers.set(allowedRoot, record)
  return record
}

async function closePreviewServers() {
  const records = [...servers.values()]
  servers.clear()
  await Promise.all(records.map((record) => new Promise((resolve) => record.server.close(resolve))))
}

module.exports = { MIME, servePreview, closePreviewServers, resolveStaticFile }
