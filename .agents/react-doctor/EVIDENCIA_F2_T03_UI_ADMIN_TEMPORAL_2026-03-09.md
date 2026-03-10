# Evidencia F2-T03 - UI crear ADMIN temporal (2026-03-09)

## Objetivo validado

Implementar en frontend el flujo para crear ADMIN temporal desde superadmin:

- seleccion de organizacion,
- nombre completo y usuario del admin temporal,
- correo destino opcional + bandera de envio de correo,
- visualizacion de respuesta (usuario, password temporal, expiracion y estado de correo).

## Archivos modificados

- `src/hooks/useSuperadminOrganizaciones.js`
- `src/pages/SuperadminPage.jsx`
- `src/api/superadminApi.js` (endpoint `crearAdminTemporal`)

## Contrato API consumido

- `POST /v2/superadmin/organizaciones/{organizacion_id}/admin-temporal`

## Validaciones de UI implementadas

- organizacion obligatoria,
- nombre completo entre 3 y 120 caracteres,
- usuario entre 3 y 50 con caracteres permitidos (`a-z`, `0-9`, `.`, `_`, `-`),
- correo destino opcional con formato valido.

## Validaciones ejecutadas

- `npm run build` -> OK
- `npx -y react-doctor@latest . --verbose --diff` -> `100/100`, sin issues

## Resultado funcional

- SUPERADMIN puede crear ADMIN temporal desde la UI.
- el frontend muestra las credenciales temporales y el estado del envio de correo reportado por backend.
