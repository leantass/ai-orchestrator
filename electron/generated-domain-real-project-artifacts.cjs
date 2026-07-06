function normalizeOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function uniqueStrings(values, limit = 128) {
  const output = []
  const seen = new Set()

  for (const value of asArray(values)) {
    const normalized = normalizeOptionalString(value)
    if (!normalized) {
      continue
    }

    const key = normalized.toLocaleLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    output.push(normalized)
    if (output.length >= limit) {
      break
    }
  }

  return output
}

function slugify(value, fallback = 'generated-real-project') {
  const normalized = normalizeOptionalString(value)
    .normalize('NFKD')
    .replace(/[^\w\s-]/gu, '')
    .trim()
    .replace(/[\s_]+/gu, '-')
    .replace(/-+/gu, '-')
    .toLocaleLowerCase()

  return normalized || fallback
}

function toIdentifier(value, fallback = 'records') {
  const normalized = normalizeOptionalString(value) || fallback
  const parts = normalized
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .split(/[^a-zA-Z0-9]+/gu)
    .filter(Boolean)

  const identifier = parts
    .map((part, index) => {
      const lowered = part.toLocaleLowerCase()
      return index === 0 ? lowered : lowered.charAt(0).toLocaleUpperCase() + lowered.slice(1)
    })
    .join('')

  const safeIdentifier = identifier || fallback
  return /^[a-zA-Z_$]/u.test(safeIdentifier) ? safeIdentifier : `collection${safeIdentifier}`
}

function singularize(value) {
  const normalized = normalizeOptionalString(value)
  if (normalized.endsWith('ies')) {
    return `${normalized.slice(0, -3)}y`
  }
  if (normalized.endsWith('s') && normalized.length > 3) {
    return normalized.slice(0, -1)
  }
  return normalized
}

function includesAny(value, terms) {
  const lowered = normalizeOptionalString(value).toLocaleLowerCase()
  return terms.some((term) => lowered.includes(term))
}

function collectStateOptions(contract, collectionName) {
  const states = contract && typeof contract.states === 'object' && !Array.isArray(contract.states)
    ? contract.states
    : {}
  const normalizedCollection = normalizeOptionalString(collectionName).toLocaleLowerCase()
  const singular = singularize(normalizedCollection)

  for (const [key, options] of Object.entries(states)) {
    const normalizedKey = normalizeOptionalString(key).toLocaleLowerCase()
    if (
      normalizedKey === normalizedCollection ||
      normalizedKey === singular ||
      normalizedCollection.includes(normalizedKey) ||
      normalizedKey.includes(singular)
    ) {
      const normalizedOptions = uniqueStrings(options, 8)
      if (normalizedOptions.length > 0) {
        return normalizedOptions
      }
    }
  }

  return []
}

function field(type) {
  return type
}

function buildFieldsForCollection({ collectionName, contract, roles, workflowsText }) {
  const name = normalizeOptionalString(collectionName).toLocaleLowerCase()
  const stateOptions = collectStateOptions(contract, collectionName)
  const statusOptions = stateOptions.length > 0 ? stateOptions : ['new', 'in_progress', 'done']
  const roleOptions = roles.length > 0 ? roles : ['user', 'admin']

  if (includesAny(name, ['ticket'])) {
    return {
      title: field('string'),
      requester: field('string'),
      assignee: field('string'),
      priority: field('enum:low,medium,high,urgent'),
      status: field(`enum:${statusOptions.join(',')}`),
    }
  }

  if (includesAny(name, ['comment', 'message'])) {
    return {
      relatedId: field('string'),
      author: field('string'),
      body: field('string'),
    }
  }

  if (includesAny(name, ['sla', 'metric', 'tracking', 'event'])) {
    return {
      relatedId: field('string'),
      event: field('string'),
      value: field('number'),
    }
  }

  if (includesAny(name, ['user', 'client', 'customer', 'member', 'employee', 'attendee'])) {
    return {
      name: field('string'),
      email: field('email'),
      role: field(`enum:${roleOptions.join(',')}`),
    }
  }

  if (includesAny(name, ['driver', 'professional', 'agent', 'supplier'])) {
    return {
      name: field('string'),
      email: field('email'),
      active: field('boolean'),
    }
  }

  if (includesAny(name, ['category', 'tag'])) {
    return {
      name: field('string'),
      active: field('boolean'),
    }
  }

  if (includesAny(name, ['menuitem', 'menu', 'product', 'item'])) {
    return {
      name: field('string'),
      category: field('string'),
      price: field('number'),
      stock: includesAny(name, ['product']) ? field('number') : field('boolean'),
      active: field('boolean'),
    }
  }

  if (includesAny(name, ['openinghour', 'availability', 'schedule'])) {
    return {
      day: field('string'),
      opens: field('string'),
      closes: field('string'),
      enabled: field('boolean'),
    }
  }

  if (includesAny(name, ['order', 'booking', 'appointment', 'reservation', 'registration', 'shipment'])) {
    return {
      customer: field('string'),
      total: field('number'),
      mode: workflowsText.includes('delivery') ? field('enum:delivery,takeaway') : field('string'),
      status: field(`enum:${statusOptions.join(',')}`),
    }
  }

  if (includesAny(name, ['lead', 'inquiry', 'request'])) {
    return {
      name: field('string'),
      email: field('email'),
      message: field('string'),
      status: field(`enum:${statusOptions.join(',')}`),
    }
  }

  return {
    name: field('string'),
    status: field(`enum:${statusOptions.join(',')}`),
    active: field('boolean'),
  }
}

