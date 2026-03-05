# Contexto Actual (Mar 2026)

## Estado general

- Stack frontend: React 19 + Vite + Bootstrap 5.
- Stack backend: PHP 8 puro (sin framework), rutas REST y autenticacion por token.
- Paleta visual vigente: tema IASD (`src/styles/iasd-theme.css`).

## Modulos activos

- Nuevo Registro (`/registro`)
- Ver Registros (`/registros`)
- Estadisticas (`/estadisticas`)  **nuevo**
- Usuarios (`/usuarios`, solo ADMIN)

## Cambios recientes importantes

### UI/Responsive (ajuste fino, Mar 2026)

- Login:
  - se removio el bloqueo de scroll global en `body` para evitar cortes en zoom/viewport bajo
  - la card ajusta mejor por altura sin romper el diseno visual
  - inputs del login en `font-size: 1rem` para evitar auto-zoom agresivo en iOS
- Sidebar/layout:
  - se reforzo el ancho de contenido con `width/max-width: calc(100% - 260px)` para que no se desplace al aumentar zoom en desktop
  - boton `Cerrar sesion` con mejor estabilidad en mobile/safe-area
- Ver Registros:
  - scroll horizontal mobile mas usable y separado del vertical (`tabla-registros-scroll` + `tabla-registros-scroll-x`)
  - recuperado el scroll vertical dentro de la tabla sin perder el horizontal
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

### Estadisticas (nuevo modulo)

- Endpoint backend nuevo: `GET /asistencias/estadisticas`
- Filtros del modulo:
  - `anio` obligatorio
  - `culto` obligatorio
  - `trimestre` opcional
  - `mes` opcional
  - regla: mes y trimestre no se combinan; si hay mes, tiene prioridad
- Datos que retorna:
  - resumen general: total registros, total asistentes, promedio, maximo, minimo
  - composicion: ninos/jovenes (cantidad y porcentaje)
  - puntualidad: antes/despues (cantidad y porcentaje)
  - procedencia: barrio/guayabo (cantidad y porcentaje)
  - visitas: total, barrio/guayabo, top nombres mas repetidos
  - serie: asistencia por fecha
  - resumen textual condensado

## Archivos clave (estadisticas)

### Frontend

- `src/pages/EstadisticasPage.jsx`
- `src/api/asistenciaApi.js` (`obtenerEstadisticas`)
- `src/App.jsx` (ruta `/estadisticas`)
- `src/components/layout/Sidebar.jsx` (acceso en menu)
- `src/styles/iasd-theme.css` (estilos del modulo)

### Backend

- `Services/AsistenciaService.php` (`obtenerEstadisticas`)
- `Controller/AsistenciaController.php` (`estadisticas`)
- `Router/AsistenciaRoutes.php` (ruta `/asistencias/estadisticas`)

## Convenciones vigentes

- Mantener separacion backend/frontend estricta.
- Evitar mezclar logica de negocio pesada en UI.
- Para cambios React relevantes, correr:

```bash
npx -y react-doctor@latest . --verbose --diff
```
