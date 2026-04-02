# Agente Anti Errores UI (2026-03-11)

## Objetivo

Evitar repetir errores de ejecuciÃ³n y de UX en mÃ³dulos futuros, especialmente cuando el prompt se reutiliza entre pantallas.

## Errores cometidos y correcciÃ³n aplicada

### E1) Contexto inicial mal resuelto por ruta

- QuÃ© pasÃ³: al iniciar discovery se intentÃ³ leer archivos desde una ruta padre incorrecta.
- Impacto: pÃ©rdida de tiempo inicial y riesgo de asumir contexto incompleto.
- Regla preventiva:
  1. Validar `cwd` real con `Get-ChildItem`.
  2. Confirmar existencia de cada archivo solicitado antes de analizar contenido.
  3. Si hay estructura anidada (`repo/repo`), fijar workdir definitivo y mantenerlo.

### E2) Exceso de formularios abiertos en una sola pantalla

- QuÃ© pasÃ³: setup del administrador mostraba varios bloques pesados simultÃ¡neamente.
- Impacto: exceso de scroll, peor experiencia en telÃ©fono.
- Regla preventiva:
  1. Usar patrÃ³n de "una acciÃ³n visible por vez".
  2. Mover acciones de apertura a topbar contextual.
  3. Cada panel debe tener cierre explÃ­cito y retorno a vista resumen.

### E3) JerarquÃ­a visual poco eficiente

- QuÃ© pasÃ³: textos y alertas largas competÃ­an con acciones principales.
- Impacto: sensaciÃ³n de ruido visual.
- Regla preventiva:
  1. Reducir bloques informativos a notas compactas.
  2. Priorizar estado + acciÃ³n principal en primer viewport.
  3. Evitar repetir tÃ­tulos si el contexto ya lo da la topbar.

### E4) AlineaciÃ³n de acciones incompleta

- QuÃ© pasÃ³: badge y botÃ³n no quedaban alineados verticalmente con el bloque de estado.
- Impacto: desbalance visual en escritorio.
- Regla preventiva:
  1. En layouts de dos columnas usar `align-items-stretch`.
  2. En columna de acciones usar `h-100` + `justify-content: space-between`.
  3. Verificar alineaciÃ³n superior e inferior antes de cerrar tarea.

### E5) Mensaje tÃ©cnico importante, pero invasivo

- QuÃ© pasÃ³: la regla de puntualidad se mostraba como alerta grande.
- Impacto: ocupaba espacio Ãºtil del formulario.
- Regla preventiva:
  1. Convertir reglas fijas en "nota compacta" con icono.
  2. Mantener legible la regla sin competir con inputs/tabla.
  3. Si la regla no cambia, no usar formato de alerta prominente.

### E6) Cierre de panel sin manejo de cambios no guardados

- QuÃ© pasÃ³: al cerrar paneles se mantenÃ­an cambios locales sin confirmar, dando sensaciÃ³n de "guardado automÃ¡tico".
- Impacto: confusiÃ³n funcional y riesgo de decisiones erradas del usuario.
- Regla preventiva:
  1. Si hay cambios pendientes, al cerrar panel solicitar confirmaciÃ³n de descarte.
  2. Si se confirma descarte, restaurar snapshot base del panel.
  3. Si se cancela descarte, mantener panel abierto sin alterar datos.

### E7) Botones de guardado visibles sin cambios pendientes

- QuÃ© pasÃ³: se mostraban botones `Guardar` aun cuando no habÃ­a modificaciones.
- Impacto: ruido visual y acciones sin valor.
- Regla preventiva:
  1. Mantener firma/base por secciÃ³n (`cultos`, `metricas`, `procedencias`).
  2. Mostrar `Guardar` solo cuando `tieneCambiosX === true`.
  3. Agregar botÃ³n `Limpiar` para restaurar cambios locales de inmediato (sin confirmaciÃ³n).

### E8) Inconsistencia ortogrÃ¡fica en labels y mensajes

- QuÃ© pasÃ³: textos visibles mezclaban ortografÃ­a sin acentos en tÃ©rminos clave.
- Impacto: menor calidad percibida y experiencia menos profesional.
- Regla preventiva:
  1. Revisar ortografÃ­a y acentuaciÃ³n de labels finales antes de cerrar ticket.
  2. Priorizar consistencia en tÃ©rminos repetidos (`MÃ©tricas`, `configuraciÃ³n`, `revisiÃ³n`, etc.).
  3. Evitar introducir variantes distintas del mismo tÃ©rmino en una misma pantalla.

### E9) Barrido obligatorio de tildes y letra Ã±

- QuÃ© pasÃ³: quedaron textos funcionalmente correctos, pero con faltantes de tildes o sin `Ã±`.
- Impacto: baja calidad editorial y retrabajo en iteraciones cortas.
- Regla preventiva:
  1. Antes de entregar, hacer barrido de copy en pantalla, toasts y mensajes de confirmaciÃ³n.
  2. Verificar explÃ­citamente tildes (`Ã¡Ã©Ã­Ã³Ãº`) y uso correcto de `Ã±` en palabras que lo requieren.
  3. Corregir tambiÃ©n labels de botones, tÃ­tulos de columnas y mensajes de estados vacÃ­os.
  4. No cerrar ticket sin este barrido cuando se haya tocado texto UI.

### E10) LÃ­mites de longitud no aplicados en campos clave

- QuÃ© pasÃ³: campos visibles permitÃ­an mÃ¡s caracteres de los esperados por UX.
- Impacto: entradas largas, interfaz desordenada y validaciones tardÃ­as.
- Regla preventiva:
  1. Definir lÃ­mite mÃ¡ximo por campo funcional antes de implementar.
  2. Aplicar lÃ­mite en dos capas: `maxLength` en input + validaciÃ³n en hook/validator.
  3. Para `Nombre de culto`, usar rango obligatorio de 3 a 20 caracteres.
  4. Mantener mensaje de error explÃ­cito con el rango permitido.

### E11) ExposiciÃ³n de campos internos (`clave`, `orden`) al usuario final

