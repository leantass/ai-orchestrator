# 1. Resumen ejecutivo

JEFE es hoy un orquestador desktop local operativo, con capacidades reales de planificación, contratos de dominio, materialización acotada, approvals, revisión, corrección supervisada, persistencia de runs y una suite extensa de smokes. No es todavía una software factory completa: sus capacidades están concentradas en un monolito Electron, la calidad depende mayormente de scripts ad hoc, la memoria está fragmentada y no existe un ciclo automatizado y medible desde investigación hasta repositorio independiente, CI, publicación y aprendizaje.

**Estado general:** funcional y avanzado como laboratorio/orquestador local; incipiente como plataforma industrial multi-proyecto.

**Madurez estimada:** 6/10 para orquestación local supervisada; 4/10 para factory reproducible y operable a escala.

**Preparación para transformarse en factory:** media. Ya existen piezas fundacionales valiosas —`GeneratedDomainContract`, sandbox, permit bundles, work envelopes, review/correction y smokes—, pero falta convertirlas en contratos universales, módulos desacoplados y gates estándar.

Riesgos principales:

1. `electron/main.cjs` mide aproximadamente 2,3 MB/58 mil líneas y concentra planificación, política, IPC y ejecución; `src/App.tsx` mide aproximadamente 1,1 MB/25 mil líneas.
2. La generación todavía mezcla contrato universal, fallbacks legacy y hardcoding por vertical; agregar dominios puede requerir modificar JEFE.
3. No hay Vitest/MSW/Playwright Test formal, coverage ni pirámide de pruebas; predominan smokes grandes y costosos.
4. MEMORIA está dividida entre Context Hub externo, catálogos locales, ledgers y `.codex-temp`; no hay aislamiento canónico completo por proyecto ni política de retención.
5. No hay observabilidad de tokens/costos/traces, supply-chain security automatizada, staging/rollback ni creación automática de repos independientes.
6. `.codex-temp` contiene aproximadamente 13.079 archivos y 1,24 GB: evidencia útil, pero no gobernada como almacén durable.
7. El commit local `db03986` está un commit delante de `origin/feature/viandas-corporativas-mvp` (`d1470d1`) y quedó pendiente de validación completa. Se documenta sin modificarlo.

Recomendación general: preservar el safety model y los contratos existentes, congelar nuevo hardcoding por dominio y construir la factory por capas. El primer paso debe ser un contrato puro, versionado y validable para un **proyecto generado independiente**, antes de incorporar herramientas o automatizar Git/deploy.

# 2. Arquitectura actual detectada

## Componentes y responsabilidades

- `src/`: renderer React 19. Contiene UI guiada/técnica, estado de experiencia, presentación de planes, approvals, runs, MEMORIA y resultados.
- `electron/main.cjs`: composition root y monolito principal. Recibe IPC, clasifica pedidos, arma decisiones, coordina contexto, ejecución, materialización y eventos.
- `electron/preload.cjs`: bridges allowlisted entre renderer y main (`aiOrchestrator`, `jefeRunBridge`, `jefeGenerationBridge`).
- `electron/generated-domain-*`: contrato universal, diagnósticos, políticas, builders, materialización, review, corrección, roundtrip y ledger.
- `electron/orchestrator-*`: workers, approvals, dry-runs, supervisión, permit bundles y revisión posterior.
- `electron/jefe-run-persistence.cjs`: persistencia local de dry-runs, brief, status, logs y summaries.
- `electron/jefe-real-generation.cjs`: generación real controlada desde un run persistido, con rutas restringidas y comandos allowlisted.
- `executor-bridge/`: proceso separado que acepta instrucciones por stdin; puede responder en mock o delegar en `codex exec`.
- `electron/context-hub-*`: cliente, launcher y eventos hacia MEMORIA/Context Hub local.
- `electron/reusable-artifact-memory.cjs`: catálogo local de artefactos reutilizables en `userData`.
- `scripts/`: 66 CLIs/smokes, suite de calidad y drivers visuales.
- `docs/`: 23 documentos de arquitectura, hitos, runbooks y deuda.
- `openspec/`: 16 documentos de specs/cambios; capa manual de planificación, no runtime.
- `.github/workflows/ci.yml`: único workflow remoto.
- `.codex-temp/`: sandboxes, outputs, runs, evidencias, capturas y reportes ignorados por Git.

## Flujo textual actual

```text
Operador
  -> React renderer
  -> preload bridge allowlisted
  -> Electron main / strategic brain
       -> reglas locales o OpenAI opcional
       -> contexto de proyecto + MEMORIA opcional
       -> GeneratedDomainContract / planes legacy
       -> approvals y sandbox policy
       -> ejecutor determinista o executor-bridge/Codex
       -> materialización bajo workspace/.codex-temp
       -> smokes/review/correction/ledger
  -> status, artefactos y evidencia en UI
  -> eventos best-effort hacia Context Hub
```

