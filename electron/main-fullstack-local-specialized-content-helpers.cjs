function buildFullstackLocalSpecializedFrontendContentBundle({
  appTitle,
  fullstackLocalDemoData,
  onlineCoursesCourses,
  onlineCoursesReports,
  onlineCoursesStudents,
  onlineCoursesProgress,
  onlineCoursesPayments,
  usesOnlineCoursesFullstackContract,
}) {
  const frontendAdminReadmeContent = usesOnlineCoursesFullstackContract
    ? `# Frontend admin local

Esta carpeta describe la experiencia administrativa local para ${appTitle}.

- Revisar cursos, categorías, módulos, clases, planes y reportes mock.
- No instalar dependencias ni levantar servicios desde esta fase.
- El contenido sigue siendo local, editable y acotado al workspace.
`
    : `# Frontend admin local

Esta carpeta describe la experiencia administrativa local para ${appTitle}.

- Revisar dashboard, operaciones internas y estados mock sin backend real.
- No instalar dependencias ni levantar servicios desde esta fase.
- El contenido sigue siendo local, editable y acotado al workspace.
`
  const frontendPublicReadmeContent = usesOnlineCoursesFullstackContract
    ? `# Frontend publico local

Esta carpeta describe el catálogo público local para ${appTitle}.

- Mostrar cursos, categorías y planes sin exponer servicios reales.
- No publicar, no desplegar y no conectar APIs externas.
- Mantener la experiencia en modo local y revisable.
`
    : `# Frontend publico local

Esta carpeta describe la consulta publica local por codigo para ${appTitle}.

- Mostrar tracking o estado publico mock sin exponer servicios reales.
- No publicar, no desplegar y no conectar APIs externas.
- Mantener la experiencia en modo local y revisable.
`
  const frontendStudentReadmeContent = `# Frontend alumno local

Esta carpeta describe el panel del alumno local para ${appTitle}.

- Revisar inscripciones, progreso por clase y estado del plan sin auth real.
- No instalar dependencias ni levantar servicios.
- La simulación de pagos queda limitada a mock local documentado.
`
  const logisticsAdminIndexHtmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle} | Panel admin local</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body data-surface="admin">
    <main id="app"></main>
    <script src="./app.js"></script>
  </body>
