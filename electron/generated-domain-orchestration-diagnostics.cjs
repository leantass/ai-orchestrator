const fs = require('node:fs')
const path = require('node:path')
const {
  getGeneratedDomainSpecializedTemplateCapability,
  normalizeGeneratedDomainRequestedStackProfile,
  resolveGeneratedDomainGeneratorReadiness,
} = require('./generated-domain-template-capabilities.cjs')
const {
  buildGeneratedDomainRealProjectArtifacts,
} = require('./generated-domain-real-project-artifacts.cjs')

function normalizeOptionalString(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function pushUniqueMessage(target, message) {
  const normalized =
    typeof message === 'string'
      ? message.trim().replace(/\s+/gu, ' ')
      : message === null || message === undefined
        ? ''
        : String(message).trim().replace(/\s+/gu, ' ')

  if (!normalized || target.includes(normalized)) {
    return
  }

  target.push(normalized.length <= 180 ? normalized : `${normalized.slice(0, 177)}...`)
}

function summarizeUniqueStrings(values, limit = 256) {
  if (!Array.isArray(values)) {
    return []
  }

  const uniqueValues = []
  const seen = new Set()

  for (const entry of values) {
    if (typeof entry !== 'string') {
      continue
    }

    const trimmed = entry.trim()
    if (!trimmed) {
      continue
    }

    const lowered = trimmed.toLocaleLowerCase()
    if (seen.has(lowered)) {
      continue
    }

    seen.add(lowered)
    uniqueValues.push(trimmed)
    if (uniqueValues.length >= limit) {
      break
    }
  }

  return uniqueValues
}

function buildGeneratedDomainSpecializedTemplateArtifacts({
  templateFamily,
  projectRoot,
  domainLabel,
  deliveryLevel,
  generatedDomainContract,
  stackProfile,
}) {
  const normalizedTemplateFamily = normalizeOptionalString(templateFamily)
  const normalizedProjectRoot = normalizeOptionalString(projectRoot)
  const normalizedDomainLabel = normalizeOptionalString(domainLabel) || 'Generated Domain Project'
  const normalizedDeliveryLevel = normalizeOptionalString(deliveryLevel) || 'fullstack-local'
  const contract =
    generatedDomainContract && typeof generatedDomainContract === 'object'
      ? generatedDomainContract
      : {}
  const normalizedStackProfile =
    normalizeGeneratedDomainRequestedStackProfile(stackProfile) ||
    normalizeGeneratedDomainRequestedStackProfile(contract.stackProfile)
  const templateCapability = getGeneratedDomainSpecializedTemplateCapability(
    normalizedTemplateFamily,
  )

  if (!templateCapability || !normalizedProjectRoot) {
    return null
  }

  if (templateCapability.artifactBuilderKey === 'node-sqlite-rest-backoffice') {
    return buildGeneratedDomainRealProjectArtifacts({
      templateFamily: normalizedTemplateFamily,
      projectRoot: normalizedProjectRoot,
      domainLabel: normalizedDomainLabel,
      deliveryLevel: normalizedDeliveryLevel,
      generatedDomainContract: contract,
      stackProfile: normalizedStackProfile,
    })
  }

  if (templateCapability.artifactBuilderKey !== 'nextjs-app-router-prisma-sqlite-tailwind') {
    return null
  }

  const roles = summarizeUniqueStrings(Array.isArray(contract.roles) ? contract.roles : [], 16)
  const entities = summarizeUniqueStrings(
    Array.isArray(contract.entities) ? contract.entities : [],
    24,
  )
  const workflows = summarizeUniqueStrings(
    Array.isArray(contract.workflows) ? contract.workflows : [],
    24,
  )
  const tables = summarizeUniqueStrings(
    Array.isArray(contract?.database?.tables) ? contract.database.tables : [],
    24,
  )
  const domainSlug =
    normalizeOptionalString(contract?.domain?.slug) ||
    normalizedDomainLabel
      .normalize('NFKD')
      .replace(/[^\w\s-]/gu, '')
      .trim()
      .replace(/[\s_]+/gu, '-')
      .replace(/-+/gu, '-')
      .toLocaleLowerCase()

  const sampleCompanies = [
    { id: 'comp-acme', name: 'Acme Logistica', plan: 'Corporativo 80', billingDay: 'lunes' },
    { id: 'comp-lumen', name: 'Lumen Seguros', plan: 'Corporativo 120', billingDay: 'miercoles' },
  ]
  const sampleMenus = [
    { id: 'menu-balance', name: 'Menu Balance', category: 'equilibrado', price: 7600 },
    { id: 'menu-proteico', name: 'Menu Proteico', category: 'alto en proteinas', price: 8200 },
    { id: 'menu-veggie', name: 'Menu Veggie', category: 'vegetariano', price: 7900 },
  ]
  const sampleOrders = [
    {
      id: 'ord-1001',
      companyId: 'comp-acme',
      employeeName: 'Lucia Ferrer',
      menuId: 'menu-balance',
      status: 'confirmed',
      deliveryDate: '2026-07-01',
      notes: 'Sin TACC',
    },
    {
      id: 'ord-1002',
      companyId: 'comp-lumen',
      employeeName: 'Bruno Vidal',
      menuId: 'menu-proteico',
      status: 'kitchen-ready',
      deliveryDate: '2026-07-01',
      notes: 'Retira en recepcion',
    },
  ]

  const domainSummary = {
    domain: {
      label: normalizedDomainLabel,
      slug: domainSlug,
      deliveryLevel: normalizedDeliveryLevel,
    },
    stackProfile: normalizedStackProfile,
    roles,
    entities,
    workflows,
    tables,
    safety: {
      sandboxOnly: true,
      noDotEnv: true,
      noNodeModules: true,
      noDocker: true,
      noDeploy: true,
      noExternalServices: true,
      noRealPayments: true,
    },
  }

  const buildPackageJson = () =>
    JSON.stringify(
      {
        name: domainSlug,
        private: true,
        version: '0.1.0',
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
          'prisma:generate': 'prisma generate',
          'prisma:push': 'prisma db push',
          seed: 'tsx prisma/seed.ts',
        },
        dependencies: {
          '@prisma/client': '^6.10.0',
          bcrypt: '^5.1.1',
          next: '^15.4.0',
          react: '^19.1.0',
          'react-dom': '^19.1.0',
          zod: '^3.25.0',
        },
        devDependencies: {
          autoprefixer: '^10.4.20',
          postcss: '^8.4.47',
          prisma: '^6.10.0',
          tailwindcss: '^3.4.17',
          tsx: '^4.19.1',
          typescript: '^5.8.3',
          '@types/node': '^22.10.1',
          '@types/react': '^19.1.2',
          '@types/react-dom': '^19.1.2',
        },
      },
      null,
      2,
    )

  const buildTsConfig = () =>
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['dom', 'dom.iterable', 'es2022'],
          allowJs: false,
          skipLibCheck: true,
          strict: true,
          noEmit: true,
          esModuleInterop: true,
          module: 'esnext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          jsx: 'preserve',
          incremental: true,
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
          },
        },
        include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
        exclude: ['node_modules'],
      },
      null,
      2,
    )

  const buildReadme = () => `# ${normalizedDomainLabel}

Scaffold especializado generado por JEFE para una familia soportada de stack moderno.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Prisma + SQLite local lista para migrar luego a PostgreSQL
- Route handlers locales
- Auth scaffold con cookie httpOnly, bcrypt y RBAC
- CSV export y print CSS para etiquetas y comandas

## Alcance incluido

- portal administrativo para empresas, pedidos, cocina y etiquetas
- route handlers mock para companies, orders y reportes CSV
- prisma/schema.prisma como base de datos fuente
- database/schema.sql como snapshot revisable
- seed local segura sin credenciales

## Seguridad actual

- sin .env
- sin node_modules
- sin Docker
- sin deploy
- sin integraciones externas reales
- sin pagos reales
- sin ejecucion automatica de npm install

## Siguiente paso aprobado a futuro

1. npm install
2. npm run prisma:generate
3. npm run prisma:push
4. npm run seed
5. npm run dev
`

  const buildDomainDoc = () => `# Domain Summary

## Domain

- Label: ${normalizedDomainLabel}
- Slug: ${domainSlug}
- Delivery level: ${normalizedDeliveryLevel}

## Roles

${roles.length > 0 ? roles.map((entry) => `- ${entry}`).join('\n') : '- Sin roles declarados'}

## Entities

${entities.length > 0 ? entities.map((entry) => `- ${entry}`).join('\n') : '- Sin entidades declaradas'}

## Workflows

${workflows.length > 0 ? workflows.map((entry) => `- ${entry}`).join('\n') : '- Sin workflows declarados'}
`

  const buildLocalRunbook = () => `# Local Runbook

## Antes de correr

- instalar dependencias manualmente con approval explicita
- mantener sqlite local y sin secrets
- revisar prisma/schema.prisma y database/schema.sql antes de ejecutar migraciones

## Flujo sugerido

1. npm install
2. npm run prisma:generate
3. npm run prisma:push
4. npm run seed
5. npm run dev

## Checks manuales

- home publica
- panel admin con empresas y pedidos
- kitchen board
- labels con print CSS
- route CSV en /api/reports/orders
`

  const buildLayoutTsx = () => `/* eslint-disable react-refresh/only-export-components */
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '${normalizedDomainLabel}',
  description: 'Scaffold especializado local para operaciones de viandas corporativas B2B.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
`

  const buildGlobalsCss = () => `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
  --bg: #f4f1ea;
  --surface: #fffaf2;
  --ink: #20201b;
  --accent: #0f766e;
  --accent-soft: #d9f1ee;
  --warning: #92400e;
}

body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, #f7f4ee 0%, #efe6d3 100%);
  color: var(--ink);
}

.page-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 20px 64px;
}

.hero-card,
.panel-card {
  background: var(--surface);
  border: 1px solid rgba(32, 32, 27, 0.08);
  border-radius: 24px;
  box-shadow: 0 18px 50px rgba(32, 32, 27, 0.08);
}

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.print-label-sheet {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.label-card {
  border: 1px dashed rgba(32, 32, 27, 0.24);
  border-radius: 16px;
  padding: 16px;
  background: #ffffff;
}

@media print {
  body {
    background: #ffffff;
  }

  .no-print {
    display: none !important;
  }

  .print-label-sheet {
    grid-template-columns: repeat(2, 1fr);
    gap: 8mm;
  }

  .label-card {
    break-inside: avoid;
    min-height: 55mm;
  }
}
`

  const buildHomePage = () => `import { dashboardSummary, companies, orders } from '@/lib/mock-data'

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card" style={{ padding: 28, marginBottom: 24 }}>
        <p style={{ margin: 0, color: '#0f766e', fontWeight: 700 }}>Viandas corporativas B2B</p>
        <h1 style={{ marginBottom: 12 }}>Operaciones locales listas para pasar a runtime aprobado</h1>
        <p>
          Este scaffold prepara home, backoffice, route handlers, modelo Prisma y utilidades de
          auth/CSV/print para un MVP de empresas, empleados, menus y pedidos.
        </p>
      </section>

      <section className="grid-cards" style={{ marginBottom: 24 }}>
        {dashboardSummary.map((item) => (
          <article key={item.label} className="panel-card" style={{ padding: 20 }}>
            <p style={{ margin: 0, opacity: 0.72 }}>{item.label}</p>
            <strong style={{ fontSize: 28 }}>{item.value}</strong>
            <p style={{ marginBottom: 0 }}>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="panel-card" style={{ padding: 24, marginBottom: 24 }}>
        <h2>Empresas activas</h2>
        <ul>
          {companies.map((company) => (
            <li key={company.id}>
              {company.name} · plan {company.plan} · cierre {company.billingDay}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-card" style={{ padding: 24 }}>
        <h2>Pedidos destacados</h2>
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              {order.employeeName} · {order.deliveryDate} · {order.status}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
`

  const buildAdminPage = () => `import { companies, menus, orders } from '@/lib/mock-data'
import { canAccess } from '@/lib/rbac'

export default function AdminPage() {
  const adminCanExport = canAccess('company-admin', 'reports.export')

  return (
    <main className="page-shell">
      <section className="panel-card" style={{ padding: 24, marginBottom: 24 }}>
        <h1>Backoffice administrativo</h1>
        <p>Vista pensada para gestionar empresas, menus, pedidos y seguimiento de aprobaciones.</p>
        <p>CSV habilitado: {adminCanExport ? 'si' : 'no'}</p>
      </section>

      <section className="grid-cards">
        <article className="panel-card" style={{ padding: 20 }}>
          <h2>Empresas</h2>
          <ul>{companies.map((company) => <li key={company.id}>{company.name}</li>)}</ul>
        </article>
        <article className="panel-card" style={{ padding: 20 }}>
          <h2>Menus</h2>
          <ul>{menus.map((menu) => <li key={menu.id}>{menu.name} · {'$'}{menu.price}</li>)}</ul>
        </article>
        <article className="panel-card" style={{ padding: 20 }}>
          <h2>Pedidos</h2>
          <ul>{orders.map((order) => <li key={order.id}>{order.id} · {order.status}</li>)}</ul>
        </article>
      </section>
    </main>
  )
}
`

  const buildKitchenPage = () => `import { orders } from '@/lib/mock-data'

export default function KitchenPage() {
  const queue = orders.filter((order) => order.status !== 'delivered')

  return (
    <main className="page-shell">
      <section className="panel-card" style={{ padding: 24 }}>
        <h1>Cocina y armado</h1>
        <p>Comandas pensadas para imprimirse y marcar cambios de estado localmente.</p>
        <ul>
          {queue.map((order) => (
            <li key={order.id}>
              {order.employeeName} · {order.notes} · {order.status}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
`

  const buildLabelsPage = () => `import { deliveryLabels } from '@/lib/mock-data'

export default function LabelsPage() {
  return (
    <main className="page-shell">
      <section className="panel-card" style={{ padding: 24, marginBottom: 16 }}>
        <h1>Etiquetas y remitos de cocina</h1>
        <p className="no-print">Usar esta pantalla para validar print CSS antes de un runtime aprobado.</p>
      </section>

      <section className="print-label-sheet">
        {deliveryLabels.map((label) => (
          <article key={label.id} className="label-card">
            <strong>{label.companyName}</strong>
            <p>{label.employeeName}</p>
            <p>{label.menuName}</p>
            <p>{label.deliverySlot}</p>
            <p>{label.notes}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
`

  const buildHealthRoute = () => `export async function GET() {
  return Response.json({ status: 'ok', scope: 'sandbox-only', stack: 'nextjs-app-router-prisma-sqlite-tailwind' })
}
`

  const buildCompaniesRoute = () => `import { companies } from '@/lib/mock-data'

export async function GET() {
  return Response.json({ items: companies, total: companies.length })
}
`

  const buildOrdersRoute = () => `import { orders } from '@/lib/mock-data'

export async function GET() {
  return Response.json({ items: orders, total: orders.length })
}
`

  const buildCsvRoute = () => `import { orders, companies, menus } from '@/lib/mock-data'
import { toCsv } from '@/lib/csv'

export async function GET() {
  const rows = orders.map((order) => ({
    orderId: order.id,
    company: companies.find((company) => company.id === order.companyId)?.name || order.companyId,
    employee: order.employeeName,
    menu: menus.find((menu) => menu.id === order.menuId)?.name || order.menuId,
    status: order.status,
    deliveryDate: order.deliveryDate,
  }))

  return new Response(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="orders.csv"',
    },
  })
}
`

  const buildDomainContractTs = () => `export const domainContract = ${JSON.stringify(
    domainSummary,
    null,
    2,
  )} as const
`

  const buildSharedContractJs = () => `module.exports = ${JSON.stringify(domainSummary, null, 2)}
`

  const buildMockDataTs = () => `export const companies = ${JSON.stringify(sampleCompanies, null, 2)} as const

export const menus = ${JSON.stringify(sampleMenus, null, 2)} as const

export const orders = ${JSON.stringify(sampleOrders, null, 2)} as const

export const deliveryLabels = orders.map((order) => ({
  id: order.id,
  companyName: companies.find((company) => company.id === order.companyId)?.name || order.companyId,
  employeeName: order.employeeName,
  menuName: menus.find((menu) => menu.id === order.menuId)?.name || order.menuId,
  deliverySlot: order.deliveryDate + ' 12:30',
  notes: order.notes,
}))

export const dashboardSummary = [
  { label: 'Empresas activas', value: String(companies.length), detail: 'Cuentas corporativas listas para onboarding.' },
  { label: 'Menus disponibles', value: String(menus.length), detail: 'Base inicial de cartas por categoria.' },
  { label: 'Pedidos abiertos', value: String(orders.length), detail: 'Seguimiento operativo y cocina.' },
]
`

  const buildRbacTs = () => `const permissionsByRole = {
  'platform-admin': ['companies.read', 'orders.manage', 'labels.print', 'reports.export'],
  'company-admin': ['companies.read', 'orders.manage', 'reports.export'],
  employee: ['orders.read-self'],
  'kitchen-operator': ['orders.prepare', 'labels.print'],
} as const

export type AppRole = keyof typeof permissionsByRole

export function canAccess(role: AppRole, permission: string) {
  return permissionsByRole[role]?.includes(permission as never) === true
}
`

  const buildCsvTs = () => `export function toCsv(rows: Array<Record<string, string>>) {
  if (rows.length === 0) {
    return ''
  }

  const headers = Object.keys(rows[0])
  const escapeValue = (value: string) => {
    const normalized = String(value ?? '')
    return /[",\\n]/u.test(normalized)
      ? '"' + normalized.replace(/"/gu, '""') + '"'
      : normalized
  }

  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeValue(String(row[header] ?? ''))).join(',')),
  ].join('\\n')
}
`

  const buildSessionTs = () => `export const sessionCookieName = 'viandas_session'

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: false,
  path: '/',
}

export function buildMockSession(role: 'platform-admin' | 'company-admin' | 'employee' | 'kitchen-operator') {
  return {
    role,
    issuedAt: new Date().toISOString(),
    scope: 'sandbox-only',
  }
}
`

  const buildPrintTs = () => `export const printProfiles = {
  label: { widthMm: 100, heightMm: 55 },
  kitchenSlip: { widthMm: 80, heightMm: 120 },
} as const
`

  const buildEmailLogTs = () => `const emailLog: Array<{ to: string; subject: string; body: string }> = []

export function recordEmailLog(entry: { to: string; subject: string; body: string }) {
  emailLog.push(entry)
  return { saved: true, total: emailLog.length }
}

export function listEmailLog() {
  return emailLog
}
`

  const buildPrismaSchema = () => `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Company {
  id          String   @id @default(cuid())
  name        String
  billingDay  String
  employees   Employee[]
  orders      Order[]
  createdAt   DateTime @default(now())
}

model Employee {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  name        String
  email       String   @unique
  role        String
  orders      Order[]
}

model Menu {
  id          String      @id @default(cuid())
  name        String
  category    String
  priceCents  Int
  items       MenuItem[]
  orders      Order[]
}

model MenuItem {
  id          String   @id @default(cuid())
  menuId      String
  menu        Menu     @relation(fields: [menuId], references: [id])
  label       String
}

model Order {
  id             String         @id @default(cuid())
  companyId      String
  company        Company        @relation(fields: [companyId], references: [id])
  employeeId     String?
  employee       Employee?      @relation(fields: [employeeId], references: [id])
  menuId         String
  menu           Menu           @relation(fields: [menuId], references: [id])
  status         String
  deliveryDate   DateTime
  notes          String?
  items          OrderItem[]
  deliveryLabels DeliveryLabel[]
  kitchenTickets KitchenTicket[]
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id])
  label     String
  quantity  Int     @default(1)
}

model DeliveryLabel {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  printedAt   DateTime?
  destination String
}

model KitchenTicket {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  station     String
  printedAt   DateTime?
}

model Session {
  id          String   @id @default(cuid())
  role        String
  companyId   String?
  issuedAt    DateTime @default(now())
  expiresAt   DateTime
}
`

  const buildPrismaSeed = () => `import { companies, menus, orders } from '../src/lib/mock-data'

async function main() {
  console.log('Seed sandbox-only preparada', { companies: companies.length, menus: menus.length, orders: orders.length })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
`

  const buildDatabaseSql = () => `CREATE TABLE company (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  billing_day TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE employee (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL
);

CREATE TABLE menu (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  employee_id TEXT,
  menu_id TEXT NOT NULL,
  status TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE delivery_label (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  destination TEXT NOT NULL,
  printed_at TEXT
);

CREATE TABLE kitchen_ticket (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  station TEXT NOT NULL,
  printed_at TEXT
);
`

  const buildSeedJson = () =>
    JSON.stringify(
      {
        companies: sampleCompanies,
        menus: sampleMenus,
        orders: sampleOrders,
      },
      null,
      2,
    )

  const buildValidationReport = () =>
    JSON.stringify(
      {
        status: 'pending-materialization',
        templateFamily: normalizedTemplateFamily,
        domain: normalizedDomainLabel,
        projectRoot: normalizedProjectRoot,
        sandboxOnly: true,
      },
      null,
      2,
    )

  const filesToCreate = [
    { path: `${normalizedProjectRoot}/README.md`, area: 'docs', content: buildReadme() },
    { path: `${normalizedProjectRoot}/package.json`, area: 'frontend', content: buildPackageJson() },
    { path: `${normalizedProjectRoot}/tsconfig.json`, area: 'frontend', content: buildTsConfig() },
    { path: `${normalizedProjectRoot}/next.config.mjs`, area: 'frontend', content: 'const nextConfig = { reactStrictMode: true }\n\nexport default nextConfig\n' },
    { path: `${normalizedProjectRoot}/postcss.config.mjs`, area: 'frontend', content: 'export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n' },
    { path: `${normalizedProjectRoot}/tailwind.config.ts`, area: 'frontend', content: `import type { Config } from 'tailwindcss'\n\nconst config: Config = {\n  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n}\n\nexport default config\n` },
    { path: `${normalizedProjectRoot}/next-env.d.ts`, area: 'frontend', content: '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n\n// This file is generated by Next.js.\n' },
    { path: `${normalizedProjectRoot}/app/layout.tsx`, area: 'frontend', content: buildLayoutTsx() },
    { path: `${normalizedProjectRoot}/app/globals.css`, area: 'frontend', content: buildGlobalsCss() },
    { path: `${normalizedProjectRoot}/app/page.tsx`, area: 'frontend', content: buildHomePage() },
    { path: `${normalizedProjectRoot}/app/admin/page.tsx`, area: 'frontend', content: buildAdminPage() },
    { path: `${normalizedProjectRoot}/app/kitchen/page.tsx`, area: 'frontend', content: buildKitchenPage() },
    { path: `${normalizedProjectRoot}/app/labels/page.tsx`, area: 'frontend', content: buildLabelsPage() },
    { path: `${normalizedProjectRoot}/app/api/health/route.ts`, area: 'backend', content: buildHealthRoute() },
    { path: `${normalizedProjectRoot}/app/api/companies/route.ts`, area: 'backend', content: buildCompaniesRoute() },
    { path: `${normalizedProjectRoot}/app/api/orders/route.ts`, area: 'backend', content: buildOrdersRoute() },
    { path: `${normalizedProjectRoot}/app/api/reports/orders/route.ts`, area: 'backend', content: buildCsvRoute() },
    { path: `${normalizedProjectRoot}/src/lib/domain-contract.ts`, area: 'shared', content: buildDomainContractTs() },
    { path: `${normalizedProjectRoot}/src/lib/mock-data.ts`, area: 'shared', content: buildMockDataTs() },
    { path: `${normalizedProjectRoot}/src/lib/rbac.ts`, area: 'shared', content: buildRbacTs() },
    { path: `${normalizedProjectRoot}/src/lib/csv.ts`, area: 'shared', content: buildCsvTs() },
    { path: `${normalizedProjectRoot}/src/lib/print.ts`, area: 'shared', content: buildPrintTs() },
    { path: `${normalizedProjectRoot}/src/lib/email-log.ts`, area: 'shared', content: buildEmailLogTs() },
    { path: `${normalizedProjectRoot}/src/lib/auth/session.ts`, area: 'shared', content: buildSessionTs() },
    { path: `${normalizedProjectRoot}/shared/contracts/domain.js`, area: 'shared', content: buildSharedContractJs() },
    { path: `${normalizedProjectRoot}/prisma/schema.prisma`, area: 'database', content: buildPrismaSchema() },
    { path: `${normalizedProjectRoot}/prisma/seed.ts`, area: 'database', content: buildPrismaSeed() },
    { path: `${normalizedProjectRoot}/database/schema.sql`, area: 'database', content: buildDatabaseSql() },
    { path: `${normalizedProjectRoot}/database/seed.json`, area: 'database', content: buildSeedJson() },
    { path: `${normalizedProjectRoot}/docs/domain.md`, area: 'docs', content: buildDomainDoc() },
    { path: `${normalizedProjectRoot}/docs/local-runbook.md`, area: 'docs', content: buildLocalRunbook() },
    { path: `${normalizedProjectRoot}/validation/report.json`, area: 'validation', content: buildValidationReport() },
  ]

  const allowedTargetPaths = summarizeUniqueStrings(
    [normalizedProjectRoot, ...filesToCreate.map((entry) => entry.path)],
    256,
  )
  const requiredPathGroups = [
    { label: 'runtime-root', candidates: [`${normalizedProjectRoot}/package.json`, `${normalizedProjectRoot}/tsconfig.json`] },
    { label: 'app-shell', candidates: [`${normalizedProjectRoot}/app/layout.tsx`, `${normalizedProjectRoot}/app/page.tsx`, `${normalizedProjectRoot}/app/globals.css`] },
    { label: 'operations-pages', candidates: [`${normalizedProjectRoot}/app/admin/page.tsx`, `${normalizedProjectRoot}/app/kitchen/page.tsx`, `${normalizedProjectRoot}/app/labels/page.tsx`] },
    { label: 'route-handlers', candidates: [`${normalizedProjectRoot}/app/api/companies/route.ts`, `${normalizedProjectRoot}/app/api/orders/route.ts`, `${normalizedProjectRoot}/app/api/reports/orders/route.ts`] },
    { label: 'auth-and-rbac', candidates: [`${normalizedProjectRoot}/src/lib/auth/session.ts`, `${normalizedProjectRoot}/src/lib/rbac.ts`] },
    { label: 'prisma', candidates: [`${normalizedProjectRoot}/prisma/schema.prisma`, `${normalizedProjectRoot}/prisma/seed.ts`] },
    { label: 'database-snapshot', candidates: [`${normalizedProjectRoot}/database/schema.sql`, `${normalizedProjectRoot}/database/seed.json`] },
    { label: 'validation', candidates: [`${normalizedProjectRoot}/validation/report.json`] },
  ]
  const fileChecks = filesToCreate.flatMap((entry) => {
    const checks = [{ type: 'exists', targetPath: entry.path }]
    if (entry.path.endsWith('/README.md')) {
      checks.push({ type: 'file-contains', targetPath: entry.path, text: normalizedDomainLabel })
    }
    if (entry.path.endsWith('/prisma/schema.prisma')) {
      checks.push({ type: 'file-contains', targetPath: entry.path, text: 'model Order' })
    }
    if (entry.path.endsWith('/app/api/reports/orders/route.ts')) {
      checks.push({ type: 'file-contains', targetPath: entry.path, text: 'text/csv; charset=utf-8' })
    }
    return checks
  })
  const validationPlan = {
    syntaxChecks: [`${normalizedProjectRoot}/next.config.mjs`, `${normalizedProjectRoot}/postcss.config.mjs`],
    jsonChecks: [`${normalizedProjectRoot}/package.json`, `${normalizedProjectRoot}/tsconfig.json`, `${normalizedProjectRoot}/database/seed.json`, `${normalizedProjectRoot}/validation/report.json`],
    pathChecks: [normalizedProjectRoot],
    forbiddenPathChecks: ['.env', 'node_modules', 'Dockerfile', 'docker-compose.yml', 'deploy', 'web-prueba'],
  }

  return {
    present: true,
    built: true,
    templateFamily: normalizedTemplateFamily,
    projectRoot: normalizedProjectRoot,
    stackProfile: normalizedStackProfile,
    frontendPaths: filesToCreate.filter((entry) => entry.area === 'frontend').map((entry) => entry.path),
    backendPaths: filesToCreate.filter((entry) => entry.area === 'backend').map((entry) => entry.path),
    databasePaths: filesToCreate.filter((entry) => entry.area === 'database').map((entry) => entry.path),
    sharedPaths: filesToCreate.filter((entry) => entry.area === 'shared').map((entry) => entry.path),
    docsPaths: filesToCreate.filter((entry) => entry.area === 'docs').map((entry) => entry.path),
    validationPaths: filesToCreate.filter((entry) => entry.area === 'validation').map((entry) => entry.path),
    allowedTargetPaths,
    requiredPathGroups,
    fileChecks,
    validationPlan,
    forbiddenSignals: ['.env', 'node_modules', 'Dockerfile', 'docker-compose.yml', 'deploy', 'web-prueba'],
    filesToCreate,
  }
}