- QuÃ© pasÃ³: se mostraron campos tÃ©cnicos que no agregan valor funcional al administrador.
- Impacto: confusiÃ³n, riesgo de errores de configuraciÃ³n y soporte innecesario.
- Regla preventiva:
  1. `clave` y `orden` deben manejarse en lÃ³gica interna, no como input editable.
  2. Generar/normalizar `clave` automÃ¡ticamente al guardar.
  3. Derivar `orden` por posiciÃ³n visual de la lista cuando aplique.
  4. No exponer campos tÃ©cnicos de integridad cuando el sistema pueda resolverlos automÃ¡ticamente.

### E12) Falta de blindaje para mÃ©tricas base del sistema

- QuÃ© pasÃ³: mÃ©tricas definidas como base quedaron expuestas a ediciÃ³n/eliminaciÃ³n.
- Impacto: pÃ©rdida de configuraciÃ³n canÃ³nica y alto retrabajo para recomponerla.
- Regla preventiva:
  1. Toda mÃ©trica base debe marcarse como `es_fija`.
  2. En mÃ©tricas fijas, bloquear ediciÃ³n estructural (`etiqueta`, `categoria`) y bloqueo total de eliminar.
  3. Permitir Ãºnicamente `habilitado` y `obligatorio` en mÃ©tricas fijas.
  4. Si `habilitado=false`, forzar `obligatorio=false` en tiempo real y previo a persistir.

### E13) Falta de foco contextual al crear filas nuevas

- QuÃ© pasÃ³: al presionar `Agregar mÃ©trica`, el usuario debÃ­a buscar manualmente la nueva fila.
- Impacto: fricciÃ³n de uso, especialmente en mÃ³vil con tablas largas.
- Regla preventiva:
  1. Toda acciÃ³n `Agregar X` debe devolver identificador de la nueva fila (`ui_id`).
  2. Al renderizar la fila, hacer `focus()` en el primer input editable.
  3. AcompaÃ±arlo con `scrollIntoView({ block: 'center' })` para llevar al usuario al punto exacto.

### E14) Guardar visible aun cuando el usuario vuelve al estado inicial

- QuÃ© pasÃ³: en mÃ©tricas, despuÃ©s de interactuar y regresar al valor original, podÃ­a mantenerse visible `Guardar`.
- Impacto: confusiÃ³n sobre si hay cambios reales pendientes.
- Regla preventiva:
  1. La detecciÃ³n dirty debe basarse en firma normalizada, no en referencia de objetos.
  2. Si una regla de negocio fuerza cambios derivados (`habilitado` -> `obligatorio`), debe conservar/restaurar estado previo para permitir volver al baseline.
  3. Mostrar botones `Guardar` solo cuando la firma actual difiere de la base.

### E15) Regla clave sin suficiente jerarquÃ­a visual

- QuÃ© pasÃ³: una regla importante (mÃ©tricas opcionales) no destacaba frente al resto del listado.
- Impacto: riesgo de que el usuario interprete que crear mÃ©tricas extra es obligatorio.
- Regla preventiva:
  1. Reglas de alto impacto deben llevar estilo destacado (fondo, borde lateral, icono).
  2. Mantener copy breve y accionable.
  3. Evitar que una regla crÃ­tica quede visualmente igual al resto.

### E16) Mezclar modelo viejo de dependencias con modelo nuevo por categorÃ­as

- QuÃ© pasÃ³: quedaron referencias a `depende_de_clave`/`regla_dependencia` despuÃ©s de migrar a `categoria`.
- Impacto: validaciones inconsistentes, ruido en UI y errores de payload.
- Regla preventiva:
  1. Si la mÃ©trica usa `categoria`, eliminar en frontend/backend el uso operativo de `depende_de_clave`, `regla_dependencia` y `orden`.
  2. Mantener coherencia end-to-end: DAO, validator, servicio, hook y tabla UI deben compartir el mismo contrato.
  3. Para mÃ©tricas base, la categorÃ­a esperada se valida por sistema; para mÃ©tricas nuevas, se selecciona por `select`.

### E17) Duplicar feedback de error (toast + alerta inline) en setup de administrador

- QuÃ© pasÃ³: se mostraron errores globales de mÃ©tricas como `alert alert-danger` ademÃ¡s de notificaciÃ³n flotante.
- Impacto: ruido visual y saturaciÃ³n del flujo en paneles compactos.
- Regla preventiva:
  1. En setup de administrador, errores globales de guardado/validaciÃ³n deben salir por notificaciÃ³n flotante.
  2. Evitar `alert alert-danger` para mensajes generales cuando ya exista toast equivalente.
  3. Mantener solo feedback inline de campo (`invalid-feedback`) cuando aplique por input puntual.

### E18) Setup sin propagaciÃ³n real a mÃ³dulos operativos

- QuÃ© pasÃ³: cambios en cultos/mÃ©tricas/procedencias del setup no se reflejaban correctamente en `Nuevo registro` ni en filtros por culto.
- Impacto: el administrador configuraba datos, pero el resto de mÃ³dulos seguÃ­a usando valores estÃ¡ticos/legacy.
- Regla preventiva:
  1. La fuente de verdad para cultos del tenant debe ser `setup` (no catÃ¡logo estÃ¡tico global).
  2. Al resolver culto por `codigo` en backend, priorizar coincidencia en setup del tenant; solo usar fallback legacy si no existe setup para ese tenant.
  3. Cambios de procedencias deben sincronizar mÃ©tricas derivadas (`proc_*`, `visitas_*`, `nombres_visitas_*`) para que aparezcan en `Nuevo registro`.
  4. Cualquier cambio en setup debe validarse cruzado: `Administrador` -> `Nuevo registro` -> filtros/reportes.

### E19) Persistencia de categorÃ­a en esquema legacy de mÃ©tricas

