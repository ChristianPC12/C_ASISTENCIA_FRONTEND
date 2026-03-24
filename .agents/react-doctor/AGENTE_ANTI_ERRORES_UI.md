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

### E29) Formularios largos sin navegación por etapas

- Qué pasó: en `Registro de asistencia`, después de elegir el culto se mostraban todas las categorías a la vez.
- Impacto: exceso de scroll, peor lectura en móvil y sensación de formulario pesado.
- Regla preventiva:
  1. Si un formulario dinámico tiene varias categorías, mostrar una sola categoría visible por vez.
  2. Usar navegación compacta con flechas izquierda/derecha cuando el flujo sea secuencial y móvil-first.
  3. Mantener `Culto` y `Fecha` como contexto fijo, pero no desplegar todas las categorías simultáneamente.
  4. Optimizar ancho de inputs por tipo real; no dar ancho excesivo a campos numéricos cortos.

### E30) Feedback lógico duplicado o invasivo dentro del formulario

- Qué pasó: se mostraron mensajes lógicos como `invalid-feedback` debajo de inputs, ocupando espacio y ensuciando la lectura.
- Impacto: UI más alta, ruido visual y menos claridad en formularios compactos.
- Regla preventiva:
  1. Para errores lógicos de interacción inmediata, usar notificación flotante del sistema en `advertencia` (amarillo) + resalte visual del campo.
  2. Evitar bloques inline de texto cuando el producto ya usa toasts para feedback global.
  3. No propagar un error de una categoría a otra; cada campo debe recibir solo feedback de su propia regla.
  4. Si una entrada rompe una regla dura (`suma > total`, `visitas > procedencia`), bloquear el cambio antes de persistirlo en estado.

### E31) Bloque de visitas mal agrupado y sin límite por nombre

- Qué pasó: `Cantidad de visitas` y `Nombres de visitas` no se percibían como una misma unidad; además faltaba el límite por nombre.
- Impacto: lectura más pesada, peor uso del espacio y riesgo de nombres excesivamente largos.
- Regla preventiva:
  1. En la categoría `Visitas`, renderizar `cantidad + nombres` como pareja visual en la misma fila cuando el ancho lo permita.
  2. En móvil, apilar la pareja sin obligar al formulario completo a hacer scroll horizontal.
  3. Mantener `Nombres de visitas` como input de una sola línea con scroll interno natural del input.
  4. Aplicar límite de 20 caracteres por cada nombre separado por coma desde la captura, no solo al guardar.

### E32) Wizard validado solo por campos tocados o por "algún dato"

- Qué pasó: el paso permitía avanzar con solo tener un dato cualquiera o con errores aún no visibles porque el campo dependiente no había sido tocado.
- Impacto: el usuario podía pasar de categoría con inputs obligatorios vacíos o con reglas globales incumplidas (`total`, `procedencia`, `visitas`, `permanencia`).
- Regla preventiva:
  1. El avance entre pasos debe usar validación completa del formulario, no solo errores filtrados por campos tocados.
  2. Si la categoría tiene campos obligatorios, no se avanza mientras alguno siga vacío; `0` sí cuenta como valor válido en inputs numéricos.
  3. Si una categoría depende de `Total de asistentes`, el bloqueo debe usar el error real de `total_asistentes` aunque ese input no se haya tocado en ese momento.
  4. Nunca usar "tiene algún dato" como criterio suficiente para habilitar la flecha derecha.

### E33) Scroll interno atrapando calendario y overlays

- Qué pasó: al meter `overflow` en el contenedor equivocado, el calendario y otros overlays quedaban recortados o parecían metidos dentro del scroll.
- Impacto: selección de fecha incómoda y percepción de UI rota en móvil/tablet.
- Regla preventiva:
  1. El `overflow: auto` debe vivir en un wrapper interno de contenido, no en la tarjeta externa que contiene overlays.
  2. La tarjeta/panel padre debe conservar `overflow: visible` cuando tenga dropdowns, popovers o calendarios absolutos.
  3. El scroll vertical del wizard debe ser invisible y contenido, pero sin atrapar el calendario.
  4. En móvil, el popover del calendario debe adaptarse al viewport sin generar scroll horizontal.

### E34) Flujo del wizard sin prerequisitos claros

