# AGENTS - C_ASISTENCIA_FRONTEND (Actualizado 2026-03-11)

## Objetivo

Guiar a futuros agentes para mantener estable el modulo de superadmin ya cerrado,
y avanzar los siguientes modulos con ejecucion controlada (discovery -> implementacion).

## Estado base confirmado (2026-03-11)

- Modulo superadmin funcionalmente cerrado para esta etapa.
- Organizaciones con `campo` + `distrito` en alta, edicion, tabla y filtros.
- Gestion de catalogos globales de campos y distritos (crear/editar/eliminar).
- Estados de admin temporal visibles (`ADMIN activo`, `ADMIN expirado`, `Sin ADMIN`) y detalle en acordeon por fila.
- Exportacion de tabla filtrada a Excel.
- Envio opcional de credenciales por correo (Brevo) integrado por backend.

## Lectura obligatoria al iniciar

1. `.agents/react-doctor/CONTEXTO_ACTUAL.md`
2. `.agents/react-doctor/ROADMAP_ESCALABILIDAD_NACIONAL.md`
3. `.agents/react-doctor/TICKETS_ESCALABILIDAD_NACIONAL.md`
4. `.agents/react-doctor/prompt_frontend.md`
5. `.agents/react-doctor/SKILL.md`

## Modo de arranque obligatorio (sin programar)

Antes de tocar codigo, el agente debe:

1. Leer los documentos obligatorios.
2. Entregar un brief corto con:
   - que entendio,
   - alcance propuesto,
   - riesgos/dependencias,
   - archivos potencialmente impactados.
3. Esperar aprobacion explicita del owner para implementar.

Si no hay instruccion explicita de implementacion, el agente permanece en modo analisis.

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

## Nota operativa

El siguiente bloque de trabajo lo define el owner funcional segun prioridad de modulo.
