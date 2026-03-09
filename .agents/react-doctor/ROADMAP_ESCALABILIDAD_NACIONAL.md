# Roadmap de Escalabilidad Nacional (Multiiglesia / Multigrupo IASD CR)

Fecha base: 2026-03-09  
Estado global: Planificado (sin implementacion tecnica aun)

## 1) Objetivo de negocio

Escalar el sistema actual para que pueda ser usado por multiples iglesias y grupos de la IASD en Costa Rica, con aislamiento de datos por instancia (tenant), sin perder seguridad ni simplicidad operativa.

Resultado esperado:
- Una iglesia/grupo no ve ni modifica datos de otra.
- El sistema sigue siendo un solo producto y una sola aplicacion.
- Se habilita crecimiento nacional por fases, sin un "big-bang rewrite".

## 2) Alcance del roadmap

Incluye:
- Multi-tenancy por campo + iglesia/grupo.
- Nuevo rol `SUPERADMIN` para crear y administrar cuentas/instancias.
- Onboarding de instancia con usuario administrador temporal.
- Configuracion inicial por instancia para habilitar/deshabilitar parametros del sistema.
- Bloqueo de modulos funcionales hasta completar configuracion inicial.
- Parametros dinamicos (incluyendo procedencias configurables hasta maximo 10).
- Cuotas de usuarios por rol dentro de cada instancia.
- Preparacion de modulos futuros (campanas, pequenas congregaciones, estudios biblicos).

No incluye (por ahora):
- Rediseno visual completo.
- Cambio de stack tecnologico.
- Migracion inmediata a microservicios.

## 3) Definiciones canonicas (usar siempre estos terminos)

- `campo`: nivel administrativo IASD en CR (Norte, Central Sur, Caribe).
- `organizacion`: entidad operativa concreta que usa el sistema (IGLESIA o GRUPO).
- `tenant`: sinonimo tecnico de `organizacion`.
- `cuenta de instancia`: combinacion de organizacion + configuracion + usuarios + datos.
- `superadmin`: rol global con acceso solo al modulo de administracion nacional.
- `admin de instancia`: rol ADMIN regular dentro de una organizacion.

## 4) Reglas de ejecucion para futuros agentes

1. Ejecutar fases en orden.  
2. No iniciar fase nueva con bloqueadores abiertos de la fase anterior.  
3. Antes de tocar codigo, actualizar estado de tarea: `[ ]` -> `[~]`.  
4. Al cerrar tarea, marcar `[x]` y agregar fecha al final del item.  
5. Cada cierre de fase exige actualizar:
   - `.agents/react-doctor/CONTEXTO_ACTUAL.md`
   - `.agents/react-doctor/prompt_frontend.md`
   - agentes backend en `C_ASISTENCIA_BAKCEND/.agents/escalabilidad/*`
6. Si hay conflicto entre docs y codigo, prevalece codigo y luego se corrigen docs.

Leyenda de estado:
- `[ ]` pendiente
- `[~]` en progreso
- `[x]` completado

## 5) Mapa de fases y prioridad

| Fase | Prioridad | Estado | Resultado principal |
|---|---|---|---|
| F0 - Discovery y contrato | P0 | [ ] | Modelo objetivo, decisiones base y contrato API versionado |
| F1 - Aislamiento multitenant base | P0 | [ ] | Datos separados por `organizacion_id` en backend + BD |
| F2 - Superadmin y creacion de instancias | P0 | [ ] | Alta/edicion de cuentas de iglesia/grupo desde un modulo unico |
| F3 - Login y sesion tenant-aware | P0 | [ ] | Sesion ligada a tenant para evitar cruces |
| F4 - Configuracion inicial por instancia | P0 | [ ] | Modulos bloqueados hasta configurar parametros locales |
| F5 - Registro/analitica dinamica | P1 | [ ] | Registro, estadisticas, comparaciones y presentaciones segun configuracion local |
| F6 - Cuotas de usuarios por rol | P1 | [ ] | Limites por rol con enforcement backend |
| F7 - Endurecimiento, migracion y despliegue | P0 | [ ] | Produccion escalable con plan de migracion y rollback |
| F8 - Modulos futuros nacionales | P2 | [ ] | Campanas, pequenas congregaciones, estudios biblicos |

---

## 6) Fases en detalle

### F0 - Discovery y contrato (P0)

Objetivo: cerrar decisiones arquitectonicas antes de codificar cambios grandes.

Checklist:
- [ ] Definir contrato de identidad de tenant en login (`codigo_instancia + usuario + password` recomendado).
- [ ] Definir catalogo inicial de campos IASD CR en BD:
  - Asociacion Norte de Costa Rica
  - Asociacion Central Sur de Costa Rica
  - Mision Caribe de Costa Rica