- Qué pasó: el formulario llegaba a mostrar navegación o categorías antes de tener el contexto mínimo definido.
- Impacto: el usuario veía demasiados campos, navegación incoherente y dependencia difícil de entender.
- Regla preventiva:
  1. Sin `Culto`, no se muestra `Fecha`.
  2. Sin `Culto + Fecha`, no se muestran categorías ni flechas del wizard.
  3. Si existe `Total de asistentes`, debe quedar primero en el orden del wizard para dar contexto a validaciones dependientes.
  4. La flecha izquierda debe quedar deshabilitada en `1/N` y la derecha en el último paso, sin navegación circular.

### E35) Paso no accionable bloqueando el wizard

- Qué pasó: `Total de asistentes` quedó como primer paso aunque en ciertos setups se calcula automáticamente y el usuario no puede editarlo.
- Impacto: el wizard se bloquea en una pantalla donde no hay acción posible.
- Regla preventiva:
  1. Si una sección es solo informativa o autocalculada, no debe ocupar un paso obligatorio del wizard.
  2. `Total de asistentes` solo debe aparecer como paso cuando sea editable/manual.
  3. Si `Total de asistentes` se calcula desde otra categoría, se excluye de la navegación para no frenar el flujo.
  4. La prioridad visual de una categoría nunca debe imponerse por encima de si realmente es accionable.

### E36) Campos numéricos obligatorios vacíos aunque el total ya quedó resuelto

- Qué pasó: en `Procedencia`, podían quedar inputs obligatorios vacíos aun cuando otra procedencia ya completaba exactamente `Total de asistentes`.
- Impacto: el usuario quedaba bloqueado por omitir ceros que no cambian el resultado, y el sistema seguía tratando esos campos como incompletos.
- Regla preventiva:
  1. En categorías numéricas dependientes del total, distinguir siempre entre `vacío` y `0`.
  2. Si la suma ya coincide exactamente con `Total de asistentes`, los obligatorios vacíos deben normalizarse automáticamente a `0`.
  3. Esa normalización debe aplicarse en estado, validación y guardado.
  4. No debilitar la regla dejando pasar vacíos ambiguos; si el total aún no está cubierto, el bloqueo debe mantenerse.

### E37) Altura del paso sin límite real en formularios wizard

- Qué pasó: aunque el wizard mostraba una categoría por vez, algunas secciones seguían creciendo demasiado en altura y consumían demasiado viewport.
- Impacto: más scroll del necesario y menor control visual del formulario, especialmente en `Visitas`.
- Regla preventiva:
  1. Cada paso del wizard debe tener altura fija y scroll interno propio.
  2. El alto visible debe equivaler aproximadamente a dos filas útiles de inputs; el resto se navega con scroll interno.
  3. En `Visitas`, `cantidad + nombres` deben permanecer en la misma fila también en móvil para no duplicar altura por grupo.
  4. El scroll debe vivir solo dentro del panel del paso, no expandir toda la tarjeta.

### E38) Acción principal visible antes de completar el wizard

- Qué pasó: `Guardar` seguía visible desde pasos intermedios, permitiendo una acción prematura mientras el usuario aún no llegaba al final del flujo.
- Impacto: riesgo de guardar registros incompletos o de confundir al usuario sobre cuándo termina realmente el formulario.
- Regla preventiva:
  1. En formularios tipo wizard, `Guardar` solo debe aparecer en el último paso.
  2. Aunque el botón no esté visible, el `submit` del formulario también debe bloquearse si no se está en el último paso.
  3. Mantener visibles solo acciones seguras en pasos intermedios (por ejemplo `Limpiar` o navegación).
  4. La visibilidad de la acción principal debe seguir el progreso real del flujo, no solo la presencia de datos parciales.

### E39) Paso compacto con validación cruzada mal aislada