function deriveGeneratedDomainStructuralCapabilities({
  generatedDomainContract,
  generatedDomainCapabilityProfile,
  generatedDomainUniversalMaterializationPlanPreview,
  generatedDomainShadowMaterializationCandidatePlan,
}) {
  const emptyCapabilitiesShape = {
    hasPublicFrontend: false,
    hasAdminPanel: false,
    hasOperatorPanel: false,
    hasBackend: false,
    hasDatabase: false,
    hasReporting: false,
    hasScheduling: false,
    hasInventory: false,
    hasDocuments: false,
    hasMockPayments: false,
    hasMessaging: false,
    hasAuthMock: false,
    hasValidation: false,
    hasSafeLocalMaterialization: false,
  }
  const emptyCapabilities = {
    present: false,
    evaluated: false,
    behaviorChanged: false,
    ...emptyCapabilitiesShape,
    capabilities: {
      ...emptyCapabilitiesShape,
    },
    stackProfileRequested: false,
    requiresSpecializedGenerator: false,
    generatorSupportedNow: true,
    templateFamily: 'generic-sandbox-fullstack-local',
    unsupportedStackReasons: [],
    warnings: [],
    errors: [],
    warningsCount: 0,
    errorsCount: 0,
  }

  const normalizedContract =
    generatedDomainContract &&
    typeof generatedDomainContract === 'object' &&
    generatedDomainContract.contractVersion
      ? generatedDomainContract
      : null
  const capabilityProfile =
    generatedDomainCapabilityProfile &&
    typeof generatedDomainCapabilityProfile === 'object'
      ? generatedDomainCapabilityProfile
      : null
  const preview =
    generatedDomainUniversalMaterializationPlanPreview &&
    typeof generatedDomainUniversalMaterializationPlanPreview === 'object'
      ? generatedDomainUniversalMaterializationPlanPreview
      : null
  const candidatePlan =
    generatedDomainShadowMaterializationCandidatePlan &&
    typeof generatedDomainShadowMaterializationCandidatePlan === 'object'
      ? generatedDomainShadowMaterializationCandidatePlan
      : null

  if (!normalizedContract && !capabilityProfile && !preview && !candidatePlan) {
    return emptyCapabilities
  }

  try {
    const warnings = []
    const errors = []
    const surfaces = Array.isArray(normalizedContract?.frontendSurfaces)
      ? normalizedContract.frontendSurfaces
      : []
    const allSurfaceSignals = [
      ...surfaces.map((entry) => entry?.key),
      ...surfaces.map((entry) => entry?.label),
      ...(Array.isArray(preview?.surfaces) ? preview.surfaces.map((entry) => entry?.key) : []),
      ...(Array.isArray(preview?.surfaces)
        ? preview.surfaces.map((entry) => entry?.label)
        : []),
    ]
      .filter((entry) => typeof entry === 'string' && entry.trim())
      .map((entry) => entry.trim().toLocaleLowerCase())
    const modulesText = JSON.stringify(
      {
        workflows: normalizedContract?.workflows,
        entities: normalizedContract?.entities,
        roles: normalizedContract?.roles,
        backend: normalizedContract?.backend,
        database: normalizedContract?.database,
        shared: normalizedContract?.shared,
        docs: normalizedContract?.docs,
        scripts: normalizedContract?.scripts,
        validation: normalizedContract?.validation,
        profile: capabilityProfile,
      },
      null,
      0,
    )
    const includesAnySignal = (signals) =>
      signals.some((entry) => allSurfaceSignals.includes(entry) || modulesText.includes(entry))

    const capabilities = {
      ...emptyCapabilities,
      present: true,
      evaluated: true,
      hasPublicFrontend:
        preview?.frontend?.present === true ||
        capabilityProfile?.frontendPresent === true ||
        includesAnySignal(['public', 'catalog', 'landing']),
      hasAdminPanel:
        includesAnySignal(['admin', 'dashboard', 'backoffice']) ||
        surfaces.some((entry) =>
          /admin|dashboard|backoffice/iu.test(String(entry?.key || entry?.label || '')),
        ),
      hasOperatorPanel:
        includesAnySignal(['operator', 'operations', 'operativo']) ||
        surfaces.some((entry) =>
          /operativ|operator|operations/iu.test(String(entry?.key || entry?.label || '')),
        ),
      hasBackend:
        preview?.backend?.present === true ||
        capabilityProfile?.backendPresent === true ||
        Boolean(normalizedContract?.backend?.entryFile),
      hasDatabase:
        preview?.database?.present === true ||
        capabilityProfile?.databasePresent === true ||
        Boolean(normalizedContract?.database?.schemaFile),
      hasReporting: includesAnySignal(['report', 'reports', 'reporting', 'analytics']),
      hasScheduling: includesAnySignal([
        'schedule',
        'scheduling',
        'turnos',
        'agenda',
        'calendar',
        'reservas',
      ]),
      hasInventory: includesAnySignal(['inventory', 'stock', 'inventario', 'catalog']),
      hasDocuments: includesAnySignal(['document', 'documents', 'docs', 'expediente']),
      hasMockPayments:
        includesAnySignal(['mock-payments', 'payment', 'payments', 'checkout']) &&
        !(
          Array.isArray(normalizedContract?.integrations) &&
          normalizedContract.integrations.some(
            (entry) =>
              normalizeOptionalString(entry?.mode) !== 'mock-only' ||
              entry?.realIntegrationAllowedNow === true,
          )
        ),
      hasMessaging: includesAnySignal([
        'messaging',
        'messages',
        'notifications',
        'communications',
        'comunicaciones',
      ]),
      hasAuthMock: includesAnySignal(['auth', 'login', 'roles', 'permissions', 'mock-auth']),
      hasValidation:
        preview?.validation?.present === true ||
        (Array.isArray(normalizedContract?.validation?.requiredPathGroups) &&
          normalizedContract.validation.requiredPathGroups.length > 0),
      hasSafeLocalMaterialization:
        preview?.safety?.safeForLocalMaterialization === true &&
        preview?.safety?.noDotEnv === true &&
        preview?.safety?.noNodeModules === true &&
        preview?.safety?.noDocker === true &&
        preview?.safety?.noCommands === true &&
        preview?.safety?.noWrites === true &&
        capabilityProfile?.generatorReadiness?.supportedNow !== false &&
        (candidatePlan?.present !== true ||
          candidatePlan?.candidate?.safety?.safeForLocalMaterialization === true),
      stackProfileRequested: capabilityProfile?.stackProfile?.requested === true,
      requiresSpecializedGenerator:
        capabilityProfile?.generatorReadiness?.specializedGeneratorRequired === true,
      generatorSupportedNow: capabilityProfile?.generatorReadiness?.supportedNow !== false,
      templateFamily:
        normalizeOptionalString(capabilityProfile?.generatorReadiness?.templateFamily) ||
        'generic-sandbox-fullstack-local',
      unsupportedStackReasons: Array.isArray(
        capabilityProfile?.generatorReadiness?.blockingReasons,
      )
        ? capabilityProfile.generatorReadiness.blockingReasons.slice(0, 8)
        : [],
      warnings,
      errors,
    }

    capabilities.capabilities = {
      hasPublicFrontend: capabilities.hasPublicFrontend,
      hasAdminPanel: capabilities.hasAdminPanel,
      hasOperatorPanel: capabilities.hasOperatorPanel,
      hasBackend: capabilities.hasBackend,
      hasDatabase: capabilities.hasDatabase,
      hasReporting: capabilities.hasReporting,
      hasScheduling: capabilities.hasScheduling,
      hasInventory: capabilities.hasInventory,
      hasDocuments: capabilities.hasDocuments,
      hasMockPayments: capabilities.hasMockPayments,
      hasMessaging: capabilities.hasMessaging,
      hasAuthMock: capabilities.hasAuthMock,
      hasValidation: capabilities.hasValidation,
      hasSafeLocalMaterialization: capabilities.hasSafeLocalMaterialization,
    }

    if (
      !capabilities.hasPublicFrontend &&
      !capabilities.hasAdminPanel &&
      !capabilities.hasOperatorPanel
    ) {
      pushUniqueMessage(
        warnings,
        'Todavia no se detectan superficies frontend suficientes para derivar capacidades estructurales completas.',
      )
    }
    if (!capabilities.hasBackend) {
      pushUniqueMessage(
        warnings,
        'No se detecta backend estructural dentro del contrato universal actual.',
      )
    }
    if (!capabilities.hasDatabase) {
      pushUniqueMessage(
        warnings,
        'No se detecta database estructural dentro del contrato universal actual.',
      )
    }
    if (!capabilities.hasValidation) {
      pushUniqueMessage(
        warnings,
        'Faltan señales de validation para promover capacidades estructurales completas.',
      )
    }
    if (!capabilities.hasSafeLocalMaterialization) {
      pushUniqueMessage(
        warnings,
        'Las capacidades estructurales todavia no pueden afirmar safe local materialization completa.',
      )
    }
    if (
      capabilities.stackProfileRequested === true &&
      capabilities.generatorSupportedNow !== true
    ) {
      pushUniqueMessage(
        warnings,
        'El stackProfile pedido requiere un generador especializado; la capa universal actual debe permanecer observacional o bloqueada.',
      )
      capabilities.unsupportedStackReasons.forEach((entry) => {
        pushUniqueMessage(warnings, entry)
      })
    }

    capabilities.warningsCount = capabilities.warnings.length
    capabilities.errorsCount = capabilities.errors.length
    return capabilities
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error'

    return {
      ...emptyCapabilities,
      present: true,
      evaluated: true,
      errors: [errorMessage.length <= 180 ? errorMessage : `${errorMessage.slice(0, 177)}...`],
      errorsCount: 1,
    }
  }
}

