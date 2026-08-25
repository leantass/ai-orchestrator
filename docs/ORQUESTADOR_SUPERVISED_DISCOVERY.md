# Intake y descubrimiento supervisado (3A)

3A recibe una necesidad humana mediante un contrato cerrado, la conserva en un registro atómico e idempotente y, cuando existe identidad de versión, escribe objetivo y preguntas mediante MEMORIA canónica. CEREBRO conserva atribución Lean, Radar encuadra faltantes, Scout solicita fuentes y Hermes produce un plan de verificación; todos son paquetes no conectados, no agentes reales.

Estados: `draft`, `needs_clarification`, `ready_for_discovery`, `restricted` y `not_connected`. No existe `completed` por investigación ficticia. URLs HTTPS quedan como `external_reference_unverified`; no hay red, proveedores, runners, shell, materialización ni evidencia externa verificada. Contenido externo no es instrucción ni autoridad.

El registro distingue `intakeId`, identidad opcional proyecto/run/versión y revisiones. Rechaza paths, traversal, `file://`, loopback, credenciales URL, secretos, actor/autoridad forjados y campos desconocidos. Reapertura e idempotencia preservan la misma entrada; el siguiente retorno es Lean/CEREBRO cuando falta información, y JEFE cuando está listo pero los consumidores permanecen `not_connected`.

`ESCALON_3A_STATUS=COMPLETED`; `jefe-supervised-discovery-intake-smoke.mjs` cubre 40 casos. 3B completó la política y el gate de evidencia, incluida la reparación agregadora R1, sin conectar providers. 3C-A completó únicamente el runtime local seguro; cualquier conector real permanece fuera de este bloque.

## Escalón 3B — investigación supervisada

`ESCALON_3B_STATUS=COMPLETED`; `ESCALON_3B_R1_STATUS=COMPLETED`. Registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. Las sesiones por request y los casos agregados son durables; una contribución sólo entra por `receiveContribution`, queda `needs_corroboration` hasta disponer de independencia suficiente y conserva contradicciones para Lean.

## Escalón 3C-A — frontera posterior al intake

`STATUS=ESCALON_3C_A_COMPLETED`; `ESCALON_3_STATUS=IN_PROGRESS`. El runtime prepara y recupera intentos de connector bajo política confiable, pero no transforma el intake en ejecución externa. `NETWORK=DISABLED`; `REAL_NETWORK_CONNECTORS=NOT_CONNECTED`. Los 52/52 casos conductuales, ejecutados cinco veces, usan referencias locales o adapters inyectados y no acreditan providers, investigación externa, UI, autenticación humana, QA visual, preview o deploy. `NEXT=ESCALON_3C_SUPERVISED_RESEARCH_CONNECTORS_AND_EXECUTION`.