- QuÃ© pasÃ³: al no existir columna `categoria`, la categorÃ­a de mÃ©tricas nuevas podÃ­a perderse y volver a `adicionales`.
- Impacto: clasificaciÃ³n inconsistente y mala organizaciÃ³n del formulario por secciones.
- Regla preventiva:
  1. Si el esquema no tiene columna `categoria`, serializarla en un campo legacy controlado (`CAT:<categoria>`).
  2. Al leer mÃ©tricas legacy, reconstruir `categoria` desde marcador; si falta, inferir por `clave`.
  3. Mantener este comportamiento compatible hasta completar migraciÃ³n fÃ­sica de base de datos.

### E20) CategorÃ­as automÃ¡ticas expuestas como opciÃ³n manual

- QuÃ© pasÃ³: se permitiÃ³ crear mÃ©tricas nuevas en categorÃ­as `procedencia` y `visitas` aunque esas mÃ©tricas ya se generan al guardar procedencias.
- Impacto: duplicidad de mÃ©tricas, ruido de configuraciÃ³n y riesgo de inconsistencias.
- Regla preventiva:
  1. En el selector de categorÃ­a para mÃ©tricas nuevas, ocultar `procedencia` y `visitas`.
  2. Si una mÃ©trica ya pertenece a `procedencia` o `visitas` por generaciÃ³n automÃ¡tica, mostrar la categorÃ­a y bloquear su ediciÃ³n manual.
  3. Reforzar la nota UI indicando que cantidad y nombres de visitas se crean desde `Procedencias`.

### E21) Cantidad de visitas sin correspondencia de nombres

- QuÃ© pasÃ³: el usuario podÃ­a registrar `visitas = N` sin ingresar exactamente N nombres.
- Impacto: datos incompletos y dificultad para seguimiento de visitas.
- Regla preventiva:
  1. Validar que `nombres_visitas_*` use separador por coma y que la cantidad de nombres coincida con `visitas_*`.
  2. Guiar con `placeholder` claro en el campo de nombres (ejemplo: `Nombre 1, Nombre 2, Nombre 3`) sin agregar texto extra debajo.
  3. Mantener mensaje de error explÃ­cito cuando la cantidad no coincide.

### E22) Topbar sin estado activo visible

- QuÃ© pasÃ³: en administrador no quedaba claro quÃ© panel del topbar estaba abierto.
- Impacto: navegaciÃ³n confusa y retrabajo al alternar entre paneles.
- Regla preventiva:
  1. Sincronizar `vistaActiva` del mÃ³dulo con el topbar mediante evento global (`admin:vista-activa`).
  2. Aplicar estilo activo (background + contraste) al botÃ³n correspondiente del topbar.
  3. Limpiar estado activo al salir de la ruta de administrador.

### E23) Falta de accesos directos entre paneles relacionados

- QuÃ© pasÃ³: el usuario debÃ­a depender solo del topbar para moverse a paneles vinculados.
- Impacto: mÃ¡s clics y menor descubribilidad de flujo.
- Regla preventiva:
  1. En tarjetas/notas de resumen, agregar links directos para abrir paneles clave.
  2. En notas de dependencia (ej. mÃ©tricas â†” procedencias), incluir acciÃ³n `Ir a ...` contextual.
  3. Mantener estos links dentro del mismo flujo de confirmaciÃ³n de cambios pendientes.

### E24) MÃ³dulos ADMIN dispersos fuera del flujo de administrador

- QuÃ© pasÃ³: la gestiÃ³n de usuarios vivÃ­a como pantalla separada, rompiendo el flujo central de configuraciÃ³n del administrador.
- Impacto: navegaciÃ³n fragmentada y menor claridad de permisos (quÃ© puede hacer solo ADMIN).
- Regla preventiva:
  1. Funciones exclusivas de ADMIN deben vivir en topbar/paneles de `Administrador` cuando formen parte del setup operativo.
  2. Evitar duplicar accesos laterales para el mismo mÃ³dulo si ya existe acceso contextual en topbar.
  3. Si se conserva ruta legacy por compatibilidad, redirigir a `/administrador`.

### E25) SubmÃ³dulos sin estructura interna clara

- QuÃ© pasÃ³: dentro de usuarios no habÃ­a navegaciÃ³n por tareas (listar, crear, roles/cupos).
- Impacto: mÃ¡s scroll y menor orientaciÃ³n del usuario.
- Regla preventiva:
  1. En paneles extensos usar selector de opciones interno (tabs/chips) por tarea.
  2. Definir vista inicial explÃ­cita (por defecto `Usuarios del sistema`).
  3. Al editar desde tabla, cambiar automÃ¡ticamente a la opciÃ³n de formulario.

### E26) RegresiÃ³n de codificaciÃ³n y ortografÃ­a (mojibake)

- QuÃ© pasÃ³: reaparecieron textos daÃ±ados (`MÃƒÂ©trica`, `configuraciÃƒÂ³n`, `Ã‚Â¿`), ademÃ¡s de faltantes de tildes.
- Impacto: deterioro visual inmediato y pÃ©rdida de confianza del usuario.
- Regla preventiva:
  1. Guardar siempre archivos UI en UTF-8.
  2. Antes de cerrar ticket, barrer cadenas visibles con bÃºsqueda de patrones daÃ±ados (`MÃƒ`, `Ãƒ`, `Ã‚`).
  3. Corregir copy visible (botones, alertas, placeholders, confirmaciones y toasts) en la misma iteraciÃ³n.

### E27) CÃ¡lculo inconsistente de estado de setup

- QuÃ© pasÃ³: el frontend evaluÃ³ `bloqueada_operacion` con defaults/casts inconsistentes, dejando el setup en pendiente aun estando completo.
- Impacto: CTA y mensaje principal incorrectos, y acciones que no abren el panel esperado.
- Regla preventiva:
  1. Normalizar booleanos de backend (`0/1`, `true/false`, strings) con helper Ãºnico.
  2. Evitar defaults que fuerzan bloqueo (`true`) cuando el backend no envÃ­a el campo.
  3. Mantener la misma regla de `setupCompleto` en hooks de estado y en la vista de administrador.

### E28) Mensajes tÃ©cnicos expuestos al usuario final

