# Contexto Actual (Mar 2026)

## Estado general

- Stack frontend: React 19 + Vite + Bootstrap 5.
- Stack backend: PHP 8 puro (sin framework), rutas REST y autenticacion por token.
- Paleta visual vigente: tema IASD (`src/styles/iasd-theme.css`).
- El layout principal usa sidebar fijo desktop + hamburguesa en mobile.

## Modulos activos

- Nuevo Registro (`/registro`)
- Ver Registros (`/registros`)
- Estadisticas (`/estadisticas`)
- Comparaciones (`/comparaciones`) **nuevo**
- Usuarios (`/usuarios`, solo ADMIN)

## Cambios recientes importantes

### UI/Responsive (ajuste fino, Mar 2026)

- Login:
  - se removio el bloqueo de scroll global en `body` para evitar cortes en zoom/viewport bajo
  - la card ajusta mejor por altura sin romper el diseno visual
  - inputs del login en `font-size: 1rem` para evitar auto-zoom agresivo en iOS
- Sidebar/layout:
  - en desktop se usa `width/max-width: calc(100% - 260px)` para estabilidad en zoom
  - en mobile (`<= 991.98px`) se resetea a `width: 100%` y `max-width: 100%`
  - boton `Cerrar sesion` con mejor estabilidad en mobile/safe-area
- Tablas:
  - se restauro comportamiento responsive de Bootstrap en `.table-responsive` (`overflow-x: auto`)
  - en `Ver Registros` el scroll horizontal y vertical estan separados (`tabla-registros-scroll` + `tabla-registros-scroll-x`)
- Estadisticas:
  - bloque de serie (`estad-serie`) anclado visualmente al fondo del card de tendencia
  - scrollbar horizontal de la serie oculto visualmente, manteniendo scroll funcional

### Registros

- Filtro de fecha en `Ver Registros` mejorado:
  - acepta `dd/mm/yyyy` y `d/m/yyyy`
  - filtra progresivamente por coincidencia
- Exportacion:
  - solo Excel (PDF removido)
  - botones de acciones con iconos

### Comparaciones (nuevo modulo frontend)

- Ruta nueva: `/comparaciones`.
- Permite comparar dos periodos `mes/anio` (A vs B) para un mismo culto.
- Reutiliza `GET /asistencias/estadisticas` con dos llamadas en paralelo.
- Presenta:
  - resumen por periodo (total asistentes, promedio, total cultos, visitas)
  - tabla de indicadores con diferencia absoluta y variacion porcentual
  - top comparado de nombres de visitas
- UI del modulo:
  - tablas con header en color neutro (no azul IASD)
  - wrappers de tabla sin bordes redondeados para evitar esquinas blancas

### Seguridad de usuarios (password expiry)

- Backend ahora maneja expiracion de password como campo persistente:
  - `password_actualizada_en`
  - `password_expira_en`
- Se calcula en creacion de usuario y cambio de password.
- Existe migracion aplicada: `migracion_06032026_password_expira_en.sql`.
- Frontend (`Usuarios`) muestra columna `Expira contrasena` con:
  - fecha de expiracion
  - estado visual: `Vigente`, `Por vencer`, `Expirada`

## Archivos clave recientes

### Frontend

- `src/pages/ComparacionesPage.jsx`
- `src/hooks/useComparaciones.js`
- `src/components/usuario/UsuarioTable.jsx`
- `src/App.jsx` (ruta `/comparaciones`)
- `src/components/layout/Sidebar.jsx` (enlace `Comparaciones`)
- `src/styles/iasd-theme.css`

### Backend

- `Services/AuthService.php`
- `Modelo/Usuario/UsuarioDAO.php`
- `Modelo/Usuario/UsuarioMapper.php`
- `Modelo/Usuario/UsuarioDTO.php`
- `iglesia_asistencia.sql`
- `migracion_06032026_password_expira_en.sql`

## Convenciones vigentes

- Mantener separacion backend/frontend estricta.
- Evitar mezclar logica de negocio pesada en UI.
- Para cambios React relevantes, correr:

```bash
npx -y react-doctor@latest . --verbose --diff
```
