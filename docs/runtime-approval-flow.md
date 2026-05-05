# Runtime approval flow

## Objetivo

Esta guia explica como leer el flujo de aprobacion para pasar de demo local segura a una futura ejecucion real controlada.

## Que esta permitido hoy

- preparar fases locales seguras
- materializar modulos seguros ya soportados
- revisar continuidad, readiness y manifest
- preparar previews de acciones sensibles sin ejecutarlas

## Que sigue bloqueado o bajo aprobacion

- `npm install` y otras instalaciones reales
- levantar runtime o dev server
- backend escuchando puerto
- DB real
- migraciones y seeds reales
- Docker, Dockerfile y docker-compose
- deploy
- auth real
- pagos reales
- integraciones externas reales
- `.env` y secretos
- escritura remota en GitHub fuera de un cierre explicito pedido por operador

## Que significa preview

Cuando JEFE devuelve `runtimeApprovalState`, significa:

- no se ejecuto nada todavia
- los comandos son solo una propuesta
- los archivos y directorios son un alcance posible, no cambios ya aplicados
- las validaciones obligatorias ya quedaron listadas
- la accion sigue bloqueada o pendiente hasta aprobacion explicita

## Que deberia mirar el operador

1. `Comandos propuestos`
2. `Archivos que podrian cambiar`
3. `Validaciones obligatorias`
4. `Alternativa segura`
5. `Riesgo`
6. `No se ejecuto nada todavia`

## Frase de aprobacion futura

JEFE deja una frase sugerida de aprobacion para una futura tarea, pero en esta etapa:

- no aprueba nada automaticamente
- no ejecuta nada automaticamente
- no convierte el preview en runtime real

## Como interpretar readiness

- `demoReady` o `safeLocalDemoReady` puede ser `true` aunque `realExecutionReady` siga en `false`
- eso significa que la demo local segura esta lista, pero el salto a runtime real sigue pendiente de aprobacion
- `runtimeReadiness=approval-preview` indica que JEFE ya preparo el paquete, pero no avanzo a ejecucion

## Que no se ejecuta todavia

- no se crea `node_modules`
- no se crea `.env`
- no se abre ningun puerto
- no se crea DB real
- no se ejecuta SQL
- no se corren migraciones
- no se corren seeds
- no se crean archivos Docker reales
- no se hace deploy
- no se hacen integraciones reales