function sampleValueForField({ fieldName, type, index, roles }) {
  const normalizedField = normalizeOptionalString(fieldName).toLocaleLowerCase()
  if (type === 'number') {
    return index * 10
  }
  if (type === 'boolean') {
    return true
  }
  if (type === 'email') {
    return `demo-${index}@example.test`
  }
  if (type === 'date') {
    return `2026-07-${String(10 + index).padStart(2, '0')}`
  }
  if (type.startsWith('enum:')) {
    const options = type.slice(5).split(',').filter(Boolean)
    return options[Math.min(index - 1, options.length - 1)] || options[0] || 'new'
  }
  if (normalizedField.includes('role') && roles.length > 0) {
    return roles[Math.min(index - 1, roles.length - 1)]
  }
  if (normalizedField.includes('status')) {
    return index === 1 ? 'new' : 'in_progress'
  }
  if (normalizedField.includes('price') || normalizedField.includes('total')) {
    return String(index * 1000)
  }
  return `Demo ${fieldName} ${index}`
}

function buildSeedRows(collectionName, fields, roles) {
  return [1, 2].map((index) => {
    const row = {}
    for (const [fieldName, type] of Object.entries(fields)) {
      row[fieldName] = sampleValueForField({ fieldName, type, index, roles })
    }
    if (row.name && String(row.name).startsWith('Demo name')) {
      row.name = `${singularize(collectionName)} demo ${index}`
    }
    if (row.title && String(row.title).startsWith('Demo title')) {
      row.title = `${singularize(collectionName)} demo ${index}`
    }
    return row
  })
}

function buildCollections(contract) {
  const roles = uniqueStrings(contract.roles, 12)
  const workflowsText = uniqueStrings(contract.workflows, 24).join(' ').toLocaleLowerCase()
  const tableNames = uniqueStrings(contract?.database?.tables, 32)
  const entityNames = uniqueStrings(contract.entities, 32)
  const sourceNames = tableNames.length > 0 ? tableNames : entityNames
  const normalizedNames = sourceNames.length > 0 ? sourceNames : ['records', 'requests', 'reports']
  const collections = {}

  for (const sourceName of normalizedNames) {
    const collectionName = toIdentifier(sourceName)
    if (collections[collectionName]) {
      continue
    }
    const fields = buildFieldsForCollection({ collectionName, contract, roles, workflowsText })
    collections[collectionName] = {
      label: sourceName
        .replace(/[-_]+/gu, ' ')
        .replace(/\b\w/gu, (letter) => letter.toLocaleUpperCase()),
      fields,
      seed: buildSeedRows(collectionName, fields, roles),
    }
  }

  return collections
}

function sqlType(type) {
  if (type === 'number') return 'REAL'
  if (type === 'boolean') return 'INTEGER'
  return 'TEXT'
}

function sqlCheck(fieldName, type) {
  if (type === 'boolean') {
    return ` CHECK ("${fieldName}" IN (0, 1))`
  }
  if (type === 'number') {
    return ` CHECK ("${fieldName}" >= 0)`
  }
  if (type.startsWith('enum:')) {
    const options = type
      .slice(5)
      .split(',')
      .filter(Boolean)
      .map((option) => `'${option.replace(/'/gu, "''")}'`)
      .join(',')
    return options ? ` CHECK ("${fieldName}" IN (${options}))` : ''
  }
  return ''
}

function buildSchemaSql({ domainLabel, collections }) {
  const tables = Object.entries(collections).map(([collectionName, definition]) => {
    const columns = Object.entries(definition.fields).map(
      ([fieldName, type]) => `  "${fieldName}" ${sqlType(type)} NOT NULL${sqlCheck(fieldName, type)}`,
    )
    return [`CREATE TABLE IF NOT EXISTS "${collectionName}" (`, '  "id" TEXT PRIMARY KEY,', columns.join(',\n'), ');'].join('\n')
  })

  return [`-- SQLite schema for ${domainLabel}`, '-- Runtime DB: data/app.sqlite', '', 'PRAGMA foreign_keys = ON;', '', ...tables].join('\n\n') + '\n'
}

function buildPackageJson(projectSlug) {
  return `${JSON.stringify(
    {
      name: projectSlug,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        start: 'node src/server.mjs',
        'db:init': 'node scripts/seed.mjs',
        seed: 'node scripts/seed.mjs',
        build: 'node scripts/build.mjs',
        smoke: 'node scripts/smoke.mjs',
        validate: 'npm run seed && npm run build && npm run smoke',
      },
    },
    null,
    2,
  )}\n`
}

function buildDomainMjs({ projectSlug, domainLabel, deliveryLevel, roles, collections, contract }) {
  const collectionNames = Object.keys(collections)
  const adminCollection = collectionNames.find((name) => includesAny(name, ['ticket', 'product', 'menu', 'order'])) || collectionNames[0]
  const mainCollection = collectionNames.find((name) => includesAny(name, ['ticket', 'order', 'request', 'reservation'])) || adminCollection
  return `export const PROJECT = ${JSON.stringify(
    {
      slug: projectSlug,
      name: domainLabel,
      type: 'real-project-local-sqlite',
      objective: normalizeOptionalString(contract?.domain?.summary) || `Generated local project for ${domainLabel}.`,
      deliveryLevel,
      publicScreens: ['home', 'dashboard', 'create-record'],
      adminScreens: ['collections', 'crud', 'dashboard'],
      roles,
      mainCollection,
      adminCollection,
      smokeAction: 'seed sqlite, serve API/backoffice, create/update/delete records',
      collections,
    },
    null,
    2,
  )}\n`
}

