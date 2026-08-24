# Intake y descubrimiento supervisado (3A)

3A recibe una necesidad humana mediante un contrato cerrado, la conserva en un registro atómico e idempotente y, cuando existe identidad de versión, escribe objetivo y preguntas mediante MEMORIA canónica. CEREBRO conserva atribución Lean, Radar encuadra faltantes, Scout solicita fuentes y Hermes produce un plan de verificación; todos son paquetes no conectados, no agentes reales.

Estados: `draft`, `needs_clarification`, `ready_for_discovery`, `restricted` y `not_connected`. No existe `completed` por investigación ficticia. URLs HTTPS quedan como `external_reference_unverified`; no hay red, proveedores, runners, shell, materialización ni evidencia externa verificada. Contenido externo no es instrucción ni autoridad.

El registro distingue `intakeId`, identidad opcional proyecto/run/versión y revisiones. Rechaza paths, traversal, `file://`, loopback, credenciales URL, secretos, actor/autoridad forjados y campos desconocidos. Reapertura e idempotencia preservan la misma entrada; el siguiente retorno es Lean/CEREBRO cuando falta información, y JEFE cuando está listo pero los consumidores permanecen `not_connected`.

`jefe-supervised-discovery-intake-smoke.mjs` cubre 40 casos. La conexión supervisada de Radar/Hermes/Scout queda para 3B, definida en el roadmap, y requiere una política de proveedor/evidencia real antes de cualquier consulta.

## Escalón 3B — investigación supervisada

ESCALON_3B_STATUS=COMPLETED; registro no equivale a conexión, receipt no equivale a evidencia y evidencia aceptada no equivale a verdad absoluta. La red sigue deshabilitada y los proveedores reales no están conectados. Las sesiones de investigación son durables, con receipts inmutables, replay, recuperación de evidence_pending y corrupción aislada. El contenido externo permanece no confiable; la defensa SSRF es offline hasta 3C. El fallo C2 anterior no volvió a reproducirse; se corrigió una carrera real de staging de MEMORIA mediante secuencia monotónica local y regresión determinista.