## Dependencias internas y externas

- Internas: CommonJS en Electron, ESM en scripts y TypeScript/TSX en renderer; contratos cruzan IPC como objetos serializables.
- Externas opcionales: OpenAI, Context Hub local, Codex CLI. AISO y Scarlett aparecen como conectores/provider modes, no deben asumirse activos.
- Herramientas externas Blender/Unity/MCP están modeladas con permisos y supervisión; la documentación mantiene ejecución automática deshabilitada.
- Los proyectos generados pueden ejecutarse sin importar módulos de JEFE, pero hoy se materializan principalmente bajo `.codex-temp` y JEFE no completa todavía el lifecycle de repo independiente.

Responsabilidades mezcladas: clasificación de intención, conocimiento de dominios, construcción de artefactos, policy, UI shaping e IPC siguen concentrados, sobre todo en `main.cjs`; el renderer aún reconstruye parte de la semántica del dominio.

# 3. Inventario técnico

## Stack y versiones observadas

| Área | Estado |
| --- | --- |
| Runtime local | Node `v24.14.0`; README declara Node 20+; CI usa Node 24 |
| Gestor | npm `11.9.0`; `package-lock.json` lockfile v3 |
| Repo | repositorio simple, privado; sin workspaces ni monorepo |
| Desktop | Electron `^41.2.0`, preload y main CommonJS |
| Frontend | React/React DOM `^19.2.4`, Vite `^8.0.4`, Tailwind `^4.2.2`, Zustand `^5.0.12`, Lucide |
| Lenguajes | JavaScript, CommonJS, ESM, TypeScript/TSX, CSS, HTML, Markdown, YAML/JSON |
| Build | Vite; electron-builder declarado pero sin scripts de packaging/release |
| Calidad | ESLint 9 flat config, TypeScript 6, smokes Node propios, `ai-quality` |
| Base de JEFE | no se detectó ORM ni DB de runtime propia; persiste JSON/Markdown/logs en filesystem/userData |
| Outputs | generadores para Node+SQLite y perfiles Next.js/Prisma/SQLite, además de artefactos especializados |

## Scripts npm

- Desarrollo: `dev`, `electron:dev`, `desktop:dev`, variantes bridge/codex.
- Ejecución: `executor:bridge`, `electron:stable`, variantes stable.
- Calidad: `lint`, `typecheck`, `ai-planner-smoke`, `ai-quality`, `quality:ci`.
- Build/preview: `build`, `preview`.

`quality:ci` inspeccionado: ejecuta syntax checks, lint, typecheck, numerosos smokes, `v1-release-smoke` y build. No es read-only: varios smokes escriben/limpian `.codex-temp` y build escribe `dist`.

## Dependencias

- No hay `overrides`, `resolutions` ni workspaces declarados.
- `concurrently`, `cross-env`, Electron, electron-builder y `wait-on` están en `dependencies` aunque varias son herramientas de desarrollo/desktop; convendría reclasificarlas al diseñar packaging.
- No aparecen paquetes duplicados directos en el manifest.
- No se verificaron vulnerabilidades actuales: no se ejecutó `npm audit` para evitar red/cache/logs. El README afirma un estado histórico sin vulnerabilidades moderate/high/critical, que no sustituye una verificación vigente.
- El rango Node del README es más amplio que el CI real y que dependencias modernas; falta `engines`, `.nvmrc` o `.node-version`.

## Servicios y configuraciones

- Context Hub: API preferida `127.0.0.1:3210`, fallbacks locales; path local históricamente específico de esta máquina documentado en README.
- OpenAI: provider/model/base URL/timeouts configurables por variables.
- Codex: CLI en `PATH`, bridge directo con `shell:false`.
- No hay Dockerfile, Compose, Dev Container, Prettier, Husky ni hooks Git activos (solo samples).

# 4. Flujo actual de generación de proyectos

1. El operador ingresa objetivo, restricciones, contexto adjunto o proyecto existente desde React.
2. Electron normaliza el pedido, detecta continuidad/proyecto nuevo, riesgos y delivery level.
3. El cerebro usa reglas locales o proveedor OpenAI opcional; puede producir un `GeneratedDomainContract` con roles, entidades, estados, superficies, backend, database, safety, materialización y validación.
4. JEFE normaliza/diagnostica el contrato, pero mantiene fallbacks y branches legacy por dominios conocidos.
5. Las políticas deciden preview, candidate, readiness, approvals y paths permitidos.
6. La ejecución local usa operaciones deterministas; el bridge Codex puede producir un plan estructurado. Acciones riesgosas quedan manuales/supervisadas.
7. Los artefactos se materializan en sandbox. El flujo `db03986` agrega generación controlada desde un brief persistido a `.codex-temp/jefe-real-generation/runs/<runId>/output`.
8. Scripts allowlisted ejecutan validaciones del output; review, correction task, handoff, roundtrip y ledger cubren parte del ciclo.
9. La UI muestra estado, logs, paths y resultados; Context Hub recibe eventos best-effort.

