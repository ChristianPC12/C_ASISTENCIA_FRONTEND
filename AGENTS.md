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
5. `.agents/react-doctor/AGENTE_ANTI_ERRORES_UI.md`
6. `.agents/react-doctor/AGENTE_DISENO_ESPACIO_UI.md`
7. `.agents/react-doctor/SKILL.md`

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
- Cambios de diseño/orden/layout: leer y respetar `AGENTE_DISENO_ESPACIO_UI.md`.
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

## Estado actual de modulos misioneros (2026-04-04)
- Ya existen y estan conectados en frontend: Campanas, Estudios Biblicos, Pequenas Congregaciones (PC) y Juntas de Iglesia.
- Ya existe integracion directa desde Campanas y PC hacia Estudios Biblicos mediante accion 'A estudio'.
- Si otro chat recibe la instruccion 'estudia los agents', debe entender que el siguiente trabajo natural es refinar reportes/exportaciones, endurecer smoke tests funcionales y seguir integraciones entre modulos sin redisenar la UI.
- Antes de proponer cambios visuales, revisar primero si el patron ya existe en Administrador, Registros, Estadisticas o Comparaciones.

## Continuidad operativa actual (2026-05-06)

Si otro chat recibe "ponte al tanto" o "continua desde donde quedamos", debe leer primero esta seccion y luego:

1. `.agents/react-doctor/CONTEXTO_ACTUAL.md`
2. `.agents/react-doctor/prompt_frontend.md`
3. `C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND/.agents/escalabilidad/CONTEXTO_ACTUAL_BACKEND_MULTIIGLESIA.md`

Estado real del trabajo:

- `Campanas` quedo practicamente cerrado para esta etapa funcional.
  - Subvistas: `Campanas`, `Nueva campana`, `Ver campana` y `Visitas`.
  - En responsive de telefono, KPIs primero, filtros en boton/modal y tabla liberada.
  - La vista `Visitas` se reutiliza tambien desde `Estudios Biblicos`.
- `Estudios Biblicos` es el modulo activo actual.
  - Subvistas para ADMIN/MINISTERIO_PERSONAL: `Visitas`, `Estudios Biblicos`, `Instructores`, `Asignar estudio`.
  - Subvista especial para `INSTRUCTOR_BIBLICO`: `Registrar sesion`.
  - `Instructores` reutiliza el patron visual de `Administrador > Usuarios`; crea usuarios reales con rol `INSTRUCTOR_BIBLICO`.
  - `Asignar estudio` permite multiples visitas y multiples instructores, evita duplicados activos, usa seleccion visual con fondo activo y accion de quitar.
  - La tabla principal de estudios usa solo estados funcionales: `ASIGNADO`, `EN_PROCESO`, `PAUSADO`, `FINALIZADO`.
  - En `Registrar sesion`, los instructores solo ven Estudios Biblicos y la pantalla de registro; no se oculta el sidebar, solo se compacto el header superior para ese contexto.
  - El registro de sesion valida periodo actual, frecuencia semanal/mensual/trimestral, pendientes, justificaciones, fecha dentro del periodo y estudios futuros.
  - Los estados vacios de registro (`estudios-registro-state-*`) deben ocupar todo el alto disponible del card derecho.
- Ultima verificacion frontend:
  - `npm run build` OK.
  - `npx -y react-doctor@latest . --verbose --diff` OK, 91/100, con advertencias conocidas en `CampanasPage`, `Sidebar`, `VisitasGeneralView` y `EstudiosBiblicosPage`.

