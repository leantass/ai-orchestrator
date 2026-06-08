# JEFE / Orquestador de IA Local - Post-MVP Risk Log v1

## 1. Objetivo

Registrar los riesgos principales despues del cierre del MVP visual sandbox para evitar perdida de contexto durante los siguientes bloques.

## 2. Riesgos activos

### R1. `electron/main.cjs` grande y critico

- Impacto: alto
- Probabilidad: alta
- Riesgo: cambios pequenos pueden romper planner, approval, execute o sandbox
- Mitigacion recomendada: extraer helpers puros sin cambiar comportamiento

### R2. `src/App.tsx` grande y critico

- Impacto: alto
- Probabilidad: alta
- Riesgo: estados visuales y ramas de approval/result pueden contaminarse
- Mitigacion recomendada: modularizar panels y view-state sin redisenar la UI

### R3. `electron/local-deterministic-executor.cjs` legacy

- Impacto: medio-alto
- Probabilidad: alta
- Riesgo: mantener ramas por dominio dificulta evolucionar a capabilities
- Mitigacion recomendada: migracion gradual con fallback legacy controlado

### R4. Automatizacion visual dependiente del entorno

- Impacto: medio
- Probabilidad: media
- Riesgo: una prueba visual puede ser dificil de repetir fuera del entorno local correcto
- Mitigacion recomendada: mantener driver visual y evidencia local clara

### R5. `.codex-temp` no permanente

- Impacto: medio
- Probabilidad: alta
- Riesgo: perder evidencia local si se limpia sin criterio
- Mitigacion recomendada: documentar rutas clave y no tratar `.codex-temp` como almacenamiento estable

### R6. Materializacion fuera de sandbox aun bloqueada

- Impacto: medio
- Probabilidad: intencional
- Riesgo: se asuma equivocadamente que ya hay escritura productiva habilitada
- Mitigacion recomendada: mantener documentacion explicita de alcance

### R7. Seguir agregando logica al bridge sin modularizar

- Impacto: alto
- Probabilidad: media-alta
- Riesgo: approval parsing y transiciones se vuelven mas fragiles
- Mitigacion recomendada: consolidar helpers de decision y coercion de approval

### R8. Mezclar harness con prueba visual

- Impacto: medio
- Probabilidad: media
- Riesgo: reportes de validacion enganiosos
- Mitigacion recomendada: distinguir siempre visual real, UI-E2E y harness

### R9. Riesgo de `web-prueba`

- Impacto: alto
- Probabilidad: media
- Riesgo: una regresion podria volver a proponer escritura insegura
- Mitigacion recomendada: mantener bloqueos, smokes y criterio operativo estricto

## 3. Riesgos fuera de alcance por ahora

- deploy real
- Docker real
- servicios externos reales
- pagos reales
- DB productiva
- credenciales

## 4. Regla de seguimiento

Si un cambio aumenta cualquiera de estos riesgos, debe venir acompanado por:

- smoke o coverage equivalente
- CI verde
- actualizacion documental si cambia el alcance real
