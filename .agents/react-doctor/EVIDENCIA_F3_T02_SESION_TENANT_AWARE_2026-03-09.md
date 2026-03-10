# Evidencia F3-T02 - Sesion tenant-aware en useAuth e interceptor (2026-03-09)

## Objetivo validado

Persistir y gestionar en frontend el contexto de tenant/sesion proveniente de auth backend para evitar ambiguedad de instancia.

## Archivos modificados

- `src/hooks/useAuth.jsx`
  - guarda `tenant` y `session` desde `login`,
  - hidrata `tenant` desde `me`,
  - expone `tenant` y `session` en contexto auth,
  - limpia `token`, `usuario`, `tenant`, `session` al cerrar sesion.
- `src/config/api.js`
  - interceptor 401 limpia tambien `tenant` y `session` en `localStorage`.

## Validaciones ejecutadas

- `npm run build` -> OK
- `npx -y react-doctor@latest . --verbose --diff` -> `100/100`, sin issues

## Resultado funcional

- la sesion frontend queda ligada al tenant autenticado,
- al expirar/invalidar sesion se limpia completamente el contexto tenant-aware,
- se reduce riesgo de cruces de contexto en UI entre instancias.
