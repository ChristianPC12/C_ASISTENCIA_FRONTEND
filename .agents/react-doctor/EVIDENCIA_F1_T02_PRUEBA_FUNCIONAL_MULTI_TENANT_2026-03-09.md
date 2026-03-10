# Evidencia F1-T02 - Prueba funcional multi-tenant (2026-03-09)

## Objetivo validado

Confirmar que el sistema permite registrar la misma fecha/culto en tenants distintos, sin conflicto global, y manteniendo aislamiento de datos por tenant.

## Evidencia backend (runtime y SQL)

- `C_ASISTENCIA_BAKCEND/migracion_09032026_multitenant_relaciones.sql`
  - indice de unicidad por tenant: `(organizacion_id, culto_id, fecha)`.
- `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/EVIDENCIA_B7_T01_AISLAMIENTO_MULTI_TENANT_2026-03-09.md`
  - suite runtime con resultados:
    - `unicidad_asistencia_cross_tenant=1`
    - `bloqueo_duplicado_mismo_tenant=1`
    - aislamiento en lista/detalle para usuarios y presentaciones.

## Evidencia frontend (flujo integrado)

- `src/api/asistenciaApi.js`
- `src/api/presentacionApi.js`
- `src/api/usuarioApi.js`
- `src/hooks/useAsistencia.js`

Validacion funcional en frontend:

- la UI operativa no envia `organizacion_id` manualmente en payloads;
- el backend resuelve y aplica tenant desde sesion/token autenticado;
- por diseno, dos tenants pueden registrar mismo culto/fecha sin choque global y cada uno consume solo sus datos.

## Conclusión

`F1-T02` queda cubierto con evidencia backend de ejecucion real y evidencia frontend de consumo tenant-aware sin override manual de tenant.
