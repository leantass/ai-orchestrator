# JEFE Assets And Database Generation Roadmap V1

## Assets

JEFE debe contemplar logo placeholder, iconos, imagenes mock, paletas, componentes visuales, copies, textos legales base, screenshots de referencia, assets de app/web, assets para mobile mock, assets para desktop mock, assets para SaaS, brand kit futuro, extraccion de paleta futura y analisis visual futuro.

En fases tempranas los assets son mock o placeholder. La copia de assets debe ser segura hacia el run y hacia el proyecto. No debe borrar ni sobrescribir assets reales sin aprobacion.

## Base de datos

JEFE debe contemplar entidades, relaciones, schema, migrations, seeds, mock data, fixtures, data validation, datos demo, estrategia local/dev/prod, estrategia multi-tenant si aplica SaaS, estrategia auth si aplica, estrategia backup si aplica, y privacidad/datos personales si aplica.

## Reglas por nivel

- L1: solo mock data, sin DB real y sin credenciales.
- L2: scaffold tecnico y posible estructura de data layer, sin produccion.
- L3: Codex puede implementar modelos aprobados.
- L4: Vitest y MSW validan logica y servicios.
- L5: Playwright valida flujos reales.
- L8: staging puede usar DB de staging.
- L9: produccion solo con aprobacion explicita.

## Reglas duras

- Nada de DB productiva sin aprobacion.
- Nada de credenciales reales en fases tempranas.
- Nada de pagos reales en L1/L2.
- Nada de datos personales reales en mocks.
- Nada de OpenAI API, Hermes, Scout, Codex build loop o herramientas reales sin approvals, governance y cost control.

## Relacion con modos de proyecto

Crear proyecto nuevo puede generar mock data y estructura documental. Continuar proyecto existente puede auditar modelos de datos existentes. Terminar proyecto incompleto puede proponer migrations futuras. Auditar proyecto existente puede detectar riesgos de datos, seguridad, privacidad, staging, produccion, analitica, monetizacion y memoria validada.
