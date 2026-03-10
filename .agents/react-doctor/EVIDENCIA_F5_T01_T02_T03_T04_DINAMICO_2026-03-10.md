# Evidencia F5-T01/F5-T02/F5-T03/F5-T04 - Registro y analitica dinamica (2026-03-10)

## Objetivo validado

Migrar frontend operativo a modelo dinamico por tenant para formulario de registro, tabla de registros, estadisticas, comparaciones y presentaciones.

## Archivos implementados/modificados

- `src/utils/metricasConfig.js`
  - Normalizacion de metricas activas, secciones, etiquetas, payload dinamico y validacion de dependencias.
- `src/validators/asistenciaValidator.js`
  - Validacion dinamica por metrica activa/obligatoria + reglas de consistencia.
- `src/hooks/useAsistencia.js`
  - Formulario dinamico `metricas`, armado de payload tenant-aware, filtros y exportaciones.
- `src/components/asistencia/AsistenciaForm.jsx`
  - Render dinamico por secciones de metricas configuradas.
- `src/components/asistencia/AsistenciaTable.jsx`
  - Resumen y detalle dinamico por metrica en registros.
- `src/pages/RegistroPage.jsx`
  - Conecta `metricasActivas` al formulario.
- `src/pages/RegistrosPage.jsx`
  - Conecta `mapaEtiquetasMetricas` y flujo dinamico de tabla/exportes.
- `src/pages/EstadisticasPage.jsx`
  - Bloque dinamico `metricas_dinamicas` con etiquetas tenant-aware.
- `src/hooks/useComparaciones.js`
  - Indicadores dinamicos comparando periodos A/B.
- `src/pages/PresentacionesPage.jsx`
  - Visualizacion dinamica de metricas en detalle de presentacion.

## Reglas funcionales verificadas

- Formularios usan solo metricas activas del setup del tenant.
- Procedencias/visitas se reflejan segun configuracion del tenant.
- Reportes y comparaciones incluyen bloque `metricas_dinamicas`.
- Presentaciones muestran metricas dinamicas sin hardcode legacy.

## Validaciones ejecutadas

- `npm run build` -> OK.
- `npx -y react-doctor@latest . --verbose --diff` -> 100/100.

## Resultado funcional

Cada organizacion opera con su propia configuracion de metricas/procedencias y ve analitica coherente con su setup local, sin depender de campos fijos globales.

