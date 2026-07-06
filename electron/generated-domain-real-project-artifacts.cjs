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

function replaceCollection(collections, name, label, fields, seed) {
  if (!collections[name]) {
    return
  }
  collections[name] = { label, fields, seed }
}

function applyOperationalB2BCollections(collections) {
  replaceCollection(
    collections,
    'companies',
    'Empresas',
    { name: field('string'), status: field('enum:active,paused'), active: field('boolean') },
    [
      { name: 'Acme Salud', status: 'active', active: true },
      { name: 'Norte Logistica', status: 'active', active: true },
    ],
  )
  replaceCollection(
    collections,
    'costCenters',
    'Centros de costo',
    { name: field('string'), companyId: field('string'), active: field('boolean') },
    [
      { name: 'Planta Norte', companyId: 'seed-companies-1', active: true },
      { name: 'Administracion Central', companyId: 'seed-companies-1', active: true },
    ],
  )
  replaceCollection(
    collections,
    'employees',
    'Empleados',
    { name: field('string'), email: field('email'), role: field('enum:employee,company_admin,kitchen_operator,restaurant_admin,system_admin'), companyId: field('string'), costCenterId: field('string'), active: field('boolean') },
    [
      { name: 'Lucia Perez', email: 'lucia.perez@example.test', role: 'employee', companyId: 'seed-companies-1', costCenterId: 'seed-costCenters-1', active: true },
      { name: 'Mateo Gomez', email: 'mateo.gomez@example.test', role: 'employee', companyId: 'seed-companies-1', costCenterId: 'seed-costCenters-2', active: false },
    ],
  )
  replaceCollection(
    collections,
    'menus',
    'Menus',
    { name: field('string'), date: field('date'), active: field('boolean') },
    [
      { name: 'Menu ejecutivo lunes', date: '2026-07-20', active: true },
      { name: 'Menu vegetariano lunes', date: '2026-07-20', active: true },
    ],
  )
  replaceCollection(
    collections,
    'menuItems',
    'Platos',
    { name: field('string'), menuId: field('string'), category: field('string'), price: field('number'), active: field('boolean') },
    [
      { name: 'Milanesa con pure', menuId: 'seed-menus-1', category: 'principal', price: 5200, active: true },
      { name: 'Ensalada completa', menuId: 'seed-menus-2', category: 'principal', price: 4800, active: true },
    ],
  )
  replaceCollection(
    collections,
    'extras',
    'Extras',
    { name: field('string'), price: field('number'), active: field('boolean') },
    [
      { name: 'Pan integral', price: 300, active: true },
      { name: 'Fruta', price: 450, active: true },
    ],
  )
  replaceCollection(
    collections,
    'orders',
    'Pedidos',
    { employeeId: field('string'), companyId: field('string'), costCenterId: field('string'), menuId: field('string'), menuItemId: field('string'), extras: field('string'), date: field('date'), cutoffHour: field('number'), total: field('number'), status: field('enum:draft,pending,confirmed,preparing,prepared,delivered,cancelled') },
    [
      { employeeId: 'seed-employees-1', companyId: 'seed-companies-1', costCenterId: 'seed-costCenters-1', menuId: 'seed-menus-1', menuItemId: 'seed-menuItems-1', extras: 'Pan integral', date: '2026-07-19', cutoffHour: 11, total: 5500, status: 'confirmed' },
      { employeeId: 'seed-employees-1', companyId: 'seed-companies-1', costCenterId: 'seed-costCenters-2', menuId: 'seed-menus-2', menuItemId: 'seed-menuItems-2', extras: 'Fruta', date: '2026-07-18', cutoffHour: 11, total: 5250, status: 'cancelled' },
    ],
  )
  replaceCollection(
    collections,
    'orderStates',
    'Estados de pedido',
    { orderId: field('string'), status: field('enum:confirmed,prepared,cancelled'), note: field('string'), active: field('boolean') },
    [
      { orderId: 'seed-orders-1', status: 'confirmed', note: 'Pedido confirmado', active: true },
      { orderId: 'seed-orders-2', status: 'cancelled', note: 'Cancelado antes del corte', active: true },
    ],
  )
  replaceCollection(
    collections,
    'productionItems',
    'Produccion',
    { companyId: field('string'), menuItemId: field('string'), dish: field('string'), date: field('date'), quantity: field('number'), status: field('enum:pending,preparing,prepared') },
    [
      { companyId: 'seed-companies-1', menuItemId: 'seed-menuItems-1', dish: 'Milanesa con pure', date: '2026-07-19', quantity: 1, status: 'pending' },
      { companyId: 'seed-companies-1', menuItemId: 'seed-menuItems-2', dish: 'Ensalada completa', date: '2026-07-18', quantity: 0, status: 'prepared' },
    ],
  )
  replaceCollection(
    collections,
    'labels',
    'Etiquetas',
    { orderId: field('string'), employee: field('string'), company: field('string'), costCenter: field('string'), dish: field('string'), extras: field('string'), date: field('date'), status: field('enum:ready,printed_mock') },
    [
      { orderId: 'seed-orders-1', employee: 'Lucia Perez', company: 'Acme Salud', costCenter: 'Planta Norte', dish: 'Milanesa con pure', extras: 'Pan integral', date: '2026-07-19', status: 'ready' },
      { orderId: 'seed-orders-2', employee: 'Lucia Perez', company: 'Acme Salud', costCenter: 'Administracion Central', dish: 'Ensalada completa', extras: 'Fruta', date: '2026-07-18', status: 'printed_mock' },
    ],
  )
  replaceCollection(
    collections,
    'reports',
    'Reportes',
    { companyId: field('string'), date: field('date'), totalOrders: field('number'), cancelledOrders: field('number'), topDish: field('string'), productionTotal: field('number'), status: field('enum:draft,ready') },
    [
      { companyId: 'seed-companies-1', date: '2026-07-19', totalOrders: 1, cancelledOrders: 0, topDish: 'Milanesa con pure', productionTotal: 1, status: 'ready' },
      { companyId: 'seed-companies-1', date: '2026-07-18', totalOrders: 1, cancelledOrders: 1, topDish: 'Ensalada completa', productionTotal: 0, status: 'ready' },
    ],
  )
  replaceCollection(
    collections,
    'cutoffRules',
    'Reglas de corte',
    { companyId: field('string'), cutoffHour: field('number'), active: field('boolean') },
    [
      { companyId: 'seed-companies-1', cutoffHour: 11, active: true },
      { companyId: 'seed-companies-2', cutoffHour: 10, active: true },
    ],
  )
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

  if (hasOperationalB2BSignals({ contract, collections })) {
    applyOperationalB2BCollections(collections)
  }

  return collections
}

