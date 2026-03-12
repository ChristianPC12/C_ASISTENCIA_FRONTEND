# Agente Anti Errores UI (2026-03-11)

## Objetivo

Evitar repetir errores de ejecución y de UX en módulos futuros, especialmente cuando el prompt se reutiliza entre pantallas.

## Errores cometidos y corrección aplicada

### E1) Contexto inicial mal resuelto por ruta

- Qué pasó: al iniciar discovery se intentó leer archivos desde una ruta padre incorrecta.
- Impacto: pérdida de tiempo inicial y riesgo de asumir contexto incompleto.
- Regla preventiva:
  1. Validar `cwd` real con `Get-ChildItem`.
  2. Confirmar existencia de cada archivo solicitado antes de analizar contenido.
  3. Si hay estructura anidada (`repo/repo`), fijar workdir definitivo y mantenerlo.

### E2) Exceso de formularios abiertos en una sola pantalla

- Qué pasó: setup del administrador mostraba varios bloques pesados simultáneamente.
- Impacto: exceso de scroll, peor experiencia en teléfono.
- Regla preventiva:
  1. Usar patrón de "una acción visible por vez".
  2. Mover acciones de apertura a topbar contextual.
  3. Cada panel debe tener cierre explícito y retorno a vista resumen.

### E3) Jerarquía visual poco eficiente

- Qué pasó: textos y alertas largas competían con acciones principales.
- Impacto: sensación de ruido visual.
- Regla preventiva:
  1. Reducir bloques informativos a notas compactas.
  2. Priorizar estado + acción principal en primer viewport.
  3. Evitar repetir títulos si el contexto ya lo da la topbar.

### E4) Alineación de acciones incompleta

- Qué pasó: badge y botón no quedaban alineados verticalmente con el bloque de estado.
- Impacto: desbalance visual en escritorio.
- Regla preventiva:
  1. En layouts de dos columnas usar `align-items-stretch`.
  2. En columna de acciones usar `h-100` + `justify-content: space-between`.
  3. Verificar alineación superior e inferior antes de cerrar tarea.

### E5) Mensaje técnico importante, pero invasivo

- Qué pasó: la regla de puntualidad se mostraba como alerta grande.
- Impacto: ocupaba espacio útil del formulario.
- Regla preventiva:
  1. Convertir reglas fijas en "nota compacta" con icono.
  2. Mantener legible la regla sin competir con inputs/tabla.
  3. Si la regla no cambia, no usar formato de alerta prominente.

### E6) Cierre de panel sin manejo de cambios no guardados

- Qué pasó: al cerrar paneles se mantenían cambios locales sin confirmar, dando sensación de "guardado automático".
- Impacto: confusión funcional y riesgo de decisiones erradas del usuario.
- Regla preventiva:
  1. Si hay cambios pendientes, al cerrar panel solicitar confirmación de descarte.
  2. Si se confirma descarte, restaurar snapshot base del panel.
  3. Si se cancela descarte, mantener panel abierto sin alterar datos.

### E7) Botones de guardado visibles sin cambios pendientes

- Qué pasó: se mostraban botones `Guardar` aun cuando no había modificaciones.
- Impacto: ruido visual y acciones sin valor.
- Regla preventiva:
  1. Mantener firma/base por sección (`cultos`, `metricas`, `procedencias`).
  2. Mostrar `Guardar` solo cuando `tieneCambiosX === true`.
  3. Agregar botón `Limpiar` para restaurar cambios locales de inmediato (sin confirmación).

### E8) Inconsistencia ortográfica en labels y mensajes

- Qué pasó: textos visibles mezclaban ortografía sin acentos en términos clave.
- Impacto: menor calidad percibida y experiencia menos profesional.
- Regla preventiva:
  1. Revisar ortografía y acentuación de labels finales antes de cerrar ticket.
  2. Priorizar consistencia en términos repetidos (`Métricas`, `configuración`, `revisión`, etc.).
  3. Evitar introducir variantes distintas del mismo término en una misma pantalla.