function buildValidationMjs() {
  return `export function validateRecord(collectionDef, input) {
  const errors = []
  const output = {}
  for (const [field, type] of Object.entries(collectionDef.fields || {})) {
    const raw = input[field]
    if (raw === undefined || raw === null || raw === '') {
      errors.push(field + ' is required')
      continue
    }
    if (type === 'number') {
      const num = Number(raw)
      if (!Number.isFinite(num)) errors.push(field + ' must be a number')
      else output[field] = num
    } else if (type === 'boolean') {
      output[field] = raw === true || raw === 'true'
    } else if (type === 'email') {
      const text = String(raw).trim()
      if (!/^[^@]+@[^@]+\\.[^@]+$/.test(text)) errors.push(field + ' must be an email')
      else output[field] = text
    } else if (type === 'date') {
      const text = String(raw).trim()
      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(text)) errors.push(field + ' must be YYYY-MM-DD')
      else output[field] = text
    } else if (type.startsWith('enum:')) {
      const options = type.slice(5).split(',')
      const text = String(raw).trim()
      if (!options.includes(text)) errors.push(field + ' must be one of ' + options.join(', '))
      else output[field] = text
    } else {
      const text = String(raw).trim()
      if (text.length === 0) errors.push(field + ' must not be empty')
      else output[field] = text
    }
  }
  return { ok: errors.length === 0, errors, data: output }
}

export function sampleForCreate(collectionDef, prefix = 'Smoke') {
  const data = {}
  for (const [field, type] of Object.entries(collectionDef.fields || {})) {
    if (type === 'number') data[field] = 7
    else if (type === 'boolean') data[field] = true
    else if (type === 'email') data[field] = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '@example.test'
    else if (type === 'date') data[field] = '2026-07-20'
    else if (type.startsWith('enum:')) data[field] = type.slice(5).split(',')[0]
    else data[field] = prefix + ' ' + field
  }
  return data
}
`
}

