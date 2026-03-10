# Evidencia F7-T01/F7-T02/F7-T03 - Hardening frontend y checklist de salida (2026-03-10)

## Objetivo validado

Completar hardening UX/seguridad en frontend para etapa nacional y cerrar checklist tecnico de salida en preproduccion.

## Cobertura de tickets

- F7-T01:
  - UX de ADMIN temporal (vigencia 5 dias) en sidebar y superadmin.
- F7-T02:
  - Validaciones de regresion y seguridad frontend (401/403/429).
- F7-T03:
  - Checklist formal de salida frontend.

## Archivos implementados/modificados

- `src/hooks/useAuth.jsx`
  - `esAdminTemporal`, `diasRestantesPassword`.
- `src/components/layout/Sidebar.jsx`
  - Banner de cuenta temporal con dias restantes.
- `src/pages/SuperadminPage.jsx`
  - Mensaje de vigencia de 5 dias al crear ADMIN temporal.
- `src/config/api.js`
  - Interceptor 401 robusto + evento `setup:required` para 403 setup.
- `.agents/react-doctor/CHECKLIST_SALIDA_PRODUCCION_F7_T03.md`
  - Checklist final frontend.

## Validaciones ejecutadas

- Frontend:
  - `npm run build` -> OK.
  - `npx -y react-doctor@latest . --verbose --diff` -> 100/100.
- API runtime (backend consumido por frontend):
  - `GET /auth/me` sin token -> `401` (`Token de autenticacion requerido.`).
  - `POST /auth/login` con intentos invalidos repetidos -> `429` en intento 5+.
- Dependencia 403 setup:
  - contrato/backend ya devuelve `SETUP_REQUIRED` y frontend lo interpreta con bloqueo visual.

## Evidencia complementaria

- `EVIDENCIA_F4_T01_T02_T03_SETUP_INICIAL_2026-03-10.md`
- `EVIDENCIA_F5_T01_T02_T03_T04_DINAMICO_2026-03-10.md`
- `EVIDENCIA_F6_T01_T02_CUPOS_UI_2026-03-10.md`

## Resultado funcional

Frontend queda endurecido para preproduccion nacional: sesion robusta, feedback claro ante errores de seguridad y checklist de salida formalmente cerrado en capa UI.

