# Evidencia F2-T01 - Acceso y ruta protegida SUPERADMIN (2026-03-09)

## Objetivo validado

Implementar en frontend el acceso segregado por rol:

- `SUPERADMIN` solo entra a modulo superadmin.
- roles operativos no entran a `/superadmin`.

## Archivos modificados

- `src/config/constants.js` (rol `SUPERADMIN` en constantes)
- `src/hooks/useAuth.jsx` (`esSuperadmin` en estado de sesion)
- `src/components/layout/ProtectedRoute.jsx` (control de acceso por `rolesPermitidos`)
- `src/components/layout/Sidebar.jsx` (menu diferenciado por rol)
- `src/App.jsx` (ruta `/superadmin`, redirecciones por rol, bloqueo de modulos operativos para `SUPERADMIN`)
- `src/pages/SuperadminPage.jsx` (pantalla base del modulo)

## Validaciones ejecutadas

- `npm run build` -> OK
- `npx -y react-doctor@latest . --verbose --diff` -> `100/100`, sin issues

## Resultado funcional

- `SUPERADMIN` entra a `/superadmin` y no puede navegar a rutas operativas.
- `ADMIN` y `SECRETARIO` mantienen acceso a rutas operativas.
- `ADMIN` no puede consumir ruta frontend `/superadmin` (redireccionado a `/registro`).
