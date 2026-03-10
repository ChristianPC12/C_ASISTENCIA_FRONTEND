# Evidencia F6-T01/F6-T02 - Cupos por rol y UX de excedentes (2026-03-10)

## Objetivo validado

Implementar en frontend la gestion de cupos por rol por tenant y mensajes UX claros cuando una accion excede cupos.

## Archivos implementados/modificados

- `src/api/usuarioApi.js`
  - Nuevos endpoints v2: `GET /v2/usuarios/cupos` y `PUT /v2/usuarios/cupos`.
- `src/hooks/useUsuario.js`
  - Carga/edicion de politicas de cupo por rol.
  - Manejo de errores de cupo (`CUPOS_EXCEEDED` o mensaje con "cupo").
- `src/components/usuario/UsuarioCuposCard.jsx`
  - Tarjeta UI para ver consumo actual, cupo maximo y estado activo por rol.
- `src/pages/UsuarioPage.jsx`
  - Integracion de tarjeta de cupos dentro del modulo usuarios.
- `src/components/usuario/UsuarioForm.jsx`
  - Contexto visual de cupo disponible para el rol seleccionado.

## Reglas funcionales verificadas

- El ADMIN ve consumo y disponibilidad por rol en su tenant.
- Se pueden ajustar cupos y activar/desactivar politica por rol desde UI.
- Al exceder cupo, el usuario recibe mensaje claro de bloqueo por politica.

## Validaciones ejecutadas

- `npm run build` -> OK.
- `npx -y react-doctor@latest . --verbose --diff` -> 100/100.

## Resultado funcional

El modulo de usuarios queda alineado con enforcement backend de cupos, reduciendo altas invalidas y mejorando la explicacion de rechazo al usuario ADMIN.