### E9) Barrido obligatorio de tildes y letra ñ

- Qué pasó: quedaron textos funcionalmente correctos, pero con faltantes de tildes o sin `ñ`.
- Impacto: baja calidad editorial y retrabajo en iteraciones cortas.
- Regla preventiva:
  1. Antes de entregar, hacer barrido de copy en pantalla, toasts y mensajes de confirmación.
  2. Verificar explícitamente tildes (`áéíóú`) y uso correcto de `ñ` en palabras que lo requieren.
  3. Corregir también labels de botones, títulos de columnas y mensajes de estados vacíos.
  4. No cerrar ticket sin este barrido cuando se haya tocado texto UI.

### E10) Límites de longitud no aplicados en campos clave

- Qué pasó: campos visibles permitían más caracteres de los esperados por UX.
- Impacto: entradas largas, interfaz desordenada y validaciones tardías.
- Regla preventiva:
  1. Definir límite máximo por campo funcional antes de implementar.
  2. Aplicar límite en dos capas: `maxLength` en input + validación en hook/validator.
  3. Para `Nombre de culto`, usar rango obligatorio de 3 a 20 caracteres.
  4. Mantener mensaje de error explícito con el rango permitido.

### E11) Exposición de campos internos (`clave`, `orden`) al usuario final

- Qué pasó: se mostraron campos técnicos que no agregan valor funcional al administrador.
- Impacto: confusión, riesgo de errores de configuración y soporte innecesario.
- Regla preventiva:
  1. `clave` y `orden` deben manejarse en lógica interna, no como input editable.
  2. Generar/normalizar `clave` automáticamente al guardar.
  3. Derivar `orden` por posición visual de la lista cuando aplique.
  4. No exponer campos técnicos de integridad cuando el sistema pueda resolverlos automáticamente.

### E12) Falta de blindaje para métricas base del sistema

- Qué pasó: métricas definidas como base quedaron expuestas a edición/eliminación.
- Impacto: pérdida de configuración canónica y alto retrabajo para recomponerla.
- Regla preventiva:
  1. Toda métrica base debe marcarse como `es_fija`.
  2. En métricas fijas, bloquear edición estructural (`etiqueta`, `categoria`) y bloqueo total de eliminar.
  3. Permitir únicamente `habilitado` y `obligatorio` en métricas fijas.
  4. Si `habilitado=false`, forzar `obligatorio=false` en tiempo real y previo a persistir.

### E13) Falta de foco contextual al crear filas nuevas

- Qué pasó: al presionar `Agregar métrica`, el usuario debía buscar manualmente la nueva fila.
- Impacto: fricción de uso, especialmente en móvil con tablas largas.
- Regla preventiva:
  1. Toda acción `Agregar X` debe devolver identificador de la nueva fila (`ui_id`).
  2. Al renderizar la fila, hacer `focus()` en el primer input editable.
  3. Acompañarlo con `scrollIntoView({ block: 'center' })` para llevar al usuario al punto exacto.

### E14) Guardar visible aun cuando el usuario vuelve al estado inicial

- Qué pasó: en métricas, después de interactuar y regresar al valor original, podía mantenerse visible `Guardar`.
- Impacto: confusión sobre si hay cambios reales pendientes.
- Regla preventiva:
  1. La detección dirty debe basarse en firma normalizada, no en referencia de objetos.
  2. Si una regla de negocio fuerza cambios derivados (`habilitado` -> `obligatorio`), debe conservar/restaurar estado previo para permitir volver al baseline.
  3. Mostrar botones `Guardar` solo cuando la firma actual difiere de la base.

### E15) Regla clave sin suficiente jerarquía visual