function buildDbMjs() {
  return `import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { PROJECT } from './domain.mjs'
import { validateRecord } from './validation.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const DATA_DIR = path.join(ROOT, 'data')
export const DB_FILE = path.join(DATA_DIR, 'app.sqlite')
export const SEED_FILE = path.join(DATA_DIR, 'seed.json')

function quoteIdentifier(identifier) { return '"' + String(identifier).replace(/"/g, '""') + '"' }
function sqliteType(type) { return type === 'number' ? 'REAL' : type === 'boolean' ? 'INTEGER' : 'TEXT' }
function toDatabaseValue(type, value) { if (type === 'number') return Number(value); if (type === 'boolean') return value === true || value === 'true' ? 1 : 0; return String(value) }
function fromDatabaseValue(type, value) { if (type === 'number') return Number(value); if (type === 'boolean') return Boolean(value); return value }

function ensureSchema(database) {
  for (const [collection, definition] of Object.entries(PROJECT.collections)) {
    const columns = Object.entries(definition.fields).map(([field, type]) => quoteIdentifier(field) + ' ' + sqliteType(type) + ' NOT NULL')
    database.exec('CREATE TABLE IF NOT EXISTS ' + quoteIdentifier(collection) + ' ("id" TEXT PRIMARY KEY, ' + columns.join(', ') + ')')
  }
}

function openDatabase() { ensureDataDir(); const database = new DatabaseSync(DB_FILE); database.exec('PRAGMA foreign_keys = ON'); ensureSchema(database); return database }
function withDatabase(callback) { const database = openDatabase(); try { return callback(database) } finally { database.close() } }

function insertRecord(database, collection, record) {
  const definition = PROJECT.collections[collection]
  const fields = Object.keys(definition.fields)
  const columns = ['id', ...fields].map(quoteIdentifier).join(', ')
  const placeholders = ['?', ...fields.map(() => '?')].join(', ')
  const values = [record.id, ...fields.map((field) => toDatabaseValue(definition.fields[field], record[field]))]
  database.prepare('INSERT INTO ' + quoteIdentifier(collection) + ' (' + columns + ') VALUES (' + placeholders + ')').run(...values)
}

function deserializeRecord(collection, row) {
  const definition = PROJECT.collections[collection]
  const output = { id: row.id }
  for (const [field, type] of Object.entries(definition.fields)) output[field] = fromDatabaseValue(type, row[field])
  return output
}

function exportDatabase(database) {
  const collections = {}
  for (const collection of Object.keys(PROJECT.collections)) {
    const rows = database.prepare('SELECT * FROM ' + quoteIdentifier(collection) + ' ORDER BY id').all()
    collections[collection] = rows.map((row) => deserializeRecord(collection, row))
  }
  return { meta: { project: PROJECT.slug, engine: 'sqlite', dbFile: path.relative(ROOT, DB_FILE).replace(/\\\\/g, '/') }, collections }
}

function clearTables(database) { for (const collection of Object.keys(PROJECT.collections).reverse()) database.prepare('DELETE FROM ' + quoteIdentifier(collection)).run() }

function normalizePatch(definition, input) {
  const errors = []
  const data = {}
  for (const [field, raw] of Object.entries(input || {})) {
    const type = definition.fields[field]
    if (!type) continue
    const validation = validateRecord({ fields: { [field]: type } }, { [field]: raw })
    if (!validation.ok) errors.push(...validation.errors)
    else data[field] = validation.data[field]
  }
  return { ok: errors.length === 0, errors, data }
}

export function ensureDataDir() { fs.mkdirSync(DATA_DIR, { recursive: true }) }
export function loadDb() { if (!fs.existsSync(DB_FILE)) return seedDatabase(true); return withDatabase((database) => exportDatabase(database)) }
export function saveDb(snapshot) { return withDatabase((database) => { clearTables(database); for (const [collection, rows] of Object.entries(snapshot.collections || {})) for (const row of rows) insertRecord(database, collection, row); return exportDatabase(database) }) }
export function seedDatabase(force = false) {
  ensureDataDir()
  const shouldSeed = force || !fs.existsSync(DB_FILE)
  if (force && fs.existsSync(DB_FILE)) fs.rmSync(DB_FILE, { force: true })
  return withDatabase((database) => {
    if (shouldSeed) {
      clearTables(database)
      for (const [collection, definition] of Object.entries(PROJECT.collections)) {
        for (const [index, entry] of (definition.seed || []).entries()) insertRecord(database, collection, { id: 'seed-' + collection + '-' + (index + 1), ...entry })
      }
    }
    return exportDatabase(database)
  })
}
export function listCollections() { return Object.keys(PROJECT.collections) }
export function listRecords(collection) { if (!PROJECT.collections[collection]) return []; return withDatabase((database) => database.prepare('SELECT * FROM ' + quoteIdentifier(collection) + ' ORDER BY id').all().map((row) => deserializeRecord(collection, row))) }
export function createRecord(collection, input) {
  const definition = PROJECT.collections[collection]
  if (!definition) return { ok: false, status: 404, error: 'Unknown collection' }
  const validation = validateRecord(definition, input || {})
  if (!validation.ok) return { ok: false, status: 400, error: 'Validation failed', details: validation.errors }
  const item = { id: collection + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8), ...validation.data }
  return withDatabase((database) => { insertRecord(database, collection, item); return { ok: true, status: 201, data: item } })
}
export function updateRecord(collection, id, input) {
  const definition = PROJECT.collections[collection]
  if (!definition) return { ok: false, status: 404, error: 'Unknown collection' }
  const patch = normalizePatch(definition, input)
  if (!patch.ok) return { ok: false, status: 400, error: 'Validation failed', details: patch.errors }
  const fields = Object.keys(patch.data)
  if (fields.length === 0) return { ok: false, status: 400, error: 'No valid fields to update' }
  return withDatabase((database) => {
    const existing = database.prepare('SELECT * FROM ' + quoteIdentifier(collection) + ' WHERE "id" = ?').get(id)
    if (!existing) return { ok: false, status: 404, error: 'Record not found' }
    const assignments = fields.map((field) => quoteIdentifier(field) + ' = ?').join(', ')
    const values = fields.map((field) => toDatabaseValue(definition.fields[field], patch.data[field]))
    database.prepare('UPDATE ' + quoteIdentifier(collection) + ' SET ' + assignments + ' WHERE "id" = ?').run(...values, id)
    const row = database.prepare('SELECT * FROM ' + quoteIdentifier(collection) + ' WHERE "id" = ?').get(id)
    return { ok: true, status: 200, data: deserializeRecord(collection, row) }
  })
}
export function deleteRecord(collection, id) {
  if (!PROJECT.collections[collection]) return { ok: false, status: 404, error: 'Unknown collection' }
  return withDatabase((database) => { const result = database.prepare('DELETE FROM ' + quoteIdentifier(collection) + ' WHERE "id" = ?').run(id); return result.changes === 0 ? { ok: false, status: 404, error: 'Record not found' } : { ok: true, status: 200, data: { id, deleted: true } } })
}
export function dashboardSummary() { return withDatabase((database) => Object.fromEntries(Object.keys(PROJECT.collections).map((collection) => [collection, database.prepare('SELECT COUNT(*) AS total FROM ' + quoteIdentifier(collection)).get().total]))) }
`
}

function buildServerMjs() {
  return `import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROJECT } from './domain.mjs'
import { createRecord, dashboardSummary, deleteRecord, listCollections, listRecords, seedDatabase, updateRecord } from './db.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = path.join(ROOT, 'public')
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8' }
function send(res, status, payload, headers = {}) { const body = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2); res.writeHead(status, { 'content-type': typeof payload === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8', ...headers }); res.end(body) }
function readBody(req) { return new Promise((resolve) => { let body = ''; req.on('data', (chunk) => { body += chunk }); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}) } catch { resolve({}) } }) }) }
function serveStatic(req, res) { const url = new URL(req.url, 'http://127.0.0.1'); const pathname = url.pathname === '/' ? '/index.html' : url.pathname; const target = path.normalize(path.join(PUBLIC, pathname)); if (!target.startsWith(PUBLIC) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) return false; const ext = path.extname(target); res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream' }); res.end(fs.readFileSync(target)); return true }
export function createAppServer() {
  seedDatabase(false)
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (req.method === 'GET' && url.pathname === '/api/health') return send(res, 200, { ok: true, project: PROJECT.slug, db: 'sqlite' })
    if (req.method === 'GET' && url.pathname === '/api/config') return send(res, 200, PROJECT)
    if (req.method === 'GET' && url.pathname === '/api/dashboard') return send(res, 200, { summary: dashboardSummary() })
    if (req.method === 'POST' && url.pathname === '/api/seed') return send(res, 200, seedDatabase(true))
    const match = url.pathname.match(/^\\/api\\/collections\\/([^/]+)(?:\\/([^/]+))?$/)
    if (match) {
      const [, collection, id] = match
      if (!listCollections().includes(collection)) return send(res, 404, { ok: false, error: 'Unknown collection' })
      if (req.method === 'GET' && !id) return send(res, 200, { ok: true, collection, items: listRecords(collection) })
      if (req.method === 'POST' && !id) { const result = createRecord(collection, await readBody(req)); return send(res, result.status, result) }
      if (req.method === 'PUT' && id) { const result = updateRecord(collection, id, await readBody(req)); return send(res, result.status, result) }
      if (req.method === 'DELETE' && id) { const result = deleteRecord(collection, id); return send(res, result.status, result) }
    }
    if (req.method === 'GET' && serveStatic(req, res)) return
    send(res, 404, { ok: false, error: 'Not found' })
  })
}
if (process.argv[1] && process.argv[1].endsWith('server.mjs')) { const portArgIndex = process.argv.indexOf('--port'); const port = portArgIndex >= 0 ? Number(process.argv[portArgIndex + 1]) : Number(process.env.PORT || 3000); createAppServer().listen(port, '127.0.0.1', () => { console.log('Server listening on http://127.0.0.1:' + port) }) }
`
}

