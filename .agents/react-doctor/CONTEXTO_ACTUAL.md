# Contexto Actual Frontend (2026-03-10)

## Estado general vigente

- Frontend: React 19 + Vite 7 + Bootstrap 5.
- Backend: PHP 8 sin framework (`C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND`).
- Escalabilidad nacional frontend: fases F0..F7 cerradas.
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

Ajustes de pulido superadmin (post F7, 2026-03-10):

- nombre de organizacion y nombre de ADMIN temporal restringidos sin numeros.
- nombre de organizacion y nombre de ADMIN temporal con rango valido de 5-30 caracteres.
- correo de contacto y correo destino con validacion de formato mas estricta + maximo 30 caracteres.
- en `Crear ADMIN temporal`, el correo destino se autocompleta desde la organizacion y queda bloqueado en UI.
- `Crear ADMIN temporal` se activa desde acciones de la tabla (no visible por defecto).
- al abrir `Crear ADMIN temporal` se oculta `Crear nueva instancia`; al cerrar vuelve a mostrarse.
- boton `Actualizar lista` movido a la seccion `Organizaciones registradas`.
- encabezado superior de superadmin removido para liberar espacio util del modulo.
- tabla de organizaciones con scroll vertical y filtros por campo/tipo/anio/organizacion (opcion `Todos`).
- al editar organizacion se ocultan formularios de creacion; al cancelar/guardar se restauran.
- edicion de organizacion ahora permite cambiar estado `Activa/Inactiva`.

## Cierre por fases

- F0: decisiones base de identidad/login/contrato v2 cerradas.
- F1: scoping tenant UI y prueba funcional de aislamiento cerradas.
- F2: superadmin UI (acceso, alta, admin temporal, edicion organizacion) cerrada.
- F3: login canonico + sesion tenant-aware cerradas.
- F4: setup inicial por tenant + bloqueo visual de modulos cerrados.
- F5: formulario/reportes/estadisticas/comparaciones/presentaciones dinamicas cerrados.
- F6: UI de cupos por rol + UX de excedentes cerrada.
- F7: hardening frontend (admin temporal, 401/403/429, checklist salida) cerrado.

## Evidencias frontend recientes (2026-03-10)

- F4: `.agents/react-doctor/EVIDENCIA_F4_T01_T02_T03_SETUP_INICIAL_2026-03-10.md`
- F5: `.agents/react-doctor/EVIDENCIA_F5_T01_T02_T03_T04_DINAMICO_2026-03-10.md`
- F6: `.agents/react-doctor/EVIDENCIA_F6_T01_T02_CUPOS_UI_2026-03-10.md`
- F7: `.agents/react-doctor/EVIDENCIA_F7_T01_T02_T03_HARDENING_2026-03-10.md`
- Checklist salida frontend: `.agents/react-doctor/CHECKLIST_SALIDA_PRODUCCION_F7_T03.md`

## Validaciones tecnicas vigentes

- `npm run build` -> OK.
- `react-doctor` (`--diff`, cambios actuales) -> 99/100 (1 warning: tamano de `SuperadminPage`).
- Flujo runtime API comprobado:
  - `401` auth sin token.
  - `429` rate limit de login.
  - `403 SETUP_REQUIRED` manejado en UI por evento global + bloqueo visual.

## Riesgos tecnicos abiertos

- Chunk `LoginPage` mayor a 500 kB en build (warning Vite), sin fallo funcional.
- Token continua en `localStorage` (riesgo XSS conocido; mitigacion futura recomendada).
- Decision de salida productiva final depende del runbook operativo de backend/infra.

## Archivos clave de esta etapa

- `src/App.jsx`
- `src/hooks/useAuth.jsx`
- `src/hooks/useSetupStatus.jsx`
- `src/hooks/useSetupAdministrador.js`
- `src/hooks/useAsistencia.js`
- `src/hooks/useComparaciones.js`
- `src/hooks/useUsuario.js`
- `src/pages/AdministradorPage.jsx`
- `src/pages/EstadisticasPage.jsx`
- `src/pages/PresentacionesPage.jsx`
- `src/pages/SuperadminPage.jsx`
- `src/config/api.js`

## Proximo foco

- F8 discovery UX (Campanas, Pequenas Congregaciones, Estudios Biblicos).
