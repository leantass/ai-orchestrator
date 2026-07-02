# Investor Demo Guide

## Objetivo

Esta guia sirve para mostrar JEFE como producto simple, entendible y controlado para una conversacion con inversores.

La demo no busca recorrer todas las pantallas internas. El foco es que una persona entienda rapido:

- que es JEFE;
- que le puede pedir;
- que hace con el pedido;
- como trabaja de forma segura;
- como muestra resultado y proximo paso;
- como deja auditoria disponible sin convertir la home en una consola tecnica.

Mensaje central de la demo:

> JEFE entiende el pedido, arma el plan, coordina el trabajo, valida y deja el resultado listo para revisar.

## Pantalla inicial

Empezar siempre en modo `Simple`.

Mostrar primero:

- el encabezado `JEFE / Orquestador de proyectos con IA`;
- la pregunta principal `Que queres construir o mejorar?`;
- el campo grande para describir el pedido;
- el CTA `Crear plan`;
- el acceso secundario a `Auditoria`;
- el flujo `Entiende / Planifica / Ejecuta / Valida / Entrega`.

Lectura recomendada para explicar la pantalla:

> Esta es la experiencia principal. JEFE no arranca mostrando workers, logs ni CI. Primero pide el objetivo en lenguaje natural y convierte eso en un flujo controlado: entender, planificar, ejecutar con supervision, validar y entregar.

## Pedido de ejemplo

Usar este pedido para la demo:

> Quiero crear una web app para gestionar pedidos internos de una empresa, con usuarios, panel administrador, validaciones y reporte final.

Si hace falta agregar contexto, usar algo corto:

> Tiene que funcionar como una primera version local revisable. No quiero deploy, credenciales reales ni integraciones externas todavia.

## Recorrido sugerido

1. Confirmar que la app esta en modo `Simple`.
2. Pegar el pedido de ejemplo en el campo principal.
3. Explicar que el boton principal es `Crear plan`, no ejecutar a ciegas.
4. Tocar `Crear plan`.
5. Mostrar que JEFE resume lo entendido, propone un plan y deja claro el siguiente paso.
6. Si aparece una aprobacion, explicar que JEFE pide permiso antes de crear o modificar archivos.
7. Si ya hay resultado visible, mostrar donde quedo, que se valido y cual es el proximo paso.

Frase util durante el CTA:

> El primer gesto no es ejecutar todo. Primero transforma el pedido en un plan revisable. La ejecucion queda supervisada y con permisos explicitos.

## Como explicar seguridad

La seguridad se explica desde producto, no desde internals.

Puntos a mostrar:

- JEFE no modifica nada sin permiso humano.
- Las acciones sensibles se frenan o quedan para aprobacion.
- La demo local evita deploy, credenciales reales, bases productivas, Docker y servicios externos.
- El resultado se presenta con resumen, ubicacion y proximo paso.
- La auditoria queda disponible para revisar evidencia cuando alguien la pida.

Evitar abrir de entrada logs largos, nombres internos de workers o detalles de CI. Esos datos son importantes, pero no son la primera historia del producto.

## Auditoria

Despues de explicar la home, abrir `Auditoria` solo como segunda capa.

Explicacion recomendada:

> La capa de auditoria existe para operadores tecnicos y compradores enterprise. Muestra evidencia, diagnosticos, rutas, permisos y detalles de ejecucion, pero no interrumpe la experiencia principal.

Mostrar solo lo necesario:

- que el detalle tecnico existe;
- que los logs y datos internos no estan escondidos;
- que Avanzado y Tecnico son capas secundarias, no el foco de la demo.

## Vista avanzada y tecnico

Usar `Avanzado` y `Tecnico` como prueba de profundidad, no como parte principal del pitch.

Mostrar brevemente:

- que existe una vista avanzada para inspeccion operativa;
- que hay secciones de objetivo, planificacion, ejecucion, aprobaciones, memoria y corridas;
- que el modo tecnico queda para diagnostico y auditoria detallada.

No intentar dejar cada pantalla avanzada perfecta durante la demo. Si alguien pregunta por internals, entrar solo a la seccion correspondiente y volver a `Simple`.

## Que no mostrar todavia

No mostrar como foco principal:

- workers;
- smokes;
- CI;
- permit bundles;
- readiness interno;
- dry-run;
- MCP;
- logs largos;
- estados internos crudos;
- pantallas avanzadas vacias o demasiado operativas.

Tampoco ejecutar durante la demo:

- `npm install`;
- deploy;
- Docker;
- bases reales;
- credenciales reales;
- servicios externos pagos;
- integraciones productivas.

## Riesgos y limitaciones honestas

Decirlo asi si aparece la pregunta:

- La experiencia principal ya esta orientada a demo e inversor.
- La capa avanzada todavia conserva superficies operativas densas porque JEFE tambien es una herramienta de control y auditoria.
- Algunas integraciones reales deben seguir bajo aprobacion humana.
- La demo muestra flujo local seguro; no promete deploy automatico ni conexion productiva sin supervision.
- La prioridad actual es demostrar claridad de producto, control humano y trazabilidad.

## Cierre recomendado

Cerrar volviendo a `Simple`.

Frase final sugerida:

> JEFE no es solo un chat. Es un orquestador que toma un objetivo, lo convierte en plan, coordina trabajo controlado, valida y deja una entrega revisable con auditoria disponible.
