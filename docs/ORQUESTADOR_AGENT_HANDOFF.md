# Handoff durable y resultados (2C-C1/C2)

Estado 2C-C2: completado. La ingesta revalida el resultado C1 y escribe solo eventos contextuales no autoritativos. Retry/reconciliacion recuperan pendientes; `ENTRY_ID_COLLISION` permanece fallido, sin fusion ni resolucion automatica. Vease [ORQUESTADOR_AGENT_RESULT_INGESTION.md](ORQUESTADOR_AGENT_RESULT_INGESTION.md).

2C-C1 persiste intentos locales correlacionados con paquete y handoff. El estado terminal `completed_uningested` conserva únicamente resultados sanitizados, `untrusted`, `not_authoritative` y `not_ingested`; no escribe MEMORIA, outbox, ledger, manifests ni índice de proyectos.

La persistencia usa root inyectado, records por intento, staging/rename, secuencia determinista y locks locales. Los estados C2 `ingestion_pending`, `ingested` e `ingestion_failed` quedan reservados y no se usan. No hay IPC, UI, red, procesos, runners ni consumidores externos; el smoke inyecta consumidores falsos.

Factory/Hermes fue auditado como histórico/incompatible para este bloque: sus runners y contratos de ingestión no se reutilizan porque abrirían otra frontera de ejecución. 2C-C2 completa ingesta validada, recuperación acotada y correlación final, sin abrir ejecución.
