# Tickets de Escalabilidad Nacional (Frontend + Integracion)

Fecha base: 2026-03-09  
Ultima actualizacion: 2026-03-10  
Estado global: F0..F7 cerradas en frontend, F8 pendiente (discovery futuro)

## Convenciones

- `[ ]` pendiente
- `[~]` en progreso
- `[x]` completado

Reglas:

- Solo un ticket en `[~]` por fase.
- Cada ticket cerrado debe incluir fecha y evidencia.
- Si cambia contrato/API/modelo, sincronizar agentes backend.
- Ningun ticket pasa a `[x]` sin aprobacion del owner funcional.

## Tablero rapido

| ID | Fase | Pri | Estado | Resumen | Dependencia |
|---|---|---|---|---|---|
| F0-T01 | F0 | P0 | [x] | Definir identidad tenant y login canonico | - |
| F0-T02 | F0 | P0 | [x] | Definir contrato API v2 para auth/superadmin/setup | F0-T01 |
| F0-T03 | F0 | P0 | [x] | Definir arranque limpio preproduccion, rollback y auditoria minima | F0-T02 |
| F1-T01 | F1 | P0 | [x] | Confirmar scoping tenant en lecturas/escrituras UI | F0-T03 |
| F1-T02 | F1 | P0 | [x] | Prueba funcional: misma fecha/culto en 2 tenants | F1-T01 |
| F2-T01 | F2 | P0 | [x] | Crear acceso/ruta protegida para SUPERADMIN | F1-T02 |
| F2-T02 | F2 | P0 | [x] | UI crear instancia (campo, tipo, nombre, correo opcional) | F2-T01 |
| F2-T03 | F2 | P0 | [x] | UI crear ADMIN temporal y flujo de envio correo opcional | F2-T02 |
| F2-T04 | F2 | P0 | [x] | UI editar organizacion (incluye GRUPO -> IGLESIA) | F2-T03 |
| F3-T01 | F3 | P0 | [x] | Login con `usuario + password` (tenant resuelto internamente) | F2-T04 |
| F3-T02 | F3 | P0 | [x] | Estado de sesion tenant-aware en `useAuth` e interceptor | F3-T01 |
| F4-T01 | F4 | P0 | [x] | Nuevo modulo `Administrador` para setup inicial | F3-T02 |
| F4-T02 | F4 | P0 | [x] | Bloqueo visual de modulos hasta setup completo | F4-T01 |
| F4-T03 | F4 | P0 | [x] | Reglas UI de dependencias de campos (ambos o ninguno) | F4-T01 |
| F5-T01 | F5 | P1 | [x] | Formulario de registro dinamico por tenant | F4-T03 |
| F5-T02 | F5 | P1 | [x] | Procedencias dinamicas (1..10) y visitas coherentes | F5-T01 |
| F5-T03 | F5 | P1 | [x] | Registros/estadisticas/comparaciones dinamicas | F5-T02 |
| F5-T04 | F5 | P1 | [x] | Presentaciones y exportaciones dinamicas | F5-T03 |
| F6-T01 | F6 | P1 | [x] | UI de cupos por rol y consumo actual | F5-T04 |
| F6-T02 | F6 | P1 | [x] | Mensajes UX al exceder cupos | F6-T01 |
| F7-T01 | F7 | P0 | [x] | Flujo UX de ADMIN temporal (vence en 5 dias) | F6-T02 |
| F7-T02 | F7 | P0 | [x] | QA regresion + seguridad frontend (401/403/429) | F7-T01 |
| F7-T03 | F7 | P0 | [x] | Checklist de salida a produccion nacional | F7-T02 |
| F8-T01 | F8 | P2 | [ ] | Discovery UX para modulo Campanas | F7-T03 |
| F8-T02 | F8 | P2 | [ ] | Discovery UX para Pequenas Congregaciones | F8-T01 |
| F8-T03 | F8 | P2 | [ ] | Discovery UX para Estudios Biblicos | F8-T02 |