</html>
`
  const logisticsPublicIndexHtmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle} | Tracking local</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body data-surface="public">
    <main id="app"></main>
    <script src="./app.js"></script>
  </body>
</html>
`
  const logisticsAdminAppJsContent = `const adminPlan = ${JSON.stringify(
    {
      title: `${appTitle} · Panel administrativo local`,
      subtitle:
        'Vista local y revisable de envíos, estados, incidencias y reportes básicos, sin backend real.',
      metrics: fullstackLocalDemoData?.metrics || [],
      alerts: fullstackLocalDemoData?.alerts || [],
      events: fullstackLocalDemoData?.trackingEvents || [],
      entities: fullstackLocalDemoData?.domainEntities || [],
    },
    null,
    2,
  )}

const root = document.getElementById('app')
if (root) {
  root.innerHTML = [
    '<section class="hero"><span class="eyebrow">Admin local</span><h1>' + adminPlan.title + '</h1><p>' + adminPlan.subtitle + '</p></section>',
    '<section class="grid">' +
      adminPlan.metrics.map((entry) => '<article class="card"><strong>' + entry.label + '</strong><span>' + entry.value + '</span><p>' + entry.detail + '</p></article>').join('') +
    '</section>',
    '<section class="columns"><article class="card"><h2>Entidades</h2><ul>' +
      adminPlan.entities.map((entry) => '<li>' + entry + '</li>').join('') +
    '</ul></article><article class="card"><h2>Eventos de tracking</h2><ul>' +
      adminPlan.events.map((entry) => '<li><strong>' + (entry.patient || entry.shipment || entry.label || entry.id || 'Evento') + '</strong> <span>' + (entry.status || entry.eventStatus || '') + '</span></li>').join('') +
    '</ul></article></section>',
    '<section class="card"><h2>Alertas</h2><ul>' +
      adminPlan.alerts.map((entry) => '<li><strong>' + entry.title + '</strong><p>' + entry.detail + '</p></li>').join('') +
    '</ul></section>',
  ].join('')
}
`
  const logisticsPublicAppJsContent = `const publicTrackingPlan = ${JSON.stringify(
    {
      title: `${appTitle} · Consulta pública por código`,
      subtitle:
        'Simulación local para revisar trackingCode, historial de estados e incidencias sin servicios externos.',
      constraints: fullstackLocalDemoData?.constraints || [],
      events: fullstackLocalDemoData?.trackingEvents || [],
    },
    null,
    2,
  )}

const root = document.getElementById('app')
if (root) {
  root.innerHTML = [
    '<section class="hero"><span class="eyebrow">Tracking público local</span><h1>' + publicTrackingPlan.title + '</h1><p>' + publicTrackingPlan.subtitle + '</p></section>',
    '<section class="card search-card"><label for="tracking-code">Código de seguimiento</label><input id="tracking-code" value="TRK-001" readonly /><p>Mock local, sin API real ni base activa.</p></section>',
    '<section class="card"><h2>Timeline local</h2><ul>' +
      publicTrackingPlan.events.map((entry) => '<li><strong>' + (entry.patient || entry.shipment || entry.label || entry.id || 'Evento') + '</strong><span>' + (entry.status || entry.eventStatus || '') + '</span></li>').join('') +
    '</ul></section>',
    '<section class="card"><h2>Restricciones</h2><ul>' +
      publicTrackingPlan.constraints.map((entry) => '<li>' + entry + '</li>').join('') +
    '</ul></section>',
  ].join('')
}
`
  const logisticsSurfaceStylesContent = `.hero { padding: 24px; border-radius: 18px; background: linear-gradient(135deg, #0f2438, #1c4f6d); color: #f5fbff; margin-bottom: 20px; }
.eyebrow { display: inline-block; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.8; margin-bottom: 8px; }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin-bottom: 20px; }
.columns { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-bottom: 20px; }
.card { background: #ffffff; border: 1px solid #d9e5ef; border-radius: 16px; padding: 18px; box-shadow: 0 14px 30px rgba(15, 36, 56, 0.08); }
.card h2 { margin-top: 0; }
.card ul { margin: 0; padding-left: 0; list-style: none; }
.card li { margin-bottom: 12px; }
.card li:last-child { margin-bottom: 0; }
.card-title { display: block; margin: 0 0 8px; font-size: 1.02rem; line-height: 1.35; }
.meta-line { display: block; margin: 0 0 6px; color: #36546a; line-height: 1.45; }
.meta-label { font-weight: 600; color: #163247; }
.badge { display: inline-block; margin: 0 0 8px; padding: 4px 10px; border-radius: 999px; background: #e4f0f8; color: #174161; font-size: 0.82rem; font-weight: 600; }
.metric-card { display: flex; flex-direction: column; gap: 6px; }
.metric-label { font-size: 0.92rem; color: #476579; }
.metric-value { display: block; font-size: 1.8rem; line-height: 1; color: #163247; }
.metric-detail { margin: 0; color: #4f6a7d; line-height: 1.45; }
.card-note { margin: 10px 0 0; color: #4f6a7d; line-height: 1.5; }
.search-card input { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid #aac3d6; background: #f7fbfe; font: inherit; }
body { margin: 0; padding: 24px; background: #eef5f9; color: #163247; font-family: 'Segoe UI', sans-serif; }
`
  const onlineCoursesAdminIndexHtmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle} | Admin local</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body data-surface="admin">
    <main id="app"></main>
    <script src="./app.js"></script>
  </body>
</html>
`
  const onlineCoursesPublicIndexHtmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle} | Público local</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body data-surface="public">
    <main id="app"></main>
    <script src="./app.js"></script>
  </body>
</html>
`
  const onlineCoursesStudentIndexHtmlContent = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle} | Alumno local</title>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body data-surface="student">
    <main id="app"></main>
    <script src="./app.js"></script>
  </body>
