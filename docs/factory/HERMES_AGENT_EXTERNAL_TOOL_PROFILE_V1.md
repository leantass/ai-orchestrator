# Hermes Agent External Tool Profile v1

## Propósito

Este documento registra la superficie pública auditada de Hermes Agent y fija el límite seguro para una futura integración gobernada por JEFE. Hermes Agent es una herramienta externa de Nous Research; JEFE no la reinventa, no la incorpora a su runtime y solo podrá relacionarse con ella mediante `JefeHermesAdapter`.

## Fuentes auditadas

- Repositorio oficial: https://github.com/NousResearch/hermes-agent
- Documentación oficial: https://hermes-agent.nousresearch.com/docs/
- Fuentes de la documentación: https://github.com/NousResearch/hermes-agent/tree/main/website/docs

La consulta fue documental y read-only. No se usó la referencia comunitaria porque las fuentes oficiales cubrieron la superficie necesaria.

## Qué es Hermes Agent

El proyecto oficial lo presenta como un agente de IA de Nous Research con interfaz de terminal, aplicación desktop, gateway de mensajería, herramientas, skills, memoria persistente, integración MCP y tareas programadas. El repositorio declara licencia MIT y contiene principalmente una implementación Python acompañada por superficies web/desktop y tooling JavaScript/TypeScript.

Estas capacidades son evidencia de una herramienta externa potente, no una autorización para habilitarlas dentro de JEFE.

## Superficies detectadas

| Superficie | Estado documental | Utilidad futura | Estado en JEFE v1 |
|---|---|---|---|
| CLI/TUI | Documentada | Operación y diagnóstico | Prohibida |
| Desktop | Documentada | Operación humana | Prohibida |
| Messaging gateway | Documentada | Handoff conversacional | Prohibida |
| Tools/terminal | Documentada | Investigación y acciones | Prohibida |
| Skills | Documentada | Procedimientos reutilizables | Solo mapeo offline |
| Memory | Documentada | Persistencia entre sesiones | Escritura prohibida |
| MCP | Documentada | Extensión mediante servidores | Prohibida |
| Cron | Documentada | Automatización desatendida | Prohibida |
| Web/red | Documentada a través de proveedores y tools | Investigación | Prohibida sin aprobación futura |
| IDE | No establecida claramente por las fuentes auditadas | Posible superficie futura | No asumida |

## Superficies permitidas inicialmente

- `documentation_only`
- `offline_contract_mapping`
- `read_only_research_request_planning`

Estas superficies no ejecutan Hermes, no acceden a red y no cambian datos.

## Superficies prohibidas inicialmente

- escritura en filesystem o repositorios;
- cron autónomo y escritura de memoria;
- llamadas de red y herramientas con credenciales;
- ejecución de código o comandos;
- deploy;
- acceso a producción o datos de clientes.

## Riesgos y límites de confianza

La documentación oficial describe aprobaciones, deny rules, aislamiento y escaneo de contexto. También aclara que los guards de `write_file`/`patch` no son un límite duro frente al terminal ejecutado como el mismo usuario. Por eso JEFE no confiará en controles internos de Hermes como único boundary.

Riesgos principales:

- prompt injection desde fuentes o archivos;
- memory/skill injection persistente;
- autonomía desatendida mediante cron;
- ejecución de tools, shell o MCP con permisos amplios;
- exfiltración por red o credenciales reenviadas;
- contaminación entre proyectos o datos de clientes;
- confianza excesiva en resúmenes no respaldados por evidencia.

## Política de permisos

`JefeHermesAdapter` es obligatorio. El modo inicial es read-only. Cron, tool calling, escritura, ejecución y deploy permanecen deshabilitados. Cualquier futura llamada externa o escritura de memoria exige aprobación humana explícita, permisos acotados por run, evidencia y auditoría.

## Integración futura segura

El futuro `JefeHermesAdapter Runtime` deberá:

1. traducir requests contractuales sin entregar acceso general al repo;
2. emitir permit bundles por fuente, tiempo y oportunidad;
3. ejecutar en aislamiento sin credenciales por defecto;
4. capturar citas, calidad, costos, duración y trazabilidad;
5. rechazar filesystem/repo writes, cron, deploy y acceso a producción;
6. validar report y handoff antes de devolverlos a JEFE;
7. tratar toda salida como no confiable hasta la revisión de JEFE.

JEFE no debe clonar o envolver internamente Hermes como si fuese un módulo propio, habilitar `--yolo`, delegarle aprobación, permitirle escribir MEMORIA canónica ni conectarlo directamente con Codex o proyectos generados.

## Estado runtime

- Hermes no fue instalado.
- Hermes no fue clonado.
- Hermes no fue ejecutado.
- No se configuraron credenciales.
- No se habilitaron red, cron, memoria ni tool calling.

## Próximos pasos

El siguiente paso seguro es diseñar offline los permisos, envelopes de evidencia y denial tests del adapter. La selección de una superficie ejecutable estable, el sandbox y el protocolo runtime requieren un bloque futuro con aprobación explícita.

## Limitaciones de la auditoría

La superficie es evolutiva y la auditoría refleja la documentación pública consultada en la fecha declarada por el profile. No se verificó comportamiento ejecutando Hermes, no se inspeccionaron binarios y no se probaron garantías de seguridad. `ide_possible` permanece sin confirmar.