**Separación JEFE/proyecto:** conceptualmente correcta y parcialmente real. Los outputs contienen su propio `package.json`, fuentes, scripts y base local; no dependen de JEFE en runtime. Sin embargo, su creación, evidencia y continuidad todavía viven bajo el repo/sandbox de JEFE y no hay un paso gobernado para crear repo Git independiente, transferir ownership, configurar CI, versionar plantilla y desvincular el lifecycle.

**MEMORIA:** auxilia planificación y recibe eventos, pero no es fuente canónica obligatoria. **Codex:** puede actuar mediante CLI/bridge y mediante handoffs manuales de corrección; recepción/verificación se basa en planes estructurados, artefactos, smokes y review.

TuVianda, Revenue, Lavandería y Viandas deben tratarse como outputs/casos históricos, no como módulos del producto JEFE. No fueron inspeccionados fuera del repo.

# 5. Estado de calidad

## TypeScript

- `tsconfig.app.json` y `tsconfig.node.json` usan `noEmit`, módulos bundler, unused checks y fallthrough checks.
- No declaran `strict: true`; por defecto no existe garantía de strict mode completa.
- `skipLibCheck: true` oculta errores de declaraciones externas.
- La cobertura TypeScript excluye Electron, scripts y la mayoría del core CommonJS.
- La búsqueda en TS/TSX no encontró `any`, `@ts-ignore`, `@ts-expect-error` ni `eslint-disable`, un indicador positivo pero limitado a la capa tipada.
- `planner-ui-state.js` usa una declaración `.d.ts`, señal de frontera JS/TS todavía manual.

## Lint y formato

- ESLint cubre solo `ts`/`tsx`; no cubre el core CommonJS/ESM, scripts, JSON/YAML ni Markdown.
- Configura reglas recomendadas, hooks y React refresh.
- No hay Prettier ni política única de formato; pueden aparecer diffs estilísticos y EOL inconsistentes.

## Tests

- No hay framework unitario formal ni carpetas convencionales de tests.
- Hay una cobertura funcional amplia mediante 60+ scripts `*-smoke.mjs`: planner, release, operator E2E, dominios, sandbox, approvals, workers, roundtrip, Electron visual y generación real.
- `ai-operator-e2e-smoke` intenta importar Playwright opcionalmente, pero Playwright no es dependencia directa ni existe Playwright Test/configuración formal.
- No hay Vitest, MSW, tests de componentes, API contract tests estándar, coverage, mutation testing ni reporte JUnit consolidado.
- Los smokes grandes duplican fixtures/conocimiento de dominios y escriben evidencia; algunos superan 10 mil líneas y son difíciles de aislar.
- Flujos críticos con cobertura insuficiente/indirecta: IPC por contrato tipado, unidades del brain, prompt regression, concurrencia de runs, fallas de filesystem, upgrade/migración de memoria, creación de repos, CI/release, seguridad de dependencias y accesibilidad.

## Build

- Vite produce `dist`; no se ejecutó en esta auditoría porque escribe artefactos.
- Existe `dist/` ignorado, creado antes de esta auditoría.
- Evidencia previa registra build exitoso con warning de timing de Tailwind/Vite; README menciona warnings históricos de chunk/deopt.
- No hay build reproducible de instalador, firma, SBOM ni release artifact en CI.

## Documentación

- Fuerte volumen de arquitectura, runbooks, límites, hitos y OpenSpec.
- Riesgo de contradicción temporal: README declara “deuda crítica 0” mientras documentos actuales reconocen monolitos y hardcoding; hay caracteres con mojibake en README.
- Falta una arquitectura canónica única, ADRs versionadas, modelo de datos de MEMORIA, threat model, onboarding reproducible y manual de lifecycle de proyectos independientes.

# 6. Estado de seguridad

## Secretos y entorno