function buildSeedScript() {
  return `import { seedDatabase, DB_FILE } from '../src/db.mjs'
seedDatabase(true)
console.log('Seeded local SQLite DB at ' + DB_FILE)
`
}

function buildBuildScript() {
  return `import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROJECT } from '../src/domain.mjs'
import { seedDatabase, DB_FILE } from '../src/db.mjs'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const required = ['README.md','package.json','src/server.mjs','src/db.mjs','src/validation.mjs','public/index.html','public/admin.html','public/app.js','database/schema.sql','data/seed.json']
const missing = required.filter((entry) => !fs.existsSync(path.join(root, entry)))
const snapshot = seedDatabase(false)
if (!fs.existsSync(DB_FILE)) missing.push('data/app.sqlite')
if (!snapshot.meta || snapshot.meta.engine !== 'sqlite') missing.push('sqlite metadata')
const report = { ok: missing.length === 0, project: PROJECT.slug, dbEngine: 'sqlite', dbFile: path.relative(root, DB_FILE).replace(/\\\\/g, '/'), required, missing, checkedAt: new Date().toISOString() }
fs.mkdirSync(path.join(root, 'validation'), { recursive: true })
fs.writeFileSync(path.join(root, 'validation', 'build-report.json'), JSON.stringify(report, null, 2))
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1) }
console.log('Build check passed for ' + PROJECT.slug + ' using SQLite')
`
}

function buildSmokeScript() {
  return `import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAppServer } from '../src/server.mjs'
import { PROJECT } from '../src/domain.mjs'
import { DB_FILE, seedDatabase } from '../src/db.mjs'
import { sampleForCreate } from '../src/validation.mjs'
seedDatabase(true)
const server = createAppServer()
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []
function fail(message) { failures.push(message) }
function patchForUpdate(collection) {
  const fields = PROJECT.collections[collection].fields
  for (const [field, type] of Object.entries(fields)) if (type.startsWith('enum:')) { const options = type.slice(5).split(','); return { [field]: options[1] || options[0] } }
  for (const [field, type] of Object.entries(fields)) { if (type === 'boolean') return { [field]: false }; if (type === 'number') return { [field]: 99 }; if (type === 'email') return { [field]: 'updated@example.test' }; if (type === 'date') return { [field]: '2026-07-21' }; return { [field]: 'Updated ' + field } }
  return {}
}
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const base = 'http://127.0.0.1:' + port
async function getJson(url, options) { const res = await fetch(base + url, options); return { status: res.status, body: await res.json() } }
try {
  const health = await getJson('/api/health')
  if (health.status !== 200 || health.body.ok !== true) fail('health endpoint failed')
  const adminHtml = await fetch(base + '/admin.html')
  const adminText = await adminHtml.text()
  if (adminHtml.status !== 200 || !adminText.includes('record-form')) fail('admin html not served with CRUD form')
  const appJs = await fetch(base + '/app.js')
  const appJsText = await appJs.text()
  if (appJs.status !== 200 || !appJsText.includes('renderRows')) fail('backoffice client app not served')
  const mainCollection = PROJECT.mainCollection
  const adminCollection = PROJECT.adminCollection
  const before = await getJson('/api/collections/' + mainCollection)
  if (!Array.isArray(before.body.items) || before.body.items.length === 0) fail('main collection has no seed rows')
  const created = await getJson('/api/collections/' + mainCollection, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sampleForCreate(PROJECT.collections[mainCollection], 'Smoke ' + PROJECT.slug)) })
  if (created.status !== 201 || !created.body.data?.id) fail('create main record failed')
  const updated = await getJson('/api/collections/' + mainCollection + '/' + created.body.data.id, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patchForUpdate(mainCollection)) })
  if (updated.status !== 200 || !updated.body.data?.id) fail('update main record failed')
  const adminCreated = await getJson('/api/collections/' + adminCollection, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sampleForCreate(PROJECT.collections[adminCollection], 'Admin Smoke ' + PROJECT.slug)) })
  if (adminCreated.status !== 201 || !adminCreated.body.data?.id) fail('admin create failed')
  const adminDeleted = await getJson('/api/collections/' + adminCollection + '/' + adminCreated.body.data.id, { method: 'DELETE' })
  if (adminDeleted.status !== 200 || adminDeleted.body.data?.deleted !== true) fail('admin delete failed')
  const dashboard = await getJson('/api/dashboard')
  if (!dashboard.body.summary || typeof dashboard.body.summary !== 'object') fail('dashboard summary failed')
  if (!fs.existsSync(DB_FILE) || !DB_FILE.endsWith('app.sqlite')) fail('SQLite DB file missing')
} finally {
  await new Promise((resolve) => server.close(resolve))
}
const report = { ok: failures.length === 0, failures, project: PROJECT.slug, dbEngine: 'sqlite', dbFile: path.relative(root, DB_FILE).replace(/\\\\/g, '/'), checkedAt: new Date().toISOString() }
fs.mkdirSync(path.join(root, 'validation'), { recursive: true })
fs.writeFileSync(path.join(root, 'validation', 'smoke-report.json'), JSON.stringify(report, null, 2))
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1) }
console.log('Smoke passed for ' + PROJECT.slug + ' using SQLite')
`
}