- QuÃ© pasÃ³: se mostraron mensajes internos como `metrica_base_faltante:*` y textos genÃ©ricos ambiguos en pendientes.
- Impacto: el usuario final no entiende el problema ni quÃ© acciÃ³n debe realizar.
- Regla preventiva:
  1. Nunca exponer cÃ³digos internos o claves tÃ©cnicas en toasts/alertas visibles.
  2. Todo mensaje de error debe incluir acciÃ³n concreta en lenguaje simple (quÃ© pasÃ³ + quÃ© hacer ahora).
  3. Si el backend envÃ­a mensajes tÃ©cnicos, mapearlos en frontend a copy amigable antes de notificar.
  4. Priorizar mensajes cortos y orientados a resultado (ejemplo: abrir panel X y guardar).

### E29) Formularios largos sin navegaciÃ³n por etapas

- QuÃ© pasÃ³: en `Registro de asistencia`, despuÃ©s de elegir el culto se mostraban todas las categorÃ­as a la vez.
- Impacto: exceso de scroll, peor lectura en mÃ³vil y sensaciÃ³n de formulario pesado.
- Regla preventiva:
  1. Si un formulario dinÃ¡mico tiene varias categorÃ­as, mostrar una sola categorÃ­a visible por vez.
  2. Usar navegaciÃ³n compacta con flechas izquierda/derecha cuando el flujo sea secuencial y mÃ³vil-first.
  3. Mantener `Culto` y `Fecha` como contexto fijo, pero no desplegar todas las categorÃ­as simultÃ¡neamente.
  4. Optimizar ancho de inputs por tipo real; no dar ancho excesivo a campos numÃ©ricos cortos.

### E30) Feedback lÃ³gico duplicado o invasivo dentro del formulario

- QuÃ© pasÃ³: se mostraron mensajes lÃ³gicos como `invalid-feedback` debajo de inputs, ocupando espacio y ensuciando la lectura.
- Impacto: UI mÃ¡s alta, ruido visual y menos claridad en formularios compactos.
- Regla preventiva:
  1. Para errores lÃ³gicos de interacciÃ³n inmediata, usar notificaciÃ³n flotante del sistema en `advertencia` (amarillo) + resalte visual del campo.
  2. Evitar bloques inline de texto cuando el producto ya usa toasts para feedback global.
  3. No propagar un error de una categorÃ­a a otra; cada campo debe recibir solo feedback de su propia regla.
  4. Si una entrada rompe una regla dura (`suma > total`, `visitas > procedencia`), bloquear el cambio antes de persistirlo en estado.

### E31) Bloque de visitas mal agrupado y sin lÃ­mite por nombre

- QuÃ© pasÃ³: `Cantidad de visitas` y `Nombres de visitas` no se percibÃ­an como una misma unidad; ademÃ¡s faltaba el lÃ­mite por nombre.
- Impacto: lectura mÃ¡s pesada, peor uso del espacio y riesgo de nombres excesivamente largos.
- Regla preventiva:
  1. En la categorÃ­a `Visitas`, renderizar `cantidad + nombres` como pareja visual en la misma fila cuando el ancho lo permita.
  2. En mÃ³vil, apilar la pareja sin obligar al formulario completo a hacer scroll horizontal.
  3. Mantener `Nombres de visitas` como input de una sola lÃ­nea con scroll interno natural del input.
  4. Aplicar lÃ­mite de 20 caracteres por cada nombre separado por coma desde la captura, no solo al guardar.

### E32) Wizard validado solo por campos tocados o por "algÃºn dato"

- QuÃ© pasÃ³: el paso permitÃ­a avanzar con solo tener un dato cualquiera o con errores aÃºn no visibles porque el campo dependiente no habÃ­a sido tocado.
- Impacto: el usuario podÃ­a pasar de categorÃ­a con inputs obligatorios vacÃ­os o con reglas globales incumplidas (`total`, `procedencia`, `visitas`, `permanencia`).
- Regla preventiva:
  1. El avance entre pasos debe usar validaciÃ³n completa del formulario, no solo errores filtrados por campos tocados.
  2. Si la categorÃ­a tiene campos obligatorios, no se avanza mientras alguno siga vacÃ­o; `0` sÃ­ cuenta como valor vÃ¡lido en inputs numÃ©ricos.
  3. Si una categorÃ­a depende de `Total de asistentes`, el bloqueo debe usar el error real de `total_asistentes` aunque ese input no se haya tocado en ese momento.
  4. Nunca usar "tiene algÃºn dato" como criterio suficiente para habilitar la flecha derecha.

### E33) Scroll interno atrapando calendario y overlays

- QuÃ© pasÃ³: al meter `overflow` en el contenedor equivocado, el calendario y otros overlays quedaban recortados o parecÃ­an metidos dentro del scroll.
- Impacto: selecciÃ³n de fecha incÃ³moda y percepciÃ³n de UI rota en mÃ³vil/tablet.
- Regla preventiva:
  1. El `overflow: auto` debe vivir en un wrapper interno de contenido, no en la tarjeta externa que contiene overlays.
  2. La tarjeta/panel padre debe conservar `overflow: visible` cuando tenga dropdowns, popovers o calendarios absolutos.
  3. El scroll vertical del wizard debe ser invisible y contenido, pero sin atrapar el calendario.
  4. En mÃ³vil, el popover del calendario debe adaptarse al viewport sin generar scroll horizontal.

### E34) Flujo del wizard sin prerequisitos claros

- QuÃ© pasÃ³: el formulario llegaba a mostrar navegaciÃ³n o categorÃ­as antes de tener el contexto mÃ­nimo definido.
- Impacto: el usuario veÃ­a demasiados campos, navegaciÃ³n incoherente y dependencia difÃ­cil de entender.
- Regla preventiva:
  1. Sin `Culto`, no se muestra `Fecha`.
  2. Sin `Culto + Fecha`, no se muestran categorÃ­as ni flechas del wizard.
  3. Si existe `Total de asistentes`, debe quedar primero en el orden del wizard para dar contexto a validaciones dependientes.
  4. La flecha izquierda debe quedar deshabilitada en `1/N` y la derecha en el Ãºltimo paso, sin navegaciÃ³n circular.