function buildLegacyDomainHardcodingDebtReport({
  generatedDomainStructuralCapabilities,
  legacyDetectors,
}) {
  const detectors =
    legacyDetectors && typeof legacyDetectors === 'object' ? legacyDetectors : {}
  const areas = [
    {
      name: 'detectSafeFirstDeliveryModuleFamily',
      detected: detectors.detectSafeFirstDeliveryModuleFamily === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'Resuelve familias legacy conocidas a partir de modulos y sigue condicionando ramas de runtime.',
    },
    {
      name: 'detectFullstackLocalDemoArchetype',
      detected: detectors.detectFullstackLocalDemoArchetype === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'Sostiene inferencia archetype-first para demo/materialization y necesita quedar como fallback explicito.',
    },
    {
      name: 'buildCanonicalFullstackLocalMaterializationContract',
      detected: detectors.buildCanonicalFullstackLocalMaterializationContract === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-migrate-to-capabilities',
      reason: 'Codifica required paths y contract kinds por vertical como fuente legacy de verdad.',
    },
    {
      name: 'inspectFullstackLocalMaterializationContract',
      detected: detectors.inspectFullstackLocalMaterializationContract === true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-migrate-to-capabilities',
      reason: 'Sigue mezclando inspeccion estructural con conocimiento legacy de archetypes y selectedDomain.',
    },
    {
      name: 'buildFullstackLocalMaterializationPlan',
      detected: detectors.buildFullstackLocalMaterializationPlan === true,
      classification: 'runtime-critical',
      migrationStatus: 'do-not-touch-yet',
      reason: 'Sigue siendo el punto mas sensible de compatibilidad y no conviene reescribirlo en este pase.',
    },
    {
      name: 'fullstackLocalDemoDataByVertical',
      detected: true,
      classification: 'fixture-only',
      migrationStatus: 'safe-to-isolate',
      reason: 'Los demos por vertical son utiles como regresion, pero no deberian gobernar el camino universal.',
    },
    {
      name: 'domainNormalizersByVertical',
      detected: true,
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'Persisten normalizadores por rubro que todavia sesgan selectedDomain y selectedContractKind.',
    },
    {
      name: 'selectedDomain-selectedContractKind',
      detected: true,
      classification: 'runtime-critical',
      migrationStatus: 'do-not-touch-yet',
      reason: 'Siguen siendo compatibilidad observable de payload y deben migrarse con cobertura mas amplia.',
    },
  ]

  const warnings = []
  const errors = []
  const runtimeCriticalCount = areas.filter(
    (entry) => entry.detected && entry.classification === 'runtime-critical',
  ).length
  const fixtureOnlyCount = areas.filter(
    (entry) => entry.detected && entry.classification === 'fixture-only',
  ).length
  const migrationCandidates = areas
    .filter(
      (entry) =>
        entry.detected &&
        (entry.migrationStatus === 'safe-to-wrap' ||
          entry.migrationStatus === 'safe-to-isolate' ||
          entry.migrationStatus === 'safe-to-migrate-to-capabilities'),
    )
    .map((entry) => ({
      area: entry.name,
      migrationStatus: entry.migrationStatus,
      reason: entry.reason,
    }))
  const riskyAreas = areas
    .filter(
      (entry) =>
        entry.detected &&
        (entry.classification === 'runtime-critical' ||
          entry.migrationStatus === 'do-not-touch-yet'),
    )
    .map((entry) => ({
      area: entry.name,
      migrationStatus: entry.migrationStatus,
      reason: entry.reason,
    }))
  const structuralCapabilities =
    generatedDomainStructuralCapabilities &&
    typeof generatedDomainStructuralCapabilities === 'object'
      ? generatedDomainStructuralCapabilities
      : null

  if (runtimeCriticalCount > 0) {
    pushUniqueMessage(
      warnings,
      'main.cjs todavia concentra resolvers runtime-critical por familia/archetype que deben migrarse de forma gradual.',
    )
  }
  if (fixtureOnlyCount === 0) {
    pushUniqueMessage(
      warnings,
      'No se detectaron suficientes zonas marcadas como fixture-only; conviene seguir separando demos de runtime real.',
    )
  }
  if (structuralCapabilities?.hasSafeLocalMaterialization !== true) {
    pushUniqueMessage(
      warnings,
      'Las capacidades estructurales todavia no alcanzan para reemplazar el hardcoding legacy como motor de runtime.',
    )
  }

  return {
    present: true,
    evaluated: true,
    behaviorChanged: false,
    legacyResolversDetected: areas.filter((entry) => entry.detected).length,
    runtimeCriticalCount,
    fixtureOnlyCount,
    migrationCandidates,
    riskyAreas,
    recommendedNextActions: [
      'Mantener buildFullstackLocalMaterializationPlan como fallback legacy mientras preview/candidate ganan cobertura.',
      'Seguir migrando inspeccion y comparacion hacia capabilities estructurales antes de tocar selectedDomain o selectedContractKind.',
      'Aislar demos y archetypes conocidos como fixtures/regresiones, no como fuente conceptual del runtime nuevo.',
    ],
    areas,
    warnings,
    errors,
    warningsCount: warnings.length,
    errorsCount: errors.length,
  }
}

