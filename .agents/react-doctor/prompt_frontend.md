# Prompt Operativo Frontend + Contrato Backend (Mar 2026)

## 1) Objetivo

Fuente de verdad tecnica del estado real frontend para etapa nacional multi-tenant.

## 2) Mapa rapido

```text
React (Vite) -> Axios (/api)
             -> Proxy Vite -> PHP index.php -> Routers -> Controllers -> Services -> DAO -> MariaDB
```

- Frontend repo: `C_ASISTENCIA_FRONTEND/C_ASISTENCIA_FRONTEND`
- Backend repo: `C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND`
- BD: `iglesia_asistencia`

## 3) Stack real

Frontend:

- react 19.2
- react-router-dom 7.6
- axios 1.13
- bootstrap 5.3
- vite 7.3

Backend:

- PHP 8 sin framework
- JSON estandar `{ exito, mensaje, datos? }` (+ `codigo` en errores v2)

## 4) Rutas activas y permisos

- `/` login
- `/superadmin` solo `SUPERADMIN`
- `/administrador` solo `ADMIN`
- `/registro` `ADMIN/SECRETARIO` + requiere setup completo
- `/registros` `ADMIN/SECRETARIO` + requiere setup completo
- `/estadisticas` `ADMIN/SECRETARIO` + requiere setup completo
- `/comparaciones` `ADMIN/SECRETARIO` + requiere setup completo
- `/presentaciones` `ADMIN/SECRETARIO` + requiere setup completo
- `/usuarios` solo `ADMIN` + requiere setup completo

## 5) Auth y sesion

Login canonico:

- payload: `{ usuario, password }`
- tenant se resuelve en backend

Persistencia frontend:

- `token`
- `usuario`
- `tenant`
- `session`

401 global (`src/config/api.js`):

- limpia `token/usuario/tenant/session`
- redirige a `/`
- evita cascada de toasts

403 setup:

- si `codigo=SETUP_REQUIRED`, emite evento `setup:required`
- `useSetupStatus` marca tenant en estado pendiente

429 login:

- frontend muestra mensaje backend tal cual

## 6) Setup inicial por tenant (F4)

Nuevos elementos frontend:

- `src/hooks/useSetupStatus.jsx` (estado global setup)
- `src/hooks/useSetupAdministrador.js` (logica modulo admin)
- `src/pages/AdministradorPage.jsx`
- `src/components/setup/SetupBlockedNotice.jsx`

Endpoints consumidos:

- `GET /v2/setup/estado`
- `PUT /v2/setup/cultos`
- `PUT /v2/setup/metricas`
- `PUT /v2/setup/procedencias`
- `POST /v2/setup/finalizar`

## 7) Superadmin (F2) y cupos (F6)

Superadmin:

- `GET /v2/superadmin/organizaciones`
- `POST /v2/superadmin/organizaciones`
- `PUT /v2/superadmin/organizaciones/{organizacion_id}` (incluye `activa` en edicion)
- `POST /v2/superadmin/organizaciones/{organizacion_id}/admin-temporal`

UX actual superadmin:

- nombre de organizacion/ADMIN temporal sin numeros y con rango de 5-30 caracteres.
- correo con validacion estricta en create/edit y maximo de 30 caracteres.
- `correo_destino` de admin temporal se autocompleta desde la organizacion seleccionada y queda bloqueado en UI.
- formulario de admin temporal se abre desde acciones en la tabla de organizaciones.
- al abrir formulario de admin temporal se oculta el formulario de nueva instancia.
- boton `Actualizar lista` ubicado en la tarjeta `Organizaciones registradas`.
- encabezado superior de superadmin removido para maximizar espacio de trabajo.
- tabla de organizaciones con filtros por campo/tipo/anio/organizacion y scroll vertical.

Cupos por rol:

- `GET /v2/usuarios/cupos`
- `PUT /v2/usuarios/cupos`

## 8) Registro y analitica dinamica (F5)

Base frontend:

- `src/utils/metricasConfig.js`
- `src/hooks/useAsistencia.js`
- `src/validators/asistenciaValidator.js`

Comportamiento:

- formulario dinamico por metricas activas de setup,
- tabla de registros con detalle dinamico,
- estadisticas/comparaciones/presentaciones con `metricas_dinamicas`.

## 9) Hardening frontend (F7)

- banner UX para ADMIN temporal (5 dias),
- build validado,
- `react-doctor` en 99/100,
- checklist de salida frontend:
  - `.agents/react-doctor/CHECKLIST_SALIDA_PRODUCCION_F7_T03.md`

## 10) Seguridad y deuda conocida

Implementado:

- rate limit login (`429`)
- expiracion y limpieza de sesion
- scoping tenant en estado frontend
- setup guard visual en modulos operativos

Pendiente/mejorable:

- token en `localStorage` (riesgo XSS)
- optimizacion de chunk grande en build
- decision operativa final de cutover depende de owner/infra

## 11) Regla de mantenimiento

Actualizar este archivo cuando cambie:

- flujo auth/sesion,
- rutas protegidas o roles,
- endpoints consumidos por frontend,
- setup/cupos/dinamismo tenant-aware.
