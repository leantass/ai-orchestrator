# Manifiesto de baseline de fuentes

Fecha: 2026-08-20. Los hashes describen únicamente archivos no ignorados observados; no incluyen `.codex-temp`, `node_modules`, `dist`, logs, outputs, capturas, `.env` ni credenciales.

| Fuente | HEAD | Rastreados modificados | Nuevos | Hash agregado SHA-256 |
|---|---|---:|---:|---|
| Factory Core | `81ba810313610e3e3f678bea5a70b29650b471c0` | 41 | 358 | `DE92392FA4579EA3C03CAD6999D2472BD0CC52C00AE8D443F9EDAE234C459198` |
| Comercial, incluido baseline documental previo | `81ba810313610e3e3f678bea5a70b29650b471c0` | 8 | 7 | `E91E3E7A92830947FD2D335BE2FF5A28C26C4F550DCFFBAEEBE0568B2BA9392B` |

| Archivo fuente relevante | Tamaño | SHA-256 | Uso en este bloque |
|---|---:|---|---|
| Factory `electron/jefe-project-registry.cjs` | 14297 | `AF72EE869A365E1CCE40DE043B97F34BEEF4546DCF2B6D214CD018041A2D8545` | Adaptado como registro mínimo sin autoridad de identidad. |
| Factory `electron/jefe-roadmap-registry.cjs` | 2337 | `0D816FBBDB0FC68D81D1DDB98FBFFF3361608D9A5D959A5FE6CECCD3FCE9BFD8` | Inspeccionado y pospuesto por estado contradictorio. |
| Comercial `docs/ORQUESTADOR_MASTER_AUDIT.md` | 20862 | `0AE3EE99B203AD93CBCEAC70408B0DB1841908709204F289216D90627B73E4EC` | Incorporado como resumen vigente de auditoría. |
| Comercial `docs/ORQUESTADOR_WORKTREE_RECONCILIATION.md` | 20382 | `C1310096CBAD6E11FE5FB7E4CD388444F1F9F75C80E69337D9E341EEA9759541` | Incorporado como resumen vigente de reconciliación. |

Los inventarios exhaustivos por conjunto y la clasificación se conservan en `ORQUESTADOR_WORKTREE_RECONCILIATION.md` de la fuente y quedan resumidos aquí para no incorporar outputs temporales ni transformar WIP no integrado en estado canónico.