function readLocalDeterministicExecutorAuditSurface({ executorBasePath, cwd } = {}) {
  const resolvedCwd =
    typeof cwd === 'string' && cwd.trim()
      ? cwd
      : typeof process !== 'undefined' && typeof process.cwd === 'function'
        ? process.cwd()
        : ''
  const basePath =
    typeof executorBasePath === 'string' && executorBasePath.trim()
      ? executorBasePath
      : resolvedCwd
        ? path.join(resolvedCwd, 'electron')
        : ''
  const executorFilePath = path.join(basePath, 'local-deterministic-executor.cjs')

  if (!fs.existsSync(executorFilePath)) {
    return {
      executorFilePath,
      executorFilePresent: false,
      sourceText: '',
      normalizedText: '',
      readError: '',
    }
  }

  try {
    const sourceText = fs.readFileSync(executorFilePath, 'utf8')
    return {
      executorFilePath,
      executorFilePresent: true,
      sourceText,
      normalizedText: sourceText.toLocaleLowerCase(),
      readError: '',
    }
  } catch (error) {
    return {
      executorFilePath,
      executorFilePresent: true,
      sourceText: '',
      normalizedText: '',
      readError:
        error instanceof Error ? error.message : normalizeOptionalString(String(error)) || 'error',
    }
  }
}

