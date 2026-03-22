# Contexto Actual Frontend (2026-03-12)

## Estado general vigente

- Frontend: React 19 + Vite 7 + Bootstrap 5.
- Backend: PHP 8 sin framework (`C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND`).
- Escalabilidad nacional frontend: fases F0..F7 cerradas.
- Modulo de superadmin cerrado para esta etapa funcional.
- Backlog futuro: F8 (discovery de modulos nacionales).

## Estado funcional real en codigo

Rutas activas:

- `/superadmin` (solo `SUPERADMIN`)
- `/administrador` (solo `ADMIN`, setup inicial)
- `/registro` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/registros` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/estadisticas` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/comparaciones` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/presentaciones` (ADMIN/SECRETARIO, bloqueada si setup pendiente)
- `/usuarios` (solo `ADMIN`, bloqueada si setup pendiente)

## Superadmin consolidado (2026-03-11)

- Alta de organizacion exige `campo` y `distrito`.
- Gestion de catalogos de `campos` y `distritos` desde UI (crear/editar/eliminar).
- Filtros de tabla por campo, distrito, tipo, anio y estado de admin.
- Tabla de organizaciones con encabezado fijo y scroll interno.
- Exportacion de tabla a Excel (`.xlsx`) basada en el filtrado actual.
- Estados de admin temporal visibles:
  - `ADMIN activo` (turquesa),
  - `ADMIN expirado` (amarillo),
  - `Sin ADMIN` (rojo).
- Detalle de admin/correo en acordeon dentro de la misma fila (toggle al reseleccionar).
- Formularios de accion compactados:
  - solo una accion visible a la vez (`Crear instancia`, `Crear ADMIN temporal`, `Editar organizacion`, `Gestionar campos`, `Gestionar distritos`).
- `correo_destino` se autocompleta desde organizacion y se bloquea en UI.
- Mensajeria de resultado via notificaciones flotantes (sin banners persistentes).

## Contrato consumido en frontend (superadmin)

- `GET /v2/superadmin/organizaciones`
- `POST /v2/superadmin/organizaciones`
- `PUT /v2/superadmin/organizaciones/{organizacion_id}`
- `POST /v2/superadmin/organizaciones/{organizacion_id}/admin-temporal`
- `GET /v2/superadmin/campos`
- `POST /v2/superadmin/campos`
- `PUT /v2/superadmin/campos/{codigo}`
- `DELETE /v2/superadmin/campos/{codigo}`
- `GET /v2/superadmin/distritos`
- `POST /v2/superadmin/distritos`
- `PUT /v2/superadmin/distritos/{codigo}`
- `DELETE /v2/superadmin/distritos/{codigo}`

## Cierre por fases

- F0: decisiones base de identidad/login/contrato v2 cerradas.
- F1: scoping tenant UI y prueba funcional de aislamiento cerradas.
- F2: superadmin UI (acceso, alta, admin temporal, edicion organizacion) cerrada.
- F3: login canonico + sesion tenant-aware cerradas.
- F4: setup inicial por tenant + bloqueo visual de modulos cerrados.
- F5: formulario/reportes/estadisticas/comparaciones/presentaciones dinamicas cerrados.
- F6: UI de cupos por rol + UX de excedentes cerrada.
- F7: hardening frontend (admin temporal, 401/403/429, checklist salida) cerrado.

## Ajustes recientes en Administrador (2026-03-12)

- Setup de administrador reorganizado para UX movil/desktop con una sola vista activa por panel.
- Topbar de admin simplificada: `Cultos`, `Metricas`, `Procedencias` (sin panel separado de reglas).
- Cambio de panel con cambios locales pendientes restaura snapshot base (no persiste sin `Guardar`).
- Boton `Limpiar` restablece estado local sin confirmacion adicional.
- Botones `Guardar` visibles solo cuando existe diff real contra baseline por seccion.
- Modelo de metricas migrado en UI a `categoria`:
  - se elimina exposicion de `depende_de_clave`, `regla_dependencia`, `orden`;
  - metricas base protegidas para evitar edicion estructural y eliminacion.
- Reglas de consistencia permanecen en logica:
  - `llegaron_antes_hora` / `llegaron_despues_hora` en par;
  - `total_asistentes` coherente con puntualidad.
- Copy del modulo administrador normalizado (tildes, `ñ`, textos de confirmacion y labels).
- `Nombre de culto` limitado a 20 caracteres en UI y validado en hook.

## Ajustes recientes en Registro de asistencia (2026-03-22)

- El formulario ya no despliega todas las categorias al elegir `Culto`.
- Nuevo flujo compacto:
  - `Culto` y `Fecha` quedan visibles como contexto fijo.
  - Las categorias activas se recorren una por vez con flechas izquierda/derecha.
- Los inputs numericos se compactan mejor para reducir scroll y mejorar el uso en movil.
- Los errores logicos inmediatos migran a notificacion flotante tipo `advertencia` (amarillo), manteniendo solo resalte visual del campo.
- Reglas duras de captura se bloquean antes de entrar al estado local:
  - composicion no puede superar total,
  - procedencia no puede superar total,
  - permanencia no puede superar total,
  - visitas no puede superar procedencia.
- `AsistenciaPage` vuelve a pasar `fechasRegistradas` al formulario para mantener el bloqueo coherente de fechas repetidas.

## Validaciones tecnicas vigentes

- `npm run build` -> OK.
- `npx eslint src/pages/SuperadminPage.jsx` -> OK.
- `npx eslint` sobre archivos modificados de administrador/setup -> OK.
- `react-doctor` (`--diff`, cambios actuales) -> 100/100.
- Flujo runtime API comprobado:
  - `401` auth sin token.
  - `429` rate limit de login.
  - `403 SETUP_REQUIRED` manejado en UI por evento global + bloqueo visual.

## Riesgos tecnicos abiertos

- Chunk `LoginPage` mayor a 500 kB en build (warning Vite), sin fallo funcional.
- Token continua en `localStorage` (riesgo XSS conocido; mitigacion futura recomendada).
- `SuperadminPage.jsx` sigue siendo un componente grande (deuda de modularizacion).

## Archivos clave de esta etapa

- `src/pages/SuperadminPage.jsx`
- `src/hooks/useSuperadminOrganizaciones.js`
- `src/api/superadminApi.js`
- `src/components/layout/Sidebar.jsx`
- `src/config/events.js`
- `src/config/api.js`
- `src/components/asistencia/AsistenciaForm.jsx`
- `src/hooks/useAsistencia.js`
- `src/utils/notify.js`
- `src/components/ui/ToastContainer.jsx`

## Proximo foco

- F8 discovery UX (Campanas, Pequenas Congregaciones, Estudios Biblicos), definido por owner.