- No se encontraron archivos `.env`, claves, credenciales o certificados versionados por nombre, ni nombres sensibles en el historial inspeccionado.
- No existe `.env.example` ni schema/validador central de entorno.
- Variables detectadas por nombre: `OPENAI_API_KEY`, `OPENAI_ORG_ID`, `OPENAI_ORGANIZATION`, `OPENAI_PROJECT`, `AI_ORCHESTRATOR_BRAIN_*`, `AI_ORCHESTRATOR_EXECUTOR_*`, `AI_ORCHESTRATOR_BRIDGE_MODE`, `AI_ORCHESTRATOR_CONTEXT_HUB_*`, `CONTEXT_HUB_*`, `AISO_PROVIDER`, `AISO_WEBHOOK_SECRET`, `SCARLETT_PROVIDER`, `VITE_DEV_SERVER_URL` y variables técnicas de Electron/QA.
- Las claves OpenAI/AISO parecen opcionales según provider/mode; su mera presencia en `process.env` exige redacción de logs y allowlist de propagación.
- `.codex-temp` puede contener prompts, briefs, paths absolutos, logs y outputs: está ignorado, pero carece de retención, cifrado, clasificación y escaneo sistemático.

## Permisos y ejecución

- Positivo: preload con `contextIsolation:true`, `nodeIntegration:false`; IPC nominalmente allowlisted; `runId` validado; controles de path containment; `shell:false` en rutas críticas; generación allowlisted y entorno sanitizado.
- Riesgos: no se observó `sandbox:true` en la configuración resumida del BrowserWindow; `shell.openExternal` debe mantener allowlist estricta; el payload renderer→IPC requiere validación de schema sistemática, no solo checks locales.
- `main.cjs` y el bridge tienen gran superficie de ataque y muchas ramas de policy; la revisión humana es difícil.
- Codex recibe prompts y permisos de filesystem/proceso según modo. El prompt injection desde briefs, repos adjuntos, logs o Context Hub necesita provenance, trust labels y separación entre datos e instrucciones.
- Hermes debería ser read-only, sin bridge de escritura, shell, Git write ni secretos.
- La separación actual por paths es buena base, pero no reemplaza procesos/usuarios aislados, permisos OS, contenedores efímeros o workspaces por tenant.

## Dependencias y supply chain

- No hay Gitleaks, Semgrep, Trivy, Dependabot/Renovate, SBOM ni pinning de GitHub Actions por SHA.
- No se ejecutó auditoría de vulnerabilidades vigente.
- El lockfile ayuda a reproducibilidad, pero Node no está fijado y el entorno local ya contiene `node_modules`.

# 7. Estado de automatización

- Hooks: no hay hooks activos, Husky, lint-staged ni commitlint.
- CI: un workflow GitHub Actions en Windows, triggers `push` a `main`, `pull_request`, manual; hace checkout, Node 24, `npm ci` y `npm run quality:ci`.
- No hay matriz Linux/macOS/navegadores, artifacts/test reports, cache adicional, concurrency cancellation, timeouts explícitos, permisos mínimos, pinning SHA ni jobs separados.
- No hay deploy, staging, production, environments, approvals de GitHub, rollback, health checks ni release automation.
- No hay creación automática de repos, branch protection como código, templates versionadas ni handoff de ownership.
- No existe analítica de producto ni feedback automático post-lanzamiento.
- La suite local automatiza mucho comportamiento, pero es monolítica, escribe abundante evidencia y mezcla test, fixture generation y validación visual.
- CI económico razonable: GitHub Actions hosted con jobs por riesgo y cache npm. Un runner propio no se justifica hasta que Electron/Playwright excedan consistentemente cuota/costo o requieran hardware específico.

# 8. Estado de JEFE, MEMORIA y Codex

## JEFE

Actual: recibe brief, decide ruta, produce contratos/planes, gobierna safety, materializa, revisa, persiste runs y presenta estado. Es simultáneamente product brain, policy engine, UI, executor coordinator y QA aggregator. Debe conservar decisión/aprobación y delegar implementación/QA a workers con contratos.

## MEMORIA

Actual:

- Context Hub externo opcional: suggested packs y eventos.
- `reusable-artifact-memory.cjs`: catálogo local en Electron `userData`.
- Ledgers/reports por delivery y runs en `.codex-temp`.
- Docs/OpenSpec/Git como memoria humana y durable.

Brechas: no hay identidad global de project/factory/run, schema canónico único, resolución de contradicciones, lifecycle/TTL, migraciones, lineage, política de redacción ni separación fuerte por proyecto. Context Hub no es obligatorio y el README incluye una ruta local específica. La memoria reutilizable corre riesgo de mezclar artefactos si metadata/provenance no es estricta.

## Codex

Actual: bridge puede lanzar `codex` con `shell:false`; existen prompts estructurados de corrección, handoffs, restricciones y validación posterior. Gran parte del ciclo sigue manual: autorización, revisión del diff, Git, CI y aceptación.

Límites recomendados: scopes por workspace, comandos allowlisted, salida estructurada, diff/evidence obligatorios, sin push/deploy automático por defecto, sin acceso a secretos y con presupuesto de reintentos.

## Duplicaciones y ausencias

