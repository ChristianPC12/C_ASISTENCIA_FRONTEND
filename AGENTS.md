# AGENTS - C_ASISTENCIA_FRONTEND

## Objetivo

Mantener documentacion operativa para agentes de IA que trabajen este frontend sin perder alineacion con backend y roadmap de escalabilidad nacional.

## Lectura obligatoria al iniciar

1. `.agents/react-doctor/CONTEXTO_ACTUAL.md`
2. `.agents/react-doctor/ROADMAP_ESCALABILIDAD_NACIONAL.md`
3. `.agents/react-doctor/prompt_frontend.md`
4. `.agents/react-doctor/SKILL.md`

## Regla de uso por tipo de tarea

- Cambios React (JSX/hooks/rutas/formularios): ejecutar `react-doctor`.
- Cambios de auth/API/rutas/roles: actualizar contexto y prompt.
- Cambios de escalabilidad (multiiglesia/multigrupo/superadmin): actualizar roadmap antes y despues.

## Regla de estado del roadmap

- `[ ]` pendiente
- `[~]` en progreso
- `[x]` completado

No cerrar una fase si hay tareas pendientes criticas dentro de esa fase.

## Sincronizacion obligatoria con backend

Si una tarea toca contrato o modelo de datos, reflejar el cambio tambien en:

- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/CONTEXTO_ACTUAL_BACKEND_MULTIIGLESIA.md`
- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/ROADMAP_BACKEND_MULTIIGLESIA.md`

