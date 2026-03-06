# Prompt Operativo Frontend + Contrato Backend (Mar 2026)

## 1) Objetivo

Este archivo es la fuente de verdad tecnica para entender el sistema completo desde el frontend:

- como esta construido
- como se autentica
- que endpoints consume
- que controles de seguridad existen
- que deudas tecnicas siguen abiertas

Usar este documento para onboarding, revisiones y cambios funcionales.

## 2) Mapa rapido del sistema

```text
React (Vite) -> Axios -> /api
                     |
                     v
           Proxy Vite (localhost)
                     |
                     v
PHP 8 index.php -> Routers -> Controllers -> Services -> DAOs -> MariaDB
```

Puntos clave:

- Frontend repo: `C_ASISTENCIA_FRONTEND`.
- Backend repo: `C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND`.
- BD: `iglesia_asistencia`.
- El nombre `BAKCEND` esta escrito asi en rutas y configuraciones actuales (no es typo accidental del documento).

## 3) Stack real (confirmado en codigo)

Frontend:

- `react` 19.2
- `react-dom` 19.2
- `react-router-dom` 7.6
- `axios` 1.13
- `bootstrap` 5.3
- `three` + `vanta` (fondo animado del login)
- `vite` 7.3

Backend:

- PHP 8 sin framework
- arquitectura por capas (Router -> Controller -> Service -> DAO)
- respuestas JSON uniformes: `{ exito, mensaje, datos? }`

## 4) Ejecucion local

Frontend:

```bash
npm install
npm run dev
```

Variable de entorno:

```env
VITE_API_BASE_URL=/api
```

Proxy de Vite (`vite.config.js`):

- recibe `/api/*`
- reescribe a `/C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND/*`

Backend (`Config/Global.php`):

- `BASE_PATH=/C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND`

Si cambia ese path, deben actualizarse frontend y backend en conjunto.

## 5) Arquitectura frontend

`src/config`:

- `api.js`: instancia Axios + interceptores + manejo global de 401.
- `constants.js`: roles, limites, anios, opciones de filtro y formularios iniciales.

`src/api`:

- capa de llamadas HTTP, sin estado UI.

`src/hooks`:

- `useAuth.jsx`: login/logout, estado auth, validacion de sesion.
- `useAsistencia.js`: formulario, filtros, CRUD, exportaciones.
- `useComparaciones.js`: doble consulta de estadisticas y calculos comparativos.
- `useUsuario.js`: CRUD de usuarios (admin).

`src/components`:

- UI modular (auth, asistencia, usuario, layout, ui).
- `ToastContainer` y `ConfirmModal` son infraestructura global de feedback.

`src/pages`:

- composicion por modulo/ruta.

## 6) Rutas activas y permisos

Rutas definidas en `src/App.jsx`:

- `/` -> login (cuando no autenticado)
- `/registro` -> protegido
- `/registros` -> protegido
- `/estadisticas` -> protegido
- `/comparaciones` -> protegido
- `/usuarios` -> protegido + solo `ADMIN`

Notas:

- `ProtectedRoute` valida existencia de token.
- `AppContent` decide layout publico/privado segun `estaAutenticado`.
- `src/pages/AsistenciaPage.jsx` existe pero no esta enrutada (legacy).

## 7) Flujo de autenticacion y sesion (frontend + backend)

Login:

1. `LoginForm` envia `{ usuario, password }` a `useAuth.iniciarSesion`.
2. `authValidator` valida entrada.
3. `authApi.login` llama `POST /auth/login`.
4. Si es exitoso:
   - guarda `token` y `usuario` en `localStorage`
   - actualiza contexto auth
   - muestra toast de exito
5. Si backend responde credenciales invalidas:
   - muestra error
   - limpia ambos campos del login

Verificacion de sesion:

- Al montar, si hay token pero no usuario en estado, `useAuth` llama `GET /auth/me`.

Logout:

- `POST /auth/logout` y limpieza local de sesion.

Manejo global de 401 (interceptor Axios):

- aplica a todas las peticiones excepto `/auth/login`
- limpia `localStorage` (`token`, `usuario`)
- guarda mensaje de redireccion en `sessionStorage` (`auth_redirect_message`)
- activa supresion de toasts de error en cascada
- redirige a `/`

Mensaje al volver al login:

- `LoginPage` lee `auth_redirect_message` y muestra toast informativo una sola vez.

Constantes de seguridad backend (`Config/Global.php`):

- `SESSION_IDLE_TIMEOUT_MINUTES = 15`
- `SESSION_MAX_DURATION_HOURS = 8`
- `PASSWORD_EXPIRY_DAYS = 30`
- `LOGIN_MAX_FAILED_ATTEMPTS = 5`
- `LOGIN_ATTEMPT_WINDOW_MINUTES = 15`
- `LOGIN_BLOCK_MINUTES = 15`

## 8) Contrato API consumido por frontend

Autenticacion:

- `POST /auth/login` (publico)
- `POST /auth/logout` (Bearer)
- `GET /auth/me` (Bearer)

Cultos:

- `GET /cultos` (Bearer)

Asistencia:

- `GET /asistencias` (Bearer; filtros: `culto`, `culto_id`, `anio`, `trimestre`, `mes`, `fecha_exacta`)
- `GET /asistencias/{id}` (Bearer)
- `POST /asistencias` (Bearer)
- `PUT /asistencias/{id}` (Bearer)
- `DELETE /asistencias/{id}` (Bearer)
- `GET /asistencias/estadisticas` (Bearer; requiere `anio` + `culto`)
- `GET /asistencias/{id}/exportar/excel` (Bearer; blob)
- `GET /asistencias/reportes/excel` (Bearer; blob)

Usuarios (solo ADMIN en backend):

- `GET /usuarios`
- `GET /usuarios/{id}`
- `POST /usuarios`
- `PUT /usuarios/{id}`
- `DELETE /usuarios/{id}` (soft delete)

Codigos HTTP relevantes:

- `200`, `201`, `204`
- `400`, `401`, `403`, `404`, `409`, `429`, `500`

Rate limit login:

- backend devuelve `429` con mensaje de bloqueo temporal.
- frontend muestra ese mensaje tal cual.

## 9) Modulos funcionales

Registro (`/registro`):

- formulario grande con secciones (culto, puntualidad, composicion, procedencia, visitas, permanencia, observaciones)
- total asistentes autocalculado (`antes + despues`)
- selector de fecha custom restringido por dia de culto
- bloquea fechas ya registradas para ese culto (excepto en edicion)

Registros (`/registros`):

- tabla expandible con detalle
- filtros por culto/anio/trimestre/mes/fecha exacta parcial o completa
- exportacion por registro e informe general a Excel

Estadisticas (`/estadisticas`):

- consume endpoint agregado
- resumen general + composicion + puntualidad + procedencia + visitas + serie por fecha

Comparaciones (`/comparaciones`):

- consulta dos periodos en paralelo (A y B)
- calcula diferencias y variaciones para indicadores clave

Usuarios (`/usuarios`):

- CRUD admin
- password fuerte en frontend y backend
- muestra expiracion de password y estado (`Vigente`, `Por vencer`, `Expirada`)
- al desactivar/reactivar, backend revoca sesiones segun reglas

## 10) Validaciones clave

Login:

- usuario requerido (3-50)
- password requerido

Usuario:

- nombre 3-120
- usuario 3-50 unico
- password fuerte 12-64, con mayuscula, minuscula, numero, especial, sin espacios

Asistencia:

- campos numericos no negativos
- `total_asistentes >= ninos + jovenes`
- `retiros + se_quedaron <= total_asistentes`
- fecha valida y coherente con dia del culto (validacion fuerte en backend)
- no duplicado por `(culto_id, fecha)` (backend + unique index)

## 11) Modelo de datos minimo para frontend

Tablas activas relevantes:

- `roles`
- `usuarios`
- `user_tokens`
- `login_intentos`
- `cultos`
- `asistencia_registro`

Sobre `user_tokens`:

- se usa y es critica para auth:
  - almacena hashes de tokens Bearer
  - controla expiracion por inactividad y duracion maxima
  - se limpia por logout, password vencido o desactivacion de usuario

Sobre nombres de tablas en plural:

- la base actual esta en plural por convencion historica.
- no renombrar sin plan de migracion integral (SQL, DAOs, queries, seeds, scripts y despliegue).

## 12) Seguridad actual: implementado vs pendiente

Implementado:

- autenticacion Bearer con token aleatorio de 32 bytes (hex) y hash SHA-256 en BD
- rate limit de login por usuario + IP con bloqueo temporal
- expiracion de sesion por inactividad y por tiempo maximo
- expiracion de password y desactivacion automatica
- revocacion de tokens ante desactivacion/cambio de password/logout
- control de rol ADMIN en backend para usuarios
- validaciones de entrada en frontend y backend

Pendiente o mejorable:

- CORS esta abierto (`*`) y debe cerrarse en produccion
- token en `localStorage` (riesgo XSS); considerar `HttpOnly` cookie + CSRF strategy
- falta auditoria formal de eventos sensibles (login fail, cambio de rol, etc.)
- no hay TLS enforcement en codigo (depende del despliegue web server)

## 13) Deuda tecnica identificada

- Mojibake en varios archivos (caracteres rotos por encoding).
- `Navbar.jsx` no se usa en la app actual.
- `AsistenciaPage.jsx` no esta en el router actual.
- Vistas SQL (`asistencia_sabado`, `asistencia_domingo`, `asistencia_miercoles`) no son usadas por DAOs actuales.

## 14) Checklist de actualizacion antes de cerrar cambios

1. Confirmar rutas en `src/App.jsx`.
2. Confirmar endpoints en `src/api/*` y routers backend.
3. Confirmar reglas auth en `src/config/api.js`, `useAuth.jsx`, `AuthService.php`, `AuthMiddleware.php`.
4. Confirmar limites de seguridad en `Config/Global.php`.
5. Confirmar validaciones en `src/validators/*` y `Validator/*.php`.
6. Revisar si hay archivos legacy nuevos y documentarlos.
7. Correr `react-doctor` cuando el cambio toque React.

## 15) Regla para mantener este documento vivo

Actualizar este archivo cada vez que cambie:

- flujo de login/sesion
- seguridad (rate limit, expiracion, roles)
- contrato de endpoints
- estructura principal de modulos/rutas
- convenciones de datos que impacten frontend