- Estado/historial repartido entre run persistence, project operations envelope, delivery ledger y Context Hub events.
- Contratos/safety parcialmente duplicados en backend, renderer y smokes.
- Falta Hermes/scout read-only, QA estándar, observabilidad/costos y un release controller.
- MCP está modelado principalmente como herramienta externa futura; no es una integración productiva general y gobernada.

# 9. Brechas respecto de la arquitectura objetivo

| Etapa objetivo | Estado actual | Brecha principal |
| --- | --- | --- |
| Hermes investiga | No existe | Scout read-only, fuentes, freshness, citations, anti-injection |
| JEFE decide | Parcial fuerte | Decisión concentrada y con hardcoding; falta policy/versioning explícito |
| MEMORIA conserva contexto | Parcial fragmentado | Canonical store, namespaces, lineage, retención y contradicciones |
| Codex construye | Parcial | Handoffs/bridge existen; falta worker universal, sandbox aislado y contrato de entrega |
| Vitest prueba internamente | No existe | Pirámide rápida de unidades/componentes/integración |
| JEFE revisa | Parcial fuerte | Review generado-domain no es universal ni totalmente declarativo |
| Playwright prueba producto | Ad hoc/opcional | Playwright Test, proyectos/browser matrix, traces y artifacts |
| JEFE decide correcciones | Parcial | Retry budget y states existen en subsistemas, no como loop universal |
| Codex corrige | Parcial | Corrección supervisada específica; falta universalización |
| Seguridad/calidad validan | Parcial | Smokes/lint/TS sí; falta SAST, secrets, deps, a11y, performance, prompt eval |
| JEFE aprueba publicación | No existe | Release policy, environments, evidence bundle, rollback |
| Analítica retroalimenta | No existe | Eventos de producto, privacidad, KPIs, monetización |
| MEMORIA aprende | Parcial/manual | Feedback validado, promotion policy y eliminación de aprendizaje obsoleto |

El ciclo de diez pasos solicitado existe de manera parcial: approvals, construcción, review, correction, QA y ledger están implementados en subsistemas; MEMORIA, QA estándar, publicación y aprendizaje siguen manuales o ausentes. Automatizar antes de unificar identidad, states, evidence y policy aumentaría el riesgo de ejecuciones duplicadas, contaminación entre proyectos y falsas aprobaciones.

# 10. Evaluación de herramientas

