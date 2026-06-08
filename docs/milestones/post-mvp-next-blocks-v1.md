# JEFE / Orquestador de IA Local - Post-MVP Next Blocks v1

## 1. Objetivo

Ordenar los proximos bloques de trabajo despues del cierre del MVP visual sandbox sin mezclar consolidacion, deuda tecnica y nuevos alcances.

## 2. Prioridad recomendada

### A. Auditoria de evidencia visual no versionada

- revisar subcarpetas viejas de `.codex-temp/electron-visual-e2e/`
- decidir que preservar localmente
- no borrar sin confirmacion

### B. `main.cjs` safe extraction

- extraer helpers puros
- no cambiar runtime
- mantener harness y CI verde

### C. `App.tsx` UI state modularization

- separar approval, result y status panels
- aislar coerciones de estado visual
- no redisenar visualmente la UI

### D. `local-deterministic-executor.cjs` capability migration

- migrar gradualmente de ramas por dominio a capacidades
- mantener fallback legacy mientras exista deuda activa

### E. Mas dominios de prueba

- biblioteca comunitaria
- cooperativa de reciclaje
- comedor comunitario
- turnos mock
- inventario barrial

### F. Release post-MVP

- tag
- changelog
- demo script
- checklist

## 3. Criterio de ejecucion

Cada bloque deberia:

- mantener el sandbox como limite operativo
- no tocar `web-prueba`
- no vender harness como visual
- mantener CI verde antes de avanzar al siguiente bloque

## 4. Que no hacer entre bloques

- no apilar cambios con CI en progreso
- no abrir alcance productivo real sin aprobacion explicita
- no mezclar limpieza local con cambios funcionales
- no convertir `.codex-temp` en dependencia del producto