function collectionNameIncludes(collectionName, terms) {
  const lowered = normalizeOptionalString(collectionName).toLocaleLowerCase()
  return terms.some((term) => lowered.includes(term))
}

function findCollectionName(collections, terms, fallback = '') {
  const names = Object.keys(collections)
  return names.find((name) => collectionNameIncludes(name, terms)) || fallback || names[0] || 'records'
}

function hasOperationalB2BSignals({ contract, collections }) {
  const surfaceText = asArray(contract.frontendSurfaces)
    .flatMap((surface) => [surface?.key, surface?.label, surface?.path, ...asArray(surface?.screens)])
  const haystack = [
    ...Object.keys(collections),
    ...uniqueStrings(contract.roles, 24),
    ...uniqueStrings(contract.workflows, 48),
    ...uniqueStrings(contract.entities, 48),
    ...surfaceText,
    normalizeOptionalString(contract?.domain?.summary),
    normalizeOptionalString(contract?.domain?.label),
  ].join(' ').toLocaleLowerCase()
  const signals = ['b2b', 'vianda', 'company', 'empresa', 'employee', 'empleado', 'costcenter', 'centro', 'menu', 'order', 'pedido', 'production', 'produccion', 'label', 'etiqueta', 'report']
  return signals.filter((signal) => haystack.includes(signal)).length >= 5
}

function buildRolePageDefinitions({ contract, collections }) {
  if (!hasOperationalB2BSignals({ contract, collections })) {
    return []
  }

  const orders = findCollectionName(collections, ['order', 'pedido', 'booking', 'request'])
  const menus = findCollectionName(collections, ['menu'])
  const menuItems = findCollectionName(collections, ['menuitem', 'item', 'plato', 'product'], menus)
  const extras = findCollectionName(collections, ['extra'], menuItems)
  const employees = findCollectionName(collections, ['employee', 'empleado', 'user', 'member'])
  const companies = findCollectionName(collections, ['company', 'empresa', 'client', 'customer'])
  const costCenters = findCollectionName(collections, ['costcenter', 'centro', 'cost'], companies)
  const production = findCollectionName(collections, ['production', 'produccion'], orders)
  const labels = findCollectionName(collections, ['label', 'etiqueta'], orders)
  const reports = findCollectionName(collections, ['report', 'metric'], orders)
  const sharedCollections = { orders, menus, menuItems, extras, employees, companies, costCenters, production, labels, reports }

  return [
    {
      key: 'employee',
      path: 'public/employee.html',
      title: 'Portal empleado',
      subtitle: 'Menu disponible, pedido, extras, estado, cancelar y historial.',
      collections: sharedCollections,
      requiredTerms: ['menu', 'pedido', 'cancelar', 'estado'],
      sections: [
        { title: 'Menu disponible', body: 'El empleado ve platos, extras y opciones activas antes de confirmar un pedido.' },
        { title: 'Confirmar pedido', body: 'La accion principal crea un pedido real en la API y lo deja listo para produccion.' },
        { title: 'Estado y cancelacion', body: 'Cada pedido muestra estado operativo y permite cancelar antes del corte.' },
      ],
      actions: [
        { label: 'Confirmar pedido demo', action: 'create-order', collection: orders },
        { label: 'Cancelar pedido demo', action: 'cancel-order', collection: orders },
      ],
    },
    {
      key: 'company',
      path: 'public/company.html',
      title: 'Panel empresa',
      subtitle: 'Empleados, centros de costo, pedidos por empleado y reportes de consumo.',
      collections: sharedCollections,
      requiredTerms: ['empleados', 'centros', 'reportes'],
      sections: [
        { title: 'Empleados', body: 'Listado operativo de empleados vinculados a empresa y centros de costo.' },
        { title: 'Centros de costo', body: 'Vista para auditar pedidos por centro, fecha y responsable.' },
        { title: 'Reportes', body: 'Resumen de consumo por empleado, empresa, plato y periodo.' },
      ],
      actions: [
        { label: 'Ver empleados', action: 'focus-collection', collection: employees },
        { label: 'Ver reportes', action: 'focus-collection', collection: reports },
      ],
    },
    {
      key: 'provider',
      path: 'public/provider.html',
      title: 'Panel restaurante proveedor',
      subtitle: 'Menus, platos, extras, produccion, etiquetas y pedidos consolidados.',
      collections: sharedCollections,
      requiredTerms: ['menus', 'platos', 'extras', 'produccion'],
      sections: [
        { title: 'Menus y platos', body: 'Gestiona menus, platos, extras y disponibilidad para la operacion diaria.' },
        { title: 'Pedidos consolidados', body: 'Agrupa pedidos confirmados por empresa, centro de costo y plato.' },
        { title: 'Produccion y etiquetas', body: 'Prepara lotes de cocina y datos imprimibles para cada vianda.' },
      ],
      actions: [
        { label: 'Crear menu demo', action: 'create-record', collection: menus },
        { label: 'Ver pedidos', action: 'focus-collection', collection: orders },
      ],
    },
    {
      key: 'kitchen',
      path: 'public/kitchen.html',
      title: 'Panel cocina',
      subtitle: 'Produccion diaria, pendientes, cantidades por plato y preparados.',
      collections: sharedCollections,
      requiredTerms: ['produccion', 'preparado', 'pendientes'],
      sections: [
        { title: 'Pendientes', body: 'Cola de pedidos pendientes para preparar por fecha, empresa y plato.' },
        { title: 'Produccion', body: 'Agrupacion de cantidades por plato, extras y empresa.' },
        { title: 'Preparado', body: 'Accion para marcar items preparados y sostener trazabilidad.' },
      ],
      actions: [
        { label: 'Marcar preparado', action: 'mark-prepared', collection: orders },
        { label: 'Ver produccion', action: 'focus-collection', collection: production },
      ],
    },
    {
      key: 'labels',
      path: 'public/labels.html',
      title: 'Etiquetas',
      subtitle: 'Etiqueta imprimible con empleado, empresa, plato, extras, fecha e ID pedido.',
      collections: sharedCollections,
      requiredTerms: ['etiqueta', 'empleado', 'empresa', 'plato'],
      sections: [
        { title: 'Datos de etiqueta', body: 'Empleado, empresa, centro de costo, plato, extras y observaciones.' },
        { title: 'ID pedido', body: 'Cada etiqueta conserva el ID pedido para control de entrega.' },
        { title: 'Impresion simulada', body: 'La salida queda lista para impresion manual en entorno local.' },
      ],
      actions: [
        { label: 'Ver etiquetas', action: 'focus-collection', collection: labels },
        { label: 'Ver pedidos', action: 'focus-collection', collection: orders },
      ],
    },
    {
      key: 'reports',
      path: 'public/reports.html',
      title: 'Reportes operativos',
      subtitle: 'Pedidos por dia, empresa, plato, extras, cancelados y produccion.',
      collections: sharedCollections,
      requiredTerms: ['pedidos', 'empresa', 'plato', 'produccion'],
      sections: [
        { title: 'Pedidos por empresa', body: 'Indicadores por empresa, centro de costo y empleado.' },
        { title: 'Cantidades por plato', body: 'Reporte de platos, extras y produccion requerida.' },
        { title: 'Cancelados', body: 'Control de pedidos cancelados y estado operativo.' },
      ],
      actions: [
        { label: 'Ver reportes', action: 'focus-collection', collection: reports },
        { label: 'Ver produccion', action: 'focus-collection', collection: production },
      ],
    },
  ]
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
        'domain-smoke': 'node scripts/domain-smoke.mjs',
        validate: 'npm run seed && npm run build && npm run smoke && npm run domain-smoke',
      },
    },
    null,
    2,
  )}\n`
}

function buildDomainMjs({ projectSlug, domainLabel, deliveryLevel, roles, collections, rolePages, contract }) {
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
      rolePages,
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

function buildDomainRulesMjs() {
  return `import { PROJECT } from './domain.mjs'