</html>
`
  const onlineCoursesAdminAppJsContent = `const adminPlan = ${JSON.stringify(
    {
      title: `${appTitle} · Panel administrativo local`,
      subtitle:
        'Vista local y revisable de cursos, categorías, planes, pagos mock y reportes, sin backend real.',
      metrics: fullstackLocalDemoData?.metrics || [],
      alerts: fullstackLocalDemoData?.alerts || [],
      courses: onlineCoursesCourses,
      reports: onlineCoursesReports,
    },
    null,
    2,
  )}

const root = document.getElementById('app')
if (root) {
  root.innerHTML = [
    '<section class="hero"><span class="eyebrow">Admin local</span><h1>' + adminPlan.title + '</h1><p>' + adminPlan.subtitle + '</p></section>',
    '<section class="grid">' + adminPlan.metrics.map((entry) => '<article class="card metric-card"><span class="metric-label">' + entry.label + '</span><strong class="metric-value">' + entry.value + '</strong><p class="metric-detail">' + entry.detail + '</p></article>').join('') + '</section>',
    '<section class="columns"><article class="card"><h2>Cursos</h2><ul>' + adminPlan.courses.map((entry) => '<li><strong class="card-title">' + entry.title + '</strong><span class="badge">Estado: ' + entry.status + '</span><p class="meta-line"><span class="meta-label">Plan requerido:</span> ' + entry.plan + '</p><p class="meta-line"><span class="meta-label">Clases:</span> ' + entry.lessons + '</p><p class="card-note">' + entry.note + '</p></li>').join('') + '</ul></article><article class="card"><h2>Reportes</h2><ul>' + adminPlan.reports.map((entry) => '<li><strong class="card-title">' + entry.name + '</strong><p class="meta-line"><span class="meta-label">Valor:</span> ' + entry.value + '</p><p class="card-note">' + entry.detail + '</p></li>').join('') + '</ul></article></section>',
    '<section class="card"><h2>Alertas</h2><ul>' + adminPlan.alerts.map((entry) => '<li><strong>' + entry.title + '</strong><p>' + entry.detail + '</p></li>').join('') + '</ul></section>',
  ].join('')
}
`
  const onlineCoursesPublicAppJsContent = `const publicPlan = ${JSON.stringify(
    {
      title: `${appTitle} · Catálogo público local`,
      subtitle:
        'Simulación local del catálogo de cursos, categorías y planes sin servicios externos ni checkout real.',
      courses: onlineCoursesCourses,
      constraints: fullstackLocalDemoData?.constraints || [],
    },
    null,
    2,
  )}

const root = document.getElementById('app')
if (root) {
  root.innerHTML = [
    '<section class="hero"><span class="eyebrow">Público local</span><h1>' + publicPlan.title + '</h1><p>' + publicPlan.subtitle + '</p></section>',
    '<section class="columns">' + publicPlan.courses.map((entry) => '<article class="card"><strong class="card-title">' + entry.title + '</strong><p class="meta-line"><span class="meta-label">Categoría:</span> ' + entry.category + '</p><p class="meta-line"><span class="meta-label">Plan base:</span> ' + entry.plan + '</p><p class="meta-line"><span class="meta-label">Clases:</span> ' + entry.access + '</p><p class="card-note">' + entry.note + '</p></article>').join('') + '</section>',
    '<section class="card"><h2>Restricciones</h2><ul>' + publicPlan.constraints.map((entry) => '<li>' + entry + '</li>').join('') + '</ul></section>',
  ].join('')
}
`
  const onlineCoursesStudentAppJsContent = `const studentPlan = ${JSON.stringify(
    {
      title: `${appTitle} · Panel del alumno local`,
      subtitle:
        'Vista local y revisable de inscripciones, progreso y pagos mock, sin auth real ni servicios externos.',
      students: onlineCoursesStudents,
      progress: onlineCoursesProgress,
      payments: onlineCoursesPayments,
    },
    null,
    2,
  )}

