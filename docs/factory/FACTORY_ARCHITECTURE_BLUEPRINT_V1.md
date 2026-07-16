# Factory Architecture Blueprint v1

## Proposito

`FactoryArchitectureBlueprint v1` es el contrato rector, versionado y serializable de la arquitectura final de JEFE. Define responsabilidades, herramientas, gates, economia, fases y limites antes de instalar o integrar capacidades. JEFE es la factory; cada producto generado es una aplicacion independiente.

El blueprint no ejecuta procesos, no accede a red o filesystem, no instala herramientas y no modifica runtime, Electron, IPC ni UI.

## Arquitectura final

```text
Radar de mercado
  -> Hermes Scout read-only
  -> JEFE decide y consulta MEMORIA canonica
  -> Codex construye sin autoaprobar
  -> JEFE revisa contrato, brief y evidencia
  -> Vitest + MSW prueban logica, componentes e integraciones
  -> Playwright prueba navegador, responsive y accesibilidad
  -> Seguridad, calidad y rendimiento
  -> Promptfoo evalua prompts y agentes
  -> JEFE aprueba o rechaza release
  -> Staging -> pruebas post-deploy -> produccion
  -> Analitica y monetizacion
  -> JEFE decide escalar, corregir o cerrar
  -> MEMORIA promueve aprendizaje solo con revision
```

Las 16 capas canonicas son: `market_radar`, `hermes_scout`, `jefe_decision`, `canonical_memory`, `codex_constructor`, `jefe_review`, `unit_integration_tests`, `browser_qa`, `security_quality_performance`, `ai_prompt_evaluation`, `release_approval`, `staging`, `post_deploy_tests`, `production`, `analytics_monetization` y `learning_memory`.

## Origen de componentes y herramientas

El blueprint separa origen, ownership e integracion para evitar que JEFE reinvente herramientas externas o confunda productos con su runtime:

- `internal_module`: capacidades construidas y gobernadas dentro del core, como JEFE, Radar y MEMORIA.
- `external_tool`: herramientas integradas bajo contratos, como Hermes Agent, Codex, Vitest, MSW, Playwright, Promptfoo y scanners de seguridad.
- `adapter`: boundaries propios de JEFE que gobiernan permisos y handoffs; inicialmente `JefeHermesAdapter` y `JefeCodexAdapter` son conceptos sin runtime.
- `contract`: definiciones puras como FactoryProjectContract y FactoryArchitectureBlueprint.
- `workflow_gate`: JEFE review, release readiness, staging y produccion.
- `external_platform`: GitHub Actions, Issues, Projects y Releases.
- `external_standard`: OpenTelemetry.
- `service_future`: analitica o servicios condicionados.
- `generated_project_component`: aplicaciones independientes creadas por la factory.

Hermes Agent es una herramienta externa. JEFE no lo clona ni lo reinventa: un futuro `JefeHermesAdapter` gobernara requests, permisos read-only, evidencia, reports y handoff. Hermes no modifica codigo o repos, no aprueba y no despliega. Codex tambien es externo y queda supervisado mediante un adapter futuro; puede construir bajo permiso, pero nunca aprobar ni desplegar.

Las apps generadas poseen repo y runtime propios. No son `internal_module`, no importan JEFE y solo conservan trazabilidad contractual.

## JEFE Review & Correction Loop

Los tests no aprueban solos. Tampoco QA, seguridad, performance o Promptfoo. Cada bloque de evidencia vuelve obligatoriamente a `JEFE Acceptance Review` antes de staging.

JEFE compara la entrega contra oportunidad, investigacion Hermes, brief, FactoryProjectContract, criterios de aceptacion, evidencia, tests, UX visual, seguridad, performance y monetizacion prevista. Si hay una brecha, el concepto futuro `FactoryCorrectionPlan` describe cambios acotados para Codex. Codex corrige bajo supervision; luego se repiten tests y se emite un `FactoryRegressionReport`. La entrega vuelve a JEFE como una nueva `FactoryCorrectionRound`.

El retry budget inicial es de tres rondas. Fallos repetidos, riesgos sensibles o decisiones ambiguas escalan a revision humana; existe override humano explicito, nunca autoaprobacion de Codex. Staging solo se habilita despues de un futuro `FactoryReleaseReadiness` aprobado por JEFE. MEMORIA conservara errores, soluciones y estandares unicamente cuando hayan sido validados por el ciclo.

## Herramientas finales

### Aprobadas conceptualmente

- Core: JEFE, FactoryProjectContract, FactoryArchitectureBlueprint, Radar, Hermes read-only, MEMORIA y Codex.
- Gestion: GitHub, Actions, Projects, Issues y Releases cuando corresponda.
- Calidad: TypeScript strict gradual, ESLint y Prettier.
- Tests: Vitest, MSW, Playwright Test y Playwright CLI.
- Accesibilidad y rendimiento: axe-core y Lighthouse CI.
- Seguridad: Gitleaks, Semgrep Community Edition o alternativa open-source equivalente y Trivy.
- IA y observabilidad: Promptfoo y OpenTelemetry.
- Automatizacion: Renovate, Dev Containers y Docker selectivo.
- Analitica: Umami para productos web simples.

La aprobacion conceptual no autoriza instalacion inmediata. Cada adopcion requiere trigger, beneficio medible, criterio de aceptacion, costo, riesgo y rollback.

