# Evidencia F3-T01 - Login con usuario + password (2026-03-09)

## Objetivo validado

Confirmar que el login frontend opera con el formato canonico `usuario + password` (sin pedir `codigo_instancia` al usuario final), delegando resolucion de tenant al backend autenticado.

## Evidencia de codigo

- `src/components/auth/LoginForm.jsx`
  - solo solicita campos `usuario` y `password`.
- `src/hooks/useAuth.jsx`
  - `iniciarSesion()` envia el payload sanitizado de login.
- `src/api/authApi.js`
  - login contra `POST /auth/login` con payload `{ usuario, password }`.

## Resultado funcional

- el acceso de usuarios finales se mantiene simple con credenciales estandar;
- la asociacion de tenant se resuelve internamente por backend y no por input manual en la pantalla de login.
