# GeneratedDomainContract v1

## 1. Proposito

`GeneratedDomainContract v1` es el contrato universal que el Cerebro debe devolver para cualquier dominio cuando JEFE necesita planificar y preparar una entrega `fullstack-local`.

La idea central es separar dos responsabilidades:

- el Cerebro entiende el dominio pedido por el usuario
- JEFE entiende el schema del contrato y opera sobre ese schema

Eso permite que JEFE no dependa de una lista cerrada de rubros conocidos.

## 2. Principios

- dominio infinito
- schema estable
- dominio como datos, no como branch
- materializador domain-agnostic
- inspector domain-agnostic
- safety universal
- approvals separados de materializacion

## 3. Campo raiz del contrato

JSON conceptual:

```json
{
  "contractVersion": "1.0",
  "deliveryLevel": "fullstack-local",
  "domain": {
    "label": "Plant Carnivorous Nursery",
    "slug": "plant-carnivorous-nursery",
    "summary": "Sistema local para visitas, cuidados, ventas mock y reportes."
  },
  "root": {
    "slug": "carnivorous-plants-local",
    "sourceRoot": "carnivorous-plants-local",
    "targetRoot": "carnivorous-plants-local"
  },
  "roles": [],
  "entities": [],
  "states": {},
  "workflows": [],
  "frontendSurfaces": [],
  "backend": {
    "packageFile": "backend/package.json",
    "entryFile": "backend/src/server.js",
    "routes": [],
    "services": [],
    "modules": []
  },
  "database": {
    "schemaFile": "database/schema.sql",
    "seedFile": "database/seed.sql",
    "tables": [],
    "relationships": [],
    "seedData": []
  },
  "shared": {
    "files": []
  },
  "docs": [],
  "scripts": [],
  "integrations": [],
  "safety": {
    "forbiddenFiles": [
      ".env",
      "Dockerfile",
      "docker-compose.yml"
    ],
    "forbiddenSignals": [
      "real token",
      "external api call"
    ],
    "explicitExclusions": []
  },
  "materialization": {
    "requiredFiles": [],
    "operations": [],
    "allowedTargetPaths": []
  },
  "validation": {
    "syntaxChecks": [],
    "requiredPathGroups": [],
    "forbiddenSearchPatterns": []
  },
  "approvals": []
}
```

## 4. Definicion de campos

### `contractVersion`

- requerido
- string
- version del schema
- ejemplo: `1.0`
- validacion minima: no vacio

### `deliveryLevel`

- requerido
- string
- describe el nivel de entrega
- ejemplo: `fullstack-local`
- validacion minima: en esta fase, solo `fullstack-local`

### `domain`

- requerido
- objeto
- contiene identidad semantica del dominio

Campos:

- `label`: requerido, nombre legible
- `slug`: requerido, slug estable
- `summary`: opcional, resumen corto

### `root`

- requerido
- objeto
- describe donde vive el proyecto materializable

Campos:

- `slug`: requerido
- `sourceRoot`: requerido
- `targetRoot`: requerido

### `roles`

- opcional pero recomendado
- array de roles o actores principales
- ejemplo: `["visitor", "nursery-admin", "caretaker"]`

### `entities`

- opcional pero recomendado
- array de entidades del dominio
- ejemplo: `["plants", "care-schedules", "visit-reservations", "mock-sales"]`

### `states`

- opcional
- mapa de estados por aggregate o workflow
- ejemplo:

```json
{
  "reservation": ["pending", "confirmed", "cancelled"],
  "payment": ["pending", "approved", "rejected", "cancelled"]
}
```

### `workflows`

- opcional
- array de workflows clave
- ejemplo: reserva de visita, cuidado programado, venta mock

### `frontendSurfaces`

- requerido
- array de superficies frontend
- cada item debe definir:
  - `key`
  - `label`
  - `path`
  - `screens` opcional

Ejemplo:

```json
{
  "key": "public",
  "label": "Publico",
  "path": "frontend/public",
  "screens": ["catalog", "visit-reservations"]
}
```

### `backend`

- requerido
- objeto

Campos sugeridos:

- `packageFile`
- `entryFile`
- `routes`
- `services`
- `modules`

Validacion minima:

- si existe backend, sus archivos deben quedar dentro del root materializable

### `database`

- requerido
- objeto