import { createRecord, listRecords, updateRecord } from './db.mjs'

const roleMode = (PROJECT.rolePages || []).length > 0
const mappedCollections = PROJECT.rolePages?.[0]?.collections || {}
function collection(key) { return mappedCollections[key] || key }
function rows(key) { return listRecords(collection(key)) }
function byId(key, id) { return rows(key).find((row) => row.id === id) }
function ok(status, body) { return { status, body } }
function readBody(req) { return new Promise((resolve) => { let body = ''; req.on('data', (chunk) => { body += chunk }); req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}) } catch { resolve({}) } }) }) }
function firstActive(key) { return rows(key).find((row) => row.active !== false) }
function money(value) { const amount = Number(value); return Number.isFinite(amount) ? amount : 0 }
function sameDate(left, right) { return String(left || '') === String(right || '') }
function activeOrders() { return rows('orders').filter((order) => order.status !== 'cancelled') }
function dishFor(order) { return byId('menuItems', order.menuItemId)?.name || order.menuItemId || 'plato' }
function companyFor(order) { return byId('companies', order.companyId)?.name || order.companyId || 'empresa' }
function employeeFor(order) { return byId('employees', order.employeeId)?.name || order.employeeId || 'empleado' }
function costCenterFor(order) { return byId('costCenters', order.costCenterId)?.name || order.costCenterId || 'centro de costo' }
function orderExtras(order) { return order.extras || 'sin extras' }
function getCutoffHour(companyId, fallback) { const rule = rows('cutoffRules').find((entry) => entry.companyId === companyId && entry.active !== false); return money(rule?.cutoffHour || fallback || 11) }
function sampleOrderDefaults() {
  const employee = firstActive('employees')
  const menu = firstActive('menus')
  const dish = firstActive('menuItems')
  const extra = firstActive('extras')
  return { employee, menu, dish, extra }
}
function createDomainOrder(input) {
  const defaults = sampleOrderDefaults()
  const employee = byId('employees', input.employeeId) || defaults.employee
  if (!employee) return { ok: false, status: 409, code: 'missing_employee', warning: 'No active employee available' }
  if (employee.active === false) return { ok: false, status: 409, code: 'inactive_employee', warning: 'Empleado inactivo no puede pedir' }
  const date = input.date || '2026-07-20'
  const duplicate = rows('orders').find((order) => order.employeeId === employee.id && sameDate(order.date, date) && order.status !== 'cancelled')
  if (duplicate) return { ok: false, status: 409, code: 'duplicate_order', warning: 'Ya existe un pedido principal para ese empleado y dia', data: duplicate }
  const dish = byId('menuItems', input.menuItemId) || defaults.dish
  const extra = byId('extras', input.extraId) || defaults.extra
  const menu = byId('menus', input.menuId) || defaults.menu
  const total = money(dish?.price) + money(extra?.price)
  const companyId = input.companyId || employee.companyId || firstActive('companies')?.id
  const costCenterId = input.costCenterId || employee.costCenterId || firstActive('costCenters')?.id
  const cutoffHour = getCutoffHour(companyId, input.cutoffHour)
  return createRecord(collection('orders'), {
    employeeId: employee.id,
    companyId,
    costCenterId,
    menuId: menu?.id || 'manual-menu',
    menuItemId: dish?.id || 'manual-dish',
    extras: extra?.name || input.extras || 'sin extras',
    date,
    cutoffHour,
    total,
    status: 'confirmed',
  })
}
function cancelDomainOrder(orderId, input) {
  const order = byId('orders', orderId)
  if (!order) return { ok: false, status: 404, code: 'missing_order', warning: 'Pedido inexistente' }
  const nowHour = money(input.nowHour ?? 9)
  const cutoffHour = getCutoffHour(order.companyId, order.cutoffHour)
  if (nowHour > cutoffHour) return { ok: false, status: 409, code: 'cutoff_passed', warning: 'Cancelacion fuera de corte requiere revision manual', data: { orderId, cutoffHour, nowHour } }
  return updateRecord(collection('orders'), orderId, { status: 'cancelled' })
}
function markOrderPrepared(orderId) {
  const order = byId('orders', orderId)
  if (!order) return { ok: false, status: 404, code: 'missing_order', warning: 'Pedido inexistente' }
  return updateRecord(collection('orders'), orderId, { status: 'prepared' })
}
function productionSummary(date) {
  const groups = new Map()
  for (const order of activeOrders().filter((entry) => !date || sameDate(entry.date, date))) {
    const key = order.companyId + '|' + order.menuItemId
    const current = groups.get(key) || { companyId: order.companyId, company: companyFor(order), menuItemId: order.menuItemId, dish: dishFor(order), date: order.date, quantity: 0, orderIds: [] }
    current.quantity += 1
    current.orderIds.push(order.id)
    groups.set(key, current)
  }
  return Array.from(groups.values())
}
function generateLabel(orderId) {
  const order = byId('orders', orderId)
  if (!order) return { ok: false, status: 404, code: 'missing_order', warning: 'Pedido inexistente' }
  return createRecord(collection('labels'), {
    orderId: order.id,
    employee: employeeFor(order),
    company: companyFor(order),
    costCenter: costCenterFor(order),
    dish: dishFor(order),
    extras: orderExtras(order),
    date: order.date,
    status: 'ready',
  })
}
function reportFor(query) {
  const companyId = query.get('companyId') || firstActive('companies')?.id
  const date = query.get('date') || '2026-07-20'
  const filtered = rows('orders').filter((order) => (!companyId || order.companyId === companyId) && (!date || sameDate(order.date, date)))
  const production = productionSummary(date).filter((entry) => !companyId || entry.companyId === companyId)
  const cancelled = filtered.filter((order) => order.status === 'cancelled')
  const topDish = production.sort((left, right) => right.quantity - left.quantity)[0]?.dish || 'sin produccion'
  return { companyId, company: companyId ? byId('companies', companyId)?.name : 'todas', date, totalOrders: filtered.length, cancelledOrders: cancelled.length, productionTotal: production.reduce((sum, entry) => sum + entry.quantity, 0), topDish, production, extras: filtered.map((order) => order.extras).filter(Boolean) }
}
function filteredOrders(query) {
  const companyId = query.get('companyId')
  const costCenterId = query.get('costCenterId')
  return rows('orders').filter((order) => (!companyId || order.companyId === companyId) && (!costCenterId || order.costCenterId === costCenterId))
}
export async function handleDomainRequest(req, url) {
  if (!roleMode || !url.pathname.startsWith('/api/domain/')) return null
  const parts = url.pathname.split('/').filter(Boolean)
  if (req.method === 'GET' && url.pathname === '/api/domain/orders') return ok(200, { ok: true, items: filteredOrders(url.searchParams) })
  if (req.method === 'POST' && url.pathname === '/api/domain/orders') { const result = createDomainOrder(await readBody(req)); return ok(result.status || 201, result) }
  if (req.method === 'POST' && parts[2] === 'orders' && parts[4] === 'cancel') { const result = cancelDomainOrder(parts[3], await readBody(req)); return ok(result.status || 200, result) }
  if (req.method === 'POST' && parts[2] === 'orders' && parts[4] === 'prepared') { const result = markOrderPrepared(parts[3]); return ok(result.status || 200, result) }
  if (req.method === 'GET' && url.pathname === '/api/domain/production') return ok(200, { ok: true, items: productionSummary(url.searchParams.get('date')) })
  if (req.method === 'POST' && url.pathname === '/api/domain/labels') { const body = await readBody(req); const result = generateLabel(body.orderId); return ok(result.status || 201, result) }
  if (req.method === 'GET' && url.pathname === '/api/domain/reports') return ok(200, { ok: true, data: reportFor(url.searchParams) })
  return ok(404, { ok: false, error: 'Unknown domain endpoint' })
}
`
}

function buildServerMjs() {
  return `import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROJECT } from './domain.mjs'