- Qué pasó: una regla importante (métricas opcionales) no destacaba frente al resto del listado.
- Impacto: riesgo de que el usuario interprete que crear métricas extra es obligatorio.
- Regla preventiva:
  1. Reglas de alto impacto deben llevar estilo destacado (fondo, borde lateral, icono).
  2. Mantener copy breve y accionable.
  3. Evitar que una regla crítica quede visualmente igual al resto.

### E16) Mezclar modelo viejo de dependencias con modelo nuevo por categorías

- Qué pasó: quedaron referencias a `depende_de_clave`/`regla_dependencia` después de migrar a `categoria`.
- Impacto: validaciones inconsistentes, ruido en UI y errores de payload.
- Regla preventiva:
  1. Si la métrica usa `categoria`, eliminar en frontend/backend el uso operativo de `depende_de_clave`, `regla_dependencia` y `orden`.
  2. Mantener coherencia end-to-end: DAO, validator, servicio, hook y tabla UI deben compartir el mismo contrato.
  3. Para métricas base, la categoría esperada se valida por sistema; para métricas nuevas, se selecciona por `select`.

### E17) Duplicar feedback de error (toast + alerta inline) en setup de administrador

- Qué pasó: se mostraron errores globales de métricas como `alert alert-danger` además de notificación flotante.
- Impacto: ruido visual y saturación del flujo en paneles compactos.
- Regla preventiva:
  1. En setup de administrador, errores globales de guardado/validación deben salir por notificación flotante.
  2. Evitar `alert alert-danger` para mensajes generales cuando ya exista toast equivalente.
  3. Mantener solo feedback inline de campo (`invalid-feedback`) cuando aplique por input puntual.

### E18) Setup sin propagación real a módulos operativos

- Qué pasó: cambios en cultos/métricas/procedencias del setup no se reflejaban correctamente en `Nuevo registro` ni en filtros por culto.
- Impacto: el administrador configuraba datos, pero el resto de módulos seguía usando valores estáticos/legacy.
- Regla preventiva:
  1. La fuente de verdad para cultos del tenant debe ser `setup` (no catálogo estático global).
  2. Al resolver culto por `codigo` en backend, priorizar coincidencia en setup del tenant; solo usar fallback legacy si no existe setup para ese tenant.
  3. Cambios de procedencias deben sincronizar métricas derivadas (`proc_*`, `visitas_*`, `nombres_visitas_*`) para que aparezcan en `Nuevo registro`.
  4. Cualquier cambio en setup debe validarse cruzado: `Administrador` -> `Nuevo registro` -> filtros/reportes.

### E19) Persistencia de categoría en esquema legacy de métricas

- Qué pasó: al no existir columna `categoria`, la categoría de métricas nuevas podía perderse y volver a `adicionales`.
- Impacto: clasificación inconsistente y mala organización del formulario por secciones.
- Regla preventiva:
  1. Si el esquema no tiene columna `categoria`, serializarla en un campo legacy controlado (`CAT:<categoria>`).
  2. Al leer métricas legacy, reconstruir `categoria` desde marcador; si falta, inferir por `clave`.
  3. Mantener este comportamiento compatible hasta completar migración física de base de datos.

### E20) Categorías automáticas expuestas como opción manual

- Qué pasó: se permitió crear métricas nuevas en categorías `procedencia` y `visitas` aunque esas métricas ya se generan al guardar procedencias.
- Impacto: duplicidad de métricas, ruido de configuración y riesgo de inconsistencias.
- Regla preventiva:
  1. En el selector de categoría para métricas nuevas, ocultar `procedencia` y `visitas`.
  2. Si una métrica ya pertenece a `procedencia` o `visitas` por generación automática, mostrar la categoría y bloquear su edición manual.
  3. Reforzar la nota UI indicando que cantidad y nombres de visitas se crean desde `Procedencias`.

### E21) Cantidad de visitas sin correspondencia de nombres