const root = document.getElementById('app')
if (root) {
  root.innerHTML = [
    '<section class="hero"><span class="eyebrow">Alumno local</span><h1>' + studentPlan.title + '</h1><p>' + studentPlan.subtitle + '</p></section>',
    '<section class="columns"><article class="card"><h2>Alumnos mock</h2><ul>' + studentPlan.students.map((entry) => '<li><strong class="card-title">' + entry.name + '</strong><p class="meta-line"><span class="meta-label">Plan:</span> ' + entry.plan + '</p><p class="meta-line"><span class="meta-label">Acceso:</span> ' + entry.access + '</p></li>').join('') + '</ul></article><article class="card"><h2>Progreso</h2><ul>' + studentPlan.progress.map((entry) => '<li><strong class="card-title">' + entry.course + '</strong><p class="meta-line"><span class="meta-label">Avance:</span> ' + entry.completion + '</p><p class="card-note">' + entry.note + '</p></li>').join('') + '</ul></article></section>',
    '<section class="card"><h2>Pagos mock</h2><ul>' + studentPlan.payments.map((entry) => '<li><strong class="card-title">' + entry.plan + '</strong><p class="meta-line"><span class="meta-label">Estado:</span> ' + entry.status + '</p><p class="meta-line"><span class="meta-label">Monto:</span> ' + entry.amount + '</p><p class="card-note">' + entry.note + '</p></li>').join('') + '</ul></section>',
  ].join('')
}
`

  return {
    frontendAdminReadmeContent,
    frontendPublicReadmeContent,
    frontendStudentReadmeContent,
    logisticsAdminIndexHtmlContent,
    logisticsPublicIndexHtmlContent,
    logisticsAdminAppJsContent,
    logisticsPublicAppJsContent,
    logisticsSurfaceStylesContent,
    onlineCoursesAdminIndexHtmlContent,
    onlineCoursesPublicIndexHtmlContent,
    onlineCoursesStudentIndexHtmlContent,
    onlineCoursesAdminAppJsContent,
    onlineCoursesPublicAppJsContent,
    onlineCoursesStudentAppJsContent,
  }
}

function buildFullstackLocalSpecializedDocumentationContentBundle({
  documentationBundle,
  fullstackContractProfile,
  usesCanonicalSpecializedFullstackContract,
  usesOnlineCoursesFullstackContract,
  dataModelEntityLines,
  dataModelRelationshipLines,
}) {
  const docsArchitectureContent = documentationBundle.architectureContent
  const docsCanonicalArchitectureContent = usesCanonicalSpecializedFullstackContract
    ? documentationBundle.architectureContent
    : ''
  const docsApiContent = usesOnlineCoursesFullstackContract
    ? `# API local prevista

## Alcance