| Herramienta | Estado actual | Necesidad/beneficio | Costo operativo | Complejidad | Riesgo | Recomendación | Momento |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pnpm | No | Installs deterministas y futuro workspace | Bajo | Media | Migración lock/scripts | Postergar | Al decidir monorepo de factory packages |
| Turborepo | No | Cache/grafo si hay múltiples packages | Bajo | Media | Prematuro hoy | Postergar | Solo después de modularizar en workspace |
| TypeScript estricto | Parcial | Contratos seguros en core/IPC | Bajo | Alta por legacy CJS | Migración extensa | Incorporar gradual | Tras contrato factory, por módulos nuevos |
| ESLint | Sí, solo TS/TSX | Ampliar a JS/CJS/scripts | Bajo | Media | Ruido inicial | Incorporar | Quality foundation |
| Prettier | No | Formato consistente | Bajo | Baja | Diff masivo si se aplica global | Incorporar acotado | Solo archivos nuevos, luego migración por zonas |
| Husky | No | Gates locales | Bajo | Baja | Hooks lentos/frágiles | Postergar | Tras perfil `quality:fast` |
| lint-staged | No | Checks rápidos por cambio | Bajo | Baja | Cobertura falsa | Postergar | Junto con Husky |
| commitlint | No | Convención ya informalmente usada | Bajo | Baja | Fricción baja | Opcional | Al formalizar releases/changelog |
| Vitest | No | Unidades/componentes/integración rápida | Bajo | Media | Convivencia con smokes | Incorporar | Primera ola de QA tras contrato factory |
| MSW | No | APIs deterministas en tests/UI | Bajo | Media | Mocks divergentes | Incorporar | Con tests de integración/UI |
| Playwright Test | No formal | E2E, responsive, browser, traces | Medio | Media/alta | Flakiness/costo CI | Incorporar | Después de test IDs y fixtures estables |
| Playwright CLI | Import opcional ad hoc | Debug/automatización puntual | Bajo | Baja | Duplicar Test runner | Postergar | Solo soporte de QA, no gate principal |
| Storybook | No | Catálogo de componentes | Medio | Media | Mantenimiento doble | Postergar | Si nace design system multi-producto |
| axe-core | No | Accesibilidad automática | Bajo | Baja | Falsos positivos manejables | Incorporar | Integrado con Vitest/Playwright |
| Lighthouse CI | No | Performance/a11y web | Bajo/medio | Media | Electron/file URLs | Incorporar por plantilla web | Cuando haya preview servido estable |
| Gitleaks | No | Secret scanning repo/historial | Bajo | Baja | Falsos positivos | Incorporar | Gate temprano de seguridad |
| Semgrep CE | No | SAST JS/TS/Electron | Bajo/medio | Media | Tuning | Incorporar | Tras baseline de reglas |
| Trivy | No | FS/deps/images/SBOM | Bajo/medio | Media | Redundancia con npm audit | Incorporar selectivo | Supply-chain; Docker cuando exista |
| OWASP ZAP | No | DAST web | Medio/alto | Alta | Riesgo/flakiness | Postergar | Staging aislado y APIs estables |
| Promptfoo | No | Regresión, seguridad y costo de prompts | Bajo/medio | Media | Fixtures sensibles/costo API | Incorporar | Cuando prompts/model policy estén versionados |
| OpenTelemetry | No | Traces vendor-neutral run→steps | Medio | Alta | Instrumentación invasiva | Incorporar | Después de IDs/schemas canónicos |
| Langfuse | No | LLM prompts/tokens/costos/evals | Medio | Media | Datos sensibles/vendor ops | Postergar/piloto | Tras redacción y OTel; si uso LLM real crece |
| PostHog | No | Product analytics/experiments | Medio | Media | Privacidad | Postergar | Primer producto publicado con consentimiento |
| Umami | No | Analítica simple y económica | Bajo/medio | Baja | Menos profundidad | Preferir sobre PostHog al inicio | Primer lanzamiento web si métricas básicas bastan |
| Dev Containers | No | Onboarding reproducible | Bajo | Media | Requiere Docker | Incorporar | Tras fijar Node y comandos seguros |
| Docker | No | Entornos/servicios reproducibles | Medio | Media | Complejidad desktop | Incorporar selectivo | Para outputs/backend/CI, no como requisito de JEFE UI |
| SOPS | No | Secretos cifrados declarativos | Bajo | Media | Gestión de claves | Postergar | Cuando existan entornos/deploy reales |
| age | No | Backend simple para SOPS | Bajo | Baja | Custodia de claves | Postergar | Junto con SOPS |
| Renovate | No | Updates automatizados agrupados | Bajo | Media | PR noise | Incorporar | Tras CI confiable y owners |
| GitHub Actions | Sí | CI principal económica | Bajo/medio | Baja actual | Lock-in moderado | Mantener y fortalecer | Desde foundation |
| Runner propio | No | Hardware/control/costo a escala | Medio/alto | Alta | Seguridad/mantenimiento | Descartar por ahora | Solo con evidencia de necesidad |
| Woodpecker CI | No | CI self-hosted liviana | Medio | Alta | Duplica GitHub Actions | Descartar por ahora | Reevaluar si cambia hosting/costo |
| Hermes Agent | No | Research/scouting continuo | Variable | Alta | Prompt injection, fuentes, costo | Incorporar read-only | Después de MEMORIA canónica y trust model |

# 11. Riesgos de implementación

Qué podría romperse:

- IPC/UI al extraer `main.cjs` o `App.tsx` sin characterization tests.
- Safety invariants al unificar executors y policies.
- Compatibilidad de outputs históricos al versionar contratos.
- CI por duración/flakiness al sumar herramientas de una vez.
- MEMORIA por migraciones, duplicados o mezcla de proyectos.
- Generación por eliminar hardcodes antes de tener equivalencia de contratos.

Qué debe preservarse:

- Fail-closed, approvals explícitos, `shell:false`, path containment, entorno sanitizado y no external execution por defecto.
- `GeneratedDomainContract`, run envelope, evidence bundles y review/correction ledger como activos conceptuales.
- Independencia de runtime de los outputs.
- Baselines y fixtures históricos para regresión, sin convertirlos en lógica productiva.

Backup/rollback:

- Antes de migrar MEMORIA: export versionado, checksum, schema version y restore probado.
- Antes de cambiar contratos: fixtures doradas y adapter vN→vN+1.
- Antes de Git/repo automation: dry-run, repos sandbox, scopes mínimos y revocación.
- Cada etapa debe ser feature-flagged o additive; rollback por revert de un commit único y preservación del formato anterior.

No hacer en paralelo: monorepo/package-manager migration, extracción del monolito, cambio de memoria, nueva suite QA y automatización deploy. Tampoco resolver `db03986` dentro de esta transformación sin un bloque Git/CI separado.

# 12. Propuesta de orden de implementación

## Etapa 1 — Contrato de proyecto factory independiente

- Objetivo: definir `FactoryProjectContract v1` puro y versionado.
- Afecta: contrato/schema, docs y tests puros nuevos.
- Dependencias: preservar `GeneratedDomainContract` y `project-operations-run-envelope`.
- Riesgo: bajo.
- Validación: fixtures válidas/inválidas, independencia de paths/runtime/repo.
- Aceptación: todo output declara identidad, root externo/sandbox, stack, quality profile, repo/release policy y evidence lineage.
- Rollback: retirar módulo aditivo sin cambiar runtime.

