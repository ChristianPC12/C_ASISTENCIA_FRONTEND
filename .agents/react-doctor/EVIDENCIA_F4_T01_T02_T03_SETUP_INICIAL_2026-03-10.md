# Evidencia F4-T01/F4-T02/F4-T03 - Setup inicial y bloqueo operativo (2026-03-10)

## Objetivo validado

Implementar en frontend el modulo de configuracion inicial por instancia, con bloqueo visual de modulos operativos hasta completar setup y validacion UI de dependencias criticas.

## Archivos implementados/modificados

- `src/api/setupApi.js`
  - Cliente API v2 de setup (`estado`, `cultos`, `metricas`, `procedencias`, `finalizar`).
- `src/hooks/useSetupStatus.jsx`
  - Estado global setup por tenant (`desconocido/pendiente/completo`), cache local por `organizacion_id`, recarga y evento `setup:required`.
- `src/hooks/useSetupAdministrador.js`
  - Logica del modulo Administrador: edicion/guardado de cultos, metricas, procedencias y finalizacion.
- `src/pages/AdministradorPage.jsx`
  - UI completa de setup inicial para rol `ADMIN`.
- `src/components/setup/SetupBlockedNotice.jsx`
  - Aviso de bloqueo con faltantes y acceso directo a `/administrador`.
- `src/components/layout/ProtectedRoute.jsx`
  - Soporte `requiereSetupInicial` y render de bloqueo por setup pendiente.
- `src/App.jsx`
  - Nueva ruta protegida `/administrador` y guards de setup en rutas operativas.
- `src/config/api.js`
  - Interceptor `403 SETUP_REQUIRED` -> emite evento global `setup:required`.
- `src/components/layout/Sidebar.jsx`
  - Badge visible de setup pendiente en navegacion.

## Reglas funcionales verificadas

- Solo `ADMIN` puede abrir `/administrador`.
- `registro/registros/estadisticas/comparaciones/presentaciones/usuarios` quedan bloqueados mientras setup este pendiente.
- Regla de puntualidad en UI: `llegaron_antes_hora` y `llegaron_despues_hora` se mantienen "ambos o ninguno" (habilitado y obligatorio).

## Validaciones ejecutadas

- `npm run build` -> OK.
- `npx -y react-doctor@latest . --verbose --diff` -> 100/100.

## Resultado funcional

El tenant queda forzado a completar setup inicial desde `Administrador` antes de operar modulos de asistencia, estadistica, presentaciones y usuarios.