import { createRecord, dashboardSummary, deleteRecord, listCollections, listRecords, seedDatabase, updateRecord } from './db.mjs'
import { handleDomainRequest } from './domain-rules.mjs'

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
    const domainResult = await handleDomainRequest(req, url)
    if (domainResult) return send(res, domainResult.status, domainResult.body)
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
const rolePagePaths = (PROJECT.rolePages || []).map((page) => page.path)
const required = ['README.md','package.json','src/server.mjs','src/db.mjs','src/domain-rules.mjs','src/validation.mjs','public/index.html','public/admin.html','public/app.js','database/schema.sql','data/seed.json','scripts/domain-smoke.mjs', ...rolePagePaths]
if (rolePagePaths.length > 0) required.push('public/role-app.js')
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
  for (const rolePage of PROJECT.rolePages || []) {
    const roleUrl = rolePage.path.startsWith('public/') ? rolePage.path.slice(7) : rolePage.path
    const roleResponse = await fetch(base + '/' + roleUrl)
    const roleText = await roleResponse.text()
    if (roleResponse.status !== 200) fail('role page not served: ' + rolePage.path)
    for (const term of rolePage.requiredTerms || []) if (!roleText.toLocaleLowerCase().includes(term)) fail('role page missing term ' + rolePage.key + ': ' + term)
  }
  if ((PROJECT.rolePages || []).length > 0) {
    const roleApp = await fetch(base + '/role-app.js')
    const roleAppText = await roleApp.text()
    if (roleApp.status !== 200 || !roleAppText.includes('handleAction')) fail('role app not served')
  }
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