- [ ] Definir convencion de `codigo_instancia` unico y corto (slug estable para login).
- [ ] Definir versionado de API (`/v1` actual, `/v2` para multitenancy, o estrategia equivalente).
- [ ] Definir estrategia de migracion de datos actuales a tenant inicial.
- [ ] Definir politicas minimas de auditoria para eventos criticos (alta tenant, cambio de nombre, bloqueo/desbloqueo, envio de credenciales).

Definition of Done:
- Documento de decisiones firmado en agentes frontend y backend.
- Contrato API de alto nivel acordado (auth, tenant setup, modulo superadmin).

Bloqueadores tipicos:
- No decidir identidad de login tenant-aware.
- No decidir si `usuario` sera unico global o unico por tenant.

---

### F1 - Aislamiento multitenant base (P0)

Objetivo: garantizar separacion real de datos por organizacion.

Cambios esperados en BD:
- Nuevas tablas base:
  - `campos`
  - `organizaciones` (`tipo`: IGLESIA|GRUPO, editable)
  - `organizacion_config_estado`
- Agregar `organizacion_id` en tablas transaccionales relevantes:
  - `usuarios`
  - `cultos` (o nueva tabla `organizacion_cultos`)
  - `asistencia_registro`
  - `presentaciones`
  - `user_tokens` (si aplica para validaciones rapidas)
- Cambiar indices unicos para incluir tenant:
  - asistencia: de `(culto_id, fecha)` a `(organizacion_id, culto_id, fecha)`
  - usuarios: segun decision F0 (global o por tenant)

Cambios esperados backend:
- `AuthContext` debe exponer `organizacion_id`.
- Middleware de auth debe cargar y validar tenant en cada request.
- DAOs deben filtrar por tenant de forma obligatoria.
- Servicios deben bloquear operaciones sin tenant valido.

Checklist:
- [ ] Crear migraciones SQL idempotentes para tablas nuevas y columnas nuevas.
- [ ] Agregar constraints e indices de tenant.
- [ ] Implementar scoping tenant en DAO/Service para asistencias, presentaciones y usuarios.
- [ ] Evitar queries sin filtro tenant en endpoints protegidos.
- [ ] Crear pruebas de no-filtracion entre tenants.

Definition of Done:
- Prueba funcional: misma fecha/culto permitida en tenant A y tenant B.
- Prueba de seguridad: usuario de tenant A no puede leer/escribir tenant B.

---

### F2 - Superadmin y creacion de instancias (P0)

Objetivo: habilitar alta de nuevas organizaciones desde el mismo sistema.

Comportamiento esperado:
- Nuevo rol `SUPERADMIN` con acceso solo al modulo superadmin.
- SUPERADMIN crea "cuenta de instancia" con:
  - campo
  - tipo organizacion (IGLESIA|GRUPO)
  - nombre visible de organizacion
  - correo opcional
  - usuario ADMIN temporal inicial
- SUPERADMIN puede editar nombre/tipo despues (ejemplo: GRUPO -> IGLESIA) sin crear nueva cuenta.

Checklist:
- [ ] Agregar rol `SUPERADMIN` en tablas/constantes/backend/frontend.
- [ ] Crear endpoints backend de superadmin para CRUD de organizaciones.
- [ ] Crear endpoints backend para generar usuario ADMIN temporal inicial.
- [ ] Crear modulo frontend `superadmin` aislado del resto de modulos.
- [ ] Bloquear acceso de SUPERADMIN a registro/registros/estadisticas/etc.

Definition of Done:
- SUPERADMIN puede crear tenant completo sin SQL manual.
- Tenant nuevo queda listo para login inicial de ADMIN temporal.

---

### F3 - Login y sesion tenant-aware (P0)

Objetivo: evitar ambiguedad de cuenta y garantizar sesion ligada a tenant.

Comportamiento recomendado:
- Login solicita `codigo_instancia`, `usuario`, `password`.
- Token/sesion incluye `organizacion_id` y `rol`.
- Interceptor frontend y middleware backend manejan 401/403 conservando contexto.

Checklist:
- [ ] Actualizar request de login y validadores frontend.
- [ ] Actualizar `AuthService` y `AuthMiddleware` para tenant.
- [ ] Persistir datos minimos de tenant en contexto de sesion.
- [ ] Ajustar logout/me para retornar tenant actual.
- [ ] Actualizar mensajes de expiracion y redireccion sin perder contexto.

Definition of Done:
- No existe login exitoso sin tenant valido.
- No existe sesion activa sin tenant asociado (excepto SUPERADMIN global).

---

### F4 - Configuracion inicial por instancia (P0)

Objetivo: obligar configuracion local antes de usar modulos operativos.

Comportamiento esperado:
- ADMIN de instancia entra a modulo `Administrador` (nombre de trabajo).
- Hasta completar configuracion, los modulos operativos se ven pero quedan deshabilitados.
- Al completar configuracion valida, se desbloquean modulo registro + modulos dependientes.