- Qué pasó: el wizard de asistencia mantenía un header interno redundante (`Visitas`, `6 campos`) y además propagaba errores de `Total de asistentes` hacia categorías no relacionadas como `Composición de asistentes`.
- Impacto: pérdida de espacio útil y bloqueo injustificado al avanzar por categorías que no dependen de esa regla.
- Regla preventiva:
  1. Si el nombre de la categoría ya aparece en el switch superior, no repetirlo dentro del panel del paso.
  2. El panel del paso debe usar `max-height` con scroll interno, no altura fija rígida; si hay pocos campos, el alto debe colapsar naturalmente.
  3. Los errores cruzados de `Total de asistentes` solo se propagan a categorías que realmente dependen de ese dato en ese momento (`Procedencia`, `Permanencia`), no a `Composición de asistentes`.
  4. Antes de cerrar un ajuste de wizard, revisar que cada categoría pueda avanzar únicamente por sus propias reglas y no por residuos de otra sección.

### E40) Obligatoriedad de métricas mezclada con lógica real del registro

- Qué pasó: la bandera `obligatorio` en métricas estaba generando validaciones artificiales en setup y en registro, duplicando reglas que en realidad ya dependen de relaciones lógicas entre categorías.
- Impacto: más complejidad, más mensajes inconsistentes y más regresiones al intentar resolver un caso puntual.
- Regla preventiva:
  1. En métricas dinámicas del sistema, `obligatorio` no se expone al usuario ni se usa como contrato activo de negocio.
  2. El setup de métricas debe manejar solo `habilitado` + `categoría` + reglas estructurales del sistema.
  3. En `Nuevo registro`, el bloqueo debe venir de la lógica real (`total`, `permanencia`, `procedencia`, `visitas`) y no de un flag genérico de obligatoriedad.
  4. Si la base de datos conserva la columna por compatibilidad, frontend y backend deben forzar `obligatorio = false` para evitar residuos de configuraciones antiguas.

### E41) El bloqueo debe ocurrir en la categoría origen, no en una posterior

- Qué pasó: el wizard permitía salir de `Información del culto` sin datos y luego bloqueaba más adelante en `Procedencia` con un mensaje sobre `Total de asistentes` o `Permanencia`.
- Impacto: el usuario recibe un error fuera de contexto y siente que la lógica falla, aunque el problema real estaba en el paso anterior.
- Regla preventiva:
  1. Si `Total de asistentes` se calcula desde `Información del culto`, el bloqueo debe ocurrir al salir de `Información del culto` cuando aún no hay datos.
  2. Si `Total de asistentes` es manual y existen categorías posteriores que dependen de él, el bloqueo debe ocurrir en el paso `Total de asistentes`.
  3. `Permanencia` no debe generar error de total mientras esa categoría siga completamente vacía.
  4. Nunca mostrar una advertencia de una categoría futura para impedir el avance desde una categoría que todavía no es el origen real del problema.

### E42) Categoría resuelta pero con vacíos ambiguos

- Qué pasó: cuando una categoría que reparte el total ya quedaba completamente resuelta por un solo valor, los demás campos seguían vacíos en vez de pasar a `0`.
- Impacto: inconsistencia visual, duda para el usuario y riesgo de validaciones distintas entre frontend y backend.
- Regla preventiva:
  1. Si una categoría numérica que reparte `Total de asistentes` ya suma exactamente el total, todos los vacíos restantes de esa misma categoría deben normalizarse a `0`.
  2. Esta regla aplica tanto en frontend como en backend para evitar discrepancias entre vista y persistencia.
  3. En `Permanencia`, si varios campos siguen vacíos pero la suma conocida ya alcanzó el total, no debe exigirse `N-1`; los faltantes pasan a `0`.
  4. No dejar vacíos ambiguos en categorías que el sistema ya pudo cerrar lógicamente.

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
- [ ] Formularios dinámicos extensos muestran una sola categoría/paso visible por vez.
- [ ] El wizard valida el paso completo con reglas reales, no solo con campos tocados.
- [ ] Errores lógicos inmediatos usan toast `advertencia` + borde de campo, sin `invalid-feedback` invasivo.
- [ ] Ninguna categoría muestra errores prestados de otra categoría.
- [ ] El scroll interno no atrapa calendarios, popovers ni dropdowns.
- [ ] Inputs numéricos cortos usan ancho compacto y no dominan el layout móvil.
- [ ] En `Visitas`, cantidad y nombres se renderizan como pareja visual por procedencia.
- [ ] Cada nombre en `Nombres de visitas` respeta límite de 20 caracteres separado por coma.
- [ ] Lint/build/react-doctor ejecutados.