function buildRoleAppJs() {
  return `const currentRole = document.body.dataset.rolePage
const summary = document.querySelector('#role-summary')
const workflow = document.querySelector('#role-workflow')
const feedback = document.querySelector('#role-feedback')
const api = (url, options = {}) => fetch(url, { headers: { 'content-type': 'application/json' }, ...options }).then(async (res) => ({ status: res.status, body: await res.json() }))
const config = await api('/api/config').then((result) => result.body)
const page = (config.rolePages || []).find((entry) => entry.key === currentRole)
function escapeHtml(value) { const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }; return String(value).replace(/[&<>"']/g, (character) => map[character]) }
function labelFor(collection) { return config.collections[collection]?.label || collection }
function sampleForCollection(collection, prefix) { const definition = config.collections[collection]; const data = {}; for (const [field, type] of Object.entries(definition?.fields || {})) { if (type === 'number') data[field] = 7; else if (type === 'boolean') data[field] = true; else if (type === 'email') data[field] = prefix.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '@example.test'; else if (type === 'date') data[field] = '2026-07-20'; else if (type.startsWith('enum:')) data[field] = type.slice(5).split(',')[0]; else data[field] = prefix + ' ' + field } return data }
function patchForState(collection, desiredStates) { const fields = config.collections[collection]?.fields || {}; for (const [field, type] of Object.entries(fields)) { if (type.startsWith('enum:')) { const options = type.slice(5).split(','); const selected = options.find((option) => desiredStates.includes(option)) || options[0]; return { [field]: selected } } } return {} }
async function renderSummary() { const dashboard = await api('/api/dashboard').then((result) => result.body); summary.innerHTML = Object.entries(dashboard.summary || {}).map(([collection, count]) => '<span><b>' + count + '</b>' + escapeHtml(labelFor(collection)) + '</span>').join('') }
async function renderCollection(collection) { const result = await api('/api/collections/' + collection); const rows = result.body.items || []; workflow.innerHTML = '<h3>' + escapeHtml(labelFor(collection)) + '</h3>' + rows.slice(0, 8).map((row) => '<article class="row"><strong>' + escapeHtml(row.title || row.name || row.customer || row.id) + '</strong><small>' + escapeHtml(JSON.stringify(row)) + '</small></article>').join('') }
async function handleAction(action) { const collection = action.dataset.collection; const kind = action.dataset.action; if (!collection || !config.collections[collection]) return; let result; if (kind === 'create-order' || kind === 'create-record') result = await api('/api/collections/' + collection, { method: 'POST', body: JSON.stringify(sampleForCollection(collection, currentRole + ' demo')) }); else if (kind === 'cancel-order' || kind === 'mark-prepared') { const rows = await api('/api/collections/' + collection).then((response) => response.body.items || []); const target = rows[0]; const desired = kind === 'cancel-order' ? ['cancelled', 'canceled', 'cancelado'] : ['prepared', 'preparado', 'done']; result = target ? await api('/api/collections/' + collection + '/' + target.id, { method: 'PUT', body: JSON.stringify(patchForState(collection, desired)) }) : { body: { ok: false, error: 'No rows available' } }; } else result = await api('/api/collections/' + collection); feedback.textContent = JSON.stringify(result.body, null, 2); await renderSummary(); await renderCollection(collection) }
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => handleAction(button)))
if (page) await renderCollection(page.actions?.[0]?.collection || config.mainCollection)
await renderSummary()
`
}

function buildRoleHtml({ domainLabel, deliveryLevel, rolePage, rolePages }) {
  const nav = rolePages.map((page) => `<a href="/${page.path.replace(/^public\//u, '')}">${page.title}</a>`).join('')
  const sections = rolePage.sections.map((section) => `<article class="workflow-card"><h3>${section.title}</h3><p>${section.body}</p></article>`).join('')
  const actions = rolePage.actions.map((action) => `<button type="button" data-action="${action.action}" data-collection="${action.collection}">${action.label}</button>`).join('')
  const terms = rolePage.requiredTerms.map((term) => `<span>${term}</span>`).join('')
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${domainLabel} - ${rolePage.title}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body data-role-page="${rolePage.key}">
  <header class="topbar"><strong>${rolePage.title}</strong><nav><a href="/">Publico</a><a href="/admin.html">Backoffice</a>${nav}</nav></header>
  <main class="layout role-layout">
    <section class="hero"><p class="eyebrow">${deliveryLevel}</p><h1>${rolePage.title}</h1><p>${rolePage.subtitle}</p><div id="role-summary" class="metrics">Cargando datos...</div></section>
    <section class="panel"><h2>Workflow operativo</h2><div class="role-grid">${sections}</div><div class="role-actions">${actions}</div><div class="role-terms">${terms}</div></section>
    <section class="panel"><h2>Datos vivos</h2><div id="role-workflow"></div><pre id="role-feedback"></pre></section>
  </main>
  <script type="module" src="/role-app.js"></script>
</body>
</html>
`
}

function buildCss() {
  return ':root{font-family:Verdana,sans-serif;color:#17202a;background:#f6f3ea}body{margin:0}.topbar{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#102820;color:white}.topbar nav{display:flex;gap:12px;flex-wrap:wrap}.topbar a{color:white}.layout{max-width:1180px;margin:0 auto;padding:24px;display:grid;gap:18px}.hero{background:#f1c27d;padding:28px;border-radius:8px}.hero h1{font-size:clamp(2rem,4vw,4rem);margin:.1em 0}.eyebrow{text-transform:uppercase;font-weight:700}.panel{background:white;border:1px solid #ddd;padding:20px;border-radius:8px}.metrics,.collection-tabs,.role-actions,.role-terms{display:flex;flex-wrap:wrap;gap:10px}.metrics span,.role-terms span{background:#102820;color:white;padding:10px 12px;border-radius:6px}.collection-tabs{margin-bottom:14px}.collection-tabs button{background:#eef5f0;color:#102820}.role-layout .hero{background:#d9ead3}.role-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.workflow-card{border:1px solid #d4ded8;background:#f8fbf8;border-radius:8px;padding:16px}.workflow-card h3{margin-top:0}.role-actions{margin:16px 0}.row{display:grid;grid-template-columns:minmax(150px,1fr) minmax(220px,2fr) auto;gap:10px;align-items:center;border-bottom:1px solid #eee;padding:10px 0}.row span{display:flex;gap:8px;justify-content:flex-end}.row small{overflow-wrap:anywhere}form{display:grid;gap:12px;max-width:620px}label{display:grid;gap:4px;font-weight:700}input,select,button{font:inherit;padding:10px;border:1px solid #bbb;border-radius:6px}button{background:#102820;color:white;cursor:pointer}pre{white-space:pre-wrap;background:#17202a;color:white;padding:12px;border-radius:6px}@media(max-width:700px){.topbar{display:block}.topbar nav{margin-top:10px}.row{grid-template-columns:1fr}.row span{justify-content:flex-start}.layout{padding:14px}}\n'
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
- UX por rol: \`/employee.html\`, \`/company.html\`, \`/provider.html\`, \`/kitchen.html\`, \`/labels.html\`, \`/reports.html\` cuando el contrato es operativo B2B
- Seed: \`data/seed.json\` + \`npm run seed\`
- Schema: \`database/schema.sql\`

## Comandos

\`\`\`powershell
npm run seed
npm run build
npm run smoke
npm run domain-smoke
npm start
\`\`\`

## Validacion

El smoke verifica DB SQLite creada, seed insertado, API leyendo desde DB, backoffice servido, cliente JS servido, pantallas por rol cuando existen y operaciones create/update/delete.

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

function buildDomainSmokeScript() {
  return `import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAppServer } from '../src/server.mjs'