### E35) Paso no accionable bloqueando el wizard

- QuÃ© pasÃ³: `Total de asistentes` quedÃ³ como primer paso aunque en ciertos setups se calcula automÃ¡ticamente y el usuario no puede editarlo.
- Impacto: el wizard se bloquea en una pantalla donde no hay acciÃ³n posible.
- Regla preventiva:
  1. Si una secciÃ³n es solo informativa o autocalculada, no debe ocupar un paso obligatorio del wizard.
  2. `Total de asistentes` solo debe aparecer como paso cuando sea editable/manual.
  3. Si `Total de asistentes` se calcula desde otra categorÃ­a, se excluye de la navegaciÃ³n para no frenar el flujo.
  4. La prioridad visual de una categorÃ­a nunca debe imponerse por encima de si realmente es accionable.

### E36) Campos numÃ©ricos obligatorios vacÃ­os aunque el total ya quedÃ³ resuelto

- QuÃ© pasÃ³: en `Procedencia`, podÃ­an quedar inputs obligatorios vacÃ­os aun cuando otra procedencia ya completaba exactamente `Total de asistentes`.
- Impacto: el usuario quedaba bloqueado por omitir ceros que no cambian el resultado, y el sistema seguÃ­a tratando esos campos como incompletos.
- Regla preventiva:
  1. En categorÃ­as numÃ©ricas dependientes del total, distinguir siempre entre `vacÃ­o` y `0`.
  2. Si la suma ya coincide exactamente con `Total de asistentes`, los obligatorios vacÃ­os deben normalizarse automÃ¡ticamente a `0`.
  3. Esa normalizaciÃ³n debe aplicarse en estado, validaciÃ³n y guardado.
  4. No debilitar la regla dejando pasar vacÃ­os ambiguos; si el total aÃºn no estÃ¡ cubierto, el bloqueo debe mantenerse.

### E37) Altura del paso sin lÃ­mite real en formularios wizard

- QuÃ© pasÃ³: aunque el wizard mostraba una categorÃ­a por vez, algunas secciones seguÃ­an creciendo demasiado en altura y consumÃ­an demasiado viewport.
- Impacto: mÃ¡s scroll del necesario y menor control visual del formulario, especialmente en `Visitas`.
- Regla preventiva:
  1. Cada paso del wizard debe tener altura fija y scroll interno propio.
  2. El alto visible debe equivaler aproximadamente a dos filas Ãºtiles de inputs; el resto se navega con scroll interno.
  3. En `Visitas`, `cantidad + nombres` deben permanecer en la misma fila tambiÃ©n en mÃ³vil para no duplicar altura por grupo.
  4. El scroll debe vivir solo dentro del panel del paso, no expandir toda la tarjeta.

### E38) AcciÃ³n principal visible antes de completar el wizard

- QuÃ© pasÃ³: `Guardar` seguÃ­a visible desde pasos intermedios, permitiendo una acciÃ³n prematura mientras el usuario aÃºn no llegaba al final del flujo.
- Impacto: riesgo de guardar registros incompletos o de confundir al usuario sobre cuÃ¡ndo termina realmente el formulario.
- Regla preventiva:
  1. En formularios tipo wizard, `Guardar` solo debe aparecer en el Ãºltimo paso.
  2. Aunque el botÃ³n no estÃ© visible, el `submit` del formulario tambiÃ©n debe bloquearse si no se estÃ¡ en el Ãºltimo paso.
  3. Mantener visibles solo acciones seguras en pasos intermedios (por ejemplo `Limpiar` o navegaciÃ³n).
  4. La visibilidad de la acciÃ³n principal debe seguir el progreso real del flujo, no solo la presencia de datos parciales.

### E39) Paso compacto con validaciÃ³n cruzada mal aislada

- QuÃ© pasÃ³: el wizard de asistencia mantenÃ­a un header interno redundante (`Visitas`, `6 campos`) y ademÃ¡s propagaba errores de `Total de asistentes` hacia categorÃ­as no relacionadas como `ComposiciÃ³n de asistentes`.
- Impacto: pÃ©rdida de espacio Ãºtil y bloqueo injustificado al avanzar por categorÃ­as que no dependen de esa regla.
- Regla preventiva:
  1. Si el nombre de la categorÃ­a ya aparece en el switch superior, no repetirlo dentro del panel del paso.
  2. El panel del paso debe usar `max-height` con scroll interno, no altura fija rÃ­gida; si hay pocos campos, el alto debe colapsar naturalmente.
  3. Los errores cruzados de `Total de asistentes` solo se propagan a categorÃ­as que realmente dependen de ese dato en ese momento (`Procedencia`, `Permanencia`), no a `ComposiciÃ³n de asistentes`.
  4. Antes de cerrar un ajuste de wizard, revisar que cada categorÃ­a pueda avanzar Ãºnicamente por sus propias reglas y no por residuos de otra secciÃ³n.

### E40) Obligatoriedad de mÃ©tricas mezclada con lÃ³gica real del registro

- QuÃ© pasÃ³: la bandera `obligatorio` en mÃ©tricas estaba generando validaciones artificiales en setup y en registro, duplicando reglas que en realidad ya dependen de relaciones lÃ³gicas entre categorÃ­as.
- Impacto: mÃ¡s complejidad, mÃ¡s mensajes inconsistentes y mÃ¡s regresiones al intentar resolver un caso puntual.
- Regla preventiva:
  1. En mÃ©tricas dinÃ¡micas del sistema, `obligatorio` no se expone al usuario ni se usa como contrato activo de negocio.
  2. El setup de mÃ©tricas debe manejar solo `habilitado` + `categorÃ­a` + reglas estructurales del sistema.
  3. En `Nuevo registro`, el bloqueo debe venir de la lÃ³gica real (`total`, `permanencia`, `procedencia`, `visitas`) y no de un flag genÃ©rico de obligatoriedad.
  4. Si la base de datos conserva la columna por compatibilidad, frontend y backend deben forzar `obligatorio = false` para evitar residuos de configuraciones antiguas.

