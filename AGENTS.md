# AGENTS - C_ASISTENCIA_FRONTEND

## Objetivo

Guiar a futuros agentes para ejecutar la escalabilidad nacional por pasos pequenos,
sin romper el sistema actual ni desalinear frontend y backend.

## Lectura obligatoria al iniciar

1. `.agents/react-doctor/CONTEXTO_ACTUAL.md`
2. `.agents/react-doctor/ROADMAP_ESCALABILIDAD_NACIONAL.md`
3. `.agents/react-doctor/TICKETS_ESCALABILIDAD_NACIONAL.md`
4. `.agents/react-doctor/prompt_frontend.md`
5. `.agents/react-doctor/SKILL.md`

## Regla de uso por tipo de tarea

- Cambios React (JSX, hooks, rutas, formularios): ejecutar `react-doctor`.
- Cambios de auth/API/rutas/roles: actualizar `CONTEXTO_ACTUAL.md` y `prompt_frontend.md`.
- Cambios de escalabilidad (multiiglesia, multigrupo, superadmin): actualizar roadmap y tickets antes y despues.

## Regla operativa de tickets

- Trabajar por ticket, no por "fase completa" en una sola entrega.
- Solo un ticket por fase puede estar en `[~]` al mismo tiempo.
- No abrir ticket de fase siguiente si la fase actual tiene bloqueadores P0 abiertos.
- Al cerrar ticket: marcar `[x]`, agregar fecha y evidencia corta (archivo/ruta impactada).
- Ningun ticket puede marcarse en `[x]` sin aprobacion explicita del owner funcional.

## Convencion de estado

- `[ ]` pendiente
- `[~]` en progreso
- `[x]` completado

## Sincronizacion obligatoria con backend

Si una tarea toca contrato, auth, roles o modelo de datos, reflejar el cambio tambien en:

- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/CONTEXTO_ACTUAL_BACKEND_MULTIIGLESIA.md`
- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/ROADMAP_BACKEND_MULTIIGLESIA.md`
- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/TICKETS_BACKEND_MULTIIGLESIA.md`

## Primer ticket recomendado para iniciar

- `F0-T01` en `.agents/react-doctor/TICKETS_ESCALABILIDAD_NACIONAL.md`
