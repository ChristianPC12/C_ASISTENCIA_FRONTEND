# React Doctor - Agent Guide

Este paquete de agentes documenta el sistema C_ASISTENCIA para que el contexto tecnico se entienda rapido y sin ambiguedad.

## Objetivo

- Acelerar onboarding tecnico del sistema.
- Mantener una fuente de verdad unica para frontend + contrato backend consumido.
- Ejecutar revisiones React consistentes despues de cambios UI/logica.

## Orden de lectura recomendado

1. `CONTEXTO_ACTUAL.md` (snapshot corto)
2. `ROADMAP_ESCALABILIDAD_NACIONAL.md` (ruta por fases para multiiglesia/multigrupo)
3. `prompt_frontend.md` (documentacion completa)
4. `SKILL.md` (uso operativo de react-doctor)

## Regla de activacion para escalabilidad

Si la solicitud menciona alguno de estos temas, leer siempre el roadmap antes de proponer cambios:

- escalabilidad nacional
- multiiglesia / multigrupo
- superadmin
- aislamiento de datos por iglesia
- configuracion inicial por instancia
- cuotas de usuarios por rol
- nuevos modulos nacionales (campanas, pequenas congregaciones, estudios biblicos)

## Uso de react-doctor

```bash
npx -y react-doctor@latest . --verbose --diff
```

Ejecutar cuando se modifique JSX, hooks, rutas, formularios, estado o estilos que afecten renderizado/comportamiento.

## Regla de mantenimiento de estos agentes

Actualizar `CONTEXTO_ACTUAL.md`, `ROADMAP_ESCALABILIDAD_NACIONAL.md` y `prompt_frontend.md` si cambia cualquiera de estos puntos:

- rutas en `src/App.jsx`
- autenticacion/sesion (`src/hooks/useAuth.jsx`, `src/config/api.js`, backend auth)
- endpoints en `src/api/*` o routers backend
- validaciones (`src/validators/*`, backend validators)
- configuracion de seguridad (rate limit, expiracion, roles, CORS)
- estructura de datos en BD relevante para frontend
- prioridades/fases de ejecucion del plan de escalabilidad

## Criterio de calidad documental

Antes de dar por terminada una actualizacion de agentes, validar:

- no hay contradicciones entre frontend y backend
- el flujo de login/logout/expiracion de sesion esta descrito tal como ocurre
- se incluyen controles de seguridad activos y brechas pendientes
- se anotan deudas tecnicas reales (por ejemplo, archivos legacy sin uso)
- el estado de cada fase del roadmap coincide con el estado real del codigo