- Qué pasó: el usuario podía registrar `visitas = N` sin ingresar exactamente N nombres.
- Impacto: datos incompletos y dificultad para seguimiento de visitas.
- Regla preventiva:
  1. Validar que `nombres_visitas_*` use separador por coma y que la cantidad de nombres coincida con `visitas_*`.
  2. Guiar con `placeholder` claro en el campo de nombres (ejemplo: `Nombre 1, Nombre 2, Nombre 3`) sin agregar texto extra debajo.
  3. Mantener mensaje de error explícito cuando la cantidad no coincide.

### E22) Topbar sin estado activo visible

- Qué pasó: en administrador no quedaba claro qué panel del topbar estaba abierto.
- Impacto: navegación confusa y retrabajo al alternar entre paneles.
- Regla preventiva:
  1. Sincronizar `vistaActiva` del módulo con el topbar mediante evento global (`admin:vista-activa`).
  2. Aplicar estilo activo (background + contraste) al botón correspondiente del topbar.
  3. Limpiar estado activo al salir de la ruta de administrador.

### E23) Falta de accesos directos entre paneles relacionados

- Qué pasó: el usuario debía depender solo del topbar para moverse a paneles vinculados.
- Impacto: más clics y menor descubribilidad de flujo.
- Regla preventiva:
  1. En tarjetas/notas de resumen, agregar links directos para abrir paneles clave.
  2. En notas de dependencia (ej. métricas ↔ procedencias), incluir acción `Ir a ...` contextual.
  3. Mantener estos links dentro del mismo flujo de confirmación de cambios pendientes.

### E24) Módulos ADMIN dispersos fuera del flujo de administrador

- Qué pasó: la gestión de usuarios vivía como pantalla separada, rompiendo el flujo central de configuración del administrador.
- Impacto: navegación fragmentada y menor claridad de permisos (qué puede hacer solo ADMIN).
- Regla preventiva:
  1. Funciones exclusivas de ADMIN deben vivir en topbar/paneles de `Administrador` cuando formen parte del setup operativo.
  2. Evitar duplicar accesos laterales para el mismo módulo si ya existe acceso contextual en topbar.
  3. Si se conserva ruta legacy por compatibilidad, redirigir a `/administrador`.

### E25) Submódulos sin estructura interna clara

- Qué pasó: dentro de usuarios no había navegación por tareas (listar, crear, roles/cupos).
- Impacto: más scroll y menor orientación del usuario.
- Regla preventiva:
  1. En paneles extensos usar selector de opciones interno (tabs/chips) por tarea.
  2. Definir vista inicial explícita (por defecto `Usuarios del sistema`).
  3. Al editar desde tabla, cambiar automáticamente a la opción de formulario.

### E26) Regresión de codificación y ortografía (mojibake)

- Qué pasó: reaparecieron textos dañados (`MÃ©trica`, `configuraciÃ³n`, `Â¿`), además de faltantes de tildes.
- Impacto: deterioro visual inmediato y pérdida de confianza del usuario.
- Regla preventiva:
  1. Guardar siempre archivos UI en UTF-8.
  2. Antes de cerrar ticket, barrer cadenas visibles con búsqueda de patrones dañados (`MÃ`, `Ã`, `Â`).
  3. Corregir copy visible (botones, alertas, placeholders, confirmaciones y toasts) en la misma iteración.

### E27) Cálculo inconsistente de estado de setup

- Qué pasó: el frontend evaluó `bloqueada_operacion` con defaults/casts inconsistentes, dejando el setup en pendiente aun estando completo.
- Impacto: CTA y mensaje principal incorrectos, y acciones que no abren el panel esperado.
- Regla preventiva:
  1. Normalizar booleanos de backend (`0/1`, `true/false`, strings) con helper único.
  2. Evitar defaults que fuerzan bloqueo (`true`) cuando el backend no envía el campo.
  3. Mantener la misma regla de `setupCompleto` en hooks de estado y en la vista de administrador.

### E28) Mensajes técnicos expuestos al usuario final