function buildAppJs() {
  return `const isAdmin = document.body.dataset.admin === 'true'
const summary = document.querySelector('#summary')
const list = document.querySelector('#collection-list')
const form = document.querySelector('#record-form')
const feedback = document.querySelector('#feedback')
const api = (url, options = {}) => fetch(url, { headers: { 'content-type': 'application/json' }, ...options }).then(async (res) => ({ status: res.status, body: await res.json() }))
const config = await api('/api/config').then((result) => result.body)
let activeCollection = isAdmin ? config.adminCollection : config.mainCollection
function escapeHtml(value) { const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }; return String(value).replace(/[&<>"']/g, (character) => map[character]) }
async function renderSummary() { const dashboard = await api('/api/dashboard').then((result) => result.body); summary.innerHTML = Object.entries(dashboard.summary || {}).map(([collection, count]) => '<span><b>' + count + '</b>' + escapeHtml(collection) + '</span>').join('') }
function patchForQuickEdit(definition) { for (const [field, type] of Object.entries(definition.fields)) if (type.startsWith('enum:')) { const options = type.slice(5).split(','); return { [field]: options[1] || options[0] } } for (const [field, type] of Object.entries(definition.fields)) { if (type === 'boolean') return { [field]: false }; if (type === 'number') return { [field]: 99 }; if (type === 'email') return { [field]: 'updated@example.test' }; if (type === 'date') return { [field]: '2026-07-21' }; return { [field]: 'Updated ' + field } } return {} }
function renderCollectionTabs() { if (!isAdmin) return ''; return '<div class="collection-tabs">' + Object.entries(config.collections).map(([collection, definition]) => '<button type="button" data-collection="' + collection + '">' + escapeHtml(definition.label) + '</button>').join('') + '</div>' }
async function renderRows() {
  const definition = config.collections[activeCollection]
  const rows = await api('/api/collections/' + activeCollection).then((result) => result.body.items || [])
  list.innerHTML = renderCollectionTabs() + '<h3>' + escapeHtml(definition.label) + '</h3>' + rows.map((row) => '<article class="row"><strong>' + escapeHtml(row.title || row.name || row.code || row.customer || row.id) + '</strong><small>' + escapeHtml(JSON.stringify(row)) + '</small><span><button data-edit="' + row.id + '">Editar</button><button data-delete="' + row.id + '">Eliminar</button></span></article>').join('')
  list.querySelectorAll('button[data-collection]').forEach((button) => button.addEventListener('click', async () => { activeCollection = button.dataset.collection; renderForm(); await renderRows() }))
  list.querySelectorAll('button[data-edit]').forEach((button) => button.addEventListener('click', async () => { const result = await api('/api/collections/' + activeCollection + '/' + button.dataset.edit, { method: 'PUT', body: JSON.stringify(patchForQuickEdit(definition)) }); feedback.textContent = JSON.stringify(result.body, null, 2); await renderSummary(); await renderRows() }))
  list.querySelectorAll('button[data-delete]').forEach((button) => button.addEventListener('click', async () => { const result = await api('/api/collections/' + activeCollection + '/' + button.dataset.delete, { method: 'DELETE' }); feedback.textContent = JSON.stringify(result.body, null, 2); await renderSummary(); await renderRows() }))
}
function inputFor(field, type) { if (type === 'number') return '<input name="' + field + '" type="number" value="5" required>'; if (type === 'boolean') return '<select name="' + field + '"><option value="true">true</option><option value="false">false</option></select>'; if (type === 'email') return '<input name="' + field + '" type="email" value="demo@example.test" required>'; if (type === 'date') return '<input name="' + field + '" type="date" value="2026-07-20" required>'; if (type.startsWith('enum:')) return '<select name="' + field + '">' + type.slice(5).split(',').map((item) => '<option value="' + item + '">' + item + '</option>').join('') + '</select>'; return '<input name="' + field + '" value="' + escapeHtml('Demo ' + field) + '" required>' }
function renderForm() { const definition = config.collections[activeCollection]; form.innerHTML = '<h3>Crear registro en ' + escapeHtml(definition.label) + '</h3>' + Object.entries(definition.fields).map(([field, type]) => '<label>' + escapeHtml(field) + inputFor(field, type) + '</label>').join('') + '<button type="submit">Guardar</button>' }
form.addEventListener('submit', async (event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(form).entries()); const result = await api('/api/collections/' + activeCollection, { method: 'POST', body: JSON.stringify(data) }); feedback.textContent = JSON.stringify(result.body, null, 2); await renderSummary(); await renderRows() })
await renderSummary(); renderForm(); await renderRows()
`
}