Campos sugeridos:

- `schemaFile`
- `seedFile`
- `tables`
- `relationships`
- `seedData`

### `shared`

- opcional
- objeto con `files`
- para estados, contratos, constantes, helpers compartidos

### `docs`

- opcional
- array de rutas de documentacion

### `scripts`

- opcional
- array de rutas de scripts locales

### `integrations`

- opcional
- array de integraciones

Cada integracion puede incluir:

- `name`
- `mode`
- `realIntegrationAllowedNow`
- `notes`

### `safety`

- requerido
- objeto

Campos:

- `forbiddenFiles`
- `forbiddenSignals`
- `explicitExclusions`

### `materialization`

- requerido
- objeto

Campos:

- `requiredFiles`
- `operations`
- `allowedTargetPaths`

### `validation`

- requerido
- objeto

Campos:

- `syntaxChecks`
- `requiredPathGroups`
- `forbiddenSearchPatterns`

### `approvals`

- opcional
- array de approvals estructurados
- separa decisiones humanas de la materializacion local

## 5. Reglas de root

- `root.slug` debe ser estable y legible
- `root.sourceRoot` debe representar el root activo del plan
- `root.targetRoot` debe representar el root de la materializacion
- `sourceRoot` debe coincidir con `targetRoot` para materializar
- el root debe quedar dentro del workspace
- no se aceptan roots peligrosos como:
  - `C:\\`
  - `Users`
  - `Windows`
  - `/`
  - `/usr`
  - `/etc`
- el root no debe escapar el workspace con `..`

## 6. Reglas de materializacion

- `operations` deben derivar del contrato
- `allowedTargetPaths` deben derivar del root + required files + operaciones previstas
- no se aceptan operaciones fuera del scope
- `requiredFiles` deben estar alineados con:
  - `frontendSurfaces`
  - `backend`
  - `database`
  - `shared`
  - `docs`
  - `scripts`
- el materializador no deberia inventar un rubro; deberia transformar el contrato en operaciones

## 7. Reglas de safety

- no `.env`
- no `Dockerfile`
- no `docker-compose.yml`
- no `node_modules`
- no `deploy`
- no tokens
- no external API calls
- no real payments
- no real webhooks
- no production DB

Estas reglas deben ser universales, no asociadas a un dominio especifico.

## 8. Reglas de integracion mock

- integraciones reales siempre bloqueadas salvo aprobacion explicita
- `mock-only` permitido
- ejemplo valido:
  - payment provider mock sin tokens
  - estados `pending`, `approved`, `rejected`, `cancelled`
- ejemplo invalido:
  - checkout real
  - webhooks reales
  - credenciales reales
  - llamadas a API externa real

## 9. Reglas de approvals

- un approval real debe registrarse como decision estructurada
- `approval later` no debe bloquear mock local
- approvals reales no deben mezclarse con materializacion local
- la materializacion local debe poder continuar si la integracion real queda diferida

## 10. Ejemplo generico

Dominio inventado:

`sistema para administrar criaderos de plantas carnivoras con reservas de visitas, cuidados, ventas mock y reportes`

Este ejemplo es deliberado:

- no es logistica
- no es cursos online
- no es hoteleria
- no es veterinaria

Si el schema sirve para este caso, entonces la arquitectura empieza a ser realmente domain-agnostic.

## 11. Ejemplo de contrato JSON para ese dominio inventado

