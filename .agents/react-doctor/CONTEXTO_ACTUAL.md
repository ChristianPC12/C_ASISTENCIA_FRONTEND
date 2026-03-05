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