Configuraciones minimas:
- Cultos habilitados por instancia (dias/horas reales).
- Parametros habilitados y obligatorios.
- Reglas de dependencia entre parametros.
- Procedencias configurables (1..10) + reflejo coherente con visitas.

Checklist:
- [ ] Crear tabla de estado de configuracion inicial por tenant.
- [ ] Crear endpoints para guardar y versionar configuracion.
- [ ] Implementar guard backend que rechace uso de modulos bloqueados.
- [ ] Implementar bloqueo visual frontend (sidebar + rutas + botones).
- [ ] Definir validaciones de dependencia (ejemplo: puntualidad antes/despues juntos).
- [ ] Registrar fecha y usuario que completan setup inicial.

Definition of Done:
- Sin setup completo, no se puede crear registros.
- Con setup completo, se habilitan modulos de forma inmediata.

---

### F5 - Registro y analitica dinamica por configuracion (P1)

Objetivo: que cada tenant vea solo los campos que decidio usar.

Capacidades objetivo:
- Formulario de registro dinamico por tenant.
- Estadisticas, comparaciones y presentaciones construidas desde esa configuracion.
- Procedencias dinamicas hasta maximo 10 (con edicion posterior).

Estrategia recomendada:
- Introducir modelo de datos dinamico para metricas configurables:
  - encabezado de registro (`asistencia_registro`)
  - detalle de metricas/segmentos por claves configurables
- Mantener compatibilidad temporal para datos legacy durante migracion.

Checklist:
- [ ] Definir esquema dinamico para metricas y procedencias.
- [ ] Adaptar validadores frontend/backend para reglas por configuracion.
- [ ] Adaptar generacion de estadisticas y comparaciones por metrica activa.
- [ ] Adaptar modulo presentaciones a estructura dinamica.
- [ ] Revisar exportaciones (Excel/PDF) para nuevas estructuras.

Definition of Done:
- Tenant A y tenant B pueden tener diferentes formularios y reportes sin errores.

---

### F6 - Cuotas de usuarios por rol (P1)

Objetivo: limitar crecimiento de usuarios por rol segun reglas de negocio.

Ejemplos iniciales (ajustables):
- SECRETARIO: max 2
- MINISTERIO_PERSONAL: max 3
- ADMIN: max 2 (incluyendo titular)

Checklist:
- [ ] Definir roles adicionales requeridos y su semantica.
- [ ] Crear configuracion de cupos por tenant/rol.
- [ ] Enforzar limites en backend (source of truth).
- [ ] Mostrar consumo de cupos en UI de usuarios.
- [ ] Definir mensajes de error claros al exceder cupo.

Definition of Done:
- No se puede crear usuario cuando el cupo del rol esta completo.

---

### F7 - Endurecimiento, migracion y despliegue (P0)

Objetivo: pasar a produccion nacional con riesgo controlado.

Checklist:
- [ ] Migrar datos existentes a tenant inicial (sin perdida de historial).
- [ ] Crear plan de rollback por fase de migracion.
- [ ] Integrar envio de correo opcional con Brevo (300/dia plan gratuito) via adaptador.
- [ ] Implementar limpieza del ADMIN temporal a 5 dias (job/cron).
- [ ] Pruebas de seguridad: aislamiento tenant, auth, permisos, rate limit.
- [ ] Pruebas de carga: consultas clave en escenario multi-tenant.
- [ ] Monitoreo minimo: errores 401/403/500, latencia, colas de correo.

Definition of Done:
- Cutover validado con pilot y checklist de salida firmado.

---

### F8 - Modulos futuros nacionales (P2)

Objetivo: dejar ruta preparada para expansion funcional.

Backlog:
- [ ] Modulo de campanas.
- [ ] Modulo de pequenas congregaciones.
- [ ] Modulo de estudios biblicos.
- [ ] Integracion de estos modulos con el mismo modelo tenant-aware y sistema de permisos.

---

## 7) Riesgos principales y mitigacion

Riesgo: fuga de datos entre tenants por query incompleta.  
Mitigacion: tenant scoping obligatorio en DAO + pruebas automatizadas de aislamiento.

Riesgo: complejidad excesiva por campos dinamicos.  
Mitigacion: separar en fases (primero aislamiento, luego dinamismo), con versionado de configuracion.

Riesgo: bloqueo operativo por setup inicial mal disenado.  
Mitigacion: wizard simple, defaults seguros y validaciones de dependencia claras.

Riesgo: entrega de credenciales por correo no confiable.  
Mitigacion: correo opcional + registro de envio + expiracion estricta de usuario temporal.

## 8) Criterios de exito del programa

- Escalabilidad funcional nacional sin duplicar despliegues por iglesia.
- Aislamiento de datos validado en pruebas y auditoria.
- Onboarding de nueva iglesia/grupo en minutos desde superadmin.
- Configuracion local sin tocar codigo.
- Deuda tecnica documentada y controlada por fase.

