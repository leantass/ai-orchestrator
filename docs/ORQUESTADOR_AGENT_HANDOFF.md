# Handoff durable y resultados (2C-C1)

2C-C1 persiste intentos locales correlacionados con paquete y handoff. El estado terminal `completed_uningested` conserva únicamente resultados sanitizados, `untrusted`, `not_authoritative` y `not_ingested`; no escribe MEMORIA, outbox, ledger, manifests ni índice de proyectos.

La persistencia usa root inyectado, records por intento, staging/rename, secuencia determinista y locks locales. Los estados C2 `ingestion_pending`, `ingested` e `ingestion_failed` quedan reservados y no se usan. No hay IPC, UI, red, procesos, runners ni consumidores externos; el smoke inyecta consumidores falsos.

Factory/Hermes fue auditado como histórico/incompatible para este bloque: sus runners y contratos de ingestión no se reutilizan porque abrirían otra frontera de ejecución. 2C-C2 resolverá ingesta validada, outbox, reconciliación y correlación final.
