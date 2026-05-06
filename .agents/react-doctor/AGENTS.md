# React Doctor - Agent Guide

Este paquete de agentes define como ejecutar la escalabilidad nacional por tickets,
sin perder trazabilidad entre frontend y backend.

## Objetivo

- Mantener una ruta unica y clara para multiiglesia/multigrupo.
- Permitir ejecucion incremental: un ticket por vez, con evidencia.
- Cerrar cada cambio React con `react-doctor`.

## Orden de lectura obligatorio

1. `CONTEXTO_ACTUAL.md`
2. `ROADMAP_ESCALABILIDAD_NACIONAL.md`
3. `TICKETS_ESCALABILIDAD_NACIONAL.md`
4. `prompt_frontend.md`
5. `SKILL.md`

## Modo de arranque obligatorio (discovery-first)

Antes de tocar codigo:

1. leer los 5 documentos en orden,
2. entregar un brief corto de alcance/riesgos/dependencias,
3. esperar instruccion explicita del owner para implementar.

Sin esa instruccion, el agente debe permanecer en modo analisis.

## Activacion obligatoria de este paquete

Si la solicitud incluye uno o mas temas de esta lista:

- escalabilidad nacional
- multiiglesia / multigrupo
- superadmin
- tenant / organizacion / campo IASD
- bloqueo de modulos por configuracion inicial
- parametros dinamicos de registro
- cuotas de usuarios por rol
- modulos futuros (campanas, pequenas congregaciones, estudios biblicos)

## Reglas de ejecucion

- No implementar una fase completa de una sola vez: ejecutar por ticket.
- Marcar `[~]` antes de tocar codigo y `[x]` al terminar ticket.
- Agregar fecha de cierre en el ticket cerrado.
- Si cambia contrato/backend, sincronizar tambien los agentes backend.
- No marcar `[x]` sin aprobacion explicita del owner funcional.

## Uso de react-doctor

```bash
npx -y react-doctor@latest . --verbose --diff
```

Ejecutar cuando se modifique JSX, hooks, rutas, formularios, estado o estilos que afecten comportamiento.

## Regla de mantenimiento documental

Actualizar estos archivos si cambia auth, rutas, endpoints, validaciones o prioridad del plan:

- `CONTEXTO_ACTUAL.md`
- `ROADMAP_ESCALABILIDAD_NACIONAL.md`
- `TICKETS_ESCALABILIDAD_NACIONAL.md`
- `prompt_frontend.md`

## Checklist de cierre documental

- no hay contradiccion frontend/backend
- el estado `[ ]/[~]/[x]` coincide con codigo real
- los tickets tienen dependencia y criterio de aceptacion claros
- se deja visible el siguiente ticket recomendado

## Continuidad rapida para chats nuevos (2026-05-06)

Cuando el owner pida "ponte al tanto", el agente debe asumir que el foco ya no es F8 discovery sino refinamiento funcional de modulos misioneros, especialmente `Estudios Biblicos`.

Lectura minima para continuar:

1. `CONTEXTO_ACTUAL.md`, seccion `Continuidad Mayo 2026`.
2. `prompt_frontend.md`, secciones de rutas y contratos de modulos misioneros.
3. Backend: `.agents/escalabilidad/CONTEXTO_ACTUAL_BACKEND_MULTIIGLESIA.md`, seccion `Continuidad Mayo 2026`.

Resumen de estado:

- `Campanas` esta pulido en responsive para el boton principal y `Visitas`.
- `VisitasGeneralView` es compartido por `Campanas` y `Estudios Biblicos`.
- `EstudiosBiblicosPage` concentra:
  - lista/filtros/KPIs,
  - CRUD visual de instructores basado en `Administrador > Usuarios`,
  - asignacion multiple de visitas e instructores,
  - registro de sesion para rol `INSTRUCTOR_BIBLICO`.
- Cualquier cambio React/CSS debe cerrar con:

```bash
npm run build
npx -y react-doctor@latest . --verbose --diff
```