## Etapa 2 — Quality foundation rápida

- Objetivo: Vitest, strict TS para módulos nuevos, ESLint ampliado y perfiles `fast/full/release`.
- Afecta: scripts/config/CI.
- Dependencias: contrato v1.
- Riesgo: medio.
- Validación: equivalencia con smokes críticos y tiempos medidos.
- Aceptación: unidades rápidas sin escribir outputs; smokes quedan en integration/release.
- Rollback: mantener suite legacy como gate.

## Etapa 3 — Modularización por seams

- Objetivo: extraer policy, planning, IPC adapters y orchestration services de `main.cjs`; view models de `App.tsx`.
- Dependencias: characterization tests.
- Riesgo: alto.
- Validación: contratos IPC, parity fixtures y smokes seleccionados.
- Aceptación: composition roots pequeños; módulos con ownership explícito.
- Rollback: extracciones pequeñas por commit, adapters compatibles.

## Etapa 4 — MEMORIA canónica multi-proyecto

- Objetivo: IDs, namespaces, schema version, provenance, retención y promotion policy.
- Afecta: Context Hub client/events, reusable memory, ledger.
- Dependencias: contract/run identity.
- Riesgo: alto.
- Validación: migración dry-run, aislamiento y restore.
- Aceptación: ninguna consulta cruza proyectos sin permiso; contradicciones y obsolescencia son explícitas.
- Rollback: dual-read/old-write inicialmente y export previo.

## Etapa 5 — Worker Codex universal supervisado

- Objetivo: task/evidence contract común para build y correction.
- Afecta: bridge, worker registry, approvals.
- Dependencias: contracts, memory, quality fast.
- Riesgo: alto.
- Validación: repos sandbox, forbidden actions, retry budget.
- Aceptación: ningún write fuera de scope; entrega siempre incluye diff/evidence.
- Rollback: modo manual existente.

## Etapa 6 — QA de producto

- Objetivo: MSW, Playwright Test, axe y Lighthouse por plantilla.
- Afecta: generated project profiles, CI y artifacts.
- Dependencias: templates versionadas y previews estables.
- Riesgo: medio.
- Validación: browser matrix mínima, traces solo en fallo.
- Aceptación: gates deterministas por tipo de proyecto.
- Rollback: gates nuevos no bloqueantes hasta estabilizar.

## Etapa 7 — Seguridad y supply chain

- Objetivo: Gitleaks, Semgrep, dependency scan, SBOM, Renovate.
- Afecta: CI/policies/templates.
- Dependencias: quality profiles confiables.
- Riesgo: medio.
- Validación: baseline y triage policy.
- Aceptación: severidades y excepciones con expiración.
- Rollback: advisory mode y reglas versionadas.

## Etapa 8 — Repositorio independiente y CI por proyecto

- Objetivo: materializar fuera de JEFE, iniciar repo y configurar GitHub mediante approval.
- Afecta: factory controller/GitHub integration.
- Dependencias: contract, security, evidence, ownership.
- Riesgo: alto.
- Validación: organización/repo sandbox y dry-run.
- Aceptación: proyecto no depende de JEFE en runtime/desarrollo y tiene CI propio.
- Rollback: no publicar; conservar output local y revocar scopes.

## Etapa 9 — Observabilidad y prompt evaluation

- Objetivo: OTel, métricas, Promptfoo y posible Langfuse.
- Afecta: run lifecycle, LLM providers, dashboards.
- Dependencias: IDs y redacción canónicos.
- Riesgo: medio/alto por privacidad.
- Validación: trace completo sin secretos y presupuesto medible.
- Aceptación: run→brief→build→QA→release correlacionado con duración/tokens/costo.
- Rollback: exporters apagables; telemetría local primero.

## Etapa 10 — Hermes y feedback post-lanzamiento

- Objetivo: scout read-only y analítica que alimente decisiones/memoria.
- Afecta: research ingestion, MEMORIA, analytics.
- Dependencias: trust/provenance, privacy y release lifecycle.
- Riesgo: alto.
- Validación: citas/freshness, anti-injection, no write capability.
- Aceptación: JEFE decide; Hermes solo propone evidencia; aprendizaje requiere promoción.
- Rollback: deshabilitar connector y conservar fuentes auditables.

# 13. Recomendación del primer cambio

Crear un módulo puro y aditivo `FactoryProjectContract v1` con schema/validator y fixtures, sin conectarlo todavía al runtime.

Debe extender —no reemplazar— `GeneratedDomainContract` y definir como mínimo:

