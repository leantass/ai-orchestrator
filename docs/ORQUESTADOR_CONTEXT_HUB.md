# MEMORIA / Context Hub canónico (2A)

`ESCALON_2A_STATUS=COMPLETED`. MEMORIA es un registro local append-only de entradas validadas, no un chat, un archivo libre ni una base vectorial. La fuente de verdad son los eventos; el snapshot se reconstruye desde ellos y no es editable como autoridad.

## Contrato y autoridad

Los alcances son `orchestrator`, `project`, `run` y `version`; cada uno exige exactamente la identidad correspondiente. Los tipos registran objetivo, requisito, restricción, preferencia, decisión, evidencia, supuesto, riesgo, pregunta, validación, resultado, fallo y corrección. Actores permitidos: Lean, Cerebro, Radar, Hermes, Scout, JEFE, Planner, Codex, QA y system. Las autoridades distinguen decisión humana, evidencia verificada, resultado técnico, inferencia de agente y evento de sistema.

Una inferencia no puede reemplazar una decisión humana: todo reemplazo, resolución, invalidación o conflicto referencia explícitamente la entrada anterior y conserva historia. El snapshot expone entradas vigentes, pendientes, conflictos, próximo responsable y asuntos que requieren a Lean.

## Persistencia y límites

Cada entrada se valida, serializa de modo determinista y se escribe atómicamente como evento inmutable bajo un root autorizado. La idempotencia acepta el mismo `entryId` con el mismo contenido y rechaza colisiones diferentes. Índice/snapshot corruptos se reconstruyen; eventos corruptos se aíslan y reportan. No se consultan URLs ni se ejecutan/copían archivos de evidencia.

Se rechazan paths externos, traversal, campos sensibles evidentes y metadata/textos fuera de límite. Esta protección no detecta secretos ocultos en lenguaje natural. No hay embeddings, búsqueda semántica, UI, IPC ni integración con agentes en 2A.

## Pendientes

2B integra productores, proyectos, versiones, lifecycle e IPC. 2C añade consultas y paquetes de contexto para agentes. 2D cubre recuperación integral, conflictos, corrección y cierre. Radar, Hermes, Scout, Planner, Codex, QA, aprendizaje entre proyectos y cualquier vector database siguen fuera de alcance.