- strategy esperada: \`materialize-fullstack-local-plan\`
- executionMode esperado: \`executor\`
- nextExpectedAction esperado: \`execute-plan\`
- runtime real: deshabilitado

## Endpoints locales revisables

- \`GET /health\`: contrato de salud conceptual.
- \`GET /courses\`: listado mock de cursos y acceso por plan.
- \`GET /categories\`: categorías del catálogo local.
- \`GET /modules\`: módulos por curso.
- \`GET /lessons\`: clases gratuitas y premium.
- \`GET /students\`: alumnos mock y plan activo.
- \`GET /enrollments\`: inscripciones y acceso por plan.
- \`GET /plans\`: reglas Free, Plata y Oro.
- \`GET /payments\`: pagos simulados por mock-mercado-pago.
- \`GET /progress\`: avance del alumno por clase.

## Restricciones

- Sin auth real, sin sesiones persistentes, sin integraciones externas.
- Sin deploy, sin Docker, sin credenciales y sin servicios activos.
`
    : `# API local prevista

## Alcance

- strategy esperada: \`materialize-fullstack-local-plan\`
- executionMode esperado: \`executor\`
- nextExpectedAction esperado: \`execute-plan\`
- runtime real: deshabilitado

## Endpoints locales revisables

- \`GET /health\`: contrato de salud conceptual.
- \`GET ${fullstackContractProfile.primaryRoutePath}\`: ${fullstackContractProfile.primaryRoutePurpose}
${fullstackContractProfile.publicRoutePath ? `- \`GET ${fullstackContractProfile.publicRoutePath}\`: ${fullstackContractProfile.publicRoutePurpose}\n` : ''}- \`GET /reports\`: resumen local sin exportacion real.

## Restricciones

- Sin auth real, sin sesiones persistentes, sin integraciones externas.
- Sin deploy, sin Docker, sin credenciales y sin servicios activos.
`
  const docsCanonicalApiContent = usesCanonicalSpecializedFullstackContract
    ? docsApiContent
    : ''
  const docsDataModelContent = `# Modelo de datos local

## Entidades principales

${dataModelEntityLines}

## Relaciones base

${dataModelRelationshipLines}

## Restricciones

- SQLite o base local solo como referencia revisable.
- Sin migraciones ejecutadas ni conexiones reales.
- Los seeds se documentan en \`database/seed.sql\` y \`database/seeds/seed-local.sql\`, sin ejecutarse automaticamente.
`
  const docsCanonicalDbSchemaContent = usesCanonicalSpecializedFullstackContract
    ? `# Contrato SQL local

## Archivos obligatorios

- \`database/schema.sql\`
- \`database/seed.sql\`
- \`database/seeds/seed-local.sql\` como compatibilidad local adicional

## Entidades esperadas

${dataModelEntityLines}

## Notas

- SQLite o base local solamente como referencia revisable.
- No se ejecutan migraciones, seeds ni servicios.
- JSON puede existir como fixture auxiliar de frontend, pero no reemplaza el contrato SQL local.
`
    : ''
  const docsPaymentsMockContent = usesOnlineCoursesFullstackContract
    ? `# Pagos mock locales

## Objetivo

Modelar una integración futura con Mercado Pago sin credenciales, sin checkout real y sin llamadas externas.

## Adaptador local

- Archivo: \`backend/src/services/mock-mercado-pago.js\`
- Modo: \`review-only\`
- HTTP externo: deshabilitado
- Tokens: no se usan
- Archivos locales con secretos: fuera de alcance

## Estados soportados

- \`pending\`
- \`approved\`
- \`rejected\`
- \`cancelled\`

## Notas

- Los pagos son solo datos mock y documentación de integración futura.
- Cualquier integración real requiere aprobación humana explícita.
`
    : ''
  const docsLocalValidationContent = usesOnlineCoursesFullstackContract
    ? `# Local validation

## Qué revisar

1. Abrir \`frontend/public/index.html\`, \`frontend/admin/index.html\` y \`frontend/student/index.html\` por \`file://\`.
2. Confirmar que el catálogo, panel admin y panel alumno muestren cursos, alumnos, pagos mock y progreso.
3. Revisar \`database/schema.sql\` y \`database/seed.sql\` como contrato SQL local.
4. Validar que \`backend/src/services/mock-mercado-pago.js\` no tenga tokens, fetch ni llamadas externas.
5. Confirmar que los planes \`Free\`, \`Plata\` y \`Oro\` gobiernen el acceso de forma mock.

## Qué no hacer

- No crear archivos locales con secretos
- No instalar dependencias
- No levantar runtime real
- No usar APIs externas reales
`
    : ''

  return {
    docsArchitectureContent,
    docsCanonicalArchitectureContent,
    docsApiContent,
    docsCanonicalApiContent,
    docsDataModelContent,
    docsCanonicalDbSchemaContent,
    docsPaymentsMockContent,
    docsLocalValidationContent,
  }
}

module.exports = {
  buildFullstackLocalSpecializedFrontendContentBundle,
  buildFullstackLocalSpecializedDocumentationContentBundle,
}