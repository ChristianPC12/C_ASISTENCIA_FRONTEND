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
- `react-doctor` (`--diff`, 6 archivos cambiados) -> 99/100 (2 warnings: `ConfirmModal` y tamano de `AdministradorPage`).
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
