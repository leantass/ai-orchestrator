# Runtime Approval Flow

## Objetivo

Esta guía explica cómo leer el flujo de aprobación para pasar de demo local segura a una futura ejecución real controlada.

## Qué está permitido hoy

- preparar fases locales seguras
- materializar módulos seguros ya soportados
- revisar continuidad, readiness y manifest
- preparar previews de acciones sensibles sin ejecutarlas

## Qué sigue bloqueado o bajo aprobación

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
- escritura remota en GitHub fuera de un cierre explícito pedido por operador

## Qué significa preview

Cuando JEFE devuelve `runtimeApprovalState`, significa:

- no se ejecutó nada todavía
- los comandos son solo una propuesta
- los archivos y directorios son un alcance posible, no cambios ya aplicados
- las validaciones obligatorias ya quedaron listadas
- la acción sigue bloqueada o pendiente hasta aprobación explícita

## Qué debería mirar el operador

1. `Comandos propuestos`
2. `Archivos que podrían cambiar`
3. `Validaciones obligatorias`
4. `Alternativa segura`
5. `Riesgo`
6. `No se ejecutó nada todavía`

## Frase de aprobación futura

JEFE deja una frase sugerida de aprobación para una futura tarea, pero en esta etapa:

- no aprueba nada automáticamente
- no ejecuta nada automáticamente
- no convierte el preview en runtime real

## Cómo interpretar readiness

- `demoReady` o `safeLocalDemoReady` puede ser `true` aunque `realExecutionReady` siga en `false`
- eso significa que la demo local segura está lista, pero el salto a runtime real sigue pendiente de aprobación
- `runtimeReadiness=approval-preview` indica que JEFE ya preparó el paquete, pero no avanzó a ejecución

## Qué no se ejecuta todavía

- no se crea `node_modules`
- no se crea `.env`
- no se abre ningún puerto
- no se crea DB real
- no se ejecuta SQL
- no se corren migraciones
- no se corren seeds
- no se crean archivos Docker reales
- no se hace deploy
- no se hacen integraciones reales