### E41) El bloqueo debe ocurrir en la categorÃ­a origen, no en una posterior

- QuÃ© pasÃ³: el wizard permitÃ­a salir de `InformaciÃ³n del culto` sin datos y luego bloqueaba mÃ¡s adelante en `Procedencia` con un mensaje sobre `Total de asistentes` o `Permanencia`.
- Impacto: el usuario recibe un error fuera de contexto y siente que la lÃ³gica falla, aunque el problema real estaba en el paso anterior.
- Regla preventiva:
  1. Si `Total de asistentes` se calcula desde `InformaciÃ³n del culto`, el bloqueo debe ocurrir al salir de `InformaciÃ³n del culto` cuando aÃºn no hay datos.
  2. Si `Total de asistentes` es manual y existen categorÃ­as posteriores que dependen de Ã©l, el bloqueo debe ocurrir en el paso `Total de asistentes`.
  3. `Permanencia` no debe generar error de total mientras esa categorÃ­a siga completamente vacÃ­a.
  4. Nunca mostrar una advertencia de una categorÃ­a futura para impedir el avance desde una categorÃ­a que todavÃ­a no es el origen real del problema.

### E42) CategorÃ­a resuelta pero con vacÃ­os ambiguos

- QuÃ© pasÃ³: cuando una categorÃ­a que reparte el total ya quedaba completamente resuelta por un solo valor, los demÃ¡s campos seguÃ­an vacÃ­os en vez de pasar a `0`.
- Impacto: inconsistencia visual, duda para el usuario y riesgo de validaciones distintas entre frontend y backend.
- Regla preventiva:
  1. Si una categorÃ­a numÃ©rica que reparte `Total de asistentes` ya suma exactamente el total, todos los vacÃ­os restantes de esa misma categorÃ­a deben normalizarse a `0`.
  2. Esta regla aplica tanto en frontend como en backend para evitar discrepancias entre vista y persistencia.
  3. En `Permanencia`, si varios campos siguen vacÃ­os pero la suma conocida ya alcanzÃ³ el total, no debe exigirse `N-1`; los faltantes pasan a `0`.
  4. No dejar vacÃ­os ambiguos en categorÃ­as que el sistema ya pudo cerrar lÃ³gicamente.

### E43) Limpiar sin reiniciar el paso activo del wizard

- QuÃ© pasÃ³: al usar `Limpiar`, el formulario borraba datos pero mantenÃ­a la Ãºltima categorÃ­a activa, de modo que al reanudar el flujo no volvÃ­a visualmente a `1/N`.
- Impacto: sensaciÃ³n de reinicio incompleto y mayor confusiÃ³n al retomar el registro.
- Regla preventiva:
  1. `Limpiar` debe reiniciar tambiÃ©n la categorÃ­a activa al primer paso visible del wizard.
  2. DespuÃ©s de limpiar, el foco debe volver al inicio del formulario para dejar claro que el flujo empezÃ³ de nuevo.
  3. No conservar el paso activo anterior cuando el formulario ya fue reseteado.

## Protocolo reutilizable para nuevos mÃ³dulos

1. Discovery breve
- Identificar estado actual y componentes reales.
- Confirmar restricciones de rol/setup/rutas.

2. DefiniciÃ³n UI antes de tocar lÃ³gica
- Decidir vista predeterminada.
- Definir acciones contextuales (topbar o secciÃ³n).
- Definir regla "una vista activa".

3. ImplementaciÃ³n en orden
- Estructura visual.
- Estados de apertura/cierre.
- Manejo de cambios pendientes (dirty-state + descarte/restauraciÃ³n).
- Pulido responsive (desktop y mÃ³vil).
- Ajustes de copy y jerarquÃ­a visual.

4. ValidaciÃ³n mÃ­nima obligatoria
- `npx eslint <archivos_modificados>`
- `npm run build`
- `npx -y react-doctor@latest . --verbose --diff`

5. Cierre
- Confirmar alineaciones finales pedidas por el owner.
- Evitar introducir texto extra no solicitado.
- Entregar cambios con ruta exacta de archivos.

## Checklist rÃ¡pido previo a entregar