- Qué pasó: se mostraron mensajes internos como `metrica_base_faltante:*` y textos genéricos ambiguos en pendientes.
- Impacto: el usuario final no entiende el problema ni qué acción debe realizar.
- Regla preventiva:
  1. Nunca exponer códigos internos o claves técnicas en toasts/alertas visibles.
  2. Todo mensaje de error debe incluir acción concreta en lenguaje simple (qué pasó + qué hacer ahora).
  3. Si el backend envía mensajes técnicos, mapearlos en frontend a copy amigable antes de notificar.
  4. Priorizar mensajes cortos y orientados a resultado (ejemplo: abrir panel X y guardar).

## Protocolo reutilizable para nuevos módulos

1. Discovery breve
- Identificar estado actual y componentes reales.
- Confirmar restricciones de rol/setup/rutas.

2. Definición UI antes de tocar lógica
- Decidir vista predeterminada.
- Definir acciones contextuales (topbar o sección).
- Definir regla "una vista activa".

3. Implementación en orden
- Estructura visual.
- Estados de apertura/cierre.
- Manejo de cambios pendientes (dirty-state + descarte/restauración).
- Pulido responsive (desktop y móvil).
- Ajustes de copy y jerarquía visual.

4. Validación mínima obligatoria
- `npx eslint <archivos_modificados>`
- `npm run build`
- `npx -y react-doctor@latest . --verbose --diff`

5. Cierre
- Confirmar alineaciones finales pedidas por el owner.
- Evitar introducir texto extra no solicitado.
- Entregar cambios con ruta exacta de archivos.

## Checklist rápido previo a entregar

- [ ] Solo un formulario/panel visible.
- [ ] Botones principales dentro del primer viewport.
- [ ] Sin bloques informativos que estorben flujo.
- [ ] Uso cómodo en teléfono (scroll controlado).
- [ ] Mensajes importantes cortos y accionables.
- [ ] Botones Guardar solo visibles con cambios pendientes.
- [ ] Cierre de panel no conserva cambios sin confirmación.
- [ ] Ortografía de labels validada en UI final.
- [ ] Barrido final de tildes y letra ñ ejecutado en textos visibles.
- [ ] Límites de longitud validados en UI y en lógica.
- [ ] `Clave` y `orden` no expuestos como input editable.
- [ ] Métricas nuevas con `categoria` en `select` y sin exponer dependencias técnicas.
- [ ] Métricas base protegidas contra edición estructural y eliminación.
- [ ] `habilitado=false` fuerza `obligatorio=false`.
- [ ] `Agregar` en tablas largas aplica foco y scroll al nuevo input.
- [ ] Si el usuario vuelve al estado inicial, `Guardar` desaparece.
- [ ] Reglas de alto impacto con destacado visual.
- [ ] No duplicar mensajes globales (toast + `alert-danger`) en el mismo evento.
- [ ] Verificar propagación de setup en módulos operativos (cultos, métricas, procedencias).
- [ ] En esquema legacy, confirmar que la categoría de métricas nuevas persiste correctamente.
- [ ] Categorías automáticas (`procedencia`, `visitas`) no disponibles para métricas nuevas y visibles bloqueadas cuando las genera el sistema.
- [ ] En visitas, validar coincidencia entre cantidad y nombres separados por coma.
- [ ] En topbar de administrador, botón activo resaltado según panel abierto.
- [ ] En resumen/notas, links directos funcionales para abrir paneles relacionados.
- [ ] Funciones exclusivas de ADMIN centralizadas en topbar/paneles de `/administrador`.
- [ ] Paneles complejos (ej. usuarios) con subopciones internas por tarea.
- [ ] Archivos UI guardados en UTF-8 y sin patrones mojibake (`MÃ`, `Ã`, `Â`).
- [ ] Estado de setup validado con normalización booleana consistente (`bloqueada_operacion`).
- [ ] Mensajes de error/notificación en lenguaje de usuario final (sin claves técnicas).
- [ ] Lint/build/react-doctor ejecutados.