function buildLocalDeterministicExecutorLegacyDebtReport(options = {}) {
  const auditSurface = readLocalDeterministicExecutorAuditSurface(options)
  const warnings = []
  const errors = []

  const detectSignal = (patterns) =>
    patterns.some((pattern) => pattern.test(auditSurface.sourceText || ''))

  const areas = [
    {
      name: 'detectSafeFirstDeliveryInteractionMode',
      detected: detectSignal([/function\s+detectSafeFirstDeliveryInteractionMode\s*\(/u]),
      classification: 'runtime-critical',
      migrationStatus: 'capability-candidate',
      reason: 'Todavia resume ramas por ecommerce, school-crm y generic antes de llegar al runtime mode.',
    },
    {
      name: 'buildSafeFirstDeliveryRuntimeModeConfig',
      detected: detectSignal([/function\s+buildSafeFirstDeliveryRuntimeModeConfig\s*\(/u]),
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-migrate-later',
      reason: 'Sigue resolviendo runtimeMode a partir de interactionMode y necesita migracion gradual a capacidades.',
    },
    {
      name: 'productType-domainLabel-resolution',
      detected: detectSignal([/resolvedProductType/u, /resolvedDomain/u, /domainLabel/u]),
      classification: 'runtime-critical',
      migrationStatus: 'safe-to-wrap',
      reason: 'La resolucion de productType y domainLabel todavia condiciona copy, logs y plantillas por rubro.',
    },
    {
      name: 'school-crm-entry-templates',
      detected: detectSignal([/school-crm/u, /entryTemplates/u]),
      classification: 'safe-to-observe',
      migrationStatus: 'capability-candidate',
      reason: 'Las variaciones school-crm ya pueden reinterpretarse como admin-panel, forms y reporting.',
    },
    {
      name: 'ecommerce-mode-branches',
      detected: detectSignal([/ecommerce/u, /mercado pago/u, /catalogo/u]),
      classification: 'runtime-critical',
      migrationStatus: 'capability-candidate',
      reason: 'Las ramas ecommerce concentran catalog, checkout mock e inventario como capacidades transferibles.',
    },
    {
      name: 'generic-fallback-mode',
      detected: detectSignal([/return 'generic'/u, /kind:\s*'generic'/u]),
      classification: 'runtime-critical',
      migrationStatus: 'do-not-touch-yet',
      reason: 'El fallback generic sigue sosteniendo compatibilidad amplia y no conviene moverlo sin cobertura extra.',
    },
    {
      name: 'string-domain-logs-and-builders',
      detected: detectSignal([/domainLabel/u, /productLabel/u, /fallbackLabel/u]),
      classification: 'fixture-like',
      migrationStatus: 'safe-to-observe',
      reason: 'Hay copy y builders de UX local atados a labels de dominio que pueden desacoplarse despues del runtime.',
    },
  ]

  const domainSpecificSignals = [
    'ecommerce',
    'school-crm',
    'generic',
    'interactionMode',
    'runtimeMode',
    'productType',
    'domainLabel',
  ].filter((entry) => auditSurface.normalizedText.includes(entry.toLocaleLowerCase()))
  const normalizedDetectedSignals = domainSpecificSignals.map((entry) =>
    entry.toLocaleLowerCase(),
  )

  const capabilityMigrationCandidates = [
    {
      capability: 'catalog',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      note: 'Catalogo, productos y stock mock ya aparecen como senales estructurales reutilizables.',
    },
    {
      capability: 'admin-panel',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'partial',
      note: 'Los paneles administrativos ya pueden derivarse como vistas seguras sin atarse al rubro escolar.',
    },
    {
      capability: 'forms',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'partial',
      note: 'Los formularios mock del executor pueden unificarse como capacidades CRUD locales.',
    },
    {
      capability: 'reporting',
      currentBranches: ['school-crm-entry-templates', 'string-domain-logs-and-builders'],
      migrationReadiness: 'partial',
      note: 'Los reportes mock existen pero siguen mezclados con labels de dominio.',
    },
    {
      capability: 'mock-payments',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      note: 'Los pagos siguen siendo mock y pueden abstraerse sin tocar integraciones reales.',
    },
    {
      capability: 'tracking',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      note: 'Todavia no hay una capa de tracking estructural clara en el executor actual.',
    },
    {
      capability: 'database-local',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      note: 'El executor safe-first no gobierna database local real; debe quedar fuera hasta otra fase.',
    },
    {
      capability: 'backend-api',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      note: 'El executor no debe promover backend real sin una politica separada y aprobada.',
    },
  ]

  const runtimeCriticalCount = areas.filter(
    (entry) => entry.detected && entry.classification === 'runtime-critical',
  ).length
  const riskyAreas = areas
    .filter(
      (entry) =>
        entry.detected &&
        (entry.classification === 'runtime-critical' ||
          entry.migrationStatus === 'do-not-touch-yet'),
    )
    .map((entry) => ({
      area: entry.name,
      classification: entry.classification,
      migrationStatus: entry.migrationStatus,
      reason: entry.reason,
    }))

  if (auditSurface.executorFilePresent !== true) {
    pushUniqueMessage(
      errors,
      'No se encontro electron/local-deterministic-executor.cjs para auditar deuda legacy.',
    )
  }
  if (auditSurface.readError) {
    pushUniqueMessage(
      errors,
      `No se pudo leer el executor local para auditarlo: ${auditSurface.readError}.`,
    )
  }
  if (runtimeCriticalCount > 0) {
    pushUniqueMessage(
      warnings,
      'local-deterministic-executor.cjs todavia concentra ramas runtime-critical por rubro y necesita una migracion gradual a capacidades.',
    )
  }
  if (
    !normalizedDetectedSignals.includes('interactionmode') ||
    !normalizedDetectedSignals.includes('runtimemode')
  ) {
    pushUniqueMessage(
      warnings,
      'La auditoria no encontro todas las senales esperadas de interactionMode/runtimeMode; conviene revisar el executor manualmente antes de migrarlo.',
    )
  }

  return {
    present: true,
    evaluated: true,
    behaviorChanged: false,
    executorFilePresent: auditSurface.executorFilePresent === true,
    executorFilePath: auditSurface.executorFilePath,
    legacyBranchesDetected: areas.filter((entry) => entry.detected).length,
    runtimeCriticalCount,
    domainSpecificSignals,
    capabilityMigrationCandidates,
    riskyAreas,
    recommendedNextActions: [
      'Mantener interactionMode y runtimeMode actuales como fallback observable mientras se introducen capacidades estructurales paralelas.',
      'Separar primero catalog/admin-panel/forms/reporting/mock-payments como capacidades observacionales antes de tocar los branches de ejecucion.',
      'Dejar generic como fallback final hasta que los casos inventados y los smokes domain-agnostic cubran la migracion.',
    ],
    areas,
    warnings,
    errors,
    warningsCount: warnings.length,
    errorsCount: errors.length,
  }
}

function buildLocalDeterministicExecutorCapabilityMigrationPlan({
  localDeterministicExecutorLegacyDebtReport,
}) {
  const warnings = []
  const errors = []
  const debtReport =
    localDeterministicExecutorLegacyDebtReport &&
    typeof localDeterministicExecutorLegacyDebtReport === 'object'
      ? localDeterministicExecutorLegacyDebtReport
      : null

  const capabilityTargets = [
    {
      capability: 'catalog',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'branch-mapped',
      blockers: ['checkout mock y copy comercial siguen mezclados con labels ecommerce.'],
    },
    {
      capability: 'admin-panel',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'branch-mapped',
      blockers: ['todavia depende de templates y labels legacy.'],
    },
    {
      capability: 'public-surface',
      currentBranches: ['generic-fallback-mode', 'string-domain-logs-and-builders'],
      migrationReadiness: 'branch-mapped',
      blockers: ['faltan invariantes estructurales para diferenciar presentacion publica vs admin.'],
    },
    {
      capability: 'forms',
      currentBranches: ['school-crm-entry-templates', 'generic-fallback-mode'],
      migrationReadiness: 'branch-mapped',
      blockers: ['las variaciones siguen embebidas en templates por modo.'],
    },
    {
      capability: 'scheduling',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['no hay una abstraccion clara de scheduling dentro del executor actual.'],
    },
    {
      capability: 'inventory',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      blockers: ['stock e inventario aparecen, pero no como capability transversal.'],
    },
    {
      capability: 'reporting',
      currentBranches: ['school-crm-entry-templates', 'string-domain-logs-and-builders'],
      migrationReadiness: 'partial',
      blockers: ['faltan contratos estructurales de reporting compartidos.'],
    },
    {
      capability: 'documents',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['no hay superficie de documentos suficientemente clara en el executor actual.'],
    },
    {
      capability: 'tracking',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['tracking todavia vive mas en planner/main que en el executor.'],
    },
    {
      capability: 'mock-payments',
      currentBranches: ['ecommerce-mode-branches'],
      migrationReadiness: 'partial',
      blockers: ['hay mock payments, pero siguen mezclados con la rama ecommerce.'],
    },
    {
      capability: 'messaging',
      currentBranches: ['school-crm-entry-templates'],
      migrationReadiness: 'partial',
      blockers: ['mensajeria y comunicaciones no estan aisladas como capability generica.'],
    },
    {
      capability: 'auth-mock',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['auth mock no debe habilitarse desde este executor sin una fase separada.'],
    },
    {
      capability: 'database-local',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['database local real queda fuera del alcance seguro del executor actual.'],
    },
    {
      capability: 'backend-api',
      currentBranches: [],
      migrationReadiness: 'not-ready',
      blockers: ['backend API real no debe moverse desde este pase observacional.'],
    },
  ]

  const branchMappedCount = capabilityTargets.filter(
    (entry) =>
      entry.migrationReadiness === 'branch-mapped' || entry.migrationReadiness === 'partial',
  ).length
  const notReadyCount = capabilityTargets.filter(
    (entry) => entry.migrationReadiness === 'not-ready',
  ).length

  if (debtReport?.executorFilePresent !== true) {
    pushUniqueMessage(
      errors,
      'No hay un executor legible para construir un plan de migracion creible.',
    )
  }
  if ((debtReport?.runtimeCriticalCount || 0) > 0) {
    pushUniqueMessage(
      warnings,
      'El plan de migracion del executor sigue siendo solo observacional porque interactionMode/runtimeMode aun son runtime-critical.',
    )
  }

  return {
    present: true,
    evaluated: true,
    behaviorChanged: false,
    branchMappedCount,
    notReadyCount,
    capabilityTargets,
    recommendedNextActions: [
      'Empezar por catalog/admin-panel/public-surface/forms/reporting como capas observacionales paralelas al executor legacy.',
      'No tocar interactionMode ni runtimeMode hasta que los smokes domain-agnostic cubran generic, ecommerce y school-crm sin ramas nuevas.',
      'Mantener backend-api y database-local fuera del executor hasta una fase aprobada de runtime real.',
    ],
    warnings,
    errors,
    warningsCount: warnings.length,
    errorsCount: errors.length,
  }
}

module.exports = {
  normalizeGeneratedDomainRequestedStackProfile,
  resolveGeneratedDomainGeneratorReadiness,
  buildGeneratedDomainSpecializedTemplateArtifacts,
  deriveGeneratedDomainStructuralCapabilities,
  buildLegacyDomainHardcodingDebtReport,
  buildLocalDeterministicExecutorLegacyDebtReport,
  buildLocalDeterministicExecutorCapabilityMigrationPlan,
}