- [ ] Solo un formulario/panel visible.
- [ ] Botones principales dentro del primer viewport.
- [ ] Sin bloques informativos que estorben flujo.
- [ ] Uso cÃ³modo en telÃ©fono (scroll controlado).
- [ ] Mensajes importantes cortos y accionables.
- [ ] Botones Guardar solo visibles con cambios pendientes.
- [ ] Cierre de panel no conserva cambios sin confirmaciÃ³n.
- [ ] OrtografÃ­a de labels validada en UI final.
- [ ] Barrido final de tildes y letra Ã± ejecutado en textos visibles.
- [ ] LÃ­mites de longitud validados en UI y en lÃ³gica.
- [ ] `Clave` y `orden` no expuestos como input editable.
- [ ] MÃ©tricas nuevas con `categoria` en `select` y sin exponer dependencias tÃ©cnicas.
- [ ] MÃ©tricas base protegidas contra ediciÃ³n estructural y eliminaciÃ³n.
- [ ] `habilitado=false` fuerza `obligatorio=false`.
- [ ] `Agregar` en tablas largas aplica foco y scroll al nuevo input.
- [ ] Si el usuario vuelve al estado inicial, `Guardar` desaparece.
- [ ] Reglas de alto impacto con destacado visual.
- [ ] No duplicar mensajes globales (toast + `alert-danger`) en el mismo evento.
- [ ] Verificar propagaciÃ³n de setup en mÃ³dulos operativos (cultos, mÃ©tricas, procedencias).
- [ ] En esquema legacy, confirmar que la categorÃ­a de mÃ©tricas nuevas persiste correctamente.
- [ ] CategorÃ­as automÃ¡ticas (`procedencia`, `visitas`) no disponibles para mÃ©tricas nuevas y visibles bloqueadas cuando las genera el sistema.
- [ ] En visitas, validar coincidencia entre cantidad y nombres separados por coma.
- [ ] En topbar de administrador, botÃ³n activo resaltado segÃºn panel abierto.
- [ ] En resumen/notas, links directos funcionales para abrir paneles relacionados.
- [ ] Funciones exclusivas de ADMIN centralizadas en topbar/paneles de `/administrador`.
- [ ] Paneles complejos (ej. usuarios) con subopciones internas por tarea.
- [ ] Archivos UI guardados en UTF-8 y sin patrones mojibake (`MÃƒ`, `Ãƒ`, `Ã‚`).
- [ ] Estado de setup validado con normalizaciÃ³n booleana consistente (`bloqueada_operacion`).
- [ ] Mensajes de error/notificaciÃ³n en lenguaje de usuario final (sin claves tÃ©cnicas).
- [ ] Formularios dinÃ¡micos extensos muestran una sola categorÃ­a/paso visible por vez.
- [ ] El wizard valida el paso completo con reglas reales, no solo con campos tocados.
- [ ] Errores lÃ³gicos inmediatos usan toast `advertencia` + borde de campo, sin `invalid-feedback` invasivo.
- [ ] Ninguna categorÃ­a muestra errores prestados de otra categorÃ­a.
- [ ] El scroll interno no atrapa calendarios, popovers ni dropdowns.
- [ ] Inputs numÃ©ricos cortos usan ancho compacto y no dominan el layout mÃ³vil.
- [ ] En `Visitas`, cantidad y nombres se renderizan como pareja visual por procedencia.
- [ ] Cada nombre en `Nombres de visitas` respeta lÃ­mite de 20 caracteres separado por coma.
- [ ] Lint/build/react-doctor ejecutados.
- [ ] En paneles embebidos, no repetir tÃ­tulos internos si la topbar o la navegaciÃ³n ya da el contexto.
- [ ] No usar `alert-secondary` o bloques de ayuda grises cuando solo agregan altura y repiten lo visible.
- [ ] Botones principales de formulario deben quedar alineados con el bloque funcional que controlan (`rol`, `estado`, `cupo`, etc.), no aislados al fondo por costumbre.
- [ ] En mÃ³vil/tablet, compactar antes de apilar: primero ordenar, luego decidir si un botÃ³n debe ocupar ancho completo.
- [ ] Si una pantalla funciona pero sigue consumiendo mÃ¡s altura de la necesaria, todavÃ­a requiere ajuste de diseÃ±o.
- [ ] Listas configurables con tope de negocio (`cultos`, `procedencias`, metricas adicionales) deben bloquear alta extra en UI y validar el mismo maximo en backend.
- [ ] En formularios de usuario, toda contraseÃ±a nueva o editada debe pedirse dos veces y validarse antes de enviar.
- [ ] Si se corrige texto visible en un modulo tocado, revisar tambien mensajes asociados del mismo flujo para evitar mojibake parcial.
- [ ] En responsive mÃ³vil, los botones secundarios y de navegaciÃ³n deben priorizar iconos consistentes para reducir peso visual.
- [ ] La misma acciÃ³n debe conservar el mismo icono en mÃ³dulos distintos (`agregar`, `limpiar`, `guardar`, `cerrar`, etc.).
- [ ] Si hay varias tarjetas-resumen, preferir carrusel o agrupaciÃ³n antes que obligar a scroll vertical largo.
- [ ] En tablas administrativas responsivas, cada columna debe ocupar solo el ancho que necesita; no reutilizar anchos genericos que obliguen scroll horizontal innecesario.
- [ ] En `Cultos` y `Procedencias`, el nombre debe tener tope de caracteres y el input no debe dominar la tabla en movil.
- [ ] En paneles informativos con muchas tarjetas, mostrar solo 2 por vista usando carrusel automatico liviano (8s) y swipe manual opcional.
- [ ] Si una navegacion interna consume altura util en movil, moverla al header del panel antes de abrir mas scroll vertical.
- [ ] Si un panel no requiere scroll y sobra mucha altura, evaluar centrado vertical medido del contenido para compensar el espacio vacio inferior.
- [ ] En layouts compartidos para pantallas grandes o ultraanchas, evitar topes fijos que separen el contenido del sidebar o dejen huecos muertos a la derecha.
- [ ] Si un input tiene tope de negocio corto, su columna visible debe reflejarlo; no dejar campos de `Nombre` tan anchos que oculten `Acciones` en mÃ³vil.
- [ ] `Cultos`: nombre mÃ¡ximo 25 caracteres y columna compacta para no empujar la tabla hacia scroll horizontal innecesario.
- [ ] `Procedencias`: nombre mÃ¡ximo 25 caracteres y columna compacta; `Activo` debe verse centrado con el ancho justo del check.
- [ ] `MÃ©tricas`: `Etiqueta` mÃ¡xima 40 caracteres en UI y lÃ³gica; la columna `CategorÃ­a` debe ser mÃ¡s corta porque ninguna opciÃ³n justifica un ancho exagerado.
- [ ] Tablas de administraciÃ³n con listados crecientes (`Usuarios`, etc.) deben tener altura fija con scroll interno; no dejar que empujen toda la pantalla hacia abajo.
- [ ] En formularios como `Usuarios`, el select principal y las acciones deben alinearse visualmente en escritorio y en mÃ³vil no debe quedar un hueco grande entre metadatos y botones.
- [ ] En mÃ³vil, si una acciÃ³n ya se entiende por icono (`Crear`, `Limpiar`, tabs internas), no volver a forzar labels visibles en formularios compactos porque reabre huecos y saltos de lÃ­nea innecesarios.
- [ ] En headers de panel con tÃ­tulo + tabs/botones, evitar wraps torcidos: primero alinear la franja completa y luego decidir si una acciÃ³n baja de lÃ­nea.