import { PROJECT } from '../src/domain.mjs'
import { seedDatabase } from '../src/db.mjs'

seedDatabase(true)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const server = createAppServer()
const failures = []
const flows = []
function fail(message) { failures.push(message) }
function record(flow, ok, evidence = '') { flows.push({ flow, ok, evidence }); if (!ok) fail(flow + (evidence ? ': ' + evidence : '')) }
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = 'http://127.0.0.1:' + server.address().port
async function getJson(url, options) { const response = await fetch(base + url, options); return { status: response.status, body: await response.json() } }
async function createCollection(collection, body) { return getJson('/api/collections/' + collection, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) }
const mappedCollections = PROJECT.rolePages?.[0]?.collections || {}
function collection(key) { return mappedCollections[key] || key }
async function list(collectionName) { return getJson('/api/collections/' + collectionName).then((result) => result.body.items || []) }
try {
  const config = await getJson('/api/config')
  record('config exposes role pages', config.status === 200 && Array.isArray(config.body.rolePages), 'rolePages=' + (config.body.rolePages || []).length)
  for (const page of PROJECT.rolePages || []) {
    const pageUrl = page.path.startsWith('public/') ? page.path.slice(7) : page.path
    const response = await fetch(base + '/' + pageUrl)
    const html = await response.text()
    record('role page exists: ' + page.key, response.status === 200, page.path)
    for (const term of page.requiredTerms || []) record('role page term: ' + page.key + ' ' + term, html.toLocaleLowerCase().includes(term), page.path)
    for (const action of page.actions || []) {
      record('role action collection: ' + page.key + ' ' + action.action, Boolean(PROJECT.collections[action.collection]), action.collection)
    }
  }
  const dashboard = await getJson('/api/dashboard')
  record('dashboard summary available', Boolean(dashboard.body.summary && typeof dashboard.body.summary === 'object'), 'collections=' + Object.keys(dashboard.body.summary || {}).length)
  const companies = collection('companies')
  const employees = collection('employees')
  const costCenters = collection('costCenters')
  const menus = collection('menus')
  const menuItems = collection('menuItems')
  const extras = collection('extras')
  const orders = collection('orders')
  const cutoffRules = collection('cutoffRules')
  const seededCompany = (await list(companies))[0]
  const seededEmployee = (await list(employees)).find((employee) => employee.active !== false)
  const seededCostCenter = (await list(costCenters))[0]
  const seededMenu = (await list(menus))[0]
  const seededDish = (await list(menuItems))[0]
  const seededExtra = (await list(extras))[0]
  const seededCutoff = (await list(cutoffRules))[0]
  record('seeded company exists', Boolean(seededCompany?.id), seededCompany?.id)
  record('seeded active employee exists', Boolean(seededEmployee?.id), seededEmployee?.id)
  record('seeded cost center exists', Boolean(seededCostCenter?.id), seededCostCenter?.id)
  record('seeded menu exists', Boolean(seededMenu?.id), seededMenu?.id)
  record('seeded dish exists', Boolean(seededDish?.id), seededDish?.id)
  record('seeded extra exists', Boolean(seededExtra?.id), seededExtra?.id)
  record('seeded cutoff rule exists', Boolean(seededCutoff?.id), seededCutoff?.id)
  const company = await createCollection(companies, { name: 'V3 Empresa', status: 'active', active: true })
  record('create/read company', company.status === 201 && Boolean(company.body.data?.id), company.body.data?.id)
  const costCenter = await createCollection(costCenters, { name: 'V3 Centro', companyId: company.body.data.id, active: true })
  record('create/read cost center', costCenter.status === 201 && Boolean(costCenter.body.data?.id), costCenter.body.data?.id)
  const activeEmployee = await createCollection(employees, { name: 'V3 Empleado Activo', email: 'v3.activo@example.test', role: 'employee', companyId: company.body.data.id, costCenterId: costCenter.body.data.id, active: true })
  record('create/read active employee', activeEmployee.status === 201 && Boolean(activeEmployee.body.data?.id), activeEmployee.body.data?.id)
  const inactiveEmployee = await createCollection(employees, { name: 'V3 Empleado Inactivo', email: 'v3.inactivo@example.test', role: 'employee', companyId: company.body.data.id, costCenterId: costCenter.body.data.id, active: false })
  record('create/read inactive employee', inactiveEmployee.status === 201 && Boolean(inactiveEmployee.body.data?.id), inactiveEmployee.body.data?.id)
  const menu = await createCollection(menus, { name: 'V3 Menu', date: '2026-07-20', active: true })
  record('create/read menu', menu.status === 201 && Boolean(menu.body.data?.id), menu.body.data?.id)
  const dish = await createCollection(menuItems, { name: 'V3 Plato', menuId: menu.body.data.id, category: 'principal', price: 6000, active: true })
  record('create/read dish', dish.status === 201 && Boolean(dish.body.data?.id), dish.body.data?.id)
  const extra = await createCollection(extras, { name: 'V3 Extra', price: 500, active: true })
  record('create/read extra', extra.status === 201 && Boolean(extra.body.data?.id), extra.body.data?.id)
  const orderPayload = { employeeId: activeEmployee.body.data.id, companyId: company.body.data.id, costCenterId: costCenter.body.data.id, menuId: menu.body.data.id, menuItemId: dish.body.data.id, extraId: extra.body.data.id, date: '2026-07-20', cutoffHour: 11 }
  const createdOrder = await getJson('/api/domain/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(orderPayload) })
  record('create confirmed order', createdOrder.status === 201 && createdOrder.body.data?.status === 'confirmed', createdOrder.body.data?.id)
  const duplicateOrder = await getJson('/api/domain/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(orderPayload) })
  record('block duplicate order per employee/day', duplicateOrder.status === 409 && duplicateOrder.body.code === 'duplicate_order' && Boolean(duplicateOrder.body.warning), duplicateOrder.body.warning)
  const inactiveOrder = await getJson('/api/domain/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...orderPayload, employeeId: inactiveEmployee.body.data.id, date: '2026-07-20' }) })
  record('block inactive employee order', inactiveOrder.status === 409 && inactiveOrder.body.code === 'inactive_employee', inactiveOrder.body.warning)
  const cancelOrder = await getJson('/api/domain/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...orderPayload, date: '2026-07-21' }) })
  const cancelled = await getJson('/api/domain/orders/' + cancelOrder.body.data.id + '/cancel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nowHour: 9 }) })
  record('cancel before cutoff', cancelled.status === 200 && cancelled.body.data?.status === 'cancelled', cancelled.body.data?.id)
  const lateOrder = await getJson('/api/domain/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...orderPayload, date: '2026-07-22' }) })
  const lateCancel = await getJson('/api/domain/orders/' + lateOrder.body.data.id + '/cancel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nowHour: 18 }) })
  record('warn/block cancellation after cutoff', lateCancel.status === 409 && lateCancel.body.code === 'cutoff_passed' && Boolean(lateCancel.body.warning), lateCancel.body.warning)
  const production = await getJson('/api/domain/production?date=2026-07-20')
  record('production groups by dish', production.status === 200 && production.body.items.some((item) => item.dish === 'V3 Plato' && item.quantity >= 1), JSON.stringify(production.body.items))
  record('production groups by company', production.body.items.some((item) => item.companyId === company.body.data.id), company.body.data.id)
  const cancelledProduction = await getJson('/api/domain/production?date=2026-07-21')
  record('cancelled orders excluded from production', cancelledProduction.status === 200 && !cancelledProduction.body.items.some((item) => item.orderIds.includes(cancelOrder.body.data.id)), cancelOrder.body.data.id)
  const prepared = await getJson('/api/domain/orders/' + createdOrder.body.data.id + '/prepared', { method: 'POST' })
  record('change order state to prepared', prepared.status === 200 && prepared.body.data?.status === 'prepared', prepared.body.data?.id)
  const label = await getJson('/api/domain/labels', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId: createdOrder.body.data.id }) })
  record('generate label with order details', label.status === 201 && Boolean(label.body.data?.employee) && Boolean(label.body.data?.company) && Boolean(label.body.data?.costCenter) && Boolean(label.body.data?.dish) && Boolean(label.body.data?.date) && label.body.data?.orderId === createdOrder.body.data.id, JSON.stringify(label.body.data))
  const report = await getJson('/api/domain/reports?companyId=' + company.body.data.id + '&date=2026-07-20')
  record('generate company/day report', report.status === 200 && report.body.data?.companyId === company.body.data.id && report.body.data?.productionTotal >= 1, JSON.stringify(report.body.data))
  record('report includes dish quantities and extras', Array.isArray(report.body.data?.production) && report.body.data.production.some((item) => item.dish === 'V3 Plato') && report.body.data.extras.includes('V3 Extra'), JSON.stringify(report.body.data))
  const byCompany = await getJson('/api/domain/orders?companyId=' + company.body.data.id)
  record('filter orders by company', byCompany.status === 200 && byCompany.body.items.every((order) => order.companyId === company.body.data.id), 'items=' + byCompany.body.items.length)
  const byCostCenter = await getJson('/api/domain/orders?costCenterId=' + costCenter.body.data.id)
  record('filter orders by cost center', byCostCenter.status === 200 && byCostCenter.body.items.every((order) => order.costCenterId === costCenter.body.data.id), 'items=' + byCostCenter.body.items.length)
} finally {
  await new Promise((resolve) => server.close(resolve))
}
const report = { ok: failures.length === 0, failures, flows, project: PROJECT.slug, rolePages: (PROJECT.rolePages || []).map((page) => page.key), checkedAt: new Date().toISOString() }
fs.mkdirSync(path.join(root, 'validation'), { recursive: true })
fs.writeFileSync(path.join(root, 'validation', 'domain-smoke-report.json'), JSON.stringify(report, null, 2))
if (!report.ok) { console.error(JSON.stringify(report, null, 2)); process.exit(1) }
console.log('Domain smoke passed for ' + PROJECT.slug + ' with ' + flows.length + ' flows')
`
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
  const rolePages = buildRolePageDefinitions({ contract, collections })
  const publicScreens = uniqueStrings(asArray(contract.frontendSurfaces).flatMap((surface) => asArray(surface?.screens)), 12)
  const adminScreens = ['collections', 'crud', 'dashboard']
  const rolePageFiles = rolePages.map((rolePage) => ({
    path: `${normalizedProjectRoot}/${rolePage.path}`,
    area: 'frontend',
    content: buildRoleHtml({ domainLabel: normalizedDomainLabel, deliveryLevel: normalizedDeliveryLevel, rolePage, rolePages }),
  }))
  const filesToCreate = [
    { path: `${normalizedProjectRoot}/README.md`, area: 'docs', content: buildReadme({ domainLabel: normalizedDomainLabel }) },
    { path: `${normalizedProjectRoot}/package.json`, area: 'runtime', content: buildPackageJson(projectSlug) },
    { path: `${normalizedProjectRoot}/src/domain.mjs`, area: 'shared', content: buildDomainMjs({ projectSlug, domainLabel: normalizedDomainLabel, deliveryLevel: normalizedDeliveryLevel, roles, collections, rolePages, contract }) },
    { path: `${normalizedProjectRoot}/src/validation.mjs`, area: 'shared', content: buildValidationMjs() },
    { path: `${normalizedProjectRoot}/src/db.mjs`, area: 'database', content: buildDbMjs() },
    { path: `${normalizedProjectRoot}/src/domain-rules.mjs`, area: 'backend', content: buildDomainRulesMjs() },
    { path: `${normalizedProjectRoot}/src/server.mjs`, area: 'backend', content: buildServerMjs() },
    { path: `${normalizedProjectRoot}/public/index.html`, area: 'frontend', content: buildHtml({ domainLabel: normalizedDomainLabel, deliveryLevel: normalizedDeliveryLevel, screens: publicScreens.length > 0 ? publicScreens : ['dashboard', 'records', 'create'], admin: false }) },
    { path: `${normalizedProjectRoot}/public/admin.html`, area: 'frontend', content: buildHtml({ domainLabel: normalizedDomainLabel, deliveryLevel: normalizedDeliveryLevel, screens: adminScreens, admin: true }) },
    { path: `${normalizedProjectRoot}/public/app.js`, area: 'frontend', content: buildAppJs() },
    ...(rolePages.length > 0 ? [{ path: `${normalizedProjectRoot}/public/role-app.js`, area: 'frontend', content: buildRoleAppJs() }] : []),
    ...rolePageFiles,
    { path: `${normalizedProjectRoot}/public/styles.css`, area: 'frontend', content: buildCss() },
    { path: `${normalizedProjectRoot}/database/schema.sql`, area: 'database', content: buildSchemaSql({ domainLabel: normalizedDomainLabel, collections }) },
    { path: `${normalizedProjectRoot}/data/seed.json`, area: 'database', content: `${JSON.stringify(Object.fromEntries(Object.entries(collections).map(([name, definition]) => [name, definition.seed])), null, 2)}\n` },
    { path: `${normalizedProjectRoot}/scripts/seed.mjs`, area: 'scripts', content: buildSeedScript() },
    { path: `${normalizedProjectRoot}/scripts/build.mjs`, area: 'scripts', content: buildBuildScript() },
    { path: `${normalizedProjectRoot}/scripts/smoke.mjs`, area: 'scripts', content: buildSmokeScript() },
    { path: `${normalizedProjectRoot}/scripts/domain-smoke.mjs`, area: 'scripts', content: buildDomainSmokeScript() },
    { path: `${normalizedProjectRoot}/validation/report.json`, area: 'validation', content: buildValidationReport({ templateFamily: normalizedTemplateFamily, domainLabel: normalizedDomainLabel, projectRoot: normalizedProjectRoot }) },
  ]
  const allowedTargetPaths = uniqueStrings([normalizedProjectRoot, ...filesToCreate.map((entry) => entry.path)], 256)
  const requiredPathGroups = [
    { label: 'runtime-root', candidates: [`${normalizedProjectRoot}/package.json`] },
    { label: 'sqlite-db-layer', candidates: [`${normalizedProjectRoot}/src/db.mjs`, `${normalizedProjectRoot}/database/schema.sql`] },
    { label: 'rest-api', candidates: [`${normalizedProjectRoot}/src/server.mjs`, `${normalizedProjectRoot}/src/domain-rules.mjs`] },
    { label: 'backoffice', candidates: [`${normalizedProjectRoot}/public/admin.html`, `${normalizedProjectRoot}/public/app.js`] },
    ...(rolePages.length > 0 ? [{ label: 'role-ux', candidates: rolePages.map((page) => `${normalizedProjectRoot}/${page.path}`) }] : []),
    { label: 'validation', candidates: [`${normalizedProjectRoot}/scripts/build.mjs`, `${normalizedProjectRoot}/scripts/smoke.mjs`] },
  ]
  const fileChecks = filesToCreate.flatMap((entry) => {
    const checks = [{ type: 'exists', targetPath: entry.path }]
    if (entry.path.endsWith('/src/db.mjs')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'node:sqlite' })
    if (entry.path.endsWith('/src/domain-rules.mjs')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'duplicate_order' })
    if (entry.path.endsWith('/public/app.js')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'data-delete' })
    if (entry.path.endsWith('/public/employee.html')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'Cancelar pedido' })
    if (entry.path.endsWith('/public/kitchen.html')) checks.push({ type: 'file-contains', targetPath: entry.path, text: 'Marcar preparado' })
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
      commands: ['npm run seed', 'npm run build', 'npm run smoke', 'npm run domain-smoke'],
      syntaxChecks: [`${normalizedProjectRoot}/src/server.mjs`, `${normalizedProjectRoot}/src/db.mjs`, `${normalizedProjectRoot}/src/domain-rules.mjs`, `${normalizedProjectRoot}/public/app.js`, ...(rolePages.length > 0 ? [`${normalizedProjectRoot}/public/role-app.js`] : [])],
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