### Condicionadas

- PostHog: solo para funnels, cohortes, flags o experimentos que Umami no cubra.
- OWASP ZAP: solo con staging web estable y scope seguro.
- SOPS + age: solo cuando existan secretos reales de entornos.
- Langfuse: solo si demuestra valor incremental sobre OpenTelemetry.
- Storybook: solo con design system real.
- Turborepo: solo con multiples paquetes o monorepo real.
- pnpm: solo si la estructura justifica migrar el package manager.
- Runner propio: solo cuando Actions sea caro o insuficiente con evidencia.
- Woodpecker/Forgejo: solo ante evidencia economica u operativa fuerte.

### Rechazadas en la arquitectura inicial

- Agent Zero.
- Kubernetes.
- Instalacion de herramientas por moda.
- Analitica duplicada sin necesidad.

## Estrategia economica

La politica es gratis/open-source-first. GitHub y sus free tiers son la base inicial. El costo principal permitido es OpenAI por tokens o API cuando exista aprobacion explicita. Toda excepcion requiere justificacion; herramientas duplicadas estan prohibidas. El costo esperado inicial es cercano a cero en plataforma, mas consumo variable y controlado de OpenAI.

## Gates por capa

Cada transicion exige evidencia identificable, criterios de aceptacion y un aprobador. Codex nunca puede autoaprobar. JEFE gobierna los gates tecnicos; staging, post-deploy y produccion requieren ademas aprobacion humana. Los gates especializados cubren calidad, seguridad, evaluacion de IA, deployment y aprendizaje analitico.

La evidencia minima evoluciona desde oportunidad e investigacion hasta contratos, reportes de tests, evidencia visual, scans, evaluaciones de prompts, release approval, health checks y metricas de producto.

## Orden de implementacion

1. Radar foundation: contratos de oportunidades y scoring.
2. Research governance: Hermes read-only y fronteras de MEMORIA canonica.
3. Construction review: ciclo Codex -> JEFE con contratos y evidencia.
4. Automated quality: Vitest/MSW, Playwright y seguridad de forma incremental.
5. AI release: Promptfoo, trazabilidad y release approval.
6. Delivery feedback: staging, post-deploy, produccion, analitica y aprendizaje.

Cada fase se integra en commits aislados y puede revertirse al ultimo gate estable sin cambiar los contratos de productos.

## Relacion con FactoryProjectContract

El blueprint define la factory y su proceso. `FactoryProjectContract` define una instancia de producto: identidad, lineage, repositorio, independencia, calidad, seguridad y entrega. El blueprint no reemplaza ese contrato; gobierna cuando se crea, valida y aprueba.

## Radar, Hermes, JEFE, MEMORIA y Codex

- Radar produce oportunidades trazables, no decisiones finales.
- Hermes investiga inputs no confiables en modo read-only y nunca modifica codigo.
- JEFE puntua, decide, divide trabajo, interpreta evidencia y aprueba o rechaza.
- MEMORIA mantiene namespaces por proyecto, contexto canonico y promocion global revisada.
- Codex construye, corrige, prueba y documenta dentro de permisos; no se autoaprueba.

## Tests y QA

Vitest cubrira logica, componentes e integracion; MSW simulara APIs con contratos controlados. Playwright cubrira flujos reales, responsive, navegadores, accesibilidad y evidencia visual. JEFE interpreta resultados y devuelve correcciones a Codex antes de repetir QA.

## Seguridad, rendimiento y evaluacion de IA

Gitleaks, Semgrep y Trivy forman el baseline de seguridad. axe-core y Lighthouse CI forman gates de accesibilidad y rendimiento. ZAP se posterga hasta contar con staging estable. Promptfoo evaluara prompts, agentes, regresiones y seguridad; OpenTelemetry sera el estandar inicial de trazabilidad. Langfuse queda condicionado a valor incremental demostrado.

## Staging, produccion, analitica y monetizacion

No se permite produccion sin release approval, staging valido, pruebas post-deploy y rollback documentado. Umami es la opcion simple inicial; PostHog se adopta solo para necesidades avanzadas. Las metricas deben conectar oportunidad, brief, run, contrato, release, adquisicion, activacion, retencion, conversion, costos e ingresos. JEFE decide escalar, corregir monetizacion o cerrar; MEMORIA conserva solo aprendizajes validados.

## Independencia de productos generados

- Cada producto tiene root y repositorio propios.
- Ningun producto depende del runtime, imports o paths internos de JEFE.
- Solo conserva trazabilidad mediante contract, opportunity, brief, run y output IDs.
- Revenue, TuVianda, Viandas y Lavanderia son productos o pruebas historicas, no modulos core.
- El hardcoding vertical esta prohibido en el nucleo.
- El desarrollo posterior ocurre en el repo del producto, no dentro de JEFE.

## Que no se instala todavia

Este bloque no instala Vitest, MSW, Playwright, Promptfoo, observabilidad, seguridad, Docker, analitica ni ningun otro componente. Tampoco integra Radar, Hermes o MEMORIA al runtime. Solo codifica el blueprint puro y sus invariantes.

## Proximos pasos

El primer paso top-down es definir el contrato puro de Radar y su scoring de oportunidades. Luego corresponde fijar Hermes read-only y los limites de MEMORIA. Solo despues debe formalizarse la automatizacion del ciclo de construccion y revision.