- [ ] Patron correcto para tablas moviles con doble scroll: wrapper externo con overflow-x:auto y wrapper interno con overflow-y:auto; no usar un solo contenedor con ambos ejes activos.
- [ ] Si una tabla movil necesita scroll horizontal real, en breakpoint pequeno la tabla debe poder crecer (width:max-content + min-width util); width:100% en movil puede cancelar el desborde lateral aunque exista min-width.
- [ ] No usar touch-action restrictivo en wrappers de tablas moviles si bloquea el gesto lateral; primero validar que el usuario pueda desplazar realmente a la derecha e izquierda.
- [ ] En tablas de administracion moviles, los headers abreviados deben ser cortos y claros (Nombre, Expira, Activo, Acciones) para ganar legibilidad sin perder contexto.
- [ ] En Usuarios del sistema, las acciones de tabla deben usar iconos en movil y mantener el mismo patron visual que las otras tablas administrativas.
- [ ] Si el setup inicial sigue pendiente y la vista ya muestra Pendientes por completar, no duplicar ese estado con tarjetas-resumen o carruseles que todavia no aportan valor.
- [ ] Si un carrusel debe sentirse circular en swipe manual, no resolver el wrap solo con modulo; usar clones y salto silencioso para conservar la misma direccion visual al pasar del ultimo al primero.
- [ ] Si dos campos comparten fila en movil y sus labels pueden partirse en distinta cantidad de lineas, reservar una altura comun para esas etiquetas antes de renderizar los inputs.
- [ ] En tablas de registros, no mantener una columna-resumen larga si solo repite detalle; si consume ancho util, mover el detalle a modal y dejar la tabla con datos base + acciones.
- [ ] En modales de detalle de registro, no mostrar guiones para datos opcionales no capturados; solo renderizar campos que realmente fueron registrados.
- [ ] Si existe exportación global y exportación por fila, la global debe vivir en la barra de filtros y la individual dentro del modal de detalle, no como tercer botón que ensanche la tabla móvil.
- [ ] En móvil, los botones finales de formularios largos (`Guardar`, `Actualizar`, `Limpiar`, `Cancelar`) también deben pasar a icono-only; no dejar ese patrón solo en paneles administrativos.
- [ ] En modales/listados de registros, un valor `0` que no aporta información real no debe renderizarse como si fuera un dato útil; ocultarlo si no cambia la interpretación del registro.
- [ ] Al compactar una tabla, ajustar columnas problemáticas específicas; no estrechar la tabla completa si el problema real está en `Culto`, `Total`, `Categoría` o `Acciones`.
- [ ] En tablas de registros, fijar una altura útil corta desde el inicio; si la lista crece, el scroll debe empezar pronto y no después de empujar toda la página.
- [ ] Si Excel advierte que formato y extensión no coinciden, no insistir con `.xls` HTML; generar `.xlsx` real.
- [ ] En exportaciones, no duplicar datos derivados: si `Fecha` ya contiene el año, no agregar una fila `Año` aparte salvo que aporte algo distinto.
- [ ] En módulos densos como `Estadísticas`, no dejar tarjetas secundarias abiertas en la pantalla principal si pueden vivir mejor dentro de un modal de detalle.
- [ ] Si la tabla principal es lo más consultado del módulo, darle altura fija con scroll interno y quitar headers redundantes antes de agregar más bloques arriba.
- [ ] Si un módulo analítico necesita mostrar KPIs y filtros, los KPIs deben ir compactos en la franja superior del propio módulo antes de volver a abrir otra fila completa de tarjetas.
- [ ] En tarjetas como `Visitas del período`, fijar el scroll de tablas internas (`Top nombres`) antes de permitir que el modal crezca sin control.
- [ ] Si una tabla tiene scroll vertical interno, su header debe quedar sticky siempre; no depender de wrappers intermedios que rompan ese comportamiento.
- [ ] En KPIs compactos de móviles, no forzar `white-space: nowrap` si el chip puede estrecharse; la tipografía debe adaptarse al bloque antes que salirse o cortarse.
- [ ] Si un resumen superior usa chips pequeños, revisar `font-size`, `line-height` y wrapping real sobre el teléfono más estrecho antes de darlo por terminado.
- [ ] En `Comparaciones`, la vista principal debe priorizar filtros compactos, resumen breve del período y la tabla de indicadores; los resúmenes pesados y `Top nombres` deben vivir en modales separados.
- [ ] Si una tabla comparativa es la pieza central del módulo, quitar headers redundantes del card y darle altura fija con sticky header antes de aceptar más scroll de página.
- [ ] No duplicar una acción global si ya existe en una ubicación mejor resuelta; si `Cerrar sesión` ya vive en la esquina superior derecha, no repetirlo en el sidebar móvil sin una razón fuerte.
- [ ] En login móvil, evitar focos visuales agresivos que rompan la composición de la tarjeta; el foco puede resolverse con borde limpio sin halo pesado.
- [ ] En modales analíticos, el contenedor principal no debe quedar con `overflow:auto` en ambos ejes; usar `overflow-y:auto` y bloquear el eje X para evitar el efecto de arrastre diagonal.
- [ ] Si un item de historial ya está activo/seleccionado, no volverlo a dejar pulsable como si fuera una acción nueva; evitar clicks redundantes también mejora la señal visual.
- [ ] En tablas analíticas de móvil (`Estadísticas`, `Comparaciones`), copiar el patrón de `Administrador`: wrapper externo `table-responsive` para eje X, wrapper interno para eje Y y `thead` sticky.
- [ ] En ese patrón móvil, el contenedor interno debe usar `width: max-content` y `min-width: 100%`; `fit-content` puede dejar la tabla “bien” visualmente pero cancelar el scroll horizontal real.
- [ ] En modales analíticos, el botón de cerrar debe anclarse en la esquina superior derecha con tamaño compacto; no dejarlo ocupando espacio dentro del flujo normal del header.
- [ ] Si una tabla principal sigue viéndose demasiado baja en teléfono, ofrecer una acción contextual en topbar para abrirla completa en modal antes de seguir apretando alturas que ya son razonables.
- [ ] Si se restaura una acción duplicada como `Cerrar sesión`, hacerlo solo donde realmente aporta: escritorio sí, móvil no, si en móvil ya existe una ubicación mejor resuelta.
- [ ] Si una tabla principal pasa a mostrarse solo por botón/modal, ocultarla realmente de la vista nativa; no dejar la tabla renderizada y el botón al mismo tiempo porque se duplica el propósito.
