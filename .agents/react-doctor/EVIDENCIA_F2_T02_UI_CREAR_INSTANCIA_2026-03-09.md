# Evidencia F2-T02 - UI crear instancia superadmin (2026-03-09)

## Objetivo validado

Implementar en frontend la pantalla de superadmin para:

- crear una instancia (`campo`, `tipo_organizacion`, `nombre_organizacion`, `correo_contacto` opcional),
- listar organizaciones existentes desde API v2.

## Archivos modificados

- `src/api/superadminApi.js`
- `src/hooks/useSuperadminOrganizaciones.js`
- `src/pages/SuperadminPage.jsx`

## Contrato API consumido

- `GET /v2/superadmin/organizaciones`
- `POST /v2/superadmin/organizaciones`

## Validaciones de UI implementadas

- campo obligatorio,
- tipo de organizacion obligatorio (`IGLESIA`/`GRUPO`),
- nombre entre 3 y 160 caracteres,
- correo opcional con formato valido.

## Validaciones ejecutadas

- `npm run build` -> OK
- `npx -y react-doctor@latest . --verbose --diff` -> `100/100`, sin issues

## Resultado funcional

- SUPERADMIN puede crear nuevas organizaciones desde frontend.
- la tabla muestra codigo, campo, tipo, nombre, correo y estado de organizaciones.
