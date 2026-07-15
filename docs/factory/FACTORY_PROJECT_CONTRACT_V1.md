# FactoryProjectContract v1

## Propósito

`FactoryProjectContract v1` es el contrato de gobernanza e identidad de una aplicación independiente creada por JEFE. Describe qué producto se está creando, de dónde proviene, cómo debe aislarse, qué calidad y seguridad exige, qué memoria le corresponde y qué condiciones futuras gobiernan repositorio, CI, publicación y aprendizaje.

El contrato es TypeScript puro, JSON-serializable, versionado, sin I/O y sin dependencias nuevas.

## Problema que resuelve

JEFE ya puede entender dominios, planificar, materializar, revisar y persistir runs, pero esos modelos no definen en un único lugar el lifecycle del producto independiente. Sin este contrato pueden duplicarse identidades, roots, approvals y evidencia, o confundirse JEFE con los productos generados.

La regla central es:

```text
JEFE es la fábrica.
El output es un producto independiente.
```

Un producto generado no puede importar módulos de JEFE, depender de JEFE en runtime, usar rutas internas de JEFE ni continuar su desarrollo dentro del repositorio de JEFE.

## Qué no hace todavía

- No se integra con Electron, IPC, UI ni generación real.
- No crea carpetas, repositorios, workflows o deployments.
- No ejecuta comandos ni accede al filesystem o a la red.
- No migra outputs o contratos históricos.
- No autoriza automáticamente llamadas externas, pushes o deploys.

## Relación con contratos existentes

`FactoryProjectContract v1` no reemplaza todavía:

- `GeneratedDomainContract`, que describe dominio, stack funcional y materialización.
- Approvals, human approval records y permit bundles actuales.
- Evidence bundles, delivery review/correction y delivery ledger.
- Project operations run envelope.
- Run persistence y generación desde brief.

Los extiende conceptualmente desde una capa superior. En futuras fases esos artefactos podrán referenciar el mismo `projectId`, `briefId`, `runId`, namespaces y policies sin duplicar fuentes de verdad.

## Relación con run persistence y lineage

El bloque `lineage` conserva referencias, no contenido runtime:

- oportunidad opcional;
- `briefId` obligatorio;
- `runId` obligatorio;
- chat/hash/output/parent opcionales;
- `generatedBy: JEFE`.

Run persistence seguirá siendo dueño de brief, status, logs y artefactos. El contrato solo fija la identidad durable que permitirá correlacionarlos.

## Relación con MEMORIA

El contrato separa:

- namespace global de factory;
- namespace exclusivo del proyecto;
- política de aprendizaje global;
- promoción de aprendizajes revisados;
- retención y datos obsoletos.

No implementa almacenamiento. La integración futura debe impedir mezcla entre proyectos y promover conocimiento global solo después de revisión y redacción.

## Relación con repositorios independientes

La policy de repositorio expresa provider, ownership, visibilidad, nombre, rama, protección y reglas de commit/push. Declarar la policy no crea ni publica un repo. Toda escritura remota seguirá requiriendo approval explícito.

## Estructura

| Bloque | Responsabilidad |
| --- | --- |
| raíz | versión, kind, schema y timestamps controlados |
| `project` | identidad y ownership del producto |
| `independence` | invariantes de separación respecto de JEFE |
| `lineage` | oportunidad, brief, run y output |
| `paths` | root planeado y roots de evidencia/artefactos |
| `memory` | namespaces, promoción, retención y staleness |
| `stack` | tecnología planeada sin ejecutar instalaciones |
| `environmentVariables` | nombres y metadata, nunca valores |
| `quality` | checks y tipos de QA requeridos/planeados |
| `security` | secretos, sandbox, red, filesystem, comandos y prompt injection |
| `approvals` | stages humanos; Codex nunca se autoaprueba |
| `repository` | repo independiente planeado |
| `ci` | provider, workflows, checks, staging y rollback |
| `publication` | staging, producción, dominios y release approval |
| `analytics` | analítica, monetización y criterios de escala/cierre |
| `evidence` | artefactos, reportes, logs y trazabilidad |
| `lifecycle` | status, readiness, warnings, riesgos y blockers |

## Ejemplo JSON reducido

```json
{
  "contractVersion": "1.0",
  "contractKind": "factory-project-contract",
  "schemaVersion": 1,
  "createdAt": "2026-07-15T15:00:00.000Z",
  "project": {
    "projectId": "factory-project-acme-portal",
    "slug": "acme-portal",
    "name": "Acme Portal",
    "description": "Portal independiente",
    "projectType": "web-application"
  },
  "independence": {
    "runtimeDependsOnJefe": false,
    "mustUseOwnRepository": true,
    "mustHaveOwnRoot": true,
    "forbiddenRuntimeImports": ["JEFE", "ai-orchestrator"],
    "allowedTraceabilityLinks": ["briefId", "runId", "outputId"]
  },
  "lineage": {
    "briefId": "brief-001",
    "runId": "run-001",
    "generatedBy": "JEFE"
  },
  "memory": {
    "memoryNamespace": "factory",
    "projectMemoryNamespace": "factory/projects/acme-portal",
    "globalLearningPolicy": "reviewed-only",
    "promotionPolicy": "human-approval-required",
    "retentionPolicy": "project-policy-controlled",
    "staleDataPolicy": "mark-stale-before-replacement"
  }
}
```

El contrato real exige además paths, stack, entorno, quality, security, approvals, repository, CI, publication, analytics, evidence y lifecycle.

## Validaciones v1

El validador manual devuelve `{ ok, errors, warnings }` y verifica como mínimo:

- version/kind/schema correctos;
- identidad, `briefId`, `runId` y namespaces presentes;
- `runtimeDependsOnJefe === false`;
- `codexSelfApprovalAllowed === false`;
- approvals para llamadas externas y deploy;
- evidencia requerida no vacía;
- variables sin `value` y secretos sin ejemplos;
- roots relativos sin traversal ni segmentos protegidos;
- repositorio y CI consistentes cuando son obligatorios.

Solo `parseFactoryProjectContractV1` puede lanzar si recibe JSON imposible de parsear. Validar objetos nunca lanza por formato inválido.

## API pura

- `createFactoryProjectContractV1(input)`
- `validateFactoryProjectContractV1(value)`
- `serializeFactoryProjectContractV1(contract)`
- `parseFactoryProjectContractV1(json)`
- `isFactoryProjectContractV1(value)`
- `summarizeFactoryProjectContractV1(contract)`

Los timestamps se suministran como input. Ninguna función usa reloj, filesystem, comandos, Electron, React o servicios externos. La creación clona el input para no mutarlo.

## Integración futura

1. Referenciar el contrato desde run persistence sin cambiar ownership.
2. Asociar `GeneratedDomainContract` por identidad/version, no copiarlo.
3. Derivar evidence y operations envelopes con el mismo lineage.
4. Crear un gate explícito para root/repo independiente.
5. Integrar CI, MEMORIA y publicación solo con adapters y approvals.
6. Añadir version adapters antes de cambiar el schema.

## Reglas de independencia

- El root del producto es propio y portable.
- El repo del producto es distinto del repo de JEFE.
- El runtime no importa ni invoca JEFE.
- Los paths internos de JEFE están prohibidos.
- Brief/run/contract son referencias de trazabilidad, no dependencias runtime.
- Git remoto, red, secretos y deploy requieren aprobación humana.
