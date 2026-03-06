# Contexto Actual (2026-03-06)

## Estado general

- Frontend: React 19 + Vite 7 + Bootstrap 5.
- Backend: PHP 8 sin framework (`C_ASISTENCIA_BACKEND/C_ASISTENCIA_BAKCEND`).
- BD: MariaDB/MySQL (`iglesia_asistencia`).
- Layout principal: sidebar responsive + topbar; login con fondo Vanta (three + vanta).

## Modulos y rutas activas

- `/registro`: formulario de nuevo registro de asistencia.
- `/registros`: tabla de registros, filtros, exportacion Excel.
- `/estadisticas`: KPIs y resumen por periodo.
- `/comparaciones`: comparacion mensual A vs B.
- `/usuarios`: solo ADMIN.

## Seguridad y sesion vigentes

- Token Bearer obligatorio para todo excepto `POST /auth/login`.
- Rate limit login por usuario + IP:
  - maximo 5 intentos fallidos
  - ventana de 15 minutos
  - bloqueo de 15 minutos
- Expiracion de sesion:
  - inactividad: 15 minutos
  - duracion maxima: 8 horas
- Expiracion de password:
  - 30 dias
  - si vence, el usuario se desactiva y se revocan tokens
- En frontend, el interceptor de Axios:
  - captura 401 (excepto login)
  - limpia sesion local
  - evita cascada de toasts de error
  - redirige a login mostrando un mensaje claro de expiracion

## Cambios recientes relevantes

- Login:
  - limpieza de usuario/password cuando backend responde "Credenciales invalidas".
  - footer actualizado con `&copy;` y texto con tildes correctas.
- Sesion:
  - ajuste para no "expulsar" inmediatamente tras login al verificar `me()`.
  - mensaje explicito al volver al login por sesion expirada.
- Registros:
  - filtros por `anio`, `trimestre`, `mes`, `fecha_exacta`.
  - exportacion por registro e informe general solo en Excel.
- Usuarios:
  - password fuerte (12-64, mayuscula, minuscula, numero, especial).
  - columna de expiracion (`Vigente`, `Por vencer`, `Expirada`).

## Deuda tecnica y riesgos conocidos

- Hay texto con mojibake en varios archivos legacy (`Ã`, `â`), por mezcla de encodings.
- `src/pages/AsistenciaPage.jsx` existe pero no esta enrutada.
- `src/components/layout/Navbar.jsx` existe pero no se usa (layout actual usa `Sidebar`).
- CORS backend en `*`; recomendado restringir origen en produccion.
- Token en `localStorage` (riesgo ante XSS). Recomendado migrar a cookie `HttpOnly` si cambia arquitectura auth.

## Archivos clave para ubicacion rapida

- Frontend auth/sesion:
  - `src/hooks/useAuth.jsx`
  - `src/config/api.js`
  - `src/pages/LoginPage.jsx`
- Frontend rutas/layout:
  - `src/App.jsx`
  - `src/components/layout/Sidebar.jsx`
- Frontend modulos:
  - `src/hooks/useAsistencia.js`
  - `src/hooks/useComparaciones.js`
  - `src/hooks/useUsuario.js`
- Backend auth/seguridad:
  - `Config/Global.php`
  - `Services/AuthService.php`
  - `Middleware/AuthMiddleware.php`
  - `Modelo/Seguridad/LoginIntentoDAO.php`
  - `Modelo/Token/TokenDAO.php`