function buildCss() {
  return ':root{font-family:Verdana,sans-serif;color:#17202a;background:#f6f3ea}body{margin:0}.topbar{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#102820;color:white}.topbar a{color:white;margin-left:16px}.layout{max-width:1180px;margin:0 auto;padding:24px;display:grid;gap:18px}.hero{background:#f1c27d;padding:28px;border-radius:8px}.hero h1{font-size:clamp(2rem,4vw,4rem);margin:.1em 0}.eyebrow{text-transform:uppercase;font-weight:700}.panel{background:white;border:1px solid #ddd;padding:20px;border-radius:8px}.metrics,.collection-tabs{display:flex;flex-wrap:wrap;gap:10px}.metrics span{background:#102820;color:white;padding:10px 12px;border-radius:6px}.collection-tabs{margin-bottom:14px}.collection-tabs button{background:#eef5f0;color:#102820}.row{display:grid;grid-template-columns:minmax(150px,1fr) minmax(220px,2fr) auto;gap:10px;align-items:center;border-bottom:1px solid #eee;padding:10px 0}.row span{display:flex;gap:8px;justify-content:flex-end}.row small{overflow-wrap:anywhere}form{display:grid;gap:12px;max-width:620px}label{display:grid;gap:4px;font-weight:700}input,select,button{font:inherit;padding:10px;border:1px solid #bbb;border-radius:6px}button{background:#102820;color:white;cursor:pointer}pre{white-space:pre-wrap;background:#17202a;color:white;padding:12px;border-radius:6px}@media(max-width:700px){.topbar{display:block}.row{grid-template-columns:1fr}.row span{justify-content:flex-start}.layout{padding:14px}}\n'
}

function buildHtml({ domainLabel, deliveryLevel, screens, admin = false }) {
  const title = admin ? `${domainLabel} - Backoffice` : domainLabel
  const panels = screens.map((entry) => `<li>${entry}</li>`).join('')
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body data-admin="${admin ? 'true' : 'false'}">
  <header class="topbar"><strong>${title}</strong><nav><a href="/">Publico</a><a href="/admin.html">Backoffice</a></nav></header>
  <main class="layout">
    <section class="hero"><p class="eyebrow">${deliveryLevel}</p><h1>${title}</h1><p>Proyecto local real generado por JEFE con SQLite, API REST y backoffice CRUD.</p><div id="summary" class="metrics">Cargando datos...</div></section>
    <section class="panel"><h2>${admin ? 'Backoffice CRUD' : 'Superficie publica'}</h2><ul>${panels}</ul></section>
    <section class="panel"><h2>${admin ? 'Operaciones' : 'Accion principal'}</h2><div id="collection-list"></div><form id="record-form"></form><pre id="feedback"></pre></section>
  </main>
  <script type="module" src="/app.js"></script>
</body>
</html>
`
}

function buildReadme({ domainLabel }) {
  return `# ${domainLabel}

Proyecto local real generado por JEFE.

## Stack

- Runtime: Node.js ESM sin dependencias externas
- DB local: SQLite real persistido en \`data/app.sqlite\` via \`node:sqlite\`
- Backend/API: Node.js HTTP server con REST CRUD
- Frontend: HTML/CSS/JS estatico
- Backoffice: \`/admin.html\` con CRUD multi-coleccion
- Seed: \`data/seed.json\` + \`npm run seed\`
- Schema: \`database/schema.sql\`

## Comandos

\`\`\`powershell
npm run seed
npm run build
npm run smoke
npm start
\`\`\`

## Validacion

El smoke verifica DB SQLite creada, seed insertado, API leyendo desde DB, backoffice servido, cliente JS servido y operaciones create/update/delete.

## Restricciones

- Sin servicios externos
- Sin credenciales reales
- Sin DB productiva
- Sin pagos reales
`
}

function buildValidationReport({ templateFamily, domainLabel, projectRoot }) {
  return `${JSON.stringify(
    {
      status: 'pending-materialization',
      templateFamily,
      domain: domainLabel,
      projectRoot,
      dbEngine: 'sqlite',
      sandboxOnly: true,
    },
    null,
    2,
  )}\n`
}

