# JEFE Web Local V1

JEFE Web es un shell alternativo al runtime Electron. Usa los mismos servicios y persistencia canónica mediante una API HTTP local en `127.0.0.1`.

## Inicio

```powershell
npm run jefe:web
```

La URL por defecto es `http://127.0.0.1:17580/`. Si el puerto está ocupado, el launcher conserva la primera instancia y selecciona un puerto loopback alternativo.

El servidor inyecta una sesión efímera en el HTML, exige Bearer para `/api/*`, valida Origin, limita payloads y sirve sólo recursos del `dist` o del root de la versión. Las rutas profundas reciben el shell SPA; los assets profundos se resuelven dentro de `dist/assets` sin permitir traversal.

## Arquitectura

`CommercialApp` selecciona `WebRuntimeClient` cuando no existe el bridge Electron. El cliente web llama endpoints semánticos de proyectos, workspace, versiones, preview, revisión, aprobación, entrega y materiales. El artifact comercial continúa siendo HTML/CSS/JavaScript autónomo y no incorpora Electron, preload, IPC ni `file://`.

El preview de una versión se sirve por HTTP loopback y se abre en el navegador externo. La revisión, findings, CAS e historial permanecen en JEFE.

## Input Assets

El workspace Web usa `<input type="file">` y `multipart/form-data`. Los materiales se validan, sanitizan, copian bajo `inputs/assets`, registran en el manifest y se pueden listar, recuperar tras refresh y quitar. No se ejecutan archivos.

## Estado de validación

La base actual conserva `JEFE_WEB_V1_STATUS=PARTIAL` hasta completar evidencia integrada de todos los viewports, regresión Electron y Human Gate Web. VetNova `vetnova-barrio/version-v0006` debe permanecer `pending_review` y no debe ser aprobado ni rechazado automáticamente.