## Cierres historicos (2026-03-09)

- F0-T01/F0-T02/F0-T03: decisiones base aprobadas.
  - Evidencias:
    - `.agents/react-doctor/DECISIONES_F0_B0_T01_IDENTIDAD_LOGIN.md`
    - `.agents/react-doctor/DECISIONES_F0_B0_T02_VERSIONADO_Y_ERRORES_API.md`
    - `.agents/react-doctor/DECISIONES_F0_B0_T03_MIGRACION_Y_ROLLBACK.md`
- F1-T01/F1-T02: scoping tenant UI + prueba funcional de aislamiento.
  - Evidencias:
    - `.agents/react-doctor/DECISIONES_F1_B1_T01_SCOPING_UI.md`
    - `.agents/react-doctor/EVIDENCIA_F1_T02_PRUEBA_FUNCIONAL_MULTI_TENANT_2026-03-09.md`
- F2-T01..F2-T04: modulo superadmin UI (ruta, alta, admin temporal, edicion organizacion).
  - Evidencias:
    - `.agents/react-doctor/EVIDENCIA_F2_T01_ACCESO_SUPERADMIN_2026-03-09.md`
    - `.agents/react-doctor/EVIDENCIA_F2_T02_UI_CREAR_INSTANCIA_2026-03-09.md`
    - `.agents/react-doctor/EVIDENCIA_F2_T03_UI_ADMIN_TEMPORAL_2026-03-09.md`
    - `.agents/react-doctor/EVIDENCIA_F2_T04_UI_EDITAR_ORGANIZACION_2026-03-09.md`
- F3-T01/F3-T02: login canonico + sesion tenant-aware.
  - Evidencias:
    - `.agents/react-doctor/EVIDENCIA_F3_T01_LOGIN_USUARIO_PASSWORD_2026-03-09.md`
    - `.agents/react-doctor/EVIDENCIA_F3_T02_SESION_TENANT_AWARE_2026-03-09.md`

## Cierres implementados (2026-03-10)

### [x] F4-T01/F4-T02/F4-T03 - Setup inicial + bloqueo operativo

Evidencia:
- `.agents/react-doctor/EVIDENCIA_F4_T01_T02_T03_SETUP_INICIAL_2026-03-10.md`

### [x] F5-T01/F5-T02/F5-T03/F5-T04 - Registro y analitica dinamica

Evidencia:
- `.agents/react-doctor/EVIDENCIA_F5_T01_T02_T03_T04_DINAMICO_2026-03-10.md`

### [x] F6-T01/F6-T02 - Cupos por rol y UX de excedentes

Evidencia:
- `.agents/react-doctor/EVIDENCIA_F6_T01_T02_CUPOS_UI_2026-03-10.md`

### [x] F7-T01/F7-T02/F7-T03 - Hardening frontend y checklist final

Evidencias:
- `.agents/react-doctor/EVIDENCIA_F7_T01_T02_T03_HARDENING_2026-03-10.md`
- `.agents/react-doctor/CHECKLIST_SALIDA_PRODUCCION_F7_T03.md`

Validaciones de cierre:
- `npm run build` -> OK.
- `react-doctor` -> 100/100.

## Reglas funcionales que no se deben perder

- SUPERADMIN no entra a modulos operativos.
- ADMIN/SECRETARIO no entran al modulo superadmin.
- Modulos operativos se bloquean hasta setup completo.
- Procedencias configurables por tenant (maximo 10).
- Dependencias de metricas deben validarse (ej. puntualidad ambos o ninguno).
- Cambio GRUPO -> IGLESIA edita la misma cuenta (sin duplicar tenant).
- ADMIN temporal expira a 5 dias.

## Aprobacion owner

- Aprobacion general de avance confirmada por Christian en el ciclo 2026-03-09 / 2026-03-10.

## Siguiente ticket recomendado

- `F8-T01` (discovery UX de modulos futuros nacionales).