function buildGeneratedDomainRealProjectArtifacts({
  templateFamily,
  projectRoot,
  domainLabel,
  deliveryLevel,
  generatedDomainContract,
  stackProfile,
}) {
  const normalizedTemplateFamily = normalizeOptionalString(templateFamily) || 'node-sqlite-rest-backoffice'
  const normalizedProjectRoot = normalizeOptionalString(projectRoot)
  if (!normalizedProjectRoot) {
    return null
  }

  const contract = generatedDomainContract && typeof generatedDomainContract === 'object' ? generatedDomainContract : {}
  const normalizedDomainLabel = normalizeOptionalString(domainLabel) || normalizeOptionalString(contract?.domain?.label) || 'Generated Real Project'
  const normalizedDeliveryLevel = normalizeOptionalString(deliveryLevel) || normalizeOptionalString(contract.deliveryLevel) || 'fullstack-local'
  const projectSlug = slugify(contract?.domain?.slug || normalizedDomainLabel)
  const roles = uniqueStrings(contract.roles, 12)
  const collections = buildCollections(contract)
  const publicScreens = uniqueStrings(asArray(contract.frontendSurfaces).flatMap((surface) => asArray(surface?.screens)), 12)
  const adminScreens = ['collections', 'crud', 'dashboard']
  const filesToCreate = [
    { path: `${normalizedProjectRoot}/README.md`, area: 'docs', content: buildReadme({ domainLabel: normalizedDomainLabel }) },
    { path: `${normalizedProjectRoot}/package.json`, area: 'runtime', content: buildPackageJson(projectSlug) },
    { path: `${normalizedProjectRoot}/src/domain.mjs`, area: 'shared', content: buildDomainMjs({ projectSlug, domainLabel: normalizedDomainLabel, deliveryLevel: normalizedDeliveryLevel, roles, collections, contract }) },
    { path: `${normalizedProjectRoot}/src/validation.mjs`, area: 'shared', content: buildValidationMjs() },
    { path: `${normalizedProjectRoot}/src/db.mjs`, area: 'database', content: buildDbMjs() },
    { path: `${normalizedProjectRoot}/src/server.mjs`, area: 'backend', content: buildServerMjs() },
    { path: `${normalizedProjectRoot}/public/index.html`, area: 'frontend', content: buildHtml({ domainLabel: normalizedDomainLabel, deliveryLevel: normalizedDeliveryLevel, screens: publicScreens.length > 0 ? publicScreens : ['dashboard', 'records', 'create'], admin: false }) },
    { path: `${normalizedProjectRoot}/public/admin.html`, area: 'frontend', content: buildHtml({ domainLabel: normalizedDomainLabel, deliveryLevel: normalizedDeliveryLevel, screens: adminScreens, admin: true }) },
    { path: `${normalizedProjectRoot}/public/app.js`, area: 'frontend', content: buildAppJs() },
    { path: `${normalizedProjectRoot}/public/styles.css`, area: 'frontend', content: buildCss() },
    { path: `${normalizedProjectRoot}/database/schema.sql`, area: 'database', content: buildSchemaSql({ domainLabel: normalizedDomainLabel, collections }) },
    { path: `${normalizedProjectRoot}/data/seed.json`, area: 'database', content: `${JSON.stringify(Object.fromEntries(Object.entries(collections).map(([name, definition]) => [name, definition.seed])), null, 2)}\n` },
    { path: `${normalizedProjectRoot}/scripts/seed.mjs`, area: 'scripts', content: buildSeedScript() },
    { path: `${normalizedProjectRoot}/scripts/build.mjs`, area: 'scripts', content: buildBuildScript() },
    { path: `${normalizedProjectRoot}/scripts/smoke.mjs`, area: 'scripts', content: buildSmokeScript() },
    { path: `${normalizedProjectRoot}/validation/report.json`, area: 'validation', content: buildValidationReport({ templateFamily: normalizedTemplateFamily, domainLabel: normalizedDomainLabel, projectRoot: normalizedProjectRoot }) },
  ]
  const allowedTargetPaths = uniqueStrings([normalizedProjectRoot, ...filesToCreate.map((entry) => entry.path)], 256)
  const requiredPathGroups = [
    { label: 'runtime-root', candidates: [`${normalizedProjectRoot}/package.json`] },
    { label: 'sqlite-db-layer', candidates: [`${normalizedProjectRoot}/src/db.mjs`, `${normalizedProjectRoot}/database/schema.sql`] },
    { label: 'rest-api', candidates: [`${normalizedProjectRoot}/src/server.mjs`] },
    { label: 'backoffice', candidates: [`${normalizedProjectRoot}/public/admin.html`, `${normalizedProjectRoot}/public/app.js`] },
    { label: 'validation', candidates: [`${normalizedProjectRoot}/scripts/build.mjs`, `${normalizedProjectRoot}/scripts/smoke.mjs`] },
  ]
  const fileChecks = filesToCreate.flatMap((entry) => {
    const checks = [{ type: 'exists', targetPath: entry.path }]
    if (entry.path.endsWith('/src/db.mjs')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'node:sqlite' })
    if (entry.path.endsWith('/public/app.js')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'data-delete' })
    if (entry.path.endsWith('/scripts/smoke.mjs')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'admin create failed' })
    return checks
  })

  return {
    present: true,
    built: true,
    templateFamily: normalizedTemplateFamily,
    projectRoot: normalizedProjectRoot,
    stackProfile: stackProfile || contract.stackProfile || null,
    frontendPaths: filesToCreate.filter((entry) => entry.area === 'frontend').map((entry) => entry.path),
    backendPaths: filesToCreate.filter((entry) => entry.area === 'backend').map((entry) => entry.path),
    databasePaths: filesToCreate.filter((entry) => entry.area === 'database').map((entry) => entry.path),
    sharedPaths: filesToCreate.filter((entry) => entry.area === 'shared').map((entry) => entry.path),
    docsPaths: filesToCreate.filter((entry) => entry.area === 'docs').map((entry) => entry.path),
    validationPaths: filesToCreate.filter((entry) => entry.area === 'validation').map((entry) => entry.path),
    allowedTargetPaths,
    requiredPathGroups,
    fileChecks,
    validationPlan: {
      commands: ['npm run seed', 'npm run build', 'npm run smoke'],
      syntaxChecks: [`${normalizedProjectRoot}/src/server.mjs`, `${normalizedProjectRoot}/src/db.mjs`, `${normalizedProjectRoot}/public/app.js`],
      jsonChecks: [`${normalizedProjectRoot}/package.json`, `${normalizedProjectRoot}/data/seed.json`, `${normalizedProjectRoot}/validation/report.json`],
      pathChecks: [normalizedProjectRoot, `${normalizedProjectRoot}/data/app.sqlite`],
      forbiddenPathChecks: ['.env', 'node_modules', 'Dockerfile', 'docker-compose.yml', 'deploy', 'web-prueba'],
    },
    forbiddenSignals: ['.env', 'node_modules', 'Dockerfile', 'docker-compose.yml', 'deploy', 'web-prueba', 'client_secret', 'ACCESS_TOKEN'],
    filesToCreate,
  }
}

module.exports = {
  buildGeneratedDomainRealProjectArtifacts,
}