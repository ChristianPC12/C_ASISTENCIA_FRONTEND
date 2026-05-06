# Roadmap de Escalabilidad Nacional (IASD Costa Rica)

Fecha base: 2026-03-09  
Ultima actualizacion: 2026-05-06
Estado global frontend: F0..F7 cerradas, F8 en refinamiento funcional

## 1) Objetivo del roadmap

Evolucionar frontend de single-tenant a operacion nacional multi-tenant, manteniendo:

- aislamiento por organizacion,
- seguridad por rol,
- setup inicial obligatorio por tenant,
- analitica dinamica por configuracion local.

## 2) Alcance de esta etapa

Incluye:

- superadmin y onboarding de instancias,
- login canonico `usuario + password`,
- sesion tenant-aware,
- setup inicial y bloqueo operativo,
- registro/estadistica/comparaciones/presentaciones dinamicas,
- cupos por rol en UI,
- hardening de salida frontend.

No incluye:

- rediseno visual completo,
- cambio de stack.

## 3) Estado por fase

| Fase | Pri | Estado | Entrega principal |
|---|---|---|---|
| F0 - Contrato y decisiones base | P0 | [x] | Definiciones canonicas de identidad/login/API |
| F1 - Aislamiento multitenant base | P0 | [x] | Scoping tenant en UI + prueba funcional |
| F2 - Superadmin y alta de instancias | P0 | [x] | UI completa de gestion de organizaciones |
| F3 - Login y sesion tenant-aware | P0 | [x] | Sesion ligada a tenant autenticado |
| F4 - Configuracion inicial por instancia | P0 | [x] | Modulo Administrador + bloqueo por setup |
| F5 - Registro y analitica dinamica | P1 | [x] | Formularios/reportes dinamicos por tenant |
| F6 - Cupos de usuarios por rol | P1 | [x] | UI de cupos y mensajes de excedente |
| F7 - Hardening y salida frontend | P0 | [x] | QA seguridad + checklist salida frontend |
| F8 - Modulos misioneros nacionales | P2 | [~] | Campanas avanzado; Estudios Biblicos en pulido funcional |

## 4) Resumen operativo por fase cerrada

### F4 cerrada

- setup centralizado en `/administrador`,
- guard visual en rutas operativas mientras setup esta pendiente,
- regla de dependencias en UI (puntualidad ambos o ninguno).

Evidencia:
- `.agents/react-doctor/EVIDENCIA_F4_T01_T02_T03_SETUP_INICIAL_2026-03-10.md`

### F5 cerrada

- formulario de asistencia dinamico por metricas activas,
- tabla y detalle de registros dinamicos,
- estadisticas/comparaciones/presentaciones con `metricas_dinamicas`.

Evidencia:
- `.agents/react-doctor/EVIDENCIA_F5_T01_T02_T03_T04_DINAMICO_2026-03-10.md`

### F6 cerrada

- cupos por rol visibles/ajustables en UI,
- mensajes UX al exceder cupo.

Evidencia:
- `.agents/react-doctor/EVIDENCIA_F6_T01_T02_CUPOS_UI_2026-03-10.md`

### F7 cerrada

- UX de ADMIN temporal (vigencia 5 dias),
- hardening 401/403/429 en frontend,
- checklist formal de salida frontend.

Evidencia:
- `.agents/react-doctor/EVIDENCIA_F7_T01_T02_T03_HARDENING_2026-03-10.md`
- `.agents/react-doctor/CHECKLIST_SALIDA_PRODUCCION_F7_T03.md`

## 5) Regla de sincronizacion

Toda actualizacion de auth/rutas/contrato debe reflejarse tambien en backend:

- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/CONTEXTO_ACTUAL_BACKEND_MULTIIGLESIA.md`
- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/ROADMAP_BACKEND_MULTIIGLESIA.md`
- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/TICKETS_BACKEND_MULTIIGLESIA.md`

## 6) Fase actual

- F8 dejo de ser solo discovery: ya existen Campanas, Pequenas Congregaciones, Estudios Biblicos y Juntas.
- Foco actual: pulido funcional de `Estudios Biblicos`, especialmente asignacion multiple, instructores y registro de sesiones.
- `Campanas` queda como referencia visual/responsive aprobada junto con los KPIs y filtros compactos de `Estudios Biblicos`.
