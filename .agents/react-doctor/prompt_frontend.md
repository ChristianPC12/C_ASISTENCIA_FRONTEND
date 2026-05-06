# Prompt Operativo Frontend + Contrato Backend (Actualizado 2026-03-11)

## 1) Objetivo

Fuente de verdad tecnica del estado real frontend para etapa nacional multi-tenant.

## 1.1) Modo de trabajo obligatorio para nuevas solicitudes

- Fase 1 (discovery): leer agentes y devolver brief corto de alcance/riesgos/dependencias.
- Fase 2 (implementacion): solo iniciar cuando el owner lo indique explicitamente.
- Si no hay autorizacion explicita, no tocar codigo.

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
- `/campanas` `ADMIN/SECRETARIO/MINISTERIO_PERSONAL` + requiere setup completo
- `/estudios-biblicos` `ADMIN/MINISTERIO_PERSONAL/INSTRUCTOR_BIBLICO` + requiere setup completo

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

## 7) Superadmin consolidado y cupos (F6)

Superadmin:

- `GET /v2/superadmin/organizaciones`
- `POST /v2/superadmin/organizaciones`
- `PUT /v2/superadmin/organizaciones/{organizacion_id}` (incluye `activa` en edicion)
- `POST /v2/superadmin/organizaciones/{organizacion_id}/admin-temporal`
- `GET /v2/superadmin/campos`
- `POST /v2/superadmin/campos`
- `PUT /v2/superadmin/campos/{codigo}`
- `DELETE /v2/superadmin/campos/{codigo}`
- `GET /v2/superadmin/distritos`
- `POST /v2/superadmin/distritos`
- `PUT /v2/superadmin/distritos/{codigo}`
- `DELETE /v2/superadmin/distritos/{codigo}`

UX actual superadmin:

- nombre de organizacion/ADMIN temporal sin numeros y con rango de 5-30 caracteres.
- correo con validacion estricta en create/edit y maximo de 30 caracteres.
- `correo_destino` de admin temporal se autocompleta desde la organizacion seleccionada y queda bloqueado en UI.
- formulario de admin temporal se abre desde acciones en la tabla de organizaciones.
- solo una accion visible por vez (crear instancia, admin temporal, editar, gestionar campos, gestionar distritos).
- boton `Actualizar lista` ubicado en la tarjeta `Organizaciones registradas`.
- encabezado superior de superadmin removido para maximizar espacio de trabajo.
- tabla de organizaciones con filtros por campo/distrito/tipo/anio/estado y scroll vertical con encabezado fijo.
- exportacion de tabla a Excel (`.xlsx`) segun filtros aplicados.
- estados visuales de admin: activo (turquesa), expirado (amarillo), sin admin (rojo).
- detalle de admin/correo en acordeon por fila.

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
- `react-doctor` en 98/100 (sin bloqueos),
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

## 12) Modulos misioneros vigentes (actualizado 2026-05-06)

### Campanas

- Ruta frontend: `/campanas`.
- Archivo principal: `src/pages/CampanasPage.jsx`.
- Vista compartida de visitas: `src/components/campanas/VisitasGeneralView.jsx`.
- Responsive aprobado:
  - KPIs primero,
  - filtros en boton/modal,
  - tabla principal debajo.
- Contrato consumido principal:
  - `GET /campanas`
  - `GET /campanas/dashboard`
  - `GET /campanas/{id}`
  - `POST /campanas`
  - `PUT /campanas/{id}`
  - `DELETE /campanas/{id}`
  - `GET /campanas/visitas`
  - `POST /campanas/visitas`
  - `GET /campanas/visitas/similares`
  - `POST /campanas/{id}/sesiones`
  - `POST /campanas/sesiones/{id}/asistencia`

### Estudios Biblicos

- Ruta frontend: `/estudios-biblicos`.
- Archivo principal: `src/pages/EstudiosBiblicosPage.jsx`.
- Hook principal: `src/hooks/useEstudiosBiblicos.js`.
- Roles:
  - `MINISTERIO_PERSONAL` administra visitas, estudios, instructores y asignaciones.
  - `INSTRUCTOR_BIBLICO` entra solo al flujo `Registrar sesion`.
- Subvistas de owner/admin:
  - `Visitas`
  - `Estudios Biblicos`
  - `Instructores`
  - `Asignar estudio`
- Subvista instructor:
  - `Registrar sesion`
- Contrato consumido principal:
  - `GET /estudios-biblicos`
  - `GET /estudios-biblicos/dashboard`
  - `GET /estudios-biblicos/{id}`
  - `POST /estudios-biblicos`
  - `POST /estudios-biblicos/asignar`
  - `PUT /estudios-biblicos/{id}`
  - `POST /estudios-biblicos/{id}/estado`
  - `POST /estudios-biblicos/{id}/sesiones`
  - `POST /estudios-biblicos/{id}/decisiones`
  - `POST /estudios-biblicos/{id}/asignaciones`
  - `GET /estudios-biblicos/instructores`
  - `POST /estudios-biblicos/instructores`
  - `PUT /estudios-biblicos/instructores/{id}`

Reglas visuales que no se deben perder:

- Tablas con header sin card redundante cuando el modulo ya tiene contenedor padre.
- KPIs compactos y consistentes entre `Campanas`, `Visitas` y `Estudios Biblicos`.
- En telefono, liberar ancho de tabla moviendo filtros a boton/modal.
- No usar headers internos redundantes dentro de tablas cuando ya existe titulo de modulo.
- En `Registrar sesion`, los estados vacios deben llenar el alto disponible del card derecho.
