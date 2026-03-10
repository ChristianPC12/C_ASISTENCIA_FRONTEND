# Evidencia F2-T04 - UI editar organizacion (2026-03-09)

## Objetivo validado

Implementar en frontend la edicion de organizacion desde superadmin, incluyendo el cambio de tipo (`GRUPO` <-> `IGLESIA`) sobre la misma cuenta.

## Archivos modificados

- `src/hooks/useSuperadminOrganizaciones.js`
- `src/pages/SuperadminPage.jsx`
- `src/api/superadminApi.js` (endpoint `actualizarOrganizacion`)

## Contrato API consumido

- `PUT /v2/superadmin/organizaciones/{organizacion_id}`

## Validaciones de UI implementadas

- tipo de organizacion obligatorio,
- nombre de organizacion entre 3 y 160 caracteres,
- correo de contacto opcional con formato valido.

## Validaciones ejecutadas

- `npm run build` -> OK
- `npx -y react-doctor@latest . --verbose --diff` -> `100/100`, sin issues

## Resultado funcional

- superadmin puede editar tipo/nombre/correo de una organizacion existente.
- la misma instancia se mantiene (misma cuenta, sin duplicar tenant) al cambiar de `GRUPO` a `IGLESIA`.