```json
{
  "contractVersion": "1.0",
  "deliveryLevel": "fullstack-local",
  "domain": {
    "label": "Carnivorous Plant Nursery",
    "slug": "carnivorous-plant-nursery",
    "summary": "Gestion local de visitas, cuidados, ventas mock y reportes."
  },
  "root": {
    "slug": "carnivorous-plants-local",
    "sourceRoot": "carnivorous-plants-local",
    "targetRoot": "carnivorous-plants-local"
  },
  "roles": ["visitor", "caretaker", "nursery-admin"],
  "entities": [
    "plants",
    "species",
    "care-schedules",
    "visit-reservations",
    "mock-sales",
    "reports"
  ],
  "states": {
    "reservation": ["pending", "confirmed", "cancelled"],
    "payment": ["pending", "approved", "rejected", "cancelled"]
  },
  "workflows": [
    "register-visit-reservation",
    "track-care-routine",
    "record-mock-sale"
  ],
  "frontendSurfaces": [
    {
      "key": "public",
      "label": "Publico",
      "path": "frontend/public",
      "screens": ["catalog", "visit-reservations"]
    },
    {
      "key": "care",
      "label": "Cuidados",
      "path": "frontend/care",
      "screens": ["schedules", "alerts"]
    },
    {
      "key": "admin",
      "label": "Admin",
      "path": "frontend/admin",
      "screens": ["plants", "mock-sales", "reports"]
    }
  ],
  "backend": {
    "packageFile": "backend/package.json",
    "entryFile": "backend/src/server.js",
    "routes": [
      "backend/src/routes/plants.js",
      "backend/src/routes/species.js",
      "backend/src/routes/visit-reservations.js",
      "backend/src/routes/care-schedules.js",
      "backend/src/routes/mock-sales.js",
      "backend/src/routes/reports.js"
    ],
    "services": [
      "backend/src/services/mock-payment-provider.js"
    ],
    "modules": [
      "backend/src/modules/reports.js"
    ]
  },
  "database": {
    "schemaFile": "database/schema.sql",
    "seedFile": "database/seed.sql",
    "tables": [
      "plants",
      "species",
      "care_schedules",
      "visit_reservations",
      "mock_sales"
    ],
    "relationships": [
      "plants.species_id -> species.id"
    ],
    "seedData": [
      "species base",
      "plants base",
      "visit reservations mock",
      "mock sales base"
    ]
  },
  "shared": {
    "files": [
      "shared/plant-statuses.js",
      "shared/payment-statuses.js",
      "shared/reservation-statuses.js"
    ]
  },
  "docs": [
    "docs/API.md",
    "docs/ARCHITECTURE.md",
    "docs/DB_SCHEMA.md",
    "docs/PAYMENTS_MOCK.md",
    "docs/LOCAL_VALIDATION.md"
  ],
  "scripts": [
    "scripts/seed-local.js"
  ],
  "integrations": [
    {
      "name": "payment-provider",
      "mode": "mock-only",
      "realIntegrationAllowedNow": false
    }
  ],
  "safety": {
    "forbiddenFiles": [".env", "Dockerfile", "docker-compose.yml"],
    "forbiddenSignals": ["real token", "external api call"],
    "explicitExclusions": ["deploy", "node_modules", "real webhook"]
  },
  "materialization": {
    "requiredFiles": [
      "backend/src/server.js",
      "database/schema.sql",
      "database/seed.sql",
      "frontend/public/index.html",
      "frontend/public/app.js",
      "frontend/care/index.html",
      "frontend/care/app.js",
      "frontend/admin/index.html",
      "frontend/admin/app.js",
      "scripts/seed-local.js"
    ],
    "operations": [],
    "allowedTargetPaths": []
  },
  "validation": {
    "syntaxChecks": [
      "node --check backend/src/server.js",
      "node --check frontend/public/app.js"
    ],
    "requiredPathGroups": [
      ["backend/src/server.js"],
      ["database/schema.sql"],
      ["database/seed.sql"],
      ["frontend/public/index.html", "frontend/public/app.js"]
    ],
    "forbiddenSearchPatterns": [
      "ACCESS_TOKEN",
      "client_secret",
      "api.mercadopago.com"
    ]
  },
  "approvals": [
    {
      "key": "payment-provider-real",
      "scope": "real-payments",
      "status": "deferred",
      "allowsNow": ["mock-payments"],
      "forbidsNow": ["real-payments", "real-webhooks", ".env"]
    }
  ]
}
```

## 12. Como debe usarlo JEFE

- el Cerebro genera el contrato
- el normalizador valida estructura y defaults
- el materializador deriva operaciones
- el renderer muestra readiness o diagnostico
- los tests validan el schema universal y casos de contaminacion

La clave es que ninguna de esas capas deberia requerir una lista cerrada de dominios conocidos.

## 13. Que queda fuera de esta fase

- conectar el contrato nuevo al runtime actual
- reemplazar contratos existentes de cursos o logistica
- refactor profundo de `electron/main.cjs`
- materializar un dominio nuevo real desde esta base
- reescribir el renderer actual
- cambiar la UI

En esta fase solo se define la base tecnica y, si es seguro, helpers puros aislados y pruebas livianas alrededor del schema.