- `factoryProjectId`, `contractVersion`, `projectRoot` y namespace de memoria;
- independencia de runtime y prohibición de imports/paths hacia JEFE;
- stack/package manager/Node policy;
- quality profile (unit, integration, E2E, a11y, performance, security);
- repo ownership, CI policy y release mode;
- environment variable schema sin valores;
- evidence lineage y relación brief→run→output;
- approvals requeridas para Git, red, secretos y deploy.

Es el cambio más seguro porque es puro, additive y reversible; el más fundacional porque alinea JEFE, MEMORIA, Codex, QA, CI y repos independientes; y el de mayor utilidad porque evita instalar herramientas sin saber qué contrato deben satisfacer.

# 14. Evidencias

## Comandos ejecutados

- `Test-Path FACTORY-ENVIRONMENT-AUDIT.md`
- Lectura de `AGENTS.md` y `openspec/AGENTS.md`.
- `git status --short`, `git status -sb`, `git diff --cached --name-status`, `git diff --name-status`, `git ls-files --others --exclude-standard`.
- `git rev-parse`, `git log`, `git branch -vv`, `git remote -v`, `git count-objects -vH`.
- Inventarios con `Get-ChildItem`, `git ls-files` y métricas de archivos/directorios.
- `node --version`, `npm --version`, `git --version`.
- Lectura de `package.json`, `package-lock.json`, `.gitignore`, tsconfigs, ESLint, Vite, README, workflow, docs y OpenSpec.
- Búsquedas `rg` sobre IPC, process execution, paths, variables por nombre, testing, seguridad, memoria y módulos.
- Parseo de metadata del lockfile con Node, sin instalar ni resolver paquetes.

## Rutas inspeccionadas

- Raíz, `.github/`, `docs/`, `openspec/`, `electron/`, `executor-bridge/`, `scripts/`, `src/`, `public/`.
- `.codex-temp/`, `dist/` y `node_modules/` solo para métricas/nombres; no se inspeccionaron secretos ni se modificaron contenidos.
- No se inspeccionó ni tocó `web-prueba`, TuVianda u otros repos/proyectos externos.

## Resultados relevantes

- Branch `feature/viandas-corporativas-mvp`, HEAD `db03986`, origin conocido `d1470d1`, un commit local pendiente.
- Worktree inicial limpio; staged y untracked versionables vacíos.
- Repo simple npm con 234 archivos versionados distribuidos principalmente en scripts, Electron y src.
- `.codex-temp`: ~1,24 GB/13.079 archivos; `node_modules`: ~831 MB; `dist`: ~0,85 MB.
- Un workflow CI Windows; no Docker/Dev Container/hooks activos.
- No se detectaron archivos sensibles versionados por nombre ni `.env` fuera de árboles excluidos.

## Tests y builds ejecutados

Ninguno durante esta auditoría.

## Errores/limitaciones

- Una conversión PowerShell inicial de `package-lock.json` falló por limitación del parser; se repitió la lectura con `JSON.parse` de Node, sin escritura.
- Algunas salidas extensas fueron truncadas por la consola; se usaron inventarios y búsquedas dirigidas para completar conclusiones.
- No se verificó CI remoto actual ni vulnerabilidades online.
- No se hizo análisis semántico completo de cada una de las decenas de miles de líneas; se priorizaron composition roots, contratos, docs, manifests y rutas críticas.
- No se confirmó comportamiento runtime ni performance mediante ejecución.

## Comandos no ejecutados por riesgo de modificación

- `npm install`, `npm ci`, `npm update`, `npm audit`, `npm audit fix`.
- `npm run build` y variantes desktop/preview (escriben `dist` o abren procesos/UI).
- `npm run quality:ci`, `ai-quality`, `v1-release-smoke` y todos los smokes (escriben/limpian `.codex-temp`, generan outputs o pueden levantar procesos).
- Tests visuales, Playwright/Electron, screenshots y coverage.
- Seeds, migraciones, Prisma, bases de datos y generadores reales.
- Docker, deploy, Git write, push, fetch, reset, rebase, branch switching y comandos de reparación.
- `npm audit` no se ejecutó aun siendo nominalmente read-only porque puede usar red/cache/logs y la restricción exigía no crear auxiliares.

# 15. Confirmaciones finales

- No se modificó ningún archivo existente.
- Solamente se creó `FACTORY-ENVIRONMENT-AUDIT.md`.
- No se instalaron dependencias.
- No se actualizaron dependencias.
- No se ejecutaron migraciones.
- No se ejecutaron seeds.
- No se modificaron bases de datos.
- No se crearon commits.
- No se hizo push.
- No se cambió de rama.
- No se resolvió el drift Git: `db03986` permanece local sobre `d1470d1`.
- No se imprimieron valores de secretos; solo nombres de variables y riesgos.
